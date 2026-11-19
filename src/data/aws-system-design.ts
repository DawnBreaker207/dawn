export interface AwsNode {
  id: string;
  name: string;
  category: 'edge' | 'gateway' | 'compute' | 'messaging' | 'storage' | 'observability';
  icon: string;
  awsService: string;
  zone: 'edge' | 'public_vpc' | 'private_vpc' | 'data_vpc';
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
  specs: string[];
}

export interface ScenarioStep {
  step: number;
  from: string;
  to: string;
  label: string;
  protocol: string;
  latencyMs: number;
  status: 'ok' | 'cache_hit' | 'queued' | 'fail' | 'rollback' | 'failover';
  description: string;
}

export interface AwsScenario {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  summary: string;
  metrics: {
    qps: string;
    p99: string;
    ttfb: string;
    errorRate: string;
    activeNodes: string;
  };
  steps: ScenarioStep[];
  takeaway: string;
}

export interface SystemDesignLesson {
  id: string;
  module: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  problem: string;
  solution: string;
  tradeoffs: string[];
  awsImplementation: string;
  napkinMath?: string;
}

export const AWS_ZONES = [
  { id: 'edge', title: 'Global Edge Network (Route 53 & CloudFront PoPs)', x: 30, y: 30, width: 280, height: 600, color: '#38bdf8' },
  { id: 'public_vpc', title: 'AWS VPC — Public Subnet (ALB / Ingress Gateway)', x: 340, y: 30, width: 240, height: 600, color: '#fbbf24' },
  { id: 'private_vpc', title: 'AWS VPC — Private Subnet (Microservices Cluster)', x: 610, y: 30, width: 440, height: 600, color: '#a855f7' },
  { id: 'data_vpc', title: 'AWS VPC — Isolated Data Subnet (Multi-AZ Persistence)', x: 1080, y: 30, width: 360, height: 600, color: '#34d399' },
];

