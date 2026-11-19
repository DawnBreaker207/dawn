export interface TopologyNode {
  id: string;
  name: string;
  role: string;
  icon: string;
  x: number; // percentage in SVG viewBox 0-1000
  y: number; // percentage in SVG viewBox 0-600
  type: 'client' | 'network' | 'gateway' | 'compute' | 'cache' | 'storage';
}

export interface SimulationStep {
  step: number;
  title: string;
  subtitle: string;
  protocol: string;
  latencyMs: number;
  totalLatencyMs: number;
  activeNodeIds: string[];
  activeLink: { from: string; to: string } | null;
  packetText: string;
  description: string[];
  technicalDetails: { label: string; value: string }[];
  cacheStatus?: 'HIT' | 'MISS' | 'NONE';
  responseCode?: number;
}

export const TOPOLOGY_NODES: TopologyNode[] = [
  { id: 'client', name: 'Browser Client', role: 'HTTPS / HTTP/3', icon: '💻', x: 80, y: 280, type: 'client' },
  { id: 'dns', name: 'Authoritative DNS', role: 'Route53 / CoreDNS', icon: '🌐', x: 260, y: 110, type: 'network' },
  { id: 'cdn', name: 'Edge CDN / Anycast', role: 'Cloudflare PoP', icon: '⚡', x: 300, y: 280, type: 'network' },
  { id: 'lb', name: 'Load Balancer', role: 'NGINX / Envoy Proxy', icon: '⚖️', x: 520, y: 280, type: 'gateway' },
  { id: 'app', name: 'App Cluster', role: 'Node / Spring Pods', icon: '⚙️', x: 740, y: 280, type: 'compute' },
  { id: 'cache', name: 'Redis Cache', role: 'In-Memory (Key-Value)', icon: '⚡', x: 880, y: 130, type: 'cache' },
  { id: 'db', name: 'PostgreSQL Primary', role: 'ACID Relational DB', icon: '🗄️', x: 880, y: 430, type: 'storage' },
];

export const TOPOLOGY_LINKS = [
  { from: 'client', to: 'dns', label: 'UDP:53' },
  { from: 'client', to: 'cdn', label: 'HTTPS:443' },
  { from: 'cdn', to: 'lb', label: 'mTLS' },
  { from: 'lb', to: 'app', label: 'gRPC / HTTP' },
  { from: 'app', to: 'cache', label: 'RESP:6379' },
  { from: 'app', to: 'db', label: 'TCP:5432' },
];

