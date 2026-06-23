const puppeteer = require('puppeteer');

const __origLaunch = puppeteer.launch;
puppeteer.launch = function (opts) {
  opts = Object.assign({}, opts);
  opts.acceptInsecureCerts = true;
  opts.args = [...(opts.args || []), '--ignore-certificate-errors', '--no-sandbox'];
  return __origLaunch(opts);
};

const URL = process.env.URL || 'http://localhost:4173';
const ROUTES = ['/account/login', '/privacy', '/tos', '/knowledge-base', '/change-password', '/account/delete'];

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

function navigateSpa(route) {
  history.pushState({}, '', route);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

module.exports = {
  url: () => URL,

  action: async page => {
    for (const route of ROUTES) {
      try {
        await page.evaluate(navigateSpa, route);
        await settle(1000);
        await safeClickInteractiveElements(page);
        await settle(500);
      } catch {
        // route may require auth or be unavailable
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
