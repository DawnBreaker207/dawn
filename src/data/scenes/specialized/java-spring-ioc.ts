/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaSpringIocLesson: Lesson = {
  id: 'java-spring-ioc',
  title: 'Spring IoC & Bean Lifecycle',
  summary:
    'Trace Spring IoC from tight new() coupling through BeanDefinition scanning, Constructor DI, BeanPostProcessor lifecycle hooks, Singleton vs Prototype, and Scoped Proxies.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['coupling', 'lifecycle_phase', 'bean_scope', 'proxy_mode'],
  legend: ['flow', ['req', 'scan / inject'], ['res', 'ready / proxy'], ['fail', 'tight coupling']],
  goals: [
    { text: 'Contrast manual new() coupling with IoC inversion', step: 1 },
    { text: 'Scan @Component classes into BeanDefinition map', step: 2 },
    { text: 'Resolve dependencies via Constructor Injection', step: 3 },
    { text: 'Run BeanPostProcessor & @PostConstruct hooks', step: 4 },
    { text: 'Compare Singleton cache vs Prototype fresh instances', step: 5 },
    { text: 'Inject short-lived Request beans via Scoped Proxy', step: 6 },
  ],
  steps: [
    {
      short: 'Manual new()',
      chapter: 'ioc',
      title: '1. Tight Coupling with Manual new()',
      body: [
        'Without IoC, <code>OrderService</code> directly instantiates <code>new StripeGateway()</code>, hard-coding concrete implementations and making unit testing with mocks painful.',
        'Inversion of Control (IoC) flips ownership: the Spring <code>ApplicationContext</code> creates, wires, and manages objects (<strong>Beans</strong>) for you.',
      ],
      callout: {
        kind: 'warn',
        text: 'Hard-coding new() inside services locks you to one implementation and scatters lifecycle setup.',
      },
      metrics: { coupling: 'Tight (new)', lifecycle_phase: 'Manual', bean_scope: 'Unmanaged', proxy_mode: 'None' },
      scene: {
        entities: {
          svc: d(-12, -8, { s: 4.8, h: 54, color: 'red', glyph: 'code', label: ['OrderService'], sub: 'new Stripe()' }),
          dep: d(4, -8, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['StripeGateway'], sub: 'hard-wired' }),
          card: S({ x: -12, y: 12 }, '1. Problem: Tight Coupling via new()', [
            'class OrderService {',
            '  // Hard-wired! Cannot swap or mock cleanly',
            '  private final PaymentGateway gw = new StripeGateway();',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          svc_dep: h('svc', 'dep', ['svc', 'dep'], { heads: 'end', label: 'new()' }),
        },
        flows: [{ route: ['svc_dep'], kind: 'fail', rate: 1.5 }],
      },
    },
    {
      short: 'BeanDefinition',
      chapter: 'ioc',
      title: '2. Component Scan & BeanDefinition Registry',
      body: [
        'At startup, Spring scans packages for <code>@Component</code> / <code>@Service</code> / <code>@Repository</code> and builds a metadata blueprint called <code>BeanDefinition</code> before instantiating anything.',
        '<code>BeanFactoryPostProcessor</code> can inspect or modify those blueprints before beans are born.',
      ],
      callout: {
        kind: 'insight',
        text: 'BeanDefinition is the recipe; the live Bean instance is created later from that recipe.',
      },
      changes: ['+ ComponentScan reads @Service metadata', '+ BeanDefinition stored in Registry'],
      metrics: { coupling: 'Decoupled', lifecycle_phase: 'Scan Metadata', bean_scope: 'Blueprint', proxy_mode: 'None' },
      scene: {
        entities: {
          scan: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['ComponentScan'], sub: '@Service scan' }),
          reg: b(0, -10, { r: 2.2, h: 48, color: 'purple', label: ['BeanDef Map'], sub: 'metadata' }),
          ctx: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['AppContext'], sub: 'IoC container' }),
          card: S({ x: -12, y: 12 }, '2. Startup: Metadata Before Instantiation', [
            '1. Scan @Component / @Configuration classes',
            '2. Register BeanDefinition (class, scope, deps)',
            '3. Run BeanFactoryPostProcessors (resolve ${...})',
          ], { icon: 'terminal' }),
        },
        links: {
          sc_reg: h('scan', 'reg', ['scan', 'reg'], { heads: 'end', label: 'register' }),
          reg_ctx: h('reg', 'ctx', ['reg', 'ctx'], { heads: 'end', label: 'plan graph' }),
        },
        flows: [{ route: ['sc_reg', 'reg_ctx'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Constructor DI',
      chapter: 'ioc',
      title: '3. Instantiation & Constructor Injection',
      body: [
        'Spring resolves the dependency graph and injects <code>PaymentGateway</code> into <code>OrderService</code> via its constructor.',
        'Constructor injection guarantees <code>final</code> immutable fields, prevents half-initialized beans, and fails fast at startup on circular dependencies.',
      ],
      callout: {
        kind: 'tip',
        text: 'Prefer Constructor Injection over @Autowired field injection — fields can be final and tested without Spring.',
      },
      changes: ['+ BeanFactory instantiates leaves first', '+ Constructor injects final deps'],
      metrics: { coupling: 'Interface DI', lifecycle_phase: 'Instantiate', bean_scope: 'Singleton', proxy_mode: 'None' },
      scene: {
        entities: {
          ctx: d(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['AppContext'], sub: 'resolves DAG' }),
          gw: d(0, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['PaymentBean'], sub: 'created 1st' }),
          svc: d(14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['OrderService'], sub: 'final gw' }),
          card: S({ x: -12, y: 12 }, '3. Constructor Dependency Injection', [
            '@Service',
            'class OrderService {',
            '  private final PaymentGateway gw;',
            '  OrderService(PaymentGateway gw) { this.gw = gw; }',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          ctx_gw: h('ctx', 'gw', ['ctx', 'gw'], { heads: 'end', label: 'create' }),
          gw_svc: h('gw', 'svc', ['gw', 'svc'], { heads: 'end', label: 'inject arg' }),
        },
        flows: [{ route: ['ctx_gw', 'gw_svc'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'PostProcessor',
      chapter: 'lifecycle',
      title: '4. BeanPostProcessor & @PostConstruct Lifecycle',
      body: [
        'After properties are populated, Spring runs <code>BeanPostProcessor.postProcessBeforeInitialization()</code>, invokes <code>@PostConstruct</code>, and then runs <code>postProcessAfterInitialization()</code>.',
        'That final <code>AfterInitialization</code> hook is where Spring wraps beans in AOP / <code>@Transactional</code> proxies!',
      ],
      callout: {
        kind: 'insight',
        text: 'Because AOP proxies are created in postProcessAfterInitialization(), @PostConstruct runs on the raw bean BEFORE the proxy exists.',
      },
      changes: ['+ @PostConstruct runs initialization', '+ postProcessAfterInit wraps proxy'],
      metrics: { coupling: 'Interface DI', lifecycle_phase: 'PostProcess', bean_scope: 'Singleton', proxy_mode: 'AOP hook' },
      scene: {
        entities: {
          raw: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['Raw Bean'], sub: 'deps wired' }),
          init: d(0, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['@PostConstruct'], sub: 'init hook' }),
          bpp: d(14, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['BPP AfterInit'], sub: 'wrap proxy' }),
          card: S({ x: -12, y: 12 }, '4. Bean Initialization Pipeline', [
            '1. Instantiate & inject constructor args',
            '2. BPP.postProcessBeforeInitialization()',
            '3. @PostConstruct / InitializingBean',
            '4. BPP.postProcessAfterInitialization() -> Proxy!',
          ], { icon: 'terminal' }),
        },
        links: {
          r_in: h('raw', 'init', ['raw', 'init'], { heads: 'end', label: 'init()' }),
          in_bpp: h('init', 'bpp', ['init', 'bpp'], { heads: 'end', label: 'afterInit' }),
        },
        flows: [{ route: ['r_in', 'in_bpp'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Scopes',
      chapter: 'scopes',
      title: '5. Singleton Cache vs Prototype Scope',
      body: [
        'By default, every Spring bean is a <strong>Singleton</strong> (one shared instance per <code>ApplicationContext</code>, cached in <code>singletonObjects</code>).',
        'A <code>@Scope("prototype")</code> bean creates a brand-new instance on every <code>getBean()</code> call and Spring does NOT manage its <code>@PreDestroy</code>.',
      ],
      callout: {
        kind: 'warn',
        text: 'Never store mutable per-user state in a Singleton bean — concurrent HTTP threads will corrupt it!',
      },
      changes: ['+ Singleton cached in singletonObjects map', '+ Prototype creates fresh instance per ask'],
      metrics: { coupling: 'Stateless', lifecycle_phase: 'Cached / New', bean_scope: 'Singleton/Proto', proxy_mode: 'Direct' },
      scene: {
        entities: {
          ctx: d(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Singleton Map'], sub: '1 shared bean' }),
          c1: d(0, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Caller A & B'], sub: 'same ref' }),
          proto: d(14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['Prototype'], sub: 'new each call' }),
          card: S({ x: -12, y: 12 }, '5. Singleton vs Prototype Semantics', [
            '// Default: @Scope("singleton") -> 1 per AppContext',
            '// Must be thread-safe & stateless!',
            '@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)',
            'class JobRunner {} // new instance per injection/getBean',
          ], { icon: 'terminal' }),
        },
        links: {
          ctx_c: h('ctx', 'c1', ['ctx', 'c1'], { heads: 'end', label: 'shared ref' }),
          c_pr: h('c1', 'proto', ['c1', 'proto'], { heads: 'end', label: 'fresh copy' }),
        },
        flows: [{ route: ['ctx_c'], kind: 'res', rate: 1.9 }, { route: ['c_pr'], kind: 'req', rate: 1.5 }],
      },
    },
    {
      short: 'Scoped Proxy',
      chapter: 'scopes',
      title: '6. Request Scope Inside Singleton via Scoped Proxy',
      body: [
        'If a Singleton service injects a <code>@RequestScope</code> bean directly, the first request’s bean gets stuck forever!',
        '<code>@RequestScope</code> sets <code>proxyMode = TARGET_CLASS</code>: Spring injects a CGLIB <strong>Scoped Proxy</strong> that looks up the current HTTP thread’s <code>RequestAttributes</code> on every method call.',
      ],
      callout: {
        kind: 'insight',
        text: 'Scoped Proxy bridges mismatched lifetimes: Singleton parent -> Proxy -> current Request instance.',
      },
      changes: ['+ Scoped Proxy injected into Singleton', '+ Delegates per-thread to current Request'],
      metrics: { coupling: 'Scope-Safe', lifecycle_phase: 'Runtime Lookup', bean_scope: 'RequestScope', proxy_mode: 'Scoped CGLIB' },
      scene: {
        entities: {
          sing: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Singleton Svc'], sub: 'lives forever' }),
          px: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['Scoped Proxy'], sub: 'TARGET_CLASS' }),
          req: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['RequestCtx'], sub: 'per HTTP req' }),
          card: S({ x: -12, y: 12 }, '6. Bridging Singleton -> Request Scope', [
            '@Component',
            '@RequestScope // proxyMode = ScopedProxyMode.TARGET_CLASS',
            'class RequestContext { String traceId; }',
            '// Singleton holds CGLIB proxy -> resolves per thread',
          ], { icon: 'terminal' }),
        },
        links: {
          s_px: h('sing', 'px', ['sing', 'px'], { heads: 'end', label: 'getTraceId' }),
          px_rq: h('px', 'req', ['px', 'req'], { heads: 'end', label: 'thread local' }),
        },
        flows: [{ route: ['s_px', 'px_rq'], kind: 'res', rate: 2.0 }],
      },
    },
  ],
};
