import { makeBlock, makeDb, makeLink, makePanel, makeZone } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One heap for the whole lesson. The same `order` object is allocated in Eden,
// survives a Minor GC into Survivor and is finally tenured into Old Gen — the
// engine tweens it between the floor regions, so the learner watches it age.
// The thread stack is the GC root: collections trace along its reference.
//
//                     thread (GC root)
//   string pool   [EDEN] order → [SURVIVOR] → [OLD GEN] ──klass──► Metaspace

/** Screen position (px) → world grid point. */
const at = (sx: number, sy: number) => ({
  x: +((sx / 14 + sy / 7) / 2).toFixed(2),
  y: +((sx / 14 - sy / 7) / 2).toFixed(2),
});

type Tag = { text: string; tone?: string; icon?: string };

const P = {
  stack: at(40, -170),
  pool: at(-290, -40),
  inEden: at(-130, 50),
  inSurv: at(80, 20),
  inOld: at(250, -40),
  // off-heap: deliberately outside every heap region
  meta: at(-150, -110),
};

const stack = (tags: Tag[] = []) =>
  makeBlock(P.stack.x, P.stack.y, { s: 4.4, h: 52, color: `blue`, glyph: `layers`, label: [`Thread`], sub: `stack frames`, tags });
const order = (where: { x: number; y: number }, tags: Tag[] = [], o: Record<string, unknown> = {}) =>
  makeBlock(where.x, where.y, { s: 4.2, h: 48, color: `green`, glyph: `box`, label: [`Order`], sub: `heap object`, tags, ...o });
const pool = (tags: Tag[] = []) => makeDb(P.pool.x, P.pool.y, { r: 2, h: 42, label: `String pool`, tags });
const meta = (tags: Tag[] = []) => makeDb(P.meta.x, P.meta.y, { r: 2, h: 42, label: `Metaspace`, tags });

/** Floor regions, padded so each title runs clear of the object inside it. */
const zones = () => ({
  eden: makeZone({ x0: -4.5, x1: 2.5, y0: -13.5, y1: -3.5 }, `EDEN`),
  surv: makeZone({ x0: 2.6, x1: 8, y0: -4.5, y1: 5.5 }, `SURVIVOR S0/S1`),
  old: makeZone({ x0: 3.5, x1: 10, y0: 6, y1: 17.5 }, `OLD GEN`),
});

const L = {
  ref: makeLink(`stack`, `order`, [`stack`, `order`], { label: `ref` }),
  refQuiet: makeLink(`stack`, `order`, [`stack`, `order`]),
  // collections trace live objects starting from GC roots such as this stack
  root: makeLink(`stack`, `order`, [`stack`, `order`], { label: `GC root` }),
  refWeak: makeLink(`stack`, `order`, [`stack`, `order`], { style: `dash`, label: `WeakRef` }),
  literal: makeLink(`stack`, `pool`, [`stack`, `pool`], { label: `"ok"` }),
  literalQuiet: makeLink(`stack`, `pool`, [`stack`, `pool`], { style: `off` }),
  loads: makeLink(`stack`, `meta`, [`stack`, `meta`], { label: `load class` }),
};

/** Code card parked top-right, beside the thread and above Old Gen. */
const card = (title: string, lines: string[]) =>
  makePanel({ x: P.stack.x, y: P.stack.y, z: 0, dx: 85, dy: -85 }, title, lines, { icon: `code` });

