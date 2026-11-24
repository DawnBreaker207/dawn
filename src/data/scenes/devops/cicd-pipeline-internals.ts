// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const cicdPipelineInternalsLesson = {
  id: 'cicd-pipeline-internals',
  title: 'Inside Pipeline Runners: Webhooks, MicroVMs & Cache',
  summary: 'Trace what happens under the hood when you git push. Discover webhook HMAC validation, ephemeral runner provisioning (Firecracker microVMs), and dependency cache hydration (S3 key matching).',
  minutes: 25,
  level: 'advanced',
  metrics: ['runnerState', 'webhookAuth', 'cacheMatch', 'artifactStore'],
  legend: ['flow', ['hook', 'webhook delivery'], ['cache', 'cache hydration & store']],
  goals: [
    { text: 'Webhook payload verification via HMAC-SHA256 signature', step: 1 },
    { text: 'Ephemeral runner isolation: Docker containers vs Firecracker microVMs', step: 2 },
    { text: 'Dependency cache hydration, key hashing and fallback', step: 3 },
  ],
  steps: [
    {
      short: 'Webhook HMAC',
      chapter: 'setup',
      title: 'Webhook Dispatch & Cryptographic Verification',
      body: [
        'When code is pushed, the Git provider sends an HTTP POST webhook payload containing the commit SHA, branch, and author.',
        'To prevent spoofing attacks, the receiver computes an <b>HMAC-SHA256</b> hash using a shared secret and compares it with the <code>X-Hub-Signature-256</code> header before placing the job into the runner queue.',
      ],
      callout: {
        kind: 'insight',
        text: 'Timing-safe comparison (crypto.timingSafeEqual) is essential when verifying webhook signatures to prevent timing attacks.',
      },
      metrics: { runnerState: 'Job Queued', webhookAuth: 'HMAC Validated', cacheMatch: 'Pending', artifactStore: 'Idle' },
      scene: {
        entities: {
          gitPush: d(-10, 0, { color: 'amber', glyph: 'terminal', label: ['git push origin main'], sub: 'Emits webhook event' }),
          hmacGate: d(0, 0, { color: 'blue', glyph: 'shield', label: ['Webhook Gateway'], sub: 'Verifies X-Hub-Signature' }),
          jobQueue: d(10, 0, { color: 'purple', glyph: 'database', label: ['Action Job Queue'], sub: 'Redis / SQS backlog' }),
          zHook: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'WEBHOOK AUTHENTICATION & INGESTION'),
        },
        links: {
          gh: h('gitPush', 'hmacGate', ['gitPush', 'hmacGate'], { label: 'POST /webhook' }),
          hj: h('hmacGate', 'jobQueue', ['hmacGate', 'jobQueue'], { label: 'authenticated job' }),
        },
        flows: [{ route: ['gh', 'hj'], kind: 'hook', rate: 1.5 }],
      },
    },
    {
      short: 'Runner Provisioning',
      chapter: 'execution',
      title: 'Ephemeral Runner Boot: MicroVMs & Docker',
      body: [
        'A worker node picks up the queued job and boots an ephemeral execution environment.',
        'Modern enterprise CI utilizes <b>Firecracker microVMs</b> (boots in < 50ms) or fresh Docker containers with cgroup resource limits (CPU, memory, disk quotas).',
        'The runner clones the repository at the specific commit SHA using a shallow fetch (<code>git clone --depth 1</code>) to minimize bandwidth.',
      ],
      callout: {
        kind: 'tip',
        text: 'Ephemeral runners guarantee a hermetic build: leftover files or rogue daemons from previous jobs can never poison subsequent runs.',
      },
      changes: ['+ Booted fresh isolated runner in 38ms', '+ Allocated 4 vCPUs and 16GB RAM limit', '+ Shallow cloned repository commit at depth 1'],
      metrics: { runnerState: 'Runner Active (MicroVM)', webhookAuth: 'Passed', cacheMatch: 'Checking S3...', artifactStore: 'Mounted' },
      scene: {
        entities: {
          poolManager: d(-10, 0, { color: 'purple', glyph: 'boxes', label: ['Runner Pool Manager'], sub: 'Autoscales VM instances' }),
          microVm: d(0, 0, { color: 'green', glyph: 'cpu', label: ['Firecracker MicroVM'], sub: 'Boot time: 38ms | KVM isolation' }),
          gitWorkspace: d(10, 0, { color: 'blue', glyph: 'terminal', label: ['/github/workspace'], sub: 'Shallow git clone (depth 1)' }),
          zRunner: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'EPHEMERAL RUNNER ALLOCATION'),
        },
        links: {
          pm: h('poolManager', 'microVm', ['poolManager', 'microVm'], { label: 'spawn VM' }),
          mw: h('microVm', 'gitWorkspace', ['microVm', 'gitWorkspace'], { label: 'mount clean disk' }),
        },
        flows: [{ route: ['pm', 'mw'], kind: 'hook', rate: 1.8 }],
      },
    },
    {
      short: 'Cache Hydration',
      chapter: 'solution',
      title: 'Dependency Cache Hydration & Artifact Export',
      body: [
        'Without caching, every run downloads thousands of npm or maven dependencies, wasting 80% of CI time. The runner hashes lockfiles (<code>hashFiles("**/package-lock.json")</code>) into a unique cache key.',
        'It pulls the compressed tarball from cloud storage (S3/GCS). If there is an exact key match, dependencies are extracted instantly. If missed, it falls back to prefix keys.',
        'Compiled production bundles and test reports are published as immutable artifacts before the runner VM is destroyed.',
      ],
      callout: {
        kind: 'insight',
        text: 'Cache keys are immutable in cloud storage. If lockfiles change, a new key is written rather than overwriting existing caches.',
      },
      changes: ['+ Cache key matched: npm-linux-x64-sha256(lockfile)', '+ Downloaded and unpacked 180MB node_modules in 2.1s', '+ Uploaded test artifacts to S3; microVM cleanly wiped'],
      metrics: { runnerState: 'Job Success (Wiped)', webhookAuth: 'Passed', cacheMatch: 'EXACT HIT (Saved 4m)', artifactStore: 'Artifacts Persisted' },
      scene: {
        entities: {
          lockfileHash: d(-10, 0, { color: 'cyan', glyph: 'shield', label: ['Lockfile Key Hash'], sub: 'npm-v1-9f8e4b...' }),
          s3Cache: d(0, 0, { color: 'amber', glyph: 'database', label: ['Cloud Cache Store (S3)'], sub: 'Direct CDN stream' }),
          nodeModules: d(10, 0, { color: 'green', glyph: 'package', label: ['node_modules / target'], sub: 'Hydrated in 2.1s' }),
          zCache: x({ x0: -12, x1: 12, y0: -5, y1: 5 }, 'CACHE HYDRATION PIPELINE'),
        },
        links: {
          ls: h('lockfileHash', 's3Cache', ['lockfileHash', 's3Cache'], { label: 'query cache key' }),
          sn: h('s3Cache', 'nodeModules', ['s3Cache', 'nodeModules'], { label: 'stream & extract' }),
        },
        flows: [{ route: ['ls', 'sn'], kind: 'cache', rate: 2.0 }],
      },
    },
  ],
};
