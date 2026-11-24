// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularZonelessArchitectureLesson = {
  id: 'angular-zoneless-architecture',
  title: 'Zoneless Angular: Signal-Driven Change Detection',
  summary: 'Dive into the next-generation Zoneless Angular architecture. Discover how provideExperimentalZonelessChangeDetection eliminates Zone.js overhead, cuts bundle size, and drives targeted DOM updates via ChangeDetectionScheduler.',
  minutes: 20,
  level: 'advanced',
  metrics: ['zonejsStatus', 'bundleDelta', 'schedulerMode', 'notificationModel'],
  legend: ['flow', ['signal', 'signal notification'], ['schedule', 'coalesced microtask render']],
  goals: [
    { text: 'Elimination of Zone.js monkey patches and polyfills', step: 1 },
    { text: 'The ChangeDetectionScheduler & render coalescing', step: 2 },
    { text: 'Signal-based reactive notification model in Zoneless mode', step: 3 },
  ],
  steps: [
    {
      short: 'Dropping Zone.js',
      chapter: 'concept',
      title: 'Removing Zone.js: Leaner & Faster Runtime',
      body: [
        'By configuring <code>provideExperimentalZonelessChangeDetection()</code> in <code>appConfig</code>, developers remove <code>zone.js</code> from <code>angular.json</code> polyfills entirely.',
        'This drops bundle payload by ~35KB (compressed), eliminates hundreds of monkey-patched browser Web APIs, unlocks native async/await debugging in browser DevTools, and reduces memory consumption.',
      ],
      callout: {
        kind: 'insight',
        text: 'Zoneless Angular eliminates the global top-down dirty checking pass, transforming Angular into a precise signal-driven reactive engine.',
      },
      metrics: { zonejsStatus: 'Removed (0 KB)', bundleDelta: '-35 KB', schedulerMode: 'Zoneless Scheduler', notificationModel: 'Explicit Signals' },
      scene: {
        entities: {
          appConfig: d(-10, 0, { color: 'amber', glyph: 'terminal', label: ['appConfig'], sub: 'provideExperimentalZoneless...' }),
          bundle: d(0, 0, { color: 'green', glyph: 'package', label: ['Polyfills Bundle'], sub: 'zone.js stripped (-35KB)' }),
          nativeApis: d(10, 0, { color: 'blue', glyph: 'shield', label: ['Native Web APIs'], sub: 'Zero monkey patching' }),
          zClean: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'ZONELESS RUNTIME CONFIGURATION'),
        },
        links: {
          ab: h('appConfig', 'bundle', ['appConfig', 'bundle'], { label: 'strip polyfills' }),
          bn: h('bundle', 'nativeApis', ['bundle', 'nativeApis'], { label: 'restore native APIs' }),
        },
        flows: [{ route: ['ab', 'bn'], kind: 'signal', rate: 1.5 }],
      },
    },
    {
      short: 'Scheduler Coalesce',
      chapter: 'execution',
      title: 'ChangeDetectionScheduler & Microtask Coalescing',
      body: [
        'Without Zone.js listening to every async event, how does Angular know when to render?',
        'Angular introduces the internal <b>ChangeDetectionScheduler</b>. When a Signal producer mutates, a template event fires, or an AsyncPipe emits, it notifies the scheduler.',
        'The scheduler coalesces multiple notifications within the current microtask tick, guaranteeing that only a single render pass executes per frame.',
      ],
      callout: {
        kind: 'tip',
        text: 'Coalescing batches 100 simultaneous signal updates into exactly 1 coordinated render tick.',
      },
      changes: ['+ Signals emitted 50 mutations synchronously', '+ ChangeDetectionScheduler coalesced all notifications', '+ Scheduled exactly 1 microtask render tick'],
      metrics: { zonejsStatus: 'Absent', bundleDelta: '-35 KB', schedulerMode: 'Microtask Coalesced', notificationModel: 'Queued (1 Pass)' },
      scene: {
        entities: {
          mutations: d(-10, 0, { color: 'purple', glyph: 'cpu', label: ['50x signal.set()'], sub: 'Synchronous mutations' }),
          scheduler: d(0, 0, { color: 'red', glyph: 'clock', label: ['ChangeDetectionScheduler'], sub: 'queueMicrotask() batcher' }),
          renderer: d(10, 0, { color: 'green', glyph: 'boxes', label: ['Coalesced Render'], sub: 'Single DOM commit' }),
          zBatch: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'RENDER COALESCING PIPELINE'),
        },
        links: {
          ms: h('mutations', 'scheduler', ['mutations', 'scheduler'], { label: 'notify' }),
          sr: h('scheduler', 'renderer', ['scheduler', 'renderer'], { label: 'batch flush' }),
        },
        flows: [{ route: ['ms', 'sr'], kind: 'schedule', rate: 2.0 }],
      },
    },
    {
      short: 'Targeted Renders',
      chapter: 'solution',
      title: 'Targeted Component Tree Updates',
      body: [
        'In Zoneless mode, only components marked dirty by signal notifications or user events are re-evaluated.',
        'Unchanged components are completely bypassed without executing their template functions, achieving peak performance on complex enterprise dashboards.',
      ],
      callout: {
        kind: 'insight',
        text: 'Zoneless change detection is the foundation for future fine-grained block-level reactivity in Angular.',
      },
      changes: ['+ Rendered only invalidated components', '+ Unaffected subtrees remained untouched', '+ 60 FPS maintained with 0 dirty checking overhead'],
      metrics: { zonejsStatus: 'Absent', bundleDelta: '-35 KB', schedulerMode: 'Fine-Grained Active', notificationModel: 'Precision Target' },
      scene: {
        entities: {
          scheduler: d(-10, 0, { color: 'red', glyph: 'clock', label: ['CD Scheduler'], sub: 'Tick flush' }),
          targetComp: d(0, 0, { color: 'green', glyph: 'terminal', label: ['Dirty Component'], sub: 'Signal consumed -> updated' }),
          idleSubtree: d(10, 0, { color: 'blue', glyph: 'shield', label: ['Idle Subtree'], sub: 'Completely skipped (0 work)' }),
          zTarget: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'PRECISION ZONELESS RENDERING'),
        },
        links: {
          st: h('scheduler', 'targetComp', ['scheduler', 'targetComp'], { label: 'execute view update' }),
          ti: h('targetComp', 'idleSubtree', ['targetComp', 'idleSubtree'], { label: 'skip boundary' }),
        },
        flows: [{ route: ['st'], kind: 'schedule', rate: 1.6 }],
      },
    },
  ],
};
