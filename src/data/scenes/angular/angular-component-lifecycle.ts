// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularComponentLifecycleLesson = {
  id: 'angular-component-lifecycle',
  title: 'Component & Directive Lifecycle Pipeline',
  summary: 'Follow the execution order of all 8 Angular lifecycle hooks: ngOnChanges, ngOnInit, ngDoCheck, ngAfterContentInit, ngAfterViewInit, down to ngOnDestroy.',
  minutes: 15,
  level: 'intermediate',
  metrics: ['activeHook', 'domReady', 'inputsBound', 'subscriptionsCleaned'],
  legend: ['hook', ['content', 'content projection'], ['view', 'template view init']],
  goals: [
    { text: 'Construction vs Initialization: constructor vs ngOnInit', step: 1 },
    { text: 'Input binding & change detection: ngOnChanges and ngDoCheck', step: 2 },
    { text: 'Content Projection: ngAfterContentInit and ngAfterContentChecked', step: 3 },
    { text: 'View & DOM initialization: ngAfterViewInit and cleanup with ngOnDestroy', step: 4 },
  ],
  steps: [
    {
      short: 'Init Pipeline',
      chapter: 'setup',
      title: 'constructor $\\rightarrow$ ngOnChanges $\\rightarrow$ ngOnInit',
      body: [
        '<b>constructor</b>: Class instantiation only (DI injection). Inputs are NOT yet available here!',
        '<b>ngOnChanges</b>: Fires first when <code>@Input()</code> values are bound or change (provides <code>SimpleChanges</code> object).',
        '<b>ngOnInit</b>: Fires once after the first <code>ngOnChanges</code>. This is the official place to initiate HTTP calls and initialize component state.',
      ],
      callout: {
        kind: 'tip',
        text: 'Never make HTTP calls in the constructor; always place business initialization in ngOnInit.',
      },
      metrics: { activeHook: 'ngOnInit', domReady: 'False', inputsBound: 'True', subscriptionsCleaned: 'Pending' },
      scene: {
        entities: {
          ctor: d(-10, 0, { color: 'slab', glyph: 'terminal', label: ['constructor()'], sub: 'DI injection only' }),
          changes: d(0, 0, { color: 'amber', glyph: 'boxes', label: ['ngOnChanges()'], sub: 'Inputs resolved' }),
          init: d(10, 0, { color: 'green', glyph: 'terminal', label: ['ngOnInit()'], sub: 'HTTP & logic start' }),
          zInit: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'INITIALIZATION STAGE'),
        },
        links: {
          cc: h('ctor', 'changes', ['ctor', 'changes'], { label: 'bind inputs' }),
          ci: h('changes', 'init', ['changes', 'init'], { label: 'initialize' }),
        },
        flows: [{ route: ['cc', 'ci'], kind: 'hook', rate: 1.5 }],
      },
    },
    {
      short: 'View & Content',
      chapter: 'technique',
      title: 'ngAfterContentInit $\\rightarrow$ ngAfterViewInit',
      body: [
        '<b>ngAfterContentInit</b>: Fires after projected content (<code><ng-content></code>) is initialized.',
        '<b>ngAfterViewInit</b>: Fires when the component’s own template DOM elements and child views (<code>@ViewChild</code>) are completely rendered and accessible in the DOM.',
      ],
      callout: {
        kind: 'warn',
        text: 'Modifying template-bound data in ngAfterViewInit without setTimeout triggers ExpressionChangedAfterItHasBeenCheckedError!',
      },
      changes: ['+ Projected content rendered', '+ Template DOM & @ViewChild fully mounted and accessible'],
      metrics: { activeHook: 'ngAfterViewInit', domReady: 'True (DOM accessible)', inputsBound: 'True', subscriptionsCleaned: 'Pending' },
      scene: {
        entities: {
          content: d(-6, 0, { color: 'purple', glyph: 'boxes', label: ['ngAfterContentInit()'], sub: '<ng-content> ready' }),
          view: d(6, 0, { color: 'green', glyph: 'terminal', label: ['ngAfterViewInit()'], sub: 'Template DOM mounted' }),
        },
        links: {
          cv: h('content', 'view', ['content', 'view'], { label: 'mount DOM' }),
        },
        flows: [{ route: ['cv'], kind: 'view', rate: 1.5 }],
      },
    },
    {
      short: 'Destruction',
      chapter: 'solution',
      title: 'ngOnDestroy & Modern DestroyRef: Zero Leaks',
      body: [
        '<b>ngOnDestroy</b>: Triggered immediately before Angular destroys the component view and removes its elements from the DOM.',
        'Essential for: unsubscribing from RxJS Observables, clearing <code>setInterval</code> timers, and detaching event listeners.',
        'Modern Angular: Use <code>DestroyRef.onDestroy(() => ...)</code> or the <code>takeUntilDestroyed()</code> operator to automate teardown without writing boilerplate hook classes!',
      ],
      callout: {
        kind: 'insight',
        text: 'takeUntilDestroyed() handles automatic RxJS unsubscription at the exact moment of component destruction.',
      },
      changes: ['+ Subscriptions cancelled', '+ Timers cleared', '+ Memory freed cleanly'],
      metrics: { activeHook: 'ngOnDestroy', domReady: 'Unmounted', inputsBound: 'Torn down', subscriptionsCleaned: '100% Clean' },
      scene: {
        entities: {
          destroy: d(-6, 0, { color: 'rose', glyph: 'alert', label: ['ngOnDestroy()'], sub: 'view teardown' }),
          cleaner: d(6, 0, { color: 'green', glyph: 'package', label: ['takeUntilDestroyed()'], sub: 'auto unsubscribe RxJS' }),
        },
        links: {
          dc: h('destroy', 'cleaner', ['destroy', 'cleaner'], { label: 'release memory' }),
        },
        flows: [{ route: ['dc'], rate: 1.8 }],
      },
    },
  ],
};
