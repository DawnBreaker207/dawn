/**
 * Link-label placement: picks a spot beside a link path that avoids entity
 * bodies, tag pills, other labels and the link lines themselves.
 */
import { overlapArea, pointAlongPath, polygonIntersectsRect, type Point, type Rect } from './geometry';

/** Default label pill height (px). */
export const LABEL_HEIGHT = 21;
/** Gap between a label pill and its link line (px). */
const LABEL_GAP = 7;
/** Positions along the link (relative to the preferred `t`) tried in order. */
const T_SHIFTS = [0, -0.1, 0.1, -0.2, 0.2, -0.3, 0.3, -0.4, 0.4];

export interface Obstacles {
  polys: Point[][];
  boxes: Rect[];
}

export interface LabelSpot {
  /** Candidate id; pass back as `side` to pin the same spot later. */
  side: number;
  rect: Rect;
  cx: number;
  cy: number;
  cost: number;
}

interface ObstacleSource {
  type: string;
  cpu?: number;
  tags?: unknown[];
  pills?: string;
  label?: unknown;
}

/**
 * Registers an entity's footprint (and its pill / caption areas) as label
 * obstacles. Zones and panels never block labels.
 */
export function addEntityObstacles(ent: ObstacleSource, poly: Point[] | null, bounds: Rect | null, acc: Obstacles): void {
  if (!bounds || ent.type === 'zone' || ent.type === 'panel') return;
  if (!poly || poly.length < 3) {
    acc.boxes.push(bounds);
    return;
  }
  acc.polys.push(poly);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of poly) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const pillCount = +((ent.cpu as number) >= 0) + (ent.tags ? ent.tags.length : 0);
  const pillsBelow = ent.pills === 'below';
  if (pillCount && !pillsBelow) acc.boxes.push([bounds[0], bounds[1], bounds[2], minY + 4]);
  if ((pillCount && pillsBelow) || ((ent.type === 'crowd' || ent.type === 'device') && ent.label)) {
    acc.boxes.push([bounds[0], maxY - 4, bounds[2], bounds[3]]);
  }
  if (ent.type === 'db' && ent.label) acc.boxes.push([maxX - 4, minY, bounds[2], maxY]);
}

/** Penalty for placing a label at `rect`; lower is better. */
export function labelCost(rect: Rect, obstacles: Obstacles, linePoints: Point[], placed: Rect[] = []): number {
  let cost = 0;
  for (const poly of obstacles.polys) if (polygonIntersectsRect(poly, rect)) cost += 170;
  for (const box of obstacles.boxes) {
    const area = overlapArea(rect, box);
    if (area) cost += 90 + area / 6;
  }
  for (const other of placed) {
    const area = overlapArea([rect[0] - 4, rect[1] - 4, rect[2] + 4, rect[3] + 4], other);
    if (area) cost += 90 + area / 3;
  }
  const padded: Rect = [rect[0] - 5, rect[1] - 5, rect[2] + 5, rect[3] + 5];
  for (const [x, y] of linePoints) if (x > padded[0] && x < padded[2] && y > padded[1] && y < padded[3]) cost += 18;
  return cost;
}

/**
 * Chooses the cheapest label rect of size w×h beside the polyline `pts`,
 * starting at fraction `t` and sliding along the link. With `side >= 0`
 * only that candidate is considered (falls back to a full search if gone).
 */
export function placeLabel(
  pts: Point[],
  t: number,
  w: number,
  cost: (rect: Rect) => number,
  side = -1,
  h = LABEL_HEIGHT,
): LabelSpot {
  const candidates: { id: number; rect: Rect; cost: number }[] = [];
  for (const [k, shift] of T_SHIFTS.entries()) {
    const at = t + shift;
    if (k && (at < 0.12 || at > 0.88)) continue;
    const { x, y, dx, dy } = pointAlongPath(pts, at);
    // Near offsets on either side of the line, chosen by line direction.
    const near: Point[] =
      Math.abs(dy) < 0.12
        ? [
            [0, -(h / 2 + LABEL_GAP + 3)],
            [0, h / 2 + LABEL_GAP + 3],
          ]
        : Math.abs(dx) < 0.12
          ? [
              [w / 2 + LABEL_GAP + 3, 0],
              [-(w / 2 + LABEL_GAP + 3), 0],
            ]
          : dx * dy > 0
            ? [
                [w / 2 + LABEL_GAP, -(h / 2 + LABEL_GAP)],
                [-(w / 2 + LABEL_GAP), h / 2 + LABEL_GAP],
              ]
            : [
                [-(w / 2 + LABEL_GAP), -(h / 2 + LABEL_GAP)],
                [w / 2 + LABEL_GAP, h / 2 + LABEL_GAP],
              ];
    const far = near.map(([ox, oy]): Point => (oy ? [ox, oy + Math.sign(oy) * (h + 9)] : [ox + Math.sign(ox) * 26, oy]));
    [...near, ...far].forEach(([ox, oy], o) => {
      const id = k * 4 + o;
      const rect: Rect = [x + ox - w / 2, y + oy - h / 2, x + ox + w / 2, y + oy + h / 2];
      if (side < 0 || side === id) {
        candidates.push({
          id,
          rect,
          // Prefer the requested t, the first side, and near over far offsets.
          cost: side < 0 ? cost(rect) + Math.abs(shift) * 90 + (o % 2) * 2 + (o > 1 ? 22 : 0) : 0,
        });
      }
    });
  }
  if (!candidates.length) return placeLabel(pts, t, w, cost, -1, h);
  const best = candidates.reduce((a, b) => (b.cost < a.cost ? b : a));
  const r = best.rect;
  return { side: best.id, rect: r, cx: (r[0] + r[2]) / 2, cy: (r[1] + r[3]) / 2, cost: best.cost };
}
