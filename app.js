import { emptyInventory, newService, servicesFromLookup, mergeServices, validateInventory, newOldDomain, KINDS, WHO, YESNO, DOMAIN_STATUS, PUBLIC_ACCOUNTS } from './lib/model.js';
import { assessRisks, groupRisks } from './lib/risks.js';
import { stepStatus } from './lib/progress.js';
import { buildHandover } from './lib/docgen.js';
import { track, incomingRequest } from './lib/site.js';
import { mailtoUrl, recipient } from './lib/request.js';
import { lookup, checkOldAddress } from './lib/lookup.js';

const DRAFT_KEY = 'sparekey:draft';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown');
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let inv = loadDraft() || emptyInventory();
const hasDraft = () => Boolean(inv.services.length || inv.domains.length || inv.client.name || inv.client.organisation);

// ---------- views: cover page and the tool ----------
function showView() {
  const app = location.hash === '#start' || location.hash.startsWith('#start/');
  $('#landing').hidden = app;
  $('#app-view').hidden = !app;
  $('#skip').setAttribute('href', app ? '#main' : '#landing');
  return app;
}
window.addEventListener('hashchange', () => {
  const app = showView();
  if (app) { window.scrollTo(0, 0); $('#main').focus({ preventScroll: true }); }
  else if (location.hash === '' || location.hash === '#') { window.scrollTo(0, 0); }
});
document.addEventListener('click', (e) => {
  const a = e.target.closest('#cta-start, #cta-start-2');
  if (a) track('get_started', { returning: hasDraft() });
});

// ---------- persistence (this browser only) ----------
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? validateInventory(JSON.parse(raw)) : null;
  } catch { return null; }
}
let saveTimer;
function writeDraft() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(inv)); } catch { /* storage unavailable: fine */ }
}
function saveDraft() {
  inv.updated = new Date().toISOString();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(writeDraft, 300);
}
// Never lose the last keystrokes if the page is closed or reloaded straight away.
window.addEventListener('pagehide', () => { if (saveTimer) writeDraft(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && saveTimer) writeDraft(); });

// ---------- bound fields ----------
const getPath = (obj, path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
function setPath(obj, path, val) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], obj)[last] = val;
}
function fillBound() {
  document.querySelectorAll('[data-bind]').forEach((el) => { el.value = getPath(inv, el.dataset.bind) ?? ''; });
}
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.bind) {
    setPath(inv, el.dataset.bind, el.value);
  } else if (el.dataset.ofield) {
    const od = inv.oldDomains[Number(el.dataset.old)];
    if (!od) return;
    od[el.dataset.ofield] = el.value;
  } else if (el.dataset.dstatus) {
    const dm = inv.domains[Number(el.dataset.dstatus)];
    if (!dm) return;
    dm.status = el.value;
  } else if (el.dataset.sid) {
    const s = inv.services.find((x) => x.id === el.dataset.sid);
    if (!s) return;
    s[el.dataset.field] = el.value;
    updateSummary(s);
  } else return;
  saveDraft();
  renderRisks();
});

