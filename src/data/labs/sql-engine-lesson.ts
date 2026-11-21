// Static WorkbenchLesson for the SQL Engine Pipeline tab.
// 5 steps = the 5 universal phases every PostgreSQL query walks:
//   Parse → Analyze → Plan → Execute → Commit
// Preset-specific details (buffer slots, WAL, lock types) live in the
// Engine State card and are updated at runtime by the EnginePipeline script.

import type { WorkbenchLesson } from '@/types/workbench';

export const engineLesson: WorkbenchLesson = {
  title: 'PostgreSQL Engine Pipeline',
  subtitle: 'Parse → Analyze → Plan → Execute → Commit',
  steps: [
    {
      title: 'Lexical & Syntactic Analysis (Parse)',
      short: 'Parse',
      body: [
        'The lexer tokenises the SQL text into keywords, identifiers and literals. The parser checks the token stream against PostgreSQL grammar and builds a raw ParseTree AST.',
        'No catalog lookup happens here — Parse only validates syntax. A malformed query dies here with a syntax error before touching any table.',
      ],
      why: 'Separating syntax from semantics lets the parse phase run with zero I/O. Catalog lookups are expensive (catalog pages must be in shared_buffers); deferring them to Analyze means a syntax error costs nothing.',
      metrics: { 'Phase': 'Parse', 'Catalog': 'none', 'Typical': '< 0.1 ms' },
    },
    {
      title: 'Semantic Analysis (Analyze)',
      short: 'Analyze',
      body: [
        'The analyzer resolves names to OIDs: "users" → pg_class OID 16384, column types from pg_attribute, constraint references from pg_constraint.',
        'At least one AccessShareLock (or RowExclusiveLock for DML) is acquired on each referenced relation. Lock is held until Commit.',
      ],
      why: 'OIDs are stable internal identifiers. Resolving "users" once here, rather than every time the planner or executor needs it, avoids repeated catalog scans inside a single query.',
      metrics: { 'Phase': 'Analyze', 'Catalog': '1–3 bufs', 'Lock': 'AccessShare' },
    },
    {
      title: 'Query Planning & Optimization (Plan)',
      short: 'Plan',
      body: [
        'The planner generates candidate access paths (SeqScan, IndexScan, BitmapScan, nested-loop / hash / merge join) and cost-estimates each path. The cheapest plan wins.',
        'Statistics (pg_statistic) inform cardinality estimates. Poor estimates are the most common cause of bad plans.',
      ],
      why: 'Planner cost is a small fraction of execution time for OLTP queries, but it can dominate for ad-hoc analytics. That is why prepared statements cache the plan — plan once, execute many.',
      metrics: { 'Phase': 'Plan', 'Catalog': 'pg_stat', 'Cost': 'seq × rows' },
    },
    {
      title: 'Executor — Volcano Model',
      short: 'Execute',
      body: [
        'The executor walks the plan tree top-down calling Init → Next → End on each node. Each Next() pulls one tuple from its child — the Volcano (pull) model.',
        'Buffer manager pins pages in shared_buffers. Index scans probe the B-tree and fetch heap pages. Hash joins build a hash table in work_mem then probe it.',
      ],
      why: 'The Volcano model means no large intermediate materialisation for pipelineable operators (filter, project, nested loop). Only sort and hash must buffer their entire input, which is why they can spill to temp files.',
      metrics: { 'Phase': 'Execute', 'Model': 'Volcano/pull', 'Memory': 'work_mem' },
    },
    {
      title: 'Commit & Durability',
      short: 'Commit',
      body: [
        'DML writes append WAL records first (write-ahead log). On commit, the WAL buffer is flushed to disk via fsync(). The heap page write can be deferred.',
        'Shared locks are released. Buffer pins are dropped. For read-only queries commit is a no-op — no WAL, no fsync.',
      ],
      why: 'WAL-first guarantees atomicity and durability (ACID D) even if the server crashes mid-write: on restart PostgreSQL replays the WAL from the last checkpoint to recover committed transactions.',
      metrics: { 'Phase': 'Commit', 'WAL': 'fsync on commit', 'Locks': 'released' },
    },
  ],
  goals: [
    { text: 'Trace a SELECT from text to result rows', step: 1 },
    { text: 'Know what catalog pages are accessed and what locks are held', step: 2 },
    { text: 'Read a cost estimate and explain why a plan was chosen', step: 3 },
    { text: 'Understand the Volcano pull model and when it materialises', step: 4 },
    { text: 'Explain WAL-first and why fsync matters for durability', step: 5 },
  ],
};
