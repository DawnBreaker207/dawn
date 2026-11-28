import { STAGE, codeCard, linkOf, makeZone, stageBlock, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// Seed → result. A publisher and an exchange; each step adds the piece the previous one lacked.
// Each concept has its own id, at most two nodes join per step, and the exchange / queue keep
// their meaning while the connection, durability and acks change around them (tags).
//
//   step 1  publisher ── exchange                 seed: a smart broker routes
//   step 2  + queue (binding = the link)          exchange → binding → queue
//   step 3  (50 channels on one connection)       multiplexing: state of the publisher link
//   step 4  + vhost boundary around the broker    isolation per environment
//   step 5  + consumer                            manual acks
//   step 6  (durable + persistent, restarted)     survives a restart
//   step 7  (everything on)                       safe baseline
//
//                                  consumer (alt)
//   publisher ───────────────  exchange ────── queue          [ vhost ]

const publisher = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph: `send`, label: [`Order app`], sub, tags });
const exchange = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.main, { color: `green`, glyph: `route`, label: [`Exchange`], sub, tags });
const queue = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.store, { color: `purple`, glyph: `inbox`, label: [`orders`, `queue`], sub, tags });
const consumer = (tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `blue`, glyph: `zap`, label: [`Consumer`], sub: `worker`, tags });
// Tight boundary around the exchange and queue only (§8E: empty label, no floor text).
const vhost = () => makeZone({ x0: 2.4, x1: 15.4, y0: -4.6, y1: 5 }, ``);

const links = {
  pub: (label?: string) => linkOf(`publisher`, `exchange`, label),
  binding: (label?: string) => linkOf(`exchange`, `queue`, label),
  deliver: linkOf(`queue`, `consumer`),
};

