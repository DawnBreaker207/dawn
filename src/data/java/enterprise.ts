import type { SimCase, VizCfg } from '@/scripts/lab/java/sim-engine';

export const ENTERPRISE_CASES: Record<string, SimCase[]> = {
  ioc: [
    {
      label: '⚙ full lifecycle',
      steps: [
        { log: 'refresh() → scan → 4 BeanDefinitions', explain: 'Configuration becomes metadata; no bean exists yet.', tone: 'info' },
        { log: 'billing: instantiate ctor(BillingPaymentRepo)', explain: 'A dependency cycle would throw HERE — constructor injection refuses circular graphs.', tone: 'info' },
        { log: 'populate @Autowired fields (reflection)', explain: 'Setter/field injection happens after construction — immutability requires the ctor variant.', tone: 'info' },
        { log: 'Aware → BPP.before', explain: 'BeanPostProcessors are the extension spine of the whole framework.', tone: 'info' },
        { log: '@PostConstruct warms caches', explain: 'Injection done, dependencies live — init hooks fire before serving.', tone: 'info' },
        { log: 'BPP.after → bean replaced by $Proxy24 in the map', explain: 'ALL global advice (@Transactional/@Async/Security) attaches right here.', tone: 'warn' },
        { log: 'singleton pool READY · 4/4', explain: 'Every getByType from now on returns the proxy, never the raw class.', tone: 'info' },
      ],
    },
    {
      label: '↻ circular dep',
      steps: [
        { log: 'A ctor needs B, B ctor needs A', explain: 'Constructor graphs cannot bootstrap a cycle — there is no first bean.', tone: 'warn' },
        { log: 'refresh() → BeanCurrentlyInCreationException', explain: 'Fails at startup, never in production traffic — exactly what you want.', tone: 'error' },
        { log: 'fix: @Lazy proxy on one side · or split the boundary', explain: 'A lazy proxy defers the knot; an event dissolves it properly.', tone: 'info' },
        { log: 'beware: field injection hides cycles instead', explain: 'It defers failures to runtime and weakens tests.', tone: 'warn' },
      ],
    },
    {
      label: '🐢 @Lazy startup',
      steps: [
        { log: 'ctx.refresh() skips the @Lazy definition', explain: 'Instantiation is deferred until the first touch.', tone: 'info' },
        { log: 'first client call → bean built on demand', explain: 'Startup time shrinks; the cost moves to first use.', tone: 'info' },
        { log: 'beware: broken lazy beans surface mid-traffic', explain: 'Boot failures become runtime failures — tradeoff worth naming.', tone: 'warn' },
      ],
    },
  ],
  scope: [
    {
      label: '🔁 singleton shared',
      steps: [
        { log: 'ctx.getBean(BillingService.class) first call', explain: 'Spring instantiates the bean once and stores it in the singleton pool indexed by type/name.', tone: 'info' },
        { log: 's1 = ctx.getBean(BillingService.class)', explain: 'Returns the pooled instance; no new object is created.', tone: 'info' },
        { log: 's2 = ctx.getBean(BillingService.class)', explain: 'Returns the SAME pooled instance — same object identity.', tone: 'info' },
        { log: 's1 == s2 → true (same instance, same ID)', explain: 'Singleton scope guarantees one shared instance per ApplicationContext for the bean\'s lifetime.', tone: 'info' },
        { log: 'BillingService$$EnhancerBySpringCGLib$xxxx1 lives once in the singleton pool', explain: 'If wrapped by a proxy (@Transactional), the proxy is the singleton — the raw class lives inside it.', tone: 'info' },
        { log: 'state mutation on s1 visible to s2 — share carefully', explain: 'All callers share mutable state; field-level concurrency bugs are the classic singleton pitfall.', tone: 'warn' },
      ],
    },
    {
      label: '🆕 prototype fresh',
      steps: [
        { log: '@Scope(PROTOTYPE) → new instance per getBean()', explain: 'Spring creates a brand-new object every time the bean is requested or injected.', tone: 'info' },
        { log: 'id1 = BillingService@7f3d9c2 · id2 = BillingService@4a1b2c3 — different', explain: 'Different heap addresses confirm two separate instances; no state is shared.', tone: 'info' },
        { log: 'Spring injects · then FORGETS it — no lifecycle management after creation', explain: 'Unlike singletons, Spring does not track prototype beans after handing them out.', tone: 'warn' },
        { log: '@PostConstruct runs · @PreDestroy NEVER fires for prototype', explain: 'Init callbacks run, but the container never calls destroy — callers own the cleanup.', tone: 'warn' },
        { log: 'prototype leaks into singleton = classic scope widening bug', explain: 'Injecting a prototype into a singleton field freezes it — the singleton holds one prototype forever.', tone: 'error' },
      ],
    },
    {
      label: '🕸 scope widening',
      steps: [
        { log: 'singleton OrderService @Autowired BillingService (PROTOTYPE)', explain: 'Spring injects the prototype once when the singleton is created — that one instance is captured forever.', tone: 'warn' },
        { log: 'every call through OrderService uses the SAME BillingService instance', explain: 'Widening defeats the prototype intent — the prototype behaves like a singleton inside the singleton.', tone: 'error' },
        { log: 'fix: @Lookup or ObjectProvider<Proto> or scoped proxy', explain: '@Lookup forces Spring to create a new prototype on every call; ObjectProvider.getObject() does the same.', tone: 'info' },
        { log: '@Scope(proxyMode = TARGET_CLASS) wraps prototype in a singleton-shaped proxy', explain: 'The proxy IS a singleton in the context map but delegates every call to a freshly created prototype.', tone: 'info' },
        { log: 'proxy IS a singleton in the context map — widening closed', explain: 'Callers hold one stable proxy reference while underlying instances are created per call — the widening trap is gone.', tone: 'info' },
      ],
    },
  ],
  aop: [
    {
      label: '💳 transaction path',
      steps: [
        { log: 'caller → $Proxy24.place(order)', explain: 'The caller holds a SPRING-BUILT proxy, not your class instance.', tone: 'info' },
        { log: 'BEFORE: begin tx (READ_COMMITTED)', explain: 'TransactionInterceptor carries the @Transactional semantics.', tone: 'info' },
        { log: 'invocation.proceed() → raw place(order)', explain: 'The proxy delegates into the real object exactly once.', tone: 'info' },
        { log: 'repo.save() — 1 INSERT', explain: 'Plain business code runs as if nothing wrapped it.', tone: 'info' },
        { log: 'no unchecked exception → COMMIT', explain: 'Default rollback = unchecked only; checked exceptions need rollbackFor.', tone: 'info' },
        { log: 'connection returns to Hikari pool', explain: 'Resources recycle; the proxy is invisible to the caller.', tone: 'info' },
      ],
    },
    {
      label: '🕳 self-invocation',
      steps: [
        { log: 'place() calls this.audit() internally', explain: 'this = the RAW instance, not the proxy the world sees.', tone: 'warn' },
        { log: 'audit() executes with 0 interceptors', explain: 'No proxy tier, no tx, no retries, no logging advice.', tone: 'error' },
        { log: 'shadow failure: code LOOKS transactional but is not', explain: 'The annotation sits there; the behavior silently differs.', tone: 'error' },
        { log: 'fix: self-inject the proxy · or split beans', explain: 'Self-injection is ugly but honest; boundary beans are cleaner.', tone: 'info' },
      ],
    },
    {
      label: '💥 rollback',
      steps: [
        { log: 'place() throws IllegalStateException mid-save', explain: 'A business rule blows up while writes are in flight.', tone: 'error' },
        { log: 'ROllBACK — INSERT undone · connection recycled', explain: 'The tx boundary held: all-or-nothing at the database.', tone: 'info' },
        { log: 'exception rethrown unwrapped to the caller', explain: 'The proxy never hides your failure from the client.', tone: 'info' },
        { log: 'checked exceptions pass WITHOUT rollback', explain: 'The #1 @Transactional surprise in code review — set rollbackFor explicitly.', tone: 'warn' },
      ],
    },
  ],
  jpa: [
    {
      label: '🎯 fetch-join read',
      steps: [
        { log: 'repo.findWithItems(42) → SimpleJpaRepository proxy', explain: 'Spring proxies your interface and routes the call by method contract.', tone: 'info' },
        { log: 'JPQL → Criteria → SQL build', explain: 'Derived queries parse from method names; @Query passes through as written.', tone: 'info' },
        { log: 'JDBC 1 roundtrip · Order + 2 items hydrated', explain: 'join fetch loads the graph in one SELECT instead of N+1.', tone: 'info' },
        { log: 'L1 cache stores entity + children', explain: 'The persistence context dedupes later loads of the same ids.', tone: 'info' },
        { log: 'o.addQty(2) — dirty against the snapshot', explain: 'Mutation marks the entity dirty; no SQL flies yet.', tone: 'warn' },
        { log: 'tx commit → flush dirty-check → exactly 1 UPDATE', explain: 'Hibernate diffs snapshot vs current state at flush.', tone: 'info' },
      ],
    },
    {
      label: '🧨 N+1',
      steps: [
        { log: 'orders.find50() — the parent query returns 50 rows', explain: 'One roundtrip so far — innocent looking.', tone: 'info' },
        { log: 'loop o.getCustomer().getName() → proxy init (per order)', explain: 'Every lazy proxy init is its own SELECT.', tone: 'warn' },
        { log: 'total 51 roundtrips', explain: '862 ms waiting on the network, under 3 ms executing.', tone: 'error' },
        { log: 'indexes cannot fix what is an access-PATTERN bug', explain: 'Batch fetching / join fetch / @EntityGraph collapses it back to 1.', tone: 'info' },
      ],
    },
    {
      label: '💾 dirty write',
      steps: [
        { log: 'findWithItems(42) → L1 snapshot saved', explain: 'The context stores a byte-for-byte snapshot at load.', tone: 'info' },
        { log: 'setAmount(99) — SQL NOT sent yet', explain: 'Writes accumulate in memory; queries still see the old state until flush.', tone: 'info' },
        { log: 'flush: snapshot diff → 1 UPDATE', explain: 'Exactly the changed columns go out at commit time.', tone: 'info' },
        { log: 'benefit: N scattered writes collapse into one boundary', explain: 'Coalescing is the point of the write-behind design.', tone: 'info' },
      ],
    },
  ],
  security: [
    {
      label: '✅ authenticated flow',
      steps: [
        { log: 'POST /api/admin/burn enters the filter chain', explain: 'Filters run BEFORE any controller — security failures never touch MVC.', tone: 'info' },
        { log: 'CsrfFilter passes (stateless APIs)', explain: 'Disabled CSRF for token-based APIs — session cookies need it.', tone: 'info' },
        { log: 'JwtAuthFilter: HMAC valid · exp valid → principal=admin', explain: 'The token IS the identity artifact — no session lookup.', tone: 'info' },
        { log: 'ProviderManager → DaoAuthenticationProvider', explain: 'The manager delegates to providers by token type.', tone: 'info' },
        { log: 'UserDetailsService loads user · bcrypt matches', explain: 'bcrypt is deliberately slow per call — that is the offline-cracking defense.', tone: 'info' },
        { log: 'SecurityContextHolder set', explain: 'Request-scoped ThreadLocal holding the authenticated principal.', tone: 'info' },
        { log: 'AuthorizationFilter ROLE_ADMIN ✓ → controller', explain: 'Method/URL rules evaluate against the stored context.', tone: 'info' },
      ],
    },
    {
      label: '🚫 wrong password',
      steps: [
        { log: 'DaoAuthProvider loads UserDetails', explain: 'The path matches success right up to the hash check.', tone: 'info' },
        { log: 'bcrypt.matches("hunter3", hash) → false', explain: 'Argon2/bcrypt verify takes exactly as long as a success by design.', tone: 'warn' },
        { log: 'BadCredentialsException → 401 · no session created', explain: 'The response is generic — no user enumeration leak.', tone: 'info' },
        { log: 'attempt throttles via lockout policy upstream', explain: 'Rate limiting belongs in front of brute force.', tone: 'info' },
      ],
    },
    {
      label: '⏰ expired JWT',
      steps: [
        { log: 'JwtFilter parses token: signature ✓', explain: 'The HMAC is intact — the token was not tampered with.', tone: 'info' },
        { log: 'exp claim elapsed 12 min ago', explain: 'Stateless expiry lives inside the claim; nothing server-side to check.', tone: 'error' },
        { log: 'chain breaks → 401 before MVC', explain: 'Filter-level rejection is the cheapest possible failure.', tone: 'info' },
        { log: 'client refreshes via refresh-token flow', explain: 'Short-lived access + long-lived refresh is the standard trade.', tone: 'info' },
      ],
    },
  ],
  web: [
    {
      label: 'GET → 200',
      steps: [
        { log: 'GET /users/42 crosses the filter chain (security ran here)', explain: 'Filters are servlet-level — they see EVERY request before routing exists.', tone: 'info' },
        { log: 'DispatcherServlet receives — it is THE front door', explain: 'One servlet routes all HTTP traffic, so interceptors and exception translation plug in at a single point.', tone: 'info' },
        { log: 'HandlerMapping: /users/{id} + GET → UserController#get(Long)', explain: 'URL, verb and parameter types pick exactly one method.', tone: 'info' },
        { log: 'argument resolvers: {id} = 42 → Long, params ready', explain: 'Spring converts raw path/header strings into typed Java values before your code sees them.', tone: 'info' },
        { log: 'method body runs → UserDto returned', explain: 'The controller stays pure — no HttpServletRequest, no Jackson calls inside it.', tone: 'info' },
        { log: 'Jackson converter writes 200 application/json', explain: 'The converter is chosen by the Accept header — same DTO, other Accept, other format.', tone: 'info' },
      ],
    },
    {
      label: 'POST + @Valid fail',
      steps: [
        { log: 'POST /users — body {"name":"", "age":17} arrives as bytes', explain: 'The body is NOT an object yet — only raw bytes on a stream.', tone: 'info' },
        { log: '@RequestBody: Jackson deserializes → NewUser bound', explain: 'Binding is mechanical and type-driven — no reflection code you wrote.', tone: 'info' },
        { log: '@Valid runs: @NotBlank(name) ✗ · @Min(18, age) ✗', explain: 'Constraints fail BEFORE the controller body — rejection is cheap.', tone: 'warn' },
        { log: 'MethodArgumentNotValidException — create() never executes', explain: 'After @Valid everything is trusted — that promise IS the API.', tone: 'error' },
        { log: '@RestControllerAdvice → 400 ProblemDetail + field list', explain: 'One global exception home instead of try/catch scattered over 40 controllers.', tone: 'info' },
      ],
    },
    {
      label: 'Accept → format',
      steps: [
        { log: 'GET /users/42 with Accept: application/json', explain: 'The client names the formats it accepts — the server adapts, not the URL.', tone: 'info' },
        { log: 'servlet asks the converter list: who WRITES UserDto as json?', explain: 'Content negotiation is a registry lookup, not an if-chain in your code.', tone: 'info' },
        { log: 'Jackson picked → serializes public getters → 200', explain: 'Only getters ship — that is why a DTO hides entity internals.', tone: 'info' },
        { log: 'Accept: application/xml, no writer → 406 Not Acceptable', explain: 'Missing format match rejects at the framework layer — zero controller code involved.', tone: 'warn' },
      ],
    },
  ],
  testing: [
    {
      label: 'JUnit anatomy',
      steps: [
        { log: 'JUnit builds a FRESH PeopleTest instance per @Test', explain: 'Per-test instances leak-proof field state — two tests share nothing.', tone: 'info' },
        { log: '@BeforeEach rebuilds the world', explain: 'Setup runs before EVERY test — determinism by construction.', tone: 'info' },
        { log: 'arrange → act: sut.add("ana")', explain: 'The rhythm is arrange/act/assert — act is usually one line.', tone: 'info' },
        { log: 'assert: assertEquals(1, sut.size()) — diff printed', explain: 'expected ≠ actual shows BOTH values — the diff IS the bug report.', tone: 'info' },
        { log: 'next @Test re-runs @BeforeEach — 0 inherited state', explain: 'A green suite passes in any order — that is the whole point.', tone: 'info' },
      ],
    },
    {
      label: '@WebMvcTest slice',
      steps: [
        { log: '@WebMvcTest boots only web-layer beans (~0.3 s context)', explain: 'No DB, no services in this context — the slice keeps feedback instant.', tone: 'info' },
        { log: '@MockBean swaps UserService for a Mockito fake', explain: 'The mock sits INSIDE the real context — real wiring, fake leaf.', tone: 'info' },
        { log: 'mvc.perform(get /users/42) runs the real controller', explain: 'Same DispatcherServlet machinery as production, minus the network.', tone: 'info' },
        { log: 'assert: status 200 + jsonPath($.name) = "ana"', explain: 'MockMvc checks status AND body shape — the response as a client sees it.', tone: 'info' },
      ],
    },
    {
      label: 'Mockito stub/verify',
      steps: [
        { log: 'mock(UserRepo.class) — fake with no DB behind', explain: 'A mock implements the interface; every method returns safe defaults.', tone: 'info' },
        { log: 'when(findById(42L)) → Optional.of(ana) scripted', explain: 'Stubbing writes ANSWER SHEETS for the future.', tone: 'info' },
        { log: 'sut.load(42) → stub answers instantly', explain: 'Real production logic, fake dependency — unit test speed.', tone: 'info' },
        { log: 'verify(repo).findById(42L) — asked exactly once', explain: 'Verification audits the PAST: which questions were actually asked.', tone: 'info' },
        { log: 'verify(never()).deleteById(any()) — none happened', explain: 'Negative verification catches over-calling; stubs alone would hide it.', tone: 'warn' },
      ],
    },
    {
      label: 'Testcontainers',
      steps: [
        { log: '@Testcontainers needs Docker daemon', explain: 'The SAME engine as production — H2 dialect drift disappears.', tone: 'info' },
        { log: 'postgres:16 boot, random free port', explain: 'Every run gets a clean DB — no parallel-test collisions.', tone: 'info' },
        { log: 'flyway migrations applied for real', explain: 'Schema drift is caught the same way production would catch it.', tone: 'info' },
        { log: 'repo.save(ana) → real INSERT executed', explain: 'JPA mapping issues surface at test time, not after deploy.', tone: 'info' },
        { log: 'Ryuk reaps the container on JVM exit', explain: 'Zero-leak teardown — nothing for CI to babysit.', tone: 'info' },
      ],
    },
  ],
  autoconfig: [
    {
      label: 'Autoconfig pipeline',
      steps: [
        { log: '@SpringBootApplication joins the party', explain: 'It is glue: scan + circular billboard for @EnableAutoConfiguration.', tone: 'info' },
        { log: 'imports file lists ~140 candidates, one per line', explain: 'Boot does NOT scan JARs — it reads a plain text manifest.', tone: 'info' },
        { log: 'OnClass(HikariDataSource) → true on this classpath', explain: 'Conditions are evaluated against the ACTUAL runtime state.', tone: 'info' },
        { log: 'OnMissingBean(DataSource) → true (you wrote none)', explain: 'The missing-bean check is the second half of "fallback only".', tone: 'info' },
        { log: 'Hikari DataSource ready before you wrote SQL', explain: 'Starter import became exactly the right beans — the guessing worked.', tone: 'info' },
      ],
    },
    {
      label: 'Back-off spell',
      steps: [
        { log: 'your @Bean DataSource refreshes into the context', explain: 'User beans always run BEFORE auto-configuration.', tone: 'info' },
        { log: 'auto-config phase starts after normal beans exist', explain: 'The phase ORDER is what makes the shield possible.', tone: 'info' },
        { log: 'OnMissingBean now FALSE → candidate backs off', explain: 'Auto-config refuses to fight explicit user code — by design.', tone: 'warn' },
        { log: 'final context: exactly ONE DataSource — yours', explain: 'No accidental duplicate beans, no override wars.', tone: 'info' },
      ],
    },
    {
      label: 'Debug report',
      steps: [
        { log: '--debug flips on the conditions report', explain: 'The report prints WHY each candidate matched or skipped.', tone: 'info' },
        { log: 'positive matches listed with their winning condition', explain: 'Every ⊕ is a bean produced for you this boot.', tone: 'info' },
        { log: 'negative matches with the failing condition after', explain: 'A skipped candidate is a decision, not an error.', tone: 'info' },
        { log: 'read it like a receipt: guesswork → inspection', explain: 'Auto-magic stops being magic the moment you read the receipt.', tone: 'info' },
      ],
    },
  ],
  tx: [
    {
      label: 'Isolation ladder',
      steps: [
        { log: 'READ UNCOMMITTED: sees uncommitted dirty rows', explain: 'The bottom rung exists only to show what you should never ship.', tone: 'error' },
        { log: 'READ COMMITTED: dirty reads gone', explain: 'You only ever see committed data — one rung up, huge win.', tone: 'info' },
        { log: 'REPEATABLE READ: re-reads stay stable', explain: 'A re-read of the SAME row cannot change mid-tx anymore.', tone: 'info' },
        { log: 'phantom rows can still ghost in under RR', explain: 'A NEW row appearing in your query range is not a re-read.', tone: 'warn' },
        { log: 'SERIALIZABLE: history replays as if alone', explain: 'Full calm — paid in locks, and deadlocks live here.', tone: 'info' },
      ],
    },
    {
      label: 'Propagation',
      steps: [
        { log: 'outer() opens tx T1 on connection #1', explain: 'The default REQUIRED world always starts here.', tone: 'info' },
        { log: 'inner1() REQUIRED → JOINS T1', explain: 'Same connection, all-or-nothing together.', tone: 'info' },
        { log: 'inner2() REQUIRES_NEW → T1 SUSPENDED, T2 on connection #2', explain: 'A second connection is what makes independence possible.', tone: 'info' },
        { log: 'T2 commits immediately — audit row saved', explain: 'The inner tx finishes and durably writes on its own.', tone: 'info' },
        { log: 'T1 rolls back later — the audit SURVIVES', explain: 'The classic use: audit history must outlive the aborted business op.', tone: 'info' },
      ],
    },
    {
      label: 'Rollback rules',
      steps: [
        { log: 'IllegalStateException from pay() → ROLLBACK', explain: 'Runtime exceptions die loudly on purpose — undo everything.', tone: 'error' },
        { log: 'tx manager marks T1 rollback-only', explain: 'Any participant can condemn the shared tx under REQUIRED.', tone: 'info' },
        { log: 'IOException from ship() → ... COMMITTED', explain: 'The default rule trusts you handled checked failures — surprise!', tone: 'error' },
        { log: 'data half-written despite a real failure', explain: 'The most-asked interview trap and a real production bug.', tone: 'warn' },
        { log: 'rollbackFor = Exception.class fixes the rule', explain: 'Make the failure explicit — never rely on the silent default.', tone: 'info' },
      ],
    },
  ],
  messaging: [
    {
      label: 'Redelivery + idempotency',
      steps: [
        { log: 'broker delivers the order event (maybe again)', explain: 'Delivery policy is at-least-once — plan for the second arrival.', tone: 'info' },
        { log: 'orders.apply(e) performs the domain change', explain: 'The real work — the part that must not run twice.', tone: 'info' },
        { log: 'consumer crashes BEFORE committing the offset', explain: 'The broker still thinks the message was never processed.', tone: 'error' },
        { log: 'broker redelivers — the SAME event again', explain: 'Correct per contract: nothing was ACKed.', tone: 'warn' },
        { log: 'seen(dedupeKey) short-circuits — no double write', explain: 'Idempotency turns at-least-once into effectively-once.', tone: 'info' },
      ],
    },
    {
      label: 'Offsets & rebalance',
      steps: [
        { log: '3 partitions spread across 2 consumers', explain: 'Partition assignment is the unit of parallelism.', tone: 'info' },
        { log: 'consumer B dies', explain: 'Group membership detects the death via heartbeat timeout.', tone: 'error' },
        { log: 'REBALANCE: p2 reassigns to A — offsets remembered', explain: 'A resumes each partition from its last committed offset.', tone: 'info' },
        { log: 'enable.auto.commit = false — commit AFTER processing', explain: 'Manual commits keep the at-least-once contract honest.', tone: 'info' },
        { log: 'first boot → earliest replay — handle dupes!', explain: 'offset.reset = earliest means historical messages repeat on day one.', tone: 'warn' },
      ],
    },
    {
      label: 'DLQ quarantine',
      steps: [
        { log: 'payload cannot parse — a poison message', explain: 'Retrying a malformed payload forever stalls the partition.', tone: 'error' },
        { log: 'retry 1 → 2 → 3 with backoff', explain: 'Bounded retries give transient faults their fair chance.', tone: 'info' },
        { log: 'exhausted → routed to orders-dlq', explain: 'Quarantine keeps the main lane moving for healthy traffic.', tone: 'info' },
        { log: 'alert fires → human inspects → replay tool fixed it', explain: 'The DLQ is a support desk, not a graveyard.', tone: 'info' },
      ],
    },
  ],
  config: [
    {
      label: 'Precedence ladder',
      steps: [
        { log: 'defaults from application.yml: greeting = hi', explain: 'The basement of the ladder — plainest source.', tone: 'info' },
        { log: 'profile prod: hello-prod overrides', explain: 'Profile files sit above the shared default file.', tone: 'info' },
        { log: 'OS env var overrides files: hello-env', explain: 'Env vars beat anything the image contains.', tone: 'info' },
        { log: 'command args: --greeting=hello-cli — final boss', explain: 'Explicit flags win over everything.', tone: 'info' },
        { log: 'one resolved value served to @Value/@CP', explain: 'The ladder resolves ONCE per key, then every reader sees the winner.', tone: 'info' },
      ],
    },
    {
      label: 'Typed binding',
      steps: [
        { log: '@ConfigurationProperties binds keys into a typed object', explain: 'One class per config family — navigation and compile checks.', tone: 'info' },
        { log: 'relaxed names: kebab, camel, env style → one field', explain: 'smtp.host-name, SMTP_HOST_NAME and hostName all collapse to hostName.', tone: 'info' },
        { log: 'port = 25.5 → conversion fails at STARTUP', explain: 'Fail-fast with the offending key printed — no 3am surprises.', tone: 'error' },
        { log: '@Value with missing key → literal "${smth.greeting}" injected', explain: '@Value silently hands you the raw placeholder string.', tone: 'error' },
        { log: 'config bugs now die at boot, not in production night', explain: 'That is the entire argument for typed properties.', tone: 'info' },
      ],
    },
    {
      label: 'Restart rule',
      steps: [
        { log: 'values resolve ONCE at startup', explain: 'The context caches configuration — it does not watch files.', tone: 'info' },
        { log: 'yml edited, app NOT restarted → still OLD values', explain: 'Nothing detects the edit; runtime keeps serving the boot snapshot.', tone: 'warn' },
        { log: '@RefreshScope beans rebind via actuator /refresh', explain: 'The only sanctioned hot-reload lane — and it is opt-in.', tone: 'info' },
        { log: 'every other bean: restart = reload — boring is fine', explain: 'Predictable beats clever for something this critical.', tone: 'info' },
      ],
    },
  ],
};

