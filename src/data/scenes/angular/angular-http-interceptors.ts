// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularHttpInterceptorsLesson = {
  id: 'angular-http-interceptors',
  title: 'HTTP Interceptors Pipeline & Request Cloning',
  summary: 'Trace the Middleware Chain of Responsibility: immutable request cloning (req.clone()), injecting JWT Bearer tokens, exponential backoff retries, and functional withInterceptors().',
  minutes: 15,
  level: 'advanced',
  metrics: ['pipelineStage', 'authHeaderInjected', 'retryAttempt', 'responseTransformed'],
  legend: ['req', ['auth', 'token injection'], ['retry', 'backoff loop'], ['res', 'response']],
  goals: [
    { text: 'The Chain of Responsibility: how HTTP requests traverse interceptors', step: 1 },
    { text: 'Immutability: why you must call req.clone() to modify headers or body', step: 2 },
    { text: 'Error handling & retry with exponential backoff', step: 3 },
    { text: 'Functional interceptors: provideHttpClient(withInterceptors([authInterceptor]))', step: 4 },
  ],
  steps: [
    {
      short: 'Pipeline Chain',
      chapter: 'setup',
      title: 'Chain of Responsibility Middleware',
      body: [
        'When your component calls <code>http.get(\'/api/profile\')</code>, the request passes through a linked chain of interceptors before touching the browser’s XMLHttpRequest / fetch backend.',
        'Each interceptor receives the <code>HttpRequest</code> and a <code>HttpHandlerFn</code> (<code>next</code>). Calling <code>next(req)</code> forwards the request to the next interceptor in line.',
      ],
      callout: {
        kind: 'insight',
        text: 'Interceptors act on both sides of the lifecycle: inspecting the outgoing request and transforming the incoming response stream.',
      },
      metrics: { pipelineStage: 'Dispatch', authHeaderInjected: 'No', retryAttempt: '0', responseTransformed: 'Pending' },
      scene: {
        entities: {
          client: d(-12, 0, { color: 'slab', glyph: 'terminal', label: ['HttpClient'], sub: 'http.get("/api/user")' }),
          auth: d(-4, 0, { color: 'amber', glyph: 'boxes', label: ['Auth Interceptor'], sub: 'injects Bearer token' }),
          logging: d(4, 0, { color: 'blue', glyph: 'boxes', label: ['Logging Interceptor'], sub: 'measures latency' }),
          backend: d(12, 0, { color: 'green', glyph: 'cloud', label: ['HttpBackend'], sub: 'browser fetch API' }),
          zChain: x({ x0: -6, x1: 6, y0: -5, y1: 5 }, 'INTERCEPTOR CHAIN PIPELINE'),
        },
        links: {
          ca: h('client', 'auth', ['client', 'auth'], { label: 'req' }),
          al: h('auth', 'logging', ['auth', 'logging'], { label: 'next(req)' }),
          lb: h('logging', 'backend', ['logging', 'backend'], { label: 'next(req)' }),
        },
        flows: [{ route: ['ca', 'al', 'lb'], rate: 1.4 }],
      },
    },
    {
      short: 'Req Cloning',
      chapter: 'technique',
      title: 'Immutability: req.clone({ setHeaders: { ... } })',
      body: [
        '<code>HttpRequest</code> objects are strictly immutable. You cannot write <code>req.headers.set(...)</code>.',
        'To mutate a request, you must create a clone: <code>const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })</code>. This guarantees that retry loops or concurrent branches operate on clean, unpolluted request states.',
      ],
      callout: {
        kind: 'tip',
        text: 'Immutable requests ensure that multiple retry attempts don’t accidentally duplicate or corrupt header values.',
      },
      changes: ['+ Original request untouched', '+ Cloned request carries Authorization: Bearer <jwt>'],
      metrics: { pipelineStage: 'Cloning', authHeaderInjected: 'Bearer eyJhbG...', retryAttempt: '0', responseTransformed: 'Active' },
      scene: {
        entities: {
          orig: d(-8, 0, { color: 'slab', glyph: 'terminal', label: ['Original Request'], sub: 'immutable frozen' }),
          clone: d(6, 0, { color: 'green', glyph: 'boxes', label: ['Cloned Request'], sub: 'Authorization: Bearer <JWT>' }),
        },
        links: {
          oc: h('orig', 'clone', ['orig', 'clone'], { label: 'req.clone()' }),
        },
        flows: [{ route: ['oc'], kind: 'auth', rate: 1.5 }],
      },
    },
    {
      short: 'Error & Retry',
      chapter: 'solution',
      title: 'Exponential Backoff Retry & Functional withInterceptors',
      body: [
        'In the response pipeline, interceptors catch 401 or 503 errors using RxJS <code>catchError</code>.',
        'If a token expires, the interceptor refreshes the token and replays the original request. If a 503 network blip occurs, the <code>retry({ delay: ... })</code> operator applies exponential backoff.',
        'Modern Angular: Configure directly via <code>provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor]))</code> without class boilerplate!',
      ],
      callout: {
        kind: 'insight',
        text: 'Functional interceptors directly leverage inject(AuthService) inside their function body without class constructors.',
      },
      changes: ['+ 503 network error caught', '+ Automatic retry with exponential backoff (1s, 2s, 4s)', '+ Transparent response delivery'],
      metrics: { pipelineStage: 'Resolved', authHeaderInjected: 'Yes', retryAttempt: '1 (Successful)', responseTransformed: '200 OK' },
      scene: {
        entities: {
          inter: d(-8, 0, { color: 'purple', glyph: 'boxes', label: ['Error Interceptor'], sub: 'catchError(401 / 503)' }),
          retryLoop: d(0, -5, { color: 'amber', glyph: 'terminal', label: ['Retry Backoff'], sub: 'delay: 1000ms' }),
          app: d(8, 0, { color: 'green', glyph: 'terminal', label: ['Component Consumer'], sub: 'receives clean data' }),
        },
        links: {
          ir: h('inter', 'retryLoop', ['inter', 'retryLoop'], { label: 'catchError' }),
          ra: h('retryLoop', 'app', ['retryLoop', 'app'], { label: '200 OK replay' }),
        },
        flows: [{ route: ['ir', 'ra'], kind: 'retry', rate: 1.6 }],
      },
    },
  ],
};
