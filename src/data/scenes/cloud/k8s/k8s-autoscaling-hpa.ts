import { STAGE, codeCard, linkOf, makeDb, stageBlock, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// Seed → result. The Pods sit in the middle; every scaler is its own node attached to them.
//
//   1 traffic, pods (seed)          2 + metricsserver, + hpa
//   3 + queue, + keda (temporary)   4 keda + queue leave, + vpa
//   5 + karpenter                   6 everything together                     result
//
//                 metricsserver                  hpa
//   traffic ───── pods ──────────────────────── karpenter / queue
//   vpa / keda

const traffic = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph: `users`, label: [`traffic`], sub, tags });
const pods = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.main, { color: `green`, glyph: `boxes`, label: [`web Pods`], sub, tags });
const metricsserver = (tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph: `activity`, label: [`metrics-`, `server`], sub: `kubelet scrape`, tags });
const hpa = (tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `orange`, glyph: `gauge`, label: [`HPA`], sub: `target 50% CPU`, tags });
const queue = (tags: Tag[] = []) =>
  makeDb(STAGE.store.x, STAGE.store.y, { r: 2.2, h: 46, glyph: `inbox`, label: `SQS queue`, tags });
const keda = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller2, { color: `orange`, glyph: `filter`, label: [`KEDA`], sub: `ScaledObject`, tags });
const vpa = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller2, { color: `orange`, glyph: `scale`, label: [`VPA`], sub: `right-sizing`, tags });
const karpenter = (tags: Tag[] = []) =>
  stageBlock(STAGE.store, { color: `orange`, glyph: `rocket`, label: [`Karpenter`], sub: `node provisioner`, tags });

const links = {
  tp: (label?: string) => linkOf(`traffic`, `pods`, label),
  ms: (label?: string) => ({ ...linkOf(`metricsserver`, `pods`, label, false), labelAt: 0.6 }),
  hp: linkOf(`hpa`, `pods`, undefined, false),
  pq: linkOf(`pods`, `queue`, undefined, false),
  kd: linkOf(`keda`, `pods`, undefined, false),
  vp: linkOf(`vpa`, `pods`, undefined, false),
  kn: linkOf(`karpenter`, `pods`, undefined, false),
};

