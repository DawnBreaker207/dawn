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

export const sqlConnectionPoolLesson = {
  id: `sql-connection-pool`,
  title: `PostgreSQL Connection Pooling & PgBouncer`,
  summary: `Why PostgreSQL process-per-connection breaks under load, HikariCP sizing formula, and PgBouncer connection multiplexing.`,
  minutes: 11,
  level: `intermediate`,
  metrics: [`client_conns`, `db_backends`, `pool_size`, `context_switches`, `p99_latency`],
  legend: [`req`, `res`, [`ping`, `connection request`], `fail`],
  goals: [
    { text: 'PostgreSQL process-per-connection architecture &', step: 1 },
    { text: 'The Thundering Herd', step: 2 },
    { text: 'Client-side pool sizing with HikariCP', step: 3 },
    { text: 'PgBouncer: Multiplexing 10,000 client', step: 4 },
    { text: 'Pooling Modes', step: 5 },
  ],
  steps: [
    {
      short: `Process Model`,
      chapter: `technique`,
      title: `Process-per-Connection: Postmaster & Backends`,
      body: [
        `Unlike MySQL or Oracle which use threads, PostgreSQL uses a <strong>process model</strong>. For every client connection, the Postmaster daemon forks an OS process (<code>postgres</code>).`,
        `Each backend process consumes 5–10MB of RAM baseline, plus private memory (<code>work_mem</code>, <code>temp_buffers</code>).`,
      ],
      callout: { kind: `insight`, text: `OS context switching between hundreds of active processes destroys CPU L1/L2 cache efficiency.` },
      metrics: { client_conns: `50`, db_backends: `50 processes`, pool_size: `—`, context_switches: `Low`, p99_latency: `1.2ms` },
      scene: {
        entities: {
          clients: y(-11, -4, { label: `Web Apps`, tags: [{ text: `50 Sockets`, icon: `server` }] }),
          postmaster: d(0, -4, { s: 3.8, h: 42, color: `blue`, glyph: `shield`, label: [`Postmaster`], sub: `Fork Manager` }),
          backends: d(11, -4, { s: 3.8, h: 42, color: `purple`, glyph: `cpu`, label: [`50 Backends`], sub: `OS Processes` }),
        },
        links: {
          cp: h(`clients`, `postmaster`, [`clients`, `postmaster`], { heads: `end`, label: `connect` }),
          pb: h(`postmaster`, `backends`, [`postmaster`, `backends`], { heads: `end`, label: `fork() process` }),
        },
        flows: [
          { route: [`cp`, `pb`], bounce: false, rate: 1.5 },
        ],
      },
    },
    {
      short: `Overload`,
      chapter: `problem`,
      title: `Connection Exhaustion & Thundering Herd`,
      body: [
        `When application pods scale out (e.g. 20 pods × 50 connections = 1,000 connections), PostgreSQL spends more time context-switching between processes than executing SQL queries.`,
        `Disk I/O queues spike, lock contention in shared memory freezes throughput, and connection attempts fail with <code>FATAL: sorry, too many clients already</code>.`,
      ],
      callout: { kind: `warn`, text: `More connections does NOT mean more throughput. A 16-core CPU can only physically execute 16 queries simultaneously.` },
      metrics: { client_conns: `1,200`, db_backends: `1,200 maxed`, pool_size: `Exhausted`, context_switches: `180,000/s`, p99_latency: `450ms` },
      scene: {
        entities: {
          crowd: p({ x0: -14, x1: -8, y0: -7, y1: -1 }, 12, `1,000 Microservices`),
          pg_server: d(0, -4, { s: 3.8, h: 42, color: `rose`, glyph: `alertTriangle`, label: [`PostgreSQL Server`], sub: `100% CPU Throttle` }),
          disk: b(11, -4, { r: 2.2, h: 36, label: `Disk Queue Stalled`, color: `red` }),
        },
        links: {
          storm_link: h(`crowd`, `pg_server`, [`crowd`, `pg_server`], { heads: `end`, fail: 0.4, label: `connection storm` }),
          pd: h(`pg_server`, `disk`, [`pg_server`, `disk`], { heads: `both`, label: `I/O wait` }),
        },
        flows: [
          { route: [`storm_link`], bounce: true, rate: 2.5 },
        ],
      },
    },
    {
      short: `HikariCP`,
      chapter: `technique`,
      title: `Client-Side Pool Sizing (HikariCP Formula)`,
      body: [
        `Fastest connection pools keep pool sizes small. Brett Wooldridge (author of HikariCP) established the golden formula:`,
        `<code>connections = (core_count × 2) + effective_spindle_count</code>`,
        `For an 8-core SSD database server, the optimal pool across all application instances is just 16 to 20 connections!`,
      ],
      callout: { kind: `tip`, text: `A small pool eliminates context switching and keeps queries resident in CPU L1/L2 caches.` },
      metrics: { client_conns: `500 App Threads`, db_backends: `20 Backends`, pool_size: `20 max`, context_switches: `Optimal`, p99_latency: `2.1ms` },
      scene: {
        entities: {
          threads: d(-11, -4, { s: 3.8, h: 42, color: `teal`, glyph: `cpu`, label: [`App Threads`], sub: `Concurrent Reqs` }),
          hikari: d(0, -4, { s: 3.8, h: 42, color: `green`, glyph: `layers`, label: [`HikariCP Pool`], sub: `Size: 20 conns` }),
          db: b(11, -4, { r: 2.2, h: 36, label: `Postgres (8-core)`, color: `blue` }),
        },
        links: {
          th: h(`threads`, `hikari`, [`threads`, `hikari`], { heads: `both`, label: `borrow / return` }),
          hd: h(`hikari`, `db`, [`hikari`, `db`], { heads: `both`, label: `20 persistent conns` }),
        },
        flows: [
          { route: [`th`], bounce: true, rate: 2.4 },
          { route: [`hd`], bounce: true, rate: 1.8 },
        ],
      },
    },
    {
      short: `PgBouncer`,
      chapter: `technique`,
      title: `PgBouncer: Server-Side Connection Multiplexer`,
      body: [
        `When many independent microservices or serverless Lambdas cannot coordinate client-side pools, <strong>PgBouncer</strong> acts as a lightweight proxy.`,
        `Using an event-driven single-threaded C architecture (<code>libevent</code> / <code>epoll</code>), PgBouncer maintains 10,000+ open client sockets using only ~2KB RAM per client.`,
      ],
      callout: { kind: `insight`, text: `PgBouncer maps thousands of incoming clients to a tiny pool of 30–50 PostgreSQL backend connections.` },
      metrics: { client_conns: `10,000 Sockets`, db_backends: `40 Active`, pool_size: `PgBouncer 40`, context_switches: `Minimal`, p99_latency: `1.4ms` },
      scene: {
        entities: {
          lambdas: d(-11, -4, { s: 3.8, h: 42, color: `yellow`, glyph: `zap`, label: [`10,000 Lambdas`], sub: `Serverless` }),
          pgbouncer: d(0, -4, { s: 3.8, h: 42, color: `purple`, glyph: `shield`, label: [`PgBouncer`], sub: `epoll proxy` }),
          pg_core: b(11, -4, { r: 2.2, h: 36, label: `Postgres Core`, color: `teal` }),
        },
        links: {
          lp: h(`lambdas`, `pgbouncer`, [`lambdas`, `pgbouncer`], { heads: `both`, label: `10k sockets` }),
          pb: h(`pgbouncer`, `pg_core`, [`pgbouncer`, `pg_core`], { heads: `both`, label: `40 pooled conns` }),
        },
        flows: [
          { route: [`lp`], bounce: true, rate: 2.5 },
          { route: [`pb`], bounce: true, rate: 2.0 },
        ],
      },
    },
    {
      short: `Pooling Modes`,
      chapter: `deep`,
      title: `PgBouncer Modes: Session vs Transaction vs Statement`,
      body: [
        `PgBouncer offers 3 pooling modes with different trade-offs:`,
        `• <strong>Session Pooling</strong>: Server connection assigned for entire client lifetime (safest, lowest gain).`,
        `• <strong>Transaction Pooling</strong>: Server connection returned immediately after <code>COMMIT</code> (standard scale mode).`,
        `• <strong>Statement Pooling</strong>: Connection returned after each SQL statement (breaks multi-statement transactions).`,
      ],
      callout: { kind: `warn`, text: `In Transaction Pooling, session-level features like PREPARE, SET TIMEZONE, and LISTEN/NOTIFY are disabled.` },
      metrics: { client_conns: `Active`, db_backends: `Pooled`, pool_size: `Transaction Mode`, context_switches: `Low`, p99_latency: `1.1ms` },
      scene: {
        entities: {
          txn_client: y(-11, -4, { label: `Txn Client`, tags: [{ text: `BEGIN...COMMIT`, icon: `code` }] }),
          pool_manager: d(0, -4, { s: 3.8, h: 42, color: `green`, glyph: `workflow`, label: [`Txn Pooling`], sub: `Release on COMMIT` }),
          server_backend: b(11, -4, { r: 2.2, h: 36, label: `Backend Server`, color: `purple` }),
        },
        links: {
          cp: h(`txn_client`, `pool_manager`, [`txn_client`, `pool_manager`], { heads: `both`, label: `query block` }),
          ps: h(`pool_manager`, `server_backend`, [`pool_manager`, `server_backend`], { heads: `both`, label: `lease for duration of txn` }),
        },
        flows: [
          { route: [`cp`, `ps`], bounce: true, rate: 2.0 },
        ],
      },
    },
  ],
};
export default sqlConnectionPoolLesson;
