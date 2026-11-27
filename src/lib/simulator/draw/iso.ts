/**
 * Dimetric 2:1 isometric projection.
 *
 *   sx = 14 · (x + y)
 *   sy =  7 · (x − y) − z
 */
export type Point = [number, number];
/** Axis-aligned rect as [minX, minY, maxX, maxY]. */
export type Rect = [number, number, number, number];

/** Rounds to 2 decimals (keeps SVG markup short and stable). */
export function round(val: number): number {
  return Math.round(val * 100) / 100;
}

/** Projects world (x, y, z) to screen (sx, sy). */
export function isoProject(x: number, y: number, z: number = 0): Point {
  return [round(14 * (x + y)), round(7 * (x - y) - z)];
}

/** SVG transform mapping local 2D content onto the vertical plane along the world Y axis at (x, y, z). */
export const verticalYMatrix = (x: number, y: number, z?: number) => {
  const [sx, sy] = isoProject(x, y, z);
  return `matrix(1 -0.5 0 1 ${sx} ${sy})`;
};

/** SVG transform mapping local 2D content onto the floor, text running along world +X. */
export const floorXMatrix = (x: number, y: number, z?: number) => {
  const [sx, sy] = isoProject(x, y, z);
  return `matrix(1 0.5 -1 0.5 ${sx} ${sy})`;
};

/** SVG transform mapping local 2D content onto a horizontal plane, running along world +Y. */
export const floorYMatrix = (x: number, y: number, z?: number) => {
  const [sx, sy] = isoProject(x, y, z);
  return `matrix(1 -0.5 1 0.5 ${sx} ${sy})`;
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
