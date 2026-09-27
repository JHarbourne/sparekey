import { test, expect } from '@playwright/test';
import { mockLookup, fillExample } from './fixtures.js';

test.beforeEach(async ({ page }) => { await mockLookup(page); });

test('cover page leads into the tool', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('spare key');
  await page.getByRole('link', { name: 'I build websites' }).first().click();
  await expect(page.getByRole('heading', { name: 'New handover' })).toBeVisible();
});

test('lookup, complete services, and download the handover', async ({ page }) => {
  await fillExample(page);
  await expect(page.locator('details.service')).toHaveCount(6);
  await expect(page.locator('#risk-summary')).toContainText('serious');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download handover/ }).click();
  expect((await download).suggestedFilename()).toBe('village-arts-trail-handover.docx');
});

test('draft survives a reload and can be cleared', async ({ page }) => {
  await fillExample(page);
  await page.reload();
  await expect(page.locator('#draft-note')).toContainText('Village Arts Trail');
  await page.getByRole('button', { name: 'Start again' }).click();
  await page.getByRole('button', { name: 'Press again to confirm' }).click();
  await expect(page.locator('details.service')).toHaveCount(0);
});

test('theme switch is a keyboard-operable switch and is remembered', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/guide');
  const sw = page.getByRole('switch', { name: 'Dark mode' });
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await sw.focus();
  await page.keyboard.press('Enter');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('footer shows the version and legal links on every page', async ({ page }) => {
  for (const path of ['/', '/guide', '/privacy', '/terms', '/feedback']) {
    await page.goto(path);
    await expect(page.locator('[data-version]')).toHaveText(/^v\d+\.\d+\.\d+$/);
    await expect(page.locator('footer')).toContainText('© JHarbourne.com 2026');
    await expect(page.locator('footer').getByRole('link', { name: 'Privacy' })).toBeVisible();
  }
});

test('clearing the last serious risk turns the key and says so', async ({ page }) => {
  await fillExample(page);
  await page.getByLabel('Name').nth(2).fill('Pat'); // emergency contact
  const email = page.locator('details.service').filter({ hasText: 'Email at' });
  await email.locator('summary').click();
  await email.getByLabel('Provider').fill('Google (Gmail / Workspace)');
  await expect(page.locator('#toast')).toHaveText('Spare key cut. Nothing serious left.');
  await expect(page.locator('#m-high')).toHaveText('0');
});
