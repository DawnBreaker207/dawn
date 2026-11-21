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

export default shardingLesson;
