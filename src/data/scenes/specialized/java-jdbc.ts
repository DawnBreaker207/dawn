/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaJdbcLesson: Lesson = {
  id: 'java-jdbc',
  title: 'JDBC Pool, TX & Batching',
  summary:
    'Understand what Spring & Hibernate do underneath: HikariCP DataSource pooling, PreparedStatement SQL injection defense, ResultSet streaming, TX rollback, and JDBC batching.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['conn_source', 'statement', 'tx_mode', 'throughput'],
  legend: ['flow', ['req', 'borrow / exec'], ['res', 'commit / batch'], ['fail', 'leak / inject']],
  goals: [
    { text: 'Replace slow DriverManager with HikariCP DataSource', step: 1 },
    { text: 'Prevent SQL Injection & cache plans with PreparedStatement', step: 2 },
    { text: 'Stream large ResultSets via cursor & setFetchSize()', step: 3 },
    { text: 'Control atomic TX with setAutoCommit(false) & rollback', step: 4 },
    { text: 'Speed up bulk inserts 20x via addBatch() / executeBatch()', step: 5 },
    { text: 'Prevent Connection Pool Exhaustion via try-with-resources', step: 6 },
  ],
  steps: [
    {
      short: 'DataSource',
      chapter: 'jdbc',
      title: '1. Why DriverManager Fails vs HikariCP DataSource',
      body: [
        '<code>DriverManager.getConnection()</code> opens a brand-new TCP socket + TLS + Postgres auth handshake on every call (~30–100 ms!).',
        'A pooled <code>DataSource</code> (<strong>HikariCP</strong>) keeps warm persistent TCP connections ready in RAM: <code>ds.getConnection()</code> borrows one in microseconds and <code>close()</code> returns it to the pool.',
      ],
      callout: {
        kind: 'insight',
        text: 'Calling conn.close() on a pooled Connection does NOT close the TCP socket — it returns the handle to HikariCP.',
      },
      metrics: { conn_source: 'HikariCP Pool', statement: 'Pending', tx_mode: 'AutoCommit', throughput: '~0.01ms borrow' },
      scene: {
        entities: {
          app: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['App Thread'], sub: 'getConn()' }),
          pool: b(2, -6, { r: 2.3, h: 50, color: 'green', label: ['HikariCP'], sub: '10 warm TCPs' }),
          card: S({ x: -12, y: 12 }, '1. Connection Pooling vs Raw DriverManager', [
            '// Slow: opens new TCP + auth (~50ms) every query:',
            '// DriverManager.getConnection(url, user, pass);',
            '// Fast: HikariDataSource borrows warm socket (~10us):',
            'try (Connection conn = dataSource.getConnection()) { ... }',
          ], { icon: 'terminal' }),
        },
        links: {
          ap_pl: h('app', 'pool', ['app', 'pool'], { heads: 'end', label: 'borrow conn' }),
        },
        flows: [{ route: ['ap_pl'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'PreparedStmt',
      chapter: 'jdbc',
      title: '2. Why PreparedStatement Stops SQL Injection & Caches Plans',
      body: [
        'Concatenating SQL strings in <code>Statement</code> lets user input alter the SQL AST (<code>\' OR \'1\'=\'1</code>) and forces the DB to re-parse every query.',
        '<code>PreparedStatement</code> sends the SQL template separately from <code>?</code> bind parameters: the DB parses & caches the execution plan once and treats params strictly as literal values.',
      ],
      callout: {
        kind: 'warn',
        text: 'Never concatenate user input into SQL strings — even in Spring @Query or JdbcTemplate, always use ? or :named parameters.',
      },
      changes: ['+ SQL template parsed once by DB', '+ Bind params cannot alter SQL AST'],
      metrics: { conn_source: 'HikariCP Pool', statement: 'PreparedStmt', tx_mode: 'AutoCommit', throughput: 'Cached plan' },
      scene: {
        entities: {
          app: d(-12, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['setLong(1, id)'], sub: 'bind param' }),
          ps: d(0, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['PreparedStmt'], sub: 'WHERE id = ?' }),
          db: b(0, 0, { r: 2.2, h: 48, color: 'green', label: ['Postgres DB'], sub: 'cached plan' }),
          card: S({ x: -12, y: 12 }, '2. Bind Parameters vs SQL Injection', [
            'String sql = "SELECT * FROM orders WHERE id = ?";',
            'try (PreparedStatement ps = conn.prepareStatement(sql)) {',
            '  ps.setLong(1, orderId); // strictly data, never SQL!',
            '  try (ResultSet rs = ps.executeQuery()) { ... }',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          ap_ps: h('app', 'ps', ['app', 'ps'], { heads: 'end', label: 'bind ?' }),
          ps_db: h('ps', 'db', ['ps', 'db'], { heads: 'end', label: 'exec plan' }),
        },
        flows: [{ route: ['ap_ps', 'ps_db'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'ResultSet',
      chapter: 'jdbc',
      title: '3. ResultSet Cursor & Streaming Large Queries',
      body: [
        '<code>ResultSet</code> is a forward-only cursor over database rows. By default, Postgres JDBC driver buffers ALL rows into JVM Heap at once — loading 5M rows triggers <code>OutOfMemoryError</code>!',
        'Inside <code>setAutoCommit(false)</code>, setting <code>ps.setFetchSize(500)</code> tells the DB to stream 500 rows at a time over the cursor.',
      ],
      callout: {
        kind: 'tip',
        text: 'On PostgreSQL, setFetchSize(500) ONLY streams if autoCommit is false — otherwise Postgres ignores it and buffers all rows!',
      },
      changes: ['+ Default fetchSize=0 buffers all in Heap', '+ autoCommit=false + fetchSize=500 streams'],
      metrics: { conn_source: 'HikariCP Pool', statement: 'fetchSize=500', tx_mode: 'Cursor', throughput: 'Constant RAM' },
      scene: {
        entities: {
          db: b(-14, -14, { r: 2.2, h: 48, color: 'blue', label: ['DB Cursor'], sub: '5M rows' }),
          rs: d(0, -14, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['ResultSet'], sub: 'fetchSize=500' }),
          app: d(0, 0, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['while(rs.next)'], sub: 'low Heap RAM' }),
          card: S({ x: -12, y: 12 }, '3. Streaming Millions of Rows Without OOM', [
            'conn.setAutoCommit(false); // required by Postgres!',
            'ps.setFetchSize(500);      // stream 500 rows/chunk',
            'try (ResultSet rs = ps.executeQuery()) {',
            '  while (rs.next()) { process(rs.getLong("id")); }',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          db_rs: h('db', 'rs', ['db', 'rs'], { heads: 'end', label: '500/chunk' }),
          rs_ap: h('rs', 'app', ['rs', 'app'], { heads: 'end', label: 'next()' }),
        },
        flows: [{ route: ['db_rs', 'rs_ap'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'TX Commit',
      chapter: 'tx',
      title: '4. Atomic Transactions: setAutoCommit(false)',
      body: [
        'By default, JDBC runs with <code>autoCommit = true</code> — every single SQL statement commits immediately, so a crash between debit and credit corrupts balances!',
        'Calling <code>conn.setAutoCommit(false)</code> groups multiple SQL statements into one atomic unit: either <code>commit()</code> all or <code>rollback()</code> all.',
      ],
      callout: {
        kind: 'insight',
        text: 'Spring @Transactional literally wraps this exact conn.setAutoCommit(false) / commit() / rollback() lifecycle.',
      },
      changes: ['+ setAutoCommit(false) starts JDBC TX', '+ catch -> conn.rollback() restores state'],
      metrics: { conn_source: 'HikariCP Pool', statement: '2 DML ops', tx_mode: 'Atomic TX', throughput: 'ACID safe' },
      scene: {
        entities: {
          app: d(-12, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['autoCommit=0'], sub: 'BEGIN TX' }),
          cmt: b(2, -16, { r: 2.2, h: 48, color: 'green', label: ['conn.commit()'], sub: 'all succeed' }),
          rbk: b(2, -2, { r: 2.2, h: 48, color: 'red', label: ['conn.rollback'], sub: 'on exception' }),
          card: S({ x: -12, y: 12 }, '4. Manual JDBC Transaction Boundary', [
            'conn.setAutoCommit(false);',
            'try { debit(conn); credit(conn); conn.commit(); }',
            'catch (Exception e) { conn.rollback(); throw e; }',
            'finally { conn.setAutoCommit(true); }',
          ], { icon: 'terminal' }),
        },
        links: {
          ap_cm: h('app', 'cmt', ['app', 'cmt'], { heads: 'end', label: 'commit' }),
          ap_rb: h('app', 'rbk', ['app', 'rbk'], { heads: 'end', label: 'err -> rlbk' }),
        },
        flows: [{ route: ['ap_cm'], kind: 'res', rate: 1.8 }, { route: ['ap_rb'], kind: 'fail', rate: 1.4 }],
      },
    },
    {
      short: 'JDBC Batch',
      chapter: 'batch',
      title: '5. Bulk Inserts: addBatch() & executeBatch()',
      body: [
        'Inserting 10,000 rows with individual <code>executeUpdate()</code> calls pays 10,000 network round-trips.',
        'Calling <code>ps.addBatch()</code> + <code>ps.executeBatch()</code> every 500–1000 rows (with <code>reWriteBatchedInserts=true</code> on Postgres) collapses 10,000 round-trips into 10!',
      ],
      callout: {
        kind: 'tip',
        text: 'Hibernate uses this exact JDBC batching under the hood when hibernate.jdbc.batch_size=50 is configured.',
      },
      changes: ['+ addBatch() buffers params in client', '+ executeBatch() cuts network RTT 20x'],
      metrics: { conn_source: 'HikariCP Pool', statement: 'Batched 500', tx_mode: 'Atomic TX', throughput: '20x faster' },
      scene: {
        entities: {
          ps: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['ps.addBatch()'], sub: '500 rows' }),
          exec: d(0, -14, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['executeBatch'], sub: '1 network RTT' }),
          db: b(0, 0, { r: 2.2, h: 48, color: 'blue', label: ['Postgres DB'], sub: 'bulk INSERT' }),
          card: S({ x: -12, y: 12 }, '5. High-Throughput JDBC Batching', [
            '// Add ?reWriteBatchedInserts=true to Postgres JDBC URL',
            'for (int i = 0; i < items.size(); i++) {',
            '  ps.setString(1, items.get(i)); ps.addBatch();',
            '  if (i % 500 == 0) ps.executeBatch();',
            '} ps.executeBatch();',
          ], { icon: 'terminal' }),
        },
        links: {
          ps_ex: h('ps', 'exec', ['ps', 'exec'], { heads: 'end', label: 'flush 500' }),
          ex_db: h('exec', 'db', ['exec', 'db'], { heads: 'end', label: '1 bulk SQL' }),
        },
        flows: [{ route: ['ps_ex', 'ex_db'], kind: 'res', rate: 2.2 }],
      },
    },
    {
      short: 'Leak Guard',
      chapter: 'jdbc',
      title: '6. Preventing HikariCP Connection Leaks',
      body: [
        'If an exception happens before manual <code>conn.close()</code>, that Connection never returns to HikariCP. After 10 leaked requests, the entire app hangs with <code>Connection is not available</code>!',
        'Always open <code>Connection</code>, <code>PreparedStatement</code>, and <code>ResultSet</code> inside <code>try-with-resources</code> and enable <code>leak-detection-threshold</code>.',
      ],
      callout: {
        kind: 'warn',
        text: 'Pool exhaustion looks like a database outage, but is usually a leaked Connection or slow HTTP call inside @Transactional.',
      },
      changes: ['+ try-with-resources returns conn always', '+ leak-detection-threshold alerts in dev'],
      metrics: { conn_source: 'HikariCP Safe', statement: 'Closed', tx_mode: 'Returned', throughput: 'Zero leaks' },
      scene: {
        entities: {
          app: d(-14, -14, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['try-with-res'], sub: 'conn.close()' }),
          pool: b(0, -14, { r: 2.2, h: 48, color: 'blue', label: ['HikariCP'], sub: 'conn returned' }),
          hang: d(0, 0, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Leak Timeout'], sub: '30s hang fixed' }),
          card: S({ x: -12, y: 12 }, '6. Zero-Leak Resource Management', [
            '// Close order: ResultSet -> PreparedStatement -> Connection',
            'try (var conn = ds.getConnection();',
            '     var ps = conn.prepareStatement(sql);',
            '     var rs = ps.executeQuery()) { ... }',
            '// HikariCP: spring.datasource.hikari.leak-detection-threshold=2000',
          ], { icon: 'terminal' }),
        },
        links: {
          tw_pl: h('app', 'pool', ['app', 'pool'], { heads: 'end', label: 'return conn' }),
          pl_hg: h('pool', 'hang', ['pool', 'hang'], { heads: 'end', label: 'prevented' }),
        },
        flows: [{ route: ['tw_pl'], kind: 'res', rate: 1.9 }],
      },
    },
  ],
};
