// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const angularRxjsFlatteningMapsLesson = {
  id: 'angular-rxjs-flattening-maps',
  title: 'RxJS Flattening: switchMap, exhaustMap, concatMap, mergeMap',
  summary: 'Master the 4 most-used RxJS flattening operators: compare how switchMap (cancel stale), exhaustMap (ignore while busy), concatMap (FIFO queue), and mergeMap (parallel fan-out) handle concurrent inner Observables.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['activeOperator', 'concurrencyRule', 'oldInnerTask', 'outputOrder'],
  legend: ['flow', ['active', 'active inner stream'], ['cancel', 'aborted / ignored'], ['parallel', 'concurrent execution']],
  goals: [
    { text: 'The Higher-Order problem: why map() creates Observable<Observable<T>>', step: 1 },
    { text: 'switchMap: cancel previous inner stream (Search / Route params)', step: 2 },
    { text: 'exhaustMap: ignore new triggers while busy (Login / Pay / Submit)', step: 3 },
    { text: 'concatMap: strict FIFO queue preserving order (Sequential writes)', step: 4 },
    { text: 'mergeMap: parallel execution without waiting (Bulk operations)', step: 5 },
    { text: 'Production Decision Matrix: choosing the right *Map every time', step: 6 },
  ],
  steps: [
    {
      short: 'Nested Problem',
      chapter: 'concept',
      title: '1. Why Flattening? The Observable<Observable<T>> Trap',
      body: [
        'If you use plain <code>map(id =&gt; http.get(\'/users/\' + id))</code>, it does <b>not</b> unwrap the HTTP response—it emits a nested <code>Observable&lt;Observable&lt;User&gt;&gt;</code>!',
        'To automatically subscribe to the inner Observable and flatten its emissions into a single <code>Observable&lt;User&gt;</code>, you must choose one of 4 flattening operators: <code>switchMap</code>, <code>exhaustMap</code>, <code>concatMap</code>, or <code>mergeMap</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'All 4 operators flatten Observable<Observable<T>> -> Observable<T>. They differ ONLY in how they handle overlapping arrivals!',
      },
      metrics: { activeOperator: 'map() (Nested)', concurrencyRule: 'Unflattened', oldInnerTask: 'Not subscribed', outputOrder: 'Nested Obs' },
      scene: {
        entities: {
          outerSrc: y(-18, 0, { label: 'outer$', tags: [{ text: 'ID: 1, 2, 3', tone: 'blue', icon: 'zap' }] }),
          operatorHub: d(-4, 0, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['map(id =>', 'http.get)'], sub: 'nested Obs' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'The Nested Observable Problem', [
            `// ❌ BAD: map() returns Observable<Observable<User>>!`,
            `const bad$ = id$.pipe(map(id => this.http.get('/u/' + id)));`,
            `// ✅ GOOD: Flattening operator unwraps inner HTTP stream:`,
            `const good$ = id$.pipe(switchMap(id => this.http.get('/u/' + id)));`,
          ], { icon: 'terminal' }),
        },
        links: {
          uo: h('outerSrc', 'operatorHub', ['outerSrc', 'operatorHub'], { label: 'emit 1, 2, 3' }),
        },
        flows: [{ route: ['uo'], kind: 'active', rate: 1.5 }],
      },
    },
    {
      short: 'switchMap',
      chapter: 'execution',
      title: '2. switchMap: Cancel Previous, Keep Latest (Most Used)',
      body: [
        'When a new outer value arrives while a previous inner Observable is still running, <code>switchMap</code> immediately <b>unsubscribes (aborts)</b> the old inner stream and switches to the new one.',
        '<b>Use when:</b> Search/typeahead, route parameter changes (<code>route.paramMap</code>), or filter/tab switches where stale responses must never overwrite newer UI state.',
      ],
      callout: {
        kind: 'tip',
        text: 'switchMap is the #1 most-used flattening operator in Angular because it eliminates HTTP race conditions automatically.',
      },
      changes: ['+ Req 1 aborted immediately when Req 2 arrives', '+ Only latest Req 2 emits to output$'],
      metrics: { activeOperator: 'switchMap', concurrencyRule: 'Cancel Old', oldInnerTask: 'ABORTED', outputOrder: 'Latest Wins (2)' },
      scene: {
        entities: {
          outerSrc: y(-18, 0, { label: 'query$', tags: [{ text: 'Req 1 -> Req 2', tone: 'blue', icon: 'zap' }] }),
          operatorHub: d(-4, 0, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['switchMap()'], sub: 'cancel old' }),
          workerTop: d(10, -10, { s: 4.4, h: 50, color: 'rose', glyph: 'boxes', label: ['HTTP Req 1'], sub: 'ABORTED' }),
          workerBot: d(10, 10, { s: 4.4, h: 50, color: 'green', glyph: 'boxes', label: ['HTTP Req 2'], sub: 'latest wins' }),
          outputStream: b(22, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['output$'], sub: 'only Req 2' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'switchMap: Search & Route Params', [
            `this.searchControl.valueChanges.pipe(`,
            `  debounceTime(300),`,
            `  switchMap(q => this.api.search(q)) // Aborts stale HTTP!`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          uo: h('outerSrc', 'operatorHub', ['outerSrc', 'operatorHub'], { label: 'emit 1, then 2' }),
          ot: h('operatorHub', 'workerTop', ['operatorHub', 'workerTop'], { label: 'abort Req 1' }),
          ob: h('operatorHub', 'workerBot', ['operatorHub', 'workerBot'], { label: 'switch to 2' }),
          bo: h('workerBot', 'outputStream', ['workerBot', 'outputStream'], { label: 'emit Req 2' }),
        },
        flows: [
          { route: ['uo', 'ot'], kind: 'cancel', rate: 1.4 },
          { route: ['uo', 'ob', 'bo'], kind: 'active', rate: 1.6 },
        ],
      },
    },
    {
      short: 'exhaustMap',
      chapter: 'execution',
      title: '3. exhaustMap: Lock Gate & Ignore While Busy',
      body: [
        '<code>exhaustMap</code> does the exact opposite of <code>switchMap</code>: while an inner Observable is active, it <b>drops/ignores</b> any new outer emissions until the current one finishes.',
        '<b>Use when:</b> Login buttons, Payment / Checkout submit, or Save actions—preventing users from accidentally firing duplicate POST requests by double-clicking.',
      ],
      callout: {
        kind: 'warning',
        text: 'NEVER use switchMap for Payment or Save buttons—a second click would cancel the first request mid-flight!',
      },
      changes: ['+ Click 1 acquires execution lock until completion', '+ Double-click 2 dropped at exhaustMap gate'],
      metrics: { activeOperator: 'exhaustMap', concurrencyRule: 'Lock & Ignore', oldInnerTask: 'Completes (1)', outputOrder: 'First Wins (1)' },
      scene: {
        entities: {
          outerSrc: y(-18, 0, { label: 'payClick$', tags: [{ text: 'Double Click!', tone: 'amber', icon: 'zap' }] }),
          operatorHub: d(-4, 0, { s: 4.8, h: 52, color: 'purple', glyph: 'shield', label: ['exhaustMap()'], sub: 'lock & ignore' }),
          workerTop: d(10, -10, { s: 4.4, h: 50, color: 'green', glyph: 'boxes', label: ['POST /pay #1'], sub: 'completes' }),
          workerBot: d(10, 10, { s: 4.4, h: 50, color: 'slab', glyph: 'boxes', label: ['Click #2'], sub: 'DROPPED' }),
          outputStream: b(22, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['output$'], sub: 'only Click 1' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'exhaustMap: Anti-Double-Submit', [
            `this.payBtnClicks$.pipe(`,
            `  exhaustMap(() => this.api.chargeOrder())`,
            `); // Ignores rapid clicks until chargeOrder() finishes!`,
          ], { icon: 'terminal' }),
        },
        links: {
          uo: h('outerSrc', 'operatorHub', ['outerSrc', 'operatorHub'], { label: 'clicks 1 & 2' }),
          ot: h('operatorHub', 'workerTop', ['operatorHub', 'workerTop'], { label: 'run #1 (locked)' }),
          ob: h('operatorHub', 'workerBot', ['operatorHub', 'workerBot'], { label: 'drop #2' }),
          to: h('workerTop', 'outputStream', ['workerTop', 'outputStream'], { label: 'emit #1' }),
        },
        flows: [
          { route: ['uo', 'ot', 'to'], kind: 'active', rate: 1.5 },
          { route: ['ob'], kind: 'cancel', rate: 1.2 },
        ],
      },
    },
    {
      short: 'concatMap',
      chapter: 'execution',
      title: '4. concatMap: Strict FIFO Queue (Sequential Order)',
      body: [
        '<code>concatMap</code> buffers incoming outer values into a <b>FIFO queue</b> and runs inner Observables strictly <b>one at a time</b>—waiting for Task 1 to complete before starting Task 2.',
        '<b>Use when:</b> Order of execution is mandatory (e.g. sequential database writes, step-by-step file chunks, or ordered animations).',
      ],
      callout: {
        kind: 'insight',
        text: 'concatMap guarantees output order === input order (1 -> 2 -> 3), at the cost of total latency = sum of all tasks.',
      },
      changes: ['+ Tasks queued in FIFO order', '+ Task 2 waits until Task 1 completes'],
      metrics: { activeOperator: 'concatMap', concurrencyRule: '1 at a time (FIFO)', oldInnerTask: 'Runs to end', outputOrder: 'Strict 1 -> 2 -> 3' },
      scene: {
        entities: {
          outerSrc: y(-18, 0, { label: 'saves$', tags: [{ text: '1 -> 2 -> 3', tone: 'blue', icon: 'zap' }] }),
          operatorHub: d(-4, 0, { s: 4.8, h: 52, color: 'amber', glyph: 'boxes', label: ['concatMap()'], sub: 'FIFO queue' }),
          workerTop: d(10, -10, { s: 4.4, h: 50, color: 'green', glyph: 'boxes', label: ['1st: Task 1'], sub: 'runs 1st' }),
          workerMid: d(10, 0, { s: 4.4, h: 50, color: 'cyan', glyph: 'boxes', label: ['2nd: Task 2'], sub: 'waits #1' }),
          workerBot: d(10, 10, { s: 4.4, h: 50, color: 'purple', glyph: 'boxes', label: ['3rd: Task 3'], sub: 'waits #2' }),
          outputStream: b(22, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['output$'], sub: '1 -> 2 -> 3' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'concatMap: Ordered Writes', [
            `from([step1, step2, step3]).pipe(`,
            `  concatMap(step => this.api.saveStep(step))`,
            `); // Always completes step1 -> step2 -> step3 in order!`,
          ], { icon: 'terminal' }),
        },
        links: {
          uo: h('outerSrc', 'operatorHub', ['outerSrc', 'operatorHub'], { label: 'queue 1, 2, 3' }),
          ot: h('operatorHub', 'workerTop', ['operatorHub', 'workerTop'], { label: 'run 1st' }),
          om: h('operatorHub', 'workerMid', ['operatorHub', 'workerMid'], { label: 'then 2nd' }),
          ob: h('operatorHub', 'workerBot', ['operatorHub', 'workerBot'], { label: 'then 3rd' }),
          to: h('workerTop', 'outputStream', ['workerTop', 'outputStream'], { label: 'done #1' }),
          mo: h('workerMid', 'outputStream', ['workerMid', 'outputStream'], { label: 'done #2' }),
          bo: h('workerBot', 'outputStream', ['workerBot', 'outputStream'], { label: 'done #3' }),
        },
        flows: [{ route: ['uo', 'ot', 'to'], kind: 'active', rate: 1.5 }],
      },
    },
    {
      short: 'mergeMap',
      chapter: 'execution',
      title: '5. mergeMap: Parallel Fan-Out (Concurrent Execution)',
      body: [
        '<code>mergeMap</code> (formerly <code>flatMap</code>) immediately subscribes to <b>every</b> inner Observable in parallel without cancelling or queuing. Whichever finishes first emits first!',
        '<b>Use when:</b> Bulk independent operations (e.g. deleting 5 items, uploading multiple files concurrently). Pass a concurrency limit <code>mergeMap(fn, 3)</code> to cap max parallel requests.',
      ],
      callout: {
        kind: 'tip',
        text: 'mergeMap does NOT guarantee output order—if Task 3 is faster than Task 1, output emits 3 before 1.',
      },
      changes: ['+ All 3 inner Observables execute concurrently', '+ Fastest response emits first regardless of arrival order'],
      metrics: { activeOperator: 'mergeMap', concurrencyRule: 'Parallel (N)', oldInnerTask: 'All active', outputOrder: 'Unordered (Fastest)' },
      scene: {
        entities: {
          outerSrc: y(-18, 0, { label: 'deleteIds$', tags: [{ text: 'ID: 1, 2, 3', tone: 'green', icon: 'zap' }] }),
          operatorHub: d(-4, 0, { s: 4.8, h: 52, color: 'green', glyph: 'cpu', label: ['mergeMap()'], sub: 'parallel all' }),
          workerTop: d(10, -10, { s: 4.4, h: 50, color: 'green', glyph: 'boxes', label: ['DELETE #1'], sub: 'parallel 1' }),
          workerMid: d(10, 0, { s: 4.4, h: 50, color: 'green', glyph: 'boxes', label: ['DELETE #2'], sub: 'parallel 2' }),
          workerBot: d(10, 10, { s: 4.4, h: 50, color: 'green', glyph: 'boxes', label: ['DELETE #3'], sub: 'parallel 3' }),
          outputStream: b(22, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['output$'], sub: 'unordered' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'mergeMap: Parallel Fan-Out', [
            `from([id1, id2, id3]).pipe(`,
            `  mergeMap(id => this.api.deleteItem(id), 3) // max 3 parallel`,
            `);`,
          ], { icon: 'terminal' }),
        },
        links: {
          uo: h('outerSrc', 'operatorHub', ['outerSrc', 'operatorHub'], { label: 'fan out 1,2,3' }),
          ot: h('operatorHub', 'workerTop', ['operatorHub', 'workerTop'], { label: 'concurrent 1' }),
          om: h('operatorHub', 'workerMid', ['operatorHub', 'workerMid'], { label: 'concurrent 2' }),
          ob: h('operatorHub', 'workerBot', ['operatorHub', 'workerBot'], { label: 'concurrent 3' }),
          to: h('workerTop', 'outputStream', ['workerTop', 'outputStream'], { label: 'emit #1' }),
          mo: h('workerMid', 'outputStream', ['workerMid', 'outputStream'], { label: 'emit #2' }),
          bo: h('workerBot', 'outputStream', ['workerBot', 'outputStream'], { label: 'emit #3' }),
        },
        flows: [
          { route: ['uo', 'ot', 'to'], kind: 'parallel', rate: 1.5 },
          { route: ['uo', 'om', 'mo'], kind: 'parallel', rate: 1.7 },
          { route: ['uo', 'ob', 'bo'], kind: 'parallel', rate: 1.9 },
        ],
      },
    },
    {
      short: 'Decision Matrix',
      chapter: 'scaling',
      title: '6. Decision Matrix: Choosing the Right Flattening Map',
      body: [
        'Use this 4-question cheat sheet in every Angular feature:<br>' +
        '• Need only the <b>latest</b> result (Search, Filter, Route)? $\\rightarrow$ <b><code>switchMap</code></b><br>' +
        '• Must <b>block double-clicks</b> (Submit, Pay, Login)? $\\rightarrow$ <b><code>exhaustMap</code></b><br>' +
        '• Must preserve <b>exact order</b> (Sequential writes)? $\\rightarrow$ <b><code>concatMap</code></b><br>' +
        '• Want <b>parallel speed</b>, order irrelevant (Bulk)? $\\rightarrow$ <b><code>mergeMap</code></b>',
      ],
      callout: {
        kind: 'insight',
        text: 'Rule of thumb: Start with switchMap for reads/navigation, exhaustMap for user form submits!',
      },
      changes: ['+ Complete 4-operator concurrency decision matrix mastered'],
      metrics: { activeOperator: 'All 4 Mastered', concurrencyRule: 'Context-Driven', oldInnerTask: 'Controlled', outputOrder: 'Deterministic' },
      scene: {
        entities: {
          outerSrc: y(-18, 0, { label: 'Use Case', tags: [{ text: 'Pick *Map', tone: 'purple', icon: 'zap' }] }),
          operatorHub: d(-4, 0, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Decision Hub'], sub: 'pick operator' }),
          workerTop: d(10, -10, { s: 4.4, h: 50, color: 'cyan', glyph: 'boxes', label: ['switchMap'], sub: 'cancel stale' }),
          workerMid: d(10, 0, { s: 4.4, h: 50, color: 'amber', glyph: 'boxes', label: ['concatMap'], sub: 'FIFO order' }),
          workerBot: d(10, 10, { s: 4.4, h: 50, color: 'green', glyph: 'boxes', label: ['mergeMap'], sub: 'parallel' }),
          outputStream: b(22, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Bug-Free UI'], sub: '0 race conds' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'RxJS *Map Cheat Sheet', [
            `switchMap  -> Search / Route / Filter  (Cancel old)`,
            `exhaustMap -> Login / Pay / Submit     (Ignore while busy)`,
            `concatMap  -> Ordered writes / Queue   (Sequential FIFO)`,
            `mergeMap   -> Bulk delete / Upload     (Parallel)`,
          ], { icon: 'terminal' }),
        },
        links: {
          uo: h('outerSrc', 'operatorHub', ['outerSrc', 'operatorHub'], { label: 'match intent' }),
          ot: h('operatorHub', 'workerTop', ['operatorHub', 'workerTop'], { label: 'reads' }),
          om: h('operatorHub', 'workerMid', ['operatorHub', 'workerMid'], { label: 'ordered' }),
          ob: h('operatorHub', 'workerBot', ['operatorHub', 'workerBot'], { label: 'bulk' }),
          to: h('workerTop', 'outputStream', ['workerTop', 'outputStream'], { label: 'latest' }),
          mo: h('workerMid', 'outputStream', ['workerMid', 'outputStream'], { label: 'FIFO' }),
          bo: h('workerBot', 'outputStream', ['workerBot', 'outputStream'], { label: 'fast' }),
        },
        flows: [
          { route: ['uo', 'ot', 'to'], kind: 'active', rate: 1.5 },
          { route: ['uo', 'om', 'mo'], kind: 'active', rate: 1.5 },
          { route: ['uo', 'ob', 'bo'], kind: 'parallel', rate: 1.5 },
        ],
      },
    },
  ],
};
