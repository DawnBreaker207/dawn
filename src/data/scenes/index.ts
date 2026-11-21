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
  'java': javaConcurrencyLesson,
};

export const ALL_DTS_LESSONS = ALL_SCENES;
