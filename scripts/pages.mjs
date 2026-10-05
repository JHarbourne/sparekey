// Writes the shared header and footer into every page, and generates the
// content pages (guide, privacy, terms, feedback). Run: node scripts/pages.mjs
// A test fails if the committed pages are out of date.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { BEFORE_INTRO, beforeList } from '../lib/checklist.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { RDAP_HOSTS } from '../lib/lookup.js';
import { checkPage } from './check-page.mjs';
import { policyPage } from './policy-page.mjs';
import { passwordsPage } from './passwords-page.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function header(current) {
  const nav = [['./#start', '<span class="nav-long">For website builders</span><span class="nav-short">Builders</span>'], ['ask.html', '<span class="nav-long">For website owners</span><span class="nav-short">Owners</span>'], ['guide.html', 'Guide'], ['faq.html', 'FAQs'], ['feedback.html', 'Feedback']]
    .map(([href, label]) => `<a href="${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a>`).join('\n      ');
  return `<header class="topbar">
  <div class="shell topbar-inner">
    <a class="brand" href="./" aria-label="Spare Key, home">
      <span class="logo" id="logo" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="26" height="26"><g class="key" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="16" r="5.5"/><path d="M16.5 16H28M24 16v4.5M28 16v3"/></g></svg>
      </span>
      <span class="brand-name">spare<b>key</b></span>
    </a>
    <a class="beta" href="feedback.html" title="Spare Key is in beta. Tell us what doesn’t work." aria-label="Beta: Spare Key is new. Tell us what doesn’t work.">beta</a>
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
    <p class="foot-line"><strong>Spare Key never asks for a password.</strong> If a site calling itself Spare Key does, it isn’t us. Free and open source, no cookies, and nothing you type is sent to us. <a href="check.html">Check it yourself</a></p>
    <p class="footer-links"><span class="foot-brand"><svg class="foot-key" viewBox="0 0 32 32" width="18" height="18" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="11" cy="16" r="5.5"/><path d="M16.5 16H28M24 16v4.5M28 16v3"/></g></svg><span>spare<b>key</b></span></span><span>© JHarbourne.com 2026</span><a href="guide.html">Guide</a><a href="faq.html">FAQs</a><a href="domain-policy.html">Domain policy</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms of use</a><a href="feedback.html">Feedback</a><a data-link="source" href="https://github.com/JHarbourne/sparekey">Source</a><span class="version" data-version></span><a class="foot-beta" href="feedback.html" title="Spare Key is in beta. Tell us what doesn’t work.">beta</a></p>
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
<script src="links.js" defer></script>
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
  'check.html': checkPage,
  'domain-policy.html': policyPage,
  'passwords.html': passwordsPage,

  'ask.html': ['For website owners', 'Someone else looks after your website? Ask them for a continuity plan, so you are never stuck without them.', `
<p class="eyebrow">for website owners</p>
<h1>Someone else looks after your website? Make sure you’re never stuck without them.</h1>
<p class="lede">If one person built your website or runs it for you, the keys to it are probably in their accounts, and often paid on their card. That’s fine until they’re ill, busy or move on. Spare Key helps them write down everything you would need, in plain English.</p>

