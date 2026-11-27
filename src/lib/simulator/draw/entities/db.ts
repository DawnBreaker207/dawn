/**
 * Database: a cylinder with an optional fill level (CPU / load) and a label
 * pill to its right.
 */
import { iconMarkup } from '../icon';
import { clamp01, isoProject as iso, round, type Point } from '../iso';
import { INK } from '../palette';
import { PILL_STEP, buildPill, cpuMeter, pillHalfWidth, widenForPills, type Tag } from '../pills';
import { textWidth } from '../text';
import type { EntityRender } from '../types';

export interface DbProps {
  type: string;
  x: number;
  y: number;
  /** Radius (world units). */
  r: number;
  /** Height (px). */
  h: number;
  glyph: string;
  label: string;
  tags: Tag[];
  opacity: number;
  lift: number;
  heat: number;
  cpu: number;
  labelFade?: number;
  tagFade?: number;
}

export const DB_DEFAULTS = {
  r: 1.7,
  h: 38,
  glyph: `database`,
  label: ``,
  tags: [],
  opacity: 1,
  lift: 0,
  heat: 0,
  cpu: -1,
};

export function renderDb(e: DbProps): EntityRender {
  const rx = Math.SQRT2 * 14 * e.r;
  const ry = rx / 2;
  const [cx, groundY] = iso(e.x, e.y, 0);
  const lift = e.lift;
  const bottom = groundY - lift;
  const top = bottom - e.h;
  const bodyPath = `M${round(cx - rx)},${round(top)} V${round(bottom)} A${round(rx)},${round(ry)} 0 0 0 ${round(cx + rx)},${round(bottom)} V${round(top)} Z`;
  const outlinePath = `M${round(cx - rx)},${round(top)} V${round(bottom)} A${round(rx)},${round(ry)} 0 0 0 ${round(cx + rx)},${round(bottom)} V${round(top)}`;
  const shadowFade = 1 - Math.min(1, lift / 140) * 0.85;
  const level = e.cpu >= 0 ? clamp01(e.cpu) : 0;
  let fill = ``;
  if (level > 0.004) {
    const levelY = bottom - level * e.h;
    const [liquid, rim] =
      e.cpu < 0.6 ? [`#cfe8c0`, `#5fa95a`] : e.cpu < 0.85 ? [`#f9dca3`, `#d99a2b`] : [`#f5bdb2`, `#d9473d`];
    const liquidPath = `M${round(cx - rx)},${round(levelY)} A${round(rx)},${round(ry)} 0 0 0 ${round(cx + rx)},${round(levelY)} V${round(bottom)} A${round(rx)},${round(ry)} 0 0 1 ${round(cx - rx)},${round(bottom)} Z`;
    const rimPath = `M${round(cx - rx + 1)},${round(levelY)} A${round(rx - 1)},${round(ry - 0.5)} 0 0 0 ${round(cx + rx - 1)},${round(levelY)}`;
    fill = `
      <path d="${liquidPath}" fill="${liquid}" opacity=".92"/>
      ${level < 0.995 ? `<path d="${rimPath}" fill="none" stroke="${rim}" stroke-width="1.6" stroke-linecap="round"/>` : ``}`;
  }
  const body = `
    <g opacity="${round(e.opacity)}">
      <ellipse cx="${round(cx)}" cy="${round(groundY + 5)}" rx="${round(rx + 3)}" ry="${round(ry + 1)}" fill="#6b5236" opacity="${round(0.22 * shadowFade)}" filter="url(#blur-md)"/>
      ${e.heat > 0.01 ? `<g class="pulse"><path d="${bodyPath}" fill="#f0552f" opacity="${round(e.heat * 0.7)}" filter="url(#glow)"/></g>` : ``}
      <path d="${bodyPath}" fill="url(#g-purple-side)"/>
      ${fill}
      <path d="${bodyPath}" fill="url(#cyl-sheen)"/>
      <ellipse cx="${round(cx)}" cy="${round(top)}" rx="${round(rx)}" ry="${round(ry)}" fill="url(#g-purple-top)"/>
      <path d="M${round(cx - rx + 3)},${round(top + 2.5)} A${round(rx - 3)},${round(ry - 2)} 0 0 0 ${round(cx + rx - 3)},${round(top + 2.5)}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/>
      <path d="${outlinePath}" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linejoin="round"/>
      <ellipse cx="${round(cx)}" cy="${round(top)}" rx="${round(rx)}" ry="${round(ry)}" fill="none" stroke="${INK}" stroke-width="1.9"/>
      ${iconMarkup(e.glyph, cx, top + ry + e.h / 2, 19, { stroke: 1.8 })}
    </g>`;

  const labelW = textWidth(e.label || ``, 10.5) + 33;
  let over = e.label
    ? `<g opacity="${round(e.labelFade ?? 1)}">${buildPill(cx + rx + 10 + labelW / 2, bottom - e.h * 0.35, e.label, { icon: `database` })}</g>`
    : ``;
  let pillY = top - ry - 15;
  const pills: string[] = [];
  if (e.cpu >= 0) pills.push(cpuMeter(cx, 0, e.cpu));
  for (const tag of e.tags || []) pills.push(`<g opacity="${round(e.tagFade ?? 1)}">${buildPill(cx, 0, tag.text, tag)}</g>`);
  for (const pill of pills) {
    over += `<g transform="translate(0 ${round(pillY)})">${pill}</g>`;
    pillY -= PILL_STEP;
  }
  over = over ? `<g opacity="${round(e.opacity)}">${over}</g>` : ``;

  // Outline: top half of the lid ellipse, then the bottom half of the base.
  const poly: Point[] = [];
  for (let i = 0; i <= 8; i++) poly.push([cx - rx * Math.cos((Math.PI * i) / 8), top - ry * Math.sin((Math.PI * i) / 8)]);
  for (let i = 0; i <= 8; i++) poly.push([cx + rx * Math.cos((Math.PI * i) / 8), bottom + ry * Math.sin((Math.PI * i) / 8)]);
  return {
    body,
    over,
    poly,
    bounds: widenForPills(
      [cx - rx - 8, top - ry - 12 - pills.length * PILL_STEP, cx + rx + (e.label ? labelW + 18 : 8), bottom + ry + 10],
      cx,
      pillHalfWidth(e),
    ),
  };
}
