// @ts-nocheck
/* eslint-disable */
import { buildIconCanvas } from './svg-builders';
// bind to single-letter name used throughout this module
var a = buildIconCanvas;
// stub i18n helpers (unused in rendering path, but referenced at module level)
var nr = 'en', rr = null, ir = new Map();
var cr = () => false;
var pr = (x) => x;
var or = () => nr;
var lr = (e: string) => e.toLocaleUpperCase(or().split(`-u-`)[0]);
function mr(e, t) {
  ((nr = e), (rr = cr(e) ? pr(t) : t), ir.clear());
}
var hr = (e) => (cr() ? pr(e) : e),
  D = (e) => e;
function O(e, t) {
  let n = (nr !== `en` && rr[e]) || e;
  return (t && (n = n.replace(/\{(\w+)\}/g, (e, n) => (n in t ? t[n] : e))), n);
}
function gr(e, t) {
  let n = `${or()}|${t ? JSON.stringify(t) : ``}`;
  return (ir.has(n) || ir.set(n, new Intl.NumberFormat(or(), t)), ir.get(n).format(e));
}
var k = `#211e1b`,
  _r = `#1c1a17`,
  vr = {
    orange: { top: [`#fee6cc`, `#fcd4ad`], side: [`#f9c697`, `#f3b47f`] },
    green: { top: [`#e2f2d7`, `#d1e9c2`], side: [`#c3e1b2`, `#b3d79f`] },
    blue: { top: [`#dfebf9`, `#cde0f5`], side: [`#bcd3ef`, `#a9c5e8`] },
    yellow: { top: [`#fff3d6`, `#fee7b8`], side: [`#fcdb9c`, `#f6cd82`] },
    purple: { top: [`#f2eaf9`, `#e6dbf4`], side: [`#d9cbef`, `#cbbae6`] },
    slab: { top: [`#f7f0e7`, `#f0e7dc`], side: [`#ece2d5`, `#e3d7c8`] },
    store: { top: [`#f6f1fa`, `#ece4f4`], side: [`#e2d8ee`, `#d6c9e6`] },
  };

/**
 * Rounds a floating point number to 2 decimal places.
 */
export function round(val: number): number {
  return Math.round(val * 100) / 100;
}
const A = round;

/**
 * Dimetric 2:1 isometric projection from 3D space (x, y, z) to 2D SVG canvas (sx, sy).
 * Standard: tile half-width = 14, tile half-height = 7.
 */
export function isoProject(x: number, y: number, z: number = 0): [number, number] {
  return [round(14 * (x + y)), round(7 * (x - y) - z)];
}
export const projectIso = isoProject;
const j = isoProject;

const yr = (e: number, t: number, n?: number) => {
  let [r, i] = j(e, t, n);
  return `matrix(1 -0.5 0 1 ${r} ${i})`;
};
const br = (e: number, t: number, n?: number) => {
  let [r, i] = j(e, t, n);
  return `matrix(1 0.5 -1 0.5 ${r} ${i})`;
};
const xr = (e: number, t: number, n?: number) => {
  let [r, i] = j(e, t, n);
  return `matrix(1 -0.5 1 0.5 ${r} ${i})`;
};
function Sr(e, t) {
  let n = e.length,
    r = (e) => (Array.isArray(t) ? t[e] : t),
    i = (e, t, n) => {
      let r = t[0] - e[0],
        i = t[1] - e[1],
        a = Math.hypot(r, i) || 1,
        o = Math.min(n, a / 2) / a;
      return [e[0] + r * o, e[1] + i * o];
    },
    a = ``;
  for (let t = 0; t < n; t++) {
    let o = e[(t - 1 + n) % n],
      s = e[t],
      c = e[(t + 1) % n],
      l = i(s, o, r(t)),
      u = i(s, c, r(t));
    a += `${t === 0 ? `M` : `L`}${A(l[0])},${A(l[1])} Q${A(s[0])},${A(s[1])} ${A(u[0])},${A(u[1])} `;
  }
  return a + `Z`;
}
function Cr(e, t = 10) {
  let n = `M${A(e[0][0])},${A(e[0][1])}`;
  for (let r = 1; r < e.length - 1; r++) {
    let [i, a] = e[r - 1],
      [o, s] = e[r],
      [c, l] = e[r + 1],
      u = Math.hypot(o - i, s - a),
      d = Math.hypot(c - o, l - s);
    if (u < 0.01 || d < 0.01) continue;
    let f = Math.min(t, u / 2, d / 2),
      p = o + ((i - o) / u) * f,
      m = s + ((a - s) / u) * f,
      h = o + ((c - o) / d) * f,
      g = s + ((l - s) / d) * f;
    n += ` L${A(p)},${A(m)} Q${A(o)},${A(s)} ${A(h)},${A(g)}`;
  }
  let r = e[e.length - 1];
  return n + ` L${A(r[0])},${A(r[1])}`;
}
function wr([e, t], n) {
  let r = 0;
  for (let i = 0; i < n.length; i++) {
    let [a, o] = n[i],
      [s, c] = n[(i + 1) % n.length],
      l = (s - a) * (t - o) - (c - o) * (e - a);
    if (!(Math.abs(l) < 1e-9)) {
      if (r === 0) r = Math.sign(l);
      else if (Math.sign(l) !== r) return !1;
    }
  }
  return !0;
}
function Tr(e, t, n) {
  if (!t || !wr(e[0], t)) return e;
  for (let r = 0; r < e.length - 1; r++) {
    let i = e[r],
      a = e[r + 1];
    if (wr(a, t)) continue;
    let o = 0,
      s = 1;
    for (let e = 0; e < 30; e++) {
      let e = (o + s) / 2;
      wr([i[0] + (a[0] - i[0]) * e, i[1] + (a[1] - i[1]) * e], t) ? (o = e) : (s = e);
    }
    let c = Math.hypot(a[0] - i[0], a[1] - i[1]) || 1,
      l = Math.min(1, s + n / c);
    return [[i[0] + (a[0] - i[0]) * l, i[1] + (a[1] - i[1]) * l], ...e.slice(r + 1)];
  }
  return e;
}
var Er = (e, t, n) => Tr([...e].reverse(), t, n).reverse(),
  Dr = /[\p{Script=Arabic}\p{Script=Hebrew}]/u,
  Or = (e) => (cr() && Dr.test(String(e).replace(/<[^>]+>/g, ``)) ? `rtl` : `ltr`),
  kr = (e) => (cr() ? ` direction="${Or(e)}"` : ``),
  Ar = (e, t, n, r = 12.5, i = 700, a = ``) =>
    `<text x="${A(e)}" y="${A(t)}" text-anchor="middle" font-size="${r}" font-weight="${i}" fill="${k}"${kr(n)} ${a}>${n}</text>`;
