// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDevice as y,
} from '@/lib/simulator/scene-builders';

export const javaStreamsLesson = {
  id: 'java-streams',
  title: 'Lazy Stream Pipelines, Short-Circuiting & Parallel Streams',
  summary: 'Trace lazy stream pipeline mechanics, intermediate operation chaining, terminal triggers, short-circuiting optimizations, and ForkJoinPool work-stealing execution.',
  minutes: 10,
  level: 'intermediate',
  metrics: ['streamState', 'fusedPasses', 'elementsProcessed', 'poolThreads'],
  goals: [
    { text: 'Trace lazy evaluation', step: 1 },
    { text: 'Understand short-circuiting', step: 2 },
    { text: 'Master ForkJoinPool work-stealing and', step: 3 },
  ],
  steps: [
    {
      short: 'Lazy Pipeline',
      chapter: 'technique',
      title: 'Lazy Chaining: Stream Pipelines Do Zero Work Until Terminal Op',
      body: [
        'Java Streams are not data structures — they are declarative pipelines.',
        'Intermediate operations (<code>filter()</code>, <code>map()</code>, <code>flatMap()</code>) merely construct linked Stage descriptors (<code>ReferencePipeline</code>). Nothing executes until a terminal operation (<code>collect()</code>, <code>forEach()</code>) starts pulling data.',
      ],
      callout: { kind: 'tip', text: 'Loop fusion combines multiple filter/map operations into a single pass per item, avoiding temporary intermediate collections.' },
      metrics: { streamState: 'Lazy Assembly', fusedPasses: '1 Single Pass', elementsProcessed: '0 (Deferred)', poolThreads: 'Current Caller' },
      scene: {
        entities: {
          src:    d(-12, -4, { color: 'green', glyph: 'layers', label: ['Collection'], sub: 'List.stream()' }),
          pipe:   d(-2, -4,  { color: 'blue', glyph: 'workflow', label: ['Pipeline'], sub: 'filter -> map' }),
          term:   d(10, -4,  { color: 'purple', glyph: 'check', label: ['Terminal'], sub: 'collect()' }),
        },
        links: {
          sp: h('src', 'pipe', ['src', 'pipe'], { label: 'lazy stages', heads: 'end' }),
          pt: h('pipe', 'term', ['pipe', 'term'], { label: 'terminal pull', heads: 'end' }),
        },
        flows: [
          { route: ['sp', 'pt'], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: 'Short-Circuiting',
      chapter: 'technique',
      title: 'Short-Circuiting Operations: Stopping Work Immediately',
      body: [
        'Operations like <code>findFirst()</code>, <code>anyMatch()</code>, and <code>limit(N)</code> terminate iteration the moment condition is satisfied.',
        'In infinite streams (e.g. <code>Stream.iterate()</code>), short-circuiting guarantees finite execution without processing unneeded elements.',
      ],
      callout: { kind: 'insight', text: 'Short-circuiting turns an O(N) traversal into an O(1) early exit when matching elements appear near the head of the stream.' },
      metrics: { streamState: 'Short-Circuited', fusedPasses: 'Early Return', elementsProcessed: '1st Match Found', poolThreads: '1 Thread' },
      scene: {
        entities: {
          stream: d(-10, -4, { color: 'green', glyph: 'layers', label: ['Infinite'], sub: 'iterate(1, n+1)' }),
          eval:   d(0, -4,   { color: 'orange', glyph: 'zap', label: ['Filter'], sub: 'First Match' }),
          term:   d(10, -4,  { color: 'rose', glyph: 'check', label: ['findFirst()'], sub: 'Short-Circuit' }),
        },
        links: {
          se: h('stream', 'eval', ['stream', 'eval'], { label: 'pull next', heads: 'end' }),
          et: h('eval', 'term', ['eval', 'term'], { label: 'break & return', heads: 'end' }),
        },
        flows: [
          { route: ['se', 'et'], bounce: false, rate: 1.5 },
        ],
      },
    },
    {
      short: 'Parallel Streams',
      chapter: 'solution',
      title: 'Parallel Streams: ForkJoinPool.commonPool & Work Stealing',
      body: [
        'Calling <code>parallelStream()</code> splits data via <code>Spliterator.trySplit()</code> into recursive tasks executed by <code>ForkJoinPool.commonPool()</code>.',
        'Each worker thread maintains a double-ended deque (deque), stealing tasks from the tails of busy workers to keep all CPU cores saturated.',
      ],
      callout: { kind: 'warn', text: 'Never run blocking I/O (database, HTTP calls) inside commonPool parallelStream — it starves the shared pool for the entire JVM process.' },
      metrics: { streamState: 'Parallel Execution', fusedPasses: 'Split & Conquer', elementsProcessed: 'Batch Chunking', poolThreads: 'ForkJoinPool C-1' },
      scene: {
        entities: {
          split:  d(-12, -4, { color: 'blue', glyph: 'gitBranch', label: ['Spliterator'], sub: 'trySplit()' }),
          w1:     d(0, -10,  { color: 'purple', glyph: 'cpu', label: ['FJ Worker 1'], sub: 'Core 1 Deque' }),
          w2:     d(0, 2,    { color: 'purple', glyph: 'cpu', label: ['FJ Worker 2'], sub: 'Work-Stealing' }),
          merge:  d(12, -4,  { color: 'green', glyph: 'check', label: ['Combiner'], sub: 'Merge Results' }),
        },
        links: {
          sw1: h('split', 'w1', ['split', 'w1'], { label: 'chunk A', heads: 'end' }),
          sw2: h('split', 'w2', ['split', 'w2'], { label: 'chunk B', heads: 'end' }),
          w1m: h('w1', 'merge', ['w1', 'merge'], { heads: 'end' }),
          w2m: h('w2', 'merge', ['w2', 'merge'], { heads: 'end' }),
        },
        flows: [
          { route: ['sw1', 'w1m'], bounce: false, rate: 1.4 },
          { route: ['sw2', 'w2m'], bounce: false, rate: 1.4 },
        ],
      },
    },
  ],
};

export default javaStreamsLesson;
