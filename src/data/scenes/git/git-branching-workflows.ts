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
          prodMain: d(-7, 7, { s: 5.0, h: 54, color: 'green', glyph: 'shield', label: ['main (Prod)'], sub: 'prod trunk' }),
          developLine: d(0, 0, { s: 5.2, h: 56, color: 'blue', glyph: 'gitBranch', label: ['develop Branch'], sub: 'develop branch' }),
          featureCart: d(7, -7, { s: 5.0, h: 54, color: 'amber', glyph: 'boxes', label: ['feature/cart'], sub: '2-week branch' }),
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
          md: h('prodMain', 'developLine', ['prodMain', 'developLine'], { label: 'branch develop' }),
          df: h('developLine', 'featureCart', ['developLine', 'featureCart'], { label: 'cut feature' }),
        },
        flows: [{ route: ['md', 'df'], kind: 'feature', rate: 1.2 }],
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
          developHead: d(-7, 7, { s: 5.0, h: 54, color: 'rose', glyph: 'alert', label: ['develop Head'], sub: '+42 drift' }),
          conflictZone: d(0, 0, { s: 5.2, h: 56, color: 'rose', glyph: 'alert', label: ['Merge Hell'], sub: '43 conflicts' }),
          staleFeature: d(7, -7, { s: 5.0, h: 54, color: 'amber', glyph: 'boxes', label: ['feature/cart'], sub: '3-week drift' }),
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
          dc: h('developHead', 'conflictZone', ['developHead', 'conflictZone'], { label: 'divergent code' }),
          fc: h('staleFeature', 'conflictZone', ['staleFeature', 'conflictZone'], { label: 'stale diffs' }),
        },
        flows: [{ route: ['dc', 'fc'], kind: 'feature', rate: 1.5 }],
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
          trunkMain: d(-7, 0, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Trunk (main)'], sub: 'trunk main' }),
          shortBranch: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'boxes', label: ['Short PR (<24h)'], sub: 'small diff' }),
          ciGate: d(7, 0, { s: 5.0, h: 54, color: 'green', glyph: 'shield', label: ['CI Test Gate'], sub: 'automated pass' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Trunk-Based Metrics', [
            `Cadence: 12 merges / day directly into main`,
            `Branch lifespan: Average 4 hours`,
            `Conflict rate: < 2% of merges`,
            `CI feedback loop: 4 minutes automated test suite`,
            `= Zero merge hell, fast developer flow`,
          ], { icon: 'terminal' }),
        },
        links: {
          tm: h('trunkMain', 'shortBranch', ['trunkMain', 'shortBranch'], { label: 'cut short PR' }),
          mc: h('shortBranch', 'ciGate', ['shortBranch', 'ciGate'], { label: 'pass assertions' }),
        },
        flows: [{ route: ['tm', 'mc'], kind: 'trunk', rate: 1.6 }],
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
          trunkCommit: d(-7, 7, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Trunk Commit'], sub: 'code in prod' }),
          flagEngine: d(0, 0, { s: 5.2, h: 56, color: 'amber', glyph: 'cpu', label: ['Feature Toggle'], sub: 'flag: OFF' }),
          userTraffic: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['Prod Traffic'], sub: 'prod users' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Feature Flag Architecture', [
            `const isNewCheckout = await flags.get('checkout_v2', user);`,
            `if (isNewCheckout) {`,
            `  return renderModernCheckout(); // Tested internally`,
            `} else {`,
            `  return renderLegacyCheckout(); // Production safe`,
            `}`,
            `= Code deployed daily, released when 100% ready`,
          ], { icon: 'terminal' }),
        },
        links: {
          tf: h('trunkCommit', 'flagEngine', ['trunkCommit', 'flagEngine'], { label: 'deploy dark code' }),
          fu: h('flagEngine', 'userTraffic', ['flagEngine', 'userTraffic'], { label: 'gate user traffic' }),
        },
        flows: [{ route: ['tf', 'fu'], kind: 'trunk', rate: 1.5 }],
      },
    },
    {
      short: 'Automated CI Gates',
      chapter: 'execution',
      title: 'Automated CI/CD Validation Matrix',
      body: [
        'Trunk-Based Development relies on bulletproof automation. Every Pull Request triggers a matrix of fast CI checks:',
        '1. Static type checking (tsc)<br>2. Unit tests with coverage thresholds<br>3. Security dependency vulnerability scans<br>4. Ephemeral preview environment deployment.',
      ],
      callout: {
        kind: 'insight',
        text: 'If CI fails, the PR is automatically blocked. Only clean, tested commits reach the trunk.',
      },
      changes: ['+ Automated test suite executes in 3.5 minutes', '+ Ephemeral preview URL generated for QA review'],
      metrics: { branchLifespan: 'Hours', mergeFrequency: 'High', conflictRisk: 'Protected by CI', releaseCadence: 'Continuous' },
      scene: {
        entities: {
          prRequest: y(-7, 7, { label: 'Pull Request', tags: [{ text: 'PR #418: auth refactor', tone: 'blue', icon: 'gitBranch' }] }),
          ciMatrix: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'cpu', label: ['CI Pipeline'], sub: 'lint & test' }),
          trunkMain: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'gitBranch', label: ['Trunk (main)'], sub: 'clean trunk' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'CI Gate Pipeline Run', [
            `GitHub Actions Run: PR #418`,
            `[PASS] Lint & Format (12s)`,
            `[PASS] TypeScript Strict Check (24s)`,
            `[PASS] 248 Unit & Integration Tests (88s)`,
            `[PASS] Snyk Security Vulnerability Scan (15s)`,
            `= All checks passed: Ready for instantaneous merge`,
          ], { icon: 'terminal' }),
        },
        links: {
          pc: h('prRequest', 'ciMatrix', ['prRequest', 'ciMatrix'], { label: 'run checks' }),
          cm: h('ciMatrix', 'trunkMain', ['ciMatrix', 'trunkMain'], { label: 'merge to main' }),
        },
        flows: [{ route: ['pc', 'cm'], kind: 'trunk', rate: 1.6 }],
      },
    },
    {
      short: 'Continuous Delivery',
      chapter: 'scaling',
      title: 'Continuous Delivery: 10x Velocity with 0 Merge Hell',
      body: [
        'By combining short-lived branches, feature flags, and automated CI gates, the team achieves true continuous delivery.',
        'Developers spend zero time in stressful merge conflict resolution, code reviews are small and easy to review (under 100 lines), and features ship continuously.',
      ],
      callout: {
        kind: 'tip',
        text: 'The best way to solve merge conflicts is to merge so frequently that conflicts never have time to grow.',
      },
      changes: ['+ Zero merge meetings needed', '+ 15 production releases per week', '+ 99.99% deployment success rate'],
      metrics: { branchLifespan: '< 6 hours', mergeFrequency: '15x / week', conflictRisk: 'Eliminated', releaseCadence: 'Multiple / day' },
      scene: {
        entities: {
          trunkStream: d(-7, 0, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Active Trunk'], sub: 'linear history' }),
          continuousDeploy: d(0, 0, { s: 5.2, h: 56, color: 'green', glyph: 'cpu', label: ['Auto Deploy'], sub: 'auto deploy' }),
          prodGlobal: d(7, 0, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['Global Edge'], sub: 'live edge' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Continuous Delivery Cadence', [
            `Deploy frequency: 15 releases / day`,
            `Lead time for changes: 38 minutes (commit to prod)`,
            `Change failure rate: < 0.5%`,
            `Mean time to recovery (MTTR): 8 minutes`,
            `= High velocity, low risk, zero merge hell`,
          ], { icon: 'terminal' }),
        },
        links: {
          tc: h('trunkStream', 'continuousDeploy', ['trunkStream', 'continuousDeploy'], { label: 'auto trigger' }),
          cp: h('continuousDeploy', 'prodGlobal', ['continuousDeploy', 'prodGlobal'], { label: 'zero-downtime deploy' }),
        },
        flows: [{ route: ['tc', 'cp'], kind: 'release', rate: 1.8 }],
      },
    },
  ],
};
