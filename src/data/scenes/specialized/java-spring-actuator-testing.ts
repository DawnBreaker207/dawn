import { STAGE, makeDb, makeLink, makePanel, distinctConcepts, type Tag, stageBlock, cardAt, linkOf, type SceneOpts } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage. Acts 1–2 are production: Kubernetes and Prometheus watch a Boot app. Acts 3–6
// are testing: a test runner on the left, the ApplicationContext (or a slice of it) in
// the middle, and what it talks to on the right. Same positions throughout.
//
//                    helper                    alt
//   caller ──── main (app / context) ───────── store

const positions = {
  caller: STAGE.caller,
  main: STAGE.main,
  store: STAGE.store,
  helper: STAGE.helper,
  alt: STAGE.alt,
};

const block = stageBlock;
const caller = (label: string[], sub: string, glyph: string, tags: Tag[] = []) =>
  block(positions.caller, { color: `blue`, glyph, label, sub, tags });
const main = (label: string[], sub: string, tags: Tag[] = [], glyph = `box`) =>
  block(positions.main, { color: `green`, glyph, label, sub, tags });
const store = (label: string, tags: Tag[] = []) =>
  makeDb(positions.store.x, positions.store.y, { r: 2.2, h: 46, glyph: `database`, label, tags });
const helper = (label: string[], sub: string, glyph: string, tags: Tag[] = []) =>
  block(positions.helper, { color: `orange`, glyph, label, sub, tags });
const alt = (label: string[], sub: string, tags: Tag[] = []) =>
  block(positions.alt, { color: `slab`, glyph: `route`, label, sub, tags });

const links = {
  call: (label?: string) => linkOf(`caller`, `main`, label),
  store: (label?: string) => linkOf(`main`, `store`, label),
  help: (label?: string) => ({ ...linkOf(`helper`, `main`, label, false), labelAt: 0.6 }),
  alt: makeLink(`caller`, `alt`, [`caller`, `alt`], { heads: `both`, style: `off` }),
};

/** Code card, parked bottom-left under the caller where nothing else lives. */
const card = cardAt({ x: positions.main.x, y: positions.main.y, dx: -250, dy: 150 }, `code`);