export const REQUEST_LIFECYCLE_STEPS: SimulationStep[] = [
  {
    step: 1,
    title: 'Client Request Initiation',
    subtitle: 'User enters URL or clicks link in browser',
    protocol: 'Browser Navigation / DOM Event',
    latencyMs: 1,
    totalLatencyMs: 1,
    activeNodeIds: ['client'],
    activeLink: null,
    packetText: 'INIT',
    description: [
      'The browser process initiates a network request for `https://api.example.com/v1/feed`.',
      'The HTTP cache is checked locally (Cache-Control / ETag). Result: Cache Miss.',
      'The OS network stack prepares to resolve the domain name to an IP address.',
    ],
    technicalDetails: [
      { label: 'Method', value: 'GET' },
      { label: 'Target', value: '/v1/feed' },
      { label: 'Local Cache', value: 'MISS (Cold Start)' },
    ],
    cacheStatus: 'NONE',
  },
  {
    step: 2,
    title: 'DNS Resolution',
    subtitle: 'Resolving domain name to closest IP via UDP/DoH',
    protocol: 'DNS over HTTPS / UDP Port 53',
    latencyMs: 12,
    totalLatencyMs: 13,
    activeNodeIds: ['client', 'dns'],
    activeLink: { from: 'client', to: 'dns' },
    packetText: 'DNS QUERY',
    description: [
      'Browser checks OS resolver cache → router DNS → ISP Recursive Resolver.',
      'On recursive cache miss, queries Root (.) → TLD (.com) → Authoritative Name Servers.',
      'Returns Anycast BGP IP `104.18.26.112` pointing to the nearest Edge Point of Presence (PoP).',
    ],
    technicalDetails: [
      { label: 'Record Type', value: 'A / AAAA (IPv4/IPv6)' },
      { label: 'Resolved IP', value: '104.18.26.112 (Anycast)' },
      { label: 'TTL', value: '300 seconds' },
    ],
    cacheStatus: 'NONE',
  },
  {
    step: 3,
    title: 'Edge CDN & TLS 1.3 Handshake',
    subtitle: 'Routing to nearest Edge PoP via BGP Anycast',
    protocol: 'TLS 1.3 / TCP Fast Open',
    latencyMs: 8,
    totalLatencyMs: 21,
    activeNodeIds: ['client', 'cdn'],
    activeLink: { from: 'client', to: 'cdn' },
    packetText: 'TLS 1.3 SYN',
    description: [
      'TCP 3-way handshake combined with 1-RTT TLS 1.3 cryptographic key exchange (ECDHE).',
      'CDN checks Edge Cache memory (Layer 7). Since dynamic user feeds are personalized, edge cache returns MISS.',
      'CDN establishes persistent upstream keep-alive connection toward origin Load Balancer.',
    ],
    technicalDetails: [
      { label: 'Cipher Suite', value: 'TLS_AES_256_GCM_SHA384' },
      { label: 'Edge Cache', value: 'MISS (Dynamic / Private)' },
      { label: 'WAF / DDoS', value: 'Inspected & Passed' },
    ],
    cacheStatus: 'MISS',
  },
  {
    step: 4,
    title: 'Load Balancer & Reverse Proxy',
    subtitle: 'Traffic distribution, SSL termination & rate limiting',
    protocol: 'HTTP/2 Multiplexed',
    latencyMs: 3,
    totalLatencyMs: 24,
    activeNodeIds: ['cdn', 'lb'],
    activeLink: { from: 'cdn', to: 'lb' },
    packetText: 'REVERSE PROXY',
    description: [
      'Edge CDN passes request to internal Load Balancer (e.g. AWS ALB / Envoy Proxy / NGINX).',
      'Load Balancer inspects headers, checks Token Bucket rate limits (100 req/min).',
      'Executes Least-Connections load balancing algorithm and dispatches request to an idle App Server in Zone us-east-1a.',
    ],
    technicalDetails: [
      { label: 'Algorithm', value: 'Least-Outstanding-Requests' },
      { label: 'Health Status', value: '12 / 12 Pods Healthy' },
      { label: 'Selected Target', value: 'app-pod-7a.internal:8080' },
    ],
    cacheStatus: 'NONE',
  },
  {
    step: 5,
    title: 'Application Server Processing',
    subtitle: 'JWT authentication, routing & business logic execution',
    protocol: 'gRPC / Internal HTTP',
    latencyMs: 4,
    totalLatencyMs: 28,
    activeNodeIds: ['lb', 'app'],
    activeLink: { from: 'lb', to: 'app' },
    packetText: 'APP DISPATCH',
    description: [
      'App worker (Node.js event loop / Spring Virtual Thread) parses Bearer JWT signature.',
      'Extracts `user_id: 84920` and permissions.',
      'Executes business logic: construct query for latest feed items and personalized counters.',
    ],
    technicalDetails: [
      { label: 'Auth Check', value: 'JWT Validated (HMAC-SHA256)' },
      { label: 'Thread Model', value: 'Virtual Thread #1289' },
      { label: 'Action', value: 'Read Cache -> Fallback DB' },
    ],
    cacheStatus: 'NONE',
  },
  {
    step: 6,
    title: 'In-Memory Cache (Redis)',
    subtitle: 'Checking hot cache key for user feed timeline',
    protocol: 'RESP Protocol (Port 6379)',
    latencyMs: 2,
    totalLatencyMs: 30,
    activeNodeIds: ['app', 'cache'],
    activeLink: { from: 'app', to: 'cache' },
    packetText: 'REDIS GET',
    description: [
      'App issues non-blocking command: `GET feed:user:84920`.',
      'Redis in-memory hash lookup executes in sub-millisecond time (~0.4ms).',
      'Feed cache key expired 10s ago (TTL 60s expired) → returns Cache MISS. Fallback to Primary DB.',
    ],
    technicalDetails: [
      { label: 'Command', value: 'GET feed:user:84920' },
      { label: 'Result', value: 'NIL (Cache Miss)' },
      { label: 'Cache Strategy', value: 'Cache-Aside (Lazy Load)' },
    ],
    cacheStatus: 'MISS',
  },
  {
    step: 7,
    title: 'Database Query & Index Lookup',
    subtitle: 'PostgreSQL B-Tree index scan on user_id + timestamp',
    protocol: 'PostgreSQL Wire Protocol (5432)',
    latencyMs: 11,
    totalLatencyMs: 41,
    activeNodeIds: ['app', 'db'],
    activeLink: { from: 'app', to: 'db' },
    packetText: 'SQL INDEX SCAN',
    description: [
      'App borrows connection from HikariCP pool and sends parameterized SQL query.',
      'PostgreSQL query planner runs Index Scan using `idx_posts_user_created` (B-Tree).',
      'Reads 20 row tuples from `shared_buffers` buffer cache, returns JSON result set in 2.8ms.',
      'App writes fresh result back to Redis (`SETEX feed:user:84920 60 ...`).',
    ],
    technicalDetails: [
      { label: 'Execution Plan', value: 'Index Scan on idx_posts (cost 0.42..8.45)' },
      { label: 'Rows Scanned', value: '20 rows (Limit 20)' },
      { label: 'Buffer Cache', value: 'Hit 8 pages (0 disk reads)' },
    ],
    cacheStatus: 'NONE',
  },
  {
    step: 8,
    title: 'Response Assembly & Return Path',
    subtitle: 'Serializing JSON payload and streaming back to client',
    protocol: 'HTTP/2 Response 200 OK',
    latencyMs: 4,
    totalLatencyMs: 45,
    activeNodeIds: ['client', 'cdn', 'lb', 'app'],
    activeLink: { from: 'app', to: 'client' },
    packetText: '200 OK (45ms)',
    description: [
      'App serializes response payload (gzip compressed JSON, 14.2 KB).',
      'Response streams back through Load Balancer → CDN Edge → Client Browser.',
      'Browser parses JSON, reconciles DOM via Virtual DOM / React hydration, and paints feed on screen.',
      'Complete round-trip lifecycle finished in 45 milliseconds!',
    ],
    technicalDetails: [
      { label: 'Status Code', value: '200 OK' },
      { label: 'Payload Size', value: '14.2 KB (gzip)' },
      { label: 'Total Latency', value: '45 ms (P95 SLA)' },
    ],
    cacheStatus: 'NONE',
    responseCode: 200,
  },
];
