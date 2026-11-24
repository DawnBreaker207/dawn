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
  legend: ['flow', ['check', 'reference equality check'], ['impure', 'per-tick run'], ['data', 'data transform'], ['signal', 'computed signal']],
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
          dataSource: y(-16, -6, { label: 'Template', tags: [{ text: 'price: 150', tone: 'blue', icon: 'zap' }] }),
          purePipe: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['Pure Pipe'], sub: '=== identity' }),
          memoCache: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['$150.00 Cache'], sub: 'memo hit' }),
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
        },
        links: {
          dp: h('dataSource', 'purePipe', ['dataSource', 'purePipe'], { label: 'compare inputs' }),
          pm: h('purePipe', 'memoCache', ['purePipe', 'memoCache'], { label: 'return cached' }),
        },
        flows: [{ route: ['dp', 'pm'], kind: 'check', rate: 1.5 }],
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
          dataSource: y(-16, -6, { label: 'Keystroke', tags: [{ text: '1000 items', tone: 'amber', icon: 'zap' }] }),
          impurePipe: d(-4, -6, { s: 4.8, h: 52, color: 'rose', glyph: 'cpu', label: ['Impure Pipe'], sub: 'runs per tick' }),
          domThrash: d(8, -6, { s: 4.8, h: 52, color: 'rose', glyph: 'package', label: ['CPU Starved'], sub: '30 FPS drop' }),
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
        },
        links: {
          di: h('dataSource', 'impurePipe', ['dataSource', 'impurePipe'], { label: 'trigger change cycle' }),
          id: h('impurePipe', 'domThrash', ['impurePipe', 'domThrash'], { label: 'burn CPU cycles' }),
        },
        flows: [{ route: ['di', 'id'], kind: 'impure', rate: 1.5 }],
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
          dataSource: y(-16, -6, { label: 'Array.push', tags: [{ text: 'Same pointer', tone: 'rose', icon: 'zap' }] }),
          purePipe: d(-4, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['Ref Check'], sub: 'prev === curr' }),
          memoCache: b(8, -6, { s: 4.6, h: 48, color: 'rose', glyph: 'database', label: ['Stale Cache'], sub: 'missed update' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'The Immutability Fix', [
            `// ❌ BROKEN: In-place mutation keeps same pointer`,
            `this.items.push(newItem); // Pure pipe will NOT update!`,
            ``,
            `// ✅ CORRECT: New array reference triggers pure pipe`,
            `this.items = [...this.items, newItem];`,
          ], { icon: 'terminal' }),
        },
        links: {
          dp: h('dataSource', 'purePipe', ['dataSource', 'purePipe'], { label: 'pointer compare' }),
          pm: h('purePipe', 'memoCache', ['purePipe', 'memoCache'], { label: 'reuse stale' }),
        },
        flows: [{ route: ['dp', 'pm'], kind: 'check', rate: 1.5 }],
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
          dataSource: y(-16, -6, { label: 'Observable', tags: [{ text: 'user$ stream', tone: 'purple', icon: 'zap' }] }),
          asyncPipe: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['AsyncPipe'], sub: 'markForCheck' }),
          renderedDom: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Template View'], sub: 'DOM updated' }),
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
        },
        links: {
          da: h('dataSource', 'asyncPipe', ['dataSource', 'asyncPipe'], { label: 'stream emission' }),
          ar: h('asyncPipe', 'renderedDom', ['asyncPipe', 'renderedDom'], { label: 'markForCheck()' }),
        },
        flows: [{ route: ['da', 'ar'], kind: 'data', rate: 1.5 }],
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
          dataSource: y(-16, -6, { label: 'query()', tags: [{ text: 'WritableSignal', tone: 'blue', icon: 'zap' }] }),
          computedDag: d(-4, -6, { s: 4.8, h: 52, color: 'green', glyph: 'cpu', label: ['filteredItems'], sub: 'computed DAG' }),
          memoCache: b(8, -6, { s: 4.6, h: 48, color: 'cyan', glyph: 'database', label: ['Memo Cache'], sub: 'lazy evaluated' }),
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
        },
        links: {
          dc: h('dataSource', 'computedDag', ['dataSource', 'computedDag'], { label: 'notify dirty' }),
          cm: h('computedDag', 'memoCache', ['computedDag', 'memoCache'], { label: 'read cached' }),
        },
        flows: [{ route: ['dc', 'cm'], kind: 'signal', rate: 1.5 }],
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
          dataSource: y(-16, -6, { label: 'DevTools', tags: [{ text: 'Flame Chart', tone: 'purple', icon: 'zap' }] }),
          computedDag: d(-4, -6, { s: 4.8, h: 52, color: 'green', glyph: 'cpu', label: ['computed DAG'], sub: '1.4ms check' }),
          renderedDom: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['60 FPS DOM'], sub: 'smooth UI' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'DevTools Performance Audit', [
            `Angular DevTools Profiler Record:`,
            `  Change Detection Duration: 1.4ms (Healthy)`,
            `  Before Fix: 28.6ms (Dropped 2 frames per keystroke)`,
            `  Bottleneck: Impure 'filter' pipe in 500 rows`,
            `  Fix: Replaced with computed() signal`,
            `= 95% CPU reduction during user typing`,
          ], { icon: 'terminal' }),
        },
        links: {
          dc: h('dataSource', 'computedDag', ['dataSource', 'computedDag'], { label: 'profile timings' }),
          cr: h('computedDag', 'renderedDom', ['computedDag', 'renderedDom'], { label: 'render 60fps' }),
        },
        flows: [{ route: ['dc', 'cr'], kind: 'check', rate: 1.6 }],
      },
    },
  ],
};