export const javaSpringActuatorTestingLesson: Lesson = distinctConcepts({
  id: 'java-spring-actuator-testing',
  title: 'Actuator & Test Context Cache',
  summary:
    'How Spring Boot tells Kubernetes and Prometheus about its health, and how its test framework caches the ApplicationContext — and what breaks that cache.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['endpoint', 'state', 'speed', 'scope'],
  legend: [[`req`, `request`], [`write`, `scrape / start`], [`fail`, `miss / down`]],
  goals: [
    { text: 'Separate Kubernetes liveness from readiness', step: 1 },
    { text: 'Export JVM and HTTP metrics with Micrometer', step: 2 },
    { text: 'Reuse the ApplicationContext through the test cache', step: 3 },
    { text: 'Spot what causes a context cache miss', step: 4 },
    { text: 'Isolate controller tests with @WebMvcTest', step: 5 },
    { text: 'Test against real Postgres with Testcontainers', step: 6 },
  ],
  steps: [
    {
      short: 'Probes',
      chapter: 'technique',
      title: 'Liveness restarts; readiness gates traffic',
      body: [
        `Kubernetes asks two different questions. <b>Liveness</b>: “is this process stuck?” — if not, kill and restart the pod. <b>Readiness</b>: “can it serve right now?” — if not, remove it from the Service but leave it running.`,
        `Spring Boot Actuator answers both at <code>/actuator/health/liveness</code> and <code>/actuator/health/readiness</code>. A pod that is still warming caches should be <em>live</em> but not <em>ready</em>; restarting it would only restart the warm-up.`,
      ],
      metrics: { endpoint: '/health', state: 'live, not ready', speed: 'n/a', scope: 'production' },
      scene: {
        entities: {
          caller: caller([`Kubernetes`], `kubelet`, `container`, [{ text: `probes every 10 s`, tone: `gray` }]),
          main: main([`Boot app`], `Actuator on`, [{ text: `liveness UP`, tone: `green` }, { text: `readiness DOWN`, tone: `amber` }], `heartPulse`),
          store: store(`dependencies`, [{ text: `cache warming…`, tone: `amber` }]),
          alt: alt([`Service`], `routes traffic`, [{ text: `pod excluded`, tone: `red` }]),
          card: card(`Pod spec`, [`livenessProbe:  { httpGet: { path: /actuator/health/liveness } }`, `readinessProbe: { httpGet: { path: /actuator/health/readiness } }`, `! liveness DOWN → restart pod`, `! readiness DOWN → no traffic, keep running`]),
        },
        links: { call: links.call(`GET /health`), store: links.store(`checks`) },
        flows: [{ route: ['call'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Micrometer',
      chapter: 'technique',
      title: 'Micrometer turns numbers into a scrape endpoint',
      body: [
        `<span class="term">Micrometer</span> is the metrics facade inside Boot: counters, timers and gauges for the JVM, HTTP server, datasource pool — and your own. It doesn’t care where they go.`,
        `Add the Prometheus registry, expose <code>/actuator/prometheus</code>, and Prometheus scrapes it on an interval. Tag by <em>low-cardinality</em> values (URI template, status) — never by user id.`,
      ],
      changes: [`+ Prometheus`, `+ meter registry`],
      metrics: { endpoint: '/prometheus', state: 'exporting', speed: 'n/a', scope: 'production' },
      scene: {
        entities: {
          caller: caller([`Grafana`], `dashboards`, `chart`, [{ text: `p95 latency`, tone: `green` }]),
          main: main([`Micrometer`], `facade`, [{ text: `JVM · HTTP · pool`, tone: `violet` }], `gauge`),
          store: store(`meter registry`, [{ text: `counters · timers`, tone: `gray` }]),
          helper: helper([`Prometheus`], `scrapes /30 s`, `activity`, [{ text: `pull model`, tone: `violet` }]),
          card: card(`Expose and read`, [`management.endpoints.web.exposure.include=health,prometheus`, `$ curl localhost:8080/actuator/prometheus`, `http_server_requests_seconds_count{uri="/orders",status="200"} 42`]),
        },
        links: { call: links.call(`queries`), store: links.store(`records`), help: links.help(`scrapes`) },
        flows: [{ route: ['help'], kind: 'write', rate: 1 }, { route: ['call'], rate: 1, bounce: true }],
      },
    },
    {
      short: 'Ctx cache',
      chapter: 'solution',
      title: 'Tests share one ApplicationContext',
      body: [
        `Starting a Spring context (scanning, wiring, auto-configuration, maybe a database) takes seconds. Doing it for every test class would make CI crawl.`,
        `The <span class="term">TestContext framework</span> caches each context under a key built from the configuration classes, profiles, properties and mocks. Test classes with an identical key <b>reuse</b> the running context — a cache hit costs about 10 ms.`,
      ],
      changes: [`+ context cache`, `~ test runner reuses context`],
      metrics: { endpoint: 'test runner', state: 'cache hit', speed: '~10 ms', scope: 'shared context' },
      scene: {
        entities: {
          caller: caller([`Test runner`], `JUnit 5`, `flask`, [{ text: `12 test classes`, tone: `gray` }]),
          main: main([`Application`, `Context`], `started once`, [{ text: `cache hit`, tone: `green`, icon: `shield` }], `boxes`),
          store: store(`context cache`, [{ text: `1 context`, tone: `green` }]),
          helper: helper([`cache key`], `classes · profiles`, `hash`, [{ text: `same key`, tone: `violet` }]),
          card: card(`What forms the key`, [`@SpringBootTest                // same config classes`, `@ActiveProfiles("test")        // same profiles`, `// same properties, same @MockitoBean set`, `= first class boots it; the next 11 reuse it`]),
        },
        links: { call: links.call(`runs tests`), store: links.store(`looks up`), help: links.help(`key`) },
        flows: [{ route: ['call'], rate: 1.6, bounce: true }],
      },
    },
    {
      short: 'Cache miss',
      chapter: 'problem',
      title: 'One different annotation, one more boot',
      body: [
        `Anything that changes the key forces a <b>second context</b>: a different <code>@ActiveProfiles</code>, extra <code>@TestPropertySource</code>, or a <code>@MockitoBean</code> that another class doesn’t declare. Each new combination boots again — about 3.5 s here.`,
        `Twenty classes with twenty ad-hoc mock sets means twenty startups. Keep a few shared base classes, and declare mocks in one place.`,
      ],
      changes: [`+ second context`, `+ @MockitoBean alt`],
      metrics: { endpoint: 'test runner', state: 'cache MISS', speed: '+3.5 s', scope: 'duplicated' },
      scene: {
        entities: {
          caller: caller([`Test runner`], `JUnit 5`, `flask`, [{ text: `class 7 of 12`, tone: `gray` }]),
          main: main([`Application`, `Context #2`], `booting…`, [{ text: `cache MISS`, tone: `red`, icon: `alert` }], `boxes`),
          store: store(`context cache`, [{ text: `2 contexts`, tone: `amber` }]),
          helper: helper([`cache key`], `different mocks`, `hash`, [{ text: `new key`, tone: `red` }]),
          alt: alt([`@MockitoBean`], `PaymentClient`, [{ text: `only in this class`, tone: `amber` }]),
          card: card(`A silent slowdown`, [`@SpringBootTest`, `class RefundTest { @MockitoBean PaymentClient pay; }`, `! different mock set → different key → new context`, `= move shared mocks into one abstract base class`]),
        },
        links: { call: links.call(`runs tests`), store: links.store(`stores #2`), help: links.help(`no match`) },
        flows: [{ route: ['store'], kind: 'fail', rate: 0.9 }],
      },
    },
    {
      short: 'Slice',
      chapter: 'solution',
      title: 'Test one layer: @WebMvcTest',
      body: [
        `If you only want to test a controller, don’t start the whole application. <code>@WebMvcTest</code> loads just the web layer — controllers, filters, converters — and gives you <code>MockMvc</code> to issue requests without a real server.`,
        `Services and repositories are replaced with mocks. The slice starts in ~200 ms and can be cached too. Other slices exist: <code>@DataJpaTest</code>, <code>@JsonTest</code>.`,
      ],
      changes: [`~ context: web slice only`, `+ MockMvc`, `− full context skipped`],
      metrics: { endpoint: 'MockMvc', state: 'web slice', speed: '~200 ms', scope: 'minimal' },
      scene: {
        entities: {
          caller: caller([`Test`], `MockMvc`, `flask`, [{ text: `no real server`, tone: `green` }]),
          main: main([`@WebMvcTest`], `controllers only`, [{ text: `~200 ms`, tone: `green`, icon: `zap` }], `filter`),
          store: store(`mocked service`, [{ text: `@MockitoBean`, tone: `violet` }]),
          helper: helper([`MockMvc`], `fake HTTP`, `route`, [{ text: `in-process`, tone: `gray` }]),
          alt: alt([`full context`], `skipped`, [{ text: `no DB · no beans`, tone: `gray` }]),
          card: card(`A fast controller test`, [`@WebMvcTest(OrderController.class)`, `class OrderControllerTest {`, `  @MockitoBean OrderService service;`, `  @Test void getsOrder() { mvc.perform(get("/orders/7")).andExpect(status().isOk()); }`, `}`]),
        },
        links: { call: links.call(`perform(get)`), store: links.store(`mock calls`), help: links.help(`dispatches`) },
        flows: [{ route: ['call'], rate: 1.6, bounce: true }],
      },
    },
    {
      short: 'Containers',
      chapter: 'recap',
      title: 'Real Postgres with Testcontainers',
      body: [
        `An in-memory H2 database behaves differently from production (types, locking, SQL dialect). <span class="term">Testcontainers</span> starts a throwaway <b>real Postgres</b> in Docker for the test run.`,
        `With <code>@ServiceConnection</code> (Boot 3.1+) Spring wires the datasource to the container’s random port automatically — no URL to configure. Make the container <code>static</code> so all tests share one.`,
      ],
      changes: [`+ Docker`, `~ store: real Postgres 16`, `+ @ServiceConnection`],
      metrics: { endpoint: 'Docker PG16', state: 'real SQL', speed: 'shared', scope: 'prod parity' },
      scene: {
        entities: {
          caller: caller([`Test`], `@DataJpaTest`, `flask`, [{ text: `real queries`, tone: `green` }]),
          main: main([`Application`, `Context`], `datasource wired`, [{ text: `@ServiceConnection`, tone: `violet` }], `boxes`),
          store: store(`Postgres 16`, [{ text: `container · random port`, tone: `green` }]),
          helper: helper([`Docker`], `starts container`, `container`, [{ text: `once per run`, tone: `gray` }]),
          card: card(`No URL needed`, [`@Container @ServiceConnection`, `static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16");`, `= Boot sets url, user and password from the container`]),
        },
        links: { call: links.call(`runs tests`), store: links.store(`real SQL`), help: links.help(`starts`) },
        flows: [{ route: ['store'], kind: 'write', rate: 1.2, bounce: true }, { route: ['help'], kind: 'write', rate: 0.8 }],
      },
    },
  ],
});
