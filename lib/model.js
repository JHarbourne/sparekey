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
  code: 'Code repository',
  cms: 'Content editing (CMS)',
  analytics: 'Analytics',
  api: 'API key or token',
  other: 'Other service',
};

export const WHO = { client: 'The client', builder: 'The builder', other: 'Someone else', '': 'Not recorded' };
export const YESNO = { yes: 'Yes', no: 'No', unknown: 'Not sure' };
// What the organisation intends for each domain it holds.
export const DOMAIN_STATUS = {
  active: 'In use',
  redirect: 'Points to our current website',
  retired: 'Retired, and we keep renewing it',
  release: 'We plan to let it go',
};
// Can members of the public create accounts on the website?
export const PUBLIC_ACCOUNTS = {
  unknown: 'Not recorded',
  none: 'No, only staff have accounts',
  approved: 'Yes, and a person approves each one',
  open: 'Yes, and they can post straight away',
};
// Where the code lives, and who can reach it.
// How the website is made. Decides which questions step 03 asks.
export const SITE_TYPES = {
  unknown: 'Not sure, or a mix',
  builder: 'A site builder, such as Wix, Squarespace or Shopify',
  wordpress: 'WordPress',
  code: 'Built from code, such as HTML, Astro or Next.js',
  other: 'Another content editor or system',
};
// Guess the type from where the lookup found the site hosted.
const TYPE_BY_HOST = [
  [/^(wix|squarespace|shopify|webflow|weebly|godaddy website builder|jimdo|carrd|framer)/i, 'builder'],
  [/^(wordpress\.com|wp engine|kinsta|flywheel|pressable|wpx)/i, 'wordpress'],
  [/^(vercel|netlify|github pages|cloudflare pages|render|firebase hosting)/i, 'code'],
];
export function guessSiteType(inv) {
  for (const s of inv.services || []) {
    if (s.kind !== 'hosting' && s.kind !== 'website') continue;
    const hit = TYPE_BY_HOST.find(([re]) => re.test(s.provider || ''));
    if (hit) return { type: hit[1], from: s.provider };
  }
  return null;
}
export const REPO_ACCESS = {
  unknown: 'Not recorded',
  'client-owner': 'The client owns it, or is an owner',
  org: 'In a shared organisation the client can reach',
  'builder-only': 'Only in my own account',
  none: 'Nowhere shared: the files are only on a computer',
  na: 'Not needed: it’s made with a site builder (Wix, Squarespace and so on)',
};
// How the logins are kept. The order is best first.
export const PASSWORD_METHODS = {
  unknown: 'Not recorded',
  'shared-client': 'In a shared vault the client owns, with me as a member',
  'emergency': 'In my password manager, with emergency access set up for someone',
  'sealed': 'In my password manager; its master password is sealed with my executor',
  'paper': 'Written down',
  'own-only': 'In my password manager, and no one else can get in',
  'browser': 'Saved in my browser or Apple Keychain only',
};
// Where the two-step sign-in codes go.
export const TWO_FACTOR = {
  unknown: 'Not recorded',
  shared: 'The client’s phone is added too, or the recovery codes are in the shared vault',
  'builder-phone': 'Only to my phone or my security key',
  none: 'Most accounts don’t have two-step sign-in',
};
// Backups.
export const BACKUP_METHODS = {
  unknown: 'Not recorded',
  'client-storage': 'Automatic copies go to storage the client owns',
  git: 'Nothing to back up but the code, and the code is in a repository',
  'host-only': 'Only the host’s own backups',
  'builder-storage': 'Copies in my own account or on my computer',
  none: 'No backups',
};
export const BACKUP_TESTED = {
  unknown: 'Not recorded',
  year: 'Yes, in the last year',
  older: 'Yes, but more than a year ago',
  never: 'Never',
};
// Where the backup copies are kept.
export const BACKUP_WHERE = {
  unknown: 'Not recorded',
  both: 'Online and on a drive',
  cloud: 'Online only',
  physical: 'Only on a drive, in one place',
};
// How often a copy is made.
export const BACKUP_FREQUENCY = {
  unknown: 'Not recorded',
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  manual: 'When someone remembers',
};
// How far back the copies go.
export const BACKUP_KEEP = {
  unknown: 'Not recorded',
  long: 'Months or more',
  month: 'About a month',
  week: 'About a week',
  latest: 'Only the latest copy',
};
export const newOldDomain = (name) => ({ name, stillOurs: 'unknown', stoppedYear: '', lookup: null });

let seq = 0;
export const newId = () => `s${Date.now().toString(36)}${(seq++).toString(36)}`;

