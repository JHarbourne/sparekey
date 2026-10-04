// Pure functions that turn public DNS / RDAP / TLS facts into plain-English
// provider names. No network access here, so it can be tested offline.

const lc = (s) => String(s || '').toLowerCase().replace(/\.$/, '');

const NS_PROVIDERS = [
  [/domaincontrol\.com$/, 'GoDaddy'],
  [/\.ns\.cloudflare\.com$/, 'Cloudflare'],
  [/awsdns-/, 'Amazon Route 53'],
  [/wixdns\.net$/, 'Wix'],
  [/squarespacedns\.com$|squarespace\.com$/, 'Squarespace'],
  [/googledomains\.com$|ns-cloud-.*\.googledomains\.com$/, 'Google'],
  [/registrar-servers\.com$/, 'Namecheap'],
  [/vercel-dns\.com$/, 'Vercel'],
  [/nsone\.net$/, 'NS1'],
  [/netlify/, 'Netlify'],
  [/digitalocean\.com$/, 'DigitalOcean'],
  [/ui-dns\.|ionos/, 'IONOS'],
  [/123-reg\.co\.uk$/, '123 Reg'],
  [/dns-parking\.com$|hostinger/, 'Hostinger'],
  [/fasthosts/, 'Fasthosts'],
  [/one\.com$/, 'One.com'],
  [/gandi\.net$/, 'Gandi'],
  [/ovh\.net$/, 'OVHcloud'],
  [/dnsimple/, 'DNSimple'],
  [/hover\.com$/, 'Hover'],
  [/wordpress\.com$/, 'WordPress.com'],
  [/shopify/, 'Shopify'],
  [/azure-dns/, 'Microsoft Azure'],
  [/houxou/, 'Houxou'],
];

export function dnsProvider(nsRecords = []) {
  for (const ns of nsRecords.map(lc)) {
    for (const [re, name] of NS_PROVIDERS) if (re.test(ns)) return name;
  }
  return nsRecords.length ? `Unrecognised (${lc(nsRecords[0])})` : null;
}

function ipInCidr(ip, cidr) {
  const [range, bits] = cidr.split('/');
  const toInt = (a) => a.split('.').reduce((n, o) => (n << 8) + Number(o), 0) >>> 0;
  const mask = bits === '0' ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return (toInt(ip) & mask) === (toInt(range) & mask);
}

const IP_HOSTS = [
  [['76.76.21.0/24', '216.198.79.0/24', '216.150.0.0/16', '66.33.60.0/24'], 'Vercel'],
  [['185.230.60.0/22'], 'Wix'],
  [['198.185.159.0/24', '198.49.23.0/24'], 'Squarespace'],
  [['75.2.60.5/32', '99.83.231.61/32'], 'Netlify'],
  [['185.199.108.0/22'], 'GitHub Pages'],
  [['192.0.78.0/24'], 'WordPress.com'],
  [['23.227.38.0/24'], 'Shopify'],
  [['75.2.70.75/32'], 'Webflow'],
  [['104.16.0.0/13', '172.64.0.0/13', '188.114.96.0/20', '141.101.64.0/18', '162.158.0.0/15'], 'Cloudflare (proxied)'],
];

const CNAME_HOSTS = [
  [/vercel-dns|vercel\.app$/, 'Vercel'],
  [/netlify/, 'Netlify'],
  [/github\.io$/, 'GitHub Pages'],
  [/wixdns|wixsite/, 'Wix'],
  [/squarespace/, 'Squarespace'],
  [/webflow/, 'Webflow'],
  [/ghs\.googlehosted\.com$/, 'Google Sites'],
  [/shopify/, 'Shopify'],
  [/wordpress\.com$|wpcomstaging/, 'WordPress.com'],
  [/pages\.dev$/, 'Cloudflare Pages'],
  [/azurewebsites\.net$/, 'Microsoft Azure'],
  [/herokudns|herokuapp/, 'Heroku'],
];

