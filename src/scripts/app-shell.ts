const sessionKey = 'dawn:tabs';
const NAV: Record<string, string> = JSON.parse(document.body.dataset.sitenav ?? '{}');

interface Tab {
  path: string;
  label: string;
}

const FILE_LOGOS = {
  astro: 'M8.358 20.162c-1.186-1.07-1.532-3.316-1.038-4.944.856 1.026 2.043 1.352 3.272 1.535 1.897.283 3.76.177 5.522-.678.202-.098.388-.229.608-.36.166.473.209.95.151 1.437-.14 1.185-.738 2.1-1.688 2.794-.38.277-.782.525-1.175.787-1.205.804-1.531 1.747-1.078 3.119l.044.148a3.158 3.158 0 0 1-1.407-1.188 3.31 3.31 0 0 1-.544-1.815c-.004-.32-.004-.642-.048-.958-.106-.769-.472-1.113-1.161-1.133-.707-.02-1.267.411-1.415 1.09-.012.053-.028.104-.045.165h.002zm-5.961-4.445s3.24-1.575 6.49-1.575l2.451-7.565c.092-.366.36-.614.662-.614.302 0 .57.248.662.614l2.45 7.565c3.85 0 6.491 1.575 6.491 1.575L16.088.727C15.93.285 15.663 0 15.303 0H8.697c-.36 0-.615.285-.784.727l-5.516 14.99z',
  markdown: 'M22.27 19.385H1.73A1.73 1.73 0 010 17.655V6.345a1.73 1.73 0 011.73-1.73h20.54A1.73 1.73 0 0124 6.345v11.308a1.73 1.73 0 01-1.73 1.731zM5.769 15.923v-4.5l2.308 2.885 2.307-2.885v4.5h2.308V8.078h-2.308l-2.307 2.885-2.308-2.885H3.46v7.847zM21.232 12h-2.309V8.077h-2.307V12h-2.308l3.461 4.039z',
  umami: 'M2.203 8.611H.857a.845.845 0 0 0-.841.841v.858a13.31 13.31 0 0 0-.016.6c0 6.627 5.373 12 12 12 6.527 0 11.837-5.212 11.996-11.701 0-.025.004-.05.004-.075V9.452a.845.845 0 0 0-.841-.841h-1.346c-1.159-4.329-5.112-7.521-9.805-7.521-4.692 0-8.645 3.192-9.805 7.521Zm18.444 0H3.37c1.127-3.702 4.57-6.399 8.638-6.399 4.069 0 7.512 2.697 8.639 6.399Z',
} as const;

function tabIconFor(path: string): string {
  const markdownTab = path === '/' || path === '/about' || path === '/lab';
  const d = FILE_LOGOS[markdownTab ? 'markdown' : 'astro'];
  return `<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="currentColor"/></svg>`;
}

let tabs: Tab[] = [];
try {
  tabs = JSON.parse(sessionStorage.getItem(sessionKey) ?? '[]');
} catch {
  tabs = [];
}

function readCurrentTab(): Tab | null {
  const tabRoot = document.getElementById('tab-root');
  if (!tabRoot) return null;
  return {
    path: tabRoot.dataset.tabPath ?? '/',
    label: tabRoot.dataset.tabLabel ?? NAV[location.pathname] ?? location.pathname,
  };
}

const MAX_TABS = 5;

function normalize(tab: Tab | null) {
  if (tab) tabs = [...tabs.filter((t) => t.path !== tab.path), tab];
  const home = tabs.find((t) => t.path === '/');
  tabs = tabs.filter((t) => t.path !== '/');
  if (home) tabs.unshift(home);
  if (tabs.length > MAX_TABS) {
    const keep = new Set(['/', location.pathname]);
    tabs = [...tabs.filter((t) => keep.has(t.path)), ...tabs.filter((t) => !keep.has(t.path))].slice(
      0,
      MAX_TABS
    );
  }
}

function persist() {
  sessionStorage.setItem(sessionKey, JSON.stringify(tabs));
}

