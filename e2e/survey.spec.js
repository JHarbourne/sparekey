// The optional survey: offered once, after the first plan, only when a form is set.
import { test, expect } from '@playwright/test';
import { mockLookup, fillExample } from './fixtures.js';

const FORM = 'https://docs.google.com/forms/d/e/TEST/viewform?usp=pp_url&entry.1=VERSION';
async function withSurvey(page) {
  await page.route('**/lib/site.js', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace("const SURVEY_PREFILLED = '';", `const SURVEY_PREFILLED = '${FORM}';`);
    await route.fulfill({ response: res, body });
  });
}

test('no survey is offered while no form is set', async ({ page }) => {
  await mockLookup(page);
  await fillExample(page);
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
