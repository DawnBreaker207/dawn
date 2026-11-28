import { STAGE, codeCard, linkOf, stageBlock, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// Seed → result. One request reaches a controller; every step puts another piece of Spring
// Security in front of it. Each concept has its own id; at most two nodes join per step. In
// step 2 the controller steps back so the filter chain can stand in front of it.
//
//   step 1  client ── controller                        seed: an open door
//   step 2  + chain, + delegating; controller steps back  Tomcat → Spring filter chain
//   step 3  (chain: stateless, per-URL rules)           SecurityFilterChain
//   step 4  + dao                                       passwords and BCrypt
//   step 5  (CORS / CSRF decision)                      origin guard
//   step 6  + jwt                                       OAuth2 resource server
//   step 7  (SecurityContext filled)                    who is calling
//   step 8  (authorisation decides)                     401 versus 403
//
//   jwt (left-top)      delegating (top)     dao (top-right)
//   client ───────────  chain ─────────────  controller (right)

const client = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph: `user`, label: [`client`], sub, tags });
const controller = (at: { x: number; y: number }, sub: string, tags: Tag[] = []) =>
  stageBlock(at, { color: `slab`, glyph: `box`, label: [`Controller`], sub, tags });
const chain = (label: string[], sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.main, { color: `green`, glyph: `shield`, label, sub, tags });
const delegating = (tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph: `route`, label: [`Delegating`, `FilterProxy`], sub: `Tomcat filter`, tags });
const dao = (tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `orange`, glyph: `lock`, label: [`Dao`, `Provider`], sub: `BCrypt cost 12`, tags });
const jwt = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller2, { color: `orange`, glyph: `key`, label: [`Jwt`, `Decoder`], sub: `JWK set`, tags });

const links = {
  exposed: linkOf(`client`, `controller`),
  request: (label?: string) => linkOf(`client`, `chain`, label),
  guard: (label?: string) => linkOf(`chain`, `controller`, label),
  delegate: (label?: string) => ({ ...linkOf(`delegating`, `chain`, label, false), labelAt: 0.6 }),
  login: (label?: string) => ({ ...linkOf(`dao`, `chain`, label, false), labelAt: 0.6 }),
  verify: (label?: string) => ({ ...linkOf(`jwt`, `chain`, label, false), labelAt: 0.6 }),
};

