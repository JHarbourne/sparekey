import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { emptyInventory, servicesFromLookup } from '../lib/model.js';
import { assessRisks } from '../lib/risks.js';
import { buildHandover } from '../lib/docgen.js';

const require = createRequire(import.meta.url);
let docx;
try { docx = require('docx'); } catch { docx = require(execSync('npm root -g').toString().trim() + '/docx'); }

test('builds a valid Word document for the Tollesbury example', async () => {
  const inv = emptyInventory();
  Object.assign(inv.client, { name: 'Anita', organisation: 'Tollesbury Arts Trail' });
  inv.builder.name = 'Jonathan Harbourne';
  const lk = {
    domain: 'tollesbury.art', registration: { registrar: 'GoDaddy.com, LLC', expires: '2027-02-10T00:00:00Z' },
    dnsHost: 'GoDaddy', webHost: 'Vercel', emailHost: 'Own mail server on Amazon Web Services (a server someone manages)',
    senders: ['Amazon SES', 'Brevo'], spf: 'v=spf1 include:amazonses.com ~all', dmarc: null, certificate: null,
  };
  inv.domains = [{ name: 'tollesbury.art', lookup: lk }];
  inv.services = servicesFromLookup(lk).map((s) => ({ ...s, accountOwner: 'builder', paidBy: 'builder' }));
  const buf = await buildHandover(inv, assessRisks(inv), docx, true);
  assert.ok(buf.length > 5000);
  writeFileSync(join(tmpdir(), 'sparekey-example-handover.docx'), buf);
});
