import { ICON_PATHS } from './icons';

const attrsToString = (attrs: Record<string, string>) =>
  Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(` `);

const pathsToSvgElements = (paths?: [string, Record<string, string>][]) =>
  (paths || []).map(([tag, attrs]) => `<${tag} ${attrsToString(attrs)}/>`).join(``);

export interface IconStyle {
  stroke?: number;
  color?: string;
  fill?: string;
}

/** Stroke icon centered at (x, y) with the given pixel size (unknown names render empty). */
export function iconMarkup(
  name: string,
  x: number,
  y: number,
  size = 22,
  { stroke = 1.9, color = `#1d1b19`, fill = `none` }: IconStyle = {},
): string {
  const paths = ICON_PATHS[name];
  const scale = size / 24;
  return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${scale})" fill="${fill}" stroke="${color}" stroke-width="${stroke / scale}" stroke-linecap="round" stroke-linejoin="round">${pathsToSvgElements(paths)}</g>`;
}
