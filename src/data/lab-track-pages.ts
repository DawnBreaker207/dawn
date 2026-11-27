/**
 * Lab URLs that are not plain `/lab/<lessonId>` pages.
 *
 * Most are track entry pages (e.g. `/lab/angular` opens the first Angular
 * lesson); a few are lesson pages with a hand-written title/description.
 * All are rendered by src/pages/lab/[lesson].astro.
 */
export interface LabPageConfig {
  lessonId: string;
  moduleId: string;
  trackId: string;
  title: string;
  description: string;
}

export const LAB_TRACK_PAGES: Record<string, LabPageConfig> = {
  angular: {
    lessonId: 'angular-flow',
    moduleId: 'angular-core',
    trackId: 'angular',
    title: 'Angular Core Architecture & Modern Mechanics · Interactive Visual Lab',
    description:
      'Visual simulation of Angular Bootstrap, Component Lifecycle, Standalone, Hierarchical DI, HTTP Interceptors, Router, Ivy, Signals DAG, and Hydration.',
  },
  architecture: {
    lessonId: 'architecture',
    moduleId: 'architecture',
    trackId: 'architecture',
    title: 'Dawn Blog Architecture · Interactive Visual Lab',
    description:
      'End-to-end cloud architecture — Cloudflare Edge-First, C4 Container Model, Data Plane vs Control Plane, and Zero-Trust DB.',
  },
  'aws-cloud': {
    lessonId: 'aws-cloud',
    moduleId: 'cloud',
    trackId: 'cloud-aws',
    title: 'AWS Cloud Architecture & Multi-AZ Resilience · Interactive Visual Lab',
    description:
      'Hands-on interactive lab simulating AWS Cloud Multi-AZ resilience, Route 53 latency routing, ALB health checks, ECS Fargate auto-scaling, ElastiCache Redis, and Aurora PostgreSQL automated failover.',
  },
  devops: {
    lessonId: 'devops-culture-silos',
    moduleId: 'devops-core',
    trackId: 'devops',
    title: 'DevOps Engineering & Progressive Delivery · Interactive Visual Lab',
    description:
      'Visual simulation of DevOps culture, CI/CD tool evolution, runner internals, canary rollouts, GitOps reconciliation, and DORA metrics.',
  },
  distributed: {
    lessonId: 'consistent-hashing',
    moduleId: 'distributed',
    trackId: 'distributed',
    title: 'Distributed Systems Core · Interactive Visual Lab',
    description:
      'Core patterns of distributed systems — Replication, Sharding, Consistent Hashing, Unique IDs, CAP Theorem, and Raft Consensus.',
  },
  foundations: {
    lessonId: 'request-lifecycle',
    moduleId: 'foundations',
    trackId: 'network-scale',
    title: 'Network & Foundations · Interactive Visual Lab',
    description: 'Foundational networking mechanics — Request Lifecycle, Latency vs Throughput, and Napkin Math.',
  },
  git: {
    lessonId: 'git-environments-lifecycle',
    moduleId: 'git-core',
    trackId: 'git',
    title: 'Git Deep Internals & Practical Case Resolver · Interactive Visual Lab',
    description:
      'Visual simulation of 4 Git zones, DAG objects, commit graphs, worktrees, 3-way diff3 merge, and AI agent troubleshooting surgery.',
  },
  java: {
    lessonId: 'java-types-boxing',
    moduleId: 'java-runtime',
    trackId: 'java-runtime',
    title: 'Java Concurrency & Memory Model · Interactive Visual Lab',
    description: 'Java thread lifecycle, monitors, virtual threads, and memory model simulation.',
  },
  k8s: {
    lessonId: 'docker-internals',
    moduleId: 'k8s',
    trackId: 'k8s',
    title: 'Containers & Kubernetes Orchestration · Interactive Visual Lab',
    description:
      'Interactive visual simulation of Linux namespaces, cgroups, Pod lifecycle, CNI overlay networks, and autoscaling.',
  },
  microservices: {
    lessonId: 'microservices',
    moduleId: 'microservices',
    trackId: 'microservices',
    title: 'Microservices & Distributed Systems · Interactive Visual Lab',
    description:
      'Interactive visual simulation of distributed transactions, saga orchestrations, event-driven choreographies, and API gateway resilience.',
  },
  'request-lifecycle': {
    lessonId: 'request-lifecycle',
    moduleId: 'foundations',
    trackId: 'network-scale',
    title: 'How a Request Travels · Interactive Visual Lab',
    description:
      'Follow a web request hop by hop — DNS lookup, TCP/TLS handshake, server processing, database queries, and browser rendering with tactile 3D isometric simulation.',
  },
  security: {
    lessonId: 'authentication',
    moduleId: 'security',
    trackId: 'devsecops',
    title: 'DevSecOps & Security Engineering · Interactive Visual Lab',
    description:
      'Interactive visual simulation of OAuth2/JWT token exchange, RBAC/ABAC authorization, TLS 1.3 cryptography, and automated CI/CD pipelines.',
  },
  sql: {
    lessonId: 'sql-engine',
    moduleId: 'storage',
    trackId: 'storage-tier',
    title: 'PostgreSQL Query Engine Architecture · Interactive Visual Lab',
    description:
      'Interactive PostgreSQL query plan simulator — parse, plan, execute, buffer pool, WAL, and locks.',
  },
  'system-design': {
    lessonId: 'hld-lld',
    moduleId: 'system-design',
    trackId: 'system-design',
    title: 'System Design Case Studies · Interactive Visual Lab',
    description: 'High-Level & Low-Level Design, TinyURL, News Feed, Chat, and Stream Processing.',
  },
};
