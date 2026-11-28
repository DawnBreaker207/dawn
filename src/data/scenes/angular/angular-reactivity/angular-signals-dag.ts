import {
  makeBlock,
  makeDb,
  makeDevice,
  makeLink,
  makePanel
} from '@/lib/simulator/scene-builders';

export const angularSignalsDagLesson = {
  id: 'angular-signals-dag',
  title: 'Signals & Push-Pull DAG',
  summary: 'Understand the Angular Signals reactive algorithm. Trace how signal producers notify consumers via push notifications, and how computed values pull dependencies lazily with glitch-free dynamic DAG tracking.',
  minutes: 25,
  level: 'advanced',
  metrics: ['graphState', 'producerVersion', 'consumerState', 'glitchFree'],
  legend: ['flow', ['push', 'dirty mark push'], ['pull', 'lazy value pull'], ['glitch', 'diamond graph resolution'], ['effect', 'scheduler effect']],
  goals: [
    { text: 'Signals Reactive Graph (DAG) construction', step: 1 },
    { text: 'Two-Phase Push-Pull: Dirty notification push vs Lazy evaluation pull', step: 2 },
    { text: 'Dynamic dependency tracking: dynamic branch edge addition and pruning', step: 3 },
    { text: 'Glitch-Free guarantee: solving the diamond dependency dilemma', step: 4 },
    { text: 'Reactive side effects: effect() execution and cleanup callbacks', step: 5 },
    { text: 'Signal-to-RxJS Interoperability: toSignal() and toObservable()', step: 6 },
    { text: 'Signal Component APIs: input(), output(), model() & viewChild()', step: 7 },
    { text: 'Modern derived & async state: linkedSignal() & resource()/rxResource()', step: 8 },
  ],
  steps: [
    {
      short: 'Graph Topology',
      chapter: 'concept',
      title: 'The Reactive Directed Acyclic Graph (DAG)',
      body: [
        'Angular Signals establish a <b>Directed Acyclic Graph (DAG)</b> connecting <b>Producers</b> (writable <code>signal()</code>) and <b>Consumers</b> (<code>computed()</code>, <code>effect()</code>, template bindings).',
        'Unlike RxJS which pushes values eagerly through pipeline operators, Angular Signals use a two-phase <b>Push-Pull</b> reactive algorithm.',
      ],
      callout: {
        kind: 'insight',
        text: 'A signal is a getter function that returns a value and registers the active consumer in its internal dependency list.',
      },
      metrics: { graphState: 'DAG Built', producerVersion: 'v1', consumerState: 'Clean', glitchFree: '100% Guaranteed' },
      scene: {
        entities: {
          priceSignal: makeDevice(-16, -8, { label: 'price = 10', tags: [{ text: 'WritableSignal', tone: 'blue', icon: 'zap' }] }),
          taxSignal: makeDevice(-16, 8, { label: 'taxRate = 0.2', tags: [{ text: 'WritableSignal', tone: 'purple', icon: 'zap' }] }),
          computedNode: makeBlock(0, 0, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['tax = computed()'], sub: 'tax: $2.00' }),
          consumerEffect: makeDb(16, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['total = computed()'], sub: 'total: $12.00' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Signals Reactive Graph', [
            `const price = signal(10);`,
            `const taxRate = signal(0.2);`,
            `const tax = computed(() => price() * taxRate());`,
            `const total = computed(() => price() + tax());`,
            `// Graph edges:`,
            `// price -> tax`,
            `// price -> total`,
            `// tax -> total`,
            `= Directed Acyclic Graph (DAG) constructed`,
          ], { icon: 'terminal' }),
        },
        links: {
          pt: makeLink('priceSignal', 'computedNode', ['priceSignal', 'computedNode'], { label: 'track price' }),
          rt: makeLink('taxSignal', 'computedNode', ['taxSignal', 'computedNode'], { label: 'track rate' }),
          tc: makeLink('computedNode', 'consumerEffect', ['computedNode', 'consumerEffect'], { label: 'track tax' }),
        },
        flows: [
          { route: ['pt', 'tc'], kind: 'push', rate: 1.5 },
          { route: ['rt'], kind: 'push', rate: 1.2 },
        ],
      },
    },
    {
      short: 'Push-Pull',
      chapter: 'concept',
      title: 'Two-Phase Push-Pull: Dirty Push vs Lazy Pull',
      body: [
        'When <code>price.set(20)</code> is called, Angular does <b>NOT</b> immediately recompute the downstream computed values!',
        '<b>Phase 1 (Push)</b>: The producer pushes a lightweight dirty notification down the graph, marking downstream consumers as <code>DIRTY</code>.',
        '<b>Phase 2 (Pull)</b>: Downstream consumers recompute lazily <b>only when their value is actually read</b> by code or template.',
      ],
      callout: {
        kind: 'tip',
        text: 'If a computed value is never read in the current view, it is never computed. Zero wasted calculations!',
      },
      changes: ['+ price updated to 20', '+ Dirty bit pushed down DAG; values computed lazily on read'],
      metrics: { graphState: 'Dirty Flagged', producerVersion: 'v2', consumerState: 'DIRTY (Uncomputed)', glitchFree: 'Guaranteed' },
      scene: {
        entities: {
          priceSignal: makeDevice(-16, -8, { label: 'price.set(20)', tags: [{ text: 'version v2', tone: 'green', icon: 'zap' }] }),
          taxSignal: makeDevice(-16, 8, { label: 'taxRate = 0.2', tags: [{ text: 'WritableSignal', tone: 'purple', icon: 'zap' }] }),
          computedNode: makeBlock(0, 0, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['tax = computed()'], sub: 'marked DIRTY' }),
          consumerEffect: makeDb(16, 0, { s: 4.6, h: 48, color: 'cyan', glyph: 'server', label: ['total = computed()'], sub: 'pulls on read' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Push-Pull Algorithm Execution', [
            `1. price.set(20) [PUSH PHASE]:`,
            `   - price increments version to v2`,
            `   - pushes "dirty" notification to tax and total`,
            `2. total() is read in template [PULL PHASE]:`,
            `   - total checks dependencies: price is v2 -> pull new value`,
            `   - tax is dirty -> recomputes tax to 4`,
            `   - total calculates 20 + 4 = 24`,
          ], { icon: 'terminal' }),
        },
        links: {
          pt: makeLink('priceSignal', 'computedNode', ['priceSignal', 'computedNode'], { label: 'push dirty flag' }),
          tc: makeLink('computedNode', 'consumerEffect', ['computedNode', 'consumerEffect'], { label: 'lazy value pull' }),
        },
        flows: [{ route: ['pt', 'tc'], kind: 'pull', rate: 1.5 }],
      },
    },
    {
      short: 'Dynamic Tracking',
      chapter: 'technique',
      title: 'Dynamic Dependency Tracking: Pruning Stale Edges',
      body: [
        'In Signals, dependencies are tracked <b>dynamically during execution</b>, not statically.',
        'Consider <code>computed(() =&gt; showDetails() ? userDetails() : summary())</code>. When <code>showDetails()</code> is false, <code>userDetails</code> is completely unlinked from the DAG! Updates to <code>userDetails</code> will NOT notify the computed signal.',
      ],
      callout: {
        kind: 'insight',
        text: 'Dynamic tracking completely prevents ghost dependency leaks that plague static reactive frameworks.',
      },
      changes: ['+ Conditional branch toggled', '+ Inactive branch dependencies unlinked from DAG'],
      metrics: { graphState: 'Dynamic DAG', producerVersion: 'v2', consumerState: 'Clean', glitchFree: 'Pruned' },
      scene: {
        entities: {
          priceSignal: makeDevice(-16, -8, { label: 'showDetails', tags: [{ text: 'false', tone: 'rose', icon: 'zap' }] }),
          taxSignal: makeDevice(-16, 8, { label: 'summary()', tags: [{ text: 'active branch', tone: 'green', icon: 'zap' }] }),
          computedNode: makeBlock(0, 0, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['info = computed'], sub: 'dynamic graph' }),
          consumerEffect: makeDb(16, 0, { s: 4.6, h: 48, color: 'slab', glyph: 'server', label: ['details()'], sub: 'unlinked edge' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Dynamic Dependency Tracking', [
            `const info = computed(() => {`,
            `  if (this.showDetails()) {`,
            `    return this.details(); // Dependency active`,
            `  }`,
            `  return this.summary(); // details() is UNLINKED from DAG!`,
            `});`,
            `// If details() updates now, info is NOT triggered!`,
          ], { icon: 'terminal' }),
        },
        links: {
          pt: makeLink('priceSignal', 'computedNode', ['priceSignal', 'computedNode'], { label: 'read condition' }),
          xt: makeLink('taxSignal', 'computedNode', ['taxSignal', 'computedNode'], { label: 'active branch edge' }),
          cd: makeLink('computedNode', 'consumerEffect', ['computedNode', 'consumerEffect'], { label: 'severed branch' }),
        },
        flows: [{ route: ['xt'], kind: 'push', rate: 1.5 }],
      },
    },
    {
      short: 'Glitch-Free',
      chapter: 'technique',
      title: 'Glitch-Free Guarantee: The Diamond Problem Solved',
      body: [
        'In naive reactive systems with diamond dependencies (<code>A -&gt; B, A -&gt; C, (B, C) -&gt; D</code>), modifying <code>A</code> causes <code>D</code> to temporarily re-evaluate with <code>B_new</code> and <code>C_old</code>, causing an inconsistent intermediate state called a <b>glitch</b>.',
        'Angular Signals solve this: the pull phase topologically sorts dependencies, ensuring <code>D</code> is evaluated ONLY once both <code>B</code> and <code>C</code> are up to date.',
      ],
      callout: {
        kind: 'insight',
        text: 'Signals guarantee mathematically that intermediate inconsistent states are never observable by user code or templates.',
      },
      changes: ['+ Diamond dependency evaluated atomically in topological order', '+ Zero intermediate glitches'],
      metrics: { graphState: 'Topological Sort', producerVersion: 'v2', consumerState: 'Glitch-Free', glitchFree: '100% Clean' },
      scene: {
        entities: {
          priceSignal: makeDevice(-14, 0, { label: 'price.set(20)', tags: [{ text: 'Node A Root', tone: 'blue', icon: 'zap' }] }),
          taxComp: makeBlock(0, -10, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['tax (Node B)'], sub: 'recomputed 1st' }),
          discountComp: makeBlock(0, 10, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['disc (Node C)'], sub: 'recomputed 2nd' }),
          consumerEffect: makeDb(14, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['total (Node D)'], sub: 'evaluates once' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'The Diamond Problem & Fix', [
            `Diamond Topology:`,
            `       [Price]`,
            `       /     \\`,
            `  [Tax]       [Discount]`,
            `       \\     /`,
            `       [Total]`,
            `Naive: Total evaluates twice (glitch: old Discount + new Tax)`,
            `Signals: Total evaluates ONCE with both updated! (Glitch-Free)`,
          ], { icon: 'terminal' }),
        },
        links: {
          px: makeLink('priceSignal', 'taxComp', ['priceSignal', 'taxComp'], { label: 'mark dirty B' }),
          pd: makeLink('priceSignal', 'discountComp', ['priceSignal', 'discountComp'], { label: 'mark dirty C' }),
          tt: makeLink('taxComp', 'consumerEffect', ['taxComp', 'consumerEffect'], { label: 'topological 1' }),
          dt: makeLink('discountComp', 'consumerEffect', ['discountComp', 'consumerEffect'], { label: 'topological 2' }),
        },
        flows: [
          { route: ['px', 'tt'], kind: 'glitch', rate: 1.5 },
          { route: ['pd', 'dt'], kind: 'glitch', rate: 1.5 },
        ],
      },
    },
    {
      short: 'effect() Lifecycle',
      chapter: 'execution',
      title: 'Reactive Effects & Cleanup (effect())',
      body: [
        '<code>effect()</code> runs side effects when signal dependencies change (e.g. syncing to localStorage, logging, or charting).',
        'Effects execute asynchronously inside the scheduler microtask queue and support an <code>onCleanup</code> callback to cancel timers or abort pending HTTP requests.',
      ],
      callout: {
        kind: 'warning',
        text: 'Never mutate signals inside an effect without allowSignalWrites: true, as this can trigger infinite cycles.',
      },
      changes: ['+ effect() registered in Injection Context', '+ onCleanup callback armed for next cycle'],
      metrics: { graphState: 'Effect Armed', producerVersion: 'v2', consumerState: 'Executed', glitchFree: 'Active' },
      scene: {
        entities: {
          priceSignal: makeDevice(-16, 0, { label: 'themeSignal', tags: [{ text: 'dark-theme', tone: 'blue', icon: 'zap' }] }),
          taxComp: makeBlock(0, 0, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['effect() Runner'], sub: 'microtask run' }),
          consumerEffect: makeDb(16, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['localStorage'], sub: 'side effect' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'effect() Implementation', [
            `effect((onCleanup) => {`,
            `  const currentTheme = this.theme();`,
            `  localStorage.setItem('theme', currentTheme);`,
            `  document.body.className = currentTheme;`,
            ``,
            `  onCleanup(() => {`,
            `    console.log('Cleaning up previous effect pass...');`,
            `  });`,
            `});`,
          ], { icon: 'terminal' }),
        },
        links: {
          pt: makeLink('priceSignal', 'taxComp', ['priceSignal', 'taxComp'], { label: 'notify scheduler' }),
          tc: makeLink('taxComp', 'consumerEffect', ['taxComp', 'consumerEffect'], { label: 'execute side effect' }),
        },
        flows: [{ route: ['pt', 'tc'], kind: 'effect', rate: 1.5 }],
      },
    },
    {
      short: 'RxJS Interop',
      chapter: 'scaling',
      title: 'Signal-to-RxJS Interop (toSignal & toObservable)',
      body: [
        'Angular provides <code>@angular/core/rxjs-interop</code> for seamless bridging between RxJS streams and Signals:',
        '<code>toSignal(obs$)</code> converts an asynchronous stream into a synchronous signal with automatic subscription management.',
        '<code>toObservable(sig)</code> turns any signal into an RxJS Observable that emits whenever the signal changes.',
      ],
      callout: {
        kind: 'tip',
        text: 'Use RxJS for asynchronous events (debouncing, websockets, cancellation), and use Signals for synchronous UI state.',
      },
      changes: ['+ Seamless bridge between RxJS pipelines and Signals DAG established'],
      metrics: { graphState: 'Unified Reactive', producerVersion: 'v2', consumerState: 'Bridged', glitchFree: '100% Interop' },
      scene: {
        entities: {
          priceSignal: makeDevice(-16, 0, { label: 'http.get()', tags: [{ text: 'RxJS Observable', tone: 'purple', icon: 'zap' }] }),
          taxComp: makeBlock(0, 0, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['toSignal(obs$)'], sub: 'auto bridge' }),
          consumerEffect: makeDb(16, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['usersSignal()'], sub: 'signal in DOM' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'RxJS Interop Code', [
            `import { toSignal, toObservable } from '@angular/core/rxjs-interop';`,
            ``,
            `// Convert Observable to Signal:`,
            `users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });`,
            ``,
            `// Convert Signal to Observable:`,
            `query$ = toObservable(this.searchQuery);`,
          ], { icon: 'terminal' }),
        },
        links: {
          pt: makeLink('priceSignal', 'taxComp', ['priceSignal', 'taxComp'], { label: 'pipe stream' }),
          tc: makeLink('taxComp', 'consumerEffect', ['taxComp', 'consumerEffect'], { label: 'expose signal' }),
        },
        flows: [{ route: ['pt', 'tc'], kind: 'pull', rate: 1.6 }],
      },
    },
    {
      short: 'Signal APIs',
      chapter: 'scaling',
      title: 'Signal Component APIs: input(), model(), output() & viewChild()',
      body: [
        'Modern Angular replaces decorator boilerplate (<code>@Input()</code>, <code>@Output()</code>, <code>@ViewChild()</code>) with reactive Signal functions:',
        '• <b><code>input.required&lt;T&gt;()</code> / <code>output&lt;T&gt;()</code></b>: Type-safe signal inputs without <code>ngOnChanges</code>.<br>' +
        '• <b><code>model&lt;T&gt;()</code></b>: Built-in two-way writable signal binding (<code>[(value)]="..."</code>).<br>' +
        '• <b><code>viewChild()</code> / <code>contentChild()</code></b>: Reactive Signal DOM & component queries.',
      ],
      callout: {
        kind: 'tip',
        text: 'Signal inputs and Signal queries plug directly into computed() and effect(), eliminating lifecycle timing bugs!',
      },
      changes: ['+ Decorator @Input/@ViewChild replaced by input()/model()/viewChild()', '+ Two-way binding simplified via model()'],
      metrics: { graphState: 'Component Signals', producerVersion: 'v3', consumerState: 'Signal APIs', glitchFree: '100% Reactive' },
      scene: {
        entities: {
          priceSignal: makeDevice(-16, 0, { label: 'Parent [(v)]', tags: [{ text: 'model() bind', tone: 'blue', icon: 'zap' }] }),
          taxComp: makeBlock(0, 0, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['input / model'], sub: 'signal props' }),
          consumerEffect: makeDb(16, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['viewChild()'], sub: 'reactive DOM' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Signal Component APIs', [
            `user = input.required<User>();        // Replaces @Input()`,
            `checked = model(false);               // Two-way [(checked)]`,
            `saved = output<void>();               // Replaces @Output()`,
            `canvas = viewChild<ElementRef>('cv'); // Signal query`,
          ], { icon: 'terminal' }),
        },
        links: {
          pt: makeLink('priceSignal', 'taxComp', ['priceSignal', 'taxComp'], { label: 'two-way model()' }),
          tc: makeLink('taxComp', 'consumerEffect', ['taxComp', 'consumerEffect'], { label: 'query viewChild' }),
        },
        flows: [{ route: ['pt', 'tc'], kind: 'push', rate: 1.5 }],
      },
    },
    {
      short: 'linked & resource',
      chapter: 'scaling',
      title: 'linkedSignal() & Async resource() / rxResource()',
      body: [
        '• <b><code>linkedSignal(() =&gt; options()[0])</code></b>: Creates a writable signal that stays synchronized and automatically resets whenever its source signal changes (e.g. resetting selected page/option when category changes).',
        '• <b><code>resource()</code> / <code>rxResource()</code></b>: Declarative async data fetching driven by signal parameters—tracking <code>value()</code>, <code>isLoading()</code>, and <code>error()</code> with automatic cancellation.',
      ],
      callout: {
        kind: 'insight',
        text: 'linkedSignal + resource() complete the Signal ecosystem—handling both resettable UI state and declarative async loading.',
      },
      changes: ['+ linkedSignal() enables resettable writable derivations', '+ resource() / rxResource() manages async signal fetches'],
      metrics: { graphState: 'Complete Signals', producerVersion: 'v3', consumerState: 'Async Resource', glitchFree: 'Auto-Cancel' },
      scene: {
        entities: {
          priceSignal: makeDevice(-16, 0, { label: 'userId()', tags: [{ text: 'linkedSignal', tone: 'amber', icon: 'zap' }] }),
          taxComp: makeBlock(0, 0, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['rxResource()'], sub: 'auto-cancel' }),
          consumerEffect: makeDb(16, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['data / loading'], sub: 'signal state' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'linkedSignal & rxResource', [
            `page = linkedSignal(() => { this.filter(); return 1; });`,
            `users = rxResource({`,
            `  request: () => ({ id: this.userId(), p: this.page() }),`,
            `  loader: ({ request }) => this.api.getUsers(request)`,
            `}); // Exposes users.value(), users.isLoading(), users.error()`,
          ], { icon: 'terminal' }),
        },
        links: {
          pt: makeLink('priceSignal', 'taxComp', ['priceSignal', 'taxComp'], { label: 'param changed' }),
          tc: makeLink('taxComp', 'consumerEffect', ['taxComp', 'consumerEffect'], { label: 'emit value()' }),
        },
        flows: [{ route: ['pt', 'tc'], kind: 'pull', rate: 1.6 }],
      },
    },
  ],
};
