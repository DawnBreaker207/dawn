/**
 * Rounded isometric prisms (the body of blocks, slabs and devices) and
 * simple shaded boxes.
 */
import { isoProject as iso, round, type Point } from './iso';
import { INK } from './palette';
import { roundedPolygonPath, smoothPath } from './paths';

export interface PrismSpec {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Height (px). */
  h: number;
  /** Corner radius of the top face. */
  radius?: number;
}

/**
 * Screen geometry of a prism. Vertices are named by their screen position on
 * the top face (T/R/B/L = top/right/bottom/left); `*d` are the matching
 * vertices on the ground.
 */
export interface Prism {
  T: Point;
  R: Point;
  B: Point;
  L: Point;
  Rd: Point;
  Bd: Point;
  Ld: Point;
  /** Screen y of the top-face center. */
  ty: number;
  /** Visible silhouette polygon. */
  outline: Point[];
  /** Rounded silhouette path. */
  sil: string;
  top: string;
  /** Highlight blob on the top face. */
  sheen: string;
  /** Right (front) face path. */
  right: string;
  /** Front edge of the top face. */
  bevel: string;
}

export function isoPrism({ x0, x1, y0, y1, h, radius = 9 }: PrismSpec): Prism {
  const T = iso(x0, y1, h);
  const R = iso(x1, y1, h);
  const B = iso(x1, y0, h);
  const L = iso(x0, y0, h);
  const Rd = iso(x1, y1, 0);
  const Bd = iso(x1, y0, 0);
  const Ld = iso(x0, y0, 0);
  const sideRadius = Math.max(1, Math.min(radius, h / 2 - 0.5));
  const ty = iso((x0 + x1) / 2, (y0 + y1) / 2, h)[1];
  const outline: Point[] = [T, R, Rd, Bd, Ld, L];
  return {
    T,
    R,
    B,
    L,
    Rd,
    Bd,
    Ld,
    ty,
    outline,
    sil: roundedPolygonPath(outline, [radius + 1, sideRadius, sideRadius, radius + 3, sideRadius, sideRadius]),
    top: roundedPolygonPath([T, R, B, L], [radius + 1, sideRadius, 6, sideRadius]),
    sheen: roundedPolygonPath(
      [T, R, B, L].map(([x, y]): Point => [x, y - 3 + (y - ty) * -0.25]),
      [radius + 1, sideRadius, 6, sideRadius],
    ),
    right: roundedPolygonPath([B, R, Rd, Bd], [6, sideRadius, sideRadius, radius + 3]),
    bevel: smoothPath([L, B, R], 8),
  };
}

/** Shaded faces + outline of a prism filled with block color `color`. */
export function prismFaces(p: Prism, color: string, { stroke = INK, sw = 1.9 }: { stroke?: string; sw?: number } = {}): string {
  return `
    <path d="${p.sil}" fill="url(#g-${color}-side)"/>
    <path d="${p.right}" fill="#3a2a14" opacity=".05"/>
    <path d="${p.top}" fill="url(#g-${color}-top)"/>
    <path d="${p.sheen}" fill="#fff" opacity=".22" filter="url(#blur-sm)"/>
    <path d="${p.bevel}" transform="translate(0 1.4)" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.6" stroke-linecap="round"/>
    <path d="${p.bevel}" transform="translate(0 3.4)" fill="none" stroke="#5a4123" stroke-opacity=".07" stroke-width="2.4" stroke-linecap="round"/>
    <path d="${p.sil}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

/** Soft ground shadow; it drops further and fades as the prism lifts. */
export function dropShadow(p: Prism, h: number, lift: number, alpha: number): string {
  const offset = Math.min(9, 3 + h * 0.15);
  const fade = 1 - Math.min(1, lift / 140) * 0.85;
  return `<path d="${p.sil}" transform="translate(0 ${round(offset + lift)})" fill="#6b5236" opacity="${round(alpha * fade)}" filter="url(#blur-lg)"/>`;
}

export interface BoxSpec {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}

/** Flat-shaded box with rounded faces (device screens, keyboards). */
export function isoBox(
  { x0, x1, y0, y1, z0, z1 }: BoxSpec,
  { top, front, left, sw = 1.5, r = 2 }: { top: string; front: string; left: string; sw?: number; r?: number },
): string {
  const topFace = [iso(x0, y0, z1), iso(x0, y1, z1), iso(x1, y1, z1), iso(x1, y0, z1)];
  const frontFace = [iso(x1, y0, z1), iso(x1, y1, z1), iso(x1, y1, z0), iso(x1, y0, z0)];
  const leftFace = [iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y0, z0), iso(x0, y0, z0)];
  const outline = [iso(x0, y0, z1), iso(x0, y1, z1), iso(x1, y1, z1), iso(x1, y1, z0), iso(x1, y0, z0), iso(x0, y0, z0)];
  return `
    <path d="${roundedPolygonPath(leftFace, r)}" fill="${left}"/>
    <path d="${roundedPolygonPath(frontFace, r)}" fill="${front}"/>
    <path d="${roundedPolygonPath(topFace, r)}" fill="${top}"/>
    <path d="${roundedPolygonPath(outline, r)}" fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}
