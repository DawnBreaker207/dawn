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
          browserApi: y(-16, -6, { label: 'Web APIs', tags: [{ text: 'setTimeout', tone: 'blue', icon: 'zap' }] }),
          zonePatch: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Zone.js Patch'], sub: 'patch proto' }),
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
        },
        links: {
          bz: h('browserApi', 'zonePatch', ['browserApi', 'zonePatch'], { label: 'intercept callback' }),
        },
        flows: [{ route: ['bz'], kind: 'async', rate: 1.5 }],
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
          browserApi: y(-16, -6, { label: 'Web APIs', tags: [{ text: 'setTimeout', tone: 'blue', icon: 'zap' }] }),
          zonePatch: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Zone.js Patch'], sub: 'patch proto' }),
          appRefTick: d(8, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'package', label: ['appRef.tick()'], sub: 'microtask' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'NgZone Event Hookup', [
            `// Inside ApplicationRef:`,
            `this.ngZone.onMicrotaskEmpty.subscribe(() => {`,
            `  this.ngZone.run(() => {`,
            `    this.tick(); // Global dirty checking cycle!`,
            `  });`,
            `});`,
          ], { icon: 'terminal' }),
        },
        links: {
          bz: h('browserApi', 'zonePatch', ['browserApi', 'zonePatch'], { label: 'intercept callback' }),
          za: h('zonePatch', 'appRefTick', ['zonePatch', 'appRefTick'], { label: 'emit microtask empty' }),
        },
        flows: [{ route: ['bz', 'za'], kind: 'async', rate: 1.5 }],
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
      changes: ['+ Top-down recursive walk initiated from root', '+ All components checked sequentially'],
      metrics: { zoneStatus: 'Walking Tree', patchedApis: '150+ Web APIs', tickTrigger: 'Tick in progress', nodesChecked: '500 nodes' },
      scene: {
        entities: {
          appRefTick: d(8, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'package', label: ['appRef.tick()'], sub: 'microtask' }),
          appRoot: d(8, 8, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['AppComponent'], sub: 'walk root' }),
          leafChild: b(-4, 8, { s: 4.6, h: 48, color: 'amber', glyph: 'server', label: ['Leaf Components'], sub: 'check leaves' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Top-Down Traversal Order', [
            `appRef.tick():`,
            `  1. checkView(AppComponent)`,
            `     ├── 2. checkView(NavComponent)`,
            `     └── 3. checkView(SidebarComponent)`,
            `           └── 4. checkView(UserAvatarComponent)`,
            `= Complete tree checked depth-first in O(N) time`,
          ], { icon: 'terminal' }),
        },
        links: {
          ta: h('appRefTick', 'appRoot', ['appRefTick', 'appRoot'], { label: 'start check' }),
          al: h('appRoot', 'leafChild', ['appRoot', 'leafChild'], { label: 'traverse tree' }),
        },
        flows: [{ route: ['ta', 'al'], kind: 'tick', rate: 1.5 }],
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
          browserApi: y(-16, -6, { label: 'Scroll/Canvas', tags: [{ text: '60 events/sec', tone: 'blue', icon: 'zap' }] }),
          zonePatch: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['runOutside'], sub: 'bypass Zone' }),
          leafChild: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Direct DOM'], sub: '0 ticks' }),
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
        },
        links: {
          bz: h('browserApi', 'zonePatch', ['browserApi', 'zonePatch'], { label: 'execute outside' }),
          zl: h('zonePatch', 'leafChild', ['zonePatch', 'leafChild'], { label: 'direct canvas paint' }),
        },
        flows: [{ route: ['bz', 'zl'], kind: 'outside', rate: 1.5 }],
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
          browserApi: y(-16, -6, { label: 'zone.js', tags: [{ text: '35KB Tax', tone: 'rose', icon: 'zap' }] }),
          zonePatch: d(-4, -6, { s: 4.8, h: 52, color: 'rose', glyph: 'cpu', label: ['Zone Wrapping'], sub: 'mangled traces' }),
          leafChild: b(8, -6, { s: 4.6, h: 48, color: 'rose', glyph: 'server', label: ['Wasted Ticks'], sub: 'CPU starved' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Zone.js Bottleneck Audit', [
            `DevTools Performance Profile:`,
            `  Total JS Execution: 180ms`,
            `  Zone.js Overhead: 65ms (36% of CPU spent in Zone wrapping!)`,
            `  Stack Trace: Error at zone.js:1042:15 -> zone.js:520:30`,
            `  Native async/await debugging: Obscured`,
            `= Motivated Angular's shift to Zoneless`,
          ], { icon: 'terminal' }),
        },
        links: {
          bz: h('browserApi', 'zonePatch', ['browserApi', 'zonePatch'], { label: 'wrap prototypes' }),
          zl: h('zonePatch', 'leafChild', ['zonePatch', 'leafChild'], { label: 'trigger false ticks' }),
        },
        flows: [{ route: ['bz', 'zl'], kind: 'async', rate: 1.5 }],
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
          browserApi: y(-16, -6, { label: 'zone-flags', tags: [{ text: 'Unpatch scroll', tone: 'green', icon: 'zap' }] }),
          zonePatch: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['Selective Patch'], sub: 'custom hooks' }),
          leanZone: d(8, -6, { s: 4.8, h: 52, color: 'green', glyph: 'package', label: ['Lean Zone'], sub: 'zero tick spam' }),
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
        },
        links: {
          bz: h('browserApi', 'zonePatch', ['browserApi', 'zonePatch'], { label: 'set flags' }),
          zp: h('zonePatch', 'leanZone', ['zonePatch', 'leanZone'], { label: 'apply patches' }),
        },
        flows: [{ route: ['bz', 'zp'], kind: 'bypass', rate: 1.6 }],
      },
    },
  ],
};
