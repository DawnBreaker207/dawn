// @ts-nocheck
/* eslint-disable */
/**
 * Architecture Simulation Scenes Barrel
 * Re-exports all domain simulation scenes and provides ALL_SCENES map.
 */

import { requestLifecycleLesson } from './network/request-lifecycle';
import { latencyThroughputLesson } from './network/latency-throughput';
import { napkinMathLesson } from './network/napkin-math';
import { verticalHorizontalLesson } from './scaling/vertical-horizontal';
import { loadBalancingLesson } from './scaling/load-balancing';
import { statelessLesson } from './scaling/stateless';
import { cachingLesson } from './scaling/caching';
import { cdnLesson } from './scaling/cdn';
import { sqlNosqlLesson } from './storage/sql-nosql';
import { indexesLesson } from './storage/indexes';
import { storageEnginesLesson } from './storage/storage-engines';
import { replicationLesson } from './storage/replication';
import { shardingLesson } from './storage/sharding';
import { javaVirtualThreadsLesson } from './specialized/java-virtual-threads';
import { javaJvmMemoryLesson } from './specialized/java-jvm-memory';
import { javaSpringIocLesson } from './specialized/java-spring-ioc';
import { javaSpringAopLesson } from './specialized/java-spring-aop';
import { javaSpringJpaLesson } from './specialized/java-spring-jpa';
import { javaSpringSecurityLesson } from './specialized/java-spring-security';
import { sqlEngineLesson } from './specialized/sql-engine';
import { microservicesLesson } from './architecture/microservices';
import { awsCloudLesson } from './cloud/aws-cloud';
import { awsVpcLesson } from './cloud/aws-vpc';
import { awsHaLesson } from './cloud/aws-ha';
import { awsStorageDbLesson } from './cloud/aws-storage-db';
import { awsServerlessLesson } from './cloud/aws-serverless';
import { awsIamKmsLesson } from './cloud/aws-iam-kms';
import { awsHybridNetworkLesson } from './cloud/aws-hybrid-network';
import { awsEdgeSecurityLesson } from './cloud/aws-edge-security';
import { awsComputeMigrationLesson } from './cloud/aws-compute-migration';
import { systemDesignLesson } from './cloud/system-design';
import { consistentHashingLesson } from './storage/consistent-hashing';
import { uniqueIdsLesson } from './storage/unique-ids';
import { capLesson } from './storage/cap';
import { consensusLesson } from './storage/consensus';
import { transactionsLesson } from './storage/transactions';
import { filesLesson } from './storage/files';
import { apisLesson } from './communication/apis';
import { queuesLesson } from './communication/queues';
import { pubsubLesson } from './communication/pubsub';
import { realtimeLesson } from './communication/realtime';
import { redundancyLesson } from './reliability/redundancy';
import { rateLimitingLesson } from './reliability/rate-limiting';
import { timeoutsRetriesLesson } from './reliability/timeouts-retries';
import { observabilityLesson } from './reliability/observability';
import { serviceDiscoveryLesson } from './architecture/service-discovery';
import { sagasLesson } from './architecture/sagas';
import { batchStreamLesson } from './architecture/batch-stream';
import { authenticationLesson } from './security/authentication';
import { authorizationLesson } from './security/authorization';
import { encryptionLesson } from './security/encryption';
import { testingLesson } from './shipping/testing';
import { cicdLesson } from './shipping/cicd';
import { hldLldLesson } from './design/hld-lld';
import { designUrlShortenerLesson } from './design/design-url-shortener';
import { designNewsFeedLesson } from './design/design-news-feed';
import { designChatLesson } from './design/design-chat';


// SQL deep-dive concepts
import { sqlExecutionOrderLesson } from './storage/sql-execution-order';
import { sqlComplexQueriesLesson } from './storage/sql-complex-queries';
import { mysqlInnodbLesson } from './storage/mysql-innodb';
import { sqlFootprintLesson } from './storage/sql-footprint';
import { sqlConnectionPoolLesson } from './storage/sql-connection-pool';

// Java Core & JVM deep-dive concepts
import { javaTypesBoxingLesson } from './specialized/java-types-boxing';
import { javaStringInternalsLesson } from './specialized/java-string-internals';
import { javaCollectionsLesson } from './specialized/java-collections';
import { javaIoNioLesson } from './specialized/java-io-nio';
import { javaJdbcLesson } from './specialized/java-jdbc';
import { javaLambdaLesson } from './specialized/java-lambda';
import { javaMetaprogrammingLesson } from './specialized/java-metaprogramming';
import { javaJmmCasAqsLesson } from './specialized/java-jmm-cas-aqs';
import { javaClassloaderLesson } from './specialized/java-classloader';
import { javaCoreApisLesson } from './specialized/java-core-apis';

