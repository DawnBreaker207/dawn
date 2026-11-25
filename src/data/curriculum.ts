export interface Track {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  moduleIds: string[];
}

export const CURRICULUM_TRACKS: Track[] = [
  {
    id: 'architecture',
    title: 'Blog Deployment Architecture',
    subtitle: 'Cloudflare Edge-First, C4 Container Model & Zero-Trust DB',
    emoji: '🏛️',
    moduleIds: ['architecture'],
  },
  {
    id: 'git',
    title: 'Git Deep Internals & Practical Case Resolver',
    subtitle: '4 Git Zones, DAG Objects, branching models, worktrees, 3-way diff3 & agent surgery cases',
    emoji: '🐙',
    moduleIds: ['git-core', 'git-cases'],
  },
  {
    id: 'network-scale',
    title: 'Network & Web Scale',
    subtitle: 'Request lifecycle, latency, DNS, TCP/TLS, load balancing & edge scaling',
    emoji: '🌐',
    moduleIds: ['foundations', 'scaling'],
  },
  {
    id: 'storage-tier',
    title: 'Database & Storage Tier',
    subtitle: 'SQL vs NoSQL, B-Trees, LSM engines, query planner, and transactions',
    emoji: '🗄️',
    moduleIds: ['storage'],
  },
  {
    id: 'angular',
    title: 'Angular Core Architecture & Modern Mechanics',
    subtitle: 'Component Lifecycle, Standalone, DI, Interceptors, Router, Ivy, Signals DAG & Hydration',
    emoji: '🅰️',
    moduleIds: ['angular-core', 'angular-reactivity', 'angular-modern'],
  },
  {
    id: 'java-runtime',
    title: 'Java Runtime & Concurrency Engine',
    subtitle: 'JVM Memory, Loom virtual threads, monitors, async pipelines & Spring framework',
    emoji: '☕',
    moduleIds: ['java-runtime', 'java-enterprise'],
  },
  {
    id: 'devops',
    title: 'DevOps Engineering & Progressive Delivery',
    subtitle: 'DevOps culture, Tool evolution, CI quality gates, CD canary releases, GitOps & DORA metrics',
    emoji: '🚀',
    moduleIds: ['devops-core', 'devops-delivery'],
  },
  {
    id: 'k8s',
    title: 'Containers & Kubernetes Orchestration',
    subtitle: 'Docker internals, Cgroups, K8s Pods, CNI networking, CSI storage & HPA',
    emoji: '☸️',
    moduleIds: ['k8s'],
  },
  {
    id: 'distributed',
    title: 'Distributed Systems Core',
    subtitle: 'Replication, sharding, consistent hashing, distributed IDs, CAP & Raft consensus',
    emoji: '⚖️',
    moduleIds: ['distributed'],
  },
  {
    id: 'microservices',
    title: 'Microservices & Event-Driven',
    subtitle: 'Service discovery, APIs, Kafka pub/sub, message queues, and sagas',
    emoji: '🧩',
    moduleIds: ['microservices', 'communication'],
  },
  {
    id: 'cloud-aws',
    title: 'AWS Cloud Architecture (SAA-C03)',
    subtitle: 'VPC topology, Multi-AZ high availability, S3 object storage & serverless systems',
    emoji: '☁️',
    moduleIds: ['cloud'],
  },
  {
    id: 'system-design',
    title: 'System Design & AI Agents',
    subtitle: 'HLD/LLD, TinyURL, News Feed, Chat, AI Agent Architecture, rate limiting & tracing',
    emoji: '📐',
    moduleIds: ['system-design', 'reliability'],
  },
  {
    id: 'devsecops',
    title: 'Security, Cryptography & DevSecOps',
    subtitle: 'Authentication, OAuth2, RBAC, Data Encryption, Secrets Management & CI/CD Pipelines',
    emoji: '🔒',
    moduleIds: ['security', 'shipping'],
  },
];


