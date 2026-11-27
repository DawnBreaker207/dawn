/**
 * Text measurement and link-label line breaking for the stage.
 */

/** Font size (px) of link label pills. */
export const LABEL_FONT_SIZE = 9.5;

const LABEL_LOCALE = 'en';
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
/** A line must not start with closing punctuation… */
const NO_LINE_START = /^[·→←:;,.!?)»”’%]/;
/** …nor end with opening punctuation. */
const NO_LINE_END = /[(«“‘]$/;
/** Unicode bidi isolate open (LRI/RLI/FSI) and close (PDI) marks. */
const ISOLATE_OPEN_FIRST = '⁦';
const ISOLATE_OPEN_LAST = '⁨';
const ISOLATE_CLOSE = '⁩';

const widthCache = new Map<string, number>();
let measureContext: CanvasRenderingContext2D | null = null;
let measureFont = '';
if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.addEventListener('loadingdone', () => widthCache.clear());
}

/** Measures bold text width in px with a 2D canvas (cached; estimated during SSR). */
export function measureTextWidth(text: string | number, fontSize: number): number {
  const str = String(text);
  if (typeof document === 'undefined') return str.length * fontSize * 0.6;
  const key = fontSize + '|' + str;
  let width = widthCache.get(key);
  if (width === undefined) {
    if (!measureContext) {
      measureContext = document.createElement('canvas').getContext('2d');
      measureFont = getComputedStyle(document.documentElement).getPropertyValue('--font').trim() || 'monospace';
    }
    if (measureContext) {
      measureContext.font = '700 ' + fontSize + 'px ' + measureFont;
      width = measureContext.measureText(str).width;
      widthCache.set(key, width);
    } else {
      width = str.length * fontSize * 0.6;
    }
  }
  return width;
}

const lineHeight = (fontSize: number) => Math.round(fontSize * 1.3);

/** Width of the widest line and total height of a `\n`-separated text block. */
export function measureMultilineText(text: string | number, fontSize: number): { lines: string[]; tw: number; h: number } {
  const lines = String(text).split('\n');
  return {
    lines,
    tw: Math.max(...lines.map((l) => measureTextWidth(l, fontSize))),
    h: 21 + (lines.length - 1) * lineHeight(fontSize),
  };
}

/** Outer size of a link label pill. */
export function labelBoxSize(text: string): { w: number; h: number } {
  const { tw, h } = measureMultilineText(text, LABEL_FONT_SIZE);
  return { w: tw + 18, h };
}

let segmenter: { locale: string; seg: Intl.Segmenter } | null = null;

/** Word-boundary indices (CJK has no spaces); null when Intl.Segmenter is unavailable. */
function wordBoundaries(text: string): Set<number> | null {
  if (typeof Intl.Segmenter !== 'function') return null;
  if (!segmenter || segmenter.locale !== LABEL_LOCALE) {
    segmenter = { locale: LABEL_LOCALE, seg: new Intl.Segmenter(LABEL_LOCALE, { granularity: 'word' }) };
  }
  return new Set([...segmenter.seg.segment(text)].map((s) => s.index));
}

/**
 * Splits a single-line label into the most balanced two lines (narrowest
 * widest-line). Breaks at spaces, or between CJK characters at word
 * boundaries; never inside a bidi isolate. Returns null if no break exists.
 */
export function balancedLabelBreak(text: string): string | null {
  if (text.includes('\n')) return null;
  const chars = [...text];
  const boundaries = CJK.test(text) ? wordBoundaries(text) : null;
  let isolateDepth = 0;
  let best: { w: number; text: string } | null = null;
  let offset = chars[0].length;
  for (let i = 1; i < chars.length - 1; offset += chars[i].length, i++) {
    const ch = chars[i];
    if (ch >= ISOLATE_OPEN_FIRST && ch <= ISOLATE_OPEN_LAST) isolateDepth++;
    else if (ch === ISOLATE_CLOSE) isolateDepth = Math.max(0, isolateDepth - 1);
    if (isolateDepth) continue;

    let head: string;
    let tail: string;
    if (ch === ' ') {
      head = chars.slice(0, i).join('');
      tail = chars.slice(i + 1).join('');
    } else if (CJK.test(ch) && CJK.test(chars[i - 1]) && (!boundaries || boundaries.has(offset))) {
      head = chars.slice(0, i).join('');
      tail = chars.slice(i).join('');
    } else continue;

    head = head.trimEnd();
    tail = tail.trimStart();
    if (!head || !tail || NO_LINE_START.test(tail) || NO_LINE_END.test(head)) continue;
    const width = Math.max(measureTextWidth(head, LABEL_FONT_SIZE), measureTextWidth(tail, LABEL_FONT_SIZE));
    if (!best || width < best.w) best = { w: width, text: `${head}\n${tail}` };
  }
  return best && best.text;
}
