/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaCollectionsLesson: Lesson = {
  id: 'java-collections',
  title: 'HashMap & ConcurrentHashMap',
  summary:
    'Understand WHY ArrayList beats LinkedList, how HashMap resizes without rehashing, why mutating a key loses it, and how ConcurrentHashMap locks buckets.',
  minutes: 14,
  level: 'core',
  metrics: ['backing_store', 'collision_op', 'concurrency', 'tricky_trap'],
  legend: ['flow', ['req', 'put / resize'], ['res', 'treeify / CAS'], ['fail', 'lost key / lock']],
  goals: [
    { text: 'Contrast ArrayList CPU-cache locality vs LinkedList', step: 1 },
    { text: 'Trace HashMap perturbation hash & collision chain', step: 2 },
    { text: 'Treeify long buckets into RB-Tree & resize by bit-mask', step: 3 },
    { text: 'Enforce equals/hashCode & avoid Mutated Key Leaks', step: 4 },
    { text: 'Compare List.of() / Map.of() unmodifiable collections', step: 5 },
    { text: 'Lock only bucket head in ConcurrentHashMap (CAS + sync)', step: 6 },
    { text: 'Avoid recursive computeIfAbsent deadlock in CHM', step: 7 },
  ],
  steps: [
    {
      short: 'ArrayList',
      chapter: 'list',
      title: '1. Why ArrayList Beats LinkedList Almost Always',
      body: [
        '<code>ArrayList</code> stores references in a contiguous <code>Object[]</code> (growing 1.5x via <code>Arrays.copyOf</code>). CPU L1 cache prefetcher loads adjacent slots in one cache line.',
        '<code>LinkedList</code> allocates a separate Heap <code>Node</code> wrapper (prev/next pointers) per element, causing pointer-chasing cache misses even during iteration.',
      ],
      callout: {
        kind: 'tip',
        text: 'Even for queue/stack workloads, prefer ArrayDeque over LinkedList — zero per-node Heap allocation.',
      },
      metrics: { backing_store: 'Object[] 1.5x', collision_op: 'N/A', concurrency: 'Not sync', tricky_trap: 'LinkedList RAM' },
      scene: {
        entities: {
          arr: b(-14, -14, { r: 2.3, h: 50, color: 'green', label: ['ArrayList'], sub: 'contiguous L1' }),
          lnk: d(2, -6, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['LinkedList'], sub: 'cache misses' }),
          card: S({ x: -12, y: 12 }, '1. Contiguous Array vs Pointer Chasing', [
            '// ArrayList: O(1) get(i), 1.5x grow = old + (old >> 1)',
            '// LinkedList: 24B+ Node overhead per item + cache miss',
            'Deque<Task> q = new ArrayDeque<>(); // faster than LinkedList',
          ], { icon: 'terminal' }),
        },
        links: {
          ar_ln: h('arr', 'lnk', ['arr', 'lnk'], { heads: 'end', label: 'prefer Array' }),
        },
        flows: [{ route: ['ar_ln'], kind: 'res', rate: 1.7 }],
      },
    },
    {
      short: 'HashMap',
      chapter: 'map',
      title: '2. HashMap Perturbation & Bucket Collisions',
      body: [
        'Because table size <code>n</code> is always a power of 2, <code>(n - 1) & hash</code> only uses the lowest bits. <code>HashMap</code> runs <code>(h = key.hashCode()) ^ (h >>> 16)</code> so upper bits also influence the bucket.',
        'Distinct keys landing in the same bucket form a linked list resolved via <code>equals()</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Default load factor 0.75 balances memory vs collision probability (Poisson distribution: >=8 collisions < 1 in 10M).',
      },
      changes: ['+ h ^ (h >>> 16) mixes upper hash bits', '+ Collision appends Node to bucket'],
      metrics: { backing_store: 'Node[16]', collision_op: 'Linked chain', concurrency: 'Unsafe!', tricky_trap: 'Infinite loop' },
      scene: {
        entities: {
          key: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Key.hashCode'], sub: 'h^(h>>>16)' }),
          tbl: d(0, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Node[] Table'], sub: '(n-1) & hash' }),
          bkt: b(0, 0, { r: 2.2, h: 48, color: 'amber', label: ['Bucket Chain'], sub: 'Node.next' }),
          card: S({ x: -12, y: 12 }, '2. How HashMap Picks a Bucket', [
            'int h = key.hashCode();',
            'int hash = h ^ (h >>> 16); // mix upper bits!',
            'int idx = (n - 1) & hash;  // fast bitwise modulo',
          ], { icon: 'terminal' }),
        },
        links: {
          k_tb: h('key', 'tbl', ['key', 'tbl'], { heads: 'end', label: 'mask bits' }),
          tb_bk: h('tbl', 'bkt', ['tbl', 'bkt'], { heads: 'end', label: 'clash' }),
        },
        flows: [{ route: ['k_tb', 'tb_bk'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Treeify & Resize',
      chapter: 'map',
      title: '3. Bucket Treeify (bin >= 8) & Bit-Mask Resize',
      body: [
        'At <code>TREEIFY_THRESHOLD = 8</code> (with table cap $\\ge 64$), the chain converts into a <strong>Red-Black Tree</strong> ($O(\\log n)$ worst-case lookup).',
        'When resizing 2x, <code>HashMap</code> does NOT recompute <code>hashCode()</code>! It checks one bit <code>(e.hash & oldCap) == 0</code>: nodes either stay at <code>idx</code> or jump to <code>idx + oldCap</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Power-of-2 capacity makes resize() a pure single-bit split into loHead and hiHead chains.',
      },
      changes: ['+ bin >= 8 treeifies to RB-Tree', '+ resize() splits via (hash & oldCap)'],
      metrics: { backing_store: 'TreeNode RB', collision_op: 'O(log n)', concurrency: 'Unsafe!', tricky_trap: '0 rehash' },
      scene: {
        entities: {
          key: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Key (bin>=8)'], sub: 'cap >= 64' }),
          tbl: d(0, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Node[] Table'], sub: 'resize 2x' }),
          tree: b(0, 0, { r: 2.2, h: 48, color: 'green', label: ['RB TreeNode'], sub: 'O(log n) bin' }),
          resz: d(12, -2, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['2x Resize'], sub: 'hash & oldCap' }),
          card: S({ x: -12, y: 12 }, '3. Treeification & Zero-Rehash 2x Resize', [
            '// Treeify when bin >= 8 && table.length >= 64',
            '// On 2x resize, no hashCode() call needed:',
            'if ((e.hash & oldCap) == 0) -> stay at idx',
            'else                        -> move to idx + oldCap',
          ], { icon: 'terminal' }),
        },
        links: {
          k_tb2: h('key', 'tbl', ['key', 'tbl'], { heads: 'end', label: 'bin >= 8' }),
          tb_tr: h('tbl', 'tree', ['tbl', 'tree'], { heads: 'end', label: 'RB-Tree' }),
          tb_rs: h('tbl', 'resz', ['tbl', 'resz'], { heads: 'end', label: 'bit split' }),
        },
        flows: [{ route: ['k_tb2', 'tb_tr'], kind: 'res', rate: 1.9 }, { route: ['tb_rs'], kind: 'req', rate: 1.5 }],
      },
    },
    {
      short: 'Mutated Key',
      chapter: 'map',
      title: '4. equals/hashCode & Why Mutating a Key Loses It',
      body: [
        '<code>HashMap</code> puts <code>user</code> into bucket <code>#3</code> from its initial <code>hashCode()</code>. If you later mutate <code>user.setName("Bob")</code>, its hash changes to bucket <code>#9</code>.',
        'Calling <code>map.get(user)</code> probes bucket <code>#9</code> and returns <code>null</code> — leaking the entry in bucket <code>#3</code>! Always use immutable keys.',
      ],
      callout: {
        kind: 'warn',
        text: 'Effective Java Item 11: Always override hashCode() with equals(), and never mutate fields used in hashCode() after put().',
      },
      changes: ['+ Key stored in bucket #3 on put()', '+ Mutation shifts lookup to #9 -> null'],
      metrics: { backing_store: 'Orphaned Node', collision_op: 'hash + equals', concurrency: 'Broken lookup', tricky_trap: 'Mutated key' },
      scene: {
        entities: {
          mut: d(-14, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Mutate Key'], sub: 'hash: 3 -> 9' }),
          tbl: d(0, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['Bucket #9'], sub: 'get() -> null!' }),
          bkt: b(0, 0, { r: 2.2, h: 48, color: 'purple', label: ['Bucket #3'], sub: 'leaked entry' }),
          card: S({ x: -12, y: 12 }, '4. Why HashMap Keys Must Be Immutable', [
            'User u = new User("Alice");',
            'map.put(u, "admin"); // stored in bucket #3',
            'u.setName("Bob");    // hashCode changes to #9!',
            'map.get(u);          // probes #9 -> null (leaked in #3)!',
          ], { icon: 'terminal' }),
        },
        links: {
          mt_tb: h('mut', 'tbl', ['mut', 'tbl'], { heads: 'end', label: 'probes #9' }),
          tb_b3: h('tbl', 'bkt', ['tbl', 'bkt'], { heads: 'end', label: 'in #3' }),
        },
        flows: [{ route: ['mt_tb'], kind: 'fail', rate: 1.8 }],
      },
    },
    {
      short: 'Immutable',
      chapter: 'immutable',
      title: '5. List.of() / Map.of() vs Collections.unmodifiableList',
      body: [
        '<code>Collections.unmodifiableList(src)</code> is only a read-only <strong>view</strong> — mutating <code>src</code> still mutates the view!',
        'Java 9+ <code>List.of()</code> / <code>Map.of()</code> and <code>List.copyOf()</code> create truly immutable compact structures that reject <code>null</code> elements/keys and throw <code>UnsupportedOperationException</code> on writes.',
      ],
      callout: {
        kind: 'warn',
        text: 'Map.of() and List.of() throw NullPointerException on null keys/elements — unlike HashMap or Arrays.asList().',
      },
      changes: ['+ List.of() rejects null & mutation', '+ List.copyOf() prevents backing drift'],
      metrics: { backing_store: 'Compact Imm', collision_op: 'Open-address', concurrency: 'Thread-safe', tricky_trap: 'Nulls throw NPE' },
      scene: {
        entities: {
          src: d(-14, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['Mutable Src'], sub: 'Arrays.asList' }),
          view: d(0, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['unmodView'], sub: 'leaks edits' }),
          imm: b(0, 0, { r: 2.2, h: 48, color: 'green', label: ['List.copyOf'], sub: 'true immutable' }),
          card: S({ x: -12, y: 12 }, '5. Shallow View vs True Immutability', [
            '// View trap: mutating src still changes view!',
            'var view = Collections.unmodifiableList(src);',
            '// Truly immutable (Java 10+), rejects null:',
            'var safe = List.copyOf(src);',
          ], { icon: 'terminal' }),
        },
        links: {
          sr_vw: h('src', 'view', ['src', 'view'], { heads: 'end', label: 'mutates!' }),
          vw_im: h('view', 'imm', ['view', 'imm'], { heads: 'end', label: 'copyOf' }),
        },
        flows: [{ route: ['sr_vw'], kind: 'fail', rate: 1.5 }, { route: ['vw_im'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'CHM CAS+Sync',
      chapter: 'concurrent',
      title: '6. How ConcurrentHashMap Scales (CAS + Bucket Lock)',
      body: [
        '<code>Collections.synchronizedMap()</code> locks the entire map on every read and write. In Java 8+, <code>ConcurrentHashMap</code> uses <code>volatile</code> reads (lock-free <code>get()</code>)!',
        'On <code>put()</code>, if the bucket is empty it uses lock-free <strong>CAS</strong>; if a collision exists, it <code>synchronized</code>s ONLY on that single bucket’s head <code>Node</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'ConcurrentHashMap rejects null keys and values so get(k) == null unambiguously means absent (no race with containsKey).',
      },
      changes: ['+ Lock-free volatile get()', '+ Empty bucket CAS; collision sync(head)'],
      metrics: { backing_store: 'volatile Node[]', collision_op: 'sync(headNode)', concurrency: 'Per-bucket', tricky_trap: 'No null keys' },
      scene: {
        entities: {
          t1: d(-12, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'cpu', label: ['Writer T1'], sub: 'bucket #2' }),
          tbl: d(0, -8, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['volatile Node[]'], sub: 'lock-free get' }),
          cas: d(12, -16, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['CAS Empty'], sub: 'lock-free put' }),
          head: b(12, -2, { r: 2.2, h: 48, color: 'purple', label: ['sync(head)'], sub: 'bucket lock' }),
          card: S({ x: -12, y: 12 }, '6. ConcurrentHashMap Java 8+ Locking', [
            '// get(k): 100% lock-free volatile read!',
            '// put(k, v):',
            '//   if (tab[i] == null) -> CAS insert (no lock!)',
            '//   else -> synchronized (headNode) { ... }',
          ], { icon: 'terminal' }),
        },
        links: {
          t_tb: h('t1', 'tbl', ['t1', 'tbl'], { heads: 'end', label: 'put(k, v)' }),
          tb_cs: h('tbl', 'cas', ['tbl', 'cas'], { heads: 'end', label: 'CAS' }),
          tb_hd: h('tbl', 'head', ['tbl', 'head'], { heads: 'end', label: 'clash' }),
        },
        flows: [{ route: ['t_tb', 'tb_cs'], kind: 'res', rate: 2.0 }, { route: ['tb_hd'], kind: 'req', rate: 1.6 }],
      },
    },
    {
      short: 'CHM Deadlock',
      chapter: 'concurrent',
      title: '7. Tricky Trap: Recursive computeIfAbsent Deadlock',
      body: [
        '<code>chm.computeIfAbsent(k, fn)</code> holds the <code>synchronized(reservationNode)</code> lock on bucket <code>k</code> while running your lambda <code>fn</code>.',
        'If <code>fn</code> calls <code>chm.computeIfAbsent(otherKey, ...)</code> on the same map and hashes to the same bucket (e.g. Fibonacci memoization), the thread deadlocks on itself!',
      ],
      callout: {
        kind: 'warn',
        text: 'Never call map.put/computeIfAbsent on the SAME ConcurrentHashMap inside a computeIfAbsent mapping function.',
      },
      changes: ['+ ReservationNode locks bucket during fn()', '+ Same-bucket nested call deadlocks'],
      metrics: { backing_store: 'ReservationNode', collision_op: 'Locked bucket', concurrency: 'Self-deadlock!', tricky_trap: 'Nested compute' },
      scene: {
        entities: {
          t1: d(-12, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['computeIfAbs'], sub: 'holds bin lock' }),
          resv: d(0, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Nested Call'], sub: 'same bin hash' }),
          hang: b(0, 0, { r: 2.2, h: 48, color: 'red', label: ['Blocked!'], sub: 'self-deadlock' }),
          card: S({ x: -12, y: 12 }, '7. ConcurrentHashMap Recursive Deadlock', [
            '// BUG: Fibonacci memoization with CHM:',
            'chm.computeIfAbsent(n, k ->',
            '  chm.computeIfAbsent(k - 1, ...) // DEADLOCK if same bin!',
            '); // Keep mapping lambda pure & non-reentrant!',
          ], { icon: 'terminal' }),
        },
        links: {
          fn_rs: h('t1', 'resv', ['t1', 'resv'], { heads: 'end', label: 're-enter' }),
          rs_hg: h('resv', 'hang', ['resv', 'hang'], { heads: 'end', label: 'waits self' }),
        },
        flows: [{ route: ['fn_rs', 'rs_hg'], kind: 'fail', rate: 1.7 }],
      },
    },
  ],
};
