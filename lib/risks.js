// Risk checks: what would break, or be hard to recover, if the builder vanished.
// Each risk: { level: 'high'|'medium'|'low', title, detail, serviceId? }

import { KINDS } from './model.js';
import { phpSupported } from './wordpress.js';

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
  // ---------- logins, two-step sign-in, backups, code ----------
  const pm = inv.passwordsMethod || 'unknown';
  if (pm === 'browser') {
    add('high', 'The logins are only saved in a browser or Apple Keychain',
      `If ${builder} can’t be reached, no one can get them. Apple’s Legacy Contact doesn’t include Keychain passwords. Ask the client to set up a password vault in their own name and invite ${builder}, then move the logins into it. sparekey.dev/passwords shows how.`);
  } else if (pm === 'own-only') {
    add('high', `Only ${builder} can get into the logins`,
      `Ask the client to set up a password vault in their own name and invite ${builder}, then move the logins into it. sparekey.dev/passwords shows how.`);
  } else if (pm === 'paper') {
    add('medium', 'The logins are written down',
      'Keep them sealed with your executor or solicitor, never where they can be found. Better still, a password vault the client sets up in their own name, with ' + builder + ' invited in.');
  } else if (pm === 'unknown') {
    if (inv.passwordsLocation) add('low', 'Choose how the logins are kept', 'Pick the closest option in Access, so the risk can be judged.');
    else add('medium', 'How the logins are kept is not recorded', `The best option is a password vault the client sets up in their own name, with ${builder} invited in. Never record the passwords themselves.`);
  }
  const tf = inv.twoFactor || 'unknown';
  if (tf === 'builder-phone') {
    add('high', `Sign-in codes only go to ${builder}’s phone`,
      'Without that phone no one can get in, even with the password. Add the client’s phone as a second method, and keep each account’s recovery codes in the shared vault.');
  } else if (tf === 'none') {
    add('medium', 'Most accounts have no two-step sign-in', 'Turn it on for the domain registrar, hosting and email at least, with the client’s phone added.');
  } else if (tf === 'unknown') {
    add('low', 'Record where the two-step sign-in codes go', 'This is the most common way people get locked out. Say whose phone or security key receives them.');
  }
  const hasData = inv.services.some((x) => ['website', 'database', 'email', 'cms'].includes(x.kind));
  const bm = inv.backupMethod || 'unknown';
  if (bm === 'none' && hasData) {
    add('high', 'Nothing is backed up', 'Set up automatic copies to storage the client owns, such as their own Google Drive, Dropbox or cloud account.');
  } else if (bm === 'host-only') {
    add('medium', 'Backups are only kept by the host', 'If the hosting account is closed or unpaid, the backups go with it. Copy them to storage the client owns.');
  } else if (bm === 'builder-storage') {
    add('medium', `Backups are in ${builder}’s own account`, 'Send them to storage the client owns instead, so they can reach them without you.');
  } else if (bm === 'unknown' && hasData) {
    if (inv.backupsLocation) add('low', 'Choose how backups are kept', 'Pick the closest option in Access, so the risk can be judged.');
    else add('medium', 'No backup location recorded', 'Record where copies of the website, database and email are kept, and make sure at least one copy is outside the hosting account.');
  }
  if (!['none', 'git', 'unknown'].includes(bm)) {
    if (inv.backupWhere === 'physical') add('medium', 'Backups are only on a drive in one building', 'A fire, flood, theft or failed drive could take the computer and its backups together. Add an online copy the client can reach.');
    if (inv.backupFrequency === 'manual') add('medium', 'Backups depend on someone remembering', 'Copies made by hand stop when people get busy. Set them to run automatically, every day or week.');
    else if (inv.backupFrequency === 'monthly') add('low', 'Backups are made once a month', 'Up to a month of changes could be lost. Every day or week is better for a site that changes often.');
    if (inv.backupKeep === 'latest') add('medium', 'Only the latest backup is kept', 'If the site is hacked or damaged and no one notices, the next backup copies the damage over the only good copy. Keep several weeks of copies.');
    else if (inv.backupKeep === 'week') add('low', 'Backups only go back a week', 'Problems are often found later than that. Keep at least a month of copies.');
  }
  if (inv.backupTested === 'never' && bm !== 'none') add('low', 'No one has tried restoring a backup', 'A backup that has never been restored may not work. Try it once a year.');
  else if (inv.backupTested === 'older') add('low', 'The last test restore was over a year ago', 'Try restoring a backup once a year.');

  const proj = inv.project || {};
  const hasCode = (proj.stack || []).length > 0 || Boolean(proj.repo);
  const type = proj.type || 'unknown';
  // Site builders have no code; WordPress only when there's custom code recorded.
  const askCode = type === 'builder' ? false : type === 'wordpress' ? Boolean(proj.repo) || ['builder-only', 'none'].includes(proj.repoAccess) : true;
  if (!askCode) { /* nothing to check about code */ } else if (proj.repoAccess === 'builder-only') {
    add('high', `Only ${builder} can reach the code`,
      'Move the repository into an organisation the client owns, or add the client as an owner, so a new developer can be given access.');
  } else if (proj.repoAccess === 'none') {
    add('high', 'The code is only on a computer', 'Put it in a repository, such as GitHub or GitLab, that the client can reach.');
  } else if ((proj.repoAccess || 'unknown') === 'unknown' && hasCode) {
    add('medium', 'Where the code lives is not recorded', 'A new developer needs the code first. Record the repository and who can reach it.');
  }

  const wp = type === 'wordpress' ? proj.wordpress : null;
  if (wp) {
    if (wp.php && phpSupported(wp.php, now) === false) {
      add('medium', `PHP ${wp.php} no longer gets security fixes`, 'Ask the host to move the site to a supported version of PHP, after checking the theme and plugins work with it.');
    }
    const behind = wp.plugins.filter((p) => p.latest);
    if (behind.length) add('medium', `${behind.length} plugin${behind.length === 1 ? ' has' : 's have'} an update waiting`, `Out-of-date plugins are the most common way WordPress sites are broken into. Update ${behind.slice(0, 3).map((p) => p.name).join(', ')}${behind.length > 3 ? ' and the rest' : ''}.`);
    const manual = wp.plugins.filter((p) => p.autoUpdate === 'off');
    if (manual.length) add('low', `${manual.length} plugin${manual.length === 1 ? ' needs' : 's need'} updating by hand`, `If you can’t be reached, no one will update them. Turn on automatic updates in WordPress’s Plugins page, or tell the client who will.`);
    if (wp.inactive) add('low', `${wp.inactive} plugin${wp.inactive === 1 ? ' is' : 's are'} switched off but still installed`, 'Switched-off plugins can still be attacked. Delete any that aren’t needed.');
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
    if (s.kind !== 'registration' && s.renews) {
      const d = daysUntil(s.renews, now);
      if (s.kind === 'api') {
        if (d < 0) add('high', `${label} has expired`, 'The feature that uses it has probably stopped. Renew the key and update it where the site keeps its settings.', s.id);
        else if (d <= 30) add('high', `${label} expires in ${d} days`, 'Create a new key before then and update it where the site keeps its settings.', s.id);
        else if (d <= 60) add('medium', `${label} expires in ${d} days`, 'Put a reminder in the calendar to replace it.', s.id);
      } else if (s.autoRenew !== 'yes') {
        if (d < 0) add('high', `${label} has lapsed`, `It was due on ${new Date(s.renews).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}. Check it is still running.`, s.id);
        else if (d <= 30) add('medium', `${label} renews in ${d} days`, 'Check it renews, and that the payment card is current.', s.id);
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

  // Domains the organisation plans to let go, and who registered each one.
  for (const dm of inv.domains || []) {
    if (dm.origin === 'builder-own') {
      add('high', `${dm.name} is registered to ${builder}`,
        `If it is in ${builder}’s name or account, the client may not legally own their own web address, and can’t renew or move it without ${builder}. Move it to the client’s own registrar account, with the client named as the registrant.`, undefined, undefined, dm.name);
    } else if (dm.origin === 'previous') {
      add('medium', `Check who legally owns ${dm.name}`,
        'It was registered by a previous developer or agency, who may still be named as the registrant. Change it to the client.', undefined, undefined, dm.name);
    } else if ((dm.origin || 'unknown') === 'unknown') {
      add('low', `Record who registered ${dm.name}`, 'Whoever registered a domain is usually its legal owner. Say whether it was the client, you, or someone before you.', undefined, undefined, dm.name);
    }
    if (dm.status === 'release') {
      add('high', `${dm.name} is due to be let go`,
        `Before a domain is released or allowed to lapse, check what still links to it and record who decided it was safe. Once it lapses anyone can buy it, with every link and search listing it has built up, and use your name to sell things. Keeping it costs far less than losing it.`, undefined, undefined, dm.name);
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

