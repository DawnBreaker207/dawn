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

export const gitBranchingWorkflowsLesson = {
  id: 'git-branching-workflows',
  title: 'Branching Models: Git Flow to Trunk-Based Delivery',
  summary: 'Compare historical Git Flow (develop, release, hotfix) with modern GitHub Flow and Trunk-Based Development with Feature Flags for high-velocity teams.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['branchLifespan', 'mergeFrequency', 'conflictRisk', 'releaseCadence'],
  legend: ['flow', ['branch', 'branching flow'], ['drift', 'branch divergence'], ['trunk', 'trunk delivery']],
  goals: [
    { text: 'Git Flow: high ceremony multi-branch model', step: 1 },
    { text: 'The Merge Hell Bottleneck & long-lived branch drift', step: 2 },
    { text: 'GitHub Flow: single main branch & short-lived feature PRs', step: 3 },
    { text: 'Trunk-Based Development: committing directly to main daily', step: 4 },
    { text: 'Feature Flagging mechanics: decoupling deploy from release', step: 5 },
    { text: 'Automated CI release cadence & zero merge friction', step: 6 },
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
        kind: 'warn',
        text: 'Git Flow introduces high merge friction, long-lived branch drift, and complex double-merge ceremonies.',
      },
      metrics: { branchLifespan: '2-4 weeks', mergeFrequency: 'Low (batch)', conflictRisk: 'High (merge hell)', releaseCadence: 'Monthly' },
      scene: {
        entities: {
          mainBranch: y(-10, -18, { label: 'prod-main', tags: [{ text: 'main (Production)', tone: 'green', icon: 'shield' }] }),
          developBranch: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'gitBranch', label: ['develop Branch'], sub: 'Integration mainline' }),
          featureBranch: b(10, 8, { s: 4.6, h: 48, color: 'amber', glyph: 'terminal', label: ['feature/cart'], sub: 'Sprint development (2w)' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Git Flow Branch Matrix', [
            `Branches: main, develop, release/v1.2, feature/cart`,
            `Lifecycle: 3 weeks development in feature/cart`,
            `Ceremony: Merge feature -> develop`,
            `          Cut release/v1.2 branch`,
            `          Merge release -> main AND develop`,
            `= High overhead & double-merge ceremonies`,
          ], { icon: 'terminal' }),
          zFlow: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'GIT FLOW TOPOLOGY (HIGH CEREMONY)'),
        },
        links: {
          md: h('mainBranch', 'developBranch', ['mainBranch', 'developBranch'], { label: 'branch develop' }),
          df: h('developBranch', 'featureBranch', ['developBranch', 'featureBranch'], { label: 'cut feature' }),
        },
        flows: [{ route: ['md', 'df'], kind: 'branch', rate: 1.2 }],
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
        kind: 'caution',
        text: 'The longer a branch lives, the higher the probability of painful merge conflicts and broken regression suites.',
      },
      changes: ['! 15 commits diverged between feature and develop', '! 43 file conflicts during release cut', '! Deployment delayed by 4 days for manual conflict fixing'],
      metrics: { branchLifespan: '3 weeks', mergeFrequency: 'Infrequent', conflictRisk: 'CRITICAL (Merge Hell)', releaseCadence: 'Delayed' },
      scene: {
        entities: {
          developHead: y(-10, -18, { label: 'develop', tags: [{ text: 'develop (+42 commits)', tone: 'red', icon: 'alert' }] }),
          conflictZone: d(0, -6, { s: 4.8, h: 52, color: 'rose', glyph: 'alert', label: ['Merge Conflict'], sub: '43 conflicting files' }),
          staleFeature: b(10, 8, { s: 4.6, h: 48, color: 'amber', glyph: 'terminal', label: ['feature/checkout'], sub: 'Diverged by 3 weeks' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Merge Conflict Log', [
            `$ git merge feature/checkout`,
            `Auto-merging src/order.ts`,
            `CONFLICT (content): Merge conflict in src/order.ts`,
            `CONFLICT (content): Merge conflict in src/user.ts`,
            `Automatic merge failed; fix conflicts and then commit.`,
            `! 4 days lost fixing merge collisions`,
          ], { icon: 'terminal' }),
          zHell: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'LONG-LIVED BRANCH DRIFT & MERGE HELL'),
        },
        links: {
          dc: h('developHead', 'conflictZone', ['developHead', 'conflictZone'], { label: 'merge attempt' }),
          sc: h('staleFeature', 'conflictZone', ['staleFeature', 'conflictZone'], { label: 'stale branch' }),
        },
        flows: [{ route: ['dc', 'sc'], kind: 'drift', rate: 1.5 }],
      },
    },
    {
      short: 'GitHub Flow',
      chapter: 'technique',
      title: 'GitHub Flow: Single Main Branch & Short PRs',
      body: [
        '<b>GitHub Flow</b> discards <code>develop</code> entirely. <code>main</code> is the single eternal branch and must ALWAYS be deployable.',
        'Developers create short-lived feature branches lasting hours or days (never weeks), open a Pull Request, get code review, pass automated CI, and merge immediately.',
      ],
      callout: {
        kind: 'tip',
        text: 'Short-lived PRs (< 2 days) minimize branch drift and keep code reviews fast and thorough.',
      },
      changes: ['+ Discarded develop branch; main is deployable source', '+ PRs merged within 24 hours of creation', '+ Automated CI verifies branch before merge'],
      metrics: { branchLifespan: '< 2 days', mergeFrequency: 'Daily', conflictRisk: 'Low', releaseCadence: 'Daily' },
      scene: {
        entities: {
          mainSource: y(-10, -18, { label: 'main', tags: [{ text: 'main (Always Deployable)', tone: 'green', icon: 'shield' }] }),
          prGate: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['Pull Request Review'], sub: 'CI pass + 1 approval' }),
          shortBranch: b(10, 8, { s: 4.6, h: 48, color: 'cyan', glyph: 'gitBranch', label: ['feat/fast-pr'], sub: 'Lifespan: 8 hours' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'GitHub Flow Pull Request', [
            `PR #421: feat/fast-checkout (8 hours old)`,
            `Reviewer: Approved by @lead-dev`,
            `CI Status: All 12 checks passed`,
            `Action: Squash & Merge -> main`,
            `= Immediately deployed to staging/prod`,
          ], { icon: 'terminal' }),
          zGhFlow: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'GITHUB FLOW (SHORT-LIVED PRS)'),
        },
        links: {
          ms: h('mainSource', 'shortBranch', ['mainSource', 'shortBranch'], { label: 'branch from main' }),
          sp: h('shortBranch', 'prGate', ['shortBranch', 'prGate'], { label: 'open PR' }),
        },
        flows: [{ route: ['ms', 'sp'], kind: 'branch', rate: 1.6 }],
      },
    },
    {
      short: 'Trunk-Based Delivery',
      chapter: 'execution',
      title: 'Trunk-Based Development: Merging Daily to Main',
      body: [
        'Elite software engineering teams (Google, Netflix, Meta) practice <b>Trunk-Based Development</b>.',
        'All developers commit in small batches (under 200 lines of code) directly to the single shared trunk (<code>main</code>) multiple times per day.',
      ],
      callout: {
        kind: 'insight',
        text: 'Trunk-based development prevents merge conflicts by making merge collisions impossible: everyone is continuously synced to trunk HEAD.',
      },
      changes: ['+ Developers push small commits to main multiple times daily', '+ Zero merge conflicts across 50 engineers', '+ Continuous integration verifies every trunk commit'],
      metrics: { branchLifespan: '< 1 day', mergeFrequency: 'Continuous (Multiple / Day)', conflictRisk: 'Minimal (< 1%)', releaseCadence: 'On-Demand' },
      scene: {
        entities: {
          devOne: y(-10, -18, { label: 'dev-1', tags: [{ text: 'Small PR (< 150 lines)', icon: 'terminal' }] }),
          trunkMain: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['Trunk (main)'], sub: 'Continuous integration trunk' }),
          devTwo: b(10, 8, { s: 4.6, h: 48, color: 'cyan', glyph: 'terminal', label: ['dev-2'], sub: 'Syncs every 2 hours' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Trunk Commit Stream', [
            `09:30 dev-1: commit 8f9a1e (32 lines) -> main`,
            `11:15 dev-2: commit 4b2c1a (74 lines) -> main`,
            `14:00 dev-3: commit 9c8e7f (50 lines) -> main`,
            `Zero long-lived branches in repository`,
            `= Fast feedback & continuous integration`,
          ], { icon: 'terminal' }),
          zTrunk: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'TRUNK-BASED CONTINUOUS STREAM'),
        },
        links: {
          dt: h('devOne', 'trunkMain', ['devOne', 'trunkMain'], { label: 'commit to trunk' }),
          tt: h('devTwo', 'trunkMain', ['devTwo', 'trunkMain'], { label: 'continuous sync' }),
        },
        flows: [
          { route: ['dt'], kind: 'trunk', rate: 1.8 },
          { route: ['tt'], kind: 'trunk', rate: 1.5 },
        ],
      },
    },
    {
      short: 'Feature Flags',
      chapter: 'execution',
      title: 'Feature Flags: Decoupling Deployment from Release',
      body: [
        'How do you commit incomplete features to <code>main</code> without exposing unfinished UI to users?',
        'Use <b>Feature Flags (Toggles)</b>! Code is deployed continuously into production dark (hidden behind a boolean flag), allowing safe incomplete trunk commits.',
      ],
      callout: {
        kind: 'tip',
        text: 'Deploy is a technical action (putting bytes on servers). Release is a business decision (turning feature on for users). Feature flags decouple the two.',
      },
      changes: ['+ Incomplete checkout feature wrapped in feature flag', '+ Code merged to trunk and deployed to production', '+ Feature remains dark (disabled) for public traffic'],
      metrics: { branchLifespan: '< 1 day', mergeFrequency: 'Continuous', conflictRisk: 'Zero (Flagged)', releaseCadence: 'Decoupled' },
      scene: {
        entities: {
          trunkCommit: y(-10, -18, { label: 'trunk', tags: [{ text: 'feat/checkout (Incomplete)', icon: 'gitBranch' }] }),
          flagGuard: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'shield', label: ['Feature Flag Guard'], sub: 'if (flags.NEW_CHECKOUT)' }),
          prodRuntime: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['Production Runtime'], sub: 'Safe execution' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Feature Flag Code Spec', [
            `const flags = await getFlags(user);`,
            `if (flags.ENABLE_NEW_CHECKOUT) {`,
            `  return <NewCheckoutFlow user={user} />;`,
            `} else {`,
            `  return <LegacyCheckout user={user} />;`,
            `}`,
            `= Dark launch: deployed safely without release`,
          ], { icon: 'terminal' }),
          zFlags: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'FEATURE FLAG DECOUPLING'),
        },
        links: {
          tf: h('trunkCommit', 'flagGuard', ['trunkCommit', 'flagGuard'], { label: 'deploy dark' }),
          fr: h('flagGuard', 'prodRuntime', ['flagGuard', 'prodRuntime'], { label: 'flag evaluation' }),
        },
        flows: [{ route: ['tf', 'fr'], kind: 'trunk', rate: 1.6 }],
      },
    },
    {
      short: 'CI Cadence',
      chapter: 'solution',
      title: 'Automated CI Cadence: High Velocity & Peace of Mind',
      body: [
        'Combining Trunk-Based Development with automated CI/CD achieves the pinnacle of engineering flow.',
        'Developers merge small PRs without fear of merge conflicts. Automated canary deployments roll out changes smoothly, achieving elite DORA metrics.',
      ],
      callout: {
        kind: 'insight',
        text: 'Elite teams ship 10-20 times a day with zero release drama, no weekend war-rooms, and negligible failure rates.',
      },
      changes: ['+ Continuous deployment from trunk to production', '+ Automated rollback triggers on canary degradation', '+ Zero merge ceremonies or code freezes'],
      metrics: { branchLifespan: 'Hours', mergeFrequency: 'Continuous', conflictRisk: 'Negligible', releaseCadence: 'Multiple / Day' },
      scene: {
        entities: {
          fastTrunk: y(-10, -18, { label: 'trunk-head', tags: [{ text: 'Trunk HEAD (main)', tone: 'green', icon: 'gitBranch' }] }),
          ciPipeline: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['Continuous Delivery'], sub: 'Automated Canary & Verification' }),
          globalFleet: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Global Production'], sub: '60 Deploys / Week | Stable' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Continuous Delivery Flow', [
            `Deployment Cadence: 12 deploys / day`,
            `Lead time: < 30 minutes from commit`,
            `Change failure rate: 1.2% (Canary catches 99%)`,
            `Code freeze periods: ZERO per year`,
            `= Elite software engineering velocity`,
          ], { icon: 'terminal' }),
          zCadence: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'HIGH-VELOCITY CONTINUOUS CADENCE'),
        },
        links: {
          fc: h('fastTrunk', 'ciPipeline', ['fastTrunk', 'ciPipeline'], { label: 'trunk merge' }),
          cg: h('ciPipeline', 'globalFleet', ['ciPipeline', 'globalFleet'], { label: 'canary rollout' }),
        },
        flows: [{ route: ['fc', 'cg'], kind: 'trunk', rate: 1.8 }],
      },
    },
  ],
};
