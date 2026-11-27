import { makeBlock, makeLink, makePanel, makeZone } from '@/lib/simulator/scene-builders';

// One worker node, one Pod, start to finish. The kubelet is the hub: it watches the API
// server, drives containerd over CRI, and probes the app itself. The Pod is a box holding
// the pause (sandbox) container and the app container that joins its network namespace.
//
//   API server ─ kubelet ──────────── app ┐
//                  │                      │ POD
//              containerd ── pause ───────┘

type Tag = { text: string; tone?: string; icon?: string };
type Opts = Record<string, unknown>;

const api = () =>
  makeBlock(-15.5, 3, { s: 4.4, h: 52, color: `blue`, glyph: `network`, label: [`API server`], sub: `kube-apiserver` });
const kubelet = (tags: Tag[] = []) =>
  makeBlock(-1.5, 1.5, { s: 5, h: 56, color: `green`, glyph: `container`, label: [`kubelet`], sub: `node-1`, tags });
const containerd = (tags: Tag[] = []) =>
  makeBlock(1.5, -15.5, { s: 4.4, h: 52, color: `orange`, glyph: `boxes`, label: [`containerd`], sub: `CRI runtime`, tags });
const pause = (tags: Tag[] = []) =>
  makeBlock(13, -10, { s: 4.2, h: 48, color: `slab`, glyph: `pause`, label: [`pause`], sub: `sandbox`, tags });
const app = (tags: Tag[] = [], o: Opts = {}) =>
  makeBlock(12, 5, { s: 4.4, h: 52, color: `green`, glyph: `cpu`, label: [`web`], sub: `app container`, tags, ...o });
const pod = () => makeZone({ x0: 9.5, x1: 15.5, y0: -15.5, y1: 8.5 }, `POD web`);

const L = {
  watch: makeLink(`api`, `kubelet`, [`api`, `kubelet`], { heads: `both`, label: `watch` }),
  watchQuiet: makeLink(`api`, `kubelet`, [`api`, `kubelet`], { heads: `both` }),
  cri: makeLink(`kubelet`, `containerd`, [`kubelet`, `containerd`], { heads: `both`, label: `gRPC` }),
  criQuiet: makeLink(`kubelet`, `containerd`, [`kubelet`, `containerd`], { heads: `both` }),
  sandbox: makeLink(`containerd`, `pause`, [`containerd`, `pause`], { label: `sandbox` }),
  sandboxQuiet: makeLink(`containerd`, `pause`, [`containerd`, `pause`]),
  netns: makeLink(`pause`, `app`, [`pause`, `app`], { heads: `both`, label: `netns`, style: `off` }),
  probe: makeLink(`kubelet`, `app`, [`kubelet`, `app`], { heads: `both`, label: `GET /healthz` }),
};

/** Cards park in the open floor at the top right. */
const card = (title: string, lines: string[], icon: string) =>
  makePanel({ x: -1.5, y: 1.5, z: 0, dx: 60, dy: -250 }, title, lines, { icon });

const running = (appTags: Tag[] = [], appOpts: Opts = {}) => ({
  api: api(),
  kubelet: kubelet(),
  containerd: containerd(),
  pause: pause([{ text: `10.244.1.7`, tone: `violet` }]),
  app: app(appTags, appOpts),
  pod: pod(),
});
const runningLinks = {
  watch: L.watchQuiet,
  cri: L.criQuiet,
  sandbox: L.sandboxQuiet,
  netns: L.netns,
  probe: L.probe,
};

