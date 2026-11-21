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
          producer: d(-6, -2, { s: 2.6, h: 26, color: `teal`, glyph: `server`, label: [`Order API`, `Producer`] }),
          sqs: ee(0, 0, { label: [`Amazon SQS Queue`, `Standard Queue`] }),
          consumer: d(6, 2, { s: 2.6, h: 26, color: `orange`, glyph: `cpu`, label: [`Payment Worker`, `Consumer`] }),
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
          order_svc: d(-6, 0, { s: 2.5, h: 25, color: `teal`, glyph: `cart`, label: [`Order Service`] }),
          sns: d(-2, 0, { s: 3.0, h: 30, color: `rose`, glyph: `signpost`, label: [`SNS Topic: OrderPlaced`] }),
          q_bill: ee(4, -4, { label: [`Billing SQS`] }),
          q_ship: ee(4, 0, { label: [`Shipping SQS`] }),
          q_notif: ee(4, 4, { label: [`Email SQS`] }),
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
          client: te(-6, -2, { label: [`Mobile / Web User`] }),
          apigw: d(-2, -1, { s: 2.6, h: 26, color: `orange`, glyph: `route`, label: [`API Gateway`, `HTTP /api/v1`] }),
          lambda: d(2, 1, { s: 2.8, h: 28, color: `yellow`, glyph: `zap`, label: [`AWS Lambda`, `Stateless Function`] }),
          ddb: b(6, 3, { r: 2.0, h: 32, label: `Amazon DynamoDB`, color: `blue` }),
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
