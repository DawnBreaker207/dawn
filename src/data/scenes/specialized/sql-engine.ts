import {
  makeBlock,
  makeDb,
  makeDevice,
  makeLink,
  makePanel
} from '@/lib/simulator/scene-builders';

export const sqlEngineLesson = {
  id: `sql-engine`,
  title: `PostgreSQL Query Engine, EXPLAIN & Tuning`,
  summary: `Follow a SQL query through parse, analyze, plan, execute, commit, checkpoint, EXPLAIN cost/buffers, Index Only Scan, Sargable rewrites, EXISTS, and work_mem tuning.`,
  minutes: 10,
  level: `intermediate`,
  metrics: [`stage`, `buffers`, `wal`, `locks`],
  goals: [
    { text: `How the parser turns SQL text into an AST`, step: 1 },
    { text: 'How the analyzer resolves names', step: 2 },
    { text: 'How the planner chooses Seq', step: 3 },
    { text: 'Buffer pool, WAL write, and', step: 4 },
    { text: 'WAL flush, fsync, and lock', step: 5 },
    { text: 'Checkpoint & crash recovery via WAL replay', step: 6 },
{ text: 'How PostgreSQL calculates Startup Cost', step: 7 },
    { text: 'Seq Scan vs Index Scan', step: 8 },
    { text: `Bitmap Index Scan & Lossy Bitmap Heap Scan`, step: 9 },
    { text: 'Hash Join vs Nested Loop', step: 10 },
    { text: 'EXPLAIN (ANALYZE, BUFFERS)', step: 11 },
    { text: 'Index Only Scan & Visibility Map', step: 12 },
    { text: 'Fix Non-Sargable Predicates & Implicit Casts', step: 13 },
    { text: 'Replace COUNT(*)>0 with EXISTS & drop SELECT *', step: 14 },
    { text: 'Diagnose Stale Stats & work_mem Disk Spills', step: 15 },
  ],
  steps: [
    {
      short: `Parse`,
      chapter: `technique`,
      title: `Parse: SQL text → AST`,
      body: [
        `The query arrives as plain text. The parser tokenises it and builds an Abstract Syntax Tree (AST).`,
        `At this stage no tables are opened — the engine just understands the grammar of what was written.`,
      ],
      callout: { kind: `tip`, text: `A syntax error (misspelled keyword, missing comma) is caught here before any disk access.` },
      metrics: { stage: `Parse`, buffers: `0`, wal: `0 B`, locks: `none` },
      scene: {
        entities: {
          client: makeDevice(-10, 0, { label: `client`, tags: [{ text: `SELECT …`, icon: `code` }] }),
          parser: makeBlock(2,   0, { color: `blue`,   glyph: `code`, label: [`Parser`, `AST`] }),
        },
        links: {
          cp: makeLink(`client`, `parser`, [`client`, `parser`], { label: `SQL text`, heads: `end` }),
        },
        flows: [{ route: [`cp`], bounce: false, rate: 1 }],
      },
    },
    {
      short: `Analyze`,
      chapter: `technique`,
      title: `Analyze: resolve names & types`,
      body: [
        `The analyzer walks the AST and resolves every table and column name against the system catalog.`,
        `It checks types, expands wildcards (SELECT *), and rewrites subqueries into joins where possible.`,
      ],
      callout: { kind: `tip`, text: `An unknown table or type mismatch is caught here — after parsing but before any plan is built.` },
      metrics: { stage: `Analyze`, buffers: `1 (catalog)`, wal: `0 B`, locks: `schema lock` },
      scene: {
        entities: {
          parser:   makeBlock(-8, 0,  { color: `blue`,   glyph: `code`, label: [`Parser`, `AST`] }),
          analyzer: makeBlock(4,  0,  { color: `purple`, glyph: `code`, label: [`Analyzer`, `type-check`] }),
          catalog:  makeDb(4,  10, { label: [`System`, `Catalog`] }),
        },
        links: {
          pa: makeLink(`parser`,   `analyzer`, [`parser`,   `analyzer`], { label: `AST`,    heads: `end` }),
          ac: makeLink(`analyzer`, `catalog`,  [`analyzer`, `catalog`],  { label: `lookup`, heads: `both` }),
        },
        flows: [{ route: [`pa`], bounce: false, rate: 1 }],
      },
    },
    {
      short: `Plan`,
      chapter: `technique`,
      title: `Plan: choose the cheapest path`,
      body: [
        `The planner enumerates execution strategies — Seq Scan, Index Scan, Hash Join — and uses table statistics to estimate cost.`,
        `The cheapest plan wins. For a selective predicate on an indexed column, an Index Scan costs far less than reading every row.`,
      ],
      callout: { kind: `insight`, text: `Run EXPLAIN ANALYZE to see which plan the optimizer chose and whether its row-count estimates were accurate.` },
      metrics: { stage: `Plan`, buffers: `1`, wal: `0 B`, locks: `schema lock` },
      scene: {
        entities: {
          planner: makeBlock(-6, 4,  { color: `purple`, glyph: `code`,   label: [`Planner`, `cost model`] }),
          stats:   makeBlock(8, -8,  { color: `blue`,   glyph: `chart`,  label: [`Statistics`, `pg_stats`] }),
          seqscan: makeBlock(8,  2,  { color: `yellow`, glyph: `layers`, label: [`Seq Scan`, `10 000 rows`] }),
          idxscan: makeBlock(8,  10, { color: `green`,  glyph: `zap`,    label: [`Index Scan`, `12 rows ✓`] }),
        },
        links: {
          ps: makeLink(`planner`, `stats`,   [`planner`, `stats`],   { label: `read stats`, heads: `both` }),
          p1: makeLink(`planner`, `seqscan`, [`planner`, `seqscan`], { label: `cost: 420`,  heads: `end`, style: `dashed` }),
          p2: makeLink(`planner`, `idxscan`, [`planner`, `idxscan`], { label: `cost: 0.3`,  heads: `end` }),
        },
        flows: [{ route: [`p2`], bounce: false, rate: 1.2 }],
      },
    },
    {
      short: `Execute`,
      chapter: `technique`,
      title: `Execute: buffer pool & locks`,
      body: [
        `The executor walks the plan tree top-down. Each node pulls rows from its child.`,
        `Pages are loaded into the shared buffer pool first — a cache in RAM. Only a cache miss goes to disk. Row-level locks prevent dirty reads.`,
      ],
      callout: { kind: `insight`, text: `Most OLTP queries touch only a handful of 8KB pages — the buffer pool hit rate is typically 99%+.` },
      metrics: { stage: `Execute`, buffers: `4 loaded`, wal: `48 B`, locks: `RowShareLock` },
      scene: {
        entities: {
          executor: makeBlock(-8, 2,   { color: `green`,  glyph: `code`,   label: [`Executor`, `pull model`] }),
          bufpool:  makeBlock(8, -6,   { color: `blue`,   glyph: `layers`, label: [`Buffer Pool`, `8KB pages`] }),
          lock_mgr: makeBlock(8,  4,   { color: `orange`, glyph: `lock`,   label: [`Lock Mgr`, `RowShareLock`] }),
          disk:     makeDb(18, -6,  { label: [`Disk`, `heap + index`] }),
        },
        links: {
          eb: makeLink(`executor`, `bufpool`,  [`executor`, `bufpool`],  { label: `fetch page`, heads: `both` }),
          el: makeLink(`executor`, `lock_mgr`, [`executor`, `lock_mgr`], { label: `acquire`,    heads: `end` }),
          bd: makeLink(`bufpool`,  `disk`,     [`bufpool`,  `disk`],     { label: `cache miss`, heads: `both`, style: `dashed` }),
        },
        flows: [
          { route: [`eb`], bounce: false, rate: 1.2 },
          { route: [`el`], bounce: false, rate: 0.8 },
        ],
      },
    },
    {
      short: `Commit`,
      chapter: `technique`,
      title: `Commit: WAL flush & lock release`,
      body: [
        `On COMMIT the WAL (Write-Ahead Log) buffer is flushed to disk. The transaction is durable once the WAL record is fsynced.`,
        `Only after WAL is durable does the engine release row locks and report success to the client.`,
      ],
      callout: { kind: `insight`, text: `WAL is the reason crashes are safe: the heap page can be written lazily (checkpoint), but the log is always ahead of it.` },
      metrics: { stage: `Commit`, buffers: `4`, wal: `fsynced`, locks: `released` },
      scene: {
        entities: {
          executor: makeBlock(-10, 2, { color: `green`,  glyph: `code`,  label: [`Executor`, `COMMIT`] }),
          wal:      makeDb(6, -6,  { label: [`WAL`, `pg_wal`] }),
          disk:     makeDb(6,  6,  { label: [`Heap`, `data files`] }),
          done:     makeBlock(18, 0,  { color: `green`,  glyph: `check`, label: [`Client`, `OK`] }),
        },
        links: {
          ew:  makeLink(`executor`, `wal`,  [`executor`, `wal`],  { label: `fsync WAL`,         heads: `end` }),
          ed:  makeLink(`executor`, `disk`, [`executor`, `disk`], { label: `dirty pages (lazy)`, heads: `end`, style: `dashed` }),
          ret: makeLink(`executor`, `done`, [`executor`, `done`], { label: `COMMIT OK`,         heads: `end` }),
        },
        flows: [{ route: [`ew`, `ret`], bounce: false, rate: 1.3 }],
      },
    },
    {
      short: `Checkpoint`,
      chapter: `deep`,
      title: `Checkpoint & Crash Recovery (WAL Replay)`,
      body: [
        `During normal commits, dirty pages stay in <code>shared_buffers</code> while only the sequential <strong>WAL</strong> is fsynced.`,
        `Periodically, a <strong>Checkpoint</strong> flushes all dirty pages up to a <code>REDO LSN</code> to heap data files. On crash recovery, PostgreSQL only replays WAL records <em>after</em> the last checkpoint.`,
      ],
      callout: { kind: `tip`, text: `Larger checkpoint_timeout & max_wal_size reduce checkpoint I/O spikes, at the cost of slightly longer crash recovery.` },
      metrics: { stage: `Checkpoint`, buffers: `Flushed`, wal: `REDO LSN`, locks: `none` },
      scene: {
        entities: {
          wal: makeDb(-14, -10, { r: 2.2, h: 48, color: `purple`, label: [`pg_wal`], sub: `REDO LSN` }),
          ckpt: makeBlock(0, -10, { s: 4.6, h: 52, color: `blue`, glyph: `workflow`, label: [`Checkpointer`], sub: `flush dirty` }),
          heap: makeDb(15, -10, { r: 2.2, h: 48, color: `green`, label: [`Heap Files`], sub: `synced disk` }),
          card: makePanel({ x: -12, y: 12 }, `WAL Checkpoint & Crash Recovery`, [
            `-- On crash: replay WAL from last Checkpoint REDO LSN`,
            `SHOW max_wal_size;      -- default 1GB`,
            `SHOW checkpoint_timeout; -- default 5min`,
          ], { icon: `terminal` }),
        },
        links: {
          wl_ck: makeLink(`wal`, `ckpt`, [`wal`, `ckpt`], { heads: `end`, label: `redo LSN` }),
          ck_hp: makeLink(`ckpt`, `heap`, [`ckpt`, `heap`], { heads: `end`, label: `flush pages` }),
        },
        flows: [{ route: [`wl_ck`, `ck_hp`], bounce: false, rate: 1.7 }],
      },
    },
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
          client: makeDevice(-11, -4, { label: `Client`, tags: [{ text: `EXPLAIN`, icon: `terminal` }] }),
          planner: makeBlock(0, -4, { s: 4.4, h: 50, color: `blue`, glyph: `search`, label: [`Cost-Based`, `Planner`], sub: `Optimizer` }),
          catalog: makeDb(11, -4, { r: 2.2, h: 36, label: `pg_statistic`, color: `purple` }),
        },
        links: {
          cp: makeLink(`client`, `planner`, [`client`, `planner`], { heads: `both`, label: `query ast` }),
          pc: makeLink(`planner`, `catalog`, [`planner`, `catalog`], { heads: `both`, label: `statistics` }),
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
          planner: makeBlock(-11, -4, { s: 3.8, h: 42, color: `blue`, glyph: `search`, label: [`Plan Tree`] }),
          idx_scan: makeBlock(0, -4, { s: 3.8, h: 42, color: `green`, glyph: `layers`, label: [`Index Scan`], sub: `btree users_pkey` }),
          heap: makeDb(11, -4, { r: 2.2, h: 36, label: `Heap Table`, color: `teal` }),
        },
        links: {
          pi: makeLink(`planner`, `idx_scan`, [`planner`, `idx_scan`], { heads: `end` }),
          ih: makeLink(`idx_scan`, `heap`, [`idx_scan`, `heap`], { heads: `both`, label: `TID fetch` }),
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
          idx_scan: makeBlock(-11, -4, { s: 3.8, h: 42, color: `yellow`, glyph: `layers`, label: [`Bitmap Index`], sub: `Scan` }),
          bitmap: makeBlock(0, -4, { s: 3.8, h: 42, color: `purple`, glyph: `workflow`, label: [`Bitmap In-Memory`], sub: `work_mem` }),
          heap_scan: makeBlock(11, -4, { s: 3.8, h: 42, color: `green`, glyph: `server`, label: [`Bitmap Heap`], sub: `Scan` }),
        },
        links: {
          ib: makeLink(`idx_scan`, `bitmap`, [`idx_scan`, `bitmap`], { heads: `end`, label: `page bits` }),
          bh: makeLink(`bitmap`, `heap_scan`, [`bitmap`, `heap_scan`], { heads: `end`, label: `sorted TIDs` }),
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
          build: makeBlock(-11, -4, { s: 3.8, h: 42, color: `orange`, glyph: `box`, label: [`Inner Table`], sub: `Hash Build` }),
          hash_tbl: makeBlock(0, -4, { s: 3.8, h: 42, color: `purple`, glyph: `database`, label: [`Hash Table`], sub: `In Memory` }),
          probe: makeBlock(11, -4, { s: 3.8, h: 42, color: `teal`, glyph: `search`, label: [`Outer Probe`], sub: `Hash Join` }),
        },
        links: {
          build_hash: makeLink(`build`, `hash_tbl`, [`build`, `hash_tbl`], { heads: `end`, label: `populate` }),
          ph: makeLink(`probe`, `hash_tbl`, [`probe`, `hash_tbl`], { heads: `both`, label: `hash match` }),
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
          executor: makeBlock(-11, -4, { s: 3.8, h: 42, color: `blue`, glyph: `cpu`, label: [`Executor`], sub: `Volcano Loop` }),
          buffer_pool: makeBlock(0, -4, { s: 3.8, h: 42, color: `green`, glyph: `server`, label: [`shared_buffers`], sub: `Page Cache` }),
          disk: makeDb(11, -4, { r: 2.2, h: 36, label: `NVMe Storage`, color: `orange` }),
        },
        links: {
          eb: makeLink(`executor`, `buffer_pool`, [`executor`, `buffer_pool`], { heads: `both`, label: `Shared Hit (0ms)` }),
          bd: makeLink(`buffer_pool`, `disk`, [`buffer_pool`, `disk`], { heads: `both`, label: `Shared Read (disk)` }),
        },
        flows: [
          { route: [`eb`], bounce: true, rate: 2.5 },
          { route: [`bd`], bounce: true, rate: 0.8 },
        ],
      },
    },
    {
      short: `Index Only`,
      chapter: `deep`,
      title: `Index Only Scan & Visibility Map`,
      body: [
        `If all selected columns exist inside the B-Tree index (covering index via <code>INCLUDE</code>), PostgreSQL can attempt an <strong>Index Only Scan</strong>.`,
        `Because MVCC visibility lives on the heap, PostgreSQL checks the <strong>Visibility Map (VM)</strong>: if the page is marked all-visible (updated by <code>VACUUM</code>), it skips the heap fetch completely (<code>Heap Fetches: 0</code>)!`,
      ],
      callout: { kind: `tip`, text: `Use CREATE INDEX ... ON orders(user_id) INCLUDE (total) to enable zero-heap-fetch Index Only Scans.` },
      metrics: { cost: `0.42..4.44`, rows: `1`, loops: `1`, buffers_hit: `Heap Fetches: 0`, execution_time: `0.02ms` },
      scene: {
        entities: {
          idx: makeBlock(-14, -10, { s: 4.6, h: 52, color: `green`, glyph: `layers`, label: [`Covering Index`], sub: `INCLUDE (col)` }),
          vm: makeBlock(0, -10, { s: 4.6, h: 52, color: `cyan`, glyph: `shield`, label: [`Visibility Map`], sub: `all-visible` }),
          heap: makeDb(15, -10, { r: 2.2, h: 48, color: `blue`, label: [`Heap Table`], sub: `0 fetches!` }),
          card: makePanel({ x: -12, y: 12 }, `EXPLAIN (ANALYZE, BUFFERS) Index Only`, [
            `EXPLAIN (ANALYZE, BUFFERS)`,
            `SELECT total FROM orders WHERE user_id = 42;`,
            `-> Index Only Scan using idx_orders_uid_inc`,
            `   Heap Fetches: 0  |  Buffers: shared hit=3`,
          ], { icon: `terminal` }),
        },
        links: {
          ix_vm: makeLink(`idx`, `vm`, [`idx`, `vm`], { heads: `end`, label: `check VM` }),
          vm_hp: makeLink(`vm`, `heap`, [`vm`, `heap`], { heads: `end`, label: `skip heap`, style: `dashed` }),
        },
        flows: [{ route: [`ix_vm`], bounce: false, rate: 1.9 }],
      },
    },
    {
      short: `Sargable`,
      chapter: `tuning`,
      title: `Non-Sargable Predicates & Implicit Type Casts`,
      body: [
        `Wrapping an indexed column in a function (<code>WHERE LOWER(email) = ...</code> or <code>EXTRACT(YEAR FROM created_at) = 2026</code>) or passing an integer to a <code>VARCHAR</code> column forces a <strong>Seq Scan</strong> because the B-Tree stores raw column values.`,
        `Make predicates <strong>Sargable</strong> (Search ARGument-able) using range bounds (<code>&gt;= '2026-01-01'</code>) or create an <strong>Expression Index</strong> (<code>CREATE INDEX ON users (LOWER(email))</code>).`,
      ],
      callout: { kind: `warn`, text: `Implicit type casting (int param vs varchar col) silently disables indexes on every row!` },
      metrics: { cost: `0.42..8.44`, rows: `1`, loops: `1`, buffers_hit: `Index Seek`, execution_time: `0.05ms` },
      scene: {
        entities: {
          bad: makeBlock(-14, -10, { s: 4.8, h: 54, color: `red`, glyph: `alert`, label: [`EXTRACT(YEAR)`], sub: `breaks B-Tree` }),
          good: makeBlock(0, -10, { s: 4.8, h: 54, color: `green`, glyph: `shield`, label: [`Range / Expr Idx`], sub: `Sargable` }),
          bt: makeDb(15, -10, { r: 2.2, h: 48, color: `blue`, label: [`B-Tree Index`], sub: `O(log n) seek` }),
          card: makePanel({ x: -12, y: 12 }, `Sargable Rewrites & Expression Indexes`, [
            `-- BAD (Seq Scan):  WHERE EXTRACT(YEAR FROM created_at) = 2026`,
            `-- GOOD (Index):    WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'`,
            `-- Or Expression Index: CREATE INDEX idx_email_low ON users (LOWER(email));`,
          ], { icon: `terminal` }),
        },
        links: {
          bd_gd: makeLink(`bad`, `good`, [`bad`, `good`], { heads: `end`, label: `rewrite` }),
          gd_bt: makeLink(`good`, `bt`, [`good`, `bt`], { heads: `end`, label: `index seek` }),
        },
        flows: [{ route: [`bd_gd`, `gd_bt`], bounce: false, rate: 1.9 }],
      },
    },
    {
      short: `EXISTS vs *`,
      chapter: `tuning`,
      title: `EXISTS vs COUNT(*) > 0 & Avoiding SELECT *`,
      body: [
        `Checking existence with <code>SELECT COUNT(*) FROM orders WHERE user_id = 42</code> scans <strong>all</strong> matching rows. Using <code>EXISTS (SELECT 1 ...)</code> short-circuits at the very first matching tuple!`,
        `Similarly, avoid <code>SELECT *</code> on hot paths: fetching unused wide/TOAST columns destroys <strong>Index Only Scans</strong> and inflates network + buffer I/O.`,
      ],
      callout: { kind: `tip`, text: `EXISTS stops at row #1; COUNT(*) counts every single matching row in the table/index.` },
      metrics: { cost: `0.42..1.10`, rows: `1`, loops: `1`, buffers_hit: `Short-circuit`, execution_time: `0.02ms` },
      scene: {
        entities: {
          cnt: makeBlock(-14, -10, { s: 4.8, h: 54, color: `amber`, glyph: `alert`, label: [`COUNT(*) > 0`], sub: `scans all N` }),
          ex: makeBlock(0, -10, { s: 4.8, h: 54, color: `green`, glyph: `zap`, label: [`EXISTS (1)`], sub: `stops at #1` }),
          out: makeDb(15, -10, { r: 2.2, h: 48, color: `blue`, label: [`True / Row`], sub: `O(1) hit` }),
          card: makePanel({ x: -12, y: 12 }, `Short-Circuit Existence & Narrow Projections`, [
            `-- SLOW: counts all 50,000 orders for user 42`,
            `SELECT COUNT(*) > 0 FROM orders WHERE user_id = 42;`,
            `-- FAST: stops immediately on 1st match`,
            `SELECT EXISTS (SELECT 1 FROM orders WHERE user_id = 42);`,
          ], { icon: `terminal` }),
        },
        links: {
          cn_ex: makeLink(`cnt`, `ex`, [`cnt`, `ex`], { heads: `end`, label: `replace` }),
          ex_ot: makeLink(`ex`, `out`, [`ex`, `out`], { heads: `end`, label: `1st match` }),
        },
        flows: [{ route: [`cn_ex`, `ex_ot`], bounce: false, rate: 2.0 }],
      },
    },
    {
      short: `Stats & Spill`,
      chapter: `tuning`,
      title: `Stale Statistics (Est vs Actual) & work_mem Spill`,
      body: [
        `When <code>EXPLAIN ANALYZE</code> shows <code>rows=5</code> estimated vs <code>actual rows=500000</code>, stale <code>pg_statistic</code> tricked the planner into a Nested Loop instead of a Hash Join — run <code>ANALYZE</code> (or <code>CREATE STATISTICS</code> for correlated columns).`,
        `If you see <code>Sort Method: external merge Disk: 48MB</code>, the query overflowed <code>work_mem</code> (4MB default) and spilled to <code>pgsql_tmp</code> on disk.`,
      ],
      callout: { kind: `insight`, text: `Two red flags in EXPLAIN ANALYZE: >10x Est-vs-Actual row mismatch and "external merge Disk" spill!` },
      metrics: { cost: `120..4500`, rows: `500k fixed`, loops: `1`, buffers_hit: `In-RAM Hash`, execution_time: `18ms` },
      scene: {
        entities: {
          stale: makeBlock(-14, -10, { s: 4.8, h: 54, color: `red`, glyph: `alert`, label: [`Stale Stats`], sub: `est=5 act=500k` }),
          anlz: makeBlock(0, -10, { s: 4.8, h: 54, color: `purple`, glyph: `cpu`, label: [`ANALYZE + Mem`], sub: `work_mem=64MB` }),
          hash: makeDb(15, -10, { r: 2.2, h: 48, color: `green`, label: [`In-RAM Hash`], sub: `0 disk spill` }),
          card: makePanel({ x: -12, y: 12 }, `Fixing Stale Stats & work_mem Disk Spills`, [
            `ANALYZE orders; -- refresh pg_statistic histograms`,
            `CREATE STATISTICS s_city_zip (dependencies) ON city, zip FROM users;`,
            `SET LOCAL work_mem = '64MB'; -- eliminate external merge Disk spill`,
          ], { icon: `terminal` }),
        },
        links: {
          st_an: makeLink(`stale`, `anlz`, [`stale`, `anlz`], { heads: `end`, label: `refresh` }),
          an_hs: makeLink(`anlz`, `hash`, [`anlz`, `hash`], { heads: `end`, label: `0 spill` }),
        },
        flows: [{ route: [`st_an`, `an_hs`], bounce: false, rate: 1.9 }],
      },
    },
  ],
};

export default sqlEngineLesson;
