import { STAGE, codeCard, linkOf, stageBlock, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// Seed → result. A client must reach changing Pods; each step adds the piece that solves the
// previous step’s limit, ending with the Gateway API.
//
//   1 client, pods (seed)        2 + service        3 + endpointslice
//   4 + extuser, + node (NodePort)   5 + cloudlb (endpointslice leaves)
//   6 + ingress (node leaves)        7 gateway replaces ingress                result
//
//                 endpointslice / cloudlb        node / ingress / gateway
//   extuser                    service ───────── pods
//   client

const client = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph: `container`, label: [`client Pod`], sub: `10.244.1.5`, tags });
const pods = (tags: Tag[] = []) =>
  stageBlock(STAGE.store, { color: `blue`, glyph: `boxes`, label: [`web Pods`], sub: `app=web :8080`, tags });
const service = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.main, { color: `green`, glyph: `network`, label: [`Service`], sub, tags });
const endpointslice = (tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph: `listChecks`, label: [`Endpoint`, `Slice`], sub: `ready IPs only`, tags });
const cloudlb = (tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph: `network`, label: [`Cloud LB`], sub: `NLB · health checks`, tags });
const extuser = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller2, { color: `blue`, glyph: `user`, label: [`external`, `user`], sub: `203.0.113.7`, tags });
const ingress = (tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `green`, glyph: `route`, label: [`Ingress`, `controller`], sub: `NGINX · L7`, tags });
const gateway = (tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `green`, glyph: `route`, label: [`Gateway`], sub: `listeners · TLS`, tags });

const links = {
  cs: (label?: string) => linkOf(`client`, `service`, label),
  sp: (label?: string) => linkOf(`service`, `pods`, label),
  es: (label?: string) => ({ ...linkOf(`endpointslice`, `service`, label, false), labelAt: 0.6 }),
  xs: (label?: string) => linkOf(`extuser`, `service`, label, false),
  xl: linkOf(`extuser`, `cloudlb`, undefined, false),
  ls: linkOf(`cloudlb`, `service`, undefined, false),
  li: linkOf(`cloudlb`, `ingress`, undefined, false),
  is: linkOf(`ingress`, `service`, undefined, false),
  lg: linkOf(`cloudlb`, `gateway`, undefined, false),
  gs: linkOf(`gateway`, `service`, undefined, false),
};

