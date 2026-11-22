// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const kafkaClusterKraftLesson = {
  id: 'kafka-cluster-kraft',
  title: 'Apache Kafka Architecture: Partitions & KRaft Consensus',
  summary: 'Inside modern Kafka: partition log sharding, producers, and the retirement of ZooKeeper in favor of the high-speed KRaft metadata quorum.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['consensus_mode', 'topic_partitions', 'metadata_latency', 'cluster_brokers'],
  legend: ['req', 'res', ['ping', 'partition flow'], 'fail'],
  goals: [
    { text: 'Kafka distributed partition log design and ordering guarantees', step: 1 },
    { text: 'Why ZooKeeper was replaced by KRaft (KIP-500)', step: 2 },
    { text: 'KRaft metadata quorum and the internal @metadata log', step: 3 },
    { text: 'Producer partition routing strategies and sticky partitioner', step: 4 },
    { text: 'Sub-second active controller leader election in KRaft', step: 6 },
  ],
  steps: [
    {
      short: 'Why Kafka?',
      chapter: 'setup',
      title: 'The Distributed Commit Log Paradigm',
      body: [
        'Traditional message queues (RabbitMQ, SQS) delete messages once acknowledged. <b>Apache Kafka</b> is built on a fundamentally different concept: an immutable, append-only <b>Distributed Commit Log</b>.',
        'Messages are retained for days, weeks, or indefinitely. Multiple independent consumer systems read the log at their own pace without removing messages, enabling event streaming at millions of records per second.'
      ],
      callout: {
        kind: 'insight',
        text: 'In Kafka, reading a message does not mutate state. Consumers simply advance an offset pointer.'
      },
      metrics: { consensus_mode: 'KRaft Native', topic_partitions: '3 Partitions', metadata_latency: 'Sub-ms', cluster_brokers: '3 Brokers' },
      scene: {
        entities: {
          producer: y(-10, -8, { form: 'phone', label: 'Order App', tags: [{ text: '100,000 Events/s', icon: 'zap' }] }),
          broker: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Kafka Broker 1', 'Topic: orders'], sub: 'Immutable Append Log' }),
          card: S({ x: -2, y: 14 }, 'Queue vs Distributed Commit Log', [
            'Traditional Queue (RabbitMQ):',
            '  - Message removed once consumed -> One-to-one delivery',
            'Kafka Distributed Log:',
            '  - Messages appended to immutable disk log with strict offset',
            '  - Billing, Analytics, and Fraud check all read same log independently',
            '  - Consumers can rewind offset to replay history!'
          ], { icon: 'listOrdered' })
        },
        links: {
          pb: h('producer', 'broker', ['producer', 'broker'], { heads: 'end', label: 'Append Records' })
        },
        flows: [{ route: ['pb'], bounce: false, rate: 2.8 }]
      }
    },
    {
      short: 'Partitions & Ordering',
      chapter: 'technique',
      title: 'Topic Partitions: The Unit of Parallelism',
      body: [
        'A Kafka Topic is split into multiple <b>Partitions</b> distributed across different physical brokers.',
        '<b>Ordering is strictly guaranteed within a single partition, NOT across the entire topic</b>. By hashing a partition key (e.g. <code>hash(order_id)</code>), all events for that specific order land on the same partition in exact chronological sequence.'
      ],
      callout: {
        kind: 'tip',
        text: 'Adding partitions increases parallelism: 10 partitions can be consumed simultaneously by 10 consumer instances.'
      },
      metrics: { consensus_mode: 'KRaft Native', topic_partitions: 'Partitions 0, 1, 2', metadata_latency: '1ms', cluster_brokers: '3 Brokers' },
      scene: {
        entities: {
          producer: y(-12, -4, { form: 'phone', label: 'Producer', tags: [{ text: 'hash(order_id)', icon: 'zap' }] }),
          p0: d(6, -10, { s: 4.4, h: 52, color: 'blue', glyph: 'layers', label: ['Partition 0 (Broker 1)', 'Offsets: 0..9420'], sub: 'Order #100 events' }),
          p1: d(6, -2, { s: 4.4, h: 52, color: 'teal', glyph: 'layers', label: ['Partition 1 (Broker 2)', 'Offsets: 0..8112'], sub: 'Order #101 events' }),
          p2: d(6, 6, { s: 4.4, h: 52, color: 'purple', glyph: 'layers', label: ['Partition 2 (Broker 3)', 'Offsets: 0..9050'], sub: 'Order #102 events' }),
          card: S({ x: -2, y: 16 }, 'Partition Ordering Law', [
            'Rule 1: Events within Partition 0 are strictly ordered (Offset 0, 1, 2...)',
            'Rule 2: No order guarantee between Partition 0 and Partition 1',
            'To guarantee customer event order: Use customerId as message key!',
            'All events for customer A land on same partition in exact order'
          ], { icon: 'layers' })
        },
        links: {
          pp0: h('producer', 'p0', ['producer', 'p0'], { heads: 'end' }),
          pp1: h('producer', 'p1', ['producer', 'p1'], { heads: 'end' }),
          pp2: h('producer', 'p2', ['producer', 'p2'], { heads: 'end' })
        },
        flows: [
          { route: ['pp0'], bounce: false, rate: 1.8 },
          { route: ['pp1'], bounce: false, rate: 1.8 },
          { route: ['pp2'], bounce: false, rate: 1.8 }
        ]
      }
    },
    {
      short: 'ZooKeeper Flaw',
      chapter: 'problem',
      title: 'The ZooKeeper Bottleneck (Why KIP-500 Was Born)',
      body: [
        'In legacy Kafka, cluster metadata (topics, partitions, replicas, ACLs) was stored in an external Apache ZooKeeper cluster.',
        'ZooKeeper had severe limitations: 1. Maximum 200,000 partitions per cluster.<br>2. When the active controller broker died, loading all metadata from ZooKeeper took <b>several minutes</b>, stalling the entire enterprise pipeline.'
      ],
      callout: {
        kind: 'alert',
        text: 'ZooKeeper was a foreign dependency requiring separate JVM tuning, security configurations, and operational overhead.'
      },
      metrics: { consensus_mode: 'Legacy ZooKeeper', topic_partitions: 'Capped at 200k', metadata_latency: '150s Failover!', cluster_brokers: 'Dual Systems' },
      scene: {
        entities: {
          zk: d(-8, -4, { s: 4.6, h: 52, color: 'rose', glyph: 'database', label: ['External ZooKeeper', 'Metadata Bottleneck'], sub: 'Slow Full-State Sync' }),
          broker: d(8, 4, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Kafka Controller', 'JVM Memory Rebuild'], sub: 'Stalled 3 minutes on reboot' }),
          card: S({ x: 0, y: 14 }, 'ZooKeeper Flaws', [
            '1. Dual-system operational burden (Kafka cluster + ZK cluster)',
            '2. Partition ceiling: Cannot exceed 200,000 partitions',
            '3. Controller failover latency: Controller had to scan ZK tree on boot',
            'Solution: KIP-500 (Kafka Raft Metadata Mode - KRaft)!'
          ], { icon: 'alert' })
        },
        links: {
          zb: h('zk', 'broker', ['zk', 'broker'], { heads: 'both', label: 'Slow ZNode RPCs' })
        },
        flows: [{ route: ['zb'], bounce: true, rate: 1.2 }]
      }
    },
    {
      short: 'KRaft Consensus',
      chapter: 'technique',
      title: 'Modern Kafka: KRaft (Kafka Raft Consensus)',
      body: [
        'Starting in Kafka 3.3+, ZooKeeper is completely removed. Metadata is managed natively using an event-driven Raft consensus algorithm called <b>KRaft</b>.',
        'Metadata changes are stored as records in a special internal topic: <code>@metadata</code>. All brokers replicate this log in real time and maintain an in-memory snapshot of cluster state, scaling to millions of partitions.'
      ],
      callout: {
        kind: 'insight',
        text: 'KRaft handles millions of partitions per cluster with sub-second controller failovers.'
      },
      metrics: { consensus_mode: 'KRaft Native Quorum', topic_partitions: 'Millions of Partitions', metadata_latency: '< 20ms', cluster_brokers: 'Unified Cluster' },
      scene: {
        entities: {
          c1: d(-8, -4, { s: 4.6, h: 52, color: 'orange', glyph: 'shield', label: ['KRaft Leader', 'Active Controller'], sub: 'Appends to @metadata' }),
          c2: d(8, -4, { s: 4.4, h: 52, color: 'orange', glyph: 'shield', label: ['KRaft Follower', 'Controller 2'], sub: 'In-Memory State Synced' }),
          broker: d(0, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Data Broker', 'Zero ZooKeeper'], sub: 'Replicates @metadata log' }),
          card: S({ x: -2, y: 16 }, 'KRaft Architecture (KIP-500)', [
            '1. Raft consensus quorum elected among Kafka controller nodes',
            '2. Cluster metadata stored as standard Kafka records in @metadata log',
            '3. Zero polling: State changes streamed directly to all brokers',
            '4. Eliminates external ZooKeeper entirely (Single binary deployment)'
          ], { icon: 'check' })
        },
        links: {
          c12: h('c1', 'c2', ['c1', 'c2'], { heads: 'both', label: 'Raft Consensus' }),
          c1b: h('c1', 'broker', ['c1', 'broker'], { heads: 'end', label: '@metadata sync' })
        },
        flows: [
          { route: ['c12'], bounce: true, rate: 2.0 },
          { route: ['c1b'], bounce: false, rate: 2.5 }
        ]
      }
    },
    {
      short: 'Producer Partitioner',
      chapter: 'deep',
      title: 'Producer Partitioning & The Sticky Partitioner',
      body: [
        'When a producer calls <code>send(record)</code>, the partitioner determines which partition receives the message.',
        '• <b>Keyed messages:</b> <code>MurmurHash2(key) % numPartitions</code> guarantees all keys with the same ID land together.<br>• <b>Non-keyed messages:</b> The <b>Sticky Partitioner</b> batches records to fill one partition buffer before switching to the next, maximizing compression and network throughput.'
      ],
      callout: {
        kind: 'tip',
        text: 'The Sticky Partitioner (KIP-480) reduces latency by 50% on non-keyed streams by eliminating tiny 1-message network packets.'
      },
      metrics: { consensus_mode: 'KRaft', topic_partitions: 'Optimized Batch', metadata_latency: 'Sub-ms', cluster_brokers: 'Sticky Batch' },
      scene: {
        entities: {
          producer: y(-10, -8, { form: 'phone', label: 'Producer App', tags: [{ text: 'Sticky Batching 16KB', icon: 'zap' }] }),
          broker: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Kafka Broker', 'Batch Ingestion'], sub: 'Full 16KB RecordBatches' }),
          card: S({ x: -2, y: 14 }, 'Producer Batching Parameters', [
            '- batch.size: 16384 (16 KB buffer per partition)',
            '- linger.ms: 20 (Wait up to 20ms to fill the batch)',
            '- compression.type: zstd or lz4 (Compresses entire batch)',
            'Result: Massive network throughput increase with minimal CPU'
          ], { icon: 'layers' })
        },
        links: {
          pb: h('producer', 'broker', ['producer', 'broker'], { heads: 'end', label: 'Compressed RecordBatches' })
        },
        flows: [{ route: ['pb'], bounce: false, rate: 3.2 }]
      }
    },
    {
      short: 'Controller Failover',
      chapter: 'solution',
      title: 'KRaft Sub-Second Controller Failover',
      body: [
        'In KRaft, every controller node already holds the complete cluster metadata in memory by continuously tailing the <code>@metadata</code> log.',
        'When the active controller crashes, the remaining controller nodes run a Raft leader election. The new leader takes over immediately in <b>less than 200 milliseconds</b> because there is zero metadata reload delay!'
      ],
      callout: {
        kind: 'insight',
        text: 'Controller failover time dropped from 3 minutes in ZooKeeper to 200 milliseconds in KRaft.'
      },
      metrics: { consensus_mode: 'KRaft Failover', topic_partitions: 'Millions Safe', metadata_latency: '180ms Takeover!', cluster_brokers: 'Zero Downtime' },
      scene: {
        entities: {
          deadC1: d(-8, -4, { s: 4.4, h: 52, color: 'rose', glyph: 'shield', label: ['Old Leader C1 (FAIL)', 'Heartbeat Missed'], sub: 'Dead' }),
          newC2: d(8, 4, { s: 4.8, h: 50, color: 'green', glyph: 'shield', label: ['Elected Leader C2', 'NEW CONTROLLER'], sub: 'Takes over in 180ms!' }),
          card: S({ x: 0, y: 14 }, 'KRaft Failover Sequence', [
            '1. Controller C1 misses heartbeat timeout (heartbeat.interval.ms)',
            '2. Controller C2 starts Raft election: votes granted by quorum',
            '3. C2 has already replicated @metadata log: State is 100% current!',
            '4. Total failover time: < 200 ms (Zero ZooKeeper reload lag)'
          ], { icon: 'zap' })
        },
        links: {
          dc: h('deadC1', 'newC2', ['deadC1', 'newC2'], { heads: 'end', label: 'Raft Takeover' })
        },
        flows: [{ route: ['dc'], bounce: false, rate: 2.0 }]
      }
    },
    {
      short: 'Summary Matrix',
      chapter: 'solution',
      title: 'Kafka Production Cluster Architecture',
      body: [
        'A production KRaft cluster runs combined or dedicated broker and controller nodes.',
        'Producers publish to partition leaders, followers replicate the log, consumers read via consumer groups, and KRaft controllers maintain the global topology state seamlessly.'
      ],
      callout: {
        kind: 'tip',
        text: 'Deploy 3 dedicated KRaft controller nodes alongside your data broker fleet for maximum cluster stability.'
      },
      metrics: { consensus_mode: 'KRaft Production', topic_partitions: '1,000,000', metadata_latency: 'Sub-ms', cluster_brokers: 'Enterprise Ready' },
      scene: {
        entities: {
          producer: y(-12, -4, { form: 'phone', label: 'Producers', tags: [{ text: 'Zstd Batches', icon: 'zap' }] }),
          kraftQuorum: d(-2, -4, { s: 4.8, h: 50, color: 'orange', glyph: 'shield', label: ['KRaft Quorum (3x)', 'Metadata Controllers'], sub: '@metadata log' }),
          brokers: d(8, -4, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Data Broker Pool', 'Partitions 0..N'], sub: 'Zero-Copy Storage' }),
          card: S({ x: -2, y: 14 }, 'Kafka Architecture Checklist', [
            '- Protocol: Binary TCP on port 9092',
            '- Storage: Append-only disk segments + OS PageCache',
            '- Consensus: KRaft metadata quorum (ZooKeeper deprecated)',
            '- Consumer offsets: Stored in __consumer_offsets topic'
          ], { icon: 'check' })
        },
        links: {
          pk: h('producer', 'brokers', ['producer', 'brokers'], { heads: 'end' }),
          kb: h('kraftQuorum', 'brokers', ['kraftQuorum', 'brokers'], { heads: 'both' })
        },
        flows: [
          { route: ['pk'], bounce: false, rate: 3.0 },
          { route: ['kb'], bounce: true, rate: 1.5 }
        ]
      }
    }
  ]
};
