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
} from '../../scene-builders';

const Fd = (e, t, n, r = [], i = {}) => y(e, t, { form: `phone`, w: 5, d: 5, label: n, tags: r, ...i });

const Id = (e = []) => Fd(-9, -14, `Alice`, e);

const Ld = (e = [], t = {}) => Fd(9, -14, `Bob`, e, t);

const Rd = () => Fd(18, -4, `Cara`);

const zd = (e = [], t = {}) => d(0, -4, { label: [`Chat`, `Service`], tags: e, ...t });

const Bd = (e = []) =>
    d(-9, -4, { s: 3.6, h: 38, color: `orange`, glyph: `network`, label: [`Gateway 1`], tags: e });

const Vd = (e = [], t = {}) =>
    d(9, -4, {
      s: 3.6,
      h: 38,
      color: `orange`,
      glyph: `network`,
      label: [`Gateway 2`],
      tags: e,
      ...t,
    });

const Hd = (e = []) =>
    d(0, -14, {
      s: 3.4,
      h: 30,
      color: `green`,
      glyph: `signpost`,
      label: [`Sessions`],
      pills: `below`,
      tags: e,
    });

const Ud = (e = []) => b(-9, 7, { r: 1.8, glyph: `database`, label: `message store`, tags: e });

const Wd = () =>
    d(9, 7, { s: 3.4, h: 32, color: `yellow`, glyph: `bell`, label: [`Push`], sub: `APNs / FCM` });

const q = {
    a1: (e = {}) => h(`alice`, `g1`, [`alice`, `g1`], { heads: `both`, ...e }),
    gc: (e = {}) => h(`g1`, `chat`, [`g1`, `chat`], { heads: `both`, ...e }),
    cg: (e = {}) => h(`chat`, `g2`, [`chat`, `g2`], { heads: `both`, ...e }),
    b2: (e = {}) => h(`g2`, `bob`, [`g2`, `bob`], { heads: `both`, ...e }),
    cr: (e = {}) => h(`chat`, `reg`, [`chat`, `reg`], { heads: `both`, ...e }),
    cs: (e = {}) => h(`chat`, `store`, [`chat`, [`chat`, `store`], `store`], e),
    cp: (e = {}) => h(`chat`, `notifier`, [`chat`, [`chat`, `notifier`], `notifier`], e),
    pb: (e = {}) => h(`notifier`, `bob`, [`notifier`, [13.5, `notifier`], [13.5, `bob`], `bob`], e),
    c2: (e = {}) => h(`g2`, `cara`, [`g2`, `cara`], { heads: `both`, ...e }),
  };

const Gd = (e = {}) => ({ a1: q.a1(), gc: q.gc(), cg: q.cg(), b2: q.b2(), ...e });

const Kd = [`a1`, `gc`];

const qd = [`cg`, `b2`];

const Jd = (e = 0.9, t = {}) => ({ route: [...Kd, ...qd], kind: `msg`, rate: e, bounce: !0, ...t });

const Yd = (e = 0.9) => ({ route: [`cr`], rate: e, bounce: !0 });

const Xd = (e = 0.9) => ({ route: [`cs`], kind: `write`, rate: e });

const Zd = (e = 0.5) => [{ route: [`a1`], kind: `ping`, rate: e }];

const Qd = { x: -9, y: 7, dx: 120, dy: -120 };

const $d = (e, t, n, r = Qd) => S({ z: 0, ...r }, e, t, { icon: n });

const ef = { deliverMs: 110, conns: `20 M · 100 gateways`, canLoseMsg: `no`, ordered: `yes` };

