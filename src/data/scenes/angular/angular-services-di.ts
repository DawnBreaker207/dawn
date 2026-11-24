// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularServicesDiLesson = {
  id: 'angular-services-di',
  title: 'Services, Hierarchical DI & Functional inject()',
  summary: 'Master Angular’s Dual-Tree Hierarchical Injector (EnvironmentInjector vs NodeInjector), resolution flags (@Self, @SkipSelf, @Optional, @Host), and modern functional inject().',
  minutes: 16,
  level: 'advanced',
  metrics: ['injectorTree', 'scopeLevel', 'lookupStrategy', 'injectionContext'],
  legend: ['di', ['env', 'environment injector'], ['node', 'component node injector']],
  goals: [
    { text: 'The dual injector trees: EnvironmentInjector vs NodeInjector', step: 1 },
    { text: 'providedIn: "root" singleton vs Component-level providers', step: 2 },
    { text: 'Resolution decorators: @Self, @SkipSelf, @Optional, @Host', step: 3 },
    { text: 'Modern functional inject() API and Injection Context rules', step: 4 },
  ],
  steps: [
    {
      short: 'Dual Injector',
      chapter: 'setup',
      title: 'The Dual-Tree Hierarchy: Environment vs Node Injector',
      body: [
        'Angular’s DI is not a single flat map. It consists of two parallel trees:',
        '1. <b>EnvironmentInjector</b>: From Platform $\\rightarrow$ Root $\\rightarrow$ Route Providers (Module / App scope).',
        '2. <b>NodeInjector</b>: Mirrors the Component and Directive DOM view hierarchy.',
        'When a component requests a service, Angular searches the NodeInjector tree upwards to the root, then searches the EnvironmentInjector tree.',
      ],
      callout: {
        kind: 'insight',
        text: 'NodeInjectors allow parent components to provide unique scoped service instances to their children only.',
      },
      metrics: { injectorTree: 'Dual Tree (Active)', scopeLevel: 'Root Singleton', lookupStrategy: 'Bottom-Up Walk', injectionContext: 'Valid' },
      scene: {
        entities: {
          rootEnv: d(-8, -4, { color: 'purple', glyph: 'package', label: ['Root EnvironmentInjector'], sub: 'providedIn: "root"' }),
          parentComp: d(4, -4, { color: 'blue', glyph: 'boxes', label: ['Parent Component'], sub: 'NodeInjector (provides ServiceB)' }),
          childComp: d(4, 4, { color: 'green', glyph: 'terminal', label: ['Child Component'], sub: 'requests ServiceA & ServiceB' }),
          zDi: x({ x0: -10, x1: 10, y0: -7, y1: 7 }, 'DUAL-TREE RESOLUTION HIERARCHY'),
        },
        links: {
          cp: h('childComp', 'parentComp', ['childComp', 'parentComp'], { label: '1. search NodeInjector' }),
          pr: h('parentComp', 'rootEnv', ['parentComp', 'rootEnv'], { label: '2. fallback EnvironmentInjector' }),
        },
        flows: [{ route: ['cp', 'pr'], kind: 'di', rate: 1.4 }],
      },
    },
    {
      short: 'Resolution Flags',
      chapter: 'technique',
      title: 'Resolution Rules: @Self, @SkipSelf, @Optional, @Host',
      body: [
        'You can alter the upward tree search using resolution modifiers:',
        '• <code>@Self()</code>: Look ONLY in this component’s own NodeInjector; throw error if not found.',
        '• <code>@SkipSelf()</code>: Start searching from the PARENT NodeInjector, skipping this component.',
        '• <code>@Host()</code>: Stop searching when reaching the host component boundary.',
        '• <code>@Optional()</code>: Return <code>null</code> instead of throwing NullInjectorError.',
      ],
      callout: {
        kind: 'tip',
        text: 'Combining @SkipSelf() with @Optional() is the standard pattern for preventing circular dependency self-injection.',
      },
      changes: ['+ Controlled dependency lookup boundaries', '+ Graceful fallback with @Optional()'],
      metrics: { injectorTree: 'Controlled Walk', scopeLevel: 'Host Boundary', lookupStrategy: '@SkipSelf()', injectionContext: 'Valid' },
      scene: {
        entities: {
          target: d(0, 0, { s: 5.0, color: 'amber', glyph: 'boxes', label: ['Resolution Boundary'], sub: '@Self() | @SkipSelf() | @Host() | @Optional()' }),
        },
        links: {},
        flows: [],
      },
    },
    {
      short: 'Functional inject()',
      chapter: 'solution',
      title: 'The Modern functional inject() API',
      body: [
        'Modern Angular replaces bulky constructor parameter injection with functional <code>inject()</code>: <code>private http = inject(HttpClient)</code>.',
        '<code>inject()</code> can be used in property initializers, factory functions, route guards, and functional interceptors — anywhere within an active <b>Injection Context</b>.',
      ],
      callout: {
        kind: 'insight',
        text: 'inject() eliminates super() boilerplate in inherited classes and enables highly composable custom utility functions.',
      },
      changes: ['− Constructor injection boilerplate deleted', '+ Clean property initializers via inject()', '+ Composable functional DI'],
      metrics: { injectorTree: 'Modern Functional', scopeLevel: 'Composable', lookupStrategy: 'inject(Token)', injectionContext: 'Active' },
      scene: {
        entities: {
          service: d(-8, 0, { color: 'purple', glyph: 'package', label: ['AuthService'], sub: 'providedIn: "root"' }),
          comp: d(8, 0, { color: 'green', glyph: 'terminal', label: ['UserProfileComponent'], sub: 'auth = inject(AuthService)' }),
        },
        links: {
          sc: h('service', 'comp', ['service', 'comp'], { label: 'inject(AuthService)' }),
        },
        flows: [{ route: ['sc'], rate: 1.8 }],
      },
    },
  ],
};
