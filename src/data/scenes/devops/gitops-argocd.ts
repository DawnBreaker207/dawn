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

export const gitopsArgocdLesson = {
  id: 'gitops-argocd',
  title: 'GitOps Engine & Reconciliation Loop (ArgoCD / Flux)',
  summary: 'Master Cloud-Native continuous delivery: Git as single source of truth, the ArgoCD controller reconciliation loop, OutOfSync drift detection, automated self-healing, sync waves, and resource pruning.',
  minutes: 25,
  level: 'advanced',
  metrics: ['syncStatus', 'healthStatus', 'reconcileInterval', 'driftPolicy'],
  legend: ['flow', ['git', 'manifest sync'], ['drift', 'drift detection'], ['heal', 'self-healing loop']],
  goals: [
    { text: 'Single source of truth: Git declarative manifests (Kustomize/Helm)', step: 1 },
    { text: 'The ArgoCD In-Cluster Controller reconciliation loop', step: 2 },
    { text: 'OutOfSync drift detection between Git and live etcd', step: 3 },
    { text: 'Automated self-healing overriding unauthorized mutations', step: 4 },
    { text: 'Sync waves & dependency-ordered rollouts', step: 5 },
    { text: 'Automated resource pruning of deleted manifests', step: 6 },
  ],
  steps: [
    {
      short: 'Git Truth',
      chapter: 'setup',
      title: 'Git as the Single Source of Truth for Infrastructure',
      body: [
        'In GitOps, the entire infrastructure and application state is described declaratively in a Git repository using <b>Kustomize</b> or <b>Helm charts</b>.',
        'No engineer has <code>kubectl</code> write access to production. Every deployment, scaling operation, or configuration change must be submitted as a pull request, code-reviewed, and merged.',
      ],
      callout: {
        kind: 'insight',
        text: 'Because Git stores the entire state history, auditing who changed what and rolling back is as simple as running git revert.',
      },
      metrics: { syncStatus: 'Synced', healthStatus: 'Healthy', reconcileInterval: '3m (Webhook)', driftPolicy: 'Self-Heal Active' },
      scene: {
        entities: {
          gitRepo: y(-10, -18, { label: 'git-repo', tags: [{ text: 'k8s-manifests.git', tone: 'green', icon: 'gitBranch' }] }),
          kustomizeEngine: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'package', label: ['Kustomize Engine'], sub: 'overlays/production' }),
          targetCluster: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['K8s Production'], sub: 'Desired state target' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'kustomization.yaml (Git)', [
            `apiVersion: kustomize.config.k8s.io/v1beta1`,
            `kind: Kustomization`,
            `resources: [../base]`,
            `images:`,
            `  - name: payment-api`,
            `    newTag: v2.4.1`,
            `replicas:`,
            `  - name: payment-api`,
            `    count: 3`,
          ], { icon: 'terminal' }),
          zTruth: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'DECLARATIVE GITOPS REPOSITORY'),
        },
        links: {
          gk: h('gitRepo', 'kustomizeEngine', ['gitRepo', 'kustomizeEngine'], { label: 'read manifests' }),
          kt: h('kustomizeEngine', 'targetCluster', ['kustomizeEngine', 'targetCluster'], { label: 'target cluster' }),
        },
        flows: [{ route: ['gk', 'kt'], kind: 'git', rate: 1.4 }],
      },
    },
    {
      short: 'ArgoCD Controller',
      chapter: 'execution',
      title: 'The In-Cluster ArgoCD Application Controller',
      body: [
        'The <b>ArgoCD Application Controller</b> runs as an operator inside the Kubernetes cluster.',
        'It continuously queries two data sources: the Git repository (<b>Desired State</b>) and the Kubernetes API Server / etcd (<b>Live State</b>).',
      ],
      callout: {
        kind: 'tip',
        text: 'Running the controller in-cluster eliminates the need to expose cluster API ports or store kubeconfig admin secrets on external CI servers.',
      },
      changes: ['+ ArgoCD controller instantiated in argocd namespace', '+ Tracking Git repository at commit 4a8b1c', '+ Comparing live etcd resource tree against Git manifests'],
      metrics: { syncStatus: 'Synced (0 Drift)', healthStatus: 'Healthy', reconcileInterval: 'Continuous', driftPolicy: 'Self-Heal Active' },
      scene: {
        entities: {
          gitSource: y(-10, -18, { label: 'git-head', tags: [{ text: 'HEAD: 4a8b1c', icon: 'gitBranch' }] }),
          argoController: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'shield', label: ['ArgoCD Controller'], sub: 'Diff Engine: Git vs etcd' }),
          etcdState: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['Live etcd State'], sub: '3 Pods / 1 Service' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Application CRD Spec', [
            `apiVersion: argoproj.io/v1alpha1`,
            `kind: Application`,
            `metadata: { name: payment-api }`,
            `spec:`,
            `  project: default`,
            `  source: { repoURL: "git@github...", targetRevision: "main" }`,
            `  destination: { server: "https://kubernetes.default.svc" }`,
            `= Controller diffing every 3 minutes or on webhook`,
          ], { icon: 'terminal' }),
          zController: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'IN-CLUSTER RECONCILIATION ENGINE'),
        },
        links: {
          ga: h('gitSource', 'argoController', ['gitSource', 'argoController'], { label: 'fetch desired state' }),
          ae: h('argoController', 'etcdState', ['argoController', 'etcdState'], { label: 'compare live etcd' }),
        },
        flows: [{ route: ['ga', 'ae'], kind: 'git', rate: 1.5 }],
      },
    },
    {
      short: 'Drift Detection',
      chapter: 'investigation',
      title: 'Configuration Drift: OutOfSync Recognition',
      body: [
        'Suppose an engineer panics during an incident and runs manual commands: <code>kubectl edit deployment payment-api --replicas=10</code> directly in production.',
        'Within seconds, the ArgoCD diff engine flags the application status as <b>OutOfSync</b>. It computes a granular field-level JSON diff showing exactly how live state deviated from Git.',
      ],
      callout: {
        kind: 'caution',
        text: 'Manual changes made directly to the cluster cause configuration drift. Future automated deploys will overwrite or clash with these undocumented tweaks.',
      },
      changes: ['! Manual kubectl edit modified live replica count from 3 to 10', '! ArgoCD diff engine detected live field mismatch', '! Application status changed from Synced to OutOfSync'],
      metrics: { syncStatus: 'OutOfSync (Drift)', healthStatus: 'Degraded', reconcileInterval: 'Triggered Sync', driftPolicy: 'Awaiting Self-Heal' },
      scene: {
        entities: {
          gitSpec: y(-10, -18, { label: 'git-truth', tags: [{ text: 'Git: replicas: 3', tone: 'blue', icon: 'gitBranch' }] }),
          diffEngine: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'alert', label: ['OutOfSync Warning'], sub: 'Diff: replicas 3 != 10' }),
          liveCluster: b(10, 8, { s: 4.6, h: 48, color: 'amber', glyph: 'boxes', label: ['Cluster (Mutated)'], sub: '10 Pods (Unauthorized)' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'ArgoCD Field Diff', [
            `--- Git (Desired State)`,
            `+++ Live (Kubernetes etcd)`,
            `@@ spec.replicas @@`,
            `- replicas: 3`,
            `+ replicas: 10`,
            `! Status: OutOfSync (Drift detected at 14:22:04)`,
          ], { icon: 'terminal' }),
          zDrift: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'CONFIGURATION DRIFT RECOGNITION'),
        },
        links: {
          gd: h('gitSpec', 'diffEngine', ['gitSpec', 'diffEngine'], { label: 'expected spec' }),
          ld: h('liveCluster', 'diffEngine', ['liveCluster', 'diffEngine'], { label: 'mutated spec' }),
        },
        flows: [{ route: ['gd', 'ld'], kind: 'drift', rate: 1.8 }],
      },
    },
    {
      short: 'Automated Self-Healing',
      chapter: 'solution',
      title: 'Automated Self-Healing: Reverting Unauthorized Mutations',
      body: [
        'With <code>selfHeal: true</code> enabled in syncPolicy, ArgoCD does not wait for a human.',
        'It immediately issues a patch to the Kubernetes API server, scaling the replica count back down to 3 to match the approved Git state.',
      ],
      callout: {
        kind: 'tip',
        text: 'Self-healing acts as an automated security boundary, preventing unauthorized configuration tampering in production.',
      },
      changes: ['+ Self-healing triggered automatically', '+ Scaled live replicas back from 10 to 3', '+ Restored application to Synced & Healthy'],
      metrics: { syncStatus: 'Synced (Self-Healed)', healthStatus: 'Healthy', reconcileInterval: 'Continuous', driftPolicy: 'Active Self-Healing' },
      scene: {
        entities: {
          gitAuthor: y(-10, -18, { label: 'git-truth', tags: [{ text: 'Git: replicas: 3', tone: 'green', icon: 'shield' }] }),
          selfHealEngine: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'shield', label: ['Self-Healing Operator'], sub: 'Overriding live drift' }),
          restoredCluster: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['Cluster (Restored)'], sub: '3 Pods Running | Clean' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Self-Healing Sync Event', [
            `Event: AutoSyncTriggered`,
            `Reason: OutOfSync drift detected on payment-api`,
            `Action: kubectl patch deployment payment-api -p '{"spec":{"replicas":3}}'`,
            `Result: Live state restored to match Git HEAD`,
            `= Application status: Synced & Healthy`,
          ], { icon: 'terminal' }),
          zHeal: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'SELF-HEALING RESTORATION'),
        },
        links: {
          gs: h('gitAuthor', 'selfHealEngine', ['gitAuthor', 'selfHealEngine'], { label: 'enforce truth' }),
          sc: h('selfHealEngine', 'restoredCluster', ['selfHealEngine', 'restoredCluster'], { label: 'apply corrective patch' }),
        },
        flows: [{ route: ['gs', 'sc'], kind: 'heal', rate: 1.6 }],
      },
    },
    {
      short: 'Sync Waves',
      chapter: 'execution',
      title: 'Sync Waves: Dependency-Ordered Rollouts',
      body: [
        'Enterprise rollouts require strict ordering: database schema migrations must complete before new application pods boot.',
        'ArgoCD provides <b>Sync Waves</b> using annotations: <code>argocd.argoproj.io/sync-wave: "1"</code> runs DB migration Jobs. Only after they exit with code 0 does ArgoCD execute Wave 2 (Deployments).',
      ],
      callout: {
        kind: 'insight',
        text: 'Sync waves eliminate deployment race conditions where new pods crash because the database migration has not completed.',
      },
      changes: ['+ Wave 1: Executed Flyway database migration Job', '+ Waited for Job completion status: Succeeded', '+ Wave 2: Booted application pods connecting to updated schema'],
      metrics: { syncStatus: 'Wave 2 Active', healthStatus: 'Healthy', reconcileInterval: 'Step Sequenced', driftPolicy: 'Ordered Waves' },
      scene: {
        entities: {
          waveCoordinator: y(-10, -18, { label: 'waves', tags: [{ text: 'Sync Wave Pipeline', icon: 'cpu' }] }),
          dbMigrationJob: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['Wave 1: DB Job'], sub: 'Flyway migration completed' }),
          appPods: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['Wave 2: App Pods'], sub: 'Booted safely' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Sync Wave Annotation Spec', [
            `metadata:`,
            `  annotations:`,
            `    argocd.argoproj.io/sync-wave: "1"`,
            `kind: Job · name: db-migrate (Wave 1: OK)`,
            `---`,
            `metadata:`,
            `  annotations:`,
            `    argocd.argoproj.io/sync-wave: "2"`,
            `kind: Deployment · name: payment-api (Wave 2)`,
          ], { icon: 'terminal' }),
          zWave: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'SYNC WAVE DEPENDENCY ORDERING'),
        },
        links: {
          wd: h('waveCoordinator', 'dbMigrationJob', ['waveCoordinator', 'dbMigrationJob'], { label: 'wave 1 execute' }),
          da: h('dbMigrationJob', 'appPods', ['dbMigrationJob', 'appPods'], { label: 'wave 1 ok -> wave 2' }),
        },
        flows: [{ route: ['wd', 'da'], kind: 'git', rate: 1.5 }],
      },
    },
    {
      short: 'Resource Pruning',
      chapter: 'solution',
      title: 'Automated Resource Pruning: Zero Orphaned Leftovers',
      body: [
        'When an old microservice or ConfigMap is deleted from Git, traditional scripts often leave orphaned resources running in the cluster forever.',
        'With <code>prune: true</code> enabled, ArgoCD compares the live tree against Git and deletes any live resource whose manifest was removed from the repository.',
      ],
      callout: {
        kind: 'tip',
        text: 'Automated pruning guarantees that cluster state matches Git exactly — no orphaned services or dangling volumes remain.',
      },
      changes: ['+ Decommissioned old-service manifest removed from Git', '+ ArgoCD prune engine issued DELETE old-service', '+ Cluster cleanly garbage collected'],
      metrics: { syncStatus: 'Synced (Pruned)', healthStatus: 'Healthy', reconcileInterval: '3m (Idle)', driftPolicy: 'Auto-Prune Active' },
      scene: {
        entities: {
          gitPruned: y(-10, -18, { label: 'git-commit', tags: [{ text: 'rm old-service.yaml', tone: 'rose', icon: 'trash' }] }),
          pruneEngine: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'shield', label: ['Prune Controller'], sub: 'Reaps orphaned objects' }),
          cleanCluster: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['Clean Cluster'], sub: 'Zero orphaned pods' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Prune Deletion Audit', [
            `Action: Pruning orphaned resource`,
            `Deleted: Deployment/old-auth-service`,
            `Deleted: Service/old-auth-service`,
            `Deleted: ConfigMap/old-auth-config`,
            `= Cluster state matches Git HEAD 100%`,
          ], { icon: 'terminal' }),
          zPrune: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'AUTOMATED RESOURCE PRUNING'),
        },
        links: {
          gp: h('gitPruned', 'pruneEngine', ['gitPruned', 'pruneEngine'], { label: 'manifest removed' }),
          pc: h('pruneEngine', 'cleanCluster', ['pruneEngine', 'cleanCluster'], { label: 'prune orphaned objects' }),
        },
        flows: [{ route: ['gp', 'pc'], kind: 'heal', rate: 1.5 }],
      },
    },
  ],
};
