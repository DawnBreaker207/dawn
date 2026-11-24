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

export const gitIndexLockStashLesson = {
  id: 'git-index-lock-stash',
  title: 'Case 7: Ghost index.lock & Aborted Stash Pop',
  summary: 'Resolving fatal concurrency collisions: index.lock file exists when background tasks crash, and recovering unmerged files when git stash pop encounters conflicts.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['indexLockFile', 'stashConflict', 'stashState', 'unmergedFiles'],
  legend: ['lock', ['crash', 'interrupted operation'], ['resolve', 'clean state'], ['stash', 'stashed commits']],
  goals: [
    { text: 'Why .git/index.lock exists and how crashed processes orphan it', step: 1 },
    { text: 'Auditing active OS processes before deleting index.lock', step: 2 },
    { text: 'Atomic removal of stale lockfiles to restore repository commands', step: 3 },
    { text: 'The internal 3-commit DAG structure of git stash push', step: 4 },
    { text: 'The aborted stash pop dilemma: why stash is preserved on conflict', step: 5 },
    { text: 'Resolving stash conflicts and explicitly dropping the stash entry', step: 6 },
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
          crashedAgent: d(-10, -18, { s: 4.8, h: 50, color: 'rose', glyph: 'cpu', label: ['Crashed Agent'], sub: 'killed with SIGKILL' }),
          ghostLock: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'boxes', label: ['index.lock'], sub: '.git/index.lock' }),
          blockedUser: d(10, 8, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['Blocked git status'], sub: 'aborts with error' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Index Lock Collision Error', [
            `$ git commit -m "update config"`,
            `fatal: Unable to create '/repo/.git/index.lock': File exists.`,
            `Another git process seems to be running in this repository,`,
            `e.g. an editor or background task. If that process crashed,`,
            `you may remove the lock file manually.`,
          ], { icon: 'terminal' }),
          zLock: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'INDEX LOCKFILE CONCURRENCY BLOCK'),
        },
        links: {
          cg: h('crashedAgent', 'ghostLock', ['crashedAgent', 'ghostLock'], { label: 'orphaned on crash' }),
          gb: h('ghostLock', 'blockedUser', ['ghostLock', 'blockedUser'], { label: 'blocks execution' }),
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
          procAuditor: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['ps aux | grep git'], sub: 'inspect active PIDs' }),
          lsofCheck: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['lsof / fuser'], sub: 'zero open handles' }),
          verifiedGhost: d(10, 8, { s: 4.8, h: 50, color: 'amber', glyph: 'boxes', label: ['Stale Lockfile'], sub: 'safe to delete' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Process Audit Inspection', [
            `$ ps aux | grep -i git`,
            `dawn 1234 0.0 grep --color=auto git  # No active Git process!`,
            `$ lsof .git/index.lock`,
            `# Empty output: zero active process file descriptors`,
            `$ ls -l --time-style=+%s .git/index.lock`,
            `-rw-r--r-- 1 dawn staff 0 1700000000 (orphaned 4 hours ago)`,
            `= Confirmed: 100% safe to remove`,
          ], { icon: 'terminal' }),
          zLock: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'PROCESS AUDIT & HANDLE INSPECTION'),
        },
        links: {
          pl: h('procAuditor', 'lsofCheck', ['procAuditor', 'lsofCheck'], { label: 'inspect handles' }),
          lv: h('lsofCheck', 'verifiedGhost', ['lsofCheck', 'verifiedGhost'], { label: 'confirm dead' }),
        },
        flows: [{ route: ['pl', 'lv'], kind: 'resolve', rate: 1.5 }],
      },
    },
    {
      short: 'Unlock Index',
      chapter: 'execution',
      title: 'Unlocking Index & Restoring Normal Operations',
      body: [
        'With confirmation complete, remove the ghost lock: <code>rm -f .git/index.lock</code>.',
        'Run <code>git status</code> to verify repository health. Git immediately responds with clean output. The staging pipeline is completely unlocked.',
      ],
      callout: {
        kind: 'insight',
        text: 'If your index itself became corrupted during the crash, you can rebuild it by removing .git/index and running git reset HEAD.',
      },
      changes: ['+ .git/index.lock removed', '+ Git commands restored to normal throughput'],
      metrics: { indexLockFile: 'Unlocked (None)', stashConflict: 'None', stashState: 'Active', unmergedFiles: '0' },
      scene: {
        entities: {
          rmCmd: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['rm index.lock'], sub: 'remove stale file' }),
          indexRestored: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'boxes', label: ['.git/index'], sub: 'operational & clean' }),
          gitStatusOk: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['git status (Pass)'], sub: 'repo healthy' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Unlock Verification', [
            `$ rm -f .git/index.lock`,
            `$ git status`,
            `On branch main`,
            `Your branch is up to date with 'origin/main'.`,
            `Changes not staged for commit:`,
            `  modified:   src/auth.ts`,
            `= All Git operations restored successfully`,
          ], { icon: 'terminal' }),
          zLock: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'INDEX UNLOCK & RESTORATION'),
        },
        links: {
          ri: h('rmCmd', 'indexRestored', ['rmCmd', 'indexRestored'], { label: 'delete lock' }),
          ig: h('indexRestored', 'gitStatusOk', ['indexRestored', 'gitStatusOk'], { label: 'verify status' }),
        },
        flows: [{ route: ['ri', 'ig'], kind: 'resolve', rate: 1.6 }],
      },
    },
    {
      short: 'Stash Architecture',
      chapter: 'setup',
      title: 'The Internal DAG Architecture of git stash',
      body: [
        'You need to pull urgent bugfixes, so you stash your dirty work: <code>git stash push -u -m "wip: auth"</code>.',
        'Under the hood, Git does NOT create a temporary tar archive! It creates a special Commit object with up to <b>3 parents</b>: 1. Head commit, 2. Staged index snapshot, 3. Untracked files snapshot.',
      ],
      callout: {
        kind: 'insight',
        text: 'A stash is a first-class commit in the Git object database, referenced by .git/refs/stash and tracked in .git/logs/refs/stash.',
      },
      changes: ['+ Stash commit created pointing to HEAD and Index snapshots', '+ Working directory cleaned'],
      metrics: { indexLockFile: 'Clean', stashConflict: 'None', stashState: 'stash@{0} (saved)', unmergedFiles: '0' },
      scene: {
        entities: {
          stashCmd: d(-10, -18, { s: 4.8, h: 50, color: 'purple', glyph: 'terminal', label: ['git stash push'], sub: 'preserve dirty tree' }),
          stashCommit: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'boxes', label: ['stash@{0}'], sub: '3-parent commit' }),
          cleanWorkTree: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Clean Worktree'], sub: 'ready for git pull' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Stash Commit Internals', [
            `$ git stash push -u -m "wip: auth"`,
            `Saved working directory and index state WIP on main: 3f8a12`,
            `$ git cat-file -p refs/stash`,
            `tree 7a8b9c...`,
            `parent 3f8a12... (HEAD commit)`,
            `parent 1f2e3d... (Index state)`,
            `author Developer 1700000000`,
            `WIP on main: 3f8a12 wip: auth`,
          ], { icon: 'terminal' }),
          zLock: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'GIT STASH INTERNAL COMMIT ARCHITECTURE'),
        },
        links: {
          sc: h('stashCmd', 'stashCommit', ['stashCmd', 'stashCommit'], { label: 'seal commit' }),
          sw: h('stashCommit', 'cleanWorkTree', ['stashCommit', 'cleanWorkTree'], { label: 'clean disk' }),
        },
        flows: [{ route: ['sc', 'sw'], kind: 'stash', rate: 1.5 }],
      },
    },
    {
      short: 'Aborted Pop',
      chapter: 'problem',
      title: 'The Aborted Stash Pop Dilemma: Conflict Protection',
      body: [
        'After running <code>git pull</code>, you restore your edits with <code>git stash pop</code>. But the remote changes collide with your stashed edits in <code>auth.ts</code>!',
        'Git stops and reports a merge conflict. Notice a crucial safeguard: <b>Git deliberately keeps stash@{0} in the stash list!</b> It does NOT drop it.',
      ],
      callout: {
        kind: 'warning',
        text: 'Git keeps the stash entry on conflict to prevent data loss. If you make a mistake while resolving the conflict, your stash is still 100% safe.',
      },
      changes: ['+ Conflict encountered during stash apply', '+ stash@{0} preserved in stash stack'],
      metrics: { indexLockFile: 'Clean', stashConflict: 'Conflict in auth.ts', stashState: 'stash@{0} preserved', unmergedFiles: '1 unmerged' },
      scene: {
        entities: {
          stashPop: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['git stash pop'], sub: 'replays diffs' }),
          clashEngine: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'cpu', label: ['Conflict Guard'], sub: 'preserves stash@{0}' }),
          conflictFile: d(10, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'boxes', label: ['auth.ts Conflict'], sub: 'both modified' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Aborted Stash Pop Output', [
            `$ git stash pop`,
            `Auto-merging src/auth.ts`,
            `CONFLICT (content): Merge conflict in src/auth.ts`,
            `The stash entry is kept in case you need it again.`,
            `$ git stash list`,
            `stash@{0}: WIP on main: 3f8a12 wip: auth  # STILL HERE!`,
          ], { icon: 'terminal' }),
          zLock: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ABORTED STASH POP CONFLICT PROTECTION'),
        },
        links: {
          sp: h('stashPop', 'clashEngine', ['stashPop', 'clashEngine'], { label: 'apply stash' }),
          cc: h('clashEngine', 'conflictFile', ['clashEngine', 'conflictFile'], { label: 'mark unmerged' }),
        },
        flows: [{ route: ['sp', 'cc'], kind: 'crash', rate: 1.5 }],
      },
    },
    {
      short: 'Drop Stash',
      chapter: 'execution',
      title: 'Resolving Conflicts & Explicit Stash Drop',
      body: [
        'Resolve the conflict in <code>src/auth.ts</code> and stage it with <code>git add src/auth.ts</code>.',
        'Because Git preserved the stash entry, you must now explicitly drop it using <code>git stash drop stash@{0}</code>. Your stash stack is clean, and your work is safely integrated.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always check git stash list after fixing stash pop conflicts so old resolved stashes don\'t clutter your stack.',
      },
      changes: ['+ Conflict resolved and staged', '+ Stash entry dropped via git stash drop'],
      metrics: { indexLockFile: 'Clean', stashConflict: 'Resolved', stashState: 'Empty (dropped)', unmergedFiles: '0' },
      scene: {
        entities: {
          resolveFix: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['git add auth.ts'], sub: 'stage resolved' }),
          dropCmd: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'terminal', label: ['git stash drop'], sub: 'purge stash@{0}' }),
          cleanRepo: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Pristine Repo'], sub: 'clean stash & status' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Final Stash Cleanup', [
            `$ git add src/auth.ts`,
            `$ git stash drop stash@{0}`,
            `Dropped stash@{0} (7a8b9c...)`,
            `$ git stash list`,
            `# Empty: all stashes cleanly consumed`,
            `$ git commit -m "feat: complete auth feature"`,
          ], { icon: 'terminal' }),
          zLock: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'STASH RESOLUTION & CLEANUP COMPLETE'),
        },
        links: {
          rd: h('resolveFix', 'dropCmd', ['resolveFix', 'dropCmd'], { label: 'conflict cleared' }),
          dc: h('dropCmd', 'cleanRepo', ['dropCmd', 'cleanRepo'], { label: 'drop stash entry' }),
        },
        flows: [{ route: ['rd', 'dc'], kind: 'resolve', rate: 1.6 }],
      },
    },
  ],
};
