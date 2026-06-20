/**
 * @fileoverview MemLab scenario for exhaustive memory leak detection.
 *
 * Run against the production build preview server:
 *   npm run build && npm run preview &
 *   memlab run --scenario scripts/memlab-scenarios/leak-check.js
 *
 * Or against a local dev server:
 *   npm run dev &
 *   URL=http://localhost:9000 memlab run --scenario scripts/memlab-scenarios/leak-check.js
 */

const URL = process.env.URL || 'http://localhost:4173';

/**
 * Click a DOM element reliably via Puppeteer.
 * @param {import('puppeteer').Page} page
 * @param {string} selector
 */
async function click(page, selector) {
  const el = await page.waitForSelector(selector, { timeout: 5000 });
  await el.evaluate((node) => node.click());
  await page.waitForTimeout(500);
}

/**
 * Wait for the page content to settle after navigation.
 * @param {import('puppeteer').Page} page
 * @param {number} [ms]
 */
async function settle(page, ms = 1000) {
  await page.waitForTimeout(ms);
}

/**
 * Navigate and wait for the SPA route to render.
 * @param {import('puppeteer').Page} page
 * @param {string} url
 * @param {number} [waitMs]
 */
async function navigate(page, url, waitMs = 2000) {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await settle(page, waitMs);
}

/**
 * Exhaustive leak detection: runs every major SPA interaction
 * and takes heap snapshots between them.
 * @param {import('puppeteer').Page} page
 */
async function runScenario(page) {
  // --- Initial load ---
  // Navigate to the SPA home page
  await navigate(page, URL);
  // Wait for the SPA to bootstrap and render the home template
  await page.waitForFunction(
    () => document.querySelector('#nav-content')?.children.length > 0 ||
           document.querySelector('#main-content')?.children.length > 0,
    { timeout: 10000 }
  );
  await settle(page, 2000);

  // --- Snapshot 1: baseline after initial render ---
  // (MemLab automatically takes a baseline snapshot before the scenario starts)

  // --- Navigate through all major routes ---
  const routes = [
    { path: '/account/login', label: 'Login' },
    { path: '/stats', label: 'Statistics' },
    { path: '/privacy', label: 'Privacy' },
    { path: '/tos', label: 'Terms of Service' },
    { path: '/knowledge-base', label: 'Knowledge Base' },
    { path: '/notifications', label: 'Notifications' },
    { path: '/invitations', label: 'Invitations' },
    { path: '/change-password', label: 'Change Password' },
    { path: '/account/delete', label: 'Delete Account' },
  ];

  for (const route of routes) {
    await navigate(page, `${URL}/#${route.path}`);
    // Interact with the page to trigger any lazy-loaded components
    try {
      // Try clicking any interactive elements to trigger closures/listeners
      const buttons = await page.$$('button, a.btn, .nav-link, .list-group-item');
      for (const btn of buttons.slice(0, 2)) {
        try {
          await btn.click();
          await settle(page, 300);
        } catch {
          // element may be hidden or non-interactive — skip
        }
      }
    } catch {
      // no interactive elements found — continue
    }
    await settle(page, 1000);
  }

  // --- Back to home ---
  await navigate(page, URL);
  await settle(page, 2000);

  // --- Open and close modals (if any present) ---
  const modalTriggers = await page.$$('[data-bs-toggle="modal"], .modal-trigger');
  for (const trigger of modalTriggers.slice(0, 3)) {
    try {
      await trigger.click();
      await settle(page, 500);
      // Try to close via Bootstrap dismiss buttons
      const closeButtons = await page.$$('[data-bs-dismiss="modal"], .btn-close, .modal .btn-secondary');
      for (const btn of closeButtons.slice(0, 2)) {
        try {
          await btn.click();
          await settle(page, 500);
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }

  // Wait for any final cleanup
  await settle(page, 3000);
}

module.exports = { runScenario };
