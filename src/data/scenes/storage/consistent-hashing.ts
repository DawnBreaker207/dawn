// @ts-nocheck
import {
  DEAD_STATE,
  makeBlock,
  makeDb,
  makeLink,
  makePanel
} from '@/lib/simulator/scene-builders';

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
    return makeBlock(r, i, { s: 3.2, h: 38, color: Pi[e], glyph: '', label: [e], ...n });
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
    return i.push(Ii(r)), makeLink('ring', t, i, { label: `key @ ${e}°`, labelAt: 0.25 });
  },
  Wi = (e, t, n) => makePanel({ x: 0, y: 0, z: 0, dx: -470, dy: -250 }, e, t, { icon: n }),
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
            a: makeDb(-10.5, -4, { r: 1.6, h: 36, tags: [{ text: `A` }] }),
            b: makeDb(-3.5, -4, { r: 1.6, h: 36, tags: [{ text: `B` }] }),
            c: makeDb(3.5, -4, { r: 1.6, h: 36, tags: [{ text: `C` }] }),
            d: makeDb(10.5, -4, { r: 1.6, h: 36, tags: [{ text: `D` }] }),
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
            c: Li(`C`, Ri.C, DEAD_STATE),
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

export { Xi as consistentHashingLesson };
export default Xi;
