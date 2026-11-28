import { STAGE, makeDb, makeLink, makePanel, distinctConcepts, type Tag, stageBlock, cardAt, linkOf } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage, two acts. Act 1 (steps 1–6) is class loading: a .class file on the left, the
// loader chain in the middle and above, Metaspace on the right. Act 2 (steps 7–12) is the
// JIT: a hot loop on the left, the execution tier in the middle, profiler counters above,
// CodeCache on the right. Same positions, same ids — the meaning shifts at step 7.
//
//                  helper (parent / profiler)    alt (Bootstrap / optimisation)
//   caller ────── main (loader / tier) ────────── store (Metaspace / CodeCache)

type Opts = Record<string, unknown>;

const positions = {
  caller: STAGE.caller,
  main: STAGE.main,
  store: STAGE.store,
  helper: STAGE.helper,
  alt: STAGE.alt,
};

const block = stageBlock;
const caller = (label: string[], sub: string, tags: Tag[] = [], glyph = `file`) =>
  block(positions.caller, { color: `blue`, glyph, label, sub, tags });
const main = (label: string[], sub: string, tags: Tag[] = [], glyph = `layers`) =>
  block(positions.main, { color: `green`, glyph, label, sub, tags });
const store = (label: string, tags: Tag[] = []) =>
  makeDb(positions.store.x, positions.store.y, { r: 2.2, h: 46, glyph: `database`, label, tags });
const helper = (label: string[], sub: string, glyph: string, tags: Tag[] = []) =>
  block(positions.helper, { color: `orange`, glyph, label, sub, tags });
const alt = (label: string[], sub: string, tags: Tag[] = []) =>
  block(positions.alt, { color: `slab`, glyph: `route`, label, sub, tags });

const links = {
  call: (label?: string) => linkOf(`caller`, `main`, label),
  store: (label?: string) => linkOf(`main`, `store`, label),
  help: (label?: string) => ({ ...linkOf(`helper`, `main`, label, false), labelAt: 0.6 }),
  parent: (label?: string) => ({ ...linkOf(`main`, `helper`, label, false), labelAt: 0.6 }),
  top: (label?: string) => linkOf(`helper`, `alt`, label, false),
  alt: makeLink(`caller`, `alt`, [`caller`, `alt`], { heads: `both`, style: `off` }),
};

/** Code card, parked bottom-left under the caller where nothing else lives. */
const card = cardAt({ x: positions.main.x, y: positions.main.y, dx: -250, dy: 150 }, `code`);

