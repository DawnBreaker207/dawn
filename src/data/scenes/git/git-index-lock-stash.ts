// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitIndexLockStashLesson = {
  id: 'git-index-lock-stash',
  title: 'Git Index Lock, Stash & Working Tree Rescue',
  summary: 'Resolve fatal: Unable to create \'.git/index.lock\' without corrupting the index, manage Git stash stack architectures, and recover unmerged files.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['indexLockFile', 'stashConflict', 'stashState', 'unmergedFiles'],
  legend: ['flow', ['crash', 'orphaned lockfile'], ['clean', 'unlocked index'], ['stash', 'stash stack LIFO']],
  goals: [
    { text: 'Diagnosing the ghost index.lock blocker: Why Git creates lockfiles', step: 1 },
    { text: 'Auditing active processes: Distinguishing live processes from dead ghosts', step: 2 },
    { text: 'Safe surgical removal: Clearing stale lockfiles without corruption', step: 3 },
    { text: 'Git stash internals: The dual-commit stash stack architecture', step: 4 },
    { text: 'Restoring dirty working state: git stash pop vs git stash apply', step: 5 },
    { text: 'Resolving stash apply conflicts and untracked file preservation', step: 6 },
  ],
  steps: [
    {
      short: 'Ghost index.lock',
      chapter: 'problem',
      title: 'fatal: Unable to create \'.git/index.lock\': File exists',
      body: [
        'An IDE indexing plugin or background AI agent process crashes midway through a commit or rebase, leaving behind <code>.git/index.lock</code>.',
        'Now every subsequent Git command immediately aborts: <em>fatal: Unable to create \'.git/index.lock\': File exists. Another git process seems to be running.</em>',
      ],
      callout: {
        kind: 'warning',
        text: 'The lockfile exists to guarantee atomic index updates. But if the owning process dies unexpectedly, the lockfile becomes a permanent ghost blocker.',
      },
      metrics: { indexLockFile: 'Ghost lockfile present', stashConflict: 'None', stashState: 'Clean', unmergedFiles: '0' },
      scene: {
        entities: {
          crashedAgent: y(-7, 7, { label: 'Crashed Agent', tags: [{ text: 'killed PID 4821', tone: 'rose', icon: 'terminal' }] }),
          ghostLock: d(0, 0, { s: 5.2, h: 56, color: 'rose', glyph: 'shield', label: ['index.lock'], sub: 'ghost mutex' }),
          blockedIndex: b(7, -7, { s: 4.8, h: 50, color: 'slab', glyph: 'database', label: ['.git/index'], sub: 'locked staging' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Index Lock Collision Error', [
            `$ git commit -m "update config"`,
            `fatal: Unable to create '/repo/.git/index.lock': File exists.`,
            `Another git process seems to be running in this repository,`,
            `e.g. an editor or background task. If that process crashed,`,
            `you may remove the lock file manually.`,
          ], { icon: 'terminal' }),
        },
        links: {
          cg: h('crashedAgent', 'ghostLock', ['crashedAgent', 'ghostLock'], { label: 'orphaned lock' }),
          gb: h('ghostLock', 'blockedIndex', ['ghostLock', 'blockedIndex'], { label: 'locks cache' }),
        },
        flows: [{ route: ['cg', 'gb'], kind: 'crash', rate: 1.5 }],
      },
    },
    {
      short: 'Process Audit',
      chapter: 'technique',
      title: 'Auditing Active Processes Before Deleting Lockfiles',
      body: [
        'Never blindly run <code>rm .git/index.lock</code> without checking whether a real Git process is still writing to disk!',
        'Run <code>ps aux | grep git</code> or <code>lsof .git/index.lock</code>. If a legitimate process (like a large repack) is still running, deleting the lock will corrupt the index.',
      ],
      callout: {
        kind: 'tip',
        text: 'Check file creation timestamp. If the lock was created 3 hours ago and no git PID is in ps aux, it is safely verified as a dead ghost.',
      },
      changes: ['+ Process audit confirms owning PID 4821 is dead'],
      metrics: { indexLockFile: 'Dead ghost verified', stashConflict: 'None', stashState: 'Clean', unmergedFiles: '0' },
      scene: {
        entities: {
          procAuditor: y(-7, 7, { label: 'PID Checker', tags: [{ text: 'ps aux | grep git', tone: 'cyan', icon: 'terminal' }] }),
          lsofEngine: d(0, 0, { s: 5.2, h: 56, color: 'blue', glyph: 'cpu', label: ['lsof Checker'], sub: '0 file handles' }),
          staleLock: d(7, -7, { s: 5.0, h: 54, color: 'amber', glyph: 'shield', label: ['Stale Lockfile'], sub: 'safe to delete' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Process Audit Inspection', [
            `$ ps aux | grep -i git`,
            `dawn 1234 0.0 grep --color=auto git  # No active Git process!`,
            `$ lsof .git/index.lock`,
            `# Empty output: zero active process file descriptors`,
            `$ ls -l --time-style=+%s .git/index.lock`,
            `-rw-r--r-- 1 dawn staff 0 1700000000 (orphaned 4 hours ago)`,
            `= Confirmed: 100% safe to remove`,
          ], { icon: 'terminal' }),
        },
        links: {
          pl: h('procAuditor', 'lsofEngine', ['procAuditor', 'lsofEngine'], { label: 'audit PIDs' }),
          ls: h('lsofEngine', 'staleLock', ['lsofEngine', 'staleLock'], { label: 'confirm dead' }),
        },
        flows: [{ route: ['pl', 'ls'], kind: 'clean', rate: 1.5 }],
      },
    },
    {
      short: 'Safe Removal',
      chapter: 'execution',
      title: 'Safely Removing index.lock and Restoring Git CLI',
      body: [
        'Having verified that no process owns the file, remove it cleanly: <code>rm -f .git/index.lock</code>.',
        'Run <code>git status</code> to verify index integrity. Git immediately executes without errors.',
      ],
      callout: {
        kind: 'insight',
        text: 'The index file itself was untouched; removing the lock simply released the atomic filesystem lock.',
      },
      changes: ['+ .git/index.lock deleted', '+ git status operational'],
      metrics: { indexLockFile: 'Unlocked & Healthy', stashConflict: 'None', stashState: 'Ready', unmergedFiles: '0' },
      scene: {
        entities: {
          rmCmd: y(-7, 7, { label: 'Lock Remover', tags: [{ text: 'rm index.lock', tone: 'green', icon: 'terminal' }] }),
          unlockedIndex: b(0, 0, { r: 2.2, h: 50, color: 'blue', glyph: 'database', label: ['.git/index'], sub: 'lock released' }),
          healthyCli: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['git status OK'], sub: 'pipeline free' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Safe Lockfile Removal', [
            `$ rm -f .git/index.lock`,
            `$ git status`,
            `On branch main`,
            `Changes not staged for commit:`,
            `  modified:   src/app.ts`,
            `= Lock cleared: Zero corruption to index contents`,
          ], { icon: 'terminal' }),
        },
        links: {
          ru: h('rmCmd', 'unlockedIndex', ['rmCmd', 'unlockedIndex'], { label: 'remove lock' }),
          uh: h('unlockedIndex', 'healthyCli', ['unlockedIndex', 'healthyCli'], { label: 'status OK' }),
        },
        flows: [{ route: ['ru', 'uh'], kind: 'clean', rate: 1.6 }],
      },
    },
    {
      short: 'Stash Internals',
      chapter: 'setup',
      title: 'Git Stash Architecture: Dual-Commit Stack',
      body: [
        'Running <code>git stash push -m "WIP auth"</code> does not create temporary patch files; it creates <b>real Git commits</b> stored in a LIFO stack.',
        'A stash entry consists of TWO commits: one for the staged index changes, and one for the unstaged working tree changes.',
      ],
      callout: {
        kind: 'tip',
        text: 'Because stash entries are commits, you can inspect them with standard git log or git cat-file commands: git log --graph --oneline stash@{0}.',
      },
      changes: ['+ Stash commit created at refs/stash', '+ Working directory cleanly reset to HEAD'],
      metrics: { indexLockFile: 'Clean', stashConflict: 'None', stashState: 'stash@{0} pushed', unmergedFiles: '0' },
      scene: {
        entities: {
          stashCmd: y(-7, 7, { label: 'Stash Pusher', tags: [{ text: 'git stash push', tone: 'green', icon: 'terminal' }] }),
          stashStack: b(0, 0, { r: 2.2, h: 50, color: 'green', glyph: 'package', label: ['stash@{0}'], sub: 'LIFO stack' }),
          workingTree: d(7, -7, { s: 5.0, h: 54, color: 'blue', glyph: 'boxes', label: ['Clean Worktree'], sub: 'reset to HEAD' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Stash Architecture Dump', [
            `$ git stash push -m "WIP auth"`,
            `Saved working directory and index state WIP on main: 7d9e44`,
            `$ git cat-file -p stash@{0}`,
            `tree 8a3f91...`,
            `parent 7d9e44 (HEAD)`,
            `parent 9f4a12 (index commit)`,
            `= Dual parent commit seals stash cleanly`,
          ], { icon: 'terminal' }),
        },
        links: {
          ss: h('stashCmd', 'stashStack', ['stashCmd', 'stashStack'], { label: 'push stack' }),
          sw: h('stashStack', 'workingTree', ['stashStack', 'workingTree'], { label: 'clean worktree' }),
        },
        flows: [{ route: ['ss', 'sw'], kind: 'stash', rate: 1.5 }],
      },
    },
    {
      short: 'Stash Pop',
      chapter: 'execution',
      title: 'Restoring Work: git stash pop vs git stash apply',
      body: [
        '<code>git stash apply</code> restores changes but keeps the entry on the stash stack. <code>git stash pop</code> restores changes and automatically drops the entry if no conflicts occur.',
        'Always prefer <code>apply</code> when you want to verify tests pass before dropping the backup stash entry.',
      ],
      callout: {
        kind: 'insight',
        text: 'If git stash pop encounters a conflict, it deliberately DOES NOT drop the stash entry, ensuring you have a safe fallback.',
      },
      changes: ['+ Stashed changes applied to working tree', '+ Stash entry preserved until conflict resolved'],
      metrics: { indexLockFile: 'Clean', stashConflict: 'Checked', stashState: 'Applied', unmergedFiles: '0' },
      scene: {
        entities: {
          popCmd: y(-7, 7, { label: 'Stash Popper', tags: [{ text: 'git stash pop', tone: 'cyan', icon: 'terminal' }] }),
          stashStack: b(0, 0, { r: 2.2, h: 50, color: 'green', glyph: 'package', label: ['stash@{0}'], sub: 'eval drop' }),
          restoredTree: d(7, -7, { s: 5.0, h: 54, color: 'amber', glyph: 'boxes', label: ['Restored WIP'], sub: 'reapplied' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Stash Pop Output', [
            `$ git stash pop`,
            `Auto-merging src/app.ts`,
            `On branch main`,
            `Changes not staged for commit:`,
            `  modified:   src/app.ts`,
            `Dropped refs/stash@{0} (a5b8c9...)`,
            `= Clean restoration of dirty state`,
          ], { icon: 'terminal' }),
        },
        links: {
          ps: h('popCmd', 'stashStack', ['popCmd', 'stashStack'], { label: 'pop entry' }),
          sr: h('stashStack', 'restoredTree', ['stashStack', 'restoredTree'], { label: 'reapply diffs' }),
        },
        flows: [{ route: ['ps', 'sr'], kind: 'stash', rate: 1.6 }],
      },
    },
    {
      short: 'Untracked Stash',
      chapter: 'scaling',
      title: 'Stashing Untracked Files (git stash -u)',
      body: [
        'Standard <code>git stash</code> completely ignores untracked new files! If you create <code>src/new-service.ts</code> and stash, that file is left dirty on disk.',
        'Use <code>git stash -u</code> (or <code>--include-untracked</code>) or <code>git stash -a</code> (all including .gitignore). This builds a 3-parent stash commit that preserves untracked files.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always use git stash -u when switching branches to work on a hotfix so new untracked files don\'t bleed across branches.',
      },
      changes: ['+ Untracked files included in 3-parent stash commit', '+ 100% pristine directory guarantee'],
      metrics: { indexLockFile: 'Clean', stashConflict: 'Resolved', stashState: 'Fully stashed (-u)', unmergedFiles: '0' },
      scene: {
        entities: {
          untrackedCmd: y(-7, 7, { label: 'Stash -u', tags: [{ text: 'git stash -u', tone: 'green', icon: 'terminal' }] }),
          stash3Parent: b(0, 0, { r: 2.2, h: 50, color: 'purple', glyph: 'package', label: ['3-Parent Stash'], sub: 'with untracked' }),
          pristineTree: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['Pristine Disk'], sub: '0 untracked' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Untracked Stash Architecture', [
            `$ git stash -u -m "auth + new files"`,
            `Saved working directory and index state...`,
            `Commit 1: HEAD parent`,
            `Commit 2: Staged index parent`,
            `Commit 3: Untracked files parent`,
            `= Complete isolation: Zero untracked clutter`,
          ], { icon: 'terminal' }),
        },
        links: {
          us: h('untrackedCmd', 'stash3Parent', ['untrackedCmd', 'stash3Parent'], { label: 'stash untracked' }),
          sp: h('stash3Parent', 'pristineTree', ['stash3Parent', 'pristineTree'], { label: 'clean disk' }),
        },
        flows: [{ route: ['us', 'sp'], kind: 'clean', rate: 1.6 }],
      },
    },
  ],
};
