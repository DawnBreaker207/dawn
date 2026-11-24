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

export const devopsDoraMetricsLesson = {
  id: 'devops-dora-metrics',
  title: '4 DORA Metrics & SRE Error Budget Governance',
  summary: 'Measure engineering velocity and stability using the 4 DORA Metrics (Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR). Connect metrics to SRE Error Budgets to balance feature speed with uptime.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['deploymentFreq', 'leadTime', 'changeFailureRate', 'mttrHours'],
  legend: ['flow', ['metric', 'telemetry data'], ['policy', 'error budget policy'], ['gate', 'release gate']],
  goals: [
    { text: 'The 4 Core DORA Metrics: Throughput vs Stability', step: 1 },
    { text: 'Deployment Frequency (DF): Moving to on-demand daily deploys', step: 2 },
    { text: 'Lead Time for Changes (LTFC): Commit to production in < 1 hour', step: 3 },
    { text: 'Change Failure Rate (CFR): Limiting blast radius via canaries', step: 4 },
    { text: 'Mean Time to Recovery (MTTR): Fast rollbacks in < 15 minutes', step: 5 },
    { text: 'SRE Error Budget governance & automated release freezes', step: 6 },
  ],
  steps: [
    {
      short: '4 DORA Metrics',
      chapter: 'concept',
      title: 'The 4 Core DORA Metrics: Throughput & Stability',
      body: [
        'Google\'s DevOps Research and Assessment (DORA) established 4 key metrics that balance speed with safety:',
        '• <b>Throughput:</b> Deployment Frequency (DF) & Lead Time for Changes (LTFC).<br>' +
        '• <b>Stability:</b> Change Failure Rate (CFR) & Mean Time to Recovery (MTTR).',
      ],
      callout: {
        kind: 'insight',
        text: 'Elite engineering teams do not sacrifice stability for speed — frequent small deployments directly result in lower failure rates and faster recovery.',
      },
      metrics: { deploymentFreq: 'On-Demand (Daily)', leadTime: '< 1 Hour', changeFailureRate: '< 5%', mttrHours: '< 15 Minutes' },
      scene: {
        entities: {
          throughputNode: y(-10, -18, { label: 'throughput', tags: [{ text: 'Velocity: DF & LTFC', tone: 'blue', icon: 'clock' }] }),
          doraEngine: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'shield', label: ['DORA Governance'], sub: 'Speed vs Stability Equilibrium' }),
          stabilityNode: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['Stability Fleet'], sub: 'CFR < 5% | MTTR < 15m' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'The 4 DORA Metrics', [
            `1. Deployment Frequency:    Multiple / day`,
            `2. Lead Time for Changes:   < 1 hour`,
            `3. Change Failure Rate:     < 5%`,
            `4. Time to Restore Service: < 15 minutes`,
            `= Elite Performer Industry Benchmark`,
          ], { icon: 'terminal' }),
          zDora: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'DORA METRICS ARCHITECTURE'),
        },
        links: {
          td: h('throughputNode', 'doraEngine', ['throughputNode', 'doraEngine'], { label: 'ship velocity' }),
          sd: h('doraEngine', 'stabilityNode', ['doraEngine', 'stabilityNode'], { label: 'reliability signals' }),
        },
        flows: [{ route: ['td', 'sd'], kind: 'metric', rate: 1.5 }],
      },
    },
    {
      short: 'Deployment Frequency',
      chapter: 'execution',
      title: 'Deployment Frequency (DF): Shipping Multiple Times per Day',
      body: [
        'Low performers deploy once every 1 to 6 months in massive, terrifying releases. High performers deploy multiple times per day.',
        'Frequent small releases reduce the change delta per deployment to tens of lines of code rather than thousands, making verification trivial.',
      ],
      callout: {
        kind: 'tip',
        text: 'If deploying to production hurts, do it more often. Frequency forces teams to automate manual friction away.',
      },
      changes: ['+ Decomposed monthly releases into independent microservice deploys', '+ Automated continuous deployment on main merge', '+ Deployment frequency increased from 1/month to 14/day'],
      metrics: { deploymentFreq: 'Elite (14 Deploys / Day)', leadTime: 'Standard', changeFailureRate: 'Low', mttrHours: 'Fast' },
      scene: {
        entities: {
          devStream: y(-10, -18, { label: 'dev-stream', tags: [{ text: '14 Merged PRs / Day', tone: 'green', icon: 'gitBranch' }] }),
          autoDeployer: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['Auto Deployer'], sub: 'Continuous Delivery' }),
          productionCluster: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Production Fleet'], sub: '14 Successful Rollouts' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Deployment Frequency Telemetry', [
            `Deployments (Today): 14 successful`,
            `Batch size: avg 84 lines / commit`,
            `Deploy duration: 4m 12s per release`,
            `Zero manual change advisory boards (CAB)`,
            `= Continuous Flow active`,
          ], { icon: 'terminal' }),
          zDf: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'DEPLOYMENT FREQUENCY METRICS'),
        },
        links: {
          da: h('devStream', 'autoDeployer', ['devStream', 'autoDeployer'], { label: 'continuous push' }),
          ap: h('autoDeployer', 'productionCluster', ['autoDeployer', 'productionCluster'], { label: 'automated rollout' }),
        },
        flows: [{ route: ['da', 'ap'], kind: 'metric', rate: 1.8 }],
      },
    },
    {
      short: 'Lead Time for Changes',
      chapter: 'execution',
      title: 'Lead Time for Changes (LTFC): Commit to Production in < 1 Hour',
      body: [
        '<b>Lead Time for Changes</b> measures the time from the developer’s first commit to that code serving traffic in production.',
        'By eliminating manual approval gates, automated CI/CD pipelines cut lead time from 3 weeks to 38 minutes.',
      ],
      callout: {
        kind: 'insight',
        text: 'Short lead time allows businesses to capitalize on market opportunities and hotfix critical security vulnerabilities instantly.',
      },
      changes: ['+ Replaced manual staging QA with automated end-to-end tests', '+ Automated container image build and vulnerability scan', '+ Commit-to-production latency: 38 minutes'],
      metrics: { deploymentFreq: 'Elite', leadTime: 'Elite (38 Minutes)', changeFailureRate: 'Low', mttrHours: 'Fast' },
      scene: {
        entities: {
          commitStart: y(-10, -18, { label: 'commit-time', tags: [{ text: 'T=00:00 Commit', icon: 'terminal' }] }),
          fastPipeline: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'clock', label: ['12m CI Test Matrix'], sub: 'Parallelized test shards' }),
          prodArrive: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['Live Production'], sub: 'T=00:38 Live in Prod' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Lead Time Breakdown', [
            `00:00 Developer commits code`,
            `00:02 PR checks pass (2m)`,
            `00:15 Peer review & merge (13m)`,
            `00:27 Full CI matrix & security (12m)`,
            `00:38 Canary rollout complete (11m)`,
            `= Total Lead Time: 38 minutes`,
          ], { icon: 'terminal' }),
          zLtfc: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'LEAD TIME PIPELINE VELOCITY'),
        },
        links: {
          cf: h('commitStart', 'fastPipeline', ['commitStart', 'fastPipeline'], { label: 'git push' }),
          fp: h('fastPipeline', 'prodArrive', ['fastPipeline', 'prodArrive'], { label: 'canary deploy' }),
        },
        flows: [{ route: ['cf', 'fp'], kind: 'metric', rate: 1.6 }],
      },
    },
    {
      short: 'Change Failure Rate',
      chapter: 'investigation',
      title: 'Change Failure Rate (CFR): Controlling Blast Radius',
      body: [
        '<b>Change Failure Rate</b> measures what percentage of releases cause an incident, rollback, or degraded service.',
        'High performers keep CFR under 5% using progressive delivery (Canaries, Feature Flags). Even if a bug escapes tests, it impacts only 5% of users before automated rollback triggers.',
      ],
      callout: {
        kind: 'caution',
        text: 'A high CFR indicates brittle automated tests or lack of environment parity between staging and production.',
      },
      changes: ['+ Deployed canary release with 5% traffic weight', '+ Detected 5xx error rate spike on canary', '+ Automated rollback reverted deployment in 45s'],
      metrics: { deploymentFreq: 'Elite', leadTime: 'Elite', changeFailureRate: 'Elite (2.1%)', mttrHours: 'Fast' },
      scene: {
        entities: {
          canaryDeploy: y(-10, -18, { label: 'canary-rollout', tags: [{ text: 'Canary: 5% Users', tone: 'amber', icon: 'zap' }] }),
          rollbackSentry: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'shield', label: ['Prometheus Sentry'], sub: '5xx spike -> Auto Rollback' }),
          stableState: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Stable Version'], sub: 'Blast radius contained' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Canary Health Evaluation', [
            `Total releases (month): 320`,
            `Failed rollouts: 7 (Rollback triggered)`,
            `Change Failure Rate: 7 / 320 = 2.18%`,
            `User blast radius: < 5% during failures`,
            `= Elite Benchmark (< 5% CFR) Achieved`,
          ], { icon: 'terminal' }),
          zCfr: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'CHANGE FAILURE RATE CONTAINMENT'),
        },
        links: {
          cr: h('canaryDeploy', 'rollbackSentry', ['canaryDeploy', 'rollbackSentry'], { label: 'monitor error rate' }),
          rs: h('rollbackSentry', 'stableState', ['rollbackSentry', 'stableState'], { label: 'abort & revert' }),
        },
        flows: [{ route: ['cr', 'rs'], kind: 'metric', rate: 1.4 }],
      },
    },
    {
      short: 'MTTR Recovery',
      chapter: 'execution',
      title: 'Mean Time to Recovery (MTTR): Restoring Service in Minutes',
      body: [
        'Failures will inevitably occur in complex systems. What distinguishes elite engineering teams is <b>Mean Time to Recovery (MTTR)</b>.',
        'With GitOps and declarative infrastructure, recovering from a bad deployment does not require debugging under pressure — simply run <code>git revert HEAD</code> and push, restoring the last known good state in minutes.',
      ],
      callout: {
        kind: 'tip',
        text: 'Rollback first, investigate later. Never attempt to "hotfix forward" on live production during an active outage.',
      },
      changes: ['+ Outage detected at 15:02:10', '+ Issued git revert HEAD at 15:04:12', '+ Full service restored at 15:08:30 (MTTR: 6m 20s)'],
      metrics: { deploymentFreq: 'Elite', leadTime: 'Elite', changeFailureRate: '2.1%', mttrHours: 'Elite (6m 20s)' },
      scene: {
        entities: {
          alarmTrigger: y(-10, -18, { label: 'alert', tags: [{ text: 'P1 Outage Alert', tone: 'red', icon: 'alert' }] }),
          instantRevert: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'terminal', label: ['git revert HEAD'], sub: 'Instant rollback commit' }),
          restoredFleet: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['Restored Production'], sub: 'Full recovery in 6m 20s' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Incident MTTR Timeline', [
            `15:02:10 High 500 error rate alert`,
            `15:03:00 SRE acknowledges pager`,
            `15:04:12 git revert 4b9a1e merged`,
            `15:06:40 ArgoCD syncs prior image`,
            `15:08:30 All error rates return to 0.00%`,
            `= Total MTTR: 6 minutes 20 seconds`,
          ], { icon: 'terminal' }),
          zMttr: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'RAPID INCIDENT RECOVERY (MTTR)'),
        },
        links: {
          ai: h('alarmTrigger', 'instantRevert', ['alarmTrigger', 'instantRevert'], { label: 'trigger rollback' }),
          ir: h('instantRevert', 'restoredFleet', ['instantRevert', 'restoredFleet'], { label: 'deploy previous SHA' }),
        },
        flows: [{ route: ['ai', 'ir'], kind: 'metric', rate: 1.8 }],
      },
    },
    {
      short: 'Error Budget Policy',
      chapter: 'solution',
      title: 'SRE Error Budget Governance: Aligning Dev & Ops',
      body: [
        'An <b>Error Budget</b> equals <code>100% - SLO</code>.',
        'If the team maintains an availability SLO of 99.95%, they have a budget of 21.6 minutes of downtime per month.',
        '<b>Automated Governance:</b> If error budget drops below 20%, feature releases freeze automatically. All engineering capacity is diverted to refactoring, automated testing, and reliability.',
      ],
      callout: {
        kind: 'insight',
        text: 'Error budgets create a self-regulating engineering ecosystem where reliability debt is paid off immediately before systemic rot sets in.',
      },
      changes: ['+ SLO tracked automatically via Prometheus SLIs', '+ Error budget balance at 82% (Healthy)', '+ Developers ship features autonomously with zero CAB friction'],
      metrics: { deploymentFreq: 'Governed Flow', leadTime: 'Fast', changeFailureRate: 'Controlled', mttrHours: 'SRE Protected' },
      scene: {
        entities: {
          sloTracker: y(-10, -18, { label: 'slo-monitor', tags: [{ text: 'SLO: 99.95%', tone: 'green', icon: 'clock' }] }),
          budgetGate: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['Error Budget Gate'], sub: '82% Remaining -> Ship!' }),
          releaseTrain: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Production Fleet'], sub: 'Continuous Flow' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'SRE Error Budget Policy', [
            `SLO Target:       99.95% Availability`,
            `Rolling 30d SLI:  99.982%`,
            `Allowed Downtime: 21.6 minutes`,
            `Consumed:         3.8 minutes (17.5%)`,
            `Budget Policy:    HEALTHY (> 20%)`,
            `= Feature deployments unhindered`,
          ], { icon: 'terminal' }),
          zSre: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ERROR BUDGET GOVERNANCE LOOP'),
        },
        links: {
          sb: h('sloTracker', 'budgetGate', ['sloTracker', 'budgetGate'], { label: 'budget telemetry' }),
          br: h('budgetGate', 'releaseTrain', ['budgetGate', 'releaseTrain'], { label: 'authorize deployment' }),
        },
        flows: [{ route: ['sb', 'br'], kind: 'policy', rate: 1.6 }],
      },
    },
  ],
};
