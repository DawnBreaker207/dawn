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

export const sqlExplainLesson = {
  id: `sql-explain`,
  title: `PostgreSQL EXPLAIN & Cost-Based Optimizer`,
  summary: `Dissect query plan trees: Startup vs Total cost, Seq Scan vs Index Scan vs Bitmap Heap Scan, and buffer cache hits.`,
  minutes: 12,
  level: `intermediate`,
  metrics: [`cost`, `rows`, `loops`, `buffers_hit`, `execution_time`],
  legend: [`req`, `res`, [`ping`, `buffer read`], `fail`],
  goals: [
    { text: 'How PostgreSQL calculates Startup Cost', step: 1 },
    { text: 'Seq Scan vs Index Scan', step: 2 },
    { text: `Bitmap Index Scan & Lossy Bitmap Heap Scan`, step: 3 },
    { text: 'Hash Join vs Nested Loop', step: 4 },
    { text: 'EXPLAIN (ANALYZE, BUFFERS)', step: 5 },
  ],
  steps: [
    {
      short: `Cost Model`,
      chapter: `technique`,
      title: `Cost Model: Startup vs Total Cost`,
      body: [
        `PostgreSQL EXPLAIN outputs cost estimates in arbitrary disk page fetch units (1.0 = 1 sequential page fetch, 4.0 = random page fetch).`,
        `• <strong>Startup Cost</strong>: Cost to fetch the first row (e.g. 0.00 for Seq Scan, higher for sort or hash build).`,
        `• <strong>Total Cost</strong>: Total cost assuming the query runs to completion.`,
      ],
      callout: { kind: `insight`, text: `Limits (LIMIT 1) allow the executor to stop as soon as startup completes, saving huge total costs.` },
      metrics: { cost: `0.00..450.00`, rows: `10,000`, loops: `1`, buffers_hit: `45 pages`, execution_time: `1.2ms` },
      scene: {
        entities: {
          client: y(-11, -4, { label: `Client`, tags: [{ text: `EXPLAIN`, icon: `terminal` }] }),
          planner: d(0, -4, { s: 4.4, h: 50, color: `blue`, glyph: `search`, label: [`Cost-Based`, `Planner`], sub: `Optimizer` }),
          catalog: b(11, -4, { r: 2.2, h: 36, label: `pg_statistic`, color: `purple` }),
        },
        links: {
          cp: h(`client`, `planner`, [`client`, `planner`], { heads: `both`, label: `query ast` }),
          pc: h(`planner`, `catalog`, [`planner`, `catalog`], { heads: `both`, label: `statistics` }),
        },
        flows: [
          { route: [`cp`, `pc`], bounce: true, rate: 1.8 },
        ],
      },
    },
    {
      short: `Scan Choice`,
      chapter: `technique`,
      title: `Seq Scan vs Index Scan Threshold`,
      body: [
        `An index is not always faster. When a query matches > 5–10% of rows, sequential scan is faster because sequential I/O outperforms random index lookups.`,
        `• <strong>Seq Scan</strong>: Reads 8KB pages sequentially into buffer cache.`,
        `• <strong>Index Scan</strong>: Traverses B-Tree then does random heap page fetches for each matching tuple.`,
      ],
      callout: { kind: `tip`, text: `If random_page_cost is too high (default 4.0 for HDDs), SSD systems should lower it to 1.1 to encourage index usage.` },
      metrics: { cost: `8.45..32.10`, rows: `14 rows`, loops: `1`, buffers_hit: `4 shared`, execution_time: `0.08ms` },
      scene: {
        entities: {
          planner: d(-11, -4, { s: 3.8, h: 42, color: `blue`, glyph: `search`, label: [`Plan Tree`] }),
          idx_scan: d(0, -4, { s: 3.8, h: 42, color: `green`, glyph: `layers`, label: [`Index Scan`], sub: `btree users_pkey` }),
          heap: b(11, -4, { r: 2.2, h: 36, label: `Heap Table`, color: `teal` }),
        },
        links: {
          pi: h(`planner`, `idx_scan`, [`planner`, `idx_scan`], { heads: `end` }),
          ih: h(`idx_scan`, `heap`, [`idx_scan`, `heap`], { heads: `both`, label: `TID fetch` }),
        },
        flows: [
          { route: [`pi`, `ih`], bounce: true, rate: 2.0 },
        ],
      },
    },
    {
      short: `Bitmap Scan`,
      chapter: `technique`,
      title: `Bitmap Index Scan & Bitmap Heap Scan`,
      body: [
        `When multiple rows match across the table, an Index Scan would jump erratically across pages. A <strong>Bitmap Index Scan</strong> creates an in-memory bitmap of target page IDs first.`,
        `The <strong>Bitmap Heap Scan</strong> then reads pages sequentially in physical order, converting random I/O into sequential I/O.`,
      ],
      callout: { kind: `warn`, text: `If work_mem is too small to hold the bitmap, it degrades to a Lossy Bitmap requiring row-by-row rechecks.` },
      metrics: { cost: `12.00..88.50`, rows: `250 rows`, loops: `1`, buffers_hit: `18 shared`, execution_time: `0.45ms` },
      scene: {
        entities: {
          idx_scan: d(-11, -4, { s: 3.8, h: 42, color: `yellow`, glyph: `layers`, label: [`Bitmap Index`], sub: `Scan` }),
          bitmap: d(0, -4, { s: 3.8, h: 42, color: `purple`, glyph: `workflow`, label: [`Bitmap In-Memory`], sub: `work_mem` }),
          heap_scan: d(11, -4, { s: 3.8, h: 42, color: `green`, glyph: `server`, label: [`Bitmap Heap`], sub: `Scan` }),
        },
        links: {
          ib: h(`idx_scan`, `bitmap`, [`idx_scan`, `bitmap`], { heads: `end`, label: `page bits` }),
          bh: h(`bitmap`, `heap_scan`, [`bitmap`, `heap_scan`], { heads: `end`, label: `sorted TIDs` }),
        },
        flows: [
          { route: [`ib`, `bh`], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Hash Join`,
      chapter: `technique`,
      title: `Join Algorithms: Hash Join vs Nested Loop`,
      body: [
        `PostgreSQL supports 3 join algorithms depending on data sizes and index presence:`,
        `• <strong>Nested Loop</strong>: Best when outer table is small and inner table has an index lookup.`,
        `• <strong>Hash Join</strong>: Builds an in-memory hash table of smaller table, then streams outer table.`,
        `• <strong>Merge Join</strong>: Both relations already sorted by join key, single simultaneous linear scan.`,
      ],
      callout: { kind: `tip`, text: `Hash Join batches spill to disk (batches: 2) if inner table exceeds work_mem.` },
      metrics: { cost: `45.00..180.00`, rows: `1,200`, loops: `1`, buffers_hit: `64 shared`, execution_time: `2.1ms` },
      scene: {
        entities: {
          build: d(-11, -4, { s: 3.8, h: 42, color: `orange`, glyph: `box`, label: [`Inner Table`], sub: `Hash Build` }),
          hash_tbl: d(0, -4, { s: 3.8, h: 42, color: `purple`, glyph: `database`, label: [`Hash Table`], sub: `In Memory` }),
          probe: d(11, -4, { s: 3.8, h: 42, color: `teal`, glyph: `search`, label: [`Outer Probe`], sub: `Hash Join` }),
        },
        links: {
          build_hash: h(`build`, `hash_tbl`, [`build`, `hash_tbl`], { heads: `end`, label: `populate` }),
          ph: h(`probe`, `hash_tbl`, [`probe`, `hash_tbl`], { heads: `both`, label: `hash match` }),
        },
        flows: [
          { route: [`build_hash`], bounce: false, rate: 1.5 },
          { route: [`ph`], bounce: true, rate: 2.2 },
        ],
      },
    },
    {
      short: `Buffers`,
      chapter: `deep`,
      title: `EXPLAIN (ANALYZE, BUFFERS) Profiling`,
      body: [
        `Running <code>EXPLAIN (ANALYZE, BUFFERS)</code> executes the query and reveals real runtime statistics:`,
        `• <strong>Shared Hit</strong>: 8KB page already cached in PostgreSQL shared_buffers memory (sub-microsecond).`,
        `• <strong>Shared Read</strong>: Cache miss — page read from OS page cache or disk.`,
        `• <strong>Shared Dirtied / Written</strong>: Pages modified in memory and flushed to disk.`,
      ],
      callout: { kind: `insight`, text: `Optimize for lowest Shared Reads to keep database latency consistently under 1ms.` },
      metrics: { cost: `0.42..8.44`, rows: `1`, loops: `1`, buffers_hit: `3 shared hit`, execution_time: `0.04ms` },
      scene: {
        entities: {
          executor: d(-11, -4, { s: 3.8, h: 42, color: `blue`, glyph: `cpu`, label: [`Executor`], sub: `Volcano Loop` }),
          buffer_pool: d(0, -4, { s: 3.8, h: 42, color: `green`, glyph: `server`, label: [`shared_buffers`], sub: `Page Cache` }),
          disk: b(11, -4, { r: 2.2, h: 36, label: `NVMe Storage`, color: `orange` }),
        },
        links: {
          eb: h(`executor`, `buffer_pool`, [`executor`, `buffer_pool`], { heads: `both`, label: `Shared Hit (0ms)` }),
          bd: h(`buffer_pool`, `disk`, [`buffer_pool`, `disk`], { heads: `both`, label: `Shared Read (disk)` }),
        },
        flows: [
          { route: [`eb`], bounce: true, rate: 2.5 },
          { route: [`bd`], bounce: true, rate: 0.8 },
        ],
      },
    },
  ],
};
export default sqlExplainLesson;
