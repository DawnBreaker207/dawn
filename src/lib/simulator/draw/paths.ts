/**
 * SVG path builders and polyline helpers (screen space).
 */
import { round, type Point, type Rect } from './iso';

/**
 * Closed polygon path with rounded corners. `radius` is one value for all
 * corners or one per vertex (clamped to half of each adjacent edge).
 */
export function roundedPolygonPath(pts: Point[], radius: number | number[]): string {
  const n = pts.length;
  const radiusAt = (i: number) => (Array.isArray(radius) ? radius[i] : radius);
  /** Point `r` px from `from` toward `to` (at most half the edge). */
  const toward = (from: Point, to: Point, r: number): Point => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.hypot(dx, dy) || 1;
    const k = Math.min(r, len / 2) / len;
    return [from[0] + dx * k, from[1] + dy * k];
  };
  let d = ``;
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const a = toward(cur, prev, radiusAt(i));
    const b = toward(cur, next, radiusAt(i));
    d += `${i === 0 ? `M` : `L`}${round(a[0])},${round(a[1])} Q${round(cur[0])},${round(cur[1])} ${round(b[0])},${round(b[1])} `;
  }
  return d + `Z`;
}

/** Open polyline path with rounded joints (radius ≤ half of each adjacent segment). */
export function smoothPath(pts: Point[], radius = 10): string {
  let d = `M${round(pts[0][0])},${round(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const l1 = Math.hypot(x1 - x0, y1 - y0);
    const l2 = Math.hypot(x2 - x1, y2 - y1);
    if (l1 < 0.01 || l2 < 0.01) continue;
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const ax = x1 + ((x0 - x1) / l1) * r;
    const ay = y1 + ((y0 - y1) / l1) * r;
    const bx = x1 + ((x2 - x1) / l2) * r;
    const by = y1 + ((y2 - y1) / l2) * r;
    d += ` L${round(ax)},${round(ay)} Q${round(x1)},${round(y1)} ${round(bx)},${round(by)}`;
  }
  const last = pts[pts.length - 1];
  return d + ` L${round(last[0])},${round(last[1])}`;
}

/** Point-in-convex-polygon test (boundary counts as inside). */
function insideConvex([x, y]: Point, poly: Point[]): boolean {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[(i + 1) % poly.length];
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (!(Math.abs(cross) < 1e-9)) {
      if (sign === 0) sign = Math.sign(cross);
      else if (Math.sign(cross) !== sign) return false;
    }
  }
  return true;
}

/**
 * Cuts the start of a polyline that lies inside `poly` (an entity outline),
 * leaving a `gap` px clearance, so links start at the entity's edge.
 */
export function trimPathStart(pts: Point[], poly: Point[] | null | undefined, gap: number): Point[] {
  if (!poly || !insideConvex(pts[0], poly)) return pts;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (insideConvex(b, poly)) continue;
    // Binary-search the edge crossing on segment a→b.
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 30; k++) {
      const mid = (lo + hi) / 2;
      if (insideConvex([a[0] + (b[0] - a[0]) * mid, a[1] + (b[1] - a[1]) * mid], poly)) lo = mid;
      else hi = mid;
    }
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const t = Math.min(1, hi + gap / len);
    return [[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], ...pts.slice(i + 1)];
  }
  return pts;
}

/** Same as trimPathStart, for the end of the polyline. */
export const trimPathEnd = (pts: Point[], poly: Point[] | null | undefined, gap: number): Point[] =>
  trimPathStart([...pts].reverse(), poly, gap).reverse();

/** Bounding rect of points, padded by [left, top, right, bottom]. */
export function boundsOf(pts: Point[], pad: [number, number, number, number] = [0, 0, 0, 0]): Rect {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [Math.min(...xs) - pad[0], Math.min(...ys) - pad[1], Math.max(...xs) + pad[2], Math.max(...ys) + pad[3]];
}
