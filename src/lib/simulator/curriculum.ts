export const CHAPTER_KINDS = {
  setup: { label: `Setup`, tone: `sand` },
  problem: { label: `Problem`, tone: `red` },
  solution: { label: `Solution`, tone: `green` },
  technique: { label: `Technique`, tone: `blue` },
  tradeoff: { label: `Trade-off`, tone: `amber` },
  insight: { label: `Insight`, tone: `violet` },
  recap: { label: `Recap`, tone: `ink` },
};

export const MODULES = [
  {
    id: `foundations`,
    num: `01`,
    title: `Network Foundations`,
    trackId: `network-scale`,
    color: `sand`,
    lessons: [
      { id: `request-lifecycle`, title: `How a Request Travels` },
      { id: `latency-throughput`, title: `Latency & Throughput` },
      { id: `napkin-math`, title: `Napkin Math` },
    ],
  },
  {
    id: `scaling`,
    num: `02`,
    title: `Scaling & Traffic`,
    trackId: `network-scale`,
    color: `green`,
    lessons: [
      { id: `vertical-horizontal`, title: `Vertical vs Horizontal`, ready: true },
      { id: `load-balancing`, title: `Load Balancing (L4 / L7)`, ready: true },
      { id: `stateless`, title: `Stateless Services` },
      { id: `caching`, title: `Caching` },
      { id: `cdn`, title: `Content Delivery (CDN)` },
    ],
  },
  {
    id: `storage`,
    num: `03`,
    title: `Database & Storage Tier`,
    trackId: `storage-tier`,
    color: `violet`,
    lessons: [
      { id: `sql-nosql`, title: `SQL vs NoSQL` },
      { id: `indexes`, title: `Indexes & B-Trees` },
      { id: `storage-engines`, title: `Storage Engines (LSM vs B-Tree)` },
      { id: `sql-engine`, title: `PostgreSQL Query Planner & Engine`, ready: true },
      { id: `transactions`, title: `Transactions & Isolation Levels` },
      { id: `files`, title: `Files & Object Storage (S3)` },
    ],
  },
  {
    id: `distributed`,
    num: `04`,
    title: `Distributed Systems Core`,
    trackId: `distributed`,
    color: `cyan`,
    lessons: [
      { id: `replication`, title: `Replication` },
      { id: `sharding`, title: `Sharding & Partitioning` },
      { id: `consistent-hashing`, title: `Consistent Hashing` },
      { id: `unique-ids`, title: `Unique IDs at Scale (Snowflake)` },
      { id: `cap`, title: `CAP & PACELC Theorem` },
      { id: `consensus`, title: `Consensus & Raft Leader Election` },
    ],
  },
  {
    id: `microservices`,
    num: `05`,
    title: `Microservices Architecture`,
    trackId: `microservices`,
    color: `teal`,
    lessons: [
      { id: `microservices`, title: `Monolith vs Microservices` },
      { id: `java-concurrency`, title: `Java Concurrency & Thread State`, ready: true },
      { id: `service-discovery`, title: `Service Discovery & API Gateway` },
      { id: `sagas`, title: `Sagas & Distributed Transactions` },
    ],
  },
  {
    id: `communication`,
    num: `06`,
    title: `Event-Driven & Messaging`,
    trackId: `microservices`,
    color: `orange`,
    lessons: [
      { id: `apis`, title: `REST, gRPC & GraphQL` },
      { id: `queues`, title: `Message Queues (SQS / RabbitMQ)` },
      { id: `pubsub`, title: `Pub/Sub & Event Streams (Kafka)` },
      { id: `realtime`, title: `Real-time Updates (WebSockets / SSE)` },
    ],
  },
  {
    id: `reliability`,
    num: `07`,
    title: `Reliability & Resilience`,
    trackId: `system-design`,
    color: `blue`,
    lessons: [
      { id: `redundancy`, title: `Redundancy & Multi-AZ Failover` },
      { id: `rate-limiting`, title: `Rate Limiting` },
      { id: `timeouts-retries`, title: `Timeouts, Retries & Circuit Breakers` },
      { id: `observability`, title: `Observability & Distributed Tracing` },
    ],
  },
  {
    id: `system-design`,
    num: `08`,
    title: `System Design Case Studies`,
    trackId: `system-design`,
    color: `slate`,
    lessons: [
      { id: `hld-lld`, title: `High-Level & Low-Level Design (HLD/LLD)` },
      { id: `design-url-shortener`, title: `Design a URL Shortener (TinyURL)` },
      { id: `design-news-feed`, title: `Design a News Feed` },
      { id: `design-chat`, title: `Design a Chat System` },
      { id: `batch-stream`, title: `Batch & Stream Processing` },
    ],
  },
  {
    id: `cloud`,
    num: `09`,
    title: `AWS Cloud Architecture (SAA-C03)`,
    trackId: `cloud-aws`,
    color: `amber`,
    lessons: [
      { id: `aws-cloud`, title: `AWS Multi-AZ Resilience`, ready: true },
      { id: `aws-vpc`, title: `AWS VPC & Network Security`, ready: true },
      { id: `aws-ha`, title: `High Availability & Auto Scaling`, ready: true },
      { id: `aws-storage-db`, title: `AWS Storage & Database Tiering`, ready: true },
      { id: `aws-serverless`, title: `Decoupled & Serverless Systems`, ready: true },
    ],
  },
  {
    id: `security`,
    num: `10`,
    title: `Security & Secrets`,
    trackId: `devsecops`,
    color: `rose`,
    lessons: [
      { id: `authentication`, title: `Authentication` },
      { id: `authorization`, title: `Authorization` },
      { id: `encryption`, title: `Encryption & Secrets` },
    ],
  },
  {
    id: `shipping`,
    num: `11`,
    title: `DevOps & CI/CD`,
    trackId: `devsecops`,
    color: `olive`,
    lessons: [
      { id: `testing`, title: `Testing` },
      { id: `cicd`, title: `CI/CD & Deployments` },
    ],
  },
];

export const ALL_LESSONS = MODULES.flatMap((m) =>
  m.lessons.map((lesson, i) => ({ ...lesson, module: m, index: i + 1, of: m.lessons.length })),
);

export const findLesson = (id: string) => ALL_LESSONS.find((l) => l.id === id);

export const nextLesson = (id: string) =>
  ALL_LESSONS[ALL_LESSONS.findIndex((l) => l.id === id) + 1] || null;
