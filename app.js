import { emptyInventory, newService, servicesFromLookup, mergeServices, validateInventory, newOldDomain, KINDS, WHO, YESNO, DOMAIN_STATUS, DOMAIN_ORIGIN, PUBLIC_ACCOUNTS,
  REPO_ACCESS, PASSWORD_METHODS, TWO_FACTOR, BACKUP_METHODS, BACKUP_TESTED,
  BACKUP_WHERE, BACKUP_FREQUENCY, BACKUP_KEEP, SITE_TYPES, guessSiteType, emailProblem, phoneProblem } from './lib/model.js';
import { readSiteHealth, servicesFromWordPress, wordpressStack } from './lib/wordpress.js';
import { readProject, servicesFromProject } from './lib/project.js';
import { buildCalendar, datesInPlan } from './lib/calendar.js';
import { assessRisks, groupRisks } from './lib/risks.js';
import { stepStatus } from './lib/progress.js';
import { adviceFor, adviceHtml, domainAdvice } from './lib/advice.js';
import { BEFORE_INTRO, beforeList } from './lib/checklist.js';
import { buildHandover } from './lib/docgen.js';
import { track, incomingRequest } from './lib/site.js';
import { mailtoUrl, recipient } from './lib/request.js';
import { lookup, checkOldAddress } from './lib/lookup.js';

// Plans are kept only in this browser's storage, on this device.
const PLANS_KEY = 'sparekey:plans';     // { [planId]: inventory }
const CURRENT_KEY = 'sparekey:current'; // the plan open now
const DRAFT_KEY = 'sparekey:draft';     // the single draft of 0.5.x, moved into PLANS_KEY on first load

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown');
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const newPlanId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
let plans = readPlans();
let currentId = pickCurrent();
let inv = plans[currentId] || emptyInventory();
const hasDraft = () => Boolean(inv.services.length || inv.domains.length || (inv.oldDomains || []).length || inv.client.name || inv.client.organisation
  || inv.builder.name || inv.emergency.name || inv.passwordsLocation || inv.backupsLocation || inv.notes);

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
  else if (location.hash === '' || location.hash === '#') { window.scrollTo(0, 0); showDraftState(); }
});
document.addEventListener('click', (e) => {
  const a = e.target.closest('#cta-start, #cta-start-2');
  if (a) track('get_started', { returning: hasDraft() });
});