// ---------- domains ----------
function row(label, value, flag = false) {
  return `<dt>${esc(label)}</dt><dd${flag ? ' class="flag"' : ''}>${esc(value)}</dd>`;
}
function renderDomains(animateIndex = -1) {
  $('#domains').innerHTML = inv.domains.map((d, i) => {
    const lk = d.lookup;
    const c = lk?.certificate;
    const cert = c?.validTo ? `${c.issuer || 'Unknown issuer'} · valid until ${fmtDate(c.validTo)}${c.matchesName === false ? ' · wrong name, visitors see a warning' : ''}` : (c?.missing ? 'None found in the public logs' : 'Not checked');
    const renews = lk?.registration?.expires ? fmtDate(lk.registration.expires) : 'Unknown';
    return `<article class="record" aria-labelledby="dom-${i}">
      <div class="record-head"><h3 id="dom-${i}">${esc(d.name)}</h3>
        <span><button type="button" class="link" data-recheck="${i}">Check again<span class="vh"> ${esc(d.name)}</span></button>
        <button type="button" class="link" data-remove-domain="${i}">Remove<span class="vh"> ${esc(d.name)}</span></button></span></div>
      ${lk ? `<dl class="${i === animateIndex && !reducedMotion() ? 'reveal' : ''}">
        ${row('registrar', lk.registration?.registrar || 'Not found')}
        ${row('renews', renews)}
        ${row('dns', lk.dnsHost || 'Not found')}
        ${row('website', lk.webHost || 'No website found')}
        ${row('email', lk.emailHost || 'No email set up', /^Own mail server/.test(lk.emailHost || ''))}
        ${row('sends as', (lk.senders || []).join(', ') || 'None listed')}
        ${row('certificate', cert, c?.matchesName === false)}
        ${row('checked', fmtDate(lk.checkedAt))}
      </dl>` : '<p class="sub">Not looked up yet.</p>'}
      <label class="dstatus" for="dstatus-${i}">What’s the plan for this address?
        <select id="dstatus-${i}" data-dstatus="${i}">${options(DOMAIN_STATUS, d.status || 'active')}</select></label>
    </article>`;
  }).join('');
  // stagger the rows for the reveal
  document.querySelectorAll('#domains dl.reveal').forEach((dl) => [...dl.children].forEach((el, n) => el.style.setProperty('--i', Math.floor(n / 2))));
}

async function runLookup(name) {
  const status = $('#lookup-status');
  status.textContent = `Looking up ${name}…`;
  const btn = $('#lookup-form button');
  btn.disabled = true;
  try {
    const data = await lookup(name);
    let index = inv.domains.findIndex((d) => d.name === data.domain);
    if (index >= 0) inv.domains[index].lookup = data; else { inv.domains.push({ name: data.domain, status: 'active', lookup: data }); index = inv.domains.length - 1; }
    const before = inv.services.length;
    inv.services = mergeServices(inv.services, servicesFromLookup(data));
    const added = inv.services.length - before;
    status.textContent = `Found ${data.domain}. ${added ? `${added} service${added === 1 ? '' : 's'} added for you to complete.` : 'Services updated.'}`;
    track('lookup_completed', { services_added: added, has_registration: Boolean(data.registration) });
    saveDraft();
    renderDomains(index); renderServices(); renderRisks();
  } catch (err) {
    status.textContent = `Could not look up ${name}: ${err.message}`;
    track('lookup_failed');
  } finally {
    btn.disabled = false;
  }
}

$('#lookup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#domain-input');
  const name = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
  if (!name) { $('#lookup-status').textContent = 'Type a domain name first, for example example.org.'; input.focus(); return; }
  input.value = '';
  runLookup(name);
});
$('#domains').addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.recheck) runLookup(inv.domains[Number(t.dataset.recheck)].name);
  if (t.dataset.removeDomain) {
    const d = inv.domains[Number(t.dataset.removeDomain)];
    if (!confirmInline(t, `Press again to remove ${d.name}. Its services stay in the list.`, '#lookup-status')) return;
    inv.domains.splice(Number(t.dataset.removeDomain), 1);
    saveDraft(); renderAll();
    $('#domain-input').focus();
  }
});

