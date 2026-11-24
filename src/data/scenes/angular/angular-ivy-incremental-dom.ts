// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularIvyIncrementalDomLesson = {
  id: 'angular-ivy-incremental-dom',
  title: 'Ivy Compilation & Incremental DOM Architecture',
  summary: 'Explore why Angular chose Incremental DOM over Virtual DOM. Trace how Ivy compiles component templates into executable instructions that mutate the real DOM with zero memory allocations.',
  minutes: 20,
  level: 'advanced',
  metrics: ['compilerTarget', 'vdomAllocation', 'treeShaking', 'memoryFootprint'],
  legend: ['flow', ['code', 'compiled instructions'], ['dom', 'direct DOM mutation']],
  goals: [
    { text: 'Virtual DOM vs Incremental DOM mechanics', step: 1 },
    { text: 'Ivy Template Instruction generation (ɵɵelementStart, ɵɵadvance)', step: 2 },
    { text: 'Tree-shaking and runtime memory optimization', step: 3 },
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
        text: 'Incremental DOM trades diffing flexibility for near-zero runtime memory overhead and extreme tree-shaking capability.',
      },
      metrics: { compilerTarget: 'Incremental DOM', vdomAllocation: '0 Objects', treeShaking: '100% Granular', memoryFootprint: 'Minimal (No VNode Trees)' },
      scene: {
        entities: {
          vdomSide: d(-10, 0, { color: 'amber', glyph: 'package', label: ['Virtual DOM Tree'], sub: 'VNode allocations on render' }),
          diffEngine: d(0, 0, { color: 'purple', glyph: 'boxes', label: ['Diffing Engine'], sub: 'Tree reconciliation' }),
          domPatch: d(10, 0, { color: 'green', glyph: 'terminal', label: ['DOM Updates'], sub: 'Batch commits' }),
          zArch: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'CONVENTIONAL VIRTUAL DOM PIPELINE'),
        },
        links: {
          vd: h('vdomSide', 'diffEngine', ['vdomSide', 'diffEngine'], { label: 'allocate new tree' }),
          dp: h('diffEngine', 'domPatch', ['diffEngine', 'domPatch'], { label: 'patch diffs' }),
        },
        flows: [{ route: ['vd', 'dp'], kind: 'code', rate: 1.4 }],
      },
    },
    {
      short: 'Ivy Instructions',
      chapter: 'execution',
      title: 'Ivy Instructions Execution: Creation vs Update Block',
      body: [
        'An Angular template compiles into a component definition function with two distinct modes: <code>RenderFlags.Create (1)</code> and <code>RenderFlags.Update (2)</code>.',
        'During creation, instructions like <code>ɵɵelementStart()</code> create elements. During updates, <code>ɵɵadvance()</code> navigates the pointer and <code>ɵɵtextInterpolate()</code> updates text if changed.',
      ],
      callout: {
        kind: 'tip',
        text: 'Because instructions are individual function imports, unused features (e.g. pipes, animations) are completely stripped by bundlers (tree-shaking).',
      },
      changes: ['+ Compiler emitted ɵɵelementStart and ɵɵadvance', '+ Segregated Create vs Update render passes', '+ Direct pointer navigation on LView (Logical View)'],
      metrics: { compilerTarget: 'Ivy Instructions', vdomAllocation: '0 Objects', treeShaking: 'Active', memoryFootprint: 'LView Array Reference' },
      scene: {
        entities: {
          template: d(-10, 0, { color: 'blue', glyph: 'terminal', label: ['<h1>{{ title }}</h1>'], sub: 'Component Template' }),
          instructions: d(0, 0, { color: 'purple', glyph: 'cpu', label: ['ɵɵadvance(1)'], sub: 'ɵɵtextInterpolate(ctx.title)' }),
          realDom: d(10, 0, { color: 'green', glyph: 'boxes', label: ['Native HTMLHeadingElement'], sub: 'Direct textContent write' }),
          zIvy: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'IVY INCREMENTAL EXECUTION'),
        },
        links: {
          ti: h('template', 'instructions', ['template', 'instructions'], { label: 'compiled code' }),
          ir: h('instructions', 'realDom', ['instructions', 'realDom'], { label: 'in-place mutate' }),
        },
        flows: [{ route: ['ti', 'ir'], kind: 'dom', rate: 1.6 }],
      },
    },
    {
      short: 'LView & TView',
      chapter: 'solution',
      title: 'Memory Optimization: TView (Blueprint) vs LView (Data)',
      body: [
        'Ivy separates template structure from component instances: <b>TView (Template View)</b> stores shared static blueprints (node tags, bindings, DI offsets) once.',
        'Each component instance allocates a lightweight array called <b>LView (Logical View)</b> storing only instance values and DOM element pointers.',
      ],
      callout: {
        kind: 'insight',
        text: 'Rendering 1,000 instances of a component shares 1 TView and creates 1,000 flat LView arrays, avoiding thousands of object property lookups.',
      },
      changes: ['+ TView shared statically across all instances', '+ LView initialized as flat indexed array', '+ Instant O(1) index access during change detection'],
      metrics: { compilerTarget: 'TView / LView Separation', vdomAllocation: '0 Objects', treeShaking: 'Optimal', memoryFootprint: 'Flat Array per View' },
      scene: {
        entities: {
          tview: d(-10, 0, { color: 'cyan', glyph: 'package', label: ['TView (Singleton)'], sub: 'Static tags, bindings metadata' }),
          lview1: d(4, -4, { color: 'green', glyph: 'database', label: ['LView Instance 1'], sub: '[comp, domNode, value1]' }),
          lview2: d(4, 4, { color: 'green', glyph: 'database', label: ['LView Instance 2'], sub: '[comp, domNode, value2]' }),
          zMemory: x({ x0: -12, x1: 12, y0: -7, y1: 7 }, 'ZERO-ALLOCATION MEMORY MODEL'),
        },
        links: {
          tl1: h('tview', 'lview1', ['tview', 'lview1'], { label: 'shares blueprint' }),
          tl2: h('tview', 'lview2', ['tview', 'lview2'], { label: 'shares blueprint' }),
        },
        flows: [{ route: ['tl1', 'tl2'], kind: 'dom', rate: 1.2 }],
      },
    },
  ],
};
