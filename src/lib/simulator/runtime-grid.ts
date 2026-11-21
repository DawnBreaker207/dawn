// grid config + scene helper fns
// @ts-nocheck
/* eslint-disable */
const Ni = 10;

const Pi = { A: `blue`, B: `orange`, C: `green`, D: `purple`, E: `yellow` };

const Fi = [26, 40, 54, 68, 82, 118, 132, 146, 160, 174, 216, 230, 244, 258, 296, 322, 336, 350];

const Ii = (e, t = Ni) => [t * Math.cos((e * Math.PI) / 180), t * Math.sin((e * Math.PI) / 180)];

const Li = (e, t, n = {}) => {
    let [r, i] = Ii(t);
    return d(r, i, { s: 3.2, h: 38, color: Pi[e], glyph: ``, label: [e], ...n });
  };

const Ri = { A: 100, B: 10, C: 280, D: 200 };

const zi = (e, t = {}) => ({
    type: `ring`,
    x: 0,
    y: 0,
    r: Ni,
    nodes: e,
    keys: Fi,
    label: `hash ring · 0 → 2³²`,
    ...t,
  });

const Bi = (e) => Object.entries(e).map(([e, t]) => ({ a: t, color: Pi[e] }));

const Vi = (e, t) => Fi.filter((n) => Ei(n, e).color !== Ei(n, t).color);

const Hi = (e) => {
    let t = {};
    for (let n of Fi) t[Ei(n, e).color] = (t[Ei(n, e).color] || 0) + 1;
    return Math.round((Math.max(...Object.values(t)) / Fi.length) * 100);
  };

const Ui = (e, t, n) => {
    let r = n <= e ? n : n - 360,
      i = [];
    for (let t = e; t > r; t -= 5) i.push(Ii(t));
    return (i.push(Ii(r)), h(`ring`, t, i, { label: `key @ ${e}°`, labelAt: 0.25 }));
  };

const Wi = (e, t, n) => S({ x: 0, y: 0, z: 0, dx: -470, dy: -250 }, e, t, { icon: n });

const Gi = Bi(Ri);

const Ki = Bi({ ...Ri, E: 308 });

const qi = Bi({ A: 100, B: 10, D: 200 });

const Ji = [
    ...Bi(Ri),
    ...Bi({ A: 75, B: 315, D: 225 }).map((e) => ({ ...e, mark: !0 })),
    ...Bi({ A: 180, B: 30, D: 340 }).map((e) => ({ ...e, mark: !0 })),
  ];

const Yi = (e, t = {}) =>
    Object.fromEntries(e.map((e) => [e.toLowerCase(), Li(e, Ri[e] ?? 50, t[e] || {})])),;
