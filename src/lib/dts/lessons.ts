// @ts-nocheck
/* eslint-disable */
/**
 * DTS Architecture Lab Lessons Barrel
 * Re-exports all domain lesson modules and provides ALL_DTS_LESSONS map.
 */

import { requestLifecycleLesson } from './lessons/network/request-lifecycle';
import { latencyThroughputLesson } from './lessons/network/latency-throughput';
import { napkinMathLesson } from './lessons/network/napkin-math';
import { verticalHorizontalLesson } from './lessons/scaling/vertical-horizontal';
import { loadBalancingLesson } from './lessons/scaling/load-balancing';
import { statelessLesson } from './lessons/scaling/stateless';
import { cachingLesson } from './lessons/scaling/caching';
import { cdnLesson } from './lessons/scaling/cdn';
import { sqlNosqlLesson } from './lessons/storage/sql-nosql';
import { indexesLesson } from './lessons/storage/indexes';
import { storageEnginesLesson } from './lessons/storage/storage-engines';
import { replicationLesson } from './lessons/storage/replication';
import { shardingLesson } from './lessons/storage/sharding';
import { javaConcurrencyLesson } from './lessons/specialized/java-concurrency';
import { sqlEngineLesson } from './lessons/specialized/sql-engine';
import { microservicesLesson } from './lessons/architecture/microservices';
import { awsCloudLesson } from './lessons/cloud/aws-cloud';
import { awsVpcLesson } from './lessons/cloud/aws-vpc';
import { awsHaLesson } from './lessons/cloud/aws-ha';
import { awsStorageDbLesson } from './lessons/cloud/aws-storage-db';
import { awsServerlessLesson } from './lessons/cloud/aws-serverless';
import { systemDesignLesson } from './lessons/cloud/system-design';
import { consistentHashingLesson } from './lessons/storage/consistent-hashing';
import { uniqueIdsLesson } from './lessons/storage/unique-ids';
import { capLesson } from './lessons/storage/cap';
import { consensusLesson } from './lessons/storage/consensus';
import { transactionsLesson } from './lessons/storage/transactions';
import { filesLesson } from './lessons/storage/files';
import { apisLesson } from './lessons/communication/apis';
import { queuesLesson } from './lessons/communication/queues';
import { pubsubLesson } from './lessons/communication/pubsub';
import { realtimeLesson } from './lessons/communication/realtime';
import { redundancyLesson } from './lessons/reliability/redundancy';
import { rateLimitingLesson } from './lessons/reliability/rate-limiting';
import { timeoutsRetriesLesson } from './lessons/reliability/timeouts-retries';
import { observabilityLesson } from './lessons/reliability/observability';
import { serviceDiscoveryLesson } from './lessons/architecture/service-discovery';
import { sagasLesson } from './lessons/architecture/sagas';
import { batchStreamLesson } from './lessons/architecture/batch-stream';
import { authenticationLesson } from './lessons/security/authentication';
import { authorizationLesson } from './lessons/security/authorization';
import { encryptionLesson } from './lessons/security/encryption';
import { testingLesson } from './lessons/shipping/testing';
import { cicdLesson } from './lessons/shipping/cicd';
import { hldLldLesson } from './lessons/design/hld-lld';
import { designUrlShortenerLesson } from './lessons/design/design-url-shortener';
import { designNewsFeedLesson } from './lessons/design/design-news-feed';
import { designChatLesson } from './lessons/design/design-chat';

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
  javaConcurrencyLesson,
  sqlEngineLesson,
  microservicesLesson,
  awsCloudLesson,
  awsVpcLesson,
  awsHaLesson,
  awsStorageDbLesson,
  awsServerlessLesson,
  systemDesignLesson,
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
};

export const ALL_DTS_LESSONS: Record<string, any> = {
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


