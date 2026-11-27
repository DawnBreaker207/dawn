/**
 * Queue: a line of message dots; fractional `n` grows the newest one in.
 */
import { clamp01, isoProject as iso, round, type Point } from '../iso';
import { boundsOf } from '../paths';
import { INK } from '../palette';
import type { EntityRender } from '../types';

export interface QueueProps {
  type: string;
  x: number;
  y: number;
  /** Number of messages (fractional while animating). */
  n: number;
  /** Spacing between messages (world units). */
  gap: number;
  /** Direction the queue extends in (world units). */
  dir: [number, number];
  opacity: number;
  color: string;
}

export const QUEUE_DEFAULTS = { n: 0, gap: 1, dir: [0, -1], opacity: 1, color: `#efb041` };

export function renderQueue(e: QueueProps): EntityRender {
  let body = ``;
  const centers: Point[] = [];
  const count = Math.ceil(e.n);
  for (let i = count - 1; i >= 0; i--) {
    const alpha = clamp01(e.n - i);
    const [sx, sy] = iso(e.x + e.dir[0] * e.gap * i, e.y + e.dir[1] * e.gap * i, 0);
    centers.push([sx, sy]);
    body += `<g opacity="${round(alpha * e.opacity)}" transform="translate(${round(sx)} ${round(sy - (1 - alpha) * 8)}) scale(${round(0.5 + alpha * 0.5)})">
      <circle r="4.6" fill="${e.color}" stroke="${INK}" stroke-width="1.5"/></g>`;
  }
  return { body, over: ``, poly: null, bounds: centers.length ? boundsOf(centers, [8, 8, 8, 8]) : [0, 0, 0, 0] };
}
