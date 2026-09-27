// GET /api/lookup?domain=example.org
// Looks up public records for one domain and returns plain-English findings.
// Stateless: nothing is stored or logged. Only public information is fetched.

import tls from 'node:tls';
import {
  dnsProvider, webHost, emailHost, parseTxt, parseDmarc, parseRdap, isValidDomain,
} from './_lib/infer.js';

const DOH = 'https://cloudflare-dns.com/dns-query';
const TYPES = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, PTR: 12 };

async function dns(name, type) {
  const url = `${DOH}?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`DNS ${type} ${res.status}`);
  const j = await res.json();
  return (j.Answer || []).filter((a) => a.type === TYPES[type]).map((a) => a.data);
}

function reverseName(ip) {
  return ip.split('.').reverse().join('.') + '.in-addr.arpa';
}

async function ptr(ip) {
  try { return (await dns(reverseName(ip), 'PTR'))[0] || null; } catch { return null; }
}

async function rdap(domain) {
  const res = await fetch(`https://rdap.org/domain/${domain}`, {
    headers: { accept: 'application/rdap+json' }, redirect: 'follow', signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`RDAP ${res.status}`);
  return parseRdap(await res.json());
}

function tlsCert(host) {
  return new Promise((resolve) => {
    const sock = tls.connect({ host, port: 443, servername: host, timeout: 6000, rejectUnauthorized: false }, () => {
      const c = sock.getPeerCertificate();
      const ok = sock.authorized;
      sock.end();
      resolve(c && c.valid_to ? {
        issuer: c.issuer?.O || c.issuer?.CN || null,
        validTo: new Date(c.valid_to).toISOString(),
        matchesName: ok || sock.authorizationError !== 'ERR_TLS_CERT_ALTNAME_INVALID',
        trusted: ok,
      } : null);
    });
    sock.on('error', () => resolve(null));
    sock.on('timeout', () => { sock.destroy(); resolve(null); });
  });
}

async function settle(label, p, errors) {
  try { return await p; } catch (e) { errors.push(`${label}: ${e.message}`); return null; }
}

export async function lookup(domain) {
  const errors = [];
  const [a, ns, mx, txt, dmarcTxt, wwwCname, wwwA, reg, cert] = await Promise.all([
    settle('A', dns(domain, 'A'), errors),
    settle('NS', dns(domain, 'NS'), errors),
    settle('MX', dns(domain, 'MX'), errors),
    settle('TXT', dns(domain, 'TXT'), errors),
    settle('DMARC', dns(`_dmarc.${domain}`, 'TXT'), errors),
    settle('www', dns(`www.${domain}`, 'CNAME'), errors),
    settle('www A', dns(`www.${domain}`, 'A'), errors),
    settle('Registration', rdap(domain), errors),
    tlsCert(domain),
  ]);

  const mxList = (mx || []).map((r) => {
    const [pri, host] = String(r).split(/\s+/);
    return { priority: Number(pri), host: (host || '').replace(/\.$/, '') };
  }).sort((x, y) => x.priority - y.priority);

  let mailPtr = null;
  const firstMx = mxList[0]?.host;
  if (firstMx && (firstMx === domain || firstMx.endsWith('.' + domain))) {
    const ips = await settle('mail host', dns(firstMx, 'A'), errors);
    if (ips?.[0]) mailPtr = await ptr(ips[0]);
  }
  const sitePtr = a?.[0] ? await ptr(a[0]) : null;

  const { spf, senders } = parseTxt(txt || []);
  const dmarc = parseDmarc(dmarcTxt || []);

  return {
    domain,
    checkedAt: new Date().toISOString(),
    registration: reg,
    dnsHost: dnsProvider(ns || []),
    webHost: webHost({ a: (a && a.length ? a : wwwA || []), cname: wwwCname || [], ptr: sitePtr }),
    emailHost: emailHost(domain, mxList, mailPtr),
    senders,
    spf,
    dmarc,
    certificate: cert,
    raw: { a: a || [], ns: ns || [], mx: mxList, wwwCname: wwwCname || [] },
    errors,
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'GET only' })); }
  const url = new URL(req.url || '/', 'http://x');
  const domain = String(url.searchParams.get('domain') || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
  if (!isValidDomain(domain)) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'That does not look like a domain name.' })); }
  try {
    const out = await lookup(domain);
    res.statusCode = 200;
    res.end(JSON.stringify(out));
  } catch {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: 'The lookup failed. Try again in a moment.' }));
  }
}