export const AWS_NODES: AwsNode[] = [
  // Edge Zone
  {
    id: 'user',
    name: 'Client App / User',
    category: 'edge',
    icon: '📱',
    awsService: 'Web / Mobile Client',
    zone: 'edge',
    x: 60,
    y: 120,
    width: 220,
    height: 90,
    description: 'Global end-users issuing HTTPS requests across desktop and mobile clients.',
    specs: ['HTTP/2 & HTTP/3', 'TLS 1.3', 'JWT Bearer Auth']
  },
  {
    id: 'route53',
    name: 'AWS Route 53',
    category: 'edge',
    icon: '🌐',
    awsService: 'Amazon Route 53',
    zone: 'edge',
    x: 60,
    y: 270,
    width: 220,
    height: 90,
    description: 'Highly available and scalable cloud DNS service with latency-based and geo-proximity routing.',
    specs: ['Anycast DNS', 'Health Checks & Failover', '<20ms Global Lookup']
  },
  {
    id: 'cloudfront',
    name: 'AWS CloudFront',
    category: 'edge',
    icon: '⚡',
    awsService: 'Amazon CloudFront & WAF',
    zone: 'edge',
    x: 60,
    y: 430,
    width: 220,
    height: 90,
    description: 'Global Edge CDN caching static assets, API responses, with AWS WAF shield against DDoS attacks.',
    specs: ['600+ Edge PoPs', 'Edge TLS Termination', 'DDoS / WAF Shield']
  },

  // Public Subnet Ingress
  {
    id: 'alb',
    name: 'Application Load Balancer',
    category: 'gateway',
    icon: '⚖️',
    awsService: 'AWS ALB / API Gateway',
    zone: 'public_vpc',
    x: 360,
    y: 260,
    width: 200,
    height: 120,
    description: 'Layer 7 load balancer terminating SSL, inspecting headers, and performing path-based routing to microservices.',
    specs: ['Path Routing (/api/*)', 'Auto-Scaling Target Groups', 'Cross-AZ Balancing']
  },

  // Private Subnet Microservices
  {
    id: 'order_svc',
    name: 'Order Microservice',
    category: 'compute',
    icon: '📦',
    awsService: 'Amazon ECS Fargate',
    zone: 'private_vpc',
    x: 630,
    y: 80,
    width: 190,
    height: 95,
    description: 'Orchestrates checkout, shopping cart, and Saga distributed transactions across services.',
    specs: ['Stateless Containers', 'Auto Scaling Group', 'gRPC / REST']
  },
  {
    id: 'payment_svc',
    name: 'Payment Service',
    category: 'compute',
    icon: '💳',
    awsService: 'Amazon ECS / Lambda',
    zone: 'private_vpc',
    x: 630,
    y: 220,
    width: 190,
    height: 95,
    description: 'Card processing, banking gateway integration with Circuit Breaker and idempotency keys.',
    specs: ['Idempotency Token', 'PCI-DSS Compliant', 'Circuit Breaker (Envoy)']
  },
  {
    id: 'inventory_svc',
    name: 'Inventory Service',
    category: 'compute',
    icon: '🏷️',
    awsService: 'Amazon ECS Fargate',
    zone: 'private_vpc',
    x: 630,
    y: 360,
    width: 190,
    height: 95,
    description: 'Real-time stock reservation, warehouse tracking, and SKU management.',
    specs: ['Pessimistic / Optimistic Locking', 'Redis Stock Cache', 'Event-Driven SQS']
  },
  {
    id: 'sqs',
    name: 'Amazon SQS & SNS',
    category: 'messaging',
    icon: '📬',
    awsService: 'Amazon SQS / EventBridge',
    zone: 'private_vpc',
    x: 850,
    y: 220,
    width: 180,
    height: 100,
    description: 'Fully managed distributed message queuing and event fan-out with Dead Letter Queues (DLQ).',
    specs: ['Decoupled Buffering', 'FIFO Guarantee', 'Dead-Letter Queue']
  },
  {
    id: 'cloudwatch',
    name: 'CloudWatch & X-Ray',
    category: 'observability',
    icon: '📊',
    awsService: 'AWS CloudWatch / X-Ray',
    zone: 'private_vpc',
    x: 850,
    y: 400,
    width: 180,
    height: 85,
    description: 'Centralized telemetry, distributed request tracing across microservices, and auto-failover alarms.',
    specs: ['P99 Latency Alarms', 'Distributed Tracing', 'Synthetic Canary']
  },

  // Data Subnet Persistence
  {
    id: 'redis',
    name: 'ElastiCache Redis',
    category: 'storage',
    icon: '⚡',
    awsService: 'Amazon ElastiCache Redis',
    zone: 'data_vpc',
    x: 1110,
    y: 80,
    width: 220,
    height: 95,
    description: 'Sub-millisecond in-memory cache for session tokens, product catalog, and distributed mutex locks.',
    specs: ['Cluster Mode (Sharded)', 'Cache-Aside Pattern', '<1ms Latency']
  },
  {
    id: 'aurora',
    name: 'Aurora PostgreSQL (Multi-AZ)',
    category: 'storage',
    icon: '🗄️',
    awsService: 'Amazon Aurora Multi-AZ',
    zone: 'data_vpc',
    x: 1110,
    y: 230,
    width: 220,
    height: 110,
    description: 'ACID transactional relational database with Primary in AZ-A and automatic failover replica in AZ-B.',
    specs: ['Multi-AZ Auto Failover (<30s)', 'Storage auto-scales to 128TB', 'Read Replicas (up to 15)']
  },
  {
    id: 'dynamodb',
    name: 'DynamoDB NoSQL',
    category: 'storage',
    icon: '📑',
    awsService: 'Amazon DynamoDB Global',
    zone: 'data_vpc',
    x: 1110,
    y: 380,
    width: 220,
    height: 95,
    description: 'Serverless key-value / document database with single-digit millisecond latency and Global Tables.',
    specs: ['Single-Digit ms Latency', 'Multi-Region Global Tables', 'Infinite Scale Partitioning']
  },
  {
    id: 's3',
    name: 'Amazon S3 Bucket',
    category: 'storage',
    icon: '🪣',
    awsService: 'Amazon S3 Standard',
    zone: 'data_vpc',
    x: 1110,
    y: 510,
    width: 220,
    height: 85,
    description: 'Object storage for product images, invoice PDFs, and video media with 99.999999999% durability.',
    specs: ['11 9s Durability', 'Presigned URLs', 'Cross-Region Replication']
  }
];

