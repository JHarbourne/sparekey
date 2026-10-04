import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSiteHealth, servicesFromWordPress, phpSupported, looksLikeSiteHealth } from '../lib/wordpress.js';
import { emptyInventory, guessSiteType, newService } from '../lib/model.js';
import { assessRisks } from '../lib/risks.js';

const REPORT = `
### wp-core ###

version: 6.6.2
site_language: en_GB
multisite: false

### wp-active-theme ###

name: Astra Child (astra-child)
version: 1.0.0
author: Someone
parent_theme: Astra (astra)

### wp-parent-theme ###

name: Astra (astra)
version: 4.8.1

### wp-mu-plugins (1) ###

Host Helper: version: 1.0, author: Host

### wp-plugins-active (4) ###

Akismet Anti-spam: Spam Protection: version: 5.3.3, author: Automattic - Anti-spam Team, Auto-updates disabled
Elementor Pro: version: 3.23.0 (latest version: 3.24.1), author: Elementor.com, Auto-updates disabled
UpdraftPlus - Backup/Restore: version: 1.24.6, author: TeamUpdraft, Auto-updates enabled
WP Mail SMTP: version: 4.1.1, author: WP Mail SMTP, Auto-updates enabled

### wp-plugins-inactive (2) ###

Hello Dolly: version: 1.7.2, author: Matt Mullenweg, Auto-updates disabled
Classic Editor: version: 1.6.4, author: WordPress Contributors, Auto-updates disabled

### wp-server ###

server_architecture: Linux 5.10 x86_64
php_version: 8.0.30 64bit
`;

test('reads WordPress, theme, plugins and PHP from Site Health', () => {
  assert.ok(looksLikeSiteHealth(REPORT));
  const wp = readSiteHealth(REPORT);
  assert.equal(wp.version, '6.6.2');
  assert.equal(wp.php, '8.0.30');
  assert.deepEqual(wp.theme, { name: 'Astra Child', version: '1.0.0', parent: 'Astra' });
  assert.equal(wp.plugins.length, 4);
  assert.equal(wp.plugins[0].name, 'Akismet Anti-spam: Spam Protection');
  assert.equal(wp.plugins[1].latest, '3.24.1');
  assert.equal(wp.plugins[1].version, '3.23.0');
  assert.equal(wp.plugins[2].autoUpdate, 'on');
  assert.equal(wp.inactive, 2);
  assert.deepEqual(wp.mustUse, ['Host Helper']);
});

test('keeps nothing beyond versions, theme and plugins', () => {
  const wp = readSiteHealth(`${REPORT}\n### wp-database ###\n\ndatabase_host: db.example\n### wp-filesystem ###\n\nwordpress: /var/www/secret/path\n`);
  assert.ok(!JSON.stringify(wp).includes('/var/www'));
  assert.ok(!JSON.stringify(wp).includes('db.example'));
});

test('rejects text that is not a Site Health report', () => {
  assert.throws(() => readSiteHealth('hello'), /Site Health/);
});

test('plugins become services: licences and accounts', () => {
  const names = servicesFromWordPress(readSiteHealth(REPORT), 'example.org').map((s) => s.name);
  assert.ok(names.includes('Elementor Pro licence'));
  assert.ok(names.includes('Akismet'));
  assert.ok(names.includes('UpdraftPlus backups'));
  assert.ok(names.some((n) => n.startsWith('Email sending')));
});

test('PHP security support by date', () => {
  assert.equal(phpSupported('8.0.30', Date.parse('2026-10-04')), false);
  assert.equal(phpSupported('8.2.1', Date.parse('2026-10-04')), true);
  assert.equal(phpSupported('8.2.1', Date.parse('2027-01-05')), false);
  assert.equal(phpSupported('5.6', Date.parse('2026-10-04')), false);
});

test('WordPress risks, and no code risks for a site builder', () => {
  const inv = { ...emptyInventory() };
  inv.project = { ...inv.project, type: 'wordpress', wordpress: readSiteHealth(REPORT) };
  const t = assessRisks(inv, Date.parse('2026-10-04')).map((r) => r.title);
  assert.ok(t.includes('PHP 8.0.30 no longer gets security fixes'));
  assert.ok(t.includes('1 plugin has an update waiting'));
  assert.ok(t.includes('2 plugins need updating by hand'));
  assert.ok(t.includes('2 plugins are switched off but still installed'));
  assert.ok(!t.some((x) => /the code|code lives/i.test(x)));

  const b = { ...emptyInventory() };
  b.project = { ...b.project, type: 'builder', stack: ['React'] };
  assert.ok(!assessRisks(b).some((r) => /the code|code lives/i.test(r.title)));
});

test('site type is guessed from the website host', () => {
  const inv = { ...emptyInventory(), services: [newService({ kind: 'website', provider: 'Wix' })] };
  assert.deepEqual(guessSiteType(inv), { type: 'builder', from: 'Wix' });
  inv.services = [newService({ kind: 'website', provider: 'WP Engine' })];
  assert.equal(guessSiteType(inv).type, 'wordpress');
  inv.services = [newService({ kind: 'website', provider: 'Amazon Web Services' })];
  assert.equal(guessSiteType(inv), null);
});
