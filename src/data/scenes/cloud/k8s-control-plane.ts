import { makeBlock, makeDb, makeDevice, makeLink, makePanel, cardAt, type Tag, type SceneOpts } from '@/lib/simulator/scene-builders';

// One fixed stage for the whole lesson: kube-apiserver is the hub, and every other
// component only ever talks to it (hub-and-spoke). Steps add one actor at a time.
//
//   kubectl ─┐                 ┌─ etcd
//            └── kube-apiserver ┤
//   controller-manager ─┘      └─ scheduler
//                 node-1 ─┘ └─ node-2

const dev = (o: SceneOpts = {}) => makeDevice(-15.5, 3, { label: `kubectl`, ...o });
const api = (o: SceneOpts = {}) =>
  makeBlock(-1.5, 1.5, { s: 5.2, h: 56, color: `blue`, glyph: `network`, label: [`API server`], sub: `kube-apiserver`, ...o });
const etcd = (o: SceneOpts = {}) => makeDb(-5, 18, { r: 2.2, h: 46, glyph: `database`, label: `etcd`, ...o });
const ctrl = (o: SceneOpts = {}) =>
  makeBlock(-4.5, -13, { s: 4.4, h: 52, color: `orange`, glyph: `refresh`, label: [`Controller`, `manager`], ...o });
const sched = (o: SceneOpts = {}) =>
  makeBlock(10, 10, { s: 4.4, h: 52, color: `orange`, glyph: `target`, label: [`Scheduler`], sub: `filter · score`, ...o });
const node = (x: number, y: number, name: string, tags: Tag[] = []) =>
  makeBlock(x, y, { s: 4.4, h: 50, color: `green`, glyph: `container`, label: [name], sub: `kubelet`, tags });
const node1 = (tags: Tag[] = []) => node(9, -17, `node-1`, tags);
const node2 = (tags: Tag[] = []) => node(15.5, -7.5, `node-2`, tags);

const links = {
  apply: makeLink(`dev`, `api`, [`dev`, `api`], { heads: `both`, label: `apply` }),
  // after the request is in, the kubectl link stays as a quiet anchor
  applyBusy: makeLink(`dev`, `api`, [`dev`, `api`], { heads: `both` }),
  applyIdle: makeLink(`dev`, `api`, [`dev`, `api`], { heads: `both`, style: `off` }),
  persist: makeLink(`api`, `etcd`, [`api`, `etcd`], { heads: `both`, label: `persist` }),
  ctrlWatch: makeLink(`ctrl`, `api`, [`ctrl`, `api`], { heads: `both`, label: `watch` }),
  schedWatch: makeLink(`sched`, `api`, [`sched`, `api`], { heads: `both`, label: `bind` }),
  kubelet1: makeLink(`node1`, `api`, [`node1`, `api`], { heads: `both` }),
  kubelet2: makeLink(`node2`, `api`, [`node2`, `api`], { heads: `both` }),
};

/** Code / output card, parked in the empty band above the hub. */
const card = cardAt({ x: -1.5, y: 1.5, dx: -120, dy: -262 });