export const AWS_SCENARIOS: AwsScenario[] = [
  {
    id: 'normal',
    title: '1. Baseline Request Lifecycle (Normal Traffic)',
    badge: 'Baseline Flow',
    badgeColor: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
    summary: 'A standard user purchase request traversing DNS, CDN, ALB, Microservice, Cache, and Relational Database.',
    metrics: { qps: '1,200 req/s', p99: '65 ms', ttfb: '38 ms', errorRate: '0.001%', activeNodes: '12 containers' },
    steps: [
      { step: 1, from: 'user', to: 'route53', label: 'DNS Resolution', protocol: 'DNS over UDP', latencyMs: 15, status: 'ok', description: 'Route 53 resolves domain to nearest CloudFront Anycast IP address.' },
      { step: 2, from: 'user', to: 'cloudfront', label: 'HTTPS Request (TLS 1.3)', protocol: 'HTTPS', latencyMs: 25, status: 'ok', description: 'CloudFront edge verifies SSL cert and serves static assets directly from cache.' },
      { step: 3, from: 'cloudfront', to: 'alb', label: 'Path /api/orders forwarded', protocol: 'HTTP/2', latencyMs: 12, status: 'ok', description: 'Dynamic request forwarded over AWS backbone network to Application Load Balancer.' },
      { step: 4, from: 'alb', to: 'order_svc', label: 'Route to Order Service', protocol: 'HTTP Target Group', latencyMs: 4, status: 'ok', description: 'ALB picks healthiest ECS Fargate container using least-outstanding-requests.' },
      { step: 5, from: 'order_svc', to: 'redis', label: 'Check User Session & Catalog', protocol: 'Redis TCP', latencyMs: 1, status: 'cache_hit', description: 'ElastiCache returns session and cached product details in under 1ms (Cache Hit).' },
      { step: 6, from: 'order_svc', to: 'aurora', label: 'Insert Order Row (ACID Tx)', protocol: 'PostgreSQL Pool', latencyMs: 8, status: 'ok', description: 'Order inserted into primary Aurora database with optimistic concurrency check.' },
      { step: 7, from: 'order_svc', to: 'user', label: '201 Created Response', protocol: 'HTTPS', latencyMs: 38, status: 'ok', description: 'Response travels back to user with order ID and confirmation status.' }
    ],
    takeaway: 'In normal conditions, caching static files at CloudFront and hot data in Redis saves ~80% of database compute load.'
  },
  {
    id: 'flash_sale',
    title: '2. Black Friday Traffic Surge (Queue Buffering & Auto Scaling)',
    badge: 'Traffic Spike',
    badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    summary: 'Traffic suddenly multiplies 20x. SQS buffers spike traffic, preventing database collapse while ECS auto-scales out.',
    metrics: { qps: '24,000 req/s', p99: '180 ms', ttfb: '55 ms', errorRate: '0.00%', activeNodes: '48 containers' },
    steps: [
      { step: 1, from: 'user', to: 'cloudfront', label: '24k QPS Flash Sale Flood', protocol: 'HTTPS', latencyMs: 28, status: 'ok', description: 'Surge of shoppers arrive simultaneously; CloudFront absorbs all static requests without hitting origin.' },
      { step: 2, from: 'cloudfront', to: 'alb', label: 'Target Group Health OK', protocol: 'HTTP/2', latencyMs: 14, status: 'ok', description: 'ALB absorbs connection surges; CloudWatch triggers Auto Scaling alarm on target tracking.' },
      { step: 3, from: 'alb', to: 'order_svc', label: 'ECS scales 12 → 48 tasks', protocol: 'Container Pool', latencyMs: 6, status: 'ok', description: 'ECS Fargate deploys 36 new task replicas across 3 Availability Zones.' },
      { step: 4, from: 'order_svc', to: 'sqs', label: 'Enqueues Orders to SQS FIFO', protocol: 'AWS SDK SQS', latencyMs: 5, status: 'queued', description: 'Instead of hitting DB directly, orders are buffered into Amazon SQS queue to level out the spike.' },
      { step: 5, from: 'sqs', to: 'aurora', label: 'Throttled batch write (500/s)', protocol: 'Worker Pool', latencyMs: 12, status: 'ok', description: 'Worker processes consume SQS messages at a steady, sustainable rate, protecting Aurora from connection pool exhaustion.' }
    ],
    takeaway: 'Queues transform spiky peak demand into a smooth plateau, guaranteeing zero dropped orders and preventing database death spirals.'
  },
  {
    id: 'db_failover',
    title: '3. Aurora Primary DB Failure & Multi-AZ Auto Failover',
    badge: 'Disaster Recovery',
    badgeColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    summary: 'Hardware failure takes down the primary Aurora instance in AZ-A. Aurora automatically promotes the replica in AZ-B in <30s.',
    metrics: { qps: '1,800 req/s', p99: 'Failover in 24s', ttfb: '45 ms post-recovery', errorRate: '0.05% (during 20s)', activeNodes: 'Replica Promoted' },
    steps: [
      { step: 1, from: 'aurora', to: 'cloudwatch', label: 'Primary Node Hardware Crash', protocol: 'Health Pulse Lost', latencyMs: 500, status: 'fail', description: 'Instance in Availability Zone A stops responding to heartbeat.' },
      { step: 2, from: 'cloudwatch', to: 'aurora', label: 'Trigger Failover Protocol', protocol: 'RDS Control Plane', latencyMs: 1200, status: 'failover', description: 'Aurora detects loss of leader; shared distributed 6-way storage layer remains completely intact.' },
      { step: 3, from: 'aurora', to: 'aurora', label: 'Promote AZ-B Replica to Primary', protocol: 'Cluster Leader Election', latencyMs: 18000, status: 'failover', description: 'Read replica in AZ-B is elected new Primary. DNS record for cluster writer endpoint updates automatically.' },
      { step: 4, from: 'order_svc', to: 'aurora', label: 'Reconnect via Cluster Endpoint', protocol: 'PostgreSQL Pool', latencyMs: 15, status: 'ok', description: 'HikariCP connection pool on Order Service re-resolves writer DNS and resumes processing writes smoothly.' }
    ],
    takeaway: 'Separating storage from compute in Amazon Aurora enables sub-30 second failover with zero data loss (RPO = 0).'
  },
  {
    id: 'saga_pattern',
    title: '4. Microservices Distributed Transaction (Saga with Rollback)',
    badge: 'Microservices Saga',
    badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
    summary: 'Order created, payment authorized, but inventory runs out. Saga orchestrator triggers compensating transaction to refund payment.',
    metrics: { qps: '450 tx/s', p99: '110 ms', ttfb: '42 ms', errorRate: 'Clean Rollback', activeNodes: '3 Microservices' },
    steps: [
      { step: 1, from: 'order_svc', to: 'order_svc', label: '1. Create Order (PENDING)', protocol: 'Internal Tx', latencyMs: 8, status: 'ok', description: 'Order Service writes order record with status PENDING.' },
      { step: 2, from: 'order_svc', to: 'payment_svc', label: '2. Authorize Payment ($149)', protocol: 'gRPC Call', latencyMs: 35, status: 'ok', description: 'Payment service charges customer card successfully and records transaction ID.' },
      { step: 3, from: 'order_svc', to: 'inventory_svc', label: '3. Reserve Item SKU #8812', protocol: 'gRPC Call', latencyMs: 20, status: 'fail', description: 'Inventory service rejects reservation: Item is OUT OF STOCK!' },
      { step: 4, from: 'order_svc', to: 'payment_svc', label: '4. Compensating Tx: Refund $149', protocol: 'Compensate gRPC', latencyMs: 40, status: 'rollback', description: 'Saga orchestrator immediately calls Payment Service to reverse the charge.' },
      { step: 5, from: 'order_svc', to: 'user', label: '5. Return: Out of Stock (Refunded)', protocol: 'HTTPS', latencyMs: 110, status: 'rollback', description: 'User notified that stock was depleted, but payment was safely refunded.' }
    ],
    takeaway: 'In distributed microservices, 2-Phase Commit (2PC) does not scale. Use Sagas with compensating transactions for eventual consistency.'
  },
  {
    id: 'circuit_breaker',
    title: '5. Circuit Breaker & Cascading Failure Isolation',
    badge: 'Fault Isolation',
    badgeColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    summary: 'External payment partner experiences outage. Circuit breaker trips to OPEN, saving order threads from catastrophic exhaustion.',
    metrics: { qps: '850 req/s', p99: '4 ms (Fast Fail)', ttfb: '6 ms', errorRate: 'Isolated Fallback', activeNodes: 'Circuit: OPEN' },
    steps: [
      { step: 1, from: 'order_svc', to: 'payment_svc', label: 'Payment Gateway 5s timeouts', protocol: 'External HTTP', latencyMs: 5000, status: 'fail', description: '3rd party payment gateway slows to crawl; threads begin hanging on Order Service.' },
      { step: 2, from: 'order_svc', to: 'order_svc', label: 'Error rate exceeds 50% threshold', protocol: 'Resilience4j / Envoy', latencyMs: 2, status: 'fail', description: 'Circuit Breaker metrics window detects 5 consecutive timeouts.' },
      { step: 3, from: 'order_svc', to: 'order_svc', label: 'State changes: CLOSED → OPEN', protocol: 'Circuit Breaker State', latencyMs: 1, status: 'failover', description: 'Circuit trips OPEN. All subsequent payment calls fail fast without touching downstream network.' },
      { step: 4, from: 'order_svc', to: 'user', label: 'Instant Fallback: Retry Later', protocol: 'HTTPS', latencyMs: 6, status: 'ok', description: 'User receives immediate friendly error message in 6ms instead of browser spinning for 30 seconds.' }
    ],
    takeaway: 'Circuit breakers prevent local downstream delays from exhausting connection pools and cascading into global platform downtime.'
  },
  {
    id: 'multi_region',
    title: '6. Multi-Region Active-Active with DynamoDB Global Tables',
    badge: 'Multi-Region DR',
    badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    summary: 'Serving global users from US-East and AP-Southeast with bidirectional sub-second data replication.',
    metrics: { qps: '35,000 req/s', p99: '32 ms global', ttfb: '24 ms', errorRate: '0.00%', activeNodes: '2 AWS Regions' },
    steps: [
      { step: 1, from: 'user', to: 'route53', label: 'Route 53 Geolocation / Latency Routing', protocol: 'DNS Geo', latencyMs: 12, status: 'ok', description: 'User in Sydney directed to ap-southeast-2 (Sydney); user in New York directed to us-east-1.' },
      { step: 2, from: 'user', to: 'cloudfront', label: 'Regional Edge Gateway', protocol: 'HTTP/3 QUIC', latencyMs: 18, status: 'ok', description: 'Each region operates independent ALB and microservices cluster.' },
      { step: 3, from: 'order_svc', to: 'dynamodb', label: 'Local Region Low-Latency Write', protocol: 'DynamoDB API', latencyMs: 4, status: 'ok', description: 'Writes occur locally in region with single-digit millisecond latency.' },
      { step: 4, from: 'dynamodb', to: 'dynamodb', label: 'Global Table Replication (<1s)', protocol: 'AWS Private WAN', latencyMs: 450, status: 'ok', description: 'DynamoDB Global Tables replicates writes bidirectionally across regions in background.' }
    ],
    takeaway: 'Active-Active Multi-Region guarantees near 99.999% availability and survival even if an entire AWS geographical region goes dark.'
  }
];

