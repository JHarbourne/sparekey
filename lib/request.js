// A website owner's request to their web person, carried entirely inside the
// link's #fragment. Browsers never send the fragment to a server, so nothing
// about the request is stored or logged anywhere.

const LIMITS = { n: 80, o: 120, e: 120, b: 80, be: 120, m: 600, d: 10, domain: 253, r: 80 };
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

// req: { name, organisation, email, domains[], builderName, builderEmail, message,
//        sendTo?: { name, role, email } }  sendTo = someone else who should receive the plan
export function encodeRequest(req) {
  const compact = {
    v: 1,
    n: clip(req.name, LIMITS.n),
    o: clip(req.organisation, LIMITS.o),
    e: clip(req.email, LIMITS.e),
    d: (req.domains || []).slice(0, LIMITS.d),
    b: clip(req.builderName, LIMITS.b),
    m: clip(req.message, LIMITS.m),
    ...(req.sendTo?.email ? { t: { n: clip(req.sendTo.name, LIMITS.n), r: clip(req.sendTo.role, LIMITS.r), e: clip(req.sendTo.email, LIMITS.e) } } : {}),
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
      sendTo: o.t && o.t.e ? { name: clip(o.t.n, LIMITS.n), role: clip(o.t.r, LIMITS.r), email: clip(o.t.e, LIMITS.e) } : null,
    };
  } catch { return null; }
}

export const REQUEST_PREFIX = '#start/r=';
export const requestLink = (origin, req) => `${origin}/${REQUEST_PREFIX}${encodeRequest(req)}`;

// "Sam Lee, our IT manager", "our IT manager" or "Sam Lee".
export function recipient(t) {
  if (!t) return '';
  const role = t.role ? `our ${t.role.replace(/^(our|the)\s+/i, '')}` : '';
  return [t.name, role].filter(Boolean).join(', ') || 'the person named';
}

export function requestEmail(req, link) {
  const who = req.organisation ? `${req.name || 'I'} at ${req.organisation}` : (req.name || 'I');
  const hi = req.builderName ? `Dear ${req.builderName},` : 'Hello,';
  const sites = req.domains.length ? req.domains.join(', ') : 'our website';
  const body = [
    hi,
    '',
    `As part of our contingency planning, could you put together a short continuity plan for ${sites}? It would record what the website and email depend on, whose name each account is in and who pays for it, so we could keep things running if you were ever unable to work for a long time, for example through serious illness. It doesn't change who looks after the website or how you work.`,
    '',
    ...(req.message ? [req.message, ''] : []),
    'This link opens a free tool with our details already filled in. It checks the public records for the website, and you add the rest. It takes about fifteen minutes:',
    link,
    '',
    `Before you open it, check the link starts with ${new URL(link).origin}/. Spare Key will never ask you for a password.`,
    '',
    `${req.sendTo?.email
      ? `When you have finished, please send the document it produces to ${recipient(req.sendTo)} at ${req.sendTo.email}.`
      : 'When you have finished, please send me the document it produces.'} Many organisations ask their suppliers for one, and I’d rather have it and never need it.`,
    '',
    'Thank you,',
    req.name || '',
  ].join('\n');
  return { subject: `Website continuity plan for ${req.organisation || sites}`, body, who };
}

export function mailtoUrl(to, subject, body) {
  return `mailto:${encodeURIComponent(to || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
