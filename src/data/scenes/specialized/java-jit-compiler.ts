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

export const javaJitCompilerLesson = {
  id: `java-jit-compiler`,
  title: `HotSpot JIT Compiler & Tiered Compilation`,
  summary: `How the JVM achieves native C++ speed: Tiered Compilation (Interpreter -> C1 -> C2), Inlining, Escape Analysis, and Deoptimization.`,
  minutes: 13,
  level: `advanced`,
  metrics: ['compilation_tier', 'invocation_count', 'inlining_depth', 'escape_analysis', 'execution_speed'],
  legend: ['req', 'res', ['ping', 'hot execution'], 'fail'],
  goals: [
    { text: 'Interpreter & method invocation counters', step: 0 },
    { text: 'Tiered compilation: C1 Client vs C2 Server', step: 1 },
    { text: 'Method inlining & Monomorphic call cache', step: 2 },
    { text: 'Escape analysis & scalar replacement', step: 3 },
    { text: 'Deoptimization & safepoint stack unwinding', step: 4 },
  ],
  steps: [
    {
      short: `Interpreter`,
      chapter: `technique`,
      title: `Interpreter & Method Invocation Counters`,
      body: [
        `When Java boots, the <strong>Bytecode Interpreter</strong> executes bytecode instructions directly inside an evaluation loop (instant startup, zero compilation delay).`,
        `Each method has two internal counters: <strong>Invocation Counter</strong> and <strong>Backedge Counter</strong> (loop iterations). When invocations exceed a threshold (e.g. 2,000), the method is declared "Hot" and queued for compilation.`,
      ],
      callout: { kind: `insight`, text: 'Warmup time in Java is the phase where methods transition from the interpreter to compiled native machine code.' },
      metrics: { compilation_tier: 'Tier 0 (Interpreter)', invocation_count: '2,000 calls', inlining_depth: '0', escape_analysis: 'None', execution_speed: 'Baseline (1x)' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'HotSpot Invocation Counters', [
            '# HotSpot checks method invocation & backedge loop counters:',
            '= if (++methodData.invocationCount > CompileThreshold) {',
            '=   CompilationPolicy::request_compilation(method);',
            '  }',
            '# Tier 0 (Template Interpreter) runs standard bytecode',
            '# Compiles frequently invoked hot code into native assembly',
          ]),
          app: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['Java Bytecode'], sub: 'Calling add()' }),
          interpreter: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'workflow', label: ['Interp.'], sub: 'Counter: 2,000' }),
          jit_queue: d(11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'cpu', label: ['Compile', 'Queue'], sub: 'Threshold Hit' }),
        },
        links: {
          ai: h('app', 'interpreter', ['app', 'interpreter'], { heads: 'end', label: 'eval bytecode' }),
          ij: h('interpreter', 'jit_queue', ['interpreter', 'jit_queue'], { heads: 'end', label: 'triggers compilation' }),
        },
        flows: [
          { route: ['ai'], bounce: true, rate: 2.0 },
          { route: ['ij'], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: `Tiered JIT`,
      chapter: `technique`,
      title: `Tiered Compilation (C1 Client vs C2 Server)`,
      body: [
        `HotSpot features a multi-tiered compilation pipeline:`,
        `• <strong>Tier 0</strong>: Interpreter (no profiling).`,
        `• <strong>Tier 1–3 (C1 Client Compiler)</strong>: Fast compilation with profiling instrumentation (records branch probabilities and dynamic receiver types).`,
        `• <strong>Tier 4 (C2 Server Compiler / Graal)</strong>: Deep aggressive global optimization producing heavily optimized AVX/native machine instructions.`,
      ],
      callout: { kind: `tip`, text: '-XX:+TieredCompilation combines fast startup with maximum sustained peak server throughput.' },
      metrics: { compilation_tier: 'Tier 4 (C2 Native)', invocation_count: '15,000+ calls', inlining_depth: 'Tier 4', escape_analysis: 'Active', execution_speed: '25x Faster' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Tiered Compilation Lifecycle (C1 -> C2)', [
            'Tier 0: Interpreter (0 warmup latency, unoptimized)',
            'Tier 1-3: C1 Compiler (Client JIT, basic profiling)',
            '= Tier 4: C2 Server JIT (heavy SSA optimizations & vectorization):',
            '= // Loop unrolling, SIMD AVX-512 vector instructions',
            '= // Global Value Numbering (GVN) & dead-code elimination',
            '# Yields peak native execution speed comparable to C/C++',
          ]),
          c1: d(-11, -4, { s: 3.8, h: 50, color: 'yellow', glyph: 'zap', label: ['C1 Compiler'], sub: 'Fast + Profiling' }),
          profiler: d(0, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'search', label: ['MDO Profiling'], sub: 'Branch Statistics' }),
          c2: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'shield', label: ['C2 Server JIT'], sub: 'Native Machine Code' }),
        },
        links: {
          cp: h('c1', 'profiler', ['c1', 'profiler'], { heads: 'end', label: 'records profile' }),
          pc: h('profiler', 'c2', ['profiler', 'c2'], { heads: 'end', label: 'feeds C2 optimizer' }),
        },
        flows: [
          { route: ['cp', 'pc'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Inlining`,
      chapter: `technique`,
      title: `Method Inlining & Polymorphic Inline Caches`,
      body: [
        `Method calls have overhead: setting up stack frames, pushing registers, and resolving virtual dispatch.`,
        `<strong>Method Inlining</strong> replaces the method call directly with the target method’s body code. If a call site always encounters the same concrete class (Monomorphic), C2 inlines it with a single direct jump.`,
      ],
      callout: { kind: `insight`, text: 'Inlining unlocks further optimizations like dead-code elimination and loop unrolling across boundaries.' },
      metrics: { compilation_tier: 'Tier 4', invocation_count: '50k calls', inlining_depth: 'Inlined 3 levels', escape_analysis: 'Enabled', execution_speed: 'Near C++' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Method Inlining & Inline Caches', [
            '// Original code: int res = calc(p.getX(), p.getY());',
            '// JIT inlines getter code (< 35 bytes) directly into caller:',
            '= int res = calc(p.x, p.y); // eliminated callsite push/pop frames',
            '# Monomorphic callsites (1 target class) devirtualize to direct call',
            '# Polymorphic callsites fallback to vtable lookup',
          ]),
          caller: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['caller', 'Method()'], sub: 'call calc()' }),
          inliner: d(0, -4, { s: 3.8, h: 50, color: 'green', glyph: 'workflow', label: ['C2 Inliner'], sub: 'Monomorphic Inline' }),
          fused: d(11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'cpu', label: ['Fused Native Code'], sub: 'Zero Call Overhead' }),
        },
        links: {
          ci: h('caller', 'inliner', ['caller', 'inliner'], { heads: 'end', label: 'detects small method' }),
          if_: h('inliner', 'fused', ['inliner', 'fused'], { heads: 'end', label: 'pastes body inline' }),
        },
        flows: [
          { route: ['ci', 'if_'], bounce: false, rate: 2.2 },
        ],
      },
    },
    {
      short: `Escape Analysis`,
      chapter: `technique`,
      title: `Escape Analysis & Scalar Replacement`,
      body: [
        `Does an object escape the method where it is allocated? If an object is never passed to other methods, stored in a field, or returned, it <strong>Does Not Escape</strong>.`,
        `The C2 compiler applies <strong>Scalar Replacement</strong>: the object is completely eliminated from the heap! Its fields are broken down into primitive CPU registers, generating <strong>zero GC allocations</strong>.`,
      ],
      callout: { kind: `tip`, text: 'Temporary Point, DTO, and Iterator objects are frequently scalar-replaced into CPU registers.' },
      metrics: { compilation_tier: 'Tier 4', invocation_count: '100k calls', inlining_depth: 'Inlined', escape_analysis: 'NoEscape Confirmed', execution_speed: '0ns Alloc (Registers)' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Escape Analysis & Scalar Replacement', [
            'void process() {',
            '  Point p = new Point(10, 20); // p never leaves process() scope',
            '= // JIT Scalar Replacement eliminates heap allocation entirely:',
            '= int p_x = 10; // allocated directly in CPU registers',
            '= int p_y = 20;',
            '= return p_x + p_y; // 0 GC garbage created!',
            '}',
          ]),
          heap_alloc: d(-11, -4, { s: 3.8, h: 50, color: 'rose', glyph: 'box', label: ['new Point(x, y)'], sub: 'Candidate Heap' }),
          ea_engine: d(0, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'shield', label: ['Escape Analysis'], sub: 'Scope Checker' }),
          registers: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'cpu', label: ['CPU Registers'], sub: 'Scalar Replaced (0 GC)' }),
        },
        links: {
          he: h('heap_alloc', 'ea_engine', ['heap_alloc', 'ea_engine'], { heads: 'end', label: 'checks escape' }),
          er: h('ea_engine', 'registers', ['ea_engine', 'registers'], { heads: 'end', label: 'promotes to registers' }),
        },
        flows: [
          { route: ['he', 'er'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Deopt`,
      chapter: `deep`,
      title: `Deoptimization & Safepoint Unwinding`,
      body: [
        `C2 compiles code based on optimistic speculative assumptions (e.g. "interface Animal has only 1 implementation: Dog").`,
        `If a new class <code>Cat</code> is dynamically loaded later, the assumption breaks! The JVM triggers an <strong>Uncommon Trap</strong> at the next <strong>Safepoint</strong>, instantly unwinding the native frame back to the Interpreter.`,
      ],
      callout: { kind: `warn`, text: 'Frequent deoptimization cycles (JIT recompilation thrashing) degrade performance. Keep polymorphic call sites consistent.' },
      metrics: { compilation_tier: 'Deoptimized', invocation_count: 'Cat loaded', inlining_depth: 'Trap Triggered', escape_analysis: 'Revoked', execution_speed: 'Fallback to Tier 0' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Deoptimization at JVM Safepoint', [
            '// JIT assumed Shape had only 1 subclass (Circle).',
            '! ClassLoader dynamically loads new class: Rectangle!',
            '= JIT deoptimizes C2 speculative native code:',
            '= JVM pauses threads at Safepoint (polling page trap)',
            '= Reconstructs interpreter stack frames and resumes Tier 0',
            '# Preserves 100% correctness under dynamic class loading',
          ]),
          new_class: d(-11, -4, { s: 3.8, h: 50, color: 'rose', glyph: 'alertTriangle', label: ['Loaded Cat.class'], sub: 'Breaks Assumption' }),
          safepoint: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'shield', label: ['Safepoint Trap'], sub: 'Uncommon Trap' }),
          fallback: d(11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'workflow', label: ['Interp.', 'Fallback'], sub: 'Re-profiles' }),
        },
        links: {
          ns: h('new_class', 'safepoint', ['new_class', 'safepoint'], { heads: 'end', label: 'invalidates C2 code' }),
          sf: h('safepoint', 'fallback', ['safepoint', 'fallback'], { heads: 'end', label: 'unwinds to bytecode' }),
        },
        flows: [
          { route: ['ns', 'sf'], bounce: false, rate: 1.8 },
        ],
      },
    },
  ],
};
export default javaJitCompilerLesson;