// ---------- old addresses ----------
function oldSummary(lk) {
  if (!lk) return 'Not checked yet.';
  if (lk.notRegistered) return 'Not registered. Anyone can register it now.';
  const reg = lk.registration;
  if (!reg) return 'We couldn’t read the registration record for this ending.';
  const parts = [];
  if (reg.registrar) parts.push(`Registered with ${reg.registrar}`);
  if (reg.created) parts.push(`registered on ${fmtDate(reg.created)}`);
  if (reg.expires) parts.push(`renews ${fmtDate(reg.expires)}`);
  return `${parts.join(', ') || 'Registered'}.${lk.webHost ? ` Its website is now hosted by ${lk.webHost}.` : ' No website found.'}`;
}
function renderOldDomains() {
  $('#old-domains').innerHTML = inv.oldDomains.map((od, i) => `<article class="record old" aria-labelledby="old-${i}">
      <div class="record-head"><h4 id="old-${i}">${esc(od.name)}</h4>
        <span><button type="button" class="link" data-old-recheck="${i}">Check again<span class="vh"> ${esc(od.name)}</span></button>
        <button type="button" class="link" data-old-remove="${i}">Remove<span class="vh"> ${esc(od.name)}</span></button></span></div>
      <p class="old-sum">${esc(oldSummary(od.lookup))} <a href="https://${esc(od.name)}" target="_blank" rel="noopener noreferrer">Open it<span class="vh"> in a new tab</span></a></p>
      <div class="old-fields">
        <label for="od-ours-${i}">Is it still yours?<select id="od-ours-${i}" data-old="${i}" data-ofield="stillOurs">${options(YESNO, od.stillOurs)}</select></label>
        <label for="od-year-${i}">Stopped using it in <span class="opt">year</span><input id="od-year-${i}" data-old="${i}" data-ofield="stoppedYear" inputmode="numeric" maxlength="4" value="${esc(od.stoppedYear)}"></label>
      </div>
    </article>`).join('');
}
async function runOldCheck(name) {
  const status = $('#old-status');
  status.textContent = `Checking ${name}…`;
  try {
    const data = await checkOldAddress(name);
    let od = inv.oldDomains.find((d) => d.name === data.domain);
    if (!od) { od = newOldDomain(data.domain); inv.oldDomains.push(od); }
    od.lookup = data;
    status.textContent = `${data.domain}: ${oldSummary(data)}`;
    saveDraft(); renderOldDomains(); renderRisks();
  } catch (err) {
    status.textContent = `Could not check ${name}: ${err.message}`;
  }
}
$('#old-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#old-input');
  const name = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
  if (!name) { $('#old-status').textContent = 'Type an old address first, for example old-name.org.uk.'; input.focus(); return; }
  input.value = '';
  runOldCheck(name);
});
$('#old-domains').addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.oldRecheck) runOldCheck(inv.oldDomains[Number(t.dataset.oldRecheck)].name);
  if (t.dataset.oldRemove) {
    if (!confirmInline(t, 'Press again to remove this old address.', '#old-status')) return;
    inv.oldDomains.splice(Number(t.dataset.oldRemove), 1);
    saveDraft(); renderOldDomains(); renderRisks();
    $('#old-input').focus();
  }
});

// Two-step confirm without browser dialogs: first press arms, second press acts.
function confirmInline(btn, message, statusSel) {
  if (btn.dataset.armed === '1') return true;
  btn.dataset.armed = '1';
  const original = btn.innerHTML;
  btn.innerHTML = 'Press again to confirm';
  $(statusSel).textContent = message;
  setTimeout(() => { btn.dataset.armed = ''; btn.innerHTML = original; }, 4000);
  return false;
}

// ---------- services ----------
const options = (map, val) => Object.entries(map).map(([k, v]) => `<option value="${k}"${k === val ? ' selected' : ''}>${esc(v)}</option>`).join('');
const isComplete = (s) => s.accountOwner && s.paidBy && s.secondAdmin !== 'unknown';

