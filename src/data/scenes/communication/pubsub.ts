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

const Bo = { x0: -4.5, x1: 4.5, y0: -21, y1: -15 };

const Vo = {
    em: { x: -12, color: `blue`, glyph: `mail`, label: [`Email`] },
    inv: { x: -4, color: `yellow`, glyph: `package`, label: [`Inventory`] },
    an: { x: 4, color: `purple`, glyph: `chart`, label: [`Analytics`] },
    loy: { x: 12, color: `green`, glyph: `gift`, label: [`Loyalty`] },
  };

const Ho = Object.keys(Vo);

const Uo = () => p(Bo, 11, `shoppers`);

const Wo = (e = {}) => d(0, -9, { color: `orange`, glyph: `cart`, label: [`Order`, `Service`], ...e });

const Go = (e = {}) =>
    d(0, -0.5, {
      color: `slab`,
      glyph: `radio`,
      label: [`Event`, `Bus`],
      sub: `topic: orders`,
      ...e,
    });

const Ko = (e = {}) =>
    Object.fromEntries(Ho.map((t) => [t, d(Vo[t].x, 8, { ...Vo[t], ...(e[t] || {}) })]));

const qo = () => ({ fr: d(0, 16, { color: `blue`, glyph: `shield`, label: [`Fraud`, `Check`] }) });

const Jo = (e = {}) => ({ uo: h(`shoppers`, `order`, [`shoppers`, `order`], { heads: `both`, ...e }) });

const Yo = (e = {}) =>
    Object.fromEntries(
      Ho.map((t) => [
        `d${t}`,
        h(`order`, t, [`order`, [t, `order`], t], { heads: `both`, ...(e[t] || {}) }),
      ]),
    );

const Xo = (e = Ho) => ({
    ob: h(`order`, `bus`, [`order`, `bus`], { label: `OrderPlaced` }),
    ...Object.fromEntries(e.map((e) => [`b${e}`, h(`bus`, e, [`bus`, [e, `bus`], e])])),
  });

const Zo = (e = Ho, t = 0.8) => ({
    fanout: !0,
    routes: e.map((e) => ({ path: [`ob`, `b${e}`] })),
    kind: `msg`,
    rate: t,
  });

const Qo = (e, t, n) => S({ x: 12, y: 8, z: 0, dx: 60, dy: -260 }, e, t, { icon: n });

