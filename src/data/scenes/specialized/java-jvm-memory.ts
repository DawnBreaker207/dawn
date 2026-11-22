// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const javaJvmMemoryLesson = {
  id: 'java-jvm-memory',
  title: 'JVM Memory Architecture & GC Generations',
  summary: 'Visualize the JVM memory model: Heap (Eden, Survivor, Tenured), Metaspace, Thread Stacks, and generational garbage collection cycles.',
  minutes: 10,
  level: 'intermediate',
  metrics: ['heapUsed', 'youngGen', 'oldGen', 'gcLatency'],
  goals: [
    { text: 'Young Generation Eden/Survivor allocation', step: 0 },
    { text: 'Minor GC evacuation & Tenuring threshold', step: 1 },
    { text: 'Metaspace metadata & DirectBuffer off-heap', step: 2 },
  ],
  steps: [
    {
      short: 'Generational Heap',
      chapter: 'technique',
      title: 'JVM Memory Organization: Young Gen, Old Gen & Metaspace',
      body: [
        'The JVM Heap is partitioned based on the Weak Generational Hypothesis: most objects die young.',
        'New objects are allocated in Eden. Surviving objects cycle through Survivor spaces (S0/S1) before promotion to Tenured (Old Gen).',
      ],
      callout: { kind: 'tip', text: 'Thread stacks allocate execution frames and local primitives off-heap, while all object instances reside inside the Heap.' },
      metrics: { heapUsed: '2.4 GB / 4.0 GB', youngGen: 'Eden (800MB)', oldGen: 'Tenured (1.6GB)', gcLatency: '< 5ms (ZGC/G1)' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'TLAB Allocation & Object Header', [
            '// Fast-path bump-pointer allocation inside thread TLAB:',
            '= User user = new User("dawn", 28);',
            '# Mark Word: 8 bytes (lock state, hash, age: 4 bits)',
            '# Klass Word: 4 bytes (Compressed OOP -> Metaspace)',
            '# Total payload: 24 bytes aligned to 8-byte boundary',
          ]),
          eden:     d(-12, -8, { color: 'green', glyph: 'layers', label: ['Eden Space'], sub: 'Young Gen' }),
          survivor: d(-12, 4,  { color: 'yellow', glyph: 'layers', label: ['Survivor S0/S1'], sub: 'Aging' }),
          tenured:  d(0, 0,    { color: 'purple', glyph: 'layers', label: ['Tenured'], sub: 'Old Gen' }),
          meta:     d(12, -8,  { color: 'blue', glyph: 'code', label: ['Metaspace'], sub: 'Bytecode' }),
          native:   d(12, 4,   { color: 'sand', glyph: 'cpu', label: ['Thread Stacks'], sub: 'Off-Heap' }),
        },
        links: {
          es: h('eden', 'survivor', ['eden', 'survivor'], { label: 'Minor GC', heads: 'end' }),
          st: h('survivor', 'tenured', ['survivor', 'tenured'], { label: 'Promote (age > 15)', heads: 'end' }),
          tm: h('tenured', 'meta', ['tenured', 'meta'], { label: 'class refs', heads: 'both' }),
        },
        flows: [
          { route: ['es', 'st'], bounce: false, rate: 1.0 },
        ],
      },
    },
    {
      short: 'GC Promotion',
      chapter: 'technique',
      title: 'Minor GC Evacuation & Full GC Triggers',
      body: [
        'When Eden fills, a Minor GC triggers stop-the-world or concurrent evacuation. Alive objects copy to Survivor space.',
        'When Tenured exceeds occupancy threshold (e.g. 70%), Major GC / Full GC runs concurrent marking and compaction.',
      ],
      callout: { kind: 'insight', text: 'Modern collectors (ZGC, Shenandoah) achieve sub-millisecond max pause times by performing evacuation concurrently with application threads.' },
      metrics: { heapUsed: 'Evacuation in Progress', youngGen: 'Eden Cleared', oldGen: 'Marking Phase', gcLatency: '0.8ms' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Minor GC Evacuation & Tenuring Age', [
            '// Eden full -> Stop-The-World Minor GC triggered:',
            '= if (obj.age++ >= 15) {',
            '=   promoteToOldGen(obj); // -XX:MaxTenuringThreshold=15',
            '  } else {',
            '    copyToSurvivor(obj); // Survivor S0 -> S1 toggle',
            '  }',
          ]),
          eden:     d(-12, -8, { color: 'rose', glyph: 'trash', label: ['Eden Space'], sub: 'Collected' }),
          survivor: d(-12, 4,  { color: 'green', glyph: 'check', label: ['Survivor S1'], sub: 'Alive Copied' }),
          oldGen:   d(0, 0,    { color: 'purple', glyph: 'layers', label: ['Old Gen'], sub: 'Mark Phase' }),
        },
        links: {
          es: h('eden', 'survivor', ['eden', 'survivor'], { label: 'evacuate', heads: 'end' }),
          so: h('survivor', 'oldGen', ['survivor', 'oldGen'], { label: 'promote', heads: 'end' }),
        },
        flows: [
          { route: ['es', 'so'], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: 'Metaspace & Off-Heap',
      chapter: 'solution',
      title: 'Metaspace, Direct ByteBuffers & Off-Heap Memory',
      body: [
        '<b>Metaspace</b> stores class metadata, runtime constant pools, and JIT compiled machine code outside the JVM Heap in native memory.',
        'Direct ByteBuffers and thread stacks operate off-heap, avoiding GC overhead for network buffers and Netty zero-copy operations.',
      ],
      callout: { kind: 'tip', text: 'Unlike old PermGen, Metaspace grows dynamically by default. Set -XX:MaxMetaspaceSize to prevent unbounded memory growth from dynamic classloaders.' },
      metrics: { heapUsed: '2.1 GB / 4.0 GB', youngGen: 'Stable', oldGen: 'Compacted', gcLatency: 'Off-Heap Direct IO' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'DirectByteBuffer & Off-Heap Zero Copy', [
            '// Allocated outside Java Heap via unsafe native malloc:',
            '= ByteBuffer buf = ByteBuffer.allocateDirect(1024 * 1024);',
            '# JNI writes directly to OS network socket / file descriptor',
            '! Cleaned via java.lang.ref.Cleaner (sun.misc.Unsafe.freeMemory)',
            '# -XX:MaxDirectMemorySize=2g prevents native OOM',
          ]),
          app:   d(-12, -4, { color: 'green', glyph: 'code', label: ['ClassLoader'], sub: 'Proxies' }),
          meta:  d(-2, -4,  { color: 'blue', glyph: 'layers', label: ['Metaspace'], sub: 'Class Metadata' }),
          off:   d(10, -4,  { color: 'purple', glyph: 'server', label: ['Off-Heap'], sub: 'DirectBuffer' }),
        },
        links: {
          am: h('app', 'meta', ['app', 'meta'], { label: 'class load', heads: 'end' }),
          mo: h('meta', 'off', ['meta', 'off'], { label: 'native zero-copy', heads: 'end' }),
        },
        flows: [
          { route: ['am', 'mo'], bounce: false, rate: 1.2 },
        ],
      },
    },
  ],
};

export default javaJvmMemoryLesson;
