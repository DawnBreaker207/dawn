// Java Lab tab definitions — extracted from java.astro

export interface JavaTab {
  id: string;
  title: string;
  badge: string;
  tone: string;
  explain: string;
  why: string;
  flow: string;
  diagram: string;
  code: string;
}

export interface SubTopic {
  id: string;
  label: string;
  explain: string;
  why: string;
  flow: string;
  diagram: string;
  code: string;
}

export const SUBS: SubTopic[] = [
  {
    id: 'threads',
    label: 'Threads & Monitors',
    explain:
      'Picture a bathroom with one mirror: new Thread() builds the person object, start() actually sends them to work. Every Java object IS a tiny bathroom (one built-in monitor door) — one thread inside, others park at the door (BLOCKED), and wait() moves holders into the waiting room until notify() calls them back.',
    why: 'Why does the lock live INSIDE every object? Because the monitor must protect that exact data — gluing the lock to the object means anyone who can reach the field can also coordinate access, with no extra lock registry to lose, forget or order wrong.',
    flow: 'Read it left to right: new Thread() only builds an object on your heap — the real OS thread appears the moment start() runs. From RUNNABLE there are exactly three exits: monitor taken first → park as BLOCKED in the entry set; holder calls wait() → move to the wait set until notify(); run() finishes → TERMINATED and the OS thread is gone.',
    diagram: `
      <div class="jx-row"><span class="jx-n">new Thread()</span><span class="jx-a">→</span><span class="jx-n">start()</span><span class="jx-a">→</span><span class="jx-n hot">RUNNABLE</span></div>
      <div class="jx-row pl-4"><span class="jx-a">├</span><span class="jx-n">monitor taken</span><span class="jx-a">→</span><span class="jx-n bad">BLOCKED</span><span class="jx-tag">entry set</span></div>
      <div class="jx-row pl-4"><span class="jx-a">├</span><span class="jx-n">wait()</span><span class="jx-a">→</span><span class="jx-n">WAITING</span><span class="jx-tag">needs notify()</span></div>
      <div class="jx-row pl-4"><span class="jx-a">└</span><span class="jx-n">run() returns</span><span class="jx-a">→</span><span class="jx-n io">TERMINATED</span></div>
    `,
    code: `synchronized void add(int v) { shared.add(v); } // ONE monitor guards shared state
new Thread(() -> add(1)).start();  // racing free-for-all = lost updates
// deadlock: T1 locks A wants B · T2 locks B wants A — always lock in one order`,
  },
  {
    id: 'executor',
    label: 'Thread Pools',
    explain:
      'A pool is a small kitchen: a few permanent cooks (core), a waiting shelf (queue), cooks you may call in only when the shelf is full (max), and a rule for a FULL night (rejection). The famous trap: extra cooks are hired only AFTER the shelf overflows — not merely because the core cooks are busy.',
    why: 'Why the odd order (core → queue → extra threads)? Threads are EXPENSIVE — ~1 MB of OS stack each. The queue absorbs cheap bursts so the pool only pays for extra threads when demand is proven to persist.',
    flow: 'Every task walks the same admission ladder: idle core? take it. Cores busy? wait on the queue shelf. Shelf full? hire a max cook. Kitchen and shelf both full? the rejection policy throws the order away. That ladder is the entire lifecycle of one execute() call.',
    diagram: `
      <div class="jx-row"><span class="jx-n">submit(task)</span><span class="jx-a">→</span><span class="jx-n hot">core free?</span><span class="jx-a">→</span><span class="jx-n io">run</span></div>
      <div class="jx-row pl-4"><span class="jx-a">├</span><span class="jx-n">queue full?</span><span class="jx-a">→</span><span class="jx-n">spawn up to max</span></div>
      <div class="jx-row pl-4"><span class="jx-a">└</span><span class="jx-n">max+queue busy</span><span class="jx-a">→</span><span class="jx-n bad">reject</span><span class="jx-tag">CallerRuns = backpressure</span></div>
      <div class="jx-row"><span class="jx-tag">CPU-bound ≈ cores · IO-bound ≈ cores × (1 + wait/compute)</span></div>
    `,
    code: `new ThreadPoolExecutor(4, 16, 60, SECONDS,
    new ArrayBlockingQueue<>(100), new ThreadPoolExecutor.CallerRunsPolicy());`,
  },
  {
    id: 'completable',
    label: 'CompletableFuture',
    explain:
      'CompletableFuture is a chain of callbacks, like connecting flights: when leg A lands, leg B departs by itself — you never stand at the gate blocking. Errors travel down the chain as values too, and exceptionally() is the built-in detour when a leg crashes.',
    why: 'Why callbacks instead of get()? Every get() parks a whole thread just to wait. Composition lets each thread run whatever is READY next, so a few threads can drive hundreds of in-flight stages without blocking anyone.',
    flow: 'Read it like connecting flights: supplyAsync departs leg A, thenApply is boarded the instant A lands, the two parallel legs race and applyToEither picks whoever arrives first. exceptionally() is the rebooking desk — it fires only when a leg crashes. join() at the end just reads the final boarding pass.',
    diagram: `
      <div class="jx-row"><span class="jx-n">supplyAsync(io)</span><span class="jx-a">→</span><span class="jx-n">thenApply</span><span class="jx-a">→</span><span class="jx-n">thenCompose</span></div>
      <div class="jx-row"><span class="jx-n">cf1.thenCombine(cf2)</span><span class="jx-a">→</span><span class="jx-n io">join()</span><span class="jx-tag">no parking</span></div>
      <div class="jx-row"><span class="jx-n bad">exception</span><span class="jx-a">→</span><span class="jx-n">exceptionally</span><span class="jx-tag">error = just another stage</span></div>
    `,
    code: `supplyAsync(() -> fetchUser(id), ioPool)
    .thenCompose(u -> api.balance(u))
    .exceptionally(ex -> ZERO)
    .thenAccept(out::send);`,
  },
  {
    id: 'virtual',
    label: 'Virtual Threads (JDK 21)',
    explain:
      'A virtual thread is a cheap, make-believe thread the JVM juggles for you. When it blocks on IO, the JVM saves its stack to the heap (unmount), frees the real carrier thread, and mounts another VT — like putting a book aside mid-page and reading a different one, with no bookshelf cost.',
    why: 'Why park stacks to the heap instead of the OS? A real OS thread costs ~1 MB of kernel memory and a syscall to juggle; a parked VT is just plain bytes in Java heap — that is how millions of idle tasks sit on top of a handful of carriers.',
    flow: 'One carrier (real thread) mounts a VT and runs it; IO blocks → the JVM copies that stack into the heap and the carrier instantly mounts the NEXT VT; IO completes → resume from the snapshot. The diagram is one loop — mount, block, unmount, remount — and no OS thread ever sits idle waiting.',
    diagram: `
      <div class="jx-row"><span class="jx-n hot">1M VTs</span><span class="jx-a">→</span><span class="jx-n">few carriers (ForkJoin)</span></div>
      <div class="jx-row"><span class="jx-n">IO blocks</span><span class="jx-a">→</span><span class="jx-n io">UNMOUNT</span><span class="jx-a">→</span><span class="jx-tag">stack saved to heap, carrier free</span></div>
      <div class="jx-row"><span class="jx-n bad">pinning</span><span class="jx-a">→</span><span class="jx-tag">synchronized / native frames can NOT unmount — use ReentrantLock</span></div>
    `,
    code: `try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    ex.submit(() -> fetch(i));   // one VT per task — never pool VTs
}`,
  },
];

