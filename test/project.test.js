import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readProject, servicesFromProject, envNames } from '../lib/project.js';
import { buildCalendar, datesInPlan } from '../lib/calendar.js';
import { emptyInventory } from '../lib/model.js';
import { assessRisks } from '../lib/risks.js';

const pkg = JSON.stringify({ dependencies: { astro: '^5', tinacms: '^2', 'posthog-js': '^1', leaflet: '^1.9', '@supabase/supabase-js': '^2' }, devDependencies: { vite: '^6' } });

test('recognises how a site is built from package.json', () => {
  const r = readProject([{ name: 'package.json', text: pkg }, { name: 'vercel.json', text: '{}' }]);
  assert.deepEqual(r.stack, ['Astro', 'Vite', 'Leaflet maps']);
  assert.equal(r.hosting, 'Vercel');
  assert.deepEqual(r.services.map((s) => s.name).sort(), ['PostHog', 'Supabase', 'Tina CMS']);
});

test('reads only the names from an environment file, never the values', () => {
  const env = 'VITE_SUPABASE_URL=https://abc.supabase.co\nGOOGLE_BOOKS_API_KEY=AIzaSyREALSECRET\nNODE_ENV=production\n# comment\n';
  const r = readProject([{ name: '.env', text: env }]);
  assert.ok(r.warnings[0].includes('values were thrown away'));
  const all = JSON.stringify(r) + JSON.stringify(servicesFromProject(r));
  assert.ok(!all.includes('AIzaSyREALSECRET') && !all.includes('abc.supabase.co'), 'no values kept');
  const books = r.services.find((s) => s.name === 'Google Books API key');
  assert.equal(books.kind, 'api');
  assert.deepEqual(books.keys, ['GOOGLE_BOOKS_API_KEY']);
  assert.ok(r.services.some((s) => s.name === 'Supabase'));
  assert.deepEqual(envNames('A=\nB=your-key-here').hadValues, false);
});

test('only the builder can reach the code is serious', () => {
  const inv = emptyInventory();
  inv.project = { stack: ['Astro'], hosting: '', repo: 'https://github.com/me/site', repoAccess: 'builder-only' };
  assert.ok(assessRisks(inv).some((r) => r.level === 'high' && /can reach the code/.test(r.title)));
  inv.project.repoAccess = 'unknown';
  assert.ok(assessRisks(inv).some((r) => r.level === 'medium' && r.title === 'Where the code lives is not recorded'));
});

test('logins only in Keychain and codes only on the builder’s phone are serious', () => {
  const inv = emptyInventory(); inv.builder.name = 'Sam';
  inv.passwordsMethod = 'browser'; inv.twoFactor = 'builder-phone';
  const high = assessRisks(inv).filter((r) => r.level === 'high').map((r) => r.title);
  assert.ok(high.includes('The logins are only saved in a browser or Apple Keychain'));
  assert.ok(high.includes('Sign-in codes only go to Sam’s phone'));
});

test('an API key close to expiry is flagged', () => {
  const inv = emptyInventory();
  inv.services.push({ id: 'k', kind: 'api', name: 'Google Books API key', renews: '2026-10-20', autoRenew: 'unknown', secondAdmin: 'unknown', accountOwner: '', paidBy: '' });
  const r = assessRisks(inv, Date.parse('2026-10-04T12:00:00Z')).find((x) => x.serviceId === 'k' && /expires/.test(x.title));
  assert.equal(r.level, 'high');
  assert.equal(r.title, 'Google Books API key expires in 15 days');
});

test('the calendar holds each date once, with reminders', () => {
  const inv = emptyInventory(); inv.client.organisation = 'Village Arts Trail';
  inv.domains.push({ name: 'vat.org', lookup: { registration: { expires: '2027-05-01T00:00:00Z' }, certificate: { validTo: '2026-12-01T00:00:00Z' } } });
  inv.services.push({ kind: 'registration', name: 'vat.org registration', renews: '2027-05-01', autoRenew: 'yes' });
  inv.services.push({ kind: 'api', name: 'Mapbox token', provider: 'Mapbox', renews: '2027-01-15' });
  const dates = datesInPlan(inv);
  assert.equal(dates.length, 3);
  const ics = buildCalendar(inv, new Date('2026-10-04T10:00:00Z'));
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 3);
  assert.match(ics, /DTSTART;VALUE=DATE:20270115/);
  assert.match(ics, /SUMMARY:Village Arts Trail: Mapbox token expires/);
  assert.equal((ics.match(/TRIGGER:-P30D/g) || []).length, 3);
  assert.ok(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75), 'lines folded');
});
