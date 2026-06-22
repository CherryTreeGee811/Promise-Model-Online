/**
 * @fileoverview MemLab scenario for unauthenticated memory leak detection.
 *
 * Walks through public SPA routes, interacts with elements, and returns home.
 * MemLab compares heap snapshots before and after to detect leaked objects.
 *
 * Run:
 *   memlab run --scenario scripts/memlab-scenarios/leak-check.cjs
 *
 * Environment:
 *   URL   - target URL (default: http://localhost:4173)
 */

// puppeteer-core 24.x renamed ignoreHTTPSErrors to acceptInsecureCerts;
// memlab still sets the old name which is silently dropped.
const puppeteer = require('puppeteer');
const __origLaunch = puppeteer.launch;
puppeteer.launch = function (opts) {
  opts = Object.assign({}, opts);
  opts.acceptInsecureCerts = true;
  opts.args = [...(opts.args || []), '--ignore-certificate-errors'];
  return __origLaunch(opts);
};

const URL = process.env.URL || 'http://localhost:4173';
const ROUTES = ['/account/login', '/privacy', '/tos', '/knowledge-base', '/change-password', '/account/delete'];

async function click(page, selector) {
  const el = await page.waitForSelector(selector, { timeout: 5000 }).catch(() => null);
  if (el) {
    await el.evaluate(node => node.click());
    await page.waitForTimeout(300);
  }
}

async function interactWithPage(page) {
  try {
    const buttons = await page.$$('button, a.btn, .nav-link, .list-group-item, [role=button]');
    for (const btn of buttons.slice(0, 3)) {
      try {
        await btn.click();
        await page.waitForTimeout(300);
      } catch {
        // element may be hidden or non-interactive
      }
    }
  } catch {
    // no interactive elements
  }
}

async function settle(page, ms) {
  await page.waitForTimeout(ms);
}

module.exports = {
  url: () => URL,

  action: async page => {
    for (const route of ROUTES) {
      try {
        await page.goto(`${URL}/#${route}`, { waitUntil: 'networkidle0', timeout: 15000 });
        await settle(page, 1000);
        await interactWithPage(page);
        await settle(page, 500);
      } catch {
        // route may require auth or be unavailable
      }
    }

    // Try opening and closing any modals to exercise modal lifecycle
    try {
      const modalTriggers = await page.$$('[data-bs-toggle="modal"], .modal-trigger, .btn-outline-secondary');
      for (const trigger of modalTriggers.slice(0, 2)) {
        try {
          await trigger.click();
          await settle(page, 500);
          const closeButtons = await page.$$('[data-bs-dismiss="modal"], .btn-close, .modal .btn-secondary');
          for (const btn of closeButtons.slice(0, 2)) {
            try {
              await btn.click();
              await settle(page, 500);
            } catch { /* ignore */ }
          }
        } catch { /* ignore */ }
      }
    } catch { /* no modal triggers */ }
  },

  back: async page => {
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await settle(page, 2000);
  },
};
