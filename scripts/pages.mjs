// Writes the shared header and footer into every page, and generates the
// content pages (guide, privacy, terms, feedback). Run: node scripts/pages.mjs
// A test fails if the committed pages are out of date.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function header(current) {
  const nav = [['ask.html', 'For website owners'], ['guide.html', 'Guide'], ['feedback.html', 'Feedback']]
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

function page(file, title, description, body, script = 'lib/site.js') {
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
<script type="module" src="${script}"></script>
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

  'ask.html': ['For website owners', 'Someone else looks after your website? Ask them for a handover, so you are never stuck without them.', `
<p class="eyebrow">for website owners</p>
<h1>Someone else looks after your website? Make sure you’re never stuck without them.</h1>
<p class="lede">If one person built your website or runs it for you, the keys to it are probably in their accounts, and often paid on their card. That’s fine until they’re ill, busy or move on. Spare Key helps them write down everything you would need, in plain English.</p>

<ol class="how-steps compact">
  <li><span class="eyebrow">01</span><h2 class="h3">You fill in a few details</h2><p>Your name, your website address and who looks after it. About two minutes.</p></li>
  <li><span class="eyebrow">02</span><h2 class="h3">We write the email</h2><p>You send it to your web person. The link in it opens Spare Key with your details already filled in.</p></li>
  <li><span class="eyebrow">03</span><h2 class="h3">You get a handover</h2><p>They add the technical details and send you a document to keep: what your website depends on, who pays for what, and what to do if they’re unavailable.</p></li>
</ol>

<form id="ask-form" class="panel ask-form" novalidate>
  <h2>Your request</h2>
  <p class="sub">Nothing you type here is stored. It goes into the email you send, and nowhere else.</p>
  <div class="grid">
    <fieldset>
      <legend>You</legend>
      <label>Your name <input name="name" autocomplete="name" required aria-describedby="err-name"></label>
      <p class="field-error" id="err-name" hidden>Please add your name.</p>
      <label>Organisation <span class="opt">optional</span><input name="organisation" autocomplete="organization"></label>
      <label>Your email <input name="email" type="email" autocomplete="email" required aria-describedby="email-hint err-email"></label>
      <p class="hint" id="email-hint">So they can send you the finished document.</p>
      <p class="field-error" id="err-email" hidden>Please add an email address, like name@example.org.</p>
    </fieldset>
    <fieldset>
      <legend>Your web person</legend>
      <label>Their name <input name="builderName" autocomplete="off"></label>
      <label>Their email <input name="builderEmail" type="email" autocomplete="off" aria-describedby="builder-hint"></label>
      <p class="hint" id="builder-hint">Only used to address the email on your device. It isn’t put in the link.</p>
    </fieldset>
  </div>
  <label class="block">Your website addresses
    <span class="hint" id="domains-hint">One per line, for example villageartstrail.org. Include any other addresses you use for email.</span>
    <textarea name="domains" rows="2" required aria-describedby="domains-hint err-domains" spellcheck="false" autocapitalize="off"></textarea>
  </label>
  <p class="field-error" id="err-domains" hidden>Please add at least one website address, like example.org.</p>
  <label class="block">A note to them <span class="opt">optional</span>
    <textarea name="message" rows="3"></textarea>
  </label>
  <div class="actions"><button type="submit" class="btn primary lg">Create my request</button></div>
</form>

<section id="ask-result" class="panel" hidden tabindex="-1" aria-labelledby="result-h">
  <h2 id="result-h">Your request is ready</h2>
  <p class="sub">Send it by email, or copy the message and send it however you usually talk to them.</p>
  <div class="actions">
    <a id="send-email" class="btn primary lg" href="#">Open in my email</a>
    <button type="button" id="copy-message" class="btn lg">Copy the message</button>
    <button type="button" id="copy-link" class="btn lg">Copy just the link</button>
  </div>
  <p id="ask-status" class="status" role="status" aria-live="polite"></p>
  <div class="email-preview" id="email-preview" aria-label="Email preview"></div>
</section>

<section id="quick-check" class="panel" hidden aria-labelledby="qc-h">
  <h2 id="qc-h">While you wait: what anyone can see</h2>
  <p class="sub">We checked the public records for your website. Nothing is stored. Your web person will fill in the rest.</p>
  <p id="qc-status" class="status" role="status" aria-live="polite"></p>
  <div id="qc-results"></div>
</section>
`, 'lib/ask.js'],
  'guide.html': ['Guide and FAQs', 'How to use Spare Key, what the risks mean, a jargon buster, and answers to common questions.', `
<div class="guide-hero">
  <p class="eyebrow">guide</p>
  <h1>Make your first handover in fifteen minutes</h1>
  <p class="lede">Everything you need to know to use Spare Key, whether you build websites or someone builds yours.</p>
  <div class="cta"><a class="btn primary" href="./#start">Open the tool</a><a class="btn" href="ask.html">I own a website</a></div>
</div>

<div class="guide-layout">
  <nav class="toc" aria-label="On this page">
    <p class="toc-title">On this page</p>
    <ol>
      <li><a href="#steps">Six steps</a></li>
      <li><a href="#risks">What the risks mean</a></li>
      <li><a href="#jargon">Jargon buster</a></li>
      <li><a href="#faq">Questions</a></li>
    </ol>
  </nav>

  <div class="guide-body">
    <section id="steps" aria-labelledby="steps-h">
      <h2 id="steps-h" class="section-title"><span class="eyebrow">six steps</span>From domain name to handover</h2>
      <ol class="timeline">
        <li>
          <div class="tl-text"><h3>People</h3><p>Add the client, yourself, and an emergency contact: someone who could reach your accounts if you couldn’t, such as your executor.</p></div>
          <div class="tl-demo" aria-hidden="true"><span class="k">emergency</span> Pat Harbourne · executor</div>
        </li>
        <li>
          <div class="tl-text"><h3>Domains</h3><p>Type each domain. Spare Key reads the public records: registrar and renewal date, DNS host, website host, email provider, who can send as the domain, and the certificate.</p></div>
          <div class="tl-demo" aria-hidden="true"><span class="c">$ lookup example.org</span><br><span class="k">registrar</span> GoDaddy · renews in 43 days<br><span class="k">email</span> Google Workspace</div>
        </li>
        <li>
          <div class="tl-text"><h3>Services</h3><p>Each finding becomes a service. Record whose name it’s in, who pays, and whether a second person can manage it. Add what the lookup can’t see.</p></div>
          <div class="tl-demo" aria-hidden="true"><span class="k">registration</span> in the builder’s name<br><span class="k">second admin</span> <span class="w">no</span></div>
        </li>
        <li>
          <div class="tl-text"><h3>Access and backups</h3><p>Say where the passwords and backups are kept. Never type the passwords themselves.</p></div>
          <div class="tl-demo" aria-hidden="true"><span class="k">passwords</span> shared 1Password vault<br><span class="k">backups</span> weekly, client’s Google Drive</div>
        </li>
        <li>
          <div class="tl-text"><h3>Risks</h3><p>See what would break without you, most serious first. Fix what you can and watch the list shrink.</p></div>
          <div class="tl-demo" aria-hidden="true"><span class="tag high">serious</span> email on a privately run server<br><span class="tag med">fix soon</span> auto-renew not confirmed</div>
        </li>
        <li>
          <div class="tl-text"><h3>Hand over</h3><p>Download the Word document for the client and save the inventory file. Yellow highlights are gaps still to fill.</p></div>
          <div class="tl-demo" aria-hidden="true"><span class="k">↓</span> village-arts-trail-handover.docx<br><span class="k">↓</span> village-arts-trail-inventory.json</div>
        </li>
      </ol>
    </section>

    <section id="risks" aria-labelledby="risks-h">
      <h2 id="risks-h" class="section-title"><span class="eyebrow">what the risks mean</span>Each one, and how to fix it</h2>
      <div class="risk-cards">
        <article class="rc high"><span class="tag">Serious</span><h3>Only you can manage a service</h3><p>The account is in your name and no one else can get in.</p><p class="fix"><strong>Fix:</strong> add the client or a trusted helper as an admin, or move the account into the client’s name.</p></article>
        <article class="rc high"><span class="tag">Serious</span><h3>Email on a privately run server</h3><p>If whoever runs that server stops, email stops, often without warning.</p><p class="fix"><strong>Fix:</strong> move email to a service in the client’s own name.</p></article>
        <article class="rc high"><span class="tag">Serious</span><h3>Wrong or expired certificate</h3><p>Visitors see a security warning, and many leave.</p><p class="fix"><strong>Fix:</strong> ask the host to reissue it for the right name.</p></article>
        <article class="rc med"><span class="tag">Fix soon</span><h3>Domain renewal</h3><p>A lapsed domain takes the website and email down, and anyone can then buy the name.</p><p class="fix"><strong>Fix:</strong> turn on auto-renew and keep the card current.</p></article>
        <article class="rc med"><span class="tag">Fix soon</span><h3>Paid by you</h3><p>When your payments stop, the service stops too.</p><p class="fix"><strong>Fix:</strong> move the bill to the client.</p></article>
        <article class="rc low"><span class="tag">Check</span><h3>No SPF or DMARC</h3><p>Mail is more likely to land in spam, or be spoofed.</p><p class="fix"><strong>Fix:</strong> add the records your mail provider gives you.</p></article>
      </div>
    </section>

    <section id="jargon" aria-labelledby="jargon-h">
      <h2 id="jargon-h" class="section-title"><span class="eyebrow">jargon buster</span>The words you’ll see, in plain English</h2>
      <dl class="jargon">
        <div><dt>Domain name</dt><dd>Your address on the internet, like example.org. You rent it yearly from a registrar.</dd></div>
        <div><dt>Registrar</dt><dd>The company you rent the domain from, such as GoDaddy or Namecheap.</dd></div>
        <div><dt>DNS</dt><dd>The settings that point your domain at your website and email.</dd></div>
        <div><dt>Hosting</dt><dd>The service that stores your website and shows it to visitors.</dd></div>
        <div><dt>MX record</dt><dd>The DNS setting that says where your email is delivered.</dd></div>
        <div><dt>SPF and DMARC</dt><dd>DNS settings that tell other mail servers who may send email as you.</dd></div>
        <div><dt>Certificate</dt><dd>What makes the padlock appear. It must match your domain and be renewed.</dd></div>
        <div><dt>RDAP</dt><dd>The public registry record that shows who a domain is registered with and when it renews.</dd></div>
        <div><dt>Inventory file</dt><dd>The .json file Spare Key saves. It holds no passwords, so you can keep it anywhere and open it again next year.</dd></div>
      </dl>
    </section>

    <section id="faq" aria-labelledby="faq-h">
      <h2 id="faq-h" class="section-title"><span class="eyebrow">questions</span>Frequently asked</h2>
      <label class="faq-filter"><span class="vh">Filter questions</span><input id="faq-filter" type="search" placeholder="Filter questions…" autocomplete="off" aria-describedby="faq-count"></label>
      <p id="faq-count" class="status" role="status" aria-live="polite"></p>
      <div id="faqs">
      <details class="faq"><summary>I don’t build websites. Someone looks after mine. Can I use this?</summary><p>Yes. Go to <a href="ask.html">For website owners</a>, fill in a few details, and we write an email for you to send to your web person. They complete the handover and send it back to you.</p></details>
      <details class="faq"><summary>Is anything I type stored on your server?</summary><p>No. Only the domain names you look up are sent, to a function that reads public records and keeps nothing. Everything else stays in your browser until you save the inventory file. See the <a href="privacy.html">privacy notice</a>.</p></details>
      <details class="faq"><summary>Why doesn’t it store passwords?</summary><p>A service holding the keys to other people’s accounts would be a target, and would itself become a single point of failure. Record where passwords are kept instead, for example a password manager your client can reach.</p></details>
      <details class="faq"><summary>What does my client get?</summary><p>A plain-English Word document explaining what their website and email depend on, who pays for what, what to do in the first week if you are unavailable, and what still needs fixing. Give them the inventory file too, so anyone can update it later.</p></details>
      <details class="faq"><summary>The lookup says “Unrecognised”. What does that mean?</summary><p>Spare Key recognises the common registrars, hosts and email providers. If it cannot tell who a provider is, it says so rather than guessing. Edit the service and type the provider’s name.</p></details>
      <details class="faq"><summary>Why is the renewal date missing?</summary><p>Some registries do not publish registration data in a form Spare Key can read. Look the date up in the registrar’s account and add it to the registration service.</p></details>
      <details class="faq"><summary>How do I update a handover next year?</summary><p>Open the inventory file with “Open inventory”, press “Check again” on each domain, update anything that has changed, and download a fresh document.</p></details>
      <details class="faq"><summary>Can I use it for my own websites?</summary><p>Yes. Put yourself in as the client and a family member or friend as the emergency contact.</p></details>
      <details class="faq"><summary>What if this website disappears?</summary><p>Nothing breaks. The documents and inventory files work without it, the file format is published, and the code is open source, so anyone can run their own copy.</p></details>
      <details class="faq"><summary>Does it cost anything?</summary><p>No. It is free and open source.</p></details>
      </div>
      <p class="sub">Something missing? <a href="feedback.html">Suggest it</a>.</p>
    </section>
  </div>
</div>
`, 'lib/guide.js'],
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
  for (const [file, [title, desc, body, script]] of Object.entries(PAGES)) out[file] = page(file, title, desc, body, script);
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
