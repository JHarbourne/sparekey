// Tabs for a long page. Without JavaScript, or when printed, every panel shows
// in order, so nothing is lost. Follows the WAI-ARIA tabs pattern: arrow keys,
// Home and End move between tabs, and each tab has its own address (#id).
export function initTabs(root) {
  if (!root) return;
  const panels = [...root.querySelectorAll(':scope > [data-tab]')];
  if (panels.length < 2) return;
  const list = document.createElement('div');
  list.className = 'tablist';
  list.setAttribute('role', 'tablist');
  if (root.dataset.tabsLabel) list.setAttribute('aria-label', root.dataset.tabsLabel);
  const tabs = panels.map((p) => {
    const t = document.createElement('button');
    t.type = 'button';
    t.id = `tab-${p.id}`;
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', p.id);
    t.textContent = p.dataset.tab;
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', t.id);
    p.tabIndex = 0;
    p.classList.add('tab-panel');
    list.appendChild(t);
    return t;
  });
  root.prepend(list);
  root.classList.add('tabbed');

  function select(i, { focus = false, push = false } = {}) {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
    const hash = `#${panels[i].id}`;
    if (push && location.hash !== hash) history.replaceState(null, '', hash);
  }
  // Which panel an address points at: the panel itself, or something inside it.
  function fromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return -1;
    const el = document.getElementById(id);
    return el ? panels.findIndex((p) => p === el || p.contains(el)) : -1;
  }

  list.addEventListener('click', (e) => {
    const i = tabs.indexOf(e.target.closest('[role="tab"]'));
    if (i >= 0) select(i, { push: true });
  });
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const n = tabs.length;
    const next = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(next, { focus: true, push: true });
  });
  // Links such as "Next: …" that point at another panel switch to it.
  window.addEventListener('hashchange', () => {
    const i = fromHash();
    if (i >= 0) { select(i); list.scrollIntoView({ block: 'start' }); }
  });
  const start = fromHash();
  select(start >= 0 ? start : 0);
  // Opened at a tab's address: show the tabs, not the middle of the panel.
  if (start >= 0) requestAnimationFrame(() => {
    if (panels.includes(document.activeElement)) document.activeElement.blur();
    list.scrollIntoView({ block: 'start' });
  });
}
