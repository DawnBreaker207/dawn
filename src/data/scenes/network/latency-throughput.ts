// @ts-nocheck
import {
  makeBlock,
  makeCool,
  makeCrowd,
  makeDb,
  makeHot,
  makeLink,
  makePanel,
  makeQueue
} from '@/lib/simulator/scene-builders';

const le = { x0: -4.5, x1: 4.5, y0: -16, y1: -10 };

const ue = (e, t, n) => makeCrowd(le, e, t, n);

const de = (e = {}) => makeBlock(0, 0, { label: [`App`, `Server`], ...e });

const fe = (e = {}) => ({ u: makeLink(`users`, `srv`, [`users`, `srv`], { heads: `both`, ...e }) });

const pe = (e, t = { x: 0, y: 0 }) =>
    makePanel({ ...t, z: 0, dx: 92, dy: -150 }, `Latency vs. how busy`, [], {
      chart: `hockey`,
      marker: e,
      icon: `trendingUp`,
      w: 236,
    });

const me = (e, t = {}) => [{ route: [`u`], bounce: !0, rate: e, speed: 0.85, ...t }];

export const latencyThroughputLesson = {
    id: `latency-throughput`,
    title: `Latency & Throughput`,
    summary: `Two questions about speed — and why busy servers slow down before they’re full.`,
    minutes: 11,
    level: `beginner`,
    metrics: [`p50`, `p99`, `throughput`, `util`],
    legend: [`req`, `res`, [`slow`, `slow request`], [`queue`, `waiting in queue`]],
    goals: [
      { text: `Tell latency and throughput apart`, step: 0 },
      { text: `Why latency explodes near 100% busy`, step: 2 },
      { text: `Read p50 vs p99 latency`, step: 3 },
      { text: `Why distance sets a latency floor`, step: 5 },
      { text: `Little’s Law, fan-out tails and batching`, step: 7 },
    ],
    steps: [
      {
        short: `Two numbers`,
        chapter: `setup`,
        title: `Two different questions`,
        body: [
          `<span class="term">Latency</span>: how long does <em>one</em> request take, from leaving the user to the answer coming back? Watch one dot go out and return.`,
          `<span class="term">Throughput</span>: how many requests does the system finish <em>per second</em>? Count the dots.`,
        ],
        callout: {
          kind: `insight`,
          text: `Think of a highway: latency is how long your drive takes; throughput is how many cars pass per hour. Extra lanes let more cars through, but on an empty road they don’t get you there any sooner.`,
        },
        metrics: { p50: 120, p99: 180, throughput: 50, util: 10 },
        scene: {
          entities: { users: ue(5, `1,000 users`), srv: de({ cpu: 0.1 }) },
          links: fe({ label: `≈ 120 ms round trip`, labelAt: 0.62 }),
          flows: me(1.1),
        },
      },
      {
        short: `Busier`,
        chapter: `problem`,
        title: `More users, same server`,
        body: [
          `Traffic grows 7×. Throughput climbs with it — the server is still keeping up — and it’s now 70% busy: 350 of the roughly 500 req/s it can handle.`,
          `But look at the line in front of it: requests occasionally have to <b>wait their turn</b>. Waiting is latency too.`,
        ],
        callout: {
          kind: `tip`,
          text: `Utilization = the fraction of time the server is busy. At 70%, a new request often finds it already working on something.`,
        },
        changes: [`~ Users 1,000 → 7,000`, `~ Throughput 50 → 350 req/s`, `+ A short queue forms`],
        metrics: { p50: 160, p99: 600, throughput: 350, util: 70 },
        scene: {
          entities: {
            users: ue(11, `7,000 users`),
            srv: de(makeCool(0.7)),
            q: makeQueue(0, -2.9, 2),
            chart: pe(0.7),
          },
          links: fe(),
          flows: me(3.4),
        },
      },
      {
        short: `Hockey stick`,
        chapter: `problem`,
        title: `The hockey stick`,
        body: [
          `Traffic grows by another third and the server hits 96% busy. Throughput only rises to 480 req/s — a whisker under its ceiling of 500 — but the queue explodes and latency goes up <b>sevenfold</b>.`,
          `Requests don’t arrive evenly spaced. With 30% spare, a burst is absorbed quickly; with 4% spare, each burst piles up behind requests that are already waiting, and the line takes ages to clear.`,
        ],
        callout: {
          kind: `warn`,
          text: `Latency grows slowly, then suddenly. Plan to run around 60–70% busy at peak and keep the rest as headroom.`,
        },
        changes: [
          `~ Users 7,000 → 9,600`,
          `~ Utilization 70% → 96%`,
          `~ Queue 2 → 6 waiting`,
          `~ p99 latency 600 ms → 4.2 s`,
          `~ Throughput 350 → 480 req/s`,
        ],
        metrics: { p50: 900, p99: 4200, throughput: 480, util: 96 },
        scene: {
          entities: {
            users: ue(15, `9,600 users`),
            srv: de({ ...makeHot(0.96), heat: 0.8 }),
            q: makeQueue(0, -2.9, 6),
            chart: pe(0.96),
          },
          links: fe({ fail: 0.08 }),
          flows: me(5.2),
        },
      },
      {
        short: `Averages lie`,
        chapter: `insight`,
        title: `Averages hide the pain`,
        body: [
          `Back at 70% busy, most requests are quick — but a few get stuck behind slow work. The <em>average</em> here is about 180 ms, which looks healthy: it blends the slow few away.`,
          `So we measure <span class="term">percentiles</span>: <b>p50</b> is the time half of requests beat; <b>p99</b> is the time only 1 in 100 exceeds.`,
        ],
        callout: {
          kind: `warn`,
          text: `A page that makes 30 requests hits the p99 on about 1 load in 4 (1 − 0.99³⁰ ≈ 26%). Tail latency is what users actually feel.`,
        },
        changes: [
          `~ Back to 7,000 users`,
          `+ Occasional slow requests (amber)`,
          `~ p99 latency 4.2 s → 600 ms`,
        ],
        metrics: { p50: 160, p99: 600, throughput: 350, util: 70 },
        scene: {
          entities: {
            users: ue(11, `7,000 users`),
            srv: de(makeCool(0.7)),
            q: makeQueue(0, -2.9, 2),
            chart: makePanel(
              { x: 0, y: 0, z: 0, dx: 92, dy: -150 },
              `Percentiles`,
              [
                `avg   180 ms   looks fine`,
                `p50   160 ms   half are faster`,
                `! p99   600 ms   1 in 100 is slower`,
                `# the average hides the slow 1%`,
              ],
              { icon: `activity` },
            ),
          },
          links: fe(),
          flows: me(3.4, { pattern: [`req`, `req`, `req`, `req`, `req`, `req`, `slow`] }),
        },
      },
      {
        short: `Add capacity`,
        chapter: `solution`,
        title: `Add capacity, buy back latency`,
        body: [
          `Double the server’s cores and the same 350 req/s is now only 35% of its capacity. The queue drains and both p50 and p99 fall.`,
          `Throughput didn’t change — demand didn’t change. What changed is <b>how much headroom</b> there is to absorb bursts.`,
        ],
        callout: {
          kind: `tip`,
          text: `To lower latency under load, lower utilization: more capacity, or less work per request.`,
        },
        changes: [
          `~ Server 4 → 8 cores`,
          `~ Utilization 70% → 35%`,
          `− Queue gone`,
          `~ p99 latency 600 → 190 ms`,
        ],
        metrics: { p50: 120, p99: 190, throughput: 350, util: 35 },
        scene: {
          entities: {
            users: ue(11, `7,000 users`),
            srv: de({ s: 5, h: 62, ...makeCool(0.35) }),
            q: makeQueue(0, -3.4, 0),
            chart: pe(0.35),
          },
          links: fe(),
          flows: me(3.4),
        },
      },
      {
        short: `Distance`,
        chapter: `insight`,
        title: `Distance is latency too`,
        body: [
          `Now move the server across an ocean. Nothing about it got slower, yet every round trip takes longer — watch the dots travel.`,
          `Light in fiber covers about 200 km per millisecond. New York ↔ London is ~5,600 km: at least 56 ms per round trip, closer to 75 ms in practice.`,
        ],
        callout: {
          kind: `insight`,
          text: `No server upgrade beats physics. To cut this latency, move the data closer to users (caches, CDNs, regions).`,
        },
        changes: [
          `~ Server moved: New York → London`,
          `+ ~75 ms per round trip`,
          `~ p50 latency 120 → 195 ms`,
        ],
        metrics: { p50: 195, p99: 265, throughput: 350, util: 35 },
        scene: {
          entities: {
            users: ue(11, `7,000 users`, { label: `users in New York` }),
            srv: de({ s: 5, h: 62, ...makeCool(0.35), y: 14, tags: [{ text: `London`, icon: `globe` }] }),
          },
          links: fe({ label: `+ 75 ms each round trip`, labelTone: `amber` }),
          flows: me(3.4),
        },
      },
      {
        short: `In flight`,
        chapter: `insight`,
        title: `Little’s Law: how much is in flight`,
        body: [
          `A simple rule ties the numbers together: <span class="term">requests in flight = throughput × latency</span>. At 350 req/s and 0.12 s each, about 42 requests are being worked on at any moment.`,
          `Each in-flight request holds a thread, a connection or some memory. If latency rises to 1 s at the same throughput, 350 are in flight — and pools sized for 50 run dry.`,
        ],
        callout: {
          kind: `tip`,
          text: `Use it to size thread pools, connection pools and worker counts — and to see why slow dependencies exhaust them.`,
        },
        changes: [`+ In flight ≈ 42 requests`],
        metrics: { p50: 120, p99: 190, throughput: 350, util: 35 },
        scene: {
          entities: {
            users: ue(11, `7,000 users`),
            srv: de({
              s: 5,
              h: 62,
              ...makeCool(0.35),
              tags: [{ text: `≈ 42 in flight`, icon: `layers` }],
            }),
            chart: makePanel(
              { x: 0, y: 0, z: 0, dx: 92, dy: -150 },
              `Little’s Law`,
              [
                `in flight = throughput × latency`,
                `350 req/s × 0.12 s ≈ 42`,
                `! latency 1 s → 350 in flight`,
              ],
              { icon: `layers` },
            ),
          },
          links: fe(),
          flows: me(3.4),
        },
      },
      {
        short: `Fan-out`,
        chapter: `problem`,
        title: `One request, many servers`,
        body: [
          `A search page asks <b>100</b> index servers in parallel and must wait for the slowest. Each server is quick 99% of the time — but with 100 of them, a page usually hits at least one slow one.`,
          `1 − 0.99¹⁰⁰ ≈ <b>63%</b> of searches wait on someone’s p99. A rare tail on one server becomes the common case for the whole page.`,
        ],
        callout: {
          kind: `tip`,
          text: `Fix the tail with hedged requests: if a server hasn’t answered by its p95, send the same request to a replica and take whichever answers first.`,
        },
        changes: [
          `+ 100 index servers (6 shown)`,
          `~ Page waits for the slowest`,
          `~ p99 of one server → typical page`,
        ],
        metrics: { p50: 380, p99: 900, throughput: 350, util: 40 },
        scene: {
          entities: {
            users: ue(11, `7,000 searches`),
            srv: de({ s: 5, h: 62, label: [`Search`], sub: `fan-out`, ...makeCool(0.4) }),
            ...Object.fromEntries(
              [-12, -4, 4, 12].map((e, t) => [
                `ix${t}`,
                makeBlock(e, 12, {
                  s: 3.4,
                  h: 36,
                  label: [],
                  ...(t === 2
                    ? {
                        heat: 0.6,
                        tags: [{ text: `slow this time`, tone: `amber`, icon: `hourglass` }],
                      }
                    : {}),
                }),
              ]),
            ),
            chart: makePanel(
              { x: 0, y: 0, z: 0, dx: -360, dy: -160 },
              `Waiting for the slowest`,
              [
                `each server slow 1% of the time`,
                `1 server:   1% of pages slow`,
                `! 100 servers: 1 − 0.99¹⁰⁰ ≈ 63%`,
              ],
              { icon: `activity` },
            ),
          },
          links: {
            ...fe(),
            ...Object.fromEntries(
              [-12, -4, 4, 12].map((e, t) => [
                `f${t}`,
                makeLink(`srv`, `ix${t}`, [`srv`, [e, `srv`], `ix${t}`], { heads: `both` }),
              ]),
            ),
          },
          flows: [
            ...me(1.6),
            {
              fanout: !0,
              routes: [0, 1, 3].map((e) => ({ path: [`f${e}`] })),
              rate: 0.7,
              bounce: !0,
            },
            { route: [`f4`], rate: 0.7, bounce: !0, hold: 1.3, kind: `slow` },
          ],
        },
      },
      {
        short: `Batching`,
        chapter: `tradeoff`,
        title: `Batching: more throughput, a bit more latency`,
        body: [
          `Writing analytics events one row at a time, the database manages about 2,000 inserts per second — most of the cost is per-statement overhead.`,
          `Group them: collect events for up to 50 ms and write 100 rows in one statement (the big squares). Throughput jumps 25×, while each event waits up to 50 ms longer.`,
        ],
        callout: {
          kind: `insight`,
          text: `Batching trades latency for throughput. Great for logs, analytics and bulk imports; wrong for a user waiting on a click.`,
        },
        changes: [
          `+ Events batched: 100 rows / 50 ms`,
          `~ 2,000 → 50,000 rows/s`,
          `~ Each event waits ≤ 50 ms`,
        ],
        metrics: { p50: 140, p99: 210, throughput: 5e4, util: 35 },
        scene: {
          entities: {
            users: ue(11, `events from apps`),
            srv: de({
              s: 5,
              h: 62,
              label: [`Event`, `Writer`],
              ...makeCool(0.35),
              tags: [{ text: `batch: 100 rows / 50 ms`, icon: `layers` }],
            }),
            db: makeDb(13, 0, { label: `database` }),
            chart: makePanel(
              { x: 0, y: 0, z: 0, dx: 92, dy: -150 },
              `Rows per second`,
              [
                `1 row per INSERT      2,000 / s`,
                `= 100 rows per INSERT  50,000 / s`,
                `! each row waits ≤ 50 ms`,
              ],
              { icon: `layers` },
            ),
          },
          links: { ...fe(), w: makeLink(`srv`, `db`, [`srv`, `db`], { label: `INSERT 100 rows` }) },
          flows: [...me(3.4), { route: [`w`], kind: `heavy`, rate: 0.7 }],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>Latency</b> is time per request; <b>throughput</b> is requests per second.</li>
          <li>Latency explodes as utilization nears 100% — keep <b>headroom</b>.</li>
          <li>Watch <b>p99</b>, not the average: the tail is what users feel.</li>
          <li><b>Distance</b> adds latency no server can remove.</li>
          <li><b>In flight = throughput × latency</b>; fan-out turns rare tails into common ones.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Napkin Math</b> — estimating how much capacity you need before you build anything.`,
        },
        metrics: { p50: 120, p99: 190, throughput: 350, util: 35 },
        scene: {
          entities: {
            users: ue(11, `7,000 users`),
            srv: de({ s: 5, h: 62, ...makeCool(0.35) }),
            chart: pe(0.35),
          },
          links: fe(),
          flows: me(3.4),
        },
      },
    ],
  };

export default latencyThroughputLesson;
