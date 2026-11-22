// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
  makeDevice as y,
} from '@/lib/simulator/scene-builders';

export const javaSpringJpaLesson = {
  id: 'java-spring-jpa',
  title: 'Spring Data JPA, Hibernate & The N+1 Select Problem',
  summary: 'Visualize the JPA Persistence Context (1st-level cache, dirty checking), diagnose the notorious N+1 query amplification trap, and resolve it with JOIN FETCH and EntityGraphs.',
  minutes: 10,
  level: 'intermediate',
  metrics: ['persistenceContext', 'queriesFired', 'cacheHitRate', 'fetchStrategy'],
  goals: [
    { text: 'EntityManager 1st-level cache & dirty checking', step: 0 },
    { text: 'The N+1 select query explosion problem', step: 1 },
    { text: 'JOIN FETCH & @EntityGraph single round-trip fix', step: 2 },
  ],
  steps: [
    {
      short: 'Persistence Context',
      chapter: 'technique',
      title: 'EntityManager & 1st-Level Cache: Snapshot Dirty Checking',
      body: [
        'An <code>EntityManager</code> maintains a <b>Persistence Context</b> (First-Level Cache) per transaction.',
        'When an entity is loaded, Hibernate saves a snapshot. During transaction commit, it flushes changes by comparing entity state to the snapshot, generating minimal UPDATE statements automatically without manual saves.',
      ],
      callout: { kind: 'tip', text: 'Entities with identical primary keys loaded inside the same transaction always return the same Java reference (a == b), guaranteeing repeatable reads in memory.' },
      metrics: { persistenceContext: 'Active (Transactional)', queriesFired: '1 SELECT', cacheHitRate: '100% on repeated ID', fetchStrategy: '1st Level Cached' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, '1st-Level Cache & Dirty Checking', [
            '@Transactional',
            'public void updateEmail(Long id, String email) {',
            '= User user = entityManager.find(User.class, id); // 1st-level cache hit',
            '= user.setEmail(email); // Mutates managed entity in memory',
            '# No repo.save() needed: Hibernate takes initial snapshot,',
            '= // Automatically executes UPDATE sql on transaction commit flush',
            '}',
          ]),
          app:   y(-12, -4, { label: 'Application Code', tags: [{ text: 'user.setName("New")', icon: 'code' }] }),
          ctx:   d(-2, -4,  { h: 52, color: 'blue', glyph: 'layers', label: ['Entity', 'Manager'], sub: '1st Level Cache' }),
          db:    b(10, -4,  { label: 'PostgreSQL DB', tags: [{ text: 'auto UPDATE at commit', tone: 'green' }] }),
        },
        links: {
          ac: h('app', 'ctx', ['app', 'ctx'], { label: 'mutate entity', heads: 'end' }),
          cd: h('ctx', 'db', ['ctx', 'db'], { label: 'flush & dirty check', heads: 'end' }),
        },
        flows: [
          { route: ['ac', 'cd'], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: 'N+1 Problem',
      chapter: 'tradeoff',
      title: 'The N+1 Select Problem: 1 Parent Query Spawns N Child Queries',
      body: [
        'When fetching a list of N <code>Order</code> entities with lazy-loaded <code>items</code>, Hibernate executes 1 query for the orders.',
        'When a loop iterates through <code>order.getItems()</code>, Hibernate fires a separate individual query for EACH order. With 1,000 orders, your app fires <b>1,001 SQL queries</b>, bringing the database to its knees.',
      ],
      callout: { kind: 'warn', text: 'Eager loading (FetchType.EAGER) is NOT the solution — it causes the same N+1 queries or massive cartesian product joins across unrelated queries.' },
      metrics: { persistenceContext: 'Flooded', queriesFired: '1 + N Queries (101 SQLs)', cacheHitRate: '0% on lazy proxies', fetchStrategy: 'FetchType.LAZY Loop' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'The N+1 Select Query Trap', [
            '// 1 query fetches 100 Authors:',
            '= List<Author> authors = authorRepo.findAll(); // Query 1',
            'for (Author a : authors) {',
            '! // LAZY loading fires 1 query per author: 100 extra queries!',
            '! System.out.println(a.getBooks().size()); // Queries 2..101',
            '}',
            '! Total queries: 1 + 100 = 101 queries! DB latency explodes!',
          ]),
          loop:  y(-12, -4, { label: 'Order Loop', tags: [{ text: 'for (o : orders) o.getItems()', icon: 'zap' }] }),
          hib:   d(-2, -4,  { color: 'rose', glyph: 'alertTriangle', label: ['Hibernate'], sub: 'N Queries' }),
          db:    b(10, -4,  { label: 'PostgreSQL DB', cpu: 0.95, tags: [{ text: '101 Round Trips!', tone: 'bad' }] }),
        },
        links: {
          lh: h('loop', 'hib', ['loop', 'hib'], { label: 'iterate items', heads: 'end' }),
          hd: h('hib', 'db', ['hib', 'db'], { label: 'SELECT * FROM items WHERE order_id=?', heads: 'end' }),
        },
        flows: [
          { route: ['lh', 'hd'], bounce: false, rate: 2.2 },
        ],
      },
    },
    {
      short: 'JOIN FETCH Fix',
      chapter: 'solution',
      title: 'Resolution: JOIN FETCH & @EntityGraph in 1 Single Round Trip',
      body: [
        'By specifying <code>SELECT o FROM Order o JOIN FETCH o.items</code> or annotating with <code>@EntityGraph(attributePaths = {"items"})</code>, Hibernate loads parents and children in a single SQL JOIN.',
        'Alternatively, <code>default_batch_fetch_size: 50</code> consolidates child loading into batch <code>WHERE order_id IN (?, ?, ...)</code> statements, reducing 100 queries to just 2.',
      ],
      callout: { kind: 'tip', text: 'Always use JOIN FETCH or @EntityGraph for specific read use-cases while keeping default entity mapping strictly FetchType.LAZY.' },
      metrics: { persistenceContext: 'Optimized', queriesFired: '1 Single SQL Join', cacheHitRate: 'Instant Association', fetchStrategy: 'JOIN FETCH / Batch IN' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Resolution: JOIN FETCH / @EntityGraph', [
            'public interface AuthorRepository extends JpaRepository<Author, Long> {',
            '= // Executes single SQL JOIN query fetching Author AND Books:',
            '= @Query("SELECT a FROM Author a JOIN FETCH a.books WHERE a.active = true")',
            '= List<Author> findAllWithBooks();',
            '# Or via @EntityGraph(attributePaths = {"books"})',
            '= // Total queries: EXACTLY 1 QUERY! Zero N+1 overhead!',
            '}',
          ]),
          repo:  y(-12, -4, { label: 'Repository Call', tags: [{ text: 'findAllWithItems()', icon: 'zap' }] }),
          opt:   d(-2, -4,  { color: 'green', glyph: 'check', label: ['JOIN FETCH'], sub: '1 SQL Query' }),
          db:    b(10, -4,  { label: 'PostgreSQL DB', cpu: 0.15, tags: [{ text: '1 Query (Fast)', tone: 'green' }] }),
        },
        links: {
          ro: h('repo', 'opt', ['repo', 'opt'], { label: 'fetch with items', heads: 'end' }),
          od: h('opt', 'db', ['opt', 'db'], { label: 'SELECT o, i FROM orders o JOIN items i', heads: 'end' }),
        },
        flows: [
          { route: ['ro', 'od'], bounce: false, rate: 1.2 },
        ],
      },
    },
  ],
};

export default javaSpringJpaLesson;
