export const LOOKUP = {
  domain: 'village-arts-trail.org', checkedAt: '2026-09-27T12:00:00Z',
  registration: { registrar: 'GoDaddy.com, LLC', expires: '2026-11-10T00:00:00Z' },
  dnsHost: 'GoDaddy', webHost: 'Vercel', emailHost: 'Own mail server on Amazon Web Services (a server someone manages)',
  senders: ['Amazon SES', 'Brevo'], spf: 'v=spf1 include:amazonses.com ~all', dmarc: null,
  certificate: { issuer: "Let's Encrypt", validTo: '2026-12-01T00:00:00Z', matchesName: true }, raw: {}, errors: [],
};

// Most tests replace the lookup module with a stub that returns LOOKUP.
export async function mockLookup(page) {
  const body = `export const RDAP_HOSTS = []; export const LOOKUP_SERVICES = [];
    export async function lookup(d) { return { ...${JSON.stringify(LOOKUP)}, domain: String(d).trim().toLowerCase() }; }
    export async function checkOldAddress(d) { return { domain: String(d).trim().toLowerCase(), checkedAt: '2026-09-27T12:00:00Z', notRegistered: false,
      registration: { registrar: 'Namecheap, Inc.', created: '2026-03-14T00:00:00Z', expires: '2027-03-14T00:00:00Z' }, webHost: 'Cloudflare', errors: [] }; }`;
  await page.route('**/lib/lookup.js', (route) => route.fulfill({ contentType: 'text/javascript', body }));
}

export async function fillExample(page) {
  await page.goto('/#start');
  await page.getByLabel('Name').first().fill('Anita');
  await page.locator('[data-bind="client.organisation"]').fill('Village Arts Trail');
  await step(page, 'Domains');
  await page.locator('#domain-input').fill('village-arts-trail.org');
  await page.getByRole('button', { name: 'Look up' }).click();
  await page.locator('.record').first().waitFor();
}

// The tool shows one step at a time: go to a step by its name in the list.
export async function step(page, name) {
  await page.locator('#steps a', { hasText: name }).click();
}
