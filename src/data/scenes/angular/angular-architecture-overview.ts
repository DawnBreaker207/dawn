// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularArchitectureOverviewLesson = {
  id: 'angular-architecture-overview',
  title: 'Architecture Overview: Bootstrap to Component Tree',
  summary: 'Trace an Angular application lifecycle from main.ts bootstrapApplication, Platform Injector, ApplicationRef, to the Hierarchical Component & View Tree.',
  minutes: 15,
  level: 'beginner',
  metrics: ['bootstrapPhase', 'platformInjector', 'applicationRef', 'componentTreeDepth'],
  legend: ['flow', ['boot', 'bootstrap sequence'], ['view', 'component tree']],
  goals: [
    { text: 'main.ts bootstrap: platformBrowser vs bootstrapApplication', step: 1 },
    { text: 'The Platform Injector vs EnvironmentInjector hierarchy', step: 2 },
    { text: 'ApplicationRef and the ComponentFactory render loop', step: 3 },
  ],
  steps: [
    {
      short: 'Bootstrap',
      chapter: 'setup',
      title: 'Bootstrap Sequence: main.ts to Platform',
      body: [
        'Modern Angular bootstraps via <code>bootstrapApplication(AppComponent, appConfig)</code>.',
        'Before rendering any HTML, Angular creates the <b>Platform Injector</b> (singleton across multiple applications on the same page, handling DOM sanitation and zone setup), then creates the <b>EnvironmentInjector</b> containing global providers.',
      ],
      callout: {
        kind: 'insight',
        text: 'Angular separates the platform (browser vs server vs web worker) from the application environment.',
      },
      metrics: { bootstrapPhase: 'Platform Init', platformInjector: 'Active', applicationRef: 'Pending', componentTreeDepth: '0' },
      scene: {
        entities: {
          main: d(-10, 0, { color: 'amber', glyph: 'terminal', label: ['main.ts'], sub: 'bootstrapApplication()' }),
          platform: d(0, 0, { color: 'blue', glyph: 'boxes', label: ['Platform Injector'], sub: 'platformBrowser()' }),
          envInj: d(10, 0, { color: 'purple', glyph: 'package', label: ['EnvironmentInjector'], sub: 'appConfig providers' }),
          zBoot: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'ANGULAR BOOTSTRAP PIPELINE'),
        },
        links: {
          mp: h('main', 'platform', ['main', 'platform'], { label: 'initialize' }),
          pe: h('platform', 'envInj', ['platform', 'envInj'], { label: 'create app scope' }),
        },
        flows: [{ route: ['mp', 'pe'], kind: 'boot', rate: 1.4 }],
      },
    },
    {
      short: 'Component Tree',
      chapter: 'solution',
      title: 'ApplicationRef & The Hierarchical View Tree',
      body: [
        'Once the injector is ready, <code>ApplicationRef</code> creates the root component (<code><app-root></code>) via its compiled <code>ViewDefinition</code>.',
        'The DOM is structured as a hierarchical tree of Components and Views. Data flows down via <code>@Input()</code> / <code>input()</code> signals, while events flow up via <code>@Output()</code> / <code>output()</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Every component in Angular has an associated View, ViewContainerRef, and NodeInjector forming an unbroken tree.',
      },
      changes: ['+ ApplicationRef bootstrapped', '+ Root AppComponent mounted in DOM', '+ Child Header, Sidebar, Content views linked'],
      metrics: { bootstrapPhase: 'Running', platformInjector: 'Active', applicationRef: 'Tick Active', componentTreeDepth: '3 levels' },
      scene: {
        entities: {
          root: d(0, -6, { s: 4.8, color: 'red', glyph: 'boxes', label: ['<app-root>'], sub: 'Root Component' }),
          header: d(-8, 2, { color: 'green', glyph: 'terminal', label: ['<app-header>'], sub: 'Navbar & Auth' }),
          sidebar: d(0, 2, { color: 'green', glyph: 'terminal', label: ['<app-sidebar>'], sub: 'Navigation tree' }),
          content: d(8, 2, { color: 'green', glyph: 'terminal', label: ['<app-content>'], sub: 'RouterOutlet view' }),
        },
        links: {
          rh: h('root', 'header', ['root', 'header'], { heads: 'both', label: 'input/output' }),
          rs: h('root', 'sidebar', ['root', 'sidebar'], { heads: 'both', label: 'input/output' }),
          rc: h('root', 'content', ['root', 'content'], { heads: 'both', label: 'input/output' }),
        },
        flows: [
          { route: ['rh'], kind: 'view', rate: 1.2 },
          { route: ['rs'], kind: 'view', rate: 1.2 },
          { route: ['rc'], kind: 'view', rate: 1.5 },
        ],
      },
    },
  ],
};
