// Code-copy buttons + language badges, reading-progress bar, and global
// keyboard shortcuts. Mounted globally via BaseLayout; re-installed on every
// Astro View Transition (astro:page-load). Global listeners are tracked so a
// re-install never leaves duplicates behind.

interface GlobalHandlers {
  progressWin: null | (() => void);
  keydoc: null | (() => void);
}

const state: GlobalHandlers = { progressWin: null, keydoc: null };

function addCopyButtons(): void {
  for (const pre of document.querySelectorAll<HTMLPreElement>('pre')) {
    if (!pre.querySelector('code') || pre.querySelector('.copy-btn')) continue;

    const codeEl = pre.querySelector('code');
    const lang =
      pre.dataset.language ??
      codeEl?.getAttribute('data-language') ??
      codeEl?.className.match(/language-([\w#.+-]+)/)?.[1];

    if (lang) {
      const badge = document.createElement('span');
      badge.className = 'code-badge';
      badge.textContent = lang;
      pre.append(badge);
    }

    pre.classList.add('has-copy');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.title = 'Copy';
    btn.innerHTML =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    pre.append(btn);

    btn.addEventListener('click', async () => {
      const text = pre.innerText;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.append(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      btn.classList.add('is-copied');
      btn.title = 'Copied';
      setTimeout(() => {
        btn.classList.remove('is-copied');
        btn.title = 'Copy';
      }, 1500);
    });
  }
}

function setupReadingProgress(): void {
  state.progressWin?.();
  state.progressWin = null;

  if (!document.querySelector('[data-post-page]')) {
    document.getElementById('reading-progress')?.remove();
    return;
  }

  const scroller = document.querySelector<HTMLElement>('.studio-content');
  if (!scroller) return;

  let bar = document.getElementById('reading-progress');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'reading-progress';
    bar.setAttribute('aria-hidden', 'true');
    scroller.append(bar);
  }

  let raf = 0;
  const update = (): void => {
    const scrollable =
      scroller.scrollHeight > scroller.clientHeight ? scroller : document.documentElement;
    const max = scrollable.scrollHeight - scrollable.clientHeight;
    const ratio = max > 0 ? scrollable.scrollTop / max : 0;
    bar!.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio)).toFixed(4)})`;
  };

  const onScroll = (): void => {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      update();
    });
  };

  scroller.addEventListener('scroll', onScroll, { passive: true });
  const onWin = (): void => onScroll();
  window.addEventListener('scroll', onWin, { passive: true });
  state.progressWin = onWin;
  update();
}

function setupKeymap(): void {
  state.keydoc?.();
  state.keydoc = null;

  const isTyping = (t: EventTarget | null): boolean =>
    t instanceof HTMLElement &&
    (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

  let gAt = 0;

  const onKey = (e?: KeyboardEvent): void => {
    if (!e) return;
    if (isTyping(e.target)) return;
    if (document.querySelector('[role="dialog"]')) return; // palette open
    const k = e.key.toLowerCase();

    if (k === '/') {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('dawn:open-search'));
      return;
    }
    if (k === 't') {
      e.preventDefault();
      document.querySelector<HTMLElement>('[data-theme-toggle]')?.click();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (k === 'g') {
      gAt = Date.now();
      e.preventDefault();
      return;
    }
    if (gAt && Date.now() - gAt <= 900) {
      gAt = 0;
      if (k === 'h') location.assign('/');
      else if (k === 'b') location.assign('/blog');
      else if (k === 'p') location.assign('/projects');
    }
  };

  document.addEventListener('keydown', onKey);
  state.keydoc = onKey;
}

function install(): void {
  addCopyButtons();
  setupReadingProgress();
  setupKeymap();
}

install();
document.addEventListener('astro:page-load', install);