function jr() {
  let e = ``;
  for (let [t, n] of Object.entries(vr))
    e += `
      <linearGradient id="g-${t}-top" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stop-color="${n.top[0]}"/><stop offset="1" stop-color="${n.top[1]}"/>
      </linearGradient>
      <linearGradient id="g-${t}-side" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${n.side[0]}"/><stop offset="1" stop-color="${n.side[1]}"/>
      </linearGradient>`;
  return `
    ${e}
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
      <path d="M1,1.2 L9,5 L1,8.8 Z" fill="${k}" stroke="${k}" stroke-width="1" stroke-linejoin="round"/>
    </marker>
    <marker id="arrow-muted" viewBox="0 0 10 10" refX="8.6" refY="5" markerWidth="5.2" markerHeight="5.2" orient="auto-start-reverse" markerUnits="strokeWidth">
      <path d="M1,1.2 L9,5 L1,8.8 Z" fill="#a59c90" stroke="#a59c90" stroke-width="1" stroke-linejoin="round"/>
    </marker>
    <pattern id="iso-grid" patternUnits="userSpaceOnUse" x="0" y="-7" width="28" height="14">
      <path d="M0 7 L14 0 L28 7 L14 14 Z" fill="none" stroke="#a8916f" stroke-opacity=".3" stroke-width=".8"/>
    </pattern>`;
}
var Mr = (e) => Math.max(0, Math.min(1, e)),
  Nr = {
    paper: { bg: `#fbf6ef`, fg: k },
    red: { bg: `#f8d5cf`, fg: `#8f2a22` },
    green: { bg: `#dcefd2`, fg: `#24521c` },
    amber: { bg: `#fbe5bd`, fg: `#6d4a0c` },
    violet: { bg: `#e7ddf5`, fg: `#47306f` },
    gray: { bg: `#ebe5dc`, fg: `#5f5850` },
  },
  Pr = /^[\u0000-\u058F\u1E00-\u1FFF\u2000-\u2BFF\u2E00-\u2E7F]*$/u,
  Fr = new Map(),
  Ir = null,
  Lr = ``;
typeof document < `u` &&
  document.fonts &&
  document.fonts.addEventListener(`loadingdone`, () => Fr.clear());
var Rr = (e, t) => {
  if (((e = String(e)), Pr.test(e) || typeof document > `u`))
    return e.replace(/[‎‏⁦-⁩]/g, ``).length * t * 0.6;
  let n = `${t}|${e}`,
    r = Fr.get(n);
  return (
    r === void 0 &&
      (Ir ||
        ((Ir = document.createElement(`canvas`).getContext(`2d`)),
        (Lr =
          getComputedStyle(document.documentElement).getPropertyValue(`--font`).trim() ||
          `monospace`)),
      (Ir.font = `700 ${t}px ${Lr}`),
      (r = Ir.measureText(e).width),
      Fr.set(n, r)),
    r
  );
};
function zr(e, t, n, { tone: r = `paper`, size: i = 10.5, icon: o = null } = {}) {
  let s = Nr[r] || Nr.paper,
    c = o ? 15 : 0,
    { lines: l, tw: u, h: d } = Vr(n, i),
    f = u + 18 + c,
    p = e - f / 2,
    m = t - d / 2,
    h = Br(i),
    g = l
      .map(
        (e, n) =>
          `<text x="${A(p + 9 + c + u / 2)}" y="${A(t + i * 0.36 + (n - (l.length - 1) / 2) * h)}" text-anchor="middle" font-size="${i}" font-weight="700" fill="${s.fg}"${kr(e)}>${e}</text>`,
      )
      .join(``);
  return `
    <g class="pill">
      <rect x="${A(p)}" y="${A(m + 2)}" width="${A(f)}" height="${d}" rx="10.5" fill="${_r}"/>
      <rect x="${A(p)}" y="${A(m)}" width="${A(f)}" height="${d}" rx="10.5" fill="${s.bg}" stroke="${k}" stroke-width="1.3"/>
      ${o ? a(o, p + 9 + 6, t, 12, { stroke: 2.2, color: s.fg }) : ``}
      ${g}
    </g>`;
}
var Br = (e) => Math.round(e * 1.3);
function Vr(e, t) {
  let n = String(e).split(`
`);
  return { lines: n, tw: Math.max(...n.map((e) => Rr(e, t))), h: 21 + (n.length - 1) * Br(t) };
}
var Hr = (e) =>
    Math.max(
      0,
      e.cpu >= 0 ? 43 : 0,
      ...(e.tags || []).map((e) => (Rr(e.text, 10.5) + 18 + (e.icon ? 15 : 0)) / 2),
    ),
  Ur = (e, t, n) => (n ? [Math.min(e[0], t - n - 5), e[1], Math.max(e[2], t + n + 5), e[3]] : e);
