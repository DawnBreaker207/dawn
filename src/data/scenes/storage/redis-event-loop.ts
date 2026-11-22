// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const redisEventLoopLesson = {
  id: 'redis-event-loop',
  title: 'Redis Internals: Single-Threaded Reactor & Epoll',
  summary: 'Dive inside the Redis execution core: how a single thread processes 100,000 queries per second using Linux epoll without locks or context switches.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['event_loop_state', 'active_conns', 'qps', 'avg_latency_us'],
  legend: ['req', 'res', ['ping', 'event multiplexing'], 'fail'],
  goals: [
    { text: 'Why single-threaded design eliminates locking and context switching', step: 1 },
    { text: 'Linux epoll I/O multiplexing event loop mechanism', step: 2 },
    { text: 'ae.c event library: file events vs time events', step: 3 },
    { text: 'Redis 6.0 threaded I/O for network socket read/write', step: 4 },
    { text: 'Why O(N) commands like KEYS * freeze the entire server', step: 5 },
  ],
  steps: [
    {
      short: 'Why Single-Threaded?',
      chapter: 'setup',
      title: 'The Myth of Multi-Threading Overhead',
      body: [
        'How can a single-threaded server outperform complex multi-threaded database engines?',
        'In CPU-bound tasks, threads help. But in-memory caching is <b>memory and network bound</b>. Multi-threading introduces mutex locks, race conditions, cache line invalidations, and thousands of CPU context switches per second. Redis eliminates all locks by executing commands sequentially in memory.'
      ],
      callout: {
        kind: 'insight',
        text: 'A RAM access takes ~100 nanoseconds. With no locks, Redis easily finishes millions of operations per second.'
      },
      metrics: { event_loop_state: 'NO LOCKS', active_conns: '10,000', qps: '110,000', avg_latency_us: '150µs' },
      scene: {
        entities: {
          clients: y(-10, -8, { form: 'phone', label: '10,000 App Clients', tags: [{ text: 'Concurrent GET/SET', icon: 'zap' }] }),
          redis: d(6, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Redis Server', 'Single Thread Core'], sub: '100% In-Memory RAM' }),
          card: S({ x: -2, y: 14 }, 'Multi-Threaded vs Single-Threaded', [
            'Multi-Threaded (Pthreads / Java):',
            '  - Mutex lock contention on shared hash buckets',
            '  - CPU context switches: 2–5 microseconds per switch',
            'Redis Single-Threaded:',
            '  - Zero lock contention, zero thread synchronization',
            '  - Pure sequential memory pointer updates'
          ], { icon: 'zap' })
        },
        links: {
          cr: h('clients', 'redis', ['clients', 'redis'], { heads: 'both', label: 'TCP Conns' })
        },
        flows: [{ route: ['cr'], bounce: true, rate: 2.8 }]
      }
    },
    {
      short: 'Linux Epoll',
      chapter: 'technique',
      title: 'I/O Multiplexing: Linux Epoll (ae_epoll.c)',
      body: [
        'How does one thread monitor 10,000 open client sockets without blocking?',
        'Using the Linux kernel <b>epoll</b> system call (or <code>kqueue</code> on BSD/macOS). Instead of polling each socket (O(N) CPU waste), Redis calls <code>epoll_wait()</code>. The OS kernel puts the Redis thread to sleep and wakes it up only with the exact list of socket file descriptors that have incoming bytes.'
      ],
      callout: {
        kind: 'tip',
        text: 'Epoll scales O(1) with active events rather than O(N) with total connection count.'
      },
      metrics: { event_loop_state: 'epoll_wait()', active_conns: '10,000 (12 Ready)', qps: '120,000', avg_latency_us: '120µs' },
      scene: {
        entities: {
          clients: y(-10, -8, { form: 'phone', label: 'Clients', tags: [{ text: '12 Sockets Ready', tone: 'green', icon: 'zap' }] }),
          epoll: d(0, 0, { s: 4.6, h: 52, color: 'orange', glyph: 'workflow', label: ['Linux Kernel', 'epoll_wait Subsystem'], sub: 'Ready List: fd 4, 12, 88' }),
          redis: d(10, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Redis Event Loop', 'aeMain()'], sub: 'Dispatches Read Events' }),
          card: S({ x: -2, y: 14 }, 'The Epoll Loop (ae_epoll.c)', [
            '1. int numevents = epoll_wait(epfd, events, maxevents, timeout);',
            '2. Kernel returns ONLY file descriptors that have readable data',
            '3. Redis iterates through active events: O(Active) instead of O(Total)',
            '4. Dispatches readQueryFromClient() for each ready socket'
          ], { icon: 'network' })
        },
        links: {
          ce: h('clients', 'epoll', ['clients', 'epoll'], { heads: 'end' }),
          er: h('epoll', 'redis', ['epoll', 'redis'], { heads: 'both', label: 'Ready FDs' })
        },
        flows: [
          { route: ['ce', 'er'], bounce: false, rate: 2.5 }
        ]
      }
    },
    {
      short: 'ae.c Event Types',
      chapter: 'technique',
      title: 'Inside ae.c: File Events vs Time Events',
      body: [
        'The Redis event loop (<code>ae.c</code>) manages two distinct categories of events in a continuous cycle:',
        '1. <b>File Events:</b> Network socket readiness (client connections, read request bytes, flush write buffer).<br>2. <b>Time Events:</b> Periodic cron tasks (<code>serverCron</code> running at 100Hz: key TTL expiry, active defragmentation, cluster heartbeat pings).'
      ],
      callout: {
        kind: 'insight',
        text: 'The epoll_wait timeout is dynamically calculated based on when the next time event needs to run.'
      },
      metrics: { event_loop_state: 'aeProcessEvents', active_conns: '10,000', qps: '115,000', avg_latency_us: '130µs' },
      scene: {
        entities: {
          loop: d(-8, -4, { s: 4.8, h: 50, color: 'rose', glyph: 'refresh', label: ['aeMain() Loop', 'Reactor Core'], sub: 'Single Thread Loop' }),
          fileEvents: d(6, -10, { s: 4.4, h: 52, color: 'blue', glyph: 'network', label: ['File Events', 'Socket I/O'], sub: 'Read / Write Handlers' }),
          timeEvents: d(6, 4, { s: 4.4, h: 52, color: 'purple', glyph: 'clock', label: ['Time Events', 'serverCron (100Hz)'], sub: 'TTL Expiry / Defra' }),
          card: S({ x: -2, y: 14 }, 'The Unified Event Cycle', [
            'while (!server.shutdown) {',
            '  int timeout = shortestTimeEventTimeout();',
            '  aeApiPoll(eventLoop, timeout); // epoll_wait',
            '  processFileEvents();           // Read/Execute client commands',
            '  processTimeEvents();           // serverCron: expire keys, AOF flush',
            '}'
          ], { icon: 'refresh' })
        },
        links: {
          lf: h('loop', 'fileEvents', ['loop', 'fileEvents'], { heads: 'both' }),
          lt: h('loop', 'timeEvents', ['loop', 'timeEvents'], { heads: 'both' })
        },
        flows: [
          { route: ['lf'], bounce: true, rate: 2.2 },
          { route: ['lt'], bounce: true, rate: 1.8 }
        ]
      }
    },
    {
      short: 'Command Flow',
      chapter: 'technique',
      title: 'Command Execution Pipeline: Read → Exec → Write',
      body: [
        'When bytes arrive on a client socket, Redis follows an exact 5-stage sequential pipeline:',
        '1. Read socket bytes into query buffer.<br>2. Parse RESP protocol (e.g. <code>*3\\r\\n$3\\r\\nSET...</code>).<br>3. Lookup command table (<code>setCommand</code>) in hash table.<br>4. Execute memory mutation in <code>dict</code>.<br>5. Append response bytes to client output buffer.'
      ],
      callout: {
        kind: 'tip',
        text: 'All commands are executed atomically without any possibility of interleaving from other clients.'
      },
      metrics: { event_loop_state: 'RESP Pipeline', active_conns: 'Active', qps: '130,000', avg_latency_us: '95µs' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'SET user:1 "John"', icon: 'zap' }] }),
          redis: d(6, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Redis Dict Engine', 'Hash Table O(1)'], sub: 'db[0].dict' }),
          card: S({ x: -2, y: 14 }, 'Command Execution Pipeline', [
            '1. readQueryFromClient(fd) -> querybuf',
            '2. processInputBuffer() -> parses RESP token array',
            '3. lookupCommand("SET") -> struct redisCommand *cmd',
            '4. call(client) -> setGenericCommand() -> dictAdd(db->dict)',
            '5. addReply(client, shared.ok) -> client output buffer'
          ], { icon: 'listOrdered' })
        },
        links: {
          cr: h('client', 'redis', ['client', 'redis'], { heads: 'both', label: 'RESP Protocol' })
        },
        flows: [{ route: ['cr'], bounce: true, rate: 3.2 }]
      }
    },
    {
      short: 'Threaded I/O (v6)',
      chapter: 'deep',
      title: 'Redis 6.0: Threaded Network I/O',
      body: [
        'As network cards reached 100 Gbps, parsing bytes and writing buffers to thousands of TCP sockets became the new CPU bottleneck.',
        '<b>Redis 6.0 introduced Threaded I/O</b>: offloading network socket reading and writing to background helper threads. <b>The command execution itself remains strictly single-threaded</b>, preserving atomic lock-free simplicity while doubling network throughput.'
      ],
      callout: {
        kind: 'insight',
        text: 'Threaded I/O delivers over 250,000 QPS on modern multi-core servers without changing any client code.'
      },
      metrics: { event_loop_state: 'Threaded I/O', active_conns: '100,000', qps: '260,000 (2x)', avg_latency_us: '80µs' },
      scene: {
        entities: {
          ioThreads: d(-8, -4, { s: 4.6, h: 52, color: 'blue', glyph: 'workflow', label: ['I/O Thread Pool (4x)', 'Socket Read / Write'], sub: 'Parallel Parsing' }),
          mainThread: d(8, 4, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Main Worker Thread', 'Single-Thread Core'], sub: 'Executes Commands Lock-Free' }),
          card: S({ x: 0, y: 14 }, 'Threaded I/O Architecture', [
            'Stage 1: Helper threads read & parse socket buffers in parallel',
            'Stage 2: Main thread executes commands sequentially (Zero Locks)',
            'Stage 3: Helper threads write reply buffers back to network sockets',
            'Result: 2.2x throughput increase while retaining atomic safety'
          ], { icon: 'zap' })
        },
        links: {
          im: h('ioThreads', 'mainThread', ['ioThreads', 'mainThread'], { heads: 'both', label: 'Parsed Commands' })
        },
        flows: [{ route: ['im'], bounce: true, rate: 3.0 }]
      }
    },
    {
      short: 'Blocking Anti-Patterns',
      chapter: 'problem',
      title: 'The Single-Thread Trap: O(N) Blocking Commands',
      body: [
        'Because the command executor is single-threaded, if any single command takes 2 seconds to run, <b>every other client in the entire world is frozen for 2 seconds</b>.',
        'Never run <code>KEYS *</code> on production databases with millions of keys. Use incremental cursor scanning with <code>SCAN</code>. Similarly, avoid <code>FLUSHALL</code> (use <code>FLUSHALL ASYNC</code>) and long-running Lua scripts.'
      ],
      callout: {
        kind: 'alert',
        text: 'A single KEYS * command on 10 million keys freezes Redis for up to 3 seconds, triggering application connection pool timeouts.'
      },
      metrics: { event_loop_state: 'BLOCKED (KEYS *)', active_conns: 'Frozen', qps: '0', avg_latency_us: '2,400,000µs (2.4s)' },
      scene: {
        entities: {
          badClient: y(-12, -8, { form: 'phone', label: 'Admin Tool', tags: [{ text: 'KEYS * (10M keys)', tone: 'red', icon: 'alert' }] }),
          goodClient: y(-12, 6, { form: 'phone', label: 'Normal User', tags: [{ text: 'GET user:42 (Blocked!)', tone: 'amber', icon: 'hourglass' }] }),
          redis: d(6, -1, { s: 4.8, h: 50, color: 'rose', glyph: 'server', label: ['Redis Server', 'Event Loop BLOCKED'], sub: 'Traversing 10M Dict Nodes' }),
        },
        links: {
          bc: h('badClient', 'redis', ['badClient', 'redis'], { heads: 'both', label: 'Blocking Query' }),
          gc: h('goodClient', 'redis', ['goodClient', 'redis'], { heads: 'both', label: 'Frozen in Queue' })
        },
        flows: [{ route: ['bc'], bounce: true, rate: 0.6 }]
      }
    },
    {
      short: 'Benchmark Metrics',
      chapter: 'solution',
      title: 'Microsecond Performance & Pipeline Batching',
      body: [
        'Under healthy conditions with O(1) operations (GET, SET, HGET, ZADD), Redis delivers sub-millisecond response times.',
        'By utilizing <b>Redis Pipelining</b>, a client can pack 50 commands into a single TCP packet, amortizing network round-trip time and hitting 500,000+ operations per second on a single machine.'
      ],
      callout: {
        kind: 'insight',
        text: 'Pipelining turns 50 RTT round-trips into 1 round-trip.'
      },
      metrics: { event_loop_state: 'Pipelined Burst', active_conns: 'Healthy', qps: '520,000', avg_latency_us: '65µs' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Pipeline Client', tags: [{ text: 'Batch 50 cmds/packet', tone: 'green', icon: 'zap' }] }),
          redis: d(6, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Redis Server', 'High-Speed Reactor'], sub: 'P50: 65µs · P99: 180µs' }),
          card: S({ x: -2, y: 14 }, 'Pipelining vs Sequential Commands', [
            'Sequential (50 cmds): 50 x 1ms RTT = 50ms total delay',
            'Pipelined (50 cmds): Pack 50 commands into 1 TCP buffer',
            'Redis executes all 50 in RAM in 30 microseconds',
            'Returns 1 combined answer packet -> Total: 1.03ms (50x faster!)'
          ], { icon: 'zap' })
        },
        links: {
          cr: h('client', 'redis', ['client', 'redis'], { heads: 'both', label: 'Pipelined Stream' })
        },
        flows: [{ route: ['cr'], bounce: true, rate: 3.5 }]
      }
    }
  ]
};
