// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDb as b,
  makeDevice as y,
} from '@/lib/simulator/scene-builders';

export const javaCollectionsLesson = {
  id: 'java-collections',
  title: 'Collections Internals, Hash Bins & ConcurrentHashMap',
  summary: 'Explore ArrayList amortized dynamic growth, HashMap hash bins and Red-Black treeification (threshold 8), and ConcurrentHashMap lock-free read with synchronized bin-head locking.',
  minutes: 10,
  level: 'intermediate',
  metrics: ['capacity', 'loadFactor', 'collisionRate', 'concurrency'],
  goals: [
    { text: 'Master ArrayList dynamic resizing and 1.5x amortized growth', step: 1 },
    { text: 'Understand HashMap hashing, collisions, and treeify threshold (8 entries)', step: 2 },
    { text: 'Scale with ConcurrentHashMap lock-striping and CAS bin headers', step: 3 },
  ],
  steps: [
    {
      short: 'ArrayList Growth',
      chapter: 'technique',
      title: 'ArrayList: Contiguous Memory & 1.5x Dynamic Growth',
      body: [
        'An <code>ArrayList</code> is backed by a contiguous Object array (<code>elementData[]</code>).',
        'When capacity is exceeded, it allocates a new array sized <code>newCapacity = oldCapacity + (oldCapacity >> 1)</code> (1.5x), copying elements via <code>System.arraycopy()</code> in amortized O(1) time.',
      ],
      callout: { kind: 'tip', text: 'Pre-sizing ArrayList with an estimated initialCapacity avoids expensive array copies and GC garbage pressure during batch loads.' },
      metrics: { capacity: '16 elements', loadFactor: '1.0 (Full)', collisionRate: '0%', concurrency: 'Unsynchronized' },
      scene: {
        entities: {
          app:    y(-12, -4, { label: 'Client Thread', tags: [{ text: 'list.add(item)', icon: 'zap' }] }),
          buffer: d(-2, -4,  { color: 'blue', glyph: 'layers', label: ['elementData'], sub: 'Cap 10' }),
          grow:   d(10, -4,  { color: 'green', glyph: 'layers', label: ['newCapacity'], sub: 'Cap 15 (1.5x)' }),
        },
        links: {
          ab: h('app', 'buffer', ['app', 'buffer'], { label: 'add() overflow', heads: 'end' }),
          bg: h('buffer', 'grow', ['buffer', 'grow'], { label: 'System.arraycopy()', heads: 'end' }),
        },
        flows: [
          { route: ['ab', 'bg'], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: 'HashMap Bins',
      chapter: 'technique',
      title: 'HashMap: Hash Spread, Linked Bins & Red-Black Treeify',
      body: [
        '<code>HashMap</code> maps keys via <code>(h = key.hashCode()) ^ (h >>> 16)</code> to spread high bits into low bits.',
        'Bucket indices are calculated with <code>(n - 1) & hash</code>. When collisions occur, elements link into a singly-linked list. If a bin reaches 8 elements and total table capacity >= 64, the bin converts into a Red-Black Tree (O(log N)).',
      ],
      callout: { kind: 'insight', text: 'Treeifying bins from O(N) to O(log N) prevents HashDoS attacks where adversarial keys intentionally collide on identical hash buckets.' },
      metrics: { capacity: '64 buckets', loadFactor: '0.75 threshold', collisionRate: '12% bin sharing', concurrency: 'Fail-Fast Iterator' },
      scene: {
        entities: {
          key:    y(-12, -4, { label: 'Put Key/Value', tags: [{ text: 'hash() ^ (h>>>16)', icon: 'code' }] }),
          table:  d(-2, -4,  { color: 'purple', glyph: 'layers', label: ['Node<K,V>[]'], sub: 'Bucket Array' }),
          tree:   d(10, -4,  { color: 'rose', glyph: 'gitBranch', label: ['TreeNode'], sub: 'Treeify (>=8)' }),
        },
        links: {
          kt: h('key', 'table', ['key', 'table'], { label: 'indexFor(h)', heads: 'end' }),
          tt: h('table', 'tree', ['table', 'tree'], { label: 'treeifyBin()', heads: 'end' }),
        },
        flows: [
          { route: ['kt', 'tt'], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: 'ConcurrentHashMap',
      chapter: 'solution',
      title: 'ConcurrentHashMap: CAS Node Insertion & Striped Bin Locks',
      body: [
        'JDK 8+ <code>ConcurrentHashMap</code> completely abandoned heavy Segment locks in favor of CAS (Compare-And-Swap) for empty bin heads.',
        'For populated bins, it locks only the first Node (<code>synchronized(head)</code>), allowing concurrent reads without locks and writes across different bins without contention.',
      ],
      callout: { kind: 'tip', text: 'ConcurrentHashMap size() uses LongAdder-style CounterCell array to record increments concurrently without global bottlenecking.' },
      metrics: { capacity: '128 striped bins', loadFactor: 'Auto-resizing', collisionRate: '< 5%', concurrency: 'Lock-Free Read / CAS Write' },
      scene: {
        entities: {
          writer1: y(-12, -10, { label: 'Thread 1', tags: [{ text: 'put(keyA)', icon: 'zap' }] }),
          writer2: y(-12, 2,   { label: 'Thread 2', tags: [{ text: 'put(keyB)', icon: 'zap' }] }),
          binA:    d(2, -10,   { color: 'green', glyph: 'lock', label: ['Bin #12'], sub: 'sync(headA)' }),
          binB:    d(2, 2,     { color: 'green', glyph: 'lock', label: ['Bin #47'], sub: 'sync(headB)' }),
          shared:  d(14, -4,   { color: 'blue', glyph: 'server', label: ['CounterCells'], sub: 'LongAdder' }),
        },
        links: {
          w1: h('writer1', 'binA', ['writer1', 'binA'], { label: 'independent lock', heads: 'end' }),
          w2: h('writer2', 'binB', ['writer2', 'binB'], { label: 'parallel lock', heads: 'end' }),
          s1: h('binA', 'shared', ['binA', 'shared'], { heads: 'end' }),
          s2: h('binB', 'shared', ['binB', 'shared'], { heads: 'end' }),
        },
        flows: [
          { route: ['w1', 's1'], bounce: false, rate: 1.5 },
          { route: ['w2', 's2'], bounce: false, rate: 1.5 },
        ],
      },
    },
  ],
};

export default javaCollectionsLesson;
