import { STAGE, codeCard, linkOf, stageBlock, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// Seed → result. A producer and a queue that can lose messages; every step makes them safer.
// Each concept has its own id, at most two nodes join per step, and the queue keeps its id while
// it gets confirmed, replicated and monitored (state changes, shown as tags and the sub line).
//
//   step 1  producer ── queue                    seed: four loss points
//   step 2  (confirms, durable: state)           publisher confirms
//   step 3  + consumer                           manual ack + prefetch
//   step 4  + dlx, + dlq                         failures get a place to go
//   step 5  + retry                              TTL queue loops back with backoff
//   step 6  (queue becomes a quorum queue)       Raft replication
//   step 7  (everything on, monitored)           production blueprint
//
//   retry (left-top)        dlx (top)          dlq (top-right)
//   producer ───────────── queue ───────────── consumer (right)

const producer = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph: `send`, label: [`producer`], sub, tags });
const queue = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.main, { color: `green`, glyph: `inbox`, label: [`orders`, `queue`], sub, tags });
const consumer = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.store, { color: `blue`, glyph: `zap`, label: [`consumer`], sub, tags });
const dlx = (tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph: `route`, label: [`DLX`], sub: `orders.dlx`, tags });
const dlq = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `purple`, glyph: `inbox`, label: [`orders.dlq`], sub, tags });
const retry = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller2, { color: `orange`, glyph: `clock`, label: [`Retry`, `queue`], sub: `TTL 30 s`, tags });

const links = {
  publish: (label?: string) => linkOf(`producer`, `queue`, label),
  deliver: (label?: string) => linkOf(`queue`, `consumer`, label),
  deadRoute: (label?: string) => ({ ...linkOf(`queue`, `dlx`, label, false), labelAt: 0.6 }),
  dlxDlq: (label?: string) => ({ ...linkOf(`dlx`, `dlq`, label, false), labelAt: 0.6 }),
  dlxRetry: linkOf(`dlx`, `retry`, undefined, false),
  retryBack: (label?: string) => ({ ...linkOf(`retry`, `queue`, label, false), labelAt: 0.6 }),
};