// ---------- persistence (this browser only) ----------
function readPlans() {
  const out = {};
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    for (const [id, v] of Object.entries(raw ? JSON.parse(raw) : {})) {
      try { out[id] = validateInventory(v); } catch { /* skip a damaged plan */ }
    }
    const old = localStorage.getItem(DRAFT_KEY);
    if (old) {
      try { const id = newPlanId(); out[id] = validateInventory(JSON.parse(old)); localStorage.setItem(CURRENT_KEY, id); } catch { /* ignore */ }
      localStorage.removeItem(DRAFT_KEY);
      localStorage.setItem(PLANS_KEY, JSON.stringify(out));
    }
  } catch { /* storage unavailable */ }
  return out;
}
function byRecent() { return Object.keys(plans).sort((a, b) => String(plans[b].updated || '').localeCompare(String(plans[a].updated || ''))); }
function pickCurrent() {
  try { const c = localStorage.getItem(CURRENT_KEY); if (c && plans[c]) return c; } catch { /* fine */ }
  return byRecent()[0] || newPlanId();
}
let saveTimer;
// Save the open plan. A plan with nothing in it is not kept.
function writeDraft() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (hasDraft()) plans[currentId] = inv; else delete plans[currentId];
  try {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
    localStorage.setItem(CURRENT_KEY, currentId);
  } catch { /* storage unavailable: fine */ }
  if (typeof renderPlans === 'function') renderPlans();
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
  renderAdvice();
  checkAllContacts();
}
// What to do when the builder registered the domain in their own name or account.
function renderDomainAdvice(i) {
  const slot = document.getElementById(`dadvice-${i}`);
  const d = inv.domains[i];
  if (!slot || !d) return;
  const a = domainAdvice(d.origin, d.name, inv.builder?.name);
  slot.innerHTML = a ? `<div class="advice ${a.level}" role="status">${adviceHtml(a)}</div>` : '';
}
// Check email addresses and phone numbers when you leave the box. A warning, never a block.
function checkContact(el) {
  const problem = el.type === 'email' ? emailProblem(el.value) : phoneProblem(el.value);
  const msg = document.getElementById(el.getAttribute('aria-describedby'));
  if (problem) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  if (msg) { msg.textContent = problem; msg.hidden = !problem; }
}
document.addEventListener('focusout', (e) => {
  const el = e.target;
  if (el instanceof HTMLInputElement && el.dataset.bind && (el.type === 'email' || el.type === 'tel')) checkContact(el);
});
// While fixing a flagged box, clear the warning as soon as it's right.
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el instanceof HTMLInputElement && el.getAttribute('aria-invalid') === 'true') checkContact(el);
});
function checkAllContacts() {
  document.querySelectorAll('input[data-bind][type="email"], input[data-bind][type="tel"]').forEach(checkContact);
}
// What to do next, under an answer that leaves the client exposed.
function renderAdvice() {
  // Where, how often and how far back only matter when there are backups to ask about.
  const bm = inv.backupMethod || 'unknown';
  const detail = document.getElementById('backup-detail');
  if (detail) detail.hidden = bm === 'none' || bm === 'git';
  document.querySelectorAll('[data-advice-for]').forEach((box) => {
    const f = box.dataset.adviceFor;
    const a = detail?.hidden && /^backup(Where|Frequency|Keep)$/.test(f) ? null : adviceFor(f, getPath(inv, f));
    const html = adviceHtml(a);
    if (box.innerHTML === html) return;
    box.innerHTML = html;
    box.className = `advice${a ? ` ${a.level}` : ''}`;
    box.hidden = !a;
  });
}
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.bind) {
    setPath(inv, el.dataset.bind, el.value);
    if (el.dataset.bind === 'project.type') { delete inv.project.typeFrom; renderProject(); renderRisks(); }
    if (el.tagName === 'SELECT') renderAdvice();
  } else if (el.dataset.ofield) {
    const od = inv.oldDomains[Number(el.dataset.old)];
    if (!od) return;
    od[el.dataset.ofield] = el.value;
  } else if (el.dataset.dstatus) {
    const dm = inv.domains[Number(el.dataset.dstatus)];
    if (!dm) return;
    dm.status = el.value;
  } else if (el.dataset.dorigin) {
    const dm = inv.domains[Number(el.dataset.dorigin)];
    if (!dm) return;
    dm.origin = el.value;
    // Fill in whose name the registration is in, if that's still blank.
    const owner = { client: 'client', 'builder-client': 'client', 'builder-own': 'builder', previous: 'other' }[dm.origin];
    const reg = inv.services.find((x) => x.kind === 'registration' && x.domain === dm.name);
    if (owner && reg && !reg.accountOwner) { reg.accountOwner = owner; renderServices(); }
    renderDomainAdvice(Number(el.dataset.dorigin));
    renderRisks();
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
        ${lk.subdomains?.length ? row('other sites', lk.subdomains.map((x) => x.name).join(', ')) : ''}
        ${lk.linked?.length ? row('linked accounts', lk.linked.map((x) => x.name).join(', ')) : ''}
        ${row('checked', fmtDate(lk.checkedAt))}
      </dl>${!lk.registration?.registrar && !lk.registration?.expires && !lk.dnsHost && !lk.webHost && !lk.emailHost
        ? `<p class="record-warn">Nothing was found for ${esc(d.name)}. Check the spelling, or remove it.</p>` : ''}` : '<p class="sub">Not looked up yet.</p>'}
      <div class="grid two dfields">
        <label for="dorigin-${i}">Who registered it?<select id="dorigin-${i}" data-dorigin="${i}">${options(DOMAIN_ORIGIN, d.origin || 'unknown')}</select></label>
        <label for="dstatus-${i}">What’s the plan for this address?<select id="dstatus-${i}" data-dstatus="${i}">${options(DOMAIN_STATUS, d.status || 'active')}</select></label>
      </div>
      <div class="advice-slot" id="dadvice-${i}"></div>
    </article>`;
  }).join('');
  inv.domains.forEach((_, i) => renderDomainAdvice(i));
  // stagger the rows for the reveal
  document.querySelectorAll('#domains dl.reveal').forEach((dl) => [...dl.children].forEach((el, n) => el.style.setProperty('--i', Math.floor(n / 2))));
}

