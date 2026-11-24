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

export const angularChangeDetectionOnpushLesson = {
  id: 'angular-change-detection-onpush',
  title: 'Change Detection Strategy: OnPush Optimization',
  summary: 'Master ChangeDetectionStrategy.OnPush. Learn how Angular prunes entire component subtrees from dirty checking unless input references change or events fire internally.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['strategy', 'subtreeStatus', 'changeTrigger', 'skippedBranches'],
  legend: ['flow', ['tick', 'top-down walk'], ['bypass', 'skipped subtree prune'], ['event', 'internal event fire'], ['mark', 'markForCheck bubble']],
  goals: [
    { text: 'Default vs OnPush change detection boundaries', step: 1 },
    { text: 'Trigger 1: Input reference changes (=== equality)', step: 2 },
    { text: 'Trigger 2: Events originating inside the component subtree', step: 3 },
    { text: 'Trigger 3: AsyncPipe emissions triggering markForCheck()', step: 4 },
    { text: 'Manual scheduling: markForCheck() vs detectChanges()', step: 5 },
    { text: 'Detaching from Change Detector: cdRef.detach() for custom animations', step: 6 },
  ],
  steps: [
    {
      short: 'Default vs OnPush',
      chapter: 'concept',
      title: 'The Default vs OnPush Boundary',
      body: [
        'By default, Angular checks every single component in the tree whenever any event occurs. As the application grows to hundreds of components, this causes CPU overhead.',
        'Adding <code>changeDetection: ChangeDetectionStrategy.OnPush</code> turns the component into an isolated subtree: Angular will <b>skip</b> checking it and all its children unless explicitly notified.',
      ],
      callout: {
        kind: 'insight',
        text: 'OnPush transforms dirty checking from an O(N) whole-tree operation into targeted O(log N) branch walks.',
      },
      metrics: { strategy: 'OnPush', subtreeStatus: 'Pruned / Skipped', changeTrigger: 'None', skippedBranches: '100% of subtree' },
      scene: {
        entities: {
          rootComp: d(0, -12, { s: 5.0, h: 54, color: 'blue', glyph: 'boxes', label: ['AppComponent'], sub: 'strategy: Def' }),
          branchDefault: d(-12, 0, { s: 4.8, h: 52, color: 'amber', glyph: 'boxes', label: ['Default Branch'], sub: 'always checked' }),
          branchOnPush: d(12, 0, { s: 4.8, h: 52, color: 'green', glyph: 'boxes', label: ['OnPush Branch'], sub: 'pruned scope' }),
          leafDefault: b(-12, 14, { s: 4.6, h: 48, color: 'amber', glyph: 'server', label: ['Child View A'], sub: 'checked leaf' }),
          leafOnPush: b(12, 14, { s: 4.6, h: 48, color: 'slab', glyph: 'server', label: ['Child View B'], sub: 'pruned view' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'OnPush Component Declaration', [
            `@Component({`,
            `  selector: 'app-user-card',`,
            `  standalone: true,`,
            `  changeDetection: ChangeDetectionStrategy.OnPush,`,
            `  template: \`<div>{{ user.name }}</div>\``,
            `})`,
            `export class UserCardComponent {`,
            `  @Input() user!: User; // Only checks when user reference changes!`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          rd: h('rootComp', 'branchDefault', ['rootComp', 'branchDefault'], { label: 'traverse default' }),
          dl: h('branchDefault', 'leafDefault', ['branchDefault', 'leafDefault'], { label: 'check leaf' }),
          ro: h('rootComp', 'branchOnPush', ['rootComp', 'branchOnPush'], { label: 'check boundary' }),
          ol: h('branchOnPush', 'leafOnPush', ['branchOnPush', 'leafOnPush'], { label: 'skip subtree' }),
        },
        flows: [
          { route: ['rd', 'dl'], kind: 'tick', rate: 1.5 },
          { route: ['ro', 'ol'], kind: 'bypass', rate: 1.2 },
        ],
      },
    },
    {
      short: 'Input Reference',
      chapter: 'concept',
      title: 'Trigger 1: Input Reference Identity Mutation',
      body: [
        'An OnPush component checks itself when any of its <code>@Input()</code> properties change by <b>reference identity</b> (<code>newInput !== oldInput</code>).',
        'Mutating an object property (<code>user.name = \'Alice\'</code>) keeps the same memory pointer. Angular skips the component! To trigger an update, pass a new object: <code>user = { ...user, name: \'Alice\' }</code>.',
      ],
      callout: {
        kind: 'warning',
        text: 'Always adopt immutable data patterns (spread operator, Object.freeze) when working with OnPush components.',
      },
      changes: ['+ New user object reference passed via [user]', '+ OnPush component detects reference change and runs check'],
      metrics: { strategy: 'OnPush', subtreeStatus: 'Checked (Input change)', changeTrigger: 'newInput !== oldInput', skippedBranches: 'Active branch' },
      scene: {
        entities: {
          rootComp: d(0, -12, { s: 5.0, h: 54, color: 'blue', glyph: 'boxes', label: ['AppComponent'], sub: 'strategy: Def' }),
          branchOnPush: d(12, 0, { s: 4.8, h: 52, color: 'green', glyph: 'boxes', label: ['OnPush Branch'], sub: 'ref changed' }),
          leafOnPush: b(12, 14, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Child View B'], sub: 'checked leaf' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Input Reference Change', [
            `// In Parent Component:`,
            `// ❌ In-place mutation: OnPush SKIPS update!`,
            `this.user.name = 'Bob';`,
            ``,
            `// ✅ Immutable update: OnPush RUNS update!`,
            `this.user = { ...this.user, name: 'Bob' };`,
            `= Reference pointer changed: triggers OnPush re-render`,
          ], { icon: 'terminal' }),
        },
        links: {
          ro: h('rootComp', 'branchOnPush', ['rootComp', 'branchOnPush'], { label: 'pass new pointer' }),
          ol: h('branchOnPush', 'leafOnPush', ['branchOnPush', 'leafOnPush'], { label: 'run checkView()' }),
        },
        flows: [{ route: ['ro', 'ol'], kind: 'tick', rate: 1.5 }],
      },
    },
    {
      short: 'Internal Event',
      chapter: 'execution',
      title: 'Trigger 2: Event Originating Inside the Subtree',
      body: [
        'If a user clicks a button <b>inside</b> the OnPush component (e.g. <code>(click)="toggle()"</code>), Angular automatically marks that component and all its ancestors for checking.',
        'Notice: Unrelated sibling OnPush components remain completely skipped! Only the branch containing the event is re-checked.',
      ],
      callout: {
        kind: 'insight',
        text: 'Events originating from the template mark the view hierarchy dirty from the event source up to the root.',
      },
      changes: ['+ User clicks button inside OnPush template', '+ Component marked dirty; siblings remain pruned'],
      metrics: { strategy: 'OnPush', subtreeStatus: 'Self-Triggered', changeTrigger: '(click) inside template', skippedBranches: 'Siblings skipped' },
      scene: {
        entities: {
          rootComp: d(0, -12, { s: 5.0, h: 54, color: 'blue', glyph: 'boxes', label: ['AppComponent'], sub: 'ancestor' }),
          branchDefault: d(-12, 0, { s: 4.8, h: 52, color: 'slab', glyph: 'boxes', label: ['Sibling OnPush'], sub: 'skipped view' }),
          branchOnPush: d(12, 0, { s: 4.8, h: 52, color: 'green', glyph: 'boxes', label: ['Active OnPush'], sub: 'event branch' }),
          leafOnPush: y(12, 14, { label: 'Template Btn', tags: [{ text: '(click) event', tone: 'green', icon: 'zap' }] }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Internal Event Trigger', [
            `@Component({`,
            `  template: \`<button (click)="isExpanded = !isExpanded">Toggle</button>\``,
            `})`,
            `export class AccordionComponent {`,
            `  isExpanded = false;`,
            `  // Clicking button triggers Change Detection on THIS component`,
            `  // Sibling components on the page are NOT checked!`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          lb: h('leafOnPush', 'branchOnPush', ['leafOnPush', 'branchOnPush'], { label: 'bubble mark' }),
          br: h('branchOnPush', 'rootComp', ['branchOnPush', 'rootComp'], { label: 'mark ancestor' }),
        },
        flows: [{ route: ['lb', 'br'], kind: 'event', rate: 1.5 }],
      },
    },
    {
      short: 'AsyncPipe Trigger',
      chapter: 'execution',
      title: 'Trigger 3: AsyncPipe Stream Emission',
      body: [
        'When you use <code>data$ | async</code> inside an OnPush component, <code>AsyncPipe</code> internally calls <code>ChangeDetectorRef.markForCheck()</code> whenever the Observable emits.',
        'This allows OnPush components to seamlessly consume reactive RxJS streams while keeping manual change detection calls to zero.',
      ],
      callout: {
        kind: 'tip',
        text: 'Combining ChangeDetectionStrategy.OnPush with AsyncPipe was Angular’s gold standard reactive architecture before Signals.',
      },
      changes: ['+ Observable emits next value to AsyncPipe', '+ AsyncPipe calls markForCheck() to schedule render'],
      metrics: { strategy: 'OnPush', subtreeStatus: 'Marked For Check', changeTrigger: 'Observable.next()', skippedBranches: 'Clean' },
      scene: {
        entities: {
          rootComp: d(0, -12, { s: 5.0, h: 54, color: 'blue', glyph: 'boxes', label: ['AppComponent'], sub: 'root tick' }),
          branchOnPush: d(12, 0, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['AsyncPipe'], sub: 'markForCheck' }),
          leafOnPush: b(12, 14, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Stream View'], sub: 'checked leaf' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'AsyncPipe in OnPush', [
            `@Component({`,
            `  changeDetection: ChangeDetectionStrategy.OnPush,`,
            `  template: \`<div>{{ (stats$ | async)?.activeUsers }}</div>\``,
            `})`,
            `// AsyncPipe handles markForCheck() automatically on every emission!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ba: h('branchOnPush', 'rootComp', ['branchOnPush', 'rootComp'], { label: 'mark path dirty' }),
          bl: h('branchOnPush', 'leafOnPush', ['branchOnPush', 'leafOnPush'], { label: 'update template' }),
        },
        flows: [{ route: ['ba', 'bl'], kind: 'mark', rate: 1.5 }],
      },
    },
    {
      short: 'Manual CD Control',
      chapter: 'technique',
      title: 'markForCheck() vs detectChanges()',
      body: [
        'When third-party libraries (e.g. WebSocket, Leaflet, Stripe) update state outside Angular, inject <code>ChangeDetectorRef</code>:',
        '<code>markForCheck()</code>: Marks the component dirty for the <b>next scheduled tick</b> (asynchronous and coalesced).',
        '<code>detectChanges()</code>: Runs change detection on this component and its children <b>immediately and synchronously</b>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Prefer markForCheck() to avoid thrashing the DOM. Use detectChanges() only when synchronous rendering is strictly mandatory.',
      },
      changes: ['+ Manual change detector APIs used for non-Angular event bridges'],
      metrics: { strategy: 'OnPush', subtreeStatus: 'Manually Triggered', changeTrigger: 'cdRef API', skippedBranches: 'Targeted' },
      scene: {
        entities: {
          rootComp: d(0, -12, { s: 5.0, h: 54, color: 'blue', glyph: 'boxes', label: ['AppComponent'], sub: 'coalesced tick' }),
          branchOnPush: d(12, 0, { s: 4.8, h: 52, color: 'amber', glyph: 'cpu', label: ['cdRef Control'], sub: 'markForCheck' }),
          leafOnPush: b(12, 14, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Synced UI'], sub: 'synced DOM' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'ChangeDetectorRef Methods', [
            `constructor(private cdr: ChangeDetectorRef) {}`,
            ``,
            `// Asynchronous (Recommended):`,
            `this.cdr.markForCheck(); // Checks on next tick`,
            ``,
            `// Synchronous (Use with caution):`,
            `this.cdr.detectChanges(); // Executes immediately`,
          ], { icon: 'terminal' }),
        },
        links: {
          bc: h('branchOnPush', 'rootComp', ['branchOnPush', 'rootComp'], { label: 'mark path' }),
          bl: h('branchOnPush', 'leafOnPush', ['branchOnPush', 'leafOnPush'], { label: 'execute check' }),
        },
        flows: [{ route: ['bc', 'bl'], kind: 'mark', rate: 1.5 }],
      },
    },
    {
      short: 'Detaching CD',
      chapter: 'scaling',
      title: 'Detaching from Change Detector: cdRef.detach()',
      body: [
        'For high-speed charts or gaming surfaces updating hundreds of times per second, you can completely unhook a component from change detection using <code>cdr.detach()</code>.',
        'Angular will <b>never</b> check this component again until you manually call <code>cdr.detectChanges()</code> on your own custom timer or call <code>cdr.reattach()</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Detaching isolates components with heavy local state without impacting the rest of the application.',
      },
      changes: ['+ Component detached from global change detection tree', '+ Custom rendering loop takes full control'],
      metrics: { strategy: 'Detached', subtreeStatus: '100% Isolated', changeTrigger: 'Custom RAF loop', skippedBranches: 'Detached' },
      scene: {
        entities: {
          rootComp: d(0, -12, { s: 5.0, h: 54, color: 'blue', glyph: 'boxes', label: ['AppComponent'], sub: 'standard CD' }),
          branchOnPush: d(12, 0, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['cdr.detach()'], sub: 'detached scope' }),
          leafOnPush: b(12, 14, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['60Hz Canvas'], sub: 'manual CD' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Detached Component Pattern', [
            `constructor(private cdr: ChangeDetectorRef) {`,
            `  this.cdr.detach(); // Completely stops automatic checking`,
            `}`,
            ``,
            `// Run manual checks only every 500ms:`,
            `setInterval(() => {`,
            `  this.cdr.detectChanges();`,
            `}, 500);`,
          ], { icon: 'terminal' }),
        },
        links: {
          br: h('branchOnPush', 'rootComp', ['branchOnPush', 'rootComp'], { label: 'sever connection' }),
          bl: h('branchOnPush', 'leafOnPush', ['branchOnPush', 'leafOnPush'], { label: 'custom 60Hz loop' }),
        },
        flows: [{ route: ['bl'], kind: 'bypass', rate: 1.6 }],
      },
    },
  ],
};
