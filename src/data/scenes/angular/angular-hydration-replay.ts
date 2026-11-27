import {
  makeBlock,
  makeDb,
  makeDevice,
  makeLink,
  makePanel
} from '@/lib/simulator/scene-builders';

export const angularHydrationReplayLesson = {
  id: 'angular-hydration-replay',
  title: 'SSR Hydration & Event Replay',
  summary: 'Discover Angular modern SSR hydration architecture. Trace how provideClientHydration(withEventReplay()) matches server-rendered HTML nodes without DOM destruction and replays early user interactions.',
  minutes: 25,
  level: 'advanced',
  metrics: ['ssrState', 'domDestruction', 'eventReplayQueue', 'flickerPrevention'],
  legend: ['flow', ['dom', 'DOM annotation & matching'], ['event', 'recorded user events'], ['replay', 'event dispatch replay'], ['stable', 'hydrated clean state']],
  goals: [
    { text: 'Non-destructive DOM matching vs legacy destructive re-rendering', step: 1 },
    { text: 'Server annotations and hydration markers (<!--nghm-->)', step: 2 },
    { text: 'Event Replay: buffering early user clicks before JS hydration completes', step: 3 },
    { text: 'Hydration DOM node matching: LView attaching to existing elements in-place', step: 4 },
    { text: 'Event Replay dispatch: replaying recorded user actions to listeners', step: 5 },
    { text: 'Incremental Hydration and ngSkipHydration for third-party widgets', step: 6 },
  ],
  steps: [
    {
      short: 'Non-Destructive',
      chapter: 'concept',
      title: 'Legacy Destructive Hydration vs Non-Destructive Matching',
      body: [
        'In legacy Angular SSR, when the browser downloaded the JavaScript bundle, Angular destroyed the server-rendered HTML completely and re-created every DOM node from scratch.',
        'This caused visible screen flicker, lost form input focus, and wasted CPU cycles. Modern Angular uses <b>Non-Destructive Hydration</b>: it reuses existing DOM nodes directly.',
      ],
      callout: {
        kind: 'insight',
        text: 'Non-destructive hydration eliminates Cumulative Layout Shift (CLS) and preserves browser scroll position during SSR bootstrap.',
      },
      metrics: { ssrState: 'Server HTML Delivered', domDestruction: '0 nodes destroyed', eventReplayQueue: '0 events', flickerPrevention: '100% Flicker-Free' },
      scene: {
        entities: {
          serverHtml: makeDb(-16, -6, { s: 4.6, h: 48, color: 'blue', glyph: 'server', label: ['Server HTML'], sub: 'SSR Node/Edge' }),
          hydrationMatcher: makeBlock(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Hydration Match'], sub: 'walks DOM' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Legacy vs Non-Destructive Hydration', [
            `Legacy Angular SSR (Destructive):`,
            `  Server HTML rendered -> JS loads -> document.body.innerHTML = ''`,
            `  -> Re-creates all 2,000 DOM elements -> Visible White Flicker!`,
            ``,
            `Modern Angular SSR (Non-Destructive):`,
            `  Server HTML rendered -> JS loads -> walks existing nodes`,
            `  -> Re-attaches listeners in place -> ZERO DOM nodes destroyed!`,
          ], { icon: 'terminal' }),
        },
        links: {
          sh: makeLink('serverHtml', 'hydrationMatcher', ['serverHtml', 'hydrationMatcher'], { label: 'stream HTML' }),
        },
        flows: [{ route: ['sh'], kind: 'dom', rate: 1.5 }],
      },
    },
    {
      short: 'Hydration Markers',
      chapter: 'setup',
      title: 'Server Annotations & Hydration Markers (<!--nghm-->)',
      body: [
        'To match client components to server DOM nodes without guessing, the server serialization engine injects lightweight comment annotations (<code>&lt;!--nghm--&gt;</code>).',
        'These markers encode component boundaries, view hierarchy IDs, and element indexes, enabling the client to reconstruct the <code>LView</code> tree in a single linear pass.',
      ],
      callout: {
        kind: 'tip',
        text: 'Hydration markers add less than 1KB to the HTML payload and are cleaned up once hydration finishes.',
      },
      changes: ['+ Server injects <!--nghm--> hydration metadata into HTML', '+ Client reads markers to align component trees'],
      metrics: { ssrState: 'Annotated HTML', domDestruction: '0 nodes', eventReplayQueue: '0 events', flickerPrevention: 'Aligned' },
      scene: {
        entities: {
          serverHtml: makeDb(-16, -6, { s: 4.6, h: 48, color: 'cyan', glyph: 'server', label: ['Server Serializer'], sub: 'nghm comments' }),
          hydrationMatcher: makeBlock(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Marker Parser'], sub: 'aligns LView' }),
          preservedDom: makeBlock(8, -6, { s: 4.8, h: 52, color: 'green', glyph: 'package', label: ['Aligned LView'], sub: '1:1 DOM slots' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Hydration Comment Markers', [
            `<app-root>`,
            `  <!--nghm id="c0" v="1"-->`,
            `  <app-nav><!--nghm id="c1" v="0"-->...</app-nav>`,
            `  <!--nghm id="c2" v="0"-->`,
            `  <main><h1>Welcome</h1></main>`,
            `</app-root>`,
            `// Client matches exact DOM elements without querySelector search`,
          ], { icon: 'terminal' }),
        },
        links: {
          sh: makeLink('serverHtml', 'hydrationMatcher', ['serverHtml', 'hydrationMatcher'], { label: 'stream annotated HTML' }),
          hp: makeLink('hydrationMatcher', 'preservedDom', ['hydrationMatcher', 'preservedDom'], { label: 'map LView slots' }),
        },
        flows: [{ route: ['sh', 'hp'], kind: 'dom', rate: 1.5 }],
      },
    },
    {
      short: 'Event Replay Buffer',
      chapter: 'execution',
      title: 'Event Replay: Buffering Early User Clicks',
      body: [
        'A critical flaw in traditional SSR is the <b>Uncanny Valley</b>: the user sees a button, clicks it, but the JavaScript bundle is still downloading, so nothing happens! The click is silently lost.',
        'With <code>provideClientHydration(withEventReplay())</code>, an ultra-lightweight inline JS snippet captures and buffers early user clicks, keystrokes, and form inputs in a queue.',
      ],
      callout: {
        kind: 'warning',
        text: 'Event Replay guarantees zero lost clicks while users interact with fast-loading SSR pages on slow mobile networks.',
      },
      changes: ['+ Inline JS script armed in HTML <head>', '+ User click captured in event queue before JS bundle finishes'],
      metrics: { ssrState: 'Bundle Downloading', domDestruction: '0 nodes', eventReplayQueue: '1 click buffered', flickerPrevention: 'Zero Lost Clicks' },
      scene: {
        entities: {
          serverHtml: makeDevice(-16, -6, { label: 'Early Click', tags: [{ text: 'Add to Cart', tone: 'amber', icon: 'zap' }] }),
          hydrationMatcher: makeBlock(-4, -6, { s: 4.8, h: 52, color: 'rose', glyph: 'cpu', label: ['Inline Recorder'], sub: 'jsaction hook' }),
          eventBuffer: makeBlock(8, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'package', label: ['Replay Queue'], sub: 'buffered click' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Event Replay Buffer Queue', [
            `// Inline script in index.html captures early interactions:`,
            `window.__jsaction = {`,
            `  queue: [`,
            `    { event: 'click', target: button#add-to-cart, time: 420 }`,
            `  ]`,
            `};`,
            `// User click is safe! Angular will replay it once hydrated.`,
          ], { icon: 'terminal' }),
        },
        links: {
          sh: makeLink('serverHtml', 'hydrationMatcher', ['serverHtml', 'hydrationMatcher'], { label: 'click before JS' }),
          he: makeLink('hydrationMatcher', 'eventBuffer', ['hydrationMatcher', 'eventBuffer'], { label: 'store event in queue' }),
        },
        flows: [{ route: ['sh', 'he'], kind: 'event', rate: 1.5 }],
      },
    },
    {
      short: 'In-Place Matching',
      chapter: 'execution',
      title: 'Hydration DOM Matching: Linking LView to Existing Elements',
      body: [
        'When <code>main.js</code> finishes downloading, Angular bootstraps and executes the client hydration algorithm.',
        'Instead of calling <code>document.createElement()</code>, Ivy instruction <code>ɵɵelementStart</code> walks the existing DOM nodes in-place, populating <code>LView</code> slots with direct references to real DOM elements.',
      ],
      callout: {
        kind: 'insight',
        text: 'This operation runs in O(N) time with zero DOM mutations or reflows, keeping CPU time under 10ms.',
      },
      changes: ['+ LView slots linked directly to existing HTML nodes', '+ Event listeners attached without rewriting DOM'],
      metrics: { ssrState: 'DOM Matched', domDestruction: '0 nodes', eventReplayQueue: '1 click buffered', flickerPrevention: 'Attached' },
      scene: {
        entities: {
          serverHtml: makeDevice(-16, -6, { label: 'main.js', tags: [{ text: 'Bootstrap App', tone: 'blue', icon: 'zap' }] }),
          hydrationMatcher: makeBlock(-4, -6, { s: 4.8, h: 52, color: 'green', glyph: 'cpu', label: ['Hydration Walker'], sub: 'elementStart' }),
          preservedDom: makeBlock(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['Hydrated LView'], sub: 'attached wires' }),
          eventBuffer: makeDb(8, 8, { s: 4.6, h: 48, color: 'purple', glyph: 'database', label: ['Buffered Queue'], sub: 'queued click' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'In-Place Matching Code', [
            `// Client bootstrap with Event Replay:`,
            `export const appConfig: ApplicationConfig = {`,
            `  providers: [`,
            `    provideClientHydration(withEventReplay())`,
            `  ]`,
            `};`,
            `// Ivy links existing DOM elements directly to LView slots`,
          ], { icon: 'terminal' }),
        },
        links: {
          sh: makeLink('serverHtml', 'hydrationMatcher', ['serverHtml', 'hydrationMatcher'], { label: 'execute hydration' }),
          hp: makeLink('hydrationMatcher', 'preservedDom', ['hydrationMatcher', 'preservedDom'], { label: 'wire event listeners' }),
          pe: makeLink('preservedDom', 'eventBuffer', ['preservedDom', 'eventBuffer'], { label: 'check queue' }),
        },
        flows: [{ route: ['sh', 'hp', 'pe'], kind: 'dom', rate: 1.5 }],
      },
    },
    {
      short: 'Replay Dispatch',
      chapter: 'execution',
      title: 'Event Replay Dispatch: Executing Buffered Actions',
      body: [
        'Once hydration finishes and component event listeners are active, Angular drains the <code>Event Replay Queue</code>.',
        'It synthesizes and dispatches the recorded click event to <code>button#add-to-cart</code>. The component’s <code>(click)="addToCart()"</code> handler executes immediately!',
      ],
      callout: {
        kind: 'tip',
        text: 'The user experiences zero friction: their click was accepted and honored the exact instant hydration finished.',
      },
      changes: ['+ Buffered events dispatched to newly attached listeners', '+ Shopping cart updated seamlessly'],
      metrics: { ssrState: 'Events Replayed', domDestruction: '0 nodes', eventReplayQueue: '0 events (Drained)', flickerPrevention: '100% Interactive' },
      scene: {
        entities: {
          hydrationMatcher: makeBlock(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Drain Queue'], sub: 'pop event' }),
          preservedDom: makeBlock(8, -6, { s: 4.8, h: 52, color: 'green', glyph: 'package', label: ['Event Dispatch'], sub: 'dispatch event' }),
          cartUpdated: makeDb(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Cart: 1 Item'], sub: 'signal updated' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Event Replay Execution', [
            `Event Replay Pipeline:`,
            `  1. Hydration complete for CartComponent`,
            `  2. Replay dispatcher reads: { event: 'click', target: button#add-to-cart }`,
            `  3. Dispatches native event to button listener`,
            `  4. addToCart() executes -> Cart signal increments to 1`,
            `= Seamless user experience during initial page load`,
          ], { icon: 'terminal' }),
        },
        links: {
          hp: makeLink('hydrationMatcher', 'preservedDom', ['hydrationMatcher', 'preservedDom'], { label: 'replay queued event' }),
          pc: makeLink('preservedDom', 'cartUpdated', ['preservedDom', 'cartUpdated'], { label: 'execute handler' }),
        },
        flows: [{ route: ['hp', 'pc'], kind: 'replay', rate: 1.6 }],
      },
    },
    {
      short: 'Incremental & Skip',
      chapter: 'scaling',
      title: 'Incremental Hydration & ngSkipHydration',
      body: [
        'What about third-party libraries (like Google Maps or D3) that manipulate DOM directly outside Angular?',
        'Add <code>ngSkipHydration</code> to that component tag! Angular will leave that specific subtree alone, while hydrating the rest of the page non-destructively.',
      ],
      callout: {
        kind: 'insight',
        text: 'Combined with @defer, Incremental Hydration allows deferring hydration of heavy subtrees until the user interacts with them.',
      },
      changes: ['+ ngSkipHydration isolates non-Angular DOM widgets', '+ Incremental hydration of @defer blocks enabled'],
      metrics: { ssrState: 'Fully Hydrated', domDestruction: '0 nodes', eventReplayQueue: 'Clean', flickerPrevention: 'Production Stable' },
      scene: {
        entities: {
          serverHtml: makeDevice(-16, -6, { label: 'Angular App', tags: [{ text: 'Hydrated Page', tone: 'green', icon: 'zap' }] }),
          hydrationMatcher: makeBlock(-4, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'terminal', label: ['ngSkipHydrate'], sub: 'bypasses D3' }),
          cartUpdated: makeDb(8, -6, { s: 4.6, h: 48, color: 'purple', glyph: 'server', label: ['D3 / Map Widget'], sub: 'client render' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'ngSkipHydration Usage', [
            `// In template:`,
            `<app-google-map ngSkipHydration />`,
            ``,
            `// Or on component decorator:`,
            `@Component({`,
            `  selector: 'app-d3-chart',`,
            `  host: { ngSkipHydration: 'true' }`,
            `})`,
            `export class D3ChartComponent {}`,
          ], { icon: 'terminal' }),
        },
        links: {
          sh: makeLink('serverHtml', 'hydrationMatcher', ['serverHtml', 'hydrationMatcher'], { label: 'isolate widget' }),
          hc: makeLink('hydrationMatcher', 'cartUpdated', ['hydrationMatcher', 'cartUpdated'], { label: 'allow direct D3 DOM' }),
        },
        flows: [{ route: ['sh', 'hc'], kind: 'stable', rate: 1.5 }],
      },
    },
  ],
};
