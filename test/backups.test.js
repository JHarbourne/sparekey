import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyInventory, validateInventory, FORMAT } from '../lib/model.js';
import { assessRisks } from '../lib/risks.js';

const titles = (inv) => assessRisks(inv).map((r) => r.title);

test('where, how often and how far back are scored', () => {
  const inv = { ...emptyInventory(), backupMethod: 'client-storage', backupWhere: 'physical', backupFrequency: 'manual', backupKeep: 'latest' };
  const t = titles(inv);
  assert.ok(t.includes('Backups are only on a drive in one building'));
  assert.ok(t.includes('Backups depend on someone remembering'));
  assert.ok(t.includes('Only the latest backup is kept'));
});

test('no backup detail risks when there is nothing to back up', () => {
  const inv = { ...emptyInventory(), backupMethod: 'git', backupWhere: 'physical', backupFrequency: 'manual', backupKeep: 'latest' };
  const t = titles(inv);
  assert.ok(!t.some((x) => /drive in one building|remembering|latest backup/.test(x)));
});

test('older files open with the new backup fields unknown', () => {
  const inv = validateInventory({ format: FORMAT, version: '0.7.0', services: [] });
  assert.equal(inv.backupWhere, 'unknown');
  assert.equal(inv.backupFrequency, 'unknown');
  assert.equal(inv.backupKeep, 'unknown');
});