async function runLookup(name) {
  const status = $('#lookup-status');
  status.textContent = `Looking up ${name}…`;
  const btn = $('#lookup-form button');
  btn.disabled = true;
  try {
    const plan = inv; // the plan this lookup belongs to, even if another is opened meanwhile
    const data = await lookup(name);
    let index = plan.domains.findIndex((d) => d.name === data.domain);
    if (index >= 0) plan.domains[index].lookup = data; else { plan.domains.push({ name: data.domain, status: 'active', lookup: data }); index = plan.domains.length - 1; }
    const before = plan.services.length;
    plan.services = mergeServices(plan.services, servicesFromLookup(data));
    const added = plan.services.length - before;
    if (plan !== inv) { plans[Object.keys(plans).find((k) => plans[k] === plan) || newPlanId()] = plan; writeDraft(); return; }
    status.textContent = `Found ${data.domain}. ${added ? `${added} service${added === 1 ? '' : 's'} added for you to complete.` : 'Services updated.'}`;
    track('lookup_completed', { services_added: added, has_registration: Boolean(data.registration) });
    saveDraft();
    renderDomains(index); renderProject(); renderServices(); renderRisks();
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
    const plan = inv;
    const data = await checkOldAddress(name);
    let od = plan.oldDomains.find((d) => d.name === data.domain);
    if (!od) { od = newOldDomain(data.domain); plan.oldDomains.push(od); }
    od.lookup = data;
    if (plan !== inv) { writeDraft(); return; }
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
        ${field(s, 'renews', s.kind === 'api' ? 'Expires on' : 'Renews or expires on', inp('renews', 'date'))}
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
  e.preventDefault();
  const d = document.getElementById(`svc-${a.dataset.open}`);
  if (d) { showStep(stepOf(d), { focus: false }); d.open = true; d.querySelector('summary').focus(); }
});

// ---------- before you start: what to have to hand, until closed ----------
(function beforeYouStart() {
  const box = document.getElementById('before');
  if (!box) return;
  let hidden = false;
  try { hidden = localStorage.getItem('sparekey:before-hidden') === '1'; } catch { /* fine */ }
  document.getElementById('before-intro').textContent = BEFORE_INTRO;
  document.getElementById('before-items').innerHTML = beforeList();
  box.hidden = hidden;
  document.getElementById('before-hide').addEventListener('click', () => {
    box.hidden = true;
    try { localStorage.setItem('sparekey:before-hidden', '1'); } catch { /* fine */ }
    document.querySelector('[data-bind="client.name"]')?.focus();
    track('before_hidden');
  });
}());

