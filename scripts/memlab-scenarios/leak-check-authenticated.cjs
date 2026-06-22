const puppeteer = require('puppeteer');

const __origLaunch = puppeteer.launch;
puppeteer.launch = function (opts) {
  opts = Object.assign({}, opts);
  opts.acceptInsecureCerts = true;
  opts.args = [...(opts.args || []), '--ignore-certificate-errors', '--no-sandbox'];
  return __origLaunch(opts);
};

const URL = process.env.URL || 'http://localhost:4173';
const TEST_USER = process.env.TEST_USER || 'pmo_test';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Hello123*';

function settle(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function safeClickInteractiveElements(page) {
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

async function tryOpenAndCloseModals(page) {
  const modalTriggers = await page.$$('[data-bs-toggle="modal"], .modal-trigger, .btn-outline-secondary').catch(() => []);
  for (const trigger of modalTriggers.slice(0, 2)) {
    await trigger.evaluate(el => {
      el.addEventListener('click', e => e.preventDefault(), { once: true });
      el.click();
    }).catch(() => {});
    await settle(500);
    const closeButtons = await page.$$('[data-bs-dismiss="modal"], .btn-close, .modal .btn-secondary').catch(() => []);
    for (const btn of closeButtons.slice(0, 2)) {
      await btn.evaluate(el => {
        el.addEventListener('click', e => e.preventDefault(), { once: true });
        el.click();
      }).catch(() => {});
      await settle(500);
    }
  }
}

module.exports = {
  url: () => URL,

  setup: async page => {
    await page.goto(`${URL}/#/projects`, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
    await settle(2000);

    try {
      await page.waitForSelector('input[name="Username"],input[name="username"]', { timeout: 10000 });
      await page.fill('input[name="Username"],input[name="username"]', TEST_USER);
      await page.fill('input[name="Password"],input[name="password"]', TEST_PASSWORD);
      const btn = await page.$('button[type="submit"]');
      if (btn) {
        await btn.click();
        await page.waitForFunction(() => window.location.hash?.length > 0, { timeout: 15000 }).catch(() => {});
        await settle(3000);
      }
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
        await page.evaluate((r) => {
          history.pushState({}, '', r);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, route);
        await settle(1000);
        await safeClickInteractiveElements(page);
        await settle(500);
      } catch {
        // route may be unavailable in test environment
      }
    }

    await tryOpenAndCloseModals(page);

    return { page };
  },

  back: async page => {
    await page.evaluate(() => {
      history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await settle(2000);
    return { page };
  },
};
