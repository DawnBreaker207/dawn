/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaSpringMvcLesson: Lesson = {
  id: 'java-spring-mvc',
  title: 'Spring MVC, Loom & WebFlux',
  summary:
    'Trace Tomcat -> Filters -> DispatcherServlet -> @Valid -> Advice, then compare Spring MVC + Virtual Threads (RestClient) against WebFlux Netty EventLoop & Backpressure.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['stage', 'container', 'validation', 'response'],
  legend: ['flow', ['req', 'HTTP request'], ['res', 'JSON / Loom'], ['fail', '400 / loop stall']],
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
      chapter: 'mvc',
      title: '1. Embedded Tomcat Accepts HTTP Request',
      body: [
        'An incoming HTTP request (<code>POST /api/orders</code>) arrives at Embedded Tomcat’s NIO connector and is assigned a worker thread (or Virtual Thread in Boot 3.2+).',
        'Tomcat parses raw HTTP bytes into <code>HttpServletRequest</code> and <code>HttpServletResponse</code> objects.',
      ],
      callout: {
        kind: 'insight',
        text: 'Spring MVC builds on top of the Jakarta Servlet API — Tomcat handles TCP/HTTP parsing before Spring runs.',
      },
      metrics: { stage: 'Servlet Socket', container: 'Tomcat NIO', validation: 'None', response: 'Pending' },
      scene: {
        entities: {
          client: d(-12, -8, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['HTTP Client'], sub: 'POST /orders' }),
          tomcat: d(4, -8, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['Tomcat'], sub: 'Servlet Req' }),
          card: S({ x: -12, y: 12 }, '1. Incoming HTTP Request at Tomcat', [
            'POST /api/orders HTTP/1.1',
            'Content-Type: application/json',
            'Authorization: Bearer eyJ...',
            '{"itemId": 42, "qty": 2}',
          ], { icon: 'terminal' }),
        },
        links: {
          cl_tm: h('client', 'tomcat', ['client', 'tomcat'], { heads: 'end', label: 'TCP HTTP' }),
        },
        flows: [{ route: ['cl_tm'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Servlet Filter',
      chapter: 'mvc',
      title: '2. Servlet Filter Chain (Before Spring MVC)',
      body: [
        'Before touching any Spring controller, the request passes through <strong>Servlet Filters</strong> (CORS, Compression, Spring Security’s <code>DelegatingFilterProxy</code>).',
        'Filters wrap the raw <code>ServletRequest</code> / <code>ServletResponse</code> and do NOT know which Spring <code>@RestController</code> method will handle the route.',
      ],
      callout: {
        kind: 'tip',
        text: 'Use Servlet Filters for security, CORS, and correlation IDs; use HandlerInterceptors when you need Spring HandlerMethod metadata.',
      },
      changes: ['+ FilterChain runs before DispatcherServlet', '+ Can reject early (CORS / Auth)'],
      metrics: { stage: 'FilterChain', container: 'Servlet Spec', validation: 'CORS / Auth', response: 'Pass-through' },
      scene: {
        entities: {
          tomcat: d(-14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['Tomcat'], sub: 'Servlet Req' }),
          flt: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['FilterChain'], sub: 'CORS / Auth' }),
          disp: d(14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Dispatcher'], sub: 'Front Ctrl' }),
          card: S({ x: -12, y: 12 }, '2. Servlet Filter Wrapping', [
            'public void doFilter(ServletRequest req,',
            '                     ServletResponse res, FilterChain ch) {',
            '  MDC.put("traceId", uuid());',
            '  try { ch.doFilter(req, res); } finally { MDC.clear(); }',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          tm_fl: h('tomcat', 'flt', ['tomcat', 'flt'], { heads: 'end', label: 'doFilter' }),
          fl_dp: h('flt', 'disp', ['flt', 'disp'], { heads: 'end', label: 'next' }),
        },
        flows: [{ route: ['tm_fl', 'fl_dp'], kind: 'req', rate: 1.9 }],
      },
    },
    {
      short: 'Dispatcher',
      chapter: 'mvc',
      title: '3. DispatcherServlet & HandlerMapping Lookup',
      body: [
        '<code>DispatcherServlet</code> is Spring MVC’s single Front Controller. It queries <code>RequestMappingHandlerMapping</code> to match URL + HTTP method to a <code>HandlerExecutionChain</code>.',
        'The chain contains the target <code>HandlerMethod</code> plus all matching <code>HandlerInterceptor</code>s.',
      ],
      callout: {
        kind: 'insight',
        text: 'HandlerMapping builds a lookup trie/map at startup from all @GetMapping / @PostMapping annotations.',
      },
      changes: ['+ RequestMappingHandlerMapping resolves route', '+ Builds HandlerExecutionChain'],
      metrics: { stage: 'HandlerMapping', container: 'Spring MVC', validation: 'Route match', response: '404 if miss' },
      scene: {
        entities: {
          disp: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Dispatcher'], sub: 'Front Ctrl' }),
          map: b(0, -10, { r: 2.2, h: 48, color: 'sky', label: ['HandlerMap'], sub: 'POST /orders' }),
          chain: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['ExecChain'], sub: 'Ctrl + Intrcpt' }),
          card: S({ x: -12, y: 12 }, '3. Matching Route to HandlerMethod', [
            '@RestController @RequestMapping("/api/orders")',
            'class OrderController {',
            '  @PostMapping',
            '  OrderRes create(@Valid @RequestBody OrderReq req)',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          dp_mp: h('disp', 'map', ['disp', 'map'], { heads: 'end', label: 'lookup' }),
          mp_ch: h('map', 'chain', ['map', 'chain'], { heads: 'end', label: 'HandlerMethod' }),
        },
        flows: [{ route: ['dp_mp', 'mp_ch'], kind: 'req', rate: 1.9 }],
      },
    },
    {
      short: 'Interceptor',
      chapter: 'mvc',
      title: '4. HandlerInterceptor.preHandle() Hook',
      body: [
        'Before invoking the controller, Spring runs <code>HandlerInterceptor.preHandle(req, res, handler)</code>.',
        'Unlike Servlet Filters, interceptors receive the exact <code>HandlerMethod</code> object so you can inspect custom annotations (like <code>@RateLimited</code> or <code>@Audit</code>).',
      ],
      callout: {
        kind: 'tip',
        text: 'Returning false from preHandle() short-circuits the request before ArgumentResolver or Controller runs.',
      },
      changes: ['+ preHandle() inspects HandlerMethod', '+ Can short-circuit before body parse'],
      metrics: { stage: 'Interceptor', container: 'Spring MVC', validation: 'Policy check', response: 'Continue' },
      scene: {
        entities: {
          disp: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Dispatcher'], sub: 'exec chain' }),
          intr: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['Interceptor'], sub: 'preHandle()' }),
          adp: d(14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['HandlerAdapter'], sub: 'ready invoke' }),
          card: S({ x: -12, y: 12 }, '4. Spring HandlerInterceptor', [
            'boolean preHandle(HttpServletRequest req,',
            '                  HttpServletResponse res, Object handler) {',
            '  // "handler" is HandlerMethod -> inspect annotations!',
            '  return true;',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          dp_in: h('disp', 'intr', ['disp', 'intr'], { heads: 'end', label: 'preHandle' }),
          in_ad: h('intr', 'adp', ['intr', 'adp'], { heads: 'end', label: 'true -> next' }),
        },
        flows: [{ route: ['dp_in', 'in_ad'], kind: 'req', rate: 1.9 }],
      },
    },
    {
      short: 'ArgResolver',
      chapter: 'mvc',
      title: '5. ArgumentResolver, Jackson & @Valid',
      body: [
        '<code>HandlerAdapter</code> runs <code>HandlerMethodArgumentResolver</code>s: Jackson deserializes JSON into <code>OrderReq</code> (<code>@RequestBody</code>), and Bean Validation (<code>@Valid</code>) checks constraints.',
        'If validation fails, Spring throws <code>MethodArgumentNotValidException</code> before entering your controller body!',
      ],
      callout: {
        kind: 'insight',
        text: 'Your controller method stays clean because JSON parsing, @PathVariable, @RequestHeader, and @Valid all happen before it runs.',
      },
      changes: ['+ Jackson converts JSON -> Java DTO', '+ @Valid enforces Bean Validation'],
      metrics: { stage: 'ArgResolver', container: 'Jackson + JSR', validation: '@Valid DTO', response: 'Invoke Ctrl' },
      scene: {
        entities: {
          adp: d(-14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['ArgResolver'], sub: 'Jackson JSON' }),
          val: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['@Valid Check'], sub: '@NotNull @Min' }),
          ctrl: d(14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['Controller'], sub: 'create(dto)' }),
          card: S({ x: -12, y: 12 }, '5. Deserialization & @Valid Enforcement', [
            'record OrderReq(@NotNull Long itemId, @Min(1) int qty) {}',
            '// 1. MappingJackson2HttpMessageConverter reads JSON',
            '// 2. Hibernate Validator checks @NotNull / @Min',
            '// 3. Controller receives valid immutable OrderReq',
          ], { icon: 'terminal' }),
        },
        links: {
          ad_vl: h('adp', 'val', ['adp', 'val'], { heads: 'end', label: 'parse DTO' }),
          vl_ct: h('val', 'ctrl', ['val', 'ctrl'], { heads: 'end', label: 'valid -> run' }),
        },
        flows: [{ route: ['ad_vl', 'vl_ct'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'JSON / Advice',
      chapter: 'mvc',
      title: '6. Return Serialization & @RestControllerAdvice',
      body: [
        'On success, <code>HttpMessageConverter</code> (Jackson) serializes the returned DTO into HTTP <code>200/201</code> JSON.',
        'If an exception is thrown anywhere in the pipeline, <code>@RestControllerAdvice</code> intercepts it globally and returns a standardized RFC 7807 <code>ProblemDetail</code> JSON error.',
      ],
      callout: {
        kind: 'tip',
        text: 'Spring Boot 3 supports ProblemDetail (RFC 7807) out of the box for consistent API error responses.',
      },
      changes: ['+ Jackson serializes DTO -> JSON 201', '+ @RestControllerAdvice handles errors'],
      metrics: { stage: 'MessageConv', container: 'Spring MVC', validation: 'Global Advice', response: '201 / Problem' },
      scene: {
        entities: {
          ctrl: d(-12, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['Controller'], sub: 'returns DTO' }),
          conv: d(2, -14, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Jackson Conv'], sub: 'JSON 201 OK' }),
          adv: d(2, -2, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['CtrlAdvice'], sub: '400 Problem' }),
          card: S({ x: -12, y: 12 }, '6. Response & Global Exception Handling', [
            '@RestControllerAdvice',
            'class GlobalErrors {',
            '  @ExceptionHandler(MethodArgumentNotValidException.class)',
            '  ProblemDetail handle(Exception ex) { ... } // 400 JSON',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          ct_cv: h('ctrl', 'conv', ['ctrl', 'conv'], { heads: 'end', label: '201 JSON' }),
          ct_ad: h('ctrl', 'adv', ['ctrl', 'adv'], { heads: 'end', label: 'throw -> 400' }),
        },
        flows: [{ route: ['ct_cv'], kind: 'res', rate: 2.0 }, { route: ['ct_ad'], kind: 'fail', rate: 1.3 }],
      },
    },
    {
      short: 'Loom vs Flux',
      chapter: 'reactive',
      title: '7. MVC + Loom (RestClient) vs WebFlux EventLoop Stall',
      body: [
        '<strong>WebFlux</strong> runs on Netty with only ~8 Event Loop threads: calling blocking JDBC or <code>RestTemplate</code> stalls an Event Loop and freezes ALL 50k connections!',
        'In Boot 3.2+, <strong>Spring MVC + Virtual Threads + <code>RestClient</code></strong> matches WebFlux I/O concurrency while keeping standard JDBC & clean stack traces.',
      ],
      callout: {
        kind: 'warn',
        text: 'Never call blocking JDBC inside Netty WebFlux EventLoop! Use MVC + Virtual Threads for JDBC/CRUD apps.',
      },
      changes: ['+ Blocking JDBC freezes 8 Netty loops', '+ MVC + Loom + RestClient scales sync I/O'],
      metrics: { stage: 'Runtime Choice', container: 'Tomcat vs Netty', validation: 'BlockHound', response: 'Loom or R2DBC' },
      scene: {
        entities: {
          arch: d(-12, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['App Stack'], sub: 'CRUD vs Stream' }),
          loom: d(2, -14, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['MVC + Loom'], sub: 'JDBC + RestCli' }),
          flux: d(2, -2, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['WebFlux Loop'], sub: 'blocks JDBC' }),
          card: S({ x: -12, y: 12 }, '7. Choosing MVC + Loom vs WebFlux', [
            '// Boot 3.2+ CRUD/JDBC -> MVC + Virtual Threads + RestClient:',
            'OrderDto dto = restClient.get().uri("/orders/{id}", id)',
            '  .retrieve().body(OrderDto.class);',
            '// WebFlux: only 8 Netty loops -> MUST use R2DBC + WebClient!',
          ], { icon: 'terminal' }),
        },
        links: {
          ar_lm: h('arch', 'loom', ['arch', 'loom'], { heads: 'end', label: 'CRUD' }),
          ar_fx: h('arch', 'flux', ['arch', 'flux'], { heads: 'end', label: 'no block!' }),
        },
        flows: [{ route: ['ar_lm'], kind: 'res', rate: 1.9 }, { route: ['ar_fx'], kind: 'fail', rate: 1.4 }],
      },
    },
    {
      short: 'Backpressure',
      chapter: 'reactive',
      title: '8. WebFlux Lazy subscribe() & Reactor Backpressure',
      body: [
        'In WebFlux, <code>webClient.get().bodyToFlux(...)</code> only builds a lazy plan — nothing runs until <code>subscribe()</code>. Never call <code>.block()</code> on an Event Loop!',
        'Use WebFlux for Gateways or streaming (SSE/Kafka) where <code>request(n)</code> <strong>Backpressure</strong> prevents fast producers from OOMing slow consumers.',
      ],
      callout: {
        kind: 'insight',
        text: 'Demand-driven backpressure (limitRate(64)) lets consumers pull only what they can process.',
      },
      changes: ['+ Lazy Mono/Flux needs subscribe()', '+ request(n) throttles fast producers'],
      metrics: { stage: 'Backpressure', container: 'Netty Reactive', validation: 'limitRate(64)', response: 'SSE / Gateway' },
      scene: {
        entities: {
          cons: d(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['Slow Consumer'], sub: 'request(64)' }),
          sub: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['Subscription'], sub: 'demand = 64' }),
          prod: d(14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['Fast Producer'], sub: 'emits <= 64' }),
          card: S({ x: -12, y: 12 }, '8. Reactive Streams Demand & Backpressure', [
            'eventFlux.limitRate(64)',
            '  .flatMap(ev -> webClient.post().bodyValue(ev)...);',
            '// Assembly is lazy; Netty subscribe() triggers I/O!',
          ], { icon: 'terminal' }),
        },
        links: {
          cn_sb: h('cons', 'sub', ['cons', 'sub'], { heads: 'end', label: 'request(64)' }),
          sb_pr: h('sub', 'prod', ['sub', 'prod'], { heads: 'end', label: 'throttle' }),
        },
        flows: [{ route: ['cn_sb', 'sb_pr'], kind: 'res', rate: 1.9 }],
      },
    },
  ],
};
