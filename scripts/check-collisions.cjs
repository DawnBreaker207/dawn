const fs = require('fs');
const path = require('path');

const gitDir = path.join(__dirname, '../src/data/scenes/git');
const files = fs.readdirSync(gitDir).filter(f => f.endsWith('.ts'));

function iso(x, y, h = 54) {
  return [14 * (x + y), 7 * (x - y) - h];
}

console.log('=== STRICT CLEARANCE AUDIT (Target: min separation >= 185px, zero touching) ===');

let violations = 0;

for (const file of files) {
  const content = fs.readFileSync(path.join(gitDir, file), 'utf8');
  const stepScenes = [...content.matchAll(/scene:\s*\{[\s\S]*?entities:\s*\{([\s\S]*?)\}\s*,/g)];
  
  stepScenes.forEach((sceneMatch, stepIdx) => {
    const sceneEntitiesText = sceneMatch[1];
    const entityMatches = [...sceneEntitiesText.matchAll(/([a-zA-Z0-9_]+):\s*[dyb]\s*\(\s*(-?\d+)\s*,\s*(-?\d+)/g)];
    
    for (let i = 0; i < entityMatches.length; i++) {
      for (let j = i + 1; j < entityMatches.length; j++) {
        const name1 = entityMatches[i][1];
        const x1 = parseInt(entityMatches[i][2], 10);
        const y1 = parseInt(entityMatches[i][3], 10);
        
        const name2 = entityMatches[j][1];
        const x2 = parseInt(entityMatches[j][2], 10);
        const y2 = parseInt(entityMatches[j][3], 10);
        
        const [sx1, sy1] = iso(x1, y1);
        const [sx2, sy2] = iso(x2, y2);
        const dx = Math.abs(sx1 - sx2);
        const dy = Math.abs(sy1 - sy2);
        const dist = Math.hypot(dx, dy);
        
        // Strict requirement: distance between centers must be >= 185px to avoid touching
        if (dist < 185) {
          console.log(`[CROWDED] ${file} (Step ${stepIdx + 1}): "${name1}" & "${name2}" distance = ${Math.round(dist)}px (dx=${Math.round(dx)}, dy=${Math.round(dy)})`);
          violations++;
        }
      }
    }
  });
}

console.log(`\nTotal crowded/touching occurrences: ${violations}`);
if (violations === 0) {
  console.log('>>> 100% PERFECT CLEARANCE! Zero touching blocks across all 14 Git scenes! <<<');
}