export const ENTERPRISE_VIZ: Record<string, VizCfg[]> = {
  ioc: [
    {
      code: `new AnnotationConfigApplicationContext(App.class).refresh();
//   1  scan @ComponentScan → 4 BeanDefinitions (metadata only)
//   2  billing = ctor(BillingPaymentRepo) — cycles throw HERE
//   3  populate @Autowired fields (reflection)
//   4  Aware callbacks → BPP.postProcessBeforeInitialization
//   5  @PostConstruct void warmCache() — deps live, not serving yet
//   6  BPP.after → @Transactional found → map now holds $Proxy24
//   7  singleton pool READY 4/4 · ~212 ms`,
      line: [2, 3, 4, 5, 6, 7, 8],
      track: ['refresh · scan', 'ctor', '@Autowired', 'BPP.before', '@PostConstruct', 'BPP.after → $Proxy', '4/4 ready'],
      at: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      code: `@Service class A { A(B b) { ... } }   // B not built — cannot start
@Service class B { B(A a) { ... } }   // symmetrical — no first bean
// refresh() → BeanCurrentlyInCreationException AT BOOT (not in prod)
// fix: @Lazy on one side injects a proxy · or split via events`,
      line: [1, 2, 3, 4],
      track: ['A needs B', 'B needs A', 'in-creation failure', '@Lazy / split'],
      at: [0, 1, 2, 3],
    },
    {
      code: `@Service @Lazy class ReportEngine { void heavyInit() {} }
ctx.refresh();       // definition registered, NOT instantiated
report.generate();   // first touch → created on demand, right now
// tradeoff: boot failures become RUNTIME failures — monitor first call`,
      line: [2, 3, 4],
      track: ['refresh skips', 'first touch build', 'late-failure risk'],
      at: [0, 1, 2],
    },
  ],
  scope: [
    {
      code: `ApplicationContext ctx = new AnnotationConfigApplicationContext(Cfg.class);
BillingService s1 = ctx.getBean(BillingService.class);  // pool entry returned
BillingService s2 = ctx.getBean(BillingService.class);  // SAME entry returned
System.out.println(s1 == s2);   // true — one instance, shared state
// BillingService$$EnhancerBySpringCGLib$xxxx1 lives once in the singleton pool
// state mutation on s1 is visible to s2 — design for statelessness`,
      line: [2, 3, 4, 5, 6],
      track: ['ctx ready', 'getBean #1', 'getBean #2', 's1 == s2 true', 'singleton pool', 'share carefully'],
      at: [0, 1, 2, 3, 4, 5],
    },
    {
      code: `@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
@Service class BillingService { ... }          // new instance per injection
BillingService id1 = ctx.getBean(BillingService.class); // BillingService@7f3d9c2
BillingService id2 = ctx.getBean(BillingService.class); // BillingService@4a1b2c3
// id1 != id2 — @PostConstruct runs; @PreDestroy NEVER fires for prototype
// prototype injected into singleton = scope widening bug (one frozen instance)`,
      line: [1, 3, 4, 5, 6],
      track: ['@Scope(PROTOTYPE)', 'getBean fresh', 'id1 != id2', '@PreDestroy never', 'widening risk'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `@Service                                    // SINGLETON (default)
class OrderService {
    @Autowired BillingService billing;          // PROTOTYPE — frozen here forever
}   // OrderService created ONCE → billing captured as one instance forever
// fix: @Scope(proxyMode = ScopedProxyMode.TARGET_CLASS) on BillingService
// proxy IS a singleton in the context map; each call fetches a fresh prototype`,
      line: [3, 4, 5, 6],
      track: ['singleton holds proto', 'proto frozen forever', 'scoped proxy fix', 'widening closed'],
      at: [0, 1, 2, 3, 4],
    },
  ],
  aop: [
    {
      code: `@Transactional void place(Order o) { repo.save(o); }
// the caller actually invokes $Proxy24.place(o):
TransactionInterceptor → begin tx (READ_COMMITTED)
invocation.proceed() → raw target place(o)
repo.save(o) → 1 INSERT
// no unchecked exception → COMMIT · connection back to Hikari`,
      line: [2, 3, 4, 5, 6, 6],
      track: ['caller', '$Proxy24', 'begin tx', 'proceed()', 'INSERT', 'commit · Hikari'],
      at: [0, 1, 2, 3, 4, 5],
    },
    {
      code: `@Transactional void place(Order o) { audit(); this.audit(); }
void audit() { /* looks advised — it is not */ }
// this.audit() = RAW instance call — 0 interceptors, NO transaction
// fix: self-inject the proxy · or a separate AuditService bean`,
      line: [1, 3, 3, 4],
      track: ['place() → this', 'raw instance', 'audit() unadvised', 'self-inject fix'],
      at: [0, 1, 2, 3],
    },
    {
      code: `@Transactional(rollbackFor = Exception.class) void place(Order o) {
    repo.save(o);                                  // INSERT sent
    if (bad) throw new IllegalStateException(...); // mid-save failure
}   // interceptor catches → ROLLBACK · conn → Hikari · rethrow plain
// DEFAULT rollback = unchecked only; checked needs rollbackFor=`,
      line: [3, 4, 4, 5],
      track: ['IllegalState thrown', 'interceptor sees', 'ROLLBACK', 'rethrown · rollbackFor'],
      at: [0, 1, 2, 3],
    },
  ],
  jpa: [
    {
      code: `public interface OrderRepo extends JpaRepository<Order, Long> {
    @Query("select o from Order o join fetch o.items where o.id = :id")
    Optional<Order> findWithItems(@Param("id") Long id);
}   // proxy builds SQL: 1 roundtrip · graph hydrated into L1 cache
order.addQty(2);   // dirty vs the L1 snapshot — no SQL flies yet
// tx end → flush → dirty-check diff → exactly 1 UPDATE`,
      line: [2, 3, 4, 4, 5, 6],
      track: ['findWithItems', 'JPQL → SQL', '1 roundtrip', 'L1 cache', 'addQty dirty', 'flush → 1 UPDATE'],
      at: [0, 1, 2, 3, 4, 5],
    },
    {
      code: `List<Order> orders = orderRepo.find50();    // 1 SELECT — innocent
for (Order o : orders) {
    o.getCustomer().getName();   // lazy proxy = 1 MORE SELECT each
}                                // total 1 + 50 roundtrips ≈ 862 ms
// fix: join fetch / @EntityGraph / fetch-size batching → collapse to 1`,
      line: [1, 3, 4, 5],
      track: ['find50()', 'proxy init ×50', '51 roundtrips', 'join fetch fix'],
      at: [0, 1, 2, 3],
    },
    {
      code: `Order o = em.find(Order.class, 42L);  // L1 snapshot taken byte-for-byte
o.setAmount(99);                      // in-memory only — NO SQL yet
em.flush();   // snapshot vs current diff → ONE targeted UPDATE
// the point: N scattered writes coalesce at ONE boundary`,
      line: [1, 2, 3, 4],
      track: ['L1 snapshot', 'setAmount(99)', 'flush diff', '1 UPDATE'],
      at: [0, 1, 2, 3],
    },
  ],
  security: [
    {
      code: `http.authorizeHttpRequests(a -> a.requestMatchers("/api/admin/**")
    .hasRole("ADMIN").anyRequest().authenticated())
  .sessionManagement(s -> s.sessionCreationPolicy(STATELESS));
// chain: CsrfFilter (disabled) passes → JwtAuthFilter: HMAC + exp ✓
// → ProviderManager → DaoAuthenticationProvider → UserDetailsService
// bcrypt.matches(raw, hash) ✓ — deliberately slow per call
// → SecurityContextHolder.set(principal) — request-scoped ThreadLocal
// → AuthorizationFilter ROLE_ADMIN ✓ → controller (401s never hit MVC)`,
      line: [4, 4, 4, 5, 6, 7, 8],
      track: ['filter chain', 'Csrf ✓', 'JWT ✓', 'DaoAuth', 'bcrypt ✓', 'context set', 'controller'],
      at: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      code: `UserDetails u = userDetailsService.loadUserByUsername("dawn");
bcrypt.matches("hunter3", u.getPassword());   // false — same cost as OK
throw new BadCredentialsException("Bad credentials");
// 401 · no session · IDENTICAL message/timing for unknown users`,
      line: [1, 2, 3, 4],
      track: ['details loaded', 'bcrypt ✗', '401 · no session', 'generic response'],
      at: [0, 1, 2, 3],
    },
    {
      code: `var claims = jwtParser.parseClaimsJws(token);  // HMAC verified first
// signature VALID — but exp(1234) elapsed 12 min ago
// JwtAuthFilter rejects → chain breaks → 401 before any MVC code
// stateless: nothing server-side to invalidate — refresh flow resumes`,
      line: [1, 2, 3, 4],
      track: ['HMAC ✓', 'exp elapsed', '401 at filter', 'refresh token'],
      at: [0, 1, 2, 3],
    },
  ],
  web: [
    {
      code: `@RestController
class UserController {
    @GetMapping("/users/{id}")
    UserDto get(@PathVariable Long id) {
        return userService.find(id);      // entity → DTO inside
    }
}
// DispatcherServlet → handler → bind → body → converter → 200`,
      line: [-1, -1, 3, 4, 5, -1],
      track: ['client + filters', 'DispatcherServlet', 'handler mapping', 'bind {id}=42', 'method body', '200 JSON'],
      at: [0, 1, 2, 3, 4, 5],
    },
    {
      code: `@PostMapping("/users")
ResponseEntity<UserDto> create(@RequestBody @Valid NewUser in) {
    return ResponseEntity.ok(userService.create(in));
}

@RestControllerAdvice
class ApiErrorAdvice {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail invalid(MethodArgumentNotValidException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Field checks failed");
    }
}`,
      line: [-1, 2, -1, 8, 10],
      track: ['POST body bytes', 'DTO bind', '@Valid ✗', 'ControllerAdvice', '400 ProblemDetail'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `@GetMapping("/users/{id}")
UserDto get(@PathVariable Long id) {
    return userService.find(id);
}
// returned object → HttpMessageConverter chosen BY Accept:
//   application/json → MappingJackson2HttpMessageConverter
//   nothing matches  → HttpMediaTypeNotAcceptableException → 406`,
      line: [-1, -1, 4, 6],
      track: ['Accept: application/json', 'converter scan', 'Jackson writes', '406 on mismatch'],
      at: [0, 1, 2, 3],
    },
  ],
  testing: [
    {
      code: `class PeopleTest {
    @BeforeEach void fresh() { sut = new PeopleService(); }

    @Test void adds() {
        sut.add("ana");                     // arrange + act
        assertEquals(1, sut.size());        // diff printed on failure
    }

    @Test void rejectsBlank() {
        assertThrows(IllegalArgumentException.class, () -> sut.add(" "));
    }
}`,
      line: [2, -1, 5, 6, 9],
      track: ['fresh instance', '@BeforeEach', 'arrange + act', 'assert', 'next test fresh'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `@WebMvcTest(UserController.class)
class WebSliceTest {
    @Autowired MockMvc mvc;          // real MVC, no socket
    @MockBean UserService service;   // fake leaf inside real context

    @Test void get200() throws Exception {
        when(service.find(42L)).thenReturn(new UserDto(42, "ana"));
        mvc.perform(get("/users/42"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.name").value("ana"));
    }
}`,
      line: [1, 4, 8, 10],
      track: ['context slice', 'service mocked', 'MockMvc perform', 'JSON asserted'],
      at: [0, 1, 2, 3],
    },
    {
      code: `var repo = mock(UserRepo.class);
when(repo.findById(42L)).thenReturn(Optional.of(ana));  // SCRIPT the future

sut.load(42);                                           // act — real logic, fake data

verify(repo).findById(42L);                             // AUDIT the past
verify(repo, never()).deleteById(any());                // nothing extra happened`,
      line: [1, 2, 4, 5, 6],
      track: ['mock created', 'when() scripts', 'sut acts', 'stub answers', 'verify audits'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `@Testcontainers
class RealDbTest {
    @Container
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", db::getJdbcUrl);   // real engine, random port
    }

    @Test void savesUser() {
        repo.save(ana); assertThat(repo.count()).isEqualTo(1);
    }
}`,
      line: [1, 4, -1, 12, -1],
      track: ['Docker daemon', 'postgres:16 boot', 'schema migrate', 'real INSERT', 'Ryuk cleanup'],
      at: [0, 1, 2, 3, 4],
    },
  ],
  autoconfig: [
    {
      code: `@SpringBootApplication            // = @EnableAutoConfiguration + scan
public class App {
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);   // your beans BEFORE auto-config
    }
}
// candidates read from META-INF/...AutoConfiguration.imports
// decide: @ConditionalOnClass(Hikari) ✓ · @ConditionalOnMissingBean ✓`,
      line: [1, 7, 8, -1, -1],
      track: ['glue annotation', 'imports list', 'OnClass ✓', 'OnMissingBean ✓', 'auto bean ready'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `@Bean DataSource myDb() { return new Mine(); }      // YOUR bean refreshes first

// auto-config runs LAST in the refresh:
@ConditionalOnMissingBean(DataSource.class)         // FALSE now — backs off
class DataSourceAutoConfiguration { ... }
// yours is authoritative, auto is fallback — always`,
      line: [1, 3, 4, 6],
      track: ['your @Bean', 'auto phase last', 'OnMissingBean ✗', 'yours wins'],
      at: [0, 1, 2, 3],
    },
    {
      code: `java -jar app.jar --debug
// CONDITIONS EVALUATION REPORT:
//    DataSourceAutoConfiguration matched:
//       - @ConditionalOnClass found HikariDataSource
//    JmxAutoConfiguration did NOT match:
//       - @ConditionalOnProperty jmx.enabled missing
// every matched line = a bean you did NOT have to write`,
      line: [1, 3, 5, 7],
      track: ['--debug flag', 'positive matches', 'negative skipped', 'read the report'],
      at: [0, 1, 2, 3],
    },
  ],
  tx: [
    {
      code: `conn.setTransactionIsolation(TRANSACTION_READ_COMMITTED);
// the stability ladder, weakest → strongest:
//   RU  : sees uncommitted dirty writes           (never ship)
//   RC  : dirty gone · a re-read CAN still change (non-repeatable)
//   RR  : re-read stable · NEW rows ghost in       (phantoms)
//   SER : replay history as if alone — deadlocks live here`,
      line: [3, 4, 5, -1, 6],
      track: ['RU: dirty reads', 'RC: clean reads', 'RR: stable re-read', 'phantoms slip in', 'SER: full calm'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `@Transactional                                  // REQUIRED: the default
void outer() { inner1(); inner2(); }

@Transactional(propagation = REQUIRES_NEW)      // NEW connection + NEW tx
void inner2() { audit.save(x); }                // commits IMMEDIATELY
// inner1 REQUIRED → joins T1, dies together with the outer
// classic: outer rollback AFTER inner commit = audit survived`,
      line: [1, 6, 4, 5, 7],
      track: ['outer tx T1', 'REQUIRED joins', 'REQUIRES_NEW T2', 'T2 commits alone', 'T1 dies, T2 lives'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `@Transactional                                  // rollback: RUNTIME only
void pay() { throw new IllegalStateException("nsf"); }    // → ROLLED BACK

@Transactional
void ship() throws IOException { throw new IOException("port down"); }
// checked → COMMITTED by default (Spring assumes you handle it)
// fix: rollbackFor = Exception.class — make the rule explicit`,
      line: [2, -1, 5, 6, 7],
      track: ['runtime thrown', 'tx rolled back', 'checked thrown', 'actually committed', 'rollbackFor = fix'],
      at: [0, 1, 2, 3, 4],
    },
  ],
  messaging: [
    {
      code: `@KafkaListener(topics = "orders")
void handle(OrderEvent e) {
    if (seen(e.dedupeKey())) return;         // idempotency FIRST
    orders.apply(e);                         // the real work
    ack.acknowledge();                       // offset commit LAST
}
// crash before ack = broker redelivers — plan for dupes
// seen-table + business key = effectively-once`,
      line: [1, 4, 5, 7, 3],
      track: ['broker delivers', 'apply()', 'crash pre-ack', 'redelivered', 'dedupe holds'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `partition p0 → consumer A (offsets 41+)
partition p1 → A · p2 → consumer B
// B dies → REBALANCE: p2 moves to A
// the committed offset is the ONLY memory of progress
auto.offset.reset = earliest      // first boot: replay from day one
enable.auto.commit = false        // commit AFTER processing`,
      line: [1, 2, 3, 6, 5],
      track: ['partitions spread', 'consumer dies', 'rebalance', 'commit late', 'replay from head'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `@RetryableTopic(attempts = "3", dltTopicSuffix = "-dlq")
void handle(OrderEvent e) { /* payload never parses */ }
// attempt 1 → 2 → 3 → routed to orders-dlq
// DLQ = poison archive: alerts fire, humans inspect, replay exists
// the main lane stays healthy for everyone else`,
      line: [2, 3, -1, 5],
      track: ['poison payload', 'retries 3x', 'routed → DLQ', 'alert + replay'],
      at: [0, 1, 2, 3],
    },
  ],
  config: [
    {
      code: `# application.yml  (defaults)
greeting: hi
---
# application-prod.yml (profile overrides)
greeting: hello-prod
# shell: GREETING=hello-env   ·   args: --greeting=hello-cli (strongest)
// ladder: default < profile < env < args — last writer wins`,
      line: [2, 5, 6, -1, 7],
      track: ['default file', 'profile file', 'env var', 'command args', 'resolved once'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `@ConfigurationProperties(prefix = "smtp")
class SmtpProps {                                // typed + navigable
    private String host;
    private int port;
}
// relaxed binding: smtp.host-name ≡ SMTP_HOST_NAME ≡ hostName
// startup FAILS: smtp.port=25.5 → Failed to bind properties
// @Value gap: missing key → the literal string \${smtp.port} injected`,
      line: [1, 6, 7, 8, -1],
      track: ['typed bind', 'relaxed names', 'fail-fast port', '@Value gap', 'dies at boot'],
      at: [0, 1, 2, 3, 4],
    },
    {
      code: `// values resolve ONCE at startup, then the context holds them
yml edited without restart → app keeps serving OLD values
@RefreshScope
class GreetSvc { @Value("\${greeting}") String g; }  // /refresh rebinds
// every other bean: restart = reload — boring is fine`,
      line: [1, 2, 4, 5],
      track: ['read once', 'yml edited', '@RefreshScope', 'restart = reload'],
      at: [0, 1, 2, 3],
    },
  ],
};
