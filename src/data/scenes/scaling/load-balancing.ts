// @ts-nocheck
import {
  DEAD_STATE,
  makeBalancer,
  makeBlock,
  makeCool,
  makeCrowd,
  makeHot,
  makeLink
} from '@/lib/simulator/scene-builders';

const Ue = { x0: -4.5, x1: 4.5, y0: -17, y1: -11 };

const We = { x0: -4.5, x1: 4.5, y0: -24, y1: -18 };

const Ge = [`la`, `lbb`, `lc`];

const Ke = (e = {}) => ({
    a: makeBlock(-7, 0, { label: [`Server A`], ...makeCool(0.34), ...(e.a || {}) }),
    b: makeBlock(0, 0, { label: [`Server B`], ...makeCool(0.36), ...(e.b || {}) }),
    c: makeBlock(7, 0, { label: [`Server C`], ...makeCool(0.33), ...(e.c || {}) }),
  });

const qe = (e = `lb`, t = { a: `la`, b: `lbb`, c: `lc` }, n = {}) => ({
    [t.a]: makeLink(e, `a`, [e, [`a`, e], `a`], n.a),
    [t.b]: makeLink(e, `b`, [e, `b`], n.b),
    [t.c]: makeLink(e, `c`, [e, [`c`, e], `c`], n.c),
  });

const Je = (e = `lb`, t = `ul`, n = {}) => ({ [t]: makeLink(`users`, e, [`users`, e], n) });

const Ye = (e = We) => makeCrowd(e, 15, `200,000 users`);

const Xe = (e = 4.5, t = {}) => [{ route: [`ul`, Ge], pick: `rr`, rate: e, ...t }];

