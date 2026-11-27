/**
 * Block: a rounded isometric prism with a glyph, wrapped label lines, an
 * optional subtitle, heat / dead / dim overlays and pills (CPU meter, tags).
 */
import { iconMarkup } from '../icon';
import { round } from '../iso';
import { boundsOf } from '../paths';
import { INK } from '../palette';
import { PILL_STEP, buildPill, cpuMeter, pillHalfWidth, widenForPills, type Tag } from '../pills';
import { dropShadow, isoPrism, prismFaces } from '../prism';
import { svgText } from '../text';
import type { EntityRender } from '../types';

export interface BlockProps {
  type: string;
  x: number;
  y: number;
  /** Footprint size (world units). */
  s: number;
  /** Height (px). */
  h: number;
  radius?: number;
  color: string;
  glyph: string;
  label: string | string[];
  sub: string;
  heat: number;
  dead: number;
  dim: number;
  opacity: number;
  lift: number;
  /** CPU load 0..1, or < 0 for no meter. */
  cpu: number;
  tags: Tag[];
  /** Pill stack placement. */
  pills: string;
  labelFade?: number;
  tagFade?: number;
}

export const BLOCK_DEFAULTS = {
  s: 4,
  h: 46,
  color: `blue`,
  glyph: `server`,
  label: [],
  sub: ``,
  heat: 0,
  dead: 0,
  dim: 0,
  opacity: 1,
  lift: 0,
  cpu: -1,
  tags: [],
  pills: `above`,
};

/** Hand-drawn glyphs that replace the icon set for these names. */
const CUSTOM_GLYPHS: Record<string, (x: number, y: number, scale?: number) => string> = {
  server: (x, y, scale = 1) => `
    <g transform="translate(${round(x)} ${round(y)}) scale(${scale})" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linecap="round">
      <rect x="-11" y="-10" width="22" height="8.5" rx="2.2"/>
      <rect x="-11" y="1.5" width="22" height="8.5" rx="2.2"/>
      <path d="M-6.5 -5.75h.01M-6.5 5.75h.01" stroke-width="2.6"/>
      <path d="M1 -5.75h5.5M1 5.75h5.5"/>
    </g>`,
  balancer: (x, y, scale = 1) => `
    <g transform="translate(${round(x)} ${round(y)}) scale(${scale})" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="-8" cy="0" r="3" fill="${INK}"/>
      <path d="M-5 0h4M-1 0 C 3 0 3 -8 8 -8M-1 0 C 3 0 3 8 8 8M-1 0h9"/>
      <path d="M5.5 -10.5l3 2.5-3 2.5M5.5 -2.5l3 2.5-3 2.5M5.5 5.5l3 2.5-3 2.5"/>
    </g>`,
};

/** Estimated px per character of block label text. */
const CHAR_W = 7.2;

