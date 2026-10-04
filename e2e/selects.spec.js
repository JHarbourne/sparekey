// Regression: every drop-down keeps its chevron clear of the right edge, in both themes.
import { test, expect } from '@playwright/test';
import { mockLookup, fillExample } from './fixtures.js';

for (const colorScheme of ['light', 'dark']) {
  test(`select chevrons have right padding (${colorScheme})`, async ({ browser }) => {
    const page = await browser.newPage({ colorScheme });
    await page.goto('/#start');
    const selects = await page.locator('select').evaluateAll((els) => els.map((el) => {
      const cs = getComputedStyle(el);
      return { id: el.id || el.name || el.dataset.bind, appearance: cs.appearance, pad: parseFloat(cs.paddingRight), bg: cs.backgroundImage };
    }));
    expect(selects.length).toBeGreaterThan(3);
    for (const s of selects) {
      expect(s.appearance, s.id).toBe('none');
      expect(s.pad, s.id).toBeGreaterThanOrEqual(32);
      expect(s.bg, s.id).toContain('svg');
    }
    await page.close();
  });
}

// Fields sharing a row line up and are the same height, whatever their labels say.
test('fields in a row are the same height and line up', async ({ page }) => {
  await mockLookup(page);
  await fillExample(page);
  await page.evaluate(() => document.querySelectorAll('details.service').forEach((d) => { d.open = true; }));
  const rows = await page.evaluate(() => [...document.querySelectorAll('.grid.two, .old-fields, details.service .body')].map((g) => {
    const boxes = [...g.querySelectorAll(':scope > label > input, :scope > label > select')].map((f) => f.getBoundingClientRect()).filter((r) => r.height);
    return boxes.map((r) => ({ top: Math.round(r.top), h: Math.round(r.height) }));
  }));
  const all = rows.flat();
  expect(all.length).toBeGreaterThan(1);
  for (const f of all) expect(f.h).toBe(40);
  for (const row of rows) {
    // Fields that wrap onto a new line form a new row; within the first row, tops match.
    if (row.length > 1) expect(row[1].top === row[0].top || row[1].top > row[0].top + 40).toBeTruthy();
  }
});

test('pressing → in the empty code address starts it with https://github.com/', async ({ page }) => {
  await page.goto('/#start');
  const repo = page.locator('[data-bind="project.repo"]');
  await repo.focus();
  await page.keyboard.press('ArrowRight');
  await expect(repo).toHaveValue('https://github.com/');
  await page.keyboard.type('JHarbourne/sparekey');
  await expect(repo).toHaveValue('https://github.com/JHarbourne/sparekey');
  await repo.fill('');
  await page.keyboard.press('ArrowRight');
  await repo.blur();
  await expect(repo).toHaveValue('');
});
