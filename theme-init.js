// The light/dark switch, in its own small classic script so it works on its
// own: it runs before the page is drawn (no flash), and keeps working even if
// the rest of the site's JavaScript fails to load, or in older browsers.
// Kept as a separate file because the Content Security Policy blocks inline scripts.
(function () {
  var KEY = 'sparekey-theme';
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage unavailable */ }
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : !!(media && media.matches);
  }
  function paint() {
    var els = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < els.length; i++) els[i].setAttribute('aria-checked', String(isDark()));
  }
  // One listener on the document, so it works whenever the switch appears.
  document.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el !== document && !(el.hasAttribute && el.hasAttribute('data-theme-toggle'))) el = el.parentNode;
    if (!el || el === document) return;
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch (err) { /* private mode */ }
    paint();
    try { document.dispatchEvent(new CustomEvent('sparekey:theme', { detail: { dark: next === 'dark' } })); } catch (err) { /* very old browser */ }
  });
  if (media) {
    if (media.addEventListener) media.addEventListener('change', paint);
    else if (media.addListener) media.addListener(paint); // Safari 13 and earlier
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint);
  else paint();
})();
