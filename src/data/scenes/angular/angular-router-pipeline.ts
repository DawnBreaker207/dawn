// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const angularRouterPipelineLesson = {
  id: 'angular-router-pipeline',
  title: 'Router, Guards & Resolvers',
  summary: 'Follow the 10-phase Angular Router navigation pipeline from URL serialization, Route Matching, canMatch/canActivate guards, Resolvers, to RouterOutlet activation.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['navState', 'activeGuards', 'resolverState', 'outletTarget'],
  legend: ['flow', ['nav', 'navigation pipeline'], ['guard', 'guard security check'], ['resolve', 'data resolver'], ['mount', 'component mount']],
  goals: [
    { text: 'NavigationStart to URL recognition and UrlTree parsing', step: 1 },
    { text: 'Route Matching: matching paths, child routes, and route parameters', step: 2 },
    { text: 'canMatch guard: controlling feature-flagged routes before chunk download', step: 3 },
    { text: 'canActivate & functional guards: route authentication and redirects', step: 4 },
    { text: 'Data Resolvers: pre-fetching route data before component activation', step: 5 },
    { text: 'RouterOutlet activation, NavigationEnd, and scroll restoration', step: 6 },
  ],
  steps: [
    {
      short: 'URL Match',
      chapter: 'setup',
      title: 'NavigationStart & URL Parsing (UrlTree)',
      body: [
        'A navigation begins when a user clicks an <code>[routerLink]</code> or code calls <code>router.navigate([\'/orders\', id])</code>.',
        'The router emits <code>NavigationStart</code> and uses <code>DefaultUrlSerializer</code> to parse the raw URL string into a hierarchical <b>UrlTree</b> of segments, path params, and query parameters.',
      ],
      callout: {
        kind: 'insight',
        text: 'The UrlTree is an immutable data structure representing the entire URL structure, enabling safe manipulation and redirection.',
      },
      metrics: { navState: 'NavigationStart', activeGuards: 'None', resolverState: 'Pending', outletTarget: 'UrlTree Parsed' },
      scene: {
        entities: {
          userClick: y(-16, -6, { label: 'routerLink', tags: [{ text: '/orders/42', tone: 'blue', icon: 'zap' }] }),
          serializer: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['UrlSerializer'], sub: 'parses URL' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'UrlTree Parsing Output', [
            `$ router.navigate(['/orders', 42], { queryParams: { tab: 'items' } })`,
            `UrlTree {`,
            `  root: UrlSegmentGroup {`,
            `    children: { primary: ['orders', '42'] }`,
            `  },`,
            `  queryParams: { tab: 'items' }`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          us: h('userClick', 'serializer', ['userClick', 'serializer'], { label: 'navigate event' }),
        },
        flows: [{ route: ['us'], kind: 'nav', rate: 1.5 }],
      },
    },
    {
      short: 'Route Matching',
      chapter: 'setup',
      title: 'Route Tree Matching & Config Traversal',
      body: [
        'The router traverses the configured <code>Routes</code> array to find matching segment patterns.',
        'It extracts path parameters (<code>:orderId</code>) and matches wildcard routes or lazy-loaded children (<code>loadChildren</code>). If multiple patterns match, the first defined in the route array wins.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always place specific routes before wildcard routes ({ path: \'**\', component: NotFoundComponent }).',
      },
      changes: ['+ Route pattern /orders/:id matched to OrderModule', '+ Path parameter :orderId bound to 42'],
      metrics: { navState: 'RoutesRecognized', activeGuards: 'Pending', resolverState: 'Pending', outletTarget: 'OrderComponent' },
      scene: {
        entities: {
          userClick: y(-16, -6, { label: 'routerLink', tags: [{ text: '/orders/42', tone: 'blue', icon: 'zap' }] }),
          serializer: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['UrlSerializer'], sub: 'parses URL' }),
          routeMatcher: d(8, -6, { s: 4.8, h: 52, color: 'blue', glyph: 'boxes', label: ['RouteMatcher'], sub: 'path matching' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Route Matching Definition', [
            `const routes: Routes = [`,
            `  {`,
            `    path: 'orders/:orderId',`,
            `    loadComponent: () => import('./order.component')`,
            `      .then(m => m.OrderComponent),`,
            `    canMatch: [featureFlagGuard],`,
            `    canActivate: [authGuard]`,
            `  }`,
            `];`,
          ], { icon: 'terminal' }),
        },
        links: {
          us: h('userClick', 'serializer', ['userClick', 'serializer'], { label: 'navigate event' }),
          sr: h('serializer', 'routeMatcher', ['serializer', 'routeMatcher'], { label: 'match segments' }),
        },
        flows: [{ route: ['us', 'sr'], kind: 'nav', rate: 1.5 }],
      },
    },
    {
      short: 'canMatch Guard',
      chapter: 'execution',
      title: 'canMatch: Pre-Download Feature Flag Guards',
      body: [
        'Before modern Angular, <code>canLoad</code> blocked lazy loading, but prevented having two routes with the same path.',
        '<code>canMatch</code> solves this: if <code>canMatch</code> returns <code>false</code>, the router <b>skips this route and tries the next matching route in the array</b> without downloading the JavaScript chunk! Perfect for A/B testing and feature flags.',
      ],
      callout: {
        kind: 'insight',
        text: 'canMatch avoids downloading MBs of JavaScript for features the user has no permission to access.',
      },
      changes: ['+ canMatch evaluates feature flag', '+ JavaScript chunk download authorized'],
      metrics: { navState: 'GuardsCheckStart', activeGuards: 'canMatch (Pass)', resolverState: 'Pending', outletTarget: 'OrderComponent' },
      scene: {
        entities: {
          serializer: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['UrlSerializer'], sub: 'parses URL' }),
          routeMatcher: d(8, -6, { s: 4.8, h: 52, color: 'blue', glyph: 'boxes', label: ['RouteMatcher'], sub: 'path matching' }),
          guardEvaluator: d(8, 8, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['canMatch'], sub: 'feature flag' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Functional canMatch Guard', [
            `export const v2OrdersGuard: CanMatchFn = (route, segments) => {`,
            `  const flags = inject(FeatureFlagService);`,
            `  // If disabled, router skips to legacy v1 orders route!`,
            `  return flags.isEnabled('orders-v2');`,
            `};`,
          ], { icon: 'terminal' }),
        },
        links: {
          sr: h('serializer', 'routeMatcher', ['serializer', 'routeMatcher'], { label: 'match segments' }),
          rg: h('routeMatcher', 'guardEvaluator', ['routeMatcher', 'guardEvaluator'], { label: 'evaluate flag' }),
        },
        flows: [{ route: ['sr', 'rg'], kind: 'guard', rate: 1.5 }],
      },
    },
    {
      short: 'canActivate Guard',
      chapter: 'execution',
      title: 'canActivate: Authentication & UrlTree Redirects',
      body: [
        'Next, <code>canActivate</code> and <code>canActivateChild</code> guards execute.',
        'Functional guards can return <code>boolean</code>, <code>Promise&lt;boolean&gt;</code>, <code>Observable&lt;boolean&gt;</code>, or directly return a <code>UrlTree</code> redirect: <code>inject(Router).createUrlTree([\'/login\'])</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Returning a UrlTree instead of false cancels the current navigation and immediately navigates to the redirect target in one atomic step.',
      },
      changes: ['+ canActivate verifies user authentication', '+ Emits true or redirects to login'],
      metrics: { navState: 'GuardsChecked', activeGuards: 'canActivate (Pass)', resolverState: 'Pending', outletTarget: 'OrderComponent' },
      scene: {
        entities: {
          routeMatcher: d(8, -6, { s: 4.8, h: 52, color: 'blue', glyph: 'boxes', label: ['RouteMatcher'], sub: 'path matching' }),
          guardEvaluator: d(8, 8, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['canActivate'], sub: 'auth session' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Functional canActivate with Redirect', [
            `export const authGuard: CanActivateFn = (route, state) => {`,
            `  const auth = inject(AuthService);`,
            `  const router = inject(Router);`,
            `  if (!auth.isLoggedIn()) {`,
            `    return router.createUrlTree(['/login'], {`,
            `      queryParams: { returnUrl: state.url }`,
            `    });`,
            `  }`,
            `  return true;`,
            `};`,
          ], { icon: 'terminal' }),
        },
        links: {
          rg: h('routeMatcher', 'guardEvaluator', ['routeMatcher', 'guardEvaluator'], { label: 'check auth' }),
        },
        flows: [{ route: ['rg'], kind: 'guard', rate: 1.5 }],
      },
    },
    {
      short: 'Data Resolvers',
      chapter: 'execution',
      title: 'Data Resolvers: Pre-Fetching Before Component Render',
      body: [
        'Before the component template is mounted, configured <b>Resolvers</b> fetch critical data.',
        'The router suspends navigation until all resolvers emit. This prevents flashes of empty content and ensures required data is immediately available upon component initialization.',
      ],
      callout: {
        kind: 'insight',
        text: 'With withComponentInputBinding(), resolved data can be injected directly as component @Input() / input() properties!',
      },
      changes: ['+ orderResolver executes order API fetch', '+ Order data injected into ActivatedRoute.data'],
      metrics: { navState: 'ResolveEnd', activeGuards: 'All Passed', resolverState: 'Resolved (200 OK)', outletTarget: 'Ready to Mount' },
      scene: {
        entities: {
          guardEvaluator: d(8, 8, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['canActivate'], sub: 'auth session' }),
          resolver: b(-4, 8, { s: 4.6, h: 48, color: 'cyan', glyph: 'server', label: ['orderResolver'], sub: 'pre-fetch API' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Functional Resolver Pattern', [
            `export const orderResolver: ResolveFn<Order> = (route) => {`,
            `  const api = inject(OrderService);`,
            `  const orderId = route.paramMap.get('orderId')!;`,
            `  return api.fetchOrder(orderId);`,
            `};`,
            `// Component accesses via input:`,
            `export class OrderComponent {`,
            `  order = input.required<Order>(); // auto-bound from resolver!`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          gr: h('guardEvaluator', 'resolver', ['guardEvaluator', 'resolver'], { label: 'trigger resolve' }),
        },
        flows: [{ route: ['gr'], kind: 'resolve', rate: 1.5 }],
      },
    },
    {
      short: 'Outlet Activation',
      chapter: 'scaling',
      title: 'RouterOutlet Activation & NavigationEnd',
      body: [
        'The router activates <code>&lt;router-outlet&gt;</code>, instantiates <code>OrderComponent</code>, injects the resolved data, and updates the browser URL and history stack.',
        'It emits <code>NavigationEnd</code>, triggers scroll restoration (scroll to top or restore saved scroll position), and updates document title.',
      ],
      callout: {
        kind: 'tip',
        text: 'Configure withInMemoryScrolling({ scrollPositionRestoration: \'enabled\' }) in provideRouter to automatically restore scroll on back button clicks.',
      },
      changes: ['+ RouterOutlet activates OrderComponent', '+ NavigationEnd emitted, scroll restored'],
      metrics: { navState: 'NavigationEnd', activeGuards: 'Done', resolverState: 'Consumed', outletTarget: 'Active in DOM' },
      scene: {
        entities: {
          resolver: b(-4, 8, { s: 4.6, h: 48, color: 'cyan', glyph: 'server', label: ['orderResolver'], sub: 'pre-fetch API' }),
          outletHost: d(-16, 8, { s: 4.8, h: 52, color: 'green', glyph: 'terminal', label: ['<router-outlet>'], sub: 'mount view' }),
          orderView: d(-16, -6, { s: 4.8, h: 52, color: 'green', glyph: 'boxes', label: ['OrderComponent'], sub: 'DOM active' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Navigation Complete', [
            `Router Events Sequence:`,
            `  1. NavigationStart (/orders/42)`,
            `  2. RoutesRecognized`,
            `  3. GuardsCheckEnd (Pass)`,
            `  4. ResolveEnd (Data ready)`,
            `  5. ActivationEnd (<router-outlet> mounted)`,
            `  6. NavigationEnd (Scroll restored to top)`,
          ], { icon: 'terminal' }),
        },
        links: {
          ro: h('resolver', 'outletHost', ['resolver', 'outletHost'], { label: 'hydrate outlet' }),
          ov: h('outletHost', 'orderView', ['outletHost', 'orderView'], { label: 'render component' }),
        },
        flows: [{ route: ['ro', 'ov'], kind: 'mount', rate: 1.6 }],
      },
    },
  ],
};
