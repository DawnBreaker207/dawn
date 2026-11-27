export const SVG_NS = 'http://www.w3.org/2000/svg';

/** Creates an SVG element with the given attributes (in insertion order). */
export function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}): SVGElementTagNameMap[K] {
  // createElementNS in the SVG namespace returns the matching SVG element type.
  const el = document.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K];
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  return el;
}
