import { makeBlock, makeDb, makeLink, makePanel, cardAt } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage: a controller calls OrderService. In step 2 a proxy slides in between
// (the target moves aside), and every later feature — transactions, @Async,
// @Cacheable, events — is something that proxy does around the same call.
//
//   Controller ── Proxy ── OrderService ── Kafka / Redis
//        Executor ─┘  └─ HikariCP ── Postgres

type Tag = { text: string; tone?: string; icon?: string };

const HUB = { x: -1.5, y: 1.5 };

const caller = (tags: Tag[] = []) =>
  makeBlock(-16, 3, { s: 4.4, h: 50, color: `blue`, glyph: `user`, label: [`Controller`], sub: `HTTP thread`, tags });
const proxy = (tags: Tag[] = []) =>
  makeBlock(HUB.x, HUB.y, { s: 5.2, h: 56, color: `orange`, glyph: `shield`, label: [`Proxy`], sub: `CGLIB subclass`, tags });
const target = (tags: Tag[] = [], at = { x: 10, y: 10 }) =>
  makeBlock(at.x, at.y, { s: 4.4, h: 50, color: `green`, glyph: `code`, label: [`Order`, `Service`], sub: `raw bean`, tags });
const pool = (tags: Tag[] = []) =>
  makeDb(9, -17, { r: 2.2, h: 46, color: `purple`, glyph: `layers`, label: `HikariCP`, tags });
const database = (tags: Tag[] = []) => makeDb(15.5, -7.5, { r: 2.2, h: 46, glyph: `database`, label: `Postgres`, tags });
const exec = (tags: Tag[] = []) =>
  makeBlock(-4.5, -13, { s: 4.4, h: 50, color: `purple`, glyph: `cpu`, label: [`Executor`], sub: `@Async pool`, tags });
const cache = (tags: Tag[] = []) => makeDb(-6, 20, { r: 2.2, h: 46, color: `purple`, glyph: `zap`, label: `Redis`, tags });
const kafka = (tags: Tag[] = []) =>
  makeBlock(-6, 20, { s: 4.4, h: 50, color: `yellow`, glyph: `send`, label: [`Kafka`], sub: `order-events`, tags });

const links = {
  direct: makeLink(`caller`, `target`, [`caller`, `target`], { heads: `both`, label: `place()` }),
  call: makeLink(`caller`, `proxy`, [`caller`, `proxy`], { heads: `both`, label: `place()` }),
  callQuiet: makeLink(`caller`, `proxy`, [`caller`, `proxy`], { heads: `both` }),
  delegate: makeLink(`proxy`, `target`, [`proxy`, `target`], { heads: `both`, label: `proceed()` }),
  delegateQuiet: makeLink(`proxy`, `target`, [`proxy`, `target`], { heads: `both` }),
  borrow: makeLink(`proxy`, `pool`, [`proxy`, `pool`], { heads: `both`, label: `getConnection` }),
  borrowQuiet: makeLink(`proxy`, `pool`, [`proxy`, `pool`], { heads: `both` }),
  conn: makeLink(`pool`, `db`, [`pool`, `db`], { heads: `both` }),
  sql: makeLink(`target`, `db`, [`target`, `db`], { heads: `both`, label: `INSERT` }),
  sqlQuiet: makeLink(`target`, `db`, [`target`, `db`], { heads: `both` }),
  submit: makeLink(`proxy`, `exec`, [`proxy`, `exec`], { label: `submit` }),
  cacheGet: makeLink(`proxy`, `cache`, [`proxy`, `cache`], { heads: `both`, label: `get(42)` }),
  send: makeLink(`target`, `kafka`, [`target`, `kafka`], { label: `send` }),
  relay: makeLink(`db`, `kafka`, [`db`, `kafka`], { label: `outbox relay` }),
};

const card = cardAt({ x: HUB.x, y: HUB.y, dx: -150, dy: -270 }, `code`);

/** Steps 4+: the proxy-guarded call with its database behind it. */
const txStage = (t: { proxy?: Tag[]; target?: Tag[]; pool?: Tag[]; db?: Tag[] } = {}) => ({
  caller: caller(),
  proxy: proxy(t.proxy),
  target: target(t.target),
  pool: pool(t.pool),
  db: database(t.db),
});
const txLinks = { call: links.callQuiet, delegate: links.delegateQuiet, borrow: links.borrowQuiet, conn: links.conn, sql: links.sqlQuiet };

