import {
  makeBlock,
  makeDb,
  makeDevice,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';

export const cicdPipelineInternalsLesson = {
  id: 'cicd-pipeline-internals',
  title: 'Pipeline Runner Internals',
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
          devLaptop: makeDevice(-16, -6, { label: 'dev-laptop', tags: [{ text: 'git push', tone: 'blue', icon: 'zap' }] }),
          webhookGate: makeBlock(-4, -2, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['Webhook Gateway'], sub: 'HMAC verify' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'HTTP POST /api/webhook', [
            `POST /api/webhook/github HTTP/1.1`,
            `Host: ci.company.internal`,
            `X-GitHub-Event: push`,
            `X-Hub-Signature-256: sha256=7a9e4b...`,
            `Content-Type: application/json`,
            `= crypto.timingSafeEqual(sig, expected) -> 200 OK`,
          ], { icon: 'terminal' }),
        },
        links: {
          dw: makeLink('devLaptop', 'webhookGate', ['devLaptop', 'webhookGate'], { label: 'POST webhook' }),
        },
        flows: [{ route: ['dw'], kind: 'hook', rate: 1.5 }],
      },
    },
    {
      short: 'Queue Autoscaler',
      chapter: 'setup',
      title: 'Queue Ingestion & Elastic Runner Provisioning',
      body: [
        'Once validated, the payload is parsed and pushed into an in-memory job queue (Redis Streams or SQS).',
        'An autoscaler monitors queue lag (`pending_jobs > available_runners`) and triggers instant microVM spin-up on bare-metal hypervisors.',
      ],
      callout: {
        kind: 'tip',
        text: 'Autoscaling on queue backlog rather than CPU metrics eliminates cold-start starvation during morning PR rushes.',
      },
      changes: ['+ Webhook payload enqueued into Redis backlog', '+ Autoscaler detected pending build backlog', '+ Provisioned dedicated runner host'],
      metrics: { runnerState: 'Scaling Pool', webhookAuth: 'Verified (200)', cacheMatch: 'Pending', artifactStore: 'Idle' },
      scene: {
        entities: {
          devLaptop: makeDevice(-16, -6, { label: 'dev-laptop', tags: [{ text: 'git push', tone: 'blue', icon: 'zap' }] }),
          webhookGate: makeBlock(-4, -2, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['Webhook Gateway'], sub: 'HMAC verify' }),
          ephemeralRunner: makeBlock(8, 0, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['Runner Pool'], sub: 'spawn workers' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Autoscaler Metrics', [
            `stream: ci:jobs:pending (len=1)`,
            `lag: 140ms | target_capacity: +1`,
            `pool: bare-metal-c6i.4xlarge`,
            `event: runner_spawn_requested`,
            `= Ephemeral runner allocated in pool`,
          ], { icon: 'terminal' }),
        },
        links: {
          dw: makeLink('devLaptop', 'webhookGate', ['devLaptop', 'webhookGate'], { label: 'POST webhook' }),
          we: makeLink('webhookGate', 'ephemeralRunner', ['webhookGate', 'ephemeralRunner'], { label: 'enqueue job' }),
        },
        flows: [{ route: ['dw', 'we'], kind: 'hook', rate: 1.6 }],
      },
    },
    {
      short: 'MicroVM Boot',
      chapter: 'execution',
      title: 'Ephemeral Firecracker Boot & Shallow Clone',
      body: [
        'Rather than shared Docker containers that leak state, modern runners boot an isolated <b>Firecracker microVM</b> in under 40ms via KVM.',
        'The runner executes a shallow clone: <code>git clone --depth 1 --no-tags</code> to pull only the single commit SHA, slashing network transfer from minutes to sub-second.',
      ],
      callout: {
        kind: 'insight',
        text: 'A shallow clone with depth 1 downloads only the required tree objects, cutting repository fetch latency by over 90%.',
      },
      changes: ['+ Firecracker microVM booted in 38ms', '+ Dedicated cgroups & seccomp profile applied', '+ Shallow git clone completed at target SHA'],
      metrics: { runnerState: 'Running (KVM)', webhookAuth: 'Verified', cacheMatch: 'Calculating', artifactStore: 'Idle' },
      scene: {
        entities: {
          devLaptop: makeDevice(-16, -6, { label: 'dev-laptop', tags: [{ text: 'git push', tone: 'blue', icon: 'zap' }] }),
          webhookGate: makeBlock(-4, -2, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['Webhook Gateway'], sub: 'HMAC verify' }),
          ephemeralRunner: makeBlock(8, 0, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['MicroVM Runner'], sub: 'boot 38ms KVM' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Shallow Git Clone Command', [
            `boot_time: 38ms (Firecracker KVM)`,
            `$ git init -q`,
            `$ git remote add origin https://...`,
            `$ git fetch --depth=1 origin 8a2a415`,
            `$ git checkout -q FETCH_HEAD`,
            `= Workspace ready in 410ms`,
          ], { icon: 'terminal' }),
        },
        links: {
          we: makeLink('webhookGate', 'ephemeralRunner', ['webhookGate', 'ephemeralRunner'], { label: 'shallow clone' }),
        },
        flows: [{ route: ['we'], kind: 'build', rate: 1.8 }],
      },
    },
    {
      short: 'Cache Hydration',
      chapter: 'execution',
      title: 'Dependency Cache Key Hashing & S3 Restore',
      body: [
        'Before executing build steps, the runner hashes package manifest lockfiles: <code>hashFiles("**/package-lock.json")</code>.',
        'If a matching archive key exists in the S3 Content-Addressed Store, the runner downloads and un-tars cached <code>node_modules</code> in 2 seconds, bypassing <code>npm install</code> entirely.',
      ],
      callout: {
        kind: 'tip',
        text: 'Fallback cache keys (e.g. key: Linux-npm-${{ hash }}, restore-keys: Linux-npm-) ensure partial cache hits even when dependencies change.',
      },
      changes: ['+ Lockfile SHA-256 computed: 9f8a3c...', '+ Cache HIT in regional S3 CAS store', '+ Hydrated 280MB dependencies in 2.1s'],
      metrics: { runnerState: 'Dependencies Ready', webhookAuth: 'Verified', cacheMatch: 'Cache HIT (2.1s)', artifactStore: 'Idle' },
      scene: {
        entities: {
          devLaptop: makeDevice(-16, -6, { label: 'dev-laptop', tags: [{ text: 'git push', tone: 'blue', icon: 'zap' }] }),
          webhookGate: makeBlock(-4, -2, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['Webhook Gateway'], sub: 'HMAC verify' }),
          ephemeralRunner: makeBlock(8, 0, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['MicroVM Runner'], sub: 'cached 2.1s' }),
          s3Cache: makeDb(-2, 16, { s: 4.6, h: 48, color: 'orange', glyph: 'database', label: ['S3 CAS Cache'], sub: 'S3 CAS store' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Cache Hydration Log', [
            `key: npm-linux-x64-9f8a3c4b...`,
            `GET /cache/npm-linux-x64-9f8a3c4b.tz`,
            `status: 200 OK (Content-Length: 284MB)`,
            `tar -xzf archive.tz -> ./node_modules`,
            `= Cache restored in 2.1s (Saved 4m 12s)`,
          ], { icon: 'terminal' }),
        },
        links: {
          ce: makeLink('s3Cache', 'ephemeralRunner', ['s3Cache', 'ephemeralRunner'], { label: 'restore cache' }),
        },
        flows: [{ route: ['ce'], kind: 'cache', rate: 1.8 }],
      },
    },
    {
      short: 'Parallel Sharding',
      chapter: 'execution',
      title: 'Parallel Matrix Fan-Out & Test Execution',
      body: [
        'To keep feedback loops fast, lengthy test suites are split across multiple isolated shards using duration-based balancing.',
        'Shard 1 runs unit tests, while Shards 2–4 run integration suites concurrently. All shard statuses report back simultaneously.',
      ],
      callout: {
        kind: 'insight',
        text: 'Balancing test splits by previous execution duration prevents long-tail shards from delaying the entire pipeline.',
      },
      changes: ['+ Test matrix partitioned into 4 parallel shards', '+ Dynamic test balancing based on historical runtimes', '+ All 4 shards executing concurrently'],
      metrics: { runnerState: '4 Shards Running', webhookAuth: 'Verified', cacheMatch: 'Cache HIT', artifactStore: 'Building' },
      scene: {
        entities: {
          devLaptop: makeDevice(-16, -6, { label: 'dev-laptop', tags: [{ text: 'git push', tone: 'blue', icon: 'zap' }] }),
          webhookGate: makeBlock(-4, -2, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['Webhook Gateway'], sub: 'HMAC verify' }),
          ephemeralRunner: makeBlock(8, 0, { s: 4.8, h: 50, color: 'green', glyph: 'cpu', label: ['Active Runner'], sub: '4 test shards' }),
          s3Cache: makeDb(-2, 16, { s: 4.6, h: 48, color: 'orange', glyph: 'database', label: ['S3 CAS Cache'], sub: 'S3 CAS store' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'Parallel Shard Status', [
            `shard 1/4: unit-tests        (42s) [PASS]`,
            `shard 2/4: auth-e2e          (58s) [PASS]`,
            `shard 3/4: api-contracts     (39s) [PASS]`,
            `shard 4/4: load-smoke        (51s) [PASS]`,
            `= Total wall-clock time: 58s (vs 3m 10s)`,
          ], { icon: 'terminal' }),
        },
        links: {
          we: makeLink('webhookGate', 'ephemeralRunner', ['webhookGate', 'ephemeralRunner'], { label: 'run shards' }),
          ce: makeLink('s3Cache', 'ephemeralRunner', ['s3Cache', 'ephemeralRunner'], { label: 'cache active' }),
        },
        flows: [{ route: ['we'], kind: 'build', rate: 2.0 }],
      },
    },
    {
      short: 'Wipe & Store',
      chapter: 'solution',
      title: 'Immutable Artifact Export & Secure Runner Teardown',
      body: [
        'Upon successful test completion, the compiled production binaries and container images are cryptographically signed with Sigstore and stored in an immutable S3 bucket.',
        'The Firecracker microVM is immediately destroyed: memory pages are zeroed, cgroups destroyed, and the rootfs discarded to prevent cross-job contamination.',
      ],
      callout: {
        kind: 'insight',
        text: 'Ephemeral runner teardown guarantees that subsequent builds never inherit dirty environment variables or leaked credentials.',
      },
      changes: ['+ Artifact signed via Sigstore cosign', '+ Tarball uploaded to immutable S3 storage', '+ MicroVM destroyed and RAM zeroed in 15ms'],
      metrics: { runnerState: 'Wiped & Clean', webhookAuth: 'Verified', cacheMatch: 'Cache HIT', artifactStore: 'Exported (S3)' },
      scene: {
        entities: {
          devLaptop: makeDevice(-16, -6, { label: 'dev-laptop', tags: [{ text: 'git push', tone: 'blue', icon: 'zap' }] }),
          webhookGate: makeBlock(-4, -2, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['Webhook Gateway'], sub: 'HMAC verify' }),
          ephemeralRunner: makeBlock(8, 0, { s: 4.8, h: 50, color: 'gray', glyph: 'cpu', label: ['Ephemeral Host'], sub: 'zeroed in 15ms' }),
          artifactStore: makeDb(16, 6, { s: 4.6, h: 48, color: 'green', glyph: 'database', label: ['Artifact Store'], sub: 'S3 CAS store' }),
          s3Cache: makeDb(-2, 16, { s: 4.6, h: 48, color: 'orange', glyph: 'database', label: ['S3 CAS Cache'], sub: 'S3 CAS store' }),
          card: makePanel({ x: -14, y: 4, dx: -20, dy: -180 }, 'S3 PutObject Manifest', [
            `$ cosign sign --key k8s://... dist/app.tar.gz`,
            `PUT /builds/8a2a415-release.tar.gz`,
            `Content-SHA256: 3c7a10... (Immutable)`,
            `destroy: virsh destroy microvm-104`,
            `= RAM zeroed in 15ms · Zero leakage`,
          ], { icon: 'terminal' }),
        },
        links: {
          ea: makeLink('ephemeralRunner', 'artifactStore', ['ephemeralRunner', 'artifactStore'], { label: 'export artifact' }),
        },
        flows: [{ route: ['ea'], kind: 'build', rate: 1.5 }],
      },
    },
  ],
};
