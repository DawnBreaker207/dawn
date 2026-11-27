import { DEAD_STATE, makeBlock, makeHot, makeLink, makePanel, makeQueue } from '@/lib/simulator/scene-builders';

// One partition (orders-0), three replicas. broker-1 holds the leader copy; the
// followers on either side fetch from it. Each replica's log hangs below its
// broker, so you can see who is behind. The consumer under the leader may only
// read up to the high watermark.
//
//                 producer
//      broker-0 ←── broker-1 ──→ broker-2
//       replica     leader       replica
//                  consumer

type Tag = { text: string; tone?: string; icon?: string };
type Opts = Record<string, unknown>;

const B = { b0: [-9.3, -5], b1: [-3.1, 1.1], b2: [3, 7.3] } as const;
type BrokerId = keyof typeof B;

const producer = (tags: Tag[] = [], o: Opts = {}) =>
  makeBlock(-15.3, 13.3, { s: 4.4, h: 48, color: `blue`, glyph: `send`, label: [`Producer`], sub: `orders app`, tags, ...o });
const broker = (id: BrokerId, role: string, tags: Tag[] = [], o: Opts = {}) =>
  makeBlock(B[id][0], B[id][1], { s: 4.6, h: 52, color: `slab`, glyph: `server`, label: [`broker-${id[1]}`], sub: role, tags, ...o });
const log = (id: BrokerId, n: number) => makeQueue(B[id][0] + 2.6, B[id][1] - 2.6, n, [0.62, -0.62]);
const consumer = (tags: Tag[] = []) =>
  makeBlock(8.3, -10.3, { s: 4.2, h: 46, color: `green`, glyph: `inbox`, label: [`consumer`], sub: `billing`, tags });

const L = {
  produce: makeLink(`producer`, `b1`, [`producer`, `b1`]),
  read: makeLink(`b1`, `c1`, [`b1`, `c1`]),
  fetch0: makeLink(`b0`, `b1`, [`b0`, `b1`], { heads: `both` }),
  fetch2: makeLink(`b2`, `b1`, [`b2`, `b1`], { heads: `both` }),
};

const card = (title: string, lines: string[], icon: string) =>
  makePanel({ x: -9.3, y: -5, z: 0, dx: -240, dy: -175 }, title, lines, { icon });

const replicate = (rate = 1.2) => ({ routes: [{ path: [`fetch0`] }, { path: [`fetch2`] }], kind: `msg`, rate, bounce: true });