export const SYSTEM_DESIGN_LESSONS: SystemDesignLesson[] = [
  {
    id: 'microservices',
    module: 'Architecture',
    title: 'Monolith vs Microservices & Domain-Driven Design',
    difficulty: 'Intermediate',
    summary: 'Deconstructing a monolithic application into independently deployable domain services.',
    problem: 'Monoliths suffer from deployment bottlenecks, tight coupling, and blast radius where a memory leak in one module crashes the entire company.',
    solution: 'Divide systems along Domain-Driven Design (DDD) Bounded Contexts (Order, Payment, Inventory, User). Each service owns its private database.',
    tradeoffs: [
      'Monolith: Easier debugging, single transaction boundary, lower operational overhead.',
      'Microservices: Independent scaling, polyglot tech stack, but high distributed complexity.'
    ],
    awsImplementation: 'Amazon ECS on AWS Fargate or Amazon EKS with AWS App Mesh / Amazon Cloud Map for service discovery.',
    napkinMath: 'Overhead: 15 microservices adding 3ms network hop each = ~45ms latency tax vs single in-memory call.'
  },
  {
    id: 'sagas',
    module: 'Transactions',
    title: 'Sagas Pattern: Distributed Transactions without 2PC',
    difficulty: 'Advanced',
    summary: 'Managing distributed transactions across multiple microservice databases without locking resources.',
    problem: 'Two-Phase Commit (2PC) requires synchronous distributed locks, making it a performance bottleneck and single point of failure at scale.',
    solution: 'A Saga is a sequence of local transactions. Each transaction updates its local database and publishes an event. If a step fails, compensating transactions are executed backwards.',
    tradeoffs: [
      'Choreography Saga: Simple, decentralized, but hard to trace and debug event loops.',
      'Orchestration Saga: Central orchestrator (e.g. AWS Step Functions), easy to monitor, but adds central component.'
    ],
    awsImplementation: 'AWS Step Functions (State Machine Orchestrator) coordinated with Amazon EventBridge and SQS.',
    napkinMath: 'Recovery time: Compensating refund transaction takes ~80ms to propagate asynchronously.'
  },
  {
    id: 'caching',
    module: 'Scaling',
    title: 'Distributed Caching Topologies & Cache Stampede',
    difficulty: 'Intermediate',
    summary: 'High-speed in-memory data tiers using Redis and mitigating cache stampede / thundering herd.',
    problem: 'When a popular cache key expires during high traffic, thousands of concurrent requests hit the database simultaneously, knocking it offline.',
    solution: 'Implement Cache-Aside with probabilistic early expiration (XFetch algorithm), distributed mutex locking (Redlock), and TTL jitter.',
    tradeoffs: [
      'Cache-Aside: Lazy loading, DB load only on miss, but risk of stale data.',
      'Write-Through: Data always fresh, but write latency penalty on every update.'
    ],
    awsImplementation: 'Amazon ElastiCache Redis Cluster with Multi-AZ replication and Redis auto-failover.',
    napkinMath: 'Redis delivers ~100,000 QPS per node at <1ms latency compared to ~3,000 QPS on a relational DB node.'
  },
  {
    id: 'sharding',
    module: 'Storage',
    title: 'Database Sharding & Consistent Hashing',
    difficulty: 'Advanced',
    summary: 'Partitioning massive datasets horizontally across multiple database nodes using hash rings.',
    problem: 'A single database machine runs out of disk IOPS and storage capacity when rows exceed hundreds of millions.',
    solution: 'Consistent Hashing places nodes and keys on a 360-degree hash ring. Adding or removing a server only remaps K/N keys rather than all keys.',
    tradeoffs: [
      'Range-based Sharding: Great for range queries, but creates hot partitions.',
      'Hash-based Sharding: Even distribution, but range queries require scatter-gather across all shards.'
    ],
    awsImplementation: 'Amazon DynamoDB internal partition management or Vitess / Citus on Amazon Aurora.',
    napkinMath: 'Adding a 10th node in simple modulo hashing remaps ~90% of keys. Consistent hashing remaps only 10%.'
  },
  {
    id: 'messaging',
    module: 'Communication',
    title: 'Message Queues (SQS) vs Event Streams (Kafka/Kinesis)',
    difficulty: 'Intermediate',
    summary: 'Choosing between point-to-point task queues and append-only distributed event logs.',
    problem: 'Coupling producer speed to consumer capacity results in cascading service crashes when downstream systems slow down.',
    solution: 'Use Message Queues (SQS) for job distribution where each message is consumed once and deleted. Use Event Streams (Kafka/Kinesis) for replayable multi-subscriber events.',
    tradeoffs: [
      'Queues (SQS): Simple, automatic retry and DLQ, message discarded after ack.',
      'Streams (Kafka): Message ordered by partition key, replayable history, supports multiple independent consumer groups.'
    ],
    awsImplementation: 'Amazon SQS for background async jobs; Amazon Managed Streaming for Apache Kafka (MSK) for event-driven telemetry.',
    napkinMath: 'SQS handles virtually unlimited throughput. Standard queues guarantee at-least-once delivery.'
  },
  {
    id: 'rate_limiting',
    module: 'Reliability',
    title: 'Distributed Rate Limiting Algorithms',
    difficulty: 'Intermediate',
    summary: 'Protecting microservices from DDoS and noisy neighbors using Token Bucket and Leaky Bucket.',
    problem: 'Unrestricted API access allows rogue clients or scrapers to exhaust server threads and CPU.',
    solution: 'Token Bucket algorithm stores tokens in Redis. Each request consumes one token; tokens regenerate at a fixed rate r.',
    tradeoffs: [
      'Token Bucket: Allows bursts up to capacity b, memory efficient.',
      'Sliding Window Log: 100% accurate, but high memory footprint storing timestamps.'
    ],
    awsImplementation: 'AWS WAF rate-based rules at CloudFront, or Amazon API Gateway Usage Plans with API keys.',
    napkinMath: 'Redis atomic Lua script executes Token Bucket check in ~0.5ms with zero race conditions.'
  }
];
