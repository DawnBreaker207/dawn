/* Client-side interactions — theme, mobile nav, profile tilt, typed bios,
   scroll-to-top, TOC scrollspy, view counter, reactions, blog search,
   image zoom, giscus comments. */

const $ = <T extends Element>(sel: string, root: ParentNode = document): T | null =>
  root.querySelector(sel);

const $$ = <T extends Element>(sel: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll(sel));

/* Bind a handler at most once per unique node. Component scripts re-run on every
   astro:page-load, and nodes hosted in the shell (e.g. the theme button) are reused
   on same-URL navigations, so a fresh closure re-added each time would stack. */
function bindOnce<T extends HTMLElement>(node: T | null, event: string, handler: (e: Event) => void): void {
  if (!node) return;
  const key = `site:${event}`;
  if (node.dataset.siteBound === key) return;
  node.dataset.siteBound = key;
  node.addEventListener(event, handler);
}

const STORAGE_KEY = 'theme';

let scrollTopWin: (() => void) | null = null;

function resolveTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(next: string) {
  localStorage.setItem(STORAGE_KEY, next);
  const resolved = resolveTheme();
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  syncThemeIcons(resolved);
  applyGiscusTheme(resolved);
}

function applyGiscusTheme(resolved: 'light' | 'dark') {
  const frame = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
  frame?.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: resolved === 'dark' ? 'transparent_dark' : 'light' } } },
    'https://giscus.app'
  );
}

function syncThemeIcons(resolved: 'light' | 'dark') {
  const sun = $<SVGSVGElement>('[data-theme-sun]');
  const moon = $<SVGSVGElement>('[data-theme-moon]');
  if (sun) sun.classList.toggle('hidden', resolved === 'dark');
  if (moon) moon.classList.toggle('hidden', resolved === 'light');
}

/* Tooltips — rendered as a single fixed element on <body> so they escape the
   .studio-main overflow:hidden clip (a ::after inside a column would get cut). */
let tipEl: HTMLDivElement | null = null;
function showTip(text: string, anchor: HTMLElement, down: boolean) {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'tip-el';
    document.body.appendChild(tipEl);
  }
  tipEl.textContent = text;
  tipEl.style.opacity = '1';
  const r = anchor.getBoundingClientRect();
  const width = tipEl.offsetWidth;
  const left = down ? r.left + r.width / 2 - width / 2 : r.right + 12;
  const top = down ? r.bottom + 8 : r.top + r.height / 2 - tipEl.offsetHeight / 2;
  tipEl.style.left = `${left}px`;
  tipEl.style.top = `${top}px`;
}
function hideTip() {
  if (tipEl) tipEl.style.opacity = '0';
}

function initTips() {
  $$<HTMLElement>('[data-tip]').forEach((el) => {
    const down = el.classList.contains('tip--down');
    bindOnce(el, 'pointerenter', () => showTip(el.dataset.tip ?? '', el, down));
    bindOnce(el, 'pointerleave', hideTip);
    bindOnce(el, 'focus', () => showTip(el.dataset.tip ?? '', el, down));
    bindOnce(el, 'blur', hideTip);
  });
}

function initThemeSwitch() {
  const toggleBtn = $<HTMLButtonElement>('[data-theme-toggle]');

  const resolved = resolveTheme();
  document.documentElement.classList.toggle('dark', resolved === 'dark');

  if (!toggleBtn) return;

  syncThemeIcons(resolved);

  bindOnce(toggleBtn, 'click', (e) => {
    e.stopPropagation();
    setTheme(resolveTheme() === 'dark' ? 'light' : 'dark');
  });
}

/* ---- Mobile nav ---- */
const NAV_LINKS = [
  { href: '/blog', title: 'Blog' },
  { href: '/projects', title: 'Projects' },
  { href: '/lab', title: 'Lab' },
  { href: '/about', title: 'About' },
];

let drawer: { overlay: HTMLDivElement; panel: HTMLDivElement } | null = null;

function buildDrawer() {
  const overlay = document.createElement('div');
  overlay.dataset.mobileNav = '';
  overlay.className =
    'fixed inset-0 z-60 bg-black/25 opacity-0 pointer-events-none transition-opacity duration-300 ease-in-out';

  const panel = document.createElement('div');
  panel.dataset.mobilePanel = '';
  panel.className =
    'dark:bg-dark fixed top-0 left-0 z-70 h-full w-full transform bg-gray-200 transition-transform duration-300 ease-in-out dark:opacity-[0.98] translate-x-full opacity-95 pointer-events-none';

  const nav = document.createElement('nav');
  nav.className = 'mt-8 flex h-full basis-0 flex-col items-start overflow-y-auto pt-2 pl-12 text-left';
  for (const link of NAV_LINKS) {
    const a = document.createElement('a');
    a.href = link.href;
    a.className =
      'hover:text-primary-500 dark:hover:text-primary-400 mb-4 py-2 pr-4 text-2xl font-bold tracking-widest text-gray-900 outline outline-0 dark:text-gray-100 break-words';
    a.textContent = link.title;
    a.addEventListener('click', () => setDrawer(false));
    nav.appendChild(a);
  }

  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', 'Toggle Menu');
  close.className =
    'hover:text-primary-500 dark:hover:text-primary-400 fixed top-7 right-4 z-80 h-16 w-16 p-4 text-gray-900 dark:text-gray-100 cursor-pointer';
  close.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';
  close.addEventListener('click', () => setDrawer(false));

  panel.appendChild(nav);
  panel.appendChild(close);
  overlay.addEventListener('click', () => setDrawer(false));
  document.body.appendChild(overlay);
  document.body.appendChild(panel);
  drawer = { overlay, panel };
}

