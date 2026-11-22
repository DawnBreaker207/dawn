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

const er = {
    en: `en-US`,
    es: `es-ES`,
    pt: `pt-BR`,
    fr: `fr-FR`,
    it: `it-IT`,
    de: `de-DE`,
    nl: `nl-NL`,
    pl: `pl-PL`,
    tr: `tr-TR`,
    id: `id-ID`,
    vi: `vi-VN`,
    el: `el-GR`,
    uk: `uk-UA`,
    ru: `ru-RU`,
    "zh-Hans": `zh-CN`,
    "zh-Hant": `zh-TW`,
    ja: `ja-JP`,
    ko: `ko-KR`,
    hi: `hi-IN`,
    ar: `ar-u-nu-latn`,
    he: `he-IL`,
  };

const tr = new Set([`ar`, `he`]);

const nr = `en`;

const rr = {};

const ir = new Map();

const ar = () => nr;

const or = () => er[nr] || nr;

const sr = (e) => rr[e];

const cr = (e = nr) => tr.has(e);

const lr = (e) => e.toLocaleUpperCase(or().split(`-u-`)[0]);

const ur = /[\p{Script=Arabic}\p{Script=Hebrew}]/u;

const dr = /(?=([A-Za-z][A-Za-z0-9]*(?:[/.\-_:'’][A-Za-z0-9]+)*))\1(?=[ \u00a0]*[^\s\p{L}<}\u200f])/gu;

const fr = (e) =>
    typeof e == `string` && ur.test(e)
      ? e
          .split(/(<code[^>]*>[\s\S]*?<\/code>|<[^>]*>|\u2066[^\u2069]*\u2069)/)
          .map((e, t) => (t % 2 ? e : e.replace(dr, `$1‏`)))
          .join(``)
      : e;

const pr = (e) => Object.fromEntries(Object.entries(e).map(([e, t]) => [e, fr(t)]));

export const javaConcurrencyLesson = {
  id: `java-concurrency`,
  title: `Java Concurrency & JVM Threading`,
  summary: `Visualize threads competing for monitors, thread pool scheduling, async pipelines, and virtual threads.`,
  minutes: 10,
  level: `intermediate`,
  metrics: [`threads`, `queue`, `locks`, `mode`],
  goals: [
    { text: 'Understand thread lifecycle and', step: 1 },
    { text: 'Size thread pools for CPU-bound', step: 2 },
    { text: 'Compose async pipelines with CompletableFuture', step: 3 },
    { text: 'Scale to millions of tasks', step: 4 },
  ],
  steps: [
    {
      short: `Monitors`,
      chapter: `technique`,
      title: `Threads & Monitor Locks`,
      body: [
        `Every Java object has a monitor. Only one thread can hold a monitor at a time — others BLOCK.`,
        `<code>synchronized(obj)</code> acquires the monitor; the JVM stores the owner thread ID in the object header lock word:`,
        `<code>Object lock = new Object();<br>synchronized(lock) {<br>  // Critical section (monitorenter)<br>  sharedState.update();<br>} // releases lock (monitorexit)</code>`,
      ],
      callout: { kind: `tip`, text: `JVM optimises uncontested locks with biased locking and thin locks before escalating to OS mutex (inflated lock).` },
      metrics: { threads: `3 competing`, queue: `blocked`, locks: `1 monitor`, mode: `synchronized` },
      scene: {
        entities: {
          t1:   d(-8, -4,  { color: `green`,  glyph: `cpu`,  label: [`Thread-1`, `RUNNABLE`], cpu: 0.9 }),
          t2:   d(-8, 4,   { color: `yellow`, glyph: `cpu`,  label: [`Thread-2`, `BLOCKED`] }),
          t3:   d(-8, 12,  { color: `yellow`, glyph: `cpu`,  label: [`Thread-3`, `BLOCKED`] }),
          lock: d(4,  4,   { color: `orange`, glyph: `lock`, label: [`Monitor`, `owner: T-1`] }),
          obj:  b(14, 4,   { label: [`Shared`, `Resource`] }),
          card: S({ x: -2, y: 16 }, 'Java Monitor & Lock Stack', [
            'Object Header: Lock word in Mark Word (biased/thin/fat)',
            'Bytecode:      monitorenter ... monitorexit',
            'Owner:         Thread-1 (RUNNABLE, updating shared state)',
            'EntrySet:      Thread-2 & Thread-3 parked in BLOCKED state',
          ], { icon: 'lock' }),
        },
        links: {
          t1l: h(`t1`,   `lock`, [`t1`,   `lock`], { label: `holds`,   heads: `end` }),
          t2l: h(`t2`,   `lock`, [`t2`,   `lock`], { label: `waiting`, heads: `end`, style: `dashed` }),
          t3l: h(`t3`,   `lock`, [`t3`,   `lock`], { label: `waiting`, heads: `end`, style: `dashed` }),
          lo:  h(`lock`, `obj`,  [`lock`, `obj`],  { label: `access`,  heads: `end` }),
        },
        flows: [{ route: [`t1l`, `lo`], bounce: false, rate: 1.2 }],
      },
    },
    {
      short: `Thread Pools`,
      chapter: `technique`,
      title: `Executor & ThreadPoolExecutor`,
      body: [
        `ThreadPoolExecutor manages a fixed pool of worker threads and a BlockingQueue for submitted tasks.`,
        `<code>// Bounded queue prevents OutOfMemoryError under load:<br>ExecutorService pool = new ThreadPoolExecutor(<br>  4, 8, 60L, TimeUnit.SECONDS,<br>  new ArrayBlockingQueue<>(100),<br>  new ThreadPoolExecutor.CallerRunsPolicy()<br>);</code>`,
      ],
      callout: { kind: `tip`, text: `Unbounded queues (LinkedBlockingQueue default) can cause memory exhaustion under load. Always set a bounded queue with RejectedExecutionHandler.` },
      metrics: { threads: `4 workers`, queue: `LinkedBQ`, locks: `—`, mode: `ExecutorService` },
      scene: {
        entities: {
          submit: y(-10, 2,  { label: `callers`, tags: [{ text: `submit(task)`, icon: `play` }] }),
          queue:  d(0,   2,  { color: `purple`, glyph: `container`, label: [`Task Queue`, `BlockingQueue`] }),
          w1:     d(10, -10, { color: `blue`,   glyph: `cpu`,       label: [`Worker-1`], cpu: 1 }),
          w2:     d(10, -2,  { color: `blue`,   glyph: `cpu`,       label: [`Worker-2`], cpu: 0.7 }),
          w3:     d(10,  6,  { color: `blue`,   glyph: `cpu`,       label: [`Worker-3`], cpu: 0.3 }),
          w4:     d(10,  14, { color: `blue`,   glyph: `cpu`,       label: [`Worker-4`], cpu: 0 }),
          card: S({ x: -4, y: 14 }, 'ThreadPoolExecutor Sizing Matrix', [
            'CPU-bound tasks: Pool = Runtime.getRuntime().availableProcessors()',
            'IO-bound tasks:  Pool = Cores * (1 + Wait_Time / Compute_Time)',
            'Queue Strategy:  ArrayBlockingQueue(100) + CallerRunsPolicy',
            'Worker Pool:     4 active OS threads polling work queue',
          ], { icon: 'cpu' }),
        },
        links: {
          sq: h(`submit`, `queue`, [`submit`, `queue`], { label: `enqueue`, heads: `end` }),
          q1: h(`queue`,  `w1`,    [`queue`, `w1`],    { heads: `end` }),
          q2: h(`queue`,  `w2`,    [`queue`, `w2`],    { heads: `end` }),
          q3: h(`queue`,  `w3`,    [`queue`, `w3`],    { heads: `end` }),
          q4: h(`queue`,  `w4`,    [`queue`, `w4`],    { heads: `end` }),
        },
        flows: [
          { route: [`sq`, `q1`], bounce: false, rate: 1.2 },
          { route: [`sq`, `q3`], bounce: false, rate: 0.8 },
        ],
      },
    },
    {
      short: `CompletableFuture`,
      chapter: `technique`,
      title: `Async Pipeline — CompletableFuture`,
      body: [
        `CompletableFuture chains async stages: thenApply (transform), thenCompose (flat-map), thenCombine (merge two futures):`,
        `<code>CompletableFuture.supplyAsync(() -> fetchUser(id), ioPool)<br>  .thenCompose(user -> enrichData(user))<br>  .thenApplyAsync(data -> formatJson(data))<br>  .thenAccept(System.out::println);</code>`,
      ],
      callout: { kind: `insight`, text: `thenApply runs the callback on the completing thread. thenApplyAsync always submits to the pool — use it to avoid blocking the common pool with IO.` },
      metrics: { threads: `FJP common`, queue: `non-blocking`, locks: `—`, mode: `CompletableFuture` },
      scene: {
        entities: {
          s1:     d(-10, 2,  { color: `blue`,   glyph: `code`,  label: [`Stage 1`, `fetchUser()`],  cpu: 0.5 }),
          s2:     d(0,   2,  { color: `purple`, glyph: `code`,  label: [`Stage 2`, `enrichData()`], cpu: 0.5 }),
          s3a:    d(10, -4,  { color: `green`,  glyph: `code`,  label: [`Stage 3a`, `formatJson()`] }),
          s3b:    d(10,  8,  { color: `green`,  glyph: `code`,  label: [`Stage 3b`, `sendEmail()`] }),
          result: d(20,  2,  { color: `orange`, glyph: `check`, label: [`allOf()`, `joined`] }),
          card: S({ x: -2, y: 14 }, 'CompletableFuture Pipeline', [
            'thenApply():      Runs synchronously on completing thread',
            'thenApplyAsync(): Dispatches callback to ForkJoinPool.commonPool',
            'thenCompose():    Monadic flatMap chaining async dependencies',
            'allOf():          Non-blocking join barrier across futures',
          ], { icon: 'code' }),
        },
        links: {
          s12: h(`s1`,  `s2`,     [`s1`,  `s2`],     { label: `thenCompose`,    heads: `end` }),
          s2a: h(`s2`,  `s3a`,    [`s2`,  `s3a`],    { label: `thenApplyAsync`, heads: `end` }),
          s2b: h(`s2`,  `s3b`,    [`s2`,  `s3b`],    { label: `thenApplyAsync`, heads: `end` }),
          ar:  h(`s3a`, `result`, [`s3a`, `result`], { heads: `end` }),
          br:  h(`s3b`, `result`, [`s3b`, `result`], { heads: `end` }),
        },
        flows: [
          { route: [`s12`, `s2a`, `ar`], bounce: false, rate: 1 },
          { route: [`s12`, `s2b`, `br`], bounce: false, rate: 1 },
        ],
      },
    },
    {
      short: `Virtual Threads`,
      chapter: `technique`,
      title: `Virtual Threads (JDK 21 — Project Loom)`,
      body: [
        `Virtual threads are lightweight JVM-managed threads. Millions can exist simultaneously — each uses ~1KB of memory vs ~1MB for a platform thread:`,
        `<code>// Millions of concurrent threads without OS thread exhaustion:<br>try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {<br>  executor.submit(() -> {<br>    Thread.sleep(Duration.ofSeconds(1)); // Unmounts from carrier!<br>    return fetchHttp();<br>  });<br>}</code>`,
      ],
      callout: { kind: `insight`, text: `Write blocking-style IO code and get async performance. HTTP server throughput scales linearly with virtual threads — no reactive callbacks needed.` },
      metrics: { threads: `1M virtual`, queue: `per-carrier`, locks: `continuation`, mode: `VirtualThread` },
      scene: {
        entities: {
          carrier1: d(-2, -6,  { color: `orange`, glyph: `cpu`,    label: [`Carrier-1`, `OS Thread`], cpu: 0.9 }),
          carrier2: d(-2,  6,  { color: `orange`, glyph: `cpu`,    label: [`Carrier-2`, `OS Thread`], cpu: 0.7 }),
          vt1:      d(12, -12, { color: `green`,  glyph: `code`,   label: [`VT-1`, `RUNNING`] }),
          vt2:      d(12,  -4, { color: `blue`,   glyph: `code`,   label: [`VT-2`, `parked (IO)`] }),
          vt3:      d(12,   4, { color: `green`,  glyph: `code`,   label: [`VT-3`, `RUNNING`] }),
          vt4:      d(12,  12, { color: `blue`,   glyph: `code`,   label: [`VT-4`, `parked (IO)`] }),
          heap:     d(20,  -4, { color: `purple`, glyph: `layers`, label: [`Heap`, `~1KB/VT`] }),
          card: S({ x: -4, y: 16 }, 'Carrier OS Thread vs Virtual Thread', [
            'Platform Thread: 1MB OS stack, kernel context switch (~1-2us)',
            'Virtual Thread:  ~1KB Heap continuation, zero OS context switch',
            'Blocking Event:  JVM unmounts VT from Carrier (Continuation.yield)',
            'Scale Capacity:  Millions of concurrent blocking I/O calls',
          ], { icon: 'zap' }),
        },
        links: {
          c1v1: h(`carrier1`, `vt1`,  [`carrier1`, `vt1`],  { label: `mounted`,      heads: `both` }),
          c1v2: h(`carrier1`, `vt2`,  [`carrier1`, `vt2`],  { label: `parked`,       heads: `end`, style: `dashed` }),
          c2v3: h(`carrier2`, `vt3`,  [`carrier2`, `vt3`],  { label: `mounted`,      heads: `both` }),
          c2v4: h(`carrier2`, `vt4`,  [`carrier2`, `vt4`],  { label: `parked`,       heads: `end`, style: `dashed` }),
          vh:   h(`vt1`,      `heap`, [`vt1`,      `heap`], { label: `continuation`, heads: `end` }),
        },
        flows: [
          { route: [`c1v1`], bounce: true, rate: 1.3 },
          { route: [`c2v3`], bounce: true, rate: 1 },
        ],
      },
    },
  ],
};

export default javaConcurrencyLesson;
