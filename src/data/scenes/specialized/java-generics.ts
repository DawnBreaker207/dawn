/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaGenericsLesson: Lesson = {
  id: 'java-generics',
  title: 'Generics, Type Erasure & Collections Internals',
  summary:
    'Trace Java collections from raw Object[] arrays through compile-time Generics & Type Erasure, PECS wildcards, ArrayList resizing, and HashMap bucket treeification.',
  minutes: 12,
  level: 'core',
  metrics: ['type_safety', 'backing_store', 'lookup_cost', 'heap_layout'],
  legend: ['flow', ['req', 'compile / lookup'], ['res', 'runtime / treeify'], ['fail', 'cast / collision']],
  goals: [
    { text: 'Contrast raw Object[] with compile-time Generics', step: 1 },
    { text: 'Inspect Type Erasure & synthetic bridge methods', step: 2 },
    { text: 'Apply PECS (? extends / ? super) variance bounds', step: 3 },
    { text: 'Trace ArrayList 1.5x capacity growth & Arrays.copyOf', step: 4 },
    { text: 'Route keys into HashMap Node[] buckets on collision', step: 5 },
    { text: 'Treeify long collision chains into Red-Black TreeNode', step: 6 },
  ],
  steps: [
    {
      short: 'Raw Array',
      chapter: 'generics',
      title: '1. Raw Object[] & ClassCastException Risk',
      body: [
        'Before Java 5, collections stored plain <code>Object</code> references. Anything could be inserted, and bugs only surfaced at runtime with a <code>ClassCastException</code>.',
        'Adding Generics (<code>List&lt;String&gt;</code>) shifts that check to <code>javac</code> compile time without changing the underlying runtime array.',
      ],
      callout: {
        kind: 'warn',
        text: 'Raw List accepts Integer into a String list silently — failure is delayed until the caller casts at read time.',
      },
      metrics: { type_safety: 'Runtime Cast', backing_store: 'Object[]', lookup_cost: 'O(1) index', heap_layout: 'Boxed refs' },
      scene: {
        entities: {
          caller: d(-12, -8, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['Raw Caller'], sub: 'Object cast' }),
          arr: b(4, -8, { r: 2.2, h: 48, color: 'red', label: ['Object[]'], sub: 'untyped heap' }),
          card: S({ x: -12, y: 12 }, '1. Raw Types vs Compile-Time Generics', [
            'List raw = new ArrayList();',
            'raw.add(42); // compiles silently!',
            'String s = (String) raw.get(0); // ClassCastException',
            'List<String> safe = new ArrayList<>(); // checked by javac',
          ], { icon: 'terminal' }),
        },
        links: {
          raw_put: h('caller', 'arr', ['caller', 'arr'], { heads: 'end', label: 'unsafe put' }),
        },
        flows: [{ route: ['raw_put'], kind: 'fail', rate: 1.6 }],
      },
    },
    {
      short: 'Type Erasure',
      chapter: 'generics',
      title: '2. Compile-Time Type Erasure & Bridge Methods',
      body: [
        'Java Generics use <strong>Type Erasure</strong>: <code>javac</code> verifies <code>&lt;T&gt;</code> constraints, then erases type parameters to <code>Object</code> (or their upper bound) in <code>.class</code> bytecode.',
        'When a subclass overrides a generic method with a concrete type, <code>javac</code> emits a synthetic <strong>bridge method</strong> to preserve polymorphism.',
      ],
      callout: {
        kind: 'insight',
        text: 'At runtime, List<String>.class == List<Integer>.class — that is why new T() or instanceof List<String> is illegal.',
      },
      changes: ['+ javac erases <T> to Object / bound', '+ Synthetic bridge method emitted in bytecode'],
      metrics: { type_safety: 'Compile-Time', backing_store: 'Erased Object', lookup_cost: 'O(1)', heap_layout: 'No reified T' },
      scene: {
        entities: {
          src: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['Source <T>'], sub: 'List<String>' }),
          javac: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['javac Eraser'], sub: 'check + erase' }),
          arr: b(14, -10, { r: 2.2, h: 48, color: 'green', label: ['Bytecode'], sub: 'Object + cast' }),
          card: S({ x: -12, y: 12 }, '2. What javac Actually Emits', [
            '// Source:  String get(int i)',
            '// Bytecode: Object get(int i) + checkcast String',
            'class Node<T extends Number> { T val; }',
            '// Erased to: Number val; (upper bound)',
          ], { icon: 'terminal' }),
        },
        links: {
          src_javac: h('src', 'javac', ['src', 'javac'], { heads: 'end', label: 'type check' }),
          javac_arr: h('javac', 'arr', ['javac', 'arr'], { heads: 'end', label: 'erase <T>' }),
        },
        flows: [{ route: ['src_javac', 'javac_arr'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'PECS',
      chapter: 'generics',
      title: '3. Variance & PECS (? extends / ? super)',
      body: [
        'Generic types are <strong>invariant</strong>: <code>List&lt;Integer&gt;</code> is NOT a subtype of <code>List&lt;Number&gt;</code>, preventing heap pollution.',
        'Use <strong>PECS</strong>: <em>Producer Extends</em> (<code>? extends T</code> to safely read <code>T</code>) and <em>Consumer Super</em> (<code>? super T</code> to safely write <code>T</code>).',
      ],
      callout: {
        kind: 'tip',
        text: 'Collections.copy(List<? super T> dest, List<? extends T> src) is the canonical JDK example of PECS.',
      },
      changes: ['+ ? extends T read-only producer', '+ ? super T write-safe consumer'],
      metrics: { type_safety: 'PECS Bounds', backing_store: 'Invariant', lookup_cost: 'Compile check', heap_layout: 'Zero overhead' },
      scene: {
        entities: {
          prod: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'layers', label: ['Producer'], sub: '? extends T' }),
          copier: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['Copy Engine'], sub: 'safe transfer' }),
          cons: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Consumer'], sub: '? super T' }),
          card: S({ x: -12, y: 12 }, '3. PECS: Producer Extends, Consumer Super', [
            'void copy(List<? super Number> dst,',
            '          List<? extends Number> src) {',
            '  for (Number n : src) dst.add(n); // read + write safe',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          prod_cp: h('prod', 'copier', ['prod', 'copier'], { heads: 'end', label: 'read T' }),
          cp_cons: h('copier', 'cons', ['copier', 'cons'], { heads: 'end', label: 'write T' }),
        },
        flows: [{ route: ['prod_cp', 'cp_cons'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'ArrayList',
      chapter: 'collections',
      title: '4. ArrayList Contiguous Array & 1.5x Resize',
      body: [
        '<code>ArrayList</code> wraps a contiguous <code>Object[] elementData</code> array (default capacity 10), giving CPU-cache-friendly $O(1)$ random access.',
        'When full, <code>grow()</code> allocates a new array at <strong>1.5x capacity</strong> (<code>old + (old >> 1)</code>) and copies elements via <code>Arrays.copyOf</code>, giving amortized $O(1)$ append.',
      ],
      callout: {
        kind: 'insight',
        text: 'Pre-sizing new ArrayList<>(expectedSize) avoids repeated 1.5x array allocations and GC churn in hot loops.',
      },
      changes: ['+ Contiguous Object[] cap=10 -> 15', '+ Arrays.copyOf() migrates refs'],
      metrics: { type_safety: 'Compile-Time', backing_store: 'Object[10->15]', lookup_cost: 'O(1) random', heap_layout: 'Contiguous' },
      scene: {
        entities: {
          list: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['ArrayList<E>'], sub: 'size == cap' }),
          grow: d(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['grow() 1.5x'], sub: 'Arrays.copyOf' }),
          newArr: b(14, -10, { r: 2.3, h: 50, color: 'green', label: ['New Array'], sub: 'cap = 15' }),
          card: S({ x: -12, y: 12 }, '4. ArrayList Dynamic Capacity Growth', [
            'int newCap = oldCap + (oldCap >> 1); // 1.5x',
            'elementData = Arrays.copyOf(elementData, newCap);',
            '// Random access get(i): O(1) direct offset',
            '// Mid insert add(0, x): O(n) System.arraycopy',
          ], { icon: 'terminal' }),
        },
        links: {
          list_grow: h('list', 'grow', ['list', 'grow'], { heads: 'end', label: 'overflow' }),
          grow_new: h('grow', 'newArr', ['grow', 'newArr'], { heads: 'end', label: 'copy refs' }),
        },
        flows: [{ route: ['list_grow', 'grow_new'], kind: 'req', rate: 1.9 }],
      },
    },
    {
      short: 'HashMap',
      chapter: 'collections',
      title: '5. HashMap Bucket Array & Hash Collisions',
      body: [
        '<code>HashMap</code> spreads <code>key.hashCode()</code> with <code>(h = key.hashCode()) ^ (h >>> 16)</code>, then masks <code>(n - 1) & hash</code> into a power-of-2 <code>Node[] table</code>.',
        'When two distinct keys land in the same bucket index, they form a singly linked <strong>collision chain</strong> resolved via <code>equals()</code>.',
      ],
      callout: {
        kind: 'warn',
        text: 'Always override both hashCode() and equals() — unequal hash codes break HashMap lookups completely.',
      },
      changes: ['+ Power-of-2 Node[] table', '+ Collision appends Node.next'],
      metrics: { type_safety: 'Hash+Equals', backing_store: 'Node[16]', lookup_cost: 'O(1) avg', heap_layout: 'Linked chain' },
      scene: {
        entities: {
          key: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Key Object'], sub: 'hash^(h>>>16)' }),
          table: d(0, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Node[] Table'], sub: '(n-1) & hash' }),
          chain: b(14, -10, { r: 2.2, h: 48, color: 'amber', label: ['Bucket Chain'], sub: 'Node->Node' }),
          card: S({ x: -12, y: 12 }, '5. HashMap Hashing & Bucket Collision', [
            'int h = key.hashCode();',
            'int hash = h ^ (h >>> 16); // perturb upper bits',
            'int idx = (table.length - 1) & hash;',
            '// Collision: append Node<K,V> to bucket chain',
          ], { icon: 'terminal' }),
        },
        links: {
          key_tbl: h('key', 'table', ['key', 'table'], { heads: 'end', label: 'mask index' }),
          tbl_chn: h('table', 'chain', ['table', 'chain'], { heads: 'end', label: 'collision' }),
        },
        flows: [{ route: ['key_tbl', 'tbl_chn'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Treeify',
      chapter: 'collections',
      title: '6. Java 8+ Bucket Treeification (Red-Black Tree)',
      body: [
        'To defeat hash-flooding DoS attacks, Java 8+ converts a bucket chain into a balanced <strong>Red-Black Tree</strong> (<code>TreeNode</code>) once chain length reaches <code>TREEIFY_THRESHOLD = 8</code> (and table capacity $\\ge 64$).',
        'Worst-case lookup drops from $O(n)$ linear scan to $O(\\log n)$, and shrinks back to a linked list if removals drop the bin to $\\le 6$.',
      ],
      callout: {
        kind: 'insight',
        text: 'Load factor 0.75 balances memory vs collision rate — resizing doubles capacity (2x) and re-masks keys by 1 bit.',
      },
      changes: ['+ Bin length >= 8 triggers treeifyBin()', '+ Lookup drops from O(n) to O(log n)'],
      metrics: { type_safety: 'Comparable', backing_store: 'TreeNode RB', lookup_cost: 'O(log n) worst', heap_layout: 'Balanced tree' },
      scene: {
        entities: {
          table: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Node[] Table'], sub: 'cap >= 64' }),
          chain: d(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['Long Chain'], sub: 'len >= 8' }),
          tree: b(14, -10, { r: 2.3, h: 50, color: 'green', label: ['TreeNode RB'], sub: 'O(log n) bin' }),
          card: S({ x: -12, y: 12 }, '6. HashMap Treeification Thresholds', [
            'static final int TREEIFY_THRESHOLD = 8;',
            'static final int UNTREEIFY_THRESHOLD = 6;',
            'static final int MIN_TREEIFY_CAPACITY = 64;',
            '// Worst-case lookup: O(n) -> O(log n)',
          ], { icon: 'terminal' }),
        },
        links: {
          tbl_chn: h('table', 'chain', ['table', 'chain'], { heads: 'end', label: 'bin >= 8' }),
          chn_tree: h('chain', 'tree', ['chain', 'tree'], { heads: 'end', label: 'treeifyBin' }),
        },
        flows: [{ route: ['tbl_chn', 'chn_tree'], kind: 'res', rate: 1.9 }],
      },
    },
  ],
};
