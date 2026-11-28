import { STAGE, codeCard, linkOf, makeDb, stageBlock, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// Seed → result. Two threads share one piece of state; each step gives them a better tool.
// `shared` always means "the state the threads share" — the tool protecting it is named in its
// sub line and tags. The machinery nodes keep fixed meanings: `caches` + `memory` arrive in
// step 2, the AQS `queue` in step 6; at most two nodes join per step.
//
//   step 1  t1, t2 ── shared                          seed: stale read
//   step 2  + memory, + caches                        volatile and happens-before
//   step 3  (shared: volatile ref)                    reordering, double-checked locking
//   step 4  (shared: AtomicInteger)                   CAS retry loop
//   step 5  (shared: LongAdder; memory: cells)        contention
//   step 6  + queue; (shared: ReentrantLock)          AQS state + wait queue
//   step 7  (shared: Semaphore, latch, RW lock)       pick the right synchronizer
//
//   t2 (left-top)          caches (top)          queue (top-right)
//   t1 ───────────────── shared ──────────────── memory (right)

const thread = (id: 't1' | 't2', tags: Tag[] = []) =>
  stageBlock(id === `t1` ? STAGE.caller : STAGE.caller2, {
    color: `blue`,
    glyph: `layers`,
    label: [id === `t1` ? `thread 1` : `thread 2`],
    sub: id === `t1` ? `core 0` : `core 1`,
    tags,
  });
const shared = (sub: string, tags: Tag[] = [], glyph = `box`) =>
  stageBlock(STAGE.main, { color: `green`, glyph, label: [`shared`, `state`], sub, tags });
const memory = (label: string, tags: Tag[] = []) =>
  makeDb(STAGE.store.x, STAGE.store.y, { r: 2.2, h: 46, glyph: `database`, label, tags });
const caches = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph: `layers`, label: [`L1 caches`], sub, tags });
const waitQueue = (tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `orange`, glyph: `listChecks`, label: [`AQS queue`], sub: `FIFO waiters`, tags });

const links = {
  t1: (label?: string) => linkOf(`t1`, `shared`, label),
  t2: (label?: string) => linkOf(`t2`, `shared`, label),
  flush: (label?: string) => linkOf(`shared`, `memory`, label),
  cache: (label?: string) => ({ ...linkOf(`caches`, `shared`, label, false), labelAt: 0.6 }),
  wait: (label?: string) => ({ ...linkOf(`queue`, `shared`, label, false), labelAt: 0.6 }),
};

