import {
  makeBlock,
  makeDb,
  makeLink,
  makePanel,
  distinctConcepts,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const sqlExecutionOrderLesson: Lesson = distinctConcepts({
  id: 'sql-execution-order',
  title: 'SQL 7-Step Logical Execution Order & NULL/Pagination Traps',
  summary:
    'Master the universal 7-step SQL logical execution order (FROM/JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT/Window -> DISTINCT -> ORDER BY/LIMIT), NULL 3-valued logic (<=> / IS NOT DISTINCT FROM), and Keyset Pagination.',
  minutes: 14,
  level: 'core',
  metrics: ['exec_step', 'dataset_scope', 'alias_visible', 'tricky_trap'],
  legend: ['flow', ['req', 'row stream'], ['res', 'filtered / sorted'], ['fail', 'alias / NULL trap']],
  goals: [
    { text: '1. FROM & JOIN: build the initial row set', step: 1 },
    { text: '2. WHERE: filter rows & handle NULL 3-valued logic (<=>)', step: 2 },
    { text: '3. GROUP BY: collapse rows into aggregate buckets', step: 3 },
    { text: '4. HAVING: filter groups after aggregation', step: 4 },
    { text: '5. SELECT & Window Functions: compute & bind aliases', step: 5 },
    { text: '6. DISTINCT: deduplicate projected rows', step: 6 },
    { text: '7. ORDER BY & LIMIT vs Keyset Pagination', step: 7 },
  ],
  steps: [
    {
      short: 'FROM/JOIN',
      chapter: 'execution',
      title: 'FROM & JOIN (+ ON): Build Working Row Set',
      body: [
        'Even though we write <code>SELECT</code> first, every SQL engine starts at <code>FROM</code> and <code>JOIN</code>.',
        'It loads base tables, pairs rows via <code>ON</code> predicates (preserving unmatched left rows for <code>LEFT JOIN</code>), and passes that virtual working table downstream.',
      ],
      callout: {
        kind: 'insight',
        text: 'For LEFT JOIN, put filters on the right table inside ON (not WHERE) — otherwise WHERE turns your LEFT JOIN into an INNER JOIN!',
      },
      metrics: { exec_step: 'Step 1: FROM', dataset_scope: 'Joined rows', alias_visible: 'Table aliases', tricky_trap: 'LEFT + WHERE' },
      scene: {
        entities: {
          t1: makeDb(-14, -10, { r: 2.2, h: 48, color: 'blue', label: ['orders (o)'], sub: 'base table' }),
          jn: makeBlock(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'workflow', label: ['LEFT JOIN'], sub: 'ON o.uid=u.id' }),
          t2: makeDb(15, -10, { r: 2.2, h: 48, color: 'cyan', label: ['users (u)'], sub: 'joined table' }),
          card: makePanel({ x: -12, y: 12 }, 'Step 1: FROM & JOIN Execution', [
            '-- Written order: SELECT ... FROM orders JOIN users ...',
            '-- Execution Step 1: FROM orders o LEFT JOIN users u',
            '   ON o.user_id = u.id AND u.active = true;',
          ], { icon: 'terminal' }),
        },
        links: {
          o_jn: makeLink('t1', 'jn', ['t1', 'jn'], { heads: 'end', label: 'stream' }),
          u_jn: makeLink('t2', 'jn', ['t2', 'jn'], { heads: 'end', label: 'ON match' }),
        },
        flows: [{ route: ['o_jn'], kind: 'req', rate: 1.8 }, { route: ['u_jn'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'WHERE & NULL',
      chapter: 'execution',
      title: 'WHERE: Row Filter & NULL 3-Valued Logic (<=>)',
      body: [
        '<code>WHERE</code> filters individual rows <strong>before</strong> grouping or <code>SELECT</code> — which is why <code>SELECT</code> aliases and <code>COUNT()</code> are invalid in <code>WHERE</code>.',
        'SQL uses 3-valued logic (<code>TRUE / FALSE / UNKNOWN</code>). Comparing with <code>NULL</code> (<code>x = NULL</code> or <code>x != 1</code>) yields <code>UNKNOWN</code> and drops the row! Use <code>IS NOT DISTINCT FROM</code> (Postgres) or <code>&lt;=&gt;</code> (MySQL) for NULL-safe equality, and <code>NOT EXISTS</code> instead of <code>NOT IN</code>.',
      ],
      callout: {
        kind: 'warn',
        text: 'MySQL <=> (spaceship) and PostgreSQL IS NOT DISTINCT FROM treat NULL = NULL as TRUE! (Note: in Postgres pgvector, <=> means cosine distance.)',
      },
      changes: ['+ WHERE discards FALSE and UNKNOWN rows', '+ NULL-safe equality: MySQL <=> | Postgres IS NOT DISTINCT FROM'],
      metrics: { exec_step: 'Step 2: WHERE', dataset_scope: 'Row-level', alias_visible: 'No SELECT alias', tricky_trap: 'NULL != x' },
      scene: {
        entities: {
          rows: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Joined Rows'], sub: 'with NULLs' }),
          whr: makeBlock(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'shield', label: ['WHERE Filter'], sub: '3-val logic' }),
          kept: makeBlock(15, -10, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['TRUE Only'], sub: 'UNKNOWN cut' }),
          card: makePanel({ x: -12, y: 12 }, 'NULL-Safe <=> vs IS NOT DISTINCT FROM', [
            '-- BUG: drops rows where status IS NULL!',
            'WHERE status != \'CANCELLED\'',
            '-- FIX (Postgres): WHERE status IS DISTINCT FROM \'CANCELLED\'',
            '-- FIX (MySQL):    WHERE NOT (status <=> \'CANCELLED\')',
          ], { icon: 'terminal' }),
        },
        links: {
          rw_wh: makeLink('rows', 'whr', ['rows', 'whr'], { heads: 'end', label: 'evaluate' }),
          wh_kp: makeLink('whr', 'kept', ['whr', 'kept'], { heads: 'end', label: 'TRUE only' }),
        },
        flows: [{ route: ['rw_wh', 'wh_kp'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'GROUP BY',
      chapter: 'execution',
      title: 'GROUP BY: Collapse Rows into Buckets',
      body: [
        '<code>GROUP BY</code> partitions surviving rows into distinct groups (via HashAggregate or GroupAggregate after Sort) so aggregates like <code>SUM()</code>, <code>COUNT()</code>, and <code>MAX()</code> can compute one value per group.',
        'Every non-aggregated column in <code>SELECT</code> must appear in <code>GROUP BY</code> (or be functionally dependent on its primary key).',
      ],
      callout: {
        kind: 'insight',
        text: 'HashAggregate runs in O(N) memory; if groups exceed work_mem, PostgreSQL falls back to Sort + GroupAggregate.',
      },
      changes: ['+ Rows hashed/sorted into group buckets', '+ Aggregates (COUNT, SUM) become available'],
      metrics: { exec_step: 'Step 3: GROUP BY', dataset_scope: '1 row / group', alias_visible: 'Group keys', tricky_trap: 'Un-grouped col' },
      scene: {
        entities: {
          kept: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Filtered Rows'], sub: 'N rows' }),
          grp: makeBlock(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['HashAggregate'], sub: 'GROUP BY uid' }),
          bkts: makeDb(15, -10, { r: 2.2, h: 48, color: 'blue', label: ['Group Buckets'], sub: 'K groups' }),
          card: makePanel({ x: -12, y: 12 }, 'GROUP BY Collapses N Rows -> K Groups', [
            'GROUP BY user_id',
            '-- Produces 1 summary row per user_id',
            '-- COUNT(*), SUM(total) computed per bucket',
          ], { icon: 'terminal' }),
        },
        links: {
          kp_gr: makeLink('kept', 'grp', ['kept', 'grp'], { heads: 'end', label: 'hash key' }),
          gr_bk: makeLink('grp', 'bkts', ['grp', 'bkts'], { heads: 'end', label: 'aggregate' }),
        },
        flows: [{ route: ['kp_gr', 'gr_bk'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'HAVING',
      chapter: 'execution',
      title: 'HAVING: Filter Groups After Aggregation',
      body: [
        '<code>HAVING</code> filters <strong>groups</strong> produced by <code>GROUP BY</code> using aggregate results (e.g. <code>HAVING COUNT(*) >= 5</code>).',
        'Never put non-aggregate row filters (like <code>user_id = 42</code>) in <code>HAVING</code> — putting them in <code>WHERE</code> drops unwanted rows <em>before</em> expensive grouping!',
      ],
      callout: {
        kind: 'tip',
        text: 'Rule of thumb: WHERE filters rows before GROUP BY; HAVING filters groups after GROUP BY.',
      },
      changes: ['+ HAVING prunes aggregated buckets', '+ Non-aggregate filters belong in WHERE'],
      metrics: { exec_step: 'Step 4: HAVING', dataset_scope: 'Group-level', alias_visible: 'Aggregates', tricky_trap: 'Row filter here' },
      scene: {
        entities: {
          bkts: makeDb(-14, -10, { r: 2.2, h: 48, color: 'blue', label: ['Group Buckets'], sub: 'K groups' }),
          hav: makeBlock(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'shield', label: ['HAVING Filter'], sub: 'COUNT(*) >= 5' }),
          vip: makeBlock(15, -10, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['VIP Groups'], sub: 'qualified' }),
          card: makePanel({ x: -12, y: 12 }, 'WHERE (Rows) vs HAVING (Groups)', [
            'WHERE status = \'PAID\'   -- runs BEFORE GROUP BY (fast!)',
            'GROUP BY user_id',
            'HAVING SUM(total) > 500 -- runs AFTER GROUP BY',
          ], { icon: 'terminal' }),
        },
        links: {
          bk_hv: makeLink('bkts', 'hav', ['bkts', 'hav'], { heads: 'end', label: 'test agg' }),
          hv_vp: makeLink('hav', 'vip', ['hav', 'vip'], { heads: 'end', label: 'pass' }),
        },
        flows: [{ route: ['bk_hv', 'hv_vp'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'SELECT/Win',
      chapter: 'execution',
      title: 'SELECT & Window Functions: Project & Bind Aliases',
      body: [
        'Now the engine evaluates <code>SELECT</code> expressions, <strong>Window Functions</strong> (<code>ROW_NUMBER() OVER (...)</code>, <code>RANK()</code>), and binds output column <strong>aliases</strong>.',
        'Because Window Functions run here (after <code>WHERE/GROUP BY/HAVING</code>), you cannot filter a window result in <code>WHERE</code> — wrap it in a CTE or use <code>QUALIFY</code> (Snowflake/DuckDB/BigQuery).',
      ],
      callout: {
        kind: 'insight',
        text: 'SELECT aliases are born in Step 5 — so Step 7 (ORDER BY) can see them, while Step 2 (WHERE) cannot!',
      },
      changes: ['+ Window functions compute over partitions', '+ SELECT aliases become visible downstream'],
      metrics: { exec_step: 'Step 5: SELECT', dataset_scope: 'Projected cols', alias_visible: 'Aliases born!', tricky_trap: 'Window in WHERE' },
      scene: {
        entities: {
          vip: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['VIP Groups'], sub: 'post-HAVING' }),
          win: makeBlock(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['Window OVER()'], sub: 'RANK / SUM' }),
          proj: makeBlock(15, -10, { s: 4.8, h: 54, color: 'cyan', glyph: 'code', label: ['SELECT Alias'], sub: 'AS total_spent' }),
          card: makePanel({ x: -12, y: 12 }, 'Window Functions & Alias Birth', [
            'SELECT user_id, SUM(total) AS spent,',
            '  RANK() OVER (ORDER BY SUM(total) DESC) AS rnk',
            '-- Cannot do WHERE rnk = 1! Wrap in CTE instead.',
          ], { icon: 'terminal' }),
        },
        links: {
          vp_wn: makeLink('vip', 'win', ['vip', 'win'], { heads: 'end', label: 'partition' }),
          wn_pr: makeLink('win', 'proj', ['win', 'proj'], { heads: 'end', label: 'bind alias' }),
        },
        flows: [{ route: ['vp_wn', 'wn_pr'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'DISTINCT',
      chapter: 'execution',
      title: 'DISTINCT: Deduplicate Projected Output',
      body: [
        '<code>DISTINCT</code> runs <em>after</em> <code>SELECT</code> has evaluated all expressions and aliases, removing duplicate output tuples via Hash or Sort.',
        'Watch out: <code>SELECT DISTINCT</code> on wide rows forces sorting/hashing every selected column — often masking a missing <code>JOIN</code> condition.',
      ],
      callout: {
        kind: 'warn',
        text: 'Using DISTINCT to hide duplicate rows from a bad JOIN wastes CPU — fix the JOIN or use EXISTS instead!',
      },
      changes: ['+ Hash/Sort deduplicates projected rows', '+ Runs before ORDER BY'],
      metrics: { exec_step: 'Step 6: DISTINCT', dataset_scope: 'Unique rows', alias_visible: 'Full SELECT', tricky_trap: 'Hides bad JOIN' },
      scene: {
        entities: {
          proj: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'cyan', glyph: 'code', label: ['Projected Rows'], sub: 'may have dups' }),
          dst: makeBlock(0, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'shield', label: ['DISTINCT'], sub: 'Hash / Sort' }),
          uniq: makeBlock(15, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Unique Tuples'], sub: 'deduped' }),
          card: makePanel({ x: -12, y: 12 }, 'DISTINCT vs Fixing the JOIN', [
            '-- Costly: builds 100k rows then deduplicates',
            'SELECT DISTINCT u.id FROM users u JOIN orders o ON ...',
            '-- Faster: semi-join stops at 1st match!',
            'SELECT u.id FROM users u WHERE EXISTS (SELECT 1 FROM orders o ...)',
          ], { icon: 'terminal' }),
        },
        links: {
          pr_ds: makeLink('proj', 'dst', ['proj', 'dst'], { heads: 'end', label: 'hash/sort' }),
          ds_un: makeLink('dst', 'uniq', ['dst', 'uniq'], { heads: 'end', label: 'unique' }),
        },
        flows: [{ route: ['pr_ds', 'ds_un'], kind: 'req', rate: 1.7 }],
      },
    },
    {
      short: 'ORDER/LIMIT',
      chapter: 'execution',
      title: 'ORDER BY & LIMIT vs Keyset (Cursor) Pagination',
      body: [
        '<code>ORDER BY</code> runs at the very end (so it CAN use <code>SELECT</code> aliases), followed by <code>LIMIT / OFFSET</code>.',
        'Deep <code>OFFSET 100000 LIMIT 20</code> forces the DB to fetch and sort 100,020 rows just to discard 100,000! Replace it with <strong>Keyset Pagination</strong> (<code>WHERE id &gt; last_id ORDER BY id LIMIT 20</code>) for constant $O(\\log n)$ speed on every page.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always include a unique tie-breaker column (like id) in ORDER BY when paginating, otherwise rows can jump between pages!',
      },
      changes: ['+ ORDER BY sorts final set (aliases valid)', '+ Keyset cursor skips OFFSET O(N) discard'],
      metrics: { exec_step: 'Step 7: ORDER', dataset_scope: 'Top-K slice', alias_visible: 'All aliases', tricky_trap: 'Deep OFFSET' },
      scene: {
        entities: {
          uniq: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Unique Rows'], sub: 'unsorted' }),
          ord: makeBlock(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'workflow', label: ['ORDER BY + LIM'], sub: 'Keyset seek' }),
          page: makeDb(15, -10, { r: 2.2, h: 48, color: 'blue', label: ['Page Result'], sub: '20 rows O(logn)' }),
          card: makePanel({ x: -12, y: 12 }, 'Keyset Pagination vs Slow OFFSET', [
            '-- SLOW (reads & discards 100,000 rows!):',
            'SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100000;',
            '-- FAST (O(log n) B-Tree seek on every page):',
            'SELECT * FROM orders WHERE id > :last_id ORDER BY id LIMIT 20;',
          ], { icon: 'terminal' }),
        },
        links: {
          un_or: makeLink('uniq', 'ord', ['uniq', 'ord'], { heads: 'end', label: 'sort/seek' }),
          or_pg: makeLink('ord', 'page', ['ord', 'page'], { heads: 'end', label: 'LIMIT 20' }),
        },
        flows: [{ route: ['un_or', 'or_pg'], kind: 'res', rate: 2.0 }],
      },
    },
  ],
});