function summaryHtml(s) {
  const owner = s.accountOwner ? `in ${WHO[s.accountOwner].toLowerCase()}’s name` : 'account holder not recorded';
  return `<span class="kind">${esc(s.kind)}</span><h3>${esc(s.name || KINDS[s.kind])}</h3>
    <span class="meta">${esc(s.provider || 'provider not recorded')} · ${esc(owner)}</span>
    <span class="svc-state${isComplete(s) ? ' done' : ''}" role="img" aria-label="${isComplete(s) ? 'Complete' : 'Needs details'}"></span>`;
}
function updateSummary(s) {
  const el = document.getElementById(`sum-${s.id}`);
  if (el) el.innerHTML = summaryHtml(s);
}
function field(s, key, label, control, cls = '') {
  const id = `f-${s.id}-${key}`;
  return `<label class="${cls}" for="${id}">${label}${control(id)}</label>`;
}
function renderServices(openId) {
  const box = $('#services');
  if (!inv.services.length) {
    box.innerHTML = '<p class="note">No services yet. Look up a domain, or add one yourself.</p>';
    return;
  }
  box.innerHTML = inv.services.map((s) => {
    const inp = (key, type = 'text') => (id) => `<input id="${id}" type="${type}" data-sid="${s.id}" data-field="${key}" value="${esc(s[key])}">`;
    const sel = (key, map) => (id) => `<select id="${id}" data-sid="${s.id}" data-field="${key}">${options(map, s[key])}</select>`;
    const area = (key) => (id) => `<textarea id="${id}" rows="2" data-sid="${s.id}" data-field="${key}">${esc(s[key])}</textarea>`;
    return `<details class="service" id="svc-${s.id}"${s.id === openId ? ' open' : ''}>
      <summary id="sum-${s.id}">${summaryHtml(s)}</summary>
      <div class="body">
        ${field(s, 'name', 'Name', inp('name'))}
        ${field(s, 'kind', 'Type', sel('kind', KINDS))}
        ${field(s, 'provider', 'Provider', inp('provider'))}
        ${field(s, 'domain', 'Domain', inp('domain'))}
        ${field(s, 'purpose', 'What it does, in plain words', area('purpose'), 'wide')}
        ${field(s, 'accountOwner', 'Whose name is the account in?', sel('accountOwner', WHO))}
        ${field(s, 'secondAdmin', 'Can a second person manage it?', sel('secondAdmin', YESNO))}
        ${field(s, 'paidBy', 'Who pays?', sel('paidBy', WHO))}
        ${field(s, 'cost', 'Cost', inp('cost'))}
        ${field(s, 'renews', 'Renews on', inp('renews', 'date'))}
        ${field(s, 'autoRenew', 'Auto-renew on?', sel('autoRenew', YESNO))}
        ${field(s, 'notes', 'Notes for the client or a helper', area('notes'), 'wide')}
        <p class="wide"><button type="button" class="link" data-remove-service="${s.id}">Remove this service<span class="vh">: ${esc(s.name)}</span></button></p>
      </div>
    </details>`;
  }).join('');
}
$('#add-service').addEventListener('click', () => {
  const s = newService({ name: 'New service' });
  inv.services.push(s);
  saveDraft(); renderServices(s.id); renderRisks();
  track('service_added');
  $(`#f-${s.id}-name`).focus();
  $(`#f-${s.id}-name`).select();
});
$('#services').addEventListener('click', (e) => {
  const t = e.target.closest('[data-remove-service]');
  if (!t) return;
  if (!confirmInline(t, 'Press again to remove the service.', '#save-status')) return;
  inv.services = inv.services.filter((s) => s.id !== t.dataset.removeService);
  saveDraft(); renderServices(); renderRisks();
  $('#add-service').focus();
});

