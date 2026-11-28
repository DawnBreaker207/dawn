import { makeBlock, makeDb, makeLink, makePanel, cardAt, type Tag, type SceneOpts } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage: the ApplicationContext is the hub. Beans appear around it as the
// container scans, instantiates and wires them; Boot's auto-config then joins on
// the right and contributes a DataSource. Positions never change between steps.
//
//   BeanDef map ─┐            ┌─ HikariPool (DataSource)
//                └─ Context ──┤
//   Gateway ─────┘   │        └─ RequestCtx / AutoConfig
//         OrderService ── ScopedProxy / Environment

const ctx = (o: SceneOpts = {}) =>
  makeBlock(-1.5, 1.5, { s: 5.2, h: 56, color: `orange`, glyph: `layers`, label: [`Application`, `Context`], ...o });
const reg = (o: SceneOpts = {}) => makeDb(-16, 3, { r: 2.2, h: 46, color: `purple`, glyph: `listOrdered`, label: `BeanDefinitions`, ...o });
const gateway = (tags: Tag[] = [], o: SceneOpts = {}) =>
  makeBlock(-5.5, -13, { s: 4.4, h: 50, color: `green`, glyph: `creditCard`, label: [`Stripe`, `Gateway`], tags, ...o });
const svc = (tags: Tag[] = [], o: SceneOpts = {}) =>
  makeBlock(10.5, -18.5, { s: 4.4, h: 50, color: `green`, glyph: `code`, label: [`Order`, `Service`], tags, ...o });
const proxy = (tags: Tag[] = []) =>
  makeBlock(15.5, -7.5, { s: 4.4, h: 50, color: `orange`, glyph: `shield`, label: [`Scoped`, `proxy`], sub: `CGLIB`, tags });
const req = (tags: Tag[] = []) =>
  makeBlock(10, 10, { s: 4.4, h: 50, color: `green`, glyph: `user`, label: [`Request`, `Context`], sub: `@RequestScope`, tags });
const auto = (tags: Tag[] = []) =>
  makeBlock(10, 10, { s: 4.4, h: 50, color: `orange`, glyph: `sparkles`, label: [`AutoConfig`], sub: `140 candidates`, tags });
const env = (tags: Tag[] = []) =>
  makeDb(15.5, -7.5, { r: 2.2, h: 46, color: `purple`, glyph: `settings`, label: `Environment`, tags });
const dataSource = (tags: Tag[] = []) => makeDb(-6, 20, { r: 2.2, h: 46, glyph: `database`, label: `DataSource`, tags });

const links = {
  newCall: makeLink(`svc`, `gw`, [`svc`, `gw`], { label: `new()` }),
  scan: makeLink(`ctx`, `reg`, [`ctx`, `reg`], { heads: `both`, label: `register` }),
  scanQuiet: makeLink(`ctx`, `reg`, [`ctx`, `reg`], { heads: `both`, style: `off` }),
  makeGw: makeLink(`ctx`, `gw`, [`ctx`, `gw`], { label: `create` }),
  makeGwQuiet: makeLink(`ctx`, `gw`, [`ctx`, `gw`], { style: `off` }),
  makeSvc: makeLink(`ctx`, `svc`, [`ctx`, `svc`], { label: `create` }),
  makeSvcQuiet: makeLink(`ctx`, `svc`, [`ctx`, `svc`], { style: `off` }),
  inject: makeLink(`gw`, `svc`, [`gw`, `svc`], { label: `inject` }),
  injectQuiet: makeLink(`gw`, `svc`, [`gw`, `svc`]),
  callProxy: makeLink(`svc`, `proxy`, [`svc`, `proxy`], { label: `traceId()` }),
  resolve: makeLink(`proxy`, `req`, [`proxy`, `req`], { label: `this request` }),
  boot: makeLink(`auto`, `ctx`, [`auto`, `ctx`], { heads: `both`, label: `import` }),
  bootQuiet: makeLink(`auto`, `ctx`, [`auto`, `ctx`], { heads: `both`, style: `off` }),
  props: makeLink(`env`, `auto`, [`env`, `auto`], { label: `bind` }),
  propsQuiet: makeLink(`env`, `auto`, [`env`, `auto`]),
  createDs: makeLink(`auto`, `ds`, [`auto`, `ds`], { label: `@Bean` }),
  registerDs: makeLink(`ds`, `ctx`, [`ds`, `ctx`], { label: `bean` }),
};

const card = cardAt({ x: -1.5, y: 1.5, dx: -150, dy: -270 }, `code`);

