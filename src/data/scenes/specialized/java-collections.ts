import { STAGE, makeDb, makeLink, makePanel, stageBlock, distinctConcepts, cardAt } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage for the whole lesson. The caller thread stays on the left, the collection under
// discussion is always the green block in the middle (same id, new label every act), and
// its backing storage hangs off to the right. `hash()` joins for hash-based acts, a second
// thread for the concurrent ones.
//
//   thread 2        hash()          alt (step 1)
//   main thread ──── coll ───────── backing store

type Tag = { text: string; tone?: string; icon?: string };
type Opts = Record<string, unknown>;

const positions = {
  caller: STAGE.caller,
  coll: STAGE.main,
  store: STAGE.store,
  hash: STAGE.helper,
  alt: STAGE.alt,
  t2: STAGE.caller2,
};

const block = stageBlock;
const caller = (tags: Tag[] = []) =>
  block(positions.caller, { color: `blue`, glyph: `layers`, label: [`main thread`], sub: `caller`, tags });
const t2 = (tags: Tag[] = []) =>
  block(positions.t2, { color: `blue`, glyph: `layers`, label: [`thread 2`], sub: `writer`, tags });
const coll = (label: string, sub: string, tags: Tag[] = [], glyph = `boxes`) =>
  block(positions.coll, { color: `green`, glyph, label: [label], sub, tags });
const store = (label: string, tags: Tag[] = []) =>
  makeDb(positions.store.x, positions.store.y, { r: 2.2, h: 46, glyph: `database`, label, tags });
const hash = (tags: Tag[] = []) =>
  block(positions.hash, { color: `orange`, glyph: `hash`, label: [`hash()`], sub: `spread bits`, tags });
const alt = (label: string, sub: string, tags: Tag[] = []) =>
  block(positions.alt, { color: `slab`, glyph: `route`, label: [label], sub, tags });

const links = {
  call: (label?: string) => makeLink(`caller`, `coll`, [`caller`, `coll`], { heads: `both`, ...(label ? { label } : {}) }),
  back: (label?: string) => makeLink(`coll`, `store`, [`coll`, `store`], { heads: `both`, ...(label ? { label } : {}) }),
  mach: (label?: string) => makeLink(`hash`, `coll`, [`hash`, `coll`], { ...(label ? { label } : {}) }),
  second: (label?: string) => makeLink(`t2`, `coll`, [`t2`, `coll`], { heads: `both`, ...(label ? { label } : {}) }),
  alt: makeLink(`caller`, `alt`, [`caller`, `alt`], { heads: `both`, style: `off` }),
};

/** Code card, parked bottom-left under the caller where nothing else lives. */
const card = cardAt({ x: positions.coll.x, y: positions.coll.y, dx: -250, dy: 150 }, `code`);

