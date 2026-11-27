import { makeBlock,makeLink,makePanel } from '@/lib/simulator/scene-builders';

export const k8sAutoscalingHpaLesson = {
  id: 'k8s-autoscaling-hpa',
  title: 'Autoscaling: Horizontal Pod Autoscaler (HPA), VPA & Cluster Autoscaler',
  trackId: 'k8s',
  badge: 'Intermediate',
  summary: 'Explore elasticity in Kubernetes: Metrics Server polling, HPA PID scaling formulas, Vertical Pod Autoscaling (VPA) right-sizing, and Cluster Autoscaler / Karpenter node provisioning.',
  metrics: ['target_cpu', 'current_cpu', 'replica_count', 'scaling_cooldown'],
  goals: [
    { text: 'Metrics Server Scraping API', step: 1 },
    { text: 'HPA PID Scaling Math Formula', step: 2 },
    { text: 'Custom Business Metrics Scaling', step: 3 },
    { text: 'VPA Automatic Resource Sizing', step: 4 },
    { text: 'Karpenter Fast Node Provisioning', step: 5 },
  ],
  steps: [
    {
      title: 'Metrics Server & Resource Metrics API',
      short: 'Metric Aggregation',
      body: [
        'Elasticity begins with real-time telemetry.',
        'The lightweight in-memory Metrics Server periodically scrapes CPU and Memory usage counters directly from Kubelet cgroup metrics on every node and serves them through the aggregated API.',
      ],
      scene: {
        entities: {
          kubeletScraper: makeBlock(-10, -14, { s: 4, h: 42, color: 'blue', label: ['Kubelet cgroups', 'CPU/RAM stats'] }),
          metricsServer: makeBlock(6, -14, { s: 4.5, h: 44, color: 'purple', label: ['Metrics Server', 'Aggregated API'] }),
          hpaController: makeBlock(-2, 4, { s: 4.8, h: 44, color: 'orange', label: ['HPA Controller', 'Polls metrics every 15s'] }),
          card: makePanel({ x: -12, y: 14 }, 'Metrics Scraping', [
            '$ kubectl top pods',
            'Metrics Server scrapes kubelet',
            'Serves /apis/metrics.k8s.io',
          ]),
        },
        links: {
          kubeletScraper_metricsServer: makeLink('kubeletScraper', 'metricsServer', ['kubeletScraper', 'metricsServer'], { label: '15s scrape' }),
          metricsServer_hpaController: makeLink('metricsServer', 'hpaController', ['metricsServer', 'hpaController'], { label: 'GET metrics' }),
        },
      },
    },
    {
      title: 'The HPA Scaling Algorithm',
      short: 'Math Formula & Smoothing',
      body: [
        'The Horizontal Pod Autoscaler calculates the exact number of replicas required to bring average resource utilization back to the desired target.',
        'A stabilization cooldown window prevents thrashing (flapping) during rapid metric fluctuations.',
      ],
      scene: {
        entities: {
          metricInput: makeBlock(-10, -14, { s: 4, h: 42, color: 'orange', label: ['Current CPU: 80%', 'Target: 50%'] }),
          scalingMath: makeBlock(6, -14, { s: 4.5, h: 44, color: 'purple', label: ['HPA Formula Engine', 'ceil[ 2 * (80/50) ] = 4'] }),
          replicaSetScale: makeBlock(-2, 4, { s: 5, h: 46, color: 'green', label: ['Scale ReplicaSet', 'Replicas: 2 -> 4'] }),
          card: makePanel({ x: -12, y: 14 }, 'HPA Formula', [
            'desired = ceil[ current * (val/target) ]',
            'desired = ceil[ 2 * (80 / 50) ] = 4',
            'Cooldown window prevents flap',
          ]),
        },
        links: {
          metricInput_scalingMath: makeLink('metricInput', 'scalingMath', ['metricInput', 'scalingMath'], { label: 'utilization ratio' }),
          scalingMath_replicaSetScale: makeLink('scalingMath', 'replicaSetScale', ['scalingMath', 'replicaSetScale'], { label: 'PATCH /scale' }),
        },
      },
    },
    {
      title: 'Scaling on Custom & External Metrics (KEDA)',
      short: 'Event-Driven Autoscaling',
      body: [
        'CPU is a lagging indicator. For message queues, scaling based on backlog depth is much faster.',
        'KEDA (Kubernetes Event-driven Autoscaling) queries external metric sources (Kafka lag, SQS queue depth, Redis lengths) and scales pods directly, including scaling to zero.',
      ],
      scene: {
        entities: {
          sqsQueue: makeBlock(-10, -14, { s: 4, h: 42, color: 'orange', label: ['AWS SQS Queue', 'Backlog: 200 msgs'] }),
          kedaMetrics: makeBlock(6, -14, { s: 4.5, h: 44, color: 'purple', label: ['KEDA Operator', 'Computes: 10 pods needed'] }),
          workerPods: makeBlock(-2, 4, { s: 5, h: 46, color: 'green', label: ['Queue Worker Fleet', 'Scales 0 -> 10 Pods'] }),
        },
        links: {
          sqsQueue_kedaMetrics: makeLink('sqsQueue', 'kedaMetrics', ['sqsQueue', 'kedaMetrics'], { label: 'polls queue depth' }),
          kedaMetrics_workerPods: makeLink('kedaMetrics', 'workerPods', ['kedaMetrics', 'workerPods'], { label: 'activates workers' }),
        },
      },
    },
    {
      title: 'Vertical Pod Autoscaler (VPA)',
      short: 'Right-Sizing CPU & RAM',
      body: [
        'While HPA adds more Pod replicas (scaling out), VPA increases CPU and memory limits of individual Pods (scaling up).',
        'VPA observes long-term historical resource profiles, eliminating developer guesswork and right-sizing allocations.',
      ],
      scene: {
        entities: {
          vpaRecommender: makeBlock(-10, -14, { s: 4.2, h: 42, color: 'blue', label: ['VPA Recommender', 'Analyzes OOM / waste'] }),
          vpaUpdater: makeBlock(6, -14, { s: 4.2, h: 42, color: 'purple', label: ['VPA Updater', 'Evicts under-sized pod'] }),
          rightSizedPod: makeBlock(-2, 4, { s: 5, h: 46, color: 'green', label: ['New Pod Spec', 'RAM upgraded 256M -> 1G'] }),
          card: makePanel({ x: -12, y: 14 }, 'VPA Right-Sizing', [
            'Recommends: 256M -> 1G',
            'Prevents OOMKilled errors',
            'Reduces idle node waste',
          ]),
        },
        links: {
          vpaRecommender_vpaUpdater: makeLink('vpaRecommender', 'vpaUpdater', ['vpaRecommender', 'vpaUpdater'], { label: 'new recommendation' }),
          vpaUpdater_rightSizedPod: makeLink('vpaUpdater', 'rightSizedPod', ['vpaUpdater', 'rightSizedPod'], { label: 'mutating admission' }),
        },
      },
    },
    {
      title: 'Cluster Autoscaler & Karpenter',
      short: 'Node Provisioning',
      body: [
        'When HPA scales up and nodes run out of capacity, Pods enter `Pending` state.',
        'Cluster Autoscaler or Karpenter detects un-schedulable pods, provisions new physical cloud nodes, and joins them to the cluster in seconds.',
      ],
      scene: {
        entities: {
          pendingPods: makeBlock(-10, -14, { s: 4, h: 42, color: 'orange', label: ['Pending Pods', 'Failed Scheduling'] }),
          karpenterEngine: makeBlock(6, -14, { s: 4.5, h: 44, color: 'purple', label: ['Karpenter Autoscaler', 'Bin-packing evaluation'] }),
          newEc2Node: makeBlock(-2, 4, { s: 5, h: 46, color: 'green', label: ['New EC2 Node (45s)', 'Joins cluster'] }),
          card: makePanel({ x: -12, y: 14 }, 'Karpenter Node Scaler', [
            'Detects unschedulable Pods',
            'Bypasses ASG: calls EC2 API',
            'Launches node in < 45 seconds',
          ]),
        },
        links: {
          pendingPods_karpenterEngine: makeLink('pendingPods', 'karpenterEngine', ['pendingPods', 'karpenterEngine'], { label: 'detects capacity gap' }),
          karpenterEngine_newEc2Node: makeLink('karpenterEngine', 'newEc2Node', ['karpenterEngine', 'newEc2Node'], { label: 'ec2:RunInstances' }),
        },
      },
    },
    {
      title: 'Autoscaling Architecture Summary',
      short: 'Multi-Tier Elasticity',
      body: [
        'The combination of HPA, VPA, and node-level autoscaling forms a fully self-healing, cost-optimized, and elastically scaling platform.',
      ],
      scene: {
        entities: {
          trafficLoad: makeBlock(-10, -14, { s: 4, h: 42, color: 'blue', label: ['Incoming Traffic', 'Surge Spike'] }),
          hpaLayer: makeBlock(6, -14, { s: 4, h: 42, color: 'orange', label: ['HPA Pod Scaler', 'Spawns 20 replicas'] }),
          karpenterLayer: makeBlock(-2, 4, { s: 4.8, h: 44, color: 'purple', label: ['Karpenter Node Scaler', 'Adds 3 EC2 nodes'] }),
          card: makePanel({ x: -12, y: 14 }, 'Autoscaling Pillars', [
            '1. Pod Horizontal (HPA / KEDA)',
            '2. Pod Vertical (VPA)',
            '3. Node Infrastructure (Karpenter)',
          ]),
        },
        links: {
          trafficLoad_hpaLayer: makeLink('trafficLoad', 'hpaLayer', ['trafficLoad', 'hpaLayer'], { label: 'metric surge' }),
          hpaLayer_karpenterLayer: makeLink('hpaLayer', 'karpenterLayer', ['hpaLayer', 'karpenterLayer'], { label: 'triggers node scale' }),
        },
      },
    },
  ],
};
