// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitBranchingWorkflowsLesson = {
  id: 'git-branching-workflows',
  title: 'Git Branching Workflows: Git Flow vs Trunk-Based Development',
  summary: 'Architectural comparison between heavy ceremony branching (Git Flow) and high-velocity continuous integration (Trunk-Based Development) with short-lived branches.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['branchLifespan', 'mergeFrequency', 'conflictRisk', 'releaseCadence'],
  legend: ['flow', ['trunk', 'main trunk'], ['feature', 'feature branch'], ['release', 'production release']],
  goals: [
    { text: 'Git Flow architecture: Complex hierarchy of develop, feature, and release branches', step: 1 },
    { text: 'The merge hell bottleneck: Long-lived branch drift and integration friction', step: 2 },
    { text: 'Trunk-Based Development: Merging small batches to main daily', step: 3 },
    { text: 'Feature flags: Decoupling code deployment from feature release', step: 4 },
    { text: 'Automated CI verification gates and PR review automation', step: 5 },
    { text: 'High-frequency continuous deployment topology', step: 6 },
  ],
  steps: [
    {
      short: 'Git Flow',
      chapter: 'setup',
      title: 'Git Flow: High Ceremony Branching Model (2010)',
      body: [
        '<b>Git Flow</b> introduced strict branch types: <code>main</code> (production), <code>develop</code> (integration), <code>feature/*</code>, <code>release/*</code>, and <code>hotfix/*</code>.',
        'Developers work on isolated feature branches for weeks before merging into <code>develop</code>, culminating in a release branch ceremony.',
      ],
      callout: {
        kind: 'warning',
        text: 'Git Flow introduces high merge friction, long-lived branch drift, and complex double-merge ceremonies.',
      },
      metrics: { branchLifespan: '2-4 weeks', mergeFrequency: 'Low (batch)', conflictRisk: 'High (merge hell)', releaseCadence: 'Monthly' },
      scene: {
        entities: {
          trunkMain: d(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'gitBranch', label: ['main (Prod)'], sub: 'stable trunk' }),
          staleDevelop: d(-4, -20, { s: 4.4, h: 54, color: 'amber', glyph: 'gitBranch', label: ['develop Line'], sub: 'develop branch' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Git Flow Branch Matrix', [
            `Branches: main, develop, release/v1.2, feature/cart`,
            `Lifecycle: 3 weeks development in feature/cart`,
            `Ceremony: Merge feature -> develop`,
            `          Cut release/v1.2 branch`,
            `          Merge release -> main AND develop`,
            `= High overhead & double-merge ceremonies`,
          ], { icon: 'terminal' }),
        },
        links: {
          td: h('trunkMain', 'staleDevelop', ['trunkMain', 'staleDevelop'], { label: 'cut develop' }),
        },
        flows: [{ route: ['td'], kind: 'feature', rate: 1.2 }],
      },
    },
    {
      short: 'The Merge Hell',
      chapter: 'problem',
      title: 'The Merge Hell Bottleneck: Long-Lived Branch Drift',
      body: [
        'When 10 developers work on separate feature branches for 3 weeks without merging, codebases rapidly diverge.',
        'When everyone merges into <code>develop</code> before code freeze, massive structural conflicts erupt (<b>Merge Hell</b>), requiring days of stressful manual conflict resolution.',
      ],
      callout: {
        kind: 'warning',
        text: 'The longer a branch lives, the higher the probability of painful merge conflicts and broken regression suites.',
      },
      changes: ['! 15 commits diverged between feature and develop', '! 43 file conflicts during release cut', '! Deployment delayed by 4 days for manual conflict fixing'],
      metrics: { branchLifespan: '3 weeks', mergeFrequency: 'Infrequent', conflictRisk: 'CRITICAL (Merge Hell)', releaseCadence: 'Delayed' },
      scene: {
        entities: {
          trunkMain: d(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'gitBranch', label: ['main (Prod)'], sub: 'stable trunk' }),
          staleDevelop: d(-4, -20, { s: 4.4, h: 54, color: 'rose', glyph: 'alert', label: ['Merge Hell'], sub: '43 conflicts' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Merge Conflict Log', [
            `$ git merge feature/checkout`,
            `Auto-merging src/order.ts`,
            `CONFLICT (content): Merge conflict in src/order.ts`,
            `CONFLICT (content): Merge conflict in src/user.ts`,
            `Automatic merge failed; fix conflicts and then commit.`,
            `! 4 days lost fixing merge collisions`,
          ], { icon: 'terminal' }),
        },
        links: {
          td: h('trunkMain', 'staleDevelop', ['trunkMain', 'staleDevelop'], { label: 'divergent drift' }),
        },
        flows: [{ route: ['td'], kind: 'feature', rate: 1.5 }],
      },
    },
    {
      short: 'Trunk-Based',
      chapter: 'technique',
      title: 'Trunk-Based Development: Small Batches & Daily Merges',
      body: [
        '<b>Trunk-Based Development (TBD)</b> eliminates develop and release branches. Everyone works on short-lived branches (&lt; 24h) and merges directly into <code>main</code>.',
        'Continuous Integration runs automated tests on every merge. Merge conflicts become tiny, rare, and take 30 seconds to solve.',
      ],
      callout: {
        kind: 'insight',
        text: 'Industry data (DORA research): Elite engineering teams ship 200x more frequently with 3x lower change failure rates using Trunk-Based Development.',
      },
      changes: ['+ Abolished develop and release branches', '+ Maximum branch lifespan capped at 24 hours', '+ Automated CI tests every PR merge'],
      metrics: { branchLifespan: '< 24 hours', mergeFrequency: 'Daily (continuous)', conflictRisk: 'Near Zero', releaseCadence: 'Continuous' },
      scene: {
        entities: {
          trunkMain: d(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'gitBranch', label: ['Trunk (main)'], sub: 'stable trunk' }),
          featureBranch: d(-6, -2, { s: 4.4, h: 54, color: 'amber', glyph: 'boxes', label: ['Feature PR'], sub: 'short-lived PR' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Trunk-Based Metrics', [
            `Cadence: 12 merges / day directly into main`,
            `Branch lifespan: Average 4 hours`,
            `Conflict rate: < 2% of merges`,
            `CI feedback loop: 4 minutes automated test suite`,
            `= Zero merge hell, fast developer flow`,
          ], { icon: 'terminal' }),
        },
        links: {
          tf: h('trunkMain', 'featureBranch', ['trunkMain', 'featureBranch'], { label: 'short branch (<24h)' }),
        },
        flows: [{ route: ['tf'], kind: 'trunk', rate: 1.6 }],
      },
    },
    {
      short: 'CI Gate',
      chapter: 'technique',
      title: 'Automated CI Verification Gates for Every PR',
      body: [
        'In Trunk-Based Development, <code>main</code> must remain deployable at all times. Automated CI gates run test suites, lint checks, and type validations before any merge is allowed.',
        'If a PR breaks the build, CI immediately blocks the merge, keeping the trunk healthy and green.',
      ],
      callout: {
        kind: 'tip',
        text: 'Merge queues (like GitHub merge queue) guarantee that tested PRs are still valid when merged sequentially.',
      },
      changes: ['+ Automated CI test pipeline configured', '+ All PRs must pass unit, integration, and lint checks before merge'],
      metrics: { branchLifespan: '< 12 hours', mergeFrequency: 'Continuous', conflictRisk: 'Near Zero', releaseCadence: 'Daily' },
      scene: {
        entities: {
          trunkMain: d(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'gitBranch', label: ['Trunk (main)'], sub: 'stable trunk' }),
          featureBranch: d(-6, -2, { s: 4.4, h: 54, color: 'amber', glyph: 'boxes', label: ['Feature PR'], sub: 'short-lived PR' }),
          ciGate: d(-2, 16, { s: 4.4, h: 56, color: 'green', glyph: 'shield', label: ['CI Test Gate'], sub: 'automated pass' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'CI Verification Pipeline', [
            `$ git push origin feat/cart`,
            `Running GitHub Actions:`,
            `  ✓ Lint & Typecheck (45s)`,
            `  ✓ 1,420 Unit Tests (1m 12s)`,
            `  ✓ E2E Smoke Tests (2m 05s)`,
            `Status: All checks passed. Ready to merge!`,
          ], { icon: 'terminal' }),
        },
        links: {
          tf: h('trunkMain', 'featureBranch', ['trunkMain', 'featureBranch'], { label: 'branch from main' }),
          fc: h('featureBranch', 'ciGate', ['featureBranch', 'ciGate'], { label: 'validate suite' }),
        },
        flows: [{ route: ['tf', 'fc'], kind: 'trunk', rate: 1.6 }],
      },
    },
    {
      short: 'Feature Flags',
      chapter: 'technique',
      title: 'Feature Flags: Decoupling Deploy from Release',
      body: [
        'How do you merge half-finished features into <code>main</code> without exposing broken code to users? <b>Feature Flags (Toggles)</b>.',
        'Wrap new code in a dynamic conditional: <code>if (flags.isEnabled("new_cart"))</code>. You can deploy code to production multiple times a day while the feature remains safely off.',
      ],
      callout: {
        kind: 'tip',
        text: 'Deploy is a technical event (placing bits on servers). Release is a business event (turning the feature on for customers). Feature flags separate the two.',
      },
      changes: ['+ Incomplete code safely merged behind flags', '+ Zero risk to production users'],
      metrics: { branchLifespan: 'Hours', mergeFrequency: 'Continuous', conflictRisk: 'Minimal', releaseCadence: 'On demand' },
      scene: {
        entities: {
          trunkMain: d(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'gitBranch', label: ['Trunk (main)'], sub: 'code in prod' }),
          featureBranch: d(-6, -2, { s: 4.4, h: 54, color: 'amber', glyph: 'boxes', label: ['Feature PR'], sub: 'short-lived PR' }),
          ciGate: d(-2, 16, { s: 4.4, h: 56, color: 'green', glyph: 'shield', label: ['CI Test Gate'], sub: 'automated pass' }),
          flagToggle: d(6, 0, { s: 4.4, h: 54, color: 'cyan', glyph: 'cpu', label: ['Feature Flag'], sub: 'runtime toggle' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Feature Flag Architecture', [
            `const showNewCheckout = await flags.get('checkout_v2', user);`,
            `if (showNewCheckout) {`,
            `  return <NewCheckoutFlow />;`,
            `} else {`,
            `  return <LegacyCheckout />;`,
            `}`,
            `= Ship incomplete features without leaking to end users`,
          ], { icon: 'terminal' }),
        },
        links: {
          tf: h('trunkMain', 'featureBranch', ['trunkMain', 'featureBranch'], { label: 'merge to main' }),
          fc: h('featureBranch', 'ciGate', ['featureBranch', 'ciGate'], { label: 'pass assertions' }),
          ff: h('featureBranch', 'flagToggle', ['featureBranch', 'flagToggle'], { label: 'evaluate flag' }),
        },
        flows: [{ route: ['tf', 'ff'], kind: 'trunk', rate: 1.6 }],
      },
    },
    {
      short: 'Continuous CD',
      chapter: 'scaling',
      title: 'High-Frequency Continuous Deployment Topology',
      body: [
        'With Trunk-Based Development and Feature Flags, code flows uninterrupted from developer commit to production in under 15 minutes.',
        'There is no "release day", no freeze period, and no merge ceremony. Releases are continuous and friction-free.',
      ],
      callout: {
        kind: 'insight',
        text: 'Continuous Delivery removes release stress: small diffs mean small rollback surfaces and instantaneous mean time to recovery (MTTR).',
      },
      changes: ['+ Fully automated continuous deployment pipeline enabled', '+ 15-minute commit-to-production lead time'],
      metrics: { branchLifespan: '< 4 hours', mergeFrequency: 'Hourly', conflictRisk: 'Near Zero', releaseCadence: 'Continuous' },
      scene: {
        entities: {
          trunkMain: d(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'gitBranch', label: ['Trunk (main)'], sub: 'stable trunk' }),
          featureBranch: d(-6, -2, { s: 4.4, h: 54, color: 'amber', glyph: 'boxes', label: ['Feature PR'], sub: 'short-lived PR' }),
          ciGate: d(-2, 16, { s: 4.4, h: 56, color: 'green', glyph: 'shield', label: ['CI Test Gate'], sub: 'automated pass' }),
          flagToggle: d(6, 0, { s: 4.4, h: 54, color: 'cyan', glyph: 'cpu', label: ['Feature Flag'], sub: 'runtime toggle' }),
          prodRelease: d(18, 4, { s: 4.4, h: 56, color: 'green', glyph: 'server', label: ['Prod Release'], sub: 'continuous CD' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Continuous Deployment Pipeline', [
            `Pipeline: Developer -> PR -> CI Pass -> Merge -> Production`,
            `Lead time for changes: 12 minutes`,
            `Deployment frequency: 15 / day`,
            `Change failure rate: < 0.5%`,
            `Mean time to recover: 4 minutes (toggle flag OFF)`,
            `= Elite engineering velocity achieved`,
          ], { icon: 'terminal' }),
        },
        links: {
          tf: h('trunkMain', 'featureBranch', ['trunkMain', 'featureBranch'], { label: 'merge to main' }),
          fc: h('featureBranch', 'ciGate', ['featureBranch', 'ciGate'], { label: 'pass assertions' }),
          ff: h('featureBranch', 'flagToggle', ['featureBranch', 'flagToggle'], { label: 'evaluate flag' }),
          fp: h('flagToggle', 'prodRelease', ['flagToggle', 'prodRelease'], { label: 'continuous CD' }),
        },
        flows: [{ route: ['tf', 'ff', 'fp'], kind: 'release', rate: 1.8 }],
      },
    },
  ],
};
