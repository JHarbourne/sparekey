// Checks WCAG contrast for the colour tokens in both themes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
function tokens(block) {
  const out = {};
  for (const m of block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)) out[m[1]] = m[2];
  return out;
}
const light = tokens(css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {'))));
const darkStart = css.indexOf(':root[data-theme="dark"] {');
const dark = { ...light, ...tokens(css.slice(darkStart, css.indexOf('}', darkStart))) };

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const TEXT = [['ink', 'bg'], ['ink', 'surface'], ['muted', 'bg'], ['muted', 'surface'], ['accent', 'surface'], ['accent', 'bg'],
  ['btn-ink', 'btn'], ['high', 'high-bg'], ['med', 'med-bg'], ['low', 'low-bg'], ['high', 'surface'], ['ok', 'surface'], ['brass-ink', 'brass'], ['brass-text', 'bg'], ['brass-text', 'surface']];
const UI = [['field', 'surface'], ['field', 'bg'], ['accent', 'surface']]; // borders and focus: 3:1

for (const [name, t] of [['light', light], ['dark', dark]]) {
  test(`${name} theme text contrast is at least 4.5:1`, () => {
    for (const [fg, bg] of TEXT) {
      const r = ratio(t[fg], t[bg]);
      assert.ok(r >= 4.5, `${fg} on ${bg} is ${r.toFixed(2)}:1`);
    }
  });
  test(`${name} theme control borders are at least 3:1`, () => {
    for (const [fg, bg] of UI) {
      const r = ratio(t[fg], t[bg]);
      assert.ok(r >= 3, `${fg} on ${bg} is ${r.toFixed(2)}:1`);
    }
  });
}
