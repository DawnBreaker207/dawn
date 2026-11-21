import type { SimCase, VizCfg } from '@/scripts/lab/java/sim-engine';

export const COLLECTIONS_CASES: Record<string, SimCase[]> = {
  collections: [
    {
      label: '🔄 hash lifecycle',
      steps: [
        { log: 'put("dawn") hash 0x2f → bin 15', explain: 'hash & (n-1) masks to a bucket — power-of-two capacity makes it one AND instruction.', tone: 'info' },
        { log: 'put("ben") → bin 7', explain: 'Uniform hashing distributes keys across the table.', tone: 'info' },
        { log: 'put("cat") → bin 15 collision → equals walk', explain: 'A bin collision means a walk; equals() confirms identity — why equals/hashCode must agree.', tone: 'info' },
        { log: 'bin 15 grows to 9 → TREEIFY → red-black', explain: 'Long bins upgrade to RB-trees: O(log n) worst case replaces O(n).', tone: 'info' },
        { log: 'size 13 > 0.75×16=12 → RESIZE ×2 · rehash all', explain: 'Every entry is re-hashed on resize — pre-size large maps to dodge the spike.', tone: 'warn' },
        { log: 'get("dawn") → 1 probe, hit', explain: 'Amortized O(1) — the point of the whole design.', tone: 'info' },
      ],
    },
    {
      label: '🧟 mutable key',
      steps: [
        { log: 'put(key) → bin 3', explain: 'Entry parked by the hash at insert time.', tone: 'info' },
        { log: 'key.name mutated → hashCode changes', explain: 'The stored bucket no longer matches the computed hash.', tone: 'warn' },
        { log: 'get(key) → new hash → new bin → EMPTY', explain: 'The entry is UNREACHABLE — silent data loss inside a plain HashMap.', tone: 'error' },
        { log: 'remove(key) also fails — the entry leaks', explain: 'Neither lookup nor removal can find it: permanent garbage inside the bin.', tone: 'error' },
        { log: 'rule: keys must be immutable', explain: 'String/record keys have final fields — safe by construction.', tone: 'info' },
      ],
    },
    {
      label: '⚠ fail-fast CME',
      steps: [
        { log: 'iterate entrySet() while putting', explain: 'Fail-fast iterators snapshot the structure revision counter (modCount).', tone: 'warn' },
        { log: 'modCount drift → ConcurrentModificationException', explain: 'The iterator detects the structural modification on the very next step.', tone: 'error' },
        { log: 'fix: ConcurrentHashMap · or collect-then-apply', explain: 'Or use an iterator with explicit removal — never mutate outside it.', tone: 'info' },
      ],
    },
    {
      label: '📦 ArrayList vs LinkedList',
      steps: [
        { log: 'ArrayList.add → amortized O(1)', explain: 'The backing array grows ×1.5 when full: occasional System.arraycopy, cheap appends.', tone: 'info' },
        { log: 'size 10 → grow to 15: copy 10 refs to a new array', explain: 'Growth allocates + copies — pre-size the constructor for known-big lists.', tone: 'info' },
        { log: 'LinkedList.add = node alloc · get(500k) = O(n) walk', explain: 'Nodes live scattered on the heap: cache-hostile, ~3× the memory per element.', tone: 'error' },
        { log: 'rule: default ArrayList · List.of() for immutable', explain: 'Reach for LinkedList only when you mutate the HEAD constantly.', tone: 'info' },
      ],
    },
    {
      label: '🌲 treeify rule',
      steps: [
        { log: 'thresholds: TREEIFY 8 · UNTREEIFY 6 · MIN_CAPACITY 64', explain: 'Three constants govern when a bin upgrades — none is arbitrary.', tone: 'info' },
        { log: 'bin hits 8 BUT table < 64 → RESIZE first', explain: 'Small tables grow instead of treeing — spreading beats trees.', tone: 'warn' },
        { log: 'table ≥ 64 → bin becomes a red-black tree', explain: 'O(n) walk becomes O(log n) worst case — the adversarial-doS shield.', tone: 'info' },
        { log: 'why 8? Poisson: ~0.00000006 chance at good hashing', explain: 'Reaching 8 by accident is vanishingly rare — hitting it means your hash is broken.', tone: 'info' },
        { log: 'tree shrinks → back to a LIST only at length 6', explain: 'Hysteresis gap (8↑ / 6↓) prevents flip-flopping structures.', tone: 'info' },
      ],
    },
    {
      label: '🌪 resize storm',
      steps: [
        { log: 'table[16] fills: size 13 > 0.75×16 = 12', explain: 'The load factor is the trigger — every resize doubles capacity.', tone: 'warn' },
        { log: 'new Node[32] allocated → EVERY bin walks', explain: 'Resize costs O(n) in one shot: the latency spike you feel in prod.', tone: 'error' },
        { log: 'each node splits by ONE hash bit — no re-hash', explain: 'bit(4)==0 stays at index j; bit set moves to j+16 — order preserved.', tone: 'info' },
        { log: 'old table dropped — one GC generational cost', explain: 'The whole table array plus its bins churn at once.', tone: 'info' },
        { log: 'pre-size: new HashMap<>(1_000_000) → zero storms', explain: 'tableSizeFor rounds up — one allocation instead of 5 doublings.', tone: 'info' },
      ],
    },
    {
      label: '⚔ CHM vs HM',
      steps: [
        { log: 'plain HashMap write: one coarse lock on the whole map', explain: 'Safe alone — serializes ALL writers under contention.', tone: 'info' },
        { log: 'CHM on an EMPTY bin → one CAS, zero locks', explain: 'The common case needs no synchronization at all.', tone: 'info' },
        { log: 'bin already has nodes? lock the BIN HEAD only', explain: 'Scope shrank from table → bin: 16 writers can proceed in parallel.', tone: 'info' },
        { log: 'get() is lock-free in both maps', explain: 'Nodes publish immutably — readers never block, never CME.', tone: 'info' },
        { log: 'size() = per-cell counters → a good estimate', explain: 'No global tally — trade exactness for write throughput.', tone: 'info' },
      ],
    },
  ],
  streams: [
    {
      label: '💤 lazy pull',
      steps: [
        { log: 'assemble: filter → map → sorted → collect', explain: 'Nothing runs — a stream is a recipe, not a result.', tone: 'info' },
        { log: 'collect() PULLS → sorted() buffers all first', explain: 'Stateful stages must see every element before emitting one.', tone: 'info' },
        { log: 'element fails filter → 0 downstream work', explain: 'Laziness skips whole stages per element.', tone: 'info' },
        { log: 'map runs only on passing elements', explain: 'Each stage computes exactly what the pipeline needs.', tone: 'info' },
        { log: 'groupingBy(segment) → Map emitted', explain: 'The terminal reduces everything into the final shape.', tone: 'info' },
        { log: 'one pass · zero intermediate lists', explain: 'Fused execution — the pipeline never materializes per-stage collections.', tone: 'info' },
      ],
    },
    {
      label: '✂ short-circuit',
      steps: [
        { log: 'findFirst() starts pulling', explain: 'Short-circuit terminals stop as soon as they can answer.', tone: 'info' },
        { log: 'element 1 matches → done', explain: 'One element satisfied the predicate — execution stops.', tone: 'info' },
        { log: '9,999 elements never consumed', explain: 'Cost equals the work actually needed, not the size of the source.', tone: 'info' },
      ],
    },
    {
      label: '🧱 stateful wall',
      steps: [
        { log: 'sorted() over 10M elements', explain: 'Stateful stages must hold everything before the first output.', tone: 'warn' },
        { log: 'full buffer allocated — nothing flows downstream yet', explain: 'Memory becomes O(N): the stream fattens instead of flowing.', tone: 'error' },
        { log: 'swaps: ORDER BY at the DB · or chunked sorting', explain: 'Push statefulness to the source when the data is big.', tone: 'info' },
      ],
    },
    {
      label: '🧵 parallel()',
      steps: [
        { log: '.parallel() → ForkJoinPool.commonPool (cores-1)', explain: 'The spliterator splits the source into chunks; workers combine partial results at the end.', tone: 'info' },
        { log: 'source of 200 elements → overhead wins', explain: 'Split + join costs more than the work itself — parallelism needs BIG sources or heavy per-element work.', tone: 'warn' },
        { log: 'sorted() in parallel → global barrier', explain: 'Stateful ops make every worker wait at the merge point: parallel buys little there.', tone: 'info' },
        { log: '10M longs + heavy map fn → ≈ ×5 wall time', explain: 'Unboxed, CPU-bound, big-source: the case parallel() was actually built for.', tone: 'info' },
      ],
    },
  ],
  modern: [
    {
      label: '🧩 exhaustive switch',
      steps: [
        { log: 'switch (resp) over sealed Resp — cases: Ok, Err', explain: 'Sealed means the compiler enumerates every permitted subclass.', tone: 'info' },
        { log: 'case Ok(var d) deconstructs in one step', explain: 'Record patterns bind nested components directly into locals.', tone: 'info' },
        { log: 'missing case → COMPILE ERROR', explain: 'Exhaustiveness is enforced by the compiler, not by discipline.', tone: 'warn' },
        { log: 'no default → few fall-through bugs', explain: 'Adding a variant later forces you to state every affected decision site.', tone: 'info' },
      ],
    },
    {
      label: '➕ new variant',
      steps: [
        { log: 'sealed permits Ok, Err — compiles today', explain: 'A closed taxonomy, exactly matching the domain.', tone: 'info' },
        { log: 'add record Retry(int afterMs) to permits', explain: 'The domain grows by declaration, not by scattered instanceof.', tone: 'info' },
        { log: 'every switch over Resp BREAKS: missing Retry', explain: 'The compiler points at every decision site that must learn the new variant.', tone: 'error' },
        { log: 'handle case Retry → clean compile', explain: 'Evolve with the compiler as your checklist.', tone: 'info' },
      ],
    },
  ],
};

