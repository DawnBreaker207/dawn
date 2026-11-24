const fs = require('fs');
const path = require('path');

const gitDir = path.join(__dirname, '../src/data/scenes/git');
const files = fs.readdirSync(gitDir).filter(f => f.endsWith('.ts'));

function toScreen(x, y, h = 52) {
  return {
    sx: 14 * (x + y),
    sy: 7 * (x - y) - h,
    x,
    y
  };
}

function distPointToSegment(p, a, b) {
  const dx = b.sx - a.sx;
  const dy = b.sy - a.sy;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return { d: Math.hypot(p.sx - a.sx, p.sy - a.sy), t: 0 };
  let t = ((p.sx - a.sx) * dx + (p.sy - a.sy) * dy) / l2;
  const clampedT = Math.max(0, Math.min(1, t));
  const projX = a.sx + clampedT * dx;
  const projY = a.sy + clampedT * dy;
  return {
    d: Math.hypot(p.sx - projX, p.sy - projY),
    t: clampedT
  };
}

console.log('=== DETAILED VIOLATIONS IN GIT SCENES ===\n');

for (const file of files) {
  const content = fs.readFileSync(path.join(gitDir, file), 'utf8');
  const stepBlocks = content.split(/\{\s*short:/g).slice(1);

  stepBlocks.forEach((stepBlock, stepIdx) => {
    const stepNum = stepIdx + 1;
    const entities = {};
    const entRegex = /([a-zA-Z0-9_]+):\s*[dyb]\s*\(\s*(-?\d+)\s*,\s*(-?\d+)/g;
    let em;
    while ((em = entRegex.exec(stepBlock)) !== null) {
      entities[em[1]] = toScreen(parseInt(em[2], 10), parseInt(em[3], 10));
    }

    const linkRegex = /([a-zA-Z0-9_]+):\s*(?:h|makeLink)\s*\(\s*['"]([a-zA-Z0-9_]+)['"]\s*,\s*['"]([a-zA-Z0-9_]+)['"](?:\s*,\s*(\[[^\]]+\]))?/g;
    let lm;
    const links = [];
    while ((lm = linkRegex.exec(stepBlock)) !== null) {
      const linkId = lm[1];
      const fromId = lm[2];
      const toId = lm[3];
      const ptsRaw = lm[4];
      let waypoints = [];
      if (ptsRaw) {
        const wpMatch = ptsRaw.match(/\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]/);
        if (wpMatch) {
          waypoints.push(toScreen(parseInt(wpMatch[1], 10), parseInt(wpMatch[2], 10)));
        }
      }
      links.push({ linkId, fromId, toId, waypoints });
    }

    links.forEach(link => {
      const fromNode = entities[link.fromId];
      const toNode = entities[link.toId];
      if (!fromNode || !toNode) return;

      const pathPoints = [fromNode, ...link.waypoints, toNode];
      let totalLength = 0;
      for (let i = 0; i < pathPoints.length - 1; i++) {
        totalLength += Math.hypot(pathPoints[i + 1].sx - pathPoints[i].sx, pathPoints[i + 1].sy - pathPoints[i].sy);
      }

      let isViolation = false;
      const issues = [];
      if (totalLength > 360) {
        issues.push(`LENGTH: ${Math.round(totalLength)}px > 360px`);
        isViolation = true;
      }

      for (let i = 0; i < pathPoints.length - 1; i++) {
        const segA = pathPoints[i];
        const segB = pathPoints[i + 1];

        for (const [nodeId, nodePt] of Object.entries(entities)) {
          if (nodeId === link.fromId && i === 0) continue;
          if (nodeId === link.toId && i === pathPoints.length - 2) continue;

          const { d, t } = distPointToSegment(nodePt, segA, segB);
          if (t > 0.05 && t < 0.95 && d < 70) {
            issues.push(`PIERCING: cuts across "${nodeId}" at (${nodePt.x}, ${nodePt.y}) [d=${Math.round(d)}px, t=${t.toFixed(2)}]`);
            isViolation = true;
          }
        }
      }

      if (isViolation) {
        console.log(`[${file} - Step ${stepNum}] Link "${link.linkId}" (${link.fromId} [${fromNode.x},${fromNode.y}] -> ${link.toId} [${toNode.x},${toNode.y}])`);
        issues.forEach(iss => console.log(`   - ${iss}`));
      }
    });
  });
}
