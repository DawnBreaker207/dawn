import {
  makeBlock,
  makeDevice,
  makeLink,
  makePanel,
  distinctConcepts,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const redisClusterShardingLesson: Lesson = distinctConcepts({
  id: 'redis-cluster-sharding',
  title: 'Redis Cluster: 16,384 Hash Slots & Sentinel Failover',
  summary: 'Scale Redis horizontally: Sentinel automatic master failover, CRC16 16,384 hash slots, MOVED/ASK client redirection, and online slot migration.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['cluster_nodes', 'hash_slots', 'failover_mode', 'sharding_algo'],
  legend: ['req', 'res', ['ping', 'gossip sync'], 'fail'],
  goals: [
    { text: 'Redis Sentinel automatic master', step: 1 },
    { text: 'Redis Cluster 16,384 hash slots', step: 2 },
    { text: 'Hash tags for multi-key operations', step: 3 },
    { text: 'MOVED and ASK client redirection protocols', step: 4 },
    { text: 'Online resharding and replica', step: 6 },
  ],
  steps: [
    {
      short: 'Single Node Limit',
      chapter: 'setup',
      title: 'The Vertical Ceiling of a Single Redis Master',
      body: [
        'A single Redis instance maxes out around 100k–200k QPS and is physically constrained by single-node RAM (e.g. 128 GB).',
        'When your dataset grows to 500 GB or requires 1 million writes per second, horizontal scaling is mandatory. But how do you distribute data across dozens of nodes while preserving microsecond latency?'
      ],
      callout: {
        kind: 'insight',
        text: 'Scaling Redis horizontally requires either Sentinel (for HA) or Redis Cluster (for sharding).'
      },
      metrics: { cluster_nodes: '1 Master', hash_slots: 'None (Monolith)', failover_mode: 'Manual', sharding_algo: 'None' },
      scene: {
        entities: {
          client: makeDevice(-7, -4, { form: 'phone', label: 'App Clients', tags: [{ text: '500 GB Dataset', tone: 'amber', icon: 'database' }] }),
          master: makeBlock(6, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Single Redis Master', 'Memory Saturated'], sub: '128 GB Max RAM' }),
          card: makePanel({ x: -2, y: 14 }, 'Horizontal Scaling Strategies', [
            '1. Redis Sentinel: 1 Master + Multiple Replicas (HA, not sharded)',
            '2. Client-Side Sharding: App hashes key -> picks server (Rigid)',
            '3. Redis Cluster: Native peer-to-peer 16,384 hash slots (Industry Standard)'
          ], { icon: 'layers' })
        },
        links: {
          cm: makeLink('client', 'master', ['client', 'master'], { heads: 'both', label: 'Overloaded Master' })
        },
        flows: [{ route: ['cm'], bounce: true, rate: 2.5 }]
      }
    },
    {
      short: 'Redis Sentinel',
      chapter: 'setup',
      title: 'High Availability: Redis Sentinel Quorum',
      body: [
        'Before full clustering, Redis Sentinel provides automatic failover for Master-Replica setups.',
        'A cluster of 3 Sentinel nodes monitors the Master with periodic heartbeats. If the Master stops responding, Sentinels reach a <b>Quorum (e.g. 2 of 3)</b>, elect a leader Sentinel, and automatically promote a Replica to become the new Master.'
      ],
      callout: {
        kind: 'tip',
        text: 'Always deploy at least 3 Sentinel instances in different Availability Zones to avoid split-brain scenarios.'
      },
      metrics: { cluster_nodes: '1 Master + 2 Replicas', hash_slots: 'Replication Stream', failover_mode: 'Sentinel Auto (Quorum 2/3)', sharding_algo: 'None' },
      scene: {
        entities: {
          sentinel: makeBlock(-8, -4, { s: 4.6, h: 52, color: 'orange', glyph: 'shield', label: ['Sentinel Pool (3x)', 'Quorum: 2/3'], sub: 'Heartbeat Ping (1s)' }),
          oldMaster: makeBlock(8, -10, { s: 4.4, h: 52, color: 'rose', glyph: 'database', label: ['Old Master (DOWN)', 'Failed Health Check'], sub: 'sdown -> odown' }),
          newMaster: makeBlock(8, 2, { s: 4.4, h: 52, color: 'green', glyph: 'database', label: ['Promoted Replica', 'NEW MASTER'], sub: 'slaveof no one' }),
          card: makePanel({ x: -2, y: 14 }, 'Sentinel Failover Steps', [
            '1. Subjectively Down (sdown): 1 Sentinel misses ping',
            '2. Objectively Down (odown): 2 Sentinels confirm master death',
            '3. Raft-like election: Leader Sentinel chosen',
            '4. Promotes most up-to-date replica: SLAVEOF NO ONE',
            '5. Reconfigures other replicas and informs clients via Pub/Sub'
          ], { icon: 'shield' })
        },
        links: {
          so: makeLink('sentinel', 'oldMaster', ['sentinel', 'oldMaster'], { heads: 'end', label: 'Failed Ping' }),
          sn: makeLink('sentinel', 'newMaster', ['sentinel', 'newMaster'], { heads: 'end', label: 'Promote to Master' })
        },
        flows: [{ route: ['sn'], bounce: false, rate: 2.0 }]
      }
    },
    {
      short: '16,384 Hash Slots',
      chapter: 'technique',
      title: 'Redis Cluster: The 16,384 Hash Slots',
      body: [
        'Redis Cluster does not use consistent hashing rings. Instead, all keyspace is divided into exactly <b>16,384 Hash Slots</b>.',
        'Slot formula: <code>slot = CRC16(key) mod 16384</code>. A 3-node cluster divides the slots evenly:<br>• Node A: Slots 0 – 5460<br>• Node B: Slots 5461 – 10922<br>• Node C: Slots 10923 – 16383.'
      ],
      callout: {
        kind: 'insight',
        text: '16,384 slots is the optimal size: small enough for heartbeat messages to fit in a 2KB bitmap, yet large enough to support 1,000 nodes.'
      },
      metrics: { cluster_nodes: '3 Masters', hash_slots: '16,384 Slots', failover_mode: 'Cluster Native', sharding_algo: 'CRC16(key) % 16384' },
      scene: {
        entities: {
          client: makeDevice(-12, -4, { form: 'phone', label: 'Smart Client', tags: [{ text: 'CRC16("user:42") % 16384 = 8219', icon: 'zap' }] }),
          nodeA: makeBlock(6, -10, { s: 4.4, h: 52, color: 'blue', glyph: 'database', label: ['Node A (Master)', 'Slots: 0..5460'], sub: 'Port 7000' }),
          nodeB: makeBlock(6, -2, { s: 4.4, h: 52, color: 'teal', glyph: 'database', label: ['Node B (Master)', 'Slots: 5461..10922'], sub: 'Holds slot 8219!' }),
          nodeC: makeBlock(6, 6, { s: 4.4, h: 52, color: 'purple', glyph: 'database', label: ['Node C (Master)', 'Slots: 10923..16383'], sub: 'Port 7002' }),
          card: makePanel({ x: -2, y: 16 }, 'Hash Slot Calculation', [
            'Key: "user:42"',
            'CRC16("user:42") = 0x603B = 24635',
            'Slot = 24635 % 16384 = 8251',
            'Slot 8251 belongs to Node B (5461 - 10922)',
            'Client connects directly to Node B!'
          ], { icon: 'listOrdered' })
        },
        links: {
          cb: makeLink('client', 'nodeB', ['client', 'nodeB'], { heads: 'both', label: 'Direct to Slot Owner' })
        },
        flows: [{ route: ['cb'], bounce: true, rate: 3.2 }]
      }
    },
    {
      short: 'Hash Tags {}',
      chapter: 'technique',
      title: 'Multi-Key Operations: Hash Tags {}',
      body: [
        'Redis Cluster forbids multi-key commands (MGET, MSET, transactions) if the keys belong to different hash slots.',
        'To force related keys into the <b>exact same hash slot</b>, use <b>Hash Tags <code>{}</code></b>. Redis only hashes the characters inside the curly braces. Therefore, <code>{user:100}.profile</code> and <code>{user:100}.orders</code> hash to the exact same slot on the same physical node!'
      ],
      callout: {
        kind: 'tip',
        text: 'Always use hash tags for transactional multi-key Lua scripts in Redis Cluster.'
      },
      metrics: { cluster_nodes: '3 Masters', hash_slots: 'Co-located Slots', failover_mode: 'Cluster Native', sharding_algo: 'CRC16({tag}) % 16384' },
      scene: {
        entities: {
          client: makeDevice(-7, -4, { form: 'phone', label: 'Client', tags: [{ text: 'MGET {u100}.a {u100}.b', icon: 'zap' }] }),
          nodeA: makeBlock(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Node A', 'Holds Slot for {u100}'], sub: 'Both keys co-located' }),
          card: makePanel({ x: -2, y: 14 }, 'Hash Tag Rules', [
            'Key 1: "{user:100}:profile" -> Hashes "user:100" -> Slot 5812',
            'Key 2: "{user:100}:orders"  -> Hashes "user:100" -> Slot 5812',
            'Both keys reside on Node A: Atomic multi-key MGET/EVAL allowed!',
            'Without {}: Keys land on different nodes -> CROSSSLOT error!'
          ], { icon: 'check' })
        },
        links: {
          ca: makeLink('client', 'nodeA', ['client', 'nodeA'], { heads: 'both', label: 'Co-located Multi-Key' })
        },
        flows: [{ route: ['ca'], bounce: true, rate: 2.8 }]
      }
    },
    {
      short: 'MOVED vs ASK',
      chapter: 'deep',
      title: 'Client Redirection: MOVED vs ASK',
      body: [
        'What happens if a client sends a query to the wrong Redis node?',
        '• <b>MOVED Redirection:</b> The target slot permanently belongs to another node. Node A replies <code>-MOVED 8251 10.0.1.2:7001</code>. The client updates its local slot cache and retries.<br>• <b>ASK Redirection:</b> The slot is currently in the middle of online migration. Client sends an <code>ASKING</code> command to Node B for this single request only.'
      ],
      callout: {
        kind: 'insight',
        text: 'Smart clients (Jedis, ioredis) cache the slot map locally, avoiding redirects on 99.9% of queries.'
      },
      metrics: { cluster_nodes: '3 Masters', hash_slots: 'Dynamic Routing', failover_mode: 'Cluster Native', sharding_algo: 'Client Cache' },
      scene: {
        entities: {
          client: makeDevice(-12, -4, { form: 'phone', label: 'Client', tags: [{ text: 'Outdated Cache', tone: 'amber', icon: 'refresh' }] }),
          nodeA: makeBlock(-2, -4, { s: 4.6, h: 52, color: 'blue', glyph: 'database', label: ['Node A', 'Does NOT hold slot'], sub: '-MOVED 8251 10.0.1.2' }),
          nodeB: makeBlock(6, 2, { s: 4.8, h: 50, color: 'teal', glyph: 'database', label: ['Node B', 'True Slot 8251 Owner'], sub: 'Answers GET user:42' }),
          card: makePanel({ x: -2, y: 14 }, 'MOVED Redirection Sequence', [
            '1. Client -> Node A: GET user:42',
            '2. Node A -> Client: -MOVED 8251 10.0.1.2:7001',
            '3. Client updates internal slot routing table: Slot 8251 = Node B',
            '4. Client -> Node B: GET user:42 -> Returns "John"',
            'Future queries for Slot 8251 go directly to Node B with 0 redirects'
          ], { icon: 'route' })
        },
        links: {
          ca: makeLink('client', 'nodeA', ['client', 'nodeA'], { heads: 'both', label: '1. Misdirected' }),
          cb: makeLink('client', 'nodeB', ['client', 'nodeB'], { heads: 'both', label: '2. Retry' })
        },
        flows: [
          { route: ['ca'], bounce: true, rate: 1.5 },
          { route: ['cb'], bounce: true, rate: 2.5 }
        ]
      }
    },
    {
      short: 'Online Resharding',
      chapter: 'technique',
      title: 'Online Slot Migration (Zero Downtime Resharding)',
      body: [
        'When adding Node D to scale capacity, you can migrate 4,000 slots from Nodes A, B, and C to Node D live in production.',
        'For each slot: 1. Set source to <code>MIGRATING</code> and target to <code>IMPORTING</code>.<br>2. Migrate keys using <code>MIGRATE</code> commands.<br>3. Once empty, update the cluster slot table. Zero dropped connections or downtime.'
      ],
      callout: {
        kind: 'tip',
        text: 'During migration, queries for keys already moved trigger ASK redirects, while unmigrated keys are served by the source.'
      },
      metrics: { cluster_nodes: '4 Masters (Scaling Up)', hash_slots: 'Migrating 4,096', failover_mode: 'Online Reshard', sharding_algo: 'Zero Downtime' },
      scene: {
        entities: {
          nodeA: makeBlock(-8, -4, { s: 4.6, h: 52, color: 'blue', glyph: 'database', label: ['Node A (Source)', 'MIGRATING Slot 1000'], sub: 'Streaming keys' }),
          nodeD: makeBlock(8, 4, { s: 4.8, h: 50, color: 'green', glyph: 'database', label: ['New Node D (Target)', 'IMPORTING Slot 1000'], sub: 'Receiving slot data' }),
        },
        links: {
          ad: makeLink('nodeA', 'nodeD', ['nodeA', 'nodeD'], { heads: 'end', label: 'Live MIGRATE Stream' })
        },
        flows: [{ route: ['ad'], bounce: false, rate: 2.2 }]
      }
    },
    {
      short: 'Gossip Failover',
      chapter: 'solution',
      title: 'Cluster Gossip Protocol & Replica Auto-Promotion',
      body: [
        'Redis Cluster nodes communicate over a dedicated <b>Cluster Bus (port 17000)</b> using a binary <b>Gossip Protocol</b> (PING/PONG packets).',
        'If Node A stops responding to gossip pings, other masters mark it <code>PFAIL</code> (Possible Failure). When a majority of masters agree on <code>FAIL</code>, Node A’s replica requests authorization and promotes itself to Master automatically!'
      ],
      callout: {
        kind: 'insight',
        text: 'No external Sentinel is needed in Redis Cluster: the master nodes form their own distributed consensus consensus quorum.'
      },
      metrics: { cluster_nodes: '6 Nodes (3M + 3R)', hash_slots: '16,384 Full', failover_mode: 'Gossip Bus (Port 17000)', sharding_algo: 'Auto Failover' },
      scene: {
        entities: {
          nodeB: makeBlock(-8, -4, { s: 4.4, h: 52, color: 'teal', glyph: 'database', label: ['Master B', 'Voted FAIL for A'], sub: 'Port 17001' }),
          nodeC: makeBlock(-10, 4, { s: 4.4, h: 52, color: 'purple', glyph: 'database', label: ['Master C', 'Voted FAIL for A'], sub: 'Port 17002' }),
          deadA: makeBlock(4, -10, { s: 4.4, h: 52, color: 'rose', glyph: 'database', label: ['Master A (FAIL)', 'Crashed / Unreachable'], sub: 'Majority vote' }),
          replicaA: makeBlock(8, 2, { s: 4.8, h: 50, color: 'green', glyph: 'database', label: ['Replica A1', 'ELECTED NEW MASTER!'], sub: 'Takes over Slots 0..5460' }),
          card: makePanel({ x: -2, y: 16 }, 'Gossip Election Sequence', [
            '1. Master B & C detect Node A ping timeout (cluster-node-timeout)',
            '2. Majority of masters broadcast FAIL message over Cluster Bus',
            '3. Replica A1 increments currentEpoch and asks masters for votes',
            '4. Masters B & C grant votes -> Replica A1 wins majority',
            '5. Replica A1 executes SLAVEOF NO ONE and broadcasts takeover!'
          ], { icon: 'check' })
        },
        links: {
          bc: makeLink('nodeB', 'replicaA', ['nodeB', 'replicaA'], { heads: 'end', label: 'Vote OK' }),
          cc: makeLink('nodeC', 'replicaA', ['nodeC', 'replicaA'], { heads: 'end', label: 'Vote OK' })
        },
        flows: [
          { route: ['bc'], bounce: false, rate: 1.8 },
          { route: ['cc'], bounce: false, rate: 1.8 }
        ]
      }
    }
  ]
});
