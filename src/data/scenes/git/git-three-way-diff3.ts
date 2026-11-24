// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitThreeWayDiff3Lesson = {
  id: 'git-three-way-diff3',
  title: 'Case 3: 3-Way Merge Conflicts & Diff3 Topology',
  summary: 'Why standard 2-way conflict markers cause disastrous logical bugs, how the Common Ancestor (Base) reveals true developer intent, and configuring merge.conflictstyle = diff3.',
  minutes: 25,
  level: 'advanced',
  metrics: ['baseAncestor', 'localOurs', 'remoteTheirs', 'conflictStyle'],
  legend: ['flow', ['conflict', 'divergent hunk'], ['resolved', 'accurate merge'], ['base', 'merge base']],
  goals: [
    { text: 'Graph topology of a 3-way merge: Base vs Ours vs Theirs', step: 1 },
    { text: 'The fatal flaw of standard 2-way markers (<<<<<<< vs >>>>>>>)', step: 2 },
    { text: 'Enabling diff3 (||||||| base) to see the original baseline code', step: 3 },
    { text: 'Comparing diffs relative to Base to deduce original intent', step: 4 },
    { text: 'Surgical hunk checkout: git checkout --ours vs --theirs', step: 5 },
    { text: 'Sealing the 3-Way Merge Commit with dual parent pointers', step: 6 },
  ],
  steps: [
    {
      short: 'Merge Base',
      chapter: 'setup',
      title: 'Finding the Merge Base (Common Ancestor)',
      body: [
        'When merging Branch B into Branch A, Git does not compare only Branch A and B. It traverses the DAG to find their <b>Merge Base</b> (the most recent common ancestor).',
        'Command: <code>git merge-base main feature</code>. If only one branch modified a line compared to the Base, Git applies that change automatically with zero conflicts.',
      ],
      callout: {
        kind: 'insight',
        text: 'A conflict occurs ONLY when BOTH branches modified the exact same lines relative to the Base in conflicting ways.',
      },
      metrics: { baseAncestor: 'Commit 1a2b3c', localOurs: 'Commit 4d5e6f', remoteTheirs: 'Commit 7g8h9i', conflictStyle: '3-way DAG' },
      scene: {
        entities: {
          base: d(-7, 7, { s: 5.0, h: 54, color: 'slab', glyph: 'boxes', label: ['Merge Base'], sub: '1a2b3c base' }),
          ours: d(-7, -7, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['HEAD (Ours)'], sub: '4d5e6f main' }),
          theirs: d(7, 7, { s: 5.0, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Theirs (Feat)'], sub: '7g8h9i branch' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Merge Base Discovery', [
            `$ git merge-base main feature`,
            `1a2b3c4d5e6f...`,
            `Base: function calcTax(rate) { return rate * 0.1; }`,
            `Ours: function calcTax(rate, disc) { return (rate - disc) * 0.1; }`,
            `Theirs: function calcTax(rate) { return rate * 0.15; }`,
            `! Both changed tax logic independently!`,
          ], { icon: 'terminal' }),
        },
        links: {
          bo: h('base', 'ours', ['base', 'ours'], { label: 'branch ours' }),
          bt: h('base', 'theirs', ['base', 'theirs'], { label: 'branch theirs' }),
        },
        flows: [{ route: ['bo', 'bt'], kind: 'base', rate: 1.5 }],
      },
    },
    {
      short: 'Standard Conflict',
      chapter: 'problem',
      title: 'The Blindness of Standard 2-Way Markers',
      body: [
        'By default, Git outputs standard 2-way conflict markers (<code><<<<<<< HEAD</code> and <code>>>>>>>> feature</code>).',
        'You see what you have, and you see what they have, but you <b>cannot see what was there originally</b>! Without the base, engineers often guess wrong and introduce catastrophic regressions.',
      ],
      callout: {
        kind: 'warning',
        text: 'Standard conflict markers hide the original state. You cannot know if someone renamed a variable, deleted a condition, or changed logic.',
      },
      changes: ['+ Conflict detected in tax.ts', '+ Standard markers hide original base line'],
      metrics: { baseAncestor: 'Hidden', localOurs: 'Displayed', remoteTheirs: 'Displayed', conflictStyle: 'merge (2-way)' },
      scene: {
        entities: {
          base: d(-7, 7, { s: 5.0, h: 54, color: 'slab', glyph: 'boxes', label: ['Merge Base'], sub: '1a2b3c hidden' }),
          ours: d(-7, -7, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['HEAD (Ours)'], sub: '4d5e6f main' }),
          theirs: d(7, 7, { s: 5.0, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Theirs (Feat)'], sub: '7g8h9i branch' }),
          conflict: d(0, 0, { s: 5.2, h: 56, color: 'rose', glyph: 'alert', label: ['tax.ts Clash'], sub: '2-way conflict' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Standard Conflict Markers', [
            `<<<<<<< HEAD`,
            `return (rate - disc) * 0.1;`,
            `=======`,
            `return rate * 0.15;`,
            `>>>>>>> feature`,
            `? Question: What was the original formula? Was disc added or rate changed?`,
          ], { icon: 'terminal' }),
        },
        links: {
          oc: h('ours', 'conflict', ['ours', 'conflict'], { label: 'incoming ours' }),
          tc: h('theirs', 'conflict', ['theirs', 'conflict'], { label: 'incoming theirs' }),
        },
        flows: [{ route: ['oc', 'tc'], kind: 'conflict', rate: 1.6 }],
      },
    },
    {
      short: 'Enable Diff3',
      chapter: 'technique',
      title: 'Enabling diff3 Conflict Style (||||||| base)',
      body: [
        'Running <code>git config --global merge.conflictstyle diff3</code> (or <code>zdiff3</code>) unlocks the true power of 3-way merging.',
        'Git injects a third section: <code>||||||| base</code> containing the original common ancestor code before either developer touched it.',
      ],
      callout: {
        kind: 'tip',
        text: 'With diff3 enabled, conflict resolution becomes a breeze: compare Ours to Base (we added discount), compare Theirs to Base (they updated rate to 0.15).',
      },
      changes: ['+ merge.conflictstyle set to diff3', '+ Conflict markers now include ||||||| base'],
      metrics: { baseAncestor: 'Visible in marker', localOurs: 'Visible', remoteTheirs: 'Visible', conflictStyle: 'diff3 (3-way)' },
      scene: {
        entities: {
          base: d(-7, 7, { s: 5.0, h: 54, color: 'slab', glyph: 'boxes', label: ['Merge Base'], sub: '1a2b3c exposed' }),
          ours: d(-7, -7, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['HEAD (Ours)'], sub: '4d5e6f main' }),
          theirs: d(7, 7, { s: 5.0, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Theirs (Feat)'], sub: '7g8h9i branch' }),
          diff3Engine: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'cpu', label: ['diff3 Engine'], sub: '||||||| base' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Diff3 Conflict Markers', [
            `<<<<<<< HEAD`,
            `return (rate - disc) * 0.1;`,
            `||||||| 1a2b3c (BASE)`,
            `return rate * 0.1;`,
            `=======`,
            `return rate * 0.15;`,
            `>>>>>>> feature`,
          ], { icon: 'terminal' }),
        },
        links: {
          bd: h('base', 'diff3Engine', ['base', 'diff3Engine'], { label: 'inject baseline' }),
          od: h('ours', 'diff3Engine', ['ours', 'diff3Engine'], { label: 'compare ours' }),
          td: h('theirs', 'diff3Engine', ['theirs', 'diff3Engine'], { label: 'compare theirs' }),
        },
        flows: [{ route: ['bd', 'od', 'td'], kind: 'resolved', rate: 1.6 }],
      },
    },
    {
      short: 'Intent Deduction',
      chapter: 'technique',
      title: 'Deducing Developer Intent from 3 Sides',
      body: [
        'By analyzing diff(Base, Ours) and diff(Base, Theirs), true intent becomes mathematically obvious:',
        '1. Ours added <code>- disc</code> discount handling.<br>2. Theirs increased baseline tax rate from <code>0.1</code> to <code>0.15</code>.',
        'Neither developer intended to remove the other change! The synthesized result must combine both.',
      ],
      callout: {
        kind: 'insight',
        text: '90% of tricky merge conflicts disappear once you ask: "What did each person change relative to the common base?"',
      },
      changes: ['+ diff(Base, Ours) = added discount parameter', '+ diff(Base, Theirs) = raised tax rate 10% -> 15%'],
      metrics: { baseAncestor: '1a2b3c', localOurs: 'Add discount', remoteTheirs: 'Update rate', conflictStyle: 'diff3 (3-way)' },
      scene: {
        entities: {
          base: d(-7, 7, { s: 5.0, h: 54, color: 'slab', glyph: 'boxes', label: ['Merge Base'], sub: 'rate * 0.1' }),
          ours: d(-7, -7, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['HEAD (Ours)'], sub: '- disc added' }),
          theirs: d(7, 7, { s: 5.0, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Theirs (Feat)'], sub: 'rate -> 0.15' }),
          analyzer: d(0, 0, { s: 5.2, h: 56, color: 'amber', glyph: 'layers', label: ['Intent Logic'], sub: 'deduce changes' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Intent Deduction Proof', [
            `Delta(Base, Ours):`,
            `  + Added parameter: 'disc'`,
            `  + Modified return: '(rate - disc)'`,
            `Delta(Base, Theirs):`,
            `  + Changed constant: '0.1' -> '0.15'`,
            `= Synthesized clean intent:`,
            `  return (rate - disc) * 0.15;`,
          ], { icon: 'terminal' }),
        },
        links: {
          oa: h('ours', 'analyzer', ['ours', 'analyzer'], { label: 'discount diff' }),
          ta: h('theirs', 'analyzer', ['theirs', 'analyzer'], { label: 'rate diff' }),
        },
        flows: [{ route: ['oa', 'ta'], kind: 'resolved', rate: 1.5 }],
      },
    },
    {
      short: 'Surgical Checkout',
      chapter: 'technique',
      title: 'Surgical Hunk Checkout (--ours vs --theirs)',
      body: [
        'When one branch is completely right and the other is obsolete, do not manually delete conflict markers.',
        'Use surgical hunk checkout: <code>git checkout --ours path/to/file</code> or <code>git checkout --theirs path/to/file</code> to grab an entire file or hunk from either branch directly from index stage 2 or 3.',
      ],
      callout: {
        kind: 'tip',
        text: 'git checkout -p --ours path allows picking individual hunks interactively from stage 2 (ours).',
      },
      changes: ['+ Evaluated stage 2 (:2:tax.ts) vs stage 3 (:3:tax.ts)', '+ Selected intentional combined hunk'],
      metrics: { baseAncestor: 'Stage 1', localOurs: 'Stage 2 (--ours)', remoteTheirs: 'Stage 3 (--theirs)', conflictStyle: 'diff3 (3-way)' },
      scene: {
        entities: {
          base: d(-7, 7, { s: 5.0, h: 54, color: 'slab', glyph: 'boxes', label: ['Stage 1 (:1:)'], sub: '1a2b3c base' }),
          ours: d(-7, -7, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Stage 2 (:2:)'], sub: 'stage 2 (:2:)' }),
          theirs: d(7, 7, { s: 5.0, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Stage 3 (:3:)'], sub: 'stage 3 (:3:)' }),
          synth: d(0, 0, { s: 5.2, h: 56, color: 'green', glyph: 'terminal', label: ['Index Stager'], sub: 'git add tax.ts' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Git Index Stages (ls-files -u)', [
            `$ git ls-files -u`,
            `100644 1a2b3c... 1    tax.ts  (Base)`,
            `100644 4d5e6f... 2    tax.ts  (Ours)`,
            `100644 7g8h9i... 3    tax.ts  (Theirs)`,
            `$ git checkout --theirs tax.ts   # Overwrite with stage 3`,
            `$ git checkout --ours tax.ts     # Overwrite with stage 2`,
          ], { icon: 'terminal' }),
        },
        links: {
          os: h('ours', 'synth', ['ours', 'synth'], { label: 'stage 2 hunk' }),
          ts: h('theirs', 'synth', ['theirs', 'synth'], { label: 'stage 3 hunk' }),
        },
        flows: [{ route: ['os', 'ts'], kind: 'resolved', rate: 1.5 }],
      },
    },
    {
      short: 'Dual-Parent Commit',
      chapter: 'solution',
      title: 'Sealing the 3-Way Merge Commit in the DAG',
      body: [
        'Once all conflicts are resolved and staged (<code>git add tax.ts</code>), running <code>git commit</code> creates a <b>Merge Commit</b>.',
        'Crucially, this commit object contains <b>TWO parent hashes</b>: <code>parent 4d5e6f</code> (Ours/HEAD) and <code>parent 7g8h9i</code> (Theirs).',
      ],
      callout: {
        kind: 'insight',
        text: 'A merge commit permanently records both branch histories in the DAG, ensuring future merges recognize this commit as their new merge base.',
      },
      changes: ['+ Created merge commit b3c4d5 with 2 parent pointers', '+ Resolved conflict permanently in Git history'],
      metrics: { baseAncestor: '1a2b3c', localOurs: 'Parent 1', remoteTheirs: 'Parent 2', conflictStyle: 'Resolved DAG' },
      scene: {
        entities: {
          base: d(-7, 7, { s: 5.0, h: 54, color: 'slab', glyph: 'boxes', label: ['Merge Base'], sub: '1a2b3c base' }),
          ours: d(-7, -7, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Parent 1 (Ours)'], sub: '4d5e6f HEAD' }),
          theirs: d(7, 7, { s: 5.0, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Parent 2 (Theirs)'], sub: '7g8h9i feature' }),
          mergeCommit: d(7, -7, { s: 5.2, h: 56, color: 'green', glyph: 'gitBranch', label: ['Merge Commit'], sub: 'b3c4d5 dual' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Merge Commit Anatomy', [
            `$ git cat-file -p b3c4d5`,
            `tree e9a2c1...`,
            `parent 4d5e6f (Parent 1: HEAD/main)`,
            `parent 7g8h9i (Parent 2: feature)`,
            `author Dev <dev@org.com> 1700000000 +0000`,
            `Merge branch 'feature' into main`,
            `= Dual parent commit seals diamond DAG cleanly`,
          ], { icon: 'terminal' }),
        },
        links: {
          bo: h('base', 'ours', ['base', 'ours'], { label: 'diverged' }),
          bt: h('base', 'theirs', ['base', 'theirs'], { label: 'diverged' }),
          om: h('ours', 'mergeCommit', ['ours', 'mergeCommit'], { label: 'parent 1' }),
          tm: h('theirs', 'mergeCommit', ['theirs', 'mergeCommit'], { label: 'parent 2' }),
        },
        flows: [{ route: ['bo', 'om'], kind: 'resolved', rate: 1.6 }],
      },
    },
  ],
};
