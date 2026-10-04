// The optional survey: offered once, after the first plan, only when a form is set.
import { test, expect } from '@playwright/test';
import { mockLookup, fillExample, step } from './fixtures.js';

const FORM = 'https://docs.google.com/forms/d/e/TEST/viewform?usp=pp_url&entry.1=VERSION';
// Swap the form address in lib/site.js for a test one, or for none.
async function withSurvey(page, form = FORM) {
  await page.route('**/lib/site.js', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(/const SURVEY_PREFILLED = '[^']*';/, `const SURVEY_PREFILLED = '${form}';`);
    await route.fulfill({ response: res, body });
  });
}

test('no survey is offered while no form is set', async ({ page }) => {
  await withSurvey(page, '');
  await mockLookup(page);
  await fillExample(page);
  await step(page, 'Hand over');
  await page.locator('#download-doc').click();
  await expect(page.locator('#save-status')).toContainText('downloaded');
  await expect(page.locator('#survey')).toBeHidden();
  await page.goto('/feedback');
  await expect(page.getByText('Tell us how it went')).toBeHidden();
});

test('the survey is offered once, after the first plan', async ({ page }) => {
  await withSurvey(page);
  await mockLookup(page);
  await fillExample(page);
  await step(page, 'Hand over');
  await expect(page.locator('#survey')).toBeHidden();
  await page.locator('#download-doc').click();
  await expect(page.locator('#survey')).toBeVisible();
  await expect(page.locator('#survey-go')).toHaveAttribute('href', /entry\.1=\d+\.\d+\.\d+/);
  await expect(page.locator('#survey-go')).toHaveAttribute('target', '_blank');
  await page.locator('#survey-no').click();
  await expect(page.locator('#survey')).toBeHidden();
  await page.locator('#download-doc').click();
  await expect(page.locator('#save-status')).toContainText('downloaded');
  await expect(page.locator('#survey')).toBeHidden();
  await page.goto('/feedback');
  await expect(page.getByText('Tell us how it went')).toBeVisible();
});

test('the real survey link carries the version', async ({ page }) => {
  await page.goto('/feedback');
  const card = page.getByRole('link', { name: /Tell us how it went/ });
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('href', /^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/viewform\?usp=pp_url&entry\.\d+=\d+\.\d+\.\d+$/);
});