export function emptyInventory() {
  return {
    format: FORMAT,
    version: VERSION,
    updated: new Date().toISOString(),
    client: { name: '', organisation: '', email: '', phone: '' },
    builder: { name: '', email: '', phone: '' },
    emergency: { name: '', relationship: '', email: '', phone: '' },
    helper: { name: '', email: '', phone: '' },
    passwordsLocation: '',
    backupsLocation: '',
    domains: [],
    oldDomains: [],
    publicAccounts: 'unknown',
    project: { type: 'unknown', stack: [], hosting: '', repo: '', repoAccess: 'unknown', wordpress: null },
    passwordsMethod: 'unknown',
    twoFactor: 'unknown',
    backupMethod: 'unknown',
    backupTested: 'unknown',
    backupWhere: 'unknown',
    backupFrequency: 'unknown',
    backupKeep: 'unknown',
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
  for (const x of lk.linked || []) {
    out.push(newService({
      kind: x.kind === 'sending' ? 'sending' : 'other', domain: d, source: 'lookup', name: `${x.name} (${d})`, provider: x.name,
      purpose: x.kind === 'sending'
        ? 'Sends email as this domain, for example newsletters or notifications.'
        : 'An account linked to this domain: its verification record is in the domain’s settings. Record who owns the account.',
    }));
  }
  for (const sd of lk.subdomains || []) {
    out.push(newService({
      kind: 'website', domain: sd.name, source: 'lookup', name: `${sd.name}`, provider: sd.host || '',
      purpose: 'Another site on this domain, found in the public certificate logs. Easy to forget, so record who looks after it.',
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
  for (const k of ['client', 'builder', 'emergency', 'helper']) {
    inv[k] = { ...base[k], ...(obj[k] || {}) };
    // Before 0.8.4 there was one "contact" box. Move it to email or phone.
    const c = String(inv[k].contact || '').trim();
    if (c && !inv[k].email && !inv[k].phone) {
      if (/@/.test(c)) inv[k].email = c; else inv[k].phone = c;
    }
    delete inv[k].contact;
  }
  inv.domains = Array.isArray(obj.domains) ? obj.domains.map((d) => ({ status: 'active', ...d })) : [];
  inv.oldDomains = Array.isArray(obj.oldDomains) ? obj.oldDomains.map((d) => ({ ...newOldDomain(d.name), ...d })) : [];
  if (!PUBLIC_ACCOUNTS[inv.publicAccounts]) inv.publicAccounts = 'unknown';
  inv.project = { ...base.project, ...(obj.project || {}) };
  if (!Array.isArray(inv.project.stack)) inv.project.stack = [];
  if (!REPO_ACCESS[inv.project.repoAccess]) inv.project.repoAccess = 'unknown';
  if (!SITE_TYPES[inv.project.type]) inv.project.type = 'unknown';
  if (!PASSWORD_METHODS[inv.passwordsMethod]) inv.passwordsMethod = 'unknown';
  if (!TWO_FACTOR[inv.twoFactor]) inv.twoFactor = 'unknown';
  if (!BACKUP_METHODS[inv.backupMethod]) inv.backupMethod = 'unknown';
  if (!BACKUP_TESTED[inv.backupTested]) inv.backupTested = 'unknown';
  if (!BACKUP_WHERE[inv.backupWhere]) inv.backupWhere = 'unknown';
  if (!BACKUP_FREQUENCY[inv.backupFrequency]) inv.backupFrequency = 'unknown';
  if (!BACKUP_KEEP[inv.backupKeep]) inv.backupKeep = 'unknown';
  inv.services = Array.isArray(obj.services) ? obj.services.map((s) => newService({ ...s, id: s.id || newId() })) : [];
  return inv;
}

// Gentle checks for the people's details. They warn; they never stop saving.
export function emailProblem(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(s) ? '' : 'This doesn’t look like an email address. Check it has an @ and a full domain, like name@example.org.';
}
export function phoneProblem(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  if (/[^\d\s+().\-]/.test(s.replace(/\s*(ext\.?|x)\s*\d+$/i, ''))) return 'A phone number can only have digits, spaces, +, brackets and dashes.';
  const digits = s.replace(/\D/g, '').length;
  if (digits < 7) return 'This phone number looks too short.';
  if (digits > 15) return 'This phone number looks too long.';
  return '';
}
// "email, phone" for documents, whichever are filled in.
export const contactOf = (p = {}) => [p.email, p.phone].map((x) => String(x || '').trim()).filter(Boolean).join(', ');
