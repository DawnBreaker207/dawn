// PostgreSQL engine pipeline presets.
// Each preset defines a query type, SQL text, EXPLAIN plan, and 5 execution stages
// (Parse → Analyze → Plan → Execute → Commit) with buffer/WAL/lock details.
// Consumed by the EnginePipeline component script.

export interface BufSlot { label: string; kind: 'sys' | 'idx' | 'heap' | 'hash' }
export interface LockAcquire { mode: string; relation: string }
export interface WalRec { type: string; bytes: number }
export interface Stage {
  name: string; icon: string; simMs: number;
  detail: string; callout?: string;
  addBufs?: BufSlot[]; walBytes?: number; walRec?: WalRec;
  addLocks?: LockAcquire[]; clearLocks?: boolean; fsync?: boolean;
}
export interface Preset {
  title: string; queryType: string; sql: string; plan: string; stages: Stage[];
}

export const PRESETS: Record<string, Preset> = {
  point_lookup: {
    title: 'Index Scan on users_pkey (PK Lookup)',
    queryType: 'SELECT · Index Scan using users_pkey',
    sql: `SELECT id, name, email\nFROM   users\nWHERE  id = 42;`,
    plan: `Index Scan using users_pkey on users\n  Index Cond: (id = 42)\n  Rows: 1\n  Buffers: shared hit=3\n  Planning: 0.12 ms  Execution: 0.08 ms`,
    stages: [
      { name:'Parse',   icon:'📝', simMs:60,  detail:'Lexer tokenises SQL query. Parser builds ParseTree AST. Validates syntax without catalog lookup.', callout:'Grammar verification complete. ParseTree built in < 0.1ms.' },
      { name:'Analyze', icon:'🔎', simMs:90,  detail:'Resolve "users" → OID 16384 in pg_class. Load pg_attribute: id=INT8, name=TEXT, email=TEXT. Acquire AccessShareLock.', callout:'2 buffer hits on catalog pages. AccessShareLock acquired.', addBufs:[{label:'pg_cls',kind:'sys'},{label:'pg_att',kind:'sys'}], addLocks:[{mode:'AccessShareLock',relation:'users'}] },
      { name:'Plan',    icon:'🗺️', simMs:110, detail:'Cost model: SeqScan = 184.0 vs IndexScan = 8.27. Optimizer selects Index Scan on users_pkey.', callout:'Cost 8.27 chosen over SeqScan 184.0.', addBufs:[{label:'pg_stat',kind:'sys'}] },
      { name:'Execute', icon:'⚙️', simMs:350, detail:'Descend B-Tree: root page → branch → leaf page (key=42, ctid=(4,2)). Pin heap page 4 slot 2.', callout:'3 buffer hits: 1 root + 1 leaf + 1 heap page.', addBufs:[{label:'idx·R',kind:'idx'},{label:'idx·L',kind:'idx'},{label:'heap·4',kind:'heap'}] },
      { name:'Commit',  icon:'✅', simMs:40,  detail:'1 row returned: {id:42, name:"Alice", email:"alice@dev.com"}. Release AccessShareLock.', callout:'0 WAL bytes (read-only query). Lock released.', clearLocks:true },
    ],
  },
  range_scan: {
    title: 'Sequential Scan with Filter',
    queryType: 'SELECT · Seq Scan on events',
    sql: `SELECT count(*)\nFROM   events\nWHERE  created_at > now() - INTERVAL '7 days';`,
    plan: `Sort  (cost=9680.52)\n  → Seq Scan on events\n       Filter: (created_at > now()-'7 days')\n       Rows Removed by Filter: 940182\n       Buffers: shared hit=4255`,
    stages: [
      { name:'Parse',   icon:'📝', simMs:60,  detail:'Parser builds expression tree for interval subtraction: now() - interval.', callout:'Lexical parsing complete.' },
      { name:'Analyze', icon:'🔎', simMs:100, detail:'Resolve "events" → OID 16512. created_at = TIMESTAMPTZ. Acquire AccessShareLock.', callout:'Catalog metadata verified.', addBufs:[{label:'pg_cls',kind:'sys'},{label:'pg_att',kind:'sys'}], addLocks:[{mode:'AccessShareLock',relation:'events'}] },
      { name:'Plan',    icon:'🗺️', simMs:120, detail:'Range covers 94% of table. Planner selects SeqScan with 8KB page read-ahead.', callout:'SeqScan chosen — table selectivity > 30%.', addBufs:[{label:'pg_stat',kind:'sys'}] },
      { name:'Execute', icon:'⚙️', simMs:500, detail:'Read pages in 128KB chunks. Evaluate filter on heap tuples. Filter removes 940,182 rows.', callout:'Streaming shared buffers sequentially.', addBufs:[{label:'h·0',kind:'heap'},{label:'h·1',kind:'heap'},{label:'h·2',kind:'heap'},{label:'h·3',kind:'heap'}] },
      { name:'Commit',  icon:'✅', simMs:40,  detail:'Aggregate count returned: 59,818 rows. Release AccessShareLock.', callout:'Execution finished in 348ms.', clearLocks:true },
    ],
  },
  hash_join: {
    title: 'Hash Join (Orders ⋈ Customers)',
    queryType: 'SELECT · Hash Join (orders, customers)',
    sql: `SELECT c.name, o.total\nFROM   orders o\nJOIN   customers c ON c.id = o.customer_id\nWHERE  o.created_at >= '2024-01-01';`,
    plan: `Hash Join  (cost=3.24..45.12)\n  Hash Cond: (o.customer_id = c.id)\n  → Seq Scan on orders o\n  → Hash\n        → Seq Scan on customers c`,
    stages: [
      { name:'Parse',   icon:'📝', simMs:60,  detail:'Parse join condition: o.customer_id = c.id. Build query tree.', callout:'Join parsed into two relation nodes.' },
      { name:'Analyze', icon:'🔎', simMs:110, detail:'Acquire AccessShareLock on both orders and customers. Verify FK constraints.', callout:'Two tables locked under AccessShareLock.', addBufs:[{label:'pg_cls',kind:'sys'},{label:'pg_att',kind:'sys'}], addLocks:[{mode:'AccessShareLock',relation:'orders'},{mode:'AccessShareLock',relation:'customers'}] },
      { name:'Plan',    icon:'🗺️', simMs:130, detail:'Inner relation customers fits in work_mem (4MB). Hash Join selected over Nested Loop.', callout:'Hash table fits in RAM work_mem.', addBufs:[{label:'pg_stat',kind:'sys'}] },
      { name:'Execute', icon:'⚙️', simMs:450, detail:'Build in-memory hash table on customers.id. Stream orders and probe hash table.', callout:'Hash table probe matching rows.', addBufs:[{label:'hash·c',kind:'hash'},{label:'h·ord',kind:'heap'},{label:'h·cust',kind:'heap'}] },
      { name:'Commit',  icon:'✅', simMs:40,  detail:'Return 1,420 matched rows. Free hash table memory context.', callout:'Locks released. Executor context freed.', clearLocks:true },
    ],
  },
  insert: {
    title: 'INSERT with WAL & Index Maintenance',
    queryType: 'INSERT · Table Insert on orders',
    sql: `INSERT INTO orders (id, user_id, total_usd, status)\nVALUES (9001, 42, 199.99, 'pending');`,
    plan: `Insert on orders\n  → Result\n  WAL: records=2  bytes=164\n  Execution Time: 1.2 ms`,
    stages: [
      { name:'Parse',   icon:'📝', simMs:60,  detail:'Parse INSERT statement with 4 target columns. Validate literal types.', callout:'Syntax check complete.' },
      { name:'Analyze', icon:'🔎', simMs:120, detail:'Acquire RowExclusiveLock on orders. Check FK user_id=42 in users.', callout:'RowExclusiveLock acquired.', addBufs:[{label:'pg_cls',kind:'sys'},{label:'pg_con',kind:'sys'}], addLocks:[{mode:'RowExclusiveLock',relation:'orders'}] },
      { name:'Plan',    icon:'🗺️', simMs:50,  detail:'Trivial plan: Result node feeding ModifyTable node.', callout:'Execution plan ready.' },
      { name:'Execute', icon:'⚙️', simMs:450, detail:'Pin target heap page. Write new tuple (xmin=txid). Insert B-tree key 9001. Append WAL.', callout:'Heap page and index dirtied. WAL record appended.', addBufs:[{label:'heap·N',kind:'heap'},{label:'idx·pk',kind:'idx'}], walBytes:136, walRec:{type:'HEAP_INSERT',bytes:136} },
      { name:'Commit',  icon:'💾', simMs:200, detail:'Write WAL commit record (28 bytes). Call fsync() — WAL flushed to disk.', callout:'Durability guaranteed: WAL fsynced to disk.', walBytes:28, walRec:{type:'TXN_COMMIT',bytes:28}, fsync:true, clearLocks:true },
    ],
  },
  update: {
    title: 'UPDATE with HOT Tuple / MVCC Copy',
    queryType: 'UPDATE · Index Scan on accounts',
    sql: `UPDATE accounts\nSET    balance = balance - 50.00\nWHERE  id = 1;`,
    plan: `Update on accounts\n  → Index Scan using accounts_pkey\n       Index Cond: (id = 1)\n  Buffers: shared hit=5  dirtied=2\n  WAL: records=2  bytes=172`,
    stages: [
      { name:'Parse',   icon:'📝', simMs:60,  detail:'Parse UPDATE expression: balance = balance - 50.00.', callout:'Syntax parsed.' },
      { name:'Analyze', icon:'🔎', simMs:100, detail:'Acquire RowExclusiveLock on accounts. Load balance column descriptor.', callout:'RowExclusiveLock acquired.', addBufs:[{label:'pg_cls',kind:'sys'},{label:'pg_att',kind:'sys'}], addLocks:[{mode:'RowExclusiveLock',relation:'accounts'}] },
      { name:'Plan',    icon:'🗺️', simMs:80,  detail:'Planner selects Index Scan on accounts_pkey + LockRows for FOR UPDATE.', callout:'Point update plan generated.', addBufs:[{label:'pg_stat',kind:'sys'}] },
      { name:'Execute', icon:'⚙️', simMs:420, detail:'Fetch tuple id=1. Set xmax=txid (old version). Write new version. Append WAL.', callout:'MVCC old version marked expired. New version written.', addBufs:[{label:'idx·R',kind:'idx'},{label:'heap·2',kind:'heap'}], walBytes:144, walRec:{type:'HEAP_HOT_UPDATE',bytes:144} },
      { name:'Commit',  icon:'💾', simMs:200, detail:'Write commit WAL record. fsync() to durable disk. Release RowExclusiveLock.', callout:'WAL fsynced. Transaction committed.', walBytes:28, walRec:{type:'TXN_COMMIT',bytes:28}, fsync:true, clearLocks:true },
    ],
  },
  delete: {
    title: 'DELETE (Mark Tuple xmax Dead)',
    queryType: 'DELETE · Index Scan on sessions',
    sql: `DELETE FROM sessions\nWHERE  id = 105;`,
    plan: `Delete on sessions\n  → Index Scan using sessions_pkey\n       Index Cond: (id = 105)\n  WAL: records=2  bytes=128`,
    stages: [
      { name:'Parse',   icon:'📝', simMs:60,  detail:'Parse DELETE with WHERE predicate.', callout:'Syntax parsed.' },
      { name:'Analyze', icon:'🔎', simMs:100, detail:'Acquire RowExclusiveLock on sessions.', callout:'RowExclusiveLock acquired.', addBufs:[{label:'pg_cls',kind:'sys'}], addLocks:[{mode:'RowExclusiveLock',relation:'sessions'}] },
      { name:'Plan',    icon:'🗺️', simMs:70,  detail:'Planner selects Index Scan on sessions_pkey.', callout:'Index scan plan ready.' },
      { name:'Execute', icon:'⚙️', simMs:380, detail:'Locate tuple. DELETE sets xmax=current_txid. Heap tuple remains; VACUUM reclaims later.', callout:'Tuple marked dead via xmax. VACUUM reclaims later.', addBufs:[{label:'idx·R',kind:'idx'},{label:'heap·1',kind:'heap'}], walBytes:100, walRec:{type:'HEAP_DELETE',bytes:100} },
      { name:'Commit',  icon:'💾', simMs:200, detail:'Write commit record. fsync() WAL. RowExclusiveLock released.', callout:'Transaction committed. Durability ensured.', walBytes:28, walRec:{type:'TXN_COMMIT',bytes:28}, fsync:true, clearLocks:true },
    ],
  },
};