export const rabbitmqReliabilityDlxLesson: Lesson = {
  id: 'rabbitmq-reliability-dlx',
  title: 'RabbitMQ Reliability: Publisher Confirms & Dead Letter Exchanges',
  summary:
    'Start with a producer and a queue that can lose messages, then add publisher confirms, a consumer with prefetch, a dead-letter exchange and queue, a retry loop, Raft quorum queues and monitoring.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['guarantee', 'failure', 'setting', 'cost'],
  legend: [[`req`, `publish`], [`msg`, `message`], [`fail`, `lost / dead`]],
  goals: [
    { text: 'Name the ways a message can be lost', step: 1 },
    { text: 'Confirm that the broker accepted a publish', step: 2 },
    { text: 'Limit unacked messages with consumer prefetch', step: 3 },
    { text: 'Route failed messages to a Dead Letter Exchange', step: 4 },
    { text: 'Retry with a TTL queue and backoff', step: 5 },
    { text: 'Replicate queues with Raft quorum queues', step: 6 },
    { text: 'Apply a production blueprint', step: 7 },
  ],
  steps: [
    {
      short: 'Failures',
      chapter: 'problem',
      title: 'Seed: where messages go missing',
      body: [
        `A message can vanish at four points. The <b>producer</b> sends it and the network drops it. The <b>broker</b> crashes before writing it to disk. The <b>consumer</b> gets it, the process dies mid-work and an auto-ack had already deleted it. Or the message is <b>unroutable</b> and silently discarded.`,
        `Each has a matching tool: publisher confirms, durable queues and persistent messages, manual acks, the <code>mandatory</code> flag. The next steps add them one by one around this producer and queue.`,
      ],
      metrics: { guarantee: 'none yet', failure: '4 loss points', setting: 'defaults', cost: 'none' },
      scene: {
        entities: {
          producer: producer(`fire and forget`, [{ text: `no confirm`, tone: `red`, icon: `alert` }]),
          queue: queue(`transient`, [{ text: `crash = lost`, tone: `red` }]),
          card: codeCard(`Four loss points`, [`1. publish → network drops it        (no confirm)`, `2. broker crashes before fsync          (transient)`, `3. auto_ack=True, worker crashes        (acked early)`, `4. no queue bound for the routing key  (silently dropped)`]),
        },
        links: { publish: links.publish() },
        flows: [{ route: ['publish'], kind: 'fail', rate: 1.2 }],
      },
    },
    {
      short: 'Confirms',
      chapter: 'solution',
      title: 'Publisher confirms: the broker says “got it”',
      body: [
        `Turn on <code>confirm.select</code> and the broker sends a <code>basic.ack</code> back for every publish <em>after</em> it has taken responsibility — routed to the queues and, for persistent messages on durable queues, written to disk (or replicated, for quorum queues).`,
        `No confirm within a timeout, or a <code>nack</code>, means: publish again. Confirm in batches or asynchronously for throughput — waiting for each one individually is slow. Add <code>mandatory</code> to get unroutable messages returned.`,
      ],
      changes: [`~ producer: confirm.select`, `~ queue: durable`],
      metrics: { guarantee: 'accepted', failure: 'retry', setting: 'confirm.select', cost: '~1 RTT' },
      scene: {
        entities: {
          producer: producer(`confirm mode`, [{ text: `waits for ack`, tone: `green`, icon: `clock` }]),
          queue: queue(`durable`, [{ text: `persisted`, tone: `green`, icon: `shield` }]),
          card: codeCard(`Async confirms`, [`ch.confirm_delivery()`, `ch.basic_publish("orders", "order.paid", body, mandatory=True)`, `# broker → publisher: basic.ack(delivery_tag)  or  basic.nack`, `= unacked after timeout → publish again`]),
        },
        links: { publish: links.publish() },
        flows: [{ route: ['publish'], kind: 'msg', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Prefetch',
      chapter: 'technique',
      title: 'A consumer with manual acks and prefetch',
      body: [
        `The consumer now acks <em>after</em> the work is done, so a crash means redelivery instead of loss. But without a limit RabbitMQ pushes messages as fast as it can: a slow worker ends up holding thousands of unacked messages while a fast one sits idle.`,
        `<code>basic.qos(prefetch_count=N)</code> caps the number of unacked messages per consumer. With N=20 a worker gets a new message only when it acks one, so fast workers naturally take more. Start around 20–50 and tune by processing time.`,
      ],
      changes: [`+ consumer`, `+ manual ack`, `+ basic.qos(20)`],
      metrics: { guarantee: 'fair dispatch', failure: 'redelivery bounded', setting: 'prefetch 20', cost: 'none' },
      scene: {
        entities: {
          producer: producer(`1,000 msg/s`),
          queue: queue(`ready 4,200`, [{ text: `durable`, tone: `green` }]),
          consumer: consumer(`manual ack`, [{ text: `20 unacked max`, tone: `green` }]),
          card: codeCard(`Limit in flight`, [`ch.basic_qos(prefetch_count=20)`, `ch.basic_consume("orders", on_message, auto_ack=False)`, `= worker holds ≤ 20 unacked; the rest wait in the queue`]),
        },
        links: { publish: links.publish(), deliver: links.deliver() },
        flows: [{ route: ['deliver'], kind: 'msg', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'DLX',
      chapter: 'solution',
      title: 'Dead Letter Exchange: a place for failures',
      body: [
        `A message that keeps failing would loop forever. Declare the queue with <code>x-dead-letter-exchange</code> and RabbitMQ <b>dead-letters</b> a message when it is rejected with <code>requeue=false</code>, expires (TTL), or the queue overflows its length limit.`,
        `The dead letter goes to another exchange and queue (a <b>DLQ</b>) with headers recording the reason and count (<code>x-death</code>). Alert on the DLQ depth; fix; then shovel the messages back.`,
      ],
      changes: [`+ DLX`, `+ DLQ`, `~ consumer: nack, requeue=false`],
      metrics: { guarantee: 'failures kept', failure: 'poison isolated', setting: 'x-dead-letter-*', cost: 'a queue' },
      scene: {
        entities: {
          producer: producer(`publish`),
          queue: queue(`1 poison msg`, [{ text: `x-dead-letter-exchange`, tone: `violet` }]),
          consumer: consumer(`nack, requeue=false`, [{ text: `fails`, tone: `red` }]),
          dlx: dlx([{ text: `reason in x-death`, tone: `violet` }]),
          dlq: dlq(`dead letters`, [{ text: `alarm: depth > 0`, tone: `amber` }]),
          card: codeCard(`Declare with a DLX`, [`ch.queue_declare("orders", durable=True, arguments={`, `    "x-dead-letter-exchange": "orders.dlx",`, `    "x-dead-letter-routing-key": "orders.failed" })`, `ch.basic_nack(tag, requeue=False)     # → DLQ`]),
        },
        links: { publish: links.publish(), deliver: links.deliver(), deadRoute: links.deadRoute(), dlxDlq: links.dlxDlq() },
        flows: [{ route: ['deliver'], kind: 'fail', rate: 1, bounce: true }, { route: ['deadRoute', 'dlxDlq'], kind: 'msg', rate: 1 }],
      },
    },
    {
      short: 'Retry',
      chapter: 'technique',
      title: 'Retry with a TTL queue and backoff',
      body: [
        `Immediate retries hammer a service that is down. Build a <b>delay loop</b>: the failed message dead-letters into a <em>retry queue</em> that has <code>x-message-ttl</code> (say 30 s) and a DLX pointing back to the main exchange. When the TTL expires it returns for another attempt.`,
        `Use several retry queues (10 s, 1 min, 10 min) for growing backoff and count attempts in the <code>x-death</code> header; after the last one, send to the final DLQ. The delayed-message plugin is an alternative.`,
      ],
      changes: [`+ retry queue (TTL 30 s)`, `~ DLX loops back`],
      metrics: { guarantee: 'bounded retries', failure: 'backoff', setting: 'x-message-ttl', cost: 'extra queues' },
      scene: {
        entities: {
          producer: producer(`publish`),
          queue: queue(`attempt 2 of 3`, [{ text: `durable`, tone: `green` }]),
          consumer: consumer(`fails again`, [{ text: `nack`, tone: `red` }]),
          dlx: dlx([{ text: `routes by attempt`, tone: `violet` }]),
          dlq: dlq(`after 3 tries`, [{ text: `give up`, tone: `red` }]),
          retry: retry([{ text: `waits, then returns`, tone: `violet` }]),
          card: codeCard(`A delay loop`, [`retry: { "x-message-ttl": 30000, "x-dead-letter-exchange": "orders" }`, `main:  { "x-dead-letter-exchange": "orders.retry" }`, `if x_death_count(props) >= 3: publish("orders.dlq", body)`]),
        },
        links: { publish: links.publish(), deliver: links.deliver(), deadRoute: links.deadRoute(), dlxDlq: links.dlxDlq(), dlxRetry: links.dlxRetry, retryBack: links.retryBack(`30 s`) },
        flows: [{ route: ['deliver'], kind: 'fail', rate: 1, bounce: true }, { route: ['dlxRetry'], kind: 'msg', rate: 0.8 }, { route: ['retryBack'], kind: 'msg', rate: 0.8 }],
      },
    },
    {
      short: 'Quorum',
      chapter: 'solution',
      title: 'Quorum queues: replicated with Raft',
      body: [
        `A durable queue on one node still dies with that node. <span class="term">Quorum queues</span> keep each queue on several nodes (3 or 5) using the <b>Raft</b> consensus protocol: one leader, followers, and a write counts only when a majority has it.`,
        `Lose one node of three and nothing is lost; a new leader is elected. They replace the old classic <em>mirrored</em> queues (removed in RabbitMQ 4). Bonus: a built-in <code>x-delivery-limit</code> dead-letters poison messages automatically.`,
      ],
      changes: [`~ queue: quorum, 3 nodes`, `~ producer: confirmed by quorum`],
      metrics: { guarantee: 'majority', failure: '1 node lost', setting: 'quorum', cost: '3× disk' },
      scene: {
        entities: {
          producer: producer(`confirms`, [{ text: `confirmed by quorum`, tone: `green` }]),
          queue: queue(`quorum · 3 nodes`, [{ text: `Raft term 7 · majority 2/3`, tone: `violet`, icon: `layers` }]),
          consumer: consumer(`manual ack`),
          dlx: dlx(),
          dlq: dlq(`after 3 tries`),
          retry: retry(),
          card: codeCard(`Declare a quorum queue`, [`ch.queue_declare("orders", durable=True, arguments={`, `    "x-queue-type": "quorum",`, `    "x-delivery-limit": 5 })            # poison → DLX after 5 tries`]),
        },
        links: { publish: links.publish(), deliver: links.deliver(), deadRoute: links.deadRoute(), dlxDlq: links.dlxDlq(), dlxRetry: links.dlxRetry, retryBack: links.retryBack() },
        flows: [{ route: ['publish'], kind: 'write', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Blueprint',
      chapter: 'recap',
      title: 'Result: the production blueprint',
      body: [
        `Combine every layer: a <b>quorum queue</b> on a 3-node cluster; <b>persistent</b> messages with <b>publisher confirms</b>; consumers with <b>manual acks</b> and a <b>prefetch</b> limit; a <b>delivery limit</b> plus a DLX and DLQ; retry queues with backoff for transient errors.`,
        `Then watch it: queue depth, unacked count, consumer utilisation, DLQ depth and publish/confirm latency (the Prometheus plugin exposes them). Reliability you do not monitor is only a hope.`,
      ],
      changes: [`~ all layers on`, `~ DLQ alerts`],
      metrics: { guarantee: 'at-least-once', failure: 'node loss ok', setting: 'full blueprint', cost: 'moderate' },
      scene: {
        entities: {
          producer: producer(`persistent + confirm`, [{ text: `confirmed`, tone: `green` }]),
          queue: queue(`quorum · 3 nodes`, [{ text: `delivery limit 5`, tone: `violet` }]),
          consumer: consumer(`manual ack · prefetch 20`, [{ text: `idempotent`, tone: `green`, icon: `shield` }]),
          dlx: dlx(),
          dlq: dlq(`inspect + redrive`, [{ text: `Prometheus alert · empty`, tone: `green` }]),
          retry: retry(),
          card: codeCard(`Checklist`, [`quorum queue   persistent msgs   publisher confirms`, `manual ack   prefetch 20   x-delivery-limit + DLX`, `retry queues (backoff)   alert on DLQ depth > 0`]),
        },
        links: { publish: links.publish(), deliver: links.deliver(), deadRoute: links.deadRoute(), dlxDlq: links.dlxDlq(), dlxRetry: links.dlxRetry, retryBack: links.retryBack() },
        flows: [{ route: ['publish'], kind: 'msg', rate: 1.4, bounce: true }, { route: ['deliver'], kind: 'msg', rate: 1.2, bounce: true }],
      },
    },
  ],
};
