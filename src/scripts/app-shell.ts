const sessionKey = 'dawn:tabs';
const secKey = 'dawn:sidebarSections';
const themeKey = 'dawn:theme';
const NAV: Record<string, string> = JSON.parse(document.body.dataset.sitenav ?? '{}');

const sidebar = document.getElementById('sidebar');
const rail = document.getElementById('rail');
const tabRoot = document.getElementById('tab-root');
const tabScroll = document.getElementById('tab-scroll');
const toggleSidebar = document.getElementById('toggle-sidebar');
const toggleRail = document.getElementById('toggle-rail');
const collapseSidebar = document.getElementById('collapse-sidebar');
const toggleTheme = document.getElementById('toggle-theme');

interface Tab {
  path: string;
  label: string;
}

const currentTab: Tab | null = tabRoot
  ? {
      path: tabRoot.dataset.tabPath ?? '/',
      label: tabRoot.dataset.tabLabel ?? NAV[location.pathname] ?? location.pathname,
    }
  : null;

let tabs: Tab[] = [];
try {
  tabs = JSON.parse(sessionStorage.getItem(sessionKey) ?? '[]');
} catch {
  tabs = [];
}

function normalize() {
  if (currentTab) tabs = [...tabs.filter((t) => t.path !== currentTab.path), currentTab];
  const home = tabs.find((t) => t.path === '/');
  tabs = tabs.filter((t) => t.path !== '/');
  if (home) tabs.unshift(home);
}

function persist() {
  sessionStorage.setItem(sessionKey, JSON.stringify(tabs));
}

function renderTabs() {
  if (!tabRoot || !tabScroll) return;
  for (const child of [...tabRoot.children]) child.remove();

  tabScroll.classList.toggle('fade', tabScroll.scrollWidth > tabScroll.clientWidth + 4);

  for (const [i, tab] of tabs.entries()) {
    const div = document.createElement('div');
    div.className =
      'group flex shrink-0 items-center gap-2 border-r border-(--border) px-3 py-2 text-[12px]';
    div.style.background = tab.path === location.pathname ? 'var(--bg-alt)' : 'var(--bg)';

    const a = document.createElement('a');
    a.href = tab.path;
    a.className =
      tab.path === location.pathname ? 'text-(--fg)' : 'text-(--fg-dim) hover:text-(--accent)';
    a.textContent = tab.label;
    div.appendChild(a);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'text-(--fg-faint) opacity-0 group-hover:opacity-100 hover:text-(--fg)';
    close.setAttribute('aria-label', `Close ${tab.label}`);
    close.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    close.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof closeTab === 'function') closeTab(i);
    });
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

function setupExplorerSections() {
  const sections = sidebar?.querySelectorAll<HTMLDetailsElement>('.tree-sec');
  if (!sections?.length) return;

  let stored: Record<string, boolean> = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(secKey) ?? '{}');
  } catch {
    stored = {};
  }

  const changed = Object.keys(stored).length === 0;
  if (!changed) {
    sections.forEach((s) => {
      const id = s.dataset.sec;
      if (id && id in stored) s.open = !!stored[id];
    });
  }

  sections.forEach((s) => {
    s.addEventListener('toggle', () => {
      stored[s.dataset.sec ?? ''] = s.open;
      sessionStorage.setItem(secKey, JSON.stringify(stored));
    });
  });
}

function setup() {
  normalize();
  persist();
  renderTabs();

  toggleSidebar?.addEventListener('click', () => {
    sidebar?.classList.toggle('drawer-open');
  });
  sidebar?.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => sidebar.classList.remove('drawer-open'))
  );

  collapseSidebar?.addEventListener('click', () => {
    const collapsed = sidebar?.classList.toggle('collapsed') ?? false;
    localStorage.setItem('dawn:sidebarCollapsed', String(collapsed));
  });
  if (localStorage.getItem('dawn:sidebarCollapsed') === 'true') {
    sidebar?.classList.add('collapsed');
  }

  /* rail: attribute on <html> + localStorage, transitioned via .app-grid */
  toggleRail?.addEventListener('click', () => {
    const hidden = document.documentElement.dataset.rail === 'hidden';
    document.documentElement.dataset.rail = hidden ? '' : 'hidden';
    localStorage.setItem('dawn:railHidden', hidden ? 'false' : 'true');
  });
  if (localStorage.getItem('dawn:railHidden') === 'true') {
    document.documentElement.dataset.rail = 'hidden';
  }

  toggleTheme?.addEventListener('click', () => {
    const darkNow = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !darkNow);
    localStorage.setItem(themeKey, darkNow ? 'light' : 'dark');
  });

  setupExplorerSections();
}

setup();
document.addEventListener('astro:page-load', setup);