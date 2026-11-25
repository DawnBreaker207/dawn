/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaCoreApisLesson: Lesson = {
  id: 'java-core-apis',
  title: 'Modern Java & Core APIs',
  summary:
    'Master Java’s most-used daily APIs: Optional lazy vs eager traps, java.time Instant/ZonedDateTime/Clock, built-in HTTP/2 HttpClient, Java 21 SequencedCollection, and ScopedValue.',
  minutes: 12,
  level: 'beginner',
  metrics: ['api', 'safety', 'evaluation', 'java_version'],
  legend: ['flow', ['req', 'input / call'], ['res', 'safe output'], ['fail', 'eager trap / leak']],
  goals: [
    { text: 'Model null-absent values safely with Optional', step: 1 },
    { text: 'Avoid the orElse() eager evaluation trap with orElseGet()', step: 2 },
    { text: 'Separate Instant (UTC) vs LocalDateTime vs ZonedDateTime', step: 3 },
    { text: 'Test time deterministically with Clock & DateTimeFormatter', step: 4 },
    { text: 'Call HTTP/2 & Async APIs with built-in HttpClient', step: 5 },
    { text: 'Use Java 21 SequencedCollection & ScopedValue', step: 6 },
  ],
  steps: [
    {
      short: 'Optional',
      chapter: 'null-safety',
      title: '1. Optional<T> Null-Safety Pipeline',
      body: [
        '<code>Optional&lt;T&gt;</code> makes absence explicit in return types instead of returning raw <code>null</code> and risking <code>NullPointerException</code>.',
        'Chain <code>map()</code> and <code>flatMap()</code> declaratively. Never call <code>.get()</code> blindly, and avoid using <code>Optional</code> as entity fields or method parameters.',
      ],
      callout: {
        kind: 'insight',
        text: 'Use Optional.ofNullable(val) at boundaries; use Optional.of(val) only when null is a programming bug.',
      },
      metrics: { api: 'Optional<T>', safety: 'NPE-Free', evaluation: 'Declarative', java_version: 'Java 8+' },
      scene: {
        entities: {
          input: y(-14, -8, { label: 'Nullable User' }),
          opt: d(0, -8, { s: 4.6, h: 52, color: 'blue', glyph: 'shield', label: ['Optional.map'], sub: 'null-safe pipe' }),
          out: d(14, -8, { s: 4.4, h: 50, color: 'green', glyph: 'code', label: ['Email String'], sub: 'orElseThrow()' }),
          card: S({ x: -12, y: 12 }, '1. Declarative Optional Pipeline', [
            'String email = findUser(id)',
            '  .flatMap(User::getProfile)   // avoids Optional<Optional>',
            '  .map(Profile::email)',
            '  .map(String::toLowerCase)',
            '  .orElseThrow(() -> new NotFoundException(id));',
          ], { icon: 'terminal' }),
        },
        links: {
          in_opt: h('input', 'opt', ['input', 'opt'], { heads: 'end', label: 'ofNullable()' }),
          opt_out: h('opt', 'out', ['opt', 'out'], { heads: 'end', label: 'present' }),
        },
        flows: [{ route: ['in_opt', 'opt_out'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'orElse Trap',
      chapter: 'null-safety',
      title: '2. The orElse() Eager Trap vs orElseGet()',
      body: [
        'A classic production bug: <code>opt.orElse(createDefault())</code> evaluates <code>createDefault()</code> <strong>even when <code>opt</code> is present</strong> — triggering extra DB calls or allocations!',
        'Always pass a lambda to <code>orElseGet(() -> createDefault())</code> when the fallback involves computation or I/O so it runs lazily only on empty.',
      ],
      callout: {
        kind: 'warning',
        text: 'orElse(T) is eager; orElseGet(Supplier<T>) is lazy. Use orElse() ONLY for pre-existing constants.',
      },
      changes: ['+ Highlight eager DB call inside orElse()', '+ Switch to lazy Supplier in orElseGet()'],
      metrics: { api: 'orElseGet()', safety: 'Zero Waste', evaluation: 'Lazy Supplier', java_version: 'Java 8+' },
      scene: {
        entities: {
          present: d(-14, -8, { s: 4.4, h: 50, color: 'green', glyph: 'shield', label: ['Optional.of(hit)'], sub: 'value present' }),
          eager: d(2, -16, { s: 4.4, h: 50, color: 'red', glyph: 'alert', label: ['orElse(dbCall())'], sub: 'RUNS ANYWAY!' }),
          lazy: d(2, -2, { s: 4.4, h: 50, color: 'cyan', glyph: 'zap', label: ['orElseGet(fn)'], sub: 'skipped on hit' }),
          card: S({ x: -12, y: 12 }, '2. Eager orElse vs Lazy orElseGet', [
            '// BUG: createUserInDb() executes EVEN IF user exists!',
            'User u1 = repo.findById(id).orElse(createUserInDb());',
            '',
            '// FIX: Supplier lambda runs ONLY when Optional is empty',
            'User u2 = repo.findById(id).orElseGet(() -> createUserInDb());',
          ], { icon: 'terminal' }),
        },
        links: {
          hit_eager: h('present', 'eager', ['present', 'eager'], { heads: 'end', label: 'eager eval', style: 'dashed' }),
          hit_lazy: h('present', 'lazy', ['present', 'lazy'], { heads: 'end', label: 'skip lambda' }),
        },
        flows: [
          { route: ['hit_eager'], kind: 'fail', rate: 1.6 },
          { route: ['hit_lazy'], kind: 'res', rate: 1.6 },
        ],
      },
    },
    {
      short: 'java.time',
      chapter: 'time',
      title: '3. java.time: Instant vs Local vs ZonedDateTime',
      body: [
        'Legacy <code>java.util.Date</code> and <code>SimpleDateFormat</code> were mutable and not thread-safe. <code>java.time</code> provides immutable value types:',
        '• <code>Instant</code>: machine UTC epoch timestamp (use in DB & APIs).<br>• <code>LocalDateTime</code>: calendar date+time <em>without</em> timezone.<br>• <code>ZonedDateTime</code>: instant + IANA zone (e.g. <code>Asia/Ho_Chi_Minh</code>).',
      ],
      callout: {
        kind: 'tip',
        text: 'Store Instant (UTC) in databases and convert to ZonedDateTime only at the UI / formatting boundary.',
      },
      changes: ['+ Immutable Instant (UTC) + ZonedDateTime', '+ Replaces mutable Date / Calendar'],
      metrics: { api: 'java.time', safety: 'Immutable', evaluation: 'UTC First', java_version: 'Java 8+' },
      scene: {
        entities: {
          instant: b(-12, -8, { r: 2.2, h: 48, color: 'purple', label: ['Instant (UTC)'], sub: 'epoch nanos' }),
          zone: d(2, -8, { s: 4.4, h: 50, color: 'blue', glyph: 'globe', label: ['ZoneId'], sub: 'UTC+7 ZoneId' }),
          zdt: d(14, -8, { s: 4.4, h: 50, color: 'green', glyph: 'code', label: ['ZonedDateTime'], sub: '+07:00 DST ok' }),
          card: S({ x: -12, y: 12 }, '3. Instant -> ZonedDateTime', [
            'Instant now = Instant.now(); // always UTC',
            'ZonedDateTime vn = now.atZone(ZoneId.of("Asia/Ho_Chi_Minh"));',
            '// LocalDateTime has NO timezone — never use for timestamps!',
            'LocalDate birthday = LocalDate.of(1998, 5, 20);',
          ], { icon: 'terminal' }),
        },
        links: {
          ins_z: h('instant', 'zone', ['instant', 'zone'], { heads: 'end', label: 'atZone()' }),
          z_zdt: h('zone', 'zdt', ['zone', 'zdt'], { heads: 'end', label: 'toLocal' }),
        },
        flows: [{ route: ['ins_z', 'z_zdt'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Clock & Format',
      chapter: 'time',
      title: '4. Duration, DateTimeFormatter & Testable Clock',
      body: [
        'Use <code>Duration</code> for exact time (seconds/nanos) and <code>Period</code> for calendar units (years/months/days, accounting for leap years).',
        '<code>DateTimeFormatter</code> is 100% immutable and thread-safe (keep it as a <code>static final</code> constant). Inject <code>java.time.Clock</code> into services so unit tests never flake.',
      ],
      callout: {
        kind: 'insight',
        text: 'Injecting Clock.fixed(...) makes expiry and billing tests deterministic without Thread.sleep().',
      },
      changes: ['+ Static thread-safe DateTimeFormatter', '+ Clock.fixed() enables deterministic tests'],
      metrics: { api: 'Clock / Duration', safety: 'Thread-Safe', evaluation: 'Deterministic', java_version: 'Java 8+' },
      scene: {
        entities: {
          clock: d(-12, -8, { s: 4.4, h: 50, color: 'cyan', glyph: 'cpu', label: ['Clock (Injected)'], sub: 'UTC / fixed' }),
          service: d(2, -8, { s: 4.4, h: 50, color: 'blue', glyph: 'workflow', label: ['Billing Service'], sub: 'Duration diff' }),
          fmt: d(14, -8, { s: 4.4, h: 50, color: 'green', glyph: 'code', label: ['DateTimeFormatter'], sub: 'ISO_INSTANT' }),
          card: S({ x: -12, y: 12 }, '4. Testable Clock & Thread-Safe Formatter', [
            'private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_INSTANT;',
            '// Production: Clock.systemUTC() | Test: Clock.fixed(t0, UTC)',
            'Instant now = Instant.now(clock);',
            'boolean expired = Duration.between(createdAt, now).toMinutes() > 15;',
          ], { icon: 'terminal' }),
        },
        links: {
          clk_svc: h('clock', 'service', ['clock', 'service'], { heads: 'end', label: 'instant()' }),
          svc_fmt: h('service', 'fmt', ['service', 'fmt'], { heads: 'end', label: 'format()' }),
        },
        flows: [{ route: ['clk_svc', 'svc_fmt'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'HttpClient',
      chapter: 'network',
      title: '5. Built-in HTTP/2 & Async HttpClient (JDK 11+)',
      body: [
        'Since Java 11, <code>java.net.http.HttpClient</code> replaces clunky <code>HttpURLConnection</code> with native <strong>HTTP/2 multiplexing</strong>, TLS, and non-blocking <code>CompletableFuture</code>.',
        'Share one <code>HttpClient</code> singleton across your app (it manages its own connection pool and selector) and pair <code>send()</code> with Java 21 Virtual Threads.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always set connectTimeout() on HttpClient and timeout() on HttpRequest to prevent hung sockets.',
      },
      changes: ['+ Built-in HttpClient with HTTP/2 + timeouts', '+ Non-blocking sendAsync() returns CompletableFuture'],
      metrics: { api: 'HttpClient', safety: 'Timeouts Set', evaluation: 'HTTP/2 Async', java_version: 'Java 11–21' },
      scene: {
        entities: {
          client: d(-14, -8, { s: 4.6, h: 52, color: 'purple', glyph: 'globe', label: ['HttpClient (Pool)'], sub: 'HTTP/2 + TLS' }),
          req: d(0, -8, { s: 4.4, h: 50, color: 'blue', glyph: 'route', label: ['HttpRequest'], sub: 'timeout(5s)' }),
          api: d(15, -8, { s: 4.4, h: 50, color: 'green', glyph: 'server', label: ['Remote API'], sub: '200 OK JSON' }),
          card: S({ x: -12, y: 12 }, '5. Modern JDK HttpClient', [
            'HttpClient http = HttpClient.newBuilder()',
            '  .connectTimeout(Duration.ofSeconds(3)).build();',
            'HttpRequest req = HttpRequest.newBuilder(uri)',
            '  .timeout(Duration.ofSeconds(5)).GET().build();',
            'CompletableFuture<String> body = http',
            '  .sendAsync(req, BodyHandlers.ofString()).thenApply(HttpResponse::body);',
          ], { icon: 'terminal' }),
        },
        links: {
          cl_req: h('client', 'req', ['client', 'req'], { heads: 'end', label: 'multiplex' }),
          req_api: h('req', 'api', ['req', 'api'], { heads: 'end', label: 'sendAsync()' }),
        },
        flows: [{ route: ['cl_req', 'req_api'], kind: 'req', rate: 2.0 }],
      },
    },
    {
      short: 'Java 21 APIs',
      chapter: 'java21',
      title: '6. Java 21: SequencedCollection & ScopedValue',
      body: [
        '<strong>Sequenced Collections (JEP 431)</strong> unify first/last access across <code>List</code>, <code>Deque</code>, <code>LinkedHashSet</code>, and <code>LinkedHashMap</code> via <code>getFirst()</code>, <code>getLast()</code>, and zero-copy <code>reversed()</code>.',
        'Meanwhile, <strong>ScopedValue (JEP 446)</strong> replaces mutable <code>ThreadLocal</code> (which leaks in pools and is heavy to copy) with immutable, auto-cleaned context for Virtual Threads.',
      ],
      callout: {
        kind: 'insight',
        text: 'list.reversed() returns a live view without copying elements; ScopedValue.where(KEY, val).run(...) auto-unbinds.',
      },
      changes: ['+ SequencedCollection uniform getFirst/getLast/reversed', '+ ScopedValue replaces ThreadLocal for Loom'],
      metrics: { api: 'JEP 431 / 446', safety: 'Auto-Unbind', evaluation: 'Zero-Copy View', java_version: 'Java 21 LTS' },
      scene: {
        entities: {
          seq: d(-10, -8, { s: 4.6, h: 52, color: 'green', glyph: 'layers', label: ['SequencedCollection'], sub: 'reversed view' }),
          scoped: d(6, -8, { s: 4.6, h: 52, color: 'cyan', glyph: 'shield', label: ['ScopedValue<T>'], sub: 'Loom safe ctx' }),
          card: S({ x: -12, y: 12 }, '6. Java 21 SequencedCollection & ScopedValue', [
            '// JEP 431: Unified first/last & reverse view (no copy)',
            'var last = items.getLast();',
            'for (var item : items.reversed()) { ... }',
            '',
            '// JEP 446: Immutable context for Virtual Threads',
            'static final ScopedValue<User> CTX = ScopedValue.newInstance();',
            'ScopedValue.where(CTX, currentUser).run(() -> handleRequest());',
          ], { icon: 'terminal' }),
        },
        links: {
          seq_scoped: h('seq', 'scoped', ['seq', 'scoped'], { heads: 'end', label: 'JDK 21 core' }),
        },
        flows: [{ route: ['seq_scoped'], kind: 'res', rate: 1.8 }],
      },
    },
  ],
};