/** Container core that exists from step 2 on. */
const core = (o: { ctx?: SceneOpts; gw?: Tag[]; svc?: Tag[] } = {}) => ({
  ctx: ctx(o.ctx),
  reg: reg(),
  gw: gateway(o.gw),
  svc: svc(o.svc),
});

export const javaSpringIocLesson: Lesson = {
  id: 'java-spring-ioc',
  title: 'Spring IoC, Bean Lifecycle & Boot Auto-Config',
  summary:
    'Watch one ApplicationContext scan, create and wire beans, wrap them in proxies, then let Spring Boot auto-configure a DataSource from the classpath and environment.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['definitions', 'beans', 'phase', 'proxies'],
  legend: [['req', 'scan / create'], ['res', 'inject / call'], ['fail', 'hard-wired new()']],
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
      short: 'new()',
      chapter: 'problem',
      title: 'Tight coupling with manual new()',
      body: [
        'Without IoC, <code>OrderService</code> directly instantiates <code>new StripeGateway()</code>, hard-coding the concrete class and making unit tests with mocks painful.',
        'Inversion of Control flips ownership: the Spring <code>ApplicationContext</code> creates, wires and manages objects (<strong>beans</strong>) for you.',
      ],
      callout: { kind: 'warn', text: 'Hard-coding new() inside services locks you to one implementation and scatters lifecycle setup.' },
      metrics: { definitions: 0, beans: 0, phase: 'manual', proxies: 0 },
      scene: {
        entities: {
          gw: gateway([{ text: 'hard-wired', tone: 'red' }]),
          svc: svc(),
          card: card('OrderService.java', [
            'class OrderService {',
            '  // can’t swap or mock this',
            '  private final PaymentGateway gw =',
            '      new StripeGateway();',
            '}',
          ]),
        },
        links: { newCall: links.newCall },
        flows: [{ route: ['newCall'], kind: 'fail', rate: 1.4 }],
      },
    },
    {
      short: 'Scan',
      chapter: 'setup',
      title: 'Component scan builds BeanDefinitions',
      body: [
        'At startup Spring scans packages for <code>@Component</code> / <code>@Service</code> / <code>@Repository</code> and records a blueprint — a <code>BeanDefinition</code> — for each, before instantiating anything.',
        '<code>BeanFactoryPostProcessor</code>s can inspect or change those blueprints (e.g. resolve <code>${...}</code> placeholders) before any bean is born.',
      ],
      callout: { kind: 'insight', text: 'BeanDefinition is the recipe; the live bean instance is created later from that recipe.' },
      changes: ['+ ApplicationContext', '+ BeanDefinition registry (2 entries)'],
      metrics: { definitions: 2, beans: 0, phase: 'scan', proxies: 0 },
      scene: {
        entities: {
          ctx: ctx(),
          reg: reg({ tags: [{ text: '2 definitions', tone: 'violet' }] }),
          gw: gateway([{ text: 'definition only', tone: 'gray' }], { dim: 1 }),
          svc: svc([{ text: 'definition only', tone: 'gray' }], { dim: 1 }),
          card: card('component scan', [
            '@SpringBootApplication // scans this package',
            'public class ShopApp { }',
            '',
            '@Service class OrderService { … }',
            '@Component class StripeGateway { … }',
          ]),
        },
        links: { scan: links.scan },
        flows: [{ route: ['scan'], kind: 'req', rate: 1.6 }],
      },
    },
    {
      short: 'Inject',
      chapter: 'solution',
      title: 'Instantiate leaves first, inject through constructors',
      body: [
        'Spring resolves the dependency graph: <code>StripeGateway</code> has no dependencies, so it is created first, then passed into <code>OrderService</code>’s constructor.',
        'Constructor injection gives <code>final</code> fields, never exposes a half-built bean, and fails fast at startup on a circular dependency.',
      ],
      callout: { kind: 'tip', text: 'Prefer constructor injection over @Autowired fields — fields can be final and tested without Spring.' },
      changes: ['+ StripeGateway created', '+ OrderService(gw) created'],
      metrics: { definitions: 2, beans: 2, phase: 'instantiate', proxies: 0 },
      scene: {
        entities: {
          ...core(),
          card: card('constructor injection', [
            '@Service',
            'class OrderService {',
            '  private final PaymentGateway gw;',
            '  OrderService(PaymentGateway gw) {',
            '    this.gw = gw; }',
            '}',
          ]),
        },
        links: { scan: links.scanQuiet, makeGw: links.makeGw, makeSvc: links.makeSvc, inject: links.inject },
        flows: [
          { route: ['makeGw'], kind: 'req', rate: 1.2 },
          { route: ['inject'], kind: 'res', rate: 1.4 },
        ],
      },
    },
    {
      short: 'Lifecycle',
      chapter: 'technique',
      title: 'BeanPostProcessors and @PostConstruct',
      body: [
        'After injection Spring runs <code>postProcessBeforeInitialization()</code>, then <code>@PostConstruct</code>, then <code>postProcessAfterInitialization()</code>.',
        'That last hook is where Spring swaps the bean for an AOP proxy (for <code>@Transactional</code>, <code>@Async</code>…). The context stores the proxy, not the raw object.',
      ],
      callout: { kind: 'insight', text: '@PostConstruct runs on the raw bean BEFORE the proxy exists — so @Transactional does not apply inside it.' },
      changes: ['~ OrderService: @PostConstruct ran', '~ OrderService wrapped in a proxy'],
      metrics: { definitions: 2, beans: 2, phase: 'post-process', proxies: 1 },
      scene: {
        entities: {
          ...core({
            svc: [
              { text: '@PostConstruct ✓', tone: 'green' },
              { text: 'wrapped: proxy', tone: 'amber', icon: 'shield' },
            ],
          }),
          card: card('init order', [
            '1 constructor(gw)',
            '2 BPP.postProcessBeforeInitialization',
            '3 @PostConstruct void warmUp()',
            '= 4 BPP.postProcessAfterInitialization → proxy',
          ]),
        },
        links: { scan: links.scanQuiet, makeGw: links.makeGwQuiet, makeSvc: links.makeSvc, inject: links.injectQuiet },
        flows: [{ route: ['makeSvc'], kind: 'req', rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'Scopes',
      chapter: 'insight',
      title: 'Singleton cache vs prototype',
      body: [
        'By default every bean is a <strong>singleton</strong>: one shared instance per context, cached in <code>singletonObjects</code>. Every caller gets the same reference.',
        'A <code>@Scope("prototype")</code> bean is created fresh on every injection or <code>getBean()</code>, and Spring does not call its <code>@PreDestroy</code>.',
      ],
      callout: { kind: 'warn', text: 'Never keep mutable per-user state in a singleton — concurrent request threads will share and corrupt it.' },
      changes: ['~ both beans: singleton, 1 instance each'],
      metrics: { definitions: 2, beans: 2, phase: 'ready', proxies: 1 },
      scene: {
        entities: {
          ...core({
            ctx: { tags: [{ text: 'singletonObjects: 2', tone: 'violet' }] },
            gw: [{ text: 'singleton ×1', tone: 'green' }],
            svc: [{ text: 'singleton ×1', tone: 'green' }],
          }),
          card: card('scopes', [
            '// default: one instance per context',
            '@Service class OrderService { }',
            '',
            '@Scope(SCOPE_PROTOTYPE) // new each time',
            '@Component class JobRunner { }',
          ]),
        },
        links: { scan: links.scanQuiet, makeGw: links.makeGwQuiet, makeSvc: links.makeSvcQuiet, inject: links.injectQuiet },
        flows: [{ route: ['inject'], kind: 'res', rate: 1.6 }],
      },
    },
    {
      short: 'Req scope',
      chapter: 'solution',
      title: 'Request scope inside a singleton via a scoped proxy',
      body: [
        'If a singleton injected a <code>@RequestScope</code> bean directly, the first request’s instance would be stuck in it forever.',
        '<code>@RequestScope</code> uses <code>proxyMode = TARGET_CLASS</code>: Spring injects a CGLIB <strong>scoped proxy</strong> that, on every call, looks up the instance bound to the current request thread.',
      ],
      callout: { kind: 'insight', text: 'Scoped proxy bridges lifetimes: singleton → proxy → the current request’s instance.' },
      changes: ['+ Scoped proxy', '+ RequestContext (one per request)'],
      metrics: { definitions: 3, beans: 3, phase: 'ready', proxies: 2 },
      scene: {
        entities: {
          ...core(),
          proxy: proxy([{ text: 'same ref forever', tone: 'gray' }]),
          req: req([{ text: 'req #8812', tone: 'green' }]),
          card: card('RequestContext.java', [
            '@Component',
            '@RequestScope // proxyMode = TARGET_CLASS',
            'class RequestContext { String traceId; }',
            '// OrderService holds the proxy',
          ]),
        },
        links: {
          scan: links.scanQuiet,
          makeGw: links.makeGwQuiet,
          makeSvc: links.makeSvcQuiet,
          inject: links.injectQuiet,
          callProxy: links.callProxy,
          resolve: links.resolve,
        },
        flows: [{ route: ['callProxy', 'resolve'], kind: 'res', rate: 1.6 }],
      },
    },
    {
      short: 'Boot',
      chapter: 'setup',
      title: '@SpringBootApplication turns on auto-config',
      body: [
        '<code>@SpringBootApplication</code> = <code>@SpringBootConfiguration</code> + <code>@ComponentScan</code> + <code>@EnableAutoConfiguration</code>.',
        'The last one imports Boot’s auto-configuration: ordinary <code>@Configuration</code> classes that add beans <em>for</em> you — but only when conditions say they should.',
      ],
      callout: { kind: 'insight', text: 'Spring Boot generates no magic code — it runs standard @Configuration classes gated by @Conditional checks.' },
      changes: ['− scoped-proxy demo', '+ AutoConfiguration import'],
      metrics: { definitions: 3, beans: 3, phase: 'boot', proxies: 1 },
      scene: {
        entities: {
          ...core(),
          auto: auto([{ text: 'starting', tone: 'gray' }]),
          card: card('ShopApp.java', [
            '@SpringBootApplication',
            'public class ShopApp {',
            '  public static void main(String[] a) {',
            '    SpringApplication.run(ShopApp.class, a);',
            '  } }',
          ]),
        },
        links: { scan: links.scanQuiet, makeGw: links.makeGwQuiet, makeSvc: links.makeSvcQuiet, inject: links.injectQuiet, boot: links.boot },
        flows: [{ route: ['boot'], kind: 'req', rate: 1.4 }],
      },
    },
    {
      short: 'Imports',
      chapter: 'technique',
      title: 'Candidates come from AutoConfiguration.imports',
      body: [
        '<code>AutoConfigurationImportSelector</code> reads <code>META-INF/spring/…AutoConfiguration.imports</code> from every starter JAR on the classpath.',
        'About 140 candidate classes are found (Tomcat, Jackson, DataSource, Security…). Most will be skipped in the next step.',
      ],
      callout: { kind: 'tip', text: 'Run with --debug (or GET /actuator/conditions) to see the report of what matched and what was skipped.' },
      changes: ['~ AutoConfig: 140 candidates queued'],
      metrics: { definitions: 3, beans: 3, phase: 'discover', proxies: 1 },
      scene: {
        entities: {
          ...core(),
          auto: auto([{ text: '140 candidates', tone: 'amber' }]),
          card: card('META-INF/spring/…imports', [
            'o.s.b.a.jdbc.DataSourceAutoConfiguration',
            'o.s.b.a.web.servlet.WebMvcAutoConfiguration',
            'o.s.b.a.jackson.JacksonAutoConfiguration',
            '# … ~140 lines across starters',
          ]),
        },
        links: { scan: links.scanQuiet, makeGw: links.makeGwQuiet, makeSvc: links.makeSvcQuiet, inject: links.injectQuiet, boot: links.boot },
        flows: [{ route: ['boot'], kind: 'req', rate: 2 }],
      },
    },
    {
      short: '@Cond',
      chapter: 'technique',
      title: '@ConditionalOnClass and @ConditionalOnMissingBean',
      body: [
        'Each candidate is gated: <code>@ConditionalOnClass(HikariDataSource.class)</code> needs the driver JAR; <code>@ConditionalOnMissingBean</code> backs off if you already defined that bean yourself.',
        'Opinionated defaults with a zero-friction override — that is the whole trick behind Spring Boot.',
      ],
      callout: { kind: 'insight', text: 'Boot backs off politely when you declare your own @Bean DataSource or ObjectMapper.' },
      changes: ['~ DataSource ✓ matched', '~ MongoDB ✗ skipped (no driver)'],
      metrics: { definitions: 3, beans: 3, phase: 'conditions', proxies: 1 },
      scene: {
        entities: {
          ...core(),
          auto: auto([
            { text: 'DataSource ✓', tone: 'green' },
            { text: 'Mongo ✗ no class', tone: 'red' },
          ]),
          card: card('DataSourceAutoConfiguration', [
            '@AutoConfiguration',
            '@ConditionalOnClass(HikariDataSource.class)',
            'class DataSourceAutoConfiguration {',
            '  @Bean @ConditionalOnMissingBean',
            '  DataSource dataSource(…) { … } }',
          ]),
        },
        links: { scan: links.scanQuiet, makeGw: links.makeGwQuiet, makeSvc: links.makeSvcQuiet, inject: links.injectQuiet, boot: links.bootQuiet },
        flows: [{ route: ['boot'], kind: 'req', rate: 1 }],
      },
    },
    {
      short: 'Env',
      chapter: 'technique',
      title: 'PropertySources: who wins',
      body: [
        'The <code>Environment</code> merges <code>PropertySource</code>s in strict order: <strong>CLI args &gt; OS env vars &gt; <code>application-{profile}.yml</code> &gt; <code>application.yml</code></strong>.',
        'Relaxed binding maps the env var <code>SPRING_DATASOURCE_URL</code> to <code>spring.datasource.url</code>.',
      ],
      callout: { kind: 'tip', text: 'Never commit production secrets to application.yml — inject them as env vars or from a secret store, which rank higher.' },
      changes: ['+ Environment (4 property sources)'],
      metrics: { definitions: 3, beans: 3, phase: 'environment', proxies: 1 },
      scene: {
        entities: {
          ...core(),
          auto: auto([{ text: 'DataSource ✓', tone: 'green' }]),
          env: env([{ text: 'env var wins', tone: 'green' }]),
          card: card('CLI / Env precedence', [
            '$ java -jar app.jar --spring.datasource.url=...  # CLI',
            '$ export SPRING_DATASOURCE_URL="jdbc:postgresql://..."  # env',
            '# application-prod.yml (profile)',
            '# application.yml (default)',
          ]),
        },
        links: { scan: links.scanQuiet, makeGw: links.makeGwQuiet, makeSvc: links.makeSvcQuiet, inject: links.injectQuiet, boot: links.bootQuiet, props: links.props },
        flows: [{ route: ['props'], kind: 'res', rate: 1.6 }],
      },
    },
    {
      short: 'Props',
      chapter: 'solution',
      title: 'Type-safe @ConfigurationProperties records',
      body: [
        'Instead of scattered <code>@Value("${…}")</code> strings, bind a whole prefix into an immutable <code>record</code> and validate it with <code>@Validated</code>.',
        'Missing or invalid config fails fast at startup with a clear error, not at 3 a.m. on the first request.',
      ],
      callout: { kind: 'insight', text: 'A @ConfigurationProperties record gives immutability, IDE autocomplete and @NotBlank validation at boot.' },
      changes: ['~ app.payment.* bound to PaymentProps'],
      metrics: { definitions: 4, beans: 4, phase: 'bind', proxies: 1 },
      scene: {
        entities: {
          ...core(),
          auto: auto([{ text: 'DataSource ✓', tone: 'green' }]),
          env: env([{ text: 'app.payment.* ✓', tone: 'green' }]),
          card: card('PaymentProps.java', [
            '@Validated',
            '@ConfigurationProperties("app.payment")',
            'record PaymentProps(',
            '  @NotBlank String apiKey,',
            '  @Positive Duration timeout) { }',
          ]),
        },
        links: { scan: links.scanQuiet, makeGw: links.makeGwQuiet, makeSvc: links.makeSvcQuiet, inject: links.injectQuiet, boot: links.bootQuiet, props: links.props },
        flows: [{ route: ['props'], kind: 'res', rate: 1.6 }],
      },
    },
    {
      short: 'Recap',
      chapter: 'recap',
      title: 'A ready DataSource, zero setup code',
      body: [
        'Boot found Postgres and HikariCP on the classpath, bound <code>spring.datasource.*</code> from the environment and registered a <code>HikariDataSource</code> bean in the same context as your beans.',
        'The context injects it wherever it is needed. The same JAR runs in dev, staging and prod — only the environment changes.',
      ],
      callout: { kind: 'insight', text: 'Auto-configuration + externalized config lets one build artifact run everywhere.' },
      changes: ['+ HikariDataSource bean'],
      metrics: { definitions: 5, beans: 5, phase: 'running', proxies: 1 },
      scene: {
        entities: {
          ...core(),
          auto: auto([{ text: 'DataSource ✓', tone: 'green' }]),
          env: env(),
          ds: dataSource([{ text: 'pool 10 ready', tone: 'green' }]),
          card: card('startup log', [
            'HikariPool-1 - Starting...',
            'HikariPool-1 - Added connection org.postgresql…',
            'Tomcat started on port 8080 (http)',
            '= Started ShopApp in 1.84 seconds',
          ]),
        },
        links: {
          scan: links.scanQuiet,
          makeGw: links.makeGwQuiet,
          makeSvc: links.makeSvcQuiet,
          inject: links.injectQuiet,
          boot: links.bootQuiet,
          props: links.propsQuiet,
          createDs: links.createDs,
          registerDs: links.registerDs,
        },
        flows: [
          { route: ['createDs'], kind: 'req', rate: 1.2 },
          { route: ['registerDs'], kind: 'res', rate: 1.2 },
        ],
      },
    },
  ],
};
