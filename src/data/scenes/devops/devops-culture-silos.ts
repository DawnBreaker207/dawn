// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const devopsCultureSilosLesson = {
  id: 'devops-culture-silos',
  title: 'From Dev-Ops Silos to CAMS & Shared Ownership',
  summary: 'Deconstruct the historical "Wall of Confusion" between Development and Operations. Explore the CAMS model (Culture, Automation, Measurement, Sharing) and how shared ownership eliminates finger-pointing.',
  minutes: 20,
  level: 'beginner',
  metrics: ['incentiveAlignment', 'wallOfConfusion', 'feedbackLatency', 'deploymentFriction'],
  legend: ['flow', ['handover', 'siloed ticket handover'], ['feedback', 'continuous feedback loop']],
  goals: [
    { text: 'The Wall of Confusion & opposing organizational incentives', step: 1 },
    { text: 'The CAMS framework (Culture, Automation, Measurement, Sharing)', step: 2 },
    { text: 'Shift Left, Shift Right & Blameless Postmortems', step: 3 },
  ],
  steps: [
    {
      short: 'The Silo Wall',
      chapter: 'concept',
      title: 'The Wall of Confusion: Dev vs Ops Incentive Clash',
      body: [
        'Historically, Development teams were incentivized on <b>speed of change</b> (shipping features), while Operations teams were measured on <b>system stability</b> (preventing downtime).',
        'This created the infamous "Wall of Confusion": Developers tossed code and zip files over the wall into ticket queues (Jira/ServiceNow), while Ops spent weekends firefighting mysterious deployment crashes.',
      ],
      callout: {
        kind: 'caution',
        text: 'Opposing incentives create adversarial teams. Ops views changes as risks to avoid; Dev views Ops as roadblocks.',
      },
      metrics: { incentiveAlignment: 'Opposed (0%)', wallOfConfusion: 'Fortified Wall', feedbackLatency: 'Weeks (Late Ticket)', deploymentFriction: 'Severe (Weekend War-room)' },
      scene: {
        entities: {
          devTeam: d(-10, 0, { color: 'amber', glyph: 'terminal', label: ['Dev Team'], sub: 'Incentive: Ship fast' }),
          wall: d(0, 0, { color: 'red', glyph: 'shield', label: ['Wall of Confusion'], sub: 'Jira tickets & finger-pointing' }),
          opsTeam: d(10, 0, { color: 'purple', glyph: 'database', label: ['Ops Team'], sub: 'Incentive: Zero downtime' }),
          zSilo: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'HISTORICAL SILOED ORGANIZATIONAL MODEL'),
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
        'DevOps is not a job title or a tool — it is a culture underpinned by CAMS:',
        '• <b>Culture:</b> Shared responsibility ("You build it, you run it").<br>' +
        '• <b>Automation:</b> Replacing fragile manual runbooks with declarative CI/CD code.<br>' +
        '• <b>Measurement:</b> Telemetry, APM, and DORA metrics guiding engineering decisions.<br>' +
        '• <b>Sharing:</b> Cross-functional transparency and shared incident retrospectives.',
      ],
      callout: {
        kind: 'insight',
        text: 'DevOps replaces manual friction gates with automated guardrails that empower developers to deploy autonomously.',
      },
      changes: ['+ Demolished the Wall of Confusion', '+ Formed cross-functional feature teams', '+ Automated deployment pipeline replaces manual handovers'],
      metrics: { incentiveAlignment: 'Aligned (Shared SLA)', wallOfConfusion: 'Demolished', feedbackLatency: 'Minutes (Automated CI)', deploymentFriction: 'Low (Self-service)' },
      scene: {
        entities: {
          crossTeam: d(-10, 0, { color: 'blue', glyph: 'boxes', label: ['Cross-Functional Team'], sub: 'Dev + Ops + QA unified' }),
          autoPipeline: d(0, 0, { color: 'cyan', glyph: 'cpu', label: ['Automated CI/CD'], sub: 'Declarative pipelines' }),
          sharedTelemetry: d(10, 0, { color: 'green', glyph: 'clock', label: ['Shared Telemetry'], sub: 'Traces, Logs, Metrics' }),
          zCams: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'CAMS UNIFIED OWNERSHIP'),
        },
        links: {
          ca: h('crossTeam', 'autoPipeline', ['crossTeam', 'autoPipeline'], { label: 'commit triggers' }),
          as: h('autoPipeline', 'sharedTelemetry', ['autoPipeline', 'sharedTelemetry'], { label: 'observable deploy' }),
        },
        flows: [{ route: ['ca', 'as'], kind: 'feedback', rate: 1.5 }],
      },
    },
    {
      short: 'Shift-Left & SRE',
      chapter: 'solution',
      title: 'Shift Left, Shift Right & Blameless Retrospectives',
      body: [
        '<b>Shift-Left:</b> Security scans (SAST/DAST), unit testing, and linting run directly in developers\' IDEs and pull requests before merging.',
        '<b>Shift-Right:</b> Synthetic monitoring, canary deployments, and chaos testing in production provide instant feedback.',
        'When outages occur, teams conduct <b>Blameless Postmortems</b> focusing on systemic process and tooling improvements rather than human fault.',
      ],
      callout: {
        kind: 'tip',
        text: 'In blameless postmortems, humans are never the root cause; brittle systems and missing safeguards are.',
      },
      changes: ['+ Shift-left security scans in PR stage', '+ Real-time telemetry feed back to developers', '+ Instituted blameless incident reviews'],
      metrics: { incentiveAlignment: '100% SRE Partnership', wallOfConfusion: 'Zero', feedbackLatency: 'Instant (IDE / Alerts)', deploymentFriction: 'Continuous Flow' },
      scene: {
        entities: {
          shiftLeft: d(-10, 0, { color: 'blue', glyph: 'shield', label: ['Shift Left (PR Gates)'], sub: 'SAST, tests, linters' }),
          prodSystem: d(0, 0, { color: 'green', glyph: 'boxes', label: ['Production Fleet'], sub: 'Canaries & Feature Flags' }),
          feedbackLoop: d(10, 0, { color: 'purple', glyph: 'terminal', label: ['Blameless Postmortem'], sub: 'Action items & hardening' }),
          zShift: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'CONTINUOUS FEEDBACK WHEEL'),
        },
        links: {
          sp: h('shiftLeft', 'prodSystem', ['shiftLeft', 'prodSystem'], { label: 'safe release' }),
          pf: h('prodSystem', 'feedbackLoop', ['prodSystem', 'feedbackLoop'], { label: 'incident signals' }),
          fs: h('feedbackLoop', 'shiftLeft', ['feedbackLoop', 'shiftLeft'], { label: 'reinforce tests' }),
        },
        flows: [{ route: ['sp', 'pf', 'fs'], kind: 'feedback', rate: 1.6 }],
      },
    },
  ],
};