// ---------- risks, progress and the moment of delight ----------
let lastHigh = null;
function renderRisks() {
  const list = assessRisks(inv);
  const grouped = groupRisks(list, inv.builder.name || 'you');
  const n = { high: 0, medium: 0, low: 0 };
  grouped.forEach((r) => n[r.level]++);
  $('#m-high').textContent = n.high; $('#m-med').textContent = n.medium; $('#m-low').textContent = n.low;
  const has = inv.services.length || inv.domains.length;
  $('#risk-summary').innerHTML = !has ? 'Add a domain or service to see what depends on you.'
    : grouped.length ? `${n.high} serious · ${n.medium} to fix soon · ${n.low} to check`
      : '<span class="all-clear">Nothing would break without you. Every lock has a spare key.</span>';
  const tag = { high: 'Serious', medium: 'Fix soon', low: 'Check' };
  $('#risks').innerHTML = grouped.map((r) => `<li class="${r.level}"><span class="tag">${tag[r.level]}</span>
    <strong>${esc(r.title)}</strong><p>${esc(r.detail)}${r.serviceId ? ` <a href="#svc-${r.serviceId}" data-open="${r.serviceId}">Go to service</a>` : ''}</p></li>`).join('');

  const st = stepStatus(inv, list);
  document.querySelectorAll('.dot[data-step]').forEach((d) => { if (st[d.dataset.step]) d.dataset.state = st[d.dataset.step]; });

  // Delight: when the last serious risk is cleared, the key turns.
  if (lastHigh !== null && lastHigh > 0 && n.high === 0 && has) celebrate();
  lastHigh = n.high;
}
function celebrate() {
  const logo = $('#logo');
  if (!reducedMotion()) {
    logo.classList.remove('turn'); void logo.offsetWidth; logo.classList.add('turn');
  }
  const toast = $('#toast');
  toast.textContent = 'Spare key cut. Nothing serious left.';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
  track('all_clear');
}
$('#risks').addEventListener('click', (e) => {
  const a = e.target.closest('[data-open]');
  if (!a) return;
  const d = document.getElementById(`svc-${a.dataset.open}`);
  if (d) { d.open = true; d.querySelector('summary').focus(); }
});

// ---------- save, open, export ----------
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const slug = () => (inv.client.organisation || inv.client.name || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client';

$('#save-file').addEventListener('click', () => {
  download(new Blob([JSON.stringify(inv, null, 2)], { type: 'application/json' }), `${slug()}-inventory.json`);
  $('#save-status').textContent = 'Inventory saved to your downloads. Keep it, and give the client a copy.';
  track('inventory_saved', { services: inv.services.length });
});
$('#open-file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    inv = validateInventory(JSON.parse(await f.text()));
    lastHigh = null;
    saveDraft(); fillBound(); renderAll(); requestBanner();
    $('#save-status').textContent = `Opened ${f.name}.`;
    track('inventory_opened', { services: inv.services.length });
  } catch (err) {
    $('#save-status').textContent = `Could not open that file: ${err.message}`;
  }
  e.target.value = '';
});
$('#download-doc').addEventListener('click', async () => {
  const btn = $('#download-doc');
  btn.disabled = true;
  $('#save-status').textContent = 'Writing the continuity plan…';
  try {
    const risks = assessRisks(inv);
    const blob = await buildHandover(inv, risks);
    download(blob, `${slug()}-continuity-plan.docx`);
    $('#save-status').textContent = 'Continuity plan downloaded. Anything highlighted in yellow still needs filling in.';
    track('handover_downloaded', { services: inv.services.length, domains: inv.domains.length, serious: risks.filter((r) => r.level === 'high').length });
  } catch (err) {
    $('#save-status').textContent = `Could not write the document: ${err.message}`;
  } finally { btn.disabled = false; }
});
$('#clear').addEventListener('click', (e) => {
  if (!confirmInline(e.target.closest('button'), 'Press “Start again” once more to clear this browser’s draft. Save the file first if you need it.', '#save-status')) return;
  inv = emptyInventory();
  lastHigh = null;
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* fine */ }
  fillBound(); renderAll(); requestBanner();
  $('#save-status').textContent = 'Cleared. Nothing is left in this browser.';
});


