// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDevice as y,
} from '@/lib/simulator/scene-builders';

export const javaCompletableLesson = {
  id: 'java-completable',
  title: 'CompletableFuture & Async Pipelines',
  summary: 'Visualize non-blocking reactive chains with CompletableFuture: async supply, transform stages, branching, and exceptionally fallback handlers.',
  minutes: 8,
  level: 'intermediate',
  metrics: ['pipelineState', 'threadPool', 'completionTime', 'errorRate'],
  goals: [
    { text: 'Compose asynchronous steps using', step: 1 },
    { text: 'Fork and join multiple parallel', step: 2 },
    { text: 'Handle timeouts and exceptions using', step: 3 },
  ],
  steps: [
    {
      short: 'Async Supply',
      chapter: 'technique',
      title: 'Initiating Non-Blocking Pipeline',
      body: [
        'CompletableFuture.supplyAsync() submits an initial Supplier task to ForkJoinPool.commonPool() or a custom Executor.',
        'The caller thread continues execution immediately without blocking on network IO.',
      ],
      callout: { kind: 'tip', text: 'Always specify a custom ThreadPool for IO-heavy futures so you do not saturate ForkJoinPool.commonPool().' },
      metrics: { pipelineState: 'Initiated', threadPool: 'custom-io-pool', completionTime: '4ms', errorRate: '0%' },
      scene: {
        entities: {
          caller: y(-11, -10, { label: 'Client Thread', tags: [{ text: 'non-blocking', icon: 'zap' }] }),
          stage1: d(-2, -1,   { color: 'blue', glyph: 'code', label: ['supplyAsync', 'fetchOrder()'], cpu: 0.7 }),
          db:     d(-2, 12,   { color: 'violet', glyph: 'db', label: ['Order DB', 'IO Read'] }),
        },
        links: {
          cs1: h('caller', 'stage1', ['caller', 'stage1'], { label: 'async call', heads: 'end' }),
          s1db: h('stage1', 'db', ['stage1', 'db'], { label: 'read', heads: 'both' }),
        },
        flows: [
          { route: ['cs1', 's1db'], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: 'Parallel Fork/Join',
      chapter: 'technique',
      title: 'Forking Pipelines: thenCombine & allOf',
      body: [
        'thenCombine() merges two independent future results when both finish.',
        'CompletableFuture.allOf() waits for N asynchronous tasks to complete before executing a downstream reduction stage.',
      ],
      callout: { kind: 'insight', text: 'Parallel fan-out reduces end-to-end latency to MAX(task1, task2) instead of task1 + task2.' },
      metrics: { pipelineState: 'Parallel Fan-out', threadPool: 'ForkJoinPool', completionTime: '18ms (parallel)', errorRate: '0%' },
      scene: {
        entities: {
          origin: d(-11, -1, { color: 'blue', glyph: 'code', label: ['Order Ready', 'id: 1042'] }),
          stageA: d(-2, -10, { color: 'purple', glyph: 'code', label: ['Inventory Check', 'thenApplyAsync'] }),
          stageB: d(-2, 8,   { color: 'purple', glyph: 'code', label: ['User Discounts', 'thenApplyAsync'] }),
          join:   d(9, -1,   { color: 'green', glyph: 'check', label: ['thenCombine', 'Checkout Invoice'] }),
        },
        links: {
          oa: h('origin', 'stageA', ['origin', 'stageA'], { heads: 'end' }),
          ob: h('origin', 'stageB', ['origin', 'stageB'], { heads: 'end' }),
          aj: h('stageA', 'join', ['stageA', 'join'], { heads: 'end' }),
          bj: h('stageB', 'join', ['stageB', 'join'], { heads: 'end' }),
        },
        flows: [
          { route: ['oa', 'aj'], bounce: false, rate: 1.0 },
          { route: ['ob', 'bj'], bounce: false, rate: 1.0 },
        ],
      },
    },
    {
      short: 'Exception Handling',
      chapter: 'technique',
      title: 'Resilient Pipelines: exceptionally & handle',
      body: [
        'When an upstream stage throws an exception, normal stages are bypassed.',
        'exceptionally(ex -> fallback) intercepts Throwable and returns a safe fallback object without crashing the consumer.',
      ],
      callout: { kind: 'tip', text: 'Use completeOnTimeout(defaultVal, 500, TimeUnit.MILLISECONDS) in Java 9+ to enforce strict latency SLAs.' },
      metrics: { pipelineState: 'Fallback Triggered', threadPool: 'ForkJoinPool', completionTime: '500ms (timeout)', errorRate: '100% intercepted' },
      scene: {
        entities: {
          payment:  d(-11, -1, { color: 'rose', glyph: 'alert', label: ['Payment Stage', 'TimeoutException!'] }),
          fallback: d(-2, 8,   { color: 'yellow', glyph: 'shield', label: ['exceptionally()', 'Pay On Delivery'] }),
          consumer: d(9, 8,    { color: 'green', glyph: 'check', label: ['Order Confirmed', 'Fallback OK'] }),
        },
        links: {
          pf: h('payment', 'fallback', ['payment', 'fallback'], { label: 'intercept', heads: 'end', style: 'dashed' }),
          fc: h('fallback', 'consumer', ['fallback', 'consumer'], { label: 'continue', heads: 'end' }),
        },
        flows: [
          { route: ['pf', 'fc'], bounce: false, rate: 1.1 },
        ],
      },
    },
  ],
};

export default javaCompletableLesson;
