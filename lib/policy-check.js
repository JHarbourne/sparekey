// The "Check an old address" box on the domain policy page.
import { track } from './site.js';
import { checkOldAddress } from './lookup.js';
import { initTabs } from './tabs.js';

initTabs(document.querySelector('[data-tabs]'));

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const DAY = 86400000;

export function explain(lk, now = Date.now()) {
  if (lk.notRegistered) {
    return ['warn', `${lk.domain} is not registered. Anyone can register it now and inherit its old links. If it used to be yours, consider registering it again and pointing it at your current website.`];
  }
  const reg = lk.registration;
  if (!reg) return ['info', `We couldn’t read the registration record for ${lk.domain}. Open it in a browser and look at what it shows.`];
  const created = reg.created ? new Date(reg.created) : null;
  const recent = created && now - created.getTime() < 3 * 365 * DAY;
  const by = reg.registrar ? ` with ${reg.registrar}` : '';
  const host = lk.webHost ? ` Its website is hosted by ${lk.webHost}.` : '';
  if (recent) {
    return ['bad', `${lk.domain} was registered${by} on ${fmt(reg.created)}.${host} If your organisation stopped using it before then, it probably belongs to someone else now. Open it and look, and see below for who to tell.`];
  }
  return ['ok', `${lk.domain} has been registered${by} since ${created ? fmt(reg.created) : 'an unknown date'}${reg.expires ? ` and renews on ${fmt(reg.expires)}` : ''}.${host} If it is still yours, make sure it renews automatically and points at your current website.`];
}

$('#oc-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $('#oc-input');
  const name = input.value.trim();
  if (!name) { $('#oc-status').textContent = 'Type an old address first, for example old-name.org.uk.'; input.focus(); return; }
  $('#oc-status').textContent = `Checking ${name}…`;
  $('#oc-result').innerHTML = '';
  try {
    const lk = await checkOldAddress(name);
    const [kind, text] = explain(lk);
    // UK reporting routes only make sense for .uk addresses.
    const uk = /\.uk$/.test(lk.domain);
    document.querySelectorAll('.only-uk').forEach((el) => { el.hidden = !uk; });
    document.querySelectorAll('.only-other').forEach((el) => { el.hidden = uk; });
    $('#oc-status').textContent = 'Done.';
    $('#oc-result').innerHTML = `<p class="oc-${kind}">${esc(text)} <a href="https://${esc(lk.domain)}" target="_blank" rel="noopener noreferrer">Open ${esc(lk.domain)}<span class="vh"> in a new tab</span></a></p>`;
    track('old_address_checked', { recent: kind === 'bad', free: kind === 'warn' });
  } catch (err) {
    $('#oc-status').textContent = `Could not check it: ${err.message}`;
  }
});
