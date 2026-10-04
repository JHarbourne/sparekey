// Email and phone boxes warn when something doesn't look right, without blocking.
import { test, expect } from '@playwright/test';

test('email and phone are checked when you leave the box', async ({ page }) => {
  await page.goto('/#start');
  const email = page.locator('[data-bind="client.email"]');
  const err = page.locator('#err-client-email');
  await email.fill('anita@example');
  await email.blur();
  await expect(err).toBeVisible();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await email.fill('anita@example.org');
  await expect(err).toBeHidden();

  const phone = page.locator('[data-bind="emergency.phone"]');
  await phone.fill('123');
  await phone.blur();
  await expect(page.locator('#err-emergency-phone')).toContainText('too short');
  await phone.fill('07700 900123');
  await phone.blur();
  await expect(page.locator('#err-emergency-phone')).toBeHidden();
});