<ol class="how-steps compact">
  <li><span class="eyebrow">01</span><h2 class="h3">You fill in a few details</h2><p>Your name, your website address and who looks after it. About two minutes.</p></li>
  <li><span class="eyebrow">02</span><h2 class="h3">We write the email</h2><p>You send it to your web person. The link in it opens Spare Key with your details already filled in.</p></li>
  <li><span class="eyebrow">03</span><h2 class="h3">You get a continuity plan</h2><p>They add the technical details and send you a document to keep: what your website depends on, who pays for what, and what to do if they were ever unable to work for a long time.</p></li>
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
  <fieldset class="send-to">
    <legend>Who should receive the finished plan?</legend>
    <div class="seg" role="radiogroup">
      <label class="seg-opt"><input type="radio" name="recipient" value="me" checked> Me</label>
      <label class="seg-opt"><input type="radio" name="recipient" value="other"> Someone else, such as our IT or security lead</label>
    </div>
    <div class="grid" id="send-to-fields" hidden>
      <label>Their name <span class="opt">optional</span><input name="toName" autocomplete="off"></label>
      <label>Their role <span class="opt">optional</span><input name="toRole" autocomplete="off" placeholder="For example, IT manager"></label>
      <label class="span2">Their email <input name="toEmail" type="email" autocomplete="off" aria-describedby="err-to"></label>
      <p class="field-error span2" id="err-to" hidden>Please add their email address, like it@example.org.</p>
    </div>
  </fieldset>
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
  'guide.html': ['Guide', 'How to use Spare Key: six steps, what the risks mean, a jargon buster and templates.', `
<div class="guide-hero">
  <p class="eyebrow">guide</p>
  <h1>Write your first continuity plan in fifteen minutes</h1>
  <p class="lede">Everything you need to know to use Spare Key, whether you build websites or someone builds yours.</p>
  <div class="cta"><a class="btn primary" href="./#start">I build websites</a><a class="btn" href="ask.html">I own a website</a></div>
  <p class="cta-note">Builders map a client’s setup and write the continuity plan. Owners send a request to the person who looks after their website.</p>
</div>

<div class="guide-layout">
  <nav class="toc" aria-label="On this page">
    <p class="toc-title">On this page</p>
    <ol>
      <li><a href="#before">What you’ll need</a></li>
      <li><a href="#steps">Six steps</a></li>
      <li><a href="#risks">What the risks mean</a></li>
      <li><a href="#code">Where the code lives</a></li>
      <li><a href="#jargon">Jargon buster</a></li>
      <li><a href="#templates">Templates</a></li>
    </ol>
    <p class="toc-more"><a href="faq.html">Questions and answers&nbsp;→</a></p>
    <p class="toc-more"><a href="passwords.html">Passwords and backups&nbsp;→</a></p>
  </nav>

  <div class="guide-body">
    <section id="before" aria-labelledby="before-guide-h">
      <h2 id="before-guide-h" class="section-title"><span class="eyebrow">before you start</span>What to have to hand</h2>
      <p>${BEFORE_INTRO}</p>
      ${beforeList()}
    </section>

    <section id="steps" aria-labelledby="steps-h">
      <h2 id="steps-h" class="section-title"><span class="eyebrow">six steps</span>From domain name to continuity plan</h2>
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
          <div class="tl-demo" aria-hidden="true"><span class="k">↓</span> village-arts-trail-continuity-plan.docx<br><span class="k">↓</span> village-arts-trail-inventory.json</div>
        </li>
      </ol>
    </section>

    <section id="risks" aria-labelledby="risks-h">
      <h2 id="risks-h" class="section-title"><span class="eyebrow">what the risks mean</span>Each one, and how to fix it</h2>
      <div class="risk-cards">
        <article class="rc high"><span class="tag">Serious</span><h3>Only you can manage a service</h3><p>The account is in your name and no one else can get in.</p><p class="fix"><strong>Fix:</strong> add the client or a trusted helper as an admin, or move the account into the client’s name.</p></article>
        <article class="rc high"><span class="tag">Serious</span><h3>Email on a privately run server</h3><p>If whoever runs that server stops, email stops, often without warning.</p><p class="fix"><strong>Fix:</strong> move email to a service in the client’s own name.</p></article>
        <article class="rc high"><span class="tag">Serious</span><h3>An old address someone else now owns</h3><p>It was registered again after you stopped using it, and may be using your old name to sell things.</p><p class="fix"><strong>Fix:</strong> open it and look, then follow the <a href="domain-policy.html">domain policy</a> page on who to tell.</p></article>
        <article class="rc high"><span class="tag">Serious</span><h3>Expired certificate</h3><p>Visitors see a security warning, and many leave.</p><p class="fix"><strong>Fix:</strong> ask the host to renew it.</p></article>
        <article class="rc med"><span class="tag">Fix soon</span><h3>Domain renewal</h3><p>A lapsed domain takes the website and email down, and anyone can then buy the name.</p><p class="fix"><strong>Fix:</strong> turn on auto-renew and keep the card current.</p></article>
        <article class="rc med"><span class="tag">Fix soon</span><h3>Paid by you</h3><p>When your payments stop, the service stops too.</p><p class="fix"><strong>Fix:</strong> move the bill to the client.</p></article>
        <article class="rc low"><span class="tag">Check</span><h3>No SPF or DMARC</h3><p>Mail is more likely to land in spam, or be spoofed.</p><p class="fix"><strong>Fix:</strong> add the records your mail provider gives you.</p></article>
      </div>
    </section>

    <section id="code" aria-labelledby="code-h">
      <h2 id="code-h" class="section-title"><span class="eyebrow">where the code lives</span>If you work on your own</h2>
      <p>If you build websites on your own, you may never have needed GitHub or anything like it. But the files that make up a website have to be somewhere the client can reach if you can’t, and on your laptop isn’t that place. What to do depends on how the site was made.</p>
      <table class="svc-table">
        <thead><tr><th scope="col">If the site is…</th><th scope="col">What to do</th></tr></thead>
        <tbody>
          <tr><td>Made with a site builder, such as Wix, Squarespace or Shopify</td><td>Nothing about code: there isn’t any to keep. Make sure the account is in the client’s name, with you added as a contributor.</td></tr>
          <tr><td>WordPress, or another content editor, on hosting</td><td>The site lives on the hosting, with its content in a database. Put the hosting account in the client’s name and send backups to the client’s own storage (see <a href="passwords.html#backups">backups</a>). If you wrote a custom theme or plugin, keep a copy of that on GitHub too.</td></tr>
          <tr><td>Built from code, such as HTML, Astro or Next.js</td><td>The code needs a home the client can reach: a free GitHub organisation in their name. The steps are below.</td></tr>
        </tbody>
      </table>

      <h3>What GitHub is</h3>
      <p>A website that stores code and every earlier version of it, so nothing is lost and any change can be undone. It’s free for this. Hosts such as Vercel and Netlify read the code from GitHub and publish the site whenever it changes. An <strong>organisation</strong> is a shared space on GitHub that belongs to the client, not to you, with people invited in.</p>

      <h3>Give each client their own organisation</h3>
      <ol class="timeline checks">
        <li><div class="tl-text"><h3>The client makes a free GitHub account</h3><p>At <a href="https://github.com/signup">github.com</a>, with an email address the organisation controls, such as office@. Their login goes in their password vault.</p></div></li>
        <li><div class="tl-text"><h3>Create an organisation for them</h3><p>On GitHub, click <strong>+</strong> at the top of the page, choose <strong>New organization</strong> and pick the <strong>Free</strong> plan. Name it after the client. If you create it, invite the client and make them an <strong>Owner</strong>, so there are two of you.</p></div></li>
        <li><div class="tl-text"><h3>Move the code into it</h3><p>In the repository, open <strong>Settings</strong>, scroll to the <strong>Danger Zone</strong> and choose <a href="https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository">Transfer ownership</a>. Pick the client’s organisation. Old links still work.</p></div></li>
        <li><div class="tl-text"><h3>Check the site still publishes</h3><p>Reconnect the host to the new organisation. On Vercel’s free plan, a private repository owned by an organisation won’t publish directly: use a paid plan in the client’s name, or publish with GitHub Actions. Vercel’s free plan is also only for non-commercial sites, so a business should be on a paid plan anyway.</p></div></li>
        <li><div class="tl-text"><h3>Turn on two-step sign-in</h3><p>In the organisation’s settings, require two-factor authentication for everyone, and save each person’s recovery codes in the client’s vault.</p></div></li>
      </ol>
      <p><strong>Not ready to move it yet?</strong> At least add the client as a collaborator: in the repository, open <strong>Settings</strong>, then <strong>Collaborators</strong>. They can then see and download the code, though only you can change its settings.</p>

      <h3>If the files are only on your computer</h3>
      <p>Install <a href="https://desktop.github.com/">GitHub Desktop</a>. It does all of this without the command line. Add the site’s folder, choose <strong>Publish repository</strong>, pick the client’s organisation and keep it private. Leave out any file that holds passwords or keys, such as <code>.env</code>: GitHub Desktop lets you ignore it.</p>

      <h3>Your own sites</h3>
      <p>Code for your own projects can stay in your account. Name a successor under <strong>Settings</strong>, <strong>Account</strong>, <strong>Successor settings</strong>, who can take over your public repositories. For private ones, make sure your GitHub login and recovery codes are in your password manager, with emergency access set up.</p>
    </section>

    <section id="jargon" aria-labelledby="jargon-h">
      <h2 id="jargon-h" class="section-title"><span class="eyebrow">jargon buster</span>The words you’ll see, in plain English</h2>
      <dl class="jargon">
        <div><dt>Domain name</dt><dd>Your address on the internet, like example.org. You rent it yearly from a registrar.</dd></div>
        <div><dt>Registrar</dt><dd>The company you rent the domain from, such as GoDaddy or Namecheap.</dd></div>
        <div><dt>DNS</dt><dd>The settings that point your domain at your website and email.</dd></div>
        <div><dt>Repository</dt><dd>A folder of a website’s code, with every earlier version kept. Often shortened to repo.</dd></div>
        <div><dt>GitHub</dt><dd>The best-known place to keep repositories. Hosts such as Vercel publish from it.</dd></div>
        <div><dt>Hosting</dt><dd>The service that stores your website and shows it to visitors.</dd></div>
        <div><dt>MX record</dt><dd>The DNS setting that says where your email is delivered.</dd></div>
        <div><dt>SPF and DMARC</dt><dd>DNS settings that tell other mail servers who may send email as you.</dd></div>
        <div><dt>Certificate</dt><dd>What makes the padlock appear. It must match your domain and be renewed.</dd></div>
        <div><dt>RDAP</dt><dd>The public registry record that shows who a domain is registered with and when it renews.</dd></div>
        <div><dt>Inventory file</dt><dd>The .json file Spare Key saves. It holds no passwords, so you can keep it anywhere and open it again next year.</dd></div>
      </dl>
    </section>

    <section id="templates" aria-labelledby="tpl-h">
      <h2 id="tpl-h" class="section-title"><span class="eyebrow">templates</span>Rather fill it in yourself?</h2>
      <p>The same continuity plan as blank templates. Nothing to sign up for, and nothing leaves your computer.</p>
      <div class="tpl-grid">
        <a class="tpl" href="templates/spare-key-continuity-plan-template.docx" download>
          <span class="tpl-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 15.5h6M9 19h4"/></svg></span>
          <span><strong>Word template</strong><span class="sub">The continuity plan with examples to replace. Print it or keep it in your own cloud storage.</span><span class="tpl-meta">.docx · 5 pages</span></span>
        </a>
        <a class="tpl" href="templates/spare-key-inventory-template.xlsx" download>
          <span class="tpl-icon x" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.5h16M4 14.5h16M10 4v16"/></svg></span>
          <span><strong>Excel inventory</strong><span class="sub">Services, domains and contacts, with drop-downs. It flags risks and renewals for you.</span><span class="tpl-meta">.xlsx · 4 tabs</span></span>
        </a>
        <a class="tpl" href="templates/spare-key-domain-policy.docx" download>
          <span class="tpl-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 15.5h6M9 19h4"/></svg></span>
          <span><strong>Domain name policy</strong><span class="sub">A policy to adopt, including what to check before letting an address go.</span><span class="tpl-meta">.docx · 2 pages</span></span>
        </a>
      </div>
    </section>

  </div>
</div>
`, 'lib/guide.js'],
  'faq.html': ['Questions and answers', 'Answers to common questions about Spare Key, continuity plans, old addresses and privacy.', `
<p class="eyebrow">questions</p>
<h1>Questions and answers</h1>
<p class="lede">Short answers to what people ask most. For how the tool works, step by step, see the <a href="guide.html">guide</a>.</p>
<label class="faq-filter"><span class="vh">Filter questions</span><input id="faq-filter" type="search" placeholder="Filter questions…" autocomplete="off" aria-describedby="faq-count"></label>
<p id="faq-count" class="status" role="status" aria-live="polite"></p>
<div id="faqs">
      <details class="faq"><summary>I don’t build websites. Someone looks after mine. Can I use this?</summary><p>Yes. Go to <a href="ask.html">For website owners</a>, fill in a few details, and we write an email for you to send to your web person. They write the continuity plan and send it back to you, or to whoever you choose, such as your IT or security lead.</p></details>
      <details class="faq"><summary>Can I fill it in without the tool?</summary><p>Yes. Download the <a href="guide.html#templates">Word or Excel template</a> and fill it in by hand.</p></details>
      <details class="faq"><summary>Is anything I type stored on your server?</summary><p>No. There is no Spare Key server. Lookups run in your browser and send only the domain name, to public lookup services. Everything else stays in your browser until you save the inventory file. <a href="check.html">Check it yourself</a>.</p></details>
      <details class="faq"><summary>Where should the passwords go, then?</summary><p>In a shared vault the client owns, with you as a member. See <a href="passwords.html">logins, sign-in codes and backups</a> for the options, best first.</p></details>
      <details class="faq"><summary>Why doesn’t it store passwords?</summary><p>A service holding the keys to other people’s accounts would be a target, and would itself become a single point of failure. Record where passwords are kept instead, for example a password manager your client can reach.</p></details>
      <details class="faq"><summary>What does my client get?</summary><p>A plain-English Word document explaining what their website and email depend on, who pays for what, what to do in the first week if you were unable to work for a long time, and what still needs fixing. Give them the inventory file too, so anyone can update it later.</p></details>
      <details class="faq"><summary>The lookup says “Unrecognised”. What does that mean?</summary><p>Spare Key recognises the common registrars, hosts and email providers. If it cannot tell who a provider is, it says so rather than guessing. Edit the service and type the provider’s name.</p></details>
      <details class="faq"><summary>Why is the renewal date missing?</summary><p>Some registries do not publish registration data in a form Spare Key can read. Look the date up in the registrar’s account and add it to the registration service.</p></details>
      <details class="faq"><summary>How do I update a plan next year?</summary><p>Open the inventory file with “Open inventory”, press “Check again” on each domain, update anything that has changed, and download a fresh document.</p></details>
      <details class="faq"><summary>Can I use it for my own websites?</summary><p>Yes. Put yourself in as the client and a family member or friend as the emergency contact.</p></details>
      <details class="faq"><summary>What if this website disappears?</summary><p>Nothing breaks. The documents and inventory files work without it, the file format is published, and the code is open source, so anyone can run their own copy.</p></details>
      <details class="faq"><summary>What is an “old address”, and why does it matter?</summary><p>An address your organisation used before a rename, a merger or a new website. If it lapses, anyone can buy it along with its old links and search listings, and use your name to sell things. Add old addresses in step 02 and Spare Key checks who holds them now. See the <a href="domain-policy.html">domain name policy</a>.</p></details>
      <details class="faq"><summary>Can the finished plan go to our IT or security lead instead of me?</summary><p>Yes. On <a href="ask.html">For website owners</a>, choose “Someone else” and add their name, role and email. Your web person’s email to send the plan goes to them.</p></details>
      <details class="faq"><summary>Does it work for addresses outside the UK?</summary><p>Yes. Lookups work for most endings, including .com, .org, .net, .dev and many country endings. Where a registry doesn’t publish its records in a form Spare Key can read, the renewal date is left for you to add.</p></details>
      <details class="faq"><summary>Does it cost anything?</summary><p>No. It is free and open source.</p></details>
      </div>
<p class="sub">Something missing? <a href="feedback.html">Suggest it</a>, or email <a href="mailto:hello@jharbourne.com">hello@jharbourne.com</a>.</p>
`, 'lib/guide.js'],
  'privacy.html': ['Privacy', 'What Spare Key does and does not do with data.', `
<p class="eyebrow">privacy</p>
<h1>Privacy notice</h1>
<p class="sub">Last updated ${updated}.</p>
<p class="lede">Spare Key is designed to collect as little as possible. There are no accounts and no cookies, and it never asks for passwords.</p>

<h2>Who is responsible</h2>
<p>Spare Key is run by Jonathan Harbourne (JHarbourne.com), who is the data controller for the limited processing described here. Contact: <a href="mailto:hello@jharbourne.com">hello@jharbourne.com</a>.</p>

<h2>What stays in your browser</h2>
<p>Everything you type into Spare Key, such as names, contact details, services and notes, is kept only in your browser’s local storage on your own device, so you do not lose your work. It is not sent to us. “Start again” deletes it. Your light or dark choice is stored the same way.</p>

<h2>Domain lookups</h2>
<p>Lookups run in your browser. Spare Key has no server that receives them. Your browser sends only the domain name, and only to public lookup services: Cloudflare’s public DNS, IANA’s list of registries, the registry for the domain’s ending (such as Nominet or Verisign), and Cert Spotter’s public log of security certificates. Those services have their own privacy policies. Spare Key never connects to the website itself. The page’s security policy stops your browser sending anything to any other address. <a href="check.html">See how to check this yourself</a>.</p>

<h2>Usage counts</h2>
<p>We use PostHog, hosted in the EU, to count how features are used, for example how many continuity plans are downloaded. It is set up so that it:</p>
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
<p>After your first continuity plan, Spare Key offers an optional survey once. It is a Google Form: your answers go to Google and to us, and are covered by Google’s privacy policy as well as this notice. It doesn’t ask for your name or email, doesn’t need a Google account, and nothing you typed into Spare Key is sent with it, only the version number. Your browser remembers that you’ve answered or said no thanks, so it isn’t offered again; that note stays on your device.</p>

<h2>Your rights</h2>
<p>Because we hold no personal data about you, there is usually nothing to access or delete. If you think we do hold something, contact us at the address above. You can also complain to the Information Commissioner’s Office (ico.org.uk).</p>
`],

  'terms.html': ['Terms of use', 'The terms for using Spare Key.', `
<p class="eyebrow">terms</p>
<h1>Terms of use</h1>
<p class="sub">Last updated ${updated}.</p>

<h2>The service</h2>
<p>Spare Key is a free tool, provided by Jonathan Harbourne (JHarbourne.com), for recording what a website depends on and producing a continuity plan. By using it you agree to these terms.</p>

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
<p class="lede">Spare Key is in beta: it works, and it is new. It gets better from what people tell us, so ideas, problems and questions are all welcome.</p>

<div class="choice">
  <a class="choice-card" data-link="feedbackBoard" href="https://nearmark.co.uk/feedback?product=sparekey">
    <strong>Suggest an improvement</strong>
    <span>Post an idea on the public feedback board, or vote for someone else’s. You sign in with a link sent to your email, no password.</span>
    <span class="go" aria-hidden="true">Open the board&nbsp;→</span>
  </a>
  <a class="choice-card" data-link="issues" href="https://github.com/JHarbourne/sparekey/issues/new">
    <strong>Report a problem</strong>
    <span>Something broken or wrong? Open an issue on GitHub. Please do not include client details or anything private.</span>
    <span class="go" aria-hidden="true">Report on GitHub&nbsp;→</span>
  </a>
  <a class="choice-card" data-link="survey" data-needs-link href="#" hidden>
    <strong>Tell us how it went</strong>
    <span>Two minutes, optional and anonymous: how likely you are to recommend Spare Key, and how easy it was to use.</span>
    <span class="go" aria-hidden="true">Answer the questions&nbsp;→</span>
  </a>
</div>
<p class="sub">The feedback board is shared with Nearmark and our other projects. Ideas you post from here are tagged “Spare Key” with the version you’re using, so we know which release they’re about.</p>
`],
};

