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
  title: 'Spring Security & Filter Chain Architecture',
  summary:
    'Trace how Spring Security bridges Tomcat via DelegatingFilterProxy, runs SecurityFilterChain, validates JWTs, populates SecurityContextHolder, and enforces RBAC.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['security_gate', 'auth_state', 'principal', 'http_status'],
  legend: ['flow', ['req', 'inspect / verify'], ['res', 'authenticated'], ['fail', '401 / 403 deny']],
  goals: [
    { text: 'Expose unprotected endpoint risk before Security', step: 1 },
    { text: 'Bridge Tomcat to Spring via DelegatingFilterProxy', step: 2 },
    { text: 'Route through ordered SecurityFilterChain', step: 3 },
    { text: 'Verify JWT signature & claims in custom Filter', step: 4 },
    { text: 'Populate thread-scoped SecurityContextHolder', step: 5 },
    { text: 'Enforce RBAC (401 vs 403) in AuthorizationFilter', step: 6 },
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
      short: 'JWT Filter',
      chapter: 'auth',
      title: '4. JWT Verification Filter (Signature & Expiry)',
      body: [
        '<code>BearerTokenAuthenticationFilter</code> (or a custom <code>OncePerRequestFilter</code>) extracts the <code>Authorization: Bearer &lt;jwt&gt;</code> header.',
        'It verifies the cryptographic signature (RS256/HS256) and <code>exp</code> timestamp without hitting the database on every request.',
      ],
      callout: {
        kind: 'warn',
        text: 'Invalid or expired tokens return HTTP 401 Unauthorized immediately from AuthenticationEntryPoint.',
      },
      changes: ['+ OncePerRequestFilter extracts Bearer JWT', '+ Verifies signature + exp locally'],
      metrics: { security_gate: 'JwtAuthFilter', auth_state: 'Verified JWT', principal: 'userId + roles', http_status: '401 if bad' },
      scene: {
        entities: {
          req: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['Bearer Header'], sub: 'eyJhbGci...' }),
          jwt: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['JwtAuthFilter'], sub: 'verify RS256' }),
          bad: d(14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['401 Unauth'], sub: 'bad/expired' }),
          card: S({ x: -12, y: 12 }, '4. Stateless JWT Verification', [
            '// OncePerRequestFilter runs once per HTTP request:',
            'Jwt jwt = jwtDecoder.decode(bearerToken); // sig + exp',
            'var auth = new JwtAuthenticationToken(jwt, authorities);',
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
      title: '5. Populating Thread-Scoped SecurityContextHolder',
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
      title: '6. AuthorizationFilter & @PreAuthorize (401 vs 403)',
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
