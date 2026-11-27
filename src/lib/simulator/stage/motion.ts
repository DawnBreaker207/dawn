/**
 * Animation primitives: easing, step-transition timing, enter/exit presets and
 * per-entity tween descriptors.
 */
import { renderPanel } from './renderers';
import type { Corner, EntityProps } from './types';

export type Easing = (t: number) => number;

export const EASE = {
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  out: (t: number) => 1 - (1 - t) ** 3,
  /** Overshoots slightly before settling (used for the drop-in lift). */
  back: (t: number) => 1 + 2.35 * (t - 1) ** 3 + 1.35 * (t - 1) ** 2,
} satisfies Record<string, Easing>;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Step-transition phase durations (ms). */
export const TIMING = { exit: 420, move: 820, enter: 680, stagger: 130, draw: 560 } as const;

/** Props an entering entity animates from, by type (merged over its target). */
export const ENTER_FROM: Record<string, Partial<EntityProps>> = {
  crowd: { count: 0, lift: 26 },
  device: { lift: 40 },
  ghost: {},
  zone: {},
  ring: {},
  queue: { n: 0, opacity: 1 },
  panel: { lift: -14 },
};
/** Blocks, dbs… drop in from above. */
export const ENTER_FROM_DEFAULT: Partial<EntityProps> = { lift: 120 };

/** Props an exiting entity animates to, by type. */
export const EXIT_TO: Record<string, Partial<EntityProps>> = {
  crowd: { count: 0 },
  queue: { n: 0, opacity: 1 },
  ghost: {},
  zone: {},
  ring: {},
  panel: { lift: -10 },
};
export const EXIT_TO_DEFAULT: Partial<EntityProps> = { lift: -22 };

/** Card size cross-fade when a HUD panel's content changes between steps. */
export interface CardSwap {
  swap: boolean;
  w0: number;
  h0: number;
  w1: number;
  h1: number;
  /** Corner to stay docked to while resizing, if unchanged. */
  keep: Corner | null;
}

export interface TweenSwaps {
  tagSwap?: boolean;
  labelSwap?: boolean;
  card?: CardSwap;
}

export interface EntityTween extends TweenSwaps {
  from: EntityProps;
  to: EntityProps;
  start: number;
  delay: number;
  dur: number;
  ease: Easing;
  remove?: boolean;
  liftEase?: Easing;
  countEase?: Easing;
  started?: boolean;
}

/** Structural equality via JSON. */
export const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const sameJsonOrNull = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Which parts of an entity need a fade-swap (rather than a tween) when it changes. */
export function tweenSwaps(from: EntityProps, to: EntityProps): TweenSwaps {
  const swaps: TweenSwaps = {};
  if (!sameJsonOrNull(from.tags, to.tags)) swaps.tagSwap = true;
  if (!(sameJsonOrNull(from.label, to.label) && (from.sub || '') === (to.sub || ''))) swaps.labelSwap = true;
  if (from.type === 'panel') {
    const content = (e: EntityProps) => [e.title, e.icon, e.chart, e.lines, e.bars, e.w];
    const size0 = renderPanel({ ...from, boxW: undefined, boxH: undefined }).size;
    const size1 = renderPanel({ ...to, boxW: undefined, boxH: undefined }).size;
    swaps.card = {
      swap: !sameJsonOrNull(content(from), content(to)),
      w0: size0.w,
      h0: size0.h,
      w1: size1.w,
      h1: size1.h,
      keep: from.corner && from.corner === to.corner ? to.corner : null,
    };
  }
  return swaps;
}