export const COLLECTIONS_VIZ: Record<string, VizCfg[]> = {
  collections: [
    {
      code: `Map<String,Integer> users = new HashMap<>(16);  // power-of-two table
users.put("dawn", 1);   // hash & (n-1) → bin 15
users.put("ben", 2);    // bin 7 · users.put("cat") → collides → equals walk
// bin length 9 → TREEIFY into a red-black tree (O(log n) worst)
// size 13 > 0.75×16 → resize ×2 · rehash every entry
users.get("dawn");      // 1 probe — amortized O(1)`,
      line: [2, 2, 3, 4, 5, 6],
      track: ['bin 15 put', 'bin 7 put', 'equals walk', 'treeify RB', 'resize ×2 rehash', '1-probe get'],
      at: [0, 1, 2, 3, 4, 5],
    },
    {
      code: `Point p = new Point(1, 1);  map.put(p, "A");   // binned by p.hashCode()
p.x = 9; p.y = 9;             // hashCode now DIFFERENT
map.get(p);                   // new hash → new bin → EMPTY: "A" unreachable
map.remove(p);                // also misses — "A" leaks inside its bin
// rule: keys immutable (String · records — final fields)`,
      line: [1, 2, 3, 4, 5],
      track: ['put → bin 3', 'field mutated', 'hash diverged', 'get → EMPTY', 'immutable keys'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `for (var e : map.entrySet()) {                    // fail-fast iterator
    if (e.getValue() < 1) map.remove(e.getKey());  // structural change
}   // next step: modCount mismatch → ConcurrentModificationException
// fix: entrySet().removeIf · ConcurrentHashMap for concurrent writes`,
      line: [1, 3, 4],
      track: ['iterate', 'put mid-loop', 'modCount drift → CME', 'fix: CHM'],
      at: [0, 2, 3],
    },
    {
      code: `var list = new ArrayList<Integer>();   // backing Object[] refs
list.add(1);        // amortized O(1) — grow = new array (×1.5) + arraycopy
var ll = new LinkedList<Integer>();    // heap nodes: prev · item · next
ll.get(500_000);    // O(n) pointer walk — cache-hostile, ~3× the memory
// default ArrayList · List.of() immutable · LinkedList only for hot heads`,
      line: [1, 2, 4, 5],
      track: ['ArrayList add', 'grow ×1.5 copy', 'LinkedList node walk', 'default ArrayList'],
      at: [0, 1, 2, 3],
    },
    {
      code: `static final int TREEIFY_THRESHOLD = 8;
static final int UNTREEIFY_THRESHOLD = 6;
static final int MIN_TREEIFY_CAPACITY = 64;
// bin length 8 + table < 64 → RESIZE first (spreading wins)
// bin length 8 + table ≥ 64 → red-black tree: O(log n) worst
// hysteresis: tree shrinks → back to a list only at 6 (no flip-flop)`,
      line: [1, 4, 5, -1, 6],
      track: ['threshold 8 · 6', 'resize first', 'tree built', 'O(log n) walk', 'hysteresis gap'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `var table = new Node[16];                 // power-of-two mandated
size 13 > 0.75 × 16 = 12 → RESIZE
var bigger = new Node[32];                // double, then walk all bins
for (var bin : oldBins) {                 // each bin splits in one pass
    loList → bigger[j];                   // next hash bit == 0 → stays
    hiList → bigger[j + 16];              // bit set → += oldCap, order kept
}
// no re-hash: one arraycopy + one bit test per node
// pre-size big maps → allocate ONCE, skip every storm`,
      line: [1, 2, 3, 6, 8],
      track: ['cap 16 · pow2', 'threshold 12', 'double → 32', 'bin splits lo/hi', 'pre-size dodges'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `map.put(k, v);      // plain HM: one coarse lock covers the map
chm.put(k, v);      // CHM: EMPTY bin → a single CAS, no lock
// bin has nodes? synchronized on the BIN HEAD only
// get(): lock-free in BOTH — nodes publish immutably
// size(): per-cell counters → close estimate, no global tally
// iterators: weakly consistent — they never throw CME`,
      line: [1, 2, 3, 4, 5],
      track: ['HM coarse lock', 'CHM: CAS empty bin', 'bin-head lock', 'reads lock-free', 'size via cells'],
      at: [0, 1, 2, 3, 4],
    },
  ],
  streams: [
    {
      code: `var bills = list.stream()                  // recipe — NOTHING runs yet
    .filter(b -> b.amount() > ZERO)        // drops cheap bills early
    .map(Bill::segment)                    // only survivors reach here
    .sorted(Comparator.comparing(Bill::size))   // stateful — buffers ALL
    .collect(groupingBy(Seg::region));     // terminal drives the pull
// one pass · zero intermediate materialized lists`,
      line: [1, 4, 2, 3, 5, 6],
      track: ['recipe built', 'terminal pulls', 'filter drops', 'map selective', 'groupingBy', 'fused pass'],
      at: [0, 1, 2, 3, 4, 5],
    },
    {
      code: `var first = bills.stream().filter(good).findFirst();  // short-circuits
// element 1 matches → the PULL stops immediately
// 9,999 of 10,000 elements never touched — cost = work actually done`,
      line: [1, 2, 3],
      track: ['findFirst pulls', 'element 1 ✓', '9999 untouched'],
      at: [0, 1, 2],
    },
    {
      code: `bills.stream().sorted().collect(toList());  // stateful: sees EVERYTHING
// 10M elements buffered as a full array — nothing flows downstream yet
// swaps: ORDER BY at the DB · chunked sort · skip the sort if possible`,
      line: [1, 2, 3],
      track: ['sorted() called', 'buffer ALL 10M', 'push to DB'],
      at: [0, 1, 2],
    },
    {
      code: `huge.stream().parallel().map(heavyFn).reduce(sum);
// ForkJoinPool.commonPool (cores-1) · spliterator chunks the source
// SMALL source: split + join overhead > the work — stay sequential
// stateful ops (sorted) force global barriers, shrinking gains
// 10M longs + heavy fn ≈ ×5 wall on 4 cores — the case it was built for`,
      line: [2, 2, 3, 5],
      track: ['source split', 'workers run', 'overhead wins', 'big source wins'],
      at: [0, 1, 2, 3],
    },
  ],
  modern: [
    {
      code: `sealed interface Resp permits Ok, Err {}
String view(Resp r) {
    return switch (r) {              // compiler sees the WHOLE hierarchy
        case Ok(var d)         -> "ok:" + d.id();
        case Err(var c, var w) -> "err:" + c;
    };   // no default — a missing case is a COMPILE error, not a bug
}`,
      line: [1, 4, 6, 3],
      track: ['sealed Resp', 'case Ok(var d)', 'missing case error', 'exhaustive ✓'],
      at: [0, 1, 2, 3],
    },
    {
      code: `sealed interface Resp permits Ok, Err {}
record Ok(Data d) implements Resp {}
record Err(int code) implements Resp {}
// domain grows:  add  record Retry(int afterMs) implements Resp {}
record Retry(int afterMs) implements Resp {}
// NOW every switch over Resp FAILS: "the switch expression does not cover"
case Retry(var a) -> "retry in " + a;   // added → clean compile`,
      line: [1, 5, 6, 7],
      track: ['permits Ok, Err', 'add Retry', 'switches break', 'handle → clean'],
      at: [0, 1, 2, 3],
    },
  ],
};
