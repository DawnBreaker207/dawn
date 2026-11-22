// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const redisDataStructuresLesson = {
  id: 'redis-data-structures',
  title: 'Redis C Internals: SDS, Dict & Progressive Rehash',
  summary: 'Explore Redis data structures written in C: Simple Dynamic Strings (SDS), hash tables with progressive rehashing, and memory-compact listpacks.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['data_struct', 'encoding', 'time_complexity', 'memory_efficiency'],
  legend: ['req', 'res', ['ping', 'memory allocation'], 'fail'],
  goals: [
    { text: 'Redis object wrapper robj anatomy and encoding', step: 1 },
    { text: 'Simple Dynamic String (SDS) vs standard C strings', step: 2 },
    { text: 'Dict hash table progressive rehashing across ht[0] and ht[1]', step: 3 },
    { text: 'Memory optimization: Intset and Listpack compact encodings', step: 4 },
    { text: 'Why storing data in hashes saves up to 80% RAM', step: 6 },
  ],
  steps: [
    {
      short: 'The robj Wrapper',
      chapter: 'setup',
      title: 'The Universal Redis Object (robj)',
      body: [
        'Every key and value in Redis is wrapped in a 16-byte C structure called <code>redisObject (robj)</code>.',
        'The robj header tracks: <code>type</code> (STRING, LIST, HASH, SET, ZSET), <code>encoding</code> (raw, embstr, int, listpack, skiplist), <code>lru</code> (timestamp for eviction), and <code>refcount</code> (memory management).'
      ],
      callout: {
        kind: 'insight',
        text: 'The encoding field allows Redis to seamlessly change internal data structures in memory without altering client commands.'
      },
      metrics: { data_struct: 'redisObject', encoding: 'OBJ_ENCODING_RAW', time_complexity: 'O(1)', memory_efficiency: '16B Overhead' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'SET key "val"', icon: 'zap' }] }),
          robj: d(6, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['redisObject (robj)', '16-Byte Header'], sub: 'type: 4b | enc: 4b | ptr: 8B' }),
          card: S({ x: -2, y: 14 }, 'struct redisObject Definition', [
            'struct redisObject {',
            '  unsigned type:4;      // OBJ_STRING, OBJ_HASH, OBJ_LIST...',
            '  unsigned encoding:4;  // OBJ_ENCODING_RAW, EMBSTR, LISTPACK...',
            '  unsigned lru:24;      // Clock for LRU / LFU eviction',
            '  int refcount;         // Reference counter (shared objects)',
            '  void *ptr;            // Pointer to actual payload (SDS, Dict)',
            '}; // Exactly 16 bytes overhead per object'
          ], { icon: 'listOrdered' })
        },
        links: {
          cr: h('client', 'robj', ['client', 'robj'], { heads: 'both', label: 'Payload Pointer' })
        },
        flows: [{ route: ['cr'], bounce: true, rate: 2.2 }]
      }
    },
    {
      short: 'SDS vs C char*',
      chapter: 'technique',
      title: 'Simple Dynamic String (SDS) vs C Strings',
      body: [
        'Standard C strings are null-terminated (<code>\\0</code>), making <code>strlen()</code> slow (O(N)), prone to buffer overflows, and incapable of storing binary data (images, protobuf).',
        'Redis invented <b>Simple Dynamic Strings (SDS)</b>: storing length (<code>len</code>) and remaining capacity (<code>alloc</code>) in a typed header. String length lookup is instant O(1), and buffer appends pre-allocate space to avoid reallocations.'
      ],
      callout: {
        kind: 'tip',
        text: 'For strings <= 44 bytes, Redis uses EMBSTR: allocating robj and SDS in one contiguous memory block with zero allocation fragmentation.'
      },
      metrics: { data_struct: 'sdshdr8', encoding: 'OBJ_ENCODING_EMBSTR', time_complexity: 'O(1) strlen', memory_efficiency: 'Pre-allocated' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'STRLEN user:name', icon: 'zap' }] }),
          sds: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'folder', label: ['SDS Struct (sdshdr8)', 'Contiguous Memory'], sub: 'len: 4 | alloc: 8 | buf[]' }),
          card: S({ x: -2, y: 14 }, 'Why SDS Trumps C char*', [
            '1. O(1) Length: Reads len directly from header (Zero scanning)',
            '2. Safe Concatenation: Automatically expands buffer before appending',
            '3. Binary Safe: Can contain \\0 characters (Protobuf / JPEG binary)',
            '4. Memory Optimization: sdshdr5, sdshdr8, sdshdr16 for tiny strings',
            '5. EMBSTR optimization: Single malloc for header + payload (44 bytes)'
          ], { icon: 'check' })
        },
        links: {
          cs: h('client', 'sds', ['client', 'sds'], { heads: 'both', label: 'Instant O(1)' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 2.8 }]
      }
    },
    {
      short: 'Progressive Rehash',
      chapter: 'technique',
      title: 'Dict & Progressive Rehashing',
      body: [
        'The main Redis database and Hash types are backed by <code>dict</code> (hash tables with chaining for collision resolution).',
        'When load factor exceeds 1.0, the table doubles in size. In traditional databases, rehashing millions of keys blocks the server. Redis uses <b>Progressive Rehashing</b>: maintaining two tables (<code>ht[0]</code> and <code>ht[1]</code>) and migrating a few buckets on every read/write operation over hundreds of milliseconds without lag spikes.'
      ],
      callout: {
        kind: 'insight',
        text: 'During rehashing, keys are looked up in ht[0] first, then ht[1]. New writes always go directly to ht[1].'
      },
      metrics: { data_struct: 'dict (ht[0] + ht[1])', encoding: 'Chained Hash Table', time_complexity: 'O(1) Amortized', memory_efficiency: 'Dynamic' },
      scene: {
        entities: {
          dict: d(-8, -4, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['dict Controller', 'rehashidx: 42'], sub: 'Progressive Migration' }),
          ht0: d(6, -10, { s: 4.4, h: 52, color: 'purple', glyph: 'layers', label: ['ht[0] (Old Table)', 'Size: 1,024 Buckets'], sub: 'Draining buckets' }),
          ht1: d(6, 4, { s: 4.4, h: 52, color: 'green', glyph: 'layers', label: ['ht[1] (New Table)', 'Size: 2,048 Buckets'], sub: 'Receiving keys' }),
          card: S({ x: -2, y: 14 }, 'Progressive Rehash Process', [
            '1. Table grows: malloc(ht[1], size * 2)',
            '2. rehashidx = 0 (Rehash active)',
            '3. On every client command: Migrate 1 bucket from ht[0] to ht[1]',
            '4. In serverCron: Migrate 100 buckets per millisecond',
            '5. When ht[0] empty: Free ht[0], set ht[0] = ht[1], rehashidx = -1'
          ], { icon: 'refresh' })
        },
        links: {
          dh0: h('dict', 'ht0', ['dict', 'ht0'], { heads: 'both' }),
          dh1: h('dict', 'ht1', ['dict', 'ht1'], { heads: 'both' }),
          mig: h('ht0', 'ht1', ['ht0', 'ht1'], { heads: 'end', label: 'Progressive Bucket Transfer' })
        },
        flows: [
          { route: ['dh0'], bounce: true, rate: 1.5 },
          { route: ['mig'], bounce: false, rate: 2.2 }
        ]
      }
    },
    {
      short: 'Listpack & Intset',
      chapter: 'technique',
      title: 'Memory Compression: Listpack & Intset',
      body: [
        'Standard hash table nodes use pointers that consume 24 to 32 bytes of memory per element.',
        'For small hashes and lists, Redis encodes data into a <b>Listpack</b>: a single contiguous byte array storing variable-length entries back-to-back without pointers. For integer sets, Redis uses <b>Intset</b> (storing 16, 32, or 64-bit integers with binary search).'
      ],
      callout: {
        kind: 'tip',
        text: 'Listpacks reduce memory footprint by up to 70% compared to pointer-heavy linked lists and hash tables.'
      },
      metrics: { data_struct: 'listpack / intset', encoding: 'OBJ_ENCODING_LISTPACK', time_complexity: 'O(N) Small N (N<=512)', memory_efficiency: 'Ultra High (Zero Ptrs)' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'HSET user:10 name "Sam"', icon: 'zap' }] }),
          lp: d(6, 8, { s: 4.8, h: 50, color: 'yellow', glyph: 'folder', label: ['Listpack Block', 'Contiguous Memory Array'], sub: 'Total bytes | Entries | Elements' }),
          card: S({ x: -2, y: 14 }, 'Listpack Memory Layout', [
            '[<tot-bytes> <num-elements> <entry 1> <entry 2> ... <end-byte 0xFF>]',
            'Entry structure:',
            '  [encoding | data-bytes | backlen]',
            'Key advantages:',
            '  - Zero 64-bit pointer overhead (saves 16 bytes per entry)',
            '  - L1 CPU cache friendly (sequential memory prefetch)'
          ], { icon: 'listOrdered' })
        },
        links: {
          clp: h('client', 'lp', ['client', 'lp'], { heads: 'both', label: 'Compact Byte Scan' })
        },
        flows: [{ route: ['clp'], bounce: true, rate: 2.5 }]
      }
    },
    {
      short: 'Quicklist (Lists)',
      chapter: 'deep',
      title: 'Redis Lists: Quicklist (Linked List of Listpacks)',
      body: [
        'Pure linked lists waste memory on pointers (<code>prev</code>, <code>next</code> = 16 bytes per node). Pure arrays require slow reallocations when growing large.',
        'Redis Lists use <b>Quicklist</b>: a doubly-linked list where each node is a compact <b>Listpack chunk</b> (typically 8KB). Middle nodes can also be compressed using LZF compression.'
      ],
      callout: {
        kind: 'insight',
        text: 'Quicklist combines fast O(1) push/pop at the heads with high memory density in the chunks.'
      },
      metrics: { data_struct: 'quicklist', encoding: 'OBJ_ENCODING_QUICKLIST', time_complexity: 'O(1) Head / Tail', memory_efficiency: 'Hybrid Compressed' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Queue Producer', tags: [{ text: 'LPUSH / RPOP', icon: 'zap' }] }),
          ql: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'layers', label: ['Quicklist Container', 'Doubly-Linked Chunks'], sub: 'Node 1 (LP) <-> Node 2 (LP)' }),
          card: S({ x: -2, y: 14 }, 'Quicklist Structure', [
            'Head Node [Listpack 8KB] <--> Middle Node [LZF Compressed] <--> Tail Node [Listpack 8KB]',
            '- Push and pop operations hit the uncompressed head/tail nodes in O(1)',
            '- Middle nodes are transparently compressed to save RAM',
            '- Config: list-max-listpack-size -2 (8KB chunks)'
          ], { icon: 'layers' })
        },
        links: {
          cq: h('client', 'ql', ['client', 'ql'], { heads: 'both', label: 'Push / Pop Operations' })
        },
        flows: [{ route: ['cq'], bounce: true, rate: 2.6 }]
      }
    },
    {
      short: 'Memory Waste Trap',
      chapter: 'deep',
      title: 'Top-Level Key Explosion vs Hash Compression',
      body: [
        'Beginners often store millions of records as individual top-level keys: <code>user:1:name</code>, <code>user:1:age</code>, <code>user:1:email</code>.',
        'Each top-level key pays the 16-byte <code>redisObject</code>, 24-byte <code>dictEntry</code>, and SDS header overhead. Storing 10 million individual strings requires <b>over 1.2 GB of RAM</b> just for metadata!'
      ],
      callout: {
        kind: 'alert',
        text: 'Top-level key metadata often consumes more memory than the actual user data payload.'
      },
      metrics: { data_struct: 'Top-Level Strings', encoding: 'Fragmented RAW', time_complexity: 'O(1)', memory_efficiency: '80% Wasted Metadata' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'App Client', tags: [{ text: '10M Top-level Keys', tone: 'red', icon: 'alert' }] }),
          db: d(6, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Fragmented RAM', 'Overhead: 1.2 GB'], sub: 'Payload: only 200MB!' }),
          card: S({ x: -2, y: 14 }, 'Memory Breakdown for 1 String Key', [
            '- dictEntry (Hash table node): 24 bytes',
            '- key (SDS string): 16 bytes',
            '- val redisObject header: 16 bytes',
            '- val (SDS string): 16 bytes',
            '- Jemalloc allocator rounding: 8 bytes',
            'Total: ~80 bytes overhead to store a 5-byte integer!'
          ], { icon: 'alert' })
        },
        links: {
          cd: h('client', 'db', ['client', 'db'], { heads: 'both', label: 'Metadata Bloat' })
        },
        flows: [{ route: ['cd'], bounce: true, rate: 2.0 }]
      }
    },
    {
      short: 'Hash Optimization',
      chapter: 'solution',
      title: 'Best Practice: Hash Field Bucketing (80% RAM Saved)',
      body: [
        'By grouping records into fixed-size Hashes (e.g. <code>HSET users:100 42 "John"</code>), Redis encodes the hash as a compact <b>Listpack</b>.',
        'The 16-byte robj and dictEntry overhead is paid once per 500 records rather than on every single key. Memory consumption for 10 million records drops from <b>1.2 GB to 280 MB</b>!'
      ],
      callout: {
        kind: 'insight',
        text: 'Hash bucketing: key = id / 500, field = id % 500. A legendary Redis memory optimization pattern.'
      },
      metrics: { data_struct: 'Hashed Buckets', encoding: 'OBJ_ENCODING_LISTPACK', time_complexity: 'O(1) Lookups', memory_efficiency: '75% RAM Saved' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Optimized App', tags: [{ text: 'HSET users:1 42 data', tone: 'green', icon: 'zap' }] }),
          redis: d(6, 8, { s: 4.8, h: 50, color: 'green', glyph: 'database', label: ['Compact Redis Hash', '280 MB Total RAM'], sub: 'Listpack Encoded (500 fields)' }),
          card: S({ x: -2, y: 14 }, 'Hash Bucketing Implementation', [
            'Function getBucket(userId):',
            '  bucketKey = "users:" + (userId / 500);',
            '  field = userId % 500;',
            '  return redis.hget(bucketKey, field);',
            'Result: 1.2 GB RAM reduced to 280 MB with identical lookups'
          ], { icon: 'zap' })
        },
        links: {
          cr: h('client', 'redis', ['client', 'redis'], { heads: 'both', label: 'Efficient Listpack Hash' })
        },
        flows: [{ route: ['cr'], bounce: true, rate: 3.2 }]
      }
    }
  ]
};
