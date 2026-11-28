import { fromScreen, makeBlock, makeDb, makeLink, makePanel, cardAt, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage: a stack frame holding String references, the String objects on the heap,
// the byte[] that actually stores the characters, and the JVM's StringTable (pool).
// javac and the GC's dedup thread join later. Nothing moves; references re-point.
//
//   javac          StringTable      dedup (GC)
//   stack ── "ok" (pooled) ── byte[]
//              new String ──┘

const positions = {
  stack: fromScreen(-220, 60),
  javac: fromScreen(-120, -150),
  lit: fromScreen(0, 0),
  table: fromScreen(180, -140),
  dup: fromScreen(70, 180),
  bytes: fromScreen(200, 110),
  gc: fromScreen(350, -40),
};

const stack = (tags: Tag[] = []) =>
  makeBlock(positions.stack.x, positions.stack.y, { s: 4.4, h: 52, color: `blue`, glyph: `layers`, label: [`Stack frame`], sub: `a, b, c`, tags });
const lit = (tags: Tag[] = []) =>
  makeBlock(positions.lit.x, positions.lit.y, { s: 4.4, h: 52, color: `green`, glyph: `file`, label: [`String "ok"`], sub: `pooled`, tags });
const dup = (sub: string, tags: Tag[] = []) =>
  makeBlock(positions.dup.x, positions.dup.y, { s: 4.2, h: 50, color: `green`, glyph: `file`, label: [`String "ok"`], sub, tags });
const table = (tags: Tag[] = []) =>
  makeBlock(positions.table.x, positions.table.y, { s: 4.4, h: 52, color: `purple`, glyph: `hash`, label: [`StringTable`], sub: `in the heap`, tags });
const bytes = (sub: string, tags: Tag[] = []) => makeDb(positions.bytes.x, positions.bytes.y, { r: 2, h: 44, glyph: `database`, label: `byte[] · ${sub}`, tags });
const javac = (tags: Tag[] = []) =>
  makeBlock(positions.javac.x, positions.javac.y, { s: 4.4, h: 52, color: `orange`, glyph: `code`, label: [`javac`], sub: `+ indy concat`, tags });
const garbageCollector = (tags: Tag[] = []) =>
  makeBlock(positions.gc.x, positions.gc.y, { s: 4.2, h: 50, color: `orange`, glyph: `refresh`, label: [`GC dedup`], sub: `background`, tags });

const links = {
  refA: makeLink(`stack`, `lit`, [`stack`, `lit`], { label: `a` }),
  refAB: makeLink(`stack`, `lit`, [`stack`, `lit`], { label: `a, b` }),
  refQuiet: makeLink(`stack`, `lit`, [`stack`, `lit`]),
  value: makeLink(`lit`, `bytes`, [`lit`, `bytes`], { label: `value` }),
  valueQuiet: makeLink(`lit`, `bytes`, [`lit`, `bytes`]),
  pooled: makeLink(`table`, `lit`, [`table`, `lit`], { label: `pooled` }),
  pooledQuiet: makeLink(`table`, `lit`, [`table`, `lit`]),
  refC: makeLink(`stack`, `dup`, [`stack`, `dup`], { label: `c = new` }),
  refCQuiet: makeLink(`stack`, `dup`, [`stack`, `dup`]),
  share: makeLink(`dup`, `bytes`, [`dup`, `bytes`]),
  intern: makeLink(`dup`, `lit`, [`dup`, `lit`], { label: `intern()` }),
  concat: makeLink(`javac`, `stack`, [`javac`, `stack`], { label: `indy` }),
  concatQuiet: makeLink(`javac`, `stack`, [`javac`, `stack`]),
  dedup: makeLink(`gc`, `bytes`, [`gc`, `bytes`], { label: `dedup` }),
};

const card = cardAt({ x: 0, y: 0, dx: -480, dy: 125 }, `code`);

export const javaStringInternalsLesson: Lesson = {
  id: 'java-string-internals',
  title: 'String Pool & Compact Strings',
  summary:
    'What a String really is on the heap: an immutable wrapper around a byte[], literals shared through the StringTable, Compact Strings, concatenation, deduplication and text blocks.',
  minutes: 12,
  level: 'core',
  metrics: ['strings', 'byteArrays', 'bytes', 'copies'],
  legend: [[`req`, `reference`], [`res`, `shared data`], [`write`, `compile / GC work`], [`fail`, `waste`]],
  goals: [
    { text: 'Explain why immutability lets String cache its hash', step: 1 },
    { text: 'Trace a literal into the StringTable vs new String()', step: 2 },
    { text: 'Use String.intern() to get the pooled instance', step: 3 },
    { text: 'Halve memory with Compact Strings (byte[] + coder)', step: 4 },
    { text: 'Contrast + in loops with invokedynamic concat', step: 5 },
    { text: 'Share byte[] arrays with GC string deduplication', step: 6 },
    { text: 'Write SQL/JSON with text blocks and formatted()', step: 7 },
  ],
  steps: [
    {
      short: 'Immutable',
      chapter: 'setup',
      title: 'A String is a wrapper around a byte[] that never changes',
      body: [
        'A <code>String</code> object holds a <code>final byte[] value</code>, a <code>coder</code> and a cached <code>hash</code>. No method ever modifies the array — “changing” a string always creates a new one.',
        'Because the content can’t change, the hash code can be computed once and reused (great for HashMap keys), and the same object can be shared by any number of threads safely.',
      ],
      callout: { kind: 'insight', text: 'Immutability is also a security property: a file path or URL checked once can’t be swapped by another thread after the check.' },
      metrics: { strings: 1, byteArrays: 1, bytes: 2, copies: 0 },
      scene: {
        entities: {
          stack: stack(),
          lit: lit([{ text: 'hash cached', tone: 'green' }]),
          bytes: bytes(`2 B`),
          card: card('String.java (JDK 21)', ['public final class String {', '  private final byte[] value;', '  private final byte coder; // 0=LATIN1', '  private int hash = 0; // cached']),
        },
        links: { refA: links.refA, value: links.value },
        flows: [{ route: ['refA', 'value'], rate: 1 }],
      },
    },
    {
      short: 'Literals',
      chapter: 'technique',
      title: 'Literals share one pooled object, new String() does not',
      body: [
        'Every literal <code>"ok"</code> compiles to an <code>ldc</code> instruction. The JVM looks it up in the <span class="term">StringTable</span> and returns the single pooled instance — so <code>a</code> and <code>b</code> point to the same object.',
        '<code>new String("ok")</code> always allocates a second String object. It reuses the same byte[] (no characters are copied), but it is a different object, so <code>a == c</code> is false.',
      ],
      callout: { kind: 'warn', text: 'There is almost never a reason to write new String("..."). Compare strings with equals(), never ==.' },
      changes: ['+ StringTable', '+ new String object'],
      metrics: { strings: 2, byteArrays: 1, bytes: 2, copies: 0 },
      scene: {
        entities: {
          stack: stack([{ text: 'a == c  → false', tone: 'red' }]),
          lit: lit(),
          table: table([{ text: '"ok" → 1 entry', tone: 'violet' }]),
          dup: dup(`not pooled`),
          bytes: bytes(`shared`),
          card: card('ldc vs new', ['String a = "ok";              // ldc → pool', 'String b = "ok";              // same object', 'String c = new String("ok");  // new object', '! a == c        // false', '= a.equals(c)   // true']),
        },
        links: { refAB: links.refAB, value: links.valueQuiet, pooled: links.pooled, refC: links.refC, share: links.share },
        flows: [
          { route: ['refAB'], rate: 1 },
          { route: ['refC'], kind: 'fail', rate: 0.6 },
        ],
      },
    },
    {
      short: 'intern()',
      chapter: 'technique',
      title: 'intern() hands you the pooled instance',
      body: [
        '<code>c.intern()</code> looks up c’s content in the StringTable. If an equal string is there, you get that pooled object back; if not, c itself is added.',
        'Since Java 7 the table lives in the regular heap, so unused entries are garbage-collected like anything else.',
      ],
      callout: { kind: 'tip', text: 'Interning helps only for many repeated values from outside the code (e.g. country codes read from a file). For literals the compiler already did it.' },
      changes: ['~ c = c.intern() → pooled object'],
      metrics: { strings: 2, byteArrays: 1, bytes: 2, copies: 0 },
      scene: {
        entities: {
          stack: stack([{ text: 'c.intern() == a → true', tone: 'green' }]),
          lit: lit(),
          table: table(),
          dup: dup(`garbage soon`, [{ text: 'unreferenced', tone: 'gray' }]),
          bytes: bytes(`shared`),
          card: card('intern()', ['String c = new String("ok");', 'c = c.intern();      // look up "ok" in the table', '= c == a             // true: pooled object']),
        },
        links: { refAB: links.refAB, value: links.valueQuiet, pooled: links.pooledQuiet, intern: links.intern, share: links.share },
        flows: [{ route: ['intern'], kind: 'res', rate: 1 }],
      },
    },
    {
      short: 'Compact',
      chapter: 'insight',
      title: 'Compact Strings: 1 byte per char when possible',
      body: [
        'Since JDK 9 the array is a <code>byte[]</code>, not a <code>char[]</code>. If every character fits in Latin-1, the String uses <span class="term">LATIN1</span> coding: 1 byte per character.',
        'One character outside Latin-1 (like ✓ or 你) switches that string to <span class="term">UTF16</span>: 2 bytes per character. Typical apps save 20–50% of their string memory.',
      ],
      callout: { kind: 'insight', text: 'The check happens once, when the String is created. Methods like charAt() branch on coder, which the JIT handles very cheaply.' },
      changes: ['~ byte[] coder = LATIN1'],
      metrics: { strings: 2, byteArrays: 2, bytes: 10, copies: 0 },
      scene: {
        entities: {
          stack: stack(),
          lit: lit([{ text: 'coder = LATIN1', tone: 'green' }]),
          table: table(),
          dup: dup(`"ok✓" UTF16`, [{ text: '2 B per char', tone: 'amber' }]),
          bytes: bytes(`2 B`, [{ text: '1 B per char', tone: 'green' }]),
          card: card('memory for the chars', ['"ok"     LATIN1   2 chars →  2 bytes', '"ok✓"    UTF16    3 chars →  6 bytes', '# before JDK 9 every char took 2 bytes', '# opt out: -XX:-CompactStrings']),
        },
        links: { refAB: links.refQuiet, value: links.value, pooled: links.pooledQuiet, refC: links.refCQuiet },
        flows: [{ route: ['value'], kind: 'res', rate: 1 }],
      },
    },
    {
      short: 'Concat',
      chapter: 'problem',
      title: '+ is fast once, slow in a loop',
      body: [
        'Since JDK 9 javac compiles <code>a + b + c</code> to one <code>invokedynamic</code> call to <span class="term">StringConcatFactory</span>, which sizes the result exactly and copies each part once.',
        'Inside a loop, <code>s += x</code> builds a brand-new String every turn and copies everything so far: 10,000 turns copy about 50 million characters. Use a <code>StringBuilder</code> (or <code>String.join</code>).',
      ],
      callout: { kind: 'tip', text: 'Single-expression concatenation is fine — don’t replace readable a + ":" + b with StringBuilder. Only loops need it.' },
      changes: ['+ javac (indy concat)', '− loop: 10,000 throw-away Strings'],
      metrics: { strings: 10000, byteArrays: 10000, bytes: 50000000, copies: 10000 },
      scene: {
        entities: {
          stack: stack([{ text: 's += x  × 10,000', tone: 'red' }]),
          javac: javac([{ text: 'one presized copy', tone: 'green' }]),
          lit: lit(),
          table: table(),
          bytes: bytes(`2 B`),
          card: card('Report.java', ['String line = id + ":" + name;    // 1 indy call', 'String s = "";', '! for (var x : items) s += x;       // O(n²) copies', '= var sb = new StringBuilder();', '= for (var x : items) sb.append(x);']),
        },
        links: { refAB: links.refQuiet, value: links.valueQuiet, pooled: links.pooledQuiet, concat: links.concat },
        flows: [{ route: ['concat'], kind: 'write', rate: 2.5 }],
      },
    },
    {
      short: 'Dedup',
      chapter: 'solution',
      title: 'The GC can merge identical byte[] arrays',
      body: [
        'Strings parsed from JSON or a database are new objects with their own arrays — 50,000 copies of <code>"VN"</code> means 50,000 identical byte[]s.',
        'With <code>-XX:+UseStringDeduplication</code> a background GC thread finds Strings with equal content and points them at one shared byte[]. The String objects stay separate; only the arrays merge. G1 had it first; since JDK 18 every collector supports it.',
      ],
      callout: { kind: 'insight', text: 'Dedup is safe precisely because Strings are immutable: nobody can ever write into the shared array.' },
      changes: ['+ GC dedup thread', '~ 50,000 arrays → 1'],
      metrics: { strings: 50000, byteArrays: 1, bytes: 2, copies: 0 },
      scene: {
        entities: {
          stack: stack(),
          javac: javac(),
          lit: lit(),
          table: table(),
          dup: dup(`from JSON`, [{ text: '× 50,000', tone: 'violet' }]),
          bytes: bytes(`1 shared`, [{ text: '49,999 freed', tone: 'green' }]),
          gc: garbageCollector(),
          card: card('JVM flags', ['$ java -XX:+UseG1GC \\', '       -XX:+UseStringDeduplication -jar app.jar', '# String objects stay; their byte[] is shared']),
        },
        links: { refAB: links.refQuiet, value: links.valueQuiet, pooled: links.pooledQuiet, concat: links.concatQuiet, share: links.share, dedup: links.dedup },
        flows: [{ route: ['dedup'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'Text blocks',
      chapter: 'recap',
      title: 'Text blocks: multi-line strings without the noise',
      body: [
        'A <span class="term">text block</span> (<code>"""</code>, Java 15) lets you paste SQL or JSON as-is. javac strips the common indentation at compile time — the result is an ordinary pooled String.',
        'Fill in values with <code>formatted()</code>. Recap: Strings are immutable wrappers around a byte[], literals are pooled, Compact Strings halve memory, loops need a builder, and the GC can share duplicate arrays.',
      ],
      callout: { kind: 'warn', text: 'formatted() is not a SQL escaper. Pass user values as PreparedStatement parameters, never by formatting them into the query.' },
      changes: ['~ javac strips indentation'],
      metrics: { strings: 1, byteArrays: 1, bytes: 62, copies: 0 },
      scene: {
        entities: {
          stack: stack(),
          javac: javac([{ text: 'strips indent', tone: 'green' }]),
          lit: lit([{ text: 'text block · pooled', tone: 'green' }]),
          table: table(),
          bytes: bytes(`62 B`),
          card: card('Query.java', ['String sql = """', '    SELECT id, name', '    FROM users', '    WHERE country = ?', '    """;']),
        },
        links: { refAB: links.refQuiet, value: links.valueQuiet, pooled: links.pooled, concat: links.concat },
        flows: [{ route: ['concat'], kind: 'write', rate: 0.8 }],
      },
    },
  ],
};
