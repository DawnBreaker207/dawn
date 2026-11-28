import { STAGE, codeCard, linkOf, stageBlock, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// Seed → result. Two Pods that must talk; every step adds the piece that makes the next hop work.
//
//   step 1  podA ─────────────── podB                                  seed: flat network
//   step 2  + bridge (CNI wires the Pod into the node)
//   step 3  + vxlan  (crossing nodes)
//   step 4  + coredns (names → ClusterIP)
//   step 5  + kubeproxy (ClusterIP → Pod IP, iptables)
//   step 6  cilium replaces kubeproxy (eBPF)                           result
//
//                 coredns (top)          vxlan (top-right)
//   kubeproxy                  bridge ──────────── podB
//   podA

const podA = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph: `container`, label: [`pod A`], sub: `10.244.1.5`, tags });
const podB = (tags: Tag[] = []) =>
  stageBlock(STAGE.store, { color: `blue`, glyph: `container`, label: [`pod B`], sub: `10.244.2.9`, tags });
const bridge = (tags: Tag[] = []) =>
  stageBlock(STAGE.main, { color: `green`, glyph: `layers`, label: [`cni0`], sub: `bridge · node-1`, tags });
const vxlan = (tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `green`, glyph: `route`, label: [`VXLAN`], sub: `UDP 8472`, tags });
const coredns = (tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph: `search`, label: [`CoreDNS`], sub: `kube-dns`, tags });
const kubeproxy = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller2, { color: `orange`, glyph: `filter`, label: [`kube-proxy`], sub: `iptables NAT`, tags });
const cilium = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller2, { color: `green`, glyph: `cpu`, label: [`Cilium`], sub: `eBPF maps`, tags });

const links = {
  flat: (label?: string) => linkOf(`podA`, `podB`, label),
  aBr: (label?: string) => linkOf(`podA`, `bridge`, label),
  brB: linkOf(`bridge`, `podB`, undefined, false),
  brVx: linkOf(`bridge`, `vxlan`, undefined, false),
  vxB: linkOf(`vxlan`, `podB`, undefined, false),
  dns: (label?: string) => linkOf(`podA`, `coredns`, label),
  kp: linkOf(`podA`, `kubeproxy`, undefined, false),
  kpBr: linkOf(`kubeproxy`, `bridge`, undefined, false),
  ci: linkOf(`podA`, `cilium`, undefined, false),
  ciBr: linkOf(`cilium`, `bridge`, undefined, false),
};

