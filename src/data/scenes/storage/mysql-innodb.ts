import {
  makeBlock,
  makeDb,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const mysqlInnodbLesson: Lesson = {
  id: 'mysql-innodb',
  title: 'MySQL InnoDB Internals vs PostgreSQL',
  summary:
    'Master MySQL InnoDB architecture and how it differs from PostgreSQL: Clustered Index (IOT), Secondary Index PK lookup, Undo Log MVCC (zero VACUUM), 16KB Buffer Pool & Doublewrite, and Next-Key / Gap Locks.',
  minutes: 15,
  level: 'intermediate',
  metrics: ['index_layout', 'mvcc_engine', 'page_safety', 'locking_mode'],
  legend: ['flow', ['req', 'index / write'], ['res', 'undo / redo'], ['fail', 'split / gap lock']],
  goals: [
    { text: 'Understand InnoDB Clustered Index (Index-Organized Table)', step: 1 },
    { text: 'Trace Secondary Index -> PK Double Lookup & Covering Index', step: 2 },
    { text: 'Contrast InnoDB Undo Log MVCC vs PostgreSQL Heap MVCC', step: 3 },
    { text: 'Protect 16KB Pages with Buffer Pool, Redo & Doublewrite', step: 4 },
    { text: 'Block Phantom Reads via Record, Gap & Next-Key Locks', step: 5 },
    { text: 'Compare MySQL InnoDB vs PostgreSQL Trade-offs', step: 6 },
  ],
  steps: [
    {
      short: 'Clustered PK',
      chapter: 'storage',
      title: 'Clustered Index: Table IS the Primary Key B+Tree',
      body: [
        'In PostgreSQL, the table (Heap) and its indexes are separate. In <strong>MySQL InnoDB</strong>, the table data itself lives inside the leaf nodes of the <strong>Clustered Index</strong> sorted by <code>PRIMARY KEY</code>.',
        'Because rows are physically ordered by PK, sequential PKs (<code>AUTO_INCREMENT</code> or <code>UUIDv7</code>) append cleanly. Random <code>UUIDv4</code> causes constant B+Tree page splits and fragmentation!',
      ],
      callout: {
        kind: 'warn',
        text: 'Never use random UUIDv4 as an InnoDB PRIMARY KEY — it shatters Buffer Pool locality and causes 50% page fill bloat.',
      },
      metrics: { index_layout: 'Clustered B+Tree', mvcc_engine: 'In-place', page_safety: '16KB Page', locking_mode: 'Row PK' },
      scene: {
        entities: {
          pk: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['PRIMARY KEY'], sub: 'AUTO_INC/UUIDv7' }),
          btree: makeBlock(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['Clustered B+Tree'], sub: 'PK = Table' }),
          leaf: makeDb(15, -10, { r: 2.2, h: 48, color: 'blue', label: ['Leaf 16KB Page'], sub: 'full row data' }),
          card: makePanel({ x: -12, y: 12 }, 'Clustered Index (Index-Organized Table)', [
            '-- InnoDB: Leaf node of PK B+Tree CONTAINS the full row!',
            '-- Good PK: BIGINT AUTO_INCREMENT or UUIDv7 (monotonic)',
            '-- Bad PK:  CHAR(36) UUIDv4 -> random page splits everywhere',
          ], { icon: 'terminal' }),
        },
        links: {
          pk_bt: makeLink('pk', 'btree', ['pk', 'btree'], { heads: 'end', label: 'sorted key' }),
          bt_lf: makeLink('btree', 'leaf', ['btree', 'leaf'], { heads: 'end', label: 'stores row' }),
        },
        flows: [{ route: ['pk_bt', 'bt_lf'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Double Lookup',
      chapter: 'storage',
      title: 'Secondary Index Double Lookup (Bookmark Lookup)',
      body: [
        'In InnoDB, a Secondary Index (e.g. on <code>email</code>) does <strong>not</strong> store a physical disk address — it stores the <strong>PRIMARY KEY value</strong> (so PK page splits don’t break secondary indexes).',
        'A query by <code>email</code> must traverse the Secondary B+Tree to get <code>id</code>, then traverse the Clustered PK B+Tree to fetch the row — unless you use a <strong>Covering Index</strong>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Keep InnoDB PRIMARY KEY narrow (BIGINT 8B, not VARCHAR(64)) because EVERY Secondary Index embeds a copy of the PK!',
      },
      changes: ['+ Secondary Index leaf stores (email, PK_id)', '+ Narrow PK shrinks every Secondary Index'],
      metrics: { index_layout: '2x B+Tree Hop', mvcc_engine: 'In-place', page_safety: 'Covering skips', locking_mode: 'Row PK' },
      scene: {
        entities: {
          sec: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'cyan', glyph: 'layers', label: ['idx_email'], sub: 'stores PK id' }),
          pk: makeBlock(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'workflow', label: ['Clustered PK'], sub: '2nd B+Tree hop' }),
          row: makeDb(15, -10, { r: 2.2, h: 48, color: 'green', label: ['Full Row'], sub: 'fetched' }),
          card: makePanel({ x: -12, y: 12 }, 'Why PK Size Multiplies Across All Indexes', [
            'SELECT * FROM users WHERE email = \'a@b.com\';',
            '-- Hop 1: idx_email -> finds id = 42',
            '-- Hop 2: Clustered PK -> finds full row for id = 42',
            '-- Fix: SELECT id, status ... with INDEX(email, status) = 1 hop!',
          ], { icon: 'terminal' }),
        },
        links: {
          sc_pk: makeLink('sec', 'pk', ['sec', 'pk'], { heads: 'end', label: 'lookup PK' }),
          pk_rw: makeLink('pk', 'row', ['pk', 'row'], { heads: 'end', label: 'read row' }),
        },
        flows: [{ route: ['sc_pk', 'pk_rw'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Undo MVCC',
      chapter: 'mvcc',
      title: 'In-Place Update & Undo Log MVCC (No VACUUM)',
      body: [
        'PostgreSQL appends a brand-new tuple into the Heap on every <code>UPDATE</code> (causing bloat that requires <code>VACUUM</code>).',
        'InnoDB updates the row <strong>in-place</strong> and writes the previous column delta into the <strong>Undo Log</strong> linked via <code>DB_ROLL_PTR</code>. Older transactions follow the undo chain backward via their <strong>ReadView</strong>; purge threads reclaim undo logs automatically.',
      ],
      callout: {
        kind: 'insight',
        text: 'InnoDB Undo Log MVCC means zero Heap table bloat on updates — no Autovacuum wraparound crisis!',
      },
      changes: ['+ UPDATE mutates Clustered leaf in-place', '+ DB_ROLL_PTR links to Undo Log version chain'],
      metrics: { index_layout: 'In-place leaf', mvcc_engine: 'Undo Log Chain', page_safety: 'Auto Purge', locking_mode: 'ReadView' },
      scene: {
        entities: {
          upd: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'zap', label: ['UPDATE Row'], sub: 'in-place edit' }),
          leaf: makeBlock(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Latest Tuple'], sub: 'trx_id + roll_ptr' }),
          undo: makeDb(15, -10, { r: 2.2, h: 48, color: 'purple', label: ['Undo Log'], sub: 'old versions' }),
          card: makePanel({ x: -12, y: 12 }, 'InnoDB Undo Log vs Postgres Heap MVCC', [
            '// Hidden InnoDB row columns: DB_TRX_ID (6B) + DB_ROLL_PTR (7B)',
            '// InnoDB: UPDATE overwrites in-place + appends delta to Undo Log',
            '// Postgres: UPDATE inserts new Heap tuple -> needs VACUUM',
          ], { icon: 'terminal' }),
        },
        links: {
          up_lf: makeLink('upd', 'leaf', ['upd', 'leaf'], { heads: 'end', label: 'in-place' }),
          lf_un: makeLink('leaf', 'undo', ['leaf', 'undo'], { heads: 'end', label: 'roll_ptr' }),
        },
        flows: [{ route: ['up_lf', 'lf_un'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Buffer & Redo',
      chapter: 'durability',
      title: 'Buffer Pool, Redo Log, Binlog (2PC) & Doublewrite',
      body: [
        'InnoDB caches 16KB pages in the <strong>Buffer Pool</strong> and buffers random non-unique secondary index writes in the <strong>Change Buffer</strong>.',
        'For crash safety: <strong>Redo Log</strong> provides physical page durability (<code>innodb_flush_log_at_trx_commit = 1</code>), <strong>Doublewrite Buffer</strong> prevents 16KB torn pages, and internal <strong>2PC</strong> keeps Redo Log in sync with <strong>Binlog</strong> (for replication).',
      ],
      callout: {
        kind: 'tip',
        text: 'Doublewrite Buffer protects 16KB InnoDB pages if power fails mid-write across 4KB OS disk blocks.',
      },
      changes: ['+ Redo Log + Binlog synchronized via internal 2PC', '+ Doublewrite Buffer prevents 16KB torn pages'],
      metrics: { index_layout: 'Change Buffer', mvcc_engine: 'Redo + Binlog', page_safety: 'Doublewrite 16K', locking_mode: '2PC Sync' },
      scene: {
        entities: {
          bp: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['Buffer Pool'], sub: '16KB pages' }),
          redo: makeDb(0, -16, { r: 2.1, h: 46, color: 'green', label: ['Redo + Binlog'], sub: 'internal 2PC' }),
          dbl: makeDb(0, -2, { r: 2.1, h: 46, color: 'purple', label: ['Doublewrite'], sub: 'anti-torn page' }),
          disk: makeDb(15, -10, { r: 2.2, h: 48, color: 'cyan', label: ['ibd Datafile'], sub: 'durable 16KB' }),
          card: makePanel({ x: -12, y: 12 }, 'InnoDB Crash-Safe ACID Settings', [
            'innodb_buffer_pool_size = 70%_RAM',
            'innodb_flush_log_at_trx_commit = 1  -- fsync Redo on COMMIT',
            'sync_binlog = 1                     -- fsync Binlog for replicas',
          ], { icon: 'terminal' }),
        },
        links: {
          bp_rd: makeLink('bp', 'redo', ['bp', 'redo'], { heads: 'end', label: 'WAL' }),
          bp_db: makeLink('bp', 'dbl', ['bp', 'dbl'], { heads: 'end', label: 'stage 16K' }),
          db_dk: makeLink('dbl', 'disk', ['dbl', 'disk'], { heads: 'end', label: 'flush' }),
        },
        flows: [{ route: ['bp_rd'], kind: 'res', rate: 1.9 }, { route: ['bp_db', 'db_dk'], kind: 'req', rate: 1.7 }],
      },
    },
    {
      short: 'Gap/Next-Key',
      chapter: 'locking',
      title: 'Record Lock, Gap Lock & Next-Key Lock',
      body: [
        'At MySQL’s default <strong><code>REPEATABLE READ</code></strong>, plain <code>SELECT</code> uses Lock-Free MVCC ReadView, while locking reads (<code>FOR UPDATE</code>) acquire <strong>Next-Key Locks</strong> = <strong>Record Lock</strong> (the index row) + <strong>Gap Lock</strong> (the open interval before it).',
        'Gap Locks prevent other transactions from inserting Phantom rows into the range — but concurrent Gap Locks can cause <strong>Insert Intention Deadlocks</strong>!',
      ],
      callout: {
        kind: 'warn',
        text: 'InnoDB locks index ranges (Gap Locks) in REPEATABLE READ; switching to READ COMMITTED disables Gap Locks and reduces deadlocks.',
      },
      changes: ['+ Next-Key Lock = Record Lock + Gap Lock', '+ Blocks Phantom INSERTs in REPEATABLE READ'],
      metrics: { index_layout: 'Index Range', mvcc_engine: 'ReadView', page_safety: 'Phantom Free', locking_mode: 'Next-Key Lock' },
      scene: {
        entities: {
          tx1: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['SELECT..FOR UPD'], sub: 'locks (10, 20]' }),
          gap: makeBlock(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['Next-Key Lock'], sub: 'Gap + Record' }),
          tx2: makeBlock(15, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['INSERT id=15'], sub: 'WAIT / Deadlock' }),
          card: makePanel({ x: -12, y: 12 }, 'How InnoDB Gap Locks Block Phantoms', [
            '-- Tx1 (REPEATABLE READ):',
            'SELECT * FROM orders WHERE id BETWEEN 10 AND 20 FOR UPDATE;',
            '-- Tx2 tries INSERT INTO orders (id) VALUES (15); -> BLOCKED!',
            '-- Need fewer gap-lock deadlocks? Use READ COMMITTED + Binlog ROW',
          ], { icon: 'terminal' }),
        },
        links: {
          t1_gp: makeLink('tx1', 'gap', ['tx1', 'gap'], { heads: 'end', label: 'hold (10,20]' }),
          gp_t2: makeLink('gap', 'tx2', ['gap', 'tx2'], { heads: 'end', label: 'blocks gap', style: 'dashed' }),
        },
        flows: [{ route: ['t1_gp', 'gp_t2'], kind: 'fail', rate: 1.7 }],
      },
    },
    {
      short: 'PG vs MySQL',
      chapter: 'compare',
      title: 'Choosing Between PostgreSQL & MySQL InnoDB',
      body: [
        '<strong>MySQL InnoDB</strong> shines on high-PK-read OLTP, zero-VACUUM updates (Undo Log), and lightweight thread-per-connection scaling.',
        '<strong>PostgreSQL</strong> shines on complex SQL/analytics, rich index types (GIN/GiST/BRIN), parallel queries, transactional DDL, and strict SQL compliance + extensions (<code>pgvector</code>, PostGIS).',
      ],
      callout: {
        kind: 'insight',
        text: 'Both are rock-solid ACID engines: pick InnoDB for simple PK-heavy OLTP without VACUUM tuning; pick Postgres for rich queries & extensibility.',
      },
      changes: ['+ Side-by-side InnoDB vs PostgreSQL architecture matrix'],
      metrics: { index_layout: 'IOT vs Heap', mvcc_engine: 'Undo vs Tuple', page_safety: '16K vs 8K+TOAST', locking_mode: 'Gap vs SSI' },
      scene: {
        entities: {
          mysql: makeBlock(-10, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'server', label: ['MySQL InnoDB'], sub: 'Clustered + Undo' }),
          pg: makeBlock(12, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'server', label: ['PostgreSQL'], sub: 'Heap + xmin/xmax' }),
          card: makePanel({ x: -12, y: 12 }, 'MySQL InnoDB vs PostgreSQL Summary', [
            'Storage:  InnoDB = Clustered PK (16KB) | PG = Heap + ctid (8KB)',
            'MVCC:     InnoDB = In-place + Undo Log | PG = Tuple + VACUUM',
            'Phantoms: InnoDB = Next-Key Gap Locks  | PG = Snapshot + SSI',
            'Conns:    InnoDB = Threads (light)     | PG = Processes (+PgBouncer)',
          ], { icon: 'terminal' }),
        },
        links: {
          my_pg: makeLink('mysql', 'pg', ['mysql', 'pg'], { heads: 'both', label: 'compare engines' }),
        },
        flows: [{ route: ['my_pg'], kind: 'res', rate: 1.6 }],
      },
    },
  ],
};
