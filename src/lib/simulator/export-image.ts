/**
 * Turns the live stage SVG into a PNG the learner can save or share.
 *
 * The stage is styled partly by CSS rules that only exist in the page, so a plain serialised SVG would lose
 * its colours once it is drawn on its own. We copy the computed values of the properties that matter onto a
 * clone first, then paint it on a canvas under a small caption strip.
 */

const COPIED_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'letter-spacing',
  'text-anchor',
  'display',
  'visibility',
] as const;

interface ExportOptions {
  title: string;
  caption: string;
  scale?: number;
}

function inlineStyles(source: Element, clone: Element): void {
  const computed = getComputedStyle(source);
  const target = clone as SVGElement;
  for (const prop of COPIED_PROPS) target.style.setProperty(prop, computed.getPropertyValue(prop));
  const srcKids = source.children;
  const cloneKids = clone.children;
  for (let i = 0; i < srcKids.length && i < cloneKids.length; i++) inlineStyles(srcKids[i], cloneKids[i]);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The diagram could not be turned into an image'));
    img.src = url;
  });
}

export async function stageToPng(svg: SVGSVGElement, { title, caption, scale = 2 }: ExportOptions): Promise<Blob> {
  const rect = svg.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (width === 0 || height === 0) throw new Error('The diagram is not visible');

  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineStyles(svg, clone);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const page = getComputedStyle(document.body);
  const background = page.getPropertyValue('--bg').trim() || page.backgroundColor || '#18181b';
  const foreground = page.getPropertyValue('--fg').trim() || '#f4f4f5';
  const dim = page.getPropertyValue('--fg-dim').trim() || '#a1a1aa';
  const accent = page.getPropertyValue('--accent').trim() || '#e11d48';

  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  try {
    const img = await loadImage(url);
    const strip = 56;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = (height + strip) * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');
    ctx.scale(scale, scale);

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height + strip);
    ctx.drawImage(img, 0, 0, width, height);

    ctx.fillStyle = accent;
    ctx.fillRect(0, height, width, 2);
    const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = foreground;
    ctx.font = `700 15px ${mono}`;
    ctx.fillText(title, 18, height + strip / 2 - 8);
    ctx.fillStyle = dim;
    ctx.font = `500 12px ${mono}`;
    ctx.fillText(caption, 18, height + strip / 2 + 11);
    ctx.textAlign = 'right';
    ctx.fillStyle = accent;
    ctx.font = `700 13px ${mono}`;
    ctx.fillText('dawn.io.vn', width - 18, height + strip / 2);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
