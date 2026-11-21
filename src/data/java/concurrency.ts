import type { SimCase, VizCfg } from '@/scripts/lab/java/sim-engine';

export const CONCURRENCY_CASES: Record<string, SimCase[]> = {
  threads: [
    {
      label: '⚡ unlocked race',
      steps: [
        { log: '[T-1] reads shared count = 0', explain: 'Both threads hit the same field with no lock — whoever writes last wins. Count starts at 0.', tone: 'info' },
        { log: '[T-2] reads count = 0 (stale!)', explain: 'T-2 reads BEFORE T-1 commits: the two reads overlap inside the race window.', tone: 'warn' },
        { log: 'both write → expected 2 · actual 1 (lost update)', explain: 'Read-modify-write is 3 machine ops; without a monitor they interleave arbitrarily and one add evaporates.', tone: 'error' },
        { log: 'fix: synchronized add() or AtomicInteger', explain: 'One monitor (or a CAS) makes the read-modify-write atomic — the race window closes for good.', tone: 'info' },
      ],
    },
    {
      label: '🔒 monitor guarded',
      steps: [
        { log: '[T-1] enters synchronized(add) — monitor ACQUIRED', explain: 'The object monitor is handed to T-1; only one thread can be inside at a time.', tone: 'info' },
        { log: '[T-2] monitor taken → BLOCKED · parked 140 µs', explain: 'T-2 parks in the entry set — an OS-level park costing ~1–10 µs vs nanoseconds uncontended.', tone: 'warn' },
        { log: '[T-1] add(1) done → releases monitor', explain: 'synchronized is reentrant: T-1 could legally re-lock its own monitor without self-deadlocking.', tone: 'info' },
        { log: '[T-2] acquires → add(2) done', explain: 'Queued waiters progress roughly FIFO, but barging is legal — fairness is not guaranteed.', tone: 'info' },
        { log: 'both TERMINATED · race-free', explain: 'ONE monitor guarding the shared list = correctness; the contended taps are the price.', tone: 'info' },
      ],
    },
    {
      label: '💀 deadlock',
      steps: [
        { log: '[T-1] locks A → wants B', explain: 'T-1 holds A and now blocks asking for B — half way into the cycle.', tone: 'info' },
        { log: '[T-2] locks B → wants A', explain: 'Opposite lock order is the classic poison: T-2 holds B and asks for A.', tone: 'warn' },
        { log: 'circular wait — both WAIT forever', explain: 'Neither thread releases; the JVM will never unwind a deadlock for you (no auto-recovery).', tone: 'error' },
        { log: 'fix: global lock ORDER A→B · or tryLock + timeout', explain: 'Consistent ordering removes the cycle; tryLock converts deadlock into a retryable timeout.', tone: 'info' },
      ],
    },
  ],
  executor: [
    {
      label: '▶ steady flow',
      steps: [
        { log: 'pool warm: core=2 · queue=1 · max=4', explain: 'Four knobs govern everything: core size, queue capacity, max threads, rejection policy.', tone: 'info' },
        { log: 'submit c1 → core worker W1 runs', explain: 'Idle cores execute immediately.', tone: 'info' },
        { log: 'submit c2 → core worker W2 runs', explain: 'All cores busy now — next submits head to the queue.', tone: 'info' },
        { log: 'submit c3 → queue (1/1)', explain: 'Extra tasks queue once every core is busy.', tone: 'warn' },
        { log: 'submit c4 → queue FULL → spawn extra W3', explain: 'THE surprise: pool extras spawn only AFTER the queue fills, not when cores are busy.', tone: 'warn' },
        { log: 'submit c5 → W4 (max reached)', explain: 'No more threads may spawn — capacity is locked.', tone: 'info' },
        { log: 'W1 done → pulls c3 · 0 rejected', explain: 'The queue feeds freed workers; steady state, nothing lost.', tone: 'info' },
      ],
    },
    {
      label: '💥 rejection',
      steps: [
        { log: 'core+queue+max all saturated', explain: '4 workers busy, queue holds its 1 slot.', tone: 'info' },
        { log: 'submit c6 → RejectedExecutionException (AbortPolicy)', explain: 'The DEFAULT policy throws on the caller thread — callers must catch it or lose the task.', tone: 'error' },
        { log: 'swap CallerRunsPolicy → the submitter runs c6 itself', explain: 'The producer slows down to consumer speed instead of throwing: natural backpressure.', tone: 'info' },
        { log: 'steady: 0 drops · latency grows at the producer', explain: 'The queue cap bounds how far production may run ahead of consumption.', tone: 'warn' },
      ],
    },
    {
      label: '🌙 idle drain',
      steps: [
        { log: 'peak passed: queue empty · extras idle', explain: 'Extras above core size are transient burst capacity.', tone: 'info' },
        { log: 'idle > keepAlive (60 s) → extras terminate', explain: 'Wind-down on demand is what keeps a pooled fleet lean between bursts.', tone: 'warn' },
        { log: 'core = 2 stays warm', explain: 'Core threads are permanent — allowCoreThreadTimeOut(false) by default.', tone: 'info' },
      ],
    },
  ],
  completable: [
    {
      label: '✅ happy pipeline',
      steps: [
        { log: 'supplyAsync(fetchUser) → io-pool thread A', explain: 'Pass an explicit executor — the default commonPool is sized cores-1 and wants your IO.', tone: 'info' },
        { log: 'thenApply(addPremium) · runs on thread A', explain: 'Callbacks run on whichever thread completes the stage — no forced hop unless you use *Async.', tone: 'info' },
        { log: 'thenCompose(fetchBalance) → thread B', explain: 'Compose flattens a future-of-future: one chain, one final value.', tone: 'info' },
        { log: 'thenCombine(discount) · waits for BOTH stages', explain: 'Two independent sources joined — the wait is cooperative, nobody parks.', tone: 'info' },
        { log: 'exceptionally skipped — happy path', explain: 'Fallback exists but never fires this run.', tone: 'info' },
        { log: 'thenAccept(sendInvoice) · 38 ms · 0 blocked', explain: 'Wall time is the longest stage, not the sum — and no thread was ever parked.', tone: 'info' },
      ],
    },
    {
      label: '⛔ failure path',
      steps: [
        { log: 'fetchUser THROWS (404 not found)', explain: 'The stage completes with an exception instead of a value.', tone: 'error' },
        { log: 'thenApply / thenCompose skipped', explain: 'A broken stage short-circuits every normal downstream callback.', tone: 'warn' },
        { log: 'exceptionally(ex) → fallback ZERO', explain: 'The error bends back into the value world as data.', tone: 'info' },
        { log: 'pipeline completes normally — consumer unharmed', explain: 'try/catch becomes composition: errors are just another stage.', tone: 'info' },
      ],
    },
    {
      label: '🕳 join() trap',
      steps: [
        { log: 'cf.join() called inside a pool task', explain: 'join() BLOCKS its calling thread — parking sneaks back in through the side door.', tone: 'warn' },
        { log: 'caller stack = commonPool worker', explain: 'Blocking commonPool workers starves every other parallel operation on the JVM.', tone: 'error' },
        { log: 'worst case: same pool owns upstream stages → deadlock', explain: 'A child stage may never get a worker: the pool is waiting on itself.', tone: 'error' },
        { log: 'fix: stay composed · or pass your own executor', explain: 'Compose > block, always.', tone: 'info' },
      ],
    },
  ],
  virtual: [
    {
      label: '📈 1M-task storm',
      steps: [
        { log: 'spawn 1,000,000 VTs (one per task)', explain: 'Virtual threads are NOT pooled — one thread per task is the idiomatic shape.', tone: 'info' },
        { log: 'scheduled over 4 carrier threads', explain: 'Carriers = ForkJoin workers ≈ CPU cores; everything else is cheap memory.', tone: 'info' },
        { log: 'VT-1 calls jdbc.query() → IO stall', explain: 'A blocking call would be fatal on platform threads; here it is routine.', tone: 'info' },
        { log: 'UNMOUNT: stack → heap · carrier freed', explain: 'Parking is a heap copy, not an OS wait: microseconds, not milliseconds.', tone: 'info' },
        { log: 'VT-2 remounts carrier-1 (same id, new stack)', explain: 'Continuations resume with the same thread identity the code always sees.', tone: 'info' },
        { log: 'drain: 820 ms wall · 4 OS threads only', explain: 'Blocking IO at a million concurrency with four OS threads.', tone: 'info' },
      ],
    },
    {
      label: '📌 pinning',
      steps: [
        { log: 'synchronized(jdbcConn) wraps a blocking call', explain: 'Owning an intrinsic monitor PINS the VT to its carrier.', tone: 'warn' },
        { log: 'IO stall → can NOT unmount', explain: 'The held frame must stay on the carrier stack — unmounting is impossible.', tone: 'error' },
        { log: 'carrier stuck → other VTs starve silently', explain: 'No exception, no stack trace — just throughput quietly evaporating.', tone: 'warn' },
        { log: 'at 1M scale: a 4-carrier pool behaves like 3', explain: 'Every pinned VT permanently removes one carrier from the fleet.', tone: 'error' },
      ],
    },
    {
      label: '🔓 repaired',
      steps: [
        { log: 'swap synchronized → ReentrantLock', explain: 'ReentrantLock is not an intrinsic monitor, so unmounting stays free.', tone: 'info' },
        { log: 'IO stall → UNMOUNT clean', explain: 'The virtual thread parks to the heap as designed.', tone: 'info' },
        { log: 'carriers rotate 1M VTs · 820 ms wall', explain: 'Same load, same four threads — the collapse is gone.', tone: 'info' },
      ],
    },
    {
      label: '⚙ scheduler internals',
      steps: [
        { log: 'ForkJoinPool.commonPool: 4 carrier threads (= CPU cores)', explain: 'The carrier pool is sized to physical cores; the VT scheduler sits on top as a cooperative layer.', tone: 'info' },
        { log: 'VT scheduler: work-stealing deque per carrier', explain: 'Each carrier has its own task queue; idle carriers steal from busy ones.', tone: 'info' },
        { log: 'VT-1 mounts carrier-0, runs until IO', explain: 'Mount = copy heap stack to carrier stack frame, resume execution.', tone: 'info' },
        { log: 'IO → UNMOUNT: continuation parked in heap', explain: 'Continuation object holds the entire stack in a byte array ~few KB.', tone: 'info' },
        { log: 'carrier-0 free → steals VT-47 from carrier-2 deque', explain: 'Work-stealing keeps all carriers busy without a central scheduler.', tone: 'info' },
        { log: 'IO completes → VT-1 rescheduled to whichever carrier is free', explain: 'Thread affinity is LOST after unmount — do NOT use ThreadLocal for state you need post-IO.', tone: 'warn' },
      ],
    },
  ],
  async: [
    {
      label: '@Async proxy',
      steps: [
        { log: 'caller invokes mailer.sendReceipt(cart)', explain: 'Ordinary call so far — the proxy is about to change it.', tone: 'info' },
        { log: '@Async proxy intercepts (NOT the raw bean)', explain: 'Same decorator trick as @Transactional — invoke via proxy or lose it.', tone: 'info' },
        { log: 'interceptor wraps args → executor.submit(task)', explain: 'Submission replaces execution — scheduling, not calling.', tone: 'info' },
        { log: 'caller returns immediately with a future handle', explain: 'The request thread is free in microseconds.', tone: 'info' },
        { log: 'email actually sends later, on a pool thread', explain: 'Off-thread work — errors bubble into the future, not to the caller.', tone: 'info' },
      ],
    },
    {
      label: 'Events ↔ commit',
      steps: [
        { log: 'place() opens tx T1 and writes orders', explain: 'Business state first — the event rides on top of it.', tone: 'info' },
        { log: 'publishEvent(OrderPlaced) — dispatch begins', explain: 'In-process pub-sub: no broker, no network, one JVM.', tone: 'info' },
        { log: '@EventListener runs NOW — same thread, INSIDE T1', explain: 'It can read the not-yet-committed writes — and dies with them.', tone: 'warn' },
        { log: 'AFTER_COMMIT listener fires only after T1 commits', explain: 'Armed at publish, fired at success.', tone: 'info' },
        { log: 'T1 rolls back → the AFTER_COMMIT listener never fires', explain: 'No ghost emails for work that never happened.', tone: 'info' },
      ],
    },
    {
      label: '@Scheduled lifecycle',
      steps: [
        { log: 'cron / fixedDelay parsed at startup', explain: 'Schedules register during context refresh, one trigger bean each.', tone: 'info' },
        { log: 'fixedDelay: next run N ms AFTER the last FINISH', explain: 'A run can never overlap itself — pauses stretch the gap.', tone: 'info' },
        { log: 'fixedRate: N ms from the START — can OVERLAP', explain: 'Slow runs queue invocations; dangerous with shared state.', tone: 'warn' },
        { log: 'default scheduler = ONE thread → tasks queue up', explain: 'Two schedules at the same instant = serial, not parallel.', tone: 'info' },
        { log: 'multi-node deploy → every node fires → ShedLock', explain: 'Cluster-safe scheduling needs a shared lock table or leader election.', tone: 'info' },
      ],
    },
  ],
  jmm: [
    {
      label: 'Volatile & reorder',
      steps: [
        { log: 'two threads, no volatile — JIT/CPU may reorder T1 stores', explain: 'Source order is NOT execution order once the optimizer joins.', tone: 'warn' },
        { log: 'T2 spins: ready is never observed true', explain: 'Stale cache lines can live indefinitely without a barrier.', tone: 'error' },
        { log: 'worse: T2 sees ready == true but answer == 0', explain: 'Both outcomes are LEGAL reorderings — intuition is not a spec.', tone: 'error' },
        { log: 'volatile ready: store + memory barrier', explain: 'Writes flush to shared memory before later reads proceed.', tone: 'info' },
        { log: 'T2 refreshes its line — answer is guaranteed 42', explain: 'One volatile variable orders surrounding reads/writes too.', tone: 'info' },
      ],
    },
    {
      label: 'DCL singleton',
      steps: [
        { log: 'getInstance without lock — the race window opens', explain: 'First check must stay lock-free; that is the whole point of DCL.', tone: 'info' },
        { log: 'T1 inside ctor: alloc → init → assign may reorder', explain: 'The pointer field can become visible BEFORE the fields are set.', tone: 'warn' },
        { log: 'T2 sees non-null → returns a HALF-BUILT object', explain: 'Non-null is not the same as constructed — the classic crash.', tone: 'error' },
        { log: 'volatile instance: ctor finish happens-before the read', explain: 'One keyword turns the 3-step creation into an ordered event.', tone: 'info' },
        { log: 'safe: every reader sees a fully built singleton', explain: 'DCL is correct ONLY with volatile — no excuses.', tone: 'info' },
      ],
    },
    {
      label: 'CAS loop',
      steps: [
        { log: 'no synchronized — load current as the EXPECTED old', explain: 'Lock-free style: optimistic, no waiting rooms.', tone: 'info' },
        { log: 'compute new = old + 1', explain: 'Pure computation — nothing shared changed yet.', tone: 'info' },
        { log: 'one atomic cmpxchg: store only if value is still old', explain: 'A single CPU instruction does compare + swap atomically.', tone: 'info' },
        { log: 'raced? swap fails → retry the loop (spin, not block)', explain: 'Threads spin a few cycles instead of parking — cheap for short fights.', tone: 'warn' },
        { log: 'ABA: same value, different history → version stamp', explain: 'AtomicStampedReference counts generations so old-looking is never enough.', tone: 'info' },
      ],
    },
  ],
};

