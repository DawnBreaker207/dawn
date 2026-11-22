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

export default replicationLesson;
