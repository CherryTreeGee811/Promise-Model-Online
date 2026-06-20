/**
 * @fileoverview MemLab scenario for authenticated memory leak detection.
 *
 * Logs in as a test user and navigates all authenticated routes.
 * Run against the full E2E stack (auth + API + BFF + nginx):
 *   URL=https://localhost:9000 memlab run --scenario scripts/memlab-scenarios/leak-check-authenticated.js
 */

const URL = process.env.URL || 'http://localhost:4173';
const TEST_USER = process.env.TEST_USER || 'pmo_test';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Hello123*';

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
 * Log in as the test user via the OIDC login flow.
 * The E2E stack routes through the auth server, which presents a login form
 * with fields Username and Password.
 * @param {import('puppeteer').Page} page
 */
async function login(page) {
  // Trigger login by navigating to a protected page that redirects through OIDC
  await navigate(page, `${URL}/#/projects`);

  // The SPA redirects to the auth server's /account/login page.
  // Look for the login form and fill credentials.
  try {
    await page.waitForSelector('input[name="Username"],input[name="username"]', { timeout: 10000 });
  } catch {
    // If no login form appears, the session may already be active
    return;
  }

  await page.fill('input[name="Username"],input[name="username"]', TEST_USER);
  await page.fill('input[name="Password"],input[name="password"]', TEST_PASSWORD);
  await click(page, 'button[type="submit"]');

  // Wait for OIDC redirect back to the SPA
  await page.waitForFunction(
    () => window.location.hash?.length > 0,
    { timeout: 15000 }
  ).catch(() => {});
  await settle(page, 3000);
}

/**
 * Interact with elements on the page to trigger lazy-loaded components
 * and exercise event listener lifecycle.
 * @param {import('puppeteer').Page} page
 */
async function interactWithPage(page) {
  try {
    const buttons = await page.$$('button, a.btn, .nav-link, .list-group-item, [role=button]');
    for (const btn of buttons.slice(0, 3)) {
      try {
        await btn.click();
        await settle(page, 300);
      } catch {
        // element may be hidden or non-interactive
      }
    }
  } catch {
    // no interactive elements
  }
}

/**
 * Exhaustive authenticated leak detection scenario.
 * @param {import('puppeteer').Page} page
 */
async function runScenario(page) {
  // --- Initial load + login ---
  await navigate(page, URL);
  await page.waitForFunction(
    () => document.querySelector('#nav-content')?.children.length > 0 ||
           document.querySelector('#main-content')?.children.length > 0,
    { timeout: 10000 }
  ).catch(() => {});
  await settle(page, 2000);

  // Login as test user
  await login(page);

  // --- Snapshot 1: baseline after login ---
  // (MemLab automatically takes a baseline snapshot before the scenario starts)

  // --- Navigate authenticated project routes ---
  const authenticatedRoutes = [
    { path: '/pmo_test/seeded-project/graph', label: 'Graph' },
    { path: '/pmo_test/seeded-project/strides', label: 'Stride Board' },
    { path: '/pmo_test/seeded-project/promises/1', label: 'Promise Detail' },
    { path: '/pmo_test/seeded-project/flows/1', label: 'Flow Detail' },
    { path: '/pmo_test/seeded-project/epics/1', label: 'Epic Detail' },
    { path: '/pmo_test/seeded-project/moments/1', label: 'Moment Detail' },
    { path: '/pmo_test/seeded-project/journeys/1', label: 'Journey Detail' },
  ];

  for (const route of authenticatedRoutes) {
    await navigate(page, `${URL}/#${route.path}`);
    await interactWithPage(page);
    await settle(page, 1500);

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
  }

  // --- Navigate global authenticated pages ---
  const globalRoutes = [
    { path: '/notifications', label: 'Notifications' },
    { path: '/invitations', label: 'Invitations' },
    { path: '/project-settings', label: 'Project Settings' },
  ];

  for (const route of globalRoutes) {
    await navigate(page, `${URL}/#${route.path}`);
    await interactWithPage(page);
    await settle(page, 1500);
  }

  // --- Return to home for final settling ---
  await navigate(page, URL);
  await settle(page, 3000);

  // MemLab compares the final heap snapshot against the baseline
  // and reports objects allocated but not released.
}

module.exports = { runScenario };
