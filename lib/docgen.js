// Builds the Word handover document in the browser (uses the global `docx`
// from vendor/docx.iife.js). Can also run in Node by passing the docx module.

import { KINDS, WHO, YESNO, DOMAIN_STATUS } from './model.js';
import { POLICY } from './policy.js';
import { groupRisks } from './risks.js';

const NAVY = '1F3A5F';
const GREY = '5A6472';
const W = 9026; // A4 text width with 2.54 cm margins

const IF_UNPAID = {
  registration: 'The website, email and every address on the domain stop working. After a short grace period anyone can buy the name.',
  dns: 'Usually nothing immediately, but no one can change where the domain points.',
  website: 'The website goes offline.',
  email: 'Email stops arriving, and stored messages may be lost.',
  sending: 'Newsletters, notifications or outgoing mail stop being sent.',
  database: 'The app stops working and its content may be lost.',
};
const HELPER = {
  registration: 'Domain names can be moved to another customer account at the same registrar, or transferred to another registrar. Whoever holds the account, or their executor, has to authorise it. Put the domains in the client’s own name and turn on auto-renew.',
  dns: 'If the domain settings are moved, every record must be copied across, especially the email (MX) records, or email stops.',
  website: 'Most hosts can transfer a site or project to another account. Keep a copy of the code and content somewhere the client controls.',
  email: 'Set up a mail service in the client’s own name, recreate the addresses, copy existing mail across, then change the domain’s MX records to point at the new service.',
  sending: 'Transfer the sending account, or open a new one and update the domain’s SPF and DKIM records.',
  database: 'Export the data regularly and keep a copy outside the hosting account. Most services can transfer a project to another account.',
};

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

