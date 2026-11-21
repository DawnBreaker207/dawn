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

export default sqlNosqlLesson;
