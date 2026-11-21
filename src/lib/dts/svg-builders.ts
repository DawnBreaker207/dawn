import { ICON_PATHS } from './icons';
import { pathsToSvgElements } from './icon-helpers';

export const buildFolderSvg = (variant: string) =>
  `<svg class="folder folder--${variant}" width="20" height="16" viewBox="0 0 20 16" aria-hidden="true"><path d="M1.2 3.2A2 2 0 0 1 3.2 1.2h4.1l2 2.2h7.5a2 2 0 0 1 2 2v8.4a2 2 0 0 1-2 2H3.2a2 2 0 0 1-2-2Z"/><path class="folder__lip" d="M1.2 6.2h17.6"/></svg>`;

export function buildIconSvg(
  name: string,
  {
    size = 16,
    stroke = 1.75,
    cls = ``,
    fill = `none`,
  }: { size?: number; stroke?: number; cls?: string; fill?: string } = {},
) {
  const paths = ICON_PATHS[name];
  if (!paths) throw Error(`Unknown icon: ${name}`);
  return `<svg class="i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${pathsToSvgElements(paths)}</svg>`;
}

export function buildIconCanvas(
  name: string,
  x: number,
  y: number,
  size = 22,
  {
    stroke = 1.9,
    color = `#1d1b19`,
    fill = `none`,
  }: { stroke?: number; color?: string; fill?: string } = {},
) {
  const paths = ICON_PATHS[name];
  const scale = size / 24;
  return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${scale})" fill="${fill}" stroke="${color}" stroke-width="${stroke / scale}" stroke-linecap="round" stroke-linejoin="round">${pathsToSvgElements(paths)}</g>`;
}
