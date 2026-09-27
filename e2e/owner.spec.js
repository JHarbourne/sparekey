import { test, expect } from '@playwright/test';
import { mockLookup } from './fixtures.js';

test.beforeEach(async ({ page }) => { await mockLookup(page); });

test('owner asks for a handover, builder opens the link pre-filled', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('link', { name: 'I own a website' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('never stuck without them');

  // validation
  await page.getByRole('button', { name: 'Create my request' }).click();
  await expect(page.locator('#err-name')).toBeVisible();
  await expect(page.getByLabel('Your name')).toBeFocused();

  await page.getByLabel('Your name').fill('Anita Smith');
  await page.getByLabel(/Organisation/).fill('Village Arts Trail');
  await page.getByLabel('Your email').fill('anita@example.org');
  await page.getByLabel('Their name').fill('Jonathan');
  await page.getByLabel('Their email').fill('jonathan@example.org');
  await page.getByLabel('Your website addresses').fill('https://www.village-arts-trail.org/');
  await page.getByRole('button', { name: 'Create my request' }).click();

  await expect(page.getByRole('heading', { name: 'Your request is ready' })).toBeVisible();
  await expect(page.locator('#send-email')).toHaveAttribute('href', /^mailto:jonathan%40example\.org\?subject=Handover%20for%20Village%20Arts%20Trail/);
  await expect(page.locator('#qc-results')).toContainText('Your website is hosted by Vercel.');
  await expect(page.locator('#qc-results')).toContainText('Worth asking about');

  await page.getByRole('button', { name: 'Copy just the link' }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/\/#start\/r=/);

  // the builder opens the link
  const builder = await context.newPage();
  await mockLookup(builder);
  await builder.goto(link);
  await expect(builder.locator('#request-banner')).toContainText('Anita Smith at Village Arts Trail asked you for a handover of village-arts-trail.org');
  await expect(builder.locator('[data-bind="client.organisation"]')).toHaveValue('Village Arts Trail');
  await expect(builder.locator('.record h3')).toHaveText('village-arts-trail.org');
  await expect(builder).toHaveURL(/#start$/); // the request was removed from the address bar
  await expect(builder.locator('#reply-link')).toHaveAttribute('href', /^mailto:anita%40example\.org/);
});

test('a request does not silently replace another client’s draft', async ({ page, context }) => {
  await page.goto('/#start');
  await page.locator('[data-bind="client.organisation"]').fill('Other Client');
  await page.locator('[data-bind="client.organisation"]').blur();
  await page.waitForTimeout(400);
  const { encodeRequest } = await import('../lib/request.js');
  const r = encodeRequest({ name: 'Anita', organisation: 'Village Arts Trail', email: 'a@example.org', domains: ['village-arts-trail.org'] });
  await page.goto(`/#start/r=${r}`);
  await page.reload();
  await expect(page.locator('#request-banner')).toContainText('You have a draft for Other Client');
  await page.getByRole('button', { name: 'Keep my draft' }).click();
  await expect(page.locator('[data-bind="client.organisation"]')).toHaveValue('Other Client');
});

test('guide FAQ filter narrows the questions', async ({ page }) => {
  await page.goto('/guide');
  await page.fill('#faq-filter', 'password');
  await expect(page.locator('#faq-count')).toContainText('of');
  const visible = await page.locator('#faqs .faq:visible').count();
  expect(visible).toBeGreaterThan(0);
  expect(visible).toBeLessThan(await page.locator('#faqs .faq').count());
});