export const javaSpringAopLesson: Lesson = {
  id: 'java-spring-aop',
  title: 'Spring AOP, @Transactional, @Async & Cache',
  summary:
    'One proxy, many features: follow a single OrderService call as Spring wraps it with advice, transactions, async execution, caching and after-commit events — and see where each one breaks.',
  minutes: 16,
  level: 'intermediate',
  metrics: ['proxy', 'tx', 'connections', 'risk'],
  legend: [['req', 'call / begin'], ['res', 'return / commit'], ['write', 'SQL / event'], ['fail', 'rollback / bypass']],
  goals: [
    { text: 'Contrast direct call vs cross-cutting Proxy wrap', step: 1 },
    { text: 'Choose JDK Dynamic Proxy vs CGLIB Subclass', step: 2 },
    { text: 'Execute @Around Advice & ProceedingJoinPoint', step: 3 },
    { text: 'Open JDBC Tx (autoCommit=false) in TxInterceptor', step: 4 },
    { text: 'Commit or Rollback on RuntimeException', step: 5 },
    { text: 'Diagnose Self-Invocation (this.method) Proxy Bypass', step: 6 },
    { text: 'Explain REQUIRED rollbackOnly UnexpectedRollbackEx', step: 7 },
    { text: 'Avoid HikariCP Pool Starvation with REQUIRES_NEW', step: 8 },
    { text: 'Replace default SimpleAsyncTaskExecutor in @Async', step: 9 },
    { text: 'Propagate MDC & SecurityContext via TaskDecorator', step: 10 },
    { text: 'Protect @Cacheable from stampedes with sync=true', step: 11 },
    { text: 'Diagnose phantom events published before DB COMMIT', step: 12 },
    { text: 'Defer side effects via @TransactionalEventListener', step: 13 },
    { text: 'Bridge crash-safe delivery with Transactional Outbox', step: 14 },
  ],
  steps: [
    {
      short: 'Direct',
      chapter: 'problem',
      title: 'A plain call has nowhere to hook',
      body: [
        'Calling a plain object runs the business logic directly. Logging, metrics, security and transactions would all have to be written <em>inside</em> every method.',
        'Spring AOP keeps business classes clean by putting an invisible <strong>proxy</strong> in front of them during bean initialization.',
      ],
      callout: { kind: 'insight', text: 'Spring AOP is proxy-based method interception — unlike AspectJ, it does not rewrite bytecode.' },
      metrics: { proxy: 'none', tx: 'autocommit', connections: 0, risk: 'boilerplate' },
      scene: {
        entities: {
          caller: caller(),
          target: target([{ text: 'log + tx + auth inline', tone: 'red' }], HUB),
          card: card('OrderService.java', [
            'void place(Order o) {',
            '  log.info("start"); tx.begin();',
            '  repo.save(o);',
            '  tx.commit(); metrics.inc(); }',
          ]),
        },
        links: { direct: links.direct },
        flows: [{ route: ['direct'], kind: 'req', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Proxy',
      chapter: 'setup',
      title: 'A proxy steps in front of the bean',
      body: [
        'In <code>postProcessAfterInitialization()</code> Spring sees <code>@Transactional</code> / <code>@Aspect</code> pointcuts and registers a <strong>proxy</strong> instead of the raw bean.',
        'Boot defaults to <strong>CGLIB</strong> (a runtime subclass, <code>OrderService$$SpringCGLIB$$0</code>), so <code>final</code> classes and methods cannot be advised. JDK dynamic proxies only work through an interface.',
      ],
      callout: { kind: 'tip', text: 'Every bean that injects OrderService actually holds the proxy, never the raw target.' },
      changes: ['+ Proxy', '~ OrderService moves behind it'],
      metrics: { proxy: 'CGLIB', tx: 'autocommit', connections: 0, risk: 'final methods' },
      scene: {
        entities: {
          caller: caller(),
          proxy: proxy([{ text: 'extends OrderService', tone: 'amber' }]),
          target: target(),
          card: card('what the context holds', [
            'OrderService svc = ctx.getBean(OrderService.class);',
            'svc.getClass().getSimpleName();',
            '= "OrderService$$SpringCGLIB$$0"',
          ]),
        },
        links: { call: links.call, delegate: links.delegate },
        flows: [{ route: ['call', 'delegate'], kind: 'req', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Advice',
      chapter: 'technique',
      title: '@Around advice and the interceptor chain',
      body: [
        'The proxy runs an ordered chain of <code>MethodInterceptor</code>s — e.g. metrics → security → transaction — before reaching the target.',
        'An <code>@Around</code> advice wraps <code>pjp.proceed()</code>, so it can run code before <em>and</em> after the real method, or skip it entirely.',
      ],
      callout: { kind: 'insight', text: 'Forget pjp.proceed() inside @Around and the real method never runs.' },
      changes: ['~ Proxy runs 3 interceptors in order'],
      metrics: { proxy: '3 advices', tx: 'autocommit', connections: 0, risk: 'order' },
      scene: {
        entities: {
          caller: caller(),
          proxy: proxy([{ text: 'metrics → auth → tx', tone: 'amber', icon: 'listOrdered' }]),
          target: target(),
          card: card('TimingAspect.java', [
            '@Around("@annotation(Timed)")',
            'Object time(ProceedingJoinPoint pjp) throws Throwable {',
            '  long t = System.nanoTime();',
            '  try { return pjp.proceed(); }',
            '  finally { timer.record(System.nanoTime() - t); } }',
          ]),
        },
        links: { call: links.callQuiet, delegate: links.delegate },
        flows: [{ route: ['call', 'delegate'], kind: 'req', rate: 1.4, bounce: true }],
      },
    },
    {
      short: '@Tx',
      chapter: 'technique',
      title: '@Transactional binds one connection to the thread',
      body: [
        '<code>TransactionInterceptor</code> borrows a connection from HikariCP, sets <code>autoCommit = false</code> and binds it to the current thread in <code>TransactionSynchronizationManager</code> (a <code>ThreadLocal</code>).',
        'Every repository called on that thread reuses that same uncommitted connection.',
      ],
      callout: { kind: 'tip', text: 'Keep slow HTTP calls out of @Transactional — the connection stays checked out the whole time.' },
      changes: ['+ HikariCP pool', '+ Postgres', '~ conn #3 bound to this thread'],
      metrics: { proxy: 'TxInterceptor', tx: 'ACTIVE', connections: 1, risk: 'long tx' },
      scene: {
        entities: {
          ...txStage({ pool: [{ text: 'conn #3 → thread', tone: 'violet' }] }),
          card: card('OrderService.java', [
            '@Transactional',
            'public void place(Order o) {',
            '  orders.save(o);      // conn #3',
            '  stock.reserve(o);    // same conn #3',
            '}',
          ]),
        },
        links: { ...txLinks, borrow: links.borrow, sql: links.sql },
        flows: [
          { route: ['borrow'], kind: 'req', rate: 1, bounce: true },
          { route: ['sql'], kind: 'write', rate: 1.4 },
        ],
      },
    },
    {
      short: 'Rollback',
      chapter: 'technique',
      title: 'Commit, or roll back on RuntimeException',
      body: [
        'If the method returns normally the interceptor issues <code>COMMIT</code>. If a <code>RuntimeException</code> or <code>Error</code> escapes, it issues <code>ROLLBACK</code>.',
        'Checked exceptions (like <code>IOException</code>) do <strong>not</strong> roll back unless you set <code>rollbackFor = Exception.class</code>.',
      ],
      callout: { kind: 'warn', text: 'Catching an exception inside @Transactional without rethrowing hides it — Spring will COMMIT the partial writes.' },
      changes: ['~ RuntimeException escaped → ROLLBACK'],
      metrics: { proxy: 'TxInterceptor', tx: 'ROLLBACK', connections: 1, risk: 'checked ex' },
      scene: {
        entities: {
          ...txStage({
            target: [{ text: 'throws StockException', tone: 'red', icon: 'alert' }],
            db: [{ text: 'ROLLBACK', tone: 'red' }],
          }),
          card: card('rollback rules', [
            '@Transactional(rollbackFor = Exception.class)',
            'public void place(Order o) throws IOException {',
            '  orders.save(o);',
            '! throw new StockException(); // → ROLLBACK',
            '}',
          ]),
        },
        links: txLinks,
        flows: [{ route: ['sql'], kind: 'fail', rate: 1.2 }],
      },
    },
    {
      short: 'Self-call',
      chapter: 'problem',
      title: 'this.method() skips the proxy',
      body: [
        'Inside the target, <code>this</code> is the <strong>raw object</strong>, not the proxy. When <code>place()</code> calls <code>this.audit()</code>, the call never passes through the interceptor chain.',
        'So annotations on <code>audit()</code> — <code>@Transactional(REQUIRES_NEW)</code>, <code>@Async</code>, <code>@Cacheable</code> — are silently ignored. Move <code>audit()</code> into another bean.',
      ],
      callout: { kind: 'warn', text: 'Self-invocation is the #1 Spring AOP bug in production.' },
      changes: ['~ this.audit() never reaches the proxy'],
      metrics: { proxy: 'bypassed', tx: 'none for audit', connections: 1, risk: 'self-call' },
      scene: {
        entities: {
          ...txStage({ target: [{ text: 'this.audit() — no proxy', tone: 'red', icon: 'alert' }] }),
          card: card('OrderService.java', [
            'public void place(Order o) {',
            '! this.audit(o); // not intercepted',
            '}',
            '@Transactional(propagation = REQUIRES_NEW)',
            'public void audit(Order o) { … }',
          ]),
        },
        links: txLinks,
        flows: [{ route: ['sql'], kind: 'fail', rate: 1.2 }],
      },
    },
    {
      short: 'Inner ex',
      chapter: 'problem',
      title: 'Catching the inner exception still rolls back',
      body: [
        'With the default <code>Propagation.REQUIRED</code>, the outer and inner methods share <strong>one</strong> transaction. When the inner bean throws, Spring marks it <code>rollbackOnly</code>.',
        'Even if the outer method catches the exception and carries on, the commit fails with <code>UnexpectedRollbackException</code>.',
      ],
      callout: { kind: 'warn', text: 'Catching an exception from a REQUIRED inner bean does not save the outer transaction.' },
      changes: ['~ shared tx marked rollbackOnly'],
      metrics: { proxy: 'TxInterceptor', tx: 'rollbackOnly', connections: 1, risk: 'hidden failure' },
      scene: {
        entities: {
          ...txStage({
            proxy: [{ text: 'rollbackOnly = true', tone: 'red' }],
            db: [{ text: 'UnexpectedRollback', tone: 'red' }],
          }),
          card: card('Outer.place()', [
            '@Transactional public void place(Order o) {',
            '  orders.save(o);',
            '  try { loyalty.award(o); } // REQUIRED',
            '  catch (RuntimeException e) { /* ignored */ }',
            '! } // commit → UnexpectedRollbackException',
          ]),
        },
        links: txLinks,
        flows: [{ route: ['borrow'], kind: 'fail', rate: 1 }],
      },
    },
    {
      short: 'Pool drain',
      chapter: 'problem',
      title: 'REQUIRES_NEW can starve the pool',
      body: [
        '<code>REQUIRES_NEW</code> suspends the outer transaction and checks out a <strong>second</strong> connection on the same thread.',
        'With a pool of 10 and 10 busy threads each holding one connection, all 10 wait for an 11th that never comes — until the 30 s timeout.',
      ],
      callout: { kind: 'warn', text: 'Under load, avoid REQUIRES_NEW or size the pool for 2 connections per concurrent thread.' },
      changes: ['~ pool 10 / 10 in use, 10 threads waiting'],
      metrics: { proxy: 'REQUIRES_NEW', tx: '2 per thread', connections: 10, risk: 'deadlock 30 s' },
      scene: {
        entities: {
          ...txStage({
            proxy: [{ text: 'needs 2nd connection', tone: 'amber' }],
            pool: [{ text: '10 / 10 busy', tone: 'red', icon: 'hourglass' }],
          }),
          card: card('HikariCP log', [
            'HikariPool-1 - Connection is not available,',
            '  request timed out after 30000ms',
            '! (total=10, active=10, idle=0, waiting=10)',
          ]),
        },
        links: txLinks,
        flows: [{ route: ['borrow'], kind: 'fail', rate: 2 }],
      },
    },
    {
      short: '@Async',
      chapter: 'problem',
      title: '@Async without an executor bean',
      body: [
        'With <code>@EnableAsync</code> and no <code>TaskExecutor</code> bean, older Spring versions fell back to <code>SimpleAsyncTaskExecutor</code>: a brand-new thread per call, no queue, no cap.',
        'And <code>@Async</code> is proxy-based too — <code>this.sendEmailAsync()</code> from the same bean runs synchronously.',
      ],
      callout: { kind: 'warn', text: 'Always define a bounded ThreadPoolTaskExecutor (or a virtual-thread executor) for @Async.' },
      changes: ['+ Executor', '~ one new thread per call'],
      metrics: { proxy: 'AsyncInterceptor', tx: 'none', connections: 0, risk: 'thread explosion' },
      scene: {
        entities: {
          caller: caller(),
          proxy: proxy(),
          target: target(),
          pool: pool(),
          db: database(),
          exec: exec([{ text: 'new thread per call', tone: 'red', icon: 'alert' }]),
          card: card('NotificationService.java', [
            '@Async',
            'public void sendEmail(Order o) { … }',
            '! // no executor bean → unbounded threads',
          ]),
        },
        links: { call: links.callQuiet, delegate: links.delegateQuiet, borrow: links.borrowQuiet, conn: links.conn, sql: links.sqlQuiet, submit: links.submit },
        flows: [{ route: ['submit'], kind: 'fail', rate: 2.5 }],
      },
    },
    {
      short: 'Decorator',
      chapter: 'solution',
      title: 'Bounded executor + TaskDecorator',
      body: [
        '<code>MDC</code> (log traceId) and <code>SecurityContextHolder</code> live in <code>ThreadLocal</code>s on the HTTP thread. On the worker thread they are empty.',
        'A <code>TaskDecorator</code> captures them on the caller thread and restores (then clears) them on the worker.',
      ],
      callout: { kind: 'tip', text: 'One TaskDecorator propagates MDC, SecurityContext and tenant context for every @Async task.' },
      changes: ['~ Executor: 8 threads, queue 500', '~ traceId copied to worker'],
      metrics: { proxy: 'AsyncInterceptor', tx: 'none', connections: 0, risk: 'low' },
      scene: {
        entities: {
          caller: caller([{ text: 'traceId=7f3a', tone: 'violet' }]),
          proxy: proxy(),
          target: target(),
          pool: pool(),
          db: database(),
          exec: exec([{ text: '8 threads · traceId=7f3a', tone: 'green' }]),
          card: card('AsyncConfig.java', [
            '@Bean ThreadPoolTaskExecutor asyncExecutor() {',
            '  var ex = new ThreadPoolTaskExecutor();',
            '  ex.setCorePoolSize(8); ex.setQueueCapacity(500);',
            '  ex.setTaskDecorator(new MdcTaskDecorator());',
            '  return ex; }',
          ]),
        },
        links: { call: links.callQuiet, delegate: links.delegateQuiet, borrow: links.borrowQuiet, conn: links.conn, sql: links.sqlQuiet, submit: links.submit },
        flows: [{ route: ['submit'], kind: 'req', rate: 1.2 }],
      },
    },
    {
      short: 'Cache',
      chapter: 'solution',
      title: 'sync = true stops a cache stampede',
      body: [
        'When a hot key expires, 1,000 threads miss together and all hit Postgres — a <strong>cache stampede</strong>.',
        'With <code>@Cacheable(sync = true)</code> only one thread per key loads the value; the other 999 wait for it.',
      ],
      callout: { kind: 'insight', text: '@Cacheable is proxy-based too (no self-calls) and needs serializable DTOs — not JPA entities.' },
      changes: ['− Executor', '+ Redis cache', '~ 1 loader per key'],
      metrics: { proxy: 'CacheInterceptor', tx: 'none', connections: 1, risk: 'low' },
      scene: {
        entities: {
          ...txStage({ db: [{ text: '1 query, not 1,000', tone: 'green' }] }),
          cache: cache([{ text: 'key product::42', tone: 'violet' }]),
          card: card('ProductService.java', [
            '@Cacheable(value = "products",',
            '           key = "#id", sync = true)',
            'public ProductDto find(long id) {',
            '  return repo.findDto(id); }',
          ]),
        },
        links: { ...txLinks, cacheGet: links.cacheGet },
        flows: [
          { route: ['cacheGet'], kind: 'res', rate: 3, bounce: true },
          { route: ['sql'], kind: 'write', rate: 0.4 },
        ],
      },
    },
    {
      short: 'Phantom',
      chapter: 'problem',
      title: 'Kafka fires before the commit',
      body: [
        '<code>place()</code> saves the order, calls <code>kafkaTemplate.send(…)</code>, then throws on the next line.',
        'Postgres <strong>rolls back</strong> — but the event already left. Consumers now process an order that does not exist: a <strong>phantom event</strong>.',
      ],
      callout: { kind: 'warn', text: 'Never fire irreversible side effects (Kafka, email, webhooks) before the transaction commits.' },
      changes: ['− Redis', '+ Kafka', '~ event sent, then ROLLBACK'],
      metrics: { proxy: 'TxInterceptor', tx: 'ROLLBACK', connections: 1, risk: 'phantom event' },
      scene: {
        entities: {
          ...txStage({ db: [{ text: 'ROLLBACK', tone: 'red' }] }),
          kafka: kafka([{ text: 'OrderPlaced #91 (ghost)', tone: 'red', icon: 'alert' }]),
          card: card('OrderService.java', [
            '@Transactional public void place(Order o) {',
            '  orders.save(o);',
            '  kafka.send("order-events", placed(o));',
            '! charge(o); // throws → DB rolls back',
            '}',
          ]),
        },
        links: { ...txLinks, send: links.send },
        flows: [
          { route: ['send'], kind: 'fail', rate: 1.2 },
          { route: ['sql'], kind: 'fail', rate: 1 },
        ],
      },
    },
    {
      short: 'After tx',
      chapter: 'solution',
      title: '@TransactionalEventListener(AFTER_COMMIT)',
      body: [
        'Publish an in-memory event with <code>ApplicationEventPublisher</code> instead of calling Kafka directly.',
        'A listener annotated <code>@TransactionalEventListener(phase = AFTER_COMMIT)</code> runs only if Postgres actually commits.',
      ],
      callout: { kind: 'tip', text: 'If the listener writes to the DB itself, give it @Transactional(REQUIRES_NEW) — the original tx is already finished.' },
      changes: ['~ event held until COMMIT, then sent'],
      metrics: { proxy: 'TxInterceptor', tx: 'COMMIT', connections: 1, risk: 'crash gap' },
      scene: {
        entities: {
          ...txStage({ db: [{ text: 'COMMIT ✓', tone: 'green' }] }),
          kafka: kafka([{ text: 'sent after commit ✓', tone: 'green' }]),
          card: card('OrderEvents.java', [
            'events.publishEvent(new OrderPlaced(o.id()));',
            '',
            '@TransactionalEventListener(phase = AFTER_COMMIT)',
            'void on(OrderPlaced e) { kafka.send("order-events", e); }',
          ]),
        },
        links: { ...txLinks, send: links.send },
        flows: [
          { route: ['sql'], kind: 'write', rate: 1 },
          { route: ['send'], kind: 'res', rate: 0.8 },
        ],
      },
    },
    {
      short: 'Outbox',
      chapter: 'recap',
      title: 'Crash-safe delivery with a transactional outbox',
      body: [
        'AFTER_COMMIT still loses the event if the JVM dies between the commit and <code>send()</code>.',
        'For critical events, insert an <code>outbox</code> row in the <strong>same</strong> transaction as the order; a relay (Debezium CDC or a poller) publishes it to Kafka afterwards. The proxy gave you every one of these behaviours around a single method call.',
      ],
      callout: { kind: 'insight', text: 'Spring Modulith’s @ApplicationModuleListener implements outbox + after-commit listeners out of the box.' },
      changes: ['~ order + outbox row in one tx', '+ relay Postgres → Kafka'],
      metrics: { proxy: 'TxInterceptor', tx: 'COMMIT', connections: 1, risk: 'none' },
      scene: {
        entities: {
          ...txStage({ db: [{ text: 'orders + outbox', tone: 'green' }] }),
          kafka: kafka([{ text: 'at-least-once', tone: 'green' }]),
          card: card('same transaction', [
            'INSERT INTO orders (id, …) VALUES (91, …);',
            'INSERT INTO outbox (aggregate, type, payload)',
            '  VALUES (\'order\', \'OrderPlaced\', \'{"id":91}\');',
            '= COMMIT; -- both or neither',
          ]),
        },
        links: { ...txLinks, relay: links.relay },
        flows: [
          { route: ['sql'], kind: 'write', rate: 1 },
          { route: ['relay'], kind: 'res', rate: 0.9 },
        ],
      },
    },
  ],
};
