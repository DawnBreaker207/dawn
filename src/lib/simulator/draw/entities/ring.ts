/**
 * Ring: a consistent-hashing ring on the floor — node arcs, direction
 * chevrons, node markers and key dots colored by their owning node.
 */
import { isoProject as iso, round, type Point } from '../iso';
import { boundsOf } from '../paths';
import { BLOCK_COLORS, INK } from '../palette';
import { buildPill } from '../pills';
import type { EntityRender } from '../types';

export interface RingNode {
  /** Angle on the ring (deg). */
  a: number;
  color: string;
  /** Draw a diamond marker at the node. */
  mark?: boolean;
}

export interface RingProps {
  type: string;
  x: number;
  y: number;
  /** Radius (world units). */
  r: number;
  nodes: RingNode[];
  /** Key angles (deg). */
  keys: number[];
  /** Keys that just moved to a new owner (highlighted). */
  moved: number[];
  opacity: number;
  label: string;
}

export const RING_DEFAULTS = { r: 10, nodes: [], keys: [], moved: [], opacity: 1, label: `` };

/** Node owning angle `angle`: the last node at or before it (wrapping to the last node). */
function ownerOf(angle: number, nodes: RingNode[]): RingNode {
  const sorted = [...nodes].sort((a, b) => a.a - b.a);
  let owner = sorted[sorted.length - 1];
  for (const n of sorted) if (n.a <= angle) owner = n;
  return owner;
}

export function renderRing(e: RingProps): EntityRender {
  const at = (deg: number, radius = e.r): Point => {
    const rad = (deg * Math.PI) / 180;
    return iso(e.x + radius * Math.cos(rad), e.y + radius * Math.sin(rad), 0);
  };
  const arc = (from: number, to: number, radius = e.r) => {
    let d = ``;
    const steps = Math.max(2, Math.ceil(Math.abs(to - from) / 3));
    for (let i = 0; i <= steps; i++) {
      const [sx, sy] = at(from + ((to - from) * i) / steps, radius);
      d += `${i ? `L` : `M`}${round(sx)},${round(sy)} `;
    }
    return d;
  };
  const nodes = [...e.nodes].sort((a, b) => a.a - b.a);

  let segments = ``;
  nodes.forEach((node, i) => {
    const next = nodes[(i + 1) % nodes.length];
    const end = next.a > node.a ? next.a : next.a + 360;
    segments += `<path d="${arc(node.a, end)}" fill="none" stroke="${BLOCK_COLORS[node.color].side[1]}" stroke-width="10" stroke-opacity=".55"/>`;
  });

  let chevrons = ``;
  for (let deg = 22; deg < 360; deg += 60) {
    const [x0, y0] = at(deg + 2.5, e.r + 1.4);
    const [x1, y1] = at(deg, e.r + 1.4);
    const angle = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    chevrons += `<path d="M-4,-3.5 L1,0 L-4,3.5" transform="translate(${round(x1)} ${round(y1)}) rotate(${round(angle)})" fill="none" stroke="#a59c90" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  const markers = nodes
    .filter((n) => n.mark)
    .map((n) => {
      const [sx, sy] = at(n.a);
      return `<path d="M${round(sx)},${round(sy - 6)} L${round(sx + 9)},${round(sy)} L${round(sx)},${round(sy + 6)} L${round(sx - 9)},${round(sy)} Z" fill="${BLOCK_COLORS[n.color].top[1]}" stroke="${INK}" stroke-width="1.4"/>`;
    })
    .join(``);

  const moved = new Set(e.moved || []);
  const keys = (e.keys || [])
    .map((k) => {
      const [sx, sy] = at(k);
      const owner = nodes.length ? ownerOf(k, nodes) : null;
      const fill = owner ? BLOCK_COLORS[owner.color].side[0] : `#fbf6ef`;
      return `${moved.has(k) ? `<circle class="moved" cx="${round(sx)}" cy="${round(sy)}" r="9" fill="none" stroke="#e5534b" stroke-width="2"/>` : ``}
        <circle cx="${round(sx)}" cy="${round(sy)}" r="4.6" fill="${fill}" stroke="${INK}" stroke-width="1.4"/>`;
    })
    .join(``);

  const ringPath = arc(0, 360);
  const [lx, ly] = at(135, e.r + 2.2);
  const body = `
    <g opacity="${round(e.opacity)}">
      <path d="${arc(0, 360, e.r + 0.9)}" fill="none" stroke="#e8ddcf" stroke-width="1"/>
      <path d="${ringPath}" fill="#fffaf2" fill-opacity=".35" stroke="${INK}" stroke-opacity=".55" stroke-width="1.5"/>
      ${segments}
      ${chevrons}
      ${markers}
      ${keys}
    </g>`;
  const over = e.label ? `<g opacity="${round(e.opacity)}">${buildPill(lx, ly - 12, e.label, { tone: `gray`, icon: `replay` })}</g>` : ``;
  const outline: Point[] = [];
  for (let deg = 0; deg < 360; deg += 15) outline.push(at(deg, e.r + 1.6));
  return { body, over, poly: null, bounds: boundsOf(outline, [10, 34, 10, 10]) };
}
