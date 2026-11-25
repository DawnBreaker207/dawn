/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaTypesBoxingLesson: Lesson = {
  id: 'java-types-boxing',
  title: 'Primitives, Autoboxing, IntegerCache & equals/hashCode',
  summary:
    'Understand WHY Integer 127 == 127 is true while 128 == 128 is false, why autoboxing in loops stalls GC, why double fails money math, and how mutating keys breaks HashMap.',
  minutes: 12,
  level: 'core',
  metrics: ['memory_slot', 'equality_rule', 'precision', 'tricky_bug'],
  legend: ['flow', ['req', 'box / lookup'], ['res', 'cache / exact'], ['fail', 'NPE / drift']],
  goals: [
    { text: 'Contrast 4-byte Stack primitive vs 16-byte Heap Wrapper', step: 1 },
    { text: 'Explain IntegerCache (-128..127) == vs .equals() trap', step: 2 },
    { text: 'Diagnose hidden autoboxing loop & null unboxing NPE', step: 3 },
    { text: 'Fix IEEE-754 double rounding drift with BigDecimal', step: 4 },
    { text: 'Enforce equals() + hashCode() symmetry contract', step: 5 },
    { text: 'Trace why mutating a key loses it inside HashMap', step: 6 },
  ],
  steps: [
    {
      short: 'Stack vs Heap',
      chapter: 'types',
      title: '1. Why Primitives Live on Stack, Wrappers on Heap',
      body: [
        'An <code>int</code> takes 4 raw bytes directly in a thread’s Stack frame. An <code>Integer</code> is a full Heap object with a 12–16 byte JVM object header + 4-byte payload + pointer indirection.',
        'Collections (<code>List&lt;Integer&gt;</code>) require Objects because Java Generics erase to <code>Object</code> — primitives cannot be stored directly without boxing.',
      ],
      callout: {
        kind: 'insight',
        text: 'Effective Java Item 61: Prefer primitives to boxed primitives whenever nullability or Generics are not required.',
      },
      metrics: { memory_slot: '4B vs 16B Heap', equality_rule: 'Value vs Ref', precision: 'Exact int', tricky_bug: 'Memory bloat' },
      scene: {
        entities: {
          prim: d(-12, -8, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['int x = 42'], sub: '4B on Stack' }),
          wrap: b(4, -8, { r: 2.2, h: 48, color: 'amber', label: ['Integer'], sub: '16B Heap obj' }),
          card: S({ x: -12, y: 12 }, '1. Primitive vs Boxed Wrapper Layout', [
            'int a = 42;            // 4 bytes raw value on Stack',
            'Integer b = 42;        // Heap Object: 12B Header + 4B int',
            '// Why boxing exists: List<T> erases T to Object!',
          ], { icon: 'terminal' }),
        },
        links: {
          pr_wr: h('prim', 'wrap', ['prim', 'wrap'], { heads: 'end', label: 'box -> Heap' }),
        },
        flows: [{ route: ['pr_wr'], kind: 'req', rate: 1.7 }],
      },
    },
    {
      short: 'IntegerCache',
      chapter: 'types',
      title: '2. Why 127 == 127 Is True, But 128 == 128 Is False',
      body: [
        '<code>Integer a = 127</code> compiles to <code>Integer.valueOf(127)</code>. The JVM pre-caches <code>-128..127</code> in <code>IntegerCache</code>, so both variables point to the exact same Heap object!',
        'For <code>128</code>, <code>valueOf()</code> allocates two distinct <code>Integer</code> objects. Using <code>==</code> compares Heap addresses (<code>false</code>), whereas <code>.equals()</code> compares values (<code>true</code>).',
      ],
      callout: {
        kind: 'warn',
        text: 'Classic OCP trap: NEVER compare boxed Wrappers (Integer, Long) with == — always use .equals()!',
      },
      changes: ['+ IntegerCache[-128..127] returns shared ref', '+ >=128 allocates new Heap Integer'],
      metrics: { memory_slot: 'IntegerCache', equality_rule: '== checks ref!', precision: 'Exact int', tricky_bug: '128 == 128 false' },
      scene: {
        entities: {
          cache: b(-14, -10, { r: 2.2, h: 48, color: 'green', label: ['IntegerCache'], sub: '-128 .. 127' }),
          a127: d(0, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['127 == 127'], sub: 'same ref: true' }),
          a128: d(14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['128 == 128'], sub: 'diff ref' }),
          card: S({ x: -12, y: 12 }, '2. Why Integer.valueOf() Caches -128..127', [
            'Integer a = 127, b = 127; // valueOf(127) -> cached!',
            'a == b;      // true  (same object in IntegerCache)',
            'Integer x = 128, y = 128; // new Integer(128) twice!',
            'x == y;      // false! Always use x.equals(y)',
          ], { icon: 'terminal' }),
        },
        links: {
          ch_127: h('cache', 'a127', ['cache', 'a127'], { heads: 'end', label: 'cached ref' }),
          a127_128: h('a127', 'a128', ['a127', 'a128'], { heads: 'end', label: 'bypass >127' }),
        },
        flows: [{ route: ['ch_127'], kind: 'res', rate: 1.9 }, { route: ['a127_128'], kind: 'fail', rate: 1.4 }],
      },
    },
    {
      short: 'Unbox NPE',
      chapter: 'types',
      title: '3. Hidden Autoboxing Loops & Null Unboxing NPE',
      body: [
        'Writing <code>Long sum = 0L; sum += i;</code> inside a million-item loop silently unboxes <code>sum</code>, adds <code>i</code>, and boxes a brand-new <code>Long</code> on the Heap on every iteration!',
        'Worse: unboxing a <code>null</code> wrapper (e.g. <code>int x = nullableInt;</code> or ternary <code>flag ? null : 1</code>) calls <code>.intValue()</code> and crashes with <code>NullPointerException</code>.',
      ],
      callout: {
        kind: 'warn',
        text: 'Effective Java Item 61: Beware ternary unboxing! (cond ? map.get(k) : 0) unboxes map.get(k) to int -> NPE if missing!',
      },
      changes: ['+ sum += i allocates 1M Heap Longs', '+ Unboxing null throws NPE'],
      metrics: { memory_slot: '1M Heap objs', equality_rule: '.intValue()', precision: 'N/A', tricky_bug: 'Silent NPE' },
      scene: {
        entities: {
          loop: d(-14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['Long sum += i'], sub: 'boxes / iter' }),
          unbox: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['intValue()'], sub: 'hidden unbox' }),
          npe: d(14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Throw NPE'], sub: 'if null -> NPE' }),
          card: S({ x: -12, y: 12 }, '3. Two Classic Autoboxing Traps', [
            'Long sum = 0L; // BUG: use primitive long sum = 0L!',
            'for (long i = 0; i < 1_000_000; i++) sum += i;',
            '// Ternary NPE trap: Integer a = null;',
            'Integer res = flag ? a : 0; // unboxes a -> NPE!',
          ], { icon: 'terminal' }),
        },
        links: {
          lp_ub: h('loop', 'unbox', ['loop', 'unbox'], { heads: 'end', label: 'unbox/box' }),
          ub_np: h('unbox', 'npe', ['unbox', 'npe'], { heads: 'end', label: 'null -> NPE' }),
        },
        flows: [{ route: ['lp_ub', 'ub_np'], kind: 'fail', rate: 1.8 }],
      },
    },
    {
      short: 'BigDecimal',
      chapter: 'precision',
      title: '4. Why double Fails Money (0.1 + 0.2 != 0.3)',
      body: [
        '<code>float</code> and <code>double</code> use binary IEEE-754 floating point: base-10 fractions like <code>0.1</code> cannot be represented exactly in binary, so <code>0.1 + 0.2 == 0.30000000000000004</code>.',
        'For currency, use <code>BigDecimal("0.10")</code> (always pass a <code>String</code>, NEVER <code>new BigDecimal(0.1)</code>!) which stores an exact integer <code>unscaledValue</code> + base-10 <code>scale</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Effective Java Item 60: Never use float or double for exact answers like money; use BigDecimal(String) or integer cents.',
      },
      changes: ['+ Binary IEEE-754 drifts on 0.1', '+ BigDecimal(String) keeps exact base-10'],
      metrics: { memory_slot: 'BigDecimal', equality_rule: 'compareTo()==0', precision: 'Exact base-10', tricky_bug: 'new BD(0.1)' },
      scene: {
        entities: {
          dbl: d(-14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['double 0.1'], sub: 'binary drift' }),
          bd: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['BigDecimal'], sub: 'String ctor' }),
          scale: b(14, -10, { r: 2.2, h: 48, color: 'blue', label: ['int + scale'], sub: '10 * 10^-2' }),
          card: S({ x: -12, y: 12 }, '4. Exact Financial Math with BigDecimal', [
            '0.1 + 0.2; // 0.30000000000000004 (IEEE-754 binary)',
            'new BigDecimal(0.1);    // BAD: 0.10000000000000000555...',
            'new BigDecimal("0.10"); // GOOD: exact 10 * 10^-2',
            '// Note: 1.0.equals(1.00) is FALSE; compareTo() is 0!',
          ], { icon: 'terminal' }),
        },
        links: {
          db_bd: h('dbl', 'bd', ['dbl', 'bd'], { heads: 'end', label: 'fix drift' }),
          bd_sc: h('bd', 'scale', ['bd', 'scale'], { heads: 'end', label: 'unscaled' }),
        },
        flows: [{ route: ['db_bd', 'bd_sc'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Contract',
      chapter: 'contract',
      title: '5. The equals() & hashCode() Symmetry Contract',
      body: [
        '<code>HashMap</code> and <code>HashSet</code> first check <code>hashCode()</code> to pick a bucket, and only then call <code>equals()</code> inside that bucket.',
        'If two objects are <code>equals()</code>-true but have different <code>hashCode()</code>s, <code>HashMap</code> looks in the wrong bucket and reports the key does NOT exist!',
      ],
      callout: {
        kind: 'insight',
        text: 'Effective Java Item 11: Always override hashCode() whenever you override equals() — or use a Java record.',
      },
      changes: ['+ hashCode() picks bucket first', '+ equals() verifies within bucket'],
      metrics: { memory_slot: 'Bucket Key', equality_rule: 'hash + equals', precision: 'Consistent', tricky_bug: 'Missing hash' },
      scene: {
        entities: {
          k1: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['Key k1 == k2'], sub: 'same hashCode' }),
          bkt: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['Bucket Index'], sub: '(n-1) & hash' }),
          hit: b(14, -10, { r: 2.2, h: 48, color: 'green', label: ['equals() Hit'], sub: 'found entry' }),
          card: S({ x: -12, y: 12 }, '5. Why hashCode() Must Match equals()', [
            '// Contract: a.equals(b) => a.hashCode() == b.hashCode()',
            '@Override public boolean equals(Object o) { ... }',
            '@Override public int hashCode() {',
            '  return Objects.hash(id, tenant); // same fields!',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          k_bk: h('k1', 'bkt', ['k1', 'bkt'], { heads: 'end', label: '1. hashCode' }),
          bk_ht: h('bkt', 'hit', ['bkt', 'hit'], { heads: 'end', label: '2. equals()' }),
        },
        flows: [{ route: ['k_bk', 'bk_ht'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Mutated Key',
      chapter: 'contract',
      title: '6. Why Mutating a HashMap Key Loses It Forever',
      body: [
        'When you <code>map.put(user, val)</code>, <code>HashMap</code> places the entry into bucket <code>#3</code> based on its initial <code>hashCode()</code>.',
        'If you later mutate <code>user.setName("Bob")</code>, its <code>hashCode()</code> changes to bucket <code>#9</code>. Calling <code>map.get(user)</code> or <code>remove(user)</code> probes bucket <code>#9</code> and returns <code>null</code> — leaking the entry in bucket <code>#3</code>!',
      ],
      callout: {
        kind: 'warn',
        text: 'Always use immutable keys (String, Long, UUID, or immutable Java record) in HashMap and HashSet.',
      },
      changes: ['+ Key stored in bucket #3 on put()', '+ Mutation moves lookup to bucket #9 -> null'],
      metrics: { memory_slot: 'Orphaned Node', equality_rule: 'Immutable Key', precision: 'Broken lookup', tricky_bug: 'Memory leak' },
      scene: {
        entities: {
          mut: d(-14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Mutate Key'], sub: 'hash: 3 -> 9' }),
          b9: d(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['Bucket #9'], sub: 'get() -> null!' }),
          b3: b(14, -10, { r: 2.2, h: 48, color: 'purple', label: ['Bucket #3'], sub: 'leaked entry' }),
          card: S({ x: -12, y: 12 }, '6. Why Map Keys Must Be Immutable', [
            'User u = new User("Alice");',
            'map.put(u, "admin"); // stored in bucket #3',
            'u.setName("Bob");    // hashCode changes to #9!',
            'map.get(u);          // probes bucket #9 -> null!',
          ], { icon: 'terminal' }),
        },
        links: {
          mt_b9: h('mut', 'b9', ['mut', 'b9'], { heads: 'end', label: 'probes #9' }),
          b9_b3: h('b9', 'b3', ['b9', 'b3'], { heads: 'end', label: 'stuck in #3' }),
        },
        flows: [{ route: ['mt_b9'], kind: 'fail', rate: 1.8 }],
      },
    },
  ],
};