// The only addresses a page may send anything to. Anything else is blocked by
// the browser itself, which is what makes "nothing leaves" checkable.
export const CONNECT = ["'self'", 'https://cloudflare-dns.com', 'https://data.iana.org', 'https://api.certspotter.com',
  ...RDAP_HOSTS.map((h) => `https://${h}`), 'https://eu.i.posthog.com', 'https://eu-assets.i.posthog.com'];
export const CSP = ["default-src 'self'", "script-src 'self' https://eu-assets.i.posthog.com", "style-src 'self'", "img-src 'self' data:",
  "font-src 'self'", `connect-src ${CONNECT.join(' ')}`, "object-src 'none'", "base-uri 'none'", "form-action 'none'", "frame-ancestors 'none'"].join('; ');
function securityTxt() {
  return ['# Spare Key. Please report security problems and fake copies of this site privately.',
    'Contact: mailto:hello@jharbourne.com',
    'Contact: https://github.com/JHarbourne/sparekey/security/advisories/new',
    'Expires: 2027-09-30T00:00:00.000Z',
    'Preferred-Languages: en',
    'Canonical: https://sparekey.dev/.well-known/security.txt',
    'Policy: https://sparekey.dev/check', ''].join('\n');
}
function vercelConfig() {
  const cfg = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  cfg.headers[0].headers.find((h) => h.key === 'Content-Security-Policy').value = CSP;
  return JSON.stringify(cfg, null, 2) + '\n';
}

export function build() {
  const out = {};
  for (const [file, [title, desc, body, script]] of Object.entries(PAGES)) out[file] = page(file, title, desc, body, script);
  // index.html: replace its header and footer with the shared ones
  let idx = readFileSync(join(root, 'index.html'), 'utf8');
  idx = idx.replace(/<header class="topbar">[\s\S]*?<\/header>/, header('index.html'))
    .replace(/<footer class="footer">[\s\S]*?<\/footer>/, footer);
  out['index.html'] = idx;
  out['vercel.json'] = vercelConfig();
  out['.well-known/security.txt'] = securityTxt();
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(join(root, '.well-known'), { recursive: true });
  for (const [file, html] of Object.entries(build())) writeFileSync(join(root, file), html);
  console.log('Pages written.');
}
