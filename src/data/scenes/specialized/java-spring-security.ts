// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDevice as y,
} from '@/lib/simulator/scene-builders';

export const javaSpringSecurityLesson = {
  id: 'java-spring-security',
  title: 'Spring Security Filter Chain Architecture',
  summary: 'Trace the SecurityFilterChain pipeline: DelegatingFilterProxy, JWT authentication filter, AuthenticationManager, and SecurityContextHolder.',
  minutes: 8,
  level: 'intermediate',
  metrics: ['authStatus', 'tokenType', 'principal', 'authorities'],
  goals: [
    { text: 'Understand DelegatingFilterProxy bridging Servlet container to Spring', step: 1 },
    { text: 'Validate JWT tokens inside OncePerRequestFilter pipeline', step: 2 },
    { text: 'Populate SecurityContextHolder with Authentication token', step: 3 },
  ],
  steps: [
    {
      short: 'Filter Chain',
      chapter: 'technique',
      title: 'SecurityFilterChain & DelegatingFilterProxy',
      body: [
        'Incoming HTTP requests hit standard Servlet filters before reaching Spring.',
        'DelegatingFilterProxy bridges the request to Spring Security’s SecurityFilterChain, passing through CSRF, CORS, and Authentication filters in sequence.',
      ],
      callout: { kind: 'tip', text: 'Spring Security 6+ uses the component-based SecurityFilterChain bean instead of deprecated WebSecurityConfigurerAdapter.' },
      metrics: { authStatus: 'INSPECTING', tokenType: 'Bearer JWT', principal: 'anonymousUser', authorities: 'NONE' },
      scene: {
        entities: {
          client: y(-11, -8, { label: 'HTTP Request', tags: [{ text: 'Authorization: Bearer', icon: 'lock' }] }),
          filter: d(-2, -8,  { color: 'purple', glyph: 'shield', label: ['JwtAuthFilter'], sub: 'OncePerRequest' }),
          authMgr: d(-2, 4,  { color: 'orange', glyph: 'check', label: ['AuthManager'], sub: 'JwtProvider' }),
          secCtx:  d(9, 4,   { color: 'green', glyph: 'layers', label: ['SecurityContext'], sub: 'ThreadLocal' }),
        },
        links: {
          cf: h('client', 'filter', ['client', 'filter'], { label: 'intercept', heads: 'end' }),
          fa: h('filter', 'authMgr', ['filter', 'authMgr'], { label: 'authenticate()', heads: 'end' }),
          as: h('authMgr', 'secCtx', ['authMgr', 'secCtx'], { label: 'store Principal', heads: 'end' }),
        },
        flows: [
          { route: ['cf', 'fa', 'as'], bounce: false, rate: 1.1 },
        ],
      },
    },
    {
      short: 'Authorized Access',
      chapter: 'technique',
      title: 'Context Propagation & Method Security (@PreAuthorize)',
      body: [
        'Once authenticated, the UsernamePasswordAuthenticationToken is stored in SecurityContextHolder (ThreadLocal).',
        '@PreAuthorize("hasRole(\'ADMIN\')") evaluates expressions against the current SecurityContext before allowing method execution.',
      ],
      callout: { kind: 'insight', text: 'When dispatching tasks to worker threads, use DelegatingSecurityContextExecutorService to propagate the ThreadLocal SecurityContext.' },
      metrics: { authStatus: 'AUTHENTICATED', tokenType: 'JWT Valid', principal: 'user@dawn.dev', authorities: 'ROLE_ADMIN' },
      scene: {
        entities: {
          secCtx:     d(-11, -2, { color: 'green', glyph: 'layers', label: ['SecurityContext'], sub: 'ROLE_ADMIN' }),
          dispatcher: d(-2, -2,  { color: 'blue', glyph: 'code', label: ['Dispatcher'], sub: 'Spring MVC' }),
          endpoint:   d(9, -2,   { color: 'purple', glyph: 'shield', label: ['AdminController'], sub: '@PreAuthorize' }),
        },
        links: {
          sd: h('secCtx', 'dispatcher', ['secCtx', 'dispatcher'], { label: 'authenticated', heads: 'end' }),
          de: h('dispatcher', 'endpoint', ['dispatcher', 'endpoint'], { label: 'dispatch', heads: 'end' }),
        },
        flows: [
          { route: ['sd', 'de'], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: 'SecurityContext',
      chapter: 'solution',
      title: 'SecurityContextHolder: ThreadLocal, Inheritable & Reactive',
      body: [
        'By default, <code>SecurityContextHolder</code> stores the authenticated Principal in a <code>ThreadLocal</code> variable tied to the current request thread.',
        'When tasks branch across threads, <code>MODE_INHERITABLETHREADLOCAL</code> or reactive <code>ReactiveSecurityContextHolder</code> (Reactor Context) propagates authentication tokens across thread boundaries.',
      ],
      callout: { kind: 'tip', text: 'Always ensure SecurityContext is cleared after request processing to prevent thread-reuse credential leakage in pooled thread environments.' },
      metrics: { authStatus: 'AUTHORIZED', tokenType: 'JWT Validated', principal: 'user@dawn.dev', authorities: 'ACCESS_GRANTED' },
      scene: {
        entities: {
          token:   d(-12, -4, { color: 'green', glyph: 'check', label: ['Auth Token'], sub: 'Principal' }),
          holder:  d(-2, -4,  { color: 'blue', glyph: 'layers', label: ['ContextHolder'], sub: 'ThreadLocal' }),
          service: d(10, -4,  { color: 'purple', glyph: 'shield', label: ['Protected Service'], sub: 'Access Granted' }),
        },
        links: {
          th: h('token', 'holder', ['token', 'holder'], { label: 'setContext()', heads: 'end' }),
          hs: h('holder', 'service', ['holder', 'service'], { label: 'getContext().getAuth()', heads: 'end' }),
        },
        flows: [
          { route: ['th', 'hs'], bounce: false, rate: 1.2 },
        ],
      },
    },
  ],
};

export default javaSpringSecurityLesson;
