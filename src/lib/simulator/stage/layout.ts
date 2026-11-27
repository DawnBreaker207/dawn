/**
 * Scene layout & camera planning: measures a scene's screen footprint, places
 * link labels, then picks the camera zoom/anchor and HUD card corner so the
 * card never covers the diagram.
 */
import { isoProject, trimPathEnd, trimPathStart } from '../draw';
import { polygonIntersectsRect, rectsIntersect, samplePath } from './geometry';
import { addEntityObstacles, labelCost, placeLabel, type LabelSpot, type Obstacles } from './labels';
import { centerOf, renderEntityMarkup, renderPanel, withDefaults } from './renderers';
import { balancedLabelBreak, labelBoxSize } from './text';
import type { Cam, Corner, EntityProps, Point, PointRef, Rect, Size, StageScene } from './types';

/** Host size and HUD settings a plan is computed for. */
export interface Viewport {
  width: number;
  height: number;
  hudScale: number;
  showCards: boolean;
}

/** Chosen label placement for a link. */
export interface LabelPick {
  side: number;
  label: string;
  /** Label text, possibly broken onto two lines. */
  text: string;
}

export interface ScenePlan {
  cam: Cam;
  zoom: number;
  corner: Corner | null;
  dock: { x: number; y: number; corner: Corner | null } | null;
  picks: Record<string, LabelPick>;
}

interface SceneLayout {
  /** Padded bounding box of everything drawn. */
  b: Rect;
  /** Rects the HUD card must not cover. */
  boxes: Rect[];
  /** Zone floor polygons the HUD card must not cover. */
  polys: Point[][];
  /** Scaled HUD card size, if the scene has a visible panel. */
  panel: Size | null;
  picks: Record<string, LabelPick>;
}

/** Margins between the HUD card and the host edges (px). */
const DOCK_MARGIN = { x: 10, top: 16, bottom: 10 };
/** Extra clearance around the card when testing overlap (px). */
const CARD_CLEARANCE = 12;
/** Corner preference order. */
const CORNERS: Corner[] = ['tr', 'br', 'tl', 'bl'];
const MIN_ZOOM = 0.42;
const MAX_ZOOM = 1.35;

/** On-screen HUD card size for a panel at the given HUD scale. */
export const scaledCardSize = (size: Size, scale: number): Size => ({ w: size.w * scale, h: (size.h + 4) * scale });

/**
 * Resolves a link waypoint to world (x, y): entity ids map to the entity
 * center, optionally offset (`'db+1.5'`).
 */
export function resolvePoint(ref: PointRef, center: (id: string) => Point): [number, number] {
  const axis = (token: string, i: 0 | 1) => {
    // Waypoint tokens are always `<id>` or `<id><+|-><number>`.
    const m = /^([\w-]+?)([+-][\d.]+)?$/.exec(token) as RegExpExecArray;
    return center(m[1])[i] + (m[2] ? parseFloat(m[2]) : 0);
  };
  return typeof ref === 'string'
    ? [axis(ref, 0), axis(ref, 1)]
    : [typeof ref[0] == 'string' ? axis(ref[0], 0) : ref[0], typeof ref[1] == 'string' ? axis(ref[1], 1) : ref[1]];
}

