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

function setupSpiderCanvas(): void {
  const canvas = document.getElementById('spider-canvas');
  if (!(canvas instanceof HTMLCanvasElement) || canvas.dataset.spiderInit) return;
  canvas.dataset.spiderInit = '1';
  const cv: HTMLCanvasElement = canvas;
  const ctx = cv.getContext('2d')!;
  const { sin, cos, PI, hypot, min, max } = Math;

  const wrap = cv.parentElement!;
  let W = 0;
  let H = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function rnd(x = 1, dx = 0) {
    return Math.random() * x + dx;
  }
  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }
  function noise(x: number, y: number, t = 101) {
    const w0 = sin(0.3 * x + 1.4 * t + 2.0 + 2.5 * sin(0.4 * y + -1.3 * t + 1.0));
    const w1 = sin(0.2 * y + 1.5 * t + 2.8 + 2.3 * sin(0.5 * x + -1.2 * t + 0.5));
    return w0 + w1;
  }
  function many<T>(n: number, f: (i: number) => T): T[] {
    return Array.from({ length: n }, (_, i) => f(i));
  }
  function drawCircle(x: number, y: number, r: number) {
    ctx.beginPath();
    ctx.ellipse(x, y, r, r, 0, 0, PI * 2);
    ctx.fill();
  }
  function drawLine(x0: number, y0: number, x1: number, y1: number) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    many(100, (i) => {
      i = (i + 1) / 100;
      const x = lerp(x0, x1, i);
      const y = lerp(y0, y1, i);
      const k = noise(x / 5 + x0, y / 5 + y0) * 2;
      ctx.lineTo(x + k, y + k);
    });
    ctx.stroke();
  }

  function spawn() {
    const pts = many(333, () => ({
      x: rnd(W),
      y: rnd(H),
      len: 0,
      r: 0,
    }));
    const pts2 = many(9, (i) => ({
      x: cos((i / 9) * PI * 2),
      y: sin((i / 9) * PI * 2),
    }));

    let seed = rnd(100);
    let tx = rnd(W);
    let ty = rnd(H);
    let x = rnd(W);
    let y = rnd(H);
    const kx = rnd(0.8);
    const ky = rnd(0.8);
    const walkRadius = { x: rnd(50), y: rnd(50) };
    const r = W / rnd(100, 150);

    function paintPt(pt: { x: number; y: number; len?: number; r?: number }) {
      pts2.forEach((pt2) => {
        if (!pt.len) return;
        drawLine(
          lerp(x + pt2.x * r, pt.x, pt.len * pt.len),
          lerp(y + pt2.y * r, pt.y, pt.len * pt.len),
          x + pt2.x * r,
          y + pt2.y * r,
        );
      });
      drawCircle(pt.x, pt.y, pt.r || 1);
    }

    return {
      follow(newTx: number, newTy: number) {
        tx = newTx;
        ty = newTy;
      },
      tick(t: number) {
        const selfMoveX = cos(t * kx + seed) * walkRadius.x;
        const selfMoveY = sin(t * ky + seed) * walkRadius.y;
        const fx = tx + selfMoveX;
        const fy = ty + selfMoveY;

        x += min(W / 100, (fx - x) / 10);
        y += min(W / 100, (fy - y) / 10);

        let i = 0;
        pts.forEach((pt) => {
          const dx = pt.x - x;
          const dy = pt.y - y;
          const len = hypot(dx, dy);
          let r = min(2, W / len / 5);
          const increasing = len < W / 10 && i++ < 8;
          const dir = increasing ? 0.1 : -0.1;
          if (increasing) r *= 1.5;
          pt.r = r;
          pt.len = max(0, min((pt.len || 0) + dir, 1));
          paintPt(pt);
        });
      },
    };
  }

  const spiders = many(2, spawn);

  cv.addEventListener('pointermove', (e) => {
    const rect = cv.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    spiders.forEach((s) => s.follow(px, py));
  });

  const start = performance.now();
  function frame() {
    const t = (performance.now() - start) / 1000;
    ctx.fillStyle = '#000';
    drawCircle(0, 0, W * 10);
    ctx.fillStyle = ctx.strokeStyle = '#fff';
    spiders.forEach((s) => s.tick(t));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Unified Audio Engine & Mechanical Keyboard Sound Synthesizer
// ---------------------------------------------------------------------------
let masterAudioCtx: AudioContext | null = null;

export function getDawnAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!masterAudioCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      masterAudioCtx = new Ctx();
    }
  }
  if (masterAudioCtx && masterAudioCtx.state === 'suspended') {
    masterAudioCtx.resume().catch(() => {});
  }
  return masterAudioCtx;
}

// Global user gesture unlocker to ensure browser audio pipeline is always ready
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getDawnAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  ['pointerdown', 'keydown', 'touchstart', 'click'].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { passive: true });
  });
}

// Backward-compatibility alias
export const getKeyAudioContext = getDawnAudioContext;

type SoundProfile = 'thock' | 'clicky' | 'tactile' | 'cream';
let currentSoundProfile: SoundProfile = 'thock';

/**
 * High-End Mechanical Switch Sound Synthesizer
 * Key types: normal, space, enter, backspace, modifier (Shift/Ctrl/Alt/Tab/CapsLock), function (F1-F12), arrow
 * Sound profiles: thock (lubed linear), clicky (Blue switch), tactile (Brown switch), cream (deep POM linear)
 */
