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
import { javaConcurrencyLesson } from './specialized/java-concurrency';
import { javaExecutorsLesson } from './specialized/java-executors';
import { javaCompletableLesson } from './specialized/java-completable';
import { javaVirtualThreadsLesson } from './specialized/java-virtual-threads';
import { javaJvmMemoryLesson } from './specialized/java-jvm-memory';
import { javaCollectionsLesson } from './specialized/java-collections';
import { javaStreamsLesson } from './specialized/java-streams';
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
import { sqlExplainLesson } from './storage/sql-explain';
import { sqlFootprintLesson } from './storage/sql-footprint';
import { sqlConnectionPoolLesson } from './storage/sql-connection-pool';

// Java Core & JVM deep-dive concepts
import { javaStringPoolLesson } from './specialized/java-string-pool';
import { javaLambdaLesson } from './specialized/java-lambda';
import { javaIoNioLesson } from './specialized/java-io-nio';
import { javaGenericsLesson } from './specialized/java-generics';
import { javaJitCompilerLesson } from './specialized/java-jit-compiler';
import { javaExceptionsErrorsLesson } from './specialized/java-exceptions-errors';
import { javaMetaprogrammingLesson } from './specialized/java-metaprogramming';
import { javaModernLesson } from './specialized/java-modern';

// Spring Enterprise concepts
import { javaSpringScopesLesson } from './specialized/java-spring-scopes';
import { javaSpringMvcLesson } from './specialized/java-spring-mvc';
import { javaSpringTxLesson } from './specialized/java-spring-tx';
import { javaSpringBootAutoconfigLesson } from './specialized/java-spring-boot-autoconfig';
import { javaSpringTestingLesson } from './specialized/java-spring-testing';
import { javaSpringMessagingLesson } from './specialized/java-spring-messaging';
import { javaSpringConfigLesson } from './specialized/java-spring-config';

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
  systemDesignLesson,
  sqlEngineLesson,
  javaConcurrencyLesson,
  javaExecutorsLesson,
  javaCompletableLesson,
  javaVirtualThreadsLesson,
  javaJvmMemoryLesson,
  javaCollectionsLesson,
  javaStreamsLesson,
  javaSpringIocLesson,
  javaSpringAopLesson,
  javaSpringJpaLesson,
  javaSpringSecurityLesson,
  sqlExplainLesson,
  sqlFootprintLesson,
  sqlConnectionPoolLesson,
  javaStringPoolLesson,
  javaLambdaLesson,
  javaIoNioLesson,
  javaGenericsLesson,
  javaJitCompilerLesson,
  javaExceptionsErrorsLesson,
  javaMetaprogrammingLesson,
  javaModernLesson,
  javaSpringScopesLesson,
  javaSpringMvcLesson,
  javaSpringTxLesson,
  javaSpringBootAutoconfigLesson,
  javaSpringTestingLesson,
  javaSpringMessagingLesson,
  javaSpringConfigLesson,
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
  'system-design': systemDesignLesson,
  'architecture': systemDesignLesson,
  'sql-engine': sqlEngineLesson,
  'sql': sqlEngineLesson,
  'java-concurrency': javaConcurrencyLesson,
  'java-executors': javaExecutorsLesson,
  'java-completable': javaCompletableLesson,
  'java-virtual-threads': javaVirtualThreadsLesson,
  'java-jvm-memory': javaJvmMemoryLesson,
  'java-collections': javaCollectionsLesson,
  'java-streams': javaStreamsLesson,
  'java-spring-ioc': javaSpringIocLesson,
  'java-spring-aop': javaSpringAopLesson,
  'java-spring-jpa': javaSpringJpaLesson,
  'java-spring-security': javaSpringSecurityLesson,
  'sql-explain': sqlExplainLesson,
  'sql-footprint': sqlFootprintLesson,
  'sql-connection-pool': sqlConnectionPoolLesson,
  'java-string-pool': javaStringPoolLesson,
  'java-lambda': javaLambdaLesson,
  'java-io-nio': javaIoNioLesson,
  'java-generics': javaGenericsLesson,
  'java-jit-compiler': javaJitCompilerLesson,
  'java-exceptions-errors': javaExceptionsErrorsLesson,
  'java-metaprogramming': javaMetaprogrammingLesson,
  'java-modern': javaModernLesson,
  'java-spring-scopes': javaSpringScopesLesson,
  'java-spring-mvc': javaSpringMvcLesson,
  'java-spring-tx': javaSpringTxLesson,
  'java-spring-boot-autoconfig': javaSpringBootAutoconfigLesson,
  'java-spring-testing': javaSpringTestingLesson,
  'java-spring-messaging': javaSpringMessagingLesson,
  'java-spring-config': javaSpringConfigLesson,
  'java': javaConcurrencyLesson,
};

export const ALL_DTS_LESSONS = ALL_SCENES;
