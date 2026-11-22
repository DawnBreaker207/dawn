import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  // Step 1: Start at Home
  await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  console.log('1. Home loaded. Current URL:', page.url());

  // Step 2: Navigate by clicking a link in sidebar
  const link = page.locator('a[href="/lab/architecture"]').first();
  if (await link.count() > 0) {
    await link.click();
    await page.waitForTimeout(1500);
    console.log('2. Clicked /lab/architecture link. Current URL:', page.url());
  } else {
    console.log('Sidebar link not found, navigating directly');
    await page.goto('http://localhost:4321/lab/architecture', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
  }

  // Step 3: Check canvas
  const canvasState = await page.evaluate(() => {
    const stageSvg = document.querySelector('.stage-svg');
    const c = document.getElementById('canvas');
    const host = document.querySelector('.stage__canvas-host');
    const ents = stageSvg ? stageSvg.querySelectorAll('.node, .dts-node, g.layer-ents > g').length : 0;
    return {
      canvasExists: !!c,
      hostExists: !!host,
      stageSvgExists: !!stageSvg,
      stageSvgWidth: stageSvg ? stageSvg.clientWidth : 0,
      stageSvgHeight: stageSvg ? stageSvg.clientHeight : 0,
      entityNodes: ents,
      htmlSnippet: c ? c.innerHTML.slice(0, 300) : '',
    };
  });

  console.log('Canvas State after navigation:', JSON.stringify(canvasState, null, 2));
  if (errors.length > 0) {
    console.log('Captured errors:', errors);
  } else {
    console.log('Zero errors captured!');
  }

  await page.screenshot({ path: 'public/static/playwright-audit/after_nav_test.png' });
  await browser.close();
})();
