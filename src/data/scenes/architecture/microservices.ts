// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeBalancer as f,
  makeCrowd as p,
  makeGhost as m,
  makeLink as h,
  DEAD_STATE as g,
  makeHot as _,
  makeCool as v,
  makeDevice as y,
  makeDb as b,
  makeZone as x,
  makeQueue as ee,
  makePanel as S,
  makeUser as te,
  makeDns as ne,
  makeWebServer as re,
  makeDatabase as ie,
  URL_TAG as ae,
  LINK_TEMPLATES as C,
  CACHED_DNS_LINK as oe,
  TIMING_PANEL as se,
} from '@/lib/simulator/scene-builders';

// ============================================================================
// MICROSERVICES & DISTRIBUTED SYSTEMS
// ============================================================================
const fc = { x0: -9, x1: -1, y0: -24, y1: -18 },
  pc = () => p(fc, 13, `shoppers`),
  mc = (x, y = 4, t = {}) =>
    d(x, y, {
      s: 5.5,
      h: 60,
      color: `orange`,
      glyph: `box`,
      label: [`Monolith`],
      sub: `all features`,
      ...(typeof y === 'object' ? y : t),
    }),
  hc = (e = {}, t = {}, n = {}) => ({
    users: pc(),
    lb: f(-5, -6),
    m1: mc(-3, 6, e),
    m2: mc(8, -4, t),
    mdb: b(9, 7, { r: 2.2, h: 44, label: `one database`, ...n }),
  }),
  gc = {
    ul: h(`users`, `lb`, [`users`, `lb`], { heads: `both` }),
    l1: h(`lb`, `m1`, [`lb`, [`m1`, `lb`], `m1`]),
    l2: h(`lb`, `m2`, [`lb`, [`m2`, `lb`], `m2`]),
    d1: h(`m1`, `mdb`, [`m1`, [`m1`, `mdb`], `mdb`], { heads: `both` }),
    d2: h(`m2`, `mdb`, [`m2`, [`m2`, `mdb`], `mdb`], { heads: `both` }),
  },
  _c = [
    { routes: [{ path: [`ul`, `l1`, `d1`] }, { path: [`ul`, `l2`, `d2`] }], rate: 2.4, bounce: !0 },
  ],
  vc = {
    usr: { x: -12, y: 4, color: `green`, glyph: `user`, label: [`Users`] },
    cat: { x: -3, y: 4, color: `yellow`, glyph: `layers`, label: [`Catalog`] },
    ord: { x: 6, y: 4, color: `blue`, glyph: `cart`, label: [`Orders`] },
    pay: { x: 15, y: 4, color: `purple`, glyph: `creditCard`, label: [`Payments`] },
  },
  yc = Object.keys(vc),
  bc = (e = []) =>
    d(-2, -6, {
      color: `orange`,
      glyph: `route`,
      label: [`API`, `Gateway`],
      tags: e,
      pills: `below`,
    }),
  xc = (e = {}) =>
    Object.fromEntries(yc.map((t) => [t, d(vc[t].x, vc[t].y, { ...vc[t], ...(e[t] || {}) })])),
  Sc = () =>
    Object.fromEntries(yc.map((e) => [`${e}db`, b(vc[e].x, 14, { r: 1.5, h: 30, label: `` })])),
  Cc = (e = {}) => ({
    ug: h(`users`, `gw`, [`users`, `gw`], { heads: `both` }),
    ...Object.fromEntries(
      yc.map((t) => [
        `g${t}`,
        h(`gw`, t, [`gw`, t], { heads: `both`, ...(e[t] || {}) }),
      ]),
    ),
  }),
  wc = () =>
    Object.fromEntries(yc.map((e) => [`d${e}`, h(e, `${e}db`, [e, `${e}db`], { heads: `both` })])),
  Tc = (e = {}) => ({
    op: h(`ord`, `pay`, [`ord`, `pay`], { heads: `both`, label: `API call`, ...e }),
  }),
  Ec = (e = 2.6) => [
    { routes: yc.map((e) => ({ path: [`ug`, `g${e}`, `d${e}`] })), rate: e, bounce: !0 },
  ],
  Dc = (e, t, n) => S({ x: 15, y: 14, z: 0, dx: 60, dy: -175 }, e, t, { icon: n });

