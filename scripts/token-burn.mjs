#!/usr/bin/env node
/**
 * Aggregate AI token usage into the private token-burn repo (Leo-style widget).
 *
 *   node scripts/token-burn.mjs             # scan + push summary.json
 *   node scripts/token-burn.mjs --dry-run   # print payload only, no push
 *   node scripts/token-burn.mjs --self-check
 *
 * Requires Node >= 24 (node:sqlite). Auth: GITHUB_TOKEN/TOKEN_BURN_GH_TOKEN,
 * falling back to the gh CLI login (scope repo).
 */
import { DatabaseSync } from 'node:sqlite';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtemp, copyFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import os from 'node:os';

const REPO = process.env.TOKEN_BURN_REPO ?? 'DawnBreaker207/token-burn';
const BRANCH = 'main';
const FILE = 'public/summary.json';
const HOUR_SQL = "+7 hours";

// ---- helpers ---------------------------------------------------------------

function getToken() {
  const fromEnv = process.env.TOKEN_BURN_GH_TOKEN || process.env.GITHUB_TOKEN;
  if (fromEnv) return fromEnv.trim();
  return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
}

function emptyDay() {
  return { tokens: 0, cost: 0, sessions: 0, messages: 0, byModel: {} };
}

function addTotals(cell, { tokens = 0, cost = 0, sessions = 0, messages = 0, model = null }) {
  cell.tokens += tokens;
  cell.cost += cost;
  cell.sessions += sessions;
  cell.messages += messages;
  if (model) {
    cell.byModel[model] ??= { tokens: 0, cost: 0 };
    cell.byModel[model].tokens += tokens;
    cell.byModel[model].cost += cost;
  }
}

function round4(v) {
  return Math.round(v * 10000) / 10000;
}

// ---- scans -----------------------------------------------------------------

async function openDbSnapshot(dbPath) {
  const dir = await mkdtemp(path.join(tmpdir(), 'tokburn-'));
  const snapshot = path.join(dir, 'opencode.db');
  for (const ext of ['', '-wal', '-shm']) {
    try {
      await copyFile(dbPath + ext, snapshot + ext);
    } catch { /* side files may not exist */ }
  }
  return new DatabaseSync(snapshot);
}

async function scanOpencode() {
  const dbPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'opencode.db');
  if (!existsSync(dbPath)) return { error: 'opencode.db not found' };

  let db;
  try {
    try {
      db = new DatabaseSync(dbPath, { readOnly: true });
    } catch {
      // locked mid-write: scan a byte snapshot of db + wal + shm instead
      db = await openDbSnapshot(dbPath);
    }

    const days = new Map();
    // Subagent child sessions carry their own burn (their model usage is NOT
    // duplicated in the parent row), so tokens/cost count every row while the
    // `sessions` stat counts roots only.
    for (const row of db.prepare(`
      SELECT CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END AS is_parent,
             model, cost,
             tokens_input + tokens_output + tokens_cache_read + tokens_cache_write AS tokens,
             datetime(time_updated / 1000, 'unixepoch', '${HOUR_SQL}') AS day
      FROM session_v2
    `).all()) {
      const day = row.day?.slice(0, 10);
      if (!day) continue;
      const cell = days.get(day) ?? emptyDay();
      let model = row.model;
      try {
        const parsed = JSON.parse(row.model);
        model = typeof parsed?.id === 'string' ? parsed.id : row.model;
      } catch { /* keep raw */ }
      addTotals(cell, {
        tokens: row.tokens ?? 0,
        cost: row.cost ?? 0,
        sessions: row.is_parent ? 1 : 0,
        model,
      });
      days.set(day, cell);
    }

    // User turns -> messages. The stored type name varies between opencode
    // versions, so probe once and match the one that looks like a prompt.
    const seenTypes = new Map();
    for (const row of db.prepare(
      `SELECT type, datetime(time_created / 1000, 'unixepoch', '${HOUR_SQL}') AS day
       FROM session_message`
    ).all()) {
      seenTypes.set(row.type, (seenTypes.get(row.type) ?? 0) + 1);
    }
    const promptType = [...seenTypes.keys()].find((t) => /user|prompt|human/i.test(t));
    if (promptType) {
      for (const row of db.prepare(
        `SELECT datetime(time_created / 1000, 'unixepoch', '${HOUR_SQL}') AS day
         FROM session_message WHERE type = ?`
      ).all(promptType)) {
        const day = row.day.slice(0, 10);
        const cell = days.get(day) ?? emptyDay();
        cell.messages += 1;
        days.set(day, cell);
      }
    }
    return { days };
  } finally {
    db?.close();
  }
}

