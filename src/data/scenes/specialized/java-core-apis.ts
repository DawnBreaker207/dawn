import { STAGE, makeDb, makeLink, makePanel, distinctConcepts, type Tag, stageBlock, cardAt, linkOf } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage for the whole lesson: your code on the left, the API under discussion in the
// middle (same id, new label each act), the value it wraps on the right, and a
// collaborator (an expensive call, a time zone, a clock, a server) joining from the top.
//
//                  collaborator      alt
//   your code ──── api ───────────── value

type Opts = Record<string, unknown>;

const positions = {
  caller: STAGE.caller,
  api: STAGE.main,
  value: STAGE.store,
  mach: STAGE.helper,
  alt: STAGE.alt,
};

const block = stageBlock;
const caller = (tags: Tag[] = []) => block(positions.caller, { color: `blue`, glyph: `code`, label: [`your code`], sub: `caller`, tags });
const api = (label: string[], sub: string, tags: Tag[] = [], glyph = `box`) =>
  block(positions.api, { color: `green`, glyph, label, sub, tags });
const value = (label: string, tags: Tag[] = []) =>
  makeDb(positions.value.x, positions.value.y, { r: 2.2, h: 46, glyph: `database`, label, tags });
const mach = (label: string[], sub: string, glyph: string, tags: Tag[] = []) =>
  block(positions.mach, { color: `orange`, glyph, label, sub, tags });
const alt = (label: string[], sub: string, tags: Tag[] = []) =>
  block(positions.alt, { color: `slab`, glyph: `route`, label, sub, tags });

const links = {
  call: (label?: string) => linkOf(`caller`, `api`, label),
  back: (label?: string) => linkOf(`api`, `value`, label),
  mach: (label?: string) => ({ ...linkOf(`mach`, `api`, label, false), labelAt: 0.6 }),
  alt: makeLink(`caller`, `alt`, [`caller`, `alt`], { heads: `both`, style: `off` }),
};

/** Code card, parked bottom-left under the caller where nothing else lives. */
const card = cardAt({ x: positions.api.x, y: positions.api.y, dx: -250, dy: 150 }, `code`);