export const kafkaReplicationIsrLesson = {
  id: `kafka-replication-isr`,
  title: `Kafka Replication: ISR, High Watermark & acks=all`,
  summary: `Zero-data-loss Kafka: leader and follower replicas, the in-sync replica set, the high watermark, acks=all with min.insync.replicas, and unclean leader election.`,
  minutes: 14,
  level: `intermediate`,
  metrics: [`rf`, `acks`, `isr`, `hw`],
  legend: [`req`, `res`, [`msg`, `record / fetch`], `fail`],
  goals: [
    { text: `Leader and follower replicas`, step: 2 },
    { text: `In-sync replicas and the high watermark`, step: 3 },
    { text: `acks=0, acks=1 and acks=all`, step: 4 },
    { text: `How a slow follower leaves the ISR`, step: 5 },
    { text: `Why acks=all needs min.insync.replicas`, step: 6 },
    { text: `Clean vs unclean leader election`, step: 7 },
  ],
  steps: [
    {
      short: `One copy`,
      chapter: `problem`,
      title: `One broker, one copy`,
      body: [
        `Partition <code>orders-0</code> lives on broker-1 only. Producers write to it and consumers read from it.`,
        `If that disk dies, every record in the partition is gone. Brokers fail all the time — disks, kernels, whole racks — so one copy is not storage, it is a bet.`,
      ],
      metrics: { rf: 1, acks: `1`, isr: `1 / 1`, hw: 100 },
      scene: {
        entities: {
          producer: producer(),
          b1: broker(`b1`, `leader`, [{ text: `only copy`, tone: `amber`, icon: `alert` }]),
          l1: log(`b1`, 6),
          c1: consumer(),
        },
        links: { produce: L.produce, read: L.read },
        flows: [
          { route: [`produce`], kind: `msg`, rate: 1.4, bounce: true },
          { route: [`read`], kind: `msg`, rate: 1.2 },
        ],
      },
    },
    {
      short: `Followers`,
      chapter: `technique`,
      title: `Followers copy the leader`,
      body: [
        `With <code>replication.factor=3</code> the partition has three replicas on three brokers. One is the <span class="term">leader</span>: every produce and fetch goes to it.`,
        `The other two are <span class="term">followers</span>. They don’t receive writes from producers — they fetch from the leader, exactly like a consumer, and append the same records in the same order.`,
      ],
      changes: [`+ broker-0, broker-2 (followers)`, `~ replication.factor 1 → 3`],
      metrics: { rf: 3, acks: `1`, isr: `3 / 3`, hw: 104 },
      scene: {
        entities: {
          producer: producer(),
          b0: broker(`b0`, `follower`),
          b1: broker(`b1`, `leader`),
          b2: broker(`b2`, `follower`),
          l0: log(`b0`, 6),
          l1: log(`b1`, 6),
          l2: log(`b2`, 6),
          c1: consumer(),
        },
        links: { produce: L.produce, read: L.read, fetch0: L.fetch0, fetch2: L.fetch2 },
        flows: [{ route: [`produce`], kind: `msg`, rate: 1.4, bounce: true }, replicate(), { route: [`read`], kind: `msg`, rate: 1.2 }],
      },
    },
    {
      short: `HW`,
      chapter: `insight`,
      title: `Consumers only see what every in-sync copy has`,
      body: [
        `Replicas that are caught up form the <span class="term">ISR</span> (in-sync replicas). The leader tracks how far each one has fetched.`,
        `The <span class="term">high watermark</span> is the last offset present on <b>all</b> ISR members. Consumers can read only up to it — so they never see a record that could still vanish if the leader failed right now.`,
      ],
      changes: [`~ leader at 108, followers at 106 and 104`, `~ high watermark = 104`],
      metrics: { rf: 3, acks: `1`, isr: `3 / 3`, hw: 104 },
      scene: {
        entities: {
          producer: producer(),
          b0: broker(`b0`, `follower`, [{ text: `LEO 106`, tone: `gray` }]),
          b1: broker(`b1`, `leader`, [{ text: `LEO 108`, tone: `gray` }]),
          b2: broker(`b2`, `follower`, [{ text: `LEO 104`, tone: `gray` }]),
          l0: log(`b0`, 7),
          l1: log(`b1`, 8),
          l2: log(`b2`, 6),
          c1: consumer([{ text: `reads ≤ HW 104`, tone: `green`, icon: `eye` }]),
          card: card(`describe the topic`, [`$ kafka-topics.sh --describe --topic orders`, `Partition: 0  Leader: 1`, `= Replicas: 1,0,2   Isr: 1,0,2`], `search`),
        },
        links: { produce: L.produce, read: L.read, fetch0: L.fetch0, fetch2: L.fetch2 },
        flows: [{ route: [`produce`], kind: `msg`, rate: 1.4, bounce: true }, replicate(), { route: [`read`], kind: `msg`, rate: 1 }],
      },
    },
    {
      short: `acks`,
      chapter: `technique`,
      title: `acks decides when “sent” means sent`,
      body: [
        `<code>acks=0</code>: don’t wait at all. <code>acks=1</code>: wait for the leader’s write — lost if the leader dies before followers copy it. <code>acks=all</code>: wait until every ISR member has it.`,
        `With <code>acks=all</code> a record is acknowledged only once it is below the high watermark. That costs one replication round trip — a few milliseconds — and buys durability.`,
      ],
      changes: [`~ producer acks 1 → all`],
      metrics: { rf: 3, acks: `all`, isr: `3 / 3`, hw: 108 },
      scene: {
        entities: {
          producer: producer([{ text: `acks=all`, tone: `green`, icon: `check` }]),
          b0: broker(`b0`, `follower`),
          b1: broker(`b1`, `leader`),
          b2: broker(`b2`, `follower`),
          l0: log(`b0`, 8),
          l1: log(`b1`, 8),
          l2: log(`b2`, 8),
          c1: consumer(),
          card: card(`producer config`, [`props.put("acks", "all");`, `props.put("enable.idempotence", "true");`, `# ack = written by leader AND all of the ISR`], `code`),
        },
        links: { produce: L.produce, read: L.read, fetch0: L.fetch0, fetch2: L.fetch2 },
        flows: [{ route: [`produce`], kind: `msg`, rate: 1.2, bounce: true, speed: 0.6 }, replicate(1.4), { route: [`read`], kind: `msg`, rate: 1 }],
      },
    },
    {
      short: `Lagging`,
      chapter: `problem`,
      title: `A slow follower is dropped from the ISR`,
      body: [
        `broker-2 has a failing disk and falls behind. If it stayed in the ISR, every <code>acks=all</code> write would wait for it.`,
        `So a follower that hasn’t caught up for <code>replica.lag.time.max.ms</code> (30 s) is removed from the ISR. Writes continue with the two healthy copies; broker-2 rejoins once it catches up.`,
      ],
      changes: [`− broker-2 out of ISR`, `~ ISR {1,0,2} → {1,0}`],
      metrics: { rf: 3, acks: `all`, isr: `2 / 3`, hw: 112 },
      scene: {
        entities: {
          producer: producer([{ text: `acks=all`, tone: `green`, icon: `check` }]),
          b0: broker(`b0`, `follower`),
          b1: broker(`b1`, `leader`),
          b2: broker(`b2`, `follower`, [{ text: `lag 45 s · out of ISR`, tone: `red`, icon: `hourglass` }], makeHot(0.95)),
          l0: log(`b0`, 9),
          l1: log(`b1`, 9),
          l2: log(`b2`, 5),
          c1: consumer(),
          card: card(`broker config`, [`$ kafka-configs.sh --describe --entity-type brokers`, `replica.lag.time.max.ms=30000`, `= Isr: 1,0`], `hourglass`),
        },
        links: { produce: L.produce, read: L.read, fetch0: L.fetch0, fetch2: { ...L.fetch2, style: `dashed` } },
        flows: [{ route: [`produce`], kind: `msg`, rate: 1.4, bounce: true }, { route: [`fetch0`], kind: `msg`, rate: 1.4, bounce: true }, { route: [`fetch2`], kind: `slow`, rate: 0.3 }, { route: [`read`], kind: `msg`, rate: 1 }],
      },
    },
    {
      short: `min ISR`,
      chapter: `solution`,
      title: `acks=all alone can mean “acks=1”`,
      body: [
        `Now broker-0 dies too. The ISR shrinks to just the leader — and <code>acks=all</code> means “all of the ISR”, which is one copy. Durability silently became <code>acks=1</code>.`,
        `<code>min.insync.replicas=2</code> closes the gap: if fewer than 2 replicas are in sync, the leader rejects writes with <code>NotEnoughReplicas</code>. The producer retries instead of trusting a single disk.`,
      ],
      changes: [`− broker-0 down`, `~ ISR {1}: writes rejected`],
      metrics: { rf: 3, acks: `all`, isr: `1 / 3`, hw: 112 },
      scene: {
        entities: {
          producer: producer([{ text: `NotEnoughReplicas`, tone: `red`, icon: `alert` }]),
          b0: broker(`b0`, `follower`, [], DEAD_STATE),
          b1: broker(`b1`, `leader`, [{ text: `ISR 1 < min 2`, tone: `red`, icon: `shield` }]),
          b2: broker(`b2`, `follower`, [{ text: `out of ISR`, tone: `red` }]),
          l0: log(`b0`, 9),
          l1: log(`b1`, 9),
          l2: log(`b2`, 6),
          c1: consumer(),
          card: card(`topic config`, [`$ kafka-configs.sh --alter --topic orders \\`, `    --add-config min.insync.replicas=2`, `# RF=3, min ISR=2: survives 1 broker loss`], `shield`),
        },
        links: { produce: { ...L.produce, fail: 1 }, read: L.read, fetch0: { ...L.fetch0, style: `off` }, fetch2: { ...L.fetch2, style: `dashed` } },
        flows: [{ route: [`produce`], kind: `fail`, rate: 1 }, { route: [`fetch2`], kind: `slow`, rate: 0.4 }, { route: [`read`], kind: `msg`, rate: 0.8 }],
      },
    },
    {
      short: `Unclean`,
      chapter: `tradeoff`,
      title: `The leader dies: wait, or lose data?`,
      body: [
        `broker-1 fails. The only live replica is broker-2, which left the ISR and is missing offsets 105–112. Making it leader would bring the partition back — and silently drop 8 acknowledged records.`,
        `With <code>unclean.leader.election.enable=false</code> (the default) Kafka refuses and keeps the partition offline until an in-sync replica returns. Consistency over availability — usually the right call.`,
      ],
      changes: [`− broker-1 down`, `~ partition offline (no ISR member)`],
      metrics: { rf: 3, acks: `all`, isr: `0 / 3`, hw: 112 },
      scene: {
        entities: {
          producer: producer([{ text: `partition offline`, tone: `red`, icon: `alert` }]),
          b0: broker(`b0`, `follower`, [], DEAD_STATE),
          b1: broker(`b1`, `leader`, [], DEAD_STATE),
          b2: broker(`b2`, `follower`, [{ text: `behind · not in ISR`, tone: `amber`, icon: `ban` }]),
          l0: log(`b0`, 9),
          l1: log(`b1`, 9),
          l2: log(`b2`, 6),
          c1: consumer(),
          card: card(`broker config`, [`unclean.leader.election.enable=false`, `# true: elect broker-2 → offsets 105–112 lost`, `# false: wait for broker-0 or broker-1`], `scale`),
        },
        links: { produce: { ...L.produce, fail: 1 }, read: { ...L.read, style: `off` }, fetch0: { ...L.fetch0, style: `off` }, fetch2: { ...L.fetch2, style: `off` } },
        flows: [{ route: [`produce`], kind: `fail`, rate: 0.8 }],
      },
    },
    {
      short: `Recap`,
      chapter: `recap`,
      title: `The durability recipe`,
      body: [
        `Three replicas on different racks or zones, <code>acks=all</code>, <code>min.insync.replicas=2</code>, idempotent producers and no unclean election.`,
        `That combination survives any single broker loss without losing an acknowledged record, and refuses to pretend when it can’t.`,
      ],
      metrics: { rf: 3, acks: `all`, isr: `3 / 3`, hw: 120 },
      scene: {
        entities: {
          producer: producer([{ text: `acks=all`, tone: `green`, icon: `check` }]),
          b0: broker(`b0`, `follower`),
          b1: broker(`b1`, `leader`, [{ text: `min ISR 2`, tone: `green`, icon: `shield` }]),
          b2: broker(`b2`, `follower`),
          l0: log(`b0`, 8),
          l1: log(`b1`, 8),
          l2: log(`b2`, 8),
          c1: consumer(),
          card: card(`orders topic`, [`$ kafka-topics.sh --create --topic orders \\`, `    --replication-factor 3 --partitions 6 \\`, `    --config min.insync.replicas=2`], `check`),
        },
        links: { produce: L.produce, read: L.read, fetch0: L.fetch0, fetch2: L.fetch2 },
        flows: [{ route: [`produce`], kind: `msg`, rate: 1.4, bounce: true }, replicate(1.4), { route: [`read`], kind: `msg`, rate: 1.2 }],
      },
    },
  ],
};
