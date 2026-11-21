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

const es = (e = []) => y(0, -19, { form: `phone`, w: 5, d: 5, label: `Alice`, tags: e });

const ts = (e = []) => y(13, -6, { form: `phone`, w: 5, d: 5, label: `Bob`, tags: e });

const ns = (e = {}) => d(0, -6, { label: [`Chat`, `Server`], glyph: `message`, ...e });

const rs = (e = {}) => ({
    ap: h(
      `alice`,
      `srv`,
      [
        [`alice-1`, `alice`],
        [`srv-1`, `srv`],
      ],
      e,
    ),
  });

const is = (e = {}) => ({
    sa: h(
      `srv`,
      `alice`,
      [
        [`srv+1`, `srv`],
        [`alice+1`, `alice`],
      ],
      e,
    ),
  });

const as = (e = {}) => ({
    bs: h(
      `bob`,
      `srv`,
      [
        [`bob`, `bob-1`],
        [`srv`, `srv-1`],
      ],
      { label: `Bob sends`, labelAt: 0.4, ...e },
    ),
  });

const os = (e = {}) => ({
    sb: h(
      `srv`,
      `bob`,
      [
        [`srv`, `srv+1`],
        [`bob`, `bob+1`],
      ],
      e,
    ),
  });

const ss = { text: `new message from Bob`, tone: `violet`, icon: `message` };

const cs = (e, t, n) => S({ x: 13, y: -6, z: 0, dx: 40, dy: -205 }, e, t, { icon: n });

const ls = () => ({
    alice: es([ss]),
    srv: ns({ label: [`Server 1`], tags: [{ text: `Alice’s socket` }] }),
    bob: y(13, -8, { form: `phone`, w: 5, d: 5, label: `Bob` }),
    srv2: d(13, 6, { label: [`Server 2`], glyph: `message`, tags: [{ text: `Bob’s socket` }] }),
    br: d(0, 6, { color: `slab`, glyph: `radio`, label: [`Pub/Sub`], sub: `Redis` }),
  });

const us = {
    ...rs(),
    ...is(),
    b2: h(`bob`, `srv2`, [
      [`bob-1`, `bob`],
      [`srv2-1`, `srv2`],
    ]),
    x2b: h(`srv2`, `bob`, [
      [`srv2+1`, `srv2`],
      [`bob+1`, `bob`],
    ]),
    s2r: h(
      `srv2`,
      `br`,
      [
        [`srv2`, `srv2-1`],
        [`br`, `br-1`],
      ],
      { label: `publish “alice”`, labelAt: 0.55 },
    ),
    r2: h(`br`, `srv2`, [
      [`br`, `br+1`],
      [`srv2`, `srv2+1`],
    ]),
    rs: h(`br`, `srv`, [
      [`br+1`, `br`],
      [`srv+1`, `srv`],
    ]),
    sr: h(`srv`, `br`, [
      [`srv-1`, `srv`],
      [`br-1`, `br`],
    ]),
  };

const ds = [
    { route: [`b2`, `s2r`, `rs`, `sa`], kind: `msg`, rate: 0.55, speed: 1.2 },
    { route: [`ap`, `sr`, `r2`, `x2b`], kind: `msg`, rate: 0.4, speed: 1.2 },
  ];