export const k8sNetworkingCniLesson: Lesson = {
  id: 'k8s-networking-cni',
  title: 'Kubernetes Networking: Flat Pod Network, CNI & Kube-Proxy',
  summary:
    'Start with two Pods that must talk and add what makes it work, one piece per step: CNI and veth pairs, VXLAN across nodes, CoreDNS, kube-proxy’s iptables rules, and finally eBPF.',
  minutes: 14,
  level: 'advanced',
  metrics: ['layer', 'path', 'overhead', 'scale'],
  legend: [[`req`, `packet`], [`write`, `rule / tunnel`], [`msg`, `DNS`]],
  goals: [
    { text: 'State the flat Pod network rules', step: 1 },
    { text: 'See how CNI plugs a Pod in with a veth pair', step: 2 },
    { text: 'Trace a cross-node packet through VXLAN', step: 3 },
    { text: 'Resolve a Service name with CoreDNS', step: 4 },
    { text: 'Follow kube-proxy’s iptables DNAT', step: 5 },
    { text: 'Compare the eBPF data plane with iptables', step: 6 },
  ],
  steps: [
    {
      short: 'Flat network',
      chapter: 'setup',
      title: 'Seed: two Pods, one flat network',
      body: [
        `Kubernetes asks the network for three promises: every Pod has its <b>own IP</b>, Pods talk to each other <b>without NAT</b> (the address a Pod sees is the real sender), and node agents can reach every Pod on their node.`,
        `It does not say how. Pod A on one node and Pod B on another must simply reach each other by IP. Each following step adds the piece that makes that true.`,
      ],
      metrics: { layer: 'L3', path: 'direct', overhead: 'none', scale: 'n/a' },
      scene: {
        entities: {
          podA: podA([{ text: `node-1 · src 10.244.1.5`, tone: `gray` }]),
          podB: podB([{ text: `node-2 · sees 10.244.1.5, no NAT`, tone: `green` }]),
          card: codeCard(`Each Pod has its own IP`, [`$ kubectl get pods -o wide`, `NAME   IP           NODE`, `web-a  10.244.1.5   node-1`, `web-b  10.244.2.9   node-2`]),
        },
        links: {},
        flows: [],
      },
    },
    {
      short: 'CNI · veth',
      chapter: 'technique',
      title: '+ cni0: CNI wires each Pod into its node',
      body: [
        `When the kubelet creates a Pod sandbox it calls the <span class="term">CNI plugin</span>. The plugin creates a <b>veth pair</b> — a virtual cable. One end becomes <code>eth0</code> inside the Pod’s network namespace, the other plugs into the <b>bridge</b> <code>cni0</code> on the node.`,
        `It then assigns an IP from the node’s Pod range and installs routes. The same wiring runs on every node.`,
      ],
      changes: [`+ cni0 bridge`, `+ veth pair`],
      metrics: { layer: 'L2', path: 'node-local', overhead: '~0.05 ms', scale: 'per node' },
      scene: {
        entities: {
          podA: podA([{ text: `eth0 ↔ veth1a`, tone: `violet` }]),
          podB: podB([{ text: `node-2`, tone: `gray` }]),
          bridge: bridge([{ text: `10.244.1.1`, tone: `green` }]),
          card: codeCard(`What the CNI plugin built`, [`$ ip link show type veth`, `7: veth1a2b@if6  master cni0`, `$ bridge link`, `= eth0 in the Pod ⇄ veth on the node, plugged into cni0`]),
        },
        links: { aBr: links.aBr(`eth0`), brB: links.brB },
        flows: [{ route: ['aBr'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'VXLAN',
      chapter: 'technique',
      title: '+ VXLAN: crossing nodes in a tunnel',
      body: [
        `Pod B lives on another node, and the physical network knows nothing about Pod IPs. An <span class="term">overlay</span> such as VXLAN wraps the Pod’s packet inside a UDP packet addressed node-to-node (port 8472), then unwraps it on arrival.`,
        `Cost: ~50 bytes of header per packet and a little CPU. The alternative is <span class="term">BGP routing</span> (Calico): the node advertises its Pod range so the fabric routes Pod IPs directly — no tunnel.`,
      ],
      changes: [`+ VXLAN tunnel`, `~ route via tunnel`],
      metrics: { layer: 'L3 overlay', path: 'tunnel', overhead: '+50 B', scale: 'any size' },
      scene: {
        entities: {
          podA: podA(),
          podB: podB([{ text: `node-2`, tone: `gray` }]),
          bridge: bridge(),
          vxlan: vxlan([{ text: `outer: node IPs`, tone: `violet` }]),
          card: codeCard(`Where the packet goes`, [`$ ip route | grep 10.244.2`, `10.244.2.0/24 via 10.244.2.0 dev flannel.1 onlink`, `= inner: pod A → pod B   outer: node-1 → node-2 (UDP 8472)`]),
        },
        links: { aBr: links.aBr(`to .2.9`), brVx: links.brVx, vxB: links.vxB },
        flows: [{ route: ['aBr'], rate: 1.2, bounce: true }, { route: ['brVx', 'vxB'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'CoreDNS',
      chapter: 'technique',
      title: '+ CoreDNS: names resolve to a Service IP',
      body: [
        `Applications use names, not IPs. Each Pod’s <code>/etc/resolv.conf</code> points at <span class="term">CoreDNS</span> (usually <code>10.96.0.10</code>). The name <code>orders.shop.svc.cluster.local</code> resolves to the Service’s virtual <b>ClusterIP</b>, not to a Pod.`,
        `Pods come and go, so their IPs change; the ClusterIP stays. The next step shows how traffic to that virtual IP finds a real Pod.`,
      ],
      changes: [`+ CoreDNS`, `~ pod B now “orders” Pods`],
      metrics: { layer: 'L7 DNS', path: 'UDP 53', overhead: '~1 ms', scale: 'cached' },
      scene: {
        entities: {
          podA: podA([{ text: `looks up orders`, tone: `amber` }]),
          podB: podB([{ text: `behind orders`, tone: `gray` }]),
          bridge: bridge(),
          vxlan: vxlan(),
          coredns: coredns([{ text: `A → 10.96.0.20`, tone: `violet` }]),
          card: codeCard(`Name → ClusterIP`, [`$ kubectl exec web-a -- nslookup orders`, `Server:   10.96.0.10`, `Name:     orders.shop.svc.cluster.local`, `Address:  10.96.0.20`]),
        },
        links: { aBr: links.aBr(), brVx: links.brVx, vxB: links.vxB, dns: links.dns(`A record`) },
        flows: [{ route: ['dns'], kind: 'msg', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'iptables',
      chapter: 'technique',
      title: '+ kube-proxy: ClusterIP becomes a Pod IP',
      body: [
        `A ClusterIP exists on no interface — it is only a rule. <span class="term">kube-proxy</span> on each node watches Services and EndpointSlices and writes <b>iptables</b> NAT rules: a packet for <code>10.96.0.20:80</code> gets its destination rewritten (DNAT) to one real Pod IP, picked at random.`,
        `Works well, but the rules form a linear list: with thousands of Services every new connection walks a long chain, and updates rewrite big chunks of it.`,
      ],
      changes: [`+ kube-proxy`, `+ iptables DNAT`],
      metrics: { layer: 'L4', path: 'DNAT', overhead: 'O(n) rules', scale: '~5k Services' },
      scene: {
        entities: {
          podA: podA([{ text: `→ 10.96.0.20:80`, tone: `amber` }]),
          podB: podB([{ text: `10.244.2.9:8080`, tone: `green` }]),
          bridge: bridge(),
          vxlan: vxlan(),
          coredns: coredns(),
          kubeproxy: kubeproxy([{ text: `DNAT → pod B`, tone: `green` }]),
          card: codeCard(`The rewrite`, [`$ iptables -t nat -L KUBE-SERVICES -n | head -3`, `KUBE-SVC-ORDERS  tcp  10.96.0.20  dpt:80`, `KUBE-SEP-9F2K  DNAT  to:10.244.2.9:8080`]),
        },
        links: { aBr: links.aBr(), brVx: links.brVx, vxB: links.vxB, dns: links.dns(), kp: links.kp, kpBr: links.kpBr },
        flows: [{ route: ['kp', 'kpBr'], kind: 'write', rate: 1.2 }, { route: ['aBr'], rate: 1, bounce: true }],
      },
    },
    {
      short: 'eBPF',
      chapter: 'solution',
      title: 'Result: Cilium replaces kube-proxy',
      body: [
        `A CNI like <b>Cilium</b> can replace kube-proxy entirely. Small <span class="term">eBPF</span> programs inside the kernel look the Service up in a <b>hash map</b> — O(1) no matter how many Services exist — and pick the backend there.`,
        `It also skips the iptables conntrack path, applies network policy by identity rather than IP, and gives per-connection visibility. The picture is complete: a flat network, CNI wiring, a tunnel, DNS and a data plane that scales.`,
      ],
      changes: [`+ Cilium (eBPF)`, `− kube-proxy removed`],
      metrics: { layer: 'L3–L7', path: 'in-kernel', overhead: 'O(1)', scale: '50k+ Services' },
      scene: {
        entities: {
          podA: podA(),
          podB: podB([{ text: `direct`, tone: `green` }]),
          bridge: bridge(),
          vxlan: vxlan(),
          coredns: coredns(),
          cilium: cilium([{ text: `hash lookup`, tone: `green`, icon: `zap` }]),
          card: codeCard(`No kube-proxy`, [`$ cilium status | grep KubeProxy`, `KubeProxyReplacement:  True`, `$ bpftool map list | grep lb`, `= service lookup = one map read`]),
        },
        links: { aBr: links.aBr(), brVx: links.brVx, vxB: links.vxB, dns: links.dns(), ci: links.ci, ciBr: links.ciBr },
        flows: [{ route: ['ci', 'ciBr'], kind: 'write', rate: 1.4 }, { route: ['aBr'], rate: 1.6, bounce: true }],
      },
    },
  ],
};
