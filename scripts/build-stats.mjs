import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const EXT = new Set(['.mdx', '.md', '.astro', '.ts', '.tsx', '.css', '.json', '.js', '.mjs']);

let files = 0;
let loc = 0;
for (const dir of ['src', 'data']) {
  const walk = (p) => {
    for (const entry of readdirSync(p, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.astro') continue;
      const full = join(p, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (EXT.has(entry.name.slice(entry.name.lastIndexOf('.')))) {
        files++;
        loc += readFileSync(full, 'utf8').split(/\r?\n/).length;
      }
    }
  };
  walk(join(root, dir));
}

const sh = (cmd) => {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};

let stargazers = 0;
try {
  const res = await fetch('https://api.github.com/repos/DawnBreaker207/dawn');
  if (res.ok) stargazers = (await res.json()).stargazers_count ?? 0;
} catch {
  // offline build: keep 0
}

const stats = {
  loc,
  files,
  stargazers,
  commit: sh('git rev-parse --short HEAD'),
  commitDate: sh('git log -1 --format=%cI'),
  branch: sh('git branch --show-current') || 'main',
};

writeFileSync(join(root, 'src', 'build-stats.json'), JSON.stringify(stats, null, 2) + '\n');
console.log(`build-stats: loc=${stats.loc} files=${stats.files} stars=${stats.stargazers} ${stats.commit}@${stats.branch}`);