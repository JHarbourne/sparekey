// Shared by every page: light/dark switch, footer details and analytics.
import { VERSION } from './version.js';
import { initAnalytics, track } from './analytics.js';
import { decodeRequest, REQUEST_PREFIX } from './request.js';

// A website owner's request arrives in the #fragment. Read it, then remove it
// from the address bar before anything else runs, so it never reaches analytics
// or the browser history.
export const incomingRequest = (() => {
  if (!location.hash.startsWith(REQUEST_PREFIX)) return null;
  const req = decodeRequest(location.hash.slice(REQUEST_PREFIX.length));
  history.replaceState(null, '', `${location.pathname}#start`);
  return req;
})();

export const LINKS = {
  source: 'https://github.com/JHarbourne/sparekey',
  feedbackBoard: 'https://nearmark.co.uk/feedback?area=sparekey',
  issues: 'https://github.com/JHarbourne/sparekey/issues/new',
};
// The light/dark switch lives in theme-init.js, so it works even if this file
// fails to load. It announces changes, and we count them here.
document.addEventListener('sparekey:theme', (e) => track('theme_changed', { dark: Boolean(e.detail && e.detail.dark) }));

// ---------- footer ----------
document.querySelectorAll('[data-link]').forEach((a) => { if (LINKS[a.dataset.link]) a.href = LINKS[a.dataset.link]; });
document.querySelectorAll('[data-version]').forEach((el) => { el.textContent = `v${VERSION}`; });
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

initAnalytics();
export { track };
