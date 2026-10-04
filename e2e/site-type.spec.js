// Step 03 asks how the site is made, and asks only what fits.
import { test, expect } from '@playwright/test';

const REPORT = `### wp-core ###

version: 6.6.2

### wp-active-theme ###

name: Astra (astra)
version: 4.8.1

### wp-plugins-active (2) ###

Elementor Pro: version: 3.23.0 (latest version: 3.24.1), author: Elementor.com, Auto-updates disabled
Akismet Anti-spam: Spam Protection: version: 5.3.3, author: Automattic, Auto-updates enabled

### wp-server ###

php_version: 8.3.4 64bit
`;

test('the questions change with how the site is made', async ({ page }) => {
  await page.goto('/#start');
  const drop = page.locator('#drop');
  const repo = page.locator('[data-bind="project.repo"]');
  const wp = page.locator('#wp-paste');
  await expect(drop).toBeVisible();
  await expect(wp).toBeHidden();

  await page.locator('#site-type').selectOption('builder');
  await expect(drop).toBeHidden();
  await expect(repo).toBeHidden();
  await expect(page.getByText('There’s no code to keep')).toBeVisible();

  await page.locator('#site-type').selectOption('wordpress');
  await expect(wp).toBeVisible();
  await expect(drop).toBeHidden();
  await expect(page.getByText('Only if you wrote a custom theme or plugin')).toBeVisible();

  await page.locator('#site-type').selectOption('code');
  await expect(drop).toBeVisible();
  await expect(wp).toBeHidden();
});

test('pasting WordPress site information reads plugins and adds services', async ({ page }) => {
  await page.goto('/#start');
  await page.locator('#site-type').selectOption('wordpress');
  await page.locator('#wp-paste').fill(REPORT);
  await page.getByRole('button', { name: 'Read it' }).click();
  await expect(page.locator('#wp-status')).toContainText('2 active plugins');
  await expect(page.locator('#wp-paste')).toHaveValue('');
  await expect(page.locator('#wp-summary')).toContainText('Theme: Astra 4.8.1');
  await expect(page.locator('#project-stack')).toContainText('WordPress 6.6.2');
  await expect(page.locator('#services')).toContainText('Elementor Pro licence');
  await expect(page.locator('#risks')).toContainText('1 plugin has an update waiting');
});

test('pasting something else explains what to copy', async ({ page }) => {
  await page.goto('/#start');
  await page.locator('#site-type').selectOption('wordpress');
  await page.locator('#wp-paste').fill('not a report');
  await page.getByRole('button', { name: 'Read it' }).click();
  await expect(page.locator('#wp-status')).toContainText('Tools, Site Health, Info');
});
