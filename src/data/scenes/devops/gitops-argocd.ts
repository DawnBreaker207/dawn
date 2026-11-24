// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitopsArgocdLesson = {
  id: 'gitops-argocd',
  title: 'GitOps Reconciliation Loop',
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
          gitRepo: y(-18, -6, { label: 'git-repo', tags: [{ text: 'k8s-manifests.git', tone: 'green', icon: 'gitBranch' }] }),
          argoController: d(-6, -2, { s: 4.8, h: 50, color: 'blue', glyph: 'package', label: ['ArgoCD Controller'], sub: 'prod overlay' }),
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
        },
        links: {
          ga: h('gitRepo', 'argoController', ['gitRepo', 'argoController'], { label: 'read manifests' }),
        },
        flows: [{ route: ['ga'], kind: 'git', rate: 1.4 }],
      },
    },
    {
      short: 'ArgoCD Controller',
      chapter: 'execution',
      title: 'The In-Cluster ArgoCD Application Controller',
      body: [
        'The ArgoCD Application Controller runs inside the Kubernetes cluster. It polls the Git repository (or receives webhooks) and pulls the desired manifests.',
        'Simultaneously, it connects to the local Kubernetes API server to query live objects in <b>etcd</b>, running a continuous three-way diff engine.',
      ],
      callout: {
        kind: 'insight',
        text: 'Because the controller runs in-cluster, Kubernetes API credentials never leave the cluster boundary, eliminating push-based credential leaks.',
      },
      changes: ['+ ArgoCD controller established live watch on K8s API server', '+ Ingested desired state from git master commit', '+ Compared Git declarative tree against live etcd cluster state'],
      metrics: { syncStatus: 'Synced', healthStatus: 'Healthy (3/3)', reconcileInterval: 'Continuous Loop', driftPolicy: 'Self-Heal Active' },
      scene: {
        entities: {
          gitRepo: y(-18, -6, { label: 'git-repo', tags: [{ text: 'k8s-manifests.git', tone: 'green', icon: 'gitBranch' }] }),
          argoController: d(-6, -2, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['ArgoCD Controller'], sub: 'git vs etcd' }),
          k8sCluster: b(6, 0, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['K8s Production'], sub: '3 clean pods' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Application CRD Spec', [
            `apiVersion: argoproj.io/v1alpha1`,
            `kind: Application`,
            `spec:`,
            `  source:`,
            `    repoURL: https://github.com/org/k8s`,
            `    path: overlays/production`,
            `  destination:`,
            `    server: https://kubernetes.default.svc`,
            `= In-cluster controller diffing Git vs etcd`,
          ], { icon: 'terminal' }),
        },
        links: {
          ga: h('gitRepo', 'argoController', ['gitRepo', 'argoController'], { label: 'desired state' }),
          ak: h('argoController', 'k8sCluster', ['argoController', 'k8sCluster'], { label: 'live state' }),
        },
        flows: [{ route: ['ga', 'ak'], kind: 'git', rate: 1.5 }],
      },
    },
    {
      short: 'Drift Detection',
      chapter: 'execution',
      title: 'Configuration Drift: Unauthorized Cluster Mutations',
      body: [
        'During an incident, an engineer runs an unauthorized command directly: <code>kubectl scale deployment payment-api --replicas=10</code>.',
        'The controller detects that the live etcd state diverged from Git: <code>replicas: 3 (desired) != 10 (actual)</code>. The application status immediately flips to <b>OutOfSync</b>.',
      ],
      callout: {
        kind: 'caution',
        text: 'Manual kubectl changes are anti-patterns that create "snowflake clusters". Drift detection prevents silent divergence.',
      },
      changes: ['+ Manual kubectl scale command executed against production', '+ Live etcd state diverged from Git (replicas: 10 vs 3)', '+ ArgoCD flagged application status as OutOfSync'],
      metrics: { syncStatus: 'OutOfSync (Drift)', healthStatus: 'Degraded', reconcileInterval: 'Instant Event', driftPolicy: 'Auto-Sync Triggered' },
      scene: {
        entities: {
          gitRepo: y(-18, -6, { label: 'git-repo', tags: [{ text: 'k8s-manifests.git', tone: 'green', icon: 'gitBranch' }] }),
          argoController: d(-6, -2, { s: 4.8, h: 50, color: 'orange', glyph: 'alert', label: ['ArgoCD Controller'], sub: 'replica drift' }),
          k8sCluster: b(6, 0, { s: 4.6, h: 48, color: 'red', glyph: 'boxes', label: ['K8s Production'], sub: '10 drift pods' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'ArgoCD Field Diff', [
            `Resource: apps/v1 Deployment payment-api`,
            `Diff found at path .spec.replicas:`,
            `- desired (Git):  3`,
            `+ actual  (etcd): 10`,
            `Status: OutOfSync · Severity: Warning`,
            `Action: Queued for automated reconciliation`,
          ], { icon: 'terminal' }),
        },
        links: {
          ga: h('gitRepo', 'argoController', ['gitRepo', 'argoController'], { label: 'desired (3)' }),
          ak: h('argoController', 'k8sCluster', ['argoController', 'k8sCluster'], { label: 'actual (10)' }),
        },
        flows: [{ route: ['ak'], kind: 'drift', rate: 2.0 }],
      },
    },
    {
      short: 'Auto Self-Healing',
      chapter: 'execution',
      title: 'Automated Self-Healing: Enforcing Git Authority',
      body: [
        'With <code>selfHeal: true</code> configured, ArgoCD refuses to accept unauthorized live mutations.',
        'The controller issues a <code>Server-Side Apply (SSA)</code> patch to the Kubernetes API, scaling the deployment back down to 3 pods to match the Git truth.',
      ],
      callout: {
        kind: 'insight',
        text: 'Automated self-healing guarantees that Git remains the inviolable single source of truth, making accidental or malicious tampering futile.',
      },
      changes: ['+ Self-healing policy initiated automatic reconciliation', '+ Overrode unauthorized live replica count via Server-Side Apply', '+ Cluster converged back to 3 running pods'],
      metrics: { syncStatus: 'Synced (Healed)', healthStatus: 'Healthy (3/3)', reconcileInterval: 'Loop Active', driftPolicy: 'Self-Healed' },
      scene: {
        entities: {
          gitRepo: y(-18, -6, { label: 'git-repo', tags: [{ text: 'k8s-manifests.git', tone: 'green', icon: 'gitBranch' }] }),
          argoController: d(-6, -2, { s: 4.8, h: 50, color: 'green', glyph: 'shield', label: ['ArgoCD Controller'], sub: 'override drift' }),
          k8sCluster: b(6, 0, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['K8s Production'], sub: '3 clean pods' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Self-Healing Sync Event', [
            `Event: AutoSyncTriggered`,
            `Patch: spec.replicas -> 3`,
            `Strategy: Server-Side Apply (fieldManager=argocd)`,
            `Result: 7 unauthorized pods terminated`,
            `= Reconciled: Cluster matches Git commit exactly`,
          ], { icon: 'terminal' }),
        },
        links: {
          ga: h('gitRepo', 'argoController', ['gitRepo', 'argoController'], { label: 'git truth' }),
          ak: h('argoController', 'k8sCluster', ['argoController', 'k8sCluster'], { label: 'reconcile' }),
        },
        flows: [{ route: ['ga', 'ak'], kind: 'heal', rate: 1.8 }],
      },
    },
    {
      short: 'Sync Waves',
      chapter: 'execution',
      title: 'Sync Waves: Dependency-Ordered Zero-Downtime Rollouts',
      body: [
        'Complex microservices require strict ordering: database migrations must execute <em>before</em> application pods deploy, which must start <em>before</em> Ingress routes traffic.',
        'ArgoCD <b>Sync Waves</b> (<code>argocd.argoproj.io/sync-wave: "1"</code>) guarantee that wave 0 hooks finish successfully before wave 1 resources begin deploying.',
      ],
      callout: {
        kind: 'tip',
        text: 'Sync waves eliminate migration race conditions where new application pods crash-loop because database schema updates have not completed.',
      },
      changes: ['+ Executed Wave 0 PreSync database migration hook', '+ Migration verified healthy; triggered Wave 1 Deployment', '+ Ingress route mapped in Wave 2'],
      metrics: { syncStatus: 'Wave 1 Active', healthStatus: 'Healthy', reconcileInterval: 'Sync Wave 1/2', driftPolicy: 'Ordered Rollout' },
      scene: {
        entities: {
          gitRepo: y(-18, -6, { label: 'git-repo', tags: [{ text: 'k8s-manifests.git', tone: 'green', icon: 'gitBranch' }] }),
          argoController: d(-6, -2, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['ArgoCD Controller'], sub: 'git vs etcd' }),
          k8sCluster: b(6, 0, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['K8s Production'], sub: '3 clean pods' }),
          syncCoordinator: d(-4, 16, { s: 4.6, h: 48, color: 'purple', glyph: 'clock', label: ['PreSync Hook'], sub: 'flyway pass' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Sync Wave Annotation Spec', [
            `Wave -1: [Job] Flyway DB Migration    -> PASS (12s)`,
            `Wave  0: [ConfigMap] App Config Maps  -> Synced`,
            `Wave  1: [Deployment] Payment API v2  -> Running`,
            `Wave  2: [Ingress] Public Routing     -> Active`,
            `= Zero crash-loops during database schema evolution`,
          ], { icon: 'terminal' }),
        },
        links: {
          as: h('argoController', 'syncCoordinator', ['argoController', 'syncCoordinator'], { label: 'wave 0 hook' }),
          sk: h('syncCoordinator', 'k8sCluster', ['syncCoordinator', 'k8sCluster'], { label: 'apply schema' }),
        },
        flows: [{ route: ['as', 'sk'], kind: 'git', rate: 1.6 }],
      },
    },
    {
      short: 'Auto Pruning',
      chapter: 'solution',
      title: 'Automated Resource Pruning: Garbage Collecting Deleted YAML',
      body: [
        'When a developer deletes an old microservice or feature flag YAML from Git, what happens to the live Kubernetes resource?',
        'With <code>Prune=true</code> enabled, ArgoCD detects orphaned resources that exist in etcd but have no corresponding declaration in Git, automatically deleting them to prevent zombie workloads.',
      ],
      callout: {
        kind: 'insight',
        text: 'Automated pruning ensures Git is the bidirectional authority: creating in Git creates in K8s; deleting in Git deletes from K8s.',
      },
      changes: ['+ Detected obsolete v1.8 Canary service in cluster', '+ Prune policy garbage-collected orphaned Pods and Service', '+ Cluster state 100% clean and identical to Git'],
      metrics: { syncStatus: 'Synced (Pruned)', healthStatus: 'Healthy', reconcileInterval: '3m (Loop)', driftPolicy: 'Zero Orphans' },
      scene: {
        entities: {
          gitRepo: y(-18, -6, { label: 'git-repo', tags: [{ text: 'k8s-manifests.git', tone: 'green', icon: 'gitBranch' }] }),
          argoController: d(-6, -2, { s: 4.8, h: 50, color: 'green', glyph: 'shield', label: ['ArgoCD Controller'], sub: 'reap orphans' }),
          k8sCluster: b(6, 0, { s: 4.6, h: 48, color: 'green', glyph: 'boxes', label: ['K8s Production'], sub: 'zero orphans' }),
          prodService: b(14, 6, { s: 4.6, h: 48, color: 'blue', glyph: 'network', label: ['Payment Service'], sub: '3 clean pods' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Prune Deletion Audit', [
            `Prune candidate: payment-v1-canary`,
            `Action: kubectl delete deployment payment-v1-canary`,
            `Reason: Manifest deleted in Git commit c9a041`,
            `Audit log: Orphaned resources reaped safely`,
            `= Reconciled: Git and Cluster 100% in sync`,
          ], { icon: 'terminal' }),
        },
        links: {
          ak: h('argoController', 'k8sCluster', ['argoController', 'k8sCluster'], { label: 'prune orphans' }),
          kp: h('k8sCluster', 'prodService', ['k8sCluster', 'prodService'], { label: 'live service' }),
        },
        flows: [{ route: ['ak', 'kp'], kind: 'git', rate: 1.4 }],
      },
    },
  ],
};
