/**
 * Device: a client on a slab — a laptop by default, or a phone (`form: 'phone'`).
 */
import { isoProject as iso, round, verticalYMatrix, floorYMatrix } from '../iso';
import { boundsOf, roundedPolygonPath } from '../paths';
import { PILL_STEP, buildPill, tagStackPad, type Tag } from '../pills';
import { dropShadow, isoBox, isoPrism, prismFaces, type BoxSpec, type Prism } from '../prism';
import type { EntityRender } from '../types';

export interface DeviceProps {
  type: string;
  x: number;
  y: number;
  /** Slab width along world Y. */
  w: number;
  /** Slab depth along world X. */
  d: number;
  form?: string;
  label: string;
  tags: Tag[];
  opacity: number;
  lift: number;
  labelFade?: number;
  tagFade?: number;
}

export const DEVICE_DEFAULTS = { w: 6, d: 6, label: ``, tags: [], opacity: 1, lift: 0 };

const SLAB_H = 16;
const SLAB_STYLE = { stroke: `#3b3631`, sw: 1.5 };
const SCREEN_BODY = { top: `#8B8580`, front: `#3D3935`, left: `#6E6862` };

/** Tag pills stacked upward from (x, y) plus the device label pill. */
function devicePills(e: DeviceProps, labelX: number, labelY: number, tagX: number, tagY: number): string {
  let over = e.label ? `<g opacity="${round(e.labelFade ?? 1)}">${buildPill(labelX, labelY + 22, e.label, { icon: `user` })}</g>` : ``;
  let y = tagY;
  for (const tag of e.tags || []) {
    over += `<g transform="translate(0 ${round(y)})" opacity="${round(e.tagFade ?? 1)}">${buildPill(tagX, 0, tag.text, tag)}</g>`;
    y -= PILL_STEP;
  }
  return over ? `<g opacity="${round(e.opacity)}" transform="translate(0 ${round(-e.lift)})">${over}</g>` : ``;
}

