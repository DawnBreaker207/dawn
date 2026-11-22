export interface Track {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  moduleIds: string[];
}

export const DTS_TRACKS: Track[] = [
  {
    id: 'architecture',
    title: '0. Blog Deployment Architecture',
    subtitle: 'Cloudflare Edge-First, C4 Container Model & Zero-Trust DB',
    emoji: '🏛️',
    moduleIds: ['architecture'],
  },
  {
    id: 'network-scale',
    title: '1. Network & Web Scale',
    subtitle: 'Request lifecycle, latency, DNS, TCP/TLS, load balancing & edge scaling',
    emoji: '🌐',
    moduleIds: ['foundations', 'scaling'],
  },
  {
    id: 'storage-tier',
    title: '2. Database & Storage Tier',
    subtitle: 'SQL vs NoSQL, B-Trees, LSM engines, query planner, and transactions',
    emoji: '🗄️',
    moduleIds: ['storage'],
  },
  {
    id: 'distributed',
    title: '3. Distributed Systems Core',
    subtitle: 'Replication, sharding, consistent hashing, distributed IDs, CAP & Raft consensus',
    emoji: '⚖️',
    moduleIds: ['distributed'],
  },
  {
    id: 'microservices',
    title: '4. Microservices & Event-Driven',
    subtitle: 'Service discovery, APIs, Kafka pub/sub, message queues, and sagas',
    emoji: '🧩',
    moduleIds: ['microservices', 'communication'],
  },
  {
    id: 'k8s',
    title: '5. Containers & Kubernetes Orchestration',
    subtitle: 'Docker internals, Cgroups, K8s Pods, CNI networking, CSI storage & HPA',
    emoji: '☸️',
    moduleIds: ['k8s'],
  },
  {
    id: 'java-runtime',
    title: '6. Java Runtime & Concurrency Engine',
    subtitle: 'JVM Memory, Loom virtual threads, monitors, async pipelines & Spring framework',
    emoji: '☕',
    moduleIds: ['java-runtime', 'java-enterprise'],
  },
  {
    id: 'system-design',
    title: '7. System Design & AI Agents',
    subtitle: 'HLD/LLD, TinyURL, News Feed, Chat, AI Agent Architecture, rate limiting & tracing',
    emoji: '📐',
    moduleIds: ['system-design', 'reliability'],
  },
  {
    id: 'cloud-aws',
    title: '8. AWS Cloud Architecture (SAA-C03)',
    subtitle: 'VPC topology, Multi-AZ high availability, S3 object storage & serverless systems',
    emoji: '☁️',
    moduleIds: ['cloud'],
  },
  {
    id: 'devsecops',
    title: '9. DevSecOps & Security',
    subtitle: 'Authentication, authorization, encryption, testing & CI/CD pipelines',
    emoji: '🛡️',
    moduleIds: ['security', 'shipping'],
  },
];


export interface Lesson {
  id: string;
  title: string;
  badge?: string;
}

export interface Module {
  id: string;
  num: string;
  title: string;
  trackId: string;
  color: string;
  lessons: Lesson[];
}

