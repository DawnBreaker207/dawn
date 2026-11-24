// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitDetachedHeadReflogLesson = {
  id: 'git-detached-head-reflog',
  title: 'Detached HEAD & Reflog: The Ultimate Safety Net',
  summary: 'Demystify detached HEAD state, understand dangling commits, and recover "lost" work using Git append-only reference transaction ledger (.git/logs/HEAD).',
  minutes: 25,
  level: 'advanced',
  metrics: ['headStatus', 'danglingCommits', 'reflogEntries', 'rescueBranch'],
  legend: ['flow', ['detached', 'detached pointer'], ['orphan', 'dangling commit'], ['rescue', 'rescued ref']],
  goals: [
    { text: 'Entering detached HEAD: Checking out a raw commit SHA', step: 1 },
    { text: 'Committing in detached HEAD: Creating unanchored commits', step: 2 },
    { text: 'The accidental loss: Switching branches leaves commits dangling', step: 3 },
    { text: 'The Reflog safety net: Recovering lost hashes from .git/logs/HEAD', step: 4 },
    { text: 'Anchoring lost work: Spawning a branch with git branch rescue <sha>', step: 5 },
    { text: 'Merging the rescued branch cleanly into main', step: 6 },
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
          headPointer: y(-7, 7, { label: 'HEAD Ref', tags: [{ text: 'c4f1a2 (raw SHA)', tone: 'rose', icon: 'terminal' }] }),
          detachedCommit: d(0, 0, { s: 5.2, h: 56, color: 'purple', glyph: 'gitBranch', label: ['Commit c4f1a2'], sub: 'raw commit SHA' }),
          mainBranch: d(7, 7, { s: 5.0, h: 54, color: 'slab', glyph: 'gitBranch', label: ['Branch main'], sub: 'points 7d9e44' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Detached HEAD Status', [
            `$ git checkout c4f1a2`,
            `Note: switching to 'c4f1a2'.`,
            `You are in 'detached HEAD' state.`,
            `$ cat .git/HEAD`,
            `c4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9`,
            `= No branch name, direct raw commit SHA`,
          ], { icon: 'terminal' }),
        },
        links: {
          hd: h('headPointer', 'detachedCommit', ['headPointer', 'detachedCommit'], { label: 'direct SHA-1' }),
        },
        flows: [{ route: ['hd'], kind: 'detached', rate: 1.4 }],
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
          headPointer: y(-7, 7, { label: 'HEAD Ref', tags: [{ text: 'e8a1b2 (HEAD)', tone: 'amber', icon: 'terminal' }] }),
          newCommit: d(0, 0, { s: 5.2, h: 56, color: 'amber', glyph: 'gitBranch', label: ['Commit e8a1b2'], sub: 'unanchored fix' }),
          oldCommit: d(7, -7, { s: 5.0, h: 54, color: 'purple', glyph: 'boxes', label: ['Commit c4f1a2'], sub: 'parent commit' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Unanchored Commit Creation', [
            `$ git commit -m "fix: memory leak"`,
            `[detached HEAD e8a1b2] fix: memory leak`,
            ` 1 file changed, 14 insertions(+)`,
            `$ cat .git/HEAD`,
            `e8a1b2c49b...`,
            `! Warning: No branch ref tracks this commit`,
          ], { icon: 'terminal' }),
        },
        links: {
          hn: h('headPointer', 'newCommit', ['headPointer', 'newCommit'], { label: 'detached HEAD' }),
          no: h('newCommit', 'oldCommit', ['newCommit', 'oldCommit'], { label: 'parent pointer' }),
        },
        flows: [{ route: ['hn', 'no'], kind: 'orphan', rate: 1.5 }],
      },
    },
    {
      short: 'Accidental Loss',
      chapter: 'problem',
      title: 'The Accidental Switch: Dangling Commit',
      body: [
        'Developer switches back: <code>git checkout main</code>. HEAD swings to <code>refs/heads/main</code>.',
        'Because no branch points to commit <code>e8a1b2</code>, it vanishes from <code>git log</code>! It is now a <b>dangling commit</b>, invisible to standard commands and slated for future garbage collection.',
      ],
      callout: {
        kind: 'warning',
        text: 'Dangling commits are not deleted immediately! They remain in .git/objects/ for at least 14 days before git prune purges them.',
      },
      changes: ['+ HEAD swung back to refs/heads/main', '+ Commit e8a1b2 is now dangling and invisible in git log'],
      metrics: { headStatus: 'Attached (main)', danglingCommits: '1 dangling', reflogEntries: '3 entries', rescueBranch: 'None' },
      scene: {
        entities: {
          headPointer: y(-7, 7, { label: 'HEAD Ref', tags: [{ text: 'refs/heads/main', tone: 'blue', icon: 'gitBranch' }] }),
          mainBranch: d(0, 0, { s: 5.2, h: 56, color: 'blue', glyph: 'gitBranch', label: ['Branch main'], sub: 'active branch' }),
          danglingCommit: d(7, -7, { s: 4.8, h: 50, color: 'slab', glyph: 'alert', label: ['e8a1b2 (Lost)'], sub: 'dangling SHA' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Dangling Commit Hazard', [
            `$ git checkout main`,
            `Switched to branch 'main'`,
            `Warning: you are leaving 1 commit behind, not connected to`,
            `any of your branches: e8a1b2 fix: memory leak`,
            `$ git log --oneline -1`,
            `7d9e44 (HEAD -> main) docs: update README`,
            `! Panic: Where did my commit go?`,
          ], { icon: 'terminal' }),
        },
        links: {
          hm: h('headPointer', 'mainBranch', ['headPointer', 'mainBranch'], { label: 'attached ref' }),
        },
        flows: [{ route: ['hm'], kind: 'detached', rate: 1.5 }],
      },
    },
    {
      short: 'Reflog Audit',
      chapter: 'technique',
      title: 'The Reflog Safety Net (.git/logs/HEAD)',
      body: [
        'Git records every single HEAD movement in an append-only transaction ledger: <code>.git/logs/HEAD</code>.',
        'Run <code>git reflog</code>. Entry <code>HEAD@{1}</code> clearly logs: <em>commit: fix: memory leak (e8a1b2)</em>. The "lost" hash is recovered in seconds.',
      ],
      callout: {
        kind: 'tip',
        text: 'Reflog entries persist locally for 90 days (30 days for unreachable commits). Nothing committed in Git is ever instantly lost.',
      },
      changes: ['+ git reflog reveals lost commit SHA e8a1b2 at HEAD@{1}'],
      metrics: { headStatus: 'Attached (main)', danglingCommits: 'Located in reflog', reflogEntries: '4 entries', rescueBranch: 'Targeted' },
      scene: {
        entities: {
          reflogViewer: y(-7, 7, { label: 'Reflog Audit', tags: [{ text: 'git reflog', tone: 'cyan', icon: 'terminal' }] }),
          reflogLedger: b(0, 0, { r: 2.2, h: 50, color: 'blue', glyph: 'database', label: ['.git/logs/HEAD'], sub: 'ledger index' }),
          recoveredSha: d(7, -7, { s: 5.0, h: 54, color: 'amber', glyph: 'gitBranch', label: ['Found e8a1b2'], sub: 'HEAD@{1} found' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Reflog Transaction Log', [
            `$ git reflog`,
            `7d9e44 HEAD@{0}: checkout: moving from e8a1b2 to main`,
            `e8a1b2 HEAD@{1}: commit: fix: memory leak`,
            `c4f1a2 HEAD@{2}: checkout: moving from main to c4f1a2`,
            `= Hash e8a1b2 successfully rescued from ledger`,
          ], { icon: 'terminal' }),
        },
        links: {
          vr: h('reflogViewer', 'reflogLedger', ['reflogViewer', 'reflogLedger'], { label: 'query ledger' }),
          rs: h('reflogLedger', 'recoveredSha', ['reflogLedger', 'recoveredSha'], { label: 'extract SHA-1' }),
        },
        flows: [{ route: ['vr', 'rs'], kind: 'rescue', rate: 1.6 }],
      },
    },
    {
      short: 'Rescue Branch',
      chapter: 'execution',
      title: 'Anchoring Lost Work with git branch rescue',
      body: [
        'Now anchor the orphaned commit: <code>git branch rescue-fix e8a1b2</code>.',
        'This creates a 41-byte text file at <code>.git/refs/heads/rescue-fix</code> containing <code>e8a1b2\\n</code>. The commit is now permanently anchored in the DAG!',
      ],
      callout: {
        kind: 'insight',
        text: 'Creating a branch in Git takes 0.001 milliseconds because it is simply writing 40 hex characters into a text file.',
      },
      changes: ['+ Branch rescue-fix created at commit e8a1b2', '+ Commit is now 100% anchored and reachable'],
      metrics: { headStatus: 'Anchored', danglingCommits: '0 (Rescued)', reflogEntries: '5 entries', rescueBranch: 'rescue-fix' },
      scene: {
        entities: {
          rescueCmd: y(-7, 7, { label: 'Branch Spawner', tags: [{ text: 'git branch rescue', tone: 'green', icon: 'terminal' }] }),
          rescueBranchRef: d(0, 0, { s: 5.2, h: 56, color: 'green', glyph: 'gitBranch', label: ['rescue-fix'], sub: 'anchors e8a1b2' }),
          savedCommit: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['Commit e8a1b2'], sub: 'rescued commit' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Branch Anchor CLI', [
            `$ git branch rescue-fix e8a1b2`,
            `$ cat .git/refs/heads/rescue-fix`,
            `e8a1b2c49b01d2...`,
            `$ git log --oneline rescue-fix -1`,
            `e8a1b2 (rescue-fix) fix: memory leak`,
            `= Dangling commit permanently saved`,
          ], { icon: 'terminal' }),
        },
        links: {
          cr: h('rescueCmd', 'rescueBranchRef', ['rescueCmd', 'rescueBranchRef'], { label: 'create ref' }),
          rs: h('rescueBranchRef', 'savedCommit', ['rescueBranchRef', 'savedCommit'], { label: 'anchors SHA-1' }),
        },
        flows: [{ route: ['cr', 'rs'], kind: 'rescue', rate: 1.6 }],
      },
    },
    {
      short: 'Merge Rescue',
      chapter: 'solution',
      title: 'Merging the Rescued Fix into main',
      body: [
        'With the commit securely anchored, merge it into main: <code>git merge rescue-fix</code>.',
        'Then delete the temporary rescue branch: <code>git branch -d rescue-fix</code>. The bugfix is part of production history with zero regressions.',
      ],
      callout: {
        kind: 'tip',
        text: 'Mastering detached HEAD and reflog removes all fear of Git: you know you can never truly lose committed data.',
      },
      changes: ['+ rescue-fix merged cleanly into main', '+ Temporary rescue branch deleted'],
      metrics: { headStatus: 'Clean main', danglingCommits: '0', reflogEntries: 'Complete', rescueBranch: 'Merged & Cleaned' },
      scene: {
        entities: {
          mainTrunk: d(-7, 7, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Branch main'], sub: 'target branch' }),
          mergedCommit: d(0, 0, { s: 5.2, h: 56, color: 'green', glyph: 'gitBranch', label: ['Merged HEAD'], sub: 'commit sealed' }),
          rescuedWork: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['e8a1b2 in Trunk'], sub: 'fix integrated' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Final Merge Execution', [
            `$ git merge rescue-fix`,
            `Merge made by the 'ort' strategy.`,
            ` src/allocator.ts | 14 ++++++++++++++`,
            `$ git branch -d rescue-fix`,
            `Deleted branch rescue-fix (was e8a1b2).`,
            `= Full lifecycle: Detached -> Dangling -> Reflog -> Rescued`,
          ], { icon: 'terminal' }),
        },
        links: {
          tm: h('mainTrunk', 'mergedCommit', ['mainTrunk', 'mergedCommit'], { label: 'merge branch' }),
          mr: h('mergedCommit', 'rescuedWork', ['mergedCommit', 'rescuedWork'], { label: 'seal history' }),
        },
        flows: [{ route: ['tm', 'mr'], kind: 'rescue', rate: 1.6 }],
      },
    },
  ],
};
