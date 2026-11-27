import { BLOCK_COLORS, INK } from './palette';

/** Shared SVG `<defs>` content: block gradients, filters, arrow markers, floor grid. */
export function buildDefs(): string {
  let gradients = ``;
  for (const [name, c] of Object.entries(BLOCK_COLORS))
    gradients += `
      <linearGradient id="g-${name}-top" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stop-color="${c.top[0]}"/><stop offset="1" stop-color="${c.top[1]}"/>
      </linearGradient>
      <linearGradient id="g-${name}-side" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c.side[0]}"/><stop offset="1" stop-color="${c.side[1]}"/>
      </linearGradient>`;
  return `
    ${gradients}
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E3D6F3"/><stop offset="1" stop-color="#C9B5E6"/>
    </linearGradient>
    <linearGradient id="screen-glare" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="cyl-sheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".3" stop-color="#fff" stop-opacity=".35"/>
      <stop offset=".55" stop-color="#fff" stop-opacity=".05"/>
      <stop offset="1" stop-color="#4b2f6b" stop-opacity=".08"/>
    </linearGradient>
    <filter id="blur-sm" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="blur-md" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="blur-lg" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6.5"/></filter>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="8.6" refY="5" markerWidth="5.2" markerHeight="5.2" orient="auto-start-reverse" markerUnits="strokeWidth">
      <path class="sim-arrow-head" d="M1,1.2 L9,5 L1,8.8 Z" fill="${INK}" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>
    </marker>
    <marker id="arrow-muted" viewBox="0 0 10 10" refX="8.6" refY="5" markerWidth="5.2" markerHeight="5.2" orient="auto-start-reverse" markerUnits="strokeWidth">
      <path class="sim-arrow-head-muted" d="M1,1.2 L9,5 L1,8.8 Z" fill="#a59c90" stroke="#a59c90" stroke-width="1" stroke-linejoin="round"/>
    </marker>
    <pattern id="iso-grid" patternUnits="userSpaceOnUse" x="0" y="-7" width="28" height="14">
      <path class="sim-iso-grid" d="M0 7 L14 0 L28 7 L14 14 Z" fill="none" stroke="#a8916f" stroke-opacity=".3" stroke-width=".8"/>
    </pattern>`;
}
