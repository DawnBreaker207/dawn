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

export const angularIvyIncrementalDomLesson = {
  id: 'angular-ivy-incremental-dom',
  title: 'Ivy Incremental DOM vs VDOM',
  summary: 'Explore why Angular chose Incremental DOM over Virtual DOM. Trace how Ivy compiles component templates into executable instructions that mutate the real DOM with zero memory allocations.',
  minutes: 25,
  level: 'advanced',
  metrics: ['compilerTarget', 'vdomAllocation', 'treeShaking', 'memoryFootprint'],
  legend: ['flow', ['code', 'compiled instructions'], ['dom', 'direct DOM mutation'], ['clean', 'zero GC pressure']],
  goals: [
    { text: 'Virtual DOM vs Incremental DOM: memory allocation differences', step: 1 },
    { text: 'Ivy Template Instruction generation: ɵɵelementStart and ɵɵtext', step: 2 },
    { text: 'Creation vs Update modes: the RenderFlags (rf & 1 vs rf & 2) gate', step: 3 },
    { text: 'In-place slot mutation: ɵɵadvance and ɵɵtextInterpolate', step: 4 },
    { text: 'Tree-shaking renderer instructions: stripping unused Ivy opcodes', step: 5 },
    { text: 'Zero-allocation garbage collection efficiency under high churn', step: 6 },
  ],
  steps: [
    {
      short: 'VDOM vs iDOM',
      chapter: 'concept',
      title: 'Architectural Difference: Virtual DOM vs Incremental DOM',
      body: [
        'Virtual DOM frameworks (React, Vue) instantiate an in-memory JS tree of nodes on every render, then diff the new tree against the old tree to calculate DOM patches.',
        'Angular Ivy uses <b>Incremental DOM</b>: templates compile directly into a series of imperative instructions that walk the real DOM in place, mutating changed attributes without creating intermediate JS objects.',
      ],
      callout: {
        kind: 'insight',
        text: 'Incremental DOM trades diffing speed for dramatically reduced memory consumption and superior mobile device performance.',
      },
      metrics: { compilerTarget: 'Incremental DOM', vdomAllocation: '0 objects / tick', treeShaking: '100% Tree-shakable', memoryFootprint: 'Ultra low' },
      scene: {
        entities: {
          templateAst: y(-16, -6, { label: 'Template', tags: [{ text: 'HTML AST', tone: 'blue', icon: 'zap' }] }),
          ivyCompiler: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Ivy Compiler'], sub: 'ngtsc compiler' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'VDOM vs iDOM Architecture', [
            `Virtual DOM (React):`,
            `  render() -> generates JS VNode objects -> diff trees -> patch DOM`,
            `  Memory: Allocates new objects on every render cycle.`,
            ``,
            `Incremental DOM (Angular Ivy):`,
            `  template() -> executes imperative instructions -> mutates DOM in place`,
            `  Memory: Zero intermediate JS objects allocated!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ti: h('templateAst', 'ivyCompiler', ['templateAst', 'ivyCompiler'], { label: 'compile template' }),
        },
        flows: [{ route: ['ti'], kind: 'code', rate: 1.5 }],
      },
    },
    {
      short: 'Ivy Instructions',
      chapter: 'concept',
      title: 'Ivy Template Instructions: ɵɵelementStart & ɵɵtext',
      body: [
        'When <code>ngtsc</code> compiles <code>&lt;h1 class="heading"&gt;{{ title }}&lt;/h1&gt;</code>, it outputs a static function <code>template(rf, ctx)</code> on the component definition <code>ɵcmp</code>.',
        'Instructions like <code>ɵɵelementStart(0, \'h1\', 0)</code>, <code>ɵɵtext(1)</code>, and <code>ɵɵelementEnd()</code> are standard exported TypeScript functions from <code>@angular/core</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Because instructions are exported functions, bundlers drop any instructions your application doesn’t use (e.g. ɵɵpipe or ɵɵlistener).',
      },
      changes: ['+ Static ɵcmp.template function emitted by compiler', '+ Template tags mapped to ɵɵelementStart instructions'],
      metrics: { compilerTarget: 'Static Function', vdomAllocation: '0 objects', treeShaking: 'Functional opcodes', memoryFootprint: 'Minimal' },
      scene: {
        entities: {
          templateAst: y(-16, -6, { label: 'Template', tags: [{ text: 'HTML AST', tone: 'blue', icon: 'zap' }] }),
          ivyCompiler: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Ivy Compiler'], sub: 'ngtsc compiler' }),
          instructions: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['ɵcmp.template'], sub: 'executable ops' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Compiled Ivy Template Function', [
            `function AppComponent_Template(rf, ctx) {`,
            `  if (rf & 1) { // Creation Mode`,
            `    ɵɵelementStart(0, "h1");`,
            `    ɵɵtext(1);`,
            `    ɵɵelementEnd();`,
            `  }`,
            `  if (rf & 2) { // Update Mode`,
            `    ɵɵadvance(1);`,
            `    ɵɵtextInterpolate(ctx.title);`,
            `  }`,
            `}`,
          ], { icon: 'terminal' }),
        },
        links: {
          ti: h('templateAst', 'ivyCompiler', ['templateAst', 'ivyCompiler'], { label: 'parse HTML tokens' }),
          ii: h('ivyCompiler', 'instructions', ['ivyCompiler', 'instructions'], { label: 'emit opcodes' }),
        },
        flows: [{ route: ['ti', 'ii'], kind: 'code', rate: 1.5 }],
      },
    },
    {
      short: 'RenderFlags Gate',
      chapter: 'execution',
      title: 'RenderFlags: Creation (rf & 1) vs Update (rf & 2)',
      body: [
        'Notice the <code>rf</code> (RenderFlags) bitmask parameter:',
        '<code>rf & 1</code> (<b>Create</b>): Runs once on component mount. Creates DOM elements, registers event listeners, and sets static attributes.',
        '<code>rf & 2</code> (<b>Update</b>): Runs on every change detection cycle. Skips element creation and evaluates only dynamic bindings.',
      ],
      callout: {
        kind: 'insight',
        text: 'The bitmask branch means Angular spends zero CPU cycles checking whether an element already exists; it branches straight to update logic.',
      },
      changes: ['+ Single function handles both mount and updates', '+ Bitmask gating eliminates branching overhead'],
      metrics: { compilerTarget: 'Bitmask Branching', vdomAllocation: '0 objects', treeShaking: 'Active', memoryFootprint: 'Zero branch waste' },
      scene: {
        entities: {
          ivyCompiler: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Ivy Compiler'], sub: 'ngtsc compiler' }),
          instructions: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['RenderFlags'], sub: 'rf bitmask' }),
          realDomNode: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Update Branch'], sub: 'dynamic pass' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'RenderFlags Bitmask Logic', [
            `enum RenderFlags {`,
            `  Create = 1 << 0, // 1 (binary 01)`,
            `  Update = 1 << 1  // 2 (binary 10)`,
            `}`,
            `// On first render: rf = 3 (Create | Update)`,
            `// On subsequent change detection: rf = 2 (Update only)`,
            `= Zero element re-creation overhead during CD`,
          ], { icon: 'terminal' }),
        },
        links: {
          ii: h('ivyCompiler', 'instructions', ['ivyCompiler', 'instructions'], { label: 'emit bitmask' }),
          ir: h('instructions', 'realDomNode', ['instructions', 'realDomNode'], { label: 'execute update pass' }),
        },
        flows: [{ route: ['ii', 'ir'], kind: 'code', rate: 1.5 }],
      },
    },
    {
      short: 'In-Place Mutation',
      chapter: 'execution',
      title: 'In-Place Slot Mutation (ɵɵadvance & ɵɵtextInterpolate)',
      body: [
        'During the update pass (<code>rf & 2</code>), Ivy moves its internal slot pointer using <code>ɵɵadvance(1)</code> to point to slot 1 (the text node).',
        'Then <code>ɵɵtextInterpolate(ctx.title)</code> compares the new title string to the previous value stored in the view slot. If changed, it updates <code>textNode.data = ctx.title</code> directly.',
      ],
      callout: {
        kind: 'tip',
        text: 'The view state (LView) is simply an array of slots holding references to real DOM elements and their previous property values.',
      },
      changes: ['+ Slot pointer advanced to text node', '+ textNode.data updated with zero allocations'],
      metrics: { compilerTarget: 'Slot Array (LView)', vdomAllocation: '0 objects', treeShaking: 'In-place write', memoryFootprint: 'Flat Array' },
      scene: {
        entities: {
          instructions: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['ɵɵadvance(1)'], sub: 'slot pointer' }),
          realDomNode: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Real DOM H1'], sub: 'in-place write' }),
          flatHeapProfile: d(-4, 8, { s: 4.8, h: 52, color: 'green', glyph: 'cpu', label: ['LView Slots'], sub: 'slot array' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Slot Mutation Mechanics', [
            `LView array at runtime:`,
            `  LView[0] = HTMLHeadingElement (<h1>)`,
            `  LView[1] = TextNode ("Hello World")`,
            `  LView[2] = PreviousValue ("Hello World")`,
            `Check: "Hello DeepMind" !== LView[2] -> TRUE`,
            `Action: LView[1].data = "Hello DeepMind"; LView[2] = "Hello DeepMind"`,
            `= In-place mutation with zero intermediate objects!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ir: h('instructions', 'realDomNode', ['instructions', 'realDomNode'], { label: 'select slot' }),
          rf: h('realDomNode', 'flatHeapProfile', ['realDomNode', 'flatHeapProfile'], { label: 'write native property' }),
        },
        flows: [{ route: ['ir', 'rf'], kind: 'dom', rate: 1.5 }],
      },
    },
    {
      short: 'Tree-Shaking Opcodes',
      chapter: 'scaling',
      title: 'Tree-Shaking Renderer Instructions',
      body: [
        'In legacy View Engine, the entire compiler runtime was bundled into your app. If you used one template, you bundled support for all template features.',
        'In Ivy, every instruction (e.g. <code>ɵɵpipe</code>, <code>ɵɵproperty</code>, <code>ɵɵlistener</code>) is an independent export. If your app never uses pipes, <code>ɵɵpipe</code> is omitted from the bundle entirely.',
      ],
      callout: {
        kind: 'insight',
        text: 'This fine-grained opcode tree-shaking allowed Angular hello-world bundle sizes to shrink from ~150KB to under 15KB.',
      },
      changes: ['+ Unused renderer opcodes stripped by bundler', '+ Framework runtime footprint minimized'],
      metrics: { compilerTarget: 'Tree-Shaken Opcodes', vdomAllocation: '0 objects', treeShaking: '100% Stripped', memoryFootprint: '14 KB baseline' },
      scene: {
        entities: {
          instructions: d(8, -6, { s: 4.8, h: 52, color: 'cyan', glyph: 'package', label: ['Ivy Opcodes'], sub: 'exported fns' }),
          realDomNode: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Used Opcodes'], sub: 'element, text' }),
          leanFramework: d(-16, 8, { s: 4.8, h: 52, color: 'green', glyph: 'package', label: ['Lean Runtime'], sub: 'tree-shaken' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Opcode Tree-Shaking Output', [
            `@angular/core export inventory:`,
            `  [USED]     ɵɵelementStart`,
            `  [USED]     ɵɵtext`,
            `  [USED]     ɵɵadvance`,
            `  [STRIPPED] ɵɵpipe (Not used in this app)`,
            `  [STRIPPED] ɵɵi18n (Not used in this app)`,
            `= Unused framework features never reach users`,
          ], { icon: 'terminal' }),
        },
        links: {
          ni: h('instructions', 'realDomNode', ['instructions', 'realDomNode'], { label: 'analyze references' }),
          rl: h('realDomNode', 'leanFramework', ['realDomNode', 'leanFramework'], { label: 'bundle used only' }),
        },
        flows: [{ route: ['ni', 'rl'], kind: 'code', rate: 1.6 }],
      },
    },
    {
      short: 'Zero GC Churn',
      chapter: 'scaling',
      title: 'Zero-Allocation Garbage Collection Efficiency',
      body: [
        'During high-frequency animation loops or real-time trading dashboards updating 60 times a second, Virtual DOM frameworks generate thousands of temporary objects, triggering browser Garbage Collection (GC) pauses.',
        'Ivy’s Incremental DOM executes in-place writes to existing LView slots and real DOM nodes, generating <b>zero new JS heap allocations</b> and eliminating GC frame drops.',
      ],
      callout: {
        kind: 'tip',
        text: 'Zero GC pause makes Angular exceptionally well-suited for high-throughput enterprise charts, data grids, and telemetry monitoring.',
      },
      changes: ['+ Zero heap objects allocated per update cycle', '+ Smooth 60fps frame rate without GC stutter'],
      metrics: { compilerTarget: 'Production Ivy', vdomAllocation: '0 KB churn', treeShaking: 'Optimal', memoryFootprint: 'Flat Memory Line' },
      scene: {
        entities: {
          templateAst: y(-16, -6, { label: 'WebSocket', tags: [{ text: '60Hz stream', tone: 'blue', icon: 'zap' }] }),
          ivyCompiler: d(-4, -6, { s: 4.8, h: 52, color: 'purple', glyph: 'cpu', label: ['Ivy Runtime'], sub: 'slot mutate' }),
          realDomNode: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Real DOM H1'], sub: 'in-place write' }),
          flatHeapProfile: d(-4, 8, { s: 4.8, h: 52, color: 'green', glyph: 'cpu', label: ['Zero GC Pauses'], sub: 'zero GC pause' }),
          leanFramework: d(-16, 8, { s: 4.8, h: 52, color: 'green', glyph: 'package', label: ['Lean Runtime'], sub: 'tree-shaken' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Memory Profiler Timeline', [
            `Browser DevTools Memory Timeline (60 seconds):`,
            `  Virtual DOM: Sawtooth pattern (allocating 50MB -> GC freeze 30ms)`,
            `  Incremental DOM: Flat line (0MB churn -> zero GC freezes)`,
            `= 60 frames per second locked without jitter`,
          ], { icon: 'terminal' }),
        },
        links: {
          ti: h('templateAst', 'ivyCompiler', ['templateAst', 'ivyCompiler'], { label: '60Hz data push' }),
          ir: h('ivyCompiler', 'realDomNode', ['ivyCompiler', 'realDomNode'], { label: 'in-place mutate' }),
          rf: h('realDomNode', 'flatHeapProfile', ['realDomNode', 'flatHeapProfile'], { label: 'zero allocation' }),
        },
        flows: [{ route: ['ti', 'ir', 'rf'], kind: 'clean', rate: 1.6 }],
      },
    },
  ],
};
