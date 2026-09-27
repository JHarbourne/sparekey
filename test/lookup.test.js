import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lookup, pickCertificate, cleanDomain, RDAP_HOSTS } from '../lib/lookup.js';

const answers = {
  'simon-edge.com|1': ['185.230.63.171'],
  'simon-edge.com|2': ['ns14.wixdns.net.', 'ns15.wixdns.net.'],
  'simon-edge.com|15': ['10 aspmx.l.google.com.'],
  'simon-edge.com|16': ['"v=spf1 include:_spf.google.com ~all"'],
  '_dmarc.simon-edge.com|16': ['"v=DMARC1; p=none"'],
};
const TYPE = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, PTR: 12 };
const seen = new Set();

globalThis.fetch = async (url) => {
  const u = new URL(url);
  seen.add(u.hostname);
  if (u.hostname === 'data.iana.org') {
    return new Response(JSON.stringify({ services: [[['com', 'net'], ['https://rdap.verisign.com/com/v1/']], [['zz'], ['https://rdap.unknown.example/']]] }));
  }
  if (u.hostname === 'rdap.verisign.com') {
    assert.equal(u.pathname, '/com/v1/domain/simon-edge.com');
    return new Response(JSON.stringify({ events: [{ eventAction: 'expiration', eventDate: '2027-05-01T00:00:00Z' }],
      entities: [{ roles: ['registrar'], vcardArray: ['vcard', [['fn', {}, 'text', 'Wix.com Ltd.']]] }] }));
  }
  if (u.hostname === 'api.certspotter.com') {
    return new Response(JSON.stringify([{ dns_names: ['simon-edge.com', 'www.simon-edge.com'], issuer: { friendly_name: "Let's Encrypt" },
      not_before: '2020-01-01T00:00:00Z', not_after: '2099-01-01T00:00:00Z', revoked: false }]));
  }
  const name = u.searchParams.get('name'); const t = TYPE[u.searchParams.get('type')];
  const data = answers[`${name}|${t}`] || [];
  return new Response(JSON.stringify({ Answer: data.map((d) => ({ type: t, data: d })) }));
};

test('rejects things that are not domains', async () => {
  await assert.rejects(lookup('hello world'), /does not look like a domain/);
});

test('cleans pasted addresses', () => {
  assert.equal(cleanDomain('https://www.Simon-Edge.com/about?x=1'), 'simon-edge.com');
});

test('describes Simon’s current setup, from the browser', async () => {
  const r = await lookup('https://www.Simon-Edge.com/about');
  assert.equal(r.domain, 'simon-edge.com');
  assert.equal(r.dnsHost, 'Wix');
  assert.equal(r.webHost, 'Wix');
  assert.equal(r.emailHost, 'Google (Gmail / Workspace)');
  assert.deepEqual(r.senders, ['Google']);
  assert.equal(r.registration.registrar, 'Wix.com Ltd.');
  assert.equal(r.dmarc.policy, 'none');
  assert.equal(r.certificate.issuer, "Let's Encrypt");
  assert.ok(!seen.has('simon-edge.com') && !seen.has('www.simon-edge.com'), 'never connects to the website itself');
});

test('a registry that is not on the list is skipped, not contacted', async () => {
  answers['example.zz|1'] = ['1.2.3.4'];
  const r = await lookup('example.zz');
  assert.equal(r.registration, null);
  assert.ok(!seen.has('rdap.unknown.example'));
});

test('picks the newest current certificate, including wildcards', () => {
  const now = Date.parse('2026-09-27T00:00:00Z');
  const c = pickCertificate('shop.example.org', [
    { dns_names: ['shop.example.org'], not_before: '2026-01-01T00:00:00Z', not_after: '2026-03-01T00:00:00Z' },
    { dns_names: ['*.example.org'], not_before: '2026-09-01T00:00:00Z', not_after: '2026-12-01T00:00:00Z', issuer: { name: 'R11' } },
    { dns_names: ['shop.example.org'], not_before: '2026-09-01T00:00:00Z', not_after: '2027-01-01T00:00:00Z', revoked: true },
  ], now);
  assert.deepEqual(c, { found: true, issuer: 'R11', validTo: '2026-12-01T00:00:00.000Z' });
  assert.deepEqual(pickCertificate('x.org', [], now), { found: false });
});

test('the page may only contact the lookup services (CSP matches the code)', () => {
  const cfg = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const csp = cfg.headers[0].headers.find((h) => h.key === 'Content-Security-Policy').value;
  const connect = csp.split(';').map((s) => s.trim()).find((s) => s.startsWith('connect-src')).split(/\s+/).slice(1);
  const expected = ["'self'", 'https://cloudflare-dns.com', 'https://data.iana.org', 'https://api.certspotter.com',
    ...RDAP_HOSTS.map((h) => `https://${h}`), 'https://eu.i.posthog.com', 'https://eu-assets.i.posthog.com'];
  assert.deepEqual(connect.sort(), expected.sort());
  assert.ok(!connect.some((c) => c === 'https:' || c.includes('*')), 'no wildcards');
});
