import { test, expect } from '@playwright/test';
import { mockLookup, fillExample } from './fixtures.js';

test.beforeEach(async ({ page }) => { await mockLookup(page); });

test('cover page leads into the tool', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('spare key');
  await page.getByRole('link', { name: 'I build websites' }).first().click();
  await expect(page.getByRole('heading', { name: 'New continuity plan' })).toBeVisible();
});

test('lookup, complete services, and download the handover', async ({ page }) => {
  await fillExample(page);
  await expect(page.locator('details.service')).toHaveCount(6);
  await expect(page.locator('#risk-summary')).toContainText('serious');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download the plan/ }).click();
  expect((await download).suggestedFilename()).toBe('village-arts-trail-continuity-plan.docx');
});

test('draft survives a reload and can be cleared', async ({ page }) => {
  await fillExample(page);
  await page.reload();
  await expect(page.locator('#draft-note')).toContainText('Village Arts Trail');
  await page.getByRole('button', { name: 'Delete this plan' }).click();
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

test('an old address registered by someone else is flagged as serious', async ({ page }) => {
  await mockLookup(page);
  await page.goto('/#start');
  await page.locator('#old-input').fill('https://www.old-name.org.uk/');
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.locator('#old-domains')).toContainText('registered on 14 March 2026');
  await page.getByLabel('Stopped using it in').fill('2021');
  await expect(page.locator('#risks')).toContainText('old-name.org.uk was registered again in March 2026, probably by someone else');
});

test('the theme switch still works if the rest of the JavaScript fails to load', async ({ page }) => {
  await page.route(/\/(app\.js|lib\/.*\.js)$/, (route) => route.fulfill({ status: 404, body: '' }));
  for (const url of ['/', '/guide']) {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(url);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const sw = page.locator('[data-theme-toggle]').first();
    await sw.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await sw.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  }
});

test('several plans in one browser: new, switch, remove, clear everything', async ({ page }) => {
  await mockLookup(page);
  await fillExample(page);            // plan 1: Village Arts Trail
  await page.goto('/');
  await page.reload();
  await expect(page.locator('#cta-start')).toHaveText('Continue your draft');
  await page.getByRole('button', { name: 'New plan' }).click();
  await expect(page).toHaveURL(/#start$/);
  await expect(page.locator('[data-bind="client.organisation"]')).toHaveValue('');
  await expect(page.locator('.record')).toHaveCount(0);
  await page.locator('[data-bind="client.organisation"]').fill('Second Client');
  await page.locator('[data-bind="client.organisation"]').blur();
  await page.waitForTimeout(400);
  await page.reload();
  await page.locator('#plans summary').click();
  await expect(page.locator('#plans-count')).toHaveText('(2)');
  await page.getByRole('button', { name: 'Open Village Arts Trail' }).click();
  await expect(page.locator('.record h3')).toHaveText('village-arts-trail.org');
  await page.getByRole('button', { name: 'Remove Second Client' }).click();
  await page.getByRole('button', { name: 'Press again to confirm' }).click();
  await expect(page.locator('#plans-count')).toHaveText('(1)');
  await page.getByRole('button', { name: 'Clear everything' }).click();
  await page.getByRole('button', { name: 'Press again to confirm' }).click();
  await expect(page.locator('#plans')).toBeHidden();
  await expect(page.locator('.record')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('sparekey:plans'))).toBeNull();
});

test('a draft saved by an earlier version is kept as a plan', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('sparekey:draft', JSON.stringify({ format: 'sparekey-inventory', version: 1, client: { organisation: 'Old Draft Ltd' }, domains: [], services: [] })));
  await page.goto('/#start');
  await page.reload();
  await expect(page.locator('[data-bind="client.organisation"]')).toHaveValue('Old Draft Ltd');
  expect(await page.evaluate(() => localStorage.getItem('sparekey:draft'))).toBeNull();
});