function setDrawer(open: boolean) {
  if (open && !drawer) buildDrawer();
  const { overlay, panel } = drawer ?? {};
  if (!overlay || !panel) return;
  overlay.classList.toggle('opacity-0', !open);
  overlay.classList.toggle('pointer-events-none', !open);
  panel.classList.toggle('translate-x-full', !open);
  panel.classList.toggle('pointer-events-none', !open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function initMobileNav() {
  const toggleBtn = $<HTMLButtonElement>('[data-mobile-nav-toggle]');
  if (!toggleBtn) return;
  toggleBtn.addEventListener('click', () => setDrawer(true));
}

/* ---- Analytics links ---- */
function initAnalyticsLinks() {
  $$<HTMLElement>('[data-analytics-url]').forEach((el) => {
    el.addEventListener('click', () => {
      const url = el.getAttribute('data-analytics-url');
      if (url) window.open(url, '_blank', 'noopener');
    });
  });
}

/* ---- Typed bios ---- */
function initTyped() {
  const bios = $('#bios');
  const typed = $('#typed');
  if (!bios || !typed) return;

  const values = $$('li', bios).map((li) => li.textContent ?? '').filter(Boolean);
  if (!values.length) return;
  let valueIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const type = () => {
    const current = values[valueIndex];
    let delay: number;

    if (!deleting) {
      charIndex++;
      typed.textContent = current.slice(0, charIndex);
      delay = 28;
      if (charIndex === current.length + 1) {
        deleting = true;
        delay = 1500;
      }
    } else {
      charIndex--;
      if (charIndex === 0) {
        /* never end on an empty line (the "line vanishes then returns" flicker):
           switch to the next bio and show its first char during the pause */
        deleting = false;
        valueIndex = (valueIndex + 1) % values.length;
        charIndex = 1;
        delay = 500;
      } else {
        delay = 14;
      }
      typed.textContent = values[valueIndex].slice(0, charIndex);
    }
    setTimeout(type, delay);
  };
  type();
}

/* ---- Scroll to top ---- */
function initScrollTop() {
  const btn = $<HTMLButtonElement>('[data-scroll-top]');
  if (!btn) return;
  if (scrollTopWin) window.removeEventListener('scroll', scrollTopWin);
  const onScroll = () => {
    btn.style.display = window.scrollY > 50 ? '' : 'none';
  };
  scrollTopWin = onScroll;
  window.addEventListener('scroll', onScroll);
  onScroll();
  btn.addEventListener('click', () => window.scrollTo({ top: 0 }));
}

/* ---- TOC scrollspy ---- */
function initToc() {
  const toc = $<HTMLOListElement>('[data-toc]');
  if (!toc) return;

  const links = $$<HTMLAnchorElement>('a[href^="#"]', toc);
  const ids = links.map((l) => l.getAttribute('href')!.slice(1));
  if (!ids.length) return;

  const headings = ids
    .map((id) => document.getElementById(id))
    .filter((h): h is HTMLElement => Boolean(h));

  const setActive = (id: string | null) => {
    links.forEach((l) => {
      const active = l.getAttribute('href')!.slice(1) === id;
      l.classList.toggle('text-primary-600', active);
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    },
    { rootMargin: '-80px 0px -80% 0px' }
  );
  headings.forEach((h) => io.observe(h));
  setActive(ids[0]);
}

/* ---- View counter ---- */
function formatNumber(n: number): string {
  if (n < 1000) return String(n);
  return `${Math.round((n / 1000) * 10) / 10}k`;
}

async function fetchStats(slug: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`/api/stats?slug=${encodeURIComponent(slug)}&type=post`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

async function bumpStat(slug: string, name: string, value: number) {
  try {
    await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, type: 'post', [name]: value }),
    });
  } catch {
    /* offline */
  }
}

function initViewCounter() {
  const el = $<HTMLElement>('[data-view-count]');
  if (!el) return;
  const slug = el.getAttribute('data-slug') || '';
  const fallback = el.getAttribute('data-fallback') || '---';

  fetchStats(slug).then((stats) => {
    const views = stats?.views;
    el.textContent = typeof views === 'number' && views > 0 ? formatNumber(views) : fallback;
    if (typeof views === 'number') bumpStat(slug, 'views', views + 1);
  });
}

