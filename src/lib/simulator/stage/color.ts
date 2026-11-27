/**
 * Dark-theme color remapping for stage SVG markup.
 *
 * Renderers emit light-theme hex colors. When the page is in dark mode, every
 * lowercase hex color in the markup is remapped to a dark-theme counterpart.
 * Uppercase hex colors (e.g. `#FFFFFF`) are an intentional opt-out and are
 * left untouched.
 */

/** Hand-tuned dark counterparts for specific light-theme ink/paper colors. */
const DARK_OVERRIDES: Record<string, string> = {
  '#1d1b18': '#efe6d6',
  '#211e1b': '#ece2d0',
  '#34302b': '#ddd3c2',
  '#1c1a17': '#050403',
  '#6b5236': '#000000',
  '#5a4123': '#000000',
  '#3a2a14': '#000000',
};

/** Overrides that take precedence inside SVG markup. */
const DARK_SVG_OVERRIDES: Record<string, string> = {
  '#ffffff': '#ffffff',
  '#e6ddd0': '#4d463c',
};

const HEX_COLOR = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

const darkColorCache = new Map<string, string>();

/** Expands `#abc` → `#aabbcc` and lowercases. */
function normalizeHex(color: string): string {
  const hex = color.replace('#', '').toLowerCase();
  return '#' + (hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex);
}

/** Converts a `#rrggbb` color to HSL. `c` is the chroma (max - min channel). */
export function hexToHsl(hex: string): { h: number; s: number; l: number; c: number } {
  const value = parseInt(hex.slice(1), 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  if (chroma) {
    hue = max === r ? ((g - b) / chroma) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const saturation = chroma ? chroma / (1 - Math.abs(2 * lightness - 1)) : 0;
  return { h: hue, s: saturation, l: lightness, c: chroma };
}

/** Converts HSL components to a `#rrggbb` string. */
export function hslToRgb(h: number, s: number, l: number): string {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - chroma / 2;
  const [r, g, b] =
    h < 60
      ? [chroma, x, 0]
      : h < 120
        ? [x, chroma, 0]
        : h < 180
          ? [0, chroma, x]
          : h < 240
            ? [0, x, chroma]
            : h < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const channel = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v + m)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** Maps a light-theme color to its dark-theme counterpart (memoized). */
export function toDarkColor(color: string): string {
  const hex = normalizeHex(color);
  const cached = darkColorCache.get(hex);
  if (cached !== undefined) return cached;

  let mapped = DARK_SVG_OVERRIDES[hex] || DARK_OVERRIDES[hex];
  if (!mapped) {
    const { h, s, l, c } = hexToHsl(hex);
    if (c < 0.045 || (c < 0.13 && h >= 12 && h <= 62)) {
      // Neutral / warm-grey: invert lightness, keep a faint warm tint.
      const hue = c < 0.02 ? 34 : h;
      const inverted = l >= 0.885 ? 0.118 + (l - 0.92) * 0.9 : 1 - l;
      mapped = hslToRgb(hue, inverted < 0.5 ? 0.13 : 0.12, Math.max(0.06, Math.min(0.93, inverted)));
    } else {
      // Saturated: pale tints become deep fills, deep tones become light ink,
      // mid tones are kept as-is.
      mapped =
        l >= 0.66
          ? hslToRgb(h, Math.min(s, 0.5) * 0.6, 0.16 + (l - 0.66) * 0.55)
          : l >= 0.36
            ? hex
            : hslToRgb(h, Math.min(s, 0.6), 0.8);
    }
  }
  darkColorCache.set(hex, mapped);
  return mapped;
}

const isDarkTheme = () => typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark';

/** Rewrites colors in SVG markup for the active theme (no-op in light mode). */
export function themeMarkup(markup: string): string {
  return !markup || !isDarkTheme()
    ? markup
    : markup.replace(HEX_COLOR, (hex) =>
        hex.slice(1) === hex.slice(1).toLowerCase() || !/[A-F]/.test(hex) ? toDarkColor(hex) : hex,
      );
}
