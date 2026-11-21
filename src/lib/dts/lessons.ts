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
} from './scene-builders';

import {
  consistentHashingLesson,
  uniqueIdsLesson,
  capLesson,
  consensusLesson,
  transactionsLesson,
  filesLesson,
  apisLesson,
  queuesLesson,
  pubsubLesson,
  realtimeLesson,
  redundancyLesson,
  rateLimitingLesson,
  timeoutsRetriesLesson,
  observabilityLesson,
  serviceDiscoveryLesson,
  sagasLesson,
  batchStreamLesson,
  authenticationLesson,
  authorizationLesson,
  encryptionLesson,
  testingLesson,
  cicdLesson,
  hldLldLesson,
  designUrlShortenerLesson,
  designNewsFeedLesson,
  designChatLesson,
} from './runtime-curriculum';


/* eslint-disable */
export const requestLifecycleLesson = {
    id: `request-lifecycle`,
    title: `How a Request Travels`,
    summary: `Follow one page load hop by hop — and find out where the time really goes.`,
    minutes: 10,
    level: `beginner`,
    metrics: [`dns`, `connect`, `request`, `download`, `total`],
    legend: [`req`, `res`, [`ping`, `handshake`]],
    goals: [
      { text: `What DNS does and why it is cached`, step: 1 },
      { text: `Why a connection costs round trips`, step: 2 },
      { text: `The path: browser → server → database → back`, step: 4 },
      { text: `Where page-load time actually goes`, step: 6 },
      { text: `Cases: a slow query and a distant user`, step: 8 },
    ],
    steps: [
      {
        short: `Hit Enter`,
        chapter: `problem`,
        title: `Users say the shop feels slow`,
        body: [
          `Before you can make something faster, you need to know where the time goes. So let’s follow a single page load.`,
          `You type <code>shop.example</code> and press Enter. About a sixth of a second later the page appears. A lot happens in between.`,
        ],
        callout: {
          kind: `insight`,
          text: `Every web request is a conversation between machines. Each step costs time, and the costs add up.`,
        },
        metrics: { dns: null, connect: null, request: null, download: null, total: null },
        scene: { entities: { dev: te([ae]) }, links: {}, flows: [] },
      },
      {
        short: `Find address`,
        chapter: `technique`,
        title: `Find the address (DNS)`,
        body: [
          `Networks route by numeric IP address, not by name. So the browser first asks a <span class="term">DNS</span> resolver: <em>where is shop.example?</em>`,
          `The answer — <code>203.0.113.7</code> — comes back in about 20 ms.`,
        ],
        callout: {
          kind: `tip`,
          text: `Answers are cached for a time-to-live (TTL). For the next few minutes, repeat visits skip this step entirely.`,
        },
        changes: [`+ DNS resolver`, `+ Lookup: 20 ms`],
        metrics: { dns: 20, connect: null, request: null, download: null, total: 20 },
        scene: {
          entities: {
            dev: te([ae]),
            dns: ne({ tags: [{ text: `→ 203.0.113.7`, tone: `amber` }] }),
          },
          links: { q: C.dns() },
          flows: [{ route: [`q`], bounce: !0, rate: 0.8 }],
        },
      },
      {
        short: `Connect`,
        chapter: `technique`,
        title: `Open a connection`,
        body: [
          `Now the browser opens a connection to <code>203.0.113.7</code>. A TCP handshake agrees to talk; a TLS handshake sets up encryption. Each needs a <span class="term">round trip</span> — there and back.`,
          `Here a round trip takes 30 ms, so connecting costs 60 ms before a single byte of the page is requested.`,
        ],
        callout: {
          kind: `insight`,
          text: `Round-trip time (RTT) is set by distance and the network, not by how fast your server is.`,
        },
        changes: [`+ Web server`, `~ DNS answer cached`, `+ Handshake: 2 round trips = 60 ms`],
        metrics: { dns: 20, connect: 60, request: null, download: null, total: 80 },
        scene: {
          entities: { dev: te([ae]), dns: ne({ tags: [{ text: `→ 203.0.113.7`, tone: `amber` }] }), web: re() },
          links: { q: oe, h: C.web({ label: `TCP + TLS handshake` }) },
          flows: [{ route: [`h`], kind: `ping`, bounce: !0, rate: 1.3 }],
        },
      },
      {
        short: `Request`,
        chapter: `technique`,
        title: `Send the request`,
        body: [
          `Over the open connection the browser sends <code>GET /products</code>. The server parses it, checks the session and runs your code.`,
          `That costs one more round trip plus ~10 ms of server work.`,
        ],
        changes: [`+ Request: 1 round trip + 10 ms server time`],
        metrics: { dns: 20, connect: 60, request: 40, download: null, total: 120 },
        scene: {
          entities: { dev: te([ae]), dns: ne(), web: re({ cpu: 0.3 }) },
          links: { q: oe, h: C.web({ label: `GET /products` }) },
          flows: [{ route: [`h`], bounce: !0, rate: 0.9 }],
        },
      },
      {
        short: `Fetch data`,
        chapter: `technique`,
        title: `The server asks the database`,
        body: [
          `The products don’t live in the web server — they live in a <span class="term">database</span>. The server sends a query and waits for the rows to come back.`,
          `Watch a request travel all the way in and the response all the way out.`,
        ],
        callout: {
          kind: `tip`,
          text: `Keeping the server stateless and the data in a database is what later lets us run many servers. (See Scaling.)`,
        },
        changes: [`+ Database`, `+ Query: 15 ms`],
        metrics: { dns: 20, connect: 60, request: 55, download: null, total: 135 },
        scene: {
          entities: { dev: te([ae]), dns: ne(), web: re({ cpu: 0.3 }), db: ie() },
          links: { q: oe, h: C.web({ label: `GET /products` }), s: C.db() },
          flows: [{ route: [`h`, `s`], bounce: !0, rate: 0.9 }],
        },
      },
      {
        short: `Response`,
        chapter: `solution`,
        title: `The response comes home`,
        body: [
          `The server turns rows into HTML and sends it back; downloading it takes another 20 ms. The browser renders the page — <b>155 ms</b> after you pressed Enter.`,
          `Then it notices images and stylesheets in the page and fires off more requests. Reusing the open connection saves them the handshake.`,
        ],
        changes: [`+ Download: 20 ms`, `~ Page ready after 155 ms`],
        metrics: { dns: 20, connect: 60, request: 55, download: 20, total: 155 },
        scene: {
          entities: {
            dev: te([{ text: `page ready · 155 ms`, tone: `green`, icon: `check` }]),
            dns: ne(),
            web: re({ cpu: 0.3 }),
            db: ie(),
          },
          links: { q: oe, h: C.web({ label: `HTML · 120 KB` }), s: C.db() },
          flows: [{ route: [`h`, `s`], bounce: !0, rate: 1.1 }],
        },
      },
      {
        short: `More files`,
        chapter: `technique`,
        title: `One page, forty more requests`,
        body: [
          `The HTML is only the start. It references images, stylesheets, scripts and fonts — about <b>40 more files</b> — and the browser fetches them all.`,
          `With old HTTP/1.1 each connection carried one request at a time, so browsers opened ~6 connections and queued the rest. <span class="term">HTTP/2</span> sends them all at once over the single connection we already opened.`,
        ],
        callout: {
          kind: `tip`,
          text: `Fewer, smaller files still help: bundle scripts, compress text (gzip/brotli), use modern image formats, and lazy-load what’s below the fold.`,
        },
        changes: [
          `+ 40 more requests: images, CSS, JS, fonts`,
          `~ All multiplexed over one HTTP/2 connection`,
          `~ Fully loaded after 275 ms`,
        ],
        metrics: { dns: 20, connect: 60, request: 55, download: 140, total: 275 },
        scene: {
          entities: {
            dev: te([{ text: `40 files · 1 connection`, tone: `violet`, icon: `layers` }]),
            dns: ne(),
            web: re({ cpu: 0.35 }),
            db: ie(),
          },
          links: { q: oe, h: C.web({ label: `HTTP/2 · many requests at once` }), s: C.db() },
          flows: [{ route: [`h`], bounce: !0, rate: 4.2, speed: 1.2 }],
        },
      },
      {
        short: `Slow query`,
        chapter: `problem`,
        title: `Case: one slow query`,
        body: [
          `A new “recommended for you” box ships. Its query sorts every product by a score on each page view, and the database now takes <b>400 ms</b> to answer.`,
          `Same network, same handshakes — but the page jumps from 155 ms to over half a second. Watch requests wait at the database.`,
        ],
        callout: {
          kind: `insight`,
          text: `Measure before optimising. Here the network is fine; the fix is in the database (see the Indexes lesson).`,
        },
        changes: [
          `+ “Recommended” query on every page`,
          `~ Database time 15 → 400 ms`,
          `~ Total 155 → 540 ms`,
        ],
        metrics: { dns: 20, connect: 60, request: 440, download: 20, total: 540 },
        scene: {
          entities: {
            dev: te([ae]),
            dns: ne(),
            web: re({ cpu: 0.3 }),
            db: ie({
              heat: 0.7,
              tags: [{ text: `400 ms · scanning`, tone: `red`, icon: `hourglass` }],
            }),
          },
          links: {
            q: oe,
            h: C.web({ label: `GET /products` }),
            s: C.db({ label: `ORDER BY score · 400 ms`, labelTone: `red` }),
          },
          flows: [{ route: [`h`, `s`], bounce: !0, rate: 0.6, hold: 1.4 }],
        },
      },
      {
        short: `Far away`,
        chapter: `problem`,
        title: `Case: a user in Sydney`,
        body: [
          `Back to the fast query. Now the same page is opened in Sydney, while the server is in Virginia: every round trip takes about <b>200 ms</b> instead of 30.`,
          `Two handshake round trips plus the request round trip cost 600 ms before the page even downloads. Same server, same code — over 4× slower.`,
        ],
        callout: {
          kind: `tip`,
          text: `Cut round trips (TLS 1.3, HTTP/3, keep connections open) and move content closer to users (CDNs, regions — Module 02).`,
        },
        changes: [
          `~ User in Sydney · 200 ms per round trip`,
          `~ Connect 60 → 400 ms`,
          `~ Total 155 → 705 ms`,
        ],
        metrics: { dns: 20, connect: 400, request: 225, download: 60, total: 705 },
        scene: {
          entities: {
            dev: y(0, -26, { label: `you · Sydney`, tags: [ae] }),
            dns: ne(),
            web: re({ tags: [{ text: `Virginia`, icon: `globe` }] }),
            db: ie(),
          },
          links: {
            q: oe,
            h: C.web({ label: `≈ 200 ms per round trip`, labelTone: `amber` }),
            s: C.db(),
          },
          flows: [{ route: [`h`, `s`], bounce: !0, rate: 0.9, speed: 0.55 }],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Where the time went`,
        body: [
          `Of 155 ms, only about 25 ms was the server and database actually working. The other <b>~130 ms</b> was messages crossing the network.`,
          `<ul class="takeaways">
          <li><b>DNS</b> turns names into addresses; answers are cached.</li>
          <li>Connections cost <b>round trips</b> — reuse them.</li>
          <li>Server code is often the smallest slice of latency — unless a <b>slow query</b> sneaks in.</li>
          <li><b>Distance</b> multiplies every round trip.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Latency & Throughput</b> — what happens to that 155 ms when thousands of users arrive at once.`,
        },
        metrics: { dns: 20, connect: 60, request: 55, download: 20, total: 155 },
        scene: {
          entities: {
            dev: te([{ text: `page ready · 155 ms`, tone: `green`, icon: `check` }]),
            dns: ne(),
            web: re(),
            db: ie(),
            sum: se,
          },
          links: {
            q: C.dns({ label: `20 ms`, style: `off` }),
            h: C.web({ label: `60 + 55 + 20 ms` }),
            s: C.db({ label: `15 ms` }),
          },
          flows: [{ route: [`h`, `s`], bounce: !0, rate: 0.9 }],
        },
      },
    ],
  };

const le = { x0: -4.5, x1: 4.5, y0: -16, y1: -10 };

const ue = (e, t, n) => p(le, e, t, n);

const de = (e = {}) => d(0, 0, { label: [`App`, `Server`], ...e });

const fe = (e = {}) => ({ u: h(`users`, `srv`, [`users`, `srv`], { heads: `both`, ...e }) });

const pe = (e, t = { x: 0, y: 0 }) =>
    S({ ...t, z: 0, dx: 92, dy: -150 }, `Latency vs. how busy`, [], {
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
            srv: de(v(0.7)),
            q: ee(0, -2.9, 2),
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
            srv: de({ ..._(0.96), heat: 0.8 }),
            q: ee(0, -2.9, 6),
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
            srv: de(v(0.7)),
            q: ee(0, -2.9, 2),
            chart: S(
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
            srv: de({ s: 5, h: 62, ...v(0.35) }),
            q: ee(0, -3.4, 0),
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
            srv: de({ s: 5, h: 62, ...v(0.35), y: 14, tags: [{ text: `London`, icon: `globe` }] }),
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
              ...v(0.35),
              tags: [{ text: `≈ 42 in flight`, icon: `layers` }],
            }),
            chart: S(
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
            srv: de({ s: 5, h: 62, label: [`Search`], sub: `fan-out`, ...v(0.4) }),
            ...Object.fromEntries(
              [-12.5, -7.5, -2.5, 2.5, 7.5, 12.5].map((e, t) => [
                `ix${t}`,
                d(e, 12, {
                  s: 3,
                  h: 32,
                  label: [],
                  ...(t === 4
                    ? {
                        heat: 0.6,
                        tags: [{ text: `slow this time`, tone: `amber`, icon: `hourglass` }],
                      }
                    : {}),
                }),
              ]),
            ),
            chart: S(
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
              [-12.5, -7.5, -2.5, 2.5, 7.5, 12.5].map((e, t) => [
                `f${t}`,
                h(`srv`, `ix${t}`, [`srv`, [e, `srv`], `ix${t}`], { heads: `both` }),
              ]),
            ),
          },
          flows: [
            ...me(1.6),
            {
              fanout: !0,
              routes: [0, 1, 2, 3, 5].map((e) => ({ path: [`f${e}`] })),
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
              ...v(0.35),
              tags: [{ text: `batch: 100 rows / 50 ms`, icon: `layers` }],
            }),
            db: b(13, 0, { label: `database` }),
            chart: S(
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
          links: { ...fe(), w: h(`srv`, `db`, [`srv`, `db`], { label: `INSERT 100 rows` }) },
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
            srv: de({ s: 5, h: 62, ...v(0.35) }),
            chart: pe(0.35),
          },
          links: fe(),
          flows: me(3.4),
        },
      },
    ],
  };

const ge = { x0: -4.5, x1: 4.5, y0: -24, y1: -18 };

const _e = { x0: -8.5, x1: 8.5, y0: -12.5, y1: -2.5 };

const ve = { x0: 12.5, x1: 20.5, y0: -13.5, y1: -2.5 };

const ye = () => p(ge, 15, `10M daily users`);

const be = (e, t, n = `sparkles`) =>
    S({ x: -8.5, y: -2.5, z: 0, dx: 150, dy: -205 }, e, t, { icon: n });

const xe = [-6.4, -3.2, 0, 3.2, 6.4];

const Se = [`s1`, `s2`, `s0`, `s3`, `s4`];

const Ce = () => {
    let e = {};
    return (
      xe.forEach((t, n) => {
        ((e[Se[n]] = d(t, -9.6, { s: 2.8, h: 34, label: [], ...v(-1) })),
          (e[`t${n}`] = d(t, -5.4, { s: 2.8, h: 34, label: [], ...v(-1) })));
      }),
      e
    );
  };

const we = (e = {}) => ({ s0: d(0, -7.5, { label: [`One`, `server?`], ...e }) });

const Te = () =>
    Object.fromEntries(
      [-10.2, -4.8].flatMap((e, t) =>
        [14.5, 18.5].map((n, r) => [`d${t}${r}`, b(n, e, { r: 1.45, h: 30 })]),
      ),
    );

const Ee = (e) => ({ u: h(`users`, `s0`, [`users`, `s0`], e) });

const De = { uw: h(`users`, `web`, [`users`, `web`]) };

const Oe = { w: h(`web`, `store`, [`web`, `store`]) };

const ke = (e = !1) => ({
    cdn: d(12, -21, { color: `green`, glyph: `globe`, label: [`CDN`] }),
    ...(e
      ? { cache: d(-14, -7.5, { color: `green`, glyph: `zap`, label: [`Cache`], sub: `~21 GB` }) }
      : {}),
  });

const Ae = {
    sc: h(`store`, `cdn`, [`store`, [`store`, `cdn`], `cdn`], {
      style: `dashed`,
      label: `cache fill`,
      labelAt: 0.3,
    }),
    cu: h(`cdn`, `users`, [`cdn`, `users`], { label: `images · ~16 Gbit/s`, labelAt: 0.5 }),
  };

const je = { wc: h(`web`, `cache`, [`web`, `cache`], { heads: `both` }) };

const Me = be(
    `The brief`,
    [
      `PhotoShare: **10M** daily active users`,
      `each makes **~20** requests a day`,
      `they upload **1M** photos a day, 2 MB each`,
      `# Will one server cope? How much storage?`,
    ],
    `flag`,
  );

export const napkinMathLesson = {
    id: `napkin-math`,
    title: `Napkin Math`,
    summary: `Turn a product idea into servers and terabytes with math that fits on a napkin.`,
    minutes: 10,
    level: `beginner`,
    metrics: [`dau`, `avg`, `peak`, `servers`, `storage`],
    legend: [`req`, `fail`],
    goals: [
      { text: `Daily users → requests per second`, step: 1 },
      { text: `Size for the peak, not the average`, step: 2 },
      { text: `Estimate servers and storage`, step: 4 },
      { text: `Bandwidth and memory estimates`, step: 6 },
      { text: `A few numbers worth memorising`, step: 7 },
    ],
    steps: [
      {
        short: `The question`,
        chapter: `problem`,
        title: `Will one server do?`,
        body: [
          `You’re designing PhotoShare. Before choosing any technology you need a sense of scale: is this one server, or a hundred?`,
          `You don’t need exact numbers — just the right <b>order of magnitude</b>. Napkin math gets you there in minutes.`,
        ],
        callout: {
          kind: `insight`,
          text: `Interviewers and architects both start here: rough numbers first, then design to fit them.`,
        },
        metrics: { dau: `10M`, avg: `?`, peak: `?`, servers: `?`, storage: `?` },
        scene: {
          entities: { users: ye(), ...we({ tags: [{ text: `enough?`, icon: `info` }] }), card: Me },
          links: Ee(),
          flows: [{ route: [`u`], rate: 2 }],
        },
      },
      {
        short: `Requests / s`,
        chapter: `technique`,
        title: `Daily users → requests per second`,
        body: [
          `Start from what you know: users and how often they act. 10M users × 20 requests = 200M requests a day.`,
          `A day has 86,400 seconds. Round it to <b>100,000</b> — napkin math is about being quick, not precise.`,
        ],
        callout: {
          kind: `tip`,
          text: `Handy shortcut: 1M requests per day ≈ 12 requests per second.`,
        },
        changes: [`+ Average load ≈ 2,300 req/s`],
        metrics: { dau: `10M`, avg: 2300, peak: `?`, servers: `?`, storage: `?` },
        scene: {
          entities: {
            users: ye(),
            ...we({ cpu: 0.8 }),
            card: be(
              `Requests per second`,
              [
                `10M users × 20 = **200M** requests/day`,
                `1 day = 86,400 s  (≈ 100k)`,
                `= 200M ÷ 86,400 ≈ 2,300 req/s`,
              ],
              `activity`,
            ),
          },
          links: Ee(),
          flows: [{ route: [`u`], rate: 3.2 }],
        },
      },
      {
        short: `Peak`,
        chapter: `insight`,
        title: `Plan for the peak, not the average`,
        body: [
          `Traffic isn’t flat: people browse in the evening and around big events. A typical peak is 2–3× the daily average.`,
          `Size for 3× and the lone server is clearly overwhelmed.`,
        ],
        callout: {
          kind: `warn`,
          text: `A system sized for its average load is down at exactly the moment most people use it.`,
        },
        changes: [`+ Peak ≈ 3 × average ≈ 7,000 req/s`, `~ One server: overloaded`],
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: `?`, storage: `?` },
        scene: {
          entities: {
            users: ye(),
            ...we(_(1)),
            card: be(
              `Peak traffic`,
              [`evenings run ~3× the average`, `= 2,300 × 3 ≈ 7,000 req/s`],
              `trendingUp`,
            ),
          },
          links: Ee({ fail: 0.35 }),
          flows: [{ route: [`u`], rate: 6.5 }],
        },
      },
      {
        short: `Servers`,
        chapter: `solution`,
        title: `How many servers?`,
        body: [
          `A load test shows one server handles about <b>1,000 req/s</b>. Peak is 7,000, so we need 7 — plus headroom for spikes and for a server failing.`,
          `Call it <b>10</b>. Notice we used a measured number, not a guess.`,
        ],
        callout: {
          kind: `tip`,
          text: `Spreading traffic across these servers is the job of a load balancer — see Module 02.`,
        },
        changes: [`+ Web tier: 10 servers`, `~ Each runs ~70% busy at peak`],
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: 10, storage: `?` },
        scene: {
          entities: {
            users: ye(),
            web: x(_e, `WEB TIER · 10 SERVERS`),
            ...Ce(),
            card: be(
              `Servers`,
              [
                `1 server ≈ 1,000 req/s (load test)`,
                `7,000 ÷ 1,000 = 7 servers`,
                `+ ~30% headroom for spikes & failures`,
                `= 10 servers`,
              ],
              `server`,
            ),
          },
          links: De,
          flows: [{ route: [`uw`], rate: 6.5 }],
        },
      },
      {
        short: `Storage`,
        chapter: `technique`,
        title: `How much storage?`,
        body: [
          `Photos are the big one: 1M uploads × 2 MB = <b>2 TB per day</b>. Over a year that’s ~730 TB.`,
          `Data is usually stored three times so a dead disk loses nothing — so plan for about <b>2 PB</b> in year one. That rules out “one database server” immediately.`,
        ],
        callout: {
          kind: `insight`,
          text: `Storage grows every day and never resets. Requests per second come and go; bytes stay.`,
        },
        changes: [`+ Storage tier`, `+ 2 TB/day → ~730 TB/year`, `~ ×3 copies → ~2 PB`],
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: 10, storage: `730 TB` },
        scene: {
          entities: {
            users: ye(),
            web: x(_e, `WEB TIER · 10 SERVERS`),
            ...Ce(),
            store: x(ve, `STORAGE`),
            ...Te(),
            card: be(
              `Storage`,
              [
                `1M photos × 2 MB = **2 TB** per day`,
                `× 365 days ≈ **730 TB** per year`,
                `× 3 copies ≈ 2.2 PB`,
                `= plan for ~2 PB in year one`,
              ],
              `database`,
            ),
          },
          links: { ...De, ...Oe },
          flows: [
            { route: [`uw`], rate: 6 },
            { route: [`w`], rate: 1.6 },
          ],
        },
      },
      {
        short: `Bandwidth`,
        chapter: `technique`,
        title: `How much network?`,
        body: [
          `Uploads are the small part: 2 TB a day is about 20 MB/s coming in. Viewing is the big part: if each user looks at 100 photos a day as 200 KB thumbnails, that’s <b>200 TB a day</b> going out.`,
          `200 TB ÷ 100,000 s ≈ 2 GB/s — about 16 Gbit/s on average, more at peak. That’s a job for a CDN, not ten web servers.`,
        ],
        callout: {
          kind: `insight`,
          text: `Read-heavy media apps are usually limited by bandwidth before CPU. Estimate bytes out, not just requests.`,
        },
        changes: [`+ CDN serves the images`, `+ Egress ≈ 16 Gbit/s average`],
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: 10, storage: `730 TB` },
        scene: {
          entities: {
            users: ye(),
            web: x(_e, `WEB TIER · 10 SERVERS`),
            ...Ce(),
            store: x(ve, `STORAGE`),
            ...Te(),
            ...ke(),
            card: be(
              `Bytes per second`,
              [
                `in:  2 TB/day ÷ 100k s ≈ 20 MB/s`,
                `out: 10M × 100 views × 200 KB`,
                `     = 200 TB/day ≈ 2 GB/s`,
                `= ~16 Gbit/s → serve from a CDN`,
              ],
              `activity`,
            ),
          },
          links: { ...De, ...Oe, ...Ae },
          flows: [
            { route: [`uw`], rate: 6 },
            { route: [`w`], rate: 1.6 },
            { route: [`sc`, `cu`], rate: 2.4, kind: `push` },
          ],
        },
      },
      {
        short: `Cache size`,
        chapter: `technique`,
        title: `Will it fit in memory?`,
        body: [
          `Feeds read photo metadata and user profiles constantly. Could a cache hold the hot part? Profiles: 10M × 2 KB = 20 GB. Today’s new photos: 1M × 1 KB = 1 GB.`,
          `About 21 GB — it fits in the memory of a single cache server (with a second for redundancy). No exotic architecture needed.`,
        ],
        callout: {
          kind: `tip`,
          text: `Napkin math often says “this is smaller than you think”. That’s just as valuable as finding something big.`,
        },
        changes: [`+ Cache: ~21 GB hot data`],
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: 10, storage: `730 TB` },
        scene: {
          entities: {
            users: ye(),
            web: x(_e, `WEB TIER · 10 SERVERS`),
            ...Ce(),
            store: x(ve, `STORAGE`),
            ...Te(),
            ...ke(),
            cache: d(-14, -7.5, { color: `green`, glyph: `zap`, label: [`Cache`], sub: `~21 GB` }),
            card: be(
              `Hot data in RAM`,
              [
                `profiles: 10M × 2 KB  = 20 GB`,
                `new photos: 1M × 1 KB = 1 GB`,
                `= ~21 GB → one 64 GB cache server`,
              ],
              `zap`,
            ),
          },
          links: {
            ...De,
            ...Oe,
            ...Ae,
            wc: h(`web`, `cache`, [`web`, `cache`], { heads: `both` }),
          },
          flows: [
            { route: [`uw`], rate: 6 },
            { route: [`w`], rate: 1.6 },
            { route: [`sc`, `cu`], rate: 2.4, kind: `push` },
            { route: [`wc`], rate: 2.4, bounce: !0 },
          ],
        },
      },
      {
        short: `Numbers`,
        chapter: `insight`,
        title: `Numbers worth memorising`,
        body: [
          `A handful of numbers make most estimates possible. Learn the orders of magnitude, not the decimals.`,
          `<table class="compare numbers">
          <tbody>
            <tr><td>Read from memory</td><td>100 ns</td></tr>
            <tr><td>Read from SSD</td><td>100 µs</td></tr>
            <tr><td>Round trip, same data center</td><td>0.5 ms</td></tr>
            <tr><td>Round trip, across an ocean</td><td>75–150 ms</td></tr>
            <tr><td>Seconds in a day</td><td>~100,000</td></tr>
          </tbody>
        </table>`,
        ],
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: 10, storage: `730 TB` },
        scene: {
          entities: {
            users: ye(),
            web: x(_e, `WEB TIER · 10 SERVERS`),
            ...Ce(),
            store: x(ve, `STORAGE`),
            ...Te(),
            ...ke(!0),
            card: be(
              `Handy numbers`,
              [
                `1 day ≈ 100,000 s`,
                `1M req/day ≈ 12 req/s`,
                `1 KB × 1M = 1 GB`,
                `1 MB × 1M = 1 TB`,
              ],
              `bulb`,
            ),
          },
          links: { ...De, ...Oe, ...Ae, ...je },
          flows: [
            { route: [`uw`], rate: 6 },
            { route: [`w`], rate: 1.6 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>Users × actions ÷ 100k s</b> gives average requests per second.</li>
          <li>Multiply by <b>2–3×</b> for the peak, and size for that.</li>
          <li><b>Servers</b> = peak ÷ per-server capacity, plus headroom.</li>
          <li><b>Storage</b> = items/day × size × 365 × copies.</li>
          <li>Estimate <b>bytes out</b> and <b>memory</b> too — they often decide the design.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `That finishes Foundations. Next: <b>Vertical vs Horizontal Scaling</b> — what to do when the numbers say one machine won’t do.`,
        },
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: 10, storage: `730 TB` },
        scene: {
          entities: {
            users: ye(),
            web: x(_e, `WEB TIER · 10 SERVERS`),
            ...Ce(),
            store: x(ve, `STORAGE`),
            ...Te(),
            ...ke(!0),
            card: be(
              `The estimate`,
              [
                `average  ≈ 2,300 req/s`,
                `peak     ≈ 7,000 req/s`,
                `servers  = 10`,
                `storage  ≈ 730 TB / year (×3)`,
              ],
              `listOrdered`,
            ),
          },
          links: { ...De, ...Oe, ...Ae, ...je },
          flows: [
            { route: [`uw`], rate: 6 },
            { route: [`w`], rate: 1.6 },
          ],
        },
      },
    ],
  };

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

