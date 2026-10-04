// A risky answer in steps 03 and 04 shows what to do next; a safe one doesn't.
import { test, expect } from '@playwright/test';

test('risky answers show what to do next', async ({ page }) => {
  await page.goto('/#start');
  const repo = page.locator('[data-advice-for="project.repoAccess"]');
  await expect(repo).toBeHidden();
  await page.locator('#repo-access').selectOption('builder-only');
  await expect(repo).toBeVisible();
  await expect(repo).toContainText('Transfer ownership');
  await page.locator('#repo-access').selectOption('org');
  await expect(repo).toBeHidden();

  const pw = page.locator('[data-advice-for="passwordsMethod"]');
  await page.locator('#pw-method').selectOption('paper');
  await expect(pw).toBeVisible();
  await expect(pw).toContainText('executor');
  await page.locator('#pw-method').selectOption('shared-client');
  await expect(pw).toBeHidden();

  await page.locator('#two-factor').selectOption('builder-phone');
  await expect(page.locator('[data-advice-for="twoFactor"]')).toContainText('recovery codes');
  await page.locator('#backup-method').selectOption('none');
  await expect(page.locator('[data-advice-for="backupMethod"]')).toBeVisible();
  await page.locator('#backup-tested').selectOption('never');
  await expect(page.locator('[data-advice-for="backupTested"]')).toBeVisible();
});

test('advice survives a reload', async ({ page }) => {
  await page.goto('/#start');
  await page.locator('[data-bind="client.organisation"]').fill('Village Arts Trail');
  await page.locator('#pw-method').selectOption('browser');
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.locator('[data-advice-for="passwordsMethod"]')).toBeVisible();
});

test('backups ask where, how often and how far back, with advice', async ({ page }) => {
  await page.goto('/#start');
  const detail = page.locator('#backup-detail');
  await page.locator('#backup-method').selectOption('none');
  await expect(detail).toBeHidden();
  await page.locator('#backup-method').selectOption('builder-storage');
  await expect(detail).toBeVisible();
  await page.locator('#backup-where').selectOption('physical');
  await expect(page.locator('[data-advice-for="backupWhere"]')).toContainText('fire');
  await page.locator('#backup-frequency').selectOption('manual');
  await expect(page.locator('[data-advice-for="backupFrequency"]')).toBeVisible();
  await page.locator('#backup-keep').selectOption('latest');
  await expect(page.locator('[data-advice-for="backupKeep"]')).toBeVisible();
  await page.locator('#backup-method').selectOption('git');
  await expect(detail).toBeHidden();
  await expect(page.locator('[data-advice-for="backupKeep"]')).toBeHidden();
});
