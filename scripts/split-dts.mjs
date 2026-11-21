/**
 * scripts/split-dts.mjs
 * Split the Vite-bundled DTS files back into logical source files.
 * Output: public/dts/src/css/ and public/dts/src/js/
 *
 * Usage: node scripts/split-dts.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { format } from 'prettier';
import path from 'path';

const CSS_BUNDLE = 'public/dts/assets/index-CxX-BAVx.css';
const JS_BUNDLE  = 'public/dts/assets/index-BeXJu_A0.js';
const OUT_CSS    = 'public/dts/src/css';
const OUT_JS     = 'public/dts/src/js';

mkdirSync(OUT_CSS, { recursive: true });
mkdirSync(OUT_JS,  { recursive: true });

// ─────────────────────────────────────────────────────────────
// CSS SPLIT
// ─────────────────────────────────────────────────────────────

const cssRaw = readFileSync(CSS_BUNDLE, 'utf8');

/**
 * Extract all @font-face blocks.
 */
function extractFontFaces(css) {
  const re = /@font-face\{[^}]+\}/g;
  return (css.match(re) || []).join('\n');
}

/**
 * Extract a :root or selector block by its opening selector string.
 * Works for both `:root{` and `:root[data-theme=dark]{`.
 */
function extractBlock(css, openSelector) {
  const start = css.indexOf(openSelector);
  if (start === -1) return '';
  let depth = 0, i = start;
  while (i < css.length) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') { depth--; if (depth === 0) return css.slice(start, i + 1); }
    i++;
  }
  return '';
}

/**
 * Extract CSS rules whose selector matches a predicate.
 * This is a simple extractor: it walks the top-level rules.
 */
function extractBySelectors(css, test) {
  const results = [];
  let i = 0;
  while (i < css.length) {
    // find next { that is not inside another block
    const brace = css.indexOf('{', i);
    if (brace === -1) break;

    // the selector is everything from i to brace
    const selector = css.slice(i, brace).trim();
    // find matching closing }
    let depth = 0, j = brace;
    while (j < css.length) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (depth === 0) break; }
      j++;
    }
    const rule = css.slice(i, j + 1);
    if (test(selector)) results.push(rule);
    i = j + 1;
  }
  return results.join('\n');
}

/**
 * Remove already-extracted sections from css string.
 */
function remove(css, ...pieces) {
  for (const p of pieces) if (p) css = css.replace(p, '');
  return css;
}

// 1. Fonts
const fonts = extractFontFaces(cssRaw);

// 2. Design tokens (light + dark)
const tokensLight = extractBlock(cssRaw, ':root{');
const tokensDark  = extractBlock(cssRaw, ':root[data-theme=dark]{');
const tokens = [tokensLight, tokensDark].filter(Boolean).join('\n');

// Strip what we have so far for easier subsequent extraction
let remaining = cssRaw;
// Remove @font-face blocks
remaining = remaining.replace(/@font-face\{[^}]+\}/g, '');
// Remove :root tokens
remaining = remove(remaining, tokensLight, tokensDark);

// 3. Reset / base
const resetSelectors = new Set(['*,:before,:after', 'html,body', 'body', 'button,input,output', 'button', 'ul,ol', 'h1,h2,p', '.i', '.btn-pop', '.card', '.eyebrow', '.muted-copy']);
const resetRules = extractBySelectors(remaining, s => resetSelectors.has(s.trim()));

// 4. Layout  (.window .topbar .body .brand .nav .search)
const layoutPrefixes = ['.window', '.topbar', '.body', '.brand', '.nav', '.search', ':root[data-lang-pending]'];
const layoutRules = extractBySelectors(remaining, s => layoutPrefixes.some(p => s.trim().startsWith(p)));

// 5. Sidebar / Course tree
const sidebarPrefixes = ['.sidebar', '.tree-root', '.course', '.mod', '.folder', '.lesson', '.soon', '.progress', '.bar', '.check'];
const sidebarRules = extractBySelectors(remaining, s => sidebarPrefixes.some(p => s.trim().startsWith(p)));

// 6. Stage
const stagePrefixes = ['.sheet', '.lesson-head', '.crumb', '.title', '.subtitle', '.tags', '.tag', '.stage', '.stage-svg', '.chip', '.tool', '.stage__', '.lg', '@keyframes fresh-in', '@keyframes value-in', '@keyframes chip-flash'];
const stageRules = extractBySelectors(remaining, s => stagePrefixes.some(p => s.trim().startsWith(p)));

