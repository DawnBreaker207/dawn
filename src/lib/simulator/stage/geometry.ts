/**
 * 2D screen-space geometry helpers used by the stage (label placement,
 * card docking, path sampling).
 */

export type Point = [number, number];
/** Axis-aligned rect as [minX, minY, maxX, maxY]. */
export type Rect = [number, number, number, number];

/** Area of the intersection of two rects (0 when disjoint). */
export function overlapArea(a: Rect, b: Rect): number {
  return (
    Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) *
    Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]))
  );
}

/** Strict rect intersection test. */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
}

/** Even-odd ray-casting point-in-polygon test. */
export function pointInPolygon(x: number, y: number, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const orientation = (a: Point, b: Point, c: Point) =>
  Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));

/** True when segment ab properly crosses segment cd. */
export function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  return orientation(a, b, c) !== orientation(a, b, d) && orientation(c, d, a) !== orientation(c, d, b);
}

/** True when a polygon and a rect overlap (vertex containment or edge crossing). */
export function polygonIntersectsRect(poly: Point[], rect: Rect): boolean {
  if (poly.some(([x, y]) => x > rect[0] && x < rect[2] && y > rect[1] && y < rect[3])) return true;
  const corners: Point[] = [
    [rect[0], rect[1]],
    [rect[2], rect[1]],
    [rect[2], rect[3]],
    [rect[0], rect[3]],
  ];
  if (corners.some(([x, y]) => pointInPolygon(x, y, poly))) return true;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    for (let k = 0; k < 4; k++) if (segmentsCross(a, b, corners[k], corners[(k + 1) % 4])) return true;
  }
  return false;
}

/** Point and unit direction at fraction `t` (0..1) of a polyline's length. */
export function pointAlongPath(pts: Point[], t: number): { x: number; y: number; dx: number; dy: number } {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    lengths.push(len);
    total += len;
  }
  let remaining = total * t;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] ? Math.min(1, remaining / lengths[i]) : 0;
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      return {
        x: x0 + (x1 - x0) * f,
        y: y0 + (y1 - y0) * f,
        dx: (x1 - x0) / (lengths[i] || 1),
        dy: (y1 - y0) / (lengths[i] || 1),
      };
    }
    remaining -= lengths[i];
  }
  return { x: pts[0][0], y: pts[0][1], dx: 1, dy: 0 };
}

/** Resamples a polyline into points roughly `step` px apart (endpoints included). */
export function samplePath(pts: Point[], step = 12): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 0; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  return out;
}
