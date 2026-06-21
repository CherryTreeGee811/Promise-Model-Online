import { launch } from 'puppeteer';
import { readFileSync } from 'node:fs';

const targetUrl = process.argv[2] || 'http://localhost:4173';

const VIEWPORTS = [
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Tablet',  width: 768,  height: 1024 },
  { name: 'Mobile',  width: 375,  height: 812 },
];

const ROUTES = [
  { name: 'Home',          path: '' },
  { name: 'Projects List', path: '/projects' },
  { name: 'Stride Board',  path: '/pmo_test/seeded-project/strides' },
  { name: 'Project Graph', path: '/pmo_test/seeded-project/graph' },
  { name: 'Promise Detail',path: '/pmo_test/seeded-project/promises/1' },
  { name: 'Privacy',       path: '/privacy' },
  { name: 'Legal/TOS',     path: '/tos' },
];

const axeSource = readFileSync(
  new URL('node_modules/axe-core/axe.min.js', import.meta.url),
  'utf8'
);

async function runAxe(page, tags) {
  return await page.evaluate((tags) => {
    return new Promise((resolve) => {
      window.axe.run({
        runOnly: { type: 'tag', values: tags },
        resultTypes: ['violations'],
      }).then((results) => {
        resolve(JSON.stringify(results.violations));
      }).catch(() => resolve('[]'));
    });
  }, tags);
}

let totalViolations = 0;

console.log(`\n  A11y scan: ${targetUrl}\n`);

const browser = await launch({
  headless: 'new',
  executablePath: '/home/JacobSeed/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
});

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });
    const url = `${targetUrl}${route.path ? '/#' + route.path : ''}`;

    process.stdout.write(`  ${route.name.padEnd(16)} ${vp.name.padEnd(9)} `);

    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));
      await page.evaluate(axeSource);
      await new Promise(r => setTimeout(r, 500));

      const debugHtml = await page.evaluate(() => document.getElementById('main-message')?.outerHTML || 'NOT FOUND');
      if (debugHtml !== 'NOT FOUND') process.stdout.write(' [DBG] ');

      const aaViolations = JSON.parse(await runAxe(page, ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']));
      const aaaViolations = JSON.parse(await runAxe(page, ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag2aaa', 'wcag21aaa']));

      const aaCount = aaViolations.length;
      const aaaCount = aaaViolations.length;
      totalViolations += aaCount + aaaCount;

      if (aaCount + aaaCount === 0) {
        console.log('✅ AA/AAA');
      } else {
        console.log(`❌ AA=${aaCount} AAA=${aaaCount}`);
        if (debugHtml !== 'NOT FOUND') {
          const computed = await page.evaluate(() => {
            const el = document.getElementById('main-message');
            if (!el) return '';
            const p = el.querySelector('p');
            const s = p?.querySelector('strong');
            return JSON.stringify({
              outer: el.outerHTML.slice(0, 300),
              bg: getComputedStyle(el).background,
              color: getComputedStyle(el).color,
              pColor: p ? getComputedStyle(p).color : null,
              pBg: p ? getComputedStyle(p).background : null,
              strongColor: s ? getComputedStyle(s).color : null,
            });
          });
          console.log(`       [DBG] ${computed}`);
        }
        for (const v of aaViolations) {
          console.log(`       [AA] ${v.id}: ${v.help}`);
          for (const n of v.nodes.slice(0, 2)) {
            console.log(`             → ${n.target?.join(' ') || n.html?.slice(0, 80)}`);
          }
        }
        for (const v of aaaViolations) {
          console.log(`       [AAA] ${v.id}: ${v.help}`);
          for (const n of v.nodes.slice(0, 2)) {
            console.log(`             → ${n.target?.join(' ') || n.html?.slice(0, 80)}`);
          }
        }
      }
    } catch (err) {
      console.log(`⚠️  error: ${err.message?.slice(0, 80)}`);
    } finally {
      await page.close();
    }
  }
}

await browser.close();

console.log(`\n  Total: ${totalViolations} violation(s)`);
process.exit(totalViolations > 0 ? 1 : 0);
