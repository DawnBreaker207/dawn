import { STAGE, codeCard, linkOf, stageBlock, distinctConcepts, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage: a publisher on the left, the exchange in the middle (same id, new type each act),
// and up to three queues on the right/top: q1 (lower right), q2 (upper right), q3 (upper left).
//
//             q3                 q2
//   publisher ──── exchange ───── q1

const publisher = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph: `send`, label: [`publisher`], sub, tags });
const exchange = (label: string[], sub: string, tags: Tag[] = [], glyph = `route`) =>
  stageBlock(STAGE.main, { color: `green`, glyph, label, sub, tags });
const queueBlock = (at: { x: number; y: number }, label: string[], sub: string, tags: Tag[] = []) =>
  stageBlock(at, { color: `purple`, glyph: `inbox`, label, sub, tags });
const q1 = (label: string[], sub: string, tags: Tag[] = []) => queueBlock(STAGE.store, label, sub, tags);
const q2 = (label: string[], sub: string, tags: Tag[] = []) => queueBlock(STAGE.alt, label, sub, tags);
const q3 = (label: string[], sub: string, tags: Tag[] = []) => queueBlock(STAGE.helper, label, sub, tags);

const links = {
  pub: (label?: string) => linkOf(`publisher`, `exchange`, label),
  to1: (label?: string) => linkOf(`exchange`, `q1`, label, false),
  to2: (label?: string) => linkOf(`exchange`, `q2`, label, false),
  to3: (label?: string) => linkOf(`exchange`, `q3`, label, false),
};

