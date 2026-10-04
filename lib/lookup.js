// Looks up the public records for one domain, directly from the visitor's
// browser. Nothing goes through a Spare Key server. The only places a domain
// name is sent are the public lookup services listed in LOOKUP_SERVICES, and
// the page's Content-Security-Policy (vercel.json) blocks every other address.
import {
  dnsProvider, webHost, emailHost, parseTxt, parseDmarc, parseRdap, isValidDomain,
  parseVerifications, DKIM_SELECTORS, subdomainsFromCertificates,
} from './infer.js';

const DOH = 'https://cloudflare-dns.com/dns-query';
const IANA = 'https://data.iana.org/rdap/dns.json';
const CT = 'https://api.certspotter.com/v1/issuances';

// Registries whose public records we read. Covers .com, .net, .org, .uk, .dev,
// .app, .art, .scot, most new endings and many country endings. A domain whose
// registry is not listed still works; only its renewal date is left blank.
export const RDAP_HOSTS = [
  'pubapi.registry.google', 'rdap.blog.fury.ca', 'rdap.ca.fury.ca', 'rdap.cctld.au', 'rdap.centralnic.com',
  'rdap.dns.pl', 'rdap.eco.fury.ca', 'rdap.fi', 'rdap.gmoregistry.net', 'rdap.identitydigital.services',
  'rdap.isnic.is', 'rdap.nic.biz', 'rdap.nic.club', 'rdap.nic.design', 'rdap.nic.earth', 'rdap.nic.fr',
  'rdap.nic.garden', 'rdap.nic.health', 'rdap.nic.law', 'rdap.nic.ly', 'rdap.nic.one', 'rdap.nic.scot',
  'rdap.nic.tv', 'rdap.nic.yoga', 'rdap.nixiregistry.in', 'rdap.nominet.uk', 'rdap.norid.no',
  'rdap.publicinterestregistry.org', 'rdap.radix.host', 'rdap.registry.bar', 'rdap.registry.cloud',
  'rdap.registry.love', 'rdap.registryservices.music', 'rdap.sidn.nl', 'rdap.tonicregistry.to',
  'rdap.verisign.com', 'tld-rdap.verisign.com',
];

// Everything the page is allowed to talk to, in plain English. Shown on the
// "Check it yourself" page and checked against vercel.json by a test.
export const LOOKUP_SERVICES = [
  { host: 'cloudflare-dns.com', who: 'Cloudflare public DNS', why: 'reads the DNS records: where the website and email point' },
  { host: 'data.iana.org', who: 'IANA', why: 'the official list of which registry looks after each domain ending' },
  { host: 'api.certspotter.com', who: 'Cert Spotter (SSLMate)', why: 'reads the public log of security certificates, which also lists the other sites on a domain' },
  { host: '(the registry for the ending)', who: 'Domain registries such as Nominet, Verisign and PIR', why: 'the public registration record: registrar and renewal date' },
];

const TYPES = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, PTR: 12 };
const timeout = (ms) => (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined);

