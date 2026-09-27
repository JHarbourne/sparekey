// The website owner's page: build a request link, write the email, and show a
// plain-English summary of what is publicly visible about their website.
import { track } from './site.js';
import { lookup } from './lookup.js';
import { cleanDomains, requestLink, requestEmail, mailtoUrl } from './request.js';

const $ = (s) => document.querySelector(s);
const form = $('#ask-form');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const DAY = 86400000;
let current = { body: '', link: '' };

function showError(id, show, input) {
  $(`#${id}`).hidden = !show;
  input.setAttribute('aria-invalid', show ? 'true' : 'false');
  return show;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(form);
  const domains = cleanDomains(f.get('domains'));
  const email = String(f.get('email') || '').trim();
  const other = f.get('recipient') === 'other';
  const toEmail = String(f.get('toEmail') || '').trim();
  const errors = [
    showError('err-name', !String(f.get('name') || '').trim(), form.elements.name),
    showError('err-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), form.elements.email),
    showError('err-domains', domains.length === 0, form.elements.domains),
    showError('err-to', other && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail), form.elements.toEmail),
  ];
  if (errors.some(Boolean)) {
    const first = ['name', 'email', 'domains', 'toEmail'][errors.indexOf(true)];
    form.elements[first].focus();
    return;
  }
  const req = {
    name: f.get('name'), organisation: f.get('organisation'), email, domains,
    builderName: f.get('builderName'), message: f.get('message'),
    sendTo: other ? { name: f.get('toName'), role: f.get('toRole'), email: toEmail } : null,
  };
  const link = requestLink(location.origin, req);
  const mail = requestEmail(req, link);
  current = { body: mail.body, link };
  $('#send-email').href = mailtoUrl(String(f.get('builderEmail') || '').trim(), mail.subject, mail.body);
  $('#email-preview').innerHTML = `<p class="ep-subject"><span>Subject</span> ${esc(mail.subject)}</p><div class="ep-body">${esc(mail.body).replace(/\n/g, '<br>')}</div>`;
  const result = $('#ask-result');
  result.hidden = false;
  result.focus();
  result.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  track('request_created', { domains: domains.length });
  quickCheck(domains);
});

form.addEventListener('change', (e) => {
  if (e.target.name !== 'recipient') return;
  $('#send-to-fields').hidden = e.target.value !== 'other';
});

async function copy(text, done) {
  try { await navigator.clipboard.writeText(text); $('#ask-status').textContent = done; }
  catch { $('#ask-status').textContent = 'Could not copy automatically. Select the text in the preview and copy it.'; }
}
$('#copy-message').addEventListener('click', () => copy(current.body, 'Message copied. Paste it into an email or a message to your web person.'));
$('#copy-link').addEventListener('click', () => copy(current.link, 'Link copied.'));

// ---------- plain-English quick check ----------
function sentences(lk) {
  const out = [];
  const reg = lk.registration;
  if (reg?.expires) {
    const days = Math.floor((new Date(reg.expires) - Date.now()) / DAY);
    const by = reg.registrar ? ` with ${reg.registrar.replace(/(\.com)?,?\s*(LLC|Inc\.?|Ltd\.?|Limited)$/i, '')}` : '';
    out.push([days <= 60 ? 'warn' : 'ok', `Your domain name is registered${by} and renews on ${fmtDate(reg.expires)}${days <= 60 ? `, in ${days} days. Check it is set to renew automatically.` : '.'}`]);
  } else {
    out.push(['info', 'We couldn’t read when your domain name renews. Your web person can find this.']);
  }
  if (lk.webHost) out.push(['ok', `Your website is hosted by ${lk.webHost}.`]);
  if (lk.emailHost) {
    if (/^Own mail server/.test(lk.emailHost)) out.push(['warn', 'Your email runs on a server that someone looks after personally. If they stopped, your email could stop too. Worth asking about.']);
    else out.push(['ok', `Your email is handled by ${lk.emailHost}.`]);
  }
  const c = lk.certificate;
  if (c?.matchesName === false) out.push(['warn', 'Visitors may see a security warning on your website. Ask your web person to check the certificate.']);
  else if (c?.validTo) out.push(['ok', `Your website has a valid security certificate, until ${fmtDate(c.validTo)}.`]);
  else if (c?.missing) out.push(['warn', 'We couldn’t find a current security certificate for your website. Visitors may see a warning. Worth asking about.']);
  if (lk.emailHost && !lk.dmarc) out.push(['info', 'Your email is missing a record (DMARC) that helps stop others pretending to be you.']);
  return out;
}

async function quickCheck(domains) {
  const box = $('#qc-results');
  $('#quick-check').hidden = false;
  box.innerHTML = '';
  $('#qc-status').textContent = `Checking ${domains.length === 1 ? domains[0] : `${domains.length} addresses`}…`;
  let done = 0;
  for (const d of domains) {
    try {
      const lk = await lookup(d);
      const icon = { ok: '✓', warn: '!', info: 'i' };
      const label = { ok: 'Fine', warn: 'Worth asking about', info: 'Note' };
      box.insertAdjacentHTML('beforeend', `<article class="qc"><h3>${esc(d)}</h3><ul>${sentences(lk).map(([k, t]) =>
        `<li class="qc-${k}"><span class="qc-icon" aria-hidden="true">${icon[k]}</span><span class="vh">${label[k]}: </span>${esc(t)}</li>`).join('')}</ul></article>`);
      done++;
    } catch {
      box.insertAdjacentHTML('beforeend', `<article class="qc"><h3>${esc(d)}</h3><p class="sub">We couldn’t check this address just now.</p></article>`);
    }
  }
  $('#qc-status').textContent = done ? 'Done. Your web person will see these too, and more.' : '';
}
