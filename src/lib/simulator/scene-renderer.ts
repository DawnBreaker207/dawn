// @ts-nocheck
/* eslint-disable */
/**
 * scene-renderer.ts
 * Renders a DTS lesson step scene to an SVG string using the actual
 * entity renderers from runtime-draw.ts (Zr=block, li=device, fi=db, …).
 * This replicates the visual output of the bundle without the iframe.
 */
import {
  round as A,
  isoProject as j,
  buildDefs,
  ENTITY_RENDERERS as Oi,
  ENTITY_DEFAULTS as ki,
  entitySortKey as Mi,
  entityCenter as ji,
  trimPathStart as Tr,
  trimPathEnd as Er,
  smoothPath as Cr,
  buildPill,
} from './runtime-draw';

/** Merge entity with its type defaults (mirrors np() in runtime-app.ts) */
function normalize(e) {
  return { ...(ki[e.type] ?? {}), ...e };
}

/**
 * Resolve a link point reference to ISO grid [x, y].
 * pt can be:
 *   - a string like 'dev' or 'web+1'      → entity center ± offset
 *   - an array like ['web', 'dev']         → mixed entity/coord refs
 *   - a plain [number, number] array       → pass through
 */
function resolveIsoPoint(pt, getCenter) {
  const lookupAxis = (str, axis) => {
    const m = /^([\w-]+?)([+-][\d.]+)?$/.exec(str);
    return getCenter(m[1])[axis] + (m[2] ? parseFloat(m[2]) : 0);
  };
  if (typeof pt === 'string') return [lookupAxis(pt, 0), lookupAxis(pt, 1)];
  const [a, b] = pt;
  return [
    typeof a === 'string' ? lookupAxis(a, 0) : a,
    typeof b === 'string' ? lookupAxis(b, 1) : b,
  ];
}

/** Compute axis-aligned bounds [minX, minY, maxX, maxY] of a point array */
function ptsBounds(pts) {
  let [mx, my, Mx, My] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of pts) {
    if (x < mx) mx = x; if (x > Mx) Mx = x;
    if (y < my) my = y; if (y > My) My = y;
  }
  return [mx, my, Mx, My];
}
function expandBounds(c, b) {
  return [Math.min(c[0], b[0]), Math.min(c[1], b[1]), Math.max(c[2], b[2]), Math.max(c[3], b[3])];
}

export interface SceneInput {
  entities: Record<string, Record<string, unknown>>;
  links?: Record<string, Record<string, unknown>>;
  flows?: Record<string, unknown>[];
}

/**
 * Render a scene to inner SVG content (no <svg> wrapper).
 * Returns { inner, viewBox } — caller assembles the full <svg>.
 * `aspect` is the stage's width/height so the camera fits like the bundle.
 */
