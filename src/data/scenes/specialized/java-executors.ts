// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDevice as y,
  makeQueue as ee,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const javaExecutorsLesson = {
  id: 'java-executors',
  title: 'Java Thread Pools & WorkStealingPool',
  summary: 'Visualize ThreadPoolExecutor architecture, BlockingQueue task ingestion, worker thread lifecycle, and ForkJoinPool work-stealing mechanics.',
  minutes: 10,
  level: 'intermediate',
  metrics: ['poolSize', 'activeThreads', 'queueCapacity', 'throughput'],
  goals: [
    { text: 'Understand core vs max pool', step: 1 },
    { text: 'Observe task queue saturation and', step: 2 },
    { text: 'Inspect WorkStealingPool deques and', step: 3 },
  ],
  steps: [
    {
      short: 'FixedThreadPool',
      chapter: 'technique',
      title: 'ThreadPoolExecutor: Core Workers & LinkedBlockingQueue',
      body: [
        'A FixedThreadPool maintains N permanent worker threads reading from an unbounded or bounded BlockingQueue.',
        'Callers execute submit(Runnable) which enqueues the task. Idle workers wake via take() and process tasks without thread recreation overhead.',
      ],
      callout: { kind: 'tip', text: 'Never use Executors.newFixedThreadPool() in production without bounding the queue; an unbounded LinkedBlockingQueue causes OutOfMemoryError under burst traffic.' },
      metrics: { poolSize: '4 workers', activeThreads: '3 active', queueCapacity: '1,024 slots', throughput: '12,500 ops/s' },
      scene: {
        entities: {
          client: y(-11, -10, { label: 'Callers', tags: [{ text: 'submit()', icon: 'play' }] }),
          queue:  ee(-2, -1,  { label: ['Task Queue', 'BlockingQueue'] }),
          w1:     d(-11, 8,   { color: 'blue', glyph: 'cpu', label: ['Worker-1', 'BUSY'], cpu: 0.9 }),
          w2:     d(-2, 8,    { color: 'blue', glyph: 'cpu', label: ['Worker-2', 'BUSY'], cpu: 0.8 }),
          w3:     d(7, 8,     { color: 'blue', glyph: 'cpu', label: ['Worker-3', 'BUSY'], cpu: 0.6 }),
          w4:     d(16, 8,    { color: 'yellow', glyph: 'cpu', label: ['Worker-4', 'IDLE'], cpu: 0.0 }),
        },
        links: {
          cq: h('client', 'queue', ['client', 'queue'], { label: 'enqueue', heads: 'end' }),
          qw1: h('queue', 'w1', ['queue', 'w1'], { label: 'take()', heads: 'end' }),
          qw2: h('queue', 'w2', ['queue', 'w2'], { heads: 'end' }),
          qw3: h('queue', 'w3', ['queue', 'w3'], { heads: 'end' }),
          qw4: h('queue', 'w4', ['queue', 'w4'], { heads: 'end', style: 'dashed' }),
        },
        flows: [
          { route: ['cq', 'qw1'], bounce: false, rate: 1.2 },
          { route: ['cq', 'qw2'], bounce: false, rate: 1.0 },
          { route: ['cq', 'qw3'], bounce: false, rate: 0.8 },
        ],
      },
    },
    {
      short: 'Saturation & Reject',
      chapter: 'technique',
      title: 'Queue Saturation & Rejection Policies',
      body: [
        'When the BlockingQueue fills and maxPoolSize is reached, new tasks trigger the RejectedExecutionHandler.',
        'Policies include AbortPolicy (throws RejectedExecutionException), CallerRunsPolicy (caller thread executes task, throttling ingest), or DiscardOldestPolicy.',
      ],
      callout: { kind: 'insight', text: 'CallerRunsPolicy creates natural backpressure: by forcing producer threads to execute tasks directly, ingestion slows to match pool throughput.' },
      metrics: { poolSize: '4 workers', activeThreads: '4 (100%)', queueCapacity: 'FULL (1024/1024)', throughput: 'Backpressure Active' },
      scene: {
        entities: {
          client: y(-11, -10, { label: 'Throttled Caller', color: 'orange', tags: [{ text: 'CallerRuns', icon: 'zap' }] }),
          queue:  ee(-2, -1,  { label: ['Task Queue', 'SATURATED'], color: 'rose' }),
          w1:     d(-11, 8,   { color: 'rose', glyph: 'cpu', label: ['Worker-1', '100% CPU'], cpu: 1.0 }),
          w2:     d(-2, 8,    { color: 'rose', glyph: 'cpu', label: ['Worker-2', '100% CPU'], cpu: 1.0 }),
          w3:     d(7, 8,     { color: 'rose', glyph: 'cpu', label: ['Worker-3', '100% CPU'], cpu: 1.0 }),
          w4:     d(16, 8,    { color: 'rose', glyph: 'cpu', label: ['Worker-4', '100% CPU'], cpu: 1.0 }),
        },
        links: {
          cq: h('client', 'queue', ['client', 'queue'], { label: 'reject/throttle', heads: 'end', style: 'dashed' }),
          qw1: h('queue', 'w1', ['queue', 'w1'], { heads: 'end' }),
          qw2: h('queue', 'w2', ['queue', 'w2'], { heads: 'end' }),
          qw3: h('queue', 'w3', ['queue', 'w3'], { heads: 'end' }),
          qw4: h('queue', 'w4', ['queue', 'w4'], { heads: 'end' }),
        },
        flows: [
          { route: ['qw1'], bounce: true, rate: 1.4 },
          { route: ['qw2'], bounce: true, rate: 1.4 },
        ],
      },
    },
    {
      short: 'WorkStealingPool',
      chapter: 'technique',
      title: 'ForkJoinPool: Work-Stealing DTM Architecture',
      body: [
        'ForkJoinPool assigns each worker thread its own double-ended queue (Deque). Workers push and pop tasks from the head (LIFO).',
        'When an idle worker runs out of local tasks, it steals tasks from the tail (FIFO) of busy peers using lock-free CAS operations.',
      ],
      callout: { kind: 'tip', text: 'Work-stealing maximizes CPU cache locality because threads work on their own recently spawned subtasks without contending for a global lock.' },
      metrics: { poolSize: '4 FJP Workers', activeThreads: 'All balancing', queueCapacity: 'Per-thread Deque', throughput: '48,000 ops/s' },
      scene: {
        entities: {
          pool:   d(-2, -10, { color: 'purple', glyph: 'layers', label: ['ForkJoinPool', 'commonPool()'] }),
          w1:     d(-11, 8,  { color: 'green', glyph: 'cpu', label: ['Worker-1', 'Deque: 8 tasks'], cpu: 0.9 }),
          w2:     d(-2, 8,   { color: 'green', glyph: 'cpu', label: ['Worker-2', 'Deque: 4 tasks'], cpu: 0.7 }),
          w3:     d(7, 8,    { color: 'green', glyph: 'cpu', label: ['Worker-3', 'Deque: 1 task'], cpu: 0.4 }),
          w4:     d(16, 8,   { color: 'yellow', glyph: 'cpu', label: ['Worker-4', 'Stealing...'], cpu: 0.3 }),
        },
        links: {
          pw1: h('pool', 'w1', ['pool', 'w1'], { heads: 'end' }),
          pw2: h('pool', 'w2', ['pool', 'w2'], { heads: 'end' }),
          pw3: h('pool', 'w3', ['pool', 'w3'], { heads: 'end' }),
          pw4: h('pool', 'w4', ['pool', 'w4'], { heads: 'end' }),
          steal: h('w4', 'w1', ['w4', 'w1'], { label: 'steal(tail)', heads: 'end', style: 'dashed' }),
        },
        flows: [
          { route: ['pw1'], bounce: false, rate: 1.0 },
          { route: ['steal'], bounce: true, rate: 1.2 },
        ],
      },
    },
  ],
};

export default javaExecutorsLesson;
