// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitDetachedHeadReflogLesson = {
  id: 'git-detached-head-reflog',
  title: 'Case 1: Detached HEAD & Reflog Rescue',
  summary: 'Real-world emergency surgery: recovering orphaned dangling commits after working in detached HEAD using .git/logs/HEAD and git reflog without losing work.',
  minutes: 15,
  level: 'advanced',
  metrics: ['headStatus', 'danglingCommits', 'reflogEntries', 'rescueBranch'],
  legend: ['flow', ['dangle', 'orphaned commit'], ['rescue', 'restored pointer']],
  goals: [
    { text: 'How checkout <hash> triggers Detached HEAD', step: 1 },
    { text: 'Committing in detached HEAD and the risk of checkout main', step: 2 },
    { text: 'Why dangling commits are not immediately deleted (GC grace period)', step: 3 },
    { text: 'Surgical recovery using git reflog and creating a rescue branch', step: 4 },
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
        kind: 'warn',
        text: 'Detached HEAD is safe for read-only inspection. Danger begins when you start committing without creating a branch first.',
      },
      metrics: { headStatus: 'Detached (c4f1a2)', danglingCommits: '0', reflogEntries: '10', rescueBranch: 'None' },
      scene: {
        entities: {
          mainBranch: d(-8, -4, { color: 'slab', glyph: 'gitBranch', label: ['main'], sub: 'e8d9c2' }),
          head: d(0, 0, { color: 'amber', glyph: 'terminal', label: ['HEAD'], sub: 'points directly to c4f1a2' }),
          commit: d(0, 5, { color: 'green', glyph: 'boxes', label: ['Commit c4f1a2'], sub: 'detached target' }),
          zWarn: x({ x0: -4, x1: 4, y0: -3, y1: 8 }, 'DETACHED HEAD (NO BRANCH SHIELD)'),
        },
        links: {
          hc: h('head', 'commit', ['head', 'commit'], { label: 'direct SHA' }),
        },
        flows: [{ route: ['hc'], rate: 1.2 }],
      },
    },
    {
      short: 'Accidental Work',
      chapter: 'problem',
      title: 'Committing and Losing the Commit Pointer',
      body: [
        'While detached, the agent fixes a critical bug and commits: <code>git commit -m "fix: memory leak"</code> (hash <code>9b8a7c</code>). HEAD advances to <code>9b8a7c</code>.',
        'Then the agent runs <code>git checkout main</code>. Git switches HEAD back to <code>refs/heads/main</code>. Because no branch was pointing to <code>9b8a7c</code>, the commit appears to have vanished completely from <code>git log</code>!',
      ],
      callout: {
        kind: 'warn',
        text: 'The commit is not deleted, but it is now "dangling" (orphaned). Standard git log will never show it.',
      },
      changes: ['− No branch references commit 9b8a7c', '− git log shows no sign of the work', '− Panic ensues!'],
      metrics: { headStatus: 'main (e8d9c2)', danglingCommits: '1 (9b8a7c)', reflogEntries: '12', rescueBranch: 'None' },
      scene: {
        entities: {
          main: d(-8, 0, { color: 'green', glyph: 'gitBranch', label: ['HEAD -> main'], sub: 'e8d9c2' }),
          orphan: d(8, 0, { color: 'rose', glyph: 'alert', label: ['Commit 9b8a7c'], sub: 'DANGLING ORPHAN' }),
          zOrphan: x({ x0: 4, x1: 12, y0: -5, y1: 5 }, 'ORPHAN ZONE (INVISIBLE TO GIT LOG)'),
        },
        links: {},
        flows: [],
      },
    },
    {
      short: 'Reflog Inspection',
      chapter: 'technique',
      title: 'Digging into .git/logs/HEAD with git reflog',
      body: [
        'Git maintains an internal journal of every movement of HEAD in <code>.git/logs/HEAD</code>. Even if a commit is unreachable from any branch, <b>git reflog</b> remembers it for at least 30 to 90 days before garbage collection runs.',
        'Running <code>git reflog</code> prints: <code>9b8a7c HEAD@{1}: commit: fix: memory leak</code>. We have the SHA!',
      ],
      callout: {
        kind: 'tip',
        text: 'git reflog is your safety net. As long as you committed the work, it is virtually impossible to lose it for 30 days.',
      },
      metrics: { headStatus: 'main', danglingCommits: '1', reflogEntries: '13 (SHA identified)', rescueBranch: 'Ready' },
      scene: {
        entities: {
          reflog: d(0, 0, { s: 4.5, color: 'blue', glyph: 'terminal', label: ['.git/logs/HEAD'], sub: 'HEAD@{1}: commit: 9b8a7c' }),
          orphan: d(10, 0, { color: 'rose', glyph: 'alert', label: ['Commit 9b8a7c'], sub: 'located!' }),
        },
        links: {
          ro: h('reflog', 'orphan', ['reflog', 'orphan'], { label: 'pointer recovered' }),
        },
        flows: [{ route: ['ro'], kind: 'dangle', rate: 1.5 }],
      },
    },
    {
      short: 'Branch Rescue',
      chapter: 'solution',
      title: 'Rescuing the Orphan with git branch rescue-branch',
      body: [
        'To rescue the work permanently, simply create a named branch pointing directly to the recovered hash: <code>git branch rescue-fix 9b8a7c</code>.',
        'Instantly, the commit is reconnected to the Git DAG. You can now cleanly cherry-pick or merge <code>rescue-fix</code> into <code>main</code> with 100% of code preserved.',
      ],
      callout: {
        kind: 'insight',
        text: 'Creating a branch pointing to any SHA anchors it permanently and protects it from git gc.',
      },
      changes: ['+ Branch rescue-fix created at 9b8a7c', '+ Commit re-anchored into reachable DAG', '+ Ready to merge into main'],
      metrics: { headStatus: 'main', danglingCommits: '0 (Rescued)', reflogEntries: '14', rescueBranch: 'rescue-fix (active)' },
      scene: {
        entities: {
          main: d(-8, 0, { color: 'green', glyph: 'gitBranch', label: ['main'], sub: 'e8d9c2' }),
          rescue: d(8, -4, { color: 'purple', glyph: 'gitBranch', label: ['rescue-fix'], sub: 'points to 9b8a7c' }),
          commit: d(8, 4, { color: 'green', glyph: 'boxes', label: ['Commit 9b8a7c'], sub: 'RESCUED & SAFE' }),
        },
        links: {
          rc: h('rescue', 'commit', ['rescue', 'commit'], { label: 'anchored ref' }),
          mr: h('main', 'rescue', ['main', 'rescue'], { style: 'dashed', label: 'git merge rescue-fix' }),
        },
        flows: [{ route: ['rc', 'mr'], kind: 'rescue', rate: 1.8 }],
      },
    },
  ],
};
