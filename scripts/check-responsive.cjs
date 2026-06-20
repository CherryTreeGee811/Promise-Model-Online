#!/usr/bin/env node
const { launch } = require('puppeteer');

const TARGET_URL = process.argv[2] || 'http://localhost:4173';

const VIEWPORTS = [
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Tablet',  width: 768,  height: 1024 },
  { name: 'Mobile',  width: 375,  height: 812 },
];

const ROUTES = [
  '', '/projects', '/privacy', '/tos', '/knowledge-base',
  '/notifications', '/invitations', '/account/login',
];

(async () => {
  const browser = await launch({ headless: 'new', args: ['--no-sandbox'] });
  let errors = 0;

  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      const url = TARGET_URL + '/#' + route;

      process.stdout.write('  ' + (route || 'home').padEnd(20) + ' ' + vp.name.padEnd(9));

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 1500));

        const report = await page.evaluate(() => {
          const issues = [];
          const docEl = document.documentElement;

          if (docEl.scrollWidth > docEl.clientWidth + 2) {
            issues.push('horizontal overflow: scroll=' + docEl.scrollWidth + ' client=' + docEl.clientWidth);
          }

          const targets = document.querySelectorAll('button, a, input, select, textarea, [role=button], [tabindex]:not([tabindex=-1])');
          let smallTargets = 0;
          for (const el of targets) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.width < 44 && rect.height < 44) {
              smallTargets++;
              if (smallTargets <= 5) {
                issues.push('small target (' + Math.round(rect.width) + 'x' + Math.round(rect.height) + 'px): <' + el.tagName.toLowerCase() + '>' + (el.textContent || '').trim().slice(0, 40));
              }
            }
          }
          if (smallTargets > 5) {
            issues.push(smallTargets + ' total small targets');
          }

          return issues;
        });

        if (report.length === 0) {
          console.log('OK');
        } else {
          errors += report.length;
          console.log('FAIL');
          for (const issue of report) {
            console.log('       ' + issue);
          }
        }
      } catch (err) {
        console.log('ERR: ' + (err.message || '').slice(0, 60));
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();
  console.log('\n  Errors: ' + errors);
  process.exit(errors > 0 ? 1 : 0);
})().catch(err => { console.error(err); process.exit(1); });
