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

const tn = 2;

const nn = (e = {}) => d(0, -15, { label: [`App`], ...e });

const rn = (e = {}) =>
    d(0, -5, { s: 4.4, h: 44, color: `green`, glyph: `zap`, label: [`Pages in`, `memory`], ...e });

const an = (e = {}) =>
    rn({ glyph: `listOrdered`, label: [`Memtable`], sub: `sorted · in memory`, ...e });

const on = { x0: 10.2, x1: 23.4, y0: -8.6, y1: -2.4 };

const sn = (e, t = []) => ({
    lz: x(on, `LOG FILE · APPEND ONLY`),
    wal: d(13, -5, { s: 4.0, h: 42, color: `yellow`, glyph: `scroll`, label: [`Log`], tags: t }),
    ent: ee(16.2, -5, e, [1, 0], { gap: 1.05, color: `#8d99ae` }),
  });

const cn = Array.from({ length: 10 }, (e, t) => -9.45 + t * 2.1);

const ln = { x0: -11, x1: 11, y0: 7.4, y1: 10.6 };

const un = (e = [], t = `data file · 8 KB pages`, n = {}) => {
    let r = { pz: x(ln, ``) };
    return (
      cn.forEach((i, a) => {
        r[`p${a}`] = d(i, 9, {
          s: 1.7,
          h: 11,
          radius: 3,
          color: `purple`,
          glyph: ``,
          label: [],
          heat: e.includes(a) ? 0.85 : 0,
          tags: a === 0 && t ? [{ text: t, icon: `file` }] : [],
          ...(n[a] || {}),
        });
      }),
      r
    );
  };

const dn = (e, t = {}) => h(`mem`, `p${e}`, [`mem`, [`mem`, tn], [cn[e], tn], `p${e}`], t);

const fn = (e, t = {}) => Object.fromEntries(e.map((e) => [`f${e}`, dn(e, t)]));

const pn = (e, t, n = {}) => ({
    routes: e.map((e) => ({ path: [`f${e}`] })),
    kind: `write`,
    rate: t,
    ...n,
  });

const mn = [1, 4, 6, 8];

const hn = [0, 2, 3, 5, 7, 9];

const gn = [-7.5, -2.5, 2.5, 7.5];

const _n = (e, t = [], n = {}) =>
    d(gn[e], 9, { s: 3.5, h: 13, radius: 4, color: `purple`, glyph: ``, label: [], tags: t, ...n });

const vn = (e = {}) => ({
    pz: x(ln, ``),
    s0: _n(0, e[0] || [{ text: `sorted files (SSTables) · oldest`, icon: `file` }]),
    s1: _n(1, e[1] || []),
    s2: _n(2, e[2] || []),
    s3: _n(3, e[3] || [{ text: `newest`, icon: `clock` }]),
  });

const yn = (e, t = {}) => h(`mem`, `s${e}`, [`mem`, [`mem`, tn], [gn[e], tn], `s${e}`], t);

const T = {
    am: (e = {}) => h(`app`, `mem`, [`app`, `mem`], { heads: `both`, ...e }),
    mw: (e = {}) => h(`mem`, `wal`, [`mem`, `wal`], e),
  };

const bn = (e = 1.4, t = {}) => ({ route: [`am`], kind: `write`, rate: e, bounce: !0, ...t });

const xn = (e = 1.4, t = {}) => ({ route: [`mw`], kind: `write`, rate: e, ...t });

const Sn = (e, t, n, r = {}) => S({ x: 0, y: -5, z: 0, dx: -398, dy: -196, ...r }, e, t, { icon: n });

const Cn = { crashSafe: `yes`, wps: 4e4, diskPattern: `log + random pages`, lookupCost: `3–4 pages` };

const wn = { crashSafe: `yes`, wps: 2e5, diskPattern: `all sequential`, lookupCost: `≈ 1 file` };

const Tn = (e = [{ text: `merged · newest values only`, tone: `green`, icon: `merge` }]) => ({
    app: nn(),
    mem: an(),
    ...sn(3),
    pz: x(ln, ``),
    big: d(-4, 9, { s: 5.2, h: 15, radius: 4, color: `purple`, glyph: ``, label: [], tags: e }),
    s3: _n(3, [{ text: `newest`, icon: `clock` }]),
  });

