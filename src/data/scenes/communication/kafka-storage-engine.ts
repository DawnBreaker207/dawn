// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const kafkaStorageEngineLesson = {
  id: 'kafka-storage-engine',
  title: 'Kafka Storage Internals: PageCache & Zero-Copy',
  summary: 'How Kafka saturates 10 Gbps network cards using disk: sequential log segments, sparse indexes, OS PageCache, and the sendfile() zero-copy system call.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['storage_mode', 'io_throughput', 'copy_overhead', 'cache_hit_rate'],
  legend: ['req', 'res', ['ping', 'zero-copy stream'], 'fail'],
  goals: [
    { text: 'Why sequential disk I/O rivals memory bandwidth', step: 1 },
    { text: 'Log segment files .log, .index, and .timeindex', step: 2 },
    { text: 'OS PageCache utilization and zero JVM garbage collection', step: 3 },
    { text: 'The Linux sendfile() zero-copy system call mechanism', step: 4 },
    { text: 'Log compaction by key for stateful changelog streams', step: 6 },
  ],
  steps: [
    {
      short: 'Sequential vs Random I/O',
      chapter: 'setup',
      title: 'The Mechanical Advantage of Sequential I/O',
      body: [
        'Many engineers assume disk storage is too slow for real-time messaging. This is true for <b>Random I/O</b> (B-Trees seeking across disk sectors), but completely false for <b>Sequential I/O</b>.',
        'Sequential write speed on modern NVMe SSDs reaches <b>3,500 MB/s</b> (and even mechanical HDDs hit 150 MB/s). Kafka structures every partition as an immutable append-only file, turning the disk into a continuous sequential write pipeline.'
      ],
      callout: {
        kind: 'insight',
        text: 'Sequential disk access can be faster than random memory access with CPU pointer chasing.'
      },
      metrics: { storage_mode: 'Sequential Disk', io_throughput: '3,200 MB/s', copy_overhead: '0 Context Sw', cache_hit_rate: '99%' },
      scene: {
        entities: {
          producer: y(-10, -8, { form: 'phone', label: 'Producer', tags: [{ text: 'Sequential Stream', icon: 'zap' }] }),
          disk: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Append-Only Segment', 'Sequential NVMe'], sub: 'Zero Disk Seeks' }),
          card: S({ x: -2, y: 14 }, 'I/O Throughput Comparison', [
            '- Random HDD seek: ~100 IOPS (0.8 MB/s)',
            '- Random SSD read: ~50,000 IOPS (200 MB/s)',
            '- Sequential HDD append: 150 MB/s',
            '- Sequential NVMe append: 3,500 MB/s (Near RAM speed!)',
            'Kafka only ever does sequential appends to the log tail'
          ], { icon: 'trendingUp' })
        },
        links: {
          pd: h('producer', 'disk', ['producer', 'disk'], { heads: 'end', label: 'Continuous Append' })
        },
        flows: [{ route: ['pd'], bounce: false, rate: 3.2 }]
      }
    },
    {
      short: 'Log Segments',
      chapter: 'technique',
      title: 'Partition Anatomy: Segments (.log, .index, .timeindex)',
      body: [
        'A single partition cannot be stored in one giant endless file. Kafka splits each partition into <b>Log Segments</b> (typically 1 GB each or 7 days).',
        'Each segment consists of 3 files on disk:<br>• <code>000000.log:</code> Actual binary message payloads.<br>• <code>000000.index:</code> <b>Sparse Index</b> mapping logical offset to physical byte position.<br>• <code>000000.timeindex:</code> Maps timestamp to logical offset.'
      ],
      callout: {
        kind: 'tip',
        text: 'The file name is always the base offset of the first record in that segment (e.g. 00000000000010485760.log).'
      },
      metrics: { storage_mode: 'Segmented Disk Files', io_throughput: '1 GB Rollover', copy_overhead: 'Sparse Index', cache_hit_rate: '100%' },
      scene: {
        entities: {
          broker: d(-8, -4, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Partition 0 Dir', '/var/lib/kafka/data'], sub: 'orders-0/' }),
          logFile: d(6, -10, { s: 4.4, h: 52, color: 'purple', glyph: 'folder', label: ['000000.log (1GB)', 'Binary RecordBatches'], sub: 'Payload bytes' }),
          idxFile: d(6, 4, { s: 4.4, h: 52, color: 'teal', glyph: 'listOrdered', label: ['000000.index (10MB)', 'Sparse Memory Map'], sub: 'Offset -> Byte position' }),
          card: S({ x: -2, y: 14 }, 'Segment File Structure', [
            '/data/orders-0/',
            '├── 00000000000000000000.log       (1 GB message payloads)',
            '├── 00000000000000000000.index     (Sparse index: offset -> byte)',
            '├── 00000000000000000000.timeindex (Timestamp -> offset)',
            '└── leader-epoch-checkpoint        (HW replication state)'
          ], { icon: 'folder' })
        },
        links: {
          bl: h('broker', 'logFile', ['broker', 'logFile'], { heads: 'end' }),
          bi: h('broker', 'idxFile', ['broker', 'idxFile'], { heads: 'end' })
        },
        flows: [
          { route: ['bl'], bounce: false, rate: 2.0 },
          { route: ['bi'], bounce: false, rate: 1.5 }
        ]
      }
    },
    {
      short: 'Sparse Indexing',
      chapter: 'technique',
      title: 'Sparse Index & Binary Search in Memory',
      body: [
        'Indexing every single message would consume massive RAM. Kafka uses a <b>Sparse Index</b> (logging 1 index entry every 4,096 bytes of log).',
        'To find message at offset <b>#402</b>: 1. Kafka runs binary search on the in-memory memory-mapped <code>.index</code> file to find nearest entry (offset #400 = byte 16,384).<br>2. Scans forward just 2 records sequentially in the <code>.log</code> file. Instant sub-millisecond retrieval with tiny memory footprint!'
      ],
      callout: {
        kind: 'insight',
        text: 'The sparse index is mmap\'d into memory, making lookups blazing fast without loading message bodies into the JVM.'
      },
      metrics: { storage_mode: 'mmap Sparse Index', io_throughput: 'O(log N) + Scan', copy_overhead: 'Zero JVM Heap', cache_hit_rate: '100%' },
      scene: {
        entities: {
          consumer: y(-10, -8, { form: 'phone', label: 'Consumer', tags: [{ text: 'Fetch Offset #402', icon: 'search' }] }),
          sparseIdx: d(6, 8, { s: 4.8, h: 50, color: 'teal', glyph: 'listOrdered', label: ['Memory-Mapped Index', 'mmap(000000.index)'], sub: 'Binary search in RAM' }),
          card: S({ x: -2, y: 14 }, 'Sparse Index Lookup', [
            'Target Offset: 402',
            'Index Entry [Offset 400 -> Byte 16384]',
            'Index Entry [Offset 408 -> Byte 20480]',
            '1. Binary search identifies entry at Offset 400',
            '2. Seek to byte 16,384 in .log file and scan forward 2 messages',
            'Result: O(log N) lookup without indexing every message!'
          ], { icon: 'search' })
        },
        links: {
          ci: h('consumer', 'sparseIdx', ['consumer', 'sparseIdx'], { heads: 'both', label: 'Seek by Offset' })
        },
        flows: [{ route: ['ci'], bounce: true, rate: 2.5 }]
      }
    },
    {
      short: 'OS PageCache',
      chapter: 'deep',
      title: 'Zero JVM Cache: Riding the OS PageCache',
      body: [
        'Why doesn\'t Kafka cache messages inside the Java JVM Heap? Because JVM object headers double memory size, and garbage collection (GC) pauses would freeze the broker.',
        'Instead, Kafka relies 100% on the <b>Linux OS PageCache</b>. All free RAM is automatically used by the Linux kernel to cache disk pages. When consumers read recent messages, they read straight from RAM PageCache with <b>zero JVM GC overhead</b>!'
      ],
      callout: {
        kind: 'tip',
        text: 'If you restart Kafka, the OS PageCache stays warm in Linux kernel memory. Restarts are instantaneous.'
      },
      metrics: { storage_mode: 'Linux PageCache', io_throughput: 'RAM Read Speed', copy_overhead: '0ms GC Pauses', cache_hit_rate: '99.4% Hits' },
      scene: {
        entities: {
          producer: y(-12, -4, { form: 'phone', label: 'Producer', tags: [{ text: 'Appends', icon: 'zap' }] }),
          pageCache: d(-2, -4, { s: 4.8, h: 50, color: 'green', glyph: 'database', label: ['Linux OS PageCache', 'Warm Kernel RAM'], sub: 'Automatic Page Buffering' }),
          consumer: y(10, -4, { form: 'phone', label: 'Consumer', tags: [{ text: 'Reads from RAM', icon: 'zap' }] }),
          card: S({ x: -2, y: 14 }, 'Why PageCache Trumps JVM Heap', [
            '1. No JVM Garbage Collection (GC) pauses: Zero heap bloat',
            '2. Direct memory density: No 24-byte Java object wrappers',
            '3. Persistent across restarts: Rebooting the broker does NOT drop cache',
            '4. Producers write to PageCache; Consumers read from same PageCache',
            'Result: 99.4% of reads never touch physical disk!'
          ], { icon: 'check' })
        },
        links: {
          ppc: h('producer', 'pageCache', ['producer', 'pageCache'], { heads: 'end' }),
          pcc: h('pageCache', 'consumer', ['pageCache', 'consumer'], { heads: 'end' })
        },
        flows: [
          { route: ['ppc'], bounce: false, rate: 3.0 },
          { route: ['pcc'], bounce: false, rate: 3.0 }
        ]
      }
    },
    {
      short: 'Zero-Copy sendfile()',
      chapter: 'technique',
      title: 'Zero-Copy Reads: The Linux sendfile() System Call',
      body: [
        'In traditional server architectures, sending a file to the network requires <b>4 context switches and 4 memory copies</b> (Disk → OS Cache → User Buffer → Socket Buffer → NIC Buffer).',
        'Kafka uses <b>Zero-Copy (<code>sendfile()</code> / <code>FileChannel.transferTo</code>)</b>: the Linux kernel copies bytes directly from the OS PageCache to the Network Interface Card (NIC) via DMA. User-space memory is completely bypassed!'
      ],
      callout: {
        kind: 'insight',
        text: 'Zero-Copy allows Kafka to easily saturate a 10 Gbps network card with less than 15% CPU utilization.'
      },
      metrics: { storage_mode: 'Zero-Copy sendfile()', io_throughput: '10 Gbps Saturated', copy_overhead: 'ZERO CPU Copies', cache_hit_rate: 'Direct to NIC' },
      scene: {
        entities: {
          pageCache: d(-8, -4, { s: 4.8, h: 50, color: 'green', glyph: 'database', label: ['OS PageCache (DMA)', 'Kernel Memory'], sub: 'File Channel' }),
          nic: d(8, 4, { s: 4.8, h: 50, color: 'blue', glyph: 'network', label: ['Network Card (NIC)', 'DMA Ring Buffer'], sub: '10 Gbps Line Rate' }),
          card: S({ x: 0, y: 14 }, 'Traditional vs Zero-Copy Path', [
            'Traditional read/write (4 copies, 4 context switches):',
            '  Disk -> OS PageCache -> User Space -> Socket Buffer -> NIC',
            'Linux sendfile() Zero-Copy (0 CPU copies, 2 context switches):',
            '  OS PageCache --------[DMA Transfer]--------> NIC Buffer',
            'CPU does zero byte copying: Kernel handles everything via DMA!'
          ], { icon: 'zap' })
        },
        links: {
          pn: h('pageCache', 'nic', ['pageCache', 'nic'], { heads: 'end', label: 'Direct DMA Zero-Copy' })
        },
        flows: [{ route: ['pn'], bounce: false, rate: 3.8 }]
      }
    },
    {
      short: 'Log Compaction',
      chapter: 'deep',
      title: 'Log Compaction: Retaining the Latest State per Key',
      body: [
        'By default, Kafka deletes segments based on age (<code>log.retention.hours=168</code> / 7 days) or size.',
        'With <b>Log Compaction (<code>cleanup.policy=compact</code>)</b>, Kafka retains at least the <b>latest value for every message key</b> forever. If user #42 updates their email 5 times, compaction cleans up older records, making Kafka a changelog database (like RocksDB)!'
      ],
      callout: {
        kind: 'tip',
        text: 'Compaction powers the Kafka internal __consumer_offsets topic and KTable state stores in Kafka Streams.'
      },
      metrics: { storage_mode: 'cleanup.policy=compact', io_throughput: 'Compacted', copy_overhead: 'Tombstones', cache_hit_rate: 'Latest Key Only' },
      scene: {
        entities: {
          uncompacted: d(-8, -4, { s: 4.4, h: 52, color: 'amber', glyph: 'folder', label: ['Uncompacted Log', 'Historical Updates'], sub: 'K1:v1, K2:v1, K1:v2' }),
          cleaner: d(8, 4, { s: 4.8, h: 50, color: 'purple', glyph: 'refresh', label: ['Log Cleaner Thread', 'Deduplicated State'], sub: 'K1:v2, K2:v1 (Tombstones)' }),
          card: S({ x: 0, y: 14 }, 'Log Compaction Mechanism', [
            'Log Cleaner scans the segment and builds a SkimpyOffsetMap of keys',
            'Head (active segment): Appends new records',
            'Tail (dirty log): Cleaner discards older records with matching keys',
            'Tombstone (value = null): Deletes key completely after delete.retention.ms'
          ], { icon: 'refresh' })
        },
        links: {
          uc: h('uncompacted', 'cleaner', ['uncompacted', 'cleaner'], { heads: 'end', label: 'Deduplicate by Key' })
        },
        flows: [{ route: ['uc'], bounce: false, rate: 2.2 }]
      }
    },
    {
      short: 'Storage Tuning',
      chapter: 'solution',
      title: 'Production OS & Storage Tuning Checklist',
      body: [
        'To achieve 1M+ msg/s without latency spikes, production Kafka brokers require specific OS tuning:',
        '1. Filesystem: <b>XFS</b> (faster sequential allocation than ext4).<br>2. Mount flags: <code>noatime</code> (disables access timestamp writes on read).<br>3. VM dirty ratio: Tune <code>vm.dirty_background_ratio=5</code> to flush pages continuously rather than causing massive I/O freezes.'
      ],
      callout: {
        kind: 'insight',
        text: 'Never use RAID 5 on Kafka brokers: use RAID 10 or JBOD (Just a Bunch of Disks) with application-level replication.'
      },
      metrics: { storage_mode: 'XFS + JBOD NVMe', io_throughput: 'Production Ready', copy_overhead: 'noatime', cache_hit_rate: 'Tuned PageCache' },
      scene: {
        entities: {
          storageNode: d(0, 0, { s: 5.2, h: 52, color: 'blue', glyph: 'database', label: ['Tuned Storage Engine', 'XFS + JBOD NVMe Array'], sub: 'vm.dirty_ratio = 10' }),
          card: S({ x: -2, y: 14 }, 'Production Tuning Checklist', [
            '1. /etc/fstab: mount -o noatime,nodiratime,nobarrier (XFS)',
            '2. sysctl -w vm.dirty_background_ratio = 5 (Smooth flushing)',
            '3. sysctl -w vm.dirty_ratio = 10 (Prevents flush freezes)',
            '4. Use JBOD: Kafka natively handles multi-disk path failover',
            '5. Leave 50% of machine RAM unallocated for Linux PageCache!'
          ], { icon: 'check' })
        },
        links: {},
        flows: []
      }
    }
  ]
};