// 7. Packets / Links / Animations
const packetPrefixes = ['.link', '.pkt', '.fx', '.spot', '.pulse', '.moved', '@keyframes fx', '@keyframes spot', '@keyframes pulse', '@keyframes moved', '@keyframes held'];
const packetRules = extractBySelectors(remaining, s => packetPrefixes.some(p => s.trim().startsWith(p)));

// 8. Timeline
const timelineRules = extractBySelectors(remaining, s => s.trim().startsWith('.timeline'));

// 9. Guide / Rail
const guidePrefixes = ['.rail', '.guide', '.speak', '.voice-menu', '.chapter', '.term', 'code', '.callout', '.changes', '.chg', '.compare', '.takeaways', '.goals', '.btn-ghost', '.btn-next', '@keyframes guide-', '@keyframes chip-in', '@media (prefers-reduced-motion'];
const guideRules = extractBySelectors(remaining, s => guidePrefixes.some(p => s.trim().startsWith(p)));

// 10. Search dialog
const searchRules = extractBySelectors(remaining, s => s.trim().startsWith('.sx'));

// 11. Widgets (toast, lang, credit, theme-btn)
const widgetPrefixes = ['.toast', '.lang', '.credit', '.theme-btn'];
const widgetRules = extractBySelectors(remaining, s => widgetPrefixes.some(p => s.trim().startsWith(p)));

// 12. Responsive (layout variants + media queries)
const responsiveRules = extractBySelectors(remaining, s => {
  const t = s.trim();
  return t.startsWith(':root:not([data-layout') || t.startsWith(':root[data-layout') || t.startsWith('@media') || t.startsWith(':root.is-drawer') || t.startsWith(':root.has-full') || t.startsWith('.stage.is-full') || t.startsWith('.timeline.is-tight') || t.startsWith('.brand__name');
});

// 13. RTL
const rtlRules = extractBySelectors(remaining, s => s.trim().startsWith(':root[dir=rtl]'));

// 14. Misc (view-transitions, .menu-btn, .drawer-*, etc.)
const miscRules = extractBySelectors(remaining, s => {
  const t = s.trim();
  return t.startsWith('::view-transition') || t.startsWith('.menu-btn') || t.startsWith('.drawer') || t.startsWith('.tool--') || t.startsWith('.guide__card') || t.startsWith('.sx__esc') || t.startsWith(':root.cards-inline');
});

// ── Write CSS files ──────────────────────────────────────────

async function writeCss(filename, content) {
  if (!content.trim()) { console.log(`  skip empty: ${filename}`); return; }
  const formatted = await format(content, { parser: 'css' });
  const out = path.join(OUT_CSS, filename);
  writeFileSync(out, formatted, 'utf8');
  const lines = formatted.split('\n').length;
  console.log(`  wrote ${filename} (${lines} lines)`);
}

const cssFiles = [
  ['_fonts.css',      fonts],
  ['_tokens.css',     tokens],
  ['_reset.css',      resetRules],
  ['_layout.css',     layoutRules],
  ['_sidebar.css',    sidebarRules],
  ['_stage.css',      stageRules],
  ['_packets.css',    packetRules],
  ['_timeline.css',   timelineRules],
  ['_guide.css',      guideRules],
  ['_search.css',     searchRules],
  ['_widgets.css',    widgetRules],
  ['_responsive.css', responsiveRules],
  ['_rtl.css',        rtlRules],
  ['_misc.css',       miscRules],
];

console.log('\n── CSS split ──────────────────────');
await Promise.all(cssFiles.map(([name, content]) => writeCss(name, content)));

// Write index.css that imports all partials
const indexCss = cssFiles
  .filter(([, c]) => c.trim())
  .map(([name]) => `@import "./${name}";`)
  .join('\n') + '\n';
writeFileSync(path.join(OUT_CSS, 'index.css'), indexCss, 'utf8');
console.log(`  wrote index.css`);

// ─────────────────────────────────────────────────────────────
// JS SPLIT
// ─────────────────────────────────────────────────────────────

const jsRaw = readFileSync(JS_BUNDLE, 'utf8');

/**
 * Find the byte position of the first occurrence of a pattern.
 */
function pos(str, pattern) {
  const i = str.indexOf(pattern);
  return i === -1 ? Infinity : i;
}