const En = () => ({ am: T.am(), mw: T.mw(), n3: yn(3, { label: `flush`, labelAt: 0.5 }) });

const Dn = () => [bn(3), xn(2.4), { route: [`n3`], kind: `heavy`, rate: 0.5 }];

const On = [-10.5, -6.3, -2.1, 2.1, 6.3, 10.5];

const kn = [`id`, `user`, `item`, `price`, `date`, `+35`];

export const storageEnginesLesson = {
    id: `storage-engines`,
    title: `Storage Engines`,
    summary: `What a database actually does with your write — and why some are built for reads and others for writes.`,
    minutes: 14,
    level: `intermediate`,
    metrics: [`crashSafe`, `wps`, `diskPattern`, `lookupCost`],
    legend: [
      [`write`, `write`],
      [`req`, `read`],
      `res`,
      [`heavy`, `flush / batch`],
      [`slow`, `page read from disk`],
      `fail`,
    ],
    goals: [
      { text: `Why “saved” needs a write-ahead log`, step: 2 },
      { text: `fsync, group commit and checkpoints`, step: 4 },
      { text: `How a B-tree engine reads and writes`, step: 5 },
      { text: `LSM-trees: memtable, SSTables, Bloom filters, compaction`, step: 9 },
      { text: `Choosing: B-tree or LSM, rows or columns`, step: 11 },
    ],
    steps: [
      {
        short: `Two places`,
        chapter: `setup`,
        title: `Memory and disk`,
        body: [
          `A database server has two places to keep data. <b>Memory</b> is fast — a change takes nanoseconds — but everything in it vanishes when the process stops. <b>Disk</b> survives a crash or a power cut, but a write that must be confirmed as truly on the device (an <code>fsync</code>) is thousands of times slower.`,
          `A <span class="term">storage engine</span> is the part of the database that decides what goes where, and when. Every design is a different answer to one question: how do you get the speed of memory and the safety of disk at once?`,
        ],
        callout: {
          kind: `insight`,
          text: `Tables are stored as fixed-size <b>pages</b> — typically 8 or 16 KB, each holding dozens of rows. The engine keeps recently used pages in memory and reads the rest from disk on demand.`,
        },
        metrics: { crashSafe: `?`, wps: `—`, diskPattern: `—`, lookupCost: `—` },
        scene: {
          entities: { app: nn(), mem: rn(), ...un() },
          links: { am: T.am(), ...fn(mn, { style: `dashed` }) },
          flows: [bn(1.2), pn(mn, 0.4)],
        },
      },
      {
        short: `Crash`,
        chapter: `problem`,
        title: `Fast and wrong: memory first, disk whenever`,
        body: [
          `The simplest engine: change the page in memory, reply “saved”, and copy changed pages to disk every few seconds in the background. Writes are blazing fast.`,
          `Then the power fails. Everything changed since the last background copy is gone — including orders that customers were told had gone through. Worse, a page that was half-written when the power died is now garbage: a <span class="term">torn page</span>.`,
        ],
        callout: {
          kind: `warn`,
          text: `“Saved” has to mean “survives a crash”. That is the D in ACID — <b>durability</b>.`,
        },
        changes: [
          `+ Reply “saved” as soon as memory is updated`,
          `− Power cut: the last few seconds of writes are lost`,
          `− One half-written page is corrupt`,
        ],
        metrics: { crashSafe: `no`, wps: 5e5, diskPattern: `random · whenever`, lookupCost: `—` },
        scene: {
          entities: {
            app: nn(),
            mem: rn({
              ...g,
              tags: [{ text: `power cut · 4 s of writes gone`, tone: `red`, icon: `power` }],
            }),
            ...un([], `data file · 8 KB pages`, {
              6: { heat: 0.9, tags: [{ text: `torn page`, tone: `red`, icon: `alert` }] },
            }),
          },
          links: { am: T.am({ fail: 1 }), ...fn(mn, { style: `off` }) },
          flows: [bn(1.6, { bounce: !1 })],
        },
      },
      {
        short: `Log first`,
        chapter: `solution`,
        title: `Write it down first: the write-ahead log`,
        body: [
          `The obvious fix — push every changed page to disk before replying — is safe but painfully slow: a whole 8 KB page rewritten at a random position, to save one 100-byte row.`,
          `Instead, describe the change in a few bytes and <b>append</b> it to a log file, forcing that to disk before replying. This is the <span class="term">write-ahead log</span> (WAL). Appending to the end of one file is the fastest thing a disk can do. The pages themselves are changed in memory and copied out later, at leisure.`,
          `<small>The speeds shown are for one ordinary SSD. Yours will differ; the ratios between the designs won’t.</small>`,
        ],
        callout: {
          kind: `insight`,
          text: `After a crash the engine replays the log and rebuilds exactly the state it had promised — repairing any torn pages along the way. The log is the truth; the pages are a convenient summary of it.`,
        },
        changes: [
          `+ Write-ahead log: append, then fsync`,
          `~ “Saved” only once the log entry is on disk`,
          `~ Data pages are copied out later, in the background`,
        ],
        metrics: { crashSafe: `yes`, wps: 5e3, diskPattern: `sequential log`, lookupCost: `—` },
        scene: {
          entities: {
            app: nn(),
            mem: rn(),
            ...un(),
            ...sn(4, [{ text: `fsync before “saved”`, tone: `green`, icon: `check` }]),
          },
          links: {
            am: T.am(),
            mw: T.mw({ label: `1 · append`, labelAt: 0.5 }),
            ...fn(mn, { style: `dashed` }),
          },
          flows: [{ route: [`am`, `mw`], kind: `write`, rate: 1.3, bounce: !0 }, pn(mn, 0.3)],
        },
      },
      {
        short: `How sure?`,
        chapter: `tradeoff`,
        title: `Case: how sure is “saved”?`,
        body: [
          `Forcing the log to disk takes a fraction of a millisecond on an SSD, and by default it happens once per transaction. At thousands of commits a second, that one step becomes the limit.`,
          `<span class="term">Group commit</span> helps for free: transactions that arrive in the same instant share a single fsync. Beyond that there is a dial. Most databases can sync on a timer instead — every 100 ms, or every second — multiplying throughput, and accepting that a crash loses the last moments of “saved” writes.`,
        ],
        callout: {
          kind: `warn`,
          text: `Know where your dial is set. Redis in append-only mode syncs once a second by default; PostgreSQL with <code>synchronous_commit = off</code> and MySQL with <code>innodb_flush_log_at_trx_commit = 2</code> can both lose the last moments before a power cut.`,
        },
        changes: [
          `+ Group commit: many transactions, one fsync`,
          `~ Writes 5,000 → 40,000 per second`,
          `~ Optional: sync on a timer — faster, but a crash loses the last moments`,
        ],
        metrics: { crashSafe: `yes`, wps: 4e4, diskPattern: `sequential log`, lookupCost: `—` },
        scene: {
          entities: {
            app: nn(),
            mem: rn(),
            ...un(),
            ...sn(6, [{ text: `1 fsync for 8 transactions`, tone: `green`, icon: `layers` }]),
            card: Sn(
              `The durability dial`,
              [
                `fsync every commit    safest · slowest`,
                `= group commit        same safety, shared fsync`,
                `fsync every 100 ms    fast · may lose 100 ms`,
                `! fsync never         fastest · may lose minutes`,
              ],
              `gauge`,
            ),
          },
          links: { am: T.am(), mw: T.mw(), ...fn(mn, { style: `dashed` }) },
          flows: [bn(3.2), xn(0.8, { kind: `heavy` }), pn(mn, 0.3)],
        },
      },
      {
        short: `Checkpoint`,
        chapter: `technique`,
        title: `The log can’t grow for ever`,
        body: [
          `Left alone, the log would grow without limit, and recovering from a crash would mean replaying days of it. So every few minutes the engine takes a <span class="term">checkpoint</span>: it copies all changed pages to the data file, notes “everything up to here is safely in the pages”, and throws the older log away.`,
          `Recovery then replays only the log written since the last checkpoint — seconds to a few minutes of work.`,
        ],
        callout: {
          kind: `tip`,
          text: `A checkpoint is a burst of scattered page writes. Databases spread them out over time; when they can’t keep up, you see it as periodic latency spikes.`,
        },
        changes: [
          `+ Checkpoint: copy changed pages out, trim the log`,
          `~ Crash recovery replays only the log since the checkpoint`,
        ],
        metrics: { crashSafe: `yes`, wps: 4e4, diskPattern: `log + random pages`, lookupCost: `—` },
        scene: {
          entities: {
            app: nn(),
            mem: rn({ tags: [{ text: `checkpoint: flushing`, icon: `flag` }] }),
            ...un(mn),
            ...sn(2, [{ text: `older entries discarded`, icon: `check` }]),
          },
          links: { am: T.am(), mw: T.mw(), ...fn(mn) },
          flows: [bn(2.4), xn(0.8, { kind: `heavy` }), pn(mn, 2.4)],
        },
      },
      {
        short: `B-tree`,
        chapter: `insight`,
        title: `The classic engine: pages and B-trees, updated in place`,
        body: [
          `What we just built is the design inside PostgreSQL, MySQL (InnoDB), SQL Server and Oracle. Data lives in fixed-size pages, found through <b>B-trees</b> (see <em>Indexes</em>) — in some engines the table itself is one. To change a row, the engine finds its page and modifies that page <em>in place</em>, with the log for safety.`,
          `It is excellent at reads. Any row is three or four page reads away — usually straight from memory — and neighbouring keys sit on neighbouring pages, so range scans are cheap.`,
        ],
        callout: {
          kind: `insight`,
          text: `One copy of every row, at a known address. That is what makes reads predictable — and why every write has to go and find that address.`,
        },
        changes: [
          `~ Reads: 3–4 pages, mostly from memory`,
          `~ Writes: find the page, change it in place`,
        ],
        metrics: Cn,
        scene: {
          entities: {
            app: nn(),
            mem: rn(),
            ...un([], `B-tree pages · updated in place`),
            ...sn(3),
          },
          links: { am: T.am(), mw: T.mw(), ...fn(mn, { heads: `both` }) },
          flows: [
            { route: [`am`], rate: 3, bounce: !0 },
            { routes: mn.map((e) => ({ path: [`f${e}`] })), kind: `slow`, rate: 0.6, bounce: !0 },
            bn(0.6),
            xn(0.5),
          ],
        },
      },
      {
        short: `Firehose`,
        chapter: `problem`,
        title: `Case: a firehose of writes`,
        body: [
          `Now the workload changes: sensor readings, chat messages, click events — 200,000 small writes a second, each for a different key. Every one lands on a different page. Memory fills with changed pages, and each must eventually be written back to its own spot on disk: a whole page, for a few bytes of change.`,
          `The log keeps up easily, because it is sequential. The <b>scattered page writes</b> don’t. Checkpoints fall behind, and write throughput is capped by how fast the disk can do random writes.`,
        ],
        callout: {
          kind: `warn`,
          text: `This is <b>write amplification</b>: storing 100 bytes costs a log record plus an 8 KB page write. On a write-heavy workload the disk can end up writing tens of times more bytes than you actually stored.`,
        },
        changes: [
          `~ Workload: 200,000 small writes/s, scattered keys`,
          `− Every page is dirty · checkpoints fall behind`,
          `~ Throughput stuck near 40,000 writes/s`,
        ],
        metrics: {
          crashSafe: `yes`,
          wps: `40,000 of 200,000`,
          diskPattern: `log + random pages`,
          lookupCost: `3–4 pages`,
        },
        scene: {
          entities: {
            app: nn({ label: [`200,000`, `writes / s`] }),
            mem: rn({
              ..._(1),
              heat: 0.7,
              tags: [{ text: `full of changed pages`, tone: `red`, icon: `alert` }],
            }),
            ...un([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], `B-tree pages · updated in place`),
            ...sn(8),
          },
          links: { am: T.am({ fail: 0.35 }), mw: T.mw(), ...fn(mn), ...fn(hn) },
          flows: [bn(6), xn(3), pn([...mn, ...hn], 5)],
        },
      },
      {
        short: `LSM-tree`,
        chapter: `solution`,
        title: `Never update in place: the LSM-tree`,
        body: [
          `A different design drops the idea that each row has one home. A write goes to the log and into a sorted structure in memory, the <span class="term">memtable</span>. That’s all — there is no page to find.`,
          `When the memtable fills up it is written to disk in one go as an immutable, sorted file — an <span class="term">SSTable</span> — and a fresh memtable starts. Every disk write is sequential. This is the <span class="term">log-structured merge tree</span> (LSM): the design behind Cassandra, HBase, ScyllaDB and RocksDB, the engine many other databases embed.`,
        ],
        callout: {
          kind: `tip`,
          text: `An update is just a newer entry with the same key; a delete is a marker called a <b>tombstone</b>. Nothing already on disk is ever modified.`,
        },
        changes: [
          `~ Pages in memory → memtable (sorted)`,
          `+ A full memtable is flushed as one sorted file`,
          `~ All disk writes sequential · 200,000 writes/s`,
        ],
        metrics: { crashSafe: `yes`, wps: 2e5, diskPattern: `all sequential`, lookupCost: `?` },
        scene: {
          entities: { app: nn({ label: [`200,000`, `writes / s`] }), mem: an(), ...sn(5), ...vn() },
          links: {
            am: T.am(),
            mw: T.mw(),
            n3: yn(3, { label: `flush: one sequential write`, labelAt: 0.5 }),
          },
          flows: [bn(6), xn(3), { route: [`n3`], kind: `heavy`, rate: 0.6 }],
        },
      },
      {
        short: `Find a key`,
        chapter: `problem`,
        title: `Case: where is my key?`,
        body: [
          `Reading is now the hard part. The newest value for a key might be in the memtable, or in any SSTable. Check them from newest to oldest: a key last written long ago — or one that doesn’t exist at all — costs a search of every file.`,
          `Two tricks rescue reads. Each SSTable carries a <b>Bloom filter</b> (see <em>Caching</em>) that answers “definitely not in this file” without touching the disk, and a small index of where each key range starts. A typical lookup then reads from just one file.`,
        ],
        callout: {
          kind: `insight`,
          text: `B-trees pay at write time to keep reads simple. LSM-trees keep writes simple and pay at read time. Every storage engine sits somewhere on that line.`,
        },
        changes: [
          `− A lookup may have to check every SSTable`,
          `+ A Bloom filter and a small index per file`,
          `~ Most lookups read a single file`,
        ],
        metrics: wn,
        scene: {
          entities: {
            app: nn(),
            mem: an({ tags: [{ text: `GET user:42 · not here`, icon: `search` }] }),
            ...sn(5),
            ...vn({
              0: [{ text: `not here`, icon: `filter` }],
              1: [{ text: `maybe → found`, tone: `green`, icon: `check` }],
              2: [{ text: `not here`, icon: `filter` }],
              3: [{ text: `not here`, icon: `filter` }],
            }),
          },
          links: {
            am: T.am(),
            mw: T.mw(),
            n0: yn(0, { style: `off` }),
            n1: yn(1, { heads: `both` }),
            n2: yn(2, { style: `off` }),
            n3: yn(3, { style: `off` }),
          },
          flows: [{ route: [`am`, `n1`], rate: 2.2, bounce: !0 }, bn(1), xn(0.8)],
        },
      },
      {
        short: `Compaction`,
        chapter: `technique`,
        title: `Compaction: tidying up in the background`,
        body: [
          `Files pile up, and the older ones are full of values that have since been overwritten or deleted. So a background process keeps <b>merging</b> SSTables: read a few sorted files, write one new sorted file that keeps only the newest value of each key, delete the inputs.`,
          `This is <span class="term">compaction</span>. It limits how many files a read has to consider, and gives the space back. It is also the price of the design: every byte is rewritten several times over its life, and compaction competes with live traffic for the disk.`,
        ],
        callout: {
          kind: `warn`,
          text: `If writes outrun compaction, files accumulate, reads slow down and the disk fills up. Watching the compaction backlog is the first rule of running an LSM database.`,
        },
        changes: [
          `+ Compaction merges three files into one`,
          `− Overwritten values and tombstones are dropped`,
          `~ Fewer files to consider on every read`,
        ],
        metrics: wn,
        scene: { entities: Tn(), links: En(), flows: Dn() },
      },
      {
        short: `Choosing`,
        chapter: `tradeoff`,
        title: `B-tree or LSM?`,
        body: [
          `<table class="compare">
          <thead><tr><th></th><th>B-tree</th><th>LSM-tree</th></tr></thead>
          <tbody>
            <tr><td>Writes</td><td>Scattered page updates</td><td>Sequential appends</td></tr>
            <tr><td>Reads</td><td>A few pages, predictable</td><td>Several files; filters help</td></tr>
            <tr><td>Space</td><td>Pages left part-empty</td><td>Compact, compresses well</td></tr>
            <tr><td>Background</td><td>Checkpoints</td><td>Compaction</td></tr>
            <tr><td>Found in</td><td>PostgreSQL, MySQL</td><td>Cassandra, RocksDB</td></tr>
          </tbody>
        </table>`,
          `Read-heavy, with range queries and transactions: a B-tree. Write-heavy, huge and mostly appended: an LSM-tree. Several newer SQL databases — CockroachDB, TiDB, MyRocks — put SQL on top of an LSM engine.`,
        ],
        callout: {
          kind: `insight`,
          text: `You rarely choose a storage engine directly; you choose a database and inherit its engine. Knowing which one is underneath explains most of how it behaves under load.`,
        },
        metrics: wn,
        scene: {
          entities: Tn([{ text: `sorted files · never modified`, icon: `file` }]),
          links: En(),
          flows: Dn(),
        },
      },
      {
        short: `Columns`,
        chapter: `insight`,
        title: `Case: rows or columns?`,
        body: [
          `One more axis. Both engines so far keep each <b>row</b> together — ideal when you fetch or change whole records. But an analyst asks for <code>SELECT SUM(price) FROM orders</code> across two billion rows, and a row store has to read all 40 columns of every row to add up one of them.`,
          `A <span class="term">column store</span> keeps each column in its own file. The query reads only <code>price</code> — a fortieth of the data — and because similar values sit side by side, it compresses several times over. That is how warehouses such as BigQuery, Snowflake, Redshift and ClickHouse scan billions of rows in seconds.`,
        ],
        callout: {
          kind: `tip`,
          text: `Row stores serve the app: many small reads and writes. Column stores serve analytics: a few enormous scans. It is why data gets copied from one to the other — see <em>Batch & Stream Processing</em>.`,
        },
        changes: [
          `+ Analytics query: SUM(price) over 2 billion rows`,
          `− Row store: every column of every row is read`,
          `+ Column store: 1 column of 40`,
        ],
        metrics: {
          crashSafe: `yes`,
          wps: `—`,
          diskPattern: `—`,
          lookupCost: `scan: 1 of 40 columns`,
        },
        scene: {
          entities: {
            app: nn({ label: [`Analytics`, `query`], glyph: `chart`, color: `orange` }),
            ...un([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], `row store · every page read`),
            cz: x({ x0: -12.8, x1: 12.8, y0: -3.4, y1: 1.4 }, ``),
            ...Object.fromEntries(
              On.map((e, t) => [
                `c${t}`,
                d(e, -1, {
                  s: 3.1,
                  h: 12,
                  radius: 4,
                  color: t === 3 ? `green` : `slab`,
                  glyph: ``,
                  label: [kn[t]],
                  tags:
                    t === 0 ? [{ text: `column store · one file per column`, icon: `sheets` }] : [],
                }),
              ]),
            ),
          },
          links: {
            col: h(`app`, `c3`, [`app`, [`app`, -8], [On[3], -8], `c3`], {
              heads: `both`,
              label: `reads 1 column of 40`,
              labelTone: `green`,
              labelAt: 0.45,
            }),
            scan: h(`app`, null, [`app`, [-15, `app`], [-15, 6.6], [11, 6.6]], { heads: `none` }),
          },
          flows: [
            { route: [`col`], rate: 1.6, bounce: !0 },
            { route: [`scan`], kind: `slow`, rate: 0.5, speed: 0.5 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Memory is fast and forgetful; disk is durable and slow. A storage engine bridges the two.</li>
          <li>The <b>write-ahead log</b> makes “saved” true: append, fsync, then reply.</li>
          <li>How often you <b>fsync</b> is a durability dial — know where yours is set.</li>
          <li><b>B-trees</b> update pages in place: predictable reads, scattered writes.</li>
          <li><b>LSM-trees</b> only append: fast writes, paid for with compaction and harder reads.</li>
          <li><b>Column stores</b> serve analytics by reading only the columns a query needs.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Replication</b> — what to do when one database server can’t take all the reads, or might die.`,
        },
        metrics: wn,
        scene: {
          entities: Tn([{ text: `sorted files · never modified`, icon: `file` }]),
          links: En(),
          flows: Dn(),
        },
      },
    ],
  };

export default storageEnginesLesson;
