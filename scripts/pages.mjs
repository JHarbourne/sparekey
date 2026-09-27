// Writes the shared header and footer into every page, and generates the
// content pages (guide, privacy, terms, feedback). Run: node scripts/pages.mjs
// A test fails if the committed pages are out of date.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function header(current) {
  const nav = [['guide.html', 'Guide'], ['feedback.html', 'Feedback']]
    .map(([href, label]) => `<a href="${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a>`).join('\n      ');
  return `<header class="topbar">
  <div class="shell topbar-inner">
    <a class="brand" href="./" aria-label="Spare Key, home">
      <span class="logo" id="logo" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="22" height="22"><g class="key" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="16" r="5.5"/><path d="M16.5 16H28M24 16v4.5M28 16v3"/></g></svg>
      </span>
      <span class="brand-name">spare key</span>
    </a>
    <nav class="topnav" aria-label="Site">
      ${nav}
      <a data-link="source" href="https://github.com/JHarbourne/sparekey">Source</a>
      <button class="theme-switch" type="button" role="switch" aria-checked="false" data-theme-toggle>
        <span class="vh">Dark mode</span>
        <span class="track" aria-hidden="true"><span class="knob">
          <svg class="moon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
          <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>
        </span></span>
      </button>
    </nav>
  </div>
</header>`;
}

export const footer = `<footer class="footer">
  <div class="shell footer-inner">
    <p>Free and open source. No cookies. Anonymous usage counts only, never the domains or anything you type.</p>
    <p class="footer-links"><span>© JHarbourne.com 2026</span><a href="guide.html">Guide</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms of use</a><a href="feedback.html">Feedback</a><a data-link="source" href="https://github.com/JHarbourne/sparekey">Source</a><span class="version" data-version></span></p>
  </div>
</footer>`;