export function renderScene(scene: SceneInput, opts: { aspect?: number } = {}): { inner: string; viewBox: string } {
  // 1. Normalize all entities
  const ents: Record<string, any> = {};
  for (const [id, e] of Object.entries(scene.entities ?? {})) {
    ents[id] = normalize(e as any);
  }

  // 2. Sort by depth (painter's algorithm — same as bundle)
  const sorted = Object.entries(ents).sort(([, a], [, b]) => Mi(a) - Mi(b));

  // 3. Render entities, collect polys + bounds
  const polys: Record<string, any> = {};
  let bodies = '';
  let overlays = '';
  let bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];

  for (const [i, [id, ent]] of sorted.entries()) {
    const renderer = Oi[ent.type];
    if (!renderer) continue;
    const result = renderer(ent);
    polys[id] = result.poly;
    // Entry animation: fade + rise, staggered by paint order (see dts-anim in DtsSceneRenderer)
    bodies += `<g class="dts-ent" style="animation-delay:${Math.min(i, 8) * 35}ms">${result.body ?? ''}</g>`;
    overlays += result.over ?? '';
    if (result.bounds) bounds = expandBounds(bounds, result.bounds);
  }

  // 4. Render links
  // getCenter: entityId → ISO grid [x, y] center
  const getCenter = (id: string) => ji(ents[id] ?? { x: 0, y: 0, type: 'block' });

  let linksSvg = '';
  const linkPaths: Record<string, string> = {};
  for (const [id, lk] of Object.entries(scene.links ?? {})) {
    // Convert pts to screen coords
    let pts: [number, number][] = (lk.pts ?? []).map(
      (pt) => j(...resolveIsoPoint(pt, getCenter)) as [number, number]
    );

    // Trim path so it doesn't overlap the entity shapes
    if (polys[lk.from]) pts = Tr(pts, polys[lk.from], 3);
    if (lk.to && polys[lk.to]) {
      pts = Er(pts, polys[lk.to], lk.heads === 'none' ? 3 : 4);
    }
    if (pts.length < 2) continue;

    // Smooth bezier path — bundle uses tension=9
    const d = Cr(pts, 9);
    linkPaths[id] = d;
    const muted = lk.style === 'off';
    const color = muted ? '#a59c90' : '#211e1b';
    const dash = muted ? 'stroke-dasharray="5 4"' : '';
    // muted links use arrow-muted (gray), matching bundle's runtime-app.ts updateLinks()
    const arrowUrl = muted ? 'url(#arrow-muted)' : 'url(#arrow)';
    const me = lk.heads !== 'none' ? `marker-end="${arrowUrl}"` : '';
    const ms = lk.heads === 'both' ? `marker-start="${arrowUrl}"` : '';
    const sw = lk.sw ?? 1.9;
    // Non-dashed links draw themselves in; dashed (muted) links stay static
    const draw = muted ? 'class="dts-link dts-link--muted"' : 'class="dts-link" pathLength="1"';

    linksSvg += `<path ${draw} d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${dash} ${me} ${ms}/>`;

    // Link label — pill above the path midpoint, same builder the bundle uses
    if (lk.label) {
      const mid = Math.floor(pts.length / 2);
      const [lx, ly] = pts[mid] ?? [0, 0];
      linksSvg += buildPill(lx, ly - 12, lk.label, {
        tone: lk.labelTone || (muted ? 'gray' : 'paper'),
        size: 10,
      });
      const pillW = lk.label.length * 6.8 + 16;
      bounds = expandBounds(bounds, [lx - pillW / 2, ly - 22, lx + pillW / 2, ly - 2]);
    }

    // Update bounds for link points
    for (const [x, y] of pts) {
      bounds = expandBounds(bounds, [x - 3, y - 3, x + 3, y + 3]);
    }
  }

  // 5. Packet flows — animated along the route's link paths (SMIL, no JS)
  let packetsSvg = '';
  for (const fl of scene.flows ?? []) {
    const route = ((fl.route as string[]) ?? []).map((id) => linkPaths[id]).filter(Boolean);
    if (!route.length) continue;
    const path = route.join(' ');
    const rate = Number(fl.rate) || 1;
    const dur = Math.min(4, Math.max(1.2, 2 / rate));
    const ping = fl.kind === 'ping';
    const fill = ping ? '#f4fbef' : '#f3b47f';
    const stroke = ping ? '#2f8a43' : '#211e1b';
    const kp = fl.bounce ? ' keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear"' : '';
    for (let i = 0; i < 3; i++) {
      const begin = i === 0 ? '0s' : `-${A((i * dur) / 3)}s`;
      packetsSvg += `<circle class="dts-packet" r="${ping ? 3.6 : 3}" fill="${fill}" stroke="${stroke}" stroke-width="${ping ? 2.1 : 1.5}"><animateMotion dur="${dur}s" begin="${begin}" repeatCount="indefinite"${kp} path="${path}"/></circle>`;
    }
  }

  // 6. Camera — fit content into stage bounds matching bundle's planFor()
  const finite = Number.isFinite(bounds[0]) && Number.isFinite(bounds[3]);
  const [a, o, s, c] = finite ? bounds : [-100, -100, 100, 100];
  const r = Math.max(1, opts.width || 670);
  const i = Math.max(1, opts.height || 420);
  const l = Math.max(1, s - a);
  const u = Math.max(1, c - o);
  const p = Math.min(1.6, (r - 32) / l, (i - 32) / u);
  const e = Math.max(0.3, Math.floor(p * 20 + 1e-6) / 20);
  const sOffset = (r - l * e) / 2;
  const cOffset = (i - u * e) / 2;
  const vbX = A(a - sOffset / e);
  const vbY = A(o - cOffset / e);
  const vbW = A(r / e);
  const vbH = A(i / e);
  const cx = A((a + s) / 2);
  const cy = A((o + c) / 2);

  // 7. SVG defs (gradients, filters, markers) + fading iso grid behind the scene
  const defs = buildDefs();
  const gridR = A(Math.max(vbW, vbH) * 0.56);
  const gridDefs = `
    <radialGradient id="grid-fade" gradientUnits="userSpaceOnUse" cx="${A(cx)}" cy="${A(cy)}" r="${gridR}" gradientTransform="translate(${A(cx)} ${A(cy)}) scale(1 0.6) translate(${A(-cx)} ${A(-cy)})">
      <stop offset="0" stop-color="#fff"/><stop offset=".42" stop-color="#fff" stop-opacity=".92"/><stop offset=".78" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <mask id="grid-mask"><rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid-fade)"/></mask>`;
  const gridRects = `
    <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid-fade)"/>
    <rect class="stage-grid" x="-5000" y="-5000" width="10000" height="10000" fill="url(#iso-grid)" mask="url(#grid-mask)"/>`;

  const inner = `
    <defs>${defs}${gridDefs}</defs>
    ${gridRects}
    ${bodies}
    ${linksSvg}
    ${packetsSvg}
    ${overlays}
  `;

  return { inner, viewBox: `${vbX} ${vbY} ${A(vbW)} ${A(vbH)}` };
}
