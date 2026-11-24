// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDb as b,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitCommandsTaxonomyLesson = {
  id: 'git-commands-taxonomy',
  title: 'Git Command Taxonomy & State Transitions',
  summary: 'Visual map of Git commands categorizing Porcelain vs Plumbing and how checkout, restore, reset, diff, and stash navigate state between zones.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['workingState', 'indexState', 'headState', 'stashStack'],
  legend: ['flow', ['danger', 'destructive'], ['save', 'stash']],
  goals: [
    { text: 'Porcelain (human UI) vs Plumbing (internal low-level) commands', step: 1 },
    { text: 'Undoing changes: git restore vs git checkout vs git reset', step: 3 },
    { text: 'Examining deltas: git diff between tree stages', step: 5 },
    { text: 'Temporary workspace shelving with git stash', step: 7 },
  ],
  steps: [
    {
      short: 'Taxonomy',
      chapter: 'setup',
      title: 'Porcelain vs Plumbing Commands',
      body: [
        'Git commands fall into two distinct architectures: <b>Porcelain</b> commands (user-friendly frontends like <code>git add</code>, <code>commit</code>, <code>status</code>, <code>log</code>) and <b>Plumbing</b> commands (low-level building blocks like <code>hash-object</code>, <code>cat-file</code>, <code>mktree</code>, <code>write-tree</code>, <code>commit-tree</code>).',
        'AI agents and build tools rely heavily on plumbing commands to inspect objects and manipulate state deterministically without human interactive prompts.',
      ],
      callout: {
        kind: 'insight',
        text: 'Every porcelain command is just a script or wrapper calling a pipeline of plumbing primitives.',
      },
      metrics: { workingState: 'Modified', indexState: 'Clean', headState: 'Commit a1b2c3', stashStack: '0' },
      scene: {
        entities: {
          plumb: d(-6, -4, { color: 'yellow', glyph: 'terminal', label: ['Plumbing Engine'], sub: 'cat-file, hash-object' }),
          porce: d(-6, 4, { color: 'green', glyph: 'boxes', label: ['Porcelain CLI'], sub: 'add, commit, status' }),
          storage: d(6, 0, { s: 4.6, h: 48, color: 'slab', glyph: 'gitBranch', label: ['.git Storage'], sub: 'objects & refs' }),
        },
        links: {
          pp: h('porce', 'plumb', ['porce', 'plumb'], { label: 'wraps' }),
          ps: h('plumb', 'storage', ['plumb', 'storage'], { label: 'direct byte I/O' }),
        },
        flows: [{ route: ['pp', 'ps'], rate: 1.2 }],
      },
    },
    {
      short: 'Undo Matrix',
      chapter: 'technique',
      title: 'Undoing Changes: restore vs reset --soft/--mixed/--hard',
      body: [
        'Modern Git split the overloaded <code>git checkout</code> into <code>git switch</code> (branches) and <code>git restore</code> (files).',
        'Understanding reset modes: <code>--soft</code> rewinds HEAD only (keeps staging & working dir intact); <code>--mixed</code> (default) rewinds HEAD and index (keeps working dir); <code>--hard</code> nukes all changes in HEAD, index, and working tree destructively.',
      ],
      callout: {
        kind: 'warn',
        text: 'git reset --hard permanently destroys uncommitted working tree changes. There is no undo via reflog for files never staged!',
      },
      changes: ['~ HEAD points to parent commit', '− Index cleared of staged entries', '− Working dir overwritten on --hard'],
      metrics: { workingState: 'Clean (Reset)', indexState: 'Clean', headState: 'Rewound to HEAD~1', stashStack: '0' },
      scene: {
        entities: {
          head: d(-8, 0, { color: 'rose', glyph: 'gitBranch', label: ['HEAD'], sub: 'commit pointer' }),
          index: d(0, 0, { color: 'amber', glyph: 'boxes', label: ['Index'], sub: 'staging' }),
          work: d(8, 0, { color: 'slab', glyph: 'terminal', label: ['Working Dir'], sub: 'filesystem' }),
          zReset: x({ x0: -11, x1: 11, y0: -6, y1: 6 }, 'RESET SCOPE: --SOFT (HEAD) | --MIXED (+INDEX) | --HARD (+WORK)'),
        },
        links: {
          hi: h('head', 'index', ['head', 'index'], { style: 'dashed', label: '--mixed' }),
          iw: h('index', 'work', ['index', 'work'], { style: 'dashed', label: '--hard' }),
        },
        flows: [{ route: ['hi', 'iw'], kind: 'danger', rate: 1.4 }],
      },
    },
    {
      short: 'Git Stash',
      chapter: 'solution',
      title: 'Shelving Dirty Changes with git stash',
      body: [
        'When you must urgently switch branches but have half-finished dirty work, <code>git stash save</code> creates two or three temporary commit objects (one for working tree, one for index, and optional untracked) and stores them in the <code>refs/stash</code> reflog stack.',
        'Running <code>git stash pop</code> reapplies the shelved changes onto your current working tree and drops the stash commit from the stack.',
      ],
      callout: {
        kind: 'tip',
        text: 'A stash is not magical memory — it is a standard commit dangling from refs/stash and protected from garbage collection.',
      },
      changes: ['+ Stash commit created (refs/stash)', '+ Working tree cleaned to pristine HEAD state', '+ Stash stack incremented'],
      metrics: { workingState: 'Clean (Stashed)', indexState: 'Clean', headState: 'HEAD unchanged', stashStack: 'stash@{0}' },
      scene: {
        entities: {
          work: d(-8, 0, { color: 'slab', glyph: 'terminal', label: ['Working Dir'], sub: 'reverted to clean' }),
          head: d(0, 0, { color: 'green', glyph: 'gitBranch', label: ['HEAD'], sub: 'current branch' }),
          stash: d(8, 0, { s: 4.6, h: 48, color: 'purple', glyph: 'package', label: ['refs/stash'], sub: 'shelved commit stack' }),
        },
        links: {
          ws: h('work', 'stash', ['work', 'stash'], { label: 'git stash push' }),
          sw: h('stash', 'work', ['stash', 'work'], { style: 'dashed', label: 'git stash pop' }),
        },
        flows: [{ route: ['ws'], kind: 'save', rate: 1.6 }],
      },
    },
  ],
};
