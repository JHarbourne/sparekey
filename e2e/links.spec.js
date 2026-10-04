// Links that leave Spare Key open in a new tab and say so; links within it don't.
import { test, expect } from '@playwright/test';

for (const path of ['/', '/passwords', '/feedback', '/check']) {
  test(`external links on ${path} open in a new tab`, async ({ page }) => {
    await page.goto(path);
    await page.waitForFunction(() => document.querySelector('a[data-ext]'));
    const links = await page.locator('a[href]').evaluateAll((as) => as.map((a) => ({
      href: a.href, ext: /^https?:/.test(a.href) && new URL(a.href).host !== location.host,
      target: a.target, rel: a.rel, text: a.textContent,
    })));
    for (const l of links) {
      if (l.ext) {
        expect(l.target, l.href).toBe('_blank');
        expect(l.rel, l.href).toContain('noopener');
        expect(l.text, l.href).toMatch(/new tab/);
      } else {
        expect(l.target, l.href).not.toBe('_blank');
      }
    }
  });
}
