// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const angularModulesStandaloneLesson = {
  id: 'angular-modules-standalone',
  title: 'NgModules vs Standalone Architecture & Tree-Shaking',
  summary: 'Architectural shift in Angular: comparing monolithic NgModule compilation contexts with modern Standalone Components, simplified imports, and superior tree-shaking.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['architectureModel', 'compilationContext', 'bundleSize', 'treeShakingEfficiency'],
  legend: ['module', ['standalone', 'direct component import'], ['deadCode', 'pruned by rollup/esbuild']],
  goals: [
    { text: 'The NgModule compilation context: declarations, imports, and exports', step: 1 },
    { text: 'The problem of bloated shared modules: transitive dependency leakage', step: 2 },
    { text: 'Standalone Components: standalone: true and direct component-to-component imports', step: 3 },
  ],
  steps: [
    {
      short: 'NgModule Era',
      chapter: 'setup',
      title: 'The NgModule Compilation Bubble',
      body: [
        'Traditionally, Angular components could not exist alone. They had to be declared inside an <code>@NgModule({ declarations: [...] })</code>.',
        'To use a button or date pipe, the component had to inherit it from an imported module. Teams often created a massive <code>SharedModule</code> that imported everything, inadvertently bundling mega-libraries across the entire app.',
      ],
      callout: {
        kind: 'warn',
        text: 'SharedModule creates monolithic compilation bubbles, making fine-grained tree-shaking nearly impossible.',
      },
      metrics: { architectureModel: 'NgModule', compilationContext: 'SharedModule (Monolithic)', bundleSize: '1.4 MB', treeShakingEfficiency: 'Low' },
      scene: {
        entities: {
          mod: d(0, 0, { s: 5.5, color: 'purple', glyph: 'package', label: ['SharedModule'], sub: 'exports 40 components + 15 pipes' }),
          compA: d(-10, 0, { color: 'slab', glyph: 'boxes', label: ['UserCardComponent'], sub: 'needs only 1 button' }),
          compB: d(10, 0, { color: 'slab', glyph: 'boxes', label: ['SettingsComponent'], sub: 'needs only 1 toggle' }),
          zMod: x({ x0: -4, x1: 4, y0: -6, y1: 6 }, 'NGMODULE BOUNDARY'),
        },
        links: {
          am: h('compA', 'mod', ['compA', 'mod'], { label: 'imports all' }),
          bm: h('compB', 'mod', ['compB', 'mod'], { label: 'imports all' }),
        },
        flows: [{ route: ['am', 'bm'], kind: 'module', rate: 1.2 }],
      },
    },
    {
      short: 'Standalone Shift',
      chapter: 'solution',
      title: 'Standalone Components: Direct Dependency Injection',
      body: [
        'Standalone components specify their dependencies directly: <code>@Component({ standalone: true, imports: [ButtonComponent, DatePipe] })</code>.',
        'There are zero intermediate module wrappers. ESBuild and Rollup can trace the exact dependency graph with 100% precision, stripping away all unused exports (Tree-Shaking) and reducing bundle sizes dramatically.',
      ],
      callout: {
        kind: 'insight',
        text: 'Standalone makes Angular components self-contained, easily testable in isolation, and naturally lazy-loadable via loadComponent().',
      },
      changes: ['− SharedModule eliminated', '+ Components declare only exact dependencies', '+ 42% bundle size reduction via tree-shaking'],
      metrics: { architectureModel: 'Standalone (Modern)', compilationContext: 'Component-Scoped', bundleSize: '480 KB (-65%)', treeShakingEfficiency: 'Maximum' },
      scene: {
        entities: {
          card: d(-6, 0, { color: 'red', glyph: 'boxes', label: ['UserCardComponent'], sub: 'standalone: true' }),
          btn: d(6, -4, { color: 'green', glyph: 'terminal', label: ['ButtonComponent'], sub: 'direct import' }),
          pipe: d(6, 4, { color: 'green', glyph: 'terminal', label: ['DatePipe'], sub: 'direct import' }),
        },
        links: {
          cb: h('card', 'btn', ['card', 'btn'], { label: 'imports: [Button]' }),
          cp: h('card', 'pipe', ['card', 'pipe'], { label: 'imports: [DatePipe]' }),
        },
        flows: [
          { route: ['cb'], kind: 'standalone', rate: 1.5 },
          { route: ['cp'], kind: 'standalone', rate: 1.5 },
        ],
      },
    },
  ],
};
