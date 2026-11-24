// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularControlFlowLesson = {
  id: 'angular-control-flow',
  title: 'Built-in Control Flow (@if, @for, @switch) & Track Mechanics',
  summary: 'Examine the new Angular template syntax. Compare built-in control flow (@if, @for, @switch) with legacy structural directives (*ngIf, *ngFor), and master how mandatory track expressions prevent DOM thrashing.',
  minutes: 20,
  level: 'intermediate',
  metrics: ['syntaxKind', 'directiveOverhead', 'trackByStrategy', 'domRecreation'],
  legend: ['flow', ['template', 'template compilation'], ['dom', 'DOM node diff & reuse']],
  goals: [
    { text: 'Built-in blocks (@if, @for, @switch) vs Structural Directives', step: 1 },
    { text: 'Compiler ergonomics: zero imports, type narrowing & aliasing', step: 2 },
    { text: 'Mandatory track expressions and DOM node recycling', step: 3 },
  ],
  steps: [
    {
      short: 'Built-in vs *ngFor',
      chapter: 'concept',
      title: 'Structural Directives Overhead vs Built-in Blocks',
      body: [
        'Historically, conditional rendering and iteration used structural directives like <code>*ngIf</code> and <code>*ngFor</code>.',
        'These required importing <code>CommonModule</code> or <code>NgForOf</code> class, created heavy <code><ng-template></code> wrapper contexts, and allocated <code>NgForOfContext</code> instances on every iteration.',
        'The new <b>Built-in Control Flow</b> (<code>@if</code>, <code>@for</code>, <code>@switch</code>) is part of the Angular template compiler directly, requiring zero imports.',
      ],
      callout: {
        kind: 'insight',
        text: 'Built-in control flow generates simpler, tighter JavaScript instructions, reducing template bytecode size by up to 25%.',
      },
      metrics: { syntaxKind: 'Built-in @for / @if', directiveOverhead: '0 Classes / 0 Imports', trackByStrategy: 'Native Expression', domRecreation: 'Minimized' },
      scene: {
        entities: {
          legacy: d(-10, 0, { color: 'amber', glyph: 'package', label: ['*ngFor="let item of list"'], sub: 'Requires NgForOf, Context class' }),
          compiler: d(0, 0, { color: 'purple', glyph: 'cpu', label: ['Template Compiler'], sub: 'Parses @for block natively' }),
          builtin: d(10, 0, { color: 'green', glyph: 'terminal', label: ['@for (item of list; track item.id)'], sub: 'Inlined loop instructions' }),
          zFlow: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'CONTROL FLOW COMPILATION ARCHITECTURE'),
        },
        links: {
          lc: h('legacy', 'compiler', ['legacy', 'compiler'], { label: 'structural overhead' }),
          cb: h('compiler', 'builtin', ['compiler', 'builtin'], { label: 'optimized opcode' }),
        },
        flows: [{ route: ['lc', 'cb'], kind: 'template', rate: 1.4 }],
      },
    },
    {
      short: 'Type Narrowing',
      chapter: 'features',
      title: 'Strict Type Narrowing & @empty Blocks',
      body: [
        'The <code>@if</code> block supports native TypeScript type narrowing out of the box (e.g. <code>@if (user(); as u) { u.name }</code>).',
        'The <code>@for</code> block includes a built-in <code>@empty</code> fallback block that automatically renders whenever the collection is empty, without requiring a secondary <code>*ngIf="items.length === 0"</code> element.',
      ],
      callout: {
        kind: 'tip',
        text: '@empty prevents empty state layout flashes and eliminates duplicate boolean checks in templates.',
      },
      changes: ['+ Implemented @for with @empty fallback', '+ TypeScript narrowed nullable signal in @if block', '+ Zero CommonModule imports required'],
      metrics: { syntaxKind: '@for ... @empty', directiveOverhead: 'Zero', trackByStrategy: 'Enforced', domRecreation: '0 (Clean fallback)' },
      scene: {
        entities: {
          collection: d(-10, 0, { color: 'blue', glyph: 'database', label: ['items = signal([])'], sub: 'Empty array' }),
          forLoop: d(0, 0, { color: 'purple', glyph: 'boxes', label: ['@for Loop'], sub: 'Detects items.length === 0' }),
          emptyBlock: d(10, 0, { color: 'green', glyph: 'terminal', label: ['@empty Block'], sub: 'Renders "No records found"' }),
          zEmpty: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'BUILT-IN FALLBACK MECHANICS'),
        },
        links: {
          cf: h('collection', 'forLoop', ['collection', 'forLoop'], { label: 'evaluate length' }),
          fe: h('forLoop', 'emptyBlock', ['forLoop', 'emptyBlock'], { label: 'switch branch' }),
        },
        flows: [{ route: ['cf', 'fe'], kind: 'template', rate: 1.5 }],
      },
    },
    {
      short: 'Mandatory Track',
      chapter: 'solution',
      title: 'Mandatory Track Expressions & DOM Node Recycling',
      body: [
        'In legacy <code>*ngFor</code>, forgetting <code>trackBy</code> caused Angular to destroy and re-create every DOM node in the list whenever items changed order or refetched from an API.',
        'In <code>@for</code>, the <code>track</code> expression is <b>mandatory</b> at compile time. Angular tracks items by unique identity (e.g. <code>track item.id</code>), moving existing DOM nodes via <code>Node.insertBefore</code> instead of tearing them down.',
      ],
      callout: {
        kind: 'caution',
        text: 'Never use track $index unless the array is strictly static. Using $index on dynamic lists breaks animations and input focus.',
      },
      changes: ['+ Enforced track item.id at compile time', '+ Reordered array of 1,000 items', '+ Reused 100% of existing DOM nodes via insertBefore'],
      metrics: { syntaxKind: 'track item.id', directiveOverhead: 'Zero', trackByStrategy: 'Unique Key Identity', domRecreation: '0 Destroyed (100% Recycled)' },
      scene: {
        entities: {
          reordered: d(-10, 0, { color: 'amber', glyph: 'database', label: ['Reordered List'], sub: '[id: 3, id: 1, id: 2]' }),
          trackEngine: d(0, 0, { color: 'blue', glyph: 'shield', label: ['Track Map Diff'], sub: 'Matches id key in DOM map' }),
          domRecycle: d(10, 0, { color: 'green', glyph: 'boxes', label: ['DOM Recycling'], sub: 'Node.insertBefore (0 destroy)' }),
          zRecycle: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'DOM RECYCLING & MORPHING'),
        },
        links: {
          rt: h('reordered', 'trackEngine', ['reordered', 'trackEngine'], { label: 'compare keys' }),
          td: h('trackEngine', 'domRecycle', ['trackEngine', 'domRecycle'], { label: 'reposition pointers' }),
        },
        flows: [{ route: ['rt', 'td'], kind: 'dom', rate: 1.8 }],
      },
    },
  ],
};
