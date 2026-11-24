// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularRouterPipelineLesson = {
  id: 'angular-router-pipeline',
  title: 'Router Navigation Lifecycle & Guard Pipeline',
  summary: 'Follow the 10-phase Angular Router navigation pipeline from URL serialization, Route Matching, canMatch/canActivate guards, Resolvers, to RouterOutlet activation.',
  minutes: 20,
  level: 'intermediate',
  metrics: ['navState', 'activeGuards', 'resolverState', 'outletTarget'],
  legend: ['flow', ['nav', 'navigation pipeline'], ['guard', 'security guard check']],
  goals: [
    { text: 'URL recognition & Route Tree matching', step: 1 },
    { text: 'canMatch, canActivateChild & Functional Guards', step: 2 },
    { text: 'Data Resolvers & RouterOutlet Component Activation', step: 3 },
  ],
  steps: [
    {
      short: 'URL Match',
      chapter: 'setup',
      title: 'NavigationStart to Route Matching',
      body: [
        'A navigation begins with <code>router.navigate()</code> or an <code>[routerLink]</code> click.',
        'The router parses the raw URL string into an <b>UrlTree</b>, then walks the configured Route Tree to find matching segments and extract path params (<code>:id</code>) and query params.',
      ],
      callout: {
        kind: 'insight',
        text: 'Angular UrlTree is an immutable data structure representing the full hierarchical URL including named auxiliary outlets.',
      },
      metrics: { navState: 'RoutesRecognized', activeGuards: 'Pending', resolverState: 'Idle', outletTarget: 'primary' },
      scene: {
        entities: {
          navSource: d(-10, 0, { color: 'amber', glyph: 'terminal', label: ['router.navigate()'], sub: '/orders/:id/detail' }),
          urlParser: d(0, 0, { color: 'blue', glyph: 'boxes', label: ['DefaultUrlSerializer'], sub: 'Parses to UrlTree' }),
          routeMatcher: d(10, 0, { color: 'purple', glyph: 'package', label: ['RouteConfigMatcher'], sub: 'Matches Route { path }' }),
          zRoute: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'ROUTE RECOGNITION PHASE'),
        },
        links: {
          np: h('navSource', 'urlParser', ['navSource', 'urlParser'], { label: 'NavigationStart' }),
          pm: h('urlParser', 'routeMatcher', ['urlParser', 'routeMatcher'], { label: 'UrlTree' }),
        },
        flows: [{ route: ['np', 'pm'], kind: 'nav', rate: 1.5 }],
      },
    },
    {
      short: 'Guards & Resolvers',
      chapter: 'verification',
      title: 'Guards Execution Pipeline: canMatch to canActivate',
      body: [
        'Before instantiating any components, the router runs guard chains in order: <code>canMatch</code> (can the route configuration be considered?), followed by <code>canActivateChild</code> and <code>canActivate</code>.',
        'Modern Angular uses <b>Functional Guards</b> (e.g. <code>inject(AuthService).isAuthenticated()</code>), avoiding boilerplate class definitions.',
        'If all guards return <code>true</code> or a valid <code>UrlTree</code> redirect, <b>Resolvers</b> fetch critical data before component view creation.',
      ],
      callout: {
        kind: 'tip',
        text: 'canMatch allows having two identical paths handled by different routes (e.g. AdminDashboard vs UserDashboard based on user role).',
      },
      changes: ['+ Evaluated canMatch guard', '+ Executed authGuard(canActivate)', '+ Pre-fetched orderResolver data'],
      metrics: { navState: 'GuardsCheckPassed', activeGuards: 'authGuard: OK', resolverState: 'orderResolver: OK', outletTarget: 'primary' },
      scene: {
        entities: {
          matcher: d(-10, 0, { color: 'purple', glyph: 'package', label: ['Matched Route'], sub: 'path: orders/:id' }),
          canMatch: d(-3, -4, { color: 'red', glyph: 'lock', label: ['canMatch Guard'], sub: 'FeatureFlag / Role' }),
          canActivate: d(4, -4, { color: 'red', glyph: 'shield', label: ['canActivate Guard'], sub: 'Auth & Permissions' }),
          resolver: d(10, 0, { color: 'cyan', glyph: 'database', label: ['Data Resolver'], sub: 'orderResolver(id)' }),
          zGuards: x({ x0: -12, x1: 12, y0: -7, y1: 5 }, 'PIPELINE SECURITY & RESOLUTION GATE'),
        },
        links: {
          mc: h('matcher', 'canMatch', ['matcher', 'canMatch'], { label: 'check match' }),
          ca: h('canMatch', 'canActivate', ['canMatch', 'canActivate'], { label: 'verified' }),
          ar: h('canActivate', 'resolver', ['canActivate', 'resolver'], { label: 'authenticated' }),
        },
        flows: [{ route: ['mc', 'ca', 'ar'], kind: 'guard', rate: 1.2 }],
      },
    },
    {
      short: 'Outlet Activation',
      chapter: 'solution',
      title: 'Activation & NavigationEnd',
      body: [
        'The router instantiates the target component (e.g. <code>OrderDetailComponent</code>) and injects it into the designated <code><router-outlet></code>.',
        'Resolved data is bound to inputs (with <code>withComponentInputBinding()</code>), the browser URL history updates, and <code>NavigationEnd</code> fires.',
      ],
      callout: {
        kind: 'tip',
        text: 'withComponentInputBinding() maps router params, queryParams, and resolved data directly to component input() signals.',
      },
      changes: ['+ Component instantiated via ViewContainerRef', '+ Data bound via input signals', '+ NavigationEnd emitted; Scroll position restored'],
      metrics: { navState: 'NavigationEnd', activeGuards: 'Passed', resolverState: 'Hydrated', outletTarget: '<router-outlet> Active' },
      scene: {
        entities: {
          router: d(-10, 0, { color: 'blue', glyph: 'boxes', label: ['Router Engine'], sub: 'ActivatedRoute' }),
          outlet: d(0, 0, { color: 'green', glyph: 'terminal', label: ['<router-outlet>'], sub: 'ViewContainerRef' }),
          comp: d(10, 0, { color: 'amber', glyph: 'package', label: ['OrderDetailComponent'], sub: 'input(id), input(order)' }),
          zView: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'VIEW RENDER & ACTIVATION'),
        },
        links: {
          ro: h('router', 'outlet', ['router', 'outlet'], { label: 'attach view' }),
          oc: h('outlet', 'comp', ['outlet', 'comp'], { label: 'render child' }),
        },
        flows: [{ route: ['ro', 'oc'], kind: 'nav', rate: 1.6 }],
      },
    },
  ],
};
