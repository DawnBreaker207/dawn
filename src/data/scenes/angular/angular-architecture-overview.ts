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
        'Before rendering any HTML, Angular creates the <b>Platform Injector</b> (singleton across applications on the page, handling DOM sanitation), then prepares the application scope.',
      ],
      callout: {
        kind: 'insight',
        text: 'Angular separates the platform (browser vs server vs worker) from the application environment.',
      },
      metrics: { bootstrapPhase: 'Platform Init', platformInjector: 'Active', applicationRef: 'Pending', componentTreeDepth: '0' },
      scene: {
        entities: {
          mainTs: y(-16, -10, { label: 'main.ts', tags: [{ text: 'bootstrapApp', tone: 'blue', icon: 'terminal' }] }),
          platInj: d(-4, -8, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['Platform', 'Injector'], sub: 'platform root' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Bootstrap Entrypoint', [
            `// src/main.ts`,
            `import { bootstrapApplication } from '@angular/platform-browser';`,
            `import { AppComponent } from './app/app.component';`,
            `import { appConfig } from './app/app.config';`,
            ``,
            `bootstrapApplication(AppComponent, appConfig)`,
            `  .catch((err) => console.error(err));`,
          ], { icon: 'terminal' }),
        },
        links: {
          mp: h('mainTs', 'platInj', ['mainTs', 'platInj'], { label: 'init platform' }),
        },
        flows: [{ route: ['mp'], kind: 'boot', rate: 1.5 }],
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
      changes: ['+ Initialized Environment Injector with appConfig', '+ Registered Router and HttpClient singletons'],
      metrics: { bootstrapPhase: 'Providers Loaded', platformInjector: 'Active', applicationRef: 'Pending', componentTreeDepth: '0' },
      scene: {
        entities: {
          mainTs: y(-16, -10, { label: 'main.ts', tags: [{ text: 'bootstrapApp', tone: 'blue', icon: 'terminal' }] }),
          platInj: d(-4, -8, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['Platform', 'Injector'], sub: 'platform root' }),
          envInj: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['Environment', 'Injector'], sub: 'app config' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Application Config', [
            `// src/app/app.config.ts`,
            `export const appConfig: ApplicationConfig = {`,
            `  providers: [`,
            `    provideRouter(routes, withComponentInputBinding()),`,
            `    provideHttpClient(withFetch()),`,
            `    provideClientHydration()`,
            `  ]`,
            `};`,
          ], { icon: 'terminal' }),
        },
        links: {
          mp: h('mainTs', 'platInj', ['mainTs', 'platInj'], { label: 'init platform' }),
          pe: h('platInj', 'envInj', ['platInj', 'envInj'], { label: 'create env' }),
        },
        flows: [{ route: ['mp', 'pe'], kind: 'boot', rate: 1.5 }],
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
      changes: ['+ ApplicationRef initialized to coordinate views', '+ AppComponent mounted into <app-root>'],
      metrics: { bootstrapPhase: 'Root Mounted', platformInjector: 'Active', applicationRef: 'Instantiated', componentTreeDepth: '1' },
      scene: {
        entities: {
          mainTs: y(-16, -10, { label: 'main.ts', tags: [{ text: 'bootstrapApp', tone: 'blue', icon: 'terminal' }] }),
          platInj: d(-4, -8, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['Platform', 'Injector'], sub: 'platform root' }),
          envInj: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['Environment', 'Injector'], sub: 'app config' }),
          appRef: d(8, 8, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['ApplicationRef'], sub: 'orchestrator' }),
          appComp: d(-6, 6, { s: 5.0, h: 54, color: 'green', glyph: 'terminal', label: ['AppComponent', 'Instance'], sub: 'root component' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Root Component', [
            `@Component({`,
            `  selector: 'app-root',`,
            `  standalone: true,`,
            `  imports: [RouterOutlet, NavComponent],`,
            `  template: \`<app-nav /><router-outlet />\``,
            `})`,
            `export class AppComponent {}`,
          ], { icon: 'terminal' }),
        },
        links: {
          pe: h('platInj', 'envInj', ['platInj', 'envInj'], { label: 'create env' }),
          ea: h('envInj', 'appRef', ['envInj', 'appRef'], { label: 'init appRef' }),
          ar: h('appRef', 'appComp', ['appRef', 'appComp'], { label: 'mount app-root' }),
        },
        flows: [{ route: ['ea', 'ar'], kind: 'view', rate: 1.5 }],
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
      changes: ['+ NavComponent attached as header child', '+ FeedComponent projected into RouterOutlet'],
      metrics: { bootstrapPhase: 'Tree Assembled', platformInjector: 'Active', applicationRef: 'Tracking 3 views', componentTreeDepth: '3' },
      scene: {
        entities: {
          appRef: d(8, 8, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['ApplicationRef'], sub: 'orchestrator' }),
          appComp: d(-6, 6, { s: 5.0, h: 54, color: 'green', glyph: 'terminal', label: ['AppComponent', '(Root)'], sub: 'root component' }),
          navComp: d(-18, 4, { s: 4.4, h: 50, color: 'cyan', glyph: 'boxes', label: ['NavComponent', '(Child)'], sub: 'header view' }),
          feedComp: d(-6, 20, { s: 4.4, h: 50, color: 'amber', glyph: 'boxes', label: ['FeedComponent', '(Outlet)'], sub: 'outlet child' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Hierarchical View Tree', [
            `AppComponent (Root View)`,
            `  ├── NavComponent (Header / Logo)`,
            `  └── RouterOutlet (Viewport)`,
            `        └── FeedComponent (Posts list)`,
            `= Complete UI rendered as hierarchical views`,
          ], { icon: 'terminal' }),
        },
        links: {
          ar: h('appRef', 'appComp', ['appRef', 'appComp'], { label: 'mount app-root' }),
          an: h('appComp', 'navComp', ['appComp', 'navComp'], { label: 'render header' }),
          af: h('appComp', 'feedComp', ['appComp', 'feedComp'], { label: 'render feed' }),
        },
        flows: [{ route: ['ar', 'an'], kind: 'view', rate: 1.5 }],
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
      changes: ['+ Registered view tree with ChangeDetectionScheduler', '+ Coalesced microtask render cycle ready'],
      metrics: { bootstrapPhase: 'CD Armed', platformInjector: 'Active', applicationRef: 'Running', componentTreeDepth: '3' },
      scene: {
        entities: {
          appRef: d(8, 8, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['ApplicationRef'], sub: 'orchestrator' }),
          appComp: d(-6, 6, { s: 5.0, h: 54, color: 'green', glyph: 'terminal', label: ['AppComponent', '(Root)'], sub: 'root component' }),
          navComp: d(-18, 4, { s: 4.4, h: 50, color: 'cyan', glyph: 'boxes', label: ['NavComponent', '(Child)'], sub: 'header view' }),
          feedComp: d(-6, 20, { s: 4.4, h: 50, color: 'amber', glyph: 'boxes', label: ['FeedComponent', '(Outlet)'], sub: 'outlet child' }),
          realDom: b(16, 14, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Browser DOM'], sub: 'DOM mutations' }),
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
        },
        links: {
          ar: h('appRef', 'appComp', ['appRef', 'appComp'], { label: 'mount app-root' }),
          an: h('appComp', 'navComp', ['appComp', 'navComp'], { label: 'render header' }),
          af: h('appComp', 'feedComp', ['appComp', 'feedComp'], { label: 'render feed' }),
          cd: h('appRef', 'realDom', ['appRef', 'realDom'], { label: 'schedule tick' }),
        },
        flows: [{ route: ['cd'], kind: 'render', rate: 1.5 }],
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
      changes: ['+ All microtasks resolved: ApplicationRef.isStable = true', '+ Ready for user interaction or SSR HTML serialization'],
      metrics: { bootstrapPhase: 'Stable (Running)', platformInjector: 'Active', applicationRef: 'isStable = true', componentTreeDepth: '3' },
      scene: {
        entities: {
          platInj: d(-4, -8, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['Platform', 'Injector'], sub: 'platform root' }),
          envInj: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['Environment', 'Injector'], sub: 'app config' }),
          appRef: d(8, 8, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['ApplicationRef'], sub: 'orchestrator' }),
          appComp: d(-6, 6, { s: 5.0, h: 54, color: 'green', glyph: 'terminal', label: ['AppComponent', '(Root)'], sub: 'root component' }),
          realDom: b(16, 14, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Browser DOM'], sub: 'DOM mutations' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Stability Observable', [
            `appRef.isStable.pipe(`,
            `  first((stable) => stable === true)`,
            `).subscribe(() => {`,
            `  console.log('Application is fully stable!');`,
            `  // SSR engine captures serialized HTML string`,
            `});`,
          ], { icon: 'terminal' }),
        },
        links: {
          pe: h('platInj', 'envInj', ['platInj', 'envInj'], { label: 'create env' }),
          ea: h('envInj', 'appRef', ['envInj', 'appRef'], { label: 'init appRef' }),
          ar: h('appRef', 'appComp', ['appRef', 'appComp'], { label: 'mount app-root' }),
          cd: h('appRef', 'realDom', ['appRef', 'realDom'], { label: 'schedule tick' }),
        },
        flows: [{ route: ['ea', 'ar', 'cd'], kind: 'boot', rate: 1.6 }],
      },
    },
  ],
};
