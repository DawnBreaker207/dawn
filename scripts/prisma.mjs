import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function loadEnv() {
  const file = new URL('../.env.local', import.meta.url);
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.replace(/\r$/, '').match(/^\s*([\w.]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const [, , ...args] = process.argv;
const res = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', ...args], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(res.status ?? 1);