// ccusage reads vendor-specific local transcripts and emits one JSON shape:
// { daily: [{ date|period, totalTokens, totalCost, modelBreakdowns }] }.
// `sub` selects the source ("antigravity daily" | "daily" for Claude Code).
function scanCcusage(sub, label) {
  const res = spawnSync(`npx -y ccusage@latest ${sub} --json`, {
    shell: true,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0) {
    return { error: `${label}: ccusage failed (exit ${res.status}): ${(res.stderr ?? '').slice(-200)}` };
  }
  const start = res.stdout.indexOf('{');
  const data = JSON.parse(res.stdout.slice(start));
  const days = new Map();
  for (const row of data.daily ?? []) {
    const cell = emptyDay();
    for (const m of row.modelBreakdowns ?? []) {
      addTotals(cell, {
        tokens: (m.inputTokens ?? 0) + (m.outputTokens ?? 0) +
          (m.cacheReadTokens ?? 0) + (m.cacheCreationTokens ?? 0),
        cost: m.cost ?? 0,
        model: m.modelName,
      });
    }
    if (cell.tokens === 0 && (row.totalTokens ?? 0) > 0) {
      addTotals(cell, { tokens: row.totalTokens, cost: row.totalCost ?? 0 });
    }
    days.set((row.date ?? row.period)?.slice(0, 10), cell);
  }
  return { days };
}

// ---- merge (pure, self-checked) ---------------------------------------------

/**
 * Per-date, per-source slots: each scan owns its slot for a date (so rerunning
 * never double-counts), and a date's row sums every source slot. Dates outside
 * all scans keep their published rows, so wiping local logs never erases data.
 */
export function mergeSummary(existing, scans, machine, nowIso) {
  const base = existing ?? {};
  const slots = new Map(); // date -> cells[] indexed by scan position
  scans.forEach((scan, index) => {
    if (scan.error) return;
    for (const [date, cell] of scan.days) {
      if (!date) continue;
      const daySlots = slots.get(date) ?? [];
      daySlots[index] = cell;
      slots.set(date, daySlots);
    }
  });

  const daily = new Map((base.daily ?? []).map((row) => [row.date, row]));
  for (const [date, daySlots] of slots) {
    const merged = emptyDay();
    for (const cell of daySlots) {
      if (!cell) continue;
      merged.tokens += cell.tokens ?? 0;
      merged.cost += cell.cost ?? 0;
      merged.sessions += cell.sessions ?? 0;
      merged.messages += cell.messages ?? 0;
      for (const [model, slice] of Object.entries(cell.byModel ?? {})) {
        merged.byModel[model] ??= { tokens: 0, cost: 0 };
        merged.byModel[model].tokens += slice.tokens ?? 0;
        merged.byModel[model].cost += slice.cost ?? 0;
      }
    }
    daily.set(date, {
      date,
      tokens: merged.tokens,
      cost: round4(merged.cost),
      sessions: merged.sessions,
      messages: merged.messages,
      byModel: merged.byModel,
    });
  }
  const rows = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
  const allTime = emptyDay();
  const byModel = {};
  for (const row of rows) {
    allTime.tokens += row.tokens ?? 0;
    allTime.cost += row.cost ?? 0;
    allTime.sessions += row.sessions ?? 0;
    allTime.messages += row.messages ?? 0;
    for (const [model, slice] of Object.entries(row.byModel ?? {})) {
      byModel[model] ??= { tokens: 0, cost: 0 };
      byModel[model].tokens += slice.tokens ?? 0;
      byModel[model].cost += slice.cost ?? 0;
    }
  }

  return {
    allTime: {
      tokens: allTime.tokens,
      cost: round4(allTime.cost),
      sessions: allTime.sessions,
      messages: allTime.messages,
    },
    byModel,
    daily: rows,
    machines: [...new Set([...(base.machines ?? []), machine])].sort(),
    lastActivity: [base.lastActivity ?? '', nowIso].filter(Boolean).sort().at(-1),
  };
}

// ---- self-check -------------------------------------------------------------

function assert(cond, label) {
  if (!cond) {
    console.error(`self-check FAILED: ${label}`);
    process.exit(1);
  }
  console.log(`ok - ${label}`);
}

function selfCheck() {
  const existing = {
    allTime: { tokens: 19, cost: 2, sessions: 2, messages: 6 },
    byModel: { 'old-model': { tokens: 19, cost: 2 } },
    daily: [
      { date: '2026-10-01', tokens: 10, cost: 1, sessions: 1, messages: 2, byModel: { 'old-model': { tokens: 10, cost: 1 } } },
      { date: '2026-10-02', tokens: 9, cost: 1, sessions: 1, messages: 4, byModel: { 'old-model': { tokens: 9, cost: 1 } } },
    ],
    machines: ['old-pc'],
    lastActivity: '2026-10-01T00:00:00.000Z',
  };
  // Two sources cover the same date: their cells must ADD UP, not overwrite.
  const opencodeScan = { days: new Map([['2026-10-01', { tokens: 5, cost: 0.5, sessions: 2, messages: 3, byModel: { 'muse-model': { tokens: 5, cost: 0.5 } } }]]) };
  const agyScan = { days: new Map([['2026-10-01', { tokens: 7, cost: 0.25, sessions: 0, messages: 0, byModel: { 'agy-model': { tokens: 7, cost: 0.25 } } }]]) };
  const merged = mergeSummary(existing, [opencodeScan, agyScan], 'this-pc', '2026-10-03T00:00:00.000Z');
  assert(merged.daily.length === 2, 'scanned date replaced, unscanned date kept');
  assert(merged.daily[0].tokens === 12 && merged.daily[0].sessions === 2, 'sources add up across scans');
  assert(merged.allTime.tokens === 12 + 9, 'allTime recomputed over merged days');
  assert(merged.byModel['muse-model'].tokens === 5 && merged.byModel['agy-model'].tokens === 7 && merged.byModel['old-model'].tokens === 9, 'byModel rebuilt per date + kept unscanned');
  assert(merged.machines.join(',') === 'old-pc,this-pc', 'machines merged');
  assert(merged.lastActivity === '2026-10-03T00:00:00.000Z', 'lastActivity moves forward');
  // rerun with identical scans -> identical numbers (idempotent, no double count)
  const rerun = mergeSummary(merged, [opencodeScan, agyScan], 'this-pc', '2026-10-04T00:00:00.000Z');
  assert(rerun.daily[0].tokens === 12, 'rerunning is idempotent');
  // unscanned history survives
  const kept = mergeSummary(existing, [], 'this-pc', '2026-10-03T00:00:00.000Z');
  assert(kept.daily[0]?.tokens === 10 && kept.daily[1]?.tokens === 9, 'unscanned history kept');
}

// ---- github contents api ------------------------------------------------------

function contentsUrl() {
  return `https://api.github.com/repos/${REPO}/contents/${FILE}?ref=${BRANCH}`;
}

async function getRemoteSummary(token) {
  const res = await fetch(contentsUrl(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (res.status === 404) return { summary: null, sha: null };
  if (!res.ok) throw new Error(`GET ${FILE} failed: HTTP ${res.status}`);
  const meta = await res.json();
  return {
    summary: JSON.parse(Buffer.from(meta.content, 'base64').toString('utf8')),
    sha: meta.sha,
  };
}

async function putRemoteSummary(token, summary, sha) {
  const res = await fetch(contentsUrl(), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      message: `token-burn: aggregate through ${summary.daily.at(-1)?.date ?? 'unknown'}`,
      content: Buffer.from(JSON.stringify(summary, null, 2), 'utf8').toString('base64'),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`PUT ${FILE} failed: HTTP ${res.status}: ${JSON.stringify(await res.json()).slice(0, 300)}`);
  }
}

// ---- main ---------------------------------------------------------------------

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  selfCheck();

  // Each source owns a slot per date; remove a source here ONLY if its logs
  // are gone for good (its dates would be re-summed without it).
  const scans = [
    await scanOpencode(),
    scanCcusage('antigravity daily', 'antigravity'),
    scanCcusage('daily', 'claude code'),
  ];
  const scanned = scans.filter((s) => !s.error);
  for (const s of scans) if (s.error) console.warn(`warn: ${s.error}`);
  if (scanned.length === 0) {
    console.error('error: no data sources available');
    process.exit(1);
  }
  if (scanned.length !== scans.length && !dryRun) {
    // A missing source would silently drop that source's history from its
    // dates — fail loudly instead; the nightly task retries tomorrow.
    console.error('error: a scan failed — not pushing to avoid dropping data');
    process.exit(1);
  }

  const summary = mergeSummary(
    dryRun ? null : (await getRemoteSummary(getToken())).summary,
    scans,
    os.hostname(),
    new Date().toISOString(),
  );

  const total = summary.daily.reduce((sum, d) => sum + (d.tokens ?? 0), 0);
  const cost = summary.daily.reduce((sum, d) => sum + (d.cost ?? 0), 0);
  console.log(
    `${summary.daily.length} days · ${total.toLocaleString()} tokens · ~$${cost.toFixed(2)} · machines ${summary.machines.join(', ')}`,
  );

  if (dryRun) {
    console.log('--dry-run: wrote token-burn.dry-run.json');
    await writeFile('token-burn.dry-run.json', JSON.stringify(summary, null, 2), 'utf8');
    return;
  }

  const token = getToken();
  const remote = await getRemoteSummary(token);
  await putRemoteSummary(token, summary, remote.sha);
  console.log(`pushed summary.json to ${REPO}`);
}

main().catch((error) => {
  console.error('error:', error.message);
  process.exit(1);
});
