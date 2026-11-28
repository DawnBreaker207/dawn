import { DEAD_STATE, STAGE_MESSAGING, fromScreen, makeBlock, makeLink, makePanel, makeQueue, cardAt, type Tag, type SceneOpts } from '@/lib/simulator/scene-builders';

// Seed → result. One broker and a producer grow into a cluster; every step adds at most two
// blocks, and nodes keep their meaning. Metadata first lives in ZooKeeper (which leaves in
// step 7), then in the brokers themselves as a KRaft quorum.
//
//   1  producer ── broker-1 (+ its log)          seed: a log, not a queue
//   2  + consumer c1                             reading removes nothing
//   3  + broker-0, broker-2                      3 partitions
//   4  (key → partition)                         keyed producers
//   5  + consumer c0, c2                         consumer group
//   6  + ZooKeeper, broker-2 = controller        external metadata
//   7  ZooKeeper leaves; voters                  KRaft quorum
//   8  broker-1 dies, broker-0 takes over        failover
//   9  broker-1 is back                          result
//
//                  producer
//   broker-0       broker-1         broker-2       zk   (screen grid: 190 px)
//   consumer c0    consumer c1      consumer c2 (each down-left of its broker)

const brokerPositions = STAGE_MESSAGING.brokers;
// Consumers sit down-left of their broker (not straight below) so the whole picture fits the world bounds.
const consumerPositions = STAGE_MESSAGING.consumers;
const producerPosition = STAGE_MESSAGING.producer;
const zkPosition = fromScreen(380, -30);
type BrokerId = keyof typeof brokerPositions;
type ConsumerId = keyof typeof consumerPositions;

const producer = (tags: Tag[] = []) =>
  makeBlock(producerPosition.x, producerPosition.y, { s: 4.4, h: 52, color: `blue`, glyph: `send`, label: [`Producer`], sub: `orders app`, tags });
const broker = (id: BrokerId, tags: Tag[] = [], o: SceneOpts = {}) =>
  makeBlock(brokerPositions[id].x, brokerPositions[id].y, { s: 4.6, h: 52, color: `slab`, glyph: `server`, label: [`broker-${id[1]}`], sub: `partition ${id[1]}`, tags, ...o });
/** Partition log hanging in front of its broker; it grows downward on screen. */
const log = (id: BrokerId, n: number) => makeQueue(brokerPositions[id].x + 2.6, brokerPositions[id].y - 2.6, n, [0.62, -0.62]);
const consumer = (id: ConsumerId, o: SceneOpts = {}) =>
  makeBlock(consumerPositions[id].x, consumerPositions[id].y, { s: 4.4, h: 52, color: `green`, glyph: `inbox`, label: [`consumer`], sub: `group: billing`, ...o });
const zookeeper = (tags: Tag[] = []) =>
  makeBlock(zkPosition.x, zkPosition.y, { s: 4.4, h: 52, color: `yellow`, glyph: `layers`, label: [`ZooKeeper`], sub: `3-node ensemble`, tags });

const send = (id: BrokerId, o: SceneOpts = {}) => makeLink(`producer`, id, [`producer`, id], o);
const read = (b: BrokerId, c: ConsumerId) => makeLink(b, c, [b, c]);

const links = {
  p0: send(`b0`),
  p1: send(`b1`),
  p2: send(`b2`),
  r0: read(`b0`, `c0`),
  r1: read(`b1`, `c1`),
  r2: read(`b2`, `c2`),
  // single consumer reading every partition (before the group scales out)
  r0x: makeLink(`b0`, `c1`, [`b0`, `c1`]),
  r2x: makeLink(`b2`, `c1`, [`b2`, `c1`]),
  zkCtl: makeLink(`b2`, `zk`, [`b2`, `zk`], { heads: `both` }),
  // KRaft: brokers fetch the metadata log from the active controller (broker-1)
  meta0: makeLink(`b0`, `b1`, [`b0`, `b1`], { heads: `both`, style: `dashed` }),
  meta2: makeLink(`b2`, `b1`, [`b2`, `b1`], { heads: `both`, style: `dashed` }),
};

const card = cardAt({ x: brokerPositions.b0.x, y: brokerPositions.b0.y, dx: -250, dy: -170 });

const brokers = (ids: BrokerId[], tags: Partial<Record<BrokerId, Tag[]>> = {}, o: Partial<Record<BrokerId, SceneOpts>> = {}) =>
  Object.fromEntries(ids.map((id) => [id, broker(id, tags[id], o[id])]));
