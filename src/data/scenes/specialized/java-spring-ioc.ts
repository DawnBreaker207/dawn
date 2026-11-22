// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDevice as y,
} from '@/lib/simulator/scene-builders';

export const javaSpringIocLesson = {
  id: 'java-spring-ioc',
  title: 'Spring IoC Container & Bean Lifecycle',
  summary: 'Inspect ApplicationContext architecture: component scanning, BeanDefinition registration, dependency injection, and post-processor lifecycles.',
  minutes: 8,
  level: 'intermediate',
  metrics: ['containerState', 'beanCount', 'injectionMode', 'scope'],
  goals: [
    { text: 'ApplicationContext Bootstrap', step: 1 },
    { text: 'Constructor Dependency Injection', step: 2 },
    { text: 'BeanPostProcessor Lifecycle Hooks', step: 3 },
  ],
  steps: [
    {
      short: 'IoC Bootstrap',
      chapter: 'technique',
      title: 'Spring ApplicationContext & BeanFactory Bootstrap',
      body: [
        'The Spring IoC Container scans @Component classes, building an in-memory registry of BeanDefinitions.',
        'Beans are instantiated in topological dependency order and cached in the singleton objects map.',
      ],
      callout: { kind: 'tip', text: 'Prefer constructor injection over field injection (@Autowired on fields) to guarantee immutability and simple unit test mocking.' },
      metrics: { containerState: 'INITIALIZED', beanCount: '48 singletons', injectionMode: 'Constructor DI', scope: 'Singleton' },
      scene: {
        entities: {
          ctx:        d(-11, -8, { color: 'green', glyph: 'layers', label: ['App Context'], sub: 'BeanFactory' }),
          controller: d(-2, -8,  { color: 'blue', glyph: 'code', label: ['Controller'], sub: '@RestController' }),
          service:    d(-2, 4,   { color: 'blue', glyph: 'code', label: ['Service'], sub: '@Service' }),
          repo:       d(9, 4,    { color: 'violet', glyph: 'db', label: ['Repository'], sub: '@Repository' }),
        },
        links: {
          cc: h('ctx', 'controller', ['ctx', 'controller'], { label: 'instantiate', heads: 'end' }),
          cs: h('controller', 'service', ['controller', 'service'], { label: '@Autowired', heads: 'end' }),
          sr: h('service', 'repo', ['service', 'repo'], { label: 'inject', heads: 'end' }),
        },
        flows: [
          { route: ['cs', 'sr'], bounce: false, rate: 1.0 },
        ],
      },
    },
    {
      short: 'PostProcessors',
      chapter: 'technique',
      title: 'BeanPostProcessor & Proxy Wrapping (AOP)',
      body: [
        'Before a bean is delivered to callers, BeanPostProcessors intercept it.',
        'Annotations like @Transactional and @Async wrap the raw bean in a CGLIB or Dynamic JDK Proxy.',
      ],
      callout: { kind: 'insight', text: 'Self-invocation within the same class bypasses the proxy, meaning @Transactional does NOT start a transaction on internal method calls.' },
      metrics: { containerState: 'READY', beanCount: 'Proxy Wrapped', injectionMode: 'AOP Intercept', scope: 'Singleton Proxy' },
      scene: {
        entities: {
          caller: y(-11, -2, { label: 'HTTP Request', tags: [{ text: 'GET /orders', icon: 'zap' }] }),
          proxy:  d(-2, -2,  { color: 'orange', glyph: 'shield', label: ['CGLIB Proxy'], sub: '@Transactional' }),
          target: d(9, -2,   { color: 'blue', glyph: 'code', label: ['OrderService'], sub: 'Target Bean' }),
        },
        links: {
          cp: h('caller', 'proxy', ['caller', 'proxy'], { label: 'invoke', heads: 'end' }),
          pt: h('proxy', 'target', ['proxy', 'target'], { label: 'proceed()', heads: 'end' }),
        },
        flows: [
          { route: ['cp', 'pt'], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: 'Destruction & Hooks',
      chapter: 'solution',
      title: 'Bean Lifecycle: @PreDestroy & Context Shutdown Hooks',
      body: [
        'When the Spring ApplicationContext shuts down (e.g. SIGTERM in Kubernetes), it executes <code>DisposableBean.destroy()</code> and <code>@PreDestroy</code> hooks in reverse dependency order.',
        'This flushes database connection pools, unregisters discovery heartbeats, and allows in-flight HTTP requests to complete gracefully.',
      ],
      callout: { kind: 'tip', text: 'Enable server.shutdown=graceful in Spring Boot to automatically reject new traffic while draining pending requests during rolling deploys.' },
      metrics: { containerState: 'SHUTTING DOWN', beanCount: 'Draining Queues', injectionMode: 'Graceful Stop', scope: 'Clean Shutdown' },
      scene: {
        entities: {
          hook:   d(-12, -4, { color: 'rose', glyph: 'power', label: ['Shutdown Hook'], sub: 'SIGTERM' }),
          ctx:    d(-2, -4,  { color: 'orange', glyph: 'layers', label: ['App Context'], sub: 'close()' }),
          beans:  d(10, -4,  { color: 'green', glyph: 'check', label: ['@PreDestroy'], sub: 'Drain Queues' }),
        },
        links: {
          hc: h('hook', 'ctx', ['hook', 'ctx'], { label: 'stop signal', heads: 'end' }),
          cb: h('ctx', 'beans', ['ctx', 'beans'], { label: 'destroy() reverse order', heads: 'end' }),
        },
        flows: [
          { route: ['hc', 'cb'], bounce: false, rate: 1.2 },
        ],
      },
    },
  ],
};

export default javaSpringIocLesson;