/** Wraps label lines to fit the block face, breaking long tokens at delimiters / camelCase. */
function wrapLabel(lines: string[], availWidth: number): string[] {
  const fits = (s: string) => s.length * CHAR_W <= availWidth;
  const breakToken = (token: string): string[] => {
    if (fits(token)) return [token];
    const parts = token.split(/(?<=[<(\[/_.:\-])|(?=[<(\[/_.:\-])|(?<=[a-z0-9])(?=[A-Z])/).filter(Boolean);
    if (parts.length <= 1) return [token];
    const result: string[] = [];
    let cur = ``;
    for (const p of parts) {
      if (!cur) cur = p;
      else if (fits(cur + p)) cur += p;
      else {
        result.push(cur);
        cur = p;
      }
    }
    if (cur) result.push(cur);
    return result;
  };

  const wrapped: string[] = [];
  for (const line of lines) {
    if (fits(line)) {
      wrapped.push(line);
      continue;
    }
    const hasSpaces = line.includes(` `);
    const words = hasSpaces ? line.split(/\s+/) : [line];
    let cur = ``;
    for (const w of words) {
      for (const sub of fits(w) ? [w] : breakToken(w)) {
        if (!cur) cur = sub;
        else if (fits(cur + ` ` + sub)) cur += (hasSpaces ? ` ` : ``) + sub;
        else {
          wrapped.push(cur);
          cur = sub;
        }
      }
    }
    if (cur) wrapped.push(cur);
  }
  return wrapped;
}

export function renderBlock(e: BlockProps): EntityRender {
  const half = e.s / 2;
  const prism = isoPrism({ x0: e.x - half, x1: e.x + half, y0: e.y - half, y1: e.y + half, h: e.h, radius: e.radius ?? 9 });
  const lift = e.lift;
  const cx = prism.T[0];
  const topY = prism.ty;
  const contentOpacity = 1 - e.dead * 0.5 - e.dim * 0.35;

  const rawLabel = e.label;
  let lines: string[] = [];
  if (typeof rawLabel === `string`) lines = rawLabel.trim() ? [rawLabel.trim()] : [];
  else if (Array.isArray(rawLabel)) lines = rawLabel.map((x) => String(x).trim()).filter(Boolean);

  // Usable width on the block face (iso half-width is 14·s).
  const availWidth = Math.max(48, e.s * 14 * 1.35);
  const wrappedLines = wrapLabel(lines, availWidth);

  // Font size shrinks with line count, then to fit the widest line.
  const maxLen = Math.max(1, ...wrappedLines.map((l) => l.length));
  let fontSize = wrappedLines.length <= 1 ? 13 : wrappedLines.length === 2 ? 11.5 : wrappedLines.length === 3 ? 10 : 9;
  if (maxLen * (fontSize * 0.62) > availWidth) fontSize = Math.max(7.2, Math.min(fontSize, availWidth / (maxLen * 0.62)));
  fontSize = Math.round(fontSize * 10) / 10;
  const fontWeight = fontSize < 10 ? 700 : 800;

  const glyphScale = e.s >= 6 ? 1.15 : e.s < 3.5 ? 0.8 : 1;
  const iconSize = e.s < 3.2 ? 17 : e.s < 3.8 ? 19 : 21;
  const iconY = wrappedLines.length ? topY - 9 : topY - 2;
  const glyph = CUSTOM_GLYPHS[e.glyph]
    ? CUSTOM_GLYPHS[e.glyph](cx, iconY, glyphScale)
    : e.glyph
      ? iconMarkup(e.glyph, cx, iconY, iconSize, { stroke: 1.8 })
      : ``;

  // Text block: below the glyph, above the bottom edge, ideally centered on the front.
  const lineSpacing = Math.round(fontSize * (e.sub ? 1.15 : 1.25));
  const numLines = wrappedLines.length + (e.sub ? 1 : 0);
  const totalTextHeight = (numLines - 1) * lineSpacing;
  const minStartY = e.glyph ? topY + 16.5 : topY + 5;
  const maxStartY = topY + e.h - totalTextHeight - 5;
  const idealCenter = topY + (e.s * 14 * 0.35 + e.h) * 0.45;
  const startY = Math.max(minStartY, Math.min(maxStartY, idealCenter - totalTextHeight / 2));

  let text = ``;
  wrappedLines.forEach((lineText, idx) => {
    text += svgText(cx, startY + idx * lineSpacing, lineText, fontSize, fontWeight);
  });
  if (e.sub) {
    const subSize = Math.max(8, Math.round(fontSize * 0.78 * 10) / 10);
    text += svgText(cx, startY + wrappedLines.length * lineSpacing, e.sub, subSize, 600);
  }

  const deadCross =
    e.dead > 0.01
      ? `<g opacity="${round(e.dead)}" stroke="#c0392b" stroke-width="3.2" stroke-linecap="round">
         <path d="M${round(cx - 9)},${round(topY - 10)} L${round(cx + 9)},${round(topY + 8)} M${round(cx + 9)},${round(topY - 10)} L${round(cx - 9)},${round(topY + 8)}"/>
       </g>`
      : ``;
  const body = `
    <g opacity="${round(e.opacity)}">
      ${dropShadow(prism, e.h, lift, 0.26)}
      <g transform="translate(0 ${round(-lift)})">
        ${e.heat > 0.01 ? `<g class="pulse"><path d="${prism.sil}" fill="#f0552f" opacity="${round(e.heat * 0.7)}" filter="url(#glow)"/></g>` : ``}
        ${prismFaces(prism, e.color)}
        ${e.heat > 0.01 ? `<path d="${prism.sil}" fill="#f0552f" opacity="${round(e.heat * 0.3)}"/>` : ``}
        ${e.dead > 0.01 ? `<path d="${prism.sil}" fill="#b9b2a8" opacity="${round(e.dead * 0.62)}"/><path d="${prism.sil}" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linejoin="round"/>` : ``}
        ${e.dim > 0.01 ? `<path d="${prism.sil}" fill="#f4ebe0" opacity="${round(e.dim * 0.45)}"/>` : ``}
        <g opacity="${round(contentOpacity)}">${e.dead > 0.5 ? `` : glyph}<g opacity="${round(e.labelFade ?? 1)}">${text}</g></g>
        ${deadCross}
      </g>
    </g>`;

  // Pills stack upward from the top vertex, or downward from the bottom one.
  const below = e.pills === `below`;
  let pillY = below ? prism.Bd[1] - lift + 20 : prism.T[1] - lift - 17;
  const pills: string[] = [];
  if (e.cpu >= 0) pills.push(cpuMeter(cx, 0, e.cpu));
  for (const tag of e.tags || []) pills.push(`<g opacity="${round(e.tagFade ?? 1)}">${buildPill(cx, 0, tag.text, tag)}</g>`);
  let over = ``;
  for (const pill of pills) {
    over += `<g transform="translate(0 ${round(pillY)})">${pill}</g>`;
    pillY += below ? PILL_STEP : -PILL_STEP;
  }
  over = over ? `<g opacity="${round(e.opacity)}">${over}</g>` : ``;

  return {
    body,
    over,
    poly: prism.outline.map(([x, y]) => [x, y - lift]),
    bounds: widenForPills(
      boundsOf(
        prism.outline,
        below ? [8, 8, 8, 14 + pills.length * PILL_STEP] : [8, 8 + Math.max(pills.length, 1) * PILL_STEP, 8, 14],
      ),
      cx,
      pillHalfWidth(e),
    ),
  };
}
