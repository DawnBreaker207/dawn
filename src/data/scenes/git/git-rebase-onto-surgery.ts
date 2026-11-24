// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitRebaseOntoSurgeryLesson = {
  id: 'git-rebase-onto-surgery',
  title: 'Case 7: Git Rebase --onto Surgery (Dependency Traps)',
  summary: 'Surgically transplant a feature branch onto main while slicing out rejected intermediate dependencies using git rebase --onto.',
  minutes: 25,
  level: 'advanced',
  metrics: ['upstreamBase', 'sourceBranch', 'targetDestination', 'graftedCommits'],
  legend: ['flow', ['cut', 'sliced commit'], ['graft', 'transplanted commit'], ['base', 'stable trunk']],
  goals: [
    { text: 'The dependency trap: Branch B stacked on top of Branch A', step: 1 },
    { text: 'Why standard git rebase main fails and drags unwanted commits', step: 2 },
    { text: 'Surgical syntax: git rebase --onto <new-base> <upstream-to-drop> <branch>', step: 3 },
    { text: 'Transplanting commits B1 and B2 directly onto main', step: 4 },
    { text: 'Verifying history integrity with git log --graph', step: 5 },
    { text: 'Discarding Branch A and fast-forward merging Branch B', step: 6 },
  ],
  steps: [
    {
      short: 'Dependency Trap',
      chapter: 'problem',
      title: 'Branch B Trapped on Outdated Branch A',
      body: [
        'Developer branched <code>feat-B</code> off <code>feat-A</code> because they needed <code>feat-A</code>’s helper functions.',
        'Later, <code>feat-A</code> is completely rejected in code review. Now <code>feat-B</code> needs to land into <code>main</code>, but <code>feat-B</code>’s commits sit directly on top of <code>feat-A</code>’s discarded commits.',
      ],
      callout: {
        kind: 'warning',
        text: 'If you merge feat-B into main right now, you will accidentally merge the broken, unapproved code from feat-A too!',
      },
      metrics: { upstreamBase: 'feat-A (rejected)', sourceBranch: 'feat-B (good)', targetDestination: 'main', graftedCommits: '0' },
      scene: {
        entities: {
          m1: d(-18, -6, { s: 4.4, h: 54, color: 'slab', glyph: 'gitBranch', label: ['main (M1)'], sub: 'common root' }),
          m2: d(-6, -2, { s: 4.4, h: 56, color: 'blue', glyph: 'gitBranch', label: ['main (M2)'], sub: 'stable tip' }),
          featA: d(-4, -20, { s: 4.4, h: 54, color: 'rose', glyph: 'alert', label: ['feat-A (Bad)'], sub: 'rejected work' }),
          featB: d(8, -16, { s: 4.4, h: 56, color: 'amber', glyph: 'boxes', label: ['feat-B (Good)'], sub: 'valid feature' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'DAG Entanglement', [
            `main: --- M1 --- M2`,
            `           \\`,
            `feat-A:     A1 --- A2 (REJECTED)`,
            `                     \\`,
            `feat-B:               B1 --- B2 (VALID WORK)`,
            `! How to extract B1 and B2 without taking A1 and A2?`,
          ], { icon: 'terminal' }),
        },
        links: {
          m1m2: h('m1', 'm2', ['m1', 'm2'], { label: 'trunk commit' }),
          m1a: h('m1', 'featA', ['m1', 'featA'], { label: 'stale branch' }),
          ab: h('featA', 'featB', ['featA', 'featB'], { label: 'stacked on A' }),
        },
        flows: [{ route: ['m1a', 'ab'], kind: 'cut', rate: 1.5 }],
      },
    },
    {
      short: 'Standard Failure',
      chapter: 'problem',
      title: 'Why Standard git rebase main Fails',
      body: [
        'Running standard <code>git rebase main</code> while on <code>feat-B</code> traverses back to the common ancestor with <code>main</code>, which is <code>M1</code>!',
        'Git takes commits <code>A1</code>, <code>A2</code>, <code>B1</code>, and <code>B2</code> and replays ALL four commits on top of <code>main</code>, defeating your goal of discarding <code>feat-A</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Standard git rebase operates on the entire fork lineage back to the merge base with target.',
      },
      changes: ['+ Standard rebase drags unwanted A1 and A2 commits onto main'],
      metrics: { upstreamBase: 'main', sourceBranch: 'feat-B', targetDestination: 'main', graftedCommits: 'A1, A2, B1, B2 (Polluted)' },
      scene: {
        entities: {
          m1: d(-18, -6, { s: 4.4, h: 54, color: 'slab', glyph: 'gitBranch', label: ['main (M1)'], sub: 'common root' }),
          m2: d(-6, -2, { s: 4.4, h: 56, color: 'blue', glyph: 'gitBranch', label: ['main (M2)'], sub: 'stable tip' }),
          featA: d(-4, -20, { s: 4.4, h: 54, color: 'rose', glyph: 'alert', label: ['feat-A (Bad)'], sub: 'drags to main' }),
          featB: d(8, -16, { s: 4.4, h: 56, color: 'amber', glyph: 'boxes', label: ['feat-B (Good)'], sub: 'dirty rebase' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Standard Rebase Flaw', [
            `$ git checkout feat-B`,
            `$ git rebase main`,
            `First, rewinding head to replay your work on top of it...`,
            `Applying: feat-A commit 1  # UNWANTED!`,
            `Applying: feat-A commit 2  # UNWANTED!`,
            `Applying: feat-B commit 1`,
            `Applying: feat-B commit 2`,
            `! Pollutes main with rejected feat-A code!`,
          ], { icon: 'terminal' }),
        },
        links: {
          m1m2: h('m1', 'm2', ['m1', 'm2'], { label: 'trunk' }),
          m2a: h('m2', 'featA', ['m2', 'featA'], { label: 'drags A1/A2' }),
          ab: h('featA', 'featB', ['featA', 'featB'], { label: 'drags B1/B2' }),
        },
        flows: [{ route: ['m2a', 'ab'], kind: 'cut', rate: 1.6 }],
      },
    },
    {
      short: 'Surgical Syntax',
      chapter: 'technique',
      title: 'The Surgical Syntax: git rebase --onto',
      body: [
        'The solution is the 3-argument surgical command: <code>git rebase --onto &lt;new-base&gt; &lt;upstream-to-drop&gt; &lt;branch&gt;</code>.',
        'Here: <code>git rebase --onto main feat-A feat-B</code>. This instructs Git: take the commits reachable from <code>feat-B</code> but NOT from <code>feat-A</code> (i.e. only B1 and B2), and replay them on top of <code>main</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Mnemonic: git rebase --onto [Where to go] [What to slice off] [Branch to move].',
      },
      changes: ['+ Slicing boundaries defined: range is feat-A..feat-B', '+ A1 and A2 completely excluded from replaying'],
      metrics: { upstreamBase: 'feat-A', sourceBranch: 'feat-B (isolated)', targetDestination: 'main', graftedCommits: 'B1, B2 only' },
      scene: {
        entities: {
          m1: d(-18, -6, { s: 4.4, h: 54, color: 'slab', glyph: 'gitBranch', label: ['main (M1)'], sub: 'common root' }),
          m2: d(-6, -2, { s: 4.4, h: 56, color: 'blue', glyph: 'gitBranch', label: ['main (M2)'], sub: 'new-base tip' }),
          featA: d(-4, -20, { s: 4.4, h: 54, color: 'rose', glyph: 'alert', label: ['feat-A (Bad)'], sub: 'slice point' }),
          featB: d(8, -16, { s: 4.4, h: 56, color: 'amber', glyph: 'boxes', label: ['feat-B (Good)'], sub: 'moving branch' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Surgical Rebase Command', [
            `$ git rebase --onto main feat-A feat-B`,
            `Formula: git rebase --onto <new-base> <upstream-to-drop> <branch>`,
            `New Base: main (M2)`,
            `Upstream to drop: feat-A (A1, A2 discarded)`,
            `Branch to transplant: feat-B (only B1, B2 copied)`,
          ], { icon: 'terminal' }),
        },
        links: {
          m1m2: h('m1', 'm2', ['m1', 'm2'], { label: 'stable trunk' }),
          m2b: h('m2', 'featB', ['m2', 'featB'], { style: 'dashed', label: 'graft plan' }),
        },
        flows: [{ route: ['m2b'], kind: 'graft', rate: 1.5 }],
      },
    },
    {
      short: 'Transplant Commits',
      chapter: 'execution',
      title: 'Transplanting Commits B1 and B2 onto main',
      body: [
        'Git creates new commit objects <code>B1\'</code> and <code>B2\'</code> whose parent is directly <code>M2</code>.',
        '<code>feat-B</code> now points to <code>B2\'</code>. The rejected commits on <code>feat-A</code> are completely bypassed and left behind.',
      ],
      callout: {
        kind: 'insight',
        text: 'The newly created commits have new SHAs (B1\', B2\') because their parent hash has changed to M2.',
      },
      changes: ['+ Commits B1\' and B2\' created on top of main (M2)', '+ feat-B points to clean B2\''],
      metrics: { upstreamBase: 'main (M2)', sourceBranch: 'feat-B (grafted)', targetDestination: 'main', graftedCommits: 'B1\', B2\' clean' },
      scene: {
        entities: {
          m1: d(-18, -6, { s: 4.4, h: 54, color: 'slab', glyph: 'gitBranch', label: ['main (M1)'], sub: 'common root' }),
          m2: d(-6, -2, { s: 4.4, h: 56, color: 'blue', glyph: 'gitBranch', label: ['main (M2)'], sub: 'stable tip' }),
          featA: d(-4, -20, { s: 4.4, h: 54, color: 'slab', glyph: 'alert', label: ['feat-A (Bad)'], sub: 'orphaned line' }),
          featB: d(8, -16, { s: 4.4, h: 56, color: 'amber', glyph: 'boxes', label: ['feat-B (Good)'], sub: 'old pointer' }),
          transplantedB: d(4, 8, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['feat-B (Graft)'], sub: 'rebased onto' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Transplant Execution', [
            `Applying: feat-B commit 1 (as B1')`,
            `Applying: feat-B commit 2 (as B2')`,
            `Successfully rebased and updated refs/heads/feat-B.`,
            `= feat-B now sits cleanly on main with 0 dependencies on feat-A`,
          ], { icon: 'terminal' }),
        },
        links: {
          m1m2: h('m1', 'm2', ['m1', 'm2'], { label: 'stable trunk' }),
          m2g: h('m2', 'transplantedB', ['m2', 'transplantedB'], { label: 'clean graft' }),
        },
        flows: [{ route: ['m2g'], kind: 'graft', rate: 1.6 }],
      },
    },
    {
      short: 'Verify History',
      chapter: 'execution',
      title: 'Verifying History Integrity with git log --graph',
      body: [
        'Before pushing, verify that <code>feat-B</code> contains exactly your expected commits and zero residual artifacts from <code>feat-A</code>.',
        'Run <code>git log --oneline --graph main..feat-B</code>. It should output exactly B1\' and B2\'.',
      ],
      callout: {
        kind: 'tip',
        text: 'git log A..B means "all commits reachable from B that are not reachable from A".',
      },
      changes: ['+ Verified 0 leftover commits from feat-A', '+ Clean linear history ready for merge'],
      metrics: { upstreamBase: 'main (M2)', sourceBranch: 'feat-B (verified)', targetDestination: 'main', graftedCommits: 'Verified' },
      scene: {
        entities: {
          m1: d(-18, -6, { s: 4.4, h: 54, color: 'slab', glyph: 'gitBranch', label: ['main (M1)'], sub: 'common root' }),
          m2: d(-6, -2, { s: 4.4, h: 56, color: 'blue', glyph: 'gitBranch', label: ['main (M2)'], sub: 'stable tip' }),
          featA: d(-4, -20, { s: 4.4, h: 54, color: 'slab', glyph: 'alert', label: ['feat-A (Bad)'], sub: 'abandoned ref' }),
          transplantedB: d(4, 8, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['feat-B (Graft)'], sub: 'verified tip' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'History Graph Verification', [
            `$ git log --oneline --graph main..feat-B`,
            `* e4f5a6b (HEAD -> feat-B) feat-B: finish payment integration`,
            `* c1d2e3f feat-B: init payment controller`,
            `= Exactly 2 commits, zero commits from feat-A!`,
          ], { icon: 'terminal' }),
        },
        links: {
          m1m2: h('m1', 'm2', ['m1', 'm2'], { label: 'stable trunk' }),
          m2g: h('m2', 'transplantedB', ['m2', 'transplantedB'], { label: 'clean graft' }),
        },
        flows: [{ route: ['m1m2', 'm2g'], kind: 'base', rate: 1.5 }],
      },
    },
    {
      short: 'Fast-Forward',
      chapter: 'scaling',
      title: 'Discarding feat-A and Fast-Forward Merging',
      body: [
        'Now safely delete the rejected branch: <code>git branch -D feat-A</code>.',
        'Checkout <code>main</code> and run <code>git merge feat-B</code>. Because <code>feat-B</code> was rebased directly onto <code>main</code>, Git performs an instantaneous <b>Fast-Forward Merge</b>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Fast-forward simply moves main\'s 41-byte pointer to B2\'. Linear, clean, and bug-free.',
      },
      changes: ['+ feat-A deleted (-D)', '+ main fast-forwarded to B2\''],
      metrics: { upstreamBase: 'main (updated)', sourceBranch: 'feat-B (merged)', targetDestination: 'main', graftedCommits: 'Fast-forward' },
      scene: {
        entities: {
          m1: d(-18, -6, { s: 4.4, h: 54, color: 'slab', glyph: 'gitBranch', label: ['main (M1)'], sub: 'common root' }),
          m2: d(-6, -2, { s: 4.4, h: 56, color: 'blue', glyph: 'gitBranch', label: ['main (M2)'], sub: 'parent commit' }),
          transplantedB: d(4, 8, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['feat-B (Graft)'], sub: 'merged tip' }),
          fastForwardMain: d(16, 12, { s: 4.4, h: 56, color: 'green', glyph: 'package', label: ['main (M3)'], sub: 'fast-forward' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Fast-Forward Completion', [
            `$ git branch -D feat-A`,
            `Deleted branch feat-A (was a1b2c3d).`,
            `$ git checkout main && git merge feat-B`,
            `Updating m2..b2`,
            `Fast-forward`,
            `= Flawless surgical transplantation completed!`,
          ], { icon: 'terminal' }),
        },
        links: {
          m2g: h('m2', 'transplantedB', ['m2', 'transplantedB'], { label: 'lineage' }),
          gf: h('transplantedB', 'fastForwardMain', ['transplantedB', 'fastForwardMain'], { label: 'fast-forward' }),
        },
        flows: [{ route: ['m2g', 'gf'], kind: 'base', rate: 1.6 }],
      },
    },
  ],
};
