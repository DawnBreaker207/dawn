/**
 * Ghost: dashed wireframe of a block that is gone (or not there yet).
 */
import { isoProject as iso, round, type Point } from '../iso';
import { boundsOf } from '../paths';
import { buildPill } from '../pills';
import { INK } from '../palette';
import { textWidth } from '../text';
import type { EntityRender } from '../types';

export interface GhostProps {
  type: string;
  x: number;
  y: number;
  s: number;
  h: number;
  opacity: number;
  label: string;
}

export const GHOST_DEFAULTS = { s: 6, h: 90, opacity: 1, label: `` };

export function renderGhost(e: GhostProps): EntityRender {
  const x0 = e.x - e.s / 2;
  const x1 = e.x + e.s / 2;
  const y0 = e.y - e.s / 2;
  const y1 = e.y + e.s / 2;
  /** Dashed edge; hidden (back) edges are fainter. */
  const edge = (a: Point, b: Point, hidden?: boolean) =>
    `<path d="M${a[0]},${a[1]} L${b[0]},${b[1]}" stroke="${INK}" stroke-opacity="${hidden ? 0.22 : 0.55}" stroke-width="1.4" stroke-dasharray="5 4" fill="none"/>`;
  const top = [iso(x0, y0, e.h), iso(x0, y1, e.h), iso(x1, y1, e.h), iso(x1, y0, e.h)];
  const ground = [iso(x0, y0, 0), iso(x0, y1, 0), iso(x1, y1, 0), iso(x1, y0, 0)];
  const edges = [
    edge(top[0], top[1]),
    edge(top[1], top[2]),
    edge(top[2], top[3]),
    edge(top[3], top[0]),
    edge(ground[0], ground[3]),
    edge(ground[3], ground[2]),
    edge(top[0], ground[0]),
    edge(top[2], ground[2]),
    edge(top[3], ground[3]),
    edge(ground[0], ground[1], true),
    edge(ground[1], ground[2], true),
    edge(top[1], ground[1], true),
  ].join(``);
  const [px, py] = top[2];
  const pillW = textWidth(e.label, 10.5) + 33;
  return {
    body: `<g opacity="${round(e.opacity)}">${edges}</g>`,
    over: e.label
      ? `<g opacity="${round(e.opacity)}">${buildPill(px + 14 + pillW / 2, py + 18, e.label, { tone: `gray`, icon: `alert` })}</g>`
      : ``,
    poly: null,
    bounds: boundsOf([...top, ...ground, [px + 22 + pillW, py]], [8, 30, 8, 8]),
  };
}
