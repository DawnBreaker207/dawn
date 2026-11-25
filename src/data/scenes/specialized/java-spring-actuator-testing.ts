/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaSpringActuatorTestingLesson: Lesson = {
  id: 'java-spring-actuator-testing',
  title: 'Actuator & Test Context Cache',
  summary:
    'Understand Spring Boot In Action production ops & testing: K8s liveness vs readiness probes, Micrometer metrics, @SpringBootTest Context Caching, @MockitoBean cache miss, and Testcontainers.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['ops_endpoint', 'probe_state', 'test_speed', 'context_cache'],
  legend: ['flow', ['req', 'probe / lookup'], ['res', 'cache hit / UP'], ['fail', '3.5s reboot']],
  goals: [
    { text: 'Separate K8s Liveness (restart) vs Readiness (traffic)', step: 1 },
    { text: 'Export JVM & HTTP telemetry via Micrometer Registry', step: 2 },
    { text: 'Reuse ApplicationContext via TestContext Cache Key', step: 3 },
    { text: 'Diagnose @MockitoBean cache-miss startup penalty', step: 4 },
    { text: 'Isolate fast controller tests with @WebMvcTest Slice', step: 5 },
    { text: 'Run real Postgres via Testcontainers @ServiceConnection', step: 6 },
  ],
  steps: [
    {
      short: 'K8s Probes',
      chapter: 'actuator',
      title: '1. Why Liveness != Readiness in Spring Boot Actuator',
      body: [
        'Actuator separates <code>/actuator/health/liveness</code> (is the JVM deadlocked?) from <code>/actuator/health/readiness</code> (are DB/Kafka connections ready for traffic?).',
        '<strong>Critical ops rule:</strong> NEVER tie DB health into Liveness — if Postgres hiccups for 5 seconds, Kubernetes would kill and restart ALL your healthy Pods in a crash loop!',
      ],
      callout: {
        kind: 'warn',
        text: 'DB/Redis down should fail READINESS (stop routing traffic), NOT LIVENESS (restarting the Pod won’t fix an external DB)!',
      },
      metrics: { ops_endpoint: '/actuator/health', probe_state: 'Live vs Ready', test_speed: 'N/A', context_cache: 'Prod Ops' },
      scene: {
        entities: {
          k8s: d(-12, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['K8s Kubelet'], sub: 'HTTP probes' }),
          live: d(2, -14, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['Liveness UP'], sub: 'JVM alive only' }),
          rdy: d(2, -2, { s: 4.8, h: 54, color: 'amber', glyph: 'alert', label: ['Readiness'], sub: 'checks DB/MQ' }),
          card: S({ x: -12, y: 12 }, '1. Kubernetes Probe Separation in Boot 3', [
            '// application.yml:',
            'management.endpoint.health.probes.enabled: true',
            '// Liveness:  ping + livenessState  (restart if DOWN)',
            '// Readiness: readinessState + db + redis (drop traffic)',
          ], { icon: 'terminal' }),
        },
        links: {
          k_lv: h('k8s', 'live', ['k8s', 'live'], { heads: 'end', label: 'live' }),
          k_rd: h('k8s', 'rdy', ['k8s', 'rdy'], { heads: 'end', label: '/readiness' }),
        },
        flows: [{ route: ['k_lv'], kind: 'res', rate: 1.8 }, { route: ['k_rd'], kind: 'req', rate: 1.6 }],
      },
    },
    {
      short: 'Micrometer',
      chapter: 'actuator',
      title: '2. Micrometer Facade & /actuator/prometheus',
      body: [
        'Micrometer is "SLF4J for metrics": Spring Boot auto-instruments HTTP latency histograms (<code>http.server.requests</code>), HikariCP pool usage, and JVM GC pauses.',
        '<code>/actuator/prometheus</code> exposes these counters/timers for Prometheus scraping, and Spring Boot 3’s <code>@Observed</code> adds OpenTelemetry traces + metrics together.',
      ],
      callout: {
        kind: 'tip',
        text: 'Never put unbounded high-cardinality values (like userId or orderId) into Micrometer metric tags — it explodes Prometheus RAM!',
      },
      changes: ['+ Auto-instruments HTTP, HikariCP, JVM GC', '+ Low-cardinality tags exported to Prometheus'],
      metrics: { ops_endpoint: '/prometheus', probe_state: 'Exporting', test_speed: 'N/A', context_cache: 'Observability' },
      scene: {
        entities: {
          app: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['Spring App'], sub: '@Observed HTTP' }),
          mic: d(0, -14, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['Micrometer'], sub: 'MeterRegistry' }),
          prom: b(0, 0, { r: 2.2, h: 48, color: 'green', label: ['Prometheus'], sub: 'scrape /metric' }),
          card: S({ x: -12, y: 12 }, '2. Vendor-Neutral Metrics with Micrometer', [
            '// Auto-recorded: http.server.requests, hikaricp.connections',
            'meterRegistry.counter("orders.created", "tier", "pro")',
            '  .increment(); // NEVER put userId in tag values!',
          ], { icon: 'terminal' }),
        },
        links: {
          ap_mc: h('app', 'mic', ['app', 'mic'], { heads: 'end', label: 'record()' }),
          mc_pr: h('mic', 'prom', ['mic', 'prom'], { heads: 'end', label: 'scrape' }),
        },
        flows: [{ route: ['ap_mc', 'mc_pr'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Context Cache',
      chapter: 'testing',
      title: '3. How @SpringBootTest Context Caching Speeds Up CI',
      body: [
        'Booting a full <code>@SpringBootTest</code> takes 2–5 seconds. To avoid rebooting per test class, Spring Test hashes the configuration into a <strong>MergedContextConfiguration</strong> cache key.',
        'Two test classes with the exact same config/profiles reuse the <strong>same running ApplicationContext</strong> in ~10 ms!',
      ],
      callout: {
        kind: 'insight',
        text: 'Default context cache holds 32 contexts. Consistent test annotations keep CI fast!',
      },
      changes: ['+ MergedContextConfig builds cache key', '+ Matching test classes share 1 Context'],
      metrics: { ops_endpoint: 'TestRunner', probe_state: 'Cache Hit', test_speed: '~10ms reuse', context_cache: 'Shared BeanCtx' },
      scene: {
        entities: {
          t1: d(-14, 0, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Test A & B'], sub: 'same @BootTest' }),
          cache: b(-14, -14, { r: 2.2, h: 48, color: 'green', label: ['ContextCache'], sub: 'MergedCfgKey' }),
          ctx: d(0, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['1 AppContext'], sub: '0ms reboot!' }),
          card: S({ x: -12, y: 12 }, '3. Spring TestContext Caching', [
            '@SpringBootTest // TestA & TestB share 1 context!',
            '// Cache key = classes + profiles + properties + mocks',
            '// Beware: @DirtiesContext evicts and forces full reboot!',
          ], { icon: 'terminal' }),
        },
        links: {
          t_ch: h('t1', 'cache', ['t1', 'cache'], { heads: 'end', label: 'lookup key' }),
          ch_cx: h('cache', 'ctx', ['cache', 'ctx'], { heads: 'end', label: 'reuse bean' }),
        },
        flows: [{ route: ['t_ch', 'ch_cx'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'MockBean Miss',
      chapter: 'testing',
      title: '4. Why @MockitoBean / @ActiveProfiles Causes Cache Miss',
      body: [
        'Adding <code>@MockitoBean</code> (formerly <code>@MockBean</code>) or a different <code>@TestPropertySource</code> on one test class changes its <code>MergedContextConfiguration</code> key!',
        'Spring boots a <strong>brand-new ApplicationContext</strong> (+3.5 seconds and extra RAM) for every unique combination of mocks.',
      ],
      callout: {
        kind: 'warn',
        text: 'Put shared @MockitoBean declarations in a single AbstractIntegrationTest base class so all subclasses share 1 cached context.',
      },
      changes: ['+ @MockitoBean alters Context Cache key', '+ Forces +3.5s full context reboot'],
      metrics: { ops_endpoint: 'TestRunner', probe_state: 'Cache Miss!', test_speed: '+3.5s reboot', context_cache: 'Duplicated' },
      scene: {
        entities: {
          mock: d(-14, -14, { s: 4.8, h: 54, color: 'amber', glyph: 'alert', label: ['@MockitoBean'], sub: 'unique key!' }),
          miss: d(0, -14, { s: 4.8, h: 54, color: 'red', glyph: 'cpu', label: ['Cache Miss'], sub: 'new Context' }),
          boot: d(0, 0, { s: 4.8, h: 54, color: 'red', glyph: 'layers', label: ['Reboot +3.5s'], sub: 'extra HikariCP' }),
          card: S({ x: -12, y: 12 }, '4. Avoiding Context Cache Thrashing', [
            '// BAD: different @MockitoBean in 20 test classes = 20 boots!',
            '// GOOD: centralize mocks in BaseIntegrationTest',
            '// or use MockitoExtension (@ExtendWith) for unit tests!',
          ], { icon: 'terminal' }),
        },
        links: {
          mk_ms: h('mock', 'miss', ['mock', 'miss'], { heads: 'end', label: 'key diff' }),
          ms_bt: h('miss', 'boot', ['miss', 'boot'], { heads: 'end', label: 'reboot' }),
        },
        flows: [{ route: ['mk_ms', 'ms_bt'], kind: 'fail', rate: 1.7 }],
      },
    },
    {
      short: '@WebMvcTest',
      chapter: 'testing',
      title: '5. Fast Sliced Testing with @WebMvcTest & MockMvc',
      body: [
        'To test controller routing, <code>@Valid</code> rules, Jackson serialization, and <code>@RestControllerAdvice</code>, you don’t need Postgres or Services!',
        '<code>@WebMvcTest(OrderController.class)</code> boots ONLY the Web MVC slice (~200 ms) and injects <code>MockMvc</code> for in-memory HTTP assertions.',
      ],
      callout: {
        kind: 'tip',
        text: 'Use @WebMvcTest for web layer, @DataJpaTest for SQL/JPA queries, and reserve @SpringBootTest for end-to-end flows.',
      },
      changes: ['+ @WebMvcTest skips DB & Service beans', '+ MockMvc runs in-memory HTTP checks'],
      metrics: { ops_endpoint: 'MockMvc', probe_state: 'Web Slice', test_speed: '~200ms fast', context_cache: 'Minimal' },
      scene: {
        entities: {
          slice: d(-14, 0, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['@WebMvcTest'], sub: 'web slice only' }),
          mvc: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'code', label: ['MockMvc'], sub: 'in-mem HTTP' }),
          ctrl: d(0, -14, { s: 4.8, h: 54, color: 'sky', glyph: 'layers', label: ['OrderCtrl'], sub: '@Valid + JSON' }),
          card: S({ x: -12, y: 12 }, '5. Fast Controller Testing Without DB', [
            '@WebMvcTest(OrderController.class)',
            'class OrderControllerTest {',
            '  @Autowired MockMvc mvc;',
            '  @MockitoBean OrderService svc;',
            '  // mockMvc.perform(post("/api/orders")...).andExpect(status().isBadRequest())',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          sl_mv: h('slice', 'mvc', ['slice', 'mvc'], { heads: 'end', label: 'boot ~200ms' }),
          mv_ct: h('mvc', 'ctrl', ['mvc', 'ctrl'], { heads: 'end', label: 'POST JSON' }),
        },
        flows: [{ route: ['sl_mv', 'mv_ct'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'Testcontainers',
      chapter: 'testing',
      title: '6. Real Postgres via Testcontainers @ServiceConnection',
      body: [
        'H2 in-memory DB lies about Postgres-specific SQL (JSONB, <code>FOR UPDATE</code>, sequences). <strong>Testcontainers</strong> spins up a real Docker Postgres 16 container per test run.',
        'In Spring Boot 3.1+, <code>@ServiceConnection</code> automatically wires the container’s dynamic port & credentials into <code>DataSource</code> with zero <code>@DynamicPropertySource</code> boilerplate!',
      ],
      callout: {
        kind: 'insight',
        text: 'Make the @Container static (Singleton Container pattern) so all tests share 1 Postgres container instead of restarting Docker.',
      },
      changes: ['+ Docker spins real Postgres 16', '+ @ServiceConnection auto-wires DataSource'],
      metrics: { ops_endpoint: 'Docker PG16', probe_state: 'Real SQL', test_speed: 'Static reuse', context_cache: 'Prod parity' },
      scene: {
        entities: {
          tc: d(-14, -14, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['Testcontainer'], sub: '@ServiceConn' }),
          pg: b(0, -14, { r: 2.2, h: 48, color: 'green', label: ['Postgres 16'], sub: 'Docker port' }),
          app: d(0, 0, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['@SpringBootTest'], sub: 'real SQL pass' }),
          card: S({ x: -12, y: 12 }, '6. Zero-Boilerplate Testcontainers (Boot 3.1+)', [
            '@Testcontainers @SpringBootTest',
            'class OrderIntegrationTest {',
            '  @Container @ServiceConnection',
            '  static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16");',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          tc_pg: h('tc', 'pg', ['tc', 'pg'], { heads: 'end', label: 'start PG16' }),
          pg_ap: h('pg', 'app', ['pg', 'app'], { heads: 'end', label: 'auto-wire DS' }),
        },
        flows: [{ route: ['tc_pg', 'pg_ap'], kind: 'res', rate: 1.9 }],
      },
    },
  ],
};
