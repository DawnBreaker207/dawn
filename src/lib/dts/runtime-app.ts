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
var ap = class {
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
  },
  op = /^([+~−-]|[=!#]) /,
  sp = (e, t) => {
    let n = op.exec(e);
    return n ? n[0] + t(e.slice(2)) : t(e);
  },
  cp = (e, t) =>
    Array.isArray(e)
      ? e.length
        ? t(
            e.join(`
`),
          ).split(`
`)
        : e
      : t(e),
  lp = new Set([`label`, `sub`, `text`, `title`, `note`]);
function up(e, t) {
  if (Array.isArray(e)) return e.map((e) => up(e, t));
  if (!e || typeof e != `object`) return e;
  let n = {};
  for (let [r, i] of Object.entries(e))
    n[r] =
      r === `lines` && Array.isArray(i)
        ? i.map((e) => (typeof e == `string` ? sp(e, t) : e))
        : lp.has(r) &&
            (typeof i == `string` || (Array.isArray(i) && i.every((e) => typeof e == `string`)))
          ? i === ``
            ? i
            : cp(i, t)
          : typeof i == `object`
            ? up(i, t)
            : i;
  return n;
}
function dp(e, t, n = () => {}) {
  let r = (e) => (typeof e == `string` && e.trim() ? t(e) : e);
  return {
    ...e,
    title: r(e.title),
    summary: r(e.summary),
    goals: e.goals.map((e) => ({ ...e, text: r(e.text) })),
    legend: e.legend.map((e) => (Array.isArray(e) ? [e[0], r(e[1])] : e)),
    steps: e.steps.map((e) => {
      for (let t of Object.values(e.metrics || {})) typeof t == `string` && n(t);
      return {
        ...e,
        short: r(e.short),
        title: r(e.title),
        body: e.body.map(r),
        callout: e.callout && { ...e.callout, text: r(e.callout.text) },
        changes: e.changes && e.changes.map((e) => sp(e, r)),
        scene: up(e.scene, r),
      };
    }),
  };
}
var fp = `modulepreload`,
  pp = function (e) {
    return `/` + e;
  },
  mp = {},
  hp = function (e) {
    return e.pathname.endsWith(`.css`);
  },
  gp = function (e, t, n) {
    if (t in e) return e[t];
    let r = n();
    if (!r) {
      e[t] = void 0;
      return;
    }
    let i = r.then(
      () => {
        e[t] = void 0;
      },
      (n) => {
        throw ((e[t] = void 0), n);
      },
    );
    return ((e[t] = i), i);
  },
  J = function (e, t, n) {
    let r = Promise.resolve();
    if (t && t.length > 0) {
      let e,
        i = document.querySelector(`meta[property=csp-nonce]`),
        a = i?.nonce || i?.getAttribute(`nonce`);
      function o(e) {
        return Promise.all(
          e.map((e) =>
            Promise.resolve(e).then(
              (e) => ({ status: `fulfilled`, value: e }),
              (e) => ({ status: `rejected`, reason: e }),
            ),
          ),
        );
      }
      function s(e) {
        return import.meta.resolve ? new URL(import.meta.resolve(e)) : new URL(e, import.meta.url);
      }
      r = o(
        t
          .map((t) => {
            t = pp(t, n);
            let r = s(t),
              i = hp(r);
            return gp(mp, r.href, () => {
              if (e === void 0) {
                e = { all: new Set(), styles: new Set() };
                let t = document.getElementsByTagName(`link`);
                for (let n = t.length - 1; n >= 0; n--) {
                  let r = t[n];
                  (e.all.add(r.href), r.rel === `stylesheet` && e.styles.add(r.href));
                }
              }
              if ((i ? e.styles : e.all).has(r.href)) return;
              let t = document.createElement(`link`);
              if (
                ((t.rel = i ? `stylesheet` : fp),
                i || (t.as = `script`),
                (t.crossOrigin = ``),
                (t.href = r.href),
                a && t.setAttribute(`nonce`, a),
                document.head.appendChild(t),
                i)
              )
                return new Promise((e, n) => {
                  let i = (a) => {
                    (t.removeEventListener(`load`, i),
                      t.removeEventListener(`error`, i),
                      a.type === `error` ? n(Error(`Unable to preload CSS for ${r}`)) : e(a));
                  };
                  (t.addEventListener(`load`, i), t.addEventListener(`error`, i));
                });
            });
          })
          .filter((e) => e !== void 0),
      );
    }
    function i(e) {
      let t = new Event(`vite:preloadError`, { cancelable: !0 });
      if (((t.payload = e), window.dispatchEvent(t), !t.defaultPrevented)) throw e;
    }
    return r.then((t) => {
      for (let e of t || []) e.status === `rejected` && i(e.reason);
      return e().catch(i);
    });
  },
  _p = Object.assign({
    "./ar/ui.json": () => J(() => import(`./ui-D4j7CXr5.js`).then((e) => e.default), []),
    "./de/ui.json": () => J(() => import(`./ui-kGA3zDZ9.js`).then((e) => e.default), []),
    "./el/ui.json": () => J(() => import(`./ui-Cp2_Z1z4.js`).then((e) => e.default), []),
    "./es/ui.json": () => J(() => import(`./ui-BRJ4JvhW.js`).then((e) => e.default), []),
    "./fr/ui.json": () => J(() => import(`./ui-D6JJQSk5.js`).then((e) => e.default), []),
    "./he/ui.json": () => J(() => import(`./ui-aPXFhHE2.js`).then((e) => e.default), []),
    "./hi/ui.json": () => J(() => import(`./ui-BGpJTybb.js`).then((e) => e.default), []),
    "./id/ui.json": () => J(() => import(`./ui-BWrIg3Hf.js`).then((e) => e.default), []),
    "./it/ui.json": () => J(() => import(`./ui-DE-hZMQA.js`).then((e) => e.default), []),
    "./ja/ui.json": () => J(() => import(`./ui-XutUxLpg.js`).then((e) => e.default), []),
    "./ko/ui.json": () => J(() => import(`./ui-qBCUioJE.js`).then((e) => e.default), []),
    "./nl/ui.json": () => J(() => import(`./ui-B3307ytf.js`).then((e) => e.default), []),
    "./pl/ui.json": () => J(() => import(`./ui-BbVdj7tI.js`).then((e) => e.default), []),
    "./pt/ui.json": () => J(() => import(`./ui-plHAVRXA.js`).then((e) => e.default), []),
    "./ru/ui.json": () => J(() => import(`./ui-CoJV4TJO.js`).then((e) => e.default), []),
    "./tr/ui.json": () => J(() => import(`./ui-CfG0pgeI.js`).then((e) => e.default), []),
    "./uk/ui.json": () => J(() => import(`./ui-CHc5KAxp.js`).then((e) => e.default), []),
    "./vi/ui.json": () => J(() => import(`./ui-o9yVGuYw.js`).then((e) => e.default), []),
    "./zh-Hans/ui.json": () => J(() => import(`./ui-CeCbSWW5.js`).then((e) => e.default), []),
    "./zh-Hant/ui.json": () => J(() => import(`./ui-D1jcMWnl.js`).then((e) => e.default), []),
  }),
  vp = Object.assign({
    "./ar/lessons/apis.json": () =>
      J(() => import(`./apis-C_mydZ6m.js`).then((e) => e.default), []),
    "./ar/lessons/authentication.json": () =>
      J(() => import(`./authentication-Dktb-vqB.js`).then((e) => e.default), []),
    "./ar/lessons/authorization.json": () =>
      J(() => import(`./authorization-BP_kewK3.js`).then((e) => e.default), []),
    "./ar/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-1qm_QdKW.js`).then((e) => e.default), []),
    "./ar/lessons/caching.json": () =>
      J(() => import(`./caching-t8r2GfWP.js`).then((e) => e.default), []),
    "./ar/lessons/cap.json": () => J(() => import(`./cap-Cr2VtLMO.js`).then((e) => e.default), []),
    "./ar/lessons/cdn.json": () => J(() => import(`./cdn-C54VPA2i.js`).then((e) => e.default), []),
    "./ar/lessons/cicd.json": () =>
      J(() => import(`./cicd-DjXFzlt2.js`).then((e) => e.default), []),
    "./ar/lessons/consensus.json": () =>
      J(() => import(`./consensus-Zdi0fwvp.js`).then((e) => e.default), []),
    "./ar/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-BUSJD7vu.js`).then((e) => e.default), []),
    "./ar/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-CIhdYjez.js`).then((e) => e.default), []),
    "./ar/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-Cij2_Plm.js`).then((e) => e.default), []),
    "./ar/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-BVBDHLxr.js`).then((e) => e.default), []),
    "./ar/lessons/encryption.json": () =>
      J(() => import(`./encryption-BKPBGT31.js`).then((e) => e.default), []),
    "./ar/lessons/files.json": () =>
      J(() => import(`./files-BSjoMTK9.js`).then((e) => e.default), []),
    "./ar/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-CCSxqpKO.js`).then((e) => e.default), []),
    "./ar/lessons/indexes.json": () =>
      J(() => import(`./indexes-B2gRedh8.js`).then((e) => e.default), []),
    "./ar/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-BhpTrCcf.js`).then((e) => e.default), []),
    "./ar/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-DlQqsWRA.js`).then((e) => e.default), []),
    "./ar/lessons/microservices.json": () =>
      J(() => import(`./microservices-BOYdR5ft.js`).then((e) => e.default), []),
    "./ar/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-B3C4yCxJ.js`).then((e) => e.default), []),
    "./ar/lessons/observability.json": () =>
      J(() => import(`./observability-DDR8Da_v.js`).then((e) => e.default), []),
    "./ar/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-D-Q63Fij.js`).then((e) => e.default), []),
    "./ar/lessons/queues.json": () =>
      J(() => import(`./queues-BT_uGANN.js`).then((e) => e.default), []),
    "./ar/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-Blhh1kUI.js`).then((e) => e.default), []),
    "./ar/lessons/realtime.json": () =>
      J(() => import(`./realtime-JJ6eDzMU.js`).then((e) => e.default), []),
    "./ar/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-B9lyQtwY.js`).then((e) => e.default), []),
    "./ar/lessons/replication.json": () =>
      J(() => import(`./replication-CVY3Hsvm.js`).then((e) => e.default), []),
    "./ar/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-DiUnr-H8.js`).then((e) => e.default), []),
    "./ar/lessons/sagas.json": () =>
      J(() => import(`./sagas-SrH9CTh_.js`).then((e) => e.default), []),
    "./ar/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-rw5MTlXu.js`).then((e) => e.default), []),
    "./ar/lessons/sharding.json": () =>
      J(() => import(`./sharding-pNcBRau8.js`).then((e) => e.default), []),
    "./ar/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-HH-wdhrD.js`).then((e) => e.default), []),
    "./ar/lessons/stateless.json": () =>
      J(() => import(`./stateless-CXCcW8O3.js`).then((e) => e.default), []),
    "./ar/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-BD2lFWNu.js`).then((e) => e.default), []),
    "./ar/lessons/testing.json": () =>
      J(() => import(`./testing-DX8pUTHX.js`).then((e) => e.default), []),
    "./ar/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-czPfnH8e.js`).then((e) => e.default), []),
    "./ar/lessons/transactions.json": () =>
      J(() => import(`./transactions-CX8PE4_Z.js`).then((e) => e.default), []),
    "./ar/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-DvZ8dTfo.js`).then((e) => e.default), []),
    "./ar/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-BmllzwJS.js`).then((e) => e.default), []),
    "./de/lessons/apis.json": () =>
      J(() => import(`./apis-_uFcJMu2.js`).then((e) => e.default), []),
    "./de/lessons/authentication.json": () =>
      J(() => import(`./authentication-CcwHKEvm.js`).then((e) => e.default), []),
    "./de/lessons/authorization.json": () =>
      J(() => import(`./authorization-DjGn0ez9.js`).then((e) => e.default), []),
    "./de/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-BD2gj9wx.js`).then((e) => e.default), []),
    "./de/lessons/caching.json": () =>
      J(() => import(`./caching-D4CrMolP.js`).then((e) => e.default), []),
    "./de/lessons/cap.json": () => J(() => import(`./cap-15Gt5la_.js`).then((e) => e.default), []),
    "./de/lessons/cdn.json": () => J(() => import(`./cdn-BUEeJMq_.js`).then((e) => e.default), []),
    "./de/lessons/cicd.json": () =>
      J(() => import(`./cicd-C2xKXLQ-.js`).then((e) => e.default), []),
    "./de/lessons/consensus.json": () =>
      J(() => import(`./consensus-C9IShlKa.js`).then((e) => e.default), []),
    "./de/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-x4KwwkqN.js`).then((e) => e.default), []),
    "./de/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-BQDB5M0Q.js`).then((e) => e.default), []),
    "./de/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-D6AurAmh.js`).then((e) => e.default), []),
    "./de/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-UGaRR_03.js`).then((e) => e.default), []),
    "./de/lessons/encryption.json": () =>
      J(() => import(`./encryption-COBsBL3j.js`).then((e) => e.default), []),
    "./de/lessons/files.json": () =>
      J(() => import(`./files-C3YPvyR9.js`).then((e) => e.default), []),
    "./de/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-CszRTYEB.js`).then((e) => e.default), []),
    "./de/lessons/indexes.json": () =>
      J(() => import(`./indexes-5iaFYziL.js`).then((e) => e.default), []),
    "./de/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-DfK2JOy7.js`).then((e) => e.default), []),
    "./de/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-CZrBAcvG.js`).then((e) => e.default), []),
    "./de/lessons/microservices.json": () =>
      J(() => import(`./microservices-DR22UoNF.js`).then((e) => e.default), []),
    "./de/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-DYTSXdoN.js`).then((e) => e.default), []),
    "./de/lessons/observability.json": () =>
      J(() => import(`./observability-Bnz5pWX3.js`).then((e) => e.default), []),
    "./de/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-B84mzGpM.js`).then((e) => e.default), []),
    "./de/lessons/queues.json": () =>
      J(() => import(`./queues-B30UoWXC.js`).then((e) => e.default), []),
    "./de/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-Dz41jHa0.js`).then((e) => e.default), []),
    "./de/lessons/realtime.json": () =>
      J(() => import(`./realtime-HKMIpRuq.js`).then((e) => e.default), []),
    "./de/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-gDX9WKuA.js`).then((e) => e.default), []),
    "./de/lessons/replication.json": () =>
      J(() => import(`./replication-BC3rMy3I.js`).then((e) => e.default), []),
    "./de/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-DDz7HTKz.js`).then((e) => e.default), []),
    "./de/lessons/sagas.json": () =>
      J(() => import(`./sagas-B_ehidoa.js`).then((e) => e.default), []),
    "./de/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-BLxEJc_N.js`).then((e) => e.default), []),
    "./de/lessons/sharding.json": () =>
      J(() => import(`./sharding-CzRB-C8n.js`).then((e) => e.default), []),
    "./de/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-C5cVHn1V.js`).then((e) => e.default), []),
    "./de/lessons/stateless.json": () =>
      J(() => import(`./stateless-BvFpBZIv.js`).then((e) => e.default), []),
    "./de/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-D4Lr-iyw.js`).then((e) => e.default), []),
    "./de/lessons/testing.json": () =>
      J(() => import(`./testing-DHvMBPIt.js`).then((e) => e.default), []),
    "./de/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-CnuToRn7.js`).then((e) => e.default), []),
    "./de/lessons/transactions.json": () =>
      J(() => import(`./transactions-DIgC-v5L.js`).then((e) => e.default), []),
    "./de/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-Bd0ku3GG.js`).then((e) => e.default), []),
    "./de/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-CZ00BqKh.js`).then((e) => e.default), []),
    "./el/lessons/apis.json": () =>
      J(() => import(`./apis-BpdNTqxc.js`).then((e) => e.default), []),
    "./el/lessons/authentication.json": () =>
      J(() => import(`./authentication-CS6ok9qS.js`).then((e) => e.default), []),
    "./el/lessons/authorization.json": () =>
      J(() => import(`./authorization-Cv852ZlO.js`).then((e) => e.default), []),
    "./el/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-Ba1KrHzT.js`).then((e) => e.default), []),
    "./el/lessons/caching.json": () =>
      J(() => import(`./caching-DNhuauWP.js`).then((e) => e.default), []),
    "./el/lessons/cap.json": () => J(() => import(`./cap-DXnGLdy5.js`).then((e) => e.default), []),
    "./el/lessons/cdn.json": () => J(() => import(`./cdn-Dylu658B.js`).then((e) => e.default), []),
    "./el/lessons/cicd.json": () =>
      J(() => import(`./cicd-CionnRjD.js`).then((e) => e.default), []),
    "./el/lessons/consensus.json": () =>
      J(() => import(`./consensus-DEZJ0sGL.js`).then((e) => e.default), []),
    "./el/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-PSYu2LUC.js`).then((e) => e.default), []),
    "./el/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-CFgKLCxl.js`).then((e) => e.default), []),
    "./el/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-B-WuK3O7.js`).then((e) => e.default), []),
    "./el/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-wXTz-uDC.js`).then((e) => e.default), []),
    "./el/lessons/encryption.json": () =>
      J(() => import(`./encryption-mQqNwDDX.js`).then((e) => e.default), []),
    "./el/lessons/files.json": () =>
      J(() => import(`./files-BvSQXweV.js`).then((e) => e.default), []),
    "./el/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-CbutyqZO.js`).then((e) => e.default), []),
    "./el/lessons/indexes.json": () =>
      J(() => import(`./indexes-Bb_d52E6.js`).then((e) => e.default), []),
    "./el/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-CcKIK9KJ.js`).then((e) => e.default), []),
    "./el/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-CUJoj7hz.js`).then((e) => e.default), []),
    "./el/lessons/microservices.json": () =>
      J(() => import(`./microservices-CvsTOTDd.js`).then((e) => e.default), []),
    "./el/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-CiUJ6XQb.js`).then((e) => e.default), []),
    "./el/lessons/observability.json": () =>
      J(() => import(`./observability-D-0WIZlN.js`).then((e) => e.default), []),
    "./el/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-BDMVVnzB.js`).then((e) => e.default), []),
    "./el/lessons/queues.json": () =>
      J(() => import(`./queues-CwylCwdu.js`).then((e) => e.default), []),
    "./el/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-Dl146kQq.js`).then((e) => e.default), []),
    "./el/lessons/realtime.json": () =>
      J(() => import(`./realtime-Bmj38l4-.js`).then((e) => e.default), []),
    "./el/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-c9QTC5As.js`).then((e) => e.default), []),
    "./el/lessons/replication.json": () =>
      J(() => import(`./replication-B4ApQZpC.js`).then((e) => e.default), []),
    "./el/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-Dl4Fifi2.js`).then((e) => e.default), []),
    "./el/lessons/sagas.json": () =>
      J(() => import(`./sagas-DGX_R7E3.js`).then((e) => e.default), []),
    "./el/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-BIc_xfmj.js`).then((e) => e.default), []),
    "./el/lessons/sharding.json": () =>
      J(() => import(`./sharding-B7kZr3V0.js`).then((e) => e.default), []),
    "./el/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-DY9MbNja.js`).then((e) => e.default), []),
    "./el/lessons/stateless.json": () =>
      J(() => import(`./stateless-qxndNIGE.js`).then((e) => e.default), []),
    "./el/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-Cg7SaymL.js`).then((e) => e.default), []),
    "./el/lessons/testing.json": () =>
      J(() => import(`./testing-T4r6a9JW.js`).then((e) => e.default), []),
    "./el/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-D7JTNF-w.js`).then((e) => e.default), []),
    "./el/lessons/transactions.json": () =>
      J(() => import(`./transactions-DoUZdHic.js`).then((e) => e.default), []),
    "./el/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-BZ4K2Z9m.js`).then((e) => e.default), []),
    "./el/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-DZ-510ds.js`).then((e) => e.default), []),
    "./es/lessons/apis.json": () =>
      J(() => import(`./apis-C_HTI6Xn.js`).then((e) => e.default), []),
    "./es/lessons/authentication.json": () =>
      J(() => import(`./authentication-C7vbQX3y.js`).then((e) => e.default), []),
    "./es/lessons/authorization.json": () =>
      J(() => import(`./authorization-BdHv-Sw_.js`).then((e) => e.default), []),
    "./es/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-UHqsqgE5.js`).then((e) => e.default), []),
    "./es/lessons/caching.json": () =>
      J(() => import(`./caching-CuJZmXh9.js`).then((e) => e.default), []),
    "./es/lessons/cap.json": () => J(() => import(`./cap-BeXjEr1v.js`).then((e) => e.default), []),
    "./es/lessons/cdn.json": () => J(() => import(`./cdn-4rjEOcoG.js`).then((e) => e.default), []),
    "./es/lessons/cicd.json": () =>
      J(() => import(`./cicd-FbrebmF9.js`).then((e) => e.default), []),
    "./es/lessons/consensus.json": () =>
      J(() => import(`./consensus-Cl3femxZ.js`).then((e) => e.default), []),
    "./es/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-BIGQqm2b.js`).then((e) => e.default), []),
    "./es/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-CVuY5dJd.js`).then((e) => e.default), []),
    "./es/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-D7A0msXU.js`).then((e) => e.default), []),
    "./es/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-CcvsdIX9.js`).then((e) => e.default), []),
    "./es/lessons/encryption.json": () =>
      J(() => import(`./encryption-BHSSWPrv.js`).then((e) => e.default), []),
    "./es/lessons/files.json": () =>
      J(() => import(`./files-BrwmPe-c.js`).then((e) => e.default), []),
    "./es/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-CAqKYyy7.js`).then((e) => e.default), []),
    "./es/lessons/indexes.json": () =>
      J(() => import(`./indexes-CkDuoPl6.js`).then((e) => e.default), []),
    "./es/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-B4d-ZZqv.js`).then((e) => e.default), []),
    "./es/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-DMOLXeZs.js`).then((e) => e.default), []),
    "./es/lessons/microservices.json": () =>
      J(() => import(`./microservices-DSPsqqkf.js`).then((e) => e.default), []),
    "./es/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-Cp9IuaF9.js`).then((e) => e.default), []),
    "./es/lessons/observability.json": () =>
      J(() => import(`./observability-h7fWyXAn.js`).then((e) => e.default), []),
    "./es/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-CisFpi11.js`).then((e) => e.default), []),
    "./es/lessons/queues.json": () =>
      J(() => import(`./queues-CCWAJ5jk.js`).then((e) => e.default), []),
    "./es/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-C83Q60WG.js`).then((e) => e.default), []),
    "./es/lessons/realtime.json": () =>
      J(() => import(`./realtime-FQBA6IPv.js`).then((e) => e.default), []),
    "./es/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-C4FAXU3q.js`).then((e) => e.default), []),
    "./es/lessons/replication.json": () =>
      J(() => import(`./replication-C5FAit6u.js`).then((e) => e.default), []),
    "./es/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-C6fLr-m8.js`).then((e) => e.default), []),
    "./es/lessons/sagas.json": () =>
      J(() => import(`./sagas-CPC7R8Dx.js`).then((e) => e.default), []),
    "./es/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-DP5UQgcd.js`).then((e) => e.default), []),
    "./es/lessons/sharding.json": () =>
      J(() => import(`./sharding-C74FG9_9.js`).then((e) => e.default), []),
    "./es/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-qOnhqmUj.js`).then((e) => e.default), []),
    "./es/lessons/stateless.json": () =>
      J(() => import(`./stateless-d8gROosJ.js`).then((e) => e.default), []),
    "./es/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-DGL8Q97T.js`).then((e) => e.default), []),
    "./es/lessons/testing.json": () =>
      J(() => import(`./testing-DCOL2sTT.js`).then((e) => e.default), []),
    "./es/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-C0-iaon2.js`).then((e) => e.default), []),
    "./es/lessons/transactions.json": () =>
      J(() => import(`./transactions-Co1_tXPQ.js`).then((e) => e.default), []),
    "./es/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-DCuI7NKY.js`).then((e) => e.default), []),
    "./es/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-CiISclgj.js`).then((e) => e.default), []),
    "./fr/lessons/apis.json": () =>
      J(() => import(`./apis-DQxnfwUj.js`).then((e) => e.default), []),
    "./fr/lessons/authentication.json": () =>
      J(() => import(`./authentication-Cx1wJ0qR.js`).then((e) => e.default), []),
    "./fr/lessons/authorization.json": () =>
      J(() => import(`./authorization-wYn30L2h.js`).then((e) => e.default), []),
    "./fr/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-DePDVIvj.js`).then((e) => e.default), []),
    "./fr/lessons/caching.json": () =>
      J(() => import(`./caching-KI6Ij6XS.js`).then((e) => e.default), []),
    "./fr/lessons/cap.json": () => J(() => import(`./cap-3HaCHz_z.js`).then((e) => e.default), []),
    "./fr/lessons/cdn.json": () => J(() => import(`./cdn-Dyt5pu8Z.js`).then((e) => e.default), []),
    "./fr/lessons/cicd.json": () =>
      J(() => import(`./cicd-DKebBUXa.js`).then((e) => e.default), []),
    "./fr/lessons/consensus.json": () =>
      J(() => import(`./consensus-BAs7amql.js`).then((e) => e.default), []),
    "./fr/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-IBtINjaG.js`).then((e) => e.default), []),
    "./fr/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-Df9y-s-p.js`).then((e) => e.default), []),
    "./fr/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-Bg6Itg2J.js`).then((e) => e.default), []),
    "./fr/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-CtjVUoj-.js`).then((e) => e.default), []),
    "./fr/lessons/encryption.json": () =>
      J(() => import(`./encryption-CV8fS5Df.js`).then((e) => e.default), []),
    "./fr/lessons/files.json": () =>
      J(() => import(`./files-WAGjPmwP.js`).then((e) => e.default), []),
    "./fr/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-BeRclMFH.js`).then((e) => e.default), []),
    "./fr/lessons/indexes.json": () =>
      J(() => import(`./indexes-Dp2nWV3m.js`).then((e) => e.default), []),
    "./fr/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-Dfzn34Sw.js`).then((e) => e.default), []),
    "./fr/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-sgZii1FM.js`).then((e) => e.default), []),
    "./fr/lessons/microservices.json": () =>
      J(() => import(`./microservices-BTRWAX5O.js`).then((e) => e.default), []),
    "./fr/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-CCYU-i16.js`).then((e) => e.default), []),
    "./fr/lessons/observability.json": () =>
      J(() => import(`./observability-j_RphsO8.js`).then((e) => e.default), []),
    "./fr/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-DrkxlKwb.js`).then((e) => e.default), []),
    "./fr/lessons/queues.json": () =>
      J(() => import(`./queues-CChCsf2x.js`).then((e) => e.default), []),
    "./fr/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-Bn-Lfx37.js`).then((e) => e.default), []),
    "./fr/lessons/realtime.json": () =>
      J(() => import(`./realtime-C-OiDRly.js`).then((e) => e.default), []),
    "./fr/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-BuhsO-vS.js`).then((e) => e.default), []),
    "./fr/lessons/replication.json": () =>
      J(() => import(`./replication-DwVlB0we.js`).then((e) => e.default), []),
    "./fr/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-JTapNZ8F.js`).then((e) => e.default), []),
    "./fr/lessons/sagas.json": () =>
      J(() => import(`./sagas-C7qijFuf.js`).then((e) => e.default), []),
    "./fr/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-CrHBj5wz.js`).then((e) => e.default), []),
    "./fr/lessons/sharding.json": () =>
      J(() => import(`./sharding-BE1DxzeQ.js`).then((e) => e.default), []),
    "./fr/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-Y6Y1vfco.js`).then((e) => e.default), []),
    "./fr/lessons/stateless.json": () =>
      J(() => import(`./stateless-BUU2pDRD.js`).then((e) => e.default), []),
    "./fr/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-9uT3k4CS.js`).then((e) => e.default), []),
    "./fr/lessons/testing.json": () =>
      J(() => import(`./testing-DgqSXh38.js`).then((e) => e.default), []),
    "./fr/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-Bq5aXFH9.js`).then((e) => e.default), []),
    "./fr/lessons/transactions.json": () =>
      J(() => import(`./transactions-EGXaentl.js`).then((e) => e.default), []),
    "./fr/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-C9bhsd0D.js`).then((e) => e.default), []),
    "./fr/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-I_ZJSmb6.js`).then((e) => e.default), []),
    "./he/lessons/apis.json": () =>
      J(() => import(`./apis-CjDAY2lZ.js`).then((e) => e.default), []),
    "./he/lessons/authentication.json": () =>
      J(() => import(`./authentication-lGycqEW1.js`).then((e) => e.default), []),
    "./he/lessons/authorization.json": () =>
      J(() => import(`./authorization-BhNC-qay.js`).then((e) => e.default), []),
    "./he/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-CYFtbC6T.js`).then((e) => e.default), []),
    "./he/lessons/caching.json": () =>
      J(() => import(`./caching-D0HlVN2t.js`).then((e) => e.default), []),
    "./he/lessons/cap.json": () => J(() => import(`./cap-BxcPRorC.js`).then((e) => e.default), []),
    "./he/lessons/cdn.json": () => J(() => import(`./cdn-LPZ8cKOz.js`).then((e) => e.default), []),
    "./he/lessons/cicd.json": () =>
      J(() => import(`./cicd-BFkyjzbx.js`).then((e) => e.default), []),
    "./he/lessons/consensus.json": () =>
      J(() => import(`./consensus-CDUUODJi.js`).then((e) => e.default), []),
    "./he/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-C9EKmzXq.js`).then((e) => e.default), []),
    "./he/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-Cl01wgzq.js`).then((e) => e.default), []),
    "./he/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-DRAfiglh.js`).then((e) => e.default), []),
    "./he/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-DlJxAXTN.js`).then((e) => e.default), []),
    "./he/lessons/encryption.json": () =>
      J(() => import(`./encryption-52hnFYpj.js`).then((e) => e.default), []),
    "./he/lessons/files.json": () =>
      J(() => import(`./files-TqyVSTCb.js`).then((e) => e.default), []),
    "./he/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-CVajGMWq.js`).then((e) => e.default), []),
    "./he/lessons/indexes.json": () =>
      J(() => import(`./indexes-2fcFohI2.js`).then((e) => e.default), []),
    "./he/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-D20HAHoU.js`).then((e) => e.default), []),
    "./he/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-BNlvJ6G4.js`).then((e) => e.default), []),
    "./he/lessons/microservices.json": () =>
      J(() => import(`./microservices-BmiB7mgA.js`).then((e) => e.default), []),
    "./he/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-kTN3xi-D.js`).then((e) => e.default), []),
    "./he/lessons/observability.json": () =>
      J(() => import(`./observability-DnCISt_g.js`).then((e) => e.default), []),
    "./he/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-4zW49B2I.js`).then((e) => e.default), []),
    "./he/lessons/queues.json": () =>
      J(() => import(`./queues-BE9eYdhr.js`).then((e) => e.default), []),
    "./he/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-S0IHdJO_.js`).then((e) => e.default), []),
    "./he/lessons/realtime.json": () =>
      J(() => import(`./realtime-B_B-qEac.js`).then((e) => e.default), []),
    "./he/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-Cs8svIKy.js`).then((e) => e.default), []),
    "./he/lessons/replication.json": () =>
      J(() => import(`./replication-DqS6JecT.js`).then((e) => e.default), []),
    "./he/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-DQ4-Kr4j.js`).then((e) => e.default), []),
    "./he/lessons/sagas.json": () =>
      J(() => import(`./sagas-Dp-bd7DF.js`).then((e) => e.default), []),
    "./he/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-BwYdptl_.js`).then((e) => e.default), []),
    "./he/lessons/sharding.json": () =>
      J(() => import(`./sharding-DzKjHycH.js`).then((e) => e.default), []),
    "./he/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-BwHoKD2T.js`).then((e) => e.default), []),
    "./he/lessons/stateless.json": () =>
      J(() => import(`./stateless-DKB1bco5.js`).then((e) => e.default), []),
    "./he/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-CRbm-ekB.js`).then((e) => e.default), []),
    "./he/lessons/testing.json": () =>
      J(() => import(`./testing-D9_-S3if.js`).then((e) => e.default), []),
    "./he/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-CSbEuQ5R.js`).then((e) => e.default), []),
    "./he/lessons/transactions.json": () =>
      J(() => import(`./transactions-s0eE-B-K.js`).then((e) => e.default), []),
    "./he/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-DHguPzPR.js`).then((e) => e.default), []),
    "./he/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-Dj6TXi28.js`).then((e) => e.default), []),
    "./hi/lessons/apis.json": () =>
      J(() => import(`./apis-B86PM-dD.js`).then((e) => e.default), []),
    "./hi/lessons/authentication.json": () =>
      J(() => import(`./authentication-C7gNMM6s.js`).then((e) => e.default), []),
    "./hi/lessons/authorization.json": () =>
      J(() => import(`./authorization-deisO9Pm.js`).then((e) => e.default), []),
    "./hi/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-CxYS2pRj.js`).then((e) => e.default), []),
    "./hi/lessons/caching.json": () =>
      J(() => import(`./caching-DBEvbEcT.js`).then((e) => e.default), []),
    "./hi/lessons/cap.json": () => J(() => import(`./cap-DiI5uyV1.js`).then((e) => e.default), []),
    "./hi/lessons/cdn.json": () => J(() => import(`./cdn-BGgu2Yp0.js`).then((e) => e.default), []),
    "./hi/lessons/cicd.json": () =>
      J(() => import(`./cicd-ThcNyONZ.js`).then((e) => e.default), []),
    "./hi/lessons/consensus.json": () =>
      J(() => import(`./consensus-Bb_mKto2.js`).then((e) => e.default), []),
    "./hi/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-gkIc3bvV.js`).then((e) => e.default), []),
    "./hi/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-O5ZC1XpM.js`).then((e) => e.default), []),
    "./hi/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-DXKzvxk9.js`).then((e) => e.default), []),
    "./hi/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-CWP49GhI.js`).then((e) => e.default), []),
    "./hi/lessons/encryption.json": () =>
      J(() => import(`./encryption-DDIjdaa3.js`).then((e) => e.default), []),
    "./hi/lessons/files.json": () =>
      J(() => import(`./files-DjlDyO8v.js`).then((e) => e.default), []),
    "./hi/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-B3I-aJCe.js`).then((e) => e.default), []),
    "./hi/lessons/indexes.json": () =>
      J(() => import(`./indexes-Dz126kVA.js`).then((e) => e.default), []),
    "./hi/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-Ds-TC5WB.js`).then((e) => e.default), []),
    "./hi/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-C6_G9oqA.js`).then((e) => e.default), []),
    "./hi/lessons/microservices.json": () =>
      J(() => import(`./microservices-D5_qRnib.js`).then((e) => e.default), []),
    "./hi/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-DF0BBEFT.js`).then((e) => e.default), []),
    "./hi/lessons/observability.json": () =>
      J(() => import(`./observability-XU6RpSKY.js`).then((e) => e.default), []),
    "./hi/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-BTsZ85T1.js`).then((e) => e.default), []),
    "./hi/lessons/queues.json": () =>
      J(() => import(`./queues-5vvm59XA.js`).then((e) => e.default), []),
    "./hi/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-CwYqFabz.js`).then((e) => e.default), []),
    "./hi/lessons/realtime.json": () =>
      J(() => import(`./realtime-BCsdJREJ.js`).then((e) => e.default), []),
    "./hi/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-XsUeVoly.js`).then((e) => e.default), []),
    "./hi/lessons/replication.json": () =>
      J(() => import(`./replication-zYB2CQ3i.js`).then((e) => e.default), []),
    "./hi/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-Sr7f_evt.js`).then((e) => e.default), []),
    "./hi/lessons/sagas.json": () =>
      J(() => import(`./sagas-CLRogjXI.js`).then((e) => e.default), []),
    "./hi/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-DbBvUfxN.js`).then((e) => e.default), []),
    "./hi/lessons/sharding.json": () =>
      J(() => import(`./sharding-Mhx4e50o.js`).then((e) => e.default), []),
    "./hi/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-BzQwlCLr.js`).then((e) => e.default), []),
    "./hi/lessons/stateless.json": () =>
      J(() => import(`./stateless-DdUxZWgF.js`).then((e) => e.default), []),
    "./hi/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-LeBYG18m.js`).then((e) => e.default), []),
    "./hi/lessons/testing.json": () =>
      J(() => import(`./testing-tj6r8HoF.js`).then((e) => e.default), []),
    "./hi/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-BgwZrdoO.js`).then((e) => e.default), []),
    "./hi/lessons/transactions.json": () =>
      J(() => import(`./transactions-ByxCX3od.js`).then((e) => e.default), []),
    "./hi/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-GsPrgm4F.js`).then((e) => e.default), []),
    "./hi/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-CPaWdL6D.js`).then((e) => e.default), []),
    "./id/lessons/apis.json": () =>
      J(() => import(`./apis-DvtpTruK.js`).then((e) => e.default), []),
    "./id/lessons/authentication.json": () =>
      J(() => import(`./authentication-BNwnMT2_.js`).then((e) => e.default), []),
    "./id/lessons/authorization.json": () =>
      J(() => import(`./authorization-7uXc8J6I.js`).then((e) => e.default), []),
    "./id/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-DuyGu0Lw.js`).then((e) => e.default), []),
    "./id/lessons/caching.json": () =>
      J(() => import(`./caching-uOmLJxfz.js`).then((e) => e.default), []),
    "./id/lessons/cap.json": () => J(() => import(`./cap-npilpHZo.js`).then((e) => e.default), []),
    "./id/lessons/cdn.json": () => J(() => import(`./cdn-y5dKTW-A.js`).then((e) => e.default), []),
    "./id/lessons/cicd.json": () =>
      J(() => import(`./cicd-BgfoZ4G5.js`).then((e) => e.default), []),
    "./id/lessons/consensus.json": () =>
      J(() => import(`./consensus-CdynOs3b.js`).then((e) => e.default), []),
    "./id/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-DJasY-zH.js`).then((e) => e.default), []),
    "./id/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-DLbyNV8x.js`).then((e) => e.default), []),
    "./id/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-DmUchdib.js`).then((e) => e.default), []),
    "./id/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-aUrCfxXG.js`).then((e) => e.default), []),
    "./id/lessons/encryption.json": () =>
      J(() => import(`./encryption-CU0uBh37.js`).then((e) => e.default), []),
    "./id/lessons/files.json": () =>
      J(() => import(`./files-CAhpWizH.js`).then((e) => e.default), []),
    "./id/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-CGSTNrMW.js`).then((e) => e.default), []),
    "./id/lessons/indexes.json": () =>
      J(() => import(`./indexes-DPoNO6lC.js`).then((e) => e.default), []),
    "./id/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-CnbwI9qO.js`).then((e) => e.default), []),
    "./id/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-XQeCWqiK.js`).then((e) => e.default), []),
    "./id/lessons/microservices.json": () =>
      J(() => import(`./microservices-BWMLXOrw.js`).then((e) => e.default), []),
    "./id/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-DMBdWUtf.js`).then((e) => e.default), []),
    "./id/lessons/observability.json": () =>
      J(() => import(`./observability-Dav6uqgK.js`).then((e) => e.default), []),
    "./id/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-BUBWqepj.js`).then((e) => e.default), []),
    "./id/lessons/queues.json": () =>
      J(() => import(`./queues-B19c5oz6.js`).then((e) => e.default), []),
    "./id/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-P8lvhKBy.js`).then((e) => e.default), []),
    "./id/lessons/realtime.json": () =>
      J(() => import(`./realtime-BMMJCdtY.js`).then((e) => e.default), []),
    "./id/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-CEix_qJp.js`).then((e) => e.default), []),
    "./id/lessons/replication.json": () =>
      J(() => import(`./replication-Bg4z71vP.js`).then((e) => e.default), []),
    "./id/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-B_pWcsdI.js`).then((e) => e.default), []),
    "./id/lessons/sagas.json": () =>
      J(() => import(`./sagas-BcUAf5Ku.js`).then((e) => e.default), []),
    "./id/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-LyQpbqGY.js`).then((e) => e.default), []),
    "./id/lessons/sharding.json": () =>
      J(() => import(`./sharding-CxevQZCi.js`).then((e) => e.default), []),
    "./id/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-0Tomj3Yz.js`).then((e) => e.default), []),
    "./id/lessons/stateless.json": () =>
      J(() => import(`./stateless-FUAWJ46p.js`).then((e) => e.default), []),
    "./id/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-Dx52JldB.js`).then((e) => e.default), []),
    "./id/lessons/testing.json": () =>
      J(() => import(`./testing-DRe9H4Tz.js`).then((e) => e.default), []),
    "./id/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-CVME4Z5F.js`).then((e) => e.default), []),
    "./id/lessons/transactions.json": () =>
      J(() => import(`./transactions-CWGBkW8M.js`).then((e) => e.default), []),
    "./id/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-D4HQ_4Ay.js`).then((e) => e.default), []),
    "./id/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-vd9DUMky.js`).then((e) => e.default), []),
    "./it/lessons/apis.json": () =>
      J(() => import(`./apis-DXGEZWhT.js`).then((e) => e.default), []),
    "./it/lessons/authentication.json": () =>
      J(() => import(`./authentication-YsRjb6dk.js`).then((e) => e.default), []),
    "./it/lessons/authorization.json": () =>
      J(() => import(`./authorization-BIiA2Yes.js`).then((e) => e.default), []),
    "./it/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-DI-VzaeT.js`).then((e) => e.default), []),
    "./it/lessons/caching.json": () =>
      J(() => import(`./caching-BBNVb5qs.js`).then((e) => e.default), []),
    "./it/lessons/cap.json": () => J(() => import(`./cap-DrTOZsNQ.js`).then((e) => e.default), []),
    "./it/lessons/cdn.json": () => J(() => import(`./cdn-DmSWj53_.js`).then((e) => e.default), []),
    "./it/lessons/cicd.json": () =>
      J(() => import(`./cicd-BMXSHWNF.js`).then((e) => e.default), []),
    "./it/lessons/consensus.json": () =>
      J(() => import(`./consensus-lXc3U1YH.js`).then((e) => e.default), []),
    "./it/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-CwMmL2C1.js`).then((e) => e.default), []),
    "./it/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-BCj6kcu2.js`).then((e) => e.default), []),
    "./it/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-0OMFXo5A.js`).then((e) => e.default), []),
    "./it/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-BLZGiVhM.js`).then((e) => e.default), []),
    "./it/lessons/encryption.json": () =>
      J(() => import(`./encryption-D-FWI8GG.js`).then((e) => e.default), []),
    "./it/lessons/files.json": () =>
      J(() => import(`./files-FfknNk04.js`).then((e) => e.default), []),
    "./it/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-Banu2geF.js`).then((e) => e.default), []),
    "./it/lessons/indexes.json": () =>
      J(() => import(`./indexes-B32cLv23.js`).then((e) => e.default), []),
    "./it/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-rGHXIMC1.js`).then((e) => e.default), []),
    "./it/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-BaTUyfqh.js`).then((e) => e.default), []),
    "./it/lessons/microservices.json": () =>
      J(() => import(`./microservices-d2CQwayG.js`).then((e) => e.default), []),
    "./it/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-sROHKIhf.js`).then((e) => e.default), []),
    "./it/lessons/observability.json": () =>
      J(() => import(`./observability-D4mxF5XR.js`).then((e) => e.default), []),
    "./it/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-DLFLjtEd.js`).then((e) => e.default), []),
    "./it/lessons/queues.json": () =>
      J(() => import(`./queues-tyIi_l8t.js`).then((e) => e.default), []),
    "./it/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-DhzqNMQD.js`).then((e) => e.default), []),
    "./it/lessons/realtime.json": () =>
      J(() => import(`./realtime-DBRHisQV.js`).then((e) => e.default), []),
    "./it/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-D__EC2NR.js`).then((e) => e.default), []),
    "./it/lessons/replication.json": () =>
      J(() => import(`./replication-DrZT0J-q.js`).then((e) => e.default), []),
    "./it/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-CS_BaQAt.js`).then((e) => e.default), []),
    "./it/lessons/sagas.json": () =>
      J(() => import(`./sagas--d1Pl7Ty.js`).then((e) => e.default), []),
    "./it/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-BYg5M5VW.js`).then((e) => e.default), []),
    "./it/lessons/sharding.json": () =>
      J(() => import(`./sharding-yZHErPzX.js`).then((e) => e.default), []),
    "./it/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-A7WaGSf5.js`).then((e) => e.default), []),
    "./it/lessons/stateless.json": () =>
      J(() => import(`./stateless-CmZ7zU-_.js`).then((e) => e.default), []),
    "./it/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-C0J0eIpx.js`).then((e) => e.default), []),
    "./it/lessons/testing.json": () =>
      J(() => import(`./testing-oQ3hAAH5.js`).then((e) => e.default), []),
    "./it/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-DgO1lwzj.js`).then((e) => e.default), []),
    "./it/lessons/transactions.json": () =>
      J(() => import(`./transactions-BpeMS8qC.js`).then((e) => e.default), []),
    "./it/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-DKKl1eV1.js`).then((e) => e.default), []),
    "./it/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-BTjUawx5.js`).then((e) => e.default), []),
    "./ja/lessons/apis.json": () =>
      J(() => import(`./apis-CvVsCHAf.js`).then((e) => e.default), []),
    "./ja/lessons/authentication.json": () =>
      J(() => import(`./authentication-bzqyBh1N.js`).then((e) => e.default), []),
    "./ja/lessons/authorization.json": () =>
      J(() => import(`./authorization-xakK9hqW.js`).then((e) => e.default), []),
    "./ja/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-DjwPhdFZ.js`).then((e) => e.default), []),
    "./ja/lessons/caching.json": () =>
      J(() => import(`./caching-lYZjlsqT.js`).then((e) => e.default), []),
    "./ja/lessons/cap.json": () => J(() => import(`./cap-BdNLtUai.js`).then((e) => e.default), []),
    "./ja/lessons/cdn.json": () => J(() => import(`./cdn-OmA9KqCJ.js`).then((e) => e.default), []),
    "./ja/lessons/cicd.json": () =>
      J(() => import(`./cicd-D1bFp1xj.js`).then((e) => e.default), []),
    "./ja/lessons/consensus.json": () =>
      J(() => import(`./consensus-BIJjYszK.js`).then((e) => e.default), []),
    "./ja/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-CMxwwU67.js`).then((e) => e.default), []),
    "./ja/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-GVXm4EQL.js`).then((e) => e.default), []),
    "./ja/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-CbjGDEia.js`).then((e) => e.default), []),
    "./ja/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-BQgIibTp.js`).then((e) => e.default), []),
    "./ja/lessons/encryption.json": () =>
      J(() => import(`./encryption-olQdFcgu.js`).then((e) => e.default), []),
    "./ja/lessons/files.json": () =>
      J(() => import(`./files-9vTIW6xS.js`).then((e) => e.default), []),
    "./ja/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-DcC6pULQ.js`).then((e) => e.default), []),
    "./ja/lessons/indexes.json": () =>
      J(() => import(`./indexes-CHzSasfo.js`).then((e) => e.default), []),
    "./ja/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-C3IkkkWQ.js`).then((e) => e.default), []),
    "./ja/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-BIRRB3lc.js`).then((e) => e.default), []),
    "./ja/lessons/microservices.json": () =>
      J(() => import(`./microservices-DyjGhlqa.js`).then((e) => e.default), []),
    "./ja/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-BwNveq8S.js`).then((e) => e.default), []),
    "./ja/lessons/observability.json": () =>
      J(() => import(`./observability-u4RGJYgG.js`).then((e) => e.default), []),
    "./ja/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-De6b3xIJ.js`).then((e) => e.default), []),
    "./ja/lessons/queues.json": () =>
      J(() => import(`./queues-BzH2Ojnm.js`).then((e) => e.default), []),
    "./ja/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-D625zD_W.js`).then((e) => e.default), []),
    "./ja/lessons/realtime.json": () =>
      J(() => import(`./realtime-Din448PW.js`).then((e) => e.default), []),
    "./ja/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-mSzZDV8b.js`).then((e) => e.default), []),
    "./ja/lessons/replication.json": () =>
      J(() => import(`./replication-BdfSRWYx.js`).then((e) => e.default), []),
    "./ja/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-CxtKz0X0.js`).then((e) => e.default), []),
    "./ja/lessons/sagas.json": () =>
      J(() => import(`./sagas-91PtSda8.js`).then((e) => e.default), []),
    "./ja/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-vacjBiG0.js`).then((e) => e.default), []),
    "./ja/lessons/sharding.json": () =>
      J(() => import(`./sharding-CxuxwJ4S.js`).then((e) => e.default), []),
    "./ja/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-Qi6rGOr8.js`).then((e) => e.default), []),
    "./ja/lessons/stateless.json": () =>
      J(() => import(`./stateless-CpS3C8xz.js`).then((e) => e.default), []),
    "./ja/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-DOqGP6bk.js`).then((e) => e.default), []),
    "./ja/lessons/testing.json": () =>
      J(() => import(`./testing-B_jnli_R.js`).then((e) => e.default), []),
    "./ja/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-DXXBhNGm.js`).then((e) => e.default), []),
    "./ja/lessons/transactions.json": () =>
      J(() => import(`./transactions-Cu79JFaa.js`).then((e) => e.default), []),
    "./ja/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-B0t8hanK.js`).then((e) => e.default), []),
    "./ja/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-BD-PSqEX.js`).then((e) => e.default), []),
    "./ko/lessons/apis.json": () =>
      J(() => import(`./apis-CVds80iU.js`).then((e) => e.default), []),
    "./ko/lessons/authentication.json": () =>
      J(() => import(`./authentication-BM8QQNrg.js`).then((e) => e.default), []),
    "./ko/lessons/authorization.json": () =>
      J(() => import(`./authorization-CcodkZap.js`).then((e) => e.default), []),
    "./ko/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-B6Zo5cML.js`).then((e) => e.default), []),
    "./ko/lessons/caching.json": () =>
      J(() => import(`./caching-BH1PaVGf.js`).then((e) => e.default), []),
    "./ko/lessons/cap.json": () => J(() => import(`./cap-DLOMwFHO.js`).then((e) => e.default), []),
    "./ko/lessons/cdn.json": () => J(() => import(`./cdn-MU2z8hNZ.js`).then((e) => e.default), []),
    "./ko/lessons/cicd.json": () =>
      J(() => import(`./cicd-BrenA5tj.js`).then((e) => e.default), []),
    "./ko/lessons/consensus.json": () =>
      J(() => import(`./consensus-QsJeo7tB.js`).then((e) => e.default), []),
    "./ko/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-CnOrYdjz.js`).then((e) => e.default), []),
    "./ko/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-B51jVdm0.js`).then((e) => e.default), []),
    "./ko/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-D2tDbrXY.js`).then((e) => e.default), []),
    "./ko/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-CD4RDuAk.js`).then((e) => e.default), []),
    "./ko/lessons/encryption.json": () =>
      J(() => import(`./encryption-DcKvnkDi.js`).then((e) => e.default), []),
    "./ko/lessons/files.json": () =>
      J(() => import(`./files-DHnqyr4f.js`).then((e) => e.default), []),
    "./ko/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-DJqBHS62.js`).then((e) => e.default), []),
    "./ko/lessons/indexes.json": () =>
      J(() => import(`./indexes-BPC0Wvhp.js`).then((e) => e.default), []),
    "./ko/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-D60AsRtE.js`).then((e) => e.default), []),
    "./ko/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-Cfw-h1h1.js`).then((e) => e.default), []),
    "./ko/lessons/microservices.json": () =>
      J(() => import(`./microservices-GzoDKIQF.js`).then((e) => e.default), []),
    "./ko/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-TVw1oNqq.js`).then((e) => e.default), []),
    "./ko/lessons/observability.json": () =>
      J(() => import(`./observability-DhrvQ3Qa.js`).then((e) => e.default), []),
    "./ko/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-Bex6dx-n.js`).then((e) => e.default), []),
    "./ko/lessons/queues.json": () =>
      J(() => import(`./queues-DaB8IfSv.js`).then((e) => e.default), []),
    "./ko/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-BXsR6BwC.js`).then((e) => e.default), []),
    "./ko/lessons/realtime.json": () =>
      J(() => import(`./realtime-Dei7rJAf.js`).then((e) => e.default), []),
    "./ko/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-BpRAhLM-.js`).then((e) => e.default), []),
    "./ko/lessons/replication.json": () =>
      J(() => import(`./replication-GkKYYBqh.js`).then((e) => e.default), []),
    "./ko/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-DLV_9aOJ.js`).then((e) => e.default), []),
    "./ko/lessons/sagas.json": () =>
      J(() => import(`./sagas-D3v_RuTp.js`).then((e) => e.default), []),
    "./ko/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-CHFmEESs.js`).then((e) => e.default), []),
    "./ko/lessons/sharding.json": () =>
      J(() => import(`./sharding-6luFfjOj.js`).then((e) => e.default), []),
    "./ko/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-B1wIUtXz.js`).then((e) => e.default), []),
    "./ko/lessons/stateless.json": () =>
      J(() => import(`./stateless-tfGRnr4w.js`).then((e) => e.default), []),
    "./ko/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-D9KtSSmw.js`).then((e) => e.default), []),
    "./ko/lessons/testing.json": () =>
      J(() => import(`./testing-Dqs2-ehj.js`).then((e) => e.default), []),
    "./ko/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-tAFKoZD_.js`).then((e) => e.default), []),
    "./ko/lessons/transactions.json": () =>
      J(() => import(`./transactions-BvDnW61Q.js`).then((e) => e.default), []),
    "./ko/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-sa4MF145.js`).then((e) => e.default), []),
    "./ko/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-BqP-Ei0m.js`).then((e) => e.default), []),
    "./nl/lessons/apis.json": () =>
      J(() => import(`./apis-JhdEIXiS.js`).then((e) => e.default), []),
    "./nl/lessons/authentication.json": () =>
      J(() => import(`./authentication-Pp4VL0Dz.js`).then((e) => e.default), []),
    "./nl/lessons/authorization.json": () =>
      J(() => import(`./authorization-CuWFsXid.js`).then((e) => e.default), []),
    "./nl/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-CMnL89xf.js`).then((e) => e.default), []),
    "./nl/lessons/caching.json": () =>
      J(() => import(`./caching-BgibMhk6.js`).then((e) => e.default), []),
    "./nl/lessons/cap.json": () => J(() => import(`./cap-BkduRuPD.js`).then((e) => e.default), []),
    "./nl/lessons/cdn.json": () => J(() => import(`./cdn-DFZmTykA.js`).then((e) => e.default), []),
    "./nl/lessons/cicd.json": () =>
      J(() => import(`./cicd-B3oJ7O7Y.js`).then((e) => e.default), []),
    "./nl/lessons/consensus.json": () =>
      J(() => import(`./consensus-Z5M1kF84.js`).then((e) => e.default), []),
    "./nl/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-CbamJ_FR.js`).then((e) => e.default), []),
    "./nl/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-BAVByVo6.js`).then((e) => e.default), []),
    "./nl/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-B8Cdg6q_.js`).then((e) => e.default), []),
    "./nl/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-CMyHAUsX.js`).then((e) => e.default), []),
    "./nl/lessons/encryption.json": () =>
      J(() => import(`./encryption-C7yuQP5d.js`).then((e) => e.default), []),
    "./nl/lessons/files.json": () =>
      J(() => import(`./files-DAiUYiDT.js`).then((e) => e.default), []),
    "./nl/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-D__qlPKX.js`).then((e) => e.default), []),
    "./nl/lessons/indexes.json": () =>
      J(() => import(`./indexes-Dkozi-RJ.js`).then((e) => e.default), []),
    "./nl/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-CFzvH72b.js`).then((e) => e.default), []),
    "./nl/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-Dc8c4D_j.js`).then((e) => e.default), []),
    "./nl/lessons/microservices.json": () =>
      J(() => import(`./microservices-BRPhAnHU.js`).then((e) => e.default), []),
    "./nl/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-IyHLKuMT.js`).then((e) => e.default), []),
    "./nl/lessons/observability.json": () =>
      J(() => import(`./observability-CdGErv8X.js`).then((e) => e.default), []),
    "./nl/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-DG6UocPH.js`).then((e) => e.default), []),
    "./nl/lessons/queues.json": () =>
      J(() => import(`./queues-LyNj68qq.js`).then((e) => e.default), []),
    "./nl/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-DlGEtSqc.js`).then((e) => e.default), []),
    "./nl/lessons/realtime.json": () =>
      J(() => import(`./realtime-DIa2ibSs.js`).then((e) => e.default), []),
    "./nl/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-Co3zbunR.js`).then((e) => e.default), []),
    "./nl/lessons/replication.json": () =>
      J(() => import(`./replication-Bk84SUJU.js`).then((e) => e.default), []),
    "./nl/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-YaMs2qCO.js`).then((e) => e.default), []),
    "./nl/lessons/sagas.json": () =>
      J(() => import(`./sagas-CzkFIyp-.js`).then((e) => e.default), []),
    "./nl/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-C63rXb6v.js`).then((e) => e.default), []),
    "./nl/lessons/sharding.json": () =>
      J(() => import(`./sharding-Dj31GWnP.js`).then((e) => e.default), []),
    "./nl/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-CO9yeZR1.js`).then((e) => e.default), []),
    "./nl/lessons/stateless.json": () =>
      J(() => import(`./stateless-DjJL9aF_.js`).then((e) => e.default), []),
    "./nl/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-DWtovZVp.js`).then((e) => e.default), []),
    "./nl/lessons/testing.json": () =>
      J(() => import(`./testing-B2S5ln9C.js`).then((e) => e.default), []),
    "./nl/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-B4TB4_vl.js`).then((e) => e.default), []),
    "./nl/lessons/transactions.json": () =>
      J(() => import(`./transactions-CTJM3GLg.js`).then((e) => e.default), []),
    "./nl/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-DfCpL6Ma.js`).then((e) => e.default), []),
    "./nl/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-heduBb6I.js`).then((e) => e.default), []),
    "./pl/lessons/apis.json": () =>
      J(() => import(`./apis-BunWr18p.js`).then((e) => e.default), []),
    "./pl/lessons/authentication.json": () =>
      J(() => import(`./authentication-CdHhGoLR.js`).then((e) => e.default), []),
    "./pl/lessons/authorization.json": () =>
      J(() => import(`./authorization-CTayeNFL.js`).then((e) => e.default), []),
    "./pl/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-DDarxpvP.js`).then((e) => e.default), []),
    "./pl/lessons/caching.json": () =>
      J(() => import(`./caching-Css1S9KN.js`).then((e) => e.default), []),
    "./pl/lessons/cap.json": () => J(() => import(`./cap-CbaGm35k.js`).then((e) => e.default), []),
    "./pl/lessons/cdn.json": () => J(() => import(`./cdn-Fz9dq5NF.js`).then((e) => e.default), []),
    "./pl/lessons/cicd.json": () =>
      J(() => import(`./cicd-BYvtbHdo.js`).then((e) => e.default), []),
    "./pl/lessons/consensus.json": () =>
      J(() => import(`./consensus-C8gZNaUG.js`).then((e) => e.default), []),
    "./pl/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-CeanKph4.js`).then((e) => e.default), []),
    "./pl/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-CnNkQW0i.js`).then((e) => e.default), []),
    "./pl/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-ed0cV4iJ.js`).then((e) => e.default), []),
    "./pl/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-DkyD3YYN.js`).then((e) => e.default), []),
    "./pl/lessons/encryption.json": () =>
      J(() => import(`./encryption-BymsGQsg.js`).then((e) => e.default), []),
    "./pl/lessons/files.json": () =>
      J(() => import(`./files-t6EWt79Z.js`).then((e) => e.default), []),
    "./pl/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-ChV4IeNP.js`).then((e) => e.default), []),
    "./pl/lessons/indexes.json": () =>
      J(() => import(`./indexes-B1GvYarD.js`).then((e) => e.default), []),
    "./pl/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-CncK2FZE.js`).then((e) => e.default), []),
    "./pl/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-DeSk_RM_.js`).then((e) => e.default), []),
    "./pl/lessons/microservices.json": () =>
      J(() => import(`./microservices-CmLPBamx.js`).then((e) => e.default), []),
    "./pl/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-zbQZUWvu.js`).then((e) => e.default), []),
    "./pl/lessons/observability.json": () =>
      J(() => import(`./observability-BFaixZiW.js`).then((e) => e.default), []),
    "./pl/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-CM6K8PT6.js`).then((e) => e.default), []),
    "./pl/lessons/queues.json": () =>
      J(() => import(`./queues-CvIMrQQk.js`).then((e) => e.default), []),
    "./pl/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-ZbzCTVqT.js`).then((e) => e.default), []),
    "./pl/lessons/realtime.json": () =>
      J(() => import(`./realtime-_393JOHU.js`).then((e) => e.default), []),
    "./pl/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-BKM87T6p.js`).then((e) => e.default), []),
    "./pl/lessons/replication.json": () =>
      J(() => import(`./replication-DgEmSkRZ.js`).then((e) => e.default), []),
    "./pl/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-CkLqGB1i.js`).then((e) => e.default), []),
    "./pl/lessons/sagas.json": () =>
      J(() => import(`./sagas-8rU0K1FE.js`).then((e) => e.default), []),
    "./pl/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-BoMhzGH0.js`).then((e) => e.default), []),
    "./pl/lessons/sharding.json": () =>
      J(() => import(`./sharding-YqWr-xUl.js`).then((e) => e.default), []),
    "./pl/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-ryvSdWWh.js`).then((e) => e.default), []),
    "./pl/lessons/stateless.json": () =>
      J(() => import(`./stateless-CfrqtiH3.js`).then((e) => e.default), []),
    "./pl/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-Ddf3cJpD.js`).then((e) => e.default), []),
    "./pl/lessons/testing.json": () =>
      J(() => import(`./testing-BXriKGci.js`).then((e) => e.default), []),
    "./pl/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-DZnwdwGC.js`).then((e) => e.default), []),
    "./pl/lessons/transactions.json": () =>
      J(() => import(`./transactions-Ct6eqUUt.js`).then((e) => e.default), []),
    "./pl/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-B8GOVMiT.js`).then((e) => e.default), []),
    "./pl/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-B98h-eIR.js`).then((e) => e.default), []),
    "./pt/lessons/apis.json": () =>
      J(() => import(`./apis-BYLK90KD.js`).then((e) => e.default), []),
    "./pt/lessons/authentication.json": () =>
      J(() => import(`./authentication-Bub3iwUp.js`).then((e) => e.default), []),
    "./pt/lessons/authorization.json": () =>
      J(() => import(`./authorization-DzgwuYSA.js`).then((e) => e.default), []),
    "./pt/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-DKmM2hPV.js`).then((e) => e.default), []),
    "./pt/lessons/caching.json": () =>
      J(() => import(`./caching-DO5zUxUL.js`).then((e) => e.default), []),
    "./pt/lessons/cap.json": () => J(() => import(`./cap-D_X7E2_M.js`).then((e) => e.default), []),
    "./pt/lessons/cdn.json": () => J(() => import(`./cdn-BXAEia9A.js`).then((e) => e.default), []),
    "./pt/lessons/cicd.json": () =>
      J(() => import(`./cicd-t82kZgRN.js`).then((e) => e.default), []),
    "./pt/lessons/consensus.json": () =>
      J(() => import(`./consensus-Bur7fzoX.js`).then((e) => e.default), []),
    "./pt/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-KVV52F5R.js`).then((e) => e.default), []),
    "./pt/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-M1HlTP-C.js`).then((e) => e.default), []),
    "./pt/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-CKEZ3GAo.js`).then((e) => e.default), []),
    "./pt/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-BvaDXHl3.js`).then((e) => e.default), []),
    "./pt/lessons/encryption.json": () =>
      J(() => import(`./encryption-DH-q7zm8.js`).then((e) => e.default), []),
    "./pt/lessons/files.json": () =>
      J(() => import(`./files-DlwgE0hm.js`).then((e) => e.default), []),
    "./pt/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-DMwQWbrE.js`).then((e) => e.default), []),
    "./pt/lessons/indexes.json": () =>
      J(() => import(`./indexes-DJtaRMl6.js`).then((e) => e.default), []),
    "./pt/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-CoEtfOlo.js`).then((e) => e.default), []),
    "./pt/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-DTruL6jX.js`).then((e) => e.default), []),
    "./pt/lessons/microservices.json": () =>
      J(() => import(`./microservices-BFmrkIOM.js`).then((e) => e.default), []),
    "./pt/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-DsZUV3yK.js`).then((e) => e.default), []),
    "./pt/lessons/observability.json": () =>
      J(() => import(`./observability-CQXozSJk.js`).then((e) => e.default), []),
    "./pt/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-QbrnS3-e.js`).then((e) => e.default), []),
    "./pt/lessons/queues.json": () =>
      J(() => import(`./queues-DXOKhHze.js`).then((e) => e.default), []),
    "./pt/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-BvwKcJ7_.js`).then((e) => e.default), []),
    "./pt/lessons/realtime.json": () =>
      J(() => import(`./realtime-Cd9AA7gJ.js`).then((e) => e.default), []),
    "./pt/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-DBdsbEbD.js`).then((e) => e.default), []),
    "./pt/lessons/replication.json": () =>
      J(() => import(`./replication-DSdA5TD1.js`).then((e) => e.default), []),
    "./pt/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-C0GgrjzD.js`).then((e) => e.default), []),
    "./pt/lessons/sagas.json": () =>
      J(() => import(`./sagas-C4_8bwPx.js`).then((e) => e.default), []),
    "./pt/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-D7zPn7KX.js`).then((e) => e.default), []),
    "./pt/lessons/sharding.json": () =>
      J(() => import(`./sharding-DpRrthHI.js`).then((e) => e.default), []),
    "./pt/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-BKKMz9CE.js`).then((e) => e.default), []),
    "./pt/lessons/stateless.json": () =>
      J(() => import(`./stateless-CBHOALHs.js`).then((e) => e.default), []),
    "./pt/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-C0n4qgyW.js`).then((e) => e.default), []),
    "./pt/lessons/testing.json": () =>
      J(() => import(`./testing-8MDCnkyU.js`).then((e) => e.default), []),
    "./pt/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-BIajc9T8.js`).then((e) => e.default), []),
    "./pt/lessons/transactions.json": () =>
      J(() => import(`./transactions-DZycr6GD.js`).then((e) => e.default), []),
    "./pt/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-B2WjRrgo.js`).then((e) => e.default), []),
    "./pt/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-CZdv292v.js`).then((e) => e.default), []),
    "./ru/lessons/apis.json": () =>
      J(() => import(`./apis-Cd9A-SPk.js`).then((e) => e.default), []),
    "./ru/lessons/authentication.json": () =>
      J(() => import(`./authentication-iZGkBxbP.js`).then((e) => e.default), []),
    "./ru/lessons/authorization.json": () =>
      J(() => import(`./authorization-DMfg6Gig.js`).then((e) => e.default), []),
    "./ru/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-nPUYpERO.js`).then((e) => e.default), []),
    "./ru/lessons/caching.json": () =>
      J(() => import(`./caching-CmimzWoF.js`).then((e) => e.default), []),
    "./ru/lessons/cap.json": () => J(() => import(`./cap-Bvsns6kI.js`).then((e) => e.default), []),
    "./ru/lessons/cdn.json": () => J(() => import(`./cdn-DQ7w9_--.js`).then((e) => e.default), []),
    "./ru/lessons/cicd.json": () =>
      J(() => import(`./cicd-1_cfir7r.js`).then((e) => e.default), []),
    "./ru/lessons/consensus.json": () =>
      J(() => import(`./consensus-HM21u9nJ.js`).then((e) => e.default), []),
    "./ru/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-DG3MrZj3.js`).then((e) => e.default), []),
    "./ru/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-Byx8OOjt.js`).then((e) => e.default), []),
    "./ru/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-BdRZM5RK.js`).then((e) => e.default), []),
    "./ru/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-Da9ir9-j.js`).then((e) => e.default), []),
    "./ru/lessons/encryption.json": () =>
      J(() => import(`./encryption-D_n5N0ra.js`).then((e) => e.default), []),
    "./ru/lessons/files.json": () =>
      J(() => import(`./files-CyvIv8pw.js`).then((e) => e.default), []),
    "./ru/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-BWNWjWqW.js`).then((e) => e.default), []),
    "./ru/lessons/indexes.json": () =>
      J(() => import(`./indexes-BZ0B6P-6.js`).then((e) => e.default), []),
    "./ru/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-DdqT_Hu3.js`).then((e) => e.default), []),
    "./ru/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-DowzbSOT.js`).then((e) => e.default), []),
    "./ru/lessons/microservices.json": () =>
      J(() => import(`./microservices-Dzr66TS4.js`).then((e) => e.default), []),
    "./ru/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-Cd5Kgf1R.js`).then((e) => e.default), []),
    "./ru/lessons/observability.json": () =>
      J(() => import(`./observability-BDxoz1O8.js`).then((e) => e.default), []),
    "./ru/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-DGDWyCgx.js`).then((e) => e.default), []),
    "./ru/lessons/queues.json": () =>
      J(() => import(`./queues-DzZtdkFX.js`).then((e) => e.default), []),
    "./ru/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-B2lJ5IeK.js`).then((e) => e.default), []),
    "./ru/lessons/realtime.json": () =>
      J(() => import(`./realtime-2wHwGFJw.js`).then((e) => e.default), []),
    "./ru/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-wAGqMNK4.js`).then((e) => e.default), []),
    "./ru/lessons/replication.json": () =>
      J(() => import(`./replication-BlZ5oekh.js`).then((e) => e.default), []),
    "./ru/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-DJv9wvWz.js`).then((e) => e.default), []),
    "./ru/lessons/sagas.json": () =>
      J(() => import(`./sagas-BSRyetfM.js`).then((e) => e.default), []),
    "./ru/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-BOXjkXrm.js`).then((e) => e.default), []),
    "./ru/lessons/sharding.json": () =>
      J(() => import(`./sharding-DQiQy5-P.js`).then((e) => e.default), []),
    "./ru/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-DMRQ-0R2.js`).then((e) => e.default), []),
    "./ru/lessons/stateless.json": () =>
      J(() => import(`./stateless-yklAtSa8.js`).then((e) => e.default), []),
    "./ru/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-BtBc6JB7.js`).then((e) => e.default), []),
    "./ru/lessons/testing.json": () =>
      J(() => import(`./testing-By-wI2cg.js`).then((e) => e.default), []),
    "./ru/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-D2S_p-vX.js`).then((e) => e.default), []),
    "./ru/lessons/transactions.json": () =>
      J(() => import(`./transactions-D86ODk0R.js`).then((e) => e.default), []),
    "./ru/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-DgttdLIi.js`).then((e) => e.default), []),
    "./ru/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-BF8MofXH.js`).then((e) => e.default), []),
    "./tr/lessons/apis.json": () =>
      J(() => import(`./apis-BbtQmthS.js`).then((e) => e.default), []),
    "./tr/lessons/authentication.json": () =>
      J(() => import(`./authentication-BMVndfTD.js`).then((e) => e.default), []),
    "./tr/lessons/authorization.json": () =>
      J(() => import(`./authorization-DlZD-E2Y.js`).then((e) => e.default), []),
    "./tr/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-_krMPx-L.js`).then((e) => e.default), []),
    "./tr/lessons/caching.json": () =>
      J(() => import(`./caching-DheeAPc0.js`).then((e) => e.default), []),
    "./tr/lessons/cap.json": () => J(() => import(`./cap-DpIv9Kwe.js`).then((e) => e.default), []),
    "./tr/lessons/cdn.json": () => J(() => import(`./cdn-Dcoc_J95.js`).then((e) => e.default), []),
    "./tr/lessons/cicd.json": () =>
      J(() => import(`./cicd-zgOga4ll.js`).then((e) => e.default), []),
    "./tr/lessons/consensus.json": () =>
      J(() => import(`./consensus-CkRobwS0.js`).then((e) => e.default), []),
    "./tr/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-BYjahF9k.js`).then((e) => e.default), []),
    "./tr/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-D_9PbPz8.js`).then((e) => e.default), []),
    "./tr/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-CwjpTaSE.js`).then((e) => e.default), []),
    "./tr/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-C1ELKaM8.js`).then((e) => e.default), []),
    "./tr/lessons/encryption.json": () =>
      J(() => import(`./encryption-Df4OU9Ko.js`).then((e) => e.default), []),
    "./tr/lessons/files.json": () =>
      J(() => import(`./files-uue8Vt11.js`).then((e) => e.default), []),
    "./tr/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-CHdVxDtw.js`).then((e) => e.default), []),
    "./tr/lessons/indexes.json": () =>
      J(() => import(`./indexes-CQWko_q1.js`).then((e) => e.default), []),
    "./tr/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-QWZKqpwS.js`).then((e) => e.default), []),
    "./tr/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-DKGyTvpv.js`).then((e) => e.default), []),
    "./tr/lessons/microservices.json": () =>
      J(() => import(`./microservices-zPD4LXZx.js`).then((e) => e.default), []),
    "./tr/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-Dta4OZR4.js`).then((e) => e.default), []),
    "./tr/lessons/observability.json": () =>
      J(() => import(`./observability-BcUe1iwL.js`).then((e) => e.default), []),
    "./tr/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-HtXYqX3m.js`).then((e) => e.default), []),
    "./tr/lessons/queues.json": () =>
      J(() => import(`./queues-CxmX3s6-.js`).then((e) => e.default), []),
    "./tr/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-qfNJP_cf.js`).then((e) => e.default), []),
    "./tr/lessons/realtime.json": () =>
      J(() => import(`./realtime-p4NWh_do.js`).then((e) => e.default), []),
    "./tr/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-BBwpISzk.js`).then((e) => e.default), []),
    "./tr/lessons/replication.json": () =>
      J(() => import(`./replication-CmmvWGSM.js`).then((e) => e.default), []),
    "./tr/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-Dt4e6F6u.js`).then((e) => e.default), []),
    "./tr/lessons/sagas.json": () =>
      J(() => import(`./sagas-CjsR_KpQ.js`).then((e) => e.default), []),
    "./tr/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-3B6iqD3q.js`).then((e) => e.default), []),
    "./tr/lessons/sharding.json": () =>
      J(() => import(`./sharding-Co_Z_F9M.js`).then((e) => e.default), []),
    "./tr/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-DGtmRFwO.js`).then((e) => e.default), []),
    "./tr/lessons/stateless.json": () =>
      J(() => import(`./stateless-D9ibcQRJ.js`).then((e) => e.default), []),
    "./tr/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-T0iUcl0u.js`).then((e) => e.default), []),
    "./tr/lessons/testing.json": () =>
      J(() => import(`./testing-JhBMzTha.js`).then((e) => e.default), []),
    "./tr/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-C96gfCbi.js`).then((e) => e.default), []),
    "./tr/lessons/transactions.json": () =>
      J(() => import(`./transactions-BxTV2tb9.js`).then((e) => e.default), []),
    "./tr/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-CzWkOD24.js`).then((e) => e.default), []),
    "./tr/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-D44ImYfD.js`).then((e) => e.default), []),
    "./uk/lessons/apis.json": () =>
      J(() => import(`./apis-BbjukG60.js`).then((e) => e.default), []),
    "./uk/lessons/authentication.json": () =>
      J(() => import(`./authentication-CY7kijuj.js`).then((e) => e.default), []),
    "./uk/lessons/authorization.json": () =>
      J(() => import(`./authorization-CSLM3hcc.js`).then((e) => e.default), []),
    "./uk/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-B2KSnRjH.js`).then((e) => e.default), []),
    "./uk/lessons/caching.json": () =>
      J(() => import(`./caching-Cn7FlFGg.js`).then((e) => e.default), []),
    "./uk/lessons/cap.json": () => J(() => import(`./cap-BWbU82mG.js`).then((e) => e.default), []),
    "./uk/lessons/cdn.json": () => J(() => import(`./cdn-CBbfJYpW.js`).then((e) => e.default), []),
    "./uk/lessons/cicd.json": () =>
      J(() => import(`./cicd-B-JLI08C.js`).then((e) => e.default), []),
    "./uk/lessons/consensus.json": () =>
      J(() => import(`./consensus-CX_7xYhJ.js`).then((e) => e.default), []),
    "./uk/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-Ft_6z7hu.js`).then((e) => e.default), []),
    "./uk/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-B87FIvwD.js`).then((e) => e.default), []),
    "./uk/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-LYmvDA1V.js`).then((e) => e.default), []),
    "./uk/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-V8PbQ3qo.js`).then((e) => e.default), []),
    "./uk/lessons/encryption.json": () =>
      J(() => import(`./encryption-DPM__kvc.js`).then((e) => e.default), []),
    "./uk/lessons/files.json": () =>
      J(() => import(`./files-DtwEnHxQ.js`).then((e) => e.default), []),
    "./uk/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-DyfM8tr6.js`).then((e) => e.default), []),
    "./uk/lessons/indexes.json": () =>
      J(() => import(`./indexes-BtdQM-2R.js`).then((e) => e.default), []),
    "./uk/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-Bu-v_LEN.js`).then((e) => e.default), []),
    "./uk/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-Bhzc6oiO.js`).then((e) => e.default), []),
    "./uk/lessons/microservices.json": () =>
      J(() => import(`./microservices-DyHgSeJG.js`).then((e) => e.default), []),
    "./uk/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-N2C5h2oJ.js`).then((e) => e.default), []),
    "./uk/lessons/observability.json": () =>
      J(() => import(`./observability-D4l_N3UV.js`).then((e) => e.default), []),
    "./uk/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-C1mX8Ikd.js`).then((e) => e.default), []),
    "./uk/lessons/queues.json": () =>
      J(() => import(`./queues-hRYiKe0f.js`).then((e) => e.default), []),
    "./uk/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-BkwthUlM.js`).then((e) => e.default), []),
    "./uk/lessons/realtime.json": () =>
      J(() => import(`./realtime-Brd-01Zf.js`).then((e) => e.default), []),
    "./uk/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-DtK3mVaH.js`).then((e) => e.default), []),
    "./uk/lessons/replication.json": () =>
      J(() => import(`./replication-DKdY9yUV.js`).then((e) => e.default), []),
    "./uk/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-seWVxxq8.js`).then((e) => e.default), []),
    "./uk/lessons/sagas.json": () =>
      J(() => import(`./sagas-C2OLmxU5.js`).then((e) => e.default), []),
    "./uk/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-NykXmoEM.js`).then((e) => e.default), []),
    "./uk/lessons/sharding.json": () =>
      J(() => import(`./sharding-CQOH0uip.js`).then((e) => e.default), []),
    "./uk/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-DvBx2dd0.js`).then((e) => e.default), []),
    "./uk/lessons/stateless.json": () =>
      J(() => import(`./stateless-O1MsvVgP.js`).then((e) => e.default), []),
    "./uk/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-Cn8kWDRN.js`).then((e) => e.default), []),
    "./uk/lessons/testing.json": () =>
      J(() => import(`./testing-Cr7amREr.js`).then((e) => e.default), []),
    "./uk/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-dprJfXOl.js`).then((e) => e.default), []),
    "./uk/lessons/transactions.json": () =>
      J(() => import(`./transactions-DOiOoYiY.js`).then((e) => e.default), []),
    "./uk/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-CLfzcJxM.js`).then((e) => e.default), []),
    "./uk/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-C2hQxsZm.js`).then((e) => e.default), []),
    "./vi/lessons/apis.json": () =>
      J(() => import(`./apis-CCgLdYKz.js`).then((e) => e.default), []),
    "./vi/lessons/authentication.json": () =>
      J(() => import(`./authentication-DOlOUJZR.js`).then((e) => e.default), []),
    "./vi/lessons/authorization.json": () =>
      J(() => import(`./authorization-nPnNReQZ.js`).then((e) => e.default), []),
    "./vi/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-xgIHRAzZ.js`).then((e) => e.default), []),
    "./vi/lessons/caching.json": () =>
      J(() => import(`./caching-Bw0VQQv8.js`).then((e) => e.default), []),
    "./vi/lessons/cap.json": () => J(() => import(`./cap-NbEQbv2N.js`).then((e) => e.default), []),
    "./vi/lessons/cdn.json": () => J(() => import(`./cdn-D-GP89Aa.js`).then((e) => e.default), []),
    "./vi/lessons/cicd.json": () =>
      J(() => import(`./cicd-BtZ4_gPT.js`).then((e) => e.default), []),
    "./vi/lessons/consensus.json": () =>
      J(() => import(`./consensus-7HKwyHUA.js`).then((e) => e.default), []),
    "./vi/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-BGqwlXOJ.js`).then((e) => e.default), []),
    "./vi/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-CA9-TD4p.js`).then((e) => e.default), []),
    "./vi/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-BH8eySDX.js`).then((e) => e.default), []),
    "./vi/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-CktIim2M.js`).then((e) => e.default), []),
    "./vi/lessons/encryption.json": () =>
      J(() => import(`./encryption-BMlkoZ8J.js`).then((e) => e.default), []),
    "./vi/lessons/files.json": () =>
      J(() => import(`./files-BjjmFxS4.js`).then((e) => e.default), []),
    "./vi/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-CybFADrD.js`).then((e) => e.default), []),
    "./vi/lessons/indexes.json": () =>
      J(() => import(`./indexes-BIeFygbU.js`).then((e) => e.default), []),
    "./vi/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-BMOMnQdi.js`).then((e) => e.default), []),
    "./vi/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-UIxU3zFY.js`).then((e) => e.default), []),
    "./vi/lessons/microservices.json": () =>
      J(() => import(`./microservices-IOhfoECZ.js`).then((e) => e.default), []),
    "./vi/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-Cq2QiaG0.js`).then((e) => e.default), []),
    "./vi/lessons/observability.json": () =>
      J(() => import(`./observability-BQBzffhz.js`).then((e) => e.default), []),
    "./vi/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-CayYupws.js`).then((e) => e.default), []),
    "./vi/lessons/queues.json": () =>
      J(() => import(`./queues-6q43wqV-.js`).then((e) => e.default), []),
    "./vi/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-agoB26PU.js`).then((e) => e.default), []),
    "./vi/lessons/realtime.json": () =>
      J(() => import(`./realtime-CK0GzX-T.js`).then((e) => e.default), []),
    "./vi/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-Cong5B1M.js`).then((e) => e.default), []),
    "./vi/lessons/replication.json": () =>
      J(() => import(`./replication-ChK9kcq1.js`).then((e) => e.default), []),
    "./vi/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-CcKvF1lS.js`).then((e) => e.default), []),
    "./vi/lessons/sagas.json": () =>
      J(() => import(`./sagas-BdiNFxkq.js`).then((e) => e.default), []),
    "./vi/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-BthAyIei.js`).then((e) => e.default), []),
    "./vi/lessons/sharding.json": () =>
      J(() => import(`./sharding-BJ6GyveX.js`).then((e) => e.default), []),
    "./vi/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-DcyOF5sh.js`).then((e) => e.default), []),
    "./vi/lessons/stateless.json": () =>
      J(() => import(`./stateless-D2sWnVmK.js`).then((e) => e.default), []),
    "./vi/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-SqyxaPRz.js`).then((e) => e.default), []),
    "./vi/lessons/testing.json": () =>
      J(() => import(`./testing-BUA2ED4s.js`).then((e) => e.default), []),
    "./vi/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-C_zQJOy7.js`).then((e) => e.default), []),
    "./vi/lessons/transactions.json": () =>
      J(() => import(`./transactions-CEIwnwGl.js`).then((e) => e.default), []),
    "./vi/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-CN-VVZw-.js`).then((e) => e.default), []),
    "./vi/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-DCHsLOh6.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/apis.json": () =>
      J(() => import(`./apis-LCBPjuvK.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/authentication.json": () =>
      J(() => import(`./authentication-DtVARkWW.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/authorization.json": () =>
      J(() => import(`./authorization-CQ7FBwPp.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-mjVwQTL-.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/caching.json": () =>
      J(() => import(`./caching-DLP4zmF9.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/cap.json": () =>
      J(() => import(`./cap-C58Bmwx5.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/cdn.json": () =>
      J(() => import(`./cdn-BaZZM_-H.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/cicd.json": () =>
      J(() => import(`./cicd-DrqREe41.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/consensus.json": () =>
      J(() => import(`./consensus-cOwlkAl9.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-CVaidC1f.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-MZCNUrkE.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-DVWUW14_.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-CvMC00q-.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/encryption.json": () =>
      J(() => import(`./encryption-D5cCoeP2.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/files.json": () =>
      J(() => import(`./files-D3LZwlFI.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-Dicfv-UU.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/indexes.json": () =>
      J(() => import(`./indexes-BR5DwXvN.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-CE4zmxCj.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-BNKeJNWY.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/microservices.json": () =>
      J(() => import(`./microservices-D6V8C40e.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-PKwtehxF.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/observability.json": () =>
      J(() => import(`./observability-BoJlhMaw.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-DSgg_cyv.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/queues.json": () =>
      J(() => import(`./queues-CzAel8F4.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-DW98Ionz.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/realtime.json": () =>
      J(() => import(`./realtime-BE9rHsXV.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-BBVS5Edn.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/replication.json": () =>
      J(() => import(`./replication-CotMXLjk.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-CupR0O6r.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/sagas.json": () =>
      J(() => import(`./sagas-DiOiOClf.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-LJsuXrw8.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/sharding.json": () =>
      J(() => import(`./sharding-CoWj_zZr.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-D9_v_BNr.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/stateless.json": () =>
      J(() => import(`./stateless-DTrat1ln.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-Bj8Peqiq.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/testing.json": () =>
      J(() => import(`./testing-CfHx-oxU.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-BZJo_xce.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/transactions.json": () =>
      J(() => import(`./transactions-C2GnWuoT.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-BkBqiyJB.js`).then((e) => e.default), []),
    "./zh-Hans/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-Bs7_4jeX.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/apis.json": () =>
      J(() => import(`./apis-BmmOB7VP.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/authentication.json": () =>
      J(() => import(`./authentication-B7AqCBro.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/authorization.json": () =>
      J(() => import(`./authorization-C8MXSZ2V.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/batch-stream.json": () =>
      J(() => import(`./batch-stream-Cpw6hU13.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/caching.json": () =>
      J(() => import(`./caching-D-c64FFE.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/cap.json": () =>
      J(() => import(`./cap-L9et3thN.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/cdn.json": () =>
      J(() => import(`./cdn-BHIAvqJq.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/cicd.json": () =>
      J(() => import(`./cicd-kWNuNE0y.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/consensus.json": () =>
      J(() => import(`./consensus-BZJkoAVD.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/consistent-hashing.json": () =>
      J(() => import(`./consistent-hashing-Dxm_SdDr.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/design-chat.json": () =>
      J(() => import(`./design-chat-BLw2eKzL.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/design-news-feed.json": () =>
      J(() => import(`./design-news-feed-CJNj9Lnd.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/design-url-shortener.json": () =>
      J(() => import(`./design-url-shortener-BUuOQgAz.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/encryption.json": () =>
      J(() => import(`./encryption-Ie1WLQFS.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/files.json": () =>
      J(() => import(`./files-BEJrxhJm.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/hld-lld.json": () =>
      J(() => import(`./hld-lld-DHb_b45t.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/indexes.json": () =>
      J(() => import(`./indexes-DURqLUgk.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/latency-throughput.json": () =>
      J(() => import(`./latency-throughput-CDcsMmYE.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/load-balancing.json": () =>
      J(() => import(`./load-balancing-B9ypg5rb.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/microservices.json": () =>
      J(() => import(`./microservices-CRoRYHk5.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/napkin-math.json": () =>
      J(() => import(`./napkin-math-veT7y46M.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/observability.json": () =>
      J(() => import(`./observability-Cz9V8_3J.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/pubsub.json": () =>
      J(() => import(`./pubsub-B7WeGumC.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/queues.json": () =>
      J(() => import(`./queues-BiR1mC1n.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/rate-limiting.json": () =>
      J(() => import(`./rate-limiting-DPC6mdAy.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/realtime.json": () =>
      J(() => import(`./realtime-sZG8kVq4.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/redundancy.json": () =>
      J(() => import(`./redundancy-tsGFxbWB.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/replication.json": () =>
      J(() => import(`./replication-BuZ7TKKM.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/request-lifecycle.json": () =>
      J(() => import(`./request-lifecycle-D24npm7g.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/sagas.json": () =>
      J(() => import(`./sagas-C1vfLnUK.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/service-discovery.json": () =>
      J(() => import(`./service-discovery-ClFSZ49U.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/sharding.json": () =>
      J(() => import(`./sharding-BmZFnB9J.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/sql-nosql.json": () =>
      J(() => import(`./sql-nosql-QWfAwJFT.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/stateless.json": () =>
      J(() => import(`./stateless-D9kf4Arw.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/storage-engines.json": () =>
      J(() => import(`./storage-engines-DTsLq-o6.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/testing.json": () =>
      J(() => import(`./testing-DWdyK8rJ.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/timeouts-retries.json": () =>
      J(() => import(`./timeouts-retries-BmWGqfFd.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/transactions.json": () =>
      J(() => import(`./transactions-BB_nz7WQ.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/unique-ids.json": () =>
      J(() => import(`./unique-ids-z78j7xqT.js`).then((e) => e.default), []),
    "./zh-Hant/lessons/vertical-horizontal.json": () =>
      J(() => import(`./vertical-horizontal-C9xFHqnR.js`).then((e) => e.default), []),
  }),
  yp = [`en`, ...Object.keys(_p).map((e) => e.split(`/`)[1])],
  bp = new Map(),
  xp = new Map();
async function Sp(e) {
  yp.includes(e) || (e = `en`);
  let t = e === `en` ? {} : await _p[`./${e}/ui.json`]();
  return (
    mr(e, t),
    bp.clear(),
    xp.clear(),
    (document.documentElement.lang = e),
    (document.documentElement.dir = cr(e) ? `rtl` : `ltr`),
    e
  );
}
var Cp = (e) => ar() === `en` || bp.has(e);
async function wp(e) {
  if (Cp(e)) return;
  let t = ar(),
    n = vp[`./${t}/lessons/${e}.json`],
    r = n ? await n() : {};
  ar() === t && bp.set(e, hr(r));
}
var Tp = (e) => Promise.all(e.map(wp));
function Ep(e) {
  if (!e || ar() === `en`) return e;
  if (xp.has(e.id)) return xp.get(e.id);
  let t = bp.get(e.id) || {},
    n = (e) => t[e] || sr(e) || e,
    r = dp(e, n);
  return ((r.t = n), xp.set(e.id, r), r);
}
var Dp = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? `⌘K` : `Ctrl K`,
  Op = { lesson: 6, concept: 5, step: 25 },
  kp = [
    `a an the of to in on for and or is are be how what why when does do with vs versus my it by at as from into that this i`,
    `el la los las un una unos unas de del al y o u en es son ser que qué como cómo por para con sin se su sus lo le mi cuando cuándo donde dónde`,
    `os as um uma do da dos das no na nos nas e ou em é são por sem`,
    `le les une des du d l et est sont qui quoi comment pour par avec sans ce cette`,
    `il lo gli di della dello è sono che per senza`,
    `der die das den dem des ein eine einen und oder im ist sind wie was warum für mit ohne von zu zum zur`,
    `het een en of hoe wat waarom voor met zonder van te zijn`,
    `w na z do jak co czy dla jest się od po`,
    `ve veya bir bu ne nasıl neden için ile mi nedir`,
    `dan atau yang ke dari untuk dengan apa bagaimana adalah ini itu`,
    `là và của có một những các cho với như thế nào gì`,
    `ο η το οι τα ένα μια και ή σε του της των για με πώς τι είναι`,
    `и в на с по что как это для из к о а или не`,
    `і в на з по що як це для до та або не`,
    `का की के है और में से को एक क्या कैसे यह`,
    `في من على إلى و أو ما كيف هو هي هذا هذه عن مع`,
    `של ה ו ב ל מה איך זה עם על את או`,
  ],
  Ap = { ł: `l`, ı: `i`, ß: `ss`, đ: `d`, ø: `o`, æ: `ae`, œ: `oe`, ς: `σ`, ى: `ي`, ة: `ه` },
  jp = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/u,
  Mp = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+/gu,
  Np = (e) => jp.test(e),
  Pp = {
    db: [`database`],
    dbs: [`database`],
    lb: [`balancer`],
    lbs: [`balancer`],
    k8s: [`kubernetes`],
    mq: [`queue`],
    msg: [`message`],
    msgs: [`message`],
    ws: [`websocket`],
    tx: [`transaction`],
    txn: [`transaction`],
    txns: [`transaction`],
    authn: [`authentication`],
    authz: [`authorization`],
    kv: [`keyvalue`],
    "2pc": [`twophase`],
    e2e: [`endtoend`],
    e2ee: [`endtoend`],
    perf: [`latency`, `performance`],
    ha: [`availability`],
    sso: [`single`],
    wal: [`writeahead`],
    lsm: [`logstructured`],
  },
  Fp = [
    D(`load balancer`),
    D(`cache`),
    D(`replication`),
    D(`consistent hashing`),
    D(`rate limit`),
    D(`websocket`),
    D(`sagas`),
    D(`quorum`),
  ],
  Ip = { amp: `&`, lt: `<`, gt: `>`, quot: `"`, apos: `'`, nbsp: ` ` },
  Lp = (e = ``) =>
    String(e)
      .replace(/<sup>[\s\S]*?<\/sup>/gi, ``)
      .replace(/<\/(li|tr)>/gi, ` · `)
      .replace(/<\/(p|td|th|div)>|<br\s*\/?>/gi, ` `)
      .replace(/<[^>]+>/g, ``)
      .replace(/&(#x?[0-9a-f]+|\w+);/gi, (e, t) =>
        t[0] === `#`
          ? String.fromCodePoint(t[1] === `x` ? parseInt(t.slice(2), 16) : +t.slice(1))
          : (Ip[t] ?? e),
      )
      .replace(/(\s*·\s*)+$/, ``)
      .replace(/\s+/g, ` `)
      .trim(),
  Rp = (e) => e.replace(/^[=!#] /, ``).replace(/\*\*/g, ``),
  zp = (e) =>
    e
      .normalize(`NFKD`)
      .replace(/[\u0300-\u036f\u0591-\u05c7\u0640\u064b-\u065f\u0670]/g, ``)
      .normalize(`NFC`)
      .replace(/[’'‘`]/g, ``)
      .toLowerCase()
      .replace(/[łıßđøæœςىة]/g, (e) => Ap[e]),
  Bp = new Set(kp.join(` `).split(` `).map(zp));
function Vp(e) {
  let t = zp(e),
    n = [];
  for (let [e] of t.matchAll(/[\p{L}\p{M}\p{N}]+/gu)) {
    if (!Np(e)) {
      n.push(e);
      continue;
    }
    let t = 0;
    for (let r of e.matchAll(Mp)) {
      r.index > t && n.push(e.slice(t, r.index));
      let i = r[0];
      i.length === 1 && n.push(i);
      for (let e = 0; e + 1 < i.length; e++) n.push(i.slice(e, e + 2));
      t = r.index + i.length;
    }
    t < e.length && n.push(e.slice(t));
  }
  for (let e of t.match(/[\p{L}\p{M}\p{N}]+(?:[-–/][\p{L}\p{M}\p{N}]+)+/gu) || [])
    Np(e) || n.push(e.replace(/[-–/]/g, ``));
  return n;
}
var Hp = (e) => {
  if (e.length <= 4 || /\d/.test(e)) return e;
  let t = e.replace(/ies$/, `y`).replace(/(ing|ed|es|s|e)$/, ``);
  return t.length >= 3 ? t : e;
};
function Up(e, t, n) {
  if (Math.abs(e.length - t.length) > n) return n + 1;
  let r = null,
    i = Array.from({ length: t.length + 1 }, (e, t) => t);
  for (let a = 1; a <= e.length; a++) {
    let o = [a],
      s = a;
    for (let n = 1; n <= t.length; n++) {
      let c = Math.min(i[n] + 1, o[n - 1] + 1, i[n - 1] + (e[a - 1] === t[n - 1] ? 0 : 1));
      (r &&
        a > 1 &&
        n > 1 &&
        e[a - 1] === t[n - 2] &&
        e[a - 2] === t[n - 1] &&
        (c = Math.min(c, r[n - 2] + 1)),
        (o[n] = c),
        (s = Math.min(s, c)));
    }
    if (s > n) return n + 1;
    ((r = i), (i = o));
  }
  return i[t.length];
}
function Wp(e, t, n, r) {
  return e === n
    ? 1
    : t === r
      ? 0.95
      : e.startsWith(n)
        ? n.length < 3
          ? 0.6
          : 0.85
        : r.length >= 3 && t.startsWith(r)
          ? 0.75
          : t.length >= 6 && r.length - t.length <= 3 && r.startsWith(t)
            ? 0.7
            : n.length >= 4 && e.includes(n)
              ? 0.45
              : 0;
}
var Gp = (e) =>
  String(e)
    .replace(/&/g, `&amp;`)
    .replace(/</g, `&lt;`)
    .replace(/>/g, `&gt;`)
    .replace(/"/g, `&quot;`);
function Kp(e, t) {
  let n = [];
  if (!t || !t.size) return n;
  for (let r of e.matchAll(/[\p{L}\p{M}\p{N}’'‘`]+/gu))
    t.has(zp(r[0])) && n.push([r.index, r.index + r[0].length]);
  for (let r of t)
    if (Np(r))
      for (let t = e.indexOf(r); t >= 0; t = e.indexOf(r, t + 1)) n.push([t, t + r.length]);
  n.sort((e, t) => e[0] - t[0]);
  let r = [];
  for (let e of n) {
    let t = r[r.length - 1];
    t && e[0] <= t[1] ? (t[1] = Math.max(t[1], e[1])) : r.push([...e]);
  }
  return r;
}
function qp(e, t) {
  let n = ``,
    r = 0;
  for (let [i, a] of Kp(e, t))
    ((n += `${Gp(e.slice(r, i))}<mark>${Gp(e.slice(i, a))}</mark>`), (r = a));
  return n + Gp(e.slice(r));
}
function Jp(e, t, n = 190) {
  let r = Kp(e, t)[0]?.[0] ?? -1;
  if (r < 0 || r < 60) return e.length > n ? `${e.slice(0, e.lastIndexOf(` `, n))}…` : e;
  let i = e.lastIndexOf(` `, r - 34);
  i = i < 0 ? 0 : i + 1;
  let a = e.lastIndexOf(`. `, r);
  a >= 0 && a + 2 > i && a + 2 <= r && (i = a + 2);
  let o = i + n < e.length ? e.lastIndexOf(` `, i + n) : e.length,
    s = e.slice(i, o).replace(/^[\s·]+/, ``);
  return `${i ? `…` : ``}${s}${o < e.length ? `…` : ``}`;
}
function Yp(e, t) {
  let n = e.toLowerCase().indexOf(t.toLowerCase());
  if (n < 0) return e;
  let r = e.lastIndexOf(`. `, n),
    i = e.indexOf(`. `, n + t.length);
  return e.slice(r < 0 ? 0 : r + 2, i < 0 ? e.length : i + 1).trim();
}
function Xp(e) {
  let t = [],
    n = new Map(),
    r = 0;
  for (let { meta: i, lesson: a } of e)
    a &&
      (t.push({
        kind: `lesson`,
        lessonId: a.id,
        step: 0,
        order: r++,
        title: a.title,
        text: a.summary,
        module: i.module,
        steps: a.steps.length,
        fields: [
          [a.title, 10, !0],
          [a.summary, 4, !0],
          [O(i.module.title), 3, !0],
          [a.goals.map((e) => e.text).join(` `), 3, !0],
        ],
      }),
      a.steps.forEach((e, o) => {
        let s = e.body.map(Lp).join(` `),
          c = Object.values(e.scene.entities),
          l = c
            .filter((e) => e.type === `panel`)
            .map((e) =>
              [
                e.title,
                ...e.lines.map(Rp),
                ...(e.bars || []).map((e) => `${e.label} ${e.note || ``}`),
              ].join(` `),
            )
            .join(` `),
          u = [
            ...c.flatMap((e) => [
              ...(Array.isArray(e.label) ? e.label : [e.label]),
              e.sub,
              ...(e.tags || []).map((e) => e.text),
            ]),
            ...Object.values(e.scene.links || {}).map((e) => e.label),
          ]
            .filter((e) => typeof e == `string` && e)
            .join(` `);
        t.push({
          kind: `step`,
          lessonId: a.id,
          step: o,
          order: r++,
          title: e.title,
          text: s,
          lesson: a.title,
          module: i.module,
          chapter: e.chapter,
          steps: a.steps.length,
          fields: [
            [e.title, 8, !0],
            [e.short, 6, !0],
            [s, 3, !0],
            [Lp(e.callout?.text), 2, !0],
            [(e.changes || []).map((e) => e.replace(/^[+~−-]\s*/, ``)).join(` `), 1.5, !0],
            [l, 1.5, !0],
            [u, 1, !0],
            [a.title, 1, !1],
          ],
        });
        for (let t of e.body)
          for (let e of t.matchAll(/<span class="term">([\s\S]*?)<\/span>/g)) {
            let r = Lp(e[1]),
              s = Vp(r).map(Hp).join(` `);
            if (!s) continue;
            let c = n.get(s);
            c
              ? c.lessons.add(a.id)
              : n.set(s, {
                  term: r,
                  lessonId: a.id,
                  step: o,
                  lesson: a.title,
                  module: i.module,
                  sentence: Yp(Lp(t), r),
                  lessons: new Set([a.id]),
                });
          }
      }));
  for (let e of n.values())
    t.push({
      kind: `concept`,
      lessonId: e.lessonId,
      step: e.step,
      order: r++,
      title: lr(e.term.charAt(0)) + e.term.slice(1),
      text: e.sentence,
      lesson: e.lesson,
      module: e.module,
      also: e.lessons.size - 1,
      fields: [
        [e.term, 10, !0],
        [e.sentence, 1, !1],
      ],
    });
  let i = new Map();
  t.forEach((e, t) => {
    e.titleFold = zp(e.title);
    let n = new Map();
    for (let [t, r, i] of e.fields)
      for (let e of Vp(t || ``)) {
        let t = n.get(e);
        (!t || r > t[0] || (r === t[0] && i && !t[1])) && n.set(e, [r, i]);
      }
    for (let [e, [r, a]] of n) (i.has(e) || i.set(e, []), i.get(e).push([t, r, a]));
  });
  let a = [...i.keys()];
  return {
    docs: t,
    post: i,
    vocab: a,
    stems: a.map(Hp),
    counts: {
      lessons: t.filter((e) => e.kind === `lesson`).length,
      steps: t.filter((e) => e.kind === `step`).length,
      concepts: n.size,
    },
  };
}
function Zp(e, t) {
  let n = new Map();
  if (
    ([t, ...(Pp[t] || [])].forEach((t, r) => {
      let i = Hp(t),
        a = r ? 0.9 : 1;
      e.vocab.forEach((r, o) => {
        let s = Wp(r, e.stems[o], t, i) * a;
        s > (n.get(r) || 0) && n.set(r, s);
      });
    }),
    t.length >= 5 && ![...n.values()].some((e) => e >= 0.85))
  ) {
    let r = t.length >= 8 ? 2 : 1;
    for (let i of e.vocab) {
      if (i.length < t.length - r || n.get(i) >= 0.6) continue;
      let e = Up(i, t, r);
      (e > r && i.length > t.length && (e = Up(i.slice(0, t.length), t, r)),
        e <= r && n.set(i, e === 1 ? 0.6 : 0.45));
    }
  }
  return n;
}
function Qp(e, t) {
  let n = [...new Set(Vp(t))],
    r = n.filter((e) => !Bp.has(e));
  if ((r.length && (n = r), !n.length)) return null;
  let i = n.map((t) => Zp(e, t)),
    a = new Set();
  for (let e of i) for (let t of e.keys()) a.add(t);
  let o = new Map();
  i.forEach((t, r) => {
    for (let [i, a] of t)
      for (let [t, s, c] of e.post.get(i)) {
        let e = o.get(t);
        e || o.set(t, (e = n.map(() => ({ s: 0, key: !1 }))));
        let i = a * s;
        (i > e[r].s && (e[r].s = i), c && (e[r].key = !0));
      }
  });
  let s = n.map(Np),
    c = s.filter(Boolean).length,
    l = c <= 2 ? c : Math.ceil(c * 0.6),
    u = zp(t).replace(/\s+/g, ` `).trim(),
    d = { lesson: [], concept: [], step: [] };
  for (let [t, n] of o) {
    if (
      n.some((e, t) => e.s === 0 && !s[t]) ||
      !n.some((e) => e.key) ||
      n.filter((e, t) => s[t] && e.s > 0).length < l
    )
      continue;
    let r = e.docs[t],
      i = n.reduce((e, t) => e + t.s, 0);
    (u.length > 2 && r.titleFold.includes(u) && (i += r.titleFold.startsWith(u) ? 12 : 8),
      r.titleFold === u && (i += 10),
      d[r.kind].push({ d: r, score: i }));
  }
  for (let e of Object.values(d)) e.sort((e, t) => t.score - e.score || e.d.order - t.d.order);
  return { found: d, matched: a };
}
var $p = (e, t) => `#/${e}/${t + 1}`,
  em = (e) => `${e.num} · ${O(e.title)}`;
function tm({ getState: e, onPick: t, lessons: n, prepare: a = () => Promise.resolve() }) {
  let c = document.createElement(`div`);
  ((c.className = `sx`),
    (c.hidden = !0),
    (c.innerHTML = `
    <div class="sx__backdrop"></div>
    <div class="sx__dialog" role="dialog" aria-modal="true" aria-label="Search the course">
      <div class="sx__bar">
        ${i(`search`, { size: 19, stroke: 2.2, cls: `sx__glass` })}
        <input class="sx__input" type="text" role="combobox" aria-expanded="true" aria-controls="sx-list" aria-autocomplete="list"
          placeholder="Search lessons, concepts, systems…" spellcheck="false" autocomplete="off" />
        <button class="sx__clear" type="button" aria-label="Clear search" hidden>Clear</button>
        <button class="sx__esc" type="button" aria-label="Close search">esc</button>
      </div>
      <div class="sx__list" id="sx-list" role="listbox" aria-label="Results"></div>
      <div class="sx__foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
        <span><kbd>↵</kbd> open</span>
        <span><kbd>esc</kbd> close</span>
        <span class="sx__count"></span>
      </div>
    </div>`),
    document.querySelector(`.window`).appendChild(c));
  let l = c.querySelector(`.sx__input`),
    u = c.querySelector(`.sx__list`),
    d = c.querySelector(`.sx__clear`),
    f = c.querySelector(`.sx__count`),
    p = null,
    m = null,
    h = [],
    g = 0,
    _ = !1,
    v = 0,
    y = `<kbd class="sx__enter">↵</kbd>`;
  function b(t, n, a, o) {
    let { done: s } = e(),
      c = o ?? em(t.module),
      l = s.has(t.lessonId)
        ? i(`circleCheck`, { size: 16, stroke: 2, cls: `sx__done` })
        : `<span class="sx__steps">${Gp(O(`{n} steps`, { n: t.steps }))}</span>`;
    return `
      <a class="sx__item" role="option" id="sx-opt-${n}" data-i="${n}" href="${$p(t.lessonId, t.step)}">
        <span class="sx__icon sx__icon--lesson">${r(t.module.color)}</span>
        <span class="sx__main">
          <span class="sx__title">${qp(t.title, a)}${c ? `<span class="sx__meta">${Gp(c)}</span>` : ``}</span>
          <span class="sx__text">${qp(t.text, a)}</span>
        </span>
        <span class="sx__side">${l}${y}</span>
      </a>`;
  }
  function x(e, t, n) {
    let r = `${e.lesson} · ${O(`step {n}`, { n: e.step + 1 })}${e.also ? ` · ${O(`+{n} more`, { n: e.also })}` : ``}`;
    return `
      <a class="sx__item" role="option" id="sx-opt-${t}" data-i="${t}" href="${$p(e.lessonId, e.step)}">
        <span class="sx__icon sx__icon--concept">${i(`bookmark`, { size: 15, stroke: 2.1 })}</span>
        <span class="sx__main">
          <span class="sx__title">${qp(e.title, n)}<span class="sx__meta">${Gp(r)}</span></span>
          <span class="sx__text">${qp(Jp(e.text, n), n)}</span>
        </span>
        <span class="sx__side"><span class="sx__kind">${Gp(O(`Concept`))}</span>${y}</span>
      </a>`;
  }
  function ee(e, t, n) {
    let r = o[e.chapter] || o.insight;
    return `
      <a class="sx__item" role="option" id="sx-opt-${t}" data-i="${t}" href="${$p(e.lessonId, e.step)}">
        <span class="sx__icon sx__icon--step chapter--${r.tone}">${e.step + 1}</span>
        <span class="sx__main">
          <span class="sx__title">${qp(e.title, n)}<span class="sx__meta">${Gp(e.lesson)} · ${Gp(O(`step {n} of {total}`, { n: e.step + 1, total: e.steps }))}</span></span>
          <span class="sx__text">${qp(Jp(e.text, n), n)}</span>
        </span>
        <span class="sx__side"><span class="sx__chip chapter--${r.tone}">${Gp(O(r.label))}</span>${y}</span>
      </a>`;
  }
  let S = (e, t, n = ``) =>
    `<div class="sx__group" role="presentation"><span>${Gp(e)}</span><span>${n || t}</span></div>`;
  function te() {
    let t = l.value;
    d.hidden = !t;
    let n = t.trim() ? Qp(p, t) : null;
    h = [];
    let r = ``;
    if (n) {
      let { found: e, matched: i } = n,
        a = e.lesson.length + e.concept.length + e.step.length,
        o = (t, n) => (e[t].length ? e[t][0].score + n : -1),
        s = [
          [`lesson`, O(`Lessons`), b, o(`lesson`, 3)],
          [`concept`, O(`Concepts`), x, o(`concept`, 1)],
          [`step`, O(`Steps`), ee, o(`step`, 0)],
        ].sort((e, t) => t[3] - e[3]);
      for (let [t, n, a] of s) {
        let o = e[t];
        if (!o.length) continue;
        let s = o.slice(0, Op[t]);
        r += S(
          n,
          o.length,
          o.length > s.length ? O(`top {n} of {total}`, { n: s.length, total: o.length }) : ``,
        );
        for (let { d: e } of s) ((r += a(e, h.length, i)), h.push(e));
      }
      (a ||
        (r = `
          <div class="sx__empty">
            <div class="sx__empty-title">${Gp(O(`Nothing matches “{q}”`, { q: t.trim() }))}</div>
            <p>${Gp(O(`Try a single word, or one of these:`))}</p>
            <div class="sx__chips">${Fp.map((e) => O(e))
              .map((e) => `<button type="button" data-q="${Gp(e)}">${Gp(e)}</button>`)
              .join(``)}</div>
          </div>`),
        (f.textContent = a === 1 ? O(`1 result`) : O(`{n} results`, { n: a })));
    } else {
      let { lessonId: t, recent: n, done: i } = e(),
        a = new Map(p.docs.filter((e) => e.kind === `lesson`).map((e) => [e.lessonId, e])),
        o = (e, t) => p.docs.find((n) => n.kind === `step` && n.lessonId === e && n.step === t),
        c = n.filter((e) => e.lessonId !== t && a.has(e.lessonId)).slice(0, 4);
      if (c.length) {
        r += S(O(`Recent`), c.length);
        for (let e of c) {
          let t = a.get(e.lessonId),
            n = o(e.lessonId, e.step),
            i = {
              ...t,
              step: e.step,
              text: n
                ? O(`Continue at step {n}: {title}`, { n: e.step + 1, title: n.title })
                : t.text,
            };
          ((r += b(i, h.length, null, em(t.module))), h.push(i));
        }
      }
      for (let e of s) {
        let t = e.lessons.map((e) => a.get(e.id)).filter(Boolean);
        if (t.length) {
          r += S(
            em(e),
            t.length,
            O(`{n}/{total} done`, {
              n: t.filter((e) => i.has(e.lessonId)).length,
              total: t.length,
            }),
          );
          for (let e of t) ((r += b(e, h.length, null, ``)), h.push(e));
        }
      }
      f.textContent = O(`{lessons} lessons · {steps} steps · {concepts} concepts`, p.counts);
    }
    ((u.innerHTML = r), (u.scrollTop = 0), ne(0, !1));
  }
  function ne(e, t = !0) {
    if (!h.length) {
      ((g = -1), l.removeAttribute(`aria-activedescendant`));
      return;
    }
    g = (e + h.length) % h.length;
    let n = u.querySelector(`.sx__item.is-sel`);
    (n?.classList.remove(`is-sel`), n?.setAttribute(`aria-selected`, `false`));
    let r = u.querySelector(`#sx-opt-${g}`);
    if (
      r &&
      (r.classList.add(`is-sel`),
      r.setAttribute(`aria-selected`, `true`),
      l.setAttribute(`aria-activedescendant`, r.id),
      t)
    ) {
      let e = r.previousElementSibling;
      ((e && e.classList.contains(`sx__group`) ? e : r).scrollIntoView({ block: `nearest` }),
        e && e.classList.contains(`sx__group`) && r.scrollIntoView({ block: `nearest` }));
    }
  }
  function re(e) {
    let n = h[e];
    if (!n) return;
    let r = $p(n.lessonId, n.step);
    (ae(), t?.(n.lessonId, r), location.hash !== r && (location.hash = r));
  }
  function ie(e = ``) {
    if (_) l.select();
    else {
      if (((_ = !0), clearTimeout(v), (c.hidden = !1), (l.value = e), p)) te();
      else if (((u.innerHTML = `<div class="sx__empty"><p>${Gp(O(`Loading…`))}</p></div>`), !m)) {
        let e = (m = a().then(() => {
          m === e && ((m = null), (p = Xp(n())), _ && te());
        }));
      }
      (c.offsetWidth, c.classList.add(`is-open`), l.focus());
    }
  }
  function ae() {
    _ &&
      ((_ = !1),
      c.classList.remove(`is-open`),
      l.blur(),
      (v = setTimeout(() => {
        c.hidden = !0;
      }, 170)));
  }
  (l.addEventListener(`input`, () => p && te()),
    l.addEventListener(`keydown`, (e) => {
      if (e.key === `ArrowDown` || (e.key === `Tab` && !e.shiftKey) || (e.ctrlKey && e.key === `n`))
        ne(g + 1);
      else if (
        e.key === `ArrowUp` ||
        (e.key === `Tab` && e.shiftKey) ||
        (e.ctrlKey && e.key === `p`)
      )
        ne(g - 1);
      else if (e.key === `PageDown`) ne(Math.min(h.length - 1, g + 6));
      else if (e.key === `PageUp`) ne(Math.max(0, g - 6));
      else if (e.key === `Enter`) re(g);
      else if (e.key === `Escape`) ae();
      else return;
      (e.preventDefault(), e.stopPropagation());
    }),
    d.addEventListener(`click`, () => {
      ((l.value = ``), te(), l.focus());
    }),
    c.querySelector(`.sx__dialog`).addEventListener(`mousedown`, (e) => {
      e.target !== l && e.preventDefault();
    }),
    u.addEventListener(`click`, (e) => {
      let t = e.target.closest(`[data-q]`);
      if (t) {
        ((l.value = t.dataset.q), te());
        return;
      }
      let n = e.target.closest(`.sx__item`);
      n &&
        (e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.button !== 0 ||
          (e.preventDefault(), re(+n.dataset.i)));
    }),
    u.addEventListener(`mousemove`, (e) => {
      let t = e.target.closest(`.sx__item`);
      t && +t.dataset.i !== g && ne(+t.dataset.i, !1);
    }),
    c.querySelector(`.sx__backdrop`).addEventListener(`mousedown`, ae),
    c.querySelector(`.sx__esc`).addEventListener(`click`, ae),
    window.addEventListener(
      `keydown`,
      (e) => {
        (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === `k`
          ? (e.preventDefault(), e.stopPropagation(), _ ? ae() : ie())
          : _
            ? (e.key === `Escape` && (e.preventDefault(), ae()),
              e.target !== l && e.stopPropagation())
            : e.key !== `/` ||
              e.metaKey ||
              e.ctrlKey ||
              e.altKey ||
              e.target.closest(`input, textarea, [contenteditable]`) ||
              (e.preventDefault(), ie());
      },
      !0,
    ));
  function C() {
    ((p = null), (m = null), oe());
  }
  function oe() {
    (c.querySelector(`.sx__dialog`).setAttribute(`aria-label`, O(`Search the course`)),
      (l.placeholder = O(`Search lessons, concepts, systems…`)),
      (d.textContent = O(`Clear`)),
      d.setAttribute(`aria-label`, O(`Clear search`)),
      c.querySelector(`.sx__esc`).setAttribute(`aria-label`, O(`Close search`)),
      u.setAttribute(`aria-label`, O(`Results`)));
    let e = c.querySelectorAll(`.sx__foot > span:not(.sx__count)`);
    ((e[0].lastChild.textContent = ` ${O(`move`)}`),
      (e[1].lastChild.textContent = ` ${O(`open`)}`),
      (e[2].lastChild.textContent = ` ${O(`close`)}`));
  }
  return (oe(), { open: ie, close: ae, isOpen: () => _, reset: C });
}
var nm =
    { readAloud: !1 }.readAloud && typeof window < `u` && `speechSynthesis` in window
      ? window.speechSynthesis
      : null,
  rm = !!nm && typeof window.SpeechSynthesisUtterance == `function`,
  im = [],
  am = new Set();
function om() {
  im = nm.getVoices();
  for (let e of am) e();
}
rm && (om(), nm.addEventListener?.(`voiceschanged`, om));
var sm = (e) => am.add(e),
  cm = {
    "zh-Hans": [`zh-cn`, `zh-sg`, `zh-hans`, `cmn-cn`, `cmn-hans`],
    "zh-Hant": [`zh-tw`, `zh-hk`, `zh-mo`, `zh-hant`, `cmn-tw`, `yue`],
    he: [`he`, `iw`],
    id: [`id`, `in`],
  },
  lm = (e) =>
    String(e || ``)
      .replace(/_/g, `-`)
      .toLowerCase(),
  um = (e, t) => {
    let n = lm(e.lang);
    return (cm[t] || [t.toLowerCase()]).some((e) => n === e || n.startsWith(`${e}-`));
  };
function dm(e, t) {
  let n = lm(t),
    r = (e) => (e.localService ? 0 : 4) + (lm(e.lang) === n ? 0 : 2) + +!e.default;
  return im.filter((t) => um(t, e)).sort((e, t) => r(e) - r(t) || e.name.localeCompare(t.name));
}
var fm = (e) =>
  e
    .replace(/[‎‏⁦-⁩]/g, ``)
    .replace(/\s*[→←⇒⇐↔↦]\s*/g, `, `)
    .replace(/\s+·\s+/g, `, `)
    .replace(/[✓✔✕✗]/g, ``)
    .replace(/\s+/g, ` `)
    .trim();
function pm(e, t) {
  let n =
      typeof Intl.Segmenter == `function`
        ? [...new Intl.Segmenter(t, { granularity: `sentence` }).segment(e)].map((e) => e.segment)
        : e.split(/(?<=[.!?。！？])\s+/),
    r = [],
    i = ``;
  for (let e of n) (i && (i + e).length > 220 && (r.push(i), (i = ``)), (i += e));
  return (
    i.trim() && r.push(i),
    r
      .flatMap((e) => {
        let t = [],
          n = e.trim();
        for (; n.length > 308;) {
          let e = Math.max(
              n.lastIndexOf(`, `, 220),
              n.lastIndexOf(`، `, 220),
              n.lastIndexOf(`，`, 220),
              n.lastIndexOf(`、`, 220),
            ),
            r =
              e > 220 / 3
                ? e + 1
                : n.lastIndexOf(` `, 220) > 220 / 3
                  ? n.lastIndexOf(` `, 220)
                  : 220;
          (t.push(n.slice(0, r)), (n = n.slice(r).trim()));
        }
        return [...t, n];
      })
      .map((e) => e.trim())
      .filter(Boolean)
  );
}
var mm = 0,
  hm = [],
  gm = 0,
  _m = null,
  vm = () => (_m ? (_m.paused ? `paused` : `speaking`) : `idle`);
function ym() {
  ((mm += 1), clearTimeout(gm), (hm = []), rm && nm.cancel());
}
function bm() {
  (ym(), (_m = null));
}
function xm(e, t, { paused: n = !1 } = {}) {
  if ((bm(), !rm)) return;
  let r = e.flatMap((e) => pm(fm(e.text), t.lang).map((t) => ({ el: e.el, text: t })));
  r.length ? ((_m = { items: r, opts: t, pos: 0, paused: n }), n || Sm(0)) : t.onDone?.();
}
function Sm(e) {
  ym();
  let t = _m,
    n = mm,
    r = () => n === mm,
    { voice: i, lang: a, rate: o = 1, onBlock: s, onDone: c, onBlocked: l } = t.opts;
  ((t.paused = !1),
    (gm = setTimeout(() => {
      if (r()) {
        hm = t.items.slice(e).map((n, u) => {
          let d = e + u,
            f = new SpeechSynthesisUtterance(n.text);
          return (
            (f.lang = i ? i.lang : a),
            i && (f.voice = i),
            (f.rate = o),
            (f.onstart = () => {
              r() && ((t.pos = d), s?.(n.el));
            }),
            (f.onend = () => {
              r() && d === t.items.length - 1 && ((hm = []), (_m = null), c?.());
            }),
            (f.onerror = (e) => {
              r() &&
                e.error !== `interrupted` &&
                e.error !== `canceled` &&
                (bm(), e.error === `not-allowed` ? l?.() : c?.());
            }),
            f
          );
        });
        for (let e of hm) nm.speak(e);
      }
    }, 90)));
}
function Cm() {
  return vm() === `speaking` && (ym(), (_m.paused = !0), !0);
}
function wm() {
  return vm() === `paused` && (Sm(_m.pos), !0);
}
function Tm(e) {
  return _m ? (Object.assign(_m.opts, e), Sm(_m.pos), !0) : !1;
}
rm && window.addEventListener(`pagehide`, () => nm.cancel());
var Em = [
    { id: `en`, code: `EN`, native: `English`, english: D(`English`) },
    { id: `es`, code: `ES`, native: `Español`, english: D(`Spanish`) },
    { id: `pt`, code: `PT`, native: `Português`, english: D(`Portuguese`) },
    { id: `fr`, code: `FR`, native: `Français`, english: D(`French`) },
    { id: `it`, code: `IT`, native: `Italiano`, english: D(`Italian`) },
    { id: `de`, code: `DE`, native: `Deutsch`, english: D(`German`) },
    { id: `nl`, code: `NL`, native: `Nederlands`, english: D(`Dutch`) },
    { id: `pl`, code: `PL`, native: `Polski`, english: D(`Polish`) },
    { id: `tr`, code: `TR`, native: `Türkçe`, english: D(`Turkish`) },
    { id: `id`, code: `ID`, native: `Bahasa Indonesia`, english: D(`Indonesian`) },
    { id: `vi`, code: `VI`, native: `Tiếng Việt`, english: D(`Vietnamese`) },
    { id: `el`, code: `EL`, native: `Ελληνικά`, english: D(`Greek`) },
    { id: `uk`, code: `UA`, native: `Українська`, english: D(`Ukrainian`) },
    { id: `ru`, code: `RU`, native: `Русский`, english: D(`Russian`) },
    { id: `zh-Hans`, code: `简`, native: `简体中文`, english: D(`Chinese (Simplified)`) },
    { id: `zh-Hant`, code: `繁`, native: `繁體中文`, english: D(`Chinese (Traditional)`) },
    { id: `ja`, code: `JA`, native: `日本語`, english: D(`Japanese`) },
    { id: `ko`, code: `KO`, native: `한국어`, english: D(`Korean`) },
    { id: `hi`, code: `HI`, native: `हिन्दी`, english: D(`Hindi`) },
    { id: `ar`, code: `AR`, native: `العربية`, english: D(`Arabic`) },
    { id: `he`, code: `HE`, native: `עברית`, english: D(`Hebrew`) },
  ],
  Dm = (e) => Em.find((t) => t.id === e) || Em[0],
  Om = [
    { label: D(`Learn`), icon: `book`, active: !0 },
    { label: D(`Practice`), icon: `settings` },
    { label: D(`Design Lab`), icon: `window` },
    { label: D(`Cheatsheets`), icon: `sheets` },
  ],
  km = {
    warn: { icon: `alert`, title: D(`Watch out`) },
    tip: { icon: `bulb`, title: D(`Good to know`) },
    insight: { icon: `sparkles`, title: D(`Key idea`) },
    next: { icon: `arrowRight`, title: D(`Coming up`) },
  },
  Am = {
    req: [`<i class="lg lg--req"></i>`, D(`request`)],
    res: [`<i class="lg lg--res"></i>`, D(`response`)],
    slow: [`<i class="lg lg--slow"></i>`, D(`slow request`)],
    queue: [`<i class="lg lg--slow"></i>`, D(`waiting`)],
    heavy: [`<i class="lg lg--heavy"></i>`, D(`heavy request`)],
    mine: [`<i class="lg lg--mine"></i>`, D(`Alice’s request`)],
    write: [`<i class="lg lg--write"></i>`, D(`write`)],
    kill: [`<i class="lg lg--kill"></i>`, D(`invalidate`)],
    msg: [`<i class="lg lg--msg"></i>`, D(`message`)],
    poison: [`<i class="lg lg--poison"></i>`, D(`poison message`)],
    push: [`<i class="lg lg--push"></i>`, D(`server push`)],
    empty: [`<i class="lg lg--empty"></i>`, D(`empty response`)],
    retry: [`<i class="lg lg--slow"></i>`, D(`retry`)],
    telemetry: [`<i class="lg lg--write"></i>`, D(`telemetry`)],
    attack: [`<i class="lg lg--poison"></i>`, D(`attacker`)],
    ping: [`<i class="lg lg--ping"></i>`, D(`health check`)],
    fail: [`<i class="lg lg--fail">×</i>`, D(`failed request`)],
  },
  jm = (e) => gr(Math.round(e)),
  Mm = (e) => `${gr(e / 1e3, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${O(`s`)}`,
  Nm = (e) => (e == null ? `—` : e >= 1e3 ? Mm(e) : `${Math.round(e)} ${O(`ms`)}`),
  Y = (e) => (typeof e == `number` ? jm(e) : e),
  Pm = (e, t) => (n) => (n == null ? `none` : n <= e ? `good` : n <= t ? `warn` : `bad`),
  Fm = (e) => (e === `no` ? `good` : e === `yes` ? `bad` : `none`),
  Im = (e) =>
    e === `yes` || e === `passkey`
      ? `good`
      : e === `no`
        ? `bad`
        : [`limited`, `partly`, `per doc`, `phishable`].includes(e)
          ? `warn`
          : `none`,
  Lm = {
    az_health: {
      label: D(`AZ Health`),
      icon: `heartPulse`,
      fmt: Y,
      level: (e) => (e && e.includes(`DOWN`) ? `bad` : `good`),
    },
    ecs_tasks: { label: D(`ECS Tasks`), icon: `server`, fmt: Y },
    aurora_lag: { label: D(`Storage Lag`), icon: `timer`, fmt: Y },
    total_uptime: { label: D(`Uptime`), icon: `circleCheck`, fmt: Y, level: () => `good` },
    latency: { label: D(`Latency`), icon: `timer`, fmt: Nm },
    dns: { label: D(`DNS lookup`), icon: `globe`, fmt: Nm },
    connect: { label: D(`Connect`), icon: `network`, fmt: Nm },
    request: { label: D(`Request + server`), icon: `server`, fmt: Nm },
    download: { label: D(`Download`), icon: `activity`, fmt: Nm },
    total: { label: D(`Total`), icon: `timer`, fmt: Nm, level: Pm(200, 800) },
    p50: { label: D(`p50 latency`), icon: `timer`, fmt: Nm, level: Pm(250, 800) },
    p99: { label: D(`p99 latency`), icon: `timer`, fmt: Nm, level: Pm(400, 1200) },
    throughput: { label: D(`Throughput`), icon: `activity`, fmt: (e) => `${jm(e)} ${O(`req/s`)}` },
    util: {
      label: D(`Utilization`),
      icon: `cpu`,
      fmt: (e) => `${Math.round(e)}%`,
      level: (e) => (e < 75 ? `good` : e < 88 ? `warn` : `bad`),
    },
    dau: { label: D(`Daily users`), icon: `users`, fmt: Y },
    avg: { label: D(`Avg req / s`), icon: `activity`, fmt: Y },
    peak: { label: D(`Peak req / s`), icon: `trendingUp`, fmt: Y },
    servers: { label: D(`Servers`), icon: `server`, fmt: Y },
    storage: { label: D(`Storage / year`), icon: `database`, fmt: Y },
    ok: {
      label: D(`Alice’s requests OK`),
      icon: `user`,
      fmt: Y,
      level: (e) => {
        let t = /^(\d+) \/ (\d+)$/.exec(e || ``);
        return t ? (t[1] === t[2] ? `good` : t[1] === `0` ? `bad` : `warn`) : `none`;
      },
    },
    survive: { label: D(`Survives losing a server`), icon: `heartPulse`, fmt: Y, level: Im },
    scale: { label: D(`Add servers any time`), icon: `server`, fmt: Y, level: Im },
    extra: { label: D(`Cost per request`), icon: `timer`, fmt: Y },
    hitRate: {
      label: D(`Cache hit rate`),
      icon: `zap`,
      fmt: (e) => `${Math.round(e)}%`,
      level: (e) => (e >= 85 ? `good` : e >= 50 ? `warn` : `bad`),
    },
    dbLoad: {
      label: D(`Database CPU`),
      icon: `database`,
      fmt: (e) => `${Math.round(e)}%`,
      level: (e) => (e < 70 ? `good` : e < 88 ? `warn` : `bad`),
    },
    fresh: {
      label: D(`Data shown`),
      icon: `circleCheck`,
      fmt: Y,
      level: (e) => (e === `fresh` ? `good` : e === `stale` ? `bad` : `none`),
    },
    lon: { label: D(`London latency`), icon: `globe`, fmt: Nm, level: Pm(60, 150) },
    syd: { label: D(`Sydney latency`), icon: `globe`, fmt: Nm, level: Pm(60, 150) },
    origin: { label: D(`Origin load`), icon: `server`, fmt: (e) => `${jm(e)} ${O(`req/s`)}` },
    joins: { label: D(`Joins`), icon: `network`, fmt: Y, level: Im },
    tx: { label: D(`Transactions`), icon: `lock`, fmt: Y, level: Im },
    schema: { label: D(`Schema`), icon: `listOrdered`, fmt: Y },
    scaleOut: {
      label: D(`Scale out writes`),
      icon: `server`,
      fmt: Y,
      level: (e) => (e === `easy` ? `good` : e === `hard` ? `bad` : `warn`),
    },
    rows: {
      label: D(`Rows read`),
      icon: `layers`,
      fmt: Y,
      level: (e) => (e === 1 ? `good` : typeof e == `number` && e > 1e3 ? `bad` : `none`),
    },
    writeCost: { label: D(`Writes per insert`), icon: `database`, fmt: Y },
    indexes: { label: D(`Indexes`), icon: `listOrdered`, fmt: Y },
    reads: { label: D(`Read capacity`), icon: `activity`, fmt: Y },
    lag: {
      label: D(`Replica lag`),
      icon: `clock`,
      fmt: Y,
      level: (e) => (e === `0 s` ? `good` : e === `—` ? `none` : `warn`),
    },
    writes: {
      label: D(`Writes`),
      icon: `database`,
      fmt: Y,
      level: (e) =>
        e === `ok`
          ? `good`
          : e === `failing` || e === `diverging`
            ? `bad`
            : e === `paused`
              ? `warn`
              : `none`,
    },
    leaders: {
      label: D(`Leaders`),
      icon: `flag`,
      fmt: Y,
      level: (e) => (e === 1 ? `good` : `bad`),
    },
    term: { label: D(`Term`), icon: `hash`, fmt: Y },
    canLose: { label: D(`Can lose`), icon: `heartPulse`, fmt: Y },
    redirectMs: { label: D(`Redirect time`), icon: `timer`, fmt: Nm, level: Pm(30, 150) },
    dbQps: {
      label: D(`Store lookups`),
      icon: `database`,
      fmt: (e) => (typeof e == `number` ? `${jm(e)}/s` : e),
    },
    codeKind: {
      label: D(`Short codes`),
      icon: `hash`,
      fmt: Y,
      level: (e) => (/collides/.test(e) ? `bad` : /unique/.test(e) ? `good` : `none`),
    },
    linksKept: { label: D(`Links kept`), icon: `layers`, fmt: Y },
    feedMs: { label: D(`Feed load time`), icon: `timer`, fmt: Nm, level: Pm(200, 600) },
    readWork: {
      label: D(`Lookups per feed`),
      icon: `search`,
      fmt: Y,
      level: (e) => (e === 200 || /rebuild/.test(e) ? `warn` : e === `—` ? `none` : `good`),
    },
    fanout: {
      label: D(`Feed writes per post`),
      icon: `split`,
      fmt: Y,
      level: (e) => (e === `50,000,000` ? `bad` : `none`),
    },
    postDelay: {
      label: D(`Post reaches followers`),
      icon: `clock`,
      fmt: Y,
      level: (e) => (/min/.test(e) ? `bad` : e === `—` ? `none` : `good`),
    },
    deliverMs: {
      label: D(`Delivery time`),
      icon: `timer`,
      fmt: (e) => (e == null ? `—` : `${Math.round(e)} ${O(`ms`)}`),
      level: Pm(200, 1e3),
    },
    canLoseMsg: { label: D(`Can lose a message`), icon: `alert`, fmt: Y, level: Fm },
    ordered: { label: D(`Order guaranteed`), icon: `listOrdered`, fmt: Y, level: Im },
    crashSafe: { label: D(`Survives a crash`), icon: `shield`, fmt: Y, level: Im },
    wps: {
      label: D(`Writes / second`),
      icon: `activity`,
      fmt: Y,
      level: (e) => (/ of /.test(e) ? `bad` : `none`),
    },
    diskPattern: {
      label: D(`Disk writes`),
      icon: `database`,
      fmt: Y,
      level: (e) => (e === `all sequential` ? `good` : /random/.test(e) ? `warn` : `none`),
    },
    lookupCost: { label: D(`Reads per lookup`), icon: `search`, fmt: Y },
    zoom: { label: D(`Zoom level`), icon: `zoomIn`, fmt: Y },
    dbGrowth: {
      label: D(`Database grows`),
      icon: `database`,
      fmt: Y,
      level: (e) => (/TB/.test(e) ? `bad` : /GB/.test(e) && !/\+2 GB/.test(e) ? `good` : `none`),
    },
    appTraffic: {
      label: D(`Through app servers`),
      icon: `server`,
      fmt: Y,
      level: (e) => (/small/.test(e) ? `good` : `bad`),
    },
    imgLoad: { label: D(`Photo load`), icon: `timer`, fmt: Nm, level: Pm(100, 300) },
    storeCost: { label: D(`Storage / month`), icon: `dollar`, fmt: Y },
    feedback: {
      label: D(`Feedback in`),
      icon: `timer`,
      fmt: Y,
      level: (e) =>
        /day|h\b|hours/.test(e) ? `bad` : /min/.test(e) && !/→/.test(e) ? `warn` : `good`,
    },
    covers: { label: D(`Tests cover`), icon: `flask`, fmt: Y },
    escaped: {
      label: D(`Bugs reaching users`),
      icon: `bug`,
      fmt: Y,
      level: (e) => (e === `rare` ? `good` : e === `fewer` ? `warn` : `bad`),
    },
    leadTime: {
      label: D(`Commit → production`),
      icon: `clock`,
      fmt: Y,
      level: (e) => (/week/.test(e) ? `bad` : /day/.test(e) ? `warn` : `good`),
    },
    failRate: {
      label: D(`Deploys that fail`),
      icon: `alert`,
      fmt: Y,
      level: (e) => (parseFloat(e) <= 5 ? `good` : parseFloat(e) <= 15 ? `warn` : `bad`),
    },
    restore: {
      label: D(`Time to restore`),
      icon: `undo`,
      fmt: Y,
      level: (e) => (/min/.test(e) ? `good` : /h/.test(e) ? `bad` : `none`),
    },
    unit: { label: D(`Building blocks`), icon: `boxes`, fmt: Y },
    output: { label: D(`You produce`), icon: `file`, fmt: Y },
    collide: { label: D(`Duplicate ids`), icon: `alert`, fmt: Y, level: Fm },
    idSize: { label: D(`Id size`), icon: `hash`, fmt: Y },
    sortable: {
      label: D(`Sorted by time`),
      icon: `clock`,
      fmt: Y,
      level: (e) => (e === `yes` ? `good` : e === `no` ? `warn` : `none`),
    },
    idDep: {
      label: D(`Depends on`),
      icon: `network`,
      fmt: Y,
      level: (e) => (e === `nothing` ? `good` : /every insert|each shard/.test(e) ? `bad` : `none`),
    },
    shards: { label: D(`Shards`), icon: `layers`, fmt: Y },
    perShard: {
      label: D(`Writes per shard`),
      icon: `activity`,
      fmt: (e) => (typeof e == `number` ? `${jm(e)}/s` : e),
    },
    hottest: {
      label: D(`Busiest shard`),
      icon: `gauge`,
      fmt: (e) => O(`{n}% of writes`, { n: Math.round(e) }),
      level: (e) => (e <= 30 ? `good` : e <= 50 ? `warn` : `bad`),
    },
    size: { label: D(`Data per shard`), icon: `database`, fmt: Y },
    nodes: { label: D(`Servers on ring`), icon: `server`, fmt: Y },
    moved: {
      label: D(`Keys moved`),
      icon: `replay`,
      fmt: Y,
      level: (e) => (e === `—` ? `none` : parseInt(e, 10) <= 30 ? `good` : `bad`),
    },
    maxShare: {
      label: D(`Biggest share`),
      icon: `gauge`,
      fmt: (e) => (typeof e == `number` ? `${Math.round(e)}%` : e),
      level: (e) => (typeof e == `number` ? (e <= 34 ? `good` : e <= 40 ? `warn` : `bad`) : `none`),
    },
    consistent: { label: D(`Consistent`), icon: `circleCheck`, fmt: Y, level: Im },
    available: { label: D(`Available`), icon: `heartPulse`, fmt: Y, level: Im },
    conflicts: {
      label: D(`Conflicts`),
      icon: `alert`,
      fmt: Y,
      level: (e) => (e === 0 ? `good` : `bad`),
    },
    trips: {
      label: D(`Round trips / screen`),
      icon: `replay`,
      fmt: Y,
      level: (e) => (e === 1 ? `good` : e > 2 ? `warn` : `none`),
    },
    payload: { label: D(`Downloaded`), icon: `activity`, fmt: Y },
    screenMs: { label: D(`Screen ready`), icon: `timer`, fmt: Nm, level: Pm(200, 500) },
    unused: {
      label: D(`Unused data`),
      icon: `layers`,
      fmt: (e) => (typeof e == `number` ? `${Math.round(e)}%` : e),
      level: (e) => (typeof e == `number` ? (e <= 10 ? `good` : e <= 50 ? `warn` : `bad`) : `none`),
    },
    respond: { label: D(`Upload response`), icon: `timer`, fmt: Nm, level: Pm(300, 2e3) },
    backlog: {
      label: D(`Backlog`),
      icon: `inbox`,
      fmt: (e) => (typeof e == `number` ? O(`{n} jobs`, { n: jm(e) }) : e),
    },
    workers: { label: D(`Workers`), icon: `server`, fmt: Y },
    lost: {
      label: D(`Lost jobs`),
      icon: `alert`,
      fmt: Y,
      level: (e) => (e === 0 ? `good` : `bad`),
    },
    checkout: { label: D(`Checkout time`), icon: `cart`, fmt: Nm, level: Pm(250, 600) },
    knows: { label: D(`Order service calls`), icon: `network`, fmt: Y },
    breaks: {
      label: D(`Email outage breaks checkout`),
      icon: `mail`,
      fmt: Y,
      level: (e) => (e === `no` ? `good` : e === `yes` ? `bad` : `none`),
    },
    subs: { label: D(`Subscribers`), icon: `radio`, fmt: Y },
    delay: {
      label: D(`Message delay`),
      icon: `timer`,
      fmt: Y,
      level: (e) => (e === `never` || (/s$/.test(e) && !/ms$/.test(e)) ? `bad` : `good`),
    },
    rpm: { label: D(`Requests / user / min`), icon: `activity`, fmt: Y },
    wasted: {
      label: D(`Empty responses`),
      icon: `layers`,
      fmt: (e) => (typeof e == `number` ? `${Math.round(e)}%` : e),
      level: (e) => (typeof e == `number` ? (e <= 10 ? `good` : e <= 50 ? `warn` : `bad`) : `none`),
    },
    conns: { label: D(`Open connections`), icon: `network`, fmt: Y },
    avail: {
      label: D(`Availability`),
      icon: `heartPulse`,
      fmt: Y,
      level: (e) =>
        parseFloat(e) >= 99.99
          ? `good`
          : parseFloat(e) >= 99.9
            ? `warn`
            : isNaN(parseFloat(e))
              ? `none`
              : `bad`,
    },
    downtime: { label: D(`Downtime / year`), icon: `clock`, fmt: Y },
    spofs: {
      label: D(`Single points of failure`),
      icon: `alert`,
      fmt: Y,
      level: (e) => (e === 0 ? `good` : typeof e == `number` ? `bad` : `none`),
    },
    survives: {
      label: D(`Survives losing`),
      icon: `shield`,
      fmt: Y,
      level: (e) =>
        e === `nothing` ? `bad` : e === `a zone` || e === `a region` ? `good` : `warn`,
    },
    abuser: {
      label: D(`Runaway script`),
      icon: `bot`,
      fmt: (e) => (typeof e == `number` ? `${jm(e)} ${O(`req/s`)}` : e),
    },
    served: {
      label: D(`Real users served`),
      icon: `users`,
      fmt: (e) => `${Math.round(e)}%`,
      level: (e) => (e >= 99 ? `good` : e >= 90 ? `warn` : `bad`),
    },
    apiCpu: {
      label: D(`API CPU`),
      icon: `cpu`,
      fmt: (e) => `${Math.round(e)}%`,
      level: (e) => (e < 70 ? `good` : e < 88 ? `warn` : `bad`),
    },
    limited: {
      label: D(`Rejected (429)`),
      icon: `ban`,
      fmt: (e) => (typeof e == `number` ? `${jm(e)}/s` : e),
    },
    success: {
      label: D(`Checkouts OK`),
      icon: `cart`,
      fmt: (e) => `${Math.round(e)}%`,
      level: (e) => (e >= 99 ? `good` : e >= 90 ? `warn` : `bad`),
    },
    payLoad: {
      label: D(`Load on payments`),
      icon: `creditCard`,
      fmt: Y,
      level: (e) => (e === `1×` ? `good` : /^[2-9]/.test(e) ? `bad` : `warn`),
    },
    threads: {
      label: D(`Order threads busy`),
      icon: `cpu`,
      fmt: Y,
      level: (e) => (/^200/.test(e) ? `bad` : `good`),
    },
    detect: {
      label: D(`Time to notice`),
      icon: `siren`,
      fmt: Y,
      level: (e) => (/min|s$/.test(e) && !/h/.test(e) ? `good` : e === `—` ? `none` : `bad`),
    },
    locate: {
      label: D(`Time to find cause`),
      icon: `search`,
      fmt: Y,
      level: (e) => (/min/.test(e) ? `good` : e === `—` ? `none` : `bad`),
    },
    signals: { label: D(`Signals`), icon: `activity`, fmt: Y },
    seatsLeft: { label: D(`Seats left`), icon: `ticket`, fmt: Y },
    sold: { label: D(`Tickets sold`), icon: `ticket`, fmt: Y },
    oversold: { label: D(`Oversold`), icon: `alert`, fmt: Y, level: Fm },
    lockWait: { label: D(`Ben waits`), icon: `hourglass`, fmt: Nm, level: Pm(50, 500) },
    deploys: { label: D(`Deploys / day`), icon: `rocket`, fmt: Y },
    blast: {
      label: D(`A bug takes down`),
      icon: `bug`,
      fmt: Y,
      level: (e) => (e === `whole site` ? `bad` : e === `one feature` ? `good` : `none`),
    },
    hops: { label: D(`Network hops / page`), icon: `network`, fmt: Y },
    opsCost: {
      label: D(`Ops overhead`),
      icon: `settings`,
      fmt: Y,
      level: (e) => (e === `low` ? `good` : e === `high` ? `warn` : `none`),
    },
    deadCalls: {
      label: D(`Calls to dead instances`),
      icon: `alert`,
      fmt: (e) => (typeof e == `number` ? `${e}%` : e),
      level: (e) => (e === 0 ? `good` : typeof e == `number` ? `bad` : `none`),
    },
    instances: { label: D(`Payments instances`), icon: `server`, fmt: Y },
    lookup: { label: D(`How orders finds payments`), icon: `signpost`, fmt: Y },
    allOrNothing: { label: D(`Trips all-or-nothing`), icon: `circleCheck`, fmt: Y, level: Im },
    blocked: {
      label: D(`Locks held waiting`),
      icon: `lock`,
      fmt: Y,
      level: (e) => (e === `none` ? `good` : e === `—` ? `none` : `bad`),
    },
    coord: { label: D(`Coordination`), icon: `workflow`, fmt: Y },
    freshness: {
      label: D(`Results age`),
      icon: `clock`,
      fmt: Y,
      level: (e) => (/s$/.test(e) && !/ms/.test(e) ? `good` : /h|day/.test(e) ? `warn` : `none`),
    },
    prodLoad: {
      label: D(`Production DB load`),
      icon: `database`,
      fmt: (e) => `${Math.round(e)}%`,
      level: (e) => (e < 60 ? `good` : e < 85 ? `warn` : `bad`),
    },
    eventsDay: { label: D(`Events / day`), icon: `activity`, fmt: Y },
    exact: { label: D(`Counts exact`), icon: `sigma`, fmt: Y, level: Im },
    leak: {
      label: D(`If the user table leaks`),
      icon: `alert`,
      fmt: Y,
      level: (e) => (e === `nothing usable` ? `good` : e === `all passwords` ? `bad` : `warn`),
    },
    stuffing: {
      label: D(`Stolen-password logins`),
      icon: `bot`,
      fmt: (e) => (typeof e == `number` ? O(`{n}% succeed`, { n: gr(+e.toFixed(2)) }) : e),
      level: (e) => (typeof e == `number` ? (e === 0 ? `good` : e < 1 ? `warn` : `bad`) : `none`),
    },
    mfa: { label: D(`Second factor`), icon: `smartphone`, fmt: Y, level: Im },
    exposed: { label: D(`Others’ data exposed`), icon: `eye`, fmt: Y, level: Fm },
    checks: { label: D(`Permission checks`), icon: `shield`, fmt: Y },
    privilege: {
      label: D(`Service access`),
      icon: `key`,
      fmt: Y,
      level: (e) => (e === `everything` ? `bad` : e === `least privilege` ? `good` : `none`),
    },
    inTransit: { label: D(`Encrypted in transit`), icon: `lock`, fmt: Y, level: Im },
    atRest: { label: D(`Encrypted at rest`), icon: `database`, fmt: Y, level: Im },
    secrets: {
      label: D(`Secrets live in`),
      icon: `key`,
      fmt: Y,
      level: (e) => (e === `source code` ? `bad` : e === `secrets manager` ? `good` : `none`),
    },
    users: { label: D(`Users`), icon: `users`, fmt: jm },
    rps: { label: D(`Requests / s`), icon: `activity`, fmt: jm },
    p95: {
      label: D(`p95 latency`),
      icon: `timer`,
      fmt: (e) => (e == null ? O(`timeout`) : e >= 1e3 ? Mm(e) : `${Math.round(e)} ${O(`ms`)}`),
      level: (e) => (e == null ? `bad` : e <= 250 ? `good` : e <= 800 ? `warn` : `bad`),
    },
    errors: {
      label: D(`Errors`),
      icon: `alert`,
      fmt: (e) => `${Math.round(e)}%`,
      level: (e) => (e < 0.5 ? `good` : e < 5 ? `warn` : `bad`),
    },
    cost: {
      label: D(`Cost / month`),
      icon: `dollar`,
      fmt: (e) =>
        gr(e, {
          style: `currency`,
          currency: `USD`,
          currencyDisplay: `narrowSymbol`,
          maximumFractionDigits: 0,
        }),
    },
    healthy: {
      label: D(`Healthy servers`),
      icon: `heartPulse`,
      fmt: (e) => e,
      level: (e) => (/^(\d+) \/ \1$/.test(e) ? `good` : `warn`),
    },
  },
  Rm = {
    get(e, t) {
      try {
        return JSON.parse(localStorage.getItem(`sdt:${e}`)) ?? t;
      } catch {
        return t;
      }
    },
    set(e, t) {
      try {
        localStorage.setItem(`sdt:${e}`, JSON.stringify(t));
      } catch {}
    },
  },
  X = {
    lessonId: null,
    step: 0,
    done: new Set(Rm.get(`done`, [])),
    open: new Set(),
    metrics: {},
    recent: Rm.get(`recent`, []),
    progressOpen: Rm.get(`progressOpen`, !1),
    reveal: null,
  },
  Z = (e) => document.querySelector(e);
document.querySelector(`#app`).innerHTML = `
  <div class="window">
    <header class="topbar">
      <button class="menu-btn" id="menu-btn" type="button" data-t-aria="Open the course menu" aria-label="Open the course menu" aria-expanded="false" aria-controls="sidebar">${i(`menu`, { size: 19, stroke: 2.2 })}</button>
      <a class="brand" href="#/" aria-label="System Design — home">
        <svg class="logo" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16 10.6V15.4M8.2 19.4V15.4H23.8V18.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
          <rect x="9" y="2.4" width="14" height="8.6" rx="2.6" fill="#fcd4ad" stroke="currentColor" stroke-width="1.8"/>
          <rect x="2" y="19.4" width="12.4" height="9" rx="2.6" fill="#a9c5e8" stroke="currentColor" stroke-width="1.8"/>
          <path d="M18 20.4V27.2A5.8 2.2 0 0 0 29.6 27.2V20.4Z" fill="#cbbae6"/>
          <ellipse cx="23.8" cy="20.4" rx="5.8" ry="2.2" fill="#ece4f6"/>
          <path d="M18 20.4V27.2A5.8 2.2 0 0 0 29.6 27.2V20.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <ellipse cx="23.8" cy="20.4" rx="5.8" ry="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>
        </svg>
        <span class="brand__name">System <span>Design</span></span>
      </a>
      <nav class="nav">
        ${Om.map((e) => `<button class="nav__item ${e.active ? `btn-pop is-active` : ``}" type="button" data-nav="${e.label}">${i(e.icon, { size: 17 })}<span data-t="${e.label}">${e.label}</span></button>`).join(``)}
      </nav>
      <button class="search" id="search-open" type="button" data-t-aria="Search the course" aria-label="Search the course" aria-keyshortcuts="${Dp === `⌘K` ? `Meta+K` : `Control+K`}">
        ${i(`search`, { size: 16, stroke: 2 })}
        <span class="search__hint" data-t="Search lessons & concepts…">Search lessons & concepts…</span>
        <kbd>${Dp}</kbd>
      </button>
      <div class="lang">
        <button class="lang__btn" id="lang-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Language: English">
          ${i(`globe`, { size: 16, stroke: 2 })}<span class="lang__code">EN</span>${i(`chevronDown`, { size: 14, stroke: 2.2, cls: `lang__chev` })}
        </button>
        <div class="lang__menu" id="lang-menu" role="menu" data-t-aria="Language" aria-label="Language" hidden>
          <div class="lang__head" data-t="Language">Language</div>
          <div class="lang__grid">
            ${Em.map(
              (
                e,
              ) => `<button class="lang__item ${e.id === `en` ? `is-on` : ``}" type="button" role="menuitemradio" aria-checked="${e.id === `en`}" data-lang="${e.id}">
                <span class="lang__tile">${e.id === `en` ? i(`check`, { size: 14, stroke: 3 }) : e.code}</span>
                <span class="lang__names"><b dir="auto" lang="${e.id}">${e.native}</b><span data-t="${e.english}">${e.english}</span></span>
              </button>`,
            ).join(``)}
          </div>
        </div>
      </div>
      <button class="theme-btn" id="theme-btn" type="button"></button>
      <a class="credit" href="https://x.com/DilumSanjaya" target="_blank" rel="noopener" data-t-title="Dilum Sanjaya on X" title="Dilum Sanjaya on X">
        <span class="credit__x" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 24 24"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></span>
        <span class="credit__text"><small data-t="designed by">designed by</small><b><span>@DilumSanjaya</span></b></span>
      </a>
    </header>

    <div class="body">
      <aside class="sidebar" id="sidebar" data-t-aria="Course" aria-label="Course">
        <nav class="drawer-nav">
          ${Om.map((e) => `<button class="nav__item ${e.active ? `btn-pop is-active` : ``}" type="button" data-nav="${e.label}">${i(e.icon, { size: 16 })}<span data-t="${e.label}">${e.label}</span></button>`).join(``)}
        </nav>
        <div class="tree-root">
          <svg width="22" height="18" viewBox="0 0 20 16" aria-hidden="true"><path d="M1 3a2 2 0 0 1 2-2h4.3l2 2.2H17a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2Z" fill="currentColor"/></svg>
          <span data-t="Course">Course</span>
          <span class="tree-root__meta" data-t="{n} lessons" data-n="${c.length}">${c.length} lessons</span>
          <button class="drawer-close" id="drawer-close" type="button" data-t-aria="Close the course menu" aria-label="Close the course menu">${i(`close`, { size: 18, stroke: 2.2 })}</button>
        </div>
        <nav class="course" id="course"></nav>
        <section class="card progress" id="progress"></section>
        <div class="drawer-foot">
          <button class="lang__btn" id="lang-btn-2" type="button" aria-haspopup="menu" aria-label="Language: English">${i(`globe`, { size: 16, stroke: 2 })}<span class="lang__code">English</span></button>
          <a class="credit" href="https://x.com/DilumSanjaya" target="_blank" rel="noopener" data-t-title="Dilum Sanjaya on X" title="Dilum Sanjaya on X">
        <span class="credit__x" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 24 24"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></span>
        <span class="credit__text"><small data-t="designed by">designed by</small><b><span>@DilumSanjaya</span></b></span>
      </a>
        </div>
      </aside>
      <div class="drawer-backdrop" id="drawer-backdrop"></div>

      <main class="sheet">
        <div class="lesson-head" id="head"></div>
        <section class="card stage">
          <div class="stage__hud" id="hud"></div>
          <div class="stage__tools">
            <button class="tool tool--fit" id="fit" data-t-title="Back to the whole diagram (0)" title="Back to the whole diagram (0)" hidden>${i(`zoomOut`, { size: 15, stroke: 2 })}<span data-t="Fit">Fit</span></button>
            <button class="tool" id="replay" data-t-title="Replay this step (R)" title="Replay this step (R)">${i(`replay`, { size: 15, stroke: 2 })}<span data-t="Replay">Replay</span></button>
            <button class="tool" id="pause" title="Pause traffic (Space)">${i(`pause`, { size: 15, stroke: 2 })}<span>Pause</span></button>
            <button class="tool tool--expand" id="expand" title="Full screen" aria-label="Show the diagram full screen">${i(`expand`, { size: 15, stroke: 2 })}</button>
          </div>
          <div class="stage__canvas" id="canvas"></div>
          <div class="stage__legend" id="legend"></div>
        </section>
        <section class="card timeline" id="timeline"></section>
      </main>

      <aside class="rail">
        <section class="card guide" id="guide"></section>
        <section class="card goals" id="goals"></section>
      </aside>
    </div>

  </div>`;
var Q = new ap(Z(`#canvas`));
Q.onCards = (e) => document.documentElement.classList.toggle(`cards-inline`, !e);
var zm = (e) =>
  X.done.has(e)
    ? i(`circleCheck`, { size: 16, stroke: 2, cls: `lesson__mark lesson__mark--done` })
    : i(nf[e] ? `file` : `lock`, { size: 15, stroke: 1.5, cls: `lesson__mark` });
function Bm() {
  ((Z(`#course`).innerHTML = s
    .map(
      (e) => `
      <section class="mod" data-mod="${e.id}">
        <button class="mod__head" data-mod="${e.id}" aria-expanded="false">
          ${i(`chevronRight`, { size: 15, stroke: 2.2, cls: `mod__chev` })}
          ${r(e.color)}
          <span class="mod__title" title="${O(e.title)}">${e.num}. ${O(e.title)}</span>
          <span class="mod__count"></span>
        </button>
        <div class="mod__body"><div class="mod__clip">
          <ul class="mod__lessons">
            ${e.lessons
              .map((e) => {
                let t = !!nf[e.id],
                  n = `<span class="lesson__markbox">${zm(e.id)}</span><span class="lesson__title" title="${O(e.title)}">${O(e.title)}</span>`;
                return `<li class="lesson ${t ? `` : `is-soon`}" data-lesson="${e.id}">
                  ${t ? `<a href="#/${e.id}/1">${n}</a>` : `<span title="${O(`Coming soon`)}">${n}</span>`}
                </li>`;
              })
              .join(``)}
          </ul>
        </div></div>
      </section>`,
    )
    .join(``)),
    (Z(`#progress`).innerHTML = `
    <button class="progress__head" type="button" aria-expanded="false" aria-controls="progress-body">
      <span class="eyebrow">${O(`Progress`)}</span>
      <span class="progress__pct"></span>
      ${i(`chevronRight`, { size: 14, stroke: 2.2, cls: `progress__chev` })}
    </button>
    <div class="progress__body" id="progress-body"><div class="progress__clip">
      <div class="bar"><span></span></div>
      <ul class="progress__list">
        ${s.map((e) => `<li data-mod="${e.id}"><span class="check">${i(`check`, { size: 11, stroke: 3 })}</span><span class="progress__label">${O(e.title)}</span><span class="progress__count"></span></li>`).join(``)}
      </ul>
    </div></div>`));
}
function Vm() {
  for (let e of s) {
    let t = Z(`#course .mod[data-mod="${e.id}"]`),
      n = X.open.has(e.id);
    (t.classList.toggle(`is-open`, n),
      t.querySelector(`.mod__head`).setAttribute(`aria-expanded`, n));
    let r = e.lessons.filter((e) => X.done.has(e.id)).length;
    t.querySelector(`.mod__count`).textContent = `${r}/${e.lessons.length}`;
    for (let n of e.lessons) {
      let e = t.querySelector(`.lesson[data-lesson="${n.id}"]`),
        r = n.id === X.lessonId;
      (e.classList.toggle(`is-current`, r), e.querySelector(`a`)?.classList.toggle(`btn-pop`, r));
      let i = X.done.has(n.id);
      e.dataset.done !== String(i) &&
        ((e.dataset.done = i), (e.querySelector(`.lesson__markbox`).innerHTML = zm(n.id)));
    }
  }
  let e = c.length,
    t = Math.round((X.done.size / e) * 100),
    n = Z(`#progress`);
  (n.classList.toggle(`is-open`, X.progressOpen),
    n.querySelector(`.progress__head`).setAttribute(`aria-expanded`, X.progressOpen),
    (n.querySelector(`.progress__pct`).textContent = `${X.done.size} / ${e}`),
    (n.querySelector(`.bar span`).style.width = `${Math.max(t, 2)}%`));
  for (let e of s) {
    let t = n.querySelector(`li[data-mod="${e.id}"]`),
      r = e.lessons.filter((e) => X.done.has(e.id)).length,
      i = r === e.lessons.length,
      a = t.querySelector(`.check`);
    (a.classList.toggle(`is-on`, i),
      a.classList.toggle(`is-part`, !i && r > 0),
      (t.querySelector(`.progress__count`).textContent = `${r}/${e.lessons.length}`));
  }
}
function Hm(e, t) {
  let n = 0;
  for (let r = e; r && r !== t; r = r.offsetParent) n += r.offsetTop;
  return n;
}
var Um = 0;
function Wm(e, t = !1) {
  let n = l(e);
  if (!n) return;
  (!X.open.has(n.module.id) || X.open.size > 1) && ((X.open = new Set([n.module.id])), Vm());
  let r = Z(`#course`),
    i = r.querySelector(`.lesson[data-lesson="${e}"]`);
  cancelAnimationFrame(Um);
  let a = r.scrollTop,
    o = performance.now(),
    s = () => {
      let e = Hm(i, r),
        n = r.scrollHeight - r.clientHeight,
        o = (e) => Math.max(0, Math.min(n, e));
      return t
        ? o(e - 6)
        : e >= a + 4 && e + i.offsetHeight <= a + r.clientHeight - 4
          ? a
          : o(e < a ? e - 6 : e + i.offsetHeight - r.clientHeight + 10);
    },
    c = (e) => {
      let t = Math.min(1, (e - o) / 640),
        n = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      ((r.scrollTop = a + (s() - a) * n), t < 1 && (Um = requestAnimationFrame(c)));
    };
  Um = requestAnimationFrame(c);
}
(Bm(),
  Z(`#course`).addEventListener(`click`, (e) => {
    let t = e.target.closest(`.mod__head`);
    if (!t) return;
    let n = t.dataset.mod;
    ((X.open = X.open.has(n) ? new Set() : new Set([n])), Vm());
  }),
  Z(`#course`).addEventListener(`wheel`, () => cancelAnimationFrame(Um), { passive: !0 }),
  Z(`#progress`).addEventListener(`click`, (e) => {
    e.target.closest(`.progress__head`) &&
      ((X.progressOpen = !X.progressOpen), Rm.set(`progressOpen`, X.progressOpen), Vm());
  }));
var Gm = { beginner: D(`Beginner`), intermediate: D(`Intermediate`), advanced: D(`Advanced`) };
function Km(e, t) {
  ((Z(`#head`).innerHTML = `
    <div class="crumb">${t.module.num}. ${O(t.module.title)} <span>/</span> ${O(`Lesson {n} of {total}`, { n: t.index, total: t.of })}</div>
    <div class="lesson-head__row">
      <h1 class="title">${e.title}</h1>
      <div class="tags">
        <span class="tag tag--sand">${i(`clock`, { size: 13, stroke: 2 })}${O(`{n} min`, { n: e.minutes })}</span>
        <span class="tag tag--mint">${i(`signal`, { size: 13, stroke: 2 })}${O(Gm[e.level] || e.level)}</span>
        <span class="tag tag--violet">${i(`listOrdered`, { size: 13, stroke: 2 })}${O(`{n} steps`, { n: e.steps.length })}</span>
      </div>
    </div>
    <p class="subtitle" title="${e.summary.replace(/"/g, `&quot;`)}">${e.summary}</p>`),
    Jm());
}
function qm(e, t) {
  if (!e) return;
  e.style.fontSize = ``;
  let n = e.scrollWidth / e.clientWidth;
  if (!(n > 1.002)) return;
  let r = parseFloat(getComputedStyle(e).fontSize);
  e.style.fontSize = `${(r * Math.max(t, 1 / n) - 0.05).toFixed(2)}px`;
}
function Jm() {
  (qm(Z(`#head .title`), 0.8), qm(Z(`#head .subtitle`), 0.88));
}
function Ym(e) {
  Z(`#legend`).innerHTML = e.legend
    .map((e) => {
      let [t, n] = Array.isArray(e) ? e : [e, O(Am[e][1])];
      return `<span>${Am[t][0]}${n}</span>`;
    })
    .join(``);
}
function Xm(e) {
  let t = e.steps.length;
  Z(`#timeline`).innerHTML = `
    <div class="timeline__head">
      <span class="eyebrow">${O(`In this lesson`)}</span>
      <span class="timeline__count" id="tl-count"></span>
    </div>
    <div class="timeline__track" style="--n:${t}">
      <div class="timeline__rail"><span id="tl-fill"></span></div>
      <ol class="timeline__steps">
        ${e.steps
          .map(
            (e, t) => `<li><button data-step="${t}" title="${e.title}">
              <span class="timeline__dot chapter-dot--${o[e.chapter].tone}">${t + 1}</span>
              <span class="timeline__label">${e.short}</span>
            </button></li>`,
          )
          .join(``)}
      </ol>
    </div>`;
}
function Zm(e, t) {
  let n = e.steps.length;
  (document.querySelectorAll(`.timeline__steps li`).forEach((e, n) => {
    (e.classList.toggle(`is-current`, n === t), e.classList.toggle(`is-done`, n < t));
  }),
    (Z(`#tl-fill`).style.width = `${(t / (n - 1)) * 100}%`),
    (Z(`#tl-count`).textContent = O(`Step {n} of {total}`, { n: t + 1, total: n })),
    Qm());
}
function Qm() {
  let e = document.querySelector(`.timeline__steps`);
  if (!e) return;
  let t = e.clientWidth / Math.max(1, e.children.length);
  Z(`#timeline`).classList.toggle(`is-tight`, t > 0 && t < 70);
}
Z(`#timeline`).addEventListener(`click`, (e) => {
  let t = e.target.closest(`[data-step]`);
  t && sh(X.lessonId, +t.dataset.step);
});
var $m = (e) => {
  let t = e.startsWith(`+`) ? `add` : e.startsWith(`−`) || e.startsWith(`-`) ? `del` : `mod`;
  return `<li class="chg chg--${t}"><b>${{ add: `+`, del: `−`, mod: `~` }[t]}</b><span>${e.slice(2)}</span></li>`;
};
function eh(e) {
  let t = Object.values(e.scene.entities).find((e) => e.type === `panel`);
  if (!t) return ``;
  let n = Oi.panel({ ...ki.panel, ...t, x: 0, y: 0, z: 0, dx: 0, dy: 0, lift: 0 }),
    { w: r, h: i } = n.size;
  return `<svg viewBox="-2 -2 ${r + 6} ${i + 8}" width="${r + 6}" role="img" aria-label="${t.title.replace(/"/g, `&quot;`)}">${pf(n.over)}</svg>`;
}
var th = (e) => {
    let t = eh(e);
    return t ? `<figure class="guide__card">${t}</figure>` : ``;
  },
  nh = /^<(p|ul|ol|table|div|figure|pre|h\d)\b/i;
function rh(e, t) {
  let n = e.steps[t],
    r = e.steps.length,
    a = o[n.chapter],
    s = t === r - 1,
    c = u(e.id),
    l = c && nf[c.id],
    d,
    f = c ? O(c.title) : ``;
  d = s
    ? l
      ? f.length <= 15
        ? O(`Next: {title}`, { title: f })
        : f
      : O(`Finish lesson`)
    : O(`Next: {title}`, { title: e.steps[t + 1].short });
  let p = n.callout
      ? `<div class="callout callout--${n.callout.kind}">
         <div class="callout__icon">${i(km[n.callout.kind].icon, { size: 16, stroke: 2 })}</div>
         <div><div class="callout__title">${O(km[n.callout.kind].title)}</div><p>${n.callout.text}</p></div>
       </div>`
      : ``,
    m = n.changes?.length
      ? `<div class="changes"><div class="eyebrow">${O(`What changed`)}</div><ul>${n.changes.map($m).join(``)}</ul></div>`
      : ``;
  ((Z(`#guide`).innerHTML = `
    <div class="guide__meta">
      <span class="eyebrow">${O(`Step {n} / {total}`, { n: t + 1, total: r })}</span>
      <div class="guide__meta-end"><span class="chapter chapter--${a.tone}">${O(a.label)}</span></div>
    </div>
    <div class="guide__content">
      <h2 class="guide__title">${n.title}</h2>
      <div class="guide__body">${n.body.map((e) => (nh.test(e) ? e : `<p>${e}</p>`)).join(``)}</div>
      ${th(n)}
      ${p}
      ${m}
    </div>
    <div class="guide__nav">
      <button class="btn-ghost" id="back" ${t === 0 ? `disabled` : ``}>${i(`arrowLeft`, { size: 15, stroke: 2.2 })}${O(`Back`)}</button>
      <button class="btn-pop btn-next${d.length > 21 ? ` is-long` : ``}" id="next" title="${s && l ? O(`Next lesson: {title}`, { title: f }) : ``}"><span class="btn-next__label">${d}</span>${i(s && !l ? `check` : `arrowRight`, { size: 15, stroke: 2.2 })}</button>
    </div>
    <div class="guide__hint">${i(`keyboard`, { size: 14, stroke: 1.8 })}<span><kbd>←</kbd> <kbd>→</kbd> ${O(`step`)} · <kbd>R</kbd> ${O(`replay`)} · <kbd>Space</kbd> ${O(`pause`)}</span></div>`),
    rm && Z(`#guide .guide__meta-end`).append(Ah),
    (Z(`#back`).onclick = () => sh(e.id, t - 1)),
    (Z(`#next`).onclick = () => {
      s ? l && sh(c.id, 0) : sh(e.id, t + 1);
    }),
    Z(`#goals`)
      .querySelectorAll(`li`)
      .forEach((n, r) => {
        let i = t >= e.goals[r].step;
        (n.classList.toggle(`is-hit`, i), n.querySelector(`.check`).classList.toggle(`is-on`, i));
      }));
}
function ih(e) {
  Z(`#goals`).innerHTML = `
    <div class="eyebrow">${O(`You’ll learn`)}</div>
    <ul>${e.goals.map((e) => `<li><span class="check">${i(`check`, { size: 11, stroke: 3 })}</span>${e.text}</li>`).join(``)}</ul>`;
}
function ah(e) {
  ((Z(`#hud`).innerHTML = e.metrics
    .map(
      (e) => `<div class="chip" data-k="${e}">
        <span class="chip__label">${i(Lm[e].icon, { size: 12, stroke: 2 })}${O(Lm[e].label)}</span>
        <span class="chip__value">–</span>
      </div>`,
    )
    .join(``)),
    (X.metrics = {}));
}
function oh(e, t, n) {
  for (let r of e.metrics) {
    let i = Lm[r],
      a = (t) => (typeof t == `string` && e.t ? e.t(t) : i.fmt(t)),
      o = document.querySelector(`.chip[data-k="${r}"]`),
      s = o.querySelector(`.chip__value`),
      c = t[r],
      l = X.metrics[r];
    ((o.dataset.level = i.level ? i.level(c) : `none`), (X.metrics[r] = c));
    let u = l !== void 0 && l !== c;
    u && n && (o.classList.remove(`is-changed`), o.offsetWidth, o.classList.add(`is-changed`));
    let d = o.offsetWidth;
    ((o.style.width = ``), (s.textContent = a(c)));
    let f = o.offsetWidth,
      p = n && typeof l == `number` && typeof c == `number` && l !== c;
    if (!n || (!p && d === f)) {
      o.anim = null;
      continue;
    }
    (p
      ? (s.textContent = a(l))
      : u && (s.classList.remove(`is-swap`), s.offsetWidth, s.classList.add(`is-swap`)),
      (o.style.width = `${d}px`));
    let m = (o.anim = {}),
      h = performance.now(),
      g = p ? 900 : 480,
      _ = (e) => {
        if (o.anim !== m) return;
        let t = Math.min(1, (e - h) / g),
          n = 1 - (1 - t) ** 3;
        (p && (s.textContent = i.fmt(l + (c - l) * n)),
          (o.style.width = `${d + (f - d) * n}px`),
          t < 1 ? requestAnimationFrame(_) : ((o.style.width = ``), (s.textContent = a(c))));
      };
    requestAnimationFrame(_);
  }
}
function sh(e, t) {
  location.hash = `#/${e}/${t + 1}`;
}
function ch() {
  let e = /^#\/([\w-]+)\/(\d+)$/.exec(location.hash);
  if (e && nf[e[1]]) {
    let t = nf[e[1]].steps.length;
    return { lessonId: e[1], step: Math.max(0, Math.min(t - 1, e[2] - 1)) };
  }
  let t = Rm.get(`last`, null);
  return t && nf[t.lessonId] ? t : { lessonId: c.find((e) => nf[e.id]).id, step: 0 };
}
var lh = null,
  uh = (e) => Ep(nf[e]);
function dh() {
  let { lessonId: e, step: t } = ch();
  if (!Cp(e)) {
    wp(e).then(() => ch().lessonId === e && dh());
    return;
  }
  let n = uh(e),
    r = l(e),
    i = e !== X.lessonId,
    a = X.step;
  if (
    ((X.lessonId = e),
    (X.step = t),
    Rm.set(`last`, { lessonId: e, step: t }),
    (X.recent = [{ lessonId: e, step: t }, ...X.recent.filter((t) => t.lessonId !== e)].slice(
      0,
      8,
    )),
    Rm.set(`recent`, X.recent),
    t === n.steps.length - 1 && !X.done.has(e) && (X.done.add(e), Rm.set(`done`, [...X.done])),
    i)
  ) {
    ((X.open = new Set([r.module.id])), Km(n, r), Ym(n), Xm(n), ah(n), ih(n));
    for (let e of [Z(`#head`), Z(`#legend`), Z(`#timeline`), Z(`#hud`), Z(`#goals`)])
      (e.classList.remove(`is-fresh`), e.offsetWidth, e.classList.add(`is-fresh`));
    (Q.clear(), Q.frame(n.steps.map((e) => e.scene)), Q.goTo(n.steps[t].scene));
  } else t !== a && Q.goTo(n.steps[t].scene);
  (Vm(), X.reveal ? Wm(e, !0) : i && Wm(e, !1), (X.reveal = null), Zm(n, t));
  let o = (i || a == null ? 0 : Math.sign(t - a)) * (cr() ? -1 : 1),
    s = o ? Z(`#guide .guide__content`) : null,
    c = s && s.cloneNode(!0),
    d = s && {
      top: s.offsetTop,
      left: s.offsetLeft,
      width: s.offsetWidth,
      height: s.offsetHeight,
      scroll: s.scrollTop,
    };
  (Z(`#guide`)
    .querySelectorAll(`.guide__ghost`)
    .forEach((e) => e.remove()),
    rh(n, t),
    oh(n, n.steps[t].metrics, !i));
  let f = Z(`#guide .guide__content`);
  (f.style.setProperty(`--slide`, `${o * 36}px`),
    f.classList.remove(`is-in`),
    f.offsetWidth,
    f.classList.add(`is-in`));
  let p = Z(`#guide .guide__meta .chapter`);
  (o &&
    lh !== n.steps[t].chapter &&
    (p.style.setProperty(`--slide`, `${o * 14}px`), p.classList.add(`is-in`)),
    (lh = n.steps[t].chapter),
    c &&
      ((c.className = `guide__content guide__ghost`),
      (c.style.cssText = `top:${d.top}px;left:${d.left}px;width:${d.width}px;height:${d.height}px;--slide:${-o * 36}px`),
      Z(`#guide`).appendChild(c),
      (c.scrollTop = d.scroll),
      setTimeout(() => c.remove(), 200)),
    (document.title = `${n.title} · System Design`),
    Wh());
  let m = u(e);
  m && nf[m.id] && wp(m.id);
}
window.addEventListener(`hashchange`, dh);
var fh = {
    Practice: D(`Practice is coming soon`),
    "Design Lab": D(`Design Lab is coming soon`),
    Cheatsheets: D(`Cheatsheets are coming soon`),
  },
  ph = document.createElement(`div`);
((ph.className = `toast`),
  ph.setAttribute(`role`, `status`),
  ph.setAttribute(`aria-live`, `polite`),
  document.querySelector(`.window`).appendChild(ph));
var mh = 0;
function hh(e, t = `sparkles`) {
  ((ph.innerHTML = `
    <span class="toast__icon">${i(t, { size: 16, stroke: 2 })}</span>
    <b class="toast__text">${e}</b>`),
    ph.classList.remove(`is-on`),
    ph.offsetWidth,
    ph.classList.add(`is-on`),
    clearTimeout(mh),
    (mh = setTimeout(() => ph.classList.remove(`is-on`), 2800)));
}
document.querySelector(`.topbar`).addEventListener(`click`, (e) => {
  let t = e.target.closest(`[data-nav]`);
  if (!t || t.classList.contains(`is-active`)) return;
  let n = Om.find((e) => e.label === t.dataset.nav);
  hh(
    O(fh[t.dataset.nav] || D(`{name} is coming soon`), { name: O(t.dataset.nav) }),
    n ? n.icon : `sparkles`,
  );
});
var gh = Z(`#theme-btn`),
  _h = () => (document.documentElement.dataset.theme === `dark` ? `dark` : `light`);
function vh() {
  let e = _h() === `dark`;
  ((gh.innerHTML = i(e ? `sun` : `moon`, { size: 16, stroke: 2 })),
    gh.setAttribute(`aria-label`, O(e ? `Switch to light theme` : `Switch to dark theme`)),
    (gh.title = O(e ? `Light theme` : `Dark theme`)));
}
function yh() {
  document
    .querySelector(`meta[name="theme-color"]`)
    ?.setAttribute(
      `content`,
      getComputedStyle(document.documentElement).getPropertyValue(`--paper`).trim() || `#f4ebe0`,
    );
}
function bh(e) {
  ((document.documentElement.dataset.theme = e), Rm.set(`theme`, e), yh(), Q.retheme(), vh());
  let t = Z(`#guide .guide__content .guide__card`);
  t && (t.innerHTML = eh(uh(X.lessonId).steps[X.step]));
}
(gh.addEventListener(`click`, () => {
  let e = _h() === `dark` ? `light` : `dark`,
    t = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;
  if (!document.startViewTransition || t) {
    bh(e);
    return;
  }
  let n = gh.getBoundingClientRect(),
    r = n.left + n.width / 2,
    i = n.top + n.height / 2,
    a = Math.hypot(Math.max(r, innerWidth - r), Math.max(i, innerHeight - i));
  document
    .startViewTransition(() => bh(e))
    .ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${r}px ${i}px)`, `circle(${a}px at ${r}px ${i}px)`] },
        {
          duration: 560,
          easing: `cubic-bezier(0.4, 0, 0.2, 1)`,
          pseudoElement: `::view-transition-new(root)`,
        },
      );
    });
}),
  vh(),
  yh());
var xh = Z(`#lang-btn`),
  Sh = Z(`#lang-menu`),
  Ch = 0;
function wh(e) {
  (e !== !Sh.hidden || Sh.classList.contains(`is-leaving`)) &&
    (clearTimeout(Ch),
    xh.setAttribute(`aria-expanded`, e),
    xh.classList.toggle(`is-open`, e),
    e
      ? ((Sh.hidden = !1),
        Sh.classList.remove(`is-leaving`),
        Sh.offsetWidth,
        Sh.classList.add(`is-open`),
        Sh.querySelector(`.lang__item.is-on`)?.focus({ preventScroll: !0 }))
      : (Sh.classList.remove(`is-open`),
        Sh.classList.add(`is-leaving`),
        (Ch = setTimeout(() => {
          ((Sh.hidden = !0), Sh.classList.remove(`is-leaving`));
        }, 160))));
}
var Th = () => !Sh.hidden && Sh.classList.contains(`is-open`);
(xh.addEventListener(`click`, () => wh(!Th())),
  Sh.addEventListener(`click`, (e) => {
    let t = e.target.closest(`[data-lang]`);
    if (!t) return;
    (wh(!1), xh.focus({ preventScroll: !0 }));
    let n = t.dataset.lang;
    yp.includes(n) ? ug(n) : hh(O(`{name} is coming soon`, { name: Dm(n).native }), `globe`);
  }),
  document.addEventListener(`mousedown`, (e) => {
    Th() && !e.target.closest(`.lang, #lang-btn-2`) && wh(!1);
  }),
  Sh.addEventListener(`keydown`, (e) => {
    let t = [...Sh.querySelectorAll(`.lang__item`)],
      n = t.indexOf(document.activeElement),
      r = Math.ceil(t.length / 2),
      i = cr() ? -r : r,
      a = { ArrowDown: n + 1, ArrowUp: n - 1, ArrowRight: n + i, ArrowLeft: n - i }[e.key];
    if (e.key === `Escape`) (wh(!1), xh.focus({ preventScroll: !0 }));
    else if (a !== void 0 && t[a]) t[a].focus();
    else return;
    (e.preventDefault(), e.stopPropagation());
  }));
var Eh = tm({
  getState: () => ({ lessonId: X.lessonId, step: X.step, done: X.done, recent: X.recent }),
  lessons: () => c.filter((e) => nf[e.id]).map((e) => ({ meta: e, lesson: uh(e.id) })),
  prepare: () => Tp(c.filter((e) => nf[e.id]).map((e) => e.id)),
  onPick: (e, t) => {
    location.hash === t ? Wm(e, !0) : (X.reveal = e);
  },
});
Z(`#search-open`).addEventListener(`click`, () => Eh.open());
function Dh() {
  let e = uh(X.lessonId),
    t = e.steps[X.step - 1];
  (t ? Q.goTo(t.scene, { instant: !0 }) : Q.clear(), Q.goTo(e.steps[X.step].scene));
}
function Oh() {
  ((Z(`#pause`).innerHTML = Q.paused
    ? `${i(`play`, { size: 15, stroke: 2 })}<span>${O(`Play`)}</span>`
    : `${i(`pause`, { size: 15, stroke: 2 })}<span>${O(`Pause`)}</span>`),
    (Z(`#pause`).title = Q.paused ? O(`Play traffic (Space)`) : O(`Pause traffic (Space)`)),
    Z(`#pause`).classList.toggle(`is-on`, Q.paused));
}
function kh() {
  ((Q.paused = !Q.paused), Oh());
}
((Z(`#replay`).onclick = Dh),
  (Z(`#pause`).onclick = kh),
  window.addEventListener(`keydown`, (e) => {
    if (Eh.isOpen() || Th() || Xh() || e.target.closest(`input, textarea`)) return;
    let t = nf[X.lessonId],
      [n, r] = cr() ? [`ArrowLeft`, `ArrowRight`] : [`ArrowRight`, `ArrowLeft`];
    e.key === n && X.step < t.steps.length - 1
      ? sh(X.lessonId, X.step + 1)
      : e.key === r && X.step > 0
        ? sh(X.lessonId, X.step - 1)
        : e.key === `r` || e.key === `R`
          ? Dh()
          : e.key === `0`
            ? Q.fit()
            : e.key === ` ` && (e.preventDefault(), kh());
  }));
var $ = { on: rm && Rm.get(`speak`, !1), voices: Rm.get(`voices`, {}), waiting: !1 },
  Ah = document.createElement(`div`);
((Ah.className = `speak`),
  (Ah.innerHTML = `
  <button class="speak__btn" type="button" aria-pressed="false"></button>
  <button class="speak__voice" type="button" aria-haspopup="menu" aria-expanded="false"></button>
  <div class="voice-menu" role="menu" hidden></div>`));
var jh = Ah.querySelector(`.speak__btn`),
  Mh = Ah.querySelector(`.speak__voice`),
  Nh = Ah.querySelector(`.voice-menu`),
  Ph = (e) =>
    String(e).replace(
      /[&<>"]/g,
      (e) => ({ "&": `&amp;`, "<": `&lt;`, ">": `&gt;`, '"': `&quot;` })[e],
    ),
  Fh = () => or().split(`-u-`)[0],
  Ih = () => dm(ar(), Fh());
function Lh() {
  let e = Ih();
  return e.find((e) => e.voiceURI === $.voices[ar()]) || e[0] || null;
}
var Rh = ``;
function zh() {
  if (!rm) return;
  let e = $.on && vm() === `paused`;
  (Ah.classList.toggle(`is-paused`, e), Z(`#guide`).classList.toggle(`is-paused`, e));
  let t = `${$.on}|${e}|${ar()}`;
  if (t === Rh) return;
  Rh = t;
  let n = $.on ? O(`Stop reading`) : O(`Read aloud`);
  ((jh.innerHTML = i(e ? `pause` : $.on ? `volume2` : `volumeX`, { size: 14, stroke: 2 })),
    jh.classList.toggle(`is-on`, $.on),
    jh.setAttribute(`aria-pressed`, $.on),
    jh.setAttribute(`aria-label`, n),
    (jh.title = `${n} (L) · ${O(`Pause`)} / ${O(`Play`)} (P)`),
    (Mh.innerHTML = i(`chevronDown`, { size: 12, stroke: 2.4, cls: `speak__chev` })),
    Mh.setAttribute(`aria-label`, O(`Choose a voice`)),
    (Mh.title = O(`Choose a voice`)),
    Nh.setAttribute(`aria-label`, O(`Voice`)));
}
var Bh = null;
function Vh(e) {
  if (
    (Bh?.classList.remove(`is-reading`),
    (Bh = e && e.isConnected ? e : null),
    Ah.classList.toggle(`is-speaking`, !!e),
    !Bh)
  )
    return;
  Bh.classList.add(`is-reading`);
  let t = Z(`#guide .guide__content`);
  if (!t || t.scrollHeight <= t.clientHeight + 1) return;
  let n = Hm(Bh, t),
    r = Bh.offsetHeight;
  if (n < t.scrollTop || n + r > t.scrollTop + t.clientHeight) {
    let e = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;
    t.scrollTo({ top: Math.max(0, n - 18), behavior: e ? `auto` : `smooth` });
  }
}
function Hh() {
  let e = Z(`#guide .guide__content`);
  if (!e) return [];
  let t = (e) => {
      if (!e) return ``;
      let t = e.cloneNode(!0);
      return (
        t.querySelectorAll(`sup`).forEach((e) => e.remove()),
        t.querySelectorAll(`br`).forEach((e) => e.replaceWith(` `)),
        t.textContent.trim()
      );
    },
    n = [],
    r = e.querySelector(`.guide__title`);
  r && n.push({ el: r, text: t(r) });
  for (let r of e.querySelectorAll(`.guide__body > *`))
    if (r.matches(`ul, ol`)) for (let e of r.children) n.push({ el: e, text: t(e) });
    else if (r.matches(`table`))
      for (let e of r.querySelectorAll(`tbody tr`)) {
        let [r, ...i] = [...e.cells].map(t).filter(Boolean);
        r && n.push({ el: e, text: i.length ? `${r}: ${i.join(`, `)}` : r });
      }
    else n.push({ el: r, text: t(r) });
  let i = e.querySelector(`.callout`);
  return (
    i &&
      n.push({
        el: i,
        text: `${t(i.querySelector(`.callout__title`))}: ${t(i.querySelector(`p`))}`,
      }),
    n.filter((e) => e.text)
  );
}
function Uh(e, t = !1) {
  (t && Vh(null),
    xm(
      e,
      {
        voice: Lh(),
        lang: Fh(),
        onBlock: (e) => {
          (Vh(e), zh());
        },
        onDone: () => {
          (Vh(null), zh());
        },
        onBlocked: Kh,
      },
      { paused: t },
    ),
    zh());
}
function Wh() {
  $.on && !$.waiting && Uh(Hh(), vm() === `paused`);
}
function Gh() {
  if (!$.on) return qh(!0);
  let e = vm();
  (e === `speaking` ? Cm() : e === `paused` ? wm() : Uh(Hh()), zh());
}
function Kh() {
  if ((Vh(null), $.waiting)) return;
  $.waiting = !0;
  let e = (t) => {
    (window.removeEventListener(`click`, e, !0),
      window.removeEventListener(`keydown`, e, !0),
      ($.waiting = !1),
      (t.type === `keydown` && [`KeyL`, `KeyP`].includes(t.code)) || Wh());
  };
  (window.addEventListener(`click`, e, !0), window.addEventListener(`keydown`, e, !0));
}
function qh(e) {
  (($.on = e), Rm.set(`speak`, e), zh(), e ? (($.waiting = !1), Wh()) : (bm(), Vh(null), zh()));
}
function Jh() {
  let e = Ih(),
    t = Lh(),
    n = e
      .map((e) => {
        let n = e === t;
        return `<button class="voice-menu__item ${n ? `is-on` : ``}" type="button" role="menuitemradio" aria-checked="${n}" data-voice="${Ph(e.voiceURI)}">
        <span class="voice-menu__tick">${n ? i(`check`, { size: 12, stroke: 3 }) : ``}</span>
        <span class="voice-menu__names"><b dir="auto">${Ph(e.name)}</b><span>${Ph(e.lang.replace(/_/g, `-`))} · ${e.localService ? O(`on this device`) : O(`online`)}</span></span>
      </button>`;
      })
      .join(``);
  Nh.innerHTML = `
    <div class="voice-menu__head">${O(`Voice`)}</div>
    ${e.length ? `<div class="voice-menu__list">${n}</div>` : `<p class="voice-menu__empty">${O(`No voice for this language on this device. Your system’s speech settings can add one.`)}</p>`}
    ${e.some((e) => !e.localService) ? `<p class="voice-menu__note">${O(`Online voices send the text to their provider to be spoken.`)}</p>` : ``}`;
}
var Yh = 0,
  Xh = () => !Nh.hidden && Nh.classList.contains(`is-open`);
function Zh(e) {
  e !== Xh() &&
    (clearTimeout(Yh),
    Mh.setAttribute(`aria-expanded`, e),
    e
      ? (Jh(),
        (Nh.hidden = !1),
        Nh.classList.remove(`is-leaving`),
        Nh.offsetWidth,
        Nh.classList.add(`is-open`),
        (
          Nh.querySelector(`.voice-menu__item.is-on`) || Nh.querySelector(`.voice-menu__item`)
        )?.focus({ preventScroll: !0 }))
      : (Nh.classList.remove(`is-open`),
        Nh.classList.add(`is-leaving`),
        (Yh = setTimeout(() => {
          ((Nh.hidden = !0), Nh.classList.remove(`is-leaving`));
        }, 160))));
}
rm &&
  (jh.addEventListener(`click`, () => qh(!$.on)),
  Mh.addEventListener(`click`, () => Zh(!Xh())),
  Nh.addEventListener(`click`, (e) => {
    let t = e.target.closest(`[data-voice]`);
    if (t) {
      if (
        (($.voices = { ...$.voices, [ar()]: t.dataset.voice }),
        Rm.set(`voices`, $.voices),
        Zh(!1),
        Mh.focus({ preventScroll: !0 }),
        Tm({ voice: Lh() }))
      )
        zh();
      else if ($.on) Wh();
      else {
        let e = Hh()[0];
        e && Uh([e]);
      }
    }
  }),
  Nh.addEventListener(`keydown`, (e) => {
    let t = [...Nh.querySelectorAll(`.voice-menu__item`)],
      n = t.indexOf(document.activeElement);
    if (e.key === `Escape`) (Zh(!1), Mh.focus({ preventScroll: !0 }));
    else if (e.key === `ArrowDown` && t[n + 1]) t[n + 1].focus();
    else if (e.key === `ArrowUp` && t[n - 1]) t[n - 1].focus();
    else return;
    (e.preventDefault(), e.stopPropagation());
  }),
  document.addEventListener(`mousedown`, (e) => {
    Xh() && !Ah.contains(e.target) && Zh(!1);
  }),
  sm(() => {
    Xh() && Jh();
  }),
  window.addEventListener(`keydown`, (e) => {
    e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      Eh.isOpen() ||
      Th() ||
      Xh() ||
      e.target.closest(`input, textarea`) ||
      (e.code === `KeyL` || e.key === `l` || e.key === `L`
        ? qh(!$.on)
        : (e.code === `KeyP` || e.key === `p` || e.key === `P`) && Gh());
  }),
  zh());
var Qh = { w: 1672, h: 920 },
  $h = document.querySelector(`.window`),
  eg = (e, t) => (e >= 1200 && t >= 560 ? `desktop` : e >= 960 && t >= 600 ? `tablet` : `stack`);
function tg() {
  let e = eg(window.innerWidth, window.innerHeight);
  if (((document.documentElement.dataset.layout = e), e === `desktop`)) {
    let e = Math.min(1, window.innerWidth / Qh.w, window.innerHeight / Qh.h);
    (($h.style.zoom = e),
      ($h.style.width = `${window.innerWidth / e}px`),
      ($h.style.height = `${window.innerHeight / e}px`),
      rg(!1),
      ag(!1));
  } else (($h.style.zoom = ``), ($h.style.width = ``), ($h.style.height = ``));
  (Qm(), Jm(), Q.refit());
}
var ng = Z(`#menu-btn`);
function rg(e) {
  e !== document.documentElement.classList.contains(`is-drawer`) &&
    (document.documentElement.classList.toggle(`is-drawer`, e),
    ng.setAttribute(`aria-expanded`, e),
    e
      ? (Wm(X.lessonId, !1), setTimeout(() => Z(`#drawer-close`).focus({ preventScroll: !0 }), 50))
      : document.activeElement &&
        Z(`#sidebar`).contains(document.activeElement) &&
        ng.focus({ preventScroll: !0 }));
}
(ng.addEventListener(`click`, () => rg(!0)),
  Z(`#drawer-close`).addEventListener(`click`, () => rg(!1)),
  Z(`#drawer-backdrop`).addEventListener(`click`, () => rg(!1)),
  window.addEventListener(`hashchange`, () => rg(!1)),
  window.addEventListener(`keydown`, (e) => {
    e.key === `Escape` &&
      document.documentElement.classList.contains(`is-drawer`) &&
      !Th() &&
      rg(!1);
  }),
  Z(`#sidebar`).addEventListener(`click`, (e) => {
    let t = e.target.closest(`[data-nav]`);
    if (!t || t.classList.contains(`is-active`)) return;
    let n = Om.find((e) => e.label === t.dataset.nav);
    hh(
      O(fh[t.dataset.nav] || D(`{name} is coming soon`), { name: O(t.dataset.nav) }),
      n ? n.icon : `sparkles`,
    );
  }),
  Z(`#lang-btn-2`).addEventListener(`click`, () => {
    (rg(!1), wh(!0));
  }));
var ig = Z(`#expand`);
function ag(e) {
  let t = Z(`.stage`);
  t.classList.contains(`is-full`) !== e &&
    (t.classList.toggle(`is-full`, e),
    document.documentElement.classList.toggle(`has-full`, e),
    og());
}
function og() {
  let e = Z(`.stage`).classList.contains(`is-full`);
  ((ig.innerHTML = i(e ? `collapse` : `expand`, { size: 15, stroke: 2 })),
    (ig.title = O(e ? `Exit full screen` : `Full screen`)),
    ig.setAttribute(`aria-label`, O(e ? `Exit full screen` : `Show the diagram full screen`)));
}
(ig.addEventListener(`click`, () => ag(!Z(`.stage`).classList.contains(`is-full`))),
  window.addEventListener(`keydown`, (e) => {
    e.key === `Escape` && Z(`.stage`).classList.contains(`is-full`) && ag(!1);
  }),
  (Q.onSwipe = (e) => {
    let t = nf[X.lessonId],
      n = X.step + e * (cr() ? -1 : 1);
    n >= 0 && n < t.steps.length && sh(X.lessonId, n);
  }));
var sg = Z(`#fit`);
((Q.onView = (e) => {
  sg.hidden = !e;
}),
  sg.addEventListener(`click`, () => Q.fit()),
  tg(),
  window.addEventListener(`resize`, tg));
function cg() {
  for (let e of document.querySelectorAll(`[data-t]`))
    e.textContent = O(e.dataset.t, e.dataset.n ? { n: e.dataset.n } : void 0);
  for (let e of document.querySelectorAll(`[data-t-aria]`))
    e.setAttribute(`aria-label`, O(e.dataset.tAria));
  for (let e of document.querySelectorAll(`[data-t-title]`)) e.title = O(e.dataset.tTitle);
  (lg(), vh(), Oh(), og(), zh());
}
function lg() {
  let e = Dm(ar());
  ((Z(`#lang-btn .lang__code`).textContent = e.code),
    (Z(`#lang-btn-2 .lang__code`).textContent = e.native));
  for (let t of [Z(`#lang-btn`), Z(`#lang-btn-2`)])
    t.setAttribute(`aria-label`, O(`Language: {name}`, { name: e.native }));
  for (let t of Sh.querySelectorAll(`.lang__item`)) {
    let n = t.dataset.lang === e.id;
    (t.classList.toggle(`is-on`, n),
      t.setAttribute(`aria-checked`, n),
      (t.querySelector(`.lang__tile`).innerHTML = n
        ? i(`check`, { size: 14, stroke: 3 })
        : Dm(t.dataset.lang).code));
  }
}
async function ug(e) {
  e !== ar() &&
    (rm && Zh(!1),
    Rm.set(`lang`, e),
    await Sp(e),
    await wp(X.lessonId),
    cg(),
    Bm(),
    Eh.reset(),
    (X.lessonId = null),
    dh());
}
function dg() {
  let e = new URLSearchParams(location.search).get(`lang`);
  if (e) {
    Rm.set(`lang`, e);
    let t = new URL(location.href);
    (t.searchParams.delete(`lang`), history.replaceState(null, ``, t.pathname + t.search + t.hash));
  }
  return Rm.get(`lang`, null) || document.documentElement.dataset.startLang || `en`;
}
async function fg() {
  let e = dg();
  if (e !== `en` && yp.includes(e))
    try {
      (await Sp(e), await wp(ch().lessonId), cg(), Bm(), Eh.reset());
    } catch {
      await Sp(`en`);
    }
  (document.documentElement.removeAttribute(`data-lang-pending`), dh());
}
fg();
window.__setTheme = bh;
window.__ap = Q;
window.__nf = nf;
window.__s = s;

