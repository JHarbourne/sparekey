// Regression: every drop-down keeps its chevron clear of the right edge, in both themes.
import { test, expect } from '@playwright/test';

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
