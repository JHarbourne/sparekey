// Builds templates/spare-key-continuity-plan-template.docx, a blank handover to fill
// in by hand in Word. Same sections as the generated handover.
// Run: NODE_PATH=$(npm root -g) node scripts/word-template.cjs
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, AlignmentType, Footer, Header, PageNumber, PageBreak, TabStopType, VerticalAlign, LevelFormat,
} = require('docx');

const SANS = 'Arial';
const MONO = 'Consolas';
const INK = '171717';
const MUTED = '5C5C5C';
const GREEN = '00782A';
const GREEN_BG = 'E6F7EA';
const LINE = 'D9D9D9';
const FILL_BG = 'F7F7F7';
const W = 9026; // A4 text width with 1" margins

const t = (text, o = {}) => new TextRun({ text, font: SANS, color: INK, ...o });
const mono = (text, o = {}) => new TextRun({ text, font: MONO, size: 18, color: MUTED, ...o });
const p = (runs, o = {}) => new Paragraph({ spacing: { after: 140, line: 300 }, ...o, children: Array.isArray(runs) ? runs : [t(runs)] });
const hint = (text) => t(text, { color: '8A8A8A', italics: true });
const eyebrow = (text) => p([mono(text.toUpperCase(), { color: GREEN, size: 16, characterSpacing: 40 })], { spacing: { before: 360, after: 60 }, keepNext: true });
const h1 = (num, text) => [eyebrow(`section ${num}`), new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(text)] })];
const rule = () => new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GREEN, space: 4 } }, children: [] });

const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: border, bottom: border, left: border, right: border };
function cell(children, width, o = {}) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    children: Array.isArray(children) ? children : [new Paragraph({ children: [children] })],
  });
}
function table(headers, widths, rows, blanks = 0) {
  const head = new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(mono(h.toUpperCase(), { size: 16, color: INK, bold: true }), widths[i], { fill: FILL_BG })) });
  const body = rows.map((r) => new TableRow({ children: r.map((c, i) => cell(typeof c === 'string' ? hint(c) : c, widths[i])) }));
  const empty = Array.from({ length: blanks }, () => new TableRow({ height: { value: 480, rule: 'atLeast' }, children: widths.map((w) => cell(t(''), w)) }));
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, rows: [head, ...body, ...empty] });
}
// A labelled line to write on.
function field(label, example) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [2600, W - 2600],
    rows: [new TableRow({ children: [
      new TableCell({ borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: border },
        width: { size: 2600, type: WidthType.DXA }, margins: { top: 120, bottom: 60, left: 0, right: 120 }, children: [new Paragraph({ children: [mono(label, { color: INK })] })] }),
      new TableCell({ borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: border },
        width: { size: W - 2600, type: WidthType.DXA }, margins: { top: 120, bottom: 60, left: 120, right: 0 }, children: [new Paragraph({ children: [hint(example)] })] }),
    ] })],
  });
}
function callout(title, lines) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.SINGLE, size: 24, color: GREEN } },
      width: { size: W, type: WidthType.DXA }, shading: { fill: GREEN_BG, type: ShadingType.CLEAR, color: 'auto' },
      margins: { top: 160, bottom: 160, left: 240, right: 240 },
      children: [p([t(title, { bold: true, color: GREEN })], { spacing: { after: 80 } }), ...lines.map((l) => p(Array.isArray(l) ? l : [t(l)], { spacing: { after: 60 } }))],
    })] })],
  });
}
const box = (text) => p([t('☐  ', { color: GREEN, size: 24 }), t(text)], { spacing: { after: 100 }, indent: { left: 360, hanging: 360 } });
const gap = () => p([]);

const cover = [
  p([mono('spare', { size: 26, color: INK }), mono('key', { size: 26, color: GREEN, bold: true })], { spacing: { before: 1800, after: 600 } }),
  new Paragraph({ spacing: { after: 120 }, children: [t('Website continuity plan', { size: 64, bold: true })] }),
  p([t('What your website and email depend on, who pays for what, and how to keep them running if the person who looks after them were unable to work for a long time.', { size: 26, color: MUTED })], { spacing: { after: 600 } }),
  rule(),
  field('FOR', 'Organisation or person'),
  field('WEBSITE', 'example.org'),
  field('PREPARED BY', 'Name of the person who looks after it'),
  field('DATE', 'Day, month and year'),
  field('NEXT REVIEW', 'A year from now is a good default'),
  p([], { spacing: { after: 600 } }),
  callout('There are no passwords in this document, on purpose.', ['Section 5 says where they are kept. Keep this document somewhere you can find it without the website or email working: a printed copy, and a copy in your own cloud storage.']),
  new Paragraph({ children: [new PageBreak()] }),
];

