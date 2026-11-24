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

export const devopsCultureSilosLesson = {
  id: 'devops-culture-silos',
  title: 'From Dev-Ops Silos to CAMS & Shared Ownership',
  summary: 'Deconstruct the historical "Wall of Confusion" between Development and Operations. Explore the CAMS model (Culture, Automation, Measurement, Sharing), Shift-Left quality gates, and SRE error budget governance.',
  minutes: 25,
  level: 'beginner',
  metrics: ['incentiveAlignment', 'wallOfConfusion', 'feedbackLatency', 'deploymentFriction'],
  legend: ['flow', ['handover', 'ticket handover'], ['feedback', 'continuous feedback loop'], ['gate', 'automated gate']],
  goals: [
    { text: 'The Wall of Confusion & opposing organizational incentives', step: 1 },
    { text: 'The CAMS framework (Culture, Automation, Measurement, Sharing)', step: 2 },
    { text: 'Shift-Left quality gates & PR automated testing', step: 3 },
    { text: 'Shift-Right observability & production canaries', step: 4 },
    { text: 'Blameless postmortems & incident learning', step: 5 },
    { text: 'SRE Error Budget & shared SLA ownership', step: 6 },
  ],
  steps: [
    {
      short: 'The Silo Wall',
      chapter: 'setup',
      title: 'The Wall of Confusion: Dev vs Ops Incentive Clash',
      body: [
        'Historically, Development teams were evaluated on <b>feature velocity</b>, while Operations teams were measured on <b>zero downtime</b>.',
        'This created the infamous "Wall of Confusion": Developers threw code over the wall into ticket queues (Jira/ServiceNow), while Ops struggled with unrepeatable manual runbooks during midnight deployments.',
      ],
      callout: {
        kind: 'caution',
        text: 'Opposing incentives create adversarial teams. Ops views changes as risks to avoid; Dev views Ops as roadblocks.',
      },
      metrics: { incentiveAlignment: 'Opposed (0%)', wallOfConfusion: 'Fortified Wall', feedbackLatency: 'Weeks (Late Ticket)', deploymentFriction: 'Severe (Weekend War-room)' },
      scene: {
        entities: {
          devTeam: y(-10, -18, { label: 'dev-team', tags: [{ text: 'Ship 10 Features', tone: 'blue', icon: 'zap' }] }),
          wall: d(0, -6, { s: 4.8, h: 54, color: 'red', glyph: 'shield', label: ['Wall of Confusion'], sub: 'ticket queues & silos' }),
          opsTeam: b(10, 8, { s: 4.6, h: 48, color: 'purple', glyph: 'database', label: ['Ops Team'], sub: 'Uptime 99.9% target' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Incident Ticket: PROD-892', [
            `Ticket: PROD-892 · Priority: Blocker`,
            `Status: OPEN · Assignee: sysadmin`,
            `Error: Missing libc.so.6 on host worker-04`,
            `Comment: "Works on my machine!" — Dev`,
            `Comment: "Deployment aborted." — Ops`,
          ], { icon: 'terminal' }),
          zSilo: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'HISTORICAL SILOED ORGANIZATIONAL MODEL'),
        },
        links: {
          dw: h('devTeam', 'wall', ['devTeam', 'wall'], { label: 'toss code over wall' }),
          wo: h('wall', 'opsTeam', ['wall', 'opsTeam'], { label: 'manual deployment ticket' }),
        },
        flows: [{ route: ['dw', 'wo'], kind: 'handover', rate: 1.2 }],
      },
    },
    {
      short: 'The CAMS Model',
      chapter: 'framework',
      title: 'The CAMS Model: Culture, Automation, Measurement, Sharing',
      body: [
        'DevOps is not a tooling package — it is an organizational philosophy defined by <b>CAMS</b>:',
        '• <b>Culture:</b> "You build it, you run it." Developers take on-call ownership.<br>' +
        '• <b>Automation:</b> Eliminating manual snowflakes via declarative infrastructure.<br>' +
        '• <b>Measurement:</b> Telemetry and DORA metrics steering architecture.<br>' +
        '• <b>Sharing:</b> Cross-functional transparency and blameless retrospectives.',
      ],
      callout: {
        kind: 'insight',
        text: 'CAMS aligns organizational incentives around end-to-end customer value rather than departmental silos.',
      },
      changes: ['+ Demolished the Wall of Confusion', '+ Formed cross-functional team with shared SLAs', '+ Automated declarative pipeline replaces manual runbooks'],
      metrics: { incentiveAlignment: 'Unified (100%)', wallOfConfusion: 'Demolished', feedbackLatency: 'Minutes (Automated CI)', deploymentFriction: 'Low (Self-service)' },
      scene: {
        entities: {
          crossTeam: y(-8, -18, { label: 'cross-functional', tags: [{ text: 'Dev + Ops Unified', tone: 'green', icon: 'shield' }] }),
          autoPipeline: d(0, -5, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['Automated CI/CD'], sub: 'Pipeline-as-code' }),
          sharedTelemetry: b(8, 8, { s: 4.6, h: 48, color: 'green', glyph: 'clock', label: ['Shared Telemetry'], sub: 'APM, traces, alerts' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'CAMS Framework Contract', [
            `Culture:     You build it, you run it`,
            `Automation:  Zero manual SSH to production`,
            `Measurement: DORA metrics + Error budgets`,
            `Sharing:     Blameless retrospectives`,
            `= Unified engineering velocity & safety`,
          ], { icon: 'terminal' }),
          zCams: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'CAMS UNIFIED OWNERSHIP MODEL'),
        },
        links: {
          ca: h('crossTeam', 'autoPipeline', ['crossTeam', 'autoPipeline'], { label: 'push commit' }),
          as: h('autoPipeline', 'sharedTelemetry', ['autoPipeline', 'sharedTelemetry'], { label: 'observable release' }),
        },
        flows: [{ route: ['ca', 'as'], kind: 'feedback', rate: 1.5 }],
      },
    },
    {
      short: 'Shift-Left CI',
      chapter: 'execution',
      title: 'Shift-Left: Automated Quality & Security PR Gates',
      body: [
        'In the <b>Shift-Left</b> model, tests, linters, and security scanners run early in the developer’s pull request, long before code touches staging.',
        'Static Application Security Testing (SAST), dependency vulnerability scanning (Snyk/Trivy), and unit tests run in parallel ephemeral microVMs.',
      ],
      callout: {
        kind: 'tip',
        text: 'Fixing a bug during a pull request costs 10x less than fixing it in staging, and 100x less than resolving a production outage.',
      },
      changes: ['+ PR pull_request webhook received', '+ SAST security scanner and unit tests triggered', '+ Branch protected until 100% check pass'],
      metrics: { incentiveAlignment: 'Shift-Left Active', wallOfConfusion: '0', feedbackLatency: '3m 12s (Fast PR Check)', deploymentFriction: 'Automated Gate' },
      scene: {
        entities: {
          prAuthor: y(-10, -18, { label: 'author', tags: [{ text: 'PR #104: feat/auth', tone: 'blue', icon: 'gitBranch' }] }),
          prGates: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['Shift-Left Gates'], sub: 'SAST + Unit + Lint' }),
          mainBranch: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'gitBranch', label: ['main Branch'], sub: 'Protected merge target' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'GitHub Actions PR Matrix', [
            `✓ unit-tests (node 20)        passed (42s)`,
            `✓ dependency-vulnerability    0 high/crit`,
            `✓ sonarqube-quality-gate      A rating`,
            `✓ e2e-smoke-test              100% pass`,
            `= All checks passed: Ready to merge`,
          ], { icon: 'terminal' }),
          zLeft: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'SHIFT-LEFT QUALITY VERIFICATION'),
        },
        links: {
          pg: h('prAuthor', 'prGates', ['prAuthor', 'prGates'], { label: 'open PR' }),
          gm: h('prGates', 'mainBranch', ['prGates', 'mainBranch'], { label: 'auto-approve merge' }),
        },
        flows: [{ route: ['pg', 'gm'], kind: 'gate', rate: 1.6 }],
      },
    },
    {
      short: 'Shift-Right Canaries',
      chapter: 'execution',
      title: 'Shift-Right: Canary Deployments & Live Telemetry',
      body: [
        '<b>Shift-Right</b> tests applications directly against live production traffic using <b>Canary Deployments</b> and Feature Flags.',
        'A router sends 95% of traffic to the stable version and 5% to the new canary. If Prometheus detects an error rate spike, the router automatically rolls back in seconds.',
      ],
      callout: {
        kind: 'insight',
        text: 'Production is the only environment with real users, live data skew, and unpredictable traffic patterns. Shift-right limits blast radius to 5%.',
      },
      changes: ['+ Deployed canary container with 5% traffic split', '+ Prometheus monitored HTTP 5xx error rate', '+ Zero user-reported downtime during rollout'],
      metrics: { incentiveAlignment: 'Shift-Right Active', wallOfConfusion: '0', feedbackLatency: 'Realtime (APM stream)', deploymentFriction: '5% Canary Split' },
      scene: {
        entities: {
          traffic: y(-10, -18, { label: 'users', tags: [{ text: 'Live Traffic', icon: 'globe' }] }),
          canaryRouter: d(0, -6, { s: 4.8, h: 50, color: 'orange', glyph: 'balancer', label: ['Canary Router'], sub: '95% Stable / 5% Canary' }),
          stableFleet: b(10, 2, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Stable Fleet v1.8'], sub: '95% traffic (HTTP 200)' }),
          canaryPod: d(10, 12, { s: 4.4, h: 48, color: 'cyan', glyph: 'zap', label: ['Canary Pod v1.9'], sub: '5% traffic (Monitored)' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Prometheus Canary Telemetry', [
            `router: split: stable=95% canary=5%`,
            `v1.8 stable: http_5xx_rate = 0.01%`,
            `v1.9 canary: http_5xx_rate = 0.02%`,
            `p99 latency: 42ms (threshold < 80ms)`,
            `= Status: Healthy -> Promoting to 25%`,
          ], { icon: 'terminal' }),
          zRight: x({ x0: -14, x1: 14, y0: -22, y1: 16 }, 'SHIFT-RIGHT PROGRESSIVE DELIVERY'),
        },
        links: {
          tc: h('traffic', 'canaryRouter', ['traffic', 'canaryRouter'], { label: 'incoming requests' }),
          cs: h('canaryRouter', 'stableFleet', ['canaryRouter', 'stableFleet'], { label: '95% load' }),
          cc: h('canaryRouter', 'canaryPod', ['canaryRouter', 'canaryPod'], { label: '5% canary' }),
        },
        flows: [
          { route: ['tc', 'cs'], kind: 'feedback', rate: 1.8 },
          { route: ['tc', 'cc'], kind: 'gate', rate: 0.6 },
        ],
      },
    },
    {
      short: 'Blameless Postmortem',
      chapter: 'investigation',
      title: 'Blameless Postmortems: Learning from Failures',
      body: [
        'When outages occur, traditional teams play the blame game ("Who pushed this bad commit?").',
        'DevOps teams conduct <b>Blameless Postmortems</b> with the core assumption: <em>Humans make mistakes because our tooling and guardrails allowed them to.</em>',
        'Outages are treated as free tuition to harden the deployment pipeline against entire classes of failure.',
      ],
      callout: {
        kind: 'tip',
        text: 'In a blameless culture, engineers speak openly about bugs and near-misses without fear of punishment.',
      },
      changes: ['+ Incident timeline reconstructed from APM logs', '+ Identified missing canary threshold as root cause', '+ Action item: Added automated rollback hook'],
      metrics: { incentiveAlignment: 'Psychological Safety', wallOfConfusion: '0', feedbackLatency: 'Postmortem in 24h', deploymentFriction: 'Continuous Learning' },
      scene: {
        entities: {
          incident: y(-10, -18, { label: 'incident', tags: [{ text: 'Outage Severity 2', tone: 'red', icon: 'alert' }] }),
          retrospective: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'terminal', label: ['Blameless Review'], sub: 'Timeline & 5 Whys' }),
          hardenedCi: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'shield', label: ['Hardened Pipeline'], sub: 'Automated safeguard added' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Postmortem Action Items', [
            `Timeline: 14:02 DB connection exhausted`,
            `Root Cause: Missing pool limit in config`,
            `Why 1: No lint rule for pool size`,
            `Why 2: Staging config diverged from prod`,
            `Action: Enforce schema lint in CI gate`,
          ], { icon: 'terminal' }),
          zPost: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'BLAMELESS LEARNING LOOP'),
        },
        links: {
          ir: h('incident', 'retrospective', ['incident', 'retrospective'], { label: 'incident review' }),
          rh: h('retrospective', 'hardenedCi', ['retrospective', 'hardenedCi'], { label: 'add guardrail' }),
        },
        flows: [{ route: ['ir', 'rh'], kind: 'feedback', rate: 1.4 }],
      },
    },
    {
      short: 'Error Budget Policy',
      chapter: 'solution',
      title: 'SRE Error Budgets: Mathematical Release Governance',
      body: [
        'An <b>Error Budget</b> equals <code>100% - SLO</code> (e.g. 99.95% availability allows 21.6 minutes of downtime per month).',
        '<b>Automated Governance Policy:</b> When the error budget is healthy (> 20%), developers ship features rapidly with automated approvals. If an incident depletes the budget, feature shipping halts, redirecting 100% of engineering bandwidth to reliability.',
      ],
      callout: {
        kind: 'insight',
        text: 'Error budgets transform the subjective debate between "speed vs stability" into an objective mathematical contract.',
      },
      changes: ['+ SLO calculated continuously from Prometheus SLIs', '+ Error budget balance at 82% (Healthy)', '+ Automated release gates allow rapid deploys'],
      metrics: { incentiveAlignment: 'SRE Mathematical SLA', wallOfConfusion: '0', feedbackLatency: 'Continuous SLI', deploymentFriction: 'Autonomous Release' },
      scene: {
        entities: {
          sloTracker: y(-10, -18, { label: 'slo-monitor', tags: [{ text: 'SLO 99.95% Active', tone: 'green', icon: 'clock' }] }),
          policyGate: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['Error Budget Gate'], sub: '82% Remaining -> Ship!' }),
          prodFleet: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['Production Fleet'], sub: 'Continuous Delivery Flow' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'SRE Error Budget Balance', [
            `Target SLO:      99.95% Availability`,
            `Current SLI:     99.98% (Rolling 30d)`,
            `Budget Total:    21.6 minutes / month`,
            `Budget Consumed: 3.8 minutes (18%)`,
            `Budget Status:   HEALTHY -> Deployments ON`,
          ], { icon: 'terminal' }),
          zSre: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'SRE ERROR BUDGET GOVERNANCE'),
        },
        links: {
          sp: h('sloTracker', 'policyGate', ['sloTracker', 'policyGate'], { label: 'telemetry feed' }),
          pf: h('policyGate', 'prodFleet', ['policyGate', 'prodFleet'], { label: 'authorize release' }),
        },
        flows: [{ route: ['sp', 'pf'], kind: 'gate', rate: 1.6 }],
      },
    },
  ],
};
