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
          m1: d(-7, 0, { s: 5.0, h: 54, color: 'slab', glyph: 'gitBranch', label: ['main (M1)'], sub: 'common root' }),
          m2: d(0, 7, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['main (M2)'], sub: 'stable tip' }),
          featA: d(0, -7, { s: 5.0, h: 54, color: 'rose', glyph: 'alert', label: ['feat-A (Bad)'], sub: 'rejected work' }),
          featB: d(7, 0, { s: 5.0, h: 54, color: 'amber', glyph: 'gitBranch', label: ['feat-B (Good)'], sub: 'desired feat' }),
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
          m1: d(-7, 0, { s: 5.0, h: 54, color: 'slab', glyph: 'gitBranch', label: ['main (M1)'], sub: 'common root' }),
          m2: d(0, 7, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['main (M2)'], sub: 'target tip' }),
          featA: d(0, -7, { s: 5.0, h: 54, color: 'rose', glyph: 'alert', label: ['feat-A (Bad)'], sub: 'drags along' }),
          pollutedGraft: d(7, 0, { s: 5.0, h: 54, color: 'rose', glyph: 'cpu', label: ['Polluted Head'], sub: 'replays A1..B2' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Failed Standard Rebase', [
            `$ git checkout feat-B`,
            `$ git rebase main`,
            `Applying: feat-A: bad helper (POLLUTION!)`,
            `Applying: feat-A: broken parser (POLLUTION!)`,
            `Applying: feat-B: valid feature`,
            `= Disaster: Rejected branch feat-A is now part of main!`,
          ], { icon: 'terminal' }),
        },
        links: {
          m1m2: h('m1', 'm2', ['m1', 'm2'], { label: 'trunk' }),
          m2p: h('m2', 'pollutedGraft', ['m2', 'pollutedGraft'], { label: 'drags A1+A2' }),
          ap: h('featA', 'pollutedGraft', ['featA', 'pollutedGraft'], { label: 'polluting' }),
        },
        flows: [{ route: ['ap', 'm2p'], kind: 'cut', rate: 1.6 }],
      },
    },
    {
      short: 'Surgical Syntax',
      chapter: 'technique',
      title: 'Surgical Splicing: git rebase --onto Syntax',
      body: [
        'The solution is the 3-argument form: <code>git rebase --onto &lt;new-base&gt; &lt;upstream-to-drop&gt; &lt;branch&gt;</code>.',
        'Formula: <code>git rebase --onto main feat-A feat-B</code>.',
        'Translation to Git engine: <em>"Take all commits on feat-B that are NOT on feat-A, and transplant them directly onto main."</em>',
      ],
      callout: {
        kind: 'tip',
        text: 'Think of --onto as an automated multi-commit cherry-pick range (feat-A..feat-B] transplanted onto new-base.',
      },
      changes: ['+ Defines graft boundary: exclude feat-A, include feat-B only'],
      metrics: { upstreamBase: 'feat-A (discarded)', sourceBranch: 'feat-B (isolated)', targetDestination: 'main', graftedCommits: 'Targeted B1, B2' },
      scene: {
        entities: {
          m2: d(-7, 0, { s: 5.0, h: 54, color: 'green', glyph: 'gitBranch', label: ['main (Target)'], sub: 'new base M2' }),
          surgeryEngine: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'cpu', label: ['rebase --onto'], sub: 'slicing DAG' }),
          dropCut: d(0, -7, { s: 5.0, h: 54, color: 'slab', glyph: 'boxes', label: ['feat-A (Drop)'], sub: 'upstream cut' }),
          featBTarget: d(7, 0, { s: 5.0, h: 54, color: 'amber', glyph: 'gitBranch', label: ['feat-B (Graft)'], sub: 'commits B1..B2' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Rebase --onto Command', [
            `$ git rebase --onto main feat-A feat-B`,
            `1. Target Base: main (commit M2)`,
            `2. Upstream cutoff: feat-A (commits A1, A2 dropped)`,
            `3. Working branch: feat-B (commits B1, B2 kept)`,
            `= Mathematical commit range: feat-A..feat-B`,
          ], { icon: 'terminal' }),
        },
        links: {
          ms: h('m2', 'surgeryEngine', ['m2', 'surgeryEngine'], { label: 'target anchor' }),
          sd: h('surgeryEngine', 'dropCut', ['surgeryEngine', 'dropCut'], { label: 'slice cutoff' }),
          sb: h('surgeryEngine', 'featBTarget', ['surgeryEngine', 'featBTarget'], { label: 'select range' }),
        },
        flows: [{ route: ['sb', 'ms'], kind: 'graft', rate: 1.6 }],
      },
    },
    {
      short: 'Transplant Commits',
      chapter: 'execution',
      title: 'Transplanting the Commit Range onto main',
      body: [
        'Git detaches HEAD to <code>main</code> (commit <code>M2</code>). It generates cherry-pick patches for commit <code>B1</code> and applies it as <code>B1\'</code> with parent <code>M2</code>.',
        'Next, it applies <code>B2</code> as <code>B2\'</code> with parent <code>B1\'</code>. Notice that commits <code>A1</code> and <code>A2</code> were completely skipped!',
      ],
      callout: {
        kind: 'insight',
        text: 'The new commits have new SHA hashes because their parent commit pointer changed from A2 to M2.',
      },
      changes: ['+ Commit B1 transplanted as B1\'', '+ Commit B2 transplanted as B2\'', '+ A1 and A2 left behind'],
      metrics: { upstreamBase: 'main', sourceBranch: 'feat-B', targetDestination: 'main', graftedCommits: 'B1\', B2\' (Grafted)' },
      scene: {
        entities: {
          m2: d(-7, 0, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Commit M2'], sub: 'main parent' }),
          b1Prime: d(0, 0, { s: 5.0, h: 54, color: 'green', glyph: 'boxes', label: ['Commit B1\''], sub: 'parent M2' }),
          b2Prime: d(7, 0, { s: 5.0, h: 54, color: 'green', glyph: 'boxes', label: ['Commit B2\''], sub: 'parent B1\'' }),
          abandonedA: d(0, -7, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['feat-A (Dead)'], sub: 'stale A1..A2' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Transplantation Progress', [
            `Applying: feat-B: step 1 (B1 -> B1')`,
            `Applying: feat-B: step 2 (B2 -> B2')`,
            `Successfully rebased and updated refs/heads/feat-B.`,
            `Parent of B1' is now M2 (not A2!)`,
            `= Clean graft executed without feat-A`,
          ], { icon: 'terminal' }),
        },
        links: {
          mb1: h('m2', 'b1Prime', ['m2', 'b1Prime'], { label: 're-parent to M2' }),
          b1b2: h('b1Prime', 'b2Prime', ['b1Prime', 'b2Prime'], { label: 'chain B2\'' }),
        },
        flows: [{ route: ['mb1', 'b1b2'], kind: 'graft', rate: 1.6 }],
      },
    },
    {
      short: 'Verify History',
      chapter: 'technique',
      title: 'Verifying Tree Integrity and Ref Updates',
      body: [
        'Git updates <code>refs/heads/feat-B</code> to point to <code>B2\'</code>.',
        'Run <code>git log --oneline --graph feat-B -5</code> to confirm that <code>feat-B</code> now stems directly from <code>main</code> with zero trace of <code>feat-A</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Run your unit tests now to ensure feat-B does not inadvertently rely on any missing symbols from feat-A.',
      },
      changes: ['+ feat-B points to clean linear lineage', '+ Zero unapproved code paths'],
      metrics: { upstreamBase: 'main', sourceBranch: 'feat-B (clean)', targetDestination: 'main', graftedCommits: 'Verified' },
      scene: {
        entities: {
          testRunner: d(-7, 0, { s: 5.0, h: 54, color: 'blue', glyph: 'terminal', label: ['npm test'], sub: 'npm test pass' }),
          gitLog: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'boxes', label: ['git log --graph'], sub: 'linear history' }),
          verifiedRef: d(7, 0, { s: 5.0, h: 54, color: 'green', glyph: 'gitBranch', label: ['feat-B Ref'], sub: 'points to B2\'' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Verification Audit', [
            `$ git log --oneline --graph feat-B`,
            `* e8a1b2 (HEAD -> feat-B) feat-B: step 2 (B2')`,
            `* 7d9e44 feat-B: step 1 (B1')`,
            `* 3f8a12 (main) feat: landing page (M2)`,
            `* 1a2b3c init project (M1)`,
            `= Notice: Commits A1 and A2 are completely absent!`,
          ], { icon: 'terminal' }),
        },
        links: {
          tg: h('testRunner', 'gitLog', ['testRunner', 'gitLog'], { label: 'run tests' }),
          gv: h('gitLog', 'verifiedRef', ['gitLog', 'verifiedRef'], { label: 'validate ref' }),
        },
        flows: [{ route: ['tg', 'gv'], kind: 'base', rate: 1.5 }],
      },
    },
    {
      short: 'Discard feat-A',
      chapter: 'scaling',
      title: 'Discarding feat-A and Merging into main',
      body: [
        'Now that <code>feat-B</code> is clean and independent, it can be fast-forward merged into <code>main</code>.',
        'The rejected branch <code>feat-A</code> can be deleted with <code>git branch -D feat-A</code>. Its dangling commits will be quietly swept away during the next garbage collection.',
      ],
      callout: {
        kind: 'insight',
        text: 'Rebase --onto is the premier surgical tool for monorepo developers managing complex multi-branch dependencies.',
      },
      changes: ['+ feat-B merged cleanly into main', '+ feat-A deleted with zero footprint in main'],
      metrics: { upstreamBase: 'main', sourceBranch: 'Merged', targetDestination: 'main', graftedCommits: 'Permanent' },
      scene: {
        entities: {
          mainFastForward: d(-7, 0, { s: 5.0, h: 54, color: 'green', glyph: 'gitBranch', label: ['main (Fast-Fwd)'], sub: 'points to B2\'' }),
          deleteBranchCmd: d(0, 0, { s: 5.2, h: 56, color: 'rose', glyph: 'terminal', label: ['git branch -D'], sub: 'kill feat-A' }),
          gcGraveyard: d(0, -7, { s: 4.8, h: 50, color: 'slab', glyph: 'package', label: ['Reflog Stale'], sub: 'swept by gc' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Final Merge and Cleanup', [
            `$ git checkout main`,
            `$ git merge --ff-only feat-B`,
            `Updating 3f8a12..e8a1b2`,
            `Fast-forward: 2 files changed, 48 insertions(+)`,
            `$ git branch -D feat-A`,
            `Deleted branch feat-A (was c4f1a2).`,
          ], { icon: 'terminal' }),
        },
        links: {
          md: h('mainFastForward', 'deleteBranchCmd', ['mainFastForward', 'deleteBranchCmd'], { label: 'merge success' }),
          dg: h('deleteBranchCmd', 'gcGraveyard', ['deleteBranchCmd', 'gcGraveyard'], { label: 'drop stale ref' }),
        },
        flows: [{ route: ['md', 'dg'], kind: 'cut', rate: 1.5 }],
      },
    },
  ],
};
