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
          mainBundle: y(-16, -6, { label: 'main.js', tags: [{ text: 'Page Bundle', tone: 'blue', icon: 'zap' }] }),
          deferSplitter: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['@defer Splitter'], sub: '@defer split' }),
          lazyChunkFile: b(8, -6, { s: 4.6, h: 48, color: 'cyan', glyph: 'database', label: ['comments.chunk'], sub: 'lazy chunk' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Declarative @defer Syntax', [
            `@defer {`,
            `  <app-comments-section [postId]="post.id" />`,
            `} @placeholder {`,
            `  <p>Comments placeholder...</p>`,
            `}`,
            `// Angular compiler automatically extracts app-comments-section`,
            `// and all its dependencies into an independent chunk!`,
          ], { icon: 'terminal' }),
        },
        links: {
          md: h('mainBundle', 'deferSplitter', ['mainBundle', 'deferSplitter'], { label: 'extract dependencies' }),
          dl: h('deferSplitter', 'lazyChunkFile', ['deferSplitter', 'lazyChunkFile'], { label: 'emit chunk' }),
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
          mainBundle: y(-16, -6, { label: '@placeholder', tags: [{ text: 'Skeleton Box', tone: 'slab', icon: 'zap' }] }),
          deferSplitter: d(-4, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['Timer Guard'], sub: 'minimum 500ms' }),
          loadingSpinner: d(8, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'package', label: ['@loading State'], sub: 'smooth spinner' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, '@placeholder & @loading Timers', [
            `@defer {`,
            `  <app-heavy-chart />`,
            `} @loading (after 100ms; minimum 500ms) {`,
            `  <app-spinner /> // Only shown if network > 100ms!`,
            `} @placeholder (minimum 300ms) {`,
            `  <div class="skeleton-box"></div>`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          md: h('mainBundle', 'deferSplitter', ['mainBundle', 'deferSplitter'], { label: 'init skeleton' }),
          ds: h('deferSplitter', 'loadingSpinner', ['deferSplitter', 'loadingSpinner'], { label: 'gate duration' }),
        },
        flows: [{ route: ['md', 'ds'], kind: 'placeholder', rate: 1.5 }],
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
          mainBundle: y(-16, -6, { label: 'User Scroll', tags: [{ text: 'Scroll Down', tone: 'blue', icon: 'zap' }] }),
          deferSplitter: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['Observer API'], sub: 'enters view' }),
          lazyChunkFile: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['Fetch Chunk'], sub: 'downloading' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'on viewport Implementation', [
            `@defer (on viewport) {`,
            `  <app-comment-thread />`,
            `} @placeholder {`,
            `  <div style="height: 300px">Loading comments on scroll...</div>`,
            `}`,
            `// Zero network bytes consumed until scrolled into view!`,
          ], { icon: 'terminal' }),
        },
        links: {
          md: h('mainBundle', 'deferSplitter', ['mainBundle', 'deferSplitter'], { label: 'scroll intersects' }),
          dl: h('deferSplitter', 'lazyChunkFile', ['deferSplitter', 'lazyChunkFile'], { label: 'download JS chunk' }),
        },
        flows: [{ route: ['md', 'dl'], kind: 'trigger', rate: 1.5 }],
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
          mainBundle: y(-16, -6, { label: 'mouseenter', tags: [{ text: 'Hover Event', tone: 'amber', icon: 'zap' }] }),
          deferSplitter: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['on hover(btn)'], sub: 'hover trigger' }),
          hydratedComponent: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Tooltip View'], sub: 'mounted view' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'on hover Trigger Syntax', [
            `<button #infoBtn>Details</button>`,
            ``,
            `@defer (on hover(infoBtn)) {`,
            `  <app-user-details-tooltip />`,
            `} @placeholder {`,
            `  <span>Hover to preview</span>`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          md: h('mainBundle', 'deferSplitter', ['mainBundle', 'deferSplitter'], { label: 'user intent' }),
          dh: h('deferSplitter', 'hydratedComponent', ['deferSplitter', 'hydratedComponent'], { label: 'mount component' }),
        },
        flows: [{ route: ['md', 'dh'], kind: 'trigger', rate: 1.5 }],
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
          mainBundle: y(-16, -6, { label: 'requestIdle', tags: [{ text: 'CPU Idle', tone: 'green', icon: 'zap' }] }),
          deferSplitter: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['Idle Scheduler'], sub: 'runs in idle' }),
          lazyChunkFile: b(8, -6, { s: 4.6, h: 48, color: 'blue', glyph: 'database', label: ['Silent Chunk'], sub: 'silent load' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'on idle Execution', [
            `@defer (on idle) {`,
            `  <app-analytics-graph />`,
            `}`,
            `// Browser executes in background during requestIdleCallback:`,
            `window.requestIdleCallback(() => {`,
            `  import('./analytics-graph.chunk.js');`,
            `});`,
          ], { icon: 'terminal' }),
        },
        links: {
          md: h('mainBundle', 'deferSplitter', ['mainBundle', 'deferSplitter'], { label: 'browser idle' }),
          dl: h('deferSplitter', 'lazyChunkFile', ['deferSplitter', 'lazyChunkFile'], { label: 'download background chunk' }),
        },
        flows: [{ route: ['md', 'dl'], kind: 'chunk', rate: 1.5 }],
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
          mainBundle: y(-16, -6, { label: 'prefetch idle', tags: [{ text: 'Pre-cache', tone: 'cyan', icon: 'zap' }] }),
          deferSplitter: d(-4, -6, { s: 4.8, h: 52, color: 'green', glyph: 'boxes', label: ['Memory Cache'], sub: 'cached in HTTP' }),
          hydratedComponent: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['0ms Dialog'], sub: 'instant mount' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Optimistic Prefetching Pattern', [
            `@defer (on interaction; prefetch on idle) {`,
            `  <app-dialog-content />`,
            `} @placeholder {`,
            `  <button>Open Dialog</button>`,
            `}`,
            `1. On idle: Browser downloads dialog chunk into HTTP cache`,
            `2. On click: Dialog opens with ZERO loading spinner!`,
          ], { icon: 'terminal' }),
        },
        links: {
          md: h('mainBundle', 'deferSplitter', ['mainBundle', 'deferSplitter'], { label: 'prefetch JS' }),
          dh: h('deferSplitter', 'hydratedComponent', ['deferSplitter', 'hydratedComponent'], { label: 'instant hydration' }),
        },
        flows: [{ route: ['md', 'dh'], kind: 'hydrate', rate: 1.6 }],
      },
    },
  ],
};
