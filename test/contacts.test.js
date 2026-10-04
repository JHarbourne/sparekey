import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateInventory, emailProblem, phoneProblem, contactOf } from '../lib/model.js';

test('an old single contact box moves to email or phone', () => {
  const inv = validateInventory({ format: 'sparekey-inventory', version: '0.8.0', services: [],
    client: { contact: 'anita@example.org' }, builder: { contact: '07700 900123' }, emergency: { contact: '' } });
  assert.equal(inv.client.email, 'anita@example.org');
  assert.equal(inv.builder.phone, '07700 900123');
  assert.equal(inv.emergency.email, '');
  assert.equal('contact' in inv.client, false);
});

test('email checks', () => {
  for (const ok of ['', 'a@b.co', 'jonathan.h@lgbthistoryuk.org', 'x+y@sub.example.co.uk']) assert.equal(emailProblem(ok), '', ok);
  for (const bad of ['anita', 'anita@', 'anita@example', 'an ita@example.org', '@example.org']) assert.notEqual(emailProblem(bad), '', bad);
});

test('phone checks', () => {
  for (const ok of ['', '07700 900123', '+44 (0)7700 900123', '01621 868 000', '+1-212-555-0100', '020 7946 0000 ext 12']) assert.equal(phoneProblem(ok), '', ok);
  for (const bad of ['123', 'call me', '0770090012345678901', 'anita@example.org']) assert.notEqual(phoneProblem(bad), '', bad);
});

test('contact details for documents', () => {
  assert.equal(contactOf({ email: 'a@b.co', phone: '07700 900123' }), 'a@b.co, 07700 900123');
  assert.equal(contactOf({ phone: '07700 900123' }), '07700 900123');
  assert.equal(contactOf({}), '');
});
