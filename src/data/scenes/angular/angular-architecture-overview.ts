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

export const angularArchitectureOverviewLesson = {
  id: 'angular-architecture-overview',
  title: 'Architecture Overview: Bootstrap to Component Tree',
  summary: 'Trace an Angular application lifecycle from main.ts bootstrapApplication, Platform Injector, ApplicationRef, to the Hierarchical Component & View Tree.',
  minutes: 25,
  level: 'beginner',
  metrics: ['bootstrapPhase', 'platformInjector', 'applicationRef', 'componentTreeDepth'],
  legend: ['flow', ['boot', 'bootstrap sequence'], ['view', 'component tree'], ['render', 'DOM rendering']],
  goals: [
    { text: 'main.ts bootstrap: platformBrowser vs bootstrapApplication', step: 1 },
    { text: 'The Platform Injector vs Environment Injector hierarchy', step: 2 },
    { text: 'ApplicationRef and the Root Component instantiation', step: 3 },
    { text: 'View hierarchy construction: components, embedded views, and templates', step: 4 },
    { text: 'Change detection registration: linking views to the CD scheduler', step: 5 },
    { text: 'Final DOM attachment and lifecycle stability', step: 6 },
  ],
  steps: [
    {
      short: 'Bootstrap',
      chapter: 'setup',
      title: 'Bootstrap Sequence: main.ts to Platform',
      body: [
        'Modern Angular bootstraps via <code>bootstrapApplication(AppComponent, appConfig)</code>.',
        'Before rendering any HTML, Angular creates the <b>Platform Injector</b> (singleton across applications on the page, handling DOM sanitation), then creates the <b>Environment Injector</b> containing global providers.',
      ],
      callout: {
        kind: 'insight',
        text: 'Angular separates the platform (browser vs server vs worker) from the application environment.',
      },
      metrics: { bootstrapPhase: 'Platform Init', platformInjector: 'Active', applicationRef: 'Pending', componentTreeDepth: '0' },
      scene: {
        entities: {
          mainTs: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['src/main.ts'], sub: 'bootstrapApplication' }),
          platInj: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Platform', 'Injector'], sub: 'browser platform singleton' }),
          envInj: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['Environment', 'Injector'], sub: 'appConfig providers' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Bootstrap Entrypoint Code', [
            `// src/main.ts`,
            `import { bootstrapApplication } from '@angular/platform-browser';`,
            `import { AppComponent } from './app/app.component';`,
            `import { appConfig } from './app/app.config';`,
            ``,
            `bootstrapApplication(AppComponent, appConfig)`,
            `  .catch((err) => console.error(err));`,
          ], { icon: 'terminal' }),
          zArch: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ANGULAR APPLICATION BOOTSTRAP RUNTIME'),
        },
        links: {
          mp: h('mainTs', 'platInj', ['mainTs', 'platInj'], { label: 'init platform' }),
          pe: h('platInj', 'envInj', ['platInj', 'envInj'], { label: 'create env scope' }),
        },
        flows: [{ route: ['mp', 'pe'], kind: 'boot', rate: 1.5 }],
      },
    },
    {
      short: 'Environment DI',
      chapter: 'setup',
      title: 'Configuring the Environment Injector (appConfig)',
      body: [
        '<code>appConfig</code> supplies essential application services: routing (<code>provideRouter</code>), HTTP client (<code>provideHttpClient</code>), and animations.',
        'These providers live inside the <b>Environment Injector</b> and are accessible to any component, directive, or pipe throughout the application lifecycle.',
      ],
      callout: {
        kind: 'tip',
        text: 'Functional providers replace legacy NgModule imports, drastically improving dead-code elimination during production builds.',
      },
      changes: ['+ Global router and HTTP client providers registered', '+ Environment injector sealed for root component'],
      metrics: { bootstrapPhase: 'Providers Loaded', platformInjector: 'Active', applicationRef: 'Pending', componentTreeDepth: '0' },
      scene: {
        entities: {
          appCfg: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['app.config.ts'], sub: 'provideRouter, provideHttp' }),
          envTree: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'boxes', label: ['Root Env', 'Injector'], sub: 'immutable provider map' }),
          routerSvc: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Router / HTTP', 'Singletons'], sub: 'ready for injection' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Application Config Definition', [
            `// src/app/app.config.ts`,
            `export const appConfig: ApplicationConfig = {`,
            `  providers: [`,
            `    provideRouter(routes, withComponentInputBinding()),`,
            `    provideHttpClient(withFetch(), withInterceptors([])),`,
            `    provideClientHydration()`,
            `  ]`,
            `};`,
          ], { icon: 'terminal' }),
          zArch: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ENVIRONMENT INJECTOR INITIALIZATION'),
        },
        links: {
          ae: h('appCfg', 'envTree', ['appCfg', 'envTree'], { label: 'bind providers' }),
          er: h('envTree', 'routerSvc', ['envTree', 'routerSvc'], { label: 'instantiate singletons' }),
        },
        flows: [{ route: ['ae', 'er'], kind: 'boot', rate: 1.5 }],
      },
    },
    {
      short: 'ApplicationRef',
      chapter: 'execution',
      title: 'ApplicationRef & Root Component Instantiation',
      body: [
        'The bootstrap engine creates <b>ApplicationRef</b>, the central orchestrator that monitors application stability and manages the view tree.',
        'Angular locates <code>&lt;app-root&gt;</code> in <code>index.html</code>, instantiates <code>AppComponent</code> via its <code>ComponentFactory</code>, and injects root dependencies.',
      ],
      callout: {
        kind: 'insight',
        text: 'ApplicationRef connects the component to Angular’s change detection loop and provides the tick() method.',
      },
      changes: ['+ ApplicationRef initialized', '+ Root AppComponent instantiated and attached to <app-root>'],
      metrics: { bootstrapPhase: 'Root Mounted', platformInjector: 'Active', applicationRef: 'Instantiated', componentTreeDepth: '1' },
      scene: {
        entities: {
          appRef: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['ApplicationRef'], sub: 'orchestrates render & CD' }),
          factory: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Component', 'Factory'], sub: 'instantiates AppComponent' }),
          appRoot: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['AppComponent', 'Instance'], sub: '<app-root> attached' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Root Component Declaration', [
            `@Component({`,
            `  selector: 'app-root',`,
            `  standalone: true,`,
            `  imports: [RouterOutlet, NavComponent],`,
            `  template: \`<app-nav /><router-outlet />\``,
            `})`,
            `export class AppComponent {}`,
          ], { icon: 'terminal' }),
          zArch: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'APPLICATIONREF INSTANTIATION PIPELINE'),
        },
        links: {
          af: h('appRef', 'factory', ['appRef', 'factory'], { label: 'create factory' }),
          fa: h('factory', 'appRoot', ['factory', 'appRoot'], { label: 'mount to DOM' }),
        },
        flows: [{ route: ['af', 'fa'], kind: 'view', rate: 1.5 }],
      },
    },
    {
      short: 'Component Tree',
      chapter: 'execution',
      title: 'Constructing the Hierarchical Component & View Tree',
      body: [
        'As <code>AppComponent</code> executes its template, it parses child tags (<code>&lt;app-nav&gt;</code>, <code>&lt;router-outlet&gt;</code>), creating a tree of <b>LView</b> (Logical View) and <b>TView</b> (Template View) data structures.',
        'Each component receives its own <b>NodeInjector</b>, inheriting services from parent components up to the root.',
      ],
      callout: {
        kind: 'tip',
        text: 'The view tree is a directed graph where data flows down via @Input / signals, and events bubble up via @Output / callbacks.',
      },
      changes: ['+ NavComponent and PageComponent mounted as children', '+ Hierarchical NodeInjector tree established'],
      metrics: { bootstrapPhase: 'Tree Assembled', platformInjector: 'Active', applicationRef: 'Tracking 3 views', componentTreeDepth: '3' },
      scene: {
        entities: {
          rootComp: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'boxes', label: ['AppComponent', '(Root)'], sub: 'depth 0' }),
          navComp: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'boxes', label: ['NavComponent', '(Child)'], sub: 'depth 1' }),
          contentComp: d(10, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'boxes', label: ['FeedComponent', '(Grandchild)'], sub: 'depth 2' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Hierarchical View Tree', [
            `AppComponent (Root View)`,
            `  ├── NavComponent (Header / Logo)`,
            `  └── RouterOutlet (Viewport)`,
            `        └── FeedComponent (Posts list)`,
            `              ├── PostCardComponent`,
            `              └── CommentListComponent`,
            `= Complete UI rendered as hierarchical views`,
          ], { icon: 'terminal' }),
          zArch: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'HIERARCHICAL COMPONENT TREE HIERARCHY'),
        },
        links: {
          rn: h('rootComp', 'navComp', ['rootComp', 'navComp'], { label: 'renders header' }),
          nc: h('navComp', 'contentComp', ['navComp', 'contentComp'], { label: 'renders feed' }),
        },
        flows: [{ route: ['rn', 'nc'], kind: 'view', rate: 1.5 }],
      },
    },
    {
      short: 'Change Detection',
      chapter: 'scaling',
      title: 'Registering Views with the Change Detection Scheduler',
      body: [
        'Each mounted view is registered with the change detection engine. Angular tracks dirty state via either <code>NgZone</code> notifications or the new Zoneless <code>ChangeDetectionScheduler</code>.',
        'When data updates, the scheduler traverses the registered view tree, executing template update instructions (<code>ɵɵtextInterpolate</code>) to synchronize the real DOM.',
      ],
      callout: {
        kind: 'insight',
        text: 'OnPush components and Signals allow Angular to skip entire subtrees during change detection, maximizing rendering performance.',
      },
      changes: ['+ All views registered in CD scheduler', '+ Top-down and signal-driven change listeners armed'],
      metrics: { bootstrapPhase: 'CD Armed', platformInjector: 'Active', applicationRef: 'Running', componentTreeDepth: '3' },
      scene: {
        entities: {
          scheduler: d(-10, -18, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['CD Scheduler'], sub: 'coalesces render ticks' }),
          viewTracker: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'boxes', label: ['View Registrar'], sub: 'tracks dirty views' }),
          realDomNodes: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['Real DOM Nodes'], sub: 'mutated in place' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Change Detection Loop', [
            `// Scheduler execution:`,
            `scheduler.schedule({`,
            `  priority: Priority.Render,`,
            `  run: () => {`,
            `    appRef.tick(); // walks LView tree`,
            `    // executes ɵɵadvance(1); ɵɵtextInterpolate(title);`,
            `  }`,
            `});`,
          ], { icon: 'terminal' }),
          zArch: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'CHANGE DETECTION SCHEDULER BINDING'),
        },
        links: {
          sv: h('scheduler', 'viewTracker', ['scheduler', 'viewTracker'], { label: 'schedule tick' }),
          vr: h('viewTracker', 'realDomNodes', ['viewTracker', 'realDomNodes'], { label: 'mutate DOM' }),
        },
        flows: [{ route: ['sv', 'vr'], kind: 'render', rate: 1.5 }],
      },
    },
    {
      short: 'App Stability',
      chapter: 'scaling',
      title: 'Application Stability & isStable Observable',
      body: [
        'Once all pending microtasks, promises, and HTTP requests resolve, <code>ApplicationRef.isStable</code> emits <code>true</code>.',
        'This stability signal is critical: in Server-Side Rendering (SSR), Angular waits for <code>isStable</code> before serializing HTML to send over the wire to the browser.',
      ],
      callout: {
        kind: 'tip',
        text: 'Long-running setInterval calls outside ngZone.runOutsideAngular() will prevent isStable from ever emitting, hanging SSR builds!',
      },
      changes: ['+ Application reaches stable state', '+ isStable emits true for SSR serialization'],
      metrics: { bootstrapPhase: 'Stable (Running)', platformInjector: 'Active', applicationRef: 'isStable = true', componentTreeDepth: '3' },
      scene: {
        entities: {
          appRefInst: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['ApplicationRef'], sub: 'monitors task queues' }),
          stabilityChecker: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'boxes', label: ['isStable Guard'], sub: 'all async queues empty' }),
          readyApp: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['Production App'], sub: 'fully interactive' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Stability Observable', [
            `appRef.isStable.pipe(`,
            `  first((stable) => stable === true)`,
            `).subscribe(() => {`,
            `  console.log('Application is fully stable!');`,
            `  // SSR engine captures serialized HTML string`,
            `});`,
          ], { icon: 'terminal' }),
          zArch: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'APPLICATION STABILITY ENGINE'),
        },
        links: {
          as: h('appRefInst', 'stabilityChecker', ['appRefInst', 'stabilityChecker'], { label: 'poll microtasks' }),
          sr: h('stabilityChecker', 'readyApp', ['stabilityChecker', 'readyApp'], { label: 'emit isStable true' }),
        },
        flows: [{ route: ['as', 'sr'], kind: 'boot', rate: 1.6 }],
      },
    },
  ],
};