async function dns(name, type) {
  const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${type}`, {
    headers: { accept: 'application/dns-json' }, signal: timeout(6000), credentials: 'omit', referrerPolicy: 'no-referrer',
  });
  if (!res.ok) throw new Error(`DNS ${type} ${res.status}`);
  const j = await res.json();
  return (j.Answer || []).filter((a) => a.type === TYPES[type]).map((a) => a.data);
}
const reverseName = (ip) => ip.split('.').reverse().join('.') + '.in-addr.arpa';
async function ptr(ip) { try { return (await dns(reverseName(ip), 'PTR'))[0] || null; } catch { return null; } }

let bootstrap = null;
async function rdapBase(suffix) {
  if (!bootstrap) {
    bootstrap = (async () => {
      const r = await fetch(IANA, { signal: timeout(6000), credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!r.ok) throw new Error(`registry list ${r.status}`);
      const map = new Map();
      for (const [tlds, urls] of (await r.json()).services) for (const t of tlds) map.set(t.toLowerCase(), urls.find((u) => u.startsWith('https')) || null);
      return map;
    })().catch((e) => { bootstrap = null; throw e; });
  }
  return (await bootstrap).get(suffix) || null;
}

async function rdap(domain) {
  const labels = domain.split('.');
  let base = null;
  for (let i = 1; i < labels.length && !base; i++) base = await rdapBase(labels.slice(i).join('.'));
  if (!base) throw new Error('no public registration record for this ending');
  if (!RDAP_HOSTS.includes(new URL(base).hostname)) throw new Error('this registry is not on Spare Key’s list yet');
  const res = await fetch(`${base.replace(/\/?$/, '/')}domain/${domain}`, {
    headers: { accept: 'application/rdap+json, application/json' }, signal: timeout(8000), credentials: 'omit', referrerPolicy: 'no-referrer',
  });
  if (res.status === 404) return { notRegistered: true };
  if (!res.ok) throw new Error(`registry ${res.status}`);
  return parseRdap(await res.json());
}

// The newest unexpired certificate for the name, from public Certificate
// Transparency logs. We never connect to the website itself.
export function pickCertificate(domain, issuances, now = Date.now()) {
  const parent = domain.split('.').slice(1).join('.');
  const covers = (n) => n === domain || n === `*.${parent}`;
  const live = (issuances || []).filter((c) => !c.revoked && (c.dns_names || []).some(covers) && Date.parse(c.not_after) > now
    && Date.parse(c.not_before) <= now);
  if (!live.length) return { found: false };
  const c = live.sort((a, b) => Date.parse(b.not_after) - Date.parse(a.not_after))[0];
  return { found: true, issuer: c.issuer?.friendly_name || c.issuer?.name || null, validTo: new Date(c.not_after).toISOString() };
}
// One request gives both the current certificate and the subdomains that have
// had certificates, which is how forgotten sites on a domain come to light.
async function certificate(domain) {
  const res = await fetch(`${CT}?domain=${encodeURIComponent(domain)}&include_subdomains=true&expand=dns_names&expand=issuer`, {
    signal: timeout(8000), credentials: 'omit', referrerPolicy: 'no-referrer',
  });
  if (!res.ok) throw new Error(`certificate log ${res.status}`);
  const list = await res.json();
  return { ...pickCertificate(domain, list), subdomains: subdomainsFromCertificates(domain, list) };
}

// Which host each subdomain points at. Names that no longer resolve are left out.
async function describeSubdomains(names, errors) {
  const out = await Promise.all(names.slice(0, 12).map(async (name) => {
    const [cname, a] = await Promise.all([settle(`${name} CNAME`, dns(name, 'CNAME'), []), settle(`${name} A`, dns(name, 'A'), [])]);
    if (!(cname || []).length && !(a || []).length) return null;
    return { name, host: webHost({ a: a || [], cname: cname || [] }) };
  }));
  void errors;
  return out.filter(Boolean);
}

// Services that sign email for the domain, found by their DKIM selector.
async function dkimServices(domain) {
  const found = await Promise.all(DKIM_SELECTORS.map(async ([sel, name]) => {
    try { return (await dns(`${sel}._domainkey.${domain}`, 'TXT')).length ? name : null; } catch { return null; }
  }));
  return found.filter(Boolean);
}

async function settle(label, p, errors) {
  try { return await p; } catch (e) { errors.push(`${label}: ${e.message}`); return null; }
}

export function cleanDomain(input) {
  return String(input || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[/?#].*$/, '').replace(/^www\./, '');
}

export async function lookup(input) {
  const domain = cleanDomain(input);
  if (!isValidDomain(domain)) throw new Error('That does not look like a domain name.');
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
    settle('Certificate', certificate(domain), errors),
  ]);
  if (!a && !ns && !mx) throw new Error('The public DNS service did not answer. Check your connection and try again.');
  // A misspelt or unregistered name: say so, rather than adding an empty record.
  if (reg?.notRegistered || (!(a || []).length && !(ns || []).length && !(mx || []).length && !(wwwA || []).length && !(wwwCname || []).length)) {
    throw new Error(`nothing was found for ${domain}. Check the spelling. It may not be registered.`);
  }

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
  const [subdomains, dkim] = await Promise.all([
    describeSubdomains(cert?.subdomains || [], errors),
    dkimServices(domain),
  ]);
  const linked = parseVerifications(txt || []);
  for (const name of dkim) if (!senders.includes(name) && !linked.some((x) => x.name === name)) linked.push({ name, kind: 'sending' });

  return {
    domain,
    checkedAt: new Date().toISOString(),
    registration: reg,
    dnsHost: dnsProvider(ns || []),
    webHost: webHost({ a: (a && a.length ? a : wwwA || []), cname: wwwCname || [], ptr: sitePtr }),
    emailHost: emailHost(domain, mxList, mailPtr),
    senders,
    spf,
    dmarc: parseDmarc(dmarcTxt || []),
    certificate: cert && cert.found ? { issuer: cert.issuer, validTo: cert.validTo, source: 'certificate log' } : (cert ? { missing: true } : null),
    subdomains,
    linked: linked.filter((x) => !senders.includes(x.name)),
    raw: { a: a || [], ns: ns || [], mx: mxList, wwwCname: wwwCname || [] },
    errors,
  };
}

// An address the organisation used to use. Is it still registered, since
// when, and what does it point at now? A recent registration date on an old
// address usually means someone else has bought it.
export async function checkOldAddress(input) {
  const domain = cleanDomain(input);
  if (!isValidDomain(domain)) throw new Error('That does not look like a domain name.');
  const errors = [];
  const [reg, a, wwwCname] = await Promise.all([
    settle('Registration', rdap(domain), errors),
    settle('A', dns(domain, 'A'), errors),
    settle('www', dns(`www.${domain}`, 'CNAME'), errors),
  ]);
  const sitePtr = a?.[0] ? await ptr(a[0]) : null;
  return {
    domain,
    checkedAt: new Date().toISOString(),
    notRegistered: Boolean(reg?.notRegistered),
    registration: reg && !reg.notRegistered ? reg : null,
    webHost: a?.length || wwwCname?.length ? webHost({ a: a || [], cname: wwwCname || [], ptr: sitePtr }) : null,
    errors,
  };
}
