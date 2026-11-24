// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const angularRxjsReactivityLesson = {
  id: 'angular-rxjs-reactivity',
  title: 'Pure RxJS: .pipe() Operators, Flattening & Streams',
  summary: 'Deep-dive into pure RxJS reactive pipelines: composable .pipe() chains, transformation & stateful operators (map, filter, scan, tap), time & rate-limiting (debounceTime, throttleTime, takeUntil), multi-stream combination (combineLatest, forkJoin, withLatestFrom), flattening (switchMap, mergeMap, concatMap, exhaustMap), and Subject multicasting.',
  minutes: 30,
  level: 'advanced',
  metrics: ['streamState', 'activePipe', 'concurrency', 'subscription'],
  legend: ['flow', ['stream', 'observable emission'], ['cancel', 'cancel / complete'], ['combine', 'multi-stream join']],
  goals: [
    { text: 'Observable Push Streams & pure .pipe() functional composition', step: 1 },
    { text: 'Transformation & State pipes: map, filter, tap & scan', step: 2 },
    { text: 'Time & Lifecycle pipes: debounceTime, throttleTime, distinctUntilChanged & takeUntil', step: 3 },
    { text: 'Multi-Stream Combination: combineLatest, forkJoin, withLatestFrom & merge', step: 4 },
    { text: 'Higher-Order Flattening: switchMap, mergeMap, concatMap & exhaustMap', step: 5 },
    { text: 'Subject Multicasting & Resilience: BehaviorSubject, shareReplay, catchError & finalize', step: 6 },
  ],
  steps: [
    {
      short: '.pipe() Chain',
      chapter: 'concept',
      title: 'Observable Push Streams & .pipe() Composition',
      body: [
        'In pure RxJS, an <code>Observable</code> is a lazy push stream of <code>0..N</code> values over time. Nothing executes until <code>.subscribe()</code> is called.',
        'The <code>.pipe(op1(), op2())</code> method composes pure operator functions: each operator wraps the upstream Observable, transforms emissions, and returns a <b>new immutable Observable</b> without mutating the source.',
      ],
      callout: {
        kind: 'insight',
        text: 'Think of .pipe() as an assembly line of pure functions—data flows one way from source -> operators -> observer.',
      },
      metrics: { streamState: 'Lazy -> Active', activePipe: '.pipe(op1, op2)', concurrency: 'Unicast', subscription: 'Subscribed' },
      scene: {
        entities: {
          sourceStream: y(-16, -6, { label: 'source$', tags: [{ text: 'fromEvent / of', tone: 'purple', icon: 'zap' }] }),
          pipeStage: d(-4, -6, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['.pipe() Chain'], sub: 'pure .pipe()' }),
          observerOut: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Observer'], sub: 'next/err/done' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Pure .pipe() Composition', [
            `const stream$ = fromEvent(input, 'input').pipe(`,
            `  map(e => (e.target as HTMLInputElement).value),`,
            `  filter(text => text.length >= 2)`,
            `);`,
            `// Lazy: nothing runs until .subscribe()!`,
            `const sub = stream$.subscribe(val => console.log(val));`,
          ], { icon: 'terminal' }),
        },
        links: {
          sp: h('sourceStream', 'pipeStage', ['sourceStream', 'pipeStage'], { label: 'emit raw event' }),
          po: h('pipeStage', 'observerOut', ['pipeStage', 'observerOut'], { label: 'subscribe()' }),
        },
        flows: [{ route: ['sp', 'po'], kind: 'stream', rate: 1.5 }],
      },
    },
    {
      short: 'map / filter / scan',
      chapter: 'concept',
      title: 'Transform, Filter & Stateful Accumulator (scan)',
      body: [
        '• <b><code>map()</code> / <code>filter()</code></b>: Transform or drop values mid-flight.<br>' +
        '• <b><code>tap()</code></b>: Inspect or log emissions without altering the stream.<br>' +
        '• <b><code>scan((acc, val) =&gt; ..., seed)</code></b>: Like <code>Array.reduce</code> over time—maintains reactive state across emissions and emits every intermediate result!',
      ],
      callout: {
        kind: 'tip',
        text: 'Use scan() to build reactive counters, shopping carts, or undo stacks with zero external mutable variables.',
      },
      changes: ['+ filter() drops invalid values early', '+ scan() accumulates state reactively across emissions'],
      metrics: { streamState: 'Transforming', activePipe: 'map/filter/scan', concurrency: 'Synchronous', subscription: 'Active' },
      scene: {
        entities: {
          sourceStream: y(-16, -6, { label: 'clicks$', tags: [{ text: '+1 / +5 / -1', tone: 'blue', icon: 'zap' }] }),
          pipeStage: d(-4, -6, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['filter + map'], sub: 'map/scan/tap' }),
          statePipe: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'boxes', label: ['scan(acc, v)'], sub: 'stateful sum' }),
          observerOut: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['State Stream'], sub: '0 -> 1 -> 6' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Stateful scan() in .pipe()', [
            `const total$ = delta$.pipe(`,
            `  filter(n => n !== 0),`,
            `  tap(n => console.log('delta:', n)),`,
            `  scan((acc, n) => acc + n, 0),`,
            `  startWith(0)`,
            `); // Emits running total on every emission!`,
          ], { icon: 'terminal' }),
        },
        links: {
          sp: h('sourceStream', 'pipeStage', ['sourceStream', 'pipeStage'], { label: 'raw deltas' }),
          ps: h('pipeStage', 'statePipe', ['pipeStage', 'statePipe'], { label: 'filtered' }),
          so: h('statePipe', 'observerOut', ['statePipe', 'observerOut'], { label: 'emit acc' }),
        },
        flows: [{ route: ['sp', 'ps', 'so'], kind: 'stream', rate: 1.5 }],
      },
    },
    {
      short: 'Time & takeUntil',
      chapter: 'execution',
      title: 'Time & Lifecycle Pipes: debounceTime, throttleTime, takeUntil',
      body: [
        'RxJS treats <b>time</b> as a first-class operator dimension:<br>' +
        '• <b><code>debounceTime(300)</code></b>: Emits only after 300ms of silence (search input).<br>' +
        '• <b><code>throttleTime(1000)</code></b>: Emits at most once per 1000ms (scroll/click spam).<br>' +
        '• <b><code>distinctUntilChanged()</code></b>: Drops consecutive identical values.<br>' +
        '• <b><code>takeUntil(destroy$)</code></b>: Auto-completes the stream when notifier fires.',
      ],
      callout: {
        kind: 'insight',
        text: 'Putting distinctUntilChanged() after debounceTime(300) ensures typing "abc" -> "abcd" -> "abc" within 300ms fires 0 redundant emissions.',
      },
      changes: ['+ debounceTime + distinctUntilChanged filter noise', '+ takeUntil() guarantees deterministic completion'],
      metrics: { streamState: 'Time-Gated', activePipe: 'debounceTime', concurrency: 'Rate-Limited', subscription: 'Auto-Complete' },
      scene: {
        entities: {
          sourceStream: y(-16, -6, { label: 'input$', tags: [{ text: 'Rapid Events', tone: 'amber', icon: 'zap' }] }),
          pipeStage: d(-4, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['debounce(300)'], sub: 'debounce/take' }),
          statePipe: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'boxes', label: ['distinctUntil'], sub: 'dedupe ===' }),
          observerOut: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Clean Stream'], sub: '-85% noise' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Time & Lifecycle Operators', [
            `search$.pipe(`,
            `  debounceTime(300),`,
            `  distinctUntilChanged(),`,
            `  takeUntil(destroy$) // Completes & unsubscribes cleanly`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          sp: h('sourceStream', 'pipeStage', ['sourceStream', 'pipeStage'], { label: 'burst events' }),
          ps: h('pipeStage', 'statePipe', ['pipeStage', 'statePipe'], { label: '300ms quiet' }),
          so: h('statePipe', 'observerOut', ['statePipe', 'observerOut'], { label: 'unique value' }),
        },
        flows: [{ route: ['sp', 'ps', 'so'], kind: 'stream', rate: 1.5 }],
      },
    },
    {
      short: 'Multi-Stream Join',
      chapter: 'execution',
      title: 'Combination: combineLatest, forkJoin, withLatestFrom & merge',
      body: [
        '• <b><code>combineLatest([a$, b$])</code></b>: Emits <code>[a, b]</code> whenever *either* stream emits (after both emit once).<br>' +
        '• <b><code>forkJoin([a$, b$])</code></b>: Waits for all Observables to complete, then emits final values (like <code>Promise.all</code>).<br>' +
        '• <b><code>a$.pipe(withLatestFrom(b$))</code></b>: Triggers ONLY when <code>a$</code> emits, sampling the latest <code>b$</code>.<br>' +
        '• <b><code>merge(a$, b$)</code></b>: Interleaves emissions from both as they arrive.',
      ],
      callout: {
        kind: 'tip',
        text: 'Use withLatestFrom() when clicking Submit should read the latest Form state without re-triggering on every keystroke!',
      },
      changes: ['+ Multiple independent streams joined declaratively', '+ Zero nested callbacks or manual synchronization flags'],
      metrics: { streamState: 'Synchronized', activePipe: 'combineLatest', concurrency: 'Multi-Stream', subscription: 'Active' },
      scene: {
        entities: {
          sourceStream: y(-16, -6, { label: 'filter$', tags: [{ text: 'Stream A', tone: 'blue', icon: 'zap' }] }),
          pipeStage: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['combineLatest'], sub: 'combineLatest' }),
          streamB: y(-16, 8, { label: 'page$', tags: [{ text: 'Stream B', tone: 'cyan', icon: 'zap' }] }),
          observerOut: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['[filter, page]'], sub: 'tuple output' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Combination Operators', [
            `// Re-emit whenever filter$ OR page$ changes:`,
            `combineLatest([filter$, page$])`,
            `// Wait for all HTTP calls to complete:`,
            `forkJoin({ user: user$, roles: roles$ })`,
            `// Trigger on click$, sample latest form$:`,
            `click$.pipe(withLatestFrom(form$))`,
          ], { icon: 'terminal' }),
        },
        links: {
          sp: h('sourceStream', 'pipeStage', ['sourceStream', 'pipeStage'], { label: 'stream A' }),
          bp: h('streamB', 'pipeStage', ['streamB', 'pipeStage'], { label: 'stream B' }),
          po: h('pipeStage', 'observerOut', ['pipeStage', 'observerOut'], { label: 'emit [A, B]' }),
        },
        flows: [
          { route: ['sp', 'po'], kind: 'combine', rate: 1.5 },
          { route: ['bp', 'po'], kind: 'combine', rate: 1.3 },
        ],
      },
    },
    {
      short: 'Flattening Maps',
      chapter: 'technique',
      title: 'Higher-Order Flattening: switchMap / exhaustMap / concatMap / mergeMap',
      body: [
        'When an outer emission maps to an inner Observable (e.g. an HTTP call), flattening operators control concurrency:<br>' +
        '• <b><code>switchMap</code></b>: Cancels previous inner stream (search, route params).<br>' +
        '• <b><code>exhaustMap</code></b>: Ignores new outer events while inner is running (login/pay button).<br>' +
        '• <b><code>concatMap</code></b>: Queues inner streams sequentially in FIFO order.<br>' +
        '• <b><code>mergeMap</code></b>: Runs all inner streams in parallel.',
      ],
      callout: {
        kind: 'warning',
        text: 'Choosing the right flattening operator eliminates 99% of async race conditions and duplicate submit bugs.',
      },
      changes: ['+ Inner Observable flattened cleanly into single stream', '+ Stale in-flight requests auto-aborted by switchMap'],
      metrics: { streamState: 'Flattening', activePipe: 'switchMap()', concurrency: '1 Active (Latest)', subscription: 'Race-Free' },
      scene: {
        entities: {
          sourceStream: y(-16, -6, { label: 'query$', tags: [{ text: 'a -> ab -> abc', tone: 'amber', icon: 'zap' }] }),
          flattenHub: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['switchMap()'], sub: 'switchMap()' }),
          observerOut: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Inner HTTP$'], sub: 'abort old req' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Flattening Concurrency Matrix', [
            `switchMap  -> Cancel old, keep latest (Search / Typeahead)`,
            `exhaustMap -> Ignore new while busy   (Submit / Pay click)`,
            `concatMap  -> Queue in strict order   (Ordered writes)`,
            `mergeMap   -> Parallel execution      (Bulk uploads)`,
          ], { icon: 'terminal' }),
        },
        links: {
          sf: h('sourceStream', 'flattenHub', ['sourceStream', 'flattenHub'], { label: 'outer emit' }),
          fo: h('flattenHub', 'observerOut', ['flattenHub', 'observerOut'], { label: 'cancel old, run new' }),
        },
        flows: [{ route: ['sf', 'fo'], kind: 'cancel', rate: 1.6 }],
      },
    },
    {
      short: 'Subject & Resilience',
      chapter: 'scaling',
      title: 'Subject Multicasting & Error Resilience (catchError, retry, finalize)',
      body: [
        '• <b><code>Subject</code> / <code>BehaviorSubject(init)</code> / <code>ReplaySubject(n)</code></b>: Both Observer and Observable—used for hot event buses and reactive state.<br>' +
        '• <b><code>shareReplay({ bufferSize: 1, refCount: true })</code></b>: Multicasts a cold stream to N subscribers with 1 execution.<br>' +
        '• <b><code>catchError()</code> + <code>retry()</code> + <code>finalize()</code></b>: Recover gracefully inside inner pipes and always clean up loading spinners in <code>finalize()</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'finalize(() => isLoading = false) runs on BOTH completion and error/unsubscription—never get stuck with a spinning loader!',
      },
      changes: ['+ shareReplay(1) shares single execution across subscribers', '+ catchError + retry + finalize make pipeline fault-tolerant'],
      metrics: { streamState: 'Hot & Resilient', activePipe: 'catch + finalize', concurrency: 'Multicast', subscription: 'Guaranteed Clean' },
      scene: {
        entities: {
          sourceStream: y(-16, -6, { label: 'BehaviorSubj', tags: [{ text: 'Hot Multicast', tone: 'purple', icon: 'zap' }] }),
          pipeStage: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['shareReplay(1)'], sub: 'multicast cache' }),
          resilience: d(8, -6, { s: 4.8, h: 52, color: 'rose', glyph: 'shield', label: ['catch + retry'], sub: 'catch/finalize' }),
          observerOut: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['N Subscribers'], sub: 'safe fallback' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Multicast & Fault-Tolerant Pipe', [
            `data$ = trigger$.pipe(`,
            `  switchMap(id => fetch$(id).pipe(`,
            `    retry({ count: 2, delay: 1000 }),`,
            `    catchError(() => of(FALLBACK)),`,
            `    finalize(() => setLoading(false))`,
            `  )),`,
            `  shareReplay({ bufferSize: 1, refCount: true })`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          sp: h('sourceStream', 'pipeStage', ['sourceStream', 'pipeStage'], { label: 'multicast' }),
          pr: h('pipeStage', 'resilience', ['pipeStage', 'resilience'], { label: 'guard errors' }),
          ro: h('resilience', 'observerOut', ['resilience', 'observerOut'], { label: 'safe emit' }),
        },
        flows: [{ route: ['sp', 'pr', 'ro'], kind: 'stream', rate: 1.5 }],
      },
    },
  ],
};
