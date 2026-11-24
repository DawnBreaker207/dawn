// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDb as b,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitWorktreesConcurrencyLesson = {
  id: 'git-worktrees-concurrency',
  title: 'Case 2: Multi-Agent Parallelism with Git Worktrees',
  summary: 'How multiple AI agents (Claude Code, Agy, OpenCode) work concurrently on different branches of a 10GB repo using git worktree without duplicate clones.',
  minutes: 16,
  level: 'advanced',
  metrics: ['worktreeCount', 'sharedObjectStore', 'diskSavings', 'lockStatus'],
  legend: ['shared', ['agent', 'isolated workspace'], ['lock', 'branch lockout']],
  goals: [
    { text: 'The problem with concurrent agents sharing one working directory', step: 1 },
    { text: 'git worktree add: spinning up independent workspaces backed by one .git', step: 2 },
    { text: 'Branch lockouts: why two worktrees cannot checkout the same branch', step: 3 },
    { text: 'Cleaning up and pruning stale agent worktrees with git worktree prune', step: 4 },
  ],
  steps: [
    {
      short: 'Agent Collision',
      chapter: 'problem',
      title: 'The Multi-Agent Concurrency Collision',
      body: [
        'When Agent A (fixing backend auth) and Agent B (updating frontend UI) execute simultaneously on the same cloned repository, they conflict over <code>.git/index</code> and <code>.git/HEAD</code>.',
        'If Agent A runs <code>git checkout feature-auth</code> while Agent B is writing files, Agent B’s working tree gets ripped out or corrupted.',
      ],
      callout: {
        kind: 'warn',
        text: 'A standard Git clone can only have ONE branch checked out in its working tree at a time.',
      },
      metrics: { worktreeCount: '1 (conflicted)', sharedObjectStore: 'Shared', diskSavings: '0 GB', lockStatus: 'Collision' },
      scene: {
        entities: {
          agentA: d(-10, -4, { color: 'rose', glyph: 'terminal', label: ['Agent A (Auth)'], sub: 'running git checkout' }),
          agentB: d(-10, 4, { color: 'rose', glyph: 'terminal', label: ['Agent B (UI)'], sub: 'writing files' }),
          sharedDir: d(4, 0, { color: 'amber', glyph: 'alert', label: ['Single Working Dir'], sub: 'COLLISION: HEAD thrashing' }),
        },
        links: {
          as: h('agentA', 'sharedDir', ['agentA', 'sharedDir'], { label: 'checkout auth' }),
          bs: h('agentB', 'sharedDir', ['agentB', 'sharedDir'], { label: 'checkout ui' }),
        },
        flows: [{ route: ['as'], rate: 1.5 }],
      },
    },
    {
      short: 'Worktree Architecture',
      chapter: 'solution',
      title: 'git worktree add: Isolated Workspaces, Shared Storage',
      body: [
        'Instead of cloning the 10GB repository twice, we run: <code>git worktree add ../agent-ui feature-ui</code>.',
        'Git creates a lightweight separate directory with its own working tree and dedicated <code>.git</code> file pointer (e.g. <code>gitdir: /main-repo/.git/worktrees/agent-ui</code>), while sharing the central <code>.git/objects</code> store.',
      ],
      callout: {
        kind: 'insight',
        text: 'Worktrees take seconds to create, require near-zero extra disk for history, and allow complete parallel build/test execution.',
      },
      changes: ['+ New directory ../agent-ui created', '+ Dedicated index and HEAD in .git/worktrees/agent-ui', '+ Shared 10GB object store unchanged'],
      metrics: { worktreeCount: '2 (isolated)', sharedObjectStore: 'Shared .git/objects', diskSavings: '9.8 GB saved', lockStatus: 'Clean' },
      scene: {
        entities: {
          mainRepo: d(0, 0, { s: 5.0, h: 52, color: 'slab', glyph: 'gitBranch', label: ['Central .git Store'], sub: 'shared objects & config' }),
          wtA: d(-10, -5, { color: 'green', glyph: 'terminal', label: ['Workspace A (main)'], sub: 'Agent A: auth branch' }),
          wtB: d(-10, 5, { color: 'purple', glyph: 'terminal', label: ['Workspace B (agent-ui)'], sub: 'Agent B: ui branch' }),
          zWt: x({ x0: -12, x1: 8, y0: -8, y1: 8 }, 'GIT WORKTREE CONCURRENCY ENGINE'),
        },
        links: {
          am: h('wtA', 'mainRepo', ['wtA', 'mainRepo'], { heads: 'both', label: 'worktree pointer' }),
          bm: h('wtB', 'mainRepo', ['wtB', 'mainRepo'], { heads: 'both', label: 'worktree pointer' }),
        },
        flows: [
          { route: ['am'], kind: 'agent', rate: 1.2 },
          { route: ['bm'], kind: 'agent', rate: 1.2 },
        ],
      },
    },
    {
      short: 'Pruning Stale Worktrees',
      chapter: 'technique',
      title: 'Lockouts & Pruning Stale Worktrees',
      body: [
        'Rule: Git strictly prohibits checking out the same branch in two different worktrees simultaneously to prevent state divergence.',
        'When an agent finishes and deletes its directory via <code>rm -rf ../agent-ui</code>, Git’s administrative metadata remains in <code>.git/worktrees/</code>. Running <code>git worktree prune</code> cleans up dead references automatically.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always run git worktree prune in CI or agent teardown scripts to release branch checkout locks.',
      },
      changes: ['+ Stale metadata cleared', '+ Branch feature-ui unlocked for checkout elsewhere'],
      metrics: { worktreeCount: '1 (pruned)', sharedObjectStore: 'Clean', diskSavings: 'Maximized', lockStatus: 'Unlocked' },
      scene: {
        entities: {
          mainRepo: d(0, 0, { s: 4.8, h: 48, color: 'green', glyph: 'gitBranch', label: ['Central .git Store'], sub: 'clean state' }),
          cmd: d(-10, 0, { color: 'blue', glyph: 'terminal', label: ['git worktree prune'], sub: 'reaps dead pointers' }),
        },
        links: {
          cm: h('cmd', 'mainRepo', ['cmd', 'mainRepo'], { label: 'clean /worktrees/' }),
        },
        flows: [{ route: ['cm'], rate: 1.5 }],
      },
    },
  ],
};
