// WCAG 2.2 AA scan with axe-core, in light and dark, on every page and on the
// tool with real content in it. Runs in CI; skipped locally if axe is not installed.
import { test, expect } from '@playwright/test';
import { mockLookup, fillExample } from './fixtures.js';

let AxeBuilder = null;
try { ({ default: AxeBuilder } = await import('@axe-core/playwright')); } catch { /* not installed */ }

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PAGES = ['/', '/ask', '/guide', '/faq', '/check', '/domain-policy', '/privacy', '/terms', '/feedback'];

async function scan(page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
  expect(summary, summary.join('\n')).toEqual([]);
}

for (const scheme of ['light', 'dark']) {
  test.describe(`${scheme} theme`, () => {
    test.skip(!AxeBuilder && !process.env.CI, 'axe-core not installed locally');
    test.beforeEach(async ({ page }) => { await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' }); });

    for (const path of PAGES) {
      test(`axe: ${path}`, async ({ page }) => {
        await page.goto(path);
        await scan(page);
      });
    }

    test('axe: the tool with a completed lookup and an open service', async ({ page }) => {
      await mockLookup(page);
      await fillExample(page);
      await page.locator('details.service summary').first().click();
      await scan(page);
    });
  });
}
