import {
  makeBlock,
  makeDb,
  makeDevice,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';

export const cicdToolsEvolutionLesson = {
  id: 'cicd-tools-evolution',
  title: 'CI/CD Toolchain Evolution',
  summary: 'Trace the architectural evolution of continuous delivery: from Gen 1 XML polling daemons (CruiseControl) and Gen 2 snowflake pet runners (Jenkins), to ephemeral declarative pipelines (GitHub Actions) and Gen 3 pull-based GitOps (ArgoCD).',
  minutes: 25,
  level: 'intermediate',
  metrics: ['toolGeneration', 'isolationLevel', 'pipelineDefinition', 'securityModel'],
  legend: ['flow', ['poll', 'polling interval'], ['exec', 'build execution'], ['sync', 'gitops reconciliation']],
  goals: [
    { text: 'Gen 1: CruiseControl XML polling daemons & Ant execution', step: 1 },
    { text: 'The Snowflake pet runner problem & dependency drift', step: 2 },
    { text: 'Gen 2: Pipeline-as-code & declarative YAML specifications', step: 3 },
    { text: 'Containerized ephemeral runners & environment isolation', step: 4 },
    { text: 'The push-based security flaw: cluster credential exposure', step: 5 },
    { text: 'Gen 3: Pull-based GitOps & in-cluster reconciliation', step: 6 },
  ],
  steps: [
    {
      short: 'Gen 1: Polling',
      chapter: 'evolution',
      title: 'Gen 1: CruiseControl & XML Polling Daemons (2001)',
      body: [
        'In the early 2000s, <b>CruiseControl</b> introduced automated CI. A daemon woke up every 60 seconds, queried CVS/SVN over the network to see if commits existed, and triggered an Apache Ant XML build script.',
        'Builds ran directly on the master host filesystem, with no process isolation and high polling overhead.',
      ],
      callout: {
        kind: 'insight',
        text: 'Polling VCS every 60s wastes massive bandwidth and creates commit-to-build latency compared to modern event-driven webhooks.',
      },
      metrics: { toolGeneration: 'Gen 1 (2001)', isolationLevel: 'None (Bare Host)', pipelineDefinition: 'XML (build.xml)', securityModel: 'Host Root' },
      scene: {
        entities: {
          vcsRepo: makeDevice(-18, -6, { label: 'vcs-server', tags: [{ text: 'SVN Repository', icon: 'gitBranch' }] }),
          ciMaster: makeBlock(-6, -2, { s: 4.8, h: 50, color: 'orange', glyph: 'clock', label: ['CruiseControl'], sub: 'poll every 60s' }),
          buildHost: makeDb(6, 0, { s: 4.6, h: 48, color: 'purple', glyph: 'terminal', label: ['Ant Runner'], sub: 'build.xml exec' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'cruisecontrol.xml Config', [
            `<cruisecontrol>`,
            `  <project name="payment-app">`,
            `    <modificationset quietperiod="60">`,
            `      <svn repository="svn://svn.corp/app"/>`,
            `    </modificationset>`,
            `    <schedule interval="60"><ant/></schedule>`,
            `  </project>`,
            `</cruisecontrol>`,
          ], { icon: 'terminal' }),
        },
        links: {
          vc: makeLink('vcsRepo', 'ciMaster', ['vcsRepo', 'ciMaster'], { label: 'poll changes' }),
          cb: makeLink('ciMaster', 'buildHost', ['ciMaster', 'buildHost'], { label: 'ant compile' }),
        },
        flows: [{ route: ['vc', 'cb'], kind: 'poll', rate: 1.2 }],
      },
    },
    {
      short: 'Snowflake Runners',
      chapter: 'evolution',
      title: 'The Snowflake Pet Runner: Dependency Drift & Clashes',
      body: [
        'As projects grew, teams adopted <b>Jenkins</b> with long-lived worker agents. However, these agents were treated as "pets" rather than cattle.',
        'Over time, manual SSH tweaks caused <b>dependency drift</b>: Project A required Node 16 while Project B required Node 20 on the same dirty filesystem, leading to the dreaded "FATAL: Node version clash".',
      ],
      callout: {
        kind: 'caution',
        text: 'Pet runners degrade over time. Builds pass or fail depending on which dirty runner picks up the job.',
      },
      changes: ['+ Migrated from CruiseControl to Jenkins Master/Agent topology', '+ Workers share dirty host filesystem /tmp', '+ Node version collision broke parallel builds'],
      metrics: { toolGeneration: 'Gen 1.5 (Jenkins)', isolationLevel: 'Dirty Host (/tmp)', pipelineDefinition: 'Freestyle UI / XML', securityModel: 'Shared Agent' },
      scene: {
        entities: {
          vcsRepo: makeDevice(-18, -6, { label: 'vcs-server', tags: [{ text: 'Git Central', tone: 'blue', icon: 'gitBranch' }] }),
          ciMaster: makeBlock(-6, -2, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Jenkins Master'], sub: 'shared /tmp' }),
          buildHost: makeDb(6, 0, { s: 4.6, h: 48, color: 'red', glyph: 'alert', label: ['Pet Agent-01'], sub: 'version clash' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Jenkins Agent Error Log', [
            `[Agent-01] Executing /usr/bin/node index.js`,
            `Error: Node version v16.14.0 incompatible`,
            `Requires: >=20.0.0 (Found installed v16)`,
            `Conflict: Project-A locked node to v16`,
            `FATAL: Shared host filesystem collision`,
            `= Non-reproducible snowflake runner failure`,
          ], { icon: 'terminal' }),
        },
        links: {
          vc: makeLink('vcsRepo', 'ciMaster', ['vcsRepo', 'ciMaster'], { label: 'git trigger' }),
          cb: makeLink('ciMaster', 'buildHost', ['ciMaster', 'buildHost'], { label: 'run on agent' }),
        },
        flows: [{ route: ['vc', 'cb'], kind: 'exec', rate: 1.5 }],
      },
    },
    {
      short: 'Pipeline as Code',
      chapter: 'modern',
      title: 'Gen 2: Pipeline-as-Code & Declarative YAML (2015)',
      body: [
        'Modern CI eliminated manual UI jobs by storing the pipeline definition directly alongside application source code in <code>.github/workflows/ci.yml</code>.',
        'Every branch declares its exact matrix: OS versions, container images, and step dependencies, tracked under Git version control.',
      ],
      callout: {
        kind: 'insight',
        text: 'Pipeline-as-code means pipeline changes are peer-reviewed in pull requests, preventing unauthorized build tampering.',
      },
      changes: ['+ Pipeline definition checked into repo: .github/workflows/ci.yml', '+ Matrix jobs execute across Node 18, 20, 22 in parallel', '+ Reproducible declarative workflow execution'],
      metrics: { toolGeneration: 'Gen 2 (YAML)', isolationLevel: 'Matrix Matrix', pipelineDefinition: 'YAML Spec', securityModel: 'Git Protected' },
      scene: {
        entities: {
          vcsRepo: makeDevice(-18, -6, { label: 'vcs-server', tags: [{ text: 'repo/.github', tone: 'green', icon: 'gitBranch' }] }),
          ciMaster: makeBlock(-6, -2, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['GitHub Actions'], sub: 'parse yaml' }),
          buildHost: makeDb(6, 0, { s: 4.6, h: 48, color: 'purple', glyph: 'boxes', label: ['Matrix Runners'], sub: 'matrix runner' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, '.github/workflows/ci.yml', [
            `name: CI`,
            `on: [push, pull_request]`,
            `jobs:`,
            `  test:`,
            `    strategy:`,
            `      matrix: [18, 20, 22]`,
            `    runs-on: ubuntu-latest`,
            `    steps: [npm test]`,
          ], { icon: 'terminal' }),
        },
        links: {
          vc: makeLink('vcsRepo', 'ciMaster', ['vcsRepo', 'ciMaster'], { label: 'push event' }),
          cb: makeLink('ciMaster', 'buildHost', ['ciMaster', 'buildHost'], { label: 'schedule matrix' }),
        },
        flows: [{ route: ['vc', 'cb'], kind: 'exec', rate: 1.6 }],
      },
    },
    {
      short: 'Ephemeral Runners',
      chapter: 'modern',
      title: 'Ephemeral Runners: Clean Cattle, Never Pets',
      body: [
        'To solve the dirty runner crisis, modern platforms provision <b>ephemeral runners</b>. A clean container or microVM boots in milliseconds, runs one job, and is immediately destroyed.',
        'No cached state, leaked credentials, or background processes survive beyond the job lifecycle.',
      ],
      callout: {
        kind: 'tip',
        text: 'Ephemeral runners turn compute into cattle: every build starts with a pristine root filesystem, guaranteeing 100% build reproducibility.',
      },
      changes: ['+ Runner boots from immutable base image in 38ms', '+ Full rootfs isolation via cgroups and namespaces', '+ Environment destroyed and memory zeroed after build'],
      metrics: { toolGeneration: 'Gen 2.5 (Ephemeral)', isolationLevel: 'MicroVM (38ms)', pipelineDefinition: 'Declarative YAML', securityModel: 'Zero Persistence' },
      scene: {
        entities: {
          vcsRepo: makeDevice(-18, -6, { label: 'vcs-server', tags: [{ text: 'repo/.github', tone: 'green', icon: 'gitBranch' }] }),
          ciMaster: makeBlock(-6, -2, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['Runner Pool'], sub: 'boot 38ms' }),
          buildHost: makeDb(6, 0, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['Ephemeral VM'], sub: 'wiped on exit' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Ephemeral Runner Lifecycle', [
            `event: runner_job_assigned`,
            `action: qemu-kvm spawn ephemeral-worker-89`,
            `isolation: namespaces + seccomp + cgroups`,
            `execution: npm run test -> 100% pass`,
            `teardown: container rm -f ephemeral-worker-89`,
            `= Wiped cleanly: Zero cross-job contamination`,
          ], { icon: 'terminal' }),
        },
        links: {
          vc: makeLink('vcsRepo', 'ciMaster', ['vcsRepo', 'ciMaster'], { label: 'trigger' }),
          cb: makeLink('ciMaster', 'buildHost', ['ciMaster', 'buildHost'], { label: 'ephemeral run' }),
        },
        flows: [{ route: ['vc', 'cb'], kind: 'exec', rate: 1.8 }],
      },
    },
    {
      short: 'Push-Based Flaw',
      chapter: 'security',
      title: 'The Push-Based Flaw: Cluster Credential Exposure',
      body: [
        'In traditional push-based CD, the external CI server needs write credentials to the production Kubernetes cluster (e.g. <code>kubeconfig</code> with cluster-admin token).',
        'This creates a severe attack vector: if a rogue dependency or malicious PR compromises the CI runner, the attacker steals cluster-admin credentials and takes over the cluster.',
      ],
      callout: {
        kind: 'caution',
        text: 'Storing cluster-admin tokens in external CI secrets violates the Principle of Least Privilege and exposes port 6443 to the public internet.',
      },
      changes: ['+ External CI runner given kubeconfig cluster-admin token', '+ Opened inbound port 6443 on production firewall', '+ Vulnerable to credential extraction in build logs'],
      metrics: { toolGeneration: 'Push CD (Vulnerable)', isolationLevel: 'External Access', pipelineDefinition: 'kubectl apply', securityModel: 'Vulnerable Secret' },
      scene: {
        entities: {
          vcsRepo: makeDevice(-18, -6, { label: 'vcs-server', tags: [{ text: 'External CI', tone: 'red', icon: 'alert' }] }),
          ciMaster: makeBlock(-6, -2, { s: 4.8, h: 50, color: 'red', glyph: 'shield', label: ['Push CI Runner'], sub: 'secret leak' }),
          buildHost: makeDb(6, 0, { s: 4.6, h: 48, color: 'purple', glyph: 'server', label: ['K8s Cluster'], sub: 'port 6443' }),
          exposedApi: makeBlock(-4, 16, { s: 4.4, h: 48, color: 'red', glyph: 'alert', label: ['Exposed API'], sub: 'secret leak' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Security Vulnerability Report', [
            `Vulnerability: KUBECONFIG secret stored in CI`,
            `Target: https://api.prod.k8s:6443 (Port open)`,
            `Threat: Malicious PR can dump $KUBECONFIG`,
            `Blast Radius: Full cluster administrative takeover`,
            `Recommendation: Transition to pull-based GitOps`,
          ], { icon: 'terminal' }),
        },
        links: {
          vc: makeLink('vcsRepo', 'ciMaster', ['vcsRepo', 'ciMaster'], { label: 'build push' }),
          cb: makeLink('ciMaster', 'buildHost', ['ciMaster', 'buildHost'], { label: 'kubectl apply' }),
          ce: makeLink('ciMaster', 'exposedApi', ['ciMaster', 'exposedApi'], { label: 'leak token' }),
        },
        flows: [{ route: ['vc', 'cb', 'ce'], kind: 'exec', rate: 1.8 }],
      },
    },
    {
      short: 'Gen 3: GitOps Pull',
      chapter: 'solution',
      title: 'Gen 3: Pull-Based GitOps & In-Cluster Control (2020+)',
      body: [
        '<b>GitOps (ArgoCD / Flux)</b> reverses the architecture. The CI server no longer has cluster access — it only builds and tests code, then commits updated image tags to Git.',
        'An <b>in-cluster agent</b> pulls desired manifests from Git and reconciles state locally. Inbound port 6443 is closed completely.',
      ],
      callout: {
        kind: 'insight',
        text: 'In pull-based GitOps, production credentials never leave the cluster boundary, eliminating the largest security attack vector in modern cloud engineering.',
      },
      changes: ['+ Revoked external CI cluster credentials', '+ Installed ArgoCD in-cluster pull reconciliation agent', '+ Inbound port 6443 closed; zero firewall openings'],
      metrics: { toolGeneration: 'Gen 3 (GitOps)', isolationLevel: 'In-Cluster Agent', pipelineDefinition: 'Git Single Truth', securityModel: 'Zero Inbound' },
      scene: {
        entities: {
          vcsRepo: makeDevice(-18, -6, { label: 'vcs-server', tags: [{ text: 'Git Truth', tone: 'green', icon: 'gitBranch' }] }),
          ciMaster: makeBlock(-6, -2, { s: 4.8, h: 50, color: 'green', glyph: 'shield', label: ['ArgoCD Agent'], sub: 'cluster pull' }),
          buildHost: makeDb(6, 0, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['K8s Production'], sub: 'state in etcd' }),
          prodWorkload: makeDb(14, 6, { s: 4.6, h: 48, color: 'blue', glyph: 'network', label: ['Live App Fleet'], sub: 'state in etcd' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'ArgoCD Reconciliation Loop', [
            `Model: Pull-based continuous reconciliation`,
            `Credentials: Stored securely inside cluster etcd`,
            `External firewall: Inbound port 6443 CLOSED`,
            `Audit: Git commit history = Audit trail`,
            `= Zero cluster credential leakage to CI runners`,
          ], { icon: 'terminal' }),
        },
        links: {
          vc: makeLink('vcsRepo', 'ciMaster', ['vcsRepo', 'ciMaster'], { label: 'pull state' }),
          cb: makeLink('ciMaster', 'buildHost', ['ciMaster', 'buildHost'], { label: 'reconcile' }),
          bp: makeLink('buildHost', 'prodWorkload', ['buildHost', 'prodWorkload'], { label: 'live sync' }),
        },
        flows: [{ route: ['vc', 'cb', 'bp'], kind: 'sync', rate: 1.5 }],
      },
    },
  ],
};
