import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/lookup.js';

const answers = {
  'simon-edge.com|1': ['185.230.63.171'],
  'simon-edge.com|2': ['ns14.wixdns.net.', 'ns15.wixdns.net.'],
  'simon-edge.com|15': ['10 aspmx.l.google.com.'],
  'simon-edge.com|16': ['"v=spf1 include:_spf.google.com ~all"'],
  '_dmarc.simon-edge.com|16': ['"v=DMARC1; p=none"'],
};
const TYPE = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, PTR: 12 };

function mockFetch() {
  globalThis.fetch = async (url) => {
    const u = new URL(url);
    if (u.hostname === 'rdap.org') {
      return new Response(JSON.stringify({ events: [{ eventAction: 'expiration', eventDate: '2027-05-01T00:00:00Z' }],
        entities: [{ roles: ['registrar'], vcardArray: ['vcard', [['fn', {}, 'text', 'Wix.com Ltd.']]] }] }), { status: 200 });
    }
    const name = u.searchParams.get('name'); const t = TYPE[u.searchParams.get('type')];
    const data = answers[`${name}|${t}`] || [];
    return new Response(JSON.stringify({ Answer: data.map((d) => ({ type: t, data: d })) }), { status: 200 });
  };
}
function call(url) {
  return new Promise((resolve) => {
    const res = { headers: {}, statusCode: 0, setHeader(k, v) { this.headers[k] = v; }, end(b) { resolve({ status: this.statusCode, body: JSON.parse(b) }); } };
    handler({ method: 'GET', url }, res);
  });
}

test('rejects things that are not domains', async () => {
  const r = await call('/api/lookup?domain=hello%20world');
  assert.equal(r.status, 400);
});

test('describes Simon’s current setup', async () => {
  mockFetch();
  const r = await call('/api/lookup?domain=https://www.Simon-Edge.com/about');
  assert.equal(r.status, 200);
  assert.equal(r.body.domain, 'simon-edge.com');
  assert.equal(r.body.dnsHost, 'Wix');
  assert.equal(r.body.webHost, 'Wix');
  assert.equal(r.body.emailHost, 'Google (Gmail / Workspace)');
  assert.deepEqual(r.body.senders, ['Google']);
  assert.equal(r.body.registration.registrar, 'Wix.com Ltd.');
  assert.equal(r.body.dmarc.policy, 'none');
});
