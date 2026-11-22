// @ts-nocheck
/* eslint-disable */
import { makeBlock, makeLink, makePanel } from '@/lib/simulator/scene-builders';

export const k8sServicesIngressLesson = {
  id: 'k8s-services-ingress',
  title: 'Services, Ingress Controllers & Gateway API',
  trackId: 'k8s',
  badge: 'Intermediate',
  summary: 'Understand how traffic enters a Kubernetes cluster: ClusterIP internal routing, NodePort high-port exposure, cloud LoadBalancer provisioning, and L7 Ingress / Gateway API HTTP routing.',
  metrics: ['service_type', 'cluster_ip', 'ingress_tls', 'backend_pods'],
  goals: [
    { text: 'ClusterIP Internal Routing', step: 1 },
    { text: 'NodePort External Exposure', step: 2 },
    { text: 'Cloud LoadBalancer Service', step: 3 },
    { text: 'L7 Ingress Controller Routing', step: 4 },
    { text: 'Gateway API Role Architecture', step: 5 },
  ],
  steps: [
    {
      title: 'ClusterIP: Internal Microservice Communication',
      short: 'Default Cluster-Internal VIP',
      body: [
        'ClusterIP is the default service type. It allocates a stable virtual IP address accessible only from within the cluster.',
        'Pods communicate with the service name `order-svc`, while kube-proxy dynamically distributes traffic across healthy backend Pods.',
      ],
      scene: {
        entities: {
          frontendPod: makeBlock(-10, -16, { s: 4, h: 42, color: 'blue', label: ['Frontend Pod', 'Calls order-svc:80'] }),
          clusterIpVip: makeBlock(6, -16, { s: 4.5, h: 44, color: 'purple', label: ['ClusterIP VIP', '10.96.10.45:80'] }),
          backendPod1: makeBlock(-10, 4, { s: 4, h: 42, color: 'green', label: ['Order Pod 1', '10.244.1.12:8080'] }),
          backendPod2: makeBlock(6, 4, { s: 4, h: 42, color: 'green', label: ['Order Pod 2', '10.244.2.18:8080'] }),
          card: makePanel({ x: -2, y: 14 }, 'ClusterIP Service', [
            'type: ClusterIP',
            'Virtual IP: 10.96.10.45',
            'Internal access only',
          ]),
        },
        links: {
          frontendPod_clusterIpVip: makeLink('frontendPod', 'clusterIpVip', ['frontendPod', 'clusterIpVip'], { label: 'HTTP request' }),
          clusterIpVip_backendPod1: makeLink('clusterIpVip', 'backendPod1', ['clusterIpVip', 'backendPod1'], { label: 'load balanced' }),
          clusterIpVip_backendPod2: makeLink('clusterIpVip', 'backendPod2', ['clusterIpVip', 'backendPod2'], { label: 'load balanced' }),
        },
      },
    },
    {
      title: 'NodePort: Port Forwarding on Every Node',
      short: 'High Port (30000-32767)',
      body: [
        'NodePort opens a dedicated high port (default 30000–32767) on all worker node physical IPs.',
        'Any traffic sent to `node-ip:31250` is automatically forwarded to the underlying service and routed to healthy pods, even if the pod lives on another node.',
      ],
      scene: {
        entities: {
          externalUser: makeBlock(-2, -18, { s: 4.2, h: 42, color: 'blue', label: ['External User', 'Traffic to :31250'] }),
          workerNode1: makeBlock(-10, -2, { s: 4.5, h: 44, color: 'orange', label: ['Node 1 (:31250)', 'Receives connection'] }),
          workerNode2: makeBlock(6, -2, { s: 4.5, h: 44, color: 'slab', label: ['Node 2 (:31250)', 'Idle listener'] }),
          backendPod: makeBlock(6, 14, { s: 4, h: 42, color: 'green', label: ['Target Pod (Node 2)', 'Receives packet'] }),
          card: makePanel({ x: -12, y: 12 }, 'NodePort Allocation', [
            'type: NodePort',
            'nodePort: 31250',
            'Allocated on ALL nodes',
          ]),
        },
        links: {
          externalUser_workerNode1: makeLink('externalUser', 'workerNode1', ['externalUser', 'workerNode1'], { label: 'hits port 31250' }),
          workerNode1_backendPod: makeLink('workerNode1', 'backendPod', ['workerNode1', 'backendPod'], { label: 'cross-node forwarding' }),
        },
      },
    },
    {
      title: 'LoadBalancer: Cloud Provider Integration',
      short: 'Cloud NLB/ALB Provisioning',
      body: [
        'When running on cloud providers (AWS, GCP, Azure), setting `type: LoadBalancer` automatically provisions an external cloud load balancer.',
        'The cloud load balancer distributes external internet traffic across cluster NodePorts, providing a dedicated public entry IP.',
      ],
      scene: {
        entities: {
          cloudLb: makeBlock(-2, -16, { s: 5, h: 46, color: 'purple', label: ['Cloud Load Balancer', 'IP: 34.120.45.10'] }),
          nodeA: makeBlock(-10, 2, { s: 4, h: 42, color: 'orange', label: ['Node 1 (Port 32100)', 'Target group instance'] }),
          nodeB: makeBlock(6, 2, { s: 4, h: 42, color: 'orange', label: ['Node 2 (Port 32100)', 'Target group instance'] }),
          card: makePanel({ x: -12, y: 14 }, 'Cloud LoadBalancer', [
            'type: LoadBalancer',
            'Provisions AWS NLB',
            'Dedicated Public IP',
          ]),
        },
        links: {
          cloudLb_nodeA: makeLink('cloudLb', 'nodeA', ['cloudLb', 'nodeA'], { label: 'health check' }),
          cloudLb_nodeB: makeLink('cloudLb', 'nodeB', ['cloudLb', 'nodeB'], { label: 'health check' }),
        },
      },
    },
    {
      title: 'Ingress Controller: L7 HTTP Routing',
      short: 'Host & Path Based Routing',
      body: [
        'Creating a cloud LoadBalancer for each service is expensive and unmanageable.',
        'An Ingress Controller (NGINX, Envoy, Traefik) acts as a single reverse proxy entry point, routing traffic by HTTP Host header and URL Path to hundreds of internal services.',
      ],
      scene: {
        entities: {
          ingressController: makeBlock(-2, -16, { s: 5, h: 46, color: 'green', label: ['Ingress Controller', 'NGINX / Envoy Proxy'] }),
          orderService: makeBlock(-10, 4, { s: 4, h: 42, color: 'blue', label: ['order-svc:80', 'Path: /orders'] }),
          userService: makeBlock(6, 4, { s: 4, h: 42, color: 'orange', label: ['user-svc:80', 'Path: /users'] }),
          card: makePanel({ x: -12, y: 14 }, 'Ingress Rules', [
            'rules:',
            '- host: api.example.com',
            '  /orders -> order-svc',
            '  /users  -> user-svc',
          ]),
        },
        links: {
          ingressController_orderService: makeLink('ingressController', 'orderService', ['ingressController', 'orderService'], { label: 'GET /orders' }),
          ingressController_userService: makeLink('ingressController', 'userService', ['ingressController', 'userService'], { label: 'GET /users' }),
        },
      },
    },
    {
      title: 'Gateway API: The Modern Successor',
      short: 'Role-Oriented Gateway API',
      body: [
        'The Gateway API is the modern evolution of Ingress, separating concerns by role:',
        'Platform engineers manage Gateways and TLS policies, while developers manage granular HTTPRoutes, canary traffic splitting, and header filtering.',
      ],
      scene: {
        entities: {
          infraGateway: makeBlock(-2, -16, { s: 5, h: 46, color: 'purple', label: ['Gateway Resource', 'Platform Team'] }),
          stableRoute: makeBlock(-10, 4, { s: 4, h: 42, color: 'blue', label: ['Order Stable', '90% Traffic'] }),
          canaryRoute: makeBlock(6, 4, { s: 4, h: 42, color: 'green', label: ['Order Canary', '10% Traffic'] }),
        },
        links: {
          infraGateway_stableRoute: makeLink('infraGateway', 'stableRoute', ['infraGateway', 'stableRoute'], { label: 'weight: 90' }),
          infraGateway_canaryRoute: makeLink('infraGateway', 'canaryRoute', ['infraGateway', 'canaryRoute'], { label: 'weight: 10' }),
        },
      },
    },
    {
      title: 'Traffic Ingress Architecture Summary',
      short: 'Full Traffic Pipeline',
      body: [
        'From external DNS queries to final container socket buffers, Kubernetes provides layered abstraction models balancing cost, flexibility, and security.',
      ],
      scene: {
        entities: {
          internetUser: makeBlock(-2, -18, { s: 4.2, h: 42, color: 'blue', label: ['Internet Client', 'https://api.com'] }),
          edgeLb: makeBlock(-2, -4, { s: 5, h: 44, color: 'purple', label: ['Cloud LB / Ingress', 'TLS Termination'] }),
          clusterService: makeBlock(-10, 12, { s: 4, h: 42, color: 'orange', label: ['ClusterIP Service', 'Virtual IP'] }),
          targetPodEnd: makeBlock(6, 12, { s: 4, h: 42, color: 'green', label: ['Endpoint Pod', 'App Handler'] }),
          card: makePanel({ x: -12, y: 14 }, 'Ingress Pipeline', [
            '1. DNS -> Cloud LB',
            '2. Ingress terminates TLS',
            '3. Match path -> Service',
            '4. Deliver to Pod IP',
          ]),
        },
        links: {
          internetUser_edgeLb: makeLink('internetUser', 'edgeLb', ['internetUser', 'edgeLb'], { label: 'HTTPS request' }),
          edgeLb_clusterService: makeLink('edgeLb', 'clusterService', ['edgeLb', 'clusterService'], { label: 'path matching' }),
          clusterService_targetPodEnd: makeLink('clusterService', 'targetPodEnd', ['clusterService', 'targetPodEnd'], { label: 'DNAT to Pod IP' }),
        },
      },
    },
  ],
};
