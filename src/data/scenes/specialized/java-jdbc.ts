import { fromScreen, makeBlock, makeDb, makeLink, makePanel, cardAt } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One fixed path for the whole lesson: a request thread borrows a warm connection
// from HikariCP and talks to PostgreSQL over it. Each step changes how that one
// path is used (statements, cursors, transactions, batches), and a second thread
// arrives only to show what a leaked connection does to everyone else.
//
//   Thread 1 ──borrow──► HikariCP ══TCP══► PostgreSQL
//   Thread 2 ──┘

/** Screen position (px) → world grid point. */
const toIso = (sx: number, sy: number) => fromScreen(sx, sy, 2);

type Tag = { text: string; tone?: string; icon?: string };

const positions = {
  t1: toIso(-280, -10),
  t2: toIso(-190, 170),
  pool: toIso(-20, 40),
  db: toIso(240, -30),
};

const t1 = (tags: Tag[] = []) =>
  makeBlock(positions.t1.x, positions.t1.y, { s: 4.4, h: 52, color: `blue`, glyph: `cpu`, label: [`Thread 1`], sub: `request`, tags });
const t2 = (tags: Tag[] = []) =>
  makeBlock(positions.t2.x, positions.t2.y, { s: 4.4, h: 52, color: `blue`, glyph: `cpu`, label: [`Thread 2`], sub: `request`, tags });
const pool = (tags: Tag[] = []) =>
  makeBlock(positions.pool.x, positions.pool.y, { s: 4.6, h: 54, color: `purple`, glyph: `layers`, label: [`HikariCP`], sub: `10 conns`, tags });
const database = (tags: Tag[] = []) => makeDb(positions.db.x, positions.db.y, { r: 2.2, h: 48, label: `PostgreSQL`, tags });

const links = {
  borrow: makeLink(`t1`, `pool`, [`t1`, `pool`], { heads: `both`, label: `borrow` }),
  borrowQuiet: makeLink(`t1`, `pool`, [`t1`, `pool`], { heads: `both` }),
  wire: makeLink(`pool`, `db`, [`pool`, `db`], { heads: `both`, label: `warm TCP` }),
  wireQuiet: makeLink(`pool`, `db`, [`pool`, `db`], { heads: `both` }),
  wait: makeLink(`t2`, `pool`, [`t2`, `pool`], { heads: `both`, label: `getConnection` }),
  waitQuiet: makeLink(`t2`, `pool`, [`t2`, `pool`], { heads: `both` }),
};

/** Code card above the path, clear of all three blocks. */
const card = cardAt({ x: positions.pool.x, y: positions.pool.y, dx: -245, dy: -300 }, `code`);

const base = (o: { t1?: Tag[]; pool?: Tag[]; db?: Tag[] } = {}) => ({
  t1: t1(o.t1),
  pool: pool(o.pool),
  db: database(o.db),
});

