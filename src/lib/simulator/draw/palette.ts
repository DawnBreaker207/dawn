/** Outline / text ink. */
export const INK = `#211e1b`;
/** Hard drop shadow under pills and cards. */
export const PILL_SHADOW = `#1c1a17`;

export interface Gradient2 {
  top: [string, string];
  side: [string, string];
}

/** Block colors: top-face and side-face gradient stops (see defs.ts `g-<name>-top|side`). */
export const BLOCK_COLORS: Record<string, Gradient2> = {
  orange: { top: [`#fee6cc`, `#fcd4ad`], side: [`#f9c697`, `#f3b47f`] },
  green: { top: [`#e2f2d7`, `#d1e9c2`], side: [`#c3e1b2`, `#b3d79f`] },
  blue: { top: [`#dfebf9`, `#cde0f5`], side: [`#bcd3ef`, `#a9c5e8`] },
  yellow: { top: [`#fff3d6`, `#fee7b8`], side: [`#fcdb9c`, `#f6cd82`] },
  purple: { top: [`#f2eaf9`, `#e6dbf4`], side: [`#d9cbef`, `#cbbae6`] },
  slab: { top: [`#f7f0e7`, `#f0e7dc`], side: [`#ece2d5`, `#e3d7c8`] },
  store: { top: [`#f6f1fa`, `#ece4f4`], side: [`#e2d8ee`, `#d6c9e6`] },
};

/** Pill background / text colors by tone. */
export const PILL_TONES: Record<string, { bg: string; fg: string }> = {
  paper: { bg: `#fbf6ef`, fg: INK },
  red: { bg: `#f8d5cf`, fg: `#8f2a22` },
  green: { bg: `#dcefd2`, fg: `#24521c` },
  amber: { bg: `#fbe5bd`, fg: `#6d4a0c` },
  violet: { bg: `#e7ddf5`, fg: `#47306f` },
  gray: { bg: `#ebe5dc`, fg: `#5f5850` },
};

/** Load color: green below 60%, amber below 85%, red above. */
export const loadColor = (load: number) => (load < 0.6 ? `#7fc278` : load < 0.85 ? `#efb041` : `#e5534b`);
