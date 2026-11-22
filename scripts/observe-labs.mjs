import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:4321';
const SCREENSHOT_DIR = path.resolve('public/static/playwright-audit');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runObservation() {
  console.log('🚀 Starting Playwright observation of Normal Pages & Labs...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-precise-memory-info', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warn') {
      consoleLogs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleLogs.push(`[PAGE_ERROR] ${err.message}`);
  });

  // Track network requests
  const networkStats = {
    fonts: 0,
    scripts: 0,
    stylesheets: 0,
    images: 0,
    totalBytes: 0,
  };

  page.on('response', async (res) => {
    try {
      const type = res.request().resourceType();
      const headers = res.headers();
      const size = parseInt(headers['content-length'] || '0', 10);
      networkStats.totalBytes += size;
      if (type === 'font') networkStats.fonts++;
      else if (type === 'script') networkStats.scripts++;
      else if (type === 'stylesheet') networkStats.stylesheets++;
      else if (type === 'image') networkStats.images++;
    } catch {}
  });

  // 1. Observe Normal Pages
  const normalRoutes = ['/', '/blog', '/about', '/projects'];
  const normalResults = [];

  for (const route of normalRoutes) {
    console.log(`\n📄 Inspecting Normal Route: ${route}`);
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const metrics = await page.evaluate(() => {
      const perfMemory = (performance).memory || {};
      const domNodes = document.querySelectorAll('*').length;
      const svgs = document.querySelectorAll('svg').length;
      const canvases = document.querySelectorAll('canvas').length;
      return {
        domNodes,
        svgs,
        canvases,
        jsHeapUsedMB: perfMemory.usedJSHeapSize ? (perfMemory.usedJSHeapSize / 1048576).toFixed(2) : 'N/A',
        jsHeapTotalMB: perfMemory.totalJSHeapSize ? (perfMemory.totalJSHeapSize / 1048576).toFixed(2) : 'N/A',
      };
    });

    const safeName = route === '/' ? 'home' : route.replace(/\//g, '_');
    const screenshotPath = path.join(SCREENSHOT_DIR, `${safeName}.png`);
    await page.screenshot({ path: screenshotPath });

    normalResults.push({ route, ...metrics });
    console.log(`   - DOM Elements: ${metrics.domNodes} | SVGs: ${metrics.svgs}`);
    console.log(`   - JS Heap: ${metrics.jsHeapUsedMB} MB used / ${metrics.jsHeapTotalMB} MB total`);
  }

  // 2. Observe Lab Pages
  const labRoutes = [
    { name: 'architecture', url: '/lab/architecture' },
    { name: 'foundations', url: '/lab/foundations' },
    { name: 'sql', url: '/lab/sql' },
    { name: 'distributed', url: '/lab/distributed' },
    { name: 'k8s', url: '/lab/k8s' },
    { name: 'java', url: '/lab/java' },
    { name: 'system-design', url: '/lab/system-design' },
    { name: 'aws-cloud', url: '/lab/aws-cloud' },
  ];

  const labResults = [];

  for (const lab of labRoutes) {
    console.log(`\n🧪 Inspecting Lab Route: ${lab.url} (${lab.name})`);
    await page.goto(`${BASE_URL}${lab.url}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Inspect SVG canvas elements and interactive workbench state
    const labMetrics = await page.evaluate(() => {
      const perfMemory = (performance).memory || {};
      const domNodes = document.querySelectorAll('*').length;
      const svgCanvas = document.querySelector('svg.stage-svg') || document.querySelector('svg.dts-canvas');
      const nodes = svgCanvas ? svgCanvas.querySelectorAll('.node, .dts-node, g.layer-ents > g').length : 0;
      const links = svgCanvas ? svgCanvas.querySelectorAll('.link, .dts-link, g.layer-links > g').length : 0;
      const playBtn = document.querySelector('#pause') || document.querySelector('#btn-dts-playback');
      const playBtnText = playBtn ? (playBtn.querySelector('.label-pause')?.textContent?.trim() || playBtn.textContent?.trim()) : 'N/A';
      const steps = document.querySelectorAll('.timeline__step, .dts-step, [data-step-index]').length;

      return {
        domNodes,
        canvasFound: !!svgCanvas,
        nodeCount: nodes,
        linkCount: links,
        stepCount: steps,
        playBtnLabel: playBtnText,
        jsHeapUsedMB: perfMemory.usedJSHeapSize ? (perfMemory.usedJSHeapSize / 1048576).toFixed(2) : 'N/A',
        jsHeapTotalMB: perfMemory.totalJSHeapSize ? (perfMemory.totalJSHeapSize / 1048576).toFixed(2) : 'N/A',
      };
    });

    // Test Play/Pause click toggle
    let toggleWorked = false;
    const playBtnLocator = page.locator('#pause').first();
    if (await playBtnLocator.isVisible().catch(() => false)) {
      const initialText = await playBtnLocator.textContent();
      await playBtnLocator.click();
      await page.waitForTimeout(300);
      const afterText = await playBtnLocator.textContent();
      toggleWorked = initialText !== afterText;
      // Click back
      await playBtnLocator.click();
      await page.waitForTimeout(200);
    }

    const screenshotPath = path.join(SCREENSHOT_DIR, `lab_${lab.name}.png`);
    await page.screenshot({ path: screenshotPath });

    labResults.push({
      ...lab,
      ...labMetrics,
      toggleWorked,
    });

    console.log(`   - Canvas Found: ${labMetrics.canvasFound} | Nodes: ${labMetrics.nodeCount} | Links: ${labMetrics.linkCount}`);
    console.log(`   - Playback Button: "${labMetrics.playBtnLabel}" | Toggle Worked: ${toggleWorked}`);
    console.log(`   - DOM Elements: ${labMetrics.domNodes} | JS Heap: ${labMetrics.jsHeapUsedMB} MB`);
  }

  // Summary
  console.log('\n================ OBSERVATION SUMMARY ================');
  console.log('Network Transfer Stats:');
  console.log(`   - Fonts loaded: ${networkStats.fonts}`);
  console.log(`   - Scripts loaded: ${networkStats.scripts}`);
  console.log(`   - Stylesheets loaded: ${networkStats.stylesheets}`);
  console.log(`   - Est Total Bytes: ${(networkStats.totalBytes / 1048576).toFixed(2)} MB`);

  if (consoleLogs.length > 0) {
    console.log('\n⚠️ Console Warnings & Errors Captured:');
    consoleLogs.forEach((log) => console.log('   ' + log));
  } else {
    console.log('\n✅ Zero console errors or warnings recorded across all pages!');
  }

  console.log('\n📸 Screenshots saved to: public/static/playwright-audit/');

  await browser.close();
}

runObservation().catch((err) => {
  console.error('Observation failed:', err);
  process.exit(1);
});
