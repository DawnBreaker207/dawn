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

// ============================================================================
// AWS SAA-C03: STORAGE & DATABASE TIERING
// ============================================================================
export const awsStorageDbLesson = {
  id: `aws-storage-db`,
  title: `AWS Storage & Database Architecture`,
  summary: `Evaluate storage and database trade-offs: S3 lifecycle tiers, EBS vs EFS, Amazon Aurora shared-storage clusters, and DynamoDB single-digit ms scale.`,
  minutes: 15,
  level: `intermediate`,
  metrics: [`storage_class`, `ebs_iops`, `aurora_replicas`, `dynamo_lat`, `cost_opt`],
  legend: [`req`, `res`, [`ping`, `storage read`], `fail`],
  goals: [
    { text: `Amazon S3 Storage Classes & Intelligent-Tiering Lifecycles`, step: 1 },
    { text: `EBS Block Storage vs EFS Shared POSIX File System`, step: 2 },
    { text: `Amazon Aurora Multi-AZ: 6 copies across 3 AZs & 15 Read Replicas`, step: 3 },
    { text: `Amazon DynamoDB: Single-digit millisecond NoSQL, DAX, and Global Tables`, step: 4 },
    { text: `Amazon ElastiCache: Redis Cluster vs Memcached in-memory caching`, step: 5 },
  ],
  steps: [
    {
      short: `S3 Tiering`,
      chapter: `technique`,
      title: `Amazon S3 Storage Classes & Lifecycle Rules`,
      body: [
        `Amazon S3 offers 99.999999999% (11 9's) durability by storing objects redundantly across multiple AZs.`,
        `To optimize cost at scale, SAA-C03 designs use <strong>Lifecycle Rules</strong>:`,
        `• <strong>S3 Standard</strong>: Frequent access, millisecond latency.`,
        `• <strong>S3 Standard-Infrequent Access (IA)</strong>: Lower storage fee, retrieval fee per GB.`,
        `• <strong>S3 Intelligent-Tiering</strong>: Automatically shifts objects between tiers without retrieval fees.`,
        `• <strong>S3 Glacier Flexible / Deep Archive</strong>: Long-term compliance backup (cents per TB, hours retrieval).`,
      ],
      callout: {
        kind: `tip`,
        text: `S3 Intelligent-Tiering is the best practice for unpredictable or changing access patterns with zero operational overhead.`,
      },
      changes: [
        `+ Lifecycle Policy: 30 days → S3 Standard-IA`,
        `+ Lifecycle Policy: 90 days → Glacier Flexible`,
        `+ Lifecycle Policy: 365 days → Glacier Deep Archive`,
      ],
      metrics: {
        storage_class: `Tiered`,
        ebs_iops: `—`,
        aurora_replicas: `—`,
        dynamo_lat: `—`,
        cost_opt: `Save 70%`,
      },
      scene: {
        entities: {
          s3_std: b(-10, -4, { r: 1.8, h: 32, label: `S3 Standard ($0.023/GB)`, color: `green` }),
          s3_ia: b(0, 0, { r: 1.8, h: 32, label: `S3 Standard-IA ($0.0125/GB)`, color: `yellow` }),
          s3_glacier: b(10, 4, { r: 1.8, h: 32, label: `Glacier Deep ($0.00099/GB)`, color: `blue` }),
        },
        links: {
          t1: h(`s3_std`, `s3_ia`, [`s3_std`, `s3_ia`], { heads: `end`, label: `30 days` }),
          t2: h(`s3_ia`, `s3_glacier`, [`s3_ia`, `s3_glacier`], { heads: `end`, label: `90 days` }),
        },
        flows: [
          { route: [`t1`], bounce: false, rate: 1.0 },
          { route: [`t2`], bounce: false, rate: 1.0 },
        ],
      },
    },
    {
      short: `EBS vs EFS`,
      chapter: `technique`,
      title: `EBS (Block Storage) vs EFS (Shared File System)`,
      body: [
        `Understanding when to pick EBS vs EFS is a cornerstone of SAA-C03:`,
        `• <strong>Amazon EBS (Elastic Block Store)</strong>: High-performance virtual disk (gp3, io2 Block Express). Bound to ONE Availability Zone, attached to ONE instance at a time (unless io2 Multi-Attach in same AZ). Ideal for databases & boot volumes.`,
        `• <strong>Amazon EFS (Elastic File System)</strong>: Managed network file system (NFSv4). Mountable concurrently by hundreds of EC2 instances / ECS tasks across multiple AZs. Ideal for CMS (WordPress), shared analytics, and container state.`,
      ],
      callout: {
        kind: `insight`,
        text: `Need high IOPS for a relational DB? Use EBS gp3 or io2. Need shared access for 50 web servers across 3 AZs? Use EFS.`,
      },
      changes: [
        `+ EBS gp3 root volume: 3000 baseline IOPS, 125 MB/s`,
        `+ EFS file system mounted via Mount Targets in 3 AZs`,
        `+ ReadWriteMany (RWX) capability enabled`,
      ],
      metrics: {
        storage_class: `EBS + EFS`,
        ebs_iops: `3,000 IOPS`,
        aurora_replicas: `—`,
        dynamo_lat: `—`,
        cost_opt: `Optimized`,
      },
      scene: {
        entities: {
          ec2_1: d(-11, -6, { s: 3.8, h: 42, color: `teal`, glyph: `server`, label: [`EC2 Web Node 1`] }),
          ec2_2: d(11, -6, { s: 3.8, h: 42, color: `teal`, glyph: `server`, label: [`EC2 Web Node 2`] }),
          efs: d(0, 8, { s: 4.4, h: 48, color: `orange`, glyph: `folder`, label: [`Amazon EFS`], sub: `Shared POSIX` }),
        },
        links: {
          m1: h(`ec2_1`, `efs`, [`ec2_1`, `efs`], { heads: `both`, label: `NFS Mount` }),
          m2: h(`ec2_2`, `efs`, [`ec2_2`, `efs`], { heads: `both`, label: `NFS Mount` }),
        },
        flows: [
          { route: [`m1`], bounce: true, rate: 1.5 },
          { route: [`m2`], bounce: true, rate: 1.5 },
        ],
      },
    },
    {
      short: `Aurora Cluster`,
      chapter: `technique`,
      title: `Amazon Aurora Multi-AZ & Distributed Storage`,
      body: [
        `Amazon Aurora re-architects relational databases for the cloud:`,
        `• Storage is independent of compute: data is striped into 10 GB chunks replicated 6 times across 3 AZs.`,
        `• Writes only require a 4 of 6 quorum, eliminating disk stalls.`,
        `• Up to <strong>15 Read Replicas</strong> share the exact same underlying distributed storage with sub-10ms replica lag.`,
        `• Automated failover in under 30 seconds with zero data loss.`,
      ],
      callout: {
        kind: `insight`,
        text: `Aurora Cluster Endpoints simplify code: Writer Endpoint directs to Primary instance; Reader Endpoint load-balances across all 15 Read Replicas.`,
      },
      changes: [
        `+ Aurora PostgreSQL cluster provisioned`,
        `+ 1 Writer instance (us-east-1a)`,
        `+ 2 Read Replicas (us-east-1b, us-east-1c)`,
        `+ Shared 6-way replicated storage volume`,
      ],
      metrics: {
        storage_class: `Aurora SSD`,
        ebs_iops: `Distributed`,
        aurora_replicas: `2 Replicas`,
        dynamo_lat: `< 10ms lag`,
        cost_opt: `Enterprise`,
      },
      scene: {
        entities: {
          writer: b(-8, -4, { r: 2.2, h: 36, label: `Aurora Primary (Writer)`, color: `purple` }),
          reader1: b(8, -8, { r: 1.8, h: 28, label: `Read Replica 1`, color: `blue` }),
          reader2: b(8, 2, { r: 1.8, h: 28, label: `Read Replica 2`, color: `blue` }),
          storage: x({ x0: -11, x1: 11, y0: 5, y1: 11 }, `Aurora Shared Storage (6 Copies / 3 AZs)`),
        },
        links: {
          w_s: h(`writer`, `storage`, [`writer`, `storage`], { heads: `both` }),
          r1_s: h(`reader1`, `storage`, [`reader1`, `storage`], { heads: `both` }),
          r2_s: h(`reader2`, `storage`, [`reader2`, `storage`], { heads: `both` }),
        },
        flows: [
          { route: [`w_s`], bounce: true, rate: 2.0 },
          { route: [`r1_s`], bounce: true, rate: 1.0 },
          { route: [`r2_s`], bounce: true, rate: 1.0 },
        ],
      },
    },
    {
      short: `DynamoDB`,
      chapter: `deep`,
      title: `Amazon DynamoDB & Single-Digit Millisecond Scale`,
      body: [
        `Amazon DynamoDB is a fully managed, serverless key-value and document NoSQL database designed for massive scale.`,
        `• <strong>Single-digit millisecond latency</strong> at any scale (gigabytes to petabytes).`,
        `• <strong>DynamoDB Accelerator (DAX)</strong>: In-memory cache providing microsecond response times for read-heavy workloads without changing query logic.`,
        `• <strong>Global Tables</strong>: Multi-Region Active-Active replication with sub-second replication latency for global apps.`,
      ],
      callout: {
        kind: `tip`,
        text: `Use DynamoDB when you need predictable single-digit ms response times at massive scale without managing connections, shards, or vacuuming.`,
      },
      changes: [
        `+ On-Demand Capacity Mode configured`,
        `+ DAX cluster deployed in VPC (Microsecond reads)`,
        `+ Global Tables replication active across US & EU`,
      ],
      metrics: {
        storage_class: `NoSQL SSD`,
        ebs_iops: `Serverless`,
        aurora_replicas: `Global`,
        dynamo_lat: `< 1ms (DAX)`,
        cost_opt: `On-Demand`,
      },
      scene: {
        entities: {
          app: d(-10, -4, { s: 4.2, h: 44, color: `teal`, glyph: `cpu`, label: [`API Microservice`] }),
          dax: d(0, 0, { s: 4.4, h: 48, color: `orange`, glyph: `zap`, label: [`DAX Cache`], sub: `In-Memory` }),
          dynamo: b(10, 4, { r: 2.2, h: 36, label: `Amazon DynamoDB`, color: `blue` }),
        },
        links: {
          a_dax: h(`app`, `dax`, [`app`, `dax`], { heads: `both`, label: `Cache Hit (<1ms)` }),
          dax_ddb: h(`dax`, `dynamo`, [`dax`, `dynamo`], { heads: `both`, label: `Cache Miss (4ms)` }),
        },
        flows: [
          { route: [`a_dax`], bounce: true, rate: 3.0 },
        ],
      },
    },
    {
      short: `ElastiCache`,
      chapter: `solution`,
      title: `Amazon ElastiCache: Redis Cluster vs Memcached`,
      body: [
        `<strong>Amazon ElastiCache</strong> delivers sub-millisecond responses for session stores, leaderboards, and database query caching.`,
        `• <strong>Redis</strong>: Supports complex data structures (hashes, sorted sets, lists), Multi-AZ replication, automated failover, and pub/sub.`,
        `• <strong>Memcached</strong>: Simple pure key-value caching with multi-threaded horizontal scaling across memory shards.`,
      ],
      callout: {
        kind: `tip`,
        text: `Use Cache-Aside pattern: application checks ElastiCache first on read. On miss, read database and write result into cache with TTL.`,
      },
      changes: [
        `+ ElastiCache Redis Cluster provisioned in Multi-AZ`,
        `+ Lazy loading (Cache-Aside) with 1h TTL`,
        `+ Relieves 90% of read query load on database tier`,
      ],
      metrics: {
        storage_class: `In-Memory RAM`,
        ebs_iops: `Offloaded`,
        aurora_replicas: `Relieved 90%`,
        dynamo_lat: `Sub-millisecond`,
        cost_opt: `Max Throughput`,
      },
      scene: {
        entities: {
          app: d(-10, -4, { s: 4.2, h: 44, color: `teal`, glyph: `server`, label: [`API Cluster`] }),
          redis: d(0, 0, { s: 4.4, h: 48, color: `rose`, glyph: `zap`, label: [`ElastiCache`], sub: `Redis Cluster` }),
          db: b(10, 4, { r: 2.2, h: 36, label: `Primary Aurora DB`, color: `purple` }),
        },
        links: {
          ar: h(`app`, `redis`, [`app`, `redis`], { heads: `both`, label: `Cache-Aside (0.8ms)` }),
          ad: h(`app`, `db`, [`app`, `db`], { heads: `both`, label: `DB Fallback on Miss`, style: `dashed` }),
        },
        flows: [
          { route: [`ar`], bounce: true, rate: 2.5 },
        ],
      },
    },
  ],
};

export default awsStorageDbLesson;
