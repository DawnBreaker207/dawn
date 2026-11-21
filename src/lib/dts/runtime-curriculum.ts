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
const Ei = (e, t) => {
  let n = [...t].sort((e, t) => e.a - t.a),
    r = n[n.length - 1];
  for (let t of n) t.a <= e && (r = t);
  return r;
};


const Ni = 10,
  Pi = { A: 'blue', B: 'orange', C: 'green', D: 'purple', E: 'yellow' },
  Fi = [26, 40, 54, 68, 82, 118, 132, 146, 160, 174, 216, 230, 244, 258, 296, 322, 336, 350],
  Ii = (e, t = Ni) => [t * Math.cos((e * Math.PI) / 180), t * Math.sin((e * Math.PI) / 180)],
  Li = (e, t, n = {}) => {
    let [r, i] = Ii(t);
    return d(r, i, { s: 3.2, h: 38, color: Pi[e], glyph: '', label: [e], ...n });
  },
  Ri = { A: 100, B: 10, C: 280, D: 200 },
  zi = (e, t = {}) => ({
    type: 'ring',
    x: 0,
    y: 0,
    r: Ni,
    nodes: e,
    keys: Fi,
    label: 'hash ring · 0 → 2³²',
    ...t,
  }),
  Bi = (e) => Object.entries(e).map(([e, t]) => ({ a: t, color: Pi[e] })),
  Vi = (e, t) => Fi.filter((n) => Ei(n, e).color !== Ei(n, t).color),
  Hi = (e) => {
    let t = {};
    for (let n of Fi) t[Ei(n, e).color] = (t[Ei(n, e).color] || 0) + 1;
    return Math.round((Math.max(...Object.values(t)) / Fi.length) * 100);
  },
  Ui = (e, t, n) => {
    let r = n <= e ? n : n - 360,
      i = [];
    for (let t = e; t > r; t -= 5) i.push(Ii(t));
    return i.push(Ii(r)), h('ring', t, i, { label: `key @ ${e}°`, labelAt: 0.25 });
  },
  Wi = (e, t, n) => S({ x: 0, y: 0, z: 0, dx: -470, dy: -250 }, e, t, { icon: n }),
  Gi = Bi(Ri),
  Ki = Bi({ ...Ri, E: 308 }),
  qi = Bi({ A: 100, B: 10, D: 200 }),
  Ji = [
    ...Bi(Ri),
    ...Bi({ A: 75, B: 315, D: 225 }).map((e) => ({ ...e, mark: !0 })),
    ...Bi({ A: 180, B: 30, D: 340 }).map((e) => ({ ...e, mark: !0 })),
  ],
  Yi = (e, t = {}) =>
    Object.fromEntries(e.map((e) => [e.toLowerCase(), Li(e, Ri[e] ?? 50, t[e] || {})]));


// --- data ---
const Xi = {
    id: `consistent-hashing`,
    title: `Consistent Hashing`,
    summary: `Add or remove servers and move only a sliver of the data.`,
    minutes: 10,
    level: `intermediate`,
    metrics: [`nodes`, `moved`, `maxShare`],
    legend: [`req`, [`write`, `moving data / copies`]],
    goals: [
      { text: `Why hash % N reshuffles everything`, step: 0 },
      { text: `Keys belong to the next server clockwise`, step: 2 },
      { text: `Adding or removing a server moves one arc`, step: 4 },
      { text: `Virtual nodes even out the load`, step: 6 },
      { text: `Replicas on the ring, and cache clusters`, step: 7 },
    ],
    steps: [
      {
        short: `The problem`,
        chapter: `problem`,
        title: `hash % N breaks when N changes`,
        body: [
          `Last lesson ended badly: with <code>shard = hash(key) % N</code>, going from 4 to 5 shards changes the answer for about 80% of keys. Nearly all the data moves.`,
          `We want a scheme where adding a server only moves the keys that server should take over — roughly 1/N of them.`,
        ],
        callout: { kind: `insight`, text: `The trick is to stop tying placement to N at all.` },
        metrics: { nodes: 4, moved: `80%`, maxShare: 25 },
        scene: {
          entities: {
            a: b(-10.5, -4, { r: 1.6, h: 36, tags: [{ text: `A` }] }),
            b: b(-3.5, -4, { r: 1.6, h: 36, tags: [{ text: `B` }] }),
            c: b(3.5, -4, { r: 1.6, h: 36, tags: [{ text: `C` }] }),
            d: b(10.5, -4, { r: 1.6, h: 36, tags: [{ text: `D` }] }),
            card: Wi(
              `% 4 → % 5`,
              [
                `hash(k) % 4  →  hash(k) % 5`,
                `! ~80% of keys land somewhere new`,
                `# we want ~1/5 to move`,
              ],
              `replay`,
            ),
          },
          links: {},
          flows: [],
        },
      },
      {
        short: `The ring`,
        chapter: `technique`,
        title: `Bend the hash space into a ring`,
        body: [
          `Hash values run from 0 to 2³². Join the ends and you get a <span class="term">ring</span>.`,
          `Now hash each <b>server’s</b> name too, and place it on the ring at that point. The servers glide to wherever their hashes put them — not evenly spaced, just wherever the hash lands.`,
        ],
        callout: {
          kind: `tip`,
          text: `Nothing here depends on how many servers there are. That’s the whole point.`,
        },
        changes: [`+ Hash ring`, `~ Servers placed at hash(server name)`],
        metrics: { nodes: 4, moved: `—`, maxShare: `—` },
        scene: {
          entities: { ring: zi(Gi, { keys: [] }), ...Yi([`A`, `B`, `C`, `D`]) },
          links: {},
          flows: [],
        },
      },
      {
        short: `Keys`,
        chapter: `technique`,
        title: `Each key goes clockwise`,
        body: [
          `Hash each <b>key</b> onto the ring too. A key belongs to the <b>first server clockwise</b> from it. The coloured arcs show which server owns which stretch; each dot is a key, coloured by its owner.`,
          `Watch a lookup travel clockwise from a key to its server.`,
        ],
        callout: {
          kind: `insight`,
          text: `To find a key’s server: hash the key, walk clockwise, stop at the first server. Clients do this with a sorted list and a binary search.`,
        },
        changes: [`+ Keys on the ring`, `~ Each key owned by the next server clockwise`],
        metrics: { nodes: 4, moved: `—`, maxShare: Hi(Gi) },
        scene: {
          entities: { ring: zi(Gi), ...Yi([`A`, `B`, `C`, `D`]) },
          links: { k1: Ui(160, `a`, 100), k2: Ui(54, `b`, 10) },
          flows: [{ routes: [{ path: [`k1`] }, { path: [`k2`] }], rate: 1.3 }],
        },
      },
      {
        short: `Add a server`,
        chapter: `solution`,
        title: `Adding a server moves one arc`,
        body: [
          `Server E joins at its hash position, between C and B. It takes over only the keys in the arc just counter-clockwise of it — the ones that used to walk past it to C.`,
          `Every other key stays exactly where it was. The pulsing keys are the only ones that move.`,
        ],
        callout: {
          kind: `tip`,
          text: `Adding the 5th server moves about 1/5 of the keys — the minimum possible.`,
        },
        changes: [
          `+ Server E`,
          `~ ${Vi(Gi, Ki).length} of ${Fi.length} keys move (to E)`,
          `~ Everything else stays put`,
        ],
        metrics: {
          nodes: 5,
          moved: `${Math.round((Vi(Gi, Ki).length / Fi.length) * 100)}%`,
          maxShare: Hi(Ki),
        },
        scene: {
          entities: {
            ring: zi(Ki, { moved: Vi(Gi, Ki) }),
            ...Yi([`A`, `B`, `C`, `D`]),
            e: Li(`E`, 308),
          },
          links: {},
          flows: [],
        },
      },
      {
        short: `Remove one`,
        chapter: `technique`,
        title: `Removing a server moves one arc too`,
        body: [
          `Back to four servers — and now C dies. Its keys simply continue clockwise to the next server, D. Nobody else is affected.`,
          `Compare that with <code>% N</code>, where losing one server would reshuffle almost everything.`,
        ],
        callout: {
          kind: `insight`,
          text: `Amazon’s Dynamo, Cassandra and many caches and CDNs place data this way. Close cousins — rendezvous and jump hashing — get the same result without a ring.`,
        },
        changes: [`− Server C`, `~ C’s ${Vi(Gi, qi).length} keys move to D`],
        metrics: {
          nodes: 3,
          moved: `${Math.round((Vi(Gi, qi).length / Fi.length) * 100)}%`,
          maxShare: Hi(qi),
        },
        scene: {
          entities: {
            ring: zi(qi, { moved: Vi(Gi, qi) }),
            ...Yi([`A`, `B`, `D`]),
            c: Li(`C`, Ri.C, g),
          },
          links: {},
          flows: [],
        },
      },
      {
        short: `Uneven`,
        chapter: `problem`,
        title: `Random positions, uneven arcs`,
        body: [
          `Servers land wherever their hash puts them, so arcs are uneven. With C gone, D now owns a huge stretch of the ring — and gets far more keys and traffic than A or B.`,
          `With only a few servers, luck alone can leave one doing twice the work of another.`,
        ],
        callout: {
          kind: `warn`,
          text: `Uneven arcs mean uneven load — exactly the hot spot sharding was meant to avoid.`,
        },
        changes: [`~ D owns ${Hi(qi)}% of the keys`],
        metrics: { nodes: 3, moved: `—`, maxShare: Hi(qi) },
        scene: {
          entities: {
            ring: zi(qi),
            ...Yi([`A`, `B`], {}),
            d: Li(`D`, Ri.D, {
              heat: 0.8,
              tags: [{ text: `${Hi(qi)}% of keys`, tone: `red`, icon: `alert` }],
            }),
          },
          links: {},
          flows: [],
        },
      },
      {
        short: `Virtual nodes`,
        chapter: `solution`,
        title: `Virtual nodes even it out`,
        body: [
          `Give each server several positions on the ring — <span class="term">virtual nodes</span> (the diamonds) — by hashing <code>A#1</code>, <code>A#2</code>, … Each server now owns many small arcs instead of one big one.`,
          `Shares even out, and when a server leaves, its keys spread across <em>all</em> the others instead of dumping on one neighbour.`,
        ],
        callout: {
          kind: `tip`,
          text: `Real systems use anywhere from 16 to a few hundred virtual nodes per server. Stronger servers can get more of them.`,
        },
        changes: [
          `+ 3 positions per server`,
          `~ Biggest share ${Hi(qi)}% → ${Hi(Ji.filter((e) => e.color !== Pi.C))}%`,
        ],
        metrics: { nodes: 3, moved: `—`, maxShare: Hi(Ji.filter((e) => e.color !== Pi.C)) },
        scene: {
          entities: { ring: zi(Ji.filter((e) => e.color !== Pi.C)), ...Yi([`A`, `B`, `D`]) },
          links: {},
          flows: [],
        },
      },
      {
        short: `Replicas`,
        chapter: `technique`,
        title: `Copies on the next servers clockwise`,
        body: [
          `One copy per key isn’t enough — a dead server would lose its data. So each key is stored on the first <b>three</b> distinct servers clockwise: its owner plus the next two.`,
          `Follow the key at 160°: copy 1 on A, copy 2 on B, copy 3 on C. If A dies, B and C still have it, and the next server along takes over A’s share.`,
        ],
        callout: {
          kind: `tip`,
          text: `Dynamo calls this the preference list. With virtual nodes, skip positions owned by a server you already picked.`,
        },
        changes: [`+ Each key stored on 3 servers`, `~ Survives any single failure`],
        metrics: { nodes: 4, moved: `—`, maxShare: Hi(Gi) },
        scene: {
          entities: {
            ring: zi(Gi),
            ...Yi([`A`, `B`, `C`, `D`], {
              A: { tags: [{ text: `copy 1`, tone: `violet` }] },
              B: { tags: [{ text: `copy 2`, tone: `violet` }] },
              C: { tags: [{ text: `copy 3`, tone: `violet` }] },
            }),
          },
          links: {
            k1: Ui(160, `a`, 100),
            k2: { ...Ui(100, `b`, 10), label: `copy 2`, labelAt: 0.5 },
            k3: { ...Ui(10, `c`, -80), label: `copy 3`, labelAt: 0.5 },
          },
          flows: [{ route: [`k1`, `k2`, `k3`], rate: 0.6, kind: `write` }],
        },
      },
      {
        short: `Cache fleet`,
        chapter: `insight`,
        title: `Case: growing a cache cluster`,
        body: [
          `A fleet of Memcached servers sits in front of a database, and clients pick a server with <code>hash(key) % N</code>. Adding a fifth server remaps ~80% of keys — they all miss at once, and the database is flattened by the stampede.`,
          `With consistent hashing, adding the fifth server moves only ~20% of keys. The cache stays mostly warm and the database barely notices.`,
        ],
        callout: {
          kind: `insight`,
          text: `This is where consistent hashing started: spreading web caches across machines that come and go.`,
        },
        changes: [`+ Fifth cache server`, `~ Cache misses after the change: 80% → 20%`],
        metrics: { nodes: 5, moved: `20%`, maxShare: Hi(Ki) },
        scene: {
          entities: {
            ring: zi(Ki, { moved: Vi(Gi, Ki) }),
            ...Yi([`A`, `B`, `C`, `D`]),
            e: Li(`E`, 308),
            card: S({ x: 0, y: 0, z: 0, dx: -470, dy: -250 }, `Misses after adding a server`, [], {
              icon: `zap`,
              chart: `bars`,
              bars: [
                { label: `hash % N`, to: 0.8, tone: `red`, note: `80%` },
                { label: `consistent`, to: 0.2, tone: `green`, note: `20%` },
              ],
            }),
          },
          links: {},
          flows: [],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Put servers and keys on a <b>hash ring</b>; a key belongs to the <b>next server clockwise</b>.</li>
          <li>Adding or removing a server moves only <b>one arc</b> — about 1/N of keys.</li>
          <li><b>Virtual nodes</b> even out shares and spread the load when servers leave.</li>
          <li>Store each key on the <b>next N servers</b> clockwise for redundancy.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Unique IDs at Scale</b> — giving every row a name once there is no single database to count for you.`,
        },
        metrics: { nodes: 3, moved: `—`, maxShare: Hi(Ji.filter((e) => e.color !== Pi.C)) },
        scene: {
          entities: { ring: zi(Ji.filter((e) => e.color !== Pi.C)), ...Yi([`A`, `B`, `D`]) },
          links: { k1: Ui(160, `a`, 100), k2: Ui(26, `b`, 10) },
          flows: [{ routes: [{ path: [`k1`] }, { path: [`k2`] }], rate: 1.2 }],
        },
      },
    ],
  };

const Zi = -3;

const Qi = (e = [], t = {}) => d(-7, -12, { label: [`App`, `Server 1`], tags: e, ...t });

const $i = (e = [], t = {}) => d(7, -12, { label: [`App`, `Server 2`], tags: e, ...t });

const ea = (e = [], t = {}) => b(-7, 6, { r: 1.9, glyph: `database`, label: `shard A`, tags: e, ...t });

const ta = (e = [], t = {}) => b(7, 6, { r: 1.9, glyph: `database`, label: `shard B`, tags: e, ...t });

const na = (e = []) =>
    d(0, -22, { color: `yellow`, glyph: `ticket`, label: [`Ticket`, `Server`], tags: e });

const ra = {
    a1: h(`s1`, `dA`, [`s1`, `dA`]),
    b1: h(`s1`, `dB`, [`s1`, [`s1`, Zi], [`dB`, Zi], `dB`]),
    a2: h(`s2`, `dA`, [`s2`, [`s2`, Zi], [`dA`, Zi], `dA`]),
    b2: h(`s2`, `dB`, [`s2`, `dB`]),
  };

const ia = (e = {}) => ({
    t1: h(`s1`, `tk`, [`s1`, [`s1`, `tk`], `tk`], { heads: `both`, ...e }),
    t2: h(`s2`, `tk`, [`s2`, [`s2`, `tk`], `tk`], { heads: `both`, ...e }),
  });

const aa = (e = 1.6) => ({
    routes: [{ path: [`a1`] }, { path: [`b1`] }, { path: [`a2`] }, { path: [`b2`] }],
    kind: `write`,
    rate: e,
  });

const oa = (e, t, n, r = {}) => S({ x: 7, y: -12, z: 0, dx: 104, dy: -22, ...r }, e, t, { icon: n });

const sa = Array.from({ length: 10 }, (e, t) => -9.45 + t * 2.1);

const ca = (e = []) => {
    let t = { idx: x({ x0: -11, x1: 11, y0: 4.5, y1: 7.5 }, ``) };
    return (
      sa.forEach((n, r) => {
        t[`p${r}`] = d(n, 6, {
          s: 1.7,
          h: 11,
          radius: 3,
          color: `purple`,
          glyph: ``,
          label: [],
          heat: e.includes(r) ? 0.85 : 0,
          tags:
            r === 0
              ? [{ text: `primary-key index · pages sorted by id →`, icon: `listOrdered` }]
              : [],
        });
      }),
      t
    );
  };

const la = (e, t) => h(e, `p${t}`, [e, [e, Zi], [sa[t], Zi], `p${t}`]);

const ua = {
    id: `unique-ids`,
    title: `Unique IDs at Scale`,
    summary: `Giving every row a name nobody else will ever use — without one counter everyone has to queue for.`,
    minutes: 13,
    level: `intermediate`,
    metrics: [`collide`, `idSize`, `sortable`, `idDep`],
    legend: [[`write`, `insert`], [`req`, `id request`], `res`, `fail`],
    goals: [
      { text: `Why database counters break under sharding`, step: 1 },
      { text: `Ticket servers and id blocks`, step: 3 },
      { text: `UUIDs — and what random keys do to an index`, step: 5 },
      { text: `Time-ordered ids: UUID v7 and Snowflake`, step: 7 },
      { text: `Clocks that step back, and what ids leak`, step: 9 },
    ],
    steps: [
      {
        short: `One counter`,
        chapter: `setup`,
        title: `Every row needs a name`,
        body: [
          `Orders, users, payments: every row needs an identifier that is <b>unique</b> — for ever. Other tables point at it, URLs contain it, support staff read it out over the phone.`,
          `With one database this is free. An <code>AUTO_INCREMENT</code> (or <code>SERIAL</code>) column hands out 1001, 1002, 1003… and the database guarantees no number is ever used twice.`,
        ],
        callout: {
          kind: `insight`,
          text: `A counter gives you more than uniqueness: the ids are small, and sorting by id sorts by creation time. Watch which of those gifts each alternative keeps.`,
        },
        metrics: { collide: `no`, idSize: `64 bits`, sortable: `yes`, idDep: `one database` },
        scene: {
          entities: {
            s1: Qi(),
            dA: ea([{ text: `next id: 1004`, icon: `hash` }], { label: `orders database` }),
          },
          links: { a1: ra.a1 },
          flows: [{ route: [`a1`], kind: `write`, rate: 1.2 }],
        },
      },
      {
        short: `Shards collide`,
        chapter: `problem`,
        title: `Two shards, two counters`,
        body: [
          `The orders table gets sharded (see <em>Sharding</em>). Each shard is its own database with its own counter — and both of them have just handed out <b>1004</b>.`,
          `Two different orders now share an id. A link to <code>/orders/1004</code>, a cache entry, a refund: each could mean either one. And the day you merge or re-split shards, the rows collide.`,
        ],
        callout: {
          kind: `warn`,
          text: `Uniqueness has to hold across the <em>whole system</em>, not just inside one machine.`,
        },
        changes: [`+ Shard B, with its own counter`, `− Order 1004 now exists twice`],
        metrics: { collide: `yes`, idSize: `64 bits`, sortable: `yes`, idDep: `each shard` },
        scene: {
          entities: {
            s1: Qi(),
            dA: ea([{ text: `order 1004 · Ana`, tone: `red`, icon: `alert` }]),
            dB: ta([{ text: `order 1004 · Ben`, tone: `red`, icon: `alert` }]),
          },
          links: { a1: ra.a1, b1: ra.b1 },
          flows: [{ routes: [{ path: [`a1`] }, { path: [`b1`] }], kind: `write`, rate: 1.4 }],
        },
      },
      {
        short: `Ticket server`,
        chapter: `solution`,
        title: `Way 1 — one counter for everyone`,
        body: [
          `Move the counter out of the shards into a small service whose only job is to hand out the next number: a <span class="term">ticket server</span>. Before each insert, an app server asks it for an id.`,
          `Uniqueness is back, and ids still sort by time. But every insert now costs an extra round trip — and if the ticket server is down, nobody can create anything.`,
        ],
        callout: {
          kind: `tip`,
          text: `Flickr ran two ticket servers for years — one handing out odd numbers, the other even — so that either could fail without stopping the site.`,
        },
        changes: [
          `+ Ticket server`,
          `~ Every insert asks it for an id first`,
          `− A new single point of failure`,
        ],
        metrics: {
          collide: `no`,
          idSize: `64 bits`,
          sortable: `yes`,
          idDep: `ticket server · every insert`,
        },
        scene: {
          entities: {
            s1: Qi(),
            s2: $i(),
            dA: ea(),
            dB: ta(),
            tk: na([{ text: `next id: 1005`, icon: `hash` }]),
          },
          links: { ...ra, ...ia() },
          flows: [{ routes: [{ path: [`t1`] }, { path: [`t2`] }], rate: 1.6, bounce: !0 }, aa(1.6)],
        },
      },
      {
        short: `Blocks`,
        chapter: `technique`,
        title: `Hand out blocks, not single numbers`,
        body: [
          `Ask less often. Each app server reserves a whole <b>block</b> — say 1,000 ids — in one call and hands them out from memory. That’s one round trip per thousand inserts, and the app keeps working for a while if the ticket server is down.`,
          `The price: ids no longer follow creation time across servers (Server 2’s 2001 may be older than Server 1’s 1500), and a server that crashes takes the rest of its block with it, leaving gaps.`,
        ],
        callout: {
          kind: `insight`,
          text: `Gaps are harmless. Never promise that ids are gap-free or strictly ordered — invoice numbers that legally must be gapless are a separate, deliberate counter.`,
        },
        changes: [
          `~ Servers reserve 1,000 ids per call`,
          `~ 1 round trip per 1,000 inserts`,
          `− Strict time order across servers`,
        ],
        metrics: {
          collide: `no`,
          idSize: `64 bits`,
          sortable: `roughly`,
          idDep: `ticket server · rarely`,
        },
        scene: {
          entities: {
            s1: Qi([{ text: `block 1000–1999`, tone: `green`, icon: `layers` }]),
            s2: $i([{ text: `block 2000–2999`, tone: `green`, icon: `layers` }]),
            dA: ea(),
            dB: ta(),
            tk: na([{ text: `next block: 3000`, icon: `hash` }]),
          },
          links: { ...ra, ...ia({ style: `dashed` }) },
          flows: [{ routes: [{ path: [`t1`] }, { path: [`t2`] }], rate: 0.25, bounce: !0 }, aa(2)],
        },
      },
      {
        short: `UUIDs`,
        chapter: `solution`,
        title: `Way 2 — pick a number nobody else will`,
        body: [
          `Or drop the coordination altogether. A <span class="term">UUID</span> (version 4) is 122 random bits. Any server, phone or script can make one, with nobody to ask.`,
          `Can two collide? In principle. In practice you would have to generate a billion every second for about 86 years to reach a 50% chance of a single repeat.`,
        ],
        callout: {
          kind: `tip`,
          text: `The cost is size: 128 bits, twice a normal id — and that id is copied into every index and every table that points at the row.`,
        },
        changes: [
          `− Ticket server`,
          `+ Each server generates random 128-bit ids`,
          `~ No coordination at all`,
        ],
        metrics: { collide: `no`, idSize: `128 bits`, sortable: `no`, idDep: `nothing` },
        scene: {
          entities: {
            s1: Qi([{ text: `f47ac10b-58cc-…`, icon: `fingerprint` }]),
            s2: $i([{ text: `9c1e6a2d-03b7-…`, icon: `fingerprint` }]),
            dA: ea(),
            dB: ta(),
            card: oa(
              `UUID v4`,
              [
                `f47ac10b-58cc-4372-a567-0e02b2c3d479`,
                `122 random bits`,
                `= generate anywhere, ask nobody`,
                `# 16 bytes instead of 8`,
              ],
              `fingerprint`,
            ),
          },
          links: ra,
          flows: [aa(2)],
        },
      },
      {
        short: `Random hurts`,
        chapter: `problem`,
        title: `Case: random ids and the index`,
        body: [
          `The primary key lives in a B-tree, sorted by id (see <em>Indexes</em>). Counter ids always land on the <b>last</b> page, which stays in memory. Random ids land on a <b>random</b> page, every time.`,
          `Once the index is bigger than memory, most inserts must first fetch a cold page from disk, and pages split all over the tree. Insert throughput can drop several-fold, and the index ends up bloated with half-empty pages.`,
        ],
        callout: {
          kind: `warn`,
          text: `It bites hardest where the table itself is stored in primary-key order — MySQL’s InnoDB, SQL Server — but every B-tree feels it.`,
        },
        changes: [
          `+ Inside one shard: the primary-key index`,
          `− Inserts scatter across every page`,
        ],
        metrics: { collide: `no`, idSize: `128 bits`, sortable: `no`, idDep: `nothing` },
        scene: {
          entities: {
            s1: Qi([{ text: `f47ac10b-58cc-…`, icon: `fingerprint` }]),
            s2: $i([{ text: `9c1e6a2d-03b7-…`, icon: `fingerprint` }]),
            ...ca([1, 3, 4, 6, 8]),
            card: oa(
              `Where does the next row go?`,
              [
                `counter id   → always the last page`,
                `! random id  → any page, every time`,
                `# cold pages, page splits, bloat`,
              ],
              `layers`,
            ),
          },
          links: {
            r1: la(`s1`, 1),
            r3: la(`s1`, 4),
            r5: la(`s1`, 8),
            r2: la(`s2`, 3),
            r4: la(`s2`, 6),
          },
          flows: [
            {
              routes: [
                { path: [`r1`] },
                { path: [`r2`] },
                { path: [`r3`] },
                { path: [`r4`] },
                { path: [`r5`] },
              ],
              kind: `write`,
              rate: 2.4,
            },
          ],
        },
      },
      {
        short: `Time first`,
        chapter: `solution`,
        title: `Put the time in front`,
        body: [
          `Keep the randomness, but lead with a timestamp. <span class="term">UUID v7</span> — and its cousin, ULID — starts with 48 bits of milliseconds, followed by random bits.`,
          `New ids are always larger than old ones, so inserts return to the right-hand edge of the index. They still need no coordination, and “sort by id” means “sort by creation time” again.`,
        ],
        callout: {
          kind: `tip`,
          text: `If you want UUIDs as primary keys, use version 7. Keep version 4 for tokens that must be impossible to guess.`,
        },
        changes: [`~ UUID v4 → UUID v7`, `~ Inserts append to the last page again`],
        metrics: { collide: `no`, idSize: `128 bits`, sortable: `yes`, idDep: `a clock` },
        scene: {
          entities: {
            s1: Qi([{ text: `018f6b1c-3a40-7…`, icon: `clock` }]),
            s2: $i([{ text: `018f6b1c-3a41-7…`, icon: `clock` }]),
            ...ca([9]),
            card: oa(
              `UUID v7`,
              [
                `018f6b1c-3a40-7d2e-9b6f-5c1a2e4d7f90`,
                `48 bits   milliseconds since 1970`,
                `74 bits   random`,
                `= ordered by time, no coordination`,
              ],
              `clock`,
            ),
          },
          links: { r5: la(`s1`, 9), r4: la(`s2`, 9) },
          flows: [{ routes: [{ path: [`r5`] }, { path: [`r4`] }], kind: `write`, rate: 2.4 }],
        },
      },
      {
        short: `Snowflake`,
        chapter: `solution`,
        title: `Way 3 — Snowflake ids`,
        body: [
          `Twitter needed ids that fit in 64 bits, sort by time, and could be minted tens of thousands of times a second with no central counter. Its answer, <span class="term">Snowflake</span>, packs three fields into one number.`,
          `A millisecond <b>timestamp</b>, the <b>machine id</b> of the generator, and a <b>sequence</b> that counts up within the millisecond. Two machines can never collide, because their machine ids differ; one machine never repeats, because of the sequence.`,
        ],
        callout: {
          kind: `tip`,
          text: `Each machine can mint 4,096 ids per millisecond. Discord, Instagram and many others use the same idea with slightly different bit splits.`,
        },
        changes: [`~ UUIDs → 64-bit Snowflake ids`, `+ Every server gets a machine id at startup`],
        metrics: { collide: `no`, idSize: `64 bits`, sortable: `yes`, idDep: `machine id + clock` },
        scene: {
          entities: {
            s1: Qi([{ text: `machine 1`, tone: `green`, icon: `idCard` }]),
            s2: $i([{ text: `machine 2`, tone: `green`, icon: `idCard` }]),
            dA: ea(),
            dB: ta(),
            card: oa(
              `One 64-bit id`,
              [
                `41 bits   milliseconds   ≈ 69 years`,
                `10 bits   machine id     1,024 machines`,
                `12 bits   sequence       4,096 per ms`,
                `= time | machine | sequence`,
              ],
              `hash`,
            ),
          },
          links: ra,
          flows: [aa(2.4)],
        },
      },
      {
        short: `Clock`,
        chapter: `problem`,
        title: `Case: the clock steps back`,
        body: [
          `Snowflake ids are unique only if a machine’s clock never repeats a millisecond. But clocks get corrected: time sync notices Server 1 is two seconds fast and sets it back. For two seconds it would stamp ids with times it has already used — duplicates.`,
          `The guard is simple. Remember the last timestamp you issued; if the clock now reads earlier, <b>wait</b> (or refuse to issue ids) until time has caught up.`,
        ],
        callout: {
          kind: `warn`,
          text: `The other way to break it: two machines with the same machine id. Assign them from one place — a config service, or bits of something already unique — never by hand.`,
        },
        changes: [
          `− Server 1’s clock set back 2 s`,
          `+ Generator waits until the clock passes its last stamp`,
          `~ No duplicates — that server pauses inserts for 2 s`,
        ],
        metrics: { collide: `no`, idSize: `64 bits`, sortable: `yes`, idDep: `machine id + clock` },
        scene: {
          entities: {
            s1: Qi([{ text: `clock −2 s · waiting`, tone: `amber`, icon: `clock` }], { heat: 0.4 }),
            s2: $i([{ text: `machine 2`, tone: `green`, icon: `idCard` }]),
            dA: ea(),
            dB: ta(),
            card: oa(
              `Server 1’s generator`,
              [
                `last id stamped   12:00:07.250`,
                `! clock now reads  12:00:05.250`,
                `= wait 2 s, then carry on`,
                `# never reuse a timestamp`,
              ],
              `clock`,
            ),
          },
          links: { ...ra, a1: { ...ra.a1, style: `off` }, b1: { ...ra.b1, style: `off` } },
          flows: [{ routes: [{ path: [`a2`] }, { path: [`b2`] }], kind: `write`, rate: 1.6 }],
        },
      },
      {
        short: `Leaks`,
        chapter: `tradeoff`,
        title: `Case: what an id gives away`,
        body: [
          `Ids end up in URLs, and people read them. A competitor places an order on Monday (<b>#1004</b>) and another on Tuesday (<b>#1250</b>) — and now knows you take about 246 orders a day.`,
          `Sequential ids are also easy to walk: change <code>/invoices/1004</code> to <code>/invoices/1005</code> and see what comes back. Time-based ids reveal exactly when each thing was created.`,
        ],
        callout: {
          kind: `tip`,
          text: `Two defences, and you need the second one regardless: show a separate random public id, and <b>check authorization on every request</b> (see <em>Authorization</em>). An unguessable id is not access control.`,
        },
        changes: [
          `+ A competitor reading ids out of URLs`,
          `~ Public ids → random; internal keys stay ordered`,
        ],
        metrics: { collide: `no`, idSize: `64 bits`, sortable: `yes`, idDep: `machine id + clock` },
        scene: {
          entities: {
            s1: Qi([{ text: `machine 1`, tone: `green`, icon: `idCard` }]),
            s2: $i([{ text: `machine 2`, tone: `green`, icon: `idCard` }]),
            dA: ea(),
            dB: ta(),
            spy: y(-7, -22, { label: `competitor` }),
            card: oa(
              `Reading the ids`,
              [
                `Mon 09:00   /orders/1004`,
                `Tue 09:00   /orders/1250`,
                `! ≈ 246 orders a day`,
                `= public id: ord_8fK2xQ9dLm`,
              ],
              `eye`,
            ),
          },
          links: { ...ra, sp: h(`spy`, `s1`, [`spy`, `s1`], { heads: `both` }) },
          flows: [aa(2), { route: [`sp`], rate: 0.6, bounce: !0 }],
        },
      },
      {
        short: `Choosing`,
        chapter: `tradeoff`,
        title: `Which id for which job`,
        body: [
          `<table class="compare">
          <thead><tr><th></th><th>Size</th><th>Time-sorted</th><th>Needs</th></tr></thead>
          <tbody>
            <tr><td><b>DB counter</b></td><td>64 bits</td><td>Yes</td><td>One database</td></tr>
            <tr><td><b>Ticket blocks</b></td><td>64 bits</td><td>Roughly</td><td>A ticket service</td></tr>
            <tr><td><b>UUID v4</b></td><td>128 bits</td><td>No</td><td>Nothing</td></tr>
            <tr><td><b>UUID v7</b></td><td>128 bits</td><td>Yes</td><td>A clock</td></tr>
            <tr><td><b>Snowflake</b></td><td>64 bits</td><td>Yes</td><td>Machine ids + clock</td></tr>
          </tbody>
        </table>`,
          `One database? Use its counter. Many writers and nothing shared? UUID v7. Compact numeric ids at very high volume? Snowflake.`,
        ],
        callout: {
          kind: `insight`,
          text: `There is no best id — only the properties your system needs: size, ordering, independence and secrecy.`,
        },
        metrics: { collide: `no`, idSize: `64 bits`, sortable: `yes`, idDep: `machine id + clock` },
        scene: {
          entities: {
            s1: Qi([{ text: `machine 1`, tone: `green`, icon: `idCard` }]),
            s2: $i([{ text: `machine 2`, tone: `green`, icon: `idCard` }]),
            dA: ea(),
            dB: ta(),
          },
          links: ra,
          flows: [aa(2.4)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>A per-database counter stops being unique the moment you <b>shard</b>.</li>
          <li>A <b>ticket server</b> restores it; handing out <b>blocks</b> removes the round trip per insert.</li>
          <li><b>UUID v4</b> needs nobody, but scatters inserts across the index; <b>UUID v7</b> puts time first to fix that.</li>
          <li><b>Snowflake</b>: time + machine id + sequence in 64 bits — guard against clocks stepping back.</li>
          <li>Ids <b>leak</b> volume and timing. Never treat them as access control.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>CAP & Consistency</b> — what copies of your data should do when the network between them breaks.`,
        },
        metrics: { collide: `no`, idSize: `64 bits`, sortable: `yes`, idDep: `machine id + clock` },
        scene: {
          entities: {
            s1: Qi([{ text: `machine 1`, tone: `green`, icon: `idCard` }]),
            s2: $i([{ text: `machine 2`, tone: `green`, icon: `idCard` }]),
            dA: ea(),
            dB: ta(),
          },
          links: ra,
          flows: [aa(2.4)],
        },
      },
    ],
  };

const da = { x0: -4, x1: 16, y0: -14.5, y1: -5.5 };

const fa = { x0: -4, x1: 16, y0: 5.5, y1: 14.5 };

const pa = { x0: 9.5, x1: 14.5, y0: -13, y1: -7 };

const ma = { x0: 9.5, x1: 14.5, y0: 7, y1: 13 };

const ha = () => ({ euz: x(da, `EU REGION`), usz: x(fa, `US REGION`) });

const ga = (e = {}) => b(0, -10, { r: 1.9, glyph: `database`, ...e });

const _a = (e = {}) => b(0, 10, { r: 1.9, glyph: `database`, ...e });

const va = (e = `EU users`) => p(pa, 8, e);

const ya = (e = `US users`) => p(ma, 8, e);

const ba = (e, t = `paper`, n = ``) => ({ text: `seats left: ${e}${n}`, tone: t, icon: `info` });

const xa = (e = {}) => ({
    ue: h(`eus`, `eu`, [`eus`, `eu`], { heads: `both`, ...(e.eu || {}) }),
    uu: h(`uss`, `us`, [`uss`, `us`], { heads: `both`, ...(e.us || {}) }),
  });

const Sa = (e = {}) => ({
    rep: h(`eu`, `us`, [`eu`, `us`], { heads: `both`, label: `replication`, ...e }),
  });

const Ca = {
    rep: h(`eu`, `us`, [`eu`, `us`], {
      heads: `none`,
      style: `cut`,
      label: `✕ network partition`,
      labelTone: `red`,
    }),
  };

const wa = (e = !1) => [
    { route: [`ue`], rate: 1.8, bounce: !0 },
    { route: [`uu`], rate: 1.8, bounce: !e },
  ];

const Ta = (e, t, n) => S({ x: -4, y: -14.5, z: 0, dx: -52, dy: -262 }, e, t, { icon: n });

const Ea = (e = {}) => ({
    cl: y(0, -12, { label: `client` }),
    q1: b(-7, 0, {
      r: 1.7,
      glyph: `database`,
      tags: [{ text: `v2`, tone: `green` }],
      ...(e.q1 || {}),
    }),
    q2: b(0, 0, {
      r: 1.7,
      glyph: `database`,
      tags: [{ text: `v2`, tone: `green` }],
      ...(e.q2 || {}),
    }),
    q3: b(7, 0, {
      r: 1.7,
      glyph: `database`,
      tags: [{ text: `v1 · stale`, tone: `amber` }],
      ...(e.q3 || {}),
    }),
  });

const Da = {
    c1: h(`cl`, `q1`, [`cl`, [`q1`, `cl`], `q1`], { heads: `both` }),
    c2: h(`cl`, `q2`, [`cl`, `q2`], { heads: `both` }),
    c3: h(`cl`, `q3`, [`cl`, [`q3`, `cl`], `q3`], { heads: `both` }),
  };

const Oa = {
    id: `cap`,
    title: `CAP & Consistency`,
    summary: `When the network splits, copies of your data must choose between being right and being reachable.`,
    minutes: 12,
    level: `intermediate`,
    metrics: [`consistent`, `available`, `errors`, `conflicts`],
    legend: [`req`, `res`, `write`, [`heavy`, `quorum write`], `fail`],
    goals: [
      { text: `What a network partition is`, step: 1 },
      { text: `Choosing consistency vs availability`, step: 3 },
      { text: `Eventual consistency, conflicts and clocks`, step: 4 },
      { text: `Quorums: W + R > N`, step: 7 },
      { text: `Consistency chosen per operation`, step: 8 },
    ],
    steps: [
      {
        short: `Two regions`,
        chapter: `setup`,
        title: `Copies in two regions`,
        body: [
          `A ticket site keeps a copy of its data in Europe and in the US, so each region’s users get fast answers. Every write is replicated to the other side.`,
          `One concert has <b>1 seat left</b>, and both copies agree.`,
        ],
        callout: {
          kind: `insight`,
          text: `Replicating across regions buys speed and survival — and opens the question this lesson is about.`,
        },
        metrics: { consistent: `yes`, available: `yes`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...ha(),
            eu: ga({ tags: [ba(1)] }),
            us: _a({ tags: [ba(1)] }),
            eus: va(),
            uss: ya(),
          },
          links: { ...xa(), ...Sa() },
          flows: [...wa(), { route: [`rep`], kind: `write`, rate: 0.8, bounce: !0 }],
        },
      },
      {
        short: `Partition`,
        chapter: `problem`,
        title: `The network splits`,
        body: [
          `An undersea cable is cut. Both regions are healthy and their users can still reach them — but the regions can’t talk to <em>each other</em>. This is a <span class="term">network partition</span>.`,
          `Now a US user wants to buy the last seat. The US copy can’t check with Europe. What should it do?`,
        ],
        callout: {
          kind: `warn`,
          text: `Partitions aren’t rare: cables, routers, misconfigurations and overloaded links all cause them.`,
        },
        changes: [`− Link between regions down`],
        metrics: { consistent: `?`, available: `?`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...ha(),
            eu: ga({ tags: [ba(1)] }),
            us: _a({ tags: [ba(1), { text: `can’t reach EU`, tone: `red`, icon: `alert` }] }),
            eus: va(),
            uss: ya(),
          },
          links: { ...xa(), ...Ca },
          flows: wa(),
        },
      },
      {
        short: `Choose C`,
        chapter: `technique`,
        title: `Option 1: stay consistent`,
        body: [
          `Refuse what can’t be confirmed. Europe holds the primary copy, so it keeps serving; the US side rejects writes — and reads that might be stale — until the link is back.`,
          `Nobody ever sees wrong data. But US users get errors for as long as the partition lasts.`,
        ],
        callout: {
          kind: `tip`,
          text: `Choose consistency where wrong answers cost money: payments, bank balances, inventory, ticket sales.`,
        },
        changes: [`~ US side refuses requests`, `− US users see errors`],
        metrics: { consistent: `yes`, available: `partly`, errors: 50, conflicts: 0 },
        scene: {
          entities: {
            ...ha(),
            eu: ga({ tags: [ba(1)] }),
            us: _a({
              heat: 0,
              tags: [{ text: `read-only · refusing writes`, tone: `red`, icon: `lock` }],
            }),
            eus: va(),
            uss: ya(`US users: errors`),
          },
          links: { ...xa({ us: { fail: 1 } }), ...Ca },
          flows: wa(!0),
        },
      },
      {
        short: `Choose A`,
        chapter: `technique`,
        title: `Option 2: stay available`,
        body: [
          `Answer with what you have. Both sides keep accepting writes. Ana in Paris buys the last seat. Ben in Boston buys the last seat.`,
          `Everyone gets an answer — and the two copies now <b>disagree</b>. When the link returns, there are two sales of one seat.`,
        ],
        callout: {
          kind: `tip`,
          text: `Choose availability where a brief disagreement is fine: likes, view counts, shopping carts, social feeds.`,
        },
        changes: [`~ Both sides accept writes`, `− Same seat sold twice`],
        metrics: { consistent: `no`, available: `yes`, errors: 0, conflicts: 1 },
        scene: {
          entities: {
            ...ha(),
            eu: ga({ tags: [ba(0, `amber`, ` · sold to Ana`)] }),
            us: _a({ tags: [ba(0, `amber`, ` · sold to Ben`)] }),
            eus: va(),
            uss: ya(),
          },
          links: { ...xa(), ...Ca },
          flows: [
            ...wa(),
            { route: [`ue`], kind: `write`, rate: 0.6 },
            { route: [`uu`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Heal`,
        chapter: `technique`,
        title: `Healing: eventual consistency`,
        body: [
          `The cable is repaired and the copies exchange what they missed. Left alone they will converge — <span class="term">eventual consistency</span> — but someone has to decide what to do with the conflict.`,
          `Options: <b>last write wins</b> (simple, silently drops one sale), or let the app merge (keep both, refund one, apologise).`,
        ],
        callout: {
          kind: `warn`,
          text: `“Last write wins” is the default in many databases. It loses data quietly — make sure that’s acceptable.`,
        },
        changes: [
          `+ Link restored`,
          `~ Copies exchange missed writes`,
          `~ Conflict resolved: Ben refunded`,
        ],
        metrics: { consistent: `yes`, available: `yes`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...ha(),
            eu: ga({ tags: [ba(0, `green`, ` · Ana`)] }),
            us: _a({ tags: [ba(0, `green`, ` · Ana`), { text: `Ben refunded`, tone: `amber` }] }),
            eus: va(),
            uss: ya(),
          },
          links: { ...xa(), ...Sa({ label: `catching up` }) },
          flows: [...wa(), { route: [`rep`], kind: `write`, rate: 1.6, bounce: !0 }],
        },
      },
      {
        short: `Clocks`,
        chapter: `problem`,
        title: `Case: “last” by whose clock?`,
        body: [
          `Last write wins needs to know which write <em>was</em> last — and each server stamps writes with its own clock. Clocks drift. Here the US server’s clock runs 3 seconds fast.`,
          `A customer saves a delivery address through the US copy, then corrects it two seconds later through the EU copy. The correction is newer, but its timestamp is <b>smaller</b> — so when the copies sync, last write wins keeps the old address and silently throws the fix away.`,
        ],
        callout: {
          kind: `tip`,
          text: `Never order events across machines by wall-clock time. Use version numbers or <b>logical clocks</b> (Lamport timestamps, version vectors) that count events instead of reading the time — or keep both versions and let the app merge.`,
        },
        changes: [
          `+ US clock runs 3 s fast`,
          `− The newer write carries the older timestamp`,
          `− Last write wins keeps the wrong address`,
        ],
        metrics: { consistent: `yes`, available: `yes`, errors: 0, conflicts: 1 },
        scene: {
          entities: {
            ...ha(),
            eu: ga({
              tags: [{ text: `12:00:05 · 5 Rue Cler — the fix`, tone: `green`, icon: `clock` }],
            }),
            us: _a({
              tags: [{ text: `12:00:06 · 12 Elm St — clock +3 s`, tone: `red`, icon: `clock` }],
            }),
            eus: va(),
            uss: ya(),
            card: Ta(
              `Whose clock?`,
              [
                `real 12:00:03   US saves “12 Elm St”`,
                `# stamped 12:00:06 — clock is 3 s fast`,
                `real 12:00:05   EU saves the correction`,
                `# stamped 12:00:05`,
                `! sync keeps 12:00:06: the old address`,
              ],
              `clock`,
            ),
          },
          links: { ...xa(), ...Sa({ label: `sync · highest timestamp wins` }) },
          flows: [...wa(), { route: [`rep`], kind: `write`, rate: 1.2, bounce: !0 }],
        },
      },
      {
        short: `CAP`,
        chapter: `insight`,
        title: `What CAP actually says`,
        body: [
          `The <span class="term">CAP theorem</span>: when a network <b>P</b>artition happens, a replicated system must give up either <b>C</b>onsistency (every read sees the latest write, as if there were only one copy) or <b>A</b>vailability (every request to a working server gets an answer).`,
          `You don’t “pick two of three” — partitions will happen, so the real choice is what to do when they do.`,
          `<small>CAP’s “consistency” is what database people call <b>linearizability</b>. It is not the C in ACID, which is about a transaction keeping your data’s rules intact.</small>`,
        ],
        callout: {
          kind: `insight`,
          text: `PACELC adds the everyday half: even without a partition, keeping copies in sync costs latency. Consistency is never free.`,
        },
        metrics: { consistent: `yes`, available: `yes`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...ha(),
            eu: ga({ tags: [ba(0)] }),
            us: _a({ tags: [ba(0)] }),
            eus: va(),
            uss: ya(),
            card: Ta(
              `During a partition, choose`,
              [
                `C — refuse, never be wrong`,
                `    payments, inventory, bookings`,
                `A — answer, maybe be stale`,
                `    likes, carts, feeds`,
                `# without a partition: latency vs consistency`,
              ],
              `scale`,
            ),
          },
          links: { ...xa(), ...Sa() },
          flows: [...wa(), { route: [`rep`], kind: `write`, rate: 0.8, bounce: !0 }],
        },
      },
      {
        short: `Quorums`,
        chapter: `technique`,
        title: `Quorums: tune the trade-off`,
        body: [
          `Many databases let you choose per request. With <b>N</b> = 3 copies, a write waits for <b>W</b> copies to confirm and a read asks <b>R</b> copies, using the newest answer.`,
          `If <b>W + R > N</b>, every read overlaps at least one copy that saw the latest write — here W = 2 and R = 2, so a read always reaches a <code>v2</code> even though one copy is stale.`,
        ],
        callout: {
          kind: `tip`,
          text: `W = 1, R = 1: fast and available, possibly stale. W = 3: every copy must answer — consistent but fragile. Cassandra, Riak and ScyllaDB expose these knobs per request; DynamoDB offers the simpler choice of eventual or strongly consistent reads.`,
        },
        changes: [`+ 3 copies (N = 3)`, `~ Writes wait for 2 (W = 2)`, `~ Reads ask 2 (R = 2)`],
        metrics: { consistent: `yes`, available: `yes`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...Ea(),
            card: S(
              { x: 7, y: 0, z: 0, dx: 60, dy: -220 },
              `N = 3, W = 2, R = 2`,
              [
                `write → wait for 2 of 3`,
                `read  → ask 2, keep the newest`,
                `= W + R = 4 > 3: always overlaps`,
              ],
              { icon: `layers` },
            ),
          },
          links: Da,
          flows: [
            {
              fanout: !0,
              routes: [{ path: [`c1`] }, { path: [`c2`] }],
              kind: `write`,
              rate: 0.5,
              bounce: !0,
            },
            { fanout: !0, routes: [{ path: [`c2`] }, { path: [`c3`] }], rate: 0.5, bounce: !0 },
          ],
        },
      },
      {
        short: `Per operation`,
        chapter: `technique`,
        title: `Case: a payment and a like`,
        body: [
          `One app, two very different writes. A <b>like</b> can be confirmed by one copy and spread later (W = 1, R = 1): fast, always available, and nobody minds if a count is briefly off.`,
          `Recording a <b>payment</b> (the big square) uses a majority for both the write and every read (W = 2, R = 2): slower, and it fails if two copies can’t be reached — rather than risk anyone reading a stale “unpaid”.`,
        ],
        callout: {
          kind: `tip`,
          text: `You don’t pick consistency once for the whole system. Pick it per operation, by asking what a wrong answer would cost.`,
        },
        changes: [`+ Likes: W = 1, R = 1`, `+ Payments: W = 2, R = 2`],
        metrics: { consistent: `per op`, available: `per op`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...Ea({ q3: { tags: [{ text: `v2`, tone: `green` }] } }),
            card: S(
              { x: 7, y: 0, z: 0, dx: 60, dy: -220 },
              `Choose per operation`,
              [
                `like      W = 1, R = 1 · fast, eventual`,
                `payment   W = 2, R = 2 · slower, safe`,
                `= cost of being wrong decides`,
              ],
              { icon: `scale` },
            ),
          },
          links: Da,
          flows: [
            { route: [`c1`], kind: `req`, rate: 1.2, bounce: !0 },
            {
              fanout: !0,
              routes: [{ path: [`c1`] }, { path: [`c2`] }, { path: [`c3`] }],
              kind: `heavy`,
              rate: 0.35,
              bounce: !0,
              speed: 0.7,
            },
          ],
        },
      },
      {
        short: `Models`,
        chapter: `insight`,
        title: `Consistency is a spectrum`,
        body: [
          `“Consistent” isn’t yes or no. Between the strongest (<span class="term">linearizable</span>: everyone sees the latest write) and eventual sit useful promises: <b>read-your-writes</b> (you always see your own changes), <b>monotonic reads</b> (time never goes backwards for you), and <b>causal</b> consistency (replies never appear before the message they answer).`,
          `Weaker promises are cheaper and more available. Pick the weakest one your users won’t notice.`,
        ],
        callout: {
          kind: `insight`,
          text: `Many “eventual” systems offer read-your-writes per session — enough for most apps.`,
        },
        metrics: { consistent: `per op`, available: `yes`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...Ea(),
            card: S(
              { x: 7, y: 0, z: 0, dx: 60, dy: -230 },
              `Strongest → weakest`,
              [
                `linearizable   everyone sees the latest`,
                `causal         effects after causes`,
                `read-your-writes  you see your own`,
                `monotonic      never go back in time`,
                `eventual       copies converge… later`,
              ],
              { icon: `layers` },
            ),
          },
          links: Da,
          flows: [
            {
              fanout: !0,
              routes: [{ path: [`c1`] }, { path: [`c2`] }],
              kind: `write`,
              rate: 0.5,
              bounce: !0,
            },
            { fanout: !0, routes: [{ path: [`c2`] }, { path: [`c3`] }], rate: 0.5, bounce: !0 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>A <b>partition</b> splits copies that can each still serve users.</li>
          <li>During one, choose <b>consistency</b> (refuse) or <b>availability</b> (answer, maybe stale).</li>
          <li>Available systems are <b>eventually consistent</b> and must resolve conflicts — without trusting wall clocks.</li>
          <li><b>Quorums</b> (W + R > N) tune the trade-off per request.</li>
          <li>Pick the <b>weakest consistency</b> each operation can tolerate.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Consensus & Leader Election</b> — how a group of servers agrees on one truth, even when some of them can’t be reached.`,
        },
        metrics: { consistent: `yes`, available: `yes`, errors: 0, conflicts: 0 },
        scene: {
          entities: { ...Ea() },
          links: Da,
          flows: [
            {
              fanout: !0,
              routes: [{ path: [`c1`] }, { path: [`c2`] }],
              kind: `write`,
              rate: 0.5,
              bounce: !0,
            },
            { fanout: !0, routes: [{ path: [`c2`] }, { path: [`c3`] }], rate: 0.5, bounce: !0 },
          ],
        },
      },
    ],
  };

const ka = { a: [0, -5], b: [-10, 7], c: [10, 7] };

const M = (e, t = [], n = {}) =>
    b(ka[e][0], ka[e][1], {
      r: 1.9,
      glyph: `database`,
      label: `node ${e.toUpperCase()}`,
      tags: t,
      ...n,
    });

const Aa = (e = {}) => d(0, -17, { label: [`App`, `Server 1`], ...e });

const ja = (e = {}) => d(-22, 7, { label: [`App`, `Server 2`], ...e });

const Ma = (e) => ({ text: `leader · term ${e}`, tone: `green`, icon: `flag` });

const Na = { text: `follower`, icon: `check` };

const Pa = { heads: `none`, style: `cut` };

const N = {
    w1a: (e = {}) => h(`app1`, `a`, [`app1`, `a`], { heads: `both`, ...e }),
    w2b: (e = {}) => h(`app2`, `b`, [`app2`, `b`], { heads: `both`, ...e }),
    w1b: (e = {}) => h(`app1`, `b`, [`app1`, [`b-1`, `app1`], `b-1`], { heads: `both`, ...e }),
    w1c: (e = {}) => h(`app1`, `c`, [`app1`, [`c+1`, `app1`], `c+1`], { heads: `both`, ...e }),
    ab: (e = {}) => h(`a`, `b`, [`a`, [`b`, `a`], `b`], e),
    ac: (e = {}) => h(`a`, `c`, [`a`, [`c`, `a`], `c`], e),
    ba: (e = {}) => h(`b`, `a`, [`b`, [`b`, `a`], `a`], e),
    bc: (e = {}) => h(`b`, `c`, [`b`, `c`], e),
    ca: (e = {}) => h(`c`, `a`, [`c`, [`c`, `a`], `a`], e),
    cb: (e = {}) => h(`c`, `b`, [`c`, `b`], e),
  };

const Fa = () => ({
    xab: N.ab({ ...Pa, label: `✕ cut off`, labelTone: `red`, labelAt: 0.3 }),
    xac: N.ac({ ...Pa }),
  });

const Ia = (e, t = 0.8, n = {}) => ({ route: e, kind: `write`, rate: t, bounce: !0, ...n });

const La = (e, t = `write`, n = 0.8, r = {}) => ({
    fanout: !0,
    routes: e.map((e) => ({ path: [e] })),
    kind: t,
    rate: n,
    ...r,
  });

const Ra = (e, t, n, r = {}) => S({ x: -10, y: 7, z: 0, dx: 190, dy: -125, ...r }, e, t, { icon: n });

const za = (e = {}) => ({ a: M(`a`, e.a || [Na]), b: M(`b`, e.b || [Ma(2)]), c: M(`c`, e.c || [Na]) });

const Ba = () => ({ w1b: N.w1b(), w2b: N.w2b(), ba: N.ba(), bc: N.bc() });

const Va = () => [Ia([`w1b`], 0.6), Ia([`w2b`], 0.6), La([`ba`, `bc`], `write`, 0.9)];

const Ha = () => ({ w1c: N.w1c(), ca: N.ca(), cb: N.cb() });

const Ua = {
    id: `consensus`,
    title: `Consensus & Leader Election`,
    summary: `How a group of servers agrees on one leader and one history — even when some of them can’t be reached.`,
    minutes: 14,
    level: `advanced`,
    metrics: [`leaders`, `term`, `writes`, `canLose`],
    legend: [
      [`write`, `write / log entry`],
      [`msg`, `vote request`],
      [`ping`, `heartbeat`],
      [`poison`, `stale leader’s write`],
      `fail`,
    ],
    goals: [
      { text: `Why naive failover causes split brain`, step: 1 },
      { text: `Majority quorums — and why they overlap`, step: 2 },
      { text: `Terms, votes and elections (Raft)`, step: 3 },
      { text: `When a write counts as committed`, step: 4 },
      { text: `How many nodes a cluster needs`, step: 6 },
      { text: `Fencing tokens for paused leaders`, step: 8 },
    ],
    steps: [
      {
        short: `One leader`,
        chapter: `setup`,
        title: `One leader, two followers`,
        body: [
          `From <em>Replication</em>: one <span class="term">leader</span> takes every write and copies it to its followers. If the leader dies, a follower is promoted and carries on.`,
          `That sentence hides one of the hardest questions in distributed systems: <b>who decides</b> the leader is dead — and what happens if they’re wrong?`,
        ],
        callout: {
          kind: `insight`,
          text: `From the outside, a crashed server, a slow server and a server behind a broken cable all look exactly the same: silence.`,
        },
        metrics: { leaders: 1, term: `—`, writes: `ok`, canLose: `?` },
        scene: {
          entities: {
            app1: Aa(),
            a: M(`a`, [{ text: `leader`, tone: `green`, icon: `flag` }]),
            b: M(`b`, [Na]),
            c: M(`c`, [Na]),
          },
          links: { w1a: N.w1a(), ab: N.ab({ label: `replication`, labelAt: 0.3 }), ac: N.ac() },
          flows: [Ia([`w1a`]), La([`ab`, `ac`])],
        },
      },
      {
        short: `Split brain`,
        chapter: `problem`,
        title: `Two leaders at once`,
        body: [
          `A network fault cuts A off from B and C. A is alive and still serving App Server 1 — but B hears nothing, assumes the leader is dead, and promotes itself.`,
          `Now two leaders accept writes. Through A, seat 7 is sold to Ana; through B, the same seat is sold to Ben. Two histories that can never be merged cleanly: <span class="term">split brain</span>.`,
        ],
        callout: {
          kind: `warn`,
          text: `A timeout can tell you a server is unreachable. It can never tell you the server is dead.`,
        },
        changes: [
          `− Network between A and the others is cut`,
          `+ B promotes itself`,
          `− Two leaders, two different histories`,
        ],
        metrics: { leaders: 2, term: `—`, writes: `diverging`, canLose: `?` },
        scene: {
          entities: {
            app1: Aa(),
            app2: ja(),
            a: M(`a`, [{ text: `leader · seat 7 → Ana`, tone: `red`, icon: `flag` }]),
            b: M(`b`, [{ text: `leader · seat 7 → Ben`, tone: `red`, icon: `flag` }]),
            c: M(`c`, [Na]),
          },
          links: { w1a: N.w1a(), w2b: N.w2b(), ...Fa(), bc: N.bc() },
          flows: [Ia([`w1a`]), Ia([`w2b`]), La([`bc`])],
        },
      },
      {
        short: `Majority`,
        chapter: `solution`,
        title: `The rule: nothing counts without a majority`,
        body: [
          `The fix is one rule. A leader is only elected — and a write only confirmed — when <b>more than half</b> of all nodes agree. With three nodes, that’s two.`,
          `Cut off, A can reach only itself: 1 of 3. It can’t confirm anything, so App Server 1’s writes wait and time out. B and C are 2 of 3: they may elect a leader and carry on. Any two majorities share at least one node, so two leaders can never both win.`,
        ],
        callout: {
          kind: `insight`,
          text: `This is CAP in practice: the minority side gives up availability so that the data stays consistent.`,
        },
        changes: [
          `+ Rule: every decision needs 2 of 3`,
          `~ A alone → can’t confirm writes`,
          `~ B + C → a valid majority`,
        ],
        metrics: { leaders: 1, term: 2, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: Aa(),
            app2: ja(),
            a: M(`a`, [{ text: `1 of 3 · can’t commit`, tone: `amber`, icon: `lock` }]),
            b: M(`b`, [Ma(2)]),
            c: M(`c`, [Na]),
            card: Ra(
              `Majority (quorum)`,
              [
                `3 nodes → 2 must agree`,
                `5 nodes → 3 must agree`,
                `= two majorities always overlap`,
                `# so only one side can ever decide`,
              ],
              `scale`,
            ),
          },
          links: { w1a: N.w1a({ fail: 1 }), w2b: N.w2b(), ...Fa(), bc: N.bc() },
          flows: [Ia([`w1a`]), Ia([`w2b`]), La([`bc`])],
        },
      },
      {
        short: `Election`,
        chapter: `technique`,
        title: `How a leader gets elected`,
        body: [
          `This is the <span class="term">Raft</span> algorithm. A leader sends regular heartbeats. Every follower runs a timer of <em>random</em> length; if it runs out with no heartbeat, that follower becomes a <b>candidate</b>.`,
          `B’s timer fires first. It starts <span class="term">term</span> 2, votes for itself and asks the others. A node gives one vote per term, and only to a candidate whose log is at least as complete as its own. C says yes — 2 of 3 — so B leads term 2.`,
        ],
        callout: {
          kind: `tip`,
          text: `Random timers mean two nodes rarely stand at once. If the vote does split, nobody wins, the timers restart, and the next term settles it — usually within a second.`,
        },
        changes: [
          `+ B: no heartbeat → candidate for term 2`,
          `+ C votes for B`,
          `~ B wins 2 of 3 and starts sending heartbeats`,
        ],
        metrics: { leaders: 1, term: 2, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: Aa(),
            app2: ja(),
            a: M(`a`, [{ text: `still on term 1`, tone: `amber`, icon: `clock` }]),
            b: M(`b`, [Ma(2)]),
            c: M(`c`, [{ text: `voted for B`, tone: `green`, icon: `check` }]),
            card: Ra(
              `Election · term 2`,
              [
                `B: timer fires — no heartbeat`,
                `B: term 1 → 2, votes for itself`,
                `B → C: “vote for me?”`,
                `= C: yes → 2 of 3 → B leads`,
                `# one vote per node per term`,
              ],
              `flag`,
            ),
          },
          links: {
            w1a: N.w1a({ fail: 1 }),
            w2b: N.w2b(),
            ...Fa(),
            bc: N.bc({ heads: `both`, label: `vote for me? · term 2` }),
          },
          flows: [
            Ia([`w1a`], 0.5),
            { route: [`bc`], kind: `msg`, rate: 0.7, bounce: !0 },
            { route: [`bc`], kind: `ping`, rate: 0.9 },
          ],
        },
      },
      {
        short: `Commit`,
        chapter: `technique`,
        title: `A write is committed by a majority`,
        body: [
          `Writes follow the same rule. App Server 2 sends <code>seat 7 → Ben</code> to the leader. B appends it to its <span class="term">log</span> and sends it to the followers.`,
          `As soon as a majority has stored the entry — B and C — it is <b>committed</b>. Only then does B apply it and answer “saved”. A committed entry survives any failure that leaves a majority standing.`,
        ],
        callout: {
          kind: `insight`,
          text: `Every node applies the same log entries in the same order, so every node ends up in the same state. That’s a <b>replicated state machine</b> — the idea underneath all of this.`,
        },
        changes: [
          `+ B appends entry 4 to its log`,
          `+ C stores it → 2 of 3`,
          `~ Committed → App Server 2 hears “saved”`,
        ],
        metrics: { leaders: 1, term: 2, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: Aa(),
            app2: ja(),
            a: M(`a`, [
              { text: `log 1 2 3 · 4′ Ana, unconfirmed`, tone: `amber`, icon: `listOrdered` },
            ]),
            b: M(`b`, [Ma(2), { text: `log 1 2 3 · 4 Ben ✓`, tone: `green`, icon: `listOrdered` }]),
            c: M(`c`, [{ text: `log 1 2 3 · 4 Ben ✓`, tone: `green`, icon: `listOrdered` }]),
            card: Ra(
              `Commit rule`,
              [
                `1  leader appends the entry`,
                `2  sends it to every follower`,
                `3  a majority has stored it`,
                `= committed → reply “saved”`,
              ],
              `listOrdered`,
            ),
          },
          links: {
            w1a: N.w1a({ fail: 1 }),
            w2b: N.w2b(),
            ...Fa(),
            bc: N.bc({ heads: `both`, label: `append entry 4` }),
          },
          flows: [Ia([`w1a`], 0.5), Ia([`w2b`, `bc`], 0.7)],
        },
      },
      {
        short: `Heal`,
        chapter: `solution`,
        title: `The old leader steps down`,
        body: [
          `The network heals. A — still believing it leads term 1 — receives a heartbeat from B stamped <b>term 2</b>. A higher term always wins: A becomes a follower at once.`,
          `A’s log holds one entry that never reached a majority: Ana’s booking, which App Server 1 was never told had succeeded. A discards it and copies B’s log instead. All three nodes are identical again, and nothing that was confirmed has been lost.`,
        ],
        callout: {
          kind: `tip`,
          text: `Terms are a logical clock. Nobody compares wall-clock times — only “whose term number is higher?”`,
        },
        changes: [
          `+ Network restored`,
          `~ A sees term 2 → steps down`,
          `− A’s unconfirmed entry discarded`,
          `~ A copies the log from B · apps follow the leader`,
        ],
        metrics: { leaders: 1, term: 2, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: Aa(),
            app2: ja(),
            ...za({ a: [{ text: `follower · term 2 · caught up`, tone: `green`, icon: `check` }] }),
          },
          links: { ...Ba(), ba: N.ba({ label: `heartbeat · term 2`, labelAt: 0.3 }) },
          flows: [...Va(), La([`ba`, `bc`], `ping`, 0.7)],
        },
      },
      {
        short: `How many`,
        chapter: `insight`,
        title: `How many nodes?`,
        body: [
          `A cluster of <b>N</b> nodes needs ⌊N/2⌋ + 1 votes, so it keeps working with ⌊(N − 1)/2⌋ of them down. Three nodes survive one failure; five survive two.`,
          `A fourth node is a trap: the majority becomes 3, so you still survive only one failure — with one more machine that can fail. Use odd sizes, and put each node in a different zone so one outage can’t take a majority with it.`,
        ],
        callout: {
          kind: `tip`,
          text: `Three or five is typical. Every write waits for more acknowledgements as the cluster grows, so bigger clusters get slower, not safer.`,
        },
        changes: [`+ One node per availability zone`],
        metrics: { leaders: 1, term: 2, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: Aa(),
            app2: ja(),
            ...za({
              a: [{ text: `zone 1`, icon: `building` }],
              b: [Ma(2), { text: `zone 2`, icon: `building` }],
              c: [{ text: `zone 3`, icon: `building` }],
            }),
            card: Ra(
              `Nodes → majority → can lose`,
              [`3  →  2  →  1`, `! 4  →  3  →  1   no gain`, `5  →  3  →  2`, `7  →  4  →  3`],
              `scale`,
            ),
          },
          links: Ba(),
          flows: Va(),
        },
      },
      {
        short: `Zombie`,
        chapter: `problem`,
        title: `Case: the leader that paused`,
        body: [
          `Leader B freezes for twenty seconds — a long garbage-collection pause, or its virtual machine being moved. A and C hear no heartbeats, elect C for term 3, and move on.`,
          `Then B wakes up. As far as it can tell no time has passed, and it is still the leader. Before the next message corrects it, it finishes what it was doing: writing a file to shared storage — straight over the new leader’s work.`,
        ],
        callout: {
          kind: `warn`,
          text: `A node cannot know it was paused. “I checked that I was the leader a moment ago” is never proof that you still are.`,
        },
        changes: [
          `− B freezes for 20 s`,
          `+ A and C elect C · term 3`,
          `− B wakes up and writes as if it still led`,
        ],
        metrics: { leaders: `1 + a zombie`, term: 3, writes: `diverging`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: Aa(),
            a: M(`a`, [Na]),
            b: M(`b`, [{ text: `awake · thinks it leads term 2`, tone: `red`, icon: `alert` }], {
              heat: 0.5,
            }),
            c: M(`c`, [Ma(3)]),
            store: b(0, 19, {
              r: 1.8,
              glyph: `file`,
              color: `store`,
              label: `shared storage`,
              tags: [{ text: `report.csv · overwritten by B`, tone: `red`, icon: `alert` }],
            }),
          },
          links: {
            ...Ha(),
            sb: h(`b`, `store`, [`b`, [`b`, `store`], `store`], {
              label: `write (stale)`,
              labelTone: `red`,
              labelAt: 0.62,
            }),
            sc: h(`c`, `store`, [`c`, [`c`, `store`], `store`]),
          },
          flows: [
            Ia([`w1c`], 0.6),
            La([`ca`], `write`, 0.7),
            { route: [`sc`], kind: `write`, rate: 0.5 },
            { route: [`sb`], kind: `poison`, rate: 0.7 },
          ],
        },
      },
      {
        short: `Fencing`,
        chapter: `solution`,
        title: `Fencing tokens`,
        body: [
          `The fix doesn’t depend on B noticing anything. Every request a leader sends carries its <b>term number</b> as a <span class="term">fencing token</span>, and the storage remembers the highest token it has seen.`,
          `C has already written with token 3. When B’s write arrives carrying token 2, the storage refuses it. The stale leader is fenced off by the resource itself.`,
        ],
        callout: {
          kind: `tip`,
          text: `The same goes for distributed locks: the lock service must hand out an increasing number with each lock, and the protected resource must check it. A lock that only says “it’s yours” is not safe.`,
        },
        changes: [
          `+ Every write carries the leader’s term`,
          `+ Storage rejects tokens older than the newest it has seen`,
          `~ B’s write refused: 2 < 3`,
        ],
        metrics: { leaders: 1, term: 3, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: Aa(),
            a: M(`a`, [Na]),
            b: M(`b`, [{ text: `refused → steps down`, tone: `amber`, icon: `undo` }]),
            c: M(`c`, [Ma(3)]),
            store: b(0, 19, {
              r: 1.8,
              glyph: `file`,
              color: `store`,
              label: `shared storage`,
              tags: [{ text: `highest token seen: 3`, tone: `green`, icon: `shield` }],
            }),
          },
          links: {
            ...Ha(),
            sb: h(`b`, `store`, [`b`, [`b`, `store`], `store`], {
              label: `token 2 ✕`,
              labelTone: `red`,
              labelAt: 0.62,
              fail: 1,
            }),
            sc: h(`c`, `store`, [`c`, [`c`, `store`], `store`], {
              label: `token 3 ✓`,
              labelAt: 0.4,
            }),
          },
          flows: [
            Ia([`w1c`], 0.6),
            La([`ca`, `cb`], `write`, 0.7),
            { route: [`sc`], kind: `write`, rate: 0.5 },
            { route: [`sb`], kind: `poison`, rate: 0.7 },
          ],
        },
      },
      {
        short: `The price`,
        chapter: `tradeoff`,
        title: `What consensus costs`,
        body: [
          `Every write waits for a round trip to a majority. Inside one data center that’s a millisecond or two; with nodes in different regions it’s 50–150 ms on <em>every</em> write.`,
          `All writes pass through one leader, so throughput is capped by a single machine. And when no majority can be reached, the cluster accepts no writes at all — on purpose.`,
        ],
        callout: {
          kind: `warn`,
          text: `Consensus buys correctness with latency and availability. Spend it on the small, critical decisions — not on every like and page view.`,
        },
        changes: [
          `~ Each write: + 1 majority round trip`,
          `~ An election pauses writes for about a second`,
        ],
        metrics: { leaders: 1, term: 3, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: Aa(),
            a: M(`a`, [Na]),
            b: M(`b`, [Na]),
            c: M(`c`, [Ma(3), { text: `waits for 1 more ack`, icon: `hourglass` }]),
            card: Ra(
              `The bill`,
              [
                `every write: + 1 majority round trip`,
                `one leader → one machine’s throughput`,
                `! no majority → no writes`,
                `# an election pauses writes ≈ 1 s`,
              ],
              `dollar`,
            ),
          },
          links: Ha(),
          flows: [Ia([`w1c`], 0.7), La([`ca`, `cb`], `write`, 0.7, { bounce: !0 })],
        },
      },
      {
        short: `In practice`,
        chapter: `insight`,
        title: `You use it far more than you write it`,
        body: [
          `Almost nobody implements Raft or Paxos themselves. You run a small consensus cluster — <b>etcd</b>, <b>ZooKeeper</b> or <b>Consul</b> — and keep only the critical facts in it: who the leader is, what the configuration says, who holds which lock.`,
          `Everything else leans on it. Kubernetes keeps all its cluster state in etcd. Kafka elects its controllers with Raft. Databases such as CockroachDB, Spanner and MongoDB run consensus inside every shard or replica set to decide failover.`,
        ],
        callout: {
          kind: `insight`,
          text: `When the Replication lesson said “promote the most up-to-date follower”, this is the machinery that makes it safe.`,
        },
        changes: [`+ Three systems that depend on the cluster`],
        metrics: { leaders: 1, term: 3, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            cz: x({ x0: -13.5, x1: 13.5, y0: -8.5, y1: 10.5 }, `CONSENSUS CLUSTER · etcd`),
            a: M(`a`, [Na]),
            b: M(`b`, [Na]),
            c: M(`c`, [Ma(3)]),
            k8s: d(-11, -18, {
              color: `purple`,
              glyph: `box`,
              label: [`Kubernetes`],
              sub: `cluster state`,
            }),
            dbf: d(0, -18, {
              color: `orange`,
              glyph: `database`,
              label: [`Database`],
              sub: `who is primary?`,
            }),
            job: d(11, -18, {
              color: `green`,
              glyph: `clock`,
              label: [`Scheduler`],
              sub: `one runner lock`,
            }),
          },
          links: {
            ca: N.ca(),
            cb: N.cb(),
            u1: h(`k8s`, `b`, [`k8s`, `b-1`], { heads: `both` }),
            u2: h(`dbf`, `a`, [`dbf`, `a`], { heads: `both` }),
            u3: h(`job`, `c`, [`job`, `c+1`], { heads: `both` }),
          },
          flows: [
            {
              routes: [{ path: [`u1`] }, { path: [`u2`] }, { path: [`u3`] }],
              rate: 1.6,
              bounce: !0,
            },
            La([`ca`, `cb`], `write`, 0.6),
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>A timeout can’t tell <b>dead</b> from <b>unreachable</b> — naive failover risks split brain.</li>
          <li><b>Majority rule</b>: elections and writes need more than half the nodes, and two majorities always overlap.</li>
          <li><b>Terms</b> order the leaders: a higher term wins and a stale leader steps down.</li>
          <li>A write is <b>committed</b> once a majority has logged it — never before.</li>
          <li>Run <b>3 or 5</b> nodes across zones, and use <b>fencing tokens</b> for anything outside the log.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Transactions & Isolation</b> — keeping one database correct when many requests change it at once.`,
        },
        metrics: { leaders: 1, term: 3, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: { app1: Aa(), a: M(`a`, [Na]), b: M(`b`, [Na]), c: M(`c`, [Ma(3)]) },
          links: Ha(),
          flows: [Ia([`w1c`], 0.7), La([`ca`, `cb`], `write`, 0.7)],
        },
      },
    ],
  };

const Wa = (e = []) => y(-7, -18, { label: `Ana`, tags: e });

const Ga = (e = []) => y(7, -18, { label: `Ben`, tags: e });

const Ka = () => ({ a1: d(-7, -6, { label: [`Server 1`] }), a2: d(7, -6, { label: [`Server 2`] }) });

const qa = (e = [], t = {}) =>
    b(0, 6, { r: 2.1, h: 44, glyph: `ticket`, label: `tickets DB`, tags: e, ...t });

const Ja = (e, t = `paper`, n = ``) => ({ text: `seat 7 · left: ${e}${n}`, tone: t, icon: `ticket` });

const Ya = (e = {}) => ({
    aa: h(`ana`, `a1`, [`ana`, `a1`], { heads: `both` }),
    bb: h(`ben`, `a2`, [`ben`, `a2`], { heads: `both` }),
    ad: h(`a1`, `db`, [`a1`, [`a1`, `db`], `db`], { heads: `both`, ...(e.ad || {}) }),
    bd: h(`a2`, `db`, [`a2`, [`a2`, `db`], `db`], { heads: `both`, ...(e.bd || {}) }),
  });

const Xa = (e = {}) => [
    { route: [`aa`, `ad`], kind: `mine`, rate: 0.75, bounce: !0, ...(e.ana || {}) },
    { route: [`bb`, `bd`], kind: `req`, rate: 0.75, bounce: !0, ...(e.ben || {}) },
  ];

const Za = (e, t, n, r = {}) => S({ x: 0, y: 6, z: 0, dx: 125, dy: -150 }, e, t, { icon: n, ...r });

const Qa = Za(
    `Book a seat`,
    [
      `n = SELECT left FROM seats WHERE id = 7`,
      `if n > 0:`,
      `  UPDATE seats SET left = {n − 1}`,
      `  INSERT INTO bookings …`,
      `# n − 1 is worked out in the app`,
    ],
    `listOrdered`,
  );

const $a = {
    id: `transactions`,
    title: `Transactions & Isolation`,
    summary: `Two people, one seat, the same millisecond. How databases keep concurrent changes correct.`,
    minutes: 14,
    level: `intermediate`,
    metrics: [`seatsLeft`, `sold`, `oversold`, `lockWait`],
    legend: [[`mine`, `Ana’s booking`], [`req`, `Ben’s booking`], `res`, `fail`],
    goals: [
      { text: `How read-then-write races oversell`, step: 1 },
      { text: `Row locks and atomic updates`, step: 4 },
      { text: `Optimistic concurrency and isolation levels`, step: 6 },
      { text: `Phantoms and write skew`, step: 7 },
      { text: `Deadlocks and constraints as a safety net`, step: 9 },
      { text: `Short transactions with holds that expire`, step: 11 },
    ],
    steps: [
      {
        short: `Last seat`,
        chapter: `setup`,
        title: `One seat left`,
        body: [
          `Ana and Ben both want the last seat at a concert. Their requests land on different app servers, which share one database.`,
          `The booking code looks reasonable: <b>read</b> how many seats are left, and if there’s one, <b>write</b> the booking.`,
        ],
        callout: {
          kind: `insight`,
          text: `Each request on its own is correct. The trouble only appears when two run at the same time.`,
        },
        metrics: { seatsLeft: 1, sold: 0, oversold: `no`, lockWait: 0 },
        scene: {
          entities: { ana: Wa(), ben: Ga(), ...Ka(), db: qa([Ja(1)]), card: Qa },
          links: Ya(),
          flows: Xa({ ana: { rate: 0.5 }, ben: { rate: 0.5 } }),
        },
      },
      {
        short: `Race`,
        chapter: `problem`,
        title: `Both of them get it`,
        body: [
          `Both servers read “1 seat left” before either has written. Both decide the seat is free, both write, and both send a confirmation.`,
          `One seat, two tickets. This is a <span class="term">race condition</span> — here a <b>lost update</b>: Ben’s write silently overwrote Ana’s.`,
        ],
        callout: {
          kind: `warn`,
          text: `Races are rare in testing and common in production — exactly when it’s busiest, like the moment tickets go on sale.`,
        },
        changes: [`+ Both read “1 left”`, `+ Both write “0 left”`, `− Seat 7 sold twice`],
        metrics: { seatsLeft: 0, sold: `2 for 1 seat`, oversold: `yes`, lockWait: 0 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ...Ka(),
            db: qa([Ja(0, `red`, ` · 2 bookings!`)], { heat: 0.5 }),
            card: Za(`What happened`, [], `timer`, {
              chart: `bars`,
              bars: [
                { label: `Ana reads`, from: 0, to: 0.18, tone: `violet`, note: `left = 1` },
                { label: `Ben reads`, from: 0.1, to: 0.28, tone: `amber`, note: `left = 1` },
                { label: `Ana writes`, from: 0.36, to: 0.54, tone: `violet`, note: `left = 0` },
                { label: `Ben writes`, from: 0.48, to: 0.66, tone: `red`, note: `left = 0 !` },
              ],
            }),
          },
          links: Ya(),
          flows: Xa(),
        },
      },
      {
        short: `Not enough`,
        chapter: `insight`,
        title: `A transaction alone doesn’t stop it`,
        body: [
          `Wrap it in <code>BEGIN … COMMIT</code> and the booking becomes all-or-nothing — but it can still be sold twice. Under the default isolation level of most databases (<b>read committed</b>), each read simply sees the latest committed value: 1.`,
          `<span class="term">Isolation</span> is the part of a transaction that says what concurrent transactions can see of each other. The default is deliberately weak, for speed.`,
        ],
        callout: {
          kind: `tip`,
          text: `ACID’s “I” is a dial, not a switch. Know which level your database uses by default (PostgreSQL and SQL Server: read committed; MySQL: repeatable read).`,
        },
        changes: [`+ BEGIN … COMMIT around the booking`, `− Still sold twice`],
        metrics: { seatsLeft: 0, sold: `2 for 1 seat`, oversold: `yes`, lockWait: 0 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ...Ka(),
            db: qa([Ja(0, `red`, ` · 2 bookings!`), { text: `read committed`, icon: `layers` }], {
              heat: 0.5,
            }),
            card: Za(
              `Inside a transaction`,
              [
                `BEGIN`,
                `  SELECT left …          → 1 (both!)`,
                `  UPDATE … INSERT …`,
                `COMMIT`,
                `! all-or-nothing ≠ one-at-a-time`,
              ],
              `lock`,
            ),
          },
          links: Ya({ ad: { label: `BEGIN … COMMIT`, labelAt: 0.3 } }),
          flows: Xa(),
        },
      },
      {
        short: `Lock`,
        chapter: `solution`,
        title: `Lock the row while you decide`,
        body: [
          `Read with <code>SELECT … FOR UPDATE</code>. Ana’s transaction locks row 7; when Ben’s tries to read it, the database makes him <b>wait</b> until Ana commits (watch his request hold at the database).`,
          `Then Ben reads the new value — 0 — and gets a polite “sold out”.`,
        ],
        callout: {
          kind: `tip`,
          text: `Locks are held until COMMIT, so keep these transactions short: never wait for a user, a payment API or anything slow while holding one.`,
        },
        changes: [
          `~ Read with FOR UPDATE`,
          `+ Ben waits ~40 ms for Ana’s lock`,
          `~ Seat sold once`,
        ],
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 40 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `sold out · sorry`, tone: `amber` }]),
            ...Ka(),
            db: qa([Ja(0, `green`), { text: `row 7 locked by Ana`, tone: `violet`, icon: `lock` }]),
          },
          links: Ya({ bd: { label: `waits for the lock`, labelTone: `amber`, labelAt: 0.3 } }),
          flows: Xa({ ben: { hold: 1.4 } }),
        },
      },
      {
        short: `Atomic`,
        chapter: `technique`,
        title: `Or do it in one statement`,
        body: [
          `Often you don’t need to read first at all. Let the database check and change in one atomic step:`,
          `<code>UPDATE seats SET left = left − 1 WHERE id = 7 AND left > 0</code> — then look at how many rows it changed. 1 means you got the seat; 0 means it was gone.`,
        ],
        callout: {
          kind: `tip`,
          text: `Counters, stock levels and balances are usually safest as a single conditional UPDATE. No gap between check and change, no lock held across round trips.`,
        },
        changes: [`~ Check and change in one UPDATE`, `~ Ben’s update changes 0 rows → sold out`],
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 2 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `sold out · sorry`, tone: `amber` }]),
            ...Ka(),
            db: qa([Ja(0, `green`)]),
            card: Za(
              `One atomic statement`,
              [
                `UPDATE seats SET left = left − 1`,
                ` WHERE id = 7 AND left > 0`,
                `= Ana: 1 row changed → booked`,
                `# Ben: 0 rows changed → sold out`,
              ],
              `zap`,
            ),
          },
          links: Ya(),
          flows: Xa({ ben: { rate: 0.6 } }),
        },
      },
      {
        short: `Versions`,
        chapter: `technique`,
        title: `Optimistic: check a version number`,
        body: [
          `Locks are <em>pessimistic</em>: they assume a conflict and make others wait. <span class="term">Optimistic concurrency</span> assumes conflicts are rare: read the row with its version, then write <code>… WHERE id = 7 AND version = 8</code>, bumping it to 9.`,
          `If someone got there first, the version no longer matches, the write changes 0 rows, and you reload and try again. Nobody waits.`,
        ],
        callout: {
          kind: `insight`,
          text: `Ideal when users edit things for a while — a document, a profile, a cart. Holding a lock for minutes would block everyone.`,
        },
        changes: [
          `+ version column`,
          `~ Ben’s write rejected (version changed) → retries → sold out`,
        ],
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 0 },
        scene: {
          entities: {
            ana: Wa([{ text: `v8 → v9 ✓`, tone: `green` }]),
            ben: Ga([{ text: `v8 is stale · retry`, tone: `amber`, icon: `replay` }]),
            ...Ka(),
            db: qa([Ja(0, `green`, ` · version 9`)]),
            card: Za(
              `Compare-and-set`,
              [
                `read:  left = 1, version = 8`,
                `write: … SET left = 0, version = 9`,
                `       WHERE id = 7 AND version = 8`,
                `! Ben: 0 rows → reload, retry`,
              ],
              `replay`,
            ),
          },
          links: Ya({ bd: { fail: 0.5 } }),
          flows: Xa(),
        },
      },
      {
        short: `Levels`,
        chapter: `insight`,
        title: `Isolation levels`,
        body: [
          `Databases offer several isolation levels. Stronger ones prevent more anomalies, but make transactions wait or abort more often.`,
          `<table class="compare">
          <thead><tr><th></th><th>Prevents</th><th>Cost</th></tr></thead>
          <tbody>
            <tr><td><b>Read committed</b></td><td>Dirty reads</td><td>Lowest</td></tr>
            <tr><td><b>Snapshot / repeatable read</b></td><td>+ changing reads; lost updates in some databases<sup>1</sup></td><td>Some aborts</td></tr>
            <tr><td><b>Serializable</b></td><td>Everything: as if one at a time</td><td>Most aborts — retry</td></tr>
          </tbody>
        </table>`,
          `<small><sup>1</sup> PostgreSQL aborts the second writer; MySQL’s repeatable read lets the lost update through. Same name, different guarantees — check your database’s documentation.</small>`,
        ],
        callout: {
          kind: `tip`,
          text: `With serializable, the database may abort a transaction rather than allow an anomaly. Your code must catch that and retry.`,
        },
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 0 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `sold out · sorry`, tone: `amber` }]),
            ...Ka(),
            db: qa([Ja(0, `green`), { text: `serializable`, icon: `layers` }]),
          },
          links: Ya(),
          flows: Xa({ ben: { rate: 0.5 } }),
        },
      },
      {
        short: `Phantom`,
        chapter: `problem`,
        title: `Case: locking a row that doesn’t exist yet`,
        body: [
          `A new booking flow drops the seat counter and checks the bookings table instead: “is there a booking for seat 7? No — insert one.” Both transactions even use <code>FOR UPDATE</code>…`,
          `…but there is no row to lock yet. Both see nothing, both insert, and seat 7 is booked twice. A row that appears between your check and your write is a <span class="term">phantom</span>; deciding on what you read and then writing something else is called <span class="term">write skew</span>.`,
        ],
        callout: {
          kind: `tip`,
          text: `Fixes: serializable isolation, locking an existing parent row (the seat itself), or a unique constraint — see the next steps.`,
        },
        changes: [
          `+ Check-then-insert booking flow`,
          `− FOR UPDATE finds no row to lock`,
          `− Seat 7 booked twice`,
        ],
        metrics: { seatsLeft: `—`, sold: `2 for 1 seat`, oversold: `yes`, lockWait: 0 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ...Ka(),
            db: qa([{ text: `bookings: seat 7 × 2`, tone: `red`, icon: `alert` }], { heat: 0.5 }),
            card: Za(
              `Nothing to lock`,
              [
                `SELECT … FROM bookings`,
                `  WHERE seat = 7 FOR UPDATE   → 0 rows`,
                `INSERT INTO bookings (seat = 7)`,
                `! both see 0 rows → both insert`,
              ],
              `lock`,
            ),
          },
          links: Ya(),
          flows: Xa(),
        },
      },
      {
        short: `Deadlock`,
        chapter: `problem`,
        title: `Case: the deadlock`,
        body: [
          `Locks bring their own trap. Ana transfers money from account A to B: she locks A, then asks for B. At the same instant Ben transfers from B to A: he locks B, then asks for A.`,
          `Each waits for the other, forever. The database detects the cycle — immediately in some engines, after about a second in others — and aborts one transaction (Ben’s), which must retry.`,
        ],
        callout: {
          kind: `tip`,
          text: `Prevent it by always taking locks in the same order — for example, lowest account id first. Then a cycle can’t form.`,
        },
        changes: [
          `+ Two transfers lock A and B in opposite orders`,
          `− Both wait on each other`,
          `~ Database aborts Ben’s transaction`,
        ],
        metrics: { seatsLeft: `—`, sold: `—`, oversold: `no`, lockWait: 1e3 },
        scene: {
          entities: {
            ana: Wa([{ text: `transfer A → B`, icon: `dollar` }]),
            ben: Ga([{ text: `aborted · retrying`, tone: `red`, icon: `replay` }]),
            ...Ka(),
            db: qa(
              [
                { text: `Ana holds A · waits for B`, tone: `violet`, icon: `lock` },
                { text: `Ben holds B · waits for A`, tone: `red`, icon: `lock` },
              ],
              { heat: 0.5, glyph: `database`, label: `accounts DB` },
            ),
            card: Za(
              `A wait cycle`,
              [
                `Ana: lock A … waiting for B`,
                `Ben: lock B … waiting for A`,
                `! cycle → database aborts one`,
                `= fix: always lock lowest id first`,
              ],
              `lock`,
            ),
          },
          links: Ya({ bd: { fail: 0.6 } }),
          flows: Xa({ ana: { hold: 1.5 }, ben: { hold: 1.5 } }),
        },
      },
      {
        short: `Constraint`,
        chapter: `solution`,
        title: `Constraints: the last line of defence`,
        body: [
          `Code changes, and someone will eventually write a booking path that forgets the lock. So let the database enforce the rule itself: a <span class="term">unique constraint</span> on <code>(concert, seat)</code> in the bookings table.`,
          `Now a second booking for seat 7 is rejected with a duplicate-key error, whatever the application code does.`,
        ],
        callout: {
          kind: `insight`,
          text: `Encode invariants as constraints — unique, foreign key, check (balance ≥ 0). They hold even when the code has bugs.`,
        },
        changes: [`+ UNIQUE (concert, seat) on bookings`, `~ A duplicate booking is rejected`],
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 0 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `duplicate key · sold out`, tone: `amber` }]),
            ...Ka(),
            db: qa([Ja(0, `green`), { text: `UNIQUE (concert, seat)`, icon: `key` }]),
          },
          links: Ya({ bd: { fail: 0.8 } }),
          flows: Xa(),
        },
      },
      {
        short: `Slow lock`,
        chapter: `problem`,
        title: `Case: a lock held during a payment`,
        body: [
          `To be safe, someone moves the card payment <em>inside</em> the booking transaction: lock seat 7, call the payment provider, then commit. The provider takes 3 seconds.`,
          `For those 3 seconds the seat stays locked, and every other buyer of it waits — each holding a database connection. On sale day the connection pool runs dry and the whole site stalls.`,
        ],
        callout: {
          kind: `warn`,
          text: `Never wait on anything slow — a user, a payment API, an email — while holding a database lock or an open transaction.`,
        },
        changes: [
          `+ Payment call inside the transaction`,
          `~ Seat 7 locked for 3 s per attempt`,
          `− Connection pool exhausted`,
        ],
        metrics: { seatsLeft: 1, sold: 0, oversold: `no`, lockWait: 3e3 },
        scene: {
          entities: {
            ana: Wa([{ text: `paying… (lock held)`, tone: `amber`, icon: `hourglass` }]),
            ben: Ga([{ text: `waiting for seat 7`, tone: `red`, icon: `hourglass` }]),
            ...Ka(),
            pay: d(-16, -6, {
              color: `purple`,
              glyph: `creditCard`,
              label: [`Payment`, `Provider`],
              tags: [{ text: `3 s per charge`, tone: `amber`, icon: `clock` }],
            }),
            db: qa([Ja(1), { text: `locked 3 s · 40 waiting`, tone: `red`, icon: `lock` }], {
              heat: 0.6,
            }),
          },
          links: {
            ...Ya({ bd: { label: `waits for the lock`, labelTone: `red`, labelAt: 0.3 } }),
            ap: h(`a1`, `pay`, [`a1`, `pay`], {
              heads: `both`,
              label: `charge card`,
              labelAt: 0.5,
            }),
          },
          flows: [
            { route: [`aa`, `ap`], kind: `mine`, rate: 0.5, bounce: !0, hold: 2.2 },
            { route: [`bb`, `bd`], kind: `req`, rate: 0.9, bounce: !0, hold: 2.4 },
          ],
        },
      },
      {
        short: `Hold`,
        chapter: `solution`,
        title: `Reserve, pay, then confirm`,
        body: [
          `Split it into short steps. Transaction 1 marks seat 7 as <b>held for Ana until 12:10</b> and commits at once. Then she pays — outside any transaction. Transaction 2 marks the seat <b>sold</b>.`,
          `If she never pays, a cleanup job releases holds that have expired. Ben is told immediately that the seat is taken — no waiting, no locks held for seconds.`,
        ],
        callout: {
          kind: `insight`,
          text: `This is the “seat held for 10 minutes” timer on every ticket and airline site. A reservation with an expiry replaces a long lock.`,
        },
        changes: [
          `~ Transaction 1: hold seat (expires 12:10)`,
          `~ Payment outside the transaction`,
          `~ Transaction 2: confirm`,
          `+ Expired holds released`,
        ],
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 2 },
        scene: {
          entities: {
            ana: Wa([{ text: `seat held · paying`, tone: `violet`, icon: `clock` }]),
            ben: Ga([{ text: `seat 7 held · pick another`, tone: `amber` }]),
            ...Ka(),
            pay: d(-16, -6, {
              color: `purple`,
              glyph: `creditCard`,
              label: [`Payment`, `Provider`],
            }),
            db: qa([{ text: `seat 7: held for Ana · 12:10`, tone: `violet`, icon: `clock` }]),
            card: Za(
              `Three short steps`,
              [
                `1. UPDATE seat 7 SET held_by = Ana,`,
                `     held_until = now() + 10 min`,
                `2. charge card (no transaction open)`,
                `3. UPDATE seat 7 SET sold_to = Ana`,
                `# job: release holds past held_until`,
              ],
              `clock`,
            ),
          },
          links: {
            ...Ya(),
            ap: h(`a1`, `pay`, [`a1`, `pay`], {
              heads: `both`,
              label: `charge card`,
              labelAt: 0.5,
            }),
          },
          flows: [
            { route: [`aa`, `ad`], kind: `mine`, rate: 0.6, bounce: !0 },
            { route: [`ap`], kind: `mine`, rate: 0.6, bounce: !0, hold: 1 },
            { route: [`bb`, `bd`], kind: `req`, rate: 0.7, bounce: !0 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>Read-then-write</b> under concurrency causes races and lost updates.</li>
          <li>Fix with <b>row locks</b>, a single <b>atomic UPDATE</b>, or <b>version checks</b>.</li>
          <li>Isolation levels trade correctness for waiting and <b>retries</b>.</li>
          <li>Lock in a <b>consistent order</b>; back rules with <b>constraints</b>.</li>
          <li>Keep transactions <b>short</b>: hold a reservation, never a lock, while waiting on payments.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Files & Media</b> — where photos and videos go instead of the database, and how they get there and back.`,
        },
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 2 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `sold out · sorry`, tone: `amber` }]),
            ...Ka(),
            db: qa([Ja(0, `green`)]),
          },
          links: Ya(),
          flows: Xa({ ben: { rate: 0.5 } }),
        },
      },
    ],
  };

const eo = { x0: -4.5, x1: 4.5, y0: -22, y1: -16 };

const to = (e = `people sharing photos`) => p(eo, 11, e);

const no = (e = {}) => d(0, -6, { label: [`App`, `Servers`], ...e });

const ro = (e = {}) => b(0, 6, { r: 2.1, h: 44, label: `database`, ...e });

const io = (e = {}) => b(-10, 6, { label: `metadata`, ...e });

const ao = (e = {}) =>
    d(10, 6, {
      s: 5,
      h: 40,
      color: `yellow`,
      glyph: `package`,
      label: [`Object`, `Storage`],
      ...e,
    });

const oo = (e = {}) =>
    d(21, 6, { s: 3.8, h: 30, color: `green`, glyph: `workflow`, label: [`Workers`], ...e });

const so = (e = {}) => d(10, -8, { color: `orange`, glyph: `globe`, label: [`CDN`], ...e });

const P = {
    ua: (e = {}) => h(`users`, `app`, [`users`, `app`], { heads: `both`, ...e }),
    ab: (e = {}) => h(`app`, `blob`, [`app`, `blob`], { heads: `both`, ...e }),
    ad: (e = {}) => h(`app`, `db`, [`app`, [`app`, 0], [`db`, 0], `db`], { heads: `both`, ...e }),
    ao: (e = {}) =>
      h(`app`, `obj`, [`app`, [`app`, 0], [`obj`, 0], `obj`], { heads: `both`, ...e }),
    uo: (e = {}) => h(`users`, `obj`, [`users`, [7, `users`], [7, `obj`], `obj`], e),
    oa: (e = {}) =>
      h(`obj`, `app`, [`obj`, [`obj`, 0], [`app`, 0], `app`], { style: `dashed`, ...e }),
    ow: (e = {}) => h(`obj`, `workers`, [`obj`, `workers`], { heads: `both`, ...e }),
    uc: (e = {}) => h(`users`, `cdn`, [`users`, [10, `users`], `cdn`], { heads: `both`, ...e }),
    co: (e = {}) => h(`cdn`, `obj`, [`cdn`, `obj`], { heads: `both`, ...e }),
  };

const co = (e, t, n) => S({ x: 0, y: 0, z: 0 }, e, t, { icon: n });

const lo = (e = {}) => ({
    users: to(),
    app: no(),
    db: io(),
    obj: ao(),
    workers: oo(),
    jq: ee(15.6, 6, 3, [-1, 0]),
    cdn: so(),
    ...e,
  });

const uo = (e = {}) => ({
    ua: P.ua(),
    ad: P.ad(),
    uo: P.uo(),
    oa: P.oa(),
    ow: P.ow(),
    uc: P.uc(),
    co: P.co(),
    ...e,
  });

const fo = () => [
    { route: [`uc`], rate: 3.2, bounce: !0 },
    { route: [`ua`, `ad`], rate: 1, bounce: !0 },
    { route: [`uo`], kind: `heavy`, rate: 0.6 },
    { route: [`ow`], kind: `msg`, rate: 0.6, bounce: !0 },
  ];

const po = {
    dbGrowth: `+1 GB / day`,
    appTraffic: `small requests only`,
    imgLoad: 35,
    storeCost: `$16,800`,
  };

const mo = {
    id: `files`,
    title: `Files & Media`,
    summary: `Photos and videos don’t belong in your database — where they go instead, and how they get there and back.`,
    minutes: 14,
    level: `intermediate`,
    metrics: [`dbGrowth`, `appTraffic`, `imgLoad`, `storeCost`],
    legend: [
      `req`,
      `res`,
      [`heavy`, `file bytes`],
      [`msg`, `event / job`],
      [`write`, `metadata write`],
      `fail`,
    ],
    goals: [
      { text: `Bytes in object storage, metadata in the database`, step: 2 },
      { text: `Direct uploads with presigned URLs; big files in parts`, step: 4 },
      { text: `Processing, CDN delivery and adaptive video`, step: 6 },
      { text: `Keeping metadata and files in step`, step: 9 },
      { text: `Storage classes, lifecycle and private buckets`, step: 10 },
    ],
    steps: [
      {
        short: `BLOBs`,
        chapter: `setup`,
        title: `Photos in the database`,
        body: [
          `The PhotoShare app from <em>Napkin Math</em> started simply: an uploaded photo is saved as a <span class="term">BLOB</span> — a binary column — right next to its caption, owner and date. One database, one backup, one place to look.`,
          `For the first few thousand users it works perfectly well.`,
        ],
        callout: {
          kind: `insight`,
          text: `A photo is a few megabytes; the facts about it — owner, size, caption, when — are a few hundred bytes. They are very different kinds of data.`,
        },
        metrics: {
          dbGrowth: `+2 GB / day`,
          appTraffic: `every photo, both ways`,
          imgLoad: 180,
          storeCost: `—`,
        },
        scene: {
          entities: {
            users: to(),
            app: no(),
            blob: ro({ tags: [{ text: `photos as BLOBs`, icon: `database` }] }),
          },
          links: { ua: P.ua(), ab: P.ab() },
          flows: [{ route: [`ua`, `ab`], kind: `heavy`, rate: 1.2, bounce: !0 }],
        },
      },
      {
        short: `It chokes`,
        chapter: `problem`,
        title: `Two terabytes a day`,
        body: [
          `Now a million photos a day arrive at 2 MB each: <b>2 TB a day</b>, 730 TB in a year. The database, its replicas and its backups all grow by that much. A restore takes days, and every new replica has to copy everything.`,
          `Every photo view also travels through the app servers and the database. Images push the useful rows out of the database’s memory, and queries for captions and likes slow down.`,
        ],
        callout: {
          kind: `warn`,
          text: `Databases are built to search and update small records. Shipping megabytes in and out is expensive work that only gets in the way.`,
        },
        changes: [
          `~ 1 M uploads a day × 2 MB`,
          `− Database, replicas and backups balloon`,
          `− Photo views crowd out everything else`,
        ],
        metrics: {
          dbGrowth: `+2 TB / day`,
          appTraffic: `every photo, both ways`,
          imgLoad: 450,
          storeCost: `—`,
        },
        scene: {
          entities: {
            users: to(),
            app: no(_(0.85)),
            blob: ro({ ..._(0.95), tags: [{ text: `+2 TB / day`, tone: `red`, icon: `alert` }] }),
          },
          links: { ua: P.ua(), ab: P.ab() },
          flows: [{ route: [`ua`, `ab`], kind: `heavy`, rate: 3.4, bounce: !0 }],
        },
      },
      {
        short: `Object storage`,
        chapter: `solution`,
        title: `Bytes in object storage, facts in the database`,
        body: [
          `Move the bytes to <span class="term">object storage</span> — Amazon S3, Google Cloud Storage, Azure Blob Storage. It is a huge key → file store: <code>PUT</code> a file under a key like <code>photos/9f2c.jpg</code>, <code>GET</code> it back. No queries, no joins — and no practical size limit.`,
          `It copies every object across several data centres for you and costs far less per terabyte than database disks. The database keeps one small row per photo: its key, owner, size and type.`,
        ],
        callout: {
          kind: `tip`,
          text: `This split — metadata in a database, bytes in object storage — is how almost every product stores files, from profile pictures to multi-gigabyte videos.`,
        },
        changes: [
          `+ Object storage for the bytes`,
          `~ Database keeps one ~1 KB row per photo`,
          `~ Database growth 2 TB → 1 GB a day`,
        ],
        metrics: {
          dbGrowth: `+1 GB / day`,
          appTraffic: `every photo, both ways`,
          imgLoad: 260,
          storeCost: `$16,800`,
        },
        scene: {
          entities: {
            users: to(),
            app: no(),
            db: io({ tags: [{ text: `key · owner · size · type`, icon: `listOrdered` }] }),
            obj: ao({ tags: [{ text: `photos/9f2c.jpg`, icon: `file` }] }),
          },
          links: { ua: P.ua(), ad: P.ad(), ao: P.ao() },
          flows: [
            { route: [`ua`, `ao`], kind: `heavy`, rate: 1.6, bounce: !0 },
            { route: [`ua`, `ad`], rate: 1.2, bounce: !0 },
          ],
        },
      },
      {
        short: `Through servers`,
        chapter: `problem`,
        title: `Case: a 2 GB video over a phone connection`,
        body: [
          `Uploads still flow <em>through</em> the app servers on their way to storage. A 2 GB video from a phone takes minutes, and the whole time it holds a server connection and memory open — just to pass bytes along.`,
          `The app servers end up sized for bandwidth rather than for the logic they actually run, and a burst of video uploads slows everyone’s page loads.`,
        ],
        callout: {
          kind: `warn`,
          text: `If your servers only relay bytes they don’t look at, they are an expensive middle-man.`,
        },
        changes: [`+ Video uploads, up to 2 GB`, `− Each upload holds an app server for minutes`],
        metrics: {
          dbGrowth: `+1 GB / day`,
          appTraffic: `2 TB / day relayed`,
          imgLoad: 320,
          storeCost: `$16,800`,
        },
        scene: {
          entities: {
            users: to(`people uploading videos`),
            app: no({
              ..._(0.9),
              tags: [{ text: `relaying 2 GB uploads`, tone: `red`, icon: `hourglass` }],
            }),
            db: io(),
            obj: ao(),
          },
          links: { ua: P.ua(), ad: P.ad(), ao: P.ao() },
          flows: [{ route: [`ua`, `ao`], kind: `heavy`, rate: 3, speed: 0.5 }],
        },
      },
      {
        short: `Presigned`,
        chapter: `solution`,
        title: `Upload straight to storage`,
        body: [
          `Instead, the app hands out permission and gets out of the way. The phone asks “may I upload a 2 GB video?”; the app checks the user, writes a <code>pending</code> row, and replies with a <span class="term">presigned URL</span>: a link signed with the app’s key that allows <em>one</em> upload, to <em>one</em> key, for the next 15 minutes.`,
          `The phone sends the bytes directly to object storage. When the upload finishes, storage sends an event and the app marks the row <code>uploaded</code>.`,
        ],
        callout: {
          kind: `tip`,
          text: `The signature can also pin the content type and a maximum size, so the URL can’t be reused to dump anything else into your bucket.`,
        },
        changes: [
          `+ App issues a presigned URL`,
          `+ Phone uploads directly to storage`,
          `+ Storage reports “upload complete”`,
        ],
        metrics: {
          dbGrowth: `+1 GB / day`,
          appTraffic: `small requests only`,
          imgLoad: 260,
          storeCost: `$16,800`,
        },
        scene: {
          entities: {
            users: to(`people uploading videos`),
            app: no(v(0.2)),
            db: io({ tags: [{ text: `status: pending → uploaded`, icon: `refresh` }] }),
            obj: ao(),
            card: co(
              `A presigned upload`,
              [
                `PUT https://bucket…/videos/7a1e.mp4`,
                `  ?expires=900&signature=3b9f…`,
                `= one key · one upload · 15 minutes`,
                `# the app never touches the bytes`,
              ],
              `key`,
            ),
          },
          links: {
            ua: P.ua({ label: `may I upload?` }),
            ad: P.ad(),
            uo: P.uo({ label: `the bytes`, labelAt: 0.3 }),
            oa: P.oa({ label: `upload complete` }),
          },
          flows: [
            { route: [`ua`, `ad`], rate: 1, bounce: !0 },
            { route: [`uo`], kind: `heavy`, rate: 0.9 },
            { route: [`oa`], kind: `msg`, rate: 0.6 },
          ],
        },
      },
      {
        short: `In parts`,
        chapter: `technique`,
        title: `Big files: upload in parts`,
        body: [
          `One 2 GB request over a phone network rarely makes it in one piece. A <span class="term">multipart upload</span> splits the file into parts — say 10 MB each — sent in parallel, each with its own presigned URL.`,
          `A part that fails is simply sent again; a dropped connection resumes from the last part that arrived. When every part is in, one final call stitches them into a single object.`,
        ],
        callout: {
          kind: `tip`,
          text: `Parallel parts are also faster: several connections fill a link better than one. Remove abandoned, half-finished uploads automatically, or you pay to store their parts.`,
        },
        changes: [
          `~ 2 GB → 200 parts of 10 MB`,
          `+ Failed parts retried on their own`,
          `+ Uploads resume after a dropped connection`,
        ],
        metrics: {
          dbGrowth: `+1 GB / day`,
          appTraffic: `small requests only`,
          imgLoad: 260,
          storeCost: `$16,800`,
        },
        scene: {
          entities: {
            users: to(`people uploading videos`),
            app: no(v(0.2)),
            db: io(),
            obj: ao({ tags: [{ text: `parts 1–200 → one object`, icon: `merge` }] }),
            card: co(
              `Multipart upload`,
              [
                `start      → upload id + 200 URLs`,
                `part 1…200  10 MB each, 4 at a time`,
                `! part 37 failed → send part 37 again`,
                `= complete  → videos/7a1e.mp4`,
              ],
              `layers`,
            ),
          },
          links: { ua: P.ua(), ad: P.ad(), uo: P.uo({ fail: 0.12 }), oa: P.oa() },
          flows: [
            { route: [`uo`], kind: `heavy`, rate: 3.6, speed: 0.8 },
            { route: [`ua`, `ad`], rate: 0.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Processing`,
        chapter: `technique`,
        title: `Make the versions people actually download`,
        body: [
          `An original is rarely what you show. Each “upload complete” event goes onto a queue (see <em>Message Queues</em>), and workers make what the app needs: thumbnails and two or three sizes of each photo, a scan for malware, and — before anything is shared — removal of the GPS location hidden in the photo’s metadata.`,
          `Videos are transcoded into several resolutions. When a worker finishes, it saves the new files and marks the row <code>ready</code>; until then the app shows “processing…”.`,
        ],
        callout: {
          kind: `warn`,
          text: `Never trust an upload. Check the real file type, size and content in the workers, not just what the client claimed.`,
        },
        changes: [
          `+ Upload events → job queue → workers`,
          `+ Thumbnails, sizes, transcodes`,
          `+ Location data stripped, malware scan`,
        ],
        metrics: {
          dbGrowth: `+1 GB / day`,
          appTraffic: `small requests only`,
          imgLoad: 120,
          storeCost: `$16,800`,
        },
        scene: {
          entities: {
            users: to(),
            app: no(v(0.2)),
            db: io({ tags: [{ text: `status: ready`, tone: `green`, icon: `check` }] }),
            obj: ao(),
            jq: ee(15.6, 6, 3, [-1, 0]),
            workers: oo({ tags: [{ text: `resize · strip GPS · transcode`, icon: `workflow` }] }),
          },
          links: {
            ua: P.ua(),
            ad: P.ad(),
            uo: P.uo(),
            oa: P.oa(),
            ow: P.ow({ label: `jobs`, labelAt: 0.25 }),
          },
          flows: [
            { route: [`uo`], kind: `heavy`, rate: 0.7 },
            { route: [`ow`], kind: `msg`, rate: 1, bounce: !0 },
            { route: [`oa`, `ad`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `CDN`,
        chapter: `solution`,
        title: `Serve them from the edge`,
        body: [
          `Downloads far outnumber uploads, so they must not come through the app either. Photos are served by a <b>CDN</b> (see <em>Content Delivery</em>) with object storage as its origin: the first viewer in a city pulls a copy to the nearest edge, everyone after gets it from there.`,
          `Give each version a key that changes when its content does — <code>photos/9f2c_w640.webp</code> — and it can be cached for a year without ever going stale.`,
        ],
        callout: {
          kind: `tip`,
          text: `For private photos, the app hands out short-lived signed CDN URLs — the same idea as presigned uploads, in the other direction.`,
        },
        changes: [
          `+ CDN in front of object storage`,
          `~ Views served from the nearest edge`,
          `~ Photo load 120 → 35 ms`,
        ],
        metrics: po,
        scene: { entities: lo(), links: uo(), flows: fo() },
      },
      {
        short: `Video`,
        chapter: `technique`,
        title: `Video: let the player choose`,
        body: [
          `A video file is too big to download before playing, and viewers’ connections vary from second to second. So each video is cut into segments of a few seconds, encoded at several qualities — 240p up to 1080p — with a small playlist file listing them all.`,
          `The player fetches segment by segment from the CDN and picks the quality for the next one from how fast the last one arrived. A train enters a tunnel: the picture drops to 360p instead of freezing. This is <span class="term">adaptive bitrate streaming</span> (HLS or DASH).`,
        ],
        callout: {
          kind: `insight`,
          text: `Small, separately cacheable segments are also what makes video work so well on CDNs: every popular segment ends up at every edge.`,
        },
        changes: [
          `+ Each video: 4-second segments × 5 qualities`,
          `+ Player switches quality segment by segment`,
        ],
        metrics: po,
        scene: {
          entities: lo({
            cdn: so({ tags: [{ text: `segments · 4 s each`, icon: `video` }] }),
            card: co(
              `One video, five qualities`,
              [
                `1080p   5 Mbit/s`,
                ` 720p   3 Mbit/s`,
                `= 480p   1.5 Mbit/s   ← now: 2 Mbit/s link`,
                ` 360p   0.8 Mbit/s`,
                ` 240p   0.4 Mbit/s`,
              ],
              `video`,
            ),
          }),
          links: uo(),
          flows: [
            { route: [`uc`], kind: `heavy`, rate: 2.6, bounce: !0 },
            { route: [`co`], rate: 0.4, bounce: !0 },
          ],
        },
      },
      {
        short: `In step`,
        chapter: `problem`,
        title: `Case: rows without files, files without rows`,
        body: [
          `Two stores can disagree. A phone gets its presigned URL and then loses signal: the row says <code>pending</code> for ever. A user deletes a photo: the row goes, but the files stay — still costing money, and still reachable by anyone who kept the link.`,
          `Fix it like any two-system update (see <em>Sagas</em>): every row has a <b>status</b>; storage events move it forward; deletes remove the row first and queue the file deletions; and a nightly <b>cleanup job</b> clears <code>pending</code> rows older than a day and files that no row points to.`,
        ],
        callout: {
          kind: `tip`,
          text: `Deleting user data is a legal duty in many places. Make sure deletion reaches every copy: sizes, transcodes, backups and the CDN.`,
        },
        changes: [
          `+ Status on every row: pending → uploaded → ready`,
          `+ Deletes: row first, then queued file deletes`,
          `+ Nightly cleanup of orphans`,
        ],
        metrics: po,
        scene: {
          entities: lo({
            db: io({ tags: [{ text: `312 pending > 1 day`, tone: `amber`, icon: `hourglass` }] }),
            sweep: d(-10, -6, {
              s: 3.6,
              h: 28,
              color: `slab`,
              glyph: `refresh`,
              label: [`Cleanup`],
              sub: `nightly`,
            }),
          }),
          links: uo({
            sd: h(`sweep`, `db`, [`sweep`, `db`], { heads: `both` }),
            so: h(`sweep`, `obj`, [`sweep`, [`sweep`, -2], [`obj`, -2], `obj`], {
              style: `dashed`,
              label: `delete orphans`,
              labelAt: 0.35,
            }),
          }),
          flows: [
            ...fo(),
            { route: [`sd`], rate: 0.5, bounce: !0 },
            { route: [`so`], kind: `kill`, rate: 0.5 },
          ],
        },
      },
      {
        short: `Lifecycle`,
        chapter: `tradeoff`,
        title: `Old files can live somewhere cheaper`,
        body: [
          `Most photos are looked at in their first few weeks and hardly ever again. Object stores sell <b>storage classes</b>: standard for hot data, “infrequent access” for less, and archive tiers that cost a fraction as much — but charge more, or take minutes to hours, to read.`,
          `A <span class="term">lifecycle rule</span> moves objects automatically: originals older than 90 days go to an archive tier, while the small sizes people still browse stay hot.`,
        ],
        callout: {
          kind: `warn`,
          text: `Cheap storage with expensive reads is a trap for data you still read often. Check how your files are actually accessed before archiving them.`,
        },
        changes: [
          `+ Lifecycle: originals → archive after 90 days`,
          `~ Storage bill after one year $16,800 → ≈ $6,300 / month`,
        ],
        metrics: { ...po, storeCost: `≈ $6,300` },
        scene: {
          entities: lo({
            obj: ao({
              tags: [{ text: `originals > 90 days → archive`, tone: `green`, icon: `clock` }],
            }),
            card: co(
              `Storage classes · per TB-month`,
              [
                `standard            ≈ $23    hot, cheap to read`,
                `infrequent access   ≈ $12.50  pay per read`,
                `archive             ≈ $1–4   slow or costly to read`,
                `= after a year: 730 TB → ≈ $6,300 / month`,
              ],
              `dollar`,
            ),
          }),
          links: uo(),
          flows: fo(),
        },
      },
      {
        short: `Public bucket`,
        chapter: `problem`,
        title: `Case: the bucket anyone can list`,
        body: [
          `A developer makes the bucket public “to get images showing”. Months later someone discovers they can <b>list</b> it — and download every photo ever uploaded, including private ones and the originals with their location data. Leaks like this are among the most common cloud breaches.`,
          `Keep buckets private and block public access at the account level. Serve through the CDN with signed URLs, give each service a key that can touch only its own paths, and use unguessable object names as a last line, not the only one.`,
        ],
        callout: {
          kind: `warn`,
          text: `A random key is not access control. If a URL is all it takes to read a private file, that URL must expire.`,
        },
        changes: [
          `− Bucket listable by anyone`,
          `+ Public access blocked, CDN with signed URLs`,
          `+ Least-privilege keys per service`,
        ],
        metrics: { ...po, storeCost: `≈ $6,300` },
        scene: {
          entities: lo({
            spy: y(20, -8, { label: `anyone` }),
            obj: ao({ tags: [{ text: `public access blocked`, tone: `green`, icon: `lock` }] }),
          }),
          links: uo({
            so: h(`spy`, `obj`, [`spy`, [20, `obj`], `obj`], {
              fail: 1,
              label: `GET /?list`,
              labelTone: `red`,
              labelAt: 0.3,
            }),
          }),
          flows: [...fo(), { route: [`so`], kind: `poison`, rate: 0.9 }],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>Bytes</b> in object storage, <b>metadata</b> in the database — joined by the object’s key.</li>
          <li>Clients upload <b>directly</b> with presigned URLs; big files go in <b>parts</b> that can be retried and resumed.</li>
          <li><b>Workers</b> make thumbnails, sizes and transcodes — and strip what shouldn’t be shared.</li>
          <li>Serve through a <b>CDN</b> with versioned keys; stream video in <b>adaptive</b> segments.</li>
          <li>Keep rows and files <b>in step</b>, move old files to <b>cheaper classes</b>, and keep buckets <b>private</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `That completes Data & Storage. Next module: <b>Communication</b> — how services talk to each other.`,
        },
        metrics: { ...po, storeCost: `≈ $6,300` },
        scene: { entities: lo(), links: uo(), flows: fo() },
      },
    ],
  };

const ho = (e = []) => y(0, -19, { form: `phone`, w: 5, d: 5, label: `mobile app`, tags: e });

const go = (e = {}) =>
    d(0, -7, {
      label: [`REST`, `API`],
      glyph: `globe`,
      tags: [
        { text: `GET /users/42/followers` },
        { text: `GET /users/42/posts` },
        { text: `GET /users/42` },
      ],
      ...e,
    });

const _o = (e = {}) =>
    d(0, -7, { color: `purple`, label: [`GraphQL`], sub: `one endpoint`, glyph: `braces`, ...e });

const vo = (e = {}) => ({
    us: d(-7, 4, {
      color: `green`,
      glyph: `user`,
      label: [`Users`],
      sub: `service`,
      ...(e.us || {}),
    }),
    ps: d(7, 4, {
      color: `yellow`,
      glyph: `file`,
      label: [`Posts`],
      sub: `service`,
      ...(e.ps || {}),
    }),
  });

const yo = (e = {}) => ({ pa: h(`phone`, `api`, [`phone`, `api`], { heads: `both`, ...e }) });

const bo = (e = {}) => ({
    au: h(`api`, `us`, [`api`, [`us`, `api`], `us`], { heads: `both`, ...e }),
    ap: h(`api`, `ps`, [`api`, [`ps`, `api`], `ps`], { heads: `both`, ...e }),
  });

const xo = (e = 0.7, t) => ({
    fanout: !0,
    routes: [{ path: [`pa`, `au`] }, { path: [`pa`, `ap`] }],
    rate: e,
    bounce: !0,
    kind: t,
  });

const So = (e, t, n) => S({ x: 7, y: 4, z: 0, dx: 70, dy: -250 }, e, t, { icon: n });

const Co = { label: `4G · 100 ms per round trip`, labelTone: `amber` };

// --- communication ---
const wo = {
    id: `apis`,
    title: `REST, RPC & GraphQL`,
    summary: `Three ways for programs to ask each other for things — and what each costs a phone on 4G.`,
    minutes: 11,
    level: `beginner`,
    metrics: [`trips`, `payload`, `screenMs`, `unused`],
    legend: [`req`, `res`, `heavy`, `fail`],
    goals: [
      { text: `What an API contract is`, step: 0 },
      { text: `REST: resources and verbs`, step: 1 },
      { text: `GraphQL: ask for exactly what you need`, step: 3 },
      { text: `RPC between internal services`, step: 5 },
      { text: `Pagination and API versioning`, step: 7 },
    ],
    steps: [
      {
        short: `Contract`,
        chapter: `setup`,
        title: `Programs need a contract`,
        body: [
          `Your mobile app shows a profile: name, avatar, the last three posts and a follower count. The data lives on your servers, so the app has to ask for it.`,
          `An <span class="term">API</span> is the agreed way to ask: which addresses exist, what to send, and what comes back. Here it’s JSON over HTTPS.`,
        ],
        callout: {
          kind: `insight`,
          text: `An API is a promise. Once apps depend on it, changing it without breaking them is a real design problem.`,
        },
        metrics: { trips: `—`, payload: `—`, screenMs: null, unused: `—` },
        scene: {
          entities: { phone: ho(), api: go({ tags: [] }) },
          links: yo({ label: `HTTPS + JSON` }),
          flows: [{ route: [`pa`], rate: 0.9, bounce: !0 }],
        },
      },
      {
        short: `REST`,
        chapter: `technique`,
        title: `REST: resources and verbs`,
        body: [
          `<span class="term">REST</span> treats data as <b>resources</b> with addresses — <code>/users/42</code>, <code>/users/42/posts</code> — and uses HTTP verbs on them: <code>GET</code> to read, <code>POST</code> to create, <code>PUT</code>/<code>PATCH</code> to update, <code>DELETE</code> to remove.`,
          `It’s simple, works with every tool, and <code>GET</code> responses can be cached by browsers and CDNs. <code>GET</code>, <code>PUT</code> and <code>DELETE</code> are also <span class="term">idempotent</span> — repeating one changes nothing more — while <code>POST</code> is not, which matters the moment a client retries.`,
        ],
        callout: {
          kind: `tip`,
          text: `Status codes carry meaning too: 200 OK, 201 Created, 404 Not Found, 429 Too Many Requests, 500 server error.`,
        },
        changes: [`+ Three endpoints for the profile screen`],
        metrics: { trips: 3, payload: `48 KB`, screenMs: 210, unused: 94 },
        scene: {
          entities: {
            phone: ho(),
            api: go(),
            card: So(
              `The profile screen, in REST`,
              [
                `GET /users/42           → 18 KB`,
                `GET /users/42/posts     → 26 KB`,
                `GET /users/42/followers →  4 KB`,
                `# three requests, one after another`,
              ],
              `globe`,
            ),
          },
          links: yo({ label: `HTTPS + JSON` }),
          flows: [{ route: [`pa`], rate: 1.6, bounce: !0 }],
        },
      },
      {
        short: `On 4G`,
        chapter: `problem`,
        title: `Chatty and bloated on a phone`,
        body: [
          `On a phone, each round trip costs about 100 ms. The client makes its three calls one after another — often it has to, because one call needs an id from the previous answer — so the screen waits for all three in a row.`,
          `Each endpoint also returns the <em>whole</em> object: 48 KB arrive to show about 3 KB. That’s <span class="term">over-fetching</span>; needing several calls for one screen is <span class="term">under-fetching</span>.`,
        ],
        callout: {
          kind: `warn`,
          text: `Round trips and wasted bytes hurt most where networks are slowest — exactly where mobile users are.`,
        },
        changes: [
          `~ Network: 4G, 100 ms per round trip`,
          `~ Screen ready 210 → 420 ms`,
          `− 94% of downloaded data unused`,
        ],
        metrics: { trips: 3, payload: `48 KB`, screenMs: 420, unused: 94 },
        scene: {
          entities: {
            phone: ho([{ text: `loading…`, tone: `amber`, icon: `hourglass` }]),
            api: go(),
            card: So(
              `What the screen needs`,
              [
                `name, avatar URL           ~0.4 KB`,
                `last 3 posts + previews    ~2.5 KB`,
                `follower count             ~0.1 KB`,
                `! downloaded 48 KB · used ~3 KB`,
              ],
              `smartphone`,
            ),
          },
          links: yo(Co),
          flows: [{ route: [`pa`], rate: 1.6, bounce: !0, speed: 0.6 }],
        },
      },
      {
        short: `GraphQL`,
        chapter: `solution`,
        title: `GraphQL: ask for exactly what you need`,
        body: [
          `With <span class="term">GraphQL</span>, the client sends one query describing the exact shape it wants. The GraphQL server fetches each part from the services behind it and returns just those fields.`,
          `Watch one request leave the phone, split to the Users and Posts services, and come back as one response.`,
        ],
        callout: {
          kind: `tip`,
          text: `Great when many different clients (iOS, Android, web, TV) each need slightly different data from the same backend.`,
        },
        changes: [
          `~ REST API → GraphQL endpoint`,
          `+ Users and Posts services behind it`,
          `~ 3 round trips → 1`,
          `~ 48 KB → 3 KB`,
        ],
        metrics: { trips: 1, payload: `3 KB`, screenMs: 140, unused: 0 },
        scene: {
          entities: {
            phone: ho(),
            api: _o(),
            ...vo(),
            card: So(
              `One query`,
              [
                `query {`,
                `  user(id: 42) { name avatar`,
                `    posts(last: 3) { title preview }`,
                `    followers { count } }`,
                `}`,
                `= 1 round trip · 3 KB`,
              ],
              `braces`,
            ),
          },
          links: { ...yo(Co), ...bo() },
          flows: [xo()],
        },
      },
      {
        short: `The catch`,
        chapter: `tradeoff`,
        title: `Flexible queries can be expensive`,
        body: [
          `Clients can ask for <em>anything</em> the schema allows — including followers of followers of followers, with all their posts. One innocent-looking query (the big square) melts the Users service.`,
          `And because queries are normally sent as a <code>POST</code> to a single URL, ordinary HTTP caches and CDNs can’t help without extra work such as persisted queries.`,
        ],
        callout: {
          kind: `warn`,
          text: `Production GraphQL needs query depth and cost limits, and often an allow-list of approved (“persisted”) queries.`,
        },
        changes: [`+ A deeply nested query`, `~ Users service overloaded`],
        metrics: { trips: 1, payload: `2.1 MB`, screenMs: 3800, unused: 0 },
        scene: {
          entities: {
            phone: ho(),
            api: _o(),
            ...vo({
              us: { ..._(0.97), tags: [{ text: `41,000 lookups`, tone: `red`, icon: `alert` }] },
            }),
            card: So(
              `A “small” query`,
              [
                `followers {`,
                `  followers {`,
                `    followers { posts { comments } }`,
                `  } }`,
                `! 41,000 database lookups`,
              ],
              `alert`,
            ),
          },
          links: { ...yo(Co), ...bo() },
          flows: [xo(0.5, `heavy`)],
        },
      },
      {
        short: `RPC`,
        chapter: `technique`,
        title: `Inside the data center: RPC`,
        body: [
          `Behind the API, services call each other constantly. Here the usual choice is <span class="term">RPC</span> (remote procedure call): calling a function on another machine as if it were local — today usually <b>gRPC</b>.`,
          `The contract is a typed schema (Protocol Buffers); code for both sides is generated from it, and messages travel as compact binary over HTTP/2.`,
        ],
        callout: {
          kind: `tip`,
          text: `gRPC is fast and strictly typed, and supports streaming — but browsers can’t speak it natively (they need a gRPC-Web proxy), so it mostly stays inside your network.`,
        },
        changes: [`~ API → services: gRPC + protobuf`],
        metrics: { trips: 1, payload: `3 KB`, screenMs: 130, unused: 0 },
        scene: {
          entities: {
            phone: ho(),
            api: _o(),
            ...vo({ us: v(0.3), ps: v(0.3) }),
            card: So(
              `A gRPC contract`,
              [
                `service Users {`,
                `  rpc GetUser (UserId) returns (User);`,
                `}`,
                `= binary · typed · a few × smaller than JSON`,
              ],
              `workflow`,
            ),
          },
          links: { ...yo(Co), ...bo({ label: `gRPC` }) },
          flows: [xo(0.9)],
        },
      },
      {
        short: `Pagination`,
        chapter: `technique`,
        title: `Case: a list with 2 million items`,
        body: [
          `A celebrity’s followers list has 2 million entries. Returning it in one response would mean hundreds of megabytes and a very long wait. APIs return lists in <b>pages</b>.`,
          `<code>?offset=40000&limit=20</code> looks simple, but the database still walks past 40,000 rows. A <span class="term">cursor</span> — “the 20 after id 9f3c” — jumps straight there with an index, and doesn’t skip or repeat items when new ones arrive.`,
        ],
        callout: {
          kind: `tip`,
          text: `Return the cursor for the next page in each response. Clients just pass it back.`,
        },
        changes: [`+ Followers returned 20 at a time`, `~ Cursor-based paging`],
        metrics: { trips: 1, payload: `3 KB`, screenMs: 130, unused: 0 },
        scene: {
          entities: {
            phone: ho([{ text: `followers · page 2,001`, icon: `users` }]),
            api: _o(),
            ...vo({
              us: { ...v(0.3), tags: [{ text: `2,000,000 followers`, icon: `users` }] },
              ps: v(0.3),
            }),
            card: So(
              `Paging a long list`,
              [
                `! ?offset=40000&limit=20  → walks 40,020 rows`,
                `= ?after=9f3c&limit=20     → index seek, 20 rows`,
                `# response includes next cursor: "a71b"`,
              ],
              `listOrdered`,
            ),
          },
          links: { ...yo({ label: `GET followers?after=9f3c&limit=20`, labelAt: 0.45 }), ...bo() },
          flows: [{ route: [`pa`, `au`], rate: 1.4, bounce: !0 }],
        },
      },
      {
        short: `Versions`,
        chapter: `problem`,
        title: `Case: renaming a field breaks old apps`,
        body: [
          `A tidy-up renames <code>name</code> to <code>display_name</code>. The new app is fine — but millions of phones still run last year’s version, and their profile screens now crash.`,
          `Mobile apps can’t be forced to update. So APIs evolve <b>additively</b>: add the new field, keep the old one, and only remove it once almost nobody calls it. For truly breaking changes, publish a new version (<code>/v2/</code>) and run both.`,
        ],
        callout: {
          kind: `warn`,
          text: `Once an API is public, every field is a promise. Measure who uses it before you break it.`,
        },
        changes: [
          `− Old app versions crash`,
          `~ Fix: keep name, add display_name`,
          `+ /v2 for breaking changes`,
        ],
        metrics: { trips: 1, payload: `3 KB`, screenMs: 130, unused: 0 },
        scene: {
          entities: {
            phone: ho([{ text: `app v3.2 · crashed`, tone: `red`, icon: `alert` }]),
            api: _o({ tags: [{ text: `name → display_name`, tone: `amber`, icon: `replay` }] }),
            ...vo({ us: v(0.3), ps: v(0.3) }),
            card: So(
              `Evolving safely`,
              [
                `! remove or rename a field   → old apps break`,
                `= add a field                → nothing breaks`,
                `= deprecate, measure, remove later`,
                `# breaking change? → /v2 alongside /v1`,
              ],
              `layers`,
            ),
          },
          links: { ...yo({ fail: 0.5 }), ...bo({ label: `gRPC` }) },
          flows: [xo(0.9)],
        },
      },
      {
        short: `Choosing`,
        chapter: `insight`,
        title: `Which one, where?`,
        body: [
          `<table class="compare">
          <thead><tr><th></th><th>Best for</th><th>Watch out</th></tr></thead>
          <tbody>
            <tr><td><b>REST</b></td><td>Public APIs, simple CRUD, caching</td><td>Many calls per screen</td></tr>
            <tr><td><b>GraphQL</b></td><td>Many clients, varied screens</td><td>Costly queries, caching</td></tr>
            <tr><td><b>gRPC</b></td><td>Service-to-service</td><td>Not for browsers</td></tr>
          </tbody>
        </table>`,
          `They mix happily: REST or GraphQL at the edge for clients, gRPC between services inside.`,
        ],
        callout: {
          kind: `insight`,
          text: `Whatever the style, version your API and never break existing clients — add fields, don’t rename or remove them.`,
        },
        metrics: { trips: 1, payload: `3 KB`, screenMs: 130, unused: 0 },
        scene: {
          entities: { phone: ho(), api: _o(), ...vo({ us: v(0.3), ps: v(0.3) }) },
          links: { ...yo({ label: `GraphQL` }), ...bo({ label: `gRPC` }) },
          flows: [xo(0.9)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>An <b>API</b> is a contract between programs.</li>
          <li><b>REST</b>: resources + HTTP verbs; simple and cacheable, but chatty for rich screens.</li>
          <li><b>GraphQL</b>: one query, exact fields; guard against expensive queries.</li>
          <li><b>gRPC</b>: fast, typed calls between internal services.</li>
          <li>Page long lists with <b>cursors</b>; evolve APIs <b>additively</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Message Queues</b> — for work that shouldn’t make anyone wait for an answer.`,
        },
        metrics: { trips: 1, payload: `3 KB`, screenMs: 130, unused: 0 },
        scene: {
          entities: { phone: ho(), api: _o(), ...vo({ us: v(0.3), ps: v(0.3) }) },
          links: { ...yo({ label: `GraphQL` }), ...bo({ label: `gRPC` }) },
          flows: [xo(0.9)],
        },
      },
    ],
  };

const To = { x0: -4.5, x1: 4.5, y0: -21, y1: -15 };

const Eo = { x0: -6.5, x1: 6.5, y0: -1.5, y1: 2.5 };

const Do = { w1: -4, w2: 4 };

const Oo = { w4: -12, w1: -6, w3: 0, w2: 6, w5: 12 };

const ko = (e = 11, t = `creators uploading`) => p(To, e, t);

const Ao = (e = {}) => d(0, -9, { label: [`Web`, `Server`], ...e });

const jo = (e = `QUEUE · VIDEO JOBS`) => x(Eo, e);

const Mo = (e) => ee(5.6, 1, e, [-1, 0]);

const No = (e, t = {}) => d(e, 9, { color: `green`, glyph: `video`, label: [`Worker`], ...t });

const Po = (e, t = {}) =>
    Object.fromEntries(
      Object.entries(e).map(([e, n]) => [e, No(n, { ...v(-1), ...(t[e] || {}) })]),
    );

const F = {
    uw: (e = {}) => ({ uw: h(`users`, `web`, [`users`, `web`], { heads: `both`, ...e }) }),
    wq: { wq: h(`web`, `mq`, [`web`, `mq`], { label: `enqueue job` }) },
    pull: (e, t = {}) =>
      Object.fromEntries(
        e.map((e, n) => [
          `q${e}`,
          h(`mq`, e, [`mq`, [e, `mq`], e], {
            ...(n === 0 ? { label: `pull` } : {}),
            ...(t[e] || {}),
          }),
        ]),
      ),
  };

const Fo = (e = 3) => ({ route: [`uw`], rate: e, bounce: !0 });

const Io = (e = 1.4) => ({ route: [`wq`], kind: `msg`, rate: e });

const Lo = (e, t = 1.4) => ({
    routes: e.map((e) => ({ path: [`q${e}`] })),
    rate: t,
    kind: `msg`,
    speed: 0.6,
  });

const Ro = (e, t, n) => S({ x: 6.5, y: 2.5, z: 0, dx: 80, dy: -240 }, e, t, { icon: n });

const zo = {
    id: `queues`,
    title: `Message Queues`,
    summary: `Answer right away, do the slow work later — and never lose a job along the way.`,
    minutes: 12,
    level: `beginner`,
    metrics: [`respond`, `backlog`, `workers`, `lost`],
    legend: [`req`, `res`, `msg`, `slow`, `poison`, `fail`],
    goals: [
      { text: `Why slow work doesn’t belong in a request`, step: 0 },
      { text: `Producers, queues and consumers`, step: 1 },
      { text: `Absorbing spikes as backlog`, step: 2 },
      { text: `Acks, retries and dead-letter queues`, step: 5 },
      { text: `Ordering, partitions and backpressure`, step: 8 },
    ],
    steps: [
      {
        short: `Slow upload`,
        chapter: `problem`,
        title: `Slow work inside the request`,
        body: [
          `Creators upload videos, and each one must be transcoded into several sizes — about 30 seconds of heavy work. Right now the web server does it <em>inside</em> the upload request.`,
          `So the creator stares at a spinner for 30 s, many requests time out, and while servers grind through videos, every other page on the site slows down too.`,
        ],
        callout: {
          kind: `warn`,
          text: `Anything slow, heavy or unreliable inside a request — video, email, reports, third-party calls — makes users wait for it.`,
        },
        metrics: { respond: 3e4, backlog: `—`, workers: 0, lost: `25%` },
        scene: {
          entities: {
            users: ko(),
            web: Ao({
              ..._(0.96),
              tags: [{ text: `transcoding · 30 s`, tone: `red`, icon: `video` }],
            }),
          },
          links: F.uw({ label: `upload … wait 30 s`, labelTone: `amber`, fail: 0.25 }),
          flows: [{ route: [`uw`], kind: `slow`, rate: 1.8, bounce: !0, speed: 0.4 }],
        },
      },
      {
        short: `Add a queue`,
        chapter: `solution`,
        title: `Put a queue in between`,
        body: [
          `The web server now just stores the upload, puts a small <b>job</b> message on a <span class="term">message queue</span>, and replies at once: “processing — we’ll notify you”.`,
          `Separate <span class="term">worker</span> machines pull jobs off the queue and transcode at their own pace. The web server is the <b>producer</b>; workers are <b>consumers</b>.`,
        ],
        callout: {
          kind: `tip`,
          text: `Popular queues: RabbitMQ, Amazon SQS, Google Pub/Sub, and Kafka (a log that also works as a queue).`,
        },
        changes: [`+ Queue`, `+ 2 workers`, `~ Upload response 30 s → 80 ms`],
        metrics: { respond: 80, backlog: 2, workers: 2, lost: 0 },
        scene: {
          entities: {
            users: ko(),
            web: Ao({ tags: [{ text: `202 Accepted · 80 ms`, tone: `green`, icon: `check` }] }),
            mq: jo(),
            q: Mo(2),
            ...Po(Do),
          },
          links: { ...F.uw(), ...F.wq, ...F.pull([`w1`, `w2`]) },
          flows: [Fo(), Io(), Lo([`w1`, `w2`])],
        },
      },
      {
        short: `Spike`,
        chapter: `insight`,
        title: `A spike becomes a backlog`,
        body: [
          `A big creator goes live and uploads jump tenfold. Without the queue, that spike would have flattened the web servers.`,
          `Now the web tier stays fast — it only enqueues — and jobs simply wait their turn. Workers keep a steady pace and catch up after the rush.`,
        ],
        callout: {
          kind: `insight`,
          text: `A queue turns “too much work right now” into “a bit more waiting later”. This is called load levelling.`,
        },
        changes: [
          `~ Uploads ×10`,
          `+ Backlog builds: 1,200 jobs`,
          `~ Upload response stays ~85 ms`,
        ],
        metrics: { respond: 85, backlog: 1200, workers: 2, lost: 0 },
        scene: {
          entities: {
            users: ko(15, `creators · ×10`),
            web: Ao({ tags: [{ text: `202 Accepted · 85 ms`, tone: `green`, icon: `check` }] }),
            mq: jo(`QUEUE · 1,200 JOBS WAITING`),
            q: Mo(11),
            ...Po(Do, {
              w1: { tags: [{ text: `steady pace`, icon: `gauge` }] },
              w2: { tags: [{ text: `steady pace`, icon: `gauge` }] },
            }),
          },
          links: { ...F.uw(), ...F.wq, ...F.pull([`w1`, `w2`]) },
          flows: [Fo(6), Io(4), Lo([`w1`, `w2`])],
        },
      },
      {
        short: `More workers`,
        chapter: `technique`,
        title: `Add workers to drain it`,
        body: [
          `Need to catch up faster? Start more workers. They all pull from the same queue, and each job goes to exactly <b>one</b> of them — the <span class="term">competing consumers</span> pattern.`,
          `Workers are stateless, so adding them is easy, and many teams scale them automatically on queue length.`,
        ],
        callout: {
          kind: `tip`,
          text: `Producers and consumers now scale independently: add web servers for traffic, workers for processing.`,
        },
        changes: [`+ 3 more workers`, `~ Backlog 1,200 → 300 and falling`],
        metrics: { respond: 80, backlog: 300, workers: 5, lost: 0 },
        scene: {
          entities: {
            users: ko(15, `creators · ×10`),
            web: Ao(),
            mq: jo(`QUEUE · DRAINING`),
            q: Mo(4),
            ...Po(Oo),
          },
          links: { ...F.uw(), ...F.wq, ...F.pull([`w4`, `w1`, `w3`, `w2`, `w5`]) },
          flows: [Fo(6), Io(4), Lo([`w4`, `w1`, `w3`, `w2`, `w5`], 4.4)],
        },
      },
      {
        short: `Crash`,
        chapter: `problem`,
        title: `A worker dies mid-job`,
        body: [
          `A worker crashes halfway through transcoding. If the queue deleted each job the moment it handed it out, that video is simply gone — the creator waits forever.`,
          `Machines crash, get restarted and are replaced all the time. The queue has to assume it.`,
        ],
        callout: { kind: `warn`, text: `Handing out a job is not the same as finishing it.` },
        changes: [`− Worker crashed`, `− Its in-progress jobs lost`],
        metrics: { respond: 80, backlog: 300, workers: 4, lost: 12 },
        scene: {
          entities: {
            users: ko(15, `creators · ×10`),
            web: Ao(),
            mq: jo(`QUEUE · DRAINING`),
            q: Mo(4),
            ...Po(Oo, { w3: g }),
          },
          links: {
            ...F.uw(),
            ...F.wq,
            ...F.pull([`w4`, `w1`, `w3`, `w2`, `w5`], { w3: { fail: 1 } }),
          },
          flows: [Fo(6), Io(4), Lo([`w4`, `w1`, `w3`, `w2`, `w5`], 4.4)],
        },
      },
      {
        short: `Acks`,
        chapter: `solution`,
        title: `Acknowledge when done`,
        body: [
          `Fix: a job is only <em>hidden</em> while a worker has it. When the worker finishes, it sends an <span class="term">acknowledgement</span> and the job is deleted. No ack within a timeout? The job reappears and another worker picks it up.`,
          `The catch: a job can now run <b>twice</b> (say, a worker finishes but dies before acking). So jobs must be <span class="term">idempotent</span> — safe to repeat.`,
        ],
        callout: {
          kind: `tip`,
          text: `This is “at-least-once” delivery, the norm for queues. Exactly-once is very hard; idempotent consumers get you the same result.`,
        },
        changes: [
          `+ Ack after each job`,
          `+ Unacked jobs redelivered after 60 s`,
          `~ Lost jobs 12 → 0`,
        ],
        metrics: { respond: 80, backlog: 320, workers: 4, lost: 0 },
        scene: {
          entities: {
            users: ko(15, `creators · ×10`),
            web: Ao(),
            mq: jo(`QUEUE · DRAINING`),
            q: Mo(4),
            ...Po(Oo, { w3: g }),
            card: Ro(
              `Acknowledgements`,
              [
                `1. worker takes a job → hidden, not deleted`,
                `2. worker finishes → ack → deleted`,
                `3. no ack in 60 s → visible again`,
                `! may run twice → make jobs idempotent`,
              ],
              `check`,
            ),
          },
          links: {
            ...F.uw(),
            ...F.wq,
            ...F.pull([`w4`, `w1`, `w3`, `w2`, `w5`], { w3: { style: `off` } }),
          },
          flows: [Fo(6), Io(4), Lo([`w4`, `w1`, `w2`, `w5`], 4)],
        },
      },
      {
        short: `Poison`,
        chapter: `technique`,
        title: `Poison messages and the dead-letter queue`,
        body: [
          `One upload is a corrupt file. Every worker that tries it crashes or fails, the job is redelivered, and it fails again — forever, wasting workers and blocking others.`,
          `So queues count attempts. After, say, 3 failures the message is moved to a <span class="term">dead-letter queue</span> (DLQ) for a human or a script to inspect.`,
        ],
        callout: {
          kind: `tip`,
          text: `Alert on DLQ size. A growing dead-letter queue is often the first sign of a bug.`,
        },
        changes: [
          `− Crashed worker removed`,
          `+ Dead-letter queue`,
          `~ Failing jobs moved aside after 3 attempts`,
        ],
        metrics: { respond: 80, backlog: 60, workers: 4, lost: 0 },
        scene: {
          entities: {
            users: ko(),
            web: Ao(),
            mq: jo(),
            q: Mo(2),
            ...Po({ w4: -12, w1: -6, w2: 6, w5: 12 }),
            dlq: b(-15, 0.5, { r: 1.6, h: 32, glyph: `skull`, label: `dead letters` }),
          },
          links: {
            ...F.uw(),
            ...F.wq,
            ...F.pull([`w4`, `w1`, `w2`, `w5`]),
            dl: h(`mq`, `dlq`, [`mq`, `dlq`], {
              style: `dashed`,
              label: `after 3 failures`,
              labelAt: 0.35,
            }),
          },
          flows: [
            Fo(3),
            Io(1.6),
            Lo([`w4`, `w1`, `w2`, `w5`], 1.6),
            { route: [`dl`], kind: `poison`, rate: 0.35, speed: 0.6 },
          ],
        },
      },
      {
        short: `Order`,
        chapter: `problem`,
        title: `Case: messages out of order`,
        body: [
          `A different queue carries account events: <code>created</code>, <code>email changed</code>, <code>deleted</code>. With several workers pulling in parallel, a slow worker can finish “email changed” <em>after</em> another worker has already processed “deleted”.`,
          `Many queues give no ordering guarantee at all — and even ordered ones lose it once several consumers work in parallel.`,
        ],
        callout: {
          kind: `warn`,
          text: `If correctness depends on order, you must design for it explicitly.`,
        },
        changes: [
          `+ Account events: created → changed → deleted`,
          `− Processed as created → deleted → changed`,
        ],
        metrics: { respond: 80, backlog: 60, workers: 4, lost: 0 },
        scene: {
          entities: {
            users: ko(),
            web: Ao(),
            mq: jo(`QUEUE · ACCOUNT EVENTS`),
            q: Mo(3),
            ...Po(
              { w4: -12, w1: -6, w2: 6, w5: 12 },
              {
                w1: { tags: [{ text: `“deleted” ✓`, tone: `green` }] },
                w2: {
                  heat: 0.3,
                  tags: [{ text: `“email changed” · late`, tone: `red`, icon: `alert` }],
                },
              },
            ),
          },
          links: { ...F.uw(), ...F.wq, ...F.pull([`w4`, `w1`, `w2`, `w5`]) },
          flows: [Fo(3), Io(1.6), Lo([`w4`, `w1`, `w2`, `w5`], 1.6)],
        },
      },
      {
        short: `Partitions`,
        chapter: `solution`,
        title: `Order per key with partitions`,
        body: [
          `Systems like Kafka split a topic into <span class="term">partitions</span>. Messages with the same key (say, the account id) always go to the same partition, and each partition is read by one worker, in order.`,
          `So events for one account stay in order, while different accounts are still processed in parallel across partitions.`,
        ],
        callout: {
          kind: `tip`,
          text: `Order is guaranteed per key, not globally. Global order means one consumer — and no parallelism.`,
        },
        changes: [
          `+ 4 partitions, keyed by account id`,
          `~ Each worker owns one partition`,
          `~ Events per account stay in order`,
        ],
        metrics: { respond: 80, backlog: 60, workers: 4, lost: 0 },
        scene: {
          entities: {
            users: ko(),
            web: Ao(),
            mq: jo(`TOPIC · 4 PARTITIONS BY ACCOUNT`),
            q: Mo(3),
            ...Po(
              { w4: -12, w1: -6, w2: 6, w5: 12 },
              {
                w4: { tags: [{ text: `partition 0` }] },
                w1: { tags: [{ text: `partition 1` }] },
                w2: { tags: [{ text: `partition 2` }] },
                w5: { tags: [{ text: `partition 3` }] },
              },
            ),
          },
          links: { ...F.uw(), ...F.wq, ...F.pull([`w4`, `w1`, `w2`, `w5`]) },
          flows: [Fo(3), Io(1.6), Lo([`w4`, `w1`, `w2`, `w5`], 1.6)],
        },
      },
      {
        short: `Backpressure`,
        chapter: `technique`,
        title: `When the backlog never drains`,
        body: [
          `Queues absorb spikes — but if jobs arrive faster than workers finish them <em>for hours</em>, the backlog grows forever. Jobs get older and older, and eventually storage runs out.`,
          `Watch queue <b>age</b>, not just length, and push back: autoscale workers, cap the queue, and tell producers to slow down (or reject new jobs with a clear “try later”).`,
        ],
        callout: {
          kind: `insight`,
          text: `A queue buys time, not capacity. Long-term, throughput must match the arrival rate.`,
        },
        changes: [`+ Alert: oldest job > 10 min`, `+ Queue capped · producers told to retry later`],
        metrics: { respond: 120, backlog: 5e4, workers: 4, lost: 0 },
        scene: {
          entities: {
            users: ko(15, `all-day surge`),
            web: Ao({ tags: [{ text: `503 · try again in 60 s`, tone: `amber`, icon: `clock` }] }),
            mq: jo(`QUEUE · 50,000 JOBS · OLDEST 25 MIN`),
            q: Mo(12),
            ...Po({ w4: -12, w1: -6, w2: 6, w5: 12 }, { w4: _(1), w1: _(1), w2: _(1), w5: _(1) }),
          },
          links: { ...F.uw({ fail: 0.25 }), ...F.wq, ...F.pull([`w4`, `w1`, `w2`, `w5`]) },
          flows: [Fo(6), Io(4), Lo([`w4`, `w1`, `w2`, `w5`], 1.6)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Move slow work out of the request: <b>enqueue</b> a job and answer immediately.</li>
          <li>Queues <b>absorb spikes</b>; add <b>workers</b> to drain the backlog.</li>
          <li><b>Ack</b> after finishing; unacked jobs are retried — keep jobs <b>idempotent</b>.</li>
          <li>Park repeat failures in a <b>dead-letter queue</b>.</li>
          <li>Keep order <b>per key</b> with partitions; watch <b>queue age</b> and push back.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Pub/Sub & Events</b> — when one thing happening should trigger many others.`,
        },
        metrics: { respond: 80, backlog: 60, workers: 4, lost: 0 },
        scene: {
          entities: {
            users: ko(),
            web: Ao(),
            mq: jo(),
            q: Mo(2),
            ...Po({ w4: -12, w1: -6, w2: 6, w5: 12 }),
            dlq: b(-15, 0.5, { r: 1.6, h: 32, glyph: `skull`, label: `dead letters` }),
          },
          links: {
            ...F.uw(),
            ...F.wq,
            ...F.pull([`w4`, `w1`, `w2`, `w5`]),
            dl: h(`mq`, `dlq`, [`mq`, `dlq`], { style: `dashed` }),
          },
          flows: [Fo(3), Io(1.6), Lo([`w4`, `w1`, `w2`, `w5`], 1.6)],
        },
      },
    ],
  };

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

const ps = { x0: -4.5, x1: 4.5, y0: -23, y1: -17 };

const ms = { x0: -9.5, x1: 9.5, y0: -14, y1: 13.8 };

const hs = { x0: -15, x1: -1.2, y0: -3.6, y1: 13.8 };

const gs = { x0: 1.2, x1: 15, y0: -3.6, y1: 13.8 };

const _s = () => p(ps, 12, `1M users`);

const vs = (e = {}) => f(0, -10, e);

const ys = (e, t, n = {}) => ({ [e]: d(t, 0, { label: [`App`], ...n }) });

const bs = (e, t, n = {}) => ({ [e]: b(t, 10, { r: 1.8, glyph: `database`, ...n }) });

const xs = { tags: [{ text: `single point of failure`, tone: `red`, icon: `alert` }] };

const Ss = (e = {}) => ({
    users: _s(),
    lb: vs(e.lb),
    ...ys(`a1`, 0, e.a1),
    ...bs(`db`, 0, { label: `database`, ...(e.db || {}) }),
  });

const Cs = (e = {}) => ({
    ul: h(`users`, `lb`, [`users`, `lb`], { heads: `both`, ...e }),
    la1: h(`lb`, `a1`, [`lb`, `a1`]),
    adb: h(`a1`, `db`, [`a1`, `db`], { heads: `both` }),
  });

const ws = (e, t = {}) => ({
    ...ys(`a1`, -e, t.a1),
    ...ys(`a2`, e, t.a2),
    ...bs(`db`, -e, { label: `leader`, ...(t.db || {}) }),
    ...bs(`db2`, e, { label: `follower`, ...(t.db2 || {}) }),
  });

const Ts = (e = {}) => ({
    ul: h(`users`, `lb`, [`users`, `lb`], { heads: `both`, ...(e.ul || {}) }),
    la1: h(`lb`, `a1`, [`lb`, [`a1`, `lb`], `a1`], e.la1),
    la2: h(`lb`, `a2`, [`lb`, [`a2`, `lb`], `a2`], e.la2),
    adb: h(`a1`, `db`, [`a1`, `db`], { heads: `both`, ...(e.adb || {}) }),
    a2db: h(`a2`, `db`, [`a2`, [`a2`, 5], [`db+1`, 5], [`db+1`, `db`]], {
      heads: `both`,
      ...(e.a2db || {}),
    }),
    rep: h(`db`, `db2`, [`db`, `db2`], { label: `replication`, ...(e.rep || {}) }),
  });

const Es = [
    {
      routes: [{ path: [`ul`, `la1`, `adb`] }, { path: [`ul`, `la2`, `a2db`] }],
      rate: 2.6,
      bounce: !0,
    },
    { route: [`rep`], kind: `write`, rate: 0.6 },
  ];

const Ds = (e = {}) => ({
    users: _s(),
    lb: vs({ tags: [{ text: `regional · spans zones`, icon: `globe` }] }),
    za: x(hs, `ZONE A · OFFLINE`),
    zb: x(gs, `ZONE B`),
    ...ws(8, {
      a1: g,
      db: { ...g, label: `leader` },
      db2: { label: `leader`, tags: [{ text: `promoted`, tone: `green`, icon: `check` }] },
    }),
    ...e,
  });

const Os = {
    ul: h(`users`, `lb`, [`users`, `lb`], { heads: `both` }),
    la1: h(`lb`, `a1`, [`lb`, [`a1`, `lb`], `a1`], { style: `off` }),
    la2: h(`lb`, `a2`, [`lb`, [`a2`, `lb`], `a2`]),
    a2d2: h(`a2`, `db2`, [`a2`, `db2`], { heads: `both` }),
  };

const ks = [{ route: [`ul`, `la2`, `a2d2`], rate: 2.6, bounce: !0 }];

const As = (e, t, n) => S({ x: 15, y: 13.8, z: 0, dx: -130, dy: -240 }, e, t, { icon: n });

// --- reliability ---
const js = {
    id: `redundancy`,
    title: `Redundancy & Failover`,
    summary: `Everything fails eventually. Design so that no single failure takes you down.`,
    minutes: 12,
    level: `intermediate`,
    metrics: [`avail`, `downtime`, `spofs`, `survives`],
    legend: [`req`, `res`, [`write`, `replication`], `fail`],
    goals: [
      { text: `Measure availability in nines`, step: 0 },
      { text: `Find and remove single points of failure`, step: 2 },
      { text: `Spread copies across failure domains`, step: 4 },
      { text: `RTO, RPO and testing failover`, step: 6 },
      { text: `Bad deploys, canaries and regions`, step: 8 },
    ],
    steps: [
      {
        short: `Nines`,
        chapter: `setup`,
        title: `How available is one of everything?`,
        body: [
          `A simple stack: a load balancer, an app server and a database. Each one is up 99.9% of the time — that sounds great.`,
          `But a request needs <b>all three</b> working, so their availabilities multiply: 0.999 × 0.999 × 0.999 ≈ <b>99.7%</b>. That’s about 26 hours of downtime a year.`,
        ],
        callout: {
          kind: `insight`,
          text: `Availability is usually quoted in “nines”. Each extra nine cuts allowed downtime by 10×.`,
        },
        metrics: { avail: `99.7%`, downtime: `26 h`, spofs: 3, survives: `nothing` },
        scene: {
          entities: {
            ...Ss(),
            card: As(
              `The nines`,
              [
                `99%     → 3.7 days down / year`,
                `99.9%   → 8.8 hours`,
                `99.99%  → 53 minutes`,
                `99.999% → 5 minutes`,
                `! in a chain: 0.999³ = 99.7%`,
              ],
              `heartPulse`,
            ),
          },
          links: Cs(),
          flows: [{ route: [`ul`, `la1`, `adb`], rate: 2, bounce: !0 }],
        },
      },
      {
        short: `SPOFs`,
        chapter: `problem`,
        title: `Every box is a single point of failure`,
        body: [
          `A <span class="term">single point of failure</span> (SPOF) is anything whose failure alone takes the system down. Here, that’s every component.`,
          `A bad disk, a kernel panic, a botched deploy — any one of them and a million users see an error page.`,
        ],
        callout: {
          kind: `warn`,
          text: `Hardware fails, software crashes and people make mistakes. Assume each will happen — the question is what breaks when it does.`,
        },
        changes: [`+ 3 single points of failure marked`],
        metrics: { avail: `99.7%`, downtime: `26 h`, spofs: 3, survives: `nothing` },
        scene: {
          entities: Ss({ lb: xs, a1: xs, db: { ...xs, label: `database` } }),
          links: Cs(),
          flows: [{ route: [`ul`, `la1`, `adb`], rate: 2, bounce: !0 }],
        },
      },
      {
        short: `Two of each`,
        chapter: `solution`,
        title: `Redundancy: two of everything`,
        body: [
          `Add a spare for each part: the load balancer runs as an active–passive pair, two app servers share traffic, and the database has a follower ready to take over.`,
          `Now <em>both</em> copies must fail at once for an outage — 0.1% × 0.1% = 0.0001%. Losing any single machine is a non-event.`,
        ],
        callout: {
          kind: `tip`,
          text: `On paper, parts in parallel multiply their failure chances: two 99.9% copies give 99.9999%. Real pairs do worse — failover takes time, and both copies still share a building, a network and your deploys — so we count a cautious 99.95%.`,
        },
        changes: [
          `+ Load balancer pair`,
          `+ Second app server`,
          `+ Database follower`,
          `~ Single points of failure 3 → 0`,
        ],
        metrics: { avail: `99.95%`, downtime: `4 h`, spofs: 0, survives: `a server` },
        scene: {
          entities: {
            users: _s(),
            lb: vs({ tags: [{ text: `active–passive pair`, icon: `replay` }] }),
            ...ws(5),
          },
          links: Ts(),
          flows: Es,
        },
      },
      {
        short: `One building`,
        chapter: `problem`,
        title: `Copies that fail together`,
        body: [
          `All those copies sit in one data center. Then a power outage (or a flood, a fibre cut, a cooling failure) takes out the whole building — and every “redundant” copy with it.`,
          `Failures that hit many components at once are <span class="term">correlated failures</span>. Redundancy only helps if the copies fail <em>independently</em>.`,
        ],
        callout: {
          kind: `warn`,
          text: `Shared power, network, racks, software versions and even the same bad config push can all take out every copy together.`,
        },
        changes: [
          `+ Everything in one data center`,
          `− Data center power outage`,
          `− All copies down at once`,
        ],
        metrics: { avail: `99.95%`, downtime: `+ 6 h outage`, spofs: 1, survives: `a server` },
        scene: {
          entities: {
            users: _s(),
            dc: x(ms, `ONE DATA CENTER · POWER LOST`),
            lb: vs(g),
            ...ws(5, {
              a1: g,
              a2: g,
              db: { ...g, label: `leader` },
              db2: { ...g, label: `follower` },
            }),
          },
          links: Ts({
            ul: { fail: 1 },
            la1: { style: `off` },
            la2: { style: `off` },
            adb: { style: `off` },
            a2db: { style: `off` },
            rep: { style: `off` },
          }),
          flows: [{ route: [`ul`], rate: 2.4 }],
        },
      },
      {
        short: `Zones`,
        chapter: `solution`,
        title: `Spread across availability zones`,
        body: [
          `Cloud regions are split into <span class="term">availability zones</span>: separate data centers, kilometres to tens of kilometres apart, with their own power and network, joined by fast links.`,
          `Put one app server and one database copy in each zone. A zone-wide disaster now takes out only half.`,
        ],
        callout: {
          kind: `tip`,
          text: `Same idea at every scale: spread across racks, zones and — for the most critical systems — whole regions.`,
        },
        changes: [
          `− Single data center`,
          `+ Zone A and zone B`,
          `~ One copy of each tier per zone`,
        ],
        metrics: { avail: `99.99%`, downtime: `53 min`, spofs: 0, survives: `a zone` },
        scene: {
          entities: {
            users: _s(),
            lb: vs({ tags: [{ text: `regional · spans zones`, icon: `globe` }] }),
            za: x(hs, `ZONE A`),
            zb: x(gs, `ZONE B`),
            ...ws(8),
          },
          links: Ts({ rep: { label: `cross-zone replication` } }),
          flows: Es,
        },
      },
      {
        short: `Zone fails`,
        chapter: `solution`,
        title: `Zone A goes dark — failover`,
        body: [
          `Zone A loses power. Health checks fail, the load balancer stops sending traffic there, and the follower in zone B is promoted to leader.`,
          `Users in the middle of a request may see an error and retry; within a minute everything runs from zone B.`,
        ],
        callout: {
          kind: `insight`,
          text: `Zone B must have enough spare capacity to carry all the traffic alone. Redundancy you can’t afford to run on is not redundancy.`,
        },
        changes: [`− Zone A offline`, `~ Traffic → zone B only`, `~ Follower promoted to leader`],
        metrics: { avail: `99.99%`, downtime: `53 min`, spofs: 0, survives: `a zone` },
        scene: { entities: Ds(), links: Os, flows: ks },
      },
      {
        short: `RTO & RPO`,
        chapter: `technique`,
        title: `How fast, and how much lost?`,
        body: [
          `Two numbers describe a failover. <span class="term">RTO</span> (recovery time objective): how long until service is back. <span class="term">RPO</span> (recovery point objective): how much recent data you can afford to lose.`,
          `Async replication means the follower may be a few seconds behind — those writes are gone. Synchronous replication gets RPO to zero, at the cost of slower writes.`,
        ],
        callout: {
          kind: `tip`,
          text: `Decide RTO and RPO with the business first; they determine the design (and the bill).`,
        },
        metrics: { avail: `99.99%`, downtime: `53 min`, spofs: 0, survives: `a zone` },
        scene: {
          entities: Ds({
            card: As(
              `This failover`,
              [
                `detect: 3 missed health checks   10 s`,
                `promote follower                 20 s`,
                `reconnect apps                   30 s`,
                `= RTO ≈ 1 minute`,
                `! RPO ≈ 2 s of async writes lost`,
              ],
              `timer`,
            ),
          }),
          links: Os,
          flows: ks,
        },
      },
      {
        short: `Chaos`,
        chapter: `insight`,
        title: `Untested failover doesn’t work`,
        body: [
          `A failover path that never runs quietly rots: a config drifts, a spare is too small, a script has a typo. You find out during the real outage.`,
          `So teams break things <em>on purpose</em>, in production, during working hours — <span class="term">chaos engineering</span>. Here a test kills an app server and everyone watches the system cope.`,
        ],
        callout: {
          kind: `tip`,
          text: `Netflix’s Chaos Monkey randomly kills servers every day. Start smaller: a planned game day, one failure at a time.`,
        },
        changes: [
          `~ Zone A restored`,
          `− App server killed on purpose`,
          `~ Traffic continues on the other`,
        ],
        metrics: { avail: `99.99%`, downtime: `53 min`, spofs: 0, survives: `a zone` },
        scene: {
          entities: {
            users: _s(),
            lb: vs({ tags: [{ text: `regional · spans zones`, icon: `globe` }] }),
            za: x(hs, `ZONE A`),
            zb: x(gs, `ZONE B`),
            ...ws(8, {
              a1: { ...g, tags: [{ text: `killed by chaos test`, tone: `amber`, icon: `bug` }] },
            }),
          },
          links: Ts({ la1: { style: `off` }, adb: { style: `off` } }),
          flows: [
            { route: [`ul`, `la2`, `a2db`], rate: 2.6, bounce: !0 },
            { route: [`rep`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Bad deploy`,
        chapter: `problem`,
        title: `Case: the bug that’s everywhere at once`,
        body: [
          `A new release with a bug goes out to every app server in both zones at the same moment. Every copy crashes on the same request — redundancy doesn’t help when all the copies share the same broken code.`,
          `This is the most common cause of real outages: not hardware, but <b>changes</b> — code, config, or infrastructure.`,
        ],
        callout: {
          kind: `warn`,
          text: `Identical copies fail identically. A bad change is a correlated failure you inflict on yourself.`,
        },
        changes: [`+ Release v2.4 to all servers at once`, `− Both app servers crash`],
        metrics: { avail: `99.99%`, downtime: `+ 40 min outage`, spofs: 0, survives: `a zone` },
        scene: {
          entities: {
            users: _s(),
            lb: vs({ tags: [{ text: `regional · spans zones`, icon: `globe` }] }),
            za: x(hs, `ZONE A`),
            zb: x(gs, `ZONE B`),
            ...ws(8, {
              a1: { ...g, tags: [{ text: `v2.4 · crashing`, tone: `red`, icon: `bug` }] },
              a2: { ...g, tags: [{ text: `v2.4 · crashing`, tone: `red`, icon: `bug` }] },
            }),
          },
          links: Ts({
            ul: { fail: 1 },
            la1: { style: `off` },
            la2: { style: `off` },
            adb: { style: `off` },
            a2db: { style: `off` },
          }),
          flows: [
            { route: [`ul`], rate: 2.4 },
            { route: [`rep`], kind: `write`, rate: 0.3 },
          ],
        },
      },
      {
        short: `Canary`,
        chapter: `solution`,
        title: `Canary releases`,
        body: [
          `Roll out in stages instead. First a <span class="term">canary</span>: one server, or 1% of traffic, gets v2.4. Watch its error rate and latency against the others for a while.`,
          `If it looks worse, roll back — only 1% of users were affected, briefly. If it looks good, continue to 10%, 50%, 100%. Many teams also deploy one zone at a time.`,
        ],
        callout: {
          kind: `tip`,
          text: `Feature flags complement this: ship code turned off, then turn it on gradually — and off instantly if needed.`,
        },
        changes: [`~ v2.4 on one server only`, `~ 1% of traffic`, `~ Automatic rollback on errors`],
        metrics: { avail: `99.99%`, downtime: `53 min`, spofs: 0, survives: `a zone` },
        scene: {
          entities: {
            users: _s(),
            lb: vs({ tags: [{ text: `1% → canary`, tone: `amber`, icon: `split` }] }),
            za: x(hs, `ZONE A`),
            zb: x(gs, `ZONE B`),
            ...ws(8, {
              a1: { tags: [{ text: `v2.3 · 99%`, tone: `green` }] },
              a2: { tags: [{ text: `v2.4 canary · 1%`, tone: `amber`, icon: `bug` }] },
            }),
          },
          links: Ts({ la2: { style: `dashed` } }),
          flows: [
            {
              routes: [
                { path: [`ul`, `la1`, `adb`], weight: 0.9 },
                { path: [`ul`, `la2`, `a2db`], weight: 0.1, kind: `slow` },
              ],
              pick: `weights`,
              rate: 2.6,
              bounce: !0,
            },
            { route: [`rep`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Regions`,
        chapter: `technique`,
        title: `Beyond zones: multiple regions`,
        body: [
          `Zones protect against a building failing. A whole <b>region</b> can still go down (a regional network or cloud control-plane outage), and it’s far from users on other continents.`,
          `Running in two regions with a global DNS or anycast front door lets users go to the nearest healthy region. The hard part is the data: copies across an ocean replicate with ~100 ms of lag.`,
        ],
        callout: {
          kind: `insight`,
          text: `Multi-region is expensive and complex. Most systems are well served by multiple zones in one region plus good backups.`,
        },
        changes: [
          `+ Second region`,
          `+ Global front door routes to the nearest healthy region`,
          `~ Cross-region replication ≈ 100 ms lag`,
        ],
        metrics: { avail: `99.995%`, downtime: `26 min`, spofs: 0, survives: `a region` },
        scene: {
          entities: {
            users: _s(),
            lb: d(0, -10, {
              color: `orange`,
              glyph: `globe`,
              label: [`Global`, `DNS`],
              tags: [{ text: `nearest healthy region`, icon: `globe` }],
            }),
            za: x(hs, `REGION · EU`),
            zb: x(gs, `REGION · US`),
            ...ws(8, { db: { label: `EU primary` }, db2: { label: `US replica` } }),
          },
          links: Ts({ rep: { label: `cross-region · ~100 ms lag` } }),
          flows: Es,
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Components in a chain <b>multiply</b> their availability.</li>
          <li>Remove <b>single points of failure</b> with redundant copies.</li>
          <li>Copies must fail <b>independently</b>: spread them across zones.</li>
          <li>Set <b>RTO/RPO</b>, and practise failover so it works when needed.</li>
          <li>Most outages are <b>changes</b>: roll out with <b>canaries</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Rate Limiting</b> — protecting the system from too much of the wrong traffic.`,
        },
        metrics: { avail: `99.99%`, downtime: `53 min`, spofs: 0, survives: `a zone` },
        scene: {
          entities: {
            users: _s(),
            lb: vs({ tags: [{ text: `regional · spans zones`, icon: `globe` }] }),
            za: x(hs, `ZONE A`),
            zb: x(gs, `ZONE B`),
            ...ws(8),
          },
          links: Ts({ rep: { label: `cross-zone replication` } }),
          flows: Es,
        },
      },
    ],
  };

const Ms = { x0: -10, x1: -2, y0: -23, y1: -17 };

const Ns = { x0: -17.5, x1: -7.6, y0: -12.6, y1: -9.4 };

const Ps = { x0: 10.6, x1: 20.5, y0: -12.6, y1: -9.4 };

const Fs = (e = 11, t = `real users`) => p(Ms, e, t);

const Is = (e = []) => y(8, -20, { label: `runaway script`, tags: e });

const Ls = (e = {}) => d(0, 3, { label: [`API`], ...e });

const Rs = (e = 0, t = {}) =>
    d(e, -9, { color: `orange`, glyph: `gauge`, label: [`Gateway`], sub: `rate limiter`, ...t });

const zs = { text: `5,000 req/s`, tone: `red`, icon: `bot` };

const Bs = { text: `limit: 10 req/s per client`, icon: `gauge` };

const Vs = {
    direct: (e = {}) => ({
      ua: h(`users`, `api`, [`users`, [`users`, `api`], `api`], { heads: `both`, ...(e.ua || {}) }),
      ba: h(`bot`, `api`, [`bot`, [`bot`, `api`], `api`], e.ba),
    }),
    edge: (e = `gw`, t = {}) => ({
      ug: h(`users`, e, [`users`, [`users`, e], e], { heads: `both`, ...(t.ug || {}) }),
      bg: h(`bot`, e, [`bot`, [`bot`, e], e], {
        label: `429 Too Many Requests`,
        labelTone: `red`,
        labelAt: 0.82,
        fail: 0.92,
        ...(t.bg || {}),
      }),
    }),
    toApi: (e = `gw`, t = `ga`) => ({
      [t]: h(e, `api`, [e, [e, `api`], `api`], { heads: `both` }),
    }),
  };

const Hs = (e = 8) => ({
    ubz: x(Ns, `USER · ${e} TOKENS`),
    ubt: ee(-16.8, -10.4, e, [1, 0], { gap: 1.1, color: `#9fd28f` }),
    bbz: x(Ps, `SCRIPT · EMPTY`),
  });

const Us = (e, t, n) => S({ x: 12.5, y: 3, z: 0, dx: 20, dy: -260 }, e, t, { icon: n });

const Ws = (e = [zs], t = {}) => ({
    users: Fs(),
    bot: Is(e),
    api: Ls(v(0.42)),
    gw: Rs(-6, { tags: [] }),
    gw2: Rs(8, t),
    redis: b(1, -9, { r: 1.5, h: 32, glyph: `zap`, label: `counters` }),
  });

const Gs = (e = {}) => ({
    ug: h(`users`, `gw`, [`users`, [`users`, `gw`], `gw`], { heads: `both` }),
    bg: h(`bot`, `gw2`, [`bot`, `gw2`], {
      label: `429 Too Many Requests`,
      labelTone: `red`,
      labelAt: 0.5,
      fail: 0.92,
      ...e,
    }),
    ga: h(`gw`, `api`, [`gw`, [`gw`, `api`], `api`], { heads: `both` }),
    ga2: h(`gw2`, `api`, [`gw2`, [`gw2`, `api`], `api`], { heads: `both` }),
    gr: h(`gw`, `redis`, [`gw`, `redis`], { heads: `both`, label: `INCR`, labelAt: 0.5 }),
    g2r: h(`gw2`, `redis`, [`gw2`, `redis`], { heads: `both` }),
  });

const Ks = {
    id: `rate-limiting`,
    title: `Rate Limiting`,
    summary: `Give every client a fair budget, so one runaway script can’t take everyone down.`,
    minutes: 10,
    level: `intermediate`,
    metrics: [`abuser`, `served`, `apiCpu`, `limited`],
    legend: [`req`, `res`, [`slow`, `low priority`], [`fail`, `rejected`]],
    goals: [
      { text: `Why one client can starve everyone`, step: 0 },
      { text: `Token buckets and limiting algorithms`, step: 2 },
      { text: `Limits across many gateways`, step: 4 },
      { text: `429s, back-off and per-tenant quotas`, step: 6 },
      { text: `Load shedding under global overload`, step: 7 },
    ],
    steps: [
      {
        short: `Runaway`,
        chapter: `problem`,
        title: `One script, everyone suffers`,
        body: [
          `A customer’s script has a bug: it calls your API in a tight loop — 5,000 requests a second. The API servers spend almost all their time on it.`,
          `Real users’ requests queue behind the flood and time out. Nobody attacked you; one client simply took more than its share.`,
        ],
        callout: {
          kind: `warn`,
          text: `Shared capacity needs a fairness rule. Without one, the noisiest client wins.`,
        },
        metrics: { abuser: 5e3, served: 61, apiCpu: 99, limited: 0 },
        scene: {
          entities: {
            users: Fs(),
            bot: Is([zs]),
            api: Ls({
              ..._(0.99),
              tags: [{ text: `mostly serving one client`, tone: `red`, icon: `alert` }],
            }),
          },
          links: Vs.direct({ ua: { fail: 0.35 } }),
          flows: [
            { route: [`ua`], rate: 1.6, bounce: !0 },
            { route: [`ba`], rate: 7, kind: `heavy`, speed: 1.2 },
          ],
        },
      },
      {
        short: `Limit`,
        chapter: `solution`,
        title: `A rate limiter at the front door`,
        body: [
          `Put a <span class="term">rate limiter</span> in the gateway in front of the API. Each client — identified by API key, user id or IP address — gets a budget, say 10 requests per second.`,
          `Requests within budget pass through. The rest are rejected immediately with <code>429 Too Many Requests</code>, before they cost the API anything.`,
        ],
        callout: {
          kind: `tip`,
          text: `Rejecting early is cheap: the gateway answers in microseconds, and the API never sees the excess.`,
        },
        changes: [
          `+ Gateway with a rate limiter`,
          `~ Script limited to 10 req/s`,
          `~ API CPU 99% → 45%`,
        ],
        metrics: { abuser: 5e3, served: 99, apiCpu: 45, limited: 4990 },
        scene: {
          entities: { users: Fs(), bot: Is([zs]), api: Ls(v(0.45)), gw: Rs(0, { tags: [Bs] }) },
          links: { ...Vs.edge(), ...Vs.toApi() },
          flows: [
            { route: [`ug`, `ga`], rate: 1.8, bounce: !0 },
            { route: [`bg`, `ga`], rate: 7, kind: `heavy`, speed: 1.2 },
          ],
        },
      },
      {
        short: `Token bucket`,
        chapter: `technique`,
        title: `How it counts: the token bucket`,
        body: [
          `The most common algorithm is the <span class="term">token bucket</span>. Each client has a bucket holding up to 10 tokens, refilled at 10 per second. Every request takes a token; an empty bucket means 429.`,
          `A real user’s bucket stays mostly full (the green dots). The script empties its bucket instantly and stays empty.`,
        ],
        callout: {
          kind: `insight`,
          text: `Bucket size allows short bursts; the refill rate caps the long-run average. Two numbers, easy to explain.`,
        },
        changes: [`+ A bucket per client`],
        metrics: { abuser: 5e3, served: 99, apiCpu: 45, limited: 4990 },
        scene: {
          entities: {
            users: Fs(),
            bot: Is([zs]),
            api: Ls(v(0.45)),
            gw: Rs(0, { tags: [Bs] }),
            ...Hs(8),
          },
          links: { ...Vs.edge(), ...Vs.toApi() },
          flows: [
            { route: [`ug`, `ga`], rate: 1.8, bounce: !0 },
            { route: [`bg`, `ga`], rate: 7, kind: `heavy`, speed: 1.2 },
          ],
        },
      },
      {
        short: `Algorithms`,
        chapter: `technique`,
        title: `Windows vs buckets`,
        body: [
          `A simpler <b>fixed window</b> counts requests per calendar minute and resets at :00. Easy — but a client can send a full minute’s budget at 12:00:59 and again at 12:01:00: double the limit in two seconds.`,
          `A <b>sliding window</b> smooths that edge; a <b>token bucket</b> allows controlled bursts. Most API gateways use one of the latter two.`,
        ],
        callout: {
          kind: `tip`,
          text: `Need a steady outflow instead (e.g. to a fragile partner API)? A leaky bucket queues requests and releases them at a fixed pace.`,
        },
        metrics: { abuser: 5e3, served: 99, apiCpu: 45, limited: 4990 },
        scene: {
          entities: {
            users: Fs(),
            bot: Is([zs]),
            api: Ls(v(0.45)),
            gw: Rs(0, { tags: [Bs] }),
            ...Hs(8),
            card: Us(
              `Limit: 100 per minute`,
              [
                `fixed window     resets at :00`,
                `! 100 at 0:59 + 100 at 1:00 = 200 in 2 s`,
                `sliding window   rolling last 60 s`,
                `token bucket     burst ≤ 100, then refill`,
                `= bursts allowed, average capped`,
              ],
              `clock`,
            ),
          },
          links: { ...Vs.edge(), ...Vs.toApi() },
          flows: [
            { route: [`ug`, `ga`], rate: 1.8, bounce: !0 },
            { route: [`bg`, `ga`], rate: 7, kind: `heavy`, speed: 1.2 },
          ],
        },
      },
      {
        short: `Many gateways`,
        chapter: `problem`,
        title: `Many gateways, one budget`,
        body: [
          `One gateway isn’t enough, so you run several behind a load balancer. If each counts on its own, a client spread across 10 gateways gets 10× its limit.`,
          `So gateways keep the counters in a shared, fast store (often Redis): each request does an atomic increment and checks the total.`,
        ],
        callout: {
          kind: `tip`,
          text: `The shared store adds ~1 ms per request. Some systems trade a little accuracy for speed by syncing local counters every second.`,
        },
        changes: [
          `+ Second gateway`,
          `+ Shared counter store`,
          `− Per-client buckets now live in the store`,
        ],
        metrics: { abuser: 5e3, served: 99, apiCpu: 45, limited: 4990 },
        scene: {
          entities: Ws([zs], { tags: [Bs] }),
          links: Gs(),
          flows: [
            { route: [`ug`, `ga`], rate: 1.8, bounce: !0 },
            { route: [`bg`, `ga2`], rate: 7, kind: `heavy`, speed: 1.2 },
            { routes: [{ path: [`gr`] }, { path: [`g2r`] }], rate: 2.4, kind: `write`, bounce: !0 },
          ],
        },
      },
      {
        short: `Back off`,
        chapter: `technique`,
        title: `Tell clients how to behave`,
        body: [
          `A good 429 says when to come back: a <code>Retry-After: 30</code> header, plus headers showing the limit and what’s left. Well-behaved clients slow down and retry later.`,
          `The script’s owner fixes their loop. Now it uses its fair share and nothing more.`,
        ],
        callout: {
          kind: `tip`,
          text: `Publish your limits in the API docs, and offer higher tiers for customers who genuinely need more.`,
        },
        changes: [`+ Retry-After and RateLimit headers`, `~ Script backs off to 10 req/s`],
        metrics: { abuser: 10, served: 100, apiCpu: 38, limited: 0 },
        scene: {
          entities: Ws([{ text: `backing off · 10 req/s`, tone: `green`, icon: `check` }], {
            tags: [{ text: `Retry-After: 30`, icon: `clock` }],
          }),
          links: Gs({ fail: 0, label: `within limit`, labelTone: `green` }),
          flows: [
            { route: [`ug`, `ga`], rate: 1.8, bounce: !0 },
            { route: [`bg`, `ga2`], rate: 0.6, bounce: !0 },
            { routes: [{ path: [`gr`] }, { path: [`g2r`] }], rate: 1.2, kind: `write`, bounce: !0 },
          ],
        },
      },
      {
        short: `Tenants`,
        chapter: `problem`,
        title: `Case: one customer’s 10,000 users`,
        body: [
          `You sell your API to companies. One customer runs a nightly import with 10,000 well-behaved users — each under their personal limit, but together using 70% of your capacity. Other customers slow down every night.`,
          `Per-user limits can’t see this. Add limits per <b>tenant</b> (customer account), sized by their plan, on top of per-user limits.`,
        ],
        callout: {
          kind: `tip`,
          text: `Layer limits: per user, per tenant, per endpoint (expensive endpoints get lower limits), and a global ceiling.`,
        },
        changes: [`+ Per-tenant quota (by plan)`, `~ Big import capped at its plan’s share`],
        metrics: { abuser: `—`, served: 99, apiCpu: 55, limited: `1,200/s` },
        scene: {
          entities: {
            users: Fs(15, `Acme Corp · 10,000 users`),
            bot: Is(),
            api: Ls(v(0.55)),
            gw: Rs(-6, {
              tags: [{ text: `tenant Acme: 2,000 req/s`, tone: `amber`, icon: `building` }],
            }),
            gw2: Rs(8, { tags: [Bs] }),
            redis: b(1, -9, { r: 1.5, h: 32, glyph: `zap`, label: `counters` }),
          },
          links: {
            ...Gs({ fail: 0, label: `within limit`, labelTone: `green` }),
            ug: h(`users`, `gw`, [`users`, [`users`, `gw`], `gw`], {
              heads: `both`,
              fail: 0.3,
              label: `over tenant quota → 429`,
              labelTone: `amber`,
              labelAt: 0.5,
            }),
          },
          flows: [
            { route: [`ug`, `ga`], rate: 4.2, bounce: !0 },
            { route: [`bg`, `ga2`], rate: 0.6, bounce: !0 },
            { routes: [{ path: [`gr`] }, { path: [`g2r`] }], rate: 1.6, kind: `write`, bounce: !0 },
          ],
        },
      },
      {
        short: `Shedding`,
        chapter: `technique`,
        title: `When everyone spikes: shed load`,
        body: [
          `Rate limits stop one client hogging capacity. But on launch day <em>everyone</em> arrives at once and the total is still more than you can serve.`,
          `Then <span class="term">load shedding</span> decides what to drop: background work like prefetching, recommendations and analytics (amber) is rejected first, so logins and checkouts keep working.`,
        ],
        callout: {
          kind: `insight`,
          text: `Failing some requests on purpose beats failing all of them by accident.`,
        },
        changes: [
          `~ Real users ×5`,
          `+ Low-priority requests shed at the gateway`,
          `~ Checkouts still 100%`,
        ],
        metrics: { abuser: `—`, served: 100, apiCpu: 82, limited: `2,000 shed/s` },
        scene: {
          entities: {
            users: Fs(15, `launch day · ×5`),
            bot: Is(),
            api: Ls({ cpu: 0.82 }),
            gw: Rs(-6, {
              tags: [{ text: `shedding background work`, tone: `amber`, icon: `layers` }],
            }),
            gw2: Rs(8),
            redis: b(1, -9, { r: 1.5, h: 32, glyph: `zap`, label: `counters` }),
          },
          links: {
            ...Gs({ fail: 0, label: `within limit`, labelTone: `green` }),
            ul2: h(`users`, `gw`, [[`users+1.6`, `users`], [`users+1.6`, `gw`], `gw`], {
              style: `dashed`,
              fail: 0.85,
              label: `background · dropped first`,
              labelTone: `amber`,
              labelAt: 0.22,
            }),
          },
          flows: [
            { route: [`ug`, `ga`], rate: 3.2, bounce: !0 },
            { route: [`ul2`], rate: 2.6, kind: `slow` },
            { route: [`bg`, `ga2`], rate: 0.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Give each client a <b>budget</b>; reject the excess early with <b>429</b>.</li>
          <li><b>Token buckets</b> allow short bursts and cap the average rate.</li>
          <li>Across many gateways, keep counters in a <b>shared store</b>.</li>
          <li>Layer limits: per <b>user</b>, per <b>tenant</b>, per endpoint.</li>
          <li>Under global overload, <b>shed</b> low-priority work first.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Timeouts & Retries</b> — what to do when the service you’re calling is the one in trouble.`,
        },
        metrics: { abuser: 10, served: 100, apiCpu: 38, limited: 0 },
        scene: {
          entities: Ws([{ text: `backing off · 10 req/s`, tone: `green`, icon: `check` }], {
            tags: [Bs],
          }),
          links: Gs({ fail: 0, label: `within limit`, labelTone: `green` }),
          flows: [
            { route: [`ug`, `ga`], rate: 1.8, bounce: !0 },
            { route: [`bg`, `ga2`], rate: 0.6, bounce: !0 },
            { routes: [{ path: [`gr`] }, { path: [`g2r`] }], rate: 1.2, kind: `write`, bounce: !0 },
          ],
        },
      },
    ],
  };

const qs = { x0: -4.5, x1: 4.5, y0: -23, y1: -17 };

const Js = (e = `shoppers`) => p(qs, 11, e);

const Ys = (e = {}) => d(0, -10, { color: `orange`, glyph: `cart`, label: [`Order`, `Service`], ...e });

const Xs = (e = {}) => d(0, 4, { color: `purple`, glyph: `creditCard`, label: [`Payments`], ...e });

const Zs = (e) =>
    d(0, -3, {
      s: 3.2,
      h: 34,
      color: `yellow`,
      glyph: `unplug`,
      label: [],
      tags: e,
      pills: `below`,
    });

const Qs = {
    uo: (e = {}) => ({
      uo: h(`shoppers`, `order`, [`shoppers`, `order`], { heads: `both`, ...e }),
    }),
    op: (e = {}) => ({ op: h(`order`, `pay`, [`order`, `pay`], { heads: `both`, ...e }) }),
    viaBreaker: (e = {}, t = {}) => ({
      ob: h(
        `order`,
        `br`,
        [
          [`order+1`, `order`],
          [`br+1`, `br`],
        ],
        { heads: `both`, ...e },
      ),
      bp: h(
        `br`,
        `pay`,
        [
          [`br+1`, `br`],
          [`pay+1`, `pay`],
        ],
        { heads: `both`, ...t },
      ),
    }),
  };

const $s = { text: `200 / 200 threads waiting`, tone: `red`, icon: `hourglass` };

const ec = (e, t, n, r = {}) => S({ x: 0, y: 4, z: 0, dx: 95, dy: -175 }, e, t, { icon: n, ...r });

const tc = {
    id: `timeouts-retries`,
    title: `Timeouts & Retries`,
    summary: `Calling a struggling service safely: give up in time, retry carefully, and know when to stop.`,
    minutes: 11,
    level: `intermediate`,
    metrics: [`success`, `p99`, `payLoad`, `threads`],
    legend: [`req`, `res`, `retry`, `ping`, `fail`],
    goals: [
      { text: `How one slow service spreads failure`, step: 0 },
      { text: `Timeouts and fallbacks`, step: 1 },
      { text: `Retries, retry storms and backoff with jitter`, step: 4 },
      { text: `Circuit breakers and idempotency keys`, step: 7 },
      { text: `Deadlines and bulkheads`, step: 9 },
    ],
    steps: [
      {
        short: `Slow call`,
        chapter: `problem`,
        title: `One slow service takes down another`,
        body: [
          `The payment service starts answering in 30 seconds instead of 50 ms. The order service calls it and simply <b>waits</b> — with no limit.`,
          `Each waiting call holds a thread. Within a minute all 200 are stuck, and the order service can’t even serve pages that don’t need payments. A slow dependency became a full outage.`,
        ],
        callout: {
          kind: `warn`,
          text: `This is a cascading failure: trouble spreads upstream through anything that waits without a limit.`,
        },
        metrics: { success: 40, p99: 3e4, payLoad: `1×`, threads: `200 / 200 busy` },
        scene: {
          entities: {
            shoppers: Js(),
            order: Ys({ ..._(0.98), tags: [$s] }),
            pay: Xs({
              heat: 0.4,
              tags: [{ text: `answering in 30 s`, tone: `amber`, icon: `hourglass` }],
            }),
          },
          links: { ...Qs.uo({ fail: 0.5 }), ...Qs.op({ label: `no timeout`, labelTone: `red` }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`op`], rate: 1.2, bounce: !0, hold: 2.4, kind: `slow` },
          ],
        },
      },
      {
        short: `Timeout`,
        chapter: `solution`,
        title: `Set a timeout, have a fallback`,
        body: [
          `Give every outgoing call a <span class="term">timeout</span>: if payments hasn’t answered in 800 ms, give up and free the thread.`,
          `Then degrade gracefully: accept the order as “payment pending” and charge it shortly after. The order service stays up for everything else.`,
        ],
        callout: {
          kind: `tip`,
          text: `Set timeouts from real latency: a bit above the dependency’s p99, and always shorter than your own caller’s timeout.`,
        },
        changes: [
          `+ 800 ms timeout on payment calls`,
          `+ Fallback: “payment pending”`,
          `~ Threads busy 200 → 35`,
        ],
        metrics: { success: 72, p99: 820, payLoad: `1×`, threads: `35 / 200 busy` },
        scene: {
          entities: {
            shoppers: Js(),
            order: Ys({
              ...v(0.4),
              tags: [{ text: `fallback: payment pending`, tone: `amber`, icon: `clock` }],
            }),
            pay: Xs({
              heat: 0.4,
              tags: [{ text: `often slow`, tone: `amber`, icon: `hourglass` }],
            }),
          },
          links: { ...Qs.uo(), ...Qs.op({ label: `timeout 800 ms`, fail: 0.3 }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`op`], rate: 1.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Retry`,
        chapter: `technique`,
        title: `Retry the blips`,
        body: [
          `Many failures are momentary: a dropped packet, a server restarting, a brief hiccup. Trying again a moment later usually works.`,
          `One retry (amber) turns most of those failures into successes.`,
        ],
        callout: {
          kind: `tip`,
          text: `Only retry errors that might succeed next time — timeouts, 503s. Retrying a 400 Bad Request just fails again.`,
        },
        changes: [`+ One retry on timeouts and 503s`, `~ Checkouts OK 72% → 97%`],
        metrics: { success: 97, p99: 950, payLoad: `1.1×`, threads: `38 / 200 busy` },
        scene: {
          entities: { shoppers: Js(), order: Ys(v(0.4)), pay: Xs(v(0.5)) },
          links: { ...Qs.uo(), ...Qs.op({ label: `timeout 800 ms · 1 retry`, fail: 0.08 }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`op`], rate: 1.8, bounce: !0, pattern: [`req`, `req`, `req`, `req`, `slow`] },
          ],
        },
      },
      {
        short: `Retry storm`,
        chapter: `problem`,
        title: `Retries become a storm`,
        body: [
          `Then payments gets genuinely overloaded. Every caller retries — three times, immediately. Each failed request becomes four, so the struggling service now gets <b>4×</b> its normal load.`,
          `It can never recover: the retries themselves keep it down. Your clients have turned into a denial-of-service attack.`,
        ],
        callout: {
          kind: `warn`,
          text: `Retries multiply across layers too: 3 retries at each of 3 layers is up to 64 calls for one click.`,
        },
        changes: [
          `~ Payments overloaded`,
          `~ 3 immediate retries per failure`,
          `~ Load on payments 1× → 4×`,
        ],
        metrics: { success: 18, p99: 2400, payLoad: `4×`, threads: `200 / 200 busy` },
        scene: {
          entities: {
            shoppers: Js(),
            order: Ys({ ..._(0.95), tags: [$s] }),
            pay: Xs({ ..._(1), tags: [{ text: `4× normal load`, tone: `red`, icon: `alert` }] }),
          },
          links: {
            ...Qs.uo({ fail: 0.6 }),
            ...Qs.op({ label: `3 retries, immediately`, labelTone: `red`, fail: 0.75 }),
          },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`op`], rate: 7, bounce: !0, pattern: [`req`, `slow`, `slow`, `slow`] },
          ],
        },
      },
      {
        short: `Backoff`,
        chapter: `solution`,
        title: `Back off, with jitter`,
        body: [
          `Wait before retrying, and wait longer each time: 100 ms, then 200, then 400 — <span class="term">exponential backoff</span>. Add randomness (<span class="term">jitter</span>) so thousands of clients don’t retry in the same instant.`,
          `Cap the attempts, and cap the share of traffic that may be retries (a retry budget of ~10%). Payments gets room to recover.`,
        ],
        callout: {
          kind: `tip`,
          text: `Most cloud SDKs already do exponential backoff with jitter — check that it’s on, and that layers don’t stack their retries.`,
        },
        changes: [
          `~ Retries wait 100 → 200 → 400 ms (+ jitter)`,
          `+ Retry budget: 10%`,
          `~ Load on payments 4× → 1.2×`,
        ],
        metrics: { success: 96, p99: 1300, payLoad: `1.2×`, threads: `45 / 200 busy` },
        scene: {
          entities: {
            shoppers: Js(),
            order: Ys(v(0.45)),
            pay: Xs({
              ...v(0.62),
              tags: [{ text: `recovering`, tone: `green`, icon: `heartPulse` }],
            }),
            card: ec(`One call, with backoff`, [], `timer`, {
              chart: `bars`,
              bars: [
                { label: `attempt 1`, from: 0, to: 0.06, tone: `red`, note: `timeout` },
                { label: `retry 1`, from: 0.14, to: 0.2, tone: `red`, note: `+100 ms` },
                { label: `retry 2`, from: 0.36, to: 0.42, tone: `red`, note: `+200 ms` },
                { label: `retry 3`, from: 0.74, to: 0.8, tone: `green`, note: `+400 ms ✓` },
              ],
            }),
          },
          links: { ...Qs.uo(), ...Qs.op({ label: `backoff + jitter`, fail: 0.1 }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            {
              route: [`op`],
              rate: 2,
              bounce: !0,
              pattern: [`req`, `req`, `req`, `req`, `req`, `slow`],
            },
          ],
        },
      },
      {
        short: `Breaker`,
        chapter: `technique`,
        title: `Circuit breaker: stop calling for a while`,
        body: [
          `Payments goes fully down. Even with timeouts, every call wastes 800 ms finding that out. A <span class="term">circuit breaker</span> watches the failures — past a threshold it <b>opens</b> and fails calls instantly, without trying.`,
          `Every 30 seconds it lets one trial call through (<b>half-open</b>, the green ping). If that succeeds, it closes again.`,
        ],
        callout: {
          kind: `insight`,
          text: `Like the breaker in your house: it trips to protect the rest of the system, and you reset it once the fault is fixed.`,
        },
        changes: [
          `− Payments down`,
          `+ Circuit breaker: OPEN`,
          `~ Failed calls take 1 ms, not 800 ms`,
        ],
        metrics: { success: 88, p99: 25, payLoad: `resting`, threads: `6 / 200 busy` },
        scene: {
          entities: {
            shoppers: Js(),
            order: Ys({
              ...v(0.25),
              tags: [{ text: `fallback: payment pending`, tone: `amber`, icon: `clock` }],
            }),
            br: Zs([{ text: `OPEN · fails in 1 ms`, tone: `red`, icon: `unplug` }]),
            pay: Xs(g),
          },
          links: Qs.viaBreaker({ fail: 1 }, { style: `off`, fail: 1 }),
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`ob`], rate: 1.6 },
            { route: [`bp`], kind: `ping`, rate: 0.3 },
          ],
        },
      },
      {
        short: `Closed`,
        chapter: `solution`,
        title: `Half-open, then closed`,
        body: [
          `Payments recovers. The next trial call succeeds, so the breaker closes and traffic flows again — gradually, so the service isn’t flooded the moment it’s back.`,
          `Meanwhile the “payment pending” orders are charged from a queue. No order was lost, and the rest of the site never went down.`,
        ],
        callout: {
          kind: `tip`,
          text: `Libraries such as resilience4j, Polly and service meshes like Envoy/Istio provide timeouts, retries and breakers out of the box.`,
        },
        changes: [
          `+ Payments recovered`,
          `~ Breaker HALF-OPEN → CLOSED`,
          `~ Pending orders charged`,
        ],
        metrics: { success: 99, p99: 180, payLoad: `1×`, threads: `30 / 200 busy` },
        scene: {
          entities: {
            shoppers: Js(),
            order: Ys(v(0.35)),
            br: Zs([{ text: `CLOSED`, tone: `green`, icon: `check` }]),
            pay: Xs(v(0.5)),
          },
          links: Qs.viaBreaker(),
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`ob`, `bp`], rate: 1.8, bounce: !0 },
          ],
        },
      },
      {
        short: `Idempotency`,
        chapter: `technique`,
        title: `Retries must not charge twice`,
        body: [
          `A nasty case: payments charges the card, but the response is lost on the way back. The order service times out and retries — and the customer is charged <b>twice</b>.`,
          `Fix: send an <span class="term">idempotency key</span> — a unique id per order — with every attempt. Payments remembers the result for each key and returns it again for duplicates instead of charging again.`,
        ],
        callout: {
          kind: `insight`,
          text: `Any operation that may be retried must be idempotent: doing it twice has the same effect as doing it once.`,
        },
        changes: [
          `+ Idempotency-Key on payment calls`,
          `~ Duplicate attempts return the stored result`,
        ],
        metrics: { success: 99, p99: 180, payLoad: `1×`, threads: `30 / 200 busy` },
        scene: {
          entities: {
            shoppers: Js(),
            order: Ys(v(0.35)),
            br: Zs([{ text: `CLOSED`, tone: `green`, icon: `check` }]),
            pay: Xs({ ...v(0.5), tags: [{ text: `charged once`, tone: `green`, icon: `check` }] }),
            card: ec(
              `Idempotency-Key: 7f3a`,
              [
                `attempt 1 → charge $40, store result as 7f3a`,
                `! response lost → order service retries`,
                `attempt 2 → 7f3a seen: return stored result`,
                `= one charge, however many retries`,
              ],
              `key`,
            ),
          },
          links: Qs.viaBreaker({}, { label: `Idempotency-Key: 7f3a`, labelAt: 0.5 }),
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`ob`, `bp`], rate: 1.8, bounce: !0, pattern: [`req`, `req`, `req`, `slow`] },
          ],
        },
      },
      {
        short: `Deadlines`,
        chapter: `technique`,
        title: `Pass the deadline along`,
        body: [
          `The shopper’s browser gives up after 2 seconds. But if the order service has already spent 1.8 s, it’s pointless for payments to start a fresh 800 ms of work — nobody will see the answer.`,
          `So each request carries a <span class="term">deadline</span>: “answer by 12:00:02.000”. Every service checks the time left and passes the remaining budget on; with none left, it stops immediately.`,
        ],
        callout: {
          kind: `tip`,
          text: `gRPC propagates deadlines automatically. Over HTTP, pass the remaining time in a header.`,
        },
        changes: [
          `+ Deadline carried with each request`,
          `~ No work started that can’t finish in time`,
        ],
        metrics: { success: 99, p99: 180, payLoad: `1×`, threads: `28 / 200 busy` },
        scene: {
          entities: {
            shoppers: Js(),
            order: Ys({
              ...v(0.35),
              tags: [{ text: `deadline: 2 s · 1.4 s left`, icon: `timer` }],
            }),
            br: Zs([{ text: `CLOSED`, tone: `green`, icon: `check` }]),
            pay: Xs({ ...v(0.45), tags: [{ text: `budget: 1.4 s`, icon: `timer` }] }),
          },
          links: Qs.viaBreaker({}, { label: `deadline: 12:00:02.000`, labelAt: 0.5 }),
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`ob`, `bp`], rate: 1.8, bounce: !0 },
          ],
        },
      },
      {
        short: `Bulkheads`,
        chapter: `technique`,
        title: `Bulkheads: separate pools`,
        body: [
          `Remember step 1, when slow payments used up all 200 threads? The order service can also protect itself by giving each dependency its own pool: say 40 threads for payments, 40 for inventory, the rest for everything else.`,
          `Now when payments is slow, only its 40 threads fill up. Browsing, search and the cart keep working. Like the watertight compartments in a ship — the <span class="term">bulkhead</span> pattern.`,
        ],
        callout: {
          kind: `insight`,
          text: `Timeouts limit how long one call can hurt you; bulkheads limit how many calls can.`,
        },
        changes: [
          `+ Separate pools per dependency`,
          `~ Slow payments fills only its 40 threads`,
          `~ Rest of the site unaffected`,
        ],
        metrics: { success: 92, p99: 820, payLoad: `1×`, threads: `40 / 40 payments · rest free` },
        scene: {
          entities: {
            shoppers: Js(),
            order: Ys({
              ...v(0.4),
              tags: [
                { text: `payments pool 40 / 40 · others free`, tone: `amber`, icon: `layers` },
              ],
            }),
            pay: Xs({
              heat: 0.4,
              tags: [{ text: `slow again`, tone: `amber`, icon: `hourglass` }],
            }),
          },
          links: { ...Qs.uo(), ...Qs.op({ label: `payments pool · 40 threads` }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`op`], rate: 1.2, bounce: !0, hold: 1.2, kind: `slow` },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Every remote call needs a <b>timeout</b> and a <b>fallback</b>.</li>
          <li><b>Retry</b> transient errors — with <b>exponential backoff, jitter</b> and a cap.</li>
          <li>A <b>circuit breaker</b> stops hammering a service that is down.</li>
          <li>Retried operations must be <b>idempotent</b>.</li>
          <li>Propagate <b>deadlines</b>; isolate dependencies with <b>bulkheads</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Observability</b> — how you’d find out payments was slow in the first place.`,
        },
        metrics: { success: 99, p99: 180, payLoad: `1×`, threads: `30 / 200 busy` },
        scene: {
          entities: {
            shoppers: Js(),
            order: Ys(v(0.35)),
            br: Zs([{ text: `CLOSED`, tone: `green`, icon: `check` }]),
            pay: Xs(v(0.5)),
          },
          links: Qs.viaBreaker(),
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`ob`, `bp`], rate: 1.8, bounce: !0 },
          ],
        },
      },
    ],
  };

const nc = { x0: -4.5, x1: 4.5, y0: -24, y1: -18 };

const rc = (e = `shoppers`) => p(nc, 11, e);

const ic = (e, t, n) => d(e, t, n);

const ac = (e = {}) => ({
    gw: ic(0, -11, { color: `orange`, glyph: `globe`, label: [`Gateway`], tags: e.gw || [] }),
    orders: ic(0, 0, { color: `blue`, glyph: `cart`, label: [`Orders`], tags: e.orders || [] }),
    inv: ic(-10, 0, { color: `yellow`, glyph: `package`, label: [`Inventory`], tags: e.inv || [] }),
    pay: ic(10, 0, {
      color: `purple`,
      glyph: `creditCard`,
      label: [`Payments`],
      tags: e.pay || [],
    }),
    db: b(0, 11, { r: 1.7, glyph: `database`, label: `orders DB`, tags: e.db || [] }),
    fraud: ic(10, 11, {
      color: `slab`,
      glyph: `shield`,
      label: [`Fraud API`],
      sub: `third party`,
      tags: e.fraud || [],
    }),
  });

const oc = (e = {}) => ({
    ug: h(`shoppers`, `gw`, [`shoppers`, `gw`], { heads: `both` }),
    go: h(`gw`, `orders`, [`gw`, `orders`], { heads: `both` }),
    oi: h(`orders`, `inv`, [`orders`, `inv`], { heads: `both` }),
    op: h(`orders`, `pay`, [`orders`, `pay`], { heads: `both` }),
    od: h(`orders`, `db`, [`orders`, `db`], { heads: `both` }),
    pf: h(`pay`, `fraud`, [`pay`, `fraud`], { heads: `both`, ...(e.pf || {}) }),
  });

const sc = (e = 1.6, t) => [
    { routes: [{ path: [`ug`, `go`, `oi`] }, { path: [`ug`, `go`, `od`] }], rate: 1.4, bounce: !0 },
    { route: [`ug`, `go`, `op`, `pf`], rate: 0.7, bounce: !0, hold: e, kind: t },
  ];

const cc = (e, t = `paper`, n) => ({ text: e, tone: t, icon: n });

const lc = (e, t, n, r = {}) => S({ x: -10, y: 0, z: 0, dx: -400, dy: -110 }, e, t, { icon: n, ...r });

const uc = {
    gw: [cc(`p99 2.4 s`, `red`, `timer`)],
    orders: [cc(`p99 2.3 s`, `red`, `timer`)],
    inv: [cc(`p99 30 ms`, `green`, `timer`)],
    pay: [cc(`p99 2.2 s`, `red`, `timer`)],
    db: [cc(`p99 8 ms`, `green`, `timer`)],
  };

const dc = {
    id: `observability`,
    title: `Observability`,
    summary: `Metrics, logs and traces: how to find out what’s wrong, where, and why — fast.`,
    minutes: 11,
    level: `intermediate`,
    metrics: [`detect`, `locate`, `p99`, `signals`],
    legend: [`req`, `res`, [`mine`, `traced request`], `fail`],
    goals: [
      { text: `Why “it’s slow” is hard to debug`, step: 0 },
      { text: `Metrics and dashboards (RED)`, step: 1 },
      { text: `Alerting on SLOs, not CPU`, step: 2 },
      { text: `Logs and distributed traces`, step: 4 },
      { text: `Handling an incident, and the post-mortem`, step: 7 },
    ],
    steps: [
      {
        short: `It’s slow`,
        chapter: `problem`,
        title: `“Checkout is slow.” Where?`,
        body: [
          `Support tickets pile up: checkout takes several seconds. A checkout touches the gateway, orders, inventory, payments, a database and a third-party fraud API.`,
          `You can see a request waiting somewhere in this diagram — but the team can’t. Every server’s CPU looks fine, and nobody knows where to start.`,
        ],
        callout: {
          kind: `warn`,
          text: `If users find problems before you do, you are flying blind.`,
        },
        metrics: { detect: `2 h (support tickets)`, locate: `—`, p99: 2400, signals: `none` },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({ gw: [cc(`?`)], orders: [cc(`?`)], inv: [cc(`?`)], pay: [cc(`?`)] }),
          },
          links: oc(),
          flows: sc(),
        },
      },
      {
        short: `Metrics`,
        chapter: `technique`,
        title: `Metrics: numbers over time`,
        body: [
          `Every service records a few numbers about the requests it handles — the <span class="term">RED</span> method: <b>R</b>ate (requests/s), <b>E</b>rrors (failed share) and <b>D</b>uration (latency percentiles) — and sends them to a time-series store with dashboards.`,
          `Now the picture is clear: inventory and the database are fast; the slowness lives on the payments path.`,
        ],
        callout: {
          kind: `tip`,
          text: `Common stacks: Prometheus + Grafana, Datadog, CloudWatch. Measure p99, not just averages. RED describes requests; for machines, watch <b>USE</b>: utilization, saturation, errors.`,
        },
        changes: [`+ RED metrics on every service`, `+ Dashboard: p99 per service`],
        metrics: { detect: `5 min`, locate: `payments path`, p99: 2400, signals: `metrics` },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac(uc),
            card: lc(`Dashboard · p99 latency`, [], `chartLine`, {
              chart: `bars`,
              bars: [
                { label: `gateway`, to: 1, tone: `red`, note: `2.4 s` },
                { label: `orders`, to: 0.96, tone: `red`, note: `2.3 s` },
                { label: `payments`, to: 0.92, tone: `red`, note: `2.2 s` },
                { label: `inventory`, to: 0.02, tone: `green`, note: `30 ms` },
                { label: `orders DB`, to: 0.01, tone: `green`, note: `8 ms` },
              ],
            }),
          },
          links: oc(),
          flows: sc(),
        },
      },
      {
        short: `Alerts`,
        chapter: `technique`,
        title: `Alert on what users feel`,
        body: [
          `Don’t page people for “CPU above 80%” — it fires constantly and often means nothing. Alert on <b>symptoms</b> users feel.`,
          `Pick an <span class="term">SLI</span> (say, the share of checkouts faster than 1 s), set an <span class="term">SLO</span> target (99.9%), and alert when you’re burning through the remaining <span class="term">error budget</span> too fast.`,
        ],
        callout: {
          kind: `tip`,
          text: `An error budget turns reliability into a shared number: while it lasts, ship features; when it’s gone, fix reliability first.`,
        },
        changes: [`+ SLO: 99.9% of checkouts under 1 s`, `+ Alert on error-budget burn`],
        metrics: {
          detect: `2 min`,
          locate: `payments path`,
          p99: 2400,
          signals: `metrics + alerts`,
        },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({ ...uc, gw: [cc(`SLO burning 14× too fast`, `red`, `siren`)] }),
            card: lc(
              `Checkout SLO`,
              [
                `SLI: checkouts faster than 1 s`,
                `SLO: 99.9% over 30 days`,
                `error budget: 0.1% may be slow`,
                `! last hour: 1.4% slow = 14× budget → page`,
              ],
              `siren`,
            ),
          },
          links: oc(),
          flows: sc(),
        },
      },
      {
        short: `Logs`,
        chapter: `technique`,
        title: `Logs: the story, line by line`,
        body: [
          `Metrics say <em>where</em>; <span class="term">logs</span> say <em>what happened</em>. Each service writes timestamped events — but at thousands of requests a second, lines from different requests interleave into noise.`,
          `The trick: give every request an id at the gateway, pass it along, and include it in every log line. Filter by one id and you get one request’s story.`,
        ],
        callout: {
          kind: `tip`,
          text: `Log structured JSON, not free text — so you can filter by request id, user, service or status.`,
        },
        changes: [`+ Request id on every log line`],
        metrics: {
          detect: `2 min`,
          locate: `payments → fraud API?`,
          p99: 2400,
          signals: `metrics + logs`,
        },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({ ...uc, gw: [cc(`req=a91`, `violet`, `key`)] }),
            card: lc(
              `Logs · filtered by req=a91`,
              [
                `07.112 gateway  req=a91 POST /checkout`,
                `07.118 orders   req=a91 reserve stock: ok`,
                `07.121 payments req=a91 calling fraud-api`,
                `09.243 payments req=a91 fraud-api ok (2122 ms)`,
                `= 2.1 s inside one call`,
              ],
              `scroll`,
            ),
          },
          links: oc(),
          flows: [
            ...sc(1.6),
            { route: [`ug`, `go`, `op`, `pf`], rate: 0.35, bounce: !0, hold: 1.6, kind: `mine` },
          ],
        },
      },
      {
        short: `Traces`,
        chapter: `solution`,
        title: `Traces: follow one request everywhere`,
        body: [
          `A <span class="term">distributed trace</span> records every hop of one request as a <b>span</b> with a start time and duration, all joined by the same trace id. Drawn as a waterfall, it shows exactly where the time goes.`,
          `Follow the violet request: 2.1 of its 2.4 seconds are spent waiting for the third-party fraud API.`,
        ],
        callout: {
          kind: `insight`,
          text: `Tools: OpenTelemetry to collect, Jaeger, Tempo, Honeycomb or Datadog to explore. Instrument once, use everywhere.`,
        },
        changes: [
          `+ Trace id propagated across services`,
          `~ Cause found: fraud API ≈ 88% of the time`,
        ],
        metrics: {
          detect: `2 min`,
          locate: `5 min`,
          p99: 2400,
          signals: `metrics + logs + traces`,
        },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({ fraud: [] }),
            card: lc(`Trace a91 · 2.4 s`, [], `waypoints`, {
              chart: `bars`,
              bars: [
                { label: `gateway`, from: 0, to: 1, tone: `gray`, note: `2.4 s` },
                { label: ` orders`, from: 0.02, to: 0.98, tone: `gray`, note: `2.35 s` },
                { label: `  inventory`, from: 0.04, to: 0.06, tone: `green`, note: `30 ms` },
                { label: `  payments`, from: 0.08, to: 0.96, tone: `amber`, note: `2.2 s` },
                {
                  label: `   fraud API`,
                  from: 0.1,
                  to: 0.93,
                  tone: `red`,
                  note: `2.1 s`,
                  bold: !0,
                },
              ],
            }),
          },
          links: oc({ pf: { label: `2.1 s`, labelTone: `red` } }),
          flows: [
            ...sc(1.6),
            { route: [`ug`, `go`, `op`, `pf`], rate: 0.45, bounce: !0, hold: 1.6, kind: `mine` },
          ],
        },
      },
      {
        short: `Fixed`,
        chapter: `solution`,
        title: `Fix it, then prove it`,
        body: [
          `With the cause known, the fix is quick: call the fraud API with a 300 ms timeout, cache recent scores, and review the rare slow cases afterwards.`,
          `The same dashboards prove it worked: p99 drops from 2.4 s to 310 ms, and the SLO alert clears. Total time from page to cause: minutes, not hours.`,
        ],
        callout: {
          kind: `tip`,
          text: `Metrics tell you something is wrong, traces show where, logs explain why. You need all three.`,
        },
        changes: [`+ 300 ms timeout + cache on fraud checks`, `~ Checkout p99 2.4 s → 310 ms`],
        metrics: { detect: `2 min`, locate: `5 min`, p99: 310, signals: `metrics + logs + traces` },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({
              gw: [cc(`p99 310 ms`, `green`, `timer`)],
              pay: [cc(`timeout 300 ms + cache`, `green`, `check`)],
            }),
            card: lc(`Trace b17 · 310 ms`, [], `waypoints`, {
              chart: `bars`,
              bars: [
                { label: `gateway`, from: 0, to: 1, tone: `gray`, note: `310 ms` },
                { label: ` orders`, from: 0.03, to: 0.97, tone: `gray`, note: `300 ms` },
                { label: `  inventory`, from: 0.06, to: 0.16, tone: `green`, note: `30 ms` },
                { label: `  payments`, from: 0.2, to: 0.9, tone: `green`, note: `220 ms` },
                {
                  label: `   fraud API`,
                  from: 0.23,
                  to: 0.33,
                  tone: `green`,
                  note: `30 ms (cached)`,
                },
              ],
            }),
          },
          links: oc({ pf: { label: `timeout 300 ms · cached` } }),
          flows: sc(0),
        },
      },
      {
        short: `Incident`,
        chapter: `problem`,
        title: `Case: 3 a.m. — errors spike`,
        body: [
          `The pager fires: checkout errors jumped from 0.1% to 6% at 03:12. Inventory is the culprit on the dashboard. The deploy log shows a config change to inventory at 03:10.`,
          `Good practice is to <b>mitigate first</b>: roll the change back and restore service, and investigate the root cause afterwards — not the other way round.`,
        ],
        callout: {
          kind: `tip`,
          text: `Put deploys and config changes on your dashboards as markers. “What changed?” is the first question in almost every incident.`,
        },
        changes: [
          `+ Config change to inventory at 03:10`,
          `− Checkout errors 0.1% → 6%`,
          `~ Rolled back at 03:16`,
        ],
        metrics: { detect: `1 min`, locate: `4 min`, p99: 900, signals: `metrics + logs + traces` },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({
              gw: [cc(`errors 6%`, `red`, `siren`)],
              inv: [cc(`config change 03:10`, `red`, `alert`)],
            }),
            card: lc(`Checkout errors · last hour`, [], `chartLine`, {
              chart: `bars`,
              bars: [
                { label: `02:50`, to: 0.02, tone: `green`, note: `0.1%` },
                { label: `03:00`, to: 0.02, tone: `green`, note: `0.1%` },
                { label: `03:10 deploy`, to: 0.03, tone: `amber`, note: `0.2%`, bold: !0 },
                { label: `03:12`, to: 1, tone: `red`, note: `6%` },
                { label: `03:16 rollback`, to: 0.04, tone: `green`, note: `0.2%`, bold: !0 },
              ],
            }),
          },
          links: {
            ...oc(),
            oi: h(`orders`, `inv`, [`orders`, `inv`], { heads: `both`, fail: 0.35 }),
          },
          flows: sc(0),
        },
      },
      {
        short: `Post-mortem`,
        chapter: `insight`,
        title: `Learn from it: the post-mortem`,
        body: [
          `After the incident, the team writes a <span class="term">post-mortem</span>: a timeline, the impact, the root cause, and the actions that stop it happening again.`,
          `It’s <b>blameless</b> — the question is how the system let a mistake through, not who made it. Here: config changes now go through the same canary rollout as code.`,
        ],
        callout: {
          kind: `insight`,
          text: `Each incident is expensive training data. Teams that write good post-mortems make the same mistake much less often.`,
        },
        changes: [`+ Post-mortem written`, `+ Action: canary rollout for config too`],
        metrics: { detect: `1 min`, locate: `4 min`, p99: 310, signals: `metrics + logs + traces` },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({ gw: [cc(`p99 310 ms`, `green`, `timer`)] }),
            card: lc(
              `Post-mortem · checkout errors`,
              [
                `impact: 6% of checkouts failed, 4 min`,
                `cause: bad timeout in inventory config`,
                `detect 1 min · mitigate 4 min (rollback)`,
                `= action: canary rollout for config`,
                `= action: alert on config-change errors`,
              ],
              `scroll`,
            ),
          },
          links: oc(),
          flows: sc(0),
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>Metrics</b> (rate, errors, duration) show where it hurts.</li>
          <li><b>Alert on SLOs</b> — what users feel — not on raw CPU.</li>
          <li><b>Logs</b> with a request id tell one request’s story.</li>
          <li><b>Traces</b> follow a request across every service.</li>
          <li>In an incident, <b>mitigate first</b>; then write a <b>blameless post-mortem</b>.</li>
        </ul>`,
          `Instrument before you need it — the outage is the wrong time to add logging.`,
        ],
        callout: {
          kind: `next`,
          text: `That completes Reliability. Next module: <b>Architecture</b> — starting with monoliths vs microservices.`,
        },
        metrics: { detect: `2 min`, locate: `5 min`, p99: 310, signals: `metrics + logs + traces` },
        scene: {
          entities: { shoppers: rc(), ...ac({ gw: [cc(`p99 310 ms`, `green`, `timer`)] }) },
          links: oc(),
          flows: sc(0),
        },
      },
    ],
  };

const fc = { x0: -4.5, x1: 4.5, y0: -25, y1: -19 };

const pc = () => p(fc, 13, `shoppers`);

const mc = (e, t = {}) =>
    d(e, 0, {
      s: 5.5,
      h: 60,
      color: `orange`,
      glyph: `box`,
      label: [`Monolith`],
      sub: `all features`,
      ...t,
    });

const hc = (e = {}, t = {}, n = {}) => ({
    users: pc(),
    lb: f(0, -12),
    m1: mc(-5, e),
    m2: mc(5, t),
    mdb: b(0, 11, { r: 2.2, h: 44, label: `one database`, ...n }),
  });

const gc = {
    ul: h(`users`, `lb`, [`users`, `lb`], { heads: `both` }),
    l1: h(`lb`, `m1`, [`lb`, [`m1`, `lb`], `m1`]),
    l2: h(`lb`, `m2`, [`lb`, [`m2`, `lb`], `m2`]),
    d1: h(`m1`, `mdb`, [`m1`, [`m1`, `mdb`], `mdb`], { heads: `both` }),
    d2: h(`m2`, `mdb`, [`m2`, [`m2`, `mdb`], `mdb`], { heads: `both` }),
  };

const _c = [
    { routes: [{ path: [`ul`, `l1`, `d1`] }, { path: [`ul`, `l2`, `d2`] }], rate: 2.4, bounce: !0 },
  ];

const vc = {
    usr: { x: -13.5, color: `green`, glyph: `user`, label: [`Users`] },
    cat: { x: -4.5, color: `yellow`, glyph: `layers`, label: [`Catalog`] },
    ord: { x: 4.5, color: `blue`, glyph: `cart`, label: [`Orders`] },
    pay: { x: 13.5, color: `purple`, glyph: `creditCard`, label: [`Payments`] },
  };

const yc = Object.keys(vc);

const bc = (e = []) =>
    d(0, -12, {
      color: `orange`,
      glyph: `route`,
      label: [`API`, `Gateway`],
      tags: e,
      pills: `below`,
    });

const xc = (e = {}) =>
    Object.fromEntries(yc.map((t) => [t, d(vc[t].x, 0, { ...vc[t], ...(e[t] || {}) })]));

const Sc = () =>
    Object.fromEntries(yc.map((e) => [`${e}db`, b(vc[e].x, 10, { r: 1.5, h: 30, label: `` })]));

const Cc = (e = {}) => ({
    ug: h(`users`, `gw`, [`users`, `gw`], { heads: `both` }),
    ...Object.fromEntries(
      yc.map((t) => [
        `g${t}`,
        h(`gw`, t, [`gw`, [t, `gw`], t], { heads: `both`, ...(e[t] || {}) }),
      ]),
    ),
  });

const wc = () =>
    Object.fromEntries(yc.map((e) => [`d${e}`, h(e, `${e}db`, [e, `${e}db`], { heads: `both` })]));

const Tc = (e = {}) => ({
    op: h(`ord`, `pay`, [`ord`, `pay`], { heads: `both`, label: `API call`, ...e }),
  });

const Ec = (e = 2.6) => [
    { routes: yc.map((e) => ({ path: [`ug`, `g${e}`, `d${e}`] })), rate: e, bounce: !0 },
  ];

const Dc = (e, t, n) => S({ x: 4.5, y: 10, z: 0, dx: 60, dy: -175 }, e, t, { icon: n });

// --- architecture ---
const Oc = {
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

const kc = { color: `purple`, glyph: `creditCard`, label: [`Payments`] };

const Ac = (e = []) => d(-12, 0, { color: `blue`, glyph: `cart`, label: [`Orders`], tags: e });

const jc = (e, t, n = {}) => d(0, e, { ...kc, sub: t, ...n });

const Mc = (e) => ({ pa: jc(-9, `10.0.3.7`, e) });

const Nc = (e) => ({ pb: jc(0, `10.0.3.8`, e) });

const Pc = (e) => ({ pc: jc(9, `10.0.5.21`, e) });

const Fc = (e) => ({ pn: jc(-9, `10.0.6.4`, e) });

const Ic = (e = {}) => d(12, 0, { color: `yellow`, glyph: `signpost`, label: [`Registry`], ...e });

const I = (e, t = {}) =>
    h(`ord`, e, e === `pb` ? [`ord`, `pb`] : [`ord`, [-6, `ord`], [-6, e], e], {
      heads: `both`,
      ...t,
    });

const L = (e, t = {}) =>
    h(e, `reg`, e === `pb` ? [`pb`, `reg`] : [e, [6, e], [6, `reg`], `reg`], {
      heads: `none`,
      style: `beat`,
      ...t,
    });

const Lc = (e = {}) => ({
    lk: h(`ord`, `reg`, [`ord`, [`ord`, 13], [`reg`, 13], `reg`], {
      heads: `both`,
      label: `where is payments?`,
      labelAt: 0.27,
      ...e,
    }),
  });

const Rc = (e, t = 2.4) => ({ routes: e.map((e) => ({ path: [`o${e}`] })), rate: t, bounce: !0 });

const zc = (e, t = 0.55) => ({
    fanout: !0,
    routes: e.map((e) => ({ path: [`h${e}`] })),
    kind: `ping`,
    rate: t,
  });

const Bc = (e = 0.4) => ({ route: [`lk`], rate: e, bounce: !0 });

const Vc = (e, t) => d(e, t, { s: 2.2, h: 22, color: `slab`, glyph: `shield`, label: [] });

const Hc = (e, t, n) => S({ x: 12, y: 0, z: 0, dx: 50, dy: -60 }, e, t, { icon: n });

const Uc = {
    id: `service-discovery`,
    title: `Service Discovery & Gateways`,
    summary: `How services find each other when instances come and go — and one front door for everyone outside.`,
    minutes: 13,
    level: `intermediate`,
    metrics: [`deadCalls`, `instances`, `lookup`],
    legend: [`req`, `res`, [`ping`, `heartbeat`], `fail`],
    goals: [
      { text: `Why hard-coded addresses break`, step: 1 },
      { text: `Registries, heartbeats and DNS`, step: 3 },
      { text: `Client-side vs server-side discovery`, step: 4 },
      { text: `Readiness, slow start and draining`, step: 7 },
      { text: `A registry that can’t go down`, step: 8 },
      { text: `Service meshes and API gateways`, step: 11 },
    ],
    steps: [
      {
        short: `Config`,
        chapter: `setup`,
        title: `Orders calls Payments`,
        body: [
          `With microservices, Orders needs to call Payments. The simplest way: put the payment servers’ IP addresses in Orders’ config file and spread calls across them.`,
          `It works — as long as those two machines never change.`,
        ],
        callout: {
          kind: `insight`,
          text: `In a monolith this question doesn’t exist: “calling payments” is a function call in the same process.`,
        },
        metrics: { deadCalls: 0, instances: 2, lookup: `hard-coded IPs` },
        scene: {
          entities: {
            ord: Ac([{ text: `config: 10.0.3.7, 10.0.3.8`, icon: `file` }]),
            ...Mc(),
            ...Nc(),
          },
          links: { opa: I(`pa`), opb: I(`pb`) },
          flows: [Rc([`pa`, `pb`])],
        },
      },
      {
        short: `Churn`,
        chapter: `problem`,
        title: `Instances come and go`,
        body: [
          `In the cloud, servers are cattle: the autoscaler adds and removes them, deploys replace them, crashed ones are swapped out. Instance 10.0.3.7 was just replaced by a new one at 10.0.5.21.`,
          `Orders still has the old list. Half its calls go to an address where nothing answers, while the new instance sits idle.`,
        ],
        callout: {
          kind: `warn`,
          text: `Any address written into config goes stale. In an autoscaled system that can happen many times a day.`,
        },
        changes: [
          `− 10.0.3.7 replaced`,
          `+ New instance 10.0.5.21 (unknown to Orders)`,
          `− 50% of calls fail`,
        ],
        metrics: { deadCalls: 50, instances: 2, lookup: `hard-coded IPs` },
        scene: {
          entities: {
            ord: Ac([{ text: `config: 10.0.3.7, 10.0.3.8`, icon: `file` }]),
            ...Mc({ ...g, tags: [{ text: `replaced`, tone: `red`, icon: `alert` }] }),
            ...Nc(),
            ...Pc({ dim: 1, tags: [{ text: `idle · nobody knows it`, tone: `gray` }] }),
          },
          links: { opa: I(`pa`, { fail: 1 }), opb: I(`pb`) },
          flows: [Rc([`pa`, `pb`])],
        },
      },
      {
        short: `Registry`,
        chapter: `solution`,
        title: `A service registry`,
        body: [
          `Every instance <b>registers</b> itself with a <span class="term">service registry</span> when it starts, then keeps sending heartbeats (the green pings). Orders asks the registry “where is payments?” and gets the current list.`,
          `Popular registries: Consul, etcd, ZooKeeper, Eureka — and Kubernetes, which does this for every service automatically.`,
        ],
        callout: {
          kind: `tip`,
          text: `Orders caches the list for a few seconds instead of asking on every call — the registry must not become a bottleneck.`,
        },
        changes: [
          `+ Service registry`,
          `+ Instances register + heartbeat`,
          `~ Orders looks up payments’ addresses`,
        ],
        metrics: { deadCalls: 0, instances: 2, lookup: `registry` },
        scene: {
          entities: {
            ord: Ac([{ text: `cached list · 10 s`, icon: `clock` }]),
            ...Nc(),
            ...Pc(),
            reg: Ic({
              tags: [{ text: `payments → .3.8, .5.21`, tone: `green`, icon: `listOrdered` }],
            }),
          },
          links: { opb: I(`pb`), opc: I(`pc`), hpb: L(`pb`), hpc: L(`pc`), ...Lc() },
          flows: [Rc([`pb`, `pc`]), zc([`pb`, `pc`]), Bc()],
        },
      },
      {
        short: `Churn again`,
        chapter: `insight`,
        title: `Instances join and leave by themselves`,
        body: [
          `Now churn is harmless. A new instance (10.0.6.4) starts, registers, and gets traffic within seconds. Instance 10.0.5.21 hangs: it misses three heartbeats, and the registry drops it.`,
          `Nobody edited a config file.`,
        ],
        callout: {
          kind: `insight`,
          text: `Heartbeats turn “is it alive?” into data the registry can act on — the same idea as load balancer health checks.`,
        },
        changes: [`+ 10.0.6.4 registers`, `− 10.0.5.21 missed 3 heartbeats → removed`],
        metrics: { deadCalls: 0, instances: 2, lookup: `registry` },
        scene: {
          entities: {
            ord: Ac([{ text: `cached list · 10 s`, icon: `clock` }]),
            ...Fc({ tags: [{ text: `new · registered`, tone: `green`, icon: `check` }] }),
            ...Nc(),
            ...Pc({
              ...g,
              tags: [{ text: `missed 3 heartbeats`, tone: `red`, icon: `heartPulse` }],
            }),
            reg: Ic({
              tags: [{ text: `payments → .3.8, .6.4`, tone: `green`, icon: `listOrdered` }],
            }),
          },
          links: {
            opn: h(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: I(`pb`),
            hpn: h(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: L(`pb`),
            hpc: L(`pc`, { style: `off` }),
            ...Lc(),
          },
          flows: [Rc([`pn`, `pb`]), zc([`pn`, `pb`]), Bc()],
        },
      },
      {
        short: `Who balances`,
        chapter: `technique`,
        title: `Client-side or server-side?`,
        body: [
          `<b>Client-side discovery</b>: Orders gets the list itself and picks an instance (round robin, least loaded). No extra hop, but every client needs that logic.`,
          `<b>Server-side discovery</b>: Orders calls one stable name, and an internal load balancer — or a Kubernetes Service — looks up the instances and forwards the call. Clients stay simple.`,
        ],
        callout: {
          kind: `tip`,
          text: `Kubernetes gives every service a stable name and virtual IP; most teams never see the registry at all.`,
        },
        metrics: { deadCalls: 0, instances: 2, lookup: `registry` },
        scene: {
          entities: {
            ord: Ac(),
            ...Fc(),
            ...Nc(),
            reg: Ic(),
            card: Hc(
              `Who picks the instance?`,
              [
                `client-side   Orders gets the list,`,
                `              balances itself`,
                `server-side   Orders calls “payments”,`,
                `              a proxy picks for it`,
              ],
              `split`,
            ),
          },
          links: {
            opn: h(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: I(`pb`),
            hpn: h(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: L(`pb`),
            ...Lc(),
          },
          flows: [Rc([`pn`, `pb`]), zc([`pn`, `pb`]), Bc()],
        },
      },
      {
        short: `DNS`,
        chapter: `technique`,
        title: `Discovery through DNS`,
        body: [
          `The registry can also answer through plain <span class="term">DNS</span>: looking up <code>payments.internal</code> returns the healthy instances’ IPs. Every language and tool already speaks DNS.`,
          `The catch is caching: clients and libraries may keep an answer for its whole TTL (or longer), still calling an instance that has gone away. Keep TTLs short and retry on connection errors.`,
        ],
        callout: {
          kind: `warn`,
          text: `Some runtimes cache DNS answers forever by default. Check yours before relying on DNS-based discovery.`,
        },
        changes: [`~ Registry answers DNS queries`, `~ payments.internal → healthy IPs · TTL 10 s`],
        metrics: { deadCalls: 0, instances: 2, lookup: `DNS` },
        scene: {
          entities: {
            ord: Ac([{ text: `resolves payments.internal`, icon: `globe` }]),
            ...Fc(),
            ...Nc(),
            reg: Ic({ glyph: `globe`, label: [`DNS`], sub: `TTL 10 s` }),
          },
          links: {
            opn: h(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: I(`pb`),
            hpn: h(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: L(`pb`),
            ...Lc({ label: `payments.internal?` }),
          },
          flows: [Rc([`pn`, `pb`]), zc([`pn`, `pb`]), Bc()],
        },
      },
      {
        short: `Too early`,
        chapter: `problem`,
        title: `Case: traffic before it’s ready`,
        body: [
          `A new instance registers the moment its process starts — before it has opened database connections or warmed its caches. The registry hands its address out at once, it gets a full share of traffic, and for 30 seconds a third of payment calls time out.`,
          `Being <em>alive</em> is not the same as being <em>ready</em>.`,
        ],
        callout: {
          kind: `warn`,
          text: `Cold starts are worst right after deploys and autoscaling — exactly when traffic is moving around anyway.`,
        },
        changes: [
          `+ New instance 10.0.5.21 · still starting`,
          `− Gets traffic immediately`,
          `− Calls to it time out`,
        ],
        metrics: { deadCalls: 33, instances: 3, lookup: `DNS` },
        scene: {
          entities: {
            ord: Ac([{ text: `resolves payments.internal`, icon: `globe` }]),
            ...Fc(),
            ...Nc(),
            ...Pc({
              heat: 0.6,
              tags: [{ text: `just started · cold`, tone: `amber`, icon: `hourglass` }],
            }),
            reg: Ic({ glyph: `globe`, label: [`DNS`], sub: `TTL 10 s` }),
          },
          links: {
            opn: I(`pn`),
            opb: I(`pb`),
            opc: I(`pc`, { fail: 0.8 }),
            hpn: L(`pn`),
            hpb: L(`pb`),
            hpc: L(`pc`),
          },
          flows: [Rc([`pn`, `pb`, `pc`], 2.8), zc([`pn`, `pb`, `pc`])],
        },
      },
      {
        short: `Ready`,
        chapter: `solution`,
        title: `Readiness, slow start and draining`,
        body: [
          `Separate two checks: <b>liveness</b> (“the process is running”) and <b>readiness</b> (“it can serve requests now”). An instance is only listed once it passes its readiness check, and balancers ramp its share up gradually — <span class="term">slow start</span>.`,
          `Shutdown is the mirror image: deregister first, wait for in-flight requests to finish (<b>draining</b>), then stop.`,
        ],
        callout: {
          kind: `tip`,
          text: `Kubernetes has these built in: readinessProbe, livenessProbe, and a preStop hook plus grace period for draining.`,
        },
        changes: [
          `+ Readiness check before listing`,
          `+ Slow start: 10% → 100% over a minute`,
          `+ Deregister, drain, then stop`,
        ],
        metrics: { deadCalls: 0, instances: 3, lookup: `DNS` },
        scene: {
          entities: {
            ord: Ac([{ text: `resolves payments.internal`, icon: `globe` }]),
            ...Fc(),
            ...Nc(),
            ...Pc({
              tags: [{ text: `ready ✓ · ramping 10% → 100%`, tone: `green`, icon: `trendingUp` }],
            }),
            reg: Ic({ glyph: `globe`, label: [`DNS`], sub: `TTL 10 s` }),
          },
          links: {
            opn: I(`pn`),
            opb: I(`pb`),
            opc: I(`pc`, { style: `dashed` }),
            hpn: L(`pn`),
            hpb: L(`pb`),
            hpc: L(`pc`),
          },
          flows: [
            {
              routes: [
                { path: [`opn`], weight: 1 },
                { path: [`opb`], weight: 1 },
                { path: [`opc`], weight: 0.25 },
              ],
              pick: `weights`,
              rate: 2.8,
              bounce: !0,
            },
            zc([`pn`, `pb`, `pc`]),
          ],
        },
      },
      {
        short: `Registry down`,
        chapter: `insight`,
        title: `What if the registry goes down?`,
        body: [
          `Everything now depends on the registry, so it can’t be a single point of failure. Two things save you. Callers <b>cache</b> their last known list, so traffic keeps flowing even while the registry is unreachable — they just won’t see changes for a while.`,
          `And the registry runs as a small <b>cluster</b> of 3 or 5 nodes that agree by majority vote (Raft or Paxos). Losing one node — or even two out of five — changes nothing.`,
        ],
        callout: {
          kind: `insight`,
          text: `etcd, Consul and ZooKeeper are all consensus clusters. Odd sizes matter: 3 nodes survive 1 failure, 5 survive 2.`,
        },
        changes: [
          `+ Registry runs as 3 nodes`,
          `− One node down`,
          `~ Majority (2 of 3) keeps answering`,
        ],
        metrics: { deadCalls: 0, instances: 2, lookup: `registry` },
        scene: {
          entities: {
            ord: Ac([{ text: `cached list · still works`, tone: `green`, icon: `clock` }]),
            ...Fc(),
            ...Nc(),
            reg: Ic({ tags: [{ text: `leader · 2 of 3 up`, tone: `green`, icon: `check` }] }),
            reg2: d(19, 0, { s: 3, h: 32, color: `yellow`, glyph: `signpost`, label: [], ...g }),
            reg3: d(12, -8, { s: 3, h: 32, color: `yellow`, glyph: `signpost`, label: [] }),
          },
          links: {
            opn: I(`pn`),
            opb: I(`pb`),
            hpn: L(`pn`),
            hpb: L(`pb`),
            ...Lc(),
            r2: h(`reg`, `reg2`, [`reg`, `reg2`], { heads: `none`, style: `off` }),
            r3: h(`reg`, `reg3`, [`reg`, `reg3`], { heads: `none`, style: `beat` }),
          },
          flows: [
            Rc([`pn`, `pb`]),
            zc([`pn`, `pb`]),
            Bc(),
            { route: [`r3`], kind: `ping`, rate: 0.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Plumbing`,
        chapter: `problem`,
        title: `Every team rebuilds the same plumbing`,
        body: [
          `Discovery is only the start. Every call between services also needs timeouts, retries, circuit breakers, encryption and metrics.`,
          `With services in Java, Go, Python and Node, each team writes its own version of all of that — with its own bugs, and its own defaults.`,
        ],
        callout: {
          kind: `warn`,
          text: `Five implementations of retry logic means five different behaviours during an outage.`,
        },
        changes: [`+ Retry/TLS/metrics code in every service`],
        metrics: { deadCalls: 0, instances: 2, lookup: `DNS` },
        scene: {
          entities: {
            ord: Ac([{ text: `retries · TLS · metrics (Java)`, tone: `amber`, icon: `settings` }]),
            ...Fc({
              tags: [{ text: `retries · TLS · metrics (Go)`, tone: `amber`, icon: `settings` }],
            }),
            ...Nc(),
            reg: Ic({ glyph: `globe`, label: [`DNS`], sub: `TTL 10 s` }),
          },
          links: {
            opn: h(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: I(`pb`),
            hpn: h(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: L(`pb`),
            ...Lc({ label: `payments.internal?` }),
          },
          flows: [Rc([`pn`, `pb`]), zc([`pn`, `pb`]), Bc()],
        },
      },
      {
        short: `Mesh`,
        chapter: `solution`,
        title: `A service mesh: sidecars do it`,
        body: [
          `A <span class="term">service mesh</span> (Istio, Linkerd) runs a small proxy — a <b>sidecar</b> — next to every service. Each service just talks to its local sidecar; the sidecars find instances, retry, time out, encrypt (mTLS) and report metrics.`,
          `A <b>control plane</b> pushes the current instances and policies to every sidecar. The plumbing is written once, in one place.`,
        ],
        callout: {
          kind: `tip`,
          text: `A mesh adds latency (two extra local hops) and real operational complexity. Worth it with many services; overkill for a handful.`,
        },
        changes: [
          `+ Sidecar proxy next to each service`,
          `~ Registry → control plane`,
          `− Plumbing code removed from services`,
        ],
        metrics: { deadCalls: 0, instances: 2, lookup: `mesh sidecars` },
        scene: {
          entities: {
            ord: Ac(),
            ...Fc(),
            ...Nc(),
            reg: Ic({ glyph: `settings`, label: [`Control`, `Plane`] }),
            so: Vc(-9.6, 2.4),
            spn: Vc(2.4, -6.6),
            spb: Vc(2.4, 2.4),
          },
          links: {
            opn: h(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: I(`pb`),
            hpn: h(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: L(`pb`),
            push: h(`reg`, `ord`, [`reg`, [`reg`, 13], [`ord`, 13], `ord`], {
              label: `config pushed to sidecars`,
              labelAt: 0.73,
            }),
          },
          flows: [
            Rc([`pn`, `pb`]),
            zc([`pn`, `pb`]),
            { route: [`push`], rate: 0.35, kind: `write` },
          ],
        },
      },
      {
        short: `Gateway`,
        chapter: `technique`,
        title: `At the edge: an API gateway`,
        body: [
          `Discovery handles calls <em>between</em> services. For clients outside — apps and browsers — an <span class="term">API gateway</span> is the single front door: it authenticates requests, applies rate limits, terminates TLS and routes each path to the right service.`,
          `Clients never learn your internal layout, so you can split, merge or move services freely.`,
        ],
        callout: {
          kind: `tip`,
          text: `Different clients often get their own gateway — a backend-for-frontend (BFF) — that shapes responses for mobile or web.`,
        },
        changes: [`+ API gateway in front of the services`, `+ Clients only know the gateway`],
        metrics: { deadCalls: 0, instances: 2, lookup: `mesh sidecars` },
        scene: {
          entities: {
            clients: p({ x0: -16.5, x1: -7.5, y0: -25, y1: -19 }, 11, `apps & browsers`),
            gw: d(-12, -11, {
              color: `orange`,
              glyph: `route`,
              label: [`API`, `Gateway`],
              tags: [{ text: `auth · rate limits · routing`, icon: `shield` }],
              pills: `below`,
            }),
            ord: Ac(),
            ...Fc(),
            ...Nc(),
            reg: Ic({ glyph: `settings`, label: [`Control`, `Plane`] }),
            so: Vc(-9.6, 2.4),
            spn: Vc(2.4, -6.6),
            spb: Vc(2.4, 2.4),
          },
          links: {
            cg: h(`clients`, `gw`, [`clients`, `gw`], { heads: `both` }),
            go: h(`gw`, `ord`, [`gw`, `ord`], { heads: `both` }),
            opn: h(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: I(`pb`),
            hpn: h(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: L(`pb`),
          },
          flows: [
            {
              routes: [{ path: [`cg`, `go`, `opn`] }, { path: [`cg`, `go`, `opb`] }],
              rate: 2.2,
              bounce: !0,
            },
            zc([`pn`, `pb`]),
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Hard-coded addresses go stale as instances come and go.</li>
          <li>A <b>registry</b> with heartbeats (or <b>DNS</b>) keeps the list current.</li>
          <li>List instances only when <b>ready</b>; deregister and <b>drain</b> before stopping.</li>
          <li>Discovery can live in the client, a proxy, or a <b>mesh sidecar</b>.</li>
          <li>An <b>API gateway</b> is the one front door for outside clients.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Sagas</b> — keeping data consistent when one action spans several services.`,
        },
        metrics: { deadCalls: 0, instances: 2, lookup: `mesh sidecars` },
        scene: {
          entities: {
            ord: Ac(),
            ...Fc(),
            ...Nc(),
            reg: Ic(),
            so: Vc(-9.6, 2.4),
            spn: Vc(2.4, -6.6),
            spb: Vc(2.4, 2.4),
          },
          links: {
            opn: h(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: I(`pb`),
            hpn: h(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: L(`pb`),
            ...Lc(),
          },
          flows: [Rc([`pn`, `pb`]), zc([`pn`, `pb`]), Bc()],
        },
      },
    ],
  };

const Wc = {
    fl: { x: -9, color: `blue`, glyph: `plane`, label: [`Flights`] },
    ho: { x: 0, color: `yellow`, glyph: `hotel`, label: [`Hotels`] },
    car: { x: 9, color: `green`, glyph: `car`, label: [`Cars`] },
  };

const Gc = Object.keys(Wc);

const Kc = (e = []) => y(0, -20, { label: `traveller`, tags: e });

const qc = (e = {}) =>
    d(0, -9, { color: `orange`, glyph: `route`, label: [`Trip`, `Service`], pills: `below`, ...e });

const Jc = (e = {}) =>
    Object.fromEntries(Gc.map((t) => [t, d(Wc[t].x, 2, { ...Wc[t], ...(e[t] || {}) })]));

const Yc = () =>
    Object.fromEntries(Gc.map((e) => [`${e}db`, b(Wc[e].x, 11, { r: 1.5, h: 30, label: `` })]));

const R = {
    ut: { ut: h(`trav`, `trip`, [`trav`, `trip`], { heads: `both` }) },
    calls: (e = `trip`, t = {}) =>
      Object.fromEntries(
        Gc.map((n) => [`${e[0]}${n}`, h(e, n, [e, [n, e], n], { heads: `both`, ...(t[n] || {}) })]),
      ),
    dbs: () =>
      Object.fromEntries(
        Gc.map((e) => [`d${e}`, h(e, `${e}db`, [e, `${e}db`], { heads: `both` })]),
      ),
  };

const Xc = (e) => ({ text: `${e} booked`, tone: `green`, icon: `check` });

const Zc = (e, t, n) => S({ x: 9, y: 11, z: 0, dx: -30, dy: -195 }, e, t, { icon: n });

const Qc = (e = `t`, t = {}) =>
    Gc.map((n) => ({ route: [`${e}${n}`, `d${n}`], rate: 0.6, bounce: !0, ...(t[n] || {}) }));

const $c = {
    id: `sagas`,
    title: `Sagas & Distributed Transactions`,
    summary: `One action, several services, several databases: how to keep it all-or-nothing without one big transaction.`,
    minutes: 13,
    level: `advanced`,
    metrics: [`allOrNothing`, `blocked`, `coord`],
    legend: [
      `req`,
      `res`,
      [`ping`, `prepare`],
      [`write`, `commit / step`],
      [`kill`, `compensation`],
      `fail`,
    ],
    goals: [
      { text: `Why one transaction can’t span services`, step: 0 },
      { text: `Two-phase commit and why it blocks`, step: 2 },
      { text: `Sagas and compensating actions`, step: 3 },
      { text: `Orchestration vs choreography`, step: 5 },
      { text: `Failing undos and unknown outcomes`, step: 9 },
    ],
    steps: [
      {
        short: `Half a trip`,
        chapter: `problem`,
        title: `One trip, three databases`,
        body: [
          `A traveller books a trip: a flight, a hotel and a rental car. Each lives in a different service with its own database (database per service, from the previous lessons).`,
          `The trip service books the flight — done. The hotel — done. The car — <b>no cars left</b>. Now the traveller has a flight and a hotel they can’t use, and has been charged for both.`,
        ],
        callout: {
          kind: `warn`,
          text: `BEGIN … COMMIT only works inside one database. Across services, there is no built-in “undo everything”.`,
        },
        metrics: { allOrNothing: `no`, blocked: `—`, coord: `none` },
        scene: {
          entities: {
            trav: Kc([{ text: `flight + hotel, no car`, tone: `red`, icon: `alert` }]),
            trip: qc(),
            ...Jc({
              fl: { tags: [Xc(`flight`)] },
              ho: { tags: [Xc(`room`)] },
              car: { tags: [{ text: `no cars left`, tone: `red`, icon: `alert` }] },
            }),
            ...Yc(),
          },
          links: { ...R.ut, ...R.calls(`trip`, { car: { fail: 1 } }), ...R.dbs() },
          flows: [
            { route: [`ut`], rate: 0.6, bounce: !0 },
            ...Qc(`t`, { car: { route: [`tcar`], bounce: !1 } }),
          ],
        },
      },
      {
        short: `2PC`,
        chapter: `technique`,
        title: `Two-phase commit`,
        body: [
          `A classic fix is <span class="term">two-phase commit</span> (2PC). Phase 1: a coordinator asks every participant to <b>prepare</b> — do the work, lock the rows, and promise it can commit (the pings). Phase 2: if all said yes, it tells everyone to <b>commit</b>; if anyone said no, everyone rolls back.`,
          `The car service votes no, so nothing is booked anywhere. All or nothing.`,
        ],
        callout: {
          kind: `tip`,
          text: `2PC is used inside some databases and with XA transactions. It needs every participant to support it — most web APIs and many NoSQL stores don’t.`,
        },
        changes: [
          `~ Trip service becomes a 2PC coordinator`,
          `+ Prepare → vote → commit or roll back`,
        ],
        metrics: { allOrNothing: `yes`, blocked: `during commit`, coord: `2PC` },
        scene: {
          entities: {
            trav: Kc([{ text: `no car → nothing booked`, tone: `amber` }]),
            trip: qc({
              label: [`Coordinator`],
              tags: [
                { text: `votes: yes · yes · no → roll back`, tone: `amber`, icon: `listOrdered` },
              ],
            }),
            ...Jc({
              fl: { tags: [{ text: `prepared ✓` }] },
              ho: { tags: [{ text: `prepared ✓` }] },
              car: { tags: [{ text: `vote: no`, tone: `red` }] },
            }),
            ...Yc(),
          },
          links: { ...R.ut, ...R.calls(), ...R.dbs() },
          flows: [
            {
              fanout: !0,
              routes: Gc.map((e) => ({ path: [`t${e}`] })),
              kind: `ping`,
              rate: 0.5,
              bounce: !0,
            },
            { fanout: !0, routes: Gc.map((e) => ({ path: [`t${e}`] })), kind: `kill`, rate: 0.25 },
          ],
        },
      },
      {
        short: `Blocked`,
        chapter: `problem`,
        title: `When the coordinator dies`,
        body: [
          `The weakness: after preparing, participants must wait for the coordinator’s decision. If it crashes right then, flights and hotels sit “prepared”, holding locks on seats and rooms, unable to commit or roll back on their own.`,
          `Other travellers trying to book those seats and rooms wait too — until the coordinator recovers. (The trip itself stays all-or-nothing; it just can’t finish.)`,
        ],
        callout: {
          kind: `warn`,
          text: `2PC is a blocking protocol: one slow or dead coordinator can freeze every participant. Across services and the internet, that’s usually unacceptable.`,
        },
        changes: [`− Coordinator crashed after prepare`, `− Seats and rooms stay locked`],
        metrics: { allOrNothing: `yes`, blocked: `3 services`, coord: `2PC` },
        scene: {
          entities: {
            trav: Kc([{ text: `waiting…`, tone: `amber`, icon: `hourglass` }]),
            trip: qc({ ...g, label: [`Coordinator`] }),
            ...Jc({
              fl: { heat: 0.4, tags: [{ text: `locked`, tone: `red`, icon: `lock` }] },
              ho: { heat: 0.4, tags: [{ text: `locked`, tone: `red`, icon: `lock` }] },
              car: { heat: 0.4, tags: [{ text: `locked`, tone: `red`, icon: `lock` }] },
            }),
            ...Yc(),
          },
          links: {
            ...R.ut,
            ...R.calls(`trip`, {
              fl: { style: `off` },
              ho: { style: `off` },
              car: { style: `off` },
            }),
            ...R.dbs(),
          },
          flows: [{ route: [`ut`], rate: 0.6, bounce: !0, hold: 2 }],
        },
      },
      {
        short: `Saga`,
        chapter: `solution`,
        title: `A saga: commit step by step, undo on failure`,
        body: [
          `A <span class="term">saga</span> splits the trip into local transactions that each commit immediately: book flight, then book hotel, then rent car. Nothing is held open.`,
          `Every step has a <b>compensating action</b> that semantically undoes it. When the car fails, the saga runs them in reverse: cancel the hotel, then cancel the flight (the red rings).`,
        ],
        callout: {
          kind: `insight`,
          text: `A saga trades isolation for availability: no locks are held across services, but the system is briefly in between states.`,
        },
        changes: [
          `~ Each step commits locally`,
          `+ Compensations: cancel hotel ← cancel flight`,
          `~ No locks held across services`,
        ],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `saga` },
        scene: {
          entities: {
            trav: Kc([{ text: `no car → fully refunded`, tone: `green`, icon: `check` }]),
            trip: qc(),
            ...Jc({
              fl: { tags: [{ text: `booked → cancelled`, tone: `amber`, icon: `undo` }] },
              ho: { tags: [{ text: `booked → cancelled`, tone: `amber`, icon: `undo` }] },
              car: { tags: [{ text: `no cars left`, tone: `red`, icon: `alert` }] },
            }),
            ...Yc(),
            card: Zc(
              `The saga`,
              [
                `1. book flight   ✓   undo: cancel flight`,
                `2. book hotel    ✓   undo: cancel hotel`,
                `! 3. rent car     ✗`,
                `= run undos in reverse: 2 ← 1`,
              ],
              `undo`,
            ),
          },
          links: { ...R.ut, ...R.calls(`trip`, { car: { fail: 1 } }), ...R.dbs() },
          flows: [
            ...Qc(`t`, { car: { route: [`tcar`], bounce: !1 } }),
            { route: [`tho`], kind: `kill`, rate: 0.4 },
            { route: [`tfl`], kind: `kill`, rate: 0.4 },
          ],
        },
      },
      {
        short: `Orchestration`,
        chapter: `technique`,
        title: `Orchestration: one service runs the saga`,
        body: [
          `In an <b>orchestrated</b> saga, one component — the orchestrator — is a small state machine: it tells each service what to do next, waits for the answer, and decides whether to continue or compensate.`,
          `It saves every state change to its own database, so if it crashes it resumes exactly where it stopped.`,
        ],
        callout: {
          kind: `tip`,
          text: `Workflow engines such as Temporal, AWS Step Functions and Camunda are built for this: durable, resumable, observable sagas.`,
        },
        changes: [`~ Trip service → saga orchestrator`, `+ Saga state saved after every step`],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `orchestrator` },
        scene: {
          entities: {
            trav: Kc(),
            trip: qc({
              label: [`Saga`, `Orchestrator`],
              tags: [{ text: `trip 81: hotel ✓ · car pending`, icon: `workflow` }],
            }),
            odb: b(-11, -9, { r: 1.5, h: 30, glyph: `listOrdered`, label: `saga state` }),
            ...Jc({ fl: { tags: [Xc(`flight`)] }, ho: { tags: [Xc(`room`)] } }),
            ...Yc(),
          },
          links: {
            ...R.ut,
            so: h(`trip`, `odb`, [`trip`, `odb`], { heads: `both` }),
            ...R.calls(),
            ...R.dbs(),
          },
          flows: [...Qc(`t`), { route: [`so`], kind: `write`, rate: 1.2 }],
        },
      },
      {
        short: `Choreography`,
        chapter: `technique`,
        title: `Choreography: services react to events`,
        body: [
          `In a <b>choreographed</b> saga there is no conductor. Flights publishes <code>FlightBooked</code>; Hotels listens, books a room and publishes <code>HotelBooked</code>; Cars listens and rents a car — or publishes <code>CarFailed</code>, which Hotels and Flights react to by cancelling.`,
          `No central component to build or run — but the flow is spread across every service, and harder to follow and change.`,
        ],
        callout: {
          kind: `insight`,
          text: `Choreography suits short sagas with few steps. As sagas grow, an orchestrator is usually easier to reason about.`,
        },
        changes: [
          `− Orchestrator`,
          `+ Event bus`,
          `~ Each service reacts to the previous step’s event`,
        ],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `events` },
        scene: {
          entities: {
            trav: Kc(),
            bus: d(0, -9, { color: `slab`, glyph: `radio`, label: [`Event`, `Bus`] }),
            ...Jc({
              fl: { tags: [{ text: `→ FlightBooked` }] },
              ho: { tags: [{ text: `→ HotelBooked` }] },
              car: { tags: [{ text: `→ CarRented` }] },
            }),
            ...Yc(),
          },
          links: {
            ub: h(`trav`, `bus`, [`trav`, `bus`], { heads: `both` }),
            ...R.calls(`bus`),
            ...R.dbs(),
          },
          flows: [
            { route: [`ub`], rate: 0.5, bounce: !0 },
            { routes: Gc.map((e) => ({ path: [`b${e}`] })), kind: `msg`, rate: 1.4, bounce: !0 },
          ],
        },
      },
      {
        short: `In between`,
        chapter: `tradeoff`,
        title: `The catch: no isolation`,
        body: [
          `While a saga runs, other people can see its half-done state: the seat is taken, the hotel isn’t booked yet. And some steps can’t really be undone — an email “your flight is confirmed” has already gone out.`,
          `Design for it: use <b>pending</b> states (“reserved”, not “confirmed”), put the step most likely to fail <b>first</b>, and the hardest to undo — charging the card, sending emails — <b>last</b>.`,
        ],
        callout: {
          kind: `warn`,
          text: `A compensation is a new action, not a rollback. A refund is not the same as never having charged.`,
        },
        changes: [
          `~ Bookings start as “reserved”`,
          `~ Car availability checked first`,
          `~ Card charged last`,
        ],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `orchestrator` },
        scene: {
          entities: {
            trav: Kc([{ text: `charged only at the end`, icon: `creditCard` }]),
            trip: qc({ label: [`Saga`, `Orchestrator`] }),
            odb: b(-11, -9, { r: 1.5, h: 30, glyph: `listOrdered`, label: `saga state` }),
            ...Jc({
              fl: { tags: [{ text: `seat: reserved`, tone: `amber`, icon: `clock` }] },
              ho: { tags: [{ text: `room: reserved`, tone: `amber`, icon: `clock` }] },
              car: { tags: [{ text: `checked first ✓`, tone: `green` }] },
            }),
            ...Yc(),
            card: Zc(
              `Order the steps`,
              [
                `1. check car    likely to fail → first`,
                `2. reserve flight + hotel`,
                `3. charge card   hard to undo → last`,
                `4. confirm + email`,
              ],
              `listOrdered`,
            ),
          },
          links: {
            ...R.ut,
            so: h(`trip`, `odb`, [`trip`, `odb`], { heads: `both` }),
            ...R.calls(),
            ...R.dbs(),
          },
          flows: [...Qc(`t`), { route: [`so`], kind: `write`, rate: 1.2 }],
        },
      },
      {
        short: `Resume`,
        chapter: `insight`,
        title: `Case: crash and resume`,
        body: [
          `The orchestrator crashes right after Hotels booked a room — but before it saved that fact. On restart it sees “hotel: pending” and sends the booking request again.`,
          `If Hotels books a second room, the traveller pays twice. So every step carries an <b>idempotency key</b> (the saga id + step), and Hotels returns the existing booking instead of creating another.`,
        ],
        callout: {
          kind: `tip`,
          text: `Sagas are at-least-once by nature. Every step and every compensation must be safe to repeat.`,
        },
        changes: [
          `− Orchestrator restarted mid-saga`,
          `~ “book hotel” sent twice`,
          `~ Same key → same booking`,
        ],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `orchestrator` },
        scene: {
          entities: {
            trav: Kc(),
            trip: qc({
              label: [`Saga`, `Orchestrator`],
              tags: [{ text: `restarted · resuming trip 81`, tone: `amber`, icon: `replay` }],
            }),
            odb: b(-11, -9, { r: 1.5, h: 30, glyph: `listOrdered`, label: `saga state` }),
            ...Jc({
              fl: { tags: [Xc(`flight`)] },
              ho: { tags: [{ text: `key 81-hotel seen → same room`, tone: `green`, icon: `key` }] },
            }),
            ...Yc(),
          },
          links: {
            ...R.ut,
            so: h(`trip`, `odb`, [`trip`, `odb`], { heads: `both` }),
            ...R.calls(`trip`, { ho: { label: `book hotel · key 81-hotel`, labelAt: 0.5 } }),
            ...R.dbs(),
          },
          flows: [
            { route: [`tho`, `dho`], rate: 1.2, bounce: !0, pattern: [`req`, `slow`] },
            { route: [`so`], kind: `write`, rate: 0.8 },
          ],
        },
      },
      {
        short: `Undo fails`,
        chapter: `problem`,
        title: `Case: the undo itself fails`,
        body: [
          `The car can’t be rented, so the saga cancels the hotel — but the hotel’s API is down. Giving up isn’t an option: the traveller would be charged for a room they can’t use.`,
          `So compensations are <b>retried</b> with backoff until they succeed, and must be safe to repeat. A compensation still stuck after a few hours goes to a queue for a person to resolve.`,
        ],
        callout: {
          kind: `warn`,
          text: `A compensation must be able to succeed eventually. Never design one that can legitimately fail — and alert when one is stuck.`,
        },
        changes: [
          `− Hotel API down during “cancel hotel”`,
          `~ Retried with backoff`,
          `+ Escalated to support after 4 h`,
        ],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `orchestrator` },
        scene: {
          entities: {
            trav: Kc([{ text: `refund pending`, tone: `amber`, icon: `clock` }]),
            trip: qc({
              label: [`Saga`, `Orchestrator`],
              tags: [{ text: `cancel hotel · attempt 4`, tone: `amber`, icon: `replay` }],
            }),
            odb: b(-11, -9, { r: 1.5, h: 30, glyph: `listOrdered`, label: `saga state` }),
            ...Jc({
              fl: { tags: [{ text: `cancelled ✓`, tone: `green`, icon: `undo` }] },
              ho: { ...g, tags: [{ text: `API down`, tone: `red`, icon: `alert` }] },
              car: { tags: [{ text: `no cars left`, tone: `red`, icon: `alert` }] },
            }),
            ...Yc(),
          },
          links: {
            ...R.ut,
            so: h(`trip`, `odb`, [`trip`, `odb`], { heads: `both` }),
            ...R.calls(`trip`, { ho: { fail: 1, label: `retry with backoff`, labelAt: 0.5 } }),
            ...R.dbs(),
          },
          flows: [
            { route: [`tho`], kind: `kill`, rate: 0.6 },
            { route: [`so`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Unknown`,
        chapter: `technique`,
        title: `Case: a timeout means “unknown”`,
        body: [
          `The call to rent the car times out. Did the car service book it before the connection dropped, or not? A timeout is not a failure — the outcome is <b>unknown</b>.`,
          `Compensating blindly could cancel a booking that never existed, or leave one that did. Instead, ask: query the car service for request <code>81-car</code>, or simply retry with the same idempotency key and get the real answer.`,
        ],
        callout: {
          kind: `tip`,
          text: `Treat every remote step as having three outcomes: succeeded, failed, unknown. Only the first two let the saga move on.`,
        },
        changes: [
          `− “rent car” timed out`,
          `~ Status unknown → query 81-car`,
          `~ Answer: booked → continue`,
        ],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `orchestrator` },
        scene: {
          entities: {
            trav: Kc(),
            trip: qc({
              label: [`Saga`, `Orchestrator`],
              tags: [{ text: `car: unknown → asking`, tone: `amber`, icon: `info` }],
            }),
            odb: b(-11, -9, { r: 1.5, h: 30, glyph: `listOrdered`, label: `saga state` }),
            ...Jc({
              fl: { tags: [Xc(`flight`)] },
              ho: { tags: [Xc(`room`)] },
              car: { tags: [{ text: `81-car: booked ✓`, tone: `green`, icon: `key` }] },
            }),
            ...Yc(),
          },
          links: {
            ...R.ut,
            so: h(`trip`, `odb`, [`trip`, `odb`], { heads: `both` }),
            ...R.calls(`trip`, { car: { label: `status of 81-car?`, labelAt: 0.5 } }),
            ...R.dbs(),
          },
          flows: [
            { route: [`tcar`], rate: 0.9, bounce: !0, pattern: [`slow`, `req`] },
            { route: [`so`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>A database transaction can’t span <b>several services</b>.</li>
          <li><b>Two-phase commit</b> is all-or-nothing but blocks when the coordinator fails.</li>
          <li>A <b>saga</b> commits step by step and runs <b>compensations</b> on failure.</li>
          <li><b>Orchestrate</b> or <b>choreograph</b>; make every step <b>idempotent</b>.</li>
          <li>Compensations must <b>eventually succeed</b>; a timeout means <b>unknown</b>, not failed.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Batch & Stream Processing</b> — crunching huge volumes of events, overnight or as they happen.`,
        },
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `orchestrator` },
        scene: {
          entities: {
            trav: Kc([{ text: `trip confirmed`, tone: `green`, icon: `check` }]),
            trip: qc({ label: [`Saga`, `Orchestrator`] }),
            odb: b(-11, -9, { r: 1.5, h: 30, glyph: `listOrdered`, label: `saga state` }),
            ...Jc({
              fl: { tags: [Xc(`flight`)] },
              ho: { tags: [Xc(`room`)] },
              car: { tags: [Xc(`car`)] },
            }),
            ...Yc(),
          },
          links: {
            ...R.ut,
            so: h(`trip`, `odb`, [`trip`, `odb`], { heads: `both` }),
            ...R.calls(),
            ...R.dbs(),
          },
          flows: [...Qc(`t`), { route: [`so`], kind: `write`, rate: 1.2 }],
        },
      },
    ],
  };

const el = { x0: -4.5, x1: 4.5, y0: -25, y1: -19 };

const tl = { x0: -16, x1: -6, y0: -3, y1: 9 };

const nl = () => p(el, 13, `viewers`);

const rl = () => d(0, -11, { label: [`Video`, `App`] });

const il = (e = {}) => b(0, 0, { r: 2, h: 42, label: `production DB`, ...e });

const al = (e = []) => d(0, 15, { color: `slab`, glyph: `chartLine`, label: [`Dashboard`], tags: e });

const ol = (e = `NIGHTLY BATCH JOB`, t = {}) => ({
    logs: b(-11, -11, { r: 1.8, h: 36, glyph: `box`, label: `event logs` }),
    batch: x(tl, e),
    w1: d(-13.5, 0, { s: 3, h: 30, color: `green`, glyph: `cpu`, label: [], tags: t.w1 || [] }),
    w2: d(-8.5, 0, { s: 3, h: 30, color: `green`, glyph: `cpu`, label: [], tags: t.w2 || [] }),
    w3: d(-13.5, 6, { s: 3, h: 30, color: `green`, glyph: `cpu`, label: [], tags: t.w3 || [] }),
    w4: d(-8.5, 6, { s: 3, h: 30, color: `green`, glyph: `cpu`, label: [], tags: t.w4 || [] }),
    wh: b(-11, 15, { r: 1.8, h: 36, glyph: `chart`, label: `warehouse` }),
  });

const sl = (e = [], t = []) => ({
    kafka: d(11, -11, { color: `slab`, glyph: `waves`, label: [`Event`, `Stream`], tags: t }),
    proc: d(11, 3, { color: `green`, glyph: `activity`, label: [`Stream`, `Processor`], tags: e }),
    live: b(11, 15, { r: 1.8, h: 36, glyph: `zap`, label: `live counts` }),
  });

const z = {
    base: {
      va: h(`viewers`, `app`, [`viewers`, `app`], { heads: `both` }),
      ad: h(`app`, `prod`, [`app`, `prod`], { heads: `both` }),
    },
    heavy: {
      dp: h(`dash`, `prod`, [`dash`, `prod`], {
        heads: `both`,
        label: `GROUP BY video · every minute`,
        labelTone: `red`,
        labelAt: 0.45,
      }),
    },
    batch: {
      al: h(`app`, `logs`, [`app`, `logs`], { label: `append events` }),
      lb: h(`logs`, `batch`, [`logs`, `batch`], { label: `read 1 day`, labelAt: 0.45 }),
      bw: h(`batch`, `wh`, [`batch`, `wh`], { label: `write results`, labelAt: 0.55 }),
      dw: h(`dash`, `wh`, [`dash`, `wh`], { heads: `both` }),
    },
    stream: {
      ak: h(`app`, `kafka`, [`app`, `kafka`], { label: `publish each view` }),
      kp: h(`kafka`, `proc`, [`kafka`, `proc`]),
      pl: h(`proc`, `live`, [`proc`, `live`], { label: `update counts`, labelAt: 0.5 }),
      dl: h(`dash`, `live`, [`dash`, `live`], { heads: `both` }),
    },
  };

const B = {
    base: { route: [`va`, `ad`], rate: 2.2, bounce: !0 },
    batch: [
      { route: [`al`], kind: `write`, rate: 2.2 },
      { route: [`lb`], kind: `heavy`, rate: 0.35, speed: 0.7 },
      { route: [`bw`], kind: `write`, rate: 0.35 },
      { route: [`dw`], rate: 0.6, bounce: !0 },
    ],
    stream: [
      { route: [`ak`, `kp`, `pl`], kind: `msg`, rate: 2.2, speed: 1.1 },
      { route: [`dl`], rate: 0.8, bounce: !0 },
    ],
  };

const cl = (e, t, n, r = {}) => S({ x: 0, y: 0, z: 0, dx: 75, dy: 25 }, e, t, { icon: n, ...r });

const ll = (e, t, n, r = {}) => S({ x: -11, y: -11, z: 0, dx: -40, dy: -215 }, e, t, { icon: n, ...r });

const ul = {
    id: `batch-stream`,
    title: `Batch & Stream Processing`,
    summary: `Crunching billions of events: overnight in big batches, or continuously as they arrive.`,
    minutes: 15,
    level: `intermediate`,
    metrics: [`freshness`, `prodLoad`, `eventsDay`, `exact`],
    legend: [
      `req`,
      `res`,
      [`write`, `event / result`],
      [`heavy`, `big scan`],
      [`msg`, `streamed event`],
    ],
    goals: [
      { text: `Keep analytics off the production database`, step: 0 },
      { text: `Batch processing and map/reduce`, step: 2 },
      { text: `Skewed keys: combiners and salting`, step: 4 },
      { text: `Stream processing and windows`, step: 7 },
      { text: `Late events, lag and partitions`, step: 10 },
      { text: `Approximate counts, and running both`, step: 12 },
    ],
    steps: [
      {
        short: `Live DB`,
        chapter: `problem`,
        title: `Analytics on the production database`,
        body: [
          `Every view of every video is a row in the production database — about 2 billion a day. A dashboard shows views per video, recomputed every minute with a big <code>GROUP BY</code>.`,
          `Each run scans the whole day so far — hundreds of millions of rows by mid-morning — and the database that serves the app grinds: viewers wait while it counts.`,
        ],
        callout: {
          kind: `warn`,
          text: `Production databases are tuned for many small, fast queries. Huge scans steal their memory, CPU and disk.`,
        },
        metrics: { freshness: `live`, prodLoad: 95, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: { viewers: nl(), app: rl(), prod: il(_(0.95)), dash: al() },
          links: { ...z.base, ...z.heavy },
          flows: [B.base, { route: [`dp`], kind: `heavy`, rate: 0.6, bounce: !0, hold: 1.3 }],
        },
      },
      {
        short: `Batch`,
        chapter: `solution`,
        title: `Batch: collect now, compute later`,
        body: [
          `Instead, the app appends every view as an event to cheap <b>object storage</b> — files, not database rows. Once a night a <span class="term">batch job</span> reads the whole day, computes the counts on a cluster of workers, and writes the results to an analytics <b>warehouse</b>.`,
          `The dashboard reads the warehouse. The production database only serves the app again.`,
        ],
        callout: {
          kind: `tip`,
          text: `Batch is simple, cheap and easy to rerun: if the job had a bug, fix it and run it again over the same files.`,
        },
        changes: [
          `+ Event logs in object storage`,
          `+ Nightly batch job on 4 workers`,
          `+ Warehouse for analytics`,
          `~ Production DB load 95% → 30%`,
        ],
        metrics: { freshness: `up to 24 h`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: { viewers: nl(), app: rl(), prod: il(v(0.3)), dash: al(), ...ol() },
          links: { ...z.base, ...z.batch },
          flows: [B.base, ...B.batch],
        },
      },
      {
        short: `Map/reduce`,
        chapter: `technique`,
        title: `Split the work: map, shuffle, reduce`,
        body: [
          `2 billion events won’t fit through one machine quickly, so the job is split. <b>Map</b>: each worker reads its own chunk of the files and counts views per video. <b>Shuffle</b>: counts for the same video are sent to the same worker. <b>Reduce</b>: that worker adds them up.`,
          `Add more workers and the job finishes proportionally faster.`,
        ],
        callout: {
          kind: `tip`,
          text: `This is MapReduce. Today Spark, BigQuery, Snowflake and friends do the same thing behind a SQL interface.`,
        },
        changes: [`~ Workers 1–2: map their chunks`, `~ Workers 3–4: reduce per video`],
        metrics: { freshness: `up to 24 h`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al(),
            ...ol(`MAP → SHUFFLE → REDUCE`, {
              w1: [{ text: `map` }],
              w2: [{ text: `map` }],
              w3: [{ text: `reduce` }],
              w4: [{ text: `reduce` }],
            }),
            card: cl(
              `Counting 2 billion views`,
              [
                `map:     each worker counts its chunk`,
                `shuffle: same video → same worker`,
                `reduce:  sum the counts per video`,
                `= 100 workers: ~20 minutes`,
              ],
              `sigma`,
            ),
          },
          links: { ...z.base, ...z.batch },
          flows: [B.base, ...B.batch],
        },
      },
      {
        short: `Skew`,
        chapter: `problem`,
        title: `Case: one video, one exhausted reducer`,
        body: [
          `One video went viral: 40% of all views yesterday. In the shuffle, every view of it goes to the <em>same</em> reducer. That worker grinds for 3 hours while the other 99 finished in 5 minutes — and the job waits for the slowest.`,
          `Splitting work by key only balances it if the keys are balanced. Real data rarely is.`,
        ],
        callout: {
          kind: `warn`,
          text: `Skew is the most common reason a big batch job is mysteriously slow. Look for one task taking far longer than the rest.`,
        },
        changes: [
          `+ One video = 40% of the data`,
          `− One reducer runs 3 h`,
          `~ Job finishes 3 h late`,
        ],
        metrics: { freshness: `up to 27 h`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al(),
            ...ol(`MAP → SHUFFLE → REDUCE`, {
              w1: [{ text: `map` }],
              w2: [{ text: `map` }],
              w4: [{ text: `5 min`, tone: `green` }],
            }),
            w3: d(-13.5, 6, {
              s: 3,
              h: 30,
              color: `green`,
              glyph: `cpu`,
              label: [],
              heat: 0.85,
              tags: [{ text: `40% of data · 3 h`, tone: `red`, icon: `hourglass` }],
            }),
          },
          links: { ...z.base, ...z.batch },
          flows: [B.base, ...B.batch],
        },
      },
      {
        short: `Combine`,
        chapter: `solution`,
        title: `Combine early, split hot keys`,
        body: [
          `Two standard fixes. A <span class="term">combiner</span> pre-aggregates on each mapper: instead of shipping 800 million “view of 4f2” rows, every mapper sends one partial count. For keys that are still too hot, <span class="term">salting</span> splits them — <code>4f2#0</code> … <code>4f2#9</code> go to ten reducers, and a final step adds the ten totals.`,
          `The job drops from 3 hours back to about 20 minutes.`,
        ],
        callout: {
          kind: `tip`,
          text: `Spark and most SQL engines combine automatically for sums and counts, and can detect and split skewed keys for joins.`,
        },
        changes: [
          `+ Combiner on every mapper`,
          `+ Hot key split across 10 reducers`,
          `~ Job 3 h → 20 min`,
        ],
        metrics: { freshness: `up to 24 h`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al(),
            ...ol(`MAP + COMBINE → REDUCE`, {
              w1: [{ text: `map + combine` }],
              w2: [{ text: `map + combine` }],
              w3: [{ text: `reduce · even`, tone: `green` }],
              w4: [{ text: `reduce · even`, tone: `green` }],
            }),
            card: cl(
              `Taming a hot key`,
              [
                `! viral video: 800M rows → one reducer`,
                `= combiner: each mapper sends 1 count`,
                `= salting: 4f2#0 … 4f2#9 → 10 reducers`,
                `# job: 3 h → 20 min`,
              ],
              `split`,
            ),
          },
          links: { ...z.base, ...z.batch },
          flows: [B.base, ...B.batch],
        },
      },
      {
        short: `Too late`,
        chapter: `problem`,
        title: `A day late is too late`,
        body: [
          `Some questions can’t wait for tonight. A video going viral should show up in “Trending” <em>now</em>. A bot farm faking millions of views should be caught in minutes, before it earns any money.`,
          `Running the batch job every hour helps a little, but each run still re-reads a huge pile of data.`,
        ],
        callout: {
          kind: `insight`,
          text: `Batch answers “what happened?”. Some products need “what is happening?”.`,
        },
        changes: [`− Trending list is a day old`, `− Fake views caught only tomorrow`],
        metrics: { freshness: `up to 24 h`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al([{ text: `trending: yesterday’s`, tone: `red`, icon: `clock` }]),
            ...ol(),
          },
          links: { ...z.base, ...z.batch },
          flows: [B.base, ...B.batch],
        },
      },
      {
        short: `Stream`,
        chapter: `solution`,
        title: `Stream processing: compute as events arrive`,
        body: [
          `Now the app publishes each view to an <b>event stream</b> (Kafka). A <span class="term">stream processor</span> (Flink, Kafka Streams, Spark Streaming) reads events as they arrive and keeps running counts, writing results to a fast store.`,
          `The dashboard is seconds behind reality instead of a day.`,
        ],
        callout: {
          kind: `tip`,
          text: `The processor keeps its counts in local state and checkpoints it regularly, so a crash resumes from the last checkpoint instead of from scratch.`,
        },
        changes: [
          `− Nightly batch job`,
          `+ Event stream`,
          `+ Stream processor`,
          `+ Live counts store`,
          `~ Results age 24 h → 5 s`,
        ],
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al([{ text: `trending: now`, tone: `green`, icon: `trendingUp` }]),
            ...sl(),
          },
          links: { ...z.base, ...z.stream },
          flows: [B.base, ...B.stream],
        },
      },
      {
        short: `Windows`,
        chapter: `technique`,
        title: `Counting in windows`,
        body: [
          `A stream never ends, so “count views” needs a time frame: a <span class="term">window</span>. <b>Tumbling</b> windows cut time into fixed slices (views per minute). <b>Sliding</b> windows overlap (views in the last 10 minutes, updated every minute).`,
          `A sudden jump between windows is exactly what “trending” — or fraud — looks like.`,
        ],
        callout: {
          kind: `tip`,
          text: `Session windows group events by bursts of activity — useful for “how long did people watch?”.`,
        },
        changes: [`+ 1-minute tumbling windows per video`],
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al([{ text: `trending: now`, tone: `green`, icon: `trendingUp` }]),
            ...sl([{ text: `windows: 1 min`, icon: `clock` }]),
            card: ll(`Views of video 4f2 per minute`, [], `chartLine`, {
              chart: `bars`,
              bars: [
                { label: `12:01`, to: 0.05, tone: `gray`, note: `120` },
                { label: `12:02`, to: 0.06, tone: `gray`, note: `140` },
                { label: `12:03`, to: 0.31, tone: `amber`, note: `780` },
                { label: `12:04`, to: 1, tone: `green`, note: `2,500 ↑ trending`, bold: !0 },
              ],
            }),
          },
          links: { ...z.base, ...z.stream },
          flows: [B.base, ...B.stream],
        },
      },
      {
        short: `Late events`,
        chapter: `problem`,
        title: `Case: late and duplicate events`,
        body: [
          `A phone watches videos in the subway with no signal and uploads its views two hours later. Should they count for 12:04, when they happened, or now, when they arrived? And a flaky network makes some phones send the same event twice.`,
          `Stream processors use <b>event time</b> (when it happened), a <span class="term">watermark</span> to decide when a window is complete enough to publish, a policy for stragglers, and an event id to drop duplicates.`,
        ],
        callout: {
          kind: `warn`,
          text: `“Exactly-once” in streaming means checkpoints plus idempotent writes — the same lesson as queues, at billions of events a day.`,
        },
        changes: [`+ Events 2 h late`, `+ Duplicate events`, `~ Watermarks + dedupe by event id`],
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `with care` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al(),
            ...sl(
              [{ text: `watermark: 12:05 · dedupe on`, icon: `filter` }],
              [{ text: `event from 2 h ago`, tone: `amber`, icon: `clock` }],
            ),
            card: ll(
              `Event time vs arrival time`,
              [
                `view at 12:04, arrives 14:10`,
                `watermark: “events ≤ 5 min late”`,
                `! 2 h late → correct window later`,
                `= duplicate id → dropped`,
              ],
              `clock`,
            ),
          },
          links: { ...z.base, ...z.stream },
          flows: [
            B.base,
            {
              route: [`ak`, `kp`, `pl`],
              kind: `msg`,
              rate: 2.2,
              speed: 1.1,
              pattern: [`msg`, `msg`, `msg`, `slow`, `msg`, `msg`, `poison`],
            },
            { route: [`dl`], rate: 0.8, bounce: !0 },
          ],
        },
      },
      {
        short: `Lag`,
        chapter: `problem`,
        title: `Case: the processor falls behind`,
        body: [
          `A celebrity live stream triples traffic for an hour. The stream processor can’t keep up, and unprocessed events pile up in the stream: <span class="term">consumer lag</span> reaches 4 minutes and 18 million events.`,
          `Nothing is lost — the stream keeps everything — but the “live” dashboard is now 4 minutes old, and the fraud check runs 4 minutes late.`,
        ],
        callout: {
          kind: `warn`,
          text: `Consumer lag is the key health metric of any streaming system. Alert on it, in seconds or events.`,
        },
        changes: [`~ Traffic × 3`, `− Processor at 100%`, `− Lag: 4 min · 18M events`],
        metrics: { freshness: `4 min`, prodLoad: 30, eventsDay: `2 billion`, exact: `with care` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al([{ text: `live counts: 4 min old`, tone: `amber`, icon: `clock` }]),
            ...sl([], [{ text: `lag: 4 min · 18M events`, tone: `red`, icon: `clock` }]),
            proc: d(11, 3, {
              color: `green`,
              glyph: `activity`,
              label: [`Stream`, `Processor`],
              heat: 0.85,
              tags: [{ text: `falling behind`, tone: `red`, icon: `alert` }],
            }),
          },
          links: { ...z.base, ...z.stream },
          flows: [
            B.base,
            { route: [`ak`], kind: `msg`, rate: 4.4, speed: 1.1 },
            { route: [`kp`, `pl`], kind: `msg`, rate: 1.2 },
            { route: [`dl`], rate: 0.8, bounce: !0 },
          ],
        },
      },
      {
        short: `Partitions`,
        chapter: `solution`,
        title: `Scale out across partitions`,
        body: [
          `The stream is split into <b>partitions</b> (by video id, so each video’s events stay in order). Each processor instance owns some partitions, so adding instances adds throughput: two processors, two partitions each.`,
          `The backlog drains, lag drops back to seconds, and an autoscaler can add processors whenever lag grows.`,
        ],
        callout: {
          kind: `tip`,
          text: `The number of partitions caps the parallelism. Create more partitions than you need today — adding them later reshuffles keys.`,
        },
        changes: [`+ Second processor`, `~ 4 partitions split 2 + 2`, `~ Lag 4 min → 2 s`],
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `with care` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al([{ text: `trending: now`, tone: `green`, icon: `trendingUp` }]),
            ...sl(
              [{ text: `partitions 0–1` }],
              [{ text: `4 partitions · lag 2 s`, tone: `green`, icon: `layers` }],
            ),
            proc2: d(17, 3, {
              color: `green`,
              glyph: `activity`,
              label: [`Stream`, `Processor`],
              tags: [{ text: `partitions 2–3` }],
            }),
          },
          links: {
            ...z.base,
            ...z.stream,
            kp2: h(`kafka`, `proc2`, [`kafka`, [`proc2`, `kafka`], `proc2`]),
            p2l: h(`proc2`, `live`, [`proc2`, [`proc2`, `live`], `live`]),
          },
          flows: [
            B.base,
            { route: [`ak`], kind: `msg`, rate: 4.4, speed: 1.1 },
            {
              routes: [{ path: [`kp`, `pl`] }, { path: [`kp2`, `p2l`] }],
              kind: `msg`,
              rate: 4.4,
              speed: 1.1,
            },
            { route: [`dl`], rate: 0.8, bounce: !0 },
          ],
        },
      },
      {
        short: `Unique`,
        chapter: `technique`,
        title: `Case: counting unique viewers`,
        body: [
          `Views are easy to count. <b>Unique</b> viewers are not: to count exactly you must remember every viewer id you’ve seen — 50 million ids for a popular video, about 800 MB of state, per video, per window.`,
          `A <span class="term">HyperLogLog</span> sketch estimates the number of distinct ids in 12 KB with about 1% error, and sketches from different machines and windows simply merge.`,
        ],
        callout: {
          kind: `insight`,
          text: `Approximate algorithms (HyperLogLog, count-min sketch, t-digest for percentiles) trade a tiny error for enormous savings. Dashboards rarely need the last 1%.`,
        },
        changes: [
          `+ Unique viewers per video`,
          `~ Exact set → HyperLogLog sketch`,
          `~ 800 MB → 12 KB per video`,
        ],
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `≈ 1% error` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al([{ text: `unique viewers ≈ 48.2M`, icon: `users` }]),
            ...sl([{ text: `HyperLogLog per video`, icon: `sigma` }]),
            card: ll(
              `Unique viewers of 4f2`,
              [
                `exact: remember every viewer id`,
                `! 50M ids × 16 bytes ≈ 800 MB`,
                `= HyperLogLog: 12 KB, ~1% error`,
                `# sketches merge across machines`,
              ],
              `sigma`,
            ),
          },
          links: { ...z.base, ...z.stream },
          flows: [B.base, ...B.stream],
        },
      },
      {
        short: `Both`,
        chapter: `insight`,
        title: `Batch and stream, together`,
        body: [
          `Many systems run both: a stream for fast, approximate answers and a nightly batch that recomputes the exact numbers from the full log (the <b>lambda architecture</b>).`,
          `Others keep only the stream and, to fix a bug or rebuild results, <b>replay</b> the retained event log through a new version of the processor (the <b>kappa architecture</b>).`,
          `<table class="compare">
          <thead><tr><th></th><th>Batch</th><th>Stream</th></tr></thead>
          <tbody>
            <tr><td>Freshness</td><td>Hours</td><td>Seconds</td></tr>
            <tr><td>Complexity</td><td>Low</td><td>Higher</td></tr>
            <tr><td>Rerun</td><td>Easy</td><td>Replay the log</td></tr>
          </tbody>
        </table>`,
        ],
        callout: {
          kind: `tip`,
          text: `Start with batch unless you clearly need seconds. Add streaming for the few results that do.`,
        },
        changes: [`+ Nightly batch back alongside the stream`],
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al(),
            ...ol(`NIGHTLY · EXACT`),
            ...sl(),
          },
          links: { ...z.base, ...z.batch, ...z.stream },
          flows: [B.base, ...B.batch, ...B.stream],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Keep heavy analytics <b>off the production database</b>.</li>
          <li><b>Batch</b>: process large, finished datasets cheaply — results are hours old.</li>
          <li><b>Stream</b>: process events as they arrive — seconds old, more moving parts.</li>
          <li>Watch for <b>skewed keys</b> (combine, salt) and <b>consumer lag</b> (add partitions and processors).</li>
          <li>Handle <b>late</b> and <b>duplicate</b> events; many systems run <b>both</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `That completes Architecture. Next module: <b>Security</b> — starting with authentication.`,
        },
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al(),
            ...ol(`NIGHTLY · EXACT`),
            ...sl(),
          },
          links: { ...z.base, ...z.batch, ...z.stream },
          flows: [B.base, ...B.batch, ...B.stream],
        },
      },
    ],
  };

const dl = (e = []) => y(0, -19, { label: `Alice`, tags: e });

const fl = (e = {}) =>
    d(0, -7, { color: `orange`, glyph: `keyhole`, label: [`Login`, `Service`], ...e });

const pl = (e = [], t = {}) =>
    b(0, 5, { r: 2, h: 42, glyph: `user`, label: `users table`, tags: e, ...t });

const ml = (e = `attacker`, t = []) => y(13, 5, { label: e, tags: t });

const hl = (e = []) => y(13, -19, { label: `bot`, tags: e });

const gl = () => y(-12, -19, { form: `phone`, w: 5, d: 5, label: `Alice’s phone` });

const _l = (e = {}) =>
    d(13, -7, {
      color: `orange`,
      glyph: `globe`,
      label: [`Fake`, `Login`],
      sub: `shop-example.co`,
      ...e,
    });

const vl = () =>
    d(-12, -7, {
      color: `blue`,
      glyph: `idCard`,
      label: [`Identity`, `Provider`],
      sub: `e.g. Google`,
    });

const V = {
    base: {
      al: h(`alice`, `login`, [`alice`, `login`], { heads: `both` }),
      lu: h(`login`, `users`, [`login`, `users`], { heads: `both` }),
    },
    steal: (e = `stolen backup`) => ({
      st: h(`users`, `thief`, [`users`, `thief`], { style: `dashed`, label: e, labelTone: `red` }),
    }),
    bot: (e = {}) => ({ bl: h(`bot`, `login`, [`bot`, [`bot`, `login`], `login`], e) }),
  };

const yl = {
    login: { route: [`al`, `lu`], kind: `mine`, rate: 0.8, bounce: !0 },
    steal: { route: [`st`], kind: `poison`, rate: 0.7 },
    bot: (e = 4) => ({ route: [`bl`], kind: `poison`, rate: e }),
  };

const bl = (e, t, n) => S({ x: 0, y: 5, z: 0, dx: 100, dy: -235 }, e, t, { icon: n });

// --- security ---
const xl = {
    id: `authentication`,
    title: `Authentication`,
    summary: `Proving who someone is — without becoming the reason their password leaks.`,
    minutes: 13,
    level: `intermediate`,
    metrics: [`leak`, `stuffing`, `mfa`],
    legend: [[`mine`, `Alice’s login`], `res`, [`poison`, `attacker`], `fail`],
    goals: [
      { text: `Store passwords as slow, salted hashes`, step: 1 },
      { text: `Sessions and a safe password reset`, step: 3 },
      { text: `Credential stuffing and second factors`, step: 6 },
      { text: `Phishing and passkeys`, step: 8 },
      { text: `Identity providers and short-lived tokens`, step: 10 },
    ],
    steps: [
      {
        short: `Plain text`,
        chapter: `problem`,
        title: `A table full of passwords`,
        body: [
          `Alice signs up and the login service stores her password exactly as she typed it. Logging in is a simple comparison.`,
          `Then a database backup leaks — a misconfigured bucket, a stolen laptop. Every password is readable instantly, and because people reuse passwords, the attacker can now try them on email, banking and everything else.`,
        ],
        callout: {
          kind: `warn`,
          text: `Assume your database will leak one day. The question is what an attacker can do with it.`,
        },
        metrics: { leak: `all passwords`, stuffing: `—`, mfa: `no` },
        scene: {
          entities: {
            alice: dl(),
            login: fl(),
            users: pl([{ text: `alice@… : hunter2`, tone: `red`, icon: `alert` }]),
            thief: ml(`attacker`, [{ text: `reads every password`, tone: `red`, icon: `eye` }]),
          },
          links: { ...V.base, ...V.steal() },
          flows: [yl.login, yl.steal],
        },
      },
      {
        short: `Hashing`,
        chapter: `solution`,
        title: `Store a slow, salted hash`,
        body: [
          `Never store the password itself. Store a <span class="term">hash</span>: a one-way fingerprint. At login, hash what Alice typed and compare fingerprints.`,
          `Use a hash built for passwords — <b>argon2id</b>, <b>bcrypt</b> or <b>scrypt</b>: a random <b>salt</b> per user makes identical passwords look different, and deliberate slowness (~100 ms) turns billions of guesses into years.`,
        ],
        callout: {
          kind: `warn`,
          text: `Fast hashes like MD5 or SHA-256 are the wrong tool: a graphics card tries billions per second.`,
        },
        changes: [`~ Passwords → argon2id hashes, salted per user`],
        metrics: { leak: `hashes only`, stuffing: `—`, mfa: `no` },
        scene: {
          entities: {
            alice: dl(),
            login: fl({ tags: [{ text: `hash attempt, compare`, icon: `hash` }] }),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
            thief: ml(`attacker`, [
              { text: `gets hashes · years to crack`, tone: `amber`, icon: `hourglass` },
            ]),
            card: bl(
              `Salted, slow hashing`,
              [
                `hunter2 + salt 9f2c → $argon2id$…7Qe`,
                `same password, other salt → other hash`,
                `= ~100 ms per guess, on purpose`,
                `! MD5 / SHA-256: billions per second`,
              ],
              `hash`,
            ),
          },
          links: { ...V.base, ...V.steal() },
          flows: [yl.login, yl.steal],
        },
      },
      {
        short: `Session`,
        chapter: `technique`,
        title: `After login: a session`,
        body: [
          `Nobody wants to type a password on every click. After a successful login the service creates a <b>session</b> and gives the browser a random session id in a cookie; later requests present the cookie.`,
          `Mark it <code>HttpOnly</code> (scripts can’t read it), <code>Secure</code> (HTTPS only) and <code>SameSite</code> (not sent from other sites). Or issue a short-lived signed token — see the Stateless Services lesson.`,
        ],
        callout: {
          kind: `tip`,
          text: `Treat session ids like passwords: long, random, never in URLs or logs, and invalidated at logout.`,
        },
        changes: [`+ Session cookie after login`],
        metrics: { leak: `hashes only`, stuffing: `—`, mfa: `no` },
        scene: {
          entities: {
            alice: dl([{ text: `cookie: HttpOnly · Secure`, icon: `lock` }]),
            login: fl(),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
          },
          links: V.base,
          flows: [yl.login],
        },
      },
      {
        short: `Reset`,
        chapter: `technique`,
        title: `Case: the forgotten-password flow`,
        body: [
          `Password reset is a second way into every account — and often the weakest. Typical bugs: reset tokens that are guessable or never expire, and a form that says “no account with that email”, telling attackers exactly which emails are registered.`,
          `A safe flow: a long random token, single use, valid for 15 minutes; the same reply whether or not the account exists; and every existing session signed out after the change.`,
        ],
        callout: {
          kind: `warn`,
          text: `Anything that can change a password — reset, email change, support tools — needs the same care as the login itself.`,
        },
        changes: [
          `+ Reset email with a single-use token`,
          `~ Token expires after 15 min`,
          `~ Same reply for unknown emails`,
        ],
        metrics: { leak: `hashes only`, stuffing: `—`, mfa: `no` },
        scene: {
          entities: {
            alice: dl([{ text: `reset link · expires 15 min`, tone: `green`, icon: `clock` }]),
            login: fl({ tags: [{ text: `same reply for every email`, icon: `info` }] }),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
            mail: d(-12, -7, { color: `blue`, glyph: `mail`, label: [`Email`] }),
            card: bl(
              `A safe reset`,
              [
                `token: 32 random bytes, single use`,
                `expires after 15 minutes`,
                `same reply whether the email exists`,
                `= after the reset: revoke every session`,
              ],
              `key`,
            ),
          },
          links: {
            ...V.base,
            lm: h(`login`, `mail`, [`login`, `mail`], { label: `one-time token` }),
            ma: h(`mail`, `alice`, [`mail`, [`mail`, `alice`], `alice`], {
              label: `reset link`,
              labelAt: 0.65,
            }),
          },
          flows: [yl.login, { route: [`lm`, `ma`], kind: `msg`, rate: 0.6 }],
        },
      },
      {
        short: `Stuffing`,
        chapter: `problem`,
        title: `Credential stuffing`,
        body: [
          `A bot has a list of a billion email + password pairs leaked from <em>other</em> sites. It tries them all against your login form, thousands per second.`,
          `Your hashing is perfect — and still about 0.5% of attempts succeed, because those people reused a password. That’s thousands of accounts taken over.`,
        ],
        callout: {
          kind: `warn`,
          text: `Credential stuffing is the most common account-takeover attack. It needs no flaw in your code at all.`,
        },
        changes: [`+ Bot replaying leaked passwords`, `− ~0.5% of attempts succeed`],
        metrics: { leak: `hashes only`, stuffing: 0.5, mfa: `no` },
        scene: {
          entities: {
            alice: dl(),
            login: fl({
              heat: 0.6,
              tags: [{ text: `5,000 logins / s`, tone: `red`, icon: `activity` }],
            }),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
            bot: hl([{ text: `1B leaked passwords`, tone: `red`, icon: `bot` }]),
          },
          links: { ...V.base, ...V.bot({ fail: 0.9, label: `try every pair`, labelTone: `red` }) },
          flows: [yl.login, yl.bot(5)],
        },
      },
      {
        short: `Slow down`,
        chapter: `solution`,
        title: `Make guessing expensive`,
        body: [
          `Defend the form itself: <b>rate-limit</b> attempts per account and per IP address, add a challenge when traffic looks automated, and reject passwords that appear in known breach lists at signup.`,
          `Flag risky logins — a new device, a new country — and ask for extra proof.`,
        ],
        callout: {
          kind: `tip`,
          text: `Services such as Have I Been Pwned let you check a password against breaches without ever sending the password.`,
        },
        changes: [
          `+ Rate limits per account and IP`,
          `+ Breached passwords rejected`,
          `~ Successful stuffing 0.5% → 0.05%`,
        ],
        metrics: { leak: `hashes only`, stuffing: 0.05, mfa: `no` },
        scene: {
          entities: {
            alice: dl(),
            login: fl({ tags: [{ text: `5 tries / account / min`, icon: `gauge` }] }),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
            bot: hl([{ text: `slowed to a crawl`, tone: `amber`, icon: `ban` }]),
          },
          links: {
            ...V.base,
            ...V.bot({ fail: 0.99, label: `429 · challenge`, labelTone: `amber` }),
          },
          flows: [yl.login, yl.bot(2)],
        },
      },
      {
        short: `2nd factor`,
        chapter: `solution`,
        title: `A second factor`,
        body: [
          `<span class="term">Multi-factor authentication</span> asks for something you <em>have</em> as well as something you know: a code from an authenticator app, a push approval on your phone, or a hardware key.`,
          `A stolen password alone no longer opens the account. <b>Passkeys</b> go further: a key pair stored on the device, nothing reusable to steal or phish.`,
        ],
        callout: {
          kind: `tip`,
          text: `SMS codes are better than nothing but can be intercepted (SIM swapping). Prefer app codes, push, or passkeys.`,
        },
        changes: [`+ Approval on Alice’s phone`, `~ Stolen passwords alone stop working`],
        metrics: { leak: `hashes only`, stuffing: 0, mfa: `yes` },
        scene: {
          entities: {
            alice: dl(),
            phone: gl(),
            login: fl({ tags: [{ text: `password ✓ + phone ✓`, tone: `green`, icon: `check` }] }),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
            bot: hl([{ text: `no phone → blocked`, tone: `green`, icon: `ban` }]),
          },
          links: {
            ...V.base,
            ...V.bot({ fail: 1 }),
            lp: h(`login`, `phone`, [`login`, [`phone`, `login`], `phone`], {
              heads: `both`,
              label: `approve sign-in?`,
              labelAt: 0.4,
            }),
          },
          flows: [yl.login, { route: [`lp`], kind: `mine`, rate: 0.6, bounce: !0 }, yl.bot(1.2)],
        },
      },
      {
        short: `Phishing`,
        chapter: `problem`,
        title: `Case: a perfect fake login page`,
        body: [
          `An email warns of an “unusual sign-in” and links to <code>shop-example.co</code> — a pixel-perfect copy of your login page. Alice types her password <em>and</em> the one-time code from her app.`,
          `The fake site relays both to the real one within seconds and walks away with her session. Codes and push approvals stop stolen passwords, but not a phishing site that forwards them in real time.`,
        ],
        callout: {
          kind: `warn`,
          text: `Anything a person can read and type, a fake page can ask for and pass on. Training helps; it isn’t enough on its own.`,
        },
        changes: [
          `+ Fake login page relaying in real time`,
          `− Password and one-time code both captured`,
        ],
        metrics: { leak: `hashes only`, stuffing: 0, mfa: `phishable` },
        scene: {
          entities: {
            alice: dl([{ text: `typed password + code`, tone: `red`, icon: `alert` }]),
            phone: gl(),
            login: fl({ tags: [{ text: `looks like a normal login`, tone: `amber` }] }),
            users: pl([{ text: `alice@… : $argon2id$…7Qe`, tone: `green`, icon: `hash` }]),
            fake: _l({
              heat: 0.4,
              tags: [{ text: `relays in real time`, tone: `red`, icon: `alert` }],
            }),
          },
          links: {
            lu: V.base.lu,
            af: h(`alice`, `fake`, [`alice`, [`fake`, `alice`], `fake`], {
              heads: `both`,
              label: `shop-example.co`,
              labelTone: `red`,
              labelAt: 0.35,
            }),
            fl: h(`fake`, `login`, [`fake`, `login`], {
              label: `password + code`,
              labelTone: `red`,
            }),
            lp: h(`login`, `phone`, [`login`, [`phone`, `login`], `phone`], { heads: `both` }),
          },
          flows: [
            { route: [`af`, `fl`, `lu`], kind: `poison`, rate: 0.7, bounce: !0 },
            { route: [`lp`], kind: `mine`, rate: 0.4, bounce: !0 },
          ],
        },
      },
      {
        short: `Passkeys`,
        chapter: `solution`,
        title: `Passkeys: nothing to type, nothing to steal`,
        body: [
          `A <span class="term">passkey</span> (WebAuthn) replaces the password with a key pair kept on Alice’s phone or laptop. To sign in, the device signs a challenge from the site — and the signature is tied to the real domain, <code>shop.example</code>.`,
          `On the fake site her device simply has no passkey to offer. There’s nothing to type, nothing to relay, and the server only stores public keys, which are useless to a thief.`,
        ],
        callout: {
          kind: `tip`,
          text: `Passkeys sync across a person’s devices (Apple, Google, password managers), so losing a phone doesn’t lock them out.`,
        },
        changes: [
          `~ Password + code → passkey`,
          `− Fake site gets nothing usable`,
          `~ Server stores public keys only`,
        ],
        metrics: { leak: `nothing usable`, stuffing: 0, mfa: `passkey` },
        scene: {
          entities: {
            alice: dl([
              { text: `passkey · shop.example only`, tone: `green`, icon: `fingerprint` },
            ]),
            phone: gl(),
            login: fl({
              tags: [{ text: `checks signature + domain`, tone: `green`, icon: `check` }],
            }),
            users: pl([{ text: `alice@… : public key only`, tone: `green`, icon: `key` }]),
            fake: _l({
              tags: [{ text: `no passkey for this domain`, tone: `green`, icon: `ban` }],
            }),
          },
          links: {
            ...V.base,
            af: h(`alice`, `fake`, [`alice`, [`fake`, `alice`], `fake`], {
              heads: `both`,
              fail: 1,
              label: `shop-example.co`,
              labelTone: `red`,
              labelAt: 0.35,
            }),
            lp: h(`login`, `phone`, [`login`, [`phone`, `login`], `phone`], {
              heads: `both`,
              label: `sign challenge`,
              labelAt: 0.4,
            }),
          },
          flows: [
            yl.login,
            { route: [`lp`], kind: `mine`, rate: 0.5, bounce: !0 },
            { route: [`af`], kind: `poison`, rate: 0.4 },
          ],
        },
      },
      {
        short: `Use a provider`,
        chapter: `technique`,
        title: `Or let an identity provider do it`,
        body: [
          `“Sign in with Google” uses <span class="term">OpenID Connect</span> (built on OAuth 2.0). Your app sends Alice to the <b>identity provider</b>; she proves who she is there, and the provider sends back a signed <b>ID token</b> saying “this is Alice”.`,
          `Your service verifies the signature and never sees, stores or leaks a password. Companies use the same idea for single sign-on (Okta, Entra ID).`,
        ],
        callout: {
          kind: `insight`,
          text: `Authentication is hard to get right. Delegating it to a specialist is often the most secure choice.`,
        },
        changes: [`+ Identity provider`, `− Passwords no longer stored`],
        metrics: { leak: `nothing usable`, stuffing: 0, mfa: `yes` },
        scene: {
          entities: {
            alice: dl(),
            idp: vl(),
            login: fl({ tags: [{ text: `verifies ID token signature`, icon: `check` }] }),
            users: pl([
              { text: `alice@… : google-id 1042 · no password`, tone: `green`, icon: `idCard` },
            ]),
          },
          links: {
            ai: h(`alice`, `idp`, [`alice`, [-12, `alice`], `idp`], {
              heads: `both`,
              label: `sign in at provider`,
              labelAt: 0.72,
            }),
            il: h(`idp`, `login`, [`idp`, `login`], { label: `signed ID token` }),
            lu: V.base.lu,
            al: V.base.al,
          },
          flows: [
            { route: [`ai`, `il`], kind: `mine`, rate: 0.7 },
            { route: [`al`, `lu`], rate: 0.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Tokens`,
        chapter: `problem`,
        title: `Case: a stolen token`,
        body: [
          `A bug logs request headers, and an attacker finds Alice’s token in the logs. A token is as good as a password while it’s valid — if it never expires, the attacker is Alice forever.`,
          `So use short-lived <b>access tokens</b> (minutes) plus a <b>refresh token</b> that is stored carefully and can be <b>revoked</b>. Logging out, or “log out everywhere”, revokes it.`,
        ],
        callout: {
          kind: `tip`,
          text: `Short expiry limits the damage of any leak. Revocation lets you end it immediately.`,
        },
        changes: [
          `+ Access tokens expire after 15 min`,
          `+ Revocable refresh tokens`,
          `− Stolen token rejected after expiry`,
        ],
        metrics: { leak: `nothing usable`, stuffing: 0, mfa: `yes` },
        scene: {
          entities: {
            alice: dl([{ text: `access 15 min · refresh revocable`, icon: `clock` }]),
            idp: vl(),
            login: fl({ tags: [{ text: `token expired → 401`, tone: `amber`, icon: `clock` }] }),
            users: pl([
              { text: `alice@… : google-id 1042 · no password`, tone: `green`, icon: `idCard` },
            ]),
            bot: hl([{ text: `token from leaked logs`, tone: `red`, icon: `key` }]),
          },
          links: {
            ai: h(`alice`, `idp`, [`alice`, [-12, `alice`], `idp`], { heads: `both` }),
            il: h(`idp`, `login`, [`idp`, `login`]),
            lu: V.base.lu,
            al: V.base.al,
            ...V.bot({ fail: 1, label: `expired token`, labelTone: `amber` }),
          },
          flows: [{ route: [`al`, `lu`], kind: `mine`, rate: 0.7, bounce: !0 }, yl.bot(1)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Store passwords as <b>slow, salted hashes</b> (argon2id, bcrypt).</li>
          <li>Sessions in <b>HttpOnly, Secure</b> cookies, or short-lived tokens.</li>
          <li>Stop stuffing with <b>rate limits</b>, breach checks and a <b>second factor</b>.</li>
          <li>Make <b>password reset</b> as strong as login; <b>passkeys</b> defeat phishing.</li>
          <li>Consider an <b>identity provider</b>; keep tokens <b>short-lived and revocable</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Authorization</b> — knowing who someone is doesn’t tell you what they may do.`,
        },
        metrics: { leak: `nothing usable`, stuffing: 0, mfa: `yes` },
        scene: {
          entities: { alice: dl(), idp: vl(), login: fl(), users: pl() },
          links: {
            ai: h(`alice`, `idp`, [`alice`, [-12, `alice`], `idp`], { heads: `both` }),
            il: h(`idp`, `login`, [`idp`, `login`]),
            lu: V.base.lu,
            al: V.base.al,
          },
          flows: [{ route: [`al`, `lu`], kind: `mine`, rate: 0.7, bounce: !0 }],
        },
      },
    ],
  };

const Sl = (e = []) => y(-12, -6, { label: `Alice · Acme`, tags: e });

const Cl = (e = []) => y(12, -6, { label: `Eve · Globex`, tags: e });

const wl = (e = []) =>
    d(0, -6, { color: `blue`, glyph: `file`, label: [`Invoices`, `API`], tags: e, pills: `below` });

const Tl = (e = [], t = {}) =>
    b(0, 6, { r: 2, h: 42, glyph: `file`, label: `invoices`, tags: e, ...t });

const El = (e = []) =>
    d(0, -18, {
      color: `yellow`,
      glyph: `shield`,
      label: [`Policy`, `Service`],
      tags: e,
      pills: `below`,
    });

const Dl = (e = [], t = {}) =>
    d(12, 6, { color: `green`, glyph: `chart`, label: [`Reports`], tags: e, ...t });

const Ol = (e = []) => b(-12, 6, { r: 1.7, h: 36, glyph: `clipboard`, label: `audit log`, tags: e });

const H = {
    base: (e = {}) => ({
      aa: h(`alice`, `api`, [`alice`, `api`], { heads: `both` }),
      ea: h(`eve`, `api`, [`eve`, `api`], { heads: `both`, ...e }),
      ad: h(`api`, `db`, [`api`, `db`], { heads: `both` }),
    }),
    policy: {
      ap: h(`api`, `policy`, [`api`, `policy`], {
        heads: `both`,
        label: `can Alice edit 1042?`,
        labelAt: 0.55,
      }),
    },
    reports: (e = {}) => ({ rd: h(`reports`, `db`, [`reports`, `db`], { heads: `both`, ...e }) }),
    audit: {
      dau: h(`db`, `audit`, [`db`, `audit`], { label: `every access recorded`, labelAt: 0.5 }),
    },
  };

const U = {
    alice: { route: [`aa`, `ad`], kind: `mine`, rate: 0.8, bounce: !0 },
    eveLeak: { route: [`ea`, `ad`], kind: `poison`, rate: 0.6, bounce: !0 },
    eveDenied: { route: [`ea`], kind: `poison`, rate: 0.6 },
    eveOwn: { route: [`ea`, `ad`], rate: 0.6, bounce: !0 },
  };

const kl = (e, t, n) => S({ x: 0, y: 6, z: 0, dx: 95, dy: -175 }, e, t, { icon: n });

const Al = (e, t, n) => S({ x: 0, y: 6, z: 0, dx: 105, dy: 28 }, e, t, { icon: n });

const jl = {
    id: `authorization`,
    title: `Authorization`,
    summary: `Knowing who someone is doesn’t tell you what they may see or do. Checking that, everywhere.`,
    minutes: 13,
    level: `intermediate`,
    metrics: [`exposed`, `checks`, `privilege`],
    legend: [
      [`mine`, `Alice`],
      [`poison`, `Eve (outsider)`],
      [`req`, `Eve, own data`],
      `res`,
      `fail`,
    ],
    goals: [
      { text: `Broken object-level authorization`, step: 0 },
      { text: `Ownership checks and field allow-lists`, step: 2 },
      { text: `Row-level security in the database`, step: 3 },
      { text: `Roles, relationships and central policy`, step: 6 },
      { text: `Least privilege and confused deputies`, step: 10 },
      { text: `Audit logs`, step: 11 },
    ],
    steps: [
      {
        short: `Change the URL`,
        chapter: `problem`,
        title: `Logged in is not the same as allowed`,
        body: [
          `Eve, from another company, is a legitimate user. She opens her invoice at <code>/invoices/1042</code>, changes the number to <code>1043</code> — and sees an invoice belonging to Acme.`,
          `The API checked that she was <em>logged in</em>, never that this invoice was <em>hers</em>. This is broken object-level authorization — the most common API security flaw.`,
        ],
        callout: {
          kind: `warn`,
          text: `Hiding a button in the UI is not authorization. Attackers call your API directly, with any id they like.`,
        },
        metrics: { exposed: `yes`, checks: `login only`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl([{ text: `GET /invoices/1043 → Acme’s!`, tone: `red`, icon: `eye` }]),
            api: wl([{ text: `checks: logged in? ✓`, tone: `amber` }]),
            db: Tl([{ text: `1043 · Acme · $48,200`, tone: `violet` }]),
          },
          links: H.base(),
          flows: [U.alice, U.eveLeak],
        },
      },
      {
        short: `Ownership`,
        chapter: `solution`,
        title: `Check ownership on every request`,
        body: [
          `Every lookup must be scoped to who is asking: fetch invoice 1043 <em>only if</em> it belongs to the caller’s organisation. For Eve that finds nothing, and she gets <code>404 Not Found</code>.`,
          `Deny by default: any endpoint that forgets the check should fail closed, not open.`,
        ],
        callout: {
          kind: `tip`,
          text: `Answer 404, not 403, for other people’s objects — don’t confirm they exist. Random ids (UUIDs) help, but are no substitute for the check.`,
        },
        changes: [`+ Queries scoped to the caller’s organisation`, `~ Eve’s request → 404`],
        metrics: { exposed: `no`, checks: `every request`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl([{ text: `/invoices/1043 → 404`, tone: `green`, icon: `ban` }]),
            api: wl([{ text: `checks: owner = caller’s org`, tone: `green`, icon: `shield` }]),
            db: Tl(),
            card: Al(
              `Scope every query`,
              [
                `SELECT * FROM invoices`,
                ` WHERE id = 1043`,
                `   AND org_id = :caller_org`,
                `= Eve (Globex) → no row → 404`,
              ],
              `shield`,
            ),
          },
          links: H.base({ fail: 1 }),
          flows: [U.alice, U.eveDenied],
        },
      },
      {
        short: `Mass assign`,
        chapter: `problem`,
        title: `Case: “role”: “admin”`,
        body: [
          `Eve edits her own profile — that’s allowed. But the API takes the JSON body and saves every field in it. So she adds <code>"role": "admin"</code> to the request and promotes herself.`,
          `This is <span class="term">mass assignment</span>. Fix: each endpoint has an allow-list of fields it may change, and roles change only through a separate admin-only endpoint.`,
        ],
        callout: {
          kind: `warn`,
          text: `Frameworks that bind request bodies straight onto database models make this easy to get wrong. Be explicit about writable fields.`,
        },
        changes: [
          `+ Eve sends an extra “role” field`,
          `− API saves it · Eve is admin`,
          `~ Fix: allow-list writable fields`,
        ],
        metrics: { exposed: `yes`, checks: `every request`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl([{ text: `PATCH /me { "role": "admin" }`, tone: `red`, icon: `alert` }]),
            api: wl([{ text: `saves every field sent`, tone: `red` }]),
            db: Tl([{ text: `eve · role = admin!`, tone: `red`, icon: `alert` }], { heat: 0.5 }),
            card: kl(
              `Allow-list writable fields`,
              [
                `! update(user, request.body)`,
                `= update(user, pick(body, "name", "email"))`,
                `# role: admin-only endpoint`,
              ],
              `filter`,
            ),
          },
          links: H.base(),
          flows: [U.alice, { route: [`ea`, `ad`], kind: `poison`, rate: 0.6, bounce: !0 }],
        },
      },
      {
        short: `Row-level`,
        chapter: `technique`,
        title: `Let the database enforce tenants too`,
        body: [
          `Ownership checks live in application code, so one query that forgets <code>AND org_id = …</code> brings the leak right back. Add a second layer: <span class="term">row-level security</span> in the database.`,
          `The app tells each connection which organisation it is serving; the database then filters every query by that org. Even <code>SELECT * FROM invoices</code> only returns the caller’s rows.`,
        ],
        callout: {
          kind: `insight`,
          text: `Defence in depth: assume any single check will eventually be forgotten, and make sure a second one is there.`,
        },
        changes: [`+ Row-level security on invoices`, `~ App sets the caller’s org per connection`],
        metrics: { exposed: `no`, checks: `app + database`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl([{ text: `Globex rows only`, tone: `green`, icon: `filter` }]),
            api: wl([{ text: `SET app.org = caller’s org`, icon: `shield` }]),
            db: Tl([{ text: `row-level security: org_id`, tone: `green`, icon: `filter` }]),
            card: kl(
              `The database filters too`,
              [
                `CREATE POLICY tenant ON invoices`,
                `  USING (org_id = current_org())`,
                `= SELECT * FROM invoices`,
                `#   → only the caller’s organisation`,
              ],
              `filter`,
            ),
          },
          links: H.base(),
          flows: [U.alice, U.eveOwn],
        },
      },
      {
        short: `Roles`,
        chapter: `technique`,
        title: `Roles: what each kind of user may do`,
        body: [
          `Inside Acme, people need different powers: some only view invoices, some edit them, a few approve large ones. Rather than list permissions per person, group them into <span class="term">roles</span> and give each person a role — role-based access control (RBAC).`,
          `Alice is an accountant: she can edit invoices but not approve them.`,
        ],
        callout: {
          kind: `tip`,
          text: `Keep roles few and meaningful. Hundreds of special-case roles become impossible to reason about.`,
        },
        changes: [`+ Roles: viewer, accountant, approver, admin`],
        metrics: { exposed: `no`, checks: `every request`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl([{ text: `role: accountant`, icon: `idCard` }]),
            eve: Cl(),
            api: wl([{ text: `role allows “edit”? ✓`, tone: `green`, icon: `shield` }]),
            db: Tl(),
            card: Al(
              `Roles → permissions`,
              [
                `viewer      read`,
                `accountant  read · edit`,
                `approver    read · approve`,
                `admin       everything + users`,
              ],
              `idCard`,
            ),
          },
          links: H.base(),
          flows: [U.alice, U.eveOwn],
        },
      },
      {
        short: `Sharing`,
        chapter: `technique`,
        title: `Relationships: sharing and teams`,
        body: [
          `Roles struggle with sharing: “Alice can see this folder because it was shared with her team”. <b>Relationship-based</b> access (ReBAC) stores facts like “invoice 1042 is in folder Q3”, “Q3 is shared with team Finance”, “Alice is in Finance”, and follows the chain.`,
          `This is how Google Docs-style sharing works at scale.`,
        ],
        callout: {
          kind: `insight`,
          text: `Google’s Zanzibar paper popularised this model; SpiceDB and OpenFGA are open-source versions.`,
        },
        changes: [`+ Permissions derived from relationships`],
        metrics: { exposed: `no`, checks: `every request`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl([{ text: `member of team Finance`, icon: `users` }]),
            eve: Cl(),
            api: wl([{ text: `follows the relationship chain`, tone: `green`, icon: `waypoints` }]),
            db: Tl(),
            card: Al(
              `Why can Alice view 1042?`,
              [
                `invoice 1042  in      folder Q3`,
                `folder Q3     shared  team Finance`,
                `team Finance  member  alice`,
                `= alice may view invoice 1042`,
              ],
              `waypoints`,
            ),
          },
          links: H.base(),
          flows: [U.alice, U.eveOwn],
        },
      },
      {
        short: `Policy`,
        chapter: `technique`,
        title: `Decide in one place`,
        body: [
          `Permission checks scattered as if-statements across twenty services drift apart, and nobody can answer “who can approve invoices?”. Instead, each service asks a <span class="term">policy service</span>: “may Alice edit invoice 1042?”, and enforces the yes or no.`,
          `The rules live in one place, are tested like code, and every decision can be logged.`,
        ],
        callout: {
          kind: `tip`,
          text: `Tools: Open Policy Agent (Rego), AWS Cedar, or a permissions service like SpiceDB. Cache decisions briefly to keep calls fast.`,
        },
        changes: [`+ Central policy service`, `~ API asks, then enforces`],
        metrics: { exposed: `no`, checks: `central policy`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl([{ text: `role: accountant`, icon: `idCard` }]),
            eve: Cl(),
            api: wl(),
            db: Tl(),
            policy: El([{ text: `allow: edit · deny: approve`, tone: `green`, icon: `check` }]),
          },
          links: { ...H.base(), ...H.policy },
          flows: [U.alice, U.eveOwn, { route: [`ap`], rate: 1, bounce: !0 }],
        },
      },
      {
        short: `Master key`,
        chapter: `problem`,
        title: `Case: a service with keys to everything`,
        body: [
          `The reports service connects to the database with the admin account — it was quickest to set up. One day a SQL-injection bug is found in a report filter.`,
          `Because the service could read <em>every</em> table, the attacker dumps users, password hashes and payment details too — not just invoices.`,
        ],
        callout: {
          kind: `warn`,
          text: `A component’s permissions define the blast radius of its bugs.`,
        },
        changes: [
          `+ Reports service with admin DB credentials`,
          `− Injection bug exposes every table`,
        ],
        metrics: { exposed: `yes`, checks: `central policy`, privilege: `everything` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl(),
            api: wl(),
            db: Tl([{ text: `users · payments · invoices dumped`, tone: `red`, icon: `alert` }], {
              heat: 0.5,
            }),
            policy: El(),
            reports: Dl([{ text: `admin creds · injection bug`, tone: `red`, icon: `key` }], {
              heat: 0.4,
            }),
          },
          links: { ...H.base(), ...H.policy, ...H.reports() },
          flows: [U.alice, { route: [`rd`], kind: `poison`, rate: 1.2, bounce: !0 }],
        },
      },
      {
        short: `Least privilege`,
        chapter: `solution`,
        title: `Least privilege`,
        body: [
          `Give every service — and every person — only the access its job needs. The reports service gets a <b>read-only</b> account that can see the invoices view and nothing else; each service has its own credentials and identity.`,
          `The same injection bug now leaks, at worst, invoices the service could already read — and alarms fire when it tries anything else.`,
        ],
        callout: {
          kind: `tip`,
          text: `Apply it everywhere: database grants, cloud IAM roles, API scopes, and staff access (time-limited, approved, logged).`,
        },
        changes: [`~ Reports: read-only, invoices view only`, `+ Separate credentials per service`],
        metrics: { exposed: `no`, checks: `central policy`, privilege: `least privilege` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl(),
            api: wl(),
            db: Tl(),
            policy: El(),
            reports: Dl([
              { text: `read-only · invoices view`, tone: `green`, icon: `key` },
              { text: `users table: denied`, tone: `green`, icon: `ban` },
            ]),
          },
          links: { ...H.base(), ...H.policy, ...H.reports() },
          flows: [U.alice, { route: [`rd`], rate: 1, bounce: !0 }],
        },
      },
      {
        short: `Deputy`,
        chapter: `problem`,
        title: `Case: the confused deputy`,
        body: [
          `Alice asks for a report of invoices over $10,000. The API hands the job to the reports service, which queries with <em>its own</em> identity — and it may read every tenant’s invoices. Alice’s report includes Globex’s.`,
          `The reports service was tricked into using its authority on someone else’s behalf: a <span class="term">confused deputy</span>.`,
        ],
        callout: {
          kind: `warn`,
          text: `Whenever a service acts for a user, ask: whose permissions apply here — the service’s or the user’s?`,
        },
        changes: [`+ Report runs as the reports service`, `− Alice sees other tenants’ invoices`],
        metrics: { exposed: `yes`, checks: `central policy`, privilege: `least privilege` },
        scene: {
          entities: {
            alice: Sl([{ text: `report includes Globex!`, tone: `red`, icon: `alert` }]),
            api: wl(),
            db: Tl(),
            policy: El(),
            reports: Dl([{ text: `own identity · all tenants`, tone: `red`, icon: `key` }], {
              heat: 0.4,
            }),
          },
          links: {
            aa: H.base().aa,
            ad: H.base().ad,
            ...H.policy,
            ar: h(`api`, `reports`, [`api`, [`reports`, `api`], `reports`], {
              heads: `both`,
              label: `run report`,
              labelAt: 0.4,
            }),
            ...H.reports(),
          },
          flows: [{ route: [`aa`, `ar`, `rd`], kind: `mine`, rate: 0.7, bounce: !0 }],
        },
      },
      {
        short: `On behalf`,
        chapter: `solution`,
        title: `Act as the user, not as yourself`,
        body: [
          `Pass the user’s identity along: the API forwards Alice’s token (or exchanges it for a narrower one), and the reports service runs the query <em>as Alice</em> — with her organisation and her permissions.`,
          `The service’s own powerful credentials are only used for things no user asked for, like nightly maintenance.`,
        ],
        callout: {
          kind: `tip`,
          text: `OAuth token exchange and service meshes can carry the end user’s identity across every hop automatically.`,
        },
        changes: [
          `~ Alice’s token passed to Reports`,
          `~ Query runs with Alice’s permissions`,
          `− Other tenants’ data`,
        ],
        metrics: { exposed: `no`, checks: `central policy`, privilege: `least privilege` },
        scene: {
          entities: {
            alice: Sl([{ text: `only Acme invoices`, tone: `green`, icon: `check` }]),
            api: wl(),
            db: Tl(),
            policy: El(),
            reports: Dl([{ text: `acts as Alice · Acme only`, tone: `green`, icon: `userCheck` }]),
          },
          links: {
            aa: H.base().aa,
            ad: H.base().ad,
            ...H.policy,
            ar: h(`api`, `reports`, [`api`, [`reports`, `api`], `reports`], {
              heads: `both`,
              label: `Alice’s token`,
              labelAt: 0.4,
            }),
            ...H.reports(),
          },
          flows: [
            { route: [`aa`, `ar`, `rd`], kind: `mine`, rate: 0.7, bounce: !0 },
            { route: [`ap`], rate: 0.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Audit`,
        chapter: `technique`,
        title: `Audit logs: who saw what`,
        body: [
          `Finally, record every access to sensitive data — who, what, when, from where — in an append-only <span class="term">audit log</span> that the people being audited can’t edit.`,
          `It answers “who looked at this customer’s invoices?” after an incident, and powers alerts: a support agent opening 5,000 invoices in ten minutes is worth a page.`,
        ],
        callout: {
          kind: `insight`,
          text: `Audit logs are also required by most compliance standards (SOC 2, HIPAA, GDPR requests).`,
        },
        changes: [`+ Append-only audit log`, `+ Alert on unusual access`],
        metrics: { exposed: `no`, checks: `central policy`, privilege: `least privilege` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl(),
            api: wl(),
            db: Tl(),
            policy: El(),
            reports: Dl([{ text: `read-only · invoices view`, tone: `green`, icon: `key` }]),
            audit: Ol([{ text: `alice viewed 1042 · 09:14`, icon: `clipboard` }]),
          },
          links: { ...H.base(), ...H.policy, ...H.reports(), ...H.audit },
          flows: [U.alice, U.eveOwn, { route: [`dau`], kind: `write`, rate: 1.2 }],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Check that the caller may access <b>this object</b>, on every request.</li>
          <li>Use <b>roles</b> for kinds of users, <b>relationships</b> for sharing.</li>
          <li>Decide in a <b>central policy</b>; enforce in each service.</li>
          <li>Allow-list writable fields; add <b>row-level security</b> as a second layer.</li>
          <li>Grant <b>least privilege</b>; act <b>as the user</b>, not as the service; keep an <b>audit log</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Encryption & Secrets</b> — protecting data on the wire, on disk, and the keys themselves.`,
        },
        metrics: { exposed: `no`, checks: `central policy`, privilege: `least privilege` },
        scene: {
          entities: {
            alice: Sl(),
            eve: Cl(),
            api: wl(),
            db: Tl(),
            policy: El(),
            reports: Dl(),
            audit: Ol(),
          },
          links: { ...H.base(), ...H.policy, ...H.reports(), ...H.audit },
          flows: [
            U.alice,
            U.eveOwn,
            { route: [`ap`], rate: 0.8, bounce: !0 },
            { route: [`dau`], kind: `write`, rate: 1 },
          ],
        },
      },
    ],
  };

const Ml = (e = [], t = {}) => y(0, -21, { label: `Alice · café Wi-Fi`, tags: e, ...t });

const Nl = () => d(0, -12, { s: 3, h: 30, color: `slab`, glyph: `wifi`, label: [] });

const Pl = (e = []) => y(-14, -3, { label: `Mallory · same Wi-Fi`, tags: e });

const Fl = (e = []) => f(0, -3, { tags: e, pills: `below` });

const Il = (e = []) => d(0, 6, { label: [`App`], tags: e });

const Ll = (e = [], t = {}) =>
    b(0, 15, { r: 2, h: 42, glyph: `user`, label: `customer DB`, tags: e, ...t });

const Rl = (e = []) => y(13, 15, { label: `thief`, tags: e });

const zl = () => d(0, 25, { color: `yellow`, glyph: `key`, label: [`KMS`], sub: `key service` });

const Bl = (e = []) =>
    d(-12, 6, { color: `yellow`, glyph: `keyhole`, label: [`Secrets`, `Manager`], tags: e });

const Vl = (e = []) => d(13, 6, { color: `slab`, glyph: `file`, label: [`Public`, `Repo`], tags: e });

const Hl = (e = []) => y(21, -5, { label: `scanner bot`, tags: e });

const Ul = (e = {}) => ({
    ar: h(`alice`, `router`, [`alice`, `router`], { heads: `both`, ...(e.ar || {}) }),
    rl: h(`router`, `lb`, [`router`, `lb`], { heads: `both`, ...(e.rl || {}) }),
    la: h(`lb`, `app`, [`lb`, `app`], { heads: `both`, ...(e.la || {}) }),
    ad: h(`app`, `db`, [`app`, `db`], { heads: `both`, ...(e.ad || {}) }),
  });

const Wl = () => ({
    sn: h(`router`, `mallory`, [`router`, [`mallory`, `router`], `mallory`], { style: `dashed` }),
  });

const Gl = {
    st: h(`db`, `thief`, [`db`, `thief`], {
      style: `dashed`,
      label: `backup copied`,
      labelTone: `red`,
    }),
  };

const Kl = {
    req: { route: [`ar`, `rl`, `la`, `ad`], kind: `mine`, rate: 0.9, bounce: !0 },
    sniffPlain: { route: [`sn`], kind: `poison`, rate: 0.9 },
    sniffCipher: { route: [`sn`], kind: `empty`, rate: 0.9 },
    stealPlain: { route: [`st`], kind: `poison`, rate: 0.7 },
    stealCipher: { route: [`st`], kind: `empty`, rate: 0.7 },
  };

const ql = (e = {}) => ({
    alice: Ml(e.alice),
    router: Nl(),
    lb: Fl(e.lb),
    app: Il(e.app),
    db: Ll(e.db, e.dbProps),
  });

const Jl = (e, t, n) => S({ x: -12, y: 2, z: 0, dx: -150, dy: -150 }, e, t, { icon: n });

const Yl = {
    id: `encryption`,
    title: `Encryption & Secrets`,
    summary: `Protecting data on the wire, on disk, and the keys and passwords your services use.`,
    minutes: 13,
    level: `intermediate`,
    metrics: [`inTransit`, `atRest`, `secrets`],
    legend: [
      [`mine`, `Alice’s request`],
      `res`,
      [`poison`, `readable by attacker`],
      [`empty`, `encrypted (unreadable)`],
    ],
    goals: [
      { text: `TLS, certificates and renewing them`, step: 2 },
      { text: `Encryption inside the data center and at rest`, step: 5 },
      { text: `Rotating keys`, step: 6 },
      { text: `Keeping secrets out of code`, step: 8 },
      { text: `Tokenization and end-to-end encryption`, step: 10 },
    ],
    steps: [
      {
        short: `Café Wi-Fi`,
        chapter: `problem`,
        title: `Plain HTTP on café Wi-Fi`,
        body: [
          `Alice logs in from a café. The site uses plain <code>http://</code>, so her password and session cookie travel as readable text through the Wi-Fi router and a dozen networks beyond it.`,
          `Mallory, on the same Wi-Fi, records the traffic and reads everything — and could even change pages on the way back.`,
        ],
        callout: {
          kind: `warn`,
          text: `Anyone on the path — Wi-Fi, ISP, a compromised router — can read and alter unencrypted traffic.`,
        },
        metrics: { inTransit: `no`, atRest: `no`, secrets: `—` },
        scene: {
          entities: {
            ...ql({
              alice: [{ text: `http:// · password in clear`, tone: `red`, icon: `eyeOff` }],
            }),
            mallory: Pl([{ text: `reads: alice / hunter2`, tone: `red`, icon: `eye` }]),
          },
          links: { ...Ul(), ...Wl() },
          flows: [Kl.req, Kl.sniffPlain],
        },
      },
      {
        short: `TLS`,
        chapter: `solution`,
        title: `TLS: encrypt the wire`,
        body: [
          `With HTTPS, <span class="term">TLS</span> encrypts everything between Alice’s browser and the site. During the handshake the server presents a <b>certificate</b>, signed by a certificate authority the browser trusts, proving it really is <code>shop.example</code>.`,
          `Mallory still copies every packet — but sees only random-looking bytes, and can’t alter them without detection.`,
        ],
        callout: {
          kind: `tip`,
          text: `Certificates are free and automatic with Let’s Encrypt. Add HSTS so browsers never fall back to http://.`,
        },
        changes: [`+ TLS certificate on the load balancer`, `~ Mallory sees only ciphertext`],
        metrics: { inTransit: `outside only`, atRest: `no`, secrets: `—` },
        scene: {
          entities: {
            ...ql({
              alice: [{ text: `https:// · encrypted`, tone: `green`, icon: `lock` }],
              lb: [{ text: `certificate: shop.example`, icon: `fileKey` }],
            }),
            mallory: Pl([{ text: `sees random bytes`, tone: `green`, icon: `eyeOff` }]),
            card: Jl(
              `The TLS handshake`,
              [
                `server shows its certificate`,
                `browser checks the CA signature`,
                `both agree on fresh session keys`,
                `= everything after: encrypted + tamper-proof`,
              ],
              `lock`,
            ),
          },
          links: { ...Ul({ ar: { label: `TLS`, labelAt: 0.5 }, rl: { label: `TLS` } }), ...Wl() },
          flows: [Kl.req, Kl.sniffCipher],
        },
      },
      {
        short: `Expired`,
        chapter: `problem`,
        title: `Case: the certificate expired at 3 a.m.`,
        body: [
          `Certificates have an expiry date. This one was renewed by hand once a year — by someone who has since left. At 03:00 it expires, every browser shows a full-page security warning, and most users leave.`,
          `An outage caused by a date. Fix: automatic renewal with ACME (Let’s Encrypt, or your cloud’s certificate manager), and an alert 30 days before any certificate expires.`,
        ],
        callout: {
          kind: `tip`,
          text: `Short-lived certificates (90 days or less) force automation — and limit the damage if a private key ever leaks.`,
        },
        changes: [
          `− Certificate expired 03:00`,
          `− Browsers block the site`,
          `~ Fix: auto-renew + expiry alerts`,
        ],
        metrics: { inTransit: `outside only`, atRest: `no`, secrets: `—` },
        scene: {
          entities: {
            ...ql({
              alice: [{ text: `“Your connection is not private”`, tone: `red`, icon: `alert` }],
              lb: [{ text: `certificate expired 03:00`, tone: `red`, icon: `clock` }],
            }),
            card: Jl(
              `Never expire by surprise`,
              [
                `! renewed by hand, once a year`,
                `= ACME: auto-renew every 60 days`,
                `= alert 30 days before any expiry`,
                `# check every endpoint, not just www`,
              ],
              `fileKey`,
            ),
          },
          links: Ul({ ar: { fail: 0.8 } }),
          flows: [{ route: [`ar`, `rl`, `la`, `ad`], kind: `mine`, rate: 0.9, bounce: !0 }],
        },
      },
      {
        short: `Inside too`,
        chapter: `technique`,
        title: `Encrypt inside the data center too`,
        body: [
          `The load balancer <b>terminates</b> TLS — and traditionally sent plain traffic onward, trusting the internal network. But one compromised machine inside could then read everything.`,
          `Modern systems assume no network is trusted (<b>zero trust</b>): services talk over <span class="term">mutual TLS</span>, where both sides present certificates, so every hop is encrypted and every caller is identified.`,
        ],
        callout: {
          kind: `tip`,
          text: `A service mesh can add mTLS between all services automatically, with short-lived certificates it rotates for you.`,
        },
        changes: [`~ LB → app → DB over mutual TLS`, `+ Every service has its own certificate`],
        metrics: { inTransit: `yes`, atRest: `no`, secrets: `—` },
        scene: {
          entities: {
            ...ql({ app: [{ text: `mTLS · own certificate`, tone: `green`, icon: `fileKey` }] }),
            mallory: Pl([{ text: `sees random bytes`, tone: `green`, icon: `eyeOff` }]),
          },
          links: { ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }), ...Wl() },
          flows: [Kl.req, Kl.sniffCipher],
        },
      },
      {
        short: `Stolen backup`,
        chapter: `problem`,
        title: `The stolen backup`,
        body: [
          `Every byte on the wire is now safe. Then a database backup is left in a storage bucket that was accidentally made public, and someone copies it.`,
          `Encryption in transit does nothing here: the data on disk — every customer’s name, address and order history — is readable.`,
        ],
        callout: {
          kind: `warn`,
          text: `Disks get lost, snapshots get shared, buckets get misconfigured. Data at rest needs its own protection.`,
        },
        changes: [`− Backup in a public bucket`, `− Copied and readable`],
        metrics: { inTransit: `yes`, atRest: `no`, secrets: `—` },
        scene: {
          entities: {
            ...ql({ db: [{ text: `backup in public bucket`, tone: `red`, icon: `alert` }] }),
            thief: Rl([{ text: `reads every customer`, tone: `red`, icon: `eye` }]),
          },
          links: { ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }), ...Gl },
          flows: [Kl.req, Kl.stealPlain],
        },
      },
      {
        short: `At rest`,
        chapter: `solution`,
        title: `Encrypt at rest, keep keys elsewhere`,
        body: [
          `Encrypt disks, database files and backups. The trick is the key: if it sits next to the data, a thief takes both. So keys live in a separate <span class="term">key management service</span> (KMS), which never hands out its master key.`,
          `With <b>envelope encryption</b>, data is encrypted with a data key, and the data key is itself encrypted by the KMS. Every use of a key is logged, and access can be revoked.`,
        ],
        callout: {
          kind: `tip`,
          text: `Cloud databases and storage encrypt at rest with a checkbox. For very sensitive fields, also encrypt in the application.`,
        },
        changes: [
          `+ Data and backups encrypted (AES-256)`,
          `+ Keys held by a KMS`,
          `~ Stolen copy is unreadable`,
        ],
        metrics: { inTransit: `yes`, atRest: `yes`, secrets: `—` },
        scene: {
          entities: {
            ...ql({ db: [{ text: `encrypted · AES-256`, tone: `green`, icon: `lock` }] }),
            thief: Rl([{ text: `only ciphertext`, tone: `green`, icon: `eyeOff` }]),
            kms: zl(),
            card: Jl(
              `Envelope encryption`,
              [
                `data  —encrypted with→  data key`,
                `data key —encrypted by→ KMS master key`,
                `= steal the disk: no usable key`,
                `# rotate keys, audit every use`,
              ],
              `key`,
            ),
          },
          links: {
            ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }),
            ...Gl,
            dk: h(`db`, `kms`, [`db`, `kms`], { heads: `both`, label: `unwrap data key` }),
          },
          flows: [Kl.req, Kl.stealCipher, { route: [`dk`], kind: `write`, rate: 0.4, bounce: !0 }],
        },
      },
      {
        short: `Rotation`,
        chapter: `technique`,
        title: `Rotating keys without re-encrypting everything`,
        body: [
          `Keys should change regularly — and immediately if one might have leaked. Re-encrypting terabytes of data would take days.`,
          `Envelope encryption makes it cheap: create a new master key in the KMS and <b>re-wrap</b> each small data key with it. The data itself is never touched, and new writes simply get fresh data keys.`,
        ],
        callout: {
          kind: `tip`,
          text: `Most KMSs rotate master keys automatically every year and keep old versions to unwrap older data keys.`,
        },
        changes: [
          `+ Master key v2 in the KMS`,
          `~ Data keys re-wrapped (KB, not TB)`,
          `~ Data untouched`,
        ],
        metrics: { inTransit: `yes`, atRest: `yes`, secrets: `—` },
        scene: {
          entities: {
            ...ql({ db: [{ text: `data keys re-wrapped · v2`, tone: `green`, icon: `refresh` }] }),
            kms: zl(),
            card: Jl(
              `Rotating keys`,
              [
                `new master key v2 in the KMS`,
                `re-wrap each data key: kilobytes`,
                `= the data is never re-encrypted`,
                `# new writes use fresh data keys`,
              ],
              `refresh`,
            ),
          },
          links: {
            ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }),
            dk: h(`db`, `kms`, [`db`, `kms`], { heads: `both`, label: `re-wrap data keys` }),
          },
          flows: [Kl.req, { route: [`dk`], kind: `write`, rate: 1.2, bounce: !0 }],
        },
      },
      {
        short: `Leaked key`,
        chapter: `problem`,
        title: `Case: a secret in the code`,
        body: [
          `A developer hard-codes the payment provider’s API key in the source to test something, and the repository is public. Bots scan public repositories continuously: the key is found and used within minutes.`,
          `Deleting the line doesn’t help — it’s in the git history forever. The only fix is to <b>revoke</b> the key and issue a new one.`,
        ],
        callout: {
          kind: `warn`,
          text: `Secrets in code end up in repos, builds, logs and laptops. Treat any secret that touched git as compromised.`,
        },
        changes: [`+ API key committed to a public repo`, `− Found by a scanner bot in minutes`],
        metrics: { inTransit: `yes`, atRest: `yes`, secrets: `source code` },
        scene: {
          entities: {
            ...ql({ app: [{ text: `API key in source code`, tone: `red`, icon: `key` }] }),
            kms: zl(),
            repo: Vl([{ text: `sk_live_… in history`, tone: `red`, icon: `alert` }]),
            bot: Hl([{ text: `key found in 4 min`, tone: `red`, icon: `bot` }]),
          },
          links: {
            ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }),
            dk: h(`db`, `kms`, [`db`, `kms`], { heads: `both` }),
            ap: h(`app`, `repo`, [`app`, `repo`], { label: `git push` }),
            rb: h(`repo`, `bot`, [`repo`, [`bot`, `repo`], `bot`], {
              style: `dashed`,
              label: `scraped`,
              labelTone: `red`,
            }),
          },
          flows: [
            Kl.req,
            { route: [`ap`], kind: `write`, rate: 0.4 },
            { route: [`rb`], kind: `poison`, rate: 0.8 },
          ],
        },
      },
      {
        short: `Vault`,
        chapter: `solution`,
        title: `A secrets manager`,
        body: [
          `Keep secrets out of code entirely. The app fetches them at startup from a <span class="term">secrets manager</span> (HashiCorp Vault, AWS Secrets Manager), proving its own identity to get only the secrets it needs.`,
          `Secrets are rotated regularly — or issued short-lived on demand — and scanners in CI block any commit that looks like a key.`,
        ],
        callout: {
          kind: `tip`,
          text: `Never log secrets, and keep them out of error messages and environment dumps.`,
        },
        changes: [
          `+ Secrets manager`,
          `~ App fetches secrets at startup`,
          `+ Automatic rotation · secret scanning in CI`,
        ],
        metrics: { inTransit: `yes`, atRest: `yes`, secrets: `secrets manager` },
        scene: {
          entities: {
            ...ql({ app: [{ text: `no secrets in code`, tone: `green`, icon: `check` }] }),
            kms: zl(),
            vault: Bl([{ text: `rotated every 30 days`, icon: `refresh` }]),
            repo: Vl([{ text: `secret scan: clean`, tone: `green`, icon: `check` }]),
          },
          links: {
            ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }),
            dk: h(`db`, `kms`, [`db`, `kms`], { heads: `both` }),
            av: h(`app`, `vault`, [`app`, `vault`], { heads: `both`, label: `fetch at startup` }),
            ap: h(`app`, `repo`, [`app`, `repo`], { label: `git push` }),
          },
          flows: [
            Kl.req,
            { route: [`av`], kind: `write`, rate: 0.5, bounce: !0 },
            { route: [`ap`], rate: 0.3 },
          ],
        },
      },
      {
        short: `Tokenize`,
        chapter: `technique`,
        title: `Case: card numbers — tokenize them`,
        body: [
          `Card numbers are the most valuable data you could hold, and every system that stores or even sees them must meet strict rules (PCI DSS). Encrypting them still leaves you holding them.`,
          `Better: don’t hold them. The checkout sends the card to a payment provider, which stores it and returns a <span class="term">token</span> like <code>tok_4f2c</code>. Your database, logs and analytics only ever see tokens — worthless to a thief.`,
        ],
        callout: {
          kind: `insight`,
          text: `The safest sensitive data is data you never store. Ask whether you need it at all before deciding how to protect it.`,
        },
        changes: [
          `+ Payment provider holds the real card numbers`,
          `~ Database stores tokens only`,
          `− Card numbers in your systems`,
        ],
        metrics: { inTransit: `yes`, atRest: `yes`, secrets: `secrets manager` },
        scene: {
          entities: {
            ...ql({
              app: [{ text: `never sees card numbers`, tone: `green`, icon: `check` }],
              db: [{ text: `card: tok_4f2c`, tone: `green`, icon: `creditCard` }],
            }),
            kms: zl(),
            pp: d(-12, 15, {
              color: `purple`,
              glyph: `creditCard`,
              label: [`Payment`, `Provider`],
              tags: [{ text: `holds real card numbers`, icon: `lock` }],
            }),
            thief: Rl([{ text: `steals tokens · useless`, tone: `green`, icon: `eyeOff` }]),
          },
          links: {
            ...Ul({ la: { label: `mTLS` }, ad: { label: `mTLS` } }),
            dk: h(`db`, `kms`, [`db`, `kms`], { heads: `both` }),
            pt: h(`app`, `pp`, [`app`, [-6, `app`], [-6, `pp`], `pp`], {
              heads: `both`,
              label: `card → token`,
              labelAt: 0.45,
            }),
            ...Gl,
          },
          flows: [Kl.req, { route: [`pt`], kind: `mine`, rate: 0.5, bounce: !0 }, Kl.stealCipher],
        },
      },
      {
        short: `End-to-end`,
        chapter: `technique`,
        title: `End-to-end: even the server can’t read it`,
        body: [
          `For private messages you can go further. With <span class="term">end-to-end encryption</span>, Alice’s phone encrypts each message with Bob’s public key; only Bob’s phone holds the private key to decrypt it.`,
          `The chat server stores and forwards ciphertext. A breach of the server — or a request to hand over messages — reveals nothing readable.`,
          `<small>That’s the idea in one line. Real protocols use the key pairs to agree on a fresh secret key for every message, so a key stolen later can’t unlock old conversations (<b>forward secrecy</b>).</small>`,
        ],
        callout: {
          kind: `insight`,
          text: `The trade-off: the server can’t search, filter or back up readable messages, and losing your device can mean losing history. Signal and WhatsApp use the Signal protocol.`,
        },
        changes: [`+ Messages encrypted on the device`, `~ Server relays only ciphertext`],
        metrics: { inTransit: `end-to-end`, atRest: `yes`, secrets: `secrets manager` },
        scene: {
          entities: {
            alice: Ml([{ text: `encrypt with Bob’s public key`, icon: `lock` }], {
              form: `phone`,
              w: 5,
              d: 5,
              label: `Alice`,
            }),
            chat: d(0, -6, {
              glyph: `message`,
              label: [`Chat`, `Server`],
              tags: [{ text: `sees only ciphertext`, tone: `green`, icon: `eyeOff` }],
            }),
            bob: y(13, -6, {
              form: `phone`,
              w: 5,
              d: 5,
              label: `Bob`,
              tags: [{ text: `decrypt with private key`, icon: `key` }],
            }),
          },
          links: {
            ac: h(`alice`, `chat`, [`alice`, `chat`]),
            cb: h(`chat`, `bob`, [`chat`, `bob`]),
          },
          flows: [{ route: [`ac`, `cb`], kind: `empty`, rate: 0.9 }],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>TLS</b> everywhere outside; <b>mTLS</b> between services inside.</li>
          <li>Encrypt <b>at rest</b>, with keys held separately in a <b>KMS</b>.</li>
          <li>Automate <b>certificate renewal</b>; rotate keys by <b>re-wrapping</b> data keys.</li>
          <li>Keep secrets in a <b>secrets manager</b>, rotate them, scan for leaks.</li>
          <li><b>Tokenize</b> what you’d rather not hold at all, like card numbers.</li>
          <li><b>End-to-end</b> encryption when even the server shouldn’t read the data.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `That completes Security. Next module: <b>Shipping</b> — testing changes and getting them to production safely.`,
        },
        metrics: { inTransit: `yes`, atRest: `yes`, secrets: `secrets manager` },
        scene: {
          entities: { ...ql(), kms: zl(), vault: Bl() },
          links: {
            ...Ul({ ar: { label: `TLS` }, la: { label: `mTLS` }, ad: { label: `mTLS` } }),
            dk: h(`db`, `kms`, [`db`, `kms`], { heads: `both` }),
            av: h(`app`, `vault`, [`app`, `vault`], { heads: `both` }),
          },
          flows: [Kl.req, { route: [`av`], kind: `write`, rate: 0.4, bounce: !0 }],
        },
      },
    ],
  };

const Xl = { x0: -4.5, x1: 4.5, y0: -21, y1: -15 };

const Zl = (e = `shoppers`) => p(Xl, 10, e);

const Ql = (e = {}) => d(-13, -4, { color: `green`, glyph: `flask`, label: [`Tests`], ...e });

const $l = (e = {}) => d(0, -4, { glyph: `cart`, label: [`Checkout`], sub: `your code`, ...e });

const eu = (e = {}) => b(11, -4, { label: `orders db`, ...e });

const tu = (e = {}) =>
    d(0, 9, {
      color: `purple`,
      glyph: `creditCard`,
      label: [`Payment`, `provider`],
      sub: `external`,
      ...e,
    });

const nu = (e = {}) =>
    d(11, 9, { color: `yellow`, glyph: `boxes`, label: [`Inventory`], sub: `another team`, ...e });

const ru = (e = `fake db · in memory`) => m(11, -4, 3.6, 30, e);

const iu = (e = `stub: “approved”`) => m(0, 9, 4, 34, e);

const au = (e = `stub: “in stock”`) => m(11, 9, 4, 34, e);

const W = {
    ts: (e = {}) => h(`tests`, `svc`, [`tests`, `svc`], { heads: `both`, ...e }),
    us: (e = {}) => h(`users`, `svc`, [`users`, `svc`], { heads: `both`, ...e }),
    sd: (e = `db`, t = {}) => h(`svc`, e, [`svc`, e], { heads: `both`, ...t }),
    sp: (e = `pay`, t = {}) => h(`svc`, e, [`svc`, e], { heads: `both`, ...t }),
    si: (e = `inv`, t = {}) =>
      h(`svc`, e, [`svc`, [`svc`, `svc+1.5`], [5.5, `svc+1.5`], [5.5, e], e], {
        heads: `both`,
        ...t,
      }),
  };

const ou = (e, t, n) => S({ x: 0, y: 0, z: 0 }, e, t, { icon: n });

const G = (e, t = 2.4, n = {}) => ({ route: e, rate: t, bounce: !0, ...n });

// --- shipping ---
const su = {
    id: `testing`,
    title: `Testing`,
    summary: `Knowing a change is safe before your users find out — fast tests for the logic, a few slow ones for everything else.`,
    minutes: 12,
    level: `beginner`,
    metrics: [`feedback`, `covers`, `escaped`],
    legend: [[`req`, `test or request`], `res`, `fail`],
    goals: [
      { text: `Unit tests and test doubles`, step: 2 },
      { text: `Integration and contract tests`, step: 4 },
      { text: `End-to-end tests and the test pyramid`, step: 6 },
      { text: `Flaky tests, and testing for load and failure`, step: 8 },
    ],
    steps: [
      {
        short: `Is it safe?`,
        chapter: `setup`,
        title: `Is this change safe?`,
        body: [
          `The checkout service applies discount codes. It reads and writes the orders database, charges cards through an external payment provider, and asks the Inventory team’s service whether items are in stock.`,
          `A developer has just changed how discounts are rounded. Before shipping, the team checks it by hand: click through a few purchases on a test server, and it all looks fine.`,
        ],
        callout: {
          kind: `insight`,
          text: `Every change carries a question: what else did this break? Tests are how you answer it quickly, every time, without relying on anyone remembering what to check.`,
        },
        metrics: { feedback: `1 day`, covers: `what someone clicks`, escaped: `often` },
        scene: {
          entities: { users: Zl(), svc: $l(), db: eu(), pay: tu(), inv: nu() },
          links: { us: W.us(), sd: W.sd(), sp: W.sp(), si: W.si() },
          flows: [G([`us`, `sd`], 1.6), G([`us`, `sp`], 0.8), G([`us`, `si`], 0.8)],
        },
      },
      {
        short: `By hand`,
        chapter: `problem`,
        title: `Clicking around misses things`,
        body: [
          `Nobody tried a basket of three items at €9.99 with a 10% code. The new rounding charges €26.98 instead of €26.97 — a cent too much on thousands of orders before support notices.`,
          `Manual checks are slow, so they happen rarely, and they only cover what someone thought to try. The bug was found by users.`,
        ],
        callout: {
          kind: `warn`,
          text: `The later a bug is found, the more it costs: seconds in a test, hours in review, days in production — plus refunds and trust.`,
        },
        changes: [`− Rounding bug shipped`, `− Found by customers, not by the team`],
        metrics: { feedback: `1 day`, covers: `what someone clicks`, escaped: `often` },
        scene: {
          entities: {
            users: Zl(`shoppers · overcharged`),
            svc: $l({ tags: [{ text: `€26.98 — should be €26.97`, tone: `red`, icon: `bug` }] }),
            db: eu(),
            pay: tu(),
            inv: nu(),
          },
          links: { us: W.us({ fail: 0.25 }), sd: W.sd(), sp: W.sp(), si: W.si() },
          flows: [G([`us`, `sd`], 1.6), G([`us`, `sp`], 0.8), G([`us`, `si`], 0.8)],
        },
      },
      {
        short: `Unit tests`,
        chapter: `solution`,
        title: `Unit tests: one piece, in isolation`,
        body: [
          `A <span class="term">unit test</span> calls one function with known inputs and checks the output — here, the total for a given basket and code. It runs in milliseconds, with no database and no network.`,
          `Because they’re so cheap, you write thousands, and they run on every change. The rounding case becomes one line that fails the moment someone breaks it again.`,
        ],
        callout: {
          kind: `tip`,
          text: `Write the test for a bug before you fix it: watch it fail, fix the code, watch it pass. That bug can never quietly come back.`,
        },
        changes: [`+ Unit tests call Checkout directly`, `− Real database, provider and Inventory`],
        metrics: { feedback: `30 s`, covers: `logic only`, escaped: `fewer` },
        scene: {
          entities: {
            tests: Ql({ tags: [{ text: `2,000 tests · 30 s`, tone: `green`, icon: `check` }] }),
            svc: $l(),
            card: ou(
              `A unit test`,
              [
                `basket = [{ price: 9.99, qty: 3 }]`,
                `total(basket, "SAVE10")`,
                `= expect 26.97  ✓`,
                `# no database, no network, ~1 ms`,
              ],
              `flask`,
            ),
          },
          links: { ts: W.ts() },
          flows: [G([`ts`], 3.4)],
        },
      },
      {
        short: `Test doubles`,
        chapter: `technique`,
        title: `Test doubles stand in for the rest`,
        body: [
          `Checkout can’t run without its dependencies, so tests swap them for <span class="term">test doubles</span>: a <b>fake</b> database that lives in memory, a <b>stub</b> provider that always answers “approved”, a <b>mock</b> that records whether a card was charged exactly once.`,
          `The catch: a double only knows what you told it. If the real provider renames a field, every unit test still passes.`,
        ],
        callout: {
          kind: `warn`,
          text: `Doubles make tests fast and repeatable, and they can quietly drift from reality. Something has to test against the real thing too.`,
        },
        changes: [`+ Fake database, stub provider, stub Inventory`],
        metrics: { feedback: `30 s`, covers: `logic only`, escaped: `fewer` },
        scene: {
          entities: {
            tests: Ql({ tags: [{ text: `2,000 tests · 30 s`, tone: `green`, icon: `check` }] }),
            svc: $l(),
            fdb: ru(),
            fpay: iu(),
            finv: au(),
          },
          links: {
            ts: W.ts(),
            sd: W.sd(`fdb`, { style: `dashed` }),
            sp: W.sp(`fpay`, { style: `dashed` }),
            si: W.si(`finv`, { style: `dashed` }),
          },
          flows: [G([`ts`, `sd`], 1.4), G([`ts`, `sp`], 1), G([`ts`, `si`], 1)],
        },
      },
      {
        short: `Integration`,
        chapter: `solution`,
        title: `Integration tests: the real neighbours`,
        body: [
          `An <span class="term">integration test</span> runs Checkout against a real database — started fresh in a container for the test run — and checks what actually lands in the tables. SQL typos, broken migrations and mismatched types show up here, not in production.`,
          `The payment provider stays stubbed (you can’t charge real cards), but you can call its sandbox in a separate, smaller suite.`,
        ],
        callout: {
          kind: `tip`,
          text: `Containers made this cheap: a throwaway PostgreSQL or Kafka takes seconds to start, so integration tests can run on every change too.`,
        },
        changes: [
          `~ Fake database → real database in a container`,
          `~ Tests take seconds, not milliseconds`,
        ],
        metrics: { feedback: `4 min`, covers: `+ database queries`, escaped: `fewer` },
        scene: {
          entities: {
            tests: Ql({ tags: [{ text: `200 tests · 4 min`, tone: `green`, icon: `check` }] }),
            svc: $l(),
            db: eu({ label: `orders db · real, in a container` }),
            fpay: iu(`provider sandbox`),
            finv: au(),
          },
          links: {
            ts: W.ts(),
            sd: W.sd(),
            sp: W.sp(`fpay`, { style: `dashed` }),
            si: W.si(`finv`, { style: `dashed` }),
          },
          flows: [
            G([`ts`, `sd`], 1.6, { kind: `heavy` }),
            G([`ts`, `sp`], 0.6),
            G([`ts`, `si`], 0.6),
          ],
        },
      },
      {
        short: `Contracts`,
        chapter: `technique`,
        title: `Contract tests: between teams`,
        body: [
          `Checkout depends on Inventory, which another team owns and deploys on its own schedule. If they rename <code>in_stock</code> to <code>available</code>, Checkout’s stub never notices.`,
          `A <span class="term">contract test</span> writes down what Checkout expects — this request, a response with these fields — and Inventory’s own pipeline checks every change against it. A breaking change fails in <em>their</em> build, before it ships.`,
        ],
        callout: {
          kind: `tip`,
          text: `Tools like Pact record these consumer expectations. Contracts replace most of the slow end-to-end tests that would otherwise be needed between services.`,
        },
        changes: [
          `+ Checkout’s expectations recorded as a contract`,
          `+ Inventory verifies it on every change`,
        ],
        metrics: { feedback: `4 min`, covers: `+ API contracts`, escaped: `rare` },
        scene: {
          entities: {
            tests: Ql({ tags: [{ text: `200 tests · 4 min`, tone: `green`, icon: `check` }] }),
            svc: $l(),
            db: eu({ label: `orders db · real, in a container` }),
            inv: nu({ tags: [{ text: `verifies the contract`, tone: `green`, icon: `fileKey` }] }),
            card: ou(
              `The contract`,
              [
                `GET /stock/sku-42`,
                `= 200 { "sku": "sku-42", "in_stock": 3 }`,
                `! rename in_stock → Inventory’s build fails`,
                `# checked on both sides, run separately`,
              ],
              `fileKey`,
            ),
          },
          links: {
            ts: W.ts(),
            sd: W.sd(),
            si: W.si(`inv`, { style: `dashed`, label: `contract` }),
          },
          flows: [G([`ts`, `sd`], 1.4, { kind: `heavy` }), G([`si`], 0.6)],
        },
      },
      {
        short: `End-to-end`,
        chapter: `solution`,
        title: `End-to-end tests: the whole journey`,
        body: [
          `An <span class="term">end-to-end test</span> drives the real system the way a user would: open the shop in a browser, add three items, enter a code, pay with a sandbox card, see the confirmation.`,
          `It is the only test that proves everything works together — and the slowest, most fragile one. A dozen of them for the journeys that make money is plenty.`,
        ],
        callout: {
          kind: `warn`,
          text: `An end-to-end test tells you something broke, not what. When one fails, the cheaper tests below it should point to the cause.`,
        },
        changes: [`+ A browser test drives the whole system`, `~ Minutes per run`],
        metrics: { feedback: `15 min`, covers: `whole system`, escaped: `rare` },
        scene: {
          entities: {
            users: Zl(`a test browser`),
            tests: Ql({ tags: [{ text: `20 journeys · 15 min`, tone: `green`, icon: `check` }] }),
            svc: $l(),
            db: eu(),
            pay: tu({ sub: `sandbox` }),
            inv: nu(),
          },
          links: {
            tu: h(`tests`, `users`, [`tests`, [`tests`, `users`], `users`], { style: `dashed` }),
            us: W.us(),
            sd: W.sd(),
            sp: W.sp(),
            si: W.si(),
          },
          flows: [
            { route: [`tu`], rate: 0.5 },
            G([`us`, `sd`], 0.9, { kind: `heavy` }),
            G([`us`, `sp`], 0.5),
            G([`us`, `si`], 0.5),
          ],
        },
      },
      {
        short: `Pyramid`,
        chapter: `insight`,
        title: `The test pyramid`,
        body: [
          `Put together, the suites form a <span class="term">test pyramid</span>: thousands of unit tests at the bottom, hundreds of integration and contract tests in the middle, a handful of end-to-end tests on top.`,
          `Lower layers are fast, precise and cheap to run on every change; higher ones are slow but closer to what users do. Push each check as low as it can go.`,
        ],
        callout: {
          kind: `insight`,
          text: `An upside-down pyramid — mostly end-to-end tests — is a common trap: an hour per run, frequent random failures, and a team that stops trusting red builds.`,
        },
        metrics: { feedback: `30 s → 15 min`, covers: `whole system`, escaped: `rare` },
        scene: {
          entities: {
            tests: Ql(),
            svc: $l(),
            db: eu(),
            pay: tu({ sub: `sandbox` }),
            inv: nu(),
            card: ou(
              `Three layers`,
              [
                `end-to-end      20    15 min   whole journeys`,
                `integration    200     4 min   real neighbours`,
                `= unit         2,000    30 s    one piece at a time`,
                `# fast and many at the bottom, few at the top`,
              ],
              `layers`,
            ),
          },
          links: { ts: W.ts(), sd: W.sd(), sp: W.sp(), si: W.si() },
          flows: [G([`ts`], 3), G([`ts`, `sd`], 0.9), G([`ts`, `si`], 0.5)],
        },
      },
      {
        short: `Flaky`,
        chapter: `problem`,
        title: `Case: the flaky test`,
        body: [
          `One end-to-end test fails about one run in twenty. It waits a fixed two seconds for the confirmation email, and sometimes the email takes three. People learn to press “re-run” — and when a real bug turns that test red, they re-run that too.`,
          `A <span class="term">flaky test</span> is worse than no test: it trains the team to ignore failures.`,
        ],
        callout: {
          kind: `tip`,
          text: `Fix the cause: wait for a condition instead of a fixed time, control the clock, give each test its own data, never depend on test order. Track flaky tests and fix or delete them — don’t hide them behind automatic retries.`,
        },
        changes: [`− Fails 1 run in 20 for no reason`, `− Real failures get re-run and ignored`],
        metrics: { feedback: `15 min`, covers: `whole system`, escaped: `often` },
        scene: {
          entities: {
            users: Zl(`a test browser`),
            tests: Ql({
              tags: [{ text: `wait 2 s for the email`, tone: `red`, icon: `hourglass` }],
            }),
            svc: $l(),
            db: eu(),
            pay: tu({ sub: `sandbox` }),
            inv: nu(),
          },
          links: {
            tu: h(`tests`, `users`, [`tests`, [`tests`, `users`], `users`], {
              style: `dashed`,
              fail: 0.35,
            }),
            us: W.us(),
            sd: W.sd(),
            sp: W.sp(),
            si: W.si(),
          },
          flows: [{ route: [`tu`], rate: 0.9 }, G([`us`, `sd`], 0.8), G([`us`, `sp`], 0.4)],
        },
      },
      {
        short: `Load & failure`,
        chapter: `technique`,
        title: `Testing for load and for failure`,
        body: [
          `Correct isn’t enough. A <b>load test</b> sends production-like traffic to a copy of the system and finds the point where latency turns upward (see <em>Latency & Throughput</em>) before your users do.`,
          `<b>Failure tests</b> break things on purpose — stop a database replica, slow the payment provider down — and check that timeouts, retries and failover behave as designed (see <em>Timeouts & Retries</em>).`,
        ],
        callout: {
          kind: `tip`,
          text: `The last layer runs in production itself: release to a few users first and watch the numbers. That is the canary in the next lesson.`,
        },
        changes: [
          `+ Load test: 5× normal traffic on staging`,
          `+ Failure test: payment provider slowed to 5 s`,
        ],
        metrics: { feedback: `hours · nightly`, covers: `+ load and failure`, escaped: `rare` },
        scene: {
          entities: {
            users: Zl(`load generator · 5× traffic`),
            svc: $l({
              ...v(0.82),
              tags: [{ text: `p99 rises at 4.2×`, tone: `amber`, icon: `trendingUp` }],
            }),
            db: eu({ ...v(0.7) }),
            pay: tu({
              ...g,
              dead: 0,
              tags: [{ text: `injected: 5 s delay`, tone: `red`, icon: `hourglass` }],
            }),
            inv: nu(),
          },
          links: { us: W.us(), sd: W.sd(), sp: W.sp({ fail: 0.2 }), si: W.si() },
          flows: [G([`us`, `sd`], 4), G([`us`, `sp`], 1.2, { kind: `slow` }), G([`us`, `si`], 1.2)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>Unit tests</b> check one piece with doubles for the rest — fast enough to run thousands on every change.</li>
          <li><b>Integration tests</b> use real neighbours (a database in a container) to catch what doubles can’t.</li>
          <li><b>Contract tests</b> catch breaking API changes between teams, in the provider’s own build.</li>
          <li>A few <b>end-to-end tests</b> cover the journeys that matter: keep the pyramid the right way up.</li>
          <li>Fix <b>flaky</b> tests, and test for <b>load</b> and <b>failure</b>, not just correctness.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>CI/CD & Deployments</b> — running all of this on every change, and getting it to production safely.`,
        },
        metrics: { feedback: `30 s → 15 min`, covers: `whole system`, escaped: `rare` },
        scene: {
          entities: { tests: Ql(), svc: $l(), db: eu(), pay: tu({ sub: `sandbox` }), inv: nu() },
          links: { ts: W.ts(), sd: W.sd(), sp: W.sp(), si: W.si() },
          flows: [G([`ts`], 3), G([`ts`, `sd`], 0.9), G([`ts`, `si`], 0.5)],
        },
      },
    ],
  };

const cu = { x0: 15.5, x1: 22.5, y0: -3.5, y1: 3.5 };

const lu = (e = `users`) => p(cu, 10, e);

const uu = (e = {}) => y(-21, -9, { label: `developer`, ...e });

const du = (e = {}) =>
    d(-12, -9, { color: `slab`, glyph: `gitBranch`, label: [`Git`], sub: `main`, ...e });

const fu = (e, t, n, r = {}) => d(e, -9, { s: 3.6, h: 28, color: `green`, glyph: t, label: n, ...r });

const pu = (e = {}) => b(10, -9, { color: `store`, glyph: `package`, label: `artifacts`, ...e });

const mu = { x0: -6, x1: 6, y0: -12, y1: -6 };

const hu = (e = {}) => f(10, 0, { ...e });

const gu = (e, t, n) => S({ x: 0, y: 0, z: 0 }, e, t, { icon: n });

const _u = [
    [2, -12],
    [2, -4],
    [2, 4],
    [2, 12],
  ];

const vu = (e, t = {}) =>
    Object.fromEntries(
      e.map((e, n) => [
        `s${n}`,
        d(_u[n][0], _u[n][1], {
          s: 3.6,
          h: 30,
          color: e === `v42` ? `green` : `blue`,
          label: [e],
          ...(t[n] || {}),
        }),
      ]),
    );

const yu = (e, t = {}) =>
    Object.fromEntries(
      Array.from({ length: e }, (e, n) => [
        `l${n}`,
        h(`lb`, `s${n}`, [`lb`, [7, `lb`], [7, `s${n}`], `s${n}`], {
          heads: `both`,
          ...(t[n] || {}),
        }),
      ]),
    );

const bu = () => ({ ul: h(`users`, `lb`, [`users`, `lb`], { heads: `both` }) });

const xu = (e, t = 3.2, n = []) => ({
    routes: e
      .map((e, t) => ({ path: [`ul`, `l${t}`], weight: e, kind: n[t] }))
      .filter((e) => e.weight > 0),
    pick: `weights`,
    rate: t,
    bounce: !0,
  });

const Su = { deploys: `1 / week`, leadTime: `2 weeks`, failRate: `30%`, restore: `4 h` };

const Cu = {
    id: `cicd`,
    title: `CI/CD & Deployments`,
    summary: `Getting every change to production quickly and safely — and back out again just as quickly.`,
    minutes: 13,
    level: `intermediate`,
    metrics: [`deploys`, `leadTime`, `failRate`, `restore`],
    legend: [`req`, `res`, [`heavy`, `build / artifact`], `fail`],
    goals: [
      { text: `Continuous integration on every push`, step: 2 },
      { text: `Build once, promote one artifact`, step: 3 },
      { text: `Blue-green and canary releases`, step: 6 },
      { text: `Migrations that don’t break the old version`, step: 7 },
      { text: `Feature flags and measuring delivery`, step: 9 },
    ],
    steps: [
      {
        short: `By hand`,
        chapter: `setup`,
        title: `Shipping by hand`,
        body: [
          `Once a week, on Friday evening, a developer builds the app on their laptop, copies it to the production server over SSH and restarts it. Everyone stays late in case something breaks.`,
          `A week of everyone’s changes goes out at once — so when something does break, nobody is sure which change did it.`,
        ],
        callout: {
          kind: `insight`,
          text: `Big, rare releases feel safer and are the opposite: the more that changes at once, the harder it is to test, to find the cause, and to undo.`,
        },
        metrics: Su,
        scene: {
          entities: {
            dev: uu({ tags: [{ text: `build on my laptop`, icon: `hammer` }] }),
            srv: d(2, 0, { label: [`Production`], ...v(0.4) }),
            users: lu(),
          },
          links: {
            ds: h(`dev`, `srv`, [`dev`, [`dev`, 0], `srv`], {
              style: `dashed`,
              label: `copy over SSH`,
              labelAt: 0.3,
            }),
            us: h(`users`, `srv`, [`users`, `srv`], { heads: `both` }),
          },
          flows: [
            { route: [`ds`], kind: `heavy`, rate: 0.25 },
            { route: [`us`], rate: 2.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Friday`,
        chapter: `problem`,
        title: `“It works on my machine”`,
        body: [
          `This Friday the laptop had a newer library than the server, and the app won’t start. While the developer works out which of thirty changes to undo, the site is down.`,
          `There is no record of exactly what was running before, so even going back is guesswork. Four hours later, it’s up again.`,
        ],
        callout: {
          kind: `warn`,
          text: `Builds that depend on someone’s machine, and deploys nobody can repeat exactly, turn every release into an experiment.`,
        },
        changes: [`− New build fails to start`, `− Site down while someone guesses`],
        metrics: { ...Su, failRate: `30%`, restore: `4 h` },
        scene: {
          entities: {
            dev: uu({ tags: [{ text: `which change was it?`, tone: `red`, icon: `alert` }] }),
            srv: d(2, 0, { label: [`Production`], ...g }),
            users: lu(`users · site down`),
          },
          links: {
            ds: h(`dev`, `srv`, [`dev`, [`dev`, 0], `srv`], {
              style: `dashed`,
              label: `copy over SSH`,
              labelAt: 0.3,
            }),
            us: h(`users`, `srv`, [`users`, `srv`], { heads: `both`, fail: 1 }),
          },
          flows: [{ route: [`us`], rate: 2.6 }],
        },
      },
      {
        short: `CI`,
        chapter: `solution`,
        title: `Continuous integration`,
        body: [
          `Now every push to the shared repository starts a <span class="term">pipeline</span> on a clean machine: build the code, run the tests (see <em>Testing</em>). Nothing depends on anyone’s laptop.`,
          `The team merges small changes into <code>main</code> several times a day. A red pipeline means “stop and fix this first”, so <code>main</code> always builds and passes. That habit is <span class="term">continuous integration</span>.`,
        ],
        callout: {
          kind: `tip`,
          text: `Keep the pipeline fast — ten minutes, not an hour. A slow pipeline makes people batch their changes again.`,
        },
        changes: [
          `+ Shared repository, small changes to main`,
          `+ Every push: build + test on a clean machine`,
        ],
        metrics: { deploys: `1 / week`, leadTime: `1 week`, failRate: `15%`, restore: `4 h` },
        scene: {
          entities: {
            dev: uu(),
            repo: du(),
            pz: x(mu, `CI PIPELINE`),
            build: fu(-3, `hammer`, [`Build`], {
              tags: [{ text: `clean machine`, icon: `check` }],
            }),
            test: fu(3, `flask`, [`Test`]),
          },
          links: {
            dr: h(`dev`, `repo`, [`dev`, `repo`]),
            rb: h(`repo`, `build`, [`repo`, `build`]),
            bt: h(`build`, `test`, [`build`, `test`]),
          },
          flows: [{ route: [`dr`, `rb`, `bt`], kind: `heavy`, rate: 0.8 }],
        },
      },
      {
        short: `One artifact`,
        chapter: `technique`,
        title: `Build once, promote the same artifact`,
        body: [
          `The last stage packages the result into an <b>immutable artifact</b> — usually a container image — tagged with the commit it came from, <code>checkout:3f9c2a1</code>, and stores it in a registry.`,
          `That exact image is what gets tested, deployed to staging and then to production. Only configuration (addresses, secrets) differs between environments. What you tested is what you ship.`,
        ],
        callout: {
          kind: `tip`,
          text: `Never rebuild for production: a rebuild can pull different dependencies and produce a different program from the one you tested.`,
        },
        changes: [`+ Package stage: one image per commit`, `+ Artifact registry`],
        metrics: { deploys: `1 / week`, leadTime: `1 week`, failRate: `10%`, restore: `1 h` },
        scene: {
          entities: {
            dev: uu(),
            repo: du(),
            pz: x({ ...mu, x1: 6 }, `CI PIPELINE`),
            build: fu(-3, `hammer`, [`Build`]),
            test: fu(3, `flask`, [`Test`]),
            reg: pu({ tags: [{ text: `checkout:3f9c2a1`, icon: `gitCommit` }] }),
          },
          links: {
            dr: h(`dev`, `repo`, [`dev`, `repo`]),
            rb: h(`repo`, `build`, [`repo`, `build`]),
            bt: h(`build`, `test`, [`build`, `test`]),
            tr: h(`test`, `reg`, [`test`, `reg`]),
          },
          flows: [{ route: [`dr`, `rb`, `bt`, `tr`], kind: `heavy`, rate: 0.8 }],
        },
      },
      {
        short: `CD`,
        chapter: `solution`,
        title: `Continuous delivery`,
        body: [
          `Every image that passes is deployed to <b>staging</b> automatically — a small copy of production — where smoke tests check the main journeys. From there it can go to production at any time.`,
          `With <span class="term">continuous delivery</span>, production is one button press away. With continuous <em>deployment</em>, there is no button: every green change goes out by itself.`,
        ],
        callout: {
          kind: `insight`,
          text: `Deploying daily makes each deploy small: a few changes, easy to review, easy to blame, easy to undo.`,
        },
        changes: [
          `+ Auto-deploy to staging + smoke tests`,
          `+ One-click (or automatic) production deploy`,
        ],
        metrics: { deploys: `5 / day`, leadTime: `1 day`, failRate: `8%`, restore: `30 min` },
        scene: {
          entities: {
            repo: du(),
            pz: x({ ...mu, x1: 6 }, `CI PIPELINE`),
            build: fu(-3, `hammer`, [`Build`]),
            test: fu(3, `flask`, [`Test`]),
            reg: pu(),
            stg: d(10, 2, {
              s: 3.6,
              h: 28,
              color: `yellow`,
              glyph: `flask`,
              label: [`Staging`],
              tags: [{ text: `smoke tests ✓`, tone: `green`, icon: `check` }],
            }),
            prod: d(10, 13, { label: [`Production`], ...v(0.4) }),
          },
          links: {
            rb: h(`repo`, `build`, [`repo`, `build`]),
            bt: h(`build`, `test`, [`build`, `test`]),
            tr: h(`test`, `reg`, [`test`, `reg`]),
            rs: h(`reg`, `stg`, [`reg`, `stg`], { label: `deploy`, labelAt: 0.5 }),
            sp: h(`stg`, `prod`, [`stg`, `prod`], {
              style: `dashed`,
              label: `promote · 1 click`,
              labelAt: 0.5,
            }),
          },
          flows: [
            { route: [`rb`, `bt`, `tr`, `rs`], kind: `heavy`, rate: 0.8 },
            { route: [`sp`], kind: `heavy`, rate: 0.3 },
          ],
        },
      },
      {
        short: `Blue-green`,
        chapter: `technique`,
        title: `Blue-green: switch, don’t replace`,
        body: [
          `How does a new version reach users without downtime? With <span class="term">blue-green</span> deployment there are two identical production groups. Blue serves everyone on v41 while v42 starts on green and warms up.`,
          `Then the load balancer switches all traffic to green at once. If anything looks wrong, switching back to blue takes seconds — it is still running, untouched.`,
        ],
        callout: {
          kind: `tip`,
          text: `The cost is double capacity during a release. Rolling deploys (see <em>Load Balancing</em>) are cheaper but slower to undo.`,
        },
        changes: [
          `+ Two production groups: blue (v41) and green (v42)`,
          `~ Load balancer switches all traffic to green`,
        ],
        metrics: { deploys: `5 / day`, leadTime: `1 day`, failRate: `8%`, restore: `1 min` },
        scene: {
          entities: {
            users: lu(),
            lb: hu({ tags: [{ text: `traffic → green`, tone: `green`, icon: `split` }] }),
            ...vu([`v41`, `v41`, `v42`, `v42`], {
              0: { dim: 0.5, pills: `below`, tags: [{ text: `blue · standby`, icon: `moon` }] },
              1: { dim: 0.5 },
              3: { tags: [{ text: `green · live`, tone: `green`, icon: `check` }] },
            }),
            bz: x({ x0: -1.5, x1: 5.5, y0: -16, y1: -0.4 }, ``),
            gz: x({ x0: -1.5, x1: 5.5, y0: 0.4, y1: 16 }, ``),
          },
          links: { ...bu(), ...yu(4, { 0: { style: `off` }, 1: { style: `off` } }) },
          flows: [xu([0, 0, 1, 1])],
        },
      },
      {
        short: `Canary`,
        chapter: `technique`,
        title: `Canary: try it on a few users first`,
        body: [
          `A <span class="term">canary</span> release sends a small slice of real traffic — here 5% — to the new version, and compares its error rate and latency with the old version’s (see <em>Observability</em>).`,
          `If v42 is worse, the pipeline rolls it back automatically and only a few users ever saw it. If it holds up, the slice grows: 25%, 50%, everyone.`,
        ],
        callout: {
          kind: `insight`,
          text: `Canaries are testing in production — the only environment with real users, real data and real traffic patterns.`,
        },
        changes: [
          `~ 5% of traffic → v42`,
          `+ Automatic comparison against v41`,
          `~ Grow to 25% → 100%, or roll back`,
        ],
        metrics: { deploys: `5 / day`, leadTime: `1 day`, failRate: `4%`, restore: `1 min` },
        scene: {
          entities: {
            users: lu(),
            lb: hu({ tags: [{ text: `5% → v42`, tone: `amber`, icon: `split` }] }),
            ...vu([`v41`, `v41`, `v41`, `v42`], {
              3: { tags: [{ text: `canary · errors 0.1%`, tone: `green`, icon: `check` }] },
            }),
          },
          links: { ...bu(), ...yu(4) },
          flows: [xu([0.32, 0.32, 0.31, 0.05], 3.6)],
        },
      },
      {
        short: `Migrations`,
        chapter: `problem`,
        title: `Case: the migration that breaks the old version`,
        body: [
          `v42 renames a column: <code>name</code> becomes <code>full_name</code>. The migration runs, and v42 is happy — but during the rollout most servers are still on v41, which asks for <code>name</code> and gets an error.`,
          `Fix it with <span class="term">expand and contract</span>: add <code>full_name</code> and write both; backfill old rows; switch reads to <code>full_name</code>; only when no running version uses <code>name</code>, drop it. Every step works with both versions.`,
        ],
        callout: {
          kind: `warn`,
          text: `During any deploy, old and new code run side by side against the same database. Every schema change must work with both.`,
        },
        changes: [
          `− Column renamed in one step`,
          `− v41 servers fail mid-rollout`,
          `+ Expand → migrate → contract, over several deploys`,
        ],
        metrics: { deploys: `5 / day`, leadTime: `1 day`, failRate: `4%`, restore: `1 min` },
        scene: {
          entities: {
            users: lu(),
            lb: hu(),
            ...vu([`v41`, `v41`, `v41`, `v42`], {
              0: {
                heat: 0.6,
                pills: `below`,
                tags: [{ text: `no column “name”`, tone: `red`, icon: `alert` }],
              },
              1: { heat: 0.6 },
              2: { heat: 0.6 },
            }),
            db: b(-8, 0, {
              label: `users table`,
              tags: [{ text: `name → full_name`, tone: `amber`, icon: `database` }],
            }),
            card: gu(
              `Expand, then contract`,
              [
                `1  add full_name, write both columns`,
                `2  backfill old rows`,
                `3  read from full_name`,
                `= 4  drop name — once nothing uses it`,
                `! never rename in one step`,
              ],
              `database`,
            ),
          },
          links: {
            ...bu(),
            ...yu(4, { 0: { fail: 0.6 }, 1: { fail: 0.6 }, 2: { fail: 0.6 } }),
            ...Object.fromEntries(
              [1, 3].map((e) => [
                `d${e}`,
                h(`s${e}`, `db`, [`s${e}`, [-3, `s${e}`], [-3, `db`], `db`], { heads: `none` }),
              ]),
            ),
          },
          flows: [xu([0.3, 0.3, 0.3, 0.1], 3.6)],
        },
      },
      {
        short: `Flags`,
        chapter: `technique`,
        title: `Feature flags: deploy is not release`,
        body: [
          `The new checkout page is merged and deployed weeks before launch — switched off. A <span class="term">feature flag</span> decides, per request, who sees it: first the team, then 1% of users, then everyone.`,
          `Turning it off is a setting, not a deploy, so a problem is fixed in seconds. Deploying (moving code to servers) and releasing (showing it to users) become separate decisions.`,
        ],
        callout: {
          kind: `tip`,
          text: `Flags are debt too: remove each one once its feature is fully out, or the code fills with branches nobody dares delete.`,
        },
        changes: [`+ Flag service`, `~ New checkout: on for staff + 1% of users`],
        metrics: { deploys: `20 / day`, leadTime: `2 h`, failRate: `3%`, restore: `1 min` },
        scene: {
          entities: {
            users: lu(),
            lb: hu(),
            ...vu([`v42`, `v42`, `v42`, `v42`]),
            flags: d(-8, 0, {
              s: 3.6,
              h: 28,
              color: `yellow`,
              glyph: `toggle`,
              label: [`Flags`],
              tags: [{ text: `new_checkout: staff + 1%`, icon: `toggle` }],
            }),
          },
          links: {
            ...bu(),
            ...yu(4),
            ...Object.fromEntries(
              [0, 1, 2, 3].map((e) => [
                `f${e}`,
                h(`flags`, `s${e}`, [`flags`, [-3, `flags`], [-3, `s${e}`], `s${e}`], {
                  style: `dashed`,
                  heads: `none`,
                }),
              ]),
            ),
          },
          flows: [
            xu([0.25, 0.25, 0.25, 0.25], 3.4),
            {
              fanout: !0,
              routes: [0, 1, 2, 3].map((e) => ({ path: [`f${e}`] })),
              kind: `ping`,
              rate: 0.4,
            },
          ],
        },
      },
      {
        short: `Measure`,
        chapter: `insight`,
        title: `Measure the delivery itself`,
        body: [
          `Four numbers, known as the <span class="term">DORA metrics</span>, describe how well a team ships: how often it deploys, how long a change takes from commit to production, how many deploys cause a problem, and how quickly service is restored when one does.`,
          `Research across thousands of teams found the same thing this lesson shows: the teams that ship most often also break production least, because every change is small and every undo is fast.`,
        ],
        callout: {
          kind: `insight`,
          text: `Speed and safety are not a trade-off here. Small, frequent, reversible changes improve both.`,
        },
        metrics: { deploys: `20 / day`, leadTime: `2 h`, failRate: `3%`, restore: `1 min` },
        scene: {
          entities: {
            users: lu(),
            lb: hu(),
            ...vu([`v42`, `v42`, `v42`, `v42`]),
            card: gu(
              `Before → after`,
              [
                `deploys          1 a week   →  20 a day`,
                `commit → prod    2 weeks    →  2 hours`,
                `deploys failing  30%        →  3%`,
                `= restore        4 hours    →  1 minute`,
              ],
              `chartLine`,
            ),
          },
          links: { ...bu(), ...yu(4) },
          flows: [xu([0.25, 0.25, 0.25, 0.25], 3.4)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>CI</b>: small changes merged often; every push is built and tested on a clean machine.</li>
          <li><b>Build once</b>: one immutable artifact per commit, promoted unchanged to every environment.</li>
          <li><b>CD</b>: every green change can reach production at any time — by a click or automatically.</li>
          <li>Release carefully: <b>blue-green</b> to switch back fast, <b>canaries</b> to limit the damage, <b>flags</b> to separate deploy from release.</li>
          <li>Schema changes must work with <b>old and new code</b> at once: expand, then contract.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `That completes Shipping. Next module: <b>Whole Systems</b> — starting with how high-level and low-level design fit together.`,
        },
        metrics: { deploys: `20 / day`, leadTime: `2 h`, failRate: `3%`, restore: `1 min` },
        scene: {
          entities: { users: lu(), lb: hu(), ...vu([`v42`, `v42`, `v42`, `v42`]) },
          links: { ...bu(), ...yu(4) },
          flows: [xu([0.25, 0.25, 0.25, 0.25], 3.4)],
        },
      },
    ],
  };

const wu = { x0: -4.5, x1: 4.5, y0: -23, y1: -17 };

const Tu = (e = `customers`) => p(wu, 12, e);

const Eu = { ord: -10, cou: 0, pay: 10 };

const Du = (e = {}) =>
    d(0, -10, { color: `orange`, glyph: `signpost`, label: [`API`, `Gateway`], ...e });

const Ou = (e = {}) => d(Eu.ord, 2, { glyph: `cart`, label: [`Orders`], ...e });

const ku = (e = {}) => d(Eu.cou, 2, { color: `green`, glyph: `car`, label: [`Couriers`], ...e });

const Au = (e = {}) =>
    d(Eu.pay, 2, { color: `purple`, glyph: `creditCard`, label: [`Payments`], ...e });

const ju = (e = {}) => b(Eu.ord, 12, { label: `orders`, ...e });

const Mu = (e = {}) => b(Eu.cou, 12, { label: `locations`, ...e });

const Nu = (e = {}) => b(Eu.pay, 12, { label: `payments`, ...e });

const Pu = (e = {}) => ({
    users: Tu(),
    gw: Du(),
    ord: Ou(),
    cou: ku(),
    pay: Au(),
    odb: ju(),
    cdb: Mu(),
    pdb: Nu(),
    ...e,
  });

const Fu = (e) =>
    h(`gw`, e, e === `cou` ? [`gw`, e] : [`gw`, [`gw`, -4], [e, -4], e], { heads: `both` });

const Iu = (e = {}) => ({
    ug: h(`users`, `gw`, [`users`, `gw`], { heads: `both` }),
    go: Fu(`ord`),
    gc: Fu(`cou`),
    gp: Fu(`pay`),
    oo: h(`ord`, `odb`, [`ord`, `odb`], { heads: `both` }),
    cc: h(`cou`, `cdb`, [`cou`, `cdb`], { heads: `both` }),
    pp: h(`pay`, `pdb`, [`pay`, `pdb`], { heads: `both` }),
    ev: h(`ord`, `cou`, [`ord`, `cou`], { style: `dashed` }),
    ...e,
  });

const Lu = () => [
    { route: [`ug`], rate: 2.2, bounce: !0 },
    {
      routes: [{ path: [`go`, `oo`] }, { path: [`gc`, `cc`] }, { path: [`gp`, `pp`] }],
      rate: 2.2,
      bounce: !0,
    },
    { route: [`ev`], kind: `msg`, rate: 0.7 },
  ];

const Ru = { x0: -17.5, x1: 5.5, y0: -8.5, y1: 16.5 };

const zu = (e, t, n, r, i = {}) => d(e, t, { s: 3.6, h: 28, glyph: n, label: r, ...i });

const Bu = (e = {}) => ({
    oz: x(Ru, `ORDERS SERVICE · INSIDE`),
    gw: Du({ x: -6, y: -12 }),
    ctl: zu(-6, -3, `braces`, [`Controller`], { sub: `HTTP in` }),
    svc: zu(-6, 5, `workflow`, [`Order`, `Service`]),
    repo: zu(-14, 13, `database`, [`Repository`], { color: `yellow` }),
    payc: zu(2, 13, `creditCard`, [`Payment`, `Client`], { color: `yellow` }),
    odb: b(-14, 22, { label: `orders table` }),
    pay: d(2, 22, {
      color: `purple`,
      glyph: `creditCard`,
      label: [`Payments`],
      sub: `another service`,
      dim: 0.6,
    }),
    ...e,
  });

const Vu = (e = {}) => ({
    gc: h(`gw`, `ctl`, [`gw`, `ctl`], { heads: `both` }),
    cs: h(`ctl`, `svc`, [`ctl`, `svc`], { heads: `both` }),
    sr: h(`svc`, `repo`, [`svc`, [`svc`, 9], [`repo`, 9], `repo`], { heads: `both` }),
    sp: h(`svc`, `payc`, [`svc`, [`svc`, 9], [`payc`, 9], `payc`], { heads: `both` }),
    ro: h(`repo`, `odb`, [`repo`, `odb`], { heads: `both` }),
    pp: h(`payc`, `pay`, [`payc`, `pay`], { heads: `both` }),
    ...e,
  });

const Hu = () => [
    {
      routes: [{ path: [`gc`, `cs`, `sr`, `ro`] }, { path: [`gc`, `cs`, `sp`, `pp`] }],
      rate: 1.4,
      bounce: !0,
    },
  ];

const Uu = (e, t, n) => S({ x: 0, y: 0, z: 0 }, e, t, { icon: n });

const Wu = { zoom: `whole system`, unit: `services · stores · queues`, output: `architecture diagram` };

const Gu = { zoom: `one service`, unit: `classes · tables · states`, output: `class & schema design` };

// --- design ---
const Ku = {
    id: `hld-lld`,
    title: `HLD & LLD`,
    summary: `The same system at two zoom levels: the map of services, and the inside of one of them.`,
    minutes: 8,
    level: `beginner`,
    metrics: [`zoom`, `unit`, `output`],
    legend: [`req`, `res`, [`msg`, `event`]],
    goals: [
      { text: `What high-level design decides`, step: 1 },
      { text: `What low-level design decides`, step: 3 },
      { text: `Contracts: where the two meet`, step: 5 },
      { text: `How a design session moves between them`, step: 6 },
    ],
    steps: [
      {
        short: `Two levels`,
        chapter: `setup`,
        title: `One system, two zoom levels`,
        body: [
          `A food-delivery app. From far away it is a handful of services — Orders, Couriers, Payments — each with its own data, talking through an API gateway and a stream of events.`,
          `Up close, each of those boxes is a program of its own, with classes, tables and rules. System design works at both distances, and they have names: <span class="term">high-level design</span> (HLD) and <span class="term">low-level design</span> (LLD).`,
        ],
        callout: {
          kind: `insight`,
          text: `Neither is “more real”. They answer different questions, for different readers, and change at different speeds.`,
        },
        metrics: Wu,
        scene: { entities: Pu(), links: Iu(), flows: Lu() },
      },
      {
        short: `The map`,
        chapter: `technique`,
        title: `High-level design: the map`,
        body: [
          `HLD decides <b>what the parts are and how they connect</b>: which services exist and what each owns, how they talk (a call, or an event), where each kind of data lives, and what happens when traffic grows or a part fails.`,
          `It is the level of every lesson so far. Its output is a diagram like this one, with the reasoning written next to it.`,
        ],
        callout: {
          kind: `tip`,
          text: `A good HLD fits on one page. If a box needs a paragraph to explain, that paragraph belongs to the LLD of that box.`,
        },
        changes: [`+ The whole system is the unit of design`],
        metrics: Wu,
        scene: {
          entities: Pu({
            sz: x({ x0: -14, x1: 14, y0: -14, y1: 16 }, `HLD · THE WHOLE SYSTEM`),
            card: Uu(
              `HLD decides`,
              [
                `which services exist, what each owns`,
                `call or event between them`,
                `which store for which data`,
                `how it scales, how it fails`,
              ],
              `map`,
            ),
          }),
          links: Iu(),
          flows: Lu(),
        },
      },
      {
        short: `Trade-offs`,
        chapter: `tradeoff`,
        title: `HLD decisions are trade-offs`,
        body: [
          `Placing an order should not wait for a courier to be found, so Orders <b>publishes an event</b> and Couriers picks it up when it can (see <em>Pub/Sub & Events</em>).`,
          `Payments needs transactions, so it gets a relational database. Couriers send their location every few seconds — tens of thousands of writes a second, each overwriting the last — so that store is a fast key–value one. Each choice comes from the numbers and from what the data needs.`,
        ],
        callout: {
          kind: `insight`,
          text: `Every arrow and every store on an HLD diagram is a decision with an alternative. Be ready to say what you gave up.`,
        },
        changes: [
          `~ Orders → Couriers: an event, not a call`,
          `~ Payments: SQL · locations: key–value`,
        ],
        metrics: Wu,
        scene: {
          entities: Pu({
            pdb: Nu({ tags: [{ text: `SQL`, icon: `lock` }] }),
            cdb: Mu({ tags: [{ text: `key–value`, icon: `zap` }] }),
            card: Uu(
              `Decisions at this level`,
              [
                `Orders → Couriers   an event, not a call`,
                `payments           SQL: transactions`,
                `courier locations  key–value: 40k writes/s`,
                `# each one has an alternative you gave up`,
              ],
              `scale`,
            ),
          }),
          links: Iu({
            ev: h(`ord`, `cou`, [`ord`, `cou`], { style: `dashed`, label: `OrderPlaced event` }),
          }),
          flows: Lu(),
        },
      },
      {
        short: `Zoom in`,
        chapter: `solution`,
        title: `Low-level design: inside one box`,
        body: [
          `Now open the Orders box. LLD decides <b>how one component is built</b>: the modules or classes it is made of, the interfaces between them, its tables and indexes, its algorithms and its error handling.`,
          `Here a controller takes HTTP requests, an order service holds the rules, a repository talks to the database, and a client wraps the calls to Payments.`,
        ],
        callout: {
          kind: `tip`,
          text: `Keeping the database and other services behind small interfaces (the yellow parts) is what makes the core logic easy to test — see <em>Testing</em>.`,
        },
        changes: [
          `− The rest of the system`,
          `+ Inside Orders: controller, service, repository, payment client`,
        ],
        metrics: Gu,
        scene: { entities: Bu(), links: Vu(), flows: Hu() },
      },
      {
        short: `LLD decisions`,
        chapter: `technique`,
        title: `LLD decisions: states, schemas, edge cases`,
        body: [
          `An order moves through states, and LLD pins down which moves are allowed: it can be cancelled while <code>placed</code> or <code>paid</code>, but not once the kitchen has started.`,
          `It also settles the table (columns, types, an index on <code>(user_id, created_at)</code> for “my orders”) and the awkward cases: what if the payment call times out, or the same order arrives twice?`,
        ],
        callout: {
          kind: `insight`,
          text: `Most production bugs live at this level: a state change nobody allowed for, a missing index, a retry that charges twice.`,
        },
        changes: [
          `+ Order state machine`,
          `+ Table and index design`,
          `+ Idempotency key on POST /orders`,
        ],
        metrics: Gu,
        scene: {
          entities: Bu({
            svc: zu(-6, 5, `workflow`, [`Order`, `Service`], {
              tags: [{ text: `state machine`, icon: `flow` }],
            }),
            odb: b(-14, 22, {
              label: `orders table`,
              tags: [{ text: `index (user_id, created_at)`, icon: `listOrdered` }],
            }),
            card: Uu(
              `Order states`,
              [
                `placed → paid → cooking → on the way → delivered`,
                `= cancel: only from placed or paid`,
                `! cooking → cancelled: not allowed`,
                `# retries reuse the idempotency key`,
              ],
              `flow`,
            ),
          }),
          links: Vu(),
          flows: Hu(),
        },
      },
      {
        short: `Contracts`,
        chapter: `insight`,
        title: `Where they meet: contracts`,
        body: [
          `The two levels meet at the edges of each box. HLD fixes what a component <b>promises</b> — its API and the events it publishes. LLD decides <b>how</b> it keeps that promise.`,
          `That split is what lets teams work independently: Orders can rewrite everything inside its box, as long as <code>POST /orders</code> and <code>OrderPlaced</code> keep meaning the same thing.`,
        ],
        callout: {
          kind: `tip`,
          text: `Changing a contract is an HLD change: other teams must agree, and old and new versions must work side by side for a while (see <em>REST, RPC & GraphQL</em> on versioning).`,
        },
        changes: [`+ The contract at the edge of the service`],
        metrics: { zoom: `the seams`, unit: `APIs · events`, output: `API contract` },
        scene: {
          entities: Bu({
            card: Uu(
              `The promise`,
              [
                `POST /orders  { items, address }`,
                `  Idempotency-Key: 7f3a…`,
                `= 201 { order_id, status: "placed" }`,
                `event OrderPlaced { order_id, items }`,
              ],
              `braces`,
            ),
          }),
          links: Vu({
            gc: h(`gw`, `ctl`, [`gw`, `ctl`], {
              heads: `both`,
              label: `the contract`,
              labelTone: `green`,
            }),
          }),
          flows: Hu(),
        },
      },
      {
        short: `Top-down`,
        chapter: `tradeoff`,
        title: `Case: designing at the wrong level`,
        body: [
          `Asked to design this app in an interview, one candidate spends twenty minutes on class diagrams and never mentions that courier locations arrive 40,000 times a second. Another draws perfect boxes, but can’t say how an order avoids being charged twice.`,
          `Work <b>top-down</b>: requirements, rough numbers, the HLD — then dive into the one or two places where the hard problems are, and do <em>those</em> at the LLD level.`,
        ],
        callout: {
          kind: `tip`,
          text: `A design session usually runs: requirements → estimates → API → data model → HLD → deep dives → failure cases. The walkthroughs that follow use exactly this order.`,
        },
        changes: [`~ Back to the whole system`, `+ Deep dives: location writes, double charges`],
        metrics: {
          zoom: `both, top-down`,
          unit: `the whole, then the risky parts`,
          output: `design with deep dives`,
        },
        scene: {
          entities: Pu({
            cdb: Mu({ tags: [{ text: `deep dive`, tone: `amber`, icon: `zoomIn` }] }),
            pay: Au({ tags: [{ text: `deep dive`, tone: `amber`, icon: `zoomIn` }] }),
            card: Uu(
              `A design session`,
              [
                `1  requirements      what must it do?`,
                `2  estimates         how much of it?`,
                `3  API + data model`,
                `4  high-level design`,
                `= 5  deep dives  (LLD where it’s risky)`,
                `6  failures and trade-offs`,
              ],
              `listOrdered`,
            ),
          }),
          links: Iu({ ev: h(`ord`, `cou`, [`ord`, `cou`], { style: `dashed` }) }),
          flows: Lu(),
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<table class="compare">
          <thead><tr><th></th><th>HLD</th><th>LLD</th></tr></thead>
          <tbody>
            <tr><td>Zoom</td><td>Whole system</td><td>One component</td></tr>
            <tr><td>Parts</td><td>Services, stores, queues</td><td>Classes, tables, states</td></tr>
            <tr><td>Decides</td><td>What talks to what, where data lives</td><td>How each part works inside</td></tr>
            <tr><td>Changes</td><td>Rarely, with agreement</td><td>Often, within a team</td></tr>
          </tbody>
        </table>`,
          `This course works at the HLD level and dips into LLD where a decision depends on it. LLD — object-oriented design, design patterns — is a subject of its own.`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Design a URL Shortener</b> — the first full walkthrough, from a one-line brief to a finished design.`,
        },
        metrics: Wu,
        scene: { entities: Pu(), links: Iu(), flows: Lu() },
      },
    ],
  };

const qu = { x0: -4.5, x1: 4.5, y0: -19, y1: -13 };

const Ju = (e = `people clicking links`) => p(qu, 12, e);

const Yu = (e = [], t = {}) => d(0, -4, { label: [`API`, `Servers`], tags: e, ...t });

const Xu = (e = {}) => b(12, -4, { r: 1.9, glyph: `database`, label: `links table`, ...e });

const Zu = (e = {}) =>
    d(-12, -4, { color: `green`, glyph: `zap`, label: [`Cache`], sub: `code → URL`, ...e });

const Qu = (e = []) =>
    d(-7, 10, { s: 3.4, h: 34, color: `yellow`, glyph: `hash`, label: [`ID`, `Blocks`], tags: e });

const $u = () =>
    d(8, 10, { s: 3.4, h: 34, color: `orange`, glyph: `waves`, label: [`Click`, `Stream`] });

const ed = () => b(16, 10, { r: 1.6, glyph: `chart`, color: `store`, label: `click counts` });

const td = [-10, -4, 2];

const nd = (e = {}) =>
    Object.fromEntries(
      td.map((t, n) => [
        `k${n}`,
        b(12, t, {
          r: 1.6,
          glyph: `database`,
          label: n === 1 ? `key–value store` : ``,
          ...(n === 0 ? e : {}),
        }),
      ]),
    );

const K = {
    us: h(`users`, `app`, [`users`, `app`], { heads: `both` }),
    sd: h(`app`, `db`, [`app`, `db`], { heads: `both` }),
    sc: h(`app`, `cache`, [`app`, `cache`], { heads: `both` }),
    id: h(`app`, `ids`, [[-1.3, `app`], [-1.3, `ids`], `ids`], { heads: `both`, style: `dashed` }),
    ev: h(`app`, `stream`, [[1.3, `app`], [1.3, `stream`], `stream`]),
    ag: h(`stream`, `counts`, [`stream`, `counts`]),
  };

const rd = () =>
    Object.fromEntries(
      td.map((e, t) => [
        `k${t}l`,
        h(`app`, `k${t}`, t === 1 ? [`app`, `k1`] : [`app`, [7, `app`], [7, e], `k${t}`], {
          heads: `both`,
        }),
      ]),
    );

const id = (e, t = [`sd`], n = 4) => [
    {
      routes: [
        { path: [`us`, `sc`], weight: e },
        ...t.map((n) => ({ path: [`us`, n], weight: (1 - e) / t.length, kind: `slow` })),
      ],
      pick: `weights`,
      rate: n,
      bounce: !0,
    },
  ];

const ad = [`k0l`, `k1l`, `k2l`];

const od = [
    { route: [`ev`], kind: `write`, rate: 1.6 },
    { route: [`ag`], kind: `write`, rate: 0.7 },
  ];

const sd = (e, t, n, r = {}) => S({ x: 0, y: -4, z: 0, dx: 70, dy: -215, ...r }, e, t, { icon: n });

const cd = { x: 12, y: -4, dx: -185, dy: 78 };

const ld = {
    id: `design-url-shortener`,
    title: `Design a URL Shortener`,
    summary: `A first end-to-end design: from a one-line brief to a system that serves billions of redirects.`,
    minutes: 14,
    level: `intermediate`,
    metrics: [`redirectMs`, `dbQps`, `codeKind`, `linksKept`],
    legend: [
      `req`,
      `res`,
      [`slow`, `cache miss`],
      [`write`, `write / click event`],
      [`poison`, `abuse`],
      `fail`,
    ],
    goals: [
      { text: `Turn a brief into requirements and numbers`, step: 1 },
      { text: `Generate short codes that never collide`, step: 4 },
      { text: `Design the read path: cache and redirect type`, step: 7 },
      { text: `Store billions of key → value rows`, step: 8 },
      { text: `Keep analytics and abuse off the critical path`, step: 10 },
    ],
    steps: [
      {
        short: `The brief`,
        chapter: `setup`,
        title: `The brief: a link shortener`,
        body: [
          `Time to use everything at once, top-down as in <em>HLD & LLD</em>. The task: build a service like bit.ly. Paste a long URL, get a short one back — <code>sho.rt/x7Kp2Qa</code> — and anyone who opens it is redirected to the original.`,
          `Before drawing boxes, pin down what “works” means. <b>It must</b>: create a short link, and redirect. <b>It should</b>: expire links and count clicks. And the qualities that matter: redirects have to be fast and almost never fail — a dead shortener breaks every link ever shared — while creating a link may take a moment longer.`,
        ],
        callout: {
          kind: `insight`,
          text: `Every design starts with the same three questions: what must it do, how much of it, and what matters most when you can’t have everything?`,
        },
        metrics: { redirectMs: null, dbQps: `—`, codeKind: `—`, linksKept: `—` },
        scene: {
          entities: {
            users: Ju(),
            app: Yu([], { label: [`sho.rt`], sub: `to be designed`, glyph: `share` }),
            card: sd(
              `Requirements`,
              [
                `create     long URL → short code`,
                `open       short code → redirect`,
                `= redirects: fast, always up`,
                `# creating a link may be slower`,
              ],
              `clipboard`,
            ),
          },
          links: { us: K.us },
          flows: [{ route: [`us`], rate: 2, bounce: !0 }],
        },
      },
      {
        short: `Numbers`,
        chapter: `setup`,
        title: `Put numbers on it`,
        body: [
          `Napkin math first (Module 01). Say <b>100 million</b> new links a month — about 40 writes a second. Each link is opened roughly 100 times, so redirects average 4,000 a second and peak near <b>12,000</b>.`,
          `Kept for five years, that’s 6 billion links. At about 500 bytes each: <b>3 TB</b>. Two things jump out: the system is <b>read-heavy</b> — a hundred reads for every write — and the data is large but very simple.`,
        ],
        callout: {
          kind: `tip`,
          text: `The numbers choose the design. “100 reads per write” says cache. “3 TB of key → value rows” says this will have to spread across machines.`,
        },
        changes: [
          `+ 40 writes/s · 4,000 redirects/s · 12,000 at peak`,
          `+ 6 billion links ≈ 3 TB over 5 years`,
        ],
        metrics: { redirectMs: null, dbQps: `—`, codeKind: `—`, linksKept: `6 billion · 3 TB` },
        scene: {
          entities: {
            users: Ju(),
            app: Yu([], { label: [`sho.rt`], sub: `to be designed`, glyph: `share` }),
            card: sd(
              `Napkin math`,
              [
                `100 M links / month    ≈ 40 writes/s`,
                `× 100 opens each       ≈ 4,000 reads/s`,
                `evening peak × 3       ≈ 12,000 reads/s`,
                `= 5 years: 6 billion links ≈ 3 TB`,
              ],
              `sigma`,
            ),
          },
          links: { us: K.us },
          flows: [{ route: [`us`], rate: 4, bounce: !0 }],
        },
      },
      {
        short: `First draft`,
        chapter: `solution`,
        title: `The simplest thing that works`,
        body: [
          `Two endpoints. <code>POST /links</code> stores a URL and returns a code; <code>GET /x7Kp2Qa</code> looks the code up and answers with a redirect.`,
          `One table does it: <code>code</code> (the primary key), <code>long_url</code>, <code>created_at</code>, <code>expires_at</code>. Stateless API servers behind a load balancer, plus one database, make a perfectly good version one.`,
        ],
        callout: {
          kind: `insight`,
          text: `Start with the simplest design that meets the brief, then ask what breaks first. Two questions are still open: where do the codes come from, and what happens at 12,000 reads a second?`,
        },
        changes: [`+ Stateless API servers`, `+ Links table, keyed by code`],
        metrics: { redirectMs: 25, dbQps: 4e3, codeKind: `?`, linksKept: `6 billion · 3 TB` },
        scene: {
          entities: {
            users: Ju(),
            app: Yu(),
            db: Xu(),
            card: sd(
              `The API`,
              [
                `POST /links  { url }   →  { code }`,
                `GET  /x7Kp2Qa          →  302 + Location`,
                `# table: code PK · long_url · expires_at`,
              ],
              `braces`,
            ),
          },
          links: { us: K.us, sd: K.sd },
          flows: [
            { route: [`us`, `sd`], rate: 4, bounce: !0 },
            { route: [`us`, `sd`], kind: `write`, rate: 0.4 },
          ],
        },
      },
      {
        short: `Hash it?`,
        chapter: `problem`,
        title: `Where do codes come from? Try a hash`,
        body: [
          `First idea: hash the long URL and keep the first seven characters. No coordination needed, and the same URL always gives the same code.`,
          `But seven characters can’t hold a whole hash, so different URLs will sometimes <b>collide</b> — and with billions of links, constantly. Every insert has to check “is this code already taken by another URL?” and retry with a tweak. Worse, two users shortening the same URL get the same code, so neither can have their own expiry or statistics.`,
        ],
        callout: {
          kind: `warn`,
          text: `Truncated hashes collide far sooner than intuition says — the birthday problem. With 3.5 trillion possible codes, expect the first clash after only about two million links.`,
        },
        changes: [
          `+ Code = first 7 characters of hash(url)`,
          `− Collisions: check and retry on every insert`,
        ],
        metrics: {
          redirectMs: 25,
          dbQps: 4e3,
          codeKind: `hash · collides`,
          linksKept: `6 billion · 3 TB`,
        },
        scene: {
          entities: {
            users: Ju(),
            app: Yu([{ text: `code = hash(url)[0..7]`, icon: `hash` }]),
            db: Xu({ tags: [{ text: `code taken → retry`, tone: `red`, icon: `alert` }] }),
            card: sd(
              `Two URLs, one code`,
              [
                `hash(“…/summer-sale”)  →  x7Kp2Qa…`,
                `hash(“…/cat-video”)    →  x7Kp2Qa…`,
                `! same 7 characters → collision`,
                `# check, tweak, retry — on every write`,
              ],
              `hash`,
            ),
          },
          links: { us: K.us, sd: { ...K.sd, fail: 0.25 } },
          flows: [
            { route: [`us`, `sd`], rate: 3, bounce: !0 },
            { route: [`us`, `sd`], kind: `write`, rate: 1.2 },
          ],
        },
      },
      {
        short: `Count it`,
        chapter: `solution`,
        title: `Count, then encode`,
        body: [
          `Better: give every link a unique <b>number</b> and write that number in <span class="term">base 62</span> — digits, lowercase and uppercase letters. A unique number in means a unique code out, with nothing to check.`,
          `Seven base-62 characters cover 62⁷ ≈ 3.5 trillion links, hundreds of times more than we need. The numbers come straight from <em>Unique IDs at Scale</em>: each API server reserves a block of a million ids from a small counter service, then counts through it locally.`,
        ],
        callout: {
          kind: `tip`,
          text: `Encoding is repeated division: 125 ÷ 62 = 2 remainder 1, so 125 becomes “21”. Decoding reverses it — the code <em>is</em> the id.`,
        },
        changes: [
          `+ Counter service handing out blocks of ids`,
          `~ Code = the id written in base 62`,
          `− No more collision checks`,
        ],
        metrics: {
          redirectMs: 25,
          dbQps: 4e3,
          codeKind: `counter · unique`,
          linksKept: `6 billion · 3 TB`,
        },
        scene: {
          entities: {
            users: Ju(),
            app: Yu([{ text: `block 7,000,000 – 7,999,999`, tone: `green`, icon: `layers` }]),
            db: Xu(),
            ids: Qu(),
            card: sd(
              `Base 62`,
              [
                `alphabet   0–9  a–z  A–Z`,
                `125        →  21`,
                `7,000,000  →  tn1e`,
                `= 62⁷ ≈ 3.5 trillion codes`,
              ],
              `hash`,
              cd,
            ),
          },
          links: { us: K.us, sd: K.sd, id: K.id },
          flows: [
            { route: [`us`, `sd`], rate: 3, bounce: !0 },
            { route: [`us`, `sd`], kind: `write`, rate: 1 },
            { route: [`id`], rate: 0.25, bounce: !0 },
          ],
        },
      },
      {
        short: `Guessable`,
        chapter: `problem`,
        title: `Case: codes you can count`,
        body: [
          `Counter codes come out in order: <code>tn1e</code>, <code>tn1f</code>, <code>tn1g</code>. Anyone can walk the whole space and harvest every link ever made — including the “private” document links and password-reset URLs people shortened.`,
          `The fix keeps the uniqueness and loses the order. Either scramble each id with a reversible shuffle (a keyed permutation) before encoding it, or pick seven random characters and let the table’s unique key reject the rare duplicate.`,
        ],
        callout: {
          kind: `warn`,
          text: `Unguessable codes slow scraping down. They are not security: anything truly private needs real access control (Module 07).`,
        },
        changes: [
          `− Sequential codes can be enumerated`,
          `+ Ids are scrambled before encoding`,
          `~ Codes look random and still never collide`,
        ],
        metrics: {
          redirectMs: 25,
          dbQps: 4e3,
          codeKind: `scrambled · unique`,
          linksKept: `6 billion · 3 TB`,
        },
        scene: {
          entities: {
            users: Ju(),
            spy: y(-11, -11, { label: `scraper` }),
            app: Yu([{ text: `code = base62(scramble(id))`, tone: `green`, icon: `key` }]),
            db: Xu(),
            ids: Qu(),
            card: sd(
              `Same ids, shuffled`,
              [
                `! 7,000,000 → tn1e     next is obvious`,
                `! 7,000,001 → tn1f`,
                `= 7,000,000 → x7Kp2Qa  after scrambling`,
                `= 7,000,001 → Lm03vTe`,
              ],
              `key`,
              cd,
            ),
          },
          links: {
            us: K.us,
            sd: K.sd,
            id: K.id,
            sp: h(`spy`, `app`, [`spy`, [-1.4, `spy`], [-1.4, `app`]], {
              fail: 0.9,
              label: `GET /tn1f, /tn1g …`,
              labelAt: 0.16,
            }),
          },
          flows: [
            { route: [`us`, `sd`], rate: 3, bounce: !0 },
            { route: [`sp`], kind: `poison`, rate: 1.6 },
            { route: [`id`], rate: 0.25, bounce: !0 },
          ],
        },
      },
      {
        short: `Cache`,
        chapter: `solution`,
        title: `Reads dominate: cache them`,
        body: [
          `Now the read path. A small share of links gets most of the clicks — today’s viral post, not last year’s — and a link never changes once it’s created. That is the ideal case for a cache (see <em>Caching</em>).`,
          `Put an in-memory cache in front, mapping <code>code → long_url</code>. About 90% of redirects stop there within a millisecond; the database only sees the misses. Since links are immutable there is almost nothing to invalidate: a TTL and LRU eviction are enough.`,
        ],
        callout: {
          kind: `tip`,
          text: `Don’t forget negative caching. Bots request random codes all day; cache “no such code” too, or every one of them becomes a database lookup.`,
        },
        changes: [
          `+ Cache: code → long URL`,
          `~ 90% of redirects never reach the database`,
          `~ Redirect 25 ms → 5 ms`,
        ],
        metrics: {
          redirectMs: 5,
          dbQps: 400,
          codeKind: `scrambled · unique`,
          linksKept: `6 billion · 3 TB`,
        },
        scene: {
          entities: {
            users: Ju(),
            app: Yu(),
            db: Xu(),
            ids: Qu(),
            cache: Zu({ tags: [{ text: `90% hits`, tone: `green`, icon: `zap` }] }),
          },
          links: { us: K.us, sd: K.sd, id: K.id, sc: K.sc },
          flows: id(0.9),
        },
      },
      {
        short: `301 or 302`,
        chapter: `tradeoff`,
        title: `Which redirect: 301 or 302?`,
        body: [
          `<code>301 Moved Permanently</code> lets the browser remember the answer, so the next click never reaches you. It’s the cheapest request there is — and it means you can no longer count that click, change the destination, or expire the link for that user.`,
          `<code>302 Found</code> is temporary: every click comes back to you. More load, but you keep control and analytics. Most shorteners choose 302 and let the cache absorb the cost.`,
        ],
        callout: {
          kind: `insight`,
          text: `A whole design decision hiding in a status code: who gets to cache the answer, and for how long?`,
        },
        changes: [`~ Decision: answer with 302 — keep analytics and control`],
        metrics: {
          redirectMs: 5,
          dbQps: 400,
          codeKind: `scrambled · unique`,
          linksKept: `6 billion · 3 TB`,
        },
        scene: {
          entities: {
            users: Ju(),
            app: Yu([{ text: `302 Found`, tone: `green`, icon: `signpost` }]),
            db: Xu(),
            ids: Qu(),
            cache: Zu(),
            card: sd(
              `Two kinds of redirect`,
              [
                `301 permanent  browser remembers it`,
                `= least load`,
                `! no click counts, edits or expiry`,
                `302 temporary  every click comes back`,
                `= analytics and control · more load`,
              ],
              `signpost`,
              cd,
            ),
          },
          links: { us: K.us, sd: K.sd, id: K.id, sc: K.sc },
          flows: id(0.9),
        },
      },
      {
        short: `Storage`,
        chapter: `solution`,
        title: `Three terabytes of keys: spread them out`,
        body: [
          `Six billion rows won’t stay comfortable on one machine. But look at how the data is used: every query is “get this one code”. No joins, no range scans, no multi-row transactions.`,
          `That is exactly what a <b>key–value store</b> is for — DynamoDB, Cassandra (see <em>SQL vs NoSQL</em>). Partition by a hash of the code so load spreads evenly (<em>Sharding</em>, <em>Consistent Hashing</em>), and keep three copies of every partition in different zones (<em>Replication</em>).`,
        ],
        callout: {
          kind: `tip`,
          text: `Because the codes look random, hashing them balances almost perfectly — no hot partition. Partitioning by creation date would have sent nearly all traffic to “today”.`,
        },
        changes: [
          `~ One database → key–value store (3 partitions shown)`,
          `+ 3 replicas of each partition, across zones`,
          `~ Every redirect touches exactly one partition`,
        ],
        metrics: {
          redirectMs: 5,
          dbQps: 400,
          codeKind: `scrambled · unique`,
          linksKept: `3 TB · partitioned ×3 copies`,
        },
        scene: {
          entities: {
            users: Ju(),
            app: Yu(),
            ids: Qu(),
            cache: Zu(),
            ...nd({ tags: [{ text: `partition = hash(code)`, icon: `split` }] }),
          },
          links: { us: K.us, id: K.id, sc: K.sc, ...rd() },
          flows: id(0.9, ad),
        },
      },
      {
        short: `Clicks`,
        chapter: `technique`,
        title: `Counting clicks without slowing them`,
        body: [
          `Product wants click counts per link. The naive way — <code>UPDATE links SET clicks = clicks + 1</code> on every redirect — turns 4,000 cheap reads a second into 4,000 writes, all landing on the hottest rows.`,
          `Instead, the API server drops a tiny <code>click</code> event onto a stream and answers the redirect straight away. A consumer adds the events up into per-link counts every few seconds (see <em>Message Queues</em> and <em>Batch & Stream Processing</em>).`,
        ],
        callout: {
          kind: `insight`,
          text: `The redirect is the product; the count is a by-product. Never put the by-product on the critical path.`,
        },
        changes: [
          `+ Click events → stream`,
          `+ A stream job aggregates the counts`,
          `~ Redirect path unchanged: still about 5 ms`,
        ],
        metrics: {
          redirectMs: 5,
          dbQps: 400,
          codeKind: `scrambled · unique`,
          linksKept: `3 TB · partitioned ×3 copies`,
        },
        scene: {
          entities: {
            users: Ju(),
            app: Yu(),
            ids: Qu(),
            cache: Zu(),
            ...nd(),
            stream: $u(),
            counts: ed(),
          },
          links: { us: K.us, id: K.id, sc: K.sc, ...rd(), ev: K.ev, ag: K.ag },
          flows: [...id(0.9, ad), ...od],
        },
      },
      {
        short: `Abuse`,
        chapter: `problem`,
        title: `Case: spammers love shorteners`,
        body: [
          `A short link hides where it goes — ideal for phishing. A script starts creating 5,000 links a minute that point at fake bank pages. Soon your whole domain is on blocklists, and <em>every</em> customer’s links stop working.`,
          `Defend in layers. <b>Rate-limit</b> link creation per account and per IP (<em>Rate Limiting</em>). Check every destination against phishing and malware lists, when it’s created and again later. And let links <b>expire</b>, so abandoned ones stop being a liability.`,
        ],
        callout: {
          kind: `warn`,
          text: `Operations are part of the design. For most link shorteners the first serious incident isn’t load — it’s abuse.`,
        },
        changes: [
          `+ Rate limit on POST /links`,
          `+ Destination safety check`,
          `+ Links expire (TTL)`,
        ],
        metrics: {
          redirectMs: 5,
          dbQps: 400,
          codeKind: `scrambled · unique`,
          linksKept: `3 TB · partitioned ×3 copies`,
        },
        scene: {
          entities: {
            users: Ju(),
            spy: y(-11, -11, { label: `spam script` }),
            app: Yu([{ text: `rate limit · destination check`, tone: `green`, icon: `shield` }]),
            ids: Qu(),
            cache: Zu(),
            ...nd(),
            stream: $u(),
            counts: ed(),
          },
          links: {
            us: K.us,
            id: K.id,
            sc: K.sc,
            ...rd(),
            ev: K.ev,
            ag: K.ag,
            sp: h(`spy`, `app`, [`spy`, [-1.4, `spy`], [-1.4, `app`]], {
              fail: 0.95,
              label: `POST /links × 5,000`,
              labelTone: `red`,
              labelAt: 0.16,
            }),
          },
          flows: [...id(0.9, ad), ...od, { route: [`sp`], kind: `poison`, rate: 2.2 }],
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
            <tr><td>Codes</td><td>Scrambled counter, base 62</td><td>Unique with no checks</td></tr>
            <tr><td>Read path</td><td>Cache + 302</td><td>100 reads per write</td></tr>
            <tr><td>Storage</td><td>Key–value, hash-partitioned</td><td>One-key lookups, 3 TB</td></tr>
            <tr><td>Clicks</td><td>Events on a stream</td><td>Off the critical path</td></tr>
            <tr><td>Abuse</td><td>Limits, checks, expiry</td><td>Protect the domain</td></tr>
          </tbody>
        </table>`,
          `Notice the method more than the answer: requirements → numbers → simplest design → find the bottleneck → fix it → repeat.`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Design a News Feed</b> — where the hard part isn’t storing posts, but deciding <em>when</em> to do the work.`,
        },
        metrics: {
          redirectMs: 5,
          dbQps: 400,
          codeKind: `scrambled · unique`,
          linksKept: `3 TB · partitioned ×3 copies`,
        },
        scene: {
          entities: {
            users: Ju(),
            app: Yu(),
            ids: Qu(),
            cache: Zu(),
            ...nd(),
            stream: $u(),
            counts: ed(),
          },
          links: { us: K.us, id: K.id, sc: K.sc, ...rd(), ev: K.ev, ag: K.ag },
          flows: [...id(0.9, ad), ...od],
        },
      },
    ],
  };

const ud = { x0: -4.5, x1: 4.5, y0: -19, y1: -13 };

const dd = (e = `people opening their feed`) => p(ud, 12, e);

const fd = (e = [], t = {}) => d(0, -4, { label: [`Feed`, `API`], tags: e, ...t });

const pd = (e = `Ana posts`) => y(-16, -12, { form: `phone`, label: e });

const md = (e = [], t = {}) =>
    d(-12, -4, {
      color: `green`,
      glyph: `zap`,
      label: [`Feed`, `Cache`],
      sub: `per-user lists`,
      tags: e,
      ...t,
    });

const hd = (e = [], t = {}) =>
    d(0, 9, { s: 3.4, h: 34, color: `orange`, glyph: `inbox`, label: [`Queue`], tags: e, ...t });

const gd = (e = [], t = {}) =>
    d(-12, 9, {
      s: 3.6,
      h: 38,
      color: `purple`,
      glyph: `workflow`,
      label: [`Fan-out`, `Workers`],
      tags: e,
      ...t,
    });

const _d = () => b(-12, 19, { r: 1.6, glyph: `network`, color: `store`, label: `who follows whom` });

const vd = [-10, -4, 2];

const yd = (e = {}) =>
    Object.fromEntries(
      vd.map((t, n) => [
        `k${n}`,
        b(12, t, { r: 1.6, glyph: `database`, label: n === 1 ? `posts, by author` : ``, ...e }),
      ]),
    );

const bd = {
    us: h(`readers`, `api`, [`readers`, `api`], { heads: `both` }),
    au: h(`author`, `api`, [`author`, [-1.4, `author`], [-1.4, `api`]]),
    fc: (e = {}) => h(`api`, `feeds`, [`api`, `feeds`], { heads: `both`, ...e }),
    q: h(`api`, `jobs`, [`api`, `jobs`]),
    qw: h(`jobs`, `workers`, [`jobs`, `workers`]),
    wf: (e = {}) => h(`workers`, `feeds`, [`workers`, `feeds`], e),
    wg: h(`workers`, `graph`, [`workers`, `graph`], { heads: `both` }),
  };

const xd = (e = {}) =>
    Object.fromEntries(
      vd.map((t, n) => [
        `k${n}l`,
        h(`api`, `k${n}`, n === 1 ? [`api`, `k1`] : [`api`, [7, `api`], [7, t], `k${n}`], {
          heads: `both`,
          ...(n === 1 ? e : {}),
        }),
      ]),
    );

const Sd = {
    fanout: !0,
    routes: [{ path: [`k0l`] }, { path: [`k1l`] }, { path: [`k2l`] }],
    kind: `slow`,
    bounce: !0,
  };

const Cd = (e = 3.4) => ({ route: [`us`, `fc`], rate: e, bounce: !0 });

const wd = (e = 1.6) => ({
    routes: [{ path: [`k0l`] }, { path: [`k1l`] }, { path: [`k2l`] }],
    rate: e,
    bounce: !0,
  });

const Td = (e = 0.6) => [
    { route: [`au`], kind: `write`, rate: e },
    { route: [`k1l`], kind: `write`, rate: e },
    { route: [`q`, `qw`], kind: `msg`, rate: e },
    { route: [`wg`], rate: e * 0.8, bounce: !0 },
  ];

const Ed = (e = 3) => ({ route: [`wf`], kind: `write`, rate: e });

const Dd = (e = {}) => ({
    readers: dd(),
    author: pd(),
    api: fd(),
    feeds: md(),
    jobs: hd(),
    workers: gd(),
    graph: _d(),
    ...yd(),
    ...e,
  });

const Od = (e = {}) => ({
    us: bd.us,
    au: bd.au,
    fc: bd.fc(),
    q: bd.q,
    qw: bd.qw,
    wf: bd.wf(),
    wg: bd.wg,
    ...xd(),
    ...e,
  });

const kd = () => [Cd(), wd(), ...Td(), Ed()];

const Ad = { x: 0, y: -4, dx: 70, dy: -215 };

const jd = { x: 12, y: -4, dx: -185, dy: 84 };

const Md = (e, t, n, r = jd) => S({ z: 0, ...r }, e, t, { icon: n });

const Nd = { feedMs: 60, readWork: `1 list + a few`, fanout: `≈ 70 · active only`, postDelay: `≈ 2 s` };

const Pd = {
    id: `design-news-feed`,
    title: `Design a News Feed`,
    summary: `Posts from everyone you follow, in 200 ms — and the question of when to do the work.`,
    minutes: 14,
    level: `intermediate`,
    metrics: [`feedMs`, `readWork`, `fanout`, `postDelay`],
    legend: [
      `req`,
      `res`,
      [`slow`, `pull query`],
      [`write`, `post / feed write`],
      [`msg`, `fan-out job`],
      `fail`,
    ],
    goals: [
      { text: `Size the read and write load of a feed`, step: 1 },
      { text: `Fan-out on read vs fan-out on write`, step: 4 },
      { text: `Why celebrities break pure push — and the hybrid fix`, step: 7 },
      { text: `What to store, and for whom`, step: 8 },
      { text: `Cursors, and rebuilding derived data`, step: 10 },
    ],
    steps: [
      {
        short: `The brief`,
        chapter: `setup`,
        title: `The brief: a home feed`,
        body: [
          `Second design. A social app: people follow each other, and the home screen shows recent posts from everyone you follow, newest first.`,
          `What matters: opening the feed must feel instant — under 200 ms. A new post should reach followers within a few seconds, but not necessarily at the same instant for everyone. <b>Eventual consistency is fine</b>: nobody is harmed if a post shows up five seconds late.`,
        ],
        callout: {
          kind: `insight`,
          text: `Notice the freedom in that last requirement. Deciding what does <em>not</em> have to be immediate or exact is what makes large systems possible.`,
        },
        metrics: { feedMs: null, readWork: `—`, fanout: `—`, postDelay: `—` },
        scene: {
          entities: {
            readers: dd(),
            api: fd([], { sub: `to be designed` }),
            card: Md(
              `Requirements`,
              [
                `post        text and a photo`,
                `home feed   posts from people I follow`,
                `= feed opens in under 200 ms`,
                `# a new post may take a few seconds`,
              ],
              `clipboard`,
              Ad,
            ),
          },
          links: { us: bd.us },
          flows: [{ route: [`us`], rate: 2.4, bounce: !0 }],
        },
      },
      {
        short: `Numbers`,
        chapter: `setup`,
        title: `Put numbers on it`,
        body: [
          `<b>200 million</b> people use it daily and open the feed about ten times each: 2 billion feed loads a day, or 23,000 a second on average. They write 50 million posts a day — about 600 a second.`,
          `So feeds are read roughly <b>40 times</b> more often than posts are written. And a typical user follows 200 accounts. Remember that number.`,
        ],
        callout: {
          kind: `tip`,
          text: `Two numbers will drive everything that follows: reads outnumber writes 40 to 1, and every feed draws on 200 sources.`,
        },
        changes: [`+ 23,000 feed loads/s · 600 posts/s`, `+ Typical user follows 200 accounts`],
        metrics: { feedMs: null, readWork: `—`, fanout: `—`, postDelay: `—` },
        scene: {
          entities: {
            readers: dd(),
            api: fd([], { sub: `to be designed` }),
            card: Md(
              `Napkin math`,
              [
                `200 M users × 10 opens   ≈ 23,000 feeds/s`,
                `50 M posts a day         ≈ 600 posts/s`,
                `= about 40 feed reads per post written`,
                `# a typical user follows 200 accounts`,
              ],
              `sigma`,
              Ad,
            ),
          },
          links: { us: bd.us },
          flows: [{ route: [`us`], rate: 4, bounce: !0 }],
        },
      },
      {
        short: `Pull`,
        chapter: `solution`,
        title: `First draft: build the feed when it’s asked for`,
        body: [
          `Store posts in a table indexed by <code>(author_id, created_at)</code>, sharded by author. To build Alice’s feed: find the 200 accounts she follows, fetch the latest posts of each, merge them by time, return the top 20.`,
          `This is the <span class="term">pull</span> model, or fan-out on read. Posting is as cheap as it gets — one insert — and a new post is visible to everyone at once.`,
        ],
        callout: {
          kind: `insight`,
          text: `Nothing is precomputed, so nothing can go stale and nothing needs repairing. For a small app, this is the right design.`,
        },
        changes: [
          `+ Posts store, sharded by author`,
          `+ Feed = query 200 authors, merge, keep the top 20`,
        ],
        metrics: { feedMs: 600, readWork: 200, fanout: 0, postDelay: `instantly` },
        scene: {
          entities: {
            readers: dd(),
            api: fd([{ text: `merge 200 timelines`, icon: `merge` }]),
            ...yd(),
          },
          links: { us: bd.us, ...xd() },
          flows: [
            { route: [`us`], rate: 2.4, bounce: !0 },
            { ...Sd, rate: 1.6 },
          ],
        },
      },
      {
        short: `Wrong side`,
        chapter: `problem`,
        title: `The work lands on the wrong side`,
        body: [
          `Every feed load fans out to 200 authors spread over many shards, and has to wait for the slowest answer — the fan-out tail from <em>Latency & Throughput</em>.`,
          `Worse is the total: 23,000 feed loads a second × 200 lookups = <b>4.6 million</b> lookups a second, mostly recomputing a result identical to what the same person saw a minute ago. The expensive work sits on the path that runs 40 times more often.`,
        ],
        callout: {
          kind: `warn`,
          text: `When reads far outnumber writes, move the work to write time.`,
        },
        changes: [
          `~ 23,000 feeds/s × 200 lookups = 4.6 M lookups/s`,
          `− Post shards overloaded`,
          `~ Feed load 600 ms → 1.4 s`,
        ],
        metrics: { feedMs: 1400, readWork: 200, fanout: 0, postDelay: `instantly` },
        scene: {
          entities: {
            readers: dd(),
            api: fd([{ text: `merge 200 timelines`, icon: `merge` }]),
            ...yd({ ..._(0.97), heat: 0.8 }),
            card: Md(
              `Cost of pull`,
              [
                `23,000 feed loads / s`,
                `× 200 authors each`,
                `! = 4.6 million lookups / s`,
                `# and each load waits for the slowest shard`,
              ],
              `alert`,
              Ad,
            ),
          },
          links: { us: bd.us, ...xd({ fail: 0.2 }) },
          flows: [
            { route: [`us`], rate: 3, bounce: !0 },
            { ...Sd, rate: 3.2 },
          ],
        },
      },
      {
        short: `Push`,
        chapter: `solution`,
        title: `Flip it: deliver posts when they’re written`,
        body: [
          `Give every user a ready-made feed: a list in a cache, newest first. When Ana posts, a <b>fan-out worker</b> looks up her followers and adds the post to each of their lists. This is the <span class="term">push</span> model, or fan-out on write.`,
          `Opening the feed is now one read of one list. The fan-out runs behind a queue (<em>Message Queues</em>), so Ana’s post returns immediately and her followers see it a second or two later.`,
        ],
        callout: {
          kind: `tip`,
          text: `The arithmetic works: 600 posts/s × 200 followers ≈ 120,000 small cache writes a second — far cheaper than 4.6 million lookups.`,
        },
        changes: [
          `+ Feed cache: one list per user`,
          `+ Queue and fan-out workers`,
          `+ Follower lookup`,
          `~ Feed load: 200 lookups → 1`,
        ],
        metrics: { feedMs: 40, readWork: 1, fanout: `200 on average`, postDelay: `≈ 2 s` },
        scene: { entities: Dd(), links: Od(), flows: kd() },
      },
      {
        short: `Ids only`,
        chapter: `technique`,
        title: `Store ids, not posts`,
        body: [
          `Each feed list holds only <b>post ids</b> — a few bytes apiece — and only the newest 800 or so. When a feed is read, the API fetches the posts themselves in one batch from the post store (“hydration”).`,
          `Keeping a single copy of every post means an edit or a delete happens in one place. A deleted post is simply dropped during hydration; nobody has to chase it through millions of lists.`,
        ],
        callout: {
          kind: `tip`,
          text: `200 million lists × 800 ids × 8 bytes ≈ 1.3 TB of memory: a big cache cluster, but an ordinary one. Storing whole posts would cost a hundred times as much.`,
        },
        changes: [
          `~ Feed lists hold post ids only, capped at 800`,
          `+ Posts fetched in one batch at read time`,
          `~ Edits and deletes happen in one place`,
        ],
        metrics: {
          feedMs: 40,
          readWork: `1 list + 1 batch`,
          fanout: `200 on average`,
          postDelay: `≈ 2 s`,
        },
        scene: {
          entities: Dd({
            feeds: md([{ text: `alice → [9041, 9038, 9017 …]`, icon: `listOrdered` }]),
          }),
          links: Od({ ...xd({ label: `hydrate: 20 posts, 1 batch`, labelAt: 0.6 }) }),
          flows: kd(),
        },
      },
      {
        short: `Celebrity`,
        chapter: `problem`,
        title: `Case: fifty million followers`,
        body: [
          `A pop star with <b>50 million</b> followers posts. That single post becomes 50 million cache writes. Even at 100,000 writes a second, delivery takes more than eight minutes — and the queue is so backed up that everyone else’s posts wait behind it.`,
          `It’s the hot-key problem from <em>Sharding</em>: one unusually heavy key overwhelms a design tuned for the average.`,
        ],
        callout: {
          kind: `warn`,
          text: `Averages hide this. The typical account has 200 followers; a few thousand accounts have millions — and they post at the busiest moments.`,
        },
        changes: [
          `+ A celebrity posts to 50 M followers`,
          `− 50 M feed writes for one post`,
          `− Queue backlog delays everybody`,
        ],
        metrics: {
          feedMs: 40,
          readWork: `1 list + 1 batch`,
          fanout: `50,000,000`,
          postDelay: `8+ min`,
        },
        scene: {
          entities: Dd({
            author: pd(`pop star · 50 M followers`),
            jobs: hd([{ text: `backlog: 50 M deliveries`, tone: `red`, icon: `alert` }], {
              heat: 0.8,
            }),
            workers: gd([], { ..._(1), heat: 0.9 }),
          }),
          links: Od(),
          flows: [Cd(), wd(), ...Td(0.5), Ed(7)],
        },
      },
      {
        short: `Hybrid`,
        chapter: `solution`,
        title: `Hybrid: push for most, pull for the famous`,
        body: [
          `Treat the two kinds of account differently. Ordinary users keep fan-out on write. Accounts above a threshold — say 100,000 followers — are <b>not</b> fanned out at all.`,
          `When Alice opens her feed, the API reads her ready-made list <em>and</em> pulls the latest posts of the handful of celebrities she follows — each one a single cached timeline — then merges the two. A few extra lookups per read, instead of 50 million writes per post.`,
        ],
        callout: {
          kind: `insight`,
          text: `Neither pure strategy survives real data. Large designs usually end up as a hybrid, split along exactly the dimension that is skewed.`,
        },
        changes: [
          `~ Accounts over 100 k followers: no fan-out`,
          `+ Their posts are merged in at read time`,
          `~ Post delay back to ≈ 2 s`,
        ],
        metrics: {
          feedMs: 60,
          readWork: `1 list + a few`,
          fanout: `200 · celebrities 0`,
          postDelay: `≈ 2 s`,
        },
        scene: {
          entities: Dd({
            author: pd(`pop star · 50 M followers`),
            api: fd([{ text: `merge: my list + 3 celebrities`, tone: `green`, icon: `merge` }]),
            jobs: hd([{ text: `celebrities skipped`, icon: `check` }]),
          }),
          links: Od({ ...xd({ label: `pull celebrity timelines`, labelAt: 0.6 }) }),
          flows: [
            Cd(),
            wd(2.2),
            { route: [`au`], kind: `write`, rate: 0.6 },
            { route: [`k1l`], kind: `write`, rate: 0.6 },
            Ed(1.6),
          ],
        },
      },
      {
        short: `Idle users`,
        chapter: `tradeoff`,
        title: `Case: feeds nobody reads`,
        body: [
          `Of everyone who follows Ana, perhaps a third opened the app this month. Fanning out to the rest fills memory with lists nobody will ever look at.`,
          `So skip them: fan out only to followers active in the last 30 days, and let everyone else’s list expire. When a lapsed user comes back, build their feed once with the pull model, cache it, and resume pushing.`,
        ],
        callout: {
          kind: `tip`,
          text: `The pull path never goes away. It is how feeds are created, repaired and rebuilt — push is an optimisation layered on top of it.`,
        },
        changes: [
          `~ Fan out only to recently active followers`,
          `~ Idle feed lists expire`,
          `+ Returning users: rebuilt by pull, once`,
        ],
        metrics: Nd,
        scene: {
          entities: Dd({
            workers: gd([{ text: `active in last 30 days only`, tone: `green`, icon: `filter` }]),
            feeds: md([{ text: `idle lists expire`, icon: `clock` }]),
          }),
          links: Od(),
          flows: [Cd(), wd(), ...Td(), Ed(1.4)],
        },
      },
      {
        short: `Scrolling`,
        chapter: `technique`,
        title: `Scrolling: cursors, not page numbers`,
        body: [
          `Alice scrolls down for more. “Page 2” would mean “skip 20, take 20” — but three new posts have arrived at the top since page 1, so she’d see three posts twice.`,
          `Use a <span class="term">cursor</span> instead (see <em>REST, RPC & GraphQL</em>): “give me 20 posts older than post 9017”. The position is tied to a post, not to a count, so new arrivals can’t shift it.`,
        ],
        callout: {
          kind: `tip`,
          text: `Time-ordered ids (<em>Unique IDs at Scale</em>) make this easy: “older than” is simply “id less than”.`,
        },
        changes: [`+ GET /feed?before=9017&limit=20`],
        metrics: Nd,
        scene: {
          entities: Dd({
            card: Md(
              `Cursor pagination`,
              [
                `GET /feed?limit=20`,
                `# → posts 9041 … 9017 · next: before=9017`,
                `GET /feed?before=9017&limit=20`,
                `= stays put while new posts arrive`,
              ],
              `listOrdered`,
            ),
          }),
          links: Od(),
          flows: kd(),
        },
      },
      {
        short: `Cache lost`,
        chapter: `insight`,
        title: `Case: the feed cache is wiped`,
        body: [
          `A bad deploy flushes the feed cache. Every feed is gone — and nothing of value is lost. Posts and the follow graph are the <b>source of truth</b>; feed lists are <b>derived data</b> that can be rebuilt from them.`,
          `The danger is a stampede: millions of users rebuilding by pull at the same moment. So rebuild lazily, only when a user actually opens the app; cap how many rebuilds run at once; and serve a thinner feed until the cache is warm again.`,
        ],
        callout: {
          kind: `insight`,
          text: `Know which of your data is the truth and which is a convenience. You can afford to be relaxed about the second only because you are strict about the first.`,
        },
        changes: [
          `− Feed cache flushed`,
          `~ Feeds rebuilt on demand from posts + follows`,
          `~ Rebuilds throttled to protect the post store`,
        ],
        metrics: {
          feedMs: 350,
          readWork: `rebuild: 200`,
          fanout: `≈ 70 · active only`,
          postDelay: `≈ 2 s`,
        },
        scene: {
          entities: Dd({
            api: fd([{ text: `rebuild on open · max 500 at once`, icon: `gauge` }]),
            feeds: md([{ text: `empty · warming up`, tone: `amber`, icon: `refresh` }], {
              heat: 0.3,
            }),
          }),
          links: Od({ fc: bd.fc({ fail: 0.5 }) }),
          flows: [Cd(2.6), { ...Sd, rate: 1.4 }, ...Td(), Ed(2)],
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
            <tr><td>Build feeds</td><td>On write (push)</td><td>40 reads per post</td></tr>
            <tr><td>Celebrities</td><td>Pull, merged at read</td><td>50 M writes per post</td></tr>
            <tr><td>Feed entries</td><td>Post ids, capped</td><td>One copy of each post</td></tr>
            <tr><td>Idle users</td><td>No fan-out; rebuild</td><td>Unread feeds cost memory</td></tr>
            <tr><td>Scrolling</td><td>Cursors</td><td>New posts shift pages</td></tr>
          </tbody>
        </table>`,
          `A ranked feed adds one more stage — score the candidates before returning them — but the plumbing underneath is the same.`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Design a Chat System</b> — where every message has to arrive, in order, and show up exactly once.`,
        },
        metrics: Nd,
        scene: { entities: Dd(), links: Od(), flows: kd() },
      },
    ],
  };

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

const sys_d = (x, y, opts = {}) => ({ type: "block", x, y, color: "blue", glyph: "server", ...opts });

const sys_f = (x, y, opts = {}) => ({
    type: "block",
    x,
    y,
    color: "orange",
    glyph: "balancer",
    label: ["Load", "Balancer"],
    pills: "below",
    ...opts,
  });

const sys_b = (x, y, opts = {}) => ({ type: "db", x, y, ...opts });

const sys_y = (x, y, opts = {}) => ({ type: "device", x, y, ...opts });

const sys_h = (from, to, pts, opts = {}) => ({ from, to, pts, heads: "end", ...opts });



export {
  Xi as consistentHashingLesson,
  ua as uniqueIdsLesson,
  Oa as capLesson,
  Ua as consensusLesson,
  $a as transactionsLesson,
  mo as filesLesson,
  wo as apisLesson,
  zo as queuesLesson,
  $o as pubsubLesson,
  fs as realtimeLesson,
  js as redundancyLesson,
  Ks as rateLimitingLesson,
  tc as timeoutsRetriesLesson,
  dc as observabilityLesson,
  Uc as serviceDiscoveryLesson,
  $c as sagasLesson,
  ul as batchStreamLesson,
  xl as authenticationLesson,
  jl as authorizationLesson,
  Yl as encryptionLesson,
  su as testingLesson,
  Cu as cicdLesson,
  Ku as hldLldLesson,
  ld as designUrlShortenerLesson,
  Pd as designNewsFeedLesson,
  tf as designChatLesson,
};