export const k8sWorkerNodeLesson = {
  id: `k8s-worker-node`,
  title: `Worker Nodes: Kubelet, CRI, Pod Lifecycle & Health Probes`,
  trackId: `k8s`,
  summary: `Follow one Pod on one node: the kubelet notices it, asks containerd to build it over CRI, probes it, restarts it and finally shuts it down gracefully.`,
  minutes: 13,
  level: `intermediate`,
  metrics: [`phase`, `ready`, `restarts`, `podIP`],
  legend: [`req`, `res`, [`msg`, `watch / CRI call`], [`fail`, `failed probe`]],
  goals: [
    { text: `The kubelet watches for its Pods`, step: 1 },
    { text: `CRI: kubelet → containerd over gRPC`, step: 2 },
    { text: `The pause container holds the network`, step: 3 },
    { text: `How a Pod starts`, step: 4 },
    { text: `Startup, liveness and readiness probes`, step: 5 },
    { text: `Graceful shutdown with SIGTERM`, step: 7 },
  ],
  steps: [
    {
      short: `Assigned`,
      chapter: `setup`,
      title: `A Pod lands on this node`,
      body: [
        `The scheduler wrote <code>nodeName: node-1</code> on a new Pod. The <span class="term">kubelet</span> on node-1 has a watch open on the API server filtered to its own node, so it hears about it within milliseconds.`,
        `From here on, making that Pod real is this kubelet’s job — and only this kubelet’s.`,
      ],
      metrics: { phase: `Pending`, ready: `0/1`, restarts: 0, podIP: `—` },
      scene: {
        entities: {
          api: api(),
          kubelet: kubelet([{ text: `new Pod: web-7d9f`, tone: `amber`, icon: `bell` }]),
          card: card(`kubectl get pod -o wide`, [`$ kubectl get pod web-7d9f -o wide`, `NAME      STATUS   NODE`, `= web-7d9f  Pending  node-1`], `scan`),
        },
        links: { watch: L.watch },
        flows: [{ route: [`watch`], kind: `msg`, rate: 1.2, bounce: true }],
      },
    },
    {
      short: `CRI`,
      chapter: `technique`,
      title: `The kubelet talks to the runtime over CRI`,
      body: [
        `The kubelet doesn’t start containers itself. It calls the <span class="term">Container Runtime Interface</span> — a gRPC API on a local socket — and any runtime that implements it (containerd, CRI-O) does the work.`,
        `That is how Kubernetes dropped Docker without changing the kubelet.`,
      ],
      changes: [`+ containerd (CRI runtime)`],
      metrics: { phase: `Pending`, ready: `0/1`, restarts: 0, podIP: `—` },
      scene: {
        entities: {
          api: api(),
          kubelet: kubelet(),
          containerd: containerd([{ text: `/run/containerd.sock`, tone: `gray` }]),
          card: card(`api.proto (CRI)`, [`service RuntimeService {`, `  rpc RunPodSandbox(...)`, `  rpc CreateContainer(...)`, `  rpc StartContainer(...)`, `}`], `braces`),
        },
        links: { watch: L.watchQuiet, cri: L.cri },
        flows: [{ route: [`cri`], kind: `msg`, rate: 1.4, bounce: true }],
      },
    },
    {
      short: `Sandbox`,
      chapter: `technique`,
      title: `First comes the pause container`,
      body: [
        `<code>RunPodSandbox</code> starts a tiny <span class="term">pause</span> container. It does nothing but sleep — and own the Pod’s network namespace. The CNI plugin gives that namespace the Pod’s IP.`,
        `Because the sandbox holds the network, app containers can crash and restart without the Pod losing its IP.`,
      ],
      changes: [`+ pause container`, `~ Pod IP 10.244.1.7`],
      metrics: { phase: `Pending`, ready: `0/1`, restarts: 0, podIP: `10.244.1.7` },
      scene: {
        entities: {
          api: api(),
          kubelet: kubelet(),
          containerd: containerd(),
          pause: pause([{ text: `10.244.1.7`, tone: `violet` }]),
          pod: pod(),
          card: card(`crictl pods`, [`$ crictl pods`, `POD ID   STATE  NAME`, `= 8c1f…   Ready  web-7d9f`], `scan`),
        },
        links: { watch: L.watchQuiet, cri: L.criQuiet, sandbox: L.sandbox },
        flows: [{ route: [`cri`, `sandbox`], kind: `msg`, rate: 1 }],
      },
    },
    {
      short: `Start`,
      chapter: `solution`,
      title: `The app joins the sandbox`,
      body: [
        `<code>CreateContainer</code> + <code>StartContainer</code> pull the image if needed and start the app inside the sandbox’s namespaces. It shares the pause container’s IP and <code>localhost</code>.`,
        `The Pod is now <b>Running</b> — but not yet <b>Ready</b>. Nothing has proven the app can serve.`,
      ],
      changes: [`+ app container`, `~ phase Running, ready 0/1`],
      metrics: { phase: `Running`, ready: `0/1`, restarts: 0, podIP: `10.244.1.7` },
      scene: {
        entities: {
          api: api(),
          kubelet: kubelet(),
          containerd: containerd(),
          pause: pause([{ text: `10.244.1.7`, tone: `violet` }]),
          app: app([{ text: `not ready`, tone: `amber`, icon: `hourglass` }]),
          pod: pod(),
          card: card(`crictl ps`, [`$ crictl ps`, `IMAGE    STATE    NAME`, `= web:1.4  Running  web`, `# pause is hidden — it is the sandbox`], `scan`),
        },
        links: { watch: L.watchQuiet, cri: L.criQuiet, sandbox: L.sandboxQuiet, netns: L.netns },
        flows: [{ route: [`cri`, `sandbox`, `netns`], kind: `msg`, rate: 1 }],
      },
    },
    {
      short: `Probes`,
      chapter: `technique`,
      title: `The kubelet keeps asking: are you OK?`,
      body: [
        `The kubelet itself runs the <span class="term">probes</span>. <b>startup</b> gives slow apps time to boot; then <b>readiness</b> decides if the Pod gets traffic and <b>liveness</b> decides if it should be restarted.`,
        `Readiness passes → the Pod is added to its Service endpoints. Ready 1/1.`,
      ],
      changes: [`+ probes`, `~ ready 0/1 → 1/1`],
      metrics: { phase: `Running`, ready: `1/1`, restarts: 0, podIP: `10.244.1.7` },
      scene: {
        entities: {
          ...running([
            { text: `readiness ✓`, tone: `green` },
            { text: `liveness ✓`, tone: `green` },
          ]),
          card: card(
            `pod spec`,
            [`startupProbe:   httpGet /healthz  failureThreshold: 30`, `readinessProbe: httpGet /ready    periodSeconds: 5`, `livenessProbe:  httpGet /healthz  periodSeconds: 10`],
            `heartPulse`,
          ),
        },
        links: runningLinks,
        flows: [{ route: [`probe`], rate: 1.2, bounce: true }],
      },
    },
    {
      short: `Restart`,
      chapter: `problem`,
      title: `Liveness fails, the container restarts`,
      body: [
        `The app deadlocks: the process is alive but <code>/healthz</code> times out. After 3 failed liveness checks the kubelet kills the container and starts a new one — same Pod, same IP, <code>restarts: 1</code>.`,
        `Readiness fails first, so the Pod stops getting traffic before it is restarted.`,
      ],
      changes: [`− liveness ✗ 3/3`, `~ container restarted`],
      metrics: { phase: `Running`, ready: `0/1`, restarts: 1, podIP: `10.244.1.7` },
      scene: {
        entities: {
          ...running([{ text: `liveness ✗ 3/3`, tone: `red`, icon: `alert` }], { heat: 1 }),
          card: card(
            `kubectl describe pod`,
            [`! Warning  Unhealthy  Liveness probe failed: timeout`, `  Normal   Killing    Container web failed liveness`, `= Normal   Started    Started container web`],
            `alertTriangle`,
          ),
        },
        links: runningLinks,
        flows: [
          { route: [`probe`], kind: `fail`, rate: 1.2 },
          { route: [`cri`], kind: `msg`, rate: 0.8, bounce: true },
        ],
      },
    },
    {
      short: `Shutdown`,
      chapter: `technique`,
      title: `Leaving gracefully`,
      body: [
        `A rollout deletes the Pod. The kubelet marks it not ready (endpoints drop it), runs the <code>preStop</code> hook, then sends <b>SIGTERM</b> and waits up to <code>terminationGracePeriodSeconds</code>.`,
        `The app finishes in-flight requests and exits. Only if it is still running after 30 s does it get SIGKILL.`,
      ],
      changes: [`~ preStop → SIGTERM`, `~ 30 s grace period`],
      metrics: { phase: `Terminating`, ready: `0/1`, restarts: 1, podIP: `10.244.1.7` },
      scene: {
        entities: {
          ...running([{ text: `SIGTERM · 30 s grace`, tone: `amber`, icon: `clock` }]),
          card: card(`pod spec`, [`terminationGracePeriodSeconds: 30`, `lifecycle:`, `  preStop:`, `    exec: { command: ["sleep", "5"] }`], `power`),
        },
        links: { ...runningLinks, watch: L.watch },
        flows: [
          { route: [`watch`], kind: `msg`, rate: 1, bounce: true },
          { route: [`cri`], kind: `msg`, rate: 0.8 },
        ],
      },
    },
    {
      short: `Recap`,
      chapter: `recap`,
      title: `Watch, build, probe, stop`,
      body: [
        `The kubelet watches the API server for its Pods, asks the runtime over CRI to build a sandbox and start containers, and keeps probing them.`,
        `Liveness restarts a stuck container; readiness controls traffic; SIGTERM plus a grace period lets it leave without dropping requests.`,
      ],
      changes: [`= kubelet: watch · CRI · probes`],
      metrics: { phase: `Running`, ready: `1/1`, restarts: 1, podIP: `10.244.1.7` },
      scene: {
        entities: running([
          { text: `ready 1/1`, tone: `green` },
          { text: `restarts 1`, tone: `gray` },
        ]),
        links: runningLinks,
        flows: [
          { route: [`watch`], kind: `msg`, rate: 0.6, bounce: true },
          { route: [`probe`], rate: 1, bounce: true },
          { route: [`cri`], kind: `msg`, rate: 0.5, bounce: true },
        ],
      },
    },
  ],
};
