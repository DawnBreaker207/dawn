// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const rabbitmqExchangesRoutingLesson = {
  id: 'rabbitmq-exchanges-routing',
  title: 'RabbitMQ Routing: Direct, Fanout & Topic Exchanges',
  summary: 'Master flexible message routing: Direct exact matching, Fanout broadcast, Topic wildcard pattern matching (* and #), and Exchange-to-Exchange topologies.',
  minutes: 13,
  level: 'intermediate',
  metrics: ['exchange_type', 'routing_pattern', 'fanout_factor', 'binding_count'],
  legend: ['req', 'res', ['ping', 'routed message'], 'fail'],
  goals: [
    { text: 'Compare 4 AMQP exchange types: Direct, Fanout, Topic, Headers', step: 1 },
    { text: 'Direct Exchange exact string matching', step: 2 },
    { text: 'Fanout Exchange high-speed broadcast publishing', step: 3 },
    { text: 'Topic Exchange wildcard matching with * and #', step: 4 },
    { text: 'Exchange-to-Exchange bindings for modular routing trees', step: 6 },
  ],
  steps: [
    {
      short: 'Exchange Types',
      chapter: 'setup',
      title: 'The 4 AMQP Exchange Routing Engines',
      body: [
        'RabbitMQ does not force one routing pattern. It provides 4 specialized Exchange types to solve different architectural communication needs:',
        '• <b>Direct:</b> Exact string match between routing key and binding key.<br>• <b>Fanout:</b> Broadcasts to all bound queues (ignores routing keys).<br>• <b>Topic:</b> Multi-criteria routing using wildcards (<code>*</code> and <code>#</code>).<br>• <b>Headers:</b> Routes on message header metadata (<code>x-match: all/any</code>).'
      ],
      callout: {
        kind: 'insight',
        text: 'Exchanges are stateless in-memory routing tables executed inside the Erlang process in microseconds.'
      },
      metrics: { exchange_type: '4 AMQP Types', routing_pattern: 'Direct/Fanout/Topic', fanout_factor: '1 to N', binding_count: 'Configurable' },
      scene: {
        entities: {
          producer: y(-10, -8, { form: 'phone', label: 'Event Publisher', tags: [{ text: 'Publish with RoutingKey', icon: 'zap' }] }),
          exchange: d(6, 8, { s: 4.8, h: 50, color: 'orange', glyph: 'route', label: ['AMQP Exchange', 'Routing Table'], sub: 'Inspects key & bindings' }),
          card: S({ x: -2, y: 14 }, 'Exchange Comparison Matrix', [
            'Direct:  routing_key == binding_key (e.g. "email.critical")',
            'Fanout:  Ignores key -> copies to ALL queues (Pub/Sub)',
            'Topic:   Pattern match: "orders.*.eu" or "logs.#"',
            'Headers: Compares message header dictionary values'
          ], { icon: 'listOrdered' })
        },
        links: {
          pe: h('producer', 'exchange', ['producer', 'exchange'], { heads: 'both', label: 'basic.publish' })
        },
        flows: [{ route: ['pe'], bounce: true, rate: 2.2 }]
      }
    },
    {
      short: 'Direct Exchange',
      chapter: 'technique',
      title: 'Direct Exchange: Exact String Matching',
      body: [
        'A <b>Direct Exchange</b> routes messages based on exact equality between the message’s <code>routing_key</code> and the queue’s <code>binding_key</code>.',
        'If an error occurs, the logger publishes with key <code>"error"</code>. Only queues bound with key <code>"error"</code> receive the message. Messages published with key <code>"info"</code> are routed to a separate analytics queue.'
      ],
      callout: {
        kind: 'tip',
        text: 'Multiple queues can bind with the same binding key to a Direct Exchange, turning it into a selective fanout.'
      },
      metrics: { exchange_type: 'Direct Exchange', routing_pattern: 'Exact Equality', fanout_factor: '1 to 1', binding_count: '2 Queues' },
      scene: {
        entities: {
          producer: y(-12, -4, { form: 'phone', label: 'Logger', tags: [{ text: 'key = "error"', tone: 'red', icon: 'alert' }] }),
          directEx: d(-2, -4, { s: 4.6, h: 52, color: 'orange', glyph: 'route', label: ['Direct Exchange', 'logs_direct'], sub: 'Exact Match' }),
          qError: d(8, -10, { s: 4.4, h: 52, color: 'rose', glyph: 'inbox', label: ['Queue: error_q', 'Binding: "error"'], sub: 'Receives ERROR logs' }),
          qInfo: d(8, 2, { s: 4.4, h: 52, color: 'blue', glyph: 'inbox', label: ['Queue: all_logs_q', 'Binding: "info"'], sub: 'Ignores ERROR logs' }),
          card: S({ x: -2, y: 14 }, 'Direct Routing Logic', [
            'Message published with routing_key = "error"',
            'Exchange checks bindings:',
            '- error_q has binding "error" -> MATCH! (Message delivered)',
            '- all_logs_q has binding "info" -> NO MATCH (Skipped)'
          ], { icon: 'check' })
        },
        links: {
          pe_direct: h('producer', 'directEx', ['producer', 'directEx'], { heads: 'end' }),
          eqE: h('directEx', 'qError', ['directEx', 'qError'], { heads: 'end', label: 'error' }),
          eqI: h('directEx', 'qInfo', ['directEx', 'qInfo'], { heads: 'end', label: 'info' })
        },
        flows: [
          { route: ['pe_direct', 'eqE'], bounce: false, rate: 2.8 }
        ]
      }
    },
    {
      short: 'Fanout Exchange',
      chapter: 'technique',
      title: 'Fanout Exchange: High-Speed Broadcast',
      body: [
        'A <b>Fanout Exchange</b> ignores the routing key completely. It simply duplicates and pushes every incoming message to <b>every single queue</b> bound to it.',
        'This is the fastest exchange type in RabbitMQ because it bypasses all string comparisons. It is ideal for pub/sub: sport score updates, live notifications, or cache invalidation events across multiple services.'
      ],
      callout: {
        kind: 'insight',
        text: 'Fanout exchanges execute at near wire speed: zero header parsing, zero regex checks.'
      },
      metrics: { exchange_type: 'Fanout Exchange', routing_pattern: 'Broadcast (Ignore Key)', fanout_factor: '1 to ALL', binding_count: 'All Bound Queues' },
      scene: {
        entities: {
          producer: y(-12, -4, { form: 'phone', label: 'Order App', tags: [{ text: 'OrderPlaced', icon: 'zap' }] }),
          fanoutEx: d(-2, -4, { s: 4.6, h: 52, color: 'orange', glyph: 'workflow', label: ['Fanout Exchange', 'events_fanout'], sub: 'Duplicates to ALL' }),
          qEmail: d(8, -12, { s: 4.2, h: 52, color: 'teal', glyph: 'inbox', label: ['Email Queue'], sub: 'Receives copy' }),
          qInven: d(8, -4, { s: 4.2, h: 52, color: 'purple', glyph: 'inbox', label: ['Inventory Queue'], sub: 'Receives copy' }),
          qAudit: d(8, 4, { s: 4.2, h: 52, color: 'green', glyph: 'inbox', label: ['Audit Queue'], sub: 'Receives copy' }),
          card: S({ x: -2, y: 16 }, 'Fanout Broadcast Mechanism', [
            'Producer sends: basic_publish(exchange="events_fanout", routing_key="")',
            'Fanout duplicates payload into:',
            '  -> Email Queue',
            '  -> Inventory Queue',
            '  -> Audit Queue',
            'Each microservice receives its own independent copy!'
          ], { icon: 'workflow' })
        },
        links: {
          pe_fanout: h('producer', 'fanoutEx', ['producer', 'fanoutEx'], { heads: 'end' }),
          fe1: h('fanoutEx', 'qEmail', ['fanoutEx', 'qEmail'], { heads: 'end' }),
          fe2: h('fanoutEx', 'qInven', ['fanoutEx', 'qInven'], { heads: 'end' }),
          fe3: h('fanoutEx', 'qAudit', ['fanoutEx', 'qAudit'], { heads: 'end' })
        },
        flows: [
          { route: ['pe_fanout', 'fe1'], bounce: false, rate: 2.0 },
          { route: ['pe_fanout', 'fe2'], bounce: false, rate: 2.0 },
          { route: ['pe_fanout', 'fe3'], bounce: false, rate: 2.0 }
        ]
      }
    },
    {
      short: 'Topic Exchange (* & #)',
      chapter: 'deep',
      title: 'Topic Exchange: Wildcard Pattern Matching (* & #)',
      body: [
        'A <b>Topic Exchange</b> routes messages based on dot-separated words in routing keys (e.g. <code>stock.us.nyse</code>), matching two powerful wildcards:',
        '• <code>* (star):</code> Replaces <b>exactly one word</b> (e.g. <code>*.us.*</code> matches <code>stock.us.nasdaq</code>).<br>• <code># (hash):</code> Replaces <b>zero or more words</b> (e.g. <code>stock.#</code> matches <code>stock.us</code>, <code>stock.eu.de.frankfurt</code>).'
      ],
      callout: {
        kind: 'tip',
        text: 'A topic binding of "#" receives all messages (behaving like a Fanout exchange).'
      },
      metrics: { exchange_type: 'Topic Exchange', routing_pattern: 'Wildcard * and #', fanout_factor: 'Dynamic Pattern', binding_count: 'Hierarchical' },
      scene: {
        entities: {
          producer: y(-12, -4, { form: 'phone', label: 'Payment Svc', tags: [{ text: 'key="payment.eu.visa"', icon: 'zap' }] }),
          topicEx: d(-2, -4, { s: 4.6, h: 52, color: 'orange', glyph: 'route', label: ['Topic Exchange', 'payments_topic'], sub: 'Trie Pattern Match' }),
          qEuAll: d(8, -10, { s: 4.4, h: 52, color: 'blue', glyph: 'inbox', label: ['Queue 1: EU All', 'Binding: "*.eu.*"'], sub: 'Matches payment.eu.visa' }),
          qPayAll: d(8, 2, { s: 4.4, h: 52, color: 'teal', glyph: 'inbox', label: ['Queue 2: Global Pay', 'Binding: "payment.#"'], sub: 'Matches payment.eu.visa' }),
          card: S({ x: -2, y: 14 }, 'Topic Wildcard Rules', [
            'Routing key: "payment.eu.visa" (3 words)',
            '- Binding "*.eu.*": MATCHES (word1=payment, word2=eu, word3=visa)',
            '- Binding "payment.#": MATCHES (starts with payment, rest wild)',
            '- Binding "auth.*": NO MATCH (word1 does not match)',
            'Result: Message copied to both Queue 1 and Queue 2!'
          ], { icon: 'listOrdered' })
        },
        links: {
          pe_topic: h('producer', 'topicEx', ['producer', 'topicEx'], { heads: 'end' }),
          eq1: h('topicEx', 'qEuAll', ['topicEx', 'qEuAll'], { heads: 'end', label: '*.eu.*' }),
          eq2: h('topicEx', 'qPayAll', ['topicEx', 'qPayAll'], { heads: 'end', label: 'payment.#' })
        },
        flows: [
          { route: ['pe_topic', 'eq1'], bounce: false, rate: 2.2 },
          { route: ['pe_topic', 'eq2'], bounce: false, rate: 2.2 }
        ]
      }
    },
    {
      short: 'Headers Exchange',
      chapter: 'deep',
      title: 'Headers Exchange: Metadata Routing (x-match)',
      body: [
        'A <b>Headers Exchange</b> ignores the routing key and routes based on key-value pairs inside the message headers table.',
        'Bindings specify an <code>x-match</code> rule:<br>• <code>x-match: all:</code> All specified header pairs must match.<br>• <code>x-match: any:</code> Matching at least one header pair routes the message. Ideal for routing complex metadata (e.g. format: PDF, priority: high).'
      ],
      callout: {
        kind: 'insight',
        text: 'Headers exchanges can route on integer or boolean values without string parsing.'
      },
      metrics: { exchange_type: 'Headers Exchange', routing_pattern: 'x-match: all / any', fanout_factor: 'Attribute Match', binding_count: 'Header Filtered' },
      scene: {
        entities: {
          producer: y(-10, -8, { form: 'phone', label: 'Report Generator', tags: [{ text: 'format: PDF, prio: 1', icon: 'zap' }] }),
          hdrEx: d(6, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'route', label: ['Headers Exchange', 'Header Matcher'], sub: 'x-match: all' }),
          card: S({ x: -2, y: 14 }, 'Headers Evaluation', [
            'Headers: { "format": "pdf", "priority": "high" }',
            'Binding on pdf_queue:',
            '  x-match: "all", format: "pdf", priority: "high"',
            'Matches both conditions -> Message routed to pdf_queue'
          ], { icon: 'check' })
        },
        links: {
          ph: h('producer', 'hdrEx', ['producer', 'hdrEx'], { heads: 'end', label: 'Headers Dict' })
        },
        flows: [{ route: ['ph'], bounce: false, rate: 2.0 }]
      }
    },
    {
      short: 'Default Exchange',
      chapter: 'technique',
      title: 'The Default Nameless Exchange',
      body: [
        'Every RabbitMQ broker pre-defines a default, nameless direct exchange (<code>""</code>).',
        'Every created queue is automatically bound to the default exchange with a <b>binding key equal to the queue’s name</b>. Publishing with <code>exchange=""</code> and <code>routing_key="orders_queue"</code> delivers directly to <code>orders_queue</code>, mimicking a traditional point-to-point queue.'
      ],
      callout: {
        kind: 'tip',
        text: 'The default exchange makes simple 1-to-1 work queues trivial without declaring custom exchanges.'
      },
      metrics: { exchange_type: 'Default (Nameless)', routing_pattern: 'routingKey == queueName', fanout_factor: '1 to 1', binding_count: 'Implicit Auto' },
      scene: {
        entities: {
          producer: y(-10, -8, { form: 'phone', label: 'Simple Producer', tags: [{ text: 'routingKey="task_queue"', icon: 'zap' }] }),
          defEx: d(6, 8, { s: 4.8, h: 50, color: 'orange', glyph: 'inbox', label: ['Default Exchange ""', 'Implicit Direct Router'], sub: 'Routes to queue: task_queue' }),
          card: S({ x: -2, y: 14 }, 'Default Exchange Routing', [
            'channel.basic_publish(',
            '  exchange="",',
            '  routing_key="task_queue",',
            '  body="Send Welcome Email"',
            ');',
            'Message automatically lands in queue named "task_queue"!'
          ], { icon: 'inbox' })
        },
        links: {
          pd: h('producer', 'defEx', ['producer', 'defEx'], { heads: 'end', label: 'Direct to Queue Name' })
        },
        flows: [{ route: ['pd'], bounce: false, rate: 2.4 }]
      }
    },
    {
      short: 'Exchange-to-Exchange',
      chapter: 'solution',
      title: 'Advanced Topology: Exchange-to-Exchange Bindings',
      body: [
        'In AMQP, you can bind an <b>Exchange to another Exchange</b> (E2E bindings) using <code>exchange_bind()</code>.',
        'This allows building modular routing trees: a top-level Fanout exchange broadcasts raw events into multiple specialized Topic exchanges, creating clean decoupled routing pipelines across dozens of internal microservices.'
      ],
      callout: {
        kind: 'insight',
        text: 'Exchange-to-Exchange bindings eliminate duplicate network hops between producers and routing layers.'
      },
      metrics: { exchange_type: 'E2E Chained Topology', routing_pattern: 'Hierarchical Tree', fanout_factor: 'Multi-Tier', binding_count: 'Modular' },
      scene: {
        entities: {
          producer: y(-12, -4, { form: 'phone', label: 'Core Gateway', tags: [{ text: 'Publish Raw Event', icon: 'zap' }] }),
          topEx: d(-2, -4, { s: 4.6, h: 52, color: 'orange', glyph: 'workflow', label: ['Top Fanout Exchange', 'events_root'], sub: 'Binds to sub-exchanges' }),
          topicSub1: d(8, -10, { s: 4.4, h: 52, color: 'purple', glyph: 'route', label: ['Sub Topic: orders', 'order.*'], sub: 'Routes to orders_q' }),
          topicSub2: d(8, 2, { s: 4.4, h: 52, color: 'purple', glyph: 'route', label: ['Sub Topic: audit', 'audit.*'], sub: 'Routes to audit_q' }),
          card: S({ x: -2, y: 14 }, 'Exchange-to-Exchange Hierarchy', [
            'exchange_bind(destination="orders_topic", source="events_root")',
            'exchange_bind(destination="audit_topic", source="events_root")',
            '1. Producer publishes once to events_root',
            '2. events_root pushes to orders_topic & audit_topic in RAM',
            '3. Sub-exchanges evaluate granular topic wildcards independently'
          ], { icon: 'workflow' })
        },
        links: {
          pe: h('producer', 'topEx', ['producer', 'topEx'], { heads: 'end' }),
          et1: h('topEx', 'topicSub1', ['topEx', 'topicSub1'], { heads: 'end', label: 'E2E Bind' }),
          et2: h('topEx', 'topicSub2', ['topEx', 'topicSub2'], { heads: 'end', label: 'E2E Bind' })
        },
        flows: [
          { route: ['pe', 'et1'], bounce: false, rate: 2.2 },
          { route: ['pe', 'et2'], bounce: false, rate: 2.2 }
        ]
      }
    }
  ]
};
