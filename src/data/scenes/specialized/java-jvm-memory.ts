/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaJvmMemoryLesson: Lesson = {
  id: 'java-jvm-memory',
  title: 'JVM Memory, GC & Refs',
  summary:
    'Follow objects from Eden TLAB and Survivor age promotion through G1GC, Strong/Soft/Weak/Phantom References, and Metaspace OOM boundaries.',
  minutes: 13,
  level: 'intermediate',
  metrics: ['heap_region', 'gc_phase', 'allocation', 'oom_risk'],
  legend: ['flow', ['req', 'allocate / ref'], ['res', 'promote / collect'], ['fail', 'OOM boundary']],
  goals: [
    { text: 'Distinguish Thread Stack frames from Heap objects', step: 1 },
    { text: 'Intern String literals in Heap String Pool', step: 2 },
    { text: 'Allocate fast via TLAB bump-pointer in Eden', step: 3 },
    { text: 'Survive Minor GC & promote S0/S1 by age', step: 4 },
    { text: 'Reclaim Old Gen via G1GC Mixed Collection', step: 5 },
    { text: 'Contrast Strong, Soft, Weak & Phantom References', step: 6 },
    { text: 'Separate off-heap Metaspace & diagnose OOM', step: 7 },
  ],
  steps: [
    {
      short: 'Stack vs Heap',
      chapter: 'memory',
      title: '1. Thread Stack Frames vs Shared Heap',
      body: [
        'Every JVM thread owns a private <strong>Stack</strong> storing local primitives and object references in stack frames — freed automatically on method return.',
        'All actual object instances live on the shared <strong>Heap</strong>, managed by the Garbage Collector.',
      ],
      callout: {
        kind: 'insight',
        text: 'StackOverFlowError happens on deep recursion (Stack); OutOfMemoryError: Java heap space happens when live objects fill Heap.',
      },
      metrics: { heap_region: 'Stack + Heap', gc_phase: 'None (alloc)', allocation: 'Ref -> Obj', oom_risk: 'StackOverflow' },
      scene: {
        entities: {
          stack: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'layers', label: ['Thread Stack'], sub: 'local ref' }),
          eden: b(2, -6, { r: 2.3, h: 50, color: 'blue', label: ['JVM Heap'], sub: 'new Order()' }),
          card: S({ x: -12, y: 12 }, '1. Stack References & Heap Objects', [
            'void process() {',
            '  int qty = 5;              // Stack primitive',
            '  Order o = new Order();    // Ref on Stack -> Obj on Heap',
            '} // Stack frame popped; Order waits for GC',
          ], { icon: 'terminal' }),
        },
        links: {
          st_hp: h('stack', 'eden', ['stack', 'eden'], { heads: 'end', label: 'points to' }),
        },
        flows: [{ route: ['st_hp'], kind: 'req', rate: 1.7 }],
      },
    },
    {
      short: 'String Pool',
      chapter: 'memory',
      title: '2. String Pool & Compact Strings (byte[])',
      body: [
        'Since Java 7, the <strong>String Pool</strong> (canonical hash table) resides inside the Heap so unused interned strings can be garbage collected.',
        'Literals like <code>"ok"</code> reuse the pooled instance, while <code>new String("ok")</code> allocates a duplicate wrapper. Java 9+ uses <code>byte[]</code> (Latin-1 = 1 byte/char) for 50% memory savings.',
      ],
      callout: {
        kind: 'tip',
        text: 'Never call .intern() on unbounded user input — it bloats the StringTable and slows down GC.',
      },
      changes: ['+ String Pool deduplicates literals in Heap', '+ Compact Strings use byte[] + coder'],
      metrics: { heap_region: 'Heap StringTbl', gc_phase: 'GC-eligible', allocation: 'Deduplicated', oom_risk: 'Pool bloat' },
      scene: {
        entities: {
          stack: d(-12, -16, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['"hello" Ref'], sub: 'Stack ref' }),
          dup: d(-14, 0, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['new String()'], sub: 'extra Heap obj' }),
          pool: b(4, -9, { r: 2.2, h: 48, color: 'purple', label: ['String Pool'], sub: 'Heap table' }),
          card: S({ x: -12, y: 12 }, '2. String Pool & Compact byte[] Backing', [
            'String a = "hello";              // pooled instance',
            'String b = "hello";              // a == b is true!',
            'String c = new String("hello");  // a == c is false',
            '// Java 9+: byte[] value (1B Latin-1 vs 2B UTF-16)',
          ], { icon: 'terminal' }),
        },
        links: {
          lit_p: h('stack', 'pool', ['stack', 'pool'], { heads: 'end', label: 'reuse ref' }),
          dup_p: h('dup', 'pool', ['dup', 'pool'], { heads: 'end', label: 'intern()' }),
        },
        flows: [{ route: ['lit_p'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Eden TLAB',
      chapter: 'gc',
      title: '3. Young Gen Eden & TLAB Fast Allocation',
      body: [
        'Each thread receives a private <strong>TLAB</strong> (Thread-Local Allocation Buffer) inside <strong>Eden</strong> so <code>new Object()</code> is just a lock-free pointer bump.',
        'Most objects die young (Weak Generational Hypothesis): 90%+ never survive their first Minor GC.',
      ],
      callout: {
        kind: 'insight',
        text: 'TLAB bump-pointer allocation in Java can be faster than C malloc() because no global free-list lock is taken.',
      },
      changes: ['+ Eden TLAB lock-free bump-pointer', '+ 90% short-lived objects allocated here'],
      metrics: { heap_region: 'Young: Eden', gc_phase: 'TLAB Alloc', allocation: 'Bump pointer', oom_risk: 'Low' },
      scene: {
        entities: {
          stack: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'cpu', label: ['Thread T1'], sub: 'new DTO()' }),
          eden: b(2, -6, { r: 2.3, h: 50, color: 'green', label: ['Eden (TLAB)'], sub: 'bump ptr' }),
          card: S({ x: -12, y: 12 }, '3. Lock-Free TLAB Allocation in Eden', [
            '// Thread-Local Allocation Buffer (TLAB):',
            'ptr = tlab.top;',
            'if (ptr + size <= tlab.end) { tlab.top += size; }',
            '// Zero CAS/mutex contention across threads',
          ], { icon: 'terminal' }),
        },
        links: {
          t_eden: h('stack', 'eden', ['stack', 'eden'], { heads: 'end', label: 'alloc TLAB' }),
        },
        flows: [{ route: ['t_eden'], kind: 'req', rate: 2.2 }],
      },
    },
    {
      short: 'Minor GC',
      chapter: 'gc',
      title: '4. Minor GC & Survivor Spaces (S0 / S1)',
      body: [
        'When Eden fills, a fast <strong>Minor GC</strong> traces from GC Roots (stacks, statics), copies live objects to Survivor <code>S0/S1</code>, and increments their <strong>age</strong>.',
        'Dead garbage in Eden is never touched — the whole Eden region is cleared in $O(\\text{live})$ time.',
      ],
      callout: {
        kind: 'insight',
        text: 'Minor GC time depends on how many objects SURVIVE, not how much garbage was allocated.',
      },
      changes: ['+ Eden evacuated -> live copied to S0/S1', '+ Age counter incremented per survival'],
      metrics: { heap_region: 'Survivor S0/S1', gc_phase: 'Minor GC', allocation: 'Copy live', oom_risk: 'Premature promo' },
      scene: {
        entities: {
          eden: b(-12, -14, { r: 2.2, h: 48, color: 'green', label: ['Eden Space'], sub: '90% dead' }),
          gc: d(0, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['Minor GC'], sub: 'mark & copy' }),
          surv: b(0, 0, { r: 2.2, h: 48, color: 'blue', label: ['Survivor S0'], sub: 'age++ <= 15' }),
          card: S({ x: -12, y: 12 }, '4. Copying Collector: Eden -> Survivor', [
            '// GC Roots: Thread stacks, static fields, JNI',
            '// Live objects copied Eden -> S0 (age = 1)',
            '// Next Minor GC: S0 + Eden -> S1 (age++)',
            '// MaxTenuringThreshold = 15 -> Old Gen',
          ], { icon: 'terminal' }),
        },
        links: {
          ed_gc: h('eden', 'gc', ['eden', 'gc'], { heads: 'end', label: 'full' }),
          gc_sv: h('gc', 'surv', ['gc', 'surv'], { heads: 'end', label: 'copy live' }),
        },
        flows: [{ route: ['ed_gc', 'gc_sv'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Old Gen & G1',
      chapter: 'gc',
      title: '5. Old Gen Promotion & G1GC Regions',
      body: [
        'Objects reaching age 15 (<code>MaxTenuringThreshold</code>) promote to <strong>Old Gen</strong>. <strong>G1GC</strong> divides the heap into ~2048 equal regions and prioritizes regions with the most garbage first (Garbage-First).',
        'Concurrent marking runs alongside app threads to keep pause times predictable (<code>-XX:MaxGCPauseMillis=200</code>).',
      ],
      callout: {
        kind: 'tip',
        text: 'For ultra-low latency (<1ms pauses) on large heaps, JDK 21 Generational ZGC collects concurrently without stop-the-world compaction.',
      },
      changes: ['+ Age >= 15 promotes to Old Gen', '+ G1GC evacuates highest-garbage regions'],
      metrics: { heap_region: 'Old Gen (G1)', gc_phase: 'Mixed GC', allocation: 'Region-based', oom_risk: 'Memory leak' },
      scene: {
        entities: {
          surv: b(-14, -14, { r: 2.2, h: 48, color: 'blue', label: ['Survivor'], sub: 'age == 15' }),
          old: b(0, -14, { r: 2.3, h: 50, color: 'purple', label: ['Old Gen (G1)'], sub: '2048 regions' }),
          g1: d(0, 0, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['G1 Mixed GC'], sub: 'pause <= 200ms' }),
          card: S({ x: -12, y: 12 }, '5. Old Gen & G1GC Tuning', [
            '-XX:+UseG1GC -XX:MaxGCPauseMillis=200',
            '// JDK 21 ultra-low-latency option:',
            '-XX:+UseZGC -XX:+ZGenerational',
            '// Leak symptom: Old Gen stays >90% after Full GC',
          ], { icon: 'terminal' }),
        },
        links: {
          sv_old: h('surv', 'old', ['surv', 'old'], { heads: 'end', label: 'promote' }),
          old_g1: h('old', 'g1', ['old', 'g1'], { heads: 'end', label: 'evacuate' }),
        },
        flows: [{ route: ['sv_old', 'old_g1'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Ref Types',
      chapter: 'gc',
      title: '6. Strong, Soft, Weak & Phantom References (Cleaner)',
      body: [
        '<strong>Strong</strong> refs never GC. <strong>SoftReference</strong> clears only near OOM (caches). <strong>WeakReference</strong> clears on the very next GC cycle (<code>WeakHashMap</code>, <code>ThreadLocal</code> keys).',
        '<strong>PhantomReference</strong> + <code>Cleaner</code> runs post-mortem native cleanup, replacing deprecated <code>Object.finalize()</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Effective Java Item 8: Avoid finalizers (slow, unpredictable); use AutoCloseable + Cleaner as a safety net.',
      },
      changes: ['+ Soft: GC near OOM; Weak: next GC cycle', '+ Phantom + Cleaner replaces finalize()'],
      metrics: { heap_region: '4 Ref Levels', gc_phase: 'Reachability', allocation: 'RefQueue', oom_risk: 'finalize() bad' },
      scene: {
        entities: {
          soft: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['SoftRef'], sub: 'GC near OOM' }),
          weak: d(0, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['WeakRef'], sub: 'GC next cycle' }),
          phnt: d(0, 0, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['PhantomRef'], sub: 'Cleaner hook' }),
          card: S({ x: -12, y: 12 }, '6. Java Reference Strength Hierarchy', [
            '// Strong -> SoftReference (OOM-sensitive cache)',
            '//        -> WeakReference (next GC if unreferenced)',
            '//        -> PhantomReference + java.lang.ref.Cleaner',
            '//           (replaces deprecated Object.finalize())',
          ], { icon: 'terminal' }),
        },
        links: {
          sf_wk: h('soft', 'weak', ['soft', 'weak'], { heads: 'end', label: 'weaker' }),
          wk_ph: h('weak', 'phnt', ['weak', 'phnt'], { heads: 'end', label: 'post-GC' }),
        },
        flows: [{ route: ['sf_wk', 'wk_ph'], kind: 'req', rate: 1.7 }],
      },
    },
    {
      short: 'Metaspace',
      chapter: 'oom',
      title: '7. Off-Heap Metaspace & OOM Boundaries',
      body: [
        'Since Java 8, class metadata, bytecode methods, and constant pools live in native off-heap <strong>Metaspace</strong> (replacing PermGen).',
        'Unbounded dynamic proxy/classloader generation fills Metaspace (<code>OOM: Metaspace</code>), whereas leaking static caches fills Heap (<code>OOM: Java heap space</code>).',
      ],
      callout: {
        kind: 'warn',
        text: 'Always set -XX:MaxMetaspaceSize in containers alongside -Xmx so native OS memory cannot silently OOM-kill the Pod.',
      },
      changes: ['+ Metaspace stores Class<?> in native RAM', '+ -XX:MaxMetaspaceSize caps native growth'],
      metrics: { heap_region: 'Native Off-Heap', gc_phase: 'Class unload', allocation: 'ClassLoader', oom_risk: 'Metaspace OOM' },
      scene: {
        entities: {
          cl: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['ClassLoader'], sub: 'loads .class' }),
          meta: b(0, -14, { r: 2.3, h: 50, color: 'purple', label: ['Metaspace'], sub: 'native RAM' }),
          oom: d(0, 0, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['OOM Guard'], sub: 'MaxMetaspace' }),
          card: S({ x: -12, y: 12 }, '7. Metaspace & Container Memory Flags', [
            '-XX:MaxRAMPercentage=75.0   // container-aware heap',
            '-XX:MaxMetaspaceSize=256m   // cap native metadata',
            '-XX:+HeapDumpOnOutOfMemoryError',
            '// OOM: Metaspace vs OOM: Java heap space',
          ], { icon: 'terminal' }),
        },
        links: {
          cl_m: h('cl', 'meta', ['cl', 'meta'], { heads: 'end', label: 'store Class' }),
          m_oom: h('meta', 'oom', ['meta', 'oom'], { heads: 'end', label: 'exceeds cap' }),
        },
        flows: [{ route: ['cl_m'], kind: 'req', rate: 1.7 }, { route: ['m_oom'], kind: 'fail', rate: 1.4 }],
      },
    },
  ],
};
