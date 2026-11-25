/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaMetaprogrammingLesson: Lesson = {
  id: 'java-metaprogramming',
  title: 'Exceptions, Reflection & Proxy',
  summary:
    'Trace Java runtime metaprogramming from zero-cost Exception Tables and RUNTIME annotations to Reflection Method.invoke, JDK Dynamic Proxies, and CGLIB subclasses.',
  minutes: 12,
  level: 'core',
  metrics: ['dispatch_path', 'metadata', 'overhead', 'proxy_type'],
  legend: ['flow', ['req', 'inspect / invoke'], ['res', 'proxy intercept'], ['fail', 'throw unwind']],
  goals: [
    { text: 'Contrast normal path vs JVM Exception Table', step: 1 },
    { text: 'Auto-close resources via try-with-resources', step: 2 },
    { text: 'Retain @Annotation metadata at RUNTIME', step: 3 },
    { text: 'Invoke methods dynamically via Reflection', step: 4 },
    { text: 'Wrap interfaces with JDK Dynamic Proxy', step: 5 },
    { text: 'Subclass concrete beans with CGLIB Proxy', step: 6 },
  ],
  steps: [
    {
      short: 'Exception Table',
      chapter: 'exceptions',
      title: '1. Zero-Cost Try Block & JVM Exception Table',
      body: [
        'A <code>try</code> block adds <strong>zero runtime instructions</strong> on the happy path. The <code>.class</code> file stores a static <code>Exception table</code> mapping bytecode PC ranges to <code>catch</code> handlers.',
        'Cost is only paid when an exception is thrown: the JVM captures the full stack trace (<code>fillInStackTrace()</code>) and unwinds frames.',
      ],
      callout: {
        kind: 'warn',
        text: 'Never use exceptions for normal control flow — fillInStackTrace() walks the entire call stack.',
      },
      metrics: { dispatch_path: 'PC Table Jump', metadata: 'Bytecode PCs', overhead: '0 on happy path', proxy_type: 'None' },
      scene: {
        entities: {
          call: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['try { pc 0..12 }'], sub: '0 overhead' }),
          tbl: d(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['Exception Tbl'], sub: 'pc -> handler' }),
          catchBlk: b(14, -10, { r: 2.2, h: 48, color: 'red', label: ['catch Handler'], sub: 'stack unwind' }),
          card: S({ x: -12, y: 12 }, '1. JVM Exception Table in Bytecode', [
            '// Happy path: 0 extra CPU instructions',
            '// On throw: JVM searches Exception Table:',
            '// from=0 to=12 target=15 type=IOException',
            '// fillInStackTrace() walks stack frames',
          ], { icon: 'terminal' }),
        },
        links: {
          try_tbl: h('call', 'tbl', ['call', 'tbl'], { heads: 'end', label: 'throw ex' }),
          tbl_cat: h('tbl', 'catchBlk', ['tbl', 'catchBlk'], { heads: 'end', label: 'jump pc=15' }),
        },
        flows: [{ route: ['try_tbl', 'tbl_cat'], kind: 'fail', rate: 1.7 }],
      },
    },
    {
      short: 'AutoCloseable',
      chapter: 'exceptions',
      title: '2. try-with-resources & Suppressed Exceptions',
      body: [
        '<code>try (var conn = ds.getConnection())</code> compiles into nested <code>finally</code> blocks that guarantee <code>close()</code> in reverse declaration order.',
        'If both the <code>try</code> body and <code>close()</code> throw, the primary exception is preserved and the close error is attached via <code>addSuppressed()</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Prefer try-with-resources over manual finally — manual finally silently swallows the original business exception.',
      },
      changes: ['+ javac emits reverse-order close()', '+ Close error attached via addSuppressed()'],
      metrics: { dispatch_path: 'AutoCloseable', metadata: 'Suppressed[]', overhead: 'Guaranteed close', proxy_type: 'None' },
      scene: {
        entities: {
          body: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['try Resource'], sub: 'AutoCloseable' }),
          fin: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['finally close()'], sub: 'reverse order' }),
          supp: b(14, -10, { r: 2.2, h: 48, color: 'amber', label: ['Primary Ex'], sub: '+ suppressed' }),
          card: S({ x: -12, y: 12 }, '2. Safe Resource Cleanup', [
            'try (var conn = ds.getConnection();',
            '     var stmt = conn.prepareStatement(sql)) {',
            '  return stmt.executeQuery();',
            '} // closes stmt, then conn; preserves primary error',
          ], { icon: 'terminal' }),
        },
        links: {
          b_fin: h('body', 'fin', ['body', 'fin'], { heads: 'end', label: 'always run' }),
          fin_sup: h('fin', 'supp', ['fin', 'supp'], { heads: 'end', label: 'addSuppressed' }),
        },
        flows: [{ route: ['b_fin', 'fin_sup'], kind: 'req', rate: 1.7 }],
      },
    },
    {
      short: 'Annotations',
      chapter: 'reflection',
      title: '3. @Annotation Retention & Metaspace Metadata',
      body: [
        'Annotations are passive metadata tags. Only annotations marked <code>@Retention(RetentionPolicy.RUNTIME)</code> survive into Metaspace for frameworks to read.',
        '<code>SOURCE</code> (like <code>@Override</code>) is discarded by <code>javac</code>; <code>CLASS</code> is kept in bytecode but hidden from reflection.',
      ],
      callout: {
        kind: 'insight',
        text: 'Spring @Service, @Transactional, and @RequestMapping all rely on RetentionPolicy.RUNTIME.',
      },
      changes: ['+ @Retention(RUNTIME) stored in Metaspace', '+ Passive until inspected at runtime'],
      metrics: { dispatch_path: 'Metadata Read', metadata: 'RUNTIME tag', overhead: 'Startup scan', proxy_type: 'None' },
      scene: {
        entities: {
          src: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['@Audited Tag'], sub: 'RUNTIME policy' }),
          meta: b(0, -10, { r: 2.2, h: 48, color: 'purple', label: ['Metaspace'], sub: 'Class<?> attrs' }),
          scan: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Framework'], sub: 'getAnnotation' }),
          card: S({ x: -12, y: 12 }, '3. Annotation Retention Policies', [
            '@Retention(RetentionPolicy.RUNTIME)',
            '@Target(ElementType.METHOD)',
            'public @interface Audited { String role(); }',
            '// Inspected via method.getAnnotation(Audited.class)',
          ], { icon: 'terminal' }),
        },
        links: {
          src_m: h('src', 'meta', ['src', 'meta'], { heads: 'end', label: 'emit attr' }),
          m_scn: h('meta', 'scan', ['meta', 'scan'], { heads: 'end', label: 'inspect' }),
        },
        flows: [{ route: ['src_m', 'm_scn'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Reflection',
      chapter: 'reflection',
      title: '4. Reflection Introspection & Method.invoke()',
      body: [
        '<code>Class&lt;?&gt;</code> exposes fields, constructors, and methods dynamically at runtime via <code>Method.invoke(target, args)</code>.',
        'Reflection bypasses compile-time type checks, boxes primitives, and inhibits some JIT inlining — cache <code>Method</code> or use <code>MethodHandles</code> in hot paths.',
      ],
      callout: {
        kind: 'warn',
        text: 'Java 9+ JPMS modules block deep setAccessible(true) on JDK internals unless --add-opens is passed.',
      },
      changes: ['+ Method.invoke() boxes args dynamically', '+ Security / JPMS access check'],
      metrics: { dispatch_path: 'Method.invoke', metadata: 'Method[]', overhead: 'Box + check', proxy_type: 'Direct target' },
      scene: {
        entities: {
          caller: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['Caller'], sub: 'Method.invoke' }),
          refl: d(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['Reflection API'], sub: 'check + box' }),
          bean: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Target Bean'], sub: 'exec method' }),
          card: S({ x: -12, y: 12 }, '4. Dynamic Invocation via Reflection', [
            'Method m = OrderService.class',
            '  .getDeclaredMethod("placeOrder", Long.class);',
            'm.invoke(serviceInstance, 42L);',
            '// Boxes args; slower than direct call if uncached',
          ], { icon: 'terminal' }),
        },
        links: {
          c_ref: h('caller', 'refl', ['caller', 'refl'], { heads: 'end', label: 'invoke()' }),
          ref_b: h('refl', 'bean', ['refl', 'bean'], { heads: 'end', label: 'dispatch' }),
        },
        flows: [{ route: ['c_ref', 'ref_b'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'JDK Proxy',
      chapter: 'proxies',
      title: '5. JDK Dynamic Proxy (Interface-Based)',
      body: [
        '<code>Proxy.newProxyInstance()</code> generates an in-memory <code>$Proxy0</code> class implementing one or more <strong>interfaces</strong>.',
        'Every method call routes through <code>InvocationHandler.invoke()</code>, letting you run cross-cutting logic (logging, metrics, transactions) before delegating to the real target.',
      ],
      callout: {
        kind: 'insight',
        text: 'JDK Dynamic Proxy requires an interface — it cannot proxy a standalone class with no interface.',
      },
      changes: ['+ $Proxy0 implements target interface', '+ InvocationHandler intercepts calls'],
      metrics: { dispatch_path: 'InvocationHdlr', metadata: 'Interface[]', overhead: '1 hop wrap', proxy_type: 'JDK $Proxy0' },
      scene: {
        entities: {
          caller: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['Caller'], sub: 'PaymentApi' }),
          proxy: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['JDK $Proxy0'], sub: 'InvocationHdlr' }),
          target: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Real Impl'], sub: 'target bean' }),
          card: S({ x: -12, y: 12 }, '5. JDK Dynamic Proxy Pattern', [
            'PaymentApi proxy = (PaymentApi) Proxy.newProxyInstance(',
            '  loader, new Class[]{ PaymentApi.class },',
            '  (p, method, args) -> {',
            '    log.info(method.getName());',
            '    return method.invoke(realImpl, args);',
            '  });',
          ], { icon: 'terminal' }),
        },
        links: {
          c_px: h('caller', 'proxy', ['caller', 'proxy'], { heads: 'end', label: 'pay()' }),
          px_tg: h('proxy', 'target', ['proxy', 'target'], { heads: 'end', label: 'delegate' }),
        },
        flows: [{ route: ['c_px', 'px_tg'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'CGLIB Proxy',
      chapter: 'proxies',
      title: '6. CGLIB Subclass Proxy (Spring Default)',
      body: [
        'When a class has no interface, <strong>CGLIB</strong> (used by default in Spring Boot) generates a dynamic <strong>subclass</strong> at runtime via ASM bytecode manipulation.',
        'Because CGLIB works by overriding methods in a subclass, <code>final</code> classes and <code>final</code> methods cannot be intercepted.',
      ],
      callout: {
        kind: 'tip',
        text: 'This exact CGLIB / JDK Proxy mechanism powers Spring @Transactional, @Async, @Cacheable, and @Configuration.',
      },
      changes: ['+ Enhancer generates Target$$SpringCGLIB', '+ Overrides non-final methods'],
      metrics: { dispatch_path: 'MethodIntrcpt', metadata: 'Subclass ASM', overhead: 'FastClass', proxy_type: 'CGLIB Subclass' },
      scene: {
        entities: {
          caller: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['Caller'], sub: 'OrderService' }),
          cglib: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['CGLIB Sub'], sub: 'extends Target' }),
          target: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['super.save()'], sub: 'real logic' }),
          card: S({ x: -12, y: 12 }, '6. CGLIB Subclass Proxy (Spring Boot)', [
            '// Generated at runtime via ASM bytecode:',
            'class OrderService$$SpringCGLIB extends OrderService {',
            '  @Override public void save() {',
            '    txInterceptor.before(); super.save();',
            '  } // final methods cannot be overridden!',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          c_cg: h('caller', 'cglib', ['caller', 'cglib'], { heads: 'end', label: 'save()' }),
          cg_sup: h('cglib', 'target', ['cglib', 'target'], { heads: 'end', label: 'super.save' }),
        },
        flows: [{ route: ['c_cg', 'cg_sup'], kind: 'res', rate: 2.0 }],
      },
    },
  ],
};
