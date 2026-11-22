#!/usr/bin/env node
/**
 * DTS 2.5D Isometric Architecture Scene Collision Linter
 * 
 * Verifies that all 3D blocks, databases, and devices in simulation scenes
 * maintain sufficient 2D screen distance to prevent overlapping or crowding.
 * 
 * Formula:
 *   sx = round(14 * (x + y))
 *   sy = round(7 * (x - y) - z)
 *   Thresholds:
 *     - CRITICAL OVERLAP: dist < 90px (shapes touch or intersect)
 *     - CROWDED: 90px <= dist < 125px (too tight, arrows clipped)
 *     - HEALTHY: dist >= 125px
 */

import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const CRITICAL_DIST = 90;
const WARNING_DIST = 125;

function isoProject(x, y, z = 0) {
  return [Math.round(14 * (x + y)), Math.round(7 * (x - y) - z)];
}

async function loadScenes() {
  const result = await esbuild.build({
    entryPoints: [path.join(rootDir, 'src/data/scenes/index.ts')],
    bundle: true,
    write: false,
    format: 'cjs',
    plugins: [{
      name: 'alias',
      setup(build) {
        build.onResolve({ filter: /^@\// }, args => {
          const sub = args.path.replace(/^@\//, '');
          const resolved = path.join(rootDir, 'src', sub);
          return { path: resolved.endsWith('.ts') ? resolved : resolved + '.ts' };
        });
      }
    }]
  });

  const m = { exports: {} };
  const fn = new Function('module', 'exports', 'require', result.outputFiles[0].text);
  fn(m, m.exports, (mod) => {
    try {
      return import.meta.resolve ? {} : {};
    } catch {
      return {};
    }
  });

  return m.exports.ALL_SCENES || {};
}

async function run() {
  const filterArg = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
  const showAll = process.argv.includes('--all');

  console.log('='.repeat(70));
  console.log('  DTS ISOMETRIC SCENE COLLISION LINTER');
  console.log('='.repeat(70));

  const allScenes = await loadScenes();
  const sceneEntries = Object.entries(allScenes);

  // Deduplicate by lesson id
  const uniqueScenes = new Map();
  for (const [key, scene] of sceneEntries) {
    if (scene && scene.id && !uniqueScenes.has(scene.id)) {
      uniqueScenes.set(scene.id, { key, scene });
    }
  }

  const targetScenes = filterArg
    ? [...uniqueScenes.entries()].filter(([id, { key }]) => id.includes(filterArg) || key.includes(filterArg))
    : [...uniqueScenes.entries()];

  if (targetScenes.length === 0) {
    console.log(`No scenes matching "${filterArg}".`);
    return;
  }

  let totalCollisions = 0;
  let totalWarnings = 0;
  let problematicLessons = 0;

  for (const [id, { scene }] of targetScenes) {
    let lessonHasIssue = false;
    const lessonIssues = [];

    if (!scene.steps || !Array.isArray(scene.steps)) continue;

    scene.steps.forEach((step, stepIdx) => {
      if (!step.scene || !step.scene.entities) return;

      const entities = Object.entries(step.scene.entities).filter(([_, e]) => {
        return e && typeof e.x === 'number' && typeof e.y === 'number' &&
          (e.type === 'block' || e.type === 'db' || e.type === 'device' || !e.type);
      });

      const stepCollisions = [];

      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const [idA, entA] = entities[i];
          const [idB, entB] = entities[j];

          const [sxA, syA] = isoProject(entA.x, entA.y, entA.z || 0);
          const [sxB, syB] = isoProject(entB.x, entB.y, entB.z || 0);

          const dist = Math.hypot(sxA - sxB, syA - syB);

          if (dist < WARNING_DIST) {
            const isCritical = dist < CRITICAL_DIST;
            if (isCritical) totalCollisions++;
            else totalWarnings++;

            stepCollisions.push({
              idA,
              idB,
              typeA: entA.type || 'block',
              typeB: entB.type || 'block',
              posA: [entA.x, entA.y],
              posB: [entB.x, entB.y],
              screenA: [sxA, syA],
              screenB: [sxB, syB],
              dist: Math.round(dist),
              isCritical
            });
          }
        }
      }

      if (stepCollisions.length > 0) {
        lessonHasIssue = true;
        lessonIssues.push({
          stepIdx,
          short: step.short || `Step ${stepIdx + 1}`,
          title: step.title || '',
          collisions: stepCollisions
        });
      }
    });

    if (lessonHasIssue) {
      problematicLessons++;
      console.log(`\n\x1b[33m[!] LESSON: ${scene.title || id} (${id})\x1b[0m`);
      
      for (const item of lessonIssues) {
        console.log(`    Step ${item.stepIdx}: "${item.short}" - ${item.title}`);
        for (const c of item.collisions) {
          const tag = c.isCritical
            ? '\x1b[31m[CRITICAL OVERLAP]\x1b[0m'
            : '\x1b[33m[CROWDED]\x1b[0m';
          console.log(`      ${tag} ${c.idA} <--> ${c.idB}: distance = ${c.dist}px (threshold: ${WARNING_DIST}px)`);
          console.log(`         3D: ${c.idA}(${c.posA}) vs ${c.idB}(${c.posB})`);
          console.log(`         2D: [${c.screenA[0]}, ${c.screenA[1]}] vs [${c.screenB[0]}, ${c.screenB[1]}]`);
        }
      }
    } else if (showAll) {
      console.log(`\x1b[32m[✓] LESSON: ${scene.title || id} (${id}) - CLEAN\x1b[0m`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`SUMMARY:`);
  console.log(`  Scanned scenes: ${targetScenes.length}`);
  console.log(`  Problematic scenes: ${problematicLessons}`);
  console.log(`  Critical Overlaps (<${CRITICAL_DIST}px): ${totalCollisions}`);
  console.log(`  Crowded pairs (<${WARNING_DIST}px): ${totalWarnings}`);
  console.log('='.repeat(70));
}

run().catch(err => {
  console.error('Fatal lint error:', err);
  process.exit(1);
});
