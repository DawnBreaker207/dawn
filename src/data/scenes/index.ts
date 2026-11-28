/* eslint-disable */
/**
 * Architecture Simulation Scenes Barrel
 * Re-exports all domain simulation scenes and provides ALL_SCENES map.
 */

import { requestLifecycleLesson } from './network/foundations/request-lifecycle';
import { latencyThroughputLesson } from './network/foundations/latency-throughput';
import { napkinMathLesson } from './network/foundations/napkin-math';
import { verticalHorizontalLesson } from './scaling/vertical-horizontal';
import { loadBalancingLesson } from './scaling/load-balancing';
import { statelessLesson } from './scaling/stateless';
import { cachingLesson } from './scaling/caching';
import { cdnLesson } from './scaling/cdn';
import { sqlNosqlLesson } from './storage/storage/sql-nosql';
import { indexesLesson } from './storage/storage/indexes';
import { storageEnginesLesson } from './storage/storage/storage-engines';
import { replicationLesson } from './storage/distributed/replication';
import { shardingLesson } from './storage/distributed/sharding';
import { javaVirtualThreadsLesson } from './specialized/java-runtime/java-virtual-threads';
import { javaJvmMemoryLesson } from './specialized/java-runtime/java-jvm-memory';
import { javaSpringIocLesson } from './specialized/java-enterprise/java-spring-ioc';
import { javaSpringAopLesson } from './specialized/java-enterprise/java-spring-aop';
import { javaSpringJpaLesson } from './specialized/java-enterprise/java-spring-jpa';
import { javaSpringSecurityLesson } from './specialized/java-enterprise/java-spring-security';
import { sqlEngineLesson } from './specialized/storage/sql-engine';
import { microservicesLesson } from './architecture/microservices/microservices';
import { awsCloudLesson } from './cloud/cloud/aws-cloud';
import { awsVpcLesson } from './cloud/cloud/aws-vpc';
import { awsHaLesson } from './cloud/cloud/aws-ha';
import { awsStorageDbLesson } from './cloud/cloud/aws-storage-db';
import { awsServerlessLesson } from './cloud/cloud/aws-serverless';
import { awsIamKmsLesson } from './cloud/cloud/aws-iam-kms';
import { awsHybridNetworkLesson } from './cloud/cloud/aws-hybrid-network';
import { awsEdgeSecurityLesson } from './cloud/cloud/aws-edge-security';
import { awsComputeMigrationLesson } from './cloud/cloud/aws-compute-migration';
import { systemDesignLesson } from './cloud/system-design';
import { consistentHashingLesson } from './storage/distributed/consistent-hashing';
import { uniqueIdsLesson } from './storage/distributed/unique-ids';
import { capLesson } from './storage/distributed/cap';
import { consensusLesson } from './storage/distributed/consensus';
import { transactionsLesson } from './storage/storage/transactions';
import { filesLesson } from './storage/cloud/files';
import { apisLesson } from './communication/apis';
import { queuesLesson } from './communication/queues';
import { pubsubLesson } from './communication/pubsub';
import { realtimeLesson } from './communication/realtime';
import { redundancyLesson } from './reliability/redundancy';
import { rateLimitingLesson } from './reliability/rate-limiting';
import { timeoutsRetriesLesson } from './reliability/timeouts-retries';
import { observabilityLesson } from './reliability/observability';
import { serviceDiscoveryLesson } from './architecture/microservices/service-discovery';
import { sagasLesson } from './architecture/microservices/sagas';
import { batchStreamLesson } from './architecture/system-design/batch-stream';
import { authenticationLesson } from './security/authentication';
import { authorizationLesson } from './security/authorization';
import { encryptionLesson } from './security/encryption';
import { testingLesson } from './shipping/testing';
import { cicdLesson } from './shipping/cicd';
import { hldLldLesson } from './design/hld-lld';
import { designUrlShortenerLesson } from './design/design-url-shortener';
import { designNewsFeedLesson } from './design/design-news-feed';
import { designChatLesson } from './design/design-chat';
import { designNotificationSystemLesson } from './design/design-notification-system';
import { designPaymentSystemLesson } from './design/design-payment-system';
import { designSearchAutocompleteLesson } from './design/design-search-autocomplete';


