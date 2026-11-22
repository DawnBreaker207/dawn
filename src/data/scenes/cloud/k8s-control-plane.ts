// @ts-nocheck
/* eslint-disable */
import { makeBlock, makeDb, makeLink, makePanel } from '@/lib/simulator/scene-builders';

export const k8sControlPlaneLesson = {
  id: 'k8s-control-plane',
  title: 'Kubernetes Control Plane: API Server, etcd & Controllers',
  trackId: 'k8s',
  badge: 'Advanced',
  summary: 'Deconstruct the Kubernetes brain: kube-apiserver authentication and admission, distributed Raft storage in etcd, kube-scheduler filtering, and controller reconciliation loops.',
  steps: [
    {
      title: 'The Declaration: kubectl apply',
      short: 'YAML Submission',
      body: [
        'Everything in Kubernetes is a declarative resource state. When a user runs `kubectl apply`, a JSON/YAML manifest is sent via HTTP POST to the API Server.',
        'The developer defines the *desired state*, and Kubernetes works continuously to make the *current state* match it.',
      ],
      scene: {
        entities: {
          clientDev: makeBlock(-2, -18, { s: 4.5, h: 42, color: 'blue', label: ['kubectl CLI', 'POST /apis/apps/v1'] }),
          apiServer: makeBlock(-2, -4, { s: 5, h: 46, color: 'purple', label: ['kube-apiserver', 'REST API Gateway'] }),
          etcdStore: makeDb(-2, 12, { r: 2.2, h: 36, color: 'store', label: 'etcd Key-Value Store' }),
          card: makePanel({ x: -12, y: 4 }, 'Desired State', [
            'apiVersion: apps/v1',
            'kind: Deployment',
            'spec: { replicas: 3 }',
            'Declarative intent in YAML',
          ]),
        },
        links: {
          clientDev_apiServer: makeLink('clientDev', 'apiServer', ['clientDev', 'apiServer'], { label: 'TLS HTTPS request' }),
          apiServer_etcdStore: makeLink('apiServer', 'etcdStore', ['apiServer', 'etcdStore'], { label: 'Raft consensus write' }),
        },
      },
    },
    {
      title: 'kube-apiserver Pipeline',
      short: 'Auth, Admission & Validation',
      body: [
        'The API Server is the only component in the cluster that talks directly to etcd.',
        'Every incoming request undergoes a strict pipeline: Authentication → RBAC Authorization → Mutating Webhooks → Schema Validation → Validating Webhooks.',
      ],
      scene: {
        entities: {
          authModule: makeBlock(-12, -14, { s: 4, h: 42, color: 'blue', label: ['Authn & RBAC', 'Token & Role check'] }),
          mutatingHook: makeBlock(4, -14, { s: 4, h: 42, color: 'orange', label: ['Mutating Webhook', 'Sidecar injection'] }),
          validator: makeBlock(-12, 4, { s: 4, h: 42, color: 'purple', label: ['Validator', 'Schema & OPA rules'] }),
          raftCommit: makeDb(4, 4, { r: 2.2, h: 36, color: 'store', label: 'etcd: /registry/pods' }),
          card: makePanel({ x: -2, y: 14 }, 'apiserver Pipeline', [
            '1. Authn (X509 / OIDC tokens)',
            '2. Authz (RBAC ClusterRoles)',
            '3. Mutate (Inject sidecars)',
            '4. Validate (OpenAPI / OPA)',
          ]),
        },
        links: {
          authModule_mutatingHook: makeLink('authModule', 'mutatingHook', ['authModule', 'mutatingHook'], { label: 'authenticated' }),
          mutatingHook_validator: makeLink('mutatingHook', 'validator', ['mutatingHook', 'validator'], { label: 'mutated spec' }),
          validator_raftCommit: makeLink('validator', 'raftCommit', ['validator', 'raftCommit'], { label: 'passed: persist' }),
        },
      },
    },
    {
      title: 'etcd: The Source of Truth',
      short: 'Raft Consensus KV',
      body: [
        'etcd is a strongly consistent, distributed key-value store using the Raft consensus algorithm.',
        'It maintains a monotonic revision counter (`resourceVersion`). Watch streams notify controllers whenever keys change, avoiding polling overhead.',
      ],
      scene: {
        entities: {
          leaderEtcd: makeDb(-2, -14, { r: 2.4, h: 38, color: 'green', label: 'etcd Leader (Node 1)' }),
          followerA: makeDb(-10, 4, { r: 2, h: 34, color: 'slab', label: 'etcd Follower (Node 2)' }),
          followerB: makeDb(6, 4, { r: 2, h: 34, color: 'slab', label: 'etcd Follower (Node 3)' }),
          card: makePanel({ x: -12, y: 14 }, 'Raft Consensus', [
            'etcdctl get /registry/deployments',
            'Strong Consistency (CP)',
            'Quorum: (3/2) + 1 = 2 nodes',
          ]),
        },
        links: {
          leaderEtcd_followerA: makeLink('leaderEtcd', 'followerA', ['leaderEtcd', 'followerA'], { label: 'Raft appendEntries' }),
          leaderEtcd_followerB: makeLink('leaderEtcd', 'followerB', ['leaderEtcd', 'followerB'], { label: 'Raft appendEntries' }),
        },
      },
    },
    {
      title: 'kube-controller-manager (Reconciliation Loop)',
      short: 'Deployment & ReplicaSet',
      body: [
        'kube-controller-manager embeds controllers (Deployment, ReplicaSet, Node, EndpointSlice).',
        'The DeploymentController reacts to the new manifest, creates a ReplicaSet, which in turn creates 3 unbound Pod objects with `nodeName: ""` in etcd.',
      ],
      scene: {
        entities: {
          depCtrl: makeBlock(-10, -14, { s: 4, h: 42, color: 'purple', label: ['Deployment Controller', 'Reconciles Specs'] }),
          rsCtrl: makeBlock(6, -14, { s: 4, h: 42, color: 'orange', label: ['ReplicaSet Controller', 'Desired: 3 Pods'] }),
          unboundPods: makeBlock(-2, 4, { s: 4.5, h: 44, color: 'blue', label: ['3 Unbound Pods', 'nodeName: "" (Pending)'] }),
          card: makePanel({ x: -12, y: 14 }, 'Reconciliation Loop', [
            'for {',
            '  if actual < desired: createPod()',
            '  if actual > desired: deletePod()',
            '}',
          ]),
        },
        links: {
          depCtrl_rsCtrl: makeLink('depCtrl', 'rsCtrl', ['depCtrl', 'rsCtrl'], { label: 'creates RS' }),
          rsCtrl_unboundPods: makeLink('rsCtrl', 'unboundPods', ['rsCtrl', 'unboundPods'], { label: 'generates pod specs' }),
        },
      },
    },
    {
      title: 'kube-scheduler (Filtering & Scoring)',
      short: 'Node Selection Algorithm',
      body: [
        'kube-scheduler watches for Pods with an empty `nodeName`.',
        'It applies a two-step algorithm: Filtering (eliminates unsuitable nodes) followed by Scoring (ranks surviving nodes to choose the best host).',
      ],
      scene: {
        entities: {
          scheduler: makeBlock(-2, -16, { s: 4.8, h: 44, color: 'blue', label: ['kube-scheduler', 'Filter & Score'] }),
          workerNode1: makeBlock(-10, 2, { s: 4, h: 42, color: 'slab', label: ['Worker 1', 'Score: 62 (Loaded)'] }),
          workerNode2: makeBlock(6, 2, { s: 4, h: 42, color: 'green', label: ['Worker 2', 'Score: 89 (Selected!)'] }),
          card: makePanel({ x: -12, y: 14 }, 'Scheduler Two-Step', [
            '1. Filter (NodeResourcesFit)',
            '2. Score (ImageLocality / Spread)',
            'Worker 2 wins -> binds pod',
          ]),
        },
        links: {
          scheduler_workerNode1: makeLink('scheduler', 'workerNode1', ['scheduler', 'workerNode1'], { label: 'filters pass' }),
          scheduler_workerNode2: makeLink('scheduler', 'workerNode2', ['scheduler', 'workerNode2'], { label: 'highest rank: BIND' }),
        },
      },
    },
    {
      title: 'Control Plane Convergence',
      short: 'Complete Control Flow',
      body: [
        'No component commands another directly. Every entity watches etcd via the API Server and reacts asynchronously to state changes.',
        'This decoupled, event-driven reconciliation model makes Kubernetes extraordinarily resilient to network splits and node failures.',
      ],
      scene: {
        entities: {
          apiGateway: makeBlock(-2, -18, { s: 5, h: 44, color: 'purple', label: ['kube-apiserver', 'State Hub'] }),
          etcdCentral: makeDb(-2, -4, { r: 2.2, h: 36, color: 'store', label: 'etcd Core DB' }),
          ctrlMgr: makeBlock(-12, 12, { s: 4, h: 42, color: 'orange', label: ['Controllers', 'State Reconcilers'] }),
          schedModule: makeBlock(8, 12, { s: 4, h: 42, color: 'blue', label: ['Scheduler', 'Placement Engine'] }),
        },
        links: {
          apiGateway_etcdCentral: makeLink('apiGateway', 'etcdCentral', ['apiGateway', 'etcdCentral'], { label: 'consensus write' }),
          ctrlMgr_apiGateway: makeLink('ctrlMgr', 'apiGateway', ['ctrlMgr', 'apiGateway'], { label: 'watch & mutate' }),
          schedModule_apiGateway: makeLink('schedModule', 'apiGateway', ['schedModule', 'apiGateway'], { label: 'watch & bind' }),
        },
      },
    },
  ],
};
