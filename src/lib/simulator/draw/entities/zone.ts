/**
 * Zone: a dashed floor boundary with an optional label written on the floor.
 */
import { floorXMatrix, isoProject as iso, round } from '../iso';
import { boundsOf, roundedPolygonPath } from '../paths';
import { INK } from '../palette';
import type { EntityRender } from '../types';

export interface ZoneProps {
  type: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  label: string;
  opacity: number;
}

export const ZONE_DEFAULTS = { label: ``, opacity: 1 };

export function renderZone(e: ZoneProps): EntityRender {
  const corners = [iso(e.x0, e.y0), iso(e.x0, e.y1), iso(e.x1, e.y1), iso(e.x1, e.y0)];
  const label = e.label
    ? `<text transform="${floorXMatrix(e.x0 + 0.9, e.y0 + 0.55, 0)}" font-size="10.5" font-weight="800" letter-spacing="1.6" fill="#6f6961">${e.label}</text>`
    : ``;
  return {
    body: `
      <g opacity="${round(e.opacity)}">
        <path d="${roundedPolygonPath(corners, 8)}" fill="#fffaf2" fill-opacity=".55" stroke="${INK}" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="6 5"/>
        ${label}
      </g>`,
    over: ``,
    poly: corners,
    bounds: boundsOf(corners, [6, 6, 6, 6]),
  };
}
