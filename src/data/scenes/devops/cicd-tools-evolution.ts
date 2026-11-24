// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const cicdToolsEvolutionLesson = {
  id: 'cicd-tools-evolution',
  title: 'CI/CD Tool Evolution: CruiseControl to Jenkins to ArgoCD',
  summary: 'Trace 25 years of continuous integration evolution: from CruiseControl polling XML files, monolithic Jenkins snowflake agents, declarative Cloud CI/CD (GitHub Actions), to Cloud-Native GitOps (ArgoCD).',
  minutes: 20,
  level: 'intermediate',
  metrics: ['generation', 'pipelineDef', 'runnerIsolation', 'driftHandling'],
  legend: ['flow', ['build', 'build trigger flow'], ['sync', 'gitops reconciliation']],
  goals: [
    { text: 'Gen 1: Monolithic CI & Snowflake Build Servers (CruiseControl / Jenkins)', step: 1 },
    { text: 'Gen 2: Declarative Cloud CI & Ephemeral Runners (GitHub Actions)', step: 2 },
    { text: 'Gen 3: Cloud-Native Pull GitOps (ArgoCD & Flux)', step: 3 },
  ],
  steps: [
    {
      short: 'Gen 1: Snowflake CI',
      chapter: 'concept',
      title: 'Gen 1: Polling Daemons & Snowflake Jenkins Servers',
      body: [
        'Continuous Integration began in 2001 with <b>CruiseControl</b>, which polled SourceSafe/CVS every 60 seconds.',
        'Hudson (later <b>Jenkins</b>) became the dominant standard. However, pipelines were defined via web UI forms, stored in XML, and executed on permanent "pet" worker servers.',
        'These snowflake agents suffered from configuration drift, conflicting toolchain versions (Node 14 vs 18), and lack of version-controlled pipeline configuration.',
      ],
      callout: {
        kind: 'caution',
        text: 'Snowflake CI servers accumulate hidden dependencies over years. If the Jenkins VM dies, reproducing the exact build environment can take weeks.',
      },
      metrics: { generation: 'Gen 1 (2001-2012)', pipelineDef: 'GUI / XML / Groovy', runnerIsolation: 'None (Pet Server)', driftHandling: 'High Configuration Drift' },
      scene: {
        entities: {
          vcsPoll: d(-10, 0, { color: 'amber', glyph: 'terminal', label: ['VCS Poller'], sub: 'Polls repo every 60s' }),
          jenkinsMaster: d(0, 0, { color: 'red', glyph: 'cpu', label: ['Jenkins Master'], sub: 'config.xml & plugins' }),
          petAgent: d(10, 0, { color: 'purple', glyph: 'database', label: ['Snowflake VM Worker'], sub: 'Shared dirty disk /tmp' }),
          zGen1: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'GEN 1: MONOLITHIC BUILD PETS'),
        },
        links: {
          vp: h('vcsPoll', 'jenkinsMaster', ['vcsPoll', 'jenkinsMaster'], { label: 'polling trigger' }),
          ja: h('jenkinsMaster', 'petAgent', ['jenkinsMaster', 'petAgent'], { label: 'SSH execution' }),
        },
        flows: [{ route: ['vp', 'ja'], kind: 'build', rate: 1.2 }],
      },
    },
    {
      short: 'Gen 2: Ephemeral CI',
      chapter: 'execution',
      title: 'Gen 2: Declarative YAML & Ephemeral Container Runners',
      body: [
        'Travis CI, CircleCI, GitLab CI, and <b>GitHub Actions</b> revolutionized CI by treating pipelines as code: <code>.github/workflows/*.yml</code> versioned in Git.',
        'Instead of persistent servers, each job spins up a brand new, isolated <b>ephemeral container or microVM</b> (Firecracker/Docker) that executes the steps and terminates immediately.',
      ],
      callout: {
        kind: 'insight',
        text: 'Pipeline-as-code means every branch can modify its own CI test matrix without affecting production builds or other branches.',
      },
      changes: ['+ Pipeline defined as version-controlled YAML in .github/workflows', '+ Spun up clean Ubuntu microVM on commit webhook', '+ Zero cross-build contamination'],
      metrics: { generation: 'Gen 2 (2015-2020)', pipelineDef: 'Declarative YAML', runnerIsolation: 'Ephemeral Containers', driftHandling: 'Zero Drift (Fresh VM)' },
      scene: {
        entities: {
          gitWebhook: d(-10, 0, { color: 'blue', glyph: 'terminal', label: ['git push Webhook'], sub: 'Instant event trigger' }),
          workflowEngine: d(0, 0, { color: 'cyan', glyph: 'package', label: ['GitHub Actions Runner'], sub: 'Parses .github/workflows' }),
          cleanContainer: d(10, 0, { color: 'green', glyph: 'boxes', label: ['Fresh Docker Runner'], sub: 'ubuntu-latest (Ephemeral)' }),
          zGen2: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'GEN 2: DECLARATIVE PIPELINE-AS-CODE'),
        },
        links: {
          gw: h('gitWebhook', 'workflowEngine', ['gitWebhook', 'workflowEngine'], { label: 'push event' }),
          wc: h('workflowEngine', 'cleanContainer', ['workflowEngine', 'cleanContainer'], { label: 'spin up microVM' }),
        },
        flows: [{ route: ['gw', 'wc'], kind: 'build', rate: 1.6 }],
      },
    },
    {
      short: 'Gen 3: GitOps Pull',
      chapter: 'solution',
      title: 'Gen 3: Cloud-Native GitOps (ArgoCD & Flux)',
      body: [
        'Push-based CI/CD has a major security flaw: the CI runner requires root admin credentials to the production Kubernetes cluster.',
        '<b>GitOps (ArgoCD / Flux)</b> inverts this into a <b>Pull-Based</b> model. An in-cluster operator continuously compares the desired state in Git against live cluster state, automatically reconciling drift without exposing external credentials.',
      ],
      callout: {
        kind: 'tip',
        text: 'With GitOps, Git is the single source of truth. Rolling back production is simply git revert.',
      },
      changes: ['+ Removed external cluster credentials from CI runner', '+ Deployed in-cluster ArgoCD reconciliation operator', '+ Automated self-healing for configuration drift'],
      metrics: { generation: 'Gen 3 (2020+ Cloud-Native)', pipelineDef: 'K8s Manifests / Kustomize', runnerIsolation: 'In-Cluster Operator', driftHandling: 'Continuous Self-Healing' },
      scene: {
        entities: {
          gitRepo: d(-10, 0, { color: 'blue', glyph: 'database', label: ['Git Config Repo'], sub: 'Desired State (Kustomize)' }),
          argoController: d(0, 0, { color: 'purple', glyph: 'shield', label: ['ArgoCD Controller'], sub: 'Pull & Diff Reconciliation' }),
          k8sCluster: d(10, 0, { color: 'green', glyph: 'boxes', label: ['K8s Live State'], sub: 'etcd actual pods' }),
          zGen3: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'GEN 3: CONTINUOUS GITOPS RECONCILIATION'),
        },
        links: {
          ga: h('gitRepo', 'argoController', ['gitRepo', 'argoController'], { label: 'pull desired state' }),
          ak: h('argoController', 'k8sCluster', ['argoController', 'k8sCluster'], { label: 'sync live cluster' }),
        },
        flows: [{ route: ['ga', 'ak'], kind: 'sync', rate: 1.4 }],
      },
    },
  ],
};
