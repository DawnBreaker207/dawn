/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaSpringJpaLesson: Lesson = {
  id: 'java-spring-jpa',
  title: 'Spring Data JPA, Hibernate Persistence Context & N+1',
  summary:
    'Trace JPA/Hibernate from JpaRepository queries into the L1 Persistence Context, Dirty Checking write-behind flush, LAZY Proxy N+1 explosions, and JOIN FETCH / DTO fixes.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['l1_context', 'sql_queries', 'entity_state', 'performance'],
  legend: ['flow', ['req', 'query / load'], ['res', 'flush / 1-query'], ['fail', 'N+1 explosion']],
  goals: [
    { text: 'Route JpaRepository call into EntityManager L1 Cache', step: 1 },
    { text: 'Track Managed Entity snapshots in Persistence Context', step: 2 },
    { text: 'Trigger Dirty Checking & Write-Behind Flush at commit', step: 3 },
    { text: 'Diagnose LAZY Proxy N+1 query explosion', step: 4 },
    { text: 'Collapse N+1 to 1 query via JOIN FETCH / EntityGraph', step: 5 },
    { text: 'Use Read-Only DTO Projections for zero dirty-check cost', step: 6 },
  ],
  steps: [
    {
      short: 'JpaRepository',
      chapter: 'jpa',
      title: '1. JpaRepository & EntityManager L1 Lookup',
      body: [
        'Spring Data generates a proxy implementing <code>OrderRepository</code> and delegates to Hibernate’s <code>EntityManager</code>.',
        'Before hitting the database, Hibernate checks the transaction-scoped <strong>L1 Persistence Context</strong>: repeated <code>findById(42)</code> calls in the same transaction return the exact same Java instance.',
      ],
      callout: {
        kind: 'insight',
        text: 'Persistence Context is a transaction-scoped L1 identity map (1st-level cache) — it is ON by default.',
      },
      metrics: { l1_context: 'Identity Map', sql_queries: '1 SELECT', entity_state: 'Managed', performance: 'L1 hit = 0 SQL' },
      scene: {
        entities: {
          repo: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['OrderRepo'], sub: 'findById(42)' }),
          em: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['EntityManager'], sub: 'L1 Cache' }),
          db: b(14, -10, { r: 2.2, h: 48, color: 'blue', label: ['Postgres DB'], sub: 'SELECT ...' }),
          card: S({ x: -12, y: 12 }, '1. EntityManager L1 Persistence Context', [
            'Order a = orderRepo.findById(42L).orElseThrow();',
            'Order b = orderRepo.findById(42L).orElseThrow();',
            '// a == b is TRUE! Second call hits L1 Cache (0 SQL)',
          ], { icon: 'terminal' }),
        },
        links: {
          rp_em: h('repo', 'em', ['repo', 'em'], { heads: 'end', label: 'check L1' }),
          em_db: h('em', 'db', ['em', 'db'], { heads: 'end', label: 'miss -> SQL' }),
        },
        flows: [{ route: ['rp_em', 'em_db'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Dirty Check',
      chapter: 'jpa',
      title: '2. Managed State & Automatic Dirty Checking',
      body: [
        'When an entity enters the Persistence Context, Hibernate saves a <strong>baseline snapshot</strong> of its fields.',
        'If you mutate <code>order.setStatus("PAID")</code> inside <code>@Transactional</code>, you do NOT even need to call <code>save()</code> — Hibernate detects the diff automatically!',
      ],
      callout: {
        kind: 'tip',
        text: 'Because Hibernate keeps snapshots of every Managed entity, loading 50,000 rows in one TX eats huge RAM and CPU.',
      },
      changes: ['+ Baseline snapshot stored in L1', '+ Mutating setter marks entity dirty'],
      metrics: { l1_context: 'Snapshot Diff', sql_queries: 'Deferred', entity_state: 'Dirty', performance: 'RAM snapshot' },
      scene: {
        entities: {
          em: d(-14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['L1 Snapshot'], sub: 'status=NEW' }),
          ent: d(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['Order Entity'], sub: 'status=PAID' }),
          diff: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['Dirty Checker'], sub: 'diff detected' }),
          card: S({ x: -12, y: 12 }, '2. Dirty Checking Without Explicit save()', [
            '@Transactional',
            'public void markPaid(Long id) {',
            '  Order o = repo.findById(id).orElseThrow();',
            '  o.setStatus("PAID"); // Dirty! No repo.save() needed',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          em_en: h('em', 'ent', ['em', 'ent'], { heads: 'end', label: 'track' }),
          en_df: h('ent', 'diff', ['ent', 'diff'], { heads: 'end', label: 'compare' }),
        },
        flows: [{ route: ['em_en', 'en_df'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Write-Behind',
      chapter: 'jpa',
      title: '3. Write-Behind Flush Before Commit',
      body: [
        'Hibernate batches SQL <code>INSERT</code> / <code>UPDATE</code> / <code>DELETE</code> statements and delays sending them to Postgres until <strong>flush</strong> (at TX commit or before a JPQL query).',
        'Write-behind minimizes DB lock duration and enables JDBC statement batching.',
      ],
      callout: {
        kind: 'insight',
        text: 'Entity IDs using GenerationType.IDENTITY force immediate INSERT on persist(), disabling JDBC insert batching — prefer SEQUENCE.',
      },
      changes: ['+ SQL queued until TX flush()', '+ Batched UPDATE sent before COMMIT'],
      metrics: { l1_context: 'Flushed', sql_queries: 'Batched DML', entity_state: 'Synced', performance: 'Short DB lock' },
      scene: {
        entities: {
          diff: d(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['ActionQueue'], sub: 'batched SQL' }),
          flush: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['TX Flush'], sub: 'before commit' }),
          db: b(14, -10, { r: 2.2, h: 48, color: 'blue', label: ['Postgres DB'], sub: 'UPDATE + CMT' }),
          card: S({ x: -12, y: 12 }, '3. Write-Behind Flush Order', [
            '// Hibernate flushes ActionQueue in strict order:',
            '// 1. Inserts  2. Updates  3. Collection deletes',
            '// Sent right before JDBC COMMIT',
            '// Use @SequenceGenerator for JDBC batch_size!',
          ], { icon: 'terminal' }),
        },
        links: {
          df_fl: h('diff', 'flush', ['diff', 'flush'], { heads: 'end', label: 'flush()' }),
          fl_db: h('flush', 'db', ['flush', 'db'], { heads: 'end', label: 'UPDATE' }),
        },
        flows: [{ route: ['df_fl', 'fl_db'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'N+1 Problem',
      chapter: 'nplus1',
      title: '4. LAZY Proxy & The N+1 Query Explosion',
      body: [
        '<code>findAll()</code> executes <strong>1 query</strong> for 100 Orders. Each order’s <code>@OneToMany items</code> is a Hibernate <strong>LAZY Proxy</strong>.',
        'Looping over <code>order.getItems()</code> fires <strong>100 extra SQL queries</strong> (1 + N)! With OSIV enabled, this even leaks queries into Jackson JSON serialization.',
      ],
      callout: {
        kind: 'warn',
        text: 'Disable spring.jpa.open-in-view=false in production so lazy-loading bugs fail fast in dev instead of stalling HTTP threads.',
      },
      changes: ['+ 1 query loads 100 Orders', '+ Loop fires 100 lazy SELECTs!'],
      metrics: { l1_context: 'Lazy Proxies', sql_queries: '1 + N (101!)', entity_state: 'Proxy hit', performance: 'Slow N+1' },
      scene: {
        entities: {
          loop: d(-14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['for (Order o)'], sub: 'o.getItems()' }),
          px: d(0, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Lazy Proxy'], sub: '100x triggers' }),
          db: b(14, -10, { r: 2.2, h: 48, color: 'red', label: ['Postgres DB'], sub: '101 queries!' }),
          card: S({ x: -12, y: 12 }, '4. The N+1 Query Explosion', [
            'List<Order> orders = repo.findAll(); // 1 SQL query',
            'for (Order o : orders) {',
            '  o.getItems().size(); // +1 SQL per order -> 101 total!',
            '} // Set spring.jpa.open-in-view=false',
          ], { icon: 'terminal' }),
        },
        links: {
          lp_px: h('loop', 'px', ['loop', 'px'], { heads: 'end', label: 'getItems()' }),
          px_db: h('px', 'db', ['px', 'db'], { heads: 'end', label: 'N SELECTs' }),
        },
        flows: [{ route: ['lp_px', 'px_db'], kind: 'fail', rate: 2.4 }],
      },
    },
    {
      short: 'JOIN FETCH',
      chapter: 'nplus1',
      title: '5. Fixing N+1 with JOIN FETCH / @EntityGraph',
      body: [
        'Use JPQL <code>JOIN FETCH</code> or <code>@EntityGraph(attributePaths = "items")</code> to fetch Orders and their Items in a <strong>single SQL JOIN</strong>.',
        'Be careful not to combine <code>JOIN FETCH</code> on a collection with <code>Pageable</code> — Hibernate will paginate in memory (<code>HHH90003004</code> warning)!',
      ],
      callout: {
        kind: 'tip',
        text: 'For paginated parent+child lists, fetch page IDs first, then JOIN FETCH WHERE o.id IN :ids.',
      },
      changes: ['+ @EntityGraph emits 1 SQL JOIN', '+ Collapses 101 round-trips -> 1'],
      metrics: { l1_context: 'Hydrated', sql_queries: '1 JOIN SQL', entity_state: 'Eager graph', performance: '100x faster' },
      scene: {
        entities: {
          repo: d(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['@EntityGraph'], sub: 'JOIN FETCH' }),
          em: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['EntityManager'], sub: 'hydrate all' }),
          db: b(14, -10, { r: 2.2, h: 48, color: 'green', label: ['Postgres DB'], sub: '1 JOIN query' }),
          card: S({ x: -12, y: 12 }, '5. Collapsing N+1 into 1 Query', [
            '@EntityGraph(attributePaths = "items")',
            '@Query("SELECT o FROM Order o WHERE o.status = :st")',
            'List<Order> findWithItems(String st);',
            '// Executes 1 LEFT JOIN SQL -> 0 lazy triggers!',
          ], { icon: 'terminal' }),
        },
        links: {
          rp_em: h('repo', 'em', ['repo', 'em'], { heads: 'end', label: '1 request' }),
          em_db: h('em', 'db', ['em', 'db'], { heads: 'end', label: 'LEFT JOIN' }),
        },
        flows: [{ route: ['rp_em', 'em_db'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'DTO Projection',
      chapter: 'jpa',
      title: '6. Read-Only DTO Projections (Zero L1 Overhead)',
      body: [
        'For read-only API endpoints and dashboards, skip Managed Entities completely and select directly into a Java <code>record</code> DTO.',
        'Hibernate selects only the needed columns, skips L1 snapshot allocation, and skips dirty-checking at commit.',
      ],
      callout: {
        kind: 'insight',
        text: 'Rule of thumb: Entities for write commands (dirty checking); DTO projections / jOOQ for read queries.',
      },
      changes: ['+ Select directly into Java record DTO', '+ Zero L1 snapshots or dirty checks'],
      metrics: { l1_context: 'Bypassed', sql_queries: 'Slim SELECT', entity_state: 'Read-only DTO', performance: 'Optimal RAM' },
      scene: {
        entities: {
          repo: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Query DTO'], sub: 'new OrderView' }),
          db: b(0, -10, { r: 2.2, h: 48, color: 'blue', label: ['Postgres DB'], sub: '2 cols only' }),
          dto: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['OrderView'], sub: 'no L1 snapshot' }),
          card: S({ x: -12, y: 12 }, '6. Fast Read-Only Record Projection', [
            'public record OrderView(Long id, BigDecimal total) {}',
            '@Query("SELECT new com.app.OrderView(o.id, o.total) FROM Order o")',
            'List<OrderView> listSummaries();',
            '// 0 L1 snapshots, 0 dirty-check CPU, minimal columns!',
          ], { icon: 'terminal' }),
        },
        links: {
          rp_db: h('repo', 'db', ['repo', 'db'], { heads: 'end', label: 'select cols' }),
          db_dt: h('db', 'dto', ['db', 'dto'], { heads: 'end', label: 'record' }),
        },
        flows: [{ route: ['rp_db', 'db_dt'], kind: 'res', rate: 2.1 }],
      },
    },
  ],
};
