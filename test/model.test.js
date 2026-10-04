import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyInventory, servicesFromLookup, mergeServices, validateInventory } from '../lib/model.js';
import { assessRisks } from '../lib/risks.js';

const tollesbury = {
  domain: 'tollesbury.art',
  registration: { registrar: 'GoDaddy.com, LLC', expires: '2026-11-10T00:00:00Z' },
  dnsHost: 'GoDaddy',
  webHost: 'Vercel',
  emailHost: 'Own mail server on Amazon Web Services (a server someone manages)',
  senders: ['Amazon SES', 'Brevo', 'A server listed by address'],
  spf: 'v=spf1 ip4:35.176.133.122 include:spf.brevo.com include:amazonses.com ~all',
  dmarc: null,
  certificate: { issuer: "Let's Encrypt", validTo: '2026-12-01T00:00:00Z', matchesName: true },
};
const NOW = new Date('2026-09-27T12:00:00Z').getTime();

test('lookup becomes draft services', () => {
  const s = servicesFromLookup(tollesbury);
  assert.deepEqual(s.map((x) => x.kind), ['registration', 'dns', 'website', 'email', 'sending', 'sending']);
  assert.equal(s[0].renews, '2026-11-10');
});

test('merge does not duplicate and updates changed providers', () => {
  const first = servicesFromLookup(tollesbury);
  const again = mergeServices(first, servicesFromLookup(tollesbury));
  assert.equal(again.length, first.length);
  const moved = { ...tollesbury, emailHost: 'Apple iCloud+', senders: [] };
  const after = mergeServices(again, servicesFromLookup(moved));
  assert.equal(after.find((x) => x.kind === 'email').provider, 'Apple iCloud+');
});

test('risks reflect the real Tollesbury situation', () => {
  const inv = emptyInventory();
  inv.builder.name = 'Jonathan';
  inv.domains = [{ name: 'tollesbury.art', lookup: tollesbury }];
  inv.services = servicesFromLookup(tollesbury).map((s) => ({ ...s, accountOwner: 'builder', paidBy: 'builder' }));
  const titles = assessRisks(inv, NOW).map((r) => `${r.level}: ${r.title}`);
  assert.ok(titles.includes('high: No emergency contact'));
  assert.ok(titles.some((t) => t.startsWith('high: Email for tollesbury.art runs on a privately managed server')));
  assert.ok(titles.some((t) => t.startsWith('medium: tollesbury.art registration renews in 43 days')));
  assert.ok(titles.some((t) => t === 'high: Only Jonathan can manage tollesbury.art website'));
  assert.ok(titles.some((t) => t === 'low: tollesbury.art has no DMARC record'));
  assert.equal(assessRisks(inv, NOW)[0].level, 'high');
});

test('a well set-up client has few risks', () => {
  const inv = emptyInventory();
  Object.assign(inv, { passwordsMethod: 'shared-client', twoFactor: 'shared', backupMethod: 'client-storage', backupTested: 'year' });
  inv.emergency.name = 'Pat';
  inv.services = servicesFromLookup({ ...tollesbury, emailHost: 'Google (Gmail / Workspace)', senders: [], dmarc: { policy: 'reject' } })
    .map((s) => ({ ...s, accountOwner: 'client', paidBy: 'client', secondAdmin: 'yes', autoRenew: 'yes', renews: s.kind === 'registration' ? '2027-11-10' : '' }));
  assert.deepEqual(assessRisks(inv, NOW), []);
});

test('loading a file validates format', () => {
  assert.throws(() => validateInventory({ hello: 1 }), /not a handover inventory/);
  const inv = validateInventory({ format: 'sparekey-inventory', version: 1, client: { name: 'A' }, services: [{ kind: 'dns' }] });
  assert.equal(inv.client.name, 'A');
  assert.equal(inv.client.email, '');
  assert.equal(inv.client.phone, '');
  assert.ok(inv.services[0].id);
});

test('discovered sites and linked accounts become services to complete', async () => {
  const { servicesFromLookup } = await import('../lib/model.js');
  const s = servicesFromLookup({ domain: 'example.org', senders: [], linked: [{ name: 'Google Search Console', kind: 'other' }, { name: 'Mailchimp', kind: 'sending' }],
    subdomains: [{ name: 'shop.example.org', host: 'Shopify' }] });
  assert.ok(s.some((x) => x.kind === 'other' && x.provider === 'Google Search Console'));
  assert.ok(s.some((x) => x.kind === 'sending' && x.provider === 'Mailchimp'));
  assert.ok(s.some((x) => x.kind === 'website' && x.domain === 'shop.example.org' && x.provider === 'Shopify'));
});
