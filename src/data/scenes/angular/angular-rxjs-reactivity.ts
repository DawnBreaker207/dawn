import {
  makeBlock,
  makeDb,
  makeDevice,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';

export const angularRxjsReactivityLesson = {
  id: 'angular-rxjs-reactivity',
  title: 'RxJS Pipes & Flattening Maps',
  summary: 'Master pure RxJS reactive pipelines: composable .pipe() chains, map/filter/scan/tap, debounceTime/throttleTime/takeUntil, combineLatest/forkJoin/withLatestFrom, all 4 flattening maps (switchMap, exhaustMap, concatMap, mergeMap), Subject multicasting & catchError/retry/finalize.',
  minutes: 35,
  level: 'advanced',
  metrics: ['streamState', 'activePipe', 'concurrency', 'subscription'],
  legend: ['flow', ['stream', 'observable emission'], ['cancel', 'abort / ignore'], ['combine', 'multi-stream / parallel']],
  goals: [
    { text: 'Observable Push Streams & pure .pipe() functional composition', step: 1 },
    { text: 'Transform, Filter & Stateful Accumulator (map, filter, tap, scan)', step: 2 },
    { text: 'Time & Lifecycle Pipes (debounceTime, throttleTime, distinctUntilChanged, takeUntil)', step: 3 },
    { text: 'Multi-Stream Combination (combineLatest, forkJoin, withLatestFrom, merge)', step: 4 },
    { text: 'Flattening Maps Part 1: switchMap (cancel stale) vs exhaustMap (anti-double-click)', step: 5 },
    { text: 'Flattening Maps Part 2: concatMap (FIFO queue), mergeMap (parallel) & Decision Matrix', step: 6 },
    { text: 'Subject Multicasting: Subject, BehaviorSubject & shareReplay(1)', step: 7 },
    { text: 'Error Resilience & Guaranteed Cleanup: catchError, retry & finalize', step: 8 },
  ],
  steps: [
    {
      short: '.pipe() Chain',
      chapter: 'concept',
      title: 'Observable Push Streams & .pipe() Composition',
      body: [
        'In pure RxJS, an <code>Observable</code> is a lazy push stream of <code>0..N</code> values over time. Nothing executes until <code>.subscribe()</code> is called.',
        '<code>.pipe(op1(), op2())</code> composes pure operator functions: each operator wraps the upstream Observable, transforms emissions, and returns a <b>new immutable Observable</b>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Think of .pipe() as an assembly line of pure functions—data flows one way from source -> operators -> observer.',
      },
      metrics: { streamState: 'Lazy -> Active', activePipe: '.pipe(op1, op2)', concurrency: 'Unicast', subscription: 'Subscribed' },
      scene: {
        entities: {
          sourceStream: makeDevice(-16, -6, { label: 'source$', tags: [{ text: 'fromEvent / of', tone: 'purple', icon: 'zap' }] }),
          pipeStage: makeBlock(-4, -6, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['.pipe() Chain'], sub: 'pure .pipe()' }),
          observerOut: makeDb(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Observer'], sub: 'next/err/done' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Pure .pipe() Composition', [
            `const stream$ = fromEvent(input, 'input').pipe(`,
            `  map(e => (e.target as HTMLInputElement).value),`,
            `  filter(text => text.length >= 2)`,
            `);`,
            `const sub = stream$.subscribe(val => console.log(val));`,
          ], { icon: 'terminal' }),
        },
        links: {
          sp: makeLink('sourceStream', 'pipeStage', ['sourceStream', 'pipeStage'], { label: 'emit raw event' }),
          po: makeLink('pipeStage', 'observerOut', ['pipeStage', 'observerOut'], { label: 'subscribe()' }),
        },
        flows: [{ route: ['sp', 'po'], kind: 'stream', rate: 1.5 }],
      },
    },
    {
      short: 'map / filter / scan',
      chapter: 'concept',
      title: 'Transform, Filter & Stateful Accumulator (scan)',
      body: [
        '• <b><code>map()</code> / <code>filter()</code></b>: Transform (1-to-1) or drop values mid-flight.<br>' +
        '• <b><code>tap()</code></b>: Inspect/log emissions without altering the stream.<br>' +
        '• <b><code>scan((acc, val) =&gt; ..., seed)</code></b>: Like <code>Array.reduce</code> over time—maintains reactive state across emissions!',
      ],
      callout: {
        kind: 'tip',
        text: 'map() is the single most-used operator in RxJS, appearing in 80-90% of all .pipe() chains.',
      },
      changes: ['+ filter() drops invalid values early', '+ scan() accumulates state reactively across emissions'],
      metrics: { streamState: 'Transforming', activePipe: 'map/filter/scan', concurrency: 'Synchronous', subscription: 'Active' },
      scene: {
        entities: {
          sourceStream: makeDevice(-16, -6, { label: 'clicks$', tags: [{ text: '+1 / +5 / -1', tone: 'blue', icon: 'zap' }] }),
          pipeStage: makeBlock(-4, -6, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['filter + map'], sub: 'map/scan/tap' }),
          statePipe: makeBlock(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'boxes', label: ['scan(acc, v)'], sub: 'stateful sum' }),
          observerOut: makeDb(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['State Stream'], sub: '0 -> 1 -> 6' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Stateful scan() in .pipe()', [
            `const total$ = delta$.pipe(`,
            `  filter(n => n !== 0),`,
            `  tap(n => console.log('delta:', n)),`,
            `  scan((acc, n) => acc + n, 0),`,
            `  startWith(0)`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          sp: makeLink('sourceStream', 'pipeStage', ['sourceStream', 'pipeStage'], { label: 'raw deltas' }),
          ps: makeLink('pipeStage', 'statePipe', ['pipeStage', 'statePipe'], { label: 'filtered' }),
          so: makeLink('statePipe', 'observerOut', ['statePipe', 'observerOut'], { label: 'emit acc' }),
        },
        flows: [{ route: ['sp', 'ps', 'so'], kind: 'stream', rate: 1.5 }],
      },
    },
    {
      short: 'Time & takeUntil',
      chapter: 'execution',
      title: 'Time & Lifecycle Pipes: debounceTime, throttleTime, takeUntil',
      body: [
        '• <b><code>debounceTime(300)</code></b>: Emits only after 300ms of silence (search input).<br>' +
        '• <b><code>throttleTime(1000)</code></b>: Emits at most once per 1000ms (scroll/click spam).<br>' +
        '• <b><code>distinctUntilChanged()</code></b>: Drops consecutive duplicates.<br>' +
        '• <b><code>takeUntil(destroy$)</code></b>: Auto-completes the stream when notifier fires.',
      ],
      callout: {
        kind: 'insight',
        text: 'distinctUntilChanged() after debounceTime(300) drops redundant queries when typing "abc" -> "abcd" -> "abc" within 300ms.',
      },
      changes: ['+ debounceTime + distinctUntilChanged filter noise', '+ takeUntil() guarantees deterministic completion'],
      metrics: { streamState: 'Time-Gated', activePipe: 'debounceTime', concurrency: 'Rate-Limited', subscription: 'Auto-Complete' },
      scene: {
        entities: {
          sourceStream: makeDevice(-16, -6, { label: 'input$', tags: [{ text: 'Rapid Events', tone: 'amber', icon: 'zap' }] }),
          pipeStage: makeBlock(-4, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['debounce(300)'], sub: 'debounce/take' }),
          statePipe: makeBlock(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'boxes', label: ['distinctUntil'], sub: 'dedupe ===' }),
          observerOut: makeDb(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Clean Stream'], sub: '-85% noise' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Time & Lifecycle Operators', [
            `search$.pipe(`,
            `  debounceTime(300),`,
            `  distinctUntilChanged(),`,
            `  takeUntil(destroy$)`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          sp: makeLink('sourceStream', 'pipeStage', ['sourceStream', 'pipeStage'], { label: 'burst events' }),
          ps: makeLink('pipeStage', 'statePipe', ['pipeStage', 'statePipe'], { label: '300ms quiet' }),
          so: makeLink('statePipe', 'observerOut', ['statePipe', 'observerOut'], { label: 'unique value' }),
        },
        flows: [{ route: ['sp', 'ps', 'so'], kind: 'stream', rate: 1.5 }],
      },
    },
    {
      short: 'Multi-Stream Join',
      chapter: 'execution',
      title: 'Combination: combineLatest, forkJoin, withLatestFrom & merge',
      body: [
        '• <b><code>combineLatest([a$, b$])</code></b>: Emits <code>[a, b]</code> whenever *either* emits.<br>' +
        '• <b><code>forkJoin([a$, b$])</code></b>: Waits for all to complete (like <code>Promise.all</code>).<br>' +
        '• <b><code>a$.pipe(withLatestFrom(b$))</code></b>: Triggers ONLY on <code>a$</code>, sampling latest <code>b$</code>.<br>' +
        '• <b><code>merge(a$, b$)</code></b>: Interleaves both as they arrive.',
      ],
      callout: {
        kind: 'tip',
        text: 'Use withLatestFrom() when clicking Submit should read the latest Form state without re-triggering on keystrokes!',
      },
      changes: ['+ Multiple independent streams joined declaratively'],
      metrics: { streamState: 'Synchronized', activePipe: 'combineLatest', concurrency: 'Multi-Stream', subscription: 'Active' },
      scene: {
        entities: {
          sourceStream: makeDevice(-16, -6, { label: 'filter$', tags: [{ text: 'Stream A', tone: 'blue', icon: 'zap' }] }),
          pipeStage: makeBlock(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['combineLatest'], sub: 'combineLatest' }),
          streamB: makeDevice(-16, 8, { label: 'page$', tags: [{ text: 'Stream B', tone: 'cyan', icon: 'zap' }] }),
          observerOut: makeDb(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['[filter, page]'], sub: 'tuple output' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Combination Operators', [
            `combineLatest([filter$, page$])     // Any changes`,
            `forkJoin({ user: user$, roles: roles$ }) // All complete`,
            `click$.pipe(withLatestFrom(form$))   // Sample B on A`,
          ], { icon: 'terminal' }),
        },
        links: {
          sp: makeLink('sourceStream', 'pipeStage', ['sourceStream', 'pipeStage'], { label: 'stream A' }),
          bp: makeLink('streamB', 'pipeStage', ['streamB', 'pipeStage'], { label: 'stream B' }),
          po: makeLink('pipeStage', 'observerOut', ['pipeStage', 'observerOut'], { label: 'emit [A, B]' }),
        },
        flows: [
          { route: ['sp', 'po'], kind: 'combine', rate: 1.5 },
          { route: ['bp', 'po'], kind: 'combine', rate: 1.3 },
        ],
      },
    },
    {
      short: 'switch vs exhaust',
      chapter: 'technique',
      title: 'Flattening Maps: switchMap vs exhaustMap (Most Used)',
      body: [
        'Plain <code>map(id =&gt; http.get())</code> produces nested <code>Observable&lt;Observable&lt;T&gt;&gt;</code>! Use flattening operators to unwrap:<br>' +
        '• <b><code>switchMap</code> (#1 Most Used):</b> Immediately <b>aborts/cancels</b> the previous inner stream when a new value arrives (Search, Route params).<br>' +
        '• <b><code>exhaustMap</code>:</b> <b>Ignores/drops</b> new outer clicks while current inner stream is running (Login, Pay, Submit).',
      ],
      callout: {
        kind: 'warning',
        text: 'Use switchMap for reads/search (cancel stale); use exhaustMap for submits/payments (block double-clicks)!',
      },
      changes: ['+ switchMap aborts stale Req 1 when Req 2 arrives', '+ exhaustMap drops duplicate Click 2 while Req 1 runs'],
      metrics: { streamState: 'Flattening', activePipe: 'switchMap()', concurrency: '1 Active', subscription: 'Race-Free' },
      scene: {
        entities: {
          outerSrc: makeDevice(-18, 0, { label: 'query$', tags: [{ text: 'Req 1 -> Req 2', tone: 'blue', icon: 'zap' }] }),
          operatorHub: makeBlock(-4, 0, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['switchMap()'], sub: 'cancel old' }),
          workerTop: makeBlock(10, -10, { s: 4.4, h: 50, color: 'rose', glyph: 'boxes', label: ['HTTP Req 1'], sub: 'ABORTED' }),
          workerBot: makeBlock(10, 10, { s: 4.4, h: 50, color: 'green', glyph: 'boxes', label: ['HTTP Req 2'], sub: 'latest wins' }),
          outputStream: makeDb(22, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['output$'], sub: 'only Req 2' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'switchMap vs exhaustMap', [
            `// Search / Route (Cancel stale):`,
            `query$.pipe(debounceTime(300), switchMap(q => api.search(q)))`,
            `// Pay / Login (Ignore double-click):`,
            `payClick$.pipe(exhaustMap(() => api.chargeOrder()))`,
          ], { icon: 'terminal' }),
        },
        links: {
          uo: makeLink('outerSrc', 'operatorHub', ['outerSrc', 'operatorHub'], { label: 'emit 1, then 2' }),
          ot: makeLink('operatorHub', 'workerTop', ['operatorHub', 'workerTop'], { label: 'abort Req 1' }),
          ob: makeLink('operatorHub', 'workerBot', ['operatorHub', 'workerBot'], { label: 'switch to 2' }),
          bo: makeLink('workerBot', 'outputStream', ['workerBot', 'outputStream'], { label: 'emit Req 2' }),
        },
        flows: [
          { route: ['uo', 'ot'], kind: 'cancel', rate: 1.4 },
          { route: ['uo', 'ob', 'bo'], kind: 'stream', rate: 1.6 },
        ],
      },
    },
    {
      short: 'concat vs merge',
      chapter: 'technique',
      title: 'Flattening Maps: concatMap (FIFO) vs mergeMap (Parallel)',
      body: [
        '• <b><code>concatMap</code> (Strict FIFO Queue):</b> Buffers emissions and runs inner streams strictly <b>one at a time</b> in order (<code>1 -> 2 -> 3</code>). Ideal for sequential writes.<br>' +
        '• <b><code>mergeMap</code> (Parallel Fan-Out):</b> Subscribes to <b>all</b> inner streams concurrently (optional cap <code>mergeMap(fn, 3)</code>); fastest finishes first (bulk deletes/uploads).',
      ],
      callout: {
        kind: 'insight',
        text: 'Decision Matrix: switchMap (latest read), exhaustMap (anti-double-submit), concatMap (FIFO order), mergeMap (parallel bulk).',
      },
      changes: ['+ concatMap preserves strict 1 -> 2 -> 3 FIFO order', '+ mergeMap fans out concurrently across parallel workers'],
      metrics: { streamState: 'Concurrent', activePipe: 'concat / merge', concurrency: 'FIFO vs Parallel', subscription: 'Deterministic' },
      scene: {
        entities: {
          outerSrc: makeDevice(-18, 0, { label: 'tasks$', tags: [{ text: '1, 2, 3', tone: 'green', icon: 'zap' }] }),
          operatorHub: makeBlock(-4, 0, { s: 4.8, h: 52, color: 'green', glyph: 'cpu', label: ['mergeMap()'], sub: 'parallel / FIFO' }),
          workerTop: makeBlock(10, -10, { s: 4.4, h: 50, color: 'green', glyph: 'boxes', label: ['Worker #1'], sub: 'task 1' }),
          workerMid: makeBlock(10, 0, { s: 4.4, h: 50, color: 'cyan', glyph: 'boxes', label: ['Worker #2'], sub: 'task 2' }),
          workerBot: makeBlock(10, 10, { s: 4.4, h: 50, color: 'purple', glyph: 'boxes', label: ['Worker #3'], sub: 'task 3' }),
          outputStream: makeDb(22, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['output$'], sub: 'flattened' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'concatMap vs mergeMap', [
            `concatMap -> 1 at a time FIFO (Sequential saves)`,
            `mergeMap  -> All in parallel  (Bulk deletes, max N)`,
          ], { icon: 'terminal' }),
        },
        links: {
          uo: makeLink('outerSrc', 'operatorHub', ['outerSrc', 'operatorHub'], { label: 'emit 1, 2, 3' }),
          ot: makeLink('operatorHub', 'workerTop', ['operatorHub', 'workerTop'], { label: 'task 1' }),
          om: makeLink('operatorHub', 'workerMid', ['operatorHub', 'workerMid'], { label: 'task 2' }),
          ob: makeLink('operatorHub', 'workerBot', ['operatorHub', 'workerBot'], { label: 'task 3' }),
          to: makeLink('workerTop', 'outputStream', ['workerTop', 'outputStream'], { label: 'emit #1' }),
          mo: makeLink('workerMid', 'outputStream', ['workerMid', 'outputStream'], { label: 'emit #2' }),
          bo: makeLink('workerBot', 'outputStream', ['workerBot', 'outputStream'], { label: 'emit #3' }),
        },
        flows: [
          { route: ['uo', 'ot', 'to'], kind: 'combine', rate: 1.5 },
          { route: ['uo', 'om', 'mo'], kind: 'combine', rate: 1.7 },
          { route: ['uo', 'ob', 'bo'], kind: 'combine', rate: 1.9 },
        ],
      },
    },
    {
      short: 'Subject & shareReplay',
      chapter: 'scaling',
      title: 'Subject Multicasting & shareReplay(1)',
      body: [
        '• <b><code>Subject</code> / <code>BehaviorSubject(init)</code> / <code>ReplaySubject(n)</code></b>: Act as both Observer and Observable for hot event buses and reactive state.<br>' +
        '• <b><code>shareReplay({ bufferSize: 1, refCount: true })</code></b>: Turns a cold unicast HTTP Observable into a hot multicast cache—3 subscribers share 1 network call!',
      ],
      callout: {
        kind: 'tip',
        text: 'Always set refCount: true in shareReplay(1) so the underlying stream tears down when the last subscriber unsubscribes.',
      },
      changes: ['+ Cold unicast stream converted to Hot multicast', '+ 3 subscribers share single cached HTTP emission'],
      metrics: { streamState: 'Hot Multicast', activePipe: 'shareReplay(1)', concurrency: '1 Shared Call', subscription: 'refCount: true' },
      scene: {
        entities: {
          sourceStream: makeDevice(-16, -6, { label: 'BehaviorSubj', tags: [{ text: 'Hot Multicast', tone: 'purple', icon: 'zap' }] }),
          pipeStage: makeBlock(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['shareReplay(1)'], sub: 'multicast cache' }),
          observerOut: makeDb(8, -6, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['N Subscribers'], sub: '1 shared req' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Hot Multicasting', [
            `user$ = this.http.get<User>('/api/me').pipe(`,
            `  shareReplay({ bufferSize: 1, refCount: true })`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          sp: makeLink('sourceStream', 'pipeStage', ['sourceStream', 'pipeStage'], { label: 'multicast' }),
          po: makeLink('pipeStage', 'observerOut', ['pipeStage', 'observerOut'], { label: 'replay cached' }),
        },
        flows: [{ route: ['sp', 'po'], kind: 'stream', rate: 1.5 }],
      },
    },
    {
      short: 'catchError & finalize',
      chapter: 'scaling',
      title: 'Error Resilience: catchError, retry & finalize',
      body: [
        'An uncaught error <b>terminates</b> an Observable forever. Always place <code>catchError()</code> <b>inside</b> <code>switchMap</code> so a failed HTTP call returns fallback data without killing the outer stream.',
        'Pair with <code>retry({ count: 2, delay: 1000 })</code> and <code>finalize(() =&gt; loading = false)</code>—which runs on completion, error, AND unsubscription.',
      ],
      callout: {
        kind: 'warning',
        text: 'Putting catchError() outside switchMap kills your search input stream after the first HTTP 500 error!',
      },
      changes: ['+ Inner catchError + retry protect outer stream', '+ finalize() guarantees loading state cleanup'],
      metrics: { streamState: 'Resilient', activePipe: 'catch + finalize', concurrency: 'Auto-Retry', subscription: 'Guaranteed Clean' },
      scene: {
        entities: {
          sourceStream: makeDevice(-16, -6, { label: 'trigger$', tags: [{ text: 'Fault-Tolerant', tone: 'rose', icon: 'zap' }] }),
          pipeStage: makeBlock(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['switchMap()'], sub: 'inner pipe' }),
          resilience: makeBlock(8, -6, { s: 4.8, h: 52, color: 'rose', glyph: 'shield', label: ['catch + retry'], sub: 'catch/finalize' }),
          observerOut: makeDb(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Safe Output'], sub: 'stream alive' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Fault-Tolerant Pipeline', [
            `trigger$.pipe(`,
            `  switchMap(id => fetch$(id).pipe(`,
            `    retry({ count: 2, delay: 1000 }),`,
            `    catchError(() => of(FALLBACK)),`,
            `    finalize(() => setLoading(false))`,
            `  ))`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          sp: makeLink('sourceStream', 'pipeStage', ['sourceStream', 'pipeStage'], { label: 'emit id' }),
          pr: makeLink('pipeStage', 'resilience', ['pipeStage', 'resilience'], { label: 'guard errors' }),
          ro: makeLink('resilience', 'observerOut', ['resilience', 'observerOut'], { label: 'safe fallback' }),
        },
        flows: [{ route: ['sp', 'pr', 'ro'], kind: 'stream', rate: 1.5 }],
      },
    },
  ],
};