// SQL deep-dive concepts
import { sqlExecutionOrderLesson } from './storage/storage/sql-execution-order';
import { sqlComplexQueriesLesson } from './storage/storage/sql-complex-queries';
import { mysqlInnodbLesson } from './storage/storage/mysql-innodb';
import { sqlFootprintLesson } from './storage/storage/sql-footprint';
import { sqlConnectionPoolLesson } from './storage/storage/sql-connection-pool';

// Java Core & JVM deep-dive concepts
import { javaTypesBoxingLesson } from './specialized/java-runtime/java-types-boxing';
import { javaStringInternalsLesson } from './specialized/java-runtime/java-string-internals';
import { javaCollectionsLesson } from './specialized/java-runtime/java-collections';
import { javaIoNioLesson } from './specialized/java-runtime/java-io-nio';
import { javaJdbcLesson } from './specialized/java-runtime/java-jdbc';
import { javaLambdaLesson } from './specialized/java-runtime/java-lambda';
import { javaMetaprogrammingLesson } from './specialized/java-runtime/java-metaprogramming';
import { javaJmmCasAqsLesson } from './specialized/java-runtime/java-jmm-cas-aqs';
import { javaClassloaderLesson } from './specialized/java-runtime/java-classloader';
import { javaCoreApisLesson } from './specialized/java-runtime/java-core-apis';

// Spring Enterprise concepts
import { javaSpringMvcLesson } from './specialized/java-enterprise/java-spring-mvc';
import { javaSpringActuatorTestingLesson } from './specialized/java-enterprise/java-spring-actuator-testing';

// Containers & Kubernetes (k8s.sim)
import { dockerInternalsLesson } from './cloud/k8s/docker-internals';
import { dockerImagesStorageLesson } from './cloud/k8s/docker-images-storage';
import { k8sControlPlaneLesson } from './cloud/k8s/k8s-control-plane';
import { k8sWorkerNodeLesson } from './cloud/k8s/k8s-worker-node';
import { k8sNetworkingCniLesson } from './cloud/k8s/k8s-networking-cni';
import { k8sServicesIngressLesson } from './cloud/k8s/k8s-services-ingress';
import { k8sStorageCsiLesson } from './cloud/k8s/k8s-storage-csi';
import { k8sAutoscalingHpaLesson } from './cloud/k8s/k8s-autoscaling-hpa';

// Network & Web Scale Deep-Dive
import { tcpInternalsLesson } from './network/foundations/tcp-internals';
import { tlsHandshakeLesson } from './network/foundations/tls-handshake';
import { httpEvolutionLesson } from './network/foundations/http-evolution';
import { dnsAnycastLesson } from './network/foundations/dns-anycast';
import { websocketRealtimeProtocolsLesson } from './network/scaling/websocket-realtime-protocols';
import { reverseProxyL4L7Lesson } from './network/scaling/reverse-proxy-l4-l7';
import { networkSecurityDdosLesson } from './network/scaling/network-security-ddos';

// Redis In-Memory & Caching Internals
import { redisEventLoopLesson } from './storage/storage/redis-event-loop';
import { redisDataStructuresLesson } from './storage/storage/redis-data-structures';
import { redisSortedSetsLesson } from './storage/storage/redis-sorted-sets';
import { redisPersistenceRdbAofLesson } from './storage/storage/redis-persistence-rdb-aof';
import { redisMemoryEvictionLesson } from './storage/storage/redis-memory-eviction';
import { redisClusterShardingLesson } from './storage/storage/redis-cluster-sharding';

// Message Brokers & Event Streams (Kafka & RabbitMQ)
import { kafkaClusterKraftLesson } from './communication/kafka-cluster-kraft';
import { kafkaStorageEngineLesson } from './communication/kafka-storage-engine';
import { kafkaReplicationIsrLesson } from './communication/kafka-replication-isr';
import { rabbitmqAmqpModelLesson } from './communication/rabbitmq-amqp-model';
import { rabbitmqExchangesRoutingLesson } from './communication/rabbitmq-exchanges-routing';
import { rabbitmqReliabilityDlxLesson } from './communication/rabbitmq-reliability-dlx';

// Flagship System Design
import { aiAgentArchitectureLesson } from './design/ai-agent-architecture';