const fs = {
    id: `realtime`,
    title: `Real-time Updates`,
    summary: `How the server tells you something happened — chat, live scores, notifications.`,
    minutes: 11,
    level: `beginner`,
    metrics: [`delay`, `rpm`, `wasted`, `conns`],
    legend: [`empty`, `req`, `res`, `msg`, [`ping`, `heartbeat`]],
    goals: [
      { text: `Why HTTP can’t push on its own`, step: 0 },
      { text: `Short polling vs long polling`, step: 3 },
      { text: `Server-Sent Events and WebSockets`, step: 5 },
      { text: `Scaling persistent connections`, step: 6 },
      { text: `Offline users and presence`, step: 7 },
    ],
    steps: [
      {
        short: `No way in`,
        chapter: `problem`,
        title: `Bob sent a message. How does Alice find out?`,
        body: [
          `Bob’s message reaches the chat server. Alice’s phone should show it instantly.`,
          `But plain HTTP is request → response: only the <b>client</b> can start a conversation. The server has no way to call Alice’s phone and say “you’ve got mail”.`,
        ],
        callout: {
          kind: `insight`,
          text: `Phones and browsers sit behind home routers and mobile networks that block incoming connections — the client has to reach out.`,
        },
        metrics: { delay: `never`, rpm: 0, wasted: `—`, conns: 0 },
        scene: {
          entities: {
            alice: es([{ text: `anything new?`, icon: `info` }]),
            srv: ns({
              tags: [{ text: `1 new message for Alice`, tone: `violet`, icon: `message` }],
            }),
            bob: ts(),
          },
          links: {
            ...as(),
            ...is({ style: `off`, label: `server can’t start a request`, labelTone: `gray` }),
          },
          flows: [{ route: [`bs`], kind: `msg`, rate: 0.5 }],
        },
      },
      {
        short: `Polling`,
        chapter: `technique`,
        title: `Polling: keep asking`,
        body: [
          `The simplest fix: Alice’s app asks “anything new?” every 2 seconds. Most answers are empty (pale dots); now and then one carries a message (green).`,
          `Easy to build with ordinary requests — but messages arrive up to 2 seconds late, and most requests are wasted.`,
        ],
        callout: {
          kind: `tip`,
          text: `Polling is fine for things that change slowly — a build status, an order tracking page — with a sensible interval.`,
        },
        changes: [`+ Alice polls every 2 s`],
        metrics: { delay: `up to 2 s`, rpm: 30, wasted: 95, conns: 0 },
        scene: {
          entities: { alice: es(), srv: ns(v(0.15)), bob: ts() },
          links: { ...rs({ heads: `both`, label: `GET /messages · every 2 s` }), ...as() },
          flows: [
            {
              route: [`ap`],
              rate: 0.9,
              bounce: !0,
              pattern: [`empty`, `empty`, `empty`, `empty`, `req`],
            },
            { route: [`bs`], kind: `msg`, rate: 0.25 },
          ],
        },
      },
      {
        short: `At scale`,
        chapter: `problem`,
        title: `Polling a million phones`,
        body: [
          `Now multiply. A million users each asking every 2 seconds is half a million requests per second — and 95% of them get the answer “nothing new”.`,
          `You’d be paying for a fleet of servers whose main job is saying no. Polling faster to cut the delay makes it worse.`,
        ],
        callout: {
          kind: `warn`,
          text: `Polling trades freshness against load: halve the delay, double the requests.`,
        },
        changes: [`~ Users 1 → 1,000,000`, `~ 500,000 requests/s, 95% empty`],
        metrics: { delay: `up to 2 s`, rpm: 30, wasted: 95, conns: 0 },
        scene: {
          entities: {
            alice: es([{ text: `one of 1,000,000`, icon: `users` }]),
            srv: ns({
              heat: 0.8,
              cpu: 0.94,
              tags: [{ text: `500,000 req/s · 95% empty`, tone: `red`, icon: `alert` }],
            }),
            bob: ts(),
            card: cs(
              `The bill`,
              [
                `1,000,000 users ÷ 2 s`,
                `= 500,000 requests / s`,
                `! ~475,000 of them: “nothing new”`,
              ],
              `activity`,
            ),
          },
          links: { ...rs({ heads: `both`, label: `GET /messages · every 2 s` }), ...as() },
          flows: [
            {
              route: [`ap`],
              rate: 2.2,
              bounce: !0,
              pattern: [`empty`, `empty`, `empty`, `empty`, `empty`, `empty`, `req`],
            },
            { route: [`bs`], kind: `msg`, rate: 0.25 },
          ],
        },
      },
      {
        short: `Long polling`,
        chapter: `solution`,
        title: `Long polling: hold the request open`,
        body: [
          `Instead of answering “nothing” immediately, the server <b>holds</b> the request open (watch the request wait at the server) until a message arrives, or about 30 seconds pass. Then it responds, and the app immediately asks again.`,
          `Messages now arrive almost instantly, and empty answers are rare.`,
        ],
        callout: {
          kind: `tip`,
          text: `Long polling works anywhere plain HTTP works, so it’s still used as a fallback when nothing better is available.`,
        },
        changes: [
          `~ Server holds each request until there’s news`,
          `~ Delay up to 2 s → under 100 ms`,
          `~ Empty responses 95% → 10%`,
        ],
        metrics: { delay: `< 100 ms`, rpm: 2, wasted: 10, conns: `1 held / user` },
        scene: {
          entities: {
            alice: es(),
            srv: ns({ ...v(0.2), tags: [{ text: `holding until news`, icon: `hourglass` }] }),
            bob: ts(),
          },
          links: { ...rs({ heads: `both`, label: `GET /messages · held open` }), ...as() },
          flows: [
            { route: [`ap`], rate: 0.42, bounce: !0, hold: 1.7 },
            { route: [`bs`], kind: `msg`, rate: 0.42 },
          ],
        },
      },
      {
        short: `SSE`,
        chapter: `technique`,
        title: `Server-Sent Events: one response that never ends`,
        body: [
          `With <span class="term">Server-Sent Events</span> (SSE), the app makes one request and the server never finishes the response. Instead, it writes each new event down that open stream as it happens.`,
          `It’s one-way (server → client), plain HTTP, and browsers reconnect automatically. Alice still sends her own messages with normal requests.`,
        ],
        callout: {
          kind: `tip`,
          text: `Ideal for feeds, notifications, live scores and dashboards — and for streaming AI responses token by token.`,
        },
        changes: [`+ One long-lived event stream to Alice`, `~ Delay → under 50 ms`],
        metrics: { delay: `< 50 ms`, rpm: 0, wasted: 0, conns: `1 per user` },
        scene: {
          entities: { alice: es([ss]), srv: ns(v(0.15)), bob: ts() },
          links: {
            ...rs({ heads: `both` }),
            ...is({ label: `event stream (SSE)`, labelAt: 0.3 }),
            ...as(),
          },
          flows: [
            { route: [`bs`, `sa`], kind: `msg`, rate: 0.6 },
            { route: [`ap`], rate: 0.25, bounce: !0 },
          ],
        },
      },
      {
        short: `WebSockets`,
        chapter: `technique`,
        title: `WebSockets: talk both ways`,
        body: [
          `A <span class="term">WebSocket</span> starts as an HTTP request, then upgrades into a permanent two-way connection. Either side can send a message at any moment, with tiny overhead per message.`,
          `Bob and Alice each hold one socket; messages flow both ways through the server in a few milliseconds.`,
        ],
        callout: {
          kind: `tip`,
          text: `Use WebSockets when the client talks back often: chat, multiplayer games, collaborative editing, trading screens.`,
        },
        changes: [
          `+ Persistent two-way connections`,
          `~ Sending no longer needs separate requests`,
        ],
        metrics: { delay: `< 20 ms`, rpm: 0, wasted: 0, conns: `1 per user` },
        scene: {
          entities: { alice: es([ss]), srv: ns(v(0.15)), bob: ts() },
          links: {
            ...rs({ label: `WebSocket · both ways` }),
            ...is(),
            ...as({ label: `WebSocket` }),
            ...os(),
          },
          flows: [
            { route: [`bs`, `sa`], kind: `msg`, rate: 0.6 },
            { route: [`ap`, `sb`], kind: `msg`, rate: 0.45 },
          ],
        },
      },
      {
        short: `Many servers`,
        chapter: `insight`,
        title: `Scaling: which server has Alice?`,
        body: [
          `Each open connection costs memory, so a million users need many chat servers. Now Bob’s socket is on server 2, but Alice’s is on server 1 — server 2 can’t deliver to her directly.`,
          `So servers relay through <span class="term">pub/sub</span>: server 2 publishes to Alice’s channel, and whichever server holds her socket is subscribed and forwards it. Watch a message take the long way round.`,
        ],
        callout: {
          kind: `insight`,
          text: `This is the previous lesson again — pub/sub is how real-time systems fan messages out across servers.`,
        },
        changes: [
          `+ Server 2`,
          `+ Pub/sub between servers`,
          `~ Messages relayed to the server holding each socket`,
        ],
        metrics: { delay: `< 30 ms`, rpm: 0, wasted: 0, conns: `1M on 20 servers` },
        scene: { entities: { ...ls() }, links: us, flows: ds },
      },
      {
        short: `Offline`,
        chapter: `problem`,
        title: `Case: Alice’s phone is offline`,
        body: [
          `Alice goes into the subway. Her socket drops, and Bob’s messages have nowhere to go.`,
          `So every message is first <b>saved</b> to a store, then pushed if the recipient is connected. When Alice reconnects, her app says “I last saw message 1041” and fetches everything after it. If she stays offline, a mobile <b>push notification</b> (APNs, FCM) wakes her phone.`,
        ],
        callout: {
          kind: `tip`,
          text: `Real-time delivery is an optimisation. The stored message, fetched on reconnect, is the source of truth.`,
        },
        changes: [
          `− Alice offline`,
          `+ Messages stored first`,
          `+ Catch up on reconnect · push notification`,
        ],
        metrics: { delay: `< 30 ms`, rpm: 0, wasted: 0, conns: `1M on 20 servers` },
        scene: {
          entities: {
            ...ls(),
            alice: es([{ text: `offline · subway`, tone: `gray`, icon: `unplug` }]),
            srv: ns({
              label: [`Server 1`],
              tags: [{ text: `no socket for Alice`, tone: `amber` }],
            }),
            ms: b(-13, 6, {
              r: 1.6,
              h: 34,
              glyph: `message`,
              label: `messages`,
              tags: [{ text: `saved: 1042, 1043`, tone: `violet` }],
            }),
          },
          links: {
            ...us,
            sa: h(
              `srv`,
              `alice`,
              [
                [`srv+1`, `srv`],
                [`alice+1`, `alice`],
              ],
              { style: `off`, fail: 1 },
            ),
            ms: h(`br`, `ms`, [`br`, `ms`], { label: `store first` }),
          },
          flows: [{ route: [`b2`, `s2r`, `ms`], kind: `msg`, rate: 0.6, speed: 1.2 }],
        },
      },
      {
        short: `Presence`,
        chapter: `technique`,
        title: `Presence: who’s online`,
        body: [
          `The green dot next to a name needs <span class="term">presence</span>: each app sends a small heartbeat every 30 seconds, and the server records “last seen”. No heartbeat for a minute means offline.`,
          `With a million users that’s ~33,000 heartbeats a second. Keep presence in a fast store with expiring keys, and only push changes to people who are actually looking at that contact.`,
        ],
        callout: {
          kind: `insight`,
          text: `Presence is approximate by design — a few seconds of delay is fine, and it saves enormous traffic.`,
        },
        changes: [`+ Heartbeats every 30 s`, `+ Presence store with expiring keys`],
        metrics: { delay: `< 30 ms`, rpm: 2, wasted: 0, conns: `1M on 20 servers` },
        scene: {
          entities: {
            ...ls(),
            alice: es([{ text: `online`, tone: `green`, icon: `signal` }]),
            ps: b(-13, 6, {
              r: 1.6,
              h: 34,
              glyph: `zap`,
              label: `presence`,
              tags: [{ text: `alice · seen 4 s ago`, tone: `green` }],
            }),
          },
          links: {
            ...us,
            ps: h(`srv`, `ps`, [`srv`, [`ps`, `srv`], `ps`], { label: `heartbeat`, labelAt: 0.6 }),
          },
          flows: [...ds, { route: [`ap`, `ps`], kind: `ping`, rate: 0.7 }],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<table class="compare">
          <thead><tr><th></th><th>Delay</th><th>Direction</th></tr></thead>
          <tbody>
            <tr><td><b>Polling</b></td><td>Up to the interval</td><td>Client asks</td></tr>
            <tr><td><b>Long polling</b></td><td>Low</td><td>Client asks, server waits</td></tr>
            <tr><td><b>SSE</b></td><td>Low</td><td>Server → client</td></tr>
            <tr><td><b>WebSocket</b></td><td>Lowest</td><td>Both ways</td></tr>
          </tbody>
        </table>`,
          `Persistent connections need many servers at scale, joined by <b>pub/sub</b>. <b>Store</b> every message first, so offline users catch up when they return.`,
        ],
        callout: {
          kind: `next`,
          text: `That completes Communication. Next module: <b>Reliability</b> — starting with redundancy and failover.`,
        },
        metrics: { delay: `< 30 ms`, rpm: 0, wasted: 0, conns: `1M on 20 servers` },
        scene: { entities: { ...ls() }, links: us, flows: ds },
      },
    ],
  };

export { fs as realtimeLesson };
export default fs;
