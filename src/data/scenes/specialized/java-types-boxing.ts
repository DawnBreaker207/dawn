import { fromScreen, makeBlock, makeLink, makePanel, cardAt, type Tag, type SceneOpts } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage for the whole lesson: a method's stack frame on the left, heap objects
// in the middle, the JVM's Integer cache top-right. Act 2 (generics) brings in javac.
//
//            javac            IntegerCache
//   stack frame ── heap object
//                      └── second object / BigDecimal

/** Screen position (px) → world grid coordinates. */
const positions = {
  stack: fromScreen(-220, 60),
  javac: fromScreen(-110, -165),
  heap: fromScreen(0, 0),
  cache: fromScreen(180, -140),
  low: fromScreen(70, 180),
};

const block = (p: { x: number; y: number }, o: SceneOpts) => makeBlock(p.x, p.y, { s: 4.4, h: 52, ...o });
const stack = (tags: Tag[] = []) =>
  block(positions.stack, { color: `blue`, glyph: `layers`, label: [`Stack frame`], sub: `main()`, tags });
const boxA = (label: string, tags: Tag[] = []) =>
  block(positions.heap, { color: `green`, glyph: `box`, label: [label], sub: `16 B object`, tags });
const cache = (tags: Tag[] = []) =>
  block(positions.cache, { color: `purple`, glyph: `database`, label: [`IntegerCache`], sub: `-128 … 127`, tags });
const boxB = (label: string, sub: string, tags: Tag[] = []) =>
  block(positions.low, { color: `green`, glyph: `box`, label: [label], sub, tags });
const javac = (tags: Tag[] = []) =>
  block(positions.javac, { color: `orange`, glyph: `code`, label: [`javac`], sub: `compiler`, tags });
const list = (tags: Tag[] = []) =>
  block(positions.heap, { color: `green`, glyph: `boxes`, label: [`ArrayList`], sub: `Object[] inside`, tags });

const links = {
  ref: makeLink(`stack`, `boxA`, [`stack`, `boxA`], { label: `ref` }),
  refQuiet: makeLink(`stack`, `boxA`, [`stack`, `boxA`]),
  cached: makeLink(`cache`, `boxA`, [`cache`, `boxA`], { label: `same object` }),
  newObj: makeLink(`stack`, `boxB`, [`stack`, `boxB`], { label: `new` }),
  newQuiet: makeLink(`stack`, `boxB`, [`stack`, `boxB`]),
  listRef: makeLink(`stack`, `list`, [`stack`, `list`], { heads: `both` }),
  erase: makeLink(`javac`, `list`, [`javac`, `list`], { label: `erases <T>` }),
  emitBridge: makeLink(`javac`, `bridge`, [`javac`, `bridge`], { label: `adds bridge` }),
  copy: makeLink(`list`, `sink`, [`list`, `sink`], { label: `copy` }),
  rawAdd: makeLink(`stack`, `list`, [`stack`, `list`], { label: `raw add(42)`, labelTone: `red` }),
};

const card = cardAt({ x: 0, y: 0, dx: 250, dy: -70 }, `code`);

