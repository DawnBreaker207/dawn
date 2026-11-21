export interface Track {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  moduleIds: string[];
}

export const DTS_TRACKS: Track[] = [
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
    subtitle: 'SQL vs NoSQL, B-Trees, LSM engines, query planner, transactions & object storage',
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
    subtitle: 'Service discovery, APIs, Kafka pub/sub, message queues, sagas & concurrency',
    emoji: '🧩',
    moduleIds: ['microservices', 'communication'],
  },
  {
    id: 'system-design',
    title: '5. System Design & Case Studies',
    subtitle: 'HLD/LLD, TinyURL, News Feed, Chat, rate limiting, redundancy & tracing',
    emoji: '📐',
    moduleIds: ['system-design', 'reliability'],
  },
  {
    id: 'cloud-aws',
    title: '6. AWS Cloud Architecture (SAA-C03)',
    subtitle: 'VPC topology, Multi-AZ high availability, storage tiering & serverless systems',
    emoji: '☁️',
    moduleIds: ['cloud'],
  },
  {
    id: 'devsecops',
    title: '7. DevSecOps & Security',
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
    id: 'foundations',
    num: '01',
    title: 'Network Foundations',
    trackId: 'network-scale',
    color: 'sand',
    lessons: [
      { id: 'request-lifecycle', title: 'How a Request Travels' },
      { id: 'latency-throughput', title: 'Latency & Throughput' },
      { id: 'napkin-math', title: 'Napkin Math' },
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
    ],
  },
  {
    id: 'storage',
    num: '03',
    title: 'Database & Storage Tier',
    trackId: 'storage-tier',
    color: 'violet',
    lessons: [
      { id: 'sql-nosql', title: 'SQL vs NoSQL' },
      { id: 'indexes', title: 'Indexes & B-Trees' },
      { id: 'storage-engines', title: 'Storage Engines (LSM vs B-Tree)' },
      { id: 'sql-engine', title: 'PostgreSQL Query Planner & Engine' },
      { id: 'transactions', title: 'Transactions & Isolation Levels' },
      { id: 'files', title: 'Files & Object Storage (S3)' },
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
      { id: 'java-concurrency', title: 'Java Concurrency & Thread State' },
      { id: 'service-discovery', title: 'Service Discovery & API Gateway' },
      { id: 'sagas', title: 'Sagas & Distributed Transactions' },
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
  if (id === 'sql-engine') return '/lab/sql';
  if (id === 'java-concurrency') return '/lab/java';
  if (id === 'request-lifecycle') return '/lab/foundations';
  if (id === 'consistent-hashing') return '/lab/system-design';
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

