const fs = require('fs');
const path = require('path');

const gitDir = path.join(__dirname, '../src/data/scenes/git');
const files = fs.readdirSync(gitDir).filter(f => f.endsWith('.ts'));

console.log(`Auditing ${files.length} Git scene files for AGENTS.md rules...`);

let totalErrors = 0;

for (const file of files) {
  const filePath = path.join(gitDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // 1. Check subtitle length
  const subMatches = [...content.matchAll(/sub:\s*['"`]([^'"`]+)['"`]/g)];
  for (const m of subMatches) {
    if (m[1].length > 14) {
      console.error(`[FAIL] ${file}: Subtitle "${m[1]}" is ${m[1].length} chars (must be <= 14)`);
      totalErrors++;
    }
  }

  // 2. Check height budget: if sub is present on makeBlock, h must be >= 50
  // e.g. d(x, y, { ... sub: ..., h: ... })
  const blockMatches = [...content.matchAll(/d\s*\([^)]+h:\s*(\d+)[^)]*sub:/g)];
  for (const m of blockMatches) {
    const h = parseInt(m[1], 10);
    if (h < 50) {
      console.error(`[FAIL] ${file}: Block with sub has height ${h} < 50`);
      totalErrors++;
    }
  }

  // 3. Check goals and steps alignment
  const goalsMatch = content.match(/goals:\s*\[([\s\S]*?)\],/);
  const stepsMatch = content.match(/steps:\s*\[([\s\S]*?)\]\s*,\s*\}\s*;/);
  if (goalsMatch && stepsMatch) {
    const goalCount = (goalsMatch[1].match(/text:/g) || []).length;
    const stepCount = (stepsMatch[1].match(/short:/g) || []).length;
    if (goalCount !== 6 || stepCount !== 6) {
      console.error(`[FAIL] ${file}: goalCount=${goalCount}, stepCount=${stepCount} (both must be 6)`);
      totalErrors++;
    }
  }
}

if (totalErrors === 0) {
  console.log(`\n>>> 100% PASS! All ${files.length} Git scene graphs strictly satisfy AGENTS.md rules! <<<`);
} else {
  console.error(`\nFound ${totalErrors} violations.`);
  process.exit(1);
}
