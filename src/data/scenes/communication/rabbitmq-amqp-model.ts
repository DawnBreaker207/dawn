// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const rabbitmqAmqpModelLesson = {
  id: 'rabbitmq-amqp-model',
  title: 'RabbitMQ Core: AMQP 0-9-1 & Multiplexed Channels',
  summary: 'Architect event routing with RabbitMQ: the AMQP 0-9-1 model, lightweight multiplexed channels over a single TCP connection, and vhost isolation.',
  minutes: 13,
  level: 'intermediate',
  metrics: ['amqp_protocol', 'tcp_conns', 'multiplexed_channels', 'broker_model'],
  legend: ['req', 'res', ['ping', 'amqp frame'], 'fail'],
  goals: [
    { text: 'Compare smart broker RabbitMQ with dumb broker Kafka', step: 1 },
    { text: 'The AMQP 0-9-1 model: Exchange, Binding, Queue, Consumer', step: 2 },
    { text: 'Multiplexed channels over a single shared TCP connection', step: 3 },
    { text: 'Virtual Hosts (vhosts) for multi-tenant isolation', step: 4 },
    { text: 'Consumer acknowledgments: basic.ack, basic.nack, basic.reject', step: 5 },
  ],
  steps: [
    {
      short: 'RabbitMQ vs Kafka',
      chapter: 'setup',
      title: 'Smart Broker vs Smart Consumer Paradigm',
      body: [
        'Kafka is a <i>"Dumb Broker, Smart Consumer"</i>: it maintains an append-only log and leaves routing, consumer offset tracking, and filtering to the client.',
        '<b>RabbitMQ is a <i>"Smart Broker, Dumb Consumer"</i></b>: the broker actively tracks message delivery, executes complex routing rules (Exchanges), monitors consumer acknowledgments, and deletes messages once acknowledged.'
      ],
      callout: {
        kind: 'insight',
        text: 'Use RabbitMQ for transactional job routing and complex workflows. Use Kafka for high-throughput event streaming.'
      },
      metrics: { amqp_protocol: 'AMQP 0-9-1', tcp_conns: '1 TCP', multiplexed_channels: 'Active', broker_model: 'Smart Broker' },
      scene: {
        entities: {
          producer: y(-10, -8, { form: 'phone', label: 'Order App', tags: [{ text: 'Publish Order', icon: 'zap' }] }),
          broker: d(6, 8, { s: 4.8, h: 50, color: 'orange', glyph: 'inbox', label: ['RabbitMQ Broker', 'Erlang BEAM VM'], sub: 'Smart Routing & State' }),
          card: S({ x: -2, y: 14 }, 'RabbitMQ vs Kafka Comparison', [
            'RabbitMQ (Smart Broker):',
            '  - Messages deleted once consumed & acknowledged',
            '  - Granular per-message routing (Exchanges & Bindings)',
            '  - Priorities, delayed messages, Dead Letter Exchanges',
            'Kafka (Dumb Broker):',
            '  - Messages retained on disk; consumer manages offset pointer'
          ], { icon: 'layers' })
        },
        links: {
          pb: h('producer', 'broker', ['producer', 'broker'], { heads: 'both', label: 'AMQP 0-9-1' })
        },
        flows: [{ route: ['pb'], bounce: true, rate: 2.5 }]
      }
    },
    {
      short: 'AMQP Entities',
      chapter: 'technique',
      title: 'The AMQP 0-9-1 Pipeline: Exchange → Binding → Queue',
      body: [
        'In AMQP 0-9-1, producers <b>never publish directly to a queue</b>. Instead, producers publish to an <b>Exchange</b>.',
        'The Exchange inspects message attributes (routing key, headers) and copies the message into one or more <b>Queues</b> according to defined <b>Bindings</b>. Consumers subscribe to the queue and receive messages via push (<code>basic.consume</code>).'
      ],
      callout: {
        kind: 'tip',
        text: 'Decoupling Exchanges from Queues allows dynamic re-routing without modifying producer code.'
      },
      metrics: { amqp_protocol: 'AMQP Pipeline', tcp_conns: '1 TCP', multiplexed_channels: 'Channel 1', broker_model: 'Exchange -> Queue' },
      scene: {
        entities: {
          producer: y(-12, -4, { form: 'phone', label: 'Producer', tags: [{ text: 'RoutingKey: "order.paid"', icon: 'zap' }] }),
          exchange: d(-2, -4, { s: 4.6, h: 52, color: 'orange', glyph: 'route', label: ['Exchange: orders', 'Direct / Topic'], sub: 'Evaluates Bindings' }),
          queue: d(8, 4, { s: 4.8, h: 50, color: 'teal', glyph: 'inbox', label: ['Queue: billing_q', 'FIFO Buffer'], sub: 'Durable Disk Backed' }),
          card: S({ x: -2, y: 14 }, 'AMQP 0-9-1 Core Entities', [
            '1. Producer: basic.publish(exchange="orders", routingKey="order.paid")',
            '2. Exchange: Compares routingKey against Binding keys',
            '3. Binding: Link connecting Exchange -> Queue with criteria',
            '4. Queue: FIFO message store awaiting consumer pull/push',
            '5. Consumer: basic.consume() pulls payload and returns ACK'
          ], { icon: 'listOrdered' })
        },
        links: {
          pe: h('producer', 'exchange', ['producer', 'exchange'], { heads: 'end' }),
          eq: h('exchange', 'queue', ['exchange', 'queue'], { heads: 'end', label: 'Binding: order.*' })
        },
        flows: [
          { route: ['pe'], bounce: false, rate: 2.2 },
          { route: ['eq'], bounce: false, rate: 2.2 }
        ]
      }
    },
    {
      short: 'Channels vs Conns',
      chapter: 'technique',
      title: 'Connections vs Channels: TCP Multiplexing',
      body: [
        'Opening a real TCP connection involves a 3-way handshake, TLS negotiation, and socket buffer allocation (costing 50+ ms and kernel memory).',
        'RabbitMQ solves this with <b>Channels</b>: lightweight virtual connections multiplexed over a <b>single shared TCP connection</b>. Each application thread gets its own channel (Channel ID: 1, 2, 3...) without the overhead of opening multiple TCP sockets.'
      ],
      callout: {
        kind: 'insight',
        text: 'Best practice: 1 TCP connection per application process, 1 Channel per worker thread.'
      },
      metrics: { amqp_protocol: 'Multiplexed AMQP', tcp_conns: '1 Physical TCP', multiplexed_channels: '50 Channels', broker_model: 'Zero Handshake Overhead' },
      scene: {
        entities: {
          appThreads: y(-10, -8, { form: 'phone', label: 'Multi-Thread App', tags: [{ text: '50 Worker Threads', icon: 'workflow' }] }),
          tcpPipe: d(0, 0, { s: 4.6, h: 52, color: 'blue', glyph: 'network', label: ['Single TCP Connection', 'Port 5672 (AMQP)'], sub: 'Carries Frames 1..50' }),
          broker: d(10, 8, { s: 4.8, h: 50, color: 'orange', glyph: 'inbox', label: ['RabbitMQ Broker', 'Channel Dispatcher'], sub: 'Erlang Actors per Channel' }),
        },
        links: {
          at: h('appThreads', 'tcpPipe', ['appThreads', 'tcpPipe'], { heads: 'both' }),
          tb: h('tcpPipe', 'broker', ['tcpPipe', 'broker'], { heads: 'both' })
        },
        flows: [{ route: ['at', 'tb'], bounce: true, rate: 2.8 }]
      }
    },
    {
      short: 'Virtual Hosts (vhosts)',
      chapter: 'technique',
      title: 'Multi-Tenancy: Virtual Hosts (vhosts)',
      body: [
        'A single RabbitMQ cluster can host multiple independent business domains using <b>Virtual Hosts (vhosts)</b>.',
        'A vhost is a completely isolated namespace: queues, exchanges, and bindings in <code>/prod</code> are completely invisible to <code>/stage</code> or <code>/billing</code>, enforced by granular user permissions (read, write, configure).'
      ],
      callout: {
        kind: 'tip',
        text: 'The default vhost is "/". Always create dedicated vhosts (e.g. /ecommerce) for production applications.'
      },
      metrics: { amqp_protocol: 'Multi-Tenant', tcp_conns: 'Shared Cluster', multiplexed_channels: 'vhost Isolated', broker_model: 'Namespace Segregated' },
      scene: {
        entities: {
          vhostProd: d(-8, -4, { s: 4.6, h: 52, color: 'green', glyph: 'shield', label: ['vhost: /production', 'Strict Permissions'], sub: 'Exchanges + Queues' }),
          vhostStage: d(8, 4, { s: 4.6, h: 52, color: 'purple', glyph: 'shield', label: ['vhost: /staging', 'Sandbox Environment'], sub: 'Exchanges + Queues' }),
          card: S({ x: 0, y: 14 }, 'vhost Permissions Config', [
            'rabbitmqctl add_vhost /production',
            'rabbitmqctl set_permissions -p /production app_user ".*" ".*" ".*"',
            'Client connects: amqp://app_user:pass@rabbitmq:5672/production',
            'Guarantees zero accidental routing bleed between environments'
          ], { icon: 'shield' })
        },
        links: {},
        flows: []
      }
    },
    {
      short: 'Consumer ACKs',
      chapter: 'deep',
      title: 'Reliability: basic.ack, basic.nack & basic.reject',
      body: [
        'To prevent message loss if a worker crashes mid-processing, RabbitMQ uses explicit <b>Consumer Acknowledgments</b>:',
        '• <code>basic.ack:</code> Worker succeeded; RabbitMQ deletes message from queue.<br>• <code>basic.reject(requeue=true):</code> Worker failed; message is returned to head of queue.<br>• <code>basic.nack:</code> Negative ACK for batch of messages (optionally rerouting to a Dead Letter Exchange).'
      ],
      callout: {
        kind: 'insight',
        text: 'If a consumer drops its TCP connection before sending basic.ack, RabbitMQ automatically re-delivers the message to another consumer.'
      },
      metrics: { amqp_protocol: 'Manual Acks', tcp_conns: '1 TCP', multiplexed_channels: 'basic.ack Active', broker_model: 'At-Least-Once' },
      scene: {
        entities: {
          queue: d(-8, -4, { s: 4.8, h: 50, color: 'teal', glyph: 'inbox', label: ['Queue: orders_q', 'Unacknowledged: 1'], sub: 'Awaiting Consumer ACK' }),
          worker: d(8, 4, { s: 4.6, h: 52, color: 'green', glyph: 'server', label: ['Worker Thread', 'Processing Job'], sub: 'Sends basic.ack(tag)' }),
          card: S({ x: 0, y: 14 }, 'Consumer Acknowledgment Flow', [
            '1. Broker delivers message with delivery_tag = 104',
            '2. Queue marks message as UNACKED (held in memory)',
            '3. Worker saves order to DB -> sends channel.basic_ack(104)',
            '4. Broker removes message from disk queue forever',
            'If worker crashes before step 3: Broker redelivers to Worker 2!'
          ], { icon: 'check' })
        },
        links: {
          qw: h('queue', 'worker', ['queue', 'worker'], { heads: 'both', label: 'Deliver / basic.ack' })
        },
        flows: [{ route: ['qw'], bounce: true, rate: 2.2 }]
      }
    },
    {
      short: 'Lazy Queues',
      chapter: 'deep',
      title: 'Memory vs Disk: Lazy Queues (queue_mode=lazy)',
      body: [
        'By default, RabbitMQ holds messages in RAM and pages to disk only when memory pressure rises, causing severe throughput drops.',
        'With <b>Lazy Queues (<code>x-queue-mode: lazy</code>)</b>, RabbitMQ writes messages directly to disk as they arrive, loading into memory only when a consumer asks. This delivers predictable, rock-solid throughput even when queues back up with 50 million messages.'
      ],
      callout: {
        kind: 'tip',
        text: 'In RabbitMQ 3.12+, Quorum Queues use lazy paging by default, eliminating memory exhaustion crashes.'
      },
      metrics: { amqp_protocol: 'Lazy Queues', tcp_conns: 'Stable', multiplexed_channels: 'Active', broker_model: 'Disk-First Paging' },
      scene: {
        entities: {
          publisher: y(-10, -8, { form: 'phone', label: 'Publisher', tags: [{ text: '50M Message Backlog', tone: 'amber', icon: 'layers' }] }),
          lazyQueue: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Lazy Queue on Disk', 'RAM: 20MB (Constant)'], sub: 'Zero Memory Pressure' }),
          card: S({ x: -2, y: 14 }, 'Standard vs Lazy Queues', [
            'Standard Queue:',
            '  - Messages stored in RAM -> Memory spikes -> Garbage Collection freezes',
            'Lazy Queue (x-queue-mode: lazy):',
            '  - Messages written directly to disk immediately',
            '  - Consumes minimal RAM regardless of queue depth (50M messages safe)',
            '  - Flat predictable throughput on NVMe SSDs'
          ], { icon: 'database' })
        },
        links: {
          pl: h('publisher', 'lazyQueue', ['publisher', 'lazyQueue'], { heads: 'end', label: 'Direct Disk Append' })
        },
        flows: [{ route: ['pl'], bounce: false, rate: 2.6 }]
      }
    },
    {
      short: 'Heartbeats',
      chapter: 'solution',
      title: 'TCP Heartbeats & Dead Connection Pruning',
      body: [
        'Middleboxes, firewalls, and AWS NAT Gateways silently drop idle TCP connections after 350 seconds of inactivity without sending a FIN packet.',
        'RabbitMQ negotiates a <b>Heartbeat Timeout (default 60s)</b>. Both client and server exchange heartbeat frames every 30 seconds. If two consecutive heartbeats are missed, the connection is closed and unacknowledged messages are returned to the queue.'
      ],
      callout: {
        kind: 'insight',
        text: 'Never block the RabbitMQ connection thread with heavy CPU work, or heartbeats will miss and drop the connection!'
      },
      metrics: { amqp_protocol: 'Heartbeat 60s', tcp_conns: 'Monitored', multiplexed_channels: 'Protected', broker_model: 'Clean Teardown' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Worker Client', tags: [{ text: 'Heartbeat 30s', icon: 'heartPulse' }] }),
          broker: d(6, 8, { s: 4.8, h: 50, color: 'orange', glyph: 'inbox', label: ['RabbitMQ Broker', 'Heartbeat Watchdog'], sub: 'Closes dead sockets' }),
          card: S({ x: -2, y: 14 }, 'AMQP Heartbeat Protocol', [
            'Client <-> Broker: Exchange Heartbeat Frame (Type 8) every 30s',
            'If no frame received for 60 seconds (2 missed cycles):',
            '  1. Broker closes TCP socket',
            '  2. All unacked messages released back to queue',
            '  3. Consumer app triggers automatic reconnection logic'
          ], { icon: 'heartPulse' })
        },
        links: {
          cb: h('client', 'broker', ['client', 'broker'], { heads: 'both', label: 'Heartbeat Frames' })
        },
        flows: [{ route: ['cb'], bounce: true, rate: 1.5 }]
      }
    }
  ]
};