function renderTabs() {
  const tabRoot = document.getElementById('tab-root');
  const tabScroll = document.getElementById('tab-scroll');
  if (!tabRoot || !tabScroll) return;
  for (const child of [...tabRoot.children]) child.remove();

  tabScroll.classList.toggle('fade', tabScroll.scrollWidth > tabScroll.clientWidth + 4);

  for (const [i, tab] of tabs.entries()) {
    const active = tab.path === location.pathname;
    const a = document.createElement('a');
    a.href = tab.path;
    a.className = 'flex min-w-0 items-center gap-2 no-underline';
    a.innerHTML = `<span class="explorer-icon flex-none text-(--fg-faint)">${tabIconFor(tab.path)}</span><span class="truncate">${tab.label}</span>`;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'flex-none text-(--fg-faint) pointer-coarse:opacity-100 hover:text-(--fg) group-hover:opacity-100 opacity-0';
    close.setAttribute('aria-label', `Close ${tab.label}`);
    close.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    close.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof closeTab === 'function') closeTab(i);
    });

    const div = document.createElement('div');
    div.className =
      'group flex shrink-0 items-center gap-2 border-r border-(--border) px-3 text-[12px]';
    div.style.background = active ? 'var(--bg-alt)' : 'var(--bg)';
    div.style.boxShadow = active ? 'inset 0 -2px 0 var(--accent)' : '';
    if (active) a.classList.add('text-(--fg)');
    else a.classList.add('text-(--fg-dim)', 'hover:text-(--accent)');
    div.appendChild(a);
    div.appendChild(close);
    tabRoot.appendChild(div);
  }
}

function closeTab(index: number) {
  const closing = tabs[index];
  if (!closing) return;
  tabs.splice(index, 1);
  persist();

  const reopenedReadme = tabs.length === 0;
  if (reopenedReadme) tabs = [{ path: '/', label: NAV['/'] ?? 'README.md' }];

  const wasActive = closing.path === location.pathname;
  const next = tabs[index >= tabs.length ? tabs.length - 1 : index > 0 ? index - 1 : 0];

  if (wasActive && next) {
    location.href = next.path;
    return;
  }
  if (wasActive && reopenedReadme) {
    location.href = '/';
    return;
  }
  renderTabs();
}

/* ---- Document-level listeners: bound once per document (sentinel survives HMR),
       every handler re-queries the live DOM so it survives view-transition swaps. ---- */
function closeMobilePanel() {
  const shell = document.getElementById('studio-shell');
  if (!shell) return;
  delete shell.dataset.mobilePanel;
  document.querySelectorAll<HTMLButtonElement>('[data-mobile-toggle]').forEach((btn) =>
    btn.setAttribute('aria-expanded', 'false')
  );
}

function updateLocalTime() {
  const timeEl = document.querySelector<HTMLElement>('[data-local-time]');
  if (!timeEl) return;
  const diffEl = document.querySelector<HTMLElement>('[data-local-time-diff]');
  const date = new Date();
  const hoursDiff = (date.getTimezoneOffset() - -420) / 60;
  const diff =
    hoursDiff === 0
      ? 'same time'
      : hoursDiff > 0
        ? `${hoursDiff}h ahead`
        : `${Math.abs(hoursDiff)}h behind`;
  timeEl.textContent = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(date);
  if (diffEl) diffEl.textContent = `- ${diff}`;
}

function updateCommitAgo() {
  const commitLink = document.querySelector<HTMLElement>('[data-commit-time]');
  const commitAgoEl = document.querySelector<HTMLElement>('[data-commit-ago]');
  if (!commitLink || !commitAgoEl) return;
  const date = new Date(commitLink.getAttribute('data-commit-time') ?? '');
  if (Number.isNaN(date.getTime())) return;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;
  if (seconds < 60) {
    value = seconds;
    unit = 'second';
  } else if (seconds < 3600) {
    value = Math.floor(seconds / 60);
    unit = 'minute';
  } else if (seconds < 86400) {
    value = Math.floor(seconds / 3600);
    unit = 'hour';
  } else {
    value = Math.floor(seconds / 86400);
    unit = 'day';
  }
  commitAgoEl.textContent = `· ${rtf.format(-value, unit)}`;
}

function closeVersionMenus() {
  const popover = document.querySelector<HTMLElement>('[data-version-popover]');
  if (!popover) return;
  popover.hidden = true;
  document.querySelector('[data-version-trigger]')?.setAttribute('aria-expanded', 'false');
}

function setupDocListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobilePanel();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVersionMenus();
  });
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const trigger = target.closest('[data-version-trigger]');
    if (trigger) {
      const popover = document.querySelector<HTMLElement>('[data-version-popover]');
      const willOpen = !!popover?.hidden;
      closeVersionMenus();
      if (popover && willOpen) {
        popover.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
      }
      return;
    }
    if (target.closest('[data-version-item]')) return closeVersionMenus();
    if (!target.closest('[data-version-popover]')) closeVersionMenus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.querySelector<HTMLElement>('[data-ext-overlay]')?.hasAttribute('data-open')) {
      document
        .querySelector<HTMLElement>('[data-ext-overlay]')
        ?.querySelector<HTMLButtonElement>('[data-ext-toggle]')
        ?.click();
    }
  });
  document.addEventListener(
    'pointerdown',
    (e) => {
      const overlay = document.querySelector<HTMLElement>('[data-ext-overlay]');
      if (overlay?.hasAttribute('data-open') && !(e.target as Element).closest('[data-ext-overlay]')) {
        overlay.querySelector<HTMLButtonElement>('[data-ext-toggle]')?.click();
      }
    },
    true
  );

  updateLocalTime();
  setInterval(updateLocalTime, 30_000);
  updateCommitAgo();
  setInterval(updateCommitAgo, 60_000);
}

