// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeBalancer as f,
  makeCrowd as p,
  makeGhost as m,
  makeLink as h,
  DEAD_STATE as g,
  makeHot as _,
  makeCool as v,
  makeDevice as y,
  makeDb as b,
  makeZone as x,
  makeQueue as ee,
  makePanel as S,
  makeUser as te,
  makeDns as ne,
  makeWebServer as re,
  makeDatabase as ie,
  URL_TAG as ae,
  LINK_TEMPLATES as C,
  CACHED_DNS_LINK as oe,
  TIMING_PANEL as se,
} from '@/lib/simulator/scene-builders';

export const javaMetaprogrammingLesson = {
  id: `java-metaprogramming`,
  title: `Java Reflection, Annotations & Dynamic Proxies`,
  summary: `How Spring and Hibernate inspect and manipulate classes at runtime: Reflection API, Annotation retention, JDK Dynamic Proxy, and CGLIB/Byte Buddy.`,
  minutes: 12,
  level: `advanced`,
  metrics: ['proxy_type', 'inspection_method', 'bytecode_engine', 'security_manager', 'invocation_overhead'],
  legend: ['req', 'res', ['ping', 'reflection call'], 'fail'],
  goals: [
    { text: 'Java Reflection API', step: 1 },
    { text: 'Annotation Retention', step: 2 },
    { text: 'JDK Dynamic Proxy', step: 3 },
    { text: 'CGLIB & Byte Buddy', step: 4 },
    { text: 'Java Module System (JPMS)', step: 5 },
  ],
  steps: [
    {
      short: `Reflection`,
      chapter: `technique`,
      title: `Reflection API & Method Inflation`,
      body: [
        `Reflection allows Java code to inspect private fields, constructors, and invoke methods dynamically by string name at runtime.`,
        `Calling <code>Method.invoke()</code> begins as a native C++ JNI call. After 15 invocations (inflation threshold), HotSpot dynamically generates a bytecode accessor class (<code>GeneratedMethodAccessor</code>) for direct native speed.`,
      ],
      callout: { kind: `insight`, text: 'Reflection circumvents compiler type checking and requires setAccessible(true) to access private fields.' },
      metrics: { proxy_type: 'Direct Reflection', inspection_method: 'Method.invoke()', bytecode_engine: 'MethodAccessor', security_manager: 'setAccessible', invocation_overhead: '18ns (inflated)' },
      scene: {
        entities: {
          caller: d(-11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'code', label: ['Reflection Client'], sub: 'getMethod("pay")' }),
          method_obj: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'search', label: ['Method Object'], sub: 'MethodAccessor' }),
          target: d(11, -4, { s: 3.8, h: 42, color: 'green', glyph: 'shield', label: ['Target Instance'], sub: 'invoke() target' }),
        },
        links: {
          cm: h('caller', 'method_obj', ['caller', 'method_obj'], { heads: 'end', label: 'lookup' }),
          mt: h('method_obj', 'target', ['method_obj', 'target'], { heads: 'end', label: 'executes method' }),
        },
        flows: [
          { route: ['cm', 'mt'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Annotations`,
      chapter: `technique`,
      title: `Annotation Retention: SOURCE vs CLASS vs RUNTIME`,
      body: [
        `Annotations decorate code with metadata. Their lifecycle is governed by <code>@Retention</code>:`,
        `• <strong>SOURCE</strong>: Discarded by javac (e.g. <code>@Override</code>, Lombok getters).`,
        `• <strong>CLASS</strong>: Kept in the .class file but discarded by the classloader (bytecode tools).`,
        `• <strong>RUNTIME</strong>: Preserved in JVM memory, inspectable via <code>isAnnotationPresent()</code> (Spring, Hibernate).`,
      ],
      callout: { kind: `tip`, text: 'Frameworks scan classes with ASM or Byte Buddy at startup to discover @RestController and @Service without loading all classes.' },
      metrics: { proxy_type: '@Retention(RUNTIME)', inspection_method: 'getAnnotation()', bytecode_engine: 'Constant Pool Metadata', security_manager: 'Public', invocation_overhead: '0ns' },
      scene: {
        entities: {
          source_ann: d(-11, -4, { s: 3.8, h: 42, color: 'yellow', glyph: 'file', label: ['@Override (SOURCE)'], sub: 'Compiler Only' }),
          scanner: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'workflow', label: ['Classpath Scanner'], sub: 'Spring ComponentScan' }),
          runtime_ann: d(11, -4, { s: 3.8, h: 42, color: 'green', glyph: 'shield', label: ['@Service (RUNTIME)'], sub: 'Instantiated as Bean' }),
        },
        links: {
          ss: h('source_ann', 'scanner', ['source_ann', 'scanner'], { heads: 'none', label: 'ignored' }),
          sr: h('scanner', 'runtime_ann', ['scanner', 'runtime_ann'], { heads: 'end', label: 'registers bean def' }),
        },
        flows: [
          { route: ['sr'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `JDK Proxy`,
      chapter: `technique`,
      title: `JDK Dynamic Proxy (Interface-Based)`,
      body: [
        `<code>Proxy.newProxyInstance()</code> generates a dynamic class (<code>$Proxy0</code>) implementing one or more interfaces at runtime.`,
        `Every method call is routed through <code>InvocationHandler.invoke(proxy, method, args)</code>. This enables cross-cutting concerns (logging, transactions, security) without touching business code.`,
      ],
      callout: { kind: `warn`, text: 'JDK Dynamic Proxies REQUIRE an interface. They cannot proxy concrete classes without interfaces.' },
      metrics: { proxy_type: 'JDK Dynamic Proxy', inspection_method: 'InvocationHandler', bytecode_engine: '$Proxy0.class', security_manager: 'Interface Only', invocation_overhead: '3.2ns' },
      scene: {
        entities: {
          client: y(-11, -4, { label: 'Client', tags: [{ text: 'OrderService', icon: 'server' }] }),
          proxy: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'shield', label: ['$Proxy0 Class'], sub: 'implements OrderService' }),
          handler: d(11, -4, { s: 3.8, h: 42, color: 'green', glyph: 'cpu', label: ['InvocationHandler'], sub: 'invoke() interceptor' }),
        },
        links: {
          cp: h('client', 'proxy', ['client', 'proxy'], { heads: 'end', label: 'call placeOrder()' }),
          ph: h('proxy', 'handler', ['proxy', 'handler'], { heads: 'end', label: 'intercepts call' }),
        },
        flows: [
          { route: ['cp', 'ph'], bounce: false, rate: 2.2 },
        ],
      },
    },
    {
      short: `CGLIB`,
      chapter: `technique`,
      title: `CGLIB & Byte Buddy Subclass Proxies`,
      body: [
        `To proxy classes without interfaces, Spring uses <strong>CGLIB / Byte Buddy</strong>.`,
        `It generates a dynamic subclass at runtime (<code>OrderService$$EnhancerBySpringCGLIB</code>) overriding non-final methods. Method interceptors execute before forwarding to <code>super.method()</code>.`,
      ],
      callout: { kind: `insight`, text: 'Since Spring Boot 2.0, CGLIB is the default proxy mechanism (spring.aop.proxy-target-class=true).' },
      metrics: { proxy_type: 'CGLIB / Byte Buddy', inspection_method: 'MethodInterceptor', bytecode_engine: 'Subclass Generation', security_manager: 'No final methods', invocation_overhead: '2.1ns' },
      scene: {
        entities: {
          caller: y(-11, -4, { label: 'Caller', tags: [{ text: 'Target Class', icon: 'code' }] }),
          cglib_proxy: d(0, -4, { s: 3.8, h: 42, color: 'orange', glyph: 'shield', label: ['CGLIB Subclass'], sub: 'extends OrderService' }),
          target_super: d(11, -4, { s: 3.8, h: 42, color: 'teal', glyph: 'server', label: ['Original Bean'], sub: 'super.execute()' }),
        },
        links: {
          cc: h('caller', 'cglib_proxy', ['caller', 'cglib_proxy'], { heads: 'end', label: 'invokes proxy' }),
          ct: h('cglib_proxy', 'target_super', ['cglib_proxy', 'target_super'], { heads: 'end', label: 'delegates to super' }),
        },
        flows: [
          { route: ['cc', 'ct'], bounce: false, rate: 2.2 },
        ],
      },
    },
    {
      short: `JPMS`,
      chapter: `deep`,
      title: `Java Platform Module System (JPMS) & opens`,
      body: [
        `Java 9 introduced the Module System (Project Jigsaw) enforcing strong encapsulation: private packages are inaccessible outside their module by default, even via reflection.`,
        `For frameworks (Spring, Jackson) to reflectively inspect private fields, the module must explicitly declare <code>opens com.myapp.model to spring.core, com.fasterxml.jackson.databind;</code>.`,
      ],
      callout: { kind: `tip`, text: '--add-opens java.base/java.lang=ALL-UNNAMED is a JVM flag allowing legacy reflection into JDK internals.' },
      metrics: { proxy_type: 'JPMS Encapsulated', inspection_method: 'Lookup & opens', bytecode_engine: 'module-info.class', security_manager: 'Strong Encapsulation', invocation_overhead: '0ns' },
      scene: {
        entities: {
          module_a: d(-11, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'shield', label: ['module-info'], sub: 'opens com.myapp' }),
          boundary: d(0, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'workflow', label: ['JPMS Boundary'], sub: 'Deep Reflection Gate' }),
          framework: d(11, -4, { s: 3.8, h: 42, color: 'green', glyph: 'cpu', label: ['Spring Framework'], sub: 'Authorized Access' }),
        },
        links: {
          mb: h('module_a', 'boundary', ['module_a', 'boundary'], { heads: 'end', label: 'declares opens' }),
          bf: h('boundary', 'framework', ['boundary', 'framework'], { heads: 'end', label: 'allows reflection' }),
        },
        flows: [
          { route: ['mb', 'bf'], bounce: false, rate: 1.8 },
        ],
      },
    },
  ],
};
export default javaMetaprogrammingLesson;
