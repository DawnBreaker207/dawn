import { chromium } from 'playwright';
import fs from 'node:fs';

const ids = JSON.parse(fs.readFileSync('temp_lesson_ids.json', 'utf8'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('pageerror', (e) => errors.push({ url: page.url(), err: e.message }));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push({ url: page.url(), consoleErr: m.text() });
  });

  console.log(`Auditing ${ids.length} lessons for empty canvas...`);
  const emptyCanvasRoutes = [];

  // Sample the key track entry points and distinct lessons
  const testRoutes = [
    '/lab/architecture',
    '/lab/foundations',
    '/lab/sql',
    '/lab/distributed',
    '/lab/microservices',
    '/lab/k8s',
    '/lab/java',
    '/lab/system-design',
    '/lab/aws-cloud',
    '/lab/security',
    '/lab/request-lifecycle',
    '/lab/latency-throughput',
    '/lab/napkin-math',
    '/lab/sql-engine',
    '/lab/indexes',
    '/lab/transactions',
    '/lab/sharding',
    '/lab/replication',
    '/lab/docker-internals',
    '/lab/k8s-control-plane',
    '/lab/java-concurrency',
    '/lab/java-virtual-threads',
    '/lab/java-jvm-memory',
    '/lab/batch-stream',
    '/lab/ai-agent-architecture',
    '/lab/aws-vpc',
    '/lab/spider',
    '/lab/pathfinding',
    '/lab/terminal',
  ];

  for (const r of testRoutes) {
    try {
      await page.goto('http://localhost:4321' + r, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForTimeout(600);

      const check = await page.evaluate(() => {
        const stageSvg = document.querySelector('.stage-svg');
        const standardCanvas = document.querySelector('canvas:not(#global-weather-canvas)');
        const host = document.querySelector('.stage__canvas-host');

        if (stageSvg) {
          const rect = stageSvg.getBoundingClientRect();
          const nodes = stageSvg.querySelectorAll('.node, .dts-node, g.layer-ents > g').length;
          return { type: 'dts-svg', visible: rect.width > 0 && rect.height > 0, nodes, w: rect.width, h: rect.height };
        }
        if (standardCanvas) {
          const rect = standardCanvas.getBoundingClientRect();
          return { type: '2d-canvas', visible: rect.width > 0 && rect.height > 0, w: rect.width, h: rect.height };
        }
        return { type: 'none', visible: false, hostFound: !!host };
      });

      if (!check.visible || (check.type === 'dts-svg' && check.nodes === 0)) {
        emptyCanvasRoutes.push({ route: r, check });
        console.log(`❌ EMPTY CANVAS: ${r}`, check);
      } else {
        console.log(`✅ OK: ${r} (${check.type}, ${check.w}x${check.h}, nodes: ${check.nodes ?? 1})`);
      }
    } catch (err) {
      emptyCanvasRoutes.push({ route: r, error: err.message });
      console.log(`💥 ERROR LOADING: ${r}`, err.message);
    }
  }

  console.log('\n--- AUDIT SUMMARY ---');
  console.log(`Empty/Failed Canvas Count: ${emptyCanvasRoutes.length}`);
  if (emptyCanvasRoutes.length > 0) {
    console.log(JSON.stringify(emptyCanvasRoutes, null, 2));
  }
  if (errors.length > 0) {
    console.log(`Captured ${errors.length} page errors:`, errors.slice(0, 5));
  } else {
    console.log('Zero JS errors captured during audit!');
  }

  await browser.close();
})();
