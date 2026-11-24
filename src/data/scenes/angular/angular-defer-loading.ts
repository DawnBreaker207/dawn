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

export const angularDeferLoadingLesson = {
  id: 'angular-defer-loading',
  title: 'Deferred Loading Architecture (@defer, @placeholder, @loading)',
  summary: 'Master template-level deferred loading with @defer. Explore automatic code-splitting, custom trigger conditions (on viewport, idle, interaction, hover), and optimistic prefetching.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['deferState', 'activeTrigger', 'chunkStatus', 'prefetchStrategy'],
  legend: ['flow', ['trigger', 'trigger event evaluation'], ['chunk', 'lazy chunk load'], ['placeholder', 'skeleton state'], ['hydrate', 'component activation']],
  goals: [
    { text: 'Declarative lazy loading with @defer, @placeholder, and @loading', step: 1 },
    { text: 'Preventing UI flicker: minimum and after duration timers', step: 2 },
    { text: 'Viewport trigger: lazy loading on scroll via IntersectionObserver', step: 3 },
    { text: 'Interaction and hover triggers: loading on user intent', step: 4 },
    { text: 'Idle trigger: offloading non-critical chunks to requestIdleCallback', step: 5 },
    { text: 'Optimistic prefetching: prefetch on idle; on interaction', step: 6 },
  ],
  steps: [
    {
      short: 'Defer Blocks',
      chapter: 'concept',
      title: 'Declarative Code-Splitting with @defer',
      body: [
        'Before <code>@defer</code>, lazy loading components required complex dynamic imports (<code>import().then(...)</code>) and manual <code>ViewContainerRef.createComponent()</code> code.',
        'With <code>@defer</code>, the Angular compiler automatically extracts all dependencies within the block into an isolated JavaScript chunk loaded on demand.',
      ],
      callout: {
        kind: 'insight',
        text: 'The deferred chunk is only downloaded over the network when the trigger condition is met.',
      },
      metrics: { deferState: 'Initial (Idle)', activeTrigger: 'Declared', chunkStatus: 'Chunk Split', prefetchStrategy: 'On demand' },
      scene: {
        entities: {
          mainBundle: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['main.js (Page)'], sub: 'initial page load' }),
          deferSplitter: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['@defer Compiler'], sub: 'extracts chunk split' }),
          lazyChunkFile: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['comments.chunk.js'], sub: 'deferred download' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Declarative @defer Syntax', [
            `@defer {`,
            `  <app-comments-section [postId]="post.id" />`,
            `} @placeholder {`,
            `  <p>Comments placeholder...</p>`,
            `}`,
            `// Angular compiler automatically extracts app-comments-section`,
            `// and all its dependencies into an independent chunk!`,
          ], { icon: 'terminal' }),
          zDefer: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'DECLARATIVE CODE-SPLITTING ENGINE'),
        },
        links: {
          md: h('mainBundle', 'deferSplitter', ['mainBundle', 'deferSplitter'], { label: 'split dependencies' }),
          dl: h('deferSplitter', 'lazyChunkFile', ['deferSplitter', 'lazyChunkFile'], { label: 'emit deferred chunk' }),
        },
        flows: [{ route: ['md', 'dl'], kind: 'chunk', rate: 1.5 }],
      },
    },
    {
      short: 'Flicker Guards',
      chapter: 'setup',
      title: 'Preventing UI Flicker: @placeholder & @loading Timers',
      body: [
        'If a chunk loads in 50ms, showing a loading spinner causes an ugly 50ms visual flash (flicker).',
        '<code>@loading (after 100ms; minimum 500ms)</code> solves this! The spinner only appears if loading takes longer than 100ms, and once shown, stays for at least 500ms to guarantee a smooth animation.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always provide a @placeholder with equal dimensions to avoid Cumulative Layout Shift (CLS) when content loads.',
      },
      changes: ['+ Skeleton placeholder rendered initially', '+ Loading timers prevent sub-100ms visual spinner flashes'],
      metrics: { deferState: 'Placeholder Active', activeTrigger: 'Waiting', chunkStatus: 'Pending', prefetchStrategy: 'CLS Protected' },
      scene: {
        entities: {
          placeholderView: d(-10, -18, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['@placeholder'], sub: 'skeleton placeholder' }),
          timerGuard: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'cpu', label: ['Timer Guard'], sub: 'after 100ms; minimum 500ms' }),
          loadingSpinner: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'package', label: ['@loading State'], sub: 'smooth flicker-free spinner' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, '@placeholder & @loading Timers', [
            `@defer {`,
            `  <app-heavy-chart />`,
            `} @loading (after 100ms; minimum 500ms) {`,
            `  <app-spinner /> // Only shown if network > 100ms!`,
            `} @placeholder (minimum 300ms) {`,
            `  <div class="skeleton-box"></div>`,
            `}`,
          ], { icon: 'terminal' }),
          zDefer: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'PLACEHOLDER & LOADING FLICKER GUARDS'),
        },
        links: {
          pt: h('placeholderView', 'timerGuard', ['placeholderView', 'timerGuard'], { label: 'init skeleton' }),
          tl: h('timerGuard', 'loadingSpinner', ['timerGuard', 'loadingSpinner'], { label: 'gate spinner duration' }),
        },
        flows: [{ route: ['pt', 'tl'], kind: 'placeholder', rate: 1.5 }],
      },
    },
    {
      short: 'on viewport',
      chapter: 'execution',
      title: 'Trigger: on viewport (Scroll-Driven Lazy Loading)',
      body: [
        '<code>@defer (on viewport)</code> instructs Angular to attach an <code>IntersectionObserver</code> to the placeholder element.',
        'When the user scrolls the page and the placeholder enters the browser viewport, Angular immediately triggers the network request to fetch the chunk.',
      ],
      callout: {
        kind: 'insight',
        text: 'This is ideal for below-the-fold content: comments, footers, and complex widgets that users might never scroll to.',
      },
      changes: ['+ IntersectionObserver monitors placeholder', '+ Scrolling into view downloads chunk automatically'],
      metrics: { deferState: 'Viewport Triggered', activeTrigger: 'on viewport', chunkStatus: 'Downloading', prefetchStrategy: 'Scroll-linked' },
      scene: {
        entities: {
          userScroll: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['User Scrolls Down'], sub: 'page scroll event' }),
          observerApi: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['Intersection', 'Observer'], sub: 'placeholder enters viewport' }),
          chunkFetch: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Fetch Chunk'], sub: 'GET comments.chunk.js' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'on viewport Implementation', [
            `@defer (on viewport) {`,
            `  <app-comment-thread />`,
            `} @placeholder {`,
            `  <div style="height: 300px">Loading comments on scroll...</div>`,
            `}`,
            `// Zero network bytes consumed until scrolled into view!`,
          ], { icon: 'terminal' }),
          zDefer: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'VIEWPORT INTERSECTION OBSERVER TRIGGER'),
        },
        links: {
          uo: h('userScroll', 'observerApi', ['userScroll', 'observerApi'], { label: 'scroll intersects' }),
          oc: h('observerApi', 'chunkFetch', ['observerApi', 'chunkFetch'], { label: 'download JS chunk' }),
        },
        flows: [{ route: ['uo', 'oc'], kind: 'trigger', rate: 1.5 }],
      },
    },
    {
      short: 'on interaction',
      chapter: 'execution',
      title: 'Trigger: on interaction & on hover',
      body: [
        '<code>@defer (on interaction)</code>: Triggers when the user clicks or focuses the placeholder.',
        '<code>@defer (on hover)</code>: Triggers when the user hovers their mouse over the placeholder or a designated trigger element (<code>on hover(buttonRef)</code>).',
      ],
      callout: {
        kind: 'tip',
        text: 'Target an external element with on hover(triggerBtn) to load a modal or dropdown before the user clicks it!',
      },
      changes: ['+ User hovers over button', '+ Deferred modal component downloaded proactively'],
      metrics: { deferState: 'Hover Triggered', activeTrigger: 'on hover(triggerBtn)', chunkStatus: 'Downloaded', prefetchStrategy: 'Pre-click' },
      scene: {
        entities: {
          mouseHover: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['mouseenter event'], sub: 'user hovers trigger' }),
          hoverTrigger: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['on hover(btn)'], sub: 'fires load on hover' }),
          hydratedComponent: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Dropdown Ready'], sub: 'instant click response' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'on hover Trigger Syntax', [
            `<button #infoBtn>Details</button>`,
            ``,
            `@defer (on hover(infoBtn)) {`,
            `  <app-user-details-tooltip />`,
            `} @placeholder {`,
            `  <span>Hover to preview</span>`,
            `}`,
          ], { icon: 'terminal' }),
          zDefer: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'INTERACTION & HOVER TRIGGER PIPELINE'),
        },
        links: {
          mh: h('mouseHover', 'hoverTrigger', ['mouseHover', 'hoverTrigger'], { label: 'user intent' }),
          hh: h('hoverTrigger', 'hydratedComponent', ['hoverTrigger', 'hydratedComponent'], { label: 'mount component' }),
        },
        flows: [{ route: ['mh', 'hh'], kind: 'trigger', rate: 1.5 }],
      },
    },
    {
      short: 'on idle',
      chapter: 'technique',
      title: 'Trigger: on idle (requestIdleCallback)',
      body: [
        '<code>@defer (on idle)</code> is the default trigger if none is specified.',
        'It waits until the main thread finishes high-priority rendering, then uses the browser’s <code>requestIdleCallback()</code> to load the deferred chunk during CPU downtime.',
      ],
      callout: {
        kind: 'insight',
        text: 'on idle guarantees that deferred code loading never competes with initial page rendering or user input responsiveness.',
      },
      changes: ['+ requestIdleCallback waits for main thread lull', '+ Chunk downloaded with zero frame drops'],
      metrics: { deferState: 'Idle Triggered', activeTrigger: 'on idle', chunkStatus: 'Downloaded (Idle)', prefetchStrategy: 'Background' },
      scene: {
        entities: {
          mainThreadLull: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['requestIdleCallback'], sub: 'CPU idle period' }),
          idleScheduler: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['Idle Scheduler'], sub: 'executes in idle slot' }),
          backgroundLoad: d(10, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'package', label: ['Silent Download'], sub: 'zero main-thread blocking' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'on idle Execution', [
            `@defer (on idle) {`,
            `  <app-analytics-graph />`,
            `}`,
            `// Browser executes in background during requestIdleCallback:`,
            `window.requestIdleCallback(() => {`,
            `  import('./analytics-graph.chunk.js');`,
            `});`,
          ], { icon: 'terminal' }),
          zDefer: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'IDLE CALLBACK SCHEDULING PIPELINE'),
        },
        links: {
          mi: h('mainThreadLull', 'idleScheduler', ['mainThreadLull', 'idleScheduler'], { label: 'browser idle' }),
          ib: h('idleScheduler', 'backgroundLoad', ['idleScheduler', 'backgroundLoad'], { label: 'download background chunk' }),
        },
        flows: [{ route: ['mi', 'ib'], kind: 'chunk', rate: 1.5 }],
      },
    },
    {
      short: 'Optimistic Prefetch',
      chapter: 'scaling',
      title: 'Optimistic Prefetching: prefetch on idle',
      body: [
        'The ultimate performance pattern: combine <b>lazy rendering</b> with <b>background prefetching</b>!',
        'Syntax: <code>@defer (on interaction; prefetch on idle)</code>. The JS chunk is downloaded silently in the background while idle, but the component is NOT rendered or instantiated until the user actually clicks!',
      ],
      callout: {
        kind: 'tip',
        text: 'When the user clicks, the component renders instantly (0ms network delay) because the chunk is already cached in browser memory.',
      },
      changes: ['+ Chunk pre-fetched silently during idle time', '+ Component mounts with 0ms latency upon click'],
      metrics: { deferState: 'Hydrated (Instant)', activeTrigger: 'on interaction', chunkStatus: 'Prefetched', prefetchStrategy: 'Prefetch on idle' },
      scene: {
        entities: {
          prefetchIdle: d(-10, -18, { s: 4.8, h: 50, color: 'cyan', glyph: 'terminal', label: ['prefetch on idle'], sub: 'silent background download' }),
          cachedChunk: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'boxes', label: ['Memory Cache'], sub: 'chunk cached in browser' }),
          instantClickRender: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['0ms Instant Mount'], sub: 'renders immediately on click' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Optimistic Prefetching Pattern', [
            `@defer (on interaction; prefetch on idle) {`,
            `  <app-dialog-content />`,
            `} @placeholder {`,
            `  <button>Open Dialog</button>`,
            `}`,
            `1. On idle: Browser downloads dialog chunk into HTTP cache`,
            `2. On click: Dialog opens with ZERO loading spinner!`,
          ], { icon: 'terminal' }),
          zDefer: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'OPTIMISTIC PREFETCHING PIPELINE'),
        },
        links: {
          pc: h('prefetchIdle', 'cachedChunk', ['prefetchIdle', 'cachedChunk'], { label: 'prefetch JS' }),
          ci: h('cachedChunk', 'instantClickRender', ['cachedChunk', 'instantClickRender'], { label: 'instant hydration' }),
        },
        flows: [{ route: ['pc', 'ci'], kind: 'hydrate', rate: 1.6 }],
      },
    },
  ],
};