// Identify section boundaries in the minified JS by known patterns:
//
//  [0]  modulepreload polyfill  — starts at 0
//  [1]  icons object            — starts at "var e=e=>Object.entries"
//  [2]  folder svg builder      — starts at "var r=e=>`\n  <svg"
//  [3]  icon helpers (i, a)     — starts at "function i("
//  [4]  chapter labels          — starts at "var o={"  (setup/problem/solution...)
//  [5]  curriculum data         — starts at "var s=["
//  [6]  curriculum helpers      — starts at "c=s.flatMap"
//  [7]  scene builders          — starts at "var d=("  (block/balancer/crowd/ghost helpers)
//  [8]  lesson content          — starts at the first lesson definition
//  [9]  runtime (app UI)        — everything after the last lesson

// JS structure (from reading the actual bundle):
//
//  Line 1:
//   (function(){...})();                       ← modulepreload polyfill
//   var e=e=>Object.entries...                 ← attr/element helpers (e, t)
//   ,n={book:[[`path`,{d:...}]],...}           ← SVG icon path data (n)
//   ,r=e=>`\n  <svg class="folder ...          ← folder builder (r), template literal with newlines
//
//  Line 2 (continuation of template literal + rest):
//   ...`;\nfunction i(...){...}                ← icon HTML builder (i)
//   function a(...){...}                       ← icon canvas builder (a)
//   var o={setup:{...},...}                    ← chapter kind labels (o)
//   ,s=[{id:`foundations`,...}]                ← curriculum chapters array (s)
//   ,c=s.flatMap(...)                          ← lesson flat list (c)
//   ,l=e=>c.find(...)                          ← lesson lookup (l)
//   ,u=e=>c[...]                               ← next lesson (u)
//   ,d=(e,t,n={})=>({type:`block`...})         ← scene builder: block (d)
//   ... more scene builders ...
//   ,ce={id:`request-lifecycle`,...}           ← first lesson content (ce)
//   ... more lessons ...
//   ;                                          ← end of var statement
//   [runtime UI code]

const p_polyfill     = 0;
const p_iconHelpers  = jsRaw.indexOf('var e=e=>Object.entries');
const p_iconData     = jsRaw.indexOf(',n={book:');
const p_folderBuilder= jsRaw.indexOf(',r=e=>`');
const p_iconFn       = jsRaw.indexOf('`;function i(');     // after folder template closes
const p_chapters     = jsRaw.indexOf('var o={setup:');
const p_curriculum   = jsRaw.indexOf(',s=[{id:`foundations`');
const p_currHelpers  = jsRaw.indexOf(',c=s.flatMap');
const p_sceneBuilders= jsRaw.indexOf(',d=(e,t,n={');
const p_lessons      = jsRaw.indexOf(',ce={id:`request-lifecycle`');

// Runtime starts after all lesson objects close.
// All lesson content is in one big var statement that ends with `;`
// Find the semicolon that terminates the last lesson (after the last lesson object)
// Runtime starts after all lesson/data objects close.
// The big data var statement ends with ';function ' — the first function declaration
// after the data section marks the start of the rendering runtime.
// Search well past the lesson anchor (lessons end ~150k after p_lessons).
const p_runtime = (() => {
  const searchFrom = p_lessons + 130000; // skip past all lesson data (~160k mark)
  const i = jsRaw.indexOf(';function ', searchFrom);
  if (i !== -1) return i + 1; // start at 'function', skip the ';'
  // Fallback: first addEventListener after all data
  const j = jsRaw.indexOf('addEventListener', searchFrom);
  if (j !== -1) return j;
  return jsRaw.length;
})();

console.log('\n── JS anchors ─────────────────────');
console.log(`  polyfill:       0`);
console.log(`  iconHelpers:    ${p_iconHelpers}`);
console.log(`  iconData:       ${p_iconData}`);
console.log(`  folderBuilder:  ${p_folderBuilder}`);
console.log(`  iconFn:         ${p_iconFn}`);
console.log(`  chapters:       ${p_chapters}`);
console.log(`  curriculum:     ${p_curriculum}`);
console.log(`  currHelpers:    ${p_currHelpers}`);
console.log(`  sceneBuilders:  ${p_sceneBuilders}`);
console.log(`  lessons:        ${p_lessons}`);
console.log(`  runtime:        ${p_runtime}`);
console.log(`  total:          ${jsRaw.length}`);

/**
 * Make a JS fragment valid for prettier by stripping leading comma
 * and wrapping in a var declaration if needed.
 * Returns { wrapped, unwrap } where unwrap(str) removes the wrapper.
 */
