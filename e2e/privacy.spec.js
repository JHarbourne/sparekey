import { test, expect } from '@playwright/test';

// The real lookup, with the public services answered locally. Checks the
// promise on the "Check it yourself" page: a lookup only contacts public
// lookup services, never a Spare Key server and never the website itself.
const ALLOWED = ['localhost', '127.0.0.1', 'cloudflare-dns.com', 'data.iana.org', 'api.certspotter.com', 'rdap.publicinterestregistry.org'];

test('a lookup only contacts public lookup services', async ({ page }) => {
  const hosts = new Set();
  page.on('request', (r) => hosts.add(new URL(r.url()).hostname));
  await page.route('https://cloudflare-dns.com/**', (route) => {
    const u = new URL(route.request().url());
    const type = u.searchParams.get('type');
    const Answer = type === 'A' ? [{ type: 1, data: '76.76.21.21' }]
      : type === 'MX' ? [{ type: 15, data: '10 aspmx.l.google.com.' }] : [];
    return route.fulfill({ json: { Answer }, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.route('https://data.iana.org/**', (route) => route.fulfill({ json: { services: [[['org'], ['https://rdap.publicinterestregistry.org/rdap/']]] }, headers: { 'access-control-allow-origin': '*' } }));
  await page.route('https://rdap.publicinterestregistry.org/**', (route) => route.fulfill({ json: { events: [{ eventAction: 'expiration', eventDate: '2027-01-01T00:00:00Z' }] }, headers: { 'access-control-allow-origin': '*' } }));
  await page.route('https://api.certspotter.com/**', (route) => route.fulfill({ json: [], headers: { 'access-control-allow-origin': '*' } }));

  await page.goto('/#start');
  await page.locator('#domain-input').fill('village-arts-trail.org');
  await page.getByRole('button', { name: 'Look up' }).click();
  await expect(page.locator('.record h3')).toHaveText('village-arts-trail.org');
  await expect(page.locator('.record')).toContainText('Vercel');
  for (const h of hosts) expect(ALLOWED, `unexpected request to ${h}`).toContain(h);
  expect(hosts.has('village-arts-trail.org')).toBe(false);
});

test('the check page lists the services and the no-password rule', async ({ page }) => {
  await page.goto('/check');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('You shouldn’t have to take our word for it');
  await expect(page.locator('.svc-table')).toContainText('cloudflare-dns.com');
  await expect(page.locator('footer')).toContainText('Spare Key never asks for a password');
});

test('the Word and Excel templates download', async ({ page, request }) => {
  await page.goto('/guide#templates');
  for (const name of ['Word template', 'Excel inventory']) {
    const href = await page.getByRole('link', { name: new RegExp(name) }).getAttribute('href');
    const res = await request.get(`/${href}`);
    expect(res.status()).toBe(200);
    expect((await res.body()).subarray(0, 2).toString()).toBe('PK'); // a real Office file
  }
});

test('the domain policy page checks an old address from the browser', async ({ page, request }) => {
  await page.route('https://data.iana.org/**', (route) => route.fulfill({ json: { services: [[['uk'], ['https://rdap.nominet.uk/uk/']]] }, headers: { 'access-control-allow-origin': '*' } }));
  await page.route('https://rdap.nominet.uk/**', (route) => route.fulfill({ json: { events: [{ eventAction: 'registration', eventDate: new Date(Date.now() - 200 * 864e5).toISOString() }] }, headers: { 'access-control-allow-origin': '*' } }));
  await page.route('https://cloudflare-dns.com/**', (route) => route.fulfill({ json: { Answer: [] }, headers: { 'access-control-allow-origin': '*' } }));
  await page.goto('/domain-policy');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Keep your old web addresses, or someone else will');
  await page.locator('#oc-input').fill('old-name.org.uk');
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.locator('#oc-result')).toContainText('probably belongs to someone else now');
  const res = await request.get('/templates/spare-key-domain-policy.docx');
  expect(res.status()).toBe(200);
});