const $o = {
    id: `pubsub`,
    title: `Pub/Sub & Events`,
    summary: `Announce that something happened, and let whoever cares react — without anyone waiting.`,
    minutes: 10,
    level: `beginner`,
    metrics: [`checkout`, `knows`, `breaks`, `subs`],
    legend: [`req`, `res`, [`msg`, `event`], `fail`],
    goals: [
      { text: `Why direct calls couple services together`, step: 1 },
      { text: `Publishers, topics and subscribers`, step: 2 },
      { text: `Queues vs topics`, step: 3 },
      { text: `The costs of event-driven design`, step: 6 },
      { text: `The outbox pattern and replaying events`, step: 7 },
    ],
    steps: [
      {
        short: `Call everyone`,
        chapter: `problem`,
        title: `Checkout calls everyone`,
        body: [
          `When an order is placed, four other things must happen: send a confirmation email, reserve stock, record analytics, add loyalty points.`,
          `The order service calls each of them in turn and waits for every answer, so the shopper waits for all four — almost a second.`,
        ],
        callout: {
          kind: `warn`,
          text: `Every new feature that cares about orders means changing, testing and redeploying the order service.`,
        },
        metrics: { checkout: 920, knows: `4 services`, breaks: `—`, subs: `—` },
        scene: {
          entities: {
            shoppers: Uo(),
            order: Wo({ tags: [{ text: `waits for 4 calls`, tone: `amber`, icon: `hourglass` }] }),
            ...Ko(),
            card: Qo(
              `Checkout time`,
              [
                `save the order          120 ms`,
                `+ 4 calls × ~200 ms     800 ms`,
                `= ~920 ms before “thank you”`,
              ],
              `timer`,
            ),
          },
          links: { ...Jo(), ...Yo() },
          flows: [
            { route: [`uo`], rate: 1, bounce: !0, speed: 0.5 },
            { routes: Ho.map((e) => ({ path: [`d${e}`] })), rate: 2.4, bounce: !0 },
          ],
        },
      },
      {
        short: `Email down`,
        chapter: `problem`,
        title: `Email is down, so nobody can buy`,
        body: [
          `The email provider has an outage. The order service’s call to it fails — and because checkout waits on every call, <b>checkout fails</b>.`,
          `A confirmation email, which could easily have been sent ten minutes later, just stopped all sales.`,
        ],
        callout: {
          kind: `warn`,
          text: `With direct calls, availability multiplies: four services at 99.9% each give checkout about 99.6%.`,
        },
        changes: [`− Email service down`, `− Checkouts failing`],
        metrics: { checkout: 920, knows: `4 services`, breaks: `yes`, subs: `—` },
        scene: {
          entities: {
            shoppers: Uo(),
            order: Wo({ tags: [{ text: `checkout failed`, tone: `red`, icon: `alert` }] }),
            ...Ko({ em: g }),
          },
          links: { ...Jo({ fail: 0.3 }), ...Yo({ em: { fail: 1 } }) },
          flows: [
            { route: [`uo`], rate: 1.4, bounce: !0, speed: 0.5 },
            { routes: Ho.map((e) => ({ path: [`d${e}`] })), rate: 2.4, bounce: !0 },
          ],
        },
      },
      {
        short: `Publish`,
        chapter: `solution`,
        title: `Publish an event instead`,
        body: [
          `The order service now saves the order and <b>publishes</b> one event — <code>OrderPlaced</code> — to a topic on an <span class="term">event bus</span>, then answers the shopper straight away.`,
          `Email, inventory, analytics and loyalty each <b>subscribe</b> to the topic, and every one of them receives its own copy of the event.`,
        ],
        callout: {
          kind: `tip`,
          text: `Common brokers: Kafka, Amazon SNS + SQS, Google Pub/Sub, RabbitMQ (fanout exchanges), Redis Streams.`,
        },
        changes: [
          `+ Event bus · topic “orders”`,
          `~ 4 direct calls → 1 published event`,
          `~ Checkout 920 → 140 ms`,
        ],
        metrics: { checkout: 140, knows: `1 event bus`, breaks: `no`, subs: 4 },
        scene: {
          entities: { shoppers: Uo(), order: Wo(), bus: Go(), ...Ko() },
          links: { ...Jo(), ...Xo() },
          flows: [{ route: [`uo`], rate: 1.6, bounce: !0 }, Zo()],
        },
      },
      {
        short: `Queue vs topic`,
        chapter: `insight`,
        title: `Queue or topic?`,
        body: [
          `In the last lesson, each job went to <b>one</b> worker — a queue shares out work. A topic does the opposite: each event goes to <b>every</b> subscriber — it spreads news.`,
          `Real systems combine them: each subscribing service gets its own queue of events, shared by however many instances of that service are running.`,
        ],
        callout: { kind: `insight`, text: `Queue: “someone do this.” Topic: “this happened.”` },
        metrics: { checkout: 140, knows: `1 event bus`, breaks: `no`, subs: 4 },
        scene: {
          entities: {
            shoppers: Uo(),
            order: Wo(),
            bus: Go(),
            ...Ko(),
            card: Qo(
              `Queue vs topic`,
              [
                `queue → each message to ONE consumer`,
                `        share out work`,
                `topic → each message to EVERY subscriber`,
                `        broadcast what happened`,
              ],
              `split`,
            ),
          },
          links: { ...Jo(), ...Xo() },
          flows: [{ route: [`uo`], rate: 1.6, bounce: !0 }, Zo()],
        },
      },
      {
        short: `New subscriber`,
        chapter: `solution`,
        title: `New features just subscribe`,
        body: [
          `The risk team wants to check every order for fraud. They build a service that subscribes to <code>OrderPlaced</code> — and that’s it.`,
          `The order service didn’t change, wasn’t redeployed, and doesn’t even know fraud checking exists. This is <span class="term">loose coupling</span>.`,
        ],
        callout: {
          kind: `tip`,
          text: `Publishers don’t know their subscribers. Teams can add reactions to events without coordinating releases.`,
        },
        changes: [`+ Fraud check subscribes`, `~ Order service: no changes`],
        metrics: { checkout: 140, knows: `1 event bus`, breaks: `no`, subs: 5 },
        scene: {
          entities: { shoppers: Uo(), order: Wo(), bus: Go(), ...Ko(), ...qo() },
          links: { ...Jo(), ...Xo([...Ho, `fr`]) },
          flows: [{ route: [`uo`], rate: 1.6, bounce: !0 }, Zo([...Ho, `fr`])],
        },
      },
      {
        short: `Catch up`,
        chapter: `insight`,
        title: `A subscriber is down? It catches up`,
        body: [
          `Email is down again. This time checkout doesn’t notice: the event bus keeps email’s copies of the events in its subscription until it’s back.`,
          `When email recovers, it works through the backlog and every confirmation goes out — a little late, but none lost.`,
        ],
        callout: {
          kind: `insight`,
          text: `Events are durable: a slow or broken subscriber delays only itself.`,
        },
        changes: [
          `− Email service down`,
          `+ Its events wait in its subscription`,
          `~ Checkout unaffected`,
        ],
        metrics: { checkout: 140, knows: `1 event bus`, breaks: `no`, subs: 5 },
        scene: {
          entities: {
            shoppers: Uo(),
            order: Wo(),
            bus: Go(),
            ...Ko({
              em: { ...g, tags: [{ text: `down · 4 events waiting`, tone: `red`, icon: `alert` }] },
            }),
            ...qo(),
            wait: ee(-12, 4.8, 4, [0, -1]),
          },
          links: { ...Jo(), ...Xo([...Ho, `fr`]) },
          flows: [{ route: [`uo`], rate: 1.6, bounce: !0 }, Zo([`inv`, `an`, `loy`, `fr`])],
        },
      },
      {
        short: `Trade-offs`,
        chapter: `tradeoff`,
        title: `What events cost`,
        body: [
          `Events decouple services, but the flow becomes harder to see: “what happens when an order is placed?” is now spread across five codebases.`,
          `Subscribers act a little later (eventual consistency), events can arrive twice or out of order, and debugging needs good tracing.`,
        ],
        callout: {
          kind: `tip`,
          text: `Name events as facts in the past tense (OrderPlaced, PaymentFailed), and make every subscriber idempotent.`,
        },
        metrics: { checkout: 140, knows: `1 event bus`, breaks: `no`, subs: 5 },
        scene: {
          entities: {
            shoppers: Uo(),
            order: Wo(),
            bus: Go(),
            ...Ko(),
            ...qo(),
            card: Qo(
              `Events: the fine print`,
              [
                `who reacts to OrderPlaced? check 5 repos`,
                `subscribers act a little later`,
                `duplicates & reordering happen`,
                `= idempotent subscribers + tracing`,
              ],
              `info`,
            ),
          },
          links: { ...Jo(), ...Xo([...Ho, `fr`]) },
          flows: [{ route: [`uo`], rate: 1.6, bounce: !0 }, Zo([...Ho, `fr`])],
        },
      },
      {
        short: `Outbox`,
        chapter: `problem`,
        title: `Case: saved, but never announced`,
        body: [
          `The order service saves the order to its database, then publishes <code>OrderPlaced</code>. One day it crashes between those two steps: the order exists, but no event was sent. No email, no stock reserved, no loyalty points.`,
          `Fix: the <span class="term">transactional outbox</span>. Write the event into an <code>outbox</code> table in the <em>same</em> database transaction as the order; a relay then publishes everything in the outbox to the bus.`,
        ],
        callout: {
          kind: `tip`,
          text: `Either both the order and its event are saved, or neither is. The relay retries until the bus accepts it — so subscribers must handle duplicates. It can poll the table, or tail the database’s own log (<b>change data capture</b>, e.g. Debezium).`,
        },
        changes: [
          `+ Orders DB with an outbox table`,
          `+ Relay publishes from the outbox`,
          `~ No more lost events after a crash`,
        ],
        metrics: { checkout: 145, knows: `1 event bus`, breaks: `no`, subs: 5 },
        scene: {
          entities: {
            shoppers: Uo(),
            order: Wo(),
            odb: b(-11, -9, { r: 1.6, h: 34, glyph: `database`, label: `orders + outbox` }),
            bus: Go(),
            ...Ko(),
            ...qo(),
          },
          links: {
            ...Jo(),
            od: h(`order`, `odb`, [`order`, `odb`], {
              heads: `both`,
              label: `one transaction`,
              labelAt: 0.5,
            }),
            ob: h(`odb`, `bus`, [`odb`, [`odb`, `bus`], `bus`], { label: `relay`, labelAt: 0.75 }),
            ...Object.fromEntries(
              [...Ho, `fr`].map((e) => [`b${e}`, h(`bus`, e, [`bus`, [e, `bus`], e])]),
            ),
          },
          flows: [
            { route: [`uo`, `od`], rate: 1.4, bounce: !0 },
            {
              fanout: !0,
              routes: [...Ho, `fr`].map((e) => ({ path: [`ob`, `b${e}`] })),
              kind: `msg`,
              rate: 0.8,
            },
          ],
        },
      },
      {
        short: `Replay`,
        chapter: `insight`,
        title: `Case: replaying history`,
        body: [
          `Analytics finds a bug that miscounted revenue for the last 30 days. With a classic queue, those events are gone once consumed.`,
          `A log-based bus like Kafka <b>keeps</b> events for days or weeks. Analytics fixes its code, rewinds its position to 30 days ago, and reprocesses every event — other subscribers aren’t affected.`,
        ],
        callout: {
          kind: `tip`,
          text: `Retained events also let a brand-new subscriber build its data from history instead of starting empty.`,
        },
        changes: [`+ Bus retains 30 days of events`, `~ Analytics rewinds and reprocesses`],
        metrics: { checkout: 140, knows: `1 event bus`, breaks: `no`, subs: 5 },
        scene: {
          entities: {
            shoppers: Uo(),
            order: Wo(),
            bus: Go({ tags: [{ text: `retains 30 days`, icon: `clock` }] }),
            ...Ko({
              an: { tags: [{ text: `rewound to 30 days ago`, tone: `violet`, icon: `replay` }] },
            }),
          },
          links: { ...Jo(), ...Xo() },
          flows: [
            { route: [`uo`], rate: 1.6, bounce: !0 },
            Zo(Ho, 0.6),
            { route: [`ban`], kind: `msg`, rate: 3.2, speed: 1.4 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Direct calls make the caller <b>slow</b> and <b>fragile</b>, and couple every team to it.</li>
          <li><b>Publish</b> an event; every <b>subscriber</b> gets its own copy.</li>
          <li>New features <b>just subscribe</b>; down subscribers <b>catch up</b> later.</li>
          <li>Pay for it with eventual consistency, duplicates and harder tracing.</li>
          <li>Use an <b>outbox</b> so saves and events never disagree; retained logs allow <b>replay</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Real-time Updates</b> — getting events all the way to a user’s screen.`,
        },
        metrics: { checkout: 140, knows: `1 event bus`, breaks: `no`, subs: 5 },
        scene: {
          entities: { shoppers: Uo(), order: Wo(), bus: Go(), ...Ko(), ...qo() },
          links: { ...Jo(), ...Xo([...Ho, `fr`]) },
          flows: [{ route: [`uo`], rate: 1.6, bounce: !0 }, Zo([...Ho, `fr`])],
        },
      },
    ],
  };

export { $o as pubsubLesson };
export default $o;
