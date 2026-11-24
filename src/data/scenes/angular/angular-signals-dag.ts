// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularSignalsDagLesson = {
  id: 'angular-signals-dag',
  title: 'Signals Reactive Graph: Push-Pull & Glitch-Free DAG',
  summary: 'Understand the Angular Signals reactive algorithm. Trace how signal producers notify consumers via push notifications, and how computed values pull dependencies lazily with glitch-free dynamic DAG tracking.',
  minutes: 25,
  level: 'advanced',
  metrics: ['graphState', 'producerVersion', 'consumerState', 'glitchFree'],
  legend: ['flow', ['push', 'dirty mark push'], ['pull', 'lazy value pull']],
  goals: [
    { text: 'Signals Reactive Graph (DAG) construction', step: 1 },
    { text: 'Push-Pull Reactivity: Dirty notification vs Lazy evaluation', step: 2 },
    { text: 'Dynamic dependency tracking & Glitch-Free execution', step: 3 },
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
        text: 'Signals combine the ease of synchronous variable access with the reactivity of a tracked graph, eliminating memory leaks from unclosed subscriptions.',
      },
      metrics: { graphState: 'Linked DAG', producerVersion: 'v1', consumerState: 'Clean', glitchFree: 'Guaranteed' },
      scene: {
        entities: {
          count: d(-10, -3, { color: 'blue', glyph: 'database', label: ['count = signal(2)'], sub: 'Producer Node' }),
          multiplier: d(-10, 3, { color: 'blue', glyph: 'database', label: ['mult = signal(10)'], sub: 'Producer Node' }),
          total: d(0, 0, { color: 'purple', glyph: 'cpu', label: ['total = computed()'], sub: 'count() * mult()' }),
          template: d(10, 0, { color: 'green', glyph: 'terminal', label: ['Template View'], sub: 'Displays {{ total() }}' }),
          zDag: x({ x0: -12, x1: 12, y0: -6, y1: 6 }, 'SIGNALS REACTIVE TOPOLOGY (DAG)'),
        },
        links: {
          ct: h('count', 'total', ['count', 'total'], { label: 'edge' }),
          mt: h('multiplier', 'total', ['multiplier', 'total'], { label: 'edge' }),
          tt: h('total', 'template', ['total', 'template'], { label: 'consumer edge' }),
        },
        flows: [{ route: ['ct', 'tt'], kind: 'push', rate: 1.2 }],
      },
    },
    {
      short: 'Push-Pull Cycle',
      chapter: 'execution',
      title: 'Phase 1 (Push Dirty) vs Phase 2 (Pull Value)',
      body: [
        '<b>Phase 1 (Push):</b> When <code>count.set(5)</code> is called, the producer does NOT calculate new outputs. Instead, it pushes a lightweight <b>"DIRTY"</b> notification down the graph edges, marking consumer nodes as stale.',
        '<b>Phase 2 (Pull):</b> When the template or effect reads <code>total()</code>, the consumer pulls the updated values, recomputing ONLY if dependencies actually changed versions.',
      ],
      callout: {
        kind: 'tip',
        text: 'If a computed signal is never read by an active consumer or view, its transform function is never executed. This guarantees zero wasted CPU cycles.',
      },
      changes: ['+ count.set(5) invoked', '+ Pushed "DIRTY" bitflag to total computed node', '+ Deferred computation until template read in Phase 2'],
      metrics: { graphState: 'Dirty Flag Propagated', producerVersion: 'v2', consumerState: 'Dirty (Stale)', glitchFree: 'Pending Pull' },
      scene: {
        entities: {
          count: d(-10, 0, { color: 'amber', glyph: 'database', label: ['count = signal(5)'], sub: 'Version bumped to v2' }),
          total: d(0, 0, { color: 'red', glyph: 'cpu', label: ['total (DIRTY)'], sub: 'Flagged stale; no re-eval yet' }),
          view: d(10, 0, { color: 'green', glyph: 'terminal', label: ['View Consumer'], sub: 'Prepares to pull on render' }),
          zPushPull: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'PUSH-PULL TWO PHASE PIPELINE'),
        },
        links: {
          ct: h('count', 'total', ['count', 'total'], { label: '1. push DIRTY' }),
          tv: h('view', 'total', ['view', 'total'], { label: '2. pull read total()' }),
        },
        flows: [
          { route: ['ct'], kind: 'push', rate: 1.8 },
          { route: ['tv'], kind: 'pull', rate: 1.4 },
        ],
      },
    },
    {
      short: 'Glitch-Free Dynamic',
      chapter: 'solution',
      title: 'Glitch-Free Dynamic Dependency Tracking',
      body: [
        'A "glitch" is a temporary inconsistent state where intermediate nodes compute with mixed old and new data (diamond problem).',
        'Angular Signals solve this with topological epoch sorting and dynamic dependency re-evaluation: if a conditional branch (<code>show() ? a() : b()</code>) switches, unused signals are immediately pruned from the dependency list, preventing stale triggers.',
      ],
      callout: {
        kind: 'insight',
        text: 'Dynamic dependency tracking ensures that if a signal is not read during the current branch execution, it stops being a dependency automatically.',
      },
      changes: ['+ Solved diamond problem with epoch version timestamps', '+ Dynamically pruned unused dependencies', '+ Zero intermediate transient glitches'],
      metrics: { graphState: 'Topologically Synchronized', producerVersion: 'v2', consumerState: 'Clean (Evaluated)', glitchFree: '100% Glitch-Free' },
      scene: {
        entities: {
          rootSig: d(-10, 0, { color: 'blue', glyph: 'database', label: ['sourceSignal'], sub: 'Updated once' }),
          leftNode: d(-3, -3, { color: 'purple', glyph: 'cpu', label: ['leftBranch'], sub: 'computed' }),
          rightNode: d(-3, 3, { color: 'purple', glyph: 'cpu', label: ['rightBranch'], sub: 'computed' }),
          mergedNode: d(8, 0, { color: 'green', glyph: 'terminal', label: ['combinedResult'], sub: 'Evaluates once atomically' }),
          zGlitch: x({ x0: -12, x1: 11, y0: -6, y1: 6 }, 'DIAMOND DEPENDENCY RECONCILIATION'),
        },
        links: {
          rl: h('rootSig', 'leftNode', ['rootSig', 'leftNode'], { label: 'epoch sync' }),
          rr: h('rootSig', 'rightNode', ['rootSig', 'rightNode'], { label: 'epoch sync' }),
          lm: h('leftNode', 'mergedNode', ['leftNode', 'mergedNode'], { label: 'atomic pull' }),
          rm: h('rightNode', 'mergedNode', ['rightNode', 'mergedNode'], { label: 'atomic pull' }),
        },
        flows: [{ route: ['rl', 'lm', 'rr', 'rm'], kind: 'pull', rate: 1.3 }],
      },
    },
  ],
};
