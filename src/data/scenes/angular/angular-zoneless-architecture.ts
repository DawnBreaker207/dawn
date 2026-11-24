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

export const angularZonelessArchitectureLesson = {
  id: 'angular-zoneless-architecture',
  title: 'Zoneless Angular: Signal-Driven Change Detection',
  summary: 'Dive into next-generation Zoneless Angular. Discover how provideExperimentalZonelessChangeDetection eliminates Zone.js overhead, cuts bundle size, and drives targeted DOM updates via ChangeDetectionScheduler.',
  minutes: 25,
  level: 'advanced',
  metrics: ['zonejsStatus', 'bundleDelta', 'schedulerMode', 'notificationModel'],
  legend: ['flow', ['signal', 'signal notification'], ['schedule', 'coalesced microtask render'], ['dom', 'direct DOM mutation']],
  goals: [
    { text: 'Elimination of Zone.js monkey patches and polyfills', step: 1 },
    { text: 'The ChangeDetectionScheduler & render coalescing', step: 2 },
    { text: 'Signal-based reactive notification model in Zoneless mode', step: 3 },
    { text: 'Targeted branch rendering: updating only dirty components', step: 4 },
    { text: 'Native async/await debugging in browser DevTools', step: 5 },
    { text: 'Enterprise performance benchmark: Zone.js vs Zoneless', step: 6 },
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
        text: 'Zoneless is the biggest leap forward in Angular architecture since Ivy, removing 10 years of monkey-patched baggage.',
      },
      metrics: { zonejsStatus: 'REMOVED (Zero polyfill)', bundleDelta: '-35 KB payload', schedulerMode: 'Zoneless', notificationModel: 'Signal-Driven' },
      scene: {
        entities: {
          appConfig: y(-16, -6, { label: 'app.config.ts', tags: [{ text: 'Zoneless Mode', tone: 'green', icon: 'zap' }] }),
          droppedPoly: d(-4, -6, { s: 4.8, h: 52, color: 'rose', glyph: 'boxes', label: ['zone.js Dropped'], sub: 'no polyfill' }),
          leanBundle: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['Lean App (-35KB)'], sub: 'native runtime' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Zoneless Application Setup', [
            `// src/app/app.config.ts`,
            `export const appConfig: ApplicationConfig = {`,
            `  providers: [`,
            `    provideExperimentalZonelessChangeDetection(),`,
            `    provideRouter(routes)`,
            `  ]`,
            `};`,
            `// In angular.json: Remove 'zone.js' from "polyfills" array!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ad: h('appConfig', 'droppedPoly', ['appConfig', 'droppedPoly'], { label: 'drop polyfill' }),
          dl: h('droppedPoly', 'leanBundle', ['droppedPoly', 'leanBundle'], { label: 'bundle drops 35KB' }),
        },
        flows: [{ route: ['ad', 'dl'], kind: 'signal', rate: 1.5 }],
      },
    },
    {
      short: 'Scheduler',
      chapter: 'setup',
      title: 'ChangeDetectionScheduler & Render Coalescing',
      body: [
        'Without Zone.js to auto-trigger <code>appRef.tick()</code>, how does Angular know when to render?',
        'Angular introduces the <b>ChangeDetectionScheduler</b>. Whenever a Signal updates, an input changes, or an event fires, the scheduler coalesces multiple notifications into a single microtask or <code>requestAnimationFrame</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Render coalescing means modifying 10 signals synchronously triggers only ONE rendering pass.',
      },
      changes: ['+ ChangeDetectionScheduler replaces NgZone tick trigger', '+ Multiple notifications coalesced into single animation frame'],
      metrics: { zonejsStatus: 'Zoneless', bundleDelta: '-35 KB', schedulerMode: 'Coalesced Microtask', notificationModel: 'Active' },
      scene: {
        entities: {
          appConfig: y(-16, -6, { label: 'count.set(5)', tags: [{ text: 'Signal Mutate', tone: 'blue', icon: 'zap' }] }),
          cdScheduler: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['CD Scheduler'], sub: 'coalesce tick' }),
          renderTick: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['Render Pass'], sub: '1 pass only' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Scheduler Coalescing Logic', [
            `count.set(1);`,
            `count.set(2);`,
            `count.set(3);`,
            `// Scheduler coalesces all 3 mutations into 1 microtask:`,
            `queueMicrotask(() => {`,
            `  renderDirtyViews(); // Executes only ONCE!`,
            `});`,
          ], { icon: 'terminal' }),
        },
        links: {
          ac: h('appConfig', 'cdScheduler', ['appConfig', 'cdScheduler'], { label: 'notify mutation' }),
          cr: h('cdScheduler', 'renderTick', ['cdScheduler', 'renderTick'], { label: 'coalesce pass' }),
        },
        flows: [{ route: ['ac', 'cr'], kind: 'schedule', rate: 1.5 }],
      },
    },
    {
      short: 'Signal Notification',
      chapter: 'execution',
      title: 'Signal-Driven Notification Model',
      body: [
        'When a component’s template reads a signal (e.g. <code>&lt;h1&gt;{{ user.name() }}&lt;/h1&gt;</code>), the template creates a reactive consumer node.',
        'When <code>name.set(\'Alice\')</code> is called, the signal pushes a notification straight to that specific view’s consumer, marking <b>only that component</b> as dirty.',
      ],
      callout: {
        kind: 'insight',
        text: 'In Zoneless mode, signals provide the precise notification mechanism that tells Angular exactly which views need updating.',
      },
      changes: ['+ Signal tracks template consumer binding', '+ Name update notifies only the affected component view'],
      metrics: { zonejsStatus: 'Zoneless', bundleDelta: '-35 KB', schedulerMode: 'Targeted', notificationModel: 'Precise View Hit' },
      scene: {
        entities: {
          appConfig: y(-16, -6, { label: 'user.name.set', tags: [{ text: 'Producer', tone: 'green', icon: 'zap' }] }),
          cdScheduler: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['Template Link'], sub: 'tracks LView' }),
          renderTick: d(8, -6, { s: 4.8, h: 52, color: 'green', glyph: 'package', label: ['Targeted View'], sub: 'marked dirty' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Targeted Template Consumer', [
            `@Component({`,
            `  template: \`<h1>{{ userName() }}</h1>\``,
            `})`,
            `export class UserComponent {`,
            `  userName = signal('Alice');`,
            `  // Mutating userName() notifies UserComponent's LView directly!`,
            `  // Zero parent or sibling components are notified.`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          ac: h('appConfig', 'cdScheduler', ['appConfig', 'cdScheduler'], { label: 'signal push' }),
          cr: h('cdScheduler', 'renderTick', ['cdScheduler', 'renderTick'], { label: 'mark view dirty' }),
        },
        flows: [{ route: ['ac', 'cr'], kind: 'signal', rate: 1.5 }],
      },
    },
    {
      short: 'Targeted Render',
      chapter: 'execution',
      title: 'Targeted Branch Rendering: Zero Whole-Tree Scans',
      body: [
        'Compare the execution models: Zone.js walks all 500 components in a top-down tree. Zoneless Angular skips all clean components and updates <b>only the marked dirty component</b>.',
        'The scheduler traverses down the branch directly to the dirty view, applies Ivy template instructions, and exits in fractions of a millisecond.',
      ],
      callout: {
        kind: 'tip',
        text: 'This targeted rendering model provides the pinpoint update speed of Solid.js or Svelte with Angular’s robust enterprise architecture.',
      },
      changes: ['+ Unchanged components completely skipped', '+ Render time slashed from 15ms to under 0.5ms'],
      metrics: { zonejsStatus: 'Zoneless', bundleDelta: '-35 KB', schedulerMode: 'Targeted Walk', notificationModel: '1 Component Checked' },
      scene: {
        entities: {
          cdScheduler: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['CD Scheduler'], sub: 'dirty walk' }),
          renderTick: d(8, -6, { s: 4.8, h: 52, color: 'green', glyph: 'package', label: ['Dirty View'], sub: '1 node check' }),
          cleanDom: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['DOM Mutated'], sub: '0.2ms update' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Render Cost Comparison', [
            `Top-Down Zone.js:`,
            `  Checked: 500 components`,
            `  Duration: 14.8 ms`,
            ``,
            `Zoneless Signal-Driven:`,
            `  Checked: 1 component`,
            `  Duration: 0.2 ms (-98% CPU reduction!)`,
          ], { icon: 'terminal' }),
        },
        links: {
          cr: h('cdScheduler', 'renderTick', ['cdScheduler', 'renderTick'], { label: 'traverse dirty' }),
          rc: h('renderTick', 'cleanDom', ['renderTick', 'cleanDom'], { label: 'mutate DOM' }),
        },
        flows: [{ route: ['cr', 'rc'], kind: 'dom', rate: 1.5 }],
      },
    },
    {
      short: 'Native Debugging',
      chapter: 'technique',
      title: 'Native Async/Await & Pristine DevTools Traces',
      body: [
        'Because Zone.js no longer monkey-patches JavaScript Promises, native <code>async/await</code> works out of the box with zero compiler downleveling.',
        'Browser DevTools display pristine call stacks pointing to your exact source files and line numbers instead of 30 frames of <code>zone.js:1042</code> wrappers.',
      ],
      callout: {
        kind: 'insight',
        text: 'Async stack traces in Chrome DevTools now link seamlessly across await boundaries directly to your TypeScript source code.',
      },
      changes: ['+ Native async/await fully supported without zone.js polyfills', '+ Clean error stack traces restored in browser console'],
      metrics: { zonejsStatus: 'Native JS', bundleDelta: '-35 KB', schedulerMode: 'Native Promises', notificationModel: 'Clean Traces' },
      scene: {
        entities: {
          appConfig: y(-16, -6, { label: 'async/await', tags: [{ text: 'Native ES2022', tone: 'blue', icon: 'zap' }] }),
          cdScheduler: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['Native Promise'], sub: 'zero patches' }),
          renderTick: d(8, -6, { s: 4.8, h: 52, color: 'green', glyph: 'package', label: ['Pristine Trace'], sub: 'clean source' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Pristine Error Stack Trace', [
            `Error: Order failed!`,
            `    at OrderService.fetch (order.service.ts:42)`,
            `    at async UserComponent.load (user.component.ts:18)`,
            `# Notice: Zero zone.js frames cluttering the console!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ac: h('appConfig', 'cdScheduler', ['appConfig', 'cdScheduler'], { label: 'await promise' }),
          cr: h('cdScheduler', 'renderTick', ['cdScheduler', 'renderTick'], { label: 'trace source' }),
        },
        flows: [{ route: ['ac', 'cr'], kind: 'signal', rate: 1.5 }],
      },
    },
    {
      short: 'Enterprise Benchmark',
      chapter: 'scaling',
      title: 'Enterprise Benchmark: Zone.js vs Zoneless',
      body: [
        'In large enterprise dashboards with 10,000 real-time rows, Zoneless architecture delivers game-changing improvements:',
        '1. <b>Payload</b>: -35KB bundle reduction. 2. <b>CPU Usage</b>: 80% reduction during high-frequency events. 3. <b>Memory</b>: Lower heap usage without Zone task tracking.',
      ],
      callout: {
        kind: 'tip',
        text: 'Zoneless Angular is the recommended architectural target for all new Angular enterprise applications.',
      },
      changes: ['+ Application fully converted to Zoneless', '+ 60fps locked under high-throughput data streams'],
      metrics: { zonejsStatus: 'Production Ready', bundleDelta: '-35 KB permanent', schedulerMode: 'Peak Performance', notificationModel: 'Zoneless Mastery' },
      scene: {
        entities: {
          appConfig: y(-16, -6, { label: '10k Rows Table', tags: [{ text: 'High Churn', tone: 'purple', icon: 'zap' }] }),
          cdScheduler: d(-4, -6, { s: 4.8, h: 52, color: 'green', glyph: 'cpu', label: ['Zoneless Core'], sub: 'targeted CD' }),
          cleanDom: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['60 FPS Locked'], sub: '80% CPU saved' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Enterprise Performance Benchmark', [
            `Metric            | Zone.js         | Zoneless (Signals)`,
            `------------------+-----------------+-------------------`,
            `Bundle Size (gzip)| +35 KB          | 0 KB (Removed)`,
            `CD Cycle (10k rows| 42.5 ms (jank)  | 1.2 ms (instant)`,
            `Memory Heap       | 84 MB           | 52 MB (-38%)`,
            `FPS Stability     | 24-45 fps       | 60 fps rock-solid`,
            `Recommendation    | Legacy apps     | Modern standard`,
          ], { icon: 'terminal' }),
        },
        links: {
          ac: h('appConfig', 'cdScheduler', ['appConfig', 'cdScheduler'], { label: 'stream row deltas' }),
          cl: h('cdScheduler', 'cleanDom', ['cdScheduler', 'cleanDom'], { label: 'render 60fps' }),
        },
        flows: [{ route: ['ac', 'cl'], kind: 'schedule', rate: 1.6 }],
      },
    },
  ],
};
