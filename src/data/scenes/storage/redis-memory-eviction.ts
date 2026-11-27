import {
  makeBlock,
  makeDevice,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';

export const redisMemoryEvictionLesson = {
  id: 'redis-memory-eviction',
  title: 'Redis Eviction Policies: LRU, LFU & Active Defrag',
  summary: 'Architect memory management at capacity: approximated LRU sampling pools, logarithmic LFU counters, lazy TTL expiration, and active defragmentation.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['maxmemory_policy', 'used_memory', 'evicted_keys_sec', 'frag_ratio'],
  legend: ['req', 'res', ['ping', 'eviction scan'], 'fail'],
  goals: [
    { text: 'Compare 8 maxmemory eviction policies', step: 1 },
    { text: 'Approximated LRU random sampling pool', step: 2 },
    { text: 'Logarithmic LFU frequency counters and', step: 3 },
    { text: 'Passive lazy deletion vs active', step: 4 },
    { text: 'Memory fragmentation ratio and runtime', step: 6 },
  ],
  steps: [
    {
      short: 'Maxmemory Limit',
      chapter: 'setup',
      title: 'Memory Exhaustion: The maxmemory Barrier',
      body: [
        'When physical RAM is exhausted, Redis cannot allocate more memory without triggering the Linux Out-Of-Memory (OOM) Killer, which forcibly terminates the process.',
        'To protect the server, you configure <code>maxmemory 4gb</code> and a <b>maxmemory-policy</b>. Once memory reaches the limit, Redis executes the eviction policy before accepting new writes.'
      ],
      callout: {
        kind: 'insight',
        text: 'If maxmemory-policy is set to noeviction, any write command returns an explicit (error) OOM command not allowed.'
      },
      metrics: { maxmemory_policy: 'noeviction', used_memory: '4.0 GB / 4.0 GB', evicted_keys_sec: '0', frag_ratio: '1.02' },
      scene: {
        entities: {
          client: makeDevice(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'SET user:99 (OOM!)', tone: 'red', icon: 'alert' }] }),
          redis: makeBlock(6, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Redis RAM Core', '100% Saturated (4GB)'], sub: 'noeviction: Rejecting writes' }),
          card: makePanel({ x: -2, y: 14 }, 'OOM Error Response', [
            'Client -> SET new_session "data"',
            'Server -> (error) OOM command not allowed when used memory > maxmemory',
            'Read commands (GET, HGET) still succeed!',
            'Fix: Configure an automatic eviction policy (allkeys-lru)'
          ], { icon: 'alert' })
        },
        links: {
          cr: makeLink('client', 'redis', ['client', 'redis'], { heads: 'both', label: 'Rejected Write' })
        },
        flows: [{ route: ['cr'], bounce: true, rate: 1.5 }]
      }
    },
    {
      short: '8 Eviction Policies',
      chapter: 'technique',
      title: 'The 8 Maxmemory Eviction Strategies',
      body: [
        'Redis provides 8 eviction policies partitioned by scope (<b>allkeys</b> vs <b>volatile</b>) and algorithm:',
        '• <b>allkeys-lru / allkeys-lfu:</b> Evicts least recently / frequently used across ALL keys (Standard cache).<br>• <b>volatile-lru / volatile-lfu / volatile-ttl:</b> Evicts only among keys that have an explicit TTL expiration set.<br>• <b>allkeys-random / volatile-random:</b> Evicts random keys.<br>• <b>noeviction:</b> Rejects writes.'
      ],
      callout: {
        kind: 'tip',
        text: 'Use allkeys-lru if your database is a pure cache. Use volatile-lru if you mix persistent data with temporary cache keys.'
      },
      metrics: { maxmemory_policy: 'allkeys-lru', used_memory: '4.0 GB (Stable)', evicted_keys_sec: '1,200/s', frag_ratio: '1.04' },
      scene: {
        entities: {
          client: makeDevice(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'SET writes continuous', tone: 'green', icon: 'zap' }] }),
          redis: makeBlock(6, 8, { s: 4.8, h: 50, color: 'green', glyph: 'database', label: ['Redis Engine', 'allkeys-lru Active'], sub: 'Evicting stale keys' }),
          card: makePanel({ x: -2, y: 14 }, '8 Policy Matrix', [
            '+------------------+------------------------------------------------+',
            '| Policy           | Description                                    |',
            '+------------------+------------------------------------------------+',
            '| allkeys-lru      | Evicts least recently used keys (Cache-aside)  |',
            '| allkeys-lfu      | Evicts least frequently used keys (Hot/Cold)   |',
            '| volatile-lru     | LRU among keys with EXPIRE set                 |',
            '| volatile-ttl     | Evicts keys with shortest remaining TTL        |',
            '| noeviction       | Throws error on write when full                |',
            '+------------------+------------------------------------------------+'
          ], { icon: 'listOrdered' })
        },
        links: {
          cr: makeLink('client', 'redis', ['client', 'redis'], { heads: 'both', label: 'Continuous Throughput' })
        },
        flows: [{ route: ['cr'], bounce: true, rate: 2.8 }]
      }
    },
    {
      short: 'Approximated LRU',
      chapter: 'technique',
      title: 'Approximated LRU: The 24-Bit Clock & Sample Pool',
      body: [
        'A true LRU algorithm requires maintaining a doubly-linked list of all keys. Every read would require moving that node to the head, creating mutex locks and wasting 24 bytes of memory per key.',
        'Redis uses <b>Approximated LRU</b>: each object stores a 24-bit access timestamp (<code>lru:24</code>). When eviction is needed, Redis samples $N$ random keys (e.g. <code>maxmemory-samples 5</code>) into an <b>Eviction Pool</b> sorted by idle time, and evicts the oldest sample.'
      ],
      callout: {
        kind: 'insight',
        text: 'With maxmemory-samples 10, Redis Approximated LRU matches true mathematical LRU with virtually zero memory overhead.'
      },
      metrics: { maxmemory_policy: 'Approximated LRU', used_memory: '4.0 GB', evicted_keys_sec: '2,400/s', frag_ratio: '1.02' },
      scene: {
        entities: {
          keyspace: makeBlock(-8, -4, { s: 4.6, h: 52, color: 'blue', glyph: 'database', label: ['Redis Keyspace', '10M Total Keys'], sub: 'Random sample 5 keys' }),
          pool: makeBlock(8, 4, { s: 4.8, h: 50, color: 'orange', glyph: 'layers', label: ['Eviction Pool (16 slots)', 'Sorted by Idle Time'], sub: 'Evicts oldest idle key' }),
          card: makePanel({ x: 0, y: 14 }, 'Approximated LRU Sampling', [
            '1. Randomly pick 5 keys from keyspace',
            '2. Idle time = current_time_clock - robj->lru',
            '3. Insert into 16-element Eviction Pool (sorted ascending by idle time)',
            '4. Evict the key with the longest idle time from the pool',
            'Zero pointer overhead, near-perfect LRU accuracy!'
          ], { icon: 'refresh' })
        },
        links: {
          kp: makeLink('keyspace', 'pool', ['keyspace', 'pool'], { heads: 'end', label: '5 Random Samples' })
        },
        flows: [{ route: ['kp'], bounce: false, rate: 2.2 }]
      }
    },
    {
      short: 'LFU Frequency',
      chapter: 'deep',
      title: 'LFU: Logarithmic Counter & Decay Time',
      body: [
        'LRU fails when an old key is accessed once by a crawler and stays cached, while a frequently used key accessed 10 minutes ago gets evicted.',
        '<b>LFU (Least Frequently Used)</b> splits the 24 bits into: <b>16-bit Last Decrement Time (LDT)</b> and <b>8-bit Logarithmic Counter (LOG_C, 0..255)</b>. Frequent access increments the counter with probabilistic decay over time.'
      ],
      callout: {
        kind: 'tip',
        text: 'LOG_C is logarithmic: reaching 255 takes 1 million accesses. lfu-decay-time halves the counter over idle minutes.'
      },
      metrics: { maxmemory_policy: 'allkeys-lfu', used_memory: '4.0 GB', evicted_keys_sec: '1,800/s', frag_ratio: '1.03' },
      scene: {
        entities: {
          client: makeDevice(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'Access hot key', icon: 'zap' }] }),
          lfuNode: makeBlock(6, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'layers', label: ['LFU 24-bit Field', 'LDT:16 | LOG_C:8'], sub: 'Freq: 42 (Probabilistic)' }),
          card: makePanel({ x: -2, y: 14 }, 'LFU 8-Bit Counter Math', [
            'Increment formula:',
            '  double r = (double)rand() / RAND_MAX;',
            '  double p = 1.0 / (baseval * lfu_log_factor + 1);',
            '  if (r < p) counter++;',
            'Decay: Every lfu-decay-time minutes, counter drops by 1',
            'Protects popular items that temporarily sleep'
          ], { icon: 'trendingUp' })
        },
        links: {
          cl: makeLink('client', 'lfuNode', ['client', 'lfuNode'], { heads: 'both', label: 'LFU Increment' })
        },
        flows: [{ route: ['cl'], bounce: true, rate: 2.5 }]
      }
    },
    {
      short: 'TTL Expiration',
      chapter: 'technique',
      title: 'Key TTL Expiration: Passive vs Active',
      body: [
        'When a key has a TTL (<code>EXPIRE key 60</code>), Redis does NOT set a timer for each key (which would waste massive CPU and memory).',
        'Redis uses a hybrid approach:<br>1. <b>Passive (Lazy):</b> When a client accesses a key, Redis checks if it expired. If yes, it deletes it and returns nil.<br>2. <b>Active (Periodic):</b> <code>serverCron</code> runs 10 times per second, testing 20 random keys with TTL. If > 25% are expired, it repeats immediately.'
      ],
      callout: {
        kind: 'insight',
        text: 'Active expiration keeps expired key percentage strictly under 25% of total keyspace.'
      },
      metrics: { maxmemory_policy: 'Active + Passive', used_memory: 'Filtered', evicted_keys_sec: 'Expired: 450/s', frag_ratio: '1.02' },
      scene: {
        entities: {
          client: makeDevice(-12, -6, { form: 'phone', label: 'Client', tags: [{ text: 'GET expired_key -> nil', icon: 'search' }] }),
          cron: makeBlock(0, -6, { s: 4.4, h: 52, color: 'purple', glyph: 'clock', label: ['serverCron (10Hz)', 'Active Sampling'], sub: 'Checks 20 random keys' }),
          expires: makeBlock(8, 4, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['db[0].expires Dict', 'Key -> Expiry Timestamp'], sub: 'Lazy deleted on access' }),
          card: makePanel({ x: -2, y: 14 }, 'Active Expiration Cycle (activeExpireCycle)', [
            '1. Sample 20 random keys from db->expires dict',
            '2. Delete all keys that have passed current timestamp',
            '3. If more than 5 keys (25%) were expired in the sample:',
            '   Repeat immediately (budgeted up to 25ms timeout)',
            'Result: Keeps expired memory footprint bounded'
          ], { icon: 'clock' })
        },
        links: {
          cg: makeLink('client', 'expires', ['client', 'expires'], { heads: 'both' }),
          ce: makeLink('cron', 'expires', ['cron', 'expires'], { heads: 'end', label: '10Hz Sample' })
        },
        flows: [
          { route: ['cg'], bounce: true, rate: 1.5 },
          { route: ['ce'], bounce: false, rate: 2.0 }
        ]
      }
    },
    {
      short: 'Memory Fragmentation',
      chapter: 'problem',
      title: 'The Hidden Enemy: Memory Fragmentation Ratio',
      body: [
        'Running <code>INFO memory</code> reports <code>mem_fragmentation_ratio</code> = <code>used_memory_rss / used_memory</code>.',
        'Frequent allocations and deletions leave empty memory holes in Jemalloc chunks. If fragmentation ratio exceeds <b>1.5</b>, Redis is consuming 50% more physical RAM from the OS than your actual data size!'
      ],
      callout: {
        kind: 'alert',
        text: 'A fragmentation ratio > 1.5 with 8 GB data consumes 12 GB physical RAM, risking sudden OS OOM kills.'
      },
      metrics: { maxmemory_policy: 'Jemalloc Allocator', used_memory: '8.0 GB', evicted_keys_sec: '0', frag_ratio: '1.65 (High!)' },
      scene: {
        entities: {
          osRam: makeBlock(-8, -4, { s: 4.6, h: 52, color: 'rose', glyph: 'server', label: ['OS Physical RAM', '12 GB Allocated (RSS)'], sub: 'Holes in memory chunks' }),
          data: makeBlock(8, 4, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Actual Redis Data', '8 GB In-Use'], sub: 'Fragmentation: 1.65' }),
          card: makePanel({ x: 0, y: 14 }, 'Fragmentation Causes', [
            '1. Random key deletions create non-contiguous free memory holes',
            '2. Jemalloc memory chunk size class rounding',
            '3. OS cannot reclaim physical pages unless entire 4KB page is empty',
            'Ratio = used_memory_rss / used_memory',
            'Healthy: 1.05 - 1.15. Danger: > 1.50'
          ], { icon: 'alert' })
        },
        links: {
          od: makeLink('osRam', 'data', ['osRam', 'data'], { heads: 'both', label: 'Memory Gap (4GB Holes)' })
        },
        flows: [{ route: ['od'], bounce: true, rate: 1.8 }]
      }
    },
    {
      short: 'Active Defrag',
      chapter: 'solution',
      title: 'Online Active Defragmentation (activedefrag)',
      body: [
        'In older Redis versions, the only fix for fragmentation was restarting the server.',
        'Redis 4.0+ features <b>Active Defragmentation (<code>activedefrag yes</code>)</b>. While the server is live, Redis scans memory allocations, moves small objects into contiguous blocks, and frees up fragmented physical OS memory pages without dropping connections.'
      ],
      callout: {
        kind: 'insight',
        text: 'activedefrag dynamically scales CPU usage between 5% and 75% depending on fragmentation severity.'
      },
      metrics: { maxmemory_policy: 'activedefrag yes', used_memory: '8.0 GB', evicted_keys_sec: 'Defragging', frag_ratio: '1.08 (Optimal)' },
      scene: {
        entities: {
          defrag: makeBlock(0, 0, { s: 5.2, h: 52, color: 'green', glyph: 'refresh', label: ['Active Defragmenter', 'Jemalloc Compaction'], sub: 'Frag Ratio: 1.65 -> 1.08' }),
          card: makePanel({ x: -2, y: 14 }, 'Active Defrag Configuration', [
            'CONFIG SET activedefrag yes',
            'active-defrag-ignore-bytes 100mb',
            'active-defrag-threshold-lower 10  (Trigger at 1.10 ratio)',
            'active-defrag-threshold-upper 30  (Max effort at 1.30 ratio)',
            'Result: 4 GB wasted OS memory reclaimed live with zero downtime!'
          ], { icon: 'check' })
        },
        links: {},
        flows: []
      }
    }
  ]
};
