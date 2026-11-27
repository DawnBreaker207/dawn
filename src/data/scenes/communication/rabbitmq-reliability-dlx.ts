import {
  makeBlock,
  makeDevice,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';

export const rabbitmqReliabilityDlxLesson = {
  id: 'rabbitmq-reliability-dlx',
  title: 'RabbitMQ Reliability: Publisher Confirms & Dead Letter Exchanges',
  summary: 'Architect resilient enterprise queues: Publisher Confirms, consumer prefetch QoS, dead letter routing, retry backoff loops, and Raft Quorum Queues.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['reliability_tier', 'delivery_guarantee', 'dlx_policy', 'queue_type'],
  legend: ['req', 'res', ['ping', 'reliable delivery'], 'fail'],
  goals: [
    { text: 'Publisher Confirms (confirm.select) for', step: 1 },
    { text: 'Consumer prefetch QoS to prevent', step: 2 },
    { text: 'Dead Letter Exchanges (DLX) for', step: 3 },
    { text: 'Retry queues with message TTL', step: 4 },
    { text: 'Raft Quorum Queues replacing legacy', step: 6 },
  ],
  steps: [
    {
      short: 'Failure Modes',
      chapter: 'setup',
      title: 'Message Loss Points in Messaging Systems',
      body: [
        'Where can messages be lost in a message queue pipeline?',
        '1. <b>In transit to broker:</b> Network drop between producer and RabbitMQ.<br>2. <b>Inside broker:</b> Server crashes before writing message to disk.<br>3. <b>At consumer:</b> Worker crashes midway through processing an uncommitted job.<br>Architecting 100% reliability requires safeguards at every tier.'
      ],
      callout: {
        kind: 'insight',
        text: 'Reliability requires coordination between Publisher Confirms, Durable Queues, and Consumer ACKs.'
      },
      metrics: { reliability_tier: 'Unprotected', delivery_guarantee: 'At-Most-Once', dlx_policy: 'None', queue_type: 'Classic Transient' },
      scene: {
        entities: {
          producer: makeDevice(-10, -8, { form: 'phone', label: 'Producer', tags: [{ text: 'Unconfirmed writes', tone: 'red', icon: 'alert' }] }),
          broker: makeBlock(6, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'inbox', label: ['RabbitMQ Broker', 'Transient Queue'], sub: 'Data lost on power crash' }),
          card: makePanel({ x: -2, y: 14 }, 'The 3 Vulnerability Points', [
            'Point A: Producer -> Broker (Message drops on network glitch)',
            'Point B: Inside Broker (Server killed before fsync to disk)',
            'Point C: Broker -> Consumer (Worker throws unhandled Exception)',
            'Result: High risk of silent lost orders and missing payments'
          ], { icon: 'alert' })
        },
        links: {
          pb: makeLink('producer', 'broker', ['producer', 'broker'], { heads: 'end', label: 'Unverified Publish' })
        },
        flows: [{ route: ['pb'], bounce: false, rate: 2.0 }]
      }
    },
    {
      short: 'Publisher Confirms',
      chapter: 'technique',
      title: 'Publisher Confirms: Guaranteed Broker Ingestion',
      body: [
        'Traditional transactions (<code>tx_select</code>) slow RabbitMQ throughput by 250x. <b>Publisher Confirms (<code>confirm.select</code>)</b> provide high-speed asynchronous delivery confirmation.',
        'The publisher sends batches of messages with sequential sequence numbers. Once the broker persists the message to disk or mirrors it to quorum replicas, it returns an asynchronous <code>basic.ack</code> to the publisher.'
      ],
      callout: {
        kind: 'tip',
        text: 'Publisher confirms allow 50,000+ confirmed writes per second asynchronously.'
      },
      metrics: { reliability_tier: 'Publisher Confirmed', delivery_guarantee: 'Guaranteed Ingestion', dlx_policy: 'None', queue_type: 'Durable Queue' },
      scene: {
        entities: {
          producer: makeDevice(-10, -8, { form: 'phone', label: 'Producer App', tags: [{ text: 'confirm.select', tone: 'green', icon: 'lock' }] }),
          broker: makeBlock(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'inbox', label: ['RabbitMQ Broker', 'Persisted to Disk'], sub: 'Returns basic.ack(seq)' }),
          card: makePanel({ x: -2, y: 14 }, 'Publisher Confirms Flow', [
            '1. channel.confirm_select() enables async confirms',
            '2. Producer sends message #1, #2, #3 without blocking',
            '3. Broker writes to durable queue disk buffer',
            '4. Broker returns channel.basic_ack(delivery_tag=3, multiple=true)',
            'Producer now knows with 100% certainty data is safely on disk!'
          ], { icon: 'check' })
        },
        links: {
          pb: makeLink('producer', 'broker', ['producer', 'broker'], { heads: 'both', label: 'Publish / basic.ack' })
        },
        flows: [{ route: ['pb'], bounce: true, rate: 2.8 }]
      }
    },
    {
      short: 'Prefetch QoS',
      chapter: 'technique',
      title: 'Fair Dispatch: Consumer Prefetch (basic.qos)',
      body: [
        'By default, RabbitMQ pushes all incoming messages to consumers in round-robin fashion, regardless of how busy they are.',
        'If Worker 1 gets 10 heavy PDF generation tasks while Worker 2 gets light tasks, Worker 1 becomes overwhelmed while Worker 2 sits idle. <b>Prefetch Count (<code>channel.basic_qos(prefetch_count=1)</code>)</b> tells RabbitMQ not to give a worker more than 1 unacknowledged message at a time!'
      ],
      callout: {
        kind: 'insight',
        text: 'Prefetch=1 ensures work is dispatched dynamically to whoever finishes first (Fair Dispatch).'
      },
      metrics: { reliability_tier: 'QoS Balanced', delivery_guarantee: 'At-Least-Once', dlx_policy: 'None', queue_type: 'Fair Dispatch' },
      scene: {
        entities: {
          queue: makeBlock(-8, -4, { s: 4.8, h: 50, color: 'orange', glyph: 'inbox', label: ['Task Queue', 'prefetch = 1'], sub: 'Dispatches only when idle' }),
          w1: makeBlock(8, -8, { s: 4.4, h: 52, color: 'purple', glyph: 'server', label: ['Worker 1 (Busy)', 'Processing Task #1'], sub: 'Unacked: 1 (Blocked)' }),
          w2: makeBlock(8, 4, { s: 4.4, h: 52, color: 'green', glyph: 'server', label: ['Worker 2 (Free)', 'Idle'], sub: 'Receives next message' }),
          card: makePanel({ x: -2, y: 14 }, 'Prefetch QoS Mechanics', [
            'Without prefetch: 100 messages split 50/50 upfront -> Worker 1 stalls',
            'With basic.qos(prefetch_count=1):',
            '- RabbitMQ will NOT send a message to a worker that has 1 unacked task',
            '- Fast workers automatically pull more tasks from the queue',
            '- Maximizes cluster utilization across heterogeneous servers'
          ], { icon: 'layers' })
        },
        links: {
          qw1: makeLink('queue', 'w1', ['queue', 'w1'], { heads: 'both' }),
          qw2: makeLink('queue', 'w2', ['queue', 'w2'], { heads: 'both' })
        },
        flows: [
          { route: ['qw1'], bounce: true, rate: 1.0 },
          { route: ['qw2'], bounce: true, rate: 2.6 }
        ]
      }
    },
    {
      short: 'Dead Letter Exchange',
      chapter: 'technique',
      title: 'Dead Letter Exchanges (DLX): Isolating Poison Messages',
      body: [
        'What happens when a message contains malformed JSON or triggers an unhandled null pointer exception? If the worker rejects it with <code>requeue=true</code>, it creates a 100% CPU infinite retry loop!',
        'A <b>Dead Letter Exchange (DLX)</b> automatically intercepts messages when:<br>1. Rejected with <code>basic.reject(requeue=false)</code>.<br>2. Message expires due to TTL.<br>3. Queue exceeds max length. The failed message is routed to an isolated <b>DLQ</b> for inspection.'
      ],
      callout: {
        kind: 'tip',
        text: 'Configure DLX on queue creation via arguments: x-dead-letter-exchange and x-dead-letter-routing-key.'
      },
      metrics: { reliability_tier: 'DLX Protected', delivery_guarantee: 'Poison Isolated', dlx_policy: 'x-dead-letter-exchange', queue_type: 'DLQ Routed' },
      scene: {
        entities: {
          mainQ: makeBlock(-12, -4, { s: 4.6, h: 52, color: 'blue', glyph: 'inbox', label: ['Main Queue: orders', 'Poison Msg Detected'], sub: 'basic.reject(requeue=false)' }),
          dlx: makeBlock(-2, 4, { s: 4.6, h: 52, color: 'rose', glyph: 'route', label: ['DLX: orders_dlx', 'Dead Letter Exchange'], sub: 'Captures failed jobs' }),
          dlq: makeBlock(12, 4, { s: 4.8, h: 50, color: 'rose', glyph: 'inbox', label: ['Dead Letter Queue (DLQ)', 'Isolated for Review'], sub: 'Alerts sent to Sentry / Slack' }),
          card: makePanel({ x: -2, y: 16 }, 'DLX Routing Arguments', [
            'Map<String, Object> args = new HashMap<>();',
            'args.put("x-dead-letter-exchange", "orders_dlx");',
            'args.put("x-dead-letter-routing-key", "orders_dead");',
            'channel.queueDeclare("orders_q", true, false, false, args);',
            'Failed messages route to DLQ instead of crashing consumers!'
          ], { icon: 'alert' })
        },
        links: {
          qd: makeLink('mainQ', 'dlx', ['mainQ', 'dlx'], { heads: 'end', label: 'Rejected' }),
          dq: makeLink('dlx', 'dlq', ['dlx', 'dlq'], { heads: 'end', label: 'Store in DLQ' })
        },
        flows: [
          { route: ['qd'], bounce: false, rate: 1.5 },
          { route: ['dq'], bounce: false, rate: 1.5 }
        ]
      }
    },
    {
      short: 'Retry & Backoff',
      chapter: 'deep',
      title: 'Architectural Pattern: Retry Queues with Exponential Backoff',
      body: [
        'Network timeouts with external payment gateways are often transient (503 Service Unavailable).',
        'By combining <b>Message TTL (<code>x-message-ttl</code>)</b> and DLX, you can build an automated retry loop: Failed jobs route to a <code>retry_30s_q</code>. After 30 seconds, the message expires and the DLX automatically routes it <b>back to the main queue</b> for a second attempt!'
      ],
      callout: {
        kind: 'insight',
        text: 'Zero worker code is required for delays: RabbitMQ TTL handles the sleep timer internally.'
      },
      metrics: { reliability_tier: 'Retry Loop', delivery_guarantee: 'Exponential Backoff', dlx_policy: 'TTL -> Return to Main', queue_type: 'Delayed Retry' },
      scene: {
        entities: {
          mainQ: makeBlock(-8, -4, { s: 4.6, h: 52, color: 'blue', glyph: 'inbox', label: ['Main Queue', 'Attempts 1 & 2'], sub: 'Executes job' }),
          retryQ: makeBlock(8, -4, { s: 4.8, h: 50, color: 'amber', glyph: 'clock', label: ['Retry Queue (30s TTL)', 'No Active Consumers'], sub: 'x-message-ttl: 30000' }),
          card: makePanel({ x: 0, y: 14 }, 'The Dead-Letter Retry Loop', [
            '1. Worker fails to charge credit card (Gateway timeout)',
            '2. Worker rejects message -> DLX sends to retry_30s_q',
            '3. retry_30s_q has NO consumers: Message sits for 30s TTL',
            '4. After 30s, message dies -> its DLX sends it BACK to Main Queue!',
            '5. Worker tries again and succeeds'
          ], { icon: 'refresh' })
        },
        links: {
          mr: makeLink('mainQ', 'retryQ', ['mainQ', 'retryQ'], { heads: 'end', label: 'Fail -> Retry Q' }),
          rm: makeLink('retryQ', 'mainQ', ['retryQ', 'mainQ'], { heads: 'end', label: 'TTL Expired -> Return' })
        },
        flows: [
          { route: ['mr'], bounce: false, rate: 1.8 },
          { route: ['rm'], bounce: false, rate: 1.8 }
        ]
      }
    },
    {
      short: 'Quorum Queues (Raft)',
      chapter: 'deep',
      title: 'Modern High Availability: Raft Quorum Queues',
      body: [
        'Legacy RabbitMQ used <i>Mirrored Queues (ha-mode: all)</i>, which were notoriously prone to network partition split-brains and message loss during failovers.',
        'Modern RabbitMQ uses <b>Quorum Queues (<code>x-queue-type: quorum</code>)</b>: backed by the <b>Raft consensus algorithm</b>. A quorum of nodes (e.g. 2 of 3) must persist each message to disk before it is acknowledged, providing bulletproof data safety.'
      ],
      callout: {
        kind: 'tip',
        text: 'Mirrored queues are deprecated in RabbitMQ 3.13+. Always use Quorum Queues for durable messaging.'
      },
      metrics: { reliability_tier: 'Raft Consensus', delivery_guarantee: 'Zero Data Loss', dlx_policy: 'Quorum Replicated', queue_type: 'Quorum Queue' },
      scene: {
        entities: {
          leader: makeBlock(-8, -4, { s: 4.8, h: 50, color: 'green', glyph: 'shield', label: ['Quorum Leader', 'Raft Term 4'], sub: 'Quorum size: 3' }),
          follower1: makeBlock(8, -8, { s: 4.4, h: 52, color: 'teal', glyph: 'database', label: ['Quorum Follower 1', 'Raft Log Replicated'], sub: 'Persisted to disk' }),
          follower2: makeBlock(8, 4, { s: 4.4, h: 52, color: 'teal', glyph: 'database', label: ['Quorum Follower 2', 'Raft Log Replicated'], sub: 'Persisted to disk' }),
          card: makePanel({ x: -2, y: 16 }, 'Quorum Queue Guarantees', [
            '1. Message written to Raft Leader',
            '2. Leader replicates to Follower 1 and Follower 2',
            '3. When majority (2 of 3) persist to disk -> Publisher ACK returned',
            '4. Network partition safe: Minority partitions cannot elect leaders'
          ], { icon: 'shield' })
        },
        links: {
          lf1: makeLink('leader', 'follower1', ['leader', 'follower1'], { heads: 'both' }),
          lf2: makeLink('leader', 'follower2', ['leader', 'follower2'], { heads: 'both' })
        },
        flows: [
          { route: ['lf1'], bounce: true, rate: 2.2 },
          { route: ['lf2'], bounce: true, rate: 2.2 }
        ]
      }
    },
    {
      short: 'Production Blueprint',
      chapter: 'solution',
      title: 'End-to-End Enterprise Reliability Blueprint',
      body: [
        'To achieve zero message loss and fault tolerance across outages, configure the complete enterprise stack:',
        '• <b>Publisher:</b> <code>confirm_select()</code> + persistent delivery mode (<code>delivery_mode=2</code>).<br>• <b>Broker:</b> <code>x-queue-type: quorum</code> + durable exchange/queue declarations.<br>• <b>Consumer:</b> <code>auto_ack=false</code> (explicit <code>basic_ack</code>) + <code>basic_qos(prefetch_count=1)</code>.<br>• <b>Error Handling:</b> Dead Letter Exchange (DLX) + delayed retry queues.'
      ],
      callout: {
        kind: 'insight',
        text: 'This 4-tier blueprint guarantees that no message is ever dropped, duplicate retries are bounded, and bad data is safely quarantined.'
      },
      metrics: { reliability_tier: 'Enterprise Bulletproof', delivery_guarantee: '100% Durability', dlx_policy: 'Full DLX + DLQ', queue_type: 'Quorum + Confirms' },
      scene: {
        entities: {
          publisher: makeDevice(-12, -4, { form: 'phone', label: 'Publisher', tags: [{ text: 'delivery_mode=2', tone: 'green', icon: 'lock' }] }),
          quorumQ: makeBlock(-2, -4, { s: 4.8, h: 50, color: 'green', glyph: 'shield', label: ['Quorum Queue (Raft)', 'durable=true'], sub: '3-Node Multi-AZ Quorum' }),
          consumer: makeBlock(8, -4, { s: 4.6, h: 52, color: 'blue', glyph: 'server', label: ['Worker Pool', 'manual_ack'], sub: 'prefetch_count=1' }),
          dlq: makeBlock(8, 6, { s: 4.4, h: 52, color: 'rose', glyph: 'inbox', label: ['Dead Letter Queue', 'Quarantine'], sub: 'Unrecoverable jobs' }),
          card: makePanel({ x: -2, y: 16 }, 'Production Reliability Checklist', [
            '1. delivery_mode = 2 (PERSISTENT message header)',
            '2. x-queue-type = "quorum" (Raft replication across 3 AZs)',
            '3. channel.basic_qos(prefetch_count=1) (Fair dispatch)',
            '4. auto_ack = false (Manual basic_ack after DB transaction)',
            '5. Dead Letter Exchange configured on all queues'
          ], { icon: 'check' })
        },
        links: {
          pq: makeLink('publisher', 'quorumQ', ['publisher', 'quorumQ'], { heads: 'both' }),
          qc: makeLink('quorumQ', 'consumer', ['quorumQ', 'consumer'], { heads: 'both' }),
          qdl: makeLink('quorumQ', 'dlq', ['quorumQ', 'dlq'], { heads: 'end', label: 'DLX' })
        },
        flows: [
          { route: ['pq'], bounce: true, rate: 2.5 },
          { route: ['qc'], bounce: true, rate: 2.2 }
        ]
      }
    }
  ]
};