// Git Simulation Tracks (Track 10)
import { gitEnvironmentsLifecycleLesson } from './git/git-core/git-environments-lifecycle';
import { gitCommandsTaxonomyLesson } from './git/git-core/git-commands-taxonomy';
import { gitBranchingWorkflowsLesson } from './git/git-core/git-branching-workflows';
import { gitDagObjectsLesson } from './git/git-core/git-dag-objects';
import { gitRefsSymbolicLesson } from './git/git-core/git-refs-symbolic';
import { gitDetachedHeadReflogLesson } from './git/git-cases/git-detached-head-reflog';
import { gitWorktreesConcurrencyLesson } from './git/git-cases/git-worktrees-concurrency';
import { gitThreeWayDiff3Lesson } from './git/git-cases/git-three-way-diff3';
import { gitRerereEngineLesson } from './git/git-cases/git-rerere-engine';
import { gitRebaseOntoSurgeryLesson } from './git/git-cases/git-rebase-onto-surgery';
import { gitCrlfLineEndingsLesson } from './git/git-cases/git-crlf-line-endings';
import { gitIndexLockStashLesson } from './git/git-cases/git-index-lock-stash';
import { gitBisectAutomationLesson } from './git/git-cases/git-bisect-automation';
import { gitSubmoduleSubtreeLesson } from './git/git-cases/git-submodule-subtree';

// Angular Simulation Tracks (Track 11 - 12 Canonical Lessons)
import { angularFlowLesson } from './angular/angular-core/angular-flow';
import { angularArchitectureOverviewLesson } from './angular/angular-core/angular-architecture-overview';
import { angularComponentLifecycleLesson } from './angular/angular-core/angular-component-lifecycle';
import { angularServicesDiLesson } from './angular/angular-core/angular-services-di';
import { angularHttpInterceptorsLesson } from './angular/angular-core/angular-http-interceptors';
import { angularReactiveFormsLesson } from './angular/angular-core/angular-reactive-forms';
import { angularRouterPipelineLesson } from './angular/angular-core/angular-router-pipeline';
import { angularIvyIncrementalDomLesson } from './angular/angular-reactivity/angular-ivy-incremental-dom';
import { angularZonejsDirtyCheckingLesson } from './angular/angular-reactivity/angular-zonejs-dirty-checking';
import { angularRxjsReactivityLesson } from './angular/angular-reactivity/angular-rxjs-reactivity';
import { angularSignalsDagLesson } from './angular/angular-reactivity/angular-signals-dag';
import { angularNgrxStateLesson } from './angular/angular-reactivity/angular-ngrx-state';
import { angularControlFlowLesson } from './angular/angular-modern/angular-control-flow';
import { angularHydrationReplayLesson } from './angular/angular-modern/angular-hydration-replay';

// DevOps Simulation Tracks (Track 12)
import { devopsCultureSilosLesson } from './devops/devops-core/devops-culture-silos';
import { cicdToolsEvolutionLesson } from './devops/devops-core/cicd-tools-evolution';
import { cicdPipelineInternalsLesson } from './devops/devops-core/cicd-pipeline-internals';
import { gitopsArgocdLesson } from './devops/devops-delivery/gitops-argocd';
import { devopsDoraMetricsLesson } from './devops/devops-delivery/devops-dora-metrics';

