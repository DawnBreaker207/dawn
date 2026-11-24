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

export const angularControlFlowLesson = {
  id: 'angular-control-flow',
  title: 'Built-in Control Flow (@if, @for, @switch) & Track Mechanics',
  summary: 'Examine the new Angular template syntax. Compare built-in control flow (@if, @for, @switch) with legacy structural directives (*ngIf, *ngFor), and master how mandatory track expressions prevent DOM thrashing.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['syntaxKind', 'directiveOverhead', 'trackByStrategy', 'domRecreation'],
  legend: ['flow', ['template', 'template compilation'], ['dom', 'DOM node diff & reuse'], ['track', 'track expression match'], ['empty', 'empty state']],
  goals: [
    { text: 'Built-in blocks (@if, @for, @switch) vs legacy structural directives', step: 1 },
    { text: 'Type narrowing & aliasing with @if (user(); as u)', step: 2 },
    { text: 'Built-in @for with mandatory track expressions for DOM node reuse', step: 3 },
    { text: 'Built-in @empty block: declarative zero-item empty states', step: 4 },
    { text: 'Type-safe multi-branch matching with @switch and @case', step: 5 },
    { text: 'Automated migration with ng generate @angular/core:control-flow', step: 6 },
  ],
  steps: [
    {
      short: 'Built-in vs *ngIf',
      chapter: 'concept',
      title: 'Structural Directives Overhead vs Built-in Blocks',
      body: [
        'Historically, conditional rendering and iteration used structural directives like <code>*ngIf</code> and <code>*ngFor</code>.',
        'These required importing <code>CommonModule</code>, created heavy <code>&lt;ng-template&gt;</code> wrapper views, and allocated directive context instances on every loop.',
        'The new <b>Built-in Control Flow</b> (<code>@if</code>, <code>@for</code>, <code>@switch</code>) is part of the Angular template compiler directly, requiring zero module imports.',
      ],
      callout: {
        kind: 'insight',
        text: 'Built-in control flow compiles directly into lightweight Ivy branching instructions (ɵɵconditional), dropping runtime overhead.',
      },
      metrics: { syntaxKind: 'Built-in @if', directiveOverhead: '0 (Built-in)', trackByStrategy: 'Native', domRecreation: 'Minimized' },
      scene: {
        entities: {
          templateSource: y(-16, -6, { label: '@if block', tags: [{ text: 'Built-in AST', tone: 'blue', icon: 'zap' }] }),
          compilerCore: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Ivy Compiler'], sub: 'conditional op' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Built-in @if vs *ngIf', [
            `// Legacy Structural Directive (*ngIf):`,
            `<div *ngIf="isLoggedIn; else guest">Hello User</div>`,
            `<ng-template #guest>Hello Guest</ng-template>`,
            ``,
            `// Modern Built-in Control Flow (@if / @else):`,
            `@if (isLoggedIn()) {`,
            `  <div>Hello User</div>`,
            `} @else {`,
            `  <div>Hello Guest</div>`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          tc: h('templateSource', 'compilerCore', ['templateSource', 'compilerCore'], { label: 'parse control block' }),
        },
        flows: [{ route: ['tc'], kind: 'template', rate: 1.5 }],
      },
    },
    {
      short: 'Type Narrowing',
      chapter: 'concept',
      title: 'Template Type Narrowing & Aliasing (@if as u)',
      body: [
        'With <code>@if (user(); as u)</code>, the TypeScript template type checker automatically <b>narrows the type of u</b> inside the block.',
        'If <code>user()</code> returns <code>User | null</code>, inside the <code>@if</code> block <code>u</code> is guaranteed to be <code>User</code> (non-nullable), enabling safe property access (<code>u.email</code>) without non-null assertions.',
      ],
      callout: {
        kind: 'tip',
        text: 'The alias syntax stores the signal value in a local template variable, preventing multiple signal reads.',
      },
      changes: ['+ Type narrowing active in template block', '+ Non-null assertions eliminated from expressions'],
      metrics: { syntaxKind: 'Type Narrowed', directiveOverhead: '0', trackByStrategy: 'Type Safe', domRecreation: 'Clean' },
      scene: {
        entities: {
          templateSource: y(-16, -6, { label: 'user()', tags: [{ text: 'User | null', tone: 'amber', icon: 'zap' }] }),
          compilerCore: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Type Narrowing'], sub: 'narrow to User' }),
          safeView: d(8, -6, { s: 4.8, h: 52, color: 'green', glyph: 'package', label: ['Safe u.email'], sub: 'type-safe view' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Template Type Narrowing', [
            `@if (currentUser(); as user) {`,
            `  // Inside here, 'user' is narrowed to User (NOT null!):`,
            `  <h1>{{ user.name }}</h1>`,
            `  <p>{{ user.email }}</p>`,
            `} @else {`,
            `  <p>Please log in.</p>`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          tc: h('templateSource', 'compilerCore', ['templateSource', 'compilerCore'], { label: 'pass signal getter' }),
          cs: h('compilerCore', 'safeView', ['compilerCore', 'safeView'], { label: 'narrow type in scope' }),
        },
        flows: [{ route: ['tc', 'cs'], kind: 'template', rate: 1.5 }],
      },
    },
    {
      short: 'Mandatory track',
      chapter: 'execution',
      title: 'Built-in @for with Mandatory track Expression',
      body: [
        'In legacy Angular, developers routinely forgot <code>trackBy</code> in <code>*ngFor</code>, causing Angular to destroy and re-create all DOM nodes whenever an item was added or sorted.',
        'In <code>@for (item of items(); track item.id)</code>, the <code>track</code> expression is <b>mandatory</b>! The compiler enforces unique identity keys, allowing Angular to reorder and reuse existing DOM elements.',
      ],
      callout: {
        kind: 'warning',
        text: 'Never use track $index for dynamic lists that can be reordered or filtered, as it causes input focus and animation bugs.',
      },
      changes: ['+ Compiler enforces mandatory track expression', '+ Existing DOM nodes recycled during array sorting'],
      metrics: { syntaxKind: 'Built-in @for', directiveOverhead: '0', trackByStrategy: 'track item.id', domRecreation: '0 (DOM Recycled)' },
      scene: {
        entities: {
          compilerCore: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['@for Engine'], sub: 'diffs array' }),
          trackMatcher: d(8, -6, { s: 4.8, h: 52, color: 'blue', glyph: 'boxes', label: ['track item.id'], sub: 'key matching' }),
          reusedDom: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Recycled DOM'], sub: 'moved in place' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Mandatory track Syntax', [
            `<ul>`,
            `  @for (item of items(); track item.id; let idx = $index) {`,
            `    <li>{{ idx }}: {{ item.title }}</li>`,
            `  }`,
            `</ul>`,
            `// DOM elements are moved in-place rather than destroyed!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ct: h('compilerCore', 'trackMatcher', ['compilerCore', 'trackMatcher'], { label: 'diff identity keys' }),
          tr: h('trackMatcher', 'reusedDom', ['trackMatcher', 'reusedDom'], { label: 'reorder existing DOM' }),
        },
        flows: [{ route: ['ct', 'tr'], kind: 'track', rate: 1.5 }],
      },
    },
    {
      short: '@empty Block',
      chapter: 'execution',
      title: 'Declarative @empty Block in Lists',
      body: [
        'Displaying an empty state previously required duplicating conditional logic: <code>*ngIf="items.length === 0"</code> placed after an <code>*ngFor</code> loop.',
        'Modern <code>@for</code> includes an integrated <code>@empty</code> block! If the iterated collection is empty, the <code>@empty</code> block automatically renders without extra boolean flags.',
      ],
      callout: {
        kind: 'tip',
        text: 'The @empty block is rendered with zero extra wrapper divs or complex ng-container directives.',
      },
      changes: ['+ @empty block renders automatically when items array is empty', '+ Duplicate length checks eliminated'],
      metrics: { syntaxKind: 'Built-in @empty', directiveOverhead: '0', trackByStrategy: 'Clean', domRecreation: 'Clean empty state' },
      scene: {
        entities: {
          compilerCore: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['@for Engine'], sub: 'items.length 0' }),
          trackMatcher: d(8, -6, { s: 4.8, h: 52, color: 'amber', glyph: 'boxes', label: ['@empty View'], sub: 'empty fallback' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, '@for with @empty Syntax', [
            `@for (item of items(); track item.id) {`,
            `  <app-item-row [item]="item" />`,
            `} @empty {`,
            `  <div class="empty-state">`,
            `    <p>No items found in your cart.</p>`,
            `  </div>`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          ct: h('compilerCore', 'trackMatcher', ['compilerCore', 'trackMatcher'], { label: 'render empty branch' }),
        },
        flows: [{ route: ['ct'], kind: 'empty', rate: 1.5 }],
      },
    },
    {
      short: '@switch Blocks',
      chapter: 'technique',
      title: 'Type-Safe Branching with @switch & @case',
      body: [
        'The built-in <code>@switch</code> block replaces <code>[ngSwitch]</code> and <code>*ngSwitchCase</code> with a syntax familiar to all JavaScript and C developers.',
        'It supports strict type equality checking, eliminates the need for container tags, and provides clean fallbacks via <code>@default</code>.',
      ],
      callout: {
        kind: 'insight',
        text: '@switch compiles into a fast indexed jump table, providing faster branch dispatch than chained if/else blocks.',
      },
      changes: ['+ Multi-branch logic expressed cleanly via @switch', '+ Strict type checking across all @case matches'],
      metrics: { syntaxKind: 'Built-in @switch', directiveOverhead: '0', trackByStrategy: 'Jump Table', domRecreation: 'Targeted' },
      scene: {
        entities: {
          compilerCore: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['@switch Engine'], sub: 'jump table' }),
          trackMatcher: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'boxes', label: ['@case "active"'], sub: 'matched branch' }),
          reusedDom: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Active Badge'], sub: 'green badge' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, '@switch Syntax Example', [
            `@switch (orderStatus()) {`,
            `  @case ('pending') { <span class="badge yellow">Pending</span> }`,
            `  @case ('active')  { <span class="badge green">Active</span> }`,
            `  @case ('shipped') { <span class="badge blue">Shipped</span> }`,
            `  @default          { <span class="badge gray">Unknown</span> }`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          ct: h('compilerCore', 'trackMatcher', ['compilerCore', 'trackMatcher'], { label: 'evaluate jump table' }),
          tr: h('trackMatcher', 'reusedDom', ['trackMatcher', 'reusedDom'], { label: 'mount case view' }),
        },
        flows: [{ route: ['ct', 'tr'], kind: 'template', rate: 1.5 }],
      },
    },
    {
      short: 'CLI Migration',
      chapter: 'scaling',
      title: 'Automated Migration with Angular CLI Schematics',
      body: [
        'Migrating thousands of legacy <code>*ngIf</code> and <code>*ngFor</code> templates across an enterprise monorepo is automated via the official CLI schematic:',
        '<code>ng generate @angular/core:control-flow</code> parses all template HTML files, converts structural directives to <code>@if</code> and <code>@for</code>, and infers <code>track</code> expressions automatically.',
      ],
      callout: {
        kind: 'tip',
        text: 'The schematic supports dry-run mode (ng generate @angular/core:control-flow --dry-run) to inspect changes before committing.',
      },
      changes: ['+ All templates converted to modern control flow', '+ CommonModule imports safely removed from standalone components'],
      metrics: { syntaxKind: 'Fully Migrated', directiveOverhead: '0 (Clean)', trackByStrategy: 'Automated', domRecreation: 'Optimized' },
      scene: {
        entities: {
          templateSource: y(-16, -6, { label: 'ng generate', tags: [{ text: 'control-flow', tone: 'green', icon: 'zap' }] }),
          compilerCore: d(-4, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'cpu', label: ['HTML AST Engine'], sub: 'replaces *ngIf' }),
          modernCodebase: d(8, -6, { s: 4.8, h: 52, color: 'green', glyph: 'package', label: ['Modern HTML'], sub: '100% control' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Control Flow Migration CLI', [
            `$ ng generate @angular/core:control-flow`,
            `UPDATE src/app/order/order.component.html (converted 14 blocks)`,
            `UPDATE src/app/user/user.component.html (converted 8 blocks)`,
            `UPDATE src/app/feed/feed.component.html (added @empty)`,
            `Migration complete: 240 template blocks updated automatically.`,
          ], { icon: 'terminal' }),
        },
        links: {
          tc: h('templateSource', 'compilerCore', ['templateSource', 'compilerCore'], { label: 'parse templates' }),
          cm: h('compilerCore', 'modernCodebase', ['compilerCore', 'modernCodebase'], { label: 'emit modern syntax' }),
        },
        flows: [{ route: ['tc', 'cm'], kind: 'template', rate: 1.6 }],
      },
    },
  ],
};