// Spring Enterprise concepts
import { javaSpringMvcLesson } from './specialized/java-spring-mvc';
import { javaSpringActuatorTestingLesson } from './specialized/java-spring-actuator-testing';

// Containers & Kubernetes (k8s.sim)
import { dockerInternalsLesson } from './cloud/docker-internals';
import { dockerImagesStorageLesson } from './cloud/docker-images-storage';
import { k8sControlPlaneLesson } from './cloud/k8s-control-plane';
import { k8sWorkerNodeLesson } from './cloud/k8s-worker-node';
import { k8sNetworkingCniLesson } from './cloud/k8s-networking-cni';
import { k8sServicesIngressLesson } from './cloud/k8s-services-ingress';
import { k8sStorageCsiLesson } from './cloud/k8s-storage-csi';
import { k8sAutoscalingHpaLesson } from './cloud/k8s-autoscaling-hpa';

// Network & Web Scale Deep-Dive
import { tcpInternalsLesson } from './network/tcp-internals';
import { tlsHandshakeLesson } from './network/tls-handshake';
import { httpEvolutionLesson } from './network/http-evolution';
import { dnsAnycastLesson } from './network/dns-anycast';
import { websocketRealtimeProtocolsLesson } from './network/websocket-realtime-protocols';
import { reverseProxyL4L7Lesson } from './network/reverse-proxy-l4-l7';
import { networkSecurityDdosLesson } from './network/network-security-ddos';

// Redis In-Memory & Caching Internals
import { redisEventLoopLesson } from './storage/redis-event-loop';
import { redisDataStructuresLesson } from './storage/redis-data-structures';
import { redisSortedSetsLesson } from './storage/redis-sorted-sets';
import { redisPersistenceRdbAofLesson } from './storage/redis-persistence-rdb-aof';
import { redisMemoryEvictionLesson } from './storage/redis-memory-eviction';
import { redisClusterShardingLesson } from './storage/redis-cluster-sharding';

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
import { gitEnvironmentsLifecycleLesson } from './git/git-environments-lifecycle';
import { gitCommandsTaxonomyLesson } from './git/git-commands-taxonomy';
import { gitBranchingWorkflowsLesson } from './git/git-branching-workflows';
import { gitDagObjectsLesson } from './git/git-dag-objects';
import { gitRefsSymbolicLesson } from './git/git-refs-symbolic';
import { gitDetachedHeadReflogLesson } from './git/git-detached-head-reflog';
import { gitWorktreesConcurrencyLesson } from './git/git-worktrees-concurrency';
import { gitThreeWayDiff3Lesson } from './git/git-three-way-diff3';
import { gitRerereEngineLesson } from './git/git-rerere-engine';
import { gitRebaseOntoSurgeryLesson } from './git/git-rebase-onto-surgery';
import { gitCrlfLineEndingsLesson } from './git/git-crlf-line-endings';
import { gitIndexLockStashLesson } from './git/git-index-lock-stash';
import { gitBisectAutomationLesson } from './git/git-bisect-automation';
import { gitSubmoduleSubtreeLesson } from './git/git-submodule-subtree';

// Angular Simulation Tracks (Track 11 - 12 Canonical Lessons)
import { angularFlowLesson } from './angular/angular-flow';
import { angularArchitectureOverviewLesson } from './angular/angular-architecture-overview';
import { angularComponentLifecycleLesson } from './angular/angular-component-lifecycle';
import { angularServicesDiLesson } from './angular/angular-services-di';
import { angularHttpInterceptorsLesson } from './angular/angular-http-interceptors';
import { angularReactiveFormsLesson } from './angular/angular-reactive-forms';
import { angularRouterPipelineLesson } from './angular/angular-router-pipeline';
import { angularIvyIncrementalDomLesson } from './angular/angular-ivy-incremental-dom';
import { angularZonejsDirtyCheckingLesson } from './angular/angular-zonejs-dirty-checking';
import { angularRxjsReactivityLesson } from './angular/angular-rxjs-reactivity';
import { angularSignalsDagLesson } from './angular/angular-signals-dag';
import { angularNgrxStateLesson } from './angular/angular-ngrx-state';
import { angularControlFlowLesson } from './angular/angular-control-flow';
import { angularHydrationReplayLesson } from './angular/angular-hydration-replay';

// DevOps Simulation Tracks (Track 12)
import { devopsCultureSilosLesson } from './devops/devops-culture-silos';
import { cicdToolsEvolutionLesson } from './devops/cicd-tools-evolution';
import { cicdPipelineInternalsLesson } from './devops/cicd-pipeline-internals';
import { gitopsArgocdLesson } from './devops/gitops-argocd';
import { devopsDoraMetricsLesson } from './devops/devops-dora-metrics';

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
