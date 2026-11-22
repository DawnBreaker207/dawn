// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDevice as y,
} from '@/lib/simulator/scene-builders';

export const javaSpringAopLesson = {
  id: 'java-spring-aop',
  title: 'Spring AOP, Dynamic Proxies & Interceptor Chains',
  summary: 'Visualize how Spring AOP weaves cross-cutting concerns (logging, security, @Transactional) via JDK Dynamic Proxies and CGLIB bytecode subclassing, and learn to avoid self-invocation pitfalls.',
  minutes: 10,
  level: 'intermediate',
  metrics: ['proxyType', 'interceptorChain', 'weavingTiming', 'targetState'],
  goals: [
    { text: 'Compare JDK Dynamic Proxy (interface-based) vs CGLIB (subclass bytecode)', step: 1 },
    { text: 'Trace MethodInvocation advice chains (@Before, @Around, @AfterReturning)', step: 2 },
    { text: 'Diagnose self-invocation (this.method()) bypassing the proxy container', step: 3 },
  ],
  steps: [
    {
      short: 'Proxy Selection',
      chapter: 'technique',
      title: 'Proxy Creation: JDK Dynamic Proxy vs CGLIB Subclassing',
      body: [
        'Spring creates proxies using either <b>JDK Dynamic Proxies</b> (for classes implementing interfaces) or <b>CGLIB</b> (which generates a dynamic subclass overriding methods).',
        'Spring Boot 2+ defaults to CGLIB for consistent bean injection without requiring interface casting.',
      ],
      callout: { kind: 'tip', text: 'Final classes or final methods cannot be proxied by CGLIB because bytecode subclasses cannot override final members.' },
      metrics: { proxyType: 'CGLIB Subclass', interceptorChain: '3 Interceptors', weavingTiming: 'Runtime Initialization', targetState: 'Wrapped Target' },
      scene: {
        entities: {
          client: y(-12, -4, { label: 'Client Caller', tags: [{ text: 'service.doWork()', icon: 'zap' }] }),
          proxy:  d(-2, -4,  { color: 'orange', glyph: 'shield', label: ['AOP Proxy'], sub: 'CGLIB Subclass' }),
          target: d(10, -4,  { color: 'blue', glyph: 'code', label: ['Target Bean'], sub: 'Original Code' }),
        },
        links: {
          cp: h('client', 'proxy', ['client', 'proxy'], { label: 'method call', heads: 'end' }),
          pt: h('proxy', 'target', ['proxy', 'target'], { label: 'super.doWork()', heads: 'end' }),
        },
        flows: [
          { route: ['cp', 'pt'], bounce: false, rate: 1.2 },
        ],
      },
    },
    {
      short: 'Advice Chain',
      chapter: 'technique',
      title: 'Interceptor Chain: Ordered Execution of Around Advices',
      body: [
        'When a proxied method is called, the proxy fetches matching <code>MethodInterceptor</code> objects from the Advisor registry.',
        'They form an execution chain using the Chain of Responsibility pattern: each interceptor calls <code>invocation.proceed()</code> to pass control to the next advice or target.',
      ],
      callout: { kind: 'insight', text: '@Transactional uses TransactionInterceptor to start a DB transaction before proceed() and commit or rollback after return or exception.' },
      metrics: { proxyType: 'Advisor Chain', interceptorChain: 'Security -> Tx -> Logging', weavingTiming: 'Invocation Time', targetState: 'Active Execution' },
      scene: {
        entities: {
          sec:    d(-12, -4, { color: 'rose', glyph: 'lock', label: ['Security'], sub: 'Check Auth' }),
          tx:     d(-2, -4,  { color: 'green', glyph: 'database', label: ['Tx Interceptor'], sub: 'begin / commit' }),
          target: d(10, -4,  { color: 'blue', glyph: 'code', label: ['Target Method'], sub: 'Business Logic' }),
        },
        links: {
          st: h('sec', 'tx', ['sec', 'tx'], { label: 'proceed()', heads: 'end' }),
          tt: h('tx', 'target', ['tx', 'target'], { label: 'proceed()', heads: 'end' }),
        },
        flows: [
          { route: ['st', 'tt'], bounce: false, rate: 1.4 },
        ],
      },
    },
    {
      short: 'Self-Invocation',
      chapter: 'tradeoff',
      title: 'The Self-Invocation Trap: Why this.innerMethod() Bypasses AOP',
      body: [
        'If <code>methodA()</code> calls <code>this.methodB()</code> internally, the call happens on the raw <code>this</code> reference, completely bypassing the outer proxy.',
        'Consequently, annotations like <code>@Transactional</code> or <code>@Async</code> on <code>methodB()</code> will NEVER take effect when invoked from inside the same class.',
      ],
      callout: { kind: 'warn', text: 'To fix self-invocation, either extract the internal method into a separate collaborator bean, or inject the bean into itself via self-injection.' },
      metrics: { proxyType: 'Bypassed Proxy', interceptorChain: '0 Interceptors Fired', weavingTiming: 'Direct JVM Call', targetState: 'Unprotected Method' },
      scene: {
        entities: {
          proxy:  d(-12, -4, { color: 'sand', glyph: 'shield', label: ['Outer Proxy'], sub: 'Ignored' }),
          outer:  d(-2, -4,  { color: 'blue', glyph: 'code', label: ['methodA()'], sub: 'Runs on Target' }),
          inner:  d(10, -4,  { color: 'rose', glyph: 'alertTriangle', label: ['this.methodB()'], sub: 'No Tx Opened!' }),
        },
        links: {
          oi: h('outer', 'inner', ['outer', 'inner'], { label: 'direct this.call()', heads: 'end' }),
        },
        flows: [
          { route: ['oi'], bounce: false, rate: 1.0 },
        ],
      },
    },
  ],
};

export default javaSpringAopLesson;
