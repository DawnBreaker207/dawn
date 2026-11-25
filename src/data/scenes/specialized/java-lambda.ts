/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaLambdaLesson: Lesson = {
  id: 'java-lambda',
  title: 'Lambda & Lazy Streams',
  summary:
    'Follow lambdas from anonymous inner class bloat to invokedynamic LambdaMetafactory, then trace how Java Streams fuse lazy stages and short-circuit on terminal ops.',
  minutes: 12,
  level: 'core',
  metrics: ['bytecode_op', 'evaluation', 'allocations', 'execution'],
  legend: ['flow', ['req', 'callsite / pull'], ['res', 'lazy fusion / emit'], ['fail', 'bloat / skipped']],
  goals: [
    { text: 'Contrast anonymous inner classes with invokedynamic', step: 1 },
    { text: 'Link callsite once via LambdaMetafactory bootstrap', step: 2 },
    { text: 'Build a lazy Stream Spliterator source', step: 3 },
    { text: 'Fuse intermediate filter() and map() stages', step: 4 },
    { text: 'Trigger vertical item-by-item pull on collect()', step: 5 },
    { text: 'Short-circuit early with findFirst() / limit()', step: 6 },
  ],
  steps: [
    {
      short: 'Anon Class',
      chapter: 'lambda',
      title: '1. Anonymous Inner Class Bloat vs Lambda',
      body: [
        'Before Java 8, passing behavior required an anonymous inner class, forcing <code>javac</code> to emit extra <code>MyClass$1.class</code> files and allocate a new object per call.',
        'Java 8 replaced that with <code>invokedynamic</code>: no extra <code>.class</code> files on disk and stateless lambdas become a single cached singleton.',
      ],
      callout: {
        kind: 'insight',
        text: 'A lambda is NOT syntactic sugar for an anonymous inner class — it compiles to a private static method + invokedynamic.',
      },
      metrics: { bytecode_op: 'new $1.class', evaluation: 'Eager alloc', allocations: '1 obj / call', execution: 'Disk bloat' },
      scene: {
        entities: {
          caller: d(-12, -8, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['Caller Method'], sub: 'new Runnable()' }),
          anon: b(4, -8, { r: 2.2, h: 48, color: 'red', label: ['Outer$1.class'], sub: 'extra .class' }),
          card: S({ x: -12, y: 12 }, '1. Anonymous Class Cost vs Lambda', [
            '// Old: compiles to Outer$1.class on disk',
            'list.forEach(new Consumer<String>() {',
            '  public void accept(String s) { log(s); }',
            '}); // New: list.forEach(s -> log(s));',
          ], { icon: 'terminal' }),
        },
        links: {
          anon_alloc: h('caller', 'anon', ['caller', 'anon'], { heads: 'end', label: 'loads $1' }),
        },
        flows: [{ route: ['anon_alloc'], kind: 'fail', rate: 1.6 }],
      },
    },
    {
      short: 'invokedynamic',
      chapter: 'lambda',
      title: '2. invokedynamic & LambdaMetafactory Bootstrap',
      body: [
        'On first execution of an <code>invokedynamic</code> callsite, the JVM invokes <code>LambdaMetafactory.metafactory()</code> once to spin an in-memory stub implementing the functional interface.',
        'Future calls invoke the linked <code>CallSite</code> directly — if the lambda captures no local variables, the JVM reuses a single singleton instance.',
      ],
      callout: {
        kind: 'tip',
        text: 'Captures must be effectively final because the lambda copies local primitive/reference values, not stack slots.',
      },
      changes: ['+ invokedynamic links CallSite once', '+ Stateless lambda cached as singleton'],
      metrics: { bytecode_op: 'invokedynamic', evaluation: 'Link once', allocations: '0 (stateless)', execution: 'Direct call' },
      scene: {
        entities: {
          caller: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['invoke dyn'], sub: 'CallSite' }),
          lmf: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['Metafactory'], sub: 'links once' }),
          target: b(14, -10, { r: 2.2, h: 48, color: 'green', label: ['lambda$0()'], sub: 'static method' }),
          card: S({ x: -12, y: 12 }, '2. Bytecode Linkage via LambdaMetafactory', [
            '// 1. First hit invokes Bootstrap Method (BSM):',
            'CallSite cs = LambdaMetafactory.metafactory(...);',
            '// 2. Subsequent hits jump directly to:',
            'private static void lambda$main$0(String s) { ... }',
          ], { icon: 'terminal' }),
        },
        links: {
          c_lmf: h('caller', 'lmf', ['caller', 'lmf'], { heads: 'end', label: '1st call' }),
          lmf_tgt: h('lmf', 'target', ['lmf', 'target'], { heads: 'end', label: 'bind stub' }),
        },
        flows: [{ route: ['c_lmf', 'lmf_tgt'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Stream Source',
      chapter: 'streams',
      title: '3. Lazy Stream Source & Spliterator',
      body: [
        'Calling <code>list.stream()</code> does NOT copy data or start iterating. It creates a lightweight <code>Head</code> stage wrapping the collection’s <code>Spliterator</code>.',
        'Streams describe a computation pipeline over data rather than storing elements themselves.',
      ],
      callout: {
        kind: 'insight',
        text: 'A Stream can only be consumed once — reusing it after a terminal operation throws IllegalStateException.',
      },
      changes: ['+ Spliterator wraps source collection', '+ Zero elements processed at creation'],
      metrics: { bytecode_op: 'Head Stage', evaluation: 'Lazy (0 work)', allocations: '1 pipeline node', execution: 'Idle' },
      scene: {
        entities: {
          list: b(-12, -8, { r: 2.2, h: 48, color: 'sky', label: ['List<Order>'], sub: 'source data' }),
          head: d(4, -8, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Stream Head'], sub: 'Spliterator' }),
          card: S({ x: -12, y: 12 }, '3. Creating a Stream Pipeline', [
            'Stream<Order> s = orders.stream();',
            '// Allocates Head(Spliterator) only',
            '// 0 elements read, 0 predicates executed',
          ], { icon: 'terminal' }),
        },
        links: {
          src_head: h('list', 'head', ['list', 'head'], { heads: 'end', label: 'Spliterator' }),
        },
        flows: [{ route: ['src_head'], kind: 'res', rate: 1.2 }],
      },
    },
    {
      short: 'Stage Fusion',
      chapter: 'streams',
      title: '4. Chaining Lazy Intermediate Ops (filter + map)',
      body: [
        'Each intermediate operation (<code>filter()</code>, <code>map()</code>) simply appends a stateless <code>Sink</code> stage linked to its upstream stage.',
        'Nothing runs yet! If you forget a terminal operation, neither <code>filter</code> nor <code>map</code> will ever execute.',
      ],
      callout: {
        kind: 'warn',
        text: 'Common bug: writing stream.filter(...).map(...) without .toList() or .forEach() does zero work.',
      },
      changes: ['+ StatelessOp stages chained (still lazy)', '+ Loops fuse into 1 pass later'],
      metrics: { bytecode_op: 'StatelessOp', evaluation: 'Lazy (0 work)', allocations: 'No temp lists', execution: 'Pipeline built' },
      scene: {
        entities: {
          head: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Stream Head'], sub: 'Spliterator' }),
          flt: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['filter()'], sub: 'lazy stage' }),
          mp: d(14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['map()'], sub: 'lazy stage' }),
          card: S({ x: -12, y: 12 }, '4. Intermediate Stages Only Wire Sinks', [
            'var pipe = orders.stream()',
            '  .filter(o -> o.amount() > 100) // Sink 1',
            '  .map(Order::id);               // Sink 2',
            '// Still 0 iterations! Waiting for terminal op.',
          ], { icon: 'terminal' }),
        },
        links: {
          h_f: h('head', 'flt', ['head', 'flt'], { heads: 'end', label: 'wire sink' }),
          f_m: h('flt', 'mp', ['flt', 'mp'], { heads: 'end', label: 'wire sink' }),
        },
        flows: [{ route: ['h_f', 'f_m'], kind: 'res', rate: 1.4 }],
      },
    },
    {
      short: 'Terminal Pull',
      chapter: 'streams',
      title: '5. Terminal Operation & Vertical Loop Fusion',
      body: [
        'Calling a terminal operation like <code>.toList()</code> or <code>.collect()</code> wraps the chain in a single fused loop.',
        'Instead of allocating intermediate lists per step, each element flows <strong>vertically</strong> through <code>filter → map → collect</code> before the next element starts.',
      ],
      callout: {
        kind: 'insight',
        text: 'Vertical execution means zero intermediate collections and better CPU L1 cache locality.',
      },
      changes: ['+ Terminal op starts fused Sink chain', '+ Vertical 1-pass item-by-item flow'],
      metrics: { bytecode_op: 'Terminal Op', evaluation: 'Fused 1-pass', allocations: 'Result only', execution: 'Active pull' },
      scene: {
        entities: {
          flt: d(-14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['filter()'], sub: 'item #1 pass' }),
          mp: d(0, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['map()'], sub: 'transform #1' }),
          col: b(14, -10, { r: 2.2, h: 48, color: 'green', label: ['toList()'], sub: 'terminal sink' }),
          card: S({ x: -12, y: 12 }, '5. Vertical Loop Fusion on Terminal Op', [
            'List<Long> ids = orders.stream()',
            '  .filter(o -> o.amount() > 100)',
            '  .map(Order::id)',
            '  .toList(); // 1 fused loop, 0 temp Lists',
          ], { icon: 'terminal' }),
        },
        links: {
          f_m_run: h('flt', 'mp', ['flt', 'mp'], { heads: 'end', label: 'push item' }),
          m_col: h('mp', 'col', ['mp', 'col'], { heads: 'end', label: 'collect' }),
        },
        flows: [{ route: ['f_m_run', 'm_col'], kind: 'res', rate: 2.2 }],
      },
    },
    {
      short: 'Short-Circuit',
      chapter: 'streams',
      title: '6. Short-Circuiting (findFirst / anyMatch / limit)',
      body: [
        'Because elements move vertically one at a time, short-circuiting terminal ops (<code>findFirst()</code>, <code>anyMatch()</code>) or <code>limit(n)</code> call <code>cancellationRequested()</code> immediately on match.',
        'Even an infinite <code>Stream.iterate(...)</code> terminates cleanly as soon as the first match reaches the sink.',
      ],
      callout: {
        kind: 'tip',
        text: 'Place cheap filter() and limit() early so expensive map() calls never run on discarded items.',
      },
      changes: ['+ cancellationRequested() halts Spliterator', '+ Remaining N-k elements untouched'],
      metrics: { bytecode_op: 'Short-Circuit', evaluation: 'Early halt', allocations: 'Minimal', execution: 'Stopped early' },
      scene: {
        entities: {
          src: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Spliterator'], sub: 'stops early' }),
          mp: d(0, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['filter + map'], sub: '1 match' }),
          term: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['findFirst()'], sub: 'cancel flag' }),
          card: S({ x: -12, y: 12 }, '6. Short-Circuiting Halts Upstream', [
            'Optional<Long> hit = orders.stream()',
            '  .filter(o -> o.amount() > 100)',
            '  .map(Order::id)',
            '  .findFirst(); // stops on 1st match!',
          ], { icon: 'terminal' }),
        },
        links: {
          s_m: h('src', 'mp', ['src', 'mp'], { heads: 'end', label: 'item #1' }),
          m_t: h('mp', 'term', ['mp', 'term'], { heads: 'end', label: 'matched!' }),
        },
        flows: [{ route: ['s_m', 'm_t'], kind: 'res', rate: 1.6 }],
      },
    },
  ],
};