export const javaTypesBoxingLesson: Lesson = {
  id: 'java-types-boxing',
  title: 'Types, Boxing & Generics',
  summary:
    'Where an int lives versus an Integer, why 128 == 128 is false, where boxing hides NPEs and money bugs, and what generics turn into after javac.',
  minutes: 14,
  level: 'core',
  metrics: ['objects', 'heapBytes', 'casts', 'bugs'],
  legend: [[`req`, `reference`], [`res`, `value`], [`write`, `compile step`], [`fail`, `bug`]],
  goals: [
    { text: 'Contrast a 4-byte stack int with a 16-byte heap Integer', step: 1 },
    { text: 'Explain the IntegerCache == vs equals() trap', step: 2 },
    { text: 'Spot hidden autoboxing loops and null-unboxing NPEs', step: 3 },
    { text: 'Fix double rounding drift with BigDecimal', step: 4 },
    { text: 'Explain why generics are erased at compile time', step: 5 },
    { text: 'Inspect the bridge methods javac generates', step: 6 },
    { text: 'Apply PECS (? extends / ? super)', step: 7 },
    { text: 'Prevent heap pollution from raw types', step: 8 },
  ],
  steps: [
    {
      short: 'Stack vs heap',
      chapter: 'setup',
      title: 'An int is a value, an Integer is an object',
      body: [
        '<code>int a = 42</code> is 4 bytes stored directly in the method’s <span class="term">stack frame</span>. No allocation, nothing for the GC to do.',
        '<code>Integer b = 42</code> is a <b>reference</b> in the frame pointing at a separate heap object: a 12-byte header plus the int, padded to 16 bytes.',
      ],
      callout: { kind: 'tip', text: 'Collections can only hold objects, so a List<Integer> of a million numbers is a million heap objects. Use int[] or IntStream when it matters.' },
      metrics: { objects: 1, heapBytes: 16, casts: 0, bugs: 0 },
      scene: {
        entities: {
          stack: stack([{ text: 'int a = 42 · 4 B', tone: 'violet' }]),
          boxA: boxA('Integer 42'),
          card: card('Main.java', ['int a = 42;      // 4 B, in the frame', 'Integer b = 42;  // ref → heap object', '# header 12 B + int 4 B = 16 B']),
        },
        links: { ref: links.ref },
        flows: [{ route: ['ref'], rate: 1, bounce: true }],
      },
    },
    {
      short: 'Int cache',
      chapter: 'problem',
      title: 'Why 127 == 127 is true but 128 == 128 is false',
      body: [
        'Autoboxing calls <code>Integer.valueOf()</code>. For values from -128 to 127 it returns a shared object from the <span class="term">IntegerCache</span>, so two boxed 127s are the <em>same</em> object.',
        '128 is outside the cache, so each box is a new object. <code>==</code> compares references, not values: the two 128s are different objects.',
      ],
      callout: { kind: 'warn', text: 'Always compare boxed numbers with equals() (or unbox first). == happens to work in tests with small ids and breaks in production.' },
      changes: ['+ IntegerCache', '+ a new Integer(128)'],
      metrics: { objects: 3, heapBytes: 48, casts: 0, bugs: 1 },
      scene: {
        entities: {
          stack: stack([
            { text: 'a == b  → true', tone: 'green' },
            { text: 'c == d  → false', tone: 'red', icon: 'alert' },
          ]),
          boxA: boxA('Integer 127'),
          cache: cache([{ text: '256 shared objects', tone: 'violet' }]),
          boxB: boxB('Integer 128', 'one per box'),
          card: card('== vs equals()', ['Integer a = 127, b = 127;', 'a == b        // true  (cached)', 'Integer c = 128, d = 128;', '! c == d        // false (2 objects)', '= c.equals(d)   // true']),
        },
        links: { ref: links.refQuiet, cached: links.cached, newObj: links.newObj },
        flows: [
          { route: ['newObj'], kind: 'fail', rate: 0.8 },
          { route: ['cached'], kind: 'res', rate: 1 },
        ],
      },
    },
    {
      short: 'Hidden box',
      chapter: 'problem',
      title: 'Boxing you didn’t write — and the NPE it hides',
      body: [
        'Declare the accumulator as <code>Long</code> and every <code>sum += i</code> unboxes, adds and boxes again: a million loop turns create a million objects for the GC.',
        'Unboxing calls <code>intValue()</code>. If the reference is <code>null</code>, a line with no visible method call throws <code>NullPointerException</code>.',
      ],
      callout: { kind: 'tip', text: 'Use primitives for counters and accumulators. When a value can be absent, make that explicit (OptionalInt, a default) instead of a nullable wrapper.' },
      changes: ['~ 1,000,000 Long objects', '− null unboxed → NPE'],
      metrics: { objects: 1000000, heapBytes: 24000000, casts: 0, bugs: 2 },
      scene: {
        entities: {
          stack: stack([{ text: 'int y = x  → NPE', tone: 'red', icon: 'alert' }]),
          boxA: boxA('Integer 127'),
          cache: cache(),
          boxB: boxB('Long sum', 'new each turn', [{ text: '× 1,000,000', tone: 'red' }]),
          card: card('Loop.java', ['Long sum = 0L;', 'for (long i = 0; i < 1_000_000; i++)', '! sum += i;   // unbox, add, box again', 'Integer x = null;', '! int y = x;   // x.intValue() → NPE']),
        },
        links: { ref: links.refQuiet, newObj: links.newObj },
        flows: [{ route: ['newObj'], kind: 'fail', rate: 3 }],
      },
    },
    {
      short: 'BigDecimal',
      chapter: 'solution',
      title: 'double cannot store 0.1 — money needs BigDecimal',
      body: [
        '<code>double</code> is binary floating point: 0.1 has no exact binary form, so <code>0.1 + 0.2</code> is <code>0.30000000000000004</code>. Small errors add up across many invoices.',
        '<span class="term">BigDecimal</span> stores an unscaled integer and a scale (<code>10</code>, scale 2 = 0.10), so decimal math is exact. Build it from a String, never from a double.',
      ],
      callout: { kind: 'warn', text: 'new BigDecimal(0.1) copies the double’s error (0.1000000000000000055…). Use new BigDecimal("0.1") or BigDecimal.valueOf(0.1), and compare with compareTo().' },
      changes: ['− Long loop', '+ BigDecimal'],
      metrics: { objects: 3, heapBytes: 96, casts: 0, bugs: 0 },
      scene: {
        entities: {
          stack: stack([{ text: '0.1 + 0.2 ≠ 0.3', tone: 'red' }]),
          boxA: boxA('Integer 127'),
          cache: cache(),
          boxB: boxB('BigDecimal', 'value + scale', [{ text: '0.30 exactly', tone: 'green' }]),
          card: card('Money.java', ['! 0.1 + 0.2              // 0.30000000000000004', 'var a = new BigDecimal("0.1");', 'var b = new BigDecimal("0.2");', '= a.add(b)               // 0.3 exact']),
        },
        links: { ref: links.refQuiet, newObj: links.newQuiet },
        flows: [{ route: ['newObj'], kind: 'res', rate: 1, bounce: true }],
      },
    },
    {
      short: 'Erasure',
      chapter: 'insight',
      title: 'Generics exist only at compile time',
      body: [
        '<code>javac</code> checks <code>List&lt;String&gt;</code> and then <span class="term">erases</span> the type argument: the runtime object is a plain ArrayList holding <code>Object[]</code>.',
        'To give you back a String, javac inserts a <code>checkcast</code> at every <code>get()</code>. That is why you can’t write <code>new T()</code> or check <code>instanceof List&lt;String&gt;</code>.',
      ],
      callout: { kind: 'insight', text: 'Erasure kept Java 5 generics binary-compatible with pre-generics libraries: List<String> and List<Integer> are the same class at runtime.' },
      changes: ['+ javac', '~ heap object is now an ArrayList'],
      metrics: { objects: 1, heapBytes: 56, casts: 1, bugs: 0 },
      scene: {
        entities: {
          stack: stack([{ text: 'String s = names.get(0)', tone: 'violet' }]),
          javac: javac([{ text: 'inserts checkcast', tone: 'amber' }]),
          list: list([{ text: 'runtime: List', tone: 'gray' }]),
          card: card('after javac', ['List<String> names = new ArrayList<>();', '# compiles to:', 'List names = new ArrayList();', '= String s = (String) names.get(0);']),
        },
        links: { listRef: links.listRef, erase: links.erase },
        flows: [
          { route: ['erase'], kind: 'write', rate: 0.8 },
          { route: ['listRef'], rate: 1, bounce: true },
        ],
      },
    },
    {
      short: 'Bridge',
      chapter: 'technique',
      title: 'Bridge methods keep overriding working',
      body: [
        '<code>class IntBox extends Box&lt;Integer&gt;</code> overrides <code>set(Integer)</code>. After erasure the parent’s method is <code>set(Object)</code> — a different signature, so polymorphism would silently break.',
        'javac adds a synthetic <span class="term">bridge method</span> <code>set(Object)</code> that casts and calls <code>set(Integer)</code>. You see it in <code>javap</code> and in reflection.',
      ],
      callout: { kind: 'tip', text: 'When scanning methods with reflection, skip m.isBridge() — otherwise every generic override shows up twice.' },
      changes: ['+ IntBox.class with a bridge'],
      metrics: { objects: 1, heapBytes: 56, casts: 2, bugs: 0 },
      scene: {
        entities: {
          stack: stack(),
          javac: javac(),
          list: list(),
          bridge: block(positions.cache, { color: `orange`, glyph: `split`, label: [`IntBox.class`], sub: `2 set() methods` }),
          card: card('javap -c IntBox', ['void set(Integer v)       // yours', 'synthetic bridge void set(Object v)', '= checkcast Integer; invokevirtual set(Integer)']),
        },
        links: { listRef: links.listRef, emitBridge: links.emitBridge },
        flows: [{ route: ['emitBridge'], kind: 'write', rate: 0.8 }],
      },
    },
    {
      short: 'PECS',
      chapter: 'technique',
      title: 'Producer extends, consumer super',
      body: [
        'Generics are <b>invariant</b>: a <code>List&lt;Integer&gt;</code> is not a <code>List&lt;Number&gt;</code>. Wildcards say how a parameter is used.',
        'Read from a <span class="term">producer</span> declared <code>? extends T</code>; write into a <span class="term">consumer</span> declared <code>? super T</code>. That is exactly the signature of <code>Collections.copy</code>.',
      ],
      callout: { kind: 'tip', text: 'You cannot add to a List<? extends Number> (except null) — the compiler doesn’t know which subtype it holds.' },
      changes: ['− bridge', '+ List<Object> consumer'],
      metrics: { objects: 2, heapBytes: 112, casts: 0, bugs: 0 },
      scene: {
        entities: {
          stack: stack(),
          javac: javac([{ text: 'checks bounds', tone: 'green' }]),
          list: list([{ text: '? extends Number', tone: 'green' }]),
          sink: boxB('Object list', 'consumer', [{ text: '? super Integer', tone: 'green' }]),
          card: card('Collections.java', ['static <T> void copy(', '    List<? super T> dest,', '    List<? extends T> src)', '= copy(objects, integers);   // compiles']),
        },
        links: { listRef: links.listRef, copy: links.copy },
        flows: [{ route: ['copy'], kind: 'res', rate: 1.4 }],
      },
    },
    {
      short: 'Raw types',
      chapter: 'problem',
      title: 'Raw types let the wrong object in',
      body: [
        'A <span class="term">raw type</span> (<code>List</code> without &lt;…&gt;) switches the checks off. You can add an Integer to what is really a List&lt;String&gt; — javac only warns.',
        'The error surfaces far away, as a <code>ClassCastException</code> at the hidden cast when someone reads it. This is <span class="term">heap pollution</span>.',
      ],
      callout: { kind: 'warn', text: 'Never ignore “unchecked” warnings. For generic varargs, mark safe methods with @SafeVarargs instead of suppressing warnings everywhere.' },
      changes: ['− consumer list', '! Integer inside List<String>'],
      metrics: { objects: 2, heapBytes: 72, casts: 1, bugs: 1 },
      scene: {
        entities: {
          stack: stack([{ text: 'ClassCastException', tone: 'red', icon: 'alert' }]),
          javac: javac([{ text: 'unchecked warning', tone: 'amber', icon: 'alert' }]),
          list: list([{ text: 'Integer among Strings', tone: 'red' }]),
          card: card('Polluted.java', ['List<String> names = new ArrayList<>();', 'List raw = names;', '! raw.add(42);                 // only a warning', '! String s = names.get(0);     // ClassCastException']),
        },
        links: { rawAdd: links.rawAdd },
        flows: [{ route: ['rawAdd'], kind: 'fail', rate: 1 }],
      },
    },
  ],
};
