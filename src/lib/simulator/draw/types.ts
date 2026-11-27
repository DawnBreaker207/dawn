import type { Point, Rect } from './iso';

/**
 * Entity props bag as authored in scenes. Its shape varies per entity type
 * (see the `*Props` interface of each renderer in entities/), hence the open
 * index signature.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- open bag; each renderer narrows it to its own Props
export type EntityProps = { type: string; [key: string]: any };

/** Output of an entity renderer. */
export interface EntityRender {
  /** Markup for the entity body (floor or depth-sorted layer). */
  body: string;
  /** Markup drawn above all bodies (labels, pills). */
  over: string;
  /** Screen outline used for link trimming and label avoidance. */
  poly: Point[] | null;
  bounds: Rect;
}

export type { Point, Rect };
