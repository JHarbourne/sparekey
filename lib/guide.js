// Guide page: filter the FAQs as you type, and highlight the section in view.
import './site.js';

const input = document.getElementById('faq-filter');
const items = [...document.querySelectorAll('#faqs .faq')];
const count = document.getElementById('faq-count');
input?.addEventListener('input', () => {
  const q = input.value.trim().toLowerCase();
  let shown = 0;
  for (const d of items) {
    const hit = !q || d.textContent.toLowerCase().includes(q);
    d.hidden = !hit;
    if (hit) shown++;
    if (q && hit) d.open = true; else if (!q) d.open = false;
  }
  count.textContent = q ? `${shown} of ${items.length} questions match.` : '';
});

const links = new Map([...document.querySelectorAll('.toc a')].map((a) => [a.getAttribute('href').slice(1), a]));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.removeAttribute('aria-current'));
      links.get(e.target.id)?.setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-30% 0px -60% 0px' });
  links.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
}