const PTR_HOSTS = [
  [/compute\.amazonaws\.com$|amazonaws\.com$/, 'Amazon Web Services (a server someone manages)'],
  [/googleusercontent\.com$/, 'Google Cloud (a server someone manages)'],
  [/linode|akamai/, 'Akamai/Linode (a server someone manages)'],
  [/digitalocean/, 'DigitalOcean (a server someone manages)'],
  [/hetzner/, 'Hetzner (a server someone manages)'],
  [/ovh/, 'OVHcloud (a server someone manages)'],
  [/houxou/, 'Houxou'],
];

export function webHost({ a = [], cname = [], ptr = null } = {}) {
  for (const c of cname.map(lc)) for (const [re, n] of CNAME_HOSTS) if (re.test(c)) return n;
  for (const ip of a) for (const [cidrs, n] of IP_HOSTS) if (cidrs.some((c) => ipInCidr(ip, c))) return n;
  if (ptr) for (const [re, n] of PTR_HOSTS) if (re.test(lc(ptr))) return n;
  if (a.length) return `Unrecognised server (${a[0]})`;
  return null;
}

const MX_PROVIDERS = [
  [/google\.com$|googlemail\.com$/, 'Google (Gmail / Workspace)'],
  [/protection\.outlook\.com$|outlook\.com$/, 'Microsoft 365'],
  [/icloud\.com$/, 'Apple iCloud+'],
  [/zoho\./, 'Zoho Mail'],
  [/messagingengine\.com$/, 'Fastmail'],
  [/secureserver\.net$/, 'GoDaddy email'],
  [/ionos|1and1/, 'IONOS'],
  [/protonmail\.ch$|proton\.me$/, 'Proton Mail'],
  [/mimecast/, 'Mimecast'],
  [/improvmx/, 'ImprovMX (forwarding)'],
  [/forwardemail/, 'Forward Email (forwarding)'],
  [/mx\.cloudflare\.net$/, 'Cloudflare Email Routing (forwarding)'],
  [/123-reg/, '123 Reg'],
  [/mailgun\.org$/, 'Mailgun'],
  [/hostinger/, 'Hostinger'],
  [/fasthosts/, 'Fasthosts'],
];

// mx: [{priority, host}] ; mailHostPtr: PTR of the first MX host's IP, if looked up
export function emailHost(domain, mx = [], mailHostPtr = null) {
  if (!mx.length) return null;
  const hosts = mx.map((m) => lc(m.host));
  for (const h of hosts) for (const [re, n] of MX_PROVIDERS) if (re.test(h)) return n;
  const d = lc(domain);
  if (hosts.some((h) => h === d || h.endsWith('.' + d))) {
    const where = mailHostPtr ? webHost({ ptr: mailHostPtr }) : null;
    return `Own mail server${where ? ` on ${where}` : ''}`;
  }
  return `Unrecognised (${hosts[0]})`;
}

const SENDERS = [
  [/amazonses\.com/, 'Amazon SES'],
  [/brevo\.com|sendinblue\.com/, 'Brevo'],
  [/mailgun\.org/, 'Mailgun'],
  [/sendgrid\.net/, 'SendGrid'],
  [/mcsv\.net|mailchimp/, 'Mailchimp'],
  [/_spf\.google\.com/, 'Google'],
  [/spf\.protection\.outlook\.com/, 'Microsoft 365'],
  [/icloud\.com/, 'Apple iCloud+'],
  [/zoho/, 'Zoho'],
  [/messagingengine\.com/, 'Fastmail'],
  [/postmarkapp/, 'Postmark'],
  [/secureserver\.net/, 'GoDaddy'],
];

export function parseTxt(txt = []) {
  const clean = txt.map((t) => String(t).replace(/^"|"$/g, '').replace(/"\s*"/g, ''));
  const spf = clean.find((t) => /^v=spf1\b/i.test(t)) || null;
  const senders = [];
  if (spf) {
    for (const [re, n] of SENDERS) if (re.test(spf) && !senders.includes(n)) senders.push(n);
    if (/\bip4:|\bip6:|\ba\b|\bmx\b/.test(spf.replace(/include:\S+/g, ''))) senders.push('A server listed by address');
  }
  return { spf, senders };
}

