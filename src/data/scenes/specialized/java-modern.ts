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

export const javaModernLesson = {
  id: `java-modern`,
  title: `Modern Java: Records, Sealed Types & Pattern Matching`,
  summary: `Modern language features from Java 17 to 21: Records data carriers, Sealed class hierarchies, and Pattern Matching for switch expressions.`,
  minutes: 11,
  level: `intermediate`,
  metrics: ['feature_version', 'boilerplate_reduction', 'type_safety', 'switch_exhaustiveness', 'performance'],
  legend: ['req', 'res', ['ping', 'pattern match'], 'fail'],
  goals: [
    { text: 'Records immutable transparent data carriers', step: 0 },
    { text: 'Sealed classes & compile-time exhaustive hierarchies', step: 1 },
    { text: 'Pattern matching for instanceof & scope binding', step: 2 },
    { text: 'Pattern matching for switch (Java 21)', step: 3 },
    { text: 'Record patterns & nested deconstruction', step: 4 },
  ],
  steps: [
    {
      short: `Records`,
      chapter: `technique`,
      title: `Records: Immutable Transparent Data Carriers`,
      body: [
        `Writing standard Java DTOs required hundreds of lines of boilerplate: private final fields, constructor, getters, <code>equals()</code>, <code>hashCode()</code>, and <code>toString()</code>.`,
        `<strong>Records</strong> (<code>record Point(int x, int y) {}</code>) generate all of this at compile time. Record fields are shallowly immutable and support validation via <strong>Compact Constructors</strong>.`,
      ],
      callout: { kind: `insight`, text: 'Records cannot extend any other class because they implicitly extend java.lang.Record.' },
      metrics: { feature_version: 'Java 16 LTS', boilerplate_reduction: '90% Less Code', type_safety: 'Immutable', switch_exhaustiveness: 'Guaranteed', performance: 'Inline Registers' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Record Immutable Data Carrier', [
            '= public record Order(String id, BigDecimal amount, Instant createdAt) {',
            '  // Compact constructor for validation (zero boilerplate):',
            '= public Order {',
            '=   Objects.requireNonNull(id, "id must not be null");',
            '=   if (amount.signum() < 0) throw new IllegalArgumentException();',
            '= }',
            '} // Automatically generates final fields, equals, hashCode, toString',
          ]),
          syntax: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['record Point(x, y)'], sub: '1 Line Syntax' }),
          compiler: d(0, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'workflow', label: ['Record Compiler'], sub: 'Generates accessors' }),
          bytecode: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'shield', label: ['Immutable Tuple'], sub: 'equals / hash / fields' }),
        },
        links: {
          sc: h('syntax', 'compiler', ['syntax', 'compiler'], { heads: 'end' }),
          cb: h('compiler', 'bytecode', ['compiler', 'bytecode'], { heads: 'end', label: 'emits final fields' }),
        },
        flows: [
          { route: ['sc', 'cb'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Sealed Classes`,
      chapter: `technique`,
      title: `Sealed Classes & Exhaustive Hierarchies`,
      body: [
        `Historically, inheritance was either open to everyone or locked to nobody (<code>final</code>).`,
        `<strong>Sealed Classes</strong> (<code>sealed interface Shape permits Circle, Square</code>) allow authors to restrict which specific classes can implement or extend them. Every subtype must be <code>final</code>, <code>sealed</code>, or <code>non-sealed</code>.`,
      ],
      callout: { kind: `tip`, text: 'Sealed hierarchies give compilers mathematical exhaustiveness for switch expressions without needing a default branch.' },
      metrics: { feature_version: 'Java 17 LTS', boilerplate_reduction: 'Domain Modeling', type_safety: 'Closed Hierarchy', switch_exhaustiveness: '100% Exhaustive', performance: 'JIT Devirtualization' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Sealed Classes & Exhaustive Hierarchy', [
            '= public sealed interface Payment permits CreditCard, BankTransfer, Crypto {}',
            '= public final record CreditCard(String pan, String cvv) implements Payment {}',
            '= public final record BankTransfer(String iban) implements Payment {}',
            '= public final record Crypto(String wallet) implements Payment {}',
            '# Compiler verifies all subtypes; prevents unauthorized extensions',
          ]),
          sealed_root: d(-11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'shield', label: ['sealed Shape'], sub: 'permits Circle, Rect' }),
          permits: d(0, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'route', label: ['Permitted Types'], sub: 'Closed Enum-like' }),
          leaf_nodes: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'layers', label: ['final Circle / Rect'], sub: 'Exact Subclasses' }),
        },
        links: {
          sp: h('sealed_root', 'permits', ['sealed_root', 'permits'], { heads: 'end', label: 'permits rule' }),
          pl: h('permits', 'leaf_nodes', ['permits', 'leaf_nodes'], { heads: 'end', label: 'valid implementations' }),
        },
        flows: [
          { route: ['sp', 'pl'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `instanceof`,
      chapter: `technique`,
      title: `Pattern Matching for instanceof`,
      body: [
        `Old Java required repetitive boilerplate: checking <code>if (obj instanceof String)</code> followed by explicit casting <code>String s = (String) obj;</code>.`,
        `Pattern matching binds the variable immediately: <code>if (obj instanceof String s && s.length() > 5)</code>. The pattern variable <code>s</code> is scoped only to branches where the predicate evaluated to true.`,
      ],
      callout: { kind: `insight`, text: 'Flow scoping allows using pattern variables directly in conditional AND (&&) expressions.' },
      metrics: { feature_version: 'Java 16 LTS', boilerplate_reduction: 'Zero Casts', type_safety: 'Type Refined', switch_exhaustiveness: 'Flow Scoped', performance: 'Direct Check' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Pattern Matching for instanceof', [
            '// Before Java 16: verbose test followed by explicit cast',
            '// Modern Java: test and bind pattern variable in 1 step:',
            '= if (obj instanceof String s && s.length() > 5) {',
            '=   System.out.println(s.toUpperCase()); // s is in scope',
            '}',
            '# Eliminates ClassCastException risk and redundant casts',
          ]),
          input_obj: d(-11, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'box', label: ['Object obj'], sub: 'Untyped Ref' }),
          matcher: d(0, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'search', label: ['Type Pattern', 'String s'], sub: 'Pattern Matcher' }),
          typed_var: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'code', label: ['String s'], sub: 'Directly Usable' }),
        },
        links: {
          im: h('input_obj', 'matcher', ['input_obj', 'matcher'], { heads: 'end', label: 'type test' }),
          mt: h('matcher', 'typed_var', ['matcher', 'typed_var'], { heads: 'end', label: 'binds variable s' }),
        },
        flows: [
          { route: ['im', 'mt'], bounce: false, rate: 2.2 },
        ],
      },
    },
    {
      short: `Pattern Switch`,
      chapter: `technique`,
      title: `Pattern Matching for switch (Java 21)`,
      body: [
        `Java 21 brings full functional pattern matching to switch statements and expressions:`,
        `You can switch directly on object types with guarded conditions (<code>case Triangle t when t.area() > 100 -> ...</code>).`,
        `Null cases can be explicitly handled (<code>case null -> ...</code>), and combined with sealed classes, no <code>default:</code> branch is required.`,
      ],
      callout: { kind: `tip`, text: 'If someone adds a new subtype to a sealed interface, the compiler immediately flags all switch expressions as errors.' },
      metrics: { feature_version: 'Java 21 LTS', boilerplate_reduction: 'Functional Pattern', type_safety: 'Guarded Patterns', switch_exhaustiveness: 'Compiler Verified', performance: 'Jump Table' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Pattern Matching for switch (Java 21)', [
            '= String desc = switch (payment) {',
            '=   case CreditCard(var pan, var cvv) -> "Card: " + mask(pan);',
            '=   case BankTransfer(var iban)       -> "IBAN: " + iban;',
            '=   case Crypto(var wallet) when wallet.startsWith("0x") -> "ETH: " + wallet;',
            '=   case Crypto(var wallet)           -> "Crypto: " + wallet;',
            '= }; // No default branch needed: sealed hierarchy is exhaustive!',
          ]),
          switch_in: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'workflow', label: ['switch (shape)'], sub: 'Sealed Target' }),
          branches: d(0, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'route', label: ['case Circle c ->'], sub: 'Guarded when area > 0' }),
          result: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'shield', label: ['Exhaust.', 'Match'], sub: 'No default branch' }),
        },
        links: {
          sb: h('switch_in', 'branches', ['switch_in', 'branches'], { heads: 'end', label: 'type match' }),
          br: h('branches', 'result', ['branches', 'result'], { heads: 'end', label: 'evaluates arrow block' }),
        },
        flows: [
          { route: ['sb', 'br'], bounce: false, rate: 2.4 },
        ],
      },
    },
    {
      short: `Deconstruction`,
      chapter: `deep`,
      title: `Record Patterns & Deconstruction`,
      body: [
        `Record patterns allow <strong>deconstructing</strong> records directly inside instanceof and switch statements:`,
        `<code>if (shape instanceof Point(int x, int y)) { System.out.println(x + y); }</code> extracts components without manually calling getters.`,
        `Nested records (e.g. <code>Window(Point(x, y), Size(w, h))</code>) can be recursively decomposed in a single line.`,
      ],
      callout: { kind: `insight`, text: 'Record deconstruction aligns Java with modern functional languages (Scala, Rust, Haskell).' },
      metrics: { feature_version: 'Java 21 LTS', boilerplate_reduction: 'Recursive Deconstruct', type_safety: 'Strongly Typed', switch_exhaustiveness: 'Nested Matching', performance: 'Direct Field Read' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Record Nested Deconstruction', [
            'record Point(int x, int y) {}',
            'record Rectangle(Point topLeft, Point bottomRight) {}',
            '= if (shape instanceof Rectangle(Point(var x1, var y1), Point(var x2, var y2))) {',
            '=   int area = Math.abs(x2 - x1) * Math.abs(y2 - y1);',
            '=   System.out.println("Deconstructed area: " + area);',
            '= }',
          ]),
          record_obj: d(-11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'box', label: ['Point(x: 10, y: 20)'], sub: 'Compound Record' }),
          deconstructor: d(0, -4, { s: 3.8, h: 50, color: 'green', glyph: 'workflow', label: ['Record Pattern'], sub: 'Point(int x, int y)' }),
          primitives: d(11, -4, { s: 3.8, h: 50, color: 'teal', glyph: 'cpu', label: ['Extracted x & y'], sub: 'Direct Local Vars' }),
        },
        links: {
          rd: h('record_obj', 'deconstructor', ['record_obj', 'deconstructor'], { heads: 'end', label: 'deconstruct' }),
          dp: h('deconstructor', 'primitives', ['deconstructor', 'primitives'], { heads: 'end', label: 'binds x=10, y=20' }),
        },
        flows: [
          { route: ['rd', 'dp'], bounce: false, rate: 2.0 },
        ],
      },
    },
  ],
};
export default javaModernLesson;
