import { fromScreen, makeBlock, makeLink, makePanel, makeQueue, makeZone, cardAt, type Tag, type SceneOpts } from '@/lib/simulator/scene-builders';

// One broker, one partition, for the whole lesson. Records are appended to the
// partition log (amber dots); later steps add the sparse index, the OS page cache
// and a consumer — and show how a read leaves the machine without a single copy.
//
//   producer ── broker ── page cache ── consumer
//                 │  └── partition log (segments)
//               index

// Screen-grid positions (px) so every pair of blocks is >= 185 px apart and every link <= 360 px.
const IDX = fromScreen(-60, -185);
const CACHE = fromScreen(170, 10);
const CONS = fromScreen(40, 185);

const producer = (o: SceneOpts = {}) =>
  makeBlock(-2, -17, { s: 4.4, h: 48, color: `blue`, glyph: `send`, label: [`Producer`], sub: `orders app`, ...o });
const broker = (tags: Tag[] = [], o: SceneOpts = {}) =>
  makeBlock(-2, -3, { s: 5, h: 56, color: `slab`, glyph: `server`, label: [`Broker`], sub: `kafka-1`, tags, ...o });
const logZone = (label = `orders-0 LOG`) => makeZone({ x0: -4.5, x1: 0.5, y0: 3, y1: 14 }, label);
/** Sealed segment (grey) + active segment (amber) — the log grows along +y. */
const sealed = (n: number) => makeQueue(-2, 4.2, n, [0, 1], { color: `#cfc6b8` });
const active = (n: number, start = 4.2) => makeQueue(-2, start, n, [0, 1]);
const index = (tags: Tag[] = []) =>
  makeBlock(IDX.x, IDX.y, { s: 4.4, h: 52, color: `purple`, glyph: `listOrdered`, label: [`.index`], sub: `sparse, mmap`, tags });
const cache = (tags: Tag[] = []) =>
  makeBlock(CACHE.x, CACHE.y, { s: 4.6, h: 52, color: `green`, glyph: `layers`, label: [`Page cache`], sub: `OS memory`, tags });
const consumer = (tags: Tag[] = []) =>
  makeBlock(CONS.x, CONS.y, { s: 4.4, h: 52, color: `green`, glyph: `inbox`, label: [`Consumer`], sub: `analytics`, tags });

const links = {
  produce: makeLink(`producer`, `broker`, [`producer`, `broker`], { label: `append` }),
  produceQuiet: makeLink(`producer`, `broker`, [`producer`, `broker`]),
  append: makeLink(`broker`, `log`, [`broker`, `log`]),
  lookup: makeLink(`broker`, `index`, [`broker`, `index`], { heads: `both` }),
  fetch: makeLink(`consumer`, `broker`, [`consumer`, `broker`], { heads: `both` }),
  fetchReq: makeLink(`consumer`, `broker`, [`consumer`, `broker`], { style: `off` }),
  cached: makeLink(`broker`, `cache`, [`broker`, `cache`], { heads: `both` }),
  zeroCopy: makeLink(`cache`, `consumer`, [`cache`, `consumer`], { label: `sendfile()` }),
  zeroCopyQuiet: makeLink(`cache`, `consumer`, [`cache`, `consumer`]),
};

/** Artifact card, parked above the stage on the right. */
const card = cardAt({ x: CACHE.x, y: CACHE.y, dx: 40, dy: -250 });

