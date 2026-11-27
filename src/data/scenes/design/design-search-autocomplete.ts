import { makeBlock, makeCrowd, makeDb, makeLink, makePanel } from '@/lib/simulator/scene-builders';

// One stage for the whole lesson: users type search queries keystroke by keystroke;
// the search autocomplete service returns top-k matching suggestions within 100ms.
// Each step introduces an optimization: Trie structure, top-k precomputed at nodes,
// Redis cache layer, offline data collection & aggregation pipeline, prefix sharding,
// and trie partition servers.
//
//               trie cache ── Query API ── Trie cluster
//   searchers ──┘                 │
//               query logs ── Aggregator ── Trie DB

type Tag = { text: string; tone?: string; icon?: string };
type Opts = Record<string, unknown>;

const searchers = () => makeCrowd({ x0: -5, x1: 5, y0: -21, y1: -16 }, 12, `searchers`);
const api = (tags: Tag[] = [], o: Opts = {}) =>
  makeBlock(0, -4, { s: 4.8, h: 54, glyph: `search`, label: [`Query`, `Service`], tags, ...o });
const cache = (tags: Tag[] = [], o: Opts = {}) =>
  makeBlock(-12, -4, { s: 4.4, h: 50, color: `green`, glyph: `zap`, label: [`Trie`, `Cache`], sub: `top-k cache`, tags, ...o });
const trie = (tags: Tag[] = [], o: Opts = {}) =>
  makeBlock(12, -4, { s: 4.8, h: 54, color: `purple`, glyph: `gitFork`, label: [`Trie`, `Cluster`], sub: `in-memory index`, tags, ...o });
const logs = (tags: Tag[] = []) =>
  makeDb(-8, 10, { r: 1.8, h: 42, color: `store`, glyph: `fileText`, label: `query logs`, tags });
const agg = (tags: Tag[] = []) =>
  makeBlock(3, 13, { s: 4.4, h: 50, color: `yellow`, glyph: `cpu`, label: [`Log`, `Aggregator`], sub: `offline pipeline`, tags });
const triedb = (tags: Tag[] = []) =>
  makeDb(16, 5, { r: 1.9, h: 44, color: `store`, glyph: `database`, label: `trie storage`, tags });

const L = {
  query: makeLink(`users`, `api`, [`users`, `api`], { heads: `both` }),
  askTrie: makeLink(`api`, `trie`, [`api`, `trie`], { heads: `both` }),
  checkCache: makeLink(`api`, `cache`, [`api`, `cache`], { heads: `both` }),
  emitLog: makeLink(`api`, `logs`, [`api`, `logs`]),
  drainLog: makeLink(`logs`, `agg`, [`logs`, `agg`]),
  saveTrie: makeLink(`agg`, `triedb`, [`agg`, `triedb`]),
  deployTrie: makeLink(`triedb`, `trie`, [`triedb`, `trie`], { style: `dashed` }),
};

const live = { query: L.query, askTrie: L.askTrie };
const withCache = { ...live, checkCache: L.checkCache };
const withPipeline = { ...withCache, emitLog: L.emitLog, drainLog: L.drainLog, saveTrie: L.saveTrie, deployTrie: L.deployTrie };

/** Artifact card, parked in the empty band above-left of the service. */
const card = (title: string, lines: string[], icon: string) =>
  makePanel({ x: 0, y: -4, z: 0, dx: -414, dy: -298 }, title, lines, { icon });