export const javaCoreApisLesson: Lesson = distinctConcepts({
  id: 'java-core-apis',
  title: 'Modern Java & Core APIs',
  summary:
    'The APIs you use every day, and what they really do: Optional and its eager trap, java.time, a testable Clock, the built-in HttpClient, and Java 21’s sequenced collections.',
  minutes: 12,
  level: 'beginner',
  metrics: ['api', 'behavior', 'cost', 'since'],
  legend: [[`req`, `call`], [`res`, `result`], [`fail`, `trap`]],
  goals: [
    { text: 'Model absent values safely with Optional', step: 1 },
    { text: 'Avoid the orElse() eager-evaluation trap', step: 2 },
    { text: 'Separate Instant, LocalDateTime and ZonedDateTime', step: 3 },
    { text: 'Test time deterministically with Clock', step: 4 },
    { text: 'Call HTTP/2 and async APIs with HttpClient', step: 5 },
    { text: 'Use Java 21 SequencedCollection and ScopedValue', step: 6 },
  ],
  steps: [
    {
      short: 'Optional',
      chapter: 'setup',
      title: 'Optional makes absence part of the type',
      body: [
        `A method that may find nothing should say so in its return type. <code>Optional&lt;User&gt;</code> is a small box that holds either a value or nothing — callers can’t forget to check.`,
        `Chain <code>map()</code> and <code>flatMap()</code> instead of <code>if (x != null)</code>. Don’t call <code>.get()</code> blindly, and don’t use Optional for fields or method parameters.`,
      ],
      callout: { kind: 'tip', text: `Use Optional.ofNullable(v) at the boundary with null-returning code; Optional.of(v) only when null would be a bug.` },
      metrics: { api: 'Optional', behavior: 'no null', cost: '16 B', since: 'Java 8' },
      scene: {
        entities: {
          caller: caller(),
          api: api([`Optional`], `User or empty`, [{ text: `present`, tone: `green` }]),
          value: value(`User #7`),
          card: card(`A null-free lookup`, [`Optional<User> u = repo.find(7);`, `String name = u.map(User::name).orElse("guest");`, `= no null returned, no NullPointerException`]),
        },
        links: { call: links.call(`find(7)`), back: links.back(`wraps`) },
        flows: [{ route: ['call'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'orElse trap',
      chapter: 'problem',
      title: 'orElse() always runs its argument',
      body: [
        `Java evaluates arguments <em>before</em> the call. <code>opt.orElse(load())</code> therefore runs <code>load()</code> even when the Optional already holds a value — and throws the result away.`,
        `<code>orElseGet(() -&gt; load())</code> takes a <b>supplier</b>, so <code>load()</code> runs only when the Optional is empty. Use it whenever the fallback costs something.`,
      ],
      changes: [`+ load() (200 ms DB call)`, `+ orElseGet alt`],
      metrics: { api: 'orElse', behavior: 'eager', cost: '200 ms', since: 'Java 8' },
      scene: {
        entities: {
          caller: caller(),
          api: api([`orElse(…)`], `value present`, [{ text: `argument ran`, tone: `red`, icon: `alert` }]),
          value: value(`User #7`),
          mach: mach([`load()`], `200 ms query`, `zap`, [{ text: `wasted`, tone: `red` }]),
          alt: alt([`orElseGet`], `lazy supplier`, [{ text: `skipped`, tone: `green` }]),
          card: card(`Eager vs lazy`, [`u.orElse(load());                 // load() ALWAYS runs`, `= u.orElseGet(() -> load());       // only when empty`]),
        },
        links: { call: links.call(`orElse`), back: links.back(), mach: links.mach(`runs anyway`) },
        flows: [{ route: ['mach'], kind: 'fail', rate: 1 }],
      },
    },
    {
      short: 'java.time',
      chapter: 'technique',
      title: 'Instant, LocalDateTime and ZonedDateTime',
      body: [
        `<span class="term">Instant</span> is one moment on the UTC timeline — what you store and compare. <span class="term">ZonedDateTime</span> is that moment seen on a wall clock in a specific <code>ZoneId</code>, with daylight-saving rules.`,
        `<span class="term">LocalDateTime</span> has no zone at all: “2026-03-08 02:30” may not exist or may exist twice. Use it for things like a birthday, never for a point in time.`,
      ],
      changes: [`~ API: Instant`, `+ ZoneId`, `+ LocalDateTime alt`],
      metrics: { api: 'Instant', behavior: 'UTC', cost: '12 B', since: 'Java 8' },
      scene: {
        entities: {
          caller: caller(),
          api: api([`Instant`], `UTC moment`, [{ text: `no zone`, tone: `violet` }], `clock`),
          value: value(`epoch ms`),
          mach: mach([`ZoneId`], `Asia/Ho_Chi_Minh`, `globe`, [{ text: `+07:00`, tone: `green` }]),
          alt: alt([`LocalDateTime`], `no zone`, [{ text: `ambiguous`, tone: `red`, icon: `alert` }]),
          card: card(`Same moment, three views`, [`Instant t = Instant.now();                  // UTC`, `var z = t.atZone(ZoneId.of("Asia/Ho_Chi_Minh"));`, `! LocalDateTime.now()  // which zone? nobody knows`]),
        },
        links: { call: links.call(`now()`), back: links.back(`stores`), mach: links.mach(`atZone`) },
        flows: [{ route: ['call'], rate: 1.2, bounce: true }, { route: ['mach'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'Clock',
      chapter: 'solution',
      title: 'Inject a Clock so time can be tested',
      body: [
        `<code>Instant.now()</code> reads the system clock, so tests that depend on it break at midnight or on a slow CI box. Pass a <code>Clock</code> into your class and call <code>Instant.now(clock)</code> instead.`,
        `In production use <code>Clock.systemUTC()</code>; in a test use <code>Clock.fixed(...)</code>. <code>Duration</code> and <code>DateTimeFormatter</code> are immutable and thread-safe, unlike the old <code>SimpleDateFormat</code>.`,
      ],
      changes: [`~ collaborator: Clock`, `+ fixed clock in tests`],
      metrics: { api: 'Clock', behavior: 'injectable', cost: '0 B', since: 'Java 8' },
      scene: {
        entities: {
          caller: caller(),
          api: api([`Instant.now`], `(clock)`, [{ text: `deterministic`, tone: `green`, icon: `shield` }], `clock`),
          value: value(`2026-01-01`),
          mach: mach([`Clock`], `fixed in tests`, `timer`, [{ text: `Clock.fixed`, tone: `violet` }]),
          card: card(`A testable class`, [`class Invoice { Invoice(Clock clock) { ... } }`, `var c = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), UTC);`, `= Instant.now(c)   // always 2026-01-01T00:00Z`]),
        },
        links: { call: links.call(`now(clock)`), back: links.back(), mach: links.mach(`reads`) },
        flows: [{ route: ['mach'], kind: 'write', rate: 1.2 }, { route: ['call'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'HttpClient',
      chapter: 'technique',
      title: 'HttpClient: HTTP/2 and async, built in',
      body: [
        `Since Java 11 the JDK ships a modern <code>HttpClient</code>: HTTP/2 by default (falls back to 1.1), connection reuse, redirects and timeouts — no Apache or OkHttp dependency needed.`,
        `<code>send()</code> blocks the thread; <code>sendAsync()</code> returns a <code>CompletableFuture</code> so the caller keeps working. Build the client once and share it.`,
      ],
      changes: [`~ API: HttpClient`, `~ collaborator: server`, `+ response`],
      metrics: { api: 'HttpClient', behavior: 'HTTP/2', cost: '1 conn', since: 'Java 11' },
      scene: {
        entities: {
          caller: caller([{ text: `not blocked`, tone: `green` }]),
          api: api([`HttpClient`], `HTTP/2 · async`, [{ text: `reuses conn`, tone: `violet`, icon: `refresh` }], `network`),
          value: value(`response body`, [{ text: `200 OK`, tone: `green` }]),
          mach: mach([`server`], `api.example.com`, `server`, [{ text: `h2`, tone: `gray` }]),
          card: card(`Async request`, [`var client = HttpClient.newHttpClient();`, `var req = HttpRequest.newBuilder(URI.create(url)).build();`, `client.sendAsync(req, BodyHandlers.ofString())`, `      .thenApply(HttpResponse::body);`]),
        },
        links: { call: links.call(`sendAsync`), back: links.back(`future`), req: linkOf(`api`, `mach`, `GET /orders`) },
        flows: [{ route: ['req'], rate: 1.3, bounce: true }, { route: ['call'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Java 21',
      chapter: 'recap',
      title: 'Java 21: sequenced collections and ScopedValue',
      body: [
        `<span class="term">SequencedCollection</span> finally gives every ordered collection (List, Deque, LinkedHashSet, LinkedHashMap, SortedSet) the same <code>getFirst()</code>, <code>getLast()</code> and <code>reversed()</code> — no more <code>list.get(list.size() - 1)</code>.`,
        `<span class="term">ScopedValue</span> (preview) shares read-only data with everything a task calls, without <code>ThreadLocal</code>’s leaks — a good fit for virtual threads.`,
      ],
      changes: [`~ API: SequencedCollection`, `+ ScopedValue`],
      metrics: { api: 'Sequenced', behavior: 'ordered', cost: 'O(1)', since: 'Java 21' },
      scene: {
        entities: {
          caller: caller(),
          api: api([`Sequenced`, `Collection`], `getFirst/Last`, [{ text: `reversed()`, tone: `violet` }], `listChecks`),
          value: value(`LinkedHashSet`, [{ text: `insertion order`, tone: `green` }]),
          alt: alt([`ScopedValue`], `preview`, [{ text: `no leaks`, tone: `green` }]),
          card: card(`Java 21`, [`var last = list.getLast();   // was list.get(list.size()-1)`, `for (var x : list.reversed()) { ... }`, `= ScopedValue.where(USER, u).run(() -> handle());`]),
        },
        links: { call: links.call(`getLast()`), back: links.back() },
        flows: [{ route: ['call'], rate: 1.4, bounce: true }],
      },
    },
  ],
});
