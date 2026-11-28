// Code-copy buttons + language badges, reading-progress bar, and global
// keyboard shortcuts. Mounted globally via BaseLayout; re-installed on every
// Astro View Transition (astro:page-load). Global listeners are tracked so a
// re-install never leaves duplicates behind.

interface GlobalHandlers {
  progressWin: null | (() => void);
  keydoc: null | ((e: KeyboardEvent) => void);
}

const state: GlobalHandlers = { progressWin: null, keydoc: null };

// Lazily loaded features — pages only download the code they actually use.
function addCopyButtons(): void {
  if (document.querySelector('pre')) void import('./extras/code-blocks.ts').then((m) => m.addCopyButtons());
}

let readingProgressLoaded = false;
function setupReadingProgress(): void {
  if (!readingProgressLoaded && !document.querySelector('[data-post-page]')) {
    document.getElementById('reading-progress')?.remove();
    return;
  }
  readingProgressLoaded = true;
  void import('./extras/reading-progress.ts').then((m) => m.setupReadingProgress());
}

// Hover Preview for internal blog links
interface PostPreview {
  id: string;
  title: string;
  summary: string;
  date: string;
  minutes: number;
  tags: string[];
}
let postsCache: PostPreview[] | null = null;
let previewTooltip: HTMLElement | null = null;
let previewTimeout: number = 0;

