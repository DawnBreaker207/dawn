/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaClassloaderLesson: Lesson = {
  id: 'java-classloader',
  title: 'ClassLoader, Bytecode & HotSpot JIT',
  summary:
    'Trace the full JVM execution pipeline: Bootstrap/Platform/App ClassLoaders, Parent Delegation, Linking, <clinit>, Tiered C1/C2 JIT, Inlining & Escape Analysis.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['phase', 'loader', 'delegation', 'runtime_error'],
  legend: ['flow', ['req', 'delegation up'], ['res', 'load / link down'], ['fail', 'missing class']],
  goals: [
    { text: 'Load .class bytecode into Bootstrap ClassLoader', step: 1 },
    { text: 'Navigate 3-tier ClassLoader hierarchy', step: 2 },
    { text: 'Trace Parent Delegation Model', step: 3 },
    { text: 'Execute Linking: Verify, Prepare & Resolve', step: 4 },
    { text: 'Run Initialization (<clinit>) & Lazy Holder', step: 5 },
    { text: 'Diagnose ClassNotFoundException vs NoClassDefFoundError', step: 6 },
{ text: 'Contrast cold Bytecode Interpreter vs HotSpot JIT', step: 7 },
    { text: 'Trigger Tiered Compilation (C1 -> C2) via counters', step: 8 },
    { text: 'Inline hot methods & explain why JMH needs warmup', step: 9 },
    { text: 'Eliminate Heap alloc via Escape Analysis (Scalar)', step: 10 },
    { text: 'Trace Monomorphic -> Bimorphic -> Megamorphic calls', step: 11 },
    { text: 'Handle Uncommon Trap Deoptimization back to Bytecode', step: 12 },
  ],
  steps: [
    {
      short: 'Bytecode',
      chapter: 'loading',
      title: '1. .class Bytecode & Bootstrap ClassLoader',
      body: [
        'Java compiles <code>.java</code> into platform-neutral <code>.class</code> bytecode, loaded lazily on first active reference — not all at startup.',
        'At the root sits the native C++ <strong>Bootstrap ClassLoader</strong> (<code>null</code> in Java), responsible for loading core JDK modules like <code>java.base</code> (<code>String</code>, <code>Object</code>).',
      ],
      callout: {
        kind: 'insight',
        text: 'String.class.getClassLoader() returns null because Bootstrap is implemented in native JVM C++ code.',
      },
      metrics: { phase: 'Loading', loader: 'Bootstrap (C++)', delegation: 'Root', runtime_error: 'None' },
      scene: {
        entities: {
          disk: b(-12, -8, { r: 2.2, h: 48, color: 'blue', label: ['JDK Modules'], sub: 'java.base' }),
          boot: d(2, -8, { s: 4.6, h: 52, color: 'purple', glyph: 'shield', label: ['Bootstrap Loader'], sub: 'native C++' }),
          card: S({ x: -12, y: 12 }, '1. Lazy Class Loading & Bootstrap', [
            '// Core JDK classes loaded by native Bootstrap:',
            'ClassLoader cl = String.class.getClassLoader(); // null',
            '// Application classes loaded lazily on first use:',
            'OrderService svc = new OrderService(); // triggers load',
          ], { icon: 'terminal' }),
        },
        links: {
          jdk_boot: h('disk', 'boot', ['disk', 'boot'], { heads: 'end', label: 'read jimage' }),
        },
        flows: [{ route: ['jdk_boot'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Hierarchy',
      chapter: 'loading',
      title: '2. The 3-Tier ClassLoader Hierarchy',
      body: [
        'Modern Java (9–21) organizes built-in loaders into 3 tiers: <strong>Bootstrap</strong> (<code>java.base</code>) → <strong>Platform</strong> (standard platform modules like <code>java.sql</code>) → <strong>Application</strong> (your classpath / modulepath).',
        'Each ClassLoader maintains its own namespace in <strong>Metaspace</strong>: the same <code>.class</code> loaded by two different loaders becomes two incompatible types at runtime.',
      ],
      callout: {
        kind: 'tip',
        text: 'Uniqueness of a Java class at runtime is defined by the pair (Fully Qualified Name, Defining ClassLoader).',
      },
      changes: ['+ PlatformClassLoader (JDK 9+) replaces ExtClassLoader', '+ AppClassLoader loads application classpath'],
      metrics: { phase: 'Loading', loader: '3-Tier Tree', delegation: 'Parent Links', runtime_error: 'None' },
      scene: {
        entities: {
          boot: d(-14, -10, { s: 4.4, h: 50, color: 'purple', glyph: 'shield', label: ['Bootstrap'], sub: 'java.base' }),
          plat: d(0, -10, { s: 4.4, h: 50, color: 'blue', glyph: 'layers', label: ['Platform'], sub: 'java.sql / xml' }),
          app: d(14, -10, { s: 4.4, h: 50, color: 'green', glyph: 'code', label: ['Application'], sub: 'classpath jar' }),
          card: S({ x: -12, y: 12 }, '2. Built-in ClassLoader Hierarchy', [
            'ClassLoader app  = MyApp.class.getClassLoader();',
            'ClassLoader plat = app.getParent();  // PlatformClassLoader',
            'ClassLoader boot = plat.getParent(); // null (Bootstrap)',
            '// Class identity = (FQCN + Defining ClassLoader)',
          ], { icon: 'terminal' }),
        },
        links: {
          app_plat: h('app', 'plat', ['app', 'plat'], { heads: 'end', label: 'parent' }),
          plat_boot: h('plat', 'boot', ['plat', 'boot'], { heads: 'end', label: 'parent' }),
        },
        flows: [{ route: ['app_plat', 'plat_boot'], kind: 'req', rate: 1.6 }],
      },
    },
    {
      short: 'Delegation',
      chapter: 'loading',
      title: '3. Parent Delegation Model (Security Sandbox)',
      body: [
        'When <code>AppClassLoader.loadClass("java.lang.String")</code> is called, it does NOT read disk immediately. It delegates upward to <code>Platform</code>, which delegates to <code>Bootstrap</code>.',
        'Only if the parent cannot find the class does the child attempt <code>findClass()</code>. This prevents a malicious JAR from spoofing <code>java.lang.String</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Parent Delegation guarantees core JDK classes are always loaded once by Bootstrap, preventing type spoofing.',
      },
      changes: ['+ Request bubbles up to Bootstrap first', '+ Child findClass() runs only if parent returns null'],
      metrics: { phase: 'Delegation', loader: 'App -> Boot', delegation: 'Top-Down', runtime_error: 'Prevented Spoof' },
      scene: {
        entities: {
          caller: y(-15, -16, { label: 'App Code' }),
          app: d(-1, -16, { s: 4.4, h: 50, color: 'green', glyph: 'code', label: ['AppClassLoader'], sub: '1. delegate up' }),
          boot: d(14, -16, { s: 4.4, h: 50, color: 'purple', glyph: 'shield', label: ['Bootstrap'], sub: '2. found it' }),
          metaspace: b(4, 0, { r: 2.2, h: 48, color: 'cyan', label: ['Metaspace'], sub: 'Class<?> meta' }),
          card: S({ x: -12, y: 12 }, '3. ClassLoader.loadClass() Delegation', [
            'protected Class<?> loadClass(String name, boolean resolve) {',
            '  Class<?> c = findLoadedClass(name);',
            '  if (c == null) {',
            '    if (parent != null) c = parent.loadClass(name, false);',
            '    else c = findBootstrapClassOrNull(name);',
            '    if (c == null) c = findClass(name); // fallback',
            '  } return c;',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          call_app: h('caller', 'app', ['caller', 'app'], { heads: 'end', label: 'loadClass' }),
          app_boot: h('app', 'boot', ['app', 'boot'], { heads: 'end', label: 'delegate up' }),
          boot_meta: h('boot', 'metaspace', ['boot', 'metaspace'], { heads: 'end', label: 'define' }),
        },
        flows: [{ route: ['call_app', 'app_boot', 'boot_meta'], kind: 'req', rate: 2.0 }],
      },
    },
    {
      short: 'Linking',
      chapter: 'linking',
      title: '4. Linking: Verify, Prepare & Resolve',
      body: [
        'Once loaded, the JVM <strong>Links</strong> the class in 3 strict sub-steps before any code runs:',
        '1. <strong>Verify</strong>: validates bytecode magic <code>0xCAFEBABE</code> & stack-map frames.<br>2. <strong>Prepare</strong>: allocates static fields in Metaspace/Heap with <em>zero</em> defaults (<code>0</code>, <code>null</code>).<br>3. <strong>Resolve</strong>: replaces symbolic constant-pool refs with direct pointers.',
      ],
      callout: {
        kind: 'insight',
        text: 'During Prepare, static int x = 42 is set to 0 first! The value 42 is assigned later during Initialization.',
      },
      changes: ['+ Bytecode Verifier checks 0xCAFEBABE & type safety', '+ Prepare zeroes static fields; Resolve binds pointers'],
      metrics: { phase: 'Linking', loader: 'JVM Verifier', delegation: 'Complete', runtime_error: 'VerifyError' },
      scene: {
        entities: {
          verify: d(-14, -8, { s: 4.4, h: 50, color: 'orange', glyph: 'shield', label: ['1. Verify'], sub: '0xCAFEBABE' }),
          prepare: d(0, -8, { s: 4.4, h: 50, color: 'blue', glyph: 'layers', label: ['2. Prepare'], sub: 'static=0/null' }),
          resolve: d(14, -8, { s: 4.4, h: 50, color: 'green', glyph: 'route', label: ['3. Resolve'], sub: 'direct ptrs' }),
          card: S({ x: -12, y: 12 }, '4. Linking Sub-Phases', [
            '// 1. Verify: stack-frame & bytecode integrity',
            '// 2. Prepare: static int count = 5 -> set to 0 first!',
            'static final int CONST = 10; // inline constant',
            '// 3. Resolve: symbolic #12 -> direct Method* pointer',
          ], { icon: 'terminal' }),
        },
        links: {
          v_p: h('verify', 'prepare', ['verify', 'prepare'], { heads: 'end', label: 'valid' }),
          p_r: h('prepare', 'resolve', ['prepare', 'resolve'], { heads: 'end', label: 'allocated' }),
        },
        flows: [{ route: ['v_p', 'p_r'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Init <clinit>',
      chapter: 'init',
      title: '5. Initialization (<clinit>) & Lazy Holder',
      body: [
        '<strong>Initialization</strong> runs the compiler-generated <code>&lt;clinit&gt;()</code> method (static field assignments + <code>static {}</code> blocks) under an internal JVM class-initialization lock.',
        'Because the JVM guarantees <code>&lt;clinit&gt;()</code> runs atomically once, the <strong>Initialization-on-Demand Holder</strong> pattern achieves lock-free lazy Singletons.',
      ],
      callout: {
        kind: 'tip',
        text: 'Class.forName("com.mysql.Driver") runs <clinit>; ClassLoader.loadClass() only loads without initializing!',
      },
      changes: ['+ JVM executes <clinit>() under init lock once', '+ Holder inner class stays uninitialized until accessed'],
      metrics: { phase: 'Init <clinit>', loader: 'Thread-Safe', delegation: 'Atomic Once', runtime_error: 'ExceptionInInit' },
      scene: {
        entities: {
          initLock: d(-10, -8, { s: 4.4, h: 50, color: 'purple', glyph: 'shield', label: ['JVM Init Lock'], sub: 'runs once' }),
          clinit: d(6, -8, { s: 4.4, h: 50, color: 'green', glyph: 'cpu', label: ['<clinit>()'], sub: 'static blocks' }),
          card: S({ x: -12, y: 12 }, '5. Thread-Safe <clinit> & Lazy Holder', [
            'public class Config {',
            '  private static class Holder {',
            '    // JVM holds lock during <clinit> automatically:',
            '    static final Config INSTANCE = new Config();',
            '  }',
            '  public static Config get() { return Holder.INSTANCE; }',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          lock_clinit: h('initLock', 'clinit', ['initLock', 'clinit'], { heads: 'end', label: 'assign statics' }),
        },
        flows: [{ route: ['lock_clinit'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Failures',
      chapter: 'runtime',
      title: '6. Custom Loaders & Missing Class Errors',
      body: [
        'Plugin containers (Spring Boot Fat JAR, Tomcat, OSGi) use custom <code>URLClassLoader</code>s to isolate dependencies or reverse delegation.',
        'Know the two classic errors:<br>• <code>ClassNotFoundException</code> (checked): dynamic <code>Class.forName()</code> failed to find the class.<br>• <code>NoClassDefFoundError</code> (Error): class existed at compile time, or its <code>&lt;clinit&gt;</code> failed earlier.',
      ],
      callout: {
        kind: 'warning',
        text: 'If <clinit> throws an exception on first load, any later access throws NoClassDefFoundError!',
      },
      changes: ['+ Custom URLClassLoader loads isolated plugin JARs', '+ Contrast ClassNotFoundException vs NoClassDefFoundError'],
      metrics: { phase: 'Runtime', loader: 'URLClassLoader', delegation: 'Child-First Opt', runtime_error: 'CNFE vs NCDFE' },
      scene: {
        entities: {
          customCl: d(-14, -8, { s: 4.4, h: 50, color: 'cyan', glyph: 'boxes', label: ['URLClassLoader'], sub: 'plugin.jar' }),
          cnfe: d(3, -15, { s: 4.2, h: 48, color: 'orange', glyph: 'alert', label: ['ClassNotFound'], sub: 'checked exc' }),
          ncdfe: d(3, -1, { s: 4.2, h: 48, color: 'red', glyph: 'alert', label: ['NoClassDefFound'], sub: 'link/init err' }),
          card: S({ x: -12, y: 12 }, '6. Custom ClassLoader & Linkage Errors', [
            '// Checked: dynamic lookup cannot find .class on path',
            'Class.forName("com.missing.Plugin"); // -> ClassNotFoundException',
            '',
            '// Error: present at compile time, missing at runtime',
            '// or <clinit> threw ExceptionInInitializerError earlier',
            'new BrokenStaticInit(); // -> NoClassDefFoundError',
          ], { icon: 'terminal' }),
        },
        links: {
          cl_cnfe: h('customCl', 'cnfe', ['customCl', 'cnfe'], { heads: 'end', label: 'forName fail', style: 'dashed' }),
          cl_ncdfe: h('customCl', 'ncdfe', ['customCl', 'ncdfe'], { heads: 'end', label: 'link/init fail', style: 'dashed' }),
        },
        flows: [
          { route: ['cl_cnfe'], kind: 'fail', rate: 1.5 },
          { route: ['cl_ncdfe'], kind: 'fail', rate: 1.5 },
        ],
      },
    },
{
      short: 'Interpreter',
      chapter: 'jit',
      title: '7. Why Java Starts Slow: Bytecode Interpreter',
      body: [
        'At startup, HotSpot does NOT compile every method to native machine code (that would make startup slow). It executes <code>.class</code> bytecode one opcode at a time in the <strong>Interpreter</strong>.',
        'At the same time, the Interpreter counts method invocations and loop back-edges to spot hot code.',
      ],
      callout: {
        kind: 'insight',
        text: 'Cold startup code runs interpreted; only the ~10% hot paths get heavy C2 native optimization.',
      },
      metrics: { exec_tier: 'Tier 0 Interp', call_profile: 'Counting hits', allocation: 'Heap normal', tricky_effect: 'Slow warmup' },
      scene: {
        entities: {
          bc: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['.class Op'], sub: 'cold bytecode' }),
          intp: d(2, -6, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['Interpreter'], sub: 'count++ loops' }),
          card: S({ x: -12, y: 12 }, '1. Why First-Run Benchmarks Lie', [
            '// First 100 calls run in Tier 0 Bytecode Interpreter:',
            'for (int i = 0; i < 100; i++) sum(a, b); // ~10x slower!',
            '// Never benchmark Java without JMH @Warmup iterations!',
          ], { icon: 'terminal' }),
        },
        links: {
          bc_in: h('bc', 'intp', ['bc', 'intp'], { heads: 'end', label: 'interpret' }),
        },
        flows: [{ route: ['bc_in'], kind: 'req', rate: 1.5 }],
      },
    },
    {
      short: 'Tiered C1/C2',
      chapter: 'jit',
      title: '8. Tiered Compilation: C1 Fast vs C2 Peak Native',
      body: [
        'Once a method warms up (~2,000 hits), the <strong>C1</strong> compiler quickly emits native machine code with profiling probes.',
        'Around ~10,000 invocations, the heavy <strong>C2</strong> (Server) compiler uses those runtime profiles to emit peak x86/ARM64 machine code into the <strong>CodeCache</strong>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Even a single giant loop in main() gets hot-swapped mid-loop via On-Stack Replacement (OSR)!',
      },
      changes: ['+ C1 compiles fast with branch profiles', '+ C2 optimizes peak native into CodeCache'],
      metrics: { exec_tier: 'Tier 3/4 C1->C2', call_profile: 'Hot >10k', allocation: 'CodeCache', tricky_effect: 'OSR mid-loop' },
      scene: {
        entities: {
          intp: d(-12, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['Interpreter'], sub: '10k+ hits' }),
          c1: d(0, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['C1 Compiler'], sub: 'fast + profile' }),
          c2: b(0, 0, { r: 2.2, h: 48, color: 'green', label: ['C2 CodeCache'], sub: 'peak x86/ARM' }),
          card: S({ x: -12, y: 12 }, '2. HotSpot Tiered Compilation Pipeline', [
            '// Tier 0: Interpreter -> Tier 3: C1 (profiling)',
            '// Tier 4: C2 (aggressive inlining, loop unrolling)',
            '// Stored in native CodeCache (-XX:ReservedCodeCacheSize)',
          ], { icon: 'terminal' }),
        },
        links: {
          in_c1: h('intp', 'c1', ['intp', 'c1'], { heads: 'end', label: '~2k hits' }),
          c1_c2: h('c1', 'c2', ['c1', 'c2'], { heads: 'end', label: '~10k peak' }),
        },
        flows: [{ route: ['in_c1', 'c1_c2'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'Inlining',
      chapter: 'jit',
      title: '9. Method Inlining: The Mother of All JIT Optimizations',
      body: [
        'Java encourages small helper methods and getters. C2 <strong>inlines</strong> small hot methods (typically $\\le 325$ bytes of bytecode) directly into the caller, removing call-frame overhead.',
        'Inlining exposes dead code and constants across method boundaries so Escape Analysis and loop vectorization can fire!',
      ],
      callout: {
        kind: 'insight',
        text: 'Giant 500-line methods fail FreqInlineSize (325 bytes) and miss inlining — keep hot methods small and focused!',
      },
      changes: ['+ Small hot callees (<=325B) pasted inline', '+ Unlocks constant folding & dead-code elim'],
      metrics: { exec_tier: 'C2 Inlined', call_profile: '<=325B byte', allocation: 'Zero frame', tricky_effect: 'Giant method' },
      scene: {
        entities: {
          caller: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['Hot Caller'], sub: 'totalPrice()' }),
          get: d(0, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['getPrice()'], sub: '8B bytecode' }),
          c2: d(0, 0, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['Inlined Body'], sub: '0 call hops' }),
          card: S({ x: -12, y: 12 }, '3. Why Small Methods Run Faster in Java', [
            '// Before C2: caller -> CALL getPrice() -> RET',
            '// After C2 Inlining: direct CPU register load!',
            '// Limit: -XX:FreqInlineSize=325 (hot bytecode bytes)',
          ], { icon: 'terminal' }),
        },
        links: {
          cl_gt: h('caller', 'get', ['caller', 'get'], { heads: 'end', label: 'hot <=325B' }),
          gt_in: h('get', 'c2', ['get', 'c2'], { heads: 'end', label: 'paste inline' }),
        },
        flows: [{ route: ['cl_gt', 'gt_in'], kind: 'res', rate: 2.1 }],
      },
    },
    {
      short: 'Escape Analysis',
      chapter: 'jit',
      title: '10. Escape Analysis: Why new Point() Costs 0 GC!',
      body: [
        'If C2 proves via <strong>Escape Analysis</strong> that <code>new Point(x, y)</code> never escapes the current method or thread, it performs <strong>Scalar Replacement</strong>!',
        'The object is never allocated on the Heap at all — its <code>x</code> and <code>y</code> fields sit directly in CPU registers/Stack with <strong>zero GC pressure</strong>!',
      ],
      callout: {
        kind: 'insight',
        text: 'Escape Analysis also performs Lock Elision: synchronized(new Object()) that never escapes is completely deleted by C2!',
      },
      changes: ['+ NoEscape proven across inlined call', '+ Scalar Replacement puts fields in CPU regs'],
      metrics: { exec_tier: 'C2 Scalar', call_profile: 'NoEscape', allocation: '0B Heap / 0 GC', tricky_effect: 'Lock elision' },
      scene: {
        entities: {
          nw: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['new Point(x,y)'], sub: 'local only' }),
          c2: d(0, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['EscapeCheck'], sub: 'NoEscape!' }),
          reg: d(0, 0, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['CPU Registers'], sub: '0B Heap alloc' }),
          card: S({ x: -12, y: 12 }, '4. Scalar Replacement Eliminates Heap Alloc', [
            'int distSq(int x, int y) {',
            '  Point p = new Point(x, y); // NoEscape!',
            '  return p.x() * p.x() + p.y() * p.y();',
            '} // C2 compiles to: x*x + y*y (0 Heap bytes!)',
          ], { icon: 'terminal' }),
        },
        links: {
          nw_ea: h('nw', 'c2', ['nw', 'c2'], { heads: 'end', label: 'analyze' }),
          ea_rg: h('c2', 'reg', ['c2', 'reg'], { heads: 'end', label: 'scalarize' }),
        },
        flows: [{ route: ['nw_ea', 'ea_rg'], kind: 'res', rate: 2.1 }],
      },
    },
    {
      short: 'Megamorphic',
      chapter: 'dispatch',
      title: '11. Monomorphic -> Bimorphic -> Megamorphic Trap',
      body: [
        'For an interface call <code>codec.encode()</code>: if C2 sees only <strong>1 impl</strong> (Monomorphic) or <strong>2 impls</strong> (Bimorphic), it speculatively inlines them with a fast class-pointer guard.',
        'If a <strong>3rd impl</strong> appears, the callsite turns <strong>Megamorphic</strong>: C2 stops inlining and falls back to an indirect vtable/itable pointer jump!',
      ],
      callout: {
        kind: 'warn',
        text: 'Classic perf surprise: an interface call is blazingly fast with 1-2 implementations, then suddenly drops inlined speed at 3+!',
      },
      changes: ['+ 1-2 impls: inline + class guard', '+ 3+ impls: Megamorphic vtable jump'],
      metrics: { exec_tier: 'C2 Dispatch', call_profile: '3+ Impls', allocation: 'No inline', tricky_effect: 'Megamorphic' },
      scene: {
        entities: {
          c2: d(-12, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['1-2 Impls'], sub: 'Mono/Bimorphic' }),
          mega: d(2, -16, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['3+ Impls'], sub: 'Megamorphic!' }),
          vt: b(2, -2, { r: 2.2, h: 48, color: 'amber', label: ['itable Jump'], sub: 'cannot inline' }),
          card: S({ x: -12, y: 12 }, '5. Virtual Callsite Inline Cache States', [
            '// 1 impl (Monomorphic):  inlined + 1-cycle guard',
            '// 2 impls (Bimorphic):   inlined if/else',
            '// 3+ impls (Megamorphic): virtual itable jump (no inline!)',
          ], { icon: 'terminal' }),
        },
        links: {
          mn_mg: h('c2', 'mega', ['c2', 'mega'], { heads: 'end', label: 'add 3rd' }),
          mg_vt: h('mega', 'vt', ['mega', 'vt'], { heads: 'end', label: 'vtable' }),
        },
        flows: [{ route: ['mn_mg', 'mg_vt'], kind: 'fail', rate: 1.7 }],
      },
    },
    {
      short: 'Deopt',
      chapter: 'jit',
      title: '12. Uncommon Trap & Deoptimization Back to Tier 0',
      body: [
        'C2 makes optimistic bets (e.g., "this branch was never null in 10,000 runs, so compile without the null check").',
        'If <code>null</code> finally arrives later, the guard triggers an <strong>Uncommon Trap</strong>: JVM discards the native frame, <strong>deoptimizes</strong> cleanly back to the Tier 0 Interpreter, and later recompiles with the new branch!',
      ],
      callout: {
        kind: 'insight',
        text: 'Speculative optimization + safe deoptimization is why JIT can beat ahead-of-time C++ on polymorphic code.',
      },
      changes: ['+ Speculative guard fails on rare input', '+ Deopt unwinds cleanly to Interpreter'],
      metrics: { exec_tier: 'Deopt -> Tier 0', call_profile: 'Re-profiled', allocation: 'Safe frame', tricky_effect: 'Uncommon trap' },
      scene: {
        entities: {
          c2: d(-14, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['C2 Speculative'], sub: 'guard != null' }),
          trap: d(0, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'alert', label: ['Uncommon Trap'], sub: 'null arrived!' }),
          intp: d(0, 0, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Interpreter'], sub: 'safe fallback' }),
          card: S({ x: -12, y: 12 }, '6. Speculative Guard & Safe Deoptimization', [
            '// C2 bets: branch "if (rareFlag)" was never taken',
            '// When rareFlag becomes true -> Uncommon Trap!',
            '// Frame deoptimized to Interpreter -> later C2 recompiles',
          ], { icon: 'terminal' }),
        },
        links: {
          c2_tp: h('c2', 'trap', ['c2', 'trap'], { heads: 'end', label: 'guard fail' }),
          tp_in: h('trap', 'intp', ['trap', 'intp'], { heads: 'end', label: 'deoptimize' }),
        },
        flows: [{ route: ['c2_tp', 'tp_in'], kind: 'fail', rate: 1.6 }],
      },
    },
  ],
};