export const javaCollectionsLesson: Lesson = distinctConcepts({
  id: 'java-collections',
  title: 'Collections, Maps, Queues & Concurrent Traps',
  summary:
    'See what ArrayList, HashMap, ConcurrentHashMap, deques and heaps really look like in memory — and the traps that follow from it.',
  minutes: 14,
  level: 'core',
  metrics: ['lookup', 'perEntry', 'threads', 'safe'],
  legend: [[`req`, `call`], [`write`, `write / rehash`], [`fail`, `trap`]],
  goals: [
    { text: 'Contrast ArrayList cache locality with LinkedList', step: 1 },
    { text: 'Trace the HashMap hash spread and collision chain', step: 2 },
    { text: 'Treeify long buckets and resize by bit mask', step: 3 },
    { text: 'Enforce equals/hashCode; avoid mutated-key leaks', step: 4 },
    { text: 'Compare List.of() with unmodifiable views', step: 5 },
    { text: 'Lock only the bucket head in ConcurrentHashMap', step: 6 },
    { text: 'Avoid the recursive computeIfAbsent trap', step: 7 },
    { text: 'Choose HashSet, LinkedHashMap (LRU) and TreeMap', step: 8 },
    { text: 'Use ArrayDeque (ring) and PriorityQueue (heap)', step: 9 },
    { text: 'Use EnumSet and EnumMap for enum keys', step: 10 },
    { text: 'Fix fail-fast CME with CopyOnWriteArrayList', step: 11 },
    { text: 'Apply SkipList, IdentityHashMap and Comparator', step: 12 },
  ],
  steps: [
    {
      short: 'ArrayList',
      chapter: 'setup',
      title: 'ArrayList: one block of references',
      body: [
        `An <span class="term">ArrayList</span> keeps its elements in one <code>Object[]</code>. Element <code>i</code> sits at a fixed offset, so <code>get(i)</code> is a single memory read — and the next element is right beside it in the CPU cache.`,
        `A <span class="term">LinkedList</span> allocates one node per element, scattered over the heap. Walking it follows pointers and misses the cache on almost every step: iterating 1M elements takes ~25 ms instead of ~3 ms.`,
      ],
      callout: { kind: 'tip', text: `Pick ArrayList by default. LinkedList only wins when you insert in the middle of a list you already hold an iterator to.` },
      metrics: { lookup: 'O(1)', perEntry: '4 B ref', threads: '1', safe: 'no' },
      scene: {
        entities: {
          caller: caller(),
          coll: coll(`ArrayList`, `Object[]`, [{ text: `contiguous`, tone: `green` }]),
          store: store(`Object[ 10 ]`),
          alt: alt(`LinkedList`, `node per item`, [{ text: `iterate 25 ms`, tone: `red` }]),
          card: card(`Access cost`, [`list.get(500_000)`, `= ArrayList  base + 500_000 × 4   O(1)`, `! LinkedList  follow 500_000 next pointers`]),
        },
        links: { call: links.call(`get(i)`), back: links.back() },
        flows: [{ route: ['call'], rate: 1.6, bounce: true }],
      },
    },
    {
      short: 'HashMap',
      chapter: 'technique',
      title: 'HashMap: hash, spread, mask',
      body: [
        `<code>put(key, v)</code> calls <code>key.hashCode()</code>, then XORs the high 16 bits into the low 16 so the table’s small index keeps some of the high bits. The bucket is <code>(n − 1) &amp; hash</code> — a bit mask, not a modulo.`,
        `Two keys can land in the same bucket. They are chained in a short linked list and told apart with <code>equals()</code>.`,
      ],
      changes: [`+ hash()`, `~ ArrayList → HashMap`, `+ collision chain`],
      metrics: { lookup: 'O(1) avg', perEntry: '~48 B', threads: '1', safe: 'no' },
      scene: {
        entities: {
          caller: caller(),
          coll: coll(`HashMap`, `Node[] table`, [{ text: `load 0.75`, icon: `gauge` }]),
          store: store(`table[16]`, [{ text: `2 keys · bucket 5`, tone: `amber` }]),
          hash: hash(),
          card: card(`Where does a key go?`, [`int h = key.hashCode();`, `h ^= h >>> 16;           // spread`, `int i = (table.length - 1) & h;`, `= same i → chain, compare equals()`]),
        },
        links: { call: links.call(`put / get`), back: links.back(`bucket i`), mach: links.mach() },
        flows: [{ route: ['call'], rate: 1.4, bounce: true }, { route: ['mach'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'Treeify',
      chapter: 'problem',
      title: 'Long chains turn into trees; the table doubles',
      body: [
        `When one chain reaches <b>8</b> nodes and the table has at least 64 buckets, it becomes a red-black tree: worst-case lookup drops from O(n) to O(log n). Below 64 buckets Java resizes instead.`,
        `At 75% load the table <span class="term">doubles</span>. Each node either stays at index <code>i</code> or moves to <code>i + oldCap</code>, decided by one hash bit — no rehashing from scratch.`,
      ],
      changes: [`~ chain → red-black tree`, `~ table 16 → 32`],
      metrics: { lookup: 'O(log n)', perEntry: '~48 B', threads: '1', safe: 'no' },
      scene: {
        entities: {
          caller: caller(),
          coll: coll(`HashMap`, `Node[] table`, [{ text: `12 / 16 entries`, tone: `amber`, icon: `gauge` }]),
          store: store(`table[32]`, [{ text: `bucket 5: tree`, tone: `violet`, icon: `layers` }]),
          hash: hash([{ text: `bad hashes`, tone: `red` }]),
          card: card(`resize()`, [`if (++size > threshold) resize();`, `newCap = oldCap << 1;      // 16 → 32`, `= node.hash & oldCap == 0 ? i : i + oldCap`]),
        },
        links: { call: links.call(`put`), back: links.back(`resize`), mach: links.mach() },
        flows: [{ route: ['back'], kind: 'write', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Mutated key',
      chapter: 'problem',
      title: 'Change a key and the map loses it',
      body: [
        `The bucket is computed from <code>hashCode()</code> <em>when you put</em>. If the key’s fields change afterwards, its hash changes — and <code>get()</code> looks in a different bucket.`,
        `The entry is still in memory, so it leaks. Use immutable keys (<code>String</code>, records, <code>Integer</code>), and always override <code>equals</code> and <code>hashCode</code> together.`,
      ],
      changes: [`~ key field mutated`, `− get() returns null`],
      metrics: { lookup: 'miss', perEntry: '~48 B', threads: '1', safe: 'no' },
      scene: {
        entities: {
          caller: caller([{ text: `p.x = 9`, tone: `red`, icon: `alert` }]),
          coll: coll(`HashMap`, `Point → v`, [{ text: `get(p) = null`, tone: `red` }]),
          store: store(`table[32]`, [{ text: `entry orphaned`, tone: `red`, icon: `alert` }]),
          hash: hash([{ text: `new hash`, tone: `amber` }]),
          card: card(`Mutable key`, [`map.put(p, "A");        // p.x = 1`, `p.x = 9;                  // hash changed`, `! map.get(p)  → null   (wrong bucket)`]),
        },
        links: { call: links.call(`get(p)`), back: links.back(), mach: links.mach() },
        flows: [{ route: ['call'], kind: 'fail', rate: 1, bounce: true }],
      },
    },
    {
      short: 'Immutable',
      chapter: 'tradeoff',
      title: 'List.of() versus an unmodifiable view',
      body: [
        `<code>Collections.unmodifiableList(src)</code> is only a <b>view</b>: nobody can write through it, but whoever holds <code>src</code> still can — and the view sees every change.`,
        `<code>List.of(...)</code> and <code>Map.of(...)</code> are truly immutable copies: no <code>null</code>, no changes, and compact internal arrays.`,
      ],
      changes: [`+ view over source list`, `+ List.of copy`],
      metrics: { lookup: 'O(1)', perEntry: '4 B ref', threads: '1', safe: 'read-only' },
      scene: {
        entities: {
          caller: caller([{ text: `src.add(\"x\")`, tone: `amber` }]),
          coll: coll(`read-only`, `view of src`, [{ text: `sees the add!`, tone: `red`, icon: `eye` }]),
          store: store(`src list`, [{ text: `3 → 4 items`, tone: `amber` }]),
          alt: alt(`List.of(…)`, `real copy`, [{ text: `never changes`, tone: `green`, icon: `lock` }]),
          card: card(`View vs copy`, [`var view = Collections.unmodifiableList(src);`, `src.add("x");           // view.size() == 4`, `= var copy = List.of("a","b","c");   // frozen`]),
        },
        links: { call: links.call(`read`), back: links.back(`wraps`) },
        flows: [{ route: ['call'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'CHM',
      chapter: 'technique',
      title: 'ConcurrentHashMap locks one bucket, not the map',
      body: [
        `Inserting into an <b>empty</b> bucket needs no lock: a single <span class="term">CAS</span> (compare-and-swap) installs the node. Only when the bucket already has a head does the writer <code>synchronized</code> on <em>that head</em>.`,
        `Writers to different buckets never wait for each other, and <code>get()</code> takes no lock at all — table and node values are <code>volatile</code>.`,
      ],
      changes: [`+ thread 2`, `~ HashMap → ConcurrentHashMap`],
      metrics: { lookup: 'O(1) avg', perEntry: '~48 B', threads: '2', safe: 'CAS + lock' },
      scene: {
        entities: {
          caller: caller(),
          t2: t2(),
          coll: coll(`ConcurrentHashMap`, `Node[] table`, [{ text: `thread-safe`, tone: `green`, icon: `shield` }]),
          store: store(`table[32]`, [{ text: `lock: bucket 5 only`, tone: `violet`, icon: `lock` }]),
          card: card(`putVal()`, [`if (tab[i] == null)`, `    casTabAt(tab, i, null, new Node(...)); // no lock`, `else synchronized (tab[i]) { ... }       // head only`]),
        },
        links: { call: links.call(`put`), second: links.second(`put`), back: links.back() },
        flows: [{ route: ['call'], rate: 1.4, bounce: true }, { route: ['second'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'CHM trap',
      chapter: 'problem',
      title: 'computeIfAbsent must not touch the same map',
      body: [
        `<code>computeIfAbsent</code> holds the bucket lock while your lambda runs. If the lambda calls <code>map.computeIfAbsent</code> again for a key in the <em>same</em> bucket, the thread waits on itself.`,
        `Java 8 could hang forever; Java 9+ detects it and throws <code>IllegalStateException: Recursive update</code>. Keep lambdas short, side-effect free and away from the map.`,
      ],
      changes: [`~ lambda re-enters map`, `− bucket lock held twice`],
      metrics: { lookup: 'blocked', perEntry: '~48 B', threads: '1', safe: 'trap' },
      scene: {
        entities: {
          caller: caller([{ text: `inside lambda`, tone: `amber` }]),
          coll: coll(`ConcurrentHashMap`, `Node[] table`, [{ text: `Recursive update`, tone: `red`, icon: `alert` }]),
          store: store(`table[32]`, [{ text: `bucket 5 locked`, tone: `red`, icon: `lock` }]),
          card: card(`Recursive compute`, [`map.computeIfAbsent(a, k ->`, `    map.computeIfAbsent(b, k2 -> load(k2)));`, `! same bucket → IllegalStateException (Java 9+)`]),
        },
        links: { call: links.call(`compute`), back: links.back(`locks head`) },
        flows: [{ route: ['call'], kind: 'fail', rate: 1, bounce: true }],
      },
    },
    {
      short: 'Set · LRU · Tree',
      chapter: 'technique',
      title: 'HashSet, LinkedHashMap and TreeMap',
      body: [
        `<code>HashSet</code> is a <code>HashMap</code> whose values are a shared dummy object. <code>LinkedHashMap</code> adds a doubly linked list through the entries: with <code>accessOrder=true</code> and <code>removeEldestEntry</code> it is a ready-made <b>LRU cache</b>.`,
        `<code>TreeMap</code> is a red-black tree: always sorted, O(log n) for everything, and it compares with <code>compareTo</code> — not <code>equals</code>.`,
      ],
      changes: [`~ coll: LinkedHashMap`, `+ TreeMap alt`],
      metrics: { lookup: 'O(1) / O(log n)', perEntry: '~56 B', threads: '1', safe: 'no' },
      scene: {
        entities: {
          caller: caller(),
          coll: coll(`LinkedHashMap`, `LRU order`, [{ text: `oldest evicted`, tone: `amber`, icon: `clock` }]),
          store: store(`hash + list`),
          alt: alt(`TreeMap`, `sorted · O(log n)`),
          card: card(`LRU in 5 lines`, [`new LinkedHashMap<>(16, .75f, true) {`, `  protected boolean removeEldestEntry(Map.Entry e) {`, `    return size() > 100;`, `  } }`]),
        },
        links: { call: links.call(`get / put`), back: links.back(`access order`) },
        flows: [{ route: ['call'], rate: 1.3, bounce: true }],
      },
    },
    {
      short: 'Deque · Heap',
      chapter: 'technique',
      title: 'ArrayDeque is a ring; PriorityQueue is a heap in an array',
      body: [
        `<code>ArrayDeque</code> keeps head and tail indexes in a power-of-two array and wraps around: add or remove at either end in O(1), no node allocation. Prefer it over <code>Stack</code> and <code>LinkedList</code>.`,
        `<code>PriorityQueue</code> stores a binary <span class="term">min-heap</span> in an array — the children of index <code>i</code> sit at <code>2i+1</code> and <code>2i+2</code>. <code>peek()</code> is O(1), <code>offer</code> and <code>poll</code> are O(log n).`,
      ],
      changes: [`~ coll: ArrayDeque`, `~ store: heap array`],
      metrics: { lookup: 'O(1) ends', perEntry: '4 B ref', threads: '1', safe: 'no' },
      scene: {
        entities: {
          caller: caller(),
          coll: coll(`ArrayDeque`, `ring buffer`, [{ text: `head 6 · tail 2`, tone: `violet` }]),
          store: store(`PriorityQueue`, [{ text: `min at index 0`, tone: `green` }]),
          card: card(`Index math`, [`tail = (tail + 1) & (elements.length - 1);`, `parent(i)  = (i - 1) >>> 1`, `children(i) = 2*i + 1, 2*i + 2`]),
        },
        links: { call: links.call(`addLast`), back: links.back(`offer / poll`) },
        flows: [{ route: ['call'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'EnumSet',
      chapter: 'solution',
      title: 'Enum keys need no hashing at all',
      body: [
        `An <code>EnumSet</code> is a single <code>long</code>: bit <code>ordinal()</code> is 1 when the constant is in the set. Union, intersection and contains become one CPU instruction.`,
        `<code>EnumMap</code> is a plain array indexed by <code>ordinal()</code> — no hashes, no collisions, no boxed entries.`,
      ],
      changes: [`~ coll: EnumSet`, `− hash() not needed`],
      metrics: { lookup: 'O(1) bit', perEntry: '1 bit', threads: '1', safe: 'no' },
      scene: {
        entities: {
          caller: caller(),
          coll: coll(`EnumSet`, `one long`, [{ text: `0b0101`, tone: `violet` }], `hash`),
          store: store(`EnumMap`, [{ text: `array[ordinal]`, tone: `green` }]),
          card: card(`Day of week`, [`EnumSet<Day> work = EnumSet.range(MON, FRI);`, `work.contains(SAT);   // (bits & (1L << 5)) != 0`, `= Map<Day,V> m = new EnumMap<>(Day.class);`]),
        },
        links: { call: links.call(`contains`), back: links.back(`vals[ordinal]`) },
        flows: [{ route: ['call'], rate: 1.8, bounce: true }],
      },
    },
    {
      short: 'CME · COW',
      chapter: 'problem',
      title: 'Fail-fast iterators and CopyOnWriteArrayList',
      body: [
        `Every <code>ArrayList</code> counts structural changes in <code>modCount</code>. Its iterator remembers the count; if another change slips in mid-loop, <code>next()</code> throws <code>ConcurrentModificationException</code> — even in a single thread when you call <code>list.remove</code> inside a for-each.`,
        `<code>CopyOnWriteArrayList</code> never throws: every write copies the whole array, and an iterator walks the snapshot it started with. Great for rarely changed listener lists, bad for write-heavy ones.`,
      ],
      changes: [`+ thread 2 (writer)`, `~ coll: CopyOnWriteArrayList`],
      metrics: { lookup: 'O(1)', perEntry: '4 B ref', threads: '2', safe: 'snapshot' },
      scene: {
        entities: {
          caller: caller([{ text: `iterating`, tone: `amber` }]),
          t2: t2([{ text: `list.add(x)`, tone: `red` }]),
          coll: coll(`CopyOnWrite`, `array snapshot`, [{ text: `no CME`, tone: `green`, icon: `shield` }]),
          store: store(`copy of Object[]`, [{ text: `write = full copy`, tone: `amber`, icon: `layers` }]),
          card: card(`modCount check`, [`for (var x : list) list.remove(x);`, `! ConcurrentModificationException`, `= new CopyOnWriteArrayList<>(list)   // safe`]),
        },
        links: { call: links.call(`iterate`), second: links.second(`add`), back: links.back(`copy on write`) },
        flows: [{ route: ['call'], rate: 1.2, bounce: true }, { route: ['second'], kind: 'write', rate: 0.8 }],
      },
    },
    {
      short: 'SkipList',
      chapter: 'recap',
      title: 'Sorted concurrency, identity and comparators',
      body: [
        `<code>ConcurrentSkipListMap</code> is the sorted, lock-free map: layers of linked lists let it skip ahead in O(log n) without ever locking the whole structure. <code>IdentityHashMap</code> compares keys with <code>==</code> instead of <code>equals()</code>.`,
        `Sort with <code>Comparator.comparing(...).thenComparing(...)</code>; never write <code>a - b</code> for ints (overflow). Rule of thumb: ArrayList, HashMap, ArrayDeque first; reach for the rest when a specific need shows up.`,
      ],
      changes: [`~ coll: ConcurrentSkipListMap`, `+ thread 2`],
      metrics: { lookup: 'O(log n)', perEntry: '~64 B', threads: '2', safe: 'lock-free' },
      scene: {
        entities: {
          caller: caller(),
          t2: t2(),
          coll: coll(`SkipListMap`, `sorted · lock-free`, [{ text: `multi-level`, tone: `violet`, icon: `layers` }]),
          store: store(`towers of links`, [{ text: `skip ahead`, tone: `green` }]),
          alt: alt(`IdentityHashMap`, `compares ==`, [{ text: `rare`, tone: `gray` }]),
          card: card(`Comparator`, [`users.sort(`, `  Comparator.comparingInt(User::age)`, `    .thenComparing(User::name));`, `! (a, b) -> a - b   // overflows`]),
        },
        links: { call: links.call(`get / put`), second: links.second(`put`), back: links.back(`levels`) },
        flows: [{ route: ['call'], rate: 1.4, bounce: true }, { route: ['second'], rate: 1.2, bounce: true }],
      },
    },
  ],
});