function setupLinkPreview(): void {
  if (typeof window === 'undefined') return;

  if (!previewTooltip) {
    previewTooltip = document.createElement('div');
    previewTooltip.className = 'link-preview-card';
    previewTooltip.setAttribute('role', 'tooltip');
    document.body.append(previewTooltip);
  }

  async function ensurePosts(): Promise<PostPreview[]> {
    if (postsCache) return postsCache;
    try {
      const res = await fetch('/api/posts.json');
      if (res.ok) postsCache = (await res.json()) as PostPreview[];
    } catch {
      postsCache = [];
    }
    return postsCache || [];
  }

  const currentPath = window.location.pathname;

  document.querySelectorAll<HTMLAnchorElement>('a[href^="/blog/"]').forEach((link) => {
    if (link.dataset.hasPreview) return;
    link.dataset.hasPreview = '1';

    const href = link.getAttribute('href') ?? '';
    const slug = href.replace(/^\/blog\/?/, '').replace(/\/$/, '').split('#')[0];
    if (!slug || href === currentPath) return;

    link.addEventListener('mouseenter', async () => {
      clearTimeout(previewTimeout);
      previewTimeout = window.setTimeout(async () => {
        const posts = await ensurePosts();
        const post = posts.find((p) => p.id === slug);
        if (!post || !previewTooltip) return;

        const dateStr = new Date(post.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        previewTooltip.innerHTML = `
          <div class="link-preview-title">${post.title}</div>
          <div class="link-preview-meta">📅 ${dateStr} · ⏱️ ${post.minutes} min read</div>
          <div class="link-preview-summary">${post.summary}</div>
        `;

        const rect = link.getBoundingClientRect();
        const tooltipW = 280;
        let left = rect.left + rect.width / 2 - tooltipW / 2;
        if (left < 10) left = 10;
        if (left + tooltipW > window.innerWidth - 10) left = window.innerWidth - tooltipW - 10;

        let top = rect.bottom + 8;
        if (top + 140 > window.innerHeight) {
          top = rect.top - 120; // Flip above if close to bottom
        }

        previewTooltip.style.left = `${left}px`;
        previewTooltip.style.top = `${top}px`;
        previewTooltip.classList.add('is-visible');
      }, 220);
    });

    link.addEventListener('mouseleave', () => {
      clearTimeout(previewTimeout);
      previewTooltip?.classList.remove('is-visible');
    });
  });
}

// ---------------------------------------------------------------------------
// Bulletproof Easter Egg Engine: Konami Code, 'konami' word & Click Trigger
// ---------------------------------------------------------------------------
const keyHistory: string[] = [];

let confettiModule: Promise<typeof import('./extras/confetti.ts')> | null = null;
export function launchConfetti(): void {
  void (confettiModule ??= import('./extras/confetti.ts')).then((m) => m.launchConfetti());
}

// Global debug helper for dev console
if (typeof window !== 'undefined') {
  window.__dawn_easter_egg = launchConfetti;
}

let lastRecordedTime = 0;
let lastRecordedNorm = '';

function recordKeyForEasterEgg(key: string, code: string, keyCode = 0): void {
  let norm = (key || '').toLowerCase();

  // Match Up
  if (norm === 'arrowup' || norm === 'up' || code === 'ArrowUp' || keyCode === 38) {
    norm = 'up';
  }
  // Match Down
  else if (norm === 'arrowdown' || norm === 'down' || code === 'ArrowDown' || keyCode === 40) {
    norm = 'down';
  }
  // Match Left
  else if (norm === 'arrowleft' || norm === 'left' || code === 'ArrowLeft' || keyCode === 37) {
    norm = 'left';
  }
  // Match Right
  else if (norm === 'arrowright' || norm === 'right' || code === 'ArrowRight' || keyCode === 39) {
    norm = 'right';
  }
  // Match B
  else if (norm === 'b' || code === 'KeyB' || keyCode === 66) {
    norm = 'b';
  }
  // Match A
  else if (norm === 'a' || code === 'KeyA' || keyCode === 65) {
    norm = 'a';
  }
  // Keep physical letters like KeyK -> 'k', KeyO -> 'o', KeyN -> 'n', KeyM -> 'm', KeyI -> 'i'
  else if (code && code.startsWith('Key')) {
    norm = code.slice(3).toLowerCase();
  }

  // Prevent double events within 70ms for identical key
  const now = Date.now();
  if (norm === lastRecordedNorm && now - lastRecordedTime < 70) {
    return;
  }
  lastRecordedTime = now;
  lastRecordedNorm = norm;

  keyHistory.push(norm);
  if (keyHistory.length > 30) keyHistory.shift();

  const joined = keyHistory.join(',');

  const patterns = [
    'up,up,down,down,left,right,left,right,b,a',
    'up,up,down,down,left,right,left,right,a,b',
    'up,up,down,down,left,right,left,right,b,a,enter',
    'up,up,down,down,left,right,left,right,a,b,enter',
    'k,o,n,a,m,i',
    'c,h,e,a,t',
    'e,a,s,t,e,r',
    'd,a,w,n',
  ];

  // Collapse consecutive duplicates so even spammed keys match perfectly
  const collapsed: string[] = [];
  for (let i = 0; i < keyHistory.length; i++) {
    const k = keyHistory[i];
    if (
      collapsed.length >= 2 &&
      collapsed[collapsed.length - 1] === k &&
      collapsed[collapsed.length - 2] === k
    ) {
      continue;
    }
    if (
      k !== 'up' &&
      k !== 'down' &&
      collapsed.length >= 1 &&
      collapsed[collapsed.length - 1] === k
    ) {
      continue;
    }
    collapsed.push(k);
  }
  const collapsedStr = collapsed.join(',');

  const matched = patterns.some((p) => joined.endsWith(p) || collapsedStr.endsWith(p));

  if (matched) {
    keyHistory.length = 0;
    launchConfetti();
  }
}

function showKeyboardHelpModal(forceOpen?: boolean): void {
  let modal = document.getElementById('keyboard-help-modal');
  if (modal) {
    if (forceOpen === true) {
      modal.classList.remove('hidden');
    } else {
      modal.classList.toggle('hidden');
    }
    return;
  }

  modal = document.createElement('div');
  modal.id = 'keyboard-help-modal';
  modal.className =
    'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-xl border border-(--border) bg-(--bg) p-6 shadow-2xl font-mono text-xs">
      <div class="flex items-center justify-between border-b border-(--border) pb-3 mb-4">
        <span class="font-bold text-(--fg) text-sm flex items-center gap-2">
          <span>⌨️ Keyboard Shortcuts</span>
          <span class="rounded bg-(--accent)/10 text-(--accent) px-1.5 py-0.5 text-[10px]">VIM</span>
        </span>
        <button type="button" id="close-keyboard-help" data-track-event="help-modal-close" class="cursor-pointer text-(--fg-faint) hover:text-(--fg)">✕</button>
      </div>
      <div class="space-y-2.5 text-(--fg-dim)">
        <div class="flex justify-between items-center"><span class="text-(--fg)">Navigation</span></div>
        <div class="flex justify-between py-1 border-b border-(--border)/60"><span>Scroll down / up</span><kbd class="rounded border border-(--border) px-1.5 py-0.5 text-[10px] bg-(--bg-alt) text-(--fg)">j / k</kbd></div>
        <div class="flex justify-between py-1 border-b border-(--border)/60"><span>Half page down / up</span><kbd class="rounded border border-(--border) px-1.5 py-0.5 text-[10px] bg-(--bg-alt) text-(--fg)">d / u</kbd></div>
        <div class="flex justify-between py-1 border-b border-(--border)/60"><span>Top / Bottom of page</span><kbd class="rounded border border-(--border) px-1.5 py-0.5 text-[10px] bg-(--bg-alt) text-(--fg)">gg / G</kbd></div>
        <div class="mt-4 flex justify-between items-center"><span class="text-(--fg)">Quick Jump</span></div>
        <div class="flex justify-between py-1 border-b border-(--border)/60"><span>Go Home / Blog / Projects</span><kbd class="rounded border border-(--border) px-1.5 py-0.5 text-[10px] bg-(--bg-alt) text-(--fg)">g h / g b / g p</kbd></div>
        <div class="flex justify-between py-1 border-b border-(--border)/60"><span>Go Lab / Now</span><kbd class="rounded border border-(--border) px-1.5 py-0.5 text-[10px] bg-(--bg-alt) text-(--fg)">g l / g n</kbd></div>
        <div class="mt-4 flex justify-between items-center"><span class="text-(--fg)">Actions</span></div>
        <div class="flex justify-between py-1 border-b border-(--border)/60"><span>Command Search</span><kbd class="rounded border border-(--border) px-1.5 py-0.5 text-[10px] bg-(--bg-alt) text-(--fg)">/ or Ctrl+K</kbd></div>
        <div class="flex justify-between py-1 border-b border-(--border)/60"><span>Toggle Dark / Light theme</span><kbd class="rounded border border-(--border) px-1.5 py-0.5 text-[10px] bg-(--bg-alt) text-(--fg)">t</kbd></div>
        <div class="flex justify-between py-1 border-b border-(--border)/60"><span>Toggle Zen Reading Mode</span><kbd class="rounded border border-(--border) px-1.5 py-0.5 text-[10px] bg-(--bg-alt) text-(--fg)">z</kbd></div>
        <div class="flex justify-between py-1"><span>Show this cheat sheet</span><kbd class="rounded border border-(--border) px-1.5 py-0.5 text-[10px] bg-(--bg-alt) text-(--fg)">?</kbd></div>
        <div class="mt-4 pt-3 border-t border-(--border)/60 flex items-center justify-between">
          <span class="text-[11px] text-(--fg-faint)">Secret Easter Egg</span>
          <button type="button" id="btn-modal-easter-egg" data-track-event="easter-egg-test" class="cursor-pointer text-amber-400 hover:text-amber-300 text-[11px] font-semibold underline">
            🎮 Test Fireworks & Chime
          </button>
        </div>
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal!.classList.add('hidden');
  });
  modal.querySelector('#close-keyboard-help')?.addEventListener('click', () => {
    modal!.classList.add('hidden');
  });
  modal.querySelector('#btn-modal-easter-egg')?.addEventListener('click', () => {
    modal!.classList.add('hidden');
    launchConfetti();
  });

  document.body.append(modal);
}

