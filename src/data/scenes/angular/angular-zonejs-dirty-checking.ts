// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const angularZonejsDirtyCheckingLesson = {
  id: 'angular-zonejs-dirty-checking',
  title: 'Change Detection Evolution: Zone.js -> OnPush -> Zoneless',
  summary: 'Trace Angular’s complete change detection evolution: Zone.js monkey-patching & top-down dirty checking, escaping via runOutsideAngular & zone-flags, OnPush subtree pruning & markForCheck/detach, and modern Zoneless ChangeDetectionScheduler.',
  minutes: 30,
  level: 'intermediate',
  metrics: ['cdStrategy', 'zonejsPayload', 'nodesChecked', 'renderLatency'],
  legend: ['flow', ['async', 'Zone.js global tick'], ['bypass', 'pruned / outside Angular'], ['mark', 'markForCheck / Signal']],
  goals: [
    { text: 'Zone.js monkey-patching (150+ Web APIs) & top-down appRef.tick()', step: 1 },
    { text: 'Escaping Zone overhead: runOutsideAngular() & zone-flags.ts', step: 2 },
    { text: 'OnPush subtree pruning & Input reference identity (===)', step: 3 },
    { text: 'Internal events, AsyncPipe, markForCheck(), detectChanges() & detach()', step: 4 },
    { text: 'Dropping Zone.js (-35KB) & restoring native async/await stack traces', step: 5 },
    { text: 'Zoneless ChangeDetectionScheduler & microtask render coalescing', step: 6 },
    { text: 'Signal-driven targeted view notification & O(1) surgical render', step: 7 },
    { text: 'Enterprise Benchmark: Zone.js vs OnPush vs Zoneless (60fps)', step: 8 },
  ],
  steps: [
    {
      short: 'Zone.js Top-Down',
      chapter: 'concept',
      title: '1. Zone.js Monkey-Patching & Top-Down Dirty Checking',
      body: [
        'Historically, <code>Zone.js</code> monkey-patched 150+ async Web APIs (<code>setTimeout</code>, <code>addEventListener</code>, <code>Promise</code>). When the microtask queue drained, <code>NgZone</code> emitted <code>onMicrotaskEmpty</code>.',
        '<code>ApplicationRef.tick()</code> then walked the <b>entire component tree top-down</b>—checking all 500+ components even for a single button click.',
      ],
      callout: {
        kind: 'warning',
        text: 'Global top-down checking runs in O(N) time and adds ~35KB of Zone.js polyfill overhead.',
      },
      metrics: { cdStrategy: 'Zone.js Default', zonejsPayload: '+35 KB', nodesChecked: '500 / tick', renderLatency: '14.8 ms' },
      scene: {
        entities: {
          browserApi: y(-16, -6, { label: 'Web APIs', tags: [{ text: 'setTimeout', tone: 'blue', icon: 'zap' }] }),
          zonePatch: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['NgZone Patch'], sub: 'onMicrotask' }),
          appRefTick: d(8, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'package', label: ['appRef.tick()'], sub: 'walk 500 nodes' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Zone.js Top-Down Tick', [
            `this.ngZone.onMicrotaskEmpty.subscribe(() => {`,
            `  this.appRef.tick(); // Walks App -> Nav -> All 500 leaves!`,
            `});`,
          ], { icon: 'terminal' }),
        },
        links: {
          bz: h('browserApi', 'zonePatch', ['browserApi', 'zonePatch'], { label: 'intercept async' }),
          za: h('zonePatch', 'appRefTick', ['zonePatch', 'appRefTick'], { label: 'trigger tick()' }),
        },
        flows: [{ route: ['bz', 'za'], kind: 'async', rate: 1.5 }],
      },
    },
    {
      short: 'runOutside & Flags',
      chapter: 'technique',
      title: '2. Escaping Zone: runOutsideAngular & zone-flags.ts',
      body: [
        'For 60Hz <code>scroll</code> / <code>mousemove</code> / WebGL loops, wrap listeners in <code>ngZone.runOutsideAngular(() =&gt; ...)</code> so they bypass Zone and trigger <b>0 ticks</b>.',
        'You can also globally unpatch noisy events via <code>zone-flags.ts</code> (e.g. <code>__Zone_disable_requestAnimationFrame = true</code>) before importing <code>zone.js</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'When ready to update the UI after outside work, re-enter via ngZone.run(() => ...).',
      },
      changes: ['+ High-frequency listeners executed outside Angular', '+ zone-flags.ts disables noisy scroll/rAF patches'],
      metrics: { cdStrategy: 'Outside Angular', zonejsPayload: '+35 KB', nodesChecked: '0 (Bypassed)', renderLatency: '0 ms tick' },
      scene: {
        entities: {
          browserApi: y(-16, -6, { label: 'Scroll / rAF', tags: [{ text: '60Hz events', tone: 'cyan', icon: 'zap' }] }),
          zonePatch: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['runOutside'], sub: 'bypass Zone' }),
          leanDom: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Direct Canvas'], sub: '0 CD ticks' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'runOutsideAngular & zone-flags', [
            `this.ngZone.runOutsideAngular(() => {`,
            `  window.addEventListener('scroll', () => this.updateParallax());`,
            `});`,
            `// zone-flags.ts: __Zone_disable_requestAnimationFrame = true;`,
          ], { icon: 'terminal' }),
        },
        links: {
          bz: h('browserApi', 'zonePatch', ['browserApi', 'zonePatch'], { label: 'run outside' }),
          zl: h('zonePatch', 'leanDom', ['zonePatch', 'leanDom'], { label: 'direct paint' }),
        },
        flows: [{ route: ['bz', 'zl'], kind: 'bypass', rate: 1.5 }],
      },
    },
    {
      short: 'OnPush Pruning',
      chapter: 'execution',
      title: '3. OnPush Subtree Pruning & Input Identity (===)',
      body: [
        'Setting <code>changeDetection: ChangeDetectionStrategy.OnPush</code> turns a component into an isolated boundary: Angular <b>skips</b> the entire subtree unless notified.',
        'Trigger 1: An <code>@Input()</code> changes by <b>reference identity</b> (<code>newPtr !== oldPtr</code>). Mutating <code>user.name = \'Bob\'</code> in-place is ignored—use immutable spread <code>user = { ...user, name: \'Bob\' }</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'OnPush turns O(N) whole-tree scans into targeted O(log N) branch walks.',
      },
      changes: ['+ OnPush prunes unaffected subtrees', '+ Immutable input reference triggers targeted check'],
      metrics: { cdStrategy: 'OnPush', zonejsPayload: '+35 KB', nodesChecked: 'Active Branch', renderLatency: '3.2 ms' },
      scene: {
        entities: {
          rootComp: d(0, -12, { s: 5.0, h: 54, color: 'blue', glyph: 'boxes', label: ['AppComponent'], sub: 'root tick' }),
          branchDefault: d(-12, 0, { s: 4.8, h: 52, color: 'amber', glyph: 'boxes', label: ['Default Branch'], sub: 'always checked' }),
          branchOnPush: d(12, 0, { s: 4.8, h: 52, color: 'green', glyph: 'boxes', label: ['OnPush Branch'], sub: 'pruned unless ===' }),
          leafOnPush: b(12, 14, { s: 4.6, h: 48, color: 'slab', glyph: 'server', label: ['Child Views'], sub: 'skipped subtree' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'OnPush Immutable Input', [
            `@Component({ changeDetection: ChangeDetectionStrategy.OnPush })`,
            `// ❌ Mutating in-place: OnPush skips!`,
            `// ✅ New reference: this.user = { ...this.user, name: 'Bob' };`,
          ], { icon: 'terminal' }),
        },
        links: {
          rd: h('rootComp', 'branchDefault', ['rootComp', 'branchDefault'], { label: 'check default' }),
          ro: h('rootComp', 'branchOnPush', ['rootComp', 'branchOnPush'], { label: 'check ref ===' }),
          ol: h('branchOnPush', 'leafOnPush', ['branchOnPush', 'leafOnPush'], { label: 'prune clean' }),
        },
        flows: [
          { route: ['rd'], kind: 'async', rate: 1.5 },
          { route: ['ro', 'ol'], kind: 'bypass', rate: 1.2 },
        ],
      },
    },
    {
      short: 'markForCheck & detach',
      chapter: 'execution',
      title: '4. Internal Events, AsyncPipe, markForCheck() & detach()',
      body: [
        'Other OnPush triggers: (2) DOM events originating inside the subtree, (3) <code>AsyncPipe</code> emissions calling <code>markForCheck()</code>.',
        'For external WebSockets/timers, inject <code>ChangeDetectorRef</code>: <code>markForCheck()</code> schedules the next tick; <code>detectChanges()</code> runs synchronously; <code>detach()</code> disconnects a 60Hz canvas completely.',
      ],
      callout: {
        kind: 'tip',
        text: 'Prefer markForCheck() over detectChanges() to avoid synchronous DOM thrashing.',
      },
      changes: ['+ AsyncPipe & internal events mark dirty path upward', '+ cdr.detach() isolates custom 60Hz loops'],
      metrics: { cdStrategy: 'OnPush + CDR', zonejsPayload: '+35 KB', nodesChecked: 'Marked Path', renderLatency: '2.1 ms' },
      scene: {
        entities: {
          rootComp: d(0, -12, { s: 5.0, h: 54, color: 'blue', glyph: 'boxes', label: ['AppComponent'], sub: 'ancestor path' }),
          branchOnPush: d(12, 0, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['AsyncPipe / CDR'], sub: 'markForCheck' }),
          leafOnPush: b(12, 14, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['OnPush View'], sub: 'updated leaf' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'ChangeDetectorRef API', [
            `this.cdr.markForCheck();  // Async coalesced (Recommended)`,
            `this.cdr.detectChanges(); // Synchronous immediate check`,
            `this.cdr.detach();        // Disconnect from CD tree`,
          ], { icon: 'terminal' }),
        },
        links: {
          bc: h('branchOnPush', 'rootComp', ['branchOnPush', 'rootComp'], { label: 'mark path dirty' }),
          bl: h('branchOnPush', 'leafOnPush', ['branchOnPush', 'leafOnPush'], { label: 'update template' }),
        },
        flows: [{ route: ['bc', 'bl'], kind: 'mark', rate: 1.5 }],
      },
    },
    {
      short: 'Dropping Zone.js',
      chapter: 'technique',
      title: '5. Dropping Zone.js (-35KB) & Native Async/Await',
      body: [
        'Adding <code>provideExperimentalZonelessChangeDetection()</code> lets you delete <code>zone.js</code> from <code>angular.json</code> polyfills completely.',
        'Bundle size drops by <b>~35KB</b>, 150+ browser APIs are no longer monkey-patched, and Chrome DevTools displays pristine native <code>async/await</code> stack traces without 30 lines of <code>zone.js</code> noise.',
      ],
      callout: {
        kind: 'insight',
        text: 'Zoneless removes 10 years of monkey-patched baggage and restores native V8 Promise debugging.',
      },
      changes: ['+ zone.js polyfill removed (-35KB bundle)', '+ Native async/await stack traces restored'],
      metrics: { cdStrategy: 'Zoneless', zonejsPayload: '0 KB (Removed)', nodesChecked: 'On-Demand', renderLatency: 'Native JS' },
      scene: {
        entities: {
          appConfig: y(-16, -6, { label: 'app.config.ts', tags: [{ text: 'Zoneless Mode', tone: 'green', icon: 'zap' }] }),
          droppedPoly: d(-4, -6, { s: 4.8, h: 52, color: 'rose', glyph: 'boxes', label: ['zone.js Dropped'], sub: 'no polyfill' }),
          leanBundle: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['Native Runtime'], sub: '-35KB bundle' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Zoneless Bootstrap', [
            `export const appConfig: ApplicationConfig = {`,
            `  providers: [provideExperimentalZonelessChangeDetection()]`,
            `};`,
            `// Remove 'zone.js' from angular.json polyfills!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ad: h('appConfig', 'droppedPoly', ['appConfig', 'droppedPoly'], { label: 'drop polyfill' }),
          dl: h('droppedPoly', 'leanBundle', ['droppedPoly', 'leanBundle'], { label: 'native Promises' }),
        },
        flows: [{ route: ['ad', 'dl'], kind: 'mark', rate: 1.5 }],
      },
    },
    {
      short: 'CD Scheduler',
      chapter: 'execution',
      title: '6. Zoneless ChangeDetectionScheduler & Coalescing',
      body: [
        'Without Zone.js, Angular introduces the <b>ChangeDetectionScheduler</b>.',
        'Whenever a Signal updates, an input changes, or a template event fires, the scheduler coalesces multiple synchronous mutations into a <b>single</b> microtask / animation frame render pass.',
      ],
      callout: {
        kind: 'tip',
        text: 'Updating 10 signals in a row triggers only ONE coalesced render pass.',
      },
      changes: ['+ ChangeDetectionScheduler replaces NgZone tick', '+ Rapid mutations coalesced into 1 microtask pass'],
      metrics: { cdStrategy: 'Zoneless', zonejsPayload: '0 KB', nodesChecked: 'Coalesced', renderLatency: '0.3 ms' },
      scene: {
        entities: {
          appConfig: y(-16, -6, { label: 'count.set(5)', tags: [{ text: 'Signal Mutate', tone: 'blue', icon: 'zap' }] }),
          cdScheduler: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['CD Scheduler'], sub: 'coalesce tick' }),
          renderTick: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['1 Render Pass'], sub: 'microtask' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Scheduler Coalescing', [
            `count.set(1); count.set(2); count.set(3);`,
            `// Coalesced into 1 queueMicrotask:`,
            `queueMicrotask(() => renderDirtyViews());`,
          ], { icon: 'terminal' }),
        },
        links: {
          ac: h('appConfig', 'cdScheduler', ['appConfig', 'cdScheduler'], { label: 'notify mutation' }),
          cr: h('cdScheduler', 'renderTick', ['cdScheduler', 'renderTick'], { label: 'coalesce pass' }),
        },
        flows: [{ route: ['ac', 'cr'], kind: 'mark', rate: 1.5 }],
      },
    },
    {
      short: 'Targeted Signal',
      chapter: 'execution',
      title: '7. Targeted Signal Notification & O(1) Surgical Render',
      body: [
        'When a template reads <code>{{ userName() }}</code>, that view’s <code>LView</code> registers as a reactive consumer.',
        'Calling <code>userName.set(\'Alice\')</code> notifies <b>only that component view</b>—skipping 499 clean components and mutating the DOM in ~0.2ms.',
      ],
      callout: {
        kind: 'insight',
        text: 'Signals + Zoneless deliver Solid.js-grade pinpoint DOM updates inside Angular.',
      },
      changes: ['+ Signal notifies target LView directly', '+ 499 unaffected views completely bypassed'],
      metrics: { cdStrategy: 'Zoneless + Signals', zonejsPayload: '0 KB', nodesChecked: '1 Component', renderLatency: '0.2 ms' },
      scene: {
        entities: {
          cdScheduler: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['CD Scheduler'], sub: 'O(1) target' }),
          renderTick: d(8, -6, { s: 4.8, h: 52, color: 'green', glyph: 'package', label: ['Dirty View'], sub: '1 node check' }),
          cleanDom: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['DOM Mutated'], sub: '0.2ms update' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Surgical O(1) Render', [
            `// Zone.js:   500 components checked -> 14.8 ms`,
            `// Zoneless:    1 component checked  ->  0.2 ms (-98% CPU!)`,
          ], { icon: 'terminal' }),
        },
        links: {
          cr: h('cdScheduler', 'renderTick', ['cdScheduler', 'renderTick'], { label: 'traverse dirty' }),
          rc: h('renderTick', 'cleanDom', ['renderTick', 'cleanDom'], { label: 'mutate DOM' }),
        },
        flows: [{ route: ['cr', 'rc'], kind: 'mark', rate: 1.6 }],
      },
    },
    {
      short: 'Benchmark',
      chapter: 'scaling',
      title: '8. Enterprise Benchmark: Zone.js vs OnPush vs Zoneless',
      body: [
        'On a 10,000-row real-time dashboard, migrating from Zone.js Default $\\rightarrow$ OnPush $\\rightarrow$ <b>Zoneless + Signals</b> eliminates bundle bloat (-35KB), cuts memory heap by 38%, and locks 60fps under heavy churn.',
      ],
      callout: {
        kind: 'tip',
        text: 'Zoneless + Signals is the recommended target architecture for all modern Angular apps.',
      },
      changes: ['+ 80% CPU reduction under high-frequency streams', '+ 60fps rock-solid stability'],
      metrics: { cdStrategy: 'Zoneless Peak', zonejsPayload: '0 KB', nodesChecked: 'Surgical Only', renderLatency: '60 FPS Locked' },
      scene: {
        entities: {
          appConfig: y(-16, -6, { label: '10k Rows Grid', tags: [{ text: 'High Churn', tone: 'purple', icon: 'zap' }] }),
          cdScheduler: d(-4, -6, { s: 4.8, h: 52, color: 'green', glyph: 'cpu', label: ['Zoneless Core'], sub: 'targeted CD' }),
          cleanDom: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['60 FPS Locked'], sub: '-80% CPU' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Performance Benchmark', [
            `Metric       | Zone.js   | OnPush   | Zoneless (Signals)`,
            `-------------+-----------+----------+-------------------`,
            `Polyfill     | +35 KB    | +35 KB   | 0 KB (Removed)`,
            `10k-row Tick | 42.5 ms   | 8.4 ms   | 1.2 ms (Instant)`,
            `FPS          | 24-45 fps | 55 fps   | 60 fps rock-solid`,
          ], { icon: 'terminal' }),
        },
        links: {
          ac: h('appConfig', 'cdScheduler', ['appConfig', 'cdScheduler'], { label: 'stream deltas' }),
          cl: h('cdScheduler', 'cleanDom', ['cdScheduler', 'cleanDom'], { label: 'render 60fps' }),
        },
        flows: [{ route: ['ac', 'cl'], kind: 'mark', rate: 1.6 }],
      },
    },
  ],
};
