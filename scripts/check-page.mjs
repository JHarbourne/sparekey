// The "Check it yourself" page. Generated so the lists always match the code.
import { RDAP_HOSTS, LOOKUP_SERVICES } from '../lib/lookup.js';

export const checkPage = ['Check it yourself', 'How to check for yourself that Spare Key keeps nothing, and how to recognise the real site.', `
<p class="eyebrow">check it yourself</p>
<h1>You shouldn’t have to take our word for it</h1>
<p class="lede">Any site that asks how your website is set up should make you cautious. Here is exactly what Spare Key sends, where it goes, and how to check it with the tools already in your browser.</p>

<div class="trust-grid">
  <div class="tg"><span class="tg-k">sent to us</span><strong>Nothing</strong><p>There is no Spare Key server that receives what you type. The site is plain files.</p></div>
  <div class="tg"><span class="tg-k">sent anywhere</span><strong>Domain names only</strong><p>Only to public lookup services, to read records that are already public.</p></div>
  <div class="tg"><span class="tg-k">passwords</span><strong>Never asked for</strong><p>Not passwords, PINs, card numbers or recovery codes. Ever.</p></div>
</div>

<h2>Where a domain name goes when you look it up</h2>
<p>Your browser sends the domain name, and nothing else, to these services. Spare Key never connects to the website itself.</p>
<table class="svc-table">
  <thead><tr><th scope="col">Address</th><th scope="col">Who</th><th scope="col">Why</th></tr></thead>
  <tbody>
  ${LOOKUP_SERVICES.map((x) => `<tr><td><code>${x.host}</code></td><td>${x.who}</td><td>${x.why}</td></tr>`).join('\n  ')}
  </tbody>
</table>
<details class="more"><summary>The ${RDAP_HOSTS.length} registry addresses on the list</summary><p class="mono-list">${RDAP_HOSTS.join(' · ')}</p></details>
<p>Everything else, the people, services, notes and risks, stays in your browser on this device until you download it. Your draft is kept in this browser’s storage so a reload doesn’t lose it, and “Clear” removes it.</p>

<h2>Four ways to check</h2>
<ol class="timeline checks">
  <li><div class="tl-text"><h3>Watch the traffic</h3><p>Open your browser’s developer tools (on a Mac, Option + Command + I) and choose <strong>Network</strong>. Look up a domain and fill in the rest. Every request is listed, and you’ll see only the addresses above.</p></div></li>
  <li><div class="tl-text"><h3>Read the lock on the door</h3><p>In the same Network tab, click the page itself and find the <code>content-security-policy</code> header. Its <code>connect-src</code> line is the complete list of addresses this page may contact. Your browser, not us, blocks everything else.</p></div></li>
  <li><div class="tl-text"><h3>Unplug it</h3><p>Once the page has loaded, turn off your Wi-Fi. You can still fill everything in and download the handover. Only new lookups need a connection.</p></div></li>
  <li><div class="tl-text"><h3>Read the code, or run your own copy</h3><p>All of it is <a data-link="source" href="https://github.com/JHarbourne/sparekey">on GitHub</a>. To run it on your own computer, clone it, run <code>node scripts/serve.mjs</code> and open <code>http://localhost:4173</code>.</p></div></li>
</ol>

<h2>If someone stole everything you typed</h2>
<p>They would learn which registrar, host and email provider you use, which anyone can already find in public records, and who pays for each. They would not get a password, because Spare Key never asks for one. That is deliberate: the safest data is data that isn’t worth stealing.</p>

<h2>How to recognise the real Spare Key</h2>
<ul class="checklist">
  <li>The address is <strong>https://sparekey.dev</strong>.</li>
  <li>A request from a website owner opens a link starting <strong>https://sparekey.dev/#start</strong>.</li>
  <li>It never asks for a password, a code sent to your phone, or payment.</li>
</ul>
<p>The code is open source, so anyone can copy it and we can’t stop that. A copy that asks for a password is not us.</p>

<h2>Found a fake, or a security problem?</h2>
<p>Email <a href="mailto:hello@jharbourne.com">hello@jharbourne.com</a>, or report it privately through <a href="https://github.com/JHarbourne/sparekey/security/advisories/new">GitHub’s security reporting</a>. Our <a href="/.well-known/security.txt">security.txt</a> has the details. In the UK you can also forward suspicious emails to <a href="mailto:report@phishing.gov.uk">report@phishing.gov.uk</a> and report a suspicious website to the <a href="https://www.ncsc.gov.uk/collection/phishing-scams/report-scam-website">National Cyber Security Centre</a>.</p>

<h2>Who made this</h2>
<p>Spare Key is made by Jonathan Harbourne, a UX and accessibility designer in Essex who founded the <a href="https://lgbthistoryuk.org">LGBT History Project</a>. It started after one of his own websites went down and he realised everything depended on him. Get in touch at <a href="mailto:hello@jharbourne.com">hello@jharbourne.com</a>.</p>
`];
