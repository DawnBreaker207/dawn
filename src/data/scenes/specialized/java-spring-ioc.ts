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
  title: 'Spring IoC, Bean Lifecycle & Boot Auto-Config',
  summary:
    'Trace Spring IoC BeanDefinition scanning, Constructor DI, BeanPostProcessor, Scopes/Proxies, plus @SpringBootApplication, @Conditional evaluation & Starter auto-config.',
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
{ text: 'Trigger @EnableAutoConfiguration from @SpringBootApplication', step: 7 },
    { text: 'Load candidates from AutoConfiguration.imports', step: 8 },
    { text: 'Filter beans via @ConditionalOnClass & MissingBean', step: 9 },
    { text: 'Merge PropertySources hierarchy (Env > YAML)', step: 10 },
    { text: 'Bind immutable @ConfigurationProperties records', step: 11 },
    { text: 'Produce ready DataSource with user overrides', step: 12 },
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
          svc: d(-14, -14, { s: 4.8, h: 54, color: 'red', glyph: 'code', label: ['OrderService'], sub: 'new Stripe()' }),
          dep: d(2, -6, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['StripeGateway'], sub: 'hard-wired' }),
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
          scan: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['ComponentScan'], sub: '@Service scan' }),
          reg: b(0, -14, { r: 2.2, h: 48, color: 'purple', label: ['BeanDef Map'], sub: 'metadata' }),
          ctx: d(0, 0, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['AppContext'], sub: 'IoC container' }),
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
          ctx: d(-14, 0, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['AppContext'], sub: 'resolves DAG' }),
          gw: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['PaymentBean'], sub: 'created 1st' }),
          svc: d(0, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['OrderService'], sub: 'final gw' }),
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
          raw: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['Raw Bean'], sub: 'deps wired' }),
          init: d(0, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['@PostConstruct'], sub: 'init hook' }),
          bpp: d(0, 0, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['BPP AfterInit'], sub: 'wrap proxy' }),
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
          ctx: d(-14, 0, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Singleton Map'], sub: '1 shared bean' }),
          c1: d(-14, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Caller A & B'], sub: 'same ref' }),
          proto: d(0, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'layers', label: ['Prototype'], sub: 'new each call' }),
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
          sing: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Singleton Svc'], sub: 'lives forever' }),
          px: d(0, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['Scoped Proxy'], sub: 'TARGET_CLASS' }),
          req: d(0, 0, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['RequestCtx'], sub: 'per HTTP req' }),
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
{
      short: 'Boot Entry',
      chapter: 'autoconfig',
      title: '7. @SpringBootApplication Entry Point',
      body: [
        '<code>@SpringBootApplication</code> combines three annotations: <code>@SpringBootConfiguration</code>, <code>@ComponentScan</code>, and <code>@EnableAutoConfiguration</code>.',
        'Instead of writing hundreds of lines of XML or boilerplate <code>@Bean</code> factories, Spring Boot inspects your classpath and configures sensible defaults automatically.',
      ],
      callout: {
        kind: 'insight',
        text: 'Spring Boot does NOT generate magic code — it runs standard @Configuration classes gated by @Conditional checks.',
      },
      metrics: { boot_phase: 'Bootstrap', conditions: 'Pending', config_source: 'Main class', bean_status: 'Starting' },
      scene: {
        entities: {
          main: d(-14, -14, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['SpringApp.run'], sub: '@SpringBootApp' }),
          enable: d(2, -6, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['EnableAutoCfg'], sub: 'ImportSelector' }),
          card: S({ x: -12, y: 12 }, '1. @SpringBootApplication Composition', [
            '@SpringBootApplication // = 3 annotations:',
            '// 1. @SpringBootConfiguration',
            '// 2. @ComponentScan (your packages)',
            '// 3. @EnableAutoConfiguration (starter JARs)',
          ], { icon: 'terminal' }),
        },
        links: {
          m_en: h('main', 'enable', ['main', 'enable'], { heads: 'end', label: 'trigger' }),
        },
        flows: [{ route: ['m_en'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'imports File',
      chapter: 'autoconfig',
      title: '8. Reading AutoConfiguration.imports from Starters',
      body: [
        '<code>AutoConfigurationImportSelector</code> scans every JAR on the classpath for <code>META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports</code>.',
        'Over 140 candidate configuration classes (Tomcat, Jackson, DataSource, Security) are discovered, but most will be skipped if their libraries aren’t present.',
      ],
      callout: {
        kind: 'tip',
        text: 'Run with --debug (or /actuator/conditions) to see the exact Conditions Evaluation Report of what matched or skipped.',
      },
      changes: ['+ Scans all JARs for AutoConfiguration.imports', '+ ~140 candidate configs queued'],
      metrics: { boot_phase: 'Discovery', conditions: '140 candidates', config_source: 'Starter JARs', bean_status: 'Queued' },
      scene: {
        entities: {
          enable: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['ImportSelector'], sub: 'Boot 3.x' }),
          jars: b(0, -14, { r: 2.2, h: 48, color: 'purple', label: ['Starter JARs'], sub: '.imports file' }),
          cands: d(0, 0, { s: 4.8, h: 54, color: 'sky', glyph: 'layers', label: ['Candidates'], sub: '140 configs' }),
          card: S({ x: -12, y: 12 }, '2. Spring Boot 3 AutoConfiguration.imports', [
            '// META-INF/spring/...AutoConfiguration.imports',
            'org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration',
            'org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration',
          ], { icon: 'terminal' }),
        },
        links: {
          en_jr: h('enable', 'jars', ['enable', 'jars'], { heads: 'end', label: 'read META-INF' }),
          jr_cn: h('jars', 'cands', ['jars', 'cands'], { heads: 'end', label: 'load list' }),
        },
        flows: [{ route: ['en_jr', 'jr_cn'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: '@Conditional',
      chapter: 'autoconfig',
      title: '9. @ConditionalOnClass & @ConditionalOnMissingBean',
      body: [
        'Each candidate is filtered by conditions: <code>@ConditionalOnClass(HikariDataSource.class)</code> checks if the driver JAR exists; <code>@ConditionalOnMissingBean</code> backs off if you defined your own custom bean!',
        'This "opinionated defaults with zero-friction override" is the secret behind Spring Boot.',
      ],
      callout: {
        kind: 'insight',
        text: 'Spring Boot always backs off politely when you declare your own @Bean DataSource or ObjectMapper.',
      },
      changes: ['+ @ConditionalOnClass checks classpath', '+ @ConditionalOnMissingBean yields to user'],
      metrics: { boot_phase: 'Filter Match', conditions: 'Matched / Skip', config_source: 'Classpath', bean_status: 'Filtered' },
      scene: {
        entities: {
          cands: d(-14, 0, { s: 4.8, h: 54, color: 'sky', glyph: 'layers', label: ['Candidates'], sub: '140 configs' }),
          cond: d(-14, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'shield', label: ['@Conditional'], sub: 'Class + Bean' }),
          skip: d(0, -14, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Back-Off'], sub: 'user bean wins' }),
          card: S({ x: -12, y: 12 }, '3. Conditional Evaluation & Back-Off', [
            '@AutoConfiguration',
            '@ConditionalOnClass({ DataSource.class, HikariDataSource.class })',
            '@ConditionalOnMissingBean(DataSource.class) // backs off!',
            'public DataSource hikariDataSource(...) { ... }',
          ], { icon: 'terminal' }),
        },
        links: {
          cn_cd: h('cands', 'cond', ['cands', 'cond'], { heads: 'end', label: 'evaluate' }),
          cd_sk: h('cond', 'skip', ['cond', 'skip'], { heads: 'end', label: 'user exists' }),
        },
        flows: [{ route: ['cn_cd'], kind: 'req', rate: 1.8 }, { route: ['cd_sk'], kind: 'fail', rate: 1.3 }],
      },
    },
    {
      short: 'Config Order',
      chapter: 'config',
      title: '10. PropertySources Precedence & Profiles',
      body: [
        'Spring Environment merges configuration from multiple <code>PropertySource</code> layers in strict priority order: <strong>CLI args &gt; OS Env Vars &gt; <code>application-{profile}.yml</code> &gt; <code>application.yml</code></strong>.',
        'Relaxed binding automatically maps <code>SPRING_DATASOURCE_URL</code> (env var) to <code>spring.datasource.url</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Never commit production secrets in application.yml — inject them via Env Vars or Vault/K8s Secrets at higher precedence.',
      },
      changes: ['+ Env Vars override profile YAML', '+ Relaxed binding normalizes SNAKE_CASE'],
      metrics: { boot_phase: 'Env Merge', conditions: 'Active Profile', config_source: 'Env > YAML', bean_status: 'Resolved' },
      scene: {
        entities: {
          yml: b(-2, -16, { r: 2.2, h: 48, color: 'sky', label: ['app-prod.yml'], sub: 'tier 6 YAML' }),
          env: d(-2, -2, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['OS Env Vars'], sub: 'tier 3 wins!' }),
          reg: d(12, -9, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Environment'], sub: 'PropSources' }),
          card: S({ x: -12, y: 12 }, '4. Spring Boot Property Precedence', [
            '// Highest -> Lowest priority:',
            '// 1. CLI args: --server.port=9090',
            '// 2. OS Env:   SERVER_PORT=9090 (relaxed binding)',
            '// 3. Profile:  application-prod.yml',
            '// 4. Default:  application.yml',
          ], { icon: 'terminal' }),
        },
        links: {
          y_reg: h('yml', 'reg', ['yml', 'reg'], { heads: 'end', label: 'fallback' }),
          e_reg: h('env', 'reg', ['env', 'reg'], { heads: 'end', label: 'wins' }),
        },
        flows: [{ route: ['e_reg'], kind: 'res', rate: 2.0 }, { route: ['y_reg'], kind: 'req', rate: 1.3 }],
      },
    },
    {
      short: 'ConfigProps',
      chapter: 'config',
      title: '11. Type-Safe @ConfigurationProperties Binding',
      body: [
        'Instead of scattering fragile <code>@Value("${...}")</code> strings, bind an entire prefix into an immutable Java <code>record</code> with Bean Validation (<code>@Validated</code>).',
        'Invalid or missing required config fails fast at startup with a clear diagnostics banner.',
      ],
      callout: {
        kind: 'insight',
        text: '@ConfigurationProperties on a Java record gives immutability, IDE autocomplete, and @NotBlank validation at boot.',
      },
      changes: ['+ @ConfigurationProperties binds prefix', '+ @Validated fails fast on bad config'],
      metrics: { boot_phase: 'Bind Props', conditions: 'Validated', config_source: 'Typed Record', bean_status: 'Immutable' },
      scene: {
        entities: {
          reg: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Environment'], sub: 'app.payment.*' }),
          binder: d(0, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['Binder'], sub: 'validate types' }),
          rec: d(0, 0, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['PaymentProps'], sub: 'Java record' }),
          card: S({ x: -12, y: 12 }, '5. Immutable @ConfigurationProperties Record', [
            '@Validated',
            '@ConfigurationProperties(prefix = "app.payment")',
            'public record PaymentProps(',
            '  @NotBlank String apiKey,',
            '  @Positive Duration timeout) {}',
          ], { icon: 'terminal' }),
        },
        links: {
          r_bnd: h('reg', 'binder', ['reg', 'binder'], { heads: 'end', label: 'read keys' }),
          bnd_rc: h('binder', 'rec', ['binder', 'rec'], { heads: 'end', label: 'bind record' }),
        },
        flows: [{ route: ['r_bnd', 'bnd_rc'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Live Bean',
      chapter: 'autoconfig',
      title: '12. Auto-Configured DataSource Bean Ready',
      body: [
        'Putting it all together: Spring Boot detects Postgres + HikariCP on the classpath, binds <code>spring.datasource.*</code> from Env/YAML, and registers a production-ready <code>HikariDataSource</code> bean.',
        'Your <code>@Service</code> beans inject it immediately with zero manual setup.',
      ],
      callout: {
        kind: 'insight',
        text: 'Auto-configuration + externalized PropertySources lets the exact same JAR run in dev, staging, and prod.',
      },
      changes: ['+ HikariDataSource bean instantiated', '+ Ready for @Service & @Repository DI'],
      metrics: { boot_phase: 'Ready', conditions: 'All Passed', config_source: 'Bound', bean_status: 'Live HikariCP' },
      scene: {
        entities: {
          cond: d(-14, 0, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['AutoConfig'], sub: 'matched' }),
          ds: b(-14, -14, { r: 2.3, h: 50, color: 'green', label: ['HikariPool'], sub: 'live bean' }),
          app: d(0, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['OrderService'], sub: 'ready to serve' }),
          card: S({ x: -12, y: 12 }, '6. Final Result: Live Auto-Configured Stack', [
            '// Same JAR, zero code changes across environments:',
            '// 1. HikariDataSource auto-configured from Env Vars',
            '// 2. Injected into JdbcTemplate / EntityManager',
            '// 3. Tomcat listening on :8080 -> Ready!',
          ], { icon: 'terminal' }),
        },
        links: {
          cd_ds: h('cond', 'ds', ['cond', 'ds'], { heads: 'end', label: 'create @Bean' }),
          ds_ap: h('ds', 'app', ['ds', 'app'], { heads: 'end', label: 'inject' }),
        },
        flows: [{ route: ['cd_ds', 'ds_ap'], kind: 'res', rate: 2.0 }],
      },
    },
  ],
};
