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
          crashedAgent: y(-18, -6, { label: 'Crashed Agent', tags: [{ text: 'killed PID 4821', tone: 'rose', icon: 'terminal' }] }),
          ghostLock: d(-6, -2, { s: 4.4, h: 56, color: 'rose', glyph: 'shield', label: ['index.lock'], sub: 'ghost mutex' }),
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
        },
        flows: [{ route: ['cg'], kind: 'crash', rate: 1.5 }],
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
          crashedAgent: y(-18, -6, { label: 'PID Checker', tags: [{ text: 'ps aux | grep git', tone: 'cyan', icon: 'terminal' }] }),
          ghostLock: d(-6, -2, { s: 4.4, h: 56, color: 'amber', glyph: 'shield', label: ['Stale Lockfile'], sub: 'dead PID 4821' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Process Audit Inspection', [
            `$ ps aux | grep git`,
            `# Output: No active git processes found running`,
            `$ lsof .git/index.lock`,
            `# Output: 0 open file descriptors`,
            `= Safe to delete without risk of repo corruption!`,
          ], { icon: 'terminal' }),
        },
        links: {
          cg: h('crashedAgent', 'ghostLock', ['crashedAgent', 'ghostLock'], { label: 'audited dead' }),
        },
        flows: [{ route: ['cg'], kind: 'crash', rate: 1.5 }],
      },
    },
    {
      short: 'Surgical Removal',
      chapter: 'technique',
      title: 'Safe Surgical Removal of Orphaned Lockfile',
      body: [
        'With the process verified dead, remove the lockfile: <code>rm -f .git/index.lock</code>.',
        'The staging area <code>.git/index</code> is immediately unlocked and operational again.',
      ],
      callout: {
        kind: 'insight',
        text: 'Git index itself was untouched because index.lock had not completed its atomic rename step before crashing.',
      },
      changes: ['+ .git/index.lock safely deleted', '+ .git/index restored to full read/write state'],
      metrics: { indexLockFile: 'Removed (clean)', stashConflict: 'None', stashState: 'Clean', unmergedFiles: '0' },
      scene: {
        entities: {
          crashedAgent: y(-18, -6, { label: 'Dev Laptop', tags: [{ text: 'rm index.lock', tone: 'green', icon: 'terminal' }] }),
          stagedIndex: b(-6, -2, { r: 2.2, h: 52, color: 'blue', glyph: 'database', label: ['.git/index'], sub: 'staging cache' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Lock Cleared & Status Clean', [
            `$ rm -f .git/index.lock`,
            `$ git status`,
            `On branch main`,
            `Changes to be committed:`,
            `  modified:   src/server.ts`,
            `= Lock successfully cleared, index healthy!`,
          ], { icon: 'terminal' }),
        },
        links: {
          cs: h('crashedAgent', 'stagedIndex', ['crashedAgent', 'stagedIndex'], { label: 'unlock staging' }),
        },
        flows: [{ route: ['cs'], kind: 'clean', rate: 1.5 }],
      },
    },
    {
      short: 'Stash Internals',
      chapter: 'technique',
      title: 'Git Stash Internals: The Dual-Commit Stack',
      body: [
        'Need to switch branches urgently while working tree is dirty? Run <code>git stash push -m "wip auth"</code>.',
        'Under the hood, Git does not save a flat patch file! It creates <b>two distinct commit objects</b>: one for the staged index, and one for the unstaged working tree.',
      ],
      callout: {
        kind: 'tip',
        text: 'Run git log --graph --oneline stash@{0} to see the dual-parent stash DAG structure with your own eyes.',
      },
      changes: ['+ Dirty working state captured in dual-commit stash object', '+ Stash ref pushed onto LIFO stack ref: refs/stash'],
      metrics: { indexLockFile: 'Clean', stashConflict: 'None', stashState: '1 stash entry', unmergedFiles: '0' },
      scene: {
        entities: {
          crashedAgent: y(-18, -6, { label: 'Dev Laptop', tags: [{ text: 'git stash push', tone: 'cyan', icon: 'terminal' }] }),
          stagedIndex: b(-6, -2, { r: 2.2, h: 52, color: 'blue', glyph: 'database', label: ['.git/index'], sub: 'staging cache' }),
          stashStack: d(6, 0, { s: 4.4, h: 56, color: 'amber', glyph: 'boxes', label: ['Stash Stack'], sub: 'stash@{0} LIFO' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Stash Dual-Commit Architecture', [
            `$ git stash push -m "wip payment logic"`,
            `Saved working directory and index state WIP on main: e8a1b2c`,
            `$ git cat-file -p stash@{0}`,
            `tree a1b2c3d...`,
            `parent 7d9e44 (HEAD)`,
            `parent 4d5e6f (index commit)`,
            `= Dual commits preserve index vs working tree separation`,
          ], { icon: 'terminal' }),
        },
        links: {
          cs: h('crashedAgent', 'stagedIndex', ['crashedAgent', 'stagedIndex'], { label: 'stage snapshot' }),
          ss: h('stagedIndex', 'stashStack', ['stagedIndex', 'stashStack'], { label: 'push to stash@{0}' }),
        },
        flows: [{ route: ['cs', 'ss'], kind: 'stash', rate: 1.6 }],
      },
    },
    {
      short: 'Clean Working Tree',
      chapter: 'execution',
      title: 'Clean Working Tree: Zero Collision Risk',
      body: [
        'With working files stashed, the working tree is pristine. <code>git status</code> reports <em>working tree clean</em>.',
        'You can now run <code>git pull --rebase</code>, checkout release branches, or run emergency hotfixes without file conflict.',
      ],
      callout: {
        kind: 'insight',
        text: 'A clean working tree eliminates 100% of "error: Your local changes would be overwritten by checkout".',
      },
      changes: ['+ Working tree completely cleaned', '+ Ready for branch switching or rebase'],
      metrics: { indexLockFile: 'Clean', stashConflict: 'None', stashState: 'Stored in LIFO', unmergedFiles: '0' },
      scene: {
        entities: {
          crashedAgent: y(-18, -6, { label: 'Dev Laptop', tags: [{ text: 'working clean', tone: 'green', icon: 'terminal' }] }),
          stagedIndex: b(-6, -2, { r: 2.2, h: 52, color: 'blue', glyph: 'database', label: ['.git/index'], sub: 'clean staging' }),
          stashStack: d(6, 0, { s: 4.4, h: 56, color: 'amber', glyph: 'boxes', label: ['Stash Stack'], sub: 'stash@{0} LIFO' }),
          cleanWorkingTree: d(18, 4, { s: 4.4, h: 56, color: 'green', glyph: 'shield', label: ['Working Tree'], sub: 'clean tree' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Pristine Working State', [
            `$ git status`,
            `On branch main`,
            `nothing to commit, working tree clean`,
            `$ git pull --rebase origin main`,
            `Current branch main is up to date.`,
            `= Zero collision risk during branch operations`,
          ], { icon: 'terminal' }),
        },
        links: {
          cs: h('crashedAgent', 'stagedIndex', ['crashedAgent', 'stagedIndex'], { label: 'status clean' }),
          ss: h('stagedIndex', 'stashStack', ['stagedIndex', 'stashStack'], { label: 'preserve stash' }),
          sc: h('stashStack', 'cleanWorkingTree', ['stashStack', 'cleanWorkingTree'], { label: 'clean disk' }),
        },
        flows: [{ route: ['cs', 'ss', 'sc'], kind: 'clean', rate: 1.5 }],
      },
    },
    {
      short: 'Stash Pop',
      chapter: 'scaling',
      title: 'Restoring State: git stash pop vs apply',
      body: [
        'When your urgent task is complete, restore your in-progress work: <code>git stash pop</code> applies the changes and removes the entry from the stash stack.',
        'Use <code>git stash pop --index</code> to restore your staged index state exactly as it was before stashing.',
      ],
      callout: {
        kind: 'tip',
        text: 'git stash apply keeps the stash in the stack; git stash pop deletes it if the merge succeeded cleanly.',
      },
      changes: ['+ Stash state reapplied cleanly to working files', '+ Stash entry popped from stack'],
      metrics: { indexLockFile: 'Clean', stashConflict: '0 conflicts', stashState: 'Popped (empty)', unmergedFiles: '0' },
      scene: {
        entities: {
          crashedAgent: y(-18, -6, { label: 'Dev Laptop', tags: [{ text: 'git stash pop', tone: 'green', icon: 'terminal' }] }),
          stagedIndex: b(-6, -2, { r: 2.2, h: 52, color: 'blue', glyph: 'database', label: ['.git/index'], sub: 'clean staging' }),
          stashStack: d(6, 0, { s: 4.4, h: 56, color: 'amber', glyph: 'boxes', label: ['Stash Stack'], sub: 'stash@{0} LIFO' }),
          cleanWorkingTree: d(18, 4, { s: 4.4, h: 56, color: 'green', glyph: 'shield', label: ['Working Tree'], sub: 'restored work' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Stash Pop Output', [
            `$ git stash pop --index`,
            `On branch main`,
            `Changes to be committed:`,
            `  modified:   src/server.ts`,
            `Changes not staged for commit:`,
            `  modified:   src/auth.ts`,
            `Dropped refs/stash@{0} (a1b2c3d...)`,
            `= All staged and unstaged work restored flawlessly!`,
          ], { icon: 'terminal' }),
        },
        links: {
          cs: h('crashedAgent', 'stagedIndex', ['crashedAgent', 'stagedIndex'], { label: 'pop command' }),
          ss: h('stagedIndex', 'stashStack', ['stagedIndex', 'stashStack'], { label: 'pop entry' }),
          sc: h('stashStack', 'cleanWorkingTree', ['stashStack', 'cleanWorkingTree'], { label: 'restore diffs' }),
        },
        flows: [{ route: ['cs', 'ss', 'sc'], kind: 'clean', rate: 1.6 }],
      },
    },
  ],
};