export function parseDmarc(txt = []) {
  const rec = txt.map((t) => String(t).replace(/^"|"$/g, '')).find((t) => /^v=DMARC1/i.test(t));
  if (!rec) return null;
  const m = /;\s*p=(\w+)/i.exec(rec);
  return { record: rec, policy: m ? m[1].toLowerCase() : 'none' };
}

// RDAP JSON -> {registrar, expires, created}
export function parseRdap(json) {
  if (!json || typeof json !== 'object') return null;
  const ev = (name) => (json.events || []).find((e) => e.eventAction === name)?.eventDate || null;
  let registrar = null;
  for (const ent of json.entities || []) {
    if ((ent.roles || []).includes('registrar')) {
      const fn = (ent.vcardArray?.[1] || []).find((v) => v[0] === 'fn');
      registrar = fn ? fn[3] : ent.handle || null;
      break;
    }
  }
  return {
    registrar,
    expires: ev('expiration'),
    created: ev('registration'),
    status: json.status || [],
  };
}

export function isValidDomain(d) {
  return typeof d === 'string' && d.length <= 253 &&
    /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d);
}

// ---------- Accounts linked to a domain, from its DNS ----------
// Verification records left in TXT by services the domain's owner signed up to.
// [pattern, name, kind]. kind 'sending' = a service that sends email as the domain.
const VERIFICATIONS = [
  [/^google-site-verification=/i, 'Google Search Console', 'other'],
  [/^MS=ms\d+/i, 'Microsoft 365', 'other'],
  [/^facebook-domain-verification=/i, 'Meta Business (Facebook, Instagram)', 'other'],
  [/^apple-domain-verification=/i, 'Apple', 'other'],
  [/^apple-domain=/i, 'Apple iCloud+', 'other'],
  [/^atlassian-domain-verification=/i, 'Atlassian', 'other'],
  [/^docusign=/i, 'DocuSign', 'other'],
  [/^stripe-verification=/i, 'Stripe', 'other'],
  [/^zoho-verification=/i, 'Zoho', 'other'],
  [/^(brevo|sendinblue)-code:/i, 'Brevo', 'sending'],
  [/^adobe-idp-site-verification=/i, 'Adobe', 'other'],
  [/^openai-domain-verification=/i, 'OpenAI', 'other'],
  [/^canva-site-verification=/i, 'Canva', 'other'],
  [/^dropbox-domain-verification=/i, 'Dropbox', 'other'],
  [/^slack-domain-verification=/i, 'Slack', 'other'],
  [/^miro-verification=/i, 'Miro', 'other'],
  [/^webexdomainverification/i, 'Webex', 'other'],
  [/^ahrefs-site-verification_/i, 'Ahrefs', 'other'],
];
export function parseVerifications(txt = []) {
  const out = [];
  for (const raw of txt) {
    const t = String(raw).replace(/^"|"$/g, '').replace(/"\s*"/g, '');
    for (const [re, name, kind] of VERIFICATIONS) {
      if (re.test(t) && !out.some((x) => x.name === name)) out.push({ name, kind });
    }
  }
  return out;
}

// Email-signing (DKIM) selectors that belong to one service each.
// Looked up as <selector>._domainkey.<domain>.
export const DKIM_SELECTORS = [
  ['k1', 'Mailchimp'],
  ['s1', 'SendGrid'],
  ['mandrill', 'Mailchimp Transactional (Mandrill)'],
  ['resend', 'Resend'],
  ['kl', 'Klaviyo'],
  ['cm', 'Campaign Monitor'],
];

// Subdomains named in certificates for this domain, most useful first.
export function subdomainsFromCertificates(domain, issuances = [], limit = 20) {
  const d = lc(domain);
  const names = new Set();
  for (const c of issuances || []) {
    for (const raw of c.dns_names || []) {
      const n = lc(raw).replace(/^\*\./, '');
      if (n !== d && n !== `www.${d}` && n.endsWith(`.${d}`)) names.add(n);
    }
  }
  return [...names].sort((a, b) => a.split('.').length - b.split('.').length || a.localeCompare(b)).slice(0, limit);
}
