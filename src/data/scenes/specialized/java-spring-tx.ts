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

export const javaSpringTxLesson = {
  id: `java-spring-tx`,
  title: `Declarative Transactions & @Transactional Architecture`,
  summary: `How Spring manages transactions: AOP proxies, TransactionSynchronizationManager, Propagation levels (REQUIRED vs REQUIRES_NEW), and Rollback mechanisms.`,
  minutes: 16,
  level: `advanced`,
  metrics: ['tx_state', 'active_propagation', 'sync_manager_status', 'connection_bound', 'rollback_status'],
  legend: ['req', 'res', ['ping', 'tx boundaries'], 'fail'],
  goals: [
    { text: 'AOP proxy interception & TransactionInterceptor', step: 0 },
    { text: 'TransactionSynchronizationManager ThreadLocal binding', step: 1 },
    { text: 'Propagation REQUIRED vs REQUIRES_NEW boundaries', step: 2 },
    { text: 'Self-invocation proxy bypass trap', step: 3 },
    { text: 'Rollback semantics & checked exception rules', step: 4 },
  ],
  steps: [
    {
      short: `AOP Proxy`,
      chapter: `technique`,
      title: `AOP Interception: TransactionInterceptor`,
      body: [
        `When a method is annotated with <code>@Transactional</code>, Spring wraps the bean in a dynamic proxy containing <strong>TransactionInterceptor</strong>.`,
        `Upon method entry, the interceptor asks the <strong>PlatformTransactionManager</strong> (e.g. DataSourceTransactionManager or JpaTransactionManager) for a transaction: <code>getTransaction()</code>.`,
      ],
      callout: { kind: `insight`, text: 'The connection is borrowed from the DataSource pool and set to autoCommit = false.' },
      metrics: { tx_state: 'NEW_TX_BEGUN', active_propagation: 'PROPAGATION_REQUIRED', sync_manager_status: 'Active', connection_bound: 'HikariCP-1 (autoCommit=false)', rollback_status: 'None' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, '@Transactional Proxy Interception', [
            '@Service',
            'public class OrderService {',
            '= @Transactional',
            '= public void placeOrder(Order order) {',
            '=   // TransactionInterceptor begins JDBC tx before method',
            '    repo.save(order);',
            '=   // Commits tx on success; rolls back on RuntimeException',
            '  }',
            '}',
          ]),
          caller: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['Order', 'Ctrl'], sub: 'Invokes createOrder()' }),
          tx_proxy: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'workflow', label: ['Tx', 'Advisor'], sub: 'Begins DB Transaction' }),
          hikari_conn: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'storage', label: ['DB Conn'], sub: 'autoCommit = false' }),
        },
        links: {
          cp: h('caller', 'tx_proxy', ['caller', 'tx_proxy'], { heads: 'end', label: 'method call' }),
          pc: h('tx_proxy', 'hikari_conn', ['tx_proxy', 'hikari_conn'], { heads: 'end', label: 'borrow & bind' }),
        },
        flows: [
          { route: ['cp'], bounce: false, rate: 2.0 },
          { route: ['pc'], bounce: false, rate: 1.8 },
        ],
      },
    },
    {
      short: `ThreadLocal`,
      chapter: `technique`,
      title: `TransactionSynchronizationManager`,
      body: [
        `How do DAOs and Repositories access the same connection without passing it as an argument?`,
        `<strong>TransactionSynchronizationManager</strong> holds a <code>ThreadLocal<Map<Object, Object>></code> binding the physical <code>ConnectionHolder</code> to the current thread. Any JPA EntityManager or JdbcTemplate retrieves this same connection!`,
      ],
      callout: { kind: `warning`, text: 'Because transaction context is stored in ThreadLocal, launching an asynchronous task or child thread will NOT inherit the active transaction!' },
      metrics: { tx_state: 'BOUND_TO_THREAD', active_propagation: 'PROPAGATION_REQUIRED', sync_manager_status: 'ThreadLocal[ConnectionHolder]', connection_bound: 'HikariCP-1', rollback_status: 'None' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'TransactionSynchronizationManager', [
            '// Binds active Connection to current thread ThreadLocal map:',
            '= ConnectionHolder holder = (ConnectionHolder)',
            '=   TransactionSynchronizationManager.getResource(dataSource);',
            'Connection con = holder.getConnection();',
            '# Guarantees multiple repositories in same thread share 1 DB transaction',
          ]),
          sync_mgr: d(-11, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'workflow', label: ['TxSyncManager'], sub: 'ThreadLocal Storage' }),
          dao_order: d(0, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['Order', 'Repo'], sub: 'Uses Bound Connection' }),
          dao_inventory: d(11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'code', label: ['Inventory', 'Repo'], sub: 'Uses Same Connection' }),
        },
        links: {
          so: h('sync_mgr', 'dao_order', ['sync_mgr', 'dao_order'], { heads: 'end', label: 'getConnectionHolder()' }),
          si: h('sync_mgr', 'dao_inventory', ['sync_mgr', 'dao_inventory'], { heads: 'end', label: 'getConnectionHolder()' }),
        },
        flows: [
          { route: ['so'], bounce: true, rate: 1.6 },
          { route: ['si'], bounce: true, rate: 1.6 },
        ],
      },
    },
    {
      short: `Propagation`,
      chapter: `technique`,
      title: `Propagation: REQUIRED vs REQUIRES_NEW`,
      body: [
        `<strong>REQUIRED (Default):</strong> Joins existing transaction if one exists; creates new one if none exists.`,
        `<strong>REQUIRES_NEW:</strong> Suspends the active transaction, removes its connection from ThreadLocal, borrows a second connection from the pool, runs the sub-transaction independently, and resumes the parent upon return!`,
      ],
      callout: { kind: `insight`, text: 'REQUIRES_NEW consumes 2 DB connections per thread. In tight connection pools (e.g. 10 connections), nested REQUIRES_NEW calls can cause pool deadlocks!' },
      metrics: { tx_state: 'SUSPENDED & NESTED', active_propagation: 'REQUIRES_NEW', sync_manager_status: 'Suspended parent tx', connection_bound: 'HikariCP-1 & HikariCP-2', rollback_status: 'Independent' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'REQUIRED vs REQUIRES_NEW Propagation', [
            '= @Transactional(propagation = Propagation.REQUIRED)',
            'public void createOrder() {',
            '  orderRepo.save();',
            '= auditService.logAudit(); // REQUIRES_NEW suspends current tx',
            '}',
            '= @Transactional(propagation = Propagation.REQUIRES_NEW)',
            'public void logAudit() { auditRepo.save(); } // independent commit',
          ]),
          parent_tx: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'server', label: ['Parent Tx (REQUIRED)'], sub: 'State: SUSPENDED' }),
          nested_tx: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'workflow', label: ['AuditService (REQUIRES_NEW)'], sub: 'State: ACTIVE (2nd Conn)' }),
          db_cluster: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'storage', label: ['PostgreSQL Database'], sub: 'Two Concurrent Tx IDs' }),
        },
        links: {
          pn: h('parent_tx', 'nested_tx', ['parent_tx', 'nested_tx'], { heads: 'end', label: 'suspends & invokes' }),
          nd: h('nested_tx', 'db_cluster', ['nested_tx', 'db_cluster'], { heads: 'end', label: 'commits independently' }),
        },
        flows: [
          { route: ['pn'], bounce: false, rate: 1.2 },
          { route: ['nd'], bounce: true, rate: 2.0 },
        ],
      },
    },
    {
      short: `Self-Invocation`,
      chapter: `technique`,
      title: `The Self-Invocation Trap (Proxy Bypass)`,
      body: [
        `If Method A (non-transactional) calls <code>this.methodB()</code> (annotated with @Transactional) within the same class, <strong>no transaction is started</strong>!`,
        `Because the call uses <code>this</code>, it invokes the raw object method directly, bypassing the Spring AOP proxy. Fixes: inject self, use <code>AopContext.currentProxy()</code>, or extract to a separate bean.`,
      ],
      callout: { kind: `warning`, text: 'The #1 bug with Spring @Transactional is self-invocation. The annotation compiles and executes with zero errors, but operates with autoCommit = true!' },
      metrics: { tx_state: 'NO_TX (BYPASS)', active_propagation: 'NONE', sync_manager_status: 'Unregistered', connection_bound: 'AutoCommit = true', rollback_status: 'No rollback possible' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Self-Invocation Pitfall (No Proxy)', [
            'public void outerMethod() {',
            '! this.innerTransactional(); // BYPASSES Spring AOP Proxy!',
            '! // No transaction is started because "this" is raw target object',
            '}',
            '= // Fix 1: Inject self via @Autowired OrderService self;',
            '= // Fix 2: Extract innerTransactional() into separate @Service',
          ]),
          proxy_wrapper: d(-11, -4, { s: 3.8, h: 50, color: 'gray', glyph: 'workflow', label: ['Spring AOP Proxy'], sub: 'Bypassed by this.call()' }),
          target_obj: d(0, -4, { s: 3.8, h: 50, color: 'red', glyph: 'server', label: ['Raw OrderService Instance'], sub: 'this.internalTx()' }),
          database: d(11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'storage', label: ['Database Table'], sub: 'Auto-committed partial data' }),
        },
        links: {
          to: h('target_obj', 'database', ['target_obj', 'database'], { heads: 'end', label: 'direct raw execution' }),
          pb: h('proxy_wrapper', 'target_obj', ['proxy_wrapper', 'target_obj'], { heads: 'none', label: 'proxy ignored' }),
        },
        flows: [
          { route: ['to'], bounce: false, rate: 1.8 },
        ],
      },
    },
    {
      short: `Rollback Rules`,
      chapter: `technique`,
      title: `Rollback Semantics: Runtime vs Checked Exceptions`,
      body: [
        `By default, Spring rolls back transactions <strong>ONLY for unchecked exceptions</strong> (<code>RuntimeException</code> and <code>Error</code>).`,
        `If a method throws a checked exception (e.g. <code>IOException</code> or <code>SQLException</code>), Spring will <strong>COMMIT</strong> the transaction unless explicitly declared: <code>@Transactional(rollbackFor = Exception.class)</code>.`,
      ],
      callout: { kind: `insight`, text: 'Always specify rollbackFor = Exception.class in enterprise applications to avoid silent data corruption from checked exceptions.' },
      metrics: { tx_state: 'ROLLED_BACK', active_propagation: 'PROPAGATION_REQUIRED', sync_manager_status: 'Cleaned up', connection_bound: 'connection.rollback()', rollback_status: 'Triggered by Exception' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Rollback Semantics & Checked Exceptions', [
            '= // Default: rolls back on RuntimeException and Error, NOT Checked:',
            '= @Transactional(rollbackFor = Exception.class)',
            'public void updateAccount() throws InsufficientBalanceException {',
            '  if (balance < amount)',
            '!   throw new InsufficientBalanceException("Low balance"); // rolls back!',
            '}',
            '# Always specify rollbackFor = Exception.class for business exceptions',
          ]),
          error_throw: d(-11, -4, { s: 3.8, h: 50, color: 'red', glyph: 'alert', label: ['PaymentException'], sub: 'RuntimeException thrown' }),
          interceptor: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'workflow', label: ['Tx', 'Advisor'], sub: 'completeTransactionAfterThrowing()' }),
          db_rollback: d(11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'storage', label: ['DB Conn'], sub: 'ROLLBACK executed' }),
        },
        links: {
          ei: h('error_throw', 'interceptor', ['error_throw', 'interceptor'], { heads: 'end', label: 'catches throwable' }),
          ir: h('interceptor', 'db_rollback', ['interceptor', 'db_rollback'], { heads: 'end', label: 'issues ROLLBACK' }),
        },
        flows: [
          { route: ['ei'], bounce: false, rate: 1.5 },
          { route: ['ir'], bounce: false, rate: 2.2 },
        ],
      },
    },
  ],
};