function Wr(e, t, n) {
  let r = Math.round(Mr(n) * 100),
    i = n < 0.6 ? `#7fc278` : n < 0.85 ? `#efb041` : `#e5534b`,
    o = e - 43,
    s = t - 21 / 2,
    c = o + 23;
  return `
    <g class="pill">
      <rect x="${A(o)}" y="${A(s + 2)}" width="86" height="21" rx="${21 / 2}" fill="${_r}"/>
      <rect x="${A(o)}" y="${A(s)}" width="86" height="21" rx="${21 / 2}" fill="#fbf6ef" stroke="${k}" stroke-width="1.3"/>
      ${a(`cpu`, o + 13, t, 11, { stroke: 2.2, color: `#6f6961` })}
      <rect x="${A(c)}" y="${A(t - 3.5)}" width="28" height="7" rx="3.5" fill="#e6ddd0"/>
      <rect x="${A(c)}" y="${A(t - 3.5)}" width="${A(Math.max(3, 28 * Mr(n)))}" height="7" rx="3.5" fill="${i}"/>
      <text x="${A(o + 86 - 9)}" y="${A(t + 3.6)}" text-anchor="end" font-size="10.5" font-weight="800" fill="${k}">${r}%</text>
    </g>`;
}
function Gr({ x0: e, x1: t, y0: n, y1: r, h: i, radius: a = 9 }) {
  let o = j(e, r, i),
    s = j(t, r, i),
    c = j(t, n, i),
    l = j(e, n, i),
    u = j(t, r, 0),
    d = j(t, n, 0),
    f = j(e, n, 0),
    p = Math.max(1, Math.min(a, i / 2 - 0.5)),
    m = j((e + t) / 2, (n + r) / 2, i)[1],
    h = [o, s, u, d, f, l];
  return {
    T: o,
    R: s,
    B: c,
    L: l,
    Rd: u,
    Bd: d,
    Ld: f,
    ty: m,
    outline: h,
    sil: Sr(h, [a + 1, p, p, a + 3, p, p]),
    top: Sr([o, s, c, l], [a + 1, p, 6, p]),
    sheen: Sr(
      [o, s, c, l].map(([e, t]) => [e, t - 3 + (t - m) * -0.25]),
      [a + 1, p, 6, p],
    ),
    right: Sr([c, s, u, d], [6, p, p, a + 3]),
    bevel: Cr([l, c, s], 8),
  };
}
function Kr(e, t, { stroke: n = k, sw: r = 1.9 } = {}) {
  return `
    <path d="${e.sil}" fill="url(#g-${t}-side)"/>
    <path d="${e.right}" fill="#3a2a14" opacity=".05"/>
    <path d="${e.top}" fill="url(#g-${t}-top)"/>
    <path d="${e.sheen}" fill="#fff" opacity=".22" filter="url(#blur-sm)"/>
    <path d="${e.bevel}" transform="translate(0 1.4)" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.6" stroke-linecap="round"/>
    <path d="${e.bevel}" transform="translate(0 3.4)" fill="none" stroke="#5a4123" stroke-opacity=".07" stroke-width="2.4" stroke-linecap="round"/>
    <path d="${e.sil}" fill="none" stroke="${n}" stroke-width="${r}" stroke-linejoin="round"/>`;
}
var qr = (e, t, n, r) => {
    let i = Math.min(9, 3 + t * 0.15),
      a = 1 - Math.min(1, n / 140) * 0.85;
    return `<path d="${e.sil}" transform="translate(0 ${A(i + n)})" fill="#6b5236" opacity="${A(r * a)}" filter="url(#blur-lg)"/>`;
  },
  Jr = (e, t = [0, 0, 0, 0]) => {
    let n = e.map((e) => e[0]),
      r = e.map((e) => e[1]);
    return [
      Math.min(...n) - t[0],
      Math.min(...r) - t[1],
      Math.max(...n) + t[2],
      Math.max(...r) + t[3],
    ];
  },
  Yr = {
    server: (e, t, n = 1) => `
    <g transform="translate(${A(e)} ${A(t)}) scale(${n})" fill="none" stroke="${k}" stroke-width="1.9" stroke-linecap="round">
      <rect x="-11" y="-10" width="22" height="8.5" rx="2.2"/>
      <rect x="-11" y="1.5" width="22" height="8.5" rx="2.2"/>
      <path d="M-6.5 -5.75h.01M-6.5 5.75h.01" stroke-width="2.6"/>
      <path d="M1 -5.75h5.5M1 5.75h5.5"/>
    </g>`,
    balancer: (e, t, n = 1) => `
    <g transform="translate(${A(e)} ${A(t)}) scale(${n})" fill="none" stroke="${k}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="-8" cy="0" r="3" fill="${k}"/>
      <path d="M-5 0h4M-1 0 C 3 0 3 -8 8 -8M-1 0 C 3 0 3 8 8 8M-1 0h9"/>
      <path d="M5.5 -10.5l3 2.5-3 2.5M5.5 -2.5l3 2.5-3 2.5M5.5 5.5l3 2.5-3 2.5"/>
    </g>`,
  },
  Xr = {
    s: 4,
    h: 46,
    color: `blue`,
    glyph: `server`,
    label: [],
    sub: ``,
    heat: 0,
    dead: 0,
    dim: 0,
    opacity: 1,
    lift: 0,
    cpu: -1,
    tags: [],
    pills: `above`,
  };
function Zr(e) {
  let t = e.s / 2,
    n = Gr({ x0: e.x - t, x1: e.x + t, y0: e.y - t, y1: e.y + t, h: e.h, radius: e.radius ?? 9 }),
    r = e.lift,
    i = n.T[0],
    o = n.ty,
    s = 1 - e.dead * 0.5 - e.dim * 0.35,
    c = e.label || [],
    l = o + (e.s * 14 * 0.5 + e.h) * 0.4,
    u = ``;
  u = c.length
    ? c.length === 1 && !e.sub
      ? Ar(i, l + 4.5, c[0], 13.5, 800)
      : c.length === 1
        ? `${Ar(i, l, c[0], 13.5, 800)}${Ar(i, l + 14, e.sub, 10, 600)}`
        : e.sub
          ? `${Ar(i, l - 9, c[0], 13, 800)}${Ar(i, l + 6.5, c[1], 13, 800)}${Ar(i, l + 20.5, e.sub, 10, 600)}`
          : `${Ar(i, l - 3.5, c[0], 13, 800)}${Ar(i, l + 12, c[1], 13, 800)}`
    : ``;
  let d = e.s >= 6 ? 1.15 : e.s < 3.5 ? 0.8 : 1,
    f = Yr[e.glyph]
      ? Yr[e.glyph](i, c.length ? o - 1 : o + 2, d)
      : e.glyph
        ? a(e.glyph, i, o - 1, 24, { stroke: 1.9 })
        : ``,
    p =
      e.dead > 0.01
        ? `<g opacity="${A(e.dead)}" stroke="#c0392b" stroke-width="3.2" stroke-linecap="round">
         <path d="M${A(i - 9)},${A(o - 10)} L${A(i + 9)},${A(o + 8)} M${A(i + 9)},${A(o - 10)} L${A(i - 9)},${A(o + 8)}"/>
       </g>`
        : ``,
    m = `
    <g opacity="${A(e.opacity)}">
      ${qr(n, e.h, r, 0.26)}
      <g transform="translate(0 ${A(-r)})">
        ${e.heat > 0.01 ? `<g class="pulse"><path d="${n.sil}" fill="#f0552f" opacity="${A(e.heat * 0.7)}" filter="url(#glow)"/></g>` : ``}
        ${Kr(n, e.color)}
        ${e.heat > 0.01 ? `<path d="${n.sil}" fill="#f0552f" opacity="${A(e.heat * 0.3)}"/>` : ``}
        ${e.dead > 0.01 ? `<path d="${n.sil}" fill="#b9b2a8" opacity="${A(e.dead * 0.62)}"/><path d="${n.sil}" fill="none" stroke="${k}" stroke-width="1.9" stroke-linejoin="round"/>` : ``}
        ${e.dim > 0.01 ? `<path d="${n.sil}" fill="#f4ebe0" opacity="${A(e.dim * 0.45)}"/>` : ``}
        <g opacity="${A(s)}">${e.dead > 0.5 ? `` : f}<g opacity="${A(e.labelFade ?? 1)}">${u}</g></g>
        ${p}
      </g>
    </g>`,
    h = ``,
    g = e.pills === `below`,
    _ = g ? n.Bd[1] - r + 20 : n.T[1] - r - 17,
    v = [];
  e.cpu >= 0 && v.push(Wr(i, 0, e.cpu));
  for (let t of e.tags || [])
    v.push(`<g opacity="${A(e.tagFade ?? 1)}">${zr(i, 0, t.text, t)}</g>`);
  for (let e of v) ((h += `<g transform="translate(0 ${A(_)})">${e}</g>`), (_ += g ? 26 : -26));
  return (
    (h = h ? `<g opacity="${A(e.opacity)}">${h}</g>` : ``),
    {
      body: m,
      over: h,
      poly: n.outline.map(([e, t]) => [e, t - r]),
      bounds: Ur(
        Jr(
          n.outline,
          g ? [8, 8, 8, 14 + v.length * 26] : [8, 8 + Math.max(v.length, 1) * 26, 8, 14],
        ),
        i,
        Hr(e),
      ),
    }
  );
}
var Qr = { count: 0, label: ``, opacity: 1, lift: 0 },
  $r = [`#F3B47F`, `#A9C5E8`, `#B3D79F`, `#CBBAE6`, `#F6CD82`],
  ei = 1.75,
  ti = (e, t) => {
    let n = Math.sin(e * 127.1 + t * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
function ni(e, t, n, r, i) {
  let [a, o] = j(e, t, n),
    s = (0.35 + 0.65 * r) * 1.3;
  return `
    <g opacity="${A(r)}" transform="translate(${A(a)} ${A(o - (1 - r) * 10)}) scale(${A(s)})">
      <ellipse cx="0" cy="0" rx="5.6" ry="2.8" fill="#6b5236" opacity=".18"/>
      <path d="M-5.2,0 V-9 A5.2,5.2 0 0 1 5.2,-9 V0 A5.2,2.4 0 0 1 -5.2,0 Z" fill="${i}" stroke="${k}" stroke-width="1.25"/>
      <circle cx="0" cy="-17.6" r="4.3" fill="#fdf6ec" stroke="${k}" stroke-width="1.25"/>
    </g>`;
}
function ri(e) {
  let t = Gr({ x0: e.x0, x1: e.x1, y0: e.y0, y1: e.y1, h: 10, radius: 8 }),
    n = (e.x0 + e.x1) / 2,
    r = (e.y0 + e.y1) / 2,
    i = (e.x1 - e.x0) / 2 - 0.85,
    a = (e.y1 - e.y0) / 2 - 0.85,
    o = Math.floor(i / ei),
    s = Math.floor(a / ei),
    c = [];
  for (let e = -o; e <= o; e++)
    for (let t = -s; t <= s; t++) c.push({ i: e, j: t, key: Math.abs(e) + ti(e, t) * 1.6 });
  c.sort((e, t) => e.key - t.key);
  let l = c
      .map((t, n) => ({ ...t, a: Mr(e.count - n) }))
      .filter((e) => e.a > 0.01)
      .sort((e, t) => e.i - e.j - (t.i - t.j))
      .map((e) =>
        ni(n + e.i * ei, r + e.j * ei, 10, e.a, $r[Math.abs(e.i * 3 + e.j * 7) % $r.length]),
      )
      .join(``),
    u = e.lift,
    d = `
    <g opacity="${A(e.opacity)}">
      ${qr(t, 10, u, 0.2)}
      <g transform="translate(0 ${A(-u)})">
        ${Kr(t, `slab`, { stroke: `#3b3631`, sw: 1.5 })}
        ${l}
      </g>
    </g>`,
    [f, p] = j(e.x1, e.y0, 0);
  return {
    body: d,
    over: e.label
      ? `<g opacity="${A(e.opacity * (e.labelFade ?? 1))}" transform="translate(0 ${A(-u)})">${zr(f, p + 22, e.label, { icon: `users` })}</g>`
      : ``,
    poly: t.outline.map(([e, t]) => [e, t - u]),
    bounds: Jr(t.outline, [8, 34, 8, 40]),
  };
}
var ii = { s: 6, h: 90, opacity: 1, label: `` };
function ai(e) {
  let t = e.x - e.s / 2,
    n = e.x + e.s / 2,
    r = e.y - e.s / 2,
    i = e.y + e.s / 2,
    a = (e, t, n) => j(e, t, n),
    o = (e, t, n) =>
      `<path d="M${e[0]},${e[1]} L${t[0]},${t[1]}" stroke="${k}" stroke-opacity="${n ? 0.22 : 0.55}" stroke-width="1.4" stroke-dasharray="5 4" fill="none"/>`,
    s = [a(t, r, e.h), a(t, i, e.h), a(n, i, e.h), a(n, r, e.h)],
    c = [a(t, r, 0), a(t, i, 0), a(n, i, 0), a(n, r, 0)],
    l = [
      o(s[0], s[1]),
      o(s[1], s[2]),
      o(s[2], s[3]),
      o(s[3], s[0]),
      o(c[0], c[3]),
      o(c[3], c[2]),
      o(s[0], c[0]),
      o(s[2], c[2]),
      o(s[3], c[3]),
      o(c[0], c[1], !0),
      o(c[1], c[2], !0),
      o(s[1], c[1], !0),
    ].join(``),
    [u, d] = s[2],
    f = Rr(e.label, 10.5) + 33;
  return {
    body: `<g opacity="${A(e.opacity)}">${l}</g>`,
    over: e.label
      ? `<g opacity="${A(e.opacity)}">${zr(u + 14 + f / 2, d + 18, e.label, { tone: `gray`, icon: `alert` })}</g>`
      : ``,
    poly: null,
    bounds: Jr([...s, ...c, [u + 22 + f, d]], [8, 30, 8, 8]),
  };
}
function oi(e = [], t, n) {
  let r = Math.max(0, ...e.map((e) => (Rr(e.text, 10.5) + 18 + (e.icon ? 15 : 0)) / 2)),
    i = n.map((e) => e[0]),
    a = Math.max(8, Math.min(...i) - (t - r) + 8),
    o = Math.max(8, t + r + 8 - Math.max(...i));
  return [a, 18 + e.length * 26, o, 40];
}
function si(
  { x0: e, x1: t, y0: n, y1: r, z0: i, z1: a },
  { top: o, front: s, left: c, sw: l = 1.5, r: u = 2 },
) {
  let d = [j(e, n, a), j(e, r, a), j(t, r, a), j(t, n, a)],
    f = [j(t, n, a), j(t, r, a), j(t, r, i), j(t, n, i)],
    p = [j(e, n, a), j(t, n, a), j(t, n, i), j(e, n, i)],
    m = [j(e, n, a), j(e, r, a), j(t, r, a), j(t, r, i), j(t, n, i), j(e, n, i)];
  return `
    <path d="${Sr(p, u)}" fill="${c}"/>
    <path d="${Sr(f, u)}" fill="${s}"/>
    <path d="${Sr(d, u)}" fill="${o}"/>
    <path d="${Sr(m, u)}" fill="none" stroke="${k}" stroke-width="${l}" stroke-linejoin="round"/>`;
}
var ci = { w: 6, d: 6, label: ``, tags: [], opacity: 1, lift: 0 };
function li(e) {
  let t = e.x - e.d / 2,
    n = e.x + e.d / 2,
    r = e.y - e.w / 2,
    i = e.y + e.w / 2,
    a = Gr({ x0: t, x1: n, y0: r, y1: i, h: 16, radius: 9 }),
    o = { x0: t + 0.7, x1: t + 1.05, y0: r + 0.9, y1: i - 0.9, z0: 19, z1: 66 },
    s = { x0: o.x1, x1: o.x1 + 2.7, y0: o.y0, y1: o.y1, z0: 16, z1: 19 },
    c = (o.y1 - o.y0) * 14,
    l = o.z1 - o.z0,
    u = ``,
    d = Math.floor((c - 6) / 4.7);
  for (let e = 0; e < 4; e++)
    for (let t = 0; t < d; t++)
      u += `<rect x="${A(3 + t * 4.7)}" y="${A(2.5 + e * 4.3)}" width="3.8" height="3.3" rx=".7"/>`;
  let f = c - 6.8,
    p = l - 8,
    m = `
    <rect x="3.4" y="3.4" width="${A(f)}" height="${A(p)}" rx="1.5" fill="#FBF8F4"/>
    <rect x="3.4" y="3.4" width="${A(f)}" height="7" rx="1.5" fill="#E4D9CB"/>
    <circle cx="6.6" cy="6.9" r="1" fill="#E5534B"/><circle cx="9.6" cy="6.9" r="1" fill="#EFB041"/><circle cx="12.6" cy="6.9" r="1" fill="#7FC278"/>
    <rect x="16" y="5" width="${A(f - 16)}" height="3.8" rx="1.9" fill="#FBF8F4"/>
    <rect x="7" y="14.5" width="${A(f - 7.2)}" height="12" rx="1.5" fill="url(#screen)"/>
    <rect x="7" y="29.5" width="${A((f - 7.2) * 0.62)}" height="2.6" rx="1.3" fill="#D6CCBF"/>
    <rect x="7" y="34" width="${A((f - 7.2) * 0.8)}" height="2.6" rx="1.3" fill="#D6CCBF"/>
    <rect x="3.4" y="3.4" width="${A(f)}" height="${A(p)}" rx="1.5" fill="url(#screen-glare)"/>`,
    h = e.lift;
  if (e.form === `phone`) return ui(e, a, 16);
  let g = `
    <g opacity="${A(e.opacity)}">
      ${qr(a, 16, h, 0.2)}
      <g transform="translate(0 ${A(-h)})">
        ${Kr(a, `slab`, { stroke: `#3b3631`, sw: 1.5 })}
        <path d="${Sr([j(o.x0 - 0.3, o.y0 - 0.3, 16), j(o.x0 - 0.3, o.y1 + 0.3, 16), j(s.x1 + 0.3, s.y1 + 0.3, 16), j(s.x1 + 0.3, s.y0 - 0.3, 16)], 6)}" fill="#6b5236" opacity=".14" filter="url(#blur-sm)"/>
        ${si(s, { top: `#efeae4`, front: `#cfc8c0`, left: `#ddd6ce`, r: 2.5, sw: 1.4 })}
        <g transform="${xr(s.x0 + 0.15, s.y0, s.z1)}" fill="#fbf8f4" stroke="#b9b1a7" stroke-width=".55">
          ${u}
          <rect x="${A(c / 2 - 10)}" y="21.5" width="20" height="9" rx="1.6"/>
        </g>
        ${si(o, { top: `#8B8580`, front: `#3D3935`, left: `#6E6862`, r: 3, sw: 1.5 })}
        <g transform="${yr(o.x1, o.y0, o.z1)}">${m}</g>
      </g>
    </g>`,
    [_, v] = j(n, r, 0),
    [y, b] = j(o.x0, (o.y0 + o.y1) / 2, o.z1),
    x = e.label
      ? `<g opacity="${A(e.labelFade ?? 1)}">${zr(_, v + 22, e.label, { icon: `user` })}</g>`
      : ``,
    ee = b - 22;
  for (let t of e.tags || [])
    ((x += `<g transform="translate(0 ${A(ee)})" opacity="${A(e.tagFade ?? 1)}">${zr(y, 0, t.text, t)}</g>`),
      (ee -= 26));
  return (
    (x = x ? `<g opacity="${A(e.opacity)}" transform="translate(0 ${A(-h)})">${x}</g>` : ``),
    {
      body: g,
      over: x,
      poly: a.outline.map(([e, t]) => [e, t - h]),
      bounds: Jr([...a.outline, [y, b]], oi(e.tags, y, a.outline)),
    }
  );
}
function ui(e, t, n) {
  let r = { x0: e.x - 0.2, x1: e.x + 0.25, y0: e.y - 1.2, y1: e.y + 1.2, z0: n + 1, z1: n + 64 },
    i = (r.y1 - r.y0) * 14,
    a = r.z1 - r.z0,
    o = i - 5,
    s = `
    <rect x="2.5" y="2.5" width="${A(o)}" height="${A(a - 5)}" rx="3.5" fill="#FBF8F4"/>
    <rect x="${A(i / 2 - 4)}" y="3.6" width="8" height="2.2" rx="1.1" fill="#3D3935"/>
    <rect x="2.5" y="8" width="${A(o)}" height="7" fill="#E4D9CB"/>
    <rect x="5" y="19" width="${A(o * 0.62)}" height="7" rx="3" fill="#ECE6DC"/>
    <rect x="${A(2.5 + o * 0.32)}" y="29" width="${A(o * 0.6)}" height="7" rx="3" fill="#CBBAE6"/>
    <rect x="5" y="39" width="${A(o * 0.5)}" height="7" rx="3" fill="#ECE6DC"/>
    <rect x="5" y="${A(a - 12)}" width="${A(o - 5)}" height="5" rx="2.5" fill="#E4D9CB"/>
    <rect x="2.5" y="2.5" width="${A(o)}" height="${A(a - 5)}" rx="3.5" fill="url(#screen-glare)"/>`,
    c = e.lift,
    l = `
    <g opacity="${A(e.opacity)}">
      ${qr(t, n, c, 0.2)}
      <g transform="translate(0 ${A(-c)})">
        ${Kr(t, `slab`, { stroke: `#3b3631`, sw: 1.5 })}
        <path d="${Sr([j(r.x0 - 0.5, r.y0 - 0.3, n), j(r.x0 - 0.5, r.y1 + 0.3, n), j(r.x1 + 0.9, r.y1 + 0.3, n), j(r.x1 + 0.9, r.y0 - 0.3, n)], 5)}" fill="#6b5236" opacity=".16" filter="url(#blur-sm)"/>
        ${si(r, { top: `#8B8580`, front: `#3D3935`, left: `#6E6862`, r: 3.5, sw: 1.5 })}
        <g transform="${yr(r.x1, r.y0, r.z1)}">${s}</g>
      </g>
    </g>`,
    [u, d] = j(e.x + e.d / 2, e.y - e.w / 2, 0),
    [f, p] = j(r.x0, e.y, r.z1),
    m = e.label
      ? `<g opacity="${A(e.labelFade ?? 1)}">${zr(u, d + 22, e.label, { icon: `user` })}</g>`
      : ``,
    h = p - 20;
  for (let t of e.tags || [])
    ((m += `<g transform="translate(0 ${A(h)})" opacity="${A(e.tagFade ?? 1)}">${zr(f, 0, t.text, t)}</g>`),
      (h -= 26));
  return (
    (m = m ? `<g opacity="${A(e.opacity)}" transform="translate(0 ${A(-c)})">${m}</g>` : ``),
    {
      body: l,
      over: m,
      poly: t.outline.map(([e, t]) => [e, t - c]),
      bounds: Jr([...t.outline, [f, p]], oi(e.tags, f, t.outline)),
    }
  );
}
var di = {
  r: 1.7,
  h: 38,
  glyph: `database`,
  label: ``,
  tags: [],
  opacity: 1,
  lift: 0,
  heat: 0,
  cpu: -1,
};
function fi(e) {
  let t = Math.SQRT2 * 14 * e.r,
    n = t / 2,
    [r, i] = j(e.x, e.y, 0),
    o = e.lift,
    s = i - o,
    c = s - e.h,
    l = `M${A(r - t)},${A(c)} V${A(s)} A${A(t)},${A(n)} 0 0 0 ${A(r + t)},${A(s)} V${A(c)} Z`,
    u = `M${A(r - t)},${A(c)} V${A(s)} A${A(t)},${A(n)} 0 0 0 ${A(r + t)},${A(s)} V${A(c)}`,
    d = 1 - Math.min(1, o / 140) * 0.85,
    f = e.cpu >= 0 ? Mr(e.cpu) : 0,
    p = ``;
  if (f > 0.004) {
    let i = s - f * e.h,
      [a, o] =
        e.cpu < 0.6
          ? [`#cfe8c0`, `#5fa95a`]
          : e.cpu < 0.85
            ? [`#f9dca3`, `#d99a2b`]
            : [`#f5bdb2`, `#d9473d`],
      c = `M${A(r - t)},${A(i)} A${A(t)},${A(n)} 0 0 0 ${A(r + t)},${A(i)} V${A(s)} A${A(t)},${A(n)} 0 0 1 ${A(r - t)},${A(s)} Z`,
      l = `M${A(r - t + 1)},${A(i)} A${A(t - 1)},${A(n - 0.5)} 0 0 0 ${A(r + t - 1)},${A(i)}`;
    p = `
      <path d="${c}" fill="${a}" opacity=".92"/>
      ${f < 0.995 ? `<path d="${l}" fill="none" stroke="${o}" stroke-width="1.6" stroke-linecap="round"/>` : ``}`;
  }
  let m = `
    <g opacity="${A(e.opacity)}">
      <ellipse cx="${A(r)}" cy="${A(i + 5)}" rx="${A(t + 3)}" ry="${A(n + 1)}" fill="#6b5236" opacity="${A(0.22 * d)}" filter="url(#blur-md)"/>
      ${e.heat > 0.01 ? `<g class="pulse"><path d="${l}" fill="#f0552f" opacity="${A(e.heat * 0.7)}" filter="url(#glow)"/></g>` : ``}
      <path d="${l}" fill="url(#g-purple-side)"/>
      ${p}
      <path d="${l}" fill="url(#cyl-sheen)"/>
      <ellipse cx="${A(r)}" cy="${A(c)}" rx="${A(t)}" ry="${A(n)}" fill="url(#g-purple-top)"/>
      <path d="M${A(r - t + 3)},${A(c + 2.5)} A${A(t - 3)},${A(n - 2)} 0 0 0 ${A(r + t - 3)},${A(c + 2.5)}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/>
      <path d="${u}" fill="none" stroke="${k}" stroke-width="1.9" stroke-linejoin="round"/>
      <ellipse cx="${A(r)}" cy="${A(c)}" rx="${A(t)}" ry="${A(n)}" fill="none" stroke="${k}" stroke-width="1.9"/>
      ${a(e.glyph, r, c + n + e.h / 2, 19, { stroke: 1.8 })}
    </g>`,
    h = Rr(e.label || ``, 10.5) + 33,
    g = e.label
      ? `<g opacity="${A(e.labelFade ?? 1)}">${zr(r + t + 10 + h / 2, s - e.h * 0.35, e.label, { icon: `database` })}</g>`
      : ``,
    _ = c - n - 15,
    v = [];
  e.cpu >= 0 && v.push(Wr(r, 0, e.cpu));
  for (let t of e.tags || [])
    v.push(`<g opacity="${A(e.tagFade ?? 1)}">${zr(r, 0, t.text, t)}</g>`);
  for (let e of v) ((g += `<g transform="translate(0 ${A(_)})">${e}</g>`), (_ -= 26));
  g = g ? `<g opacity="${A(e.opacity)}">${g}</g>` : ``;
  let y = [];
  for (let e = 0; e <= 8; e++)
    y.push([r - t * Math.cos((Math.PI * e) / 8), c - n * Math.sin((Math.PI * e) / 8)]);
  for (let e = 0; e <= 8; e++)
    y.push([r + t * Math.cos((Math.PI * e) / 8), s + n * Math.sin((Math.PI * e) / 8)]);
  return {
    body: m,
    over: g,
    poly: y,
    bounds: Ur(
      [r - t - 8, c - n - 12 - v.length * 26, r + t + (e.label ? h + 18 : 8), s + n + 10],
      r,
      Hr(e),
    ),
  };
}
var pi = { label: ``, opacity: 1 };
function mi(e) {
  let t = [j(e.x0, e.y0), j(e.x0, e.y1), j(e.x1, e.y1), j(e.x1, e.y0)],
    n = e.label
      ? `<text transform="${br(e.x0 + 0.9, e.y0 + 0.55, 0)}" font-size="10.5" font-weight="800" letter-spacing="1.6" fill="#6f6961">${e.label}</text>`
      : ``;
  return {
    body: `
      <g opacity="${A(e.opacity)}">
        <path d="${Sr(t, 8)}" fill="#fffaf2" fill-opacity=".55" stroke="${k}" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="6 5"/>
        ${n}
      </g>`,
    over: ``,
    poly: t,
    bounds: Jr(t, [6, 6, 6, 6]),
  };
}
var hi = { n: 0, gap: 1, dir: [0, -1], opacity: 1, color: `#efb041` };
function gi(e) {
  let t = ``,
    n = [],
    r = Math.ceil(e.n);
  for (let i = r - 1; i >= 0; i--) {
    let r = Mr(e.n - i),
      [a, o] = j(e.x + e.dir[0] * e.gap * i, e.y + e.dir[1] * e.gap * i, 0);
    (n.push([a, o]),
      (t += `<g opacity="${A(r * e.opacity)}" transform="translate(${A(a)} ${A(o - (1 - r) * 8)}) scale(${A(0.5 + r * 0.5)})">
      <circle r="4.6" fill="${e.color}" stroke="${k}" stroke-width="1.5"/></g>`));
  }
  return { body: t, over: ``, poly: null, bounds: n.length ? Jr(n, [8, 8, 8, 8]) : [0, 0, 0, 0] };
}
var _i = {
    z: 0,
    dx: 0,
    dy: 0,
    w: 0,
    title: ``,
    icon: `sparkles`,
    lines: [],
    chart: null,
    bars: [],
    marker: 0,
    opacity: 1,
    lift: 0,
  },
  vi = (e) => e.replace(/&(?![a-z#0-9]+;)/g, `&amp;`).replace(/</g, `&lt;`),
  yi = (e) =>
    vi(e)
      .split(`**`)
      .map((e, t) => (t % 2 ? `<tspan font-weight="800" fill="${k}">${e}</tspan>` : e))
      .join(``);
function bi(e, t, n, r, i) {
  let a = (e) => Math.min(1, 0.06 / Math.max(0.02, 1 - e)),
    o = (t) => e + t * n,
    s = (e) => t + r - e * r,
    c = ``;
  for (let e = 0; e <= 60; e++) {
    let t = (e / 60) * 0.985;
    c += `${e ? `L` : `M`}${A(o(t))},${A(s(a(t)))} `;
  }
  let l = Math.min(0.985, i),
    u = o(l),
    d = s(a(l)),
    f = i >= 0.85 ? `#e5534b` : i >= 0.6 ? `#efb041` : `#7fc278`;
  return `
    <path d="M${A(e)},${A(t)} V${A(t + r)} H${A(e + n)}" fill="none" stroke="#a59c90" stroke-width="1.2"/>
    <rect x="${A(o(0.8))}" y="${A(t)}" width="${A(o(1) - o(0.8))}" height="${A(r)}" fill="#e5534b" opacity=".08"/>
    <path d="${c}" fill="none" stroke="${k}" stroke-width="2"/>
    <path d="M${A(u)},${A(t + r)} V${A(d)}" stroke="${f}" stroke-width="1.4" stroke-dasharray="3 3"/>
    <circle cx="${A(u)}" cy="${A(d)}" r="5.2" fill="${f}" stroke="${k}" stroke-width="1.6"/>
    <text x="${A(e + n)}" y="${A(t + r + 14)}" text-anchor="end" font-size="9.5" font-weight="700" fill="#6f6961">${O(`utilization →`)}</text>
    <text x="${A(e + 4)}" y="${A(t + 9)}" font-size="9.5" font-weight="700" fill="#6f6961">${O(`latency`)}</text>
    <text x="${A(Math.min(u, e + n - 30))}" y="${A(Math.max(d - 10, t + 22))}" text-anchor="middle" font-size="10.5" font-weight="800" fill="${k}">${Math.round(i * 100)}%</text>`;
}
var xi = {
    green: `#9FD28F`,
    amber: `#EFB041`,
    red: `#E5534B`,
    gray: `#B5AB9E`,
    violet: `#CBBAE6`,
    blue: `#A9C5E8`,
  },
  Si = (e, t, n) => {
    if (!(cr() && Or(e) === `rtl`)) return `x="${A(t)}">${e}`;
    let r = e.trimStart();
    return `x="${A(t + Rr(e.slice(0, e.length - r.length), n))}" direction="rtl" text-anchor="end">${r}`;
  };
function Ci(e, t, n, r, i, a = 46) {
  let o = e + r,
    s = n - r - a;
  return i
    .map((n, r) => {
      let i = t + r * 19,
        a = o + (n.from || 0) * s,
        c = Math.max(3, ((n.to ?? 1) - (n.from || 0)) * s);
      return `
        <text y="${A(i + 12)}" font-size="10.5" font-weight="${n.bold ? 800 : 500}" fill="#34302b" ${Si(n.label, e, 10.5)}</text>
        <rect x="${A(o)}" y="${A(i + 3)}" width="${A(s)}" height="11" rx="3" fill="#f1e8db"/>
        <rect x="${A(a)}" y="${A(i + 3)}" width="${A(c)}" height="11" rx="3" fill="${xi[n.tone || `gray`]}" stroke="${k}" stroke-opacity=".55" stroke-width="1"/>
        <text y="${A(i + 12)}" font-size="10" font-weight="800" fill="${k}" ${Si(n.note || ``, a + c + 6, 10)}</text>`;
    })
    .join(``);
}
function wi(e) {
  let [t, n] = j(e.x, e.y, e.z),
    r = Math.max(
      Rr(e.title, 10) + e.title.length + 48,
      ...e.lines.map((e) => Rr(e.replace(/\*\*/g, ``).replace(/^[=#!] /, ``), 11.5) + 30),
    ),
    i = e.chart === `bars` ? Math.max(...e.bars.map((e) => Rr(e.label, 10.5))) + 14 : 0,
    o = e.chart === `bars` ? Math.max(46, ...e.bars.map((e) => Rr(e.note || ``, 10) + 12)) : 0,
    s = Math.max(e.w, r, e.chart === `bars` ? i + 184 + o : e.chart ? 220 : 0),
    c = e.chart === `hockey` ? 96 : e.chart === `bars` ? e.bars.length * 19 : 0,
    l =
      34 +
      e.lines.length * 18 +
      (e.chart === `hockey` ? c + 22 : e.chart === `bars` ? c + 12 : 0) +
      6,
    u = t + e.dx,
    d = n + e.dy - e.lift,
    f = e.boxW ?? s,
    p = e.boxH ?? l,
    m = e.fade ?? 1,
    h = cr(),
    g = (e, t) =>
      h
        ? Or(e) === `rtl`
          ? `x="${A(u + s - t)}" direction="rtl"`
          : `x="${A(u + s - t)}" text-anchor="end"`
        : `x="${A(u + t)}"`,
    _ = ``;
  e.lines.forEach((e, t) => {
    let n = d + 34 + t * 18 + 12;
    e.startsWith(`= `)
      ? ((_ += `<rect x="${A(u + 10)}" y="${A(n - 13)}" width="${A(s - 20)}" height="18" rx="5" fill="#dcefd2"/>`),
        (_ += `<text ${g(e.slice(2), 16)} y="${A(n)}" font-size="11.5" font-weight="800" fill="#24521c">${yi(e.slice(2))}</text>`))
      : e.startsWith(`! `)
        ? ((_ += `<rect x="${A(u + 10)}" y="${A(n - 13)}" width="${A(s - 20)}" height="18" rx="5" fill="#f8d5cf"/>`),
          (_ += `<text ${g(e.slice(2), 16)} y="${A(n)}" font-size="11.5" font-weight="800" fill="#8f2a22">${yi(e.slice(2))}</text>`))
        : e.startsWith(`# `)
          ? (_ += `<text ${g(e.slice(2), 16)} y="${A(n)}" font-size="10.5" font-weight="500" fill="#8b847a">${yi(e.slice(2))}</text>`)
          : (_ += `<text ${g(e, 16)} y="${A(n)}" font-size="11.5" font-weight="500" fill="#34302b">${yi(e)}</text>`);
  });
  let v = d + 34 + e.lines.length * 18 + 10,
    y =
      e.chart === `hockey`
        ? bi(u + 18, v, s - 36, c - 14, e.marker)
        : e.chart === `bars`
          ? Ci(u + 16, v - 2, s - 32, i, e.bars, o)
          : ``;
  return {
    body: ``,
    over: `
    <g opacity="${A(e.opacity)}">
      <rect x="${A(u)}" y="${A(d + 2.5)}" width="${A(f)}" height="${A(p)}" rx="10" fill="${_r}"/>
      <rect x="${A(u)}" y="${A(d)}" width="${A(f)}" height="${A(p)}" rx="10" fill="#fbf7f1" stroke="${k}" stroke-width="1.4"/>
      <path d="M${A(u + 12)},${A(d + 30)} H${A(u + f - 12)}" stroke="#e6ddd0" stroke-width="1"/>
      <g opacity="${A(m)}">
        ${a(e.icon, h ? u + s - 20 : u + 20, d + 18, 13, { stroke: 2.1, color: `#6f6961` })}
        <text ${g(e.title, 33)} y="${A(d + 21.5)}" font-size="10" font-weight="800" letter-spacing="1" fill="#6f6961">${vi(lr(e.title))}</text>
        ${_}
        ${y}
      </g>
    </g>`,
    poly: null,
    size: { w: s, h: l },
    bounds: [u - 6, d - 6, u + f + 6, d + p + 10],
  };
}
var Ti = { r: 10, nodes: [], keys: [], moved: [], opacity: 1, label: `` };
function Ei(e, t) {
  let n = [...t].sort((e, t) => e.a - t.a),
    r = n[n.length - 1];
  for (let t of n) t.a <= e && (r = t);
  return r;
}
function Di(e) {
  let t = (t, n = e.r) => {
      let r = (t * Math.PI) / 180;
      return j(e.x + n * Math.cos(r), e.y + n * Math.sin(r), 0);
    },
    n = (n, r, i = e.r) => {
      let a = ``,
        o = Math.max(2, Math.ceil(Math.abs(r - n) / 3));
      for (let e = 0; e <= o; e++) {
        let [s, c] = t(n + ((r - n) * e) / o, i);
        a += `${e ? `L` : `M`}${A(s)},${A(c)} `;
      }
      return a;
    },
    r = [...e.nodes].sort((e, t) => e.a - t.a),
    i = ``;
  r.forEach((e, t) => {
    let a = r[(t + 1) % r.length],
      o = a.a > e.a ? a.a : a.a + 360;
    i += `<path d="${n(e.a, o)}" fill="none" stroke="${vr[e.color].side[1]}" stroke-width="10" stroke-opacity=".55"/>`;
  });
  let a = ``;
  for (let n = 22; n < 360; n += 60) {
    let [r, i] = t(n + 2.5, e.r + 1.4),
      [o, s] = t(n, e.r + 1.4),
      c = (Math.atan2(s - i, o - r) * 180) / Math.PI;
    a += `<path d="M-4,-3.5 L1,0 L-4,3.5" transform="translate(${A(o)} ${A(s)}) rotate(${A(c)})" fill="none" stroke="#a59c90" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  let o = r
      .filter((e) => e.mark)
      .map((e) => {
        let [n, r] = t(e.a);
        return `<path d="M${A(n)},${A(r - 6)} L${A(n + 9)},${A(r)} L${A(n)},${A(r + 6)} L${A(n - 9)},${A(r)} Z" fill="${vr[e.color].top[1]}" stroke="${k}" stroke-width="1.4"/>`;
      })
      .join(``),
    s = new Set(e.moved || []),
    c = (e.keys || [])
      .map((e) => {
        let [n, i] = t(e),
          a = r.length ? Ei(e, r) : null,
          o = a ? vr[a.color].side[0] : `#fbf6ef`;
        return `${s.has(e) ? `<circle class="moved" cx="${A(n)}" cy="${A(i)}" r="9" fill="none" stroke="#e5534b" stroke-width="2"/>` : ``}
        <circle cx="${A(n)}" cy="${A(i)}" r="4.6" fill="${o}" stroke="${k}" stroke-width="1.4"/>`;
      })
      .join(``),
    l = n(0, 360),
    [u, d] = t(135, e.r + 2.2),
    f = `
    <g opacity="${A(e.opacity)}">
      <path d="${n(0, 360, e.r + 0.9)}" fill="none" stroke="#e8ddcf" stroke-width="1"/>
      <path d="${l}" fill="#fffaf2" fill-opacity=".35" stroke="${k}" stroke-opacity=".55" stroke-width="1.5"/>
      ${i}
      ${a}
      ${o}
      ${c}
    </g>`,
    p = e.label
      ? `<g opacity="${A(e.opacity)}">${zr(u, d - 12, e.label, { tone: `gray`, icon: `replay` })}</g>`
      : ``,
    m = [];
  for (let n = 0; n < 360; n += 15) m.push(t(n, e.r + 1.6));
  return { body: f, over: p, poly: null, bounds: Jr(m, [10, 34, 10, 10]) };
}
var Oi = {
    block: Zr,
    crowd: ri,
    ghost: ai,
    device: li,
    db: fi,
    zone: mi,
    queue: gi,
    panel: wi,
    ring: Di,
  },
  ki = {
    block: Xr,
    crowd: Qr,
    ghost: ii,
    device: ci,
    db: di,
    zone: pi,
    queue: hi,
    panel: _i,
    ring: Ti,
  };
function Ai(e) {
  if (e.type === `crowd` || e.type === `zone`) return [e.x0, e.x1, e.y0, e.y1];
  if (e.type === `device`) return [e.x - e.d / 2, e.x + e.d / 2, e.y - e.w / 2, e.y + e.w / 2];
  if (e.type === `db` || e.type === `ring`) return [e.x - e.r, e.x + e.r, e.y - e.r, e.y + e.r];
  let t = (e.s || 4) / 2;
  return [e.x - t, e.x + t, e.y - t, e.y + t];
}
function ji(e) {
  return e.type === `crowd` || e.type === `zone`
    ? [(e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2]
    : [e.x, e.y];
}
function Mi(e) {
  if (e.type === `zone` || e.type === `ring`) return -1e4;
  if (e.type === `queue`) return -1e3;
  if (e.type === `panel`) return 1e4;
  let [t, n] = ji(e);
  return t - n - (e.type === `ghost` ? 0.5 : 0);
}

// ── Exports for scene-renderer.ts ──
export {
  k as STROKE,
  vr as COLOR_PALETTE,
  jr as buildDefs,
  Oi as ENTITY_RENDERERS,
  ki as ENTITY_DEFAULTS,
  Mi as entitySortKey,
  ji as entityCenter,
  Tr as trimPathStart,
  Er as trimPathEnd,
  Cr as smoothPath,
  zr as buildPill,
  Ai,
  Sr,
};