const howTo = [
  eyebrow('before you start'),
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t('How to use this template')] }),
  p('Replace the grey text with your own. Delete this page when you have finished. Aim for plain English: the reader may not be technical and may be reading it on a bad day.'),
  p([t('Want the public details filled in for you? ', { bold: true }), t('sparekey.dev looks up the domain, website host and email provider, and writes this document for you. It runs in your browser and stores nothing.')]),
  p('Sections 2 and 3 matter most. For every service, record whose name it is in and who pays. Those are the two things that stop a website when one person can’t be reached.'),
  new Paragraph({ children: [new PageBreak()] }),
];

const body = [
  eyebrow('the short version'),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t('If you read nothing else')] }),
  callout('In one paragraph', [[hint('For example: The website runs on Vercel and the domain is registered with GoDaddy, both in Sam’s name and paid on Sam’s card. Email is Google Workspace in the charity’s name. If Sam can’t be reached for a long time, contact Pat first (section 7), then move the domain and hosting into the charity’s own name.')]]),

  ...h1('1', 'In the first week'),
  p('If the person who looks after the website can’t be reached for a long time, do these in order.'),
  box('Check the website and email still work. If they do, nothing is urgent.'),
  box('Contact the emergency contact in section 7. They can reach the accounts and passwords.'),
  box('Find the services in section 3 paid by that person. Those stop first when payments stop.'),
  box('Ask a technical helper to read sections 2, 4 and 5 and take over.'),
  box('Move each service into the organisation’s own name, with two people able to manage it.'),

  ...h1('2', 'What there is'),
  p('Every service the website and email depend on.'),
  table(['Part', 'What it does', 'Where it runs', 'In whose name'], [2100, 3000, 2226, 1700], [
    ['Domain name', 'The web address, example.org', 'GoDaddy', 'The builder'],
    ['Website hosting', 'Stores and serves the website', 'Vercel', 'The builder'],
    ['Email', 'Mailboxes for staff and volunteers', 'Google Workspace', 'The client'],
  ], 5),

  ...h1('3', 'Who pays, and what happens if the money stops'),
  table(['Service', 'Paid by', 'Renews', 'If it goes unpaid'], [2300, 1500, 1800, 3426], [
    ['Domain name (£15 a year)', 'The builder', '10 Nov 2026, auto-renews', 'The website and email stop, and anyone can buy the name.'],
  ], 5),

  ...h1('4', 'What a helper would need to do'),
  p('A short note for the technical person who takes over. Write one paragraph for each kind of service.'),
  p([t('Domain name. ', { bold: true }), hint('Where it is registered, and how to move it into the organisation’s name.')]),
  p([t('Website. ', { bold: true }), hint('Where the code lives, how it is published, and anything unusual.')]),
  p([t('Email. ', { bold: true }), hint('Which provider, how many mailboxes, and who can add or remove people.')]),
  p('The aim is for every service to be in the organisation’s own name, with at least two people able to manage it.'),

  ...h1('5', 'Access, passwords and backups'),
  field('PASSWORDS ARE IN', 'For example, a shared 1Password vault called Village Arts'),
  field('BACKUPS ARE IN', 'For example, weekly, in the charity’s Google Drive'),
  gap(),
  p('Who can manage each service:'),
  table(['Service', 'Account holder', 'Second admin?'], [4226, 2600, 2200], [['Website hosting', 'The builder', 'No']], 5),

  ...h1('6', 'Things to fix'),
  p('Anything that depends on one person, or that could lapse. Most serious first.'),
  table(['How serious', 'What', 'What to do'], [1700, 3326, 4000], [['Serious', 'Only the builder can manage the hosting', 'Add a second admin, or move it into the charity’s name']], 4),

  ...h1('7', 'Contacts'),
  table(['Who', 'Why', 'Contact'], [2600, 3626, 2800], [
    ['Emergency contact', 'Can reach the builder’s accounts and passwords', 'Phone and email'],
    ['Technical helper', 'Can take the technical work over', 'Phone and email'],
    ['The builder', 'Built and looks after the website', 'Phone and email'],
  ]),
  ...h1('8', 'Notes'),
  p([hint('Anything else worth knowing.')]),
];

