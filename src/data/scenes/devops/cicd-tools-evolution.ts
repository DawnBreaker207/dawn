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

export const cicdToolsEvolutionLesson = {
  id: 'cicd-tools-evolution',
  title: 'CI/CD Tool Evolution: CruiseControl to Jenkins to ArgoCD',
  summary: 'Trace 25 years of continuous integration evolution: from CruiseControl polling XML files, monolithic Jenkins snowflake agents, declarative Cloud CI/CD (GitHub Actions), to Cloud-Native GitOps (ArgoCD).',
  minutes: 25,
  level: 'intermediate',
  metrics: ['generation', 'pipelineDef', 'runnerIsolation', 'driftHandling'],
  legend: ['flow', ['build', 'build trigger'], ['sync', 'gitops reconciliation'], ['drift', 'drift signal']],
  goals: [
    { text: 'Gen 1: CruiseControl & XML Polling Daemons', step: 1 },
    { text: 'The Snowflake Server Trap & Dirty /tmp Filesystems', step: 2 },
    { text: 'Gen 2: Declarative YAML & Pipeline-as-Code', step: 3 },
    { text: 'Ephemeral Container Runners & Firecracker MicroVMs', step: 4 },
    { text: 'The Push-Model Security Flaw & Stolen Cluster Credentials', step: 5 },
    { text: 'Gen 3: Cloud-Native Pull GitOps (ArgoCD & Flux)', step: 6 },
  ],
  steps: [
    {
      short: 'Gen 1: Polling',
      chapter: 'setup',
      title: 'Gen 1: CruiseControl & Polling Daemons (2001)',
      body: [
        'Continuous Integration began in 2001 with <b>CruiseControl</b>, an open-source Java daemon that periodically polled CVS or Subversion repositories every 60 seconds.',
        'If changes were detected, it invoked an Apache Ant build script and sent email notifications to the committer if the build broke.',
      ],
      callout: {
        kind: 'insight',
        text: 'Polling was slow, wasteful on network bandwidth, and delayed feedback by several minutes compared to modern instant webhooks.',
      },
      metrics: { generation: 'Gen 1 (2001)', pipelineDef: 'XML Config', runnerIsolation: 'None (Local JVM)', driftHandling: 'High Drift' },
      scene: {
        entities: {
          vcsRepo: y(-10, -18, { label: 'cvs-server', tags: [{ text: 'CVS / SVN Repo', icon: 'database' }] }),
          cruiseControl: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'clock', label: ['CruiseControl'], sub: 'polls every 60 seconds' }),
          antRunner: b(10, 8, { s: 4.6, h: 48, color: 'purple', glyph: 'terminal', label: ['Apache Ant Build'], sub: 'build.xml executor' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'cruisecontrol.xml Config', [
            `<cruisecontrol>`,
            `  <project name="app">`,
            `    <bootstrappers><currentbuildstatusbootstrapper/></bootstrappers>`,
            `    <modificationset quietperiod="60">`,
            `      <cvs cvsroot=":pserver:user@host:/cvs"/>`,
            `    </modificationset>`,
            `    <schedule interval="60"><ant/></schedule>`,
            `  </project>`,
            `</cruisecontrol>`,
          ], { icon: 'terminal' }),
          zGen1: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'GEN 1: POLLING DAEMON ARCHITECTURE'),
        },
        links: {
          vc: h('vcsRepo', 'cruiseControl', ['vcsRepo', 'cruiseControl'], { label: 'poll every 60s' }),
          ca: h('cruiseControl', 'antRunner', ['cruiseControl', 'antRunner'], { label: 'exec build.xml' }),
        },
        flows: [{ route: ['vc', 'ca'], kind: 'build', rate: 1.2 }],
      },
    },
    {
      short: 'The Snowflake Trap',
      chapter: 'problem',
      title: 'The Snowflake Trap: Monolithic Jenkins "Pet" Servers',
      body: [
        'Hudson (later <b>Jenkins</b>) modernized CI with a rich web UI and plugins, running on persistent worker VMs.',
        'Over time, these agents became <b>"Snowflakes"</b>: developers manually installed tools (Java 8 vs 11, Node 14 vs 16) directly on the host. Dirty <code>/tmp</code> filesystems and stale package caches caused builds to fail unpredictably.',
      ],
      callout: {
        kind: 'caution',
        text: 'A snowflake server cannot be rebuilt automatically. If the hard disk fails, days or weeks are lost rebuilding the secret environment.',
      },
      changes: ['! Node 14 build corrupted global node_modules on worker', '! Conflicting Python 2 and 3 packages broke build script', '! Server disk 98% full due to uncleaned /tmp workspaces'],
      metrics: { generation: 'Gen 1.5 (Jenkins Era)', pipelineDef: 'Jenkinsfile / XML', runnerIsolation: 'Pet Server (Shared VM)', driftHandling: 'Severe Snowflake Drift' },
      scene: {
        entities: {
          jenkinsMaster: y(-10, -18, { label: 'jenkins-master', tags: [{ text: 'Master Server', tone: 'blue', icon: 'server' }] }),
          snowflakeAgent: d(0, -6, { s: 4.8, h: 52, color: 'red', glyph: 'alert', label: ['Snowflake Worker'], sub: 'Shared dirty filesystem' }),
          brokenBuild: b(10, 8, { s: 4.6, h: 48, color: 'red', glyph: 'terminal', label: ['Corrupted Build'], sub: 'FATAL: Node version clash' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Jenkins Agent Error Log', [
            `[ERROR] /usr/bin/node --version => v14.17.0`,
            `[ERROR] Expected Node >= 18.0.0 for Vite build`,
            `[ERROR] /tmp/workspace/job-14/node_modules corrupted`,
            `[FATAL] Out of disk space on /var/lib/jenkins (99%)`,
            `! Build aborted after 18 minutes`,
          ], { icon: 'terminal' }),
          zSnowflake: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'SNOWFLAKE RUNNER DEGRADATION'),
        },
        links: {
          jm: h('jenkinsMaster', 'snowflakeAgent', ['jenkinsMaster', 'snowflakeAgent'], { label: 'dispatch SSH job' }),
          sb: h('snowflakeAgent', 'brokenBuild', ['snowflakeAgent', 'brokenBuild'], { label: 'run dirty workspace' }),
        },
        flows: [{ route: ['jm', 'sb'], kind: 'drift', rate: 1.4 }],
      },
    },
    {
      short: 'Gen 2: Pipeline-as-Code',
      chapter: 'technique',
      title: 'Gen 2: Declarative Pipeline-as-Code (YAML in Git)',
      body: [
        'Travis CI, CircleCI, GitLab CI, and <b>GitHub Actions</b> introduced <b>Pipeline-as-Code</b>.',
        'Pipelines are no longer defined via web UI forms. Instead, declarative YAML files (e.g. <code>.github/workflows/*.yml</code>) live directly in the Git repository, version-controlled alongside application code.',
      ],
      callout: {
        kind: 'tip',
        text: 'Every Git branch can test its own pipeline modifications without impacting the production build.',
      },
      changes: ['+ Pipeline defined in .github/workflows/deploy.yml', '+ Version-controlled and reviewed in Pull Requests', '+ Zero hidden UI configuration'],
      metrics: { generation: 'Gen 2 (Cloud CI)', pipelineDef: 'Declarative YAML', runnerIsolation: 'Job Level Spec', driftHandling: 'Git Versioned' },
      scene: {
        entities: {
          gitRepo: y(-10, -18, { label: 'git-repo', tags: [{ text: '.github/workflows', tone: 'blue', icon: 'gitBranch' }] }),
          workflowParser: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['Workflow Parser'], sub: 'Reads YAML spec' }),
          jobDispatcher: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['Job Dispatcher'], sub: 'Schedules matrix runners' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, '.github/workflows/ci.yml', [
            `name: Continuous Integration`,
            `on: [push, pull_request]`,
            `jobs:`,
            `  test:`,
            `    runs-on: ubuntu-latest`,
            `    steps:`,
            `      - uses: actions/checkout@v4`,
            `      - uses: actions/setup-node@v4`,
            `        with: { node-version: 20 }`,
            `      - run: npm ci && npm test`,
          ], { icon: 'terminal' }),
          zYaml: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'PIPELINE-AS-CODE SPECIFICATION'),
        },
        links: {
          gw: h('gitRepo', 'workflowParser', ['gitRepo', 'workflowParser'], { label: 'git push webhook' }),
          wj: h('workflowParser', 'jobDispatcher', ['workflowParser', 'jobDispatcher'], { label: 'compile workflow' }),
        },
        flows: [{ route: ['gw', 'wj'], kind: 'build', rate: 1.6 }],
      },
    },
    {
      short: 'Ephemeral Runners',
      chapter: 'execution',
      title: 'Ephemeral Runners: MicroVMs & Docker Containers',
      body: [
        'To defeat the snowflake trap, Gen 2 CI platforms instantiate a brand new <b>Ephemeral Runner</b> (Docker container or Firecracker microVM) for every single job.',
        'The runner starts completely sterile in milliseconds, executes the build, streams logs, and is instantly destroyed upon job completion.',
      ],
      callout: {
        kind: 'insight',
        text: 'Ephemeral isolation guarantees a hermetic build: cross-job contamination and leftover malware are physically impossible.',
      },
      changes: ['+ Firecracker microVM booted in 38ms', '+ 4 vCPUs and 16GB clean RAM allocated', '+ Runner container terminated and deleted upon completion'],
      metrics: { generation: 'Gen 2 Ephemeral', pipelineDef: 'Declarative YAML', runnerIsolation: 'Hermetic MicroVM', driftHandling: 'Zero Drift (100% Sterile)' },
      scene: {
        entities: {
          jobQueue: y(-10, -18, { label: 'queue', tags: [{ text: 'Queued Job', icon: 'zap' }] }),
          firecrackerVm: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'cpu', label: ['Firecracker MicroVM'], sub: 'Boot: 38ms | Ephemeral' }),
          wipedDisk: b(10, 8, { s: 4.6, h: 48, color: 'slab', glyph: 'database', label: ['Clean /tmp Disk'], sub: 'Wiped after execution' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Ephemeral Runner Lifecycle', [
            `1. Ingest job: action-run-77291`,
            `2. Boot microVM: rootfs ubuntu-22.04`,
            `3. Run build: 0 contamination`,
            `4. Upload artifacts -> S3 storage`,
            `5. Destroy VM: memory securely wiped`,
            `= Hermetic & reproducible environment`,
          ], { icon: 'terminal' }),
          zRunner: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'EPHEMERAL RUNNER ISOLATION'),
        },
        links: {
          jf: h('jobQueue', 'firecrackerVm', ['jobQueue', 'firecrackerVm'], { label: 'spawn microVM' }),
          fw: h('firecrackerVm', 'wipedDisk', ['firecrackerVm', 'wipedDisk'], { label: 'terminate on finish' }),
        },
        flows: [{ route: ['jf', 'fw'], kind: 'build', rate: 1.8 }],
      },
    },
    {
      short: 'Push Model Security Flaw',
      chapter: 'problem',
      title: 'The Push-Based Security Flaw: Exposed Cluster Secrets',
      body: [
        'Despite ephemeral runners, traditional CI/CD uses a <b>Push-Based Delivery Model</b>.',
        'The CI runner requires admin credentials (e.g. AWS access keys or <code>kubeconfig</code>) stored in CI secrets. If a malicious PR or compromised npm dependency runs in the runner, it can exfiltrate cluster admin credentials.',
      ],
      callout: {
        kind: 'caution',
        text: 'Storing production cluster credentials in CI runners creates a massive attack surface. A leaked kubeconfig gives attackers full cluster takeover.',
      },
      changes: ['! CI runner holds administrative kubeconfig in secrets', '! Inbound firewall port opened on production cluster', '! High risk of secret exfiltration via malicious PRs'],
      metrics: { generation: 'Push-Based CI/CD', pipelineDef: 'CI Secrets Required', runnerIsolation: 'External Runner', driftHandling: 'Security Vulnerability' },
      scene: {
        entities: {
          externalCi: y(-10, -18, { label: 'external-ci', tags: [{ text: 'Exposed Kubeconfig', tone: 'red', icon: 'lock' }] }),
          firewallGate: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'shield', label: ['Inbound Firewall'], sub: 'Exposed port 6443' }),
          prodCluster: b(10, 8, { s: 4.6, h: 48, color: 'purple', glyph: 'server', label: ['K8s Production'], sub: 'Cluster vulnerable to leak' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Security Vulnerability Report', [
            `CRITICAL: kubeconfig stored in CI runner`,
            `Vulnerability: Lateral secret exposure`,
            `Attack: Malicious PR prints process.env`,
            `Result: Full admin access to K8s API`,
            `Solution: Invert push to pull-based GitOps`,
          ], { icon: 'terminal' }),
          zPushFlaw: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'PUSH-BASED SECURITY EXPOSURE'),
        },
        links: {
          ef: h('externalCi', 'firewallGate', ['externalCi', 'firewallGate'], { label: 'push kubectl apply' }),
          fp: h('firewallGate', 'prodCluster', ['firewallGate', 'prodCluster'], { label: 'root access' }),
        },
        flows: [{ route: ['ef', 'fp'], kind: 'drift', rate: 1.5 }],
      },
    },
    {
      short: 'Gen 3: GitOps Pull',
      chapter: 'solution',
      title: 'Gen 3: Cloud-Native Pull GitOps (ArgoCD & Flux)',
      body: [
        '<b>GitOps (ArgoCD / Flux)</b> inverts the security model completely into a <b>Pull-Based Architecture</b>.',
        'No cluster credentials ever leave production. Instead, an in-cluster operator continuously pulls desired manifests from Git, detects drift against live Kubernetes state, and reconciles differences automatically.',
      ],
      callout: {
        kind: 'insight',
        text: 'With GitOps, Git is the single source of truth. Security boundaries are sealed, and rollbacks are as simple as git revert.',
      },
      changes: ['+ Revoked all cluster admin secrets from CI runners', '+ In-cluster ArgoCD operator deployed', '+ Automated continuous self-healing enabled'],
      metrics: { generation: 'Gen 3 (Cloud-Native GitOps)', pipelineDef: 'Declarative K8s Manifests', runnerIsolation: 'In-Cluster Operator', driftHandling: 'Automated Self-Healing' },
      scene: {
        entities: {
          gitTruth: y(-10, -18, { label: 'git-repo', tags: [{ text: 'Git: Desired State', tone: 'green', icon: 'gitBranch' }] }),
          argoOperator: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'shield', label: ['ArgoCD Controller'], sub: 'In-cluster pull & diff' }),
          k8sLive: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['Kubernetes Cluster'], sub: 'Live state in etcd' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'ArgoCD Reconciliation Loop', [
            `apiVersion: argoproj.io/v1alpha1`,
            `kind: Application`,
            `metadata: { name: payment-service }`,
            `spec:`,
            `  source: { repoURL: git://github.com/... }`,
            `  destination: { server: in-cluster }`,
            `  syncPolicy: { automated: { selfHeal: true } }`,
            `= Sealed cluster boundary: 0 external keys`,
          ], { icon: 'terminal' }),
          zGitOps: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'GEN 3: PULL-BASED GITOPS RECONCILIATION'),
        },
        links: {
          ga: h('gitTruth', 'argoOperator', ['gitTruth', 'argoOperator'], { label: 'pull desired state' }),
          ak: h('argoOperator', 'k8sLive', ['argoOperator', 'k8sLive'], { label: 'reconcile live pods' }),
        },
        flows: [{ route: ['ga', 'ak'], kind: 'sync', rate: 1.6 }],
      },
    },
  ],
};