const logs = (n: Partial<Record<BrokerId, number>>) =>
  Object.fromEntries((Object.keys(n) as BrokerId[]).map((id) => [`l${id[1]}`, log(id, n[id] as number)]));
const group = () => ({ c0: consumer(`c0`), c1: consumer(`c1`), c2: consumer(`c2`) });
const produceAll = (rate = 1.4) => ({ routes: [{ path: [`p0`] }, { path: [`p1`] }, { path: [`p2`] }], kind: `msg`, rate });
const readAll = (rate = 1.2) => ({ routes: [{ path: [`r0`] }, { path: [`r1`] }, { path: [`r2`] }], kind: `msg`, rate });
const ALL: BrokerId[] = [`b0`, `b1`, `b2`];

export const kafkaClusterKraftLesson = {
  id: `kafka-cluster-kraft`,
  title: `Apache Kafka Architecture: Partitions & KRaft Consensus`,
  summary: `Start with one broker and grow it into a Kafka cluster: partition logs, keyed producers, consumer groups — and the move from ZooKeeper to the KRaft metadata quorum.`,
  minutes: 14,
  level: `intermediate`,
  metrics: [`partitions`, `throughput`, `consumers`, `failover`],
  legend: [`req`, [`msg`, `record`], [`ping`, `metadata`], `fail`],
  goals: [
    { text: `A topic is a distributed, partitioned log`, step: 3 },
    { text: `How producers pick a partition`, step: 4 },
    { text: `Consumer groups split the partitions`, step: 5 },
    { text: `Why ZooKeeper became a bottleneck`, step: 6 },
    { text: `The KRaft metadata quorum`, step: 7 },
    { text: `Fast controller failover`, step: 8 },
  ],
  steps: [
    {
      short: `A log`,
      chapter: `setup`,
      title: `Seed: Kafka is a log, not a queue`,
      body: [
        `A producer appends <b>records</b> to a topic. A broker stores them in order in an append-only <span class="term">log</span> and gives each one an <b>offset</b>: 0, 1, 2…`,
        `We start with a single broker and one partition, and grow the cluster one piece per step.`,
      ],
      metrics: { partitions: 1, throughput: 50000, consumers: 0, failover: null },
      scene: {
        entities: { producer: producer(), ...brokers([`b1`]), ...logs({ b1: 6 }) },
        links: { p1: links.p1 },
        flows: [{ route: [`p1`], kind: `msg`, rate: 1.4 }],
      },
    },
    {
      short: `Consumer`,
      chapter: `technique`,
      title: `Reading removes nothing`,
      body: [
        `A <b>consumer</b> reads the log and just remembers the offset it reached. Nothing is deleted when a record is read, so many consumers can read the same records — or re-read last week’s.`,
        `This is the opposite of a queue, where a message is gone once somebody takes it.`,
      ],
      changes: [`+ consumer (offset 5)`],
      metrics: { partitions: 1, throughput: 50000, consumers: 1, failover: null },
      scene: {
        entities: {
          producer: producer(),
          ...brokers([`b1`]),
          ...logs({ b1: 6 }),
          c1: consumer(`c1`, { tags: [{ text: `at offset 5`, icon: `bookmark` }] }),
        },
        links: { p1: links.p1, r1: links.r1 },
        flows: [{ route: [`p1`], kind: `msg`, rate: 1.4 }, { route: [`r1`], kind: `msg`, rate: 1.2 }],
      },
    },
    {
      short: `Partitions`,
      chapter: `technique`,
      title: `Partitions spread one topic over many brokers`,
      body: [
        `One log on one machine has a ceiling. So a topic is split into <span class="term">partitions</span> — here 3 — and each partition lives on a different broker. Writes to different partitions happen in parallel.`,
        `Order is guaranteed <b>within</b> a partition, not across them. Offsets are per partition: partition 0 and partition 2 both have an offset 5.`,
      ],
      changes: [`+ broker-0, broker-2`, `~ orders: 1 → 3 partitions`],
      metrics: { partitions: 3, throughput: 150000, consumers: 1, failover: null },
      scene: {
        entities: {
          producer: producer(),
          ...brokers(ALL),
          ...logs({ b0: 5, b1: 6, b2: 4 }),
          c1: consumer(`c1`, { tags: [{ text: `reads all 3`, tone: `amber`, icon: `hourglass` }] }),
        },
        links: { p0: links.p0, p1: links.p1, p2: links.p2, r1: links.r1, r0x: links.r0x, r2x: links.r2x },
        flows: [produceAll(), { routes: [{ path: [`r0x`] }, { path: [`r1`] }, { path: [`r2x`] }], kind: `msg`, rate: 1 }],
      },
    },
    {
      short: `Keys`,
      chapter: `technique`,
      title: `The key decides the partition`,
      body: [
        `A record with a key goes to <code>hash(key) % partitions</code>, so every event for <code>user-42</code> lands in the same partition and stays in order.`,
        `Records without a key use the <span class="term">sticky partitioner</span>: fill one batch for one partition, then switch. Bigger batches mean fewer requests and better compression.`,
      ],
      changes: [`~ key user-42 → always partition 1`],
      metrics: { partitions: 3, throughput: 180000, consumers: 1, failover: null },
      scene: {
        entities: {
          producer: producer([{ text: `key user-42 → p1`, tone: `violet`, icon: `key` }]),
          ...brokers(ALL, { b1: [{ text: `user-42 in order`, tone: `green` }] }),
          ...logs({ b0: 5, b1: 7, b2: 4 }),
          c1: consumer(`c1`),
          card: card(`producer`, [`producer.send(new ProducerRecord<>(`, `    "orders", "user-42", orderJson));`, `# murmur2("user-42") % 3 = 1 → partition 1`, `props.put("linger.ms", "10");  // fill batches`], `code`),
        },
        links: { p0: links.p0, p1: links.p1, p2: links.p2, r1: links.r1, r0x: links.r0x, r2x: links.r2x },
        flows: [{ route: [`p1`], kind: `msg`, rate: 2.2 }, { routes: [{ path: [`p0`] }, { path: [`p2`] }], kind: `msg`, rate: 0.8 }],
      },
    },
    {
      short: `Group`,
      chapter: `solution`,
      title: `A consumer group splits the partitions`,
      body: [
        `One consumer can’t keep up with three partitions. Start more with the same <code>group.id</code> and Kafka assigns each partition to exactly <b>one</b> member — here one each.`,
        `That is the scaling limit too: a 4th consumer in this group would sit idle, because there are only 3 partitions. Choose the partition count with future consumers in mind.`,
      ],
      changes: [`+ consumer c0, c2 in group billing`, `~ 1 partition per consumer`],
      metrics: { partitions: 3, throughput: 180000, consumers: 3, failover: null },
      scene: {
        entities: { producer: producer(), ...brokers(ALL), ...logs({ b0: 4, b1: 5, b2: 4 }), ...group() },
        links: { p0: links.p0, p1: links.p1, p2: links.p2, r0: links.r0, r1: links.r1, r2: links.r2 },
        flows: [produceAll(), readAll(1.6)],
      },
    },
    {
      short: `ZooKeeper`,
      chapter: `problem`,
      title: `Cluster metadata used to live outside Kafka`,
      body: [
        `Who leads each partition, which brokers are alive, topic configs — that <b>metadata</b> lived in a separate <span class="term">ZooKeeper</span> ensemble. One broker was elected controller and pushed changes to the others.`,
        `Two systems to run and secure, and a slow path: after a controller crash, the new one had to load all metadata from ZooKeeper first. With hundreds of thousands of partitions that took minutes.`,
      ],
      changes: [`+ ZooKeeper (external)`, `~ broker-2 = controller`],
      metrics: { partitions: 3, throughput: 180000, consumers: 3, failover: `~2 min` },
      scene: {
        entities: {
          producer: producer(),
          ...brokers(ALL, { b2: [{ text: `controller`, tone: `amber`, icon: `flag` }] }),
          ...logs({ b0: 4, b1: 5, b2: 4 }),
          ...group(),
          zk: zookeeper([{ text: `200k partitions max`, tone: `red` }]),
        },
        links: { p0: links.p0, p1: links.p1, p2: links.p2, r0: links.r0, r1: links.r1, r2: links.r2, zkCtl: links.zkCtl },
        flows: [produceAll(1), readAll(1.2), { route: [`zkCtl`], kind: `ping`, rate: 1.2, bounce: true }],
      },
    },
    {
      short: `KRaft`,
      chapter: `solution`,
      title: `KRaft: Kafka stores its own metadata`,
      body: [
        `Since Kafka 3.3 (and only option in 4.0), metadata is itself a Kafka log, <code>__cluster_metadata</code>, replicated with <span class="term">Raft</span> among controller nodes. ZooKeeper is gone.`,
        `One controller is active; the others are voters holding a full, up-to-date copy. Brokers simply fetch new metadata records like any follower. Here the three brokers also run as controllers (combined mode); large clusters use dedicated controller nodes.`,
      ],
      changes: [`− ZooKeeper`, `+ KRaft quorum: 3 voters`, `~ broker-1 = active controller`],
      metrics: { partitions: 3, throughput: 180000, consumers: 3, failover: `< 1 s` },
      scene: {
        entities: {
          producer: producer(),
          ...brokers(ALL, {
            b0: [{ text: `voter`, tone: `violet` }],
            b1: [{ text: `active controller`, tone: `violet`, icon: `flag` }],
            b2: [{ text: `voter`, tone: `violet` }],
          }),
          ...logs({ b0: 4, b1: 5, b2: 4 }),
          ...group(),
          card: card(`server.properties`, [`process.roles=broker,controller`, `controller.quorum.voters=`, `  0@b0:9093,1@b1:9093,2@b2:9093`, `$ kafka-metadata-quorum.sh describe --status`, `= LeaderId: 1  CurrentVoters: [0,1,2]`], `settings`),
        },
        links: { p0: links.p0, p1: links.p1, p2: links.p2, r0: links.r0, r1: links.r1, r2: links.r2, meta0: links.meta0, meta2: links.meta2 },
        flows: [produceAll(1), readAll(1.2), { routes: [{ path: [`meta0`] }, { path: [`meta2`] }], kind: `ping`, rate: 1 }],
      },
    },
    {
      short: `Failover`,
      chapter: `technique`,
      title: `The controller dies — a voter takes over`,
      body: [
        `broker-1 crashes. The remaining voters notice missed heartbeats, hold a Raft election and broker-0 becomes the active controller — it already has the whole metadata log, so there is nothing to reload.`,
        `It then moves leadership of partition 1 to a surviving replica (covered in the replication lesson). Takeover is well under a second instead of minutes.`,
      ],
      changes: [`− broker-1 down`, `~ broker-0 = active controller`],
      metrics: { partitions: 3, throughput: 120000, consumers: 3, failover: `180 ms` },
      scene: {
        entities: {
          producer: producer(),
          ...brokers(ALL, { b0: [{ text: `active controller`, tone: `violet`, icon: `flag` }], b2: [{ text: `voter`, tone: `violet` }] }, { b1: DEAD_STATE }),
          ...logs({ b0: 5, b1: 5, b2: 5 }),
          ...group(),
        },
        links: { p0: links.p0, p1: { ...links.p1, fail: 1 }, p2: links.p2, r0: links.r0, r1: { ...links.r1, style: `off` }, r2: links.r2 },
        flows: [{ routes: [{ path: [`p0`] }, { path: [`p2`] }], kind: `msg`, rate: 1.2 }, { routes: [{ path: [`r0`] }, { path: [`r2`] }], kind: `msg`, rate: 1.2 }],
      },
    },
    {
      short: `Recap`,
      chapter: `recap`,
      title: `Result: one system, many logs`,
      body: [
        `broker-1 rejoins as a voter and catches up from the metadata log. A topic is a set of partition logs spread over brokers; keys pick the partition and keep per-key order; consumer groups divide partitions among members.`,
        `Even the cluster’s own metadata is a replicated log now. KRaft removes ZooKeeper, scales to millions of partitions and fails over in milliseconds.`,
      ],
      metrics: { partitions: 3, throughput: 180000, consumers: 3, failover: `< 1 s` },
      scene: {
        entities: {
          producer: producer(),
          ...brokers(ALL, {
            b0: [{ text: `active controller`, tone: `violet`, icon: `flag` }],
            b1: [{ text: `voter · caught up`, tone: `green` }],
            b2: [{ text: `voter`, tone: `violet` }],
          }),
          ...logs({ b0: 5, b1: 6, b2: 5 }),
          ...group(),
        },
        links: { p0: links.p0, p1: links.p1, p2: links.p2, r0: links.r0, r1: links.r1, r2: links.r2, meta0: links.meta0 },
        flows: [produceAll(), readAll(1.4), { route: [`meta0`], kind: `ping`, rate: 0.6 }],
      },
    },
  ],
};
