// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeBalancer as f,
  makeCrowd as p,
  makeGhost as m,
  makeLink as h,
  DEAD_STATE as g,
  makeHot as _,
  makeCool as v,
  makeDevice as y,
  makeDb as b,
  makeZone as x,
  makeQueue as ee,
  makePanel as S,
  makeUser as te,
  makeDns as ne,
  makeWebServer as re,
  makeDatabase as ie,
  URL_TAG as ae,
  LINK_TEMPLATES as C,
  CACHED_DNS_LINK as oe,
  TIMING_PANEL as se,
} from '@/lib/simulator/scene-builders';

export const javaSpringMessagingLesson = {
  id: `java-spring-messaging`,
  title: `Spring Messaging & Event Architecture with Kafka`,
  summary: `Event-driven architecture in Spring: KafkaTemplate, @KafkaListener, consumer concurrency, commit acknowledgment modes, and Dead Letter Topics (DLT).`,
  minutes: 16,
  level: `advanced`,
  metrics: ['producer_throughput', 'consumer_ack_mode', 'retry_attempts', 'dlt_redirected', 'partition_lag'],
  legend: ['req', 'res', ['ping', 'event streaming'], 'fail'],
  goals: [
    { text: 'KafkaTemplate non-blocking async producing', step: 0 },
    { text: '@KafkaListener container thread model', step: 1 },
    { text: 'Consumer commit & AckMode strategies', step: 2 },
    { text: 'Dead Letter Topic (DLT) retry routing', step: 3 },
    { text: 'Idempotent consumer Redis deduplication', step: 4 },
  ],
  steps: [
    {
      short: `Producer`,
      chapter: `technique`,
      title: `KafkaTemplate & Non-blocking Producing`,
      body: [
        `<strong>KafkaTemplate</strong> provides high-level message sending capabilities over KafkaProducer.`,
        `Calling <code>kafkaTemplate.send(topic, key, payload)</code> returns a <code>CompletableFuture<SendResult></code>. It writes to local producer memory buffer and sends asynchronously via an I/O background thread.`,
      ],
      callout: { kind: `insight`, text: 'Always attach whenComplete() callbacks to handle broker ACKs without blocking the calling thread.' },
      metrics: { producer_throughput: '12,500 msg/sec', consumer_ack_mode: 'N/A', retry_attempts: '0', dlt_redirected: '0', partition_lag: '0' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'KafkaTemplate Non-Blocking Send', [
            '= CompletableFuture<SendResult<String, Order>> future =',
            '=   kafkaTemplate.send("orders-topic", order.getId(), order);',
            'future.whenComplete((result, ex) -> {',
            '= if (ex == null) {',
            '=   RecordMetadata meta = result.getRecordMetadata();',
            '=   logger.info("Sent to partition {} offset {}", meta.partition(), meta.offset());',
            '  } else { logger.error("Send failed", ex); }',
            '});',
          ]),
          app_svc: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['OrderPublisher'], sub: 'Calls kafkaTemplate.send()' }),
          kafka_template: d(0, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'workflow', label: ['KafkaTemplate'], sub: 'Async RecordBuffer' }),
          kafka_cluster: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'storage', label: ['Kafka Broker', 'P0..P2 Topic'], sub: 'orders-topic' }),
        },
        links: {
          ak: h('app_svc', 'kafka_template', ['app_svc', 'kafka_template'], { heads: 'end', label: 'send(key, payload)' }),
          kc: h('kafka_template', 'kafka_cluster', ['kafka_template', 'kafka_cluster'], { heads: 'end', label: 'async batch write' }),
        },
        flows: [
          { route: ['ak'], bounce: false, rate: 2.2 },
          { route: ['kc'], bounce: true, rate: 2.0 },
        ],
      },
    },
    {
      short: `Consumer`,
      chapter: `technique`,
      title: `@KafkaListener & ListenerContainer`,
      body: [
        `Annotating a method with <code>@KafkaListener(topics = "orders-topic")</code> registers a <strong>ConcurrentMessageListenerContainer</strong>.`,
        `Setting <code>concurrency = 3</code> spawns 3 consumer threads, matching the 3 partitions of the topic for parallel throughput without partition locks.`,
      ],
      callout: { kind: `insight`, text: 'One thread per partition within the same consumer group maximizes processing parallelism.' },
      metrics: { producer_throughput: 'Active', consumer_ack_mode: 'BATCH', retry_attempts: '0', dlt_redirected: '0', partition_lag: 'Low (4 msgs)' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, '@KafkaListener Container Thread', [
            '@Service',
            'public class OrderConsumer {',
            '= @KafkaListener(topics = "orders-topic", groupId = "order-svc")',
            '= public void handleOrder(@Payload Order order,',
            '=                         @Header(KafkaHeaders.RECEIVED_PARTITION) int part) {',
            '=   orderService.process(order);',
            '= }',
            '}',
          ]),
          broker_part: d(-11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'storage', label: ['orders-topic'], sub: 'Partitions 0, 1, 2' }),
          listener_ctn: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'workflow', label: ['Message', 'Listener'], sub: '3 Consumer Threads' }),
          biz_handler: d(11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'server', label: ['OrderProcessorBean'], sub: '@KafkaListener Method' }),
        },
        links: {
          bl: h('broker_part', 'listener_ctn', ['broker_part', 'listener_ctn'], { heads: 'end', label: 'poll() records' }),
          lb: h('listener_ctn', 'biz_handler', ['listener_ctn', 'biz_handler'], { heads: 'end', label: 'dispatch to handler' }),
        },
        flows: [
          { route: ['bl', 'lb'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Ack Modes`,
      chapter: `technique`,
      title: `Consumer Commit & AckMode Strategies`,
      body: [
        `Spring Kafka supports several <strong>ContainerProperties.AckMode</strong> options:`,
        `• <strong>RECORD:</strong> Commits offset after each record is processed.<br/>• <strong>BATCH (Default):</strong> Commits after all records returned by <code>poll()</code> are processed.<br/>• <strong>MANUAL_IMMEDIATE:</strong> The listener receives an <code>Acknowledgment</code> object and commits offset explicitly after DB transactions finish!`,
      ],
      callout: { kind: `insight`, text: 'MANUAL_IMMEDIATE prevents message loss by committing offsets only after all database side effects are durable.' },
      metrics: { producer_throughput: 'Active', consumer_ack_mode: 'MANUAL_IMMEDIATE', retry_attempts: '0', dlt_redirected: '0', partition_lag: '0' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Manual Offset Acknowledgment', [
            '@KafkaListener(topics = "orders-topic", groupId = "order-svc")',
            'public void listen(ConsumerRecord<String, Order> rec,',
            '=                  Acknowledgment ack) {',
            '  try {',
            '=   processOrder(rec.value());',
            '=   ack.acknowledge(); // Commits offset immediately',
            '  } catch (Exception ex) {',
            '!   // Do NOT acknowledge -> message will be redelivered',
            '  }',
            '}',
          ]),
          listener_thread: d(-11, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'workflow', label: ['Consumer Worker'], sub: 'Processes Message' }),
          db_write: d(0, -4, { s: 3.8, h: 50, color: 'green', glyph: 'storage', label: ['DB Tx Commit'], sub: 'Order Saved' }),
          ack_commit: d(11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'cpu', label: ['Ack', 'Commit'], sub: 'Offset Committed to Broker' }),
        },
        links: {
          ld: h('listener_thread', 'db_write', ['listener_thread', 'db_write'], { heads: 'end', label: 'persists state' }),
          da: h('db_write', 'ack_commit', ['db_write', 'ack_commit'], { heads: 'end', label: 'triggers offset commit' }),
        },
        flows: [
          { route: ['ld'], bounce: false, rate: 1.8 },
          { route: ['da'], bounce: false, rate: 1.8 },
        ],
      },
    },
    {
      short: `DLT Routing`,
      chapter: `technique`,
      title: `Error Handling & Dead Letter Topics (DLT)`,
      body: [
        `When consumer processing fails, <strong>DefaultErrorHandler</strong> with <code>FixedBackOff</code> or <code>ExponentialBackOff</code> retries processing.`,
        `If retries are exhausted (e.g. malformed JSON or poison pill), <strong>DeadLetterPublishingRecoverer</strong> forwards the poisoned record to <code>orders-topic.DLT</code> without blocking the consumer partition!`,
      ],
      callout: { kind: `warning`, text: 'Never allow poison pills to loop infinitely. A Dead Letter Topic isolates bad payloads for later replay.' },
      metrics: { producer_throughput: 'Active', consumer_ack_mode: 'MANUAL_IMMEDIATE', retry_attempts: '3 retries failed', dlt_redirected: '1 to orders.DLT', partition_lag: '0' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Dead Letter Publishing Recoverer', [
            '= @Bean public DefaultErrorHandler errorHandler(KafkaTemplate<?, ?> t) {',
            '=   var recoverer = new DeadLetterPublishingRecoverer(t,',
            '=     (rec, ex) -> new TopicPartition(rec.topic() + ".DLT", rec.partition()));',
            '=   // Retry 3 times with 1-second backoff before forwarding to DLT:',
            '=   return new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3L));',
            '= }',
          ]),
          poison_msg: d(-11, -4, { s: 3.8, h: 50, color: 'red', glyph: 'alert', label: ['Poison Message'], sub: 'Serialization Exception' }),
          error_handler: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'workflow', label: ['DefaultErrorHandler'], sub: 'Retries (3x) Exhausted' }),
          dlt_topic: d(11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'storage', label: ['orders-topic.DLT'], sub: 'Dead Letter Topic Queue' }),
        },
        links: {
          pe: h('poison_msg', 'error_handler', ['poison_msg', 'error_handler'], { heads: 'end', label: 'catches failure' }),
          ed: h('error_handler', 'dlt_topic', ['error_handler', 'dlt_topic'], { heads: 'end', label: 'recovers to DLT' }),
        },
        flows: [
          { route: ['pe'], bounce: false, rate: 1.5 },
          { route: ['ed'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Idempotency`,
      chapter: `technique`,
      title: `Idempotent Consumer Pattern`,
      body: [
        `Because Kafka guarantees <strong>At-Least-Once</strong> delivery by default, network timeouts during offset commits can redeliver duplicate messages.`,
        `The Idempotent Consumer checks incoming <code>message_id</code> against an idempotency table or Redis key: <code>INSERT INTO processed_events VALUES (id) ON CONFLICT DO NOTHING</code> before executing business logic.`,
      ],
      callout: { kind: `insight`, text: 'Pairing idempotent consumers with the Transactional Outbox pattern guarantees Exactly-Once Semantics (EOS) at the application level.' },
      metrics: { producer_throughput: 'Normal', consumer_ack_mode: 'MANUAL_IMMEDIATE', retry_attempts: '0', dlt_redirected: '0', partition_lag: '0' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Idempotent Consumer with Redis Key', [
            '@KafkaListener(topics = "orders-topic")',
            'public void consume(OrderEvent event) {',
            '= String lockKey = "event:processed:" + event.getEventId();',
            '= Boolean isFirstTime = redisTemplate.opsForValue()',
            '=   .setIfAbsent(lockKey, "1", Duration.ofDays(7));',
            '= if (Boolean.FALSE.equals(isFirstTime)) return; // Duplicate ignored!',
            '= processOrder(event);',
            '}',
          ]),
          dupe_event: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'server', label: ['Incoming Event'], sub: 'ID: evt_9941 (Dupe)' }),
          dedup_store: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'storage', label: ['Dedup Store', '(Redis/DB)'], sub: 'Checks evt_9941 exists' }),
          biz_skip: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'code', label: ['Order Logic'], sub: 'Duplicate Skipped Safely' }),
        },
        links: {
          dd: h('dupe_event', 'dedup_store', ['dupe_event', 'dedup_store'], { heads: 'end', label: 'check existence' }),
          db: h('dedup_store', 'biz_skip', ['dedup_store', 'biz_skip'], { heads: 'none', label: 'already processed' }),
        },
        flows: [
          { route: ['dd'], bounce: true, rate: 2.0 },
        ],
      },
    },
  ],
};
