// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const reverseProxyL4L7Lesson = {
  id: 'reverse-proxy-l4-l7',
  title: 'Layer 4 vs Layer 7 Load Balancing & Envoy Proxy',
  summary: 'Compare L4 Direct Server Return (DSR) operating at millions of packets/sec with L7 Envoy application routing and graceful connection draining.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['lb_layer', 'throughput_conn_sec', 'tls_termination', 'routing_granularity'],
  legend: ['req', 'res', ['ping', 'health check'], 'fail'],
  goals: [
    { text: 'Compare Layer 4 transport vs Layer 7 application balancing', step: 1 },
    { text: 'Direct Server Return (DSR) asymmetric response bypass', step: 2 },
    { text: 'L7 Envoy / ALB path-based and header routing', step: 3 },
    { text: 'Load balancing algorithms: Least Connections vs P2C', step: 4 },
    { text: 'Graceful connection draining during blue-green deploys', step: 6 },
  ],
  steps: [
    {
      short: 'L4 vs L7 Core',
      chapter: 'setup',
      title: 'Layer 4 (Transport) vs Layer 7 (Application)',
      body: [
        'A load balancer routes traffic across backend pools, but operates at fundamentally different layers of the OSI stack.',
        '<b>Layer 4 (L4)</b> routes raw TCP/UDP packets by examining IP:Port without decrypting TLS or inspecting HTTP headers. <b>Layer 7 (L7)</b> acts as a full reverse proxy: terminating TLS, reading HTTP cookies, and routing based on URL paths.'
      ],
      callout: {
        kind: 'insight',
        text: 'L4 delivers raw speed (millions of connections/sec). L7 delivers intelligent routing and application security.'
      },
      metrics: { lb_layer: 'L4 Transport', throughput_conn_sec: '5,000,000/s', tls_termination: 'Backend Only', routing_granularity: 'IP:Port Hash' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'HTTPS GET /api/v1', icon: 'globe' }] }),
          lb: d(0, 0, { s: 4.8, h: 50, color: 'orange', glyph: 'balancer', label: ['L4 vs L7 Balancer', 'Port 443'], sub: 'Architecture Split' }),
          backend: d(10, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Backend Cluster', 'Compute Nodes'], sub: 'Web / API' }),
          card: S({ x: -2, y: 14 }, 'OSI Layer Comparison', [
            'L4 (Transport - NLB / IPVS):',
            '  - Inspects only: Source/Dest IP + TCP Port (5-tuple)',
            '  - Zero HTTP knowledge. Cannot route /api vs /static',
            'L7 (Application - Envoy / NGINX / ALB):',
            '  - Terminates TLS, parses HTTP headers, cookies, URL path',
            '  - Heavy CPU overhead (cryptography + buffer parsing)'
          ], { icon: 'layers' })
        },
        links: {
          cl: h('client', 'lb', ['client', 'lb'], { heads: 'both' }),
          lbk: h('lb', 'backend', ['lb', 'backend'], { heads: 'both' })
        },
        flows: [{ route: ['cl', 'lbk'], bounce: true, rate: 2.5 }]
      }
    },
    {
      short: 'L4 NLB & IPVS',
      chapter: 'technique',
      title: 'Layer 4: High-Throughput Packet Forwarding (IPVS)',
      body: [
        'L4 balancers (Linux IPVS, AWS NLB) use Network Address Translation (NAT) or generic routing encapsulation (GRE) to rewrite packet headers in kernel space.',
        'Because L4 does not terminate TLS, it consumes negligible CPU and handles tens of gigabits per second per server without breaking a sweat.'
      ],
      callout: {
        kind: 'tip',
        text: 'L4 balancers are ideal as the frontline entrance to your infrastructure, feeding traffic into L7 Envoy clusters.'
      },
      metrics: { lb_layer: 'L4 NLB / IPVS', throughput_conn_sec: '10,000,000/s', tls_termination: 'Passthrough', routing_granularity: '5-Tuple Hash' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Traffic Flood', tags: [{ text: 'Raw TCP Packets', icon: 'zap' }] }),
          l4: d(0, 0, { s: 4.8, h: 50, color: 'orange', glyph: 'balancer', label: ['AWS NLB / IPVS', 'Kernel L4 Engine'], sub: '10M Packets/sec' }),
          b1: d(10, -6, { s: 4.2, h: 52, color: 'blue', glyph: 'server', label: ['Node A'], sub: 'Terminates TLS' }),
          b2: d(10, 6, { s: 4.2, h: 52, color: 'blue', glyph: 'server', label: ['Node B'], sub: 'Terminates TLS' }),
          card: S({ x: -2, y: 14 }, 'L4 Packet Forwarding Mechanism', [
            'Packet: [Src: 203.0.113.5:54120 -> Dst: 198.51.100.1:443]',
            'NLB rewrites destination MAC or IP to Node A (10.0.1.5)',
            'TCP state tracked via Maglev consistent hashing',
            'Sub-millisecond processing: Zero packet buffering'
          ], { icon: 'zap' })
        },
        links: {
          cl_l4: h('client', 'l4', ['client', 'l4'], { heads: 'both' }),
          l1: h('l4', 'b1', ['l4', 'b1'], { heads: 'both' }),
          l2: h('l4', 'b2', ['l4', 'b2'], { heads: 'both' })
        },
        flows: [
          { route: ['cl_l4', 'l1'], bounce: true, rate: 2.0 },
          { route: ['cl_l4', 'l2'], bounce: true, rate: 2.0 }
        ]
      }
    },
    {
      short: 'Direct Server Return',
      chapter: 'technique',
      title: 'Direct Server Return (DSR): Asymmetric Bypass',
      body: [
        'Internet traffic is heavily asymmetric: incoming requests are tiny (GET 500 bytes), while outgoing responses are massive (HTML/Images/Video 5MB).',
        'In <b>Direct Server Return (DSR)</b>, the L4 balancer only handles incoming requests. Backend servers respond <b>directly to the client</b>, bypassing the load balancer completely and eliminating the outbound bandwidth bottleneck!'
      ],
      callout: {
        kind: 'insight',
        text: 'DSR allows a modest 10 Gbps load balancer to serve 100+ Gbps of outbound response bandwidth.'
      },
      metrics: { lb_layer: 'L4 DSR Mode', throughput_conn_sec: 'Asymmetric 10x', tls_termination: 'Backend Direct', routing_granularity: 'Bypass Outbound' },
      scene: {
        entities: {
          client: y(-10, -6, { form: 'phone', label: 'Client', tags: [{ text: 'Direct Response', icon: 'zap' }] }),
          l4: d(0, -6, { s: 4.6, h: 52, color: 'orange', glyph: 'balancer', label: ['DSR Balancer', 'Inbound Only'], sub: 'Tiny GETs only' }),
          server: d(8, 6, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Backend Server', 'VIP on lo interface'], sub: 'Answers directly to Client' }),
          card: S({ x: -2, y: 14 }, 'DSR Flow Architecture', [
            '1. Client -> DSR Balancer: GET request (500 bytes)',
            '2. Balancer forwards to Backend via L2 MAC rewrite',
            '3. Backend receives packet on loopback VIP (lo:0)',
            '4. Backend sends response DIRECTLY to Client IP (5 MB)',
            'Result: Load balancer never handles return bandwidth'
          ], { icon: 'workflow' })
        },
        links: {
          cr: h('client', 'l4', ['client', 'l4'], { heads: 'end', label: 'Request (Inbound)' }),
          ls: h('l4', 'server', ['l4', 'server'], { heads: 'end', label: 'Forward' }),
          sc: h('server', 'client', ['server', 'client'], { heads: 'end', label: 'Direct Response (Bypasses LB)' })
        },
        flows: [
          { route: ['cr', 'ls'], bounce: false, rate: 2.2 },
          { route: ['sc'], bounce: false, rate: 2.2 }
        ]
      }
    },
    {
      short: 'L7 Envoy & ALB',
      chapter: 'technique',
      title: 'Layer 7 Reverse Proxy: Envoy & Path Routing',
      body: [
        '<b>Layer 7 proxies (Envoy, NGINX, AWS ALB)</b> terminate TLS, parse the full HTTP request, and route based on domain name, URI path, headers, or query parameters.',
        '<code>/api/orders/*</code> routes to the Orders microservice, while <code>/static/*</code> routes to S3/CDN. L7 proxies also inject headers (<code>X-Forwarded-For</code>) and handle HTTP/2 to HTTP/1.1 protocol translation.'
      ],
      callout: {
        kind: 'tip',
        text: 'Envoy operates with non-blocking epoll event loops and hot-reloads configuration dynamically via xDS APIs.'
      },
      metrics: { lb_layer: 'L7 Envoy / ALB', throughput_conn_sec: '150,000/s', tls_termination: 'Terminated at Proxy', routing_granularity: 'Path / Header / Cookie' },
      scene: {
        entities: {
          client: y(-12, -4, { form: 'phone', label: 'Client', tags: [{ text: 'GET /api/v1/orders', icon: 'globe' }] }),
          envoy: d(-2, -4, { s: 4.8, h: 50, color: 'purple', glyph: 'route', label: ['Envoy Proxy L7', 'TLS Offloaded'], sub: 'xDS Dynamic Routing' }),
          svcApi: d(8, -10, { s: 4.4, h: 52, color: 'blue', glyph: 'workflow', label: ['Orders Service', 'Port 8080'], sub: 'Cluster: orders' }),
          svcStatic: d(8, 2, { s: 4.4, h: 52, color: 'teal', glyph: 'folder', label: ['Static Assets', 'Port 80'], sub: 'Cluster: static' }),
          card: S({ x: -2, y: 14 }, 'Envoy L7 Routing Matcher', [
            'route_config:',
            '  routes:',
            '  - match: { prefix: "/api/orders" }',
            '    route: { cluster: "orders-service", timeout: 2s }',
            '  - match: { prefix: "/static" }',
            '    route: { cluster: "static-s3", retry_policy: 3x }'
          ], { icon: 'route' })
        },
        links: {
          ce: h('client', 'envoy', ['client', 'envoy'], { heads: 'both', label: 'HTTPS' }),
          ea: h('envoy', 'svcApi', ['envoy', 'svcApi'], { heads: 'both', label: 'Path: /api' }),
          es: h('envoy', 'svcStatic', ['envoy', 'svcStatic'], { heads: 'both', label: 'Path: /static' })
        },
        flows: [
          { route: ['ce', 'ea'], bounce: true, rate: 2.4 }
        ]
      }
    },
    {
      short: 'Balancing Algorithms',
      chapter: 'deep',
      title: 'Balancing Algorithms: Least Connections vs P2C',
      body: [
        'How does the proxy choose which backend node receives the next request?',
        '<b>Round Robin</b> naively assumes all requests cost equal work. <b>Least Connections</b> routes to the node with fewest active requests. Modern high-scale systems (Envoy, Finagle) use <b>Power of Two Random Choices (P2C)</b>: picking 2 random nodes and choosing the less loaded one, avoiding thundering herd dogpiles.'
      ],
      callout: {
        kind: 'insight',
        text: 'P2C achieves nearly optimal load distribution with O(1) computational cost, eliminating the O(N) lock overhead of global tracking.'
      },
      metrics: { lb_layer: 'Algorithm', throughput_conn_sec: 'P2C Optimal', tls_termination: 'Terminated', routing_granularity: 'O(1) Balanced' },
      scene: {
        entities: {
          envoy: d(-8, -4, { s: 4.8, h: 50, color: 'purple', glyph: 'balancer', label: ['Envoy Balancer', 'P2C Algorithm'], sub: 'Random Sample 2' }),
          n1: d(4, -12, { s: 4.2, h: 52, color: 'blue', glyph: 'server', label: ['Node 1 (Busy)', '42 Conns'], sub: 'Skip' }),
          n2: d(4, -4, { s: 4.2, h: 52, color: 'blue', glyph: 'server', label: ['Node 2 (Idle)', '3 Conns'], sub: 'Chosen by P2C' }),
          n3: d(4, 4, { s: 4.2, h: 52, color: 'blue', glyph: 'server', label: ['Node 3 (Busy)', '38 Conns'], sub: 'Ignored' }),
          card: S({ x: -2, y: 14 }, 'Power of Two Random Choices (P2C)', [
            '1. Randomly sample 2 nodes: [Node 1, Node 2]',
            '2. Compare inflight requests: Node 1 (42) vs Node 2 (3)',
            '3. Route new request to Node 2 (least loaded of pair)',
            'Result: Eliminates "herd effect" without global sync lock'
          ], { icon: 'trendingUp' })
        },
        links: {
          e2: h('envoy', 'n2', ['envoy', 'n2'], { heads: 'both', label: 'Selected Node' })
        },
        flows: [{ route: ['e2'], bounce: true, rate: 2.8 }]
      }
    },
    {
      short: 'Session Stickiness',
      chapter: 'deep',
      title: 'Sticky Sessions: Cookie-Based vs IP Hashing',
      body: [
        'When legacy applications store state in local server memory (session state), requests from the same user must consistently land on the same backend node.',
        '<b>Application Cookie Stickiness</b> inserts an encrypted cookie (e.g. <code>AWSALB=...</code>). Subsequent requests inspect this cookie to route directly to the designated node. When that node dies, health checks redirect the user to a survivor node.'
      ],
      callout: {
        kind: 'alert',
        text: 'Sticky sessions create hot spots: if a power user generates heavy traffic, that single server becomes overloaded while others sit idle.'
      },
      metrics: { lb_layer: 'L7 Sticky Session', throughput_conn_sec: 'Cookie Routed', tls_termination: 'Terminated', routing_granularity: 'Per-User Sticky' },
      scene: {
        entities: {
          user1: y(-12, -8, { form: 'phone', label: 'User Alice', tags: [{ text: 'Cookie: ALB_NodeA', icon: 'user' }] }),
          user2: y(-12, 4, { form: 'phone', label: 'User Bob', tags: [{ text: 'Cookie: ALB_NodeB', icon: 'user' }] }),
          alb: d(-2, -2, { s: 4.8, h: 50, color: 'orange', glyph: 'balancer', label: ['AWS ALB', 'Sticky Session Engine'], sub: 'Inspects Cookie' }),
          nodeA: d(8, -8, { s: 4.4, h: 52, color: 'blue', glyph: 'server', label: ['Node A', 'Alice Session'], sub: 'Sticky Destination' }),
          nodeB: d(8, 4, { s: 4.4, h: 52, color: 'blue', glyph: 'server', label: ['Node B', 'Bob Session'], sub: 'Sticky Destination' }),
          card: S({ x: -2, y: 16 }, 'Sticky Cookie Handling', [
            'Set-Cookie: AWSALB=u8f9a21c; Path=/; Expires=...; HttpOnly',
            'Alice always hits Node A where her local session memory resides',
            'Better Modern Architecture: Remove stickiness entirely,',
            'store session tokens in shared Redis Cluster (Stateless servers)!'
          ], { icon: 'lock' })
        },
        links: {
          u1a: h('user1', 'alb', ['user1', 'alb'], { heads: 'both' }),
          u2a: h('user2', 'alb', ['user2', 'alb'], { heads: 'both' }),
          anA: h('alb', 'nodeA', ['alb', 'nodeA'], { heads: 'both' }),
          anB: h('alb', 'nodeB', ['alb', 'nodeB'], { heads: 'both' })
        },
        flows: [
          { route: ['u1a', 'anA'], bounce: true, rate: 2.0 },
          { route: ['u2a', 'anB'], bounce: true, rate: 2.0 }
        ]
      }
    },
    {
      short: 'Graceful Draining',
      chapter: 'solution',
      title: 'Zero-Downtime Deployments & Connection Draining',
      body: [
        'How do you update a backend server without dropping active HTTP requests or WebSocket connections?',
        'During <b>Connection Draining (Deregistration Delay)</b>, the proxy immediately stops sending new requests to the target node, while allowing existing in-flight requests up to 300 seconds to finish before terminating the instance.'
      ],
      callout: {
        kind: 'tip',
        text: 'In Kubernetes, the preStop hook (sleep 15) gives iptables and Ingress time to remove the dying Pod from the endpoint pool.'
      },
      metrics: { lb_layer: 'L7 Lifecycle', throughput_conn_sec: '0 Dropped Requests', tls_termination: 'Terminated', routing_granularity: 'Draining Mode' },
      scene: {
        entities: {
          client: y(-12, -4, { form: 'phone', label: 'In-Flight User', tags: [{ text: 'Active Checkout', tone: 'green', icon: 'cart' }] }),
          proxy: d(-2, -4, { s: 4.8, h: 50, color: 'purple', glyph: 'balancer', label: ['Ingress / Envoy', 'Drain Controller'], sub: 'Drain Timer: 24s left' }),
          oldNode: d(8, -10, { s: 4.4, h: 52, color: 'rose', glyph: 'server', label: ['Old Pod v1', 'DRAINING (No New Conns)'], sub: 'Finishing 3 requests' }),
          newNode: d(8, 2, { s: 4.4, h: 52, color: 'green', glyph: 'server', label: ['New Pod v2', 'HEALTHY (100% Traffic)'], sub: 'Accepting all new traffic' }),
        },
        links: {
          cp: h('client', 'proxy', ['client', 'proxy'], { heads: 'both' }),
          po: h('proxy', 'oldNode', ['proxy', 'oldNode'], { heads: 'both', label: 'Drain Active' }),
          pn: h('proxy', 'newNode', ['proxy', 'newNode'], { heads: 'both', label: 'New Traffic' })
        },
        flows: [
          { route: ['cp', 'po'], bounce: true, rate: 1.2 },
          { route: ['cp', 'pn'], bounce: true, rate: 2.5 }
        ]
      }
    }
  ]
};
