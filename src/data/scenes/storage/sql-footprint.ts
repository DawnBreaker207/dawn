import {
  makeBlock,
  makeDb,
  makeDevice,
  makeLink,
  makePanel
} from '@/lib/simulator/scene-builders';

export const sqlFootprintLesson = {
  id: `sql-footprint`,
  title: `PostgreSQL 8KB Page Anatomy & Table Bloat`,
  summary: `Look inside an 8KB PostgreSQL disk block: PageHeader, Line Pointers, HeapTupleHeader, Fillfactor, and Table/Index Bloat.`,
  minutes: 13,
  level: `intermediate`,
  metrics: [`page_size`, `free_space`, `live_tuples`, `dead_tuples`, `bloat_pct`],
  legend: [`req`, `res`, [`ping`, `tuple write`], `fail`],
  goals: [
    { text: 'Anatomy of an 8KB page', step: 1 },
    { text: 'HeapTupleHeader', step: 2 },
    { text: 'Fillfactor: Leaving free space', step: 3 },
    { text: 'How UPDATE & DELETE create', step: 4 },
    { text: 'VACUUM, Free Space Map (FSM)', step: 5 },
    { text: 'HOT Updates & TOAST Out-of-Line Storage', step: 6 },
  ],
  steps: [
    {
      short: `Page Anatomy`,
      chapter: `technique`,
      title: `Inside an 8KB PostgreSQL Page`,
      body: [
        `PostgreSQL stores data in fixed-size <strong>8192-byte pages</strong> on disk and in memory:`,
        `• <strong>PageHeaderData</strong> (24 bytes): Page LSN, checksum, and offsets to free space.`,
        `• <strong>Line Pointers</strong> (ItemId, 4 bytes each): Grow downward from header.`,
        `• <strong>Tuple Data</strong>: Stored from the bottom of the page growing upward.`,
      ],
      callout: { kind: `insight`, text: `TID (ItemPointer) is a pair (page_number, line_pointer_index) pointing directly to a row.` },
      metrics: { page_size: `8192 B`, free_space: `3420 B`, live_tuples: `82 rows`, dead_tuples: `0`, bloat_pct: `0%` },
      scene: {
        entities: {
          header_block: makeBlock(-11, -4, { s: 3.8, h: 42, color: `blue`, glyph: `file`, label: [`Page Header`], sub: `24 Bytes LSN` }),
          free_space: makeBlock(0, -4, { s: 3.8, h: 42, color: `green`, glyph: `box`, label: [`Free Space`], sub: `Middle Hole` }),
          tuples_block: makeBlock(11, -4, { s: 3.8, h: 42, color: `purple`, glyph: `layers`, label: [`Tuple Data`], sub: `Bottom-Up` }),
        },
        links: {
          hf: makeLink(`header_block`, `free_space`, [`header_block`, `free_space`], { heads: `end`, label: `pd_lower ↓` }),
          tf: makeLink(`tuples_block`, `free_space`, [`tuples_block`, `free_space`], { heads: `end`, label: `pd_upper ↑` }),
        },
        flows: [
          { route: [`hf`, `tf`], bounce: true, rate: 1.5 },
        ],
      },
    },
    {
      short: `Tuple Header`,
      chapter: `technique`,
      title: `HeapTupleHeader: 23-Byte Row Overhead`,
      body: [
        `Every single row in PostgreSQL carries a mandatory <strong>23-byte header</strong> before user data:`,
        `• <code>t_xmin</code> (4B): Transaction ID of creating transaction.`,
        `• <code>t_xmax</code> (4B): Transaction ID of deleting/updating transaction.`,
        `• <code>t_cid / t_xvac</code> (4B): Command identifier.`,
        `• <code>t_infomask</code> (4B): Flags (committed, aborted, has nulls).`,
      ],
      callout: { kind: `tip`, text: `Narrow tables (e.g. 2 integer columns = 8B data) spend 75% of disk storage on row headers!` },
      metrics: { page_size: `8192 B`, free_space: `2800 B`, live_tuples: `120 rows`, dead_tuples: `0`, bloat_pct: `0%` },
      scene: {
        entities: {
          pointer: makeBlock(-11, -4, { s: 3.8, h: 42, color: `yellow`, glyph: `route`, label: [`Line Pointer`], sub: `ItemId (4B)` }),
          tuple_hdr: makeBlock(0, -4, { s: 3.8, h: 42, color: `orange`, glyph: `shield`, label: [`Tuple Header`], sub: `xmin / xmax 23B` }),
          payload: makeBlock(11, -4, { s: 3.8, h: 42, color: `teal`, glyph: `database`, label: [`User Columns`], sub: `Data Payload` }),
        },
        links: {
          pt: makeLink(`pointer`, `tuple_hdr`, [`pointer`, `tuple_hdr`], { heads: `end`, label: `offset` }),
          tp: makeLink(`tuple_hdr`, `payload`, [`tuple_hdr`, `payload`], { heads: `end`, label: `null bitmap` }),
        },
        flows: [
          { route: [`pt`, `tp`], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Fillfactor`,
      chapter: `technique`,
      title: `Fillfactor & HOT (Heap-Only Tuple) Optimization`,
      body: [
        `By default, tables use <code>fillfactor = 100</code> (pack pages completely). When a row is UPDATEd, the new version must be written to another page, requiring every index to add a new pointer.`,
        `Setting <code>fillfactor = 85</code> reserves 15% free space in each page. Updates stay inside the same page (HOT Update), avoiding expensive index updates entirely.`,
      ],
      callout: { kind: `insight`, text: `HOT updates produce near-zero index bloat and keep write latencies low.` },
      metrics: { page_size: `8192 B`, free_space: `1228 B (15%)`, live_tuples: `70 rows`, dead_tuples: `0`, bloat_pct: `0%` },
      scene: {
        entities: {
          client: makeDevice(-11, -4, { label: `Client`, tags: [{ text: `UPDATE balance`, icon: `zap` }] }),
          hot_page: makeBlock(0, -4, { s: 3.8, h: 42, color: `green`, glyph: `server`, label: [`HOT Page`], sub: `fillfactor 85` }),
          index_root: makeDb(11, -4, { r: 2.2, h: 36, label: `B-Tree Index (No Change)`, color: `blue` }),
        },
        links: {
          ch: makeLink(`client`, `hot_page`, [`client`, `hot_page`], { heads: `end`, label: `in-page update` }),
          hi: makeLink(`hot_page`, `index_root`, [`hot_page`, `index_root`], { heads: `none`, label: `index untouched` }),
        },
        flows: [
          { route: [`ch`], bounce: false, rate: 2.2 },
        ],
      },
    },
    {
      short: `Bloat Creation`,
      chapter: `problem`,
      title: `How UPDATE & DELETE Cause Table & Index Bloat`,
      body: [
        `PostgreSQL MVCC never modifies rows in place. An <code>UPDATE</code> is an append (INSERT new row + set xmax on old row). A <code>DELETE</code> just marks xmax.`,
        `Old rows remain on disk as <strong>Dead Tuples</strong> until vacuumed. If transactions hold old snapshots, dead tuples cannot be cleaned, bloating disk pages and degrading sequential scans.`,
      ],
      callout: { kind: `warn`, text: `A long-running query or uncommitted transaction blocks VACUUM across the entire database.` },
      metrics: { page_size: `8192 B`, free_space: `400 B`, live_tuples: `40 rows`, dead_tuples: `95 rows`, bloat_pct: `68% Bloat` },
      scene: {
        entities: {
          writer: makeBlock(-11, -4, { s: 3.8, h: 42, color: `rose`, glyph: `alertTriangle`, label: [`Heavy UPDATEs`], sub: `xid: 10420` }),
          bloated_page: makeBlock(0, -4, { s: 3.8, h: 42, color: `purple`, glyph: `archive`, label: [`Bloated Page`], sub: `Dead Tuples` }),
          long_txn: makeDevice(11, -4, { label: `Long Txn Reader`, tags: [{ text: `Snapshot Active`, tone: `red`, icon: `clock` }] }),
        },
        links: {
          wb: makeLink(`writer`, `bloated_page`, [`writer`, `bloated_page`], { heads: `end`, label: `creates dead tuples` }),
          lb: makeLink(`long_txn`, `bloated_page`, [`long_txn`, `bloated_page`], { heads: `none`, label: `pins xmin horizon` }),
        },
        flows: [
          { route: [`wb`], bounce: false, rate: 1.8 },
        ],
      },
    },
    {
      short: `VACUUM`,
      chapter: `deep`,
      title: `Autovacuum & Free Space Map (FSM)`,
      body: [
        `<strong>Autovacuum</strong> periodically scans pages, removes dead tuples, and records reclaimed free space in the <strong>Free Space Map (FSM)</strong> so future INSERTs can reuse the bytes.`,
        `Standard VACUUM does not shrink the file on disk. To return physical bytes to the OS, use <code>VACUUM FULL</code> (exclusive lock) or <code>pg_repack</code> (online).`,
      ],
      callout: { kind: `tip`, text: `Tune autovacuum_vacuum_scale_factor = 0.05 on large tables so autovacuum triggers after 5% updates instead of default 20%.` },
      metrics: { page_size: `8192 B`, free_space: `4200 B Reclaimed`, live_tuples: `40 rows`, dead_tuples: `0`, bloat_pct: `Clean` },
      scene: {
        entities: {
          vacuum: makeBlock(-11, -4, { s: 4.4, h: 48, color: `blue`, glyph: `workflow`, label: [`Autovacuum`], sub: `Worker` }),
          clean_page: makeBlock(0, -4, { s: 3.8, h: 42, color: `green`, glyph: `server`, label: [`Clean Page`], sub: `Dead Purged` }),
          fsm: makeDb(11, -4, { r: 2.2, h: 36, label: `Free Space Map`, color: `teal` }),
        },
        links: {
          vc: makeLink(`vacuum`, `clean_page`, [`vacuum`, `clean_page`], { heads: `end`, label: `sweep dead rows` }),
          cf: makeLink(`clean_page`, `fsm`, [`clean_page`, `fsm`], { heads: `end`, label: `register free bytes` }),
        },
        flows: [
          { route: [`vc`, `cf`], bounce: false, rate: 1.6 },
        ],
      },
    },
    {
      short: `HOT & TOAST`,
      chapter: `deep`,
      title: `HOT Updates & TOAST Large-Value Storage`,
      body: [
        `If an <code>UPDATE</code> modifies only non-indexed columns and the same 8KB page has free space (thanks to <code>fillfactor=80</code>), PostgreSQL performs a <strong>HOT (Heap-Only Tuple)</strong> update — skipping all B-Tree index updates!`,
        `Values larger than ~2KB (long JSONB/TEXT) are compressed and moved out-of-line into a separate <strong>TOAST</strong> table, keeping main heap pages compact.`,
      ],
      callout: { kind: `insight`, text: `Set fillfactor = 80 on update-heavy tables so HOT updates stay on the same 8KB page without index bloat.` },
      metrics: { page_size: `8192 B`, free_space: `fillfactor=80`, live_tuples: `HOT Chain`, dead_tuples: `0 idx writes`, bloat_pct: `TOAST >2KB` },
      scene: {
        entities: {
          upd: makeBlock(-14, -10, { s: 4.6, h: 52, color: `green`, glyph: `zap`, label: [`HOT UPDATE`], sub: `same 8KB page` }),
          page: makeBlock(0, -10, { s: 4.6, h: 52, color: `blue`, glyph: `layers`, label: [`8KB Heap Page`], sub: `0 index write` }),
          toast: makeDb(15, -10, { r: 2.2, h: 48, color: `purple`, label: [`TOAST Table`], sub: `>2KB off-page` }),
          card: makePanel({ x: -12, y: 12 }, `HOT Updates & TOAST Threshold`, [
            `ALTER TABLE orders SET (fillfactor = 80);`,
            `-- HOT update: non-indexed col + free space on page = 0 index writes!`,
            `-- TOAST: values > 2KB compressed (LZ4/pglz) & stored out-of-line`,
          ], { icon: `terminal` }),
        },
        links: {
          up_pg: makeLink(`upd`, `page`, [`upd`, `page`], { heads: `end`, label: `same page` }),
          pg_ts: makeLink(`page`, `toast`, [`page`, `toast`], { heads: `end`, label: `>2KB JSONB` }),
        },
        flows: [{ route: [`up_pg`, `pg_ts`], bounce: false, rate: 1.8 }],
      },
    },
  ],
};
export default sqlFootprintLesson;