export function renderDevice(e: DeviceProps): EntityRender {
  const x0 = e.x - e.d / 2;
  const x1 = e.x + e.d / 2;
  const y0 = e.y - e.w / 2;
  const y1 = e.y + e.w / 2;
  const slab = isoPrism({ x0, x1, y0, y1, h: SLAB_H, radius: 9 });
  const screen: BoxSpec = { x0: x0 + 0.7, x1: x0 + 1.05, y0: y0 + 0.9, y1: y1 - 0.9, z0: 19, z1: 66 };
  const keyboard: BoxSpec = { x0: screen.x1, x1: screen.x1 + 2.7, y0: screen.y0, y1: screen.y1, z0: 16, z1: 19 };
  const screenW = (screen.y1 - screen.y0) * 14;
  const screenH = screen.z1 - screen.z0;
  let keys = ``;
  const keysPerRow = Math.floor((screenW - 6) / 4.7);
  for (let row = 0; row < 4; row++)
    for (let k = 0; k < keysPerRow; k++)
      keys += `<rect x="${round(3 + k * 4.7)}" y="${round(2.5 + row * 4.3)}" width="3.8" height="3.3" rx=".7"/>`;
  const contentW = screenW - 6.8;
  const contentH = screenH - 8;
  // Browser window mock-up on the laptop screen.
  const display = `
    <rect x="3.4" y="3.4" width="${round(contentW)}" height="${round(contentH)}" rx="1.5" fill="#FBF8F4"/>
    <rect x="3.4" y="3.4" width="${round(contentW)}" height="7" rx="1.5" fill="#E4D9CB"/>
    <circle cx="6.6" cy="6.9" r="1" fill="#E5534B"/><circle cx="9.6" cy="6.9" r="1" fill="#EFB041"/><circle cx="12.6" cy="6.9" r="1" fill="#7FC278"/>
    <rect x="16" y="5" width="${round(contentW - 16)}" height="3.8" rx="1.9" fill="#FBF8F4"/>
    <rect x="7" y="14.5" width="${round(contentW - 7.2)}" height="12" rx="1.5" fill="url(#screen)"/>
    <rect x="7" y="29.5" width="${round((contentW - 7.2) * 0.62)}" height="2.6" rx="1.3" fill="#D6CCBF"/>
    <rect x="7" y="34" width="${round((contentW - 7.2) * 0.8)}" height="2.6" rx="1.3" fill="#D6CCBF"/>
    <rect x="3.4" y="3.4" width="${round(contentW)}" height="${round(contentH)}" rx="1.5" fill="url(#screen-glare)"/>`;
  const lift = e.lift;
  if (e.form === `phone`) return renderPhone(e, slab, SLAB_H);
  const body = `
    <g opacity="${round(e.opacity)}">
      ${dropShadow(slab, SLAB_H, lift, 0.2)}
      <g transform="translate(0 ${round(-lift)})">
        ${prismFaces(slab, `slab`, SLAB_STYLE)}
        <path d="${roundedPolygonPath([iso(screen.x0 - 0.3, screen.y0 - 0.3, 16), iso(screen.x0 - 0.3, screen.y1 + 0.3, 16), iso(keyboard.x1 + 0.3, keyboard.y1 + 0.3, 16), iso(keyboard.x1 + 0.3, keyboard.y0 - 0.3, 16)], 6)}" fill="#6b5236" opacity=".14" filter="url(#blur-sm)"/>
        ${isoBox(keyboard, { top: `#efeae4`, front: `#cfc8c0`, left: `#ddd6ce`, r: 2.5, sw: 1.4 })}
        <g transform="${floorYMatrix(keyboard.x0 + 0.15, keyboard.y0, keyboard.z1)}" fill="#fbf8f4" stroke="#b9b1a7" stroke-width=".55">
          ${keys}
          <rect x="${round(screenW / 2 - 10)}" y="21.5" width="20" height="9" rx="1.6"/>
        </g>
        ${isoBox(screen, { ...SCREEN_BODY, r: 3, sw: 1.5 })}
        <g transform="${verticalYMatrix(screen.x1, screen.y0, screen.z1)}">${display}</g>
      </g>
    </g>`;
  const [labelX, labelY] = iso(x1, y0, 0);
  const [tagX, tagY] = iso(screen.x0, (screen.y0 + screen.y1) / 2, screen.z1);
  return {
    body,
    over: devicePills(e, labelX, labelY, tagX, tagY - 22),
    poly: slab.outline.map(([x, y]) => [x, y - lift]),
    bounds: boundsOf([...slab.outline, [tagX, tagY]], tagStackPad(e.tags, tagX, slab.outline)),
  };
}

function renderPhone(e: DeviceProps, slab: Prism, slabH: number): EntityRender {
  const phone: BoxSpec = { x0: e.x - 0.2, x1: e.x + 0.25, y0: e.y - 1.2, y1: e.y + 1.2, z0: slabH + 1, z1: slabH + 64 };
  const screenW = (phone.y1 - phone.y0) * 14;
  const screenH = phone.z1 - phone.z0;
  const contentW = screenW - 5;
  // App mock-up on the phone screen.
  const display = `
    <rect x="2.5" y="2.5" width="${round(contentW)}" height="${round(screenH - 5)}" rx="3.5" fill="#FBF8F4"/>
    <rect x="${round(screenW / 2 - 4)}" y="3.6" width="8" height="2.2" rx="1.1" fill="#3D3935"/>
    <rect x="2.5" y="8" width="${round(contentW)}" height="7" fill="#E4D9CB"/>
    <rect x="5" y="19" width="${round(contentW * 0.62)}" height="7" rx="3" fill="#ECE6DC"/>
    <rect x="${round(2.5 + contentW * 0.32)}" y="29" width="${round(contentW * 0.6)}" height="7" rx="3" fill="#CBBAE6"/>
    <rect x="5" y="39" width="${round(contentW * 0.5)}" height="7" rx="3" fill="#ECE6DC"/>
    <rect x="5" y="${round(screenH - 12)}" width="${round(contentW - 5)}" height="5" rx="2.5" fill="#E4D9CB"/>
    <rect x="2.5" y="2.5" width="${round(contentW)}" height="${round(screenH - 5)}" rx="3.5" fill="url(#screen-glare)"/>`;
  const lift = e.lift;
  const body = `
    <g opacity="${round(e.opacity)}">
      ${dropShadow(slab, slabH, lift, 0.2)}
      <g transform="translate(0 ${round(-lift)})">
        ${prismFaces(slab, `slab`, SLAB_STYLE)}
        <path d="${roundedPolygonPath([iso(phone.x0 - 0.5, phone.y0 - 0.3, slabH), iso(phone.x0 - 0.5, phone.y1 + 0.3, slabH), iso(phone.x1 + 0.9, phone.y1 + 0.3, slabH), iso(phone.x1 + 0.9, phone.y0 - 0.3, slabH)], 5)}" fill="#6b5236" opacity=".16" filter="url(#blur-sm)"/>
        ${isoBox(phone, { ...SCREEN_BODY, r: 3.5, sw: 1.5 })}
        <g transform="${verticalYMatrix(phone.x1, phone.y0, phone.z1)}">${display}</g>
      </g>
    </g>`;
  const [labelX, labelY] = iso(e.x + e.d / 2, e.y - e.w / 2, 0);
  const [tagX, tagY] = iso(phone.x0, e.y, phone.z1);
  return {
    body,
    over: devicePills(e, labelX, labelY, tagX, tagY - 20),
    poly: slab.outline.map(([x, y]) => [x, y - lift]),
    bounds: boundsOf([...slab.outline, [tagX, tagY]], tagStackPad(e.tags, tagX, slab.outline)),
  };
}
