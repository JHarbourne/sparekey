// Inventory model: plain JSON the builder and client both keep.
// Format documented in FORMAT.md. Works in the browser and in Node.

export const FORMAT = 'sparekey-inventory';
export const VERSION = 1;

export const KINDS = {
  registration: 'Domain registration',
  dns: 'DNS (domain settings)',
  website: 'Website hosting',
  email: 'Email',
  sending: 'Email sending service',
  database: 'Database or app backend',
  other: 'Other service',
};

export const WHO = { client: 'The client', builder: 'The builder', other: 'Someone else', '': 'Not recorded' };
export const YESNO = { yes: 'Yes', no: 'No', unknown: 'Not sure' };

let seq = 0;
export const newId = () => `s${Date.now().toString(36)}${(seq++).toString(36)}`;

export function emptyInventory() {
  return {
    format: FORMAT,
    version: VERSION,
    updated: new Date().toISOString(),
    client: { name: '', organisation: '', contact: '' },
    builder: { name: '', contact: '' },
    emergency: { name: '', relationship: '', contact: '' },
    helper: { name: '', contact: '' },
    passwordsLocation: '',
    backupsLocation: '',
    domains: [],
    services: [],
    notes: '',
  };
}

export function newService(fields = {}) {
  return {
    id: newId(),
    kind: 'other',
    name: '',
    provider: '',
    purpose: '',
    domain: '',
    accountOwner: '',
    paidBy: '',
    cost: '',
    renews: '',
    autoRenew: 'unknown',
    secondAdmin: 'unknown',
    notes: '',
    source: 'manual',
    ...fields,
  };
}

const day = (iso) => (iso ? String(iso).slice(0, 10) : '');

// Turn one lookup result into draft services the builder then completes.
export function servicesFromLookup(lk) {
  if (!lk) return [];
  const d = lk.domain;
  const out = [];
  if (lk.registration?.registrar || lk.registration?.expires) {
    out.push(newService({
      kind: 'registration', domain: d, source: 'lookup',
      name: `${d} registration`,
      provider: lk.registration.registrar || '',
      purpose: `Keeps the name ${d} registered. If it lapses, everything on the domain stops.`,
      renews: day(lk.registration.expires),
    }));
  }
  if (lk.dnsHost) {
    out.push(newService({
      kind: 'dns', domain: d, source: 'lookup', name: `${d} domain settings`, provider: lk.dnsHost,
      purpose: 'Where the records live that point the domain at the website and email.',
    }));
  }
  if (lk.webHost) {
    out.push(newService({
      kind: 'website', domain: d, source: 'lookup', name: `${d} website`, provider: lk.webHost,
      purpose: 'Serves the website.',
    }));
  }
  if (lk.emailHost) {
    out.push(newService({
      kind: 'email', domain: d, source: 'lookup', name: `Email at ${d}`, provider: lk.emailHost,
      purpose: 'Receives and stores email for addresses on this domain.',
    }));
  }
  for (const s of lk.senders || []) {
    if (s === 'A server listed by address') continue;
    if (lk.emailHost && lk.emailHost.startsWith(s)) continue;
    out.push(newService({
      kind: 'sending', domain: d, source: 'lookup', name: `${s} sending for ${d}`, provider: s,
      purpose: 'Allowed to send email as this domain (newsletters, notifications or outgoing mail).',
    }));
  }
  return out;
}

// Add lookup services without duplicating ones already present.
export function mergeServices(existing, incoming) {
  const key = (s) => `${s.kind}|${s.domain}|${String(s.provider).toLowerCase()}`;
  const have = new Set(existing.map(key));
  const byKind = new Map(existing.map((s) => [`${s.kind}|${s.domain}`, s]));
  const added = [];
  for (const s of incoming) {
    if (have.has(key(s))) continue;
    const prev = byKind.get(`${s.kind}|${s.domain}`);
    if (prev && prev.source === 'lookup' && s.kind !== 'sending') {
      prev.provider = s.provider; // provider changed since last check
      if (s.renews) prev.renews = s.renews;
      continue;
    }
    added.push(s);
  }
  return [...existing, ...added];
}

export function validateInventory(obj) {
  if (!obj || obj.format !== FORMAT) throw new Error('This is not a handover inventory file.');
  if (obj.version > VERSION) throw new Error('This file was made by a newer version. Please update.');
  const base = emptyInventory();
  const inv = { ...base, ...obj };
  for (const k of ['client', 'builder', 'emergency', 'helper']) inv[k] = { ...base[k], ...(obj[k] || {}) };
  inv.domains = Array.isArray(obj.domains) ? obj.domains : [];
  inv.services = Array.isArray(obj.services) ? obj.services.map((s) => newService({ ...s, id: s.id || newId() })) : [];
  return inv;
}