export function playKeystrokeSound(keyOrSpecial: string | boolean = false): void {
  try {
    const ctx = getDawnAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const profile = currentSoundProfile;

    // --- Determine key type ---
    let keyType: 'normal' | 'space' | 'enter' | 'backspace' | 'modifier' | 'function' | 'arrow' = 'normal';
    if (typeof keyOrSpecial === 'string') {
      const k = keyOrSpecial.toLowerCase();
      if (k === ' ' || k === 'space' || k === 'spacebar') keyType = 'space';
      else if (k === 'enter') keyType = 'enter';
      else if (k === 'backspace' || k === 'delete') keyType = 'backspace';
      else if (['shift', 'control', 'alt', 'meta', 'capslock', 'tab'].includes(k)) keyType = 'modifier';
      else if (/^f\d{1,2}$/.test(k)) keyType = 'function';
      else if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) keyType = 'arrow';
    } else if (keyOrSpecial === true) {
      keyType = 'space';
    }

    // --- Base acoustic parameters by key type ---
    let fCavity: number, fBottom: number, fSnap: number, snapGain: number, thockGain: number, decay: number;

    switch (keyType) {
      case 'space':
        // 6.25u stabilized spacebar — large hollow keycap + stabilizer wire rattle
        fCavity = 195; fBottom = 110; fSnap = 2200; snapGain = 0.22; thockGain = 0.46; decay = 0.075; break;
      case 'enter':
        // 2.25u enter — stabilized, medium mass keycap
        fCavity = 270; fBottom = 135; fSnap = 2800; snapGain = 0.19; thockGain = 0.38; decay = 0.058; break;
      case 'backspace':
        // 2u backspace — slightly smaller stabilized key
        fCavity = 300; fBottom = 145; fSnap = 3000; snapGain = 0.18; thockGain = 0.35; decay = 0.052; break;
      case 'modifier':
        // 1.25u–2.25u modifier keys — larger than alpha, no stabilizer
        fCavity = 250; fBottom = 125; fSnap = 2600; snapGain = 0.20; thockGain = 0.40; decay = 0.060; break;
      case 'function':
        // F1–F12 function row — thin ABS keycaps, tight acoustic cavity, high snap
        fCavity = 520; fBottom = 200; fSnap = 4200; snapGain = 0.12; thockGain = 0.22; decay = 0.035; break;
      case 'arrow':
        // Arrow keys — small 1u stepped keycaps, crisp high-pitched resonance
        fCavity = 440; fBottom = 185; fSnap = 3800; snapGain = 0.13; thockGain = 0.26; decay = 0.038; break;
      default: {
        // Standard alphanumeric — natural pitch jitter per key for organic feel
        fCavity = 380; fBottom = 160; fSnap = 3400; snapGain = 0.16; thockGain = 0.32; decay = 0.048;
        const jitter = (Math.random() - 0.5) * 50;
        fCavity += jitter; fBottom += jitter * 0.4; fSnap += jitter * 4;
        break;
      }
    }

    // --- Apply sound profile multipliers on top of key-type base ---
    if (profile === 'clicky') {
      // Blue-switch: sharp, high-pitched snap + click jacket, reduced resonance body
      fSnap *= 1.4; snapGain *= 1.8; thockGain *= 0.65; decay *= 0.65;
    } else if (profile === 'tactile') {
      // Brown-switch: pronounced tactile snap bump, moderate depth
      fCavity *= 1.1; fSnap *= 1.2; snapGain *= 1.4; thockGain *= 0.85; decay *= 0.85;
    } else if (profile === 'cream') {
      // Creamy POM linear: deep, smooth, long resonance tail — famous Taeha Types sound
      fCavity *= 0.85; fBottom *= 0.85; fSnap *= 0.7; snapGain *= 0.75; thockGain *= 1.35; decay *= 1.35;
    }
    // 'thock' = baseline lubed linear, no multiplier

    // ----------------------------------------------------
    // 1. Tactile Impact Snap (high-passed plastic transient)
    // ----------------------------------------------------
    const snapLen = Math.floor(ctx.sampleRate * 0.007);
    const snapBuf = ctx.createBuffer(1, snapLen, ctx.sampleRate);
    const snapData = snapBuf.getChannelData(0);
    for (let i = 0; i < snapLen; i++) {
      snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (snapLen * 0.22));
    }
    const snapNode = ctx.createBufferSource();
    snapNode.buffer = snapBuf;
    const snapFilter = ctx.createBiquadFilter();
    snapFilter.type = 'bandpass';
    snapFilter.frequency.setValueAtTime(fSnap, now);
    snapFilter.Q.setValueAtTime(2.4, now);
    const snapGainNode = ctx.createGain();
    snapGainNode.gain.setValueAtTime(snapGain, now);
    snapGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.007);
    snapNode.connect(snapFilter);
    snapFilter.connect(snapGainNode);
    snapGainNode.connect(ctx.destination);
    snapNode.start(now);

    // Clicky profile: extra oscillator click transient (Blue-switch tactile click jacket)
    if (profile === 'clicky') {
      const clickOsc = ctx.createOscillator();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(fSnap * 0.55, now);
      clickOsc.frequency.exponentialRampToValueAtTime(fSnap * 0.18, now + 0.009);
      const clickHpf = ctx.createBiquadFilter();
      clickHpf.type = 'highpass';
      clickHpf.frequency.setValueAtTime(1800, now);
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.26, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.013);
      clickOsc.connect(clickHpf);
      clickHpf.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.015);
    }

    // ----------------------------------------------------
    // 2. Keycap Cavity Helmholtz Resonance (the deep "thock")
    // ----------------------------------------------------
    const oscCavity = ctx.createOscillator();
    oscCavity.type = 'triangle';
    oscCavity.frequency.setValueAtTime(fCavity, now);
    oscCavity.frequency.exponentialRampToValueAtTime(fBottom, now + decay);
    const cavityFilter = ctx.createBiquadFilter();
    cavityFilter.type = 'bandpass';
    cavityFilter.frequency.setValueAtTime(fCavity, now);
    cavityFilter.Q.setValueAtTime(profile === 'cream' ? 6.2 : 4.6, now);
    const cavityGain = ctx.createGain();
    cavityGain.gain.setValueAtTime(thockGain, now);
    cavityGain.gain.exponentialRampToValueAtTime(0.001, now + decay);
    oscCavity.connect(cavityFilter);
    cavityFilter.connect(cavityGain);
    cavityGain.connect(ctx.destination);
    oscCavity.start(now);
    oscCavity.stop(now + decay + 0.01);

    // ----------------------------------------------------
    // 3. Switch bottom-out low-end thud
    // ----------------------------------------------------
    const oscBottom = ctx.createOscillator();
    oscBottom.type = 'sine';
    oscBottom.frequency.setValueAtTime(fBottom, now);
    oscBottom.frequency.exponentialRampToValueAtTime(40, now + decay);
    const bottomGain = ctx.createGain();
    bottomGain.gain.setValueAtTime(thockGain * 0.7, now);
    bottomGain.gain.exponentialRampToValueAtTime(0.001, now + decay);
    oscBottom.connect(bottomGain);
    bottomGain.connect(ctx.destination);
    oscBottom.start(now);
    oscBottom.stop(now + decay + 0.01);

    // ----------------------------------------------------
    // 4. Key return upstroke tick (+30ms after bottom-out)
    // ----------------------------------------------------
    const upTime = now + 0.030;
    const upLen = Math.floor(ctx.sampleRate * 0.005);
    const upBuf = ctx.createBuffer(1, upLen, ctx.sampleRate);
    const upData = upBuf.getChannelData(0);
    for (let i = 0; i < upLen; i++) {
      upData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (upLen * 0.28));
    }
    const upNode = ctx.createBufferSource();
    upNode.buffer = upBuf;
    const upFilter = ctx.createBiquadFilter();
    upFilter.type = 'bandpass';
    upFilter.frequency.setValueAtTime(fSnap * 0.82, upTime);
    upFilter.Q.setValueAtTime(2.0, upTime);
    const upGainNode = ctx.createGain();
    upGainNode.gain.setValueAtTime(snapGain * 0.4, upTime);
    upGainNode.gain.exponentialRampToValueAtTime(0.001, upTime + 0.005);
    upNode.connect(upFilter);
    upFilter.connect(upGainNode);
    upGainNode.connect(ctx.destination);
    upNode.start(upTime);
  } catch {}
}

