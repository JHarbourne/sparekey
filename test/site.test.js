import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VERSION } from '../lib/version.js';
import { build } from '../scripts/pages.mjs';

test('footer version matches package.json', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  assert.equal(VERSION, pkg.version);
});

test('pages are up to date (run node scripts/pages.mjs)', () => {
  for (const [file, html] of Object.entries(build())) {
    assert.equal(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), html, `${file} is out of date`);
  }
});

test('no inline scripts or style attributes (the CSP would block them)', () => {
  for (const file of Object.keys(build())) {
    const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html), `${file} has an inline script`);
    assert.ok(!/\sstyle="/.test(html), `${file} has an inline style attribute`);
  }
});

test('analytics only sends numbers and booleans', async () => {
  const src = readFileSync(new URL('../lib/analytics.js', import.meta.url), 'utf8');
  assert.match(src, /cookieless_mode: 'always'/);
  assert.match(src, /autocapture: false/);
  assert.match(src, /disable_session_recording: true/);
  assert.match(src, /typeof v === 'number' \|\| typeof v === 'boolean'/);
});
