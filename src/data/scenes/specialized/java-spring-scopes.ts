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

export const javaSpringScopesLesson = {
  id: `java-spring-scopes`,
  title: `Spring Bean Scopes & Lifecycle Management`,
  summary: `Deep dive into Spring bean scoping: Singleton, Prototype, Request, Session, and solving the prototype-in-singleton injection dilemma via Scoped Proxies.`,
  minutes: 14,
  level: `advanced`,
  metrics: ['scope_type', 'instances_created', 'proxy_mode', 'thread_safety', 'memory_footprint'],
  legend: ['req', 'res', ['ping', 'proxy invocation'], 'fail'],
  goals: [
    { text: `Singleton vs Prototype: Eager caching vs fresh instantiation per injection`, step: 1 },
    { text: `The Prototype Dilemma: Why injecting Prototype into Singleton creates a stale single instance`, step: 2 },
    { text: `CGLIB Scoped Proxies: Lazy runtime resolution via proxy delegation on each method call`, step: 3 },
    { text: `Web Scopes: Request & Session bean lifecycle tied to HttpServletRequest & HttpSession`, step: 4 },
    { text: `Bean Destruction: DisposableBean, @PreDestroy, and why Spring does NOT destroy prototypes`, step: 5 },
  ],
  steps: [
    {
      short: `Singleton`,
      chapter: `technique`,
      title: `Singleton Scope: Default Shared Instances`,
      body: [
        `In Spring, <strong>Singleton</strong> is the default scope. Exactly one instance exists per <strong>ApplicationContext</strong> (not per ClassLoader).`,
        `The instance is created during context refresh, cached in the <strong>singletonObjects</strong> map (ConcurrentHashMap), and injected everywhere. Beans must be stateless or thread-safe!`,
      ],
      callout: { kind: `insight`, text: 'Spring Singleton != GoF Singleton pattern. GoF enforces 1 per ClassLoader via private constructor; Spring enforces 1 per ApplicationContext via IoC registry.' },
      metrics: { scope_type: 'singleton', instances_created: '1 (shared)', proxy_mode: 'DIRECT', thread_safety: 'Must be stateless', memory_footprint: 'Minimal' },
      scene: {
        entities: {
          client_a: d(-11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'code', label: ['OrderController'], sub: 'Client Thread 1' }),
          ioc_cache: d(0, -4, { s: 3.8, h: 42, color: 'green', glyph: 'storage', label: ['singletonObjects'], sub: 'OrderService Cache' }),
          client_b: d(11, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'code', label: ['PaymentController'], sub: 'Client Thread 2' }),
        },
        links: {
          ca: h('client_a', 'ioc_cache', ['client_a', 'ioc_cache'], { heads: 'end', label: 'same ref' }),
          cb: h('client_b', 'ioc_cache', ['client_b', 'ioc_cache'], { heads: 'end', label: 'same ref' }),
        },
        flows: [
          { route: ['ca'], bounce: true, rate: 2.0 },
          { route: ['cb'], bounce: true, rate: 2.0 },
        ],
      },
    },
    {
      short: `Prototype`,
      chapter: `technique`,
      title: `Prototype Scope: Fresh Instance on Every Request`,
      body: [
        `When a bean is declared <strong>@Scope("prototype")</strong>, Spring creates a completely new instance each time <code>getBean()</code> or injection occurs.`,
        `However, if you inject a Prototype bean directly into a Singleton bean via <code>@Autowired</code>, injection happens <strong>only once</strong> at startup! The Singleton holds that single prototype instance forever.`,
      ],
      callout: { kind: `warning`, text: 'The Prototype Dilemma: injecting a prototype into a singleton freezes the prototype, neutralizing its lifecycle purpose!' },
      metrics: { scope_type: 'prototype', instances_created: '1 (frozen in singleton)', proxy_mode: 'NONE', thread_safety: 'Stale state', memory_footprint: 'Single instance' },
      scene: {
        entities: {
          singleton_holder: d(-11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'server', label: ['ReportService (Singleton)'], sub: 'Created at startup' }),
          frozen_proto: d(0, -4, { s: 3.8, h: 42, color: 'red', glyph: 'workflow', label: ['UserTask (Prototype)'], sub: 'Injected ONCE - Stale!' }),
          req_new: d(11, -4, { s: 3.8, h: 42, color: 'gray', glyph: 'code', label: ['New Requests'], sub: 'Cannot reach fresh proto' }),
        },
        links: {
          sp: h('singleton_holder', 'frozen_proto', ['singleton_holder', 'frozen_proto'], { heads: 'end', label: 'fixed reference' }),
          rn: h('req_new', 'singleton_holder', ['req_new', 'singleton_holder'], { heads: 'end', label: 'calls method' }),
        },
        flows: [
          { route: ['rn', 'sp'], bounce: false, rate: 1.5 },
        ],
      },
    },
    {
      short: `Scoped Proxy`,
      chapter: `technique`,
      title: `Solving the Dilemma: @Lookup & Scoped Proxies`,
      body: [
        `To give a Singleton access to fresh Prototype or Request beans, Spring introduces <strong>proxyMode = ScopedProxyMode.TARGET_CLASS</strong>.`,
        `Spring injects a <strong>CGLIB dynamic proxy</strong> into the Singleton. Whenever a method is invoked on the proxy, it intercepts the call, fetches a fresh target instance from the IoC container, and delegates the call.`,
      ],
      callout: { kind: `insight`, text: 'Alternatively, @Lookup method injection allows the container to dynamically override an abstract getter method using CGLIB bytecode generation.' },
      metrics: { scope_type: 'prototype via proxy', instances_created: 'New per call', proxy_mode: 'CGLIB Proxy', thread_safety: 'Thread-confined', memory_footprint: 'Dynamic GC' },
      scene: {
        entities: {
          singleton_svc: d(-11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'server', label: ['ReportService'], sub: 'Holds Proxy Ref' }),
          cglib_proxy: d(0, -4, { s: 3.8, h: 42, color: 'orange', glyph: 'workflow', label: ['CGLIB Proxy'], sub: 'Intercepts invocation' }),
          fresh_target: d(11, -4, { s: 3.8, h: 42, color: 'green', glyph: 'code', label: ['Fresh Task Instance'], sub: 'Instantiated on demand' }),
        },
        links: {
          svc_proxy: h('singleton_svc', 'cglib_proxy', ['singleton_svc', 'cglib_proxy'], { heads: 'end', label: 'method call' }),
          pt: h('cglib_proxy', 'fresh_target', ['cglib_proxy', 'fresh_target'], { heads: 'end', label: 'target resolution' }),
        },
        flows: [
          { route: ['svc_proxy', 'pt'], bounce: true, rate: 2.2 },
        ],
      },
    },
    {
      short: `Web Scopes`,
      chapter: `technique`,
      title: `Web Scopes: Request & Session Lifecycles`,
      body: [
        `Web-aware Spring contexts support <strong>@RequestScope</strong> (1 instance per HTTP request) and <strong>@SessionScope</strong> (1 instance per HttpSession).`,
        `RequestContextHolder stores the current attributes in a <code>ThreadLocal<RequestAttributes></code>. When an HTTP request completes, all request-scoped beans are eligible for GC and destruction callbacks fire.`,
      ],
      callout: { kind: `insight`, text: 'RequestContextListener or DispatcherServlet binds the incoming HttpServletRequest to the execution thread at the start of request processing.' },
      metrics: { scope_type: 'request & session', instances_created: '1 per HTTP Req / Session', proxy_mode: 'CGLIB Proxy', thread_safety: 'Request-isolated', memory_footprint: 'Tied to session TTL' },
      scene: {
        entities: {
          http_req: d(-11, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'cloud', label: ['HTTP Request'], sub: 'ThreadLocal bound' }),
          req_bean: d(0, -4, { s: 3.8, h: 42, color: 'green', glyph: 'server', label: ['@RequestScope Bean'], sub: 'ShoppingCart / Context' }),
          session_store: d(11, -4, { s: 3.8, h: 42, color: 'purple', glyph: 'storage', label: ['HttpSession Store'], sub: 'Survives across reqs' }),
        },
        links: {
          hr: h('http_req', 'req_bean', ['http_req', 'req_bean'], { heads: 'end', label: 'binds lifecycle' }),
          rs: h('req_bean', 'session_store', ['req_bean', 'session_store'], { heads: 'end', label: 'session lookup' }),
        },
        flows: [
          { route: ['hr'], bounce: true, rate: 2.0 },
          { route: ['rs'], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: `Destruction`,
      chapter: `technique`,
      title: `Bean Destruction & The Prototype Gotcha`,
      body: [
        `When the ApplicationContext shuts down (<code>close()</code>), it invokes destruction callbacks: <strong>@PreDestroy</strong>, <code>DisposableBean.destroy()</code>, or custom destroy methods.`,
        `<strong>CRITICAL WARNING:</strong> Spring manages the full lifecycle of Singleton beans, but Spring does <strong>NOT</strong> manage the destruction of Prototype beans! Once handed to the caller, the caller is responsible for freeing any held resources (sockets, file handles).`,
      ],
      callout: { kind: `warning`, text: 'Spring creates prototype beans and wires their dependencies, but never invokes @PreDestroy on prototype beans. Memory leaks will occur if you open OS handles!' },
      metrics: { scope_type: 'destruction phase', instances_created: '0', proxy_mode: 'N/A', thread_safety: 'JVM shutdown hook', memory_footprint: 'Reclaimed on close()' },
      scene: {
        entities: {
          context_close: d(-11, -4, { s: 3.8, h: 42, color: 'red', glyph: 'workflow', label: ['Context.close()'], sub: 'JVM Shutdown Hook' }),
          singleton_dest: d(0, -4, { s: 3.8, h: 42, color: 'blue', glyph: 'server', label: ['Singleton Beans'], sub: '@PreDestroy Executed' }),
          prototype_leak: d(11, -4, { s: 3.8, h: 42, color: 'orange', glyph: 'cpu', label: ['Prototype Beans'], sub: 'NO destroy()! Manual cleanup' }),
        },
        links: {
          cs: h('context_close', 'singleton_dest', ['context_close', 'singleton_dest'], { heads: 'end', label: 'cleans resources' }),
          cp: h('context_close', 'prototype_leak', ['context_close', 'prototype_leak'], { heads: 'end', label: 'ignored by container' }),
        },
        flows: [
          { route: ['cs'], bounce: false, rate: 1.8 },
          { route: ['cp'], bounce: false, rate: 0.8 },
        ],
      },
    },
  ],
};
