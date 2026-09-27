// A website owner's request to their web person, carried entirely inside the
// link's #fragment. Browsers never send the fragment to a server, so nothing
// about the request is stored or logged anywhere.

const LIMITS = { n: 80, o: 120, e: 120, b: 80, be: 120, m: 600, d: 10, domain: 253 };
const clip = (s, n) => String(s ?? '').trim().slice(0, n);

function toB64url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function cleanDomains(text) {
  const out = [];
  for (const raw of String(text || '').split(/[\s,;]+/)) {
    const d = raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
    if (/^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d) && d.length <= LIMITS.domain && !out.includes(d)) out.push(d);
  }
  return out.slice(0, LIMITS.d);
}

// req: { name, organisation, email, domains[], builderName, builderEmail, message }
export function encodeRequest(req) {
  const compact = {
    v: 1,
    n: clip(req.name, LIMITS.n),
    o: clip(req.organisation, LIMITS.o),
    e: clip(req.email, LIMITS.e),
    d: (req.domains || []).slice(0, LIMITS.d),
    b: clip(req.builderName, LIMITS.b),
    m: clip(req.message, LIMITS.m),
  };
  return toB64url(JSON.stringify(compact));
}

export function decodeRequest(s) {
  try {
    const o = JSON.parse(fromB64url(String(s)));
    if (!o || o.v !== 1) return null;
    return {
      name: clip(o.n, LIMITS.n),
      organisation: clip(o.o, LIMITS.o),
      email: clip(o.e, LIMITS.e),
      domains: cleanDomains((Array.isArray(o.d) ? o.d : []).join(' ')),
      builderName: clip(o.b, LIMITS.b),
      message: clip(o.m, LIMITS.m),
    };
  } catch { return null; }
}

export const REQUEST_PREFIX = '#start/r=';
export const requestLink = (origin, req) => `${origin}/${REQUEST_PREFIX}${encodeRequest(req)}`;

export function requestEmail(req, link) {
  const who = req.organisation ? `${req.name || 'I'} at ${req.organisation}` : (req.name || 'I');
  const hi = req.builderName ? `Hi ${req.builderName},` : 'Hi,';
  const sites = req.domains.length ? req.domains.join(', ') : 'our website';
  const body = [
    hi,
    '',
    `Could you put together a handover for ${sites}? If you were ever unavailable, I'd like to know what the website and email depend on, who pays for what, and what I would need to do.`,
    '',
    ...(req.message ? [req.message, ''] : []),
    'This link opens a free tool with my details already filled in. It checks the public records for the website, and you add the rest. It takes about fifteen minutes, and it never asks for passwords:',
    link,
    '',
    'When you have finished, please send me the handover document it produces.',
    '',
    'Thank you,',
    req.name || '',
  ].join('\n');
  return { subject: `Handover for ${req.organisation || sites}`, body, who };
}

export function mailtoUrl(to, subject, body) {
  return `mailto:${encodeURIComponent(to || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
