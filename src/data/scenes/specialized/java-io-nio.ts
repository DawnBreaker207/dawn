import { STAGE, makeDb, makeLink, makePanel, distinctConcepts, type Tag, stageBlock, cardAt, linkOf } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage: your code on the left, the I/O class under discussion in the middle (same id,
// new label each act), the thing it reads from on the right, and the OS kernel above it.
//
//                    kernel          alt
//   your code ──── io ────────────── source

type Opts = Record<string, unknown>;

const positions = {
  caller: STAGE.caller,
  io: STAGE.main,
  source: STAGE.store,
  kernel: STAGE.helper,
  alt: STAGE.alt,
};

const block = stageBlock;
const caller = (tags: Tag[] = []) => block(positions.caller, { color: `blue`, glyph: `code`, label: [`your code`], sub: `caller`, tags });
const ioSystem = (label: string[], sub: string, tags: Tag[] = [], glyph = `box`) =>
  block(positions.io, { color: `green`, glyph, label, sub, tags });
const source = (label: string, tags: Tag[] = []) =>
  makeDb(positions.source.x, positions.source.y, { r: 2.2, h: 46, glyph: `database`, label, tags });
const kernel = (label: string[], sub: string, glyph: string, tags: Tag[] = []) =>
  block(positions.kernel, { color: `orange`, glyph, label, sub, tags });
const alt = (label: string[], sub: string, tags: Tag[] = []) =>
  block(positions.alt, { color: `slab`, glyph: `route`, label, sub, tags });

const links = {
  call: (label?: string) => linkOf(`caller`, `io`, label),
  read: (label?: string) => linkOf(`io`, `source`, label),
  sys: (label?: string) => ({ ...linkOf(`kernel`, `io`, label, false), labelAt: 0.6 }),
  alt: makeLink(`caller`, `alt`, [`caller`, `alt`], { heads: `both`, style: `off` }),
};

/** Code card, parked bottom-left under the caller where nothing else lives. */
const card = cardAt({ x: positions.io.x, y: positions.io.y, dx: -250, dy: 150 }, `code`);

export const javaIoNioLesson: Lesson = distinctConcepts({
  id: 'java-io-nio',
  title: 'I/O, NIO.2 & Selector',
  summary:
    'How Java reads bytes: streams versus readers, why buffering saves system calls, the Files.lines leak, ByteBuffer.flip(), one thread serving 10,000 sockets, and why not to deserialize untrusted data.',
  minutes: 12,
  level: 'core',
  metrics: ['layer', 'syscalls', 'encoding', 'risk'],
  legend: [[`req`, `call`], [`write`, `syscall`], [`fail`, `trap`]],
  goals: [
    { text: 'Separate InputStream (bytes) from Reader (characters)', step: 1 },
    { text: 'Cut system calls with BufferedInputStream', step: 2 },
    { text: 'Close lazy Files.lines() streams with try-with-resources', step: 3 },
    { text: 'Trace ByteBuffer position, limit and flip()', step: 4 },
    { text: 'Serve many sockets with a Selector and epoll', step: 5 },
    { text: 'Avoid ObjectInputStream remote code execution', step: 6 },
  ],
  steps: [
    {
      short: 'Bytes · Chars',
      chapter: 'setup',
      title: 'InputStream gives bytes; Reader gives characters',
      body: [
        `A file contains <b>bytes</b>. <code>InputStream</code> hands them to you untouched. A <code>Reader</code> adds one more step: it decodes the bytes into characters using a <span class="term">Charset</span>.`,
        `Which charset? If you don’t say, Java picks the platform default on older versions — so “é” can turn into “Ã©” on another machine. Always pass <code>StandardCharsets.UTF_8</code>.`,
      ],
      changes: [`+ Charset decoder`, `+ Reader alt`],
      metrics: { layer: 'bytes', syscalls: '1 / read', encoding: 'none', risk: 'mojibake' },
      scene: {
        entities: {
          caller: caller(),
          io: ioSystem([`InputStream`], `raw bytes`, [{ text: `no charset`, tone: `amber` }]),
          source: source(`notes.txt`),
          kernel: kernel([`Charset`], `UTF-8`, `code`, [{ text: `decode`, tone: `violet` }]),
          alt: alt([`Reader`], `chars, not bytes`, [{ text: `UTF-8 explicit`, tone: `green` }]),
          card: card(`Bytes or text?`, [`new String(in.readAllBytes(), UTF_8);`, `= new InputStreamReader(in, UTF_8);   // say the charset`, `! new FileReader(f)   // platform default on Java < 18`]),
        },
        links: { call: links.call(`read()`), read: links.read(`bytes`), sys: links.sys(`decodes`) },
        flows: [{ route: ['call'], rate: 1.3, bounce: true }],
      },
    },
    {
      short: 'Buffered',
      chapter: 'technique',
      title: 'Buffered streams cut system calls ~8000×',
      body: [
        `Every <code>read()</code> on a bare <code>FileInputStream</code> is a <span class="term">system call</span>: a switch into the kernel that costs microseconds. Reading a 1 MB file byte by byte means a million of them.`,
        `<code>BufferedInputStream</code> is a <b>decorator</b>: it reads 8 KB per syscall into memory and serves your single-byte reads from there. Same API, one call per 8192 bytes.`,
      ],
      changes: [`~ io: BufferedInputStream`, `+ kernel syscall`],
      metrics: { layer: 'decorator', syscalls: '1 / 8 KB', encoding: 'any', risk: 'none' },
      scene: {
        entities: {
          caller: caller(),
          io: ioSystem([`Buffered`, `InputStream`], `8 KB buffer`, [{ text: `1 syscall / 8 KB`, tone: `green`, icon: `gauge` }], `layers`),
          source: source(`notes.txt`),
          kernel: kernel([`kernel`], `read() syscall`, `cpu`, [{ text: `~1 µs each`, tone: `amber` }]),
          card: card(`Wrap it once`, [`try (var in = new BufferedInputStream(`, `        new FileInputStream(file))) {`, `    int b;  while ((b = in.read()) != -1) { ... }`, `= 1 MB file: 128 syscalls, not 1,048,576`]),
        },
        links: { call: links.call(`read()`), read: links.read(`8 KB chunk`), sys: links.sys(`syscall`) },
        flows: [{ route: ['call'], rate: 2, bounce: true }, { route: ['sys'], kind: 'write', rate: 0.6 }],
      },
    },
    {
      short: 'Files.lines',
      chapter: 'problem',
      title: 'Files.lines() is lazy — and holds a file handle',
      body: [
        `<code>Files.lines(path)</code> (NIO.2) reads lazily: a line is fetched only when the stream needs it. That also means the file stays <b>open</b> until the stream is closed.`,
        `Forget to close it and each call leaks a file descriptor; after a few thousand the process dies with “Too many open files”. Always wrap it in <code>try-with-resources</code>.`,
      ],
      changes: [`~ io: Files.lines`, `~ source: fd 7 open`],
      metrics: { layer: 'NIO.2', syscalls: 'lazy', encoding: 'UTF-8', risk: 'fd leak' },
      scene: {
        entities: {
          caller: caller([{ text: `forgot close()`, tone: `red`, icon: `alert` }]),
          io: ioSystem([`Files.lines`], `lazy Stream`, [{ text: `still open`, tone: `red` }], `route`),
          source: source(`fd 7 · open`, [{ text: `leaked`, tone: `red`, icon: `alert` }]),
          alt: alt([`try-with`, `resources`], `closes fd`, [{ text: `safe`, tone: `green`, icon: `shield` }]),
          card: card(`Always close`, [`! Files.lines(p).forEach(...);   // fd never closed`, `try (Stream<String> s = Files.lines(p)) {`, `    s.filter(l -> l.contains("ERROR")).count();`, `= }   // closed even on exceptions`]),
        },
        links: { call: links.call(`lines(p)`), read: links.read(`holds fd`) },
        flows: [{ route: ['read'], kind: 'fail', rate: 0.9 }],
      },
    },
    {
      short: 'ByteBuffer',
      chapter: 'technique',
      title: 'ByteBuffer: position, limit and flip()',
      body: [
        `NIO channels read into a <code>ByteBuffer</code>, which tracks three numbers: <b>position</b> (next index), <b>limit</b> (first index you must not touch) and <b>capacity</b>. After <code>channel.read(buf)</code>, position is where the data ends.`,
        `<code>flip()</code> sets limit = position and position = 0 so you can <em>read</em> what was written. <code>clear()</code> resets for the next read. Forget <code>flip()</code> and you read garbage.`,
      ],
      changes: [`~ io: ByteBuffer`, `~ channel read`],
      metrics: { layer: 'buffer', syscalls: '1 / read', encoding: 'raw', risk: 'no flip' },
      scene: {
        entities: {
          caller: caller(),
          io: ioSystem([`ByteBuffer`], `pos · limit · cap`, [{ text: `pos 5 · limit 8`, tone: `violet`, icon: `gauge` }], `box`),
          source: source(`FileChannel`),
          kernel: kernel([`kernel`], `DMA to buffer`, `cpu`, [{ text: `direct`, tone: `green` }]),
          alt: alt([`flip()`], `limit = pos`, [{ text: `pos 0 · limit 5`, tone: `green` }]),
          card: card(`Fill, flip, drain`, [`var buf = ByteBuffer.allocate(8);`, `ch.read(buf);     // position = 5`, `buf.flip();        // limit = 5, position = 0`, `while (buf.hasRemaining()) use(buf.get());`, `buf.clear();`]),
        },
        links: { call: links.call(`get()`), read: links.read(`read(buf)`), sys: links.sys(`fills`) },
        flows: [{ route: ['read'], kind: 'write', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Selector',
      chapter: 'solution',
      title: 'One thread, 10,000 sockets',
      body: [
        `A classic server needs one thread per connection, and each thread sleeps on <code>read()</code>. 10,000 clients means 10,000 threads and gigabytes of stack.`,
        `A <span class="term">Selector</span> registers many non-blocking channels and asks the kernel (<code>epoll_wait</code>) <em>which ones are ready</em>. One thread then loops over only the active keys — the model behind Netty, Redis and Nginx.`,
      ],
      changes: [`~ io: Selector`, `~ source: 10,000 sockets`, `+ epoll`],
      metrics: { layer: 'Selector', syscalls: '1 epoll_wait', encoding: 'TCP bytes', risk: 'none' },
      scene: {
        entities: {
          caller: caller([{ text: `1 thread`, tone: `green` }]),
          io: ioSystem([`Selector`], `ready keys only`, [{ text: `3 of 10,000 ready`, tone: `violet`, icon: `zap` }], `filter`),
          source: source(`10,000 sockets`, [{ text: `non-blocking`, tone: `gray` }]),
          kernel: kernel([`epoll`], `epoll_wait()`, `radio`, [{ text: `1 syscall`, tone: `green` }]),
          card: card(`The event loop`, [`selector.select();                       // epoll_wait`, `for (var key : selector.selectedKeys()) {`, `    if (key.isReadable()) handleRead(key);`, `}`]),
        },
        links: { call: links.call(`select()`), read: links.read(`ready keys`), sys: links.sys(`epoll_wait`) },
        flows: [{ route: ['read'], rate: 1.6, bounce: true }, { route: ['sys'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'Serialization',
      chapter: 'recap',
      title: 'Never deserialize untrusted bytes',
      body: [
        `<code>ObjectInputStream.readObject()</code> rebuilds objects from bytes and runs their code while doing it. A crafted stream can chain existing classes (“gadgets”) into <b>remote code execution</b> — the reason Effective Java Item 85 says to avoid Java serialization.`,
        `Use <span class="term">JSON</span> or <span class="term">Protobuf</span> instead. If you must read Java serialization, set an <code>ObjectInputFilter</code> allow-list first.`,
      ],
      changes: [`~ io: ObjectInputStream`, `+ gadget chain`, `+ JSON/Protobuf alt`],
      metrics: { layer: 'objects', syscalls: 'n/a', encoding: 'binary', risk: 'RCE' },
      scene: {
        entities: {
          caller: caller(),
          io: ioSystem([`ObjectInput`, `Stream`], `readObject()`, [{ text: `runs code`, tone: `red`, icon: `alert` }], `skull`),
          source: source(`untrusted bytes`, [{ text: `attacker`, tone: `red` }]),
          kernel: kernel([`gadget`, `chain`], `Runtime.exec`, `skull`, [{ text: `RCE`, tone: `red` }]),
          alt: alt([`JSON /`, `Protobuf`], `data only`, [{ text: `safe`, tone: `green`, icon: `shield` }]),
          card: card(`Safer options`, [`! new ObjectInputStream(in).readObject();`, `= mapper.readValue(in, Order.class);   // JSON data only`, `ois.setObjectInputFilter(ObjectInputFilter.Config`, `    .createFilter("com.shop.*;!*"));`]),
        },
        links: { call: links.call(`readObject()`), read: links.read(`bytes`), sys: links.sys(`executes`) },
        flows: [{ route: ['sys'], kind: 'fail', rate: 1 }],
      },
    },
  ],
});
