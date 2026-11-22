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

export const javaIoNioLesson = {
  id: `java-io-nio`,
  title: `Java I/O vs High-Performance NIO Architecture`,
  summary: `From classic stream blocking I/O (1 thread per socket) to Java NIO Channel, ByteBuffer, Selector, and Linux epoll zero-copy.`,
  minutes: 13,
  level: `advanced`,
  metrics: ['concurrency', 'memory_mode', 'io_mechanism', 'sys_calls', 'throughput'],
  legend: ['req', 'res', ['ping', 'epoll ready'], 'fail'],
  goals: [
    { text: `Classic Blocking I/O (BIO): Stream abstraction & 1-thread-per-socket bottleneck`, step: 1 },
    { text: `NIO Channel & ByteBuffer: Position, limit, capacity, and direct off-heap memory`, step: 2 },
    { text: `Selector & epoll Multiplexing: Handling 10,000 connections on 1 worker thread`, step: 3 },
    { text: `Zero-Copy Transfer: FileChannel.transferTo() and sendfile syscall`, step: 4 },
    { text: `Netty EventLoop Architecture: Reactor pattern & ChannelPipeline`, step: 5 },
  ],
  steps: [
    {
      short: `Classic BIO`,
      chapter: `technique`,
      title: `Classic Blocking I/O (BIO) Bottleneck`,
      body: [
        `In standard Java I/O (<code>InputStream</code>, <code>Socket</code>), reads block the thread until data arrives from the network OS buffer.`,
        `Handling 10,000 concurrent sockets required 10,000 OS threads. With 1MB stack per thread, 10GB of memory was wasted just on idle waiting threads.`,
      ],
      callout: { kind: `warn`, text: `Thread stack memory and kernel context switching made C10K impossible with traditional BIO.` },
      metrics: { concurrency: '500 Threads Max', memory_mode: 'Heap Streams', io_mechanism: 'read() blocks', sys_calls: '1 call per read', throughput: '15k req/s' },
      scene: {
        entities: {
          client: y(-11, -4, { label: 'Client Sockets', tags: [{ text: '10,000 Users', icon: 'server' }] }),
          threads: d(0, -4, { s: 3.8, h: 42, color: 'rose', glyph: 'alertTriangle', label: ['10,000 OS Threads'], sub: '1 Thread / Conn' }),
          kernel: d(11, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'cpu', label: ['OS Socket Buffer'], sub: 'read() blocked' }),
        },
        links: {
          ct: h('client', 'threads', ['client', 'threads'], { heads: 'end', label: '1 socket per thread' }),
          tk: h('threads', 'kernel', ['threads', 'kernel'], { heads: 'both', label: 'blocks waiting' }),
        },
        flows: [
          { route: ['ct'], bounce: false, rate: 1.5 },
        ],
      },
    },
    {
      short: `ByteBuffer`,
      chapter: `technique`,
      title: `NIO Channels & ByteBuffers`,
      body: [
        `Java NIO is buffer-oriented. A <code>Channel</code> represents an open connection to hardware, while a <code>ByteBuffer</code> holds the data.`,
        `ByteBuffers manage 3 internal pointers: <code>position</code>, <code>limit</code>, and <code>capacity</code>. Calling <code>flip()</code> switches from writing to reading.`,
      ],
      callout: { kind: `insight`, text: 'DirectByteBuffer allocates memory off-heap, allowing the OS kernel to directly read/write without an intermediate JVM heap copy.' },
      metrics: { concurrency: 'Non-blocking', memory_mode: 'DirectByteBuffer', io_mechanism: 'Channel read/write', sys_calls: 'Batch Buffer', throughput: '80k req/s' },
      scene: {
        entities: {
          channel: d(-11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'route', label: ['SocketChannel'], sub: 'Bidirectional' }),
          buffer: d(0, -4, { s: 3.8, h: 42, color: 'green', glyph: 'layers', label: ['ByteBuffer'], sub: 'pos / lim / cap' }),
          offheap: d(11, -4, { s: 3.8, h: 42, color: 'teal', glyph: 'database', label: ['Off-Heap Direct'], sub: 'Native Memory' }),
        },
        links: {
          cb: h('channel', 'buffer', ['channel', 'buffer'], { heads: 'both', label: 'read / write' }),
          bo: h('buffer', 'offheap', ['buffer', 'offheap'], { heads: 'both', label: 'zero GC pressure' }),
        },
        flows: [
          { route: ['cb', 'bo'], bounce: true, rate: 2.2 },
        ],
      },
    },
    {
      short: `Selector`,
      chapter: `technique`,
      title: `Selector & Linux epoll Multiplexing`,
      body: [
        `A <strong>Selector</strong> registers thousands of non-blocking channels. Instead of polling, the single thread sleeps on <code>selector.select()</code>.`,
        `The Linux kernel uses <code>epoll</code> to awaken the thread only when specific sockets have incoming bytes ready, allowing 1 thread to handle 100,000 sockets.`,
      ],
      callout: { kind: `tip`, text: 'NIO transforms I/O from thread-per-client to an event-driven notification loop.' },
      metrics: { concurrency: '100,000 Sockets', memory_mode: '1 Worker Thread', io_mechanism: 'Linux epoll', sys_calls: 'Event-driven', throughput: '250k req/s' },
      scene: {
        entities: {
          sockets: p({ x0: -14, x1: -8, y0: -7, y1: -1 }, 12, '10k Idle Sockets'),
          selector: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'shield', label: ['NIO Selector'], sub: 'epoll_wait()' }),
          event_loop: d(11, -4, { s: 3.8, h: 42, color: 'green', glyph: 'cpu', label: ['Single Worker'], sub: 'SelectionKey loop' }),
        },
        links: {
          ss: h('sockets', 'selector', ['sockets', 'selector'], { heads: 'none', label: 'registered' }),
          se: h('selector', 'event_loop', ['selector', 'event_loop'], { heads: 'end', label: 'dispatches ready events' }),
        },
        flows: [
          { route: ['se'], bounce: true, rate: 2.5 },
        ],
      },
    },
    {
      short: `Zero-Copy`,
      chapter: `technique`,
      title: `Zero-Copy Transfer: transferTo() & sendfile`,
      body: [
        `In standard I/O, sending a file to a socket requires 4 context switches and 4 copies (Disk → OS page cache → JVM user buffer → Socket buffer → NIC).`,
        `<code>FileChannel.transferTo()</code> triggers the Linux <code>sendfile</code> system call: data streams directly from the OS page cache to the Network Interface Card (NIC) with <strong>zero CPU copies</strong>.`,
      ],
      callout: { kind: `insight`, text: 'Kafka and Netty achieve multi-gigabit throughput specifically through Java zero-copy transfer.' },
      metrics: { concurrency: 'Full Line Rate', memory_mode: 'OS PageCache', io_mechanism: 'sendfile syscall', sys_calls: '1 syscall (0 copy)', throughput: '10 Gbps' },
      scene: {
        entities: {
          page_cache: d(-11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'archive', label: ['OS Page Cache'], sub: 'Kernel Space' }),
          transfer: d(0, -4, { s: 3.8, h: 42, color: 'green', glyph: 'workflow', label: ['transferTo()'], sub: 'sendfile Syscall' }),
          nic: d(11, -4, { s: 3.8, h: 42, color: 'orange', glyph: 'route', label: ['NIC Hardware'], sub: 'DMA Stream' }),
        },
        links: {
          pt: h('page_cache', 'transfer', ['page_cache', 'transfer'], { heads: 'end' }),
          tn: h('transfer', 'nic', ['transfer', 'nic'], { heads: 'end', label: 'direct DMA copy' }),
        },
        flows: [
          { route: ['pt', 'tn'], bounce: false, rate: 2.8 },
        ],
      },
    },
    {
      short: `Netty`,
      chapter: `deep`,
      title: `Netty Reactor Pattern & ChannelPipeline`,
      body: [
        `Netty builds on NIO with the <strong>Multi-Reactor Pattern</strong>:`,
        `• <strong>BossGroup</strong>: Accepts incoming TCP connections and registers them to Workers.`,
        `• <strong>WorkerGroup</strong>: Executes non-blocking reads and passes ByteBufs through a <strong>ChannelPipeline</strong> of composable handlers (TLS, HTTP, framing).`,
      ],
      callout: { kind: `tip`, text: 'Netty uses PooledByteBufAllocator with jemalloc-style slabs to eliminate memory allocation latency.' },
      metrics: { concurrency: '500,000 Conns', memory_mode: 'Pooled ByteBuf', io_mechanism: 'ChannelPipeline', sys_calls: 'epoll edge-triggered', throughput: '1M+ req/s' },
      scene: {
        entities: {
          boss: d(-11, -4, { s: 3.8, h: 42, color: 'yellow', glyph: 'shield', label: ['Boss EventLoop'], sub: 'Accepts TCP' }),
          worker: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'cpu', label: ['Worker EventLoop'], sub: 'Read / Write' }),
          pipeline: d(11, -4, { s: 3.8, h: 42, color: 'teal', glyph: 'workflow', label: ['ChannelPipeline'], sub: 'Decoders & Handlers' }),
        },
        links: {
          bw: h('boss', 'worker', ['boss', 'worker'], { heads: 'end', label: 'assigns channel' }),
          wp: h('worker', 'pipeline', ['worker', 'pipeline'], { heads: 'both', label: 'fireChannelRead()' }),
        },
        flows: [
          { route: ['bw'], bounce: false, rate: 1.5 },
          { route: ['wp'], bounce: true, rate: 2.5 },
        ],
      },
    },
  ],
};
export default javaIoNioLesson;
