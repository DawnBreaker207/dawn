// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const cicdPipelineInternalsLesson = {
  id: 'cicd-pipeline-internals',
  title: 'Inside Pipeline Runners: Webhooks, MicroVMs & Cache',
  summary: 'Trace what happens under the hood when you git push: webhook HMAC validation, ephemeral runner provisioning (Firecracker microVMs), dependency cache hydration (S3 key matching), and immutable artifact export.',
  minutes: 25,
  level: 'advanced',
  metrics: ['runnerState', 'webhookAuth', 'cacheMatch', 'artifactStore'],
  legend: ['flow', ['hook', 'webhook delivery'], ['cache', 'cache hydration'], ['build', 'test execution']],
  goals: [
    { text: 'Webhook HMAC-SHA256 signature verification', step: 1 },
    { text: 'Queue ingestion & runner pool autoscaling', step: 2 },
    { text: 'Ephemeral Firecracker microVM boot & shallow clone', step: 3 },
    { text: 'Dependency cache key hashing & S3 restore', step: 4 },
    { text: 'Parallel test execution & matrix fan-out', step: 5 },
    { text: 'Immutable artifact publishing & secure runner wipe', step: 6 },
  ],
  steps: [
    {
      short: 'Webhook HMAC',
      chapter: 'setup',
      title: 'Webhook Dispatch & Cryptographic Verification',
      body: [
        'When code is pushed, the Git provider sends an HTTP POST webhook payload containing commit metadata, branch refs, and author information.',
        'To prevent spoofing attacks, the receiver computes an <b>HMAC-SHA256</b> hash using a shared secret and compares it against the <code>X-Hub-Signature-256</code> header using constant-time comparison.',
      ],
      callout: {
        kind: 'insight',
        text: 'Timing-safe comparison (crypto.timingSafeEqual) prevents attackers from deducing secrets through millisecond response variations.',
      },
      metrics: { runnerState: 'Job Queued', webhookAuth: 'HMAC Validated', cacheMatch: 'Pending', artifactStore: 'Idle' },
      scene: {
        entities: {
          gitPush: y(-10, -18, { label: 'git-client', tags: [{ text: 'git push origin main', icon: 'terminal' }] }),
          hmacGate: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['Webhook Gateway'], sub: 'Verifies HMAC signature' }),
          jobQueue: b(10, 8, { s: 4.6, h: 48, color: 'purple', glyph: 'database', label: ['Action Job Queue'], sub: 'Redis backlog' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'HTTP POST /api/webhook', [
            `POST /api/webhook/github HTTP/1.1`,
            `Host: ci.company.internal`,
            `X-GitHub-Event: push`,
            `X-Hub-Signature-256: sha256=7a9e4b...`,
            `Content-Type: application/json`,
            `= crypto.timingSafeEqual(sig, expected) -> 200 OK`,
          ], { icon: 'terminal' }),
          zHook: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'WEBHOOK AUTHENTICATION & INGESTION'),
        },
        links: {
          gh: h('gitPush', 'hmacGate', ['gitPush', 'hmacGate'], { label: 'POST webhook' }),
          hj: h('hmacGate', 'jobQueue', ['hmacGate', 'jobQueue'], { label: 'enqueue job' }),
        },
        flows: [{ route: ['gh', 'hj'], kind: 'hook', rate: 1.5 }],
      },
    },
    {
      short: 'Queue Autoscaling',
      chapter: 'execution',
      title: 'Queue Ingestion & Runner Pool Autoscaling',
      body: [
        'The job enters a distributed FIFO queue (Redis / SQS).',
        'An autoscaler monitors queue backlog depth and latency. When load spikes (e.g., 50 developers pushing before standup), it scales up worker instances across AWS EC2 or bare-metal Kubernetes nodes.',
      ],
      callout: {
        kind: 'tip',
        text: 'Autoscaling on queue backlog prevents job queuing delays while keeping cloud compute idle costs near zero overnight.',
      },
      changes: ['+ Job queued in Redis backlog', '+ Queue depth: 12 jobs pending', '+ Autoscaler provisioned 4 additional runner hosts'],
      metrics: { runnerState: 'Scaling Workers', webhookAuth: 'Passed', cacheMatch: 'Pending', artifactStore: 'Idle' },
      scene: {
        entities: {
          queueMonitor: y(-10, -18, { label: 'queue-depth', tags: [{ text: 'Backlog: 12 Jobs', tone: 'amber', icon: 'clock' }] }),
          scalerEngine: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Runner Autoscaler'], sub: 'Spawns worker instances' }),
          workerFleet: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'server', label: ['Worker Fleet'], sub: '16 vCPU hosts active' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Autoscaler Metrics', [
            `metric: runner_queue_depth = 12`,
            `policy: scale_up if queue_depth > 5`,
            `action: Provisioned 4x c6i.2xlarge`,
            `response_time: 1.2s to dispatch`,
            `= Ready to pick up jobs`,
          ], { icon: 'terminal' }),
          zScale: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'RUNNER POOL AUTOSCALING'),
        },
        links: {
          qs: h('queueMonitor', 'scalerEngine', ['queueMonitor', 'scalerEngine'], { label: 'queue depth signal' }),
          sw: h('scalerEngine', 'workerFleet', ['scalerEngine', 'workerFleet'], { label: 'launch EC2 nodes' }),
        },
        flows: [{ route: ['qs', 'sw'], kind: 'hook', rate: 1.6 }],
      },
    },
    {
      short: 'MicroVM Boot & Clone',
      chapter: 'execution',
      title: 'Ephemeral Firecracker Boot & Shallow Git Clone',
      body: [
        'A worker node boots an isolated <b>Firecracker microVM</b> in less than 50ms using Linux KVM virtualization.',
        'Inside the clean guest OS, the runner executes a shallow clone: <code>git clone --depth 1 --no-tags --single-branch</code>, pulling only the exact commit SHA to save gigabytes of bandwidth.',
      ],
      callout: {
        kind: 'insight',
        text: 'A shallow clone with depth 1 downloads only the latest tree and blobs, reducing clone times from minutes to seconds.',
      },
      changes: ['+ Firecracker microVM booted in 38ms', '+ Allocated 4 vCPUs and 8GB RAM cgroup limit', '+ Shallow clone completed in 1.4s'],
      metrics: { runnerState: 'MicroVM Active', webhookAuth: 'Passed', cacheMatch: 'Checking S3...', artifactStore: 'Mounted' },
      scene: {
        entities: {
          hostNode: y(-10, -18, { label: 'metal-host', tags: [{ text: 'Bare Metal Host', icon: 'server' }] }),
          microVm: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'cpu', label: ['Firecracker MicroVM'], sub: 'Boot: 38ms | KVM isolation' }),
          workspace: b(10, 8, { s: 4.6, h: 48, color: 'blue', glyph: 'terminal', label: ['/workspace'], sub: 'git clone --depth 1' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Shallow Git Clone Command', [
            `$ git init /workspace`,
            `$ git remote add origin https://...`,
            `$ git fetch --depth 1 origin 4a9f8e2`,
            `$ git checkout FETCH_HEAD`,
            `Fetched 18.2 MB in 1.4s (saved 95% bandwidth)`,
          ], { icon: 'terminal' }),
          zBoot: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'EPHEMERAL RUNNER BOOT'),
        },
        links: {
          hm: h('hostNode', 'microVm', ['hostNode', 'microVm'], { label: 'spawn microVM' }),
          mw: h('microVm', 'workspace', ['microVm', 'workspace'], { label: 'mount workspace' }),
        },
        flows: [{ route: ['hm', 'mw'], kind: 'hook', rate: 1.8 }],
      },
    },
    {
      short: 'Cache Hydration',
      chapter: 'execution',
      title: 'Dependency Cache Hydration via S3 Key Matching',
      body: [
        'Downloading dependencies from npm or Maven on every build wastes 80% of pipeline time. The runner hashes lockfiles (<code>hashFiles("package-lock.json")</code>) to construct an immutable cache key.',
        'It queries cloud storage (S3/GCS). On an exact key match, the compressed tarball is downloaded and unpacked into <code>node_modules/</code> in seconds.',
      ],
      callout: {
        kind: 'tip',
        text: 'Cloud cache tarballs are immutable. If package-lock.json changes, a new key is written rather than overwriting existing caches.',
      },
      changes: ['+ Cache key matched: npm-linux-x64-sha256(lockfile)', '+ Downloaded 180MB dependencies in 2.1s', '+ Skipped npm install (Saved 4m 30s)'],
      metrics: { runnerState: 'Dependencies Hydrated', webhookAuth: 'Passed', cacheMatch: 'EXACT HIT (Saved 4m)', artifactStore: 'Cached' },
      scene: {
        entities: {
          lockHash: y(-10, -18, { label: 'hash-key', tags: [{ text: 'Key: npm-v1-9f8e4b', tone: 'cyan', icon: 'shield' }] }),
          s3Bucket: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'database', label: ['Cloud Cache (S3)'], sub: '180MB tar.zst' }),
          extractedDir: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'package', label: ['node_modules/'], sub: 'Hydrated in 2.1s' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Cache Hydration Log', [
            `Key: npm-linux-x64-9f8e4b8a7c`,
            `Restoring from cache bucket: s3://ci-cache/`,
            `Downloaded 182,410,291 bytes in 2.1s`,
            `Cache restored successfully.`,
            `= Zero network latency to npm registry`,
          ], { icon: 'terminal' }),
          zCache: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'CACHE HYDRATION PIPELINE'),
        },
        links: {
          ls: h('lockHash', 's3Bucket', ['lockHash', 's3Bucket'], { label: 'query key' }),
          se: h('s3Bucket', 'extractedDir', ['s3Bucket', 'extractedDir'], { label: 'stream & extract' }),
        },
        flows: [{ route: ['ls', 'se'], kind: 'cache', rate: 2.0 }],
      },
    },
    {
      short: 'Matrix Test Fan-Out',
      chapter: 'execution',
      title: 'Parallel Matrix Execution & Test Sharding',
      body: [
        'To test across multiple environments (Node 18 vs 20 vs 22, Ubuntu vs macOS), the workflow engine fans out jobs into a parallel <b>Test Matrix</b>.',
        'Tests are sharded across 4 parallel runners (<code>jest --shard=1/4</code>), slashing total test execution time by 75%.',
      ],
      callout: {
        kind: 'insight',
        text: 'Test sharding divides the test suite deterministically by test duration, preventing any single runner from becoming a bottleneck.',
      },
      changes: ['+ Fanned out 4 parallel test shard runners', '+ Executed 1,200 unit and integration tests', '+ Overall suite runtime cut from 12m to 3m 15s'],
      metrics: { runnerState: 'Testing (4 Shards)', webhookAuth: 'Passed', cacheMatch: 'Active', artifactStore: 'Generating' },
      scene: {
        entities: {
          matrixMaster: y(-10, -18, { label: 'matrix-spec', tags: [{ text: 'Matrix: 4 Shards', icon: 'boxes' }] }),
          shardDistributor: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'balancer', label: ['Shard Splitter'], sub: 'Balances test duration' }),
          parallelRunners: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'cpu', label: ['4x Parallel MicroVMs'], sub: 'Shard 1/4, 2/4, 3/4, 4/4' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Parallel Shard Status', [
            `shard 1/4: 310 tests passed (3m 10s)`,
            `shard 2/4: 295 tests passed (3m 05s)`,
            `shard 3/4: 305 tests passed (3m 12s)`,
            `shard 4/4: 290 tests passed (3m 08s)`,
            `= Total: 1,200 passed in 3m 12s`,
          ], { icon: 'terminal' }),
          zMatrix: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'PARALLEL TEST SHARDING'),
        },
        links: {
          ms: h('matrixMaster', 'shardDistributor', ['matrixMaster', 'shardDistributor'], { label: 'fan-out spec' }),
          sp: h('shardDistributor', 'parallelRunners', ['shardDistributor', 'parallelRunners'], { label: 'dispatch shards' }),
        },
        flows: [{ route: ['ms', 'sp'], kind: 'build', rate: 1.8 }],
      },
    },
    {
      short: 'Artifacts & Wipe',
      chapter: 'solution',
      title: 'Immutable Artifact Export & Secure VM Destruction',
      body: [
        'Compiled production bundles and JUnit test reports are uploaded to S3 with content-addressed hashes.',
        'Finally, the hypervisor destroys the microVM. Its memory pages are zeroed, ensuring no sensitive tokens, SSH keys, or customer data remain on the physical host.',
      ],
      callout: {
        kind: 'tip',
        text: 'Zeroing memory pages upon microVM exit guarantees complete security isolation between sequential tenant jobs.',
      },
      changes: ['+ Uploaded dist/ production bundle to S3', '+ Generated SHA-256 integrity checksum', '+ MicroVM destroyed and RAM zeroed in 15ms'],
      metrics: { runnerState: 'Wiped & Clean', webhookAuth: 'Passed', cacheMatch: 'Stored', artifactStore: 'Persisted to S3' },
      scene: {
        entities: {
          finishedJob: y(-10, -18, { label: 'job-success', tags: [{ text: 'Job Completed', tone: 'green', icon: 'shield' }] }),
          artifactUploader: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'package', label: ['Artifact Uploader'], sub: 'S3 Content-Addressed' }),
          destroyedVm: b(10, 8, { s: 4.6, h: 48, color: 'slab', glyph: 'terminal', label: ['Destroyed MicroVM'], sub: 'RAM zeroed in 15ms' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'S3 PutObject Manifest', [
            `PUT /artifacts/build-8921.tar.gz`,
            `x-amz-checksum-sha256: 3a9f8e4b...`,
            `Size: 24,198,110 bytes`,
            `Status: 200 OK`,
            `Action: firecracker.destroy() -> Memory zeroed`,
          ], { icon: 'terminal' }),
          zWipe: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ARTIFACT PERSISTENCE & CLEANUP'),
        },
        links: {
          fa: h('finishedJob', 'artifactUploader', ['finishedJob', 'artifactUploader'], { label: 'upload build' }),
          ad: h('artifactUploader', 'destroyedVm', ['artifactUploader', 'destroyedVm'], { label: 'reap guest VM' }),
        },
        flows: [{ route: ['fa', 'ad'], kind: 'build', rate: 1.5 }],
      },
    },
  ],
};
