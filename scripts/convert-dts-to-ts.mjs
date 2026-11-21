#!/usr/bin/env node
/**
 * Converts split DTS JS files to TypeScript in src/lib/dts/.
 * Generates: icons.ts and lessons.ts
 *
 * Run: node scripts/convert-dts-to-ts.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcJs = join(root, 'public', 'dts', 'src', 'js');
const outDir = join(root, 'src', 'lib', 'dts');

mkdirSync(outDir, { recursive: true });

// ── icons.ts ──────────────────────────────────────────────────────────────────

function convertIcons() {
  const raw = readFileSync(join(srcJs, 'icons.js'), 'utf8');
  // icons.js starts with `n = {` — wrap as named export
  const content = raw.trimEnd();
  // Replace the assignment `n = {` → `export const ICON_PATHS: Record<string, [string, Record<string, string>][]> = {`
  const ts = `// @ts-nocheck\n/* eslint-disable */\nexport const ICON_PATHS: Record<string, [string, Record<string, string>][]> = {\n` +
    content.slice(content.indexOf('{') + 1);
  writeFileSync(join(outDir, 'icons.ts'), ts, 'utf8');
  console.log('  icons.ts written');
}

// ── lessons.ts ────────────────────────────────────────────────────────────────

const LESSON_RENAMES = {
  ce: 'requestLifecycleLesson',
  he: 'latencyThroughputLesson',
  Ne: 'napkinMathLesson',
  He: 'verticalHorizontalLesson',
  Ze: 'loadBalancingLesson',
  ct: 'statelessLesson',
  _t: 'cachingLesson',
  kt: 'cdnLesson',
  zt: 'sqlNosqlLesson',
  en: 'indexesLesson',
  An: 'storageEnginesLesson',
  Vn: 'replicationLesson',
  $n: 'shardingLesson',
};

const LESSON_EXPORT_NAMES = new Set(Object.values(LESSON_RENAMES));

function convertLessons() {
  const raw = readFileSync(join(srcJs, 'lessons.js'), 'utf8');

  // lessons.js is a comma-separated var chain starting with `ce = {`
  // Format: ce = {...}\n  he = {...}\n  Ne = ...
  //
  // Strategy: split on the boundary pattern `,\n  ` where `,\n` ends one decl
  // and `  <varname> =` starts the next. We detect the split point as:
  //   comma at end of a line followed by newline + 2 spaces + 1-4 word chars + ` =`
  //
  // After splitting, each chunk is one variable declaration (without trailing comma).

  const lines = raw.split('\n');
  const declarations = [];
  let current = [];

  // Parse line-by-line: a new declaration starts when a line is exactly `  <var> = ` (2-space indent)
  // or for the very first one it starts at column 0 (`ce = {`).
  const TOP_LEVEL_VAR = /^[a-zA-Z_$][a-zA-Z_$0-9]* = /;
  const INDENTED_VAR = /^  [a-zA-Z_$][a-zA-Z_$0-9]* = /;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTopLevel = TOP_LEVEL_VAR.test(line);
    const isIndented = INDENTED_VAR.test(line);

    if (i === 0 && isTopLevel) {
      current.push(line);
      continue;
    }

    if (isIndented && current.length > 0) {
      // Check: previous line must end with `,` (the comma separator)
      // If so, the previous chunk is done — strip the trailing comma
      const last = current[current.length - 1];
      if (last.trimEnd().endsWith(',')) {
        current[current.length - 1] = last.trimEnd().slice(0, -1);
        declarations.push(current.join('\n'));
        current = [line];
        continue;
      }
    }

    current.push(line);
  }
  if (current.length > 0) declarations.push(current.join('\n'));

  // Build the TypeScript output
  const importAliases = `// @ts-nocheck\n/* eslint-disable */\nimport {
  makeBlock as d,
  makeBalancer as f,
  makeCrowd as p,
  makeGhost as m,
  makeLink as h,
  DEAD_STATE as g,
  makeHot as _,
  makeCool as v,
  makeDevice as y,
  makeDb as b,
  makeZone as x,
  makeQueue as ee,
  makePanel as S,
  makeUser as te,
  makeDns as ne,
  makeWebServer as re,
  makeDatabase as ie,
  URL_TAG as ae,
  LINK_TEMPLATES as C,
  CACHED_DNS_LINK as oe,
  TIMING_PANEL as se,
} from './scene-builders';
/* eslint-disable */
`;

  const tsDecls = declarations.map((decl) => {
    // Determine original var name: first token before ' = '
    const trimmed = decl.trimStart();
    const eqIdx = trimmed.indexOf(' = ');
    if (eqIdx === -1) return `const __unknown = ${decl.trim()};`;

    const varName = trimmed.slice(0, eqIdx);
    const rhs = trimmed.slice(eqIdx + 3); // after ' = '

    const exportedName = LESSON_RENAMES[varName] || varName;
    const isLesson = varName in LESSON_RENAMES;

    const prefix = isLesson ? `export const ${exportedName}` : `const ${varName}`;
    return `${prefix} = ${rhs};`;
  });

  const output = importAliases + tsDecls.join('\n\n') + '\n';
  writeFileSync(join(outDir, 'lessons.ts'), output, 'utf8');
  console.log(`  lessons.ts written (${declarations.length} declarations)`);
}

// ── runtime.ts split ─────────────────────────────────────────────────────────

function convertRuntime() {
  const raw = readFileSync(join(srcJs, 'runtime.js'), 'utf8');
  const lines = raw.split('\n');
  const total = lines.length;

  const header = `// @ts-nocheck\n/* eslint-disable */\n`;

  // ── runtime-draw.ts (lines 1–971) ────────────────────────────────
  // Core 2D SVG drawing + math primitives
  const drawEnd = 971;
  writeFileSync(
    join(outDir, 'runtime-draw.ts'),
    header + lines.slice(0, drawEnd).join('\n') + '\n',
    'utf8',
  );
  console.log(`  runtime-draw.ts (${drawEnd} lines)`);

  // ── runtime-app.ts (lines 14575–end) ─────────────────────────────
  // App UI: theme, language, speech, navigation, initialization
  const appStart = 14574;
  writeFileSync(
    join(outDir, 'runtime-app.ts'),
    header + lines.slice(appStart, total).join('\n') + '\n',
    'utf8',
  );
  console.log(`  runtime-app.ts (${total - appStart} lines)`);

  // ── runtime-data block → 9 files ────────────────────────────────
  // The var chain (runtime.js lines 972–14574) split by curriculum module.
  // Start indices below are 1-based within the data block
  // (block[0] = runtime.js line 972, so block index = startLine - 1).
  const dataBlockLines = lines.slice(971, 14574); // 0-indexed in runtime.js

  const DATA_SECTIONS = [
    // [outputFile, blockStart1based, description]
    ['runtime-grid.ts',                    1, 'grid config + scene helper fns'],
    ['runtime-lessons-data.ts',           44, 'module 03: Data & Storage (consistent-hashing→files)'],
    ['runtime-lessons-communication.ts', 2925, 'module 04: Communication (apis→realtime)'],
    ['runtime-lessons-reliability.ts',   4546, 'module 05: Reliability (redundancy→observability)'],
    ['runtime-lessons-architecture.ts',  6214, 'module 06: Architecture (microservices→batch-stream)'],
    ['runtime-lessons-security.ts',      8343, 'module 07: Security (authentication→encryption)'],
    ['runtime-lessons-shipping.ts',      9819, 'module 08: Shipping (testing→cicd)'],
    ['runtime-lessons-design.ts',       10760, 'module 09: Whole Systems (hld-lld→design-chat)'],
    ['runtime-lessons-cloud.ts',        13085, 'module 10: Cloud Architecture (aws-cloud)'],
  ];

  for (let si = 0; si < DATA_SECTIONS.length; si++) {
    const [filename, blockStart1, desc] = DATA_SECTIONS[si];
    const blockEnd1 = si + 1 < DATA_SECTIONS.length
      ? DATA_SECTIONS[si + 1][1]
      : dataBlockLines.length + 1;

    const sliceStart = blockStart1 - 1; // 0-indexed
    const sliceEnd = blockEnd1 - 1;     // exclusive, 0-indexed
    const sectionRaw = dataBlockLines.slice(sliceStart, sliceEnd).join('\n');

    let converted;
    if (blockStart1 === 1) {
      // First section starts with `var Ni = 10,` — standard convertVarChain
      converted = convertVarChain(sectionRaw, false);
    } else {
      // Mid-chain sections start with `  Xi = {` — wrap with a sentinel var so
      // convertVarChain sees a `var` keyword at the top, then strip the sentinel.
      const wrapped = `var __sentinel__ = null,\n` + sectionRaw;
      converted = convertVarChain(wrapped, false)
        .replace(/^const __sentinel__ = null;\n\n/, '');
    }

    const lineCount = sliceEnd - sliceStart;
    const content = `// ${desc}\n` + header + converted + '\n';
    writeFileSync(join(outDir, filename), content, 'utf8');
    console.log(`  ${filename} (~${lineCount} source lines)`);
  }
}

function convertVarChain(raw, addExports = true) {
  // The var chain starts with `var Ni = 10,` - split into individual const declarations
  // Same approach as lessons.ts
  const lines = raw.split('\n');
  const declarations = [];
  let current = [];

  const TOP_LEVEL_VAR = /^var [a-zA-Z_$][a-zA-Z_$0-9]* = /;
  const INDENTED_VAR = /^  [a-zA-Z_$][a-zA-Z_$0-9]* = /;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (i === 0 && TOP_LEVEL_VAR.test(line)) {
      // Strip `var ` prefix, start first declaration
      current.push(line.replace(/^var /, ''));
      continue;
    }

    if (INDENTED_VAR.test(line) && current.length > 0) {
      const last = current[current.length - 1];
      if (last.trimEnd().endsWith(',')) {
        current[current.length - 1] = last.trimEnd().slice(0, -1);
        declarations.push(current.join('\n'));
        current = [line];
        continue;
      }
    }

    current.push(line);
  }
  if (current.length > 0) declarations.push(current.join('\n'));

  return declarations
    .map((decl) => {
      const trimmed = decl.trimStart();
      const eqIdx = trimmed.indexOf(' = ');
      if (eqIdx === -1) return decl;
      const varName = trimmed.slice(0, eqIdx);
      const rhs = trimmed.slice(eqIdx + 3);
      const prefix = addExports ? `export const ${varName}` : `const ${varName}`;
      return `${prefix} = ${rhs};`;
    })
    .join('\n\n');
}

console.log('Converting DTS JS → TypeScript...');
convertIcons();
convertLessons();
convertRuntime();
console.log('Done.');