// ---------- a request from a website owner ----------
function requestBanner() {
  const r = inv.requestedBy;
  const banner = $('#request-banner');
  if (!r) { banner.hidden = true; $('#reply-row').hidden = true; return; }
  const who = r.organisation ? `${r.name} at ${r.organisation}` : r.name;
  banner.hidden = false;
  banner.innerHTML = `<p><strong>${esc(who || 'A website owner')}</strong> asked you for a website continuity plan${r.domains?.length ? ` for ${esc(r.domains.join(', '))}` : ''}.${r.sendTo?.email ? ` They’d like it sent to ${esc(recipient(r.sendTo))}.` : ''}</p>
    ${r.message ? `<blockquote>${esc(r.message)}</blockquote>` : ''}
    <p class="sub">Their details are filled in and the domains are looked up. Complete the services, then download the plan and send it back.</p>`;
  const to = r.sendTo?.email ? r.sendTo : { name: r.name, email: r.email };
  if (to.email) {
    const first = (to.name || '').split(' ')[0];
    const body = `${first ? `Dear ${first},` : 'Hello,'}\n\nHere is the continuity plan for ${r.domains?.join(', ') || 'your website'}. It sets out what the website and email depend on, who pays for what, and what to do if I were ever unable to work for a long time. Anything highlighted in yellow is still to be confirmed.\n\nI've also attached the inventory file. Keep it safe: anyone can open it at sparekey.dev to update the plan later.\n\n${inv.builder.name || ''}`;
    $('#reply-link').href = mailtoUrl(to.email, `Website continuity plan for ${r.organisation || r.domains?.[0] || 'your website'}`, body);
    $('#reply-link').textContent = `Email the plan to ${first || (to.role ? `the ${to.role.replace(/^(our|the)\s+/i, '')}` : 'the owner')}`;
    $('#reply-row').hidden = false;
  }
}

async function applyRequest(req) {
  inv = emptyInventory();
  Object.assign(inv.client, { name: req.name, organisation: req.organisation, contact: req.email });
  inv.builder.name = req.builderName || '';
  inv.requestedBy = { name: req.name, organisation: req.organisation, email: req.email, sendTo: req.sendTo || null, domains: req.domains, message: req.message, at: new Date().toISOString() };
  lastHigh = null;
  saveDraft(); fillBound(); renderAll(); requestBanner();
  track('request_opened', { domains: req.domains.length });
  for (const d of req.domains) await runLookup(d);
}

function offerRequest(req) {
  const who = req.organisation || req.name || 'a website owner';
  const current = inv.client.organisation || inv.client.name || 'another client';
  const banner = $('#request-banner');
  banner.hidden = false;
  banner.innerHTML = `<p><strong>New request from ${esc(who)}.</strong> You have a draft for ${esc(current)} in this browser. Save it first if you need it, because starting the request replaces it.</p>
    <div class="actions"><button type="button" class="btn primary" id="req-start">Start the request</button>
    <button type="button" class="btn" id="req-save">Save my draft first</button>
    <button type="button" class="btn" id="req-keep">Keep my draft</button></div>`;
  $('#req-start').addEventListener('click', () => applyRequest(req));
  $('#req-save').addEventListener('click', () => { $('#save-file').click(); $('#req-save').textContent = 'Saved to your downloads'; });
  $('#req-keep').addEventListener('click', () => { banner.hidden = true; requestBanner(); });
  $('#req-start').focus();
}

// ---------- cover page: the example lookup types itself in ----------
function animateTerminal() {
  const pre = $('#term');
  if (!pre || reducedMotion()) return;
  const code = pre.querySelector('code');
  const lines = code.innerHTML.split('\n');
  code.innerHTML = lines.map((l) => `<span class="line">${l}</span>`).join('\n');
  // set via the CSSOM: the Content Security Policy blocks inline style attributes
  code.querySelectorAll('.line').forEach((el, i) => el.style.setProperty('--i', i));
  pre.classList.add('typing');
}

// ---------- start ----------
function renderAll() { renderDomains(); renderOldDomains(); renderServices(); renderRisks(); }
if (hasDraft()) {
  const note = $('#draft-note');
  note.hidden = false;
  note.textContent = `Your draft for ${inv.client.organisation || inv.client.name || 'this client'} has been restored from this browser.`;
  $('#cta-start').textContent = 'Continue your draft';
}
$('#public-accounts').innerHTML = options(PUBLIC_ACCOUNTS, inv.publicAccounts);
fillBound();
renderAll();
showView();
animateTerminal();
requestBanner();
if (incomingRequest) {
  const sameClient = inv.requestedBy && inv.requestedBy.email === incomingRequest.email && inv.client.organisation === incomingRequest.organisation;
  if (sameClient) requestBanner();
  else if (hasDraft()) offerRequest(incomingRequest);
  else applyRequest(incomingRequest);
}
