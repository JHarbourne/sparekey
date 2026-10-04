// Read WordPress's own "Site Health" report, pasted in by the builder.
// In WordPress: Tools, Site Health, Info, "Copy site info to clipboard".
// Runs in the browser; the text is never sent anywhere. Only the WordPress and
// PHP versions, the theme and the plugins are kept. Paths, server details and
// anything else in the report are ignored.

import { newService } from './model.js';

// Paid plugins and themes: a licence someone has to own and renew.
// [name starts with (lower case), what the licence gives]
const LICENSED = [
  ['elementor pro', 'Elementor Pro'], ['advanced custom fields pro', 'ACF Pro'], ['acf pro', 'ACF Pro'],
  ['gravity forms', 'Gravity Forms'], ['wp rocket', 'WP Rocket'], ['divi', 'Divi'], ['avada', 'Avada'],
  ['updraftplus premium', 'UpdraftPlus Premium'], ['wpml', 'WPML'],
  ['yoast seo premium', 'Yoast SEO Premium'], ['rank math seo pro', 'Rank Math Pro'], ['wpforms pro', 'WPForms Pro'],
  ['beaver builder', 'Beaver Builder'], ['the events calendar pro', 'Events Calendar Pro'], ['events calendar pro', 'Events Calendar Pro'],
  ['memberpress', 'MemberPress'], ['learndash', 'LearnDash'], ['woocommerce subscriptions', 'WooCommerce Subscriptions'],
  ['wp all import pro', 'WP All Import Pro'], ['blogvault', 'BlogVault'], ['backupbuddy', 'BackupBuddy'], ['solid backups', 'Solid Backups'],
];
// Plugins that mean an account or service somewhere. [name starts with, service, kind, what it does]
const ACCOUNTS = [
  ['jetpack', 'Jetpack (WordPress.com account)', 'other', 'Stats, security or backups, through a WordPress.com account.'],
  ['akismet', 'Akismet', 'api', 'Filters spam comments. Needs an API key from an Akismet account.'],
  ['woocommerce stripe', 'Stripe', 'other', 'Takes card payments.'],
  ['woocommerce paypal', 'PayPal', 'other', 'Takes PayPal payments.'],
  ['woocommerce payments', 'WooPayments', 'other', 'Takes card payments.'],
  ['woopayments', 'WooPayments', 'other', 'Takes card payments.'],
  ['mailchimp', 'Mailchimp', 'sending', 'Newsletter sign-ups.'],
  ['mc4wp', 'Mailchimp', 'sending', 'Newsletter sign-ups.'],
  ['wp mail smtp', 'Email sending (WP Mail SMTP)', 'sending', 'Sends the site’s email through a mail service. Record which one.'],
  ['fluent smtp', 'Email sending (FluentSMTP)', 'sending', 'Sends the site’s email through a mail service. Record which one.'],
  ['fluentsmtp', 'Email sending (FluentSMTP)', 'sending', 'Sends the site’s email through a mail service. Record which one.'],
  ['post smtp', 'Email sending (Post SMTP)', 'sending', 'Sends the site’s email through a mail service. Record which one.'],
  ['updraftplus', 'UpdraftPlus backups', 'other', 'Backs the site up. Check where the copies go, and whose account that is.'],
  ['wordfence', 'Wordfence', 'other', 'Security and firewall. A premium licence, if any, needs an owner.'],
  ['site kit by google', 'Google Site Kit', 'analytics', 'Connects Google Analytics and Search Console, through someone’s Google account.'],
  ['monsterinsights', 'Google Analytics (MonsterInsights)', 'analytics', 'Counts visits through someone’s Google account.'],
  ['google analytics', 'Google Analytics', 'analytics', 'Counts visits through someone’s Google account.'],
  ['cloudflare', 'Cloudflare', 'other', 'Speeds up and protects the site, through a Cloudflare account.'],
  ['recaptcha', 'Google reCAPTCHA', 'api', 'Stops spam on forms. Needs keys from someone’s Google account.'],
];

// When each PHP version stops getting security fixes (php.net/supported-versions).
const PHP_SECURITY_ENDS = { '7.4': '2022-11-28', '8.0': '2023-11-26', '8.1': '2025-12-31', '8.2': '2026-12-31', '8.3': '2027-12-31', '8.4': '2028-12-31', '8.5': '2029-12-31' };

