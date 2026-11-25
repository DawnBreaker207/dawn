/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaSpringSecurityLesson: Lesson = {
  id: 'java-spring-security',
  title: 'Spring Security & OAuth2',
  summary:
    'Trace DelegatingFilterProxy, SecurityFilterChain, DaoAuthenticationProvider + BCrypt, CORS vs CSRF rules, OAuth2 JWK verification, SecurityContextHolder, and 401/403 RBAC.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['security_gate', 'auth_state', 'principal', 'http_status'],
  legend: ['flow', ['req', 'inspect / verify'], ['res', 'authenticated'], ['fail', '401 / 403 / CSRF']],
  goals: [
    { text: 'Expose unprotected endpoint risk before Security', step: 1 },
    { text: 'Bridge Tomcat to Spring via DelegatingFilterProxy', step: 2 },
    { text: 'Route through ordered SecurityFilterChain', step: 3 },
    { text: 'Verify passwords via DaoProvider + BCrypt work factor', step: 4 },
    { text: 'Distinguish CORS vs CSRF & when disabling CSRF is safe', step: 5 },
    { text: 'Verify OAuth2 JWTs via Resource Server JWK Set', step: 6 },
    { text: 'Populate thread-scoped SecurityContextHolder', step: 7 },
    { text: 'Enforce RBAC (401 vs 403, hasRole vs hasAuthority)', step: 8 },
  ],
  steps: [
    {
      short: 'Unprotected',
      chapter: 'security',
      title: '1. Unprotected Endpoint Risk',
      body: [
        'Without Spring Security, any HTTP client can hit <code>/api/admin/users</code> directly on Tomcat.',
        'Scattering manual <code>if (token == null)</code> checks inside every Controller violates DRY and inevitably leaves unguarded routes.',
      ],
      callout: {
        kind: 'warn',
        text: 'Security must be enforced at the outer Filter boundary BEFORE DispatcherServlet or Controllers ever execute.',
      },
      metrics: { security_gate: 'None', auth_state: 'Anonymous', principal: 'Unknown', http_status: '200 (Exposed!)' },
      scene: {
        entities: {
          client: d(-12, -8, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Unauth Client'], sub: 'no token' }),
          ctrl: d(4, -8, { s: 4.8, h: 54, color: 'amber', glyph: 'code', label: ['AdminCtrl'], sub: 'exposed!' }),
          card: S({ x: -12, y: 12 }, '1. Problem: No Outer Security Gate', [
            '// Without SecurityFilterChain:',
            'GET /api/admin/users -> hits AdminController directly!',
            '// Goal: deny-by-default before DispatcherServlet',
          ], { icon: 'terminal' }),
        },
        links: {
          cl_ct: h('client', 'ctrl', ['client', 'ctrl'], { heads: 'end', label: 'unverified' }),
        },
        flows: [{ route: ['cl_ct'], kind: 'fail', rate: 1.7 }],
      },
    },
    {
      short: 'FilterProxy',
      chapter: 'security',
      title: '2. DelegatingFilterProxy & FilterChainProxy',
      body: [
        'Tomcat only knows standard Jakarta Servlet <code>Filter</code>s, not Spring Beans.',
        '<code>DelegatingFilterProxy</code> is a thin Servlet Filter registered in Tomcat that delegates every request into Spring’s <code>FilterChainProxy</code> bean.',
      ],
      callout: {
        kind: 'insight',
        text: 'This bridge lets Spring Security filters use @Autowired beans like JwtDecoder and UserDetailsService.',
      },
      changes: ['+ DelegatingFilterProxy bridges Tomcat -> Spring', '+ FilterChainProxy owns security beans'],
      metrics: { security_gate: 'FilterProxy', auth_state: 'Entering', principal: 'Pending', http_status: 'Inspecting' },
      scene: {
        entities: {
          tomcat: d(-14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['Tomcat'], sub: 'Servlet Filter' }),
          dfp: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['DelegatingPx'], sub: 'Servlet bridge' }),
          fcp: d(14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['FilterChainPx'], sub: 'Spring Bean' }),
          card: S({ x: -12, y: 12 }, '2. Bridging Servlet Container to Spring', [
            '// Tomcat invokes Jakarta Servlet Filter:',
            'DelegatingFilterProxy',
            '  -> looks up Spring bean "springSecurityFilterChain"',
            '  -> delegates to FilterChainProxy',
          ], { icon: 'terminal' }),
        },
        links: {
          tm_df: h('tomcat', 'dfp', ['tomcat', 'dfp'], { heads: 'end', label: 'doFilter' }),
          df_fc: h('dfp', 'fcp', ['dfp', 'fcp'], { heads: 'end', label: 'delegate' }),
        },
        flows: [{ route: ['tm_df', 'df_fc'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'FilterChain',
      chapter: 'security',
      title: '3. Configuring Stateless SecurityFilterChain',
      body: [
        'In Spring Security 6, you declare a <code>SecurityFilterChain</code> <code>@Bean</code> using lambda DSL.',
        'For REST APIs using JWTs, set <code>SessionCreationPolicy.STATELESS</code> so Spring never creates HTTP <code>JSESSIONID</code> sessions.',
      ],
      callout: {
        kind: 'tip',
        text: 'Order matters: you can define multiple SecurityFilterChain beans with @Order(1) for /api/** and @Order(2) for web pages.',
      },
      changes: ['+ SecurityFilterChain @Bean configured', '+ STATELESS session policy for JWT'],
      metrics: { security_gate: 'FilterChain', auth_state: 'Stateless', principal: 'Pending', http_status: 'Pipeline' },
      scene: {
        entities: {
          fcp: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['FilterChainPx'], sub: 'match /api/**' }),
          chain: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['SecFilterChain'], sub: 'STATELESS' }),
          rules: b(14, -10, { r: 2.2, h: 48, color: 'sky', label: ['Auth Rules'], sub: 'deny default' }),
          card: S({ x: -12, y: 12 }, '3. Spring Security 6 Lambda DSL', [
            '@Bean SecurityFilterChain apiChain(HttpSecurity http) {',
            '  return http.csrf(c -> c.disable())',
            '    .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))',
            '    .authorizeHttpRequests(a -> a.requestMatchers("/auth/**").permitAll()',
            '      .anyRequest().authenticated()).build();',
            '}',
          ], { icon: 'terminal' }),
        },
        links: {
          fc_ch: h('fcp', 'chain', ['fcp', 'chain'], { heads: 'end', label: 'match URL' }),
          ch_rl: h('chain', 'rules', ['chain', 'rules'], { heads: 'end', label: 'apply DSL' }),
        },
        flows: [{ route: ['fc_ch', 'ch_rl'], kind: 'req', rate: 1.9 }],
      },
    },
    {
      short: 'BCrypt Auth',
      chapter: 'auth',
      title: '4. DaoAuthenticationProvider & BCrypt PasswordEncoder',
      body: [
        'For login requests, <code>AuthenticationManager</code> delegates to <code>DaoAuthenticationProvider</code>, which loads the user via <code>UserDetailsService</code> and verifies the hash.',
        'Use <strong>BCrypt</strong> (never SHA-256!): it embeds a random 128-bit salt and uses a deliberately slow cost factor ($2^{10}$–$2^{12}$ rounds) to defeat GPU brute-force.',
      ],
      callout: {
        kind: 'warn',
        text: 'Never hash passwords with fast SHA-256 — always use BCryptPasswordEncoder or Argon2PasswordEncoder.',
      },
      changes: ['+ DaoProvider calls UserDetailsService', '+ BCrypt adds 128-bit salt + slow rounds'],
      metrics: { security_gate: 'DaoProvider', auth_state: 'BCrypt 2^12', principal: 'UserDetails', http_status: '401 if bad' },
      scene: {
        entities: {
          mgr: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['AuthManager'], sub: 'DaoProvider' }),
          bc: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['BCrypt 2^12'], sub: '~100ms hash' }),
          db: b(14, -10, { r: 2.2, h: 48, color: 'purple', label: ['Users DB'], sub: '$2a$12$...' }),
          card: S({ x: -12, y: 12 }, '4. Salted Adaptive Hashing with BCrypt', [
            '@Bean PasswordEncoder passwordEncoder() {',
            '  return new BCryptPasswordEncoder(12); // 2^12 rounds',
            '} // Stored: $2a$12$<22-char salt><31-char hash>',
          ], { icon: 'terminal' }),
        },
        links: {
          mg_bc: h('mgr', 'bc', ['mgr', 'bc'], { heads: 'end', label: 'matches()' }),
          bc_db: h('bc', 'db', ['bc', 'db'], { heads: 'end', label: 'verify salt' }),
        },
        flows: [{ route: ['mg_bc', 'bc_db'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'CORS vs CSRF',
      chapter: 'browser',
      title: '5. Why CORS != CSRF & When Disabling CSRF Is Safe',
      body: [
        '<strong>CORS</strong> only restricts browsers reading cross-origin responses (<code>curl</code> ignores it). <strong>CSRF</strong> exploits browsers auto-attaching <code>JSESSIONID</code> cookies on forged cross-site forms.',
        'Disabling CSRF is safe <strong>ONLY</strong> for stateless APIs reading <code>Authorization: Bearer</code> headers (never cookies!).',
      ],
      callout: {
        kind: 'warn',
        text: 'If you store JWT inside an HttpOnly cookie, browsers STILL auto-send it — you MUST keep CSRF protection enabled!',
      },
      changes: ['+ Cookies auto-send -> require CSRF token', '+ Pure Bearer header -> CSRF disable safe'],
      metrics: { security_gate: 'Cors + Csrf', auth_state: 'Origin Guard', principal: 'Stateless', http_status: '403 if forged' },
      scene: {
        entities: {
          evil: d(-14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Forged POST'], sub: 'auto Cookie' }),
          csrf: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['CsrfFilter'], sub: 'checks token' }),
          api: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Bearer API'], sub: 'no cookies!' }),
          card: S({ x: -12, y: 12 }, '5. CORS vs CSRF Protection Rules', [
            '// Safe to disable CSRF ONLY if auth uses Bearer header:',
            'http.cors(Customizer.withDefaults())',
            '    .csrf(csrf -> csrf.disable()) // NO cookies!',
            '    .sessionManagement(s -> s.sessionCreationPolicy(STATELESS));',
          ], { icon: 'terminal' }),
        },
        links: {
          ev_cs: h('evil', 'csrf', ['evil', 'csrf'], { heads: 'end', label: 'blocks 403' }),
          cs_ap: h('csrf', 'api', ['csrf', 'api'], { heads: 'end', label: 'Bearer ok' }),
        },
        flows: [{ route: ['ev_cs'], kind: 'fail', rate: 1.5 }, { route: ['cs_ap'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'OAuth2 JWK',
      chapter: 'auth',
      title: '6. OAuth2 Resource Server & JWK Verification',
      body: [
        'In OAuth2/OIDC (Keycloak, Auth0), the Auth Server signs JWTs with its Private Key. Spring’s <code>oauth2ResourceServer()</code> caches public keys from <code>/.well-known/jwks.json</code>.',
        'Every incoming Bearer JWT signature and <code>exp</code> is verified locally in microseconds with zero DB/IdP round-trips.',
      ],
      callout: {
        kind: 'insight',
        text: 'Invalid or expired JWTs fail immediately with 401 Unauthorized before reaching Controllers.',
      },
      changes: ['+ Fetches & caches JWKs by key ID (kid)', '+ Verifies RS256 signature + exp locally'],
      metrics: { security_gate: 'JwtDecoder', auth_state: 'Verified JWT', principal: 'kid + claims', http_status: '401 if bad' },
      scene: {
        entities: {
          req: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Bearer JWT'], sub: 'eyJhbGci...' }),
          jwt: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['JwtDecoder'], sub: 'cached JWK' }),
          bad: d(14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['401 Unauth'], sub: 'bad/expired' }),
          card: S({ x: -12, y: 12 }, '6. Local OAuth2 JWT Verification via JWK', [
            'http.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));',
            '// Verifies RS256 signature against cached jwks.json',
            '// Bad signature or expired -> 401 Unauthorized',
          ], { icon: 'terminal' }),
        },
        links: {
          rq_jw: h('req', 'jwt', ['req', 'jwt'], { heads: 'end', label: 'decode' }),
          jw_bd: h('jwt', 'bad', ['jwt', 'bad'], { heads: 'end', label: '401 invalid' }),
        },
        flows: [{ route: ['rq_jw'], kind: 'res', rate: 1.9 }, { route: ['jw_bd'], kind: 'fail', rate: 1.3 }],
      },
    },
    {
      short: 'SecurityContext',
      chapter: 'auth',
      title: '7. Populating Thread-Scoped SecurityContextHolder',
      body: [
        'Once verified, the filter stores the <code>Authentication</code> object in <code>SecurityContextHolder.getContext()</code> (backed by a <code>ThreadLocal</code>).',
        'Controllers and Services can now read <code>@AuthenticationPrincipal</code> anywhere downstream, and Spring clears the context in a <code>finally</code> block after the request.',
      ],
      callout: {
        kind: 'insight',
        text: 'Because SecurityContextHolder uses ThreadLocal, async @Async methods need DelegatingSecurityContextExecutor to propagate identity.',
      },
      changes: ['+ Authentication stored in ThreadLocal', '+ Cleared in finally after response'],
      metrics: { security_gate: 'ContextHolder', auth_state: 'Authenticated', principal: 'ROLE_ADMIN', http_status: 'Proceed' },
      scene: {
        entities: {
          jwt: d(-14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['JwtAuthFilter'], sub: 'valid token' }),
          ctx: b(0, -10, { r: 2.2, h: 48, color: 'purple', label: ['SecContext'], sub: 'ThreadLocal' }),
          authz: d(14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['AuthzFilter'], sub: 'reads roles' }),
          card: S({ x: -12, y: 12 }, '5. Setting SecurityContextHolder', [
            'SecurityContext ctx = SecurityContextHolder.createEmptyContext();',
            'ctx.setAuthentication(authToken);',
            'SecurityContextHolder.setContext(ctx);',
            '// Cleared automatically by SecurityContextHolderFilter!',
          ], { icon: 'terminal' }),
        },
        links: {
          jw_cx: h('jwt', 'ctx', ['jwt', 'ctx'], { heads: 'end', label: 'setAuth' }),
          cx_az: h('ctx', 'authz', ['ctx', 'authz'], { heads: 'end', label: 'getAuth' }),
        },
        flows: [{ route: ['jw_cx', 'cx_az'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'RBAC 401/403',
      chapter: 'authz',
      title: '8. AuthorizationFilter & @PreAuthorize (401 vs 403)',
      body: [
        'At the end of the chain, <code>AuthorizationFilter</code> checks URL rules and <code>@EnableMethodSecurity</code> checks <code>@PreAuthorize("hasRole(\'ADMIN\')")</code>.',
        '<strong>401 Unauthorized</strong> means "who are you?" (not authenticated); <strong>403 Forbidden</strong> means "I know you, but you lack permission".',
      ],
      callout: {
        kind: 'tip',
        text: 'Use @PreAuthorize on Service methods as defense-in-depth alongside URL rules in SecurityFilterChain.',
      },
      changes: ['+ AuthorizationFilter checks ROLE_ADMIN', '+ Allows 200 to Controller or returns 403'],
      metrics: { security_gate: 'AuthzFilter', auth_state: 'Authorized', principal: 'ROLE_ADMIN', http_status: '200 or 403' },
      scene: {
        entities: {
          authz: d(-12, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'shield', label: ['AuthzFilter'], sub: 'hasRole ADMIN' }),
          ctrl: d(2, -14, { s: 4.8, h: 54, color: 'green', glyph: 'code', label: ['AdminCtrl'], sub: '200 OK' }),
          deny: d(2, -2, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['403 Forbidden'], sub: 'lacks role' }),
          card: S({ x: -12, y: 12 }, '6. Method Security & HTTP Status Codes', [
            '@PreAuthorize("hasRole(\'ADMIN\')")',
            'public List<UserDto> listUsers() { ... }',
            '// No / bad token -> 401 Unauthorized',
            '// Valid token, wrong role -> 403 Forbidden',
          ], { icon: 'terminal' }),
        },
        links: {
          az_ct: h('authz', 'ctrl', ['authz', 'ctrl'], { heads: 'end', label: '200 OK' }),
          az_dn: h('authz', 'deny', ['authz', 'deny'], { heads: 'end', label: 'deny -> 403' }),
        },
        flows: [{ route: ['az_ct'], kind: 'res', rate: 2.0 }, { route: ['az_dn'], kind: 'fail', rate: 1.3 }],
      },
    },
  ],
};
