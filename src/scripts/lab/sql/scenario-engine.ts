export interface Scenario {
  id: string;
  name: string;
  explain: string;
  titleA: string;
  badgeA: string;
  codeA: string;
  titleB: string;
  badgeB: string;
  codeB: string;
  timeA: string;
  costA: string;
  rowsA: string;
  timeB: string;
  costB: string;
  rowsB: string;
  logStepsA: string[];
  logStepsB: string[];
}

export const SCENARIOS: Record<string, Scenario> = {
  index_vs_seq: {
    id: 'index_vs_seq',
    name: 'Seq Scan vs B-Tree Index',
    explain: 'Without an index Postgres reads every data block of users sequentially — O(N) — while a B-Tree walks Root → Branch → Leaf in 3–4 buffer hits, O(log N). Press run to watch the same statement run twice and cost 142.5 ms vs 0.08 ms.',
    titleA: 'No Index (Seq Scan)', badgeA: 'Sequential Scan',
    codeA: "-- Full scan of the users table (1M rows)\nEXPLAIN ANALYZE\nSELECT * FROM users\nWHERE email = 'dawn@dev.com';",
    titleB: 'With a B-Tree Index', badgeB: 'Index Scan (B-Tree)',
    codeB: "-- Create index, then query\nCREATE INDEX idx_users_email ON users(email);\n\nEXPLAIN ANALYZE\nSELECT * FROM users\nWHERE email = 'dawn@dev.com';",
    timeA: '142.5 ms', costA: '18450.00', rowsA: '1,000,000',
    timeB: '0.08 ms', costB: '4.28', rowsB: '1 row · 1780x faster',
    logStepsA: ['[A] Launching a Sequential Scan over "users"…', '[A] Reading block by block from disk — 250,000 rows scanned…', '[A] Pushing through shared buffers — 750,000 rows…', '[A] Scanned 1,000,000 rows, filtered down to 1 result. 142.5 ms.'],
    logStepsB: ['[B] Index Scan on "idx_users_email"…', '[B] Walking the B-Tree: Root → Branch → Leaf (3 buffer hits).', '[B] Tuple matched, done in 0.08 ms.'],
  },
  hibernate_n_plus_1: {
    id: 'hibernate_n_plus_1',
    name: 'Hibernate N+1 vs JOIN FETCH',
    explain: 'The classic ORM trap: lazy loading turns one query into 51 network roundtrips while the code looks innocent. JOIN FETCH / @EntityGraph collapses them into a single Hash Join roundtrip — 128x less network chatter for the same rows.',
    titleA: 'The N+1 Disaster', badgeA: '1 + N Queries',
    codeA: '// Lazy loading: 1 + 50 queries!\nList<Author> authors = authorRepo.findAll();\nfor (Author a : authors) {\n  System.out.println(a.getBooks().size()); // one query per loop\n}',
    titleB: 'JOIN FETCH', badgeB: 'Single Query',
    codeB: '// Fetch everything in one query\n@Query("SELECT a FROM Author a JOIN FETCH a.books")\nList<Author> findAllWithBooks();',
    timeA: '48.5 ms', costA: '1250.00', rowsA: '51 roundtrips',
    timeB: '0.90 ms', costB: '32.10', rowsB: '1 query · 54x faster',
    logStepsA: ['[A] Query 1/51: SELECT * FROM authors (50 authors)…', '[A] Query 2/51: books WHERE author_id = 1 (0.8 ms roundtrip)…', '[A] Query 3/51 … 51/51 — network latency ×50.', '[A] Total: 48.5 ms just to return 50 authors.'],
    logStepsB: ['[B] Query 1/1: JOIN authors × books…', '[B] The Hash Join returns every Author + Book row in one roundtrip.', '[B] Done in 0.90 ms.'],
  },
  hash_vs_nested: {
    id: 'hash_vs_nested',
    name: 'Hash Join vs Nested Loop',
    explain: 'Two ways to join: Nested Loop probes the inner table once per outer row (fine when sets are small), Hash Join builds an in-memory hash of the small side and streams the big one through it. Same data: 312.4 ms vs 14.2 ms.',
    titleA: 'Nested Loop on a large set', badgeA: 'Nested Loop',
    codeA: "EXPLAIN ANALYZE\nSELECT * FROM orders o\nJOIN order_items i ON o.id = i.order_id\nWHERE o.created_at >= '2026-01-01';",
    titleB: 'Hash Join', badgeB: 'In-Memory Hash',
    codeB: "SET enable_nestloop = off;\n\nEXPLAIN ANALYZE\nSELECT * FROM orders o\nJOIN order_items i ON o.id = i.order_id\nWHERE o.created_at >= '2026-01-01';",
    timeA: '312.4 ms', costA: '42100.00', rowsA: '500,000 loop iterations',
    timeB: '14.2 ms', costB: '3850.00', rowsB: 'hash match · 22x faster',
    logStepsA: ['[A] Nested Loop: looping over each order_id, scanning order_items…', '[A] 500,000 iterations, CPU-bound O(N×M)…', '[A] Finished: 312.4 ms.'],
    logStepsB: ['[B] Build Phase: hashing 10,000 orders into work_mem (2.1 ms)…', '[B] Probe Phase: scanning order_items, O(1) lookups against the hash table…', '[B] Done in 14.2 ms.'],
  },
  index_only: {
    id: 'index_only',
    name: 'Covering Index',
    explain: 'A Covering Index stores the SELECT/WHERE columns right on the index leaf, so the engine never falls back to the Table Heap (Heap Fetches: 0). Reach for INCLUDE when a hot query keeps coming back to the heap for one extra column.',
    titleA: 'Plain Index + Heap Fetch', badgeA: 'Index Scan + Heap',
    codeA: "-- 'status' not in the index → extra Table Heap read\nSELECT id, email, status FROM users\nWHERE email = 'dawn@dev.com';",
    titleB: 'Covering Index (INCLUDE)', badgeB: 'Index Only Scan',
    codeB: "-- Store the status column inside the index\nCREATE INDEX idx_users_cover\nON users(email) INCLUDE (status);\n\nSELECT id, email, status FROM users\nWHERE email = 'dawn@dev.com';",
    timeA: '1.25 ms', costA: '8.45', rowsA: '1 index + 1 heap fetch',
    timeB: '0.04 ms', costB: '1.42', rowsB: '0 heap fetch · 31x faster',
    logStepsA: ['[A] Reading B-Tree "idx_users_email" to find the email…', '[A] "status" is not in the index → extra Table Heap block read!', '[A] Finished: 1.25 ms.'],
    logStepsB: ['[B] Reading the Covering Index "idx_users_cover"…', '[B] Every column already sits on the B-Tree leaves.', '[B] Heap Fetches = 0. 0.04 ms.'],
  },
  join_anti: {
    id: 'join_anti',
    name: 'Anti-Join (NOT IN vs LEFT JOIN)',
    explain: 'The customers-without-orders question: NOT IN builds a 90,000-row id list and re-filters every row — and ONE NULL in orders.customer_id collapses the whole answer to zero rows (three-valued logic). LEFT JOIN + WHERE o.id IS NULL compiles to a dedicated Hash ANTI Join — a single probe pass, NULL-safe, cheap at any size.',
    titleA: 'NOT IN Subquery', badgeA: 'Three-Valued Trap',
    codeA: "-- The obvious shape — NOT IN with three-valued logic\nEXPLAIN ANALYZE\nSELECT c.name FROM customers c\nWHERE c.id NOT IN (SELECT o.customer_id FROM orders o);\n-- ONE NULL in orders.customer_id -> result: 0 rows, silently",
    titleB: 'LEFT JOIN + IS NULL', badgeB: 'Hash ANTI Join',
    codeB: "-- NULL-safe anti-join: the planner builds one hash table then probes\nEXPLAIN ANALYZE\nSELECT c.name FROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;",
    timeA: '96.2 ms', costA: '23410.55', rowsA: '0 rows · NULL trap',
    timeB: '11.4 ms', costB: '3120.10', rowsB: '12,400 · 8.4x faster',
    logStepsA: ['[A] Planning NOT IN (SELECT customer_id FROM orders)…', '[A] Materializing the subplan — 90,000 customer_ids hashed…', '[A] Filtering 1,000,000 customers against the id list, row by row…', '[A] One NULL slipped into orders → NOT IN yields 0 rows. 96.2 ms.'],
    logStepsB: ['[B] Hash LEFT JOIN customers ⇢ orders — build side: customers…', '[B] ANTI predicate: keep only rows WHERE o.id IS NULL…', '[B] Single hash probe pass — no per-row subquery, NULL-safe…', '[B] 12,400 customers with zero orders. 11.4 ms.'],
  },
  topn_window: {
    id: 'topn_window',
    name: 'Top-N per Group (Window)',
    explain: '"Latest order per customer": the correlated subquery fires once PER customer row — 100,000 executions plus an index probe each — while ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) sorts once and keeps rn = 1 in a single pass. One sort beats N executions, and rn also kills the tied rows the MAX() trick would duplicate.',
    titleA: 'Correlated Subquery', badgeA: '1 Exec per Row',
    codeA: "-- correlated scalar subquery — re-runs for every outer row\nEXPLAIN ANALYZE\nSELECT * FROM orders o\nWHERE o.created_at = (SELECT MAX(o2.created_at)\n                      FROM orders o2\n                      WHERE o2.customer_id = o.customer_id);",
    titleB: 'Window ROW_NUMBER', badgeB: 'Single Pass',
    codeB: "-- window: one sort, one filter, tie-proof\nWITH ranked AS (\n  SELECT *, ROW_NUMBER() OVER (\n    PARTITION BY customer_id\n    ORDER BY created_at DESC, id DESC\n  ) rn FROM orders)\nSELECT * FROM ranked WHERE rn = 1;",
    timeA: '312.8 ms', costA: '61240.22', rowsA: '100,000 sub-runs',
    timeB: '48.6 ms', costB: '18760.40', rowsB: '9,850 · 6.4x faster',
    logStepsA: ['[A] Correlated subquery resolved per row…', '[A] Customer 1: SELECT MAX(created_at)… Customer 2: again… repeat…', '[A] 100,000 customers → 100,000 sub-executions + an index probe each…', '[A] Done at 312.8 ms — a tie would even duplicate rows.'],
    logStepsB: ['[B] Window: one sort by (customer_id, created_at DESC, id DESC)…', '[B] Each PARTITION boundary restarts the row counter…', '[B] Filter rn = 1 → exactly one row per customer survives…', '[B] 9,850 latest orders in a single pass. 48.6 ms.'],
  },
  keyset_page: {
    id: 'keyset_page',
    name: 'OFFSET vs Keyset Pagination',
    explain: 'OFFSET 100000 walks and DISCARDS 100,000 tuples before page 5,001 can render — latency grows linearly with page depth. Keyset pagination resumes with WHERE (created_at, id) < (last_seen) and seeks straight into the index: page 9,000 costs exactly what page 1 costs, and rows shifting between requests no longer emit duplicate pages.',
    titleA: 'OFFSET Deep Page', badgeA: 'Walk & Discard',
    codeA: "-- deep page: the engine walks, then throws away\nEXPLAIN ANALYZE\nSELECT * FROM orders\nORDER BY created_at DESC\nLIMIT 20 OFFSET 100000;",
    titleB: 'Keyset Seek', badgeB: 'Resume Cursor',
    codeB: "-- keyset: seek to last_seen, discard nothing\nEXPLAIN ANALYZE\nSELECT * FROM orders\nWHERE (created_at, id) < ($1, $2)\nORDER BY created_at DESC, id DESC\nLIMIT 20;",
    timeA: '488.9 ms', costA: '88210.31', rowsA: '100,020 walked',
    timeB: '0.21 ms', costB: '4.62', rowsB: '20 rows · 2328x faster',
    logStepsA: ['[A] ORDER BY created_at DESC — full sort of 1,000,000 rows…', '[A] OFFSET 100000 → walking and DISCARDING 100,000 tuples…', '[A] 20 rows left after throwing away 100,000. 488.9 ms…', '[A] Robbing page 9,001 the same way costs even more.'],
    logStepsB: ['[B] Keyset: resume WHERE (created_at, id) < ($1, $2)…', '[B] Index seek lands DIRECTLY at the resume point…', '[B] 20 tuples read in index order — nothing discarded…', '[B] Page 9,000 costs the same as page 1. 0.21 ms.'],
  },
  composite_prefix: {
    id: 'composite_prefix',
    name: 'Composite Index Prefix',
    explain: 'A composite index is a phone book sorted by (status, created_at): the leading column rules. WHERE status = ? AND created_at > ? pins the prefix, then ranges inside it; WHERE created_at alone skips the first column — the tree is sorted by status, so no single contiguous created_at slice exists to seek, and the planner falls back to a full Seq Scan. Column order IS the design: equality first, range last.',
    titleA: 'Skipped Prefix', badgeA: 'Seq Scan',
    codeA: "-- index (status, created_at) exists… but this query\n-- never mentions the leading column\nEXPLAIN ANALYZE\nSELECT * FROM orders\nWHERE created_at > now() - interval '30 days';\n-- sorted by status -> no contiguous created_at slice -> Seq Scan",
    titleB: 'Full Prefix Use', badgeB: 'Index Scan',
    codeB: "-- equality pins column 1, the range stays inside it\nEXPLAIN ANALYZE\nSELECT * FROM orders\nWHERE status = 'paid'\n  AND created_at > now() - interval '30 days';\n-- (status, created_at): equality first, range last",
    timeA: '131.7 ms', costA: '20180.00', rowsA: '1,000,000 scanned',
    timeB: '2.9 ms', costB: '418.35', rowsB: '38,100 · 45x faster',
    logStepsA: ['[A] Predicates: created_at range only — no filter on status…', '[A] The index is sorted by status FIRST — created_at is scattered…', '[A] No leading boundary to seek → planner flips to Seq Scan…', '[A] 1,000,000 rows walked, 38,100 kept. 131.7 ms.'],
    logStepsB: ['[B] status = paid → B-Tree locates the paid slice instantly…', '[B] created_at range scans WITHIN that slice (leftmost prefix)…', '[B] Heap fetches only the 38,100 matching tuples…', '[B] 2.9 ms — equality first, range last, skip no column before the range.'],
  },
  execution_order: {
    id: 'execution_order',
    name: 'Giant Query — Execution Order',
    explain: 'One statement, 2 CTEs, 5 joins, correlated EXISTS, a window fn, CASE and UNION. SQL reads top → bottom, but the engine executes a fixed pipeline (1 → 17): press run to highlight phase by phase, then try the CASE routing panel below to see how branches swap the whole query shape.',
    titleA: 'Written order', badgeA: 'top → bottom',
    codeA: '// One giant statement — walk it in the dissection panel below.\n// The panel highlights each clause in true engine order (1 → 14).',
    titleB: 'Execution order', badgeB: 'engine pipeline',
    codeB: 'WITH (2 CTEs) → inner FROM/WHERE/GROUP BY → re-JOIN\n→ hash joins + CTE at reference → cached scalar → correlated EXISTS\n→ GROUP BY → HAVING → SELECT (CASE, COALESCE) → window fn\n→ UNION dedupe → ORDER BY → LIMIT',
    timeA: '—', costA: '—', rowsA: '5 tables · 2 inner queries',
    timeB: '—', costB: '—', rowsB: '17 pipeline phases · 5 joins · 2 CTEs',
    logStepsA: ['(walked in the dissection panel on the right)'],
    logStepsB: ['(walked in the dissection panel on the right)'],
  },
};

