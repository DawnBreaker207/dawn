/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaSpringAsyncEventsLesson: Lesson = {
  id: 'java-spring-async-events',
  title: '@Async, Cache & TX Events',
  summary:
    'Understand WHY @Async drops SecurityContext/MDC, why @Cacheable fails on self-calls & cache stampedes, and why publishing Kafka/Email inside @Transactional sends phantom events on rollback.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['async_exec', 'context_prop', 'cache_guard', 'event_phase'],
  legend: ['flow', ['req', 'dispatch / check'], ['res', 'copied / commit'], ['fail', 'lost ctx / phantom']],
  goals: [
    { text: 'Replace default SimpleAsyncTaskExecutor in @Async', step: 1 },
    { text: 'Propagate MDC & SecurityContext via TaskDecorator', step: 2 },
    { text: 'Protect @Cacheable from stampedes with sync=true', step: 3 },
    { text: 'Diagnose phantom events published before DB COMMIT', step: 4 },
    { text: 'Defer side effects via @TransactionalEventListener', step: 5 },
    { text: 'Bridge crash-safe delivery with Transactional Outbox', step: 6 },
  ],
  steps: [
    {
      short: '@Async Pool',
      chapter: 'async',
      title: '1. Why @Async Without an Executor Bean Is Dangerous',
      body: [
        'Adding <code>@EnableAsync</code> without configuring a <code>ThreadPoolTaskExecutor</code> bean falls back to <code>SimpleAsyncTaskExecutor</code> — which spawns a <strong>brand-new OS thread per call</strong> with no queue or cap!',
        'Also, <code>@Async</code> uses Spring AOP Proxy: calling <code>this.sendEmailAsync()</code> from the same bean runs synchronously on the caller thread!',
      ],
      callout: {
        kind: 'warn',
        text: 'Always define a bounded ThreadPoolTaskExecutor (or VirtualThread executor) bean and return CompletableFuture / void from @Async.',
      },
      metrics: { async_exec: 'Bounded Pool', context_prop: 'Not copied!', cache_guard: 'N/A', event_phase: 'Immediate' },
      scene: {
        entities: {
          bad: d(-14, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['SimpleAsync'], sub: 'unbounded OS!' }),
          good: d(0, -14, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['TaskExecutor'], sub: 'bounded pool' }),
          px: d(0, 0, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['@Async Proxy'], sub: 'no self-call' }),
          card: S({ x: -12, y: 12 }, '1. Configuring a Safe Bounded @Async Pool', [
            '@Bean Executor taskExecutor() {',
            '  var ex = new ThreadPoolTaskExecutor();',
            '  ex.setCorePoolSize(8); ex.setMaxPoolSize(16);',
            '  ex.setQueueCapacity(200); return ex;',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          bd_gd: h('bad', 'good', ['bad', 'good'], { heads: 'end', label: 'replace' }),
          gd_px: h('good', 'px', ['good', 'px'], { heads: 'end', label: 'runs @Async' }),
        },
        flows: [{ route: ['bd_gd', 'gd_px'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'TaskDecorator',
      chapter: 'async',
      title: '2. Why @Async Loses MDC traceId & SecurityContext',
      body: [
        '<code>MDC</code> (log traceId) and <code>SecurityContextHolder</code> store data in <code>ThreadLocal</code> on the HTTP thread.',
        'When <code>@Async</code> hands work to a worker thread, those <code>ThreadLocal</code>s are <code>null</code>! Implement <code>TaskDecorator</code> to capture them on the HTTP thread and restore/clear them in <code>finally</code> on the worker.',
      ],
      callout: {
        kind: 'tip',
        text: 'TaskDecorator is the cleanest single hook to propagate MDC, SecurityContext, and TenantContext across all @Async tasks.',
      },
      changes: ['+ Captures ThreadLocals on HTTP thread', '+ Restores & clears in worker finally'],
      metrics: { async_exec: 'Bounded Pool', context_prop: 'TaskDecorator', cache_guard: 'N/A', event_phase: 'Trace intact' },
      scene: {
        entities: {
          http: d(-14, 0, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['HTTP Thread'], sub: 'MDC + SecCtx' }),
          dec: d(-14, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['TaskDecorator'], sub: 'copy -> clear' }),
          wrk: d(0, -14, { s: 4.8, h: 54, color: 'green', glyph: 'cpu', label: ['Worker Thread'], sub: 'traceId intact' }),
          card: S({ x: -12, y: 12 }, '2. Copying ThreadLocals via TaskDecorator', [
            'ex.setTaskDecorator(runnable -> {',
            '  var mdc = MDC.getCopyOfContextMap();',
            '  var sec = SecurityContextHolder.getContext();',
            '  return () -> { try { set(mdc, sec); runnable.run(); }',
            '                 finally { MDC.clear(); clearSec(); } };',
            '});',
          ], { icon: 'terminal' }),
        },
        links: {
          ht_dc: h('http', 'dec', ['http', 'dec'], { heads: 'end', label: 'capture' }),
          dc_wk: h('dec', 'wrk', ['dec', 'wrk'], { heads: 'end', label: 'restore' }),
        },
        flows: [{ route: ['ht_dc', 'dc_wk'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: '@Cacheable',
      chapter: 'cache',
      title: '3. @Cacheable Stampede Protection (sync = true)',
      body: [
        'When a hot Redis cache key expires, 1,000 concurrent threads miss the cache and hammer Postgres simultaneously (<strong>Cache Stampede / Thundering Herd</strong>).',
        'Setting <code>@Cacheable(value = "products", key = "#id", sync = true)</code> lets ONLY 1 thread per key query the DB while the other 999 wait for the populated value!',
      ],
      callout: {
        kind: 'insight',
        text: 'Like @Transactional, @Cacheable uses AOP Proxy (no self-calls!) and requires Redis-serializable DTOs (not JPA Entities!).',
      },
      changes: ['+ sync=true locks per-key on cache miss', '+ Prevents DB thundering herd'],
      metrics: { async_exec: 'Bounded Pool', context_prop: 'TaskDecorator', cache_guard: 'sync=true', event_phase: '1 DB query' },
      scene: {
        entities: {
          reqs: d(-14, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['1000 Misses'], sub: 'same key #42' }),
          sync: d(0, -14, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['@Cacheable'], sub: 'sync = true' }),
          db: b(0, 0, { r: 2.2, h: 48, color: 'blue', label: ['Postgres DB'], sub: '1 query only!' }),
          card: S({ x: -12, y: 12 }, '3. Preventing Cache Stampedes in Spring', [
            '@Cacheable(cacheNames = "catalog", key = "#id", sync = true)',
            'public ProductDto findById(Long id) {',
            '  return repo.findDto(id); // 1 thread runs, 999 share!',
            '} // Note: return DTO, never a LAZY JPA @Entity!',
          ], { icon: 'terminal' }),
        },
        links: {
          rq_sy: h('reqs', 'sync', ['reqs', 'sync'], { heads: 'end', label: 'coalesce' }),
          sy_db: h('sync', 'db', ['sync', 'db'], { heads: 'end', label: '1 loader' }),
        },
        flows: [{ route: ['rq_sy', 'sy_db'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'Phantom Event',
      chapter: 'events',
      title: '4. Why Sending Kafka/Email Inside @Transactional Breaks',
      body: [
        'Suppose <code>placeOrder()</code> saves to Postgres, calls <code>kafkaTemplate.send(...)</code>, and then throws an exception on the next line.',
        'Postgres <strong>rolls back</strong> the Order, but Kafka/Email ALREADY went out — downstream consumers receive a <strong>phantom event</strong> for an order that does not exist!',
      ],
      callout: {
        kind: 'warn',
        text: 'Never fire irreversible external side effects (Kafka, Email, Webhook) synchronously before the DB transaction commits!',
      },
      changes: ['+ Kafka sent before DB COMMIT', '+ DB rolls back -> phantom event!'],
      metrics: { async_exec: 'Sync emit', context_prop: 'In TX', cache_guard: 'N/A', event_phase: 'Phantom bug!' },
      scene: {
        entities: {
          tx: d(-12, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['@Transactional'], sub: 'rolls back' }),
          kfk: d(2, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Kafka Sent!'], sub: 'phantom event' }),
          db: b(2, -2, { r: 2.2, h: 48, color: 'red', label: ['DB Rollback'], sub: 'order deleted!' }),
          card: S({ x: -12, y: 12 }, '4. The Phantom Event Race Condition', [
            '@Transactional public void placeOrder(Req r) {',
            '  orderRepo.save(order);',
            '  kafka.send("orders", ev); // SENT IMMEDIATELY!',
            '  throw new RuntimeException(); // DB rolls back, Kafka did NOT!',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          tx_kf: h('tx', 'kfk', ['tx', 'kfk'], { heads: 'end', label: 'early!' }),
          tx_db: h('tx', 'db', ['tx', 'db'], { heads: 'end', label: 'rollback!' }),
        },
        flows: [{ route: ['tx_kf'], kind: 'fail', rate: 1.8 }, { route: ['tx_db'], kind: 'fail', rate: 1.5 }],
      },
    },
    {
      short: 'AFTER_COMMIT',
      chapter: 'events',
      title: '5. Fixing with @TransactionalEventListener(AFTER_COMMIT)',
      body: [
        'Instead of calling Kafka directly, publish an in-memory Spring event via <code>ApplicationEventPublisher.publishEvent(ev)</code>.',
        'Annotate the listener with <code>@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)</code>: Spring holds the event and fires it ONLY if Postgres actually commits!',
      ],
      callout: {
        kind: 'tip',
        text: 'If the listener performs JPA writes of its own, add @Transactional(propagation = REQUIRES_NEW) because the original TX has already committed!',
      },
      changes: ['+ publishEvent() queues until TX ends', '+ AFTER_COMMIT fires only on DB commit'],
      metrics: { async_exec: '@Async + Event', context_prop: 'TaskDecorator', cache_guard: 'N/A', event_phase: 'AFTER_COMMIT' },
      scene: {
        entities: {
          pub: d(-14, 0, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['EventPublisher'], sub: 'publishEvent()' }),
          cmt: b(-14, -14, { r: 2.2, h: 48, color: 'green', label: ['DB COMMIT'], sub: 'TX succeeded' }),
          lst: d(0, -14, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['EventListener'], sub: 'AFTER_COMMIT' }),
          card: S({ x: -12, y: 12 }, '5. Commit-Synchronized Domain Events', [
            '// In @Transactional service:',
            'publisher.publishEvent(new OrderPlacedEvent(order.getId()));',
            '// Listener runs ONLY if DB COMMIT succeeded:',
            '@TransactionalEventListener(phase = AFTER_COMMIT)',
            'void onOrderPlaced(OrderPlacedEvent ev) { kafka.send(...); }',
          ], { icon: 'terminal' }),
        },
        links: {
          pb_cm: h('pub', 'cmt', ['pub', 'cmt'], { heads: 'end', label: 'wait commit' }),
          cm_ls: h('cmt', 'lst', ['cmt', 'lst'], { heads: 'end', label: 'fire event' }),
        },
        flows: [{ route: ['pb_cm', 'cm_ls'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'Outbox',
      chapter: 'events',
      title: '6. Crash-Safe Delivery: Transactional Outbox Pattern',
      body: [
        '<code>AFTER_COMMIT</code> prevents phantom events on rollback, but what if the JVM crashes 1ms AFTER Postgres commits and BEFORE <code>kafka.send()</code> finishes?',
        'For mission-critical events, write the event to an <code>outbox</code> table inside the <strong>exact same DB transaction</strong>, then relay asynchronously via Debezium CDC or a poller!',
      ],
      callout: {
        kind: 'insight',
        text: 'Spring Modulith (@ApplicationModuleListener) implements this Outbox + @TransactionalEventListener pattern out of the box.',
      },
      changes: ['+ Order + Outbox row saved atomically', '+ Relay guarantees at-least-once Kafka'],
      metrics: { async_exec: 'Outbox Relay', context_prop: 'Atomic DB', cache_guard: 'N/A', event_phase: 'Crash-safe' },
      scene: {
        entities: {
          tx: d(-14, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['1 Atomic TX'], sub: 'Order + Outbox' }),
          db: b(0, -14, { r: 2.2, h: 48, color: 'green', label: ['Outbox Table'], sub: 'committed' }),
          mq: d(0, 0, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Kafka Relay'], sub: 'at-least-once' }),
          card: S({ x: -12, y: 12 }, '6. Atomic DB + Outbox Guarantees Delivery', [
            '@Transactional public void placeOrder(Req r) {',
            '  orderRepo.save(order);',
            '  outboxRepo.save(OutboxEvent.of(order)); // same TX!',
            '} // Relay / CDC publishes to Kafka even after crash!',
          ], { icon: 'terminal' }),
        },
        links: {
          tx_db: h('tx', 'db', ['tx', 'db'], { heads: 'end', label: '1 commit' }),
          db_mq: h('db', 'mq', ['db', 'mq'], { heads: 'end', label: 'CDC relay' }),
        },
        flows: [{ route: ['tx_db', 'db_mq'], kind: 'res', rate: 1.9 }],
      },
    },
  ],
};
