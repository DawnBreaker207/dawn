/**
 * Isometric entity drawing — public API.
 *
 *   entities/   one renderer (+ defaults) per entity type
 *   prism.ts    rounded iso prisms, faces, drop shadows, boxes
 *   pills.ts    tag pills, CPU meter, pill spacing
 *   paths.ts    rounded polygons, smooth polylines, link trimming, bounds
 *   text.ts     text width estimates, line layout, escaping
 *   iso.ts      projection, rounding, plane transforms
 *   defs.ts     shared gradients / filters / markers
 *   palette.ts  colors
 *   icon.ts     icon markup (data in icons.ts)
 */
import { renderBlock, BLOCK_DEFAULTS } from './entities/block';
import { renderCrowd, CROWD_DEFAULTS } from './entities/crowd';
import { renderDb, DB_DEFAULTS } from './entities/db';
import { renderDevice, DEVICE_DEFAULTS } from './entities/device';
import { renderGhost, GHOST_DEFAULTS } from './entities/ghost';
import { renderPanel, PANEL_DEFAULTS, type PanelRender } from './entities/panel';
import { renderQueue, QUEUE_DEFAULTS } from './entities/queue';
import { renderRing, RING_DEFAULTS } from './entities/ring';
import { renderZone, ZONE_DEFAULTS } from './entities/zone';
import type { EntityProps, EntityRender, Point } from './types';

type Renderer = (props: EntityProps) => EntityRender;

// Scene entities are merged with ENTITY_DEFAULTS before rendering, so each
// renderer receives the full props shape it declares.
const asRenderer = <P,>(fn: (props: P) => EntityRender) => fn as unknown as Renderer;

export const ENTITY_RENDERERS: Record<string, Renderer> = {
  block: asRenderer(renderBlock),
  crowd: asRenderer(renderCrowd),
  ghost: asRenderer(renderGhost),
  device: asRenderer(renderDevice),
  db: asRenderer(renderDb),
  zone: asRenderer(renderZone),
  queue: asRenderer(renderQueue),
  panel: asRenderer(renderPanel),
  ring: asRenderer(renderRing),
};

/** The panel renderer additionally reports its card size. */
export const renderPanelCard = renderPanel as unknown as (props: EntityProps) => PanelRender;

export const ENTITY_DEFAULTS: Record<string, Partial<EntityProps>> = {
  block: BLOCK_DEFAULTS,
  crowd: CROWD_DEFAULTS,
  ghost: GHOST_DEFAULTS,
  device: DEVICE_DEFAULTS,
  db: DB_DEFAULTS,
  zone: ZONE_DEFAULTS,
  queue: QUEUE_DEFAULTS,
  panel: PANEL_DEFAULTS,
  ring: RING_DEFAULTS,
};

/** World footprint as [x0, x1, y0, y1]. */
export function entityFootprint(e: EntityProps): [number, number, number, number] {
  if (e.type === `crowd` || e.type === `zone`) return [e.x0, e.x1, e.y0, e.y1];
  if (e.type === `device`) return [e.x - e.d / 2, e.x + e.d / 2, e.y - e.w / 2, e.y + e.w / 2];
  if (e.type === `db` || e.type === `ring`) return [e.x - e.r, e.x + e.r, e.y - e.r, e.y + e.r];
  const half = (e.s || 4) / 2;
  return [e.x - half, e.x + half, e.y - half, e.y + half];
}

/** World (x, y) center. */
export function entityCenter(e: EntityProps): Point {
  return e.type === `crowd` || e.type === `zone` ? [(e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2] : [e.x, e.y];
}

/** Painter's-algorithm depth: floors first, HUD panels last, others by x − y. */
export function entitySortKey(e: EntityProps): number {
  if (e.type === `zone` || e.type === `ring`) return -1e4;
  if (e.type === `queue`) return -1e3;
  if (e.type === `panel`) return 1e4;
  const [x, y] = entityCenter(e);
  return x - y - (e.type === `ghost` ? 0.5 : 0);
}

export { buildDefs } from './defs';
export { buildPill } from './pills';
export { isoProject, round } from './iso';
export { roundedPolygonPath, smoothPath, trimPathEnd, trimPathStart } from './paths';
export type { EntityProps, EntityRender, PanelRender };