export const designSearchAutocompleteLesson = {
  id: `design-search-autocomplete`,
  title: `Design Search Autocomplete`,
  summary: `Sub-50ms typeahead for millions of users: Trie indexing, top-k precomputation, offline log aggregation and prefix sharding.`,
  minutes: 15,
  level: `advanced`,
  metrics: [`p99`, `qps`, `cacheHit`, `staleness`],
  legend: [`req`, `res`, [`write`, `log stream`], [`msg`, `batch build`], [`sync`, `trie snapshot`], `fail`],
  goals: [
    { text: `Understand the 100ms latency budget`, step: 2 },
    { text: `Trie data structure with Top-K cache`, step: 4 },
    { text: `Front-end caching & Redis prefix cache`, step: 6 },
    { text: `Offline log aggregation pipeline`, step: 8 },
    { text: `Scale out via prefix sharding`, step: 10 },
  ],
  steps: [
    {
      short: `The brief`,
      chapter: `setup`,
      title: `The brief: typeahead at google scale`,
      body: [
        `As the user types into the search box, the system suggests the <b>top 5 most relevant completions</b> in real time.`,
        `The latency budget is uncompromising: the entire round-trip must complete within <b>50ms</b> to feel instantaneous. At 10 million daily active users typing an average of 4 words with 5 keystrokes each, that is <b>200 million queries per day</b> with peak traffic exceeding 25,000 QPS.`,
      ],
      callout: {
        kind: `insight`,
        text: `Search autocomplete turns every single keystroke into an API call. Traditional SQL LIKE queries (%prefix%) will immediately crash the database.`,
      },
      metrics: { p99: null, qps: null, cacheHit: `—`, staleness: `—` },
      scene: {
        entities: {
          users: searchers(),
          api: api(),
          trie: trie(),
        },
        links: live,
        flows: [],
      },
    },
    {
      short: `Budget`,
      chapter: `setup`,
      title: `Numbers: sub-100ms budget breakdown`,
      body: [
        `A responsive UI requires suggestions to appear before the human eye detects hesitation (< 100ms). Subtracting 50ms for round-trip network transit leaves the backend with a <b>strict budget of under 30ms</b>.`,
        `Directly scanning tables with <code>SELECT * FROM queries WHERE text LIKE 'auto%'</code> takes hundreds of milliseconds because B-Trees are not optimized for fast prefix extraction under heavy writes.`,
      ],
      callout: {
        kind: `math`,
        text: `10M DAU × 20 queries/day = 200M requests/day ≈ 2,400 avg QPS, peaking at 25,000 QPS. At 50ms per keystroke, every millisecond counts.`,
      },
      metrics: { p99: 145, qps: 2400, cacheHit: `0%`, staleness: `realtime` },
      scene: {
        entities: {
          users: searchers(),
          api: api([{ text: `30ms budget`, tone: `red` }]),
          trie: trie([{ text: `naive db`, tone: `orange` }]),
          panel: card(`Latency Budget (100ms Max)`, [
            `Client keystroke debounce : 50ms`,
            `Network RTT (client ↔ edge) : 25ms`,
            `Server lookup + JSON response: 20ms`,
            `Client DOM render : 5ms`,
            `Total perceived latency : 100ms`,
          ], `timer`),
        },
        links: live,
        flows: [{ route: [`query`, `askTrie`], rate: 1.8, bounce: true }],
      },
    },
    {
      short: `Trie tree`,
      chapter: `storage`,
      title: `Data structure: prefix trie`,
      body: [
        `A <span class="term">Trie</span> (prefix tree) organizes strings hierarchically: root is empty, and every child represents one character. Traversal from root to node forms a search prefix.`,
        `Looking up prefix of length <code>p</code> takes <code>O(p)</code> time. However, finding the top 5 most searched words beneath that prefix requires traversing all descendant subtrees: <code>O(p + n + k log k)</code>, which is still too slow for hot keywords.`,
      ],
      callout: {
        kind: `insight`,
        text: `A raw Trie lookup scales with the number of descendant terms (n). For popular prefixes like 's' or 'th', n can be millions.`,
      },
      metrics: { p99: 82, qps: 4500, cacheHit: `0%`, staleness: `realtime` },
      scene: {
        entities: {
          users: searchers(),
          api: api(),
          trie: trie([{ text: `raw trie`, tone: `blue` }]),
          panel: card(`Trie Traversal Complexity`, [
            `Prefix length: p`,
            `Subtree nodes: n`,
            `Naive complexity: O(p + n)`,
            `With 1M words starting with 'a',`,
            `n = 1,000,000 → Unacceptable!`,
          ], `gitFork`),
        },
        links: live,
        flows: [{ route: [`query`, `askTrie`], rate: 2.0, bounce: true }],
      },
    },
    {
      short: `Precomputed`,
      chapter: `storage`,
      title: `Precomputed top-k at every node`,
      body: [
        `We eliminate the <code>O(n)</code> subtree search by <b>storing the top 5 suggestions directly at every node</b> in the Trie.`,
        `When a query arrives for prefix <code>"app"</code>, the algorithm navigates directly to node <code>'p'</code> in <code>O(p)</code> steps and instantly reads the precomputed list: <code>["apple", "application", "amazon app", ...]</code> in <code>O(1)</code> time!`,
      ],
      callout: {
        kind: `insight`,
        text: `Trading space for speed: duplicating the top-5 suggestions at every prefix node increases memory footprint by ~3x, but reduces lookup time to purely O(p).`,
      },
      metrics: { p99: 22, qps: 8000, cacheHit: `0%`, staleness: `realtime` },
      scene: {
        entities: {
          users: searchers(),
          api: api([{ text: `O(p) lookup`, tone: `green` }]),
          trie: trie([{ text: `top-5 cached`, tone: `green` }]),
          panel: card(`Node Representation`, [
            `Node: 'app'`,
            `Top-5 List:`,
            `1. apple (480k)`,
            `2. apple watch (210k)`,
            `3. application (150k)`,
            `4. app store (120k)`,
          ], `list`),
        },
        links: live,
        flows: [{ route: [`query`, `askTrie`], rate: 2.2, bounce: true }],
      },
    },
    {
      short: `Serving cache`,
      chapter: `cache`,
      title: `Serving cache: front-end & redis layer`,
      body: [
        `Even an <code>O(p)</code> in-memory lookup takes precious CPU cycles at 25,000 QPS. We insert a high-speed key-value cache layer (Redis) in front of the Trie service.`,
        `The client also caches suggestions in memory for the current session: typing <code>"app"</code>, backspacing to <code>"ap"</code>, and typing <code>"app"</code> again incurs zero network requests.`,
      ],
      callout: {
        kind: `insight`,
        text: `Because query distributions follow a power law (Zipf's law), 20% of the prefixes generate over 80% of all search traffic. Redis easily absorbs the bulk.`,
      },
      metrics: { p99: 12, qps: 18000, cacheHit: `78%`, staleness: `realtime` },
      scene: {
        entities: {
          users: searchers(),
          cache: cache([{ text: `hit 78%`, tone: `green` }]),
          api: api(),
          trie: trie(),
        },
        links: withCache,
        flows: [
          { route: [`query`, `checkCache`], rate: 2.2, bounce: true },
          { route: [`query`, `askTrie`], rate: 0.6, bounce: true },
        ],
      },
    },
    {
      short: `Write path`,
      chapter: `pipeline`,
      title: `The write problem: real-time updates stall`,
      body: [
        `If the Trie is updated on every search query, every character typed triggers write locks and recalculations across the whole ancestor path.`,
        `Furthermore, real-world search popularity changes gradually (daily or weekly), not millisecond by millisecond. Updating the Trie synchronously during search requests is an anti-pattern.`,
      ],
      callout: {
        kind: `warning`,
        text: `Never update the serving Trie synchronously on query requests. Decouple query serving from the data collection pipeline.`,
      },
      metrics: { p99: 38, qps: 14000, cacheHit: `80%`, staleness: `realtime` },
      scene: {
        entities: {
          users: searchers(),
          cache: cache(),
          api: api([{ text: `decoupled`, tone: `blue` }]),
          trie: trie([{ text: `read-only`, tone: `green` }]),
          logs: logs([{ text: `stream`, tone: `yellow` }]),
        },
        links: { ...withCache, emitLog: L.emitLog },
        flows: [
          { route: [`query`, `checkCache`], rate: 2.0, bounce: true },
          { route: [`emitLog`], kind: `write`, rate: 1.2 },
        ],
      },
    },
    {
      short: `Data pipeline`,
      chapter: `pipeline`,
      title: `Offline data collection & aggregation`,
      body: [
        `Queries are appended asynchronously into log files (via Kafka/log collectors). A scheduled log aggregation job (MapReduce or Spark) aggregates query frequencies over rolling time windows.`,
        `The aggregated frequencies are stored in a persistent relational or key-value database, keeping a clean historical record of query popularity.`,
      ],
      callout: {
        kind: `insight`,
        text: `By batching updates every few hours, millions of log lines condense into a clean table of unique keywords and counts, saving 99% of index recomputations.`,
      },
      metrics: { p99: 10, qps: 22000, cacheHit: `82%`, staleness: `1h` },
      scene: {
        entities: {
          users: searchers(),
          cache: cache(),
          api: api(),
          trie: trie(),
          logs: logs(),
          agg: agg([{ text: `Spark job`, tone: `yellow` }]),
          triedb: triedb([{ text: `frequency db`, tone: `blue` }]),
        },
        links: { ...withCache, emitLog: L.emitLog, drainLog: L.drainLog, saveTrie: L.saveTrie },
        flows: [
          { route: [`query`, `checkCache`], rate: 2.2, bounce: true },
          { route: [`emitLog`], kind: `write`, rate: 1.2 },
          { route: [`drainLog`], kind: `msg`, rate: 0.8 },
          { route: [`saveTrie`], kind: `write`, rate: 0.6 },
        ],
      },
    },
    {
      short: `Trie rebuild`,
      chapter: `pipeline`,
      title: `Weekly snapshot & atomic swap`,
      body: [
        `The offline aggregator builds a fresh in-memory Trie from the aggregated frequency database. Once fully constructed and validated, a serialized snapshot is uploaded to storage.`,
        `Serving nodes download the snapshot and perform an <b>atomic pointer swap</b>. Zero downtime, zero write-lock contention on the live serving cluster.`,
      ],
      callout: {
        kind: `insight`,
        text: `Blue/green in-memory swap: the serving engine queries Trie A while downloading Trie B, then switches an atomic pointer to make Trie B active instantaneously.`,
      },
      metrics: { p99: 9, qps: 25000, cacheHit: `84%`, staleness: `daily snapshot` },
      scene: {
        entities: {
          users: searchers(),
          cache: cache(),
          api: api(),
          trie: trie([{ text: `swap ready`, tone: `purple` }]),
          logs: logs(),
          agg: agg(),
          triedb: triedb([{ text: `snapshot`, tone: `green` }]),
        },
        links: withPipeline,
        flows: [
          { route: [`query`, `checkCache`], rate: 2.4, bounce: true },
          { route: [`emitLog`], kind: `write`, rate: 1.0 },
          { route: [`deployTrie`], kind: `sync`, rate: 0.5 },
        ],
      },
    },
    {
      short: `Scale out`,
      chapter: `scale`,
      title: `Scale out: sharding by prefix`,
      body: [
        `As the dictionary grows to tens of millions of terms across multiple languages, a single machine's RAM cannot hold the entire Trie.`,
        `We shard by prefix: server 1 handles <code>[a-m]</code>, server 2 handles <code>[n-z]</code>. If <code>'a'</code> is heavily loaded, we shard deeper: <code>[aa-ag]</code>, <code>[ah-az]</code> to achieve balanced memory and request distribution.`,
      ],
      callout: {
        kind: `insight`,
        text: `Uneven distribution (letters 's', 'c', 't' have far more words than 'x', 'z') means naive 26-way partitioning fails. Use consistent hashing on adaptive prefix ranges.`,
      },
      metrics: { p99: 8, qps: 45000, cacheHit: `88%`, staleness: `daily` },
      scene: {
        entities: {
          users: searchers(),
          cache: cache([{ text: `cluster cache`, tone: `green` }]),
          api: api([{ text: `router`, tone: `blue` }]),
          trie: trie([{ text: `26 shards`, tone: `purple` }]),
          logs: logs(),
          agg: agg(),
          triedb: triedb(),
          panel: card(`Shard Router Map`, [
            `Prefix a-c : Shard 1 (RAM: 14GB)`,
            `Prefix d-h : Shard 2 (RAM: 12GB)`,
            `Prefix i-m : Shard 3 (RAM: 15GB)`,
            `Prefix n-s : Shard 4 (RAM: 18GB)`,
            `Prefix t-z : Shard 5 (RAM: 11GB)`,
          ], `grid`),
        },
        links: withPipeline,
        flows: [
          { route: [`query`, `checkCache`], rate: 2.6, bounce: true },
          { route: [`query`, `askTrie`], rate: 0.5, bounce: true },
          { route: [`emitLog`], kind: `write`, rate: 1.0 },
          { route: [`drainLog`], kind: `msg`, rate: 0.6 },
        ],
      },
    },
    {
      short: `Recap`,
      chapter: `recap`,
      title: `The complete architecture`,
      body: [
        `We met the sub-50ms latency bar through layered architecture:`,
        `1. <b>Client side:</b> 50ms debouncing and local browser cache.<br>` +
        `2. <b>Edge / Cache:</b> Redis cluster caching 85%+ of hot prefixes.<br>` +
        `3. <b>Serving layer:</b> Sharded in-memory Trie with precomputed top-k results at each node (O(p) lookup).<br>` +
        `4. <b>Offline pipeline:</b> Kafka logs → MapReduce aggregator → weekly snapshot atomic swap.`,
      ],
      callout: {
        kind: `next`,
        text: `Next up: explore <b>Batch & Stream Processing</b> to dive deeper into how Kafka and Spark crunch petabytes of events.`,
      },
      metrics: { p99: 8, qps: 50000, cacheHit: `89%`, staleness: `fresh · resilient` },
      scene: {
        entities: {
          users: searchers(),
          cache: cache(),
          api: api(),
          trie: trie(),
          logs: logs(),
          agg: agg(),
          triedb: triedb(),
        },
        links: withPipeline,
        flows: [
          { route: [`query`, `checkCache`], rate: 2.8, bounce: true },
          { route: [`emitLog`], kind: `write`, rate: 1.0 },
          { route: [`saveTrie`], kind: `write`, rate: 0.6 },
          { route: [`deployTrie`], kind: `sync`, rate: 0.4 },
        ],
      },
    },
  ],
};

export default designSearchAutocompleteLesson;
