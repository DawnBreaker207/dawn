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

function install(): void {
  addCopyButtons();
  setupReadingProgress();
  setupKeymap();
  setupSpiderCanvas();
}

install();
document.addEventListener('astro:page-load', install);