// ---------- six steps, one at a time ----------
// The rail down the left (a bar across the top on a phone) is the list of steps.
// Printed, every step shows.
// Function declarations, not constants, so they work even when called during start-up.
function stepIds() { return ['people', 'domains-sec', 'services-sec', 'access', 'risks-sec', 'handover']; }
function stepPanelsAll() { return stepIds().map((id) => document.getElementById(id)); }
function stepLinksAll() { return [...document.querySelectorAll('#steps a')]; }
function stepOf(el) { return stepPanelsAll().findIndex((p) => p.contains(el)); }
function showStep(i, { focus = true } = {}) {
  if (i < 0) return;
  const stepPanels = stepPanelsAll();
  const stepLinks = stepLinksAll();
  i = Math.min(i, stepPanels.length - 1);
  stepPanels.forEach((p, j) => { p.hidden = j !== i; });
  stepLinks.forEach((a, j) => { if (j === i) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
  // On a phone the steps are a bar across the top: keep the current one in view.
  const bar = document.getElementById('steps');
  if (bar.scrollWidth > bar.clientWidth) bar.scrollLeft = stepLinks[i].offsetLeft - (bar.clientWidth - stepLinks[i].offsetWidth) / 2;
  try { localStorage.setItem('sparekey:step', stepIds()[i]); } catch { /* fine */ }
  if (focus) {
    stepPanels[i].scrollIntoView({ block: 'start' });
    stepPanels[i].querySelector('h2').focus({ preventScroll: true });
  }
}
const stepNames = stepLinksAll().map((a) => a.querySelector('.label').textContent);
const STEP_COUNT = stepNames.length;
stepPanelsAll().forEach((p, i) => {
  p.querySelector('h2').tabIndex = -1;
  const nav = document.createElement('nav');
  nav.className = 'step-nav';
  nav.setAttribute('aria-label', `Step ${i + 1} of ${STEP_COUNT}`);
  nav.innerHTML = `${i > 0 ? `<button type="button" class="btn ghost" data-step-go="${i - 1}"><span aria-hidden="true">←</span>&nbsp;Back<span class="vh">: ${stepNames[i - 1]}</span></button>` : '<span></span>'}`
    + `${i < STEP_COUNT - 1 ? `<button type="button" class="btn primary" data-step-go="${i + 1}">Next: ${stepNames[i + 1]}&nbsp;<span aria-hidden="true">→</span></button>` : ''}`;
  p.appendChild(nav);
});
document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-step-go]');
  if (go) { showStep(Number(go.dataset.stepGo)); track('step_moved', { to: Number(go.dataset.stepGo) + 1, by: 'button' }); return; }
  const link = e.target.closest('#steps a');
  if (link) { e.preventDefault(); const i = stepLinksAll().indexOf(link); showStep(i); track('step_moved', { to: i + 1, by: 'list' }); }
});
function firstStep() {
  let saved = null;
  try { saved = localStorage.getItem('sparekey:step'); } catch { /* fine */ }
  return Math.max(0, stepIds().indexOf(saved));
}
showStep(firstStep(), { focus: false });

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
    newPlan(validateInventory(JSON.parse(await f.text())));
    $('#save-status').textContent = `Opened ${f.name} as a plan in this browser.`;
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
    offerSurvey();
    track('handover_downloaded', { services: inv.services.length, domains: inv.domains.length, serious: risks.filter((r) => r.level === 'high').length });
  } catch (err) {
    $('#save-status').textContent = `Could not write the document: ${err.message}`;
  } finally { btn.disabled = false; }
});
// ---------- the optional survey, offered once, after the first plan ----------
const SURVEY_KEY = 'sparekey:survey';
function offerSurvey() {
  const box = $('#survey');
  const link = $('#survey-go');
  if (!box || !link || !link.getAttribute('href') || link.getAttribute('href') === '#') return;
  let seen = null;
  try { seen = localStorage.getItem(SURVEY_KEY); } catch { /* storage unavailable */ }
  if (seen) return;
  box.hidden = false;
  track('survey_offered');
}
function closeSurvey(answer) {
  try { localStorage.setItem(SURVEY_KEY, answer); } catch { /* fine */ }
  $('#survey').hidden = true;
  track(answer === 'opened' ? 'survey_opened' : 'survey_declined');
}
$('#survey-go')?.addEventListener('click', () => closeSurvey('opened'));
$('#survey-no')?.addEventListener('click', () => closeSurvey('declined'));
// ---------- plans in this browser ----------
function resetView() {
  lastHigh = null;
  ['#domain-input', '#old-input'].forEach((sel) => { const el = $(sel); if (el) el.value = ''; });
  ['#lookup-status', '#old-status', '#save-status'].forEach((sel) => { const el = $(sel); if (el) el.textContent = ''; });
  fillSelects();
  fillBound(); renderAll(); requestBanner(); showDraftState(); renderPlans();
}
function switchTo(id) {
  if (saveTimer) writeDraft();
  currentId = id; inv = plans[id];
  try { localStorage.setItem(CURRENT_KEY, id); } catch { /* fine */ }
  resetView();
}
function newPlan(seed) {
  if (saveTimer) writeDraft();
  currentId = newPlanId(); inv = seed || emptyInventory();
  resetView();
  showStep(0, { focus: false });
  if (seed) writeDraft();
}
function removePlan(id) {
  delete plans[id];
  if (id === currentId) {
    const next = byRecent()[0];
    if (next) { currentId = next; inv = plans[next]; } else { currentId = newPlanId(); inv = emptyInventory(); }
  }
  writeDraft(); resetView();
}
function clearEverything() {
  plans = {};
  try { localStorage.removeItem(PLANS_KEY); localStorage.removeItem(CURRENT_KEY); localStorage.removeItem(DRAFT_KEY); } catch { /* fine */ }
  clearTimeout(saveTimer); saveTimer = null;
  currentId = newPlanId(); inv = emptyInventory();
  resetView();
  showStep(0, { focus: false });
}
const planName = (p) => p.client.organisation || p.client.name || (p.domains[0] && p.domains[0].name) || 'Untitled plan';
function renderPlans() {
  const ids = byRecent();
  const box = $('#plans');
  box.hidden = ids.length === 0;
  $('#plans-count').textContent = `(${ids.length})`;
  $('#plans-list').innerHTML = ids.map((id) => {
    const p = plans[id]; const open = id === currentId;
    return `<li${open ? ' class="open"' : ''}><span class="pl-name">${esc(planName(p))}</span>
      <span class="pl-meta">${p.domains.length} domain${p.domains.length === 1 ? '' : 's'} · changed ${esc(fmtDate(p.updated))}</span>
      <span class="pl-actions">${open ? '<span class="pl-open">Open now</span>' : `<button type="button" class="link" data-plan-open="${id}">Open<span class="vh"> ${esc(planName(p))}</span></button>`}
      <button type="button" class="link" data-plan-remove="${id}">Remove<span class="vh"> ${esc(planName(p))}</span></button></span></li>`;
  }).join('');
}
$('#plans-list').addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.planOpen) { switchTo(t.dataset.planOpen); $('#plans-status').textContent = `Opened ${planName(inv)}.`; }
  if (t.dataset.planRemove) {
    const name = planName(plans[t.dataset.planRemove]);
    if (!confirmInline(t, `Press again to remove ${name} from this browser. Save its file first in step 06 if you need it.`, '#plans-status')) return;
    removePlan(t.dataset.planRemove);
    $('#plans-status').textContent = `Removed ${name}.`;
  }
});
$('#new-plan').addEventListener('click', () => {
  newPlan();
  $('#plans-status').textContent = 'New plan started. Your other plans are still in the list.';
  $('[data-bind="client.name"]')?.focus();
});
$('#clear-all').addEventListener('click', (e) => {
  if (!confirmInline(e.target.closest('button'), 'Press again to remove every plan from this browser. Save the files first in step 06 if you need them.', '#plans-status')) return;
  clearEverything();
  $('#plans-status').textContent = 'Cleared. Nothing is left in this browser.';
});
// Step 06: delete the plan that is open.
$('#clear').addEventListener('click', (e) => {
  if (!confirmInline(e.target.closest('button'), `Press again to delete ${planName(inv)} from this browser. Save the file first if you need it.`, '#save-status')) return;
  const name = planName(inv);
  removePlan(currentId);
  $('#save-status').textContent = `Deleted ${name} from this browser.`;
});
// On the cover, and at the top of the tool: start a new, empty plan.
$('#start-fresh').addEventListener('click', () => {
  newPlan();
  location.hash = '#start';
  $('#lookup-status').textContent = 'New plan started. Your other plans are under “Plans in this browser”.';
});
$('#start-fresh-2').addEventListener('click', () => {
  newPlan();
  $('#lookup-status').textContent = 'New plan started. Your other plans are under “Plans in this browser”.';
  $('[data-bind="client.name"]')?.focus();
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
  const seed = emptyInventory();
  Object.assign(seed.client, { name: req.name, organisation: req.organisation, email: req.email });
  seed.builder.name = req.builderName || '';
  seed.requestedBy = { name: req.name, organisation: req.organisation, email: req.email, sendTo: req.sendTo || null, domains: req.domains, message: req.message, at: new Date().toISOString() };
  newPlan(seed); // a request always gets its own plan, so no other plan is replaced
  track('request_opened', { domains: req.domains.length });
  for (const d of req.domains) await runLookup(d);
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
function renderAll() { renderDomains(); renderOldDomains(); renderProject(); renderServices(); renderRisks(); }
// The choice lists, filled from the model so the words live in one place.
function fillSelects() {
  for (const [sel, map, path] of [['#public-accounts', PUBLIC_ACCOUNTS, 'publicAccounts'], ['#repo-access', REPO_ACCESS, 'project.repoAccess'], ['#site-type', SITE_TYPES, 'project.type'],
    ['#pw-method', PASSWORD_METHODS, 'passwordsMethod'], ['#two-factor', TWO_FACTOR, 'twoFactor'],
    ['#backup-method', BACKUP_METHODS, 'backupMethod'], ['#backup-tested', BACKUP_TESTED, 'backupTested'],
    ['#backup-where', BACKUP_WHERE, 'backupWhere'], ['#backup-frequency', BACKUP_FREQUENCY, 'backupFrequency'], ['#backup-keep', BACKUP_KEEP, 'backupKeep']]) {
    $(sel).innerHTML = options(map, getPath(inv, path));
  }
}

// ---------- how the website is built ----------
function renderProject() {
  inv.project = inv.project || { type: 'unknown', stack: [], hosting: '', repo: '', repoAccess: 'unknown', wordpress: null };
  const p = inv.project;
  // No answer yet: guess from where the lookup found the site, and say so.
  if ((p.type || 'unknown') === 'unknown') {
    const g = guessSiteType(inv);
    if (g) { p.type = g.type; p.typeFrom = g.from; $('#site-type').value = g.type; }
  }
  const type = p.type || 'unknown';
  document.querySelectorAll('[data-for-type]').forEach((el) => { el.hidden = !el.dataset.forType.split(' ').includes(type); });
  const note = $('#site-type-guess');
  note.hidden = !p.typeFrom;
  note.textContent = p.typeFrom ? `Chosen because the lookup found the site on ${p.typeFrom}. Change it if that’s not right.` : '';
  renderWordPress(p.wordpress);
  const bits = [...(p.wordpress ? wordpressStack(p.wordpress) : []), ...(p.stack || []), ...(p.hosting ? [`hosted on ${p.hosting}`] : [])];
  $('#project-stack').hidden = !bits.length;
  $('#project-stack').innerHTML = bits.length ? `<span class="stack-label">Built with</span> ${bits.map((b) => `<span class="chip-s">${esc(b)}</span>`).join(' ')}` : '';
}
function renderWordPress(wp) {
  const box = $('#wp-summary');
  if (!wp) { box.hidden = true; box.innerHTML = ''; return; }
  const off = wp.plugins.filter((x) => x.autoUpdate === 'off').length;
  const behind = wp.plugins.filter((x) => x.latest).length;
  const facts = [
    wp.theme ? `Theme: ${esc(wp.theme.name)}${wp.theme.version ? ` ${esc(wp.theme.version)}` : ''}${wp.theme.parent ? `, a child of ${esc(wp.theme.parent)}` : ''}.` : '',
    `${wp.plugins.length} active plugin${wp.plugins.length === 1 ? '' : 's'}${off ? `, ${off} not updating automatically` : ''}${behind ? `, ${behind} with an update waiting` : ''}.`,
    wp.inactive ? `${wp.inactive} switched off.` : '',
  ].filter(Boolean).join(' ');
  box.hidden = false;
  box.innerHTML = `<p>${facts}</p>${wp.plugins.length ? `<details class="more"><summary>The plugins</summary><ul class="wp-plugins">${wp.plugins.map((x) =>
    `<li><span>${esc(x.name)}</span> <span class="meta">${esc(x.version)}${x.latest ? `, ${esc(x.latest)} available` : ''}${x.autoUpdate === 'off' ? ', updates by hand' : ''}</span></li>`).join('')}</ul></details>` : ''}`;
}
$('#wp-read').addEventListener('click', () => {
  const area = $('#wp-paste');
  let wp;
  try { wp = readSiteHealth(area.value); } catch (err) { $('#wp-status').textContent = err.message; return; }
  inv.project.wordpress = wp;
  inv.project.type = 'wordpress';
  delete inv.project.typeFrom;
  $('#site-type').value = 'wordpress';
  const before = inv.services.length;
  inv.services = mergeServices(inv.services, servicesFromWordPress(wp, inv.domains[0]?.name || ''));
  const added = inv.services.slice(before).map((s) => s.name);
  area.value = '';
  $('#wp-status').textContent = `Read WordPress ${wp.version || ''} with ${wp.plugins.length} active plugins. ${added.length ? `Added ${added.length} service${added.length === 1 ? '' : 's'} to complete: ${added.join(', ')}.` : 'No new services found.'} The pasted text has been cleared.`;
  track('wordpress_read', { plugins: wp.plugins.length, services_added: added.length });
  saveDraft(); renderProject(); renderServices(); renderRisks();
});
async function readFiles(fileList) {
  const files = [];
  for (const f of [...fileList]) {
    if (f.size > 300000) continue; // project files are small; skip anything that isn't
    files.push({ name: f.name, text: await f.text() });
  }
  if (!files.length) { $('#project-status').textContent = 'Those files are too large to be project files. Choose package.json and .env.example.'; return; }
  const result = readProject(files);
  inv.project = inv.project || { type: 'unknown', stack: [], hosting: '', repo: '', repoAccess: 'unknown', wordpress: null };
  if (result.stack.length && ['unknown', 'other'].includes(inv.project.type || 'unknown')) { inv.project.type = 'code'; delete inv.project.typeFrom; $('#site-type').value = 'code'; }
  for (const x of result.stack) if (!inv.project.stack.includes(x)) inv.project.stack.push(x);
  if (result.hosting) inv.project.hosting = result.hosting;
  const before = inv.services.length;
  inv.services = mergeServices(inv.services, servicesFromProject(result, inv.domains[0]?.name || ''));
  const added = inv.services.slice(before).map((s) => s.name);
  const parts = [];
  if (result.stack.length) parts.push(`Found ${result.stack.join(', ')}.`);
  parts.push(added.length ? `Added ${added.length} service${added.length === 1 ? '' : 's'} to complete: ${added.join(', ')}.` : 'No new services found.');
  $('#project-status').textContent = [...parts, ...result.warnings].join(' ');
  track('project_read', { files: files.length, services_added: added.length });
  saveDraft(); renderProject(); renderServices(); renderRisks();
}
$('#project-files').addEventListener('change', (e) => { readFiles(e.target.files); e.target.value = ''; });
const drop = $('#drop');
drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); readFiles(e.dataTransfer.files); });