const doc = new Document({
  creator: 'Spare Key', title: 'Website continuity plan', description: 'Spare Key handover template',
  styles: {
    default: { document: { run: { font: SANS, size: 21, color: INK } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: SANS, size: 34, bold: true, color: INK }, paragraph: { spacing: { before: 0, after: 180 }, outlineLevel: 0, keepNext: true } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: SANS, size: 28, bold: true, color: INK }, paragraph: { spacing: { before: 0, after: 160 }, outlineLevel: 1 } },
    ],
  },
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }, titlePage: true },
    headers: { default: new Header({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: W }], children: [mono('spare', { size: 16, color: INK }), mono('key', { size: 16, color: GREEN }), mono('\tWebsite continuity plan', { size: 16 })] })] }) },
    footers: {
      default: new Footer({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: W }], children: [mono('No passwords in this document · sparekey.dev', { size: 16 }), mono('\tPage ', { size: 16 }), new TextRun({ children: [PageNumber.CURRENT], font: MONO, size: 16, color: MUTED })] })] }),
      first: new Footer({ children: [new Paragraph({ children: [mono('Template from sparekey.dev · free and open source', { size: 16 })] })] }),
    },
    children: [...cover, ...howTo, ...body],
  }],
});

const out = path.join(__dirname, '..', 'templates', 'spare-key-continuity-plan-template.docx');
fs.mkdirSync(path.dirname(out), { recursive: true });
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(out, b); console.log('Wrote', out); });

// ---------- The domain name policy, as a Word document to adapt and adopt ----------
import('../lib/policy.js').then(({ QUESTIONS, POLICY }) => {
  const num = (i, text) => p([t(`${i}.  `, { bold: true, color: GREEN }), ...text], { indent: { left: 440, hanging: 440 }, spacing: { after: 160, line: 300 } });
  const policyDoc = new Document({
    creator: 'Spare Key', title: 'Domain name policy',
    styles: {
      default: { document: { run: { font: SANS, size: 21, color: INK } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: SANS, size: 34, bold: true, color: INK }, paragraph: { spacing: { before: 0, after: 180 }, outlineLevel: 0, keepNext: true } },
      ],
    },
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: W }], children: [mono('spare', { size: 16, color: INK }), mono('key', { size: 16, color: GREEN }), mono('\tDomain name policy', { size: 16 })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: W }], children: [mono('Template from sparekey.dev/domain-policy · free to adapt', { size: 16 }), mono('\tPage ', { size: 16 }), new TextRun({ children: [PageNumber.CURRENT], font: MONO, size: 16, color: MUTED })] })] }) },
      children: [
        new Paragraph({ spacing: { after: 120 }, children: [t('Domain name policy', { size: 56, bold: true })] }),
        p([hint('Organisation name')], { spacing: { after: 60 } }),
        field('ADOPTED ON', 'Date of the meeting'),
        field('APPROVED BY', 'Board, committee or trustees'),
        field('RESPONSIBLE', 'Role, for example the IT lead or the secretary'),
        field('NEXT REVIEW', 'A year from adoption'),
        rule(),
        eyebrow('the policy'),
        ...POLICY.map(([h, text], i) => num(i + 1, [t(`${h}. `, { bold: true }), t(text)])),
        callout('The clause most policies leave out', [`Clause ${POLICY.findIndex(([h]) => h === 'Releasing a domain') + 1}. When an address lapses, anyone can buy it with the links and search listings it built up, and use the old name to sell things. Checking first, and keeping it if in doubt, costs about £10 a year.`]),
        new Paragraph({ children: [new PageBreak()] }),
        eyebrow('appendix'),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t('Questions to answer when you adopt it')] }),
        ...QUESTIONS.map(([q, a]) => box(`${q} ${a}`)),
        gap(),
        eyebrow('appendix'),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t('Our domains')] }),
        table(['Domain', 'What it is for', 'Registered with', 'Renews', 'Responsible'], [2200, 2300, 1700, 1300, 1526], [
          ['example.org', 'Our website and email', 'Registrar name', '1 May 2027', 'IT lead'],
          ['old-name.org.uk', 'Our name before 2021. Points to example.org', 'Registrar name', '3 June 2027', 'IT lead'],
        ], 6),
      ],
    }],
  });
  const out2 = path.join(__dirname, '..', 'templates', 'spare-key-domain-policy.docx');
  return Packer.toBuffer(policyDoc).then((b) => { fs.writeFileSync(out2, b); console.log('Wrote', out2); });
});
