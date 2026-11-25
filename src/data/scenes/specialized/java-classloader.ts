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
  title: 'ClassLoader Subsystem & Bytecode Lifecycle',
  summary:
    'Trace how the JVM loads .class bytecode via Bootstrap/Platform/App ClassLoaders, enforces Parent Delegation, runs Linking (Verify/Prepare/Resolve) & <clinit>, and isolates plugins.',
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
  ],
};
