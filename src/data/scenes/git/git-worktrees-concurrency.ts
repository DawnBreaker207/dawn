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

export const gitWorktreesConcurrencyLesson = {
  id: 'git-worktrees-concurrency',
  title: 'Case 2: Multi-Agent Parallelism with Git Worktrees',
  summary: 'How multiple AI agents work concurrently on different branches of a repository using git worktree without duplicate clones or index locks.',
  minutes: 25,
  level: 'advanced',
  metrics: ['worktreeCount', 'sharedObjectStore', 'diskSavings', 'lockStatus'],
  legend: ['shared', ['agent', 'isolated workspace'], ['lock', 'branch lockout'], ['sync', 'shared objects']],
  goals: [
    { text: 'The problem with concurrent agents sharing one working directory', step: 1 },
    { text: 'git worktree add: spinning up independent workspaces backed by one .git', step: 2 },
    { text: 'Per-worktree private index and HEAD architecture', step: 3 },
    { text: 'Branch lockouts: why two worktrees cannot checkout the same branch', step: 4 },
    { text: 'Multi-agent parallel execution without build collision', step: 5 },
    { text: 'Cleaning up and pruning stale agent worktrees with git worktree prune', step: 6 },
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
          agentA: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['Agent Alpha'], sub: 'checkout feat-auth' }),
          sharedDir: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'boxes', label: ['Shared Repo'], sub: '1x .git/index & HEAD' }),
          agentB: d(10, 8, { s: 4.8, h: 50, color: 'amber', glyph: 'cpu', label: ['Agent Bravo'], sub: 'checkout feat-ui' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Concurrency Deadlock', [
            `Agent A: $ git checkout feature-auth`,
            `Agent B: $ git commit -m "update UI"`,
            `fatal: Unable to create '.git/index.lock': File exists.`,
            `! Head switched while Agent B was building`,
            `= Race condition corrupts developer state`,
          ], { icon: 'terminal' }),
          zWt: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'SHARED REPOSITORY WORKSPACE COLLISION'),
        },
        links: {
          as: h('agentA', 'sharedDir', ['agentA', 'sharedDir'], { label: 'locks index' }),
          bs: h('agentB', 'sharedDir', ['agentB', 'sharedDir'], { label: 'index collision' }),
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
          mainRepo: d(-10, -18, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['Main Repo'], sub: '/repo (on main)' }),
          worktreeEngine: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['git worktree'], sub: 'add ../wt-auth' }),
          wtAuth: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['Worktree wt-auth'], sub: '/wt-auth (on auth)' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Worktree Creation CLI', [
            `$ git worktree add ../wt-auth feature-auth`,
            `Preparing worktree (checking out 'feature-auth')`,
            `HEAD is now at 7d9e44 feat: initial auth`,
            `$ cat ../wt-auth/.git`,
            `gitdir: /repo/.git/worktrees/wt-auth`,
            `= Instant creation: 0 network transfer, 0 object duplication`,
          ], { icon: 'terminal' }),
          zWt: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'LINKED WORKTREE GENERATION'),
        },
        links: {
          mw: h('mainRepo', 'worktreeEngine', ['mainRepo', 'worktreeEngine'], { label: 'spawn workspace' }),
          ww: h('worktreeEngine', 'wtAuth', ['worktreeEngine', 'wtAuth'], { label: 'linked worktree' }),
        },
        flows: [{ route: ['mw', 'ww'], kind: 'shared', rate: 1.5 }],
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
          wtStore: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'boxes', label: ['.git/worktrees/'], sub: 'wt-auth private dir' }),
          privateIndex: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['Private Index'], sub: 'wt-auth/.git/index' }),
          sharedObjects: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['.git/objects'], sub: 'shared object store' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Per-Worktree Directory Layout', [
            `.git/worktrees/wt-auth/`,
            `  ├── HEAD (ref: refs/heads/feature-auth)`,
            `  ├── index (private binary staging area)`,
            `  ├── commondir (points to ../..)`,
            `  └── gitdir (points to /wt-auth/.git)`,
            `= Completely private index and HEAD`,
          ], { icon: 'terminal' }),
          zWt: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'PRIVATE WORKTREE STATE ISOLATION'),
        },
        links: {
          wp: h('wtStore', 'privateIndex', ['wtStore', 'privateIndex'], { label: 'isolated index' }),
          ps: h('privateIndex', 'sharedObjects', ['privateIndex', 'sharedObjects'], { label: 'commit to shared DB' }),
        },
        flows: [{ route: ['wp', 'ps'], kind: 'sync', rate: 1.5 }],
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
          agentB: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'cpu', label: ['Agent Bravo'], sub: 'tries checkout' }),
          lockValidator: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'boxes', label: ['Ref Validator'], sub: 'checks worktree refs' }),
          lockedBranch: d(10, 8, { s: 4.8, h: 50, color: 'slab', glyph: 'gitBranch', label: ['feature-auth'], sub: 'LOCKED by wt-auth' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Branch Exclusion Enforcement', [
            `$ git checkout feature-auth`,
            `fatal: 'feature-auth' is already checked out at:`,
            `  '/home/dev/wt-auth'`,
            `Hint: Use 'git checkout --detach' if you only want to inspect`,
            `= Mathematical guarantee: 1 branch checkout per worktree`,
          ], { icon: 'terminal' }),
          zWt: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'BRANCH MUTUAL EXCLUSION CHECK'),
        },
        links: {
          al: h('agentB', 'lockValidator', ['agentB', 'lockValidator'], { label: 'request branch' }),
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
          agentAlpha: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['Agent Alpha'], sub: 'wt-auth (testing)' }),
          agentBravo: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'cpu', label: ['Agent Bravo'], sub: 'wt-ui (building)' }),
          centralGit: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['Core .git'], sub: 'single object repository' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Parallel Agent Status', [
            `$ git worktree list`,
            `/repo          3f8a12 [main]`,
            `/repo/wt-auth  7d9e44 [feature-auth]`,
            `/repo/wt-ui    a5b8c9 [feature-ui]`,
            `Agent Alpha: npm test (Pass)`,
            `Agent Bravo: npm run build (Success)`,
          ], { icon: 'terminal' }),
          zWt: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'CONCURRENT AGENT EXECUTION MESH'),
        },
        links: {
          ac: h('agentAlpha', 'centralGit', ['agentAlpha', 'centralGit'], { label: 'commit auth' }),
          bc: h('agentBravo', 'centralGit', ['agentBravo', 'centralGit'], { label: 'commit ui' }),
        },
        flows: [{ route: ['ac', 'bc'], kind: 'agent', rate: 1.6 }],
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
          remover: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['rm -rf ../wt-auth'], sub: 'delete directory' }),
          pruneEngine: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'cpu', label: ['git worktree prune'], sub: 'clean dead metadata' }),
          cleanRepo: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Clean .git/'], sub: 'stale worktrees purged' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Worktree Cleanup Commands', [
            `$ git worktree remove ../wt-auth`,
            `# Or if manually deleted:`,
            `$ rm -rf ../wt-auth`,
            `$ git worktree prune -v`,
            `Removing worktrees/wt-auth: gitdir file points to non-existent location`,
            `= Repository returned to pristine single-root state`,
          ], { icon: 'terminal' }),
          zWt: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'WORKTREE ADMINISTRATIVE PRUNING'),
        },
        links: {
          rp: h('remover', 'pruneEngine', ['remover', 'pruneEngine'], { label: 'stale directory' }),
          pc: h('pruneEngine', 'cleanRepo', ['pruneEngine', 'cleanRepo'], { label: 'purge metadata' }),
        },
        flows: [{ route: ['rp', 'pc'], kind: 'shared', rate: 1.5 }],
      },
    },
  ],
};
