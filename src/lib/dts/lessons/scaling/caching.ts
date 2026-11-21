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

const lt = { x0: -4.5, x1: 4.5, y0: -18, y1: -12 };

const ut = (e = `20,000 users`) => p(lt, 13, e);

const dt = () => d(0, -3, { label: [`App`, `Server`] });

const ft = (e = {}) => b(11, -3, { label: `database`, ...e });

const pt = (e = {}) =>
    d(-11, -3, { color: `green`, glyph: `zap`, label: [`Cache`], sub: `in memory`, ...e });

const mt = {
    us: h(`users`, `app`, [`users`, `app`], { heads: `both` }),
    sd: h(`app`, `db`, [`app`, `db`], { heads: `both` }),
    sc: h(`app`, `cache`, [`app`, `cache`], { heads: `both` }),
  };

const ht = (e, t, n) => S({ x: 11, y: -3, z: 0, dx: 30, dy: -250 }, e, t, { icon: n });

const gt = (e, t = 4) => [
    {
      routes: [
        { path: [`us`, `sc`], weight: e },
        { path: [`us`, `sd`], weight: 1 - e, kind: `slow` },
      ],
      pick: `weights`,
      rate: t,
      bounce: !0,
    },
    { route: [`sc`], kind: `write`, rate: t * (1 - e) * 0.9 },
  ];

