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

    // Copy Button
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
      const text = pre.innerText.replace(/(?:Copy|Copied|Expand code.*|Collapse code)$/i, '').trim();
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
      btn.innerHTML =
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">' +
        '<polyline points="20 6 9 17 4 12"/></svg>';
      btn.title = 'Copied!';
      setTimeout(() => {
        btn.classList.remove('is-copied');
        btn.innerHTML =
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
          '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        btn.title = 'Copy';
      }, 1500);
    });

    // Collapsible Code Block for long code (> 28 lines)
    const lineCount = (codeEl?.textContent || '').split('\n').length;
    if (lineCount > 28) {
      pre.classList.add('code-collapsed');
      const collapseBtn = document.createElement('button');
      collapseBtn.type = 'button';
      collapseBtn.className = 'code-collapse-btn';
      collapseBtn.innerHTML = `<span>Expand code (${lineCount} lines)</span><span aria-hidden="true">↓</span>`;
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = pre.classList.toggle('code-collapsed');
        if (isCollapsed) {
          collapseBtn.innerHTML = `<span>Expand code (${lineCount} lines)</span><span aria-hidden="true">↓</span>`;
          pre.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          collapseBtn.innerHTML = `<span>Collapse code</span><span aria-hidden="true">↑</span>`;
        }
      });
      pre.append(collapseBtn);
    }
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
    scroller.prepend(bar);
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

function playVictoryChime(): void {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.38);
    });
  } catch {
    // Audio restricted
  }
}

export function launchConfetti(): void {
  playVictoryChime();

  // Floating retro toast banner with 100% inline styles (cannot be broken by Tailwind purging)
  document.getElementById('konami-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'konami-toast';
  Object.assign(toast.style, {
    position: 'fixed',
    top: '28px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '999999',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderRadius: '12px',
    border: '2px solid #fbbf24',
    backgroundColor: 'rgba(15, 17, 23, 0.96)',
    padding: '12px 24px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '12px',
    color: '#fef08a',
    boxShadow: '0 0 40px rgba(251, 191, 36, 0.65), 0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    pointerEvents: 'auto',
    cursor: 'pointer',
    userSelect: 'none',
  });
  toast.innerHTML = `
    <span style="font-size: 26px; line-height: 1;">🎮</span>
    <div>
      <div style="font-weight: 800; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #fbbf24;">
        KONAMI CHEAT ACTIVATED!
      </div>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
        +30 Extra Lives Granted · Developer Easter Egg Unlocked
      </div>
    </div>
  `;
  toast.onclick = () => toast.remove();
  document.body.append(toast);
  setTimeout(() => toast.remove(), 5000);

  // Confetti Canvas
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '999998',
  });
  document.body.append(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#82aaff', '#c792ea', '#ecc48d', '#7fdbca', '#ff5370', '#addb67', '#f59e0b', '#ec4899', '#38bdf8'];
  const particles = Array.from({ length: 180 }).map(() => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 260,
    y: window.innerHeight * 0.45,
    vx: (Math.random() - 0.5) * 24,
    vy: (Math.random() - 0.8) * 22,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 14,
    alpha: 1,
  }));

  const start = performance.now();
  function render(now: number) {
    if (!ctx) return;
    const elapsed = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let alive = false;
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.42; // gravity
      p.rot += p.rotSpeed;
      p.alpha = Math.max(0, 1 - elapsed / 3400);

      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive) {
      requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(render);
}

// Global debug helper for dev console
if (typeof window !== 'undefined') {
  (window as any).__dawn_easter_egg = launchConfetti;
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

function showKeyboardHelpModal(): void {
  let modal = document.getElementById('keyboard-help-modal');
  if (modal) {
    modal.classList.toggle('hidden');
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
        <button type="button" id="close-keyboard-help" class="cursor-pointer text-(--fg-faint) hover:text-(--fg)">✕</button>
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
        <div class="flex justify-between py-1"><span>Show this cheat sheet</span><kbd class="rounded border border-(--border) px-1.5 py-0.5 text-[10px] bg-(--bg-alt) text-(--fg)">?</kbd></div>
        <div class="mt-4 pt-3 border-t border-(--border)/60 flex items-center justify-between">
          <span class="text-[11px] text-(--fg-faint)">Secret Easter Egg</span>
          <button type="button" id="btn-modal-easter-egg" class="cursor-pointer text-amber-400 hover:text-amber-300 text-[11px] font-semibold underline">
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
      window.removeEventListener('keydown', state.keydoc as any);
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

  document.getElementById('btn-keyboard-help')?.addEventListener('click', () => {
    showKeyboardHelpModal();
  });

  const isTyping = (t: EventTarget | null): boolean =>
    t instanceof HTMLElement &&
    (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

  let gAt = 0;

  let vimClickCount = 0;
  let vimClickTimer: any = null;
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
    const keyCode = e.keyCode || (e as any).which || 0;
    const kLower = key.toLowerCase();

    // Don't let pure modifiers break sequence
    if (key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta') return;

    recordKeyForEasterEgg(key, code, keyCode);

    if (isTyping(e.target)) return;
    if (document.querySelector('[role="dialog"]') || !document.getElementById('keyboard-help-modal')?.classList.contains('hidden') && document.getElementById('keyboard-help-modal')) {
      if (e.key === 'Escape') {
        document.getElementById('keyboard-help-modal')?.classList.add('hidden');
      }
      return; // palette or help open
    }

    if (e.key === '?') {
      e.preventDefault();
      showKeyboardHelpModal();
      return;
    }

    if (kLower === '/') {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('dawn:open-search'));
      return;
    }
    if (kLower === 't') {
      e.preventDefault();
      document.querySelector<HTMLElement>('[data-theme-toggle]')?.click();
      return;
    }

    if (kLower === 'r') {
      e.preventDefault();
      const cur = localStorage.getItem('dawn_weather_mode');
      const next = cur === 'rain' ? 'off' : 'rain';
      window.dispatchEvent(new CustomEvent('dawn:set-weather', { detail: { mode: next } }));
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const scroller = document.querySelector<HTMLElement>('.studio-content') ?? window;

    // Vim scrolling: j (down), k (up)
    if (kLower === 'j') {
      e.preventDefault();
      scroller.scrollBy({ top: 120, behavior: 'smooth' });
      return;
    }
    if (kLower === 'k') {
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
