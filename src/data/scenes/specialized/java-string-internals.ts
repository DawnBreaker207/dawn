/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaStringInternalsLesson: Lesson = {
  id: 'java-string-internals',
  title: 'String Immutability, StringTable, Compact byte[] & Concat',
  summary:
    'Understand WHY Strings are immutable, how ldc + StringTable + intern() work, how JDK 9+ Compact Strings halve RAM, why + in loops hurts, and G1GC String Deduplication.',
  minutes: 12,
  level: 'core',
  metrics: ['backing_array', 'pool_region', 'concat_op', 'heap_cost'],
  legend: ['flow', ['req', 'ldc / intern'], ['res', 'dedup / reuse'], ['fail', 'loop alloc']],
  goals: [
    { text: 'Explain why String immutability caches hash & secures refs', step: 1 },
    { text: 'Trace ldc bytecode into Heap StringTable vs new String()', step: 2 },
    { text: 'Probe StringTable via String.intern() (Java 7+ Heap)', step: 3 },
    { text: 'Halve RAM with JDK 9+ Compact Strings (byte[] + coder)', step: 4 },
    { text: 'Contrast + in loops vs StringConcatFactory invokedynamic', step: 5 },
    { text: 'Share backing byte[] via G1GC String Deduplication', step: 6 },
  ],
  steps: [
    {
      short: 'Immutable',
      chapter: 'string',
      title: '1. Why String Is Immutable & Caches hashCode',
      body: [
        '<code>String</code> wraps a <code>private final byte[] value</code> with no mutating setters. Because characters never change, <code>String</code> safely caches its <code>int hash</code> field after the first <code>hashCode()</code> call.',
        'Immutability also makes <code>String</code> automatically thread-safe and safe for security checks (URLs, class names, file paths cannot be swapped mid-flight).',
      ],
      callout: {
        kind: 'insight',
        text: 'Cached hashCode makes String the fastest, safest HashMap key — O(1) hash lookup on repeat calls.',
      },
      metrics: { backing_array: 'final byte[]', pool_region: 'Immutable', concat_op: 'N/A', heap_cost: 'Cached hash' },
      scene: {
        entities: {
          str: d(-12, -8, { s: 4.8, h: 54, color: 'blue', glyph: 'shield', label: ['String Obj'], sub: 'cached hash' }),
          arr: b(4, -8, { r: 2.2, h: 48, color: 'green', label: ['final byte[]'], sub: 'read-only' }),
          card: S({ x: -12, y: 12 }, '1. Immutability & Lazy Hash Caching', [
            'public final class String {',
            '  private final byte[] value; // no setters!',
            '  private int hash;           // cached after 1st call',
            '} // Safe for HashMap keys, threads, & classloading',
          ], { icon: 'terminal' }),
        },
        links: {
          st_ar: h('str', 'arr', ['str', 'arr'], { heads: 'end', label: 'final ref' }),
        },
        flows: [{ route: ['st_ar'], kind: 'res', rate: 1.7 }],
      },
    },
    {
      short: 'StringTable',
      chapter: 'string',
      title: '2. Literal ldc -> StringTable vs new String("ok")',
      body: [
        'String literals (<code>"ok"</code>) compile to <code>ldc</code> bytecode. On first run, the JVM looks up <code>"ok"</code> in the Heap <strong>StringTable</strong> (C++ hash table) and returns that canonical reference.',
        'Calling <code>new String("ok")</code> forces a <strong>second</strong> wrapper object on the Heap outside the pool — so <code>"ok" == new String("ok")</code> is <code>false</code>!',
      ],
      callout: {
        kind: 'warn',
        text: 'Never write new String("literal") — it wastes a Heap object and breaks == reference sharing.',
      },
      changes: ['+ ldc resolves literal in StringTable', '+ new String() allocates extra Heap wrapper'],
      metrics: { backing_array: 'Shared byte[]', pool_region: 'Heap StringTbl', concat_op: 'ldc lookup', heap_cost: '1 vs 2 objs' },
      scene: {
        entities: {
          ldc: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['"ok" Literal'], sub: 'ldc bytecode' }),
          tbl: b(0, -10, { r: 2.2, h: 48, color: 'purple', label: ['StringTable'], sub: 'Heap C++ map' }),
          nw: d(14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'alert', label: ['new String()'], sub: 'extra wrapper' }),
          card: S({ x: -12, y: 12 }, '2. Why "ok" == "ok" But "ok" != new String("ok")', [
            'String a = "ok";             // ldc -> StringTable ref',
            'String b = "ok";             // a == b is TRUE',
            'String c = new String("ok"); // new Heap String wrapper',
            'a == c; // FALSE!  a.equals(c) // TRUE',
          ], { icon: 'terminal' }),
        },
        links: {
          ld_tb: h('ldc', 'tbl', ['ldc', 'tbl'], { heads: 'end', label: 'reuse ref' }),
          nw_tb: h('nw', 'tbl', ['nw', 'tbl'], { heads: 'end', label: 'copies ref' }),
        },
        flows: [{ route: ['ld_tb'], kind: 'res', rate: 1.9 }, { route: ['nw_tb'], kind: 'req', rate: 1.4 }],
      },
    },
    {
      short: 'intern()',
      chapter: 'string',
      title: '3. How String.intern() Works (Java 6 PermGen -> 7+ Heap)',
      body: [
        '<code>s.intern()</code> probes <code>StringTable</code>: if an equal string exists, it returns the pooled reference; otherwise it inserts <code>s</code> directly into <code>StringTable</code>.',
        'Since Java 7, <code>StringTable</code> moved from fixed <strong>PermGen</strong> into the <strong>Heap</strong>, so unreferenced interned strings can be garbage collected.',
      ],
      callout: {
        kind: 'warn',
        text: 'Avoid .intern() on arbitrary user input — StringTable has a fixed bucket count and slows down GC.',
      },
      changes: ['+ intern() probes & registers in StringTable', '+ Heap-resident since Java 7 (GC-able)'],
      metrics: { backing_array: 'Canonical', pool_region: 'Heap StringTbl', concat_op: 'JNI probe', heap_cost: 'GC-eligible' },
      scene: {
        entities: {
          dyn: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Heap String'], sub: 'runtime built' }),
          intrn: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['s.intern()'], sub: 'probe table' }),
          tbl: b(14, -10, { r: 2.2, h: 48, color: 'green', label: ['StringTable'], sub: 'canonical ref' }),
          card: S({ x: -12, y: 12 }, '3. Canonicalizing Strings with intern()', [
            'String s = new StringBuilder("o").append("k").toString();',
            's == "ok";          // false (on Heap)',
            's.intern() == "ok"; // true  (returns StringTable ref!)',
          ], { icon: 'terminal' }),
        },
        links: {
          dy_in: h('dyn', 'intrn', ['dyn', 'intrn'], { heads: 'end', label: 'intern()' }),
          in_tb: h('intrn', 'tbl', ['intrn', 'tbl'], { heads: 'end', label: 'canonical' }),
        },
        flows: [{ route: ['dy_in', 'in_tb'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Compact byte[]',
      chapter: 'memory',
      title: '4. JDK 9+ Compact Strings (byte[] + coder)',
      body: [
        'In Java 8, every character used a 2-byte UTF-16 <code>char[]</code>, wasting 50% RAM for ASCII/Latin-1 text (JSON, SQL, logs).',
        'JDK 9+ replaced <code>char[]</code> with <code>byte[] value</code> + 1-byte <code>coder</code> (<code>LATIN1 = 0</code> uses 1B/char; <code>UTF16 = 1</code> uses 2B/char only when needed).',
      ],
      callout: {
        kind: 'insight',
        text: 'Compact Strings cut total JVM Heap usage by 20–30% in typical web microservices with zero code changes.',
      },
      changes: ['+ char[] (2B) -> byte[] + coder (1B Latin-1)', '+ Auto-switches to UTF16=1 for emoji/CJK'],
      metrics: { backing_array: 'byte[] + coder', pool_region: 'Heap (-50%)', concat_op: 'Coder check', heap_cost: '1B / ASCII' },
      scene: {
        entities: {
          ascii: d(-2, -16, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['"order_42"'], sub: 'coder=0 (1B)' }),
          cjk: d(-2, -2, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['"Xin chào"'], sub: 'coder=1 (2B)' }),
          heap: b(12, -9, { r: 2.2, h: 48, color: 'blue', label: ['byte[] Array'], sub: 'Compact Str' }),
          card: S({ x: -12, y: 12 }, '4. Why JDK 9+ Strings Use Half the Memory', [
            '// Java 8:  private final char[] value; (always 2B/char)',
            '// Java 9+: private final byte[] value; private final byte coder;',
            '// "hello" -> 5 bytes (LATIN1 = 0)',
            '// "chào"  -> 8 bytes (UTF16 = 1)',
          ], { icon: 'terminal' }),
        },
        links: {
          as_hp: h('ascii', 'heap', ['ascii', 'heap'], { heads: 'end', label: '1B/char' }),
          cj_hp: h('cjk', 'heap', ['cjk', 'heap'], { heads: 'end', label: '2B/char' }),
        },
        flows: [{ route: ['as_hp'], kind: 'res', rate: 1.9 }, { route: ['cj_hp'], kind: 'req', rate: 1.5 }],
      },
    },
    {
      short: 'Concat & Loops',
      chapter: 'concat',
      title: '5. Why + in Loops Hurts vs StringConcatFactory',
      body: [
        'Outside loops, JDK 9+ compiles <code>a + ":" + b</code> to <code>invokedynamic StringConcatFactory</code>, sizing the exact <code>byte[]</code> buffer in 1 shot.',
        'Inside a <code>for</code> loop, <code>s += item</code> STILL creates a new <code>StringBuilder</code> and copies the whole string on every iteration ($O(n^2)$)! Use an explicit <code>StringBuilder</code>.',
      ],
      callout: {
        kind: 'warn',
        text: 'Effective Java Item 63: Using + in a loop of N iterations is O(n^2) time and GC allocation!',
      },
      changes: ['+ Loop += allocates O(n^2) StringBuilders', '+ StringConcatFactory sizes 1-shot concat'],
      metrics: { backing_array: 'Presized byte[]', pool_region: 'Eden TLAB', concat_op: 'invokedynamic', heap_cost: 'O(n) vs O(n^2)' },
      scene: {
        entities: {
          loop: d(-14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['for (s += x)'], sub: 'O(n^2) copies' }),
          sb: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['StringBuilder'], sub: 'O(n) buffer' }),
          scf: d(14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['ConcatFactory'], sub: 'invokedynamic' }),
          card: S({ x: -12, y: 12 }, '5. Loop Concatenation vs StringConcatFactory', [
            '// BAD O(n^2): allocates new StringBuilder every iter!',
            'for (var x : items) out += x;',
            '// GOOD O(n): var sb = new StringBuilder();',
            '// Single-line a + b: invokedynamic StringConcatFactory',
          ], { icon: 'terminal' }),
        },
        links: {
          lp_sb: h('loop', 'sb', ['loop', 'sb'], { heads: 'end', label: 'fix -> O(n)' }),
          sb_sc: h('sb', 'scf', ['sb', 'scf'], { heads: 'end', label: '1-shot indy' }),
        },
        flows: [{ route: ['lp_sb', 'sb_sc'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'G1 Dedup',
      chapter: 'gc',
      title: '6. G1GC String Deduplication (-XX:+UseStringDeduplication)',
      body: [
        'Microservices parse millions of identical JSON keys/statuses into separate Heap <code>String</code> objects, each holding a duplicate <code>byte[]</code>.',
        'With <code>-XX:+UseStringDeduplication</code>, G1GC hashes surviving <code>String</code>s and re-points duplicate wrappers to share <strong>one</strong> <code>byte[]</code> — saving RAM without changing <code>String</code> identity!',
      ],
      callout: {
        kind: 'tip',
        text: 'Unlike intern(), G1 String Deduplication preserves s1 != s2 object identity and never bloats StringTable.',
      },
      changes: ['+ G1GC compares byte[] hashes after GC', '+ Duplicate Strings share 1 backing byte[]'],
      metrics: { backing_array: 'Shared byte[]', pool_region: 'G1GC Dedup', concat_op: 'Background GC', heap_cost: 'Zero dup bytes' },
      scene: {
        entities: {
          s1: d(-12, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['String #1'], sub: 'JSON parse 1' }),
          s2: d(-12, -2, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['String #2'], sub: 'JSON parse 2' }),
          arr: b(4, -8, { r: 2.3, h: 50, color: 'green', label: ['1 Shared byte[]'], sub: 'G1 Dedup' }),
          card: S({ x: -12, y: 12 }, '6. G1GC Automatic String Deduplication', [
            '-XX:+UseG1GC -XX:+UseStringDeduplication',
            '// s1 != s2 (distinct String wrappers)',
            '// s1.value == s2.value (share 1 backing byte[]!)',
            '// Safe, automatic, zero StringTable contention',
          ], { icon: 'terminal' }),
        },
        links: {
          s1_ar: h('s1', 'arr', ['s1', 'arr'], { heads: 'end', label: 'points to' }),
          s2_ar: h('s2', 'arr', ['s2', 'arr'], { heads: 'end', label: 'dedup ptr' }),
        },
        flows: [{ route: ['s1_ar'], kind: 'res', rate: 1.8 }, { route: ['s2_ar'], kind: 'res', rate: 1.8 }],
      },
    },
  ],
};
