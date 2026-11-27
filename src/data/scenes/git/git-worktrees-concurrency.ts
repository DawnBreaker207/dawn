import {
  makeBlock,
  makeDb,
  makeLink,
  makePanel
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
          mainWorktree: makeBlock(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'boxes', label: ['Main Worktree'], sub: '/repo (main)' }),
          sharedObjects: makeDb(-6, -2, { r: 2.2, h: 52, color: 'purple', glyph: 'database', label: ['.git/objects'], sub: 'shared storage' }),
          card: makePanel({ x: -14, y: 0, dx: -20, dy: -180 }, 'Concurrency Deadlock', [
            `Agent A: $ git checkout feature-auth`,
            `Agent B: $ git commit -m "update UI"`,
            `fatal: Unable to create '.git/index.lock': File exists.`,
            `! HEAD switched while Agent B was building`,
            `= Race condition corrupts developer state`,
          ], { icon: 'terminal' }),
        },
        links: {
          ms: makeLink('mainWorktree', 'sharedObjects', ['mainWorktree', 'sharedObjects'], { label: 'read/write objects' }),
        },
        flows: [{ route: ['ms'], kind: 'shared', rate: 1.5 }],
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
          mainWorktree: makeBlock(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'boxes', label: ['Main Worktree'], sub: '/repo (main)' }),
          sharedObjects: makeDb(-6, -2, { r: 2.2, h: 52, color: 'purple', glyph: 'database', label: ['.git/objects'], sub: 'shared storage' }),
          authWorktree: makeBlock(6, 0, { s: 4.4, h: 56, color: 'green', glyph: 'terminal', label: ['Auth Worktree'], sub: '/wt-auth' }),
          card: makePanel({ x: -14, y: 0, dx: -20, dy: -180 }, 'Worktree Creation CLI', [
            `$ git worktree add ../wt-auth feature-auth`,
            `Preparing worktree (checking out 'feature-auth')`,
            `HEAD is now at 7d9e44a feat: init auth controller`,
            `$ cat ../wt-auth/.git`,
            `gitdir: /repo/.git/worktrees/wt-auth`,
            `= Created in 0.05 seconds with zero object duplication!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ms: makeLink('mainWorktree', 'sharedObjects', ['mainWorktree', 'sharedObjects'], { label: 'read objects' }),
          as: makeLink('authWorktree', 'sharedObjects', ['authWorktree', 'sharedObjects'], { label: 'share objects' }),
        },
        flows: [{ route: ['as'], kind: 'isolated', rate: 1.5 }],
      },
    },
    {
      short: 'Private HEAD',
      chapter: 'technique',
      title: 'Private Index & Private HEAD Architecture',
      body: [
        'How does Git prevent workers from stepping on each other? Inside <code>.git/worktrees/wt-auth/</code>, Git maintains a <b>private index</b>, <b>private HEAD</b>, and <b>private logs</b>.',
        'Worktree A can commit, rebase, and switch branches without disturbing Worktree B in the slightest.',
      ],
      callout: {
        kind: 'tip',
        text: 'The shared common directory (.git/worktrees/wt-auth/commondir) points to the central repo for refs and objects.',
      },
      changes: ['+ Private .git/worktrees/wt-auth/HEAD created', '+ Private index staging file isolated per worktree'],
      metrics: { worktreeCount: '2 worktrees', sharedObjectStore: 'Shared .git', diskSavings: '10GB', lockStatus: 'Private mutex' },
      scene: {
        entities: {
          mainWorktree: makeBlock(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'boxes', label: ['Main Worktree'], sub: 'HEAD: main' }),
          sharedObjects: makeDb(-6, -2, { r: 2.2, h: 52, color: 'purple', glyph: 'database', label: ['.git/objects'], sub: 'shared storage' }),
          authWorktree: makeBlock(6, 0, { s: 4.4, h: 56, color: 'green', glyph: 'terminal', label: ['Auth Worktree'], sub: 'feat-auth HEAD' }),
          card: makePanel({ x: -14, y: 0, dx: -20, dy: -180 }, 'Per-Worktree State Layout', [
            `/repo/.git/worktrees/wt-auth/`,
            `  ├── HEAD        -> ref: refs/heads/feature-auth`,
            `  ├── index       -> private staging cache`,
            `  ├── commondir   -> pointer to root .git`,
            `  └── gitdir      -> path to ../wt-auth/.git`,
            `= Complete isolation for index and working files`,
          ], { icon: 'terminal' }),
        },
        links: {
          ms: makeLink('mainWorktree', 'sharedObjects', ['mainWorktree', 'sharedObjects'], { label: 'isolated HEAD' }),
          as: makeLink('authWorktree', 'sharedObjects', ['authWorktree', 'sharedObjects'], { label: 'isolated HEAD' }),
        },
        flows: [{ route: ['ms', 'as'], kind: 'isolated', rate: 1.6 }],
      },
    },
    {
      short: 'Branch Mutex',
      chapter: 'technique',
      title: 'Branch Mutual Exclusion: Preventing Duplicate Checkouts',
      body: [
        'To prevent two worktrees from writing conflicting commits to the same branch at the same time, Git enforces strict <b>Branch Mutual Exclusion</b>.',
        'Attempting to checkout <code>feature-auth</code> in another worktree fails immediately: <em>fatal: \'feature-auth\' is already checked out at \'/repo/../wt-auth\'</em>.',
      ],
      callout: {
        kind: 'insight',
        text: 'This built-in safety lock prevents split-brain history where two checkouts try to advance the same 41-byte ref.',
      },
      changes: ['+ Branch lock guard active', '+ Duplicate checkouts strictly rejected'],
      metrics: { worktreeCount: '2 worktrees', sharedObjectStore: 'Shared .git', diskSavings: '10GB', lockStatus: 'Branch locked' },
      scene: {
        entities: {
          mainWorktree: makeBlock(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'boxes', label: ['Main Worktree'], sub: 'locked branch' }),
          sharedObjects: makeDb(-6, -2, { r: 2.2, h: 52, color: 'purple', glyph: 'database', label: ['.git/objects'], sub: 'shared storage' }),
          authWorktree: makeBlock(6, 0, { s: 4.4, h: 56, color: 'green', glyph: 'terminal', label: ['Auth Worktree'], sub: 'owns feat-auth' }),
          lockedBranch: makeBlock(18, 4, { s: 4.4, h: 54, color: 'rose', glyph: 'shield', label: ['Branch Mutex'], sub: 'no duplicate' }),
          card: makePanel({ x: -14, y: 0, dx: -20, dy: -180 }, 'Duplicate Checkout Defense', [
            `$ cd /repo`,
            `$ git checkout feature-auth`,
            `fatal: 'feature-auth' is already checked out at '/wt-auth'`,
            `# Git prevents split-brain ref updates automatically`,
            `= 100% safety against branch collisions`,
          ], { icon: 'terminal' }),
        },
        links: {
          ms: makeLink('mainWorktree', 'sharedObjects', ['mainWorktree', 'sharedObjects'], { label: 'attempt checkout' }),
          sa: makeLink('sharedObjects', 'authWorktree', ['sharedObjects', 'authWorktree'], { style: 'dashed', label: 'branch locked' }),
          al: makeLink('authWorktree', 'lockedBranch', ['authWorktree', 'lockedBranch'], { label: 'exclusive lock' }),
        },
        flows: [{ route: ['ms', 'sa', 'al'], kind: 'lock', rate: 1.5 }],
      },
    },
    {
      short: 'Parallel Build',
      chapter: 'execution',
      title: 'Parallel Development: Concurrent Work Across Worktrees',
      body: [
        'Add a third worktree: <code>git worktree add ../wt-ui feat/ui</code>. Now multiple autonomous AI subagents or developers execute simultaneously.',
        'Agent A runs <code>npm test</code> in <code>wt-auth</code>, while Agent B runs <code>npm run build</code> in <code>wt-ui</code>. Zero conflicts, zero waits.',
      ],
      callout: {
        kind: 'tip',
        text: 'Run git worktree list to see all active worktrees and their checked out branch hashes.',
      },
      changes: ['+ Third worktree wt-ui added', '+ Simultaneous parallel compilation across worktrees'],
      metrics: { worktreeCount: '3 worktrees', sharedObjectStore: '10GB (shared)', diskSavings: '20GB saved', lockStatus: '3 concurrent' },
      scene: {
        entities: {
          mainWorktree: makeBlock(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'boxes', label: ['Main Worktree'], sub: '/repo (main)' }),
          sharedObjects: makeDb(-6, -2, { r: 2.2, h: 52, color: 'purple', glyph: 'database', label: ['.git/objects'], sub: 'shared storage' }),
          authWorktree: makeBlock(6, 0, { s: 4.4, h: 56, color: 'green', glyph: 'terminal', label: ['Auth Worktree'], sub: 'building test' }),
          uiWorktree: makeBlock(-4, 16, { s: 4.4, h: 56, color: 'cyan', glyph: 'terminal', label: ['UI Worktree'], sub: 'bundle build' }),
          card: makePanel({ x: -14, y: 0, dx: -20, dy: -180 }, 'Active Worktrees List', [
            `$ git worktree list`,
            `/repo         7d9e44a [main]`,
            `/wt-auth      e8a1b2c [feature-auth]`,
            `/wt-ui        3f8a12d [feature-ui]`,
            `= 3 full working trees backed by 1 single repository`,
          ], { icon: 'terminal' }),
        },
        links: {
          ms: makeLink('mainWorktree', 'sharedObjects', ['mainWorktree', 'sharedObjects'], { label: 'main' }),
          as: makeLink('authWorktree', 'sharedObjects', ['authWorktree', 'sharedObjects'], { label: 'auth commits' }),
          us: makeLink('uiWorktree', 'sharedObjects', ['uiWorktree', 'sharedObjects'], { label: 'ui commits' }),
        },
        flows: [
          { route: ['as'], kind: 'isolated', rate: 1.5 },
          { route: ['us'], kind: 'isolated', rate: 1.5 },
        ],
      },
    },
    {
      short: 'Prune Stale',
      chapter: 'scaling',
      title: 'Pruning Stale Worktrees with git worktree prune',
      body: [
        'When a feature branch is merged and deleted, clean up the worktree folder: <code>git worktree remove ../wt-auth</code> (or <code>rm -rf ../wt-auth</code>).',
        'Running <code>git worktree prune</code> cleans up the administrative files in <code>.git/worktrees/</code>, keeping the repository lean.',
      ],
      callout: {
        kind: 'insight',
        text: 'Worktrees provide the ultimate balance: maximum local concurrency without repository bloat.',
      },
      changes: ['+ Worktree removed and branch merged into main', '+ git worktree prune cleaned up metadata'],
      metrics: { worktreeCount: '1 (cleaned)', sharedObjectStore: 'Clean', diskSavings: 'Restored', lockStatus: 'Clean' },
      scene: {
        entities: {
          mainWorktree: makeBlock(-18, -6, { s: 4.4, h: 56, color: 'green', glyph: 'boxes', label: ['Main Worktree'], sub: '/repo (merged)' }),
          sharedObjects: makeDb(-6, -2, { r: 2.2, h: 52, color: 'purple', glyph: 'database', label: ['.git/objects'], sub: 'clean storage' }),
          card: makePanel({ x: -14, y: 0, dx: -20, dy: -180 }, 'Worktree Cleanup Flow', [
            `$ git worktree remove ../wt-auth`,
            `$ git worktree prune`,
            `$ git worktree list`,
            `/repo    9a8b7c [main]`,
            `= All administrative metadata pruned, repository clean!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ms: makeLink('mainWorktree', 'sharedObjects', ['mainWorktree', 'sharedObjects'], { label: 'prune metadata' }),
        },
        flows: [{ route: ['ms'], kind: 'shared', rate: 1.5 }],
      },
    },
  ],
};
