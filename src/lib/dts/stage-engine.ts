// @ts-nocheck
/* eslint-disable */
/**
 * StageEngine (ap class extracted from DTS runtime-app.ts)
 * 100% ground-truth DTS interactive Stage & Animation Engine.
 */
import {
  round as A,
  isoProject as j,
  buildDefs as jr,
  buildPill as zr,
  ENTITY_RENDERERS as Oi,
  ENTITY_DEFAULTS as ki,
  entitySortKey as Mi,
  entityCenter as ji,
  trimPathStart as Tr,
  trimPathEnd as Er,
  smoothPath as Cr,
  Ai,
  Sr,
} from './runtime-draw';

const rf = {
  "#1d1b18": "#efe6d6",
  "#211e1b": "#ece2d0",
  "#34302b": "#ddd3c2",
  "#1c1a17": "#050403",
  "#6b5236": "#000000",
  "#5a4123": "#000000",
  "#3a2a14": "#000000",
};
const af = { "#ffffff": "#ffffff", "#e6ddd0": "#4d463c" };
const of = (e) => {
  let t = e.replace("#", "").toLowerCase();
  return "#" + (t.length === 3 ? [...t].map((e) => e + e).join("") : t);
};
const or = () => "en";

// Font width calculation
const Fr = new Map();
let Ir = null;
let Lr = "";
if (typeof document !== "undefined" && document.fonts) {
  document.fonts.addEventListener("loadingdone", () => Fr.clear());
}
const Rr = (e, t) => {
  e = String(e);
  if (typeof document === "undefined") return e.length * t * 0.6;
  const n = t + "|" + e;
  let r = Fr.get(n);
  if (r === undefined) {
    if (!Ir) {
      Ir = document.createElement("canvas").getContext("2d");
      Lr = getComputedStyle(document.documentElement).getPropertyValue("--font").trim() || "monospace";
    }
    Ir.font = "700 " + t + "px " + Lr;
    r = Ir.measureText(e).width;
    Fr.set(n, r);
  }
  return r;
};
const Br = (e) => Math.round(e * 1.3);
function Vr(e, t) {
  const n = String(e).split("\n");
  return { lines: n, tw: Math.max(...n.map((e) => Rr(e, t))), h: 21 + (n.length - 1) * Br(t) };
}

// @ts-nocheck
/* eslint-disable */
function sf(e) {
  let t = parseInt(e.slice(1), 16),
    n = ((t >> 16) & 255) / 255,
    r = ((t >> 8) & 255) / 255,
    i = (t & 255) / 255,
    a = Math.max(n, r, i),
    o = Math.min(n, r, i),
    s = a - o,
    c = (a + o) / 2,
    l = 0;
  s &&
    ((l = a === n ? ((r - i) / s) % 6 : a === r ? (i - n) / s + 2 : (n - r) / s + 4),
    (l *= 60),
    l < 0 && (l += 360));
  let u = s ? s / (1 - Math.abs(2 * c - 1)) : 0;
  return { h: l, s: u, l: c, c: s };
}
function cf(e, t, n) {
  let r = (1 - Math.abs(2 * n - 1)) * t,
    i = r * (1 - Math.abs(((e / 60) % 2) - 1)),
    a = n - r / 2,
    [o, s, c] =
      e < 60
        ? [r, i, 0]
        : e < 120
          ? [i, r, 0]
          : e < 180
            ? [0, r, i]
            : e < 240
              ? [0, i, r]
              : e < 300
                ? [i, 0, r]
                : [r, 0, i],
    l = (e) =>
      Math.round(Math.max(0, Math.min(1, e + a)) * 255)
        .toString(16)
        .padStart(2, `0`);
  return `#${l(o)}${l(s)}${l(c)}`;
}
var lf = { css: new Map(), svg: new Map() };
function uf(e, t = `svg`) {
  let n = of(e),
    r = lf[t];
  if (r.has(n)) return r.get(n);
  let i = (t === `svg` && af[n]) || rf[n];
  if (!i) {
    let { h: e, s: t, l: r, c: a } = sf(n);
    if (a < 0.045 || (a < 0.13 && e >= 12 && e <= 62)) {
      let t = a < 0.02 ? 34 : e,
        n = r >= 0.885 ? 0.118 + (r - 0.92) * 0.9 : 1 - r;
      i = cf(t, n < 0.5 ? 0.13 : 0.12, Math.max(0.06, Math.min(0.93, n)));
    } else
      i =
        r >= 0.66
          ? cf(e, Math.min(t, 0.5) * 0.6, 0.16 + (r - 0.66) * 0.55)
          : r >= 0.36
            ? n
            : cf(e, Math.min(t, 0.6), 0.8);
  }
  return (r.set(n, i), i);
}
var df = () => typeof document < `u` && document.documentElement.dataset.theme === `dark`,
  ff = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
function pf(e) {
  return !e || !df()
    ? e
    : e.replace(ff, (e) =>
        e.slice(1) === e.slice(1).toLowerCase() || !/[A-F]/.test(e) ? uf(e, `svg`) : e,
      );
}
var mf = `http://www.w3.org/2000/svg`,
  hf = (e, t = {}) => {
    let n = document.createElementNS(mf, e);
    for (let [e, r] of Object.entries(t)) n.setAttribute(e, r);
    return n;
  },
  gf = {
    inOut: (e) => (e < 0.5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2),
    out: (e) => 1 - (1 - e) ** 3,
    back: (e) => 1 + 2.35 * (e - 1) ** 3 + 1.35 * (e - 1) ** 2,
  },
  _f = (e, t, n) => e + (t - e) * n,
  vf = (e) => Math.max(0, Math.min(1, e)),
  yf = { exit: 420, move: 820, enter: 680, stagger: 130, draw: 560 },
  bf = 1.6,
  xf = 0.3,
  Sf = 16,
  Cf = 1.16,
  wf = 520,
  Tf = { x: 10, top: 16, bottom: 10 },
  Ef = 12,
  Df = [`tr`, `br`, `tl`, `bl`],
  Of = `__card`,
  kf = 16,
  Af = 21,
  jf = 9.5,
  Mf = 7,
  Nf = (e, t) => ({ w: e.w * t, h: (e.h + 4) * t }),
  Pf = (e, t) =>
    Math.max(0, Math.min(e[2], t[2]) - Math.max(e[0], t[0])) *
    Math.max(0, Math.min(e[3], t[3]) - Math.max(e[1], t[1])),
  Ff = (e, t) => e[0] < t[2] && e[2] > t[0] && e[1] < t[3] && e[3] > t[1],
  If = (e, t, n) => {
    let r = !1;
    for (let i = 0, a = n.length - 1; i < n.length; a = i++) {
      let [o, s] = n[i],
        [c, l] = n[a];
      s > t != l > t && e < ((c - o) * (t - s)) / (l - s) + o && (r = !r);
    }
    return r;
  },
  Lf = (e, t, n, r) => {
    let i = (e, t, n) => Math.sign((t[0] - e[0]) * (n[1] - e[1]) - (t[1] - e[1]) * (n[0] - e[0]));
    return i(e, t, n) !== i(e, t, r) && i(n, r, e) !== i(n, r, t);
  },
  Rf = (e, t) => {
    if (e.some(([e, n]) => e > t[0] && e < t[2] && n > t[1] && n < t[3])) return !0;
    let n = [
      [t[0], t[1]],
      [t[2], t[1]],
      [t[2], t[3]],
      [t[0], t[3]],
    ];
    if (n.some(([t, n]) => If(t, n, e))) return !0;
    for (let t = 0; t < e.length; t++) {
      let r = e[t],
        i = e[(t + 1) % e.length];
      for (let e = 0; e < 4; e++) if (Lf(r, i, n[e], n[(e + 1) % 4])) return !0;
    }
    return !1;
  };
