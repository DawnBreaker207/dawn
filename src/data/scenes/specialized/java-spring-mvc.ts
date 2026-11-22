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

export const javaSpringMvcLesson = {
  id: `java-spring-mvc`,
  title: `Spring MVC Architecture & Request Pipeline`,
  summary: `End-to-end trace of an HTTP request: DispatcherServlet, HandlerMapping, HandlerAdapter, Interceptors, ArgumentResolvers, and Global Exception Handling.`,
  minutes: 15,
  level: `advanced`,
  metrics: ['pipeline_stage', 'active_handler', 'interceptors_executed', 'response_status', 'serialization_time'],
  legend: ['req', 'res', ['ping', 'internal delegation'], 'fail'],
  goals: [
    { text: 'Front Controller', step: 1 },
    { text: 'HandlerMapping & Interceptors', step: 2 },
    { text: 'HandlerAdapter & Method Invocation', step: 3 },
    { text: 'HttpMessageConverters & @ResponseBody', step: 4 },
    { text: '@ControllerAdvice & Global Exception', step: 5 },
  ],
  steps: [
    {
      short: `Dispatcher`,
      chapter: `technique`,
      title: `DispatcherServlet: The Front Controller`,
      body: [
        `All incoming web traffic hits the <strong>DispatcherServlet</strong>, which acts as the Front Controller (inheriting from <code>FrameworkServlet</code> and <code>HttpServlet</code>).`,
        `DispatcherServlet orchestrates all steps: finding the controller, running interceptors, executing reflection adapters, and serializing responses.`,
      ],
      callout: { kind: `insight`, text: 'In Spring Boot, DispatcherServlet is auto-configured at "/" mapping with registration order -100.' },
      metrics: { pipeline_stage: 'DispatcherServlet.doDispatch()', active_handler: 'None (routing)', interceptors_executed: '0', response_status: '200 OK pending', serialization_time: '0ms' },
      scene: {
        entities: {
          client: d(-11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'cloud', label: ['HTTP Client'], sub: 'POST /api/v1/orders' }),
          dispatcher: d(0, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'server', label: ['DispatcherServlet'], sub: 'Front Controller' }),
          handler_registry: d(11, -4, { s: 3.8, h: 42, color: 'green', glyph: 'storage', label: ['HandlerMapping Registry'], sub: 'URL -> Handler Method' }),
        },
        links: {
          cd: h('client', 'dispatcher', ['client', 'dispatcher'], { heads: 'end', label: 'HTTP Request' }),
          dh: h('dispatcher', 'handler_registry', ['dispatcher', 'handler_registry'], { heads: 'end', label: 'lookup handler' }),
        },
        flows: [
          { route: ['cd'], bounce: false, rate: 2.0 },
          { route: ['dh'], bounce: true, rate: 1.5 },
        ],
      },
    },
    {
      short: `Routing`,
      chapter: `technique`,
      title: `HandlerMapping & HandlerExecutionChain`,
      body: [
        `<strong>RequestMappingHandlerMapping</strong> inspects registered <code>@RequestMapping</code> paths and returns a <strong>HandlerExecutionChain</strong>.`,
        `The chain encapsulates both the matched controller method and an ordered list of <strong>HandlerInterceptors</strong>. Each interceptor runs <code>preHandle()</code>. If any returns false, the chain halts immediately!`,
      ],
      callout: { kind: `insight`, text: 'HandlerInterceptors differ from Servlet Filters: Filters wrap the servlet; Interceptors run inside Spring context with full bean injection.' },
      metrics: { pipeline_stage: 'HandlerExecutionChain.applyPreHandle()', active_handler: 'OrderController#createOrder', interceptors_executed: 'Auth, RateLimit (2)', response_status: '200 OK pending', serialization_time: '0ms' },
      scene: {
        entities: {
          dispatcher: d(-11, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'server', label: ['DispatcherServlet'], sub: 'Coordinates Chain' }),
          interceptor: d(0, -4, { s: 3.8, h: 42, color: 'orange', glyph: 'workflow', label: ['HandlerInterceptors'], sub: 'preHandle() chain' }),
          controller: d(11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'code', label: ['OrderController'], sub: 'Target @RestController' }),
        },
        links: {
          di: h('dispatcher', 'interceptor', ['dispatcher', 'interceptor'], { heads: 'end', label: 'preHandle()' }),
          ic: h('interceptor', 'controller', ['interceptor', 'controller'], { heads: 'end', label: 'proceed to target' }),
        },
        flows: [
          { route: ['di', 'ic'], bounce: false, rate: 1.8 },
        ],
      },
    },
    {
      short: `Adapter`,
      chapter: `technique`,
      title: `HandlerAdapter & Argument Resolvers`,
      body: [
        `DispatcherServlet delegates execution to a <strong>RequestMappingHandlerAdapter</strong> so that any method signature can be supported.`,
        `<strong>HandlerMethodArgumentResolver</strong> parses incoming payloads: <code>RequestResponseBodyMethodProcessor</code> reads JSON from InputStream, <code>PathVariableMethodArgumentResolver</code> extracts URL segments, and <code>@Valid</code> triggers Hibernate Validator.`,
      ],
      callout: { kind: `insight`, text: 'If @Valid fails, MethodArgumentNotValidException is thrown before the controller body even begins executing.' },
      metrics: { pipeline_stage: 'HandlerAdapter.handle()', active_handler: 'InvocableHandlerMethod', interceptors_executed: '2', response_status: '200 OK processing', serialization_time: '1.2ms' },
      scene: {
        entities: {
          adapter: d(-11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'workflow', label: ['HandlerAdapter'], sub: 'InvocableMethod' }),
          resolvers: d(0, -4, { s: 3.8, h: 42, color: 'green', glyph: 'cpu', label: ['ArgumentResolvers'], sub: '@RequestBody, @Valid' }),
          business_svc: d(11, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'server', label: ['OrderService'], sub: 'Domain Logic' }),
        },
        links: {
          ar: h('adapter', 'resolvers', ['adapter', 'resolvers'], { heads: 'end', label: 'resolve args' }),
          rb: h('resolvers', 'business_svc', ['resolvers', 'business_svc'], { heads: 'end', label: 'invoke service' }),
        },
        flows: [
          { route: ['ar'], bounce: true, rate: 2.0 },
          { route: ['rb'], bounce: true, rate: 1.5 },
        ],
      },
    },
    {
      short: `Serialization`,
      chapter: `technique`,
      title: `HttpMessageConverters & JSON Serialization`,
      body: [
        `With <code>@ResponseBody</code> or <code>@RestController</code>, the return value does not resolve to a View template.`,
        `Instead, <strong>MappingJackson2HttpMessageConverter</strong> serializes the POJO directly into JSON byte stream on <code>HttpServletResponse.getOutputStream()</code>, setting <code>Content-Type: application/json</code>.`,
      ],
      callout: { kind: `insight`, text: 'Interceptors run postHandle() and afterCompletion() in reverse order, cleaning up ThreadLocal variables and closing response spans.' },
      metrics: { pipeline_stage: 'HttpMessageConverter.write()', active_handler: 'Jackson ObjectMapper', interceptors_executed: 'afterCompletion() (2)', response_status: '201 Created', serialization_time: '0.8ms' },
      scene: {
        entities: {
          converter: d(-11, -4, { s: 3.8, h: 42, color: 'green', glyph: 'workflow', label: ['JacksonConverter'], sub: 'POJO -> JSON Bytes' }),
          response_stream: d(0, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'server', label: ['Servlet OutputStream'], sub: 'Buffer flush' }),
          client: d(11, -4, { s: 3.8, h: 42, color: 'cyan', glyph: 'cloud', label: ['HTTP Client'], sub: 'Receives 201 Created' }),
        },
        links: {
          cr: h('converter', 'response_stream', ['converter', 'response_stream'], { heads: 'end', label: 'write bytes' }),
          rc: h('response_stream', 'client', ['response_stream', 'client'], { heads: 'end', label: 'HTTP 201 Payload' }),
        },
        flows: [
          { route: ['cr', 'rc'], bounce: false, rate: 2.2 },
        ],
      },
    },
    {
      short: `Exceptions`,
      chapter: `technique`,
      title: `@ControllerAdvice & Global Exception Handling`,
      body: [
        `When an unhandled exception occurs anywhere in the pipeline, DispatcherServlet catches it and queries the <strong>HandlerExceptionResolverComposite</strong>.`,
        `<strong>ExceptionHandlerExceptionResolver</strong> looks for matching <code>@ExceptionHandler</code> methods in <code>@RestControllerAdvice</code> beans, transforming raw stack traces into standardized Problem Details (RFC 7807) responses.`,
      ],
      callout: { kind: `insight`, text: 'Global exception handling prevents 500 white-label error pages and ensures consistent error schemas across all REST APIs.' },
      metrics: { pipeline_stage: 'HandlerExceptionResolver', active_handler: 'GlobalExceptionHandler', interceptors_executed: 'afterCompletion(ex)', response_status: '400 Bad Request', serialization_time: '0.5ms' },
      scene: {
        entities: {
          thrown_err: d(-11, -4, { s: 3.8, h: 42, color: 'red', glyph: 'alert', label: ['MethodArgumentNotValid'], sub: 'Validation Thrown' }),
          advice: d(0, -4, { s: 3.8, h: 42, color: 'orange', glyph: 'workflow', label: ['@RestControllerAdvice'], sub: 'Global Exception Handler' }),
          rfc_res: d(11, -4, { s: 3.8, h: 42, color: 'green', glyph: 'code', label: ['ProblemDetail (RFC 7807)'], sub: '400 Bad Request Payload' }),
        },
        links: {
          ta: h('thrown_err', 'advice', ['thrown_err', 'advice'], { heads: 'end', label: 'catches exception' }),
          ar: h('advice', 'rfc_res', ['advice', 'rfc_res'], { heads: 'end', label: 'serializes error DTO' }),
        },
        flows: [
          { route: ['ta'], bounce: false, rate: 1.5 },
          { route: ['ar'], bounce: false, rate: 1.8 },
        ],
      },
    },
  ],
};