/* Bound once per unique node (sentinel on the node survives same-URL navigations
   where ClientRouter reuses DOM without a swap, so listeners never double up). */
function once(node: HTMLElement | null, event: string, handler: EventListener) {
  if (!node) return;
  const key = `shellBound${event}`;
  if (node.dataset[key] === '1') return;
  node.dataset[key] = '1';
  node.addEventListener(event, handler);
}

/* ---- Per-page bindings: re-run on every navigation (astro:page-load). ---- */
function bindShell() {
  const tab = readCurrentTab();
  normalize(tab);
  persist();
  renderTabs();

  const shell = document.getElementById('studio-shell');
  const mobileToggles = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mobile-toggle]'));
  const mobileBackdrop = document.querySelector<HTMLElement>('[data-mobile-backdrop]');

  mobileToggles.forEach((btn) =>
    once(btn, 'click', () => {
      if (!shell) return;
      const panel = btn.dataset.mobileToggle ?? '';
      const next = shell.dataset.mobilePanel === panel ? '' : panel;
      if (next) shell.dataset.mobilePanel = next;
      else delete shell.dataset.mobilePanel;
      mobileToggles.forEach((b) =>
        b.setAttribute('aria-expanded', String(b.dataset.mobileToggle === (shell.dataset.mobilePanel ?? '')))
      );
    })
  );
  once(mobileBackdrop, 'click', closeMobilePanel as EventListener);

  document
    .getElementById('sidebar')
    ?.querySelectorAll('a')
    .forEach((a) =>
      once(a, 'click', () => {
        if (window.innerWidth < 1024) closeMobilePanel();
      })
    );

  /* rail: attribute on <html> + localStorage, collapsed via .studio-workspace */
  const railToggle = document.querySelector<HTMLButtonElement>('[data-rail-toggle]');
  const isRailHidden = () => document.documentElement.dataset.rail === 'hidden';
  const setRailLabel = () => {
    const hidden = isRailHidden();
    railToggle?.setAttribute('aria-expanded', String(!hidden));
    railToggle?.setAttribute('data-tip', hidden ? 'show right rail' : 'hide right rail');
  };
  once(railToggle, 'click', () => {
    document.documentElement.dataset.rail = isRailHidden() ? '' : 'hidden';
    localStorage.setItem('dawn:railHidden', isRailHidden() ? 'true' : 'false');
    setRailLabel();
  });
  if (localStorage.getItem('dawn:railHidden') === 'true') {
    document.documentElement.dataset.rail = 'hidden';
    setRailLabel();
  }

  /* EXTENSIONS overlay (sidebar floor) — instant open/close */
  const extOverlay = document.querySelector<HTMLElement>('[data-ext-overlay]');
  const extToggle = extOverlay?.querySelector<HTMLButtonElement>('[data-ext-toggle]');
  const extList = document.getElementById('sidebar-ext-list') as HTMLUListElement | null;
  if (extOverlay && extToggle && extList) {
    const setOpen = (open: boolean) => {
      if (open) {
        extOverlay.setAttribute('data-open', '');
        extList.hidden = false;
      } else {
        extOverlay.removeAttribute('data-open');
        extList.hidden = true;
      }
      extToggle.setAttribute('aria-expanded', String(open));
    };
    once(extToggle, 'click', () => setOpen(!extOverlay.hasAttribute('data-open')));
  }
}

function boot() {
  const root = document.documentElement;
  if (root.hasAttribute('data-shell-boot')) return;
  root.setAttribute('data-shell-boot', '');
  setupDocListeners();
}
boot(); /* sync: needed because astro:page-load does not fire on the first load */
bindShell();
document.addEventListener('astro:page-load', bindShell);

/* Persist UI state across view-transition swaps. The swapped-in document has SSR
   defaults (rail open), and re-applying afterwards plays the collapse animation on
   every navigation — carry the attribute onto the incoming doc before the swap. */
document.addEventListener('astro:before-swap', (e) => {
  const hidden = document.documentElement.dataset.rail === 'hidden';
  (e as unknown as { detail?: { newDocument?: Document } }).detail?.newDocument
    ?.querySelector(':root')
    ?.toggleAttribute('data-rail', hidden);
});