/* ---- Reactions ---- */
function initReactions() {
  const container = $<HTMLElement>('[data-reactions]');
  if (!container) return;
  const slug = container.getAttribute('data-slug') || '';
  const MAX = 20;
  const buttons = $$<HTMLButtonElement>('[data-reaction]', container);

  const onReaction = (btn: HTMLButtonElement, name: string, stats: Record<string, number> | null) => {
    const current = stats?.[name] ?? 0;
    if (current >= MAX) return;
    const counter = btn.querySelector('[data-reaction-count]');
    if (counter) {
      counter.textContent = formatNumber(current + 1);
      counter.classList.remove('animate-scale-up');
      void (counter as HTMLElement).offsetWidth;
      counter.classList.add('animate-scale-up');
    }
    bumpStat(slug, name, current + 1);
  };

  fetchStats(slug).then((stats) => {
    buttons.forEach((btn) => {
      const name = btn.getAttribute('data-reaction') || 'loves';
      const count = stats?.[name];
      const counter = btn.querySelector('[data-reaction-count]');
      if (typeof count === 'number' && count > 0 && counter) counter.textContent = formatNumber(count);
      btn.addEventListener('click', () => onReaction(btn, name, stats));
    });
  });
}

/* ---- Blog search ---- */
function initBlogSearch() {
  const input = $<HTMLInputElement>('[data-blog-search]');
  const list = $<HTMLElement>('[data-post-list]');
  if (!input || !list) return;
  const items = $$<HTMLElement>('[data-search-item]', list);
  const empty = $<HTMLElement>('[data-search-empty]', list);

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let visible = 0;
    for (const item of items) {
      const hay =
        (item.dataset.title || '') +
        ' ' +
        (item.dataset.summary || '') +
        ' ' +
        (item.dataset.tags || '');
      const show = hay.toLowerCase().includes(q);
      item.classList.toggle('hidden', !show);
      if (show) visible++;
    }
    if (empty) empty.classList.toggle('hidden', !q || visible > 0);
  });
}

/* ---- Image zoom ---- */
function initImageZoom() {
  const overlayRoot = document.createElement('div');
  overlayRoot.className = 'fixed inset-0 z-100 hidden items-center justify-center bg-black/90 p-4';
  overlayRoot.addEventListener('click', () => {
    overlayRoot.classList.add('hidden');
    overlayRoot.innerHTML = '';
  });
  document.body.appendChild(overlayRoot);

  $$<HTMLImageElement>('[data-zoom]').forEach((img) => {
    img.addEventListener('click', () => {
      const full = document.createElement('img');
      full.src = img.currentSrc || img.src;
      full.className = 'max-h-full max-w-full rounded-lg object-contain shadow-2xl';
      overlayRoot.innerHTML = '';
      overlayRoot.appendChild(full);
      overlayRoot.classList.remove('hidden');
    });
  });
}

/* ---- Comments (giscus) ---- */
function initComments() {
  const host = $<HTMLElement>('[data-giscus]');
  const cfg = $<HTMLElement>('[data-giscus-config]');
  if (!host || !cfg) return;
  let config: Record<string, string>;
  try {
    config = JSON.parse(cfg.textContent || '{}');
  } catch {
    return;
  }
  config['data-theme'] = resolveTheme() === 'dark' ? 'transparent_dark' : 'light';
  const s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.async = true;
  s.crossOrigin = 'anonymous';
  for (const [k, v] of Object.entries(config)) s.setAttribute(k, v);
  host.appendChild(s);
}

/* ---- View toggle (grid/list) ---- */
const VIEW_MODE_KEY = 'view-mode';

function initViewToggles() {
  const toggles = $$<HTMLButtonElement>('[data-view-toggle]');
  if (!toggles.length) return;
  const views = $$<HTMLElement>('[data-view]');

  const apply = (mode: string) => {
    views.forEach((view) => view.classList.toggle('hidden', view.dataset.view !== mode));
    toggles.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewToggle === mode)));
  };

  apply(localStorage.getItem(VIEW_MODE_KEY) ?? 'grid');

  toggles.forEach((btn) => {
    const mode = btn.dataset.viewToggle ?? 'grid';
    const onClick = () => {
      localStorage.setItem(VIEW_MODE_KEY, mode);
      apply(mode);
    };
    btn.removeEventListener('click', onClick);
    btn.addEventListener('click', onClick);
  });
}

function init() {
  initThemeSwitch();
  initMobileNav();
  initAnalyticsLinks();
  initTyped();
  initScrollTop();
  initToc();
  initViewCounter();
  initReactions();
  initBlogSearch();
  initViewToggles();
  initTips();
  initImageZoom();
  initComments();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
document.addEventListener('astro:page-load', init);