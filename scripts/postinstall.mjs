#!/usr/bin/env node
// Copies production vendor files from node_modules to wwwroot/lib/
// Runs automatically after every npm install via the "postinstall" script.

import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const lib = resolve('PromiseModelOnline.Client/wwwroot/lib');
const js = resolve(lib, 'js');
const css = resolve(lib, 'css');
const fonts = resolve(lib, 'css/fonts');

for (const dir of [lib, js, css, fonts]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const files = [
  ['bootstrap/dist/css/bootstrap.min.css', css],
  ['bootstrap/dist/js/bootstrap.bundle.min.js', js],
  ['bootstrap-icons/font/bootstrap-icons.min.css', css],
  ['@microsoft/signalr/dist/browser/signalr.min.js', js],
  ['d3/dist/d3.min.js', js],
  ['tippy.js/dist/tippy.esm.js', js],
  ['axe-core/axe.min.js', js],
];

let errors = 0;

for (const [src, destDir] of files) {
  const srcPath = resolve('node_modules', src);
  try {
    copyFileSync(srcPath, resolve(destDir, src.split('/').pop()));
  } catch (err) {
    console.error(`[postinstall] FAILED: ${src} — ${err.message}`);
    errors++;
  }
}

// Bootstrap Icons font files (directory copy)
try {
  const fontSrc = resolve('node_modules/bootstrap-icons/font/fonts');
  if (existsSync(fontSrc)) {
    cpSync(fontSrc, fonts, { recursive: true, force: true });
  }
} catch (err) {
  console.error(`[postinstall] FAILED: bootstrap-icons fonts — ${err.message}`);
  errors++;
}

if (errors) {
  console.error(`[postinstall] ${errors} file(s) failed to copy.`);
  process.exit(1);
} else {
  console.log('[postinstall] All vendor files copied successfully.');
}
