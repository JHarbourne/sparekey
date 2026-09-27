import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeRequest, decodeRequest, cleanDomains, requestEmail, requestLink } from '../lib/request.js';

const req = { name: 'Anita Smith', organisation: 'Village Arts Trail', email: 'anita@example.org',
  domains: ['village-arts-trail.org'], builderName: 'Jonathan', message: 'Thanks — no rush! Ünïcode ✓' };

test('round-trips a request through the link fragment, including Unicode', () => {
  const back = decodeRequest(encodeRequest(req));
  assert.deepEqual(back, req);
});

test('rejects rubbish and caps lengths', () => {
  assert.equal(decodeRequest('not-base64!!'), null);
  const long = decodeRequest(encodeRequest({ ...req, message: 'x'.repeat(5000) }));
  assert.equal(long.message.length, 600);
});

test('cleans website addresses', () => {
  assert.deepEqual(cleanDomains('https://www.Example.org/about\nexample.org, shop.example.co.uk bad_domain'),
    ['example.org', 'shop.example.co.uk']);
});

test('the builder email address is never put in the link', () => {
  const link = requestLink('https://sparekey.dev', { ...req, builderEmail: 'secret@builder.test' });
  assert.ok(!Buffer.from(link.split('r=')[1], 'base64').toString().includes('builder.test'));
  assert.match(link, /^https:\/\/sparekey\.dev\/#start\/r=[A-Za-z0-9_-]+$/);
});

test('email is plain and includes the link', () => {
  const m = requestEmail(req, 'https://sparekey.dev/#start/r=abc');
  assert.match(m.body, /^Hi Jonathan,/);
  assert.match(m.body, /https:\/\/sparekey\.dev\/#start\/r=abc/);
  assert.equal(m.subject, 'Handover for Village Arts Trail');
});