export const javaJmmCasAqsLesson: Lesson = {
  id: 'java-jmm-cas-aqs',
  title: 'Monitors, JMM, CAS & AQS',
  summary:
    'Two threads share some state, and it goes wrong; then give them volatile, a safe publication, atomics and CAS, LongAdder, and ReentrantLock with the AQS queue behind it — ending with the right synchronizer for each job.',
  minutes: 14,
  level: 'advanced',
  metrics: ['visibility', 'ordering', 'contention', 'tool'],
  legend: [[`req`, `read / write`], [`write`, `flush / CAS`], [`fail`, `stale / retry`]],
  goals: [
    { text: 'Explain stale reads from per-core caches', step: 1 },
    { text: 'Fix visibility with volatile and happens-before', step: 2 },
    { text: 'Stop reordering in double-checked locking', step: 3 },
    { text: 'Run a lock-free CAS retry loop', step: 4 },
    { text: 'Beat contention with LongAdder cells', step: 5 },
    { text: 'Trace the AQS queue inside ReentrantLock', step: 6 },
    { text: 'Choose Semaphore, CountDownLatch or a ReadWriteLock', step: 7 },
  ],
  steps: [
    {
      short: 'Stale read',
      chapter: 'problem',
      title: 'Seed: two threads, one plain variable',
      body: [
        `Every CPU core caches variables in its own L1/L2. When thread 1 sets <code>stop = true</code>, the new value can sit in <b>its</b> cache and write buffer for a while — thread 2, on another core, keeps seeing <code>false</code>.`,
        `It can be worse than delay: the JIT is allowed to read a non-volatile field <em>once</em> and reuse it, so <code>while (!stop) { }</code> may never see the change at all. We will give the threads better tools one step at a time.`,
      ],
      metrics: { visibility: 'stale', ordering: 'any', contention: 'none', tool: 'none' },
      scene: {
        entities: {
          t1: thread('t1', [{ text: `stop = true`, tone: `green` }]),
          t2: thread('t2', [{ text: `still false`, tone: `red`, icon: `alert` }]),
          shared: shared(`plain boolean`, [{ text: `no guarantee`, tone: `red` }]),
          card: codeCard(`An endless loop`, [`boolean stop = false;`, `// thread 2:  while (!stop) { work(); }`, `// thread 1:  stop = true;`, `! thread 2 may never exit`]),
        },
        links: { t1: links.t1(), t2: links.t2(`read`) },
        flows: [{ route: ['t1'], rate: 1.2, bounce: true }, { route: ['t2'], kind: 'fail', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'volatile',
      chapter: 'solution',
      title: 'volatile: write, then everyone sees it',
      body: [
        `The copies live in the per-core <b>L1 caches</b>; main memory holds the truth. Marking the field <code>volatile</code> tells the JVM to put <b>memory barriers</b> around it. A write is flushed to main memory; a read always fetches the latest value; neither is reordered past the other accesses.`,
        `That gives a <span class="term">happens-before</span> edge: everything thread 1 did <em>before</em> writing the flag is visible to thread 2 <em>after</em> it reads the flag. It does not make <code>count++</code> atomic.`,
      ],
      changes: [`+ main memory`, `+ L1 caches`, `~ shared: volatile`],
      metrics: { visibility: 'guaranteed', ordering: 'happens-before', contention: 'lock-free', tool: 'volatile' },
      scene: {
        entities: {
          t1: thread('t1', [{ text: `stop = true`, tone: `green` }]),
          t2: thread('t2', [{ text: `sees true`, tone: `green`, icon: `shield` }]),
          shared: shared(`volatile boolean`, [{ text: `barrier`, tone: `violet`, icon: `lock` }]),
          memory: memory(`main memory`, [{ text: `stop = true`, tone: `green` }]),
          caches: caches(`one per core`, [{ text: `flush + invalidate`, tone: `violet` }]),
          card: codeCard(`One keyword`, [`volatile boolean stop;`, `// thread 1:  stop = true;      // flushes to memory`, `// thread 2:  while (!stop) { } // always re-reads`, `= count++ on a volatile is STILL not atomic`]),
        },
        links: { t1: links.t1(), t2: links.t2(), flush: links.flush(), cache: links.cache(`fences`) },
        flows: [{ route: ['flush'], kind: 'write', rate: 1.4, bounce: true }, { route: ['t2'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'Reordering',
      chapter: 'problem',
      title: 'Reordering breaks double-checked locking',
      body: [
        `<code>instance = new Service()</code> is really three steps: allocate memory, run the constructor, store the reference. The compiler or CPU may swap the last two.`,
        `Then thread 2 sees a <b>non-null</b> reference to a half-built object. Declare the field <code>volatile</code> and the constructor’s writes happen-before the reference becomes visible.`,
      ],
      changes: [`~ shared: a lazily built instance`, `~ memory: half-built object`],
      metrics: { visibility: 'safe publish', ordering: 'no reorder', contention: 'fast path', tool: 'volatile DCL' },
      scene: {
        entities: {
          t1: thread('t1', [{ text: `creating`, tone: `amber` }]),
          t2: thread('t2', [{ text: `got half object`, tone: `red`, icon: `alert` }]),
          shared: shared(`volatile Service ref`, [{ text: `ref before init`, tone: `red` }]),
          memory: memory(`heap`, [{ text: `Service (fields = 0)`, tone: `amber` }]),
          caches: caches(`ctor ⇄ store`, [{ text: `reorder allowed`, tone: `red` }]),
          card: codeCard(`Double-checked locking`, [`private static volatile Service instance;   // volatile!`, `if (instance == null)`, `    synchronized (Service.class) {`, `        if (instance == null) instance = new Service();`, `    }`, `# new Service() = alloc · ctor · store`]),
        },
        links: { t1: links.t1(), t2: links.t2(), flush: links.flush(), cache: links.cache(`swaps`) },
        flows: [{ route: ['t2'], kind: 'fail', rate: 1, bounce: true }],
      },
    },
    {
      short: 'CAS',
      chapter: 'technique',
      title: 'CAS: lock-free by retrying',
      body: [
        `<code>AtomicInteger.incrementAndGet()</code> uses <span class="term">compare-and-swap</span>: one CPU instruction (<code>lock cmpxchg</code>) that writes the new value <em>only if</em> the variable still holds the value you read.`,
        `If another thread got there first, the CAS fails and you simply <b>retry</b> with the fresh value. No thread is ever blocked, but under heavy contention many retries are wasted spinning.`,
      ],
      changes: [`~ shared: AtomicInteger`, `~ thread 2 loses the race`],
      metrics: { visibility: 'atomic', ordering: 'sequential', contention: 'spin retry', tool: 'CAS loop' },
      scene: {
        entities: {
          t1: thread('t1', [{ text: `CAS 5 → 6 ✓`, tone: `green` }]),
          t2: thread('t2', [{ text: `CAS 5 → 6 ✗ retry`, tone: `amber`, icon: `refresh` }]),
          shared: shared(`AtomicInteger = 6`, [{ text: `lock-free`, tone: `green` }], `hash`),
          memory: memory(`main memory`, [{ text: `v = 6`, tone: `green` }]),
          caches: caches(`lock cmpxchg`, [{ text: `1 instruction`, tone: `violet` }]),
          card: codeCard(`The retry loop`, [`int old;`, `do { old = v.get(); }`, `while (!v.compareAndSet(old, old + 1));`, `= incrementAndGet() does exactly this`]),
        },
        links: { t1: links.t1(), t2: links.t2(`CAS fails`), flush: links.flush(), cache: links.cache(`atomic`) },
        flows: [{ route: ['t1'], kind: 'write', rate: 1.2, bounce: true }, { route: ['t2'], kind: 'fail', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'LongAdder',
      chapter: 'solution',
      title: 'LongAdder: spread the contention',
      body: [
        `With dozens of threads, one hot <code>AtomicLong</code> becomes a bottleneck: every CAS fights over the same cache line. <code>LongAdder</code> keeps a <b>base</b> and an array of <b>cells</b>; each thread updates its own cell, so they rarely collide.`,
        `<code>sum()</code> adds them up when you ask. It is not an instantaneous snapshot, so use it for counters and statistics, not for sequence numbers. The cells are padded so neighbours don’t share a cache line (false sharing).`,
      ],
      changes: [`~ shared: LongAdder`, `~ memory: striped cells`],
      metrics: { visibility: 'striped', ordering: 'eventual sum', contention: 'near zero', tool: 'LongAdder' },
      scene: {
        entities: {
          t1: thread('t1', [{ text: `cell 0`, tone: `green` }]),
          t2: thread('t2', [{ text: `cell 1`, tone: `green` }]),
          shared: shared(`LongAdder base + cells`, [{ text: `sum() on demand`, tone: `violet` }], `layers`),
          memory: memory(`cells[ 4 ]`, [{ text: `padded, one line each`, tone: `green` }]),
          caches: caches(`64 B cache line`, [{ text: `no false sharing`, tone: `green` }]),
          card: codeCard(`Counters under load`, [`var hits = new LongAdder();`, `hits.increment();        // each thread: own cell`, `long total = hits.sum();  // adds base + cells`, `# one hot AtomicLong: all threads CAS-retry`]),
        },
        links: { t1: links.t1(), t2: links.t2(), flush: links.flush(), cache: links.cache(`pads`) },
        flows: [{ route: ['t1'], kind: 'write', rate: 1.6, bounce: true }, { route: ['t2'], kind: 'write', rate: 1.6, bounce: true }],
      },
    },
    {
      short: 'AQS',
      chapter: 'technique',
      title: 'AQS: a counter plus a waiting queue',
      body: [
        `<code>ReentrantLock</code> is built on <span class="term">AbstractQueuedSynchronizer</span>: one <code>volatile int state</code> (0 = free, n = held n times) changed with CAS, plus a FIFO queue of waiting threads.`,
        `Thread 1 CASes <code>state</code> from 0 to 1 and owns the lock. Thread 2 fails, queues itself and <b>parks</b> (0% CPU). <code>unlock()</code> sets state to 0 and wakes the first waiter. Semaphore, CountDownLatch and the read-write lock reuse the same machinery.`,
      ],
      changes: [`+ AQS wait queue`, `~ shared: ReentrantLock`],
      metrics: { visibility: 'CAS on state', ordering: 'FIFO queue', contention: 'parked, 0% CPU', tool: 'ReentrantLock' },
      scene: {
        entities: {
          t1: thread('t1', [{ text: `owns lock`, tone: `green`, icon: `lock` }]),
          t2: thread('t2', [{ text: `parked`, tone: `amber`, icon: `clock` }]),
          shared: shared(`ReentrantLock state = 1`, [{ text: `owner: thread 1`, tone: `violet` }], `lock`),
          memory: memory(`protected data`, [{ text: `one writer`, tone: `green` }]),
          caches: caches(`barrier on state`, [{ text: `CAS on state`, tone: `violet` }]),
          queue: waitQueue([{ text: `head → thread 2`, tone: `amber` }]),
          card: codeCard(`Use it like this`, [`lock.lock();`, `try { balance += amount; }`, `finally { lock.unlock(); }   // always in finally`, `= tryLock(100, MILLISECONDS) avoids waiting forever`]),
        },
        links: { t1: links.t1(`lock ✓`), t2: links.t2(`queued`), flush: links.flush(), cache: links.cache(), wait: links.wait() },
        flows: [{ route: ['t1'], kind: 'write', rate: 1.2, bounce: true }, { route: ['wait'], rate: 0.8 }],
      },
    },
    {
      short: 'Synchronizers',
      chapter: 'recap',
      title: 'Result: pick the right synchronizer',
      body: [
        `<b>Semaphore</b> limits how many threads enter at once (permits). <b>CountDownLatch</b> makes threads wait until N events have happened — one-shot. <b>ReentrantReadWriteLock</b> allows many readers <em>or</em> one writer. All of them wait in the same AQS queue.`,
        `Rule of thumb: prefer <code>java.util.concurrent</code> collections and atomics, use <code>synchronized</code> or <code>ReentrantLock</code> for compound updates, and reach for the rest when the problem actually looks like a gate, a countdown or a read-mostly cache.`,
      ],
      changes: [`~ shared: Semaphore, latch, RW lock`, `~ memory: DB pool`],
      metrics: { visibility: 'happens-before', ordering: 'shared / exclusive', contention: 'bounded', tool: 'JUC suite' },
      scene: {
        entities: {
          t1: thread('t1', [{ text: `acquire()`, tone: `green` }]),
          t2: thread('t2', [{ text: `await()`, tone: `amber` }]),
          shared: shared(`Semaphore permits = 2`, [{ text: `limits to 2`, tone: `green`, icon: `gauge` }], `gauge`),
          memory: memory(`DB pool`, [{ text: `2 connections`, tone: `gray` }]),
          caches: caches(`barriers`, [{ text: `happens-before`, tone: `violet` }]),
          queue: waitQueue([{ text: `latch · RW waiters`, tone: `violet` }]),
          card: codeCard(`Three gates`, [`var gate = new Semaphore(2);   gate.acquire();`, `var ready = new CountDownLatch(3);   ready.await();`, `var rw = new ReentrantReadWriteLock();   rw.readLock().lock();`]),
        },
        links: { t1: links.t1(`acquire`), t2: links.t2(`await`), flush: links.flush(), cache: links.cache(), wait: links.wait() },
        flows: [{ route: ['t1'], rate: 1.2, bounce: true }, { route: ['wait'], kind: 'write', rate: 0.9 }],
      },
    },
  ],
};
