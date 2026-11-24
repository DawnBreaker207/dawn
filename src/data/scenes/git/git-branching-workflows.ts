// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitBranchingWorkflowsLesson = {
  id: 'git-branching-workflows',
  title: 'Git Branching Models: Git Flow, GitHub Flow & Trunk-Based',
  summary: 'Architectural comparison of enterprise branching strategies: Master/Develop/Release (Git Flow), PR-driven feature branches (GitHub Flow), and rapid Trunk-Based Development.',
  minutes: 15,
  level: 'intermediate',
  metrics: ['branchLifespan', 'mergeFrequency', 'conflictRisk', 'releaseCadence'],
  legend: ['mainline', ['feature', 'short-lived branch'], ['release', 'stabilization']],
  goals: [
    { text: 'Classic Git Flow: develop, feature, release, and hotfix topology', step: 1 },
    { text: 'GitHub Flow: Pull Request, review, CI gate, and fast deploy', step: 3 },
    { text: 'Trunk-Based Development: Small daily merges enabled by feature flags', step: 5 },
  ],
  steps: [
    {
      short: 'Git Flow',
      chapter: 'setup',
      title: 'Classic Git Flow (Heavy Scheduled Releases)',
      body: [
        'Created in 2010 for boxed software, Git Flow maintains two eternal branches: <code>main</code> (production releases) and <code>develop</code> (integration mainline).',
        'Features branch from <code>develop</code> and merge back. When ready, a <code>release/*</code> branch is cut for QA and stabilization, merging into BOTH <code>main</code> and <code>develop</code>. Emergency fixes branch from <code>main</code> as <code>hotfix/*</code>.',
      ],
      callout: {
        kind: 'warn',
        text: 'Git Flow introduces high merge friction, long-lived branch drift, and complex double-merge ceremonies.',
      },
      metrics: { branchLifespan: '2-4 weeks', mergeFrequency: 'Low (batch)', conflictRisk: 'High (merge hell)', releaseCadence: 'Monthly' },
      scene: {
        entities: {
          main: d(-12, -7, { color: 'green', glyph: 'gitBranch', label: ['main'], sub: 'production tags' }),
          hotfix: d(0, -9, { color: 'rose', glyph: 'alert', label: ['hotfix/*'], sub: 'critical patches' }),
          dev: d(-6, 2, { color: 'blue', glyph: 'gitBranch', label: ['develop'], sub: 'integration mainline' }),
          feat: d(4, 7, { color: 'yellow', glyph: 'terminal', label: ['feature/*'], sub: 'sprint development' }),
          rel: d(2, -2, { color: 'purple', glyph: 'package', label: ['release/*'], sub: 'QA stabilization' }),
          zFlow: x({ x0: -14, x1: 7, y0: -11, y1: 9 }, 'GIT FLOW TOPOLOGY (HIGH CEREMONY)'),
        },
        links: {
          df: h('dev', 'feat', ['dev', 'feat'], { heads: 'both', label: 'feature branch' }),
          dr: h('dev', 'rel', ['dev', 'rel'], { label: 'cut release' }),
          rm: h('rel', 'main', ['rel', 'main'], { label: 'merge to prod' }),
          rd: h('rel', 'dev', ['rel', 'dev'], { label: 'sync back' }),
          mh: h('main', 'hotfix', ['main', 'hotfix'], { heads: 'both', label: 'hotfix' }),
        },
        flows: [{ route: ['df'], kind: 'feature', rate: 1.0 }],
      },
    },
    {
      short: 'GitHub Flow',
      chapter: 'technique',
      title: 'GitHub Flow (Web & SaaS Delivery)',
      body: [
        'GitHub Flow discards <code>develop</code>. <code>main</code> is the single eternal branch and must always be deployable.',
        'Developers create descriptive feature branches, open Pull Requests early for feedback, run automated CI checks, and merge directly to <code>main</code> followed by immediate production deployment.',
      ],
      callout: {
        kind: 'tip',
        text: 'Keep feature branches alive for days, not weeks, to minimize divergence from main.',
      },
      changes: ['− Deleted develop and release branches', '+ Single source of truth: main', '+ CI gate must pass before merge'],
      metrics: { branchLifespan: '1-3 days', mergeFrequency: 'Daily', conflictRisk: 'Low', releaseCadence: 'Multiple / day' },
      scene: {
        entities: {
          main: d(-8, 0, { color: 'green', glyph: 'gitBranch', label: ['main'], sub: 'always deployable' }),
          featA: d(4, -4, { color: 'yellow', glyph: 'gitBranch', label: ['feat/api-auth'], sub: 'PR #102 + CI passes' }),
          featB: d(4, 4, { color: 'yellow', glyph: 'gitBranch', label: ['feat/cart-ui'], sub: 'PR #103 in review' }),
          zGh: x({ x0: -10, x1: 8, y0: -6, y1: 6 }, 'GITHUB FLOW (PR-DRIVEN)'),
        },
        links: {
          ma: h('main', 'featA', ['main', 'featA'], { heads: 'both', label: 'short-lived branch' }),
          mb: h('main', 'featB', ['main', 'featB'], { heads: 'both', label: 'short-lived branch' }),
        },
        flows: [{ route: ['ma'], rate: 1.5 }],
      },
    },
    {
      short: 'Trunk-Based',
      chapter: 'solution',
      title: 'Trunk-Based Development (Elite High-Velocity Engineering)',
      body: [
        'All engineers merge small, frequent batches into a single shared <code>trunk</code> (or <code>main</code>) multiple times per day.',
        'Incomplete features are guarded by <b>Feature Flags (Toggles)</b> so dormant code can be merged and deployed safely to production without disrupting users. Merging takes minutes, eliminating merge hell completely.',
      ],
      callout: {
        kind: 'insight',
        text: 'Trunk-Based Development is the proven prerequisite for Elite DORA performance and continuous delivery.',
      },
      changes: ['+ Branch lifespan < 24 hours', '+ Feature Flags isolate unready logic', '+ Zero merge conflicts, continuous feedback'],
      metrics: { branchLifespan: '< 24 hours', mergeFrequency: 'Continuous', conflictRisk: 'Near Zero', releaseCadence: 'Hourly' },
      scene: {
        entities: {
          trunk: d(0, 0, { s: 4.8, color: 'green', glyph: 'gitBranch', label: ['TRUNK / MAIN'], sub: 'continuous linear merges' }),
          dev1: d(-8, -4, { color: 'slab', glyph: 'terminal', label: ['Agent/Dev 1'], sub: 'commit every 2h' }),
          dev2: d(-8, 4, { color: 'slab', glyph: 'terminal', label: ['Agent/Dev 2'], sub: 'flagged feature' }),
          prod: d(8, 0, { color: 'purple', glyph: 'cloud', label: ['Production'], sub: 'continuous rollout' }),
        },
        links: {
          d1t: h('dev1', 'trunk', ['dev1', 'trunk'], { label: 'fast merge' }),
          d2t: h('dev2', 'trunk', ['dev2', 'trunk'], { label: 'fast merge' }),
          tp: h('trunk', 'prod', ['trunk', 'prod'], { label: 'auto deploy' }),
        },
        flows: [
          { route: ['d1t', 'tp'], rate: 1.8 },
          { route: ['d2t', 'tp'], rate: 1.4 },
        ],
      },
    },
  ],
};
