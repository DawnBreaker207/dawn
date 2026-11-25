/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaJitCompilerLesson: Lesson = {
  id: 'java-jit-compiler',
  title: 'HotSpot JIT & Escape Analysis',
  summary:
    'Understand WHY Java warms up over time, why JMH is needed, how Escape Analysis eliminates Heap allocations, and why adding a 3rd interface implementation slows virtual calls.',
  minutes: 12,
  level: 'advanced',
  metrics: ['exec_tier', 'call_profile', 'allocation', 'tricky_effect'],
  legend: ['flow', ['req', 'profile / compile'], ['res', 'inline / scalar'], ['fail', 'deopt / miss']],
  goals: [
    { text: 'Contrast cold Bytecode Interpreter vs HotSpot JIT', step: 1 },
    { text: 'Trigger Tiered Compilation (C1 -> C2) via counters', step: 2 },
    { text: 'Inline hot methods & explain why JMH needs warmup', step: 3 },
    { text: 'Eliminate Heap alloc via Escape Analysis (Scalar)', step: 4 },
    { text: 'Trace Monomorphic -> Bimorphic -> Megamorphic calls', step: 5 },
    { text: 'Handle Uncommon Trap Deoptimization back to Bytecode', step: 6 },
  ],
  steps: [
    {
      short: 'Interpreter',
      chapter: 'jit',
      title: '1. Why Java Starts Slow: Bytecode Interpreter',
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
      title: '2. Tiered Compilation: C1 Fast vs C2 Peak Native',
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
      title: '3. Method Inlining: The Mother of All JIT Optimizations',
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
      title: '4. Escape Analysis: Why new Point() Costs 0 GC!',
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
      title: '5. Monomorphic -> Bimorphic -> Megamorphic Trap',
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
      title: '6. Uncommon Trap & Deoptimization Back to Tier 0',
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