function page(file, title, description, body) {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Spare Key</title>
<meta name="description" content="${description}">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preload" href="fonts/Geist-Variable.woff2" as="font" type="font/woff2" crossorigin>
<script src="theme-init.js"></script>
<link rel="stylesheet" href="styles.css">
<script type="module" src="lib/site.js"></script>
</head>
<body>
<a class="skip" href="#main">Skip to main content</a>

${header(file)}

<main id="main" class="shell prose" tabindex="-1">
${body.trim()}
</main>

${footer}
</body>
</html>
`;
}

const updated = '27 September 2026';

const PAGES = {
  'guide.html': ['Guide and FAQs', 'How to use Spare Key, and answers to common questions.', `
<p class="eyebrow">guide</p>
<h1>Guide and FAQs</h1>
<p class="lede">Spare Key helps anyone who builds or looks after websites for other people make sure their clients are not stuck if the builder is unavailable.</p>

<h2 id="using">Using it</h2>
<ol>
  <li><strong>People.</strong> Add the client, yourself, and an emergency contact: someone who could reach your accounts and passwords if you could not, such as your executor.</li>
  <li><strong>Domains.</strong> Type each of the client’s domain names. Spare Key reads public records to find the registrar and renewal date, where the domain settings (DNS) live, who hosts the website, who handles the email, which services may send mail as the domain, and whether the security certificate is valid.</li>
  <li><strong>Services.</strong> Each finding becomes a service. For each one, record whose name the account is in, who pays, and whether a second person can manage it. Add anything the lookup cannot see, such as a database, a mailing list or a booking system.</li>
  <li><strong>Access and backups.</strong> Say where the passwords are kept, and where backups are kept. Never type the passwords themselves.</li>
  <li><strong>Risks.</strong> Spare Key lists what would break without you, most serious first. Fix what you can, then check again.</li>
  <li><strong>Hand over.</strong> Download the Word document for the client, and save the inventory file. Anything highlighted in yellow in the document still needs filling in.</li>
</ol>

<h2 id="risks">What the risks mean</h2>
<dl class="defs">
  <dt>Only you can manage a service</dt><dd>The account is in your name and no one else has admin access. Add the client or a trusted helper as an admin, or move the account into the client’s name.</dd>
  <dt>Paid by you</dt><dd>If your payments stop, the service will eventually stop too. Consider moving the bill to the client.</dd>
  <dt>Domain renewal</dt><dd>A lapsed domain takes the website and email down, and after a short grace period anyone can buy the name. Turn on auto-renew and keep the card up to date.</dd>
  <dt>Email on a privately managed server</dt><dd>Email that runs on a server one person looks after stops if they stop. A mail service in the client’s own name is safer.</dd>
  <dt>No SPF or DMARC</dt><dd>These records tell other mail servers which services may send email for the domain. Without them, mail is more likely to land in spam or to be spoofed.</dd>
  <dt>Wrong or expired certificate</dt><dd>Visitors see a security warning, and many will leave.</dd>
</dl>

<h2 id="faq">Frequently asked questions</h2>
<details class="faq"><summary>Is anything I type stored on your server?</summary><p>No. Only the domain names you look up are sent, to a function that reads public records and keeps nothing. Everything else stays in your browser until you save the inventory file. See the <a href="privacy.html">privacy notice</a>.</p></details>
<details class="faq"><summary>Why doesn’t it store passwords?</summary><p>A service holding the keys to other people’s accounts would be a target, and would itself become a single point of failure. Record where passwords are kept instead, for example a password manager your client can reach.</p></details>
<details class="faq"><summary>What does my client get?</summary><p>A plain-English Word document explaining what their website and email depend on, who pays for what, what to do in the first week if you are unavailable, and what still needs fixing. Give them the inventory file too, so anyone can update it later.</p></details>
<details class="faq"><summary>The lookup says “Unrecognised”. What does that mean?</summary><p>Spare Key recognises the common registrars, hosts and email providers. If it cannot tell who a provider is, it says so rather than guessing. Edit the service and type the provider’s name.</p></details>
<details class="faq"><summary>Why is the renewal date missing?</summary><p>Some registries do not publish registration data in a form Spare Key can read. Look the date up in the registrar’s account and add it to the registration service.</p></details>
<details class="faq"><summary>How do I update a handover next year?</summary><p>Open the inventory file with “Open inventory”, press “Check again” on each domain, update anything that has changed, and download a fresh document.</p></details>
<details class="faq"><summary>Can I use it for my own websites?</summary><p>Yes. Put yourself in as the client and a family member or friend as the emergency contact.</p></details>
<details class="faq"><summary>What if this website disappears?</summary><p>Nothing breaks. The documents and inventory files work without it, the file format is published, and the code is open source, so anyone can run their own copy.</p></details>
<details class="faq"><summary>Does it cost anything?</summary><p>No. It is free and open source.</p></details>
<p class="sub">Something missing? <a href="feedback.html">Suggest it</a>.</p>
`],

  'privacy.html': ['Privacy', 'What Spare Key does and does not do with data.', `
<p class="eyebrow">privacy</p>
<h1>Privacy notice</h1>
<p class="sub">Last updated ${updated}.</p>
<p class="lede">Spare Key is designed to collect as little as possible. There are no accounts and no cookies, and it never asks for passwords.</p>

<h2>Who is responsible</h2>
<p>Spare Key is run by Jonathan Harbourne (JHarbourne.com), who is the data controller for the limited processing described here. Contact: <a href="mailto:[[privacy email]]">[[privacy email]]</a>.</p>

<h2>What stays in your browser</h2>
<p>Everything you type into Spare Key, such as names, contact details, services and notes, is kept only in your browser’s local storage on your own device, so you do not lose your work. It is not sent to us. “Start again” deletes it. Your light or dark choice is stored the same way.</p>

<h2>Domain lookups</h2>
<p>When you look up a domain, only the domain name is sent to our lookup function, which runs on Vercel. It reads public information about that domain from Cloudflare’s public DNS service, the official domain registries (through IANA’s list) and the domain’s own web server. The function does not store the domain name or the results. Vercel, which hosts the site, keeps short-lived technical logs of requests, which can include the domain name looked up.</p>

<h2>Usage counts</h2>
<p>We use PostHog, hosted in the EU, to count how features are used, for example how many handover documents are downloaded. It is set up so that it:</p>
<ul>
  <li>sets no cookies and stores nothing on your device;</li>
  <li>builds no profile of you and records no sessions;</li>
  <li>receives only a short list of named events with numbers, never domain names, client names or anything you type;</li>
  <li>does not keep your IP address;</li>
  <li>does not run at all if your browser sends a Do Not Track signal.</li>
</ul>
<p>The legal basis is our legitimate interest in understanding which features are useful. The data cannot identify you.</p>

<h2>Feedback</h2>
<p>The feedback board is run on the Nearmark website, which is also run by Jonathan Harbourne. Posting an idea needs an email address for a sign-in link, and is covered by that site’s privacy notice.</p>

<h2>Your rights</h2>
<p>Because we hold no personal data about you, there is usually nothing to access or delete. If you think we do hold something, contact us at the address above. You can also complain to the Information Commissioner’s Office (ico.org.uk).</p>
`],

  'terms.html': ['Terms of use', 'The terms for using Spare Key.', `
<p class="eyebrow">terms</p>
<h1>Terms of use</h1>
<p class="sub">Last updated ${updated}.</p>

<h2>The service</h2>
<p>Spare Key is a free tool, provided by Jonathan Harbourne (JHarbourne.com), for recording what a website depends on and producing a handover document. By using it you agree to these terms.</p>

<h2>Your responsibilities</h2>
<ul>
  <li>Never enter passwords, card numbers or other secrets into Spare Key.</li>
  <li>Only record information about other people that you have a right to share with your client, such as an emergency contact who has agreed to be named.</li>
  <li>Check the results. Lookups use public records, which can be incomplete or out of date, and the risk checks are a guide, not a guarantee.</li>
  <li>Do not use the lookup to scan domains in bulk, or in any way that could harm the service or others. We may limit or block excessive use.</li>
</ul>

<h2>No warranty</h2>
<p>Spare Key is provided as it is, without any warranty. We are not liable for any loss arising from its use, including a lapsed domain, lost email or a service stopping, except where the law does not allow liability to be excluded.</p>

<h2>Your documents</h2>
<p>The documents and files you create are yours and your client’s. We do not claim any rights in them.</p>

<h2>The code</h2>
<p>The source code is open source under the MIT licence, available on <a data-link="source" href="https://github.com/JHarbourne/sparekey">GitHub</a>. The Geist fonts are used under the SIL Open Font License.</p>

<h2>Changes</h2>
<p>We may update these terms. The date at the top shows when they last changed.</p>

<h2>Law</h2>
<p>These terms are governed by the law of England and Wales.</p>
`],

  'feedback.html': ['Feedback', 'Suggest an improvement or report a problem with Spare Key.', `
<p class="eyebrow">feedback</p>
<h1>Feedback</h1>
<p class="lede">Spare Key gets better from what people tell us. Ideas, problems and questions are all welcome.</p>

<div class="choice">
  <a class="choice-card" data-link="feedbackBoard" href="https://nearmark.co.uk/feedback?area=sparekey">
    <strong>Suggest an improvement</strong>
    <span>Post an idea on the public feedback board, or vote for someone else’s. You sign in with a link sent to your email, no password.</span>
    <span class="go" aria-hidden="true">Open the board →</span>
  </a>
  <a class="choice-card" data-link="issues" href="https://github.com/JHarbourne/sparekey/issues/new">
    <strong>Report a problem</strong>
    <span>Something broken or wrong? Open an issue on GitHub. Please do not include client details or anything private.</span>
    <span class="go" aria-hidden="true">Report on GitHub →</span>
  </a>
</div>
<p class="sub">The feedback board is shared with Nearmark, another of our projects, and ideas about Spare Key are tagged “Spare Key”.</p>
`],
};

export function build() {
  const out = {};
  for (const [file, [title, desc, body]] of Object.entries(PAGES)) out[file] = page(file, title, desc, body);
  // index.html: replace its header and footer with the shared ones
  let idx = readFileSync(join(root, 'index.html'), 'utf8');
  idx = idx.replace(/<header class="topbar">[\s\S]*?<\/header>/, header('index.html'))
    .replace(/<footer class="footer">[\s\S]*?<\/footer>/, footer);
  out['index.html'] = idx;
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [file, html] of Object.entries(build())) writeFileSync(join(root, file), html);
  console.log('Pages written.');
}
