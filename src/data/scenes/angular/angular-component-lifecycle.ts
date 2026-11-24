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
  legend: ['hook', ['content', 'content projection'], ['view', 'template view init'], ['destroy', 'teardown']],
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
          diEngine: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['DI Injector'], sub: 'resolves dependencies' }),
          ctorInst: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Constructor', 'Instance'], sub: 'constructor() executes' }),
          ngInit: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['ngOnInit()'], sub: 'inputs ready for state init' }),
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
          zLife: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'COMPONENT INSTANTIATION PHASE'),
        },
        links: {
          dc: h('diEngine', 'ctorInst', ['diEngine', 'ctorInst'], { label: 'inject services' }),
          cn: h('ctorInst', 'ngInit', ['ctorInst', 'ngInit'], { label: 'bind inputs & run init' }),
        },
        flows: [{ route: ['dc', 'cn'], kind: 'hook', rate: 1.5 }],
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
          parentView: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'boxes', label: ['Parent View'], sub: '[userId]="currentId"' }),
          changeEngine: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['SimpleChanges'], sub: 'calculates diff' }),
          onChangesHook: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['ngOnChanges()'], sub: 'receives diff map' }),
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
          zLife: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'INPUT PROPERTY BINDING & DIFFING'),
        },
        links: {
          pc: h('parentView', 'changeEngine', ['parentView', 'changeEngine'], { label: 'binds [input]' }),
          co: h('changeEngine', 'onChangesHook', ['changeEngine', 'onChangesHook'], { label: 'dispatch SimpleChanges' }),
        },
        flows: [{ route: ['pc', 'co'], kind: 'hook', rate: 1.5 }],
      },
    },
    {
      short: 'Content Projection',
      chapter: 'execution',
      title: 'Content Projection: ngAfterContentInit',
      body: [
        'When a component projects external markup via <code>&lt;ng-content&gt;</code>, child content is initialized and projected.',
        'Angular triggers <code>ngAfterContentInit()</code>. At this moment, <code>@ContentChild</code> and <code>@ContentChildren</code> queries are fully resolved and accessible.',
      ],
      callout: {
        kind: 'tip',
        text: 'ngAfterContentInit fires only once per component lifecycle. Any subsequent checks trigger ngAfterContentChecked.',
      },
      changes: ['+ Projected <ng-content> elements parsed and bound', '+ @ContentChild queries successfully resolved'],
      metrics: { activeHook: 'ngAfterContentInit()', domReady: 'Content Ready', inputsBound: 'Bound', subscriptionsCleaned: 'N/A' },
      scene: {
        entities: {
          projectedDom: d(-10, -18, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['<ng-content>'], sub: 'projected child markup' }),
          contentQuery: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['ContentChild Query'], sub: 'resolves projected references' }),
          contentHook: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'terminal', label: ['AfterContentInit'], sub: 'content initialized' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Content Projection Query', [
            `@Component({`,
            `  selector: 'app-card',`,
            `  template: \`<div class="card"><ng-content></ng-content></div>\``,
            `})`,
            `export class CardComponent implements AfterContentInit {`,
            `  @ContentChild(HeaderComponent) header!: HeaderComponent;`,
            `  ngAfterContentInit() {`,
            `    console.log('Projected header is ready:', this.header);`,
            `  }`,
            `}`,
          ], { icon: 'terminal' }),
          zLife: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'CONTENT PROJECTION LIFECYCLE'),
        },
        links: {
          pc: h('projectedDom', 'contentQuery', ['projectedDom', 'contentQuery'], { label: 'inject projected AST' }),
          ch: h('contentQuery', 'contentHook', ['contentQuery', 'contentHook'], { label: 'resolve references' }),
        },
        flows: [{ route: ['pc', 'ch'], kind: 'content', rate: 1.5 }],
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
          realDom: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['Real DOM Tree'], sub: 'HTML rendered in browser' }),
          viewQuery: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['ViewChild Query'], sub: 'resolves ElementRef' }),
          viewHook: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['AfterViewInit'], sub: 'DOM ready for chart/canvas' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'ViewChild Query Resolution', [
            `@ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;`,
            ``,
            `ngAfterViewInit() {`,
            `  // DOM element is guaranteed to exist:`,
            `  const ctx = this.canvasRef.nativeElement.getContext('2d');`,
            `  this.renderChart(ctx);`,
            `}`,
          ], { icon: 'terminal' }),
          zLife: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'VIEW INITIALIZATION & DOM ATTACHMENT'),
        },
        links: {
          rv: h('realDom', 'viewQuery', ['realDom', 'viewQuery'], { label: 'attach elements' }),
          vv: h('viewQuery', 'viewHook', ['viewQuery', 'viewHook'], { label: 'resolve canvas ref' }),
        },
        flows: [{ route: ['rv', 'vv'], kind: 'view', rate: 1.5 }],
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
          renderPass: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'boxes', label: ['Pass 1: Render'], sub: 'template rendered' }),
          verifier: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'cpu', label: ['Pass 2: Verify'], sub: 'asserts expr1 === expr2' }),
          stabilityOk: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Stable Render'], sub: 'zero drift detected' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'DevMode Verification Error', [
            `// If you mutate state inside ngAfterViewInit():`,
            `ERROR Error: NG0100: ExpressionChangedAfterItHasBeenCheckedError:`,
            `Expression has changed after it was checked.`,
            `Previous value: 'loading'. Current value: 'ready'.`,
            `Fix: Use queueMicrotask() or Signal computed() instead.`,
          ], { icon: 'terminal' }),
          zLife: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'UNIDIRECTIONAL DATA FLOW AUDIT'),
        },
        links: {
          rv: h('renderPass', 'verifier', ['renderPass', 'verifier'], { label: 're-evaluate expressions' }),
          vs: h('verifier', 'stabilityOk', ['verifier', 'stabilityOk'], { label: 'assert equality' }),
        },
        flows: [{ route: ['rv', 'vs'], kind: 'view', rate: 1.5 }],
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
          destroyRef: d(-10, -18, { s: 4.8, h: 50, color: 'rose', glyph: 'terminal', label: ['DestroyRef'], sub: 'component unmounting' }),
          cleanerPipe: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['takeUntilDestroy'], sub: 'unsubscribes streams' }),
          freedMemory: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Freed Memory'], sub: 'zero leaks left' }),
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
          zLife: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'TEARDOWN & MEMORY CLEANUP PIPELINE'),
        },
        links: {
          dc: h('destroyRef', 'cleanerPipe', ['destroyRef', 'cleanerPipe'], { label: 'trigger destroy' }),
          cf: h('cleanerPipe', 'freedMemory', ['cleanerPipe', 'freedMemory'], { label: 'release listeners' }),
        },
        flows: [{ route: ['dc', 'cf'], kind: 'destroy', rate: 1.6 }],
      },
    },
  ],
};
