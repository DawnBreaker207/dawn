import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const result = await esbuild.build({
  entryPoints: [path.join(rootDir, 'src/data/scenes/index.ts')],
  bundle: true,
  format: 'cjs',
  write: false,
  platform: 'node',
  target: 'node18',
  loader: { '.ts': 'ts' },
  alias: {
    '@': path.join(rootDir, 'src'),
  },
});

const cjsCode = result.outputFiles[0].text;
const mod = { exports: {} };
const fn = new Function('module', 'exports', 'require', cjsCode);
fn(mod, mod.exports, (id) => {
  if (id === 'path') return path;
  return {};
});

const scenes = mod.exports.ALL_SCENES || {};
for (const [k, sc] of Object.entries(scenes)) {
  if (k.includes('java') || k.includes('cloud') || k.includes('microservices')) {
    console.log(`${k} (total steps: ${sc.steps?.length}): goals = ${JSON.stringify(sc.goals?.map(g => ({ s: g.step, t: g.text })))}`);
  }
}
