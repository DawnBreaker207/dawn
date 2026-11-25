/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaIoNioLesson: Lesson = {
  id: 'java-io-nio',
  title: 'I/O Streams, NIO.2 Files, Selector & Serialization Risk',
  summary:
    'Understand WHY Java separates byte streams from Charset Readers, why Buffered wrappers matter, how Files.lines() leaks FDs, how ByteBuffer flip() works, and Java Serialization RCE.',
  minutes: 12,
  level: 'core',
  metrics: ['io_layer', 'encoding', 'syscall_cost', 'security_risk'],
  legend: ['flow', ['req', 'read / flip'], ['res', 'buffered / epoll'], ['fail', 'FD leak / RCE']],
  goals: [
    { text: 'Separate InputStream (bytes) from Reader (Charset)', step: 1 },
    { text: 'Cut OS syscalls with BufferedInputStream Decorator', step: 2 },
    { text: 'Close lazy Files.lines() streams via try-with-resources', step: 3 },
    { text: 'Trace NIO ByteBuffer position/limit & flip()', step: 4 },
    { text: 'Multiplex sockets via NIO Selector & epoll_wait()', step: 5 },
    { text: 'Avoid ObjectInputStream RCE (Effective Java Item 85)', step: 6 },
  ],
  steps: [
    {
      short: 'Bytes vs Chars',
      chapter: 'io',
      title: '1. Why InputStream (Bytes) != Reader (Charset)',
      body: [
        '<code>InputStream</code> / <code>OutputStream</code> read and write raw 8-bit bytes (images, PDFs, sockets). <code>Reader</code> / <code>Writer</code> decode bytes into Unicode characters using a <code>Charset</code>.',
        'Always pass <code>StandardCharsets.UTF_8</code> explicitly — relying on platform default charset causes mojibake bugs across Linux vs Windows!',
      ],
      callout: {
        kind: 'tip',
        text: 'Since Java 18 (JEP 400), UTF-8 is the default charset across all OSes, but explicit UTF_8 remains best practice.',
      },
      metrics: { io_layer: 'Stream vs Rdr', encoding: 'UTF-8 explicit', syscall_cost: 'Unbuffered', security_risk: 'Mojibake' },
      scene: {
        entities: {
          file: b(-14, -10, { r: 2.2, h: 48, color: 'blue', label: ['Raw Bytes'], sub: '0xE2 0x82 0xAC' }),
          is: d(0, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'layers', label: ['InputStream'], sub: '8-bit bytes' }),
          rdr: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['Reader UTF-8'], sub: 'char decode' }),
          card: S({ x: -12, y: 12 }, '1. Bridge Bytes to Characters Safely', [
            'try (var r = new BufferedReader(',
            '       new InputStreamReader(in, StandardCharsets.UTF_8))) {',
            '  return r.readLine();',
            '} // Never omit Charset on InputStreamReader!',
          ], { icon: 'terminal' }),
        },
        links: {
          fl_is: h('file', 'is', ['file', 'is'], { heads: 'end', label: 'raw bytes' }),
          is_rd: h('is', 'rdr', ['is', 'rdr'], { heads: 'end', label: 'UTF-8' }),
        },
        flows: [{ route: ['fl_is', 'is_rd'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Buffered',
      chapter: 'io',
      title: '2. Decorator Pattern: Why Buffered* Cuts Syscalls 8000x',
      body: [
        'Calling <code>FileInputStream.read()</code> byte-by-byte triggers an expensive user-to-kernel OS syscall for every single byte.',
        'Wrapping it in <code>BufferedInputStream</code> (Decorator pattern) reads an 8 KB chunk in 1 syscall so subsequent <code>read()</code> calls hit user-space RAM.',
      ],
      callout: {
        kind: 'insight',
        text: 'Always close only the outer Decorator in try-with-resources — closing BufferedInputStream automatically flushes & closes the inner stream.',
      },
      changes: ['+ 8KB user-space buffer cuts syscalls', '+ Outer close() cascades inward'],
      metrics: { io_layer: 'Decorator 8KB', encoding: 'Any', syscall_cost: '1 / 8192B', security_risk: 'None' },
      scene: {
        entities: {
          disk: b(-14, -10, { r: 2.2, h: 48, color: 'blue', label: ['OS Kernel'], sub: '1 syscall/8KB' }),
          buf: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['BufferedIn'], sub: 'byte[8192] RAM' }),
          app: d(14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['App read()'], sub: 'fast RAM hit' }),
          card: S({ x: -12, y: 12 }, '2. Buffered Decorator Eliminates Syscalls', [
            '// Unbuffered: 1MB file = 1,000,000 OS syscalls!',
            '// Buffered:   1MB file = ~128 OS syscalls',
            'try (var in = new BufferedInputStream(',
            '       new FileInputStream("data.bin"))) { ... }',
          ], { icon: 'terminal' }),
        },
        links: {
          dk_bf: h('disk', 'buf', ['disk', 'buf'], { heads: 'end', label: '8KB read' }),
          bf_ap: h('buf', 'app', ['buf', 'app'], { heads: 'end', label: 'RAM byte' }),
        },
        flows: [{ route: ['dk_bf', 'bf_ap'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'NIO.2 Files',
      chapter: 'nio2',
      title: '3. NIO.2 Files.lines() & The Hidden FD Leak Trap',
      body: [
        'Modern Java uses <code>Path.of(...)</code> and <code>Files.readString(path)</code> for small files, or <code>Files.lines(path)</code> to stream multi-GB files lazily.',
        '<strong>Tricky OCP trap:</strong> <code>Files.lines()</code> holds an open OS file descriptor! If you don’t wrap the <code>Stream&lt;String&gt;</code> in <code>try-with-resources</code>, the OS runs out of file descriptors (<code>Too many open files</code>).',
      ],
      callout: {
        kind: 'warn',
        text: 'Unlike Collection.stream(), NIO Streams (Files.lines, Files.walk, Files.list) MUST be closed in try-with-resources!',
      },
      changes: ['+ Path + Files replaces java.io.File', '+ Files.lines() requires try-with-resources'],
      metrics: { io_layer: 'NIO.2 Path', encoding: 'UTF-8 default', syscall_cost: 'Lazy Stream', security_risk: 'FD leak if open' },
      scene: {
        entities: {
          fd: b(-14, -10, { r: 2.2, h: 48, color: 'amber', label: ['OS File FD'], sub: 'held open!' }),
          stm: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['Files.lines()'], sub: 'Stream<String>' }),
          twr: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['try-with-res'], sub: 'auto close()' }),
          card: S({ x: -12, y: 12 }, '3. Closing Lazy NIO.2 Streams Safely', [
            '// Small files (Java 11+):',
            'String text = Files.readString(Path.of("cfg.json"));',
            '// Large files: MUST close Stream to release OS FD!',
            'try (Stream<String> lines = Files.lines(path)) {',
            '  return lines.filter(l -> l.contains("ERR")).count();',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          fd_st: h('fd', 'stm', ['fd', 'stm'], { heads: 'end', label: 'stream' }),
          st_tw: h('stm', 'twr', ['stm', 'twr'], { heads: 'end', label: 'close FD' }),
        },
        flows: [{ route: ['fd_st', 'st_tw'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'ByteBuffer',
      chapter: 'nio',
      title: '4. How NIO ByteBuffer Works (flip() & clear())',
      body: [
        'A <code>ByteBuffer</code> has three cursors: <code>position</code>, <code>limit</code>, and <code>capacity</code>. Writing into it advances <code>position</code>.',
        'Before reading what you just wrote, you MUST call <code>buf.flip()</code> (sets <code>limit = position; position = 0</code>). Calling <code>clear()</code> resets for the next write.',
      ],
      callout: {
        kind: 'insight',
        text: 'Forgetting buf.flip() reads garbage/zeros after the written bytes up to capacity!',
      },
      changes: ['+ channel.read(buf) advances position', '+ flip() switches write -> read mode'],
      metrics: { io_layer: 'ByteBuffer', encoding: 'Raw bytes', syscall_cost: 'Direct DMA', security_risk: 'Read garbage' },
      scene: {
        entities: {
          wr: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Write Mode'], sub: 'pos=5, lim=16' }),
          flp: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['buf.flip()'], sub: 'lim=5, pos=0' }),
          rd: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Read Mode'], sub: 'reads 0..5' }),
          card: S({ x: -12, y: 12 }, '4. ByteBuffer Write -> Flip -> Read Cycle', [
            'ByteBuffer buf = ByteBuffer.allocate(1024);',
            'while (channel.read(buf) > 0) {',
            '  buf.flip();   // limit = pos; pos = 0',
            '  out.write(buf);',
            '  buf.clear();  // pos = 0; limit = capacity',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          wr_fl: h('wr', 'flp', ['wr', 'flp'], { heads: 'end', label: 'flip()' }),
          fl_rd: h('flp', 'rd', ['flp', 'rd'], { heads: 'end', label: 'drain 0..5' }),
        },
        flows: [{ route: ['wr_fl', 'fl_rd'], kind: 'req', rate: 1.9 }],
      },
    },
    {
      short: 'Selector',
      chapter: 'nio',
      title: '5. NIO Selector & OS epoll Multiplexing',
      body: [
        'Traditional <code>ServerSocket.accept()</code> blocks 1 OS thread per idle client. Non-blocking NIO registers thousands of <code>SocketChannel</code>s on one <code>Selector</code>.',
        '<code>selector.select()</code> calls OS <code>epoll_wait()</code> and returns only sockets with ready bytes — powering Netty and Project Loom’s Poller.',
      ],
      callout: {
        kind: 'insight',
        text: 'With JDK 21 Virtual Threads, you write simple blocking Socket/HttpClient code while the JVM uses NIO epoll underneath!',
      },
      changes: ['+ Non-blocking SocketChannel -> Selector', '+ OS epoll wakes only ready FDs'],
      metrics: { io_layer: 'NIO Selector', encoding: 'TCP bytes', syscall_cost: '1 epoll_wait', security_risk: 'None' },
      scene: {
        entities: {
          socks: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'layers', label: ['10k Sockets'], sub: 'non-blocking' }),
          sel: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['NIO Selector'], sub: 'epoll_wait()' }),
          ready: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['Ready Keys'], sub: 'OP_READ' }),
          card: S({ x: -12, y: 12 }, '5. Multiplexing 10k Connections on 1 Thread', [
            'channel.configureBlocking(false);',
            'channel.register(selector, SelectionKey.OP_READ);',
            'selector.select(); // OS epoll_wait returns ready keys',
          ], { icon: 'terminal' }),
        },
        links: {
          sk_sl: h('socks', 'sel', ['socks', 'sel'], { heads: 'end', label: 'register' }),
          sl_rd: h('sel', 'ready', ['sel', 'ready'], { heads: 'end', label: 'OP_READ' }),
        },
        flows: [{ route: ['sk_sl', 'sl_rd'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'Serialization',
      chapter: 'security',
      title: '6. Why Effective Java Warns Against Java Serialization',
      body: [
        '<code>ObjectInputStream.readObject()</code> instantiates arbitrary classes and invokes <code>readObject()</code> gadget chains BEFORE your code can even cast the result!',
        'Effective Java Item 85: <strong>Never deserialize untrusted bytes</strong> — use JSON (Jackson), Protobuf, or set a strict <code>ObjectInputFilter</code> allowlist.',
      ],
      callout: {
        kind: 'warn',
        text: 'Java Deserialization gadgets caused some of the worst RCE CVEs in history (Log4j/Apache Commons Collections).',
      },
      changes: ['+ ObjectInputStream runs gadgets on read', '+ Prefer JSON / Protobuf / InputFilter'],
      metrics: { io_layer: 'JSON / Proto', encoding: 'UTF-8 / Bin', syscall_cost: 'Safe parse', security_risk: 'No RCE' },
      scene: {
        entities: {
          ois: d(-14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['ObjectInput'], sub: 'gadget RCE!' }),
          flt: d(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'shield', label: ['InputFilter'], sub: 'JEP 290 filter' }),
          json: b(14, -10, { r: 2.2, h: 48, color: 'green', label: ['JSON / Proto'], sub: 'data-only safe' }),
          card: S({ x: -12, y: 12 }, '6. Effective Java Item 85: Prefer Alternatives', [
            '// DANGEROUS on untrusted bytes:',
            'Object obj = new ObjectInputStream(in).readObject();',
            '// SAFE: use data-only formats (JSON / Protobuf)',
            '// Or Java 9+ ObjectInputFilter allowlist!',
          ], { icon: 'terminal' }),
        },
        links: {
          oi_fl: h('ois', 'flt', ['ois', 'flt'], { heads: 'end', label: 'guard' }),
          fl_js: h('flt', 'json', ['flt', 'json'], { heads: 'end', label: 'prefer JSON' }),
        },
        flows: [{ route: ['oi_fl'], kind: 'fail', rate: 1.5 }, { route: ['fl_js'], kind: 'res', rate: 1.8 }],
      },
    },
  ],
};