// Count-up animation for "142.5 ms"-style values
export function tween(el: HTMLElement | null, targetText: string, dur = 600): void {
  if (!el) return;
  if (el.textContent === targetText) return;
  const m = targetText.match(/[\d,.]+/);
  if (!m) { el.textContent = targetText; return; }
  const target = Number(m[0].replace(/,/g, ''));
  const dec = m[0].includes('.') ? m[0].split('.')[1].length : 0;
  const idx = m.index ?? 0;
  const prefix = targetText.slice(0, idx);
  const suffix = targetText.slice(idx + m[0].length);
  const t0 = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 2);
    el.textContent = dec
      ? prefix + (target * eased).toFixed(dec) + suffix
      : prefix + Math.round(target * eased).toLocaleString() + suffix;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function initScenarioEngine(): void {
  let currentScenario = SCENARIOS.index_vs_seq;
  let isSimulating = false;
  const $ = (id: string) => document.getElementById(id);

  let resumeStep: (() => void) | null = null;
  const nextBtn = $('sp-next');
  const stepMode = () => ($('sp-step-mode') as HTMLInputElement | null)?.checked ?? false;
  const stepDelay = () => Math.max(50, Number(($('sp-delay') as HTMLInputElement | null)?.value) || 420);
  const stepWait = () => {
    if (!nextBtn) return Promise.resolve();
    if (stepMode()) {
      nextBtn.classList.remove('hidden');
      return new Promise<void>((resolve) => { resumeStep = resolve; }).then(() => nextBtn.classList.add('hidden'));
    }
    return new Promise<void>((resolve) => setTimeout(resolve, stepDelay()));
  };
  const advanceStep = () => { resumeStep?.(); resumeStep = null; };
  nextBtn?.addEventListener('click', advanceStep);

  const renderScenario = (sc: Scenario) => {
    currentScenario = sc;
    const set = (id: string, v: string) => { const el = $(id); if (el) el.textContent = v; };
    set('title-strategy-a', sc.titleA);
    set('badge-strategy-a', sc.badgeA);
    set('title-strategy-b', sc.titleB);
    set('badge-strategy-b', sc.badgeB);
    set('code-strategy-a', sc.codeA);
    set('code-strategy-b', sc.codeB);
    $('sp-explain')?.replaceChildren(sc.explain ?? '');
    ['time-strategy-a', 'cost-strategy-a', 'rows-strategy-a', 'time-strategy-b', 'cost-strategy-b', 'rows-strategy-b'].forEach((id) => set(id, '—'));
    const badge = $('engine-status-badge');
    if (badge) { badge.textContent = 'STANDBY'; badge.className = 'rounded border border-cyan-500/50 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400'; }
    const stream = $('engine-log-stream');
    if (stream) stream.innerHTML = `<div class="text-(--fg-faint)">[Engine Log] Scenario "${sc.name}" loaded. Hit run…</div>`;
    const isEo = sc.id === 'execution_order';
    const abGrid = document.querySelector<HTMLElement>('[data-ab-grid]');
    const eoPanel = document.getElementById('eo-panel');
    if (abGrid) abGrid.hidden = isEo;
    if (eoPanel) eoPanel.hidden = !isEo;
    eoPanel?.querySelectorAll<HTMLElement>('.eo-cl, #eo-steps [data-eo-step]').forEach((el) => {
      el.classList.remove('eo-active', 'eo-done');
    });
  };

  const runSimulation = async () => {
    if (isSimulating) return;
    isSimulating = true;
    const badge = $('engine-status-badge');
    const stream = $('engine-log-stream');
    if (badge) { badge.textContent = 'EXECUTING…'; badge.className = 'rounded border border-amber-500 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 animate-pulse'; }
    if (stream) stream.innerHTML = '';
    const d = currentScenario;
    const appendLog = (line: string, ok = false) => {
      if (!stream) return;
      const div = document.createElement('div');
      div.className = ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
      div.textContent = line;
      stream.append(div);
      stream.scrollTop = stream.scrollHeight;
    };
    if (d.id === 'execution_order') {
      const steps = Array.from(document.querySelectorAll<HTMLElement>('#eo-steps [data-eo-step]'));
      const clauses = Array.from(document.querySelectorAll<HTMLElement>('#eo-sql [data-step]'));
      const paint = (current: number) => {
        clauses.forEach((cl) => { const at = Number(cl.dataset.step); cl.classList.toggle('eo-active', at === current); cl.classList.toggle('eo-done', at < current); });
        steps.forEach((li, index) => { li.classList.toggle('eo-active', index === current - 1); li.classList.toggle('eo-done', index < current - 1); });
      };
      paint(0);
      for (let i = 0; i < steps.length; i++) {
        const li = steps[i];
        paint(i + 1);
        const last = i === steps.length - 1;
        appendLog(`[EO] ${String(i + 1).padStart(2, '0')}/${steps.length} ${li.dataset.title} — ${li.dataset.rows}`, last);
        await stepWait();
      }
      appendLog('[EO] written order ≠ execution order — ORDER BY/LIMIT act on output, not source.', true);
      if (badge) { badge.textContent = 'DONE — pipeline walked ✓'; badge.className = 'rounded border border-emerald-500 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300'; }
      isSimulating = false;
      return;
    }
    appendLog('== PHASE 1: unoptimized ==');
    for (const line of d.logStepsA) { appendLog(line); await stepWait(); }
    tween($('time-strategy-a'), d.timeA); tween($('cost-strategy-a'), d.costA); tween($('rows-strategy-a'), d.rowsA);
    await stepWait();
    appendLog('== PHASE 2: optimized ==', true);
    for (const line of d.logStepsB) { appendLog(line, true); await stepWait(); }
    tween($('time-strategy-b'), d.timeB); tween($('cost-strategy-b'), d.costB); tween($('rows-strategy-b'), d.rowsB);
    if (badge) { badge.textContent = 'DONE — faster ✓'; badge.className = 'rounded border border-emerald-500 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300'; }
    isSimulating = false;
  };

  document.querySelectorAll<HTMLButtonElement>('.plan-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.planPreset;
      if (!id || !SCENARIOS[id]) return;
      document.querySelectorAll('.plan-btn').forEach((b) => { b.className = 'plan-btn cursor-pointer rounded-lg border border-(--border) bg-(--bg) px-3 py-1.5 font-semibold text-(--fg-dim) transition-colors hover:border-(--fg-dim) hover:text-(--fg)'; });
      btn.className = 'plan-btn cursor-pointer rounded-lg border border-(--fg) bg-(--fg) px-3 py-1.5 font-semibold text-(--bg)';
      renderScenario(SCENARIOS[id]);
    });
  });

  const pillBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('#case-pills [data-case-idx]'));
  const caseBlocks = Array.from(document.querySelectorAll<HTMLElement>('[data-case-idx]')).filter((el) => !el.closest('#case-pills'));
  pillBtns.forEach((pill) => {
    pill.addEventListener('click', () => {
      const idx = Number(pill.dataset.caseIdx);
      pillBtns.forEach((btn) => {
        const on = btn === pill;
        btn.className = `cursor-pointer rounded-full border px-3 py-1 text-[11px] transition-colors ${on ? 'border-amber-400 bg-amber-500/20 text-amber-800 dark:text-amber-200' : 'border-amber-500/40 text-(--fg-dim) hover:text-(--fg)'}`;
      });
      caseBlocks.forEach((block) => { block.hidden = Number(block.dataset.caseIdx) !== idx; });
    });
  });

  $('btn-simulate-run')?.addEventListener('click', runSimulation);
  $('btn-simulate-replay')?.addEventListener('click', () => { renderScenario(currentScenario); runSimulation(); });
  renderScenario(currentScenario);
}
