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

export default indexesLesson;
