// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const kafkaReplicationIsrLesson = {
  id: 'kafka-replication-isr',
  title: 'Kafka Replication: ISR, High Watermark & acks=all',
  summary: 'Architect zero-data-loss durability: Leader-Follower replication, In-Sync Replicas (ISR), High Watermark commits, and min.insync.replicas.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['replication_factor', 'producer_acks', 'min_isr', 'high_watermark'],
  legend: ['req', 'res', ['ping', 'fetch replication'], 'fail'],
  goals: [
    { text: 'Leader-Follower partition replication mechanics', step: 1 },
    { text: 'In-Sync Replicas (ISR) and the', step: 2 },
    { text: 'Producer acks=0, acks=1 vs acks=all', step: 3 },
    { text: 'Why acks=all requires min.insync.replicas', step: 4 },
    { text: 'Clean vs unclean leader election', step: 6 },
  ],
  steps: [
    {
      short: 'Why Replicate?',
      chapter: 'setup',
      title: 'Broker Failures & The Replication Factor',
      body: [
        'Hardware fails constantly in cloud datacenters: bad disks, kernel panics, network splits.',
        'To prevent catastrophic data loss, Kafka replicates each partition across multiple brokers (typically <code>replication.factor = 3</code>). Exactly one broker acts as the <b>Partition Leader</b> (handling all client reads and writes), while other brokers act as <b>Followers</b> passively replicating the log.'
      ],
      callout: {
        kind: 'insight',
        text: 'A replication factor of 3 allows the cluster to survive 2 broker deaths without data loss.'
      },
      metrics: { replication_factor: '3 Replicas', producer_acks: 'acks=all', min_isr: '2', high_watermark: 'Offset 100' },
      scene: {
        entities: {
          producer: y(-10, -8, { form: 'phone', label: 'Producer', tags: [{ text: 'Write to Leader', icon: 'zap' }] }),
          leader: d(6, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Broker 1 (Leader)', 'Partition 0'], sub: 'Serves all Reads/Writes' }),
          follower: d(6, 6, { s: 4.6, h: 52, color: 'teal', glyph: 'database', label: ['Broker 2 (Follower)', 'Partition 0'], sub: 'Passive Replica' }),
          card: S({ x: -2, y: 14 }, 'Replication Terminology', [
            '- Leader: Serves all produce and consume requests',
            '- Follower: Sends continuous FetchRequests to replicate the log',
            '- Replication Factor: 3 (1 Leader + 2 Followers)',
            '- Goal: If Broker 1 bursts into flames, Broker 2 takes over instantly'
          ], { icon: 'layers' })
        },
        links: {
          pl: h('producer', 'leader', ['producer', 'leader'], { heads: 'both' }),
          lf: h('leader', 'follower', ['leader', 'follower'], { heads: 'both', label: 'FetchRequest' })
        },
        flows: [
          { route: ['pl'], bounce: true, rate: 2.2 },
          { route: ['lf'], bounce: true, rate: 2.2 }
        ]
      }
    },
    {
      short: 'ISR & High Watermark',
      chapter: 'technique',
      title: 'In-Sync Replicas (ISR) & High Watermark (HW)',
      body: [
        'Not all followers are equal. A follower that falls behind due to network issues is kicked out of the <b>In-Sync Replicas (ISR)</b> pool.',
        'The <b>High Watermark (HW)</b> is the highest offset that has been replicated to <b>ALL members of the ISR</b>. Consumers can <b>only read messages below the High Watermark</b>, ensuring uncommitted records are never exposed to clients!'
      ],
      callout: {
        kind: 'tip',
        text: 'The High Watermark guarantees that even if the leader crashes, consumers never experience phantom reads or rolled-back messages.'
      },
      metrics: { replication_factor: '3', producer_acks: 'acks=all', min_isr: '2 (Healthy)', high_watermark: 'HW = Offset 104' },
      scene: {
        entities: {
          leader: d(-8, -4, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Leader (Broker 1)', 'Log End Offset (LEO): 106'], sub: 'High Watermark (HW): 104' }),
          isr1: d(8, -8, { s: 4.4, h: 52, color: 'green', glyph: 'database', label: ['Follower 1 (In-Sync)', 'LEO: 104'], sub: 'ISR Member' }),
          isr2: d(8, 4, { s: 4.4, h: 52, color: 'green', glyph: 'database', label: ['Follower 2 (In-Sync)', 'LEO: 104'], sub: 'ISR Member' }),
          card: S({ x: -2, y: 16 }, 'LEO vs High Watermark (HW)', [
            '- Log End Offset (LEO): Next offset written to local disk (106)',
            '- High Watermark (HW): Offset replicated to ALL ISR replicas (104)',
            '- Offsets 105 & 106: In-flight replication (HIDDEN FROM CONSUMERS)',
            '- Only when Follower 1 & 2 ACK 106 does HW advance to 106'
          ], { icon: 'listOrdered' })
        },
        links: {
          l1: h('leader', 'isr1', ['leader', 'isr1'], { heads: 'both' }),
          l2: h('leader', 'isr2', ['leader', 'isr2'], { heads: 'both' })
        },
        flows: [
          { route: ['l1'], bounce: true, rate: 2.0 },
          { route: ['l2'], bounce: true, rate: 2.0 }
        ]
      }
    },
    {
      short: 'Producer Acks',
      chapter: 'technique',
      title: 'Producer acks=0, acks=1 vs acks=all (-1)',
      body: [
        'The producer controls its durability guarantee via the <code>acks</code> configuration parameter:',
        '• <code>acks=0:</code> "Fire and Forget" — producer never waits for a reply (zero latency, high risk of silent data loss).<br>• <code>acks=1:</code> Waits only for Leader to write locally (loses data if leader dies before replicating).<br>• <code>acks=all (-1):</code> Waits until the message is written to the Leader <b>AND all ISR replicas</b>.'
      ],
      callout: {
        kind: 'insight',
        text: 'For financial transactions, payments, or critical events, acks=all is non-negotiable.'
      },
      metrics: { replication_factor: '3', producer_acks: 'acks=all (Full Quorum)', min_isr: '2', high_watermark: 'Committed' },
      scene: {
        entities: {
          producer: y(-10, -8, { form: 'phone', label: 'Payment Producer', tags: [{ text: 'acks=all (-1)', tone: 'green', icon: 'lock' }] }),
          leader: d(0, 0, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Leader', 'Writes & Fans Out'], sub: 'Waits for ISR ACKs' }),
          follower: d(10, 8, { s: 4.6, h: 52, color: 'teal', glyph: 'database', label: ['ISR Replica', 'Acks to Leader'], sub: 'Persisted to disk' }),
          card: S({ x: -2, y: 14 }, 'Producer Acks Matrix', [
            'acks=0:  Throughput: Max  | Latency: <1ms  | Durability: Terrible (Data lost if network glitch)',
            'acks=1:  Throughput: High | Latency: 2ms   | Durability: Medium (Lost if leader crashes before sync)',
            'acks=-1: Throughput: High | Latency: 5ms   | Durability: Maximum (Zero data loss across crashes)'
          ], { icon: 'check' })
        },
        links: {
          pl: h('producer', 'leader', ['producer', 'leader'], { heads: 'both' }),
          lf: h('leader', 'follower', ['leader', 'follower'], { heads: 'both', label: 'ISR Replication' })
        },
        flows: [
          { route: ['pl'], bounce: true, rate: 2.2 },
          { route: ['lf'], bounce: true, rate: 2.2 }
        ]
      }
    },
    {
      short: 'min.insync.replicas',
      chapter: 'deep',
      title: 'The acks=all Trap: Why You Need min.insync.replicas',
      body: [
        'A common mistake: developers set <code>acks=all</code> and assume data is 100% safe. But what happens if 2 followers die?',
        'The ISR shrinks to just the Leader itself (ISR size = 1). Now <code>acks=all</code> only writes to the Leader! If the leader crashes, data is permanently lost. To fix this, you must set <code>min.insync.replicas=2</code>: if fewer than 2 replicas exist in the ISR, the leader <b>rejects writes with NotEnoughReplicasException</b>!'
      ],
      callout: {
        kind: 'alert',
        text: 'The Holy Trinity of Kafka Durability: replication.factor=3 + acks=all + min.insync.replicas=2.'
      },
      metrics: { replication_factor: '3', producer_acks: 'acks=all', min_isr: 'min.insync.replicas=2', high_watermark: 'Strict Enforced' },
      scene: {
        entities: {
          producer: y(-12, -4, { form: 'phone', label: 'Producer', tags: [{ text: 'acks=all', icon: 'zap' }] }),
          leader: d(-2, -4, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Leader', 'ISR Check: 1 < 2!'], sub: 'Rejects write (Safety!)' }),
          dead1: d(8, -10, { s: 4.4, h: 52, color: 'rose', glyph: 'server', label: ['Follower 1 (DOWN)', 'Crashed'], sub: 'Kicked from ISR' }),
          dead2: d(8, 2, { s: 4.4, h: 52, color: 'rose', glyph: 'server', label: ['Follower 2 (DOWN)', 'Network Partition'], sub: 'Kicked from ISR' }),
          card: S({ x: -2, y: 14 }, 'NotEnoughReplicasException Protection', [
            'Scenario: Both followers crashed. Only Leader alive (ISR size = 1)',
            'With default config: acks=all succeeds on Leader alone -> High risk!',
            'With min.insync.replicas = 2:',
            'Leader throws: NotEnoughReplicasException',
            'Prevents un-replicated writes: Producer retries until a follower recovers!'
          ], { icon: 'alert' })
        },
        links: {
          pl: h('producer', 'leader', ['producer', 'leader'], { heads: 'both', label: 'Exception Thrown' })
        },
        flows: [{ route: ['pl'], bounce: true, rate: 1.4 }]
      }
    },
    {
      short: 'ISR Eviction',
      chapter: 'deep',
      title: 'Follower Lag & ISR Eviction (replica.lag.time.max.ms)',
      body: [
        'How does a leader know when to kick a slow follower out of the ISR pool?',
        'If a follower stops sending FetchRequests or fails to catch up to the leader\'s Log End Offset within <code>replica.lag.time.max.ms</code> (default 30 seconds), the leader evicts it from the ISR and writes the updated ISR to the controller. Once the follower recovers and catches up, it is re-admitted to the ISR.'
      ],
      callout: {
        kind: 'tip',
        text: 'Evicting slow followers prevents a single degraded network switch from stalling all acks=all producers.'
      },
      metrics: { replication_factor: '3', producer_acks: 'acks=all', min_isr: '2 Alive', high_watermark: 'Unstalled' },
      scene: {
        entities: {
          leader: d(-8, -4, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Leader', 'Heartbeat Monitor'], sub: 'Evicts slow follower' }),
          fastFollower: d(8, -8, { s: 4.4, h: 52, color: 'green', glyph: 'database', label: ['Follower 1 (Healthy)', 'Lag: 2ms'], sub: 'In-Sync (ISR)' }),
          slowFollower: d(8, 4, { s: 4.4, h: 52, color: 'rose', glyph: 'database', label: ['Follower 2 (Stalled)', 'Lag: 35s > 30s!'], sub: 'EVICTED FROM ISR' }),
          card: S({ x: 0, y: 14 }, 'ISR Eviction Parameters', [
            'replica.lag.time.max.ms = 30000 (30 seconds)',
            'Follower 2 suffers GC pause or packet loss > 30s:',
            '1. Leader detects timeout -> Removes Follower 2 from ISR',
            '2. Updated ISR [Broker 1, Broker 2] written to @metadata',
            '3. Producers continue producing without being stalled by Follower 2!'
          ], { icon: 'clock' })
        },
        links: {
          lf: h('leader', 'fastFollower', ['leader', 'fastFollower'], { heads: 'both' }),
          ls: h('leader', 'slowFollower', ['leader', 'slowFollower'], { heads: 'end', label: 'Lag Timeout' })
        },
        flows: [
          { route: ['lf'], bounce: true, rate: 2.2 },
          { route: ['ls'], bounce: false, rate: 0.8 }
        ]
      }
    },
    {
      short: 'Unclean Election',
      chapter: 'problem',
      title: 'Unclean Leader Election: Availability vs Durability',
      body: [
        'What happens if the Leader crashes while all remaining followers are out of sync (ISR is empty)? You face an impossible CAP theorem dilemma:',
        '1. <b>Clean Election (Default):</b> Wait for the old leader to recover. Safe, but partition remains offline (Favors Consistency).<br>2. <b>Unclean Leader Election (<code>unclean.leader.election.enable=true</code>):</b> Elect an out-of-sync follower. Restores service immediately, but permanently loses un-replicated messages (Favors Availability).'
      ],
      callout: {
        kind: 'alert',
        text: 'Never enable unclean.leader.election in financial or audit systems. It violates message ordering and causes silent data truncation.'
      },
      metrics: { replication_factor: '3', producer_acks: 'unclean=false', min_isr: '0 (Leader Dead)', high_watermark: 'Offline / Safe' },
      scene: {
        entities: {
          deadLeader: d(-8, -4, { s: 4.4, h: 52, color: 'rose', glyph: 'server', label: ['Old Leader (DEAD)', 'Had Offsets 0..150'], sub: 'Holds true state' }),
          outOfSync: d(8, 4, { s: 4.6, h: 52, color: 'amber', glyph: 'database', label: ['Out-of-Sync Follower', 'Only has Offsets 0..100'], sub: 'Missing 50 messages!' }),
          card: S({ x: 0, y: 14 }, 'The Unclean Election Dilemma', [
            'unclean.leader.election.enable = false (Recommended):',
            '  - Partition stays OFFLINE until Broker 1 boots back up',
            '  - Zero data loss: 100% messages preserved',
            'unclean.leader.election.enable = true (High Availability):',
            '  - Out-of-sync node promoted -> Messages 101..150 ARE DELETED FOREVER!',
            '  - Offsets re-numbered, consumers experience duplicate or lost records'
          ], { icon: 'alert' })
        },
        links: {
          do: h('deadLeader', 'outOfSync', ['deadLeader', 'outOfSync'], { heads: 'both', label: '50 Messages Gap' })
        },
        flows: [{ route: ['do'], bounce: true, rate: 1.0 }]
      }
    },
    {
      short: 'Golden Rules',
      chapter: 'solution',
      title: 'Production Kafka Durability Blueprint',
      body: [
        'To achieve 100% zero data loss in production, configure the enterprise golden standard:',
        '• <code>replication.factor = 3</code> (spread across 3 Availability Zones).<br>• <code>acks = all</code> on all producers.<br>• <code>min.insync.replicas = 2</code> on all topics.<br>• <code>unclean.leader.election.enable = false</code>.<br>• <code>enable.idempotence = true</code> on producers (prevents duplicate retries).'
      ],
      callout: {
        kind: 'insight',
        text: 'This blueprint guarantees zero message loss and exactly-once delivery semantics (EOS) across all failure modes.'
      },
      metrics: { replication_factor: '3 (Multi-AZ)', producer_acks: 'acks=all', min_isr: '2', high_watermark: 'Enterprise Gold' },
      scene: {
        entities: {
          producer: y(-12, -4, { form: 'phone', label: 'Idempotent Producer', tags: [{ text: 'enable.idempotence=true', tone: 'green', icon: 'check' }] }),
          broker1: d(0, -10, { s: 4.4, h: 52, color: 'blue', glyph: 'database', label: ['Broker 1 (AZ 1)', 'Leader'], sub: 'In-Sync' }),
          broker2: d(0, 0, { s: 4.4, h: 52, color: 'teal', glyph: 'database', label: ['Broker 2 (AZ 2)', 'Follower'], sub: 'In-Sync' }),
          broker3: d(0, 10, { s: 4.4, h: 52, color: 'purple', glyph: 'database', label: ['Broker 3 (AZ 3)', 'Follower'], sub: 'In-Sync' }),
          card: S({ x: 10, y: 0 }, 'Zero-Loss Checklist', [
            '1. replication.factor: 3 (Multi-AZ)',
            '2. min.insync.replicas: 2',
            '3. acks: all (-1)',
            '4. enable.idempotence: true',
            '5. unclean.leader.election: false'
          ], { icon: 'check' })
        },
        links: {
          p1: h('producer', 'broker1', ['producer', 'broker1'], { heads: 'both' }),
          b12: h('broker1', 'broker2', ['broker1', 'broker2'], { heads: 'both' }),
          b13: h('broker1', 'broker3', ['broker1', 'broker3'], { heads: 'both' })
        },
        flows: [
          { route: ['p1'], bounce: true, rate: 2.5 },
          { route: ['b12'], bounce: true, rate: 2.0 },
          { route: ['b13'], bounce: true, rate: 2.0 }
        ]
      }
    }
  ]
};
