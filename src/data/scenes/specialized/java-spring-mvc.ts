import { makeBlock, makeDb, makeDevice, makeLink, makePanel } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage: a single POST /api/orders travels a fixed pipeline —
// client → Tomcat → servlet filters → DispatcherServlet → controller — and the
// same pipeline is then reused to compare Loom and WebFlux.
//
//   client ── Tomcat ── Filters
//                          │
//      Postgres ── Controller ── DispatcherServlet ── Advice / Kafka

type Tag = { text: string; tone?: string; icon?: string };

const client = (tags: Tag[] = []) => makeDevice(-14.5, -10, { label: `client`, tags });
const tomcat = (tags: Tag[] = []) =>
  makeBlock(-13, 3, { s: 4.4, h: 50, color: `blue`, glyph: `server`, label: [`Tomcat`], sub: `worker thread`, tags });
const filters = (tags: Tag[] = []) =>
  makeBlock(-8.5, 14.5, { s: 4.4, h: 50, color: `orange`, glyph: `filter`, label: [`Servlet`, `filters`], tags });
const disp = (tags: Tag[] = []) =>
  makeBlock(9.5, 5, { s: 5.2, h: 56, color: `orange`, glyph: `route`, label: [`Dispatcher`, `Servlet`], tags });
const ctrl = (tags: Tag[] = []) =>
  makeBlock(9.5, -10.5, { s: 4.4, h: 50, color: `green`, glyph: `code`, label: [`Order`, `Controller`], tags });
const advice = (tags: Tag[] = []) =>
  makeBlock(12, 17.5, { s: 4.4, h: 50, color: `orange`, glyph: `alertTriangle`, label: [`Controller`, `Advice`], tags });
const stream = (tags: Tag[] = []) =>
  makeBlock(12, 17.5, { s: 4.4, h: 50, color: `yellow`, glyph: `waves`, label: [`Kafka`], sub: `price ticks`, tags });
const db = (tags: Tag[] = []) => makeDb(4, -22, { r: 2.2, h: 46, glyph: `database`, label: `Postgres`, tags });

const L = {
  http: makeLink(`client`, `tomcat`, [`client`, `tomcat`], { heads: `both`, label: `POST` }),
  httpQuiet: makeLink(`client`, `tomcat`, [`client`, `tomcat`], { heads: `both` }),
  chain: makeLink(`tomcat`, `filters`, [`tomcat`, `filters`], { heads: `both`, label: `doFilter` }),
  chainQuiet: makeLink(`tomcat`, `filters`, [`tomcat`, `filters`], { heads: `both` }),
  service: makeLink(`filters`, `disp`, [`filters`, `disp`], { heads: `both`, label: `service()` }),
  serviceQuiet: makeLink(`filters`, `disp`, [`filters`, `disp`], { heads: `both` }),
  invoke: makeLink(`disp`, `ctrl`, [`disp`, `ctrl`], { heads: `both`, label: `invoke` }),
  invokeQuiet: makeLink(`disp`, `ctrl`, [`disp`, `ctrl`], { heads: `both` }),
  handle: makeLink(`disp`, `advice`, [`disp`, `advice`], { heads: `both`, label: `exception` }),
  jdbc: makeLink(`ctrl`, `db`, [`ctrl`, `db`], { heads: `both`, label: `JDBC` }),
  pull: makeLink(`stream`, `disp`, [`stream`, `disp`], { label: `request(64)` }),
};

const card = (title: string, lines: string[]) =>
  makePanel({ x: 9.5, y: 5, z: 0, dx: -60, dy: -300 }, title, lines, { icon: `code` });

const pipeline = (t: { tomcat?: Tag[]; filters?: Tag[]; disp?: Tag[]; ctrl?: Tag[] } = {}) => ({
  client: client(),
  tomcat: tomcat(t.tomcat),
  filters: filters(t.filters),
  disp: disp(t.disp),
  ctrl: ctrl(t.ctrl),
});
const quiet = { http: L.httpQuiet, chain: L.chainQuiet, service: L.serviceQuiet, invoke: L.invokeQuiet };

