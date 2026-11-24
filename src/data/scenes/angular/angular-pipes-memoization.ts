// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const angularPipesMemoizationLesson = {
  id: 'angular-pipes-memoization',
  title: 'Pipes & Memoization: Pure vs Impure Execution',
  summary: 'Deep-dive into Angular Pipes execution model. Understand pure pipe memoization, reference equality checking, and why impure pipes can degrade frame rates.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['pipeType', 'memoCache', 'executionsPerCycle', 'perfImpact'],
  legend: ['flow', ['data', 'data transform'], ['check', 'reference equality check'], ['impure', 'per-tick run'], ['signal', 'computed signal']],
  goals: [
    { text: 'Pure Pipes & Identity Memoization Cache (=== equality)', step: 1 },
    { text: 'Impure Pipes and Per-Tick Execution Cost (pure: false)', step: 2 },
    { text: 'The Array Mutation Trap: why array.push() does not trigger pure pipes', step: 3 },
    { text: 'AsyncPipe: reactive subscription management and markForCheck()', step: 4 },
    { text: 'Modern Computed Signals vs Pipes: fine-grained template memoization', step: 5 },
    { text: 'Performance Profiling: identifying impure pipe bottlenecks in DevTools', step: 6 },
  ],
  steps: [
    {
      short: 'Pure Pipes',
      chapter: 'concept',
      title: 'Pure Pipes: Identity-Based Memoization (===)',
      body: [
        'By default, <code>@Pipe({ pure: true })</code> only executes its <code>transform()</code> method when an input argument changes by <b>reference identity</b> (<code>===</code>).',
        'If the parent re-renders but the pipe argument references are unchanged, Angular skips execution entirely and reuses the cached return value.',
      ],
      callout: {
        kind: 'insight',
        text: 'Pure pipes are mathematical pure functions: identical inputs always return identical outputs without side effects.',
      },
      metrics: { pipeType: 'Pure (default)', memoCache: 'Hit (Cached)', executionsPerCycle: '0 (Skipped)', perfImpact: 'Zero cost' },
      scene: {
        entities: {
          inputVal: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['price: 150'], sub: 'reference unchanged' }),
          memoCheck: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['=== Equality Check'], sub: 'curr === prev (true)' }),
          cachedOutput: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['$150.00 (Cache)'], sub: 'transform() bypassed' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Pure Pipe Implementation', [
            `@Pipe({`,
            `  name: 'currencyFormat',`,
            `  pure: true // Default: memoizes based on arguments`,
            `})`,
            `export class CurrencyPipe implements PipeTransform {`,
            `  transform(val: number): string {`,
            `    console.log('Transform executed!'); // Only on reference change`,
            `    return '$' + val.toFixed(2);`,
            `  }`,
            `}`,
          ], { icon: 'terminal' }),
          zPipe: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'PURE PIPE IDENTITY MEMOIZATION'),
        },
        links: {
          im: h('inputVal', 'memoCheck', ['inputVal', 'memoCheck'], { label: 'compare inputs' }),
          mc: h('memoCheck', 'cachedOutput', ['memoCheck', 'cachedOutput'], { label: 'return cached output' }),
        },
        flows: [{ route: ['im', 'mc'], kind: 'check', rate: 1.5 }],
      },
    },
    {
      short: 'Impure Pipes',
      chapter: 'concept',
      title: 'Impure Pipes: Per-Tick Execution Cost (pure: false)',
      body: [
        'Setting <code>@Pipe({ pure: false })</code> disables memoization.',
        'An impure pipe executes its <code>transform()</code> method on <b>every single change detection cycle</b>, regardless of whether inputs changed! If used inside a list with 1,000 rows, it runs 1,000 times per keystroke.',
      ],
      callout: {
        kind: 'warning',
        text: 'Impure pipes with heavy computations (filtering, sorting) cause devastating frame-rate drops and UI lag.',
      },
      changes: ['+ pure: false disables reference caching', '+ transform() executes repeatedly on every tick'],
      metrics: { pipeType: 'Impure (pure: false)', memoCache: 'Disabled', executionsPerCycle: '1,000 / tick', perfImpact: 'Severe jank' },
      scene: {
        entities: {
          keyEvent: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['Keystroke Event'], sub: 'triggers CD tick' }),
          impureRunner: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'cpu', label: ['Impure Pipe'], sub: 'runs for all 1,000 items' }),
          domThrash: d(10, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'package', label: ['Frame Drop (30fps)'], sub: 'CPU starved by pipe' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Impure Pipe Disaster Example', [
            `@Pipe({ name: 'filterList', pure: false }) // AVOID THIS!`,
            `export class FilterPipe implements PipeTransform {`,
            `  transform(items: any[], query: string) {`,
            `    // Executes 1,000 times on every mousemove / keystroke!`,
            `    return items.filter(item => item.name.includes(query));`,
            `  }`,
            `}`,
            `Better: Filter in component or use computed() signal!`,
          ], { icon: 'terminal' }),
          zPipe: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'IMPURE PIPE PER-TICK OVERHEAD'),
        },
        links: {
          ki: h('keyEvent', 'impureRunner', ['keyEvent', 'impureRunner'], { label: 'trigger change cycle' }),
          id: h('impureRunner', 'domThrash', ['impureRunner', 'domThrash'], { label: 'burn CPU cycles' }),
        },
        flows: [{ route: ['ki', 'id'], kind: 'impure', rate: 1.5 }],
      },
    },
    {
      short: 'Array Mutation',
      chapter: 'problem',
      title: 'The Array Mutation Trap: array.push() vs Immutability',
      body: [
        'A frequent bug in Angular: developer adds an item via <code>this.items.push(newItem)</code>, but the pure pipe in the template <b>does not update</b>!',
        'Why? <code>push()</code> mutates the existing array in place. The memory reference (<code>items</code>) did NOT change (<code>items === items</code> is true). Angular assumes inputs are identical and skips the pipe.',
      ],
      callout: {
        kind: 'tip',
        text: 'Fix: Always create a new reference using array spread: this.items = [...this.items, newItem].',
      },
      changes: ['+ In-place mutation fails to trigger pure pipe', '+ Immutable spread updates reference and triggers re-render'],
      metrics: { pipeType: 'Pure', memoCache: 'False Hit (Stale)', executionsPerCycle: '0 (Missed update)', perfImpact: 'UI Bug' },
      scene: {
        entities: {
          arrayPush: d(-10, -18, { s: 4.8, h: 50, color: 'rose', glyph: 'terminal', label: ['items.push(item)'], sub: 'same reference in memory' }),
          refCheck: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'cpu', label: ['prev === curr'], sub: 'returns TRUE (stale cache)' }),
          staleView: d(10, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'package', label: ['Stale UI Output'], sub: 'new item not rendered' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'The Immutability Fix', [
            `// ❌ BROKEN: In-place mutation keeps same pointer`,
            `this.items.push(newItem); // Pure pipe will NOT update!`,
            ``,
            `// ✅ CORRECT: New array reference triggers pure pipe`,
            `this.items = [...this.items, newItem];`,
          ], { icon: 'terminal' }),
          zPipe: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ARRAY MUTATION IMMUTABILITY TRAP'),
        },
        links: {
          ar: h('arrayPush', 'refCheck', ['arrayPush', 'refCheck'], { label: 'pointer comparison' }),
          rs: h('refCheck', 'staleView', ['refCheck', 'staleView'], { label: 'reuses old result' }),
        },
        flows: [{ route: ['ar', 'rs'], kind: 'check', rate: 1.5 }],
      },
    },
    {
      short: 'AsyncPipe',
      chapter: 'execution',
      title: 'AsyncPipe: State-Aware Reactive Subscription',
      body: [
        '<code>AsyncPipe</code> (<code>user$ | async</code>) is an impure pipe, but with purpose: it manages an internal stateful subscription to an Observable or Promise.',
        'When the Observable emits a new value, AsyncPipe marks the component as dirty via <code>ChangeDetectorRef.markForCheck()</code>. When the component unmounts, AsyncPipe automatically unsubscribes, preventing memory leaks.',
      ],
      callout: {
        kind: 'insight',
        text: 'AsyncPipe eliminates 90% of manual .subscribe() calls and memory leaks in Angular applications.',
      },
      changes: ['+ AsyncPipe auto-subscribes to Observable stream', '+ Calls markForCheck() on emit and auto-unsubscribes on destroy'],
      metrics: { pipeType: 'AsyncPipe (Stateful)', memoCache: 'Stream Buffer', executionsPerCycle: 'On emission', perfImpact: 'Leak-free' },
      scene: {
        entities: {
          obsStream: d(-10, -18, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Observable Stream'], sub: 'user$ = http.get()' }),
          asyncPipe: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['AsyncPipe Instance'], sub: 'subscribes & marks dirty' }),
          renderedVal: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Template View'], sub: '{{ user.name }}' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'AsyncPipe Template Usage', [
            `@Component({`,
            `  template: \``,
            `    @if (user$ | async; as user) {`,
            `      <h1>Hello, {{ user.name }}</h1>`,
            `    }`,
            `  \``,
            `})`,
            `// Zero manual subscribe() or unsubscribe() required!`,
          ], { icon: 'terminal' }),
          zPipe: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ASYNCPIPE STATEFUL SUBSCRIPTION'),
        },
        links: {
          oa: h('obsStream', 'asyncPipe', ['obsStream', 'asyncPipe'], { label: 'stream emission' }),
          ar: h('asyncPipe', 'renderedVal', ['asyncPipe', 'renderedVal'], { label: 'markForCheck()' }),
        },
        flows: [{ route: ['oa', 'ar'], kind: 'data', rate: 1.5 }],
      },
    },
    {
      short: 'Computed Signals',
      chapter: 'scaling',
      title: 'Signals computed() vs Pipes: Modern Memoization',
      body: [
        'In modern Angular, <code>computed()</code> replaces many traditional pipes.',
        'A computed signal dynamically tracks dependencies and recomputes only when its underlying signal dependencies change, caching its result with zero template pipe overhead.',
      ],
      callout: {
        kind: 'tip',
        text: 'Use computed() for data transformations, and reserve pure pipes for universal UI formatting (dates, currency).',
      },
      changes: ['+ Filtering moved from pipe to computed() signal', '+ Glitch-free fine-grained memoization active'],
      metrics: { pipeType: 'Computed Signal', memoCache: 'DAG Memoized', executionsPerCycle: '0 (Lazy)', perfImpact: 'Optimal' },
      scene: {
        entities: {
          searchQuery: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['query = signal()'], sub: 'reactive dependency' }),
          computedDag: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'cpu', label: ['filteredItems'], sub: 'computed(() => items().filter)' }),
          memoizedList: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['Memoized Array'], sub: 'evaluated only on change' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Computed Signal vs Pipe', [
            `export class ListComponent {`,
            `  items = signal<Item[]>([]);`,
            `  query = signal<string>('');`,
            ``,
            `  // Lazily evaluated and cached automatically:`,
            `  filtered = computed(() => {`,
            `    const q = this.query().toLowerCase();`,
            `    return this.items().filter(i => i.name.includes(q));`,
            `  });`,
            `}`,
          ], { icon: 'terminal' }),
          zPipe: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'SIGNALS COMPUTED MEMOIZATION DAG'),
        },
        links: {
          sc: h('searchQuery', 'computedDag', ['searchQuery', 'computedDag'], { label: 'notify dirty' }),
          cm: h('computedDag', 'memoizedList', ['computedDag', 'memoizedList'], { label: 'read cached value' }),
        },
        flows: [{ route: ['sc', 'cm'], kind: 'signal', rate: 1.5 }],
      },
    },
    {
      short: 'Profiling',
      chapter: 'scaling',
      title: 'Performance Profiling with Angular DevTools',
      body: [
        'Open Angular DevTools Profiler to record change detection performance.',
        'If a bar chart displays long execution times (>16ms) during simple mouse interactions, search the Flame Chart for impure pipe transforms executing repetitively across list nodes.',
      ],
      callout: {
        kind: 'insight',
        text: 'Eliminating impure pipes and moving transformations into computed() signals instantly restores 60fps silky smooth scrolling.',
      },
      changes: ['+ Profiler highlights pipe execution hotspots', '+ Application restored to 60fps frame rate'],
      metrics: { pipeType: 'Optimized', memoCache: 'Verified', executionsPerCycle: 'Minimal', perfImpact: '60 FPS Smooth' },
      scene: {
        entities: {
          devtools: d(-10, -18, { s: 4.8, h: 50, color: 'purple', glyph: 'terminal', label: ['Angular DevTools'], sub: 'Profiler Flame Chart' }),
          hotspotDetector: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'cpu', label: ['Pipe Hotspot'], sub: '24ms spent in transform()' }),
          optimizedFps: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['60 FPS Clean'], sub: 'render time < 2ms' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'DevTools Performance Audit', [
            `Angular DevTools Profiler Record:`,
            `  Change Detection Duration: 1.4ms (Healthy)`,
            `  Before Fix: 28.6ms (Dropped 2 frames per keystroke)`,
            `  Bottleneck: Impure 'filter' pipe in 500 rows`,
            `  Fix: Replaced with computed() signal`,
            `= 95% CPU reduction during user typing`,
          ], { icon: 'terminal' }),
          zPipe: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'DEVTOOLS PERFORMANCE PROFILING'),
        },
        links: {
          dh: h('devtools', 'hotspotDetector', ['devtools', 'hotspotDetector'], { label: 'profile flame chart' }),
          ho: h('hotspotDetector', 'optimizedFps', ['hotspotDetector', 'optimizedFps'], { label: 'refactor to computed' }),
        },
        flows: [{ route: ['dh', 'ho'], kind: 'check', rate: 1.6 }],
      },
    },
  ],
};