export {
  requestLifecycleLesson,
  latencyThroughputLesson,
  napkinMathLesson,
  verticalHorizontalLesson,
  loadBalancingLesson,
  statelessLesson,
  cachingLesson,
  cdnLesson,
  sqlNosqlLesson,
  indexesLesson,
  storageEnginesLesson,
  replicationLesson,
  shardingLesson,
  consistentHashingLesson,
  uniqueIdsLesson,
  capLesson,
  consensusLesson,
  transactionsLesson,
  filesLesson,
  apisLesson,
  queuesLesson,
  pubsubLesson,
  realtimeLesson,
  redundancyLesson,
  rateLimitingLesson,
  timeoutsRetriesLesson,
  observabilityLesson,
  microservicesLesson,
  serviceDiscoveryLesson,
  sagasLesson,
  batchStreamLesson,
  authenticationLesson,
  authorizationLesson,
  encryptionLesson,
  testingLesson,
  cicdLesson,
  hldLldLesson,
  designUrlShortenerLesson,
  designNewsFeedLesson,
  designChatLesson,
  awsCloudLesson,
  awsVpcLesson,
  awsHaLesson,
  awsStorageDbLesson,
  awsServerlessLesson,
  awsIamKmsLesson,
  awsHybridNetworkLesson,
  awsEdgeSecurityLesson,
  awsComputeMigrationLesson,
  systemDesignLesson,
  sqlEngineLesson,
  javaTypesBoxingLesson,
  javaStringInternalsLesson,
  javaCollectionsLesson,
  javaLambdaLesson,
  javaCoreApisLesson,
  javaIoNioLesson,
  javaJdbcLesson,
  javaMetaprogrammingLesson,
  javaClassloaderLesson,
  javaJvmMemoryLesson,
  javaJmmCasAqsLesson,
  javaVirtualThreadsLesson,
  javaSpringIocLesson,
  javaSpringAopLesson,
  javaSpringMvcLesson,
  javaSpringJpaLesson,
  javaSpringSecurityLesson,
  javaSpringActuatorTestingLesson,
  sqlExecutionOrderLesson,
  sqlComplexQueriesLesson,
  mysqlInnodbLesson,
  sqlFootprintLesson,
  sqlConnectionPoolLesson,
  dockerInternalsLesson,
  dockerImagesStorageLesson,
  k8sControlPlaneLesson,
  k8sWorkerNodeLesson,
  k8sNetworkingCniLesson,
  k8sServicesIngressLesson,
  k8sStorageCsiLesson,
  k8sAutoscalingHpaLesson,
  aiAgentArchitectureLesson,
  // Network
  tcpInternalsLesson,
  tlsHandshakeLesson,
  httpEvolutionLesson,
  dnsAnycastLesson,
  websocketRealtimeProtocolsLesson,
  reverseProxyL4L7Lesson,
  networkSecurityDdosLesson,
  // Redis
  redisEventLoopLesson,
  redisDataStructuresLesson,
  redisSortedSetsLesson,
  redisPersistenceRdbAofLesson,
  redisMemoryEvictionLesson,
  redisClusterShardingLesson,
  // Kafka & RabbitMQ
  kafkaClusterKraftLesson,
  kafkaStorageEngineLesson,
  kafkaReplicationIsrLesson,
  rabbitmqAmqpModelLesson,
  rabbitmqExchangesRoutingLesson,
  rabbitmqReliabilityDlxLesson,
  // Git Simulation Tracks
  gitEnvironmentsLifecycleLesson,
  gitCommandsTaxonomyLesson,
  gitBranchingWorkflowsLesson,
  gitDagObjectsLesson,
  gitRefsSymbolicLesson,
  gitDetachedHeadReflogLesson,
  gitWorktreesConcurrencyLesson,
  gitThreeWayDiff3Lesson,
  gitRerereEngineLesson,
  gitRebaseOntoSurgeryLesson,
  gitCrlfLineEndingsLesson,
  gitIndexLockStashLesson,
  gitBisectAutomationLesson,
  gitSubmoduleSubtreeLesson,
  // Angular Simulation Tracks
  angularFlowLesson,
  angularArchitectureOverviewLesson,
  angularComponentLifecycleLesson,
  angularServicesDiLesson,
  angularHttpInterceptorsLesson,
  angularReactiveFormsLesson,
  angularRouterPipelineLesson,
  angularIvyIncrementalDomLesson,
  angularZonejsDirtyCheckingLesson,
  angularRxjsReactivityLesson,
  angularSignalsDagLesson,
  angularNgrxStateLesson,
  angularControlFlowLesson,
  angularHydrationReplayLesson,
  // DevOps Simulation Tracks
  devopsCultureSilosLesson,
  cicdToolsEvolutionLesson,
  cicdPipelineInternalsLesson,
  gitopsArgocdLesson,
  devopsDoraMetricsLesson,
};