export const rabbitmqExchangesRoutingLesson: Lesson = distinctConcepts({
  id: 'rabbitmq-exchanges-routing',
  title: 'RabbitMQ Routing: Direct, Fanout & Topic Exchanges',
  summary:
    'How an exchange decides where a message goes: direct exact-match, fanout broadcast, topic wildcards (* and #), headers matching, exchange-to-exchange chains and the alternate exchange for unroutable messages.',
  minutes: 13,
  level: 'intermediate',
  metrics: ['exchange', 'match rule', 'queues hit', 'use for'],
  legend: [[`req`, `publish`], [`msg`, `delivered copy`], [`fail`, `unroutable`]],
  goals: [
    { text: 'Compare the four exchange types', step: 1 },
    { text: 'Route by exact key with a direct exchange', step: 2 },
    { text: 'Broadcast with a fanout exchange', step: 3 },
    { text: 'Match patterns with topic wildcards * and #', step: 4 },
    { text: 'Match on headers instead of a key', step: 5 },
    { text: 'Chain exchanges to build modular topologies', step: 6 },
    { text: 'Catch unroutable messages with an alternate exchange', step: 7 },
  ],
  steps: [
    {
      short: 'Types',
      chapter: 'setup',
      title: 'The exchange type is the routing rule',
      body: [
        `A message arrives at an exchange with a <b>routing key</b>. The exchange’s <em>type</em> decides how that key is compared with each queue’s <b>binding</b>: <code>direct</code> (exact match), <code>fanout</code> (ignore the key, send to all), <code>topic</code> (pattern match) and <code>headers</code> (match message headers).`,
        `Same producer, same queues — only the type changes who receives what. The next steps take each in turn.`,
      ],
      metrics: { exchange: '4 types', 'match rule': 'by type', 'queues hit': '0 … all', 'use for': 'routing' },
      scene: {
        entities: {
          publisher: publisher(`key: order.paid`, [{ text: `basic.publish`, tone: `green` }]),
          exchange: exchange([`Exchange`], `type decides`, [{ text: `direct · fanout · topic · headers`, tone: `violet` }]),
          q1: q1([`billing`], `queue`, [{ text: `bound`, tone: `gray` }]),
          q2: q2([`email`], `queue`, [{ text: `bound`, tone: `gray` }]),
          card: codeCard(`Declare by type`, [`ch.exchange_declare("orders", exchange_type="direct")`, `ch.exchange_declare("events", exchange_type="fanout")`, `ch.exchange_declare("logs",   exchange_type="topic")`, `ch.exchange_declare("jobs",   exchange_type="headers")`]),
        },
        links: { pub: links.pub(`order.paid`), to1: links.to1(), to2: links.to2() },
        flows: [{ route: ['pub'], kind: 'msg', rate: 1.4 }],
      },
    },
    {
      short: 'Direct',
      chapter: 'technique',
      title: 'Direct: the key must match exactly',
      body: [
        `A <span class="term">direct</span> exchange delivers a message to every queue whose binding key <b>equals</b> the routing key — nothing more, nothing less. Several queues may bind the same key, and one queue may have several bindings.`,
        `Ideal for work distribution by category: log level (<code>error</code> → alerting queue, <code>info</code> → archive), or one queue per task type. The default exchange (<code>""</code>) is a direct exchange bound to every queue by its own name.`,
      ],
      changes: [`~ exchange: direct`, `+ bindings by key`],
      metrics: { exchange: 'direct', 'match rule': 'exact key', 'queues hit': '1 of 2', 'use for': 'tasks' },
      scene: {
        entities: {
          publisher: publisher(`key: error`, [{ text: `log event`, tone: `red` }]),
          exchange: exchange([`Direct`], `logs.direct`, [{ text: `exact match`, tone: `violet` }]),
          q1: q1([`alerts`], `binding: error`, [{ text: `+1 message`, tone: `green` }]),
          q2: q2([`archive`], `binding: info`, [{ text: `no match`, tone: `gray` }]),
          card: codeCard(`Bind by key`, [`ch.queue_bind("alerts",  "logs.direct", routing_key="error")`, `ch.queue_bind("archive", "logs.direct", routing_key="info")`, `ch.basic_publish("logs.direct", "error", body)   # → alerts only`]),
        },
        links: { pub: links.pub(`error`), to1: links.to1(`error`), to2: links.to2() },
        flows: [{ route: ['pub'], kind: 'msg', rate: 1.4 }, { route: ['to1'], kind: 'msg', rate: 1.2 }],
      },
    },
    {
      short: 'Fanout',
      chapter: 'technique',
      title: 'Fanout: every queue gets a copy',
      body: [
        `A <span class="term">fanout</span> exchange ignores the routing key and copies the message to <b>every bound queue</b>. It is the fastest type — there is no matching to do — and the broadcast primitive of AMQP.`,
        `Use it when each subscriber must see every event: an <code>OrderPlaced</code> event consumed by billing, email and analytics, each with its own queue and its own pace. A new subscriber just binds a new queue.`,
      ],
      changes: [`~ exchange: fanout`, `+ third queue`],
      metrics: { exchange: 'fanout', 'match rule': 'none (all)', 'queues hit': '3 of 3', 'use for': 'broadcast events' },
      scene: {
        entities: {
          publisher: publisher(`OrderPlaced`, [{ text: `one publish`, tone: `green` }]),
          exchange: exchange([`Fanout`], `events`, [{ text: `key ignored`, tone: `violet` }]),
          q1: q1([`billing`], `own queue`, [{ text: `+1`, tone: `green` }]),
          q2: q2([`email`], `own queue`, [{ text: `+1`, tone: `green` }]),
          q3: q3([`analytics`], `own queue`, [{ text: `+1`, tone: `green` }]),
          card: codeCard(`Broadcast`, [`ch.exchange_declare("events", exchange_type="fanout")`, `for q in ("billing", "email", "analytics"): ch.queue_bind(q, "events")`, `ch.basic_publish("events", "", body)   # copy to all 3`]),
        },
        links: { pub: links.pub(`OrderPlaced`), to1: links.to1(`copy`), to2: links.to2(), to3: links.to3(`copy`) },
        flows: [{ route: ['pub'], kind: 'msg', rate: 1.4 }, { route: ['to1'], kind: 'msg', rate: 1 }, { route: ['to2'], kind: 'msg', rate: 1 }, { route: ['to3'], kind: 'msg', rate: 1 }],
      },
    },
    {
      short: 'Topic',
      chapter: 'technique',
      title: 'Topic: patterns with * and #',
      body: [
        `A <span class="term">topic</span> exchange routes by <b>dot-separated words</b> and binding patterns. <code>*</code> matches exactly <em>one</em> word; <code>#</code> matches <em>zero or more</em>. So <code>payment.*.visa</code> matches <code>payment.eu.visa</code>, and <code>payment.#</code> matches everything under <code>payment</code>.`,
        `Design keys from general to specific (<code>domain.region.method</code>) so consumers can subscribe at any level. It is the most flexible common type — and the most commonly used one in practice.`,
      ],
      changes: [`~ exchange: topic`, `+ wildcard bindings`],
      metrics: { exchange: 'topic', 'match rule': '* word · # many', 'queues hit': '2 of 3', 'use for': 'subscriptions' },
      scene: {
        entities: {
          publisher: publisher(`payment.eu.visa`, [{ text: `3-word key`, tone: `green` }]),
          exchange: exchange([`Topic`], `payments`, [{ text: `pattern match`, tone: `violet` }]),
          q1: q1([`eu-audit`], `payment.eu.*`, [{ text: `match ✓`, tone: `green` }]),
          q2: q2([`all-pay`], `payment.#`, [{ text: `match ✓`, tone: `green` }]),
          q3: q3([`us-only`], `payment.us.*`, [{ text: `no match`, tone: `gray` }]),
          card: codeCard(`Bindings`, [`ch.queue_bind("eu-audit", "payments", routing_key="payment.eu.*")`, `ch.queue_bind("all-pay",  "payments", routing_key="payment.#")`, `ch.queue_bind("us-only",  "payments", routing_key="payment.us.*")`]),
        },
        links: { pub: links.pub(`eu.visa`), to1: links.to1(`eu.*`), to2: links.to2(), to3: links.to3() },
        flows: [{ route: ['pub'], kind: 'msg', rate: 1.4 }, { route: ['to1'], kind: 'msg', rate: 1 }, { route: ['to2'], kind: 'msg', rate: 1 }],
      },
    },
    {
      short: 'Headers',
      chapter: 'technique',
      title: 'Headers: match on attributes, not the key',
      body: [
        `A <span class="term">headers</span> exchange ignores the routing key and compares the message’s <b>header table</b> with the binding’s arguments. <code>x-match: all</code> needs every pair to match; <code>x-match: any</code> needs one.`,
        `Use it when routing depends on several attributes that don’t fit in one dotted key (format, priority, tenant). It is slower than direct or topic, so reserve it for cases a topic key cannot express.`,
      ],
      changes: [`~ exchange: headers`, `+ header bindings`],
      metrics: { exchange: 'headers', 'match rule': 'x-match', 'queues hit': '1 of 2', 'use for': 'attributes' },
      scene: {
        entities: {
          publisher: publisher(`format=pdf · tier=gold`, [{ text: `headers set`, tone: `green` }]),
          exchange: exchange([`Headers`], `jobs`, [{ text: `key ignored`, tone: `violet` }]),
          q1: q1([`gold-pdf`], `all of: pdf+gold`, [{ text: `match ✓`, tone: `green` }]),
          q2: q2([`any-csv`], `any of: csv`, [{ text: `no match`, tone: `gray` }]),
          card: codeCard(`Bind on headers`, [`ch.queue_bind("gold-pdf", "jobs", arguments={"x-match": "all", "format": "pdf", "tier": "gold"})`, `ch.queue_bind("any-csv",  "jobs", arguments={"x-match": "any", "format": "csv"})`, `ch.basic_publish("jobs", "", body, properties=pika.BasicProperties(headers={"format": "pdf", "tier": "gold"}))`]),
        },
        links: { pub: links.pub(`headers`), to1: links.to1(`all match`), to2: links.to2() },
        flows: [{ route: ['pub'], kind: 'msg', rate: 1.4 }, { route: ['to1'], kind: 'msg', rate: 1.2 }],
      },
    },
    {
      short: 'Chaining',
      chapter: 'solution',
      title: 'Exchange-to-exchange bindings',
      body: [
        `An exchange can be bound to <em>another exchange</em> as if it were a queue. Messages published to the first are routed on by the second’s bindings. This builds <b>layers</b>: a coarse fanout or topic at the edge, finer direct exchanges per team behind it.`,
        `Benefits: teams own their own exchange and bindings; you can add or remove a whole subtree with one binding; the topology stays readable. Avoid cycles — RabbitMQ delivers each message to a given queue only once.`,
      ],
      changes: [`+ second exchange`, `~ edge exchange → team exchange`],
      metrics: { exchange: 'topic → direct', 'match rule': 'layered', 'queues hit': '2', 'use for': 'modular' },
      scene: {
        entities: {
          publisher: publisher(`order.paid`),
          exchange: exchange([`Edge`, `exchange`], `topic · public API`, [{ text: `binds → billing.ex`, tone: `violet` }]),
          q1: q1([`billing.ex`], `team exchange`, [{ text: `direct`, tone: `green` }]),
          q2: q2([`audit`], `queue`, [{ text: `order.#`, tone: `gray` }]),
          q3: q3([`billing`], `queue`, [{ text: `via billing.ex`, tone: `green` }]),
          card: codeCard(`Chain them`, [`ch.exchange_bind(destination="billing.ex", source="orders", routing_key="order.paid")`, `ch.queue_bind("billing", "billing.ex", routing_key="order.paid")`, `= publish to "orders"; billing.ex routes it on to the billing queue`]),
        },
        links: { pub: links.pub(`order.paid`), to1: links.to1(`bound`), to2: links.to2(), to3: links.to3(`via .ex`) },
        flows: [{ route: ['pub'], kind: 'msg', rate: 1.4 }, { route: ['to1'], kind: 'msg', rate: 1.2 }],
      },
    },
    {
      short: 'Unroutable',
      chapter: 'recap',
      title: 'Unroutable messages: don’t drop them silently',
      body: [
        `If no binding matches, the exchange drops the message by default. Two protections: publish with <code>mandatory=True</code> so the broker <b>returns</b> it to the publisher, and declare an <b>alternate exchange</b> (<code>alternate-exchange</code> argument) that receives everything the main exchange cannot route.`,
        `Bind a queue to the alternate exchange, alert on it, and you have a safety net for typos and missing bindings. Together with confirms and dead-lettering it closes the last silent-loss hole.`,
      ],
      changes: [`+ alternate exchange`, `+ unroutable queue`, `~ message routed to safety`],
      metrics: { exchange: 'alternate', 'match rule': 'no match', 'queues hit': '1', 'use for': 'safety net' },
      scene: {
        entities: {
          publisher: publisher(`key: ordr.paid (typo)`, [{ text: `no binding`, tone: `red`, icon: `alert` }]),
          exchange: exchange([`Topic`], `orders`, [{ text: `alternate-exchange`, tone: `violet` }]),
          q1: q1([`billing`], `order.paid`, [{ text: `not reached`, tone: `gray` }]),
          q2: q2([`unroutable`], `via alternate`, [{ text: `caught`, tone: `green`, icon: `shield` }]),
          card: codeCard(`A safety net`, [`ch.exchange_declare("orders", "topic", arguments={"alternate-exchange": "orders.unrouted"})`, `ch.queue_bind("unroutable", "orders.unrouted")`, `ch.basic_publish("orders", "ordr.paid", body, mandatory=True)   # typo → caught`]),
        },
        links: { pub: links.pub(`ordr.paid`), to1: links.to1(), to2: links.to2() },
        flows: [{ route: ['pub'], kind: 'msg', rate: 1.4 }, { route: ['to2'], kind: 'msg', rate: 1.2 }],
      },
    },
  ],
});
