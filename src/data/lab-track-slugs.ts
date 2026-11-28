// Sidebar highlighting: which lesson slugs belong to which curriculum track page.
// Keyed by the track entry href (see lab-track-pages.ts for the track pages themselves).

import { CURRICULUM_MODULES } from '@/data/curriculum';

/** Hand-picked slugs: track entry pages plus aliases that are not curriculum lessons. */
const HAND_PICKED_SLUGS: Record<string, string[]> = {
  '/lab/security': ['security', 'authentication', 'authorization', 'encryption', 'cicd', 'testing'],
  '/lab/foundations': [
    'foundations', 'request-lifecycle', 'latency-throughput', 'napkin-math',
    'vertical-horizontal', 'load-balancing', 'stateless', 'caching', 'cdn',
  ],
  '/lab/sql': [
    'sql', 'sql-engine', 'sql-execution-order',
    'sql-complex-queries', 'indexes', 'sql-connection-pool',
    'storage-engines', 'sql-footprint', 'sql-nosql',
    'transactions', 'mysql-innodb',
  ],
  '/lab/distributed': [
    'distributed', 'replication', 'sharding', 'consistent-hashing',
    'unique-ids', 'cap', 'consensus',
  ],
  '/lab/microservices': [
    'microservices', 'service-discovery', 'sagas', 'apis', 'queues', 'pubsub', 'realtime',
  ],
  '/lab/k8s': [
    'k8s', 'docker-internals', 'docker-images-storage', 'k8s-control-plane',
    'k8s-worker-node', 'k8s-networking-cni', 'k8s-services-ingress',
    'k8s-storage-csi', 'k8s-autoscaling-hpa',
  ],
  '/lab/java': [
    'java', 'java-types-boxing', 'java-string-internals',
    'java-collections', 'java-lambda', 'java-core-apis', 'java-io-nio',
    'java-jdbc', 'java-metaprogramming', 'java-classloader', 'java-jvm-memory',
    'java-jmm-cas-aqs',
    'java-virtual-threads', 'java-spring-ioc', 'java-spring-aop',
    'java-spring-mvc', 'java-spring-jpa',
    'java-spring-security',
    'java-spring-actuator-testing',
  ],
  '/lab/system-design': [
    'system-design', 'ai-agent-architecture', 'hld-lld', 'design-url-shortener', 'design-news-feed',
    'design-chat', 'design-notification-system', 'design-payment-system', 'design-search-autocomplete', 'batch-stream', 'redundancy', 'rate-limiting', 'timeouts-retries', 'observability',
  ],
  '/lab/aws-cloud': [
    'aws-cloud', 'aws-vpc', 'aws-ha', 'aws-storage-db', 'files', 'aws-serverless',
  ],
  '/lab/git': [
    'git', 'git-environments-lifecycle', 'git-commands-taxonomy', 'git-branching-workflows',
    'git-dag-objects', 'git-refs-symbolic', 'git-detached-head-reflog', 'git-worktrees-concurrency',
    'git-three-way-diff3', 'git-rerere-engine', 'git-rebase-onto-surgery', 'git-crlf-line-endings',
    'git-index-lock-stash', 'git-bisect-automation', 'git-submodule-subtree',
  ],
  '/lab/angular': [
    'angular', 'angular-architecture-overview', 'angular-modules-standalone', 'angular-component-lifecycle',
    'angular-services-di', 'angular-http-interceptors', 'angular-router-pipeline', 'angular-pipes-memoization',
    'angular-ivy-incremental-dom', 'angular-zonejs-dirty-checking', 'angular-change-detection-onpush',
    'angular-signals-dag', 'angular-zoneless-architecture', 'angular-control-flow', 'angular-defer-loading',
    'angular-hydration-replay',
  ],
  '/lab/devops': [
    'devops', 'devops-culture-silos', 'cicd-tools-evolution', 'cicd-pipeline-internals',
    'gitops-argocd', 'devops-dora-metrics',
  ],
};

/** Curriculum track id behind each track entry href, used to add every lesson of the track. */
const TRACK_ID_BY_ENTRY: Record<string, string> = {
  '/lab/git': 'git',
  '/lab/foundations': 'network-scale',
  '/lab/sql': 'storage-tier',
  '/lab/angular': 'angular',
  '/lab/java': 'java-runtime',
  '/lab/devops': 'devops',
  '/lab/k8s': 'k8s',
  '/lab/distributed': 'distributed',
  '/lab/microservices': 'microservices',
  '/lab/aws-cloud': 'cloud-aws',
  '/lab/system-design': 'system-design',
  '/lab/security': 'devsecops',
};

export const TRACK_SLUG_MAP: Record<string, string[]> = Object.fromEntries(
  Object.entries(HAND_PICKED_SLUGS).map(([href, slugs]) => {
    const lessons = CURRICULUM_MODULES.filter((m) => m.trackId === TRACK_ID_BY_ENTRY[href]).flatMap((m) =>
      m.lessons.map((l) => l.id),
    );
    return [href, [...new Set([...slugs, ...lessons])]];
  }),
);