export function phpSupported(version, now = Date.now()) {
  const m = /^(\d+)\.(\d+)/.exec(String(version || ''));
  if (!m) return null;
  const end = PHP_SECURITY_ENDS[`${m[1]}.${m[2]}`];
  if (!end) return Number(m[1]) < 7 || (Number(m[1]) === 7 && Number(m[2]) < 4) ? false : null;
  return new Date(`${end}T23:59:59Z`).getTime() >= now;
}

// Split the report into its ### sections.
function sections(text) {
  const out = {};
  let cur = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    const h = /^###\s*([a-z0-9-]+)(?:\s*\((\d+)\))?\s*###$/i.exec(line);
    if (h) { cur = h[1].toLowerCase(); out[cur] = []; continue; }
    if (cur && line) out[cur].push(line);
  }
  return out;
}
// "key: value" lines, as in wp-core and wp-active-theme.
function fields(lines = []) {
  const o = {};
  for (const l of lines) { const i = l.indexOf(': '); if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 2).trim(); }
  return o;
}
// "Plugin Name: version: 1.2, author: Someone, Auto-updates disabled"
function plugin(line) {
  const i = line.lastIndexOf(': version: ');
  if (i < 0) return null;
  const name = line.slice(0, i).trim();
  const rest = line.slice(i + 11);
  const version = (/^([^,(\s]+)/.exec(rest) || [])[1] || '';
  const update = /latest version:\s*([^\s,)]+)/i.exec(rest);
  const auto = /auto-updates enabled/i.test(rest) ? 'on' : /auto-updates disabled/i.test(rest) ? 'off' : 'unknown';
  return { name, version, autoUpdate: auto, ...(update ? { latest: update[1] } : {}) };
}

export function looksLikeSiteHealth(text) {
  return /###\s*wp-core\s*###/i.test(String(text));
}

// Returns what was recognised. Throws if the text isn't a Site Health report.
export function readSiteHealth(text) {
  if (!looksLikeSiteHealth(text)) throw new Error('That doesn’t look like WordPress’s site information. In WordPress, go to Tools, Site Health, Info, and choose “Copy site info to clipboard”, then paste it here.');
  const s = sections(text);
  const core = fields(s['wp-core']);
  const theme = fields(s['wp-active-theme']);
  const parent = fields(s['wp-parent-theme']);
  const server = fields(s['wp-server']);
  const themeName = (theme.name || '').replace(/\s*\([^)]*\)\s*$/, '');
  const parentName = (parent.name || '').replace(/\s*\([^)]*\)\s*$/, '');
  return {
    version: core.version || '',
    multisite: /^(yes|true)$/i.test(core.multisite || ''),
    php: (server.php_version || '').split(' ')[0],
    theme: themeName ? { name: themeName, version: theme.version || '', ...(parentName ? { parent: parentName } : {}) } : null,
    plugins: (s['wp-plugins-active'] || []).map(plugin).filter(Boolean),
    mustUse: (s['wp-mu-plugins'] || []).map(plugin).filter(Boolean).map((p) => p.name),
    inactive: (s['wp-plugins-inactive'] || []).map(plugin).filter(Boolean).length,
  };
}

const starts = (name, key) => name.toLowerCase().startsWith(key);

// Services worth recording, from the plugins and theme.
export function servicesFromWordPress(wp, domain = '') {
  const out = [];
  const seen = new Set();
  const add = (name, kind, purpose, notes = '') => {
    if (seen.has(name)) return;
    seen.add(name);
    out.push(newService({ kind, domain, source: 'wordpress', name, provider: name.replace(/ \(.*\)$/, ''), purpose, notes }));
  };
  const names = [...wp.plugins.map((p) => p.name), ...(wp.theme ? [wp.theme.name, wp.theme.parent].filter(Boolean) : [])];
  for (const n of names) {
    const lic = LICENSED.find(([k]) => starts(n, k));
    if (lic && lic[1]) add(`${lic[1]} licence`, 'other', 'A paid licence. If it lapses, updates and security fixes stop. Record whose account it is in and when it renews.');
    const acc = ACCOUNTS.find(([k]) => starts(n, k));
    if (acc) add(acc[1], acc[2], acc[3]);
  }
  return out;
}

// Short labels for the "Built with" line.
export function wordpressStack(wp) {
  return [
    `WordPress${wp.version ? ` ${wp.version}` : ''}`,
    ...(wp.theme ? [`theme: ${wp.theme.name}${wp.theme.parent ? ` (child of ${wp.theme.parent})` : ''}`] : []),
    `${wp.plugins.length} plugin${wp.plugins.length === 1 ? '' : 's'}`,
    ...(wp.php ? [`PHP ${wp.php}`] : []),
  ];
}
