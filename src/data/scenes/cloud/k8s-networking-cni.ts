// @ts-nocheck
/* eslint-disable */
import { makeBlock, makeLink, makePanel } from '@/lib/simulator/scene-builders';

export const k8sNetworkingCniLesson = {
  id: 'k8s-networking-cni',
  title: 'Kubernetes Networking: Flat Pod Network, CNI & Kube-Proxy',
  trackId: 'k8s',
  badge: 'Advanced',
  summary: 'Dive into the core Kubernetes networking requirements: IP-per-Pod flat network model, CNI plugin encapsulation (VXLAN/BGP), and Kube-Proxy packet redirection (iptables vs IPVS vs eBPF).',
  steps: [
    {
      title: 'The Golden Kubernetes Network Rules',
      short: 'Every Pod Gets an IP',
      body: [
        'Unlike Docker bridge mode where containers sit behind port forwarding and NAT, Kubernetes requires a clean, flat IP address space across all cluster nodes.',
        'Every Pod receives a real routable IP inside the cluster CIDR, enabling microservices to communicate transparently.',
      ],
      scene: {
        entities: {
          podA: makeBlock(-10, -16, { s: 4, h: 42, color: 'blue', label: ['Pod A (Node 1)', 'IP: 10.244.1.15'] }),
          podB: makeBlock(6, -16, { s: 4, h: 42, color: 'green', label: ['Pod B (Node 2)', 'IP: 10.244.2.28'] }),
          flatNetwork: makeBlock(-2, 2, { s: 5, h: 46, color: 'purple', label: ['Flat Pod Network', 'CIDR 10.244.0.0/16'] }),
          card: makePanel({ x: -12, y: 12 }, 'Golden Network Rules', [
            '1. Pod-to-Pod without NAT',
            '2. Node-to-Pod without NAT',
            '3. IP seen = IP recognized',
          ]),
        },
        links: {
          l1: makeLink('podA', 'flatNetwork', ['podA', 'flatNetwork'], { label: 'direct packet out' }),
          l2: makeLink('flatNetwork', 'podB', ['flatNetwork', 'podB'], { label: 'direct packet in' }),
        },
      },
    },
    {
      title: 'Container Network Interface (CNI)',
      short: 'veth Pair & Bridge',
      body: [
        'When a Pod is scheduled, Kubelet executes the CNI plugin (Flannel, Calico, Cilium).',
        'The CNI allocates an IP from the node subnet, attaches a virtual ethernet pair (veth), moves one end into the container namespace as `eth0`, and binds the other end to the host.',
      ],
      scene: {
        entities: {
          kubeletCaller: makeBlock(-10, -14, { s: 4, h: 42, color: 'blue', label: ['Kubelet', 'CNI Invoker'] }),
          cniBinary: makeBlock(6, -14, { s: 4, h: 42, color: 'orange', label: ['CNI Plugin', 'IPAM & Interface'] }),
          vethHost: makeBlock(-10, 4, { s: 4, h: 42, color: 'purple', label: ['veth123abc', 'Host side'] }),
          vethPod: makeBlock(6, 4, { s: 4, h: 42, color: 'green', label: ['eth0 in Pod', '10.244.1.15'] }),
          card: makePanel({ x: -2, y: 14 }, 'CNI Execution', [
            '1. Kubelet invokes CNI ADD',
            '2. CNI creates veth pair',
            '3. Injects eth0 into netns',
          ]),
        },
        links: {
          l1: makeLink('kubeletCaller', 'cniBinary', ['kubeletCaller', 'cniBinary'], { label: 'CNI ADD' }),
          l2: makeLink('cniBinary', 'vethHost', ['cniBinary', 'vethHost'], { label: 'creates pipe' }),
          l3: makeLink('cniBinary', 'vethPod', ['cniBinary', 'vethPod'], { label: 'assigns IP' }),
        },
      },
    },
    {
      title: 'Cross-Node Pod Communication (Overlay vs Direct)',
      short: 'VXLAN Overlay vs BGP',
      body: [
        'To cross physical node boundaries, CNI plugins choose between Overlay Encapsulation (VXLAN/Geneve) or Native Direct Routing (BGP peering).',
        'VXLAN wraps inner Pod IP frames inside outer UDP packets, traversing underlying physical networks without requiring router configuration.',
      ],
      scene: {
        entities: {
          srcPodNode1: makeBlock(-12, -16, { s: 4, h: 42, color: 'blue', label: ['Pod A (Node 1)', 'Payload: GET /api'] }),
          vxlanTunnel: makeBlock(-2, -2, { s: 5, h: 46, color: 'purple', label: ['VXLAN Tunnel (UDP 4789)', 'Outer UDP Frame'] }),
          dstPodNode2: makeBlock(8, 12, { s: 4, h: 42, color: 'green', label: ['Pod B (Node 2)', 'Decapsulated Payload'] }),
          card: makePanel({ x: -12, y: 12 }, 'VXLAN Tunnel', [
            'Inner: 10.244.1.15 -> 10.244.2.28',
            'Outer: Host 1 IP -> Host 2 IP',
            'Port 4789 UDP packet',
          ]),
        },
        links: {
          l1: makeLink('srcPodNode1', 'vxlanTunnel', ['srcPodNode1', 'vxlanTunnel'], { label: 'wraps in UDP' }),
          l2: makeLink('vxlanTunnel', 'dstPodNode2', ['vxlanTunnel', 'dstPodNode2'], { label: 'strips UDP header' }),
        },
      },
    },
    {
      title: 'kube-proxy & iptables Mode',
      short: 'iptables NAT Chains',
      body: [
        'A Service ClusterIP is not a real physical network interface; it is a virtual IP (VIP) programmed into Linux packet filter tables by `kube-proxy`.',
        'In iptables mode, random probabilistic rules intercept traffic heading to the VIP and perform Destination NAT (DNAT) to a healthy Pod IP.',
      ],
      scene: {
        entities: {
          callerClient: makeBlock(-2, -16, { s: 4.5, h: 42, color: 'blue', label: ['Client Pod', 'curl 10.96.0.100:80'] }),
          iptablesEngine: makeBlock(-2, -2, { s: 5, h: 46, color: 'orange', label: ['iptables KUBE-SERVICES', 'Random 50% DNAT'] }),
          podReplica1: makeBlock(-10, 12, { s: 4, h: 42, color: 'green', label: ['Target Pod 1', '10.244.1.15:8080'] }),
          podReplica2: makeBlock(6, 12, { s: 4, h: 42, color: 'green', label: ['Target Pod 2', '10.244.2.28:8080'] }),
          card: makePanel({ x: -12, y: -4 }, 'iptables DNAT', [
            'Packet hits KUBE-SERVICES',
            '50% probability -> Pod 1',
            '50% probability -> Pod 2',
          ]),
        },
        links: {
          l1: makeLink('callerClient', 'iptablesEngine', ['callerClient', 'iptablesEngine'], { label: 'targets ClusterIP' }),
          l2: makeLink('iptablesEngine', 'podReplica1', ['iptablesEngine', 'podReplica1'], { label: '50% DNAT' }),
          l3: makeLink('iptablesEngine', 'podReplica2', ['iptablesEngine', 'podReplica2'], { label: '50% DNAT' }),
        },
      },
    },
    {
      title: 'IPVS & eBPF Revolution',
      short: 'O(1) vs O(N) Scaling',
      body: [
        'At enterprise scale, linear O(N) evaluation in iptables introduces severe latency spikes.',
        'Modern clusters switch to IPVS (hash tables) or eBPF-based CNI (Cilium), achieving constant O(1) lookup times and zero network overhead.',
      ],
      scene: {
        entities: {
          heavyTraffic: makeBlock(-2, -16, { s: 4.5, h: 44, color: 'blue', label: ['10,000 Services', 'Heavy Traffic'] }),
          slowIptables: makeBlock(-10, 2, { s: 4, h: 42, color: 'slab', label: ['iptables O(N)', 'Sequential (Slow)'] }),
          fastEbpf: makeBlock(6, 2, { s: 4, h: 42, color: 'green', label: ['eBPF / IPVS O(1)', 'Direct Kernel Socket'] }),
          card: makePanel({ x: -12, y: 14 }, 'Scaling Comparison', [
            'iptables: linear scan O(N)',
            'IPVS: hash table lookup O(1)',
            'eBPF: kernel socket bytecode',
          ]),
        },
        links: {
          l1: makeLink('heavyTraffic', 'slowIptables', ['heavyTraffic', 'slowIptables'], { label: 'latency bottleneck' }),
          l2: makeLink('heavyTraffic', 'fastEbpf', ['heavyTraffic', 'fastEbpf'], { label: 'wire-speed bypass' }),
        },
      },
    },
    {
      title: 'Kubernetes Network Stack Summary',
      short: 'Complete Network Stack',
      body: [
        'The Kubernetes network stack blends container namespaces, virtual bridges, CNI overlay tunnels, and kernel packet redirection into an invisible, self-healing fabric.',
      ],
      scene: {
        entities: {
          coreDns: makeBlock(-10, -14, { s: 4, h: 42, color: 'blue', label: ['CoreDNS', 'name -> ClusterIP'] }),
          serviceVip: makeBlock(6, -14, { s: 4, h: 42, color: 'purple', label: ['Service VIP', 'Virtual Proxy'] }),
          cniTunnel: makeBlock(-10, 4, { s: 4, h: 42, color: 'orange', label: ['CNI Fabric', 'VXLAN / Calico'] }),
          endpointPods: makeBlock(6, 4, { s: 4, h: 42, color: 'green', label: ['Healthy Pods', 'Target Endpoints'] }),
          card: makePanel({ x: -2, y: 14 }, 'Network Hierarchy', [
            '1. DNS: name resolution',
            '2. Service: VIP abstraction',
            '3. CNI: IP & routing fabric',
            '4. Pod: container process',
          ]),
        },
        links: {
          l1: makeLink('coreDns', 'serviceVip', ['coreDns', 'serviceVip'], { label: 'resolves VIP' }),
          l2: makeLink('serviceVip', 'cniTunnel', ['serviceVip', 'cniTunnel'], { label: 'routes to pod subnet' }),
          l3: makeLink('cniTunnel', 'endpointPods', ['cniTunnel', 'endpointPods'], { label: 'delivers to eth0' }),
        },
      },
    },
  ],
};
