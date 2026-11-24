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

export const angularZonejsDirtyCheckingLesson = {
  id: 'angular-zonejs-dirty-checking',
  title: 'Zone.js & Top-Down Dirty Checking',
  summary: 'Deconstruct how Zone.js patches browser asynchronous primitives (setTimeout, addEventListener, Promise) and triggers global top-down change detection via ApplicationRef.tick().',
  minutes: 25,
  level: 'intermediate',
  metrics: ['zoneStatus', 'patchedApis', 'tickTrigger', 'nodesChecked'],
  legend: ['flow', ['async', 'async task trigger'], ['tick', 'top-down dirty checking'], ['outside', 'runOutsideAngular'], ['bypass', 'custom flag']],
  goals: [
    { text: 'How Zone.js monkey-patches browser Web APIs', step: 1 },
    { text: 'NgZone onMicrotaskEmpty notification pipeline', step: 2 },
    { text: 'Top-down component dirty checking traversal across the view tree', step: 3 },
    { text: 'Escaping Zone overhead via NgZone.runOutsideAngular', step: 4 },
    { text: 'Zone.js performance bottlenecks: unnecessary ticks on high-frequency events', step: 5 },
    { text: 'Zone flags: selectively disabling patches via zone-flags.ts', step: 6 },
  ],
  steps: [
    {
      short: 'Monkey Patching',
      chapter: 'concept',
      title: 'Zone.js: Monkey Patching Async Web APIs',
      body: [
        'In traditional Angular, <code>Zone.js</code> executes before anything else in the browser, monkey-patching async Web APIs: <code>addEventListener</code>, <code>setTimeout</code>, <code>setInterval</code>, <code>fetch</code>, and <code>Promise</code>.',
        'Whenever an async callback runs, Zone intercepts the execution context and tracks when the microtask and macrotask queues drain.',
      ],
      callout: {
        kind: 'insight',
        text: 'Zone.js creates an execution context that persists across asynchronous boundaries, enabling Angular to know when async work finishes.',
      },
      metrics: { zoneStatus: 'Active', patchedApis: '150+ Web APIs', tickTrigger: 'Listening', nodesChecked: '0' },
      scene: {
        entities: {
          browserApi: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['window.setTimeout'], sub: 'native browser API' }),
          zonePatch: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['Zone.js Intercept'], sub: 'patches prototype' }),
          wrappedCb: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['Wrapped Callback'], sub: 'tracks task lifecycle' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Zone.js Monkey Patching', [
            `// Zone.js patches browser prototypes on startup:`,
            `const originalSetTimeout = window.setTimeout;`,
            `window.setTimeout = function(callback, delay) {`,
            `  const zoneTask = Zone.current.scheduleMacroTask('setTimeout', callback);`,
            `  return originalSetTimeout(() => {`,
            `    zoneTask.invoke(); // Notifies NgZone on completion!`,
            `  }, delay);`,
            `};`,
          ], { icon: 'terminal' }),
          zZone: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ZONE.JS MONKEY PATCHING PIPELINE'),
        },
        links: {
          bz: h('browserApi', 'zonePatch', ['browserApi', 'zonePatch'], { label: 'patch function' }),
          zw: h('zonePatch', 'wrappedCb', ['zonePatch', 'wrappedCb'], { label: 'wrap callback' }),
        },
        flows: [{ route: ['bz', 'zw'], kind: 'async', rate: 1.5 }],
      },
    },
    {
      short: 'NgZone Notification',
      chapter: 'setup',
      title: 'The NgZone onMicrotaskEmpty Pipeline',
      body: [
        'Angular wraps Zone in <code>NgZone</code>. When all scheduled microtasks finish and the JavaScript call stack empties, NgZone emits the <code>onMicrotaskEmpty</code> event.',
        '<code>ApplicationRef</code> listens to this stream and automatically invokes <code>appRef.tick()</code> to begin change detection.',
      ],
      callout: {
        kind: 'tip',
        text: 'This automated notification is why developers rarely had to call $scope.$apply() like in AngularJS.',
      },
      changes: ['+ Async callback completes execution', '+ NgZone emits onMicrotaskEmpty, triggering appRef.tick()'],
      metrics: { zoneStatus: 'Microtask Empty', patchedApis: '150+ Web APIs', tickTrigger: 'appRef.tick()', nodesChecked: '0' },
      scene: {
        entities: {
          taskDone: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['Callback Complete'], sub: 'state updated in memory' }),
          ngZone: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['NgZone Dispatcher'], sub: 'onMicrotaskEmpty.emit()' }),
          appRefTick: d(10, 8, { s: 4.8, h: 50, color: 'amber', glyph: 'package', label: ['appRef.tick()'], sub: 'triggers global walk' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'NgZone Event Hookup', [
            `// Inside ApplicationRef:`,
            `this.ngZone.onMicrotaskEmpty.subscribe(() => {`,
            `  this.ngZone.run(() => {`,
            `    this.tick(); // Global dirty checking cycle!`,
            `  });`,
            `});`,
          ], { icon: 'terminal' }),
          zZone: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'NGZONE TICK DISPATCH SEQUENCE'),
        },
        links: {
          tn: h('taskDone', 'ngZone', ['taskDone', 'ngZone'], { label: 'queue empty' }),
          na: h('ngZone', 'appRefTick', ['ngZone', 'appRefTick'], { label: 'trigger tick()' }),
        },
        flows: [{ route: ['tn', 'na'], kind: 'async', rate: 1.5 }],
      },
    },
    {
      short: 'Top-Down Walk',
      chapter: 'execution',
      title: 'Top-Down Dirty Checking Traversal',
      body: [
        'When <code>appRef.tick()</code> executes, Angular walks the component tree <b>top-down</b>, starting from <code>AppComponent</code> down to every single leaf component.',
        'At each node, it executes the template update instructions, comparing current property values with previous values in <code>LView</code> slots. If different, it mutates the real DOM.',
      ],
      callout: {
        kind: 'warning',
        text: 'In a large app with 500 components, a single button click anywhere causes Angular to check all 500 components by default!',
      },
      changes: ['+ Top-down recursive walk initiated from root', '+ All 500 components checked sequentially'],
      metrics: { zoneStatus: 'Walking Tree', patchedApis: '150+ Web APIs', tickTrigger: 'Tick in progress', nodesChecked: '500 nodes' },
      scene: {
        entities: {
          appRoot: d(-10, -18, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['AppComponent (Root)'], sub: 'checked first' }),
          navChild: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'boxes', label: ['Nav (Child)'], sub: 'checked second' }),
          leafChild: d(10, 8, { s: 4.8, h: 50, color: 'amber', glyph: 'boxes', label: ['Button (Leaf)'], sub: 'checked third' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Top-Down Traversal Order', [
            `appRef.tick():`,
            `  1. checkView(AppComponent)`,
            `     ├── 2. checkView(NavComponent)`,
            `     └── 3. checkView(SidebarComponent)`,
            `           └── 4. checkView(UserAvatarComponent)`,
            `= Complete tree checked depth-first in O(N) time`,
          ], { icon: 'terminal' }),
          zZone: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'TOP-DOWN DIRTY CHECKING TRAVERSAL'),
        },
        links: {
          an: h('appRoot', 'navChild', ['appRoot', 'navChild'], { label: 'check child' }),
          nl: h('navChild', 'leafChild', ['navChild', 'leafChild'], { label: 'check leaf' }),
        },
        flows: [{ route: ['an', 'nl'], kind: 'tick', rate: 1.5 }],
      },
    },
    {
      short: 'runOutsideAngular',
      chapter: 'technique',
      title: 'Escaping Zone via NgZone.runOutsideAngular',
      body: [
        'For high-frequency events (e.g. <code>mousemove</code>, <code>scroll</code>, WebGL renders, or <code>requestAnimationFrame</code>), triggering change detection 60 times a second destroys performance.',
        'Use <code>ngZone.runOutsideAngular(() =&gt; { ... })</code>! Callbacks executed inside this block bypass Zone entirely and <b>never trigger appRef.tick()</b>.',
      ],
      callout: {
        kind: 'tip',
        text: 'When you are ready to update the UI after an outside computation, bring execution back inside via ngZone.run(() => { ... }).',
      },
      changes: ['+ High-frequency listeners executed outside Angular', '+ Zero change detection ticks triggered'],
      metrics: { zoneStatus: 'Outside Angular', patchedApis: 'Bypassed', tickTrigger: '0 ticks (Suppressed)', nodesChecked: '0 nodes' },
      scene: {
        entities: {
          scrollEvent: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['Scroll / Canvas'], sub: '60 events / second' }),
          outsideZone: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['runOutsideAngular'], sub: 'bypasses onMicrotaskEmpty' }),
          nativeCanvas: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Direct DOM Write'], sub: '60fps locked, 0 ticks' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'runOutsideAngular Pattern', [
            `constructor(private ngZone: NgZone) {}`,
            ``,
            `ngAfterViewInit() {`,
            `  this.ngZone.runOutsideAngular(() => {`,
            `    window.addEventListener('scroll', () => {`,
            `      this.updateParallax(); // ZERO CD ticks!`,
            `    });`,
            `  });`,
            `}`,
          ], { icon: 'terminal' }),
          zZone: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ESCAPING ZONE VIA RUNOUTSIDEANGULAR'),
        },
        links: {
          so: h('scrollEvent', 'outsideZone', ['scrollEvent', 'outsideZone'], { label: 'execute outside' }),
          on: h('outsideZone', 'nativeCanvas', ['outsideZone', 'nativeCanvas'], { label: 'direct canvas paint' }),
        },
        flows: [{ route: ['so', 'on'], kind: 'outside', rate: 1.5 }],
      },
    },
    {
      short: 'Bottlenecks',
      chapter: 'problem',
      title: 'Zone.js Performance Bottlenecks & Overhead',
      body: [
        'Zone.js has significant architectural downsides in modern web applications:',
        '1. <b>Overhead</b>: ~35KB minified polyfill added to bundle.',
        '2. <b>False Positives</b>: Unrelated background intervals trigger global change detection.',
        '3. <b>Async/Await Stack Traces</b>: Zone monkey-patches Promises, obscuring native browser stack traces during debugging.',
      ],
      callout: {
        kind: 'warning',
        text: 'These limitations led the Angular team to design the modern Zoneless and Signals-based reactive architecture.',
      },
      changes: ['+ Profiling exposes Zone.js CPU and memory overhead'],
      metrics: { zoneStatus: 'Bottlenecked', patchedApis: '35KB bundle penalty', tickTrigger: 'Excessive ticks', nodesChecked: 'High CPU' },
      scene: {
        entities: {
          polySize: d(-10, -18, { s: 4.8, h: 50, color: 'rose', glyph: 'package', label: ['zone.js (35KB)'], sub: 'bundle size tax' }),
          stackMangler: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'cpu', label: ['Mangled Traces'], sub: 'zone.js:1042 obscuring error' }),
          wastedTicks: d(10, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'boxes', label: ['False Ticks'], sub: 'checks unchanged views' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Zone.js Bottleneck Audit', [
            `DevTools Performance Profile:`,
            `  Total JS Execution: 180ms`,
            `  Zone.js Overhead: 65ms (36% of CPU spent in Zone wrapping!)`,
            `  Stack Trace: Error at zone.js:1042:15 -> zone.js:520:30`,
            `  Native async/await debugging: Obscured`,
            `= Motivated Angular's shift to Zoneless`,
          ], { icon: 'terminal' }),
          zZone: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ZONE.JS ARCHITECTURAL OVERHEAD'),
        },
        links: {
          ps: h('polySize', 'stackMangler', ['polySize', 'stackMangler'], { label: 'patch prototypes' }),
          sw: h('stackMangler', 'wastedTicks', ['stackMangler', 'wastedTicks'], { label: 'trigger unnecessary ticks' }),
        },
        flows: [{ route: ['ps', 'sw'], kind: 'async', rate: 1.5 }],
      },
    },
    {
      short: 'Zone Flags',
      chapter: 'scaling',
      title: 'Zone Flags: Selectively Disabling Patches',
      body: [
        'Before switching to full Zoneless, teams can disable specific patches via <code>zone-flags.ts</code>.',
        'Setting <code>__Zone_disable_requestAnimationFrame = true</code> or <code>__zone_symbol__UNPATCHED_EVENTS = [\'scroll\', \'mousemove\']</code> prevents Zone from hooking high-churn APIs.',
      ],
      callout: {
        kind: 'tip',
        text: 'zone-flags.ts must be imported in polyfills.ts BEFORE zone.js itself is imported.',
      },
      changes: ['+ zone-flags.ts configured to unpatch scroll and rAF', '+ High-frequency events completely decoupled from Zone'],
      metrics: { zoneStatus: 'Selective Patching', patchedApis: 'Custom tuned', tickTrigger: 'Optimized', nodesChecked: 'Reduced' },
      scene: {
        entities: {
          zoneFlags: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['zone-flags.ts'], sub: 'unpatch scroll & rAF' }),
          selectivePatcher: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['Selective Patcher'], sub: 'skips unpatched symbols' }),
          leanZone: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Lean Zone'], sub: 'zero scroll tick spam' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'zone-flags.ts Configuration', [
            `// src/zone-flags.ts (imported before zone.js):`,
            `(window as any).__Zone_disable_requestAnimationFrame = true;`,
            `(window as any).__zone_symbol__UNPATCHED_EVENTS = [`,
            `  'scroll',`,
            `  'mousemove',`,
            `  'touchmove'`,
            `];`,
            `= Prevents CD from firing during user scrolling`,
          ], { icon: 'terminal' }),
          zZone: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ZONE-FLAGS SELECTIVE API BYPASS'),
        },
        links: {
          zs: h('zoneFlags', 'selectivePatcher', ['zoneFlags', 'selectivePatcher'], { label: 'set global flags' }),
          sl: h('selectivePatcher', 'leanZone', ['selectivePatcher', 'leanZone'], { label: 'apply selective patches' }),
        },
        flows: [{ route: ['zs', 'sl'], kind: 'bypass', rate: 1.6 }],
      },
    },
  ],
};
