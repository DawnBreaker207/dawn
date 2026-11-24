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

export const angularModulesStandaloneLesson = {
  id: 'angular-modules-standalone',
  title: 'NgModules vs Standalone Architecture & Tree-Shaking',
  summary: 'Architectural shift in Angular: comparing monolithic NgModule compilation contexts with modern Standalone Components, simplified imports, and superior tree-shaking.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['architectureModel', 'compilationContext', 'bundleSize', 'treeShakingEfficiency'],
  legend: ['module', ['standalone', 'direct component import'], ['deadCode', 'pruned by bundler'], ['shake', 'tree-shaking']],
  goals: [
    { text: 'The NgModule compilation context: declarations, imports, and exports', step: 1 },
    { text: 'The problem of bloated SharedModules: transitive dependency leakage', step: 2 },
    { text: 'Standalone Components: standalone: true and direct component imports', step: 3 },
    { text: 'Tree-shaking mechanics: how ESBuild and Rollup prune unused code', step: 4 },
    { text: 'Migration with automated Angular CLI schematics', step: 5 },
    { text: 'Modern bootstrap without AppModule: bootstrapApplication', step: 6 },
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
        kind: 'warning',
        text: 'SharedModule creates monolithic compilation bubbles, making fine-grained tree-shaking nearly impossible.',
      },
      metrics: { architectureModel: 'NgModule', compilationContext: 'SharedModule (Monolithic)', bundleSize: '1.4 MB', treeShakingEfficiency: 'Low' },
      scene: {
        entities: {
          appModule: d(-10, -18, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['AppModule'], sub: '@NgModule root' }),
          sharedModule: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'boxes', label: ['SharedModule'], sub: 'imports 50+ libraries' }),
          legacyComp: d(10, 8, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['UserComponent'], sub: 'inherits all 50 dependencies' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Legacy NgModule Monolith', [
            `@NgModule({`,
            `  declarations: [UserComponent, DatePipe, ButtonComponent],`,
            `  imports: [CommonModule, FormsModule, HeavyChartModule],`,
            `  exports: [UserComponent, ButtonComponent]`,
            `})`,
            `export class SharedModule {} // Monolithic coupling`,
          ], { icon: 'terminal' }),
          zMod: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'LEGACY NGMODULE COMPILATION BUBBLE'),
        },
        links: {
          as: h('appModule', 'sharedModule', ['appModule', 'sharedModule'], { label: 'imports shared' }),
          su: h('sharedModule', 'legacyComp', ['sharedModule', 'legacyComp'], { label: 'injects bloated scope' }),
        },
        flows: [{ route: ['as', 'su'], kind: 'module', rate: 1.5 }],
      },
    },
    {
      short: 'Transitive Leakage',
      chapter: 'problem',
      title: 'Transitive Dependency Leakage & Bundle Bloat',
      body: [
        'When <code>UserComponent</code> only needs a simple date format, it pulls in <code>HeavyChartModule</code> because both belong to <code>SharedModule</code>.',
        'Bundlers cannot prove whether unused components inside <code>SharedModule</code> might be referenced in dynamic templates, forcing them to retain the unused bytecode in production bundles.',
      ],
      callout: {
        kind: 'insight',
        text: 'This transitive dependency leakage caused enterprise Angular bundles to regularly exceed 3MB on initial load.',
      },
      changes: ['+ Dead code bundled into production main.js', '+ Tree-shaking hindered by opaque compilation contexts'],
      metrics: { architectureModel: 'NgModule', compilationContext: 'Bloated Leakage', bundleSize: '2.8 MB (Bloated)', treeShakingEfficiency: 'Poor' },
      scene: {
        entities: {
          bundler: d(-10, -18, { s: 4.8, h: 50, color: 'slab', glyph: 'cpu', label: ['ESBuild Bundler'], sub: 'analyzes AST imports' }),
          opaqueModule: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'boxes', label: ['Opaque NgModule'], sub: 'dynamic template references' }),
          bloatedOutput: d(10, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'package', label: ['main.js (2.8MB)'], sub: 'dead code retained' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Bundle Inspection Analysis', [
            `$ source-map-explorer dist/main.js`,
            `SharedModule: 1.8 MB (64% of total bundle)`,
            `  ├── HeavyChartModule (Never used on home page!)`,
            `  ├── DatePicker (Used on only 1 admin page)`,
            `  └── LeafletMap (Unused)`,
            `= Tree-shaker fails to drop unused code`,
          ], { icon: 'terminal' }),
          zMod: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'DEPENDENCY LEAKAGE & BUNDLE BLOAT'),
        },
        links: {
          bo: h('bundler', 'opaqueModule', ['bundler', 'opaqueModule'], { label: 'trace declarations' }),
          ob: h('opaqueModule', 'bloatedOutput', ['opaqueModule', 'bloatedOutput'], { label: 'bundles unused code' }),
        },
        flows: [{ route: ['bo', 'ob'], kind: 'deadCode', rate: 1.5 }],
      },
    },
    {
      short: 'Standalone Shift',
      chapter: 'setup',
      title: 'Standalone Components: Direct Explicit Imports',
      body: [
        'Starting with modern Angular, components can set <code>standalone: true</code> (now default).',
        'A standalone component specifies its exact dependencies directly in its own <code>imports: [CommonModule, ButtonComponent]</code> array. Zero intermediate modules required.',
      ],
      callout: {
        kind: 'tip',
        text: 'Direct component-to-component imports establish a crystal-clear static ES module dependency graph for bundlers.',
      },
      changes: ['+ standalone: true declared on component', '+ imports array explicitly declares only needed dependencies'],
      metrics: { architectureModel: 'Standalone', compilationContext: 'Isolated & Explicit', bundleSize: '450 KB', treeShakingEfficiency: 'High' },
      scene: {
        entities: {
          userComp: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['UserComponent'], sub: 'standalone: true' }),
          directImports: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'boxes', label: ['imports: [...]'], sub: 'ButtonComponent only' }),
          leanGraph: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['ESM Graph'], sub: 'static import chain' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Standalone Component Definition', [
            `@Component({`,
            `  selector: 'app-user',`,
            `  standalone: true,`,
            `  imports: [CommonModule, ButtonComponent],`,
            `  template: \`<app-button (click)="save()">Save</app-button>\``,
            `})`,
            `export class UserComponent {} // Zero NgModule needed!`,
          ], { icon: 'terminal' }),
          zMod: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'STANDALONE COMPONENT ARCHITECTURE'),
        },
        links: {
          ud: h('userComp', 'directImports', ['userComp', 'directImports'], { label: 'declares exact deps' }),
          dl: h('directImports', 'leanGraph', ['directImports', 'leanGraph'], { label: 'resolves static graph' }),
        },
        flows: [{ route: ['ud', 'dl'], kind: 'standalone', rate: 1.5 }],
      },
    },
    {
      short: 'Tree-Shaking',
      chapter: 'execution',
      title: 'Optimal Tree-Shaking Mechanics in Production',
      body: [
        'Because standalone dependencies use standard ES static <code>import</code> statements, bundlers (Vite, Rollup, ESBuild) perform fine-grained dead-code elimination.',
        'If <code>HeavyChartModule</code> is never imported by an active standalone route, it is completely pruned from the production bundle.',
      ],
      callout: {
        kind: 'insight',
        text: 'Moving to standalone components typically slashes initial application JavaScript bundle size by 40% to 60%.',
      },
      changes: ['+ Unused components pruned from production output', '+ Initial bundle drops from 2.8MB to 450KB'],
      metrics: { architectureModel: 'Standalone', compilationContext: 'Tree-Shaken', bundleSize: '450 KB (Optimized)', treeShakingEfficiency: '100% Optimal' },
      scene: {
        entities: {
          esbuild: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['ESBuild Shaker'], sub: 'marks unused symbols' }),
          prunedStore: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'boxes', label: ['Dead Code Pruned'], sub: 'HeavyCharts discarded' }),
          leanBundle: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['main.js (450KB)'], sub: '60% size reduction' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Tree-Shaker Build Output', [
            `$ ng build --configuration production`,
            `Building with esbuild...`,
            `Initial Chunk Files   | Names         |  Raw Size`,
            `main.js               | main          | 452.12 kB (-64%)`,
            `styles.css            | styles        |  32.10 kB`,
            `= All unused components successfully dropped`,
          ], { icon: 'terminal' }),
          zMod: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ESBUILD TREE-SHAKING ENGINE'),
        },
        links: {
          ep: h('esbuild', 'prunedStore', ['esbuild', 'prunedStore'], { label: 'detect unused exports' }),
          el: h('esbuild', 'leanBundle', ['esbuild', 'leanBundle'], { label: 'emit lean bundle' }),
        },
        flows: [{ route: ['ep', 'el'], kind: 'shake', rate: 1.6 }],
      },
    },
    {
      short: 'CLI Migration',
      chapter: 'technique',
      title: 'Automated Migration with Angular CLI Schematics',
      body: [
        'Migrating a 500-component codebase by hand is error-prone. The Angular team provides automated migration schematics:',
        '<code>ng generate @angular/core:standalone</code> walks your entire project, converts components to standalone, updates template imports, and removes unnecessary <code>@NgModule</code> definitions.',
      ],
      callout: {
        kind: 'tip',
        text: 'The schematic runs in 3 phases: 1. Convert components, 2. Remove unnecessary NgModules, 3. Switch bootstrap to bootstrapApplication.',
      },
      changes: ['+ Automated AST refactoring across all repository files', '+ NgModules safely pruned with zero broken imports'],
      metrics: { architectureModel: 'Migrated', compilationContext: 'Automated Refactor', bundleSize: '450 KB', treeShakingEfficiency: 'Automated' },
      scene: {
        entities: {
          schematicCmd: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['ng generate standalone'], sub: 'AST transformation' }),
          astParser: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['TypeScript AST'], sub: 'adds imports arrays' }),
          migratedRepo: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'package', label: ['Clean Codebase'], sub: '100% Standalone' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Migration Schematic Execution', [
            `$ ng generate @angular/core:standalone`,
            `? Select migration mode: Convert all components, directives, and pipes`,
            `UPDATE src/app/user/user.component.ts (added standalone: true)`,
            `UPDATE src/app/nav/nav.component.ts (updated imports)`,
            `DELETE src/app/shared/shared.module.ts`,
            `Migration complete: 84 components converted.`,
          ], { icon: 'terminal' }),
          zMod: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'AUTOMATED AST MIGRATION SCHEMATICS'),
        },
        links: {
          sa: h('schematicCmd', 'astParser', ['schematicCmd', 'astParser'], { label: 'analyze decorators' }),
          am: h('astParser', 'migratedRepo', ['astParser', 'migratedRepo'], { label: 'rewrite source files' }),
        },
        flows: [{ route: ['sa', 'am'], kind: 'standalone', rate: 1.5 }],
      },
    },
    {
      short: 'AppModule Free',
      chapter: 'scaling',
      title: 'AppModule-Free Modern Angular Architecture',
      body: [
        'With <code>AppModule</code> completely eliminated, the entire frontend architecture simplifies into a clean tree of standalone components and functional providers.',
        'Lazy loading routes is straightforward: <code>loadComponent: () =&gt; import(\'./feat.component\')</code>. Angular has shed its historical boilerplate.',
      ],
      callout: {
        kind: 'insight',
        text: 'Standalone architecture bridges the gap with modern web standards, making Angular intuitive and pleasant for all web developers.',
      },
      changes: ['+ AppModule deleted permanently', '+ Lazy loading configured via loadComponent and provideRoutes'],
      metrics: { architectureModel: 'Modern Standalone', compilationContext: 'Decoupled', bundleSize: '450 KB', treeShakingEfficiency: 'Peak' },
      scene: {
        entities: {
          appRouter: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['app.routes.ts'], sub: 'loadComponent dynamic import' }),
          lazyChunk: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'boxes', label: ['Lazy Chunks'], sub: 'on-demand standalone chunks' }),
          modernApp: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['Modern App'], sub: 'zero NgModule footprint' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Modern Route Definition', [
            `// src/app/app.routes.ts`,
            `export const routes: Routes = [`,
            `  {`,
            `    path: 'dashboard',`,
            `    loadComponent: () => import('./dashboard/dashboard.component')`,
            `      .then(m => m.DashboardComponent)`,
            `  }`,
            `]; // Pure dynamic imports with zero Module boilerplate`,
          ], { icon: 'terminal' }),
          zMod: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'MODERN APPMODULE-FREE TOPOLOGY'),
        },
        links: {
          al: h('appRouter', 'lazyChunk', ['appRouter', 'lazyChunk'], { label: 'route triggers split' }),
          lm: h('lazyChunk', 'modernApp', ['lazyChunk', 'modernApp'], { label: 'hydrate view' }),
        },
        flows: [{ route: ['al', 'lm'], kind: 'standalone', rate: 1.6 }],
      },
    },
  ],
};
