import type { SimCase, VizCfg } from '@/scripts/lab/java/sim-engine';

export const JVM_CASES: Record<string, SimCase[]> = {
  string: [
    {
      label: '🔗 pool hit',
      steps: [
        { log: 'a = "code" → literal resolved → pool entry created', explain: 'A string literal compiles to a constant; the JVM places it in the pool the first time it is seen.', tone: 'info' },
        { log: 'b = "code" → SAME pool entry reused', explain: 'Identical literals share one pooled object — zero new allocation.', tone: 'info' },
        { log: 'a == b → true (same identity)', explain: 'Identity equality holds because both variables point at the same pooled instance.', tone: 'info' },
        { log: 'a.hashCode() → cached in the String field', explain: 'The hash is computed once, then reused: Strings are ideal map keys at zero re-hash cost.', tone: 'info' },
      ],
    },
    {
      label: '🆕 heap copy & intern',
      steps: [
        { log: 's3 = new String("code") → separate heap object', explain: 'Explicit new always allocates a fresh object outside the pool, even though "code" is pooled.', tone: 'info' },
        { log: 's3 == a → false · s3.equals(a) → true', explain: 'Same characters, different identity: compare content with equals, identity with ==.', tone: 'warn' },
        { log: 's3.intern() == a → true', explain: 'intern() hands back the pooled twin — classic trick to trade memory dedup for lookup cost.', tone: 'info' },
        { log: 'pool lives on the heap since JDK 7', explain: 'Unreferenced pool entries are weakly referenced and can be collected — no PermGen leaks any more.', tone: 'info' },
      ],
    },
    {
      label: '🧵 concat in loop',
      steps: [
        { log: 'String s = ""; loop i in 1..100k: s += i', explain: 'Each += copies the ENTIRE accumulated prefix into a fresh object: O(N²) bytes over the loop.', tone: 'warn' },
        { log: '100,000 intermediate Strings created', explain: 'The compiler cannot fix a loop-level concat — the objects are per-iteration garbage.', tone: 'error' },
        { log: 'StringBuilder sb; sb.append(i) → one char[]', explain: 'The backing array doubles when full: occasional array copy, amortized O(1) per char.', tone: 'info' },
        { log: 'same 100k: ~2,800 ms vs ~4 ms', explain: 'That is the whole lesson: concat in loops ALWAYS goes to StringBuilder.', tone: 'info' },
      ],
    },
  ],
  lambda: [
    {
      label: '🎯 target typing',
      steps: [
        { log: 'val = x -> x >= 18  (no type written!)', explain: 'A lambda has no standalone type — only the assignment target gives it meaning.', tone: 'info' },
        { log: 'target = Predicate<Integer> → test(Integer) found', explain: 'The compiler hunts a functional interface: exactly one abstract method matching the shape.', tone: 'info' },
        { log: 'assign the same expr to Runnable → COMPILE ERROR', explain: 'A Runnable returns void: same source text, different target, rejected because shapes disagree.', tone: 'warn' },
        { log: 'vs anonymous class: no extra .class file emitted', explain: 'javac records the body as a private synthetic method — the class spins up lazily via invokedynamic.', tone: 'info' },
      ],
    },
    {
      label: '🪄 method refs ×4',
      steps: [
        { log: 'Integer::parseInt → static method ref', explain: 'The lambda body becomes a direct call: n -> Integer.parseInt(n).', tone: 'info' },
        { log: 'String::toUpperCase → unbound ref', explain: 'The RECEIVER becomes argument #1: s -> s.toUpperCase().', tone: 'info' },
        { log: 'System.out::println → bound instance ref', explain: 'The instance is captured once; the lambda supplies only the remaining args.', tone: 'info' },
        { log: 'ArrayList::new → constructor ref', explain: 'All four kinds are just shorter spellings — javac unfolds them into the same shape.', tone: 'info' },
      ],
    },
    {
      label: '🔒 effective finality',
      steps: [
        { log: 'int n = 4; lambda x -> x + n ✓ compiles', explain: 'The captured value is copied into the lambda instance: effectively final is the contract.', tone: 'info' },
        { log: 'n++ inside the lambda → COMPILE ERROR', explain: 'Captured locals must stay effectively final — the snapshot would silently invite race conditions.', tone: 'error' },
        { log: 'mutation via fields or AtomicBoolean works', explain: 'Objects escape by reference — the lambda shares them, read-write, at understood cost.', tone: 'info' },
        { log: 'inside a lambda this = enclosing instance', explain: 'Unlike anonymous classes, a lambda has no this of its own — a frequent review finding.', tone: 'warn' },
      ],
    },
  ],
  io: [
    {
      label: '🪆 decorator batching',
      steps: [
        { log: 'bare FileInputStream.read() → 1 syscall', explain: 'Every read crosses user→kernel: ~1 µs of overhead swamps the single byte fetched.', tone: 'info' },
        { log: 'read a 1 KB file byte-by-byte → 1,024 syscalls', explain: 'A thousand context switches for one kilobyte — IO time is syscall time.', tone: 'warn' },
        { log: 'wrap BufferedInputStream(8 KB) → 1 syscall / 8 KB', explain: 'The decorator fills its internal array with big reads; app code drains from memory.', tone: 'info' },
        { log: 'try-with-resources auto-closes → fd recycled', explain: 'close() runs even mid-exception: file descriptors are a leakable OS resource.', tone: 'info' },
      ],
    },
    {
      label: '🚚 transferTo zero-copy',
      steps: [
        { log: 'byte[] loop copy: disk→kernel buf→user buf', explain: 'Two hops per chunk, CPU copies every byte through user space.', tone: 'warn' },
        { log: '…then user buf→socket kernel buf', explain: 'The third hop — the classic InputStream.transfer loop is 2 copies + 2 syscalls per chunk.', tone: 'warn' },
        { log: 'FileChannel.transferTo → ONE sendfile syscall', explain: 'Page cache streams straight into the socket buffer inside the kernel.', tone: 'info' },
        { log: 'CPU freed · throughput ≈ ×3', explain: 'This is how Kafka and nginx serve files: move bytes in the kernel, not in Java.', tone: 'info' },
      ],
    },
    {
      label: '🔤 charset boundary',
      steps: [
        { log: 'InputStream sees bytes: 0xC3 0xA9', explain: 'A byte stream delivers numbers only — text meaning comes from a charset decision.', tone: 'info' },
        { log: 'decode as UTF-8 → "é"', explain: 'Two bytes form one code point with UTF-8.', tone: 'info' },
        { log: 'decode as Windows-1252 → "Ã©"', explain: 'Same bytes, wrong charset = the classic mojibake — the data is corrupted byte-level.', tone: 'error' },
        { log: 'Reader/Writer wrap bytes WITH a charset', explain: 'Always pass StandardCharsets.UTF_8 explicitly; the platform default is the trap.', tone: 'info' },
      ],
    },
  ],
  generics: [
    {
      label: 'Erasure',
      steps: [
        { log: 'javac checks every use against the bound: (String, String) required', explain: 'ALL generic checking happens here — the compiler is the police.', tone: 'info' },
        { log: 'ERASURE: K, V → Object — signatures go raw in the classfile', explain: 'The runtime never sees T; erasure is why old raw code still links.', tone: 'info' },
        { log: 'call sites get the cast inserted by javac', explain: 'You write zero casts; the compiler writes exactly the ones it proved safe.', tone: 'info' },
        { log: 'runtime: a plain HashMap — no generics anywhere', explain: 'That is also why new T[] is illegal: an erased runtime cannot check array stores.', tone: 'warn' },
        { log: 'get returns Object; inserted cast passes — safe, zero cost', explain: 'Type safety was fully paid at compile time; runtime just rides along.', tone: 'info' },
      ],
    },
    {
      label: 'Bounds & PECS',
      steps: [
        { log: 'bound: only Number-family lists may enter sum()', explain: 'T extends Number keeps the API honest while enabling n.doubleValue().', tone: 'info' },
        { log: 'read via Number — safe for every subtype', explain: 'extends = producer: whatever comes out IS a Number.', tone: 'info' },
        { log: 'src.add(...) refused: compiler cannot name the element type', explain: 'Under erasure the runtime cannot guard a write — so the compiler refuses at the source.', tone: 'warn' },
        { log: 'consumer side: sink.add(42) is fine', explain: 'super = consumer: an Integer belongs in SOME supertype slot.', tone: 'info' },
        { log: 'reading from a super list gives Object only', explain: 'Same erased reason from the other direction — PECS is just consequences.', tone: 'info' },
      ],
    },
    {
      label: 'Heap pollution',
      steps: [
        { log: 'List raw = ints — raw type walks in', explain: 'Raw types opt OUT of the compiler police for everything downstream.', tone: 'warn' },
        { log: 'raw.add("sneaky string") — compiles, heap now polluted', explain: 'The String is inside a List<Integer>; nothing complained because the police were off.', tone: 'error' },
        { log: 'the unchecked warning you ignored was the only warning', explain: 'Java warns; it does not babysit.', tone: 'warn' },
        { log: 'later: (String) ints.get(0) with the implicit cast', explain: 'Detection happens at READING time, wherever that is, maybe 4 files away.', tone: 'info' },
        { log: 'ClassCastException — far from the insert that caused it', explain: 'The distance between dirty write and crash is exactly why warnings matter.', tone: 'error' },
      ],
    },
  ],
  jit: [
    {
      label: 'Interpreter → C1 → C2',
      steps: [
        { log: 'interpreter walks the bytecode one instr at a time', explain: 'Tier 0 gives instant startup and stays as the deopt fallback.', tone: 'info' },
        { log: 'loop is hot → C1 compiles it fast and shallow', explain: 'Tier 3 trades some optimization for quick turnaround.', tone: 'info' },
        { log: 'profile keeps filling: branch targets, receiver types, counts', explain: 'The profile IS the compiler brief — speculation is data-driven.', tone: 'info' },
        { log: 'C2 compiles the hot path: deep optimization, machine code', explain: 'Tier 4 pays the slow compile only for the ~1% of code that matters.', tone: 'info' },
        { log: 'same loop now runs ~100x interpreter speed', explain: 'Warmup is real latency — long-lived services care, requests rarely notice.', tone: 'info' },
      ],
    },
    {
      label: 'Inlined + deopt',
      steps: [
        { log: 'hot caller + small callee area() → inlining candidate', explain: 'Inlining is the king optimization — everything else rides on it.', tone: 'info' },
        { log: 'area() disappears into the caller body', explain: 'No frame push/pop; scalar replacement and range checks profit next.', tone: 'info' },
        { log: 'a Triangle arrives — bimorphic cache: still inlined', explain: 'Two receivers = a branch, cheap to emit and verify.', tone: 'info' },
        { log: 'third receiver type → megamorphic → compiled code DEOPTS', explain: 'The profile broke its promise; guards fail on purpose.', tone: 'error' },
        { log: 'recompile conservatively: virtual call, no inlining', explain: 'Deopt makes speculation safe — wrong guess costs a recompile, not a crash.', tone: 'info' },
      ],
    },
    {
      label: 'Escape analysis',
      steps: [
        { log: 'new Point(3, 4) — allocation? escape analysis first', explain: 'EA asks whether the object is ever seen outside this frame.', tone: 'info' },
        { log: 'p provably never escapes run()', explain: 'No field stores to other objects, no returns, no static writes.', tone: 'info' },
        { log: 'scalar replacement: fields unboxed into locals', explain: 'The "object" becomes two doubles in registers — no memory write at all.', tone: 'info' },
        { log: 'no heap object exists → nothing for Minor GC to move', explain: ' allocation becomes free, which is why Java allocation is NOT C malloc.', tone: 'info' },
        { log: 'bonus: lock on a non-escaping monitor → elided', explain: 'No escape means no sharing means no contention — lock deleted.', tone: 'info' },
      ],
    },
  ],
  errors: [
    {
      label: 'Stack unwinding',
      steps: [
        { log: 'throw constructs the exception inside frame C — full trace frozen', explain: 'The stack snapshot is taken at BIRTH, verbosity and all.', tone: 'error' },
        { log: 'frame C has no catch → popped', explain: 'Unwinding is frame-by-frame: pop until someone handles.', tone: 'info' },
        { log: 'frame B has no catch → popped', explain: 'Any finally/close blocks there ran during the pop, not after.', tone: 'info' },
        { log: 'cleanup cadence: innermost first, on the way out', explain: 'Resource order is preserved by construction — that is the design.', tone: 'info' },
        { log: 'frame A catches — thread lives on', explain: 'Catch = a decided layer takes responsibility; else the thread dies.', tone: 'info' },
      ],
    },
    {
      label: 'Try-with-resources',
      steps: [
        { log: 'two resources opened (out, buf)', explain: 'AutoCloseable entered the try header — close is guaranteed, not hoped for.', tone: 'info' },
        { log: 'body writes, then throws IOException', explain: 'The primary exception is born mid-body with resources still open.', tone: 'error' },
        { log: 'close runs REVERSED: buf first, then out', explain: 'Newest first — because buf wraps out; order preserves correctness.', tone: 'info' },
        { log: 'if THAT close throws too → suppressed, primary stays boss', explain: 'getSuppressed() keeps every side failure — nothing is silently lost.', tone: 'warn' },
        { log: 'all closes ran during unwinding — leak-free', explain: 'This is the whole reason try-with-resources replaced finally blocks.', tone: 'info' },
      ],
    },
    {
      label: 'Checked vs unchecked',
      steps: [
        { log: 'throws IOException sits IN the signature', explain: 'Checked = part of the contract, visible to every caller forever.', tone: 'info' },
        { log: 'callers without catch/throws do not compile', explain: 'The compiler forces a plan BEFORE the failure exists.', tone: 'info' },
        { log: 'planned fallback runs instead of death', explain: 'Handled IO glitch = retry, default, or rethrow — a designed path.', tone: 'info' },
        { log: 'unchecked types skip the contract entirely', explain: 'You could not reasonably plan for NPE at every dereference.', tone: 'warn' },
        { log: 'NPE fires unplanned at runtime', explain: 'Unchecked = trust the code, crash when trust breaks.', tone: 'error' },
      ],
    },
  ],
  metaprog: [
    {
      label: '🏗 compile-time APT',
      steps: [
        { log: 'javac round 1: @AutoService(Billing) discovered', explain: 'Annotation processors run INSIDE the compiler, seeing the source model.', tone: 'info' },
        { log: 'processor generates BillingMapper.java', explain: 'Generated source compiles in the same run — zero reflection at runtime.', tone: 'info' },
        { log: 'javac round 2: compiled clean', explain: 'Multi-round compilation lets generated code reference generated code.', tone: 'info' },
        { log: 'runtime cost: 0.00 ms', explain: 'APT wins on latency and AOT friendliness — that is why Lombok/MapStruct use it.', tone: 'info' },
      ],
    },
    {
      label: '🔮 runtime reflection',
      steps: [
        { log: 'getDeclaredField("repo") — type unknown at compile time', explain: 'Framework code almost never knows YOUR classes statically.', tone: 'info' },
        { log: 'setAccessible(true)', explain: 'Escapes private access — curtailed by JPMS on JDK internals.', tone: 'warn' },
        { log: 'field.set(billing, proxy)', explain: 'This exact line is what Spring bean wiring does under the hood.', tone: 'info' },
        { log: 'cost: ~0.31 ms per invocation', explain: 'Reflection overhead dwarfs direct calls: ~10-100x slower per access.', tone: 'warn' },
        { log: 'fix path: MethodHandles / APT generation', explain: 'Frameworks pre-warm caches and switch to handles when it matters.', tone: 'info' },
      ],
    },
    {
      label: '🧬 dynamic proxy',
      steps: [
        { log: 'Proxy.newProxyInstance(cl, [Payment], handler)', explain: 'The JVM synthesizes a class implementing the interface at runtime.', tone: 'info' },
        { log: '$Proxy24 bytes generated in memory', explain: 'Method dispatch funnel: every call lands in InvocationHandler.invoke.', tone: 'info' },
        { log: 'handler branches: metric / tx / retry', explain: 'AOP, lazy loading, remote stubs — all the same funnel.', tone: 'info' },
        { log: 'no interface? CGLIB subclasses the class (final excluded)', explain: 'Final/private methods can never carry CGLIB advice.', tone: 'warn' },
        { log: 'same trick: Mockito mocks · Hibernate lazy proxies', explain: 'Synthesized classes are the shared foundation of the Java ecosystem.', tone: 'info' },
      ],
    },
  ],
};

