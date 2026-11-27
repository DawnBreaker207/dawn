/**
 * Pointer / touch / wheel gestures for the stage: pinch & ctrl-wheel zoom,
 * drag & wheel pan while zoomed, double-click / double-tap zoom toggle and
 * horizontal swipe for step navigation.
 */

/** Camera controls driven by gestures (fractions are of the host box). */
export interface ZoomTarget {
  /** Non-null while zoomed in. */
  readonly view: unknown;
  zoomAt(fx: number, fy: number, factor: number): void;
  panBy(dx: number, dy: number): void;
  toggleZoomAt(fx: number, fy: number): void;
}

const MOVE_SLOP = 8;
const TAP_MS = 300;
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_RADIUS = 40;
const SWIPE_MS = 700;
const SWIPE_MIN = 50;

interface Pinch {
  d: number;
  x: number;
  y: number;
}

type TouchState =
  | ({ mode: 'two'; pinched: boolean } & Pinch)
  | { mode: 'one'; x: number; y: number; x0: number; y0: number; t0: number; moved: boolean; pinched: boolean };

/** `onSwipe(1)` = swipe left (next), `onSwipe(-1)` = swipe right (previous). */
export function attachGestures(host: HTMLElement, stage: ZoomTarget, onSwipe: (dir: number) => void): void {
  const rect = () => host.getBoundingClientRect();
  /** Client coords → fraction (0..1) of the host box. */
  const toFraction = (x: number, y: number): [number, number] => {
    const r = rect();
    return [(x - r.left) / r.width, (y - r.top) / r.height];
  };
  const pinchOf = (t: TouchList): Pinch => ({
    d: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY),
    x: (t[0].clientX + t[1].clientX) / 2,
    y: (t[0].clientY + t[1].clientY) / 2,
  });

  let touch: TouchState | null = null;
  let lastTap = { at: 0, x: 0, y: 0 };

  host.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
        touch = { mode: 'two', ...pinchOf(e.touches), pinched: true };
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        touch = {
          mode: 'one',
          x: t.clientX,
          y: t.clientY,
          x0: t.clientX,
          y0: t.clientY,
          t0: performance.now(),
          moved: false,
          pinched: false,
        };
      }
    },
    { passive: false },
  );

  host.addEventListener(
    'touchmove',
    (e) => {
      if (!touch) return;
      if (e.touches.length >= 2) {
        e.preventDefault();
        const pinch = pinchOf(e.touches);
        if (touch.mode !== 'two') touch = { mode: 'two', ...pinch, pinched: true };
        const [fx, fy] = toFraction(pinch.x, pinch.y);
        if (touch.d > 0) stage.zoomAt(fx, fy, pinch.d / touch.d);
        const r = rect();
        stage.panBy((pinch.x - touch.x) / r.width, (pinch.y - touch.y) / r.height);
        Object.assign(touch, { d: pinch.d, x: pinch.x, y: pinch.y });
        return;
      }
      if (touch.mode !== 'one') return;
      const t = e.touches[0];
      if (Math.hypot(t.clientX - touch.x0, t.clientY - touch.y0) > MOVE_SLOP) touch.moved = true;
      if (stage.view) {
        e.preventDefault();
        const r = rect();
        stage.panBy((t.clientX - touch.x) / r.width, (t.clientY - touch.y) / r.height);
      }
      touch.x = t.clientX;
      touch.y = t.clientY;
    },
    { passive: false },
  );

  host.addEventListener('touchend', (e) => {
    if (!touch) return;
    if (e.touches.length === 1 && touch.mode === 'two') {
      // Pinch released to one finger: continue as a (non-tap) pan.
      const t = e.touches[0];
      touch = { mode: 'one', x: t.clientX, y: t.clientY, x0: t.clientX, y0: t.clientY, t0: 0, moved: true, pinched: true };
      return;
    }
    if (e.touches.length) return;
    const now = performance.now();
    if (touch.mode === 'one' && !touch.pinched) {
      const t = e.changedTouches[0];
      const dx = t.clientX - touch.x0;
      const dy = t.clientY - touch.y0;
      if (!stage.view && now - touch.t0 < SWIPE_MS && Math.abs(dx) > SWIPE_MIN && Math.abs(dy) < Math.abs(dx) * 0.6) {
        onSwipe(dx < 0 ? 1 : -1);
      } else if (!touch.moved && now - touch.t0 < TAP_MS) {
        const nearLastTap = Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) < DOUBLE_TAP_RADIUS;
        if (now - lastTap.at < DOUBLE_TAP_MS && nearLastTap) {
          e.preventDefault();
          const [fx, fy] = toFraction(t.clientX, t.clientY);
          stage.toggleZoomAt(fx, fy);
          lastTap = { at: 0, x: 0, y: 0 };
        } else lastTap = { at: now, x: t.clientX, y: t.clientY };
      }
    }
    touch = null;
  });

  host.addEventListener('touchcancel', () => (touch = null));

  // Mouse drag-to-pan (only while zoomed).
  let drag: { x: number; y: number } | null = null;
  host.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button === 0 && stage.view) {
      drag = { x: e.clientX, y: e.clientY };
      host.setPointerCapture(e.pointerId);
      host.classList.add('is-dragging');
    }
  });
  host.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = rect();
    stage.panBy((e.clientX - drag.x) / r.width, (e.clientY - drag.y) / r.height);
    drag = { x: e.clientX, y: e.clientY };
  });
  const endDrag = () => {
    drag = null;
    host.classList.remove('is-dragging');
  };
  host.addEventListener('pointerup', endDrag);
  host.addEventListener('pointercancel', endDrag);

  host.addEventListener('dblclick', (e) => {
    const [fx, fy] = toFraction(e.clientX, e.clientY);
    stage.toggleZoomAt(fx, fy);
  });

  host.addEventListener(
    'wheel',
    (e) => {
      const unit = e.deltaMode === 1 ? 16 : 1; // line mode → px
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const [fx, fy] = toFraction(e.clientX, e.clientY);
        stage.zoomAt(fx, fy, Math.exp(-e.deltaY * unit * 0.01));
      } else if (stage.view) {
        e.preventDefault();
        const r = rect();
        stage.panBy((-e.deltaX * unit) / r.width, (-e.deltaY * unit) / r.height);
      }
    },
    { passive: false },
  );
}
