import {
  makeBlock,
  makeDb,
  makeDevice,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';

export const devopsDoraMetricsLesson = {
  id: 'devops-dora-metrics',
  title: 'DORA Metrics & SRE Budgets',
  summary: 'Quantify software delivery excellence using the 4 DORA metrics: Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Mean Time to Recovery (MTTR), unified under SRE Error Budget governance.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['doraTier', 'deployFrequency', 'leadTime', 'cfrMttr'],
  legend: ['flow', ['speed', 'throughput velocity'], ['safe', 'stability & rollback'], ['budget', 'error budget feedback']],
  goals: [
    { text: 'The 4 DORA metrics: balancing throughput against stability', step: 1 },
    { text: 'Deployment Frequency (DF): moving from batch to daily rollouts', step: 2 },
    { text: 'Lead Time for Changes (LTFC): accelerating commit-to-production', step: 3 },
    { text: 'Change Failure Rate (CFR): containing blast radius via canaries', step: 4 },
    { text: 'Mean Time to Recovery (MTTR): rapid automated incident rollback', step: 5 },
    { text: 'SRE Error Budget governance: data-driven shipping policies', step: 6 },
  ],
  steps: [
    {
      short: '4 DORA Metrics',
      chapter: 'overview',
      title: 'The 4 DORA Metrics: Throughput vs Stability Equilibrium',
      body: [
        'The DevOps Research and Assessment (DORA) framework identifies 4 key metrics that correlate directly with organizational performance.',
        'High performers optimize <b>both</b> throughput (Deployment Frequency, Lead Time) and stability (Change Failure Rate, MTTR), disproving the myth that moving fast causes outages.',
      ],
      callout: {
        kind: 'insight',
        text: 'Elite engineering teams deploy multiple times per day with lead time < 1 hour, change failure rate < 5%, and MTTR < 1 hour.',
      },
      metrics: { doraTier: 'Elite Target', deployFrequency: 'Daily (On-demand)', leadTime: '< 1 Hour', cfrMttr: 'CFR < 5%' },
      scene: {
        entities: {
          devStream: makeDevice(-18, -6, { label: 'dev-stream', tags: [{ text: 'Throughput Flow', tone: 'blue', icon: 'zap' }] }),
          doraEngine: makeBlock(-6, -2, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['DORA Engine'], sub: 'speed/safety' }),
          prodFleet: makeDb(6, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Production Fleet'], sub: 'continuous CD' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'The 4 DORA Metrics', [
            `1. Deployment Frequency:    Multiple per day`,
            `2. Lead Time for Changes:   < 1 hour (commit -> prod)`,
            `3. Change Failure Rate:     0% - 5% (canary catch)`,
            `4. Time to Restore (MTTR):  < 15 minutes (auto-revert)`,
            `= Elite Performers excel at BOTH speed AND safety`,
          ], { icon: 'terminal' }),
        },
        links: {
          dd: makeLink('devStream', 'doraEngine', ['devStream', 'doraEngine'], { label: 'commits' }),
          dp: makeLink('doraEngine', 'prodFleet', ['doraEngine', 'prodFleet'], { label: 'rollouts' }),
        },
        flows: [{ route: ['dd', 'dp'], kind: 'speed', rate: 1.5 }],
      },
    },
    {
      short: 'Deployment Frequency',
      chapter: 'throughput',
      title: 'Deployment Frequency: De-risking via Small Batches',
      body: [
        'Low-performing teams deploy once a month in terrifying "big bang" weekend war-rooms.',
        'Elite teams break changes into small, atomic pull requests that deploy independently. Deploying 15 times a day dramatically de-risks releases because each change touches minimal code.',
      ],
      callout: {
        kind: 'tip',
        text: 'If deploying to production hurts, do it more often. High frequency forces investment in automated testing and resilient telemetry.',
      },
      changes: ['+ Decomposed monolithic release into 14 micro-rollouts', '+ Fully automated trunk-based continuous deployment', '+ Zero scheduled downtime or maintenance windows'],
      metrics: { doraTier: 'Elite (DF)', deployFrequency: '14 Deploys/day', leadTime: '38 Minutes', cfrMttr: '0% Outages' },
      scene: {
        entities: {
          devStream: makeDevice(-18, -6, { label: 'dev-stream', tags: [{ text: '14 Rollouts Today', tone: 'green', icon: 'zap' }] }),
          doraEngine: makeBlock(-6, -2, { s: 4.8, h: 50, color: 'green', glyph: 'cpu', label: ['CD Pipeline'], sub: '14 rollouts' }),
          prodFleet: makeDb(6, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Production Fleet'], sub: 'continuous CD' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Deployment Frequency Telemetry', [
            `Window: Rolling 24 Hours`,
            `Total Deploys: 14 successful rollouts`,
            `Batch Size: Average 1 commit per deploy`,
            `Deployment Duration: 4m 12s per pipeline`,
            `= Small batch sizes eliminate release anxiety`,
          ], { icon: 'terminal' }),
        },
        links: {
          dd: makeLink('devStream', 'doraEngine', ['devStream', 'doraEngine'], { label: 'atomic batch' }),
          dp: makeLink('doraEngine', 'prodFleet', ['doraEngine', 'prodFleet'], { label: 'auto deploy' }),
        },
        flows: [{ route: ['dd', 'dp'], kind: 'speed', rate: 2.0 }],
      },
    },
    {
      short: 'Lead Time',
      chapter: 'throughput',
      title: 'Lead Time for Changes: Shrinking Commit-to-Production',
      body: [
        '<b>Lead Time for Changes (LTFC)</b> measures the duration from commit push to running live in production.',
        'By parallelizing test suites across ephemeral shards and eliminating manual change approval boards (CABs), lead time collapses from 3 weeks to 38 minutes.',
      ],
      callout: {
        kind: 'insight',
        text: 'Short lead time is the ultimate measure of engineering agility: an urgent CVE fix or customer feature reaches production in under an hour.',
      },
      changes: ['+ Replaced manual Change Approval Board with automated gates', '+ Ephemeral test shards execute test suite in 48 seconds', '+ Total commit-to-prod lead time reduced to 38 minutes'],
      metrics: { doraTier: 'Elite (LTFC)', deployFrequency: 'Continuous', leadTime: '38m (Fast Path)', cfrMttr: 'CFR < 5%' },
      scene: {
        entities: {
          devStream: makeDevice(-18, -6, { label: 'dev-stream', tags: [{ text: 'T=00:00 Commit', tone: 'blue', icon: 'gitBranch' }] }),
          doraEngine: makeBlock(-6, -2, { s: 4.8, h: 50, color: 'cyan', glyph: 'clock', label: ['Lead Time Engine'], sub: 'sharded tests' }),
          prodFleet: makeDb(6, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Production Fleet'], sub: 'T=38s in prod' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Lead Time Breakdown', [
            `T=00:00 - Git commit pushed to trunk`,
            `T=00:02 - Automated CI/CD pipeline triggered`,
            `T=00:15 - Security & unit test gates passed`,
            `T=00:25 - Canary verification healthy (0 errors)`,
            `T=00:38 - Live in 100% production (Lead Time = 38m)`,
          ], { icon: 'terminal' }),
        },
        links: {
          dd: makeLink('devStream', 'doraEngine', ['devStream', 'doraEngine'], { label: 'push commit' }),
          dp: makeLink('doraEngine', 'prodFleet', ['doraEngine', 'prodFleet'], { label: 'live in 38m' }),
        },
        flows: [{ route: ['dd', 'dp'], kind: 'speed', rate: 1.8 }],
      },
    },
    {
      short: 'Change Failure Rate',
      chapter: 'stability',
      title: 'Change Failure Rate: Blast Radius Containment',
      body: [
        '<b>Change Failure Rate (CFR)</b> is the percentage of deployments causing a degradation or outage.',
        'Elite teams do not expect code to be bug-free; instead, they contain the blast radius using <b>Canary Deployments</b>. The 5% canary catches errors early, keeping global CFR below 2%.',
      ],
      callout: {
        kind: 'caution',
        text: 'A 0% CFR is often a warning sign: it indicates the organization is moving too slowly, fearing any risk at the expense of business competitiveness.',
      },
      changes: ['+ Canary deployment isolated 5% traffic slice', '+ Automated Prometheus probe detected 5xx spike on canary', '+ Rollout halted automatically; zero impact to 95% fleet'],
      metrics: { doraTier: 'Elite (CFR)', deployFrequency: 'Continuous', leadTime: '38m', cfrMttr: 'CFR 1.8% (Target < 5%)' },
      scene: {
        entities: {
          devStream: makeDevice(-18, -6, { label: 'dev-stream', tags: [{ text: 'Live Traffic', icon: 'globe' }] }),
          doraEngine: makeBlock(-6, -2, { s: 4.8, h: 50, color: 'orange', glyph: 'balancer', label: ['Canary Router'], sub: 'auto rollback' }),
          prodFleet: makeDb(6, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Stable Fleet v1.8'], sub: '95% traffic' }),
          canaryPod: makeBlock(-4, 16, { s: 4.4, h: 48, color: 'red', glyph: 'alert', label: ['Canary Pod v1.9'], sub: 'blast radius' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Canary Health Evaluation', [
            `Stable Fleet (95%): http_5xx = 0.00% (Clean)`,
            `Canary Pod   (5%):  http_5xx = 3.82% (SPIKE)`,
            `Automated Decision: HALT ROLLOUT`,
            `Blast Radius: Restricted to 5% internal test traffic`,
            `Global Change Failure Rate maintained < 2%`,
          ], { icon: 'terminal' }),
        },
        links: {
          dd: makeLink('devStream', 'doraEngine', ['devStream', 'doraEngine'], { label: 'incoming load' }),
          dp: makeLink('doraEngine', 'prodFleet', ['doraEngine', 'prodFleet'], { label: '95% safe' }),
          dc: makeLink('doraEngine', 'canaryPod', ['doraEngine', 'canaryPod'], { label: '5% alert' }),
        },
        flows: [
          { route: ['dd', 'dp'], kind: 'speed', rate: 1.8 },
          { route: ['dd', 'dc'], kind: 'safe', rate: 0.8 },
        ],
      },
    },
    {
      short: 'MTTR Recovery',
      chapter: 'stability',
      title: 'Mean Time to Recovery: Instant Automated Rollback',
      body: [
        'When an incident occurs, low-performing teams spend hours troubleshooting and SSH-ing into servers ("mean time to debug").',
        'Elite teams practice <b>Mean Time to Recovery (MTTR) < 15 minutes</b> by triggering instant automated Git rollbacks: <code>git revert HEAD</code> deploys immediately, restoring healthy state before root cause analysis.',
      ],
      callout: {
        kind: 'tip',
        text: 'Fix the user experience first (rollback in 2 minutes), investigate the root cause second (postmortem in 24 hours).',
      },
      changes: ['+ Automated alert detected SLO latency breach', '+ PagerDuty webhook triggered git revert commit', '+ Production fleet rolled back to healthy SHA in 6m 20s'],
      metrics: { doraTier: 'Elite (MTTR)', deployFrequency: 'Continuous', leadTime: '38m', cfrMttr: 'MTTR 6m 20s' },
      scene: {
        entities: {
          devStream: makeDevice(-18, -6, { label: 'dev-stream', tags: [{ text: 'Incident Alarm', tone: 'red', icon: 'alert' }] }),
          doraEngine: makeBlock(-6, -2, { s: 4.8, h: 50, color: 'purple', glyph: 'shield', label: ['Rollback Gate'], sub: 'rollback SHA' }),
          prodFleet: makeDb(6, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Restored Fleet'], sub: 'MTTR 6m 20s' }),
          rollbackHook: makeBlock(-4, 16, { s: 4.4, h: 48, color: 'green', glyph: 'zap', label: ['Fast Recovery'], sub: 'auto rollback' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Incident MTTR Timeline', [
            `14:02:10 - Metric breach: p99 latency > 120ms`,
            `14:02:35 - Auto-rollback triggered via webhook`,
            `14:04:12 - Git revert commit built and verified`,
            `14:08:30 - Fleet healthy; error rate 0.00%`,
            `= Total MTTR: 6 minutes 20 seconds (Elite tier)`,
          ], { icon: 'terminal' }),
        },
        links: {
          dd: makeLink('devStream', 'doraEngine', ['devStream', 'doraEngine'], { label: 'trigger revert' }),
          dr: makeLink('doraEngine', 'rollbackHook', ['doraEngine', 'rollbackHook'], { label: 'rollback SHA' }),
          rp: makeLink('rollbackHook', 'prodFleet', ['rollbackHook', 'prodFleet'], { label: 'restore fleet' }),
        },
        flows: [{ route: ['dd', 'dr', 'rp'], kind: 'safe', rate: 1.6 }],
      },
    },
    {
      short: 'Error Budget',
      chapter: 'solution',
      title: 'SRE Error Budget: Data-Driven Shipping Governance',
      body: [
        'DORA metrics culminate in the <b>SRE Error Budget</b>: availability SLO is negotiated (e.g. 99.95%), and the remaining 0.05% error budget governs velocity.',
        'When the budget is healthy (> 20%), developers deploy rapidly. When the budget is depleted, feature deploys freeze automatically, turning all focus to reliability.',
      ],
      callout: {
        kind: 'insight',
        text: 'Error budgets create a self-regulating engineering equilibrium where speed and stability reinforce rather than oppose each other.',
      },
      changes: ['+ Live error budget calculated at 82% healthy balance', '+ Automated deployment policy authorizes high-velocity shipping', '+ Unified throughput and stability into single engineering SLA'],
      metrics: { doraTier: 'Elite Continuous', deployFrequency: '14/day', leadTime: '38m', cfrMttr: 'CFR 1.8% | MTTR 6m' },
      scene: {
        entities: {
          devStream: makeDevice(-18, -6, { label: 'dev-stream', tags: [{ text: 'High Velocity Flow', tone: 'green', icon: 'zap' }] }),
          doraEngine: makeBlock(-6, -2, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['Policy Engine'], sub: '82% budget' }),
          prodFleet: makeDb(6, 0, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Production Fleet'], sub: 'continuous CD' }),
          errorBudget: makeDb(14, 6, { s: 4.6, h: 48, color: 'purple', glyph: 'database', label: ['Error Budget'], sub: '82% budget' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'SRE Error Budget Policy', [
            `Monthly SLO Target:     99.95% Availability`,
            `Actual Rolling SLI:     99.98% Healthy`,
            `Allowed Downtime:       21.6 minutes`,
            `Downtime Consumed:      3.8 minutes (18%)`,
            `Error Budget Remaining: 82% -> STATUS: SHIP FAST!`,
          ], { icon: 'terminal' }),
        },
        links: {
          dd: makeLink('devStream', 'doraEngine', ['devStream', 'doraEngine'], { label: 'feature push' }),
          dp: makeLink('doraEngine', 'prodFleet', ['doraEngine', 'prodFleet'], { label: 'authorized' }),
          pe: makeLink('prodFleet', 'errorBudget', ['prodFleet', 'errorBudget'], { label: 'record SLI' }),
        },
        flows: [{ route: ['dd', 'dp', 'pe'], kind: 'budget', rate: 1.8 }],
      },
    },
  ],
};
