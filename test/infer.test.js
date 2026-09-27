import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dnsProvider, webHost, emailHost, parseTxt, parseDmarc, parseRdap, isValidDomain } from '../api/_lib/infer.js';

test('DNS providers from real nameservers', () => {
  assert.equal(dnsProvider(['ns47.domaincontrol.com.', 'ns48.domaincontrol.com.']), 'GoDaddy');
  assert.equal(dnsProvider(['darwin.ns.cloudflare.com.']), 'Cloudflare');
  assert.equal(dnsProvider(['ns-1155.awsdns-16.org.']), 'Amazon Route 53');
  assert.equal(dnsProvider(['ns14.wixdns.net.']), 'Wix');
  assert.match(dnsProvider(['ns1.example-dns.net.']), /^Unrecognised/);
  assert.equal(dnsProvider([]), null);
});

test('Web hosts from IPs, CNAMEs and reverse DNS', () => {
  assert.equal(webHost({ a: ['76.76.21.21'] }), 'Vercel');
  assert.equal(webHost({ a: ['216.198.79.1'] }), 'Vercel');
  assert.equal(webHost({ a: ['185.230.63.171'] }), 'Wix');
  assert.equal(webHost({ cname: ['2dbc743ea05a1df8.vercel-dns-017.com.'] }), 'Vercel');
  assert.equal(webHost({ a: ['104.21.3.4'] }), 'Cloudflare (proxied)');
  assert.match(webHost({ a: ['35.176.133.122'], ptr: 'ec2-35-176-133-122.eu-west-2.compute.amazonaws.com.' }), /Amazon Web Services/);
  assert.match(webHost({ a: ['9.9.9.9'] }), /^Unrecognised server/);
});

test('Email hosts', () => {
  assert.equal(emailHost('simon-edge.com', [{ priority: 10, host: 'aspmx.l.google.com' }]), 'Google (Gmail / Workspace)');
  assert.equal(emailHost('saltmarshpress.com', [{ priority: 10, host: 'mx01.mail.icloud.com' }]), 'Apple iCloud+');
  assert.equal(emailHost('tollesbury.art', [{ priority: 10, host: 'mail.tollesbury.art' }], 'ec2-35-176-133-122.eu-west-2.compute.amazonaws.com'),
    'Own mail server on Amazon Web Services (a server someone manages)');
  assert.equal(emailHost('x.org', []), null);
});

test('SPF senders and DMARC', () => {
  const t = parseTxt(['"brevo-code:abc"', '"v=spf1 ip4:35.176.133.122 include:spf.brevo.com include:amazonses.com ~all"']);
  assert.deepEqual(t.senders, ['Amazon SES', 'Brevo', 'A server listed by address']);
  assert.equal(parseTxt(['v=spf1 include:icloud.com ~all']).senders[0], 'Apple iCloud+');
  assert.equal(parseTxt(['v=spf1 -all']).senders.length, 0);
  assert.equal(parseDmarc(['v=DMARC1; p=quarantine; adkim=r']).policy, 'quarantine');
  assert.equal(parseDmarc(['something']), null);
});

test('RDAP parsing', () => {
  const r = parseRdap({
    events: [{ eventAction: 'expiration', eventDate: '2027-03-01T00:00:00Z' }, { eventAction: 'registration', eventDate: '2020-03-01T00:00:00Z' }],
    entities: [{ roles: ['registrar'], vcardArray: ['vcard', [['version', {}, 'text', '4.0'], ['fn', {}, 'text', 'GoDaddy.com, LLC']]] }],
  });
  assert.equal(r.registrar, 'GoDaddy.com, LLC');
  assert.equal(r.expires, '2027-03-01T00:00:00Z');
});

test('Domain validation', () => {
  assert.ok(isValidDomain('lgbthistoryuk.org'));
  assert.ok(isValidDomain('lgbtarchive.org.uk'));
  assert.ok(!isValidDomain('not a domain'));
  assert.ok(!isValidDomain('http://x.com'));
});