export const javaJvmMemoryLesson: Lesson = {
  id: 'java-jvm-memory',
  title: 'JVM Memory, GC & Refs',
  summary:
    'Follow one object from a TLAB in Eden, through a Minor GC into Survivor and up to Old Gen — then see how references and Metaspace decide what can be collected.',
  minutes: 13,
  level: 'intermediate',
  metrics: ['eden', 'survivor', 'oldGen', 'gcPause'],
  legend: [['write', 'allocate'], ['msg', 'GC trace'], 'req', ['fail', 'OOM']],
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
      chapter: 'setup',
      title: 'The reference lives on the stack, the object on the heap',
      body: [
        'Every thread owns a private <strong>stack</strong> of frames: local primitives and <em>references</em>. A frame is freed the moment the method returns.',
        'The object itself — <code>new Order()</code> — lives on the shared <strong>heap</strong>, split into generations. New objects start in <strong>Eden</strong>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Deep recursion fills the stack (StackOverflowError); live objects filling the heap give OutOfMemoryError: Java heap space.',
      },
      metrics: { eden: '12 / 256 MB', survivor: '0 / 32 MB', oldGen: '40 / 512 MB', gcPause: '—' },
      scene: {
        entities: {
          ...zones(),
          stack: stack(),
          order: order(P.inEden, [{ text: `age 0`, tone: `green` }]),
          card: card(`OrderService.java`, [
            `void process() {`,
            `  int qty = 5;            // in the stack frame`,
            `  Order o = new Order();  // ref → object in Eden`,
            `} // frame popped; Order now waits for GC`,
          ]),
        },
        links: { ref: L.ref },
        flows: [{ route: ['ref'], kind: 'write', rate: 1.4 }],
      },
    },
    {
      short: 'String pool',
      chapter: 'technique',
      title: 'Literals are shared through the String pool',
      body: [
        'String literals are interned in the <strong>String pool</strong>, a hash table that has lived <em>inside the heap</em> since Java 7 — so unused entries can be collected.',
        '<code>"ok" == "ok"</code> is the same pooled instance; <code>new String("ok")</code> allocates a copy. Since Java 9, Latin-1 strings store 1 byte per char (Compact Strings).',
      ],
      callout: {
        kind: 'tip',
        text: 'Never intern() unbounded user input — the StringTable grows and every GC has to scan it.',
      },
      changes: ['+ String pool (in the heap)'],
      metrics: { eden: '14 / 256 MB', survivor: '0 / 32 MB', oldGen: '40 / 512 MB', gcPause: '—' },
      scene: {
        entities: {
          ...zones(),
          stack: stack(),
          order: order(P.inEden, [{ text: `age 0`, tone: `green` }]),
          pool: pool([{ text: `"ok" × 1`, tone: `violet` }]),
          card: card(`Strings.java`, [
            `String a = "ok";             // pooled`,
            `String b = "ok";             // a == b  → true`,
            `String c = new String("ok"); // a == c  → false`,
            `// Java 9+: byte[], 1 byte per Latin-1 char`,
          ]),
        },
        links: { ref: L.refQuiet, literal: L.literal },
        flows: [{ route: ['literal'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'TLAB',
      chapter: 'technique',
      title: 'Allocation is a pointer bump in the thread’s TLAB',
      body: [
        'Each thread gets a private <strong>TLAB</strong> (thread-local allocation buffer) carved out of Eden. <code>new</code> just moves a pointer forward — no lock, no free list.',
        'Most objects die young: in a typical service 90%+ of Eden is garbage by the next collection.',
      ],
      callout: {
        kind: 'insight',
        text: 'A TLAB bump allocation is a handful of instructions — often cheaper than malloc() in C.',
      },
      changes: ['~ Eden fills: 240 of 256 MB'],
      metrics: { eden: '240 / 256 MB', survivor: '0 / 32 MB', oldGen: '40 / 512 MB', gcPause: '—' },
      scene: {
        entities: {
          ...zones(),
          stack: stack([{ text: `TLAB bump ptr`, tone: `violet` }]),
          order: order(P.inEden, [{ text: `age 0`, tone: `green` }]),
          pool: pool(),
          card: card(`TLAB fast path (pseudo)`, [
            `top = tlab.top;`,
            `if (top + size <= tlab.end) {`,
            `  tlab.top = top + size;  // no CAS, no lock`,
            `  return top;`,
            `} // else: refill TLAB or slow path`,
          ]),
        },
        links: { ref: L.refQuiet, literal: L.literalQuiet },
        flows: [{ route: ['ref'], kind: 'write', rate: 3 }],
      },
    },
    {
      short: 'Minor GC',
      chapter: 'solution',
      title: 'Minor GC copies the survivors out of Eden',
      body: [
        'Eden is full, so a <strong>Minor GC</strong> runs. It traces from GC roots (thread stacks, statics) and <em>copies</em> only the live objects into a Survivor space, adding 1 to their age.',
        'Everything left in Eden is garbage and is reclaimed by simply resetting Eden — the cost depends on what <em>survives</em>, not on how much was allocated.',
      ],
      callout: {
        kind: 'insight',
        text: 'Survivors flip between S0 and S1 on every Minor GC; one of the two is always empty.',
      },
      changes: ['~ Order copied Eden → Survivor (age 1)', '~ Eden emptied'],
      metrics: { eden: '0 / 256 MB', survivor: '9 / 32 MB', oldGen: '40 / 512 MB', gcPause: '6 ms' },
      scene: {
        entities: {
          ...zones(),
          stack: stack(),
          order: order(P.inSurv, [{ text: `age 1 · copied`, tone: `green` }]),
          pool: pool(),
          card: card(`GC log`, [
            `[gc] GC(12) Pause Young (Normal)`,
            `[gc]   Eden 256M->0M  Survivor 0M->9M`,
            `[gc]   Old 40M->40M`,
            `= [gc] GC(12) 6.1ms`,
          ]),
        },
        links: { ref: L.root, literal: L.literalQuiet },
        flows: [{ route: ['ref'], kind: 'msg', rate: 1.6 }],
      },
    },
    {
      short: 'Old Gen',
      chapter: 'technique',
      title: 'Long-lived objects are tenured into Old Gen',
      body: [
        'Each Minor GC the object survives adds to its age. At the tenuring threshold (max 15) it is <strong>promoted</strong> to Old Gen.',
        '<strong>G1</strong> splits the heap into ~2048 equal regions and, in a <em>mixed</em> collection, evacuates the Old regions with the most garbage first — aiming at <code>MaxGCPauseMillis</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'For sub-millisecond pauses on big heaps, JDK 21 Generational ZGC does the copying concurrently.',
      },
      changes: ['~ Order promoted to Old Gen (age 15)', '~ G1 mixed collection'],
      metrics: { eden: '96 / 256 MB', survivor: '11 / 32 MB', oldGen: '310 / 512 MB', gcPause: '38 ms' },
      scene: {
        entities: {
          ...zones(),
          stack: stack(),
          order: order(P.inOld, [{ text: `tenured · age 15`, tone: `violet` }]),
          pool: pool(),
          card: card(`JVM flags`, [
            `-XX:+UseG1GC -XX:MaxGCPauseMillis=200`,
            `-XX:MaxTenuringThreshold=15`,
            `# JDK 21 low-latency alternative:`,
            `-XX:+UseZGC -XX:+ZGenerational`,
          ]),
        },
        links: { ref: L.root, literal: L.literalQuiet },
        flows: [{ route: ['ref'], kind: 'msg', rate: 1.2 }],
      },
    },
    {
      short: 'References',
      chapter: 'insight',
      title: 'How strongly is it referenced?',
      body: [
        'A <strong>strong</strong> reference keeps the object alive. A <strong>SoftReference</strong> is cleared only when memory runs low (caches). A <strong>WeakReference</strong> is cleared at the very next GC once nothing strong points at it.',
        'A <strong>PhantomReference</strong> with <code>Cleaner</code> runs native cleanup <em>after</em> the object is gone — the replacement for the deprecated <code>finalize()</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'WeakHashMap keys and ThreadLocal map keys are weak references — their values are not.',
      },
      changes: ['~ stack holds only a WeakReference', '~ Order collectable at next GC'],
      metrics: { eden: '120 / 256 MB', survivor: '11 / 32 MB', oldGen: '310 / 512 MB', gcPause: '38 ms' },
      scene: {
        entities: {
          ...zones(),
          stack: stack(),
          order: order(P.inOld, [{ text: `weakly reachable`, tone: `amber` }], { dim: 0.35 }),
          pool: pool(),
          card: card(`References.java`, [
            `var soft = new SoftReference<>(cache); // near OOM`,
            `var weak = new WeakReference<>(order); // next GC`,
            `Cleaner.create().register(res, () -> free(ptr));`,
            `// strong > soft > weak > phantom`,
          ]),
        },
        links: { ref: L.refWeak, literal: L.literalQuiet },
        flows: [{ route: ['ref'], kind: 'msg', rate: 1 }],
      },
    },
    {
      short: 'Metaspace',
      chapter: 'problem',
      title: 'Class metadata lives off-heap in Metaspace',
      body: [
        'Every class the thread loads is defined into native <strong>Metaspace</strong> — methods, bytecode, constant pool — outside the heap since Java 8 (each object header points back to it). <code>-Xmx</code> does not limit it.',
        'Generating classes without bound (proxies, scripting, leaking class loaders) ends in <code>OutOfMemoryError: Metaspace</code>; a leaking static cache ends in <code>Java heap space</code> instead.',
      ],
      callout: {
        kind: 'warn',
        text: 'In containers set -XX:MaxMetaspaceSize next to -Xmx (or MaxRAMPercentage), or native growth gets the Pod OOM-killed.',
      },
      changes: ['+ Metaspace (native memory)', '! 256 MB cap reached'],
      metrics: { eden: '120 / 256 MB', survivor: '11 / 32 MB', oldGen: '180 / 512 MB', gcPause: '38 ms' },
      scene: {
        entities: {
          ...zones(),
          stack: stack(),
          order: order(P.inOld),
          pool: pool(),
          meta: meta([{ text: `OOM: Metaspace`, tone: `red`, icon: `alert` }]),
          card: card(`container JVM flags`, [
            `-XX:MaxRAMPercentage=75`,
            `-XX:MaxMetaspaceSize=256m`,
            `-XX:+HeapDumpOnOutOfMemoryError`,
            `! java.lang.OutOfMemoryError: Metaspace`,
          ]),
        },
        links: { ref: L.refQuiet, loads: L.loads },
        flows: [{ route: ['loads'], kind: 'fail', rate: 1.2 }],
      },
    },
  ],
};
