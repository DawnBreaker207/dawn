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

export const gitDetachedHeadReflogLesson = {
  id: 'git-detached-head-reflog',
  title: 'Case 1: Detached HEAD & Reflog Rescue',
  summary: 'Real-world emergency surgery: recovering orphaned dangling commits after working in detached HEAD using .git/logs/HEAD and git reflog without losing work.',
  minutes: 25,
  level: 'advanced',
  metrics: ['headStatus', 'danglingCommits', 'reflogEntries', 'rescueBranch'],
  legend: ['flow', ['dangle', 'orphaned commit'], ['rescue', 'restored pointer'], ['log', 'reflog history']],
  goals: [
    { text: 'How checkout <hash> triggers Detached HEAD', step: 1 },
    { text: 'Committing in detached HEAD and the risk of checkout main', step: 2 },
    { text: 'Why dangling commits are not immediately deleted (GC grace period)', step: 3 },
    { text: 'Surgical recovery using git reflog and creating a rescue branch', step: 4 },
    { text: 'Validating the rescued commit graph and re-integrating', step: 5 },
    { text: 'Reflog expiration policies: git reflog expire and git prune', step: 6 },
  ],
  steps: [
    {
      short: 'Detached',
      chapter: 'setup',
      title: 'Entering Detached HEAD State',
      body: [
        'An AI agent or engineer runs <code>git checkout c4f1a2</code> to run automated tests on an earlier version. Git warns: <em>You are in "detached HEAD" state.</em>',
        'In this state, <code>.git/HEAD</code> does not point to a branch name (like <code>refs/heads/main</code>); it contains the raw commit SHA itself.',
      ],
      callout: {
        kind: 'insight',
        text: 'Detached HEAD is not an error! It simply means HEAD is pointing directly to a commit object rather than a branch reference.',
      },
      metrics: { headStatus: 'Detached (c4f1a2)', danglingCommits: '0', reflogEntries: '1 checkout', rescueBranch: 'None' },
      scene: {
        entities: {
          head: d(-10, -18, { s: 4.8, h: 50, color: 'rose', glyph: 'terminal', label: ['HEAD Pointer'], sub: '.git/HEAD (raw SHA)' }),
          commit: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Commit c4f1a2'], sub: 'target commit' }),
          mainBranch: d(10, 8, { s: 4.8, h: 50, color: 'slab', glyph: 'gitBranch', label: ['Branch main'], sub: 'points to 7d9e44' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Detached HEAD Status', [
            `$ git checkout c4f1a2`,
            `Note: switching to 'c4f1a2'.`,
            `You are in 'detached HEAD' state.`,
            `$ cat .git/HEAD`,
            `c4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9`,
            `= No branch name, direct raw commit SHA`,
          ], { icon: 'terminal' }),
          zReflog: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'DETACHED HEAD STATE (.GIT/HEAD)'),
        },
        links: {
          hc: h('head', 'commit', ['head', 'commit'], { label: 'direct SHA pointer' }),
        },
        flows: [{ route: ['hc'], rate: 1.4 }],
      },
    },
    {
      short: 'New Commit',
      chapter: 'execution',
      title: 'Committing in Detached HEAD',
      body: [
        'While in detached HEAD, the developer makes a critical bugfix and runs <code>git commit -m "fix: memory leak"</code>.',
        'Git happily creates a new Commit object <code>e8a1b2</code> with parent <code>c4f1a2</code>. HEAD moves forward to <code>e8a1b2</code>, but <b>no branch reference was updated</b>.',
      ],
      callout: {
        kind: 'warning',
        text: 'This commit is completely unanchored! If you switch branches now, HEAD will move away and nothing will point to e8a1b2.',
      },
      changes: ['+ Commit e8a1b2 created', '+ Only HEAD points to e8a1b2; zero branch refs point to it'],
      metrics: { headStatus: 'Detached (e8a1b2)', danglingCommits: '1 vulnerable', reflogEntries: '2 commits', rescueBranch: 'None' },
      scene: {
        entities: {
          head: d(-10, -18, { s: 4.8, h: 50, color: 'rose', glyph: 'terminal', label: ['HEAD Pointer'], sub: 'points to e8a1b2' }),
          newCommit: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'boxes', label: ['Commit e8a1b2'], sub: 'fix: memory leak' }),
          oldCommit: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Commit c4f1a2'], sub: 'parent commit' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Unanchored Commit Creation', [
            `$ git commit -m "fix: memory leak"`,
            `[detached HEAD e8a1b2] fix: memory leak`,
            ` 1 file changed, 14 insertions(+)`,
            `$ cat .git/HEAD`,
            `e8a1b2c49b...`,
            `! Warning: No branch ref tracks this commit`,
          ], { icon: 'terminal' }),
          zReflog: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'UNANCHORED COMMIT IN WORKING TREE'),
        },
        links: {
          hn: h('head', 'newCommit', ['head', 'newCommit'], { label: 'points to new' }),
          no: h('newCommit', 'oldCommit', ['newCommit', 'oldCommit'], { label: 'parent pointer' }),
        },
        flows: [{ route: ['hn', 'no'], kind: 'dangle', rate: 1.5 }],
      },
    },
    {
      short: 'Accidental Loss',
      chapter: 'execution',
      title: 'The Accidental Switch: Commit Becomes Dangling',
      body: [
        'The developer forgets they were in detached HEAD and runs <code>git checkout main</code>. Git switches HEAD back to <code>refs/heads/main</code>.',
        'Commit <code>e8a1b2</code> is now an <b>Orphaned (Dangling) Commit</b>. It is unreachable by any branch, tag, or ref. To standard Git log commands, it appears completely lost!',
      ],
      callout: {
        kind: 'insight',
        text: 'Git does NOT delete unreferenced commits immediately. They remain safely stored on disk for at least 30 to 90 days under the GC grace period.',
      },
      changes: ['+ HEAD switched back to refs/heads/main', '+ Commit e8a1b2 becomes orphaned/dangling in .git/objects/'],
      metrics: { headStatus: 'main (attached)', danglingCommits: '1 dangling', reflogEntries: '3 checkout', rescueBranch: 'None' },
      scene: {
        entities: {
          head: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['HEAD Pointer'], sub: 'ref: refs/heads/main' }),
          mainBranch: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['Branch main'], sub: 'points to 7d9e44' }),
          orphanedCommit: d(10, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'boxes', label: ['Commit e8a1b2'], sub: 'DANGLING / ORPHAN' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Dangling Commit Warning', [
            `$ git checkout main`,
            `Warning: you are leaving 1 commit behind, not connected`,
            `to any of your branches:`,
            `  e8a1b2 fix: memory leak`,
            `$ git log  # e8a1b2 is completely absent!`,
            `= Commit still exists in .git/objects/e8/a1b2...`,
          ], { icon: 'terminal' }),
          zReflog: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ORPHANED COMMIT IN OBJECT STORE'),
        },
        links: {
          hm: h('head', 'mainBranch', ['head', 'mainBranch'], { style: 'dashed', label: 'points to main' }),
        },
        flows: [{ route: ['hm'], rate: 1.4 }],
      },
    },
    {
      short: 'Reflog Audit',
      chapter: 'technique',
      title: 'The Safety Net: Auditing .git/logs/HEAD',
      body: [
        'The developer runs <code>git reflog</code> (Reference Log). The reflog records every single time <code>HEAD</code> changed position for any reason.',
        'Entries are saved in <code>.git/logs/HEAD</code> with exact commit SHA, previous SHA, author, and description of the action (<code>commit: fix: memory leak</code>).',
      ],
      callout: {
        kind: 'tip',
        text: 'git reflog is your ultimate safety net. As long as you made a commit, you can recover it even after bad resets, merges, or rebase mistakes.',
      },
      changes: ['+ Reflog scanned to identify SHA e8a1b2 at HEAD@{1}'],
      metrics: { headStatus: 'main', danglingCommits: '1 found', reflogEntries: 'HEAD@{1} identified', rescueBranch: 'Targeted' },
      scene: {
        entities: {
          reflogReader: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['git reflog'], sub: 'reads .git/logs/HEAD' }),
          reflogEntry: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'boxes', label: ['HEAD@{1}'], sub: 'commit: fix memory leak' }),
          targetSha: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'package', label: ['SHA e8a1b2'], sub: 'exact recovery hash' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Reflog Inspection Output', [
            `$ git reflog`,
            `7d9e44 (HEAD -> main) HEAD@{0}: checkout: moving from e8a1b2 to main`,
            `e8a1b2 HEAD@{1}: commit: fix: memory leak`,
            `c4f1a2 HEAD@{2}: checkout: moving from main to c4f1a2`,
            `= Target commit SHA found at HEAD@{1}`,
          ], { icon: 'terminal' }),
          zReflog: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'REFLOG EVENT AUDITING ENGINE'),
        },
        links: {
          rr: h('reflogReader', 'reflogEntry', ['reflogReader', 'reflogEntry'], { label: 'read event log' }),
          rt: h('reflogEntry', 'targetSha', ['reflogEntry', 'targetSha'], { label: 'resolve hash' }),
        },
        flows: [{ route: ['rr', 'rt'], kind: 'log', rate: 1.5 }],
      },
    },
    {
      short: 'Rescue Branch',
      chapter: 'technique',
      title: 'Creating a Rescue Branch to Re-Anchor Commit',
      body: [
        'To rescue the dangling commit, the developer runs: <code>git branch rescue-fix HEAD@{1}</code> (or <code>git branch rescue-fix e8a1b2</code>).',
        'Git writes a new 41-byte ref at <code>.git/refs/heads/rescue-fix</code> containing <code>e8a1b2</code>. The orphaned commit is now permanently anchored and fully reachable!',
      ],
      callout: {
        kind: 'insight',
        text: 'The rescue operation is instant and completely safe. It does not touch your current working directory or checked out branch.',
      },
      changes: ['+ .git/refs/heads/rescue-fix created pointing to e8a1b2', '+ Commit is no longer dangling; fully visible in git log'],
      metrics: { headStatus: 'main', danglingCommits: '0 (rescued)', reflogEntries: 'Branch created', rescueBranch: 'rescue-fix' },
      scene: {
        entities: {
          cmd: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['git branch rescue'], sub: 'anchor HEAD@{1}' }),
          rescueRef: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['rescue-fix ref'], sub: 'refs/heads/rescue-fix' }),
          rescuedCommit: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'boxes', label: ['Commit e8a1b2'], sub: 'RESCUED & ANCHORED' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Surgical Recovery Command', [
            `$ git branch rescue-fix HEAD@{1}`,
            `$ git log --oneline rescue-fix -1`,
            `e8a1b2 fix: memory leak`,
            `$ git merge rescue-fix  # or git cherry-pick e8a1b2`,
            `= All work recovered with 100% fidelity`,
          ], { icon: 'terminal' }),
          zReflog: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'RESCUED REFERENCE ANCHORING'),
        },
        links: {
          cr: h('cmd', 'rescueRef', ['cmd', 'rescueRef'], { label: 'write new ref' }),
          rc: h('rescueRef', 'rescuedCommit', ['rescueRef', 'rescuedCommit'], { label: 'anchors commit' }),
        },
        flows: [{ route: ['cr', 'rc'], kind: 'rescue', rate: 1.5 }],
      },
    },
    {
      short: 'Reflog Expiry',
      chapter: 'scaling',
      title: 'Reflog Expiration & Garbage Collection Pruning',
      body: [
        'Reflog entries do not live forever. By default, reachable reflog entries expire after <b>90 days</b>, and unreachable entries expire after <b>30 days</b>.',
        'When <code>git gc</code> runs, it executes <code>git reflog expire --all</code> followed by <code>git prune</code>, which permanently unlinks expired unreferenced object files from disk.',
      ],
      callout: {
        kind: 'tip',
        text: 'You can adjust reflog retention via gc.reflogExpire and gc.reflogExpireUnreachable in git config.',
      },
      changes: ['+ Expired entries pruned from .git/logs/', '+ Unreferenced blobs deleted to reclaim disk space'],
      metrics: { headStatus: 'main', danglingCommits: '0', reflogEntries: 'Pruned to 30d', rescueBranch: 'Permanent' },
      scene: {
        entities: {
          gc: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['git gc --prune'], sub: 'reflog expiry engine' }),
          logFilter: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['30-Day Window'], sub: 'gc.reflogExpireUnreachable' }),
          cleanStore: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Clean Repo'], sub: 'unreachable deleted' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Reflog Retention Config', [
            `$ git config gc.reflogExpire "90 days"`,
            `$ git config gc.reflogExpireUnreachable "30 days"`,
            `$ git reflog expire --expire-unreachable=now --all`,
            `$ git prune`,
            `= Stale abandoned commits purged from disk`,
          ], { icon: 'terminal' }),
          zReflog: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'REFLOG RETENTION & PRUNING CYCLE'),
        },
        links: {
          gl: h('gc', 'logFilter', ['gc', 'logFilter'], { label: 'evaluate timestamps' }),
          lc: h('logFilter', 'cleanStore', ['logFilter', 'cleanStore'], { label: 'purge unreferenced' }),
        },
        flows: [{ route: ['gl', 'lc'], kind: 'log', rate: 1.6 }],
      },
    },
  ],
};
