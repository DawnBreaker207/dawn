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

export const javaSpringTestingLesson = {
  id: `java-spring-testing`,
  title: `Spring Testing Architecture & Context Caching`,
  summary: `High-velocity testing in Spring: TestContextManager, Context Caching, Test Slices (@WebMvcTest, @DataJpaTest), @MockBean pitfalls, and real-world Testcontainers.`,
  minutes: 15,
  level: `advanced`,
  metrics: ['test_mode', 'context_cache_hits', 'contexts_created', 'execution_time_ms', 'db_fidelity'],
  legend: ['req', 'res', ['ping', 'cached lookup'], 'fail'],
  goals: [
    { text: 'TestContextManager & TestExecutionListeners lifecycle', step: 0 },
    { text: 'ApplicationContext caching across test classes', step: 1 },
    { text: 'The @MockBean cache-busting penalty', step: 2 },
    { text: 'Slice testing (@WebMvcTest, @DataJpaTest)', step: 3 },
    { text: 'Testcontainers real Docker DB integration', step: 4 },
  ],
  steps: [
    {
      short: `TestContext`,
      chapter: `technique`,
      title: `TestContextManager & Test Execution Listeners`,
      body: [
        `The <strong>Spring TestContext Framework</strong> bootstraps Spring tests without hard-coding test runners.`,
        `<strong>TestExecutionListeners</strong> intercept test events: <code>ServletTestExecutionListener</code> (mocks web env), <code>DependencyInjectionTestExecutionListener</code> (wires @Autowired test fields), and <code>TransactionalTestExecutionListener</code> (rolls back DB changes automatically).`,
      ],
      callout: { kind: `insight`, text: '@Transactional on a test method automatically rolls back database mutations at test completion, ensuring pristine test isolation.' },
      metrics: { test_mode: 'TestContextManager', context_cache_hits: '0', contexts_created: '1', execution_time_ms: '820ms', db_fidelity: 'Rollback on finish' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Spring Test Execution Framework', [
            '@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)',
            'class OrderServiceTest {',
            '= @Autowired private TestRestTemplate restTemplate;',
            '= @Test void shouldCreateOrder() {',
            '=   var res = restTemplate.postForEntity("/api/orders", req, Order.class);',
            '=   assertEquals(HttpStatus.CREATED, res.getStatusCode());',
            '  }',
            '}',
          ]),
          test_runner: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['JUnit 5 Runner'], sub: 'OrderServiceTest.java' }),
          tc_mgr: d(0, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'workflow', label: ['TestContextManager'], sub: 'Coordinates Listeners' }),
          listeners: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'server', label: ['ExecutionListeners'], sub: 'DI, Tx Rollback, Dirties' }),
        },
        links: {
          rt: h('test_runner', 'tc_mgr', ['test_runner', 'tc_mgr'], { heads: 'end', label: 'beforeTestMethod()' }),
          tl: h('tc_mgr', 'listeners', ['tc_mgr', 'listeners'], { heads: 'end', label: 'trigger lifecycle' }),
        },
        flows: [
          { route: ['rt', 'tl'], bounce: false, rate: 2.0 },
        ],
      },
    },
    {
      short: `Caching`,
      chapter: `technique`,
      title: `ApplicationContext Caching Mechanism`,
      body: [
        `Starting a Spring context takes seconds. The TestContext framework uses a <strong>Context Cache</strong> keyed by configuration parameters (classes, active profiles, property sources, custom initializers).`,
        `When Class B has the exact same configuration key as Class A, Class B reuses the already running ApplicationContext! Test suites run in seconds instead of minutes.`,
      ],
      callout: { kind: `insight`, text: 'Context caching is the single most important factor for fast CI test suites in Spring Boot.' },
      metrics: { test_mode: 'Context Cache Hit', context_cache_hits: '12 hits (92%)', contexts_created: '1 total', execution_time_ms: '45ms', db_fidelity: 'In-memory / Clean' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'ApplicationContext Cache Key', [
            '# Spring hashes test configuration into a MergedContextConfiguration key:',
            '= Key: { locations, classes, activeProfiles, propertySourceProperties }',
            '= If Key matches existing cached context -> reused in 0ms!',
            '= Reusing 1 context across 500 tests cuts suite runtime from 5m to 20s',
          ]),
          test_suite: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['Test Class B, C, D...'], sub: 'Same @SpringBootTest config' }),
          cache_map: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'storage', label: ['ContextCache (Map)'], sub: 'Key: MergedTestConfig' }),
          active_ctx: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'server', label: ['Shared Context'], sub: 'Zero Startup Overhead' }),
        },
        links: {
          tc: h('test_suite', 'cache_map', ['test_suite', 'cache_map'], { heads: 'end', label: 'lookup key' }),
          ca: h('cache_map', 'active_ctx', ['cache_map', 'active_ctx'], { heads: 'end', label: 'reuse running instance' }),
        },
        flows: [
          { route: ['tc', 'ca'], bounce: true, rate: 2.2 },
        ],
      },
    },
    {
      short: `@MockBean`,
      chapter: `technique`,
      title: `The @MockBean Cache Busting Pitfall`,
      body: [
        `Adding <code>@MockBean FooService</code> to a test class alters the definition of the ApplicationContext.`,
        `Because the configuration key is now different, the cache produces a <strong>Cache Miss</strong>, forcing Spring to boot an entirely new ApplicationContext from scratch! Excess @MockBeans blow up CI build times.`,
      ],
      callout: { kind: `warning`, text: '@DirtiesContext or haphazard @MockBeans invalidate the context cache, triggering hundreds of expensive rebuilds.' },
      metrics: { test_mode: 'Cache Invalidation', context_cache_hits: '0 (Miss)', contexts_created: '8 created', execution_time_ms: '14,200ms', db_fidelity: 'Degraded build speed' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'The @MockBean Cache-Busting Trap', [
            'class PaymentTest {',
            '! @MockBean private StripeClient stripe; // Alters BeanDefinition!',
            '  // Spring CANNOT reuse the cached ApplicationContext!',
            '! // Forces a complete new context bootstrap (5-10 seconds penalty)',
            '}',
            '= Best practice: Group all @MockBean tests into a shared base class',
          ]),
          mock_test: d(-11, -4, { s: 3.8, h: 50, color: 'red', glyph: 'alert', label: ['OrderTestWithMock'], sub: '@MockBean PaymentClient' }),
          cache_inval: d(0, -4, { s: 3.8, h: 50, color: 'orange', glyph: 'workflow', label: ['Cache Key Altered'], sub: 'CACHE MISS!' }),
          new_context: d(11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'server', label: ['New AppContext'], sub: '+3,500ms startup penalty' }),
        },
        links: {
          mc: h('mock_test', 'cache_inval', ['mock_test', 'cache_inval'], { heads: 'end', label: 'new config key' }),
          cn: h('cache_inval', 'new_context', ['cache_inval', 'new_context'], { heads: 'end', label: 'boots new instance' }),
        },
        flows: [
          { route: ['mc'], bounce: false, rate: 1.5 },
          { route: ['cn'], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: `Test Slices`,
      chapter: `technique`,
      title: `Test Slices: Focused Layer Testing`,
      body: [
        `Rather than booting the entire application with <code>@SpringBootTest</code>, Test Slices bootstrap only specific components:`,
        `• <strong>@WebMvcTest:</strong> Boots only DispatcherServlet, Controllers, and JSON converters (no DB or Services).<br/>• <strong>@DataJpaTest:</strong> Boots only Entities, Repositories, and DataSource.<br/>• <strong>@JsonTest:</strong> Tests Jackson serializers in isolation.`,
      ],
      callout: { kind: `insight`, text: 'Test slices boot in ~300ms, making them ideal for TDD and rapid local unit-integration feedback.' },
      metrics: { test_mode: 'Test Slice (@WebMvcTest)', context_cache_hits: '1', contexts_created: '1 (minimal)', execution_time_ms: '280ms', db_fidelity: 'No DB loaded' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Fast Slice Testing (@WebMvcTest)', [
            '= @WebMvcTest(UserController.class)',
            'class UserControllerTest {',
            '= @Autowired private MockMvc mockMvc; // Only loads Web MVC layer',
            '  @MockBean private UserService userService;',
            '= @Test void testGet() throws Exception {',
            '=   mockMvc.perform(get("/api/users/1")).andExpect(status().isOk());',
            '= } // Boots in < 500ms; skips DB, JPA, Kafka!',
            '}',
          ]),
          controller_test: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['@WebMvcTest'], sub: 'Fast Controller Unit' }),
          slice_context: d(0, -4, { s: 3.8, h: 50, color: 'green', glyph: 'server', label: ['Sliced Context'], sub: 'Controllers & MockMvc Only' }),
          mock_mvc: d(11, -4, { s: 3.8, h: 50, color: 'purple', glyph: 'workflow', label: ['MockMvc Engine'], sub: 'In-memory HTTP asserts' }),
        },
        links: {
          cs: h('controller_test', 'slice_context', ['controller_test', 'slice_context'], { heads: 'end', label: 'starts slice' }),
          sm: h('slice_context', 'mock_mvc', ['slice_context', 'mock_mvc'], { heads: 'end', label: 'executes request' }),
        },
        flows: [
          { route: ['cs', 'sm'], bounce: true, rate: 2.0 },
        ],
      },
    },
    {
      short: `Testcontainers`,
      chapter: `technique`,
      title: `Integration Testing with Testcontainers`,
      body: [
        `In-memory databases like H2 have different SQL dialects and lack modern PostgreSQL features (JSONB, CTEs, Window functions).`,
        `<strong>Testcontainers</strong> spins up real Docker containers for PostgreSQL, Redis, and Kafka. Dynamic properties injection binds ports via <code>@DynamicPropertySource</code>.`,
      ],
      callout: { kind: `insight`, text: 'Using the Singleton Container pattern ensures all test classes share one Docker container, avoiding container reboot penalties.' },
      metrics: { test_mode: 'Testcontainers Integration', context_cache_hits: 'Shared container', contexts_created: '1 Docker instance', execution_time_ms: '1,100ms', db_fidelity: '100% Real Postgres' },
      scene: {
        entities: {
          card: S({ x: -4, y: 14 }, 'Testcontainers Real PostgreSQL DB', [
            '@Testcontainers',
            '@SpringBootTest',
            'class PostgresRepoTest {',
            '= @Container',
            '= static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16");',
            '= @DynamicPropertySource',
            '= static void configure(DynamicPropertyRegistry r) {',
            '=   r.add("spring.datasource.url", pg::getJdbcUrl);',
            '= } // 100% dialect fidelity, avoids H2 incompatibilities',
            '}',
          ]),
          test_suite: d(-11, -4, { s: 3.8, h: 50, color: 'blue', glyph: 'code', label: ['Integ.', 'Tests'], sub: '@DynamicPropertySource' }),
          docker_postgres: d(0, -4, { s: 3.8, h: 50, color: 'cyan', glyph: 'storage', label: ['Docker PostgreSQL'], sub: 'Real Postgres 16 Engine' }),
          app_context: d(11, -4, { s: 3.8, h: 50, color: 'green', glyph: 'server', label: ['Spring Boot Context'], sub: 'Hikari -> Dynamic Port' }),
        },
        links: {
          td: h('test_suite', 'docker_postgres', ['test_suite', 'docker_postgres'], { heads: 'end', label: 'docker start' }),
          da: h('docker_postgres', 'app_context', ['docker_postgres', 'app_context'], { heads: 'end', label: 'jdbc:postgresql://localhost:port' }),
        },
        flows: [
          { route: ['td'], bounce: false, rate: 1.5 },
          { route: ['da'], bounce: true, rate: 2.2 },
        ],
      },
    },
  ],
};