export const javaJdbcLesson: Lesson = {
  id: 'java-jdbc',
  title: 'JDBC Pool, TX & Batching',
  summary:
    'What Spring and Hibernate do underneath: HikariCP pooling, PreparedStatement, streaming ResultSets, manual transactions, batching and connection leaks.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['borrow', 'inUse', 'roundTrips', 'heapRows'],
  legend: ['req', 'res', ['heavy', 'row chunk / batch'], ['fail', 'rollback / timeout']],
  goals: [
    { text: 'Replace slow DriverManager with HikariCP DataSource', step: 1 },
    { text: 'Prevent SQL Injection & cache plans with PreparedStatement', step: 2 },
    { text: 'Stream large ResultSets via cursor & setFetchSize()', step: 3 },
    { text: 'Control atomic TX with setAutoCommit(false) & rollback', step: 4 },
    { text: 'Speed up bulk inserts 20x via addBatch() / executeBatch()', step: 5 },
    { text: 'Prevent Connection Pool Exhaustion via try-with-resources', step: 7 },
  ],
  steps: [
    {
      short: 'DataSource',
      chapter: 'setup',
      title: 'Borrow a warm connection instead of opening one',
      body: [
        '<code>DriverManager.getConnection()</code> opens a fresh TCP socket, TLS session and Postgres login on every call — 30–100 ms before the first query.',
        'A pooled <code>DataSource</code> (<strong>HikariCP</strong>) keeps a few connections open. <code>getConnection()</code> borrows one in microseconds and <code>close()</code> hands it back.',
      ],
      callout: {
        kind: 'insight',
        text: 'close() on a pooled connection does not close the socket — it returns the handle to the pool.',
      },
      metrics: { borrow: '0.02 ms', inUse: '1 / 10', roundTrips: 1, heapRows: 0 },
      scene: {
        entities: {
          ...base({ pool: [{ text: `1 of 10 in use`, tone: `green` }] }),
          card: card(`DataSource vs DriverManager`, [
            `// new socket + TLS + login every time (~50 ms)`,
            `DriverManager.getConnection(url, user, pass);`,
            `// borrow a warm one from HikariCP (~20 µs)`,
            `try (Connection c = dataSource.getConnection()) {`,
            `  ...`,
            `} // close() = give it back`,
          ]),
        },
        links: { borrow: links.borrow, wire: links.wire },
        flows: [{ route: ['borrow'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'Prepared',
      chapter: 'technique',
      title: 'PreparedStatement: the SQL and the data travel separately',
      body: [
        'Gluing user input into a SQL string lets the input change the query (<code>\' OR \'1\'=\'1</code>) and forces a re-parse every time.',
        '<code>PreparedStatement</code> sends the template with <code>?</code> placeholders and the values separately. The database can reuse the plan, and a value can never become SQL.',
      ],
      callout: {
        kind: 'warn',
        text: 'Never concatenate input into SQL — in JdbcTemplate or @Query too, always bind ? or :named parameters.',
      },
      changes: ['~ query sent as template + bound value'],
      metrics: { borrow: '0.02 ms', inUse: '1 / 10', roundTrips: 1, heapRows: 1 },
      scene: {
        entities: {
          ...base({ t1: [{ text: `? = 42`, tone: `violet` }], db: [{ text: `plan cached`, tone: `green` }] }),
          card: card(`OrderDao.java`, [
            `String sql = "SELECT * FROM orders WHERE id = ?";`,
            `try (var ps = conn.prepareStatement(sql)) {`,
            `  ps.setLong(1, orderId);  // data, never SQL`,
            `  try (var rs = ps.executeQuery()) { ... }`,
            `}`,
          ]),
        },
        links: { borrow: links.borrowQuiet, wire: links.wireQuiet },
        flows: [{ route: ['borrow', 'wire'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'Streaming',
      chapter: 'technique',
      title: 'A ResultSet is a cursor — stream it in chunks',
      body: [
        'By default the Postgres driver reads the <em>whole</em> result into the heap before <code>next()</code> returns. 5 million rows means an <code>OutOfMemoryError</code>.',
        'With <code>autoCommit</code> off and <code>setFetchSize(500)</code>, the driver pulls 500 rows per round trip from a server-side cursor; heap use stays flat.',
      ],
      callout: {
        kind: 'tip',
        text: 'On PostgreSQL setFetchSize() is ignored while autoCommit is true — the cursor needs a transaction.',
      },
      changes: ['~ rows arrive 500 at a time', '~ heap holds 500 rows, not 5M'],
      metrics: { borrow: '0.02 ms', inUse: '1 / 10', roundTrips: '10,000', heapRows: 500 },
      scene: {
        entities: {
          ...base({ t1: [{ text: `heap: 500 rows`, tone: `green` }], db: [{ text: `cursor · 5M rows`, icon: `layers` }] }),
          card: card(`ExportJob.java`, [
            `conn.setAutoCommit(false);  // needed for a cursor`,
            `ps.setFetchSize(500);       // 500 rows per trip`,
            `try (var rs = ps.executeQuery()) {`,
            `  while (rs.next()) write(rs.getLong("id"));`,
            `}`,
          ]),
        },
        links: { borrow: links.borrowQuiet, wire: links.wireQuiet },
        flows: [
          { route: ['wire'], kind: 'heavy', rate: 1.6, bounce: true },
          { route: ['borrow'], rate: 1.2, bounce: true },
        ],
      },
    },
    {
      short: 'Transaction',
      chapter: 'solution',
      title: 'Two writes, one decision: commit or roll back',
      body: [
        'With the default <code>autoCommit = true</code> every statement commits on its own. Crash between the debit and the credit and the money is simply gone.',
        '<code>setAutoCommit(false)</code> groups the statements on this connection: <code>commit()</code> keeps both, <code>rollback()</code> undoes both.',
      ],
      callout: {
        kind: 'insight',
        text: 'Spring @Transactional runs exactly this setAutoCommit(false) / commit() / rollback() sequence for you.',
      },
      changes: ['+ BEGIN on the borrowed connection', '! credit fails → rollback undoes debit'],
      metrics: { borrow: '0.02 ms', inUse: '1 / 10', roundTrips: 4, heapRows: 0 },
      scene: {
        entities: {
          ...base({
            t1: [{ text: `autoCommit=false`, tone: `violet` }],
            db: [
              { text: `debit ✓`, tone: `green` },
              { text: `credit ✗ → rollback`, tone: `red`, icon: `undo` },
            ],
          }),
          card: card(`TransferService.java`, [
            `conn.setAutoCommit(false);`,
            `try { debit(conn); credit(conn); conn.commit(); }`,
            `catch (SQLException e) { conn.rollback(); throw e; }`,
            `finally { conn.setAutoCommit(true); }`,
          ]),
        },
        links: { borrow: links.borrowQuiet, wire: links.wireQuiet },
        flows: [
          { route: ['borrow', 'wire'], rate: 1.2, bounce: true },
          { route: ['wire'], kind: 'fail', rate: 0.6 },
        ],
      },
    },
    {
      short: 'Batching',
      chapter: 'technique',
      title: 'Batch 10,000 inserts into 20 round trips',
      body: [
        '10,000 separate <code>executeUpdate()</code> calls pay 10,000 network round trips.',
        '<code>addBatch()</code> collects parameter sets on the client; <code>executeBatch()</code> every 500 rows sends them together. With <code>reWriteBatchedInserts=true</code> Postgres gets multi-row INSERTs.',
      ],
      callout: {
        kind: 'tip',
        text: 'Hibernate uses the same JDBC batching when hibernate.jdbc.batch_size is set.',
      },
      changes: ['~ 10,000 round trips → 20'],
      metrics: { borrow: '0.02 ms', inUse: '1 / 10', roundTrips: 20, heapRows: 500 },
      scene: {
        entities: {
          ...base({ t1: [{ text: `addBatch × 500`, tone: `violet` }], db: [{ text: `10,000 rows · 20 trips`, tone: `green` }] }),
          card: card(`ImportJob.java`, [
            `// URL: ...?reWriteBatchedInserts=true`,
            `for (int i = 0; i < items.size(); i++) {`,
            `  ps.setString(1, items.get(i)); ps.addBatch();`,
            `  if (i % 500 == 499) ps.executeBatch();`,
            `}`,
            `ps.executeBatch();`,
          ]),
        },
        links: { borrow: links.borrowQuiet, wire: links.wireQuiet },
        flows: [{ route: ['wire'], kind: 'heavy', rate: 0.7, bounce: true }],
      },
    },
    {
      short: 'Leak',
      chapter: 'problem',
      title: 'One leaked connection at a time, the pool runs dry',
      body: [
        'An exception thrown before a manual <code>close()</code> leaves the connection borrowed forever. Each leak permanently removes one of the 10.',
        'When all 10 are gone, every other request waits in <code>getConnection()</code> until <code>connectionTimeout</code> (30 s) — the app looks down while the database is idle.',
      ],
      callout: {
        kind: 'warn',
        text: 'Pool exhaustion looks like a database outage. It is usually a leak, or slow remote calls inside a transaction.',
      },
      changes: ['+ Thread 2', '! 10 of 10 connections leaked', '! Thread 2 times out after 30 s'],
      metrics: { borrow: '30,000 ms', inUse: '10 / 10', roundTrips: 0, heapRows: 0 },
      scene: {
        entities: {
          ...base({
            t1: [{ text: `never closed`, tone: `red`, icon: `alert` }],
            pool: [{ text: `10 of 10 in use`, tone: `red`, icon: `alert` }],
          }),
          t2: t2([{ text: `waiting 30 s`, tone: `red`, icon: `hourglass` }]),
          card: card(`the leak`, [
            `Connection c = ds.getConnection();`,
            `var rs = c.prepareStatement(sql).executeQuery();`,
            `parse(rs);   // throws → c.close() never runs`,
            `c.close();`,
            `! SQLTransientConnectionException: timed out`,
          ]),
        },
        links: { borrow: links.borrowQuiet, wire: links.wireQuiet, wait: links.wait },
        flows: [{ route: ['wait'], kind: 'fail', rate: 1 }],
      },
    },
    {
      short: 'Fix',
      chapter: 'solution',
      title: 'try-with-resources always gives it back',
      body: [
        'Open <code>Connection</code>, <code>PreparedStatement</code> and <code>ResultSet</code> in one <code>try (...)</code>. They close in reverse order even when the body throws.',
        'Turn on <code>leakDetectionThreshold</code> in development: Hikari logs the stack trace of any connection held longer than the limit.',
      ],
      callout: {
        kind: 'tip',
        text: 'spring.datasource.hikari.leak-detection-threshold=2000 points at the exact line that forgot to close.',
      },
      changes: ['~ connections always returned', '~ Thread 2 gets one immediately'],
      metrics: { borrow: '0.02 ms', inUse: '2 / 10', roundTrips: 2, heapRows: 1 },
      scene: {
        entities: {
          ...base({ t1: [{ text: `try-with-resources`, tone: `green` }], pool: [{ text: `2 of 10 in use`, tone: `green` }] }),
          t2: t2([{ text: `got conn ✓`, tone: `green` }]),
          card: card(`OrderDao.java`, [
            `try (var c = ds.getConnection();`,
            `     var ps = c.prepareStatement(sql);`,
            `     var rs = ps.executeQuery()) {`,
            `  return parse(rs);`,
            `} // rs → ps → c closed, even on exceptions`,
          ]),
        },
        links: { borrow: links.borrowQuiet, wire: links.wireQuiet, wait: links.waitQuiet },
        flows: [
          { route: ['borrow', 'wire'], rate: 1.2, bounce: true },
          { route: ['wait', 'wire'], rate: 1.2, bounce: true },
        ],
      },
    },
  ],
};