function zf(e, t) {
  let n = [],
    r = 0;
  for (let t = 0; t < e.length - 1; t++) {
    let i = Math.hypot(e[t + 1][0] - e[t][0], e[t + 1][1] - e[t][1]);
    (n.push(i), (r += i));
  }
  let i = r * t;
  for (let t = 0; t < n.length; t++) {
    if (i <= n[t] || t === n.length - 1) {
      let r = n[t] ? Math.min(1, i / n[t]) : 0,
        [a, o] = e[t],
        [s, c] = e[t + 1];
      return {
        x: a + (s - a) * r,
        y: o + (c - o) * r,
        dx: (s - a) / (n[t] || 1),
        dy: (c - o) / (n[t] || 1),
      };
    }
    i -= n[t];
  }
  return { x: e[0][0], y: e[0][1], dx: 1, dy: 0 };
}
function Bf(e, t = 12) {
  let n = [];
  for (let r = 0; r < e.length - 1; r++) {
    let [i, a] = e[r],
      [o, s] = e[r + 1],
      c = Math.max(1, Math.round(Math.hypot(o - i, s - a) / t));
    for (let e = 0; e <= c; e++) n.push([i + ((o - i) * e) / c, a + ((s - a) * e) / c]);
  }
  return n;
}
function Vf(e, t, n, r, i = -1, a = Af) {
  let o = Mf,
    s = [];
  for (let [c, l] of [0, -0.1, 0.1, -0.2, 0.2, -0.3, 0.3, -0.4, 0.4].entries()) {
    let u = t + l;
    if (c && (u < 0.12 || u > 0.88)) continue;
    let { x: d, y: f, dx: p, dy: m } = zf(e, u),
      h;
    h =
      Math.abs(m) < 0.12
        ? [
            [0, -(a / 2 + o + 3)],
            [0, a / 2 + o + 3],
          ]
        : Math.abs(p) < 0.12
          ? [
              [n / 2 + o + 3, 0],
              [-(n / 2 + o + 3), 0],
            ]
          : p * m > 0
            ? [
                [n / 2 + o, -(a / 2 + o)],
                [-(n / 2 + o), a / 2 + o],
              ]
            : [
                [-(n / 2 + o), -(a / 2 + o)],
                [n / 2 + o, a / 2 + o],
              ];
    let g = h.map(([e, t]) => (t ? [e, t + Math.sign(t) * (a + 9)] : [e + Math.sign(e) * 26, t]));
    [...h, ...g].forEach(([e, t], o) => {
      let u = c * 4 + o,
        p = [d + e - n / 2, f + t - a / 2, d + e + n / 2, f + t + a / 2];
      (i < 0 || i === u) &&
        s.push({
          id: u,
          rect: p,
          cost: i < 0 ? r(p) + Math.abs(l) * 90 + (o % 2) * 2 + (o > 1 ? 22 : 0) : 0,
        });
    });
  }
  if (!s.length) return Vf(e, t, n, r, -1, a);
  let c = s.reduce((e, t) => (t.cost < e.cost ? t : e)),
    l = c.rect;
  return { side: c.id, rect: l, cx: (l[0] + l[2]) / 2, cy: (l[1] + l[3]) / 2, cost: c.cost };
}
var Hf = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,
  Uf = null;
function Wf(e) {
  return typeof Intl.Segmenter == `function`
    ? ((Uf && Uf.loc === or()) ||
        (Uf = { loc: or(), seg: new Intl.Segmenter(or(), { granularity: `word` }) }),
      new Set([...Uf.seg.segment(e)].map((e) => e.index)))
    : null;
}
function Gf(e) {
  if (
    e.includes(`
`)
  )
    return null;
  let t = [...e],
    n = Hf.test(e) ? Wf(e) : null,
    r = 0,
    i = null,
    a = t[0].length;
  for (let e = 1; e < t.length - 1; a += t[e].length, e++) {
    let o = t[e];
    if ((o >= `⁦` && o <= `⁨` ? r++ : o === `⁩` && (r = Math.max(0, r - 1)), r)) continue;
    let s, c;
    if (o === ` `) [s, c] = [t.slice(0, e).join(``), t.slice(e + 1).join(``)];
    else if (Hf.test(o) && Hf.test(t[e - 1]) && (!n || n.has(a)))
      [s, c] = [t.slice(0, e).join(``), t.slice(e).join(``)];
    else continue;
    if (
      ((s = s.trimEnd()),
      (c = c.trimStart()),
      !s || !c || /^[·→←:;,.!?)»”’%]/.test(c) || /[(«“‘]$/.test(s))
    )
      continue;
    let l = Math.max(Rr(s, jf), Rr(c, jf));
    (!i || l < i.w) && (i = { w: l, text: `${s}\n${c}` });
  }
  return i && i.text;
}
function Kf(e) {
  let { tw: t, h: n } = Vr(e, jf);
  return { w: t + 18, h: n };
}
function qf(e, t, n, r) {
  if (!n || e.type === `zone` || e.type === `panel`) return;
  if (!t || t.length < 3) {
    r.boxes.push(n);
    return;
  }
  r.polys.push(t);
  let i = 1 / 0,
    a = 1 / 0,
    o = -1 / 0,
    s = -1 / 0;
  for (let [e, n] of t)
    ((i = Math.min(i, e)), (a = Math.min(a, n)), (o = Math.max(o, e)), (s = Math.max(s, n)));
  let c = +(e.cpu >= 0) + (e.tags ? e.tags.length : 0),
    l = e.pills === `below`;
  (c && !l && r.boxes.push([n[0], n[1], n[2], a + 4]),
    ((c && l) || ((e.type === `crowd` || e.type === `device`) && e.label)) &&
      r.boxes.push([n[0], s - 4, n[2], n[3]]),
    e.type === `db` && e.label && r.boxes.push([o - 4, a, n[2], s]));
}
var Jf = (e, t) => JSON.stringify(e ?? null) === JSON.stringify(t ?? null);
function Yf(e, t) {
  let n = {};
  if (
    (Jf(e.tags, t.tags) || (n.tagSwap = !0),
    (Jf(e.label, t.label) && (e.sub || ``) === (t.sub || ``)) || (n.labelSwap = !0),
    e.type === `panel`)
  ) {
    let r = (e) => [e.title, e.icon, e.chart, e.lines, e.bars, e.w],
      i = Oi.panel({ ...e, boxW: void 0, boxH: void 0 }).size,
      a = Oi.panel({ ...t, boxW: void 0, boxH: void 0 }).size;
    n.card = {
      swap: !Jf(r(e), r(t)),
      w0: i.w,
      h0: i.h,
      w1: a.w,
      h1: a.h,
      keep: e.corner && e.corner === t.corner ? t.corner : null,
    };
  }
  return n;
}
function Xf(e, t, n, r = []) {
  let i = 0;
  for (let n of t.polys) Rf(n, e) && (i += 170);
  for (let n of t.boxes) {
    let t = Pf(e, n);
    t && (i += 90 + t / 6);
  }
  for (let t of r) {
    let n = Pf([e[0] - 4, e[1] - 4, e[2] + 4, e[3] + 4], t);
    n && (i += 90 + n / 3);
  }
  let a = [e[0] - 5, e[1] - 5, e[2] + 5, e[3] + 5];
  for (let [e, t] of n) e > a[0] && e < a[2] && t > a[1] && t < a[3] && (i += 18);
  return i;
}
var Zf = 155,
  Qf = { heavy: 0.7, ping: 0.85, slow: 0.32 },
  $f = new Set([`zone`, `ring`]),
  ep = {
    crowd: { count: 0, lift: 26 },
    device: { lift: 40 },
    ghost: {},
    zone: {},
    ring: {},
    queue: { n: 0, opacity: 1 },
    panel: { lift: -14 },
  },
  tp = {
    crowd: { count: 0 },
    queue: { n: 0, opacity: 1 },
    ghost: {},
    zone: {},
    ring: {},
    panel: { lift: -10 },
  };