function makeValid(content) {
  const trimmed = content.trim();
  // Leading comma fragment like `,n={...}` or `,r=e=>`...``
  if (trimmed.startsWith(',')) {
    // Strip leading comma, add `var _x =` prefix + `;`
    const inner = trimmed.slice(1).trimStart();
    // Detect: is it an assignment `name=expr` or just an expression?
    const assignMatch = inner.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
    if (assignMatch) {
      return {
        wrapped: `var ${inner};`,
        unwrap: (s) => s.replace(/^var /, '').replace(/;\s*$/, ''),
      };
    }
    return { wrapped: `var _x=${inner};`, unwrap: (s) => s.replace(/^var _x=/, '').replace(/;\s*$/, '') };
  }
  return { wrapped: trimmed, unwrap: (s) => s };
}

async function writeJs(filename, content) {
  if (!content || !content.trim()) { console.log(`  skip empty: ${filename}`); return; }
  let formatted;
  const { wrapped, unwrap } = makeValid(content);
  try {
    const result = await format(wrapped, { parser: 'babel', printWidth: 100, tabWidth: 2 });
    formatted = unwrap(result);
  } catch (e) {
    // Prettier failed — write the wrapped but unformatted content (at least valid JS)
    console.log(`  [warn] prettier failed on ${filename}: ${String(e.message || e).slice(0, 80)}`);
    formatted = wrapped;
  }
  const out = path.join(OUT_JS, filename);
  writeFileSync(out, formatted, 'utf8');
  const lines = formatted.split('\n').length;
  console.log(`  wrote ${filename} (${lines} lines)`);
}

console.log('\n── JS split ───────────────────────');

// 0. Polyfill
const polyfill = jsRaw.slice(0, p_iconHelpers);

// 1. Icon attr/element helpers (e, t functions) — tiny
const iconHelpers = jsRaw.slice(p_iconHelpers, p_iconData);

// 2. Icon SVG data (n object — the big one)
const iconData = jsRaw.slice(p_iconData, p_folderBuilder);

// 3. Folder SVG builder + icon HTML fns (r, i, a)
// goes from r=e=>` to just before "var o="
const svgBuilders = jsRaw.slice(p_folderBuilder, p_chapters > -1 ? p_chapters : p_curriculum);

// 4. Chapter labels + curriculum + helpers (o, s, c, l, u)
const curriculumData = jsRaw.slice(
  p_chapters > -1 ? p_chapters : p_curriculum,
  p_sceneBuilders > -1 ? p_sceneBuilders : p_lessons
);

// 5. Scene entity builder helpers (d, f, p, m, h, g, _, v, y, b, x, ee, S, te, ne, re, ie, ae, C, oe, se)
const sceneBuilders = p_sceneBuilders > -1 && p_lessons > p_sceneBuilders
  ? jsRaw.slice(p_sceneBuilders, p_lessons)
  : '';

// 6. Lesson step content (ce and all other lesson objects)
const lessonContent = jsRaw.slice(p_lessons, p_runtime);

// 7. Runtime (app UI framework code)
const runtime = jsRaw.slice(p_runtime);

await writeJs('polyfill.js',       polyfill);
await writeJs('icon-helpers.js',   iconHelpers);
await writeJs('icons.js',          iconData);
await writeJs('svg-builders.js',   svgBuilders);
await writeJs('curriculum.js',     curriculumData);
await writeJs('scene-builders.js', sceneBuilders);
await writeJs('lessons.js',        lessonContent);
await writeJs('runtime.js',        runtime);

// Write an index.js that documents the split
const indexJs = `// DTS source split — generated by scripts/split-dts.mjs
// These files are split from the Vite bundle for readability.
// To rebuild the bundle: node scripts/rebuild-dts-bundle.cjs
//
// Load order matches original bundle:
// 1. polyfill.js       — modulepreload polyfill
// 2. icon-helpers.js   — attr/element SVG helper functions (e, t)
// 3. icons.js          — SVG icon path data (n object)
// 4. svg-builders.js   — folder SVG builder + icon HTML fns (r, i, a)
// 5. curriculum.js     — chapter labels + lesson registry (o, s, c, l, u)
// 6. scene-builders.js — entity/link/zone builder helpers (d…S, te, ne, re, ie)
// 7. lessons.js        — lesson step content (ce and all lesson objects)
// 8. runtime.js        — app UI (framework runtime)
`;
writeFileSync(path.join(OUT_JS, 'index.js'), indexJs, 'utf8');
console.log(`  wrote index.js`);

console.log('\n✓ Done. Output in public/dts/src/\n');
