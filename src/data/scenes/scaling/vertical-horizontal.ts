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

const Pe = { x0: -4.5, x1: 4.5, y0: -15, y1: -9 };

const Fe = { x0: -13.5, x1: 13.5, y0: -15, y1: -9 };

const Ie = [-10.5, -3.5, 3.5, 10.5];

const Le = [`A`, `B`, `C`, `D`];

const Re = (e) => ({ a: d(0, 0, { label: [`App`, `Server`], ...e }) });

const ze = (e = {}) =>
    Object.fromEntries(
      Ie.map((t, n) => {
        let r = `abcd`[n];
        return [r, d(t, 0, { label: [`Server ${Le[n]}`], ...v(0.54 - n * 0.02), ...(e[r] || {}) })];
      }),
    );

const Be = (e = {}) =>
    Object.fromEntries(
      `abcd`.split(``).map((t) => [`u${t}`, h(`users`, t, [[t, `users`], t], { fail: e[t] || 0 })]),
    );

const Ve = (e = ``) => `abcd`.split(``).map((e) => ({ route: [`u${e}`], rate: 1.4 }));

export const verticalHorizontalLesson = {
    id: `vertical-horizontal`,
    title: `Vertical vs Horizontal Scaling`,
    summary: `Your one server is melting. Do you buy a bigger one, or more of them?`,
    minutes: 11,
    level: `beginner`,
    metrics: [`users`, `rps`, `p95`, `errors`, `cost`],
    legend: [`req`, `fail`],
    goals: [
      { text: `Spot the symptoms of an overloaded server`, step: 1 },
      { text: `Scale up — and know its limits`, step: 4 },
      { text: `Scale out with many smaller servers`, step: 5 },
      { text: `Autoscale with the daily cycle — and pre-scale for spikes`, step: 7 },
      { text: `See why scaling out needs a load balancer`, step: 9 },
    ],
    steps: [
      {
        short: `One server`,
        chapter: `setup`,
        title: `It starts with one server`,
        body: [
          `Your app runs on a single machine. Every request — opening a page, posting a photo — travels from a user’s device to that server and back.`,
          `With a hundred users it barely notices: the CPU idles around <b>1%</b>.`,
        ],
        callout: {
          kind: `insight`,
          text: `A server has a fixed budget of CPU, memory, disk and network. Its <b>capacity</b> is how many requests per second it can serve before one of those runs out.`,
        },
        metrics: { users: 100, rps: 4, p95: 80, errors: 0, cost: 150 },
        scene: {
          entities: {
            users: p(Pe, 3, `100 users`),
            ...Re({ cpu: 0.01, tags: [{ text: `4 vCPU · 16 GB` }] }),
          },
          links: { ua: h(`users`, `a`, [`users`, `a`]) },
          flows: [{ route: [`ua`], rate: 1.2 }],
        },
      },
      {
        short: `Viral spike`,
        chapter: `problem`,
        title: `Then you go viral`,
        body: [
          `A post takes off and traffic jumps <b>120×</b>. This machine can serve about 400 requests per second, and 480 are arriving. The CPU pins at 100%, requests queue up waiting their turn, latency balloons, and some give up and time out.`,
          `You need more capacity. There are two fundamentally different ways to get it.`,
        ],
        callout: {
          kind: `warn`,
          text: `Overload looks like: CPU near 100%, growing request queues, rising latency, then timeouts.`,
        },
        changes: [`~ Users 100 → 12,000`, `~ CPU 1% → 100%`, `+ Requests timing out`],
        metrics: { users: 12e3, rps: 480, p95: 2400, errors: 17, cost: 150 },
        scene: {
          entities: {
            users: p(Pe, 15, `12,000 users`),
            ...Re({ ..._(1), tags: [{ text: `4 vCPU · 16 GB` }] }),
          },
          links: { ua: h(`users`, `a`, [`users`, `a`], { fail: 0.3 }) },
          flows: [{ route: [`ua`], rate: 6 }],
        },
      },
      {
        short: `Scale up`,
        chapter: `solution`,
        title: `Way 1 — scale up`,
        body: [
          `The simplest fix: move to a bigger machine. More cores, more memory, faster disks.`,
          `Nothing about your design changes — the code doesn’t even know. This is <span class="term">vertical scaling</span>, or <em>scaling up</em>.`,
        ],
        callout: {
          kind: `tip`,
          text: `Scaling up is a great first move: zero code changes and nothing new to operate. Four times the machine, roughly four times the price.`,
        },
        changes: [`~ Server 4 vCPU → 16 vCPU`, `~ CPU 100% → 30%`, `~ Cost $150 → $600 / month`],
        metrics: { users: 12e3, rps: 480, p95: 110, errors: 0, cost: 600 },
        scene: {
          entities: {
            users: p(Pe, 15, `12,000 users`),
            ...Re({ s: 6, h: 84, ...v(0.3), tags: [{ text: `16 vCPU · 64 GB`, tone: `violet` }] }),
          },
          links: { ua: h(`users`, `a`, [`users`, `a`]) },
          flows: [{ route: [`ua`], rate: 6 }],
        },
      },
      {
        short: `The ceiling`,
        chapter: `tradeoff`,
        title: `…until you hit the ceiling`,
        body: [
          `Growth continues and you upgrade again and again — but machines only get so big. Even the largest general-purpose server can’t keep up, and software rarely uses 192 cores as well as it used 16: locks, memory and one shared disk get in the way.`,
          `Every upgrade is also a migration: a restart, and downtime while you move.`,
        ],
        callout: {
          kind: `warn`,
          text: `Vertical scaling has a hard ceiling. In the cloud, price grows roughly in line with size — until the top of the range, where the exotic machines carry a premium and twice the cores no longer means twice the throughput.`,
        },
        changes: [
          `~ Users 12,000 → 500,000`,
          `+ Largest machine reached`,
          `~ Cost $600 → $7,200 / month`,
        ],
        metrics: { users: 5e5, rps: 2e4, p95: 3100, errors: 12, cost: 7200 },
        scene: {
          entities: {
            users: p(Pe, 15, `500,000 users`),
            max: m(0, 0, 7.6, 124, `largest machine you can buy`),
            ...Re({ s: 7, h: 116, ..._(1), tags: [{ text: `192 vCPU · 768 GB`, tone: `violet` }] }),
          },
          links: { ua: h(`users`, `a`, [`users`, `a`], { fail: 0.28 }) },
          flows: [{ route: [`ua`], rate: 7 }],
        },
      },
      {
        short: `One failure`,
        chapter: `problem`,
        title: `…and it’s a single point of failure`,
        body: [
          `Worse, everything depends on one machine. A bad deploy, a full disk or a dead power supply and the whole product is offline.`,
          `A component whose failure takes the entire system down is a <span class="term">single point of failure</span> (SPOF).`,
        ],
        callout: {
          kind: `warn`,
          text: `However big it is, one box is always one failure away from a full outage.`,
        },
        changes: [`− App server down`, `~ Errors 12% → 100%`],
        metrics: { users: 5e5, rps: 2e4, p95: null, errors: 100, cost: 7200 },
        scene: {
          entities: { users: p(Pe, 15, `500,000 users`), ...Re({ s: 7, h: 116, ...g }) },
          links: { ua: h(`users`, `a`, [`users`, `a`], { fail: 1 }) },
          flows: [{ route: [`ua`], rate: 6 }],
        },
      },
      {
        short: `Scale out`,
        chapter: `solution`,
        title: `Way 2 — scale out`,
        body: [
          `Instead of one giant machine, run several mid-size ones side by side — here four with 96 vCPU each — all running the same code.`,
          `Need more capacity? Add another server. Mid-size machines are the best value, there’s no hard ceiling, and each one is a small slice of the whole. This is <span class="term">horizontal scaling</span>, or <em>scaling out</em> — how virtually every large system grows.`,
        ],
        callout: {
          kind: `tip`,
          text: `Four 96-vCPU servers have twice the capacity of the biggest single machine — and any one of them can fail while the other three carry the load.`,
        },
        changes: [
          `~ 1 giant server → 4 mid-size servers`,
          `~ Capacity × 2 · cost $7,200 → $14,400 / month`,
          `~ CPU ≈ 52% each`,
          `~ Errors 100% → 0%`,
        ],
        metrics: { users: 5e5, rps: 2e4, p95: 95, errors: 0, cost: 14400 },
        scene: {
          entities: { users: p(Fe, 30, `500,000 users`), ...ze() },
          links: Be(),
          flows: Ve(),
        },
      },
      {
        short: `Night time`,
        chapter: `problem`,
        title: `Peak capacity, idle all night`,
        body: [
          `Traffic follows the clock. At 8 p.m. you need all four servers; at 4 a.m. traffic is a tenth of that, and they sit at 5% CPU.`,
          `You’re paying for peak capacity 24 hours a day. Most of the time, most of it does nothing.`,
        ],
        callout: {
          kind: `insight`,
          text: `Consumer apps commonly swing 3–10× between their daily peak and trough.`,
        },
        changes: [`~ 4 a.m.: users 500,000 → 50,000`, `~ CPU ≈ 52% → 5%`],
        metrics: { users: 5e4, rps: 2e3, p95: 90, errors: 0, cost: 14400 },
        scene: {
          entities: {
            users: p(Fe, 8, `4 a.m. · 50,000 users`),
            ...ze({ a: v(0.05), b: v(0.05), c: v(0.06), d: v(0.05) }),
          },
          links: Be(),
          flows: `abcd`.split(``).map((e) => ({ route: [`u${e}`], rate: 0.3 })),
        },
      },
      {
        short: `Autoscale`,
        chapter: `solution`,
        title: `Autoscaling: follow the demand`,
        body: [
          `Because the servers are interchangeable, an <span class="term">autoscaler</span> can add and remove them automatically — for example, keep average CPU near 50%.`,
          `At night it scales <b>in</b> to two servers — never fewer, so one can still fail — and in the evening it scales back <b>out</b>. You pay roughly for what you use.`,
        ],
        callout: {
          kind: `tip`,
          text: `Autoscaling only works when servers are stateless and sit behind a load balancer — the next two lessons.`,
        },
        changes: [
          `− 2 servers removed overnight`,
          `~ CPU 5% → 10% on the two that remain`,
          `~ Average cost $14,400 → $10,800 / month`,
        ],
        metrics: { users: 5e4, rps: 2e3, p95: 90, errors: 0, cost: 10800 },
        scene: {
          entities: {
            users: p({ x0: -13.5, x1: -0.5, y0: -15, y1: -9 }, 8, `4 a.m. · 50,000 users`),
            a: d(-10.5, 0, { label: [`Server A`], ...v(0.11) }),
            b: d(-3.5, 0, {
              label: [`Server B`],
              ...v(0.1),
              tags: [{ text: `autoscaled: 2 of 2–8`, icon: `gauge` }],
            }),
          },
          links: {
            ua: h(`users`, `a`, [[`a`, `users`], `a`]),
            ub: h(`users`, `b`, [[`b`, `users`], `b`]),
          },
          flows: [
            { route: [`ua`], rate: 1.4 },
            { route: [`ub`], rate: 1.4 },
          ],
        },
      },
      {
        short: `Flash sale`,
        chapter: `problem`,
        title: `Case: the flash sale`,
        body: [
          `At noon two servers are comfortably serving 150,000 users. Then a flash sale starts and traffic jumps <b>5×</b> in two minutes. The autoscaler reacts — but a new server takes about three minutes to boot and warm up.`,
          `For those minutes the two running servers can serve only about two-thirds of the traffic. The fix is to scale <b>before</b> the spike: scheduled scaling for known events, and spare headroom for unknown ones.`,
        ],
        callout: {
          kind: `warn`,
          text: `Autoscaling reacts; it can’t predict. Pre-warm for launches, sales and big broadcasts.`,
        },
        changes: [
          `~ Users × 5 at noon`,
          `+ 4 servers booting (≈ 3 min)`,
          `− Errors while they warm up`,
        ],
        metrics: { users: 75e4, rps: 3e4, p95: 2800, errors: 36, cost: 21600 },
        scene: {
          entities: {
            users: p({ x0: -20.5, x1: 20.5, y0: -15, y1: -9 }, 30, `noon · 750,000 users`),
            e: d(-17.5, 0, {
              label: [`booting`],
              dim: 1,
              tags: [{ text: `≈ 3 min`, tone: `amber`, icon: `hourglass` }],
            }),
            a: d(-10.5, 0, { label: [`Server A`], ..._(0.99) }),
            b: d(-3.5, 0, { label: [`Server B`], ..._(0.99) }),
            c: d(3.5, 0, { label: [`booting`], dim: 1 }),
            d: d(10.5, 0, { label: [`booting`], dim: 1 }),
            f: d(17.5, 0, { label: [`booting`], dim: 1 }),
          },
          links: {
            ua: h(`users`, `a`, [[`a`, `users`], `a`], { fail: 0.2 }),
            ub: h(`users`, `b`, [[`b`, `users`], `b`], { fail: 0.2 }),
            uc: h(`users`, `c`, [[`c`, `users`], `c`], { style: `off` }),
            ud: h(`users`, `d`, [[`d`, `users`], `d`], { style: `off` }),
            ue: h(`users`, `e`, [[`e`, `users`], `e`], { style: `off` }),
            uf: h(`users`, `f`, [[`f`, `users`], `f`], { style: `off` }),
          },
          flows: [
            { route: [`ua`], rate: 4 },
            { route: [`ub`], rate: 4 },
          ],
        },
      },
      {
        short: `Who routes?`,
        chapter: `problem`,
        title: `But who sends users where?`,
        body: [
          `Right now each group of users is hard-wired to one server’s address. When Server B dies, a quarter of your users get errors — even though three healthy servers are right there.`,
          `Clients can’t tell which servers are alive or busy. Something has to sit in front and steer every request to a healthy server.`,
        ],
        callout: {
          kind: `insight`,
          text: `That something is a <b>load balancer</b> — the subject of the next lesson.`,
        },
        changes: [`− Server B down`, `~ Errors 0% → 25%`],
        metrics: { users: 5e5, rps: 2e4, p95: 95, errors: 25, cost: 14400 },
        scene: {
          entities: { users: p(Fe, 30, `500,000 users`), ...ze({ b: g }) },
          links: Be({ b: 1 }),
          flows: Ve(),
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap: up vs out`,
        body: [
          `<table class="compare">
          <thead><tr><th></th><th>Scale up</th><th>Scale out</th></tr></thead>
          <tbody>
            <tr><td>How</td><td>Bigger machine</td><td>More machines</td></tr>
            <tr><td>Code changes</td><td>None</td><td>Some<sup>1</sup></td></tr>
            <tr><td>Ceiling</td><td>Hardware limit</td><td>Practically none</td></tr>
            <tr><td>Failure</td><td>Total outage</td><td>Partial<sup>2</sup></td></tr>
            <tr><td>To grow</td><td>Migrate + restart</td><td>Add a server</td></tr>
            <tr><td>Cost</td><td>Premium at the top</td><td>Linear</td></tr>
          </tbody>
        </table>`,
          `Scaling out also lets you <b>autoscale</b>: add servers for the evening peak, remove them at night.`,
          `<small><sup>1</sup> Servers must be interchangeable — see <em>Stateless Services</em>. <sup>2</sup> Zero, once a load balancer routes around failures.</small>`,
        ],
        callout: {
          kind: `tip`,
          text: `Rule of thumb: scale up while it’s cheap and simple, then scale out.`,
        },
        metrics: { users: 5e5, rps: 2e4, p95: 95, errors: 0, cost: 14400 },
        scene: {
          entities: { users: p(Fe, 30, `500,000 users`), ...ze() },
          links: Be(),
          flows: Ve(),
        },
      },
    ],
  };

export default verticalHorizontalLesson;
