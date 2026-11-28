import { STAGE, codeCard, linkOf, makeDb, stageBlock, distinctConcepts, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage: an app on the left, the storage/database service in the middle (same id, new
// label each act), the data tier on the right, a helper above and an alternative beside.
//
//                helper             alt
//   app ──── service ─────────── data

const app = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph: `server`, label: [`app`], sub, tags });
const service = (label: string[], sub: string, tags: Tag[] = [], glyph = `database`) =>
  stageBlock(STAGE.main, { color: `green`, glyph, label, sub, tags });
const data = (label: string, tags: Tag[] = []) =>
  makeDb(STAGE.store.x, STAGE.store.y, { r: 2.2, h: 46, glyph: `database`, label, tags });
const helper = (label: string[], sub: string, glyph: string, tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph, label, sub, tags });
const alt = (label: string[], sub: string, tags: Tag[] = [], glyph = `route`) =>
  stageBlock(STAGE.alt, { color: `slab`, glyph, label, sub, tags });

const links = {
  use: (label?: string) => linkOf(`app`, `service`, label),
  keep: (label?: string) => linkOf(`service`, `data`, label),
  help: (label?: string) => ({ ...linkOf(`helper`, `service`, label, false), labelAt: 0.6 }),
};

export const awsStorageDbLesson: Lesson = distinctConcepts({
  id: 'aws-storage-db',
  title: 'AWS Storage & Database Architecture',
  summary:
    'Matching data to the right AWS store: S3 storage classes and lifecycle, EBS versus EFS, Aurora’s shared storage, DynamoDB at single-digit milliseconds, ElastiCache in front, and S3 versioning with Object Lock.',
  minutes: 15,
  level: 'intermediate',
  metrics: ['access', 'latency', 'durability', 'cost'],
  legend: [[`req`, `read / write`], [`write`, `replicate / tier`], [`fail`, `failure`]],
  goals: [
    { text: 'Pick S3 storage classes and lifecycle rules', step: 1 },
    { text: 'Choose EBS block storage or shared EFS', step: 2 },
    { text: 'Explain Aurora’s shared-storage Multi-AZ design', step: 3 },
    { text: 'Design DynamoDB tables around the partition key', step: 4 },
    { text: 'Cache hot reads with ElastiCache', step: 5 },
    { text: 'Protect data with S3 Versioning and Object Lock', step: 6 },
  ],
  steps: [
    {
      short: 'S3 classes',
      chapter: 'setup',
      title: 'S3: pay less as data gets colder',
      body: [
        `S3 stores objects with 11 nines of durability across at least three AZs. You pay for the <b>class</b>: <b>Standard</b> for hot data, <b>Intelligent-Tiering</b> to let AWS move objects by access pattern, <b>Standard-IA / One Zone-IA</b> for rarely read data, and <b>Glacier</b> tiers (Instant, Flexible, Deep Archive) for archives.`,
        `A <span class="term">lifecycle rule</span> moves or expires objects automatically — e.g. Standard → IA at 30 days → Glacier at 90 → delete at 7 years. Colder classes cost less to store but more (or slower) to retrieve.`,
      ],
      metrics: { access: 'by key', latency: 'ms → hours', durability: '11 nines', cost: '$0.02 → $0.001' },
      scene: {
        entities: {
          app: app(`uploads logs`, [{ text: `PutObject`, tone: `gray` }]),
          service: service([`Amazon S3`], `Standard`, [{ text: `hot · $0.023/GB`, tone: `amber` }], `box`),
          data: data(`Glacier Deep`, [{ text: `$0.00099 / GB`, tone: `green` }]),
          helper: helper([`Lifecycle`, `rule`], `30 d → IA · 90 d → Glacier`, `clock`, [{ text: `automatic`, tone: `violet` }]),
          alt: alt([`Standard-IA`], `rarely read`, [{ text: `$0.0125 / GB`, tone: `violet` }]),
          card: codeCard(`Lifecycle policy`, [`{ "ID": "age-out", "Status": "Enabled", "Filter": { "Prefix": "logs/" },`, `  "Transitions": [{ "Days": 30, "StorageClass": "STANDARD_IA" },`, `                  { "Days": 90, "StorageClass": "DEEP_ARCHIVE" }],`, `  "Expiration": { "Days": 2555 } }`]),
        },
        links: { use: links.use(`upload`), keep: links.keep(`tiers`), help: links.help(`moves`) },
        flows: [{ route: ['use'], kind: 'write', rate: 1.4, bounce: true }, { route: ['keep'], kind: 'write', rate: 0.8 }],
      },
    },
    {
      short: 'EBS · EFS',
      chapter: 'technique',
      title: 'Block disk for one instance; file system for many',
      body: [
        `<span class="term">EBS</span> is a network-attached <b>block</b> volume for a single EC2 instance (one AZ): low latency, snapshots to S3, ideal for boot disks and databases. Pick <code>gp3</code> by default and <code>io2</code> for high IOPS.`,
        `<span class="term">EFS</span> is a shared <b>NFS</b> file system: thousands of instances across AZs mount the same directory, and it grows automatically. It costs more per GB and has higher latency — right for shared content, wrong for a database’s data files.`,
      ],
      changes: [`~ service: EBS`, `+ EFS alt`, `+ snapshot`],
      metrics: { access: 'block / NFS', latency: '1 / 2 ms', durability: '5 / 11 nines', cost: '$0.08 / $0.30' },
      scene: {
        entities: {
          app: app(`EC2 instance`, [{ text: `AZ-a`, tone: `gray` }]),
          service: service([`EBS`], `gp3 · 1 AZ`, [{ text: `1 instance`, tone: `violet` }], `database`),
          data: data(`S3 snapshots`, [{ text: `incremental`, tone: `green` }]),
          helper: helper([`Snapshot`], `to S3`, `copy`, [{ text: `daily`, tone: `gray` }]),
          alt: alt([`EFS`], `NFS · multi-AZ`, [{ text: `1,000s of clients`, tone: `green` }], `network`),
          card: codeCard(`Which one?`, [`$ aws ec2 attach-volume --volume-id vol-0a1 --instance-id i-0b2 --device /dev/sdf`, `$ mount -t efs fs-0a1:/ /mnt/shared    # many instances, any AZ`, `= EBS: one instance, one AZ  ·  EFS: shared across AZs`]),
        },
        links: { use: links.use(`block I/O`), keep: links.keep(`snapshots`), help: links.help(`schedules`) },
        flows: [{ route: ['use'], rate: 1.6, bounce: true }, { route: ['keep'], kind: 'write', rate: 0.7 }],
      },
    },
    {
      short: 'Aurora',
      chapter: 'technique',
      title: 'Aurora: compute here, storage shared across AZs',
      body: [
        `Aurora separates compute from storage. The cluster volume is a distributed log-structured store that keeps <b>6 copies across 3 AZs</b>, self-heals in 10 GB segments, and tolerates losing a whole AZ for writes and reads.`,
        `One writer and up to 15 <b>read replicas</b> all attach to the same volume, so replicas lag by only milliseconds and a failover promotes a replica in about 30 seconds. Use the cluster endpoint for writes and the reader endpoint to spread reads.`,
      ],
      changes: [`~ service: Aurora writer`, `+ read replica`, `~ data: cluster volume`],
      metrics: { access: 'SQL', latency: '~ms', durability: '6 copies · 3 AZ', cost: 'instances + I/O' },
      scene: {
        entities: {
          app: app(`two endpoints`, [{ text: `writes + reads`, tone: `gray` }]),
          service: service([`Aurora`, `writer`], `PostgreSQL`, [{ text: `AZ-a`, tone: `violet` }]),
          data: data(`cluster volume`, [{ text: `6 copies · 3 AZ`, tone: `green`, icon: `shield` }]),
          helper: helper([`Reader`, `endpoint`], `load balances`, `balancer`, [{ text: `up to 15`, tone: `violet` }]),
          alt: alt([`Replica`], `AZ-b · lag ~10 ms`, [{ text: `promotes in ~30 s`, tone: `green`, icon: `zap` }], `database`),
          card: codeCard(`Failover without data loss`, [`$ aws rds failover-db-cluster --db-cluster-identifier shop`, `writer AZ-a ✗  →  replica AZ-b promoted  (same volume, nothing to copy)`, `= endpoints keep their DNS names`]),
        },
        links: { use: links.use(`writes`), keep: links.keep(`6 copies`), help: links.help(`reads`) },
        flows: [{ route: ['use'], rate: 1.4, bounce: true }, { route: ['keep'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'DynamoDB',
      chapter: 'technique',
      title: 'DynamoDB: design around the partition key',
      body: [
        `<span class="term">DynamoDB</span> is a serverless key-value and document store with single-digit-millisecond reads and writes at any scale. Items are placed by a hash of the <b>partition key</b>, so every access should name it; the sort key orders items inside a partition.`,
        `Model for the queries you run (denormalise, use secondary indexes), pick a key with <em>high cardinality</em> so no partition runs hot, and choose <b>on-demand</b> (pay per request) or <b>provisioned</b> (cheaper at steady load). DAX adds a microsecond cache.`,
      ],
      changes: [`~ service: DynamoDB`, `~ data: partitions`],
      metrics: { access: 'by key', latency: '< 10 ms', durability: '3 AZ replicas', cost: 'per request / RCU' },
      scene: {
        entities: {
          app: app(`GetItem(customerId)`, [{ text: `by key`, tone: `green` }]),
          service: service([`DynamoDB`], `on-demand`, [{ text: `hash(partition key)`, tone: `violet`, icon: `hash` }], `hash`),
          data: data(`partitions`, [{ text: `cust# → partition 7`, tone: `green` }]),
          helper: helper([`DAX`], `in-memory cache`, `zap`, [{ text: `µs reads`, tone: `green` }]),
          alt: alt([`hot key`], `1 customer = 90%`, [{ text: `throttled`, tone: `red`, icon: `alert` }], `alert`),
          card: codeCard(`Access by key`, [`$ aws dynamodb get-item --table-name Orders \\`, `      --key '{"customerId":{"S":"c-1042"},"orderId":{"S":"2026-0007"}}'`, `! a Scan reads every partition — avoid it on big tables`]),
        },
        links: { use: links.use(`GetItem`), keep: links.keep(`partition`), help: links.help(`caches`) },
        flows: [{ route: ['use', 'keep'], rate: 1.8, bounce: true }],
      },
    },
    {
      short: 'ElastiCache',
      chapter: 'solution',
      title: 'ElastiCache: keep hot reads in memory',
      body: [
        `Even a fast database is slower than RAM. <span class="term">ElastiCache</span> (Redis or Memcached) sits beside the database: the app checks the cache first and only on a <em>miss</em> reads the database, then stores the result with a TTL — the cache-aside pattern.`,
        `Redis adds replication, persistence and rich data structures (sorted sets, streams); Memcached is a simpler multi-threaded cache. Watch the hit rate: at 90% the database sees a tenth of the reads.`,
      ],
      changes: [`~ service: ElastiCache`, `+ cache-aside`, `~ database load −90%`],
      metrics: { access: 'by key', latency: '< 1 ms', durability: 'replicated (Redis)', cost: '$ per node-hour' },
      scene: {
        entities: {
          app: app(`read-heavy`, [{ text: `95% reads`, tone: `gray` }]),
          service: service([`Elasti`, `Cache`], `Redis cluster`, [{ text: `hit rate 92%`, tone: `green`, icon: `gauge` }], `zap`),
          data: data(`Aurora`, [{ text: `load −90%`, tone: `green` }]),
          helper: helper([`TTL`], `300 s`, `clock`, [{ text: `expires stale`, tone: `violet` }]),
          alt: alt([`Memcached`], `simple cache`, [{ text: `no persistence`, tone: `gray` }]),
          card: codeCard(`Cache-aside`, [`v = redis.get(key)`, `if v is None:                  # miss`, `    v = db.query(...); redis.setex(key, 300, v)`, `return v`]),
        },
        links: { use: links.use(`GET`), keep: links.keep(`on miss`), help: links.help(`expires`) },
        flows: [{ route: ['use'], rate: 2, bounce: true }, { route: ['keep'], kind: 'write', rate: 0.5 }],
      },
    },
    {
      short: 'Object Lock',
      chapter: 'recap',
      title: 'Versioning and Object Lock: never lose or alter it',
      body: [
        `<span class="term">Versioning</span> keeps every version of an object: an overwrite adds one, a delete adds a delete marker you can undo. It protects against accidents and is required for replication and Object Lock.`,
        `<span class="term">Object Lock</span> makes versions <b>write-once-read-many</b>. In <i>governance</i> mode special permissions can lift it; in <i>compliance</i> mode nobody — not even root — can delete or shorten the retention. Use it for audit logs and regulated records.`,
      ],
      changes: [`+ versioning`, `+ Object Lock (compliance)`, `~ data: immutable versions`],
      metrics: { access: 'by key + version', latency: 'ms', durability: '11 nines', cost: 'per stored version' },
      scene: {
        entities: {
          app: app(`overwrites + deletes`, [{ text: `ransomware?`, tone: `red`, icon: `alert` }]),
          service: service([`S3 bucket`], `versioning on`, [{ text: `Object Lock`, tone: `violet`, icon: `lock` }], `box`),
          data: data(`3 versions`, [{ text: `locked 7 years`, tone: `green` }]),
          helper: helper([`MFA`, `Delete`], `extra confirm`, `key`, [{ text: `root only`, tone: `gray` }]),
          alt: alt([`delete`, `marker`], `undo-able`, [{ text: `object recoverable`, tone: `green` }]),
          card: codeCard(`WORM retention`, [`$ aws s3api put-object-retention --bucket audit --key log-2026.json \\`, `      --retention '{"Mode":"COMPLIANCE","RetainUntilDate":"2033-12-31T00:00:00Z"}'`, `! DeleteObjectVersion → AccessDenied until 2033`]),
        },
        links: { use: links.use(`DELETE`), keep: links.keep(`versions`), help: links.help(`requires`) },
        flows: [{ route: ['use'], kind: 'fail', rate: 1, bounce: true }],
      },
    },
  ],
});
