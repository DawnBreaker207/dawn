/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaVirtualThreadsLesson: Lesson = {
  id: 'java-virtual-threads',
  title: 'Pools, ThreadLocal & Loom',
  summary:
    'Understand WHY ThreadPoolExecutor fills the queue before maxPoolSize, why ThreadLocal leaks on Tomcat, and how Virtual Threads + ScopedValue solve blocking I/O.',
  minutes: 14,
  level: 'advanced',
  metrics: ['thread_model', 'ram_per_task', 'io_behavior', 'scalability'],
  legend: ['flow', ['req', 'submit / mount'], ['res', 'complete / clean'], ['fail', 'leak / pinned']],
  goals: [
    { text: 'Diagnose 1:1 Platform Thread blocking & 1MB stack cost', step: 1 },
    { text: 'Trace ThreadPoolExecutor order: core -> queue -> max', step: 2 },
    { text: 'Prevent Tomcat ThreadLocalMap (WeakKey+StrongVal) leaks', step: 3 },
    { text: 'Compose non-blocking DAGs via CompletableFuture', step: 4 },
    { text: 'Multiplex sockets with NIO Selector & epoll', step: 5 },
    { text: 'Mount/unmount JDK 21 Virtual Threads on Carrier pool', step: 6 },
    { text: 'Avoid Carrier Pinning (synchronized vs ReentrantLock)', step: 7 },
    { text: 'Replace ThreadLocal with JDK 21+ ScopedValue for Loom', step: 8 },
  ],
  steps: [
    {
      short: '1:1 OS Thread',
      chapter: 'executors',
      title: '1. Blocking 1:1 Platform Threads (The Bottleneck)',
      body: [
        'Classic Java maps 1 <code>java.lang.Thread</code> directly to 1 OS kernel thread (~1 MB native stack).',
        'When a thread blocks on JDBC or HTTP I/O, the expensive OS kernel thread sits idle — spawning 10,000 threads exhausts RAM and triggers heavy context switching.',
      ],
      callout: {
        kind: 'warn',
        text: 'Thread-per-request on OS threads caps out around a few thousand concurrent connections.',
      },
      metrics: { thread_model: '1:1 OS Thread', ram_per_task: '~1 MB stack', io_behavior: 'Blocks OS thread', scalability: 'Low (~2k)' },
      scene: {
        entities: {
          os: d(-12, -8, { s: 4.8, h: 54, color: 'red', glyph: 'cpu', label: ['OS Thread #1'], sub: '1 MB stack' }),
          io: b(4, -8, { r: 2.2, h: 48, color: 'amber', label: ['Blocking I/O'], sub: '200ms wait' }),
          card: S({ x: -12, y: 12 }, '1. Classic Thread-per-Request Bottleneck', [
            '// 1 Java Thread = 1 OS Kernel Thread (~1MB stack)',
            'new Thread(() -> {',
            '  String res = httpClient.blockingGet(url); // OS idle!',
            '}).start();',
          ], { icon: 'terminal' }),
        },
        links: {
          os_io: h('os', 'io', ['os', 'io'], { heads: 'end', label: 'blocks 200ms' }),
        },
        flows: [{ route: ['os_io'], kind: 'fail', rate: 1.4 }],
      },
    },
    {
      short: 'Core->Q->Max',
      chapter: 'executors',
      title: '2. Why ThreadPoolExecutor Fills Queue Before maxPoolSize',
      body: [
        'Given <code>core=4, max=16, queue=100</code>: 50 tasks fill the 4 core threads and push 46 into the <code>BlockingQueue</code> — <strong>thread #5 only spawns when the queue is 100% full!</strong>',
        'Use <code>CallerRunsPolicy</code> for backpressure; unbounded queues make <code>maximumPoolSize</code> dead config.',
      ],
      callout: {
        kind: 'warn',
        text: 'Interview classic: core=4, max=16, unbounded queue -> active threads NEVER exceed 4!',
      },
      changes: ['+ Order: core -> workQueue -> maxPoolSize', '+ CallerRunsPolicy slows caller if full'],
      metrics: { thread_model: 'Pooled OS', ram_per_task: 'Queue node', io_behavior: 'Still blocks', scalability: 'Bounded' },
      scene: {
        entities: {
          core: d(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['1. Core (4)'], sub: 'fill 1st' }),
          q: b(0, -10, { r: 2.2, h: 48, color: 'amber', label: ['2. Queue (100)'], sub: 'fill 2nd!' }),
          max: d(14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['3. Max (16)'], sub: 'only if Q full' }),
          card: S({ x: -12, y: 12 }, '2. ThreadPoolExecutor Submission Order', [
            'new ThreadPoolExecutor(4, 16, 60L, SECONDS,',
            '  new ArrayBlockingQueue<>(100), new CallerRunsPolicy());',
            '// Order: 1) corePoolSize -> 2) workQueue -> 3) maxPoolSize',
          ], { icon: 'terminal' }),
        },
        links: {
          cr_q: h('core', 'q', ['core', 'q'], { heads: 'end', label: 'core busy' }),
          q_mx: h('q', 'max', ['q', 'max'], { heads: 'end', label: 'queue full' }),
        },
        flows: [{ route: ['cr_q', 'q_mx'], kind: 'req', rate: 1.9 }],
      },
    },
    {
      short: 'TL Leak',
      chapter: 'executors',
      title: '3. Why Tomcat ThreadPools Leak ThreadLocal',
      body: [
        '<code>ThreadLocal.set(val)</code> stores an <code>Entry</code> inside the Thread’s <code>ThreadLocalMap</code>: the <strong>key</strong> is a <code>WeakReference</code>, but the <strong>value is a STRONG ref</strong>!',
        'Since Tomcat worker threads never die, forgetting <code>tl.remove()</code> in <code>finally</code> leaks Heap RAM and bleeds user data into future requests.',
      ],
      callout: {
        kind: 'warn',
        text: 'ALWAYS call tl.remove() in a finally block on pooled threads!',
      },
      changes: ['+ Weak key + Strong value pins RAM', '+ finally { tl.remove(); } prevents leak'],
      metrics: { thread_model: 'ThreadLocMap', ram_per_task: 'Strong Value', io_behavior: 'Cross-req bug', scalability: 'Leak risk' },
      scene: {
        entities: {
          th: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['Pool Thread'], sub: 'lives forever' }),
          map: d(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['ThreadLocMap'], sub: 'WeakKey+Val' }),
          fin: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['finally remove'], sub: 'tl.remove()' }),
          card: S({ x: -12, y: 12 }, '3. ThreadLocalMap Leak & Mandatory Cleanup', [
            '// Entry extends WeakReference<ThreadLocal<?>> { Object value; }',
            'try { CTX.set(user); handle(); }',
            'finally { CTX.remove(); } // prevents OOM + data bleed!',
          ], { icon: 'terminal' }),
        },
        links: {
          th_mp: h('th', 'map', ['th', 'map'], { heads: 'end', label: 'owns map' }),
          mp_fn: h('map', 'fin', ['map', 'fin'], { heads: 'end', label: 'clean entry' }),
        },
        flows: [{ route: ['th_mp', 'mp_fn'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'CompletableFuture',
      chapter: 'async',
      title: '4. CompletableFuture Async Pipelines',
      body: [
        '<code>CompletableFuture</code> chains non-blocking callbacks (<code>thenApply</code>, <code>thenCompose</code>, <code>allOf</code>) so OS threads are not held idle waiting for I/O.',
        'Trade-off: callback chains split stack traces and complicate debugging and structured error handling.',
      ],
      callout: {
        kind: 'insight',
        text: 'Always pass a dedicated Executor to supplyAsync(..., ioPool) so blocking work does not starve ForkJoinPool.commonPool().',
      },
      changes: ['+ Async DAG chains callbacks', '+ allOf() fans out parallel calls'],
      metrics: { thread_model: 'Async Callbacks', ram_per_task: 'Future heap', io_behavior: 'Non-blocking', scalability: 'High (complex)' },
      scene: {
        entities: {
          f1: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['supplyAsync()'], sub: 'fetch user' }),
          f2: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['thenCompose()'], sub: 'fetch orders' }),
          join: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['allOf().join()'], sub: 'merge DAG' }),
          card: S({ x: -12, y: 12 }, '3. Composing Async Pipelines', [
            'CompletableFuture.supplyAsync(() -> getUser(id), ioPool)',
            '  .thenCompose(u -> getOrdersAsync(u))',
            '  .exceptionally(ex -> fallbackOrders())',
            '  .thenAccept(this::render);',
          ], { icon: 'terminal' }),
        },
        links: {
          f1_f2: h('f1', 'f2', ['f1', 'f2'], { heads: 'end', label: 'flatMap' }),
          f2_jn: h('f2', 'join', ['f2', 'join'], { heads: 'end', label: 'combine' }),
        },
        flows: [{ route: ['f1_f2', 'f2_jn'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'NIO epoll',
      chapter: 'nio',
      title: '5. Java NIO Selector & OS epoll Multiplexing',
      body: [
        'Underneath Netty, WebFlux, and Project Loom, <code>java.nio.channels.Selector</code> registers thousands of <code>SocketChannel</code> descriptors onto a single OS <code>epoll</code>/<code>kqueue</code> loop.',
        'The kernel wakes the event loop only when bytes actually arrive on a socket.',
      ],
      callout: {
        kind: 'insight',
        text: 'Selector + epoll turns 10,000 idle sockets into 1 waiting kernel call instead of 10,000 blocked threads.',
      },
      changes: ['+ Selector watches N SocketChannels', '+ OS epoll notifies ready FDs only'],
      metrics: { thread_model: '1 Event Loop', ram_per_task: 'FD buffer', io_behavior: 'Multiplexed', scalability: '100k+ sockets' },
      scene: {
        entities: {
          socks: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'layers', label: ['10k Sockets'], sub: 'SocketChannel' }),
          sel: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['NIO Selector'], sub: 'epoll_wait()' }),
          buf: b(14, -10, { r: 2.2, h: 48, color: 'green', label: ['ByteBuffer'], sub: 'OP_READ ready' }),
          card: S({ x: -12, y: 12 }, '4. Non-Blocking NIO Event Loop', [
            'channel.configureBlocking(false);',
            'channel.register(selector, SelectionKey.OP_READ);',
            'selector.select(); // OS epoll_wait returns ready keys',
            '// Foundation used by Netty AND Loom Poller!',
          ], { icon: 'terminal' }),
        },
        links: {
          sk_sel: h('socks', 'sel', ['socks', 'sel'], { heads: 'end', label: 'register FD' }),
          sel_bf: h('sel', 'buf', ['sel', 'buf'], { heads: 'end', label: 'read ready' }),
        },
        flows: [{ route: ['sk_sel', 'sel_bf'], kind: 'req', rate: 2.0 }],
      },
    },
    {
      short: 'Virtual Threads',
      chapter: 'loom',
      title: '6. JDK 21 Virtual Threads: Mount & Unmount',
      body: [
        '<strong>Virtual Threads</strong> (<code>Thread.ofVirtual()</code>) are cheap M:N user-mode continuations (~few KB on Heap) scheduled onto a small <code>ForkJoinPool</code> of OS <strong>Carrier Threads</strong>.',
        'When a virtual thread hits blocking I/O, the JVM automatically <strong>unmounts</strong> its stack to the Heap and registers an NIO epoll callback — freeing the Carrier for other virtual threads!',
      ],
      callout: {
        kind: 'insight',
        text: 'You write simple synchronous blocking code AND get async NIO scalability without CompletableFuture callback hell.',
      },
      changes: ['+ M:N Virtual Threads on Carrier FJP', '+ Blocking I/O unmounts continuation to Heap'],
      metrics: { thread_model: 'M:N Loom', ram_per_task: '~2 KB Heap', io_behavior: 'Auto-unmount', scalability: '1M+ virtual' },
      scene: {
        entities: {
          vt: d(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Virtual Threads'], sub: '1M+ cheap' }),
          car: d(0, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['Carrier Pool'], sub: 'CPU-core OS' }),
          heap: b(14, -10, { r: 2.2, h: 48, color: 'purple', label: ['Parked Stack'], sub: 'Heap chunk' }),
          card: S({ x: -12, y: 12 }, '5. Project Loom Virtual Threads (JDK 21+)', [
            'try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {',
            '  exec.submit(() -> httpClient.get(url));',
            '} // On I/O wait: unmount -> park on Heap -> free Carrier',
            '// Spring Boot 3.2+: spring.threads.virtual.enabled=true',
          ], { icon: 'terminal' }),
        },
        links: {
          vt_car: h('vt', 'car', ['vt', 'car'], { heads: 'end', label: 'mount' }),
          car_hp: h('car', 'heap', ['car', 'heap'], { heads: 'end', label: 'park on I/O' }),
        },
        flows: [{ route: ['vt_car', 'car_hp'], kind: 'res', rate: 2.2 }],
      },
    },
    {
      short: 'Pinning Fix',
      chapter: 'loom',
      title: '7. Avoiding Carrier Pinning (synchronized -> Lock)',
      body: [
        'In JDK 21, performing blocking I/O inside a <code>synchronized</code> block or native JNI frame <strong>pins</strong> the virtual thread to its OS Carrier Thread, preventing unmount.',
        'Replace long I/O-wrapping <code>synchronized</code> blocks with <code>ReentrantLock</code> (which parks cleanly), or upgrade to JDK 24+ (JEP 491) which unpins <code>synchronized</code>.',
      ],
      callout: {
        kind: 'warn',
        text: 'Never pool Virtual Threads — create a fresh virtual thread per task; pooling them defeats their lightweight design.',
      },
      changes: ['+ synchronized + I/O pins Carrier OS thread', '+ ReentrantLock.lock() unmounts cleanly'],
      metrics: { thread_model: 'Loom Safe', ram_per_task: '~2 KB Heap', io_behavior: 'Unpinned Lock', scalability: 'Full Loom' },
      scene: {
        entities: {
          vt: d(-14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'alert', label: ['synchronized'], sub: 'pins Carrier!' }),
          lock: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['ReentrantLock'], sub: 'unmounts I/O' }),
          car: d(14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['Carrier Free'], sub: 'runs next VT' }),
          card: S({ x: -12, y: 12 }, '6. Eliminating Virtual Thread Pinning', [
            '// BAD (JDK 21): synchronized(mu) { db.query(); } // PINS!',
            '// GOOD: ReentrantLock allows clean unmount:',
            'lock.lock(); try { db.query(); } finally { lock.unlock(); }',
            '// Debug flag: -Djdk.tracePinnedThreads=short',
          ], { icon: 'terminal' }),
        },
        links: {
          vt_lk: h('vt', 'lock', ['vt', 'lock'], { heads: 'end', label: 'refactor' }),
          lk_cr: h('lock', 'car', ['lock', 'car'], { heads: 'end', label: 'free carrier' }),
        },
        flows: [{ route: ['vt_lk', 'lk_cr'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'ScopedValue',
      chapter: 'loom',
      title: '8. Modern Fix: ScopedValue for Virtual Threads',
      body: [
        'With 1M Virtual Threads, mutable <code>ThreadLocal</code> maps waste Heap RAM and risk forgetting <code>remove()</code>.',
        '<strong><code>ScopedValue</code></strong> binds an <strong>immutable</strong> value strictly for the dynamic scope of <code>ScopedValue.where(KEY, val).run(...)</code> — auto-freed on exit with zero leaks!',
      ],
      callout: {
        kind: 'tip',
        text: 'Prefer ScopedValue over ThreadLocal in JDK 21+ Virtual Thread services: immutable, auto-scoped, and zero remove() bugs.',
      },
      changes: ['+ ScopedValue binds immutable ref to scope', '+ Auto-unbound on exit -> 0 leaks'],
      metrics: { thread_model: '1M Virtual', ram_per_task: 'Immutable', io_behavior: 'Auto-freed', scalability: 'Zero leaks' },
      scene: {
        entities: {
          bind: d(-14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['Scoped.where'], sub: 'immutable bind' }),
          vt: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Virtual Task'], sub: 'KEY.get()' }),
          exit: d(14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['Auto Unbind'], sub: '0 remove() bug' }),
          card: S({ x: -12, y: 12 }, '8. ScopedValue Replaces ThreadLocal', [
            'static final ScopedValue<User> USER = ScopedValue.newInstance();',
            'ScopedValue.where(USER, currentUser).run(() -> {',
            '  handleOrder(); // reads USER.get() safely',
            '}); // Automatically unbound here — zero leaks!',
          ], { icon: 'terminal' }),
        },
        links: {
          bd_vt: h('bind', 'vt', ['bind', 'vt'], { heads: 'end', label: 'enter scope' }),
          vt_ex: h('vt', 'exit', ['vt', 'exit'], { heads: 'end', label: 'auto clean' }),
        },
        flows: [{ route: ['bd_vt', 'vt_ex'], kind: 'res', rate: 2.0 }],
      },
    },
  ],
};