export const javaClassloaderLesson: Lesson = distinctConcepts({
  id: 'java-classloader',
  title: 'ClassLoader, Bytecode & HotSpot JIT',
  summary:
    'From .class file to running code: how classes are loaded, linked and initialised, and how HotSpot’s interpreter, C1 and C2 turn hot bytecode into fast native code.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['phase', 'tier', 'cost', 'risk'],
  legend: [[`req`, `request`], [`write`, `compile / load`], [`fail`, `error / deopt`]],
  goals: [
    { text: 'Load .class bytecode through the Bootstrap loader', step: 1 },
    { text: 'Navigate the three-level ClassLoader hierarchy', step: 2 },
    { text: 'Trace parent delegation', step: 3 },
    { text: 'Link a class: verify, prepare, resolve', step: 4 },
    { text: 'Run initialisation (<clinit>) and the lazy holder', step: 5 },
    { text: 'Tell ClassNotFoundException from NoClassDefFoundError', step: 6 },
    { text: 'Contrast the cold interpreter with the JIT', step: 7 },
    { text: 'Trigger tiered compilation (C1 then C2)', step: 8 },
    { text: 'Inline hot methods; explain JMH warm-up', step: 9 },
    { text: 'Remove allocations with escape analysis', step: 10 },
    { text: 'Trace monomorphic, bimorphic and megamorphic calls', step: 11 },
    { text: 'Handle uncommon-trap deoptimisation', step: 12 },
  ],
  steps: [
    {
      short: 'Bytecode',
      chapter: 'setup',
      title: 'A .class file is bytecode, loaded by Bootstrap',
      body: [
        `<code>javac</code> turns your source into a <code>.class</code> file: a header (the magic bytes <code>CA FE BA BE</code> and a version), a constant pool, and bytecode for each method. The JVM never runs source code.`,
        `Something has to read that file into memory. That is a <span class="term">ClassLoader</span>. The first one, <b>Bootstrap</b>, is built into the JVM and loads the core classes (<code>java.lang.*</code>) from the runtime image.`,
      ],
      changes: [`+ Bootstrap loader`, `+ Metaspace`],
      metrics: { phase: 'loading', tier: 'n/a', cost: '~1 ms', risk: 'none' },
      scene: {
        entities: {
          caller: caller([`Main.class`], `CAFEBABE`, [{ text: `Java 21 · v65`, tone: `violet` }]),
          main: main([`Bootstrap`], `loader · C++`, [{ text: `java.base`, tone: `green` }]),
          store: store(`Metaspace`, [{ text: `class metadata`, tone: `gray` }]),
          card: card(`Inside the class file`, [`$ javap -c -v Main`, `CA FE BA BE 00 00 00 41   // magic + version 65`, `  0: getstatic  System.out`, `  3: ldc        "hi"`, `  5: invokevirtual println`]),
        },
        links: { call: links.call(`defineClass`), store: links.store(`stores`) },
        flows: [{ route: ['call'], kind: 'write', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Hierarchy',
      chapter: 'technique',
      title: 'Three loaders, each with a parent',
      body: [
        `Since Java 9 there are three built-in loaders. <b>Bootstrap</b> loads the core platform. The <b>Platform</b> loader loads other JDK modules. The <b>Application</b> loader loads <em>your</em> classpath.`,
        `Each loader keeps a link to its parent. A class is identified by its name <em>and</em> the loader that defined it — the same <code>.class</code> loaded twice by different loaders gives two different types.`,
      ],
      changes: [`+ Platform loader`, `~ main: Application loader`, `~ Bootstrap becomes the root`],
      metrics: { phase: 'loading', tier: '3 loaders', cost: '~1 ms', risk: 'none' },
      scene: {
        entities: {
          caller: caller([`Order.class`], `your classpath`),
          main: main([`Application`], `classpath loader`, [{ text: `parent: Platform`, tone: `violet` }]),
          store: store(`Metaspace`),
          helper: helper([`Platform`], `JDK modules`, `layers`, [{ text: `parent: Bootstrap`, tone: `violet` }]),
          alt: alt([`Bootstrap`], `java.base`, [{ text: `root`, tone: `green` }]),
          card: card(`Who loaded me?`, [`Order.class.getClassLoader()`, `   → jdk.internal.loader.ClassLoaders$AppClassLoader`, `String.class.getClassLoader()`, `   → null   // Bootstrap`]),
        },
        links: { call: links.call(`loadClass`), store: links.store(), parent: links.parent(`parent`), top: links.top(`parent`) },
        flows: [{ route: ['call'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Delegate',
      chapter: 'insight',
      title: 'Parent first: the delegation rule',
      body: [
        `To load a class, a loader first asks its <b>parent</b>. Only if every ancestor says “not found” does it try itself. So <code>java.lang.String</code> is always answered by Bootstrap.`,
        `That is a security feature: your classpath cannot supply its own <code>java.lang.String</code> and trick the JVM into trusting it. Application servers sometimes reverse the order (child-first) on purpose.`,
      ],
      changes: [`~ request travels up the chain`],
      metrics: { phase: 'delegation', tier: 'top-down', cost: '~0.1 ms', risk: 'spoof blocked' },
      scene: {
        entities: {
          caller: caller([`Order.class`], `uses String`),
          main: main([`Application`], `asks parent first`, [{ text: `fake String ✗`, tone: `red` }]),
          store: store(`Metaspace`),
          helper: helper([`Platform`], `not found → up`, `layers`, [{ text: `asks parent`, tone: `violet` }]),
          alt: alt([`Bootstrap`], `core classes`, [{ text: `answers ✓`, tone: `green`, icon: `shield` }]),
          card: card(`loadClass(name)`, [`1. findLoadedClass(name)`, `2. parent.loadClass(name)      // ask upward first`, `3. findClass(name)               // only if parent failed`]),
        },
        links: { call: links.call(`String?`), store: links.store(), parent: links.parent(`delegates`), top: links.top(`delegates`) },
        flows: [{ route: ['parent'], rate: 1.4 }, { route: ['top'], rate: 1.4 }],
      },
    },
    {
      short: 'Linking',
      chapter: 'technique',
      title: 'Linking: verify, prepare, resolve',
      body: [
        `After loading, a class is <b>linked</b> in three parts. <span class="term">Verify</span> checks the bytecode is well-formed and type-safe (otherwise <code>VerifyError</code>). <span class="term">Prepare</span> allocates static fields with default values (0, null).`,
        `<span class="term">Resolve</span> replaces symbolic names (“call <code>Order.total</code>”) with direct references — often lazily, the first time they are used.`,
      ],
      changes: [`~ helper: Verifier`, `~ main: Order (linking)`],
      metrics: { phase: 'linking', tier: 'verify · prepare', cost: '~2 ms', risk: 'VerifyError' },
      scene: {
        entities: {
          caller: caller([`Order.class`], `loaded`),
          main: main([`Order`], `linking…`, [{ text: `verify ✓ prepare ✓`, tone: `green` }]),
          store: store(`Metaspace`, [{ text: `static count = 0`, tone: `amber` }]),
          helper: helper([`Verifier`], `type-safe?`, `shield`, [{ text: `rejects bad code`, tone: `violet` }]),
          card: card(`Prepare vs initialise`, [`static int count = 5;`, `prepare:      count = 0     // default, no code runs`, `= initialise:   count = 5     // <clinit> runs later`]),
        },
        links: { call: links.call(`link`), store: links.store(`prepare`), help: links.help(`verify`) },
        flows: [{ route: ['help'], kind: 'write', rate: 1.2 }],
      },
    },
    {
      short: 'Init',
      chapter: 'technique',
      title: 'Initialisation runs once, on first use',
      body: [
        `Initialisation executes the class’s <code>&lt;clinit&gt;</code>: static field initialisers and <code>static {}</code> blocks. It happens on the <em>first use</em> — a <code>new</code>, a static call, a static field read — and the JVM takes a lock so it runs exactly once, even with many threads.`,
        `That makes the <b>lazy holder idiom</b> a free, thread-safe singleton: the inner class is only initialised when <code>getInstance()</code> is first called.`,
      ],
      changes: [`~ main: Order initialised`, `~ static count = 5`],
      metrics: { phase: 'init', tier: '<clinit>', cost: 'once', risk: 'ExceptionInInit' },
      scene: {
        entities: {
          caller: caller([`first use`], `new Order()`, [{ text: `triggers init`, tone: `amber` }], `zap`),
          main: main([`Order`], `initialised`, [{ text: `clinit done`, tone: `green` }]),
          store: store(`Metaspace`, [{ text: `static count = 5`, tone: `green` }]),
          helper: helper([`init lock`], `one thread wins`, `lock`, [{ text: `runs once`, tone: `violet` }]),
          card: card(`Lazy holder singleton`, [`class Config {`, `  private static class Holder { static final Config I = new Config(); }`, `  static Config get() { return Holder.I; }   // init on first call`, `}`]),
        },
        links: { call: links.call(`first use`), store: links.store(`static init`), help: links.help(`locks`) },
        flows: [{ route: ['help'], kind: 'write', rate: 1 }, { route: ['call'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Failures',
      chapter: 'problem',
      title: 'ClassNotFoundException vs NoClassDefFoundError',
      body: [
        `<code>ClassNotFoundException</code> is a checked exception from <em>looking a class up by name</em> — <code>Class.forName("com.x.Plugin")</code> or <code>loadClass</code> — and finding nothing. You can catch it and fall back.`,
        `<code>NoClassDefFoundError</code> is an <b>Error</b>: the class existed at compile time but is gone at runtime (missing JAR), or its static initialiser failed earlier. Fix the classpath or the initialiser, not the call site.`,
      ],
      changes: [`+ custom loader alt`, `~ main: class missing`],
      metrics: { phase: 'runtime', tier: 'custom loader', cost: 'n/a', risk: 'CNFE / NCDFE' },
      scene: {
        entities: {
          caller: caller([`Plugin call`], `new Plugin()`, [{ text: `NoClassDefFound`, tone: `red`, icon: `alert` }], `alert`),
          main: main([`Application`], `class not found`, [{ text: `ClassNotFound`, tone: `red` }]),
          store: store(`Metaspace`, [{ text: `no Plugin entry`, tone: `amber` }]),
          helper: helper([`Platform`], `not found`, `layers`),
          alt: alt([`URLClassLoader`], `plugin JARs`, [{ text: `child-first`, tone: `violet` }]),
          card: card(`Two different errors`, [`Class.forName("x.Plugin");   // ! ClassNotFoundException`, `new Plugin();                  // ! NoClassDefFoundError`, `= new URLClassLoader(urls, parent).loadClass(n)`]),
        },
        links: { call: links.call(`forName`), store: links.store(), parent: links.parent(`not found`) },
        flows: [{ route: ['call'], kind: 'fail', rate: 1, bounce: true }],
      },
    },
    {
      short: 'Slow start',
      chapter: 'setup',
      title: 'Why Java starts slow: the interpreter',
      body: [
        `Everything above prepared the bytecode. Now it has to run. At first HotSpot <b>interprets</b> it, one bytecode at a time — simple and instant to start, but 10–50× slower than native code.`,
        `While interpreting it counts how often each method is called and each loop iterates. Those counters are how the JVM discovers which code is <em>hot</em>.`,
      ],
      changes: [`~ caller: hot loop`, `~ main: Interpreter (tier 0)`, `+ profiler counters`],
      metrics: { phase: 'execute', tier: 'tier 0', cost: '50 ns/call', risk: 'slow warm-up' },
      scene: {
        entities: {
          caller: caller([`hot loop`], `1M × f(i)`, [{ text: `just started`, tone: `amber` }], `refresh`),
          main: main([`Interpreter`], `bytecode by bytecode`, [{ text: `tier 0`, tone: `amber` }]),
          store: store(`bytecode`, [{ text: `Order.total()`, tone: `gray` }]),
          helper: helper([`counters`], `calls · loops`, `gauge`, [{ text: `f(): 120 calls`, tone: `violet` }]),
          card: card(`Watch it warm up`, [`for (int i = 0; i < 1_000_000; i++) sum += f(i);`, `$ java -XX:+PrintCompilation App`, `= nothing compiled yet — counters only`]),
        },
        links: { call: links.call(`run`), store: links.store(`reads`), help: links.help(`counts`) },
        flows: [{ route: ['call'], rate: 1.4, bounce: true }, { route: ['help'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'C1 → C2',
      chapter: 'solution',
      title: 'Tiered compilation: C1 fast, C2 peak',
      body: [
        `When a method crosses a threshold (roughly 200 calls) <b>C1</b> compiles it quickly to native code with light optimisation. If it keeps getting hotter (thousands of calls) <b>C2</b> recompiles it with aggressive, profile-guided optimisation.`,
        `A loop that is still running can be swapped to compiled code mid-flight — <span class="term">on-stack replacement</span> (OSR). Compiled code lives in the <b>CodeCache</b>.`,
      ],
      changes: [`~ main: C1 → C2`, `~ store: CodeCache`],
      metrics: { phase: 'execute', tier: 'tier 3 → 4', cost: '5 ns/call', risk: 'warm-up cost' },
      scene: {
        entities: {
          caller: caller([`hot loop`], `1M × f(i)`, [{ text: `running native`, tone: `green` }], `refresh`),
          main: main([`C1 → C2`], `tiered compiler`, [{ text: `tier 4`, tone: `green`, icon: `zap` }], `zap`),
          store: store(`CodeCache`, [{ text: `f(): native`, tone: `green` }]),
          helper: helper([`counters`], `hot > threshold`, `gauge`, [{ text: `f(): 8,500 calls`, tone: `amber` }]),
          card: card(`Compile log`, [`  120   3  Order::total   (C1, with profiling)`, ` 8500   4  Order::total   (C2, optimised)`, `= made not entrant: tier 3 version`]),
        },
        links: { call: links.call(`run`), store: links.store(`installs`), help: links.help(`hot!`) },
        flows: [{ route: ['store'], kind: 'write', rate: 1.2, bounce: true }, { route: ['call'], rate: 1.6, bounce: true }],
      },
    },
    {
      short: 'Inlining',
      chapter: 'technique',
      title: 'Inlining: the mother of all optimisations',
      body: [
        `The biggest win is <span class="term">inlining</span>: C2 copies a small callee’s body into the caller, removing the call and letting the optimiser see across the boundary. Hot methods up to ~325 bytecodes qualify, tiny ones (≤35) always.`,
        `This is why micro-benchmarks need <b>warm-up</b>: the first runs measure the interpreter and C1, not the final code. Use JMH, which warms up and prevents dead-code removal.`,
      ],
      changes: [`+ inlined body`, `~ call overhead → 0`],
      metrics: { phase: 'execute', tier: 'tier 4', cost: '1 ns/call', risk: 'giant methods' },
      scene: {
        entities: {
          caller: caller([`hot loop`], `calls sq(i)`, [{ text: `no call left`, tone: `green` }], `refresh`),
          main: main([`C2`], `optimiser`, [{ text: `inlined sq()`, tone: `violet`, icon: `layers` }], `zap`),
          store: store(`CodeCache`, [{ text: `loop: x*x inline`, tone: `green` }]),
          helper: helper([`counters`], `size ≤ 325 B`, `gauge`, [{ text: `hot + small`, tone: `green` }]),
          alt: alt([`sq(int)`], `4 bytecodes`, [{ text: `copied in`, tone: `gray` }]),
          card: card(`Before and after`, [`int sq(int x) { return x * x; }`, `for (...) sum += sq(i);      // call`, `= for (...) sum += i * i;       // after inlining`]),
        },
        links: { call: links.call(`run`), store: links.store(), help: links.help(`profile`) },
        flows: [{ route: ['call'], rate: 1.8, bounce: true }],
      },
    },
    {
      short: 'Escape',
      chapter: 'insight',
      title: 'Escape analysis: new Point() costs nothing',
      body: [
        `If C2 can prove an object never <em>escapes</em> the method — it isn’t stored in a field or returned — it needn’t allocate it at all. The fields become local variables (<span class="term">scalar replacement</span>).`,
        `No heap allocation means no garbage collection pressure. The same analysis removes locks on objects only one thread can see (lock elision).`,
      ],
      changes: [`~ store: heap allocations 0`, `+ scalar replacement`],
      metrics: { phase: 'execute', tier: 'tier 4', cost: '0 B heap', risk: 'escapes' },
      scene: {
        entities: {
          caller: caller([`hot loop`], `dist(a, b)`, [{ text: `1M iterations`, tone: `gray` }], `refresh`),
          main: main([`C2`], `escape analysis`, [{ text: `NoEscape`, tone: `green`, icon: `shield` }], `zap`),
          store: store(`Heap`, [{ text: `0 B allocated`, tone: `green` }]),
          helper: helper([`counters`], `site: new Point`, `gauge`, [{ text: `never leaves`, tone: `violet` }]),
          alt: alt([`registers`], `x, y as locals`, [{ text: `scalars`, tone: `green` }]),
          card: card(`No allocation`, [`double dist(Point a) {`, `    var d = new Point(a.x - 1, a.y - 1);   // never escapes`, `    return Math.hypot(d.x, d.y);`, `} // = no new Point at runtime`]),
        },
        links: { call: links.call(`dist()`), store: links.store(`no alloc`), help: links.help(`proves`) },
        flows: [{ route: ['call'], rate: 1.8, bounce: true }],
      },
    },
    {
      short: 'Mega call',
      chapter: 'problem',
      title: 'Mono → bi → megamorphic call sites',
      body: [
        `To inline an interface call, C2 must know which class it will hit. A call site that has only ever seen <b>one</b> type is <span class="term">monomorphic</span> — inlined with a cheap type check. <b>Two</b> types (bimorphic) are still inlined.`,
        `At <b>three or more</b> receiver types the site is <span class="term">megamorphic</span>: HotSpot falls back to a virtual-table call and can no longer inline or optimise across it. Keep hot call sites to one or two implementations.`,
      ],
      changes: [`~ call site: 1 → 2 → 3 types`, `− inlining lost`],
      metrics: { phase: 'execute', tier: 'tier 4', cost: '3× slower', risk: 'megamorphic' },
      scene: {
        entities: {
          caller: caller([`hot loop`], `shape.area()`, [{ text: `Circle · Square · Tri`, tone: `amber` }], `refresh`),
          main: main([`C2`], `vtable call`, [{ text: `no inline`, tone: `red`, icon: `alert` }], `zap`),
          store: store(`CodeCache`, [{ text: `generic dispatch`, tone: `amber` }]),
          helper: helper([`call site`], `profile: 3 types`, `gauge`, [{ text: `megamorphic`, tone: `red` }]),
          alt: alt([`mono / bi`], `inlined`, [{ text: `1–2 types`, tone: `green` }]),
          card: card(`Receiver types`, [`shape.area();   // seen: Circle           → mono`, `                 // seen: Circle, Square   → bi (inline)`, `! seen: Circle, Square, Triangle → megamorphic`]),
        },
        links: { call: links.call(`area()`), store: links.store(), help: links.help(`profile`) },
        flows: [{ route: ['call'], kind: 'fail', rate: 1, bounce: true }],
      },
    },
    {
      short: 'Deopt',
      chapter: 'recap',
      title: 'When an assumption breaks: deoptimisation',
      body: [
        `C2’s code is built on assumptions from profiling: “this call site only sees <code>Circle</code>”, “this branch is never taken”. It inserts an <span class="term">uncommon trap</span> where the assumption could fail.`,
        `When a new class appears, the trap fires: the JVM <b>deoptimises</b> — throws away the compiled code, falls back to the interpreter at the exact same point, and re-profiles. After a while it compiles again with better knowledge.`,
      ],
      changes: [`− C2 code made not entrant`, `~ back to tier 0`, `+ re-profile`],
      metrics: { phase: 'deopt', tier: 'tier 4 → 0', cost: '~ms pause', risk: 'uncommon trap' },
      scene: {
        entities: {
          caller: caller([`hot loop`], `new type seen`, [{ text: `surprise Hexagon`, tone: `amber` }], `refresh`),
          main: main([`Interpreter`], `resumes here`, [{ text: `deoptimised`, tone: `red`, icon: `alert` }]),
          store: store(`CodeCache`, [{ text: `C2 code discarded`, tone: `red` }]),
          helper: helper([`counters`], `re-profiling`, `gauge`, [{ text: `starts again`, tone: `violet` }]),
          card: card(`Deopt log`, [`$ java -XX:+UnlockDiagnosticVMOptions \\`, `       -XX:+TraceDeoptimization App`, `! Uncommon trap: reason=class_check  Shape::area`, `= made not entrant, recompile later`]),
        },
        links: { call: links.call(`new type`), store: links.store(`discards`), help: links.help(`re-profile`) },
        flows: [{ route: ['store'], kind: 'fail', rate: 1, bounce: true }, { route: ['help'], kind: 'write', rate: 1 }],
      },
    },
  ],
});
