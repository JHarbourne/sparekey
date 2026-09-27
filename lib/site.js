// Shared by every page: light/dark switch, footer details and analytics.
import { VERSION } from './version.js';
import { initAnalytics, track } from './analytics.js';

export const LINKS = {
  source: 'https://github.com/JHarbourne/sparekey',
  feedbackBoard: 'https://nearmark.co.uk/feedback?area=sparekey',
  issues: 'https://github.com/JHarbourne/sparekey/issues/new',
};
const THEME_KEY = 'sparekey-theme';

// ---------- light/dark (same behaviour as Landscapes of Change) ----------
const media = window.matchMedia('(prefers-color-scheme: dark)');
const isDark = () => {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : media.matches;
};
const paint = () => document.querySelectorAll('[data-theme-toggle]').forEach((el) => el.setAttribute('aria-checked', String(isDark())));
paint();
media.addEventListener('change', paint);
document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode */ }
  paint();
  track('theme_changed', { dark: next === 'dark' });
}));

// ---------- footer ----------
document.querySelectorAll('[data-link]').forEach((a) => { if (LINKS[a.dataset.link]) a.href = LINKS[a.dataset.link]; });
document.querySelectorAll('[data-version]').forEach((el) => { el.textContent = `v${VERSION}`; });
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

initAnalytics();
export { track };
