export const LOOKUP = {
  domain: 'village-arts-trail.org', checkedAt: '2026-09-27T12:00:00Z',
  registration: { registrar: 'GoDaddy.com, LLC', expires: '2026-11-10T00:00:00Z' },
  dnsHost: 'GoDaddy', webHost: 'Vercel', emailHost: 'Own mail server on Amazon Web Services (a server someone manages)',
  senders: ['Amazon SES', 'Brevo'], spf: 'v=spf1 include:amazonses.com ~all', dmarc: null,
  certificate: { issuer: "Let's Encrypt", validTo: '2026-12-01T00:00:00Z', matchesName: true }, raw: {}, errors: [],
};

export async function mockLookup(page) {
  await page.route('**/api/lookup**', (route) => {
    const d = new URL(route.request().url()).searchParams.get('domain');
    return route.fulfill({ json: { ...LOOKUP, domain: d } });
  });
}

export async function fillExample(page) {
  await page.goto('/#start');
  await page.getByLabel('Name').first().fill('Anita');
  await page.getByLabel('Organisation').fill('Village Arts Trail');
  await page.locator('#domain-input').fill('village-arts-trail.org');
  await page.getByRole('button', { name: 'Look up' }).click();
  await page.locator('.record').first().waitFor();
}
