// Every renewal and expiry date in a plan, as a calendar file (.ics) that any
// calendar app can import. Built in the browser; nothing is sent anywhere.

const day = (iso) => String(iso || '').slice(0, 10);
const ymd = (iso) => day(iso).replace(/-/g, '');
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
// Lines longer than 75 octets are folded, as the calendar format requires.
function fold(line) {
  const out = []; let cur = '';
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch; } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

// [{ date: 'YYYY-MM-DD', title, detail, key }]
export function datesInPlan(inv) {
  const org = inv.client.organisation || inv.client.name || 'Website';
  const out = []; const seen = new Set();
  const add = (date, title, detail, key) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day(date)) || seen.has(key)) return;
    seen.add(key); out.push({ date: day(date), title: `${org}: ${title}`, detail, key });
  };
  for (const s of inv.services || []) {
    if (!s.renews) continue;
    const label = s.name || s.provider || 'service';
    const verb = s.kind === 'api' ? 'expires' : 'renews';
    add(s.renews, `${label} ${verb}`, `${s.provider ? `${s.provider}. ` : ''}${s.autoRenew === 'yes' ? 'Set to renew automatically: check the payment card is current.' : 'Not set to renew automatically.'}`, `svc-${s.kind}-${label}`);
  }
  for (const d of inv.domains || []) {
    const lk = d.lookup;
    if (lk?.registration?.expires) add(lk.registration.expires, `${d.name} domain renews`, 'If it lapses, the website and email stop and anyone can buy the name.', `svc-registration-${d.name} registration`);
    if (lk?.certificate?.validTo) add(lk.certificate.validTo, `${d.name} security certificate expires`, 'Most hosts renew it automatically. Check the website still shows the padlock.', `cert-${d.name}`);
  }
  for (const o of inv.oldDomains || []) {
    if (o.stillOurs === 'yes' && o.lookup?.registration?.expires) add(o.lookup.registration.expires, `old address ${o.name} renews`, 'Keep renewing it so no one else can buy it.', `old-${o.name}`);
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function buildCalendar(inv, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const slug = (inv.client.organisation || inv.client.name || 'plan').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plan';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Spare Key//sparekey.dev//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const e of datesInPlan(inv)) {
    const next = new Date(`${e.date}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
    lines.push('BEGIN:VEVENT',
      `UID:${slug}-${e.key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}@sparekey.dev`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.date)}`,
      `DTEND;VALUE=DATE:${ymd(next.toISOString())}`,
      `SUMMARY:${esc(e.title)}`,
      `DESCRIPTION:${esc(`${e.detail} From the website continuity plan made with Spare Key.`)}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.title)}`, 'TRIGGER:-P30D', 'END:VALARM',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.title)}`, 'TRIGGER:-P7D', 'END:VALARM',
      'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