export const CONCURRENCY_VIZ: Record<string, VizCfg[]> = {
  threads: [
    {
      code: `List<Integer> shared = new ArrayList<>();
Runnable unsafe = () -> {
    int v = shared.size();      // read
    shared.add(v + 1);          // write — check-then-act race
};
new Thread(unsafe).start();  new Thread(unsafe).start();
// fix: synchronized add() · or AtomicInteger (CAS loop)`,
      line: [3, 3, 4, 7],
      track: ['shared = 0', 'reads stale', 'both write', 'lost update', 'window closed'],
      at: [0, 1, 2, 4],
    },
    {
      code: `synchronized void add(int v) { shared.add(v); }  // ONE monitor
// T-1 start(): enters add() — monitor ACQUIRED
// T-2 start(): monitor taken → BLOCKED, parks in the entry set
// T-1 finishes → monitor released
// T-2 wakes, acquires, completes add(2)
// invariant: every mutation passes the same monitor`,
      line: [2, 3, 4, 5, 6],
      track: ['T-1 acquires', 'T-2 parked', 'T-1 releases', 'T-2 acquires', 'race-free'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `// T-1: synchronized(A) { synchronized(B) { ... } }
// T-2: synchronized(B) { synchronized(A) { ... } }
// T-1 holds A → wants B · T-2 holds B → wants A
// cycle: nobody releases, nothing times out
// fix: one GLOBAL order  A → B  everywhere
// alt: ReentrantLock.tryLock(timeout) + backoff retry`,
      line: [1, 2, 4, 5],
      track: ['T-1 holds A', 'T-2 holds B', 'circular wait', 'frozen forever', 'ordered locks'],
      at: [0, 1, 2, 4],
    },
  ],
  executor: [
    {
      code: `var pool = new ThreadPoolExecutor(2, 4, 60, SECONDS,
        new ArrayBlockingQueue<>(1));   // core=2 · queue=1 · max=4
pool.execute(c1);   // idle core runs it
pool.execute(c2);   // idle core runs it
pool.execute(c3);   // cores busy → queue (1/1)
pool.execute(c4);   // queue FULL → spawns extra worker
pool.execute(c5);   // max reached — the last thread
// freed workers pull c3·c4 off the queue · 0 rejected`,
      line: [2, 3, 4, 5, 6, 7, 8],
      track: ['pool warm', 'c1 · c2 → core', 'c3 → queue', 'c4 spawns W3', 'c5 → max', 'drain'],
      at: [0, 1, 1, 2, 3, 4, 5],
    },
    {
      code: `// core=2 · queue=1 · max=4 — saturated
var bad = new ThreadPoolExecutor(2, 4, 60, SECONDS,
    new ArrayBlockingQueue<>(1));       // default = AbortPolicy
bad.execute(c6);   // RejectedExecutionException — ON the caller thread
// fix: CallerRunsPolicy — the submitter runs the task itself
new ThreadPoolExecutor(2, 4, 60, SECONDS, q, new CallerRunsPolicy());`,
      line: [2, 4, 5, 6],
      track: ['core+queue full', 'AbortPolicy throws', 'CallerRunsPolicy', 'backpressure'],
      at: [0, 1, 2, 3],
    },
    {
      code: `new ThreadPoolExecutor(2, 4, 60, SECONDS, queue);
// burst over — queue empty, extra workers idle
// idle > keepAlive (60 s) → extras terminate
// core threads stay permanent (allowCoreThreadTimeOut=false)`,
      line: [2, 3, 4],
      track: ['peak passed', 'idle > keepAlive', 'core = 2 warm'],
      at: [0, 1, 2],
    },
  ],
  completable: [
    {
      code: `var io = Executors.newFixedThreadPool(8);   // NOT commonPool
CompletableFuture.supplyAsync(() -> fetchUser(id), io)
    .thenApply(u -> addPremium(u))             // runs on completing thread
    .thenCompose(u -> userClient.load(u.id))   // flatten future-of-future
    .thenCombine(discountF, (u, d) -> price(u, d))
    .exceptionally(ex -> FALLBACK)             // skipped on the happy path
    .thenAccept(this::sendInvoice);            // 38 ms · 0 blocked threads`,
      line: [2, 3, 4, 5, 6, 7],
      track: ['supplyAsync', 'thenApply', 'thenCompose', 'thenCombine', 'exceptionally', 'sendInvoice'],
      at: [0, 1, 2, 3, -1, 5],
    },
    {
      code: `CompletableFuture.supplyAsync(() -> fetchUser(404), io)
    .thenApply(addPremium)      // SKIPPED — stage completed exceptionally
    .thenCompose(load)          // SKIPPED
    .exceptionally(ex -> GUEST) // error bends into a fallback VALUE
    .thenAccept(sendInvoice);   // pipeline completes normally`,
      line: [1, 2, 4, 5],
      track: ['fetchUser', 'THROWS 404', 'downstream skipped', 'exceptionally', 'consumer safe'],
      at: [0, 1, 2, 4],
    },
    {
      code: `CompletableFuture.runAsync(() -> other.join());  // blocks INSIDE a task
// caller = ForkJoinPool.commonPool() worker (cores-1)
// upstream stages on the SAME pool → waiting on itself
// every other parallel op on the JVM starves with it
// fix: stay composed — .thenApply / .thenCompose, never join()`,
      line: [1, 2, 3, 5],
      track: ['join() in pool task', 'caller = commonPool', 'same-pool deadlock', 'compose > block'],
      at: [0, 1, 2, 3],
    },
  ],
  virtual: [
    {
      code: `try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    // carriers = ForkJoin workers ≈ cores (here: 4)
    for (int i = 0; i < 1_000_000; i++) {     // 1 VT per task — NO pool
        exec.submit(() -> orderDao.load(id)); // blocking call is FINE
    }   // stall → UNMOUNT stack to heap · carrier serves the next VT
}   // remount = same Thread identity, new continuation
// 820 ms wall · 4 OS threads — blocking IO at million-concurrency`,
      line: [3, 2, 4, 5, 6, 7],
      track: ['1M VTs spawned', '4 carriers', 'VT-1 IO stall', 'UNMOUNT → heap', 'VT-2 remount', '820 ms drained'],
      at: [0, 1, 2, 3, 4, 5],
    },
    {
      code: `// synchronized pins the VT to its carrier:
synchronized (jdbcConn) {          // monitor OWNED on the carrier stack
    jdbcConn.query(sql);           // IO stall — CANNOT unmount
}   // carrier-1 frozen while parked · other VTs starve silently
// at 1M scale a 4-carrier pool behaves like 3
// fix: ReentrantLock — no intrinsic monitor, unmount stays free`,
      line: [2, 3, 4, 4],
      track: ['monitor held', 'cannot unmount', 'carrier stuck', 'pool behaves = 3'],
      at: [0, 1, 2, 3],
    },
    {
      code: `private final ReentrantLock lock = new ReentrantLock();
lock.lock();   // NOT an intrinsic monitor → VT unmounts freely
try { jdbc.query(sql); } finally { lock.unlock(); }
// 1M VTs · 820 ms · 4 carriers — collapse gone`,
      line: [2, 3, 4],
      track: ['ReentrantLock', 'clean UNMOUNT', 'no collapse'],
      at: [0, 1, 2],
    },
    {
      code: `// ForkJoinPool.commonPool: 4 carrier threads ≈ CPU cores
// VT scheduler: work-stealing deque per carrier (idle steals from busy)
// VT-1 mounts carrier-0 → runs until IO → UNMOUNT (stack → byte[] in heap)
// continuation parked in heap (stack as byte array ~few KB)
// carrier-0 free → steals VT-47 from carrier-2 deque (no central scheduler)
// IO completes → VT-1 rescheduled to free carrier — affinity LOST: no ThreadLocal`,
      line: [1, 2, 3, 4, 5, 6],
      track: ['4 carriers', 'work-stealing', 'VT-1 mounts', 'IO → UNMOUNT', 'carrier steals', 'affinity LOST'],
      at: [0, 1, 2, 3, 4, 5],
    },
  ],
  async: [
    {
      code: `void checkout() { mailer.sendReceipt(cart); return ok(); }

@Async
CompletableFuture<Void> sendReceipt(Cart c) {
    return smtp.deliver(c.email());             // SUBMITTED, not called
}
// proxy = AsyncExecutionInterceptor → executor.submit(task)
// caller proceeds IMMEDIATELY with a future handle`,
      line: [1, 3, 7, 8, 5],
      track: ['caller', 'async proxy', 'executor queue', 'returns fast', 'runs off-thread'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `orderService.place(c);                       // tx T1 STARTS

applicationEventPublisher.publishEvent(new OrderPlaced(o));
// @EventListener → runs NOW: same thread, INSIDE T1
// @TransactionalEventListener(AFTER_COMMIT) → armed only
// fires after T1 COMMITs · T1 ROLLBACK → never fires
// pattern: work in-tx, side effects AFTER commit`,
      line: [1, 3, 5, 6, 7],
      track: ['tx starts', 'event published', 'AFTER_COMMIT armed', 'commit → fires', 'rollback → silent'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `@Scheduled(fixedDelay = 500)           // gap AFTER last FINISH
void compact() { files.clean(); }      // safe: never overlaps itself

@Scheduled(fixedRate = 500)            // gap from the START
void tick() { metrics.flush(); }       // can OVERLAP on slow runs!
// default scheduler = 1 thread → tasks QUEUE, never in parallel
// multi-instance? every node fires → ShedLock / Quartz cluster`,
      line: [1, 2, 5, 6, 7],
      track: ['schedule parsed', 'fixedDelay safe', 'fixedRate overlap', 'one-thread pool', 'cluster → ShedLock'],
      at: [0, 1, 2, 3, 4],
    },
  ],
  jmm: [
    {
      code: `boolean ready = false;              // non-volatile staleness
int answer = 0;

// T1: answer = 42; ready = true;    // optimizer may REORDER these
// T2: while (!ready) {}             // ...spins forever, or even sees
// answer == 0  — legal per JMM, illegal per intuition
volatile boolean ready = true;       // barrier: T1 flushes, T2 refreshes
// one volatile orders surrounding loads/stores too`,
      line: [4, 5, 6, 7, 8],
      track: ['non-volatile flag', 'stores reordered', 'stale answer read', 'volatile barrier', 'visible ✓'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `class Singleton {
    private static Singleton instance;          // BUG: no volatile
    static Singleton get() {
        if (instance == null) {                 // lock-free fast path
            synchronized (Singleton.class) {
                if (instance == null)           // re-check under lock
                    instance = new Singleton(); // 3 steps, NOT atomic
            }
        }
        return instance;        // T2 may see pointer BEFORE fields set
    }
}                                // volatile fixes the happens-before edge`,
      line: [4, 7, 10, 12, -1],
      track: ['getInstance race', 'ctor 3 steps', 'half-built ✗', 'volatile +', 'safe singleton'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();
// CAS = one atomic CPU instruction (cmpxchg)
// read expect → compute new → swap IF still old → else RETRY
// no lock held: short spins instead of parked threads
// ABA: value same, history different — AtomicStampedReference fix`,
      line: [1, 2, 4, 5, 6],
      track: ['expect = old', 'compute old+1', 'cmpxchg swap', 'lost race → retry', 'ABA stamp'],
      at: [0, 1, 2, 3, 4],
    },
  ],
};
