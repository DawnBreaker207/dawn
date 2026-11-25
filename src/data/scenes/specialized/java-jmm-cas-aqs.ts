/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaJmmCasAqsLesson: Lesson = {
  id: 'java-jmm-cas-aqs',
  title: 'Monitors, JMM, CAS & AQS',
  summary:
    'Master CPU cache visibility, volatile memory barriers, Happens-Before edges, lock-free CAS (Atomic/LongAdder), and AQS (ReentrantLock, Semaphore, CountDownLatch).',
  minutes: 14,
  level: 'advanced',
  metrics: ['visibility', 'ordering', 'contention', 'synchronizer'],
  legend: ['flow', ['req', 'memory read/write'], ['res', 'fence / CAS sync'], ['fail', 'stale / blocked']],
  goals: [
    { text: 'Understand CPU L1/L2 cache visibility & stale reads', step: 1 },
    { text: 'Enforce visibility with volatile & Memory Barriers', step: 2 },
    { text: 'Prevent instruction reordering in Double-Checked Locking', step: 3 },
    { text: 'Execute lock-free Atomic CAS loops', step: 4 },
    { text: 'Eliminate false sharing with LongAdder striped cells', step: 5 },
    { text: 'Trace AQS CLH queue in ReentrantLock', step: 6 },
    { text: 'Apply Semaphore, CountDownLatch & ReadWriteLock', step: 7 },
  ],
  steps: [
    {
      short: 'Cache Stale',
      chapter: 'jmm',
      title: '1. CPU Cache Visibility & Stale Reads',
      body: [
        'Each CPU core keeps local <code>L1/L2</code> caches and a <code>Store Buffer</code>. Without synchronization, Thread A writing <code>ready = true</code> may only update its core cache.',
        'Thread B running on Core 2 keeps reading <code>ready == false</code> from its own L1 cache indefinitely — an infinite loop despite Thread A finishing.',
      ],
      callout: {
        kind: 'warning',
        text: 'The Java Memory Model (JMM) abstracts CPU caches and compiler registers: no synchronization = no visibility guarantee.',
      },
      metrics: { visibility: 'Stale (L1 Only)', ordering: 'Unordered', contention: 'None', synchronizer: 'None' },
      scene: {
        entities: {
          core1: d(-12, -8, { s: 4.4, h: 52, color: 'blue', glyph: 'cpu', label: ['Core 1 (Thread A)'], sub: 'L1: ready=true' }),
          ram: b(4, -8, { r: 2.2, h: 48, color: 'purple', label: ['Main RAM'], sub: 'ready=false' }),
          card: S({ x: -12, y: 12 }, '1. Stale Cache Visibility Bug', [
            'boolean ready = false; // non-volatile',
            '// Thread A (Core 1):',
            'ready = true; // stays in Core 1 L1 / Store Buffer',
            '// Thread B (Core 2):',
            'while (!ready) { } // reads stale false forever!',
          ], { icon: 'terminal' }),
        },
        links: {
          c1_ram: h('core1', 'ram', ['core1', 'ram'], { heads: 'end', label: 'buffered write', style: 'dashed' }),
        },
        flows: [{ route: ['c1_ram'], kind: 'fail', rate: 1.4 }],
      },
    },
    {
      short: 'volatile',
      chapter: 'jmm',
      title: '2. volatile & Memory Barriers (Happens-Before)',
      body: [
        'Declaring <code>volatile boolean ready</code> inserts hardware <strong>Memory Barriers</strong> (<code>StoreLoad</code> fence on x86/ARM).',
        'A write to a <code>volatile</code> field flushes the Store Buffer to Main RAM and invalidates other cores’ cache lines (MESI). Every volatile write <strong>Happens-Before</strong> any subsequent volatile read.',
      ],
      callout: {
        kind: 'insight',
        text: 'volatile guarantees visibility and ordering, NOT atomicity for compound ops like count++.',
      },
      changes: ['+ Added Core 2 (Thread B) reading invalidated cache', '+ StoreLoad memory barrier flushes to Main RAM'],
      metrics: { visibility: 'MESI Flushed', ordering: 'Happens-Before', contention: 'Lock-Free', synchronizer: 'volatile' },
      scene: {
        entities: {
          core1: d(-14, -8, { s: 4.4, h: 52, color: 'green', glyph: 'cpu', label: ['Core 1 (Writer)'], sub: 'StoreLoad' }),
          ram: b(0, -8, { r: 2.2, h: 48, color: 'purple', label: ['Main RAM'], sub: 'ready=true' }),
          core2: d(15, -20, { s: 4.4, h: 52, color: 'cyan', glyph: 'cpu', label: ['Core 2 (Reader)'], sub: 'L1 invalidated' }),
          card: S({ x: -12, y: 12 }, '2. volatile Happens-Before Edge', [
            'volatile boolean ready = false;',
            '// Thread A: writes data, then volatile ready = true',
            'data = 42; ready = true; // StoreStore + StoreLoad',
            '// Thread B: sees ready == true -> guaranteed data == 42',
            'if (ready) assert data == 42;',
          ], { icon: 'terminal' }),
        },
        links: {
          c1_flush: h('core1', 'ram', ['core1', 'ram'], { heads: 'end', label: 'flush + fence' }),
          ram_read: h('ram', 'core2', ['ram', 'core2'], { heads: 'end', label: 'reload' }),
        },
        flows: [{ route: ['c1_flush', 'ram_read'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'Reordering',
      chapter: 'jmm',
      title: '3. Instruction Reordering & Double-Checked Locking',
      body: [
        'JIT and CPUs reorder independent instructions for pipelining. Constructing <code>instance = new Singleton()</code> has 3 steps: allocate memory, run constructor, assign reference.',
        'Without <code>volatile</code>, another thread can observe a non-null <code>instance</code> whose constructor has NOT finished! <code>volatile</code> forbids reordering across the barrier.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always mark the Double-Checked Locking field volatile (or prefer the Initialization-on-Demand Holder idiom).',
      },
      changes: ['+ JIT Reorder Guard blocks unsafe publication', '+ Safe DCL singleton reference published'],
      metrics: { visibility: 'Safe Publish', ordering: 'No Reorder', contention: 'Fast Path Free', synchronizer: 'DCL volatile' },
      scene: {
        entities: {
          core1: d(-14, -8, { s: 4.4, h: 52, color: 'green', glyph: 'cpu', label: ['Init Thread'], sub: '1.alloc 2.init' }),
          guard: d(0, -8, { s: 4.4, h: 52, color: 'orange', glyph: 'shield', label: ['Memory Barrier'], sub: 'blocks reorder' }),
          core2: d(15, -20, { s: 4.4, h: 52, color: 'cyan', glyph: 'cpu', label: ['Reader Thread'], sub: 'sees full obj' }),
          card: S({ x: -12, y: 12 }, '3. Safe Double-Checked Locking', [
            'private static volatile Singleton instance;',
            'public static Singleton getInstance() {',
            '  if (instance == null) { // 1st check (unlocked)',
            '    synchronized (Singleton.class) {',
            '      if (instance == null) instance = new Singleton();',
            '    }',
            '  } return instance;',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          init_guard: h('core1', 'guard', ['core1', 'guard'], { heads: 'end', label: '3. publish' }),
          guard_read: h('guard', 'core2', ['guard', 'core2'], { heads: 'end', label: 'safe read' }),
        },
        flows: [{ route: ['init_guard', 'guard_read'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Atomic CAS',
      chapter: 'cas',
      title: '4. Lock-Free CAS (AtomicInteger & VarHandle)',
      body: [
        '<code>AtomicInteger.incrementAndGet()</code> avoids OS mutexes by using a single CPU instruction: <strong>Compare-And-Swap</strong> (<code>LOCK CMPXCHG</code> on x86).',
        'It reads <code>expected</code>, computes <code>next</code>, and atomically swaps only if memory still equals <code>expected</code>. On conflict, it retries in a fast spin loop.',
      ],
      callout: {
        kind: 'insight',
        text: 'JDK 9+ replaced sun.misc.Unsafe with VarHandle.compareAndSet() for safe, strongly-typed hardware CAS.',
      },
      changes: ['+ AtomicInteger CAS loop replaces mutex lock', '+ Hardware LOCK CMPXCHG validates expected value'],
      metrics: { visibility: 'Atomic', ordering: 'Sequential', contention: 'Spin Retry', synchronizer: 'CAS Loop' },
      scene: {
        entities: {
          t1: y(-14, -10, { label: 'Thread 1', tags: [{ text: 'CAS', tone: 'blue', icon: 'zap' }] }),
          casUnit: d(0, -10, { s: 4.6, h: 52, color: 'purple', glyph: 'cpu', label: ['CPU CAS Unit'], sub: 'LOCK CMPXCHG' }),
          memVal: b(12, -2, { r: 2.2, h: 48, color: 'green', label: ['Atomic Value'], sub: 'val: 41 -> 42' }),
          card: S({ x: -12, y: 12 }, '4. Compare-And-Swap (CAS) Loop', [
            'AtomicInteger counter = new AtomicInteger(41);',
            '// Internally inside VarHandle / Unsafe:',
            'do {',
            '  int expected = getVolatile(mem);      // 41',
            '  int next = expected + 1;              // 42',
            '} while (!compareAndSet(mem, expected, next));',
          ], { icon: 'terminal' }),
        },
        links: {
          t1_cas: h('t1', 'casUnit', ['t1', 'casUnit'], { heads: 'end', label: 'CAS(41 -> 42)' }),
          cas_mem: h('casUnit', 'memVal', ['casUnit', 'memVal'], { heads: 'end', label: 'atomic swap' }),
        },
        flows: [{ route: ['t1_cas', 'cas_mem'], kind: 'res', rate: 2.2 }],
      },
    },
    {
      short: 'LongAdder',
      chapter: 'cas',
      title: '5. High Contention & LongAdder Striped Cells',
      body: [
        'Under heavy write contention (64+ threads), a single <code>AtomicLong</code> suffers constant CAS failures and cache-line bouncing.',
        '<code>LongAdder</code> solves this by hashing threads across a striped <code>Cell[]</code> array padded with <code>@Contended</code> to prevent <strong>False Sharing</strong>. <code>sum()</code> aggregates cells on read.',
      ],
      callout: {
        kind: 'tip',
        text: 'Use LongAdder for high-throughput metrics/counters; use AtomicLong when you need atomic getAndIncrement() sequence IDs.',
      },
      changes: ['+ Striped @Contended Cell[] eliminates false sharing', '+ Threads update independent cache lines'],
      metrics: { visibility: 'Striped', ordering: 'Eventual Sum', contention: 'Near Zero', synchronizer: 'LongAdder' },
      scene: {
        entities: {
          t1: y(-15, -14, { label: 'Threads A..D' }),
          cell0: d(-1, -18, { s: 4.2, h: 48, color: 'green', glyph: 'layers', label: ['Cell[0] (@Contended)'], sub: '64B padded' }),
          cell1: d(-1, -2, { s: 4.2, h: 48, color: 'blue', glyph: 'layers', label: ['Cell[1] (@Contended)'], sub: '64B padded' }),
          sumNode: b(14, -10, { r: 2.2, h: 48, color: 'purple', label: ['adder.sum()'], sub: 'base + cells' }),
          card: S({ x: -12, y: 12 }, '5. LongAdder Striped Counters', [
            'LongAdder requests = new LongAdder();',
            '// Hot path: threads hash to separate Cell[] slots',
            'requests.increment(); // zero cross-core cache bounce',
            '// Read path: sums base + all Cell values',
            'long total = requests.sum();',
          ], { icon: 'terminal' }),
        },
        links: {
          t_c0: h('t1', 'cell0', ['t1', 'cell0'], { heads: 'end', label: 'hash->0' }),
          t_c1: h('t1', 'cell1', ['t1', 'cell1'], { heads: 'end', label: 'hash -> 1' }),
          c0_sum: h('cell0', 'sumNode', ['cell0', 'sumNode'], { heads: 'end', label: 'sum()' }),
          c1_sum: h('cell1', 'sumNode', ['cell1', 'sumNode'], { heads: 'end', label: 'sum()' }),
        },
        flows: [
          { route: ['t_c0', 'c0_sum'], kind: 'req', rate: 2.0 },
          { route: ['t_c1', 'c1_sum'], kind: 'res', rate: 2.0 },
        ],
      },
    },
    {
      short: 'AQS Queue',
      chapter: 'aqs',
      title: '6. AbstractQueuedSynchronizer (AQS) & ReentrantLock',
      body: [
        '<code>ReentrantLock</code> is built on <strong>AQS</strong>: a single <code>volatile int state</code> updated via CAS plus a FIFO <strong>CLH Wait Queue</strong> of parked threads.',
        'If CAS on <code>state</code> (0 → 1) fails, AQS wraps the thread in a Node, parks it via <code>LockSupport.park()</code> (zero CPU burn), and unparks the head successor on <code>unlock()</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Virtual Threads (JDK 21) can park cleanly on ReentrantLock without pinning carrier threads — unlike synchronized.',
      },
      changes: ['+ AQS volatile state + CLH FIFO wait queue', '+ LockSupport.park/unpark replaces busy spinning'],
      metrics: { visibility: 'CAS State', ordering: 'FIFO / Non-Fair', contention: 'Parked (0% CPU)', synchronizer: 'ReentrantLock' },
      scene: {
        entities: {
          owner: y(-14, -10, { label: 'Owner Thread' }),
          aqsState: d(-1, -10, { s: 4.6, h: 52, color: 'purple', glyph: 'shield', label: ['AQS state = 1'], sub: 'CAS acquire' }),
          clhQueue: d(12, -10, { s: 4.4, h: 52, color: 'orange', glyph: 'queue', label: ['CLH Wait Queue'], sub: 'parked nodes' }),
          card: S({ x: -12, y: 12 }, '6. AQS State + CLH Queue', [
            'final ReentrantLock lock = new ReentrantLock();',
            'lock.lock(); // CAS(state, 0, 1) or enqueue + park()',
            'try {',
            '  criticalSection();',
            '} finally {',
            '  lock.unlock(); // state-- -> LockSupport.unpark(head)',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          own_aqs: h('owner', 'aqsState', ['owner', 'aqsState'], { heads: 'end', label: 'CAS(0->1)' }),
          aqs_clh: h('aqsState', 'clhQueue', ['aqsState', 'clhQueue'], { heads: 'end', label: 'unpark next' }),
        },
        flows: [{ route: ['own_aqs', 'aqs_clh'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Synchronizers',
      chapter: 'aqs',
      title: '7. Semaphore, CountDownLatch & ReadWriteLock',
      body: [
        'AQS powers Java’s daily production synchronizers by changing what <code>state</code> means:',
        '• <code>Semaphore(permits)</code>: caps concurrent access (rate limiting / connection pools).<br>• <code>CountDownLatch(N)</code>: awaits N worker completions.<br>• <code>ReentrantReadWriteLock</code>: allows parallel readers while writers stay exclusive.',
      ],
      callout: {
        kind: 'tip',
        text: 'On Virtual Threads, use Semaphore instead of fixed thread pools to bound concurrency against downstream DBs.',
      },
      changes: ['+ Semaphore caps permits via AQS shared acquire', '+ CountDownLatch releases all waiters at state == 0'],
      metrics: { visibility: 'Happens-Before', ordering: 'Shared/Excl', contention: 'Bounded', synchronizer: 'JUC Suite' },
      scene: {
        entities: {
          workers: y(-15, -10, { label: 'Virtual Workers' }),
          sem: d(0, -18, { s: 4.2, h: 48, color: 'cyan', glyph: 'shield', label: ['Semaphore(10)'], sub: 'permits--' }),
          latch: d(0, -2, { s: 4.2, h: 48, color: 'green', glyph: 'workflow', label: ['CountDownLatch'], sub: 'await() -> 0' }),
          rwLock: d(14, -10, { s: 4.4, h: 52, color: 'blue', glyph: 'database', label: ['ReadWriteLock'], sub: 'N rd / 1 wr' }),
          card: S({ x: -12, y: 12 }, '7. Production JUC Synchronizers', [
            'Semaphore dbLimit = new Semaphore(16);',
            'CountDownLatch done = new CountDownLatch(3);',
            'dbLimit.acquire(); // blocks when 16 permits active',
            'try { callDownstream(); }',
            'finally { dbLimit.release(); done.countDown(); }',
          ], { icon: 'terminal' }),
        },
        links: {
          w_sem: h('workers', 'sem', ['workers', 'sem'], { heads: 'end', label: 'acquire' }),
          w_lat: h('workers', 'latch', ['workers', 'latch'], { heads: 'end', label: 'countDown()' }),
          sem_rw: h('sem', 'rwLock', ['sem', 'rwLock'], { heads: 'end', label: 'shared read' }),
        },
        flows: [
          { route: ['w_sem', 'sem_rw'], kind: 'req', rate: 1.8 },
          { route: ['w_lat'], kind: 'res', rate: 1.6 },
        ],
      },
    },
  ],
};
