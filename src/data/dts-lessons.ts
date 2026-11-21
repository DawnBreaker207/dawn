export interface Track {
  id: string;
  title: string;
  subtitle: string;
  moduleIds: string[];
}

export const DTS_TRACKS: Track[] = [
  {
    id: 'foundations-networking',
    title: 'Track 1 · Network & Foundations',
    subtitle: 'Request lifecycle, latency, DNS, TCP/TLS & scaling basics',
    moduleIds: ['foundations', 'scaling'],
  },
  {
    id: 'data-storage',
    title: 'Track 2 · Data Tier & Storage',
    subtitle: 'SQL/NoSQL, indexing, replication, sharding, consensus & isolation',
    moduleIds: ['data'],
  },
  {
    id: 'distributed-systems',
    title: 'Track 3 · Microservices & Distributed',
    subtitle: 'APIs, pub/sub, message queues, sagas & stream processing',
    moduleIds: ['communication', 'architecture'],
  },
  {
    id: 'cloud-resilience',
    title: 'Track 4 · Cloud Native & Whole Systems',
    subtitle: 'Multi-AZ reliability, rate limiting, security, CI/CD & full architectures',
    moduleIds: ['reliability', 'security', 'shipping', 'design', 'cloud'],
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
  color: string;
  lessons: Lesson[];
}

export const DTS_MODULES: Module[] = [
  {
    id: 'foundations',
    num: '01',
    title: 'Foundations',
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
    title: 'Scaling',
    color: 'green',
    lessons: [
      { id: 'vertical-horizontal', title: 'Vertical vs Horizontal' },
      { id: 'load-balancing', title: 'Load Balancing' },
      { id: 'stateless', title: 'Stateless Services' },
      { id: 'caching', title: 'Caching' },
      { id: 'cdn', title: 'Content Delivery' },
    ],
  },
  {
    id: 'data',
    num: '03',
    title: 'Data & Storage',
    color: 'violet',
    lessons: [
      { id: 'sql-nosql', title: 'SQL vs NoSQL' },
      { id: 'indexes', title: 'Indexes' },
      { id: 'storage-engines', title: 'Storage Engines' },
      { id: 'sql-engine', title: 'PostgreSQL Query Planner & Engine' },
      { id: 'replication', title: 'Replication' },
      { id: 'sharding', title: 'Sharding' },
      { id: 'consistent-hashing', title: 'Consistent Hashing' },
      { id: 'unique-ids', title: 'Unique IDs at Scale' },
      { id: 'cap', title: 'CAP & Consistency' },
      { id: 'consensus', title: 'Consensus & Leaders' },
      { id: 'transactions', title: 'Transactions & Isolation' },
      { id: 'files', title: 'Files & Media' },
    ],
  },
  {
    id: 'communication',
    num: '04',
    title: 'Communication',
    color: 'orange',
    lessons: [
      { id: 'apis', title: 'REST, RPC & GraphQL' },
      { id: 'queues', title: 'Message Queues' },
      { id: 'pubsub', title: 'Pub/Sub & Events' },
      { id: 'realtime', title: 'Real-time Updates' },
    ],
  },
  {
    id: 'reliability',
    num: '05',
    title: 'Reliability',
    color: 'blue',
    lessons: [
      { id: 'redundancy', title: 'Redundancy & Failover' },
      { id: 'rate-limiting', title: 'Rate Limiting' },
      { id: 'timeouts-retries', title: 'Timeouts & Retries' },
      { id: 'observability', title: 'Observability' },
    ],
  },
  {
    id: 'architecture',
    num: '06',
    title: 'Architecture',
    color: 'teal',
    lessons: [
      { id: 'microservices', title: 'Monolith vs Microservices' },
      { id: 'java-concurrency', title: 'Java Concurrency & Thread State' },
      { id: 'service-discovery', title: 'Service Discovery' },
      { id: 'sagas', title: 'Sagas & Distributed Tx' },
      { id: 'batch-stream', title: 'Batch & Stream Processing' },
    ],
  },
  {
    id: 'security',
    num: '07',
    title: 'Security',
    color: 'rose',
    lessons: [
      { id: 'authentication', title: 'Authentication' },
      { id: 'authorization', title: 'Authorization' },
      { id: 'encryption', title: 'Encryption & Secrets' },
    ],
  },
  {
    id: 'shipping',
    num: '08',
    title: 'Shipping',
    color: 'olive',
    lessons: [
      { id: 'testing', title: 'Testing' },
      { id: 'cicd', title: 'CI/CD & Deployments' },
    ],
  },
  {
    id: 'design',
    num: '09',
    title: 'Whole Systems',
    color: 'slate',
    lessons: [
      { id: 'hld-lld', title: 'HLD & LLD' },
      { id: 'design-url-shortener', title: 'Design a URL Shortener' },
      { id: 'design-news-feed', title: 'Design a News Feed' },
      { id: 'design-chat', title: 'Design a Chat System' },
    ],
  },
  {
    id: 'cloud',
    num: '10',
    title: 'AWS Cloud Architecture (SAA-C03)',
    color: 'orange',
    lessons: [
      { id: 'aws-cloud', title: 'AWS Multi-AZ Resilience' },
      { id: 'aws-vpc', title: 'AWS VPC & Network Security' },
      { id: 'aws-ha', title: 'High Availability & Auto Scaling' },
      { id: 'aws-storage-db', title: 'AWS Storage & Database Tiering' },
      { id: 'aws-serverless', title: 'Decoupled & Serverless' },
      { id: 'architecture', title: 'Dawn Blog Architecture' },
      { id: 'system-design', title: 'Distributed Systems' },
    ],
  },
];
