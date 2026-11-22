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

const qu = { x0: -4.5, x1: 4.5, y0: -19, y1: -13 };

const Ju = (e = `people clicking links`) => p(qu, 12, e);

const Yu = (e = [], t = {}) => d(0, -4, { label: [`API`, `Servers`], tags: e, ...t });

const Xu = (e = {}) => b(12, -4, { r: 1.9, glyph: `database`, label: `links table`, ...e });

const Zu = (e = {}) =>
    d(-12, -4, { color: `green`, glyph: `zap`, label: [`Cache`], sub: `code → URL`, ...e });

const Qu = (e = []) =>
    d(-7, 10, { s: 4.2, h: 46, color: `yellow`, glyph: `hash`, label: [`ID`, `Blocks`], tags: e });

const $u = () =>
    d(8, 10, { s: 4.2, h: 46, color: `orange`, glyph: `waves`, label: [`Click`, `Stream`] });

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

export { ld as designUrlShortenerLesson };
export default ld;
