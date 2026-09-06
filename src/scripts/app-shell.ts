const sessionKey = 'dawn:tabs';
const NAV: Record<string, string> = JSON.parse(document.body.dataset.sitenav ?? '{}');

interface Tab {
  path: string;
  label: string;
}

const TAB_ICON =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8"/></svg>';

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

function normalize(tab: Tab | null) {
  if (tab) tabs = [...tabs.filter((t) => t.path !== tab.path), tab];
  const home = tabs.find((t) => t.path === '/');
  tabs = tabs.filter((t) => t.path !== '/');
  if (home) tabs.unshift(home);
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
    a.innerHTML = `<span class="explorer-icon flex-none text-(--fg-faint)">${TAB_ICON}</span><span class="truncate">${tab.label}</span>`;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'flex-none text-(--fg-faint) opacity-0 group-hover:opacity-100 hover:text-(--fg)';
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