import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyInventory, newOldDomain, validateInventory } from '../lib/model.js';
import { assessRisks } from '../lib/risks.js';

const NOW = Date.parse('2026-09-27T12:00:00Z');
const titles = (inv, level) => assessRisks(inv, NOW).filter((r) => !level || r.level === level).map((r) => r.title);
const withOld = (od) => { const inv = emptyInventory(); inv.oldDomains.push({ ...newOldDomain(od.name), ...od }); return inv; };

test('an old address registered after we stopped using it is serious', () => {
  const inv = withOld({ name: 'old-name.org.uk', stoppedYear: '2021', lookup: { registration: { created: '2026-03-14T00:00:00Z' } } });
  assert.ok(titles(inv, 'high').some((t) => /old-name\.org\.uk was registered again in March 2026, probably by someone else/.test(t)));
});

test('a recent registration with no year given is worth checking', () => {
  const inv = withOld({ name: 'old.org.uk', lookup: { registration: { created: '2025-01-10T00:00:00Z' } } });
  assert.ok(titles(inv, 'medium').includes('old.org.uk was registered again in January 2025'));
});

test('an unregistered old address can be bought by anyone', () => {
  const inv = withOld({ name: 'gone.org.uk', lookup: { notRegistered: true } });
  assert.ok(titles(inv, 'medium').includes('gone.org.uk is free for anyone to register'));
});

test('an old address we still hold is serious only when it is about to lapse', () => {
  const soon = withOld({ name: 'kept.org.uk', stillOurs: 'yes', lookup: { registration: { created: '2004-01-01T00:00:00Z', expires: '2026-10-20T00:00:00Z' } } });
  assert.ok(titles(soon, 'high').includes('kept.org.uk lapses in 22 days'));
  const fine = withOld({ name: 'kept.org.uk', stillOurs: 'yes', lookup: { registration: { created: '2004-01-01T00:00:00Z', expires: '2028-01-01T00:00:00Z' } } });
  assert.equal(titles(fine).filter((t) => t.includes('kept.org.uk')).length, 0);
});

test('a domain we plan to let go is flagged, and open sign-ups are flagged', () => {
  const inv = emptyInventory();
  inv.domains.push({ name: 'campaign.org.uk', status: 'release' });
  inv.publicAccounts = 'open';
  assert.ok(titles(inv, 'high').includes('campaign.org.uk is due to be let go'));
  assert.ok(titles(inv, 'medium').includes('Anyone can create an account on the website'));
});

test('older inventory files open with the new fields filled in', () => {
  const old = { format: 'sparekey-inventory', version: 1, domains: [{ name: 'a.org' }], services: [] };
  const inv = validateInventory(old);
  assert.equal(inv.domains[0].status, 'active');
  assert.deepEqual(inv.oldDomains, []);
  assert.equal(inv.publicAccounts, 'unknown');
});
