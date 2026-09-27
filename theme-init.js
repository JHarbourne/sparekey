// Applies a remembered light/dark choice before the page is drawn, so there is
// no flash. With no saved choice the page follows the device setting.
// Kept as a separate file because the Content Security Policy blocks inline scripts.
(function () {
  var t = null;
  try { t = localStorage.getItem('sparekey-theme'); } catch (e) { /* storage unavailable */ }
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
})();