const tf = {
    id: `design-chat`,
    title: `Design a Chat System`,
    summary: `Twenty million open connections, and a promise: every message arrives, in order, exactly once.`,
    minutes: 14,
    level: `advanced`,
    metrics: [`deliverMs`, `conns`, `canLoseMsg`, `ordered`],
    legend: [
      [`msg`, `message`],
      [`write`, `store write`],
      [`req`, `lookup`],
      [`push`, `push notification`],
      [`ping`, `heartbeat`],
      `fail`,
    ],
    goals: [
      { text: `Size connections as well as messages`, step: 1 },
      { text: `Route between stateful gateways`, step: 4 },
      { text: `Store first: durability and ordering`, step: 5 },
      { text: `Offline delivery, sync and duplicates`, step: 7 },
      { text: `Groups, presence and a gateway failure`, step: 10 },
    ],
    steps: [
      {
        short: `The brief`,
        chapter: `setup`,
        title: `The brief: a chat app`,
        body: [
          `Third design: one-to-one and small-group chat, like WhatsApp or Messenger. Messages arrive instantly when the other person is online, wait for them when they aren’t, and show up on all of their devices.`,
          `What matters most is trust: <b>no message may be lost</b>, messages must appear <b>in order</b>, and each one exactly once. Speed matters too — under 200 ms when both people are online — but never at the cost of those three.`,
        ],
        callout: {
          kind: `insight`,
          text: `Compare the last design. The feed could be late and approximate; chat has to be complete and ordered. Same building blocks, opposite priorities.`,
        },
        metrics: { deliverMs: null, conns: `—`, canLoseMsg: `—`, ordered: `—` },
        scene: {
          entities: {
            alice: Id(),
            bob: Ld(),
            chat: zd([], { sub: `to be designed` }),
            card: $d(
              `Requirements`,
              [
                `send      to a person or a group`,
                `receive   at once if online, later if not`,
                `= never lost · in order · shown once`,
                `# under 200 ms when both are online`,
              ],
              `clipboard`,
              { x: 0, y: -4, dx: 60, dy: -215 },
            ),
          },
          links: {},
          flows: [],
        },
      },
      {
        short: `Numbers`,
        chapter: `setup`,
        title: `Put numbers on it`,
        body: [
          `<b>50 million</b> people use it each day and send 40 messages each: 2 billion messages a day, about 23,000 a second — several times that at peak. Messages are small (≈ 200 bytes), but that is still 400 GB a day, around 150 TB a year.`,
          `The unusual number is <b>connections</b>. Chat is pushed, not polled, so every online user holds a connection open. At peak that’s 20 million of them.`,
        ],
        callout: {
          kind: `tip`,
          text: `One well-tuned server can hold a few hundred thousand mostly-idle connections. Twenty million means about a hundred servers that do nothing but hold sockets.`,
        },
        changes: [`+ 23,000 messages/s · 400 GB/day`, `+ 20 M connections open at peak`],
        metrics: { deliverMs: null, conns: `20 M at peak`, canLoseMsg: `—`, ordered: `—` },
        scene: {
          entities: {
            alice: Id(),
            bob: Ld(),
            chat: zd([], { sub: `to be designed` }),
            card: $d(
              `Napkin math`,
              [
                `50 M users × 40 messages  ≈ 23,000 / s`,
                `× 200 bytes               ≈ 400 GB / day`,
                `20 M connected at peak`,
                `= ÷ 200 k per server ≈ 100 gateways`,
              ],
              `sigma`,
              { x: 0, y: -4, dx: 60, dy: -215 },
            ),
          },
          links: {},
          flows: [],
        },
      },
      {
        short: `One server`,
        chapter: `solution`,
        title: `First draft: one server, two sockets`,
        body: [
          `From <em>Real-time Updates</em>: polling wastes requests and adds delay, so each phone opens a <span class="term">WebSocket</span> — one long-lived connection that the server can push down at any moment.`,
          `With a single server the rest is trivial. Alice and Bob are both connected to it; when Alice’s message arrives, the server finds Bob’s socket in its own memory and writes to it.`,
        ],
        callout: {
          kind: `insight`,
          text: `Unlike everything in <em>Stateless Services</em>, this server is <b>stateful</b>: Bob’s connection lives on one particular machine. That single fact shapes the rest of the design.`,
        },
        changes: [`+ Chat server`, `+ One WebSocket per device`],
        metrics: { deliverMs: 80, conns: `2 · one server`, canLoseMsg: `yes`, ordered: `no` },
        scene: {
          entities: {
            alice: Id(),
            bob: Ld(),
            chat: zd([{ text: `sockets: alice, bob`, icon: `network` }], {
              label: [`Chat`, `Server`],
            }),
          },
          links: {
            wa: h(`alice`, `chat`, [`alice`, [`alice`, `chat`], `chat`], {
              heads: `both`,
              label: `WebSocket`,
              labelAt: 0.3,
            }),
            wb: h(`chat`, `bob`, [`chat`, [`bob`, `chat`], `bob`], {
              heads: `both`,
              label: `WebSocket`,
              labelAt: 0.7,
            }),
          },
          flows: [{ route: [`wa`, `wb`], kind: `msg`, rate: 0.9, bounce: !0 }],
        },
      },
      {
        short: `Where is Bob?`,
        chapter: `problem`,
        title: `A hundred servers: where is Bob?`,
        body: [
          `Twenty million sockets need about a hundred servers. Split the roles: <b>gateways</b> do nothing but hold connections, and a stateless <b>chat service</b> behind them holds the logic.`,
          `Now Alice is connected to gateway 1 and Bob to gateway 2. Alice’s message reaches the chat service — which has no idea which of a hundred gateways is holding Bob’s socket.`,
        ],
        callout: {
          kind: `tip`,
          text: `Keep gateways dumb. Logic changes every day; if it lives behind the gateways you can deploy it without dropping twenty million connections.`,
        },
        changes: [
          `+ Gateways that only hold sockets`,
          `~ Chat logic → a stateless service`,
          `− The chat service can’t find Bob`,
        ],
        metrics: {
          deliverMs: null,
          conns: `20 M · 100 gateways`,
          canLoseMsg: `yes`,
          ordered: `no`,
        },
        scene: {
          entities: {
            alice: Id(),
            bob: Ld(),
            chat: zd([{ text: `which gateway has Bob?`, tone: `amber`, icon: `search` }]),
            g1: Bd(),
            g2: Vd(),
          },
          links: Gd({ cg: q.cg({ fail: 1, style: `dashed` }) }),
          flows: [{ route: [...Kd, `cg`], kind: `msg`, rate: 0.9 }],
        },
      },
      {
        short: `Registry`,
        chapter: `solution`,
        title: `A registry of who is connected where`,
        body: [
          `When a device connects, its gateway writes an entry into a fast in-memory store: <code>bob → gateway 2</code>, with a short TTL that heartbeats keep refreshing. The chat service looks Bob up and hands the message to the right gateway, which writes it to his socket.`,
          `It’s <em>Service Discovery</em> again, at the scale of individual users: a registry kept honest by heartbeats.`,
        ],
        callout: {
          kind: `tip`,
          text: `If an entry is missing or stale, nothing breaks: Bob is treated as offline and gets the message when he next connects. Which means it needs somewhere to wait…`,
        },
        changes: [
          `+ Session registry: user → gateway`,
          `+ Heartbeats keep entries fresh`,
          `~ Messages are routed to the right gateway`,
        ],
        metrics: { deliverMs: 90, conns: `20 M · 100 gateways`, canLoseMsg: `yes`, ordered: `no` },
        scene: {
          entities: {
            alice: Id(),
            bob: Ld(),
            chat: zd(),
            g1: Bd(),
            g2: Vd(),
            reg: Hd([{ text: `bob → gateway 2`, tone: `green`, icon: `clock` }]),
          },
          links: Gd({ cr: q.cr() }),
          flows: [Jd(), Yd(), ...Zd()],
        },
      },
      {
        short: `Store first`,
        chapter: `solution`,
        title: `Write it down before you pass it on`,
        body: [
          `So far a message exists only in memory while it travels. If a server crashes mid-delivery, it’s gone. The rule: <b>store first, then deliver</b>. The chat service writes each message to a durable store, and only then tells Alice “sent ✓”.`,
          `In the same step it stamps the message with the conversation’s next <b>sequence number</b>. Order is decided once, by the server — never by the phones’ clocks, which disagree (see <em>CAP & Consistency</em>).`,
        ],
        callout: {
          kind: `tip`,
          text: `The store is write-heavy and always read the same way — “the latest messages of conversation X”. Partition by conversation id, sort by sequence: a wide-column store such as Cassandra or HBase — both LSM engines, see <em>Storage Engines</em> — fits well.`,
        },
        changes: [
          `+ Message store, partitioned by conversation`,
          `+ A sequence number per conversation`,
          `~ “Sent ✓” only after the write succeeds`,
        ],
        metrics: ef,
        scene: {
          entities: {
            alice: Id(),
            bob: Ld(),
            chat: zd([{ text: `conv 88 · next seq 43`, icon: `listOrdered` }]),
            g1: Bd(),
            g2: Vd(),
            reg: Hd(),
            store: Ud(),
            card: $d(
              `One row per message`,
              [
                `partition key   conversation_id`,
                `sort key        seq   41, 42, 43 …`,
                `message_id · sender · body · sent_at`,
                `= “latest 50 of conv 88” is one range read`,
              ],
              `database`,
              { x: 9, y: -4, dx: 70, dy: 50 },
            ),
          },
          links: Gd({ cr: q.cr(), cs: q.cs({ label: `1 · store`, labelAt: 0.7 }) }),
          flows: [Jd(), Yd(), Xd()],
        },
      },
      {
        short: `Offline`,
        chapter: `problem`,
        title: `Case: Bob is in a tunnel`,
        body: [
          `Bob’s phone loses signal. His registry entry expires, so the chat service knows not to try. The message is already safe in the store, and a <b>push notification</b> goes out through Apple’s or Google’s service to wake his phone.`,
          `When Bob reconnects, his app says “I have conversation 88 up to #41”, and the server replies with everything after it. This <b>sync by cursor</b> is one mechanism for a five-second gap, a week offline, or a brand-new device.`,
        ],
        callout: {
          kind: `insight`,
          text: `Live delivery is an optimisation. The real protocol is “store, then sync” — the open socket only makes the sync happen sooner.`,
        },
        changes: [
          `− Bob offline · registry entry expired`,
          `+ Push notification through APNs / FCM`,
          `+ On reconnect: “send me everything after #41”`,
        ],
        metrics: ef,
        scene: {
          entities: {
            alice: Id(),
            bob: Ld([], { opacity: 0.6, label: `Bob · offline, has up to #41` }),
            chat: zd(),
            g1: Bd(),
            g2: Vd(),
            reg: Hd([{ text: `bob: no entry`, tone: `amber`, icon: `clock` }]),
            store: Ud([{ text: `conv 88 · #42 #43 waiting`, tone: `green`, icon: `inbox` }]),
            notifier: Wd(),
          },
          links: Gd({
            cr: q.cr(),
            cs: q.cs(),
            cg: q.cg({ style: `off` }),
            b2: q.b2({ style: `off` }),
            cp: q.cp(),
            pb: q.pb({ label: `“2 new messages”`, labelAt: 0.6 }),
          }),
          flows: [
            { route: Kd, kind: `msg`, rate: 0.9, bounce: !0 },
            Yd(),
            Xd(),
            { route: [`cp`, `pb`], kind: `push`, rate: 0.7 },
          ],
        },
      },
      {
        short: `Duplicates`,
        chapter: `problem`,
        title: `Case: sent twice, shown once`,
        body: [
          `Alice hits send in a lift. The message reaches the server and is stored — but the “sent ✓” reply gets lost. Her app can’t tell, so it retries, and now the server has received the same message twice.`,
          `Fix it the way <em>Timeouts & Retries</em> taught: the app gives every message a unique id <em>before</em> sending and reuses it on every retry. The server recognises an id it has already stored and simply acknowledges again. Receiving apps discard duplicates the same way.`,
        ],
        callout: {
          kind: `tip`,
          text: `At-least-once delivery plus idempotent receivers adds up to “exactly once” on the screen. The ticks are plain acknowledgements: ✓ stored by the server, ✓✓ received by the device.`,
        },
        changes: [
          `+ Message ids generated on the device`,
          `~ A retry reuses its id → stored once`,
          `+ Receipts: ✓ sent · ✓✓ delivered`,
        ],
        metrics: ef,
        scene: {
          entities: {
            alice: Id([{ text: `retry · same id 7f3a`, tone: `amber`, icon: `replay` }]),
            bob: Ld([], { label: `Bob · sees it once ✓✓` }),
            chat: zd([{ text: `seen 7f3a → just ack`, tone: `green`, icon: `fingerprint` }]),
            g1: Bd(),
            g2: Vd(),
            reg: Hd(),
            store: Ud(),
            notifier: Wd(),
          },
          links: Gd({
            cr: q.cr(),
            cs: q.cs(),
            cp: q.cp({ style: `off` }),
            pb: q.pb({ style: `off` }),
            a1: q.a1({ fail: 0.3 }),
          }),
          flows: [Jd(0.8), { route: Kd, kind: `msg`, rate: 0.8, bounce: !0 }, Yd(), Xd(0.8)],
        },
      },
      {
        short: `Groups`,
        chapter: `technique`,
        title: `Group chats: store once, deliver to many`,
        body: [
          `A group message is stored <b>once</b>, in the group’s conversation. Then the chat service looks up the members, finds each one’s gateway in the registry, and delivers a copy to every device that is online — fan-out on write, just like the news feed.`,
          `That works well up to a few hundred members. A channel with 100,000 members is the celebrity problem again; there, apps fetch new messages when the channel is opened instead.`,
        ],
        callout: {
          kind: `tip`,
          text: `Members who are offline cost nothing extra: each syncs from its own cursor when it returns.`,
        },
        changes: [
          `+ Cara joins the conversation`,
          `~ One stored message → a delivery per online member`,
        ],
        metrics: ef,
        scene: {
          entities: {
            alice: Id(),
            bob: Ld(),
            cara: Rd(),
            chat: zd([{ text: `3 members`, icon: `users` }]),
            g1: Bd(),
            g2: Vd(),
            reg: Hd(),
            store: Ud(),
            notifier: Wd(),
          },
          links: Gd({
            cr: q.cr(),
            cs: q.cs(),
            cp: q.cp({ style: `off` }),
            pb: q.pb({ style: `off` }),
            c2: q.c2(),
          }),
          flows: [
            { route: Kd, kind: `msg`, rate: 0.8 },
            {
              fanout: !0,
              routes: [{ path: [`cg`, `b2`] }, { path: [`cg`, `c2`] }],
              kind: `msg`,
              rate: 0.8,
            },
            Yd(),
            Xd(0.8),
          ],
        },
      },
      {
        short: `Presence`,
        chapter: `tradeoff`,
        title: `“Online” and “typing…” play by other rules`,
        body: [
          `Presence looks simple and is surprisingly expensive: each time someone connects or disconnects, every one of their contacts’ screens may need an update. With 20 million people coming and going, that’s a storm of tiny messages.`,
          `So treat it as <b>ephemeral</b>. Derive “online” from the registry’s heartbeats; send updates only to people who have that chat or contact list open right now; never store “typing…” at all. If an update is lost, the next heartbeat corrects it.`,
        ],
        callout: {
          kind: `insight`,
          text: `One product, two consistency levels: messages are durable and ordered; presence is best-effort and may be seconds stale. Choosing per feature is the CAP lesson in practice.`,
        },
        changes: [
          `+ Presence derived from heartbeats (TTL 30 s)`,
          `~ Updates only to people who are looking`,
          `~ “Typing…” is never stored`,
        ],
        metrics: ef,
        scene: {
          entities: {
            alice: Id([{ text: `sees: Bob is online`, tone: `green`, icon: `eye` }]),
            bob: Ld([], { label: `Bob · typing…` }),
            cara: Rd(),
            chat: zd(),
            g1: Bd(),
            g2: Vd(),
            reg: Hd([{ text: `bob: online · 30 s TTL`, tone: `green`, icon: `heartPulse` }]),
            store: Ud(),
            notifier: Wd(),
          },
          links: Gd({
            cr: q.cr(),
            cs: q.cs({ style: `off` }),
            cp: q.cp({ style: `off` }),
            pb: q.pb({ style: `off` }),
            c2: q.c2(),
          }),
          flows: [
            { route: [`b2`], kind: `ping`, rate: 1.2 },
            { route: [`c2`], kind: `ping`, rate: 0.6 },
            Yd(0.8),
            { route: [`gc`], kind: `ping`, rate: 0.8 },
            { route: [`a1`], kind: `ping`, rate: 0.8 },
          ],
        },
      },
      {
        short: `Gateway dies`,
        chapter: `problem`,
        title: `Case: a gateway dies`,
        body: [
          `Gateway 2 crashes and 200,000 sockets drop at once. No message is lost — everything was stored first — but 200,000 apps now try to reconnect in the same second, and could knock over whichever gateway they land on.`,
          `The apps reconnect with <b>exponential backoff and jitter</b> (<em>Timeouts & Retries</em>), the load balancer spreads them across the healthy gateways, each one registers its new location, and every app syncs from its cursor.`,
        ],
        callout: {
          kind: `warn`,
          text: `Stateful servers fail loudly. Plan for the reconnect storm — and before a deploy, drain gateways gently instead of cutting everyone off at once.`,
        },
        changes: [
          `− Gateway 2 down · 200,000 sockets dropped`,
          `~ Apps reconnect with backoff and jitter`,
          `~ Bob lands on gateway 1 and syncs from #43`,
        ],
        metrics: { deliverMs: 110, conns: `20 M · 99 gateways`, canLoseMsg: `no`, ordered: `yes` },
        scene: {
          entities: {
            alice: Id(),
            bob: Ld([], { label: `Bob · reconnected, synced from #43` }),
            chat: zd(),
            g1: Bd(),
            g2: Vd([], g),
            reg: Hd([{ text: `bob → gateway 1`, tone: `green`, icon: `signpost` }]),
            store: Ud(),
            notifier: Wd(),
          },
          links: {
            a1: q.a1(),
            gc: q.gc(),
            cg: q.cg({ style: `off` }),
            b2: q.b2({ fail: 1 }),
            cr: q.cr(),
            cs: q.cs(),
            cp: q.cp({ style: `off` }),
            pb: q.pb({ style: `off` }),
            b1: h(`bob`, `g1`, [`bob`, [`bob`, -9], [-7.6, -9], [-7.6, `g1`]], { heads: `both` }),
          },
          flows: [
            { route: [`a1`, `gc`], kind: `msg`, rate: 0.8, bounce: !0 },
            { route: [`b1`, `gc`], kind: `msg`, rate: 0.8, bounce: !0 },
            Yd(0.8),
            Xd(0.8),
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `The finished design`,
        body: [
          `<table class="compare">
          <thead><tr><th>Question</th><th>Decision</th><th>Because</th></tr></thead>
          <tbody>
            <tr><td>Transport</td><td>WebSockets on dumb gateways</td><td>Server must push; 20 M sockets</td></tr>
            <tr><td>Routing</td><td>Registry: user → gateway</td><td>Connections are stateful</td></tr>
            <tr><td>Durability</td><td>Store first, then deliver</td><td>Never lose a message</td></tr>
            <tr><td>Order, duplicates</td><td>Server sequence + device ids</td><td>Clocks and retries lie</td></tr>
            <tr><td>Offline</td><td>Push + sync by cursor</td><td>One path for every gap</td></tr>
          </tbody>
        </table>`,
          `End-to-end encryption (<em>Encryption & Secrets</em>) changes what the server can read, not this architecture: it stores and forwards ciphertext.`,
        ],
        callout: {
          kind: `next`,
          text: `That’s the course. You have the building blocks and three complete designs — now pick a product you use every day and sketch how you would build it.`,
        },
        metrics: ef,
        scene: {
          entities: {
            alice: Id(),
            bob: Ld(),
            chat: zd(),
            g1: Bd(),
            g2: Vd(),
            reg: Hd(),
            store: Ud(),
            notifier: Wd(),
          },
          links: Gd({
            cr: q.cr(),
            cs: q.cs(),
            cp: q.cp({ style: `off` }),
            pb: q.pb({ style: `off` }),
          }),
          flows: [Jd(), Yd(), Xd()],
        },
      },
    ],
  };

export { tf as designChatLesson };
export default tf;
