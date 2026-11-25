/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaSpringLockingTxLesson: Lesson = {
  id: 'java-spring-locking-tx',
  title: 'JPA Locking (@Version vs Pessimistic) & TX Propagation',
  summary:
    'Understand WHY concurrent updates cause Lost Updates, how @Version Optimistic Locking vs SELECT FOR UPDATE Pessimistic Locking prevent it, and why REQUIRES_NEW can deadlock HikariCP.',
  minutes: 13,
  level: 'advanced',
  metrics: ['lock_strategy', 'sql_clause', 'propagation', 'hikari_conns'],
  legend: ['flow', ['req', 'acquire / SQL'], ['res', 'commit / safe'], ['fail', 'lost update / starve']],
  goals: [
    { text: 'Diagnose Lost Update race without locking', step: 1 },
    { text: 'Prevent Lost Updates with @Version Optimistic Locking', step: 2 },
    { text: 'Serialize hot rows via PESSIMISTIC_WRITE FOR UPDATE', step: 3 },
    { text: 'Share one Connection in Propagation.REQUIRED', step: 4 },
    { text: 'Suspend & open 2nd Connection in REQUIRES_NEW', step: 5 },
    { text: 'Avoid HikariCP Pool Starvation Deadlock with REQUIRES_NEW', step: 6 },
  ],
  steps: [
    {
      short: 'Lost Update',
      chapter: 'locking',
      title: '1. Why Concurrent Reads Cause Lost Updates',
      body: [
        'Two threads read <code>stock = 10</code> at the same time. Thread A deducts 1 and writes <code>9</code>; Thread B deducts 1 and overwrites with <code>9</code> — one purchase is silently lost!',
        'Default SQL <code>READ_COMMITTED</code> isolation does NOT prevent Lost Updates when two transactions read-modify-write the same row.',
      ],
      callout: {
        kind: 'warn',
        text: 'Java Persistence with Spring Data: Never rely on plain SELECT + save() for inventory or balances without locking.',
      },
      metrics: { lock_strategy: 'None (Race!)', sql_clause: 'UPDATE stock=9', propagation: 'REQUIRED', hikari_conns: '2 concurrent' },
      scene: {
        entities: {
          t1: d(-12, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['Tx A: stock=9'], sub: 'read 10 -> 9' }),
          t2: d(-12, -2, { s: 4.8, h: 54, color: 'red', glyph: 'cpu', label: ['Tx B: stock=9'], sub: 'overwrites A!' }),
          db: b(4, -8, { r: 2.3, h: 50, color: 'red', label: ['Postgres Row'], sub: '1 update lost!' }),
          card: S({ x: -12, y: 12 }, '1. The Lost Update Anomaly', [
            '// Both Tx A and Tx B read balance = 100:',
            '// Tx A: SET balance = 90  (COMMIT)',
            '// Tx B: SET balance = 80  (COMMIT -> overwrites A!)',
          ], { icon: 'terminal' }),
        },
        links: {
          t1_db: h('t1', 'db', ['t1', 'db'], { heads: 'end', label: 'write 9' }),
          t2_db: h('t2', 'db', ['t2', 'db'], { heads: 'end', label: 'clobbers' }),
        },
        flows: [{ route: ['t1_db'], kind: 'req', rate: 1.6 }, { route: ['t2_db'], kind: 'fail', rate: 1.9 }],
      },
    },
    {
      short: '@Version',
      chapter: 'locking',
      title: '2. Optimistic Locking with @Version (CAS for DB)',
      body: [
        'Adding <code>@Version private long version;</code> makes Hibernate append <code>AND version = ?</code> to every <code>UPDATE</code> and increment <code>version + 1</code>.',
        'If Tx B commits first (version 1 → 2), Tx A’s <code>WHERE version = 1</code> updates <strong>0 rows</strong>, throwing <code>OptimisticLockingFailureException</code> without holding any DB lock!',
      ],
      callout: {
        kind: 'tip',
        text: 'Use @Version Optimistic Locking by default when contention is low-to-medium — zero DB row locks held during think time.',
      },
      changes: ['+ @Version appends WHERE version = ?', '+ 0 rows updated -> OptimisticLockEx'],
      metrics: { lock_strategy: 'Optimistic CAS', sql_clause: 'WHERE version=?', propagation: 'REQUIRED', hikari_conns: 'No row lock' },
      scene: {
        entities: {
          tx: d(-12, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['Tx A (v=1)'], sub: 'UPDATE v=1->2' }),
          ok: b(2, -14, { r: 2.2, h: 48, color: 'green', label: ['1 Row Updated'], sub: 'v becomes 2' }),
          fail: d(2, -2, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['0 Rows -> Fail'], sub: 'OptimisticEx' }),
          card: S({ x: -12, y: 12 }, '2. @Version Compare-And-Swap SQL', [
            '@Entity class Product { @Id Long id; @Version long ver; }',
            '// Hibernate generates:',
            'UPDATE product SET stock = ?, ver = 2',
            'WHERE id = ? AND ver = 1; // 0 rows => OptimisticLockEx!',
          ], { icon: 'terminal' }),
        },
        links: {
          tx_ok: h('tx', 'ok', ['tx', 'ok'], { heads: 'end', label: 'v==1' }),
          tx_fl: h('tx', 'fail', ['tx', 'fail'], { heads: 'end', label: 'stale v=1' }),
        },
        flows: [{ route: ['tx_ok'], kind: 'res', rate: 1.9 }, { route: ['tx_fl'], kind: 'fail', rate: 1.4 }],
      },
    },
    {
      short: 'Pessimistic',
      chapter: 'locking',
      title: '3. Pessimistic Locking: SELECT ... FOR UPDATE',
      body: [
        'For hot rows with high contention (flash sales, seat booking), Optimistic retries fail repeatedly. Use <code>@Lock(LockModeType.PESSIMISTIC_WRITE)</code>.',
        'Hibernate issues <code>SELECT ... FOR UPDATE</code>: Postgres acquires an exclusive row lock so Tx B blocks cleanly until Tx A commits.',
      ],
      callout: {
        kind: 'warn',
        text: 'Always lock multiple rows in a consistent order (e.g. ORDER BY id ASC) and set a lock timeout to prevent DB deadlocks.',
      },
      changes: ['+ PESSIMISTIC_WRITE emits FOR UPDATE', '+ Contending Tx waits at DB row lock'],
      metrics: { lock_strategy: 'Pessimistic', sql_clause: 'FOR UPDATE', propagation: 'REQUIRED', hikari_conns: 'Row lock held' },
      scene: {
        entities: {
          t1: d(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['Tx A Holds'], sub: 'FOR UPDATE' }),
          row: b(0, -10, { r: 2.2, h: 48, color: 'purple', label: ['Locked Row'], sub: 'exclusive lock' }),
          t2: d(14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['Tx B Waits'], sub: 'blocked wait' }),
          card: S({ x: -12, y: 12 }, '3. Pessimistic Row Lock in Spring Data JPA', [
            '@Lock(LockModeType.PESSIMISTIC_WRITE)',
            '@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "2000"))',
            'Optional<Product> findForUpdate(Long id);',
            '// SQL: SELECT * FROM product WHERE id = ? FOR UPDATE',
          ], { icon: 'terminal' }),
        },
        links: {
          t1_rw: h('t1', 'row', ['t1', 'row'], { heads: 'end', label: 'locks row' }),
          t2_rw: h('t2', 'row', ['t2', 'row'], { heads: 'end', label: 'waits lock' }),
        },
        flows: [{ route: ['t1_rw'], kind: 'res', rate: 1.9 }, { route: ['t2_rw'], kind: 'req', rate: 1.3 }],
      },
    },
    {
      short: 'REQUIRED',
      chapter: 'propagation',
      title: '4. Propagation.REQUIRED: Joining the Outer TX',
      body: [
        'With default <code>Propagation.REQUIRED</code>, if Service A already has an active transaction in <code>ThreadLocal</code>, Service B joins the <strong>exact same JDBC Connection</strong>.',
        '<strong>Tricky trap:</strong> If Service B throws a <code>RuntimeException</code> and Service A catches it, the shared TX is ALREADY marked <code>rollbackOnly=true</code> — Service A explodes with <code>UnexpectedRollbackException</code> at commit!',
      ],
      callout: {
        kind: 'warn',
        text: 'Catching an exception from an inner REQUIRED method does NOT save the outer transaction — Hibernate/Spring marked it rollbackOnly!',
      },
      changes: ['+ Inner joins outer ThreadLocal Connection', '+ Inner RuntimeEx sets rollbackOnly=true'],
      metrics: { lock_strategy: 'Shared TX', sql_clause: '1 JDBC TX', propagation: 'REQUIRED', hikari_conns: '1 per thread' },
      scene: {
        entities: {
          outer: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Outer @Tx'], sub: 'conn #1' }),
          inner: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'code', label: ['Inner @Tx'], sub: 'joins conn #1' }),
          db: b(14, -10, { r: 2.2, h: 48, color: 'amber', label: ['Shared TX'], sub: 'rollbackOnly!' }),
          card: S({ x: -12, y: 12 }, '4. Why Catching Inner Exception Still Rolls Back', [
            '// Outer REQUIRED + Inner REQUIRED = 1 shared TX!',
            '// If Inner throws RuntimeException -> rollbackOnly = true',
            '// Even if Outer catches it -> UnexpectedRollbackException!',
          ], { icon: 'terminal' }),
        },
        links: {
          ot_in: h('outer', 'inner', ['outer', 'inner'], { heads: 'end', label: 'share conn' }),
          in_db: h('inner', 'db', ['inner', 'db'], { heads: 'end', label: 'same TX' }),
        },
        flows: [{ route: ['ot_in', 'in_db'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'REQUIRES_NEW',
      chapter: 'propagation',
      title: '5. How REQUIRES_NEW Suspends & Borrows 2nd Connection',
      body: [
        '<code>Propagation.REQUIRES_NEW</code> calls <code>suspend()</code> to park Outer’s <code>ConnectionHolder</code> in <code>SuspendedResourcesHolder</code>, then checks out a <strong>brand-new 2nd Connection</strong> from HikariCP.',
        'Useful for audit logs that MUST commit even if the outer business transaction rolls back.',
      ],
      callout: {
        kind: 'insight',
        text: 'REQUIRES_NEW isolates commit/rollback completely from the outer transaction using a second physical JDBC connection.',
      },
      changes: ['+ Outer conn suspended on ThreadLocal', '+ 2nd HikariCP conn opened for audit TX'],
      metrics: { lock_strategy: 'Isolated TX', sql_clause: '2 JDBC TXs', propagation: 'REQUIRES_NEW', hikari_conns: '2 per thread!' },
      scene: {
        entities: {
          outer: d(-14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['Outer (Paused)'], sub: 'conn #1 parked' }),
          audit: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['REQUIRES_NEW'], sub: 'conn #2 active' }),
          db: b(14, -10, { r: 2.2, h: 48, color: 'green', label: ['Audit Commit'], sub: 'independent' }),
          card: S({ x: -12, y: 12 }, '5. REQUIRES_NEW Independent Audit Commit', [
            '@Transactional(propagation = Propagation.REQUIRES_NEW)',
            'public void saveAuditLog(AuditEvent ev) {',
            '  // Suspends conn #1 -> borrows conn #2 from HikariCP',
            '  // Commits even if Outer TX later rolls back!',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          ot_au: h('outer', 'audit', ['outer', 'audit'], { heads: 'end', label: 'suspend #1' }),
          au_db: h('audit', 'db', ['audit', 'db'], { heads: 'end', label: 'commit #2' }),
        },
        flows: [{ route: ['ot_au', 'au_db'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Pool Deadlock',
      chapter: 'propagation',
      title: '6. Tricky Trap: HikariCP Starvation Deadlock',
      body: [
        'Suppose HikariCP <code>maximum-pool-size = 10</code> and 10 HTTP threads all enter Outer <code>@Transactional</code> simultaneously — checking out all 10 connections.',
        'Now all 10 threads call <code>REQUIRES_NEW</code> and wait for an 11th connection that can NEVER be freed until Outer finishes! Every thread hangs for 30s until timeout.',
      ],
      callout: {
        kind: 'warn',
        text: 'Rule: If using REQUIRES_NEW, keep outer TXs short or set Hikari pool size > max concurrent callers * 2 (or publish async event).',
      },
      changes: ['+ 10 threads hold all 10 pool conns', '+ REQUIRES_NEW waits on empty pool -> hang'],
      metrics: { lock_strategy: 'Deadlocked!', sql_clause: 'Pool=10/10', propagation: 'REQUIRES_NEW', hikari_conns: 'Starvation!' },
      scene: {
        entities: {
          th: d(-14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['10 Callers'], sub: 'hold 10 conns' }),
          pool: b(0, -10, { r: 2.2, h: 48, color: 'red', label: ['HikariCP (10)'], sub: '0 free conns!' }),
          wait: d(14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['30s Timeout'], sub: 'pool deadlock' }),
          card: S({ x: -12, y: 12 }, '6. Why REQUIRES_NEW Deadlocks Small Pools', [
            '// Pool size = 10; 10 concurrent Outer TXs hold 10 conns',
            '// All 10 call REQUIRES_NEW -> need 10 MORE conns!',
            '// Fix: @TransactionalEventListener(phase = AFTER_COMPLETION)',
            '// or size pool >= 2 * maxThreads.',
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
