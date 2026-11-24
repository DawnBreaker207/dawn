// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitopsArgocdLesson = {
  id: 'gitops-argocd',
  title: 'GitOps Engine & Reconciliation Loop (ArgoCD / Flux)',
  summary: 'Master Cloud-Native continuous delivery. Explore the ArgoCD reconciliation loop: Desired State in Git vs Live State in Kubernetes etcd, OutOfSync drift detection, automated self-healing, and pruning.',
  minutes: 25,
  level: 'advanced',
  metrics: ['syncStatus', 'healthStatus', 'reconcileInterval', 'driftPolicy'],
  legend: ['flow', ['git', 'manifest tracking'], ['sync', 'etcd reconciliation']],
  goals: [
    { text: 'Single source of truth: Git declarative manifests (Helm / Kustomize)', step: 1 },
    { text: 'OutOfSync drift detection between Git and Kubernetes live state', step: 2 },
    { text: 'Automated Self-Healing, Sync Waves & Resource Pruning', step: 3 },
  ],
  steps: [
    {
      short: 'Desired vs Live',
      chapter: 'concept',
      title: 'Declarative Git vs Live Kubernetes etcd State',
      body: [
        'In GitOps, the entire infrastructure and application topology is stored declaratively in a Git repository using <b>Kustomize</b> or <b>Helm</b>.',
        'The <b>ArgoCD Application Controller</b> continuously reads the Git commit (<b>Desired State</b>) and queries the Kubernetes API server for the actual running pods, services, and ingresses (<b>Live State</b>).',
      ],
      callout: {
        kind: 'insight',
        text: 'GitOps eliminates kubectl access for engineers in production. All changes must be reviewed and merged in Git.',
      },
      metrics: { syncStatus: 'Synced', healthStatus: 'Healthy', reconcileInterval: 'Continuous (3m / Webhook)', driftPolicy: 'Self-Heal Active' },
      scene: {
        entities: {
          gitRepo: d(-10, 0, { color: 'blue', glyph: 'database', label: ['Git Repository'], sub: 'HEAD commit (Desired State)' }),
          argoController: d(0, 0, { color: 'purple', glyph: 'cpu', label: ['Application Controller'], sub: 'Diff Engine: Git vs etcd' }),
          k8sLive: d(10, 0, { color: 'green', glyph: 'boxes', label: ['Kubernetes Cluster'], sub: 'Live State in etcd' }),
          zGitOps: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'GITOPS CONTINUOUS MONITORING'),
        },
        links: {
          ga: h('gitRepo', 'argoController', ['gitRepo', 'argoController'], { label: 'read manifests' }),
          ak: h('argoController', 'k8sLive', ['argoController', 'k8sLive'], { label: 'query live objects' }),
        },
        flows: [{ route: ['ga', 'ak'], kind: 'git', rate: 1.4 }],
      },
    },
    {
      short: 'Drift Detection',
      chapter: 'investigation',
      title: 'OutOfSync Drift Detection',
      body: [
        'Suppose someone manually runs <code>kubectl edit deployment</code> or modifies replica counts directly in production, or a developer merges a new container image tag in Git.',
        'The ArgoCD diff engine immediately flags the application status as <b>OutOfSync</b>. It produces a granular field-level JSON diff showing exactly which fields diverged.',
      ],
      callout: {
        kind: 'caution',
        text: 'Configuration drift caused by manual "hotfixes" is the leading cause of mysterious production regressions during subsequent deployments.',
      },
      changes: ['! Manual kubectl edit modified replica count from 3 to 10', '+ ArgoCD reconciliation detected live field mismatch', '! Application status marked OutOfSync'],
      metrics: { syncStatus: 'OutOfSync (Drift Detected)', healthStatus: 'Degraded', reconcileInterval: 'Triggered Sync', driftPolicy: 'Awaiting Self-Heal' },
      scene: {
        entities: {
          gitDesired: d(-10, 0, { color: 'blue', glyph: 'database', label: ['Git: replicas: 3'], sub: 'Authorized source of truth' }),
          diffEngine: d(0, 0, { color: 'red', glyph: 'shield', label: ['OutOfSync Warning'], sub: 'Diff: replicas 3 != 10' }),
          unauthorizedLive: d(10, 0, { color: 'amber', glyph: 'boxes', label: ['Cluster: replicas: 10'], sub: 'Unauthorized manual edit' }),
          zDrift: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'CONFIGURATION DRIFT RECOGNITION'),
        },
        links: {
          gd: h('gitDesired', 'diffEngine', ['gitDesired', 'diffEngine'], { label: 'expected spec' }),
          ud: h('unauthorizedLive', 'diffEngine', ['unauthorizedLive', 'diffEngine'], { label: 'deviated spec' }),
        },
        flows: [{ route: ['gd', 'ud'], kind: 'git', rate: 1.8 }],
      },
    },
    {
      short: 'Self-Healing & Prune',
      chapter: 'solution',
      title: 'Automated Self-Healing & Resource Pruning',
      body: [
        'With <b>Self-Healing</b> enabled, ArgoCD overrides unauthorized cluster mutations and forces live state back into alignment with Git.',
        'With <b>Prune</b> enabled, any resources deleted from the Git repository (e.g. decommissioned ConfigMap or old Service) are safely cleaned up from the cluster.',
        'Deployments can be sequenced deterministically using <b>Sync Waves</b> and PostSync hooks.',
      ],
      callout: {
        kind: 'tip',
        text: 'Self-healing acts as an automated security boundary, instantly reverting unauthorized changes back to the approved Git state.',
      },
      changes: ['+ Self-healing reversed manual edit back to replicas: 3', '+ Pruned orphaned ConfigMaps deleted from Git', '+ Application restored to Synced & Healthy'],
      metrics: { syncStatus: 'Synced', healthStatus: 'Healthy', reconcileInterval: '3m (Idle)', driftPolicy: 'Automated Self-Heal Done' },
      scene: {
        entities: {
          gitTruth: d(-10, 0, { color: 'blue', glyph: 'database', label: ['Git State (HEAD)'], sub: 'Canonical definition' }),
          selfHeal: d(0, 0, { color: 'green', glyph: 'cpu', label: ['Self-Healing Engine'], sub: 'Reconciled & Pruned' }),
          k8sCluster: d(10, 0, { color: 'green', glyph: 'boxes', label: ['Live Cluster (Synced)'], sub: '3 Pods Running | Clean' }),
          zHeal: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'SELF-HEALING RESTORATION LOOP'),
        },
        links: {
          gt: h('gitTruth', 'selfHeal', ['gitTruth', 'selfHeal'], { label: 'enforce state' }),
          sk: h('selfHeal', 'k8sCluster', ['selfHeal', 'k8sCluster'], { label: 'apply manifests' }),
        },
        flows: [{ route: ['gt', 'sk'], kind: 'sync', rate: 1.6 }],
      },
    },
  ],
};
