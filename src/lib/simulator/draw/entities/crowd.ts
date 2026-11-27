/**
 * Crowd: a slab of little people; `count` (fractional) fades them in from the
 * front-center outward.
 */
import { clamp01, isoProject as iso, round } from '../iso';
import { boundsOf } from '../paths';
import { buildPill } from '../pills';
import { dropShadow, isoPrism, prismFaces } from '../prism';
import { INK } from '../palette';
import type { EntityRender } from '../types';

export interface CrowdProps {
  type: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  count: number;
  label: string;
  opacity: number;
  lift: number;
  labelFade?: number;
}

export const CROWD_DEFAULTS = { count: 0, label: ``, opacity: 1, lift: 0 };

const SHIRT_COLORS = [`#F3B47F`, `#A9C5E8`, `#B3D79F`, `#CBBAE6`, `#F6CD82`];
/** Grid spacing between people (world units). */
const SPACING = 1.75;
const SLAB_H = 10;

/** Deterministic pseudo-random 0..1 from grid coords. */
const hash = (i: number, j: number) => {
  const n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

/** One person; `alpha` 0..1 also pops them up and scales them in. */
function person(x: number, y: number, z: number, alpha: number, color: string): string {
  const [sx, sy] = iso(x, y, z);
  const scale = (0.35 + 0.65 * alpha) * 1.3;
  return `
    <g opacity="${round(alpha)}" transform="translate(${round(sx)} ${round(sy - (1 - alpha) * 10)}) scale(${round(scale)})">
      <ellipse cx="0" cy="0" rx="5.6" ry="2.8" fill="#6b5236" opacity=".18"/>
      <path d="M-5.2,0 V-9 A5.2,5.2 0 0 1 5.2,-9 V0 A5.2,2.4 0 0 1 -5.2,0 Z" fill="${color}" stroke="${INK}" stroke-width="1.25"/>
      <circle cx="0" cy="-17.6" r="4.3" fill="#fdf6ec" stroke="${INK}" stroke-width="1.25"/>
    </g>`;
}

export function renderCrowd(e: CrowdProps): EntityRender {
  const prism = isoPrism({ x0: e.x0, x1: e.x1, y0: e.y0, y1: e.y1, h: SLAB_H, radius: 8 });
  const cx = (e.x0 + e.x1) / 2;
  const cy = (e.y0 + e.y1) / 2;
  const halfX = (e.x1 - e.x0) / 2 - 0.85;
  const halfY = (e.y1 - e.y0) / 2 - 0.85;
  const nx = Math.floor(halfX / SPACING);
  const ny = Math.floor(halfY / SPACING);
  // Fill order: closest to the center column first, with a little jitter.
  const slots: { i: number; j: number; key: number }[] = [];
  for (let i = -nx; i <= nx; i++) for (let j = -ny; j <= ny; j++) slots.push({ i, j, key: Math.abs(i) + hash(i, j) * 1.6 });
  slots.sort((a, b) => a.key - b.key);
  const people = slots
    .map((slot, n) => ({ ...slot, a: clamp01(e.count - n) }))
    .filter((p) => p.a > 0.01)
    .sort((a, b) => a.i - a.j - (b.i - b.j)) // back to front
    .map((p) => person(cx + p.i * SPACING, cy + p.j * SPACING, SLAB_H, p.a, SHIRT_COLORS[Math.abs(p.i * 3 + p.j * 7) % SHIRT_COLORS.length]))
    .join(``);
  const lift = e.lift;
  const body = `
    <g opacity="${round(e.opacity)}">
      ${dropShadow(prism, SLAB_H, lift, 0.2)}
      <g transform="translate(0 ${round(-lift)})">
        ${prismFaces(prism, `slab`, { stroke: `#3b3631`, sw: 1.5 })}
        ${people}
      </g>
    </g>`;
  const [lx, ly] = iso(e.x1, e.y0, 0);
  return {
    body,
    over: e.label
      ? `<g opacity="${round(e.opacity * (e.labelFade ?? 1))}" transform="translate(0 ${round(-lift)})">${buildPill(lx, ly + 22, e.label, { icon: `users` })}</g>`
      : ``,
    poly: prism.outline.map(([x, y]) => [x, y - lift]),
    bounds: boundsOf(prism.outline, [8, 34, 8, 40]),
  };
}
