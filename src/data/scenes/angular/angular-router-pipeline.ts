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
  title: 'Router Navigation Lifecycle & Guard Pipeline',
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
          userClick: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['[routerLink]'], sub: 'href="/orders/42?tab=items"' }),
          serializer: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['UrlSerializer'], sub: 'parses /orders/42' }),
          urlTree: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['UrlTree AST'], sub: 'segments: [orders, 42]' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'UrlTree Parsing Output', [
            `$ router.navigate(['/orders', 42], { queryParams: { tab: 'items' } })`,
            `UrlTree {`,
            `  root: UrlSegmentGroup {`,
            `    children: { primary: ['orders', '42'] }`,
            `  },`,
            `  queryParams: { tab: 'items' }`,
            `}`,
          ], { icon: 'terminal' }),
          zRoute: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'URL PARSING & SERIALIZATION'),
        },
        links: {
          us: h('userClick', 'serializer', ['userClick', 'serializer'], { label: 'navigate event' }),
          su: h('serializer', 'urlTree', ['serializer', 'urlTree'], { label: 'emit UrlTree' }),
        },
        flows: [{ route: ['us', 'su'], kind: 'nav', rate: 1.5 }],
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
          urlSegments: d(-10, -18, { s: 4.8, h: 50, color: 'cyan', glyph: 'boxes', label: ['UrlSegments'], sub: 'primary: orders/42' }),
          routeMatcher: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['Route Matcher'], sub: 'path: orders/:orderId' }),
          matchedSnapshot: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['RouteSnapshot'], sub: 'params: { orderId: 42 }' }),
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
          zRoute: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ROUTE TREE MATCHING PIPELINE'),
        },
        links: {
          ur: h('urlSegments', 'routeMatcher', ['urlSegments', 'routeMatcher'], { label: 'match segments' }),
          rm: h('routeMatcher', 'matchedSnapshot', ['routeMatcher', 'matchedSnapshot'], { label: 'create snapshot' }),
        },
        flows: [{ route: ['ur', 'rm'], kind: 'nav', rate: 1.5 }],
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
          flagCheck: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['canMatch Fn'], sub: 'featureFlagGuard' }),
          guardEvaluator: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['Flag Service'], sub: 'flags.isEnabled("orders-v2")' }),
          chunkLoader: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Load JS Chunk'], sub: 'order.component.js' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Functional canMatch Guard', [
            `export const v2OrdersGuard: CanMatchFn = (route, segments) => {`,
            `  const flags = inject(FeatureFlagService);`,
            `  // If disabled, router skips to legacy v1 orders route!`,
            `  return flags.isEnabled('orders-v2');`,
            `};`,
          ], { icon: 'terminal' }),
          zRoute: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'CANMATCH CONDITIONAL ROUTE SELECTION'),
        },
        links: {
          fg: h('flagCheck', 'guardEvaluator', ['flagCheck', 'guardEvaluator'], { label: 'check flag' }),
          gc: h('guardEvaluator', 'chunkLoader', ['guardEvaluator', 'chunkLoader'], { label: 'allow chunk download' }),
        },
        flows: [{ route: ['fg', 'gc'], kind: 'guard', rate: 1.5 }],
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
          authCheck: d(-10, -18, { s: 4.8, h: 50, color: 'purple', glyph: 'terminal', label: ['canActivate Guard'], sub: 'authGuard' }),
          authSvc: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['AuthService'], sub: 'auth.isLoggedIn()' }),
          authPassed: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Approved Route'], sub: 'access granted' }),
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
          zRoute: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'AUTHENTICATION & AUTHORIZATION GUARDS'),
        },
        links: {
          aa: h('authCheck', 'authSvc', ['authCheck', 'authSvc'], { label: 'verify session' }),
          ap: h('authSvc', 'authPassed', ['authSvc', 'authPassed'], { label: 'return true' }),
        },
        flows: [{ route: ['aa', 'ap'], kind: 'guard', rate: 1.5 }],
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
          resolverFn: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['orderResolver'], sub: 'ResolveFn<Order>' }),
          apiQuery: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Order API'], sub: 'GET /api/orders/42' }),
          resolvedData: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Resolved Order'], sub: '{ id: 42, total: $120 }' }),
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
          zRoute: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'DATA RESOLVER PRE-FETCHING PIPELINE'),
        },
        links: {
          ra: h('resolverFn', 'apiQuery', ['resolverFn', 'apiQuery'], { label: 'fetch data' }),
          ar: h('apiQuery', 'resolvedData', ['apiQuery', 'resolvedData'], { label: 'payload ready' }),
        },
        flows: [{ route: ['ra', 'ar'], kind: 'resolve', rate: 1.5 }],
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
          outletHost: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['<router-outlet>'], sub: 'activates view' }),
          orderView: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'boxes', label: ['OrderComponent'], sub: 'mounted with data' }),
          browserHistory: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'package', label: ['Browser History'], sub: 'pushState /orders/42' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Navigation Complete', [
            `Router Events Sequence:`,
            `  1. NavigationStart (/orders/42)`,
            `  2. RoutesRecognized`,
            `  3. GuardsCheckEnd (Pass)`,
            `  4. ResolveEnd (Data ready)`,
            `  5. ActivationEnd (<router-outlet> mounted)`,
            `  6. NavigationEnd (Scroll restored to top)`,
          ], { icon: 'terminal' }),
          zRoute: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ROUTER OUTLET ACTIVATION COMPLETE'),
        },
        links: {
          oo: h('outletHost', 'orderView', ['outletHost', 'orderView'], { label: 'mount component' }),
          ob: h('orderView', 'browserHistory', ['orderView', 'browserHistory'], { label: 'update history' }),
        },
        flows: [{ route: ['oo', 'ob'], kind: 'mount', rate: 1.6 }],
      },
    },
  ],
};