export const ALL_SCENES: Record<string, any> = {
  'request-lifecycle': requestLifecycleLesson,
  'latency-throughput': latencyThroughputLesson,
  'napkin-math': napkinMathLesson,
  'vertical-horizontal': verticalHorizontalLesson,
  'load-balancing': loadBalancingLesson,
  'stateless': statelessLesson,
  'caching': cachingLesson,
  'cdn': cdnLesson,
  'sql-nosql': sqlNosqlLesson,
  'indexes': indexesLesson,
  'storage-engines': storageEnginesLesson,
  'replication': replicationLesson,
  'sharding': shardingLesson,
  'consistent-hashing': consistentHashingLesson,
  'unique-ids': uniqueIdsLesson,
  'cap': capLesson,
  'consensus': consensusLesson,
  'transactions': transactionsLesson,
  'files': filesLesson,
  'apis': apisLesson,
  'queues': queuesLesson,
  'pubsub': pubsubLesson,
  'realtime': realtimeLesson,
  'redundancy': redundancyLesson,
  'rate-limiting': rateLimitingLesson,
  'timeouts-retries': timeoutsRetriesLesson,
  'observability': observabilityLesson,
  'microservices': microservicesLesson,
  'service-discovery': serviceDiscoveryLesson,
  'sagas': sagasLesson,
  'batch-stream': batchStreamLesson,
  'authentication': authenticationLesson,
  'authorization': authorizationLesson,
  'encryption': encryptionLesson,
  'testing': testingLesson,
  'cicd': cicdLesson,
  'hld-lld': hldLldLesson,
  'design-url-shortener': designUrlShortenerLesson,
  'design-news-feed': designNewsFeedLesson,
  'design-chat': designChatLesson,
  'design-notification-system': designNotificationSystemLesson,
  'design-payment-system': designPaymentSystemLesson,
  'design-search-autocomplete': designSearchAutocompleteLesson,
  'aws-cloud': awsCloudLesson,
  'aws-vpc': awsVpcLesson,
  'aws-ha': awsHaLesson,
  'aws-storage-db': awsStorageDbLesson,
  'aws-serverless': awsServerlessLesson,
  'aws-iam-kms': awsIamKmsLesson,
  'aws-hybrid-network': awsHybridNetworkLesson,
  'aws-edge-security': awsEdgeSecurityLesson,
  'aws-compute-migration': awsComputeMigrationLesson,
  'system-design': systemDesignLesson,
  'architecture': systemDesignLesson,
  'sql-engine': sqlEngineLesson,
  'sql': sqlEngineLesson,
  'java-types-boxing': javaTypesBoxingLesson,
  'java-string-internals': javaStringInternalsLesson,
  'java-collections': javaCollectionsLesson,
  'java-lambda': javaLambdaLesson,
  'java-core-apis': javaCoreApisLesson,
  'java-io-nio': javaIoNioLesson,
  'java-jdbc': javaJdbcLesson,
  'java-metaprogramming': javaMetaprogrammingLesson,
  'java-classloader': javaClassloaderLesson,
  'java-jvm-memory': javaJvmMemoryLesson,
  'java-jmm-cas-aqs': javaJmmCasAqsLesson,
  'java-virtual-threads': javaVirtualThreadsLesson,
  'java-spring-ioc': javaSpringIocLesson,
  'java-spring-aop': javaSpringAopLesson,
  'java-spring-mvc': javaSpringMvcLesson,
  'java-spring-jpa': javaSpringJpaLesson,
  'java-spring-security': javaSpringSecurityLesson,
  'java-spring-actuator-testing': javaSpringActuatorTestingLesson,
  'java': javaTypesBoxingLesson,
  'sql-execution-order': sqlExecutionOrderLesson,
  'sql-complex-queries': sqlComplexQueriesLesson,
  'mysql-innodb': mysqlInnodbLesson,
  'sql-footprint': sqlFootprintLesson,
  'sql-connection-pool': sqlConnectionPoolLesson,
  'docker-internals': dockerInternalsLesson,
  'docker-images-storage': dockerImagesStorageLesson,
  'k8s-control-plane': k8sControlPlaneLesson,
  'k8s-worker-node': k8sWorkerNodeLesson,
  'k8s-networking-cni': k8sNetworkingCniLesson,
  'k8s-services-ingress': k8sServicesIngressLesson,
  'k8s-storage-csi': k8sStorageCsiLesson,
  'k8s-autoscaling-hpa': k8sAutoscalingHpaLesson,
  'k8s': k8sControlPlaneLesson,
  'ai-agent-architecture': aiAgentArchitectureLesson,
  // Network & Web Scale Deep-Dive
  'tcp-internals': tcpInternalsLesson,
  'tls-handshake': tlsHandshakeLesson,
  'http-evolution': httpEvolutionLesson,
  'dns-anycast': dnsAnycastLesson,
  'websocket-realtime-protocols': websocketRealtimeProtocolsLesson,
  'reverse-proxy-l4-l7': reverseProxyL4L7Lesson,
  'network-security-ddos': networkSecurityDdosLesson,
  // Redis In-Memory & Caching Internals
  'redis-event-loop': redisEventLoopLesson,
  'redis-data-structures': redisDataStructuresLesson,
  'redis-sorted-sets': redisSortedSetsLesson,
  'redis-persistence-rdb-aof': redisPersistenceRdbAofLesson,
  'redis-memory-eviction': redisMemoryEvictionLesson,
  'redis-cluster-sharding': redisClusterShardingLesson,
  // Message Brokers & Event Streams (Kafka & RabbitMQ)
  'kafka-cluster-kraft': kafkaClusterKraftLesson,
  'kafka-storage-engine': kafkaStorageEngineLesson,
  'kafka-replication-isr': kafkaReplicationIsrLesson,
  'rabbitmq-amqp-model': rabbitmqAmqpModelLesson,
  'rabbitmq-exchanges-routing': rabbitmqExchangesRoutingLesson,
  'rabbitmq-reliability-dlx': rabbitmqReliabilityDlxLesson,
  // Git Simulation Tracks (Track 10)
  'git-environments-lifecycle': gitEnvironmentsLifecycleLesson,
  'git-commands-taxonomy': gitCommandsTaxonomyLesson,
  'git-branching-workflows': gitBranchingWorkflowsLesson,
  'git-dag-objects': gitDagObjectsLesson,
  'git-refs-symbolic': gitRefsSymbolicLesson,
  'git-detached-head-reflog': gitDetachedHeadReflogLesson,
  'git-worktrees-concurrency': gitWorktreesConcurrencyLesson,
  'git-three-way-diff3': gitThreeWayDiff3Lesson,
  'git-rerere-engine': gitRerereEngineLesson,
  'git-rebase-onto-surgery': gitRebaseOntoSurgeryLesson,
  'git-crlf-line-endings': gitCrlfLineEndingsLesson,
  'git-index-lock-stash': gitIndexLockStashLesson,
  'git-bisect-automation': gitBisectAutomationLesson,
  'git-submodule-subtree': gitSubmoduleSubtreeLesson,
  'git': gitEnvironmentsLifecycleLesson,
  // Angular Simulation Tracks (Track 11)
  'angular-flow': angularFlowLesson,
  'angular-architecture-overview': angularArchitectureOverviewLesson,
  'angular-component-lifecycle': angularComponentLifecycleLesson,
  'angular-services-di': angularServicesDiLesson,
  'angular-http-interceptors': angularHttpInterceptorsLesson,
  'angular-reactive-forms': angularReactiveFormsLesson,
  'angular-router-pipeline': angularRouterPipelineLesson,
  'angular-ivy-incremental-dom': angularIvyIncrementalDomLesson,
  'angular-zonejs-dirty-checking': angularZonejsDirtyCheckingLesson,
  'angular-rxjs-reactivity': angularRxjsReactivityLesson,
  'angular-signals-dag': angularSignalsDagLesson,
  'angular-ngrx-state': angularNgrxStateLesson,
  'angular-control-flow': angularControlFlowLesson,
  'angular-hydration-replay': angularHydrationReplayLesson,
  'angular': angularFlowLesson,
  // DevOps Simulation Tracks (Track 12)
  'devops-culture-silos': devopsCultureSilosLesson,
  'cicd-tools-evolution': cicdToolsEvolutionLesson,
  'cicd-pipeline-internals': cicdPipelineInternalsLesson,
  'gitops-argocd': gitopsArgocdLesson,
  'devops-dora-metrics': devopsDoraMetricsLesson,
  'devops': devopsCultureSilosLesson,
};

export const ALL_SIM_LESSONS = ALL_SCENES;