export async function buildHandover(inv, risks, lib = globalThis.docx, asBuffer = false) {
  if (!lib) throw new Error('The Word library has not loaded yet. Try again in a moment.');
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType,
    ShadingType, BorderStyle, AlignmentType, LevelFormat, Footer, PageNumber,
  } = lib;

  const builder = inv.builder.name || 'your web builder';
  const clientName = inv.client.name || inv.client.organisation || 'the client';
  const orgTitle = inv.client.organisation || inv.client.name || 'Your website and email';

  // "text [[gap]] **bold**" -> runs; gaps are shaded yellow for the builder to fill in
  const runs = (text, base = {}) => {
    const out = [];
    const re = /(\[\[.+?\]\]|\*\*.+?\*\*)/g;
    let last = 0; let m;
    const t = String(text ?? '');
    while ((m = re.exec(t))) {
      if (m.index > last) out.push(new TextRun({ text: t.slice(last, m.index), ...base }));
      const tok = m[0];
      if (tok.startsWith('[[')) out.push(new TextRun({ text: `[${tok.slice(2, -2)}]`, shading: { type: ShadingType.CLEAR, fill: 'FFF200', color: 'auto' }, ...base }));
      else out.push(new TextRun({ text: tok.slice(2, -2), ...base, bold: true }));
      last = m.index + tok.length;
    }
    if (last < t.length) out.push(new TextRun({ text: t.slice(last), ...base }));
    return out;
  };
  const gap = (v, what) => (v && String(v).trim() ? v : `[[${what}]]`);
  const P = (t) => new Paragraph({ children: runs(t), spacing: { after: 140, line: 300 } });
  const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
  const numConfigs = [];
  let nref = 0;
  const numbered = (items) => {
    const ref = `n${nref++}`;
    numConfigs.push({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 320 } } } }] });
    return items.map((t) => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t), spacing: { after: 100, line: 290 } }));
  };
  const bullet = (t) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: runs(t), spacing: { after: 80, line: 290 } });
  const line = { style: BorderStyle.SINGLE, size: 4, color: 'C9D1DB' };
  const borders = { top: line, bottom: line, left: line, right: line };
  const table = (headers, rows, widths) => {
    const cell = (t, head, i) => new TableCell({
      borders, width: { size: widths[i], type: WidthType.DXA },
      shading: head ? { fill: 'E8EEF5', type: ShadingType.CLEAR, color: 'auto' } : undefined,
      margins: { top: 80, bottom: 80, left: 110, right: 110 },
      children: [new Paragraph({ children: runs(t, head ? { bold: true, color: NAVY, size: 19 } : { size: 19 }), spacing: { line: 260 } })],
    });
    return [
      new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, rows: [
        new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, true, i)) }),
        ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, false, i)) })),
      ] }),
      new Paragraph({ spacing: { after: 120 }, children: [] }),
    ];
  };
  const callout = (title, lines) => [
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      borders: { top: line, bottom: line, right: line, left: { style: BorderStyle.SINGLE, size: 12, color: NAVY } },
      shading: { fill: 'F3F6FA', type: ShadingType.CLEAR, color: 'auto' },
      margins: { top: 140, bottom: 140, left: 200, right: 200 },
      children: [
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: title, bold: true, color: NAVY })] }),
        ...lines.map((l) => new Paragraph({ spacing: { after: 80, line: 290 }, children: runs(l) })),
      ],
    })] })] }),
    new Paragraph({ spacing: { after: 160 }, children: [] }),
  ];

  const S = inv.services;
  const byBuilder = S.filter((s) => s.accountOwner === 'builder' || s.paidBy === 'builder');
  const paidByBuilder = S.filter((s) => s.paidBy === 'builder');
  const ownMail = S.filter((s) => s.kind === 'email' && /^Own mail server/.test(s.provider));
  const domains = [...new Set([...inv.domains.map((d) => d.name), ...S.filter((s) => s.kind === 'registration').map((s) => s.domain)])].filter(Boolean);
  const high = risks.filter((r) => r.level === 'high');
  const who = (v) => (v ? WHO[v] : '[[not recorded]]');

  const short = [];
  short.push(byBuilder.length
    ? `**Some of it depends on ${builder}.** ${byBuilder.length} of the ${S.length} services are in ${builder}’s name or paid by ${builder}. They will keep running for a while, but would eventually stop if ${builder}’s payments stopped.`
    : '**Everything is in your own name and paid by you.** If you keep paying, nothing should stop.');
  if (ownMail.length) short.push('**Email is the most fragile part.** It runs on a server someone looks after personally. If that stops, email stops, possibly without warning.');
  if (domains.length) short.push(`**Hold on to the domain names** (${domains.join(', ')}). If they lapse, everything on them stops and anyone could buy them.`);
  short.push(high.length ? `**There ${high.length === 1 ? 'is 1 serious issue' : `are ${high.length} serious issues`} to fix** (section 6).` : '**No serious issues were found** when this was written.');

  const firstWeek = [
    `Contact ${gap(inv.emergency.name && `${inv.emergency.name}${inv.emergency.relationship ? ` (${inv.emergency.relationship})` : ''}, ${inv.emergency.contact}`, 'emergency contact: name and contact details')}, who can give you or your helper access to ${builder}’s accounts.`,
  ];
  if (paidByBuilder.length) {
    const names = [];
    for (const s of paidByBuilder) {
      const n = /^Own mail server/.test(s.provider) ? 'the mail server' : String(s.provider || s.name).replace(/(\.com)?,?\s*(LLC|Inc\.?|Ltd\.?|Limited)$/i, '').trim();
      if (n && !names.some((x) => x.toLowerCase() === n.toLowerCase())) names.push(n);
    }
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
    firstWeek.push(`Ask them to keep paying for ${list} until those services are in your own name.`);
  }
  if (S.some((s) => s.kind === 'email')) firstWeek.push('Keep your own copy of any email you need, in a folder on your own computer rather than on the mail server.');
  firstWeek.push(inv.helper.name
    ? `Contact ${inv.helper.name} (${gap(inv.helper.contact, 'contact details')}), who has agreed to help with the technical side.`
    : 'Find someone with web experience to help move things into your own name (section 4).');

  const kindsPresent = [...new Set(S.map((s) => s.kind))].filter((k) => HELPER[k]);
  const today = fmt(new Date().toISOString());

  const children = [
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `${orgTitle}: website continuity plan`, bold: true, size: 40, color: NAVY })] }),
    new Paragraph({ spacing: { after: 280 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 6 } },
      children: [new TextRun({ text: `For ${clientName}  |  From ${builder}  |  ${today}`, color: GREY, size: 20 })] }),
    P(`This explains what your website and email depend on, who pays for what, and what to do if ${builder} dies or can no longer look after them. The first sections need no technical knowledge. The later ones are for whoever you ask to help.`),
    P('There are no passwords in this document, on purpose. Section 5 says where they are kept.'),
    ...callout('The short version', short),

    H1('1. In the first week'),
    ...numbered(firstWeek),

    H1('2. What there is'),
    ...(S.length ? table(['Part', 'What it does', 'Where it runs', 'In whose name'],
      S.map((s) => [`**${s.name || KINDS[s.kind]}**`, s.purpose || KINDS[s.kind], gap(s.provider, 'provider'), who(s.accountOwner)]),
      [2100, 3000, 2226, 1700]) : [P('[[No services recorded yet]]')]),

    H1('3. Who pays, and what happens if the money stops'),
    ...(S.length ? table(['Service', 'Paid by', 'Renews', 'If it goes unpaid'],
      S.map((s) => [
        `**${s.name || KINDS[s.kind]}**${s.cost ? ` (${s.cost})` : ''}`,
        who(s.paidBy),
        s.renews ? `${fmt(s.renews)}${s.autoRenew === 'yes' ? ', auto-renews' : ''}` : (s.kind === 'registration' ? '[[renewal date]]' : ''),
        s.paidBy === 'client' ? `You control this. Keep your payment details up to date. ${IF_UNPAID[s.kind] || ''}` : (IF_UNPAID[s.kind] || '[[what stops]]'),
      ]), [2300, 1500, 1800, 3426]) : []),

    H1('4. What a helper would need to do'),
    ...(kindsPresent.length ? kindsPresent.map((k) => P(`**${KINDS[k]}.** ${HELPER[k]}`)) : [P('[[Add guidance for your helper]]')]),
    P('The aim is for every service to be in your own name, with at least two people able to manage it.'),

    H1('5. Access, passwords and backups'),
    bullet(`**Passwords** are kept in: ${gap(inv.passwordsLocation, 'where the passwords are kept')}.`),
    bullet(`**Backups** are kept in: ${gap(inv.backupsLocation, 'where the backups are kept')}.`),
    ...(S.length ? [P('Who can manage each service:'), ...table(['Service', 'Account holder', 'Second admin?'],
      S.map((s) => [s.name || KINDS[s.kind], who(s.accountOwner), s.secondAdmin === 'yes' ? 'Yes' : s.secondAdmin === 'no' ? '**No**' : '[[check]]']),
      [4226, 2600, 2200])] : []),

    H1('6. Things to fix'),
    ...(risks.length
      ? [P(`Checked on ${today}. The most serious are listed first.`), ...groupRisks(risks, builder).map((r) => bullet(`**${r.level === 'high' ? 'Serious' : r.level === 'medium' ? 'Fix soon' : 'Check'}: ${r.title}.** ${r.detail}`))]
      : [P('Nothing needed fixing when this was written.')]),

    H1('7. Domain names'),
    P('A domain name that lapses can be bought by anyone, along with every link and search listing it has built up. Old addresses are the ones that lapse quietly.'),
    ...(inv.domains.length ? table(['Domain', 'The plan', 'Renews'],
      inv.domains.map((d) => [`**${d.name}**`, DOMAIN_STATUS[d.status || 'active'], d.lookup?.registration?.expires ? fmt(d.lookup.registration.expires) : '[[renewal date]]']),
      [3400, 3626, 2000]) : []),
    ...((inv.oldDomains || []).length ? [P('Addresses the organisation used to use:'), ...table(['Old address', 'Still yours?', 'What we found'],
      inv.oldDomains.map((o) => {
        const lk = o.lookup; const reg = lk?.registration;
        const found = !lk ? '[[not checked]]' : lk.notRegistered ? 'Not registered. Anyone can register it.'
          : `Registered${reg?.registrar ? ` with ${reg.registrar}` : ''}${reg?.created ? ` on ${fmt(reg.created)}` : ''}${o.stoppedYear ? `. You stopped using it in ${o.stoppedYear}.` : '.'}`;
        return [`**${o.name}**`, YESNO[o.stillOurs] || 'Not sure', found];
      }), [2800, 1500, 4726])] : []),
    P('**A domain policy to adopt.** Most policies say who may buy a domain and who pays. Few say what happens when you stop using one. The full version, with the questions to answer, is at sparekey.dev/domain-policy.'),
    ...POLICY.map(([h, t]) => bullet(`**${h}.** ${t}`)),

    H1('8. Contacts'),
    ...table(['Who', 'Why', 'Contact'], [
      [gap(inv.emergency.name, 'emergency contact'), `Access to ${builder}’s accounts and passwords.`, gap(inv.emergency.contact, 'contact details')],
      [gap(inv.helper.name, 'technical helper'), 'Can take the technical work over.', gap(inv.helper.contact, 'contact details')],
      [builder, 'Built and looks after the website.', gap(inv.builder.contact, 'contact details')],
    ], [2600, 3626, 2800]),
    ...(inv.notes ? [H1('Notes'), ...String(inv.notes).split(/\n+/).map(P)] : []),
    P(`${builder} will update this document when something important changes.`),
  ];

  const doc = new Document({
    creator: builder,
    title: `${orgTitle}: website continuity plan`,
    styles: {
      default: { document: { run: { font: 'Arial', size: 21 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, color: NAVY, font: 'Arial' }, paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 0 } },
      ],
    },
    numbering: { config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 280 } } } }] },
      ...numConfigs,
    ] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1300, left: 1440, right: 1440 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: `${orgTitle}: continuity plan  |  Confidential  |  Made with Spare Key (sparekey.dev)  |  Page `, size: 16, color: GREY }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY }),
      ] })] }) },
      children,
    }],
  });
  return asBuffer ? Packer.toBuffer(doc) : Packer.toBlob(doc);
}
