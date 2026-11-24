// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
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
          base: d(-10, -18, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['Merge Base'], sub: 'commit 1a2b3c' }),
          ours: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'gitBranch', label: ['HEAD (Ours)'], sub: 'commit 4d5e6f' }),
          theirs: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'gitBranch', label: ['Branch (Theirs)'], sub: 'commit 7g8h9i' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Merge Base Discovery', [
            `$ git merge-base main feature`,
            `1a2b3c4d5e6f...`,
            `Base: function calculateTax(rate) { return rate * 0.1; }`,
            `Ours: function calculateTax(rate, disc) { return (rate - disc) * 0.1; }`,
            `Theirs: function calculateTax(rate) { return rate * 0.15; }`,
            `! Both changed rate logic differently!`,
          ], { icon: 'terminal' }),
          zDiff: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, '3-WAY MERGE BASE TOPOLOGY'),
        },
        links: {
          bo: h('base', 'ours', ['base', 'ours'], { label: 'diverged ours' }),
          bt: h('base', 'theirs', ['base', 'theirs'], { label: 'diverged theirs' }),
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
          file: d(-10, -18, { s: 4.8, h: 50, color: 'rose', glyph: 'terminal', label: ['tax.ts Conflict'], sub: 'standard 2-way' }),
          conflictParser: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'cpu', label: ['Conflict Parser'], sub: 'hides base code' }),
          ambiguousDiff: d(10, 8, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['Ambiguous State'], sub: 'human guessing required' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Standard Conflict Markers', [
            `<<<<<<< HEAD`,
            `return (rate - disc) * 0.1;`,
            `=======`,
            `return rate * 0.15;`,
            `>>>>>>> feature`,
            `? Question: What was the original formula? Was disc added or rate changed?`,
          ], { icon: 'terminal' }),
          zDiff: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, '2-WAY CONFLICT AMBIGUITY'),
        },
        links: {
          fc: h('file', 'conflictParser', ['file', 'conflictParser'], { label: 'parse markers' }),
          ca: h('conflictParser', 'ambiguousDiff', ['conflictParser', 'ambiguousDiff'], { label: 'unknown base' }),
        },
        flows: [{ route: ['fc', 'ca'], kind: 'conflict', rate: 1.5 }],
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
          config: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['git config'], sub: 'conflictstyle diff3' }),
          diff3Engine: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['diff3 Engine'], sub: 'injects ||||||| base' }),
          diff3File: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['tax.ts (diff3)'], sub: 'full context revealed' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Diff3 Conflict Markers', [
            `<<<<<<< HEAD`,
            `return (rate - disc) * 0.1;`,
            `||||||| 1a2b3c (BASE)`,
            `return rate * 0.1;`,
            `=======`,
            `return rate * 0.15;`,
            `>>>>>>> feature`,
          ], { icon: 'terminal' }),
          zDiff: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'DIFF3 CONFLICT STYLE ENGINES'),
        },
        links: {
          cd: h('config', 'diff3Engine', ['config', 'diff3Engine'], { label: 'configure diff3' }),
          dd: h('diff3Engine', 'diff3File', ['diff3Engine', 'diff3File'], { label: 'output 3-way markers' }),
        },
        flows: [{ route: ['cd', 'dd'], kind: 'resolved', rate: 1.5 }],
      },
    },
    {
      short: 'Intent Deduction',
      chapter: 'technique',
      title: 'Deducing Developer Intent from 3 Sides',
      body: [
        'By reading all three sections, the exact intent of both sides is obvious without talking to either engineer:',
        '1. Head introduced a discount parameter <code>disc</code>. 2. Feature adjusted tax multiplier from <code>0.1</code> to <code>0.15</code>. 3. Synthesized merge: <code>return (rate - disc) * 0.15;</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Diff3 transforms guessing into pure deductive logic. Both changes are cleanly unified without losing either improvement.',
      },
      changes: ['+ Developer deduces synthesized resolution: (rate - disc) * 0.15'],
      metrics: { baseAncestor: 'Compared', localOurs: 'Integrated', remoteTheirs: 'Integrated', conflictStyle: 'Synthesized' },
      scene: {
        entities: {
          analyst: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['Deductive Logic'], sub: 'synthesize diffs' }),
          codeMerge: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['Resolved Hunk'], sub: '(rate - disc) * 0.15' }),
          stagingArea: d(10, 8, { s: 4.8, h: 50, color: 'amber', glyph: 'boxes', label: ['git add tax.ts'], sub: 'marked resolved' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Logical Synthesis Logic', [
            `Ours vs Base: Delta = [add disc parameter]`,
            `Theirs vs Base: Delta = [update rate to 0.15]`,
            `Combined Resolution:`,
            `function calculateTax(rate, disc) {`,
            `    return (rate - disc) * 0.15;`,
            `}`,
            `$ git add src/tax.ts`,
          ], { icon: 'terminal' }),
          zDiff: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'INTENT DEDUCTION & RESOLUTION'),
        },
        links: {
          ac: h('analyst', 'codeMerge', ['analyst', 'codeMerge'], { label: 'apply synthesis' }),
          cs: h('codeMerge', 'stagingArea', ['codeMerge', 'stagingArea'], { label: 'stage resolved file' }),
        },
        flows: [{ route: ['ac', 'cs'], kind: 'resolved', rate: 1.5 }],
      },
    },
    {
      short: 'Surgical Checkout',
      chapter: 'execution',
      title: 'Surgical Hunk Checkout (--ours vs --theirs)',
      body: [
        'If one side is completely correct and the other side is completely obsolete, you don’t need to edit markers manually.',
        'Use <code>git checkout --ours src/tax.ts</code> to accept HEAD’s version in its entirety, or <code>git checkout --theirs src/tax.ts</code> to adopt the incoming branch version.',
      ],
      callout: {
        kind: 'tip',
        text: 'During a git rebase, note that --ours and --theirs are swapped because rebase cherry-picks onto the upstream branch!',
      },
      changes: ['+ Fast resolution for binary files or total replacements'],
      metrics: { baseAncestor: 'Ignored', localOurs: 'Selected (--ours)', remoteTheirs: 'Discarded', conflictStyle: 'Surgical pick' },
      scene: {
        entities: {
          picker: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['git checkout --ours'], sub: 'fast-forward hunk' }),
          stagedIndex: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'boxes', label: ['Index Stage 2'], sub: 'adopt our tree entry' }),
          finalFile: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['tax.ts (Clean)'], sub: 'conflict cleared' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Surgical Checkout Commands', [
            `$ git checkout --ours src/tax.ts`,
            `$ git add src/tax.ts`,
            `# Or for incoming version:`,
            `$ git checkout --theirs src/tax.ts`,
            `$ git diff --check  # confirms no stray marker left`,
          ], { icon: 'terminal' }),
          zDiff: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'SURGICAL HUNK CHECKOUT'),
        },
        links: {
          ps: h('picker', 'stagedIndex', ['picker', 'stagedIndex'], { label: 'stage version' }),
          sf: h('stagedIndex', 'finalFile', ['stagedIndex', 'finalFile'], { label: 'write disk file' }),
        },
        flows: [{ route: ['ps', 'sf'], kind: 'resolved', rate: 1.5 }],
      },
    },
    {
      short: 'Merge Commit',
      chapter: 'scaling',
      title: 'Sealing the 3-Way Merge Commit (Dual Parents)',
      body: [
        'Running <code>git commit</code> finishes the merge operation. Unlike normal commits that have exactly 1 parent, a merge commit has <b>2 parents</b>.',
        'Parent 1: <code>4d5e6f</code> (Ours). Parent 2: <code>7g8h9i</code> (Theirs). The commit tree holds the synthesized code, reuniting the divergent branches into a single DAG line.',
      ],
      callout: {
        kind: 'insight',
        text: 'The dual parents preserve the full history of both branches forever, allowing git log to trace ancestry through either lineage.',
      },
      changes: ['+ Merge commit created with dual parent pointers', '+ Branches reunited in Git DAG'],
      metrics: { baseAncestor: 'Preserved', localOurs: 'Parent 1', remoteTheirs: 'Parent 2', conflictStyle: 'Resolved DAG' },
      scene: {
        entities: {
          parentOurs: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'boxes', label: ['Parent 1 (Ours)'], sub: 'commit 4d5e6f' }),
          mergeCommit: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['Merge Commit'], sub: 'commit b3c4d5' }),
          parentTheirs: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Parent 2 (Theirs)'], sub: 'commit 7g8h9i' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Merge Commit Inspection', [
            `$ git cat-file -p b3c4d5`,
            `tree 9f8e7d...`,
            `parent 4d5e6f... (Ours)`,
            `parent 7g8h9i... (Theirs)`,
            `author Alice <alice@corp.com>`,
            `Merge branch 'feature' into main`,
          ], { icon: 'terminal' }),
          zDiff: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'DUAL-PARENT MERGE GRAPH SEALS'),
        },
        links: {
          mo: h('mergeCommit', 'parentOurs', ['mergeCommit', 'parentOurs'], { label: 'parent 1 pointer' }),
          mt: h('mergeCommit', 'parentTheirs', ['mergeCommit', 'parentTheirs'], { label: 'parent 2 pointer' }),
        },
        flows: [{ route: ['mo', 'mt'], kind: 'resolved', rate: 1.6 }],
      },
    },
  ],
};
