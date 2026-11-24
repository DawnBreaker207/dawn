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

export const angularSignalsDagLesson = {
  id: 'angular-signals-dag',
  title: 'Signals Reactive Graph: Push-Pull & Glitch-Free DAG',
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
          producerA: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['price = signal(10)'], sub: 'Producer Node' }),
          computedNode: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['tax = computed()'], sub: 'Producer & Consumer' }),
          consumerEffect: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['total = computed()'], sub: 'Final Consumer Node' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Signals Reactive Graph', [
            `const price = signal(10);`,
            `const tax = computed(() => price() * 0.2);`,
            `const total = computed(() => price() + tax());`,
            `// Graph edges:`,
            `// price -> tax`,
            `// price -> total`,
            `// tax -> total`,
            `= Directed Acyclic Graph (DAG) constructed`,
          ], { icon: 'terminal' }),
          zSig: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'SIGNALS REACTIVE DIRECTED ACYCLIC GRAPH'),
        },
        links: {
          pt: h('producerA', 'computedNode', ['producerA', 'computedNode'], { label: 'subscribes to price' }),
          tt: h('computedNode', 'consumerEffect', ['computedNode', 'consumerEffect'], { label: 'subscribes to tax' }),
        },
        flows: [{ route: ['pt', 'tt'], kind: 'push', rate: 1.5 }],
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
          priceSet: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['price.set(20)'], sub: 'version v1 -> v2' }),
          dirtyMarker: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'cpu', label: ['Push Dirty Flag'], sub: 'marks tax DIRTY' }),
          lazyReader: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['Pull on Read'], sub: 'total() recomputes to 24' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Push-Pull Algorithm Execution', [
            `1. price.set(20) [PUSH PHASE]:`,
            `   - price increments version to v2`,
            `   - pushes "dirty" notification to tax and total`,
            `2. total() is read in template [PULL PHASE]:`,
            `   - total checks dependencies: price is v2 -> pull new value`,
            `   - tax is dirty -> recomputes tax to 4`,
            `   - total calculates 20 + 4 = 24`,
          ], { icon: 'terminal' }),
          zSig: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'TWO-PHASE PUSH-PULL EXECUTION'),
        },
        links: {
          pd: h('priceSet', 'dirtyMarker', ['priceSet', 'dirtyMarker'], { label: 'push dirty notification' }),
          dl: h('dirtyMarker', 'lazyReader', ['dirtyMarker', 'lazyReader'], { label: 'pull value on read' }),
        },
        flows: [{ route: ['pd', 'dl'], kind: 'pull', rate: 1.5 }],
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
          toggleCondition: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['showDetails = false'], sub: 'branch switch' }),
          activeBranch: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'cpu', label: ['summary() Edge'], sub: 'active DAG link' }),
          unlinkedBranch: d(10, 8, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['userDetails()'], sub: 'UNLINKED (Pruned edge)' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Dynamic Dependency Tracking', [
            `const info = computed(() => {`,
            `  if (this.showDetails()) {`,
            `    return this.details(); // Dependency active`,
            `  }`,
            `  return this.summary(); // details() is UNLINKED from DAG!`,
            `});`,
            `// If details() updates now, info is NOT triggered!`,
          ], { icon: 'terminal' }),
          zSig: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'DYNAMIC DEPENDENCY EDGE PRUNING'),
        },
        links: {
          ta: h('toggleCondition', 'activeBranch', ['toggleCondition', 'activeBranch'], { label: 'link active dependency' }),
          au: h('activeBranch', 'unlinkedBranch', ['activeBranch', 'unlinkedBranch'], { label: 'sever inactive edge' }),
        },
        flows: [{ route: ['ta', 'au'], kind: 'push', rate: 1.5 }],
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
          rootA: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['Node A (Root)'], sub: 'price updated' }),
          intermediateBC: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['Nodes B & C'], sub: 'both updated before D' }),
          glitchFreeD: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['Node D (Total)'], sub: 'evaluates 1 time cleanly' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'The Diamond Problem & Fix', [
            `Diamond Topology:`,
            `       [Price]`,
            `       /     \\`,
            `  [Tax]       [Discount]`,
            `       \\     /`,
            `       [Total]`,
            `Naive: Total evaluates twice (glitch: old Discount + new Tax)`,
            `Signals: Total evaluates ONCE with both updated! (Glitch-Free)`,
          ], { icon: 'terminal' }),
          zSig: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'GLITCH-FREE DIAMOND TOPOLOGY ENGINE'),
        },
        links: {
          ri: h('rootA', 'intermediateBC', ['rootA', 'intermediateBC'], { label: 'mark both dirty' }),
          ig: h('intermediateBC', 'glitchFreeD', ['intermediateBC', 'glitchFreeD'], { label: 'atomic pull' }),
        },
        flows: [{ route: ['ri', 'ig'], kind: 'glitch', rate: 1.5 }],
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
          sigDep: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['themeSignal()'], sub: 'dependency read' }),
          effectEngine: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['effect() Runner'], sub: 'schedules microtask' }),
          sideEffect: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['localStorage Write'], sub: 'side effect executed' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'effect() Implementation', [
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
          zSig: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'EFFECT SCHEDULER & CLEANUP LIFECYCLE'),
        },
        links: {
          se: h('sigDep', 'effectEngine', ['sigDep', 'effectEngine'], { label: 'notify scheduler' }),
          es: h('effectEngine', 'sideEffect', ['effectEngine', 'sideEffect'], { label: 'execute side effect' }),
        },
        flows: [{ route: ['se', 'es'], kind: 'effect', rate: 1.5 }],
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
          rxjsStream: d(-10, -18, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['http.get() Stream'], sub: 'RxJS Observable' }),
          toSignalBridge: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['toSignal(obs$)'], sub: 'auto-subscribes & unsubscribes' }),
          signalVal: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['usersSignal()'], sub: 'synchronous Signal in template' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'RxJS Interop Code', [
            `import { toSignal, toObservable } from '@angular/core/rxjs-interop';`,
            ``,
            `// Convert Observable to Signal:`,
            `users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });`,
            ``,
            `// Convert Signal to Observable:`,
            `query$ = toObservable(this.searchQuery);`,
          ], { icon: 'terminal' }),
          zSig: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'RXJS & SIGNALS INTEROPERABILITY BRIDGE'),
        },
        links: {
          rt: h('rxjsStream', 'toSignalBridge', ['rxjsStream', 'toSignalBridge'], { label: 'pipe stream' }),
          ts: h('toSignalBridge', 'signalVal', ['toSignalBridge', 'signalVal'], { label: 'expose signal' }),
        },
        flows: [{ route: ['rt', 'ts'], kind: 'pull', rate: 1.6 }],
      },
    },
  ],
};
