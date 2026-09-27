import { emptyInventory, newService, servicesFromLookup, mergeServices, validateInventory, KINDS, WHO, YESNO } from './lib/model.js';
import { assessRisks, groupRisks } from './lib/risks.js';
import { buildHandover } from './lib/docgen.js';

// Where feedback and the source code live. Change these when the repository exists.
const FEEDBACK_URL = 'https://github.com/JHarbourne/sparekey/issues/new';
const SOURCE_URL = 'https://github.com/JHarbourne/sparekey';
const DRAFT_KEY = 'sparekey:draft';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown');

let inv = loadDraft() || emptyInventory();

// ---------- persistence (this browser only) ----------
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? validateInventory(JSON.parse(raw)) : null;
  } catch { return null; }
}
let saveTimer;
function saveDraft() {
  inv.updated = new Date().toISOString();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(inv)); } catch { /* storage unavailable: fine */ }
  }, 300);
}

// ---------- simple bound fields ----------
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
  } else if (el.dataset.sid) {
    const s = inv.services.find((x) => x.id === el.dataset.sid);
    if (!s) return;
    s[el.dataset.field] = el.value;
    if (['name', 'provider', 'accountOwner', 'kind'].includes(el.dataset.field)) updateSummary(s);
  } else return;
  saveDraft();
  renderRisks();
});

// ---------- domains ----------
function renderDomains() {
  const box = $('#domains');
  box.innerHTML = inv.domains.map((d, i) => {
    const lk = d.lookup;
    const c = lk?.certificate;
    const certText = c ? `${esc(c.issuer || 'Unknown issuer')}, valid until ${fmtDate(c.validTo)}${c.matchesName === false ? ' (wrong name: visitors see a warning)' : ''}` : 'Not found';
    return `<article class="card" aria-labelledby="dom-${i}">
      <header><h3 id="dom-${i}">${esc(d.name)}</h3>
        <span><button type="button" class="link" data-recheck="${i}">Check again</button>
        <button type="button" class="link" data-remove-domain="${i}">Remove<span class="visually-hidden"> ${esc(d.name)}</span></button></span></header>
      ${lk ? `<dl class="facts">
        <dt>Registered with</dt><dd>${esc(lk.registration?.registrar || 'Not found')}</dd>
        <dt>Renews</dt><dd>${fmtDate(lk.registration?.expires)}</dd>
        <dt>Domain settings</dt><dd>${esc(lk.dnsHost || 'Not found')}</dd>
        <dt>Website</dt><dd>${esc(lk.webHost || 'No website found')}</dd>
        <dt>Email</dt><dd>${esc(lk.emailHost || 'No email set up')}</dd>
        <dt>Also sends email</dt><dd>${esc((lk.senders || []).join(', ') || 'None listed')}</dd>
        <dt>Security certificate</dt><dd>${certText}</dd>
        <dt>Checked</dt><dd>${fmtDate(lk.checkedAt)}</dd>
      </dl>` : '<p>Not looked up yet.</p>'}
    </article>`;
  }).join('');
}

async function runLookup(name) {
  const status = $('#lookup-status');
  status.textContent = `Looking up ${name}…`;
  const btn = $('#lookup-form button');
  btn.disabled = true;
  try {
    const res = await fetch(`/api/lookup?domain=${encodeURIComponent(name)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lookup failed');
    const existing = inv.domains.find((d) => d.name === data.domain);
    if (existing) existing.lookup = data; else inv.domains.push({ name: data.domain, lookup: data });
    const before = inv.services.length;
    inv.services = mergeServices(inv.services, servicesFromLookup(data));
    const added = inv.services.length - before;
    status.textContent = `Found ${data.domain}. ${added ? `${added} service${added === 1 ? '' : 's'} added below for you to complete.` : 'Services updated.'}`;
    saveDraft();
    renderAll();
  } catch (err) {
    status.textContent = `Could not look up ${name}: ${err.message}`;
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
    if (!confirmInline(t, `Remove ${d.name}? Its looked-up services stay in the list.`)) return;
    inv.domains.splice(Number(t.dataset.removeDomain), 1);
    saveDraft(); renderAll();
    $('#domain-input').focus();
  }
});

// Two-step confirm without browser dialogs: first press arms, second press acts.
function confirmInline(btn, message) {
  if (btn.dataset.armed === '1') return true;
  btn.dataset.armed = '1';
  const original = btn.innerHTML;
  btn.innerHTML = 'Press again to confirm';
  $('#lookup-status').textContent = message;
  setTimeout(() => { btn.dataset.armed = ''; btn.innerHTML = original; }, 4000);
  return false;
}

// ---------- services ----------
const options = (map, val) => Object.entries(map).map(([k, v]) => `<option value="${k}"${k === val ? ' selected' : ''}>${esc(v)}</option>`).join('');

function summaryHtml(s) {
  const owner = s.accountOwner ? `In ${WHO[s.accountOwner].toLowerCase()}’s name` : 'Account holder not recorded';
  return `<h3>${esc(s.name || KINDS[s.kind])}</h3><span class="meta">${esc(s.provider || 'Provider not recorded')} · ${esc(owner)}</span>`;
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
        ${field(s, 'domain', 'Domain (if any)', inp('domain'))}
        ${field(s, 'purpose', 'What it does, in plain words', area('purpose'), 'wide')}
        ${field(s, 'accountOwner', 'Whose name is the account in?', sel('accountOwner', WHO))}
        ${field(s, 'secondAdmin', 'Does a second person have admin access?', sel('secondAdmin', YESNO))}
        ${field(s, 'paidBy', 'Who pays?', sel('paidBy', WHO))}
        ${field(s, 'cost', 'Cost', inp('cost'))}
        ${field(s, 'renews', 'Renews on', inp('renews', 'date'))}
        ${field(s, 'autoRenew', 'Auto-renew on?', sel('autoRenew', YESNO))}
        ${field(s, 'notes', 'Notes for the client or a helper', area('notes'), 'wide')}
        <p class="wide"><button type="button" class="link" data-remove-service="${s.id}">Remove this service<span class="visually-hidden">: ${esc(s.name)}</span></button></p>
      </div>
    </details>`;
  }).join('');
}

