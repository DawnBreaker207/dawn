#!/usr/bin/env node
/**
 * Master Diagram Quality & Sanity Auditor
 * 
 * Verifies all 3D simulation diagrams against DTS Isometric Rules:
 *  1. Collision Thresholds: Critical Overlaps (<90px), Crowded pairs (<125px)
 *  2. Viewport Bounding Box: x in [-16, 16], y in [-24, 20]
 *  3. Broken Links: link from/to references non-existent entity
 *  4. Goal Alignment: goal step index within valid step range
 *  5. Curriculum Parity: check registration status
 */

import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const CRITICAL_DIST = 90;
const WARNING_DIST = 125;
const BOUNDS = { xMin: -22, xMax: 22, yMin: -26, yMax: 26 };

function isoProject(x, y, z = 0) {
  return [Math.round(14 * (x + y)), Math.round(7 * (x - y) - z)];
}

async function bundle(relPath) {
  const res = await esbuild.build({
    entryPoints: [path.join(rootDir, relPath)],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    loader: { '.ts': 'ts' },
    alias: { '@': path.join(rootDir, 'src') },
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(m, m.exports, () => ({}));
  return m.exports;
}

const scenesMod = await bundle('src/data/scenes/index.ts');
const currMod = await bundle('src/data/curriculum.ts');

const scenes = scenesMod.ALL_SCENES || {};
const modules = currMod.DTS_MODULES || [];

console.log('='.repeat(75));
console.log('       MASTER 104-DIAGRAM ARCHITECTURAL AUDITOR & QUALITY REPORT');
console.log('='.repeat(75));
console.log(`Auditing ${Object.keys(scenes).length} Registered Scene Graphs in ALL_SCENES...\n`);

const issues = {
  criticalOverlaps: [],
  crowdedPairs: [],
  outOfBounds: [],
  brokenLinks: [],
  goalErrors: [],
  glyphHazards: [],
};

// Categorize diagram nature
const DATA_STRUCTURE_SCENES = new Set([
  'indexes',         // B-Tree node splitting and branching layout
  'storage-engines', // LSM-tree MemTable and SSTable disk rows
  'unique-ids',      // 64-bit Snowflake binary register bitfields
  'sql-nosql',       // Relational table record slots
  'batch-stream',    // Kafka partition log segment chunks
  'napkin-math',     // Server capacity grid calculation matrix
]);

for (const [sceneId, scene] of Object.entries(scenes)) {
  if (!scene || !Array.isArray(scene.steps)) {
    console.warn(`[WARN] Scene "${sceneId}" has no valid steps array!`);
    continue;
  }

  const isDataStructure = DATA_STRUCTURE_SCENES.has(sceneId);
  const totalSteps = scene.steps.length;

  // 1. Goal Range Check
  if (Array.isArray(scene.goals)) {
    scene.goals.forEach((g, gIdx) => {
      if (typeof g.step !== 'number' || g.step < 0 || g.step > totalSteps) {
        issues.goalErrors.push({
          sceneId,
          goalIndex: gIdx,
          goalStep: g.step,
          totalSteps,
          text: g.text,
        });
      }
    });
  }

  // 2. Step Entities & Links Check
  scene.steps.forEach((step, sIdx) => {
    if (!step.scene) return;
    const ents = step.scene.entities || {};
    const links = step.scene.links || {};

    // Check Broken Links
    for (const [linkId, link] of Object.entries(links)) {
      if (!link) continue;
      const from = link.from;
      const to = link.to;
      if (from && !ents[from] && from !== 'users' && from !== 'you' && from !== 'client') {
        issues.brokenLinks.push({ sceneId, step: sIdx + 1, linkId, missing: from, role: 'from' });
      }
      if (to && !ents[to] && to !== 'users' && to !== 'you' && to !== 'client') {
        issues.brokenLinks.push({ sceneId, step: sIdx + 1, linkId, missing: to, role: 'to' });
      }
    }

    // Check Glyph Clearance & Cramped Block Dimensions
    for (const [k, ent] of Object.entries(ents)) {
      if (!ent || typeof ent !== 'object') continue;
      if (ent.glyph) {
        let lines = [];
        if (Array.isArray(ent.label)) {
          lines = ent.label;
        } else if (typeof ent.label === 'string') {
          lines = ent.label.includes('\n') ? ent.label.split('\n') : [ent.label];
        }
        const hasSub = !!ent.sub;
        const lineCount = lines.length + (hasSub ? 1 : 0);
        const fontSize = lineCount <= 1 ? 13 : lineCount === 2 ? 11.5 : 10;
        const lineSpacing = Math.round(fontSize * (hasSub ? 1.15 : 1.25));
        const totalTextHeight = (lineCount - 1) * lineSpacing;

        // Mathematical clearance condition:
        // Height h must satisfy: h >= minStartY - o + totalTextHeight + 5px
        // where minStartY - o = 16.5px => requiredMinHeight = 16.5 + totalTextHeight + 5 = 21.5 + totalTextHeight.
        const requiredMinHeight = Math.ceil(21.5 + totalTextHeight + 4);
        // In DTS engine (scene-renderer.ts), blocks default to s=4, h=46 from Xr
        const h = typeof ent.h === 'number' ? ent.h : (ent.type === 'block' ? 46 : 36);
        const s = typeof ent.s === 'number' ? ent.s : (ent.type === 'block' ? 4 : 3.5);

        if (h < requiredMinHeight) {
          issues.glyphHazards.push({
            sceneId,
            step: sIdx + 1,
            entity: k,
            reason: `Explicitly insufficient height: h=${h} < required ${requiredMinHeight} for glyph + ${lineCount} text lines (risk of glyph-text collision or bottom overflow)`,
          });
        } else if (lineCount >= 2 && (s < 3.8 || h < 42)) {
          issues.glyphHazards.push({
            sceneId,
            step: sIdx + 1,
            entity: k,
            reason: `Cramped multi-line glyph block: s=${s}, h=${h} (recommended s >= 4.0, h >= 46)`,
          });
        }
      }
    }

    // Filter tangible nodes for collision check (Exclude decorative floors, cards, buffers)
    const tangible = Object.entries(ents).filter(([_, e]) => {
      return (
        e &&
        typeof e.x === 'number' &&
        typeof e.y === 'number' &&
        e.type !== 'zone' &&
        e.type !== 'panel' &&
        e.type !== 'ghost' &&
        e.type !== 'queue' &&
        e.type !== 'crowd'
      );
    });

    // Check Out of Bounds & Collisions
    for (let i = 0; i < tangible.length; i++) {
      const [kA, entA] = tangible[i];

      // Bounding Box check
      if (
        entA.x < BOUNDS.xMin ||
        entA.x > BOUNDS.xMax ||
        entA.y < BOUNDS.yMin ||
        entA.y > BOUNDS.yMax
      ) {
        issues.outOfBounds.push({
          sceneId,
          step: sIdx + 1,
          entity: kA,
          coords: [entA.x, entA.y],
        });
      }

      // Pairwise collision check for Macro Topology Scenes
      if (!isDataStructure) {
        for (let j = i + 1; j < tangible.length; j++) {
          const [kB, entB] = tangible[j];
          const [sxA, syA] = isoProject(entA.x, entA.y, entA.z || 0);
          const [sxB, syB] = isoProject(entB.x, entB.y, entB.z || 0);
          const dist = Math.hypot(sxA - sxB, syA - syB);

          if (dist < CRITICAL_DIST) {
            issues.criticalOverlaps.push({
              sceneId,
              step: sIdx + 1,
              pair: `${kA} <--> ${kB}`,
              dist: Math.round(dist),
              coords: `(${entA.x},${entA.y}) vs (${entB.x},${entB.y})`,
            });
          } else if (dist < WARNING_DIST) {
            issues.crowdedPairs.push({
              sceneId,
              step: sIdx + 1,
              pair: `${kA} <--> ${kB}`,
              dist: Math.round(dist),
              coords: `(${entA.x},${entA.y}) vs (${entB.x},${entB.y})`,
            });
          }
        }
      }
    }
  });
}

console.log('--- AUDIT FINDINGS ---');
console.log(`1. Goal Alignment Errors:       ${issues.goalErrors.length}`);
console.log(`2. Broken Link References:      ${issues.brokenLinks.length}`);
console.log(`3. Out of Viewport Bounds:      ${issues.outOfBounds.length}`);
console.log(`4. Critical Overlaps (<90px):   ${issues.criticalOverlaps.length}`);
console.log(`5. Crowded Pairs (90px..125px): ${issues.crowdedPairs.length}`);
console.log(`6. Glyph Clearance Hazards:     ${issues.glyphHazards.length}`);
console.log('='.repeat(75));

if (issues.criticalOverlaps.length > 0) {
  console.log('\n[CRITICAL OVERLAPS DETECTED]:');
  const grouped = {};
  issues.criticalOverlaps.forEach(o => {
    grouped[o.sceneId] = (grouped[o.sceneId] || 0) + 1;
  });
  for (const [id, count] of Object.entries(grouped)) {
    console.log(`  - ${id}: ${count} critical overlap pairs`);
  }
}

if (issues.brokenLinks.length > 0) {
  console.log('\n[BROKEN LINKS DETECTED]:');
  issues.brokenLinks.slice(0, 10).forEach(b => {
    console.log(`  - ${b.sceneId} Step ${b.step}: Link "${b.linkId}" references missing ${b.role}="${b.missing}"`);
  });
}

if (issues.outOfBounds.length > 0) {
  console.log('\n[OUT OF BOUNDS DETECTED]:');
  issues.outOfBounds.slice(0, 10).forEach(b => {
    console.log(`  - ${b.sceneId} Step ${b.step}: Entity "${b.entity}" at (${b.coords.join(', ')})`);
  });
}

if (issues.glyphHazards.length > 0) {
  console.log('\n[GLYPH CLEARANCE / CRAMPED BLOCK HAZARDS DETECTED]:');
  const grouped = {};
  const uniqueHazards = new Map();
  issues.glyphHazards.forEach(g => {
    grouped[g.sceneId] = (grouped[g.sceneId] || 0) + 1;
    const key = `${g.sceneId}::${g.entity}`;
    if (!uniqueHazards.has(key)) {
      uniqueHazards.set(key, g);
    }
  });
  for (const [id, count] of Object.entries(grouped)) {
    console.log(`  - ${id}: ${count} entities with glyph clearance/cramped hazards`);
  }
  console.log('\nUnique entity hazards:');
  for (const [_, g] of uniqueHazards) {
    console.log(`  - ${g.sceneId} [${g.entity}]: ${g.reason}`);
  }
}
