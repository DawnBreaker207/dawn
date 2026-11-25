/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaSpringAopLesson: Lesson = {
  id: 'java-spring-aop',
  title: 'Spring AOP, @Transactional, @Async & Cache',
  summary:
    'Master JDK/CGLIB Proxies, Self-Invocation trap, @Transactional propagation/rollback, plus @Async thread pools, @Cacheable & @TransactionalEventListener.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['proxy_layer', 'tx_status', 'jdbc_conn', 'pitfall'],
  legend: ['flow', ['req', 'intercept / begin'], ['res', 'commit / return'], ['fail', 'rollback / starve']],
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
      short: 'Direct Call',
      chapter: 'aop',
      title: '1. Direct Method Call (No Cross-Cutting Proxy)',
      body: [
        'Calling a plain target object executes business logic directly with no place to hook logging, metrics, security, or database transactions without polluting business code.',
        'Spring AOP keeps business classes clean by wrapping them in an invisible <strong>Proxy</strong> during bean initialization.',
      ],
      callout: {
        kind: 'insight',
        text: 'Spring AOP is proxy-based (method interception), unlike AspectJ bytecode weaving.',
      },
      metrics: { proxy_layer: 'None', tx_status: 'AutoCommit', jdbc_conn: 'Direct', pitfall: 'Boilerplate' },
      scene: {
        entities: {
          caller: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Controller'], sub: 'calls service' }),
          target: d(2, -6, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['OrderService'], sub: 'raw target' }),
          card: S({ x: -12, y: 12 }, '1. Without AOP Proxy', [
            '// Without AOP: transaction boilerplate everywhere',
            'conn.setAutoCommit(false);',
            'try { saveOrder(); conn.commit(); }',
            'catch (Exception e) { conn.rollback(); }',
          ], { icon: 'terminal' }),
        },
        links: {
          c_t: h('caller', 'target', ['caller', 'target'], { heads: 'end', label: 'direct()' }),
        },
        flows: [{ route: ['c_t'], kind: 'req', rate: 1.7 }],
      },
    },
    {
      short: 'AOP Proxy',
      chapter: 'aop',
      title: '2. Wrapping Target with JDK / CGLIB Proxy',
      body: [
        'In <code>postProcessAfterInitialization()</code>, Spring detects <code>@Aspect</code> / <code>@Transactional</code> pointcuts and returns a <strong>Proxy</strong> instead of the raw bean.',
        'Spring Boot defaults to <strong>CGLIB</strong> (subclassing <code>OrderService$$SpringCGLIB</code>), so <code>final</code> classes or methods cannot be proxied.',
      ],
      callout: {
        kind: 'tip',
        text: 'Injected beans in other services hold a reference to the Proxy, not the raw target instance.',
      },
      changes: ['+ CGLIB Proxy wraps OrderService bean', '+ Caller now invokes Proxy first'],
      metrics: { proxy_layer: 'CGLIB Proxy', tx_status: 'Intercepted', jdbc_conn: 'Managed', pitfall: 'No final' },
      scene: {
        entities: {
          caller: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Controller'], sub: 'holds proxy' }),
          proxy: d(0, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['CGLIB Proxy'], sub: '$$SpringCGLIB' }),
          target: d(0, 0, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Target Bean'], sub: 'real method' }),
          card: S({ x: -12, y: 12 }, '2. Spring Boot Proxy Generation', [
            '// Default in Spring Boot: proxyTargetClass = true',
            'OrderService$$SpringCGLIB extends OrderService',
            '// Requirements: non-final class, non-final method',
          ], { icon: 'terminal' }),
        },
        links: {
          c_px: h('caller', 'proxy', ['caller', 'proxy'], { heads: 'end', label: 'placeOrder' }),
          px_tg: h('proxy', 'target', ['proxy', 'target'], { heads: 'end', label: 'delegate' }),
        },
        flows: [{ route: ['c_px', 'px_tg'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: '@Around Chain',
      chapter: 'aop',
      title: '3. @Around Advice & Interceptor Chain',
      body: [
        'The proxy dispatches calls through an ordered <code>MethodInterceptor</code> chain (e.g., Metrics → Security → Transaction).',
        'An <code>@Around</code> advice wraps <code>pjp.proceed()</code>, running code both before and after the target method.',
      ],
      callout: {
        kind: 'insight',
        text: 'Forgetting to call pjp.proceed() inside @Around blocks the real method from ever running.',
      },
      changes: ['+ MethodInterceptor chain executes', '+ pjp.proceed() invokes target'],
      metrics: { proxy_layer: 'Advice Chain', tx_status: 'Wrapped', jdbc_conn: 'Managed', pitfall: 'Order matters' },
      scene: {
        entities: {
          px: d(-14, 0, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['AOP Proxy'], sub: 'entry' }),
          adv: d(-14, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['@Around Advice'], sub: 'pjp.proceed()' }),
          target: d(0, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Target Bean'], sub: 'executes' }),
          card: S({ x: -12, y: 12 }, '3. @Around Aspect Execution', [
            '@Around("@annotation(Timed)")',
            'Object measure(ProceedingJoinPoint pjp) throws Throwable {',
            '  long t0 = System.nanoTime();',
            '  try { return pjp.proceed(); } finally { log(t0); }',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          px_ad: h('px', 'adv', ['px', 'adv'], { heads: 'end', label: 'before' }),
          ad_tg: h('adv', 'target', ['adv', 'target'], { heads: 'end', label: 'proceed()' }),
        },
        flows: [{ route: ['px_ad', 'ad_tg'], kind: 'req', rate: 1.9 }],
      },
    },
    {
      short: '@Transactional',
      chapter: 'tx',
      title: '4. @Transactional & TransactionSynchronizationManager',
      body: [
        '<code>TransactionInterceptor</code> borrows a JDBC Connection from HikariCP, sets <code>autoCommit = false</code>, and binds it to the current thread via <code>ThreadLocal</code> in <code>TransactionSynchronizationManager</code>.',
        'All repositories called on that thread share the exact same uncommitted Connection.',
      ],
      callout: {
        kind: 'tip',
        text: 'Keep external HTTP calls OUT of @Transactional — holding a HikariCP connection during slow API calls starves the pool.',
      },
      changes: ['+ TxInterceptor sets autoCommit=false', '+ Connection bound to ThreadLocal'],
      metrics: { proxy_layer: 'TxInterceptor', tx_status: 'ACTIVE', jdbc_conn: 'ThreadLocal', pitfall: 'Hold conn long' },
      scene: {
        entities: {
          tx: d(-14, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['TxInterceptor'], sub: 'autoCommit=0' }),
          target: d(0, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['OrderService'], sub: 'shared conn' }),
          db: b(0, 0, { r: 2.2, h: 48, color: 'green', label: ['Postgres DB'], sub: 'BEGIN TX' }),
          card: S({ x: -12, y: 12 }, '4. Opening Declarative Transaction', [
            '@Transactional(propagation = Propagation.REQUIRED)',
            'public void placeOrder(OrderReq req) {',
            '  orderRepo.save(req.toOrder()); // uses ThreadLocal conn',
            '  ledgerRepo.debit(req.userId()); // same JDBC TX!',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          tx_tg: h('tx', 'target', ['tx', 'target'], { heads: 'end', label: 'bind conn' }),
          tg_db: h('target', 'db', ['target', 'db'], { heads: 'end', label: 'SQL writes' }),
        },
        flows: [{ route: ['tx_tg', 'tg_db'], kind: 'req', rate: 2.0 }],
      },
    },
    {
      short: 'Commit/Rollback',
      chapter: 'tx',
      title: '5. Commit vs RuntimeException Rollback Rules',
      body: [
        'If the target returns normally, <code>TxInterceptor</code> issues <code>COMMIT</code>. If an unchecked <code>RuntimeException</code> or <code>Error</code> escapes, it issues <code>ROLLBACK</code>.',
        'By default, <strong>checked exceptions</strong> (like <code>IOException</code>) do NOT roll back unless <code>rollbackFor = Exception.class</code> is set!',
      ],
      callout: {
        kind: 'warn',
        text: 'Catching an exception inside @Transactional without rethrowing hides it from TxInterceptor — Spring will COMMIT partial writes!',
      },
      changes: ['+ Normal return -> COMMIT', '+ RuntimeException -> ROLLBACK'],
      metrics: { proxy_layer: 'TxInterceptor', tx_status: 'COMMIT / RLBK', jdbc_conn: 'Released', pitfall: 'Checked ex' },
      scene: {
        entities: {
          tx: d(-12, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['TxInterceptor'], sub: 'try / catch' }),
          commit: b(2, -14, { r: 2.2, h: 48, color: 'green', label: ['COMMIT'], sub: 'normal return' }),
          rlbk: b(2, -2, { r: 2.2, h: 48, color: 'red', label: ['ROLLBACK'], sub: 'RuntimeEx' }),
          card: S({ x: -12, y: 12 }, '5. Spring Rollback Semantics', [
            '// Default: rolls back ONLY on RuntimeException / Error',
            '@Transactional(rollbackFor = Exception.class)',
            'public void pay() throws PaymentCheckedException {',
            '  // now checked exceptions also trigger ROLLBACK',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          tx_cm: h('tx', 'commit', ['tx', 'commit'], { heads: 'end', label: 'commit' }),
          tx_rb: h('tx', 'rlbk', ['tx', 'rlbk'], { heads: 'end', label: 'ex -> rollback' }),
        },
        flows: [{ route: ['tx_cm'], kind: 'res', rate: 1.8 }, { route: ['tx_rb'], kind: 'fail', rate: 1.4 }],
      },
    },
    {
      short: 'Self-Invocation',
      chapter: 'tx',
      title: '6. Self-Invocation Pitfall (this.method() Bypass)',
      body: [
        'When <code>methodA()</code> on the target calls <code>this.methodB()</code>, <code>this</code> refers to the <strong>raw target</strong>, NOT the Spring Proxy!',
        'Annotations on <code>methodB()</code> (<code>@Transactional</code>, <code>@Async</code>, <code>@Cacheable</code>) are silently ignored. Fix by extracting <code>methodB()</code> into a separate Spring bean.',
      ],
      callout: {
        kind: 'warn',
        text: 'Self-invocation (this.methodB()) is the #1 Spring AOP / @Transactional bug in production.',
      },
      changes: ['+ this.methodB() bypasses AOP Proxy', '+ Extract separate bean to restore Proxy'],
      metrics: { proxy_layer: 'BYPASSED!', tx_status: 'No TX started', jdbc_conn: 'AutoCommit', pitfall: 'Self-call' },
      scene: {
        entities: {
          px: d(-14, 0, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['AOP Proxy'], sub: 'bypassed!' }),
          mA: d(-14, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['this.methodA'], sub: 'raw target' }),
          mB: d(0, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['this.methodB'], sub: '@Tx ignored!' }),
          card: S({ x: -12, y: 12 }, '6. Self-Invocation Bypasses the Proxy', [
            'public void methodA() {',
            '  this.methodB(); // "this" is raw target, NOT proxy!',
            '}',
            '@Transactional public void methodB() { /* NO TX! */ }',
            '// Fix: inject HelperBean and call helper.methodB()',
          ], { icon: 'terminal' }),
        },
        links: {
          px_a: h('px', 'mA', ['px', 'mA'], { heads: 'end', label: 'enter' }),
          a_b: h('mA', 'mB', ['mA', 'mB'], { heads: 'end', label: 'this.call()' }),
        },
        flows: [{ route: ['px_a'], kind: 'req', rate: 1.6 }, { route: ['a_b'], kind: 'fail', rate: 1.8 }],
      },
    },
    {
      short: 'REQUIRED Trap',
      chapter: 'tx',
      title: '7. Why Catching Inner Exception Still Rolls Back',
      body: [
        'With default <code>Propagation.REQUIRED</code>, Outer and Inner share <strong>one JDBC Connection</strong>. If Inner throws a <code>RuntimeException</code>, Spring marks the shared TX <code>rollbackOnly = true</code>.',
        'Even if Outer catches the exception and continues, Outer explodes with <code>UnexpectedRollbackException</code> at commit!',
      ],
      callout: {
        kind: 'warn',
        text: 'Catching an exception from a REQUIRED inner bean does NOT save the outer TX — use REQUIRES_NEW or noRollbackFor if intentional.',
      },
      changes: ['+ Outer & Inner share 1 ThreadLocal TX', '+ Inner RuntimeEx sets rollbackOnly=true'],
      metrics: { proxy_layer: 'TxInterceptor', tx_status: 'rollbackOnly!', jdbc_conn: '1 Shared', pitfall: 'UnexpectedRlbk' },
      scene: {
        entities: {
          outer: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Outer @Tx'], sub: 'catches ex' }),
          inner: d(0, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['Inner @Tx'], sub: 'throws Runtime' }),
          db: b(0, 0, { r: 2.2, h: 48, color: 'red', label: ['RollbackOnly'], sub: 'UnexpectedEx' }),
          card: S({ x: -12, y: 12 }, '7. Propagation.REQUIRED Shared Rollback', [
            '// Outer REQUIRED + Inner REQUIRED = 1 shared TX!',
            'try { innerService.riskyOp(); } catch (Exception ignored) {}',
            '// Inner already marked TX rollbackOnly=true!',
            '// At Outer exit -> UnexpectedRollbackException!',
          ], { icon: 'terminal' }),
        },
        links: {
          ot_in: h('outer', 'inner', ['outer', 'inner'], { heads: 'end', label: 'share conn' }),
          in_db: h('inner', 'db', ['inner', 'db'], { heads: 'end', label: 'mark rollback' }),
        },
        flows: [{ route: ['ot_in', 'in_db'], kind: 'fail', rate: 1.8 }],
      },
    },
    {
      short: 'REQUIRES_NEW',
      chapter: 'tx',
      title: '8. REQUIRES_NEW & HikariCP Starvation Deadlock',
      body: [
        '<code>REQUIRES_NEW</code> suspends Outer’s Connection and checks out a <strong>2nd HikariCP Connection</strong> on the same thread.',
        'If HikariCP pool size is 10 and 10 concurrent threads enter Outer then call <code>REQUIRES_NEW</code>, all 10 hang waiting for an 11th connection until 30s timeout!',
      ],
      callout: {
        kind: 'warn',
        text: 'Avoid REQUIRES_NEW under high concurrency — prefer @TransactionalEventListener(AFTER_COMMIT) or size pool >= 2 * maxThreads.',
      },
      changes: ['+ Suspends conn #1 & borrows conn #2', '+ Pool=10 with 10 callers = deadlock!'],
      metrics: { proxy_layer: 'REQUIRES_NEW', tx_status: '2 TX / thread', jdbc_conn: 'Pool Starve!', pitfall: '30s timeout' },
      scene: {
        entities: {
          th: d(-14, 0, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['10 Callers'], sub: 'hold 10 conns' }),
          pool: b(-14, -14, { r: 2.2, h: 48, color: 'red', label: ['HikariCP (10)'], sub: '0 free conns!' }),
          wait: d(0, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['30s Timeout'], sub: 'pool deadlock' }),
          card: S({ x: -12, y: 12 }, '8. Why REQUIRES_NEW Deadlocks Small Pools', [
            '@Transactional(propagation = Propagation.REQUIRES_NEW)',
            '// Suspends conn #1 -> needs conn #2 from HikariCP!',
            '// If pool=10 & 10 Outer TXs active -> 0 free -> HANG!',
          ], { icon: 'terminal' }),
        },
        links: {
          th_pl: h('th', 'pool', ['th', 'pool'], { heads: 'end', label: 'ask conn #2' }),
          pl_wt: h('pool', 'wait', ['pool', 'wait'], { heads: 'end', label: 'hangs 30s' }),
        },
        flows: [{ route: ['th_pl', 'pl_wt'], kind: 'fail', rate: 1.8 }],
      },
    },
{
      short: '@Async Pool',
      chapter: 'async',
      title: '9. Why @Async Without an Executor Bean Is Dangerous',
      body: [
        'Adding <code>@EnableAsync</code> without configuring a <code>ThreadPoolTaskExecutor</code> bean falls back to <code>SimpleAsyncTaskExecutor</code> — which spawns a <strong>brand-new OS thread per call</strong> with no queue or cap!',
        'Also, <code>@Async</code> uses Spring AOP Proxy: calling <code>this.sendEmailAsync()</code> from the same bean runs synchronously on the caller thread!',
      ],
      callout: {
        kind: 'warn',
        text: 'Always define a bounded ThreadPoolTaskExecutor (or VirtualThread executor) bean and return CompletableFuture / void from @Async.',
      },
      metrics: { async_exec: 'Bounded Pool', context_prop: 'Not copied!', cache_guard: 'N/A', event_phase: 'Immediate' },
      scene: {
        entities: {
          bad: d(-14, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['SimpleAsync'], sub: 'unbounded OS!' }),
          good: d(0, -14, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['TaskExecutor'], sub: 'bounded pool' }),
          px: d(0, 0, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['@Async Proxy'], sub: 'no self-call' }),
          card: S({ x: -12, y: 12 }, '1. Configuring a Safe Bounded @Async Pool', [
            '@Bean Executor taskExecutor() {',
            '  var ex = new ThreadPoolTaskExecutor();',
            '  ex.setCorePoolSize(8); ex.setMaxPoolSize(16);',
            '  ex.setQueueCapacity(200); return ex;',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          bd_gd: h('bad', 'good', ['bad', 'good'], { heads: 'end', label: 'replace' }),
          gd_px: h('good', 'px', ['good', 'px'], { heads: 'end', label: 'runs @Async' }),
        },
        flows: [{ route: ['bd_gd', 'gd_px'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'TaskDecorator',
      chapter: 'async',
      title: '10. Why @Async Loses MDC traceId & SecurityContext',
      body: [
        '<code>MDC</code> (log traceId) and <code>SecurityContextHolder</code> store data in <code>ThreadLocal</code> on the HTTP thread.',
        'When <code>@Async</code> hands work to a worker thread, those <code>ThreadLocal</code>s are <code>null</code>! Implement <code>TaskDecorator</code> to capture them on the HTTP thread and restore/clear them in <code>finally</code> on the worker.',
      ],
      callout: {
        kind: 'tip',
        text: 'TaskDecorator is the cleanest single hook to propagate MDC, SecurityContext, and TenantContext across all @Async tasks.',
      },
      changes: ['+ Captures ThreadLocals on HTTP thread', '+ Restores & clears in worker finally'],
      metrics: { async_exec: 'Bounded Pool', context_prop: 'TaskDecorator', cache_guard: 'N/A', event_phase: 'Trace intact' },
      scene: {
        entities: {
          http: d(-14, 0, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['HTTP Thread'], sub: 'MDC + SecCtx' }),
          dec: d(-14, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['TaskDecorator'], sub: 'copy -> clear' }),
          wrk: d(0, -14, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['Worker Thread'], sub: 'traceId intact' }),
          card: S({ x: -12, y: 12 }, '2. Copying ThreadLocals via TaskDecorator', [
            'ex.setTaskDecorator(runnable -> {',
            '  var mdc = MDC.getCopyOfContextMap();',
            '  var sec = SecurityContextHolder.getContext();',
            '  return () -> { try { set(mdc, sec); runnable.run(); }',
            '                 finally { MDC.clear(); clearSec(); } };',
            '});',
          ], { icon: 'terminal' }),
        },
        links: {
          ht_dc: h('http', 'dec', ['http', 'dec'], { heads: 'end', label: 'capture' }),
          dc_wk: h('dec', 'wrk', ['dec', 'wrk'], { heads: 'end', label: 'restore' }),
        },
        flows: [{ route: ['ht_dc', 'dc_wk'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: '@Cacheable',
      chapter: 'cache',
      title: '11. @Cacheable Stampede Protection (sync = true)',
      body: [
        'When a hot Redis cache key expires, 1,000 concurrent threads miss the cache and hammer Postgres simultaneously (<strong>Cache Stampede / Thundering Herd</strong>).',
        'Setting <code>@Cacheable(value = "products", key = "#id", sync = true)</code> lets ONLY 1 thread per key query the DB while the other 999 wait for the populated value!',
      ],
      callout: {
        kind: 'insight',
        text: 'Like @Transactional, @Cacheable uses AOP Proxy (no self-calls!) and requires Redis-serializable DTOs (not JPA Entities!).',
      },
      changes: ['+ sync=true locks per-key on cache miss', '+ Prevents DB thundering herd'],
      metrics: { async_exec: 'Bounded Pool', context_prop: 'TaskDecorator', cache_guard: 'sync=true', event_phase: '1 DB query' },
      scene: {
        entities: {
          reqs: d(-14, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['1000 Misses'], sub: 'same key #42' }),
          sync: d(0, -14, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['@Cacheable'], sub: 'sync = true' }),
          db: b(0, 0, { r: 2.2, h: 48, color: 'blue', label: ['Postgres DB'], sub: '1 query only!' }),
          card: S({ x: -12, y: 12 }, '3. Preventing Cache Stampedes in Spring', [
            '@Cacheable(cacheNames = "catalog", key = "#id", sync = true)',
            'public ProductDto findById(Long id) {',
            '  return repo.findDto(id); // 1 thread runs, 999 share!',
            '} // Note: return DTO, never a LAZY JPA @Entity!',
          ], { icon: 'terminal' }),
        },
        links: {
          rq_sy: h('reqs', 'sync', ['reqs', 'sync'], { heads: 'end', label: 'coalesce' }),
          sy_db: h('sync', 'db', ['sync', 'db'], { heads: 'end', label: '1 loader' }),
        },
        flows: [{ route: ['rq_sy', 'sy_db'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'Phantom Event',
      chapter: 'events',
      title: '12. Why Sending Kafka/Email Inside @Transactional Breaks',
      body: [
        'Suppose <code>placeOrder()</code> saves to Postgres, calls <code>kafkaTemplate.send(...)</code>, and then throws an exception on the next line.',
        'Postgres <strong>rolls back</strong> the Order, but Kafka/Email ALREADY went out — downstream consumers receive a <strong>phantom event</strong> for an order that does not exist!',
      ],
      callout: {
        kind: 'warn',
        text: 'Never fire irreversible external side effects (Kafka, Email, Webhook) synchronously before the DB transaction commits!',
      },
      changes: ['+ Kafka sent before DB COMMIT', '+ DB rolls back -> phantom event!'],
      metrics: { async_exec: 'Sync emit', context_prop: 'In TX', cache_guard: 'N/A', event_phase: 'Phantom bug!' },
      scene: {
        entities: {
          tx: d(-12, -10, { s: 5.4, h: 54, color: 'amber', glyph: 'layers', label: ['@Transactional'], sub: 'rolls back' }),
          kfk: d(2, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Kafka Sent!'], sub: 'phantom event' }),
          db: b(2, -2, { r: 2.2, h: 48, color: 'red', label: ['DB Rollback'], sub: 'order deleted!' }),
          card: S({ x: -12, y: 12 }, '4. The Phantom Event Race Condition', [
            '@Transactional public void placeOrder(Req r) {',
            '  orderRepo.save(order);',
            '  kafka.send("orders", ev); // SENT IMMEDIATELY!',
            '  throw new RuntimeException(); // DB rolls back, Kafka did NOT!',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          tx_kf: h('tx', 'kfk', ['tx', 'kfk'], { heads: 'end', label: 'early!' }),
          tx_db: h('tx', 'db', ['tx', 'db'], { heads: 'end', label: 'rollback!' }),
        },
        flows: [{ route: ['tx_kf'], kind: 'fail', rate: 1.8 }, { route: ['tx_db'], kind: 'fail', rate: 1.5 }],
      },
    },
    {
      short: 'AFTER_COMMIT',
      chapter: 'events',
      title: '13. Fixing with @TransactionalEventListener(AFTER_COMMIT)',
      body: [
        'Instead of calling Kafka directly, publish an in-memory Spring event via <code>ApplicationEventPublisher.publishEvent(ev)</code>.',
        'Annotate the listener with <code>@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)</code>: Spring holds the event and fires it ONLY if Postgres actually commits!',
      ],
      callout: {
        kind: 'tip',
        text: 'If the listener performs JPA writes of its own, add @Transactional(propagation = REQUIRES_NEW) because the original TX has already committed!',
      },
      changes: ['+ publishEvent() queues until TX ends', '+ AFTER_COMMIT fires only on DB commit'],
      metrics: { async_exec: '@Async + Event', context_prop: 'TaskDecorator', cache_guard: 'N/A', event_phase: 'AFTER_COMMIT' },
      scene: {
        entities: {
          pub: d(-14, 0, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['EventPublisher'], sub: 'publishEvent()' }),
          cmt: b(-14, -14, { r: 2.2, h: 48, color: 'green', label: ['DB COMMIT'], sub: 'TX succeeded' }),
          lst: d(0, -14, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['EventListener'], sub: 'AFTER_COMMIT' }),
          card: S({ x: -12, y: 12 }, '5. Commit-Synchronized Domain Events', [
            '// In @Transactional service:',
            'publisher.publishEvent(new OrderPlacedEvent(order.getId()));',
            '// Listener runs ONLY if DB COMMIT succeeded:',
            '@TransactionalEventListener(phase = AFTER_COMMIT)',
            'void onOrderPlaced(OrderPlacedEvent ev) { kafka.send(...); }',
          ], { icon: 'terminal' }),
        },
        links: {
          pb_cm: h('pub', 'cmt', ['pub', 'cmt'], { heads: 'end', label: 'wait commit' }),
          cm_ls: h('cmt', 'lst', ['cmt', 'lst'], { heads: 'end', label: 'fire event' }),
        },
        flows: [{ route: ['pb_cm', 'cm_ls'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'Outbox',
      chapter: 'events',
      title: '14. Crash-Safe Delivery: Transactional Outbox Pattern',
      body: [
        '<code>AFTER_COMMIT</code> prevents phantom events on rollback, but what if the JVM crashes 1ms AFTER Postgres commits and BEFORE <code>kafka.send()</code> finishes?',
        'For mission-critical events, write the event to an <code>outbox</code> table inside the <strong>exact same DB transaction</strong>, then relay asynchronously via Debezium CDC or a poller!',
      ],
      callout: {
        kind: 'insight',
        text: 'Spring Modulith (@ApplicationModuleListener) implements this Outbox + @TransactionalEventListener pattern out of the box.',
      },
      changes: ['+ Order + Outbox row saved atomically', '+ Relay guarantees at-least-once Kafka'],
      metrics: { async_exec: 'Outbox Relay', context_prop: 'Atomic DB', cache_guard: 'N/A', event_phase: 'Crash-safe' },
      scene: {
        entities: {
          tx: d(-14, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['1 Atomic TX'], sub: 'Order + Outbox' }),
          db: b(0, -14, { r: 2.2, h: 48, color: 'green', label: ['Outbox Table'], sub: 'committed' }),
          mq: d(0, 0, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Kafka Relay'], sub: 'at-least-once' }),
          card: S({ x: -12, y: 12 }, '6. Atomic DB + Outbox Guarantees Delivery', [
            '@Transactional public void placeOrder(Req r) {',
            '  orderRepo.save(order);',
            '  outboxRepo.save(OutboxEvent.of(order)); // same TX!',
            '} // Relay / CDC publishes to Kafka even after crash!',
          ], { icon: 'terminal' }),
        },
        links: {
          tx_db: h('tx', 'db', ['tx', 'db'], { heads: 'end', label: '1 commit' }),
          db_mq: h('db', 'mq', ['db', 'mq'], { heads: 'end', label: 'CDC relay' }),
        },
        flows: [{ route: ['tx_db', 'db_mq'], kind: 'res', rate: 1.9 }],
      },
    },
  ],
};
