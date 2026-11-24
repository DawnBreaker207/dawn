// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularZonejsDirtyCheckingLesson = {
  id: 'angular-zonejs-dirty-checking',
  title: 'Zone.js & Top-Down Dirty Checking',
  summary: 'Deconstruct how Zone.js patches browser asynchronous primitives (setTimeout, addEventListener, Promise) and triggers global top-down change detection via ApplicationRef.tick().',
  minutes: 20,
  level: 'intermediate',
  metrics: ['zoneStatus', 'patchedApis', 'tickTrigger', 'nodesChecked'],
  legend: ['flow', ['async', 'async task trigger'], ['tick', 'top-down dirty checking']],
  goals: [
    { text: 'How Zone.js monkey-patches browser Web APIs', step: 1 },
    { text: 'NgZone onMicrotaskEmpty notification pipeline', step: 2 },
    { text: 'Top-down component dirty checking traversal', step: 3 },
  ],
  steps: [
    {
      short: 'Monkey Patching',
      chapter: 'concept',
      title: 'Zone.js: Monkey Patching Async Web APIs',
      body: [
        'In traditional Angular, <code>Zone.js</code> monkey-patches all asynchronous browser APIs: <code>addEventListener</code>, <code>setTimeout</code>, <code>setInterval</code>, <code>fetch</code>, and <code>Promise</code>.',
        'Whenever an async callback runs, Zone intercepts the execution context and tracks when the microtask and macrotask queues drain.',
      ],
      callout: {
        kind: 'insight',
        text: 'Zone.js provides an execution context that persists across async operations, allowing Angular to know WHEN something happened without knowing WHAT changed.',
      },
      metrics: { zoneStatus: 'Active', patchedApis: '150+ Web APIs', tickTrigger: 'Idle', nodesChecked: '0' },
      scene: {
        entities: {
          browserApi: d(-10, 0, { color: 'amber', glyph: 'terminal', label: ['Browser Event'], sub: 'click / setTimeout / Promise' }),
          zonePatch: d(0, 0, { color: 'purple', glyph: 'shield', label: ['Zone.js Interceptor'], sub: 'zone.runTask() wrapper' }),
          ngZone: d(10, 0, { color: 'blue', glyph: 'boxes', label: ['NgZone Scope'], sub: 'Tracks pending tasks' }),
          zZone: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'ZONE.JS ASYNC WRAPPER'),
        },
        links: {
          bz: h('browserApi', 'zonePatch', ['browserApi', 'zonePatch'], { label: 'intercept callback' }),
          zn: h('zonePatch', 'ngZone', ['zonePatch', 'ngZone'], { label: 'enter NgZone' }),
        },
        flows: [{ route: ['bz', 'zn'], kind: 'async', rate: 1.5 }],
      },
    },
    {
      short: 'Microtask Drain',
      chapter: 'trigger',
      title: 'onMicrotaskEmpty to ApplicationRef.tick()',
      body: [
        'When the last microtask in the current VM turn finishes, <code>NgZone</code> emits <code>onMicrotaskEmpty</code>.',
        '<code>ApplicationRef</code> listens to this stream and immediately invokes <code>this.tick()</code> to synchronize component model state with the DOM.',
      ],
      callout: {
        kind: 'tip',
        text: 'If high-frequency events (like mousemove or requestAnimationFrame) run inside NgZone, Angular triggers tick() 60 times a second. Use ngZone.runOutsideAngular() to prevent this.',
      },
      changes: ['+ User clicked button; microtasks executed', '+ NgZone detected microtask queue emptied', '+ Emitted onMicrotaskEmpty -> Triggered ApplicationRef.tick()'],
      metrics: { zoneStatus: 'Emitting', patchedApis: 'Monitored', tickTrigger: 'ApplicationRef.tick()', nodesChecked: 'Preparing Traversal' },
      scene: {
        entities: {
          ngZone: d(-10, 0, { color: 'blue', glyph: 'boxes', label: ['NgZone'], sub: 'onMicrotaskEmpty' }),
          appRef: d(0, 0, { color: 'red', glyph: 'cpu', label: ['ApplicationRef'], sub: 'tick() coordinator' }),
          viewTree: d(10, 0, { color: 'green', glyph: 'package', label: ['Root ViewRef'], sub: 'detectChanges() target' }),
          zTick: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'CHANGE DETECTION DISPATCH'),
        },
        links: {
          na: h('ngZone', 'appRef', ['ngZone', 'appRef'], { label: 'microtasks empty' }),
          av: h('appRef', 'viewTree', ['appRef', 'viewTree'], { label: 'invoke tick()' }),
        },
        flows: [{ route: ['na', 'av'], kind: 'tick', rate: 1.8 }],
      },
    },
    {
      short: 'Tree Traversal',
      chapter: 'execution',
      title: 'Global Top-Down Dirty Checking Traversal',
      body: [
        'During <code>tick()</code>, Angular traverses the entire component tree from top to bottom in depth-first order.',
        'At each component, it executes the template update instructions, comparing each expression with its previous value (<code>prev !== curr</code>). In development mode, it runs a second verification pass to catch <code>ExpressionChangedAfterItHasBeenCheckedError</code>.',
      ],
      callout: {
        kind: 'caution',
        text: 'In default change detection, EVERY component in the tree is checked on EVERY tick, regardless of which component actually changed.',
      },
      changes: ['+ Root AppComponent checked', '+ Child Header, Nav, and Footer components re-evaluated', '+ DOM patched where bindings differed'],
      metrics: { zoneStatus: 'Synchronized', patchedApis: 'Monitored', tickTrigger: 'Completed', nodesChecked: 'All (100% of tree)' },
      scene: {
        entities: {
          root: d(0, -6, { s: 4.8, color: 'red', glyph: 'boxes', label: ['AppComponent'], sub: 'checked' }),
          nav: d(-8, 2, { color: 'blue', glyph: 'terminal', label: ['NavComponent'], sub: 'checked (unaffected)' }),
          feed: d(0, 2, { color: 'green', glyph: 'terminal', label: ['FeedComponent'], sub: 'checked (DOM updated)' }),
          footer: d(8, 2, { color: 'blue', glyph: 'terminal', label: ['FooterComponent'], sub: 'checked (unaffected)' }),
          zTree: x({ x0: -11, x1: 11, y0: -8, y1: 5 }, 'TOP-DOWN DIRTY CHECK TREE'),
        },
        links: {
          rn: h('root', 'nav', ['root', 'nav'], { label: 'walk 1' }),
          rf: h('root', 'feed', ['root', 'feed'], { label: 'walk 2' }),
          rft: h('root', 'footer', ['root', 'footer'], { label: 'walk 3' }),
        },
        flows: [{ route: ['rn', 'rf', 'rft'], kind: 'tick', rate: 1.4 }],
      },
    },
  ],
};
