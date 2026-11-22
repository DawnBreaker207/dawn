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

export const sqlEngineLesson = {
  id: `sql-engine`,
  title: `SQL Query Engine Pipeline`,
  summary: `Follow a SQL query through parse, analyze, plan, execute, and commit — with buffer pool, WAL, and lock management.`,
  minutes: 10,
  level: `intermediate`,
  metrics: [`stage`, `buffers`, `wal`, `locks`],
  goals: [
    { text: `How the parser turns SQL text into an AST`, step: 1 },
    { text: 'How the analyzer resolves names', step: 2 },
    { text: 'How the planner chooses Seq', step: 3 },
    { text: 'Buffer pool, WAL write, and', step: 4 },
    { text: 'WAL flush, fsync, and lock', step: 5 },
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
          client: y(-10, 0, { label: `client`, tags: [{ text: `SELECT …`, icon: `code` }] }),
          parser: d(2,   0, { color: `blue`,   glyph: `code`, label: [`Parser`, `AST`] }),
        },
        links: {
          cp: h(`client`, `parser`, [`client`, `parser`], { label: `SQL text`, heads: `end` }),
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
          parser:   d(-8, 0,  { color: `blue`,   glyph: `code`, label: [`Parser`, `AST`] }),
          analyzer: d(4,  0,  { color: `purple`, glyph: `code`, label: [`Analyzer`, `type-check`] }),
          catalog:  b(4,  10, { label: [`System`, `Catalog`] }),
        },
        links: {
          pa: h(`parser`,   `analyzer`, [`parser`,   `analyzer`], { label: `AST`,    heads: `end` }),
          ac: h(`analyzer`, `catalog`,  [`analyzer`, `catalog`],  { label: `lookup`, heads: `both` }),
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
          planner: d(-6, 4,  { color: `purple`, glyph: `code`,   label: [`Planner`, `cost model`] }),
          stats:   d(8, -8,  { color: `blue`,   glyph: `chart`,  label: [`Statistics`, `pg_stats`] }),
          seqscan: d(8,  2,  { color: `yellow`, glyph: `layers`, label: [`Seq Scan`, `10 000 rows`] }),
          idxscan: d(8,  10, { color: `green`,  glyph: `zap`,    label: [`Index Scan`, `12 rows ✓`] }),
        },
        links: {
          ps: h(`planner`, `stats`,   [`planner`, `stats`],   { label: `read stats`, heads: `both` }),
          p1: h(`planner`, `seqscan`, [`planner`, `seqscan`], { label: `cost: 420`,  heads: `end`, style: `dashed` }),
          p2: h(`planner`, `idxscan`, [`planner`, `idxscan`], { label: `cost: 0.3`,  heads: `end` }),
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
          executor: d(-8, 2,   { color: `green`,  glyph: `code`,   label: [`Executor`, `pull model`] }),
          bufpool:  d(8, -6,   { color: `blue`,   glyph: `layers`, label: [`Buffer Pool`, `8KB pages`] }),
          lock_mgr: d(8,  4,   { color: `orange`, glyph: `lock`,   label: [`Lock Mgr`, `RowShareLock`] }),
          disk:     b(18, -6,  { label: [`Disk`, `heap + index`] }),
        },
        links: {
          eb: h(`executor`, `bufpool`,  [`executor`, `bufpool`],  { label: `fetch page`, heads: `both` }),
          el: h(`executor`, `lock_mgr`, [`executor`, `lock_mgr`], { label: `acquire`,    heads: `end` }),
          bd: h(`bufpool`,  `disk`,     [`bufpool`,  `disk`],     { label: `cache miss`, heads: `both`, style: `dashed` }),
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
          executor: d(-10, 2, { color: `green`,  glyph: `code`,  label: [`Executor`, `COMMIT`] }),
          wal:      b(6, -6,  { label: [`WAL`, `pg_wal`] }),
          disk:     b(6,  6,  { label: [`Heap`, `data files`] }),
          done:     d(18, 0,  { color: `green`,  glyph: `check`, label: [`Client`, `OK`] }),
        },
        links: {
          ew:  h(`executor`, `wal`,  [`executor`, `wal`],  { label: `fsync WAL`,         heads: `end` }),
          ed:  h(`executor`, `disk`, [`executor`, `disk`], { label: `dirty pages (lazy)`, heads: `end`, style: `dashed` }),
          ret: h(`executor`, `done`, [`executor`, `done`], { label: `COMMIT OK`,         heads: `end` }),
        },
        flows: [{ route: [`ew`, `ret`], bounce: false, rate: 1.3 }],
      },
    },
  ],
};

export default sqlEngineLesson;
