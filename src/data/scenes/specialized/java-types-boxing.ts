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
  title: 'Types, Boxing & Generics',
  summary:
    'Understand WHY Integer 127 == 127 is true while 128 is false, why double fails money, how Type Erasure & Bridge Methods work, and why PECS bounds prevent heap pollution.',
  minutes: 14,
  level: 'core',
  metrics: ['memory_slot', 'equality_rule', 'precision', 'tricky_bug'],
  legend: ['flow', ['req', 'box / check'], ['res', 'cache / PECS'], ['fail', 'NPE / drift']],
  goals: [
    { text: 'Contrast 4-byte Stack primitive vs 16-byte Heap Wrapper', step: 1 },
    { text: 'Explain IntegerCache (-128..127) == vs .equals() trap', step: 2 },
    { text: 'Diagnose hidden autoboxing loop & null unboxing NPE', step: 3 },
    { text: 'Fix IEEE-754 double rounding drift with BigDecimal', step: 4 },
    { text: 'Explain why Generics use Compile-Time Type Erasure', step: 5 },
    { text: 'Inspect synthetic Bridge Methods emitted by javac', step: 6 },
    { text: 'Apply PECS (? extends / ? super) variance bounds', step: 7 },
    { text: 'Prevent Heap Pollution from raw types & varargs', step: 8 },
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
          prim: d(-12, -14, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['int x = 42'], sub: '4B on Stack' }),
          wrap: b(2, -6, { r: 2.2, h: 48, color: 'amber', label: ['Integer'], sub: '16B Heap obj' }),
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
          prim: d(-12, -14, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['valueOf(int)'], sub: 'autoboxing' }),
          cache: b(-12, -2, { r: 2.2, h: 48, color: 'green', label: ['IntegerCache'], sub: '-128 .. 127' }),
          a127: d(4, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['127 == 127'], sub: 'same ref: true' }),
          a128: d(4, -2, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['128 == 128'], sub: 'diff ref' }),
          card: S({ x: -12, y: 12 }, '2. Why Integer.valueOf() Caches -128..127', [
            'Integer a = 127, b = 127; // valueOf(127) -> cached!',
            'a == b;      // true  (same object in IntegerCache)',
            'Integer x = 128, y = 128; // new Integer(128) twice!',
            'x == y;      // false! Always use x.equals(y)',
          ], { icon: 'terminal' }),
        },
        links: {
          pr_ch: h('prim', 'cache', ['prim', 'cache'], { heads: 'end', label: 'cache' }),
          ch_127: h('cache', 'a127', ['cache', 'a127'], { heads: 'end', label: 'hit' }),
          ch_128: h('cache', 'a128', ['cache', 'a128'], { heads: 'end', label: 'miss -> new' }),
        },
        flows: [{ route: ['pr_ch', 'ch_127'], kind: 'res', rate: 1.9 }, { route: ['ch_128'], kind: 'fail', rate: 1.4 }],
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
          loop: d(-12, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['Long sum += i'], sub: 'boxes / iter' }),
          wrap: b(2, -16, { r: 2.2, h: 48, color: 'amber', label: ['1M Heap Longs'], sub: 'GC churn' }),
          npe: d(2, -2, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Throw NPE'], sub: 'if null -> NPE' }),
          card: S({ x: -12, y: 12 }, '3. Two Classic Autoboxing Traps', [
            'Long sum = 0L; // BUG: use primitive long sum = 0L!',
            'for (long i = 0; i < 1_000_000; i++) sum += i;',
            '// Ternary NPE trap: Integer a = null;',
            'Integer res = flag ? a : 0; // unboxes a -> NPE!',
          ], { icon: 'terminal' }),
        },
        links: {
          lp_wr: h('loop', 'wrap', ['loop', 'wrap'], { heads: 'end', label: 'box 1M' }),
          lp_np: h('loop', 'npe', ['loop', 'npe'], { heads: 'end', label: 'null unbox' }),
        },
        flows: [{ route: ['lp_wr'], kind: 'fail', rate: 1.8 }, { route: ['lp_np'], kind: 'fail', rate: 1.5 }],
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
          dbl: d(-12, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['double 0.1'], sub: 'binary drift' }),
          bd: d(-12, -2, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['BigDecimal'], sub: 'String ctor' }),
          scale: b(4, -8, { r: 2.2, h: 48, color: 'blue', label: ['int + scale'], sub: '10 * 10^-2' }),
          card: S({ x: -12, y: 12 }, '4. Exact Financial Math with BigDecimal', [
            '0.1 + 0.2; // 0.30000000000000004 (IEEE-754 binary)',
            'new BigDecimal(0.1);    // BAD: 0.10000000000000000555...',
            'new BigDecimal("0.10"); // GOOD: exact 10 * 10^-2',
            '// Note: 1.0.equals(1.00) is FALSE; compareTo() is 0!',
          ], { icon: 'terminal' }),
        },
        links: {
          db_bd: h('dbl', 'bd', ['dbl', 'bd'], { heads: 'end', label: 'fix' }),
          bd_sc: h('bd', 'scale', ['bd', 'scale'], { heads: 'end', label: 'exact' }),
        },
        flows: [{ route: ['db_bd', 'bd_sc'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Type Erasure',
      chapter: 'generics',
      title: '5. Why Generics Erase <T> at Runtime (Type Erasure)',
      body: [
        'Java Generics are a <code>javac</code> compile-time check: at runtime, <code>List&lt;String&gt;</code> and <code>List&lt;Integer&gt;</code> both erase to raw <code>List</code> (storing <code>Object</code>).',
        'That is WHY <code>new T()</code> and <code>obj instanceof List&lt;String&gt;</code> are illegal — and why <code>List&lt;Integer&gt;</code> must box primitives!',
      ],
      callout: {
        kind: 'insight',
        text: 'Type Erasure preserved 100% binary compatibility with pre-Java 5 bytecode without changing JVM instructions.',
      },
      changes: ['+ javac erases <T> to Object / upper bound', '+ Inserts checkcast bytecode on reads'],
      metrics: { memory_slot: 'Erased Object', equality_rule: 'Same .class', precision: 'Compile check', tricky_bug: 'No new T()' },
      scene: {
        entities: {
          src: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['List<String>'], sub: 'source code' }),
          jvc: d(0, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['javac Eraser'], sub: 'check + erase' }),
          bc: b(0, 0, { r: 2.2, h: 48, color: 'green', label: ['.class Bytecode'], sub: 'Object + cast' }),
          card: S({ x: -12, y: 12 }, '5. Compile-Time Type Erasure', [
            '// Source:   String s = list.get(0);',
            '// Bytecode: String s = (String) list.get(0); // checkcast',
            'List<String>.class == List<Integer>.class; // TRUE!',
          ], { icon: 'terminal' }),
        },
        links: {
          sr_jv: h('src', 'jvc', ['src', 'jvc'], { heads: 'end', label: 'verify <T>' }),
          jv_bc: h('jvc', 'bc', ['jvc', 'bc'], { heads: 'end', label: 'erase' }),
        },
        flows: [{ route: ['sr_jv', 'jv_bc'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Bridge Method',
      chapter: 'generics',
      title: '6. Synthetic Bridge Methods for Polymorphism',
      body: [
        'If <code>class StrNode extends Node&lt;String&gt;</code> overrides <code>setData(String)</code>, after erasure the parent has <code>setData(Object)</code> while the child has <code>setData(String)</code> — different signatures!',
        'To keep polymorphism working, <code>javac</code> silently generates a synthetic <code>setData(Object)</code> <strong>Bridge Method</strong> that casts and delegates to <code>setData(String)</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'If you inspect methods via Reflection, filter out method.isBridge() / method.isSynthetic() to avoid duplicate entries.',
      },
      changes: ['+ javac emits synthetic bridge method', '+ Casts Object -> String before delegate'],
      metrics: { memory_slot: 'Bridge Method', equality_rule: 'Polymorphic', precision: 'Runtime cast', tricky_bug: 'Reflection dup' },
      scene: {
        entities: {
          par: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'layers', label: ['Node<Object>'], sub: 'setData(Obj)' }),
          jvc: d(0, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['Bridge Method'], sub: 'javac synth' }),
          cld: d(0, 0, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['StrNode'], sub: 'setData(Str)' }),
          card: S({ x: -12, y: 12 }, '6. Hidden Synthetic Bridge Method', [
            'class StrNode extends Node<String> {',
            '  // Emitted by javac so Node.setData(Object) overrides:',
            '  /* synthetic bridge */ void setData(Object x) {',
            '    setData((String) x); // ClassCastException if polluted!',
            '  }',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          pr_br: h('par', 'jvc', ['par', 'jvc'], { heads: 'end', label: 'override' }),
          br_cl: h('jvc', 'cld', ['jvc', 'cld'], { heads: 'end', label: 'cast()' }),
        },
        flows: [{ route: ['pr_br', 'br_cl'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'PECS',
      chapter: 'generics',
      title: '7. Variance & PECS (? extends vs ? super)',
      body: [
        'Arrays are covariant (<code>Integer[]</code> is a <code>Number[]</code>, risking runtime <code>ArrayStoreException</code>), while Generics are <strong>invariant</strong> for safety.',
        'Use <strong>PECS</strong>: <em>Producer Extends</em> (<code>? extends T</code> to read <code>T</code>) and <em>Consumer Super</em> (<code>? super T</code> to write <code>T</code>).',
      ],
      callout: {
        kind: 'insight',
        text: 'Effective Java Item 31: Producer-Extends, Consumer-Super (PECS) makes generic APIs maximally flexible and type-safe.',
      },
      changes: ['+ ? extends T read-only producer', '+ ? super T write-safe consumer'],
      metrics: { memory_slot: 'PECS Bounds', equality_rule: 'Invariant', precision: 'Compile-safe', tricky_bug: 'Cant add ext' },
      scene: {
        entities: {
          prod: d(-12, -16, { s: 4.8, h: 54, color: 'sky', glyph: 'layers', label: ['Producer'], sub: '? extends T' }),
          cons: d(-12, -2, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Consumer'], sub: '? super T' }),
          copier: d(4, -9, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['Copy Engine'], sub: 'PECS safe' }),
          card: S({ x: -12, y: 12 }, '7. PECS: Producer Extends, Consumer Super', [
            'void copy(List<? super Number> dst,',
            '          List<? extends Number> src) {',
            '  for (Number n : src) dst.add(n); // read + write safe',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          pr_cp: h('prod', 'copier', ['prod', 'copier'], { heads: 'end', label: 'read T' }),
          cp_cn: h('copier', 'cons', ['copier', 'cons'], { heads: 'end', label: 'write T' }),
        },
        flows: [{ route: ['pr_cp', 'cp_cn'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Heap Pollution',
      chapter: 'generics',
      title: '8. Preventing Heap Pollution (Raw Types & Varargs)',
      body: [
        'Mixing raw <code>List</code> with <code>List&lt;String&gt;</code>—or mutating a generic varargs array <code>T... args</code>—causes <strong>Heap Pollution</strong>: a <code>List&lt;String&gt;</code> secretly holds an <code>Integer</code> until a distant read crashes!',
        'Never use raw types; use <code>@SafeVarargs</code> only when you never store into or expose the varargs array.',
      ],
      callout: {
        kind: 'warn',
        text: 'Effective Java Item 26 & 32: Use List<?> instead of raw List, and prefer List<T> over T... varargs.',
      },
      changes: ['+ Raw List / T[] bypasses compile check', '+ List<?> & @SafeVarargs prevent pollution'],
      metrics: { memory_slot: 'Type-Safe', equality_rule: 'No raw types', precision: 'Zero cast err', tricky_bug: 'Heap polluted' },
      scene: {
        entities: {
          raw: d(-14, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Raw List / T...'], sub: 'pollutes Heap' }),
          safe: d(0, -14, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['List<?> / Safe'], sub: 'compile guard' }),
          bc: b(0, 0, { r: 2.2, h: 48, color: 'green', label: ['Clean Heap'], sub: 'no cast crash' }),
          card: S({ x: -12, y: 12 }, '8. Eliminating Heap Pollution', [
            '// BAD: raw List allows Integer into List<String>!',
            '// GOOD: List<?> rejects unsafe writes at compile time',
            '@SafeVarargs // only when array is read-only & not exposed!',
            'static <T> List<T> ofAll(T... items) { ... }',
          ], { icon: 'terminal' }),
        },
        links: {
          rw_sf: h('raw', 'safe', ['raw', 'safe'], { heads: 'end', label: 'ban raw' }),
          sf_ok: h('safe', 'bc', ['safe', 'bc'], { heads: 'end', label: 'safe' }),
        },
        flows: [{ route: ['rw_sf', 'sf_ok'], kind: 'res', rate: 1.9 }],
      },
    },
  ],
};