export const DTS_MODULES: Module[] = [
  {
    id: 'architecture',
    num: '00',
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
    num: '03',
    title: 'Database & Storage Tier',
    trackId: 'storage-tier',
    color: 'violet',
    lessons: [
      { id: 'sql-engine', title: 'PostgreSQL Query Planner & Engine' },
      { id: 'sql-explain', title: 'EXPLAIN & Query Cost Estimation' },
      { id: 'indexes', title: 'Indexes & B-Trees' },
      { id: 'storage-engines', title: 'Storage Engines (LSM vs B-Tree)' },
      { id: 'sql-footprint', title: 'Page Layout & Storage Footprint' },
      { id: 'sql-nosql', title: 'SQL vs NoSQL Architecture' },
      { id: 'sql-connection-pool', title: 'Connection Pooling & PgBouncer' },
      { id: 'transactions', title: 'Transactions & MVCC Isolation Levels' },
      { id: 'redis-event-loop', title: 'Redis Single-Threaded Event Loop & I/O Multiplexing' },
      { id: 'redis-data-structures', title: 'Redis Memory Encodings: SDS, Dict & Listpack' },
      { id: 'redis-sorted-sets', title: 'Redis Sorted Sets (ZSET) & SkipList Architecture' },
      { id: 'redis-persistence-rdb-aof', title: 'Redis Persistence: RDB Snapshots & AOF Logging' },
      { id: 'redis-memory-eviction', title: 'Redis Memory Eviction & Approximated LRU/LFU' },
      { id: 'redis-cluster-sharding', title: 'Redis Cluster: 16384 Hash Slots & Gossip Protocol' },
    ],
  },
  {
    id: 'distributed',
    num: '04',
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
    num: '05',
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
    num: '05B',
    title: 'Java Runtime & Concurrency Engine',
    trackId: 'java-runtime',
    color: 'sky',
    lessons: [
      { id: 'java-concurrency', title: 'Threads, Monitors & Synchronized' },
      { id: 'java-executors', title: 'Thread Pools & WorkStealingPool' },
      { id: 'java-completable', title: 'CompletableFuture & Async Pipelines' },
      { id: 'java-virtual-threads', title: 'Virtual Threads & Project Loom (JDK 21)' },
      { id: 'java-jvm-memory', title: 'JVM Memory Model, GC & Metaspace' },
      { id: 'java-string-pool', title: 'String Pool & Interning Architecture' },
      { id: 'java-jit-compiler', title: 'HotSpot JIT & Tiered Compilation' },
      { id: 'java-collections', title: 'Collections Internals & Hash Bins' },
      { id: 'java-streams', title: 'Lazy Stream Pipelines & Short-circuiting' },
      { id: 'java-lambda', title: 'Lambda Expressions & invokedynamic' },
      { id: 'java-io-nio', title: 'Java I/O, NIO & Channel Multiplexing' },
      { id: 'java-generics', title: 'Generics, Type Erasure & Wildcards' },
      { id: 'java-exceptions-errors', title: 'Exception Tables & OutOfMemoryError' },
      { id: 'java-metaprogramming', title: 'Reflection, Annotations & Dynamic Proxies' },
      { id: 'java-modern', title: 'Modern Java: Records, Sealed Classes & Pattern Matching' },
    ],
  },
  {
    id: 'java-enterprise',
    num: '05C',
    title: 'Spring Framework & Enterprise Architecture',
    trackId: 'java-runtime',
    color: 'indigo',
    lessons: [
      { id: 'java-spring-ioc', title: 'Spring IoC Container & Bean Lifecycle' },
      { id: 'java-spring-scopes', title: 'Bean Scopes & Scoped Proxies' },
      { id: 'java-spring-aop', title: 'Spring AOP & Proxy Architecture' },
      { id: 'java-spring-mvc', title: 'Spring MVC Architecture & Request Pipeline' },
      { id: 'java-spring-tx', title: 'Declarative Transactions & @Transactional' },
      { id: 'java-spring-jpa', title: 'Spring Data JPA, Hibernate & N+1 Patterns' },
      { id: 'java-spring-security', title: 'Spring Security & Filter Chain Architecture' },
      { id: 'java-spring-boot-autoconfig', title: 'Spring Boot Auto-Configuration Engine' },
      { id: 'java-spring-testing', title: 'Spring Testing Architecture & Context Caching' },
      { id: 'java-spring-messaging', title: 'Spring Messaging & Event Architecture with Kafka' },
      { id: 'java-spring-config', title: 'Spring Configuration, Profiles & Property Hierarchy' },
    ],
  },
  {
    id: 'k8s',
    num: '05D',
    title: 'Containers & Kubernetes Orchestration',
    trackId: 'k8s',
    color: 'sky',
    lessons: [
      { id: 'docker-internals', title: 'Linux Namespaces, Cgroups & Runtime' },
      { id: 'docker-images-storage', title: 'UnionFS & OverlayFS Storage' },
      { id: 'k8s-control-plane', title: 'Control Plane: API Server, etcd & Raft' },
      { id: 'k8s-worker-node', title: 'Worker Nodes: Kubelet, CRI & Probes' },
      { id: 'k8s-networking-cni', title: 'Flat Pod Network, CNI & Kube-Proxy' },
      { id: 'k8s-services-ingress', title: 'Services, Ingress & Gateway API' },
      { id: 'k8s-storage-csi', title: 'Persistent Storage, PVC & CSI Driver' },
      { id: 'k8s-autoscaling-hpa', title: 'Autoscaling: HPA, VPA & Karpenter' },
    ],
  },
  {
    id: 'communication',
    num: '06',
    title: 'Event-Driven & Messaging',
    trackId: 'microservices',
    color: 'orange',
    lessons: [
      { id: 'apis', title: 'REST, gRPC & GraphQL' },
      { id: 'queues', title: 'Message Queues (SQS / RabbitMQ)' },
      { id: 'pubsub', title: 'Pub/Sub & Event Streams (Kafka)' },
      { id: 'realtime', title: 'Real-time Updates (WebSockets / SSE)' },
      { id: 'kafka-cluster-kraft', title: 'Apache Kafka Architecture & KRaft Metadata Quorum' },
      { id: 'kafka-storage-engine', title: 'Kafka Storage Engine: Append-Only Log & PageCache' },
      { id: 'kafka-replication-isr', title: 'Kafka Replication, ISR & High Watermark Protocol' },
      { id: 'rabbitmq-amqp-model', title: 'RabbitMQ Core Model: AMQP 0-9-1 & Message Routing' },
      { id: 'rabbitmq-exchanges-routing', title: 'RabbitMQ Exchange Types: Direct, Fanout, Topic & Headers' },
      { id: 'rabbitmq-reliability-dlx', title: 'RabbitMQ Reliability: Publisher Confirms & Dead Letter Exchanges' },
    ],
  },
  {
    id: 'reliability',
    num: '07',
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
    num: '08',
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
    num: '09',
    title: 'AWS Cloud Architecture (SAA-C03)',
    trackId: 'cloud-aws',
    color: 'amber',
    lessons: [
      { id: 'aws-cloud', title: 'AWS Multi-AZ Resilience' },
      { id: 'aws-vpc', title: 'AWS VPC & Network Security' },
      { id: 'aws-ha', title: 'High Availability & Auto Scaling' },
      { id: 'aws-storage-db', title: 'AWS Storage & Database Tiering' },
      { id: 'files', title: 'Files & Object Storage (S3)' },
      { id: 'aws-serverless', title: 'Decoupled & Serverless Systems' },
    ],
  },
  {
    id: 'security',
    num: '10',
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
    num: '11',
    title: 'DevOps & CI/CD',
    trackId: 'devsecops',
    color: 'olive',
    lessons: [
      { id: 'testing', title: 'Testing' },
      { id: 'cicd', title: 'CI/CD & Deployments' },
    ],
  },
];

