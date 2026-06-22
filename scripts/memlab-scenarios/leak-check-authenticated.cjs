/**
 * @fileoverview MemLab scenario for authenticated memory leak detection.
 *
 * Logs in as a test user, walks through authenticated SPA routes,
 * interacts with elements, and returns home.
 * MemLab compares heap snapshots before and after to detect leaked objects.
 *
 * Run against the full E2E stack (auth + API + BFF + nginx):
 *   URL=https://localhost:9000 memlab run \
 *     --scenario scripts/memlab-scenarios/leak-check-authenticated.cjs
 *
 * Environment:
 *   URL           - target URL (default: http://localhost:4173)
 *   TEST_USER     - test account username (default: pmo_test)
 *   TEST_PASSWORD - test account password (default: Hello123*)
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
const TEST_USER = process.env.TEST_USER || 'pmo_test';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Hello123*';

async function click(page, selector) {
  const el = await page.waitForSelector(selector, { timeout: 5000 }).catch(() => null);
  if (el) {
    await el.evaluate(node => node.click());
    await page.waitForTimeout(500);
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

async function settle(_page, ms) {
  await new Promise(r => setTimeout(r, ms));
}

module.exports = {
  url: () => URL,

  setup: async page => {
    // Trigger OIDC login by navigating to a protected page
    await page.goto(`${URL}/#/projects`, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await settle(page, 2000);

    // Fill login form if the OIDC redirect presented one
    try {
      await page.waitForSelector('input[name="Username"],input[name="username"]', { timeout: 10000 });
      await page.fill('input[name="Username"],input[name="username"]', TEST_USER);
      await page.fill('input[name="Password"],input[name="password"]', TEST_PASSWORD);
      await click(page, 'button[type="submit"]');

      // Wait for OIDC redirect back to SPA
      await page.waitForFunction(
        () => window.location.hash?.length > 0,
        { timeout: 15000 },
      ).catch(() => {});
      await settle(page, 3000);
    } catch {
      // Already logged in or no login form presented
    }
  },

  action: async page => {
    const routes = [
      '/pmo_test/seeded-project/graph',
      '/pmo_test/seeded-project/strides',
      '/pmo_test/seeded-project/promises/1',
      '/notifications',
      '/invitations',
      '/project-settings',
    ];

    for (const route of routes) {
      try {
        await page.evaluate((r) => { window.location.hash = r; }, route).catch(() => {});
        await settle(page, 1000);
        await interactWithPage(page);
        await settle(page, 500);
      } catch {
        // route may be unavailable in test environment
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
    // Use SPA hash navigation instead of page.goto to avoid triggering
    // memlab's page-reload detection (checkPageReload).
    await page.evaluate(() => { window.location.hash = ''; }).catch(() => {});
    await settle(page, 2000);
  },
};