export const k8sAutoscalingHpaLesson: Lesson = {
  id: 'k8s-autoscaling-hpa',
  title: 'Autoscaling: Horizontal Pod Autoscaler (HPA), VPA & Cluster Autoscaler',
  summary:
    'Start with overloaded Pods and add one scaler per step: metrics-server with the HPA, event-driven KEDA, the VPA for right-sizing and Karpenter for nodes — until three layers cooperate.',
  minutes: 14,
  level: 'advanced',
  metrics: ['replicas', 'cpu', 'trigger', 'nodes'],
  legend: [[`req`, `traffic`], [`write`, `scale`], [`msg`, `metric`]],
  goals: [
    { text: 'Read Pod CPU/memory from metrics-server', step: 2 },
    { text: 'Apply the HPA replica formula and smoothing', step: 2 },
    { text: 'Scale on queue length with KEDA', step: 3 },
    { text: 'Right-size requests with the VPA', step: 4 },
    { text: 'Add nodes with Cluster Autoscaler / Karpenter', step: 5 },
    { text: 'Combine the three layers without fighting', step: 6 },
  ],
  steps: [
    {
      short: 'Overload',
      chapter: 'problem',
      title: 'Seed: two Pods, 90% CPU, rising load',
      body: [
        `Our web app runs as two Pods. At peak hour each one sits at <b>90% of its CPU request</b> and latency climbs. Someone could add Pods by hand, but load changes by the hour — we want the cluster to follow it by itself.`,
        `Autoscaling is built in layers. Each step adds one: first something to <em>measure</em> and <em>decide</em>, then event-driven scaling, then Pod sizing, then nodes.`,
      ],
      metrics: { replicas: '2', cpu: '90%', trigger: 'none', nodes: '3' },
      scene: {
        entities: {
          traffic: traffic(`800 req/s`, [{ text: `peak hour`, tone: `amber` }]),
          pods: pods(`2 replicas`, [{ text: `CPU 90% of request`, tone: `red`, icon: `alert` }]),
          card: codeCard(`Overloaded`, [`$ kubectl top pods -l app=web`, `NAME        CPU(cores)  MEMORY`, `web-7d9f-a   450m       210Mi`, `! request is 500m → 90% utilisation, nobody is scaling`]),
        },
        links: { tp: links.tp(`800/s`) },
        flows: [{ route: ['tp'], rate: 2, bounce: true }],
      },
    },
    {
      short: 'HPA',
      chapter: 'technique',
      title: '+ metrics-server and HPA: measure, then decide',
      body: [
        `<span class="term">metrics-server</span> polls every kubelet for each Pod’s CPU and memory and serves it through the <b>Metrics API</b> — the data behind <code>kubectl top</code>. The <b>HPA</b> reads it as utilisation: usage divided by the Pod’s <em>request</em>.`,
        `Every 15 s it computes <code>desired = ceil( current × metric / target )</code>. With 2 Pods at 90% and a 50% target: <code>ceil(2 × 90 / 50) = 4</code>. To avoid flapping it ignores changes under 10%, scales up fast, and waits a <span class="term">stabilisation window</span> (5 min) before scaling down.`,
      ],
      changes: [`+ metrics-server`, `+ HPA`, `~ replicas 2 → 4`],
      metrics: { replicas: '2 → 4', cpu: '90% → 45%', trigger: 'CPU 50%', nodes: '3' },
      scene: {
        entities: {
          traffic: traffic(`800 req/s`),
          pods: pods(`4 replicas`, [{ text: `CPU 45%`, tone: `green` }]),
          metricsserver: metricsserver([{ text: `Metrics API`, tone: `violet` }]),
          hpa: hpa([{ text: `ceil(2 × 90/50) = 4`, tone: `green`, icon: `zap` }]),
          card: codeCard(`The math`, [`desired = ceil[ current × (metric / target) ]`, `        = ceil[ 2 × (90 / 50) ] = 4`, `behavior.scaleDown.stabilizationWindowSeconds: 300`]),
        },
        links: { tp: links.tp(), ms: links.ms(`CPU 90%`), hp: links.hp },
        flows: [{ route: ['ms'], kind: 'msg', rate: 1.2 }, { route: ['hp'], kind: 'write', rate: 1 }, { route: ['tp'], rate: 2, bounce: true }],
      },
    },
    {
      short: 'KEDA',
      chapter: 'technique',
      title: '+ KEDA: scale on queues, not CPU',
      body: [
        `CPU is a lagging signal for a worker that drains a queue. <span class="term">KEDA</span> adds scalers for queue length, Kafka lag, Prometheus queries and cron, and feeds them to an HPA it manages for you.`,
        `It can also scale a Deployment to <b>zero</b> when there is nothing to do and wake it when the first message arrives — something the plain HPA cannot do.`,
      ],
      changes: [`+ SQS queue`, `+ KEDA`, `~ replicas 0 → 8`],
      metrics: { replicas: '0 → 8', cpu: 'low', trigger: 'queue ≥ 5', nodes: '3' },
      scene: {
        entities: {
          traffic: traffic(`5,000 msgs queued`, [{ text: `burst`, tone: `amber` }]),
          pods: pods(`8 workers`, [{ text: `draining queue`, tone: `green` }]),
          metricsserver: metricsserver(),
          hpa: hpa([{ text: `managed by KEDA`, tone: `violet` }]),
          queue: queue([{ text: `lag 5,000`, tone: `red` }]),
          keda: keda([{ text: `scale to 0 ok`, tone: `green` }]),
          card: codeCard(`Scale by lag`, [`kind: ScaledObject`, `spec:`, `  minReplicaCount: 0`, `  triggers: [{ type: aws-sqs-queue, metadata: { queueLength: "5" } }]`]),
        },
        links: { tp: links.tp(), ms: links.ms(), hp: links.hp, pq: links.pq, kd: links.kd },
        flows: [{ route: ['pq'], kind: 'msg', rate: 1.4, bounce: true }, { route: ['kd'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'VPA',
      chapter: 'technique',
      title: '+ VPA: make each Pod the right size',
      body: [
        `The queue story is done; back to web Pods. HPA adds more Pods; the <span class="term">Vertical Pod Autoscaler</span> changes how big each one is. It watches real usage and recommends better <code>requests</code> — here 500m → 220m CPU — so you stop paying for idle headroom, or fix Pods that get OOM-killed.`,
        `In <code>Auto</code> mode it evicts and re-creates Pods with the new size. Don’t let HPA and VPA both act on CPU for the same Deployment: they will fight. Use VPA for memory, HPA for CPU, or VPA in recommend-only mode.`,
      ],
      changes: [`+ VPA`, `− KEDA and queue (done)`],
      metrics: { replicas: '4', cpu: 'request 220m', trigger: 'usage history', nodes: '3' },
      scene: {
        entities: {
          traffic: traffic(`steady 400 req/s`),
          pods: pods(`4 replicas`, [{ text: `request 220m`, tone: `green` }]),
          metricsserver: metricsserver(),
          hpa: hpa([{ text: `on CPU`, tone: `violet` }]),
          vpa: vpa([{ text: `500m → 220m`, tone: `green`, icon: `gauge` }]),
          card: codeCard(`Recommend, then apply`, [`kind: VerticalPodAutoscaler`, `spec: { updatePolicy: { updateMode: "Auto" } }`, `$ kubectl describe vpa web | grep Target`, `Target: cpu 220m, memory 180Mi`]),
        },
        links: { tp: links.tp(), ms: links.ms(), hp: links.hp, vp: links.vp },
        flows: [{ route: ['vp'], kind: 'write', rate: 1 }, { route: ['tp'], rate: 1.5, bounce: true }],
      },
    },
    {
      short: 'Nodes',
      chapter: 'solution',
      title: '+ Karpenter: no room? Add a node',
      body: [
        `More replicas need somewhere to run. When new Pods are <b>Pending</b> because no node fits them, the <span class="term">Cluster Autoscaler</span> grows a node group; <span class="term">Karpenter</span> instead picks a fitting instance type directly and starts it, typically in ~60 s.`,
        `When nodes sit mostly empty for a while, they are drained and removed. This is what turns HPA’s Pods into an actual change on the cloud bill.`,
      ],
      changes: [`+ Karpenter`, `~ nodes 3 → 4`, `~ 4 Pods Pending → Running`],
      metrics: { replicas: '12', cpu: 'high', trigger: 'Pending Pods', nodes: '3 → 4' },
      scene: {
        entities: {
          traffic: traffic(`1,600 req/s`, [{ text: `2× peak`, tone: `red` }]),
          pods: pods(`12 replicas`, [{ text: `4 Pending`, tone: `amber`, icon: `alert` }]),
          metricsserver: metricsserver(),
          hpa: hpa([{ text: `12 desired`, tone: `green` }]),
          vpa: vpa(),
          karpenter: karpenter([{ text: `+1 node m6i.xlarge · ~60 s`, tone: `green`, icon: `clock` }]),
          card: codeCard(`Why a node appears`, [`$ kubectl get pods | grep Pending`, `web-7d9f-k2m  0/1  Pending  FailedScheduling: 0/3 nodes fit`, `= Karpenter launches an instance sized for the Pending Pods`]),
        },
        links: { tp: links.tp(), ms: links.ms(), hp: links.hp, vp: links.vp, kn: links.kn },
        flows: [{ route: ['kn'], kind: 'write', rate: 1 }, { route: ['hp'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'Together',
      chapter: 'recap',
      title: 'Result: three layers, one direction',
      body: [
        `Read the stack from the top: <b>HPA/KEDA</b> change the number of Pods to follow load; <b>VPA</b> keeps each Pod right-sized; <b>Karpenter</b> keeps enough nodes underneath. Each reacts to the layer above it, and the load has dropped again: replicas and nodes shrink back.`,
        `Set sensible <code>requests</code> first (everything keys off them), add a <code>PodDisruptionBudget</code> so scale-down stays safe, and keep a little headroom — scaling takes seconds to minutes, spikes take milliseconds.`,
      ],
      changes: [`~ replicas follow load`, `~ nodes follow Pods`],
      metrics: { replicas: '12 → 5', cpu: '48%', trigger: 'load drops', nodes: '4 → 3' },
      scene: {
        entities: {
          traffic: traffic(`500 req/s`, [{ text: `quiet again`, tone: `green` }]),
          pods: pods(`5 replicas`, [{ text: `CPU 48%`, tone: `green` }]),
          metricsserver: metricsserver([{ text: `48% / 50%`, tone: `gray` }]),
          hpa: hpa([{ text: `12 → 5`, tone: `violet` }]),
          vpa: vpa([{ text: `request 220m`, tone: `green` }]),
          karpenter: karpenter([{ text: `removes idle node 4 → 3`, tone: `gray` }]),
          card: codeCard(`Watch it settle`, [`$ kubectl get hpa web -w`, `NAME  TARGETS   MINPODS  MAXPODS  REPLICAS`, `web   48%/50%   3        20       5`]),
        },
        links: { tp: links.tp(), ms: links.ms(), hp: links.hp, vp: links.vp, kn: links.kn },
        flows: [{ route: ['hp'], kind: 'write', rate: 1 }, { route: ['kn'], kind: 'write', rate: 0.8 }, { route: ['tp'], rate: 1.2, bounce: true }],
      },
    },
  ],
};