export const loadBalancingLesson = {
    id: `load-balancing`,
    title: `Load Balancing`,
    summary: `One front door for many servers — and the rules for who gets which request.`,
    minutes: 12,
    level: `beginner`,
    metrics: [`users`, `rps`, `p95`, `errors`, `healthy`],
    legend: [`req`, `heavy`, `ping`, `fail`],
    goals: [
      { text: `Why a pool of servers needs one front door`, step: 1 },
      { text: `Round robin vs least connections`, step: 4 },
      { text: `Health checks that route around failure`, step: 5 },
      { text: `Removing the load balancer as a SPOF`, step: 8 },
      { text: `Layer-7 routing and zero-downtime deploys`, step: 9 },
    ],
    steps: [
      {
        short: `Hot spot`,
        chapter: `problem`,
        title: `Three servers, one address`,
        body: [
          `We scaled out to three servers — but users only know one address, the one in DNS. Every request lands on Server B while A and C sit idle.`,
          `The extra hardware bought us nothing. We need a single front door that spreads requests across all of them.`,
        ],
        callout: {
          kind: `warn`,
          text: `Adding servers only helps if traffic actually reaches them.`,
        },
        metrics: { users: 2e5, rps: 6e3, p95: 1800, errors: 12, healthy: `3 / 3` },
        scene: {
          entities: { users: Ye(Ue), ...Ke({ a: makeCool(0.03), b: makeHot(1), c: makeCool(0.03) }) },
          links: { ub: makeLink(`users`, `b`, [`users`, `b`], { fail: 0.22 }) },
          flows: [{ route: [`ub`], rate: 6 }],
        },
      },
      {
        short: `Add an LB`,
        chapter: `solution`,
        title: `Put a load balancer in front`,
        body: [
          `A <span class="term">load balancer</span> (LB) becomes the one public address of the service. Clients connect to it; it forwards each request to one of the servers behind it and relays the answer back.`,
          `Servers can now come and go without clients ever knowing.`,
        ],
        callout: {
          kind: `insight`,
          text: `The servers behind a load balancer are called its <b>pool</b> (or target group).`,
        },
        changes: [
          `+ Load balancer`,
          `~ Users now talk to the LB, not to servers`,
          `~ CPU 3 / 100 / 3% → ~35% each`,
        ],
        metrics: { users: 2e5, rps: 6e3, p95: 90, errors: 0, healthy: `3 / 3` },
        scene: {
          entities: { users: Ye(), lb: makeBalancer(0, -9), ...Ke() },
          links: { ...Je(), ...qe() },
          flows: Xe(4.5),
        },
      },
      {
        short: `Round robin`,
        chapter: `technique`,
        title: `Round robin: take turns`,
        body: [
          `How does the LB choose? The simplest rule is <span class="term">round robin</span>: A, then B, then C, then A again. Watch the requests go out in turn.`,
          `It’s cheap and fair — as long as the servers are equally powerful and every request costs about the same.`,
        ],
        callout: {
          kind: `tip`,
          text: `<b>Weighted</b> round robin gives bigger servers a bigger share, e.g. A : B : C = 2 : 1 : 1.`,
        },
        changes: [`~ Strategy: round robin`, `~ Slowed down so you can follow each request`],
        metrics: { users: 2e5, rps: 6e3, p95: 90, errors: 0, healthy: `3 / 3` },
        scene: {
          entities: {
            users: Ye(),
            lb: makeBalancer(0, -9, { tags: [{ text: `round robin`, icon: `replay` }] }),
            ...Ke(),
          },
          links: { ...Je(), ...qe() },
          flows: Xe(1.6),
        },
      },
      {
        short: `Heavy work`,
        chapter: `problem`,
        title: `When requests aren’t equal`,
        body: [
          `Real traffic is lumpy. Loading a page takes 5 ms; exporting a year of reports takes 5 seconds. Round robin counts <em>requests</em>, not <em>work</em>.`,
          `Here every third request is heavy (the big squares), and by luck of the rotation they all land on Server B. It drowns while A and C coast.`,
        ],
        callout: { kind: `warn`, text: `Round robin has no idea how busy a server actually is.` },
        changes: [`+ Heavy requests`, `~ Server B CPU 36% → 97%`, `~ p95 latency 90 ms → 1.2 s`],
        metrics: { users: 2e5, rps: 6e3, p95: 1200, errors: 3, healthy: `3 / 3` },
        scene: {
          entities: {
            users: Ye(),
            lb: makeBalancer(0, -9, { tags: [{ text: `round robin`, icon: `replay` }] }),
            ...Ke({
              a: makeCool(0.24),
              b: { ...makeHot(0.97), tags: [{ text: `23 queued`, tone: `red` }] },
              c: makeCool(0.25),
            }),
          },
          links: { ...Je(), ...qe() },
          flows: Xe(3.2, { pattern: [`req`, `heavy`, `req`] }),
        },
      },
      {
        short: `Least conns`,
        chapter: `technique`,
        title: `Least connections`,
        body: [
          `With <span class="term">least connections</span>, the LB tracks how many requests each server is busy with and sends the next one to the least busy.`,
          `A server stuck on slow work holds more open connections, so it automatically receives less new work. The load evens out.`,
        ],
        callout: {
          kind: `tip`,
          text: `Other strategies: <b>least response time</b>, <b>IP hash</b> (same client → same server) and <b>power of two choices</b> (pick two at random, use the less busy).`,
        },
        changes: [
          `~ Strategy: least connections`,
          `~ Server B CPU 97% → 52%`,
          `~ p95 latency 1.2 s → 140 ms`,
        ],
        metrics: { users: 2e5, rps: 6e3, p95: 140, errors: 0, healthy: `3 / 3` },
        scene: {
          entities: {
            users: Ye(),
            lb: makeBalancer(0, -9, { tags: [{ text: `least connections`, icon: `gauge` }] }),
            ...Ke({
              a: { ...makeCool(0.5), tags: [{ text: `4 active` }] },
              b: { ...makeCool(0.52), tags: [{ text: `9 active` }] },
              c: { ...makeCool(0.48), tags: [{ text: `4 active` }] },
            }),
          },
          links: { ...Je(), ...qe() },
          flows: [
            {
              route: [`ul`, Ge],
              pick: `weights`,
              weights: [0.42, 0.16, 0.42],
              rate: 3.2,
              pattern: [`req`, `heavy`, `req`],
            },
          ],
        },
      },
      {
        short: `Health checks`,
        chapter: `technique`,
        title: `Health checks route around failure`,
        body: [
          `Every few seconds the LB probes each server — say <code>GET /health</code>. A server that misses several checks in a row is pulled out of the pool; once it recovers, it’s put back.`,
          `Server C just crashed, and users didn’t notice a thing. In the last lesson, a dead server meant errors for a quarter of them.`,
        ],
        callout: {
          kind: `insight`,
          text: `Health checks plus spare servers mean no single server is a single point of failure any more.`,
        },
        changes: [
          `− Server C down`,
          `+ Health checks (green rings)`,
          `~ C taken out of the pool`,
          `~ Errors stay at 0%`,
        ],
        metrics: { users: 2e5, rps: 6e3, p95: 150, errors: 0, healthy: `2 / 3` },
        scene: {
          entities: {
            users: Ye(),
            lb: makeBalancer(0, -9, { tags: [{ text: `least connections`, icon: `gauge` }] }),
            ...Ke({
              a: makeCool(0.55),
              b: makeCool(0.57),
              c: { ...DEAD_STATE, tags: [{ text: `out of pool`, tone: `gray`, icon: `alert` }] },
            }),
          },
          links: { ...Je(), ...qe(`lb`, void 0, { c: { style: `off`, fail: 1 } }) },
          flows: [
            { route: [`ul`, Ge], pick: `weights`, weights: [0.5, 0.5, 0], rate: 3.4 },
            { route: [`la`], kind: `ping`, bounce: !0, rate: 0.55 },
            { route: [`lbb`], kind: `ping`, bounce: !0, rate: 0.55 },
            { route: [`lc`], kind: `ping`, bounce: !0, rate: 0.55 },
          ],
        },
      },
      {
        short: `LB fails`,
        chapter: `problem`,
        title: `Who balances the balancer?`,
        body: [
          `We removed one single point of failure and created another. Every request now passes through one load balancer — when it dies, so does everything behind it.`,
          `The servers are perfectly healthy. Nobody can reach them.`,
        ],
        callout: {
          kind: `warn`,
          text: `Anything that every request depends on must itself be redundant.`,
        },
        changes: [`− Load balancer down`, `~ Errors 0% → 100%`],
        metrics: { users: 2e5, rps: 6e3, p95: null, errors: 100, healthy: `3 / 3` },
        scene: {
          entities: { users: Ye(), lb: makeBalancer(0, -9, DEAD_STATE), ...Ke({ a: makeCool(0.02), b: makeCool(0.02), c: makeCool(0.02) }) },
          links: {
            ...Je(`lb`, `ul`, { fail: 1 }),
            ...qe(`lb`, void 0, { a: { style: `off` }, b: { style: `off` }, c: { style: `off` } }),
          },
          flows: [{ route: [`ul`], rate: 5 }],
        },
      },
      {
        short: `Standby`,
        chapter: `solution`,
        title: `Add a standby`,
        body: [
          `Run two load balancers: an <b>active</b> one serving traffic and a <b>passive</b> standby. They share a <span class="term">virtual IP</span> (VIP) — the address clients actually use — and exchange heartbeats every second.`,
        ],
        callout: {
          kind: `tip`,
          text: `Cloud load balancers (AWS ELB, Google Cloud LB…) do this for you: they run redundantly across machines and zones.`,
        },
        changes: [
          `+ Standby load balancer`,
          `+ Heartbeats between the pair`,
          `~ Active LB owns the VIP`,
        ],
        metrics: { users: 2e5, rps: 6e3, p95: 90, errors: 0, healthy: `3 / 3` },
        scene: {
          entities: {
            users: Ye(),
            lb: makeBalancer(0, -9, { tags: [{ text: `ACTIVE · VIP`, tone: `green`, icon: `globe` }] }),
            lb2: makeBalancer(-14, -9, {
              label: [`Standby`, `LB`],
              dim: 1,
              pills: `above`,
              tags: [{ text: `STANDBY`, tone: `gray` }],
            }),
            ...Ke(),
          },
          links: {
            ...Je(),
            ...qe(),
            beat: makeLink(
              `lb2`,
              `lb`,
              [
                [`lb2`, `lb-1.5`],
                [`lb`, `lb-1.5`],
              ],
              { style: `beat`, heads: `none` },
            ),
          },
          flows: [...Xe(4.2), { route: [`beat`], kind: `ping`, bounce: !0, rate: 0.8 }],
        },
      },
      {
        short: `Failover`,
        chapter: `solution`,
        title: `Failover in seconds`,
        body: [
          `The active LB dies. The standby notices the missing heartbeats, claims the virtual IP and starts forwarding traffic.`,
          `Clients keep using the same address. At worst, a few in-flight requests are retried.`,
        ],
        callout: {
          kind: `insight`,
          text: `This pattern — <b>active–passive failover</b> — protects databases, caches and queues too.`,
        },
        changes: [
          `− Active LB down`,
          `~ Standby promoted to active`,
          `~ VIP moved to the new active LB`,
        ],
        metrics: { users: 2e5, rps: 6e3, p95: 95, errors: 0, healthy: `3 / 3` },
        scene: {
          entities: {
            users: Ye(),
            lb2: makeBalancer(0, -9, { tags: [{ text: `ACTIVE · VIP`, tone: `green`, icon: `globe` }] }),
            ...Ke(),
          },
          links: { ...Je(`lb2`, `ul2`), ...qe(`lb2`, { a: `la2`, b: `lbb2`, c: `lc2` }) },
          flows: [{ route: [`ul2`, [`la2`, `lbb2`, `lc2`]], pick: `rr`, rate: 4.2 }],
        },
      },
      {
        short: `By path`,
        chapter: `technique`,
        title: `Route by what’s in the request`,
        body: [
          `Load balancers come in two kinds. A <b>layer 4</b> balancer only sees IP addresses and ports, and forwards whole connections. A <b>layer 7</b> balancer reads the HTTP request itself.`,
          `That lets it route by path: <code>/api/*</code> to the API servers, <code>/images/*</code> to a separate image service — each pool scaled and deployed on its own.`,
        ],
        callout: {
          kind: `tip`,
          text: `L7 balancers can also route by host name, header or cookie, terminate TLS, and add caching or compression.`,
        },
        changes: [`~ LB routes by URL path`, `~ Server C → image service`],
        metrics: { users: 2e5, rps: 6e3, p95: 85, errors: 0, healthy: `3 / 3` },
        scene: {
          entities: {
            users: Ye(),
            lb2: makeBalancer(0, -9, {
              tags: [{ text: `L7 · routes by path`, tone: `green`, icon: `split` }],
            }),
            a: makeBlock(-7, 0, { label: [`API A`], ...makeCool(0.4) }),
            b: makeBlock(0, 0, { label: [`API B`], ...makeCool(0.42) }),
            c: makeBlock(7, 0, { color: `yellow`, glyph: `file`, label: [`Images`], ...makeCool(0.3) }),
          },
          links: {
            ...Je(`lb2`, `ul2`),
            ...qe(
              `lb2`,
              { a: `la2`, b: `lbb2`, c: `lc2` },
              { a: { label: `/api/*`, labelAt: 0.45 }, c: { label: `/images/*`, labelAt: 0.45 } },
            ),
          },
          flows: [
            {
              route: [`ul2`, [`la2`, `lbb2`, `lc2`]],
              pick: `weights`,
              weights: [0.35, 0.35, 0.3],
              rate: 4.2,
            },
          ],
        },
      },
      {
        short: `Deploy`,
        chapter: `technique`,
        title: `Case: deploying without downtime`,
        body: [
          `Time to ship version 2. A <span class="term">rolling deploy</span> updates one server at a time: the load balancer first <b>drains</b> it — no new requests, but in-flight ones finish — then it’s updated, passes its health check and rejoins.`,
          `Here C is already on v2, B is draining, and A waits its turn. Users never see an error.`,
        ],
        callout: {
          kind: `tip`,
          text: `Blue-green deploys go further: bring up a full v2 pool, then switch the load balancer over at once — and back, if anything looks wrong.`,
        },
        changes: [`~ C updated to v2`, `~ B draining, then updating`, `~ A still on v1`],
        metrics: { users: 2e5, rps: 6e3, p95: 95, errors: 0, healthy: `2 / 3` },
        scene: {
          entities: {
            users: Ye(),
            lb2: makeBalancer(0, -9, { tags: [{ text: `rolling deploy`, tone: `green`, icon: `replay` }] }),
            a: makeBlock(-7, 0, {
              label: [`Server A`],
              ...makeCool(0.5),
              tags: [{ text: `v1 · next`, tone: `gray` }],
            }),
            b: makeBlock(0, 0, {
              label: [`Server B`],
              dim: 1,
              cpu: 0.05,
              tags: [{ text: `draining → v2`, tone: `amber`, icon: `hourglass` }],
            }),
            c: makeBlock(7, 0, {
              label: [`Server C`],
              ...makeCool(0.5),
              tags: [{ text: `v2 ✓`, tone: `green`, icon: `check` }],
            }),
          },
          links: {
            ...Je(`lb2`, `ul2`),
            ...qe(`lb2`, { a: `la2`, b: `lbb2`, c: `lc2` }, { b: { style: `off` } }),
          },
          flows: [{ route: [`ul2`, [`la2`, `lc2`]], pick: `rr`, rate: 4.2 }],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>A load balancer gives a pool of servers <b>one stable address</b>.</li>
          <li><b>Round robin</b> is simple; <b>least connections</b> adapts to uneven work.</li>
          <li><b>Health checks</b> pull dead servers out of the pool automatically.</li>
          <li>The LB must be redundant too: <b>active–passive</b> with a shared VIP.</li>
          <li><b>L7</b> balancers route by path; <b>draining</b> enables zero-downtime deploys.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Stateless Services</b> — what breaks when a user’s next request lands on a different server.`,
        },
        metrics: { users: 2e5, rps: 6e3, p95: 90, errors: 0, healthy: `3 / 3` },
        scene: {
          entities: {
            users: Ye(),
            lb2: makeBalancer(0, -9, { tags: [{ text: `VIP`, tone: `green`, icon: `globe` }] }),
            ...Ke(),
          },
          links: { ...Je(`lb2`, `ul2`), ...qe(`lb2`, { a: `la2`, b: `lbb2`, c: `lc2` }) },
          flows: [{ route: [`ul2`, [`la2`, `lbb2`, `lc2`]], pick: `rr`, rate: 4.2 }],
        },
      },
    ],
  };

export default loadBalancingLesson;