export const k8sServicesIngressLesson: Lesson = {
  id: 'k8s-services-ingress',
  title: 'Services, Ingress Controllers & Gateway API',
  summary:
    'Start with a client and Pods that keep changing, and add one piece per step: a Service, the endpoint list, NodePort, a cloud load balancer, an Ingress controller and finally the role-based Gateway API.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['layer', 'reach', 'cost', 'owner'],
  legend: [[`req`, `request`], [`res`, `response`], [`fail`, `not ready`]],
  goals: [
    { text: 'Reach Pods through a stable ClusterIP', step: 2 },
    { text: 'See how readiness controls the endpoint list', step: 3 },
    { text: 'Expose a Service with NodePort', step: 4 },
    { text: 'Provision a cloud LoadBalancer Service', step: 5 },
    { text: 'Route by host and path with Ingress', step: 6 },
    { text: 'Split roles with the Gateway API', step: 7 },
  ],
  steps: [
    {
      short: 'Seed',
      chapter: 'problem',
      title: 'Seed: calling Pods by IP does not last',
      body: [
        `A client Pod wants to call the web Pods. It could use a Pod’s IP — but Pods are replaced all the time and every replacement gets a <b>new IP</b>. Hard-coding addresses breaks at the first rolling update.`,
        `What we need is one stable address that always leads to “whichever web Pods exist right now”. Each step below adds the piece that provides it, and then extends it to the outside world.`,
      ],
      metrics: { layer: 'L3', reach: 'by Pod IP', cost: 'free', owner: 'app team' },
      scene: {
        entities: {
          client: client([{ text: `calls 10.244.2.9`, tone: `amber` }]),
          pods: pods([{ text: `IPs change on restart`, tone: `red`, icon: `alert` }]),
          card: codeCard(`A fragile address`, [`$ kubectl get pods -l app=web -o wide`, `web-7d9f-a  10.244.2.9`, `$ kubectl rollout restart deploy/web`, `web-7d9f-b  10.244.3.4     # a different IP`]),
        },
        links: {},
        flows: [],
      },
    },
    {
      short: 'ClusterIP',
      chapter: 'setup',
      title: '+ Service: one stable address',
      body: [
        `A <span class="term">Service</span> gives a group of Pods one stable virtual IP, a <b>ClusterIP</b>, plus a DNS name. Pods are chosen by a <b>label selector</b> (<code>app=web</code>). kube-proxy on every node turns the virtual IP into one of the real Pod IPs.`,
        `Clients now call <code>web:80</code> and never care which Pods exist. ClusterIP is the default and reachable only inside the cluster.`,
      ],
      changes: [`+ Service (ClusterIP)`],
      metrics: { layer: 'L4', reach: 'in-cluster', cost: 'free', owner: 'app team' },
      scene: {
        entities: {
          client: client(),
          pods: pods([{ text: `3 ready`, tone: `green` }]),
          service: service(`ClusterIP 10.96.0.20`, [{ text: `app=web`, tone: `violet` }]),
          card: codeCard(`The Service`, [`apiVersion: v1`, `kind: Service`, `spec: { selector: { app: web }, ports: [{ port: 80, targetPort: 8080 }] }`, `= one name (web), one IP, any number of Pods`]),
        },
        links: { cs: links.cs(`web:80`), sp: links.sp(`picks one`) },
        flows: [{ route: ['cs', 'sp'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'Endpoints',
      chapter: 'technique',
      title: '+ EndpointSlice: only ready Pods get traffic',
      body: [
        `The Service doesn’t hold Pod IPs itself. The control plane keeps an <span class="term">EndpointSlice</span>: the IPs of Pods that match the selector <em>and pass their readiness probe</em>.`,
        `A Pod that is starting, overloaded or failing its probe is removed from the list within seconds and added back when it recovers — rolling updates stay invisible to clients.`,
      ],
      changes: [`+ EndpointSlice`, `~ one Pod not ready`],
      metrics: { layer: 'L4', reach: 'in-cluster', cost: 'free', owner: 'app team' },
      scene: {
        entities: {
          client: client(),
          pods: pods([{ text: `2 ready · 1 failing`, tone: `amber`, icon: `alert` }]),
          service: service(`ClusterIP 10.96.0.20`, [{ text: `2 endpoints`, tone: `green` }]),
          endpointslice: endpointslice([{ text: `.2.9 · .3.4`, tone: `violet` }]),
          card: codeCard(`Who is in the list?`, [`$ kubectl get endpointslices -l kubernetes.io/service-name=web`, `ENDPOINTS: 10.244.2.9, 10.244.3.4`, `! 10.244.1.8 failed readinessProbe → removed`]),
        },
        links: { cs: links.cs(`web:80`), sp: links.sp(`2 of 3`), es: links.es(`updates`) },
        flows: [{ route: ['cs', 'sp'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'NodePort',
      chapter: 'technique',
      title: '+ NodePort: a port on every node',
      body: [
        `To reach the Service from <em>outside</em> the cluster, <b>NodePort</b> opens the same high port (30000–32767) on every node. A request to <code>any-node:31250</code> is forwarded to the Service, then to a Pod, even on another node.`,
        `Simple and cloud-independent, but clients must know node IPs, the port range is odd, and a dead node is a dead address.`,
      ],
      changes: [`+ external user`, `~ Service: NodePort 31250`],
      metrics: { layer: 'L4', reach: 'node IP:port', cost: 'free', owner: 'platform' },
      scene: {
        entities: {
          client: client(),
          pods: pods([{ text: `3 ready`, tone: `green` }]),
          service: service(`NodePort 31250`, [{ text: `every node`, tone: `violet` }]),
          endpointslice: endpointslice(),
          extuser: extuser([{ text: `any-node:31250`, tone: `amber` }]),
          card: codeCard(`Expose it`, [`spec:`, `  type: NodePort`, `  ports: [{ port: 80, nodePort: 31250 }]`, `$ curl http://192.168.1.11:31250/`]),
        },
        links: { cs: links.cs(), sp: links.sp(), es: links.es(), xs: links.xs(`:31250`) },
        flows: [{ route: ['xs', 'sp'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'LoadBalancer',
      chapter: 'solution',
      title: '+ Cloud LB: the provider fronts the nodes',
      body: [
        `Set <code>type: LoadBalancer</code> and the cloud controller asks the provider for a real load balancer (an AWS NLB, a GCP forwarding rule…) with a public IP, health-checking the nodes’ NodePorts.`,
        `One Service, one load balancer: clean for a few Services, but it costs money per balancer and gives only L4 — no host or path routing. Ten APIs would mean ten bills.`,
      ],
      changes: [`+ Cloud LB`, `− EndpointSlice (out of focus)`, `− direct NodePort access`],
      metrics: { layer: 'L4', reach: 'public IP', cost: '~$18 / mo each', owner: 'platform' },
      scene: {
        entities: {
          client: client(),
          pods: pods([{ text: `3 ready`, tone: `green` }]),
          service: service(`LoadBalancer`, [{ text: `34.120.5.9`, tone: `green` }]),
          extuser: extuser(),
          cloudlb: cloudlb([{ text: `provisioned`, tone: `violet` }]),
          card: codeCard(`One line`, [`spec:`, `  type: LoadBalancer`, `$ kubectl get svc web`, `EXTERNAL-IP: 34.120.5.9`]),
        },
        links: { cs: links.cs(), sp: links.sp(), xl: links.xl, ls: links.ls },
        flows: [{ route: ['xl', 'ls', 'sp'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'Ingress',
      chapter: 'solution',
      title: '+ Ingress: one entry point, many Services',
      body: [
        `An <span class="term">Ingress</span> is a set of L7 rules: “<code>api.shop.com</code> → api Service, <code>shop.com/</code> → web Service”. An <b>Ingress controller</b> (NGINX, Traefik, HAProxy) runs as Pods, watches those rules and does the routing.`,
        `Only the controller needs a load balancer, so ten Services share <b>one</b> balancer. It also terminates TLS and can rewrite paths. The balancer now forwards everything to the controller, which decides where it goes.`,
      ],
      changes: [`+ Ingress controller`, `− direct LB → Service hop`],
      metrics: { layer: 'L7', reach: 'host + path', cost: '1 LB', owner: 'platform' },
      scene: {
        entities: {
          client: client(),
          pods: pods([{ text: `/api → api`, tone: `green` }]),
          service: service(`ClusterIP`, [{ text: `web · api`, tone: `violet` }]),
          extuser: extuser(),
          cloudlb: cloudlb([{ text: `one for all`, tone: `gray` }]),
          ingress: ingress([{ text: `TLS ends here`, tone: `violet`, icon: `lock` }]),
          card: codeCard(`Routing rules`, [`kind: Ingress`, `rules:`, `- host: shop.com`, `  http: { paths: [{ path: /api, backend: api }, { path: /, backend: web }] }`]),
        },
        links: { cs: links.cs(), sp: links.sp(), xl: links.xl, li: links.li, is: links.is },
        flows: [{ route: ['xl', 'li', 'is'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'Gateway API',
      chapter: 'recap',
      title: 'Result: Gateway API splits the roles',
      body: [
        `Ingress squeezes everything into one object, and each controller invents its own annotations. The <span class="term">Gateway API</span> splits it by role: infrastructure providers define a <b>GatewayClass</b>, cluster operators create a <b>Gateway</b> (listeners, TLS), and app teams attach an <b>HTTPRoute</b> in their own namespace.`,
        `It is more expressive (header matching, weighted traffic split, retries), portable across implementations, and safer for multi-team clusters. The finished path: user → cloud LB → Gateway → Service → Pods.`,
      ],
      changes: [`+ Gateway (replaces Ingress)`, `+ HTTPRoute (app team)`],
      metrics: { layer: 'L4–L7', reach: 'host + path + header', cost: '1 LB', owner: 'split by role' },
      scene: {
        entities: {
          client: client(),
          pods: pods([{ text: `90% v1 · 10% v2`, tone: `green` }]),
          service: service(`ClusterIP`, [{ text: `api-v1 · api-v2`, tone: `violet` }]),
          extuser: extuser(),
          cloudlb: cloudlb([{ text: `GatewayClass: provider`, tone: `gray` }]),
          gateway: gateway([{ text: `cluster operator`, tone: `violet` }]),
          card: codeCard(`An app team's route`, [`kind: HTTPRoute`, `parentRefs: [{ name: shop-gateway }]`, `rules: [{ matches: [{ path: { value: /api } }],`, `  backendRefs: [{ name: api-v1, weight: 90 }, { name: api-v2, weight: 10 }] }]`]),
        },
        links: { cs: links.cs(), sp: links.sp(`weighted`), xl: links.xl, lg: links.lg, gs: links.gs },
        flows: [{ route: ['xl', 'lg', 'gs'], rate: 1.4, bounce: true }],
      },
    },
  ],
};