export const javaSpringMvcLesson: Lesson = {
  id: 'java-spring-mvc',
  title: 'Spring MVC, Loom & WebFlux',
  summary:
    'Follow one POST /api/orders through Tomcat, servlet filters, DispatcherServlet, argument binding and error handling — then compare MVC on virtual threads with WebFlux.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['stage', 'thread', 'status', 'checks'],
  legend: [['req', 'HTTP request'], ['res', 'response / JSON'], ['write', 'JDBC'], ['fail', '400 / stall']],
  goals: [
    { text: 'Accept HTTP connection in Embedded Tomcat', step: 1 },
    { text: 'Pass through Servlet Filter chain (outside MVC)', step: 2 },
    { text: 'Route via DispatcherServlet & HandlerMapping', step: 3 },
    { text: 'Run HandlerInterceptor.preHandle() auth/trace', step: 4 },
    { text: 'Bind JSON & @Valid via ArgumentResolver', step: 5 },
    { text: 'Serialize DTO or handle errors via @RestControllerAdvice', step: 6 },
    { text: 'Compare MVC + Loom (RestClient) vs WebFlux Loop Stall', step: 7 },
    { text: 'Control stream overload via Reactor Backpressure', step: 8 },
  ],
  steps: [
    {
      short: 'Tomcat',
      chapter: 'setup',
      title: 'Embedded Tomcat accepts the request',
      body: [
        '<code>POST /api/orders</code> arrives at Tomcat’s NIO connector and is handed to a worker thread (or a virtual thread with <code>spring.threads.virtual.enabled=true</code> on Boot 3.2+).',
        'Tomcat parses the bytes into <code>HttpServletRequest</code> / <code>HttpServletResponse</code>. Spring has not run yet.',
      ],
      callout: { kind: 'insight', text: 'Spring MVC sits on the Jakarta Servlet API — Tomcat does TCP and HTTP parsing before Spring runs.' },
      metrics: { stage: 'connector', thread: 'exec-7', status: '—', checks: 'none' },
      scene: {
        entities: {
          client: client([{ text: 'POST /api/orders', tone: 'violet' }]),
          tomcat: tomcat([{ text: 'http-nio-8080-exec-7', tone: 'violet' }]),
          card: card('request', [
            'POST /api/orders HTTP/1.1',
            'Content-Type: application/json',
            '',
            '{ "sku": "A-12", "qty": 2 }',
          ]),
        },
        links: { http: L.http },
        flows: [{ route: ['http'], kind: 'req', rate: 1.2 }],
      },
    },
    {
      short: 'Filters',
      chapter: 'technique',
      title: 'Servlet filters run before Spring MVC',
      body: [
        'The request first passes <strong>servlet filters</strong>: CORS, compression, a correlation-id filter and Spring Security’s <code>DelegatingFilterProxy</code>.',
        'Filters only see the raw request — they do not know which <code>@RestController</code> method will handle it.',
      ],
      callout: { kind: 'tip', text: 'Use filters for security, CORS and correlation ids; use interceptors when you need handler metadata.' },
      changes: ['+ Servlet filter chain'],
      metrics: { stage: 'filters', thread: 'exec-7', status: '—', checks: 'CORS · auth' },
      scene: {
        entities: {
          client: client(),
          tomcat: tomcat(),
          filters: filters([{ text: 'cors → security → trace', tone: 'amber', icon: 'listOrdered' }]),
          card: card('TraceIdFilter.java', [
            '@Component',
            'class TraceIdFilter extends OncePerRequestFilter {',
            '  protected void doFilterInternal(req, res, chain) {',
            '    MDC.put("traceId", newId());',
            '    chain.doFilter(req, res); } }',
          ]),
        },
        links: { http: L.httpQuiet, chain: L.chain },
        flows: [{ route: ['http', 'chain'], kind: 'req', rate: 1.2 }],
      },
    },
    {
      short: 'Dispatch',
      chapter: 'technique',
      title: 'DispatcherServlet finds the handler',
      body: [
        '<code>DispatcherServlet</code> is MVC’s single front controller. It asks <code>RequestMappingHandlerMapping</code> to match URL + method to a <code>HandlerExecutionChain</code>.',
        'The chain holds the target <code>HandlerMethod</code> plus every matching <code>HandlerInterceptor</code>.',
      ],
      callout: { kind: 'insight', text: 'The mapping table is built once at startup from all @GetMapping / @PostMapping annotations.' },
      changes: ['+ DispatcherServlet', '~ matched POST /api/orders → OrderController.create'],
      metrics: { stage: 'handler mapping', thread: 'exec-7', status: '—', checks: 'route ✓' },
      scene: {
        entities: {
          client: client(),
          tomcat: tomcat(),
          filters: filters(),
          disp: disp([{ text: 'POST /api/orders ✓', tone: 'green' }]),
          card: card('mapping (startup log)', [
            'Mapped "{POST [/api/orders]}"',
            '  onto OrderController#create(OrderReq)',
            'Mapped "{GET [/api/orders/{id}]}"',
            '  onto OrderController#get(long)',
          ]),
        },
        links: { http: L.httpQuiet, chain: L.chainQuiet, service: L.service },
        flows: [{ route: ['http', 'chain', 'service'], kind: 'req', rate: 1.2 }],
      },
    },
    {
      short: 'Interceptor',
      chapter: 'technique',
      title: 'HandlerInterceptor.preHandle()',
      body: [
        'Before the controller, Spring runs <code>preHandle(req, res, handler)</code> on each interceptor.',
        'Unlike filters, interceptors receive the <code>HandlerMethod</code>, so they can read annotations like <code>@RateLimited</code> or <code>@Audit</code> on the target method.',
      ],
      callout: { kind: 'tip', text: 'Returning false from preHandle() ends the request before binding or the controller runs.' },
      changes: ['~ RateLimitInterceptor: allowed'],
      metrics: { stage: 'preHandle', thread: 'exec-7', status: '—', checks: 'rate ✓' },
      scene: {
        entities: {
          ...pipeline({ disp: [{ text: 'preHandle → true', tone: 'green' }] }),
          card: card('RateLimitInterceptor.java', [
            'public boolean preHandle(HttpServletRequest req,',
            '    HttpServletResponse res, Object handler) {',
            '  var hm = (HandlerMethod) handler;',
            '  if (!hm.hasMethodAnnotation(RateLimited.class)) return true;',
            '  return bucket.tryConsume(1); }',
          ]),
        },
        links: { http: L.httpQuiet, chain: L.chainQuiet, service: L.serviceQuiet },
        flows: [{ route: ['service'], kind: 'req', rate: 1.4, bounce: true }],
      },
    },
    {
      short: '@Valid',
      chapter: 'technique',
      title: 'Argument resolvers bind and validate',
      body: [
        'The <code>HandlerAdapter</code> runs argument resolvers: Jackson turns the JSON body into <code>OrderReq</code> (<code>@RequestBody</code>) and Bean Validation checks <code>@Valid</code>.',
        'If validation fails, <code>MethodArgumentNotValidException</code> is thrown before your controller body runs.',
      ],
      callout: { kind: 'insight', text: 'The controller stays clean: JSON parsing, @PathVariable, headers and @Valid all happen before it runs.' },
      changes: ['+ OrderController', '~ OrderReq bound, @Valid ✓'],
      metrics: { stage: 'invoke', thread: 'exec-7', status: '—', checks: '@Valid ✓' },
      scene: {
        entities: {
          ...pipeline({ ctrl: [{ text: 'OrderReq ✓ valid', tone: 'green' }] }),
          card: card('OrderController.java', [
            '@PostMapping("/api/orders")',
            'ResponseEntity<OrderDto> create(',
            '    @Valid @RequestBody OrderReq req) { … }',
            '',
            'record OrderReq(@NotBlank String sku, @Positive int qty) { }',
          ]),
        },
        links: { ...quiet, invoke: L.invoke },
        flows: [{ route: ['invoke'], kind: 'req', rate: 1.4 }],
      },
    },
    {
      short: 'Errors',
      chapter: 'solution',
      title: 'JSON out, or one global error format',
      body: [
        'On success an <code>HttpMessageConverter</code> (Jackson) writes the returned DTO as <code>201</code> JSON.',
        'If anything in the pipeline throws, <code>@RestControllerAdvice</code> turns it into a standard RFC 7807 <code>ProblemDetail</code> response.',
      ],
      callout: { kind: 'tip', text: 'Spring Boot 3 supports ProblemDetail (RFC 7807) out of the box for consistent API errors.' },
      changes: ['+ ControllerAdvice', '~ qty = 0 → 400 ProblemDetail'],
      metrics: { stage: 'response', thread: 'exec-7', status: 400, checks: 'qty must be > 0' },
      scene: {
        entities: {
          ...pipeline({ ctrl: [{ text: 'qty = 0 ✗', tone: 'red' }] }),
          advice: advice([{ text: '400 ProblemDetail', tone: 'amber' }]),
          card: card('ApiErrors.java', [
            '@RestControllerAdvice class ApiErrors {',
            '  @ExceptionHandler(MethodArgumentNotValidException.class)',
            '  ProblemDetail bad(MethodArgumentNotValidException e) {',
            '    return ProblemDetail.forStatusAndDetail(',
            '        BAD_REQUEST, "qty must be > 0"); } }',
          ]),
        },
        links: { ...quiet, handle: L.handle },
        flows: [
          { route: ['handle'], kind: 'fail', rate: 1 },
          { route: ['service', 'chain', 'http'], kind: 'res', rate: 0.8 },
        ],
      },
    },
    {
      short: 'Loom',
      chapter: 'tradeoff',
      title: 'MVC + virtual threads vs a stalled event loop',
      body: [
        '<strong>WebFlux</strong> runs on Netty with a handful of event-loop threads. One blocking JDBC call stalls a loop and every connection on it.',
        'On Boot 3.2+, <strong>MVC + virtual threads + <code>RestClient</code></strong> blocks cheaply: the virtual thread parks during JDBC and the carrier thread serves others — same concurrency, plain JDBC and readable stack traces.',
      ],
      callout: { kind: 'warn', text: 'Never call blocking JDBC on a WebFlux event loop. For JDBC/CRUD apps prefer MVC on virtual threads.' },
      changes: ['− ControllerAdvice', '+ Postgres', '~ Tomcat on virtual threads'],
      metrics: { stage: 'JDBC call', thread: 'virtual #48213', status: 201, checks: 'blocking OK' },
      scene: {
        entities: {
          ...pipeline({
            tomcat: [{ text: 'virtual thread / request', tone: 'green' }],
            ctrl: [{ text: 'parks on JDBC', tone: 'violet' }],
          }),
          db: db(),
          card: card('application.yml', [
            'spring.threads.virtual.enabled: true',
            '',
            '// controller code stays blocking & simple',
            'var stock = restClient.get().uri("/stock/{sku}", sku)',
            '    .retrieve().body(Stock.class);',
          ]),
        },
        links: { ...quiet, jdbc: L.jdbc },
        flows: [
          { route: ['jdbc'], kind: 'write', rate: 1.4, bounce: true },
          { route: ['http'], kind: 'req', rate: 2.5 },
        ],
      },
    },
    {
      short: 'Backpressure',
      chapter: 'tradeoff',
      title: 'Where WebFlux wins: streams with backpressure',
      body: [
        'In WebFlux, <code>bodyToFlux(...)</code> only builds a lazy plan — nothing runs until something subscribes. Never call <code>.block()</code> on an event loop.',
        'For gateways and streams (SSE, Kafka), <code>request(n)</code> <strong>backpressure</strong> lets a slow consumer pull only what it can handle, so a fast producer cannot flood it into OOM.',
      ],
      callout: { kind: 'insight', text: 'Demand-driven backpressure (limitRate(64)) makes the consumer set the pace.' },
      changes: ['+ Kafka price stream', '~ pulled 64 at a time'],
      metrics: { stage: 'SSE stream', thread: 'event loop', status: 200, checks: 'limitRate 64' },
      scene: {
        entities: {
          ...pipeline({ disp: [{ text: 'Flux · demand 64', tone: 'violet' }] }),
          db: db(),
          stream: stream([{ text: '10k ticks/s', tone: 'amber' }]),
          card: card('PriceStream.java', [
            '@GetMapping(value = "/prices", produces = TEXT_EVENT_STREAM_VALUE)',
            'Flux<Price> prices() {',
            '  return receiver.receive()',
            '      .map(this::toPrice)',
            '      .limitRate(64); }',
          ]),
        },
        links: { ...quiet, jdbc: L.jdbc, pull: L.pull },
        flows: [
          { route: ['pull'], kind: 'req', rate: 2 },
          { route: ['service', 'chain', 'http'], kind: 'res', rate: 1.6 },
        ],
      },
    },
  ],
};
