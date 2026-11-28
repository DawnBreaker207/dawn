import { STAGE, codeCard, linkOf, makeDb, stageBlock, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// Seed → result. One serverless backend that grows a piece at a time. Every concept has its own
// id; at most two nodes join per step. SNS leaves when EventBridge replaces it (step 6).
//
//   step 1  api ─── fn                                    seed: API Gateway + Lambda
//   step 2  + table                                       DynamoDB: state outside the function
//   step 3  + queue                                       202 and queue the slow work (SQS)
//   step 4  queue gets a DLQ (state, no new node)         poison messages parked
//   step 5  + sns                                         one event, many subscribers
//   step 6  sns leaves, + eventbridge                     route by event content
//   step 7  + sfn                                         multi-step workflow, Lambda limits
//
//   sfn (left-top)        bus (top)          queue (top-right)
//   api ───────────────── fn ──────────────── table (right)

const api = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph: `route`, label: [`API`, `Gateway`], sub: `HTTPS + authz`, tags });
const handler = (tags: Tag[] = []) =>
  stageBlock(STAGE.main, { color: `green`, glyph: `zap`, label: [`Lambda`], sub: `handler`, tags });
const table = (tags: Tag[] = []) =>
  makeDb(STAGE.store.x, STAGE.store.y, { r: 2.2, h: 46, glyph: `database`, label: `DynamoDB`, tags });
const queue = (tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `orange`, glyph: `inbox`, label: [`SQS`, `queue`], sub: `Standard`, tags });
const sns = (tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph: `radio`, label: [`SNS`, `topic`], sub: `order-created`, tags });
const eventbridge = (tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph: `route`, label: [`Event`, `Bridge`], sub: `default bus`, tags });
const sfn = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller2, { color: `blue`, glyph: `workflow`, label: [`Step`, `Functions`], sub: `state machine`, tags });

const links = {
  handle: (label?: string) => linkOf(`api`, `fn`, label),
  store: (label?: string) => linkOf(`fn`, `table`, label),
  queueIo: (label?: string) => linkOf(`fn`, `queue`, label),
  snsPublish: (label?: string) => ({ ...linkOf(`fn`, `sns`, label, false), labelAt: 0.6 }),
  snsFan: (label?: string) => ({ ...linkOf(`sns`, `queue`, label, false), labelAt: 0.6 }),
  ebPut: (label?: string) => ({ ...linkOf(`fn`, `eventbridge`, label, false), labelAt: 0.6 }),
  ebRoute: (label?: string) => ({ ...linkOf(`eventbridge`, `queue`, label, false), labelAt: 0.6 }),
  ebStart: (label?: string) => ({ ...linkOf(`eventbridge`, `sfn`, label, false), labelAt: 0.6 }),
  sfnInvoke: (label?: string) => ({ ...linkOf(`sfn`, `fn`, label, false), labelAt: 0.6 }),
};

