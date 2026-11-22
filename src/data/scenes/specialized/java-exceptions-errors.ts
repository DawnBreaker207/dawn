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

export const javaExceptionsErrorsLesson = {
  id: `java-exceptions-errors`,
  title: `Java Exceptions, Errors & Stack Unwinding`,
  summary: `Throwable hierarchy, the heavy cost of fillInStackTrace(), Try-with-resources suppressed exceptions, and fatal JVM Errors (OOM).`,
  minutes: 10,
  level: `intermediate`,
  metrics: ['throwable_type', 'stack_depth', 'stacktrace_cost', 'suppressed_count', 'jvm_action'],
  legend: ['req', 'res', ['ping', 'stack unwind'], 'fail'],
  goals: [
    { text: `Throwable hierarchy: Checked vs Unchecked (RuntimeException) vs Error`, step: 1 },
    { text: `Cost of fillInStackTrace(): Why exceptions should never control flow`, step: 2 },
    { text: `Try-with-Resources & Suppressed Exceptions: AutoCloseable mechanics`, step: 3 },
    { text: `Fatal JVM Errors: OutOfMemoryError (Heap vs Metaspace) & StackOverflowError`, step: 4 },
    { text: `Exception handling best practices: Root cause preservation`, step: 5 },
  ],
  steps: [
    {
      short: `Hierarchy`,
      chapter: `technique`,
      title: `The Throwable Class Hierarchy`,
      body: [
        `Everything throwable inherits from <code>java.lang.Throwable</code>:`,
        `• <strong>Error</strong>: Fatal system issues (OutOfMemoryError, StackOverflowError) that applications should NOT try to catch.`,
        `• <strong>Exception (Checked)</strong>: Recoverable conditions (IOException, SQLException) enforced by the compiler.`,
        `• <strong>RuntimeException (Unchecked)</strong>: Programming bugs (NullPointerException, IllegalArgumentException).`,
      ],
      callout: { kind: `insight`, text: 'Modern frameworks (Spring) wrap checked exceptions in unchecked RuntimeExceptions to avoid boilerplate throws clauses.' },
      metrics: { throwable_type: 'RuntimeException', stack_depth: '14 frames', stacktrace_cost: 'Medium', suppressed_count: '0', jvm_action: 'Catch or Crash' },
      scene: {
        entities: {
          error: d(-11, -4, { s: 3.8, h: 42, color: 'red', glyph: 'alertTriangle', label: ['Fatal Error'], sub: 'JVM Hardware/Memory' }),
          throwable: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'shield', label: ['Throwable'], sub: 'Root Base Class' }),
          unchecked: d(11, -4, { s: 3.8, h: 42, color: 'orange', glyph: 'code', label: ['RuntimeException'], sub: 'Unchecked' }),
        },
        links: {
          et: h('error', 'throwable', ['error', 'throwable'], { heads: 'none' }),
          ut: h('unchecked', 'throwable', ['unchecked', 'throwable'], { heads: 'none' }),
        },
        flows: [
          { route: ['et', 'ut'], bounce: true, rate: 1.5 },
        ],
      },
    },
    {
      short: `fillInStackTrace`,
      chapter: `technique`,
      title: `The Cost of fillInStackTrace()`,
      body: [
        `Creating an exception in Java is slow NOT because of <code>throw</code>, but because the constructor invokes the native method <code>fillInStackTrace()</code>.`,
        `The JVM walks the entire active thread call stack, capturing class names, method names, file names, and line numbers. Creating 10,000 exceptions per second degrades CPU throughput by 95%.`,
      ],
      callout: { kind: `warn`, text: 'Never use exceptions for business logic or flow control (e.g. UserNotFoundException instead of Optional<User>).' },
      metrics: { throwable_type: 'fillInStackTrace()', stack_depth: '64 stack frames', stacktrace_cost: '35,000 ns (Slow)', suppressed_count: '0', jvm_action: 'Native Stack Walk' },
      scene: {
        entities: {
          throw_point: d(-11, -4, { s: 3.8, h: 42, color: 'rose', glyph: 'alertTriangle', label: ['throw new Ex()'], sub: 'Constructor' }),
          stack_walker: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'cpu', label: ['fillInStackTrace()'], sub: 'Native C++ Walk' }),
          thread_stack: d(11, -4, { s: 3.8, h: 42, color: 'teal', glyph: 'server', label: ['64 Stack Frames'], sub: 'Captured for log' }),
        },
        links: {
          ts: h('throw_point', 'stack_walker', ['throw_point', 'stack_walker'], { heads: 'end', label: 'native call' }),
          st: h('stack_walker', 'thread_stack', ['stack_walker', 'thread_stack'], { heads: 'both', label: 'walks every frame' }),
        },
        flows: [
          { route: ['ts', 'st'], bounce: true, rate: 2.0 },
        ],
      },
    },
    {
      short: `Suppressed`,
      chapter: `technique`,
      title: `Try-with-Resources & Suppressed Exceptions`,
      body: [
        `In old Java, if an exception occurred in the <code>try</code> block AND another exception occurred in the <code>finally</code> block during <code>close()</code>, the second exception swallowed the first!`,
        `<strong>Try-with-Resources</strong> ensures the original primary exception is preserved, while exceptions thrown during auto-closing are attached as <strong>Suppressed Exceptions</strong> (accessible via <code>e.getSuppressed()</code>).`,
      ],
      callout: { kind: `tip`, text: 'Any resource implementing java.lang.AutoCloseable can be managed by Try-with-Resources.' },
      metrics: { throwable_type: 'Primary Exception', stack_depth: 'Preserved', stacktrace_cost: 'Auto-closed', suppressed_count: '1 Suppressed', jvm_action: 'Resource Closed' },
      scene: {
        entities: {
          try_block: d(-11, -4, { s: 3.8, h: 42, color: 'red', glyph: 'alertTriangle', label: ['Primary Error'], sub: 'SQL Execution Failed' }),
          twr_spine: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'shield', label: ['Try-with-Resources'], sub: 'AutoCloseable' }),
          suppressed: d(11, -4, { s: 3.8, h: 42, color: 'yellow', glyph: 'archive', label: ['Suppressed Close()'], sub: 'Connection Error' }),
        },
        links: {
          tt: h('try_block', 'twr_spine', ['try_block', 'twr_spine'], { heads: 'end', label: 'thrown first' }),
          twr_suppressed: h('twr_spine', 'suppressed', ['twr_spine', 'suppressed'], { heads: 'end', label: 'attached as suppressed' }),
        },
        flows: [
          { route: ['tt', 'twr_suppressed'], bounce: false, rate: 1.8 },
        ],
      },
    },
    {
      short: `Fatal Errors`,
      chapter: `technique`,
      title: `Fatal JVM Errors: OOM & StackOverflow`,
      body: [
        `<code>java.lang.Error</code> indicates fatal conditions where the JVM process cannot reliably continue:`,
        `• <strong>OutOfMemoryError: Java heap space</strong>: GC cannot free enough memory for allocation.`,
        `• <strong>OutOfMemoryError: Metaspace</strong>: Classloader leak continually loading dynamic classes.`,
        `• <strong>StackOverflowError</strong>: Infinite recursion exhausts the thread's physical stack memory (default 1MB).`,
      ],
      callout: { kind: `warn`, text: '-XX:+ExitOnOutOfMemoryError or -XX:+CrashOnOutOfMemoryError ensures containers restart immediately when OOM strikes.' },
      metrics: { throwable_type: 'OutOfMemoryError', stack_depth: 'Exhausted', stacktrace_cost: 'Fatal', suppressed_count: '0', jvm_action: 'Container Kill' },
      scene: {
        entities: {
          heap_full: d(-11, -4, { s: 3.8, h: 42, color: 'red', glyph: 'alertTriangle', label: ['Heap Exhausted'], sub: 'GC Overhead Limit' }),
          jvm_core: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'cpu', label: ['HotSpot JVM'], sub: 'Fatal State' }),
          container: d(11, -4, { s: 3.8, h: 42, color: 'orange', glyph: 'server', label: ['K8s Pod Restart'], sub: 'OOMKilled (Exit 137)' }),
        },
        links: {
          hj: h('heap_full', 'jvm_core', ['heap_full', 'jvm_core'], { heads: 'end', label: 'allocation failure' }),
          jc: h('jvm_core', 'container', ['jvm_core', 'container'], { heads: 'end', label: 'SIGKILL container' }),
        },
        flows: [
          { route: ['hj', 'jc'], bounce: false, rate: 1.5 },
        ],
      },
    },
    {
      short: `Root Cause`,
      chapter: `deep`,
      title: `Root Cause Preservation & Chaining`,
      body: [
        `When wrapping low-level exceptions into domain exceptions, always pass the original cause: <code>throw new OrderProcessingException("Failed", cause)</code>.`,
        `Never swallow exceptions with an empty <code>catch(Exception e) {}</code> block, and never log AND rethrow (which creates duplicate noisy logs).`,
      ],
      callout: { kind: `insight`, text: 'Exception chaining preserves the root cause, enabling engineers to debug issues in production in minutes.' },
      metrics: { throwable_type: 'DomainException', stack_depth: 'Clean Chain', stacktrace_cost: 'Root Cause Kept', suppressed_count: '0', jvm_action: 'Clean Logging' },
      scene: {
        entities: {
          root: d(-11, -4, { s: 3.8, h: 42, color: 'teal', glyph: 'database', label: ['SQLException'], sub: 'Timeout 500ms' }),
          wrapper: d(0, -4, { s: 3.8, h: 42, color: 'green', glyph: 'shield', label: ['OrderException'], sub: 'cause = SQLException' }),
          handler: d(11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'workflow', label: ['@ExceptionHandler'], sub: 'HTTP 504 Gateway' }),
        },
        links: {
          rw: h('root', 'wrapper', ['root', 'wrapper'], { heads: 'end', label: 'chained via cause' }),
          wh: h('wrapper', 'handler', ['wrapper', 'handler'], { heads: 'end', label: 'mapped to response' }),
        },
        flows: [
          { route: ['rw', 'wh'], bounce: false, rate: 2.0 },
        ],
      },
    },
  ],
};
export default javaExceptionsErrorsLesson;