export const microservicesLesson = {
    id: `microservices`,
    title: `Monolith vs Microservices`,
    summary: `One codebase or many services? What each buys you, what each costs, and how to move between them.`,
    minutes: 14,
    level: `intermediate`,
    metrics: [`deploys`, `blast`, `hops`, `opsCost`],
    legend: [`req`, `res`, `fail`],
    goals: [
      { text: `What a monolith is good at — and where it hurts`, step: 1 },
      { text: `Splitting by business capability`, step: 2 },
      { text: `The costs: a network in the middle`, step: 4 },
      { text: `Queries across services: local read copies`, step: 7 },
      { text: `Contract tests and the distributed monolith`, step: 8 },
      { text: `Migrating safely with a strangler fig`, step: 10 },
    ],
    steps: [
      {
        short: `Monolith`,
        chapter: `setup`,
        title: `One app, one deploy`,
        body: [
          `Your shop is a <span class="term">monolith</span>: one codebase with every feature — accounts, catalog, orders, payments — deployed as one unit, several copies behind a load balancer, all sharing one database.`,
          `For a small team this is great: calls between features are plain function calls, one deploy ships everything, and a stack trace shows the whole story.`,
        ],
        callout: {
          kind: `insight`,
          text: `Many very large companies ran on a monolith for years. It is a perfectly good architecture — until it isn’t.`,
        },
        metrics: { deploys: `1`, blast: `whole site`, hops: `1`, opsCost: `low` },
        scene: {
          entities: hc({ tags: [{ text: `users · catalog · orders · payments` }] }),
          links: gc,
          flows: _c,
        },
      },
      {
        short: `Growing pains`,
        chapter: `problem`,
        title: `Fifty engineers, one codebase`,
        body: [
          `The team grows to fifty people across six teams. Every change goes into one weekly release, so a bug in one feature delays everyone’s work.`,
          `A memory leak in the new reports feature crashes the whole process — checkout included. And to give search more memory, you must scale every copy of everything.`,
        ],
        callout: {
          kind: `warn`,
          text: `The monolith’s problems are mostly about people: teams waiting on each other, and one team’s bug becoming everyone’s outage.`,
        },
        changes: [
          `~ 6 teams share one release`,
          `− Reports bug crashes checkout`,
          `~ Scale everything to scale one feature`,
        ],
        metrics: { deploys: `1 / week`, blast: `whole site`, hops: `1`, opsCost: `low` },
        scene: {
          entities: hc(
            {
              ..._(0.97),
              tags: [{ text: `reports leak · out of memory`, tone: `red`, icon: `bug` }],
            },
            { ...g, tags: [{ text: `crashed · checkout down too`, tone: `red`, icon: `alert` }] },
          ),
          links: { ...gc, l2: h(`lb`, `m2`, [`lb`, [`m2`, `lb`], `m2`], { style: `off` }) },
          flows: [{ route: [`ul`, `l1`, `d1`], rate: 2.4, bounce: !0 }],
        },
      },
      {
        short: `Split`,
        chapter: `solution`,
        title: `Split by business capability`,
        body: [
          `Break the app into <span class="term">microservices</span> along business lines: Users, Catalog, Orders, Payments. Each is a separate program, owned by one team, deployed on its own schedule.`,
          `An <b>API gateway</b> gives clients one front door and routes each request to the right service.`,
        ],
        callout: {
          kind: `tip`,
          text: `Split along business capabilities, not technical layers. A “database service” or “UI service” just moves the coupling around.`,
        },
        changes: [`− Monolith`, `+ 4 services, one per team`, `+ API gateway`],
        metrics: { deploys: `40 / day`, blast: `one feature`, hops: `2–4`, opsCost: `high` },
        scene: {
          entities: {
            users: pc(),
            gw: bc(),
            ...xc(),
            mdb: b(2, 14, { r: 2.2, h: 44, label: `one database` }),
          },
          links: {
            ...Cc(),
            ...Object.fromEntries(
              yc.map((e) => [`m${e}`, h(e, `mdb`, [e, `mdb`], { heads: `both` })]),
            ),
          },
          flows: [
            { routes: yc.map((e) => ({ path: [`ug`, `g${e}`, `m${e}`] })), rate: 2.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Own data`,
        chapter: `technique`,
        title: `Each service owns its data`,
        body: [
          `If services still share one database, they are still tied together: a schema change by one team can break three others. So each service gets its <b>own database</b>, and nobody else touches it.`,
          `Need payment data in Orders? Ask Payments through its API — or listen to its events.`,
        ],
        callout: {
          kind: `insight`,
          text: `Database per service is what makes independent deploys real. It also means no more joins or transactions across services — see the Sagas lesson.`,
        },
        changes: [`− Shared database`, `+ A database per service`, `+ Orders → Payments via API`],
        metrics: { deploys: `40 / day`, blast: `one feature`, hops: `2–4`, opsCost: `high` },
        scene: {
          entities: {
            users: pc(),
            gw: bc(),
            ...xc(),
            ...Sc(),
            card: Dc(
              `Database per service`,
              [
                `! no shared tables`,
                `! no joins across services`,
                `= ask the owner: API or events`,
                `# each team picks its own store`,
              ],
              `database`,
            ),
          },
          links: { ...Cc(), ...wc(), ...Tc() },
          flows: [...Ec(), { route: [`op`], rate: 0.8, bounce: !0 }],
        },
      },
      {
        short: `Network`,
        chapter: `problem`,
        title: `The network is in the middle now`,
        body: [
          `Showing one order page now takes several calls: gateway → Orders → Payments, plus Users and Catalog. Each hop adds latency, and each can be slow or fail on its own — watch one time out.`,
          `Debugging spans four codebases. You need timeouts, retries, tracing and good dashboards (the Reliability module) just to stay where the monolith started.`,
        ],
        callout: {
          kind: `warn`,
          text: `A function call never fails halfway. A network call does — partially, slowly, and at the worst moment.`,
        },
        changes: [
          `+ 6 network hops per page`,
          `− Payments call times out`,
          `~ Page fails or degrades`,
        ],
        metrics: { deploys: `40 / day`, blast: `one feature`, hops: `6`, opsCost: `high` },
        scene: {
          entities: {
            users: pc(),
            gw: bc(),
            ...xc({
              pay: { heat: 0.5, tags: [{ text: `slow · 2 s`, tone: `amber`, icon: `hourglass` }] },
            }),
            ...Sc(),
          },
          links: { ...Cc(), ...wc(), ...Tc({ label: `timeout`, labelTone: `red`, fail: 0.4 }) },
          flows: [...Ec(2), { route: [`op`], rate: 1, bounce: !0, hold: 1.2, kind: `slow` }],
        },
      },
      {
        short: `Distributed monolith`,
        chapter: `problem`,
        title: `Case: the distributed monolith`,
        body: [
          `One company split its monolith into twelve services — but they kept reading each other’s tables, and every feature needed changes in five services released together.`,
          `They got the network costs of microservices <em>and</em> the coupling of a monolith. Releases got slower, not faster.`,
        ],
        callout: {
          kind: `warn`,
          text: `If services must be deployed together, they are one service. Boundaries come first; the split comes second.`,
        },
        changes: [
          `~ Services read each other’s data`,
          `− Must release together`,
          `− Worst of both worlds`,
        ],
        metrics: { deploys: `1 / week`, blast: `whole site`, hops: `6`, opsCost: `high` },
        scene: {
          entities: {
            users: pc(),
            gw: bc([{ text: `release train: all 4 together`, tone: `red`, icon: `alert` }]),
            ...xc(),
            mdb: b(2, 14, { r: 2.2, h: 44, label: `shared tables`, heat: 0.6 }),
          },
          links: {
            ...Cc(),
            ...Tc({ label: `chatty calls` }),
            ...Object.fromEntries(
              yc.map((e) => [`m${e}`, h(e, `mdb`, [e, `mdb`], { heads: `both` })]),
            ),
          },
          flows: [
            { routes: yc.map((e) => ({ path: [`ug`, `g${e}`, `m${e}`] })), rate: 2.6, bounce: !0 },
            { route: [`op`], rate: 1.2, bounce: !0 },
          ],
        },
      },
      {
        short: `Joins?`,
        chapter: `problem`,
        title: `Case: the order-history page`,
        body: [
          `The order-history page shows each order with its product names and photos. In the monolith that was one SQL join. Now orders live in Orders and products in Catalog — and there are no joins across services.`,
          `So Orders calls Catalog once per order: 20 orders, 20 calls (the <b>N+1</b> problem). The page is slow, and if Catalog is down, order history is down too.`,
        ],
        callout: {
          kind: `warn`,
          text: `Screens that combine data from many services are where microservices hurt most. Plan for them up front.`,
        },
        changes: [`+ Order history needs Catalog data`, `− 20 calls to Catalog per page`],
        metrics: { deploys: `40 / day`, blast: `one feature`, hops: `1 + 20`, opsCost: `high` },
        scene: {
          entities: {
            users: pc(),
            gw: bc(),
            ...xc({
              ord: { tags: [{ text: `history: 20 orders`, icon: `listOrdered` }] },
              cat: { heat: 0.5 },
            }),
            ...Sc(),
          },
          links: {
            ...Cc(),
            ...wc(),
            oc: h(`ord`, `cat`, [`ord`, `cat`], {
              heads: `both`,
              label: `× 20 calls`,
              labelTone: `red`,
            }),
          },
          flows: [
            { route: [`ug`, `gord`, `dord`], rate: 1, bounce: !0 },
            { route: [`oc`], rate: 4.5, bounce: !0 },
          ],
        },
      },
      {
        short: `Local copy`,
        chapter: `solution`,
        title: `Keep a local read copy`,
        body: [
          `Orders keeps its own copy of the few catalog fields it displays — name and photo — and Catalog publishes a <code>ProductUpdated</code> event whenever they change. Orders updates its copy from those events.`,
          `Order history is one query in Orders’ own database again, and it keeps working when Catalog is down. The price stays as it was at purchase anyway: it’s a historical fact, not a live lookup.`,
        ],
        callout: {
          kind: `tip`,
          text: `The copy is eventually consistent: a renamed product shows the new name a moment later. For a history page, that’s fine.`,
        },
        changes: [
          `+ ProductUpdated events`,
          `+ Local copy of name and photo in Orders`,
          `− Calls to Catalog per page`,
        ],
        metrics: { deploys: `40 / day`, blast: `one feature`, hops: `2`, opsCost: `high` },
        scene: {
          entities: {
            users: pc(),
            gw: bc(),
            ...xc({
              ord: { tags: [{ text: `local copy: name · photo`, tone: `green`, icon: `layers` }] },
            }),
            ...Sc(),
          },
          links: {
            ...Cc(),
            ...wc(),
            co: h(`cat`, `ord`, [`cat`, `ord`], { label: `ProductUpdated` }),
          },
          flows: [...Ec(), { route: [`co`], kind: `msg`, rate: 0.6 }],
        },
      },
      {
        short: `Contracts`,
        chapter: `technique`,
        title: `Case: an API change breaks a neighbour`,
        body: [
          `The Payments team renames <code>amount</code> to <code>amount_cents</code>. Their own tests pass, they deploy — and every checkout in Orders starts failing. Independent deploys only work if teams can’t break each other by accident.`,
          `With <span class="term">consumer-driven contract tests</span>, Orders publishes exactly which fields it relies on. Payments’ build runs those contracts before every release, and this change is blocked in CI instead of in production.`,
        ],
        callout: {
          kind: `tip`,
          text: `Pair contracts with the API versioning rules from the REST lesson: add fields freely, remove them only when no contract needs them.`,
        },
        changes: [
          `+ Orders publishes a contract for Payments’ API`,
          `~ Breaking change blocked in Payments’ CI`,
        ],
        metrics: { deploys: `40 / day`, blast: `one feature`, hops: `2–4`, opsCost: `high` },
        scene: {
          entities: {
            users: pc(),
            gw: bc(),
            ...xc({
              ord: { tags: [{ text: `contract: needs amount`, icon: `clipboard` }] },
              pay: {
                tags: [{ text: `CI: breaks Orders’ contract ✗`, tone: `amber`, icon: `ban` }],
              },
            }),
            ...Sc(),
          },
          links: { ...Cc(), ...wc(), ...Tc({ label: `contract tested` }) },
          flows: [...Ec(), { route: [`op`], rate: 0.8, bounce: !0 }],
        },
      },
      {
        short: `Choosing`,
        chapter: `insight`,
        title: `Which one should you pick?`,
        body: [
          `<table class="compare">
          <thead><tr><th></th><th>Monolith</th><th>Microservices</th></tr></thead>
          <tbody>
            <tr><td>Team size</td><td>One to a few teams</td><td>Many teams</td></tr>
            <tr><td>Deploys</td><td>Together</td><td>Independent</td></tr>
            <tr><td>Calls</td><td>In-process, fast</td><td>Network, can fail</td></tr>
            <tr><td>Data</td><td>One DB, joins, transactions</td><td>DB per service, sagas</td></tr>
            <tr><td>Ops</td><td>Simple</td><td>Needs good tooling</td></tr>
          </tbody>
        </table>`,
          `A common path: start with a <b>modular monolith</b> — one deployable with strict internal boundaries — and split out a module only when a team clearly needs independence.`,
        ],
        callout: {
          kind: `tip`,
          text: `Microservices solve an organisational scaling problem. If you don’t have that problem yet, they mostly add cost.`,
        },
        metrics: { deploys: `40 / day`, blast: `one feature`, hops: `2–4`, opsCost: `high` },
        scene: {
          entities: { users: pc(), gw: bc(), ...xc(), ...Sc() },
          links: { ...Cc(), ...wc(), ...Tc() },
          flows: [...Ec(), { route: [`op`], rate: 0.8, bounce: !0 }],
        },
      },
      {
        short: `Strangler`,
        chapter: `technique`,
        title: `Migrating: the strangler fig`,
        body: [
          `Don’t rewrite everything at once. Put the gateway in front of the monolith, build <b>one</b> new service — Payments — and route only <code>/payments/*</code> to it. Everything else still goes to the monolith.`,
          `Move one capability at a time until the monolith is small enough to retire. Each step is shippable and reversible.`,
        ],
        callout: {
          kind: `insight`,
          text: `Named after the strangler fig, which grows around a tree until it can stand on its own.`,
        },
        changes: [
          `+ Gateway in front of the monolith`,
          `+ New Payments service with its own DB`,
          `~ /payments/* → new service`,
        ],
        metrics: { deploys: `5 / day`, blast: `whole site`, hops: `1–2`, opsCost: `medium` },
        scene: {
          entities: {
            users: pc(),
            gw: bc(),
            m1: mc(-4, 4, { tags: [{ text: `users · catalog · orders` }] }),
            mdb: b(-4, 14, { r: 2.2, h: 44, label: `monolith DB` }),
            pay: d(12, 4, { ...vc.pay, tags: [{ text: `new`, tone: `green` }] }),
            paydb: b(12, 14, { r: 1.5, h: 30, label: `` }),
          },
          links: {
            ug: h(`users`, `gw`, [`users`, `gw`], { heads: `both` }),
            gm: h(`gw`, `m1`, [`gw`, `m1`], {
              heads: `both`,
              label: `everything else`,
              labelAt: 0.45,
            }),
            gpay: h(`gw`, `pay`, [`gw`, `pay`], {
              heads: `both`,
              label: `/payments/*`,
              labelAt: 0.45,
            }),
            dm: h(`m1`, `mdb`, [`m1`, `mdb`], { heads: `both` }),
            dpay: h(`pay`, `paydb`, [`pay`, `paydb`], { heads: `both` }),
          },
          flows: [
            {
              routes: [{ path: [`ug`, `gm`, `dm`], weight: 3 }, { path: [`ug`, `gpay`, `dpay`] }],
              pick: `weights`,
              rate: 2.6,
              bounce: !0,
            },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>A <b>monolith</b> is simple and fast — until many teams share it.</li>
          <li><b>Microservices</b> split by business capability, each with its <b>own data</b>.</li>
          <li>You pay with network calls, partial failures and operational tooling.</li>
          <li>Replace joins with <b>local read copies</b>; protect APIs with <b>contract tests</b>.</li>
          <li>Avoid the <b>distributed monolith</b>; migrate gradually with a <b>strangler fig</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Service Discovery</b> — how services find each other when instances come and go.`,
        },
        metrics: { deploys: `40 / day`, blast: `one feature`, hops: `2–4`, opsCost: `high` },
        scene: {
          entities: { users: pc(), gw: bc(), ...xc(), ...Sc() },
          links: { ...Cc(), ...wc(), ...Tc() },
          flows: [...Ec(), { route: [`op`], rate: 0.8, bounce: !0 }],
        },
      },
    ],
  };

export default microservicesLesson;
