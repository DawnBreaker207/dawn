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
  title: 'RxJS Reactive Engine: Streams, Flattening & Interop',
  summary: 'Master Angular’s reactive powerhouse: Observables vs Promises, hot multicasting (Subject & shareReplay), higher-order flattening (switchMap, mergeMap, concatMap, exhaustMap), time operators, error resilience, and RxJS + Signals hybrid architecture.',
  minutes: 30,
  level: 'advanced',
  metrics: ['streamState', 'operatorMode', 'inFlightReqs', 'memorySafety'],
  legend: ['flow', ['stream', 'observable stream'], ['cancel', 'abort stale request'], ['bridge', 'RxJS to Signal bridge']],
  goals: [
    { text: 'Observables vs Promises: multi-value push, laziness & cancellation', step: 1 },
    { text: 'Multicasting with Subject, BehaviorSubject & shareReplay(1)', step: 2 },
    { text: 'Flattening operators: switchMap, mergeMap, concatMap & exhaustMap', step: 3 },
    { text: 'Time & stream orchestration: debounceTime, distinctUntilChanged & combineLatest', step: 4 },
    { text: 'Stream resilience & teardown: catchError, retry & takeUntilDestroyed()', step: 5 },
    { text: 'Hybrid Reactivity: bridging RxJS async streams with Signals via toSignal()', step: 6 },
  ],
  steps: [
    {
      short: 'Observable Core',
      chapter: 'concept',
      title: 'Observables vs Promises: Lazy, Multi-Value & Cancellable',
      body: [
        'Unlike a <code>Promise</code> (eager, resolves once, cannot be cancelled), an RxJS <code>Observable</code> is <b>lazy</b> (executes only on <code>.subscribe()</code>), emits <b>0 to N values over time</b>, and supports native <b>cancellation</b>.',
        'When a user navigates away or unsubscribes, RxJS automatically invokes the teardown logic (calling <code>AbortController.abort()</code> on in-flight <code>fetch()</code> requests).',
      ],
      callout: {
        kind: 'insight',
        text: 'Lazy execution + built-in cancellation makes Observables ideal for async events, WebSockets, and abortable HTTP calls.',
      },
      metrics: { streamState: 'Subscribed', operatorMode: 'Observable', inFlightReqs: '1 (Abortable)', memorySafety: 'Cancellable' },
      scene: {
        entities: {
          eventSource: y(-16, -6, { label: 'Producer', tags: [{ text: 'Observable<T>', tone: 'purple', icon: 'zap' }] }),
          flattenHub: d(-4, -6, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['Lazy Stream'], sub: 'lazy & cancel' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Observable vs Promise', [
            `// Promise: runs immediately, 1 value, NOT cancellable`,
            `// Observable: lazy until subscribe(), N values, cancellable!`,
            `const sub = this.http.get('/api/users').subscribe(users => ...);`,
            `sub.unsubscribe(); // Aborts underlying XHR / fetch()!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ef: h('eventSource', 'flattenHub', ['eventSource', 'flattenHub'], { label: 'subscribe()' }),
        },
        flows: [{ route: ['ef'], kind: 'stream', rate: 1.5 }],
      },
    },
    {
      short: 'shareReplay & Subject',
      chapter: 'concept',
      title: 'Hot Multicasting: Subject, BehaviorSubject & shareReplay(1)',
      body: [
        'By default, HTTP Observables are <b>Cold (unicast)</b>: 3 components subscribing to <code>user$</code> trigger 3 duplicate HTTP calls!',
        'Adding <code>shareReplay({ bufferSize: 1, refCount: true })</code> or using a <code>BehaviorSubject</code> turns the stream <b>Hot (multicast)</b>—caching the latest emission and sharing 1 network call across all subscribers.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always set refCount: true in shareReplay(1) so the shared subscription tears down when the last consumer unmounts.',
      },
      changes: ['+ Cold unicast stream converted to Hot multicast', '+ Multiple consumers share single cached HTTP emission'],
      metrics: { streamState: 'Hot Multicast', operatorMode: 'shareReplay(1)', inFlightReqs: '1 Shared', memorySafety: 'refCount: true' },
      scene: {
        entities: {
          eventSource: y(-16, -6, { label: 'HTTP Cold$', tags: [{ text: '1 Network Call', tone: 'blue', icon: 'zap' }] }),
          flattenHub: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['shareReplay(1)'], sub: 'shareReplay(1)' }),
          httpApi: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['3 Consumers'], sub: 'shared cache' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Multicasting with shareReplay', [
            `user$ = this.http.get<User>('/api/me').pipe(`,
            `  shareReplay({ bufferSize: 1, refCount: true })`,
            `);`,
            `// Header, Sidebar & Profile all subscribe:`,
            `// -> Only ONE HTTP GET /api/me is sent!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ef: h('eventSource', 'flattenHub', ['eventSource', 'flattenHub'], { label: 'multicast' }),
          fh: h('flattenHub', 'httpApi', ['flattenHub', 'httpApi'], { label: 'replay cached' }),
        },
        flows: [{ route: ['ef', 'fh'], kind: 'stream', rate: 1.5 }],
      },
    },
    {
      short: 'Flattening Maps',
      chapter: 'execution',
      title: 'Higher-Order Flattening: switchMap vs merge / concat / exhaust',
      body: [
        'RxJS’s signature superpower is flattening nested Observables with exact concurrency semantics:',
        '• <b><code>switchMap</code></b>: Cancels previous in-flight request when a new value arrives (ideal for search/typeahead, prevents race conditions).<br>' +
        '• <b><code>exhaustMap</code></b>: Ignores new clicks while current request is active (prevents double-submit on Pay/Login buttons).<br>' +
        '• <b><code>concatMap</code></b>: Queues sequentially in strict order. • <b><code>mergeMap</code></b>: Runs all concurrently.',
      ],
      callout: {
        kind: 'warning',
        text: 'Never use nested .subscribe() inside .subscribe()! Always flatten with switchMap / exhaustMap / concatMap.',
      },
      changes: ['+ switchMap cancels stale HTTP requests automatically', '+ Race conditions eliminated at stream level'],
      metrics: { streamState: 'Flattening', operatorMode: 'switchMap', inFlightReqs: '1 (Latest wins)', memorySafety: 'No Race Cond.' },
      scene: {
        entities: {
          eventSource: y(-16, -6, { label: 'Keystrokes', tags: [{ text: 'a -> ab -> abc', tone: 'amber', icon: 'zap' }] }),
          flattenHub: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['switchMap()'], sub: 'cancel stale' }),
          httpApi: b(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Search API'], sub: 'only abc runs' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Flattening Concurrency Matrix', [
            `switchMap  -> Cancel old, keep latest (Search / Route params)`,
            `exhaustMap -> Ignore new while busy   (Submit / Login click)`,
            `concatMap  -> Queue in strict order   (Ordered writes)`,
            `mergeMap   -> Parallel fire-and-forget(Independent deletes)`,
          ], { icon: 'terminal' }),
        },
        links: {
          ef: h('eventSource', 'flattenHub', ['eventSource', 'flattenHub'], { label: 'new emission' }),
          fh: h('flattenHub', 'httpApi', ['flattenHub', 'httpApi'], { label: 'abort old, fetch' }),
        },
        flows: [{ route: ['ef', 'fh'], kind: 'cancel', rate: 1.6 }],
      },
    },
    {
      short: 'Time & Combine',
      chapter: 'execution',
      title: 'Time Orchestration: debounceTime & combineLatest',
      body: [
        'Combine <code>debounceTime(300)</code> and <code>distinctUntilChanged()</code> before <code>switchMap</code> to wait until the user pauses typing and skip duplicate queries.',
        'Use <code>combineLatest([filters$, page$])</code> to reactively re-fetch whenever *any* input stream changes, or <code>forkJoin([users$, roles$])</code> to await parallel requests together.',
      ],
      callout: {
        kind: 'tip',
        text: 'A 5-line RxJS pipe replaces dozens of lines of manual setTimeout, AbortController, and boolean loading flags.',
      },
      changes: ['+ debounceTime(300) + distinctUntilChanged() filter noise', '+ combineLatest orchestrates multi-stream dependencies'],
      metrics: { streamState: 'Debounced 300ms', operatorMode: 'combineLatest', inFlightReqs: 'Filtered (-85%)', memorySafety: 'Clean' },
      scene: {
        entities: {
          eventSource: y(-16, -6, { label: 'Search Input', tags: [{ text: 'Rapid Typing', tone: 'blue', icon: 'zap' }] }),
          timeFilter: d(-4, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['debounce(300)'], sub: '300ms + diff' }),
          flattenHub: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['switchMap()'], sub: 'cancel stale' }),
          httpApi: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Backend API'], sub: 'clean query' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Search-as-You-Type Pipeline', [
            `results$ = combineLatest([this.query$, this.filter$]).pipe(`,
            `  debounceTime(300),`,
            `  distinctUntilChanged(),`,
            `  switchMap(([q, f]) => this.api.search(q, f))`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          es: h('eventSource', 'timeFilter', ['eventSource', 'timeFilter'], { label: 'raw keystrokes' }),
          tf: h('timeFilter', 'flattenHub', ['timeFilter', 'flattenHub'], { label: 'settled query' }),
          fh: h('flattenHub', 'httpApi', ['flattenHub', 'httpApi'], { label: 'fetch latest' }),
        },
        flows: [{ route: ['es', 'tf', 'fh'], kind: 'stream', rate: 1.5 }],
      },
    },
    {
      short: 'Error & Cleanup',
      chapter: 'technique',
      title: 'Stream Resilience: catchError, retry & takeUntilDestroyed',
      body: [
        'In RxJS, an uncaught error <b>terminates</b> the Observable permanently. Always place <code>catchError()</code> <b>inside</b> the <code>switchMap</code> inner pipe so a single failed API call returns fallback data without killing the outer search stream!',
        'Pair with <code>takeUntilDestroyed()</code> (backed by <code>DestroyRef</code>) to auto-unsubscribe on component unmount with zero memory leaks.',
      ],
      callout: {
        kind: 'warning',
        text: 'Putting catchError() outside switchMap will kill the search input stream after the very first HTTP 500 error!',
      },
      changes: ['+ Inner catchError() keeps outer stream alive on failure', '+ takeUntilDestroyed() guarantees zero subscription leaks'],
      metrics: { streamState: 'Resilient', operatorMode: 'catchError + retry', inFlightReqs: 'Auto-Retry', memorySafety: '100% Leak-Free' },
      scene: {
        entities: {
          timeFilter: d(-4, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['debounce(300)'], sub: '300ms + diff' }),
          flattenHub: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['switchMap()'], sub: 'inner catch' }),
          httpApi: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Backend API'], sub: 'retry + fallback' }),
          cleanupGate: d(-4, 8, { s: 4.8, h: 52, color: 'rose', glyph: 'shield', label: ['DestroyRef'], sub: 'safe + destroy' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Resilient Stream + Auto Cleanup', [
            `this.query$.pipe(`,
            `  switchMap(q => this.api.search(q).pipe(`,
            `    retry(2),`,
            `    catchError(() => of([])) // Keeps outer stream alive!`,
            `  )),`,
            `  takeUntilDestroyed()`,
            `).subscribe(...);`,
          ], { icon: 'terminal' }),
        },
        links: {
          tf: h('timeFilter', 'flattenHub', ['timeFilter', 'flattenHub'], { label: 'settled query' }),
          fh: h('flattenHub', 'httpApi', ['flattenHub', 'httpApi'], { label: 'inner pipe' }),
          hc: h('httpApi', 'cleanupGate', ['httpApi', 'cleanupGate'], { label: 'takeUntilDestroy' }),
        },
        flows: [{ route: ['tf', 'fh', 'hc'], kind: 'stream', rate: 1.5 }],
      },
    },
    {
      short: 'RxJS + Signals',
      chapter: 'scaling',
      title: 'Hybrid Reactivity: RxJS Orchestration + Signals UI',
      body: [
        'Modern Angular does <b>not</b> replace RxJS with Signals—they solve different problems and work together seamlessly via <code>@angular/core/rxjs-interop</code>:',
        '• <b>RxJS</b> orchestrates asynchronous time, debouncing, WebSockets, race-condition cancellation (<code>switchMap</code>), and retries.<br>' +
        '• <b><code>toSignal()</code> / <code>toObservable()</code></b> bridges the result into glitch-free <b>Signals</b> for synchronous state & Zoneless rendering.',
      ],
      callout: {
        kind: 'insight',
        text: 'Use RxJS for async event orchestration, and Signals for synchronous state & Zoneless template updates!',
      },
      changes: ['+ toSignal() bridges RxJS stream into Signals DAG', '+ Full hybrid reactive pipeline active in Zoneless Angular'],
      metrics: { streamState: 'Hybrid Active', operatorMode: 'toSignal()', inFlightReqs: 'Orchestrated', memorySafety: 'Auto-Managed' },
      scene: {
        entities: {
          eventSource: y(-16, -6, { label: 'Search Input', tags: [{ text: 'Async Events', tone: 'blue', icon: 'zap' }] }),
          timeFilter: d(-4, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['debounce(300)'], sub: '300ms + diff' }),
          flattenHub: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['switchMap()'], sub: 'cancel stale' }),
          httpApi: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Backend API'], sub: '200 OK JSON' }),
          cleanupGate: d(-4, 8, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['toSignal()'], sub: 'RxJS + Signal' }),
          uiConsumer: d(-16, 8, { s: 4.8, h: 52, color: 'green', glyph: 'terminal', label: ['Signals + Ivy'], sub: '60fps DOM' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Hybrid RxJS + Signals Architecture', [
            `query = signal('');`,
            `results = toSignal(`,
            `  toObservable(this.query).pipe(`,
            `    debounceTime(300), distinctUntilChanged(),`,
            `    switchMap(q => this.api.search(q).pipe(catchError(() => of([]))))`,
            `  ), { initialValue: [] }`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          es: h('eventSource', 'timeFilter', ['eventSource', 'timeFilter'], { label: 'toObservable' }),
          tf: h('timeFilter', 'flattenHub', ['timeFilter', 'flattenHub'], { label: 'debounced' }),
          fh: h('flattenHub', 'httpApi', ['flattenHub', 'httpApi'], { label: 'switchMap' }),
          hc: h('httpApi', 'cleanupGate', ['httpApi', 'cleanupGate'], { label: 'toSignal()' }),
          cu: h('cleanupGate', 'uiConsumer', ['cleanupGate', 'uiConsumer'], { label: 'Zoneless DOM' }),
        },
        flows: [
          { route: ['es', 'tf', 'fh'], kind: 'stream', rate: 1.5 },
          { route: ['hc', 'cu'], kind: 'bridge', rate: 1.6 },
        ],
      },
    },
  ],
};