export const javaSpringSecurityLesson: Lesson = {
  id: 'java-spring-security',
  title: 'Spring Security & OAuth2',
  summary:
    'Put one controller behind Spring Security a layer at a time: the filter chain, BCrypt password checks, CORS versus CSRF, JWT verification for OAuth2, the security context and the 401/403 decision.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['gate', 'auth', 'principal', 'status'],
  legend: [[`req`, `request`], [`res`, `allowed`], [`fail`, `rejected`]],
  goals: [
    { text: 'See the risk of an unprotected endpoint', step: 1 },
    { text: 'Bridge Tomcat to Spring with DelegatingFilterProxy', step: 2 },
    { text: 'Configure a stateless SecurityFilterChain', step: 3 },
    { text: 'Verify passwords with BCrypt and its work factor', step: 4 },
    { text: 'Tell CORS from CSRF; know when to disable CSRF', step: 5 },
    { text: 'Verify OAuth2 JWTs against the JWK set', step: 6 },
    { text: 'Find the user in the thread-scoped SecurityContext', step: 7 },
    { text: 'Enforce roles: 401 versus 403', step: 8 },
  ],
  steps: [
    {
      short: 'Open door',
      chapter: 'problem',
      title: 'Seed: an endpoint with nothing in front of it',
      body: [
        `A controller method answers every request it receives. Without Spring Security, <code>GET /admin/orders</code> from a stranger on the internet returns the data with <code>200 OK</code>.`,
        `Security has to be added <em>before</em> the controller runs — and it has to be in the request path by default, not something each developer remembers. We will put it there, one piece per step.`,
      ],
      metrics: { gate: 'none', auth: 'anonymous', principal: 'unknown', status: '200 exposed' },
      scene: {
        entities: {
          client: client(`no credentials`, [{ text: `stranger`, tone: `amber` }]),
          controller: controller(STAGE.main, `GET /admin`, [{ text: `200 OK · exposed`, tone: `red`, icon: `alert` }]),
          card: codeCard(`No protection`, [`$ curl https://shop.example/admin/orders`, `200 OK  [{"id":1,"card":"4111…"}]`, `! nothing checked who is asking`]),
        },
        links: { exposed: links.exposed },
        flows: [{ route: ['exposed'], kind: 'fail', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Filter proxy',
      chapter: 'technique',
      title: 'Tomcat hands requests to a Spring filter chain',
      body: [
        `Servlet filters run before any controller, but Tomcat knows nothing about Spring beans. A tiny filter, <span class="term">DelegatingFilterProxy</span>, bridges the two: it looks up the bean <code>springSecurityFilterChain</code> in the Spring context and forwards each request to it.`,
        `That bean is <span class="term">FilterChainProxy</span>, which picks the matching <code>SecurityFilterChain</code> for the URL. It now stands in front of the controller. Spring Boot registers all of this automatically when you add the starter.`,
      ],
      changes: [`+ FilterChainProxy`, `+ DelegatingFilterProxy`, `~ controller: behind the chain`],
      metrics: { gate: 'FilterChainProxy', auth: 'entering', principal: 'pending', status: 'inspecting' },
      scene: {
        entities: {
          client: client(`GET /admin`),
          chain: chain([`FilterChain`, `Proxy`], `picks a chain`, [{ text: `in front of controllers`, tone: `green` }]),
          controller: controller(STAGE.store, `not reached yet`),
          delegating: delegating([{ text: `servlet side`, tone: `violet` }]),
          card: codeCard(`Registered for you`, [`Tomcat filter "springSecurityFilterChain"`, `  → DelegatingFilterProxy`, `  → FilterChainProxy   (a Spring bean)`, `  → SecurityFilterChain for /admin/**`]),
        },
        links: { request: links.request(), guard: links.guard(), delegate: links.delegate(`delegates`) },
        flows: [{ route: ['request'], rate: 1.3, bounce: true }, { route: ['delegate'], rate: 1 }],
      },
    },
    {
      short: 'Chain',
      chapter: 'technique',
      title: 'A stateless SecurityFilterChain',
      body: [
        `A <code>SecurityFilterChain</code> is an ordered list of filters (CORS, CSRF, authentication, authorisation…) plus the rules for which URLs it covers. You define it as a bean.`,
        `For a REST API choose <b>stateless</b>: no <code>HttpSession</code>, so every request must carry its own proof of identity — and any server instance can answer it.`,
      ],
      changes: [`~ chain: stateless, rules per URL`],
      metrics: { gate: 'filter chain', auth: 'stateless', principal: 'pending', status: 'pipeline' },
      scene: {
        entities: {
          client: client(`GET /admin`),
          chain: chain([`FilterChain`, `Proxy`], `ordered filters`, [{ text: `STATELESS · no session`, tone: `violet`, icon: `lock` }]),
          controller: controller(STAGE.store, `not reached yet`),
          delegating: delegating(),
          card: codeCard(`The bean`, [`http.sessionManagement(s -> s.sessionCreationPolicy(STATELESS))`, `    .authorizeHttpRequests(a -> a`, `        .requestMatchers("/public/**").permitAll()`, `        .anyRequest().authenticated());`]),
        },
        links: { request: links.request(), guard: links.guard(), delegate: links.delegate() },
        flows: [{ route: ['request'], rate: 1.3, bounce: true }],
      },
    },
    {
      short: 'BCrypt',
      chapter: 'technique',
      title: 'Checking a password without storing it',
      body: [
        `The <span class="term">DaoAuthenticationProvider</span> loads the user from your <code>UserDetailsService</code> and asks a <code>PasswordEncoder</code> to compare. The database stores a <b>BCrypt hash</b>, never the password.`,
        `BCrypt is deliberately slow and salted. A work factor of 12 costs ~250 ms per check — nothing for a login, ruinous for an attacker trying billions of guesses. Wrong password gives <code>401</code>.`,
      ],
      changes: [`+ DaoAuthenticationProvider (BCrypt)`],
      metrics: { gate: 'DaoProvider', auth: 'BCrypt 2^12', principal: 'UserDetails', status: '401 if bad' },
      scene: {
        entities: {
          client: client(`alice / ••••••`, [{ text: `login`, tone: `green` }]),
          chain: chain([`FilterChain`, `Proxy`], `stateless`, [{ text: `401 on mismatch`, tone: `amber` }]),
          controller: controller(STAGE.store, `not reached yet`),
          delegating: delegating(),
          dao: dao([{ text: `~250 ms / check`, tone: `violet`, icon: `clock` }]),
          card: codeCard(`Hash, don't store`, [`var encoder = new BCryptPasswordEncoder(12);`, `String hash = encoder.encode("s3cret");  // $2a$12$…`, `encoder.matches(raw, hash);               // true / false`]),
        },
        links: { request: links.request(), guard: links.guard(), delegate: links.delegate(), login: links.login() },
        flows: [{ route: ['request'], rate: 1.2, bounce: true }, { route: ['login'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'CORS · CSRF',
      chapter: 'insight',
      title: 'CORS is not CSRF',
      body: [
        `<span class="term">CORS</span> tells the <em>browser</em> which other origins may read responses from your API. It protects nothing on the server — it only relaxes the browser’s same-origin rule.`,
        `<span class="term">CSRF</span> is an attack where a malicious page (say <code>evil.com</code>) makes the browser send a request that <b>automatically carries your cookie</b>. It only matters when authentication rides on cookies. An API that needs an <code>Authorization: Bearer</code> header is not exposed, so disabling CSRF there is safe.`,
      ],
      changes: [`~ chain: CORS + CSRF filters`, `~ client: cookie sent automatically`],
      metrics: { gate: 'CORS + CSRF', auth: 'origin guard', principal: 'stateless', status: '403 if forged' },
      scene: {
        entities: {
          client: client(`logged-in user`, [{ text: `cookie auto-sent`, tone: `red` }]),
          chain: chain([`FilterChain`, `Proxy`], `origin guard`, [{ text: `CSRF: only for cookies`, tone: `green` }]),
          controller: controller(STAGE.store, `POST /transfer`),
          delegating: delegating(),
          dao: dao(),
          card: codeCard(`Pick per auth style`, [`// cookie session  → keep CSRF on`, `http.csrf(c -> c.disable());   // only for Bearer-token APIs`, `cors.setAllowedOrigins(List.of("https://shop.example"));`, `! evil.com forged form: POST /transfer with your cookie`]),
        },
        links: { request: links.request(), guard: links.guard(), delegate: links.delegate(), login: links.login() },
        flows: [{ route: ['request'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'JWT · JWK',
      chapter: 'solution',
      title: 'Verifying an OAuth2 access token',
      body: [
        `As an OAuth2 <b>resource server</b> your API never sees a password. The client sends a signed JWT in the <code>Authorization</code> header; the <code>JwtDecoder</code> checks the signature, expiry (<code>exp</code>) and issuer (<code>iss</code>).`,
        `The public keys come from the authorization server’s <span class="term">JWK set</span>; the token header’s <code>kid</code> says which key to use. Keys are cached, so verification needs no network call per request.`,
      ],
      changes: [`+ JwtDecoder (JWK set)`],
      metrics: { gate: 'JwtDecoder', auth: 'verified JWT', principal: 'sub + claims', status: '401 if bad' },
      scene: {
        entities: {
          client: client(`Bearer token`, [{ text: `has access token`, tone: `green` }]),
          chain: chain([`FilterChain`, `Proxy`], `Bearer filter`, [{ text: `sig ✓ exp ✓ iss ✓`, tone: `green`, icon: `shield` }]),
          controller: controller(STAGE.store, `orders API`),
          delegating: delegating(),
          dao: dao([{ text: `login only`, tone: `gray` }]),
          jwt: jwt([{ text: `keys from auth server`, tone: `violet` }]),
          card: codeCard(`Resource server setup`, [`spring.security.oauth2.resourceserver.jwt`, `    .issuer-uri=https://auth.shop.example`, `// header: { "alg":"RS256", "kid":"k-2026-11" }`, `// body:   { "sub":"alice", "exp":1795900000, "scope":"orders" }`]),
        },
        links: { request: links.request(`Bearer JWT`), guard: links.guard(), delegate: links.delegate(), login: links.login(), verify: links.verify(`verifies`) },
        flows: [{ route: ['request'], rate: 1.3, bounce: true }, { route: ['verify'], kind: 'write', rate: 0.8 }],
      },
    },
    {
      short: 'Context',
      chapter: 'technique',
      title: 'Who is calling? The SecurityContext',
      body: [
        `After authentication succeeds, the filter stores an <code>Authentication</code> — principal, authorities, token — in the <span class="term">SecurityContextHolder</span>. By default that is a <code>ThreadLocal</code>, so any code on the same thread can ask “who is the current user?”.`,
        `The context is cleared when the request ends. It does <b>not</b> follow work handed to another thread — an <code>@Async</code> method starts with no user unless you propagate the context.`,
      ],
      changes: [`~ chain: SecurityContext filled`, `~ controller: reads the user`],
      metrics: { gate: 'ContextHolder', auth: 'authenticated', principal: 'ROLE_ADMIN', status: 'proceed' },
      scene: {
        entities: {
          client: client(`Bearer token`, [{ text: `alice`, tone: `green` }]),
          chain: chain([`FilterChain`, `Proxy`], `ThreadLocal`, [{ text: `alice · ROLE_ADMIN`, tone: `violet`, icon: `lock` }]),
          controller: controller(STAGE.store, `orders API`, [{ text: `@Async: no user!`, tone: `red`, icon: `alert` }]),
          delegating: delegating(),
          dao: dao(),
          jwt: jwt(),
          card: codeCard(`Read it anywhere`, [`var auth = SecurityContextHolder.getContext().getAuthentication();`, `auth.getName();            // "alice"`, `auth.getAuthorities();     // [ROLE_ADMIN]`, `! not visible inside @Async without propagation`]),
        },
        links: { request: links.request(), guard: links.guard(`uses`), delegate: links.delegate(), login: links.login(), verify: links.verify() },
        flows: [{ route: ['request', 'guard'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: '401 · 403',
      chapter: 'recap',
      title: 'Result: 401 means “who are you?”, 403 means “not you”',
      body: [
        `The last filter, <code>AuthorizationFilter</code>, applies your rules. <b>401 Unauthorized</b> means authentication is missing or invalid — the client should log in again. <b>403 Forbidden</b> means the user is known but lacks permission — logging in again won’t help.`,
        `Method security (<code>@PreAuthorize</code>) enforces the same rule next to the code. <code>hasRole('ADMIN')</code> is just <code>hasAuthority('ROLE_ADMIN')</code> — Spring adds the <code>ROLE_</code> prefix for you.`,
      ],
      changes: [`~ chain: AuthorizationFilter`, `~ client: ROLE_USER`],
      metrics: { gate: 'AuthzFilter', auth: 'authorized', principal: 'ROLE_USER', status: '200 or 403' },
      scene: {
        entities: {
          client: client(`Bearer token`, [{ text: `bob · ROLE_USER`, tone: `amber` }]),
          chain: chain([`FilterChain`, `Proxy`], `rules + roles`, [{ text: `403 Forbidden`, tone: `red`, icon: `alert` }]),
          controller: controller(STAGE.store, `/admin/orders`, [{ text: `@PreAuthorize ADMIN`, tone: `violet` }]),
          delegating: delegating(),
          dao: dao(),
          jwt: jwt(),
          card: codeCard(`Two different answers`, [`@PreAuthorize("hasRole('ADMIN')")`, `Order get(long id) { ... }`, `! no token       → 401 Unauthorized`, `! ROLE_USER      → 403 Forbidden`]),
        },
        links: { request: links.request(`GET /admin`), guard: links.guard(), delegate: links.delegate(), login: links.login(), verify: links.verify() },
        flows: [{ route: ['request'], kind: 'fail', rate: 1.2, bounce: true }],
      },
    },
  ],
};
