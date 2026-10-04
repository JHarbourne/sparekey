// What to do next, shown under an answer in steps 03 and 04 when that answer
// leaves the client exposed. Keyed by the field's data-bind path, then the value.
// Our own text, so it may contain links. level matches the risk cards.

const VAULT = '<a href="passwords.html#own-vault">How the client sets up a vault</a>';

export const ADVICE = {
  'project.repoAccess': {
    'builder-only': {
      level: 'high',
      title: 'Only you can reach the code. To fix that:',
      steps: [
        'Best: move it into a GitHub organisation the client owns. The client creates a free GitHub account and a <a href="https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/creating-a-new-organization-from-scratch">free organisation</a>, or you create the organisation and make them an owner.',
        'In the repository, open Settings, go to Danger Zone and choose <a href="https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository">Transfer ownership</a>, then pick the organisation. Old links redirect to the new address.',
        'Check the site still deploys. On Vercel’s free Hobby plan, a private repository owned by an organisation won’t deploy directly. Use Vercel Pro, deploy with GitHub Actions, or make the repository public if nothing in it is secret.',
        'If you can’t do that yet, add the client as a collaborator, and name a successor in GitHub under Settings, Account, Successor settings. A successor can only take over public repositories.',
      ],
      after: 'Then change the answer above.',
    },
    none: {
      level: 'high',
      title: 'The code is only on a computer. To fix that:',
      steps: [
        'Create a repository on GitHub or GitLab, ideally in an organisation the client owns.',
        'Upload the files. <a href="https://desktop.github.com/">GitHub Desktop</a> is the easiest way if you don’t use the command line.',
        'Leave out any file of passwords or keys, such as <code>.env</code>.',
      ],
    },
  },
  passwordsMethod: {
    browser: {
      level: 'high',
      title: 'If you can’t be reached, no one can get these logins.',
      steps: [
        `Ask the client to set up a password vault in their own name and invite you. ${VAULT}.`,
        'Move the client’s logins into it. 1Password and Bitwarden can import from Chrome and Apple Passwords.',
      ],
    },
    'own-only': {
      level: 'high',
      title: 'If you can’t be reached, no one can get these logins.',
      steps: [
        `Ask the client to set up a password vault in their own name and invite you, then move their logins into it. ${VAULT}.`,
        'Until then, set up emergency access for someone you trust, such as Bitwarden’s Emergency Access.',
      ],
    },
    paper: {
      level: 'medium',
      title: 'Written-down passwords are easy to find and easy to lose.',
      steps: [
        'Never keep them by the computer, in a desk drawer or in a file called “passwords”.',
        'If they must stay on paper, seal them in an envelope and leave it with your executor or solicitor.',
        `Better: ask the client to set up a password vault in their own name and invite you. ${VAULT}.`,
      ],
    },
  },
  twoFactor: {
    'builder-phone': {
      level: 'high',
      title: 'Without your phone, no one can get in, even with the password.',
      steps: [
        'In each account’s security settings, add the client’s phone or a second security key as another way to sign in. Start with the domain registrar.',
        'Save each account’s recovery codes in the client’s password vault.',
      ],
    },
    none: {
      level: 'medium',
      title: 'Anyone with a password can get in.',
      steps: [
        'Turn on two-step sign-in for the domain registrar first, then the hosting and email.',
        'Add the client’s phone as well as yours, and save the recovery codes in the client’s vault.',
      ],
    },
  },
  backupMethod: {
    'host-only': {
      level: 'medium',
      title: 'If the hosting account is closed or unpaid, the backups go with it.',
      steps: [
        'Set up automatic copies to storage the client owns, such as their Google Drive, Dropbox or Backblaze B2.',
        'Many hosts and plugins can do this on a schedule. <a href="passwords.html#backups">What to back up, by kind of site</a>.',
      ],
    },
    'builder-storage': {
      level: 'medium',
      title: 'If you can’t be reached, the client can’t get the backups.',
      steps: ['Send the copies to storage the client owns, such as their Google Drive, Dropbox or Backblaze B2, instead of, or as well as, yours.'],
    },
    none: {
      level: 'high',
      title: 'With no backups, a hack or mistake could lose the site for good.',
      steps: [
        'Set up automatic copies of the content and database to storage the client owns. <a href="passwords.html#backups">What to back up, by kind of site</a>.',
        'If the site is built from code in a repository, the code is backed up, but any content or database still needs copying.',
      ],
    },
  },
  backupWhere: {
    physical: {
      level: 'medium',
      title: 'A fire, flood, theft or failed drive could take everything at once.',
      steps: ['Add an online copy, in storage the client owns, such as their Google Drive, Dropbox or Backblaze B2. Keep the drive too: two kinds of storage are better than one.'],
    },
  },
  backupFrequency: {
    manual: {
      level: 'medium',
      title: 'Copies made by hand stop when people get busy.',
      steps: ['Set backups to run automatically. Most hosts, control panels and website plugins can do this every day or week.'],
    },
  },
  backupKeep: {
    latest: {
      level: 'medium',
      title: 'One copy can be overwritten by a damaged site.',
      steps: ['If the site is hacked and no one notices, the next backup replaces the only good copy. Keep several weeks of copies: most backup tools have a setting for how many to keep.'],
    },
  },
  backupTested: {
    never: {
      level: 'medium',
      title: 'A backup no one has restored may not work.',
      steps: ['Restore a recent backup to a test site, or a spare folder, and check the pages and images are there. Then put a date in the calendar to do it once a year.'],
    },
    older: {
      level: 'low',
      title: 'It’s been more than a year.',
      steps: ['Try restoring a recent backup to a test site, and add a yearly reminder.'],
    },
  },
};

export function adviceFor(field, value) {
  return (ADVICE[field] && ADVICE[field][value]) || null;
}

export function adviceHtml(a) {
  if (!a) return '';
  const steps = a.steps.length > 1
    ? `<ol>${a.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`
    : `<p>${a.steps[0]}</p>`;
  return `<p class="advice-title"><strong>${a.title}</strong></p>${steps}${a.after ? `<p>${a.after}</p>` : ''}`;
}
