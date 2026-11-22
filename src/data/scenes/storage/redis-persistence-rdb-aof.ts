// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const redisPersistenceRdbAofLesson = {
  id: 'redis-persistence-rdb-aof',
  title: 'Redis Persistence: RDB Snapshots vs AOF Logs',
  summary: 'Deep-dive into durability trade-offs: Linux fork Copy-on-Write snapshots, append-only logs with fsync policies, and hybrid persistence.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['persistence_mode', 'data_loss_window', 'io_overhead', 'recovery_speed'],
  legend: ['req', 'res', ['ping', 'disk write'], 'fail'],
  goals: [
    { text: 'RDB snapshots via background fork and Copy-on-Write', step: 1 },
    { text: 'AOF logging and the 3 fsync policies (always, everysec, no)', step: 3 },
    { text: 'AOF Rewrite (BGREWRITEAOF) log compaction', step: 4 },
    { text: 'Hybrid persistence RDB preamble with streaming AOF', step: 5 },
    { text: 'Fork latency spikes and memory sizing rules', step: 6 },
  ],
  steps: [
    {
      short: 'The Need for Durability',
      chapter: 'setup',
      title: 'In-Memory Volatility & Recovery Needs',
      body: [
        'Because Redis stores its entire dataset in RAM, a server crash, power loss, or OS kernel panic wipes out all data instantly.',
        'To survive reboots, Redis offers two distinct persistence mechanisms: <b>RDB (Point-in-Time Snapshots)</b> and <b>AOF (Append-Only File command log)</b>. Choosing the right configuration is a delicate balance between disk I/O latency and data loss risk.'
      ],
      callout: {
        kind: 'insight',
        text: 'Without persistence, Redis is an ephemeral cache. With persistence, it can function as a primary database.'
      },
      metrics: { persistence_mode: 'Pure RAM (None)', data_loss_window: '100% on Crash', io_overhead: 'Zero', recovery_speed: 'Instant (Empty)' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'SET account:1 500', icon: 'zap' }] }),
          redis: d(6, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Redis RAM Core', 'Volatile Memory'], sub: 'Data lost on power failure' }),
          card: S({ x: -2, y: 14 }, 'Persistence Trade-offs', [
            'RDB Snapshot (dump.rdb):',
            '  - Compact single-file backup, fast restart recovery',
            '  - Risk: Loses minutes of data created since last snapshot',
            'AOF Log (appendonly.aof):',
            '  - Logs every write command, max 1 second data loss',
            '  - Slower restarts, larger disk footprint'
          ], { icon: 'database' })
        },
        links: {
          cr: h('client', 'redis', ['client', 'redis'], { heads: 'both', label: 'In-Memory Writes' })
        },
        flows: [{ route: ['cr'], bounce: true, rate: 2.2 }]
      }
    },
    {
      short: 'RDB & Linux COW',
      chapter: 'technique',
      title: 'RDB Snapshots: Linux fork() & Copy-on-Write (COW)',
      body: [
        'How can Redis snapshot 50 GB of memory to disk without freezing incoming client commands?',
        'The main process calls Linux <code>fork()</code> to spawn a child process (<code>bgsave</code>). The OS duplicates the page table without copying actual RAM pages. Thanks to <b>Copy-on-Write (COW)</b>, memory pages are only duplicated when the main thread writes new updates, allowing the child process to dump an exact frozen snapshot to disk in the background.'
      ],
      callout: {
        kind: 'tip',
        text: 'The main process continues serving 100k QPS uninterrupted while the child process writes the RDB file.'
      },
      metrics: { persistence_mode: 'RDB (bgsave)', data_loss_window: 'Up to 5–15 min', io_overhead: 'Periodic High', recovery_speed: 'Very Fast' },
      scene: {
        entities: {
          mainProc: d(-8, -4, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Main Process', 'PID 1001 (Serving)'], sub: 'Mutates pages via COW' }),
          childProc: d(8, -4, { s: 4.6, h: 52, color: 'purple', glyph: 'workflow', label: ['Child bgsave', 'PID 1002 (Forked)'], sub: 'Iterates frozen RAM' }),
          diskRdb: d(8, 8, { s: 4.6, h: 52, color: 'blue', glyph: 'folder', label: ['Disk: dump.rdb', 'Compressed Binary'], sub: 'LZF Compressed Image' }),
          card: S({ x: -2, y: 16 }, 'Linux Copy-on-Write (COW)', [
            '1. fork() copies page table pointers (takes ~10ms for 10GB)',
            '2. Child process reads read-only shared pages -> writes dump.rdb',
            '3. When client updates a key: OS creates private copy of that 4KB page',
            '4. Memory spike: Only modified pages consume extra RAM during bgsave'
          ], { icon: 'layers' })
        },
        links: {
          mc: h('mainProc', 'childProc', ['mainProc', 'childProc'], { heads: 'end', label: 'fork()' }),
          cd: h('childProc', 'diskRdb', ['childProc', 'diskRdb'], { heads: 'end', label: 'Stream to Disk' })
        },
        flows: [
          { route: ['mc'], bounce: false, rate: 1.0 },
          { route: ['cd'], bounce: false, rate: 2.5 }
        ]
      }
    },
    {
      short: 'RDB Data Loss',
      chapter: 'problem',
      title: 'The RDB Achilles Heel: Data Loss Windows',
      body: [
        'RDB snapshots are scheduled periodically (e.g. <code>save 300 10</code> = save if 10 keys changed in 300 seconds).',
        'If Redis snapshots at 12:00 and crashes at 12:04, <b>all writes made between 12:00 and 12:04 are permanently lost</b>. For e-commerce, banking, or transactional data, a 4-minute data loss window is unacceptable.'
      ],
      callout: {
        kind: 'alert',
        text: 'Never use standalone RDB for critical business data where losing the last few minutes of transactions is forbidden.'
      },
      metrics: { persistence_mode: 'RDB Window', data_loss_window: '4 Minutes Lost!', io_overhead: 'Burst', recovery_speed: 'Fast' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Clients', tags: [{ text: '12:00 - 12:04 writes', tone: 'amber', icon: 'clock' }] }),
          crash: d(6, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'server', label: ['Server Crashed at 12:04', 'Power Failure'], sub: 'Restores 12:00 snapshot only' }),
          card: S({ x: -2, y: 14 }, 'The RDB Data Loss Gap', [
            '12:00:00 -> dump.rdb saved successfully',
            '12:01:15 -> Order #8821 paid ($150) - In RAM only',
            '12:03:40 -> Order #8822 paid ($300) - In RAM only',
            '12:04:00 -> POWER FAILURE!',
            'Reboot loads 12:00 snapshot: Orders #8821 & #8822 ARE GONE!'
          ], { icon: 'alert' })
        },
        links: {
          cc: h('client', 'crash', ['client', 'crash'], { heads: 'both', label: 'Lost in Volatile RAM' })
        },
        flows: [{ route: ['cc'], bounce: true, rate: 1.4 }]
      }
    },
    {
      short: 'AOF Mechanics',
      chapter: 'technique',
      title: 'Append-Only File (AOF): Logging Commands',
      body: [
        'To minimize data loss, the <b>Append-Only File (AOF)</b> logs every state-modifying command (SET, HSET, DEL) in RESP format to the end of a file.',
        'During restart, Redis replays the AOF file from top to bottom, rebuilding the exact in-memory state with minimal or zero data loss.'
      ],
      callout: {
        kind: 'insight',
        text: 'AOF writes after the in-memory execution succeeds, ensuring invalid syntax commands are never logged.'
      },
      metrics: { persistence_mode: 'AOF Enabled', data_loss_window: '≤ 1 Second', io_overhead: 'Continuous', recovery_speed: 'Moderate' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'SET k v', icon: 'zap' }] }),
          redis: d(0, 0, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Redis Engine', 'aof_buf Buffer'], sub: 'In-Memory + Log Append' }),
          aofFile: d(10, 8, { s: 4.6, h: 52, color: 'teal', glyph: 'folder', label: ['appendonly.aof', 'RESP Command Log'], sub: '*3\\r\\n$3\\r\\nSET...' }),
        },
        links: {
          cr: h('client', 'redis', ['client', 'redis'], { heads: 'both' }),
          ra: h('redis', 'aofFile', ['redis', 'aofFile'], { heads: 'end', label: 'write(aof_fd)' })
        },
        flows: [
          { route: ['cr'], bounce: true, rate: 2.4 },
          { route: ['ra'], bounce: false, rate: 2.4 }
        ]
      }
    },
    {
      short: 'Fsync Policies',
      chapter: 'deep',
      title: 'AOF Fsync Policies: always, everysec, no',
      body: [
        'Calling <code>write()</code> only copies bytes into the OS page cache. When does data actually touch physical disk platters / SSD flash cells? Controlled by <code>appendfsync</code>:',
        '1. <b>always:</b> <code>fsync()</code> on every single write (Zero data loss, but terrible 2k QPS performance).<br>2. <b>everysec (Recommended):</b> Dedicated background thread calls <code>fsync()</code> once per second (Max 1s data loss, high 100k QPS).<br>3. <b>no:</b> Leaves flush timing to the OS kernel (fastest, but loses up to 30s).'
      ],
      callout: {
        kind: 'tip',
        text: 'appendfsync everysec is the golden standard balancing 99.999% durability with peak in-memory throughput.'
      },
      metrics: { persistence_mode: 'appendfsync everysec', data_loss_window: 'Max 1.0s', io_overhead: 'Balanced (100k QPS)', recovery_speed: 'Full' },
      scene: {
        entities: {
          mainThread: d(-8, -4, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Main Thread', 'write() to OS PageCache'], sub: 'Zero Disk Stall' }),
          bioFsync: d(8, 4, { s: 4.6, h: 52, color: 'blue', glyph: 'clock', label: ['Background BIO Thread', 'fsync() Every 1 Second'], sub: 'Flushes OS Cache to Disk' }),
          card: S({ x: 0, y: 14 }, 'Fsync Policy Comparison', [
            'always:   fsync on every write -> 2,000 QPS max (Disk bound)',
            'everysec: fsync once per second in BIO thread -> 100,000+ QPS',
            'no:       OS decides flush timing (~30s) -> High data loss risk'
          ], { icon: 'clock' })
        },
        links: {
          mb: h('mainThread', 'bioFsync', ['mainThread', 'bioFsync'], { heads: 'end', label: '1s Timer Queue' })
        },
        flows: [{ route: ['mb'], bounce: false, rate: 2.0 }]
      }
    },
    {
      short: 'AOF Rewrite',
      chapter: 'technique',
      title: 'AOF Log Compaction (BGREWRITEAOF)',
      body: [
        'If a counter is incremented 1 million times (<code>INCR count</code>), the AOF file contains 1 million sequential lines, bloating to hundreds of megabytes.',
        '<b>AOF Rewrite (BGREWRITEAOF)</b> fork a background child process that reads the current memory state and writes the absolute minimum command required to rebuild it (e.g. <code>SET count 1000000</code>), shrinking the file by up to 95%!'
      ],
      callout: {
        kind: 'insight',
        text: 'AOF rewrite does not parse the old AOF file; it simply writes current memory objects.'
      },
      metrics: { persistence_mode: 'BGREWRITEAOF', data_loss_window: 'None', io_overhead: 'Background Fork', recovery_speed: 'Greatly Sped Up' },
      scene: {
        entities: {
          bloated: d(-8, -4, { s: 4.4, h: 52, color: 'amber', glyph: 'folder', label: ['Old AOF File', '500 MB (1M INCRs)'], sub: 'Full of redundant writes' }),
          compact: d(8, 4, { s: 4.8, h: 50, color: 'green', glyph: 'folder', label: ['Rewritten AOF', '12 MB (SET count 1M)'], sub: '95% Size Reduction' }),
          card: S({ x: 0, y: 14 }, 'Log Compaction Effect', [
            'Old log contains history: SET a 1, SET a 2, SET a 3, DEL a...',
            'New rewritten file contains final reality only:',
            '1 million increments -> 1 single line: SET count 1000000',
            'Result: File size shrinks 500MB -> 12MB; restart time drops 90%'
          ], { icon: 'refresh' })
        },
        links: {
          bc: h('bloated', 'compact', ['bloated', 'compact'], { heads: 'end', label: 'BGREWRITEAOF' })
        },
        flows: [{ route: ['bc'], bounce: false, rate: 2.2 }]
      }
    },
    {
      short: 'Hybrid Persistence',
      chapter: 'solution',
      title: 'Redis 4.0+ Hybrid Persistence: RDB + AOF Best of Both',
      body: [
        'Pure AOF takes a long time to replay on boot. Pure RDB loses minutes of data.',
        '<b>Hybrid Persistence (<code>aof-use-rdb-preamble yes</code>)</b> combines both: the rewritten AOF file starts with a compact binary <b>RDB snapshot header</b>, followed by incremental <b>AOF command logs</b> since the snapshot. You get lightning-fast restart recovery with max 1 second data loss!'
      ],
      callout: {
        kind: 'tip',
        text: 'Default in modern Redis: RDB preamble for fast boot + streaming AOF tail for durability.'
      },
      metrics: { persistence_mode: 'Hybrid (RDB + AOF)', data_loss_window: 'Max 1.0s', io_overhead: 'Low', recovery_speed: 'Sub-Second' },
      scene: {
        entities: {
          hybridFile: d(0, 0, { s: 5.2, h: 52, color: 'teal', glyph: 'database', label: ['Hybrid AOF File', 'RDB Header + AOF Tail'], sub: '[REDIS RDB Binary] + [RESP Stream]' }),
          card: S({ x: -2, y: 14 }, 'Hybrid File Layout (aof-use-rdb-preamble)', [
            '+----------------------------------------------------------+',
            '| RDB Preamble (Binary Image): Loads 10GB in 1.2 seconds   |',
            '+----------------------------------------------------------+',
            '| AOF Delta Stream: Replays last 15 seconds of writes      |',
            '+----------------------------------------------------------+',
            'Result: Fast snapshot boot + zero transaction loss!'
          ], { icon: 'zap' })
        },
        links: {},
        flows: []
      }
    }
  ]
};
