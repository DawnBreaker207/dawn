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

export const javaLambdaLesson = {
  id: `java-lambda`,
  title: `Java Lambdas & invokedynamic Architecture`,
  summary: `How lambdas work under the hood: invokedynamic bytecode, LambdaMetafactory, Functional Interfaces, and capturing mechanics.`,
  minutes: 12,
  level: `intermediate`,
  metrics: ['classes_on_disk', 'callsite_type', 'sam_type', 'capture_cost', 'dispatch_ns'],
  legend: ['req', 'res', ['ping', 'method handle'], 'fail'],
  goals: [
    { text: 'Anonymous Inner Classes vs Lambdas', step: 1 },
    { text: 'invokedynamic & LambdaMetafactory', step: 2 },
    { text: 'Functional Interfaces & SAM (Single', step: 3 },
    { text: 'Variable Capture & Effectively Final', step: 4 },
    { text: 'Standard Functional Interfaces', step: 5 },
  ],
  steps: [
    {
      short: `No Classes`,
      chapter: `technique`,
      title: `Anonymous Classes vs Lambdas`,
      body: [
        `Anonymous inner classes (<code>new Runnable() { ... }</code>) generate a physical <code>Main$1.class</code> file on disk for every declaration, bloating JAR sizes and classloader metadata.`,
        `Lambdas generate <strong>zero class files at compile time</strong>. Instead, the compiler generates a private synthetic method (<code>lambda$main$0()</code>) and an <code>invokedynamic</code> instruction:`,
        `<code>// AIC creates Main$1.class; Lambda generates 0 disk files:<br>Runnable r1 = new Runnable() { public void run() {} };<br>Runnable r2 = () -> {}; // invokedynamic</code>`,
      ],
      callout: { kind: `insight`, text: `Lambdas defer proxy class generation to JVM runtime, enabling hotspot optimizations and instant startup.` },
      metrics: { classes_on_disk: '0 .class files', callsite_type: 'invokedynamic', sam_type: 'Runnable', capture_cost: '0 B', dispatch_ns: '0.8ns' },
      scene: {
        entities: {
          code: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['() -> run()'], sub: 'Lambda Syntax' }),
          javac: d(0, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'workflow', label: ['javac Compiler'], sub: 'Synthetic Method' }),
          bytecode: d(11, -4, { s: 4.4, h: 50, color: 'green', glyph: 'file', label: ['invoke', 'dynamic'], sub: 'No $1.class file' }),
          card: S({ x: -2, y: 14 }, 'Javac Bytecode Footprint', [
            '$ javac Main.java',
            'Main$1.class  -> 1,180 bytes on disk (AIC)',
            'Main.class    -> Contains invokedynamic (Lambda)',
            'Synthetic: private static void lambda$main$0()',
          ], { icon: 'code' }),
        },
        links: {
          cj: h('code', 'javac', ['code', 'javac'], { heads: 'end', label: 'compile' }),
          jb: h('javac', 'bytecode', ['javac', 'bytecode'], { heads: 'end', label: 'emits indy instruction' }),
        },
        flows: [
          { route: ['cj', 'jb'], bounce: false, rate: 1.8 },
        ],
      },
    },
    {
      short: `Metafactory`,
      chapter: `technique`,
      title: `invokedynamic & LambdaMetafactory`,
      body: [
        `When <code>invokedynamic</code> executes for the first time, it triggers a Bootstrap Method (BSM): <code>LambdaMetafactory.metafactory()</code>.`,
        `The metafactory dynamically generates an in-memory class implementing the target interface and binds it to a <code>CallSite</code>. Subsequent calls jump straight through a <code>MethodHandle</code> with near-zero overhead.`,
        `<code>// Decompiled bytecode (javap -c -p Main.class):<br>0: invokedynamic #2, 0 // LambdaMetafactory.metafactory<br>5: astore_1<br>6: aload_1<br>7: invokeinterface #3, 1 // Runnable.run()</code>`,
      ],
      callout: { kind: `tip`, text: 'Non-capturing lambdas are singleton-cached by the CallSite, allocating zero memory on repeated invocations.' },
      metrics: { classes_on_disk: 'Dynamic in-memory', callsite_type: 'ConstantCallSite', sam_type: 'Function<T,R>', capture_cost: '0 B', dispatch_ns: '1.2ns' },
      scene: {
        entities: {
          indy: d(-11, -4, { s: 4.4, h: 52, color: 'blue', glyph: 'route', label: ['invoke', 'dynamic'], sub: 'First Call' }),
          metafactory: d(0, -4, { s: 4.6, h: 52, color: 'purple', glyph: 'shield', label: ['Lambda', 'Metafactory'], sub: 'BSM Generator' }),
          callsite: d(11, -4, { s: 4.4, h: 52, color: 'green', glyph: 'cpu', label: ['CallSite Bound'], sub: 'MethodHandle' }),
          card: S({ x: -2, y: 14 }, 'Bootstrap Method Mechanics', [
            'Bootstrap Method #0: LambdaMetafactory.metafactory',
            'Generates: class Main$$Lambda$1 in memory',
            'Result: ConstantCallSite -> MethodHandle',
            'Cache: Singleton instance reused forever',
          ], { icon: 'cpu' }),
        },
        links: {
          im: h('indy', 'metafactory', ['indy', 'metafactory'], { heads: 'end', label: 'bootstrap trigger' }),
          mc: h('metafactory', 'callsite', ['metafactory', 'callsite'], { heads: 'end', label: 'binds CallSite' }),
        },
        flows: [
          { route: ['im', 'mc'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `SAM Contract`,
      chapter: `technique`,
      title: `Functional Interfaces & SAM Type Matching`,
      body: [
        `A lambda expression has no type of its own. Its type is inferred from the <strong>target type</strong> expected at the call site.`,
        `The target type must be a <strong>Functional Interface</strong>: an interface with exactly one abstract method (SAM). Default methods and static methods do not break the SAM rule:`,
        `<code>// Concrete Java Code:<br>UnaryOperator&lt;Integer&gt; doubler = x -> x * 2;<br>int res = doubler.apply(5); // 10 (apply is the single abstract method)</code>`,
      ],
      callout: { kind: `insight`, text: '@FunctionalInterface is an informative compiler check ensuring nobody adds a second abstract method.' },
      metrics: { classes_on_disk: '0', callsite_type: 'Type Inference', sam_type: 'Single Abstract Method', capture_cost: 'Zero', dispatch_ns: '0.9ns' },
      scene: {
        entities: {
          lambda_expr: d(-11, -4, { s: 4.2, h: 52, color: 'teal', glyph: 'code', label: ['x -> x * 2'], sub: 'Anonymous Block' }),
          sam_checker: d(0, -4, { s: 4.4, h: 52, color: 'yellow', glyph: 'search', label: ['SAM Checker'], sub: '@FunctionalInterface' }),
          target_type: d(11, -4, { s: 4.8, h: 52, color: 'purple', glyph: 'layers', label: ['UnaryOperator', '<Integer>'], sub: 'apply(T t)' }),
          card: S({ x: -2, y: 14 }, 'SAM Signature Matching', [
            'Target Type: java.util.function.UnaryOperator<Integer>',
            'Method Contract: Integer apply(Integer t)',
            'Lambda: (x) -> x * 2 matches (Integer) -> Integer',
            'Valid: Exactly 1 abstract method',
          ], { icon: 'layers' }),
        },
        links: {
          ls: h('lambda_expr', 'sam_checker', ['lambda_expr', 'sam_checker'], { heads: 'end', label: 'match signature' }),
          st: h('sam_checker', 'target_type', ['sam_checker', 'target_type'], { heads: 'end', label: 'binds interface' }),
        },
        flows: [
          { route: ['ls', 'st'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Capturing`,
      chapter: `technique`,
      title: `Capturing Lambdas & Effectively Final`,
      body: [
        `A lambda can access variables from its enclosing scope only if they are <strong>effectively final</strong> (never modified after assignment).`,
        `Why? Local variables live on the stack and disappear when the method returns, whereas lambdas may execute later on other threads. The JVM copies the variable into the lambda instance field:`,
        `<code>int port = 8080; // effectively final on stack<br>Runnable r = () -> System.out.println(port); // copies 8080 into field<br>// port = 9000; // ERROR: variable must be effectively final</code>`,
      ],
      callout: { kind: `warn`, text: 'Capturing lambdas cannot be singletons. Every execution allocates a new instance to hold captured fields.' },
      metrics: { classes_on_disk: '0', callsite_type: 'Capturing Instance', sam_type: 'Consumer<String>', capture_cost: '24 B / call', dispatch_ns: '2.1ns' },
      scene: {
        entities: {
          stack_frame: d(-11, -4, { s: 4.2, h: 52, color: 'rose', glyph: 'server', label: ['Thread Stack'], sub: 'int port = 8080' }),
          capturing: d(0, -4, { s: 4.4, h: 52, color: 'orange', glyph: 'box', label: ['Capturing', 'Lambda'], sub: 'copies field value' }),
          async_thread: d(11, -4, { s: 4.2, h: 52, color: 'teal', glyph: 'cpu', label: ['Worker Thread'], sub: 'Executes safely' }),
          card: S({ x: -2, y: 14 }, 'Stack vs Heap Variable Capture', [
            'Stack frame: int port = 8080 (dies on return)',
            'Heap object: Lambda instance { final int val$port = 8080; }',
            'Allocation: ~24 bytes per capture invocation',
            'Safety: Worker thread reads heap copy safely',
          ], { icon: 'box' }),
        },
        links: {
          sc: h('stack_frame', 'capturing', ['stack_frame', 'capturing'], { heads: 'end', label: 'copy final val' }),
          ca: h('capturing', 'async_thread', ['capturing', 'async_thread'], { heads: 'end', label: 'runs after stack pops' }),
        },
        flows: [
          { route: ['sc', 'ca'], bounce: false, rate: 1.8 },
        ],
      },
    },
    {
      short: `Primitives`,
      chapter: `deep`,
      title: `Standard Functional Interfaces & Primitive Specialization`,
      body: [
        `<code>java.util.function</code> provides 4 core patterns:`,
        `• <strong>Function<T, R></strong>: T → R · <strong>Predicate<T></strong>: T → boolean · <strong>Consumer<T></strong>: T → void · <strong>Supplier<T></strong>: () → T.`,
        `Generic interfaces box primitive <code>int</code> into <code>Integer</code> objects. Specialized primitive interfaces keep values in raw CPU registers:`,
        `<code>IntStream.range(1, 100)<br>  .filter(x -> x % 2 == 0) // IntPredicate: raw 32-bit int, 0 Heap boxing!<br>  .forEach(System.out::println); // IntConsumer</code>`,
      ],
      callout: { kind: `tip`, text: 'Use IntPredicate, LongConsumer, and DoubleFunction to avoid auto-boxing primitive integers into wrapper objects.' },
      metrics: { classes_on_disk: '0', callsite_type: 'Specialized', sam_type: 'IntPredicate', capture_cost: 'Zero Auto-box', dispatch_ns: '0.4ns' },
      scene: {
        entities: {
          pipeline: d(-11, -4, { s: 4.4, h: 52, color: 'blue', glyph: 'workflow', label: ['Stream', 'Pipeline'], sub: 'filter() -> map()' }),
          predicate: d(0, -4, { s: 4.4, h: 52, color: 'green', glyph: 'shield', label: ['IntPredicate'], sub: 'test(int) -> bool' }),
          consumer: d(11, -4, { s: 4.4, h: 52, color: 'purple', glyph: 'cpu', label: ['IntConsumer'], sub: 'accept(int) -> void' }),
          card: S({ x: -2, y: 14 }, 'Primitive Boxing Benchmark', [
            'Predicate<Integer>: Auto-boxes int -> Integer (16B on Heap)',
            'IntPredicate:       Raw 32-bit int in CPU register',
            'Performance:       5x - 10x faster for numerical pipelines',
            'Core 4 Types:      Function, Predicate, Consumer, Supplier',
          ], { icon: 'zap' }),
        },
        links: {
          pp: h('pipeline', 'predicate', ['pipeline', 'predicate'], { heads: 'end', label: 'primitive filter' }),
          pc: h('predicate', 'consumer', ['predicate', 'consumer'], { heads: 'end', label: 'pass unboxed' }),
        },
        flows: [
          { route: ['pp', 'pc'], bounce: false, rate: 2.2 },
        ],
      },
    },
  ],
};
export default javaLambdaLesson;