export const kafkaStorageEngineLesson = {
  id: `kafka-storage-engine`,
  title: `Kafka Storage Internals: PageCache & Zero-Copy`,
  summary: `How one Kafka broker keeps up with a 10 Gbps network on plain disks: append-only segments, a sparse index, the OS page cache and sendfile().`,
  minutes: 14,
  level: `intermediate`,
  metrics: [`append`, `segments`, `hitRate`, `copies`],
  legend: [`req`, `res`, [`msg`, `record`], [`write`, `disk / cache write`]],
  goals: [
    { text: `Why sequential disk writes are fast`, step: 1 },
    { text: `Segments: .log, .index, .timeindex`, step: 2 },
    { text: `Finding an offset with a sparse index`, step: 3 },
    { text: `Serving reads from the OS page cache`, step: 4 },
    { text: `Zero-copy reads with sendfile()`, step: 5 },
    { text: `Log compaction keeps the latest per key`, step: 6 },
  ],
  steps: [
    {
      short: `Append only`,
      chapter: `setup`,
      title: `A partition is a file you only append to`,
      body: [
        `Disks are slow when they jump around (<b>random I/O</b>). Kafka never jumps: every record for a partition is written to the <b>end</b> of one file, so the disk only ever does long <span class="term">sequential writes</span>.`,
        `Sequential writes run at hundreds of MB/s even on spinning disks and several GB/s on NVMe — fast enough that a disk-backed log can keep up with the network.`,
      ],
      metrics: { append: `850 MB/s`, segments: 1, hitRate: null, copies: null },
      scene: {
        entities: {
          producer: producer(),
          broker: broker(),
          log: logZone(),
          seg: active(5),
          card: card(`fio · same NVMe disk`, [`$ fio --rw=randwrite --bs=4k ...`, `  WRITE: bw=180MiB/s`, `$ fio --rw=write --bs=1m ...`, `= WRITE: bw=3200MiB/s`], `gauge`),
        },
        links: { produce: links.produce, append: links.append },
        flows: [
          { route: [`produce`], kind: `msg`, rate: 2.4 },
          { route: [`append`], kind: `write`, rate: 2.4 },
        ],
      },
    },
    {
      short: `Segments`,
      chapter: `technique`,
      title: `The log is split into segments`,
      body: [
        `One endless file would be impossible to clean up, so each partition is a folder of <span class="term">segments</span>. Only the newest (active) segment is written; when it reaches 1 GB or 7 days it is sealed and a new one starts.`,
        `Each segment is three files named after its first offset: <code>.log</code> (the records), <code>.index</code> (offset → byte position) and <code>.timeindex</code> (time → offset). Deleting old data is just deleting old files.`,
      ],
      changes: [`~ Segment 0 sealed at 1 GB`, `+ Active segment 1`],
      metrics: { append: `850 MB/s`, segments: 2, hitRate: null, copies: null },
      scene: {
        entities: {
          producer: producer(),
          broker: broker([{ text: `roll at 1 GB`, icon: `refresh` }]),
          log: logZone(),
          sealed: sealed(5),
          seg: active(3, 9.6),
          card: card(`$ ls /data/orders-0`, [`$ ls /data/orders-0`, `00000000000000000000.log        1.0G`, `00000000000000000000.index      10M`, `00000000000000000000.timeindex  10M`, `= 00000000000010485760.log  ← active`], `file`),
        },
        links: { produce: links.produceQuiet, append: links.append },
        flows: [
          { route: [`produce`], kind: `msg`, rate: 2.4 },
          { route: [`append`], kind: `write`, rate: 2.4 },
        ],
      },
    },
    {
      short: `Sparse index`,
      chapter: `technique`,
      title: `Finding offset 402 without scanning`,
      body: [
        `A consumer asks for records from offset 402. Indexing every record would cost too much memory, so the <span class="term">sparse index</span> keeps one entry about every 4 KB of log.`,
        `The broker binary-searches the memory-mapped <code>.index</code> for the closest entry at or below 402 (offset 400 → byte 16384), seeks there and scans forward two records.`,
      ],
      changes: [`+ Sparse index`, `+ Consumer fetching from offset 402`],
      metrics: { append: `850 MB/s`, segments: 2, hitRate: null, copies: 4 },
      scene: {
        entities: {
          producer: producer(),
          broker: broker(),
          log: logZone(),
          sealed: sealed(5),
          seg: active(3, 9.6),
          index: index([{ text: `400 → byte 16384`, tone: `violet` }]),
          consumer: consumer([{ text: `fetch @402`, tone: `violet` }]),
          card: card(`dump the index`, [`$ kafka-dump-log.sh --files 0000...0000.index`, `offset: 396 position: 12288`, `= offset: 400 position: 16384`, `offset: 408 position: 20480`], `search`),
        },
        links: { produce: links.produceQuiet, append: links.append, lookup: links.lookup, fetch: links.fetch },
        flows: [
          { route: [`fetch`], rate: 1.2, bounce: true },
          { route: [`lookup`], rate: 1.2, bounce: true },
        ],
      },
    },
    {
      short: `Page cache`,
      chapter: `insight`,
      title: `The cache is the operating system’s, not Kafka’s`,
      body: [
        `Kafka does not keep records in the JVM heap — that would double their size and feed the garbage collector. Writes land in the Linux <span class="term">page cache</span> and the kernel flushes them to disk in the background.`,
        `Consumers that keep up read data that was written seconds ago, so it is still in memory: almost no read touches the disk. A broker restart doesn’t even empty the cache.`,
      ],
      changes: [`+ OS page cache`, `~ 99% of reads served from memory`],
      metrics: { append: `850 MB/s`, segments: 2, hitRate: 99, copies: 4 },
      scene: {
        entities: {
          producer: producer(),
          broker: broker([{ text: `heap 6 GB only`, icon: `cpu` }]),
          log: logZone(),
          sealed: sealed(5),
          seg: active(4, 9.6),
          index: index(),
          cache: cache([{ text: `hit 99%`, tone: `green` }]),
          consumer: consumer(),
          card: card(`$ free -g  (64 GB broker)`, [`$ free -g`, `       total   used   buff/cache`, `= Mem:   64      7       55`], `layers`),
        },
        links: { produce: links.produceQuiet, append: links.append, lookup: links.lookup, cached: links.cached, fetch: links.fetch },
        flows: [
          { route: [`produce`], kind: `msg`, rate: 2 },
          { route: [`cached`], kind: `write`, rate: 1.6, bounce: true },
          { route: [`fetch`], rate: 1.2, bounce: true },
        ],
      },
    },
    {
      short: `Zero-copy`,
      chapter: `technique`,
      title: `Bytes go from cache to network card untouched`,
      body: [
        `A normal server copies a file four times to send it: disk → kernel cache → app buffer → socket buffer → network card. Kafka stores records in exactly the format consumers receive, so it doesn’t need to look at them.`,
        `It calls <code>sendfile()</code> (Java’s <code>FileChannel.transferTo</code>): the kernel hands pages straight from the page cache to the network card. No copies through the JVM — one broker can fill a 10 Gbps link at low CPU.`,
      ],
      changes: [`~ Fetch answered by sendfile()`, `~ CPU copies 4 → 0`],
      metrics: { append: `850 MB/s`, segments: 2, hitRate: 99, copies: 0 },
      scene: {
        entities: {
          producer: producer(),
          broker: broker(),
          log: logZone(),
          sealed: sealed(5),
          seg: active(4, 9.6),
          index: index(),
          cache: cache([{ text: `hit 99%`, tone: `green` }]),
          consumer: consumer([{ text: `1.1 GB/s`, tone: `green`, icon: `gauge` }]),
          card: card(`strace on the broker`, [`$ strace -f -e sendfile -p $(pgrep -f kafka)`, `= sendfile(212, 87, [16384], 1048576) = 1048576`, `# page cache → socket, no user-space copy`], `zap`),
        },
        links: { produce: links.produceQuiet, append: links.append, lookup: links.lookup, cached: links.cached, fetch: links.fetchReq, zeroCopy: links.zeroCopy },
        flows: [
          { route: [`produce`], kind: `msg`, rate: 2 },
          { route: [`fetch`], rate: 0.8 },
          { route: [`zeroCopy`], kind: `msg`, rate: 3.6 },
        ],
      },
    },
    {
      short: `Compaction`,
      chapter: `technique`,
      title: `Compaction keeps the latest value per key`,
      body: [
        `By default old segments are deleted after 7 days. With <code>cleanup.policy=compact</code> the <span class="term">log cleaner</span> instead rewrites old segments and drops every record that has a newer one with the same key.`,
        `What remains is the latest value for every key — a changelog you can replay to rebuild a table. A record with a <code>null</code> value (a <b>tombstone</b>) deletes the key. <code>__consumer_offsets</code> works exactly this way.`,
      ],
      changes: [`~ Sealed segment compacted: 5 → 2 records`],
      metrics: { append: `850 MB/s`, segments: 2, hitRate: 99, copies: 0 },
      scene: {
        entities: {
          producer: producer(),
          broker: broker([{ text: `log cleaner`, icon: `refresh` }]),
          log: logZone(),
          sealed: sealed(2),
          seg: active(4, 9.6),
          index: index(),
          cache: cache(),
          consumer: consumer(),
          card: card(`compact a users topic`, [`$ kafka-configs.sh --alter --topic users \\`, `    --add-config cleanup.policy=compact`, `before: u42=a@x  u7=b@y  u42=c@x  u42=d@x`, `= after:  u7=b@y  u42=d@x`], `refresh`),
        },
        links: { produce: links.produceQuiet, append: links.append, lookup: links.lookup, cached: links.cached, fetch: links.fetchReq, zeroCopy: links.zeroCopyQuiet },
        flows: [
          { route: [`append`], kind: `write`, rate: 1.6 },
          { route: [`zeroCopy`], kind: `msg`, rate: 2 },
        ],
      },
    },
    {
      short: `Recap`,
      chapter: `recap`,
      title: `Let the operating system do the work`,
      body: [
        `Kafka’s speed is mostly the kernel’s: sequential appends, the page cache for reads and <code>sendfile()</code> for the network. The broker’s job is to stay out of the way.`,
        `So production brokers get a small JVM heap and lots of free RAM, XFS with <code>noatime</code>, several plain disks (JBOD) rather than RAID 5, and smooth background flushing.`,
      ],
      metrics: { append: `1.2 GB/s`, segments: 2, hitRate: 99, copies: 0 },
      scene: {
        entities: {
          producer: producer(),
          broker: broker([{ text: `XFS · noatime`, icon: `check`, tone: `green` }]),
          log: logZone(),
          sealed: sealed(5),
          seg: active(4, 9.6),
          index: index(),
          cache: cache([{ text: `hit 99%`, tone: `green` }]),
          consumer: consumer(),
          card: card(`broker host tuning`, [`$ sysctl -w vm.dirty_background_ratio=5`, `$ sysctl -w vm.dirty_ratio=10`, `$ mount -o noatime /dev/nvme1n1 /data`, `# KAFKA_HEAP_OPTS="-Xmx6g" · rest is page cache`], `settings`),
        },
        links: { produce: links.produce, append: links.append, lookup: links.lookup, cached: links.cached, fetch: links.fetchReq, zeroCopy: links.zeroCopy },
        flows: [
          { route: [`produce`], kind: `msg`, rate: 2.4 },
          { route: [`append`], kind: `write`, rate: 2.4 },
          { route: [`zeroCopy`], kind: `msg`, rate: 3.2 },
        ],
      },
    },
  ],
};
