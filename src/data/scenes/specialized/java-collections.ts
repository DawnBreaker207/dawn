import {
  makeBlock,
  makeDb,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaCollectionsLesson: Lesson = {
  id: 'java-collections',
  title: 'Collections, Maps, Queues & Concurrent Traps',
  summary:
    'Master ArrayList vs LinkedList, HashMap/TreeMap/LinkedHashMap LRU, ArrayDeque/PriorityQueue, EnumSet/EnumMap, Fail-Fast vs CopyOnWrite, ConcurrentHashMap & SkipListMap.',
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
    { text: 'Choose HashSet, LinkedHashMap (LRU) & TreeMap', step: 8 },
    { text: 'Use ArrayDeque (ring) & PriorityQueue (Min-Heap)', step: 9 },
    { text: 'Optimize Enum keys with EnumSet & EnumMap', step: 10 },
    { text: 'Fix Fail-Fast CME & use CopyOnWriteArrayList', step: 11 },
    { text: 'Apply ConcurrentSkipListMap, IdentityHashMap & Comparator', step: 12 },
  ],
  steps: [
    {
      short: 'ArrayList',
      chapter: 'list',
      title: 'Why ArrayList Beats LinkedList Almost Always',
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
          arr: makeDb(-14, -14, { r: 2.3, h: 50, color: 'green', label: ['ArrayList'], sub: 'contiguous L1' }),
          lnk: makeBlock(2, -6, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['LinkedList'], sub: 'cache misses' }),
          card: makePanel({ x: -12, y: 12 }, 'Contiguous Array vs Pointer Chasing', [
            '// ArrayList: O(1) get(i), 1.5x grow = old + (old >> 1)',
            '// LinkedList: 24B+ Node overhead per item + cache miss',
            'Deque<Task> q = new ArrayDeque<>(); // faster than LinkedList',
          ], { icon: 'terminal' }),
        },
        links: {
          ar_ln: makeLink('arr', 'lnk', ['arr', 'lnk'], { heads: 'end', label: 'prefer Array' }),
        },
        flows: [{ route: ['ar_ln'], kind: 'res', rate: 1.7 }],
      },
    },
    {
      short: 'HashMap',
      chapter: 'map',
      title: 'HashMap Perturbation & Bucket Collisions',
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
          key: makeBlock(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Key.hashCode'], sub: 'h^(h>>>16)' }),
          tbl: makeBlock(0, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Node[] Table'], sub: '(n-1) & hash' }),
          bkt: makeDb(0, 0, { r: 2.2, h: 48, color: 'amber', label: ['Bucket Chain'], sub: 'Node.next' }),
          card: makePanel({ x: -12, y: 12 }, 'How HashMap Picks a Bucket', [
            'int h = key.hashCode();',
            'int hash = h ^ (h >>> 16); // mix upper bits!',
            'int idx = (n - 1) & hash;  // fast bitwise modulo',
          ], { icon: 'terminal' }),
        },
        links: {
          k_tb: makeLink('key', 'tbl', ['key', 'tbl'], { heads: 'end', label: 'mask bits' }),
          tb_bk: makeLink('tbl', 'bkt', ['tbl', 'bkt'], { heads: 'end', label: 'clash' }),
        },
        flows: [{ route: ['k_tb', 'tb_bk'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Treeify & Resize',
      chapter: 'map',
      title: 'Bucket Treeify (bin >= 8) & Bit-Mask Resize',
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
          key: makeBlock(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Key (bin>=8)'], sub: 'cap >= 64' }),
          tbl: makeBlock(0, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Node[] Table'], sub: 'resize 2x' }),
          tree: makeDb(0, 0, { r: 2.2, h: 48, color: 'green', label: ['RB TreeNode'], sub: 'O(log n) bin' }),
          resz: makeBlock(12, -2, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['2x Resize'], sub: 'hash & oldCap' }),
          card: makePanel({ x: -12, y: 12 }, 'Treeification & Zero-Rehash 2x Resize', [
            '// Treeify when bin >= 8 && table.length >= 64',
            '// On 2x resize, no hashCode() call needed:',
            'if ((e.hash & oldCap) == 0) -> stay at idx',
            'else                        -> move to idx + oldCap',
          ], { icon: 'terminal' }),
        },
        links: {
          k_tb2: makeLink('key', 'tbl', ['key', 'tbl'], { heads: 'end', label: 'bin >= 8' }),
          tb_tr: makeLink('tbl', 'tree', ['tbl', 'tree'], { heads: 'end', label: 'RB-Tree' }),
          tb_rs: makeLink('tbl', 'resz', ['tbl', 'resz'], { heads: 'end', label: 'bit split' }),
        },
        flows: [{ route: ['k_tb2', 'tb_tr'], kind: 'res', rate: 1.9 }, { route: ['tb_rs'], kind: 'req', rate: 1.5 }],
      },
    },
    {
      short: 'Mutated Key',
      chapter: 'map',
      title: 'equals/hashCode & Why Mutating a Key Loses It',
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
          mut: makeBlock(-14, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Mutate Key'], sub: 'hash: 3 -> 9' }),
          tbl: makeBlock(0, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['Bucket #9'], sub: 'get() -> null!' }),
          bkt: makeDb(0, 0, { r: 2.2, h: 48, color: 'purple', label: ['Bucket #3'], sub: 'leaked entry' }),
          card: makePanel({ x: -12, y: 12 }, 'Why HashMap Keys Must Be Immutable', [
            'User u = new User("Alice");',
            'map.put(u, "admin"); // stored in bucket #3',
            'u.setName("Bob");    // hashCode changes to #9!',
            'map.get(u);          // probes #9 -> null (leaked in #3)!',
          ], { icon: 'terminal' }),
        },
        links: {
          mt_tb: makeLink('mut', 'tbl', ['mut', 'tbl'], { heads: 'end', label: 'probes #9' }),
          tb_b3: makeLink('tbl', 'bkt', ['tbl', 'bkt'], { heads: 'end', label: 'in #3' }),
        },
        flows: [{ route: ['mt_tb'], kind: 'fail', rate: 1.8 }],
      },
    },
    {
      short: 'Immutable',
      chapter: 'immutable',
      title: 'List.of() / Map.of() vs Collections.unmodifiableList',
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
          src: makeBlock(-14, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['Mutable Src'], sub: 'Arrays.asList' }),
          view: makeBlock(0, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['unmodView'], sub: 'leaks edits' }),
          imm: makeDb(0, 0, { r: 2.2, h: 48, color: 'green', label: ['List.copyOf'], sub: 'true immutable' }),
          card: makePanel({ x: -12, y: 12 }, 'Shallow View vs True Immutability', [
            '// View trap: mutating src still changes view!',
            'var view = Collections.unmodifiableList(src);',
            '// Truly immutable (Java 10+), rejects null:',
            'var safe = List.copyOf(src);',
          ], { icon: 'terminal' }),
        },
        links: {
          sr_vw: makeLink('src', 'view', ['src', 'view'], { heads: 'end', label: 'mutates!' }),
          vw_im: makeLink('view', 'imm', ['view', 'imm'], { heads: 'end', label: 'copyOf' }),
        },
        flows: [{ route: ['sr_vw'], kind: 'fail', rate: 1.5 }, { route: ['vw_im'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'CHM CAS+Sync',
      chapter: 'concurrent',
      title: 'How ConcurrentHashMap Scales (CAS + Bucket Lock)',
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
          t1: makeBlock(-12, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'cpu', label: ['Writer T1'], sub: 'bucket #2' }),
          tbl: makeBlock(0, -8, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['volatile Node[]'], sub: 'lock-free get' }),
          cas: makeBlock(14, -18, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['CAS Empty'], sub: 'lock-free put' }),
          head: makeDb(12, -2, { r: 2.2, h: 48, color: 'purple', label: ['sync(head)'], sub: 'bucket lock' }),
          card: makePanel({ x: -12, y: 12 }, 'ConcurrentHashMap Java 8+ Locking', [
            '// get(k): 100% lock-free volatile read!',
            '// put(k, v):',
            '//   if (tab[i] == null) -> CAS insert (no lock!)',
            '//   else -> synchronized (headNode) { ... }',
          ], { icon: 'terminal' }),
        },
        links: {
          t_tb: makeLink('t1', 'tbl', ['t1', 'tbl'], { heads: 'end', label: 'put(k, v)' }),
          tb_cs: makeLink('tbl', 'cas', ['tbl', 'cas'], { heads: 'end', label: 'CAS' }),
          tb_hd: makeLink('tbl', 'head', ['tbl', 'head'], { heads: 'end', label: 'clash' }),
        },
        flows: [{ route: ['t_tb', 'tb_cs'], kind: 'res', rate: 2.0 }, { route: ['tb_hd'], kind: 'req', rate: 1.6 }],
      },
    },
    {
      short: 'CHM Deadlock',
      chapter: 'concurrent',
      title: 'Tricky Trap: Recursive computeIfAbsent Deadlock',
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
          t1: makeBlock(-12, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['computeIfAbs'], sub: 'holds bin lock' }),
          resv: makeBlock(0, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Nested Call'], sub: 'same bin hash' }),
          hang: makeDb(0, 0, { r: 2.2, h: 48, color: 'red', label: ['Blocked!'], sub: 'self-deadlock' }),
          card: makePanel({ x: -12, y: 12 }, 'ConcurrentHashMap Recursive Deadlock', [
            '// BUG: Fibonacci memoization with CHM:',
            'chm.computeIfAbsent(n, k ->',
            '  chm.computeIfAbsent(k - 1, ...) // DEADLOCK if same bin!',
            '); // Keep mapping lambda pure & non-reentrant!',
          ], { icon: 'terminal' }),
        },
        links: {
          fn_rs: makeLink('t1', 'resv', ['t1', 'resv'], { heads: 'end', label: 're-enter' }),
          rs_hg: makeLink('resv', 'hang', ['resv', 'hang'], { heads: 'end', label: 'waits self' }),
        },
        flows: [{ route: ['fn_rs', 'rs_hg'], kind: 'fail', rate: 1.7 }],
      },
    },
    {
      short: 'Set/LRU/Tree',
      chapter: 'map',
      title: 'HashSet, LinkedHashMap (LRU) & TreeMap',
      body: [
        '<code>HashSet</code> is literally a wrapper around <code>HashMap&lt;E, PRESENT&gt;</code>. <code>LinkedHashMap</code> adds a doubly-linked list to preserve insertion order — or set <code>accessOrder = true</code> + <code>removeEldestEntry</code> for an instant <strong>LRU Cache</strong>.',
        '<code>TreeMap</code> / <code>TreeSet</code> use a <strong>Red-Black Tree</strong> ($O(\\log n)$) for sorted range queries (<code>subMap</code>, <code>ceilingKey</code>). Watch out for <code>BigDecimal</code>: <code>1.0</code> vs <code>1.00</code> are distinct in <code>HashSet</code> (<code>equals</code>) but equal in <code>TreeSet</code> (<code>compareTo</code>)!',
      ],
      callout: {
        kind: 'insight',
        text: 'Need O(1) lookup + insertion order? LinkedHashMap. Need sorted keys + range queries? TreeMap.',
      },
      changes: ['+ LinkedHashMap(cap, 0.75f, true) builds LRU Cache', '+ TreeMap sorts keys in Red-Black Tree O(log n)'],
      metrics: { backing_store: 'List+Map / RB', collision_op: 'compareTo()', concurrency: 'Not sync', tricky_trap: 'BigDecimal eq' },
      scene: {
        entities: {
          lhm: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['LinkedHashMap'], sub: 'LRU linked' }),
          hset: makeBlock(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['HashSet<E>'], sub: 'wraps HashMap' }),
          tmap: makeDb(15, -10, { r: 2.2, h: 48, color: 'purple', label: ['TreeMap<K,V>'], sub: 'RB-Tree' }),
          card: makePanel({ x: -12, y: 12 }, 'LinkedHashMap LRU & TreeMap Ordering', [
            '// Instant O(1) LRU Cache with LinkedHashMap:',
            'new LinkedHashMap<>(16, 0.75f, true) {',
            '  protected boolean removeEldestEntry(Entry e) { return size() > 100; }',
            '}; // TreeMap uses Comparator/Comparable (BigDecimal 1.0 == 1.00!)',
          ], { icon: 'terminal' }),
        },
        links: {
          lh_hs: makeLink('lhm', 'hset', ['lhm', 'hset'], { heads: 'end', label: 'O(1) order' }),
          hs_tm: makeLink('hset', 'tmap', ['hset', 'tmap'], { heads: 'end', label: 'O(log n)' }),
        },
        flows: [{ route: ['lh_hs', 'hs_tm'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Deque & Heap',
      chapter: 'queue',
      title: 'ArrayDeque (Ring Buffer) & PriorityQueue (Min-Heap)',
      body: [
        '<code>ArrayDeque</code> uses a circular <code>Object[]</code> ring buffer with <code>head</code> and <code>tail</code> indices — faster than legacy <code>Stack</code> (synchronized) and <code>LinkedList</code> (zero node allocations, rejects <code>null</code>).',
        '<code>PriorityQueue</code> stores a binary <strong>Min-Heap</strong> in an array ($O(\\log n)$ <code>offer/poll</code>, $O(1)$ <code>peek</code>). Note: iterating a <code>PriorityQueue</code> is <strong>NOT</strong> sorted — only repeated <code>poll()</code> yields sorted order!',
      ],
      callout: {
        kind: 'tip',
        text: 'Prefer ArrayDeque over Stack and LinkedList for stacks/queues; use PriorityQueue for Top-K & scheduling.',
      },
      changes: ['+ ArrayDeque ring buffer replaces Stack/LinkedList', '+ PriorityQueue maintains binary Min-Heap'],
      metrics: { backing_store: 'Ring / Heap[]', collision_op: 'siftUp / Down', concurrency: 'Unsafe!', tricky_trap: 'Iter unsorted' },
      scene: {
        entities: {
          deq: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['ArrayDeque'], sub: 'ring head/tail' }),
          pq: makeBlock(1, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['PriorityQueue'], sub: 'Min-Heap' }),
          top: makeDb(15, -10, { r: 2.2, h: 48, color: 'blue', label: ['poll() Min'], sub: 'O(log n) sift' }),
          card: makePanel({ x: -12, y: 12 }, 'ArrayDeque & PriorityQueue Usage', [
            'Deque<String> stack = new ArrayDeque<>(); // push() / pop()',
            'PriorityQueue<Task> pq = new PriorityQueue<>(',
            '  Comparator.comparingInt(Task::priority)); // Min-Heap',
            '// pq.forEach() is NOT sorted! Use while (!pq.isEmpty()) pq.poll()',
          ], { icon: 'terminal' }),
        },
        links: {
          dq_pq: makeLink('deq', 'pq', ['deq', 'pq'], { heads: 'end', label: 'vs heap' }),
          pq_tp: makeLink('pq', 'top', ['pq', 'top'], { heads: 'end', label: 'poll()' }),
        },
        flows: [{ route: ['dq_pq', 'pq_tp'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'EnumSet & Map',
      chapter: 'enum',
      title: 'Bit-Vector EnumSet & Array-Backed EnumMap',
      body: [
        '<code>EnumSet</code> packs all enum flags into a single <strong>64-bit <code>long</code> bitmask</strong> (<code>RegularEnumSet</code>) — <code>contains()</code>, <code>union</code>, and <code>intersection</code> execute in 1 CPU bitwise instruction with zero Heap nodes.',
        '<code>EnumMap</code> stores values in a plain <code>Object[]</code> indexed directly by <code>key.ordinal()</code> — faster than <code>HashMap</code> with zero hash collisions.',
      ],
      callout: {
        kind: 'tip',
        text: 'Whenever your Set or Map key is an Enum, always choose EnumSet / EnumMap over HashSet / HashMap.',
      },
      changes: ['+ EnumSet packs flags into 1 long bit-vector', '+ EnumMap indexes Object[] by enum.ordinal()'],
      metrics: { backing_store: 'long / Object[]', collision_op: '0 collisions', concurrency: 'Not sync', tricky_trap: 'Enum keys only' },
      scene: {
        entities: {
          enm: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'code', label: ['Enum.ordinal()'], sub: '0, 1, 2, ...' }),
          eset: makeBlock(1, -16, { s: 4.6, h: 52, color: 'green', glyph: 'zap', label: ['EnumSet'], sub: 'long bitmask' }),
          emap: makeDb(1, -2, { r: 2.2, h: 48, color: 'blue', label: ['EnumMap'], sub: 'arr[ordinal]' }),
          card: makePanel({ x: -12, y: 12 }, 'Zero-Overhead EnumSet & EnumMap', [
            'EnumSet<Role> roles = EnumSet.of(Role.ADMIN, Role.EDITOR);',
            '// Stored as a single 64-bit long bitmask (O(1) bitwise!)',
            'Map<Status, Handler> map = new EnumMap<>(Status.class);',
            '// Direct array lookup: vals[status.ordinal()] — 0 hashing!',
          ], { icon: 'terminal' }),
        },
        links: {
          en_es: makeLink('enm', 'eset', ['enm', 'eset'], { heads: 'end', label: '1L << ord' }),
          en_em: makeLink('enm', 'emap', ['enm', 'emap'], { heads: 'end', label: 'arr[ord]' }),
        },
        flows: [{ route: ['en_es'], kind: 'res', rate: 2.0 }, { route: ['en_em'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'Fail-Fast COW',
      chapter: 'concurrent',
      title: 'Fail-Fast CME Trap vs CopyOnWriteArrayList',
      body: [
        'Calling <code>list.remove(x)</code> inside a <code>for-each</code> loop increments <code>modCount</code> while the iterator checks <code>modCount != expectedModCount</code>, throwing <code>ConcurrentModificationException</code> (Fail-Fast). Fix it with <code>list.removeIf(...)</code> or <code>Iterator.remove()</code>.',
        'For read-heavy, rarely-modified listener lists across threads, <code>CopyOnWriteArrayList</code> creates a fresh array snapshot on every write so readers iterate lock-free.',
      ],
      callout: {
        kind: 'warn',
        text: 'Never use CopyOnWriteArrayList for write-heavy workloads — every add/set copies the entire backing array!',
      },
      changes: ['+ modCount mismatch triggers Fail-Fast CME', '+ CopyOnWriteArrayList snapshots array on writes'],
      metrics: { backing_store: 'modCount / COW', collision_op: 'Arrays.copyOf', concurrency: 'Lock-free read', tricky_trap: 'for-each remove' },
      scene: {
        entities: {
          loop: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['for-each remove'], sub: 'modCount err' }),
          fix: makeBlock(1, -16, { s: 4.6, h: 52, color: 'green', glyph: 'shield', label: ['list.removeIf()'], sub: 'safe mutate' }),
          cow: makeDb(1, -2, { r: 2.2, h: 48, color: 'blue', label: ['CopyOnWrite'], sub: 'write snapshot' }),
          card: makePanel({ x: -12, y: 12 }, 'Fixing CME & CopyOnWriteArrayList', [
            '// BUG: throws ConcurrentModificationException:',
            'for (var s : list) if (s.isEmpty()) list.remove(s);',
            '// FIX: list.removeIf(String::isEmpty);',
            '// Thread-safe listeners: new CopyOnWriteArrayList<>()',
          ], { icon: 'terminal' }),
        },
        links: {
          lp_fx: makeLink('loop', 'fix', ['loop', 'fix'], { heads: 'end', label: 'removeIf()' }),
          lp_cw: makeLink('loop', 'cow', ['loop', 'cow'], { heads: 'end', label: 'snapshot' }),
        },
        flows: [{ route: ['lp_fx'], kind: 'res', rate: 1.8 }, { route: ['lp_cw'], kind: 'req', rate: 1.5 }],
      },
    },
    {
      short: 'SkipList & Sort',
      chapter: 'advanced',
      title: 'ConcurrentSkipListMap, IdentityHashMap & Comparator',
      body: [
        'Need both <strong>concurrency AND sorted keys</strong>? Use <code>ConcurrentSkipListMap</code> (lock-free SkipList) since <code>ConcurrentHashMap</code> is unsorted. For object-graph traversal using <code>==</code> instead of <code>equals()</code>, use <code>IdentityHashMap</code>.',
        'Daily sorting & factories: chain <code>Comparator.comparing(...).thenComparing(..., nullsLast(...))</code>; use <code>Map.ofEntries(...)</code> when >10 entries; remember Java 16+ <code>stream.toList()</code> returns an <strong>unmodifiable</strong> list!',
      ],
      callout: {
        kind: 'insight',
        text: 'stream.toList() (Java 16+) is unmodifiable and allows nulls, whereas List.of() rejects nulls and Collectors.toList() is mutable.',
      },
      changes: ['+ ConcurrentSkipListMap provides sorted concurrent map', '+ Comparator fluent API + Stream.toList()'],
      metrics: { backing_store: 'SkipList / ==', collision_op: 'CAS / Identity', concurrency: 'Lock-free sort', tricky_trap: 'Map.of max 10' },
      scene: {
        entities: {
          skip: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['SkipListMap'], sub: 'sorted + CAS' }),
          idmap: makeBlock(1, -10, { s: 4.8, h: 54, color: 'cyan', glyph: 'shield', label: ['IdentityMap'], sub: 'uses == ref' }),
          comp: makeBlock(15, -10, { s: 4.6, h: 52, color: 'green', glyph: 'code', label: ['Comparator'], sub: 'fluent sort' }),
          card: makePanel({ x: -12, y: 12 }, 'SkipListMap, IdentityMap & Daily Helpers', [
            'ConcurrentNavigableMap<Long, Order> sorted = new ConcurrentSkipListMap<>();',
            'Map<Object, Object> graph = new IdentityHashMap<>(); // compares ==',
            'var cmp = Comparator.comparing(User::age).thenComparing(User::name);',
            'var imm = stream.toList(); // unmodifiable! Map.ofEntries() for >10',
          ], { icon: 'terminal' }),
        },
        links: {
          sk_id: makeLink('skip', 'idmap', ['skip', 'idmap'], { heads: 'end', label: 'special maps' }),
          id_cm: makeLink('idmap', 'comp', ['idmap', 'comp'], { heads: 'end', label: 'sort & list' }),
        },
        flows: [{ route: ['sk_id', 'id_cm'], kind: 'res', rate: 1.8 }],
      },
    },
  ],
};