function np(e) {
  return { ...ki[e.type], ...e };
}
function rp(e, t) {
  return JSON.stringify(e) === JSON.stringify(t);
}
function ip(e, t) {
  let n = (e, n) => {
    let r = /^([\w-]+?)([+-][\d.]+)?$/.exec(e);
    return t(r[1])[n] + (r[2] ? parseFloat(r[2]) : 0);
  };
  return typeof e == `string`
    ? [n(e, 0), n(e, 1)]
    : [typeof e[0] == `string` ? n(e[0], 0) : e[0], typeof e[1] == `string` ? n(e[1], 1) : e[1]];
}
export class StageEngine {
    constructor(e) {
      ((this.host = e),
        (this.svg = hf(`svg`, {
          class: `stage-svg`,
          xmlns: mf,
          preserveAspectRatio: `xMidYMid meet`,
          role: `img`,
        })),
        (this.svg.innerHTML = `
      <defs class="defs-theme">${pf(jr())}</defs>
      <defs>
        <radialGradient id="grid-fade" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#fff"/>
          <stop offset=".42" stop-color="#fff" stop-opacity=".92"/>
          <stop offset=".78" stop-color="#fff" stop-opacity=".35"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </radialGradient>
        <mask id="grid-mask" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000">
          <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid-fade)"/>
        </mask>
      </defs>
      <rect class="stage-grid" x="-5000" y="-5000" width="10000" height="10000" fill="url(#iso-grid)" mask="url(#grid-mask)"/>
      <g class="layer-floor"></g>
      <g class="layer-links"></g>
      <g class="layer-packets"></g>
      <g class="layer-ents"></g>
      <g class="layer-over"></g>
      <g class="layer-hud"></g>`),
        e.appendChild(this.svg),
        (this.L = {
          floor: this.svg.querySelector(`.layer-floor`),
          links: this.svg.querySelector(`.layer-links`),
          packets: this.svg.querySelector(`.layer-packets`),
          ents: this.svg.querySelector(`.layer-ents`),
          over: this.svg.querySelector(`.layer-over`),
          hud: this.svg.querySelector(`.layer-hud`),
        }),
        (this.fade = this.svg.querySelector(`#grid-fade`)),
        (this.defs = this.svg.querySelector(`.defs-theme`)),
        (this.ents = new Map()),
        (this.links = new Map()),
        (this.plans = new Map()),
        (this.hudScale = Cf),
        (this.showCards = !0),
        (this.onCards = null),
        (this.view = null),
        (this.blend = null),
        (this.onView = null),
        (this.onSwipe = null),
        (this.scenes = []),
        (this.flows = []),
        (this.packets = []),
        (this.anim = null),
        (this.paused = !1),
        (this.last = performance.now()),
        (this.onSettle = null),
        this.gestures(),
        (this.size = ``),
        new ResizeObserver(() => {
          let t = `${e.clientWidth}x${e.clientHeight}`;
          t !== this.size && ((this.size = t), this.refit());
        }).observe(e));
      let t = (e) => {
        (this.tick(e), requestAnimationFrame(t));
      };
      requestAnimationFrame(t);
    }
    layoutOf(e) {
      let t = Object.fromEntries(Object.entries(e.entities).map(([e, t]) => [e, np(t)])),
        n = (e) => ji(t[e]),
        r = [],
        i = { polys: [], boxes: [] },
        a = [],
        o = null,
        s = {},
        c = [1 / 0, 1 / 0, -1 / 0, -1 / 0],
        l = (e) =>
          (c = [
            Math.min(c[0], e[0]),
            Math.min(c[1], e[1]),
            Math.max(c[2], e[2]),
            Math.max(c[3], e[3]),
          ]);
      for (let [e, n] of Object.entries(t)) {
        if (n.type === `panel`) {
          if (!this.showCards) continue;
          let { size: e } = Oi.panel({ ...n, x: 0, y: 0, z: 0, dx: 0, dy: 0, lift: 0 });
          o = Nf(e, this.hudScale);
          continue;
        }
        let t = Oi[n.type](n);
        ((s[e] = t.poly),
          l(t.bounds),
          n.type === `zone` ? a.push(t.poly) : r.push(t.bounds),
          qf(n, t.poly, t.bounds, i));
      }
      let u = [],
        d = [];
      for (let [t, r] of Object.entries(e.links || {})) {
        let e = r.pts.map((e) => j(...ip(e, n)));
        ((e = Tr(e, s[r.from], 3)),
          r.to && (e = Er(e, s[r.to], r.heads === `none` ? 3 : 4)),
          u.push(...Bf(e)),
          r.label && d.push({ id: t, pts: e, t: r.labelAt ?? 0.5, label: r.label }));
      }
      for (let [e, t] of u) (r.push([e - 3, t - 3, e + 3, t + 3]), l([e - 3, t - 3, e + 3, t + 3]));
      let f = [],
        p = {};
      for (let e of d) {
        let t = [{ text: e.label, extra: 0 }],
          n = Kf(e.label).w > 70 && Gf(e.label);
        n && t.push({ text: n, extra: 14 });
        let a = null;
        for (let n of t) {
          let { w: t, h: r } = Kf(n.text),
            o = Vf(e.pts, e.t, t, (e) => Xf(e, i, u, f) + n.extra, -1, r);
          (!a || o.cost < a.at.cost) && (a = { at: o, text: n.text });
        }
        let { rect: o, side: s } = a.at;
        ((p[e.id] = { side: s, label: e.label, text: a.text }),
          f.push(o),
          r.push(o),
          l([o[0] - 2, o[1] - 2, o[2] + 2, o[3] + 4]));
      }
      return (
        c[0] === 1 / 0 && (c = [-100, -60, 100, 60]),
        { b: c, boxes: r, polys: a, panel: o, picks: p }
      );
    }
    dockRect(e, t) {
      let n = this.host.clientWidth,
        r = this.host.clientHeight,
        i = e[1] === `l` ? Tf.x : n - Tf.x - t.w,
        a = e[0] === `t` ? Tf.top : r - Tf.bottom - t.h;
      return [i, a, i + t.w, a + t.h];
    }
    dockAt(e, t, n) {
      let r = this.dockRect(e, Nf({ w: t, h: n }, this.hudScale));
      return { sx: r[0], sy: r[1] };
    }
    cardClear(e, t, n) {
      let r = this.host.clientWidth / t.w,
        i = this.dockRect(n, e.panel),
        a = [
          t.x + (i[0] - Ef) / r,
          t.y + (i[1] - Ef) / r,
          t.x + (i[2] + Ef) / r,
          t.y + (i[3] + Ef) / r,
        ];
      return !e.boxes.some((e) => Ff(e, a)) && !e.polys.some((e) => Rf(e, a));
    }
    planFor(e, t) {
      let n = this.layoutOf(e),
        r = Math.max(1, this.host.clientWidth),
        i = Math.max(1, this.host.clientHeight),
        [a, o, s, c] = n.b,
        l = Math.max(1, s - a),
        u = Math.max(1, c - o),
        d = (e, t, n) => {
          let s = t === 0 ? (r - l * e) / 2 : t < 0 ? Sf : r - Sf - l * e,
            c = n === 0 ? (i - u * e) / 2 : n < 0 ? Sf : i - Sf - u * e;
          return { x: a - s / e, y: o - c / e, w: r / e, h: i / e };
        },
        f = (e) => Math.max(xf, Math.floor(e * 20 + 1e-6) / 20),
        p = Math.min(bf, (r - 32) / l, (i - 32) / u),
        m = null;
      if (!n.panel) m = { zoom: f(p), ax: 0, ay: 0, corner: null };
      else {
        for (let [e, r] of Df.entries()) {
          let i = r[1] === `l` ? 1 : -1,
            a = r[0] === `t` ? 1 : -1,
            o = [
              [0, 0],
              [i, 0],
              [0, a],
              [i, a],
            ],
            s = null;
          for (let i = f(p); i >= 0.299999 && !s; i = Math.round((i - 0.05) * 100) / 100)
            for (let [a, [c, l]] of o.entries())
              if (this.cardClear(n, d(i, c, l), r)) {
                s = {
                  zoom: i,
                  ax: c,
                  ay: l,
                  corner: r,
                  score: i - a * 0.004 - e * 0.001 + (t && t.corner === r ? 0.045 : 0),
                };
                break;
              }
          s && (!m || s.score > m.score) && (m = s);
        }
        m ||= { zoom: f(p * 0.7), ax: -1, ay: 1, corner: `tr` };
      }
      let h = d(m.zoom, m.ax, m.ay),
        g = m.corner;
      if (t) {
        let e = Math.abs(t.zoom - m.zoom) < 1e-6,
          r = t.zoom < m.zoom && t.zoom >= m.zoom * 0.9;
        if (e || r) {
          let r = t.cam,
            i = 12 / t.zoom,
            l = a >= r.x + i && o >= r.y + i && s <= r.x + r.w - i && c <= r.y + r.h - i,
            u = Math.abs((a + s) / 2 - (r.x + r.w / 2)) / r.w,
            d = Math.abs((o + c) / 2 - (r.y + r.h / 2)) / r.h,
            f = e ? 0.12 : 0.18;
          if (l && u < f && d < f) {
            let e = n.panel
              ? [t.corner, ...Df].filter(Boolean).find((e) => this.cardClear(n, r, e))
              : null;
            (!n.panel || e) && ((h = r), (g = n.panel ? e : null), (m = { ...m, zoom: t.zoom }));
          }
        }
      }
      let _ = n.panel ? this.dockRect(g, n.panel) : null;
      return {
        cam: h,
        zoom: m.zoom,
        corner: g,
        dock: _ && { x: _[0], y: _[1], corner: g },
        picks: n.picks,
      };
    }
    measure() {
      let e = this.host.clientWidth;
      if (!e) return !1;
      this.hudScale = Math.min(Cf, Math.max(0.86, e / 780));
      let t = e >= wf;
      return t !== this.showCards && ((this.showCards = t), this.onCards?.(t), !0);
    }
    frame(e) {
      (this.measure(), (this.scenes = e), (this.plans = new Map()));
      let t = null;
      for (let n of e) ((t = this.planFor(n, t)), this.plans.set(n, t));
      ((this.scene = e[0]), this.setCam(this.plans.get(e[0]).cam));
    }
    plan(e) {
      return (this.plans.has(e) || this.plans.set(e, this.planFor(e, null)), this.plans.get(e));
    }
    displayCam(e = this.cam) {
      let t = e;
      if (this.view) {
        let n = e.w / this.view.k,
          r = e.h / this.view.k;
        t = { x: this.view.cx - n / 2, y: this.view.cy - r / 2, w: n, h: r };
      }
      let n = this.blend;
      if (!n) return t;
      let r = gf.inOut(vf((performance.now() - n.start) / n.dur));
      return r >= 1
        ? ((this.blend = null), t)
        : {
            x: _f(n.from.x, t.x, r),
            y: _f(n.from.y, t.y, r),
            w: _f(n.from.w, t.w, r),
            h: _f(n.from.h, t.h, r),
          };
    }
    setCam(e) {
      this.cam = e;
      let t = this.displayCam(e);
      this.svg.setAttribute(`viewBox`, `${A(t.x)} ${A(t.y)} ${A(t.w)} ${A(t.h)}`);
      let n = t.w / Math.max(1, this.host.clientWidth);
      this.L.hud.setAttribute(`transform`, `translate(${A(t.x)} ${A(t.y)}) scale(${n.toFixed(5)})`);
      let r = t.x + t.w / 2,
        i = t.y + t.h / 2;
      (this.fade.setAttribute(`cx`, A(r)),
        this.fade.setAttribute(`cy`, A(i)),
        this.fade.setAttribute(`r`, A(t.w * 0.56)),
        this.fade.setAttribute(
          `gradientTransform`,
          `translate(${A(r)} ${A(i)}) scale(1 0.6) translate(${A(-r)} ${A(-i)})`,
        ));
    }
    refit() {
      if (!this.scene) return;
      this.clearView();
      let e = this.measure(),
        t = this.scene,
        n = this.scenes.length ? this.scenes : [t];
      this.plans = new Map();
      let r = null;
      for (let e of n) ((r = this.planFor(e, r)), this.plans.set(e, r));
      let i = this.plan(t);
      if (e) this.goTo(t, { instant: !0 });
      else {
        this.anim ? (this.anim.cam.to = i.cam) : this.setCam(i.cam);
        for (let e of this.ents.values()) {
          if (e.cur.type !== `panel` || !i.dock) continue;
          let t = { sx: i.dock.x, sy: i.dock.y, corner: i.dock.corner };
          ((e.cur = { ...e.cur, ...t }),
            e.tween && !e.tween.remove && (e.tween.to = { ...e.tween.to, ...t }),
            this.renderEntity(e));
        }
      }
    }
    clampView(e) {
      if (!e) return null;
      let t = this.cam,
        n = this.host.clientWidth / t.w,
        r = Math.max(1.5, Math.min(6, 3.2 / n)),
        i = Math.max(1, Math.min(r, e.k));
      if (i <= 1.001) return null;
      let a = t.w / i,
        o = t.h / i;
      return {
        k: i,
        cx: Math.max(t.x + a / 2, Math.min(t.x + t.w - a / 2, e.cx)),
        cy: Math.max(t.y + o / 2, Math.min(t.y + t.h - o / 2, e.cy)),
      };
    }
    setView(e, t = !1) {
      let n = !!this.view,
        r = t ? { ...this.displayCam() } : null;
      ((this.view = this.clampView(e)),
        (this.blend = t ? { from: r, start: performance.now(), dur: 360 } : null),
        this.setCam(this.cam),
        n !== !!this.view &&
          (this.host.classList.toggle(`is-zoomed`, !!this.view), this.onView?.(!!this.view)));
    }
    clearView() {
      if (!this.view && !this.blend) return;
      let e = !!this.view;
      ((this.view = null),
        (this.blend = null),
        e && (this.host.classList.remove(`is-zoomed`), this.onView?.(!1)));
    }
    zoomAt(e, t, n) {
      let r = this.displayCam(),
        i = r.x + e * r.w,
        a = r.y + t * r.h,
        o = (this.view ? this.view.k : 1) * n,
        s = this.cam.w / o,
        c = this.cam.h / o;
      this.setView({ k: o, cx: i - e * s + s / 2, cy: a - t * c + c / 2 });
    }
    panBy(e, t) {
      if (!this.view) return;
      let n = this.displayCam();
      this.setView({ ...this.view, cx: this.view.cx - e * n.w, cy: this.view.cy - t * n.h });
    }
    toggleZoomAt(e, t) {
      if (this.view) {
        this.setView(null, !0);
        return;
      }
      let n = this.cam,
        r = n.w / 2,
        i = n.h / 2,
        a = n.x + e * n.w,
        o = n.y + t * n.h;
      this.setView({ k: 2, cx: a - e * r + r / 2, cy: o - t * i + i / 2 }, !0);
    }
    fit() {
      this.view && this.setView(null, !0);
    }
    gestures() {
      let e = this.host,
        t = () => e.getBoundingClientRect(),
        n = (e, n) => {
          let r = t();
          return [(e - r.left) / r.width, (n - r.top) / r.height];
        },
        r = (e) => ({
          d: Math.hypot(e[0].clientX - e[1].clientX, e[0].clientY - e[1].clientY),
          x: (e[0].clientX + e[1].clientX) / 2,
          y: (e[0].clientY + e[1].clientY) / 2,
        }),
        i = null,
        a = { at: 0, x: 0, y: 0 };
      (e.addEventListener(
        `touchstart`,
        (e) => {
          if (e.touches.length >= 2)
            (e.preventDefault(), (i = { mode: `two`, ...r(e.touches), pinched: !0 }));
          else if (e.touches.length === 1) {
            let t = e.touches[0];
            i = {
              mode: `one`,
              x: t.clientX,
              y: t.clientY,
              x0: t.clientX,
              y0: t.clientY,
              t0: performance.now(),
              moved: !1,
              pinched: !1,
            };
          }
        },
        { passive: !1 },
      ),
        e.addEventListener(
          `touchmove`,
          (e) => {
            if (!i) return;
            if (e.touches.length >= 2) {
              e.preventDefault();
              let a = r(e.touches);
              i.mode !== `two` && (i = { mode: `two`, ...a, pinched: !0 });
              let [o, s] = n(a.x, a.y);
              i.d > 0 && this.zoomAt(o, s, a.d / i.d);
              let c = t();
              (this.panBy((a.x - i.x) / c.width, (a.y - i.y) / c.height),
                Object.assign(i, { d: a.d, x: a.x, y: a.y }));
              return;
            }
            if (i.mode !== `one`) return;
            let a = e.touches[0];
            if ((Math.hypot(a.clientX - i.x0, a.clientY - i.y0) > 8 && (i.moved = !0), this.view)) {
              e.preventDefault();
              let n = t();
              this.panBy((a.clientX - i.x) / n.width, (a.clientY - i.y) / n.height);
            }
            ((i.x = a.clientX), (i.y = a.clientY));
          },
          { passive: !1 },
        ),
        e.addEventListener(`touchend`, (e) => {
          if (!i) return;
          if (e.touches.length === 1 && i.mode === `two`) {
            let t = e.touches[0];
            i = {
              mode: `one`,
              x: t.clientX,
              y: t.clientY,
              x0: t.clientX,
              y0: t.clientY,
              t0: 0,
              moved: !0,
              pinched: !0,
            };
            return;
          }
          if (e.touches.length) return;
          let t = performance.now();
          if (i.mode === `one` && !i.pinched) {
            let r = e.changedTouches[0],
              o = r.clientX - i.x0,
              s = r.clientY - i.y0;
            if (!this.view && t - i.t0 < 700 && Math.abs(o) > 50 && Math.abs(s) < Math.abs(o) * 0.6)
              this.onSwipe?.(o < 0 ? 1 : -1);
            else if (!i.moved && t - i.t0 < 300) {
              let i = Math.hypot(r.clientX - a.x, r.clientY - a.y) < 40;
              if (t - a.at < 320 && i) {
                e.preventDefault();
                let [t, i] = n(r.clientX, r.clientY);
                (this.toggleZoomAt(t, i), (a = { at: 0, x: 0, y: 0 }));
              } else a = { at: t, x: r.clientX, y: r.clientY };
            }
          }
          i = null;
        }),
        e.addEventListener(`touchcancel`, () => (i = null)));
      let o = null;
      (e.addEventListener(`pointerdown`, (t) => {
        t.pointerType === `mouse` &&
          t.button === 0 &&
          this.view &&
          ((o = { x: t.clientX, y: t.clientY }),
          e.setPointerCapture(t.pointerId),
          e.classList.add(`is-dragging`));
      }),
        e.addEventListener(`pointermove`, (e) => {
          if (!o) return;
          let n = t();
          (this.panBy((e.clientX - o.x) / n.width, (e.clientY - o.y) / n.height),
            (o = { x: e.clientX, y: e.clientY }));
        }));
      let s = () => {
        ((o = null), e.classList.remove(`is-dragging`));
      };
      (e.addEventListener(`pointerup`, s),
        e.addEventListener(`pointercancel`, s),
        e.addEventListener(`dblclick`, (e) => {
          let [t, r] = n(e.clientX, e.clientY);
          this.toggleZoomAt(t, r);
        }),
        e.addEventListener(
          `wheel`,
          (e) => {
            let r = e.deltaMode === 1 ? 16 : 1;
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              let [t, i] = n(e.clientX, e.clientY);
              this.zoomAt(t, i, Math.exp(-e.deltaY * r * 0.01));
            } else if (this.view) {
              e.preventDefault();
              let n = t();
              this.panBy((-e.deltaX * r) / n.width, (-e.deltaY * r) / n.height);
            }
          },
          { passive: !1 },
        ));
    }
    clear() {
      this.finish(!0);
      for (let e of this.ents.values()) (e.el.remove(), e.overEl.remove());
      for (let e of this.links.values()) (e.el.remove(), e.label.remove());
      (this.ents.clear(),
        this.links.clear(),
        this.clearPackets(!0),
        (this.flows = []),
        (this.L.floor.innerHTML = ``));
    }
    goTo(e, { instant: t = !1 } = {}) {
      (this.finish(!0), this.clearPackets(), (this.flows = []));
      let n = performance.now(),
        r = this.plan(e),
        i = Object.fromEntries(
          Object.entries(e.entities)
            .filter(([, e]) => e.type !== `panel` || this.showCards)
            .map(([e, t]) =>
              t.type === `panel` && r.dock
                ? [Of, { ...np(t), sx: r.dock.x, sy: r.dock.y, corner: r.dock.corner }]
                : [e, np(t)],
            ),
        ),
        a = [...this.ents.keys()].filter((e) => !i[e]),
        o = Object.keys(i).filter((e) => this.ents.has(e) && !rp(this.ents.get(e).cur, i[e])),
        s = Object.keys(i)
          .filter((e) => !this.ents.has(e))
          .sort((e, t) => Mi(i[e]) - Mi(i[t])),
        c = a.length ? yf.exit * 0.55 : 0,
        l = o.length ? c + yf.move * 0.75 : a.length ? yf.exit * 0.7 : 0,
        u = {},
        d = 0;
      for (let e of a) {
        let t = this.ents.get(e),
          r = tp[t.cur.type] || { lift: -22 };
        ((t.tween = {
          from: { ...t.cur },
          to: { ...t.cur, opacity: 0, ...r },
          start: n,
          delay: 0,
          dur: yf.exit,
          ease: gf.inOut,
          remove: !0,
        }),
          (d = Math.max(d, yf.exit)));
      }
      for (let e of Object.keys(i)) {
        let t = i[e];
        if (this.ents.has(e)) {
          let r = this.ents.get(e);
          o.includes(e)
            ? ((r.tween = {
                from: { ...r.cur },
                to: t,
                start: n,
                delay: c,
                dur: yf.move,
                ease: gf.inOut,
                ...Yf(r.cur, t),
              }),
              (u[e] = c + yf.move),
              (d = Math.max(d, u[e])))
            : (u[e] = 0);
        }
      }
      s.forEach((e, t) => {
        let r = i[e],
          a = { ...r, opacity: 0, ...(ep[r.type] || { lift: 120 }) },
          o = this.addEntity(e, a),
          s = l + t * yf.stagger;
        ((o.tween = {
          from: a,
          to: r,
          start: n,
          delay: s,
          dur: yf.enter,
          ease: gf.out,
          liftEase: gf.back,
          countEase: gf.inOut,
        }),
          (u[e] = s + yf.enter * 0.8),
          (d = Math.max(d, s + yf.enter)));
      });
      let f = Object.keys(e.links || {});
      for (let [t, r] of this.links)
        e.links?.[t] ||
          (r.tween = {
            from: r.opacity,
            to: 0,
            key: `opacity`,
            start: n,
            delay: 0,
            dur: 300,
            remove: !0,
          });
      let p = 0;
      for (let t of f) {
        let r = e.links[t];
        if (this.links.has(t)) {
          let e = this.links.get(t);
          ((e.spec = r), this.styleLink(e));
          continue;
        }
        let i = this.addLink(t, r),
          a =
            Math.max(u[r.from] ?? 0, u[r.to] ?? 0, c + (o.length ? yf.move * 0.6 : 0)) +
            60 +
            p * 90;
        ((p += 1),
          (i.draw = 0),
          (i.tween = { from: 0, to: 1, key: `draw`, start: n, delay: a, dur: yf.draw }),
          (d = Math.max(d, a + yf.draw)));
      }
      this.scene = e;
      let m = r.cam,
        h = { ...this.displayCam() };
      this.clearView();
      let g = a.length ? yf.exit * 0.4 : 0;
      ((d = Math.max(d, g + yf.move)),
        (this.anim = {
          cam: { from: h, to: m, delay: g, dur: yf.move },
          start: n,
          end: n + d,
          flows: e.flows || [],
          spot: [...s, ...o.filter((e) => !i[e].dead || this.ents.get(e).cur.dead !== i[e].dead)],
        }),
        t && this.finish());
    }
    finish(e = !1) {
      if (!this.anim) return;
      for (let [e, t] of [...this.ents])
        t.tween &&
          (t.tween.remove
            ? this.removeEntity(e)
            : ((t.cur = t.tween.to), (t.tween = null), this.renderEntity(t)));
      for (let [e, t] of [...this.links])
        t.tween &&
          (t.tween.remove
            ? (t.el.remove(), t.label.remove(), this.links.delete(e))
            : ((t[t.tween.key] = t.tween.to), (t.tween = null)));
      (this.setCam(this.anim.cam.to), this.sortDepth(), this.updateLinks(!0));
      let t = this.anim;
      ((this.anim = null), e || this.settle(t));
    }
    settle(e) {
      this.flows = e.flows.map((e) => ({ ...e, acc: 0.6, n: 0, rr: 0 }));
      for (let t of e.spot) this.spotlight(t);
      this.onSettle?.();
    }
    retheme() {
      this.defs.innerHTML = pf(jr());
      for (let e of this.ents.values()) this.renderEntity(e);
      for (let e of this.links.values()) ((e.labelKey = null), (e.labelBorn = 0));
      this.updateLinks(!0);
    }
    addEntity(e, t) {
      let n = hf(`g`, { "data-id": e, class: `ent ent--${t.type}` }),
        r = hf(`g`, { "data-id": e });
      (($f.has(t.type) ? this.L.floor : this.L.ents).appendChild(n),
        (t.type === `panel` ? this.L.hud : this.L.over).appendChild(r));
      let i = { id: e, cur: { ...t }, el: n, overEl: r, poly: null, tween: null };
      return (this.ents.set(e, i), this.renderEntity(i), i);
    }
    removeEntity(e) {
      let t = this.ents.get(e);
      (t.el.remove(), t.overEl.remove(), this.ents.delete(e));
    }
    renderEntity(e) {
      if (e.cur.type === `panel`) {
        let t = Oi.panel({ ...e.cur, x: 0, y: 0, z: 0, dx: 0, dy: 0 });
        ((e.overEl.innerHTML = `<g transform="translate(${A(e.cur.sx || 0)} ${A(e.cur.sy || 0)}) scale(${A(this.hudScale)})">${pf(t.over)}</g>`),
          (e.poly = null),
          (e.bounds = null));
        return;
      }
      let t = Oi[e.cur.type](e.cur);
      ((e.el.innerHTML = pf(t.body)),
        (e.overEl.innerHTML = pf(t.over)),
        (e.poly = t.poly),
        (e.bounds = t.bounds));
    }
    sortDepth() {
      let e = [...this.ents.values()]
          .filter((e) => !$f.has(e.cur.type))
          .sort((e, t) => Mi(e.cur) - Mi(t.cur)),
        t = [...this.L.ents.children];
      if (e.some((e, n) => t[n] !== e.el)) for (let t of e) this.L.ents.appendChild(t.el);
    }
    spotlight(e) {
      let t = this.ents.get(e);
      if (!t || [`panel`, `queue`, `zone`, `ring`].includes(t.cur.type)) return;
      let [n, r, i, a] = Ai(t.cur),
        o = 0.6,
        s = hf(`path`, {
          class: `spot`,
          d: Sr([j(n - o, i - o), j(n - o, a + o), j(r + o, a + o), j(r + o, i - o)], 7),
        });
      (this.L.floor.appendChild(s), setTimeout(() => s.remove(), 1600));
    }
    addLink(e, t) {
      let n = hf(`path`, { class: `link` });
      this.L.links.appendChild(n);
      let r = hf(`g`, { class: `link-label` });
      this.L.over.appendChild(r);
      let i = { id: e, spec: t, el: n, label: r, draw: 1, opacity: 1, tween: null, len: 0 };
      return (this.links.set(e, i), this.styleLink(i), i);
    }
    styleLink(e) {
      let t = e.spec.style || `solid`;
      e.el.setAttribute(`class`, `link link--${t}`);
    }
    updateLinks(e = !1) {
      let t = (e) => ji(this.ents.get(e).cur);
      for (let e of this.links.values()) {
        let n = e.spec;
        if (!this.ents.has(n.from) || (n.to && !this.ents.has(n.to))) continue;
        let r = n.pts.map((e) => j(...ip(e, t), 0));
        ((r = Tr(r, this.ents.get(n.from).poly, 3)),
          n.to && (r = Er(r, this.ents.get(n.to).poly, n.heads === `none` ? 3 : 4)),
          (e.pts = r),
          e.el.setAttribute(`d`, Cr(r, 9)),
          (e.len = e.el.getTotalLength()));
        let i = n.style || `solid`,
          a = i === `off` ? `url(#arrow-muted)` : `url(#arrow)`,
          o = e.draw > 0.97 && i !== `beat` && i !== `cut`;
        if (
          (e.el.setAttribute(`marker-end`, o && n.heads !== `none` ? a : ``),
          e.el.setAttribute(`marker-start`, o && n.heads === `both` ? a : ``),
          e.draw < 1 && i === `solid`
            ? ((e.el.style.strokeDasharray = `${A(e.len)} ${A(e.len)}`),
              (e.el.style.strokeDashoffset = A(e.len * (1 - e.draw))),
              (e.el.style.opacity = 1))
            : ((e.el.style.strokeDasharray = ``),
              (e.el.style.strokeDashoffset = ``),
              (e.el.style.opacity = A(e.opacity * (i === `solid` ? 1 : vf(e.draw * 1.4))))),
          n.label)
        ) {
          let t = this.labelText(e),
            r = `${t}|${n.labelTone || ``}`;
          e.labelKey !== r &&
            (e.labelKey && (e.labelBorn = performance.now()),
            (e.label.innerHTML = pf(zr(0, 0, t, { tone: n.labelTone || `paper`, size: jf }))),
            (e.labelKey = r));
          let i = e.labelBorn ? vf((performance.now() - e.labelBorn) / 320) : 1;
          e.label.style.opacity = A(vf((e.draw - 0.6) / 0.4) * e.opacity * i);
        } else e.labelKey &&= ((e.label.innerHTML = ``), null);
      }
      let n = this.plans.get(this.scene)?.picks || {};
      for (let t of this.links.values()) {
        let r = t.spec;
        if (!r.label || !t.pts) continue;
        let { w: i, h: a } = Kf(this.labelText(t)),
          o = Vf(t.pts, r.labelAt ?? 0.5, i, () => 0, n[t.id]?.side ?? 0, a);
        ((t.lpos =
          t.lpos && this.anim && !e
            ? [_f(t.lpos[0], o.cx, 0.16), _f(t.lpos[1], o.cy, 0.16)]
            : [o.cx, o.cy]),
          t.label.setAttribute(`transform`, `translate(${A(t.lpos[0])} ${A(t.lpos[1])})`));
      }
    }
    labelText(e) {
      let t = this.plans.get(this.scene)?.picks?.[e.id];
      return t && t.label === e.spec.label ? t.text : e.spec.label;
    }
    clearPackets(e = !1) {
      for (let t of this.packets)
        e
          ? t.el.remove()
          : (t.el.classList.add(`pkt--leave`), setTimeout(() => t.el.remove(), 260));
      this.packets = [];
    }
    pickRoute(e) {
      let t = e.pattern ? e.pattern[e.n % e.pattern.length] : e.kind || `req`;
      if (e.routes) {
        let n;
        if (e.pick === `weights`) {
          let t = e.routes.map((e) => e.weight ?? 1),
            r = Math.random() * t.reduce((e, t) => e + t, 0);
          ((n = t.findIndex((e) => (r -= e) <= 0)), n < 0 && (n = t.length - 1));
        } else ((n = e.rr % e.routes.length), (e.rr += 1));
        return ((e.n += 1), { route: e.routes[n].path, kind: e.routes[n].kind || t });
      }
      let n = e.route.map((t) => {
        if (typeof t == `string`) return t;
        if (e.pick === `weights`) {
          let n = Math.random() * e.weights.reduce((e, t) => e + t, 0);
          for (let r = 0; r < t.length; r++) if (((n -= e.weights[r]), n <= 0)) return t[r];
          return t[t.length - 1];
        }
        let n = t[e.rr % t.length];
        return ((e.rr += 1), n);
      });
      return ((e.n += 1), { route: n, kind: t });
    }
    spawn(e) {
      if (e.fanout) {
        e.n += 1;
        for (let t of e.routes) this.launch(t.path, t.kind || e.kind || `req`, e);
        return;
      }
      let { route: t, kind: n } = this.pickRoute(e);
      this.launch(t, n, e);
    }
    launch(e, t, n) {
      if (!e.every((e) => this.links.has(e))) return;
      let r = hf(`g`, { class: `pkt pkt--${t}` });
      ((r.innerHTML =
        t === `ping` || t === `kill`
          ? `<circle r="3.6"/>`
          : t === `heavy`
            ? `<rect x="-6" y="-6" width="12" height="12" rx="3.5"/>`
            : t === `write`
              ? `<rect x="-4.2" y="-4.2" width="8.4" height="8.4" rx="2"/>`
              : t === `msg` || t === `poison`
                ? `<rect x="-4.8" y="-4.8" width="9.6" height="9.6" rx="2.4"/>`
                : `<circle r="4.3"/>`),
        this.L.packets.appendChild(r),
        this.packets.push({
          route: e,
          seg: 0,
          d: 0,
          kind: t,
          el: r,
          back: !1,
          bounce: !!n.bounce,
          dwell: 0,
          speed: n.speed || 1,
          hold: n.hold || 0,
        }));
    }
    burst(e, t, n) {
      let r = hf(`g`, { class: `fx fx--${n}`, transform: `translate(${A(e)} ${A(t)})` });
      ((r.innerHTML =
        n === `fail`
          ? `<circle r="5" class="fx-ring"/><path d="M-3.6,-3.6 L3.6,3.6 M3.6,-3.6 L-3.6,3.6" class="fx-x"/>`
          : `<circle r="4.3" class="fx-ring"/>`),
        this.L.packets.appendChild(r),
        setTimeout(() => r.remove(), 700));
    }
    stepPackets(e) {
      for (let t of this.flows) for (t.acc += e * t.rate; t.acc >= 1;) (--t.acc, this.spawn(t));
      let t = [];
      for (let n of this.packets) {
        if (n.dwell > 0) {
          if (((n.dwell -= e), n.dwell > 0)) {
            t.push(n);
            continue;
          }
          ((n.el.style.opacity = 1),
            n.back && (n.el.classList.remove(`pkt--held`), n.el.classList.add(`pkt--back`)));
        }
        let r = this.links.get(n.route[n.seg]);
        if (!r) {
          n.el.remove();
          continue;
        }
        let i = Zf * n.speed * (Qf[n.kind] || 1);
        n.d += i * e;
        let a = r.len || r.el.getTotalLength(),
          o = r.spec.style || `solid`,
          s = o === `beat` || o === `cut` ? `none` : r.spec.heads,
          c = s === `both` ? kf : 0,
          l = a - (s === `none` ? 0 : kf);
        l - c < 10 && ((c = 0), (l = a));
        let u = l - c;
        if (n.d >= u) {
          let e = r.el.getPointAtLength(n.back ? c : l);
          if (!n.back && Math.random() < (r.spec.fail || 0)) {
            (this.burst(e.x, e.y, `fail`), n.el.remove());
            continue;
          }
          if (!n.back && n.seg < n.route.length - 1) {
            ((n.seg += 1), (n.d = 0), (n.dwell = 0.16), (n.el.style.opacity = 0), t.push(n));
            continue;
          }
          if (n.bounce && !n.back) {
            ((n.back = !0),
              (n.d = 0),
              n.hold
                ? ((n.dwell = n.hold), n.el.classList.add(`pkt--held`))
                : n.el.classList.add(`pkt--back`),
              t.push(n));
            continue;
          }
          if (n.back && n.seg > 0) {
            (--n.seg, (n.d = 0), (n.dwell = 0.16), (n.el.style.opacity = 0), t.push(n));
            continue;
          }
          (this.burst(e.x, e.y, `ok`), n.el.remove());
          continue;
        }
        let d = r.el.getPointAtLength(n.back ? l - n.d : c + n.d);
        (n.el.setAttribute(`transform`, `translate(${A(d.x)} ${A(d.y)})`), t.push(n));
      }
      this.packets = t;
    }
    tick(e) {
      let t = Math.min(0.05, (e - this.last) / 1e3);
      if (((this.last = e), this.anim)) {
        let t = this.anim.cam,
          n = gf.inOut(vf((e - this.anim.start - t.delay) / t.dur));
        this.setCam({
          x: _f(t.from.x, t.to.x, n),
          y: _f(t.from.y, t.to.y, n),
          w: _f(t.from.w, t.to.w, n),
          h: _f(t.from.h, t.to.h, n),
        });
        let r = !1;
        for (let [t, n] of [...this.ents]) {
          let i = n.tween;
          if (!i) continue;
          let a = (e - i.start - i.delay) / i.dur;
          if (a < 0 && !i.started) continue;
          i.started = !0;
          let o = vf(a),
            s = i.ease(o),
            c = i.remove || o >= 0.5 || !i.started ? { ...i.to } : { ...i.from };
          !i.remove && o < 0.5 && (c.cpu = i.from.cpu);
          for (let e in i.to) {
            let t = i.from[e],
              n = i.to[e];
            typeof t != `number` ||
              typeof n != `number` ||
              (e === `cpu` && (t < 0 || n < 0)) ||
              (c[e] = _f(
                t,
                n,
                e === `lift` && i.liftEase
                  ? i.liftEase(o)
                  : (e === `count` || e === `n`) && i.countEase
                    ? i.countEase(o)
                    : s,
              ));
          }
          let l = 1 - vf(o / 0.42),
            u = vf((o - 0.55) / 0.4);
          if (
            (i.tagSwap && (c.tagFade = o < 0.5 ? l : u),
            i.labelSwap && (c.labelFade = o < 0.5 ? l : u),
            i.card)
          ) {
            let e = i.card,
              t = e.w1,
              n = e.h1;
            if (e.swap) {
              let r = gf.inOut(vf((o - 0.24) / 0.48));
              ((t = _f(e.w0, e.w1, r)),
                (n = _f(e.h0, e.h1, r)),
                (c.boxW = t),
                (c.boxH = n),
                (c.fade = o < 0.5 ? 1 - vf(o / 0.24) : vf((o - 0.72) / 0.28)));
            }
            e.keep && Object.assign(c, this.dockAt(e.keep, t, n));
          }
          ((n.cur = c),
            this.renderEntity(n),
            (r = !0),
            o >= 1 &&
              (i.remove
                ? this.removeEntity(t)
                : ((n.cur = i.to), (n.tween = null), this.renderEntity(n))));
        }
        for (let [t, n] of [...this.links]) {
          let r = n.tween;
          if (!r) continue;
          let i = vf((e - r.start - r.delay) / r.dur);
          ((n[r.key] = _f(r.from, r.to, gf.inOut(i))),
            i >= 1 &&
              (r.remove
                ? (n.el.remove(), n.label.remove(), this.links.delete(t))
                : (n.tween = null)));
        }
        if ((r && this.sortDepth(), this.updateLinks(), e >= this.anim.end)) {
          let e = this.anim;
          ((this.anim = null), this.updateLinks(!0), this.settle(e));
        }
      }
      (this.blend && !this.anim && this.setCam(this.cam), this.paused || this.stepPackets(t));
    }
  }