/**
 * Tactile Switch Click for UI Buttons
 */
export function playTactileButtonClick(): void {
  try {
    const ctx = getDawnAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.022);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.025);
  } catch {}
}

const SOUND_CYCLE = ['off', 'thock', 'clicky', 'tactile', 'cream'] as const;
type ProfileState = typeof SOUND_CYCLE[number];

const PROFILE_LABEL: Record<ProfileState, string> = {
  off:     'sound: off',
  thock:   'sound: thock',
  clicky:  'sound: clicky',
  tactile: 'sound: tactile',
  cream:   'sound: cream',
};

function getStoredProfile(): ProfileState {
  // Migrate legacy dawn_thock_sound boolean flag → new profile key
  const legacy = localStorage.getItem('dawn_thock_sound');
  if (legacy !== null) {
    const migrated: ProfileState = legacy === 'true' ? 'thock' : 'off';
    localStorage.removeItem('dawn_thock_sound');
    localStorage.setItem('dawn_sound_profile', migrated);
    return migrated;
  }
  return (localStorage.getItem('dawn_sound_profile') as ProfileState | null) ?? 'off';
}

function setupMechanicalKeyboardSound(): void {
  const btn = document.getElementById('btn-keyboard-sound');
  const label = document.getElementById('keyboard-sound-label');

  const getProfile = (): ProfileState => getStoredProfile();

  const updateUI = () => {
    const p = getProfile();
    if (label) label.textContent = PROFILE_LABEL[p] ?? 'sound: off';
    const on = p !== 'off';
    if (btn) {
      btn.classList.toggle('text-(--accent)', on);
      btn.classList.toggle('text-(--fg-faint)', !on);
    }
    currentSoundProfile = on ? (p as SoundProfile) : 'thock';
  };

  updateUI();

  if (btn) {
    btn.onclick = (e) => {
      e.preventDefault();
      const ctx = getDawnAudioContext();
      if (ctx?.state === 'suspended') ctx.resume().catch(() => {});

      const cur = getProfile();
      const idx = SOUND_CYCLE.indexOf(cur);
      const next = SOUND_CYCLE[(idx + 1) % SOUND_CYCLE.length];
      localStorage.setItem('dawn_sound_profile', next);
      updateUI();

      if (next !== 'off') {
        playKeystrokeSound('a');
        setTimeout(() => playKeystrokeSound('space'), 90);
      } else {
        playTactileButtonClick();
      }
    };
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (getProfile() === 'off') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    playKeystrokeSound(e.key);
  };

  window.removeEventListener('keydown', (window as any).__dawn_thock_listener);
  (window as any).__dawn_thock_listener = handleKeydown;
  window.addEventListener('keydown', handleKeydown, { passive: true });
}

// ---------------------------------------------------------------------------
// Atmospheric Weather Engine (Rain, Snow, Storm & Lightning, Wind & Leaves)
// ---------------------------------------------------------------------------
export type WeatherMode = 'off' | 'rain' | 'snow' | 'storm' | 'wind';

let weatherAnimId = 0;
let activeWeatherModeRunning: WeatherMode = 'off';
let weatherResizeHandler: (() => void) | null = null;
let weatherMouseHandler: ((e: MouseEvent) => void) | null = null;
let stormLightningTimer: any = null;

// Master output bus for all weather audio (thunder + rain bed) — the volume
// setting controls this one node; every effect routes through it.
let weatherGain: GainNode | null = null;
let weatherGainCtx: AudioContext | null = null;

export function getWeatherVolume(): number {
  const v = Number(localStorage.getItem('dawn_weather_vol'));
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 1;
}

export function setWeatherVolume(v: number): void {
  const vol = Math.min(1, Math.max(0, v));
  localStorage.setItem('dawn_weather_vol', String(vol));
  if (weatherGain && weatherGainCtx) {
    try {
      weatherGain.gain.cancelScheduledValues(weatherGainCtx.currentTime);
      weatherGain.gain.linearRampToValueAtTime(Math.max(vol, 0.0001), weatherGainCtx.currentTime + 0.15);
    } catch {}
  }
}

