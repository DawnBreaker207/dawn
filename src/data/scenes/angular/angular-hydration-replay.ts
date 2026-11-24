// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularHydrationReplayLesson = {
  id: 'angular-hydration-replay',
  title: 'Non-Destructive Hydration & Event Replay',
  summary: 'Discover Angular modern SSR hydration architecture. Trace how provideClientHydration(withEventReplay()) matches server-rendered HTML nodes without DOM destruction and replays early user interactions.',
  minutes: 25,
  level: 'advanced',
  metrics: ['ssrState', 'domDestruction', 'eventReplayQueue', 'flickerPrevention'],
  legend: ['flow', ['dom', 'DOM annotation & matching'], ['event', 'recorded user events']],
  goals: [
    { text: 'Non-destructive DOM matching vs legacy destructive re-rendering', step: 1 },
    { text: 'Server annotations and hydration markers (<!--nghm-->)', step: 2 },
    { text: 'Event Replay: buffering and replaying user clicks during bootstrap', step: 3 },
  ],
  steps: [
    {
      short: 'Destructive vs Non-Destructive',
      chapter: 'concept',
      title: 'Legacy Destructive Hydration vs Non-Destructive Matching',
      body: [
        'In legacy Angular SSR, when the browser downloaded the JavaScript bundle, Angular destroyed the server-rendered HTML completely and re-created every DOM node from scratch.',
        'This caused visible screen flicker, lost form input focus, and wasted CPU cycles. Modern Angular uses <b>Non-Destructive Hydration</b>: it reuses existing DOM nodes directly.',
      ],
      callout: {
        kind: 'insight',
        text: 'Non-destructive hydration matches compiled component views with existing live DOM nodes using annotated comment markers.',
      },
      metrics: { ssrState: 'HTML Rendered', domDestruction: '0 Nodes Destroyed (100% Preserved)', eventReplayQueue: 'Idle', flickerPrevention: 'Active' },
      scene: {
        entities: {
          serverHtml: d(-10, 0, { color: 'amber', glyph: 'terminal', label: ['Server HTML in DOM'], sub: '<div ng-server-context>' }),
          matcher: d(0, 0, { color: 'purple', glyph: 'shield', label: ['Hydration Matcher'], sub: 'Walks DOM & attaches LView' }),
          liveTree: d(10, 0, { color: 'green', glyph: 'boxes', label: ['Hydrated Component'], sub: 'Preserved DOM pointers' }),
          zHydrate: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'NON-DESTRUCTIVE HYDRATION BRIDGE'),
        },
        links: {
          sm: h('serverHtml', 'matcher', ['serverHtml', 'matcher'], { label: 'match node ids' }),
          ml: h('matcher', 'liveTree', ['matcher', 'liveTree'], { label: 'bind component view' }),
        },
        flows: [{ route: ['sm', 'ml'], kind: 'dom', rate: 1.5 }],
      },
    },
    {
      short: 'DOM Annotations',
      chapter: 'execution',
      title: 'Hydration Markers & Annotations',
      body: [
        'The server renders special metadata comments such as <code><!--nghm--></code> containing node indices and container block mappings.',
        'When the client initializes, Angular reads this serialized manifest, allowing the hydration engine to jump directly to dynamic containers without traversing static elements.',
      ],
      callout: {
        kind: 'tip',
        text: 'Angular warns in development if DOM mismatch occurs (e.g. if browser extensions or invalid HTML alter the tree before hydration).',
      },
      changes: ['+ Server serialized hydration manifest into DOM comments', '+ Client hydration engine matched 150 nodes without DOM mutation', '+ Preserved input values and scroll positions'],
      metrics: { ssrState: 'Manifest Matched', domDestruction: '0 Nodes Destroyed', eventReplayQueue: 'Listening', flickerPrevention: 'Verified' },
      scene: {
        entities: {
          commentMarker: d(-10, 0, { color: 'blue', glyph: 'database', label: ['<!--nghm--> Marker'], sub: 'Serialized View Container Map' }),
          lviewPointers: d(0, 0, { color: 'purple', glyph: 'cpu', label: ['LView Pointer Map'], sub: 'Direct array offset indexing' }),
          interactiveView: d(10, 0, { color: 'green', glyph: 'terminal', label: ['Interactive DOM'], sub: 'Zero Layout Shift (CLS 0.0)' }),
          zMarker: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'SERIALIZED HYDRATION MANIFEST'),
        },
        links: {
          cl: h('commentMarker', 'lviewPointers', ['commentMarker', 'lviewPointers'], { label: 'deserialize indexes' }),
          li: h('lviewPointers', 'interactiveView', ['lviewPointers', 'interactiveView'], { label: 'attach event listeners' }),
        },
        flows: [{ route: ['cl', 'li'], kind: 'dom', rate: 1.6 }],
      },
    },
    {
      short: 'Event Replay',
      chapter: 'solution',
      title: 'Event Replay: Capturing Early User Interactions',
      body: [
        'Before JavaScript loads, a user might click a button or submit a form. In traditional SSR, these clicks are lost (dead clicks).',
        'With <code>provideClientHydration(withEventReplay())</code>, Angular injects an inline JS script (~1KB) that listens to events and queues them in memory.',
        'Once hydration finishes, Angular replays the queued events against the now-active component methods seamlessly.',
      ],
      callout: {
        kind: 'insight',
        text: 'Event Replay eliminates the "uncanny valley" where an application looks loaded but does not respond to user clicks.',
      },
      changes: ['+ User clicked "Add to Cart" at T=200ms before JS loaded', '+ Event buffer captured click event payload', '+ Replayed event at T=800ms upon component hydration'],
      metrics: { ssrState: 'Hydrated', domDestruction: '0 Nodes Destroyed', eventReplayQueue: 'Replayed 1 Click Event', flickerPrevention: 'Zero Dead Clicks' },
      scene: {
        entities: {
          earlyClick: d(-10, 0, { color: 'amber', glyph: 'terminal', label: ['User Click (T=200ms)'], sub: 'JS still downloading' }),
          eventBuffer: d(0, 0, { color: 'red', glyph: 'shield', label: ['Event Replay Buffer'], sub: 'window.__jsaction queue' }),
          hydratedHandler: d(10, 0, { color: 'green', glyph: 'boxes', label: ['addToCart() Method'], sub: 'Replayed & executed' }),
          zReplay: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'EVENT REPLAY RECORD & DISPATCH'),
        },
        links: {
          eb: h('earlyClick', 'eventBuffer', ['earlyClick', 'eventBuffer'], { label: 'buffer event' }),
          eh: h('eventBuffer', 'hydratedHandler', ['eventBuffer', 'hydratedHandler'], { label: 'replay upon hydrate' }),
        },
        flows: [{ route: ['eb', 'eh'], kind: 'event', rate: 1.8 }],
      },
    },
  ],
};
