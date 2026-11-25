// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const angularArchitectureOverviewLesson = {
  id: 'angular-architecture-overview',
  title: 'Bootstrap & Component Tree',
  summary: 'Trace modern Angular from legacy NgModule bloat vs Standalone tree-shaking, through main.ts bootstrapApplication, Platform & Environment Injectors, ApplicationRef, to the Hierarchical Component Tree & isStable.',
  minutes: 30,
  level: 'beginner',
  metrics: ['architectureModel', 'bootstrapPhase', 'bundleSize', 'componentTreeDepth'],
  legend: ['flow', ['module', 'NgModule coupling'], ['boot', 'standalone bootstrap'], ['view', 'component tree'], ['render', 'DOM rendering']],
  goals: [
    { text: 'Legacy NgModules & SharedModule transitive dependency bloat', step: 1 },
    { text: 'Standalone Components (standalone: true) & ESBuild tree-shaking', step: 2 },
    { text: 'main.ts bootstrapApplication & Platform Injector singleton', step: 3 },
    { text: 'appConfig Environment Injector (provideRouter, provideHttpClient)', step: 4 },
    { text: 'ApplicationRef & Root AppComponent instantiation', step: 5 },
    { text: 'Hierarchical Component & LView/TView tree construction', step: 6 },
    { text: 'Change Detection Scheduler binding & real DOM updates', step: 7 },
    { text: 'Application stability & ApplicationRef.isStable for SSR', step: 8 },
  ],
  steps: [
    {
      short: 'NgModule Bloat',
      chapter: 'setup',
      title: 'Legacy NgModules vs Transitive Dependency Leakage',
      body: [
        'Historically, components had to be declared inside an <code>@NgModule</code>. Teams built giant <code>SharedModule</code> containers importing 50+ libraries.',
        'Because bundlers could not statically prove which declarations were unused in dynamic templates, unused mega-libraries (like <code>HeavyChart</code>) leaked into <code>main.js</code>, bloating bundles over 2.8MB.',
      ],
      callout: {
        kind: 'warning',
        text: 'SharedModule creates opaque compilation bubbles that block fine-grained dead-code elimination.',
      },
      metrics: { architectureModel: 'NgModule (Legacy)', bootstrapPhase: 'Compile Bubble', bundleSize: '2.8 MB (Bloated)', componentTreeDepth: '0' },
      scene: {
        entities: {
          mainTs: y(-16, -10, { label: 'AppModule', tags: [{ text: '@NgModule', tone: 'purple', icon: 'boxes' }] }),
          platInj: d(-4, -8, { s: 4.8, h: 52, color: 'rose', glyph: 'boxes', label: ['SharedModule'], sub: 'mega container' }),
          envInj: d(8, -6, { s: 4.8, h: 52, color: 'rose', glyph: 'package', label: ['HeavyChart'], sub: 'leaked 1.2MB' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Legacy NgModule Monolith', [
            `@NgModule({`,
            `  declarations: [UserComponent, ButtonComponent],`,
            `  imports: [CommonModule, HeavyChartModule]`,
            `})`,
            `export class SharedModule {} // Leaks unused code!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ms: h('mainTs', 'platInj', ['mainTs', 'platInj'], { label: 'imports shared' }),
          sh: h('platInj', 'envInj', ['platInj', 'envInj'], { label: 'leaks unused' }),
        },
        flows: [{ route: ['ms', 'sh'], kind: 'module', rate: 1.4 }],
      },
    },
    {
      short: 'Standalone Shake',
      chapter: 'setup',
      title: 'Standalone Architecture & ESBuild Tree-Shaking',
      body: [
        'Modern Angular uses <code>standalone: true</code> (now the default) with direct <code>imports: [ButtonComponent]</code> and lazy <code>loadComponent</code> routes.',
        'With a crystal-clear static ES module graph, ESBuild/Vite prunes every unused component—slashing initial bundle size by 40–60% (automated via <code>ng generate @angular/core:standalone</code>).',
      ],
      callout: {
        kind: 'tip',
        text: 'Direct component-to-component imports eliminate AppModule boilerplate and unlock peak tree-shaking.',
      },
      changes: ['+ NgModules replaced by direct standalone ESM imports', '+ ESBuild prunes unused code (-64% bundle size)'],
      metrics: { architectureModel: 'Standalone', bootstrapPhase: 'Tree-Shaken', bundleSize: '450 KB (-64%)', componentTreeDepth: '0' },
      scene: {
        entities: {
          mainTs: y(-16, -10, { label: 'UserComp', tags: [{ text: 'standalone', tone: 'green', icon: 'zap' }] }),
          platInj: d(-4, -8, { s: 4.8, h: 52, color: 'cyan', glyph: 'boxes', label: ['Direct Imports'], sub: 'Button only' }),
          envInj: d(8, -6, { s: 4.8, h: 52, color: 'green', glyph: 'cpu', label: ['ESBuild Shaker'], sub: '450KB lean' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Standalone Component', [
            `@Component({`,
            `  selector: 'app-user',`,
            `  standalone: true,`,
            `  imports: [ButtonComponent], // Explicit ESM graph`,
            `  template: \`<app-button>Save</app-button>\``,
            `})`,
            `export class UserComponent {}`,
          ], { icon: 'terminal' }),
        },
        links: {
          ms: h('mainTs', 'platInj', ['mainTs', 'platInj'], { label: 'imports direct' }),
          sh: h('platInj', 'envInj', ['platInj', 'envInj'], { label: 'prune dead code' }),
        },
        flows: [{ route: ['ms', 'sh'], kind: 'boot', rate: 1.5 }],
      },
    },
    {
      short: 'Bootstrap',
      chapter: 'setup',
      title: 'Bootstrap Sequence: main.ts to Platform Injector',
      body: [
        'Modern Angular bootstraps via <code>bootstrapApplication(AppComponent, appConfig)</code>.',
        'Before rendering any HTML, Angular creates the <b>Platform Injector</b> (singleton across apps on the page, handling DOM sanitization and platform services).',
      ],
      callout: {
        kind: 'insight',
        text: 'Angular separates the platform (browser vs server vs worker) from the application environment.',
      },
      changes: ['+ main.ts invokes bootstrapApplication()', '+ Platform Injector singleton initialized'],
      metrics: { architectureModel: 'Standalone', bootstrapPhase: 'Platform Init', bundleSize: '450 KB', componentTreeDepth: '0' },
      scene: {
        entities: {
          mainTs: y(-16, -10, { label: 'main.ts', tags: [{ text: 'bootstrapApp', tone: 'blue', icon: 'terminal' }] }),
          platInj: d(-4, -8, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['Platform', 'Injector'], sub: 'platform root' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Bootstrap Entrypoint', [
            `// src/main.ts`,
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
        '<code>appConfig</code> supplies essential application services: routing (<code>provideRouter</code>), HTTP client (<code>provideHttpClient</code>), and hydration.',
        'These functional providers live inside the <b>Environment Injector</b> and are accessible throughout the application lifecycle.',
      ],
      callout: {
        kind: 'tip',
        text: 'Functional providers replace legacy NgModule.forRoot() calls, enabling superior dead-code elimination.',
      },
      changes: ['+ Environment Injector initialized with appConfig', '+ Router and HttpClient singletons registered'],
      metrics: { architectureModel: 'Standalone', bootstrapPhase: 'Providers Loaded', bundleSize: '450 KB', componentTreeDepth: '0' },
      scene: {
        entities: {
          mainTs: y(-16, -10, { label: 'main.ts', tags: [{ text: 'bootstrapApp', tone: 'blue', icon: 'terminal' }] }),
          platInj: d(-4, -8, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['Platform', 'Injector'], sub: 'platform root' }),
          envInj: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['Environment', 'Injector'], sub: 'app config' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Application Config', [
            `export const appConfig: ApplicationConfig = {`,
            `  providers: [`,
            `    provideRouter(routes, withComponentInputBinding()),`,
            `    provideHttpClient(withFetch()),`,
            `    provideClientHydration(withEventReplay())`,
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
        'Angular locates <code>&lt;app-root&gt;</code> in <code>index.html</code> and mounts <code>AppComponent</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'ApplicationRef connects the root component to Angular’s change detection loop.',
      },
      changes: ['+ ApplicationRef initialized', '+ Root AppComponent mounted into <app-root>'],
      metrics: { architectureModel: 'Standalone', bootstrapPhase: 'Root Mounted', bundleSize: '450 KB', componentTreeDepth: '1' },
      scene: {
        entities: {
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
        'As <code>AppComponent</code> executes its template, it creates a tree of <b>LView</b> (Logical View) and <b>TView</b> (Template View) structures for child components (<code>&lt;app-nav&gt;</code>, <code>&lt;router-outlet&gt;</code>).',
        'Each component receives its own <b>NodeInjector</b>, inheriting services from parents up to the root.',
      ],
      callout: {
        kind: 'tip',
        text: 'Data flows down via @Input / signals, and events bubble up via @Output / callbacks.',
      },
      changes: ['+ NavComponent & FeedComponent mounted as child views', '+ Hierarchical NodeInjector tree established'],
      metrics: { architectureModel: 'Standalone', bootstrapPhase: 'Tree Assembled', bundleSize: '450 KB', componentTreeDepth: '3' },
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
        'Each mounted view is registered with the change detection engine (<code>NgZone</code> or Zoneless <code>ChangeDetectionScheduler</code>).',
        'When data updates, the scheduler traverses dirty views, executing Ivy update instructions (<code>ɵɵtextInterpolate</code>) to synchronize the real DOM.',
      ],
      callout: {
        kind: 'insight',
        text: 'OnPush and Signals allow Angular to skip clean subtrees during change detection.',
      },
      changes: ['+ Views registered with ChangeDetectionScheduler', '+ Browser DOM attached and synchronized'],
      metrics: { architectureModel: 'Standalone', bootstrapPhase: 'CD Armed', bundleSize: '450 KB', componentTreeDepth: '3' },
      scene: {
        entities: {
          appRef: d(8, 8, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['ApplicationRef'], sub: 'orchestrator' }),
          appComp: d(-6, 6, { s: 5.0, h: 54, color: 'green', glyph: 'terminal', label: ['AppComponent', '(Root)'], sub: 'root component' }),
          navComp: d(-18, 4, { s: 4.4, h: 50, color: 'cyan', glyph: 'boxes', label: ['NavComponent', '(Child)'], sub: 'header view' }),
          feedComp: d(-6, 20, { s: 4.4, h: 50, color: 'amber', glyph: 'boxes', label: ['FeedComponent', '(Outlet)'], sub: 'outlet child' }),
          realDom: b(16, 14, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Browser DOM'], sub: 'DOM mutations' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Change Detection Loop', [
            `scheduler.schedule({`,
            `  priority: Priority.Render,`,
            `  run: () => appRef.tick()`,
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
        'In Server-Side Rendering (SSR), Angular waits for <code>isStable</code> before serializing the final HTML string over the wire.',
      ],
      callout: {
        kind: 'tip',
        text: 'Long-running setInterval calls outside ngZone.runOutsideAngular() prevent isStable from emitting, hanging SSR builds!',
      },
      changes: ['+ Application reaches stable state (isStable = true)', '+ Ready for user interaction or SSR HTML serialization'],
      metrics: { architectureModel: 'Modern Standalone', bootstrapPhase: 'isStable = true', bundleSize: '450 KB', componentTreeDepth: '3' },
      scene: {
        entities: {
          platInj: d(-4, -8, { s: 4.8, h: 52, color: 'purple', glyph: 'boxes', label: ['Platform', 'Injector'], sub: 'platform root' }),
          envInj: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['Environment', 'Injector'], sub: 'app config' }),
          appRef: d(8, 8, { s: 4.8, h: 52, color: 'blue', glyph: 'cpu', label: ['ApplicationRef'], sub: 'isStable=true' }),
          appComp: d(-6, 6, { s: 5.0, h: 54, color: 'green', glyph: 'terminal', label: ['AppComponent', '(Root)'], sub: 'root component' }),
          realDom: b(16, 14, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Browser DOM'], sub: 'DOM mutations' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Stability Observable', [
            `appRef.isStable.pipe(`,
            `  first((stable) => stable === true)`,
            `).subscribe(() => {`,
            `  // SSR engine serializes HTML!`,
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
