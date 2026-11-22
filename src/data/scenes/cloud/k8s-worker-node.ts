// @ts-nocheck
/* eslint-disable */
import { makeBlock, makeLink, makePanel } from '@/lib/simulator/scene-builders';

export const k8sWorkerNodeLesson = {
  id: 'k8s-worker-node',
  title: 'Worker Nodes: Kubelet, CRI, Pod Lifecycle & Health Probes',
  trackId: 'k8s',
  badge: 'Intermediate',
  summary: 'Follow the execution on a Kubernetes Worker Node: Kubelet sync loop, CRI runtime calls via containerd, pause container networking, and Liveness/Readiness/Startup health probes.',
  metrics: ['kubelet_sync', 'cri_runtime', 'pod_status', 'probes'],
  goals: [
    { text: 'Kubelet Sync Loop & Watches', step: 1 },
    { text: 'CRI gRPC Runtime Workflow', step: 2 },
    { text: 'Pause Container & Network Pod', step: 3 },
    { text: 'Pod Startup Sequence', step: 4 },
    { text: 'Liveness & Readiness Probes', step: 5 },
  ],
  steps: [
    {
      title: 'Kubelet Sync Loop',
      short: 'Pod Assignment Detection',
      body: [
        'Kubelet is the primary node agent running as a systemd service on every worker machine.',
        'It maintains an active Watch connection to the API Server, listening specifically for Pods assigned to its own node name.',
      ],
      scene: {
        entities: {
          apiMaster: makeBlock(-2, -16, { s: 5, h: 44, color: 'purple', label: ['kube-apiserver', 'Master Endpoint'] }),
          kubeletDaemon: makeBlock(-2, -2, { s: 4.8, h: 44, color: 'blue', label: ['kubelet agent', 'Node Controller'] }),
          syncWorker: makeBlock(-2, 12, { s: 4.2, h: 42, color: 'orange', label: ['syncPod() Routine', 'Generates PodStatus'] }),
          card: makePanel({ x: -12, y: 4 }, 'Kubelet Watch', [
            'GET /api/v1/pods?nodeName=worker-2',
            'Receives ADD event',
            'Spawns syncPod() goroutine',
          ]),
        },
        links: {
          apiMaster_kubeletDaemon: makeLink('apiMaster', 'kubeletDaemon', ['apiMaster', 'kubeletDaemon'], { label: 'Watch: ADD pod' }),
          kubeletDaemon_syncWorker: makeLink('kubeletDaemon', 'syncWorker', ['kubeletDaemon', 'syncWorker'], { label: 'dispatches worker' }),
        },
      },
    },
    {
      title: 'Container Runtime Interface (CRI)',
      short: 'gRPC Communication',
      body: [
        'Kubelet does not create containers directly. It delegates container lifecycle management to the container runtime via CRI (Container Runtime Interface) over gRPC.',
        'Containerd or CRI-O translates these gRPC calls into OCI-compliant commands executed by runc.',
      ],
      scene: {
        entities: {
          kubeletCli: makeBlock(-10, -14, { s: 4, h: 42, color: 'blue', label: ['Kubelet', 'CRI Client'] }),
          criShim: makeBlock(6, -14, { s: 4, h: 42, color: 'purple', label: ['CRI Plugin', 'containerd gRPC'] }),
          runcWorker: makeBlock(6, 4, { s: 4, h: 42, color: 'green', label: ['runc runtime', 'Kernel Namespaces'] }),
          card: makePanel({ x: -10, y: 4 }, 'CRI gRPC API', [
            'RunPodSandbox()',
            'CreateContainer()',
            'StartContainer()',
          ]),
        },
        links: {
          kubeletCli_criShim: makeLink('kubeletCli', 'criShim', ['kubeletCli', 'criShim'], { label: 'RunPodSandbox()' }),
          criShim_runcWorker: makeLink('criShim', 'runcWorker', ['criShim', 'runcWorker'], { label: 'spawns processes' }),
        },
      },
    },
    {
      title: 'The Pause Container (Infra Container)',
      short: 'Network & IPC Anchor',
      body: [
        'A Pod is not a single container. To let multiple containers share the same network stack and IP address, Kubernetes launches a tiny `pause` container first.',
        'All application containers join the network namespace held open by the pause container, enabling them to communicate over `localhost`.',
      ],
      scene: {
        entities: {
          pauseInfra: makeBlock(-2, -14, { s: 4.5, h: 44, color: 'slab', label: ['Pause Container', 'Holds Net/IPC NS'] }),
          appContainer: makeBlock(-10, 4, { s: 4, h: 42, color: 'blue', label: ['App: Order API', 'Port 8080'] }),
          sidecarContainer: makeBlock(6, 4, { s: 4, h: 42, color: 'orange', label: ['Sidecar: Envoy/Log', 'localhost access'] }),
        },
        links: {
          appContainer_pauseInfra: makeLink('appContainer', 'pauseInfra', ['appContainer', 'pauseInfra'], { label: 'shares IP & netns' }),
          sidecarContainer_pauseInfra: makeLink('sidecarContainer', 'pauseInfra', ['sidecarContainer', 'pauseInfra'], { label: 'shares IP & netns' }),
          sidecarContainer_appContainer: makeLink('sidecarContainer', 'appContainer', ['sidecarContainer', 'appContainer'], { label: 'localhost talk' }),
        },
      },
    },
    {
      title: 'Pod Health Probes: Startup, Liveness & Readiness',
      short: 'Probes Triad',
      body: [
        'Kubelet continuously executes 3 distinct probe checks:',
        '1. **Startup Probe:** Protects slow-starting apps (e.g. JVM warm-up).',
        '2. **Liveness Probe:** Detects deadlocks and restarts unresponsive containers.',
        '3. **Readiness Probe:** Controls traffic routing; failed probes detach the Pod from Service EndpointSlices.',
      ],
      scene: {
        entities: {
          kubeletChecker: makeBlock(-2, -16, { s: 4.8, h: 44, color: 'blue', label: ['Kubelet Prober', 'Periodic Checks'] }),
          livenessAction: makeBlock(-10, 2, { s: 4, h: 42, color: 'purple', label: ['Liveness Failed', 'Restart Container!'] }),
          readinessAction: makeBlock(6, 2, { s: 4, h: 42, color: 'orange', label: ['Readiness Failed', 'Cut Traffic from VIP'] }),
          card: makePanel({ x: -12, y: 14 }, 'Probes Triad', [
            'Startup: waits for boot',
            'Liveness: restarts on freeze',
            'Readiness: controls traffic endpoints',
          ]),
        },
        links: {
          kubeletChecker_livenessAction: makeLink('kubeletChecker', 'livenessAction', ['kubeletChecker', 'livenessAction'], { label: 'deadlock detected' }),
          kubeletChecker_readinessAction: makeLink('kubeletChecker', 'readinessAction', ['kubeletChecker', 'readinessAction'], { label: 'overloaded: drop traffic' }),
        },
      },
    },
    {
      title: 'Graceful Termination (preStop & SIGTERM)',
      short: 'Zero-Downtime Shutdown',
      body: [
        'Graceful termination guarantees zero dropped in-flight HTTP requests.',
        'Kubelet runs the preStop hook while network proxies asynchronously remove the Pod IP. After the grace period, Kubelet sends SIGTERM followed by SIGKILL.',
      ],
      scene: {
        entities: {
          termTrigger: makeBlock(-2, -16, { s: 4.5, h: 42, color: 'purple', label: ['kubectl delete pod', 'DeletionTimestamp set'] }),
          preStopDrain: makeBlock(-10, 0, { s: 4, h: 42, color: 'orange', label: ['preStop Hook', 'sleep 10s (drain inflight)'] }),
          sigTermKill: makeBlock(6, 0, { s: 4, h: 42, color: 'green', label: ['SIGTERM -> SIGKILL', '30s grace period'] }),
          cgroupCleanup: makeBlock(-2, 14, { s: 4.5, h: 42, color: 'slab', label: ['Kernel Cleanup', 'Deletes namespaces & cgroups'] }),
          card: makePanel({ x: -12, y: 12 }, 'Zero Downtime', [
            '1. Remove from EndpointSlice',
            '2. Run preStop hook',
            '3. SIGTERM -> 30s -> SIGKILL',
          ]),
        },
        links: {
          termTrigger_preStopDrain: makeLink('termTrigger', 'preStopDrain', ['termTrigger', 'preStopDrain'], { label: 'notifies container' }),
          preStopDrain_sigTermKill: makeLink('preStopDrain', 'sigTermKill', ['preStopDrain', 'sigTermKill'], { label: 'hook finished' }),
          sigTermKill_cgroupCleanup: makeLink('sigTermKill', 'cgroupCleanup', ['sigTermKill', 'cgroupCleanup'], { label: 'process exited' }),
        },
      },
    },
    {
      title: 'Worker Node Summary',
      short: 'Complete Node Architecture',
      body: [
        'The Worker Node is the execution muscle of Kubernetes.',
        'With Kubelet handling pod state, containerd managing processes, and CNI/Kube-proxy configuring routing, the node autonomously delivers reliable container operations.',
      ],
      scene: {
        entities: {
          kubeletBoss: makeBlock(-10, -14, { s: 4.2, h: 44, color: 'blue', label: ['Kubelet', 'State Coordinator'] }),
          containerdEng: makeBlock(6, -14, { s: 4.2, h: 44, color: 'orange', label: ['containerd (CRI)', 'Container Runtime'] }),
          kubeProxyNet: makeBlock(-10, 4, { s: 4.2, h: 44, color: 'purple', label: ['kube-proxy', 'iptables / IPVS'] }),
          cniPlugin: makeBlock(6, 4, { s: 4.2, h: 44, color: 'green', label: ['CNI (Calico/Cilium)', 'Pod Network IPAM'] }),
          card: makePanel({ x: -2, y: 14 }, 'Worker Node', [
            'Kubelet: watches API Server',
            'containerd: manages containers',
            'kube-proxy: routes VIP traffic',
            'CNI: assigns Pod IPs',
          ]),
        },
        links: {
          kubeletBoss_containerdEng: makeLink('kubeletBoss', 'containerdEng', ['kubeletBoss', 'containerdEng'], { label: 'gRPC lifecycle' }),
          kubeletBoss_cniPlugin: makeLink('kubeletBoss', 'cniPlugin', ['kubeletBoss', 'cniPlugin'], { label: 'setup network' }),
          kubeProxyNet_cniPlugin: makeLink('kubeProxyNet', 'cniPlugin', ['kubeProxyNet', 'cniPlugin'], { label: 'programs routes' }),
        },
      },
    },
  ],
};