export const JVM_VIZ: Record<string, VizCfg[]> = {
  string: [
    {
      code: `String a = "code";            // literal → interned in the pool
String b = "code";            // SAME pooled entry — no allocation
System.out.println(a == b);   // true — identical object
// String caches its hashCode — constant reuse as a map key`,
      line: [1, 2, 3, 4],
      track: ['literal → pool', 'same entry reused', 'a == b (identity)', 'hash cached'],
      at: [0, 1, 2, 3],
    },
    {
      code: `String s3 = new String("code");   // fresh heap object beside the pool
s3 == "code";                     // false — different identity
s3.equals("code");                // true — same characters
s3.intern() == "code";            // true — returns the pooled twin
// pool entries are weakly referenced → collectable`,
      line: [1, 2, 4, 5],
      track: ['heap copy #2', '== vs equals', 'intern() → pooled', 'weak GC'],
      at: [0, 1, 2, 3],
    },
    {
      code: `String s = "";
for (int i = 0; i < 100_000; i++) s += i;   // copies prefix EVERY time
StringBuilder sb = new StringBuilder();     // one growable char[]
for (int i = 0; i < 100_000; i++) sb.append(i);  // amortized O(1) per char
// ~2,800 ms vs ~4 ms — concat in loops ALWAYS goes to StringBuilder`,
      line: [2, 2, 4, 5],
      track: ['+= copies prefix', '100k corpses', 'StringBuilder grows', '~4 ms done'],
      at: [0, 1, 2, 3],
    },
  ],
  lambda: [
    {
      code: `var x = (Integer i) -> i >= 18;              // what TYPE is a lambda?
Predicate<Integer> adult = i -> i >= 18;    // the TARGET types it
Runnable r = () -> {};                      // same rule: 1 abstract method
// javac: no extra .class — LambdaMetafactory spins it at first call`,
      line: [1, 2, 3, 4],
      track: ['no-type lambda', 'target FI found', 'shape mismatch', 'indy spins'],
      at: [0, 1, 2, 3],
    },
    {
      code: `Integer::parseInt        // static — n -> Integer.parseInt(n)
String::toUpperCase      // unbound — s -> s.toUpperCase()
System.out::println      // bound — x -> System.out.println(x)
ArrayList::new           // constructor — () -> new ArrayList<>()`,
      line: [1, 2, 3, 4],
      track: ['static ref', 'unbound ref', 'bound ref', 'ctor ref'],
      at: [0, 1, 2, 3],
    },
    {
      code: `int n = 4;
Runnable r = () -> System.out.println(x + n);  // capture the value
// n++ inside the lambda → COMPILE ERROR (effectively final)
Counter c = new Counter();  r = () -> c.inc();  // objects escape by ref
// a lambda has no this of its own → this = enclosing instance`,
      line: [2, 3, 4, 5],
      track: ['value captured', 'n++ refused', 'object escape', 'this = outer'],
      at: [0, 1, 2, 3],
    },
  ],
  io: [
    {
      code: `InputStream bare = new FileInputStream(f);
bare.read();             // = one read(2) syscall PER byte
// 1 KB byte-by-byte → 1,024 syscalls of pure overhead
try (InputStream in = new BufferedInputStream(new FileInputStream(f), 8192)) {
    in.read();           // fills 8 KB with 1 syscall · drains from memory
}                        // try-with-resources → close() releases the fd`,
      line: [2, 3, 5, 6],
      track: ['read() = syscall', '1024 syscalls', '+ Buffered 8K', 'fd closed'],
      at: [0, 1, 2, 3],
    },
    {
      code: `// byte[] loop: disk → kernel buf → user buf → socket buf
while ((n = in.read(buf)) > 0) out.write(buf, 0, n);  // CPU moves EVERY byte
FileChannel src = new FileInputStream(f).getChannel();
src.transferTo(0, size, dstChannel);   // ONE sendfile — kernel → kernel
// CPU freed for app work · throughput ≈ ×3 (how Kafka · nginx serve files)`,
      line: [1, 2, 4, 5],
      track: ['disk→kernel→user', 'user→socket', 'transferTo', 'kernel-only'],
      at: [0, 1, 2, 3],
    },
    {
      code: `byte[] bytes = "é".getBytes(StandardCharsets.UTF_8);      // C3 A9
String ok = new String(bytes, StandardCharsets.UTF_8);    // → "é"
String bad = new String(bytes, StandardCharsets.ISO_8859_1); // → "Ã©"
// Reader/Writer wrap bytes WITH a charset — always pass UTF-8 explicitly`,
      line: [1, 2, 3, 4],
      track: ['bytes 0xC3 0xA9', 'UTF-8 → é', 'CP1252 → Ã©', 'explicit charset'],
      at: [0, 1, 2, 3],
    },
  ],
  generics: [
    {
      code: `Map<String, String> names = new HashMap<>();
names.put("ana", "first");            // javac checks T = String here

// after erasure the class in the bytecode really is:
// class HashMap {
//     V put(Object key, Object value) { ... }   // K / V gone
// }
String head = names.get("ana");       // javac inserts the (String) cast`,
      line: [2, 6, 8, -1, -1],
      track: ['compile: T checked', 'erasure → Object', 'casts at call sites', 'runtime raw map', 'cast passes = safe'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `static double sum(List<? extends Number> src) {   // producer: read OUT
    double sum = 0;
    for (Number n : src) sum += n.doubleValue();  // read-only: provably safe
    // src.add(1);  ← compile error: WHICH subtype? unknown under erase
    return sum;
}
static void feed(List<? super Integer> sink) {    // consumer: write IN
    sink.add(42);                                 // Integer fits some supertype
    // Number n = sink.get(0);  ← returns Object; the cast is your choice
}`,
      line: [1, 3, 4, 8, 9],
      track: ['bound T: Number', 'producer: read', 'write forbidden', 'consumer: write', 'read forbidden'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `List<Integer> ints = new ArrayList<>();
List raw = ints;                     // raw type: warning only
raw.add("sneaky string");            // heap pollution — still compiles
ints.add(7);                         // ordinary use is fine
String s = (String) ints.get(0);     // discovered HERE, far from the insert
// ClassCastException lands far from the INSERT — that gap is the teacher`,
      line: [2, 3, -1, 5, 6],
      track: ['raw type in', 'unchecked insert', 'warning ignored', 'read + cast', 'CCE far away'],
      at: [0, 1, 2, 3, 4],
    },
  ],
  jit: [
    {
      code: `for (int i = 0; i < 10_000_000; i++) {   // interpreter walks, ~100x slow
    total += i;                          // C1 compiles quickly, shallow opt
}
// profile collected: branch targets, receiver types, hot counts
// hot + rich profile → C2 compiles: deep optimization, machine code
// tiers: 0 interpreter → 3 C1 → 4 C2 · watch: -XX:+PrintCompilation`,
      line: [1, 2, 4, 5, -1],
      track: ['interpreter', 'C1 fires', 'profile fills', 'C2 full opt', '~100x faster'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `Shape s = queue.poll();            // 99.9%: Circle — typed inline cache
log.info(s.area());                // small + hot → INLINED into the caller

// Triangle shows up — bimorphic: still inlined (2-way branch)
// > 2 receiver types → megamorphic → compiled code DEOPTS
// guards fail → back to interpreter → recompile without inlining`,
      line: [1, 2, 4, 5, 6],
      track: ['hot caller', 'area() inlined', 'bimorphic ok', 'deopt!', 'recompile un-inlined'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `double norm(Point p) { return p.x * p.x + p.y * p.y; }

void run() {
    var p = new Point(3, 4);       // allocation? escape analysis first
    norm(p);                       // p never escapes → scalar replaced
}
// fields unboxed into locals: no heap object, no GC pressure
// bonus: synchronized on a non-escaping monitor is elided too`,
      line: [4, -1, 5, 7, 8],
      track: ['new Point', 'escape analysis', 'scalar replaced', 'no heap object', 'lock elision'],
      at: [0, 1, 2, 3, 4],
    },
  ],
  errors: [
    {
      code: `void a() {                                  // frame A — owns the catch
    try { b(); }
    catch (IllegalArgumentException e) { log.warn("planned: " + e.getMessage()); }
}
void b() { c(new File("x")); }              // frame B — no catch
void c(File f) {
    if (!f.exists()) throw new IllegalArgumentException("missing");   // born in C
}`,
      line: [7, 8, 5, -1, 3],
      track: ['throw: trace born', 'C pops', 'B pops', 'cleanup cadence', 'A catches'],
      at: [0, 1, 2, -1, 4],
    },
    {
      code: `try (var out = new FileWriter(f);           // declared 1st → closed LAST
     var buf = new BufferedWriter(out)) {   // declared 2nd → closed FIRST
    buf.write("x");                         // (2) body throws IOException
    throw new IOException("disk full");     // (1) the PRIMARY exception
}
// close runs REVERSED: buf, then out — suppressed stays attached`,
      line: [1, 4, 6, -1, -1],
      track: ['open ×2', 'body throws', 'close newest first', 'close-fail → suppressed', 'leak-free'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `void read() throws IOException {              // contract lives IN signature
    var data = Files.readString(Path.of("c"));   // refuse without catch/throws
}

void caller() {
    try { read(); }                           // compiler FORCES a plan
    catch (IOException e) { log.error("fallback:", e); }
}

void boom(Object o) { o.toString(); }         // unchecked: no contract
// compiles clean — NPE fires at runtime, unplanned`,
      line: [1, 6, 7, 10, 11],
      track: ['contract in signature', 'compiler forces plan', 'planned fallback', 'unchecked: no contract', 'NPE at runtime'],
      at: [0, 1, 2, 3, 4],
    },
  ],
  metaprog: [
    {
      code: `@AutoService(Billing.class)   // javac round 1: processor scheduled
// BillingProcessor generates real source:
public final class BillingMapper { void bind(Billing b) { ... } }
// javac round 2: generated code compiled INTO the same output
// runtime cost 0.00 ms — why Lombok · MapStruct · Dagger choose APT`,
      line: [1, 3, 4, 5],
      track: ['javac round 1', 'APT runs', 'Generated.java', '0 ms runtime'],
      at: [0, 1, 2, 3],
    },
    {
      code: `Field f = Billing.class.getDeclaredField("repo");  // find by name
f.setAccessible(true);        // escape hatch (JPMS can refuse)
f.set(billing, paymentProxy); // EXACTLY what Spring bean wiring does
// ~0.31 ms per access vs ~2 ns direct = 100×+
// frameworks pre-warm caches · hot paths migrate to MethodHandles`,
      line: [1, 2, 3, 4, 5],
      track: ['getDeclaredField', 'setAccessible', 'field.set', '~0.31 ms', 'MethodHandles'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `Payment p = (Payment) Proxy.newProxyInstance(cl,
    new Class[]{ Payment.class },
    (prx, m, args) -> handler.invoke(m, args));
// JVM synthesizes $Proxy24 in memory — every call funnels into handler
// handler branches: metric / tx / retry — AOP · lazy · remote · mocks
// no interface? CGLIB subclasses the class (final methods excluded)`,
      line: [1, 4, 5, 6, 5],
      track: ['newProxyInstance', '$Proxy24 bytes', 'handler funnel', 'CGLIB fallback', 'mocks · lazy'],
      at: [0, 1, 2, 3, 4],
    },
  ],
};