// ---------- suggested start: press → in an empty field to use the example's start ----------
document.addEventListener('keydown', (e) => {
  const el = e.target;
  if (!(el instanceof HTMLInputElement) || !el.dataset.suggest || el.value || e.key !== 'ArrowRight') return;
  e.preventDefault();
  el.value = el.dataset.suggest;
  el.setSelectionRange(el.value.length, el.value.length);
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
// Don't keep the start on its own if nothing was added to it.
document.addEventListener('focusout', (e) => {
  const el = e.target;
  if (el instanceof HTMLInputElement && el.dataset.suggest && el.value === el.dataset.suggest) {
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
});

// ---------- calendar of renewals and expiries ----------
$('#calendar').addEventListener('click', () => {
  const dates = datesInPlan(inv);
  if (!dates.length) { $('#save-status').textContent = 'There are no dates yet. Look up a domain or add renewal dates to the services.'; return; }
  download(new Blob([buildCalendar(inv)], { type: 'text/calendar' }), `${slug()}-dates.ics`);
  $('#save-status').textContent = `${dates.length} date${dates.length === 1 ? '' : 's'} saved as a calendar file, with reminders 30 days and 7 days before. Open it to add them to your calendar.`;
  track('calendar_downloaded', { dates: dates.length });
});
function draftName() { return inv.client.organisation || inv.client.name || 'this client'; }
function showDraftState() {
  const has = hasDraft();
  $('#draft-note').hidden = !has;
  if (has) $('#draft-text').textContent = `You’re working on ${draftName()}. It’s kept in this browser.`;
  $('#cta-start').textContent = has ? 'Continue your draft' : 'I build websites';
  $('#start-fresh').hidden = !has;
}
showDraftState();
fillSelects();
fillBound();
renderAll();
showView();
animateTerminal();
requestBanner();
renderPlans();
if (incomingRequest) {
  // The same request opened twice goes back to its plan rather than starting another.
  const same = byRecent().find((id) => plans[id].requestedBy && plans[id].requestedBy.email === incomingRequest.email
    && plans[id].client.organisation === incomingRequest.organisation);
  if (same) switchTo(same); else applyRequest(incomingRequest);
}
