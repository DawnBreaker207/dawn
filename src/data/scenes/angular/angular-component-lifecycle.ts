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

export const angularComponentLifecycleLesson = {
  id: 'angular-component-lifecycle',
  title: 'Component & Directive Lifecycle Pipeline',
  summary: 'Follow the execution order of all 8 Angular lifecycle hooks: constructor, ngOnChanges, ngOnInit, ngAfterContentInit, ngAfterViewInit, down to ngOnDestroy.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['activeHook', 'domReady', 'inputsBound', 'subscriptionsCleaned'],
  legend: ['flow', ['hook', 'lifecycle execution'], ['view', 'view initialization'], ['destroy', 'teardown stream']],
  goals: [
    { text: 'Class construction vs initialization: constructor vs ngOnInit', step: 1 },
    { text: 'Input binding & changes: ngOnChanges and SimpleChanges', step: 2 },
    { text: 'Content projection lifecycle: ngAfterContentInit and ngAfterContentChecked', step: 3 },
    { text: 'View & DOM readiness: ngAfterViewInit and ViewChild resolution', step: 4 },
    { text: 'Template render cycles: ngAfterViewChecked and ExpressionChangedAfterItHasBeenCheckedError', step: 5 },
    { text: 'Teardown & cleanup: ngOnDestroy and DestroyRef takeUntilDestroyed', step: 6 },
  ],
  steps: [
    {
      short: 'Constructor',
      chapter: 'setup',
      title: 'Class Instantiation: constructor() vs ngOnInit()',
      body: [
        '<b>constructor</b>: Called when JavaScript instantiates the class. Only Dependency Injection (DI) should occur here. <b>Inputs (@Input / input()) are NOT available in the constructor!</b>',
        '<b>ngOnInit</b>: Runs once after Angular initializes inputs. This is the official place to execute initial HTTP calls and configure reactive state.',
      ],
      callout: {
        kind: 'tip',
        text: 'Never make HTTP calls or subscribe to observables inside the constructor; keep the constructor lightweight for instant DI resolution.',
      },
      metrics: { activeHook: 'constructor()', domReady: 'No (Virtual)', inputsBound: 'Pending', subscriptionsCleaned: 'N/A' },
      scene: {
        entities: {
          ctorInst: d(-16, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['Constructor'], sub: 'inject deps' }),
          diEngine: d(-4, -6, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['DI Injector'], sub: 'DI singletons' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Constructor vs ngOnInit', [
            `export class ProfileComponent implements OnInit {`,
            `  constructor(private http: HttpClient) {`,
            `    // Inputs are undefined here!`,
            `  }`,
            `  ngOnInit() {`,
            `    // Inputs are bound! Safe to call API:`,
            `    this.loadProfile(this.userId);`,
            `  }`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          cd: h('ctorInst', 'diEngine', ['ctorInst', 'diEngine'], { label: 'inject services' }),
        },
        flows: [{ route: ['cd'], kind: 'hook', rate: 1.5 }],
      },
    },
    {
      short: 'ngOnChanges',
      chapter: 'setup',
      title: 'Input Binding: ngOnChanges & SimpleChanges',
      body: [
        'Whenever an input bound to the component changes by reference identity, Angular fires <code>ngOnChanges(changes: SimpleChanges)</code>.',
        'The <code>SimpleChanges</code> map provides <code>previousValue</code>, <code>currentValue</code>, and <code>isFirstChange()</code> for every mutated input.',
      ],
      callout: {
        kind: 'insight',
        text: 'In modern Angular, Signal inputs (input()) provide fine-grained reactivity, reducing reliance on ngOnChanges.',
      },
      changes: ['+ Input properties bound to component', '+ ngOnChanges fires with SimpleChanges map'],
      metrics: { activeHook: 'ngOnChanges()', domReady: 'No', inputsBound: 'Bound (1st change)', subscriptionsCleaned: 'N/A' },
      scene: {
        entities: {
          ctorInst: d(-16, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['Constructor'], sub: 'inject deps' }),
          diEngine: d(-4, -6, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['DI Injector'], sub: 'DI singletons' }),
          onChanges: d(8, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'terminal', label: ['ngOnChanges'], sub: 'diff map' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'ngOnChanges Execution Dump', [
            `ngOnChanges(changes: SimpleChanges) {`,
            `  if (changes['userId']) {`,
            `    const prev = changes['userId'].previousValue;`,
            `    const curr = changes['userId'].currentValue;`,
            `    const first = changes['userId'].isFirstChange();`,
            `    console.log(\`userId: \${prev} -> \${curr} (first=\${first})\`);`,
            `  }`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          cd: h('ctorInst', 'diEngine', ['ctorInst', 'diEngine'], { label: 'inject services' }),
          do: h('diEngine', 'onChanges', ['diEngine', 'onChanges'], { label: 'bind inputs' }),
        },
        flows: [{ route: ['cd', 'do'], kind: 'hook', rate: 1.5 }],
      },
    },
    {
      short: 'ngOnInit',
      chapter: 'execution',
      title: 'Initialization: ngOnInit Lifecycle Stage',
      body: [
        'Once input values are bound, Angular executes <code>ngOnInit()</code>.',
        'This hook runs exactly once per component instance. Component state, initial data fetching, and signal subscriptions are safely triggered here.',
      ],
      callout: {
        kind: 'tip',
        text: 'ngOnInit is the standard hook to initiate HTTP requests and initialize reactive signals.',
      },
      changes: ['+ ngOnInit invoked once inputs are stable', '+ Component initial state configured'],
      metrics: { activeHook: 'ngOnInit()', domReady: 'Content Pending', inputsBound: 'Bound', subscriptionsCleaned: 'N/A' },
      scene: {
        entities: {
          ctorInst: d(-16, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['Constructor'], sub: 'inject deps' }),
          onChanges: d(8, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'terminal', label: ['ngOnChanges'], sub: 'diff map' }),
          ngInit: d(8, 8, { s: 4.8, h: 52, color: 'green', glyph: 'terminal', label: ['ngOnInit'], sub: 'init state' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'ngOnInit Hook', [
            `ngOnInit() {`,
            `  // All inputs are initialized:`,
            `  this.userService.getUser(this.userId()).subscribe(user => {`,
            `    this.profile.set(user);`,
            `  });`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          co: h('ctorInst', 'onChanges', ['ctorInst', 'onChanges'], { label: 'bind inputs' }),
          oi: h('onChanges', 'ngInit', ['onChanges', 'ngInit'], { label: 'run init logic' }),
        },
        flows: [{ route: ['co', 'oi'], kind: 'hook', rate: 1.5 }],
      },
    },
    {
      short: 'View Ready',
      chapter: 'execution',
      title: 'View & DOM Readiness: ngAfterViewInit',
      body: [
        'After Angular renders the component’s own template and all child components into the real DOM, it fires <code>ngAfterViewInit()</code>.',
        'At this milestone, <code>@ViewChild</code>, <code>@ViewChildren</code>, <code>ElementRef</code>, and canvas contexts are 100% rendered and ready for DOM manipulation.',
      ],
      callout: {
        kind: 'warning',
        text: 'Do NOT mutate component state directly in ngAfterViewInit, or you will trigger ExpressionChangedAfterItHasBeenCheckedError!',
      },
      changes: ['+ Real DOM nodes fully mounted', '+ ViewChild element references resolved'],
      metrics: { activeHook: 'ngAfterViewInit()', domReady: '100% Ready', inputsBound: 'Bound', subscriptionsCleaned: 'N/A' },
      scene: {
        entities: {
          ngInit: d(8, -6, { s: 4.8, h: 52, color: 'green', glyph: 'terminal', label: ['ngOnInit'], sub: 'init state' }),
          viewQuery: d(8, 8, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['ViewChild Query'], sub: 'finds element' }),
          viewHook: b(-4, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['AfterViewInit'], sub: 'DOM ready' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'ViewChild Query Resolution', [
            `@ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;`,
            ``,
            `ngAfterViewInit() {`,
            `  // DOM element is guaranteed to exist:`,
            `  const ctx = this.canvasRef.nativeElement.getContext('2d');`,
            `  this.renderChart(ctx);`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          iv: h('ngInit', 'viewQuery', ['ngInit', 'viewQuery'], { label: 'render template' }),
          vq: h('viewQuery', 'viewHook', ['viewQuery', 'viewHook'], { label: 'attach ElementRef' }),
        },
        flows: [{ route: ['iv', 'vq'], kind: 'view', rate: 1.5 }],
      },
    },
    {
      short: 'Dev Verification',
      chapter: 'technique',
      title: 'DevMode Verification: ExpressionChangedAfterChecked',
      body: [
        'In development mode, Angular runs a <b>second verification pass</b> immediately after rendering to ensure bindings did not mutate.',
        'If a property changed between the render pass and the check pass, Angular throws <code>ExpressionChangedAfterItHasBeenCheckedError</code> to catch unidirectional data flow violations.',
      ],
      callout: {
        kind: 'insight',
        text: 'This error is Angular’s safeguard against infinite render loops and non-deterministic UI updates.',
      },
      changes: ['+ DevMode verification pass audits all template expressions', '+ Guards unidirectional data flow'],
      metrics: { activeHook: 'DevMode Verify', domReady: 'Verified', inputsBound: 'Consistent', subscriptionsCleaned: 'N/A' },
      scene: {
        entities: {
          viewHook: b(-4, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['AfterViewInit'], sub: 'DOM ready' }),
          verifier: d(8, 8, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['Pass 2 Verify'], sub: 'check bindings' }),
          cleanState: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['Stable View'], sub: 'zero drift' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'DevMode Verification Error', [
            `// If you mutate state inside ngAfterViewInit():`,
            `ERROR Error: NG0100: ExpressionChangedAfterItHasBeenCheckedError:`,
            `Expression has changed after it was checked.`,
            `Previous value: 'loading'. Current value: 'ready'.`,
            `Fix: Use queueMicrotask() or Signal computed() instead.`,
          ], { icon: 'terminal' }),
        },
        links: {
          vv: h('viewHook', 'verifier', ['viewHook', 'verifier'], { label: 're-evaluate view' }),
          vc: h('verifier', 'cleanState', ['verifier', 'cleanState'], { label: 'assert equality' }),
        },
        flows: [{ route: ['vv', 'vc'], kind: 'view', rate: 1.5 }],
      },
    },
    {
      short: 'ngOnDestroy',
      chapter: 'scaling',
      title: 'Teardown & Cleanup: ngOnDestroy & DestroyRef',
      body: [
        'When the component is unmounted from the DOM, Angular executes <code>ngOnDestroy()</code>.',
        'Modern Angular also provides <code>DestroyRef</code> and the <code>takeUntilDestroyed()</code> RxJS operator to unsubscribe from observables automatically without writing ngOnDestroy boilerplate.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always clean up intervals, websocket listeners, and unmanaged event listeners to prevent memory leaks.',
      },
      changes: ['+ Subscriptions and event listeners destroyed', '+ Component DOM nodes unlinked and memory freed'],
      metrics: { activeHook: 'ngOnDestroy()', domReady: 'Unmounted', inputsBound: 'Detached', subscriptionsCleaned: '100% Cleared' },
      scene: {
        entities: {
          viewHook: b(-4, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['AfterViewInit'], sub: 'DOM ready' }),
          destroyRef: d(-16, 8, { s: 4.8, h: 52, color: 'rose', glyph: 'terminal', label: ['DestroyRef'], sub: 'unmounting' }),
          freedMemory: d(-16, -6, { s: 4.8, h: 52, color: 'green', glyph: 'package', label: ['Freed Memory'], sub: 'zero leaks' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Modern Teardown with DestroyRef', [
            `export class LiveFeedComponent {`,
            `  private destroyRef = inject(DestroyRef);`,
            `  constructor(api: FeedService) {`,
            `    api.events$.pipe(`,
            `      takeUntilDestroyed() // Auto-unsubscribes on unmount!`,
            `    ).subscribe(data => this.feed.set(data));`,
            `  }`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          vd: h('viewHook', 'destroyRef', ['viewHook', 'destroyRef'], { label: 'unmount view' }),
          df: h('destroyRef', 'freedMemory', ['destroyRef', 'freedMemory'], { label: 'release streams' }),
        },
        flows: [{ route: ['vd', 'df'], kind: 'destroy', rate: 1.6 }],
      },
    },
  ],
};