export interface Lesson {
  id: string;
  title: string;
  badge?: string;
  section?: string;
}

export interface Module {
  id: string;
  num: string;
  title: string;
  trackId: string;
  color: string;
  lessons: Lesson[];
}

export const CURRICULUM_MODULES: Module[] = [
  {
    id: 'architecture',
    num: '01',
    title: 'Blog Deployment Architecture',
    trackId: 'architecture',
    color: 'emerald',
    lessons: [
      { id: 'architecture', title: 'Dawn Blog Architecture & Data Plane' },
    ],
  },
  {
    id: 'foundations',
    num: '01',
    title: 'Network Foundations',
    trackId: 'network-scale',
    color: 'sand',
    lessons: [
      { id: 'request-lifecycle', title: 'How a Request Travels' },
      { id: 'latency-throughput', title: 'Latency & Throughput' },
      { id: 'napkin-math', title: 'Napkin Math' },
      { id: 'tcp-internals', title: 'TCP Handshake, Flow & Congestion Control' },
      { id: 'tls-handshake', title: 'TLS 1.3 Handshake & Cryptographic Zero-RTT' },
      { id: 'http-evolution', title: 'HTTP/1.1 vs HTTP/2 Multiplexing vs HTTP/3 QUIC' },
      { id: 'dns-anycast', title: 'DNS Resolution, Anycast Routing & GeoDNS' },
    ],
  },
  {
    id: 'scaling',
    num: '02',
    title: 'Scaling & Traffic',
    trackId: 'network-scale',
    color: 'green',
    lessons: [
      { id: 'vertical-horizontal', title: 'Vertical vs Horizontal' },
      { id: 'load-balancing', title: 'Load Balancing (L4 / L7)' },
      { id: 'stateless', title: 'Stateless Services' },
      { id: 'caching', title: 'Caching' },
      { id: 'cdn', title: 'Content Delivery (CDN)' },
      { id: 'websocket-realtime-protocols', title: 'WebSockets, SSE & Real-Time Connection Scaling' },
      { id: 'reverse-proxy-l4-l7', title: 'L4 vs L7 Reverse Proxy & Envoy Topology' },
      { id: 'network-security-ddos', title: 'DDoS Mitigation, SYN Cookies & Anycast Scrubbing' },
    ],
  },
  {
    id: 'storage',
    num: '01',
    title: 'Database & Storage Tier',
    trackId: 'storage-tier',
    color: 'violet',
    lessons: [
      { id: 'sql-engine', title: 'PostgreSQL Query Engine, EXPLAIN & Tuning', section: 'Query Planning & Optimization' },
      { id: 'sql-execution-order', title: '7-Step SQL Execution Order & NULL Logic', section: 'Query Planning & Optimization' },
      { id: 'sql-complex-queries', title: 'Complex SQL: UNION, Subquery, 20+ Joins & Temporal', section: 'Query Planning & Optimization' },
      { id: 'indexes', title: 'Indexes: B-Tree, GIN, BRIN & Partial', section: 'Query Planning & Optimization' },
      { id: 'sql-connection-pool', title: 'Connection Pooling & PgBouncer', section: 'Query Planning & Optimization' },
      { id: 'storage-engines', title: 'Storage Engines (LSM vs B-Tree)', section: 'Storage Engines & Transactions' },
      { id: 'sql-footprint', title: 'Page Layout & Storage Footprint', section: 'Storage Engines & Transactions' },
      { id: 'sql-nosql', title: 'SQL vs NoSQL Architecture', section: 'Storage Engines & Transactions' },
      { id: 'transactions', title: 'Transactions, MVCC Internals & Locking', section: 'Storage Engines & Transactions' },
      { id: 'mysql-innodb', title: 'MySQL InnoDB Internals vs PostgreSQL', section: 'Storage Engines & Transactions' },
      { id: 'redis-event-loop', title: 'Redis Single-Threaded Event Loop & I/O Multiplexing', section: 'Redis In-Memory Engine' },
      { id: 'redis-data-structures', title: 'Redis Memory Encodings: SDS, Dict & Listpack', section: 'Redis In-Memory Engine' },
      { id: 'redis-sorted-sets', title: 'Redis Sorted Sets (ZSET) & SkipList Architecture', section: 'Redis In-Memory Engine' },
      { id: 'redis-persistence-rdb-aof', title: 'Redis Persistence: RDB Snapshots & AOF Logging', section: 'Redis In-Memory Engine' },
      { id: 'redis-memory-eviction', title: 'Redis Memory Eviction & Approximated LRU/LFU', section: 'Redis In-Memory Engine' },
      { id: 'redis-cluster-sharding', title: 'Redis Cluster: 16384 Hash Slots & Gossip Protocol', section: 'Redis In-Memory Engine' },
    ],
  },
  {
    id: 'distributed',
    num: '01',
    title: 'Distributed Systems Core',
    trackId: 'distributed',
    color: 'cyan',
    lessons: [
      { id: 'replication', title: 'Replication' },
      { id: 'sharding', title: 'Sharding & Partitioning' },
      { id: 'consistent-hashing', title: 'Consistent Hashing' },
      { id: 'unique-ids', title: 'Unique IDs at Scale (Snowflake)' },
      { id: 'cap', title: 'CAP & PACELC Theorem' },
      { id: 'consensus', title: 'Consensus & Raft Leader Election' },
    ],
  },
  {
    id: 'microservices',
    num: '01',
    title: 'Microservices Architecture',
    trackId: 'microservices',
    color: 'teal',
    lessons: [
      { id: 'microservices', title: 'Monolith vs Microservices' },
      { id: 'service-discovery', title: 'Service Discovery & API Gateway' },
      { id: 'sagas', title: 'Sagas & Distributed Transactions' },
    ],
  },
  {
    id: 'java-runtime',
    num: '01',
    title: 'Java Runtime & Concurrency Engine',
    trackId: 'java-runtime',
    color: 'sky',
    lessons: [
      { id: 'java-types-boxing', title: 'Types, Boxing & Generics', section: 'Java Core & Type System' },
      { id: 'java-string-internals', title: 'String Pool & Compact Strings', section: 'Java Core & Type System' },
      { id: 'java-collections', title: 'HashMap & ConcurrentHashMap', section: 'Java Core & Type System' },
      { id: 'java-lambda', title: 'Lambda & Lazy Streams', section: 'Java Core & Type System' },
      { id: 'java-core-apis', title: 'Modern Java & Core APIs', section: 'Java Core & Type System' },
      { id: 'java-io-nio', title: 'I/O, NIO.2 & Selector', section: 'I/O, NIO & JDBC' },
      { id: 'java-jdbc', title: 'JDBC Pool, TX & Batching', section: 'I/O, NIO & JDBC' },
      { id: 'java-metaprogramming', title: 'Exceptions, Reflection & Proxy', section: 'JVM Internals & Concurrency' },
      { id: 'java-classloader', title: 'ClassLoader, Bytecode & HotSpot JIT', section: 'JVM Internals & Concurrency' },
      { id: 'java-jvm-memory', title: 'JVM Memory, GC & Refs', section: 'JVM Internals & Concurrency' },
      { id: 'java-jmm-cas-aqs', title: 'Monitors, JMM, CAS & AQS', section: 'JVM Internals & Concurrency' },
      { id: 'java-virtual-threads', title: 'Pools, ThreadLocal & Loom', section: 'JVM Internals & Concurrency' },
    ],
  },
  {
    id: 'java-enterprise',
    num: '02',
    title: 'Spring Framework & Enterprise Architecture',
    trackId: 'java-runtime',
    color: 'indigo',
    lessons: [
      { id: 'java-spring-ioc', title: 'Spring IoC & Boot Auto-Config', section: 'Spring Core & Boot' },
      { id: 'java-spring-aop', title: 'Spring AOP, @Transactional, @Async & Cache', section: 'Spring Core & Boot' },
      { id: 'java-spring-mvc', title: 'Spring MVC, Loom & WebFlux', section: 'Spring Core & Boot' },
      { id: 'java-spring-jpa', title: 'JPA Context, N+1 & Locking', section: 'Persistence & Events' },
      { id: 'java-spring-security', title: 'Spring Security & OAuth2', section: 'Security & Ops' },
      { id: 'java-spring-actuator-testing', title: 'Actuator & Test Context Cache', section: 'Security & Ops' },
    ],
  },
  {
    id: 'k8s',
    num: '01',
    title: 'Containers & Kubernetes Orchestration',
    trackId: 'k8s',
    color: 'sky',
    lessons: [
      { id: 'docker-internals', title: 'Linux Namespaces, Cgroups & Runtime', section: 'Linux Containers & Storage' },
      { id: 'docker-images-storage', title: 'UnionFS & OverlayFS Storage', section: 'Linux Containers & Storage' },
      { id: 'k8s-control-plane', title: 'Control Plane: API Server, etcd & Raft', section: 'Control Plane & Nodes' },
      { id: 'k8s-worker-node', title: 'Worker Nodes: Kubelet, CRI & Probes', section: 'Control Plane & Nodes' },
      { id: 'k8s-networking-cni', title: 'Flat Pod Network, CNI & Kube-Proxy', section: 'Pod Networking & Services Ingress' },
      { id: 'k8s-services-ingress', title: 'Services, Ingress & Gateway API', section: 'Pod Networking & Services Ingress' },
      { id: 'k8s-storage-csi', title: 'Persistent Storage, PVC & CSI Driver', section: 'Persistent Storage & Autoscaling' },
      { id: 'k8s-autoscaling-hpa', title: 'Autoscaling: HPA, VPA & Karpenter', section: 'Persistent Storage & Autoscaling' },
    ],
  },
  {
    id: 'communication',
    num: '02',
    title: 'Event-Driven & Messaging',
    trackId: 'microservices',
    color: 'orange',
    lessons: [
      { id: 'apis', title: 'REST, gRPC & GraphQL', section: 'Distributed Messaging Patterns' },
      { id: 'queues', title: 'Message Queues (SQS / RabbitMQ)', section: 'Distributed Messaging Patterns' },
      { id: 'pubsub', title: 'Pub/Sub & Event Streams (Kafka)', section: 'Distributed Messaging Patterns' },
      { id: 'realtime', title: 'Real-time Updates (WebSockets / SSE)', section: 'Distributed Messaging Patterns' },
      { id: 'kafka-cluster-kraft', title: 'Apache Kafka Architecture & KRaft Metadata Quorum', section: 'Apache Kafka Core Engine' },
      { id: 'kafka-storage-engine', title: 'Kafka Storage Engine: Append-Only Log & PageCache', section: 'Apache Kafka Core Engine' },
      { id: 'kafka-replication-isr', title: 'Kafka Replication, ISR & High Watermark Protocol', section: 'Apache Kafka Core Engine' },
      { id: 'rabbitmq-amqp-model', title: 'RabbitMQ Core Model: AMQP 0-9-1 & Message Routing', section: 'RabbitMQ Broker & AMQP' },
      { id: 'rabbitmq-exchanges-routing', title: 'RabbitMQ Exchange Types: Direct, Fanout, Topic & Headers', section: 'RabbitMQ Broker & AMQP' },
      { id: 'rabbitmq-reliability-dlx', title: 'RabbitMQ Reliability: Publisher Confirms & Dead Letter Exchanges', section: 'RabbitMQ Broker & AMQP' },
    ],
  },
  {
    id: 'reliability',
    num: '01',
    title: 'Reliability & Resilience',
    trackId: 'system-design',
    color: 'blue',
    lessons: [
      { id: 'redundancy', title: 'Redundancy & Multi-AZ Failover' },
      { id: 'rate-limiting', title: 'Rate Limiting' },
      { id: 'timeouts-retries', title: 'Timeouts, Retries & Circuit Breakers' },
      { id: 'observability', title: 'Observability & Distributed Tracing' },
    ],
  },
  {
    id: 'system-design',
    num: '02',
    title: 'System Design Case Studies',
    trackId: 'system-design',
    color: 'slate',
    lessons: [
      { id: 'ai-agent-architecture', title: 'Modern AI Agent Architecture (Onion Model)' },
      { id: 'hld-lld', title: 'High-Level & Low-Level Design (HLD/LLD)' },
      { id: 'design-url-shortener', title: 'Design a URL Shortener (TinyURL)' },
      { id: 'design-news-feed', title: 'Design a News Feed' },
      { id: 'design-chat', title: 'Design a Chat System' },
      { id: 'batch-stream', title: 'Batch & Stream Processing' },
    ],
  },
  {
    id: 'cloud',
    num: '01',
    title: 'AWS Cloud Architecture (SAA-C03)',
    trackId: 'cloud-aws',
    color: 'amber',
    lessons: [
      { id: 'aws-cloud', title: 'AWS Multi-AZ Resilience', section: 'Core VPC, HA & Storage' },
      { id: 'aws-vpc', title: 'AWS VPC & Network Security', section: 'Core VPC, HA & Storage' },
      { id: 'aws-hybrid-network', title: 'VPC Endpoints, Transit GW, VPN & Direct Connect', section: 'Core VPC, HA & Storage' },
      { id: 'aws-ha', title: 'High Availability & Auto Scaling', section: 'Core VPC, HA & Storage' },
      { id: 'aws-storage-db', title: 'AWS Storage & Database Tiering', section: 'Core VPC, HA & Storage' },
      { id: 'files', title: 'Files & Object Storage (S3)', section: 'Core VPC, HA & Storage' },
      { id: 'aws-serverless', title: 'Decoupled & Serverless Systems', section: 'Security, Compute & Serverless' },
      { id: 'aws-iam-kms', title: 'IAM, STS AssumeRole, SCPs & KMS Encryption', section: 'Security, Compute & Serverless' },
      { id: 'aws-edge-security', title: 'Edge Security: CloudFront OAC, WAF, Shield & GuardDuty', section: 'Security, Compute & Serverless' },
      { id: 'aws-compute-migration', title: 'Compute Pricing, LB Tiers, DR (RTO/RPO) & Migration', section: 'Security, Compute & Serverless' },
    ],
  },
  {
    id: 'security',
    num: '01',
    title: 'Security & Secrets',
    trackId: 'devsecops',
    color: 'rose',
    lessons: [
      { id: 'authentication', title: 'Authentication' },
      { id: 'authorization', title: 'Authorization' },
      { id: 'encryption', title: 'Encryption & Secrets' },
    ],
  },
  {
    id: 'shipping',
    num: '02',
    title: 'DevOps & CI/CD',
    trackId: 'devsecops',
    color: 'olive',
    lessons: [
      { id: 'testing', title: 'Testing' },
      { id: 'cicd', title: 'CI/CD & Deployments' },
    ],
  },
  {
    id: 'git-core',
    num: '01',
    title: 'Git Core Architecture & 4 Zones',
    trackId: 'git',
    color: 'orange',
    lessons: [
      { id: 'git-environments-lifecycle', title: '4 Git Zones: Working Dir to Remote Push', section: 'Architecture & Command Taxonomy' },
      { id: 'git-commands-taxonomy', title: 'Git Command Taxonomy & State Transitions', section: 'Architecture & Command Taxonomy' },
      { id: 'git-branching-workflows', title: 'Git Branching Models: Git Flow, GitHub Flow & Trunk-Based', section: 'Branching & Data Structures' },
      { id: 'git-dag-objects', title: '4 Immutable Objects: Blob, Tree, Commit & Tag', section: 'Branching & Data Structures' },
      { id: 'git-refs-symbolic', title: 'Refs, HEAD Symbolic Pointer & Packed-Refs', section: 'Branching & Data Structures' },
    ],
  },
  {
    id: 'git-cases',
    num: '02',
    title: 'Git Real-World Gnarly Cases & Agent Scenarios',
    trackId: 'git',
    color: 'rose',
    lessons: [
      { id: 'git-detached-head-reflog', title: 'Case 1: Detached HEAD & Reflog Rescue', section: 'Real-World Tree Surgery' },
      { id: 'git-worktrees-concurrency', title: 'Case 2: Multi-Agent Parallelism with Git Worktrees', section: 'Real-World Tree Surgery' },
      { id: 'git-three-way-diff3', title: 'Case 3: 3-Way Merge Conflicts & Diff3 Topology', section: 'Real-World Tree Surgery' },
      { id: 'git-rerere-engine', title: 'Case 4: git rerere in Long-Running Rebase Hell', section: 'Real-World Tree Surgery' },
      { id: 'git-rebase-onto-surgery', title: 'Case 5: Rebase --onto History Splicing', section: 'Edge Case Troubleshooting' },
      { id: 'git-crlf-line-endings', title: 'Case 6: CRLF vs LF Normalization Disaster', section: 'Edge Case Troubleshooting' },
      { id: 'git-index-lock-stash', title: 'Case 7: Ghost index.lock & Aborted Stash Pop', section: 'Edge Case Troubleshooting' },
      { id: 'git-bisect-automation', title: 'Case 8: Automated Regression Hunting with git bisect run', section: 'Edge Case Troubleshooting' },
      { id: 'git-submodule-subtree', title: 'Case 9: Git Submodule vs Git Subtree in Monorepos', section: 'Edge Case Troubleshooting' },
    ],
  },
  {
    id: 'angular-core',
    num: '01',
    title: 'Angular Core Building Blocks',
    trackId: 'angular',
    color: 'red',
    lessons: [
      { id: 'angular-flow', title: 'Angular End-to-End Flow', section: 'Core Building Blocks' },
      { id: 'angular-architecture-overview', title: 'Bootstrap & Component Tree', section: 'Core Building Blocks' },
      { id: 'angular-component-lifecycle', title: 'Component Lifecycle Hooks', section: 'Core Building Blocks' },
      { id: 'angular-services-di', title: 'Hierarchical DI & inject()', section: 'HTTP & Routing Infrastructure' },
      { id: 'angular-router-pipeline', title: 'Router, Guards & Resolvers', section: 'HTTP & Routing Infrastructure' },
      { id: 'angular-http-interceptors', title: 'HTTP Interceptors & Cloning', section: 'HTTP & Routing Infrastructure' },
      { id: 'angular-reactive-forms', title: 'Reactive Forms & CVA', section: 'HTTP & Routing Infrastructure' },
    ],
  },
  {
    id: 'angular-reactivity',
    num: '02',
    title: 'Angular Reactivity, Ivy & Performance Engine',
    trackId: 'angular',
    color: 'pink',
    lessons: [
      { id: 'angular-ivy-incremental-dom', title: 'Ivy Incremental DOM vs VDOM', section: 'Compilation & Change Detection' },
      { id: 'angular-zonejs-dirty-checking', title: 'Zone.js, OnPush & Zoneless', section: 'Compilation & Change Detection' },
      { id: 'angular-rxjs-reactivity', title: 'RxJS Pipes & Flattening Maps', section: 'Fine-Grained Reactivity' },
      { id: 'angular-signals-dag', title: 'Signals & Push-Pull DAG', section: 'Fine-Grained Reactivity' },
      { id: 'angular-ngrx-state', title: 'NgRx Store vs SignalStore', section: 'Fine-Grained Reactivity' },
    ],
  },
  {
    id: 'angular-modern',
    num: '03',
    title: 'Angular Modern Template Ergonomics & Hydration',
    trackId: 'angular',
    color: 'amber',
    lessons: [
      { id: 'angular-control-flow', title: 'Control Flow, @defer & Pipes', section: 'Modern Templates & SSR' },
      { id: 'angular-hydration-replay', title: 'SSR Hydration & Event Replay', section: 'Modern Templates & SSR' },
    ],
  },
  {
    id: 'devops-core',
    num: '01',
    title: 'DevOps Philosophy & Continuous Integration',
    trackId: 'devops',
    color: 'blue',
    lessons: [
      { id: 'devops-culture-silos', title: 'DevOps Culture & CAMS Model', section: 'Culture & Pipeline Foundations' },
      { id: 'cicd-tools-evolution', title: 'CI/CD Toolchain Evolution', section: 'Culture & Pipeline Foundations' },
      { id: 'cicd-pipeline-internals', title: 'Pipeline Runner Internals', section: 'Quality Gates & Automation' },
    ],
  },
  {
    id: 'devops-delivery',
    num: '02',
    title: 'Continuous Delivery, GitOps & SRE',
    trackId: 'devops',
    color: 'indigo',
    lessons: [
      { id: 'gitops-argocd', title: 'GitOps Reconciliation Loop', section: 'Progressive Delivery & SRE' },
      { id: 'devops-dora-metrics', title: 'DORA Metrics & SRE Budgets', section: 'Progressive Delivery & SRE' },
    ],
  },
];

