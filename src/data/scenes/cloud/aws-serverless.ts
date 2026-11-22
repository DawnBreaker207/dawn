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

// ============================================================================
// AWS SAA-C03: DECOUPLED & SERVERLESS ARCHITECTURES
// ============================================================================
export const awsServerlessLesson = {
  id: `aws-serverless`,
  title: `AWS Decoupled & Serverless Architectures`,
  summary: `Asynchronous event-driven patterns: SQS standard vs FIFO, Dead Letter Queues (DLQ), SNS Fanout, EventBridge rules, and Lambda serverless microservices.`,
  minutes: 14,
  level: `intermediate`,
  metrics: [`queue_depth`, `fanout_topics`, `lambda_concurrency`, `dlq_messages`, `serverless_uptime`],
  legend: [`req`, `res`, [`ping`, `event publish`], `fail`],
  goals: [
    { text: `Decoupling with Amazon SQS: Standard (at-least-once) vs FIFO (exact order)`, step: 1 },
    { text: `Dead Letter Queue (DLQ) & Visibility Timeout mechanics`, step: 2 },
    { text: `Amazon SNS Fanout Pattern: 1 publish trigger to multiple consumer queues`, step: 3 },
    { text: `Amazon EventBridge Event Bus: Content-based routing & SaaS integration`, step: 4 },
    { text: `Full Serverless Web Stack: API Gateway + AWS Lambda + DynamoDB`, step: 5 },
  ],
  steps: [
    {
      short: `Amazon SQS`,
      chapter: `technique`,
      title: `Decoupling with Amazon SQS (Standard vs FIFO)`,
      body: [
        `Tightly coupled services fail together: if Service B is down or slow, Service A crashes or runs out of threads.`,
        `<strong>Amazon Simple Queue Service (SQS)</strong> buffers messages between producer and consumer:`,
        `• <strong>Standard Queue</strong>: Unlimited throughput, at-least-once delivery, best-effort ordering.`,
        `• <strong>FIFO Queue (First-In-First-Out)</strong>: Exactly-once processing, strictly preserved order, deduplication ID, up to 300 msg/s (3000 with batching).`,
      ],
      callout: {
        kind: `insight`,
        text: `Visibility Timeout prevents other workers from picking up the message while worker 1 is processing it (default 30 seconds). If worker 1 crashes, the message reappears for another worker.`,
      },
      changes: [
        `+ SQS Queue provisioned`,
        `+ Visibility timeout set to 60s`,
        `+ Message retention period: 4 days (up to 14 days)`,
      ],
      metrics: {
        queue_depth: `12 msgs`,
        fanout_topics: `—`,
        lambda_concurrency: `—`,
        dlq_messages: `0`,
        serverless_uptime: `100%`,
      },
      scene: {
        entities: {
          producer: d(-11, -4, { s: 3.8, h: 42, color: `teal`, glyph: `server`, label: [`Order API`, `Producer`] }),
          sqs: d(0, 0, { s: 3.8, h: 42, color: `purple`, glyph: `inbox`, label: [`Amazon SQS`, `Standard Queue`] }),
          consumer: d(11, 4, { s: 3.8, h: 42, color: `orange`, glyph: `cpu`, label: [`Payment Worker`, `Consumer`] }),
        },
        links: {
          send: h(`producer`, `sqs`, [`producer`, `sqs`], { heads: `end`, label: `SendMessage` }),
          poll: h(`sqs`, `consumer`, [`sqs`, `consumer`], { heads: `both`, label: `Long Polling (20s)` }),
        },
        flows: [
          { route: [`send`], bounce: false, rate: 2.0 },
          { route: [`poll`], bounce: true, rate: 1.5 },
        ],
      },
    },
    {
      short: `DLQ Mechanics`,
      chapter: `technique`,
      title: `Dead Letter Queue (DLQ) & Redrive Policies`,
      body: [
        `When a consumer fails to process a message (bug, unhandled exception, corrupted payload), the message returns to the queue after the Visibility Timeout.`,
        `Without a safeguard, poison messages create infinite retry loops. A <strong>Dead Letter Queue (DLQ)</strong> catches failed messages after <code>maxReceiveCount</code> (e.g. 3 attempts) for debugging and alerting.`,
      ],
      callout: {
        kind: `warn`,
        text: `Set CloudWatch Alarms on DLQ ApproximateNumberOfMessagesVisible > 0 to alert on-call engineers to poisonous payloads.`,
      },
      changes: [
        `+ Dead Letter Queue (DLQ) attached`,
        `+ Redrive Policy: maxReceiveCount = 3`,
        `+ SQS redrive to source feature enabled`,
      ],
      metrics: {
        queue_depth: `4 msgs`,
        fanout_topics: `—`,
        lambda_concurrency: `—`,
        dlq_messages: `1 Poison Msg`,
        serverless_uptime: `99.95%`,
      },
      scene: {
        entities: {
          queue: d(-10, -4, { s: 3.8, h: 44, color: `purple`, glyph: `inbox`, label: [`Primary SQS`], sub: `maxReceive: 3` }),
          worker: d(0, -4, { s: 3.8, h: 44, color: `rose`, glyph: `alertTriangle`, label: [`Worker`], sub: `Crash 3x` }),
          dlq: d(10, 4, { s: 3.8, h: 46, color: `red`, glyph: `skull`, label: [`Dead Letter SQS`], sub: `Poison Msg` }),
        },
        links: {
          qw: h(`queue`, `worker`, [`queue`, `worker`], { heads: `both`, label: `poll & crash` }),
          wd: h(`worker`, `dlq`, [`worker`, `dlq`], { heads: `end`, label: `redrive after 3x`, style: `dashed` }),
        },
        flows: [
          { route: [`qw`, `wd`], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: `SNS Fanout`,
      chapter: `technique`,
      title: `Amazon SNS Fanout Architecture`,
      body: [
        `When a customer places an order, multiple independent systems need to react: Billing, Warehouse Shipping, Email Notifications, and Analytics.`,
        `Using the <strong>SNS Fanout Pattern</strong>:`,
        `• The Order service publishes ONE message to an <strong>Amazon SNS Topic</strong>.`,
        `• SNS replicates the message to multiple subscribed SQS queues simultaneously.`,
        `• Each downstream service processes its own queue independently at its own pace without affecting the others.`,
      ],
      callout: {
        kind: `tip`,
        text: `SNS Message Filtering allows subscribers to receive only a subset of messages based on message attributes (e.g. only orders over $500).`,
      },
      changes: [
        `+ SNS Topic: OrderCreated`,
        `+ Subscribed Queue: Billing SQS`,
        `+ Subscribed Queue: Shipping SQS`,
        `+ Subscribed Queue: Notification SQS`,
      ],
      metrics: {
        queue_depth: `Balanced`,
        fanout_topics: `1 Topic → 3 Queues`,
        lambda_concurrency: `—`,
        dlq_messages: `0`,
        serverless_uptime: `100%`,
      },
      scene: {
        entities: {
          order_svc: d(-12, -4, { s: 3.6, h: 40, color: `teal`, glyph: `cart`, label: [`Order Service`] }),
          sns: d(-2, -4, { s: 3.8, h: 42, color: `rose`, glyph: `signpost`, label: [`SNS Topic`], sub: `OrderPlaced` }),
          q_bill: d(8, -12, { s: 3.4, h: 36, color: `purple`, glyph: `inbox`, label: [`Billing SQS`] }),
          q_ship: d(8, -4, { s: 3.4, h: 36, color: `purple`, glyph: `inbox`, label: [`Shipping SQS`] }),
          q_notif: d(8, 4, { s: 3.4, h: 36, color: `purple`, glyph: `inbox`, label: [`Email SQS`] }),
        },
        links: {
          pub: h(`order_svc`, `sns`, [`order_svc`, `sns`], { heads: `end`, label: `Publish` }),
          f1: h(`sns`, `q_bill`, [`sns`, `q_bill`], { heads: `end` }),
          f2: h(`sns`, `q_ship`, [`sns`, `q_ship`], { heads: `end` }),
          f3: h(`sns`, `q_notif`, [`sns`, `q_notif`], { heads: `end` }),
        },
        flows: [
          { route: [`pub`], bounce: false, rate: 2.0 },
          { route: [`f1`, `f2`, `f3`], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `EventBridge`,
      chapter: `technique`,
      title: `Amazon EventBridge: Content-Based Event Bus`,
      body: [
        `<strong>Amazon EventBridge</strong> provides a serverless event bus that ingests events from AWS services, custom apps, and third-party SaaS (Stripe, Datadog, Zendesk).`,
        `EventBridge evaluates declarative JSON event patterns to route events directly to over 20 AWS targets without writing custom dispatch code.`,
      ],
      callout: {
        kind: `insight`,
        text: `Schema Registry with schema discovery generates TypeScript and Java client bindings directly from incoming JSON events.`,
      },
      changes: [
        `+ Custom Event Bus provisioned`,
        `+ Rule: detail-type = "OrderCancelled"`,
        `+ Targets: Lambda refund handler + Step Functions saga`,
      ],
      metrics: {
        queue_depth: `Zero In-Transit`,
        fanout_topics: `Content-Filtered`,
        lambda_concurrency: `Dynamic`,
        dlq_messages: `0`,
        serverless_uptime: `99.999%`,
      },
      scene: {
        entities: {
          saas: y(-12, -4, { label: `Stripe Webhook`, tags: [{ text: 'Payment.Success', icon: 'zap' }] }),
          bus: d(-2, -4, { s: 3.8, h: 44, color: `purple`, glyph: `workflow`, label: [`EventBridge`], sub: `Event Bus` }),
          l_refund: d(9, -10, { s: 4.2, h: 48, color: `yellow`, glyph: `zap`, label: [`Lambda Target`], sub: `Refund Handler` }),
          step_fn: d(9, 2, { s: 4.2, h: 48, color: `blue`, glyph: `workflow`, label: [`Step Functions`], sub: `Order Saga` }),
        },
        links: {
          sb: h(`saas`, `bus`, [`saas`, `bus`], { heads: `end`, label: `putEvents` }),
          bl: h(`bus`, `l_refund`, [`bus`, `l_refund`], { heads: `end` }),
          bs: h(`bus`, `step_fn`, [`bus`, `step_fn`], { heads: `end` }),
        },
        flows: [
          { route: [`sb`, `bl`], bounce: false, rate: 1.4 },
          { route: [`sb`, `bs`], bounce: false, rate: 1.4 },
        ],
      },
    },
    {
      short: `Serverless Stack`,
      chapter: `deep`,
      title: `Serverless Microservices: API Gateway + Lambda + DynamoDB`,
      body: [
        `The standard serverless web pattern in SAA-C03 eliminates server management, patching, and idle capacity costs:`,
        `1. <strong>Amazon API Gateway</strong>: HTTP/REST entry point, handles rate limiting, API keys, CORS, and request validation.`,
        `2. <strong>AWS Lambda</strong>: Stateless functions executing code in response to events (scales from 0 to thousands of concurrent executions in ms).`,
        `3. <strong>Amazon DynamoDB</strong>: Single-digit millisecond storage with zero infrastructure management.`,
      ],
      callout: {
        kind: `insight`,
        text: `Cold starts in Lambda can be eliminated using Provisioned Concurrency for latency-critical customer-facing endpoints.`,
      },
      changes: [
        `+ HTTP API Gateway endpoint configured`,
        `+ Lambda function configured with 512MB RAM, Arm64 Graviton`,
        `+ DynamoDB table with On-Demand capacity`,
      ],
      metrics: {
        queue_depth: `—`,
        fanout_topics: `—`,
        lambda_concurrency: `45 active`,
        dlq_messages: `0`,
        serverless_uptime: `99.99%`,
      },
      scene: {
        entities: {
          client: y(-14, -4, { label: `Mobile / Web User`, tags: [{ text: `HTTPS`, icon: `globe` }] }),
          apigw: d(-4, -4, { s: 4.2, h: 48, color: `orange`, glyph: `route`, label: [`API Gateway`], sub: `HTTP /api/v1` }),
          lambda: d(5, -4, { s: 4.2, h: 48, color: `yellow`, glyph: `zap`, label: [`AWS Lambda`], sub: `Stateless Fn` }),
          ddb: b(14, -4, { r: 2.2, h: 36, label: `Amazon DynamoDB`, color: `blue` }),
        },
        links: {
          c_gw: h(`client`, `apigw`, [`client`, `apigw`], { heads: `both` }),
          gw_l: h(`apigw`, `lambda`, [`apigw`, `lambda`], { heads: `both` }),
          l_db: h(`lambda`, `ddb`, [`lambda`, `ddb`], { heads: `both` }),
        },
        flows: [
          { route: [`c_gw`, `gw_l`, `l_db`], bounce: true, rate: 2.5 },
        ],
      },
    },
  ],
};

export default awsServerlessLesson;
