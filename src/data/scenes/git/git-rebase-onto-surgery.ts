// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitRebaseOntoSurgeryLesson = {
  id: 'git-rebase-onto-surgery',
  title: 'Case 5: Rebase --onto History Splicing',
  summary: 'Surgical DAG transplantation: how git rebase --onto cuts a feature branch off a rejected upstream branch and grafts it directly onto main without dragging along stale commits.',
  minutes: 15,
  level: 'advanced',
  metrics: ['upstreamBase', 'sourceBranch', 'targetDestination', 'graftedCommits'],
  legend: ['chain', ['cut', 'discarded branch'], ['graft', 'replanted commit']],
  goals: [
    { text: 'The problem of nested dependent branches (Feature B based on Feature A)', step: 1 },
    { text: 'Why standard git rebase main brings unwanted commits along', step: 2 },
    { text: 'Surgical splicing syntax: git rebase --onto <new-base> <old-base> <branch>', step: 3 },
  ],
  steps: [
    {
      short: 'The Dependency Trap',
      chapter: 'problem',
      title: 'Branch B Trapped on Outdated Branch A',
      body: [
        'Developer branched <code>feat-B</code> off <code>feat-A</code> because they needed <code>feat-A</code>’s helper functions.',
        'Later, <code>feat-A</code> is completely rejected or rewritten in code review. Now <code>feat-B</code> needs to land into <code>main</code>, but a normal <code>git rebase main</code> will drag all of <code>feat-A</code>’s rejected, broken commits into <code>main</code>!',
      ],
      callout: {
        kind: 'warn',
        text: 'Standard rebase considers every commit reachable from feat-B that is not on main, including feat-A’s commits.',
      },
      metrics: { upstreamBase: 'feat-A (rejected)', sourceBranch: 'feat-B (good work)', targetDestination: 'main', graftedCommits: 'Trapped' },
      scene: {
        entities: {
          main: d(-10, 0, { color: 'green', glyph: 'gitBranch', label: ['main'], sub: 'stable production' }),
          featA: d(0, -4, { color: 'rose', glyph: 'alert', label: ['feat-A (Rejected)'], sub: 'commits A1, A2, A3' }),
          featB: d(8, 0, { color: 'yellow', glyph: 'terminal', label: ['feat-B (Desired)'], sub: 'commits B1, B2' }),
          zTrap: x({ x0: -3, x1: 12, y0: -7, y1: 5 }, 'BRANCH DEPENDENCY TRAP'),
        },
        links: {
          ma: h('main', 'featA', ['main', 'featA'], { label: 'branched off' }),
          ab: h('featA', 'featB', ['featA', 'featB'], { label: 'nested parent' }),
        },
        flows: [{ route: ['ma', 'ab'], rate: 1.2 }],
      },
    },
    {
      short: 'Rebase --onto Surgery',
      chapter: 'solution',
      title: 'Surgical Grafting: git rebase --onto main feat-A feat-B',
      body: [
        'Run: <code>git rebase --onto main feat-A feat-B</code>.',
        'Formula: <em>"Take all commits between feat-A and feat-B (i.e. only B1 and B2), and replay them directly on top of main."</em>',
        'Git slices out the <code>feat-A</code> range completely, transplants <code>feat-B</code> onto the tip of <code>main</code>, and leaves the dead commits of <code>feat-A</code> behind to be pruned.',
      ],
      callout: {
        kind: 'insight',
        text: 'git rebase --onto is Git’s surgical scalpel for pruning and transplanting arbitrary commit ranges in the DAG.',
      },
      changes: ['− feat-A commits excised from feat-B', '+ feat-B replanted directly on main', '+ Clean linear commit history ready for merge'],
      metrics: { upstreamBase: 'main (clean)', sourceBranch: 'feat-B', targetDestination: 'main', graftedCommits: 'B1, B2 transplanted' },
      scene: {
        entities: {
          main: d(-8, 0, { color: 'green', glyph: 'gitBranch', label: ['main'], sub: 'tip of production' }),
          featA: d(0, -6, { color: 'slab', glyph: 'alert', label: ['feat-A (Excised)'], sub: 'isolated / orphaned' }),
          featB: d(6, 0, { color: 'green', glyph: 'gitBranch', label: ['feat-B (Grafted)'], sub: 'pure B1 + B2 on main!' }),
        },
        links: {
          mb: h('main', 'featB', ['main', 'featB'], { label: 'direct ancestor' }),
        },
        flows: [{ route: ['mb'], kind: 'graft', rate: 1.8 }],
      },
    },
  ],
};
