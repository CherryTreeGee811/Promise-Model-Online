/**
 * @file Iterative heap-growth detection for memory leaks.
 *
 * Runs the SPA navigation cycle multiple times and measures
 * `performance.memory.usedJSHeapSize` after each iteration.
 * Fails CI if heap grows monotonically beyond the threshold.
 *
 * Run:
 *   URL=https://localhost:9000 node scripts/check-memory-leaks-iterative.cjs
 *
 * Environment:
 *   URL       - target URL (default: http://localhost:4173)
 *   ITERATIONS - number of navigation cycles (default: 10)
 *   THRESHOLD - max allowed heap growth in bytes (default: 524288 = 512KB)
 */

const puppeteer = require('puppeteer');

const __origLaunch = puppeteer.launch;
puppeteer.launch = function (opts) {
  opts = Object.assign({}, opts);
  opts.acceptInsecureCerts = true;
  opts.args = [...(opts.args || []), '--ignore-certificate-errors', '--no-sandbox'];
  return __origLaunch(opts);
};

const argv = require('node:process').argv;
const chromiumBinary = (() => {
  const idx = argv.indexOf('--chromium-binary');
  return idx !== -1 && argv[idx + 1] ? argv[idx + 1] : undefined;
})();

const URL = process.env.URL || 'http://localhost:4173';
const ITERATIONS = parseInt(process.env.ITERATIONS || '10', 10);
const THRESHOLD = parseInt(process.env.THRESHOLD || '524288', 10);

const ROUTES = ['/account/login', '/privacy', '/tos', '/knowledge-base', '/change-password', '/account/delete'];

function settle(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function navigateSpa(route) {
  history.pushState({}, '', route);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

async function interactWithPage(page) {
  await page.evaluate(() => {
    const els = document.querySelectorAll('button, a.btn, .nav-link, .list-group-item, [role=button]');
    let count = 0;
    for (const el of els) {
      if (count >= 3) break;
      el.addEventListener('click', e => e.preventDefault(), { once: true });
      el.click();
      count++;
    }
  });
  await settle(1000);
}

async function runIteration(page) {
  for (const route of ROUTES) {
    try {
      await page.evaluate(navigateSpa, route);
      await settle(800);
      await interactWithPage(page);
      await settle(400);
    } catch {
      // route may require auth or be unavailable
    }
  }

  // Navigate back to root via SPA
  await page.evaluate(() => {
    history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await settle(1500);
}

async function getHeapSize(page) {
  return page.evaluate(() => {
    const mem = performance.memory;
    return mem ? mem.usedJSHeapSize : 0;
  }).catch(() => 0);
}

async function main() {
  console.error(`Iterative memory leak check: ${ITERATIONS} iterations, ${(THRESHOLD / 1024).toFixed(1)}KB threshold\n`);

  const launchOpts = {
    headless: true,
    acceptInsecureCerts: true,
  };
  if (chromiumBinary) launchOpts.executablePath = chromiumBinary;
  const browser = await puppeteer.launch(launchOpts);

  try {
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
    await settle(3000);

    const baseline = await getHeapSize(page);
    const sizes = [baseline];
    console.error(`  [0] baseline: ${(baseline / 1024 / 1024).toFixed(2)} MB`);

    for (let i = 0; i < ITERATIONS; i++) {
      await runIteration(page);
      const size = await getHeapSize(page);
      sizes.push(size);
      const delta = size - sizes[sizes.length - 2];
      console.error(`  [${i + 1}] heap: ${(size / 1024 / 1024).toFixed(2)} MB (Δ ${(delta / 1024).toFixed(1)} KB)`);
    }

    // Check for sustained heap growth using running minimum.
    // The running minimum avoids false positives from normal GC cycles
    // and first-iteration initialization spikes. A real leak prevents
    // the heap floor from recovering between iterations.
    let minSeen = sizes[0];
    let maxGrowth = 0;
    for (let i = 1; i < sizes.length; i++) {
      const growth = sizes[i] - minSeen;
      if (growth > maxGrowth) maxGrowth = growth;
      if (sizes[i] < minSeen) minSeen = sizes[i];
    }

    console.error(`\n  Total heap growth: ${(maxGrowth / 1024).toFixed(1)} KB (threshold: ${(THRESHOLD / 1024).toFixed(1)} KB)`);

    if (maxGrowth > THRESHOLD) {
      console.error(`\n  ❌ FAIL: Heap grew ${(maxGrowth / 1024).toFixed(1)} KB across ${ITERATIONS} iterations (exceeds ${(THRESHOLD / 1024).toFixed(1)} KB)`);
      process.exit(1);
    }

    console.error(`\n  ✅ PASS: No significant heap growth detected`);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