export const CURRICULUM_TRACKS = DTS_TRACKS;
export const CURRICULUM_MODULES = DTS_MODULES;

export function getLessonHref(id: string): string {
  if (id === 'architecture') return '/lab/architecture';
  if (id === 'sql' || id === 'sql-engine') return '/lab/sql';
  if (id === 'java' || id === 'java-concurrency') return '/lab/java';
  if (id === 'request-lifecycle' || id === 'foundations') return '/lab/foundations';
  if (id === 'consistent-hashing' || id === 'distributed') return '/lab/distributed';
  if (id === 'microservices') return '/lab/microservices';
  if (id === 'k8s' || id === 'docker-internals') return '/lab/k8s';
  if (id === 'hld-lld' || id === 'system-design') return '/lab/system-design';
  if (id === 'aws-cloud') return '/lab/aws-cloud';
  return `/lab/${id}`;
}

export function getNextLessonInTrack(lessonId: string, trackId?: string): { id: string; title: string; href: string } | null {
  // Find all lessons in this track (or all lessons if no track)
  const targetModules = trackId ? DTS_MODULES.filter((m) => m.trackId === trackId) : DTS_MODULES;
  const allLessons = targetModules.flatMap((m) => m.lessons);
  const curIdx = allLessons.findIndex((l) => l.id === lessonId);
  if (curIdx !== -1 && curIdx + 1 < allLessons.length) {
    const next = allLessons[curIdx + 1];
    return { id: next.id, title: next.title, href: getLessonHref(next.id) };
  }
  // If track ended, check global next lesson in curriculum
  const globalLessons = DTS_MODULES.flatMap((m) => m.lessons);
  const gIdx = globalLessons.findIndex((l) => l.id === lessonId);
  if (gIdx !== -1 && gIdx + 1 < globalLessons.length) {
    const next = globalLessons[gIdx + 1];
    return { id: next.id, title: next.title, href: getLessonHref(next.id) };
  }
  return null;
}

