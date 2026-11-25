/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const javaSpringOauth2AuthLesson: Lesson = {
  id: 'java-spring-oauth2-auth',
  title: 'AuthenticationProvider, BCrypt, CSRF/CORS & OAuth2 JWK',
  summary:
    'Understand Spring Security In Action internals: DaoAuthenticationProvider + BCrypt work factor, why CORS != CSRF, when to disable CSRF, and OAuth2 Resource Server JWK verification.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['auth_mechanism', 'hash_algo', 'browser_guard', 'token_trust'],
  legend: ['flow', ['req', 'authenticate'], ['res', 'verified / ok'], ['fail', '401 / CSRF block']],
  goals: [
    { text: 'Delegate credentials via AuthenticationManager -> Provider', step: 1 },
    { text: 'Slow brute-force via BCrypt adaptive salt & work factor', step: 2 },
    { text: 'Distinguish CORS (Same-Origin) from CSRF (Cookie attack)', step: 3 },
    { text: 'Explain when disabling CSRF is safe (stateless Bearer)', step: 4 },
    { text: 'Verify OAuth2 JWTs via Resource Server JWK Set', step: 5 },
    { text: 'Map OAuth2 scopes & claims to GrantedAuthorities', step: 6 },
  ],
  steps: [
    {
      short: 'AuthProvider',
      chapter: 'auth',
      title: '1. AuthenticationManager -> DaoAuthenticationProvider',
      body: [
        '<code>AuthenticationManager</code> (<code>ProviderManager</code>) does not verify passwords itself — it loops through registered <code>AuthenticationProvider</code>s until one supports the token type.',
        'For username/password logins, <code>DaoAuthenticationProvider</code> loads the user via <code>UserDetailsService</code> and delegates hash verification to <code>PasswordEncoder</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Spring Security In Action: Decoupling ProviderManager from AuthenticationProvider lets one app support Passwords, API Keys, and JWTs.',
      },
      metrics: { auth_mechanism: 'DaoProvider', hash_algo: 'Delegated', browser_guard: 'Pending', token_trust: 'Credentials' },
      scene: {
        entities: {
          mgr: d(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['AuthManager'], sub: 'ProviderMgr' }),
          dao: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['DaoProvider'], sub: 'UserDetailsSvc' }),
          db: b(14, -10, { r: 2.2, h: 48, color: 'sky', label: ['Users DB'], sub: 'hashed pass' }),
          card: S({ x: -12, y: 12 }, '1. Provider-Based Authentication Flow', [
            '// ProviderManager delegates to DaoAuthenticationProvider:',
            'UserDetails user = userDetailsService.loadUserByUsername(name);',
            'if (!passwordEncoder.matches(rawPass, user.getPassword()))',
            '  throw new BadCredentialsException("Invalid");',
          ], { icon: 'terminal' }),
        },
        links: {
          mg_da: h('mgr', 'dao', ['mgr', 'dao'], { heads: 'end', label: 'authenticate' }),
          da_db: h('dao', 'db', ['dao', 'db'], { heads: 'end', label: 'loadUser' }),
        },
        flows: [{ route: ['mg_da', 'da_db'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'BCrypt',
      chapter: 'auth',
      title: '2. Why PasswordEncoder Uses BCrypt (Not SHA-256)',
      body: [
        'Fast hashes like MD5/SHA-256 can be brute-forced at billions of guesses/sec on GPUs. <strong>BCrypt</strong> is deliberately slow (~100ms) with a per-user random 128-bit salt embedded right inside the hash string.',
        'Cost factor <code>10–12</code> ($2^{10}$–$2^{12}$ rounds) scales as hardware gets faster without breaking old hashes.',
      ],
      callout: {
        kind: 'warn',
        text: 'NEVER use MessageDigest SHA-256 for passwords — always use BCryptPasswordEncoder or Argon2PasswordEncoder.',
      },
      changes: ['+ Random 128-bit salt defeats rainbow tables', '+ Cost factor 10+ slows GPU brute-force'],
      metrics: { auth_mechanism: 'PasswordEnc', hash_algo: 'BCrypt (2^10)', browser_guard: 'Salted', token_trust: 'Verified' },
      scene: {
        entities: {
          raw: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['"s3cr3t" + Salt'], sub: '128-bit salt' }),
          bc: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['BCrypt 2^10'], sub: '~100ms hash' }),
          out: b(14, -10, { r: 2.2, h: 48, color: 'purple', label: ['$2a$10$...'], sub: 'salt+cost+hash' }),
          card: S({ x: -12, y: 12 }, '2. Anatomy of a BCrypt Hash String', [
            '@Bean PasswordEncoder passwordEncoder() {',
            '  return new BCryptPasswordEncoder(12); // 2^12 rounds',
            '}',
            '// Stored: $2a$12$<22-char salt><31-char hash>',
          ], { icon: 'terminal' }),
        },
        links: {
          rw_bc: h('raw', 'bc', ['raw', 'bc'], { heads: 'end', label: '2^10 rounds' }),
          bc_ot: h('bc', 'out', ['bc', 'out'], { heads: 'end', label: 'store hash' }),
        },
        flows: [{ route: ['rw_bc', 'bc_ot'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'CORS vs CSRF',
      chapter: 'browser',
      title: '3. Why CORS Is NOT Security & How CSRF Works',
      body: [
        '<strong>CORS</strong> only tells browsers which frontend origins may <em>read</em> responses (an attacker using <code>curl</code> ignores CORS completely!).',
        '<strong>CSRF</strong> exploits browsers auto-attaching <code>JSESSIONID</code> cookies when an evil site submits a hidden form <code>POST /transfer</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'CORS protects users from cross-origin data reading; CSRF protects cookie-authenticated endpoints from forged state-changing requests.',
      },
      changes: ['+ Evil site triggers browser auto-cookie', '+ Synchronizer CSRF token blocks forged POST'],
      metrics: { auth_mechanism: 'Cookie Session', hash_algo: 'BCrypt', browser_guard: 'CSRF Token', token_trust: 'Origin check' },
      scene: {
        entities: {
          evil: d(-14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Evil Form POST'], sub: 'auto Cookie' }),
          csrf: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['CsrfFilter'], sub: 'checks X-CSRF' }),
          blk: d(14, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['403 Blocked'], sub: 'missing token' }),
          card: S({ x: -12, y: 12 }, '3. Why Cookies Require CSRF Protection', [
            '// Browser auto-sends Cookies on cross-site POST!',
            '// Evil site CANNOT read X-CSRF-TOKEN header/cookie',
            '// CsrfFilter rejects POST without matching token -> 403',
          ], { icon: 'terminal' }),
        },
        links: {
          ev_cs: h('evil', 'csrf', ['evil', 'csrf'], { heads: 'end', label: 'auto cookie' }),
          cs_bk: h('csrf', 'blk', ['csrf', 'blk'], { heads: 'end', label: 'no token' }),
        },
        flows: [{ route: ['ev_cs', 'cs_bk'], kind: 'fail', rate: 1.8 }],
      },
    },
    {
      short: 'Stateless CSRF',
      chapter: 'browser',
      title: '4. When Disabling CSRF Is Safe (Stateless Bearer JWT)',
      body: [
        'If your REST API is <strong>100% stateless</strong> and reads tokens ONLY from the <code>Authorization: Bearer &lt;jwt&gt;</code> header (NOT cookies), browsers never auto-attach that header on cross-site forms.',
        'That is why disabling CSRF is safe ONLY for non-cookie Bearer APIs — if you store JWT in an <code>HttpOnly</code> cookie, you MUST keep CSRF enabled!',
      ],
      callout: {
        kind: 'warn',
        text: 'Never disable CSRF blindly if your app uses Cookie-based sessions or stores JWT inside Cookies!',
      },
      changes: ['+ Bearer header not auto-sent by browser', '+ Safe to disable CSRF for pure Bearer API'],
      metrics: { auth_mechanism: 'Bearer Header', hash_algo: 'RS256 JWT', browser_guard: 'CORS Allowlist', token_trust: 'Explicit hdr' },
      scene: {
        entities: {
          spa: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['SPA / Mobile'], sub: 'Bearer header' }),
          cors: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['CorsFilter'], sub: 'allow origins' }),
          api: d(14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Stateless API'], sub: 'no cookies' }),
          card: S({ x: -12, y: 12 }, '4. Configuring CORS + Stateless CSRF Safely', [
            'http.cors(Customizer.withDefaults())',
            '    // Safe ONLY when auth uses Authorization: Bearer (no cookies!)',
            '    .csrf(csrf -> csrf.disable())',
            '    .sessionManagement(s -> s.sessionCreationPolicy(STATELESS));',
          ], { icon: 'terminal' }),
        },
        links: {
          sp_cr: h('spa', 'cors', ['spa', 'cors'], { heads: 'end', label: 'OPTIONS/API' }),
          cr_ap: h('cors', 'api', ['cors', 'api'], { heads: 'end', label: 'Bearer hdr' }),
        },
        flows: [{ route: ['sp_cr', 'cr_ap'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'OAuth2 JWK',
      chapter: 'oauth2',
      title: '5. OAuth2 Resource Server & JWK Public Key Verification',
      body: [
        'In OAuth2 / OIDC (Keycloak, Auth0, Okta), the Authorization Server signs JWTs with its <strong>Private Key</strong>.',
        'Spring’s <code>oauth2ResourceServer()</code> fetches and caches the public keys from <code>/.well-known/jwks.json</code> (by <code>kid</code>) to verify JWT signatures locally with zero DB/auth-server call per request!',
      ],
      callout: {
        kind: 'insight',
        text: 'Key rotation works seamlessly: NimbusJwtDecoder caches JWKs and re-fetches if an unknown key ID (kid) arrives.',
      },
      changes: ['+ Auth Server signs with Private Key', '+ Resource Server verifies via cached JWK'],
      metrics: { auth_mechanism: 'OAuth2 JWT', hash_algo: 'RS256 JWK', browser_guard: 'Stateless', token_trust: 'Asymmetric PKI' },
      scene: {
        entities: {
          idp: b(-14, -10, { r: 2.2, h: 48, color: 'purple', label: ['Auth Server'], sub: 'jwks.json' }),
          dec: d(0, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['JwtDecoder'], sub: 'caches pub key' }),
          res: d(14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'layers', label: ['Resource Svc'], sub: '0 Auth RTT' }),
          card: S({ x: -12, y: 12 }, '5. Asymmetric OAuth2 Resource Server', [
            '// application.yml:',
            '// spring.security.oauth2.resourceserver.jwt.issuer-uri=...',
            'http.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));',
            '// Verifies RS256 signature locally using cached JWK!',
          ], { icon: 'terminal' }),
        },
        links: {
          id_dc: h('idp', 'dec', ['idp', 'dec'], { heads: 'end', label: 'fetch JWKs' }),
          dc_rs: h('dec', 'res', ['dec', 'res'], { heads: 'end', label: 'verified JWT' }),
        },
        flows: [{ route: ['id_dc', 'dc_rs'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Authorities',
      chapter: 'oauth2',
      title: '6. Mapping JWT Claims to Spring GrantedAuthorities',
      body: [
        'By default, Spring maps the JWT <code>scope</code> claim to <code>SCOPE_read</code> authorities. Custom claims like Keycloak <code>realm_access.roles</code> need a <code>JwtAuthenticationConverter</code>.',
        'Remember the classic Spring Security distinction: <code>hasRole("ADMIN")</code> automatically prefixes <code>ROLE_</code>, whereas <code>hasAuthority("SCOPE_orders:write")</code> matches verbatim!',
      ],
      callout: {
        kind: 'tip',
        text: 'Classic Spring Security pitfall: hasRole("ADMIN") checks for "ROLE_ADMIN" — do not double-prefix "ROLE_ADMIN" inside hasRole()!',
      },
      changes: ['+ JwtAuthenticationConverter maps roles', '+ hasRole("X") == hasAuthority("ROLE_X")'],
      metrics: { auth_mechanism: 'RBAC / Scope', hash_algo: 'RS256 JWT', browser_guard: 'Method Sec', token_trust: 'GrantedAuth' },
      scene: {
        entities: {
          jwt: d(-14, -10, { s: 4.8, h: 54, color: 'sky', glyph: 'code', label: ['JWT Claims'], sub: 'roles: [ADMIN]' }),
          conv: d(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'cpu', label: ['JwtAuthConv'], sub: 'ROLE_ prefix' }),
          authz: d(14, -10, { s: 4.8, h: 54, color: 'green', glyph: 'shield', label: ['@PreAuthorize'], sub: 'hasRole ADMIN' }),
          card: S({ x: -12, y: 12 }, '6. Mapping Custom JWT Roles to Authorities', [
            '// hasRole("ADMIN")  <=> hasAuthority("ROLE_ADMIN")',
            '// hasAuthority("SCOPE_orders:write") <=> exact match',
            '@PreAuthorize("hasRole(\'ADMIN\') or hasAuthority(\'SCOPE_write\')")',
          ], { icon: 'terminal' }),
        },
        links: {
          jw_cv: h('jwt', 'conv', ['jwt', 'conv'], { heads: 'end', label: 'extract roles' }),
          cv_az: h('conv', 'authz', ['conv', 'authz'], { heads: 'end', label: 'ROLE_ADMIN' }),
        },
        flows: [{ route: ['jw_cv', 'cv_az'], kind: 'res', rate: 1.9 }],
      },
    },
  ],
};