export const k8sControlPlaneLesson = {
  id: `k8s-control-plane`,
  title: `Kubernetes Control Plane: API Server, etcd & Controllers`,
  trackId: `k8s`,
  summary: `Follow one Deployment from kubectl apply to running Pods: the API server, etcd, controllers, scheduler and kubelets.`,
  minutes: 14,
  level: `advanced`,
  metrics: [`desired`, `pending`, `running`, `revision`],
  legend: [`req`, `res`, [`write`, `etcd write`], [`msg`, `watch event`]],
  goals: [
    { text: `Declarative state via kubectl`, step: 1 },
    { text: `The API server request pipeline`, step: 2 },
    { text: `etcd as the single source of truth`, step: 3 },
    { text: `Controllers reconcile desired vs actual`, step: 4 },
    { text: `The scheduler filters and scores nodes`, step: 6 },
  ],
  steps: [
    {
      short: `Apply`,
      chapter: `setup`,
      title: `You declare what you want`,
      body: [
        `You never tell Kubernetes <em>how</em> to start containers. You send a manifest that describes the end state — “3 replicas of web:1.4” — and the cluster works out the rest.`,
        `<code>kubectl apply</code> turns the YAML into an HTTPS request to the one component everything goes through: the <span class="term">API server</span>.`,
      ],
      metrics: { desired: 3, pending: 0, running: 0, revision: 1041 },
      scene: {
        entities: {
          dev: dev(),
          api: api(),
          card: card(
            `deployment.yaml`,
            [`kind: Deployment`, `metadata: { name: web }`, `spec:`, `  replicas: 3`, `  image: web:1.4`],
            `file`,
          ),
        },
        links: { apply: links.apply },
        flows: [{ route: [`apply`], rate: 1.2, bounce: true }],
      },
    },
    {
      short: `Admit`,
      chapter: `technique`,
      title: `Every request runs the same gauntlet`,
      body: [
        `Before anything is stored, the API server checks <b>who</b> you are (authentication), <b>whether</b> you may do this (RBAC), lets <span class="term">admission webhooks</span> rewrite or reject the object, and validates it against the schema.`,
        `Only then is it written to <span class="term">etcd</span>. The API server is the <em>only</em> component allowed to talk to etcd.`,
      ],
      changes: [`+ etcd`, `~ Deployment stored · revision 1042`],
      metrics: { desired: 3, pending: 0, running: 0, revision: 1042 },
      scene: {
        entities: {
          dev: dev(),
          api: api({
            tags: [
              { text: `authn ✓  rbac ✓`, tone: `green` },
              { text: `admission ✓`, tone: `green` },
            ],
          }),
          etcd: etcd(),
          card: card(
            `API server log`,
            [
              `POST /apis/apps/v1/namespaces/default/deployments`,
              `authn   user=dev  (x509)`,
              `authz   rbac: allowed  verb=create`,
              `mutate  + default resources`,
              `= 201 Created   resourceVersion=1042`,
            ],
            `scroll`,
          ),
        },
        links: { apply: links.applyBusy, persist: links.persist },
        flows: [
          { route: [`apply`], rate: 1.2, bounce: true },
          { route: [`persist`], kind: `write`, rate: 1 },
        ],
      },
    },
    {
      short: `etcd`,
      chapter: `insight`,
      title: `etcd is the cluster’s memory`,
      body: [
        `etcd is a small, strongly consistent key-value store. In production it runs as 3 or 5 members that agree on every write with <span class="term">Raft</span>, so losing one machine loses nothing.`,
        `Every change bumps a global <span class="term">revision</span>. Components never poll: they open a <b>watch</b> through the API server and get pushed each change after the revision they last saw.`,
      ],
      changes: [`~ etcd: 3 members, leader etcd-0`],
      metrics: { desired: 3, pending: 0, running: 0, revision: 1042 },
      scene: {
        entities: {
          dev: dev(),
          api: api(),
          etcd: etcd({
            tags: [
              { text: `3 members · Raft`, icon: `layers` },
              { text: `quorum 2 of 3`, tone: `green` },
            ],
          }),
          card: card(
            `etcdctl`,
            [
              `$ etcdctl get /registry/deployments/default/web \\`,
              `    --write-out=fields | grep Revision`,
              `"ModRevision" : 1042`,
              `# watchers resume from the revision they last saw`,
            ],
            `database`,
          ),
        },
        links: { apply: links.applyIdle, persist: links.persist },
        flows: [{ route: [`persist`], kind: `write`, rate: 0.8, bounce: true }],
      },
    },
    {
      short: `Reconcile`,
      chapter: `solution`,
      title: `Controllers close the gap`,
      body: [
        `The <span class="term">controller manager</span> runs dozens of control loops. The Deployment controller is watching Deployments: it sees “want 3, have 0” and creates a ReplicaSet, whose controller creates 3 Pod objects.`,
        `Those Pods exist only as records in etcd. Their <code>nodeName</code> is empty — nobody has decided where they run yet.`,
      ],
      changes: [`+ Controller manager`, `+ ReplicaSet + 3 Pods (Pending)`],
      metrics: { desired: 3, pending: 3, running: 0, revision: 1046 },
      scene: {
        entities: {
          dev: dev(),
          api: api(),
          etcd: etcd({ tags: [{ text: `3 Pods · Pending`, tone: `amber`, icon: `hourglass` }] }),
          ctrl: ctrl(),
          card: card(
            `reconcile loop`,
            [
              `for event := range watch("deployments") {`,
              `  have := countPods(event.selector)`,
              `  if have < event.replicas { createPods(want - have) }`,
              `  if have > event.replicas { deletePods(have - want) }`,
              `}`,
            ],
            `refresh`,
          ),
        },
        links: { apply: links.applyIdle, persist: links.persist, ctrlWatch: links.ctrlWatch },
        flows: [
          { route: [`ctrlWatch`], kind: `msg`, rate: 1.4, bounce: true },
          { route: [`persist`], kind: `write`, rate: 1 },
        ],
      },
    },
    {
      short: `Nodes`,
      chapter: `problem`,
      title: `Machines report in — but Pods still wait`,
      body: [
        `Each worker machine runs a <span class="term">kubelet</span>. It registers its node, reports free CPU and memory, and watches for Pods assigned to it.`,
        `Our 3 Pods are still <b>Pending</b>: no kubelet will start a Pod until something writes its node name. That decision belongs to one component.`,
      ],
      changes: [`+ node-1, node-2 (kubelets)`, `− Pods still unassigned`],
      metrics: { desired: 3, pending: 3, running: 0, revision: 1046 },
      scene: {
        entities: {
          dev: dev(),
          api: api(),
          etcd: etcd({ tags: [{ text: `3 Pods · Pending`, tone: `amber`, icon: `hourglass` }] }),
          ctrl: ctrl(),
          node1: node1([{ text: `cpu 70% used`, tone: `amber` }]),
          node2: node2([{ text: `cpu 20% used`, tone: `green` }]),
        },
        links: {
          apply: links.applyIdle,
          persist: links.persist,
          ctrlWatch: links.ctrlWatch,
          kubelet1: links.kubelet1,
          kubelet2: links.kubelet2,
        },
        flows: [
          { route: [`kubelet1`], kind: `msg`, rate: 0.8, bounce: true },
          { route: [`kubelet2`], kind: `msg`, rate: 0.8, bounce: true },
        ],
      },
    },
    {
      short: `Schedule`,
      chapter: `solution`,
      title: `The scheduler picks a node for each Pod`,
      body: [
        `The <span class="term">scheduler</span> watches for Pods with no node. For each one it <b>filters</b> out nodes that can’t fit it (not enough CPU, wrong zone, taints), then <b>scores</b> the rest and writes a binding for the winner.`,
        `It never contacts the node. It only updates the Pod through the API server — the kubelet on that node sees the change through its own watch.`,
      ],
      changes: [`+ Scheduler`, `~ 3 Pods bound: node-2 ×2, node-1 ×1`],
      metrics: { desired: 3, pending: 0, running: 0, revision: 1049 },
      scene: {
        entities: {
          dev: dev(),
          api: api(),
          etcd: etcd(),
          ctrl: ctrl(),
          sched: sched({ tags: [{ text: `3 bindings`, tone: `green`, icon: `check` }] }),
          node1: node1([{ text: `score 62`, tone: `gray` }]),
          node2: node2([{ text: `score 89 ✓`, tone: `green` }]),
          card: card(
            `scheduling web-7d9f-x2k`,
            [
              `filter  node-1  cpu 1.2/4 free   ok`,
              `filter  node-2  cpu 3.2/4 free   ok`,
              `score   node-1  62   (busy, image cached)`,
              `= score   node-2  89   → bind`,
            ],
            `target`,
          ),
        },
        links: {
          apply: links.applyIdle,
          persist: links.persist,
          ctrlWatch: links.ctrlWatch,
          schedWatch: links.schedWatch,
          kubelet1: links.kubelet1,
          kubelet2: links.kubelet2,
        },
        flows: [
          { route: [`schedWatch`], kind: `msg`, rate: 1.4, bounce: true },
          { route: [`persist`], kind: `write`, rate: 1 },
        ],
      },
    },
    {
      short: `Recap`,
      chapter: `recap`,
      title: `Nobody gives orders — everyone watches`,
      body: [
        `Each kubelet sees Pods bound to its node, pulls the image and starts the containers, then reports status back. Desired 3, running 3.`,
        `No component calls another directly. They all watch the API server and push the world one step closer to what is stored in etcd. That is why a crashed controller or a lost node heals itself: the loop just runs again.`,
      ],
      changes: [`~ 3 Pods Running`],
      metrics: { desired: 3, pending: 0, running: 3, revision: 1055 },
      scene: {
        entities: {
          dev: dev(),
          api: api(),
          etcd: etcd(),
          ctrl: ctrl(),
          sched: sched(),
          node1: node1([{ text: `1 Pod running`, tone: `green` }]),
          node2: node2([{ text: `2 Pods running`, tone: `green` }]),
          card: card(
            `pods`,
            [
              `$ kubectl get pods -o wide`,
              `NAME          STATUS    NODE`,
              `web-7d9f-x2k  Running   node-2`,
              `web-7d9f-m8q  Running   node-2`,
              `web-7d9f-p4t  Running   node-1`,
            ],
            `listChecks`,
          ),
        },
        links: {
          apply: links.applyIdle,
          persist: links.persist,
          ctrlWatch: links.ctrlWatch,
          schedWatch: links.schedWatch,
          kubelet1: links.kubelet1,
          kubelet2: links.kubelet2,
        },
        flows: [
          { route: [`ctrlWatch`], kind: `msg`, rate: 0.7, bounce: true },
          { route: [`schedWatch`], kind: `msg`, rate: 0.7, bounce: true },
          { route: [`kubelet1`], kind: `msg`, rate: 0.9, bounce: true },
          { route: [`kubelet2`], kind: `msg`, rate: 0.9, bounce: true },
          { route: [`persist`], kind: `write`, rate: 0.8 },
        ],
      },
    },
  ],
};
