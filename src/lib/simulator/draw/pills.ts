/**
 * Pills: rounded tag badges, the CPU meter, and the space they need.
 */
import { iconMarkup } from './icon';
import { clamp01, round, type Point, type Rect } from './iso';
import { INK, PILL_SHADOW, PILL_TONES, loadColor } from './palette';
import { lineHeight, measureLines, textWidth } from './text';

export interface Tag {
  text: string;
  tone?: string;
  icon?: string | null;
  size?: number;
}

export interface PillOptions {
  tone?: string;
  size?: number;
  icon?: string | null;
}

/** Vertical distance between stacked pills (px). */
export const PILL_STEP = 26;

/** Pill centered at (x, y); text may contain `\n` for multiple lines. */
export function buildPill(x: number, y: number, text: string, { tone = `paper`, size = 10.5, icon = null }: PillOptions = {}): string {
  const colors = PILL_TONES[tone] || PILL_TONES.paper;
  const iconW = icon ? 15 : 0;
  const { lines, tw, h } = measureLines(text, size);
  const w = tw + 18 + iconW;
  const left = x - w / 2;
  const top = y - h / 2;
  const lh = lineHeight(size);
  const textMarkup = lines
    .map(
      (line, i) =>
        `<text x="${round(left + 9 + iconW + tw / 2)}" y="${round(y + size * 0.36 + (i - (lines.length - 1) / 2) * lh)}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${colors.fg}">${line}</text>`,
    )
    .join(``);
  return `
    <g class="pill">
      <rect x="${round(left)}" y="${round(top + 2)}" width="${round(w)}" height="${h}" rx="10.5" fill="${PILL_SHADOW}"/>
      <rect x="${round(left)}" y="${round(top)}" width="${round(w)}" height="${h}" rx="10.5" fill="${colors.bg}" stroke="${INK}" stroke-width="1.3"/>
      ${icon ? iconMarkup(icon, left + 9 + 6, y, 12, { stroke: 2.2, color: colors.fg }) : ``}
      ${textMarkup}
    </g>`;
}

const METER_W = 86;
const METER_H = 21;

/** CPU load meter pill centered at (x, y); `load` is 0..1. */
export function cpuMeter(x: number, y: number, load: number): string {
  const percent = Math.round(clamp01(load) * 100);
  const color = loadColor(load);
  const left = x - METER_W / 2;
  const top = y - METER_H / 2;
  const barX = left + 23;
  return `
    <g class="pill">
      <rect x="${round(left)}" y="${round(top + 2)}" width="86" height="21" rx="${METER_H / 2}" fill="${PILL_SHADOW}"/>
      <rect x="${round(left)}" y="${round(top)}" width="86" height="21" rx="${METER_H / 2}" fill="#fbf6ef" stroke="${INK}" stroke-width="1.3"/>
      ${iconMarkup(`cpu`, left + 13, y, 11, { stroke: 2.2, color: `#6f6961` })}
      <rect x="${round(barX)}" y="${round(y - 3.5)}" width="28" height="7" rx="3.5" fill="#e6ddd0"/>
      <rect x="${round(barX)}" y="${round(y - 3.5)}" width="${round(Math.max(3, 28 * clamp01(load)))}" height="7" rx="3.5" fill="${color}"/>
      <text x="${round(left + METER_W - 9)}" y="${round(y + 3.6)}" text-anchor="end" font-size="10.5" font-weight="800" fill="${INK}">${percent}%</text>
    </g>`;
}

/** Half-width of a tag pill (px). */
const tagHalfWidth = (tag: Tag) => (textWidth(tag.text, 10.5) + 18 + (tag.icon ? 15 : 0)) / 2;

/** Half-width of the widest pill (CPU meter or tag) an entity shows. */
export const pillHalfWidth = (ent: { cpu: number; tags?: Tag[] }) =>
  Math.max(0, ent.cpu >= 0 ? METER_W / 2 : 0, ...(ent.tags || []).map(tagHalfWidth));

/** Widens `bounds` horizontally to fit pills of `halfWidth` centered at `cx`. */
export const widenForPills = (bounds: Rect, cx: number, halfWidth: number): Rect =>
  halfWidth ? [Math.min(bounds[0], cx - halfWidth - 5), bounds[1], Math.max(bounds[2], cx + halfWidth + 5), bounds[3]] : bounds;

/** Bounds padding [l, t, r, b] for a tag stack centered at `x` above an outline. */
export function tagStackPad(tags: Tag[] = [], x: number, outline: Point[]): [number, number, number, number] {
  const half = Math.max(0, ...tags.map(tagHalfWidth));
  const xs = outline.map((p) => p[0]);
  const left = Math.max(8, Math.min(...xs) - (x - half) + 8);
  const right = Math.max(8, x + half + 8 - Math.max(...xs));
  return [left, 18 + tags.length * PILL_STEP, right, 40];
}
