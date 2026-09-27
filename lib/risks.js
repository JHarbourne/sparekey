// Risk checks: what would break, or be hard to recover, if the builder vanished.
// Each risk: { level: 'high'|'medium'|'low', title, detail, serviceId? }

import { KINDS } from './model.js';

const DAY = 86400000;
const daysUntil = (iso, now) => Math.floor((new Date(iso).getTime() - now) / DAY);

export function assessRisks(inv, now = Date.now()) {
  const r = [];
  const builder = inv.builder?.name || 'the builder';
  const add = (level, title, detail, serviceId, code, label) => r.push({ level, title, detail, serviceId, code, label });

  if (!inv.emergency?.name) {
    add('high', 'No emergency contact',
      `No one is named who can reach ${builder}’s accounts and passwords in an emergency, such as ${builder} being seriously ill.`);
  }
  if (!inv.passwordsLocation) {
    add('medium', 'Password location not recorded',
      'Record where the logins are kept, for example a shared password manager. Never the passwords themselves.');
  }
  if (!inv.backupsLocation && inv.services.some((s) => ['website', 'database', 'email'].includes(s.kind))) {
    add('medium', 'No backup location recorded',
      'Record where copies of the website, database and email are kept, and make sure at least one copy is outside the hosting account.');
  }

  for (const s of inv.services) {
    const label = s.name || KINDS[s.kind] || 'A service';
    if (s.accountOwner === 'builder' && s.secondAdmin !== 'yes') {
      add('high', `Only ${builder} can manage ${label}`,
        `The account is in ${builder}’s name and no second person has admin access. Add the client or a trusted helper as an admin, or move the account into the client’s name.`, s.id, 'builder-only', label);
    } else if (s.secondAdmin === 'no') {
      add('medium', `Only one person can manage ${label}`,
        'Add a second admin so the service can still be managed if that person can’t be reached.', s.id, 'one-admin', label);
    } else if (s.secondAdmin === 'unknown' && s.accountOwner && s.accountOwner !== 'client') {
      add('low', `Check who else can manage ${label}`, 'Record whether anyone apart from the account holder has admin access.', s.id, 'check-admin', label);
    }
    if (s.paidBy === 'builder') {
      add('medium', `${label} is paid by ${builder}`,
        `If ${builder}’s payments stop, this service will eventually stop too. Consider moving the bill to the client.`, s.id, 'builder-pays', label);
    }
    if (!s.accountOwner) {
      add('low', `Account holder not recorded for ${label}`, 'Record whose name the account is in.', s.id, 'no-owner', label);
    }
    if (s.kind === 'registration') {
      if (!s.renews) {
        add('medium', `Renewal date unknown for ${label}`, 'Find the renewal date. A lapsed domain takes the website and email down, and the name can then be bought by anyone.', s.id);
      } else {
        const d = daysUntil(s.renews, now);
        if (d < 0) add('high', `${label} has expired`, `The registration expired ${-d} days ago. Renew it immediately.`, s.id);
        else if (d <= 30) add('high', `${label} renews in ${d} days`, 'Make sure it renews, and that the card on file will work.', s.id);
        else if (d <= 90) add('medium', `${label} renews in ${d} days`, 'Check auto-renew is on and the payment card is current.', s.id);
      }
      if (s.autoRenew !== 'yes') {
        add('medium', `Auto-renew not confirmed for ${label}`, 'Turn on auto-renew so the domain cannot lapse by accident.', s.id, 'auto-renew', label);
      }
    }
    if (s.kind === 'email' && /^Own mail server/.test(s.provider)) {
      add('high', `Email for ${s.domain || 'this domain'} runs on a privately managed server`,
        'If whoever looks after that server stops, email stops, possibly without warning. Consider a mail service in the client’s own name.', s.id);
    }
  }

  for (const dm of inv.domains || []) {
    const lk = dm.lookup;
    if (!lk) continue;
    const c = lk.certificate;
    if (c) {
      if (c.matchesName === false) {
        add('high', `${lk.domain} is showing the wrong security certificate`,
          'Visitors will see a security warning. The hosting is sending a certificate for a different name.');
      } else if (c.missing) {
        add('medium', `No current security certificate found for ${lk.domain}`,
          `The public certificate logs show no valid certificate for this name. Open https://${lk.domain} and check the padlock. If there is a warning, ask the host to issue a certificate.`);
      } else if (c.validTo) {
        const d = daysUntil(c.validTo, now);
        if (d < 0) add('high', `${lk.domain} security certificate has expired`, 'Visitors will see a security warning.');
        else if (d <= 14) add('medium', `${lk.domain} security certificate expires in ${d} days`, 'Most hosts renew automatically. Check it renews.');
      }
    }
    if (lk.emailHost && !lk.spf) {
      add('medium', `${lk.domain} has no SPF record`, 'Email from this domain is more likely to be treated as spam. Add an SPF record listing the services that send its mail.');
    }
    if (lk.emailHost && !lk.dmarc) {
      add('low', `${lk.domain} has no DMARC record`, 'Without DMARC, others can more easily send email pretending to be this domain.');
    }
  }

  // Domains the organisation plans to let go.
  for (const dm of inv.domains || []) {
    if (dm.status === 'release') {
      add('high', `${dm.name} is due to be let go`,
        `Before a domain is released or allowed to lapse, check what still links to it and record who decided it was safe. Once it lapses anyone can buy it, with every link and search listing it has built up, and use your name to sell things. Keeping it costs about £10 a year.`, undefined, undefined, dm.name);
    }
  }

  // Addresses the organisation used to use.
  const month = (iso) => new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  for (const od of inv.oldDomains || []) {
    const lk = od.lookup;
    const name = od.name;
    if (!lk) {
      add('low', `Check ${name}`, 'Look this old address up to see who holds it now.');
      continue;
    }
    if (lk.notRegistered) {
      add('medium', `${name} is free for anyone to register`,
        'It used to be yours. Anyone can now register it and inherit its old links and search listings, then use them to advertise something under your old name. Consider registering it again and pointing it at your current website.');
      continue;
    }
    const reg = lk.registration || {};
    const created = reg.created ? new Date(reg.created) : null;
    const stopped = Number(od.stoppedYear) || null;
    if (od.stillOurs === 'yes') {
      if (reg.expires) {
        const d = daysUntil(reg.expires, now);
        if (d < 0) add('high', `${name} has expired`, 'Renew it now, before someone else can register it.');
        else if (d <= 60) add('high', `${name} lapses in ${d} days`, 'Old addresses are the ones that lapse quietly. Renew it, turn on auto-renew and point it at your current website.');
        else if (d <= 90) add('medium', `${name} renews in ${d} days`, 'Check auto-renew is on and the payment card is current.');
      } else {
        add('medium', `Renewal date unknown for ${name}`, 'Find out when it renews and turn on auto-renew.');
      }
      continue;
    }
    if (created && stopped && created.getFullYear() >= stopped) {
      add('high', `${name} was registered again in ${month(created)}, probably by someone else`,
        `That is after you stopped using it in ${stopped}. Open it in a browser and look. If it is using your old name to sell something, the domain policy page lists who to report it to, and ask anyone who still links to it to update the link.`);
    } else if (created && daysUntil(created.toISOString(), now) > -3 * 365) {
      add('medium', `${name} was registered again in ${month(created)}`,
        'Check whether it is still yours. Open it in a browser and look at what it shows.');
    } else if (od.stillOurs !== 'no') {
      add('low', `Check who holds ${name}`, `It is registered${reg.registrar ? ` with ${reg.registrar}` : ''}. Record whether it is still yours.`);
    }
  }

  // Public sign-up forms are used to publish adverts on trusted websites.
  if (inv.publicAccounts === 'open') {
    add('medium', 'Anyone can create an account on the website',
      'Spammers use open sign-up and membership forms to publish adverts on trusted websites. Turn on approval so a person checks each new account.');
  } else if ((inv.publicAccounts || 'unknown') === 'unknown' && (inv.domains || []).length) {
    add('low', 'Check whether the public can create accounts on the website', 'Record it in Access. If they can, new accounts should be approved by a person.');
  }

  const order = { high: 0, medium: 1, low: 2 };
  return r.sort((a, b) => order[a.level] - order[b.level]);
}