export function getLessonHref(id: string): string {
  if (id === 'architecture') return '/lab/architecture';
  if (id === 'sql' || id === 'sql-engine') return '/lab/sql';
  if (id === 'java' || id === 'java-types-boxing') return '/lab/java';
  if (id === 'request-lifecycle' || id === 'foundations') return '/lab/foundations';
  if (id === 'consistent-hashing' || id === 'distributed') return '/lab/distributed';
  if (id === 'microservices') return '/lab/microservices';
  if (id === 'k8s' || id === 'docker-internals') return '/lab/k8s';
  if (id === 'hld-lld' || id === 'system-design') return '/lab/system-design';
  if (id === 'aws-cloud') return '/lab/aws-cloud';
  if (id === 'git' || id === 'git-environments-lifecycle') return '/lab/git';
  if (id === 'angular' || id === 'angular-flow') return '/lab/angular';
  if (id === 'devops' || id === 'devops-culture-silos') return '/lab/devops';
  return `/lab/${id}`;
}

export function getNextLessonInTrack(lessonId: string, trackId?: string): { id: string; title: string; href: string } | null {
  // Find all lessons in this track (or all lessons if no track)
  const targetModules = trackId ? CURRICULUM_MODULES.filter((m) => m.trackId === trackId) : CURRICULUM_MODULES;
  const allLessons = targetModules.flatMap((m) => m.lessons);
  const curIdx = allLessons.findIndex((l) => l.id === lessonId);
  if (curIdx !== -1 && curIdx + 1 < allLessons.length) {
    const next = allLessons[curIdx + 1];
    return { id: next.id, title: next.title, href: getLessonHref(next.id) };
  }
  // If track ended, check global next lesson in curriculum
  const globalLessons = CURRICULUM_MODULES.flatMap((m) => m.lessons);
  const gIdx = globalLessons.findIndex((l) => l.id === lessonId);
  if (gIdx !== -1 && gIdx + 1 < globalLessons.length) {
    const next = globalLessons[gIdx + 1];
    return { id: next.id, title: next.title, href: getLessonHref(next.id) };
  }
  return null;
}

