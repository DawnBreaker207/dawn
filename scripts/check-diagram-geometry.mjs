#!/usr/bin/env node
/**
 * Diagram geometry & framing checker (AGENTS.md §4, §5, §8).
 *
 * Complements scripts/audit-all-diagrams.mjs: instead of per-link hazards it measures, per
 * lesson and per step, how well the layout obeys the framing rules and what camera zoom the
 * engine really picks (it calls the engine's own planScene(), no browser needed).
 *
 *   node scripts/check-diagram-geometry.mjs                 every lesson
 *   node scripts/check-diagram-geometry.mjs caching,cap     selected lesson ids
 *   node scripts/check-diagram-geometry.mjs all 706x367     another stage size (default 834x547,
 *                                                           the canvas of a 1440x900 window)
 *
 * Columns (percentages are the share of steps that break the rule):
 *   bounds      a node outside x∈[-16,16], y∈[-24,20]           (§8.8)   — hard rule
 *   hard        a node beyond |x|>18 or y>22                     (§8.8)   — "forbidden"
 *   <90/<125    two nodes closer than 90 px (critical) / 125 px  (§4.1)
 *   <185        two nodes closer than 185 px                      (§8H.6)
 *   cramped     glyph + 2 text lines on a block with s<4 or h<46  (§4C)
 *   tbl48       2-line label + sub on a block below s4.8 / h54    (§4C)
 *   link>360    a link longer than 360 px between its two nodes   (§8H.10) — hard rule
 *   budget      node spread larger than Δx 18 × Δy 16             (§8F)   — aspirational
 *   zoom<1.2    camera zoom below the 1.2–1.5 target              (§8F)   — aspirational
 * Exit code 1 when a hard rule (bounds, hard, <90, cramped, tbl48, link>360) is broken.
 */
import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [idsArg = 'all', sizeArg = '834x547'] = process.argv.slice(2);
const [W, H] = sizeArg.split('x').map(Number);

async function bundle(rel) {
  const res = await esbuild.build({
    entryPoints: [path.join(root, rel)], bundle: true, write: false, format: 'cjs', platform: 'node',
    target: 'node18', loader: { '.ts': 'ts' }, alias: { '@': path.join(root, 'src') }, logLevel: 'silent',
  });
  const m = { exports: {} };
  // planScene() measures text through the DOM; stub just enough of it for node
  globalThis.getComputedStyle ??= () => ({ getPropertyValue: () => '' });
  globalThis.document ??= {
    documentElement: {},
    createElement: () => ({ getContext: () => ({ measureText: (t) => ({ width: String(t).length * 6.5 }), font: '' }), style: {} }),
  };
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(m, m.exports, () => ({}));
  return m.exports;
}

const layout = await bundle('src/lib/simulator/stage/layout.ts');
const scenes = (await bundle('src/data/scenes/index.ts')).ALL_SCENES;
const vp = { width: W, height: H, hudScale: 1, showCards: true };
const lessons = [...new Set(Object.values(scenes))].filter(
  (l) => l?.steps && (idsArg === 'all' || idsArg.split(',').includes(l.id)),
);

const NODE = new Set(['block', 'db', 'device']);
// Same list as audit-all-diagrams.mjs: dense cell strips by design, exempt from the <90 px check.
const DATA_STRUCTURE_SCENES = new Set(['indexes', 'storage-engines', 'unique-ids', 'sql-nosql', 'batch-stream', 'napkin-math']);
const screen = (e) => [14 * (e.x + e.y), 7 * (e.x - e.y)];
const textLines = (e) => (Array.isArray(e.label) ? e.label : e.label ? [e.label] : []).length;

const rows = [];
for (const lesson of lessons) {
  const c = { longLink: 0, bounds: 0, hard: 0, crit: 0, crowd: 0, lt185: 0, cramped: 0, tbl: 0, budget: 0, zoomLow: 0 };
  let zoomSum = 0, minD = Infinity, prev = null;
  for (const step of lesson.steps) {
    const nodes = Object.values(step.scene.entities || {}).filter((e) => e && NODE.has(e.type));
    if (nodes.some((e) => Math.abs(e.x) > 16 || e.y < -24 || e.y > 20)) c.bounds++;
    if (nodes.some((e) => Math.abs(e.x) > 18 || e.y > 22)) c.hard++;
    const xs = nodes.map((e) => e.x), ys = nodes.map((e) => e.y);
    if (Math.max(...xs) - Math.min(...xs) > 18 || Math.max(...ys) - Math.min(...ys) > 16) c.budget++;
    let crit = false, crowd = false, lt185 = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const [a, b] = [screen(nodes[i]), screen(nodes[j])];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        minD = Math.min(minD, d);
        if (d < 90) { if (!DATA_STRUCTURE_SCENES.has(lesson.id)) crit = true; else crowd = true; } else if (d < 125) crowd = true;
        if (d < 185) lt185 = true;
      }
    }
    if (crit) c.crit++; if (crowd) c.crowd++; if (lt185) c.lt185++;
    for (const e of nodes) {
      if (e.type !== 'block') continue;
      const s = e.s ?? 4, h = e.h ?? 46;
      if (textLines(e) + (e.sub ? 1 : 0) >= 2 && (s < 4 || h < 46)) c.cramped++;
      if (textLines(e) >= 2 && e.sub && (s < 4.8 || h < 54)) c.tbl++;
    }
    const byId = Object.fromEntries(Object.entries(step.scene.entities || {}).filter(([, e]) => e && e.x !== undefined));
    if (Object.values(step.scene.links || {}).some((l) => byId[l.from] && byId[l.to] && Math.hypot(...screen(byId[l.from]).map((v, i) => v - screen(byId[l.to])[i])) > 360)) c.longLink++;
    const plan = layout.planScene(step.scene, prev, vp);
    prev = plan;
    zoomSum += plan.zoom;
    if (plan.zoom < 1.2) c.zoomLow++;
  }
  rows.push({ id: lesson.id, n: lesson.steps.length, zoom: zoomSum / lesson.steps.length, minD: Math.round(minD), ...c });
}

const pct = (v, n, w = 5) => `${Math.round((100 * v) / n)}%`.padStart(w);
console.log(`stage ${W}x${H}  — ${rows.length} lessons`);
console.log('lesson'.padEnd(32), 'steps  zoom  bounds  hard  <90 <125  <185 cramped tbl48 link>360 budget zoom<1.2  minD');
let failed = 0;
for (const r of rows.sort((a, b) => a.zoom - b.zoom)) {
  const hardBroken = r.bounds || r.hard || r.crit || r.cramped || r.tbl || r.longLink;
  if (hardBroken) failed++;
  console.log(
    r.id.padEnd(32), String(r.n).padStart(4), ' ', r.zoom.toFixed(2),
    pct(r.bounds, r.n, 7), pct(r.hard, r.n), pct(r.crit, r.n, 5), pct(r.crowd, r.n), pct(r.lt185, r.n),
    pct(r.cramped, r.n, 7), pct(r.tbl, r.n, 6), pct(r.longLink, r.n, 8), pct(r.budget, r.n, 6), pct(r.zoomLow, r.n, 8),
    String(r.minD).padStart(6), hardBroken ? '  ✗' : '',
  );
}
const mean = rows.reduce((s, r) => s + r.zoom, 0) / Math.max(1, rows.length);
console.log(`\nmean zoom ${mean.toFixed(2)} · ${failed} lesson(s) break a hard rule`);
process.exit(failed ? 1 : 0);
