// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const redisSortedSetsLesson = {
  id: 'redis-sorted-sets',
  title: 'Redis Sorted Sets: SkipLists & Leaderboard Algorithms',
  summary: 'Deconstruct the Redis ZSET engine: dual data structures combining hash tables with probabilistic SkipLists for O(log N) range queries and leaderboards.',
  minutes: 13,
  level: 'intermediate',
  metrics: ['zset_struct', 'lookup_cost', 'range_cost', 'skiplist_levels'],
  legend: ['req', 'res', ['ping', 'skiplist traversal'], 'fail'],
  goals: [
    { text: 'Why ZSETs combine a Hash', step: 1 },
    { text: 'Probabilistic SkipList tower levels', step: 2 },
    { text: 'Range queries with ZRANGEBYSCORE and', step: 3 },
    { text: 'Delayed task scheduling queue with', step: 4 },
    { text: 'Geospatial indexing via Geohash 52-bit', step: 6 },
  ],
  steps: [
    {
      short: 'Why ZSET?',
      chapter: 'setup',
      title: 'The Challenge of Real-Time Leaderboards',
      body: [
        'How do you maintain a live gaming leaderboard with 10 million players where scores update 50,000 times a second and users query their rank instantly?',
        'In a relational DB, <code>ORDER BY score DESC LIMIT 10</code> requires full index scans or table locks. <b>Redis Sorted Sets (ZSET)</b> provide O(log N) insertions, O(1) score lookups, and O(log N + M) range queries.'
      ],
      callout: {
        kind: 'insight',
        text: 'A ZSET keeps millions of elements perpetually sorted with zero batch sorting delays.'
      },
      metrics: { zset_struct: 'ZSET (Dict + SkipList)', lookup_cost: 'O(1)', range_cost: 'O(log N + M)', skiplist_levels: '32 Max' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Game Client', tags: [{ text: 'ZADD scores 950 "Alice"', icon: 'zap' }] }),
          zset: d(6, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Redis ZSET Engine', 'Dual Structure'], sub: 'Dict + SkipList' }),
          card: S({ x: -2, y: 14 }, 'ZSET Core Operations', [
            'ZADD leaderboard 950 "Alice"      -> O(log N)',
            'ZSCORE leaderboard "Alice"        -> O(1) via Dict hash table',
            'ZRANK leaderboard "Alice"         -> O(log N) via SkipList span',
            'ZRANGE leaderboard 0 9 WITHSCORES -> O(log N + M) Top 10'
          ], { icon: 'listOrdered' })
        },
        links: {
          cz: h('client', 'zset', ['client', 'zset'], { heads: 'both', label: 'ZADD / ZRANGE' })
        },
        flows: [{ route: ['cz'], bounce: true, rate: 2.5 }]
      }
    },
    {
      short: 'Dual Architecture',
      chapter: 'technique',
      title: 'The Dual Engine: Hash Table + SkipList',
      body: [
        'A single data structure cannot solve both fast lookup and ordered range queries efficiently. Redis solves this by pairing two structures inside <code>struct zset</code>:',
        '1. <b>Hash Table (dict):</b> Maps member name → score for instant <b>O(1) lookups</b> (e.g. <code>ZSCORE</code>).<br>2. <b>SkipList (zskiplist):</b> Keeps elements ordered by score for <b>O(log N) range queries</b> (e.g. <code>ZRANGEBYSCORE</code>).'
      ],
      callout: {
        kind: 'tip',
        text: 'Both structures share identical pointer references to the same member strings, avoiding duplicate string memory overhead.'
      },
      metrics: { zset_struct: 'struct zset', lookup_cost: 'O(1) Dict', range_cost: 'O(log N) SkipList', skiplist_levels: 'Active' },
      scene: {
        entities: {
          dict: d(-8, -4, { s: 4.6, h: 52, color: 'blue', glyph: 'folder', label: ['Dict Hash Table', 'Member -> Score'], sub: '"Alice" -> 950 (O(1))' }),
          skiplist: d(8, 4, { s: 4.8, h: 50, color: 'purple', glyph: 'layers', label: ['SkipList Engine', 'Ordered by Score'], sub: 'Score: 120 -> 500 -> 950' }),
          card: S({ x: 0, y: 14 }, 'struct zset in C', [
            'typedef struct zset {',
            '    dict *dict;             // member -> score (O(1) lookup)',
            '    zskiplist *zsl;         // ordered nodes (O(log N) range)',
            '} zset;',
            'Both point to identical SDS strings in memory'
          ], { icon: 'layers' })
        },
        links: {
          ds: h('dict', 'skiplist', ['dict', 'skiplist'], { heads: 'both', label: 'Shared Member Pointers' })
        },
        flows: [{ route: ['ds'], bounce: true, rate: 2.0 }]
      }
    },
    {
      short: 'SkipList Towers',
      chapter: 'technique',
      title: 'Inside the SkipList: Probabilistic Express Lanes',
      body: [
        'Balanced binary search trees (Red-Black trees) require complex rebalancing rotations on write. <b>SkipLists</b> achieve equivalent O(log N) performance through randomized express lanes.',
        'When inserting an element, a random coin flip ($p = 0.25$) determines how many forward levels (towers) the node gets (up to 32 levels). Search operations skip over hundreds of nodes at top levels before dropping down.'
      ],
      callout: {
        kind: 'insight',
        text: 'William Pugh invented SkipLists as a simpler, faster alternative to balanced binary search trees.'
      },
      metrics: { zset_struct: 'SkipList Levels', lookup_cost: 'O(log N)', range_cost: 'O(log N)', skiplist_levels: 'p = 0.25 (Max 32)' },
      scene: {
        entities: {
          level3: d(-8, -8, { s: 4.4, h: 52, color: 'orange', glyph: 'route', label: ['Level 3 (Express)', 'Jumps 8 Nodes'], sub: 'Fast Skip' }),
          level2: d(0, -4, { s: 4.4, h: 52, color: 'orange', glyph: 'route', label: ['Level 2 (Semi)', 'Jumps 4 Nodes'], sub: 'Medium Skip' }),
          level1: d(8, 0, { s: 4.4, h: 52, color: 'orange', glyph: 'route', label: ['Level 1 (All)', 'All Elements'], sub: '120 -> 500 -> 950' }),
          card: S({ x: -2, y: 14 }, 'SkipList Traversal Mechanism', [
            'Search for Score = 950:',
            '1. Start at Header Level 3 -> jumps forward over 100 elements',
            '2. Next node > 950? Drop down to Level 2',
            '3. Drop down to Level 1 -> Lands exactly on target node',
            'Total comparisons: ~4 instead of 100 sequential scans'
          ], { icon: 'route' })
        },
        links: {
          l32: h('level3', 'level2', ['level3', 'level2'], { heads: 'end' }),
          l21: h('level2', 'level1', ['level2', 'level1'], { heads: 'end' })
        },
        flows: [{ route: ['l32', 'l21'], bounce: false, rate: 2.2 }]
      }
    },
    {
      short: 'Rank by Span',
      chapter: 'technique',
      title: 'Instant Rank Calculation via Span Numbers',
      body: [
        'How does <code>ZRANK</code> tell you that you are ranked #42,109 without counting 42,108 nodes sequentially?',
        'In Redis SkipLists, every pointer carries an integer called <b>Span</b> (the number of base nodes skipped by that link). Calculating rank is simply summing the spans along the traversal path in O(log N) time!'
      ],
      callout: {
        kind: 'tip',
        text: 'Summing spans during traversal computes exact 1-based or 0-based rank instantly.'
      },
      metrics: { zset_struct: 'zskiplistLevel', lookup_cost: 'O(log N) Rank', range_cost: 'O(log N)', skiplist_levels: 'span counting' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Player', tags: [{ text: 'ZRANK user:42', icon: 'search' }] }),
          zsl: d(6, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'layers', label: ['SkipList Node', 'Span Accumulator'], sub: 'Span: 1000 + 400 + 2 = #1402' }),
          card: S({ x: -2, y: 14 }, 'Span-Based Ranking Math', [
            'Traversal step 1: Jumps Level 4 link with span = 1,000 (rank = 1000)',
            'Traversal step 2: Jumps Level 2 link with span = 400   (rank = 1400)',
            'Traversal step 3: Jumps Level 1 link with span = 2     (rank = 1402)',
            'Total time: 3 pointer dereferences computes exact rank out of 10 million!'
          ], { icon: 'listOrdered' })
        },
        links: {
          cz: h('client', 'zsl', ['client', 'zsl'], { heads: 'both', label: 'O(log N) Rank Query' })
        },
        flows: [{ route: ['cz'], bounce: true, rate: 2.8 }]
      }
    },
    {
      short: 'Delayed Tasks',
      chapter: 'deep',
      title: 'Architectural Pattern: Delayed Task Queue',
      body: [
        'ZSETs are the standard industry solution for building reliable <b>Delayed Job Queues</b> (e.g. send email in 15 minutes, cancel unpaid order after 30 minutes).',
        'Producers insert tasks with <code>ZADD queue &lt;execution_epoch_timestamp&gt; &lt;task_id&gt;</code>. Workers poll with <code>ZRANGEBYSCORE queue 0 &lt;current_epoch&gt; LIMIT 0 10</code> and remove via <code>ZREM</code>.'
      ],
      callout: {
        kind: 'insight',
        text: 'Use atomic Lua scripts (ZRANGEBYSCORE + ZREM) to prevent two workers from picking up the same task.'
      },
      metrics: { zset_struct: 'Delayed Queue', lookup_cost: 'O(log N)', range_cost: 'O(M)', skiplist_levels: 'Epoch Sorted' },
      scene: {
        entities: {
          producer: d(-10, -6, { s: 4.4, h: 52, color: 'orange', glyph: 'workflow', label: ['Job Producer', 'Checkout Service'], sub: 'ZADD queue <ts+900> id' }),
          queue: d(0, 4, { s: 4.8, h: 50, color: 'purple', glyph: 'clock', label: ['ZSET Delayed Queue', 'Sorted by Epoch'], sub: 'Due tasks at the top' }),
          worker: d(10, -6, { s: 4.4, h: 52, color: 'green', glyph: 'server', label: ['Queue Worker', 'Polling Loop'], sub: 'Executes expired tasks' }),
          card: S({ x: -2, y: 16 }, 'Delayed Queue Lua Script', [
            '-- Atomic fetch and claim',
            'local tasks = redis.call("ZRANGEBYSCORE", KEYS[1], 0, ARGV[1], "LIMIT", 0, 10)',
            'if #tasks > 0 then',
            '  redis.call("ZREM", KEYS[1], unpack(tasks))',
            'end',
            'return tasks'
          ], { icon: 'clock' })
        },
        links: {
          pq: h('producer', 'queue', ['producer', 'queue'], { heads: 'end', label: 'Schedule' }),
          qw: h('queue', 'worker', ['queue', 'worker'], { heads: 'end', label: 'Claim' })
        },
        flows: [
          { route: ['pq'], bounce: false, rate: 1.8 },
          { route: ['qw'], bounce: false, rate: 1.8 }
        ]
      }
    },
    {
      short: 'Small ZSET Listpack',
      chapter: 'deep',
      title: 'Small ZSETs: Listpack Optimization',
      body: [
        'A full SkipList node with Dict pointers consumes significant memory. For small Sorted Sets (<= 128 elements, member length <= 64 bytes), Redis does not allocate a SkipList at all.',
        'Instead, it encodes the ZSET as a flat <b>Listpack</b>: storing <code>[member, score]</code> pairs sequentially in contiguous RAM. When either limit is exceeded, Redis transparently converts the listpack into a SkipList + Dict.'
      ],
      callout: {
        kind: 'tip',
        text: 'Configured by: zset-max-listpack-entries 128 and zset-max-listpack-value 64.'
      },
      metrics: { zset_struct: 'ZSET (Listpack)', lookup_cost: 'O(N) Small N', range_cost: 'O(N) Compact', skiplist_levels: 'Zero Pointers' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'ZADD mini_set 1 "a"', icon: 'zap' }] }),
          lp: d(6, 8, { s: 4.8, h: 50, color: 'yellow', glyph: 'folder', label: ['Listpack Encoded ZSET', 'Zero Pointer Overhead'], sub: '["member1", 10, "member2", 20]' }),
          card: S({ x: -2, y: 14 }, 'Automatic Encoding Upgrade', [
            'Initial state: <= 128 members -> Stored as flat Listpack',
            'Memory usage: ~300 bytes',
            'User inserts 129th member -> Transparent upgrade:',
            '  1. Allocate dict hash table',
            '  2. Allocate zskiplist nodes with 32 level towers',
            'Client code remains 100% unaware of the internal upgrade'
          ], { icon: 'refresh' })
        },
        links: {
          clp: h('client', 'lp', ['client', 'lp'], { heads: 'both', label: 'Auto Converted' })
        },
        flows: [{ route: ['clp'], bounce: true, rate: 2.2 }]
      }
    },
    {
      short: 'Geo Coordinates',
      chapter: 'solution',
      title: 'Geospatial Indexing: GEOADD via Geohash in ZSET',
      body: [
        'Redis has no native "Geo" data type. <code>GEOADD</code> is secretly syntactic sugar over a <b>Sorted Set</b>!',
        'Latitude and longitude are interleaved using a 52-bit <b>Geohash integer</b> stored as the ZSET <code>score</code>. Proximity searches (<code>GEOSEARCH</code>) calculate bounding box Geohashes and execute fast <code>ZRANGEBYSCORE</code> queries!'
      ],
      callout: {
        kind: 'insight',
        text: 'Nearby locations share matching Geohash bit prefixes, turning 2D coordinate search into a 1D range scan.'
      },
      metrics: { zset_struct: 'Geohash in ZSET', lookup_cost: 'O(log N)', range_cost: 'GEOSEARCH', skiplist_levels: '52-bit Score' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Rider App', tags: [{ text: 'GEOSEARCH 5km radius', icon: 'mapPin' }] }),
          geozset: d(6, 8, { s: 4.8, h: 50, color: 'teal', glyph: 'globe', label: ['Geospatial ZSET', '52-Bit Geohash Scores'], sub: 'Score = Interleaved Lat/Lon' }),
          card: S({ x: -2, y: 14 }, 'How GEOADD Secretly Works', [
            '1. GEOADD drivers 106.660172 10.762622 "Driver_A"',
            '2. Algorithm converts (lat, lon) -> 52-bit integer Geohash: 3478129038',
            '3. Executes: ZADD drivers 3478129038 "Driver_A"',
            '4. Nearby drivers have scores in range [3478129000 .. 3478130000]',
            '5. Solved with standard O(log N) SkipList range search!'
          ], { icon: 'mapPin' })
        },
        links: {
          cg: h('client', 'geozset', ['client', 'geozset'], { heads: 'both', label: 'Proximity Query' })
        },
        flows: [{ route: ['cg'], bounce: true, rate: 3.0 }]
      }
    }
  ]
};
