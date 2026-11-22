// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDevice as y,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const javaVirtualThreadsLesson = {
  id: 'java-virtual-threads',
  title: 'Java Virtual Threads & Project Loom',
  summary: 'Explore JDK 21 Virtual Threads architecture: carrier OS thread scheduling, continuation unmounting on blocking IO, and million-concurrency scaling.',
  minutes: 10,
  level: 'intermediate',
  metrics: ['virtualThreads', 'carrierThreads', 'memoryPerThread', 'schedulingMode'],
  goals: [
    { text: 'Compare 1MB Platform Thread OS', step: 1 },
    { text: 'Visualize Loom continuation unmounting', step: 2 },
    { text: 'Avoid thread pinning caused by', step: 3 },
  ],
  steps: [
    {
      short: 'Platform vs Virtual',
      chapter: 'technique',
      title: 'M:N Threading: Lightweight JVM Continuations',
      body: [
        'Platform threads map 1:1 to OS kernel threads, consuming ~1MB stack memory and costly kernel context switches.',
        'Virtual threads (JDK 21) are managed directly by the JVM. Millions run concurrently, allocating only ~1KB on the heap:',
        '<code>// Lightweight virtual thread creation:<br>Thread.startVirtualThread(() -> processOrder());<br>// Or via structured concurrency:<br>try (var scope = new StructuredTaskScope.ShutdownOnFailure()) { ... }</code>',
      ],
      callout: { kind: 'insight', text: 'Do not pool virtual threads! They are ephemeral: create a new one per task via Executors.newVirtualThreadPerTaskExecutor().' },
      metrics: { virtualThreads: '1,000,000 active', carrierThreads: '8 OS cores', memoryPerThread: '~1 KB', schedulingMode: 'M:N Loom' },
      scene: {
        entities: {
          c1:  d(-12, -8, { color: 'orange', glyph: 'cpu', label: ['Carrier OS-1', 'CPU Core 1'], cpu: 0.9 }),
          c2:  d(-12, 4,  { color: 'orange', glyph: 'cpu', label: ['Carrier OS-2', 'CPU Core 2'], cpu: 0.8 }),
          vt1: d(0, -12,  { color: 'green', glyph: 'code', label: ['VirtualThread-1', 'RUNNING'] }),
          vt2: d(0, -4,   { color: 'blue', glyph: 'code', label: ['VirtualThread-2', 'Parked (Socket)'] }),
          vt3: d(0, 4,    { color: 'green', glyph: 'code', label: ['VirtualThread-3', 'RUNNING'] }),
          vt4: d(0, 12,   { color: 'blue', glyph: 'code', label: ['VirtualThread-4', 'Parked (DB)'] }),
          hp:  d(12, 0,   { color: 'purple', glyph: 'layers', label: ['JVM Heap', 'Continuation Stack'] }),
          card: S({ x: -2, y: 16 }, 'Platform vs Virtual Thread Stack', [
            'Platform Thread: 1MB OS stack, kernel context switch',
            'Virtual Thread:  ~1KB heap continuation, 0 kernel switch',
            'Carrier Threads: ForkJoinPool sizing = availableProcessors()',
            'Concurrency:     1,000,000 tasks run in sub-second memory',
          ], { icon: 'cpu' }),
        },
        links: {
          c1v1: h('c1', 'vt1', ['c1', 'vt1'], { label: 'mounted', heads: 'both' }),
          c1v2: h('c1', 'vt2', ['c1', 'vt2'], { label: 'unmounted', heads: 'end', style: 'dashed' }),
          c2v3: h('c2', 'vt3', ['c2', 'vt3'], { label: 'mounted', heads: 'both' }),
          c2v4: h('c2', 'vt4', ['c2', 'vt4'], { label: 'unmounted', heads: 'end', style: 'dashed' }),
          vhp:  h('vt2', 'hp', ['vt2', 'hp'], { label: 'park continuation', heads: 'end' }),
        },
        flows: [
          { route: ['c1v1'], bounce: true, rate: 1.2 },
          { route: ['c2v3'], bounce: true, rate: 1.0 },
        ],
      },
    },
    {
      short: 'Unmount on IO',
      chapter: 'technique',
      title: 'Non-Blocking Park on Network & Disk IO',
      body: [
        'When a virtual thread executes blocking IO (e.g. InputStream.read()), the JVM unmounts it from the carrier thread.',
        'The carrier thread immediately picks up another ready virtual thread from its work queue without blocking the OS thread:',
        '<code>// Blocking IO yields continuation seamlessly:<br>byte[] data = remoteSocket.getInputStream().readAllBytes();<br>// JVM calls Continuation.yield() under the hood!</code>',
      ],
      callout: { kind: 'tip', text: 'Synchronous blocking code executes with the high throughput of asynchronous reactive code, with standard clean stack traces.' },
      metrics: { virtualThreads: '100,000 IO-bound', carrierThreads: '8 OS (0% blocked)', memoryPerThread: '~1.2 KB', schedulingMode: 'Carrier Switch' },
      scene: {
        entities: {
          carrier: d(-11, -1, { color: 'orange', glyph: 'cpu', label: ['Carrier Thread', 'Switches Task'], cpu: 1.0 }),
          vtOld:   d(-2, -10, { color: 'yellow', glyph: 'code', label: ['VT (Waiting IO)', 'Yielded Continuation'] }),
          vtNew:   d(-2, 8,   { color: 'green', glyph: 'code', label: ['VT (Compute Ready)', 'Mounted Next'] }),
          network: d(9, -10,  { color: 'violet', glyph: 'network', label: ['Remote Socket', 'Awaiting Response'] }),
          card: S({ x: 2, y: 14 }, 'Continuation Yield on Blocking IO', [
            'Continuation.yield(): JVM parks call-stack to Heap',
            'Carrier Worker:       Carrier OS thread picks next ready VT',
            'OS Network Wait:      epoll/kqueue polls remote socket',
            'Wakeup Event:         VT unparks and re-mounts on free carrier',
          ], { icon: 'zap' }),
        },
        links: {
          cOld: h('carrier', 'vtOld', ['carrier', 'vtOld'], { label: 'unmount', heads: 'end', style: 'dashed' }),
          cNew: h('carrier', 'vtNew', ['carrier', 'vtNew'], { label: 'mount & run', heads: 'end' }),
          nio:  h('vtOld', 'network', ['vtOld', 'network'], { label: 'epoll wait', heads: 'end' }),
        },
        flows: [
          { route: ['cNew'], bounce: true, rate: 1.4 },
        ],
      },
    },
    {
      short: 'Thread Pinning',
      chapter: 'tradeoff',
      title: 'Thread Pinning: Synchronized Blocks & Native Frames',
      body: [
        'A virtual thread becomes <b>pinned</b> to its carrier OS thread when executing inside a <code>synchronized</code> block/method or native JNI call.',
        'While pinned, blocking IO freezes the underlying OS thread, degrading Loom throughput. Replace <code>synchronized</code> with <code>ReentrantLock</code> to allow unmounting:',
        '<code>// Pinning hazard vs Solution:<br>synchronized(lock) { io(); } // PINNED!<br>reentrantLock.lock(); try { io(); } finally { reentrantLock.unlock(); } // OK!</code>',
      ],
      callout: { kind: 'warn', text: 'Run with -Djdk.tracePinnedThreads=full in JDK 21 to log stack traces of any virtual thread that pins its carrier thread.' },
      metrics: { virtualThreads: 'Pinned VT Detected', carrierThreads: 'OS Thread Stalled!', memoryPerThread: 'Pinned Carrier', schedulingMode: 'ReentrantLock Required' },
      scene: {
        entities: {
          carrier: d(-12, -4, { color: 'rose', glyph: 'cpu', label: ['Carrier Thread'], sub: 'Locked', cpu: 1.0 }),
          pinVT:   d(-2, -4,  { color: 'yellow', glyph: 'lock', label: ['Virtual Thread'], sub: 'In sync()' }),
          fixLock: d(10, -4,  { color: 'green', glyph: 'check', label: ['ReentrantLock'], sub: 'Unpin Solution' }),
          card: S({ x: -2, y: 14 }, 'Thread Pinning Hazard & Mitigation', [
            'HAZARD: synchronized block prevents Continuation.yield()',
            'CONSEQUENCE: Carrier OS thread freezes while VT blocks',
            'FIX: Replace synchronized with java.util.concurrent.ReentrantLock',
            'DIAGNOSTIC: -Djdk.tracePinnedThreads=full dumps pinned traces',
          ], { icon: 'alert' }),
        },
        links: {
          cp: h('carrier', 'pinVT', ['carrier', 'pinVT'], { label: 'pinned (cannot yield)', heads: 'both' }),
          pf: h('pinVT', 'fixLock', ['pinVT', 'fixLock'], { label: 'refactor to ReentrantLock', heads: 'end' }),
        },
        flows: [
          { route: ['cp'], bounce: true, rate: 0.8 },
        ],
      },
    },
  ],
};

export default javaVirtualThreadsLesson;
