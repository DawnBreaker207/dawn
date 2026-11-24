// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularDeferLoadingLesson = {
  id: 'angular-defer-loading',
  title: 'Deferred Loading Architecture (@defer, @placeholder, @loading)',
  summary: 'Master template-level deferred loading with @defer. Explore automatic code-splitting, custom trigger conditions (on viewport, idle, interaction, hover), and optimistic prefetching.',
  minutes: 20,
  level: 'intermediate',
  metrics: ['deferState', 'activeTrigger', 'chunkStatus', 'prefetchStrategy'],
  legend: ['flow', ['trigger', 'trigger event evaluation'], ['chunk', 'lazy chunk load']],
  goals: [
    { text: 'Declarative lazy loading with @defer, @placeholder, and @loading', step: 1 },
    { text: 'Viewport, Idle, Hover, and Interaction triggers', step: 2 },
    { text: 'Optimistic prefetching with prefetch on idle', step: 3 },
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
        text: 'The compiler splits all components, directives, and pipes used inside @defer into separate bundles without any manual Webpack/Vite config.',
      },
      metrics: { deferState: 'Placeholder Mounted', activeTrigger: 'on viewport', chunkStatus: 'Remote (Not Loaded)', prefetchStrategy: 'idle' },
      scene: {
        entities: {
          page: d(-10, 0, { color: 'blue', glyph: 'terminal', label: ['Main Page Component'], sub: 'Initial Bundle' }),
          placeholder: d(0, 0, { color: 'amber', glyph: 'boxes', label: ['@placeholder Block'], sub: 'Rendered instantly (Skeleton)' }),
          remoteChunk: d(10, 0, { color: 'purple', glyph: 'package', label: ['HeavyChart.chunk.js'], sub: 'Split async chunk (120KB)' }),
          zDefer: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'DECLARATIVE DEFERRED BOUNDARY'),
        },
        links: {
          pp: h('page', 'placeholder', ['page', 'placeholder'], { label: 'render placeholder' }),
          pr: h('placeholder', 'remoteChunk', ['placeholder', 'remoteChunk'], { label: 'split chunk boundary' }),
        },
        flows: [{ route: ['pp'], kind: 'trigger', rate: 1.2 }],
      },
    },
    {
      short: 'Triggers in Action',
      chapter: 'execution',
      title: 'Trigger Conditions: on viewport, hover, interaction',
      body: [
        '<code>@defer</code> provides built-in triggers: <code>on viewport</code> (uses IntersectionObserver on placeholder), <code>on idle</code> (requestIdleCallback), <code>on interaction</code> (click/focus), <code>on hover</code>, and custom <code>when condition</code> signals.',
        'While downloading the chunk, Angular seamlessly displays the optional <code>@loading (minimum 200ms)</code> block to prevent flicker.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always provide minimum on @loading (e.g. @loading (minimum 200ms)) to prevent rapid UI flashes on high-speed internet connections.',
      },
      changes: ['+ User scrolled placeholder into viewport', '+ IntersectionObserver triggered chunk fetch', '+ Rendered @loading spinner while downloading'],
      metrics: { deferState: 'Loading Chunk...', activeTrigger: 'Viewport Intersected', chunkStatus: 'Downloading 200 OK', prefetchStrategy: 'Active' },
      scene: {
        entities: {
          scroll: d(-10, 0, { color: 'cyan', glyph: 'clock', label: ['IntersectionObserver'], sub: 'Target entered viewport' }),
          loadingView: d(0, 0, { color: 'amber', glyph: 'terminal', label: ['@loading Block'], sub: 'Displays spinner' }),
          networkFetch: d(10, 0, { color: 'purple', glyph: 'database', label: ['HTTP GET chunk.js'], sub: 'Fetching chunk' }),
          zTrigger: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'TRIGGER EXECUTION LIFECYCLE'),
        },
        links: {
          sl: h('scroll', 'loadingView', ['scroll', 'loadingView'], { label: 'trigger' }),
          ln: h('loadingView', 'networkFetch', ['loadingView', 'networkFetch'], { label: 'fetch asset' }),
        },
        flows: [{ route: ['sl', 'ln'], kind: 'chunk', rate: 1.8 }],
      },
    },
    {
      short: 'Prefetch & Swap',
      chapter: 'solution',
      title: 'Prefetching & Seamless Content Swap',
      body: [
        'To achieve zero-delay interactions, decouple the download trigger from the render trigger: <code>@defer (on interaction; prefetch on idle)</code>.',
        'The bundle downloads silently in the background during browser idle time. When the user finally clicks the button, the component renders instantly with zero loading delay.',
      ],
      callout: {
        kind: 'insight',
        text: 'Prefetching transforms lazy loading from a noticeable wait into an instantaneous UI transition.',
      },
      changes: ['+ Chunk prefetched in background via requestIdleCallback', '+ User clicked element -> instant swap without spinner', '+ Component mounted and interactive'],
      metrics: { deferState: 'Hydrated & Active', activeTrigger: 'Interaction Ready', chunkStatus: 'Cached in Memory', prefetchStrategy: 'Prefetched on Idle' },
      scene: {
        entities: {
          idleTrigger: d(-10, 0, { color: 'blue', glyph: 'clock', label: ['prefetch on idle'], sub: 'Background browser idle' }),
          cache: d(0, 0, { color: 'cyan', glyph: 'database', label: ['Browser Cache / Memory'], sub: 'Chunk ready in RAM' }),
          activeComp: d(10, 0, { color: 'green', glyph: 'boxes', label: ['HeavyChartComponent'], sub: 'Instant mounting' }),
          zPrefetch: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'ZERO-LATENCY PREFETCH PIPELINE'),
        },
        links: {
          ic: h('idleTrigger', 'cache', ['idleTrigger', 'cache'], { label: 'pre-download' }),
          ca: h('cache', 'activeComp', ['cache', 'activeComp'], { label: 'instant swap on click' }),
        },
        flows: [{ route: ['ic', 'ca'], kind: 'chunk', rate: 1.5 }],
      },
    },
  ],
};
