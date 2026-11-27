import { DEAD_STATE, makeBlock, makeLink, makePanel, makeQueue } from '@/lib/simulator/scene-builders';

// One cluster for the whole lesson: a producer on top, three brokers in a row,
// each holding one partition of `orders` (the amber log hanging below it), and a
// consumer under each log. Metadata first lives in ZooKeeper (right), then moves
// into the brokers themselves as a KRaft quorum.
//
//                 producer
//        broker-0  broker-1  broker-2      ZooKeeper
//         log p0    log p1    log p2
//       consumer  consumer  consumer

type Tag = { text: string; tone?: string; icon?: string };
type Opts = Record<string, unknown>;

const B = { b0: [-9.3, -5], b1: [-3.1, 1.1], b2: [3, 7.3] } as const;
const C = { c0: [2.1, -16.4], c1: [8.3, -10.3], c2: [14.4, -4.1] } as const;
type BrokerId = keyof typeof B;
type ConsumerId = keyof typeof C;

const producer = (tags: Tag[] = []) =>
  makeBlock(-15.3, 13.3, { s: 4.4, h: 48, color: `blue`, glyph: `send`, label: [`Producer`], sub: `orders app`, tags });
const broker = (id: BrokerId, tags: Tag[] = [], o: Opts = {}) =>
  makeBlock(B[id][0], B[id][1], { s: 4.6, h: 52, color: `slab`, glyph: `server`, label: [`broker-${id[1]}`], sub: `partition ${id[1]}`, tags, ...o });
/** Partition log hanging in front of its broker; it grows downward on screen. */
const log = (id: BrokerId, n: number) => makeQueue(B[id][0] + 2.6, B[id][1] - 2.6, n, [0.62, -0.62]);
const consumer = (id: ConsumerId, o: Opts = {}) =>
  makeBlock(C[id][0], C[id][1], { s: 4.2, h: 46, color: `green`, glyph: `inbox`, label: [`consumer`], sub: `group: billing`, ...o });
const zk = (tags: Tag[] = []) =>
  makeBlock(-4.3, 20, { s: 4.4, h: 50, color: `yellow`, glyph: `layers`, label: [`ZooKeeper`], sub: `3-node ensemble`, tags });

const send = (id: BrokerId, o: Opts = {}) => makeLink(`producer`, id, [`producer`, id], o);
const read = (b: BrokerId, c: ConsumerId) => makeLink(b, c, [b, c]);