export const TABS: JavaTab[] = [
  {
    id: 'concurrency',
    title: 'Concurrency',
    badge: '4 engines',
    tone: 'text-sky-600 dark:text-sky-400',
    explain:
      'Four engine models, one select: raw threads & monitors, sized thread pools, the non-blocking CompletableFuture pipeline, and JDK 21 virtual threads. Each pick swaps the explanation and auto-runs its simulation.',
    why: 'Why four engines? They answer four different questions: monitors for CORRECTNESS, pools for THROUGHPUT control, futures for COMPOSING async work, virtual threads for blocking-IO at scale.',
    flow: '',
    diagram: '',
    code: '',
  },
  {
    id: 'collections',
    title: 'Collections',
    badge: 'bins',
    tone: 'text-amber-600 dark:text-amber-400',
    explain:
      'Picture a hall of numbered lockers: every key is hashed once, the number opens the right locker directly — get() is O(1), no search at all. Two keys may land in the same locker (collision) → walk the short line inside and equals() tells them apart; when the hall fills up, it doubles and every key re-hashes to a new locker.',
    why: 'Why hashing at all? A computer can turn a key into an integer in ONE step but cannot look up meaning by content — hash buckets trade some unused space for constant-time lookup, and equals() exists only to settle the rare collisions.',
    flow: 'put(key) first hashes: the mixed bits are masked into the bin range, then a very short equals() walk confirms a match. get(key) repeats that exact walk. When size crosses 0.75 × capacity, the table doubles and each old bin splits its keys between two new bins — that split is the whole resize you see diagrammed.',
    diagram: `
      <div class="jx-row"><span class="jx-n">key</span><span class="jx-a">→</span><span class="jx-n">hash &amp; (n-1)</span><span class="jx-a">→</span><span class="jx-n hot">bin</span></div>
      <div class="jx-row"><span class="jx-n">bin &gt; 8</span><span class="jx-a">→</span><span class="jx-n bad">treeify (RB)</span><span class="jx-tag">O(log n) worst</span></div>
      <div class="jx-row"><span class="jx-n">size &gt; 0.75×cap</span><span class="jx-a">→</span><span class="jx-n">resize ×2, rehash all</span></div>
      <div class="jx-row"><span class="jx-tag">equals/hashCode must agree — or keys silently vanish</span></div>
    `,
    code: `users.put("dawn", user);   // hash → bin 3
// put while iterating → ConcurrentModificationException (fail-fast)`,
  },
  {
    id: 'string',
    title: 'String Internals',
    badge: 'pool',
    tone: 'text-lime-700 dark:text-lime-300',
    explain:
      'Strings are carved in stone: no method ever changes one — any "editing" produces a brand-new object and even reads stay safe during sharing. Literals like "code" live exactly ONCE in a shared pool; every String also caches its own hashCode in the stone.',
    why: 'Why immutable? Shared cached data must never change under its readers. Immutability lets thousands of variables safely share ONE pool instance (memory), keeps the hash stable forever (perfect map key), and deletes whole classes of concurrency bugs.',
    flow: 'Both literals hold the same characters, so the second one is handed a pointer to the SAME pool object — that is the a == b identity line. concat/replace build a fresh object and hand it back while the original stays untouched. hashCode() is computed exactly once and then cached on the object itself.',
    diagram: `
      <div class="jx-row"><span class="jx-n">literal "code"</span><span class="jx-a">→</span><span class="jx-n hot">string pool (heap since JDK 7)</span><span class="jx-tag">one object, all literals share it</span></div>
      <div class="jx-row"><span class="jx-n">new String("code")</span><span class="jx-a">→</span><span class="jx-n bad">heap copy #2</span><span class="jx-tag">== false · equals true</span></div>
      <div class="jx-row"><span class="jx-n">s += "x" in a loop</span><span class="jx-a">→</span><span class="jx-n bad">copies the whole prefix, every time</span><span class="jx-tag">O(N²) total</span></div>
      <div class="jx-row"><span class="jx-n">StringBuilder</span><span class="jx-a">→</span><span class="jx-n">one growable char[]</span><span class="jx-tag">concat in loops goes here</span></div>
    `,
    code: `String a = "code", b = "code";
a == b;                       // true  — same pool entry
a == new String("code");      // false — fresh heap object
new String("code").intern() == a; // true — returned the pooled twin`,
  },
  {
    id: 'streams',
    title: 'Lazy Streams',
    badge: 'pull',
    tone: 'text-cyan-700 dark:text-cyan-300',
    explain:
      'A stream is a written recipe, NOT a cooked meal: filter/map/sorted only add lines to the recipe — nothing computes until a terminal like collect() decides to cook, and even then each element travels the assembly line one by one (no per-stage storage).',
    why: 'Why this laziness? It lets the engine SKIP work: a short-circuit op like findFirst() eats one element and stops — cost = work actually REQUIRED, never the size of the source; eager evaluation would have chewed everything up front.',
    flow: 'collect() opens the valve: the source emits element 1, it flows filter → map → collect, and only THEN does element 2 start the same trip. sorted() is the one jam point — it must hold all upstream output, so everything before it still streams lazily. No terminal call = the valve never opens = zero work.',
    diagram: `
      <div class="jx-row"><span class="jx-n">stream()</span><span class="jx-tag">lazy</span><span class="jx-a">→</span><span class="jx-n">filter</span><span class="jx-a">→</span><span class="jx-n">map</span><span class="jx-a">→</span><span class="jx-n hot">collect()</span><span class="jx-tag">terminal pulls</span></div>
      <div class="jx-row"><span class="jx-n">sorted / distinct</span><span class="jx-tag">stateful — buffer everything</span><span class="jx-a">→</span><span class="jx-n io">findFirst</span><span class="jx-tag">short-circuits</span></div>
    `,
    code: `bills.stream().filter(b -> b.amount() > ZERO)
    .collect(groupingBy(Bill::segment));`,
  },
  {
    id: 'lambda',
    title: 'Lambda & Functional Interfaces',
    badge: 'indy',
    tone: 'text-violet-600 dark:text-violet-300',
    explain:
      'A lambda is just syntax for a piece of BEHAVIOR — it owns no type; the functional interface you assign it to (one abstract method) types it. Strings::toUpperCase is the same lambda spelled shorter, and the JVM lazily forges the implementing object at first call (invokedynamic).',
    why: 'Why no own type? The same lambda body wants to be a Predicate here and a Function there — target typing lets the compiler pick the exact interface, and invokedynamic (indy) avoids paying for a class per lambda site until the code actually runs.',
    flow: 'javac writes the lambda BODY into a hidden static method and parks an invokedynamic call site — no class file exists yet. On first execution LambdaMetafactory forges the implementing class in memory; every later call is a plain interface invoke. Same behavior as an anonymous class, cheaper startup and smaller bytecode.',
    diagram: `
      <div class="jx-row"><span class="jx-n">x -&gt; x &gt;= 18</span><span class="jx-a">→</span><span class="jx-n hot">target typing</span><span class="jx-a">→</span><span class="jx-n">Predicate&lt;Integer&gt;</span></div>
      <div class="jx-row"><span class="jx-n">invokedynamic</span><span class="jx-a">→</span><span class="jx-n io">LambdaMetafactory → lambda$…</span><span class="jx-tag">bootstraps once, then plain calls</span></div>
      <div class="jx-row"><span class="jx-n">s -&gt; s.toUpperCase()</span><span class="jx-a">≡</span><span class="jx-n">String::toUpperCase</span><span class="jx-tag">4 method-ref kinds</span></div>
      <div class="jx-row"><span class="jx-n">built-in FIs</span><span class="jx-a">→</span><span class="jx-n">Predicate · Function · Consumer · Supplier</span></div>
    `,
    code: `Predicate<Integer> adult = x -> x >= 18;      // FI: one abstract method
Function<String, Integer> len = String::length; // unbound method ref
Supplier<List<Bill>> make = ArrayList::new;     // constructor ref`,
  },
  {
    id: 'modern',
    title: 'Records · Sealed · Switch',
    badge: 'JDK 17+',
    tone: 'text-fuchsia-600 dark:text-fuchsia-400',
    explain:
      'Sealed = a gate listing EXACTLY who may be a Resp (Ok, Err) — no other subclass can sneak in. Records = constructor + getters + equals auto-written for pure immutable data. Switch over that closed family can be exhaustive: add one new variant and the compiler walks you to every branch that must learn it.',
    why: 'Why seal the hierarchy? Because closed types make change SAFE: the compiler, not your memory of a TODO list, finds every decision site affected by a new domain variant — the type system becomes the refactor checklist.',
    flow: 'Read the switch left to right: record patterns destructure first, guards (when) filter, and the compiler checks that the union of patterns covers every sealed permit. Add one new variant → every matching switch stops compiling until it learns the new case — the checklist walks itself; that diagram is exactly that contract.',
    diagram: `
      <div class="jx-row"><span class="jx-n">sealed Resp</span><span class="jx-a">→</span><span class="jx-n io">Ok</span><span class="jx-n io">Err</span><span class="jx-tag">compiler knows all</span></div>
      <div class="jx-row"><span class="jx-n">switch (r)</span><span class="jx-a">→</span><span class="jx-n hot">case Ok(var d)</span><span class="jx-n hot">case Err(var c)</span><span class="jx-tag">exhaustive</span></div>
    `,
    code: `sealed interface Resp permits Ok, Err {}
record Ok(Data d) implements Resp {}

String view(Resp r) { return switch (r) {
    case Ok(var d) -> "ok:" + d.id();
    case Err(var c, var w) -> "err:" + c; }; }`,
  },
  {
    id: 'io',
    title: 'IO & NIO',
    badge: 'buffers',
    tone: 'text-teal-700 dark:text-teal-300',
    explain:
      'java.io is Russian dolls (decorators): every wrapper adds ONE ability around the same core stream — Buffered* keeps an 8 KB bucket in memory so the read() syscall storm shrinks 8,192-fold. NIO goes further and lets the KERNEL move the bytes while the Java code naps.',
    why: 'Why is buffering such a win? Every user→kernel crossing costs ~1 µs of FIXED toll regardless of size — one big read of 8 KB amortizes that toll to almost zero, while an unbuffered stream pays it once per single byte.',
    flow: 'The diagram is before/after: 8,192 tiny read(a-byte) syscalls collapse into one read(8KB) — batching removes 8,191 toll crossings. transferTo skips the descent entirely: the kernel copies file to socket directly and the CPU never touches the bytes. That is the whole idea — move less, batch more.',
    diagram: `
      <div class="jx-row"><span class="jx-n">FileInputStream.read()</span><span class="jx-a">→</span><span class="jx-n bad">1 syscall per call</span><span class="jx-tag">~1 µs overhead per hop</span></div>
      <div class="jx-row"><span class="jx-n">+ BufferedInputStream(8 KB)</span><span class="jx-a">→</span><span class="jx-n hot">syscalls / 8192</span><span class="jx-tag">decorator chain</span></div>
      <div class="jx-row"><span class="jx-n">FileChannel.transferTo</span><span class="jx-a">→</span><span class="jx-n io">kernel → kernel</span><span class="jx-tag">0 user-space copies</span></div>
      <div class="jx-row"><span class="jx-n">Reader / Writer</span><span class="jx-tag">bytes ≠ chars — a charset must be chosen</span></div>
    `,
    code: `try (InputStream in = new BufferedInputStream(new FileInputStream(src))) {
    in.transferTo(Files.newOutputStream(dst));        // batched, 8 KB at a time
}
srcChannel.transferTo(0, Long.MAX_VALUE, dstChannel); // zero-copy (sendfile)`,
  },
  {
    id: 'jvm',
    title: 'JVM Memory & GC',
    badge: 'STW',
    tone: 'text-orange-600 dark:text-orange-300',
    explain:
      'Full HotSpot simulator, merged unchanged from the old JVM lab page: allocate objects into Eden, run Minor / Full GC step by step and watch object cards flip alive — dead — promoted. Exact STW numbers land in the telemetry; theory tips stay in the collapsible panel below.',
    why: 'Why split the heap into generations? Because ~90% of objects die as infants (a request-scoped object lives microseconds): scanning a small Eden over and over beats scanning the whole heap every time — the generational hypothesis is measured reality, not doctrine.',
    flow: 'Objects land in Eden by a pointer bump. Eden fills → Minor GC traces live roots, copies survivors to a survivor space with age++ and discards everything else. Survivors reaching age 15 (or big arrays) get promoted to Old. Old fills → Full GC freezes every app thread to scan and compact. Read the cards below in that order.',
    diagram: `
      <div class="jx-row"><span class="jx-n">new</span><span class="jx-a">→</span><span class="jx-n hot">Eden</span><span class="jx-tag">90% of objects die here</span></div>
      <div class="jx-row"><span class="jx-n">Eden full</span><span class="jx-a">→</span><span class="jx-n io">Minor GC</span><span class="jx-a">→</span><span class="jx-n">S0 ⇄ S1 (age++)</span><span class="jx-a">→</span><span class="jx-n">age 15 → Old</span></div>
      <div class="jx-row"><span class="jx-n">Old full</span><span class="jx-a">→</span><span class="jx-n bad">Full GC · STW</span><span class="jx-tag">all app threads freeze</span></div>
      <div class="jx-row"><span class="jx-tag">G1 / ZGC / Shenandoah: region-based, sub-ms pauses</span></div>
    `,
    code: `java -Xmx2g -XX:+UseZGC -Xlog:gc* -jar app.jar
// jstat -gc <pid> 1s  → watch Eden/Old fill up live`,
  },
  {
    id: 'generics',
    title: 'Generics & Erasure',
    badge: 'erasure',
    tone: 'text-violet-600 dark:text-violet-400',
    explain:
      'Generics are a COMPILE-TIME contract with no runtime existence: javac checks every use against bounds, then ERASES T to Object (or to the bound), inserting exactly the casts it proved safe at your call sites. Which is why List<Integer> and List<String> are ONE class at runtime, why new T[] is illegal — and why an ignored unchecked warning can detonate as a ClassCastException far away from the dirty insert.',
    why: 'Why erase? Backward compatibility: generics landed in JDK 5 but had to interop with millions of already-raw collections. One raw HashMap class serves both worlds — the price is that type info (and array-store checks) simply does not exist at runtime, so the compiler police is ALL the police there is.',
    flow: 'Write the generic declaration → compiler type-checks against bounds → erases T → inserts casts where you read → runtime runs raw code with zero generic machinery. ? extends marks producers (read out), ? super consumers (write in) — the compiler refuses the mixed cases because erasure removed exactly the info needed to prove safety. Skip a raw/unchecked warning and heap pollution schedules a CCE for a later line.',
    diagram: `
      <div class="jx-row"><span class="jx-n">List&lt;T extends Shape&gt;</span><span class="jx-a">→</span><span class="jx-n hot">erasure: T → Shape</span><span class="jx-tag">signatures raw in the classfile</span></div>
      <div class="jx-row"><span class="jx-n">get(i)</span><span class="jx-a">→</span><span class="jx-n">checkcast Shape</span><span class="jx-tag">the cast javac wrote for you</span></div>
      <div class="jx-row"><span class="jx-n">? extends = read</span><span class="jx-a">·</span><span class="jx-n">? super = write</span><span class="jx-tag">PECS — erased consequences</span></div>
      <div class="jx-row"><span class="jx-n bad">List&lt;Integer&gt;</span><span class="jx-a">≡</span><span class="jx-n bad">List&lt;String&gt; at runtime</span><span class="jx-tag">same class object</span></div>
    `,
    code: `static <T extends Shape> T first(List<T> src) {
    return src.get(0);        // javac emits checkcast Shape at the call site
}
// List<Integer> a, List<String> b → a.getClass() == b.getClass()  // true
// new T[10];  ← generic array creation: erased runtime cannot check stores`,
  },
  {
    id: 'jit',
    title: 'Classloading & JIT',
    badge: 'C1 → C2',
    tone: 'text-teal-700 dark:text-teal-300',
    explain:
      'Classes arrive lazily: bootstrap → platform → application loaders delegate UP the chain first, then load → verify → prepare → initialize (static blocks run exactly ONCE). Execution is tiered: the interpreter runs bytecode while C1 compiles quickly and fills a profile, then C2 recompiles the hot paths with the deep tricks — inlining, escape analysis, scalar replacement — and DEOPTIMIZES the exact moment one of its assumptions breaks.',
    why: 'Why tiered and speculative? Only ~1% of methods ever turn hot, so paying the slow deep compile for every method would wreck cold startup. Speculation (this receiver is always a Circle) is what makes inlining possible at all — and a failed guard costs a recompile, never a wrong answer: deopt is the seatbelt that lets the JIT bet.',
    flow: 'findClass("Foo") asks the parent loader FIRST (delegation, so the JDK cannot be shadowed) → load → verify → static init once. The method then climbs tiers: interpreted → C1 → profiled-hot → C2 machine code with inlined callees. A third receiver type overflows the inline cache, guards fail, code deoptimizes and recompiles conservatively; escape analysis meanwhile deletes allocations that provably never escape.',
    diagram: `
      <div class="jx-row"><span class="jx-n">findClass("Foo")</span><span class="jx-a">→</span><span class="jx-n">parent asked first</span><span class="jx-a">→</span><span class="jx-n hot">load → link → init</span><span class="jx-tag">static{} runs ONCE</span></div>
      <div class="jx-row"><span class="jx-n">interpreter (0)</span><span class="jx-a">→</span><span class="jx-n">C1 (3) + profile</span><span class="jx-a">→</span><span class="jx-n io">C2 (4) deep opt</span><span class="jx-tag">tiered</span></div>
      <div class="jx-row"><span class="jx-n">inlining</span><span class="jx-a">·</span><span class="jx-n">escape analysis</span><span class="jx-a">·</span><span class="jx-n bad">deopt on guard fail</span></div>
    `,
    code: `// classloading: parent FIRST → load → verify → prepare → init (once)
// JIT tiers: 0 interpreter → 3 C1 (fast, profiled) → 4 C2 (slow, deep)
for (int i = 0; i < 10_000; i++) {}    // after C2: ~100x interpreter speed
// -Xlog:class+load · -XX:+PrintCompilation · -XX:-TieredCompilation to observe`,
  },
  {
    id: 'errors',
    title: 'Exceptions & Unwinding',
    badge: 'try-with-res',
    tone: 'text-red-600 dark:text-red-300',
    explain:
      'An exception object snapshots the FULL stack where it was born, then the JVM pops frames one by one hunting for a handler — no catch in this frame, pop it — until someone catches or the thread dies. try-with-resources closes resources in REVERSE declaration order even while the exception flies, failures inside close() ride along as suppressed entries. Checked exceptions live IN the signature so the compiler forces a plan; unchecked ones refuse the plan and fire at runtime.',
    why: 'Why unwind instead of a global goto? Because cleanup must happen innermost-first, in acquisition order, without you writing it: the language itself unwinds and closes while the stack is still coherent — every layer cleans exactly what it opened, and suppressed attached keeps even close-failures visible.',
    flow: 'Throw in frame C → no handler → C pops → B no handler → pops (any finally ran on the way, not after) → A catches and keeps the thread alive. Resources close REVERSED: last-declared closes first — if that close throws, it becomes suppressed while the original stays primary. Checked = compile-time contract callers must plan around; unchecked = no contract, unplanned NPE.',
    diagram: `
      <div class="jx-row"><span class="jx-n bad">throw (frame C)</span><span class="jx-a">→</span><span class="jx-n">C pops</span><span class="jx-a">→</span><span class="jx-n">B pops</span><span class="jx-a">→</span><span class="jx-n io">A catches</span><span class="jx-tag">trace frozen at birth</span></div>
      <div class="jx-row"><span class="jx-n">try-with-resources</span><span class="jx-a">→</span><span class="jx-n hot">close REVERSED</span><span class="jx-tag">later-declared first · suppressed kept</span></div>
      <div class="jx-row"><span class="jx-n">checked = in signature</span><span class="jx-a">·</span><span class="jx-n bad">unchecked = no plan</span></div>
    `,
    code: `try (var buf = new BufferedWriter(new FileWriter(f))) {
    throw new IllegalStateException("disk full");
}   // buf.close() runs even mid-throw — reverse order, suppressed kept
// checked: throws IOException in the signature — compile forces the plan`,
  },
  {
    id: 'ioc',
    title: 'Spring IoC & Container',
    badge: 'lifecycle',
    tone: 'text-amber-600 dark:text-amber-400',
    explain:
      'Spring is a matchmaker at boot: it scans @Component classes into a recipe book (BeanDefinitions), then for each bean: construct → inject → Aware → BeanPostProcessor → @PostConstruct → parked in a singleton pool. The last post-processor is the quiet hero — it is where @Transactional swaps your bean for a proxy.',
    why: 'Why wire everything at STARTUP, not on demand? Because a broken wiring should fail the app before it takes any traffic — a crash during boot is a 5-second incident, a missing dependency at midnight is a 500 error in production. Pre-wired singletons also keep hot paths allocation-free.',
    flow: 'Boot scans @Component classes into a BeanDefinition recipe map. Then each bean walks the numbered snake: construct → inject dependencies → Aware callbacks → early post-processors → @PostConstruct → and the LAST post-processor quietly swaps the bean for a proxy where annotations demand it. Finished beans wait in the singleton pool; close() unwinds everything in reverse with @PreDestroy.',
    diagram: `
      <div class="jx-row"><span class="jx-n">main()</span><span class="jx-a">→</span><span class="jx-n hot">scan → BeanDefinition map</span></div>
      <div class="jx-row pl-4"><span class="jx-a">per bean:</span><span class="jx-n">1 ctor</span><span class="jx-a">→</span><span class="jx-n">2 @Autowired</span><span class="jx-a">→</span><span class="jx-n">3 Aware</span></div>
      <div class="jx-row pl-4"><span class="jx-a">→</span><span class="jx-n">4 BPP.before</span><span class="jx-a">→</span><span class="jx-n">5 @PostConstruct</span><span class="jx-a">→</span><span class="jx-n hot">6 BPP.after</span><span class="jx-tag">proxy wrap</span></div>
      <div class="jx-row"><span class="jx-n io">singleton pool READY</span><span class="jx-a">→</span><span class="jx-n bad">@PreDestroy</span><span class="jx-tag">reverse order on close</span></div>
    `,
    code: `@Service
class BillingService {
    BillingService(PaymentRepo repo) { this.repo = repo; } // ctor injection: immutable, catches cycles
    @PostConstruct void init() { warmCache(); }
}`,
  },
  {
    id: 'scope',
    title: 'Bean Scope',
    badge: 'SCOPE',
    tone: 'text-violet-600 dark:text-violet-400',
    explain:
      'Spring beans live by a scope rule: singleton (default) means ONE shared instance per ApplicationContext — every getBean() hands back the same proxy; prototype means a brand-new instance every injection; request/session scope ties the lifetime to an HTTP boundary. Scopes exist because most beans are stateless (singleton wins), but some hold per-caller state that must never bleed between users.',
    why: 'Why not just always use prototype? Because object creation is not free and stateless logic never needs fresh state — sharing one instance costs zero allocation after boot. The prototype scope pays allocation on every call, and more critically, Spring releases its tracking immediately after hand-off (no @PreDestroy fires), so callers own cleanup — a footgun missed every interview.',
    flow: 'Read left to right: the ApplicationContext holds a singleton pool keyed by bean name. getBean() on a singleton returns the same map entry every time. A prototype skips the pool and calls the factory fresh each time — Spring hands the result to the caller and forgets it. Scope widening sneaks in when a singleton captures a prototype field at startup; the scoped proxy fix wraps the prototype in a singleton-shaped shell that calls the factory per delegation.',
    diagram: `
      <div class="jx-row"><span class="jx-n hot">singleton</span><span class="jx-a">→</span><span class="jx-n">ctx pool</span><span class="jx-tag">one instance · callers share state</span></div>
      <div class="jx-row"><span class="jx-n">prototype</span><span class="jx-a">→</span><span class="jx-n bad">new() per injection</span><span class="jx-tag">Spring forgets it · no @PreDestroy</span></div>
      <div class="jx-row"><span class="jx-n bad">singleton holds proto field</span><span class="jx-a">→</span><span class="jx-n">scope widening</span><span class="jx-tag">fix: scoped proxy or ObjectProvider</span></div>
    `,
    code: `@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)  // new instance per injection
@Service class BillingService { ... }

// widening fix — proxy IS a singleton, delegates to a fresh prototype per call:
@Scope(value = SCOPE_PROTOTYPE, proxyMode = ScopedProxyMode.TARGET_CLASS)
@Service class BillingService { ... }`,
  },
  {
    id: 'aop',
    title: 'Spring AOP — Proxy',
    badge: 'CGLIB/JDK',
    tone: 'text-rose-600 dark:text-rose-400',
    explain:
      'Spring AOP is a stunt double: the caller never touches your object, it touches a $Proxy that Spring built FROM your class — the proxy opens the transaction, calls the real method, then commits or rolls back. Watch out: calling your own method via this.save() walks around the costume and hits the raw actor, so no advice fires.',
    why: 'Why a proxy instead of rewriting your bytecode? Because a proxy survives normal Java rules: your bean code stays clean, the annotation stays declarative, and Spring can add or remove behavior at runtime with zero compiler magic. The price is the self-invocation trap — the proxy simply never gets involved.',
    flow: 'The caller holds $Proxy, never your class. One proxy call: open the transaction → invoke the real method → catch the return or exception → commit or rollback on the way out. this.save() is the single hole in the costume: it dials the raw object inside the proxy outfit, so the detour — and the transaction — simply never happens.',
    diagram: `
      <div class="jx-row"><span class="jx-n">caller</span><span class="jx-a">→</span><span class="jx-n hot">$Proxy</span><span class="jx-a">→</span><span class="jx-n">TransactionInterceptor</span></div>
      <div class="jx-row pl-4"><span class="jx-a">→</span><span class="jx-n">begin tx</span><span class="jx-a">→</span><span class="jx-n io">target.method()</span><span class="jx-a">→</span><span class="jx-n">commit / rollback</span></div>
      <div class="jx-row"><span class="jx-n bad">this.save()</span><span class="jx-a">→</span><span class="jx-tag">raw object — advice SKIPPED · JDK proxy needs interface, CGLIB subclasses</span></div>
    `,
    code: `@Transactional void place(Order o) { repo.save(o); }
// injected bean = $Proxy24, not OrderService
// self-invocation this.place() = NO transaction`,
  },
  {
    id: 'jpa',
    title: 'Spring JPA',
    badge: 'proxy→SQL',
    tone: 'text-emerald-600 dark:text-emerald-400',
    explain:
      'A repository interface becomes a proxy that reads your METHOD NAMES (or @Query) as instructions and writes the SQL for you. Loaded entities live in a persistence context that keeps a snapshot of each row; at commit it diffs the snapshot and writes ONLY what you actually changed.',
    why: 'Why does a persistence context exist at all? Because scattering ten tiny UPDATEs across your method would mean ten network roundtrips and no atomicity — collecting changes and flushing them once gives both fewer roundtrips AND an all-or-nothing commit. The snapshot makes the diff possible.',
    flow: 'findByEmail is parsed by the proxy into SQL, and hydrated rows become managed entities inside the persistence context (L1 cache). save() only registers changes; at flush the snapshot diff issues exactly the UPDATEs that changed — nothing else. A lazy association defers to its own SELECT per row unless you join fetch, which folds it back into one query.',
    diagram: `
      <div class="jx-row"><span class="jx-n">findByEmail()</span><span class="jx-a">→</span><span class="jx-n hot">repo proxy</span><span class="jx-a">→</span><span class="jx-n io">SQL</span><span class="jx-a">→</span><span class="jx-n">hydrate → L1 cache</span></div>
      <div class="jx-row"><span class="jx-n">save()</span><span class="jx-a">→</span><span class="jx-n">dirty check at flush</span><span class="jx-tag">UPDATE only if changed</span></div>
      <div class="jx-row"><span class="jx-n bad">lazy assoc</span><span class="jx-a">→</span><span class="jx-tag">N+1 — join fetch / @EntityGraph</span></div>
    `,
    code: `@Query("select o from Order o join fetch o.items where o.id = :id")
Optional<Order> findWithItems(@Param("id") Long id);`,
  },
  {
    id: 'security',
    title: 'Spring Security',
    badge: 'filters',
    tone: 'text-sky-700 dark:text-sky-300',
    explain:
      'Security is a gate made of stacked servlet filters running BEFORE any controller: the auth filter asks WHO are you (token/credentials) and gets a verified Authentication object, the authorization filter asks MAY you enter THIS door (roles), and Spring stores the verdict in a ThreadLocal SecurityContext for the rest of the request.',
    why: 'Why filters and not a check inside the controller? Because a 401 must cost nothing — no session lookup, no mapper, no serialization. Checking identity at the earliest layer means attackers hit cheap rejections, and your controllers stay pure business logic with zero security if-statements.',
    flow: 'The request walks DOWN the filter tower: the token filter validates and builds the Authentication object, ProviderManager asks each provider in turn, bcrypt matches, and the verdict is stored in a per-request ThreadLocal SecurityContext. Below that, the authorization filter re-checks role matchers per route — rejected requests become 401/403 before any controller code ever runs.',
    diagram: `
      <div class="jx-row"><span class="jx-n">HTTP req</span><span class="jx-a">→</span><span class="jx-n">…filters…</span><span class="jx-a">→</span><span class="jx-n hot">AuthFilter</span></div>
      <div class="jx-row"><span class="jx-a">→</span><span class="jx-n">ProviderManager</span><span class="jx-a">→</span><span class="jx-n">DaoAuthProvider</span><span class="jx-a">→</span><span class="jx-n">bcrypt matches</span></div>
      <div class="jx-row"><span class="jx-n io">SecurityContextHolder</span><span class="jx-a">→</span><span class="jx-n">AuthorizationFilter</span><span class="jx-a">→</span><span class="jx-n">controller</span></div>
      <div class="jx-row"><span class="jx-tag">JWT stateless: one filter validates the token — no session store</span></div>
    `,
    code: `http.authorizeHttpRequests(a -> a.requestMatchers("/api/admin/**")
        .hasRole("ADMIN").anyRequest().authenticated())
    .sessionManagement(s -> s.sessionCreationPolicy(STATELESS));`,
  },
  {
    id: 'metaprog',
    title: 'Meta-programming',
    badge: '3 layers',
    tone: 'text-orange-600 dark:text-orange-400',
    explain:
      'Java writes Java at three layers, each with a cost point: APT stamps out NEW SOURCE at compile time (Lombok, MapStruct — zero cost after build), reflection reads and calls anything through Class objects at runtime (how Spring injects @Autowired), and Proxy/ASM forge whole classes on the fly (AOP, mocks, lazy loading).',
    why: 'Why meta-programming at all? Because most app code is bookkeeping — mappers, DI glue, logging, retry wrappers — with the same shape in every class, and identical shapes should be stamped once by a machine. Each layer picks its moment: compile time is free forever, runtime costs a little but stays flexible.',
    flow: 'Compile time: annotation processors watch javac and stamp out extra .java files (Lombok, MapStruct) — paid once at build, free forever after. Runtime: reflection reads metadata through Class objects for generic wiring, and Proxy.newProxyInstance forges a class on the spot that forwards every call to your handler. Spring touches all three layers in one app.',
    diagram: `
      <div class="jx-row"><span class="jx-n hot">APT</span><span class="jx-a">→</span><span class="jx-n">processor</span><span class="jx-a">→</span><span class="jx-n io">Generated.java</span><span class="jx-tag">0 runtime cost</span></div>
      <div class="jx-row"><span class="jx-n hot">reflection</span><span class="jx-a">→</span><span class="jx-n">field.get · method.invoke</span><span class="jx-tag">needs setAccessible</span></div>
      <div class="jx-row"><span class="jx-n hot">proxy</span><span class="jx-a">→</span><span class="jx-n bad">$Proxy + handler</span><span class="jx-tag">AOP · JPA · Spring beans</span></div>
    `,
    code: `Payment p = (Payment) Proxy.newProxyInstance(cl,
    new Class[]{ Payment.class },
    (proxy, m, args) -> handler.invoke(m, args));`,
  },
  {
    id: 'web',
    title: 'Spring Web & REST',
    badge: 'MVC',
    tone: 'text-cyan-700 dark:text-cyan-300',
    explain:
      'One servlet routes everything: each request crosses the filter chain, lands in DispatcherServlet, which picks exactly one handler method by URL + verb. Spring binds your @PathVariable/@RequestBody into typed values, @Valid checks them BEFORE your method runs, and whatever you return is written out by a converter chosen from the Accept header.',
    why: 'Why a single front servlet? Because routing must have ONE decision point — one DispatcherServlet means one place to plug interceptors, exception translation and content negotiation, and your controllers stay free of any request/response plumbing. Even errors skip methods entirely and hop to @ControllerAdvice.',
    flow: 'Read top to bottom: request → filters → DispatcherServlet → HandlerMapping → arg resolvers bind + @Valid → method body → returned DTO → converter by Accept → 200/201 JSON. An invalid body exits EARLY: the exception hops to @RestControllerAdvice and becomes a 400 ProblemDetail before a single line of controller logic runs.',
    diagram: `
      <div class="jx-row"><span class="jx-n">GET /users/42</span><span class="jx-a">→</span><span class="jx-n">filters</span><span class="jx-a">→</span><span class="jx-n hot">DispatcherServlet</span><span class="jx-tag">one servlet routes all · filters already ran</span></div>
      <div class="jx-row pl-4"><span class="jx-a">└</span><span class="jx-n">HandlerMapping → method</span><span class="jx-a">→</span><span class="jx-n">resolvers bind + @Valid</span><span class="jx-a">→</span><span class="jx-n io">method body</span></div>
      <div class="jx-row"><span class="jx-n">DTO returned</span><span class="jx-a">→</span><span class="jx-n">converter by Accept</span><span class="jx-a">→</span><span class="jx-n io">200 / 201 JSON</span></div>
      <div class="jx-row"><span class="jx-n bad">@Valid fail</span><span class="jx-a">→</span><span class="jx-n">@RestControllerAdvice</span><span class="jx-a">→</span><span class="jx-n bad">400 ProblemDetail</span><span class="jx-tag">method never runs</span></div>
    `,
    code: `@RestController
class UserController {
    @PostMapping("/users")
    ResponseEntity<UserDto> create(@RequestBody @Valid NewUser in) {
        var saved = userService.create(in);
        return ResponseEntity.created(URI.create("/users/" + saved.getId())).body(saved);
    }
}
// invalid body → MethodArgumentNotValidException → @RestControllerAdvice → 400`,
  },
  {
    id: 'testing',
    title: 'Testing · JUnit & Mocks',
    badge: 'green bar',
    tone: 'text-lime-600 dark:text-lime-400',
    explain:
      'A test is a tiny main() that only passes when the code tells the truth: JUnit hands every @Test a FRESH instance (no state leaks between tests), @BeforeEach rebuilds the world, and @WebMvcTest boots ONLY the web layer with the service faked via @MockBean. Mockito tests the contract you actually care about — when() scripts the future, verify() audits the past.',
    why: 'Why fresh instances and slices instead of the full context? Shared state makes suites order-dependent liars, and a full Spring context costs seconds per class — a slice boot in a few hundred ms keeps the red/green feedback instant while still running real Spring machinery where it matters.',
    flow: 'Read the anatomy top-down: @BeforeEach → arrange → act → assert inside a fresh object, then the NEXT test rebuilds everything. The slice test starts web beans only: MockMvc.perform drives the real controller with the mocked service and asserts status + JSON shape. Mockito split: when() writes the answer sheet, verify() checks which questions were asked — including those that must NOT be.',
    diagram: `
      <div class="jx-row"><span class="jx-n hot">@Test</span><span class="jx-a">:</span><span class="jx-n">@BeforeEach</span><span class="jx-a">→</span><span class="jx-n">arrange → act</span><span class="jx-a">→</span><span class="jx-n io">assert</span><span class="jx-tag">fresh instance per test</span></div>
      <div class="jx-row"><span class="jx-n">@WebMvcTest</span><span class="jx-a">→</span><span class="jx-n">web beans only</span><span class="jx-a">→</span><span class="jx-n">@MockBean service</span><span class="jx-tag">slice = fast context</span></div>
      <div class="jx-row"><span class="jx-n">when() scripts the future</span><span class="jx-a">·</span><span class="jx-n">verify() audits the past</span><span class="jx-tag">contract testing</span></div>
      <div class="jx-row"><span class="jx-n bad">H2 dialect drift</span><span class="jx-a">→</span><span class="jx-n">Testcontainers</span><span class="jx-a">→</span><span class="jx-n io">real Postgres</span><span class="jx-tag">same engine as prod</span></div>
    `,
    code: `@WebMvcTest(UserController.class)
class UserControllerTest {
    @Autowired MockMvc mvc;
    @MockBean UserService service;

    @Test void getsUser() throws Exception {
        when(service.find(42L)).thenReturn(new UserDto(42, "ana"));
        mvc.perform(get("/users/42"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.name").value("ana"));
    }
}`,
  },
  {
    id: 'autoconfig',
    title: 'Boot Auto-config',
    badge: 'conditions',
    tone: 'text-fuchsia-600 dark:text-fuchsia-300',
    explain:
      '@SpringBootApplication turns ON auto-configuration, which runs LAST in the context refresh: boot reads one line per candidate from AutoConfiguration.imports, evaluates each @ConditionalOnClass / @ConditionalOnProperty / @ConditionalOnMissingBean against the CURRENT context, and only matching candidates become beans. Your own @Bean refreshes EARLIER and always wins — auto-config is fallback, never override. The --debug report turns the whole decision into a receipt.',
    why: 'Why conditions instead of plain @Bean? Because boot must configure thousands of projects with different classpaths: a candidate that checks I have Hikari on the class path and you wrote no DataSource turns one starter import into exactly the right beans — and politely refuses (back-off) the moment you are explicit.',
    flow: '--debug prints the CONDITIONS EVALUATION REPORT: positive matches (bean created, which condition won) and negatives (which condition failed). The ladder per candidate: imports list → OnClass? → OnProperty? → OnMissingBean? → match means join your beans in the singleton pool. Phase order is the whole security model: yours first, auto last, missing-bean as the guard.',
    diagram: `
      <div class="jx-row"><span class="jx-n hot">@EnableAutoConfiguration</span><span class="jx-a">→</span><span class="jx-n">imports file ~140 candidates</span><span class="jx-tag">read LAST in refresh</span></div>
      <div class="jx-row pl-4"><span class="jx-a">each:</span><span class="jx-n">OnClass?</span><span class="jx-a">→</span><span class="jx-n">OnProperty?</span><span class="jx-a">→</span><span class="jx-n">OnMissingBean?</span></div>
      <div class="jx-row"><span class="jx-n io">match → bean</span><span class="jx-a">·</span><span class="jx-n">your @Bean shields its slot</span><span class="jx-tag">back-off</span></div>
      <div class="jx-row"><span class="jx-n">--debug → report</span><span class="jx-a">:</span><span class="jx-n">every ⊕ = a bean you never wrote</span></div>
    `,
    code: `@SpringBootApplication          // pulls @EnableAutoConfiguration
public class App {
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);   // refresh: YOUR beans first … auto LAST
    }
}
// --debug → CONDITIONS EVALUATION REPORT: every ⊕ is a bean you did not write`,
  },
  {
    id: 'tx',
    title: 'Transactions Deep-Dive',
    badge: 'ACID',
    tone: 'text-yellow-700 dark:text-yellow-300',
    explain:
      '@Transactional wraps your method through the same proxy as AOP: begin → work → commit, or rollback when a RuntimeException (or a declared rollbackFor) escapes — checked exceptions COMMIT by default, the most famous rule in Spring. Isolation is a ladder of guarantees against concurrent readers: dirty reads die first (RC), re-read drift dies next (RR), phantoms only under SERIALIZABLE. Propagation decides what happens when a transaction ALREADY exists: REQUIRED joins it on the same connection; REQUIRES_NEW suspends it and opens a second one that commits independently.',
    why: 'Why a ladder and 7 propagation modes? Because consistency versus concurrency is a business decision, not a constant — each isolation rung costs locks. And some nested work must commit its own history no matter what the caller does: REQUIRES_NEW buys that independence with a second connection, in exchange for suspending the outer tx.',
    flow: 'Read the ladder bottom-up: RU reads anything, RC only committed data, RR keeps re-reads stable while new rows still ghost in, SERIALIZABLE replays everything as-if-alone. Propagation: REQUIRED shares the outer tx (all-or-nothing together); REQUIRES_NEW gets a T2 on connection #2, commits immediately — and even survives the outer rollback. Then the trap: ship() throws checked IOException and still COMMITS unless rollbackFor says otherwise.',
    diagram: `
      <div class="jx-row"><span class="jx-n">@Transactional</span><span class="jx-a">→</span><span class="jx-n hot">proxy: begin → work → commit</span><span class="jx-tag">RuntimeException → rollback</span></div>
      <div class="jx-row"><span class="jx-n">RU dirty</span><span class="jx-a">→</span><span class="jx-n">RC clean</span><span class="jx-a">→</span><span class="jx-n">RR stable</span><span class="jx-a">→</span><span class="jx-n io">SER alone</span><span class="jx-tag">each rung costs locks</span></div>
      <div class="jx-row"><span class="jx-n">REQUIRED joins</span><span class="jx-a">·</span><span class="jx-n bad">REQUIRES_NEW: own conn</span><span class="jx-tag">outer rolls — inner survives</span></div>
    `,
    code: `@Transactional
void pay() { account.debit(o); ledger.write(o); }      // all-or-nothing

@Transactional(propagation = REQUIRES_NEW)
void audit(Action a) { auditRepo.save(a); }             // commits alone
// checked IOException would COMMIT by default — set rollbackFor!`,
  },
  {
    id: 'async',
    title: 'Async & Events',
    badge: 'proxy ×2',
    tone: 'text-indigo-600 dark:text-indigo-300',
    explain:
      '@Async is the AOP proxy again, but instead of wrapping the call it SHIPS it: the interceptor packs your arguments, executor.submit()s the work and returns a future instantly — the real method runs later on a pool thread. Events are in-process pub-sub: publishEvent() walks all @EventListener methods synchronously on YOUR thread (inside YOUR transaction), while @TransactionalEventListener(AFTER_COMMIT) only arms a callback that fires after the commit succeeds — a rollback silences it completely.',
    why: 'Why listener flavors at all? Because an in-tx listener can read its own uncommitted writes (fast, but it dies with the rollback), while AFTER_COMMIT guarantees side effects only fire for SURVIVED work — the whole reason you never email a customer about an order that just rolled back.',
    flow: '@Async path: caller → proxy → executor queue → future NOW → task runs off-thread (self-invocation bypasses it all, the same proxy trap). Event path: place() opens T1 → publish → @EventListener runs NOW inside T1; the AFTER_COMMIT one sits armed until T1 commits — or never fires on rollback, which is the design goal.',
    diagram: `
      <div class="jx-row"><span class="jx-n">caller</span><span class="jx-a">→</span><span class="jx-n hot">@Async proxy</span><span class="jx-a">→</span><span class="jx-n">executor.submit()</span><span class="jx-a">→</span><span class="jx-n io">future NOW</span><span class="jx-tag">work runs later</span></div>
      <div class="jx-row"><span class="jx-n">publishEvent</span><span class="jx-a">→</span><span class="jx-n">@EventListener in-tx</span><span class="jx-a">·</span><span class="jx-n">AFTER_COMMIT armed</span></div>
      <div class="jx-row"><span class="jx-n io">commit → side effects</span><span class="jx-a">·</span><span class="jx-n bad">rollback → silent</span><span class="jx-tag">no ghost emails</span></div>
    `,
    code: `@Async
CompletableFuture<Void> sendReceipt(Order o) { mail.send(o); return done(); }

@EventListener void inTx(OrderPlaced e) { stats.record(e); }

@TransactionalEventListener(AFTER_COMMIT)
void afterCommit(OrderPlaced e) { mail.send(e.order()); }`,
  },
  {
    id: 'messaging',
    title: 'Messaging · Kafka Basics',
    badge: 'at-least-once',
    tone: 'text-emerald-700 dark:text-emerald-300',
    explain:
      'A broker trades synchronous calls for a durable LOG: producers append, consumers pull at their own pace, and each partition is read with a numeric OFFSET that the consumer commits — that offset is the only memory of what was done. Delivery is at-least-once: crash or missed ack means redelivery, so every honest consumer owns an idempotency guard (dedupe by a business key). Payloads that never parse burn bounded retries and get quarantined in a DLQ, where alerts and replay tools take over.',
    why: 'Why at-least-once instead of exactly-once? Because exactly-once forces broker + consumer + storage into one atomic protocol — heavy and specific; at-least-once is simple infrastructure, and a dedupe key is cheap application logic. Consumers crash BEFORE committing the offset, so redelivery is the normal case, not an accident.',
    flow: 'Deliver → handle → ACK last: crash before the commit lands = same message returns. A consumer death triggers a REBALANCE whose partitions move to survivors and resume from committed offsets; the first boot replays from earliest. A poison payload retries 3 times, lands in orders-dlq, and the main lane stays healthy for everyone behind it.',
    diagram: `
      <div class="jx-row"><span class="jx-n">produce</span><span class="jx-a">→</span><span class="jx-n hot">durable log (p0·p1·p2)</span><span class="jx-a">→</span><span class="jx-n">consumer pull</span><span class="jx-a">→</span><span class="jx-n io">offset commit LAST</span></div>
      <div class="jx-row"><span class="jx-n bad">crash / missed ack</span><span class="jx-a">→</span><span class="jx-n">broker redelivers</span><span class="jx-a">→</span><span class="jx-n">dedupe key holds</span><span class="jx-tag">effectively-once</span></div>
      <div class="jx-row"><span class="jx-n">poison ×3 retries</span><span class="jx-a">→</span><span class="jx-n bad">-dlq quarantine</span><span class="jx-tag">main lane stays healthy</span></div>
    `,
    code: `@KafkaListener(topics = "orders")
void on(OrderEvent e, Acknowledgment ack) {
    if (seen(e.dedupeKey())) return;      // at-least-once guard
    orders.apply(e);
    ack.acknowledge();                    // offset committed after success
}`,
  },
  {
    id: 'config',
    title: 'Externalized Config',
    badge: 'ladder',
    tone: 'text-slate-600 dark:text-slate-300',
    explain:
      'Configuration resolves through a precedence LADDER at startup: baked defaults < application.yml < profile-specific yml < OS env vars < command-line args — the last writer wins, and every reader sees only the resolved winner. @Value reads a single property and (famously) injects the LITERAL placeholder string when the key is missing; @ConfigurationProperties instead binds a typed object with relaxed naming, and a value that cannot convert fails the STARTUP with the offending key printed.',
    why: 'Why a ladder rather than one file? Because deployment layers keep beating each other in real life: one image must run in every environment — baked defaults keep local dev effortless, while a single env var or CLI flag repoints the app in production without a rebuild. Typed binding is the safety layer: config bugs should die at boot, not at 3am.',
    flow: 'Boot resolves each key once through the ladder — args beat env beats profile files beat defaults. @ConfigurationProperties collapses kebab/camel/env spellings into one field and aborts the boot on a bad type; @Values with unresolved keys quietly hand your code the raw ${name} text. Values are then FROZEN: an edited yml needs a restart, or an explicit @RefreshScope rebind.',
    diagram: `
      <div class="jx-row"><span class="jx-n">default yml</span><span class="jx-a">→</span><span class="jx-n">profile yml</span><span class="jx-a">→</span><span class="jx-n">env vars</span><span class="jx-a">→</span><span class="jx-n hot">command args</span><span class="jx-tag">last writer wins</span></div>
      <div class="jx-row"><span class="jx-n">@ConfigurationProperties</span><span class="jx-a">→</span><span class="jx-n">typed bind · relaxed names</span><span class="jx-tag">fail-fast at boot</span></div>
      <div class="jx-row"><span class="jx-n bad">@Value missing key</span><span class="jx-a">→</span><span class="jx-n">literal text injected</span><span class="jx-tag">the classic gotcha</span></div>
    `,
    code: `@ConfigurationProperties(prefix = "smtp")
class SmtpProps {
    private String host;
    private int port;       // 25.5 in yml → binding FAILS at startup
}
// @Value("\${missing}") → injects the literal "\${missing}" text — check boots!`,
  },
  {
    id: 'jmm',
    title: 'Java Memory Model',
    badge: 'JMM',
    tone: 'text-pink-600 dark:text-pink-300',
    explain:
      'The JMM answers what thread B LEGALLY sees after thread A wrote: without synchronization the optimizer may reorder stores and a reader may serve stale cache lines FOREVER — code that looks obviously correct is not guaranteed. volatile exposes one variable across the wall — its write becomes happens-before-ordered and visible to later readers; that single keyword is the entire fix for the broken double-checked-locking singleton. CAS (compare-and-swap) on the atomic classes updates lock-free: read → compute → one atomic cmpxchg, and retry if you lost the race.',
    why: 'Why a formal spec instead of intuition? Because reordering + per-core caches make the naive mental model unsound: both the spin-forever reader and the answer==0 reader are legal without a barrier. The JMM delivers a small contracts list (happens-before via volatile / monitors / Thread ops) so visibility becomes provable instead of prayer — and CAS proves short fights beat parked threads.',
    flow: 'Read the court ruling order: unsynchronized → ANY interleaving, reordering and staleness is legal; add volatile → writer flushes at the barrier, reader refreshes — a happens-before edge appears and DCL heals. Then the lock-free path: load the expected old → compute new → single cmpxchg → retry loop when raced. ABA sneaks in when a value returns to its old self — stamp the version, not the lock.',
    diagram: `
      <div class="jx-row"><span class="jx-n bad">no sync</span><span class="jx-a">→</span><span class="jx-n">stores reordered</span><span class="jx-a">·</span><span class="jx-n bad">stale caches forever</span><span class="jx-tag">all LEGAL</span></div>
      <div class="jx-row"><span class="jx-n hot">volatile write</span><span class="jx-a">→</span><span class="jx-n">barrier · flush</span><span class="jx-a">→</span><span class="jx-n io">readers see it</span><span class="jx-tag">happens-before</span></div>
      <div class="jx-row"><span class="jx-n">CAS: expect old → swap if unchanged</span><span class="jx-a">·</span><span class="jx-n">lost race → retry</span><span class="jx-tag">lock-free</span></div>
    `,
    code: `volatile boolean ready = false;          // barrier on every access
boolean ok = COUNTER.compareAndSet(0, 1);  // single CPU cmpxchg
// DCL verdict: the shared instance field MUST be volatile, no excuses
// happens-before sources: volatile w/r · monitor enter/exit · Thread.start/join`,
  },
];
// Pedagogy order — basic → advanced, most essential per rung first.
// Sorted in place so chips AND panels render in this order without moving
// the 23 literal entries above (ids are the only stable key).
const TAB_ORDER = [
  // core java: data first, then language, then runtime engines
  'collections', 'string', 'errors', 'generics', 'lambda', 'streams',
  'modern', 'io', 'concurrency', 'jmm', 'jvm', 'jit',
  // spring: foundations → container → web/data → ops/infra → meta
  'ioc', 'scope', 'aop', 'config', 'autoconfig', 'web', 'jpa', 'testing',
  'tx', 'security', 'async', 'messaging', 'metaprog',
];
TABS.sort((a, b) => TAB_ORDER.indexOf(a.id) - TAB_ORDER.indexOf(b.id));