function layoutScene(scene: StageScene, vp: Viewport): SceneLayout {
  const ents: Record<string, EntityProps> = Object.fromEntries(
    Object.entries(scene.entities).map(([id, ent]) => [id, withDefaults(ent)]),
  );
  const center = (id: string) => centerOf(ents[id]);
  const boxes: Rect[] = [];
  const obstacles: Obstacles = { polys: [], boxes: [] };
  const zonePolys: Point[][] = [];
  let panel: Size | null = null;
  const polyById: Record<string, Point[] | null> = {};
  let b: Rect = [Infinity, Infinity, -Infinity, -Infinity];
  const grow = (r: Rect) => (b = [Math.min(b[0], r[0]), Math.min(b[1], r[1]), Math.max(b[2], r[2]), Math.max(b[3], r[3])]);

  for (const [id, ent] of Object.entries(ents)) {
    if (ent.type === 'panel') {
      if (!vp.showCards) continue;
      const { size } = renderPanel({ ...ent, x: 0, y: 0, z: 0, dx: 0, dy: 0, lift: 0 });
      panel = scaledCardSize(size, vp.hudScale);
      continue;
    }
    const r = renderEntityMarkup(ent);
    polyById[id] = r.poly;
    grow(r.bounds);
    // The zone renderer always returns its floor polygon.
    if (ent.type === 'zone') zonePolys.push(r.poly as Point[]);
    else boxes.push(r.bounds);
    addEntityObstacles(ent, r.poly, r.bounds, obstacles);
  }

  const linePoints: Point[] = [];
  const labeled: { id: string; pts: Point[]; t: number; label: string }[] = [];
  for (const [id, link] of Object.entries(scene.links || {})) {
    let pts: Point[] = link.pts.map((p) => isoProject(...resolvePoint(p, center)));
    pts = trimPathStart(pts, polyById[link.from], 3);
    if (link.to) pts = trimPathEnd(pts, polyById[link.to], link.heads === 'none' ? 3 : 4);
    linePoints.push(...samplePath(pts));
    if (link.label) labeled.push({ id, pts, t: link.labelAt ?? 0.5, label: link.label });
  }
  for (const [x, y] of linePoints) {
    boxes.push([x - 3, y - 3, x + 3, y + 3]);
    grow([x - 3, y - 3, x + 3, y + 3]);
  }

  const placed: Rect[] = [];
  const picks: Record<string, LabelPick> = {};
  for (const item of labeled) {
    // Try the label on one line and, if long, balanced over two lines.
    const options = [{ text: item.label, extra: 0 }];
    const wrapped = labelBoxSize(item.label).w > 70 && balancedLabelBreak(item.label);
    if (wrapped) options.push({ text: wrapped, extra: 14 });
    let best: { at: LabelSpot; text: string } | null = null;
    for (const opt of options) {
      const { w, h } = labelBoxSize(opt.text);
      const at = placeLabel(item.pts, item.t, w, (r) => labelCost(r, obstacles, linePoints, placed) + opt.extra, -1, h);
      if (!best || at.cost < best.at.cost) best = { at, text: opt.text };
    }
    // options is never empty, so best is set.
    const chosen = best as { at: LabelSpot; text: string };
    const { rect, side } = chosen.at;
    picks[item.id] = { side, label: item.label, text: chosen.text };
    placed.push(rect);
    boxes.push(rect);
    grow([rect[0] - 2, rect[1] - 2, rect[2] + 2, rect[3] + 4]);
  }

  b = b[0] === Infinity ? [-100, -60, 100, 60] : [b[0] - 20, b[1] - 24, b[2] + 20, b[3] + 24];
  return { b, boxes, polys: zonePolys, panel, picks };
}

/** Screen rect (host px) of a HUD card of `size` docked at `corner`. */
export function dockRect(corner: Corner, size: Size, vp: Viewport): Rect {
  const x = corner[1] === 'l' ? DOCK_MARGIN.x : vp.width - DOCK_MARGIN.x - size.w;
  const y = corner[0] === 't' ? DOCK_MARGIN.top : vp.height - DOCK_MARGIN.bottom - size.h;
  return [x, y, x + size.w, y + size.h];
}

/** True when the docked card (plus clearance) covers nothing under camera `cam`. */
function cardIsClear(layout: SceneLayout, cam: Cam, corner: Corner, vp: Viewport): boolean {
  const scale = vp.width / cam.w;
  const d = dockRect(corner, layout.panel as Size, vp);
  const area: Rect = [
    cam.x + (d[0] - CARD_CLEARANCE) / scale,
    cam.y + (d[1] - CARD_CLEARANCE) / scale,
    cam.x + (d[2] + CARD_CLEARANCE) / scale,
    cam.y + (d[3] + CARD_CLEARANCE) / scale,
  ];
  return !layout.boxes.some((box) => rectsIntersect(box, area)) && !layout.polys.some((p) => polygonIntersectsRect(p, area));
}

