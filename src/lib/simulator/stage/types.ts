/**
 * Data contracts shared by the stage engine modules.
 */
import type { EntityProps } from '../draw/types';
import type { Point, Rect } from './geometry';

export type { EntityProps };

/**
 * A link waypoint: an entity id (`'api'`), an id with an offset (`'api+2'`),
 * or an `[x, y]` pair where either axis may be a number or such a reference.
 */
export type PointRef = string | [number | string, number | string];

export interface LinkSpec {
  from: string;
  /** Target entity id; omitted or null for a link that ends in free space. */
  to?: string | null;
  pts: PointRef[];
  /** Arrow heads: default end only, `'none'`, or `'both'`. */
  heads?: string;
  /** `solid` (default), `dash`, `off`, `beat`, `cut`… */
  style?: string;
  label?: string;
  /** Preferred label position along the link (0..1, default 0.5). */
  labelAt?: number;
  labelTone?: string;
  /** Probability that a packet fails on arrival over this link. */
  fail?: number;
}

export interface FlowRoute {
  path: string[];
  kind?: string;
  weight?: number;
}

export interface FlowSpec {
  /** Packets spawned per second. */
  rate: number;
  /** Link ids; an array entry is a choice between alternative links. */
  route?: (string | string[])[];
  /** Alternative full routes. */
  routes?: FlowRoute[];
  /** Cycles packet kinds in order. */
  pattern?: string[];
  kind?: string;
  /** `'weights'` = weighted random choice, otherwise round-robin. */
  pick?: string;
  weights?: number[];
  /** Launch one packet on every route at once. */
  fanout?: boolean;
  /** Packet returns along the route after arriving. */
  bounce?: boolean;
  speed?: number;
  /** Seconds to hold at the far end before bouncing back. */
  hold?: number;
}

export interface StageScene {
  entities: Record<string, EntityProps>;
  links?: Record<string, LinkSpec>;
  flows?: FlowSpec[];
}

/** Camera rect in SVG user space. */
export interface Cam {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** HUD card dock corner: [t|b][l|r]. */
export type Corner = 'tr' | 'br' | 'tl' | 'bl';

export interface Size {
  w: number;
  h: number;
}

export interface LinkTween {
  from: number;
  to: number;
  key: 'draw' | 'opacity';
  start: number;
  delay: number;
  dur: number;
  remove?: boolean;
}

/** A link currently on stage. */
export interface StageLink {
  id: string;
  spec: LinkSpec;
  el: SVGPathElement;
  label: SVGGElement;
  /** Line-draw progress 0..1. */
  draw: number;
  opacity: number;
  tween: LinkTween | null;
  /** Rendered path length (px). */
  len: number;
  pts?: Point[];
  /** Smoothed label position. */
  lpos?: Point;
  labelKey?: string | null;
  labelBorn?: number;
}

export type { Point, Rect };
