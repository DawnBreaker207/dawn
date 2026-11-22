// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeBalancer as f,
  makeCrowd as p,
  makeGhost as m,
  makeLink as h,
  DEAD_STATE as g,
  makeHot as _,
  makeCool as v,
  makeDevice as y,
  makeDb as b,
  makeZone as x,
  makeQueue as ee,
  makePanel as S,
  makeUser as te,
  makeDns as ne,
  makeWebServer as re,
  makeDatabase as ie,
  URL_TAG as ae,
  LINK_TEMPLATES as C,
  CACHED_DNS_LINK as oe,
  TIMING_PANEL as se,
} from '@/lib/simulator/scene-builders';

export const javaStringPoolLesson = {
  id: `java-string-pool`,
  title: `Java String Constant Pool & Memory Optimization`,
  summary: `How the JVM optimizes string memory: String Constant Pool table, intern() deduplication, immutability, and Compact Strings.`,
  minutes: 11,
  level: `intermediate`,
  metrics: ['heap_strings', 'pooled_strings', 'cached_hashes', 'bytes_saved', 'intern_time'],
  legend: ['req', 'res', ['ping', 'hash lookup'], 'fail'],
  goals: [
    { text: `String literal resolution & the native StringTable`, step: 1 },
    { text: `String.intern(): Deduplicating dynamic heap strings`, step: 2 },
    { text: `Immutability guarantees & thread-safe hashCode caching`, step: 3 },
    { text: `Compact Strings (Java 9+): 1-byte Latin1 vs 2-byte UTF-16`, step: 4 },
    { text: `String concatenation: invokedynamic makeConcatWithConstants`, step: 5 },
  ],
  steps: [
    {
      short: `Literal Pool`,
      chapter: `technique`,
      title: `String Literals & the StringTable`,
      body: [
        `When the JVM loads class bytecode, string literals are placed into the native <strong>String Constant Pool</strong> (a fixed-bucket hashtable in native memory pointing to heap objects).`,
        `Identical string literals share the exact same object reference: <code>"code" == "code"</code> evaluates to true without allocating duplicate objects.`,
      ],
      callout: { kind: `insight`, text: `In Java 7+, the String Pool was moved out of PermGen into the main Java Heap to prevent PermGen OutOfMemoryErrors.` },
      metrics: { heap_strings: '2 refs', pooled_strings: '1 instance', cached_hashes: '1', bytes_saved: '48 B', intern_time: '0ns' },
      scene: {
        entities: {
          var_a: d(-11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'code', label: ['Variable a'], sub: '"code"' }),
          string_pool: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'archive', label: ['StringTable Pool'], sub: 'Single Instance' }),
          var_b: d(11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'code', label: ['Variable b'], sub: '"code"' }),
        },
        links: {
          ap: h('var_a', 'string_pool', ['var_a', 'string_pool'], { heads: 'end', label: 'points to shared' }),
          bp: h('var_b', 'string_pool', ['var_b', 'string_pool'], { heads: 'end', label: 'same ref (a == b)' }),
        },
        flows: [
          { route: ['ap', 'bp'], bounce: true, rate: 1.8 },
        ],
      },
    },
    {
      short: `intern()`,
      chapter: `technique`,
      title: `String.intern() & Heap Deduplication`,
      body: [
        `Calling <code>new String("code")</code> forces a new object on the heap, bypassing the pool. <code>s.intern()</code> checks the StringTable:`,
        `If the string exists in the pool, the pooled reference is returned and the duplicate heap object becomes garbage collected. If absent, it is added to the pool.`,
      ],
      callout: { kind: `tip`, text: `G1GC provides automatic background String Deduplication (-XX:+UseStringDeduplication) without calling intern() manually.` },
      metrics: { heap_strings: 'Reclaimed', pooled_strings: '1 Pooled', cached_hashes: '1', bytes_saved: '56 B', intern_time: '12ns' },
      scene: {
        entities: {
          heap_obj: d(-11, -4, { s: 3.8, h: 42, color: 'rose', glyph: 'box', label: ['new String()'], sub: 'Duplicate Heap' }),
          pool: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'archive', label: ['String Pool'], sub: 'intern() Target' }),
          canonical: d(11, -4, { s: 3.8, h: 42, color: 'green', glyph: 'shield', label: ['Canonical Ref'], sub: 'Unique Instance' }),
        },
        links: {
          hp: h('heap_obj', 'pool', ['heap_obj', 'pool'], { heads: 'end', label: 'intern() lookup' }),
          pc: h('pool', 'canonical', ['pool', 'canonical'], { heads: 'end', label: 'returns pooled ref' }),
        },
        flows: [
          { route: ['hp', 'pc'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Immutability`,
      chapter: `technique`,
      title: `Immutability & Cached hashCode`,
      body: [
        `Strings are immutable: the internal <code>byte[] value</code> is <code>private final</code> and cannot be modified after construction.`,
        `Because content never changes, <code>hashCode()</code> is lazily computed once and stored in the <code>int hash</code> field. Subsequent calls return the cached int instantly at zero CPU cost.`,
      ],
      callout: { kind: `insight`, text: `Immutability makes Strings safe for use as HashMap keys, across threads, and for security tokens.` },
      metrics: { heap_strings: 'Safe', pooled_strings: 'Thread-Safe', cached_hashes: '0x2f8a4 (cached)', bytes_saved: '100% CPU', intern_time: '0ns' },
      scene: {
        entities: {
          caller1: d(-11, -4, { s: 3.8, h: 42, color: 'teal', glyph: 'cpu', label: ['Thread 1'], sub: 'hashCode() call' }),
          str_inst: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'shield', label: ['Immutable String'], sub: 'hash: 0x2f8a4' }),
          caller2: d(11, -4, { s: 3.8, h: 42, color: 'teal', glyph: 'cpu', label: ['Thread 2'], sub: 'Reads cached hash' }),
        },
        links: {
          c1s: h('caller1', 'str_inst', ['caller1', 'str_inst'], { heads: 'both', label: 'first calc' }),
          c2s: h('caller2', 'str_inst', ['caller2', 'str_inst'], { heads: 'both', label: 'cached 0ns' }),
        },
        flows: [
          { route: ['c1s'], bounce: true, rate: 1.5 },
          { route: ['c2s'], bounce: true, rate: 2.5 },
        ],
      },
    },
    {
      short: `Compact`,
      chapter: `technique`,
      title: `Compact Strings (Java 9+): Latin1 vs UTF-16`,
      body: [
        `Historically, Java stored characters in <code>char[]</code> (2 bytes per character). Because most strings contain only ASCII/Latin-1 characters, the upper byte was always 0x00 (50% memory waste).`,
        `Java 9 introduced <strong>Compact Strings</strong>: a <code>byte[] value</code> paired with a <code>byte coder</code> flag:`,
        `• <code>coder = 0 (LATIN1)</code>: 1 byte per char.`,
        `• <code>coder = 1 (UTF16)</code>: 2 bytes per char (for Cyrillic, Chinese, Emoji).`,
      ],
      callout: { kind: `tip`, text: `Compact Strings reduced overall Java application heap footprints by 10% to 15% out of the box.` },
      metrics: { heap_strings: 'Compact', pooled_strings: '1-byte per char', cached_hashes: 'coder=0', bytes_saved: '50% Heap', intern_time: '0ns' },
      scene: {
        entities: {
          ascii_str: d(-11, -4, { s: 3.8, h: 42, color: 'green', glyph: 'file', label: ['Latin1 String'], sub: 'coder=0 (1B/char)' }),
          memory: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'server', label: ['Compact Storage'], sub: 'byte[] payload' }),
          cjk_str: d(11, -4, { s: 3.8, h: 42, color: 'orange', glyph: 'file', label: ['UTF-16 String'], sub: 'coder=1 (2B/char)' }),
        },
        links: {
          am: h('ascii_str', 'memory', ['ascii_str', 'memory'], { heads: 'end', label: '50% memory saved' }),
          cm: h('cjk_str', 'memory', ['cjk_str', 'memory'], { heads: 'end', label: 'fallback to 2B' }),
        },
        flows: [
          { route: ['am', 'cm'], bounce: true, rate: 1.8 },
        ],
      },
    },
    {
      short: `Concat`,
      chapter: `deep`,
      title: `String Concat: invokedynamic vs StringBuilder`,
      body: [
        `In Java 8, <code>a + b</code> compiled to <code>new StringBuilder().append(a).append(b).toString()</code>, creating temporary objects.`,
        `Java 9+ replaces string concatenation bytecode with <code>invokedynamic</code> calling <code>StringConcatFactory.makeConcatWithConstants</code>. The JVM generates optimal byte-copying code at runtime tailored to the architecture.`,
      ],
      callout: { kind: `insight`, text: 'In loops, you must still use an explicit StringBuilder to avoid re-allocating inside each iteration.' },
      metrics: { heap_strings: 'Zero Temp', pooled_strings: 'Optimized', cached_hashes: 'Direct copy', bytes_saved: 'Zero Alloc', intern_time: 'JIT Inline' },
      scene: {
        entities: {
          src: d(-11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'code', label: ['a + b + c'], sub: 'Bytecode' }),
          factory: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'workflow', label: ['StringConcatFactory'], sub: 'invokedynamic' }),
          result: d(11, -4, { s: 3.8, h: 42, color: 'green', glyph: 'shield', label: ['Single byte[]'], sub: 'Direct Allocation' }),
        },
        links: {
          sf: h('src', 'factory', ['src', 'factory'], { heads: 'end', label: 'BSM recipe' }),
          fr: h('factory', 'result', ['factory', 'result'], { heads: 'end', label: 'precise length alloc' }),
        },
        flows: [
          { route: ['sf', 'fr'], bounce: false, rate: 2.2 },
        ],
      },
    },
  ],
};
export default javaStringPoolLesson;
