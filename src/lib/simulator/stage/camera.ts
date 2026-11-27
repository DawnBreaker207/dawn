/**
 * Stage camera: the planned camera rect, the user's zoom/pan on top of it,
 * the animated blend between them, and applying the result to the SVG
 * (viewBox, HUD transform, grid fade).
 */
import { round } from '../draw';
import type { ZoomTarget } from './gestures';
import { EASE, clamp01, lerp } from './motion';
import type { Cam } from './types';

/** User zoom: scale `k` around world point (cx, cy). */
export interface ZoomView {
  k: number;
  cx: number;
  cy: number;
}

interface CamBlend {
  from: Cam | null;
  start: number;
  dur: number;
}

const ZOOM_BLEND_MS = 360;

export class StageCamera implements ZoomTarget {
  /** Camera planned for the current step (before user zoom). */
  cam!: Cam;
  view: ZoomView | null = null;
  blend: CamBlend | null = null;
  onView: ((zoomed: boolean) => void) | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly svg: SVGSVGElement,
    private readonly hud: SVGGElement,
    private readonly fade: SVGRadialGradientElement,
  ) {}

  /** Camera actually shown: planned cam, narrowed by user zoom, blended during zoom animations. */
  shown(cam: Cam = this.cam): Cam {
    let shown = cam;
    if (this.view) {
      const w = cam.w / this.view.k;
      const h = cam.h / this.view.k;
      shown = { x: this.view.cx - w / 2, y: this.view.cy - h / 2, w, h };
    }
    const blend = this.blend;
    if (!blend) return shown;
    const k = EASE.inOut(clamp01((performance.now() - blend.start) / blend.dur));
    if (k >= 1) {
      this.blend = null;
      return shown;
    }
    // A blend is only created with a starting cam.
    const from = blend.from as Cam;
    return {
      x: lerp(from.x, shown.x, k),
      y: lerp(from.y, shown.y, k),
      w: lerp(from.w, shown.w, k),
      h: lerp(from.h, shown.h, k),
    };
  }

  /** Sets the planned camera and applies the shown camera to the SVG. */
  set(cam: Cam): void {
    this.cam = cam;
    const shown = this.shown(cam);
    this.svg.setAttribute('viewBox', `${round(shown.x)} ${round(shown.y)} ${round(shown.w)} ${round(shown.h)}`);
    const hudScale = shown.w / Math.max(1, this.host.clientWidth);
    this.hud.setAttribute('transform', `translate(${round(shown.x)} ${round(shown.y)}) scale(${hudScale.toFixed(5)})`);
    // Keep the grid fade centered on the view.
    const cx = shown.x + shown.w / 2;
    const cy = shown.y + shown.h / 2;
    this.fade.setAttribute('cx', String(round(cx)));
    this.fade.setAttribute('cy', String(round(cy)));
    this.fade.setAttribute('r', String(round(shown.w * 0.56)));
    this.fade.setAttribute(
      'gradientTransform',
      `translate(${round(cx)} ${round(cy)}) scale(1 0.6) translate(${round(-cx)} ${round(-cy)})`,
    );
  }

  private clampView(view: ZoomView | null): ZoomView | null {
    if (!view) return null;
    const cam = this.cam;
    const pxPerUnit = this.host.clientWidth / cam.w;
    const maxK = Math.max(1.5, Math.min(6, 3.2 / pxPerUnit));
    const k = Math.max(1, Math.min(maxK, view.k));
    if (k <= 1.001) return null;
    const w = cam.w / k;
    const h = cam.h / k;
    return {
      k,
      cx: Math.max(cam.x + w / 2, Math.min(cam.x + cam.w - w / 2, view.cx)),
      cy: Math.max(cam.y + h / 2, Math.min(cam.y + cam.h - h / 2, view.cy)),
    };
  }

  private setView(view: ZoomView | null, animate = false): void {
    const wasZoomed = !!this.view;
    const from = animate ? { ...this.shown() } : null;
    this.view = this.clampView(view);
    this.blend = animate ? { from, start: performance.now(), dur: ZOOM_BLEND_MS } : null;
    this.set(this.cam);
    if (wasZoomed !== !!this.view) {
      this.host.classList.toggle('is-zoomed', !!this.view);
      this.onView?.(!!this.view);
    }
  }

  /** Drops user zoom instantly (no animation). */
  clearView(): void {
    if (!this.view && !this.blend) return;
    const wasZoomed = !!this.view;
    this.view = null;
    this.blend = null;
    if (wasZoomed) {
      this.host.classList.remove('is-zoomed');
      this.onView?.(false);
    }
  }

  /** Zooms by `factor` keeping the host-fraction point (fx, fy) fixed. */
  zoomAt(fx: number, fy: number, factor: number): void {
    const shown = this.shown();
    const wx = shown.x + fx * shown.w;
    const wy = shown.y + fy * shown.h;
    const k = (this.view ? this.view.k : 1) * factor;
    const w = this.cam.w / k;
    const h = this.cam.h / k;
    this.setView({ k, cx: wx - fx * w + w / 2, cy: wy - fy * h + h / 2 });
  }

  /** Pans by a fraction of the host size (only while zoomed). */
  panBy(dx: number, dy: number): void {
    if (!this.view) return;
    const shown = this.shown();
    this.setView({ ...this.view, cx: this.view.cx - dx * shown.w, cy: this.view.cy - dy * shown.h });
  }

  /** Double-click / double-tap: zoom 2× at the point, or back out. */
  toggleZoomAt(fx: number, fy: number): void {
    if (this.view) {
      this.setView(null, true);
      return;
    }
    const cam = this.cam;
    const w = cam.w / 2;
    const h = cam.h / 2;
    const wx = cam.x + fx * cam.w;
    const wy = cam.y + fy * cam.h;
    this.setView({ k: 2, cx: wx - fx * w + w / 2, cy: wy - fy * h + h / 2 }, true);
  }

  /** Animates back to the planned (unzoomed) camera. */
  fit(): void {
    if (this.view) this.setView(null, true);
  }
}
