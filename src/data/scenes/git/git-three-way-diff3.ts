// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitThreeWayDiff3Lesson = {
  id: 'git-three-way-diff3',
  title: 'Case 3: 3-Way Merge Conflicts & Diff3 Topology',
  summary: 'Why standard 2-way conflict markers cause disastrous logical bugs, how the Common Ancestor (Base) reveals true developer intent, and configuring merge.conflictstyle = diff3.',
  minutes: 15,
  level: 'advanced',
  metrics: ['baseAncestor', 'localOurs', 'remoteTheirs', 'conflictStyle'],
  legend: ['flow', ['conflict', 'divergent hunk'], ['resolved', 'accurate merge']],
  goals: [
    { text: 'Graph topology of a 3-way merge: Base vs Ours vs Theirs', step: 1 },
    { text: 'The fatal flaw of standard 2-way markers (<<<<<<< vs >>>>>>>)', step: 2 },
    { text: 'Enabling diff3 (||||||| base) to see what the code was BEFORE either change', step: 3 },
    { text: 'Surgical hunk checkout: git checkout --ours vs --theirs', step: 4 },
  ],
  steps: [
    {
      short: '3-Way Topology',
      chapter: 'setup',
      title: 'The 3-Way Merge Graph Topology',
      body: [
        'When merging Branch B into Branch A, Git does not compare only Branch A and B. It finds their **Best Common Ancestor (Merge Base)** in the DAG.',
        'If only one branch modified a line compared to the Base, Git automatically takes that change. A **conflict** occurs ONLY when BOTH branches modified the same lines relative to the Base in different ways.',
      ],
      callout: {
        kind: 'insight',
        text: 'Git uses the merge-base as the truth anchor. Without the base, automated merging would be pure guesswork.',
      },
      metrics: { baseAncestor: 'Commit 100', localOurs: 'Commit 102 (+timeout: 30s)', remoteTheirs: 'Commit 103 (+retries: 3)', conflictStyle: 'standard' },
      scene: {
        entities: {
          base: d(-8, 0, { color: 'slab', glyph: 'gitBranch', label: ['Merge Base (Ancestor)'], sub: 'const config = {}' }),
          ours: d(2, -4, { color: 'green', glyph: 'terminal', label: ['Ours (Local / HEAD)'], sub: 'config.timeout = 30' }),
          theirs: d(2, 4, { color: 'blue', glyph: 'terminal', label: ['Theirs (Remote / Merge)'], sub: 'config.retries = 3' }),
          zMerge: x({ x0: -10, x1: 6, y0: -6, y1: 6 }, '3-WAY MERGE TOPOLOGY'),
        },
        links: {
          bo: h('base', 'ours', ['base', 'ours'], { label: 'diverged' }),
          bt: h('base', 'theirs', ['base', 'theirs'], { label: 'diverged' }),
        },
        flows: [
          { route: ['bo'], rate: 1.0 },
          { route: ['bt'], rate: 1.0 },
        ],
      },
    },
    {
      short: 'The 2-Way Flaw',
      chapter: 'problem',
      title: 'The Blind Spot of Standard 2-Way Markers',
      body: [
        'By default, Git shows you only: <code><<<<<<< HEAD</code> (your code) and <code>>>>>>>> feature</code> (their code).',
        'You have NO IDEA what the code originally looked like! Did one developer delete a line, or did the other developer add one? Without the base, developers frequently make incorrect guesses and introduce silent logical bugs.',
      ],
      callout: {
        kind: 'warn',
        text: 'Standard conflict markers hide 33% of the necessary information required to resolve conflicts correctly.',
      },
      changes: ['− Standard markers omit the base code', '− Developers guess which intent to keep'],
      metrics: { baseAncestor: 'Hidden', localOurs: 'Shown', remoteTheirs: 'Shown', conflictStyle: 'merge (default)' },
      scene: {
        entities: {
          file: d(0, 0, { s: 5.0, color: 'rose', glyph: 'alert', label: ['Conflict Markers'], sub: '<<<<<<< HEAD vs >>>>>>> theirs (Base missing!)' }),
        },
        links: {},
        flows: [],
      },
    },
    {
      short: 'diff3 Power',
      chapter: 'solution',
      title: 'Enabling diff3: Unlocking the Complete Truth',
      body: [
        'Running <code>git config --global merge.conflictstyle diff3</code> (or modern <code>zdiff3</code>) transforms conflict markers into a 3-part block:',
        '<code><<<<<<< HEAD</code> (Ours)<br/><code>||||||| base</code> (Original code before either edit)<br/><code>=======</code><br/><code>>>>>>>> feature</code> (Theirs). Now the intention is crystal clear, making resolution trivial!',
      ],
      callout: {
        kind: 'tip',
        text: 'zdiff3 (zealous diff3) is even cleaner: it automatically resolves matching pre- and post-conflict common lines.',
      },
      changes: ['+ diff3 reveals original base code', '+ Enables instant logical understanding', '+ Resolving conflicts accurately'],
      metrics: { baseAncestor: 'Visible (|||||||)', localOurs: 'Visible', remoteTheirs: 'Visible', conflictStyle: 'diff3 / zdiff3' },
      scene: {
        entities: {
          file3: d(0, 0, { s: 5.2, color: 'green', glyph: 'boxes', label: ['diff3 Conflict Block'], sub: 'Ours + Base (Original) + Theirs' }),
          editor: d(10, 0, { color: 'purple', glyph: 'terminal', label: ['Resolved Merge'], sub: 'keep both timeout & retries' }),
        },
        links: {
          fe: h('file3', 'editor', ['file3', 'editor'], { label: 'accurate resolution' }),
        },
        flows: [{ route: ['fe'], kind: 'resolved', rate: 1.8 }],
      },
    },
  ],
};
