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
          mainBranch: d(-18, -6, { s: 4.4, h: 54, color: 'slab', glyph: 'gitBranch', label: ['Branch main'], sub: 'points 7d9e44' }),
          detachedCommit: d(-6, -2, { s: 4.4, h: 56, color: 'purple', glyph: 'boxes', label: ['Commit c4f1a2'], sub: 'raw commit SHA' }),
          headPointer: y(-10, 14, { label: 'HEAD Ref', tags: [{ text: 'HEAD -> raw SHA', tone: 'rose', icon: 'terminal' }] }),
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
          mainBranch: d(-18, -6, { s: 4.4, h: 54, color: 'slab', glyph: 'gitBranch', label: ['Branch main'], sub: 'points 7d9e44' }),
          detachedCommit: d(-6, -2, { s: 4.4, h: 56, color: 'purple', glyph: 'boxes', label: ['Commit c4f1a2'], sub: 'parent commit' }),
          headPointer: y(-10, 14, { label: 'HEAD Ref', tags: [{ text: 'e8a1b2 (HEAD)', tone: 'amber', icon: 'terminal' }] }),
          newCommit: d(6, 2, { s: 4.4, h: 56, color: 'amber', glyph: 'package', label: ['Commit e8a1b2'], sub: 'unanchored fix' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Unanchored Commit Creation', [
            `$ git commit -m "fix: memory leak"`,
            `[detached HEAD e8a1b2] fix: memory leak`,
            ` 1 file changed, 14 insertions(+)`,
            `! HEAD advanced to e8a1b2, but no branch ref points here!`,
          ], { icon: 'terminal' }),
        },
        links: {
          dn: h('detachedCommit', 'newCommit', ['detachedCommit', 'newCommit'], { label: 'parent pointer' }),
          hn: h('headPointer', 'newCommit', ['headPointer', 'newCommit'], { label: 'direct HEAD' }),
        },
        flows: [{ route: ['hn', 'dn'], kind: 'detached', rate: 1.5 }],
      },
    },
    {
      short: 'Accidental Loss',
      chapter: 'problem',
      title: 'The Accidental Loss: Commit Dangling in Space',
      body: [
        'Developer instinctively types <code>git checkout main</code> to return to work.',
        'HEAD obediently dereferences back to <code>refs/heads/main</code>. Now <b>zero references</b> in the entire repository point to commit <code>e8a1b2</code>! It is a "dangling commit" invisible to <code>git log</code>.',
      ],
      callout: {
        kind: 'warning',
        text: 'The code is NOT deleted from disk! It sits intact in .git/objects/, but without a ref pointer, you cannot find its hash.',
      },
      changes: ['! HEAD switched back to main', '! Commit e8a1b2 orphaned with zero pointers'],
      metrics: { headStatus: 'Attached to main', danglingCommits: '1 orphaned (e8a1b2)', reflogEntries: '3 entries', rescueBranch: 'None' },
      scene: {
        entities: {
          mainBranch: d(-18, -6, { s: 4.4, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Branch main'], sub: 'HEAD attached' }),
          detachedCommit: d(-6, -2, { s: 4.4, h: 56, color: 'purple', glyph: 'boxes', label: ['Commit c4f1a2'], sub: 'parent commit' }),
          headPointer: y(-22, -18, { label: 'HEAD Ref', tags: [{ text: 'HEAD -> main', tone: 'blue', icon: 'terminal' }] }),
          newCommit: d(6, 2, { s: 4.4, h: 56, color: 'rose', glyph: 'alert', label: ['Commit e8a1b2'], sub: 'orphan commit' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Commit Dangling Orphaned', [
            `$ git checkout main`,
            `Warning: you are leaving 1 commit behind, not connected to`,
            `any of your branches: e8a1b2 fix: memory leak`,
            `$ git log`,
            `# e8a1b2 is GONE from git log! Panic!`,
          ], { icon: 'terminal' }),
        },
        links: {
          hm: h('headPointer', 'mainBranch', ['headPointer', 'mainBranch'], { label: 'HEAD -> main' }),
          dn: h('detachedCommit', 'newCommit', ['detachedCommit', 'newCommit'], { style: 'dashed', label: 'unreferenced' }),
        },
        flows: [{ route: ['dn'], kind: 'orphan', rate: 1.2 }],
      },
    },
    {
      short: 'Reflog Rescue',
      chapter: 'technique',
      title: 'The Reflog Safety Net: .git/logs/HEAD',
      body: [
        'Don’t panic! Git maintains an append-only transaction ledger: <b>Reflog</b> (<code>.git/logs/HEAD</code>).',
        'Running <code>git reflog</code> prints every single hash HEAD has pointed to over the last 90 days. We find <code>HEAD@{1}: commit: fix: memory leak (e8a1b2)</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Reflog entries persist for 90 days by default (gc.reflogExpire) before git gc prunes them.',
      },
      changes: ['+ git reflog reveals lost commit SHA e8a1b2', '+ Exact hash recovered from .git/logs/HEAD'],
      metrics: { headStatus: 'Attached to main', danglingCommits: 'Located via reflog', reflogEntries: 'e8a1b2 verified', rescueBranch: 'Pending' },
      scene: {
        entities: {
          mainBranch: d(-18, -6, { s: 4.4, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Branch main'], sub: 'active main' }),
          detachedCommit: d(-6, -2, { s: 4.4, h: 56, color: 'purple', glyph: 'boxes', label: ['Commit c4f1a2'], sub: 'parent commit' }),
          headPointer: y(-22, -18, { label: 'HEAD Ref', tags: [{ text: 'HEAD -> main', tone: 'blue', icon: 'terminal' }] }),
          newCommit: d(6, 2, { s: 4.4, h: 56, color: 'amber', glyph: 'package', label: ['Commit e8a1b2'], sub: 'recovered SHA' }),
          reflogLedger: b(0, 18, { r: 2.2, h: 52, color: 'cyan', glyph: 'database', label: ['.git/logs/HEAD'], sub: 'reflog ledger' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Reflog Ledger Query', [
            `$ git reflog`,
            `7d9e44a (HEAD -> main) HEAD@{0}: checkout: moving to main`,
            `e8a1b2c HEAD@{1}: commit: fix: memory leak`,
            `c4f1a2b HEAD@{2}: checkout: moving from main to c4f1a2`,
            `= Lost commit hash e8a1b2 successfully recovered!`,
          ], { icon: 'terminal' }),
        },
        links: {
          hm: h('headPointer', 'mainBranch', ['headPointer', 'mainBranch'], { label: 'attached' }),
          nr: h('newCommit', 'reflogLedger', ['newCommit', 'reflogLedger'], { label: 'trace hash in log' }),
        },
        flows: [{ route: ['nr'], kind: 'rescue', rate: 1.5 }],
      },
    },
    {
      short: 'Anchor Branch',
      chapter: 'execution',
      title: 'Anchoring Lost Work: git branch rescue <sha>',
      body: [
        'Now that you have the hash, create a new branch pointing directly to it: <code>git branch rescue e8a1b2</code>.',
        'This writes a 41-byte text file at <code>.git/refs/heads/rescue</code> containing <code>e8a1b2...</code>. The dangling commit is now permanently anchored and immune to garbage collection.',
      ],
      callout: {
        kind: 'tip',
        text: 'You can also run git checkout -b rescue e8a1b2 to create the branch and switch to it in a single command.',
      },
      changes: ['+ Branch "rescue" created at e8a1b2', '+ Commit e8a1b2 fully anchored into repository DAG'],
      metrics: { headStatus: 'Attached to main', danglingCommits: '0 (anchored)', reflogEntries: 'Reflog safe', rescueBranch: 'Branch rescue' },
      scene: {
        entities: {
          mainBranch: d(-18, -6, { s: 4.4, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Branch main'], sub: 'active main' }),
          detachedCommit: d(-6, -2, { s: 4.4, h: 56, color: 'purple', glyph: 'boxes', label: ['Commit c4f1a2'], sub: 'parent commit' }),
          newCommit: d(6, 2, { s: 4.4, h: 56, color: 'green', glyph: 'package', label: ['Commit e8a1b2'], sub: 'anchored fix' }),
          rescueBranch: d(16, 6, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Branch rescue'], sub: 'anchored ref' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Branch Anchor Creation', [
            `$ git branch rescue e8a1b2`,
            `$ cat .git/refs/heads/rescue`,
            `e8a1b2c49b56f890e123456789abcdef01234567`,
            `$ git log rescue --oneline -n 1`,
            `e8a1b2c (rescue) fix: memory leak`,
            `= Commit is fully restored into DAG!`,
          ], { icon: 'terminal' }),
        },
        links: {
          dn: h('detachedCommit', 'newCommit', ['detachedCommit', 'newCommit'], { label: 'parent' }),
          rn: h('rescueBranch', 'newCommit', ['rescueBranch', 'newCommit'], { label: 'anchors commit' }),
        },
        flows: [{ route: ['rn'], kind: 'rescue', rate: 1.5 }],
      },
    },
    {
      short: 'Merge Rescue',
      chapter: 'scaling',
      title: 'Merging the Rescued Fix Cleanly into main',
      body: [
        'With the rescue branch anchored, integrate the fix into <code>main</code> with <code>git merge rescue</code> or <code>git cherry-pick e8a1b2</code>.',
        'Once merged, delete the temporary branch: <code>git branch -d rescue</code>. Zero code was lost.',
      ],
      callout: {
        kind: 'insight',
        text: 'In Git, almost nothing is ever truly lost unless you explicitly run git gc --prune=now after reflog expiry.',
      },
      changes: ['+ Rescued commit merged into main', '+ Temporary rescue branch safely deleted'],
      metrics: { headStatus: 'main (merged)', danglingCommits: '0', reflogEntries: 'Complete', rescueBranch: 'Deleted' },
      scene: {
        entities: {
          mainBranch: d(-18, -6, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Branch main'], sub: 'contains fix' }),
          detachedCommit: d(-6, -2, { s: 4.4, h: 56, color: 'purple', glyph: 'boxes', label: ['Commit c4f1a2'], sub: 'ancestor' }),
          newCommit: d(6, 2, { s: 4.4, h: 56, color: 'green', glyph: 'package', label: ['Commit e8a1b2'], sub: 'merged fix' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Merge Completion', [
            `$ git merge rescue`,
            `Merge made by the 'ort' strategy.`,
            ` src/engine.ts | 14 ++++++++++++++`,
            `$ git branch -d rescue`,
            `Deleted branch rescue (was e8a1b2c).`,
            `= All lost work completely recovered & shipped!`,
          ], { icon: 'terminal' }),
        },
        links: {
          md: h('mainBranch', 'detachedCommit', ['mainBranch', 'detachedCommit'], { label: 'ancestor' }),
          dn: h('detachedCommit', 'newCommit', ['detachedCommit', 'newCommit'], { label: 'merged fix' }),
        },
        flows: [{ route: ['md', 'dn'], kind: 'rescue', rate: 1.6 }],
      },
    },
  ],
};
