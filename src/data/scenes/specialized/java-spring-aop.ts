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
  title: 'Spring AOP & @Transactional',
  summary:
    'Trace how Spring AOP wraps beans in JDK/CGLIB proxies, manages @Transactional JDBC commits, fails on self-invocation, and risks HikariCP deadlock on REQUIRES_NEW.',
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
          caller: d(-12, -8, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Controller'], sub: 'calls service' }),
          target: d(4, -8, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['OrderService'], sub: 'raw target' }),
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
          caller: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Controller'], sub: 'holds proxy' }),
          proxy: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['CGLIB Proxy'], sub: '$$SpringCGLIB' }),
          target: d(14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Target Bean'], sub: 'real method' }),
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
          px: d(-14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['AOP Proxy'], sub: 'entry' }),
          adv: d(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['@Around Advice'], sub: 'pjp.proceed()' }),
          target: d(14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Target Bean'], sub: 'executes' }),
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
          tx: d(-14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['TxInterceptor'], sub: 'autoCommit=0' }),
          target: d(0, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['OrderService'], sub: 'shared conn' }),
          db: b(14, -10, { r: 2.2, h: 48, color: 'green', label: ['Postgres DB'], sub: 'BEGIN TX' }),
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
          px: d(-14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['AOP Proxy'], sub: 'bypassed!' }),
          mA: d(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['this.methodA'], sub: 'raw target' }),
          mB: d(14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['this.methodB'], sub: '@Tx ignored!' }),
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
          outer: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Outer @Tx'], sub: 'catches ex' }),
          inner: d(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['Inner @Tx'], sub: 'throws Runtime' }),
          db: b(14, -10, { r: 2.2, h: 48, color: 'red', label: ['RollbackOnly'], sub: 'UnexpectedEx' }),
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
          th: d(-14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['10 Callers'], sub: 'hold 10 conns' }),
          pool: b(0, -10, { r: 2.2, h: 48, color: 'red', label: ['HikariCP (10)'], sub: '0 free conns!' }),
          wait: d(14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['30s Timeout'], sub: 'pool deadlock' }),
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
  ],
};