$('#add-service').addEventListener('click', () => {
  const s = newService({ name: 'New service' });
  inv.services.push(s);
  saveDraft(); renderServices(s.id); renderRisks();
  $(`#f-${s.id}-name`).focus();
  $(`#f-${s.id}-name`).select();
});
$('#services').addEventListener('click', (e) => {
  const t = e.target.closest('[data-remove-service]');
  if (!t) return;
  if (!confirmInline(t, 'Press again to remove the service.')) return;
  inv.services = inv.services.filter((s) => s.id !== t.dataset.removeService);
  saveDraft(); renderServices(); renderRisks();
  $('#add-service').focus();
});

// ---------- risks ----------
function renderRisks() {
  const list = assessRisks(inv);
  const n = { high: 0, medium: 0, low: 0 };
  groupRisks(list, inv.builder.name || 'you').forEach((r) => n[r.level]++);
  $('#risk-summary').textContent = list.length
    ? `${n.high} serious, ${n.medium} to fix soon, ${n.low} to check.`
    : (inv.services.length ? 'Nothing found that would break without you.' : 'Add a domain or service to see what depends on you.');
  const label = { high: 'Serious', medium: 'Fix soon', low: 'Check' };
  $('#risks').innerHTML = groupRisks(list, inv.builder.name || 'you').map((r) => `<li class="${r.level}"><strong><span class="visually-hidden">${label[r.level]}: </span>${esc(r.title)}</strong>${esc(r.detail)}
    ${r.serviceId ? ` <a href="#svc-${r.serviceId}" data-open="${r.serviceId}">Go to this service</a>` : ''}</li>`).join('');
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
  download(new Blob([JSON.stringify(inv, null, 2)], { type: 'application/json' }), `${slug()}-handover-inventory.json`);
  $('#save-status').textContent = 'Inventory file saved to your downloads. Keep it, and give the client a copy.';
});
$('#open-file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    inv = validateInventory(JSON.parse(await f.text()));
    saveDraft(); fillBound(); renderAll();
    $('#save-status').textContent = `Opened ${f.name}.`;
  } catch (err) {
    $('#save-status').textContent = `Could not open that file: ${err.message}`;
  }
  e.target.value = '';
});
$('#download-doc').addEventListener('click', async () => {
  const btn = $('#download-doc');
  btn.disabled = true;
  $('#save-status').textContent = 'Writing the handover document…';
  try {
    const blob = await buildHandover(inv, assessRisks(inv));
    download(blob, `${slug()}-handover.docx`);
    $('#save-status').textContent = 'Handover document downloaded. Anything highlighted in yellow still needs filling in.';
  } catch (err) {
    $('#save-status').textContent = `Could not write the document: ${err.message}`;
  } finally { btn.disabled = false; }
});
$('#clear').addEventListener('click', (e) => {
  if (!confirmInline(e.target.closest('button'), 'This clears the draft from this browser. Save the inventory file first if you need it.')) {
    $('#save-status').textContent = 'Press “Start again” once more to clear this browser’s draft. Save the file first if you need it.';
    return;
  }
  inv = emptyInventory();
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
  fillBound(); renderAll();
  $('#save-status').textContent = 'Cleared. Nothing is left in this browser.';
});

// ---------- start ----------
function renderAll() { renderDomains(); renderServices(); renderRisks(); }
$('#feedback-link').href = FEEDBACK_URL;
$('#source-link').href = SOURCE_URL;
if (inv.services.length || inv.domains.length || inv.client.name) {
  const note = $('#draft-note');
  note.hidden = false;
  note.textContent = `Your draft for ${inv.client.organisation || inv.client.name || 'this client'} has been restored from this browser.`;
}
fillBound();
renderAll();
