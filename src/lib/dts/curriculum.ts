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
    title: `Foundations`,
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
    title: `Scaling`,
    color: `green`,
    lessons: [
      { id: `vertical-horizontal`, title: `Vertical vs Horizontal`, ready: true },
      { id: `load-balancing`, title: `Load Balancing`, ready: true },
      { id: `stateless`, title: `Stateless Services` },
      { id: `caching`, title: `Caching` },
      { id: `cdn`, title: `Content Delivery` },
    ],
  },
  {
    id: `data`,
    num: `03`,
    title: `Data & Storage`,
    color: `violet`,
    lessons: [
      { id: `sql-nosql`, title: `SQL vs NoSQL` },
      { id: `indexes`, title: `Indexes` },
      { id: `storage-engines`, title: `Storage Engines` },
      { id: `sql-engine`, title: `PostgreSQL Query Planner & Engine`, ready: true },
      { id: `replication`, title: `Replication` },
      { id: `sharding`, title: `Sharding` },
      { id: `consistent-hashing`, title: `Consistent Hashing` },
      { id: `unique-ids`, title: `Unique IDs at Scale` },
      { id: `cap`, title: `CAP & Consistency` },
      { id: `consensus`, title: `Consensus & Leaders` },
      { id: `transactions`, title: `Transactions & Isolation` },
      { id: `files`, title: `Files & Media` },
    ],
  },
  {
    id: `communication`,
    num: `04`,
    title: `Communication`,
    color: `orange`,
    lessons: [
      { id: `apis`, title: `REST, RPC & GraphQL` },
      { id: `queues`, title: `Message Queues` },
      { id: `pubsub`, title: `Pub/Sub & Events` },
      { id: `realtime`, title: `Real-time Updates` },
    ],
  },
  {
    id: `reliability`,
    num: `05`,
    title: `Reliability`,
    color: `blue`,
    lessons: [
      { id: `redundancy`, title: `Redundancy & Failover` },
      { id: `rate-limiting`, title: `Rate Limiting` },
      { id: `timeouts-retries`, title: `Timeouts & Retries` },
      { id: `observability`, title: `Observability` },
    ],
  },
  {
    id: `architecture`,
    num: `06`,
    title: `Architecture`,
    color: `teal`,
    lessons: [
      { id: `microservices`, title: `Monolith vs Microservices` },
      { id: `java-concurrency`, title: `Java Concurrency & Thread State`, ready: true },
      { id: `service-discovery`, title: `Service Discovery` },
      { id: `sagas`, title: `Sagas & Distributed Tx` },
      { id: `batch-stream`, title: `Batch & Stream Processing` },
    ],
  },
  {
    id: `security`,
    num: `07`,
    title: `Security`,
    color: `rose`,
    lessons: [
      { id: `authentication`, title: `Authentication` },
      { id: `authorization`, title: `Authorization` },
      { id: `encryption`, title: `Encryption & Secrets` },
    ],
  },
  {
    id: `shipping`,
    num: `08`,
    title: `Shipping`,
    color: `olive`,
    lessons: [
      { id: `testing`, title: `Testing` },
      { id: `cicd`, title: `CI/CD & Deployments` },
    ],
  },
  {
    id: `design`,
    num: `09`,
    title: `Whole Systems`,
    color: `slate`,
    lessons: [
      { id: `hld-lld`, title: `HLD & LLD` },
      { id: `design-url-shortener`, title: `Design a URL Shortener` },
      { id: `design-news-feed`, title: `Design a News Feed` },
      { id: `design-chat`, title: `Design a Chat System` },
    ],
  },
  {
    id: `cloud`,
    num: `10`,
    title: `Cloud Architecture`,
    color: `orange`,
    lessons: [
      { id: `system-design`, title: `Dawn Blog System Architecture`, ready: true },
      { id: `aws-cloud`, title: `AWS Multi-AZ Resilience`, ready: true },
      { id: `aws-vpc`, title: `AWS VPC & Network Security`, ready: true },
      { id: `aws-ha`, title: `High Availability & Auto Scaling`, ready: true },
      { id: `aws-storage-db`, title: `AWS Storage & Database Tiering`, ready: true },
      { id: `aws-serverless`, title: `Decoupled & Serverless`, ready: true },
    ],
  },
];

export const ALL_LESSONS = MODULES.flatMap((m) =>
  m.lessons.map((lesson, i) => ({ ...lesson, module: m, index: i + 1, of: m.lessons.length })),
);

export const findLesson = (id: string) => ALL_LESSONS.find((l) => l.id === id);

export const nextLesson = (id: string) =>
  ALL_LESSONS[ALL_LESSONS.findIndex((l) => l.id === id) + 1] || null;