const Ue = { x0: -4.5, x1: 4.5, y0: -17, y1: -11 };

const We = { x0: -4.5, x1: 4.5, y0: -24, y1: -18 };

const Ge = [`la`, `lbb`, `lc`];

const Ke = (e = {}) => ({
    a: d(-7, 0, { label: [`Server A`], ...v(0.34), ...(e.a || {}) }),
    b: d(0, 0, { label: [`Server B`], ...v(0.36), ...(e.b || {}) }),
    c: d(7, 0, { label: [`Server C`], ...v(0.33), ...(e.c || {}) }),
  });

const qe = (e = `lb`, t = { a: `la`, b: `lbb`, c: `lc` }, n = {}) => ({
    [t.a]: h(e, `a`, [e, [`a`, e], `a`], n.a),
    [t.b]: h(e, `b`, [e, `b`], n.b),
    [t.c]: h(e, `c`, [e, [`c`, e], `c`], n.c),
  });

const Je = (e = `lb`, t = `ul`, n = {}) => ({ [t]: h(`users`, e, [`users`, e], n) });

const Ye = (e = We) => p(e, 15, `200,000 users`);

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
          entities: { users: Ye(Ue), ...Ke({ a: v(0.03), b: _(1), c: v(0.03) }) },
          links: { ub: h(`users`, `b`, [`users`, `b`], { fail: 0.22 }) },
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
          entities: { users: Ye(), lb: f(0, -9), ...Ke() },
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
            lb: f(0, -9, { tags: [{ text: `round robin`, icon: `replay` }] }),
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
            lb: f(0, -9, { tags: [{ text: `round robin`, icon: `replay` }] }),
            ...Ke({
              a: v(0.24),
              b: { ..._(0.97), tags: [{ text: `23 queued`, tone: `red` }] },
              c: v(0.25),
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
            lb: f(0, -9, { tags: [{ text: `least connections`, icon: `gauge` }] }),
            ...Ke({
              a: { ...v(0.5), tags: [{ text: `4 active` }] },
              b: { ...v(0.52), tags: [{ text: `9 active` }] },
              c: { ...v(0.48), tags: [{ text: `4 active` }] },
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
            lb: f(0, -9, { tags: [{ text: `least connections`, icon: `gauge` }] }),
            ...Ke({
              a: v(0.55),
              b: v(0.57),
              c: { ...g, tags: [{ text: `out of pool`, tone: `gray`, icon: `alert` }] },
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
          entities: { users: Ye(), lb: f(0, -9, g), ...Ke({ a: v(0.02), b: v(0.02), c: v(0.02) }) },
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
            lb: f(0, -9, { tags: [{ text: `ACTIVE · VIP`, tone: `green`, icon: `globe` }] }),
            lb2: f(-14, -9, {
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
            beat: h(
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
            lb2: f(0, -9, { tags: [{ text: `ACTIVE · VIP`, tone: `green`, icon: `globe` }] }),
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
            lb2: f(0, -9, {
              tags: [{ text: `L7 · routes by path`, tone: `green`, icon: `split` }],
            }),
            a: d(-7, 0, { label: [`API A`], ...v(0.4) }),
            b: d(0, 0, { label: [`API B`], ...v(0.42) }),
            c: d(7, 0, { color: `yellow`, glyph: `file`, label: [`Images`], ...v(0.3) }),
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
            lb2: f(0, -9, { tags: [{ text: `rolling deploy`, tone: `green`, icon: `replay` }] }),
            a: d(-7, 0, {
              label: [`Server A`],
              ...v(0.5),
              tags: [{ text: `v1 · next`, tone: `gray` }],
            }),
            b: d(0, 0, {
              label: [`Server B`],
              dim: 1,
              cpu: 0.05,
              tags: [{ text: `draining → v2`, tone: `amber`, icon: `hourglass` }],
            }),
            c: d(7, 0, {
              label: [`Server C`],
              ...v(0.5),
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
            lb2: f(0, -9, { tags: [{ text: `VIP`, tone: `green`, icon: `globe` }] }),
            ...Ke(),
          },
          links: { ...Je(`lb2`, `ul2`), ...qe(`lb2`, { a: `la2`, b: `lbb2`, c: `lc2` }) },
          flows: [{ route: [`ul2`, [`la2`, `lbb2`, `lc2`]], pick: `rr`, rate: 4.2 }],
        },
      },
    ],
  };

const Qe = { text: `session: Alice · cart 2`, tone: `violet`, icon: `user` };

const $e = { text: `no session for Alice`, tone: `red`, icon: `alert` };

const et = (e = [{ text: `cart: 2 items`, icon: `check` }]) => y(0, -19, { label: `Alice`, tags: e });

const tt = (e = []) => f(0, -9, { tags: e });

const nt = (e = {}) => ({
    a: d(-7, 0, { label: [`Server A`], ...(e.a || {}) }),
    b: d(0, 0, { label: [`Server B`], ...(e.b || {}) }),
    c: d(7, 0, { label: [`Server C`], ...(e.c || {}) }),
  });

const rt = (e = [{ text: `Alice · cart 2`, tone: `violet`, icon: `user` }]) =>
    b(0, 10, { glyph: `zap`, label: `session store`, tags: e });

const it = { ul: h(`alice`, `lb`, [`alice`, `lb`], { heads: `both` }) };

const at = (e = {}) => ({
    la: h(`lb`, `a`, [`lb`, [`a`, `lb`], `a`], e.a),
    lbb: h(`lb`, `b`, [`lb`, `b`], e.b),
    lc: h(`lb`, `c`, [`lb`, [`c`, `lb`], `c`], e.c),
  });

const ot = {
    as: h(`a`, `st`, [`a`, [`a`, `st`], `st`], { heads: `both` }),
    bs: h(`b`, `st`, [`b`, `st`], { heads: `both` }),
    cs: h(`c`, `st`, [`c`, [`c`, `st`], `st`], { heads: `both` }),
  };

const st = (e, t = 1.5) => [{ routes: e.map((e) => ({ path: e })), rate: t, bounce: !0, kind: `mine` }];

export const statelessLesson = {
    id: `stateless`,
    title: `Stateless Services`,
    summary: `Why the next request must work on any server — and where the state goes instead.`,
    minutes: 10,
    level: `beginner`,
    metrics: [`ok`, `survive`, `scale`, `extra`],
    legend: [`mine`, `res`, `write`, `fail`],
    goals: [
      { text: `What “state” is, and why it pins users to a server`, step: 1 },
      { text: `Sticky sessions — and how they break`, step: 3 },
      { text: `A shared session store makes servers interchangeable`, step: 5 },
      { text: `Carrying state in signed tokens`, step: 6 },
      { text: `Files belong in object storage`, step: 8 },
    ],
    steps: [
      {
        short: `Logged in`,
        chapter: `setup`,
        title: `Alice logs in`,
        body: [
          `Alice signs in and adds two things to her cart. Her request happened to land on Server A, which keeps a <span class="term">session</span> in its memory: who she is and what’s in her cart.`,
          `Her browser holds a cookie with the session id, so later requests can find it again.`,
        ],
        callout: {
          kind: `insight`,
          text: `<b>State</b> is anything a server remembers between requests: logins, carts, half-finished uploads.`,
        },
        metrics: { ok: `1 / 1`, survive: `—`, scale: `—`, extra: `+0 ms` },
        scene: {
          entities: { alice: et(), lb: tt(), ...nt({ a: { tags: [Qe] } }) },
          links: { ...it, ...at() },
          flows: st([[`ul`, `la`]], 1),
        },
      },
      {
        short: `Logged out`,
        chapter: `problem`,
        title: `Her next request lands elsewhere`,
        body: [
          `The load balancer is doing its job — round robin sends Alice’s next requests to B and then C. Neither has ever heard of her.`,
          `To Alice the app is broken: one page shows her cart, the next asks her to sign in again.`,
        ],
        callout: {
          kind: `warn`,
          text: `If a server keeps state in memory, every other server is useless for that user.`,
        },
        changes: [`~ Requests 2 and 3 go to B and C`, `− “Please sign in again”`],
        metrics: { ok: `1 / 3`, survive: `no`, scale: `no`, extra: `+0 ms` },
        scene: {
          entities: {
            alice: et(),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({ a: { tags: [Qe] }, b: { tags: [$e] }, c: { tags: [$e] } }),
          },
          links: { ...it, ...at({ b: { fail: 1 }, c: { fail: 1 } }) },
          flows: st([
            [`ul`, `la`],
            [`ul`, `lbb`],
            [`ul`, `lc`],
          ]),
        },
      },
      {
        short: `Sticky`,
        chapter: `solution`,
        title: `Fix 1: sticky sessions`,
        body: [
          `Tell the load balancer to remember where each user started — usually with a cookie — and keep sending them there. Alice always reaches A, so she stays signed in.`,
          `Quick to switch on, and no code changes.`,
        ],
        callout: {
          kind: `warn`,
          text: `Sticky users can’t be moved. If many of them pile onto one server, it stays overloaded while others idle.`,
        },
        changes: [`~ LB pins Alice → Server A`, `~ All her requests succeed`],
        metrics: { ok: `3 / 3`, survive: `no`, scale: `limited`, extra: `+0 ms` },
        scene: {
          entities: {
            alice: et(),
            lb: tt([{ text: `sticky: Alice → A`, icon: `user` }]),
            ...nt({ a: { tags: [Qe] } }),
          },
          links: { ...it, ...at() },
          flows: st([[`ul`, `la`]]),
        },
      },
      {
        short: `A dies`,
        chapter: `problem`,
        title: `…until Server A dies`,
        body: [
          `Server A crashes. The load balancer does the right thing and moves Alice to B — but her session died with A’s memory.`,
          `She’s signed out and her cart is empty. Every user pinned to A just had the same experience.`,
        ],
        callout: {
          kind: `warn`,
          text: `Sticky sessions turn every server into a small single point of failure for its users.`,
        },
        changes: [`− Server A down`, `− Alice’s session lost`, `~ Cart 2 items → empty`],
        metrics: { ok: `0 / 3`, survive: `no`, scale: `limited`, extra: `+0 ms` },
        scene: {
          entities: {
            alice: et([{ text: `signed out · cart empty`, tone: `red`, icon: `alert` }]),
            lb: tt([{ text: `sticky: Alice → B`, icon: `user` }]),
            ...nt({ a: g, b: { tags: [$e] } }),
          },
          links: { ...it, ...at({ a: { style: `off` }, b: { fail: 1 } }) },
          flows: st([[`ul`, `lbb`]]),
        },
      },
      {
        short: `Shared store`,
        chapter: `solution`,
        title: `Fix 2: move the state out`,
        body: [
          `Keep sessions in a shared, fast <span class="term">session store</span> (often Redis). Every server reads Alice’s session from it, so any server can handle any request.`,
          `The servers are now <span class="term">stateless</span>: they remember nothing between requests. Round robin is back, and she stays signed in.`,
        ],
        callout: {
          kind: `tip`,
          text: `The cost: one extra hop of about a millisecond per request — cheap, for servers you can add, remove or lose freely.`,
        },
        changes: [`+ Session store`, `~ Servers keep nothing in memory`, `~ Round robin again`],
        metrics: { ok: `3 / 3`, survive: `yes`, scale: `yes`, extra: `+1 ms` },
        scene: {
          entities: {
            alice: et(),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({
              a: { tags: [{ text: `stateless` }] },
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
            st: rt(),
          },
          links: { ...it, ...at(), ...ot },
          flows: st([
            [`ul`, `la`, `as`],
            [`ul`, `lbb`, `bs`],
            [`ul`, `lc`, `cs`],
          ]),
        },
      },
      {
        short: `Lose one`,
        chapter: `insight`,
        title: `Now losing a server is a non-event`,
        body: [
          `Server A dies again. The load balancer routes around it, B and C read the same session from the store, and Alice doesn’t notice.`,
          `This is what makes autoscaling possible: servers can be created and destroyed at any moment.`,
        ],
        callout: {
          kind: `insight`,
          text: `Stateless servers are cattle, not pets — any one of them can be replaced without anyone noticing.`,
        },
        changes: [`− Server A down`, `~ Alice still signed in, cart intact`],
        metrics: { ok: `3 / 3`, survive: `yes`, scale: `yes`, extra: `+1 ms` },
        scene: {
          entities: {
            alice: et(),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({
              a: g,
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
            st: rt(),
          },
          links: { ...it, ...at({ a: { style: `off` } }), ...ot },
          flows: st([
            [`ul`, `lbb`, `bs`],
            [`ul`, `lc`, `cs`],
          ]),
        },
      },
      {
        short: `Tokens`,
        chapter: `technique`,
        title: `Or: let the request carry it`,
        body: [
          `Another option is to put the state in the request itself: a signed <span class="term">token</span> (such as a JWT) that says “this is Alice”. Any server can verify the signature without looking anything up.`,
          `No store and no extra hop — but a token can’t easily be cancelled before it expires, and it travels with every request, so keep it small.`,
        ],
        callout: {
          kind: `tip`,
          text: `Common split: tokens for identity, a shared store for anything big or that must change instantly (carts, revoked logins).`,
        },
        changes: [`− Session store`, `+ Signed token in each request`, `~ Extra hop gone`],
        metrics: { ok: `3 / 3`, survive: `yes`, scale: `yes`, extra: `+0 ms` },
        scene: {
          entities: {
            alice: et([{ text: `signed token: Alice`, tone: `violet`, icon: `lock` }]),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({
              a: { tags: [{ text: `stateless` }] },
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
          },
          links: { ...it, ...at() },
          flows: st([
            [`ul`, `la`],
            [`ul`, `lbb`],
            [`ul`, `lc`],
          ]),
        },
      },
      {
        short: `Uploads`,
        chapter: `problem`,
        title: `Case: files on a local disk`,
        body: [
          `Alice uploads a new avatar. Server A saves <code>avatar.png</code> to its own disk and shows it — perfect.`,
          `Her next page loads from Server B, which has no such file: a broken image. Files are state too.`,
        ],
        callout: {
          kind: `warn`,
          text: `Anything written to a server’s local disk — uploads, generated PDFs, temp files — disappears for every other server, and for good when the server is replaced.`,
        },
        changes: [`+ Avatar saved on Server A’s disk`, `− Broken image when served by B or C`],
        metrics: { ok: `1 / 3`, survive: `no`, scale: `no`, extra: `+0 ms` },
        scene: {
          entities: {
            alice: et([{ text: `avatar: broken image`, tone: `red`, icon: `alert` }]),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({
              a: { tags: [{ text: `avatar.png on local disk`, tone: `violet`, icon: `file` }] },
              b: { tags: [{ text: `avatar.png?`, tone: `red`, icon: `alert` }] },
              c: { tags: [{ text: `avatar.png?`, tone: `red`, icon: `alert` }] },
            }),
          },
          links: { ...it, ...at({ b: { fail: 1 }, c: { fail: 1 } }) },
          flows: st([
            [`ul`, `la`],
            [`ul`, `lbb`],
            [`ul`, `lc`],
          ]),
        },
      },
      {
        short: `Object store`,
        chapter: `solution`,
        title: `Put files in object storage`,
        body: [
          `Store files in shared <span class="term">object storage</span> (Amazon S3, Google Cloud Storage, Azure Blob): effectively unlimited, durable, and reachable from every server.`,
          `Server A writes the avatar there (dark square); B and C read the same file. Better still, browsers fetch images straight from storage through a CDN.`,
        ],
        callout: {
          kind: `tip`,
          text: `Rule of thumb: servers keep nothing that must outlive the request. Sessions → a store or token; files → object storage; data → the database.`,
        },
        changes: [
          `+ Object storage`,
          `~ Uploads written to storage, not local disk`,
          `~ Every server sees every file`,
        ],
        metrics: { ok: `3 / 3`, survive: `yes`, scale: `yes`, extra: `+0 ms` },
        scene: {
          entities: {
            alice: et([{ text: `avatar ✓`, tone: `green`, icon: `check` }]),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({
              a: { tags: [{ text: `stateless` }] },
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
            os: b(0, 10, {
              glyph: `box`,
              label: `object storage`,
              tags: [{ text: `avatar.png`, tone: `violet`, icon: `file` }],
            }),
          },
          links: {
            ...it,
            ...at(),
            ao: h(`a`, `os`, [`a`, [`a`, `os`], `os`], { heads: `both` }),
            bo: h(`b`, `os`, [`b`, `os`], { heads: `both` }),
            co: h(`c`, `os`, [`c`, [`c`, `os`], `os`], { heads: `both` }),
          },
          flows: [
            ...st([
              [`ul`, `la`, `ao`],
              [`ul`, `lbb`, `bo`],
              [`ul`, `lc`, `co`],
            ]),
            { route: [`ao`], kind: `write`, rate: 0.5 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>State kept in a server’s memory <b>pins users</b> to that server.</li>
          <li><b>Sticky sessions</b> hide the problem until a server dies.</li>
          <li>Move state to a <b>shared store</b>, or carry it in a <b>signed token</b>.</li>
          <li>Files go to <b>object storage</b>, never a server’s local disk.</li>
          <li><b>Stateless</b> servers can be added, removed and lost freely.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Caching</b> — the database behind all these stateless servers is about to become the bottleneck.`,
        },
        metrics: { ok: `3 / 3`, survive: `yes`, scale: `yes`, extra: `+1 ms` },
        scene: {
          entities: {
            alice: et(),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({
              a: { tags: [{ text: `stateless` }] },
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
            st: rt(),
          },
          links: { ...it, ...at(), ...ot },
          flows: st([
            [`ul`, `la`, `as`],
            [`ul`, `lbb`, `bs`],
            [`ul`, `lc`, `cs`],
          ]),
        },
      },
    ],
  };

const lt = { x0: -4.5, x1: 4.5, y0: -18, y1: -12 };

const ut = (e = `20,000 users`) => p(lt, 13, e);

const dt = () => d(0, -3, { label: [`App`, `Server`] });

const ft = (e = {}) => b(11, -3, { label: `database`, ...e });

const pt = (e = {}) =>
    d(-11, -3, { color: `green`, glyph: `zap`, label: [`Cache`], sub: `in memory`, ...e });

const mt = {
    us: h(`users`, `app`, [`users`, `app`], { heads: `both` }),
    sd: h(`app`, `db`, [`app`, `db`], { heads: `both` }),
    sc: h(`app`, `cache`, [`app`, `cache`], { heads: `both` }),
  };

const ht = (e, t, n) => S({ x: 11, y: -3, z: 0, dx: 30, dy: -250 }, e, t, { icon: n });

const gt = (e, t = 4) => [
    {
      routes: [
        { path: [`us`, `sc`], weight: e },
        { path: [`us`, `sd`], weight: 1 - e, kind: `slow` },
      ],
      pick: `weights`,
      rate: t,
      bounce: !0,
    },
    { route: [`sc`], kind: `write`, rate: t * (1 - e) * 0.9 },
  ];

export const cachingLesson = {
    id: `caching`,
    title: `Caching`,
    summary: `Keep the answers people ask for most somewhere much faster than the database.`,
    minutes: 14,
    level: `beginner`,
    metrics: [`p95`, `hitRate`, `dbLoad`, `fresh`],
    legend: [`req`, `res`, [`slow`, `cache miss`], [`write`, `cache fill / write`], `kill`],
    goals: [
      { text: `Why the same reads overload a database`, step: 1 },
      { text: `The cache-aside pattern`, step: 2 },
      { text: `Why hit rate matters so much`, step: 3 },
      { text: `Stale data, invalidation and eviction`, step: 6 },
      { text: `Stampedes, missing keys and cache layers`, step: 7 },
    ],
    steps: [
      {
        short: `DB melts`,
        chapter: `problem`,
        title: `Every page hits the database`,
        body: [
          `Your shop is popular. Every product page asks the database for the same kind of thing — name, price, photos — and it’s now 92% busy.`,
          `Reads queue up and pages slow to nearly half a second at p95.`,
        ],
        callout: {
          kind: `warn`,
          text: `Databases are usually the hardest part to scale, because they hold the data. Protect them from unnecessary work.`,
        },
        metrics: { p95: 450, hitRate: 0, dbLoad: 92, fresh: `fresh` },
        scene: {
          entities: { users: ut(), app: dt(), db: ft({ heat: 0.8, cpu: 0.92 }) },
          links: { us: mt.us, sd: mt.sd },
          flows: [{ route: [`us`, `sd`], rate: 4, bounce: !0 }],
        },
      },
      {
        short: `Same reads`,
        chapter: `insight`,
        title: `The same few things, over and over`,
        body: [
          `Look at what’s actually being read: a small set of popular products accounts for most traffic. The database recomputes the same answers thousands of times a minute.`,
          `Answers that are read often and change rarely are perfect to keep somewhere closer and faster.`,
        ],
        callout: {
          kind: `insight`,
          text: `Most real workloads are skewed like this — a few hot items and a long tail of rarely-read ones.`,
        },
        metrics: { p95: 450, hitRate: 0, dbLoad: 92, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(),
            app: dt(),
            db: ft({ heat: 0.8, cpu: 0.92 }),
            card: ht(
              `Who reads what`,
              [
                `top 1% of products   → 60% of reads`,
                `top 10% of products  → 90% of reads`,
                `# the same rows, read again and again`,
              ],
              `activity`,
            ),
          },
          links: { us: mt.us, sd: mt.sd },
          flows: [{ route: [`us`, `sd`], rate: 4, bounce: !0 }],
        },
      },
      {
        short: `Add cache`,
        chapter: `solution`,
        title: `Put a cache in front`,
        body: [
          `Add an in-memory <span class="term">cache</span> (such as Redis or Memcached). The server checks it first: a <b>hit</b> returns in about a millisecond.`,
          `On a <b>miss</b> (amber) the server reads the database, then saves a copy in the cache for next time. This is the <span class="term">cache-aside</span> pattern.`,
        ],
        callout: {
          kind: `tip`,
          text: `A cache lookup is one key fetched from memory: no query planning, no joins, no disk. It typically answers 10–100× faster than the query it replaces.`,
        },
        changes: [`+ Cache`, `~ 80% of reads served from memory`, `~ Database CPU 92% → 25%`],
        metrics: { p95: 40, hitRate: 80, dbLoad: 25, fresh: `fresh` },
        scene: {
          entities: { users: ut(), app: dt(), db: ft({ cpu: 0.25 }), cache: pt() },
          links: mt,
          flows: gt(0.8),
        },
      },
      {
        short: `Hit rate`,
        chapter: `technique`,
        title: `Hit rate is everything`,
        body: [
          `The share of reads answered by the cache is the <span class="term">hit rate</span>. Because misses are so much slower, small changes in hit rate matter a lot.`,
          `Going from 80% to 95% hits more than halves the average read time and cuts database load by three-quarters.`,
        ],
        callout: {
          kind: `tip`,
          text: `Raise hit rate by caching the right things, giving the cache enough memory, and keeping entries long enough to be reused.`,
        },
        changes: [`~ Hit rate 80% → 95%`, `~ Database CPU 25% → 8%`],
        metrics: { p95: 25, hitRate: 95, dbLoad: 8, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(),
            app: dt(),
            db: ft({ cpu: 0.08 }),
            cache: pt(),
            card: ht(
              `Average read time`,
              [
                `cache hit  ≈ 1 ms`,
                `database   ≈ 20 ms`,
                `80% hits:  0.8×1 + 0.2×20  = 4.8 ms`,
                `= 95% hits: 0.95×1 + 0.05×20 = 2 ms`,
              ],
              `timer`,
            ),
          },
          links: mt,
          flows: gt(0.95),
        },
      },
      {
        short: `Stale`,
        chapter: `problem`,
        title: `The price changed. The cache didn’t.`,
        body: [
          `An admin updates a price from $20 to $25. The database has the new price — but the cache still holds the old copy, and that’s what users see.`,
          `A cache is a second copy of the truth. Keeping copies in sync is the hard part of caching.`,
        ],
        callout: {
          kind: `warn`,
          text: `“There are only two hard things in computer science: cache invalidation and naming things.” — Phil Karlton`,
        },
        changes: [`~ Database: price $20 → $25`, `− Cache still says $20`],
        metrics: { p95: 25, hitRate: 95, dbLoad: 8, fresh: `stale` },
        scene: {
          entities: {
            users: ut(`users see $20`),
            app: dt(),
            db: ft({ cpu: 0.08, tags: [{ text: `price: $25`, tone: `green` }] }),
            cache: pt({ tags: [{ text: `price: $20 · stale`, tone: `red`, icon: `alert` }] }),
          },
          links: mt,
          flows: [...gt(0.95), { route: [`sd`], kind: `write`, rate: 0.5 }],
        },
      },
      {
        short: `Invalidate`,
        chapter: `solution`,
        title: `Invalidate on write, expire with a TTL`,
        body: [
          `When data changes, the server writes the database <em>and</em> deletes the cached copy (red rings). The next read misses and fetches the fresh value.`,
          `As a safety net, every entry also gets a <span class="term">TTL</span> (time to live): even if an invalidation is missed, stale data disappears within a minute.`,
          `Why delete rather than overwrite the cached copy? Two writes racing each other can leave the <em>older</em> value in the cache. Deleting is always safe: the next read reloads the truth.`,
        ],
        callout: {
          kind: `tip`,
          text: `Pick the TTL by asking: how stale is acceptable? Seconds for prices and stock, hours for a product description.`,
        },
        changes: [`+ Writes delete the cached copy`, `+ TTL: 60 s`, `~ Users see $25`],
        metrics: { p95: 26, hitRate: 94, dbLoad: 9, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`users see $25`),
            app: dt(),
            db: ft({ cpu: 0.09, tags: [{ text: `price: $25`, tone: `green` }] }),
            cache: pt({
              tags: [
                { text: `TTL 60 s`, icon: `clock` },
                { text: `price: $25`, tone: `green` },
              ],
            }),
          },
          links: mt,
          flows: [
            ...gt(0.94),
            { route: [`sd`], kind: `write`, rate: 0.6 },
            { route: [`sc`], kind: `kill`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Eviction`,
        chapter: `tradeoff`,
        title: `Memory runs out`,
        body: [
          `The cache can’t hold everything — memory is expensive. When it’s full, something has to go to make room.`,
          `The usual rule is <span class="term">LRU</span>: evict the entry that was <em>least recently used</em>. Hot items stay; the long tail cycles through.`,
          `The main alternative, <span class="term">LFU</span>, evicts the least <em>frequently</em> used entry instead — better when a burst of one-off reads would otherwise push out the real favourites.`,
        ],
        callout: {
          kind: `insight`,
          text: `A cache only needs to hold the hot set. 10% of the data can easily serve 90% of reads.`,
        },
        changes: [`+ Cache full`, `~ Least recently used entries evicted`, `~ Hit rate 94% → 92%`],
        metrics: { p95: 30, hitRate: 92, dbLoad: 12, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`users see $25`),
            app: dt(),
            db: ft({ cpu: 0.12 }),
            cache: pt({ tags: [{ text: `memory full`, tone: `amber`, icon: `alert` }] }),
            card: ht(
              `Least recently used`,
              [
                `product:42    used 1 s ago`,
                `product:7     used 4 s ago`,
                `product:913   used 2 min ago`,
                `! evict product:5 · unused 3 h`,
              ],
              `layers`,
            ),
          },
          links: mt,
          flows: gt(0.92),
        },
      },
      {
        short: `Stampede`,
        chapter: `problem`,
        title: `Case: the cache stampede`,
        body: [
          `The home page is the hottest key in the cache — 2,000 reads a second. Its TTL expires. In the next instant, every one of those requests misses and goes to the database for the same answer.`,
          `The database, used to 8% load, gets hit by a wall of identical queries and stalls. This is a <span class="term">cache stampede</span> (or thundering herd).`,
        ],
        callout: { kind: `warn`, text: `The more popular a key, the more dangerous its expiry.` },
        changes: [
          `− Hot key “home page” expires`,
          `+ 2,000 simultaneous misses`,
          `~ Database CPU 8% → 100%`,
        ],
        metrics: { p95: 1400, hitRate: 40, dbLoad: 100, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`everyone opens the home page`),
            app: dt(),
            db: ft({
              heat: 0.9,
              cpu: 1,
              tags: [{ text: `2,000 identical queries`, tone: `red`, icon: `alert` }],
            }),
            cache: pt({ tags: [{ text: `home page · expired`, tone: `amber`, icon: `clock` }] }),
          },
          links: mt,
          flows: [{ route: [`us`, `sd`], rate: 7, bounce: !0, kind: `slow` }],
        },
      },
      {
        short: `One fetch`,
        chapter: `solution`,
        title: `Let one request refill it`,
        body: [
          `Fix it with <span class="term">request coalescing</span>: the first miss takes a short lock and fetches from the database; everyone else waits a few milliseconds for that one result.`,
          `Add two more habits: refresh hot keys a little <em>before</em> they expire, and add random jitter to TTLs so many keys don’t expire at the same moment.`,
        ],
        callout: {
          kind: `tip`,
          text: `Libraries call this “single-flight”. CDNs do the same at the edge (“request collapsing”).`,
        },
        changes: [
          `+ One fetch per expired key`,
          `+ Early refresh + TTL jitter`,
          `~ Database CPU 100% → 9%`,
        ],
        metrics: { p95: 30, hitRate: 97, dbLoad: 9, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`everyone opens the home page`),
            app: dt(),
            db: ft({ cpu: 0.09 }),
            cache: pt({
              tags: [{ text: `refreshed early · 1 fetch`, tone: `green`, icon: `check` }],
            }),
          },
          links: mt,
          flows: gt(0.97, 5),
        },
      },
      {
        short: `Missing keys`,
        chapter: `problem`,
        title: `Case: asking for what isn’t there`,
        body: [
          `A crawler — or an attacker — requests product IDs that don’t exist: <code>/product/99900017</code>, <code>…18</code>, <code>…19</code>. Each one misses the cache, goes to the database, finds nothing, and so leaves <b>nothing to cache</b>.`,
          `Every such request is a guaranteed miss, however often it repeats. The cache gives no protection at all, and the database is busy searching for rows that were never there. This is <span class="term">cache penetration</span>.`,
        ],
        callout: {
          kind: `warn`,
          text: `Cache-aside only remembers answers. “No such row” is an answer too — if you forget to store it, you pay for it every time.`,
        },
        changes: [
          `+ Requests for IDs that don’t exist`,
          `~ Half of all reads now miss`,
          `~ Database CPU 9% → 85%`,
        ],
        metrics: { p95: 520, hitRate: 50, dbLoad: 85, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`real users + a crawler guessing IDs`),
            app: dt(),
            db: ft({
              heat: 0.7,
              cpu: 0.85,
              tags: [{ text: `0 rows found`, tone: `red`, icon: `search` }],
            }),
            cache: pt({ tags: [{ text: `nothing to cache`, tone: `amber`, icon: `alert` }] }),
          },
          links: mt,
          flows: [
            {
              routes: [
                { path: [`us`, `sc`], weight: 0.5 },
                { path: [`us`, `sd`], weight: 0.5, kind: `slow` },
              ],
              pick: `weights`,
              rate: 6,
              bounce: !0,
            },
          ],
        },
      },
      {
        short: `Bloom filter`,
        chapter: `solution`,
        title: `Remember the “no” as well`,
        body: [
          `First fix: <span class="term">negative caching</span>. Store “not found” in the cache too, with a short TTL, so a repeated request for the same missing ID stops at the cache.`,
          `But a crawler never repeats itself. For that, keep a <span class="term">Bloom filter</span> of every real ID in the server’s memory: a compact bit set that answers “definitely not here” or “probably here” in microseconds. Impossible IDs get a 404 without touching the cache or the database.`,
        ],
        callout: {
          kind: `tip`,
          text: `A Bloom filter never says “no” to a key that exists; it occasionally says “maybe” to one that doesn’t. A 1% false-positive rate costs only about 10 bits per key.`,
        },
        changes: [
          `+ Cache “not found” · TTL 30 s`,
          `+ Bloom filter of real IDs on the server`,
          `~ Database CPU 85% → 9%`,
        ],
        metrics: { p95: 28, hitRate: 95, dbLoad: 9, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`real users + a crawler guessing IDs`),
            app: dt(),
            db: ft({ cpu: 0.09 }),
            cache: pt({ tags: [{ text: `“not found” · TTL 30 s`, icon: `clock` }] }),
            card: ht(
              `Bloom filter · 12 M IDs in 15 MB`,
              [
                `is product:99900017 real?`,
                `= “definitely not” → 404, no lookup`,
                `“probably yes” → cache, then database`,
                `# never wrong about a “no”`,
              ],
              `search`,
            ),
          },
          links: mt,
          flows: gt(0.95, 5),
        },
      },
      {
        short: `Layers`,
        chapter: `insight`,
        title: `Caches everywhere`,
        body: [
          `The cache we built is one layer of many. A request may be answered by the <b>browser</b> cache, the <b>CDN</b>, an <b>in-process</b> cache on the server, a shared cache like Redis, or the database’s own memory.`,
          `The closer to the user, the faster and cheaper the hit — and the harder it is to invalidate.`,
        ],
        callout: {
          kind: `insight`,
          text: `Most of “making it fast” is deciding what can be cached, where, and for how long.`,
        },
        metrics: { p95: 25, hitRate: 95, dbLoad: 8, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`users see $25`),
            app: dt(),
            db: ft({ cpu: 0.08 }),
            cache: pt(),
            card: ht(
              `Where a read can stop`,
              [
                `browser cache       0 ms · per user`,
                `CDN edge            ~10 ms · per city`,
                `in-process memory   ~0 ms · per server`,
                `shared cache        ~1 ms`,
                `database            ~20 ms`,
              ],
              `layers`,
            ),
          },
          links: mt,
          flows: gt(0.95),
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Cache answers that are <b>read often and change rarely</b>.</li>
          <li><b>Cache-aside</b>: check the cache, fall back to the database, then fill the cache.</li>
          <li><b>Hit rate</b> drives both speed and database load.</li>
          <li>Plan for staleness: <b>invalidate on write</b>, add a <b>TTL</b>, evict with <b>LRU</b>.</li>
          <li>Protect hot keys from <b>stampedes</b>: one fetch, early refresh, jittered TTLs.</li>
          <li>Cache <b>“not found”</b> too, and screen impossible keys with a <b>Bloom filter</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Content Delivery</b> — caching files on servers spread around the world, close to your users.`,
        },
        metrics: { p95: 25, hitRate: 95, dbLoad: 8, fresh: `fresh` },
        scene: {
          entities: { users: ut(`users see $25`), app: dt(), db: ft({ cpu: 0.08 }), cache: pt() },
          links: mt,
          flows: gt(0.95),
        },
      },
    ],
  };

const vt = { x0: -4.5, x1: 4.5, y0: -24, y1: -18 };

const yt = { x0: 18, x1: 24, y0: -4.5, y1: 4.5 };

const bt = (e = 11, t = `London`) => p(vt, e, t);

const xt = (e = 11, t = `Sydney`) => p(yt, e, t);

const St = (e = {}) => d(0, 0, { label: [`Origin`], sub: `Virginia`, ...e });

const Ct = (e, t, n, r = {}) =>
    d(e, t, { color: `green`, glyph: `globe`, label: [`Edge`], sub: n, ...r });

const wt = (e = {}, t = {}) => ({ el: Ct(0, -12, `London`, e), es: Ct(12, 0, `Sydney`, t) });

const Tt = 0.72;

const Et = {
    lo: h(`lon`, `origin`, [`lon`, `origin`], { heads: `both`, label: `≈ 75 ms per round trip` }),
    so: h(`syd`, `origin`, [`syd`, `origin`], {
      heads: `both`,
      label: `≈ 200 ms per round trip`,
      labelTone: `amber`,
    }),
  };

const Dt = {
    le: h(`lon`, `el`, [`lon`, `el`], { heads: `both`, label: `≈ 10 ms` }),
    eo: h(`el`, `origin`, [`el`, `origin`], {
      heads: `both`,
      style: `dashed`,
      label: `only on a miss`,
    }),
    se: h(`syd`, `es`, [`syd`, `es`], { heads: `both`, label: `≈ 12 ms` }),
    eso: h(`es`, `origin`, [`es`, `origin`], {
      heads: `both`,
      style: `dashed`,
      label: `only on a miss`,
    }),
  };

const Ot = (e = 0.9, t = 0.9, n = 1.8) => [
    {
      routes: [
        { path: [`le`], weight: e },
        { path: [`le`, `eo`], weight: 1 - e, kind: `slow` },
      ],
      pick: `weights`,
      rate: n,
      bounce: !0,
      speed: Tt,
    },
    {
      routes: [
        { path: [`se`], weight: t },
        { path: [`se`, `eso`], weight: 1 - t, kind: `slow` },
      ],
      pick: `weights`,
      rate: n,
      bounce: !0,
      speed: Tt,
    },
  ];

export const cdnLesson = {
    id: `cdn`,
    title: `Content Delivery`,
    summary: `Copy what everyone downloads to servers near your users — and stop fighting the speed of light.`,
    minutes: 10,
    level: `beginner`,
    metrics: [`lon`, `syd`, `origin`, `hitRate`],
    legend: [`req`, `res`, [`slow`, `edge miss → origin`], [`mine`, `personal page`]],
    goals: [
      { text: `Why distant users are slow`, step: 0 },
      { text: `How edge servers cache static files`, step: 2 },
      { text: `Cold caches and versioned file names`, step: 5 },
      { text: `How a CDN shields the origin`, step: 6 },
      { text: `Private pages and origin shields`, step: 7 },
    ],
    steps: [
      {
        short: `Far away`,
        chapter: `problem`,
        title: `Your users are far away`,
        body: [
          `Your servers are in Virginia. A user in London waits about 75 ms per round trip; in Sydney about 200 ms. A page needs many round trips, so Sydney waits well over a second.`,
          `Meanwhile every image for every user worldwide is served by that one origin.`,
        ],
        callout: {
          kind: `warn`,
          text: `You can’t speed up light. The only way to cut distance latency is to serve users from somewhere closer.`,
        },
        metrics: { lon: 80, syd: 210, origin: 9e3, hitRate: 0 },
        scene: {
          entities: { lon: bt(), syd: xt(), origin: St(_(0.88)) },
          links: Et,
          flows: [
            { route: [`lo`], rate: 1.6, bounce: !0, speed: Tt },
            { route: [`so`], rate: 1.6, bounce: !0, speed: Tt },
          ],
        },
      },
      {
        short: `Same bytes`,
        chapter: `insight`,
        title: `Most bytes are the same for everyone`,
        body: [
          `Look inside a page load. The HTML is personal, but images, scripts, stylesheets and videos are <b>identical</b> for every user.`,
          `Identical, rarely-changing files are perfect for caching — anywhere, including far from the origin.`,
        ],
        callout: { kind: `insight`, text: `Static assets are often 90%+ of the bytes on a page.` },
        metrics: { lon: 80, syd: 210, origin: 9e3, hitRate: 0 },
        scene: {
          entities: {
            lon: bt(),
            syd: xt(),
            origin: St(_(0.88)),
            card: ((e, t, n) => S({ x: 0, y: 0, z: 0, dx: -340, dy: -230 }, e, t, { icon: n }))(
              `What a page is made of`,
              [
                `HTML (per user)     30 KB`,
                `images             1.6 MB`,
                `scripts + styles   400 KB`,
                `= 98% of bytes are the same for everyone`,
              ],
              `layers`,
            ),
          },
          links: Et,
          flows: [
            { route: [`lo`], rate: 1.6, bounce: !0, speed: Tt },
            { route: [`so`], rate: 1.6, bounce: !0, speed: Tt },
          ],
        },
      },
      {
        short: `Edges`,
        chapter: `solution`,
        title: `Put copies at the edge`,
        body: [
          `A <span class="term">CDN</span> (content delivery network) runs <span class="term">edge servers</span> in hundreds of cities. Point your static files at it, and each user is served by the edge nearest them.`,
          `London now gets images in ~10 ms. Only misses (amber) travel all the way to Virginia.`,
        ],
        callout: {
          kind: `tip`,
          text: `Popular CDNs: Cloudflare, Fastly, Akamai, Amazon CloudFront. You rent their edges; you don’t run them.`,
        },
        changes: [
          `+ Edge servers in London and Sydney`,
          `~ 90% of requests answered at the edge`,
          `~ Origin load 9,000 → 900 req/s`,
        ],
        metrics: { lon: 12, syd: 15, origin: 900, hitRate: 90 },
        scene: {
          entities: { lon: bt(), syd: xt(), origin: St(v(0.2)), ...wt() },
          links: Dt,
          flows: Ot(),
        },
      },
      {
        short: `Cold edge`,
        chapter: `technique`,
        title: `First requests are misses`,
        body: [
          `Edges are <span class="term">pull-through</span> caches: they start empty. The first request for a file misses, the edge fetches it from the origin, keeps a copy, and serves everyone after that.`,
          `London’s edge is warm; Sydney’s just started and is still filling up — so Sydney users briefly pay the long trip.`,
        ],
        callout: {
          kind: `insight`,
          text: `This is the same cache-aside idea from the last lesson, spread around the planet.`,
        },
        changes: [
          `~ Sydney edge: cold, filling from origin`,
          `~ Sydney latency 15 → 95 ms (for now)`,
        ],
        metrics: { lon: 12, syd: 95, origin: 2400, hitRate: 70 },
        scene: {
          entities: {
            lon: bt(),
            syd: xt(),
            origin: St(v(0.32)),
            ...wt(
              { tags: [{ text: `warm`, tone: `green` }] },
              { tags: [{ text: `cold · filling`, tone: `amber`, icon: `alert` }] },
            ),
          },
          links: Dt,
          flows: Ot(0.93, 0.45),
        },
      },
      {
        short: `Old files`,
        chapter: `problem`,
        title: `You ship a new logo. Nobody sees it.`,
        body: [
          `You replace <code>logo.png</code> on the origin. But edges cached the old one with a one-day TTL, so users keep seeing the old logo — some in London, some in Sydney, for hours.`,
          `You could purge the edges — modern CDNs do that in seconds — but someone has to remember to, every time, and no purge can reach the copies already saved in users’ browsers.`,
        ],
        callout: {
          kind: `warn`,
          text: `Long TTLs are what make a CDN fast — and what makes updates slow to appear.`,
        },
        changes: [`~ Origin: new logo.png`, `− Edges still serve the old one`],
        metrics: { lon: 12, syd: 15, origin: 900, hitRate: 90 },
        scene: {
          entities: {
            lon: bt(),
            syd: xt(),
            origin: St({ ...v(0.2), tags: [{ text: `logo.png · new`, tone: `green` }] }),
            ...wt(
              { tags: [{ text: `logo.png · old`, tone: `red`, icon: `alert` }] },
              { tags: [{ text: `logo.png · old`, tone: `red`, icon: `alert` }] },
            ),
          },
          links: Dt,
          flows: Ot(),
        },
      },
      {
        short: `Versioning`,
        chapter: `solution`,
        title: `Give every version a new name`,
        body: [
          `Put a fingerprint of the file’s contents in its name: <code>logo.3f9a.png</code>. A new logo gets a new name, so it can never be confused with the old one.`,
          `Now files can be cached for a <b>year</b>. The HTML (short TTL, or not cached) simply points at the latest names.`,
        ],
        callout: {
          kind: `tip`,
          text: `Build tools such as Vite and webpack add these content hashes for you.`,
        },
        changes: [`~ logo.png → logo.3f9a.png`, `~ Cache lifetime 1 day → 1 year`, `− Stale logos`],
        metrics: { lon: 12, syd: 15, origin: 900, hitRate: 96 },
        scene: {
          entities: {
            lon: bt(),
            syd: xt(),
            origin: St({ ...v(0.15), tags: [{ text: `logo.3f9a.png`, tone: `green` }] }),
            ...wt(
              { tags: [{ text: `logo.3f9a.png · 1 yr`, tone: `green` }] },
              { tags: [{ text: `logo.3f9a.png · 1 yr`, tone: `green` }] },
            ),
          },
          links: Dt,
          flows: Ot(0.96, 0.96),
        },
      },
      {
        short: `Spike`,
        chapter: `insight`,
        title: `Spikes hit the edge, not you`,
        body: [
          `A launch goes viral and traffic jumps 20×. Almost all of it is answered by edges spread around the world; the origin barely notices.`,
          `The same spread-out capacity helps absorb floods of malicious traffic (DDoS attacks).`,
        ],
        callout: {
          kind: `insight`,
          text: `A CDN is a cache, a global network and a shield for your origin, all at once.`,
        },
        changes: [`~ Traffic × 20`, `~ Origin load stays ≈ 1,100 req/s`],
        metrics: { lon: 14, syd: 18, origin: 1100, hitRate: 97 },
        scene: {
          entities: {
            lon: bt(15, `London · ×20`),
            syd: xt(15, `Sydney · ×20`),
            origin: St(v(0.2)),
            ...wt({ cpu: 0.6 }, { cpu: 0.6 }),
          },
          links: Dt,
          flows: Ot(0.97, 0.97, 4.6),
        },
      },
      {
        short: `Private`,
        chapter: `problem`,
        title: `Case: never cache someone’s cart`,
        body: [
          `A config change tells the CDN to cache <em>every</em> page for 5 minutes. Bob opens his cart; the edge stores it. Alice opens hers a second later — and the edge serves her <b>Bob’s cart</b>.`,
          `Pages that depend on who is asking must be marked <code>Cache-Control: private</code> (or <code>no-store</code>) so edges always pass them through to the origin.`,
        ],
        callout: {
          kind: `warn`,
          text: `Caching personal data publicly is a classic, very public incident. Default to private; cache public content on purpose.`,
        },
        changes: [
          `+ Cart and account pages: Cache-Control: private`,
          `~ Personal pages always go to the origin`,
        ],
        metrics: { lon: 12, syd: 15, origin: 1400, hitRate: 88 },
        scene: {
          entities: {
            lon: bt(),
            syd: xt(),
            origin: St(v(0.22)),
            ...wt(
              { tags: [{ text: `/cart → private · pass`, tone: `amber`, icon: `lock` }] },
              { tags: [{ text: `/cart → private · pass`, tone: `amber`, icon: `lock` }] },
            ),
          },
          links: Dt,
          flows: [
            ...Ot(0.88, 0.88),
            { route: [`le`, `eo`], kind: `mine`, rate: 0.5, bounce: !0, speed: Tt },
          ],
        },
      },
      {
        short: `Shield`,
        chapter: `technique`,
        title: `Origin shield: one more layer`,
        body: [
          `A real CDN has hundreds of edges. When a new file goes viral, every edge misses once — hundreds of requests for the same file hit your origin at the same moment.`,
          `An <span class="term">origin shield</span> is a mid-tier cache in front of the origin. Edges miss to the shield; only the shield ever asks the origin, so each file is fetched once.`,
        ],
        callout: {
          kind: `tip`,
          text: `Most CDNs offer shielding as a setting. Pick a shield location close to your origin.`,
        },
        changes: [`+ Origin shield between edges and origin`, `~ Origin sees one fetch per file`],
        metrics: { lon: 12, syd: 15, origin: 120, hitRate: 98 },
        scene: {
          entities: {
            lon: bt(),
            syd: xt(),
            origin: d(-9, 9, { label: [`Origin`], sub: `Virginia`, ...v(0.05) }),
            sh: d(0, 0, {
              color: `green`,
              glyph: `shield`,
              label: [`Shield`],
              sub: `mid-tier cache`,
            }),
            ...wt(),
          },
          links: {
            le: Dt.le,
            se: Dt.se,
            esh: h(`el`, `sh`, [`el`, `sh`], {
              heads: `both`,
              style: `dashed`,
              label: `edge miss`,
            }),
            ssh: h(`es`, `sh`, [`es`, `sh`], { heads: `both`, style: `dashed` }),
            sho: h(`sh`, `origin`, [`sh`, [`sh`, `origin`], `origin`], {
              heads: `both`,
              label: `once per file`,
            }),
          },
          flows: [
            {
              routes: [
                { path: [`le`], weight: 0.92 },
                { path: [`le`, `esh`], weight: 0.08, kind: `slow` },
              ],
              pick: `weights`,
              rate: 1.8,
              bounce: !0,
              speed: Tt,
            },
            {
              routes: [
                { path: [`se`], weight: 0.92 },
                { path: [`se`, `ssh`], weight: 0.08, kind: `slow` },
              ],
              pick: `weights`,
              rate: 1.8,
              bounce: !0,
              speed: Tt,
            },
            { route: [`sho`], kind: `slow`, rate: 0.15, bounce: !0 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Distance adds latency; <b>edge servers</b> move content close to users.</li>
          <li>CDNs are <b>pull-through caches</b>: misses fill them from your origin.</li>
          <li><b>Versioned file names</b> let you cache for a year and still update instantly.</li>
          <li>The edge absorbs <b>spikes</b> and shields the origin.</li>
          <li>Never cache <b>personal pages</b> publicly; add an <b>origin shield</b> at scale.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `That wraps up Scaling. Next module: <b>Data & Storage</b>, starting with SQL vs NoSQL.`,
        },
        metrics: { lon: 12, syd: 15, origin: 900, hitRate: 96 },
        scene: {
          entities: { lon: bt(), syd: xt(), origin: St(v(0.15)), ...wt() },
          links: Dt,
          flows: Ot(0.96, 0.96),
        },
      },
    ],
  };

const At = { x0: -4.5, x1: 4.5, y0: -16, y1: -10 };

const jt = { x0: -16, x1: -8, y0: -4, y1: 4 };

const Mt = () => p(At, 11, `1M users`);

const Nt = () => d(0, 0, { label: [`App`, `Server`] });

const Pt = (e = {}) => b(11, 0, { glyph: `listOrdered`, label: `SQL database`, ...e });

const Ft = (e = {}) => b(0, 11, { glyph: `file`, label: `document store`, ...e });

const It = () => ({
    kvz: x(jt, `KEY–VALUE · 3 NODES`),
    kv1: b(-12, -2.2, { r: 1.3, h: 28, glyph: `zap` }),
    kv2: b(-12, 2.2, { r: 1.3, h: 28, glyph: `zap` }),
    kv3: b(-14.6, 0, { r: 1.3, h: 28, glyph: `zap` }),
  });

const w = {
    ua: h(`users`, `app`, [`users`, `app`], { heads: `both` }),
    as: (e = {}) => ({ as: h(`app`, `sql`, [`app`, `sql`], { heads: `both`, ...e }) }),
    ad: (e = {}) => ({ ad: h(`app`, `doc`, [`app`, `doc`], { heads: `both`, ...e }) }),
    ak: (e = {}) => ({ ak: h(`app`, `kvz`, [`app`, `kvz`], { heads: `both`, ...e }) }),
  };

const Lt = (e, t, n, r = { x: 11, y: 0, dx: 40, dy: -230 }) => S({ z: 0, ...r }, e, t, { icon: n });

const Rt = (e, t = 2.4, n = {}) => ({ route: [`ua`, ...e], rate: t, bounce: !0, ...n });

export const sqlNosqlLesson = {
    id: `sql-nosql`,
    title: `SQL vs NoSQL`,
    summary: `Tables, documents or plain keys — what each kind of database is good at, and what it gives up.`,
    minutes: 11,
    level: `beginner`,
    metrics: [`joins`, `tx`, `schema`, `scaleOut`],
    legend: [`req`, `res`, `write`],
    goals: [
      { text: `Tables, joins and transactions`, step: 1 },
      { text: `Where relational databases strain`, step: 2 },
      { text: `Document and key-value stores`, step: 4 },
      { text: `Choosing per kind of data`, step: 6 },
      { text: `Search engines and other specialists`, step: 7 },
    ],
    steps: [
      {
        short: `Tables`,
        chapter: `setup`,
        title: `Data in tables`,
        body: [
          `Most apps start with a <span class="term">relational</span> (SQL) database such as PostgreSQL or MySQL. Data lives in tables with a fixed set of columns — a <span class="term">schema</span>.`,
          `Tables point at each other with keys, and a <b>join</b> combines them in one query: “every order with its customer’s name”.`,
        ],
        callout: {
          kind: `insight`,
          text: `SQL databases have decades of tooling behind them. When unsure, they’re a very safe default.`,
        },
        metrics: { joins: `yes`, tx: `yes`, schema: `fixed`, scaleOut: `hard` },
        scene: {
          entities: {
            users: Mt(),
            app: Nt(),
            sql: Pt(),
            card: Lt(
              `Tables`,
              [
                `users   (id, name, email)`,
                `orders  (id, user_id, total)`,
                `# orders.user_id → users.id`,
                `= JOIN them in one query`,
              ],
              `listOrdered`,
            ),
          },
          links: { ua: w.ua, ...w.as() },
          flows: [Rt([`as`])],
        },
      },
      {
        short: `Transactions`,
        chapter: `technique`,
        title: `All or nothing: transactions`,
        body: [
          `Moving $50 from Ana to Ben is two updates. If the server crashes between them, money disappears.`,
          `A <span class="term">transaction</span> groups them: both happen, or neither does. Relational databases guarantee this (the <b>ACID</b> properties), which is why they hold payments, orders and inventory.`,
        ],
        callout: {
          kind: `tip`,
          text: `ACID: Atomic (all or nothing), Consistent (rules hold), Isolated (no half-done views), Durable (committed means saved).`,
        },
        changes: [`+ Two writes, one transaction`],
        metrics: { joins: `yes`, tx: `yes`, schema: `fixed`, scaleOut: `hard` },
        scene: {
          entities: {
            users: Mt(),
            app: Nt(),
            sql: Pt({ tags: [{ text: `ACID`, tone: `green`, icon: `lock` }] }),
            card: Lt(
              `One transaction`,
              [
                `BEGIN`,
                `  UPDATE balance − 50  WHERE id = Ana`,
                `  UPDATE balance + 50  WHERE id = Ben`,
                `= COMMIT — both happen, or neither`,
              ],
              `lock`,
            ),
          },
          links: { ua: w.ua, ...w.as({ label: `BEGIN … COMMIT` }) },
          flows: [Rt([`as`], 1.6), { route: [`as`], kind: `write`, rate: 1.2 }],
        },
      },
      {
        short: `Growing pains`,
        chapter: `problem`,
        title: `Growing pains`,
        body: [
          `Your product catalog lands in the same database. Shoes have sizes, laptops have CPUs, books have authors — so the products table sprouts hundreds of mostly-empty columns, and every new product type means another migration on a 400-million-row table. Some of those rewrite or lock the whole table for hours.`,
          `Meanwhile all writes still go through one database server.`,
        ],
        callout: {
          kind: `warn`,
          text: `Rigid schemas and a single write server are the two classic pain points of relational databases at scale.`,
        },
        changes: [
          `+ Product catalog in the SQL database`,
          `~ Products table: 300 columns, mostly empty`,
        ],
        metrics: { joins: `yes`, tx: `yes`, schema: `fixed`, scaleOut: `hard` },
        scene: {
          entities: {
            users: Mt(),
            app: Nt(),
            sql: Pt({
              heat: 0.75,
              cpu: 0.9,
              tags: [{ text: `ALTER TABLE · 400M rows · 6 h`, tone: `red`, icon: `clock` }],
            }),
          },
          links: { ua: w.ua, ...w.as({ label: `products · orders · users` }) },
          flows: [Rt([`as`], 4.2)],
        },
      },
      {
        short: `Documents`,
        chapter: `solution`,
        title: `Documents: each record its own shape`,
        body: [
          `A <span class="term">document store</span> (such as MongoDB) keeps each record as a self-contained document. A shoe and a laptop can have completely different fields, with no migration to run — though your code must now cope with every shape it has ever written.`,
          `Everything about one product lives together, so reading it is a single fetch, and documents spread naturally across many servers.`,
        ],
        callout: {
          kind: `tip`,
          text: `Documents shine when you read and write whole objects at once — catalogs, profiles, content.`,
        },
        changes: [`+ Document store for the catalog`, `~ SQL database back to orders & users`],
        metrics: { joins: `limited`, tx: `per doc`, schema: `flexible`, scaleOut: `easy` },
        scene: {
          entities: {
            users: Mt(),
            app: Nt(),
            sql: Pt(v(0.45)),
            doc: Ft(),
            card: Lt(
              `Two documents`,
              [
                `{ "sku": "shoe-42",`,
                `  "size": 42, "colors": ["red", "black"] }`,
                `{ "sku": "laptop-7",`,
                `  "cpu": "M3", "ram_gb": 16 }`,
                `# same collection, different shapes`,
              ],
              `file`,
              { x: 0, y: 11, dx: 60, dy: -200 },
            ),
          },
          links: { ua: w.ua, ...w.as(), ...w.ad({ label: `product catalog` }) },
          flows: [
            { routes: [{ path: [`ua`, `as`] }, { path: [`ua`, `ad`] }], rate: 3, bounce: !0 },
          ],
        },
      },
      {
        short: `Key–value`,
        chapter: `technique`,
        title: `Key–value: just look it up`,
        body: [
          `The simplest store of all: a <span class="term">key–value</span> store (Redis, DynamoDB) maps a key to a value. No queries, no joins — get and set by key, in about a millisecond.`,
          `Because each key stands alone, the data splits across many nodes almost for free.`,
        ],
        callout: {
          kind: `tip`,
          text: `Perfect for sessions, carts, feature flags and counters — anything you always fetch by one id.`,
        },
        changes: [`+ Key–value cluster for sessions`],
        metrics: { joins: `no`, tx: `limited`, schema: `none`, scaleOut: `easy` },
        scene: {
          entities: {
            users: Mt(),
            app: Nt(),
            sql: Pt(v(0.4)),
            doc: Ft(),
            ...It(),
            card: Lt(
              `Key → value`,
              [
                `session:9f2c  →  { user: 42, cart: [7, 13] }`,
                `GET / SET by key · ~1 ms`,
                `# nothing to query — only lookups`,
              ],
              `zap`,
              { x: 0, y: 11, dx: 60, dy: -200 },
            ),
          },
          links: { ua: w.ua, ...w.as(), ...w.ad(), ...w.ak({ label: `sessions` }) },
          flows: [
            {
              routes: [
                { path: [`ua`, `ak`], weight: 2 },
                { path: [`ua`, `as`] },
                { path: [`ua`, `ad`] },
              ],
              pick: `weights`,
              rate: 3.4,
              bounce: !0,
            },
          ],
        },
      },
      {
        short: `Trade-offs`,
        chapter: `tradeoff`,
        title: `What NoSQL gives up`,
        body: [
          `NoSQL stores scale out easily largely <em>because</em> they give things up: joins across records, multi-record transactions, and often strict consistency.`,
          `<table class="compare">
          <thead><tr><th></th><th>SQL</th><th>NoSQL</th></tr></thead>
          <tbody>
            <tr><td>Data shape</td><td>Fixed tables</td><td>Flexible</td></tr>
            <tr><td>Joins</td><td>Yes</td><td>In your code</td></tr>
            <tr><td>Transactions</td><td>Across rows</td><td>Usually one record</td></tr>
            <tr><td>Scaling writes</td><td>Hard</td><td>Built in</td></tr>
          </tbody>
        </table>`,
          `These are defaults, not laws, and the lines keep blurring: PostgreSQL stores JSON documents, MongoDB and DynamoDB offer multi-record transactions, and distributed SQL databases (Spanner, CockroachDB) scale writes out while keeping joins and transactions — paying for it in latency and complexity.`,
        ],
        callout: {
          kind: `warn`,
          text: `Picking NoSQL “for scale” you don’t have yet often means rebuilding joins and transactions by hand.`,
        },
        metrics: { joins: `limited`, tx: `limited`, schema: `flexible`, scaleOut: `easy` },
        scene: {
          entities: { users: Mt(), app: Nt(), sql: Pt(v(0.4)), doc: Ft(), ...It() },
          links: { ua: w.ua, ...w.as(), ...w.ad(), ...w.ak() },
          flows: [
            {
              routes: [
                { path: [`ua`, `ak`], weight: 2 },
                { path: [`ua`, `as`] },
                { path: [`ua`, `ad`] },
              ],
              pick: `weights`,
              rate: 3.4,
              bounce: !0,
            },
          ],
        },
      },
      {
        short: `Use both`,
        chapter: `solution`,
        title: `Use each where it fits`,
        body: [
          `Real systems mix them — <span class="term">polyglot persistence</span>. Money and orders stay relational for transactions; the catalog lives in documents; sessions go to a key–value store.`,
          `Start with one database, and add another only when a kind of data clearly wants it.`,
        ],
        callout: {
          kind: `insight`,
          text: `The question isn’t “SQL or NoSQL?” but “what does this data need: relations, flexibility, or raw lookup speed?”`,
        },
        changes: [`~ Orders & payments → SQL`, `~ Catalog → documents`, `~ Sessions → key–value`],
        metrics: { joins: `yes`, tx: `yes`, schema: `flexible`, scaleOut: `easy` },
        scene: {
          entities: { users: Mt(), app: Nt(), sql: Pt(v(0.4)), doc: Ft(), ...It() },
          links: {
            ua: w.ua,
            ...w.as({ label: `orders · payments` }),
            ...w.ad({ label: `catalog` }),
            ...w.ak({ label: `sessions · carts` }),
          },
          flows: [
            {
              routes: [
                { path: [`ua`, `ak`], weight: 2 },
                { path: [`ua`, `as`] },
                { path: [`ua`, `ad`] },
              ],
              pick: `weights`,
              rate: 3.4,
              bounce: !0,
            },
          ],
        },
      },
      {
        short: `Search`,
        chapter: `problem`,
        title: `Case: “red running shoes”`,
        body: [
          `Shoppers type free text into a search box. In SQL that becomes <code>WHERE name LIKE '%red%'</code> on millions of rows — slow, and it can’t rank results, handle typos or match “shoe” to “shoes”.`,
          `A <span class="term">search engine</span> (Elasticsearch, OpenSearch) builds an inverted index: for every word, the list of documents containing it. It’s fed from the main database by a stream of changes.`,
        ],
        callout: {
          kind: `tip`,
          text: `The search index is a copy, not the source of truth — it can always be rebuilt from the main database.`,
        },
        changes: [`+ Search engine for the catalog`, `+ Change stream: SQL → search index`],
        metrics: { joins: `yes`, tx: `yes`, schema: `flexible`, scaleOut: `easy` },
        scene: {
          entities: {
            users: Mt(),
            app: Nt(),
            sql: Pt(v(0.4)),
            doc: Ft(),
            ...It(),
            search: d(11, 11, {
              color: `yellow`,
              glyph: `search`,
              label: [`Search`],
              sub: `inverted index`,
            }),
          },
          links: {
            ua: w.ua,
            ...w.as(),
            ...w.ad(),
            ...w.ak(),
            sx: h(`app`, `search`, [`app`, [5.5, 0], [5.5, 11], `search`], {
              heads: `both`,
              label: `“red running shoes”`,
              labelAt: 0.75,
            }),
            cs: h(`sql`, `search`, [`sql`, `search`], { style: `dashed`, label: `change stream` }),
          },
          flows: [
            {
              routes: [
                { path: [`ua`, `sx`], weight: 2 },
                { path: [`ua`, `as`] },
                { path: [`ua`, `ak`] },
              ],
              pick: `weights`,
              rate: 3.4,
              bounce: !0,
            },
            { route: [`cs`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Specialists`,
        chapter: `insight`,
        title: `More specialised stores`,
        body: [
          `Search is one example of a store built for one access pattern. There are others, each much better than a general database at its job — and worse at everything else.`,
          `Reach for them when a workload clearly doesn’t fit, not by default: every extra store is more to run, secure, back up and keep in sync.`,
        ],
        callout: {
          kind: `insight`,
          text: `Most systems run fine on one relational database for years. Add specialists one at a time, for a measured need.`,
        },
        metrics: { joins: `yes`, tx: `yes`, schema: `flexible`, scaleOut: `easy` },
        scene: {
          entities: {
            users: Mt(),
            app: Nt(),
            sql: Pt(v(0.4)),
            doc: Ft(),
            ...It(),
            search: d(11, 11, {
              color: `yellow`,
              glyph: `search`,
              label: [`Search`],
              sub: `inverted index`,
            }),
            card: Lt(
              `Built for one job`,
              [
                `search        free text, ranking, typos`,
                `time-series   metrics, sensor data`,
                `graph         friends-of-friends`,
                `wide-column   huge write volumes`,
                `object store  files, images, backups`,
              ],
              `layers`,
              { x: 0, y: 11, dx: 60, dy: -205 },
            ),
          },
          links: {
            ua: w.ua,
            ...w.as(),
            ...w.ad(),
            ...w.ak(),
            sx: h(`app`, `search`, [`app`, [5.5, 0], [5.5, 11], `search`], { heads: `both` }),
            cs: h(`sql`, `search`, [`sql`, `search`], { style: `dashed`, label: `change stream` }),
          },
          flows: [
            {
              routes: [
                { path: [`ua`, `sx`] },
                { path: [`ua`, `as`] },
                { path: [`ua`, `ad`] },
                { path: [`ua`, `ak`] },
              ],
              rate: 3.4,
              bounce: !0,
            },
            { route: [`cs`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>SQL</b>: tables, joins and transactions — a safe default.</li>
          <li><b>Documents</b>: flexible, self-contained records that scale out.</li>
          <li><b>Key–value</b>: fastest and simplest, lookup by id only.</li>
          <li>Choose per kind of data; many systems use <b>several</b>.</li>
          <li>Specialists like <b>search</b> are copies fed from the source of truth.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Indexes</b> — why the same query can take 2 seconds or 2 milliseconds.`,
        },
        metrics: { joins: `yes`, tx: `yes`, schema: `flexible`, scaleOut: `easy` },
        scene: {
          entities: { users: Mt(), app: Nt(), sql: Pt(v(0.4)), doc: Ft(), ...It() },
          links: { ua: w.ua, ...w.as(), ...w.ad(), ...w.ak() },
          flows: [
            {
              routes: [
                { path: [`ua`, `ak`], weight: 2 },
                { path: [`ua`, `as`] },
                { path: [`ua`, `ad`] },
              ],
              pick: `weights`,
              rate: 3.4,
              bounce: !0,
            },
          ],
        },
      },
    ],
  };

const Bt = { x0: -11.8, x1: 11.8, y0: 6.6, y1: 9.4 };

const Vt = { x0: -9.6, x1: 9.6, y0: -10.6, y1: 0.4 };

const Ht = Array.from({ length: 12 }, (e, t) => -10.45 + t * 1.9);

const Ut = 5.2;

const Wt = () => ({ app: d(-13, -14, { label: [`App`] }) });

const Gt = (e = `USERS TABLE · 50M ROWS`) => {
    let t = { tbl: x(Bt, e) };
    return (
      Ht.forEach((e, n) => {
        t[`p${n}`] = d(e, 8, { s: 1.55, h: 10, radius: 3, color: `purple`, glyph: ``, label: [] });
      }),
      t
    );
  };

const Kt = (e, t, n) => d(e, t, { s: 3, h: 30, color: `yellow`, glyph: ``, label: [n] });

const qt = (e = [`A–Z`, `A–H`, `I–Q`, `R–Z`], t = `INDEX ON email · B-TREE`) => ({
    idx: x(Vt, t),
    root: Kt(0, -8, e[0]),
    b1: Kt(-7, -2, e[1]),
    b2: Kt(0, -2, e[2]),
    b3: Kt(7, -2, e[3]),
  });

const Jt = {
    scan: h(`app`, null, [`app`, [-13, Ut], [11.6, Ut]], {
      heads: `none`,
      label: `reads every page`,
      labelAt: 0.62,
    }),
  };

const Yt = {
    ar: h(`app`, `root`, [`app`, [`root`, `app`], `root`], { heads: `both` }),
    rb1: h(`root`, `b1`, [`root`, [`b1`, `root`], `b1`], { heads: `both` }),
    rb2: h(`root`, `b2`, [`root`, `b2`], { heads: `both` }),
    rb3: h(`root`, `b3`, [`root`, [`b3`, `root`], `b3`], { heads: `both` }),
    b1p: h(`b1`, `p2`, [`b1`, [`p2`, `b1`], `p2`], { heads: `both` }),
    b2p: h(`b2`, `p6`, [`b2`, [`p6`, `b2`], `p6`], { heads: `both` }),
    b3p: h(`b3`, `p9`, [`b3`, [`p9`, `b3`], `p9`], { heads: `both` }),
  };

const Xt = (e = 2.2) => [
    {
      routes: [
        { path: [`ar`, `rb1`, `b1p`] },
        { path: [`ar`, `rb2`, `b2p`] },
        { path: [`ar`, `rb3`, `b3p`] },
      ],
      rate: e,
      bounce: !0,
    },
  ];

const Zt = { route: [`scan`], kind: `slow`, rate: 0.45, speed: 0.42 };

const Qt = (e, t, n) => S({ x: 11.8, y: 6.6, z: 0, dx: 34, dy: -215 }, e, t, { icon: n });

const $t = Qt(
    `The query`,
    [`SELECT * FROM users`, `WHERE email = 'alice@example.com'`, `# 50,000,000 rows · no index`],
    `search`,
  );

export const indexesLesson = {
    id: `indexes`,
    title: `Indexes`,
    summary: `Why the same query can take two seconds or two milliseconds.`,
    minutes: 12,
    level: `beginner`,
    metrics: [`p95`, `rows`, `writeCost`, `indexes`],
    legend: [[`slow`, `full table scan`], `req`, `res`, `write`],
    goals: [
      { text: `What a full table scan costs`, step: 0 },
      { text: `How a B-tree index finds a row`, step: 3 },
      { text: `What indexes cost on every write`, step: 4 },
      { text: `Composite indexes and column order`, step: 5 },
      { text: `When an index can’t help — and how to check`, step: 6 },
    ],
    steps: [
      {
        short: `Slow query`,
        chapter: `problem`,
        title: `Finding one user takes two seconds`,
        body: [
          `Logging in looks up a user by email. With 50 million users, it takes over two seconds — and it gets slower every day.`,
          `With nothing to guide it, the database does a <span class="term">full table scan</span>: it reads every page of the table, checking each row. Watch the amber request crawl along.`,
        ],
        callout: {
          kind: `warn`,
          text: `Scans grow with the table. Fine at a thousand rows; painful at fifty million.`,
        },
        metrics: { p95: 2300, rows: 5e7, writeCost: 1, indexes: 0 },
        scene: { entities: { ...Wt(), ...Gt(), q: $t }, links: Jt, flows: [Zt] },
      },
      {
        short: `Phone book`,
        chapter: `insight`,
        title: `How a phone book does it`,
        body: [
          `Nobody reads a phone book page by page. Because it’s <b>sorted</b>, you open the middle, see whether your name comes before or after, and throw away half the book. Repeat.`,
          `Halving 50 million entries takes only about 26 steps.`,
        ],
        callout: {
          kind: `insight`,
          text: `An index is a sorted copy of one column, with a pointer back to each full row.`,
        },
        metrics: { p95: 2300, rows: 5e7, writeCost: 1, indexes: 0 },
        scene: {
          entities: {
            ...Wt(),
            ...Gt(),
            q: Qt(
              `Sorted → binary search`,
              [
                `halve the range at every step`,
                `log₂(50,000,000) ≈ 26 steps`,
                `= 26 comparisons, not 50 million`,
              ],
              `bulb`,
            ),
          },
          links: Jt,
          flows: [Zt],
        },
      },
      {
        short: `Add index`,
        chapter: `solution`,
        title: `Add an index`,
        body: [
          `<code>CREATE INDEX ON users (email)</code> builds a <span class="term">B-tree</span>: a small tree of sorted keys. The root says which branch covers your email, the branch says which page holds the row.`,
          `Three hops instead of fifty million rows: the lookup now takes about 2 ms.`,
        ],
        callout: {
          kind: `tip`,
          text: `Primary keys get an index automatically. Columns you search, join or sort on usually need one too.`,
        },
        changes: [
          `+ B-tree index on email`,
          `~ Rows read 50,000,000 → 1`,
          `~ p95 latency 2.3 s → 2 ms`,
        ],
        metrics: { p95: 2, rows: 1, writeCost: 2, indexes: 1 },
        scene: { entities: { ...Wt(), ...Gt(), ...qt() }, links: Yt, flows: Xt() },
      },
      {
        short: `Why shallow`,
        chapter: `technique`,
        title: `Why B-trees stay shallow`,
        body: [
          `Each tree node is one disk page holding hundreds of keys, so every level multiplies the reach by hundreds.`,
          `Three or four levels cover billions of rows — and the top levels are used so often they stay in memory.`,
        ],
        callout: {
          kind: `insight`,
          text: `That’s why an indexed lookup costs about the same at a million rows as at a billion.`,
        },
        metrics: { p95: 2, rows: 1, writeCost: 2, indexes: 1 },
        scene: {
          entities: {
            ...Wt(),
            ...Gt(),
            ...qt(),
            q: Qt(
              `Fan-out per level`,
              [
                `each node ≈ 500 keys`,
                `2 levels: 500² = 250,000 rows`,
                `3 levels: 500³ = 125,000,000 rows`,
                `= ~4 page reads to find any row`,
              ],
              `layers`,
            ),
          },
          links: Yt,
          flows: Xt(),
        },
      },
      {
        short: `Writes pay`,
        chapter: `tradeoff`,
        title: `Every index makes writes slower`,
        body: [
          `When a user signs up, the row goes into the table <em>and</em> into every index on it, keeping each one sorted. Watch the writes (dark squares) land in both places.`,
          `Indexes also take disk and memory. Index what you query, not everything.`,
        ],
        callout: {
          kind: `warn`,
          text: `A table with 6 indexes does 7 writes per insert. Unused indexes are pure cost.`,
        },
        changes: [`+ Inserts update table and index`, `~ Writes per insert 1 → 2`],
        metrics: { p95: 2, rows: 1, writeCost: 2, indexes: 1 },
        scene: {
          entities: { ...Wt(), ...Gt(), ...qt() },
          links: {
            ...Yt,
            ins: h(`app`, `p11`, [`app`, [-13, Ut], [`p11`, Ut], `p11`], {
              label: `INSERT row`,
              labelAt: 0.7,
            }),
          },
          flows: [
            ...Xt(1.4),
            {
              fanout: !0,
              routes: [{ path: [`ins`] }, { path: [`ar`, `rb3`, `b3p`] }],
              kind: `write`,
              rate: 0.6,
            },
          ],
        },
      },
      {
        short: `Column order`,
        chapter: `technique`,
        title: `Composite indexes: order matters`,
        body: [
          `An index can cover several columns, like <code>(country, city)</code>. It’s sorted by country first, then by city within each country — like a phone book sorted by last name, then first name.`,
          `It speeds up queries on <code>country</code>, or <code>country</code> + <code>city</code>. A query on <code>city</code> alone can’t use it and falls back to a scan.`,
        ],
        callout: {
          kind: `tip`,
          text: `Put the column you always filter on first. Indexes help from the left.`,
        },
        changes: [`~ Index on (country, city)`, `+ City-only query → full scan`],
        metrics: { p95: 2, rows: 1, writeCost: 2, indexes: 1 },
        scene: {
          entities: {
            ...Wt(),
            ...Gt(),
            ...qt([`country`, `DE · city`, `NL · city`, `US · city`], `INDEX ON (country, city)`),
            q: Qt(
              `Can it use the index?`,
              [
                `country = 'NL' AND city = 'Delft'  ✓`,
                `country = 'NL'                     ✓`,
                `! city = 'Delft'  ✗ full scan`,
              ],
              `search`,
            ),
          },
          links: { ...Yt, ...Jt },
          flows: [...Xt(1.8), Zt],
        },
      },
      {
        short: `Wildcards`,
        chapter: `problem`,
        title: `Case: queries the index can’t help`,
        body: [
          `Marketing asks for every Gmail user: <code>WHERE email LIKE '%@gmail.com'</code>. The index is sorted by the <em>start</em> of each email, and this pattern says nothing about the start — so it’s a full scan again.`,
          `The same happens with functions: <code>WHERE LOWER(email) = …</code> can’t use a plain index on <code>email</code>, because the index stores the original values.`,
        ],
        callout: {
          kind: `tip`,
          text: `Fixes: an expression index on LOWER(email), a stored domain column with its own index, or a search engine for free-text matching.`,
        },
        changes: [`+ Leading-wildcard query`, `~ Index ignored → full scan`],
        metrics: { p95: 2300, rows: 5e7, writeCost: 2, indexes: 1 },
        scene: {
          entities: {
            ...Wt(),
            ...Gt(),
            ...qt(),
            q: Qt(
              `Can it use the index?`,
              [
                `email = 'alice@…'          ✓ seek`,
                `email LIKE 'alice%'          ✓ range`,
                `! email LIKE '%@gmail.com'  ✗ scan`,
                `! LOWER(email) = '…'        ✗ scan`,
              ],
              `search`,
            ),
          },
          links: { ...Yt, ...Jt },
          flows: [Zt],
        },
      },
      {
        short: `Selectivity`,
        chapter: `problem`,
        title: `Case: the index nobody uses`,
        body: [
          `Support wants every user in one country: <code>WHERE country = 'US'</code>. You add an index on <code>country</code> — and the database ignores it, because 40% of all rows match.`,
          `Following the index would mean hopping to a different table page for each of 20 million rows — slower than simply reading the table front to back. An index pays off when it is <span class="term">selective</span>: when it narrows the search to a small fraction of the rows.`,
        ],
        callout: {
          kind: `tip`,
          text: `If you only ever query a small slice — <code>WHERE status = 'pending'</code> — use a <b>partial index</b> that contains just those rows: tiny, fast and cheap to maintain.`,
        },
        changes: [
          `+ Index on country`,
          `~ 40% of rows match → full scan anyway`,
          `~ Writes per insert 2 → 3, for nothing`,
        ],
        metrics: { p95: 2600, rows: 5e7, writeCost: 3, indexes: 2 },
        scene: {
          entities: {
            ...Wt(),
            ...Gt(),
            ...qt([`all`, `AR – FR`, `GB – MX`, `NG – ZA`], `INDEX ON country · NOT SELECTIVE`),
            q: Qt(
              `How many rows match?`,
              [
                `email = 'alice@…'      1 row    ✓ index`,
                `= status = 'pending'    0.1%     ✓ partial index`,
                `! country = 'US'        40%      ✗ scan is cheaper`,
                `# an index helps when it rules out most rows`,
              ],
              `search`,
            ),
          },
          links: { ...Yt, ...Jt },
          flows: [Zt],
        },
      },
      {
        short: `EXPLAIN`,
        chapter: `technique`,
        title: `Ask the database: EXPLAIN`,
        body: [
          `You don’t have to guess. Prefix a query with <code>EXPLAIN</code> and the database shows its plan: which index it will use, and how many rows it expects to read.`,
          `“Index Scan” on a few rows is good news. “Seq Scan” on a big table is the red flag. <code>EXPLAIN ANALYZE</code> runs the query and reports real timings.`,
        ],
        callout: {
          kind: `tip`,
          text: `Most databases also keep a slow-query log. Start there: it lists the queries actually costing you time.`,
        },
        changes: [`+ Query plan shown`, `− Unused country index dropped`],
        metrics: { p95: 2, rows: 1, writeCost: 2, indexes: 1 },
        scene: {
          entities: {
            ...Wt(),
            ...Gt(),
            ...qt(),
            q: Qt(
              `EXPLAIN`,
              [
                `SELECT * FROM users WHERE email = 'a@…'`,
                `= Index Scan using users_email_idx`,
                `#   rows=1  time=0.04 ms`,
                `SELECT * FROM users WHERE email LIKE '%@g…'`,
                `! Seq Scan on users  rows=50,000,000`,
              ],
              `search`,
            ),
          },
          links: Yt,
          flows: Xt(),
        },
      },
      {
        short: `Covering`,
        chapter: `technique`,
        title: `Covering indexes: skip the table`,
        body: [
          `The login page only needs the user’s name and id. If the index stores those columns too, the database can answer from the index alone — it never visits the table pages.`,
          `This is a <span class="term">covering index</span>. Watch lookups stop at the branches instead of reaching the table.`,
        ],
        callout: {
          kind: `tip`,
          text: `In PostgreSQL: CREATE INDEX ON users (email) INCLUDE (id, name). It makes the index bigger, so cover only hot queries.`,
        },
        changes: [`~ Index includes id and name`, `− Table lookups for this query`],
        metrics: { p95: 1, rows: 1, writeCost: 2, indexes: 1 },
        scene: {
          entities: {
            ...Wt(),
            ...Gt(),
            ...qt(
              [`A–Z`, `A–H + name`, `I–Q + name`, `R–Z + name`],
              `INDEX ON email INCLUDE (id, name)`,
            ),
          },
          links: Yt,
          flows: [
            {
              routes: [{ path: [`ar`, `rb1`] }, { path: [`ar`, `rb2`] }, { path: [`ar`, `rb3`] }],
              rate: 2.4,
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
          <li>Without an index, a lookup <b>scans every row</b>.</li>
          <li>A <b>B-tree</b> index finds any row in a handful of page reads.</li>
          <li>Every index adds work to <b>every write</b> — index what you query.</li>
          <li>Composite indexes work <b>from the leftmost column</b>.</li>
          <li>Leading wildcards, functions and <b>low selectivity</b> defeat indexes — check with <b>EXPLAIN</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Storage Engines</b> — what the database actually does with a write, and why some are built for reads and others for writes.`,
        },
        metrics: { p95: 2, rows: 1, writeCost: 2, indexes: 1 },
        scene: { entities: { ...Wt(), ...Gt(), ...qt() }, links: Yt, flows: Xt() },
      },
    ],
  };

const tn = 2;

const nn = (e = {}) => d(0, -15, { label: [`App`], ...e });

const rn = (e = {}) =>
    d(0, -5, { s: 4.4, h: 44, color: `green`, glyph: `zap`, label: [`Pages in`, `memory`], ...e });

const an = (e = {}) =>
    rn({ glyph: `listOrdered`, label: [`Memtable`], sub: `sorted · in memory`, ...e });

const on = { x0: 10.2, x1: 23.4, y0: -8.6, y1: -2.4 };

const sn = (e, t = []) => ({
    lz: x(on, `LOG FILE · APPEND ONLY`),
    wal: d(13, -5, { s: 3.4, h: 22, color: `yellow`, glyph: `scroll`, label: [`Log`], tags: t }),
    ent: ee(16.2, -5, e, [1, 0], { gap: 1.05, color: `#8d99ae` }),
  });

const cn = Array.from({ length: 10 }, (e, t) => -9.45 + t * 2.1);

const ln = { x0: -11, x1: 11, y0: 7.4, y1: 10.6 };

const un = (e = [], t = `data file · 8 KB pages`, n = {}) => {
    let r = { pz: x(ln, ``) };
    return (
      cn.forEach((i, a) => {
        r[`p${a}`] = d(i, 9, {
          s: 1.7,
          h: 11,
          radius: 3,
          color: `purple`,
          glyph: ``,
          label: [],
          heat: e.includes(a) ? 0.85 : 0,
          tags: a === 0 && t ? [{ text: t, icon: `file` }] : [],
          ...(n[a] || {}),
        });
      }),
      r
    );
  };

const dn = (e, t = {}) => h(`mem`, `p${e}`, [`mem`, [`mem`, tn], [cn[e], tn], `p${e}`], t);

const fn = (e, t = {}) => Object.fromEntries(e.map((e) => [`f${e}`, dn(e, t)]));

const pn = (e, t, n = {}) => ({
    routes: e.map((e) => ({ path: [`f${e}`] })),
    kind: `write`,
    rate: t,
    ...n,
  });

const mn = [1, 4, 6, 8];

const hn = [0, 2, 3, 5, 7, 9];

const gn = [-7.5, -2.5, 2.5, 7.5];

const _n = (e, t = [], n = {}) =>
    d(gn[e], 9, { s: 3.5, h: 13, radius: 4, color: `purple`, glyph: ``, label: [], tags: t, ...n });

const vn = (e = {}) => ({
    pz: x(ln, ``),
    s0: _n(0, e[0] || [{ text: `sorted files (SSTables) · oldest`, icon: `file` }]),
    s1: _n(1, e[1] || []),
    s2: _n(2, e[2] || []),
    s3: _n(3, e[3] || [{ text: `newest`, icon: `clock` }]),
  });

const yn = (e, t = {}) => h(`mem`, `s${e}`, [`mem`, [`mem`, tn], [gn[e], tn], `s${e}`], t);

const T = {
    am: (e = {}) => h(`app`, `mem`, [`app`, `mem`], { heads: `both`, ...e }),
    mw: (e = {}) => h(`mem`, `wal`, [`mem`, `wal`], e),
  };

const bn = (e = 1.4, t = {}) => ({ route: [`am`], kind: `write`, rate: e, bounce: !0, ...t });

const xn = (e = 1.4, t = {}) => ({ route: [`mw`], kind: `write`, rate: e, ...t });

const Sn = (e, t, n, r = {}) => S({ x: 0, y: -5, z: 0, dx: -398, dy: -196, ...r }, e, t, { icon: n });

const Cn = { crashSafe: `yes`, wps: 4e4, diskPattern: `log + random pages`, lookupCost: `3–4 pages` };

const wn = { crashSafe: `yes`, wps: 2e5, diskPattern: `all sequential`, lookupCost: `≈ 1 file` };

const Tn = (e = [{ text: `merged · newest values only`, tone: `green`, icon: `merge` }]) => ({
    app: nn(),
    mem: an(),
    ...sn(3),
    pz: x(ln, ``),
    big: d(-4, 9, { s: 5.2, h: 15, radius: 4, color: `purple`, glyph: ``, label: [], tags: e }),
    s3: _n(3, [{ text: `newest`, icon: `clock` }]),
  });

const En = () => ({ am: T.am(), mw: T.mw(), n3: yn(3, { label: `flush`, labelAt: 0.5 }) });

const Dn = () => [bn(3), xn(2.4), { route: [`n3`], kind: `heavy`, rate: 0.5 }];

const On = [-10.5, -6.3, -2.1, 2.1, 6.3, 10.5];

const kn = [`id`, `user`, `item`, `price`, `date`, `+35`];

export const storageEnginesLesson = {
    id: `storage-engines`,
    title: `Storage Engines`,
    summary: `What a database actually does with your write — and why some are built for reads and others for writes.`,
    minutes: 14,
    level: `intermediate`,
    metrics: [`crashSafe`, `wps`, `diskPattern`, `lookupCost`],
    legend: [
      [`write`, `write`],
      [`req`, `read`],
      `res`,
      [`heavy`, `flush / batch`],
      [`slow`, `page read from disk`],
      `fail`,
    ],
    goals: [
      { text: `Why “saved” needs a write-ahead log`, step: 2 },
      { text: `fsync, group commit and checkpoints`, step: 4 },
      { text: `How a B-tree engine reads and writes`, step: 5 },
      { text: `LSM-trees: memtable, SSTables, Bloom filters, compaction`, step: 9 },
      { text: `Choosing: B-tree or LSM, rows or columns`, step: 11 },
    ],
    steps: [
      {
        short: `Two places`,
        chapter: `setup`,
        title: `Memory and disk`,
        body: [
          `A database server has two places to keep data. <b>Memory</b> is fast — a change takes nanoseconds — but everything in it vanishes when the process stops. <b>Disk</b> survives a crash or a power cut, but a write that must be confirmed as truly on the device (an <code>fsync</code>) is thousands of times slower.`,
          `A <span class="term">storage engine</span> is the part of the database that decides what goes where, and when. Every design is a different answer to one question: how do you get the speed of memory and the safety of disk at once?`,
        ],
        callout: {
          kind: `insight`,
          text: `Tables are stored as fixed-size <b>pages</b> — typically 8 or 16 KB, each holding dozens of rows. The engine keeps recently used pages in memory and reads the rest from disk on demand.`,
        },
        metrics: { crashSafe: `?`, wps: `—`, diskPattern: `—`, lookupCost: `—` },
        scene: {
          entities: { app: nn(), mem: rn(), ...un() },
          links: { am: T.am(), ...fn(mn, { style: `dashed` }) },
          flows: [bn(1.2), pn(mn, 0.4)],
        },
      },
      {
        short: `Crash`,
        chapter: `problem`,
        title: `Fast and wrong: memory first, disk whenever`,
        body: [
          `The simplest engine: change the page in memory, reply “saved”, and copy changed pages to disk every few seconds in the background. Writes are blazing fast.`,
          `Then the power fails. Everything changed since the last background copy is gone — including orders that customers were told had gone through. Worse, a page that was half-written when the power died is now garbage: a <span class="term">torn page</span>.`,
        ],
        callout: {
          kind: `warn`,
          text: `“Saved” has to mean “survives a crash”. That is the D in ACID — <b>durability</b>.`,
        },
        changes: [
          `+ Reply “saved” as soon as memory is updated`,
          `− Power cut: the last few seconds of writes are lost`,
          `− One half-written page is corrupt`,
        ],
        metrics: { crashSafe: `no`, wps: 5e5, diskPattern: `random · whenever`, lookupCost: `—` },
        scene: {
          entities: {
            app: nn(),
            mem: rn({
              ...g,
              tags: [{ text: `power cut · 4 s of writes gone`, tone: `red`, icon: `power` }],
            }),
            ...un([], `data file · 8 KB pages`, {
              6: { heat: 0.9, tags: [{ text: `torn page`, tone: `red`, icon: `alert` }] },
            }),
          },
          links: { am: T.am({ fail: 1 }), ...fn(mn, { style: `off` }) },
          flows: [bn(1.6, { bounce: !1 })],
        },
      },
      {
        short: `Log first`,
        chapter: `solution`,
        title: `Write it down first: the write-ahead log`,
        body: [
          `The obvious fix — push every changed page to disk before replying — is safe but painfully slow: a whole 8 KB page rewritten at a random position, to save one 100-byte row.`,
          `Instead, describe the change in a few bytes and <b>append</b> it to a log file, forcing that to disk before replying. This is the <span class="term">write-ahead log</span> (WAL). Appending to the end of one file is the fastest thing a disk can do. The pages themselves are changed in memory and copied out later, at leisure.`,
          `<small>The speeds shown are for one ordinary SSD. Yours will differ; the ratios between the designs won’t.</small>`,
        ],
        callout: {
          kind: `insight`,
          text: `After a crash the engine replays the log and rebuilds exactly the state it had promised — repairing any torn pages along the way. The log is the truth; the pages are a convenient summary of it.`,
        },
        changes: [
          `+ Write-ahead log: append, then fsync`,
          `~ “Saved” only once the log entry is on disk`,
          `~ Data pages are copied out later, in the background`,
        ],
        metrics: { crashSafe: `yes`, wps: 5e3, diskPattern: `sequential log`, lookupCost: `—` },
        scene: {
          entities: {
            app: nn(),
            mem: rn(),
            ...un(),
            ...sn(4, [{ text: `fsync before “saved”`, tone: `green`, icon: `check` }]),
          },
          links: {
            am: T.am(),
            mw: T.mw({ label: `1 · append`, labelAt: 0.5 }),
            ...fn(mn, { style: `dashed` }),
          },
          flows: [{ route: [`am`, `mw`], kind: `write`, rate: 1.3, bounce: !0 }, pn(mn, 0.3)],
        },
      },
      {
        short: `How sure?`,
        chapter: `tradeoff`,
        title: `Case: how sure is “saved”?`,
        body: [
          `Forcing the log to disk takes a fraction of a millisecond on an SSD, and by default it happens once per transaction. At thousands of commits a second, that one step becomes the limit.`,
          `<span class="term">Group commit</span> helps for free: transactions that arrive in the same instant share a single fsync. Beyond that there is a dial. Most databases can sync on a timer instead — every 100 ms, or every second — multiplying throughput, and accepting that a crash loses the last moments of “saved” writes.`,
        ],
        callout: {
          kind: `warn`,
          text: `Know where your dial is set. Redis in append-only mode syncs once a second by default; PostgreSQL with <code>synchronous_commit = off</code> and MySQL with <code>innodb_flush_log_at_trx_commit = 2</code> can both lose the last moments before a power cut.`,
        },
        changes: [
          `+ Group commit: many transactions, one fsync`,
          `~ Writes 5,000 → 40,000 per second`,
          `~ Optional: sync on a timer — faster, but a crash loses the last moments`,
        ],
        metrics: { crashSafe: `yes`, wps: 4e4, diskPattern: `sequential log`, lookupCost: `—` },
        scene: {
          entities: {
            app: nn(),
            mem: rn(),
            ...un(),
            ...sn(6, [{ text: `1 fsync for 8 transactions`, tone: `green`, icon: `layers` }]),
            card: Sn(
              `The durability dial`,
              [
                `fsync every commit    safest · slowest`,
                `= group commit        same safety, shared fsync`,
                `fsync every 100 ms    fast · may lose 100 ms`,
                `! fsync never         fastest · may lose minutes`,
              ],
              `gauge`,
            ),
          },
          links: { am: T.am(), mw: T.mw(), ...fn(mn, { style: `dashed` }) },
          flows: [bn(3.2), xn(0.8, { kind: `heavy` }), pn(mn, 0.3)],
        },
      },
      {
        short: `Checkpoint`,
        chapter: `technique`,
        title: `The log can’t grow for ever`,
        body: [
          `Left alone, the log would grow without limit, and recovering from a crash would mean replaying days of it. So every few minutes the engine takes a <span class="term">checkpoint</span>: it copies all changed pages to the data file, notes “everything up to here is safely in the pages”, and throws the older log away.`,
          `Recovery then replays only the log written since the last checkpoint — seconds to a few minutes of work.`,
        ],
        callout: {
          kind: `tip`,
          text: `A checkpoint is a burst of scattered page writes. Databases spread them out over time; when they can’t keep up, you see it as periodic latency spikes.`,
        },
        changes: [
          `+ Checkpoint: copy changed pages out, trim the log`,
          `~ Crash recovery replays only the log since the checkpoint`,
        ],
        metrics: { crashSafe: `yes`, wps: 4e4, diskPattern: `log + random pages`, lookupCost: `—` },
        scene: {
          entities: {
            app: nn(),
            mem: rn({ tags: [{ text: `checkpoint: flushing`, icon: `flag` }] }),
            ...un(mn),
            ...sn(2, [{ text: `older entries discarded`, icon: `check` }]),
          },
          links: { am: T.am(), mw: T.mw(), ...fn(mn) },
          flows: [bn(2.4), xn(0.8, { kind: `heavy` }), pn(mn, 2.4)],
        },
      },
      {
        short: `B-tree`,
        chapter: `insight`,
        title: `The classic engine: pages and B-trees, updated in place`,
        body: [
          `What we just built is the design inside PostgreSQL, MySQL (InnoDB), SQL Server and Oracle. Data lives in fixed-size pages, found through <b>B-trees</b> (see <em>Indexes</em>) — in some engines the table itself is one. To change a row, the engine finds its page and modifies that page <em>in place</em>, with the log for safety.`,
          `It is excellent at reads. Any row is three or four page reads away — usually straight from memory — and neighbouring keys sit on neighbouring pages, so range scans are cheap.`,
        ],
        callout: {
          kind: `insight`,
          text: `One copy of every row, at a known address. That is what makes reads predictable — and why every write has to go and find that address.`,
        },
        changes: [
          `~ Reads: 3–4 pages, mostly from memory`,
          `~ Writes: find the page, change it in place`,
        ],
        metrics: Cn,
        scene: {
          entities: {
            app: nn(),
            mem: rn(),
            ...un([], `B-tree pages · updated in place`),
            ...sn(3),
          },
          links: { am: T.am(), mw: T.mw(), ...fn(mn, { heads: `both` }) },
          flows: [
            { route: [`am`], rate: 3, bounce: !0 },
            { routes: mn.map((e) => ({ path: [`f${e}`] })), kind: `slow`, rate: 0.6, bounce: !0 },
            bn(0.6),
            xn(0.5),
          ],
        },
      },
      {
        short: `Firehose`,
        chapter: `problem`,
        title: `Case: a firehose of writes`,
        body: [
          `Now the workload changes: sensor readings, chat messages, click events — 200,000 small writes a second, each for a different key. Every one lands on a different page. Memory fills with changed pages, and each must eventually be written back to its own spot on disk: a whole page, for a few bytes of change.`,
          `The log keeps up easily, because it is sequential. The <b>scattered page writes</b> don’t. Checkpoints fall behind, and write throughput is capped by how fast the disk can do random writes.`,
        ],
        callout: {
          kind: `warn`,
          text: `This is <b>write amplification</b>: storing 100 bytes costs a log record plus an 8 KB page write. On a write-heavy workload the disk can end up writing tens of times more bytes than you actually stored.`,
        },
        changes: [
          `~ Workload: 200,000 small writes/s, scattered keys`,
          `− Every page is dirty · checkpoints fall behind`,
          `~ Throughput stuck near 40,000 writes/s`,
        ],
        metrics: {
          crashSafe: `yes`,
          wps: `40,000 of 200,000`,
          diskPattern: `log + random pages`,
          lookupCost: `3–4 pages`,
        },
        scene: {
          entities: {
            app: nn({ label: [`200,000`, `writes / s`] }),
            mem: rn({
              ..._(1),
              heat: 0.7,
              tags: [{ text: `full of changed pages`, tone: `red`, icon: `alert` }],
            }),
            ...un([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], `B-tree pages · updated in place`),
            ...sn(8),
          },
          links: { am: T.am({ fail: 0.35 }), mw: T.mw(), ...fn(mn), ...fn(hn) },
          flows: [bn(6), xn(3), pn([...mn, ...hn], 5)],
        },
      },
      {
        short: `LSM-tree`,
        chapter: `solution`,
        title: `Never update in place: the LSM-tree`,
        body: [
          `A different design drops the idea that each row has one home. A write goes to the log and into a sorted structure in memory, the <span class="term">memtable</span>. That’s all — there is no page to find.`,
          `When the memtable fills up it is written to disk in one go as an immutable, sorted file — an <span class="term">SSTable</span> — and a fresh memtable starts. Every disk write is sequential. This is the <span class="term">log-structured merge tree</span> (LSM): the design behind Cassandra, HBase, ScyllaDB and RocksDB, the engine many other databases embed.`,
        ],
        callout: {
          kind: `tip`,
          text: `An update is just a newer entry with the same key; a delete is a marker called a <b>tombstone</b>. Nothing already on disk is ever modified.`,
        },
        changes: [
          `~ Pages in memory → memtable (sorted)`,
          `+ A full memtable is flushed as one sorted file`,
          `~ All disk writes sequential · 200,000 writes/s`,
        ],
        metrics: { crashSafe: `yes`, wps: 2e5, diskPattern: `all sequential`, lookupCost: `?` },
        scene: {
          entities: { app: nn({ label: [`200,000`, `writes / s`] }), mem: an(), ...sn(5), ...vn() },
          links: {
            am: T.am(),
            mw: T.mw(),
            n3: yn(3, { label: `flush: one sequential write`, labelAt: 0.5 }),
          },
          flows: [bn(6), xn(3), { route: [`n3`], kind: `heavy`, rate: 0.6 }],
        },
      },
      {
        short: `Find a key`,
        chapter: `problem`,
        title: `Case: where is my key?`,
        body: [
          `Reading is now the hard part. The newest value for a key might be in the memtable, or in any SSTable. Check them from newest to oldest: a key last written long ago — or one that doesn’t exist at all — costs a search of every file.`,
          `Two tricks rescue reads. Each SSTable carries a <b>Bloom filter</b> (see <em>Caching</em>) that answers “definitely not in this file” without touching the disk, and a small index of where each key range starts. A typical lookup then reads from just one file.`,
        ],
        callout: {
          kind: `insight`,
          text: `B-trees pay at write time to keep reads simple. LSM-trees keep writes simple and pay at read time. Every storage engine sits somewhere on that line.`,
        },
        changes: [
          `− A lookup may have to check every SSTable`,
          `+ A Bloom filter and a small index per file`,
          `~ Most lookups read a single file`,
        ],
        metrics: wn,
        scene: {
          entities: {
            app: nn(),
            mem: an({ tags: [{ text: `GET user:42 · not here`, icon: `search` }] }),
            ...sn(5),
            ...vn({
              0: [{ text: `not here`, icon: `filter` }],
              1: [{ text: `maybe → found`, tone: `green`, icon: `check` }],
              2: [{ text: `not here`, icon: `filter` }],
              3: [{ text: `not here`, icon: `filter` }],
            }),
          },
          links: {
            am: T.am(),
            mw: T.mw(),
            n0: yn(0, { style: `off` }),
            n1: yn(1, { heads: `both` }),
            n2: yn(2, { style: `off` }),
            n3: yn(3, { style: `off` }),
          },
          flows: [{ route: [`am`, `n1`], rate: 2.2, bounce: !0 }, bn(1), xn(0.8)],
        },
      },
      {
        short: `Compaction`,
        chapter: `technique`,
        title: `Compaction: tidying up in the background`,
        body: [
          `Files pile up, and the older ones are full of values that have since been overwritten or deleted. So a background process keeps <b>merging</b> SSTables: read a few sorted files, write one new sorted file that keeps only the newest value of each key, delete the inputs.`,
          `This is <span class="term">compaction</span>. It limits how many files a read has to consider, and gives the space back. It is also the price of the design: every byte is rewritten several times over its life, and compaction competes with live traffic for the disk.`,
        ],
        callout: {
          kind: `warn`,
          text: `If writes outrun compaction, files accumulate, reads slow down and the disk fills up. Watching the compaction backlog is the first rule of running an LSM database.`,
        },
        changes: [
          `+ Compaction merges three files into one`,
          `− Overwritten values and tombstones are dropped`,
          `~ Fewer files to consider on every read`,
        ],
        metrics: wn,
        scene: { entities: Tn(), links: En(), flows: Dn() },
      },
      {
        short: `Choosing`,
        chapter: `tradeoff`,
        title: `B-tree or LSM?`,
        body: [
          `<table class="compare">
          <thead><tr><th></th><th>B-tree</th><th>LSM-tree</th></tr></thead>
          <tbody>
            <tr><td>Writes</td><td>Scattered page updates</td><td>Sequential appends</td></tr>
            <tr><td>Reads</td><td>A few pages, predictable</td><td>Several files; filters help</td></tr>
            <tr><td>Space</td><td>Pages left part-empty</td><td>Compact, compresses well</td></tr>
            <tr><td>Background</td><td>Checkpoints</td><td>Compaction</td></tr>
            <tr><td>Found in</td><td>PostgreSQL, MySQL</td><td>Cassandra, RocksDB</td></tr>
          </tbody>
        </table>`,
          `Read-heavy, with range queries and transactions: a B-tree. Write-heavy, huge and mostly appended: an LSM-tree. Several newer SQL databases — CockroachDB, TiDB, MyRocks — put SQL on top of an LSM engine.`,
        ],
        callout: {
          kind: `insight`,
          text: `You rarely choose a storage engine directly; you choose a database and inherit its engine. Knowing which one is underneath explains most of how it behaves under load.`,
        },
        metrics: wn,
        scene: {
          entities: Tn([{ text: `sorted files · never modified`, icon: `file` }]),
          links: En(),
          flows: Dn(),
        },
      },
      {
        short: `Columns`,
        chapter: `insight`,
        title: `Case: rows or columns?`,
        body: [
          `One more axis. Both engines so far keep each <b>row</b> together — ideal when you fetch or change whole records. But an analyst asks for <code>SELECT SUM(price) FROM orders</code> across two billion rows, and a row store has to read all 40 columns of every row to add up one of them.`,
          `A <span class="term">column store</span> keeps each column in its own file. The query reads only <code>price</code> — a fortieth of the data — and because similar values sit side by side, it compresses several times over. That is how warehouses such as BigQuery, Snowflake, Redshift and ClickHouse scan billions of rows in seconds.`,
        ],
        callout: {
          kind: `tip`,
          text: `Row stores serve the app: many small reads and writes. Column stores serve analytics: a few enormous scans. It is why data gets copied from one to the other — see <em>Batch & Stream Processing</em>.`,
        },
        changes: [
          `+ Analytics query: SUM(price) over 2 billion rows`,
          `− Row store: every column of every row is read`,
          `+ Column store: 1 column of 40`,
        ],
        metrics: {
          crashSafe: `yes`,
          wps: `—`,
          diskPattern: `—`,
          lookupCost: `scan: 1 of 40 columns`,
        },
        scene: {
          entities: {
            app: nn({ label: [`Analytics`, `query`], glyph: `chart`, color: `orange` }),
            ...un([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], `row store · every page read`),
            cz: x({ x0: -12.8, x1: 12.8, y0: -3.4, y1: 1.4 }, ``),
            ...Object.fromEntries(
              On.map((e, t) => [
                `c${t}`,
                d(e, -1, {
                  s: 3.1,
                  h: 12,
                  radius: 4,
                  color: t === 3 ? `green` : `slab`,
                  glyph: ``,
                  label: [kn[t]],
                  tags:
                    t === 0 ? [{ text: `column store · one file per column`, icon: `sheets` }] : [],
                }),
              ]),
            ),
          },
          links: {
            col: h(`app`, `c3`, [`app`, [`app`, -8], [On[3], -8], `c3`], {
              heads: `both`,
              label: `reads 1 column of 40`,
              labelTone: `green`,
              labelAt: 0.45,
            }),
            scan: h(`app`, null, [`app`, [-15, `app`], [-15, 6.6], [11, 6.6]], { heads: `none` }),
          },
          flows: [
            { route: [`col`], rate: 1.6, bounce: !0 },
            { route: [`scan`], kind: `slow`, rate: 0.5, speed: 0.5 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Memory is fast and forgetful; disk is durable and slow. A storage engine bridges the two.</li>
          <li>The <b>write-ahead log</b> makes “saved” true: append, fsync, then reply.</li>
          <li>How often you <b>fsync</b> is a durability dial — know where yours is set.</li>
          <li><b>B-trees</b> update pages in place: predictable reads, scattered writes.</li>
          <li><b>LSM-trees</b> only append: fast writes, paid for with compaction and harder reads.</li>
          <li><b>Column stores</b> serve analytics by reading only the columns a query needs.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Replication</b> — what to do when one database server can’t take all the reads, or might die.`,
        },
        metrics: wn,
        scene: {
          entities: Tn([{ text: `sorted files · never modified`, icon: `file` }]),
          links: En(),
          flows: Dn(),
        },
      },
    ],
  };

const jn = { x0: -4.5, x1: 4.5, y0: -23, y1: -17 };

const Mn = (e = `300,000 users`) => p(jn, 12, e);

const Nn = () => d(0, -9, { label: [`App`, `Server`] });

const Pn = (e = {}) => b(0, 0, { r: 1.9, glyph: `database`, label: `leader`, ...e });

const E = (e, t = {}) => b(e, 9, { r: 1.7, glyph: `database`, label: `follower`, ...t });

const Fn = { ua: h(`users`, `app`, [`users`, `app`], { heads: `both` }) };

const In = (e = {}) => ({ al: h(`app`, `ld`, [`app`, `ld`], { heads: `both`, ...e }) });

const Ln = (e = `ld`, t = [`f1`, `f2`], n = ``) => ({
    [`r1${n}`]: h(e, t[0], [e, [`${t[0]}+1`, e], `${t[0]}+1`], {
      label: `replication`,
      labelAt: 0.35,
    }),
    [`r2${n}`]: h(e, t[1], [e, [`${t[1]}-1`, e], `${t[1]}-1`], {
      label: `replication`,
      labelAt: 0.35,
    }),
  });

const Rn = (e = [`f1`, `f2`], t = ``) => ({
    [`a1${t}`]: h(`app`, e[0], [`app`, [`${e[0]}-1`, `app`], `${e[0]}-1`], { heads: `both` }),
    [`a2${t}`]: h(`app`, e[1], [`app`, [`${e[1]}+1`, `app`], `${e[1]}+1`], { heads: `both` }),
  });

const zn = (e = 0.9, t = ``) => [
    { fanout: !0, routes: [{ path: [`r1${t}`] }, { path: [`r2${t}`] }], kind: `write`, rate: e },
  ];

const Bn = (e = 4, t = ``) => ({
    routes: [{ path: [`ua`, `a1${t}`] }, { path: [`ua`, `a2${t}`] }],
    rate: e,
    bounce: !0,
  });

export const replicationLesson = {
    id: `replication`,
    title: `Replication`,
    summary: `Keep copies of the database on several machines — for more reads and for survival.`,
    minutes: 12,
    level: `beginner`,
    metrics: [`dbLoad`, `reads`, `lag`, `writes`],
    legend: [
      `req`,
      `res`,
      [`write`, `write / replication`],
      `mine`,
      [`heavy`, `report query`],
      `fail`,
    ],
    goals: [
      { text: `Leaders, followers and the replication log`, step: 1 },
      { text: `Scaling reads with replicas`, step: 2 },
      { text: `Replication lag and read-your-writes`, step: 4 },
      { text: `Failover when the leader dies`, step: 6 },
      { text: `Analytics replicas, backups and replication styles`, step: 7 },
    ],
    steps: [
      {
        short: `One DB`,
        chapter: `problem`,
        title: `One database, doing everything`,
        body: [
          `Every read and every write goes to a single database server. It’s 90% busy — and most of that is reads: product pages, profiles, feeds.`,
          `It’s also a single point of failure: if it dies, so does everything.`,
        ],
        callout: {
          kind: `insight`,
          text: `Most apps read far more than they write — often 10 or 100 reads per write.`,
        },
        metrics: { dbLoad: 90, reads: `1×`, lag: `—`, writes: `ok` },
        scene: {
          entities: { users: Mn(), app: Nn(), ld: Pn({ label: `database`, heat: 0.7, cpu: 0.9 }) },
          links: { ...Fn, ...In() },
          flows: [
            { route: [`ua`, `al`], rate: 4, bounce: !0 },
            { route: [`al`], kind: `write`, rate: 0.5 },
          ],
        },
      },
      {
        short: `Copies`,
        chapter: `solution`,
        title: `Keep copies: leader and followers`,
        body: [
          `Add two <span class="term">followers</span> (replicas). The <span class="term">leader</span> still takes every write, and streams each change to the followers through a replication log.`,
          `Each follower replays the changes and ends up with the same data.`,
        ],
        callout: {
          kind: `tip`,
          text: `Also called primary/replica or master/slave. Built into PostgreSQL, MySQL, MongoDB and most others.`,
        },
        changes: [`+ Two followers`, `+ Replication stream from the leader`],
        metrics: { dbLoad: 90, reads: `1×`, lag: `0 s`, writes: `ok` },
        scene: {
          entities: {
            users: Mn(),
            app: Nn(),
            ld: Pn({ heat: 0.7, cpu: 0.9 }),
            f1: E(-9),
            f2: E(9),
          },
          links: { ...Fn, ...In(), ...Ln() },
          flows: [
            { route: [`ua`, `al`], rate: 4, bounce: !0 },
            { route: [`al`], kind: `write`, rate: 0.5 },
            ...zn(),
          ],
        },
      },
      {
        short: `Read replicas`,
        chapter: `solution`,
        title: `Send reads to the followers`,
        body: [
          `Now the app sends <b>reads</b> to the followers and only <b>writes</b> to the leader. Read capacity doubles — two machines now do nothing but reads — and the leader cools down to 30%.`,
          `Need more reads? Add another follower.`,
        ],
        callout: {
          kind: `tip`,
          text: `This works brilliantly for read-heavy apps. It doesn’t help write-heavy ones — every write still goes through one leader.`,
        },
        changes: [`~ Reads → followers`, `~ Writes → leader only`, `~ Leader CPU 90% → 30%`],
        metrics: { dbLoad: 30, reads: `2×`, lag: `0 s`, writes: `ok` },
        scene: {
          entities: { users: Mn(), app: Nn(), ld: Pn(v(0.3)), f1: E(-9, v(0.4)), f2: E(9, v(0.4)) },
          links: { ...Fn, ...In({ label: `writes` }), ...Ln(), ...Rn() },
          flows: [
            { routes: [{ path: [`ua`, `a1`] }, { path: [`ua`, `a2`] }], rate: 4, bounce: !0 },
            { route: [`al`], kind: `write`, rate: 0.6 },
            ...zn(),
          ],
        },
      },
      {
        short: `Lag`,
        chapter: `problem`,
        title: `Copies lag behind`,
        body: [
          `Replication is usually <span class="term">asynchronous</span>: the leader confirms a write right away and ships it to followers a moment later.`,
          `Alice renames herself, then reloads her profile. The read lands on a follower that hasn’t caught up — she sees her <b>old</b> name and thinks the save failed.`,
        ],
        callout: {
          kind: `warn`,
          text: `Lag is normally milliseconds, but under load it can grow to seconds or minutes.`,
        },
        changes: [`+ Alice writes a new name`, `− Follower still has the old one`],
        metrics: { dbLoad: 30, reads: `2×`, lag: `2 s`, writes: `ok` },
        scene: {
          entities: {
            users: Mn(`Alice sees her old name`),
            app: Nn(),
            ld: Pn({ ...v(0.3), tags: [{ text: `name: Alice Kim`, tone: `green` }] }),
            f1: E(-9, {
              ...v(0.4),
              tags: [{ text: `name: Alice Lee · 2 s behind`, tone: `red`, icon: `clock` }],
            }),
            f2: E(9, v(0.4)),
          },
          links: { ...Fn, ...In({ label: `writes` }), ...Ln(), ...Rn() },
          flows: [
            { routes: [{ path: [`ua`, `a1`] }, { path: [`ua`, `a2`] }], rate: 3, bounce: !0 },
            { route: [`ua`, `al`], kind: `mine`, rate: 0.6 },
            { route: [`ua`, `a1`], kind: `mine`, rate: 0.6, bounce: !0 },
            ...zn(0.5),
          ],
        },
      },
      {
        short: `Read your writes`,
        chapter: `technique`,
        title: `Read your own writes`,
        body: [
          `A common fix: for a few seconds after someone writes, send <em>their</em> reads to the leader. Everyone else keeps using followers.`,
          `The other option is <span class="term">synchronous</span> replication: the leader waits for a follower to confirm before saying “saved”. No lag — but slower writes, and they stall if that follower is down.`,
        ],
        callout: {
          kind: `tip`,
          text: `For data you can’t afford to lose, a common setup is one synchronous follower (for safety) and the rest asynchronous (for speed). Many systems stay fully asynchronous and accept losing the last moments of writes in a crash.`,
        },
        changes: [`~ Alice’s reads → leader for 5 s`, `~ She sees her new name`],
        metrics: { dbLoad: 32, reads: `2×`, lag: `2 s`, writes: `ok` },
        scene: {
          entities: {
            users: Mn(`Alice sees her new name`),
            app: Nn(),
            ld: Pn({ ...v(0.32), tags: [{ text: `name: Alice Kim`, tone: `green` }] }),
            f1: E(-9, v(0.4)),
            f2: E(9, v(0.4)),
          },
          links: { ...Fn, ...In({ label: `writes + Alice’s reads` }), ...Ln(), ...Rn() },
          flows: [
            { routes: [{ path: [`ua`, `a1`] }, { path: [`ua`, `a2`] }], rate: 3, bounce: !0 },
            { route: [`ua`, `al`], kind: `mine`, rate: 0.9, bounce: !0 },
            ...zn(0.6),
          ],
        },
      },
      {
        short: `Leader dies`,
        chapter: `problem`,
        title: `The leader dies`,
        body: [
          `The leader crashes. Reads keep working — the followers still have the data — but every write now fails. Nobody can sign up, post or pay.`,
        ],
        callout: { kind: `warn`, text: `Followers protect your reads. Writes need a new leader.` },
        changes: [`− Leader down`, `− Writes failing`],
        metrics: { dbLoad: 0, reads: `2×`, lag: `—`, writes: `failing` },
        scene: {
          entities: { users: Mn(), app: Nn(), ld: Pn(g), f1: E(-9, v(0.5)), f2: E(9, v(0.5)) },
          links: { ...Fn, ...In({ fail: 1 }), ...Ln(), ...Rn() },
          flows: [
            { routes: [{ path: [`ua`, `a1`] }, { path: [`ua`, `a2`] }], rate: 3, bounce: !0 },
            { route: [`ua`, `al`], kind: `write`, rate: 0.9 },
          ],
        },
      },
      {
        short: `Failover`,
        chapter: `solution`,
        title: `Failover: promote a follower`,
        body: [
          `<span class="term">Failover</span>: the most up-to-date follower is promoted to leader, the app points its writes there, and the other follower replicates from it. A fresh follower is added to restore the spare.`,
          `Writes resume within seconds to a minute. Any writes the old leader hadn’t shipped yet may be lost — another reason to keep one follower synchronous.`,
          `The hard part is being <em>sure</em> the leader is dead. If it was only slow or cut off, you now have two leaders both accepting writes — <span class="term">split brain</span>. Doing this safely takes a majority vote: see <em>Consensus &amp; Leader Election</em>.`,
        ],
        callout: {
          kind: `insight`,
          text: `Same idea as the standby load balancer: a spare that takes over. Managed databases automate it.`,
        },
        changes: [`− Old leader removed`, `~ Follower promoted to leader`, `+ New follower`],
        metrics: { dbLoad: 30, reads: `2×`, lag: `0 s`, writes: `ok` },
        scene: {
          entities: {
            users: Mn(),
            app: Nn(),
            f1: Pn({ ...v(0.3), tags: [{ text: `promoted`, tone: `green`, icon: `check` }] }),
            f3: E(-9, v(0.4)),
            f2: E(9, v(0.4)),
          },
          links: {
            ...Fn,
            al2: h(`app`, `f1`, [`app`, `f1`], { heads: `both`, label: `writes` }),
            ...Ln(`f1`, [`f3`, `f2`], `n`),
            ...Rn([`f3`, `f2`], `n`),
          },
          flows: [Bn(4, `n`), { route: [`al2`], kind: `write`, rate: 0.6 }, ...zn(0.9, `n`)],
        },
      },
      {
        short: `Reports`,
        chapter: `problem`,
        title: `Case: the 20-minute report`,
        body: [
          `The finance team runs a monthly report — a 20-minute query that scans years of orders. They point it at a follower, and that follower, which also serves the app’s reads, grinds to a halt and falls minutes behind.`,
          `Fix: a dedicated <b>analytics replica</b> that the app never reads from. Heavy queries can be as slow as they like there.`,
        ],
        callout: {
          kind: `tip`,
          text: `At larger scale, copy data into a separate analytics warehouse (BigQuery, Snowflake, Redshift) built for huge scans.`,
        },
        changes: [
          `+ Analytics replica, outside the app’s read pool`,
          `~ Reports no longer slow the app`,
        ],
        metrics: { dbLoad: 30, reads: `2×`, lag: `0 s`, writes: `ok` },
        scene: {
          entities: {
            users: Mn(),
            app: Nn(),
            f1: Pn(v(0.3)),
            f3: E(-9, v(0.4)),
            f2: E(9, v(0.4)),
            an: b(0, 19, {
              r: 1.7,
              glyph: `chart`,
              label: `analytics replica`,
              heat: 0.6,
              tags: [{ text: `20-min report`, tone: `amber`, icon: `hourglass` }],
            }),
            analysts: y(13, 19, { label: `finance team` }),
          },
          links: {
            ...Fn,
            al2: h(`app`, `f1`, [`app`, `f1`], { heads: `both`, label: `writes` }),
            ...Ln(`f1`, [`f3`, `f2`], `n`),
            ...Rn([`f3`, `f2`], `n`),
            r3: h(`f1`, `an`, [`f1`, `an`], { label: `replication`, labelAt: 0.65 }),
            rep: h(`analysts`, `an`, [`analysts`, `an`], { heads: `both` }),
          },
          flows: [
            Bn(4, `n`),
            { route: [`al2`], kind: `write`, rate: 0.6 },
            {
              fanout: !0,
              routes: [{ path: [`r1n`] }, { path: [`r2n`] }, { path: [`r3`] }],
              kind: `write`,
              rate: 0.9,
            },
            { route: [`rep`], kind: `heavy`, rate: 0.3, bounce: !0, hold: 1.5 },
          ],
        },
      },
      {
        short: `Not a backup`,
        chapter: `problem`,
        title: `Case: the migration with no WHERE`,
        body: [
          `A deploy runs a migration with a missing <code>WHERE</code>: <code>UPDATE users SET email = NULL</code>. The leader obeys — and replication faithfully copies the mistake to every follower within a second.`,
          `Replicas protect you from a <em>machine</em> failing, not from a bad write. For that you need <span class="term">backups</span>: a nightly snapshot plus the archived write log, which together can rebuild the database as it was at any chosen moment — <span class="term">point-in-time recovery</span>.`,
        ],
        callout: {
          kind: `warn`,
          text: `A backup you have never restored is a hope, not a backup. Rehearse restores, and know how long one takes.`,
        },
        changes: [
          `− Bad migration blanks a column`,
          `− Every replica copies the damage`,
          `+ Nightly snapshot + write-log archive`,
          `~ Restore to 14:02, a minute before the mistake`,
        ],
        metrics: { dbLoad: 30, reads: `2×`, lag: `0 s`, writes: `ok` },
        scene: {
          entities: {
            users: Mn(),
            app: Nn(),
            f1: Pn({
              ...v(0.3),
              tags: [{ text: `email = NULL · 2M rows`, tone: `red`, icon: `alert` }],
            }),
            f3: E(-9, {
              ...v(0.4),
              tags: [{ text: `copied the mistake`, tone: `red`, icon: `alert` }],
            }),
            f2: E(9, {
              ...v(0.4),
              tags: [{ text: `copied the mistake`, tone: `red`, icon: `alert` }],
            }),
            bk: b(0, 19, {
              r: 1.7,
              glyph: `clock`,
              color: `store`,
              label: `backups`,
              tags: [{ text: `snapshot 03:00 + write log`, tone: `green`, icon: `check` }],
            }),
            card: S(
              { x: -9, y: 9, z: 0, dx: -365, dy: -70 },
              `Point-in-time recovery`,
              [
                `03:00  restore the nightly snapshot`,
                `       replay the write log…`,
                `= 14:02  stop here — data intact`,
                `! 14:03  the bad migration`,
              ],
              { icon: `clock` },
            ),
          },
          links: {
            ...Fn,
            al2: h(`app`, `f1`, [`app`, `f1`], { heads: `both`, label: `writes` }),
            ...Ln(`f1`, [`f3`, `f2`], `n`),
            ...Rn([`f3`, `f2`], `n`),
            bkl: h(`f1`, `bk`, [`f1`, `bk`]),
          },
          flows: [
            Bn(4, `n`),
            { route: [`al2`], kind: `write`, rate: 0.6 },
            ...zn(0.9, `n`),
            { route: [`bkl`], kind: `write`, rate: 0.4 },
          ],
        },
      },
      {
        short: `Styles`,
        chapter: `insight`,
        title: `Three ways to replicate`,
        body: [
          `Everything so far was <b>single-leader</b>: one writer, many readers. It’s simple and it’s what most SQL databases do.`,
          `<b>Multi-leader</b> puts a leader in each region so writes stay local — at the cost of conflicts when two regions edit the same row. <b>Leaderless</b> systems (Cassandra, Riak, ScyllaDB — the “Dynamo-style” databases) write to several copies at once and read from several — the quorums in the CAP lesson.`,
        ],
        callout: {
          kind: `insight`,
          text: `Prefer single-leader until you have a concrete reason (global writes, extreme availability) to take on conflict handling.`,
        },
        metrics: { dbLoad: 30, reads: `2×`, lag: `0 s`, writes: `ok` },
        scene: {
          entities: {
            users: Mn(),
            app: Nn(),
            f1: Pn(v(0.3)),
            f3: E(-9, v(0.4)),
            f2: E(9, v(0.4)),
            card: S(
              { x: -9, y: 9, z: 0, dx: -365, dy: -70 },
              `Replication styles`,
              [
                `single-leader  one writer · simple`,
                `multi-leader   writer per region · conflicts`,
                `leaderless     write N, read R · quorums`,
              ],
              { icon: `layers` },
            ),
          },
          links: {
            ...Fn,
            al2: h(`app`, `f1`, [`app`, `f1`], { heads: `both`, label: `writes` }),
            ...Ln(`f1`, [`f3`, `f2`], `n`),
            ...Rn([`f3`, `f2`], `n`),
          },
          flows: [Bn(4, `n`), { route: [`al2`], kind: `write`, rate: 0.6 }, ...zn(0.9, `n`)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>A <b>leader</b> takes writes and streams them to <b>followers</b>.</li>
          <li>Followers <b>scale reads</b> and survive losing a machine.</li>
          <li>Async replicas <b>lag</b>: route a user’s reads to the leader right after they write.</li>
          <li>When the leader dies, <b>fail over</b> to a follower.</li>
          <li>Keep heavy <b>analytics</b> on its own replica.</li>
          <li>Replicas are <b>not backups</b>: keep snapshots and rehearse restoring them.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Sharding</b> — for when even the leader can’t keep up with the writes.`,
        },
        metrics: { dbLoad: 30, reads: `2×`, lag: `0 s`, writes: `ok` },
        scene: {
          entities: { users: Mn(), app: Nn(), f1: Pn(v(0.3)), f3: E(-9, v(0.4)), f2: E(9, v(0.4)) },
          links: {
            ...Fn,
            al2: h(`app`, `f1`, [`app`, `f1`], { heads: `both`, label: `writes` }),
            ...Ln(`f1`, [`f3`, `f2`], `n`),
            ...Rn([`f3`, `f2`], `n`),
          },
          flows: [Bn(4, `n`), { route: [`al2`], kind: `write`, rate: 0.6 }, ...zn(0.9, `n`)],
        },
      },
    ],
  };

const Hn = [-10.5, -3.5, 3.5, 10.5];

const Un = [`sa`, `sb`, `sc`, `sd`];

const Wn = [`A`, `B`, `C`, `D`];

const Gn = (e = []) => d(0, -12, { label: [`App`], tags: e });

const Kn = (e, t = {}) => b(Hn[e], 0, { r: 1.6, h: 36, glyph: `database`, ...t });

const qn = (e = () => null, t = {}) =>
    Object.fromEntries(
      Un.map((n, r) => {
        let i = e(r);
        return [n, Kn(r, { ...v(0.5), tags: i ? [i] : [], ...(t[n] || {}) })];
      }),
    );

const Jn = (e = Un) =>
    Object.fromEntries(
      e.map((e) => [`w${e}`, h(`app`, e, [`app`, [e, `app`], e], { heads: `both` })]),
    );

const Yn = (e = [1, 1, 1, 1], t = 4.4) => [
    {
      routes: Un.map((t, n) => ({ path: [`w${t}`], weight: e[n] })),
      pick: `weights`,
      rate: t,
      kind: `write`,
    },
  ];

const Xn = (e, t, n) => S({ x: 10.5, y: 0, z: 0, dx: 50, dy: -240 }, e, t, { icon: n });

const Zn = (e) => ({ text: `${Wn[e]} · ids ${[`1–25M`, `25–50M`, `50–75M`, `75M+`][e]}` });

const Qn = (e) => ({ text: `${Wn[e]} · hash % 4 = ${e}`, tone: `violet` });

export const shardingLesson = {
    id: `sharding`,
    title: `Sharding`,
    summary: `When the data or the writes outgrow one machine, split them across many.`,
    minutes: 11,
    level: `intermediate`,
    metrics: [`shards`, `perShard`, `hottest`, `size`],
    legend: [[`write`, `write`], `req`, `res`],
    goals: [
      { text: `Why replicas don’t help with writes`, step: 0 },
      { text: `Shard keys: ranges vs hashes`, step: 3 },
      { text: `Hot keys: the celebrity problem`, step: 4 },
      { text: `The cost of cross-shard queries`, step: 6 },
      { text: `Why adding a shard is painful`, step: 7 },
    ],
    steps: [
      {
        short: `Too big`,
        chapter: `problem`,
        title: `Too big for one machine`,
        body: [
          `The users database has grown to 20 TB and takes 40,000 writes a second. Followers would help with reads — but every <b>write</b> still has to go through one leader, and all the data has to fit on its disks.`,
          `You’re already on the biggest machine, and every backup, restore or new replica now takes the best part of a day to copy.`,
        ],
        callout: {
          kind: `warn`,
          text: `Replication copies all the data everywhere. To scale writes and storage, the data itself has to be split.`,
        },
        metrics: { shards: 1, perShard: 4e4, hottest: 100, size: `20 TB` },
        scene: {
          entities: {
            app: Gn(),
            sa: b(0, 0, {
              r: 2.8,
              h: 66,
              heat: 0.85,
              cpu: 0.98,
              tags: [{ text: `20 TB · 40,000 writes/s`, tone: `red`, icon: `alert` }],
            }),
          },
          links: { wsa: h(`app`, `sa`, [`app`, `sa`], { heads: `both` }) },
          flows: [{ route: [`wsa`], rate: 6, kind: `write` }],
        },
      },
      {
        short: `Split by range`,
        chapter: `solution`,
        title: `Split the data: sharding`,
        body: [
          `<span class="term">Sharding</span> splits one big database into several smaller ones — <b>shards</b> — each holding part of the data and taking part of the writes.`,
          `A <span class="term">shard key</span> decides where each row lives. Here: by user id range. The app (or a router) looks up the range and sends each query to the right shard.`,
        ],
        callout: {
          kind: `tip`,
          text: `Each shard is usually replicated too: shards scale writes, followers within a shard scale reads and survive failures.`,
        },
        changes: [
          `+ 4 shards`,
          `~ Shard key: user_id ranges`,
          `~ 40,000 → 10,000 writes/s per shard`,
        ],
        metrics: { shards: 4, perShard: 1e4, hottest: 25, size: `5 TB` },
        scene: {
          entities: { app: Gn([{ text: `route by user_id`, icon: `network` }]), ...qn(Zn) },
          links: Jn(),
          flows: Yn(),
        },
      },
      {
        short: `Hot spot`,
        chapter: `problem`,
        title: `Ranges create hot spots`,
        body: [
          `User ids grow over time, so every new signup lands in the last range. New users are also the most active — and shard D ends up with most of the writes while A sits nearly idle.`,
          `The same happens with dates or alphabetical names: data that arrives in order piles onto one shard.`,
          `Range-partitioned databases (Bigtable, HBase, CockroachDB) soften this by splitting a busy range in two automatically — but writes that always land at the “end” simply follow the last range.`,
        ],
        callout: { kind: `warn`, text: `A shard key must spread both the data and the traffic.` },
        changes: [`~ Shard D: 78% of writes`, `~ Shard A: 7%`],
        metrics: { shards: 4, perShard: `uneven`, hottest: 78, size: `5 TB` },
        scene: {
          entities: {
            app: Gn([{ text: `route by user_id`, icon: `network` }]),
            ...qn(Zn, {
              sa: v(0.12),
              sb: v(0.14),
              sc: v(0.2),
              sd: {
                heat: 0.85,
                cpu: 0.97,
                tags: [{ text: `D · ids 75M+ · all new users`, tone: `red`, icon: `alert` }],
              },
            }),
          },
          links: Jn(),
          flows: Yn([0.07, 0.07, 0.08, 0.78], 5),
        },
      },
      {
        short: `Hash it`,
        chapter: `solution`,
        title: `Hash the key`,
        body: [
          `Instead of ranges, run the key through a hash function and take the remainder: <code>shard = hash(user_id) % 4</code>.`,
          `Consecutive ids scatter to unrelated shards, so new users — and their traffic — spread evenly.`,
        ],
        callout: {
          kind: `tip`,
          text: `Hashing loses range queries (“all users with ids 1–1000” now touches every shard). Usually a fine trade.`,
        },
        changes: [`~ Shard key: hash(user_id) % 4`, `~ Busiest shard 78% → 25%`],
        metrics: { shards: 4, perShard: 1e4, hottest: 25, size: `5 TB` },
        scene: {
          entities: {
            app: Gn([{ text: `hash(user_id) % 4`, icon: `network` }]),
            ...qn(Qn),
            card: Xn(
              `Where does each user go?`,
              [
                `user 1001 → hash % 4 = 2 → C`,
                `user 1002 → hash % 4 = 0 → A`,
                `user 1003 → hash % 4 = 3 → D`,
                `= neighbours scatter evenly`,
              ],
              `network`,
            ),
          },
          links: Jn(),
          flows: Yn(),
        },
      },
      {
        short: `Celebrity`,
        chapter: `problem`,
        title: `Case: the celebrity`,
        body: [
          `Hashing spreads <em>keys</em> evenly, not traffic. A pop star with 50 million followers lives on shard C like anyone else — and every view of their profile, every like on their posts, lands there too.`,
          `Shard C is melting while A, B and D are fine. This is a <span class="term">hot key</span>, sometimes called the celebrity problem.`,
        ],
        callout: {
          kind: `warn`,
          text: `No shard key fixes a single key that is more popular than one machine can handle.`,
        },
        changes: [`+ One very popular user on shard C`, `~ Shard C: 70% of traffic`],
        metrics: { shards: 4, perShard: `uneven`, hottest: 70, size: `5 TB` },
        scene: {
          entities: {
            app: Gn([{ text: `hash(user_id) % 4`, icon: `network` }]),
            ...qn(Qn, {
              sc: {
                heat: 0.9,
                cpu: 0.98,
                tags: [{ text: `user 42 · pop star · 70%`, tone: `red`, icon: `alert` }],
              },
              sa: v(0.2),
              sb: v(0.2),
              sd: v(0.2),
            }),
          },
          links: Jn(),
          flows: Yn([0.1, 0.1, 0.7, 0.1], 5),
        },
      },
      {
        short: `Split key`,
        chapter: `solution`,
        title: `Cache it, or split it`,
        body: [
          `For a key that is <b>read</b> hot, put it in a cache (or many cache replicas) in front of the shard — most profile views never reach it.`,
          `For a key that is <b>write</b> hot, like the pop star’s like counter, split it: write to <code>likes:42#0</code> … <code>likes:42#7</code> at random, spread across shards, and add them up when reading.`,
        ],
        callout: {
          kind: `tip`,
          text: `Systems that face this daily (social networks, ticketing) treat their top keys specially — detected automatically, handled on purpose.`,
        },
        changes: [
          `+ Hot reads served from cache`,
          `+ likes:42 split into 8 sub-keys`,
          `~ Busiest shard 70% → 27%`,
        ],
        metrics: { shards: 4, perShard: 1e4, hottest: 27, size: `5 TB` },
        scene: {
          entities: {
            app: Gn([{ text: `likes:42 → #0…#7`, icon: `split` }]),
            ...qn((e) => ({ text: `${Wn[e]} · likes:42#${e * 2},#${e * 2 + 1}`, tone: `violet` })),
            card: Xn(
              `Split a hot counter`,
              [
                `write: likes:42#rand(0..7) += 1`,
                `read:  sum of likes:42#0 … #7`,
                `= 8 sub-keys spread over 4 shards`,
              ],
              `split`,
            ),
          },
          links: Jn(),
          flows: Yn([1, 1, 1.1, 1], 5),
        },
      },
      {
        short: `Cross-shard`,
        chapter: `tradeoff`,
        title: `Queries that span every shard`,
        body: [
          `Looking up one user is fast: hash the id, ask one shard. But “top 10 users by followers” isn’t keyed by user — the app must ask <b>every</b> shard and merge the answers.`,
          `These <span class="term">scatter–gather</span> queries are as slow as the slowest shard, and joins across shards are hard.`,
        ],
        callout: {
          kind: `warn`,
          text: `Pick a shard key that matches your most important queries — ideally they only ever touch one shard.`,
        },
        changes: [`+ One query → all 4 shards`, `~ Answer waits for the slowest`],
        metrics: { shards: 4, perShard: 1e4, hottest: 25, size: `5 TB` },
        scene: {
          entities: {
            app: Gn([{ text: `top 10 by followers?`, icon: `search` }]),
            ...qn(Qn),
            card: Xn(
              `Scatter–gather`,
              [
                `ask all 4 shards for their top 10`,
                `merge 40 results, keep the top 10`,
                `! as slow as the slowest shard`,
              ],
              `layers`,
            ),
          },
          links: Jn(),
          flows: [
            { fanout: !0, routes: Un.map((e) => ({ path: [`w${e}`] })), rate: 0.7, bounce: !0 },
          ],
        },
      },
      {
        short: `Add a shard`,
        chapter: `problem`,
        title: `Adding a shard moves almost everything`,
        body: [
          `Shards fill up, so you add a fifth. But <code>hash % 4</code> becomes <code>hash % 5</code> — and for about <b>80%</b> of users the remainder changes.`,
          `Terabytes have to move between shards while the system keeps serving traffic.`,
        ],
        callout: {
          kind: `warn`,
          text: `With hash % N, changing N reshuffles nearly every key. The next lesson fixes exactly this.`,
        },
        changes: [`+ Shard E`, `~ hash % 4 → hash % 5`, `− ~80% of rows must move`],
        metrics: { shards: 5, perShard: 8e3, hottest: 20, size: `4 TB` },
        scene: {
          entities: {
            app: Gn([{ text: `hash(user_id) % 5`, icon: `network` }]),
            ...qn((e) => ({ text: `${Wn[e]} · moving`, tone: `amber`, icon: `replay` })),
            se: b(17.5, 0, {
              r: 1.6,
              h: 36,
              ...v(0.5),
              tags: [{ text: `E · new`, tone: `green` }],
            }),
            card: Xn(
              `% 4 → % 5`,
              [
                `user 1001: % 4 = 2, % 5 = 1  → moves`,
                `user 1002: % 4 = 0, % 5 = 0  → stays`,
                `! ~80% of keys change shard`,
              ],
              `replay`,
            ),
          },
          links: {
            ...Jn([...Un, `se`]),
            ...Object.fromEntries(
              Un.map((e) => [
                `m${e}`,
                h(e, `se`, [e, [e, -3.2], [`se`, -3.2], `se`], { style: `dashed` }),
              ]),
            ),
          },
          flows: [
            { fanout: !0, routes: Un.map((e) => ({ path: [`m${e}`] })), kind: `write`, rate: 0.9 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>Sharding</b> splits data and writes across machines.</li>
          <li>The <b>shard key</b> decides where rows live — it must spread load evenly.</li>
          <li><b>Ranges</b> make hot spots; <b>hashes</b> spread load but scatter range queries.</li>
          <li>A single <b>hot key</b> needs caching or splitting.</li>
          <li>Queries off the shard key hit <b>every shard</b>; resharding with % N moves most data.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Consistent Hashing</b> — add or remove a shard and move only a fraction of the keys.`,
        },
        metrics: { shards: 4, perShard: 1e4, hottest: 25, size: `5 TB` },
        scene: {
          entities: { app: Gn([{ text: `hash(user_id) % 4`, icon: `network` }]), ...qn(Qn) },
          links: Jn(),
          flows: Yn(),
        },
      },
    ],
  };

const er = {
    en: `en-US`,
    es: `es-ES`,
    pt: `pt-BR`,
    fr: `fr-FR`,
    it: `it-IT`,
    de: `de-DE`,
    nl: `nl-NL`,
    pl: `pl-PL`,
    tr: `tr-TR`,
    id: `id-ID`,
    vi: `vi-VN`,
    el: `el-GR`,
    uk: `uk-UA`,
    ru: `ru-RU`,
    "zh-Hans": `zh-CN`,
    "zh-Hant": `zh-TW`,
    ja: `ja-JP`,
    ko: `ko-KR`,
    hi: `hi-IN`,
    ar: `ar-u-nu-latn`,
    he: `he-IL`,
  };

const tr = new Set([`ar`, `he`]);

const nr = `en`;

const rr = {};

const ir = new Map();

const ar = () => nr;

const or = () => er[nr] || nr;

const sr = (e) => rr[e];

const cr = (e = nr) => tr.has(e);

const lr = (e) => e.toLocaleUpperCase(or().split(`-u-`)[0]);

const ur = /[\p{Script=Arabic}\p{Script=Hebrew}]/u;

const dr = /(?=([A-Za-z][A-Za-z0-9]*(?:[/.\-_:'’][A-Za-z0-9]+)*))\1(?=[ \u00a0]*[^\s\p{L}<}\u200f])/gu;

const fr = (e) =>
    typeof e == `string` && ur.test(e)
      ? e
          .split(/(<code[^>]*>[\s\S]*?<\/code>|<[^>]*>|\u2066[^\u2069]*\u2069)/)
          .map((e, t) => (t % 2 ? e : e.replace(dr, `$1‏`)))
          .join(``)
      : e;

const pr = (e) => Object.fromEntries(Object.entries(e).map(([e, t]) => [e, fr(t)]));

export const javaConcurrencyLesson = {
  id: `java-concurrency`,
  title: `Java Concurrency & JVM Threading`,
  summary: `Visualize threads competing for monitors, thread pool scheduling, async pipelines, and virtual threads.`,
  minutes: 10,
  level: `intermediate`,
  metrics: [`threads`, `queue`, `locks`, `mode`],
  goals: [
    { text: `Understand thread lifecycle and monitor semantics`, step: 1 },
    { text: `Size thread pools for CPU-bound vs IO-bound workloads`, step: 2 },
    { text: `Compose async pipelines with CompletableFuture`, step: 3 },
    { text: `Scale to millions of tasks with virtual threads (JDK 21)`, step: 4 },
  ],
  steps: [
    {
      short: `Monitors`,
      chapter: `technique`,
      title: `Threads & Monitor Locks`,
      body: [
        `Every Java object has a monitor. Only one thread can hold a monitor at a time — others BLOCK.`,
        `synchronized(obj) acquires the monitor; the JVM stores owner thread ID in the object header lock word.`,
      ],
      callout: { kind: `tip`, text: `JVM optimises uncontested locks with biased locking and thin locks before escalating to OS mutex (inflated lock).` },
      metrics: { threads: `3 competing`, queue: `blocked`, locks: `1 monitor`, mode: `synchronized` },
      scene: {
        entities: {
          t1:   d(-8, -4,  { color: `green`,  glyph: `cpu`,  label: [`Thread-1`, `RUNNABLE`], cpu: 0.9 }),
          t2:   d(-8, 4,   { color: `yellow`, glyph: `cpu`,  label: [`Thread-2`, `BLOCKED`] }),
          t3:   d(-8, 12,  { color: `yellow`, glyph: `cpu`,  label: [`Thread-3`, `BLOCKED`] }),
          lock: d(4,  4,   { color: `orange`, glyph: `lock`, label: [`Monitor`, `owner: T-1`] }),
          obj:  b(14, 4,   { label: [`Shared`, `Resource`] }),
        },
        links: {
          t1l: h(`t1`,   `lock`, [`t1`,   `lock`], { label: `holds`,   heads: `end` }),
          t2l: h(`t2`,   `lock`, [`t2`,   `lock`], { label: `waiting`, heads: `end`, style: `dashed` }),
          t3l: h(`t3`,   `lock`, [`t3`,   `lock`], { label: `waiting`, heads: `end`, style: `dashed` }),
          lo:  h(`lock`, `obj`,  [`lock`, `obj`],  { label: `access`,  heads: `end` }),
        },
        flows: [{ route: [`t1l`, `lo`], bounce: false, rate: 1.2 }],
      },
    },
    {
      short: `Thread Pools`,
      chapter: `technique`,
      title: `Executor & ThreadPoolExecutor`,
      body: [
        `ThreadPoolExecutor manages a fixed pool of worker threads and a BlockingQueue for submitted tasks.`,
        `CPU-bound: pool size = CPU cores. IO-bound: pool size = cores × (1 + wait/compute) can be much larger.`,
      ],
      callout: { kind: `tip`, text: `Unbounded queues (LinkedBlockingQueue default) can cause memory exhaustion under load. Always set a bounded queue with RejectedExecutionHandler.` },
      metrics: { threads: `4 workers`, queue: `LinkedBQ`, locks: `—`, mode: `ExecutorService` },
      scene: {
        entities: {
          submit: y(-10, 2,  { label: `callers`, tags: [{ text: `submit(task)`, icon: `play` }] }),
          queue:  d(0,   2,  { color: `purple`, glyph: `container`, label: [`Task Queue`, `BlockingQueue`] }),
          w1:     d(10, -6,  { color: `blue`,   glyph: `cpu`,       label: [`Worker-1`], cpu: 1 }),
          w2:     d(10,  0,  { color: `blue`,   glyph: `cpu`,       label: [`Worker-2`], cpu: 0.7 }),
          w3:     d(10,  6,  { color: `blue`,   glyph: `cpu`,       label: [`Worker-3`], cpu: 0.3 }),
          w4:     d(10,  12, { color: `blue`,   glyph: `cpu`,       label: [`Worker-4`], cpu: 0 }),
        },
        links: {
          sq: h(`submit`, `queue`, [`submit`, `queue`], { label: `enqueue`, heads: `end` }),
          q1: h(`queue`,  `w1`,    [`queue`, `w1`],    { heads: `end` }),
          q2: h(`queue`,  `w2`,    [`queue`, `w2`],    { heads: `end` }),
          q3: h(`queue`,  `w3`,    [`queue`, `w3`],    { heads: `end` }),
          q4: h(`queue`,  `w4`,    [`queue`, `w4`],    { heads: `end` }),
        },
        flows: [
          { route: [`sq`, `q1`], bounce: false, rate: 1.2 },
          { route: [`sq`, `q3`], bounce: false, rate: 0.8 },
        ],
      },
    },
    {
      short: `CompletableFuture`,
      chapter: `technique`,
      title: `Async Pipeline — CompletableFuture`,
      body: [
        `CompletableFuture chains async stages: thenApply (transform), thenCompose (flat-map), thenCombine (merge two futures).`,
        `Each stage runs on the ForkJoinPool.commonPool by default — or a custom Executor for IO stages.`,
      ],
      callout: { kind: `insight`, text: `thenApply runs the callback on the completing thread. thenApplyAsync always submits to the pool — use it to avoid blocking the common pool with IO.` },
      metrics: { threads: `FJP common`, queue: `non-blocking`, locks: `—`, mode: `CompletableFuture` },
      scene: {
        entities: {
          s1:     d(-10, 2,  { color: `blue`,   glyph: `code`,  label: [`Stage 1`, `fetchUser()`],  cpu: 0.5 }),
          s2:     d(0,   2,  { color: `purple`, glyph: `code`,  label: [`Stage 2`, `enrichData()`], cpu: 0.5 }),
          s3a:    d(10, -4,  { color: `green`,  glyph: `code`,  label: [`Stage 3a`, `formatJson()`] }),
          s3b:    d(10,  8,  { color: `green`,  glyph: `code`,  label: [`Stage 3b`, `sendEmail()`] }),
          result: d(20,  2,  { color: `orange`, glyph: `check`, label: [`allOf()`, `joined`] }),
        },
        links: {
          s12: h(`s1`,  `s2`,     [`s1`,  `s2`],     { label: `thenCompose`,    heads: `end` }),
          s2a: h(`s2`,  `s3a`,    [`s2`,  `s3a`],    { label: `thenApplyAsync`, heads: `end` }),
          s2b: h(`s2`,  `s3b`,    [`s2`,  `s3b`],    { label: `thenApplyAsync`, heads: `end` }),
          ar:  h(`s3a`, `result`, [`s3a`, `result`], { heads: `end` }),
          br:  h(`s3b`, `result`, [`s3b`, `result`], { heads: `end` }),
        },
        flows: [
          { route: [`s12`, `s2a`, `ar`], bounce: false, rate: 1 },
          { route: [`s12`, `s2b`, `br`], bounce: false, rate: 1 },
        ],
      },
    },
    {
      short: `Virtual Threads`,
      chapter: `technique`,
      title: `Virtual Threads (JDK 21 — Project Loom)`,
      body: [
        `Virtual threads are lightweight JVM-managed threads. Millions can exist simultaneously — each uses ~1KB of memory vs ~1MB for a platform thread.`,
        `When a virtual thread blocks (IO, sleep), the JVM unmounts it from its carrier thread and parks the continuation. No OS context switch.`,
      ],
      callout: { kind: `insight`, text: `Write blocking-style IO code and get async performance. HTTP server throughput scales linearly with virtual threads — no reactive callbacks needed.` },
      metrics: { threads: `1M virtual`, queue: `per-carrier`, locks: `continuation`, mode: `VirtualThread` },
      scene: {
        entities: {
          carrier1: d(0,  -8,  { color: `orange`, glyph: `cpu`,    label: [`Carrier-1`, `OS Thread`], cpu: 0.9 }),
          carrier2: d(0,   2,  { color: `orange`, glyph: `cpu`,    label: [`Carrier-2`, `OS Thread`], cpu: 0.7 }),
          vt1:      d(12, -12, { color: `green`,  glyph: `code`,   label: [`VT-1`, `RUNNING`] }),
          vt2:      d(12, -6,  { color: `blue`,   glyph: `code`,   label: [`VT-2`, `parked (IO)`] }),
          vt3:      d(12,  0,  { color: `green`,  glyph: `code`,   label: [`VT-3`, `RUNNING`] }),
          vt4:      d(12,  6,  { color: `blue`,   glyph: `code`,   label: [`VT-4`, `parked (IO)`] }),
          heap:     d(22, -3,  { color: `purple`, glyph: `layers`, label: [`Heap`, `~1KB/VT`] }),
        },
        links: {
          c1v1: h(`carrier1`, `vt1`,  [`carrier1`, `vt1`],  { label: `mounted`,      heads: `both` }),
          c1v2: h(`carrier1`, `vt2`,  [`carrier1`, `vt2`],  { label: `parked`,       heads: `end`, style: `dashed` }),
          c2v3: h(`carrier2`, `vt3`,  [`carrier2`, `vt3`],  { label: `mounted`,      heads: `both` }),
          c2v4: h(`carrier2`, `vt4`,  [`carrier2`, `vt4`],  { label: `parked`,       heads: `end`, style: `dashed` }),
          vh:   h(`vt1`,      `heap`, [`vt1`,      `heap`], { label: `continuation`, heads: `end` }),
        },
        flows: [
          { route: [`c1v1`], bounce: true, rate: 1.3 },
          { route: [`c2v3`], bounce: true, rate: 1 },
        ],
      },
    },
  ],
};

export const sqlEngineLesson = {
  id: `sql-engine`,
  title: `SQL Query Engine Pipeline`,
  summary: `Follow a SQL query through parse, analyze, plan, execute, and commit — with buffer pool, WAL, and lock management.`,
  minutes: 10,
  level: `intermediate`,
  metrics: [`stage`, `buffers`, `wal`, `locks`],
  goals: [
    { text: `How the parser turns SQL text into an AST`, step: 1 },
    { text: `How the analyzer resolves names and checks types`, step: 2 },
    { text: `How the planner chooses Seq Scan vs Index Scan`, step: 3 },
    { text: `Buffer pool, WAL write, and lock acquisition during execution`, step: 4 },
    { text: `WAL flush, fsync, and lock release on COMMIT`, step: 5 },
  ],
  steps: [
    {
      short: `Parse`,
      chapter: `technique`,
      title: `Parse: SQL text → AST`,
      body: [
        `The query arrives as plain text. The parser tokenises it and builds an Abstract Syntax Tree (AST).`,
        `At this stage no tables are opened — the engine just understands the grammar of what was written.`,
      ],
      callout: { kind: `tip`, text: `A syntax error (misspelled keyword, missing comma) is caught here before any disk access.` },
      metrics: { stage: `Parse`, buffers: `0`, wal: `0 B`, locks: `none` },
      scene: {
        entities: {
          client: y(-10, 0, { label: `client`, tags: [{ text: `SELECT …`, icon: `code` }] }),
          parser: d(2,   0, { color: `blue`,   glyph: `code`, label: [`Parser`, `AST`] }),
        },
        links: {
          cp: h(`client`, `parser`, [`client`, `parser`], { label: `SQL text`, heads: `end` }),
        },
        flows: [{ route: [`cp`], bounce: false, rate: 1 }],
      },
    },
    {
      short: `Analyze`,
      chapter: `technique`,
      title: `Analyze: resolve names & types`,
      body: [
        `The analyzer walks the AST and resolves every table and column name against the system catalog.`,
        `It checks types, expands wildcards (SELECT *), and rewrites subqueries into joins where possible.`,
      ],
      callout: { kind: `tip`, text: `An unknown table or type mismatch is caught here — after parsing but before any plan is built.` },
      metrics: { stage: `Analyze`, buffers: `1 (catalog)`, wal: `0 B`, locks: `schema lock` },
      scene: {
        entities: {
          parser:   d(-8, 0,  { color: `blue`,   glyph: `code`, label: [`Parser`, `AST`] }),
          analyzer: d(4,  0,  { color: `purple`, glyph: `code`, label: [`Analyzer`, `type-check`] }),
          catalog:  b(4,  10, { label: [`System`, `Catalog`] }),
        },
        links: {
          pa: h(`parser`,   `analyzer`, [`parser`,   `analyzer`], { label: `AST`,    heads: `end` }),
          ac: h(`analyzer`, `catalog`,  [`analyzer`, `catalog`],  { label: `lookup`, heads: `both` }),
        },
        flows: [{ route: [`pa`], bounce: false, rate: 1 }],
      },
    },
    {
      short: `Plan`,
      chapter: `technique`,
      title: `Plan: choose the cheapest path`,
      body: [
        `The planner enumerates execution strategies — Seq Scan, Index Scan, Hash Join — and uses table statistics to estimate cost.`,
        `The cheapest plan wins. For a selective predicate on an indexed column, an Index Scan costs far less than reading every row.`,
      ],
      callout: { kind: `insight`, text: `Run EXPLAIN ANALYZE to see which plan the optimizer chose and whether its row-count estimates were accurate.` },
      metrics: { stage: `Plan`, buffers: `1`, wal: `0 B`, locks: `schema lock` },
      scene: {
        entities: {
          planner: d(-4, 2,  { color: `purple`, glyph: `code`,   label: [`Planner`, `cost model`] }),
          stats:   d(6, -6,  { color: `blue`,   glyph: `chart`,  label: [`Statistics`, `pg_stats`] }),
          seqscan: d(6,  2,  { color: `yellow`, glyph: `layers`, label: [`Seq Scan`, `10 000 rows`] }),
          idxscan: d(6,  10, { color: `green`,  glyph: `zap`,    label: [`Index Scan`, `12 rows ✓`] }),
        },
        links: {
          ps: h(`planner`, `stats`,   [`planner`, `stats`],   { label: `read stats`, heads: `both` }),
          p1: h(`planner`, `seqscan`, [`planner`, `seqscan`], { label: `cost: 420`,  heads: `end`, style: `dashed` }),
          p2: h(`planner`, `idxscan`, [`planner`, `idxscan`], { label: `cost: 0.3`,  heads: `end` }),
        },
        flows: [{ route: [`p2`], bounce: false, rate: 1.2 }],
      },
    },
    {
      short: `Execute`,
      chapter: `technique`,
      title: `Execute: buffer pool & locks`,
      body: [
        `The executor walks the plan tree top-down. Each node pulls rows from its child.`,
        `Pages are loaded into the shared buffer pool first — a cache in RAM. Only a cache miss goes to disk. Row-level locks prevent dirty reads.`,
      ],
      callout: { kind: `insight`, text: `Most OLTP queries touch only a handful of 8KB pages — the buffer pool hit rate is typically 99%+.` },
      metrics: { stage: `Execute`, buffers: `4 loaded`, wal: `48 B`, locks: `RowShareLock` },
      scene: {
        entities: {
          executor: d(-6, 0,  { color: `green`,  glyph: `code`,   label: [`Executor`, `pull model`] }),
          bufpool:  d(6, -6,  { color: `blue`,   glyph: `layers`, label: [`Buffer Pool`, `8KB pages`] }),
          lock_mgr: d(6,  4,  { color: `orange`, glyph: `lock`,   label: [`Lock Mgr`, `RowShareLock`] }),
          disk:     b(16, -6, { label: [`Disk`, `heap + index`] }),
        },
        links: {
          eb: h(`executor`, `bufpool`,  [`executor`, `bufpool`],  { label: `fetch page`, heads: `both` }),
          el: h(`executor`, `lock_mgr`, [`executor`, `lock_mgr`], { label: `acquire`,    heads: `end` }),
          bd: h(`bufpool`,  `disk`,     [`bufpool`,  `disk`],     { label: `cache miss`, heads: `both`, style: `dashed` }),
        },
        flows: [
          { route: [`eb`], bounce: false, rate: 1.2 },
          { route: [`el`], bounce: false, rate: 0.8 },
        ],
      },
    },
    {
      short: `Commit`,
      chapter: `technique`,
      title: `Commit: WAL flush & lock release`,
      body: [
        `On COMMIT the WAL (Write-Ahead Log) buffer is flushed to disk. The transaction is durable once the WAL record is fsynced.`,
        `Only after WAL is durable does the engine release row locks and report success to the client.`,
      ],
      callout: { kind: `insight`, text: `WAL is the reason crashes are safe: the heap page can be written lazily (checkpoint), but the log is always ahead of it.` },
      metrics: { stage: `Commit`, buffers: `4`, wal: `fsynced`, locks: `released` },
      scene: {
        entities: {
          executor: d(-8, 0, { color: `green`,  glyph: `code`,  label: [`Executor`, `COMMIT`] }),
          wal:      b(4, -6, { label: [`WAL`, `pg_wal`] }),
          disk:     b(4,  6, { label: [`Heap`, `data files`] }),
          done:     d(16, 0, { color: `green`,  glyph: `check`, label: [`Client`, `OK`] }),
        },
        links: {
          ew:  h(`executor`, `wal`,  [`executor`, `wal`],  { label: `fsync WAL`,         heads: `end` }),
          ed:  h(`executor`, `disk`, [`executor`, `disk`], { label: `dirty pages (lazy)`, heads: `end`, style: `dashed` }),
          ret: h(`executor`, `done`, [`executor`, `done`], { label: `COMMIT OK`,         heads: `end` }),
        },
        flows: [{ route: [`ew`, `ret`], bounce: false, rate: 1.3 }],
      },
    },
  ],
};

// ============================================================================
// MICROSERVICES & DISTRIBUTED SYSTEMS
// ============================================================================
const fc = { x0: -4.5, x1: 4.5, y0: -25, y1: -19 },
  pc = () => p(fc, 13, `shoppers`),
  mc = (e, t = {}) =>
    d(e, 0, {
      s: 5.5,
      h: 60,
      color: `orange`,
      glyph: `box`,
      label: [`Monolith`],
      sub: `all features`,
      ...t,
    }),
  hc = (e = {}, t = {}, n = {}) => ({
    users: pc(),
    lb: f(0, -12),
    m1: mc(-5, e),
    m2: mc(5, t),
    mdb: b(0, 11, { r: 2.2, h: 44, label: `one database`, ...n }),
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
    usr: { x: -13.5, color: `green`, glyph: `user`, label: [`Users`] },
    cat: { x: -4.5, color: `yellow`, glyph: `layers`, label: [`Catalog`] },
    ord: { x: 4.5, color: `blue`, glyph: `cart`, label: [`Orders`] },
    pay: { x: 13.5, color: `purple`, glyph: `creditCard`, label: [`Payments`] },
  },
  yc = Object.keys(vc),
  bc = (e = []) =>
    d(0, -12, {
      color: `orange`,
      glyph: `route`,
      label: [`API`, `Gateway`],
      tags: e,
      pills: `below`,
    }),
  xc = (e = {}) =>
    Object.fromEntries(yc.map((t) => [t, d(vc[t].x, 0, { ...vc[t], ...(e[t] || {}) })])),
  Sc = () =>
    Object.fromEntries(yc.map((e) => [`${e}db`, b(vc[e].x, 10, { r: 1.5, h: 30, label: `` })])),
  Cc = (e = {}) => ({
    ug: h(`users`, `gw`, [`users`, `gw`], { heads: `both` }),
    ...Object.fromEntries(
      yc.map((t) => [
        `g${t}`,
        h(`gw`, t, [`gw`, [t, `gw`], t], { heads: `both`, ...(e[t] || {}) }),
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
  Dc = (e, t, n) => S({ x: 4.5, y: 10, z: 0, dx: 60, dy: -175 }, e, t, { icon: n });

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
            mdb: b(0, 11, { r: 2.2, h: 44, label: `one database` }),
          },
          links: {
            ...Cc(),
            ...Object.fromEntries(
              yc.map((e) => [`m${e}`, h(e, `mdb`, [e, [vc[e].x, 11], `mdb`], { heads: `both` })]),
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
            mdb: b(0, 11, { r: 2.2, h: 44, label: `shared tables`, heat: 0.6 }),
          },
          links: {
            ...Cc(),
            ...Tc({ label: `chatty calls` }),
            ...Object.fromEntries(
              yc.map((e) => [`m${e}`, h(e, `mdb`, [e, [vc[e].x, 11], `mdb`], { heads: `both` })]),
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
            m1: mc(-6, { tags: [{ text: `users · catalog · orders` }] }),
            mdb: b(-6, 11, { r: 2.2, h: 44, label: `monolith DB` }),
            pay: d(9, 0, { ...vc.pay, tags: [{ text: `new`, tone: `green` }] }),
            paydb: b(9, 10, { r: 1.5, h: 30, label: `` }),
          },
          links: {
            ug: h(`users`, `gw`, [`users`, `gw`], { heads: `both` }),
            gm: h(`gw`, `m1`, [`gw`, [`m1`, `gw`], `m1`], {
              heads: `both`,
              label: `everything else`,
              labelAt: 0.45,
            }),
            gpay: h(`gw`, `pay`, [`gw`, [`pay`, `gw`], `pay`], {
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


// ============================================================================
// AWS CLOUD MULTI-AZ RESILIENCE
// ============================================================================
export const awsCloudLesson = {
    id: `aws-cloud`,
    title: `AWS Cloud Multi-AZ Resilience`,
    summary: `Explore how a fault-tolerant AWS architecture handles traffic, auto-scales across AZs, and self-heals when a full data center goes dark.`,
    minutes: 12,
    level: `intermediate`,
    metrics: [`az_health`, `latency`, `ecs_tasks`, `aurora_lag`, `total_uptime`],
    legend: [`req`, `res`, [`ping`, `health check`], `fail`],
    goals: [
      { text: `Single AZ fragility: why 1 instance in 1 AZ is a single point of failure`, step: 1 },
      { text: `Route 53 & CloudFront Edge caching for global reach`, step: 2 },
      { text: `Application Load Balancer health checking across multiple AZs`, step: 3 },
      { text: `Multi-AZ ECS Fargate auto-scaling and Redis caching`, step: 4 },
      { text: `Amazon Aurora Multi-AZ replication and sub-30s failover`, step: 5 },
      { text: `Disaster test: Kill AZ-1a and watch seamless self-healing`, step: 7 },
    ],
    steps: [
      {
        short: `Single AZ`,
        chapter: `problem`,
        title: `The Single Point of Failure (Single-AZ)`,
        body: [
          `A single EC2 instance and a single MySQL database live in one Availability Zone (<code>us-east-1a</code>).`,
          `If a power outage, fiber cut, or hardware failure hits that zone, the entire application goes completely dark with zero automated recovery.`,
        ],
        callout: {
          kind: `warn`,
          text: `Never run production workloads in a single Availability Zone. Even high-grade AWS data centers experience periodic local disruptions.`,
        },
        changes: [
          `+ Single EC2 instance in us-east-1a`,
          `+ Single MySQL database`,
          `! High downtime risk`,
        ],
        metrics: {
          az_health: `100%`,
          latency: 85,
          ecs_tasks: `1 task`,
          aurora_lag: `—`,
          total_uptime: `99.0%`,
        },
        scene: {
          entities: {
            client: y(0, -12, {
              label: `users`,
              tags: [{ text: `https://app.io`, icon: `globe` }],
            }),
            ec2: d(8, -2, {
              color: `yellow`,
              glyph: `server`,
              label: [`EC2`, `us-east-1a`],
              cpu: 0.85,
            }),
            db: b(16, 8, { label: `MySQL Single`, cpu: 0.6 }),
          },
          links: {
            c1: h(`client`, `ec2`, [`client`, `ec2`], { label: `Direct Traffic`, heads: `both` }),
            d1: h(`ec2`, `db`, [`ec2`, `db`], { label: `Read/Write`, heads: `both` }),
          },
          flows: [{ route: [`c1`, `d1`], bounce: !0, rate: 1 }],
        },
      },
      {
        short: `Edge Layer`,
        chapter: `technique`,
        title: `Global Edge: Route 53 & CloudFront`,
        body: [
          `To shield our compute and lower latency worldwide, we introduce <b>Amazon Route 53</b> (Anycast DNS) and <b>Amazon CloudFront</b> (CDN Edge).`,
          `CloudFront caches static assets and terminates TLS near the user, cutting round-trip time from 85 ms down to <b>18 ms</b> for cached hits.`,
        ],
        callout: {
          kind: `tip`,
          text: `CloudFront edge locations serve ~80% of read traffic without hitting the origin servers in your VPC.`,
        },
        changes: [
          `+ Route 53 DNS with Latency Routing`,
          `+ CloudFront CDN Edge Distribution`,
          `+ TTFB drops to 18 ms`,
        ],
        metrics: {
          az_health: `100%`,
          latency: 18,
          ecs_tasks: `1 task`,
          aurora_lag: `—`,
          total_uptime: `99.9%`,
        },
        scene: {
          entities: {
            client: y(0, -12, { label: `users`, tags: [{ text: `global edge`, icon: `globe` }] }),
            r53: d(0, 0, {
              color: `yellow`,
              glyph: `globe`,
              label: [`Route 53`],
              sub: `Latency Routing`,
            }),
            cf: d(8, -6, {
              color: `purple`,
              glyph: `shield`,
              label: [`CloudFront`],
              sub: `Edge Cache`,
            }),
            ec2: d(16, -2, { color: `blue`, glyph: `server`, label: [`Origin VPC`], cpu: 0.35 }),
          },
          links: {
            dns: h(`client`, `r53`, [`client`, `r53`], { label: `DNS Query`, heads: `both` }),
            edge: h(`client`, `cf`, [`client`, `cf`], { label: `HTTPS / TLS 1.3`, heads: `both` }),
            origin: h(`cf`, `ec2`, [`cf`, `ec2`], { label: `Origin Fetch`, heads: `both` }),
          },
          flows: [{ route: [`edge`], bounce: !0, rate: 1.5 }],
        },
      },
      {
        short: `Dual-AZ ALB`,
        chapter: `technique`,
        title: `Application Load Balancer across AZs`,
        body: [
          `We deploy an <b>Application Load Balancer (ALB)</b> with nodes in both <code>us-east-1a</code> and <code>us-east-1b</code>.`,
          `The ALB automatically routes incoming HTTP requests to healthy compute instances and performs active health checking every 5 seconds.`,
        ],
        changes: [
          `+ Dual-AZ Application Load Balancer`,
          `+ Layer 7 path-based routing`,
          `+ Continuous health checking`,
        ],
        metrics: {
          az_health: `100%`,
          latency: 22,
          ecs_tasks: `2 tasks`,
          aurora_lag: `—`,
          total_uptime: `99.95%`,
        },
        scene: {
          entities: {
            client: y(0, -12, { label: `users` }),
            alb: f(0, 0, { color: `orange`, glyph: `balancer`, label: [`ALB`, `Dual-AZ`] }),
            srv_a: d(10, -6, {
              color: `blue`,
              glyph: `server`,
              label: [`Target AZ-1a`],
              cpu: 0.25,
            }),
            srv_b: d(10, 6, { color: `blue`, glyph: `server`, label: [`Target AZ-1b`], cpu: 0.25 }),
          },
          links: {
            in: h(`client`, `alb`, [`client`, `alb`], { label: `HTTPS`, heads: `both` }),
            t_a: h(`alb`, `srv_a`, [`alb`, `srv_a`], { label: `HTTP /health`, heads: `both` }),
            t_b: h(`alb`, `srv_b`, [`alb`, `srv_b`], { label: `HTTP /health`, heads: `both` }),
          },
          flows: [
            { route: [`in`, `t_a`], bounce: !0, rate: 0.9 },
            { route: [`in`, `t_b`], bounce: !0, rate: 0.9 },
          ],
        },
      },
      {
        short: `ECS Auto-scale`,
        chapter: `technique`,
        title: `Stateless ECS Fargate Containers`,
        body: [
          `Instead of fixed virtual machines, we run containerized microservices on <b>AWS ECS Fargate</b>.`,
          `Tasks are stateless: if traffic surges, the Auto Scaling policy spins up additional tasks in seconds across both AZs without human intervention.`,
        ],
        callout: {
          kind: `tip`,
          text: `Spreading tasks evenly across AZs ensures that losing one zone never cuts compute capacity by more than 50%.`,
        },
        changes: [
          `+ ECS Fargate Serverless Cluster`,
          `+ Target Tracking Auto-Scaling`,
          `+ 4 Container Tasks balanced`,
        ],
        metrics: {
          az_health: `100%`,
          latency: 24,
          ecs_tasks: `4 tasks`,
          aurora_lag: `—`,
          total_uptime: `99.99%`,
        },
        scene: {
          entities: {
            alb: f(0, 0, { color: `orange`, glyph: `balancer`, label: [`ALB`, `Dual-AZ`] }),
            ecs1: d(10, -8, { color: `blue`, glyph: `server`, label: [`ECS-1 (AZ-a)`], cpu: 0.3 }),
            ecs2: d(10, -2, { color: `blue`, glyph: `server`, label: [`ECS-2 (AZ-a)`], cpu: 0.3 }),
            ecs3: d(10, 4, { color: `blue`, glyph: `server`, label: [`ECS-3 (AZ-b)`], cpu: 0.3 }),
            ecs4: d(10, 10, { color: `blue`, glyph: `server`, label: [`ECS-4 (AZ-b)`], cpu: 0.3 }),
          },
          links: {
            l1: h(`alb`, `ecs1`, [`alb`, `ecs1`]),
            l2: h(`alb`, `ecs2`, [`alb`, `ecs2`]),
            l3: h(`alb`, `ecs3`, [`alb`, `ecs3`]),
            l4: h(`alb`, `ecs4`, [`alb`, `ecs4`]),
          },
          flows: [
            { route: [`l1`], bounce: !0, rate: 0.8 },
            { route: [`l3`], bounce: !0, rate: 0.8 },
          ],
        },
      },
      {
        short: `Redis Cache`,
        chapter: `technique`,
        title: `ElastiCache Redis Caching Layer`,
        body: [
          `Before queries hit disk, containers check <b>Amazon ElastiCache Redis</b>.`,
          `Hot product catalog and session data return in <b>sub-millisecond (<1 ms)</b> latency, relieving database strain by 85%.`,
        ],
        changes: [
          `+ ElastiCache Redis Primary in AZ-1a`,
          `+ Redis Read Replica in AZ-1b`,
          `+ 85% cache hit ratio`,
        ],
        metrics: {
          az_health: `100%`,
          latency: 6,
          ecs_tasks: `4 tasks`,
          aurora_lag: `< 1 ms`,
          total_uptime: `99.99%`,
        },
        scene: {
          entities: {
            ecs_a: d(0, -6, { color: `blue`, glyph: `server`, label: [`ECS Cluster`, `AZ-1a`] }),
            ecs_b: d(0, 6, { color: `blue`, glyph: `server`, label: [`ECS Cluster`, `AZ-1b`] }),
            redis_p: d(10, -6, { color: `green`, glyph: `zap`, label: [`Redis Master`, `AZ-1a`] }),
            redis_r: d(10, 6, { color: `green`, glyph: `zap`, label: [`Redis Replica`, `AZ-1b`] }),
          },
          links: {
            r1: h(`ecs_a`, `redis_p`, [`ecs_a`, `redis_p`], {
              label: `GET /hot-key (<1ms)`,
              heads: `both`,
            }),
            r2: h(`ecs_b`, `redis_r`, [`ecs_b`, `redis_r`], { label: `Read Cache`, heads: `both` }),
            sync: h(`redis_p`, `redis_r`, [`redis_p`, `redis_r`], {
              label: `Replication`,
              style: `dashed`,
            }),
          },
          flows: [
            { route: [`r1`], bounce: !0, rate: 1.2 },
            { route: [`r2`], bounce: !0, rate: 1.2 },
          ],
        },
      },
      {
        short: `Aurora Multi-AZ`,
        chapter: `technique`,
        title: `Amazon Aurora Multi-AZ Cluster`,
        body: [
          `For durable relational storage, we deploy <b>Amazon Aurora PostgreSQL</b> with a Primary Writer in AZ-1a and an Aurora Replica in AZ-1b.`,
          `Aurora maintains <b>6 copies of data across 3 AZs</b> at the storage layer. Replication lag to the read replica is virtually zero (<10 ms).`,
        ],
        callout: {
          kind: `insight`,
          text: `Unlike standard RDS MySQL which replicates via binary logs, Aurora uses a distributed log-structured storage volume spanning 3 AZs.`,
        },
        changes: [
          `+ Aurora Primary Writer (AZ-1a)`,
          `+ Aurora Read Replica (AZ-1b)`,
          `+ 6-way distributed SSD storage`,
        ],
        metrics: {
          az_health: `100%`,
          latency: 8,
          ecs_tasks: `4 tasks`,
          aurora_lag: `8 ms`,
          total_uptime: `99.99%`,
        },
        scene: {
          entities: {
            ecs_a: d(0, -6, { color: `blue`, glyph: `server`, label: [`ECS AZ-1a`] }),
            ecs_b: d(0, 6, { color: `blue`, glyph: `server`, label: [`ECS AZ-1b`] }),
            db_p: b(12, -6, {
              label: `Aurora Writer`,
              cpu: 0.35,
              tags: [{ text: `Primary`, tone: `green` }],
            }),
            db_r: b(12, 6, {
              label: `Aurora Replica`,
              cpu: 0.2,
              tags: [{ text: `Standby`, tone: `blue` }],
            }),
          },
          links: {
            w1: h(`ecs_a`, `db_p`, [`ecs_a`, `db_p`], { label: `INSERT / UPDATE`, heads: `both` }),
            r1: h(`ecs_b`, `db_r`, [`ecs_b`, `db_r`], { label: `SELECT read-only`, heads: `both` }),
            aurora_sync: h(`db_p`, `db_r`, [`db_p`, `db_r`], {
              label: `Shared Storage (6-way)`,
              heads: `both`,
            }),
          },
          flows: [
            { route: [`w1`], bounce: !0, rate: 0.9 },
            { route: [`r1`], bounce: !0, rate: 1.1 },
          ],
        },
      },
      {
        short: `AZ Outage!`,
        chapter: `problem`,
        title: `Disaster Simulation: AZ-1a Goes Down`,
        body: [
          `<b>DISASTER STRIKES!</b> An unexpected power grid failure takes down the entire <code>us-east-1a</code> data center.`,
          `All compute tasks and the primary database in AZ-1a lose network connectivity instantly.`,
        ],
        callout: {
          kind: `warn`,
          text: `Notice that traffic to AZ-1b is unaffected! The ALB immediately begins draining unhealthy targets.`,
        },
        changes: [
          `! us-east-1a OFFLINE (Power Cut)`,
          `! ECS AZ-1a unhealthy`,
          `! Primary DB unreachable`,
        ],
        metrics: {
          az_health: `50% (AZ-a DOWN)`,
          latency: 35,
          ecs_tasks: `2 tasks`,
          aurora_lag: `Failover…`,
          total_uptime: `99.99%`,
        },
        scene: {
          entities: {
            alb: f(0, 0, { color: `orange`, glyph: `balancer`, label: [`ALB`, `Dual-AZ`] }),
            ecs_a: d(10, -6, {
              color: `slab`,
              glyph: `skull`,
              dead: 1,
              label: [`ECS AZ-1a (DOWN)`],
              tags: [{ text: `DOWN`, tone: `red`, icon: `alert` }],
            }),
            ecs_b: d(10, 6, {
              color: `blue`,
              glyph: `server`,
              label: [`ECS AZ-1b (HEALTHY)`],
              cpu: 0.75,
            }),
            db_a: b(20, -6, {
              label: `Writer AZ-a (DOWN)`,
              dead: 1,
              heat: 0.9,
              tags: [{ text: `FAILED`, tone: `red` }],
            }),
            db_b: b(20, 6, {
              label: `Replica AZ-b`,
              tags: [{ text: `Promoting…`, tone: `amber` }],
            }),
          },
          links: {
            fail_link: h(`alb`, `ecs_a`, [`alb`, `ecs_a`], {
              style: `off`,
              label: `Connection timeout`,
            }),
            live_link: h(`alb`, `ecs_b`, [`alb`, `ecs_b`], {
              label: `Active Route`,
              heads: `both`,
            }),
          },
          flows: [{ route: [`live_link`], bounce: !0, rate: 1.8 }],
        },
      },
      {
        short: `Auto-Healing`,
        chapter: `solution`,
        title: `Automated Failover & Recovery`,
        body: [
          `Watch the architecture self-heal in real-time without human intervention:`,
          `1. <b>ALB</b> redirects 100% of user traffic to AZ-1b.<br/>2. <b>ECS Auto Scaling</b> detects high CPU on AZ-1b tasks and rapidly spins up 2 replacement tasks in AZ-1b.<br/>3. <b>Aurora</b> promotes the standby replica in AZ-1b to the new Primary Writer in under <b>25 seconds</b>. Zero data loss!`,
        ],
        callout: {
          kind: `tip`,
          text: `RTO (Recovery Time Objective) < 30 seconds. RPO (Recovery Point Objective) = 0 seconds.`,
        },
        changes: [
          `+ Aurora AZ-1b promoted to Writer in 24s`,
          `+ ECS AZ-1b scaled out to 4 tasks`,
          `+ 100% traffic serving normally`,
        ],
        metrics: {
          az_health: `Resilient on AZ-b`,
          latency: 22,
          ecs_tasks: `4 tasks in AZ-b`,
          aurora_lag: `0 ms (New Master)`,
          total_uptime: `99.99%`,
        },
        scene: {
          entities: {
            client: y(0, -12, {
              label: `users`,
              tags: [{ text: `0 downtime`, tone: `green`, icon: `check` }],
            }),
            alb: f(0, 0, { color: `orange`, glyph: `balancer`, label: [`ALB`, `Healthy`] }),
            ecs_b1: d(10, 2, {
              color: `blue`,
              glyph: `server`,
              label: [`ECS AZ-b (#1)`],
              cpu: 0.35,
            }),
            ecs_b2: d(10, 8, {
              color: `blue`,
              glyph: `server`,
              label: [`ECS AZ-b (#2)`],
              cpu: 0.35,
            }),
            db_b: b(20, 5, {
              label: `Aurora New Writer`,
              cpu: 0.4,
              tags: [{ text: `PRIMARY WRITER`, tone: `green` }],
            }),
          },
          links: {
            c: h(`client`, `alb`, [`client`, `alb`], { heads: `both` }),
            l1: h(`alb`, `ecs_b1`, [`alb`, `ecs_b1`], { heads: `both` }),
            l2: h(`alb`, `ecs_b2`, [`alb`, `ecs_b2`], { heads: `both` }),
            db_l: h(`ecs_b1`, `db_b`, [`ecs_b1`, `db_b`], { label: `Active R/W`, heads: `both` }),
          },
          flows: [
            { route: [`c`, `l1`, `db_l`], bounce: !0, rate: 1.4 },
            { route: [`c`, `l2`], bounce: !0, rate: 1 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `AWS Cloud Resilience Checklist`,
        body: [
          `<ul class="takeaways"><li><b>Multi-AZ VPC:</b> Always deploy subnets across at least 2 (preferably 3) Availability Zones.</li><li><b>Stateless Compute:</b> Keep sessions in Redis or JWT so any container in any AZ can serve any user.</li><li><b>Managed Aurora:</b> Leverage Aurora distributed storage for automated sub-30s failover with 0 data loss.</li><li><b>Edge Defense:</b> Terminate TLS and cache with CloudFront to absorb traffic surges and DDoS attacks.</li></ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next lab: <b>Microservices & Distributed Sagas</b> — learn how services communicate and rollback transactions.`,
        },
        metrics: {
          az_health: `100% Ready`,
          latency: 15,
          ecs_tasks: `Dynamic`,
          aurora_lag: `0 ms`,
          total_uptime: `99.999%`,
        },
        scene: {
          entities: {
            client: y(0, -12, { label: `users`, tags: [{ text: `resilient`, tone: `green` }] }),
            alb: f(0, 0, { color: `orange`, glyph: `balancer`, label: [`ALB`, `Dual-AZ`] }),
            ecs_a: d(10, -6, { color: `blue`, glyph: `server`, label: [`ECS AZ-1a`] }),
            ecs_b: d(10, 6, { color: `blue`, glyph: `server`, label: [`ECS AZ-1b`] }),
            db_a: b(20, -6, { label: `Aurora Writer`, tags: [{ text: `Active`, tone: `green` }] }),
            db_b: b(20, 6, { label: `Aurora Standby`, tags: [{ text: `Replica`, tone: `blue` }] }),
          },
          links: {
            c: h(`client`, `alb`, [`client`, `alb`], { heads: `both` }),
            l_a: h(`alb`, `ecs_a`, [`alb`, `ecs_a`], { heads: `both` }),
            l_b: h(`alb`, `ecs_b`, [`alb`, `ecs_b`], { heads: `both` }),
            db_sync: h(`db_a`, `db_b`, [`db_a`, `db_b`], { label: `Storage Sync`, heads: `both` }),
          },
          flows: [
            { route: [`c`, `l_a`], bounce: !0, rate: 1 },
            { route: [`c`, `l_b`], bounce: !0, rate: 1 },
          ],
        },
      },
    ],
  };


// ============================================================================
// DAWN BLOG SYSTEM ARCHITECTURE (FULL EDGE & C4 MODEL)
// ============================================================================
const sys_d = (x, y, opts = {}) => ({ type: "block", x, y, color: "blue", glyph: "server", ...opts });

const sys_f = (x, y, opts = {}) => ({
  type: "block",
  x,
  y,
  color: "orange",
  glyph: "balancer",
  label: ["Load", "Balancer"],
  pills: "above",
  ...opts,
});

const sys_b = (x, y, opts = {}) => ({ type: "db", x, y, ...opts });

const sys_y = (x, y, opts = {}) => ({ type: "device", x, y, ...opts });

const sys_h = (from, to, pts, opts = {}) => ({ from, to, pts, heads: "end", ...opts });

export const systemDesignLesson = {
  id: "system-design",
  title: "Dawn Blog System Architecture",
  summary:
    "Progressive Edge-First Architecture — from Author Publishing to Global Edge Serving & Database Mutations.",
  minutes: 10,
  level: "intermediate",
  metrics: ["latency", "hitRate", "deploys", "conns", "total_uptime"],
  legend: ["req", "res", ["ping", "handshake"], "fail"],
  goals: [
    { text: "Content drafting on Author Workstation", step: 1 },
    { text: "Astro 5 SSG build via GitHub Actions", step: 2 },
    { text: "Deploying to 300+ Edge PoPs with cache purge", step: 3 },
    { text: "Sub-20ms TTFB reader cache hits", step: 4 },
    { text: "Serverless SSR & Prisma connection pooling", step: 5 },
    { text: "The complete dual-pipeline architecture", step: 6 },
  ],
  steps: [
    // Step 1: Author Workstation (Drafting in Notion)
    {
      short: "Draft",
      chapter: "technique",
      title: "Author Workstation: Hit Publish",
      body: [
        "Everything starts on the <b>Author Workstation</b>. Technical deep-dives, CS lab specifications, and book notes are drafted in a private workspace.",
        'Writing and staging content is completely decoupled from production, consuming zero production server resources. Hitting "Publish" triggers the automated build pipeline.',
      ],
      callout: {
        kind: "insight",
        text: "Decoupled CMS: Writing and staging content consumes zero production server bandwidth.",
      },
      changes: ["+ Author Workstation", "+ Technical post drafted", '+ Click "Publish"'],
      metrics: {
        latency: "—",
        hitRate: "Drafting",
        deploys: "—",
        conns: "0",
        total_uptime: "99.99%",
      },
      scene: {
        entities: {
          author: sys_y(-18, 6, {
            label: "Author",
            tags: [{ text: "Drafting in Notion", icon: "file" }],
          }),
        },
        links: {},
        flows: [],
      },
    },

    // Step 2: Headless CMS & CI/CD Ingestion Appears
    {
      short: "SSG Build",
      chapter: "technique",
      title: "Headless Ingestion & Astro 5 SSG Compilation",
      body: [
        "The publishing webhook triggers the <b>GitHub Actions CI Runner</b>.",
        "The runner executes <code>sync-notion.mjs</code>, fetches updated blocks via the <b>Notion API</b>, validates content schemas, and compiles 140+ static routes with Astro 5 in under 2 seconds.",
      ],
      callout: {
        kind: "tip",
        text: "Static Site Generation (SSG) compiles HTML ahead of time, eliminating origin compute costs for all readers.",
      },
      changes: [
        "+ Notion API connected",
        "+ GitHub Actions CI Runner",
        "+ Astro 5 compiles 140+ SSG pages in 1.8s",
      ],
      metrics: {
        latency: "—",
        hitRate: "Staging",
        deploys: "1.8 s",
        conns: "0",
        total_uptime: "99.99%",
      },
      scene: {
        entities: {
          author: sys_y(-18, 6, {
            label: "Author",
            tags: [{ text: "Published ✓", tone: "green" }],
          }),
          notion: sys_d(-8, 12, {
            color: "purple",
            glyph: "globe",
            label: ["Notion CMS"],
            sub: "Headless",
          }),
          ci: sys_d(4, 14, {
            color: "yellow",
            glyph: "zap",
            label: ["GitHub Actions"],
            sub: "CI/CD",
            cpu: 0.85,
            tags: [{ text: "1.8s Build", tone: "green" }],
          }),
        },
        links: {
          author_notion: sys_h("author", "notion", ["author", "notion"], {
            label: "POST /publish",
            heads: "end",
          }),
          notion_ci: sys_h("notion", "ci", ["notion", "ci"], {
            label: "Sync & Build",
            heads: "end",
          }),
        },
        flows: [
          { route: ["author_notion"], bounce: false, rate: 1.2 },
          { route: ["notion_ci"], bounce: false, rate: 1.2 },
        ],
      },
    },

    // Step 3: Global Edge Deployment & Instant Cache Invalidation
    {
      short: "Edge Deploy",
      chapter: "solution",
      title: "Global Edge Deployment & Instant Cache Invalidation",
      body: [
        "The compiled immutable HTML/JS artifact is deployed to <b>Vercel Edge</b> across 300+ Point-of-Presence (PoP) locations worldwide.",
        "Simultaneously, a <b>Cache Invalidation</b> signal purges stale pages, priming the edge cache so readers immediately receive updated content.",
      ],
      callout: {
        kind: "warn",
        text: "Atomic cache invalidation guarantees readers never experience mismatched styling or outdated scripts.",
      },
      changes: [
        "+ Vercel Edge CDN (300+ PoPs)",
        "+ Global cache purge triggered",
        "+ Immutable static assets synced",
      ],
      metrics: {
        latency: "—",
        hitRate: "Purged",
        deploys: "Done (2s)",
        conns: "0",
        total_uptime: "99.99%",
      },
      scene: {
        entities: {
          author: sys_y(-18, 6, { label: "Author" }),
          notion: sys_d(-8, 12, {
            color: "purple",
            glyph: "globe",
            label: ["Notion CMS"],
            sub: "Headless",
          }),
          ci: sys_d(4, 14, {
            color: "yellow",
            glyph: "zap",
            label: ["GitHub Actions"],
            sub: "CI/CD",
            tags: [{ text: "Deploy Success", tone: "green" }],
          }),
          edge: sys_f(-2, 0, {
            color: "blue",
            glyph: "balancer",
            label: ["Vercel Edge"],
            sub: "Anycast CDN",
            pills: "above",
            tags: [{ text: "Cache Purged", tone: "amber" }],
          }),
        },
        links: {
          author_notion: sys_h("author", "notion", ["author", "notion"], { style: "off" }),
          notion_ci: sys_h("notion", "ci", ["notion", "ci"], { style: "off" }),
          ci_edge: sys_h("ci", "edge", ["ci", "edge"], { label: "Deploy", heads: "end" }),
        },
        flows: [{ route: ["ci_edge"], bounce: false, rate: 1.4 }],
      },
    },

    // Step 4: Reader Ingress & Sub-20ms Global Cache HIT
    {
      short: "Cache HIT",
      chapter: "technique",
      title: "Reader Ingress & Sub-20ms Global Cache HIT",
      body: [
        "A reader visits <code>https://dawn.dev/blog</code>. Their browser initiates TLS 1.3 routed via Anycast to the closest edge server.",
        "Edge memory detects the primed cache and serves pre-rendered HTML in <b>sub-20ms TTFB</b> without touching origin compute or databases.",
      ],
      callout: {
        kind: "tip",
        text: "Edge memory serving eliminates origin compute overhead and delivers instant page transitions worldwide.",
      },
      changes: [
        "+ Reader HTTPS / TLS 1.3 handshake",
        "+ Sub-20ms TTFB Edge Memory Cache HIT",
        "+ Zero origin server load",
      ],
      metrics: {
        latency: "18 ms",
        hitRate: "98.8%",
        deploys: "—",
        conns: "0 (Zero DB Load)",
        total_uptime: "99.999%",
      },
      scene: {
        entities: {
          readers: sys_y(-14, -8, {
            label: "Readers",
            tags: [{ text: "https://dawn.dev", icon: "globe" }],
          }),
          edge: sys_f(-2, 0, {
            color: "blue",
            glyph: "balancer",
            label: ["Vercel Edge"],
            sub: "Anycast CDN",
            pills: "above",
            tags: [{ text: "Cache HIT · 18ms", tone: "green" }],
          }),
          author: sys_y(-18, 6, { label: "Author" }),
          notion: sys_d(-8, 12, {
            color: "purple",
            glyph: "globe",
            label: ["Notion CMS"],
            sub: "Headless",
          }),
          ci: sys_d(4, 14, {
            color: "yellow",
            glyph: "zap",
            label: ["GitHub Actions"],
            sub: "CI/CD",
          }),
        },
        links: {
          readers_edge: sys_h("readers", "edge", ["readers", "edge"], {
            label: "GET /blog",
            heads: "both",
          }),
          author_notion: sys_h("author", "notion", ["author", "notion"], { style: "off" }),
          notion_ci: sys_h("notion", "ci", ["notion", "ci"], { style: "off" }),
          ci_edge: sys_h("ci", "edge", ["ci", "edge"], { style: "off" }),
        },
        flows: [{ route: ["readers_edge"], bounce: true, rate: 1.5 }],
      },
    },

    // Step 5: Serverless SSR & PostgreSQL Prisma Connection Pool
    {
      short: "SSR & DB",
      chapter: "technique",
      title: "Serverless SSR & PostgreSQL Prisma Connection Pool",
      body: [
        "When a reader likes a post or interacts with an interactive CS Lab, Vercel Edge proxies the mutation to the <b>Astro Serverless Lambda</b>.",
        "Astro utilizes a persistent <b>Prisma Connection Pool</b> to execute atomic upserts in <b>PostgreSQL 16</b> in 1.2ms without exhausting database connection limits.",
      ],
      callout: {
        kind: "insight",
        text: "Connection pooling prevents database exhaustion during traffic spikes that spawn hundreds of concurrent serverless lambdas.",
      },
      changes: [
        "+ Dynamic API mutation bypasses cache",
        "+ Astro Serverless Lambda triggered",
        "+ Prisma pool manages active sockets",
        "+ PostgreSQL atomic mutation in 1.2ms",
      ],
      metrics: {
        latency: "45 ms",
        hitRate: "BYPASS",
        deploys: "—",
        conns: "1 / 10 active",
        total_uptime: "99.99%",
      },
      scene: {
        entities: {
          readers: sys_y(-14, -8, {
            label: "Readers",
            tags: [{ text: "POST /like", tone: "violet" }],
          }),
          edge: sys_f(-2, 0, {
            color: "blue",
            glyph: "balancer",
            label: ["Vercel Edge"],
            sub: "Anycast CDN",
            pills: "above",
            tags: [{ text: "Proxy SSR API", tone: "amber" }],
          }),
          astro: sys_d(12, 0, {
            color: "violet",
            glyph: "server",
            label: ["Astro SSR"],
            sub: "Serverless",
            cpu: 0.65,
            pills: "above",
            tags: [{ text: "Prisma · 45ms", tone: "violet" }],
          }),
          db: sys_b(26, 0, {
            label: "PostgreSQL",
            cpu: 0.45,
            tags: [{ text: "Pool: 1/10", tone: "green" }],
          }),
          author: sys_y(-18, 6, { label: "Author" }),
          notion: sys_d(-8, 12, {
            color: "purple",
            glyph: "globe",
            label: ["Notion CMS"],
            sub: "Headless",
          }),
          ci: sys_d(4, 14, {
            color: "yellow",
            glyph: "zap",
            label: ["GitHub Actions"],
            sub: "CI/CD",
          }),
        },
        links: {
          readers_edge: sys_h("readers", "edge", ["readers", "edge"], {
            label: "POST /like",
            heads: "end",
          }),
          edge_astro: sys_h("edge", "astro", ["edge", "astro"], {
            label: "SSR Proxy",
            heads: "end",
          }),
          astro_db: sys_h("astro", "db", ["astro", "db"], {
            label: "Prisma Query",
            heads: "both",
          }),
          author_notion: sys_h("author", "notion", ["author", "notion"], { style: "off" }),
          notion_ci: sys_h("notion", "ci", ["notion", "ci"], { style: "off" }),
          ci_edge: sys_h("ci", "edge", ["ci", "edge"], { style: "off" }),
        },
        flows: [
          { route: ["readers_edge"], bounce: false, rate: 1.2 },
          { route: ["edge_astro"], bounce: false, rate: 1.2 },
          { route: ["astro_db"], bounce: true, rate: 1.2 },
        ],
      },
    },

    // Step 6: Unified Dual-Pipeline Architecture Recap
    {
      short: "Recap",
      chapter: "recap",
      title: "Unified Architecture: Dual Ingestion & Edge Serving Pipeline",
      body: [
        "The complete architecture bridges two autonomous pipelines: The <b>Author Ingestion Pipeline</b> (Top) compiles immutable content ahead of time with zero production friction.",
        "The <b>Reader Edge Pipeline</b> (Bottom) delivers static posts in sub-20ms from Vercel Edge memory while seamlessly routing dynamic CS labs to pooled PostgreSQL 16 serverless compute.",
      ],
      callout: {
        kind: "next",
        text: "Production Philosophy: Static by default, Edge cached globally, Serverless SSR only when state mutation is strictly necessary.",
      },
      changes: [
        "✓ 2 Independent Pipelines",
        "✓ Authoring decoupled from serving",
        "✓ Sub-20ms TTFB worldwide",
        "✓ 0ms backend load on static hits",
      ],
      metrics: {
        latency: "18 ms",
        hitRate: "98.8%",
        deploys: "1.8 s",
        conns: "Optimal",
        total_uptime: "99.999%",
      },
      scene: {
        entities: {
          author: sys_y(-18, 6, { label: "Author" }),
          notion: sys_d(-8, 12, {
            color: "purple",
            glyph: "globe",
            label: ["Notion CMS"],
            sub: "Headless",
          }),
          ci: sys_d(4, 14, {
            color: "yellow",
            glyph: "zap",
            label: ["GitHub Actions"],
            sub: "CI/CD",
          }),
          edge: sys_f(-2, 0, {
            color: "blue",
            glyph: "balancer",
            label: ["Vercel Edge"],
            sub: "Anycast CDN",
            pills: "above",
          }),
          readers: sys_y(-14, -8, { label: "Readers" }),
          astro: sys_d(12, 0, {
            color: "violet",
            glyph: "server",
            label: ["Astro SSR"],
            sub: "Serverless",
          }),
          db: sys_b(26, 0, { label: "PostgreSQL" }),
        },
        links: {
          readers_edge: sys_h("readers", "edge", ["readers", "edge"], {
            label: "Static Hit · 18ms",
            heads: "both",
          }),
          edge_astro: sys_h("edge", "astro", ["edge", "astro"], {
            label: "SSR Proxy",
            heads: "end",
          }),
          astro_db: sys_h("astro", "db", ["astro", "db"], {
            label: "Prisma Query",
            heads: "both",
          }),
          author_notion: sys_h("author", "notion", ["author", "notion"], {
            label: "Content Sync",
            heads: "end",
          }),
          notion_ci: sys_h("notion", "ci", ["notion", "ci"], {
            label: "Build Webhook",
            heads: "end",
          }),
          ci_edge: sys_h("ci", "edge", ["ci", "edge"], {
            label: "Deploy SSG",
            heads: "end",
          }),
        },
        flows: [
          { route: ["readers_edge"], bounce: true, rate: 1.2 },
          { route: ["edge_astro"], bounce: false, rate: 1.2 },
          { route: ["astro_db"], bounce: true, rate: 1.2 },
        ],
      },
    },
  ],
};

export {
  consistentHashingLesson,
  uniqueIdsLesson,
  capLesson,
  consensusLesson,
  transactionsLesson,
  filesLesson,
  apisLesson,
  queuesLesson,
  pubsubLesson,
  realtimeLesson,
  redundancyLesson,
  rateLimitingLesson,
  timeoutsRetriesLesson,
  observabilityLesson,
  serviceDiscoveryLesson,
  sagasLesson,
  batchStreamLesson,
  authenticationLesson,
  authorizationLesson,
  encryptionLesson,
  testingLesson,
  cicdLesson,
  hldLldLesson,
  designUrlShortenerLesson,
  designNewsFeedLesson,
  designChatLesson,
};

export const ALL_DTS_LESSONS: Record<string, any> = {
  'request-lifecycle': requestLifecycleLesson,
  'latency-throughput': latencyThroughputLesson,
  'napkin-math': napkinMathLesson,
  'vertical-horizontal': verticalHorizontalLesson,
  'load-balancing': loadBalancingLesson,
  'stateless': statelessLesson,
  'caching': cachingLesson,
  'cdn': cdnLesson,
  'sql-nosql': sqlNosqlLesson,
  'indexes': indexesLesson,
  'storage-engines': storageEnginesLesson,
  'replication': replicationLesson,
  'sharding': shardingLesson,
  'consistent-hashing': consistentHashingLesson,
  'unique-ids': uniqueIdsLesson,
  'cap': capLesson,
  'consensus': consensusLesson,
  'transactions': transactionsLesson,
  'files': filesLesson,
  'apis': apisLesson,
  'queues': queuesLesson,
  'pubsub': pubsubLesson,
  'realtime': realtimeLesson,
  'redundancy': redundancyLesson,
  'rate-limiting': rateLimitingLesson,
  'timeouts-retries': timeoutsRetriesLesson,
  'observability': observabilityLesson,
  'microservices': microservicesLesson,
  'service-discovery': serviceDiscoveryLesson,
  'sagas': sagasLesson,
  'batch-stream': batchStreamLesson,
  'authentication': authenticationLesson,
  'authorization': authorizationLesson,
  'encryption': encryptionLesson,
  'testing': testingLesson,
  'cicd': cicdLesson,
  'hld-lld': hldLldLesson,
  'design-url-shortener': designUrlShortenerLesson,
  'design-news-feed': designNewsFeedLesson,
  'design-chat': designChatLesson,
  'aws-cloud': awsCloudLesson,
  'system-design': systemDesignLesson,
};


