// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const devopsDoraMetricsLesson = {
  id: 'devops-dora-metrics',
  title: '4 DORA Metrics & SRE Error Budget Governance',
  summary: 'Measure engineering velocity and stability using the 4 DORA Metrics (Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR). Connect metrics to SRE Error Budgets to balance feature speed with uptime.',
  minutes: 20,
  level: 'intermediate',
  metrics: ['deploymentFreq', 'leadTime', 'changeFailureRate', 'mttrHours'],
  legend: ['flow', ['metric', 'telemetry data flow'], ['policy', 'error budget policy']],
  goals: [
    { text: 'The 4 Core DORA Metrics: Throughput vs Stability', step: 1 },
    { text: 'Elite Performer benchmarks according to Google DORA', step: 2 },
    { text: 'SRE Error Budget governance and release freezes', step: 3 },
  ],
  steps: [
    {
      short: '4 DORA Metrics',
      chapter: 'concept',
      title: 'The 4 Core DORA Metrics: Throughput & Stability',
      body: [
        'Google\'s DevOps Research and Assessment (DORA) established 4 key metrics that balance speed with safety:',
        '• <b>Deployment Frequency (DF):</b> How often code is successfully deployed to production.<br>' +
        '• <b>Lead Time for Changes (LTFC):</b> Time taken from commit to running in production.<br>' +
        '• <b>Change Failure Rate (CFR):</b> Percentage of deployments causing production degradation.<br>' +
        '• <b>Mean Time to Recovery (MTTR):</b> How quickly the system restores service after an outage.',
      ],
      callout: {
        kind: 'insight',
        text: 'Elite engineering teams do not choose between speed and reliability — high deployment frequency correlates with LOWER failure rates and FASTER recovery.',
      },
      metrics: { deploymentFreq: 'On-Demand (Daily)', leadTime: '< 1 Hour', changeFailureRate: '< 5%', mttrHours: '< 15 Minutes' },
      scene: {
        entities: {
          throughput: d(-10, 0, { color: 'blue', glyph: 'clock', label: ['Velocity: DF & LTFC'], sub: 'Deploy multiple times per day' }),
          balanceEngine: d(0, 0, { color: 'purple', glyph: 'shield', label: ['DORA Governance'], sub: 'Throughput vs Stability' }),
          stability: d(10, 0, { color: 'green', glyph: 'database', label: ['Reliability: CFR & MTTR'], sub: 'CFR < 5% | MTTR < 15m' }),
          zDora: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'THE 4 DORA METRICS EQUILIBRIUM'),
        },
        links: {
          tb: h('throughput', 'balanceEngine', ['throughput', 'balanceEngine'], { label: 'ship velocity' }),
          sb: h('stability', 'balanceEngine', ['stability', 'balanceEngine'], { label: 'uptime signals' }),
        },
        flows: [{ route: ['tb', 'sb'], kind: 'metric', rate: 1.5 }],
      },
    },
    {
      short: 'Performance Tiers',
      chapter: 'benchmarks',
      title: 'DORA Benchmark Tiers: Low, Medium, High & Elite',
      body: [
        'DORA categorizes industry teams into 4 performance tiers:',
        '• <b>Elite:</b> Multiple deploys per day; lead time < 1 day; MTTR < 1 hour; CFR < 5%.<br>' +
        '• <b>High:</b> Once per week to once per month; lead time 1 week; MTTR < 1 day.<br>' +
        '• <b>Low:</b> Deploys every 6+ months; lead time > 6 months; MTTR > 1 week; CFR > 40%.',
        'Automated CI/CD, trunk-based development, and comprehensive testing are the primary drivers of elite status.',
      ],
      callout: {
        kind: 'tip',
        text: 'Small, incremental releases shrink the blast radius of failures, making rollbacks fast and CFR negligible.',
      },
      changes: ['+ Adopted trunk-based development and automated test gates', '+ Shifted deployment frequency from monthly to on-demand', '+ Cut lead time for changes from 3 weeks to 45 minutes'],
      metrics: { deploymentFreq: 'Elite (Multiple / Day)', leadTime: 'Elite (45 Minutes)', changeFailureRate: 'Elite (2.1%)', mttrHours: 'Elite (12 Minutes)' },
      scene: {
        entities: {
          commit: d(-10, 0, { color: 'blue', glyph: 'terminal', label: ['Developer Commit'], sub: 'Small PR (< 200 lines)' }),
          automatedGate: d(0, 0, { color: 'cyan', glyph: 'cpu', label: ['Automated Pipeline'], sub: '12m test & container build' }),
          prodDeploy: d(10, 0, { color: 'green', glyph: 'boxes', label: ['Canary Deployment'], sub: 'Auto-promoted to 100%' }),
          zTiers: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'ELITE CONTINUOUS DELIVERY STREAM'),
        },
        links: {
          ca: h('commit', 'automatedGate', ['commit', 'automatedGate'], { label: 'PR merge' }),
          ap: h('automatedGate', 'prodDeploy', ['automatedGate', 'prodDeploy'], { label: 'canary rollout' }),
        },
        flows: [{ route: ['ca', 'ap'], kind: 'metric', rate: 1.8 }],
      },
    },
    {
      short: 'Error Budget Policy',
      chapter: 'solution',
      title: 'SRE Error Budgets & Deployment Gate Governance',
      body: [
        'An <b>Error Budget</b> equals <code>100% - SLO</code> (e.g., a 99.9% uptime SLO provides a 0.1% downtime budget per quarter).',
        '<b>Governance Policy:</b> As long as error budget is healthy (> 20% remaining), developers deploy features rapidly with automated approvals.',
        'If an incident burns through the budget, an automated freeze halts new feature deployments, redirecting 100% of engineering bandwidth to reliability, testing, and debt cleanup.',
      ],
      callout: {
        kind: 'insight',
        text: 'Error budgets create a mathematical contract between Product and SRE, ending disputes over release velocity.',
      },
      changes: ['+ SLO defined at 99.95% Availability', '+ Error budget tracker hooked into deployment gating', '+ Feature deployment policy automatically enforced'],
      metrics: { deploymentFreq: 'Automated Gate', leadTime: 'Standard', changeFailureRate: 'Governed', mttrHours: 'Strict SRE Policy' },
      scene: {
        entities: {
          sloTracker: d(-10, 0, { color: 'green', glyph: 'clock', label: ['SLO Tracker (99.95%)'], sub: '82% Budget Remaining' }),
          policyGate: d(0, 0, { color: 'purple', glyph: 'shield', label: ['Deployment Gatekeeper'], sub: 'Budget > 20% -> Approved' }),
          releaseTrain: d(10, 0, { color: 'blue', glyph: 'boxes', label: ['Production Release'], sub: 'Features shipping unhindered' }),
          zSre: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'ERROR BUDGET GOVERNANCE LOOP'),
        },
        links: {
          sp: h('sloTracker', 'policyGate', ['sloTracker', 'policyGate'], { label: 'telemetry budget feed' }),
          pr: h('policyGate', 'releaseTrain', ['policyGate', 'releaseTrain'], { label: 'release approval' }),
        },
        flows: [{ route: ['sp', 'pr'], kind: 'policy', rate: 1.4 }],
      },
    },
  ],
};