/**
 * Plans the camera for a scene. Without a HUD card the scene is centered at
 * the largest fitting zoom. With one, every corner × anchor is tried from the
 * largest zoom down until the card covers nothing; the best-scoring choice
 * wins, preferring the previous step's corner to avoid the card jumping.
 */
export function planScene(scene: StageScene, prev: ScenePlan | null, vp: Viewport): ScenePlan {
  const layout = layoutScene(scene, vp);
  const W = Math.max(1, vp.width);
  const H = Math.max(1, vp.height);
  const [x0, y0, x1, y1] = layout.b;
  const bw = Math.max(1, x1 - x0);
  const bh = Math.max(1, y1 - y0);
  const padX = Math.min(24, Math.max(12, W * 0.02));
  const padTop = Math.min(26, Math.max(14, H * 0.03));
  const padBottom = Math.min(22, Math.max(12, H * 0.025));
  /** Camera at `zoom`, anchoring the diagram centered (0), start (-1) or end (+1) on each axis. */
  const camAt = (zoom: number, ax: number, ay: number): Cam => {
    const left = ax === 0 ? (W - bw * zoom) / 2 : ax < 0 ? padX : W - padX - bw * zoom;
    const top = ay === 0 ? (H - bh * zoom) / 2 : ay < 0 ? padTop : H - padBottom - bh * zoom;
    return { x: x0 - left / zoom, y: y0 - top / zoom, w: W / zoom, h: H / zoom };
  };
  const snapZoom = (z: number) => Math.max(MIN_ZOOM, Math.floor(z * 20 + 1e-6) / 20);
  const fitZoom = Math.min(MAX_ZOOM, (W - padX * 2) / bw, (H - (padTop + padBottom)) / bh);

  type Choice = { zoom: number; ax: number; ay: number; corner: Corner | null; score?: number };
  let choice: Choice | null = null;
  if (!layout.panel) choice = { zoom: snapZoom(fitZoom), ax: 0, ay: 0, corner: null };
  else {
    for (const [ci, corner] of CORNERS.entries()) {
      // Push the diagram away from the card's side.
      const sx = corner[1] === 'l' ? 1 : -1;
      const sy = corner[0] === 't' ? 1 : -1;
      const anchors: [number, number][] = [
        [0, 0],
        [sx, 0],
        [0, sy],
        [sx, sy],
      ];
      let found: Required<Choice> | null = null;
      for (let z = snapZoom(fitZoom); z >= MIN_ZOOM && !found; z = Math.round((z - 0.05) * 100) / 100)
        for (const [ai, [ax, ay]] of anchors.entries())
          if (cardIsClear(layout, camAt(z, ax, ay), corner, vp)) {
            found = {
              zoom: z,
              ax,
              ay,
              corner,
              score: z - ai * 0.004 - ci * 0.001 + (prev && prev.corner === corner ? 0.045 : 0),
            };
            break;
          }
      if (found && (!choice || found.score > (choice.score as number))) choice = found;
    }
    choice ||= { zoom: snapZoom(fitZoom * 0.9), ax: 0, ay: 0, corner: 'tr' };
  }

  const cam = camAt(choice.zoom, choice.ax, choice.ay);
  const corner = choice.corner;
  // A panel always yields a corner.
  const dock = layout.panel ? dockRect(corner as Corner, layout.panel, vp) : null;
  return {
    cam,
    zoom: choice.zoom,
    corner,
    dock: dock && { x: dock[0], y: dock[1], corner },
    picks: layout.picks,
  };
}