const L = {
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

const card = (title: string, lines: string[], icon: string) =>
  makePanel({ x: -9.3, y: -5, z: 0, dx: -250, dy: -170 }, title, lines, { icon });

const allBrokers = (tags: Partial<Record<BrokerId, Tag[]>> = {}, o: Partial<Record<BrokerId, Opts>> = {}) => ({
  b0: broker(`b0`, tags.b0, o.b0),
  b1: broker(`b1`, tags.b1, o.b1),
  b2: broker(`b2`, tags.b2, o.b2),
});
const logs = (n0: number, n1: number, n2: number) => ({ l0: log(`b0`, n0), l1: log(`b1`, n1), l2: log(`b2`, n2) });
const group = () => ({ c0: consumer(`c0`), c1: consumer(`c1`), c2: consumer(`c2`) });
const produceAll = (rate = 1.4) => ({ routes: [{ path: [`p0`] }, { path: [`p1`] }, { path: [`p2`] }], kind: `msg`, rate });
const readAll = (rate = 1.2) => ({ routes: [{ path: [`r0`] }, { path: [`r1`] }, { path: [`r2`] }], kind: `msg`, rate });

export const kafkaClusterKraftLesson = {
  id: `kafka-cluster-kraft`,
  title: `Apache Kafka Architecture: Partitions & KRaft Consensus`,
  summary: `Inside a Kafka cluster: a topic split into partition logs across brokers, keyed producers, consumer groups — and the move from ZooKeeper to the KRaft metadata quorum.`,
  minutes: 14,
  level: `intermediate`,
  metrics: [`partitions`, `throughput`, `consumers`, `failover`],
  legend: [`req`, [`msg`, `record`], [`ping`, `metadata`], `fail`],
  goals: [
    { text: `A topic is a distributed, partitioned log`, step: 2 },
    { text: `How producers pick a partition`, step: 3 },
    { text: `Consumer groups split the partitions`, step: 4 },
    { text: `Why ZooKeeper became a bottleneck`, step: 5 },
    { text: `The KRaft metadata quorum`, step: 6 },
    { text: `Fast controller failover`, step: 7 },
  ],
  steps: [
    {
      short: `A log`,
      chapter: `setup`,
      title: `Kafka is a log, not a queue`,
      body: [
        `A producer appends <b>records</b> to a topic. A broker stores them in order in an append-only <span class="term">log</span> and gives each one an <b>offset</b>: 0, 1, 2…`,
        `Reading doesn’t remove anything. A consumer just remembers the offset it reached, so many consumers can read the same records — or re-read last week’s.`,
      ],
      metrics: { partitions: 1, throughput: 50000, consumers: 1, failover: null },
      scene: {
        entities: { producer: producer(), b1: broker(`b1`), l1: log(`b1`, 6), c1: consumer(`c1`, { tags: [{ text: `at offset 5`, icon: `bookmark` }] }) },
        links: { p1: L.p1, r1: L.r1 },
        flows: [
          { route: [`p1`], kind: `msg`, rate: 1.4 },
          { route: [`r1`], kind: `msg`, rate: 1.2 },
        ],
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
        entities: { producer: producer(), ...allBrokers(), ...logs(5, 6, 4), c1: consumer(`c1`, { tags: [{ text: `reads all 3`, tone: `amber`, icon: `hourglass` }] }) },
        links: { p0: L.p0, p1: L.p1, p2: L.p2, r1: L.r1, r0x: L.r0x, r2x: L.r2x },
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
          ...allBrokers({ b1: [{ text: `user-42 in order`, tone: `green` }] }),
          ...logs(5, 7, 4),
          c1: consumer(`c1`),
          card: card(`producer`, [`producer.send(new ProducerRecord<>(`, `    "orders", "user-42", orderJson));`, `# murmur2("user-42") % 3 = 1 → partition 1`, `props.put("linger.ms", "10");  // fill batches`], `code`),
        },
        links: { p0: L.p0, p1: L.p1, p2: L.p2, r1: L.r1, r0x: L.r0x, r2x: L.r2x },
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
      changes: [`+ 2 consumers in group billing`, `~ 1 partition per consumer`],
      metrics: { partitions: 3, throughput: 180000, consumers: 3, failover: null },
      scene: {
        entities: { producer: producer(), ...allBrokers(), ...logs(4, 5, 4), ...group() },
        links: { p0: L.p0, p1: L.p1, p2: L.p2, r0: L.r0, r1: L.r1, r2: L.r2 },
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
          ...allBrokers({ b2: [{ text: `controller`, tone: `amber`, icon: `flag` }] }),
          ...logs(4, 5, 4),
          ...group(),
          zk: zk([{ text: `200k partitions max`, tone: `red` }]),
        },
        links: { p0: L.p0, p1: L.p1, p2: L.p2, r0: L.r0, r1: L.r1, r2: L.r2, zkCtl: L.zkCtl },
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
          ...allBrokers({
            b0: [{ text: `voter`, tone: `violet` }],
            b1: [{ text: `active controller`, tone: `violet`, icon: `flag` }],
            b2: [{ text: `voter`, tone: `violet` }],
          }),
          ...logs(4, 5, 4),
          ...group(),
          card: card(`server.properties`, [`process.roles=broker,controller`, `controller.quorum.voters=`, `  0@b0:9093,1@b1:9093,2@b2:9093`, `$ kafka-metadata-quorum.sh describe --status`, `= LeaderId: 1  CurrentVoters: [0,1,2]`], `settings`),
        },
        links: { p0: L.p0, p1: L.p1, p2: L.p2, r0: L.r0, r1: L.r1, r2: L.r2, meta0: L.meta0, meta2: L.meta2 },
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
          ...allBrokers(
            { b0: [{ text: `active controller`, tone: `violet`, icon: `flag` }], b2: [{ text: `voter`, tone: `violet` }] },
            { b1: DEAD_STATE },
          ),
          ...logs(5, 5, 5),
          ...group(),
        },
        links: { p0: L.p0, p1: { ...L.p1, fail: 1 }, p2: L.p2, r0: L.r0, r1: { ...L.r1, style: `off` }, r2: L.r2 },
        flows: [{ routes: [{ path: [`p0`] }, { path: [`p2`] }], kind: `msg`, rate: 1.2 }, { routes: [{ path: [`r0`] }, { path: [`r2`] }], kind: `msg`, rate: 1.2 }],
      },
    },
    {
      short: `Recap`,
      chapter: `recap`,
      title: `One system, many logs`,
      body: [
        `A topic is a set of partition logs spread over brokers. Keys pick the partition and keep per-key order; consumer groups divide partitions among members.`,
        `Even the cluster’s own metadata is a replicated log now. KRaft removes ZooKeeper, scales to millions of partitions and fails over in milliseconds.`,
      ],
      metrics: { partitions: 3, throughput: 180000, consumers: 3, failover: `< 1 s` },
      scene: {
        entities: {
          producer: producer(),
          ...allBrokers({ b1: [{ text: `active controller`, tone: `violet`, icon: `flag` }] }),
          ...logs(5, 6, 5),
          ...group(),
        },
        links: { p0: L.p0, p1: L.p1, p2: L.p2, r0: L.r0, r1: L.r1, r2: L.r2, meta0: L.meta0, meta2: L.meta2 },
        flows: [produceAll(), readAll(1.4), { routes: [{ path: [`meta0`] }, { path: [`meta2`] }], kind: `ping`, rate: 0.6 }],
      },
    },
  ],
};
