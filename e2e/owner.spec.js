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
  await page.locator('input[name=builderName]').fill('Jonathan');
  await page.locator('input[name=builderEmail]').fill('jonathan@example.org');
  await page.getByLabel('Your website addresses').fill('https://www.village-arts-trail.org/');
  await page.getByRole('button', { name: 'Create my request' }).click();

  await expect(page.getByRole('heading', { name: 'Your request is ready' })).toBeVisible();
  await expect(page.locator('#send-email')).toHaveAttribute('href', /^mailto:jonathan%40example\.org\?subject=Website%20continuity%20plan%20for%20Village%20Arts%20Trail/);
  await expect(page.locator('#qc-results')).toContainText('Your website is hosted by Vercel.');
  await expect(page.locator('#qc-results')).toContainText('Worth asking about');

  await page.getByRole('button', { name: 'Copy just the link' }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/\/#start\/r=/);

  // the builder opens the link
  const builder = await context.newPage();
  await mockLookup(builder);
  await builder.goto(link);
  await expect(builder.locator('#request-banner')).toContainText('Anita Smith at Village Arts Trail asked you for a website continuity plan for village-arts-trail.org');
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

test('the owner can have the plan sent to their IT lead instead', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/ask');
  await page.getByLabel('Your name').fill('Anita Smith');
  await page.getByLabel('Your email').fill('anita@example.org');
  await page.getByLabel('Your website addresses').fill('village-arts-trail.org');
  await page.getByLabel('Someone else, such as our IT or security lead').check();
  await page.getByRole('button', { name: 'Create my request' }).click();
  await expect(page.locator('#err-to')).toBeVisible();
  await page.locator('input[name=toRole]').fill('IT manager');
  await page.locator('input[name=toEmail]').fill('it@example.org');
  await page.getByRole('button', { name: 'Create my request' }).click();
  await expect(page.locator('#email-preview')).toContainText('to our IT manager at it@example.org');
  await page.getByRole('button', { name: 'Copy just the link' }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());

  const builder = await context.newPage();
  await mockLookup(builder);
  await builder.goto(link);
  await expect(builder.locator('#request-banner')).toContainText('They’d like it sent to our IT manager.');
  await expect(builder.locator('#reply-link')).toHaveAttribute('href', /^mailto:it%40example\.org/);
  await expect(builder.locator('#reply-link')).toHaveText('Email the plan to the IT manager');
});
