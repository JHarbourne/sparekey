// The domain name policy page. Generated from lib/policy.js so the page, the
// generated plan and the Word download always say the same thing.
import { QUESTIONS, POLICY, REPORTING } from '../lib/policy.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const policyPage = ['Domain name policy', 'The questions every organisation should answer about its web addresses, and a policy to copy, including what to do before letting one go.', `
<p class="eyebrow">domain name policy</p>
<h1>Keep your old web addresses, or someone else will</h1>
<p class="lede">Most domain policies say who may buy a web address and who pays for it. Almost none say what happens when you stop using one. When an address lapses, anyone can buy it, along with every link and search listing it built up over the years, and use your old name to sell things. It happens to charities, universities, councils and public bodies, usually after a rename, a merger or a new website.</p>

<section class="old-check panel" aria-labelledby="oc-h">
  <h2 id="oc-h">Check an old address now</h2>
  <p class="sub">Type an address your organisation used to use. Spare Key reads the public registration record from your browser and stores nothing.</p>
  <form id="oc-form" class="lookup" novalidate>
    <label for="oc-input" class="vh">Old address</label>
    <span class="prompt" aria-hidden="true">$ check</span>
    <input id="oc-input" placeholder="old-name.org.uk" autocomplete="off" spellcheck="false" autocapitalize="off" aria-describedby="oc-status">
    <button type="submit" class="btn primary">Check</button>
  </form>
  <p id="oc-status" class="status" role="status" aria-live="polite"></p>
  <div id="oc-result"></div>
</section>

<h2>The questions to answer</h2>
<ol class="q-list">
  ${QUESTIONS.map(([q, a]) => `<li><strong>${esc(q)}</strong><span>${esc(a)}</span></li>`).join('\n  ')}
</ol>

<h2>A policy you can copy</h2>
<p>Adapt it, adopt it at your next board or committee meeting, and keep it with your other policies. The clause most policies leave out is number ${POLICY.findIndex(([h]) => h === 'Releasing a domain') + 1}.</p>
<div class="policy-box">
  <p class="policy-title">Domain name policy</p>
  <ol class="policy">
    ${POLICY.map(([h, t]) => `<li><strong>${esc(h)}.</strong> ${esc(t)}</li>`).join('\n    ')}
  </ol>
</div>
<div class="cta">
  <a class="btn primary" href="templates/spare-key-domain-policy.docx" download>Download as Word</a>
  <a class="btn" href="./#start">Record your domains in Spare Key</a>
</div>

<h2>If an old address is already being misused</h2>
<p>Open it in a browser and take a dated screenshot first. Then tell:</p>
<ul class="report-list">
  ${REPORTING.map(([who, what, url, where]) => `<li${where === 'uk' ? ' class="only-uk" hidden' : where === 'other' ? ' class="only-other"' : ''}><strong>${url ? `<a href="${url}">${esc(who)}</a>` : esc(who)}</strong><span>${esc(what)}</span></li>`).join('\n  ')}
</ul>
<p>If you can, register the address again when it next becomes available and point it at your current website. Some registrars let you place a back-order on a domain that is due to lapse.</p>
<p class="sub">Spare Key is free and open source. It never asks for passwords and stores nothing. <a href="check.html">Check it yourself</a>.</p>
`, 'lib/policy-check.js'];
