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
          baseAncestor: d(-18, -8, { s: 4.4, h: 56, color: 'slab', glyph: 'boxes', label: ['Merge Base'], sub: 'common base' }),
          oursBranch: d(-8, 4, { s: 4.4, h: 54, color: 'blue', glyph: 'gitBranch', label: ['HEAD (Ours)'], sub: 'discount param' }),
          theirsBranch: d(-4, -12, { s: 4.4, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Theirs (Feat)'], sub: 'tax rate 15%' }),
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
          bo: h('baseAncestor', 'oursBranch', ['baseAncestor', 'oursBranch'], { label: 'branch ours' }),
          bt: h('baseAncestor', 'theirsBranch', ['baseAncestor', 'theirsBranch'], { label: 'branch theirs' }),
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
          baseAncestor: d(-18, -8, { s: 4.4, h: 56, color: 'slab', glyph: 'boxes', label: ['Merge Base'], sub: '1a2b3c hidden' }),
          oursBranch: d(-8, 4, { s: 4.4, h: 54, color: 'blue', glyph: 'gitBranch', label: ['HEAD (Ours)'], sub: 'discount param' }),
          theirsBranch: d(-4, -12, { s: 4.4, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Theirs (Feat)'], sub: 'tax rate 15%' }),
          conflictNode: d(8, -4, { s: 4.4, h: 56, color: 'rose', glyph: 'alert', label: ['tax.ts Clash'], sub: '2-way conflict' }),
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
          oc: h('oursBranch', 'conflictNode', ['oursBranch', 'conflictNode'], { label: 'incoming ours' }),
          tc: h('theirsBranch', 'conflictNode', ['theirsBranch', 'conflictNode'], { label: 'incoming theirs' }),
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
          baseAncestor: d(-18, -8, { s: 4.4, h: 56, color: 'slab', glyph: 'boxes', label: ['Merge Base'], sub: '1a2b3c exposed' }),
          oursBranch: d(-8, 4, { s: 4.4, h: 54, color: 'blue', glyph: 'gitBranch', label: ['HEAD (Ours)'], sub: 'discount param' }),
          theirsBranch: d(-4, -12, { s: 4.4, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Theirs (Feat)'], sub: 'tax rate 15%' }),
          conflictNode: d(8, -4, { s: 4.4, h: 56, color: 'cyan', glyph: 'cpu', label: ['diff3 Engine'], sub: '||||||| base' }),
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
          bo: h('baseAncestor', 'oursBranch', ['baseAncestor', 'oursBranch'], { label: 'ancestor' }),
          bt: h('baseAncestor', 'theirsBranch', ['baseAncestor', 'theirsBranch'], { label: 'ancestor' }),
          od: h('oursBranch', 'conflictNode', ['oursBranch', 'conflictNode'], { label: 'compare ours' }),
          td: h('theirsBranch', 'conflictNode', ['theirsBranch', 'conflictNode'], { label: 'compare theirs' }),
        },
        flows: [{ route: ['bo', 'od'], kind: 'resolved', rate: 1.6 }, { route: ['bt', 'td'], kind: 'resolved', rate: 1.6 }],
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
          baseAncestor: d(-18, -8, { s: 4.4, h: 56, color: 'slab', glyph: 'boxes', label: ['Merge Base'], sub: '1a2b3c base' }),
          oursBranch: d(-8, 4, { s: 4.4, h: 54, color: 'blue', glyph: 'gitBranch', label: ['HEAD (Ours)'], sub: 'intent: disc' }),
          theirsBranch: d(-4, -12, { s: 4.4, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Theirs (Feat)'], sub: 'intent: rate' }),
          conflictNode: d(8, -4, { s: 4.4, h: 56, color: 'green', glyph: 'cpu', label: ['Intent Logic'], sub: 'combine both' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Synthesized Resolution', [
            `# Mathematically resolved code:`,
            `function calcTax(rate, disc) {`,
            `  return (rate - disc) * 0.15;`,
            `}`,
            `= Combines BOTH intents with zero regressions!`,
          ], { icon: 'terminal' }),
        },
        links: {
          bo: h('baseAncestor', 'oursBranch', ['baseAncestor', 'oursBranch'], { label: 'reference base' }),
          bt: h('baseAncestor', 'theirsBranch', ['baseAncestor', 'theirsBranch'], { label: 'reference base' }),
          od: h('oursBranch', 'conflictNode', ['oursBranch', 'conflictNode'], { label: 'merge discount' }),
          td: h('theirsBranch', 'conflictNode', ['theirsBranch', 'conflictNode'], { label: 'merge rate 15%' }),
        },
        flows: [{ route: ['bo', 'od'], kind: 'resolved', rate: 1.6 }, { route: ['bt', 'td'], kind: 'resolved', rate: 1.6 }],
      },
    },
    {
      short: 'Surgical Checkout',
      chapter: 'technique',
      title: 'Surgical Hunk Checkout: --ours vs --theirs',
      body: [
        'When an entire binary or generated file is in conflict, you can discard one side wholesale without opening an editor:',
        '<code>git checkout --ours package-lock.json</code> keeps your version. <code>git checkout --theirs docs/api.md</code> accepts the incoming version cleanly.',
      ],
      callout: {
        kind: 'tip',
        text: 'Remember: In rebase, --ours and --theirs are swapped because you are replaying your commits on top of upstream!',
      },
      changes: ['+ Whole-file conflict resolved cleanly via git checkout --ours / --theirs'],
      metrics: { baseAncestor: '1a2b3c', localOurs: 'Checked out', remoteTheirs: 'Accepted', conflictStyle: 'hunk checkout' },
      scene: {
        entities: {
          baseAncestor: d(-18, -8, { s: 4.4, h: 56, color: 'slab', glyph: 'boxes', label: ['Merge Base'], sub: '1a2b3c base' }),
          oursBranch: d(-8, 4, { s: 4.4, h: 54, color: 'blue', glyph: 'gitBranch', label: ['HEAD (Ours)'], sub: '--ours locked' }),
          theirsBranch: d(-4, -12, { s: 4.4, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Theirs (Feat)'], sub: '--theirs pass' }),
          conflictNode: d(8, -4, { s: 4.4, h: 56, color: 'cyan', glyph: 'terminal', label: ['Checkout CLI'], sub: 'surgical pick' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Surgical Checkout Commands', [
            `$ git checkout --ours package-lock.json`,
            `$ git checkout --theirs generated-docs.md`,
            `$ git add package-lock.json generated-docs.md`,
            `= Conflict resolved instantly for whole files`,
          ], { icon: 'terminal' }),
        },
        links: {
          oc: h('oursBranch', 'conflictNode', ['oursBranch', 'conflictNode'], { label: 'checkout --ours' }),
          tc: h('theirsBranch', 'conflictNode', ['theirsBranch', 'conflictNode'], { label: 'checkout --theirs' }),
        },
        flows: [{ route: ['oc', 'tc'], kind: 'resolved', rate: 1.5 }],
      },
    },
    {
      short: 'Merge Commit',
      chapter: 'scaling',
      title: 'Sealing the 3-Way Merge Commit with Dual Parents',
      body: [
        'Once all conflicts are staged with <code>git add</code>, running <code>git commit</code> produces a unique commit object with <b>two parent hashes</b> (<code>parent 4d5e6f</code> and <code>parent 7g8h9i</code>).',
        'This dual-parent node seals the two branch DAG histories back together.',
      ],
      callout: {
        kind: 'insight',
        text: 'A merge commit permanently records both branches\' ancestral histories, guaranteeing that future merges can find a new, closer Merge Base.',
      },
      changes: ['+ Merge commit 9a8b7c created with dual parents P1 and P2', '+ DAG histories unified back into trunk'],
      metrics: { baseAncestor: '1a2b3c', localOurs: 'Parent 1', remoteTheirs: 'Parent 2', conflictStyle: 'Dual parents' },
      scene: {
        entities: {
          baseAncestor: d(-18, -8, { s: 4.4, h: 56, color: 'slab', glyph: 'boxes', label: ['Merge Base'], sub: '1a2b3c base' }),
          oursBranch: d(-8, 4, { s: 4.4, h: 54, color: 'blue', glyph: 'gitBranch', label: ['HEAD (Ours)'], sub: 'parent 1' }),
          theirsBranch: d(-4, -12, { s: 4.4, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Theirs (Feat)'], sub: 'parent 2' }),
          mergeCommit: d(8, -4, { s: 4.4, h: 56, color: 'green', glyph: 'package', label: ['Merge Commit'], sub: '2-parent merge' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Merge Commit Object Manifest', [
            `$ git cat-file -p 9a8b7c`,
            `tree e8f2a1b3...`,
            `parent 4d5e6f (HEAD / Ours)`,
            `parent 7g8h9i (feature / Theirs)`,
            `author Developer <dev@example.com>`,
            `Merge branch 'feature' into main (diff3 resolved)`,
            `= Dual parents link both histories permanently`,
          ], { icon: 'terminal' }),
        },
        links: {
          om: h('oursBranch', 'mergeCommit', ['oursBranch', 'mergeCommit'], { label: 'parent 1' }),
          tm: h('theirsBranch', 'mergeCommit', ['theirsBranch', 'mergeCommit'], { label: 'parent 2' }),
        },
        flows: [{ route: ['om', 'tm'], kind: 'resolved', rate: 1.6 }],
      },
    },
  ],
};
