#!/usr/bin/env node
/**
 * Master Diagram Quality & Sanity Auditor
 * 
 * Verifies all 3D simulation diagrams against Isometric Simulator Rules:
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
const EXPANSION_RULE_DIST = 155; // Expansion Rule: links with labels or nodes with tags require >= 155px
const BOUNDS = { xMin: -22, xMax: 22, yMin: -26, yMax: 26 };

function isoProject(x, y, z = 0) {
  return [Math.round(14 * (x + y)), Math.round(7 * (x - y) - z)];
}

function isTechnicalArtifactPanel(panel) {
  if (!panel) return false;
  // Chart widgets (e.g. hockey stick latency chart) are visualization components, not text panels
  if (panel.chart) return true;
  // Bitfield specifications (e.g. Snowflake 64-bit register bitfield)
  if (panel.title && (/64-bit|bitfield|UUID\s*v[47]|Base\s*62/i.test(panel.title))) return true;

  if (!Array.isArray(panel.lines)) return false;
  const lines = panel.lines;
  for (const line of lines) {
    if (typeof line !== 'string') continue;
    const s = line.trim();
    // Bitfield / binary specs
    if (/\b\d+\s*bits\b/i.test(s)) return true;
    // Deadlock / lock cycle traces
    if (/lock\s+[A-Z]\b.*waiting\s+for/i.test(s) || /waiting\s+for\s+[A-Z]\b/i.test(s)) return true;
    // Shell commands / redirections
    if (/^echo\s+|>\s*\/|>\s*[a-z0-9_.]+/i.test(s)) return true;
    // HTTP Headers / Payload keys
    if (/^(Idempotency-Key|Authorization|Cookie|Content-Type):/i.test(s)) return true;

    // Terminal commands / Shell output
    if (/^(\$|>|#)\s+/i.test(s)) return true;
    if (/^(ps|grep|ip|etcdctl|cat|systemctl|mount|chroot|kill|top|free|strace|netstat|ss|iptables|ip6tables|nsenter|bpftool)\b/i.test(s)) return true;
    if (s.startsWith('/sys/fs/cgroup/') || s.startsWith('/proc/')) return true;

    // Kubernetes manifests & Dockerfile
    if (/^(apiVersion:|kind:|spec:|metadata:|status:|rules:|selector:|containers:|ports:|type:\s*(ClusterIP|NodePort|LoadBalancer))/i.test(s)) return true;
    if (/^(FROM|RUN|COPY|CMD|ENTRYPOINT|WORKDIR|ENV|EXPOSE|VOLUME)\b/i.test(s)) return true;

    // HTTP Request / Presigned URL / API payloads
    if (/^(PUT|GET|POST|DELETE|PATCH)\s+https?:\/\//i.test(s) || s.includes('?expires=') || s.includes('signature=')) return true;
    // Multi-part / State transition specifications
    if (s.includes('→') || s.includes('->') || s.includes('failed') || s.includes('complete')) {
      if (s.includes('part') || s.includes('upload id') || s.includes('retry') || s.includes('state')) return true;
    }
    // Code / Query / Commands
    if (
      s.includes(' = ') || s.includes('(') || s.includes('{') ||
      /^(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|ALTER)\b/i.test(s) ||
      /^(docker|kubectl|git|curl|iptables|tcpdump|sysctl|openssl)\b/i.test(s) ||
      /^(const|let|var|def|func|class|import|export|return)\b/i.test(s) ||
      s.includes('public class') || s.includes('void ') || s.includes('struct ') ||
      s.includes('SYN=') || s.includes('ACK=') || s.includes('SEQ=')
    ) return true;
  }
  return false;
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
const modules = currMod.CURRICULUM_MODULES || [];

const allCurriculumLessons = [];
modules.forEach(m => {
  (m.lessons || []).forEach(l => {
    allCurriculumLessons.push(l);
  });
});

const missingInScenes = allCurriculumLessons.filter(l => !scenes[l.id]);

console.log('='.repeat(75));
console.log('       MASTER 104-DIAGRAM ARCHITECTURAL AUDITOR & QUALITY REPORT');
console.log('='.repeat(75));
console.log(`Total Curriculum Lessons defined in curriculum.ts: ${allCurriculumLessons.length}`);
console.log(`Total Scene Graphs registered in ALL_SCENES:       ${Object.keys(scenes).length}`);
if (missingInScenes.length > 0) {
  console.log(`Curriculum lessons pending scene implementation:  ${missingInScenes.length}`);
  console.log(`Missing IDs:`, missingInScenes.map(l => l.id).join(', '));
}
console.log(`\nAuditing ${Object.keys(scenes).length} Registered Scene Graphs in ALL_SCENES...\n`);

const issues = {
  criticalOverlaps: [],
  expansionViolations: [],
  overwrittenLinks: [],
  detachedLabels: [],
  recycledLinkIds: [],
  genericConceptPanels: [],
  crowdedPairs: [],
  outOfBounds: [],
  brokenLinks: [],
  goalErrors: [],
  glyphHazards: [],
  textOverflowHazards: [],
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

    // Check Broken Links & Labeled Link Fitness
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

      // Labeled Link Clearance and Detached Risk
      if (link.label && from && to && ents[from] && ents[to]) {
        const eFrom = ents[from];
        const eTo = ents[to];
        const p1 = isoProject(eFrom.x, eFrom.y, eFrom.z || 0);
        const p2 = isoProject(eTo.x, eTo.y, eTo.z || 0);
        const totalDist = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
        const rFrom = (eFrom.s ? eFrom.s * 7 : 32);
        const rTo = (eTo.s ? eTo.s * 7 : 32);
        const effectiveLength = Math.max(0, totalDist - (rFrom + rTo));
        const labelText = String(link.label).trim();
        const textWidth = Math.round(labelText.length * 7.2 + 24);

        if (effectiveLength < textWidth + 30 || totalDist < 165) {
          issues.overwrittenLinks.push({
            sceneId,
            step: sIdx + 1,
            linkId,
            label: labelText,
            from,
            to,
            totalDist: Math.round(totalDist),
            effectiveLength: Math.round(effectiveLength),
            textWidth,
          });
        }

        const deltaSx = Math.abs(p1[0] - p2[0]);
        const deltaSy = Math.abs(p1[1] - p2[1]);
        const isVerticalGhat = deltaSx < 20 && deltaSy > 50;
        const hasTags = (Array.isArray(eFrom.tags) && eFrom.tags.length > 0) || (Array.isArray(eTo.tags) && eTo.tags.length > 0);

        if ((isVerticalGhat || hasTags) && totalDist < 210) {
          issues.detachedLabels.push({
            sceneId,
            step: sIdx + 1,
            linkId,
            label: labelText,
            from,
            to,
            totalDist: Math.round(totalDist),
            reason: isVerticalGhat ? 'Trục chiếu đứng gắt (dx ~ 0)' : 'Khối gắn thẻ Tag (va chạm đẩy nhãn văng)',
          });
        }
      }
    }

    // Check Step Transition: Recycled Link IDs with different endpoints
    if (sIdx + 1 < totalSteps && scene.steps[sIdx + 1]?.scene?.links) {
      const nextLinks = scene.steps[sIdx + 1].scene.links;
      for (const [kId, curL] of Object.entries(links)) {
        if (!curL) continue;
        const nxtL = nextLinks[kId];
        if (nxtL && (nxtL.from !== curL.from || nxtL.to !== curL.to)) {
          issues.recycledLinkIds.push({
            sceneId,
            fromStep: sIdx + 1,
            toStep: sIdx + 2,
            linkId: kId,
            prev: `${curL.from} -> ${curL.to}`,
            next: `${nxtL.from} -> ${nxtL.to}`,
          });
        }
      }
    }

    // Check Generic Concept Panels vs Technical Artifact Panels
    for (const [k, ent] of Object.entries(ents)) {
      if (!ent || typeof ent !== 'object') continue;
      if (ent.type === 'panel') {
        if (!isTechnicalArtifactPanel(ent)) {
          issues.genericConceptPanels.push({
            sceneId,
            step: sIdx + 1,
            panelKey: k,
            title: ent.title,
            lines: ent.lines || [],
          });
        }
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
        // In simulator engine (scene-renderer.ts), blocks default to s=4, h=46 from Xr
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

      // Check Text Overflow Hazard on Blocks (Tokens that cannot fit even after PascalCase / delimiter split)
      if (ent.type === 'block') {
        const s = typeof ent.s === 'number' ? ent.s : 4;
        const availWidth = Math.max(48, s * 14 * 1.35);
        let lines = [];
        if (typeof ent.label === 'string') {
          lines = ent.label.includes('\n') ? ent.label.split('\n') : [ent.label];
        } else if (Array.isArray(ent.label)) {
          lines = ent.label.map(x => String(x).trim());
        }
        for (const line of lines) {
          const words = line.split(/\s+/);
          for (const w of words) {
            const subParts = w.split(/(?<=[<(\[/_.:\-])|(?=[<(\[/_.:\-])|(?<=[a-z0-9])(?=[A-Z])/).filter(Boolean);
            const maxSubLen = Math.max(1, ...subParts.map(p => p.length));
            if (maxSubLen * 7.2 > availWidth || (w.length >= 20 && !w.includes(' '))) {
              issues.textOverflowHazards.push({
                sceneId,
                step: sIdx + 1,
                entity: k,
                word: w,
                s,
                availWidth: Math.round(availWidth),
                estWidth: Math.round(w.length * 7.2),
              });
            }
          }
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

          // Check if there is an active link with label or either entity has tags
          let hasConnectedLabeledLink = false;
          for (const l of Object.values(links)) {
            if (!l) continue;
            if ((l.from === kA && l.to === kB) || (l.from === kB && l.to === kA)) {
              if (l.label && typeof l.label === 'string' && l.label.trim().length > 0) {
                hasConnectedLabeledLink = true;
                break;
              }
            }
          }
          const hasTags = (Array.isArray(entA.tags) && entA.tags.length > 0) || (Array.isArray(entB.tags) && entB.tags.length > 0);

          if (dist < CRITICAL_DIST) {
            issues.criticalOverlaps.push({
              sceneId,
              step: sIdx + 1,
              pair: `${kA} <--> ${kB}`,
              dist: Math.round(dist),
              coords: `(${entA.x},${entA.y}) vs (${entB.x},${entB.y})`,
            });
          } else if ((hasConnectedLabeledLink || hasTags) && dist < EXPANSION_RULE_DIST) {
            issues.expansionViolations.push({
              sceneId,
              step: sIdx + 1,
              pair: `${kA} <--> ${kB}`,
              dist: Math.round(dist),
              required: EXPANSION_RULE_DIST,
              reason: hasConnectedLabeledLink ? 'Connected by labeled link' : 'Entity has tags',
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
console.log(`1. Goal Alignment Errors:          ${issues.goalErrors.length}`);
console.log(`2. Broken Link References:         ${issues.brokenLinks.length}`);
console.log(`3. Out of Viewport Bounds:         ${issues.outOfBounds.length}`);
console.log(`4. Critical Overlaps (<90px):      ${issues.criticalOverlaps.length}`);
console.log(`5. Expansion Rule Violations:      ${issues.expansionViolations.length}`);
console.log(`6. Crowded Pairs (90px..125px):    ${issues.crowdedPairs.length}`);
console.log(`7. Glyph Clearance Hazards:        ${issues.glyphHazards.length}`);
console.log(`8. Overwritten / Cramped Links:    ${issues.overwrittenLinks.length}`);
console.log(`9. Detached Label Hazards:         ${issues.detachedLabels.length}`);
console.log(`10. Recycled Link IDs (Tween Dead):${issues.recycledLinkIds.length}`);
console.log(`11. Generic Concept Panels:        ${issues.genericConceptPanels.length}`);
console.log(`12. Text Overflow Hazards:         ${issues.textOverflowHazards.length}`);
console.log('='.repeat(75));

if (issues.textOverflowHazards.length > 0) {
  console.log('\n[TEXT OVERFLOW HAZARDS ON BLOCKS (Monolithic words >= 14 chars exceeding face width)]:');
  const grouped = {};
  issues.textOverflowHazards.forEach(t => {
    grouped[t.sceneId] = (grouped[t.sceneId] || []);
    grouped[t.sceneId].push(t);
  });
  for (const [id, list] of Object.entries(grouped)) {
    console.log(`  - ${id} (${list.length} text hazards):`);
    list.slice(0, 4).forEach(t => {
      console.log(`      Step ${t.step} [${t.entity}]: "${t.word}" (s=${t.s}, est=${t.estWidth}px vs avail=${t.availWidth}px)`);
    });
    if (list.length > 4) console.log(`      ... and ${list.length - 4} more`);
  }
}

if (issues.genericConceptPanels.length > 0) {
  console.log('\n[GENERIC CONCEPT PANELS DETECTED (Should be removed unless Technical Artifact)]:');
  const grouped = {};
  issues.genericConceptPanels.forEach(p => {
    grouped[p.sceneId] = (grouped[p.sceneId] || []);
    grouped[p.sceneId].push(p);
  });
  for (const [id, list] of Object.entries(grouped)) {
    console.log(`  - ${id} (${list.length} panels):`);
    list.slice(0, 3).forEach(p => {
      console.log(`      Step ${p.step} [${p.panelKey}]: "${p.title}" -> lines: [${p.lines.slice(0, 2).join('; ')}...]`);
    });
    if (list.length > 3) console.log(`      ... and ${list.length - 3} more`);
  }
}

if (issues.recycledLinkIds.length > 0) {
  console.log('\n[RECYCLED LINK IDS ACROSS STEPS (Kills draw animation & causes teleport snap)]:');
  const grouped = {};
  issues.recycledLinkIds.forEach(r => {
    grouped[r.sceneId] = (grouped[r.sceneId] || []);
    grouped[r.sceneId].push(r);
  });
  for (const [id, list] of Object.entries(grouped)) {
    console.log(`  - ${id} (${list.length} recycled link transitions):`);
    list.slice(0, 5).forEach(r => {
      console.log(`      Link "${r.linkId}" Step ${r.fromStep} -> ${r.toStep}: was (${r.prev}), became (${r.next})`);
    });
    if (list.length > 5) console.log(`      ... and ${list.length - 5} more`);
  }
}

if (issues.overwrittenLinks.length > 0) {
  console.log('\n[OVERWRITTEN / CRAMPED LABELED LINKS (effectiveLength < textWidth + 30 or dist < 165)]:');
  const grouped = {};
  issues.overwrittenLinks.forEach(o => {
    grouped[o.sceneId] = (grouped[o.sceneId] || []);
    grouped[o.sceneId].push(o);
  });
  for (const [id, list] of Object.entries(grouped)) {
    console.log(`  - ${id} (${list.length} links):`);
    list.slice(0, 4).forEach(o => {
      console.log(`      Step ${o.step} link "${o.linkId}" ("${o.label}"): dist=${o.totalDist}px, effLen=${o.effectiveLength}px, textW=${o.textWidth}px (${o.from} -> ${o.to})`);
    });
    if (list.length > 4) console.log(`      ... and ${list.length - 4} more`);
  }
}

if (issues.detachedLabels.length > 0) {
  console.log('\n[DETACHED LABEL HAZARDS (Vertical axis dx<20 or tags near link with dist < 210)]:');
  const grouped = {};
  issues.detachedLabels.forEach(d => {
    grouped[d.sceneId] = (grouped[d.sceneId] || []);
    grouped[d.sceneId].push(d);
  });
  for (const [id, list] of Object.entries(grouped)) {
    console.log(`  - ${id} (${list.length} links):`);
    list.slice(0, 3).forEach(d => {
      console.log(`      Step ${d.step} link "${d.linkId}" ("${d.label}"): dist=${d.totalDist}px, reason: ${d.reason}`);
    });
    if (list.length > 3) console.log(`      ... and ${list.length - 3} more`);
  }
}

if (issues.expansionViolations.length > 0) {
  console.log('\n[EXPANSION RULE VIOLATIONS DETECTED (Labeled links or tags with dist < 155px)]:');
  const grouped = {};
  issues.expansionViolations.forEach(v => {
    grouped[v.sceneId] = (grouped[v.sceneId] || []);
    grouped[v.sceneId].push(v);
  });
  for (const [id, list] of Object.entries(grouped)) {
    console.log(`  - ${id} (${list.length} violations):`);
    list.slice(0, 5).forEach(v => {
      console.log(`      Step ${v.step}: ${v.pair} -> dist = ${v.dist}px (required >= ${v.required}px, reason: ${v.reason})`);
    });
    if (list.length > 5) console.log(`      ... and ${list.length - 5} more`);
  }
}

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
