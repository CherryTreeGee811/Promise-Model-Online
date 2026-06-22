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

function settle(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function click(page, selector) {
  const el = await page.waitForSelector(selector, { timeout: 5000 }).catch(() => null);
  if (el) {
    await el.evaluate(node => node.click());
    await settle(300);
  }
}

async function interactWithPage(page) {
  try {
    const buttons = await page.$$('button, a.btn, .nav-link, .list-group-item, [role=button]');
    for (const btn of buttons.slice(0, 3)) {
      try {
        await btn.click();
        await settle(300);
      } catch {
        // element may be hidden or non-interactive
      }
    }
  } catch {
    // no interactive elements
  }
}

async function navigateAndInteract(page, url) {
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await settle(1000);
  await interactWithPage(page);
  await settle(500);
}

module.exports = {
  url: () => URL,

  action: async page => {
    for (const route of ROUTES) {
      try {
        await navigateAndInteract(page, new URL(route, page.url()).href);
      } catch {
        // route may require auth or be unavailable
      }
    }

    try {
      const modalTriggers = await page.$$('[data-bs-toggle="modal"], .modal-trigger, .btn-outline-secondary');
      for (const trigger of modalTriggers.slice(0, 2)) {
        try {
          await trigger.click();
          await settle(500);
          const closeButtons = await page.$$('[data-bs-dismiss="modal"], .btn-close, .modal .btn-secondary');
          for (const btn of closeButtons.slice(0, 2)) {
            try {
              await btn.click();
              await settle(500);
            } catch { /* ignore */ }
          }
        } catch { /* ignore */ }
      }
    } catch { /* no modal triggers */ }

    return { page };
  },

  back: async page => {
    await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
    await settle(2000);
    return { page };
  },
};