function updateStatusbarVimMode(mode: 'NORMAL' | 'INSERT'): void {
  const el = document.getElementById('statusbar-vim-mode');
  if (!el) return;
  el.textContent = mode;
  if (mode === 'INSERT') {
    el.className = 'rounded border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 select-none';
  } else {
    el.className = 'rounded border border-(--border) px-1.5 py-0.5 text-[10px] font-semibold text-(--accent) bg-(--bg) select-none';
  }
}

function updateFooterTokens(): void {
  const el = document.querySelector<HTMLElement>('[data-footer-tokens]');
  if (!el) return;
  fetch('/api/token-burn.json')
    .then((r) => r.ok ? r.json() : null)
    .then((data) => {
      if (!data || !data.allTime) return;
      const tokens = data.allTime.tokens ?? 0;
      let label = `${tokens.toLocaleString()} tokens`;
      if (tokens >= 1e9) label = `${(tokens / 1e9).toFixed(2)}B`;
      else if (tokens >= 1e6) label = `${(tokens / 1e6).toFixed(1)}M`;
      el.textContent = label;
    })
    .catch(() => {});
}

function setupKeymap(): void {
  if (state.keydoc) {
    try {
      window.removeEventListener('keydown', state.keydoc);
    } catch {}
  }
  state.keydoc = null;

  updateFooterTokens();

  // Listen to focus changes to toggle NORMAL vs INSERT in status bar
  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
      updateStatusbarVimMode('INSERT');
    }
  });
  document.addEventListener('focusout', () => {
    updateStatusbarVimMode('NORMAL');
  });

  const helpBtn = document.getElementById('btn-keyboard-help');
  if (helpBtn && !helpBtn.dataset.bound) {
    helpBtn.dataset.bound = '1';
    helpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showKeyboardHelpModal();
    });
  }

  // Zen Mode Controller: Fullscreen on desktop + floating exit pill for casual users
  const toggleZenMode = (force?: boolean): void => {
    const isCurrentlyZen = document.documentElement.classList.contains('zen-mode');
    const targetState = typeof force === 'boolean' ? force : !isCurrentlyZen;

    if (targetState === isCurrentlyZen) return;

    if (targetState) {
      document.documentElement.classList.add('zen-mode');

      // Add intuitive floating exit badge for users who don't know keyboard shortcuts
      let pill = document.getElementById('zen-exit-pill');
      if (!pill) {
        const button = document.createElement('button');
        button.type = 'button';
        pill = button;
        pill.id = 'zen-exit-pill';
        pill.className = 'zen-exit-pill';
        pill.setAttribute('aria-label', 'Thoát chế độ Zen Mode');
        pill.innerHTML = `<span>✕</span><span>Thoát Zen Mode</span><kbd class="rounded border border-(--border) bg-(--bg) px-1 text-[10px] text-(--fg-dim)">Esc</kbd>`;
        pill.addEventListener('click', (ev) => {
          ev.stopPropagation();
          toggleZenMode(false);
        });
        document.body.appendChild(pill);
      } else {
        pill.style.display = 'flex';
      }

      // True Fullscreen on Desktop (screen width >= 768px)
      if (window.innerWidth >= 768 && !document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }

      showMicroToast('🧘 Zen Mode (Nhấn ✕ góc trên hoặc Esc để thoát)');
    } else {
      document.documentElement.classList.remove('zen-mode');

      const pill = document.getElementById('zen-exit-pill');
      if (pill) pill.remove();

      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }

      showMicroToast('Đã khôi phục giao diện mặc định');
    }
  };

  // Sync when user exits browser native fullscreen (F11 / browser Esc)
  if (!window.__dawn_fullscreen_bound) {
    window.__dawn_fullscreen_bound = true;
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && document.documentElement.classList.contains('zen-mode')) {
        toggleZenMode(false);
      }
    });
  }

  // Bind clickable Zen Mode buttons on page (Post Header & Footer)
  const articleZenBtn = document.getElementById('btn-article-zen');
  if (articleZenBtn && !articleZenBtn.dataset.bound) {
    articleZenBtn.dataset.bound = '1';
    articleZenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleZenMode();
    });
  }

  const footerZenBtn = document.getElementById('btn-footer-zen');
  if (footerZenBtn && !footerZenBtn.dataset.bound) {
    footerZenBtn.dataset.bound = '1';
    footerZenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleZenMode();
    });
  }

  const isTyping = (t: EventTarget | null): boolean =>
    t instanceof HTMLElement &&
    (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

  let gAt = 0;

  let hasShownVimToast = false;
  const notifyVimScroll = (): void => {
    if (!hasShownVimToast) {
      hasShownVimToast = true;
      showMicroToast('✦ Vim Navigation Active · Press ? for help');
    }
  };

  const showMicroToast = (text: string): void => {
    const existing = document.querySelector('.dawn-micro-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'dawn-micro-toast';
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
  };

  let vimClickCount = 0;
  let vimClickTimer: ReturnType<typeof setTimeout> | undefined;
  document.getElementById('statusbar-vim-mode')?.addEventListener('click', () => {
    vimClickCount++;
    clearTimeout(vimClickTimer);
    vimClickTimer = setTimeout(() => { vimClickCount = 0; }, 2000);
    if (vimClickCount >= 3) {
      vimClickCount = 0;
      launchConfetti();
    }
  });

  const onKey = (e?: KeyboardEvent): void => {
    if (!e) return;
    if (e.repeat) return; // Ignore hold-down repeat spam

    const key = e.key || '';
    const code = e.code || '';
    const keyCode = e.keyCode || e.which || 0;
    const kLower = key.toLowerCase();

    // Don't let pure modifiers break sequence
    if (key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta') return;

    recordKeyForEasterEgg(key, code, keyCode);

    if (isTyping(e.target)) return;

    const helpModal = document.getElementById('keyboard-help-modal');
    const isHelpOpen = !!(helpModal && !helpModal.classList.contains('hidden'));

    if (e.key === 'Escape') {
      if (isHelpOpen) {
        helpModal?.classList.add('hidden');
        return;
      }
      if (document.documentElement.classList.contains('zen-mode')) {
        toggleZenMode(false);
        return;
      }
    }

    if (document.querySelector('[role="dialog"]') || isHelpOpen) {
      return; // palette or help modal open
    }

    if (e.key === '?') {
      e.preventDefault();
      try { window.umami?.track('shortcut-press', { key: '?' }); } catch {}
      showKeyboardHelpModal(true);
      return;
    }

    if (kLower === '/') {
      e.preventDefault();
      try { window.umami?.track('shortcut-press', { key: '/' }); } catch {}
      document.dispatchEvent(new CustomEvent('dawn:open-search'));
      return;
    }
    if (kLower === 't') {
      e.preventDefault();
      try { window.umami?.track('shortcut-press', { key: 't' }); } catch {}
      document.querySelector<HTMLElement>('[data-theme-toggle]')?.click();
      return;
    }
    if (kLower === 'z') {
      e.preventDefault();
      try { window.umami?.track('shortcut-press', { key: 'z' }); } catch {}
      toggleZenMode();
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const scroller = document.querySelector<HTMLElement>('.studio-content') ?? window;

    // Vim scrolling: j (down), k (up)
    if (kLower === 'j') {
      notifyVimScroll();
      e.preventDefault();
      scroller.scrollBy({ top: 120, behavior: 'smooth' });
      return;
    }
    if (kLower === 'k') {
      notifyVimScroll();
      e.preventDefault();
      scroller.scrollBy({ top: -120, behavior: 'smooth' });
      return;
    }
    // Half page: d (down), u (up)
    if (kLower === 'd') {
      e.preventDefault();
      const h = scroller instanceof Window ? window.innerHeight : scroller.clientHeight;
      scroller.scrollBy({ top: h * 0.45, behavior: 'smooth' });
      return;
    }
    if (kLower === 'u') {
      e.preventDefault();
      const h = scroller instanceof Window ? window.innerHeight : scroller.clientHeight;
      scroller.scrollBy({ top: -h * 0.45, behavior: 'smooth' });
      return;
    }
    // Shift+G: Scroll to bottom
    if (e.key === 'G') {
      e.preventDefault();
      const maxScroll = scroller instanceof Window ? document.documentElement.scrollHeight : scroller.scrollHeight;
      scroller.scrollTo({ top: maxScroll, behavior: 'smooth' });
      return;
    }

    if (kLower === 'g') {
      if (gAt && Date.now() - gAt <= 500) {
        // gg: Scroll to top
        gAt = 0;
        e.preventDefault();
        scroller.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      gAt = Date.now();
      e.preventDefault();
      return;
    }

    // Two-key quick navigation
    if (gAt && Date.now() - gAt <= 900) {
      gAt = 0;
      try { window.umami?.track('shortcut-jump', { target: kLower }); } catch {}
      if (kLower === 'h') location.assign('/');
      else if (kLower === 'b') location.assign('/blog');
      else if (kLower === 'p') location.assign('/projects');
      else if (kLower === 'l') location.assign('/lab');
      else if (kLower === 'n') location.assign('/now');
    }
  };

  window.addEventListener('keydown', onKey);
  window.addEventListener('dawn:confetti', () => launchConfetti());
  state.keydoc = onKey;
}


// ---------------------------------------------------------------------------
// Lazy-Load Coordinator for Atmospheric Weather & Mechanical Key Sound
// (Extracts heavy audio synthesis & canvas physics out of the initial bundle)
// ---------------------------------------------------------------------------
let weatherLoaded = false;
let soundLoaded = false;

function loadWeather(cb?: (m: typeof import('./weather.ts')) => void): void {
  if (weatherLoaded) return;
  import('./weather.ts').then((m) => {
    weatherLoaded = true;
    m.setupWeatherEngine();
    if (cb) cb(m);
  });
}

function loadSound(cb?: (m: typeof import('./sound.ts')) => void): void {
  if (soundLoaded) return;
  import('./sound.ts').then((m) => {
    soundLoaded = true;
    m.setupMechanicalKeyboardSound();
    if (cb) cb(m);
  });
}

function initAudioAndWeather(): void {
  const weatherStored = localStorage.getItem('dawn_weather_mode');
  const soundStored = localStorage.getItem('dawn_sound_profile') || localStorage.getItem('dawn_thock_sound');

  const needsWeather = weatherStored && weatherStored !== 'off';
  const needsSound = soundStored && soundStored !== 'off';

  if (needsWeather) {
    loadWeather();
  }

  if (needsSound) {
    loadSound();
  }

  // Pre-bind weather trigger button
  const weatherBtn = document.getElementById('btn-global-weather') || document.getElementById('btn-weather-mode');
  if (weatherBtn && !weatherLoaded) {
    weatherBtn.addEventListener('click', (e) => {
      if (!weatherLoaded) {
        e.preventDefault();
        loadWeather(() => {
          weatherBtn.click();
        });
      }
    }, { once: true });
  }

  // Pre-bind sound trigger button
  const soundBtn = document.getElementById('btn-keyboard-sound');
  if (soundBtn && !soundLoaded) {
    soundBtn.addEventListener('click', (e) => {
      if (!soundLoaded) {
        e.preventDefault();
        loadSound(() => {
          soundBtn.click();
        });
      }
    }, { once: true });
  }

  // Window event listeners for Command Palette triggers
  window.addEventListener('dawn:toggle-weather', () => {
    if (!weatherLoaded) loadWeather();
  });
  window.addEventListener('dawn:set-weather', (e: Event) => {
    if (!weatherLoaded) {
      loadWeather(() => {
        window.dispatchEvent(new CustomEvent('dawn:set-weather', { detail: (e as CustomEvent).detail }));
      });
    }
  });
  window.addEventListener('dawn:toggle-rain', () => {
    if (!weatherLoaded) loadWeather();
  });
}

function install(): void {
  addCopyButtons();
  setupReadingProgress();
  setupKeymap();
  setupLinkPreview();
  initAudioAndWeather();
}

install();
document.addEventListener('astro:page-load', install);