export const awsServerlessLesson: Lesson = {
  id: 'aws-serverless',
  title: 'AWS Decoupled & Serverless Architectures',
  summary:
    'Start with API Gateway and Lambda, then add DynamoDB, an SQS queue with a dead-letter queue, SNS fan-out, EventBridge routing and Step Functions — ending with a decoupled, event-driven backend.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['pattern', 'delivery', 'scaling', 'cost'],
  legend: [[`req`, `request`], [`msg`, `message / event`], [`fail`, `failure`]],
  goals: [
    { text: 'Assemble a serverless web stack', step: 2 },
    { text: 'Decouple a producer from a worker with SQS', step: 3 },
    { text: 'Park poison messages in a Dead Letter Queue', step: 4 },
    { text: 'Fan out one event with SNS', step: 5 },
    { text: 'Route events by content with EventBridge', step: 6 },
    { text: 'Orchestrate with Step Functions; manage Lambda concurrency', step: 7 },
  ],
  steps: [
    {
      short: 'API + Lambda',
      chapter: 'setup',
      title: 'Seed: an API that runs code per request',
      body: [
        `The smallest serverless backend: <b>API Gateway</b> receives HTTPS and authenticates the caller (Cognito or a Lambda authoriser), and <b>Lambda</b> runs your code once per request. Nothing to patch, nothing to pay for when idle.`,
        `Everything here is synchronous: the caller waits for the function. We will build out the rest of the backend around this pair, one piece per step.`,
      ],
      metrics: { pattern: 'request / response', delivery: 'sync HTTPS', scaling: 'auto', cost: 'per request' },
      scene: {
        entities: {
          api: api([{ text: `JWT checked`, tone: `violet`, icon: `lock` }]),
          fn: handler([{ text: `128–10,240 MB`, tone: `gray` }]),
          card: codeCard(`A function behind a route`, [`GET /orders/7  →  API Gateway  →  Lambda`, `exports.handler = async (e) => ({ statusCode: 200, body: e.pathParameters.id });`, `= pay per request, scale to zero`]),
        },
        links: { handle: links.handle() },
        flows: [{ route: ['handle'], rate: 1.6, bounce: true }],
      },
    },
    {
      short: 'DynamoDB',
      chapter: 'solution',
      title: 'State lives outside the function',
      body: [
        `Functions are stateless and short-lived, so the data goes into <span class="term">DynamoDB</span>: a managed key-value table with single-digit millisecond reads that scales with the traffic and bills per use.`,
        `API Gateway, Lambda and DynamoDB now form a complete backend — each part scales on its own. Keep functions small; state belongs in DynamoDB or S3.`,
      ],
      changes: [`+ DynamoDB`],
      metrics: { pattern: 'request / response', delivery: 'sync HTTPS', scaling: 'auto', cost: 'per request' },
      scene: {
        entities: {
          api: api([{ text: `JWT checked`, tone: `violet`, icon: `lock` }]),
          fn: handler(),
          table: table([{ text: `single-digit ms`, tone: `green` }]),
          card: codeCard(`A whole backend`, [`GET /orders/7  →  API Gateway  →  Lambda  →  GetItem`, `exports.handler = async (e) => ddb.get({ Key: { id: e.pathParameters.id } });`, `= no servers to patch, scale or pay for idle`]),
        },
        links: { handle: links.handle(), store: links.store() },
        flows: [{ route: ['handle', 'store'], rate: 1.6, bounce: true }],
      },
    },
    {
      short: 'SQS',
      chapter: 'problem',
      title: 'Slow work goes on a queue',
      body: [
        `If the function does slow work inline, a traffic spike or a slow dependency drags the API down with it. An <span class="term">SQS queue</span> absorbs the burst: the handler drops a message, returns <code>202</code> and moves on; Lambda pulls batches from the queue at its own pace.`,
        `<b>Standard</b> queues scale almost without limit but deliver at-least-once and unordered. <b>FIFO</b> queues keep order and de-duplicate, at lower throughput (300 msg/s per API action, more with batching).`,
      ],
      changes: [`+ SQS queue`],
      metrics: { pattern: 'queue', delivery: 'at-least-once', scaling: 'unlimited', cost: '$0.40 / M' },
      scene: {
        entities: {
          api: api(),
          fn: handler([{ text: `returns 202`, tone: `green` }]),
          table: table(),
          queue: queue([{ text: `depth 12,000`, tone: `amber`, icon: `gauge` }]),
          card: codeCard(`Send and receive`, [`$ aws sqs send-message --queue-url $Q --message-body '{"order":7}'`, `$ aws sqs receive-message --queue-url $Q --max-number-of-messages 10`, `= visibility timeout hides a message while a worker handles it`]),
        },
        links: { handle: links.handle(), store: links.store(), queueIo: links.queueIo() },
        flows: [{ route: ['handle'], rate: 1.6, bounce: true }, { route: ['queueIo'], kind: 'msg', rate: 2 }],
      },
    },
    {
      short: 'DLQ',
      chapter: 'problem',
      title: 'Poison messages go to a Dead Letter Queue',
      body: [
        `A message the worker can never process would be retried forever, blocking progress and burning money. SQS counts receives; after <code>maxReceiveCount</code> failures it moves the message to a <span class="term">Dead Letter Queue</span>.`,
        `Alarm on the DLQ depth, fix the bug, then <b>redrive</b> the messages back to the source queue. Set the DLQ retention longer than the source (messages keep their original timestamp).`,
      ],
      changes: [`~ queue: DLQ attached`, `~ fn: throws on 1 message`],
      metrics: { pattern: 'queue + DLQ', delivery: 'retry ×3', scaling: 'unlimited', cost: '$0.40 / M' },
      scene: {
        entities: {
          api: api(),
          fn: handler([{ text: `throws error`, tone: `red` }]),
          table: table(),
          queue: queue([{ text: `1 poison msg → DLQ`, tone: `red`, icon: `alert` }]),
          card: codeCard(`Redrive policy`, [`{ "deadLetterTargetArn": "arn:aws:sqs:…:orders-dlq",`, `  "maxReceiveCount": 3 }`, `$ aws sqs start-message-move-task --source-arn $DLQ_ARN`]),
        },
        links: { handle: links.handle(), store: links.store(), queueIo: links.queueIo() },
        flows: [{ route: ['queueIo'], kind: 'fail', rate: 1, bounce: true }],
      },
    },
    {
      short: 'SNS fan-out',
      chapter: 'technique',
      title: 'SNS: one event, many subscribers',
      body: [
        `When several systems need the same event, the handler shouldn’t know them all. It publishes once to an <span class="term">SNS topic</span>; SNS delivers a copy to every subscriber — SQS queues, Lambda functions, HTTP endpoints, email.`,
        `The classic <b>fan-out</b>: one topic, one SQS queue per consumer. Each consumer gets its own buffer and retry policy, and a slow one never delays the others. Subscription <em>filter policies</em> send each subscriber only what it needs.`,
      ],
      changes: [`+ SNS topic`, `~ queue: a subscriber`],
      metrics: { pattern: 'pub / sub', delivery: 'push, copy each', scaling: 'millions', cost: '$0.50 / M' },
      scene: {
        entities: {
          api: api(),
          fn: handler([{ text: `publishes once`, tone: `green` }]),
          table: table(),
          queue: queue([{ text: `billing · filtered`, tone: `violet` }]),
          sns: sns([{ text: `3 subscribers`, tone: `violet` }]),
          card: codeCard(`Subscribe a queue`, [`$ aws sns subscribe --topic-arn $T --protocol sqs --notification-endpoint $BILLING_Q`, `{ "FilterPolicy": { "region": ["eu"] } }`]),
        },
        links: { handle: links.handle(), store: links.store(), snsPublish: links.snsPublish(`Publish`), snsFan: links.snsFan(`copy`) },
        flows: [{ route: ['handle', 'store'], rate: 1.6, bounce: true }, { route: ['snsPublish'], kind: 'msg', rate: 1.4 }, { route: ['snsFan'], kind: 'msg', rate: 1 }],
      },
    },
    {
      short: 'EventBridge',
      chapter: 'technique',
      title: 'EventBridge: route by what the event says',
      body: [
        `<span class="term">EventBridge</span> is an event bus with content-based rules, and it takes SNS’s place here. Events from AWS services, your own apps and SaaS partners (Stripe, Zendesk) arrive on a bus; a <b>rule</b> matches fields of the JSON and sends the event to up to five targets.`,
        `Compared with SNS: richer matching (prefix, numeric, exists), a schema registry, archive and replay, and no need to build a topic per event type.`,
      ],
      changes: [`- SNS topic`, `+ EventBridge bus`, `~ queue: rule target`],
      metrics: { pattern: 'event bus', delivery: 'rules → targets', scaling: 'high', cost: '$1.00 / M' },
      scene: {
        entities: {
          api: api(),
          fn: handler([{ text: `PutEvents`, tone: `green` }]),
          table: table(),
          queue: queue([{ text: `target: billing`, tone: `violet` }]),
          eventbridge: eventbridge([{ text: `amount > 100`, tone: `violet` }]),
          card: codeCard(`Event pattern`, [`{ "source": ["aws.partner/stripe.com"],`, `  "detail-type": ["payment.succeeded"],`, `  "detail": { "amount": [{ "numeric": [">", 100] }] } }`]),
        },
        links: { handle: links.handle(), store: links.store(), ebPut: links.ebPut(`event`), ebRoute: links.ebRoute(`rule`) },
        flows: [{ route: ['handle', 'store'], rate: 1.6, bounce: true }, { route: ['ebPut'], kind: 'msg', rate: 1.4 }, { route: ['ebRoute'], kind: 'msg', rate: 1.2 }],
      },
    },
    {
      short: 'Step Fn',
      chapter: 'recap',
      title: 'Result: orchestrated, decoupled, limited',
      body: [
        `Long, multi-step workflows don’t belong inside one Lambda (15 min maximum). <span class="term">Step Functions</span> runs a state machine — tasks, choices, parallel branches, retries, waits — and records each step’s history. An EventBridge rule can start it.`,
        `Lambda scales by running more copies at once. The account default is <b>1,000 concurrent</b> executions per Region: use <b>reserved</b> concurrency to protect a function or cap it, and <b>provisioned</b> concurrency to keep instances warm and avoid cold starts.`,
      ],
      changes: [`+ Step Functions`, `~ fn: reserved concurrency`],
      metrics: { pattern: 'workflow', delivery: 'exactly-once', scaling: '1,000 conc.', cost: '$25 / M' },
      scene: {
        entities: {
          api: api(),
          fn: handler([{ text: `reserved 200`, tone: `green`, icon: `lock` }]),
          table: table([{ text: `order state`, tone: `green` }]),
          queue: queue([{ text: `target: billing`, tone: `violet` }]),
          eventbridge: eventbridge([{ text: `amount > 100`, tone: `violet` }]),
          sfn: sfn([{ text: `retry · catch`, tone: `violet` }]),
          card: codeCard(`Amazon States Language`, [`{ "StartAt": "Charge", "States": {`, `  "Charge": { "Type": "Task", "Resource": "arn:…:function:charge",`, `    "Retry": [{ "ErrorEquals": ["States.ALL"], "MaxAttempts": 3 }], "Next": "Ship" },`, `  "Ship":   { "Type": "Task", "Resource": "arn:…:function:ship", "End": true } } }`]),
        },
        links: { handle: links.handle(), store: links.store(), ebPut: links.ebPut(), ebRoute: links.ebRoute(), ebStart: links.ebStart(), sfnInvoke: links.sfnInvoke(`invokes`) },
        flows: [{ route: ['ebStart'], kind: 'msg', rate: 1.2 }, { route: ['sfnInvoke'], kind: 'msg', rate: 1.2 }, { route: ['store'], kind: 'write', rate: 1 }],
      },
    },
  ],
};