export const cachingLesson = {
    id: `caching`,
    title: `Caching`,
    summary: `Keep the answers people ask for most somewhere much faster than the database.`,
    minutes: 14,
    level: `beginner`,
    metrics: [`p95`, `hitRate`, `dbLoad`, `fresh`],
    legend: [`req`, `res`, [`slow`, `cache miss`], [`write`, `cache fill / write`], `kill`],
    goals: [
      { text: `Why the same reads overload a database`, step: 1 },
      { text: `The cache-aside pattern`, step: 2 },
      { text: `Why hit rate matters so much`, step: 3 },
      { text: `Stale data, invalidation and eviction`, step: 6 },
      { text: `Stampedes, missing keys and cache layers`, step: 7 },
    ],
    steps: [
      {
        short: `DB melts`,
        chapter: `problem`,
        title: `Every page hits the database`,
        body: [
          `Your shop is popular. Every product page asks the database for the same kind of thing — name, price, photos — and it’s now 92% busy.`,
          `Reads queue up and pages slow to nearly half a second at p95.`,
        ],
        callout: {
          kind: `warn`,
          text: `Databases are usually the hardest part to scale, because they hold the data. Protect them from unnecessary work.`,
        },
        metrics: { p95: 450, hitRate: 0, dbLoad: 92, fresh: `fresh` },
        scene: {
          entities: { users: ut(), app: dt(), db: ft({ heat: 0.8, cpu: 0.92 }) },
          links: { us: mt.us, sd: mt.sd },
          flows: [{ route: [`us`, `sd`], rate: 4, bounce: !0 }],
        },
      },
      {
        short: `Same reads`,
        chapter: `insight`,
        title: `The same few things, over and over`,
        body: [
          `Look at what’s actually being read: a small set of popular products accounts for most traffic. The database recomputes the same answers thousands of times a minute.`,
          `Answers that are read often and change rarely are perfect to keep somewhere closer and faster.`,
        ],
        callout: {
          kind: `insight`,
          text: `Most real workloads are skewed like this — a few hot items and a long tail of rarely-read ones.`,
        },
        metrics: { p95: 450, hitRate: 0, dbLoad: 92, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(),
            app: dt(),
            db: ft({ heat: 0.8, cpu: 0.92 }),
            card: ht(
              `Who reads what`,
              [
                `top 1% of products   → 60% of reads`,
                `top 10% of products  → 90% of reads`,
                `# the same rows, read again and again`,
              ],
              `activity`,
            ),
          },
          links: { us: mt.us, sd: mt.sd },
          flows: [{ route: [`us`, `sd`], rate: 4, bounce: !0 }],
        },
      },
      {
        short: `Add cache`,
        chapter: `solution`,
        title: `Put a cache in front`,
        body: [
          `Add an in-memory <span class="term">cache</span> (such as Redis or Memcached). The server checks it first: a <b>hit</b> returns in about a millisecond.`,
          `On a <b>miss</b> (amber) the server reads the database, then saves a copy in the cache for next time. This is the <span class="term">cache-aside</span> pattern.`,
        ],
        callout: {
          kind: `tip`,
          text: `A cache lookup is one key fetched from memory: no query planning, no joins, no disk. It typically answers 10–100× faster than the query it replaces.`,
        },
        changes: [`+ Cache`, `~ 80% of reads served from memory`, `~ Database CPU 92% → 25%`],
        metrics: { p95: 40, hitRate: 80, dbLoad: 25, fresh: `fresh` },
        scene: {
          entities: { users: ut(), app: dt(), db: ft({ cpu: 0.25 }), cache: pt() },
          links: mt,
          flows: gt(0.8),
        },
      },
      {
        short: `Hit rate`,
        chapter: `technique`,
        title: `Hit rate is everything`,
        body: [
          `The share of reads answered by the cache is the <span class="term">hit rate</span>. Because misses are so much slower, small changes in hit rate matter a lot.`,
          `Going from 80% to 95% hits more than halves the average read time and cuts database load by three-quarters.`,
        ],
        callout: {
          kind: `tip`,
          text: `Raise hit rate by caching the right things, giving the cache enough memory, and keeping entries long enough to be reused.`,
        },
        changes: [`~ Hit rate 80% → 95%`, `~ Database CPU 25% → 8%`],
        metrics: { p95: 25, hitRate: 95, dbLoad: 8, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(),
            app: dt(),
            db: ft({ cpu: 0.08 }),
            cache: pt(),
            card: ht(
              `Average read time`,
              [
                `cache hit  ≈ 1 ms`,
                `database   ≈ 20 ms`,
                `80% hits:  0.8×1 + 0.2×20  = 4.8 ms`,
                `= 95% hits: 0.95×1 + 0.05×20 = 2 ms`,
              ],
              `timer`,
            ),
          },
          links: mt,
          flows: gt(0.95),
        },
      },
      {
        short: `Stale`,
        chapter: `problem`,
        title: `The price changed. The cache didn’t.`,
        body: [
          `An admin updates a price from $20 to $25. The database has the new price — but the cache still holds the old copy, and that’s what users see.`,
          `A cache is a second copy of the truth. Keeping copies in sync is the hard part of caching.`,
        ],
        callout: {
          kind: `warn`,
          text: `“There are only two hard things in computer science: cache invalidation and naming things.” — Phil Karlton`,
        },
        changes: [`~ Database: price $20 → $25`, `− Cache still says $20`],
        metrics: { p95: 25, hitRate: 95, dbLoad: 8, fresh: `stale` },
        scene: {
          entities: {
            users: ut(`users see $20`),
            app: dt(),
            db: ft({ cpu: 0.08, tags: [{ text: `price: $25`, tone: `green` }] }),
            cache: pt({ tags: [{ text: `price: $20 · stale`, tone: `red`, icon: `alert` }] }),
          },
          links: mt,
          flows: [...gt(0.95), { route: [`sd`], kind: `write`, rate: 0.5 }],
        },
      },
      {
        short: `Invalidate`,
        chapter: `solution`,
        title: `Invalidate on write, expire with a TTL`,
        body: [
          `When data changes, the server writes the database <em>and</em> deletes the cached copy (red rings). The next read misses and fetches the fresh value.`,
          `As a safety net, every entry also gets a <span class="term">TTL</span> (time to live): even if an invalidation is missed, stale data disappears within a minute.`,
          `Why delete rather than overwrite the cached copy? Two writes racing each other can leave the <em>older</em> value in the cache. Deleting is always safe: the next read reloads the truth.`,
        ],
        callout: {
          kind: `tip`,
          text: `Pick the TTL by asking: how stale is acceptable? Seconds for prices and stock, hours for a product description.`,
        },
        changes: [`+ Writes delete the cached copy`, `+ TTL: 60 s`, `~ Users see $25`],
        metrics: { p95: 26, hitRate: 94, dbLoad: 9, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`users see $25`),
            app: dt(),
            db: ft({ cpu: 0.09, tags: [{ text: `price: $25`, tone: `green` }] }),
            cache: pt({
              tags: [
                { text: `TTL 60 s`, icon: `clock` },
                { text: `price: $25`, tone: `green` },
              ],
            }),
          },
          links: mt,
          flows: [
            ...gt(0.94),
            { route: [`sd`], kind: `write`, rate: 0.6 },
            { route: [`sc`], kind: `kill`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Eviction`,
        chapter: `tradeoff`,
        title: `Memory runs out`,
        body: [
          `The cache can’t hold everything — memory is expensive. When it’s full, something has to go to make room.`,
          `The usual rule is <span class="term">LRU</span>: evict the entry that was <em>least recently used</em>. Hot items stay; the long tail cycles through.`,
          `The main alternative, <span class="term">LFU</span>, evicts the least <em>frequently</em> used entry instead — better when a burst of one-off reads would otherwise push out the real favourites.`,
        ],
        callout: {
          kind: `insight`,
          text: `A cache only needs to hold the hot set. 10% of the data can easily serve 90% of reads.`,
        },
        changes: [`+ Cache full`, `~ Least recently used entries evicted`, `~ Hit rate 94% → 92%`],
        metrics: { p95: 30, hitRate: 92, dbLoad: 12, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`users see $25`),
            app: dt(),
            db: ft({ cpu: 0.12 }),
            cache: pt({ tags: [{ text: `memory full`, tone: `amber`, icon: `alert` }] }),
            card: ht(
              `Least recently used`,
              [
                `product:42    used 1 s ago`,
                `product:7     used 4 s ago`,
                `product:913   used 2 min ago`,
                `! evict product:5 · unused 3 h`,
              ],
              `layers`,
            ),
          },
          links: mt,
          flows: gt(0.92),
        },
      },
      {
        short: `Stampede`,
        chapter: `problem`,
        title: `Case: the cache stampede`,
        body: [
          `The home page is the hottest key in the cache — 2,000 reads a second. Its TTL expires. In the next instant, every one of those requests misses and goes to the database for the same answer.`,
          `The database, used to 8% load, gets hit by a wall of identical queries and stalls. This is a <span class="term">cache stampede</span> (or thundering herd).`,
        ],
        callout: { kind: `warn`, text: `The more popular a key, the more dangerous its expiry.` },
        changes: [
          `− Hot key “home page” expires`,
          `+ 2,000 simultaneous misses`,
          `~ Database CPU 8% → 100%`,
        ],
        metrics: { p95: 1400, hitRate: 40, dbLoad: 100, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`everyone opens the home page`),
            app: dt(),
            db: ft({
              heat: 0.9,
              cpu: 1,
              tags: [{ text: `2,000 identical queries`, tone: `red`, icon: `alert` }],
            }),
            cache: pt({ tags: [{ text: `home page · expired`, tone: `amber`, icon: `clock` }] }),
          },
          links: mt,
          flows: [{ route: [`us`, `sd`], rate: 7, bounce: !0, kind: `slow` }],
        },
      },
      {
        short: `One fetch`,
        chapter: `solution`,
        title: `Let one request refill it`,
        body: [
          `Fix it with <span class="term">request coalescing</span>: the first miss takes a short lock and fetches from the database; everyone else waits a few milliseconds for that one result.`,
          `Add two more habits: refresh hot keys a little <em>before</em> they expire, and add random jitter to TTLs so many keys don’t expire at the same moment.`,
        ],
        callout: {
          kind: `tip`,
          text: `Libraries call this “single-flight”. CDNs do the same at the edge (“request collapsing”).`,
        },
        changes: [
          `+ One fetch per expired key`,
          `+ Early refresh + TTL jitter`,
          `~ Database CPU 100% → 9%`,
        ],
        metrics: { p95: 30, hitRate: 97, dbLoad: 9, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`everyone opens the home page`),
            app: dt(),
            db: ft({ cpu: 0.09 }),
            cache: pt({
              tags: [{ text: `refreshed early · 1 fetch`, tone: `green`, icon: `check` }],
            }),
          },
          links: mt,
          flows: gt(0.97, 5),
        },
      },
      {
        short: `Missing keys`,
        chapter: `problem`,
        title: `Case: asking for what isn’t there`,
        body: [
          `A crawler — or an attacker — requests product IDs that don’t exist: <code>/product/99900017</code>, <code>…18</code>, <code>…19</code>. Each one misses the cache, goes to the database, finds nothing, and so leaves <b>nothing to cache</b>.`,
          `Every such request is a guaranteed miss, however often it repeats. The cache gives no protection at all, and the database is busy searching for rows that were never there. This is <span class="term">cache penetration</span>.`,
        ],
        callout: {
          kind: `warn`,
          text: `Cache-aside only remembers answers. “No such row” is an answer too — if you forget to store it, you pay for it every time.`,
        },
        changes: [
          `+ Requests for IDs that don’t exist`,
          `~ Half of all reads now miss`,
          `~ Database CPU 9% → 85%`,
        ],
        metrics: { p95: 520, hitRate: 50, dbLoad: 85, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`real users + a crawler guessing IDs`),
            app: dt(),
            db: ft({
              heat: 0.7,
              cpu: 0.85,
              tags: [{ text: `0 rows found`, tone: `red`, icon: `search` }],
            }),
            cache: pt({ tags: [{ text: `nothing to cache`, tone: `amber`, icon: `alert` }] }),
          },
          links: mt,
          flows: [
            {
              routes: [
                { path: [`us`, `sc`], weight: 0.5 },
                { path: [`us`, `sd`], weight: 0.5, kind: `slow` },
              ],
              pick: `weights`,
              rate: 6,
              bounce: !0,
            },
          ],
        },
      },
      {
        short: `Bloom filter`,
        chapter: `solution`,
        title: `Remember the “no” as well`,
        body: [
          `First fix: <span class="term">negative caching</span>. Store “not found” in the cache too, with a short TTL, so a repeated request for the same missing ID stops at the cache.`,
          `But a crawler never repeats itself. For that, keep a <span class="term">Bloom filter</span> of every real ID in the server’s memory: a compact bit set that answers “definitely not here” or “probably here” in microseconds. Impossible IDs get a 404 without touching the cache or the database.`,
        ],
        callout: {
          kind: `tip`,
          text: `A Bloom filter never says “no” to a key that exists; it occasionally says “maybe” to one that doesn’t. A 1% false-positive rate costs only about 10 bits per key.`,
        },
        changes: [
          `+ Cache “not found” · TTL 30 s`,
          `+ Bloom filter of real IDs on the server`,
          `~ Database CPU 85% → 9%`,
        ],
        metrics: { p95: 28, hitRate: 95, dbLoad: 9, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`real users + a crawler guessing IDs`),
            app: dt(),
            db: ft({ cpu: 0.09 }),
            cache: pt({ tags: [{ text: `“not found” · TTL 30 s`, icon: `clock` }] }),
            card: ht(
              `Bloom filter · 12 M IDs in 15 MB`,
              [
                `is product:99900017 real?`,
                `= “definitely not” → 404, no lookup`,
                `“probably yes” → cache, then database`,
                `# never wrong about a “no”`,
              ],
              `search`,
            ),
          },
          links: mt,
          flows: gt(0.95, 5),
        },
      },
      {
        short: `Layers`,
        chapter: `insight`,
        title: `Caches everywhere`,
        body: [
          `The cache we built is one layer of many. A request may be answered by the <b>browser</b> cache, the <b>CDN</b>, an <b>in-process</b> cache on the server, a shared cache like Redis, or the database’s own memory.`,
          `The closer to the user, the faster and cheaper the hit — and the harder it is to invalidate.`,
        ],
        callout: {
          kind: `insight`,
          text: `Most of “making it fast” is deciding what can be cached, where, and for how long.`,
        },
        metrics: { p95: 25, hitRate: 95, dbLoad: 8, fresh: `fresh` },
        scene: {
          entities: {
            users: ut(`users see $25`),
            app: dt(),
            db: ft({ cpu: 0.08 }),
            cache: pt(),
            card: ht(
              `Where a read can stop`,
              [
                `browser cache       0 ms · per user`,
                `CDN edge            ~10 ms · per city`,
                `in-process memory   ~0 ms · per server`,
                `shared cache        ~1 ms`,
                `database            ~20 ms`,
              ],
              `layers`,
            ),
          },
          links: mt,
          flows: gt(0.95),
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Cache answers that are <b>read often and change rarely</b>.</li>
          <li><b>Cache-aside</b>: check the cache, fall back to the database, then fill the cache.</li>
          <li><b>Hit rate</b> drives both speed and database load.</li>
          <li>Plan for staleness: <b>invalidate on write</b>, add a <b>TTL</b>, evict with <b>LRU</b>.</li>
          <li>Protect hot keys from <b>stampedes</b>: one fetch, early refresh, jittered TTLs.</li>
          <li>Cache <b>“not found”</b> too, and screen impossible keys with a <b>Bloom filter</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Content Delivery</b> — caching files on servers spread around the world, close to your users.`,
        },
        metrics: { p95: 25, hitRate: 95, dbLoad: 8, fresh: `fresh` },
        scene: {
          entities: { users: ut(`users see $25`), app: dt(), db: ft({ cpu: 0.08 }), cache: pt() },
          links: mt,
          flows: gt(0.95),
        },
      },
    ],
  };

export default cachingLesson;
