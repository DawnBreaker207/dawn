// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitWorktreesConcurrencyLesson = {
  id: 'git-worktrees-concurrency',
  title: 'Git Worktrees: Multi-Branch Local Concurrency',
  summary: 'Eliminate context switching friction and repo bloat by checking out multiple branches simultaneously in isolated directories linked to a single Git object store.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['worktreeCount', 'sharedObjectStore', 'diskSavings', 'lockStatus'],
  legend: ['flow', ['shared', 'shared object store'], ['isolated', 'private worktree'], ['lock', 'branch lockfile']],
  goals: [
    { text: 'The multi-agent concurrency collision: 1 repo, 1 index, 1 HEAD', step: 1 },
    { text: 'Spawning linked worktrees with git worktree add', step: 2 },
    { text: 'Per-worktree private index and private HEAD architecture', step: 3 },
    { text: 'Branch mutual exclusion: Preventing duplicate checkouts', step: 4 },
    { text: 'Parallel development: Building, testing, and committing concurrently', step: 5 },
    { text: 'Pruning stale worktrees with git worktree prune', step: 6 },
  ],
  steps: [
    {
      short: 'Agent Collision',
      chapter: 'problem',
      title: 'The Multi-Agent Concurrency Collision',
      body: [
        'When Agent A (fixing backend auth) and Agent B (updating frontend UI) execute simultaneously on the same cloned repository, they conflict over <code>.git/index</code> and <code>.git/HEAD</code>.',
        'Agent A runs <code>git checkout feature-a</code>, causing Agent B’s running compilation to fail or commit to the wrong branch.',
      ],
      callout: {
        kind: 'warning',
        text: 'A standard Git repository has only one index and one HEAD pointer. Concurrent workers collide immediately without isolation.',
      },
      metrics: { worktreeCount: '1 (shared)', sharedObjectStore: 'Single repo', diskSavings: '0 GB', lockStatus: 'Collision risk' },
      scene: {
        entities: {
          agentAlpha: y(-7, 7, { label: 'Agent Alpha', tags: [{ text: 'checkout auth', tone: 'blue', icon: 'terminal' }] }),
          sharedRepo: d(0, 0, { s: 5.2, h: 56, color: 'rose', glyph: 'alert', label: ['Single Repo'], sub: 'index lock' }),
          agentBravo: y(7, -7, { label: 'Agent Bravo', tags: [{ text: 'checkout ui', tone: 'amber', icon: 'terminal' }] }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Concurrency Deadlock', [
            `Agent A: $ git checkout feature-auth`,
            `Agent B: $ git commit -m "update UI"`,
            `fatal: Unable to create '.git/index.lock': File exists.`,
            `! HEAD switched while Agent B was building`,
            `= Race condition corrupts developer state`,
          ], { icon: 'terminal' }),
        },
        links: {
          as: h('agentAlpha', 'sharedRepo', ['agentAlpha', 'sharedRepo'], { label: 'fight for index' }),
          bs: h('agentBravo', 'sharedRepo', ['agentBravo', 'sharedRepo'], { label: 'lock collision' }),
        },
        flows: [{ route: ['as', 'bs'], kind: 'lock', rate: 1.5 }],
      },
    },
    {
      short: 'Worktree Add',
      chapter: 'setup',
      title: 'git worktree add: Instant Isolated Workspaces',
      body: [
        'Instead of cloning a 10GB repo a second time, we run <code>git worktree add ../wt-auth feature-auth</code>.',
        'Git creates an independent folder with its own working files and a tiny <code>.git</code> text pointer linking back to the primary repository’s <code>.git/worktrees/wt-auth</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Worktrees share the exact same .git/objects/ store. Zero extra disk space is consumed for commit and blob storage!',
      },
      changes: ['+ New linked worktree created at ../wt-auth', '+ Shares all objects and refs with primary repo'],
      metrics: { worktreeCount: '2 worktrees', sharedObjectStore: '10GB (shared)', diskSavings: '10GB saved', lockStatus: 'Isolated' },
      scene: {
        entities: {
          mainRepo: d(-7, 7, { s: 5.0, h: 54, color: 'blue', glyph: 'boxes', label: ['Main Worktree'], sub: '/repo (main)' }),
          coreObjects: b(0, 0, { r: 2.2, h: 50, color: 'purple', glyph: 'database', label: ['.git/objects'], sub: 'shared storage' }),
          wtAuth: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'terminal', label: ['Auth Worktree'], sub: '/wt-auth' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Worktree Creation CLI', [
            `$ git worktree add ../wt-auth feature-auth`,
            `Preparing worktree (checking out 'feature-auth')`,
            `HEAD is now at 7d9e44 feat: initial auth`,
            `$ cat ../wt-auth/.git`,
            `gitdir: /repo/.git/worktrees/wt-auth`,
            `= Instant creation: 0 network transfer, 0 object duplication`,
          ], { icon: 'terminal' }),
        },
        links: {
          mc: h('mainRepo', 'coreObjects', ['mainRepo', 'coreObjects'], { label: 'shares store' }),
          wc: h('wtAuth', 'coreObjects', ['wtAuth', 'coreObjects'], { label: 'linked store' }),
        },
        flows: [{ route: ['mc', 'wc'], kind: 'shared', rate: 1.5 }],
      },
    },
    {
      short: 'Private State',
      chapter: 'execution',
      title: 'Per-Worktree Private Index and HEAD Architecture',
      body: [
        'Inside <code>.git/worktrees/wt-auth/</code>, Git maintains a dedicated <b>index</b>, <b>HEAD</b>, and <b>orig-head</b> for that worktree.',
        'This architectural separation guarantees that Agent A staging files or committing changes in <code>wt-auth</code> never affects Agent B working in <code>wt-ui</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Shared components: .git/objects, .git/refs, .git/config. Private components: index, HEAD, and working tree files.',
      },
      changes: ['+ Private index created for wt-auth', '+ Private HEAD tracking feature-auth branch'],
      metrics: { worktreeCount: '2 active', sharedObjectStore: 'Single .git/objects', diskSavings: '10GB saved', lockStatus: 'No collisions' },
      scene: {
        entities: {
          wtStore: d(-7, 7, { s: 5.0, h: 54, color: 'blue', glyph: 'boxes', label: ['.git/worktrees'], sub: 'wt-auth state' }),
          privateHead: d(0, 0, { s: 5.2, h: 56, color: 'green', glyph: 'gitBranch', label: ['Private HEAD'], sub: 'refs/feat-auth' }),
          coreObjects: b(7, -7, { r: 2.2, h: 50, color: 'purple', glyph: 'database', label: ['.git/objects'], sub: 'shared storage' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Per-Worktree Directory Layout', [
            `.git/worktrees/wt-auth/`,
            `  ├── HEAD (ref: refs/heads/feature-auth)`,
            `  ├── index (private binary staging area)`,
            `  ├── commondir (points to ../..)`,
            `  └── gitdir (points to /wt-auth/.git)`,
            `= Completely private index and HEAD`,
          ], { icon: 'terminal' }),
        },
        links: {
          wp: h('wtStore', 'privateHead', ['wtStore', 'privateHead'], { label: 'private ref' }),
          pc: h('privateHead', 'coreObjects', ['privateHead', 'coreObjects'], { label: 'commit to db' }),
        },
        flows: [{ route: ['wp', 'pc'], kind: 'isolated', rate: 1.5 }],
      },
    },
    {
      short: 'Branch Lockout',
      chapter: 'technique',
      title: 'Branch Mutual Exclusion Protection',
      body: [
        'What happens if Agent B in the main repo attempts to checkout <code>feature-auth</code> while <code>wt-auth</code> has it open?',
        'Git strictly prevents this with an error: <em>fatal: \'feature-auth\' is already checked out at \'/repo/wt-auth\'</em>. This prevents two different working directories from fighting over the same ref.',
      ],
      callout: {
        kind: 'warning',
        text: 'To switch to a branch checked out in another worktree, that worktree must switch to a different branch first, or be detached.',
      },
      changes: ['+ Git blocks concurrent checkouts of the same branch ref', '+ Prevents divergent histories on the same branch name'],
      metrics: { worktreeCount: '2 active', sharedObjectStore: 'Shared', diskSavings: '10GB saved', lockStatus: 'Protected' },
      scene: {
        entities: {
          agentBravo: y(-7, 7, { label: 'Agent Bravo', tags: [{ text: 'checkout auth', tone: 'amber', icon: 'terminal' }] }),
          lockValidator: d(0, 0, { s: 5.2, h: 56, color: 'rose', glyph: 'shield', label: ['Ref Validator'], sub: 'branch locked' }),
          lockedBranch: d(7, -7, { s: 5.0, h: 54, color: 'slab', glyph: 'gitBranch', label: ['feature-auth'], sub: 'locked by auth' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Branch Exclusion Enforcement', [
            `$ git checkout feature-auth`,
            `fatal: 'feature-auth' is already checked out at:`,
            `  '/home/dev/wt-auth'`,
            `Hint: Use 'git checkout --detach' if you only want to inspect`,
            `= Mathematical guarantee: 1 branch checkout per worktree`,
          ], { icon: 'terminal' }),
        },
        links: {
          al: h('agentBravo', 'lockValidator', ['agentBravo', 'lockValidator'], { label: 'check ref' }),
          lb: h('lockValidator', 'lockedBranch', ['lockValidator', 'lockedBranch'], { label: 'blocked by lock' }),
        },
        flows: [{ route: ['al', 'lb'], kind: 'lock', rate: 1.5 }],
      },
    },
    {
      short: 'Parallel Agents',
      chapter: 'execution',
      title: 'Full Parallelism: Test, Build & Commit Concurrently',
      body: [
        'With worktrees active, Agent Alpha runs unit tests in <code>wt-auth</code>, while Agent Bravo compiles frontend assets in <code>wt-ui</code>, and Agent Charlie performs code review on <code>main</code>.',
        'Zero disk write locks, zero compiler cache corruption, and zero git status interference.',
      ],
      callout: {
        kind: 'insight',
        text: 'This is the standard architectural pattern used by multi-agent AI coding systems to run 5+ autonomous agents on one machine.',
      },
      changes: ['+ Multi-agent concurrency running at 100% throughput', '+ CI/CD tests run in parallel locally'],
      metrics: { worktreeCount: '3 concurrent', sharedObjectStore: 'Shared .git', diskSavings: '20GB saved', lockStatus: 'Zero lock contention' },
      scene: {
        entities: {
          wtAuth: d(-7, 7, { s: 5.0, h: 54, color: 'blue', glyph: 'terminal', label: ['wt-auth Test'], sub: 'npm test' }),
          coreHub: b(0, 0, { r: 2.2, h: 50, color: 'purple', glyph: 'database', label: ['.git/ Core'], sub: 'central hub' }),
          wtUi: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'terminal', label: ['wt-ui Build'], sub: 'npm build (ui)' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Parallel Agent Status', [
            `$ git worktree list`,
            `/repo          3f8a12 [main]`,
            `/repo/wt-auth  7d9e44 [feature-auth]`,
            `/repo/wt-ui    a5b8c9 [feature-ui]`,
            `Agent Alpha: npm test (Pass)`,
            `Agent Bravo: npm run build (Success)`,
          ], { icon: 'terminal' }),
        },
        links: {
          ac: h('wtAuth', 'coreHub', ['wtAuth', 'coreHub'], { label: 'commit auth' }),
          bc: h('wtUi', 'coreHub', ['wtUi', 'coreHub'], { label: 'commit ui' }),
        },
        flows: [{ route: ['ac', 'bc'], kind: 'isolated', rate: 1.6 }],
      },
    },
    {
      short: 'Pruning Stale',
      chapter: 'scaling',
      title: 'Pruning Stale Worktrees (git worktree prune)',
      body: [
        'When an agent finishes its task and deletes its directory (<code>rm -rf ../wt-auth</code>), metadata remains behind in <code>.git/worktrees/wt-auth</code>.',
        'Running <code>git worktree prune</code> cleans up stale administrative files, freeing branch references and keeping <code>.git/</code> lean.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always use git worktree remove <path> or run git worktree prune after deleting worktree directories.',
      },
      changes: ['+ Stale metadata cleared from .git/worktrees/', '+ Branch feature-auth unlocked for checkout anywhere'],
      metrics: { worktreeCount: '1 remaining', sharedObjectStore: 'Clean', diskSavings: 'Reclaimed', lockStatus: 'Fully pruned' },
      scene: {
        entities: {
          pruneTrigger: y(-7, 7, { label: 'Directory Del', tags: [{ text: 'rm -rf ../wt-auth', tone: 'rose', icon: 'terminal' }] }),
          pruneEngine: d(0, 0, { s: 5.2, h: 56, color: 'rose', glyph: 'cpu', label: ['worktree prune'], sub: 'clean metadata' }),
          cleanHub: b(7, -7, { s: 4.8, h: 50, color: 'green', glyph: 'database', label: ['Clean .git/'], sub: 'pruned clean' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Worktree Cleanup Commands', [
            `$ git worktree remove ../wt-auth`,
            `# Or if manually deleted:`,
            `$ rm -rf ../wt-auth`,
            `$ git worktree prune -v`,
            `Removing worktrees/wt-auth: gitdir file points to non-existent location`,
            `= Repository returned to pristine single-root state`,
          ], { icon: 'terminal' }),
        },
        links: {
          tp: h('pruneTrigger', 'pruneEngine', ['pruneTrigger', 'pruneEngine'], { label: 'stale dir' }),
          pc: h('pruneEngine', 'cleanHub', ['pruneEngine', 'cleanHub'], { label: 'purge metadata' }),
        },
        flows: [{ route: ['tp', 'pc'], kind: 'shared', rate: 1.5 }],
      },
    },
  ],
};
