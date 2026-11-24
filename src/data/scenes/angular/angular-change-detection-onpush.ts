// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularChangeDetectionOnpushLesson = {
  id: 'angular-change-detection-onpush',
  title: 'Change Detection Strategy: OnPush Optimization',
  summary: 'Master ChangeDetectionStrategy.OnPush. Learn how Angular prunes entire component subtrees from dirty checking unless input references change or events fire internally.',
  minutes: 20,
  level: 'intermediate',
  metrics: ['strategy', 'subtreeStatus', 'changeTrigger', 'skippedBranches'],
  legend: ['flow', ['tick', 'top-down walk'], ['bypass', 'skipped subtree prune']],
  goals: [
    { text: 'Default vs OnPush change detection boundaries', step: 1 },
    { text: 'Reference immutability and input change triggers', step: 2 },
    { text: 'Manual scheduling: markForCheck() vs detectChanges()', step: 3 },
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
        text: 'OnPush promises Angular: "This component only depends on its @Input() bindings and internal UI events. If those do not change, don\'t check me."',
      },
      metrics: { strategy: 'OnPush Boundary', subtreeStatus: 'Protected', changeTrigger: 'None', skippedBranches: '1 subtree' },
      scene: {
        entities: {
          parent: d(0, -6, { s: 4.8, color: 'blue', glyph: 'boxes', label: ['Parent (Default)'], sub: 'Checks on every tick' }),
          onpushSubtree: d(-8, 2, { color: 'green', glyph: 'shield', label: ['OnPush Component'], sub: 'changeDetection: OnPush' }),
          normalSubtree: d(8, 2, { color: 'red', glyph: 'terminal', label: ['Default Component'], sub: 'Always checked' }),
          zBound: x({ x0: -11, x1: 11, y0: -8, y1: 5 }, 'CHANGE DETECTION STRATEGY BOUNDARIES'),
        },
        links: {
          po: h('parent', 'onpushSubtree', ['parent', 'onpushSubtree'], { label: 'skip if inputs unchanged' }),
          pn: h('parent', 'normalSubtree', ['parent', 'normalSubtree'], { label: 'always traverse' }),
        },
        flows: [{ route: ['pn'], kind: 'tick', rate: 1.5 }],
      },
    },
    {
      short: 'Input Reference',
      chapter: 'verification',
      title: 'Immutability & Input Reference Changes',
      body: [
        'OnPush only triggers when an <code>@Input()</code> property receives a <b>new object reference</b> (<code>===</code> inequality).',
        'Mutating an object in place (e.g. <code>user.name = "Bob"</code>) will NOT trigger OnPush change detection because the object memory reference is identical. Developers must use immutable updates (e.g. <code>user = { ...user, name: "Bob" }</code>).',
      ],
      callout: {
        kind: 'caution',
        text: 'In-place mutations (array.push, obj.prop = val) silently fail to render in OnPush components. Always use immutable data patterns.',
      },
      changes: ['+ Parent created new immutable user reference ({ ...user })', '+ OnPush component input comparator detected reference change', '+ Subtree marked dirty for current frame update'],
      metrics: { strategy: 'OnPush Activated', subtreeStatus: 'Checked (Dirty)', changeTrigger: 'Input Reference Change', skippedBranches: '0 (Triggered)' },
      scene: {
        entities: {
          immutableData: d(-10, 0, { color: 'amber', glyph: 'database', label: ['user = { ...user }'], sub: 'New memory pointer 0x8A12' }),
          inputGuard: d(0, 0, { color: 'purple', glyph: 'shield', label: ['Input Diff Guard'], sub: 'prev !== curr (true)' }),
          onpushComp: d(10, 0, { color: 'green', glyph: 'terminal', label: ['UserCard (OnPush)'], sub: 'Re-renders view' }),
          zInput: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'IMMUTABLE REFERENCE DETECTION'),
        },
        links: {
          ii: h('immutableData', 'inputGuard', ['immutableData', 'inputGuard'], { label: 'new reference passed' }),
          io: h('inputGuard', 'onpushComp', ['inputGuard', 'onpushComp'], { label: 'trigger update' }),
        },
        flows: [{ route: ['ii', 'io'], kind: 'tick', rate: 1.6 }],
      },
    },
    {
      short: 'markForCheck',
      chapter: 'solution',
      title: 'ChangeDetectorRef: markForCheck() vs detectChanges()',
      body: [
        'When state changes from an asynchronous service or WebSocket outside inputs, call <code>cdr.markForCheck()</code>.',
        '<code>markForCheck()</code> walks up to the root, marking all ancestors as dirty so they will be checked in the next regular tick. In contrast, <code>detectChanges()</code> immediately forces a synchronous render of this component and its children.',
      ],
      callout: {
        kind: 'tip',
        text: 'The AsyncPipe and Signal inputs automatically call markForCheck() internally whenever a new value emits.',
      },
      changes: ['+ WebSocket emitted background data', '+ Invoked cdr.markForCheck()', '+ Path from Root to OnPush component marked dirty'],
      metrics: { strategy: 'OnPush', subtreeStatus: 'Marked for Check', changeTrigger: 'cdr.markForCheck()', skippedBranches: 'Unrelated branches skipped' },
      scene: {
        entities: {
          service: d(-10, 0, { color: 'cyan', glyph: 'clock', label: ['WebSocket Service'], sub: 'Async background event' }),
          cdr: d(0, 0, { color: 'blue', glyph: 'cpu', label: ['cdr.markForCheck()'], sub: 'Marks path to root dirty' }),
          leafView: d(10, 0, { color: 'green', glyph: 'boxes', label: ['LiveTickerComponent'], sub: 'Scheduled for next tick' }),
          zCdr: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'COALESCED MARK FOR CHECK PIPELINE'),
        },
        links: {
          sc: h('service', 'cdr', ['service', 'cdr'], { label: 'stream event' }),
          cl: h('cdr', 'leafView', ['cdr', 'leafView'], { label: 'queue for tick' }),
        },
        flows: [{ route: ['sc', 'cl'], kind: 'bypass', rate: 1.4 }],
      },
    },
  ],
};