function getWeatherGain(ctx: AudioContext): GainNode {
  if (!weatherGain || weatherGainCtx !== ctx) {
    weatherGain = ctx.createGain();
    weatherGain.gain.value = getWeatherVolume();
    weatherGain.connect(ctx.destination);
    weatherGainCtx = ctx;
  }
  return weatherGain;
}

function playThunderSound(): void {
  try {
    const ctx = getDawnAudioContext();
    if (!ctx) return;

    const play = () => {
      const now = ctx.currentTime + 0.02;
      const sr = ctx.sampleRate;

      // Distance: 0 = overhead bolt, 1 = far horizon. Far strikes get a
      // weaker boom and a darker, longer rumble (real behavior).
      const far = Math.random() * Math.random();

      // Brown noise, decorrelated stereo — mono image kills the illusion.
      const makeBrown = (secs: number) => {
        const n = Math.floor(sr * secs);
        const buf = ctx.createBuffer(2, n, sr);
        for (let ch = 0; ch < 2; ch++) {
          const d = buf.getChannelData(ch);
          let last = 0;
          for (let i = 0; i < n; i++) {
            last = (last + 0.045 * (Math.random() * 2 - 1)) / 1.045;
            d[i] = last * 3.4;
          }
        }
        return buf;
      };

      // Envelope of natural thunder: several unpredictable swells (roll), not
      // a clean exponential decay. Rendered as a gain automation curve.
      const humpEnvelope = () => {
        const pts = 28;
        const curve = new Float32Array(pts);
        const phase = Math.random() * Math.PI * 2;
        for (let i = 0; i < pts; i++) {
          const decay = Math.exp(-3.1 * (i / pts));
          const swell = 0.45 + 0.55 * Math.abs(Math.sin(i * 1.35 + phase));
          curve[i] = (0.75 + Math.random() * 0.35) * decay * swell;
        }
        curve[0] = 0.02;
        curve[pts - 1] = 0.0005;
        return curve;
      };

      // 2) Sub boom: brown noise burst swept under 210->55 Hz, pure pressure.
      const boom = (at: number, amp: number) => {
        if (amp <= 0.05) return;
        const src = ctx.createBufferSource();
        src.buffer = makeBrown(0.55);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(210, at);
        lp.frequency.exponentialRampToValueAtTime(55, at + 0.35);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(amp, at + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, at + 0.5);
        src.connect(lp);
        lp.connect(g);
        g.connect(getWeatherGain(ctx));
        src.start(at);
        src.stop(at + 0.55);
      };

      // 3) Main rumble: LP sweep down + random swells + one darker terrain echo.
      const rumble = (at: number) => {
        const dur = 4.2 + far * 3.5 + Math.random();
        const src = ctx.createBufferSource();
        src.buffer = makeBrown(dur);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(480 - far * 230, at);
        lp.frequency.exponentialRampToValueAtTime(45, at + dur);
        lp.Q.value = 0.9;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.setValueCurveAtTime(humpEnvelope(), at, dur);
        const echo = ctx.createDelay(1);
        echo.delayTime.value = 0.16 + Math.random() * 0.2;
        const eLp = ctx.createBiquadFilter();
        eLp.type = 'lowpass';
        eLp.frequency.value = 240;
        const eGain = ctx.createGain();
        eGain.gain.value = 0.32;
        src.connect(lp);
        lp.connect(g);
        g.connect(getWeatherGain(ctx));
        lp.connect(echo);
        echo.connect(eLp);
        eLp.connect(eGain);
        eGain.connect(getWeatherGain(ctx));
        src.start(at);
        src.stop(at + dur);
      };

      // Storm cells often flash 2–4 return strokes 160–400 ms apart.
      const strokes = 1 + (Math.random() < 0.65 ? (Math.random() < 0.4 ? 3 : 1) : 0);
      for (let i = 0; i < strokes; i++) {
        const at = now + i * (0.16 + Math.random() * 0.24);
        boom(at + 0.02, (1 - far) * 0.5);
      }
      rumble(now);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch {}
}

// Rain ambience: continuous filtered-noise bed for rain & storm modes.
let rainAudio: { stop: () => void } | null = null;
let rainAudioMode: 'rain' | 'storm' | null = null;

function startRainAudio(mode: 'rain' | 'storm'): void {
  if (rainAudioMode === mode) return;
  stopRainAudio();
  const ctx = getDawnAudioContext();
  if (!ctx) return;

  let stopped = false;
  let g: GainNode | null = null;
  const sources: AudioScheduledSourceNode[] = [];

  const build = () => {
    const sr = ctx.sampleRate;
    // 2s decorrelated stereo noise bed, pink-lite so it loops seamlessly.
    const buf = ctx.createBuffer(2, sr * 2, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        last = 0.94 * last + 0.06 * (Math.random() * 2 - 1) * 0.55 + (Math.random() * 2 - 1) * 0.45;
        d[i] = last;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 380;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = mode === 'storm' ? 7200 : 5600;
    g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    const target = mode === 'storm' ? 0.12 : 0.075;
    g.gain.exponentialRampToValueAtTime(target, ctx.currentTime + 1.6);
    // Slow gusts: gentle level breathing so the bed is never static.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11 + Math.random() * 0.07;
    const lfoAmp = ctx.createGain();
    lfoAmp.gain.value = target * 0.22;
    lfo.connect(lfoAmp);
    lfoAmp.connect(g.gain);
    src.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(getWeatherGain(ctx));
    src.start();
    lfo.start();
    sources.push(src, lfo);
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(build).catch(() => {});
  } else {
    build();
  }

  rainAudio = {
    stop: () => {
      stopped = true;
      if (g) {
        try {
          g.gain.cancelScheduledValues(ctx.currentTime);
          g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
        } catch {}
      }
      setTimeout(() => sources.forEach((n) => { try { n.stop(); } catch {} }), 900);
    },
  };
  rainAudioMode = mode;
}

function stopRainAudio(): void {
  rainAudio?.stop();
  rainAudio = null;
  rainAudioMode = null;
}

export function setupWeatherEngine(): void {
  const canvas = (document.getElementById('global-weather-canvas') ||
    document.getElementById('global-real-rain')) as HTMLCanvasElement | null;
  const btn = document.getElementById('btn-global-weather') || document.getElementById('btn-global-rain');
  const label = document.getElementById('weather-label') || document.getElementById('rain-label');
  const vol = document.getElementById('weather-vol') as HTMLInputElement | null;
  if (vol) {
    vol.value = String(Math.round(getWeatherVolume() * 100));
    vol.addEventListener('input', () => setWeatherVolume(Number(vol.value) / 100));
  }

  const getSavedMode = (): WeatherMode => {
    const saved = localStorage.getItem('dawn_weather_mode') as WeatherMode | null;
    if (saved && ['off', 'rain', 'snow', 'storm', 'wind'].includes(saved)) {
      return saved;
    }
    if (localStorage.getItem('dawn_real_rain') === 'true') return 'rain';
    return 'off';
  };

  let currentMode: WeatherMode = getSavedMode();

  const updateUI = (mode: WeatherMode) => {
    const configs: Record<WeatherMode, { label: string; icon: string; cls: string; shadow: string }> = {
      off: { label: 'weather: off', icon: '⛅', cls: 'text-(--fg-faint)', shadow: 'none' },
      rain: { label: 'weather: rain', icon: '🌧️', cls: 'text-sky-400', shadow: 'drop-shadow(0 0 6px #38bdf8)' },
      snow: { label: 'weather: snow', icon: '❄️', cls: 'text-cyan-300', shadow: 'drop-shadow(0 0 6px #7dd3fc)' },
      storm: { label: 'weather: storm', icon: '⛈️', cls: 'text-amber-400', shadow: 'drop-shadow(0 0 6px #f59e0b)' },
      wind: { label: 'weather: wind', icon: '💨', cls: 'text-orange-400', shadow: 'drop-shadow(0 0 6px #fb923c)' },
    };

    const cfg = configs[mode] || configs.off;
    if (label) label.textContent = cfg.label;
    if (btn) {
      btn.className = `hidden sm:inline-flex items-center gap-1 text-[11px] ${cfg.cls} cursor-pointer select-none no-underline transition-colors`;
      btn.title = `Weather: ${mode.toUpperCase()} (Click to cycle: Rain 🌧️ → Snow ❄️ → Storm ⛈️ → Wind 💨 → Off ⛅)`;
      const icon = btn.querySelector('.weather-icon, .rain-icon') as HTMLElement | null;
      if (icon) {
        icon.textContent = cfg.icon;
        icon.style.filter = cfg.shadow;
      }
    }
  };

  updateUI(currentMode);

  // Interfaces for weather simulations
  interface RainDrop {
    x: number;
    y: number;
    l: number;
    xs: number;
    ys: number;
    layer: 0 | 1 | 2;
    alpha: number;
    width: number;
  }

  interface Splash {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    radius: number;
  }

  interface Snowflake {
    x: number;
    y: number;
    r: number;
    ys: number;
    wobbleSpeed: number;
    wobbleAmp: number;
    phase: number;
    alpha: number;
    layer: 0 | 1 | 2;
  }

  interface Leaf {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    spinSpeed: number;
    flip: number;
    flipSpeed: number;
    scale: number;
    color: string;
    swayPhase: number;
  }

  interface WindStreak {
    x: number;
    y: number;
    len: number;
    vx: number;
    alpha: number;
    curv: number;
  }

  interface LightningBolt {
    points: { x: number; y: number }[];
    branches: { points: { x: number; y: number }[] }[];
    flashAlpha: number;
    duration: number;
    age: number;
  }

  function startWeather(mode: WeatherMode) {
    if (!canvas || mode === 'off') {
      stopWeather();
      return;
    }

    if (activeWeatherModeRunning === mode && weatherAnimId !== 0) {
      // Weather effect is already running seamlessly across Astro route transitions
      return;
    }
    activeWeatherModeRunning = mode;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.style.display = 'block';
    canvas.classList.remove('opacity-0');
    canvas.classList.add('opacity-90');

    let W = window.innerWidth;
    let H = window.innerHeight;

    let mouseX = -9999;
    let mouseY = -9999;
    let lastMouseX = -9999;
    let mouseVx = 0;

    // Collections
    let rainDrops: RainDrop[] = [];
    let splashes: Splash[] = [];
    let snowflakes: Snowflake[] = [];
    let leaves: Leaf[] = [];
    let windStreaks: WindStreak[] = [];
    let activeBolt: LightningBolt | null = null;

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      initParticles();
    }

    function initParticles() {
      // 1. Rain & Storm particles
      if (mode === 'rain' || mode === 'storm') {
        const isStorm = mode === 'storm';
        const count = isStorm
          ? Math.floor(Math.min(360, Math.max(160, W * 0.22)))
          : Math.floor(Math.min(240, Math.max(80, W * 0.14)));
        rainDrops = [];
        for (let i = 0; i < count; i++) {
          const layer: 0 | 1 | 2 = Math.random() < 0.5 ? 0 : Math.random() < 0.75 ? 1 : 2;
          let ys = isStorm ? 24 + Math.random() * 12 : 12 + Math.random() * 6;
          let l = isStorm ? 30 + Math.random() * 26 : 16 + Math.random() * 14;
          let alpha = isStorm ? 0.35 + Math.random() * 0.3 : 0.2 + Math.random() * 0.2;
          let width = isStorm ? 1.4 : 1.0;

          if (layer === 1) {
            ys *= 1.35;
            l *= 1.3;
            width *= 1.25;
          } else if (layer === 2) {
            ys *= 1.65;
            l *= 1.6;
            width *= 1.5;
            alpha = Math.min(0.9, alpha * 1.3);
          }

          rainDrops.push({
            x: Math.random() * (W + 250) - 100,
            y: Math.random() * H,
            l,
            xs: isStorm ? -4.5 - Math.random() * 2.5 : -1.8 - Math.random() * 1.2,
            ys,
            layer,
            alpha,
            width,
          });
        }
      }

      // 2. Snow particles
      if (mode === 'snow') {
        const count = Math.floor(Math.min(220, Math.max(80, W * 0.13)));
        snowflakes = [];
        for (let i = 0; i < count; i++) {
          const layer: 0 | 1 | 2 = Math.random() < 0.45 ? 0 : Math.random() < 0.8 ? 1 : 2;
          let r = 1.2 + Math.random() * 1.2;
          let ys = 0.8 + Math.random() * 0.8;
          let alpha = 0.3 + Math.random() * 0.25;
          if (layer === 1) {
            r = 2.2 + Math.random() * 1.4;
            ys = 1.3 + Math.random() * 0.9;
            alpha = 0.55 + Math.random() * 0.25;
          } else if (layer === 2) {
            r = 3.6 + Math.random() * 2.0;
            ys = 1.9 + Math.random() * 1.1;
            alpha = 0.75 + Math.random() * 0.22;
          }

          snowflakes.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r,
            ys,
            wobbleSpeed: 0.02 + Math.random() * 0.03,
            wobbleAmp: 1.2 + Math.random() * 2.2,
            phase: Math.random() * Math.PI * 2,
            alpha,
            layer,
          });
        }
      }

      // 3. Wind particles (autumn leaves & breeze streaks)
      if (mode === 'wind') {
        const leafColors = [
          '#ef4444', // Crimson Maple
          '#f97316', // Autumn Orange
          '#f59e0b', // Golden Amber
          '#b45309', // Burnt Ochre
          '#eab308', // Yellow Birch
        ];
        leaves = [];
        const leafCount = Math.floor(Math.min(50, Math.max(22, W * 0.025)));
        for (let i = 0; i < leafCount; i++) {
          leaves.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: 3.5 + Math.random() * 4.2,
            vy: 0.8 + Math.random() * 1.8,
            angle: Math.random() * Math.PI * 2,
            spinSpeed: (Math.random() - 0.5) * 0.06,
            flip: Math.random() * Math.PI,
            flipSpeed: 0.04 + Math.random() * 0.05,
            scale: 0.75 + Math.random() * 0.65,
            color: leafColors[Math.floor(Math.random() * leafColors.length)],
            swayPhase: Math.random() * Math.PI * 2,
          });
        }

        windStreaks = [];
        const streakCount = 18;
        for (let i = 0; i < streakCount; i++) {
          windStreaks.push({
            x: Math.random() * (W + 300) - 150,
            y: Math.random() * H,
            len: 80 + Math.random() * 160,
            vx: 9 + Math.random() * 9,
            alpha: 0.08 + Math.random() * 0.14,
            curv: (Math.random() - 0.5) * 14,
          });
        }
      }
    }

    if (weatherResizeHandler) window.removeEventListener('resize', weatherResizeHandler);
    weatherResizeHandler = resize;
    window.addEventListener('resize', resize, { passive: true });
    resize();

    if (weatherMouseHandler) window.removeEventListener('pointermove', weatherMouseHandler);
    weatherMouseHandler = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (lastMouseX !== -9999) {
        mouseVx = (mouseX - lastMouseX) * 0.4;
      }
      lastMouseX = mouseX;
    };
    window.addEventListener('pointermove', weatherMouseHandler, { passive: true });

    // Lightning Generator for Storm Mode
    function triggerLightning() {
      if (mode !== 'storm' || !canvas) return;

      const startX = Math.random() * (W * 0.8) + W * 0.1;
      const groundY = H * (0.65 + Math.random() * 0.35);
      const points: { x: number; y: number }[] = [{ x: startX, y: 0 }];

      let cx = startX;
      let cy = 0;
      const steps = 14 + Math.floor(Math.random() * 10);
      const dy = groundY / steps;

      for (let s = 1; s <= steps; s++) {
        cx += (Math.random() - 0.5) * (W * 0.06);
        cy += dy + (Math.random() - 0.5) * 15;
        points.push({ x: cx, y: cy });
      }

      // Branch forks
      const branches: { points: { x: number; y: number }[] }[] = [];
      if (points.length > 6) {
        const forkIdx = Math.floor(points.length * (0.3 + Math.random() * 0.4));
        const forkOrigin = points[forkIdx];
        const branchPts: { x: number; y: number }[] = [{ x: forkOrigin.x, y: forkOrigin.y }];
        let bx = forkOrigin.x;
        let by = forkOrigin.y;
        const bSteps = 6 + Math.floor(Math.random() * 5);
        const bDir = Math.random() < 0.5 ? -1 : 1;
        for (let b = 0; b < bSteps; b++) {
          bx += bDir * (12 + Math.random() * 25);
          by += 15 + Math.random() * 20;
          branchPts.push({ x: bx, y: by });
        }
        branches.push({ points: branchPts });
      }

      activeBolt = {
        points,
        branches,
        flashAlpha: 0.65,
        duration: 0.28,
        age: 0,
      };

      // Play synthesized thunder shockwave on lightning strike!
      setTimeout(() => {
        if (currentMode === 'storm') {
          playThunderSound();
        }
      }, 90);

      // Schedule next lightning strike in 4.5 - 8.5 seconds
      clearTimeout(stormLightningTimer);
      const nextDelay = 4500 + Math.random() * 4000;
      stormLightningTimer = setTimeout(triggerLightning, nextDelay);
    }

    if (mode === 'storm') {
      clearTimeout(stormLightningTimer);
      stormLightningTimer = setTimeout(triggerLightning, 1200);
    }

    let lastTime = performance.now();

    function frame(now: number) {
      if (currentMode === 'off') {
        stopWeather();
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx!.clearRect(0, 0, W, H);

      // ---------------------------------------------
      // 1. RENDER STORM LIGHTNING & STROBE ILLUMINATION
      // ---------------------------------------------
      if (mode === 'storm' && activeBolt) {
        activeBolt.age += dt;
        const p = activeBolt.age / activeBolt.duration;

        if (p >= 1) {
          activeBolt = null;
        } else {
          // Rapid flickering strobe pulse
          const pulse = Math.sin(p * Math.PI * 6);
          const flashAlpha = Math.max(0, activeBolt.flashAlpha * (1 - p) * (0.6 + 0.4 * pulse));

          // Ambient screen strobe
          ctx!.fillStyle = `rgba(224, 242, 254, ${flashAlpha * 0.42})`;
          ctx!.fillRect(0, 0, W, H);

          // Draw lightning bolt
          ctx!.save();
          ctx!.beginPath();
          ctx!.strokeStyle = 'rgba(255, 255, 255, 0.95)';
          ctx!.shadowColor = '#38bdf8';
          ctx!.shadowBlur = 18;
          ctx!.lineWidth = 2.4;

          const pts = activeBolt.points;
          ctx!.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx!.lineTo(pts[i].x, pts[i].y);
          }
          ctx!.stroke();

          // Draw branches
          for (const br of activeBolt.branches) {
            ctx!.beginPath();
            ctx!.lineWidth = 1.4;
            ctx!.moveTo(br.points[0].x, br.points[0].y);
            for (let i = 1; i < br.points.length; i++) {
              ctx!.lineTo(br.points[i].x, br.points[i].y);
            }
            ctx!.stroke();
          }
          ctx!.restore();
        }
      }

      // ---------------------------------------------
      // 2. RENDER RAIN & STORM DROPLETS
      // ---------------------------------------------
      if (mode === 'rain' || mode === 'storm') {
        const isStorm = mode === 'storm';
        const baseR = isStorm ? 190 : 174;
        const baseG = isStorm ? 215 : 202;
        const baseB = isStorm ? 250 : 240;
        ctx!.lineCap = 'round';

        for (let i = 0; i < rainDrops.length; i++) {
          const d = rainDrops[i];

          const dist = Math.hypot(d.x - mouseX, d.y - mouseY);
          let extraXs = 0;
          if (dist < 110) {
            extraXs = (d.x - mouseX) * 0.035;
          }

          ctx!.beginPath();
          ctx!.lineWidth = d.width;
          ctx!.strokeStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${d.alpha})`;
          ctx!.moveTo(d.x, d.y);
          ctx!.lineTo(d.x + d.xs + extraXs, d.y + d.l);
          ctx!.stroke();

          d.x += (d.xs + extraXs) * (dt * 60);
          d.y += d.ys * (dt * 60);

          if (d.y >= H - 15) {
            if ((d.layer >= 1 || isStorm) && splashes.length < 60 && Math.random() < (isStorm ? 0.65 : 0.45)) {
              const count = isStorm ? 4 : d.layer === 2 ? 3 : 2;
              for (let s = 0; s < count; s++) {
                splashes.push({
                  x: d.x,
                  y: H - 8 + Math.random() * 6,
                  vx: (Math.random() * 4 - 2) * (isStorm ? 1.6 : 1.0),
                  vy: -(Math.random() * 3 + 1.2),
                  alpha: 0.65,
                  radius: Math.random() * 1.4 + 0.6,
                });
              }
            }

            d.y = -d.l - Math.random() * 40;
            d.x = Math.random() * (W + 250) - 50;
          }
        }

        // Splashes
        for (let s = splashes.length - 1; s >= 0; s--) {
          const sp = splashes[s];
          ctx!.beginPath();
          ctx!.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${sp.alpha})`;
          ctx!.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
          ctx!.fill();

          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.vy += 0.22;
          sp.alpha -= 0.05;

          if (sp.alpha <= 0) {
            splashes.splice(s, 1);
          }
        }
      }

      // ---------------------------------------------
      // 3. RENDER SNOWFALL
      // ---------------------------------------------
      if (mode === 'snow') {
        const timeSec = now * 0.001;
        for (let i = 0; i < snowflakes.length; i++) {
          const s = snowflakes[i];

          // Gentle flutter sway
          const wobble = Math.sin(timeSec * s.wobbleSpeed * 60 + s.phase) * s.wobbleAmp;

          // Mouse proximity flutter
          const dist = Math.hypot(s.x - mouseX, s.y - mouseY);
          let pushX = 0;
          let pushY = 0;
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120;
            pushX = ((s.x - mouseX) / dist) * force * 3.5;
            pushY = ((s.y - mouseY) / dist) * force * 1.5;
          }

          ctx!.beginPath();
          ctx!.fillStyle = `rgba(240, 248, 255, ${s.alpha})`;
          if (s.layer === 2) {
            ctx!.shadowColor = '#bae6fd';
            ctx!.shadowBlur = 6;
          } else {
            ctx!.shadowBlur = 0;
          }
          ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx!.fill();

          s.x += (wobble + pushX) * (dt * 60);
          s.y += (s.ys + pushY) * (dt * 60);

          if (s.y > H + 10) {
            s.y = -s.r - Math.random() * 20;
            s.x = Math.random() * W;
          }
          if (s.x < -20) s.x = W + 10;
          if (s.x > W + 20) s.x = -10;
        }
        ctx!.shadowBlur = 0;
      }

      // ---------------------------------------------
      // 4. RENDER WIND & FLOATING AUTUMN LEAVES
      // ---------------------------------------------
      if (mode === 'wind') {
        // Wind gusts
        ctx!.lineWidth = 1.2;
        for (let i = 0; i < windStreaks.length; i++) {
          const ws = windStreaks[i];
          ctx!.beginPath();
          ctx!.strokeStyle = `rgba(226, 232, 240, ${ws.alpha})`;
          ctx!.moveTo(ws.x, ws.y);
          ctx!.quadraticCurveTo(ws.x + ws.len * 0.5, ws.y + ws.curv, ws.x + ws.len, ws.y);
          ctx!.stroke();

          ws.x += ws.vx * (dt * 60);
          if (ws.x > W + 50) {
            ws.x = -ws.len - Math.random() * 150;
            ws.y = Math.random() * H;
          }
        }

        // Autumn Leaves
        for (let i = 0; i < leaves.length; i++) {
          const lf = leaves[i];

          // 3D flutter rotation
          lf.angle += lf.spinSpeed * (dt * 60);
          lf.flip += lf.flipSpeed * (dt * 60);
          const flipScale = Math.cos(lf.flip);

          // Mouse breeze
          const dist = Math.hypot(lf.x - mouseX, lf.y - mouseY);
          let extraVx = 0;
          let extraVy = 0;
          if (dist < 140 && dist > 0) {
            const force = (140 - dist) / 140;
            extraVx = ((lf.x - mouseX) / dist) * force * 5.0 + mouseVx * 0.2;
            extraVy = ((lf.y - mouseY) / dist) * force * 3.0;
          }

          // Swaying sinusoidal drift
          const sway = Math.sin(now * 0.003 + lf.swayPhase) * 1.2;

          ctx!.save();
          ctx!.translate(lf.x, lf.y);
          ctx!.rotate(lf.angle);
          ctx!.scale(lf.scale, lf.scale * flipScale);

          // Draw organic autumn leaf shape
          ctx!.beginPath();
          ctx!.fillStyle = lf.color;
          ctx!.moveTo(0, -14);
          ctx!.bezierCurveTo(8, -10, 10, 2, 0, 16);
          ctx!.bezierCurveTo(-10, 2, -8, -10, 0, -14);
          ctx!.fill();

          // Central vein line
          ctx!.beginPath();
          ctx!.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx!.lineWidth = 0.8;
          ctx!.moveTo(0, -12);
          ctx!.lineTo(0, 13);
          ctx!.stroke();

          ctx!.restore();

          lf.x += (lf.vx + extraVx) * (dt * 60);
          lf.y += (lf.vy + sway + extraVy) * (dt * 60);

          if (lf.x > W + 40 || lf.y > H + 40) {
            lf.x = -30 - Math.random() * 60;
            lf.y = Math.random() * (H * 0.85);
          }
        }
      }

      weatherAnimId = requestAnimationFrame(frame);
    }

    cancelAnimationFrame(weatherAnimId);
    weatherAnimId = requestAnimationFrame(frame);
  }

  function stopWeather() {
    activeWeatherModeRunning = 'off';
    cancelAnimationFrame(weatherAnimId);
    weatherAnimId = 0;
    clearTimeout(stormLightningTimer);
    if (weatherResizeHandler) {
      window.removeEventListener('resize', weatherResizeHandler);
      weatherResizeHandler = null;
    }
    if (weatherMouseHandler) {
      window.removeEventListener('pointermove', weatherMouseHandler);
      weatherMouseHandler = null;
    }
    if (canvas) {
      canvas.classList.remove('opacity-90');
      canvas.classList.add('opacity-0');
      setTimeout(() => {
        if (activeWeatherModeRunning === 'off') {
          canvas.style.display = 'none';
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }, 500);
    }
  }

  const setWeather = (mode: WeatherMode) => {
    currentMode = mode;
    localStorage.setItem('dawn_weather_mode', mode);
    localStorage.setItem('dawn_real_rain', mode === 'rain' ? 'true' : 'false');
    updateUI(mode);

    const detail = { mode };
    window.dispatchEvent(new CustomEvent('dawn:weather-state', { detail, bubbles: true }));
    document.dispatchEvent(new CustomEvent('dawn:weather-state', { detail, bubbles: true }));
    document.dispatchEvent(new CustomEvent('dawn:rain-state', { detail: { enabled: mode === 'rain' }, bubbles: true }));

    if (mode === 'off') {
      stopWeather();
      stopRainAudio();
    } else {
      startWeather(mode);
      if (mode === 'rain' || mode === 'storm') startRainAudio(mode); else stopRainAudio();
      if (mode === 'storm') {
        setTimeout(() => playThunderSound(), 180);
      }
    }
  };

  const cycleWeather = () => {
    const cycleOrder: WeatherMode[] = ['off', 'rain', 'snow', 'storm', 'wind'];
    const curIdx = cycleOrder.indexOf(currentMode);
    const nextMode = cycleOrder[(curIdx + 1) % cycleOrder.length];
    setWeather(nextMode);
  };

  if (btn) {
    btn.onclick = (e) => {
      e.preventDefault();
      const ctx = getDawnAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      playTactileButtonClick();
      cycleWeather();
    };
  }

  // Event bus listeners
  window.removeEventListener('dawn:toggle-weather', (window as any).__dawn_weather_toggle_listener);
  (window as any).__dawn_weather_toggle_listener = () => cycleWeather();
  window.addEventListener('dawn:toggle-weather', (window as any).__dawn_weather_toggle_listener);

  window.removeEventListener('dawn:set-weather', (window as any).__dawn_weather_set_listener);
  (window as any).__dawn_weather_set_listener = (e: CustomEvent<{ mode: WeatherMode }>) => {
    if (e.detail?.mode) setWeather(e.detail.mode);
  };
  window.addEventListener('dawn:set-weather', (window as any).__dawn_weather_set_listener as any);

  // Backward-compatibility with legacy rain toggle event
  window.removeEventListener('dawn:toggle-rain', (window as any).__dawn_rain_toggle_listener);
  (window as any).__dawn_rain_toggle_listener = () => {
    setWeather(currentMode === 'rain' ? 'off' : 'rain');
  };
  window.addEventListener('dawn:toggle-rain', (window as any).__dawn_rain_toggle_listener);

  if (currentMode !== 'off') {
    if (activeWeatherModeRunning !== currentMode || weatherAnimId === 0) {
      startWeather(currentMode);
    }
    if (currentMode === 'rain' || currentMode === 'storm') startRainAudio(currentMode);
  } else {
    if (activeWeatherModeRunning !== 'off') {
      stopWeather();
    }
  }
}

// Backward-compatibility alias
export const setupRealRain = setupWeatherEngine;

function install(): void {
  addCopyButtons();
  setupReadingProgress();
  setupKeymap();
  setupLinkPreview();
  setupSpiderCanvas();
  setupMechanicalKeyboardSound();
  setupWeatherEngine();
}

install();
document.addEventListener('astro:page-load', install);