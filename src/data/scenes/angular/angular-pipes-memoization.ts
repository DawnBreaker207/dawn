// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularPipesMemoizationLesson = {
  id: 'angular-pipes-memoization',
  title: 'Pipes & Memoization: Pure vs Impure Execution',
  summary: 'Deep-dive into Angular Pipes execution model. Understand pure pipe memoization, reference equality checking, and why impure pipes can degrade frame rates.',
  minutes: 15,
  level: 'intermediate',
  metrics: ['pipeType', 'memoCache', 'executionsPerCycle', 'perfImpact'],
  legend: ['flow', ['data', 'data transform'], ['check', 'reference equality check']],
  goals: [
    { text: 'Pure Pipes & Identity Memoization Cache', step: 1 },
    { text: 'Impure Pipes and Per-Tick Execution Cost', step: 2 },
    { text: 'Modern Signals computed() vs Pipes Comparison', step: 3 },
  ],
  steps: [
    {
      short: 'Pure Pipes',
      chapter: 'concept',
      title: 'Pure Pipes: Identity-Based Memoization',
      body: [
        'By default, <code>@Pipe({ pure: true })</code> only executes its <code>transform()</code> method when an input argument changes by <b>reference identity</b> (<code>===</code>).',
        'If the parent re-renders but the pipe argument references are unchanged, Angular skips execution entirely and reuses the cached return value.',
      ],
      callout: {
        kind: 'insight',
        text: 'Pure pipes are pure functions: given identical inputs, they produce identical outputs with zero side-effects.',
      },
      metrics: { pipeType: 'Pure (default)', memoCache: 'HIT (Cached)', executionsPerCycle: '0 (Skipped)', perfImpact: 'Zero Overhead' },
      scene: {
        entities: {
          inputVal: d(-10, 0, { color: 'amber', glyph: 'terminal', label: ['Input Data'], sub: 'users: [Alice, Bob]' }),
          comparator: d(0, 0, { color: 'blue', glyph: 'shield', label: ['Reference Checker'], sub: 'prevInput === curInput' }),
          purePipe: d(10, 0, { color: 'green', glyph: 'boxes', label: ['FilterPipe (Pure)'], sub: 'Cache: transform(users)' }),
          zPure: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'PURE PIPE IDENTITY GUARD'),
        },
        links: {
          ic: h('inputVal', 'comparator', ['inputVal', 'comparator'], { label: 'reference pass' }),
          cp: h('comparator', 'purePipe', ['comparator', 'purePipe'], { label: 'cache hit: skip eval' }),
        },
        flows: [{ route: ['ic', 'cp'], kind: 'check', rate: 1.4 }],
      },
    },
    {
      short: 'Impure Pipes',
      chapter: 'investigation',
      title: 'Impure Pipes: Execution on Every Change Detection Cycle',
      body: [
        'Setting <code>pure: false</code> tells Angular that the pipe has internal state or depends on external data mutations (e.g. array push).',
        'However, an impure pipe executes on <b>every single change detection pass</b>, on every keystroke, mousemove, or HTTP response on the page.',
        'Using an impure pipe for sorting or filtering a large list can cause significant frame drops (jank).',
      ],
      callout: {
        kind: 'caution',
        text: 'Impure pipes execute at 60fps or during every microtask. Never perform complex filtering in an impure pipe.',
      },
      changes: ['+ Disabled pure flag (pure: false)', '+ Bypassed reference memoization guard', '! Executed transform() 450 times in 3 seconds'],
      metrics: { pipeType: 'Impure (pure: false)', memoCache: 'DISABLED', executionsPerCycle: '100+ calls / tick', perfImpact: 'High CPU / Dropped Frames' },
      scene: {
        entities: {
          tick: d(-10, 0, { color: 'red', glyph: 'clock', label: ['ChangeDetectionTick'], sub: 'mousemove / timer' }),
          impurePipe: d(0, 0, { color: 'red', glyph: 'cpu', label: ['ImpureSortPipe'], sub: 'O(N log N) every tick!' }),
          dom: d(10, 0, { color: 'amber', glyph: 'terminal', label: ['DOM List Target'], sub: '1,000 table rows' }),
          zImpure: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'IMPURE PERF BOTTLENECK'),
        },
        links: {
          ti: h('tick', 'impurePipe', ['tick', 'impurePipe'], { label: 'force invoke' }),
          id: h('impurePipe', 'dom', ['impurePipe', 'dom'], { label: 'repaint' }),
        },
        flows: [{ route: ['ti', 'id'], kind: 'data', rate: 2.5 }],
      },
    },
    {
      short: 'Signals Computed',
      chapter: 'solution',
      title: 'Modern Alternative: computed() Signals',
      body: [
        'In modern Angular (v16+), reactive transformations are best handled using <code>computed()</code> signals rather than pipes.',
        '<code>computed(() => users().filter(...))</code> is automatically memoized, glitch-free, only re-evaluates when its producer signals emit, and runs lazily upon DOM read.',
      ],
      callout: {
        kind: 'tip',
        text: 'Use pure pipes for localized formatting (dates, currencies, units); use computed() signals for list filtering and complex data reshaping.',
      },
      changes: ['+ Replaced impure pipe with computed() signal', '+ Glitch-free reactive memoization restored', '+ Zero redundant computations on ticks'],
      metrics: { pipeType: 'computed() Signal', memoCache: 'DAG Memoized', executionsPerCycle: 'Lazy on Read Only', perfImpact: 'Optimal (O(1))' },
      scene: {
        entities: {
          rawSignal: d(-10, 0, { color: 'blue', glyph: 'boxes', label: ['users = signal([])'], sub: 'Producer' }),
          compSignal: d(0, 0, { color: 'cyan', glyph: 'database', label: ['filtered = computed(...)'], sub: 'Glitch-free DAG node' }),
          view: d(10, 0, { color: 'green', glyph: 'terminal', label: ['Template View'], sub: '{{ filtered() }}' }),
          zSignal: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'REACTIVE SIGNAL MEMOIZATION'),
        },
        links: {
          rc: h('rawSignal', 'compSignal', ['rawSignal', 'compSignal'], { label: 'notify dirty' }),
          cv: h('compSignal', 'view', ['compSignal', 'view'], { label: 'lazy pull read' }),
        },
        flows: [{ route: ['rc', 'cv'], kind: 'data', rate: 1.2 }],
      },
    },
  ],
};
