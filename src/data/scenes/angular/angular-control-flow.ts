// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const angularControlFlowLesson = {
  id: 'angular-control-flow',
  title: 'Modern Template Engine: Control Flow, @defer & Pipes',
  summary: 'Master modern Angular templates: built-in @if type narrowing, @for mandatory track & @empty, @switch jump tables, Pure vs Impure Pipe === memoization & AsyncPipe, and @defer code-splitting with viewport/hover/idle triggers & prefetching.',
  minutes: 35,
  level: 'intermediate',
  metrics: ['templateFeature', 'directiveOverhead', 'memoization', 'chunkStrategy'],
  legend: ['flow', ['template', 'compiled template op'], ['track', 'DOM reuse / memo hit'], ['chunk', 'deferred chunk load']],
  goals: [
    { text: 'Built-in @if & TypeScript type narrowing (@if (user(); as u))', step: 1 },
    { text: 'Built-in @for with mandatory track expression & @empty block', step: 2 },
    { text: '@switch jump table & automated CLI control-flow migration', step: 3 },
    { text: 'Pure Pipes (=== memoization) & the Array Mutation trap', step: 4 },
    { text: 'Impure Pipes cost vs AsyncPipe & computed() Signals', step: 5 },
    { text: '@defer code-splitting, @placeholder & @loading flicker timers', step: 6 },
    { text: '@defer triggers: on viewport, on interaction, on hover & on idle', step: 7 },
    { text: 'Optimistic prefetching: @defer (on interaction; prefetch on idle)', step: 8 },
  ],
  steps: [
    {
      short: '@if & Narrowing',
      chapter: 'concept',
      title: '1. Built-in @if & Template Type Narrowing',
      body: [
        'Built-in <code>@if</code> replaces <code>*ngIf</code> without importing <code>CommonModule</code> or creating <code>&lt;ng-template&gt;</code> wrappers—compiling straight into lightweight <code>ɵɵconditional</code> Ivy instructions.',
        'With <code>@if (user(); as u)</code>, TypeScript automatically narrows <code>User | null</code> to non-null <code>User</code> inside the block.',
      ],
      callout: {
        kind: 'insight',
        text: 'Built-in control flow eliminates structural directive allocation overhead at runtime.',
      },
      metrics: { templateFeature: '@if Narrowing', directiveOverhead: '0 (Built-in)', memoization: 'Type Safe', chunkStrategy: 'Inline' },
      scene: {
        entities: {
          templateSrc: y(-16, -6, { label: '@if (user())', tags: [{ text: 'User | null', tone: 'blue', icon: 'zap' }] }),
          ivyCompiler: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Ivy Compiler'], sub: 'type narrowing' }),
          domTarget: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Safe u.email'], sub: 'narrowed User' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Built-in @if & Type Narrowing', [
            `@if (currentUser(); as u) {`,
            `  <h1>{{ u.name }}</h1> // Narrowed to User!`,
            `} @else {`,
            `  <p>Please log in.</p>`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          ti: h('templateSrc', 'ivyCompiler', ['templateSrc', 'ivyCompiler'], { label: 'compile @if' }),
          id: h('ivyCompiler', 'domTarget', ['ivyCompiler', 'domTarget'], { label: 'render branch' }),
        },
        flows: [{ route: ['ti', 'id'], kind: 'template', rate: 1.5 }],
      },
    },
    {
      short: '@for track & @empty',
      chapter: 'execution',
      title: '2. Built-in @for Mandatory track & @empty Block',
      body: [
        'In <code>@for (item of items(); track item.id)</code>, the <code>track</code> expression is <b>mandatory</b>! Angular matches keys by identity to move and reuse existing DOM elements instead of destroying/recreating them.',
        'The integrated <code>@empty</code> block declaratively renders empty states without extra <code>*ngIf="items.length === 0"</code> checks.',
      ],
      callout: {
        kind: 'warning',
        text: 'Avoid track $index for dynamic lists that reorder or filter; always track a unique ID like item.id.',
      },
      changes: ['+ Mandatory track key recycles existing DOM nodes', '+ Declarative @empty block renders when list is empty'],
      metrics: { templateFeature: '@for + @empty', directiveOverhead: '0', memoization: 'track item.id', chunkStrategy: 'DOM Recycled' },
      scene: {
        entities: {
          templateSrc: y(-16, -6, { label: 'items()', tags: [{ text: 'track item.id', tone: 'amber', icon: 'zap' }] }),
          ivyCompiler: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['@for Diff'], sub: 'key matching' }),
          domTarget: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Recycled DOM'], sub: 'moved in place' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, '@for track & @empty', [
            `@for (item of items(); track item.id) {`,
            `  <app-row [item]="item" />`,
            `} @empty {`,
            `  <p>No items found.</p>`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          ti: h('templateSrc', 'ivyCompiler', ['templateSrc', 'ivyCompiler'], { label: 'diff keys' }),
          id: h('ivyCompiler', 'domTarget', ['ivyCompiler', 'domTarget'], { label: 'reuse DOM' }),
        },
        flows: [{ route: ['ti', 'id'], kind: 'track', rate: 1.5 }],
      },
    },
    {
      short: '@switch & CLI',
      chapter: 'execution',
      title: '3. @switch Jump Table & CLI Control-Flow Migration',
      body: [
        'Built-in <code>@switch</code> / <code>@case</code> / <code>@default</code> compiles into a fast indexed jump table with strict type checking.',
        'Migrate entire legacy codebases automatically via <code>ng generate @angular/core:control-flow</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Run ng generate @angular/core:control-flow --dry-run to preview template upgrades safely.',
      },
      changes: ['+ @switch compiles to indexed jump table', '+ CLI schematic automates *ngIf/*ngFor migration'],
      metrics: { templateFeature: '@switch', directiveOverhead: '0', memoization: 'Jump Table', chunkStrategy: 'CLI Migrated' },
      scene: {
        entities: {
          templateSrc: y(-16, -6, { label: 'status()', tags: [{ text: '@switch', tone: 'cyan', icon: 'zap' }] }),
          ivyCompiler: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['Jump Table'], sub: '@case match' }),
          domTarget: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Active Badge'], sub: '0 wrapper DOM' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, '@switch Syntax & CLI', [
            `@switch (status()) {`,
            `  @case ('active') { <badge color="green" /> }`,
            `  @default         { <badge color="gray" /> }`,
            `}`,
            `// CLI: ng generate @angular/core:control-flow`,
          ], { icon: 'terminal' }),
        },
        links: {
          ti: h('templateSrc', 'ivyCompiler', ['templateSrc', 'ivyCompiler'], { label: 'eval switch' }),
          id: h('ivyCompiler', 'domTarget', ['ivyCompiler', 'domTarget'], { label: 'mount @case' }),
        },
        flows: [{ route: ['ti', 'id'], kind: 'template', rate: 1.5 }],
      },
    },
    {
      short: 'Pure Pipes & ===',
      chapter: 'technique',
      title: '4. Pure Pipes (=== Memoization) & Array Mutation Trap',
      body: [
        'By default, <code>@Pipe({ pure: true })</code> memoizes results by <b>reference identity</b> (<code>===</code>). If inputs don’t change, <code>transform()</code> is skipped completely.',
        '<b>The Mutation Trap:</b> Calling <code>items.push(x)</code> keeps the same array pointer, so a pure pipe won’t update! Always create a new reference: <code>items = [...items, x]</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Pure pipes are O(1) cache hits when immutable data patterns are used.',
      },
      changes: ['+ Pure pipe skips transform() on === cache hit', '+ Immutable array spread fixes stale pipe bug'],
      metrics: { templateFeature: 'Pure Pipe', directiveOverhead: '0 (Cached)', memoization: '=== Identity', chunkStrategy: 'Cache Hit' },
      scene: {
        entities: {
          templateSrc: y(-16, -6, { label: 'price: 150', tags: [{ text: '=== Check', tone: 'blue', icon: 'zap' }] }),
          pipeEngine: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['Pure Pipe'], sub: '=== identity' }),
          memoCache: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['$150.00 Cache'], sub: 'memo hit' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Pure Pipe & Immutability', [
            `// ❌ In-place mutation: pure pipe skips!`,
            `this.items.push(newItem);`,
            `// ✅ New reference: pure pipe re-runs!`,
            `this.items = [...this.items, newItem];`,
          ], { icon: 'terminal' }),
        },
        links: {
          tp: h('templateSrc', 'pipeEngine', ['templateSrc', 'pipeEngine'], { label: 'compare ===' }),
          pm: h('pipeEngine', 'memoCache', ['pipeEngine', 'memoCache'], { label: 'return cached' }),
        },
        flows: [{ route: ['tp', 'pm'], kind: 'track', rate: 1.5 }],
      },
    },
    {
      short: 'Impure vs AsyncPipe',
      chapter: 'technique',
      title: '5. Impure Pipes Cost vs AsyncPipe & computed()',
      body: [
        'Setting <code>pure: false</code> disables caching—executing <code>transform()</code> on <b>every tick</b> for every list item (severe FPS drop).',
        'Reserve stateful pipes for <code>AsyncPipe</code> (auto-subscribes, calls <code>markForCheck()</code>, auto-unsubscribes on destroy), and move heavy filtering/sorting into <code>computed()</code> Signals!',
      ],
      callout: {
        kind: 'warning',
        text: 'Replace impure filter/sort pipes with computed() signals to cut template CPU usage by up to 95%.',
      },
      changes: ['+ Heavy logic moved from impure pipe to computed()', '+ AsyncPipe handles Observable subscriptions leak-free'],
      metrics: { templateFeature: 'AsyncPipe / computed', directiveOverhead: 'Minimal', memoization: 'DAG Memoized', chunkStrategy: '60 FPS Clean' },
      scene: {
        entities: {
          templateSrc: y(-16, -6, { label: 'user$ / sig', tags: [{ text: 'Reactive', tone: 'purple', icon: 'zap' }] }),
          pipeEngine: d(-4, -6, { s: 4.8, h: 52, color: 'green', glyph: 'cpu', label: ['AsyncPipe /', 'computed()'], sub: 'lazy + cleanup' }),
          domTarget: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['60 FPS DOM'], sub: 'zero leak' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'AsyncPipe & computed()', [
            `@if (user$ | async; as u) { <h1>{{ u.name }}</h1> }`,
            `// Or with Signals:`,
            `filtered = computed(() => items().filter(i => i.active));`,
          ], { icon: 'terminal' }),
        },
        links: {
          tp: h('templateSrc', 'pipeEngine', ['templateSrc', 'pipeEngine'], { label: 'emit / pull' }),
          pd: h('pipeEngine', 'domTarget', ['pipeEngine', 'domTarget'], { label: 'update view' }),
        },
        flows: [{ route: ['tp', 'pd'], kind: 'track', rate: 1.5 }],
      },
    },
    {
      short: '@defer & Timers',
      chapter: 'execution',
      title: '6. @defer Code-Splitting, @placeholder & @loading Timers',
      body: [
        '<code>@defer</code> automatically extracts heavy child components into separate lazy JS chunks right from the HTML template.',
        'Pair with <code>@placeholder (minimum 300ms)</code> (prevents CLS layout shift) and <code>@loading (after 100ms; minimum 500ms)</code> so fast loads never flash a spinner.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always size @placeholder to match the deferred component height to keep CLS = 0.',
      },
      changes: ['+ Compiler splits @defer block into separate lazy chunk', '+ @loading flicker guards armed'],
      metrics: { templateFeature: '@defer Split', directiveOverhead: '0', memoization: 'CLS Protected', chunkStrategy: 'Code-Split' },
      scene: {
        entities: {
          templateSrc: y(-16, -6, { label: 'main.js', tags: [{ text: '@placeholder', tone: 'slab', icon: 'zap' }] }),
          deferHub: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['@defer Guard'], sub: 'after 100ms' }),
          lazyChunk: b(8, -6, { s: 4.6, h: 48, color: 'cyan', glyph: 'database', label: ['chart.chunk.js'], sub: 'lazy chunk' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, '@defer + Flicker Guards', [
            `@defer {`,
            `  <app-heavy-chart />`,
            `} @loading (after 100ms; minimum 500ms) {`,
            `  <app-spinner />`,
            `} @placeholder (minimum 300ms) { <div class="skel"></div> }`,
          ], { icon: 'terminal' }),
        },
        links: {
          td: h('templateSrc', 'deferHub', ['templateSrc', 'deferHub'], { label: 'render skeleton' }),
          dl: h('deferHub', 'lazyChunk', ['deferHub', 'lazyChunk'], { label: 'emit chunk' }),
        },
        flows: [{ route: ['td', 'dl'], kind: 'chunk', rate: 1.5 }],
      },
    },
    {
      short: '@defer Triggers',
      chapter: 'execution',
      title: '7. Triggers: on viewport, on interaction, on hover & on idle',
      body: [
        '• <b><code>on viewport</code></b>: Attaches <code>IntersectionObserver</code>—loads when scrolled into view.<br>' +
        '• <b><code>on interaction</code> / <code>on hover(btn)</code></b>: Loads on user intent.<br>' +
        '• <b><code>on idle</code></b> (default): Uses <code>requestIdleCallback()</code> during browser CPU downtime.',
      ],
      callout: {
        kind: 'insight',
        text: 'on hover(triggerBtn) starts downloading a modal or tooltip chunk before the user even clicks!',
      },
      changes: ['+ IntersectionObserver & idle triggers configured'],
      metrics: { templateFeature: '@defer Triggers', directiveOverhead: '0', memoization: 'Intent-Driven', chunkStrategy: 'On-Demand' },
      scene: {
        entities: {
          templateSrc: y(-16, -6, { label: 'User Scroll', tags: [{ text: 'on viewport', tone: 'blue', icon: 'zap' }] }),
          deferHub: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['Observer /', 'Idle Trigger'], sub: 'trigger fired' }),
          lazyChunk: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['Fetch Chunk'], sub: 'downloading' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Declarative @defer Triggers', [
            `@defer (on viewport)         { <app-comments /> }`,
            `@defer (on hover(infoBtn))   { <app-tooltip /> }`,
            `@defer (on idle)             { <app-analytics /> }`,
          ], { icon: 'terminal' }),
        },
        links: {
          td: h('templateSrc', 'deferHub', ['templateSrc', 'deferHub'], { label: 'trigger event' }),
          dl: h('deferHub', 'lazyChunk', ['deferHub', 'lazyChunk'], { label: 'fetch chunk' }),
        },
        flows: [{ route: ['td', 'dl'], kind: 'chunk', rate: 1.5 }],
      },
    },
    {
      short: 'Optimistic Prefetch',
      chapter: 'scaling',
      title: '8. Optimistic Prefetching: prefetch on idle; on interaction',
      body: [
        'Combine lazy instantiation with background prefetching: <code>@defer (on interaction; prefetch on idle)</code>.',
        'The browser silently caches the JS chunk during idle time, so when the user clicks, the component mounts in <b>0ms</b> with zero loading spinner!',
      ],
      callout: {
        kind: 'tip',
        text: 'prefetch on idle + on interaction delivers instant UX without bloating initial page load.',
      },
      changes: ['+ Chunk prefetched silently during browser idle', '+ 0ms instant hydration upon user click'],
      metrics: { templateFeature: 'Prefetch + @defer', directiveOverhead: '0', memoization: 'HTTP Cached', chunkStrategy: '0ms Instant' },
      scene: {
        entities: {
          templateSrc: y(-16, -6, { label: 'prefetch idle', tags: [{ text: 'Pre-cache', tone: 'cyan', icon: 'zap' }] }),
          deferHub: d(-4, -6, { s: 4.8, h: 52, color: 'green', glyph: 'boxes', label: ['Memory Cache'], sub: 'HTTP cached' }),
          domTarget: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['0ms Dialog'], sub: 'instant mount' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Optimistic Prefetch Pattern', [
            `@defer (on interaction; prefetch on idle) {`,
            `  <app-dialog-content />`,
            `} @placeholder { <button>Open Dialog</button> }`,
          ], { icon: 'terminal' }),
        },
        links: {
          td: h('templateSrc', 'deferHub', ['templateSrc', 'deferHub'], { label: 'prefetch JS' }),
          do: h('deferHub', 'domTarget', ['deferHub', 'domTarget'], { label: '0ms mount' }),
        },
        flows: [{ route: ['td', 'do'], kind: 'chunk', rate: 1.6 }],
      },
    },
  ],
};
