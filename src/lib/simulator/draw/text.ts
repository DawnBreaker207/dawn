/**
 * Text helpers for entity / pill rendering.
 *
 * Note: width here is *estimated* (0.6 em per char) for Latin-like text and
 * only canvas-measured for other scripts, so renders are deterministic before
 * web fonts load. The stage's link-label layout (stage/text.ts) always
 * measures with canvas instead — the two are intentionally separate.
 */
import { INK } from './palette';
import { round } from './iso';

const LATIN_LIKE = /^[\u0000-֏Ḁ-῿ -⯿⸀-⹿]*$/u;
/** LRM, RLM and bidi isolate marks take no width. */
const BIDI_MARKS = /[‎‏⁦-⁩]/g;

const widthCache = new Map<string, number>();
let measureContext: CanvasRenderingContext2D | null = null;
let measureFont = ``;
if (typeof document !== `undefined` && document.fonts) {
  document.fonts.addEventListener(`loadingdone`, () => widthCache.clear());
}

/** Bold text width in px at `size` (estimated for Latin-like text, see above). */
export function textWidth(text: string | number, size: number): number {
  const str = String(text);
  if (LATIN_LIKE.test(str) || typeof document === `undefined`) return str.replace(BIDI_MARKS, ``).length * size * 0.6;
  const key = `${size}|${str}`;
  let width = widthCache.get(key);
  if (width === undefined) {
    if (!measureContext) {
      measureContext = document.createElement(`canvas`).getContext(`2d`);
      measureFont = getComputedStyle(document.documentElement).getPropertyValue(`--font`).trim() || `monospace`;
    }
    // A 2D context is always available in supported browsers.
    const ctx = measureContext as CanvasRenderingContext2D;
    ctx.font = `700 ${size}px ${measureFont}`;
    width = ctx.measureText(str).width;
    widthCache.set(key, width);
  }
  return width;
}

export const lineHeight = (size: number) => Math.round(size * 1.3);

/** Lines, widest-line width and block height of `\n`-separated text. */
export function measureLines(text: string | number, size: number): { lines: string[]; tw: number; h: number } {
  const lines = String(text).split(`\n`);
  return { lines, tw: Math.max(...lines.map((l) => textWidth(l, size))), h: 21 + (lines.length - 1) * lineHeight(size) };
}

/** Centered bold `<text>` in ink color; `attrs` is appended verbatim. */
export const svgText = (x: number, y: number, text: string, size = 12.5, weight = 700, attrs = ``) =>
  `<text x="${round(x)}" y="${round(y)}" text-anchor="middle" font-size="${size}" font-weight="${weight}" fill="${INK}" ${attrs}>${text}</text>`;

/** Escapes `&` (unless already an entity) and `<` for SVG text content. */
export const escapeText = (s: string) => s.replace(/&(?![a-z#0-9]+;)/g, `&amp;`).replace(/</g, `&lt;`);

/** Escapes text and renders `**bold**` spans as bold ink tspans. */
export const richText = (s: string) =>
  escapeText(s)
    .split(`**`)
    .map((part, i) => (i % 2 ? `<tspan font-weight="800" fill="${INK}">${part}</tspan>` : part))
    .join(``);