// Collapse repeated per-service risks into one line each, for reading.
const GROUPS = {
  'builder-only': (n, b, list) => [`Only ${b} can manage ${n} services`, `${list}. These accounts are in ${b}’s name and no second person has admin access. Add the client or a trusted helper as an admin, or move them into the client’s name.`],
  'one-admin': (n, b, list) => [`Only one person can manage ${n} services`, `${list}. Add a second admin to each.`],
  'check-admin': (n, b, list) => [`Check who else can manage ${n} services`, `${list}. Record whether anyone apart from the account holder has admin access.`],
  'builder-pays': (n, b, list) => [`${n} services are paid by ${b}`, `${list}. If ${b}’s payments stop, these will eventually stop too. Consider moving the bills to the client.`],
  'no-owner': (n, b, list) => [`Account holder not recorded for ${n} services`, `${list}.`],
  'auto-renew': (n, b, list) => [`Auto-renew not confirmed for ${n} domains`, `${list}. Turn on auto-renew so they cannot lapse by accident.`],
};
export function groupRisks(risks, builder) {
  const out = [];
  const seen = new Set();
  for (const r of risks) {
    if (r.code && GROUPS[r.code]) {
      if (seen.has(r.code)) continue;
      const same = risks.filter((x) => x.code === r.code);
      if (same.length > 1) {
        seen.add(r.code);
        const [title, detail] = GROUPS[r.code](same.length, builder, same.map((x) => x.label).join(', '));
        out.push({ level: r.level, title, detail });
        continue;
      }
    }
    out.push(r);
  }
  return out;
}

