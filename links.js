// Links that leave Spare Key open in a new tab, so the tool and anything typed
// into it stay where they were. Screen readers are told it opens a new tab.
// A classic script so it works on every page, including links added later
// (risk cards, lookups). Kept as a file because the CSP blocks inline scripts.
(function () {
  var NOTE = ' (opens in a new tab)';
  function external(a) {
    if (!a.href || a.target === '_self' || a.hasAttribute('download')) return false;
    if (!/^https?:$/.test(a.protocol)) return false; // mailto:, tel:, blob:
    return a.host !== location.host;
  }
  function mark(a) {
    if (a.getAttribute('data-ext') === '1' || !external(a)) return;
    a.setAttribute('data-ext', '1');
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    if (!/new tab/i.test(a.textContent)) {
      var s = document.createElement('span');
      s.className = 'vh';
      s.textContent = NOTE;
      a.appendChild(s);
    }
  }
  function markAll(root) {
    if (root.tagName === 'A') mark(root);
    if (!root.querySelectorAll) return;
    var links = root.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) mark(links[i]);
  }
  function start() {
    markAll(document.body);
    if (window.MutationObserver) {
      new MutationObserver(function (list) {
        for (var i = 0; i < list.length; i++) {
          var r = list[i];
          if (r.type === 'attributes') mark(r.target);
          for (var j = 0; j < r.addedNodes.length; j++) if (r.addedNodes[j].nodeType === 1) markAll(r.addedNodes[j]);
        }
      }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
