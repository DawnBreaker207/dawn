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
          },
          links: { r_s1_p9: la(`s1`, 9), r_s2_p9: la(`s2`, 9) },
          flows: [{ routes: [{ path: [`r_s1_p9`] }, { path: [`r_s2_p9`] }], kind: `write`, rate: 2.4 }],
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

export { ua as uniqueIdsLesson };
export default ua;
