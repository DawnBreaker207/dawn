import {
  makeBlock,
  makeDb,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const sqlComplexQueriesLesson: Lesson = {
  id: 'sql-complex-queries',
  title: 'Complex SQL: UNION, Subquery, 20+ Joins & Temporal Tables',
  summary:
    'Master UNION vs UNION ALL, Correlated Subqueries vs Window/Joins, CTE Materialization, breaking 20+ table join explosions with TEMP TABLE + ANALYZE, Materialized Views, and SQL:2011 Temporal Tables.',
  minutes: 15,
  level: 'advanced',
  metrics: ['set_op', 'planner_mode', 'temp_strategy', 'history_model'],
  legend: ['flow', ['req', 'scan / join'], ['res', 'optimized plan'], ['fail', 'sort / GEQO trap']],
  goals: [
    { text: 'Contrast UNION (Sort/Hash dedup) vs UNION ALL', step: 1 },
    { text: 'Eliminate O(N^2) Correlated Subqueries', step: 2 },
    { text: 'Control CTE MATERIALIZED vs Inlining (PG 12+)', step: 3 },
    { text: 'Tame 20+ Table Joins (GEQO + TEMP TABLE + ANALYZE)', step: 4 },
    { text: 'Precompute Heavy Joins with Materialized Views', step: 5 },
    { text: 'Model Time-Travel Data with Temporal Tables', step: 6 },
  ],
  steps: [
    {
      short: 'UNION vs ALL',
      chapter: 'sets',
      title: 'UNION (Dedup Sort/Hash) vs UNION ALL (Append)',
      body: [
        '<code>UNION</code> merges two result sets and runs a full <strong>HashAggregate / Sort Unique</strong> pass to eliminate duplicates — consuming heavy CPU and <code>work_mem</code>.',
        '<code>UNION ALL</code> simply executes a streaming <code>Append</code> node with zero deduplication. Use <code>UNION ALL</code> by default whenever sets are disjoint or duplicates are fine.',
      ],
      callout: {
        kind: 'tip',
        text: 'Same applies to INTERSECT / EXCEPT: they implicitly deduplicate unless you append ALL (INTERSECT ALL).',
      },
      metrics: { set_op: 'UNION ALL', planner_mode: 'Append', temp_strategy: '0 work_mem', history_model: 'N/A' },
      scene: {
        entities: {
          q1: makeDb(-14, -15, { r: 2.1, h: 46, color: 'blue', label: ['SELECT A'], sub: '50k rows' }),
          q2: makeDb(-14, -1, { r: 2.1, h: 46, color: 'cyan', label: ['SELECT B'], sub: '50k rows' }),
          app: makeBlock(1, -8, { s: 4.8, h: 54, color: 'green', glyph: 'workflow', label: ['Append (ALL)'], sub: 'O(1) stream' }),
          dedup: makeBlock(15, -8, { s: 4.8, h: 54, color: 'amber', glyph: 'alert', label: ['UNION Unique'], sub: 'extra Sort/Hash' }),
          card: makePanel({ x: -12, y: 12 }, 'UNION vs UNION ALL Execution Plan', [
            '-- UNION: Append -> HashAggregate / Sort Unique (expensive!)',
            'SELECT id FROM archive_2025 UNION SELECT id FROM archive_2026;',
            '-- UNION ALL: pure Append (zero memory overhead!)',
            'SELECT id FROM archive_2025 UNION ALL SELECT id FROM archive_2026;',
          ], { icon: 'terminal' }),
        },
        links: {
          a_ap: makeLink('q1', 'app', ['q1', 'app'], { heads: 'end', label: 'stream A' }),
          b_ap: makeLink('q2', 'app', ['q2', 'app'], { heads: 'end', label: 'stream B' }),
          ap_dd: makeLink('app', 'dedup', ['app', 'dedup'], { heads: 'end', label: 'if UNION', style: 'dashed' }),
        },
        flows: [{ route: ['a_ap'], kind: 'res', rate: 1.9 }, { route: ['b_ap'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Subqueries',
      chapter: 'subquery',
      title: 'Correlated Subquery O(N^2) vs Window / JOIN',
      body: [
        'A <strong>Correlated Subquery</strong> references a column from the outer query. If the planner cannot decorrelate it into a Hash Semi-Join, it executes once <em>per outer row</em> ($O(N^2)$)!',
        'Rewrite correlated aggregates into a single-pass <code>JOIN</code> or <strong>Window Function</strong> (<code>AVG(total) OVER (PARTITION BY user_id)</code>).',
      ],
      callout: {
        kind: 'warn',
        text: 'Watch for SubPlan in EXPLAIN ANALYZE — that is PostgreSQL telling you a correlated subquery is looping per outer row!',
      },
      changes: ['+ Correlated SubPlan loops per outer row', '+ Window Function / JOIN computes in 1 pass'],
      metrics: { set_op: 'Decorrelate', planner_mode: 'Window / Hash', temp_strategy: 'Single pass', history_model: 'N/A' },
      scene: {
        entities: {
          outer: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['SubPlan Loop'], sub: 'O(N^2) per row' }),
          win: makeBlock(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['Window / JOIN'], sub: '1-pass Hash' }),
          res: makeDb(15, -10, { r: 2.2, h: 48, color: 'blue', label: ['Fast Output'], sub: 'O(N) linear' }),
          card: makePanel({ x: -12, y: 12 }, 'Rewriting Correlated Subquery to Window', [
            '-- SLOW (SubPlan runs per order row):',
            'SELECT * FROM orders o WHERE total > (SELECT AVG(total) FROM orders x WHERE x.uid = o.uid);',
            '-- FAST (1-pass Window Function):',
            'SELECT * FROM (SELECT *, AVG(total) OVER (PARTITION BY uid) avg_t FROM orders) t WHERE total > avg_t;',
          ], { icon: 'terminal' }),
        },
        links: {
          ot_wn: makeLink('outer', 'win', ['outer', 'win'], { heads: 'end', label: 'rewrite' }),
          wn_rs: makeLink('win', 'res', ['win', 'res'], { heads: 'end', label: '1-pass' }),
        },
        flows: [{ route: ['ot_wn', 'wn_rs'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'CTE Fence',
      chapter: 'cte',
      title: 'CTE (WITH): MATERIALIZED vs Inlining (PG 12+)',
      body: [
        'Before PostgreSQL 12, every <code>WITH cte AS (...)</code> acted as an <strong>optimization fence</strong> — materializing the entire CTE into memory before the outer <code>WHERE</code> could push predicates down.',
        'Since PG 12+, non-recursive, side-effect-free CTEs are <strong>inlined</strong> automatically. When a CTE is referenced multiple times and expensive to recompute, force <code>AS MATERIALIZED</code> explicitly.',
      ],
      callout: {
        kind: 'insight',
        text: 'Use AS NOT MATERIALIZED to let outer WHERE use indexes; use AS MATERIALIZED to compute an expensive CTE once.',
      },
      changes: ['+ PG 12+ inlines single-use CTEs by default', '+ MATERIALIZED caches multi-ref CTEs'],
      metrics: { set_op: 'WITH CTE', planner_mode: 'Inline / Fence', temp_strategy: 'Tuplestore opt', history_model: 'Recursive OK' },
      scene: {
        entities: {
          cte: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'code', label: ['WITH cte AS'], sub: 'PG 12+ rule' }),
          inl: makeBlock(1, -16, { s: 4.6, h: 52, color: 'green', glyph: 'zap', label: ['Inlined'], sub: 'push WHERE' }),
          mat: makeDb(1, -2, { r: 2.2, h: 48, color: 'blue', label: ['MATERIALIZED'], sub: 'tuplestore 1x' }),
          card: makePanel({ x: -12, y: 12 }, 'Controlling CTE Optimization Fences', [
            '-- Push outer WHERE into CTE (default PG 12+):',
            'WITH active AS NOT MATERIALIZED (SELECT * FROM users WHERE active)',
            '-- Force single-eval cache when referenced 3+ times:',
            'WITH agg AS MATERIALIZED (SELECT uid, SUM(amt) FROM orders GROUP BY 1)',
          ], { icon: 'terminal' }),
        },
        links: {
          ct_in: makeLink('cte', 'inl', ['cte', 'inl'], { heads: 'end', label: '1 ref' }),
          ct_mt: makeLink('cte', 'mat', ['cte', 'mat'], { heads: 'end', label: 'N refs' }),
        },
        flows: [{ route: ['ct_in'], kind: 'res', rate: 1.8 }, { route: ['ct_mt'], kind: 'req', rate: 1.6 }],
      },
    },
    {
      short: '20+ Joins/Temp',
      chapter: 'scale',
      title: 'Joining 20+ Tables: GEQO & TEMP TABLE + ANALYZE',
      body: [
        'Join permutations explode factorially ($N!$). Above <code>geqo_threshold = 12</code> (and <code>join_collapse_limit = 8</code>), PostgreSQL abandons exhaustive planning for a genetic heuristic (<strong>GEQO</strong>) — often picking terrible join orders on 20+ table reports.',
        'Production fix: break the 20-table monster into 2–3 stages using <code>CREATE TEMP TABLE stage_1 AS ...</code>, add an index, and run <strong><code>ANALYZE stage_1</code></strong> so the planner gets real cardinality stats!',
      ],
      callout: {
        kind: 'tip',
        text: 'Never forget ANALYZE on a TEMP TABLE! Autovacuum does NOT analyze temp tables, so without manual ANALYZE the planner guesses defaults.',
      },
      changes: ['+ Avoid GEQO (>12 tables) by staging into TEMP TABLE', '+ Manual ANALYZE gives exact histograms for Stage 2'],
      metrics: { set_op: '20+ Tables', planner_mode: 'GEQO Bypassed', temp_strategy: 'TEMP + ANALYZE', history_model: 'Session local' },
      scene: {
        entities: {
          t20: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['20+ Table Join'], sub: 'GEQO (>12)' }),
          tmp: makeDb(0, -10, { r: 2.3, h: 50, color: 'amber', label: ['TEMP TABLE'], sub: '+ INDEX + STATS' }),
          fin: makeBlock(15, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['Stage 2 Plan'], sub: 'exact stats' }),
          card: makePanel({ x: -12, y: 12 }, 'Breaking 20+ Table Joins with TEMP TABLE', [
            'CREATE TEMP TABLE tmp_orders ON COMMIT DROP AS',
            '  SELECT o.id, o.uid, c.tier FROM orders o JOIN ... (8 tables);',
            'CREATE INDEX ON tmp_orders (uid);',
            'ANALYZE tmp_orders; -- CRITICAL: autovacuum skips temp tables!',
            'SELECT * FROM tmp_orders t JOIN ... (remaining tables);',
          ], { icon: 'terminal' }),
        },
        links: {
          t_tm: makeLink('t20', 'tmp', ['t20', 'tmp'], { heads: 'end', label: 'stage 1' }),
          tm_fn: makeLink('tmp', 'fin', ['tmp', 'fin'], { heads: 'end', label: 'ANALYZE' }),
        },
        flows: [{ route: ['t_tm', 'tm_fn'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Mat Views',
      chapter: 'scale',
      title: 'Precomputing Reports with Materialized Views',
      body: [
        'A regular <code>VIEW</code> re-executes the underlying 20-table query on every request. A <strong>Materialized View</strong> persists the result on disk with its own B-Tree indexes.',
        'Always create a <code>UNIQUE INDEX</code> on the Materialized View so you can run <code>REFRESH MATERIALIZED VIEW CONCURRENTLY</code> without blocking dashboard readers!',
      ],
      callout: {
        kind: 'insight',
        text: 'REFRESH MATERIALIZED VIEW without CONCURRENTLY acquires an AccessExclusiveLock that blocks all SELECTs until refresh finishes.',
      },
      changes: ['+ Materialized View persists heavy join on disk', '+ CONCURRENTLY refreshes without blocking reads'],
      metrics: { set_op: 'Mat View', planner_mode: 'Direct B-Tree', temp_strategy: 'Persisted', history_model: 'Snapshot' },
      scene: {
        entities: {
          mv: makeDb(-14, -10, { r: 2.2, h: 48, color: 'purple', label: ['Mat View'], sub: 'UNIQUE INDEX' }),
          ref: makeBlock(0, -10, { s: 4.8, h: 54, color: 'cyan', glyph: 'workflow', label: ['REFRESH'], sub: 'CONCURRENTLY' }),
          dash: makeBlock(15, -10, { s: 4.8, h: 54, color: 'green', glyph: 'server', label: ['BI Dashboard'], sub: '0-block reads' }),
          card: makePanel({ x: -12, y: 12 }, 'Zero-Downtime Materialized View Refresh', [
            'CREATE MATERIALIZED VIEW mv_daily_sales AS SELECT ...;',
            'CREATE UNIQUE INDEX idx_mv_day ON mv_daily_sales (day, org_id);',
            '-- Non-blocking background refresh (diff-based):',
            'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;',
          ], { icon: 'terminal' }),
        },
        links: {
          mv_rf: makeLink('mv', 'ref', ['mv', 'ref'], { heads: 'end', label: 'diff sync' }),
          rf_ds: makeLink('ref', 'dash', ['ref', 'dash'], { heads: 'end', label: 'sub-ms read' }),
        },
        flows: [{ route: ['mv_rf', 'rf_ds'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Temporal Table',
      chapter: 'temporal',
      title: 'Temporal Tables (System-Versioned & Time-Travel)',
      body: [
        'Unlike temporary tables (short-lived session scratchpads), <strong>Temporal Tables</strong> (SQL:2011) track the full valid-time or system-versioned history of every row via <code>valid_from</code> / <code>valid_to</code> (<code>tstzrange</code>).',
        'In PostgreSQL, combine <code>tstzrange</code> with <code>EXCLUDE USING GIST (product_id WITH =, valid_during WITH &&)</code> to guarantee non-overlapping price histories and query any past point in time.',
      ],
      callout: {
        kind: 'insight',
        text: 'Temporal != Temporary! Temporary = session scratchpad; Temporal = time-travel history (FOR SYSTEM_TIME AS OF).',
      },
      changes: ['+ tstzrange + GiST exclusion prevents overlapping ranges', '+ Point-in-time AS OF queries audit historical state'],
      metrics: { set_op: 'Temporal', planner_mode: 'GiST Range', temp_strategy: 'Append history', history_model: 'Time-Travel' },
      scene: {
        entities: {
          hist: makeDb(-14, -10, { r: 2.2, h: 48, color: 'blue', label: ['Price History'], sub: 'tstzrange' }),
          gist: makeBlock(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['GiST Exclude'], sub: 'no overlap' }),
          asof: makeBlock(15, -10, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['AS OF Query'], sub: '2026-01-01' }),
          card: makePanel({ x: -12, y: 12 }, 'Temporal Table & Point-in-Time Query', [
            'CREATE TABLE price_history (sku TEXT, price NUMERIC, valid TSTZRANGE,',
            '  EXCLUDE USING GIST (sku WITH =, valid WITH &&));',
            '-- Time-travel query (what was price on Jan 1?):',
            'SELECT price FROM price_history WHERE sku=\'A1\' AND valid @> \'2026-01-01\'::timestamptz;',
          ], { icon: 'terminal' }),
        },
        links: {
          hs_gs: makeLink('hist', 'gist', ['hist', 'gist'], { heads: 'end', label: 'enforce' }),
          gs_as: makeLink('gist', 'asof', ['gist', 'asof'], { heads: 'end', label: 'AS OF @>' }),
        },
        flows: [{ route: ['hs_gs', 'gs_as'], kind: 'res', rate: 1.8 }],
      },
    },
  ],
};