export const rabbitmqAmqpModelLesson: Lesson = {
  id: 'rabbitmq-amqp-model',
  title: 'RabbitMQ Core: AMQP 0-9-1 & Multiplexed Channels',
  summary:
    'Start with a publisher and an exchange, then add a bound queue, multiplexed channels, a virtual host, a consumer with manual acks and durability — ending with a safe RabbitMQ baseline.',
  minutes: 13,
  level: 'intermediate',
  metrics: ['model', 'unit', 'delivery', 'risk'],
  legend: [[`req`, `publish`], [`msg`, `routed message`], [`fail`, `lost / rejected`]],
  goals: [
    { text: 'Contrast a smart broker with a distributed log', step: 1 },
    { text: 'Follow exchange → binding → queue routing', step: 2 },
    { text: 'Multiplex many channels over one TCP connection', step: 3 },
    { text: 'Isolate tenants with virtual hosts', step: 4 },
    { text: 'Acknowledge messages only after processing', step: 5 },
    { text: 'Keep messages through a restart with durability', step: 6 },
    { text: 'Combine the settings into a safe baseline', step: 7 },
  ],
  steps: [
    {
      short: 'Broker vs log',
      chapter: 'setup',
      title: 'Seed: RabbitMQ is a smart broker, not a log',
      body: [
        `RabbitMQ routes <b>messages</b> to <b>queues</b> and removes them once a consumer acknowledges. The broker is smart: it tracks which messages each consumer has, redelivers, and applies routing rules. Consumers are simple.`,
        `Kafka is the opposite: a partitioned, append-only <b>log</b> that keeps events for a retention period; consumers remember their own offset and can replay. Choose RabbitMQ for task queues and flexible routing; Kafka for event streams and replay.`,
      ],
      metrics: { model: 'smart broker', unit: 'message', delivery: 'push · ack', risk: 'queue backlog' },
      scene: {
        entities: {
          publisher: publisher(`producer`, [{ text: `publish`, tone: `green` }]),
          exchange: exchange(`broker routes`, [{ text: `deletes after ack`, tone: `violet` }]),
          card: codeCard(`Two philosophies`, [`ch.basic_consume("orders", on_message)      # RabbitMQ: pushed, acked, then removed`, `consumer.poll(timeout_ms=100)               # Kafka: pulled from your offset, stays`, `= tasks & routing: RabbitMQ   ·   streams & replay: Kafka`]),
        },
        links: { pub: links.pub() },
        flows: [{ route: ['pub'], kind: 'msg', rate: 1.6 }],
      },
    },
    {
      short: 'AMQP model',
      chapter: 'technique',
      title: 'Publish to an exchange, never to a queue',
      body: [
        `In AMQP 0-9-1 a producer publishes to an <span class="term">exchange</span> with a <b>routing key</b>. The exchange does not store anything: it consults its <span class="term">bindings</span> — rules linking it to queues — and copies the message into each matching queue.`,
        `Queues hold messages until consumers take them. This split lets you add a queue (say, for analytics) without touching the producer.`,
      ],
      changes: [`+ queue`, `+ binding`],
      metrics: { model: 'exchange → queue', unit: 'binding', delivery: 'copy per queue', risk: 'unroutable' },
      scene: {
        entities: {
          publisher: publisher(`key: order.paid`, [{ text: `basic.publish`, tone: `green` }]),
          exchange: exchange(`orders · topic`, [{ text: `no storage`, tone: `violet` }]),
          queue: queue(`orders.paid`, [{ text: `+1 message`, tone: `green` }]),
          card: codeCard(`Declare the topology`, [`ch.exchange_declare("orders", "topic", durable=True)`, `ch.queue_declare("orders.paid", durable=True)`, `ch.queue_bind("orders.paid", "orders", routing_key="order.paid")`, `ch.basic_publish("orders", "order.paid", body)`]),
        },
        links: { pub: links.pub(`order.paid`), binding: links.binding(`binding`) },
        flows: [{ route: ['pub', 'binding'], kind: 'msg', rate: 1.4 }],
      },
    },
    {
      short: 'Channels',
      chapter: 'technique',
      title: 'Many channels, one TCP connection',
      body: [
        `Opening a TCP connection (plus TLS and auth) is slow and costs the broker memory. AMQP lets you open many lightweight <span class="term">channels</span> inside one connection: each is an independent session for publishing or consuming.`,
        `Rule of thumb: <b>one connection per process, one channel per thread</b>. Channels are not thread-safe to share, and one bad operation closes only its channel, not the connection.`,
      ],
      changes: [`~ publisher: 50 workers, 1 connection`, `~ link: 50 channels`],
      metrics: { model: 'connection / channel', unit: 'channel', delivery: 'per-channel', risk: 'conn churn' },
      scene: {
        entities: {
          publisher: publisher(`50 workers`, [{ text: `1 connection`, tone: `green` }]),
          exchange: exchange(`TCP + TLS + auth`, [{ text: `50 channels`, tone: `violet`, icon: `layers` }]),
          queue: queue(`shared queue`),
          card: codeCard(`One connection`, [`conn = pika.BlockingConnection(params)         # once per process`, `ch = conn.channel()                             # once per thread`, `! 50 TCP connections instead = 50× the memory: anti-pattern`]),
        },
        links: { pub: links.pub(`50 channels`), binding: links.binding() },
        flows: [{ route: ['pub', 'binding'], kind: 'msg', rate: 2 }],
      },
    },
    {
      short: 'vhosts',
      chapter: 'insight',
      title: 'Virtual hosts: separate worlds in one broker',
      body: [
        `A <span class="term">virtual host</span> (vhost) is a namespace inside one RabbitMQ node: its own exchanges, queues, bindings, <b>users’ permissions</b> and policies. <code>/prod</code> and <code>/staging</code> can both have a queue named <code>orders</code> without conflict.`,
        `A connection is opened against exactly one vhost. Use one per environment or per tenant and grant each application only its own — cheap multi-tenancy without running several brokers.`,
      ],
      changes: [`+ vhost /prod boundary`, `+ permissions`],
      metrics: { model: 'namespace', unit: 'vhost', delivery: 'isolated', risk: 'wrong vhost' },
      scene: {
        entities: {
          vhost: vhost(),
          publisher: publisher(`user: shop-prod`, [{ text: `vhost /prod only`, tone: `violet`, icon: `lock` }]),
          exchange: exchange(`in /prod`, [{ text: `own exchanges`, tone: `violet` }]),
          queue: queue(`in /prod`, [{ text: `prod data`, tone: `green` }]),
          card: codeCard(`Isolate with one command`, [`$ rabbitmqctl add_vhost /prod`, `$ rabbitmqctl set_permissions -p /prod shop-prod ".*" ".*" ".*"`, `amqp://shop-prod:••••@mq.example.com:5672/%2Fprod`]),
        },
        links: { pub: links.pub(`/prod`), binding: links.binding() },
        flows: [{ route: ['pub', 'binding'], kind: 'msg', rate: 1.4 }],
      },
    },
    {
      short: 'ACKs',
      chapter: 'technique',
      title: 'Ack after the work, not before',
      body: [
        `When RabbitMQ delivers a message it marks it <b>unacknowledged</b> and waits. Only when the consumer sends <code>basic.ack</code> does the broker delete it. If the connection dies first, the message is redelivered to another consumer.`,
        `Use <b>manual acks</b>: ack after the side-effects are done. <code>basic.nack</code>/<code>reject</code> with <code>requeue=false</code> sends a bad message to a dead-letter exchange; <code>requeue=true</code> puts it back. Auto-ack risks losing messages on a crash.`,
      ],
      changes: [`+ consumer`, `~ queue: 3 unacked`],
      metrics: { model: 'ack protocol', unit: 'delivery tag', delivery: 'at-least-once', risk: 'duplicates' },
      scene: {
        entities: {
          vhost: vhost(),
          publisher: publisher(`producer`),
          exchange: exchange(`in /prod`),
          queue: queue(`in /prod`, [{ text: `3 unacked`, tone: `amber`, icon: `clock` }]),
          consumer: consumer([{ text: `ack after the work`, tone: `green`, icon: `check` }]),
          card: codeCard(`Manual acknowledgement`, [`def on_message(ch, method, props, body):`, `    handle(body)                        # side effects first`, `    ch.basic_ack(method.delivery_tag)   # then ack`, `ch.basic_consume("orders", on_message, auto_ack=False)`]),
        },
        links: { pub: links.pub(), binding: links.binding(), deliver: links.deliver },
        flows: [{ route: ['deliver'], kind: 'msg', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Durability',
      chapter: 'problem',
      title: 'A restart should not eat the queue',
      body: [
        `By default a broker restart wipes <em>transient</em> queues and messages. To survive it you need all three: a <b>durable queue</b> (declared <code>durable=true</code>), <b>persistent messages</b> (<code>delivery_mode=2</code>) and, for confirmation they hit disk, <b>publisher confirms</b>.`,
        `Persistent messages are written to disk, so very large queues put pressure on memory and disk. Modern RabbitMQ keeps queue contents mostly on disk and only a small window in RAM; set a <code>max-length</code> so a stuck consumer cannot fill the node.`,
      ],
      changes: [`~ queue: durable + persistent`, `~ exchange: restarted`],
      metrics: { model: 'persistence', unit: 'on disk', delivery: 'survives', risk: 'memory / disk' },
      scene: {
        entities: {
          vhost: vhost(),
          publisher: publisher(`delivery_mode=2`, [{ text: `persistent`, tone: `green` }]),
          exchange: exchange(`restarted`, [{ text: `node back up`, tone: `green`, icon: `refresh` }]),
          queue: queue(`durable`, [{ text: `8,200 recovered`, tone: `green`, icon: `shield` }]),
          consumer: consumer(),
          card: codeCard(`All three`, [`ch.queue_declare("orders", durable=True)`, `props = pika.BasicProperties(delivery_mode=2)   # persistent`, `ch.confirm_delivery()                           # know it reached disk`]),
        },
        links: { pub: links.pub(), binding: links.binding(), deliver: links.deliver },
        flows: [{ route: ['pub', 'binding'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'Baseline',
      chapter: 'recap',
      title: 'Result: a safe baseline in one view',
      body: [
        `Put it together: connect once per process with a channel per thread; declare <b>durable</b> exchanges and queues; publish <b>persistent</b> messages with confirms; consume with <b>manual acks</b> and a prefetch limit; give every queue a dead-letter exchange.`,
        `That gives at-least-once delivery: messages survive restarts and crashes, and a failing message ends up somewhere you can inspect rather than looping forever. Make consumers idempotent to handle the occasional duplicate.`,
      ],
      changes: [`~ everything on`, `~ queue: dead-letter exchange`],
      metrics: { model: 'durable + ack', unit: 'message', delivery: 'at-least-once', risk: 'duplicates' },
      scene: {
        entities: {
          vhost: vhost(),
          publisher: publisher(`persistent + confirm`, [{ text: `confirmed`, tone: `green` }]),
          exchange: exchange(`orders · durable`, [{ text: `TLS · vhost /prod`, tone: `violet` }]),
          queue: queue(`durable queue`, [{ text: `x-dead-letter-exchange`, tone: `violet` }]),
          consumer: consumer([{ text: `manual ack · prefetch 20`, tone: `green` }]),
          card: codeCard(`Checklist`, [`durable exchange + queue   persistent messages   publisher confirms`, `manual ack   basic_qos(prefetch_count=20)   x-dead-letter-exchange`, `= idempotent consumers handle the rare duplicate`]),
        },
        links: { pub: links.pub(`confirmed`), binding: links.binding(), deliver: links.deliver },
        flows: [{ route: ['pub', 'binding'], kind: 'msg', rate: 1.4 }, { route: ['deliver'], kind: 'msg', rate: 1.2, bounce: true }],
      },
    },
  ],
};
