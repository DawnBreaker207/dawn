// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitRefsSymbolicLesson = {
  id: 'git-refs-symbolic',
  title: 'Refs, HEAD Symbolic Pointer & Packed-Refs',
  summary: 'How Git tracks pointers: branches as lightweight 41-byte text files in .git/refs/heads/, HEAD as a symbolic reference, and how git pack-refs accelerates repositories with thousands of tags.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['headRef', 'branchTarget', 'refType', 'packedState'],
  legend: ['pointer', ['sym', 'symbolic pointer'], ['packed', 'packed refs']],
  goals: [
    { text: 'Branches are nothing more than pointers: 41 bytes in .git/refs/heads/', step: 1 },
    { text: 'HEAD: the symbolic reference tracking your active checkout', step: 2 },
    { text: 'Annotated Tags vs Lightweight Tags', step: 3 },
    { text: 'Packed-refs: speeding up I/O by compressing thousands of loose ref files', step: 4 },
  ],
  steps: [
    {
      short: 'Branch Ref',
      chapter: 'setup',
      title: 'A Branch is Just a 41-Byte Text File',
      body: [
        'Many developers imagine a Git branch as a heavyweight container or copy of the project. In reality, a branch is literally a single file containing 40 hex characters and a newline character (41 bytes) stored at <code>.git/refs/heads/<branch-name></code>.',
        'Creating a branch with <code>git branch feature</code> simply writes the current commit hash into a new text file. It consumes zero extra disk space for your project files.',
      ],
      callout: {
        kind: 'insight',
        text: 'Creating, deleting, and renaming branches in Git is instantaneous because it is just creating a 41-byte file on disk.',
      },
      metrics: { headRef: 'ref: refs/heads/main', branchTarget: 'Commit 3f8a12', refType: 'Loose ref', packedState: 'Unpacked' },
      scene: {
        entities: {
          mainRef: d(-6, 0, { color: 'green', glyph: 'gitBranch', label: ['.git/refs/heads/main'], sub: '3f8a12c49b... (41B)' }),
          commit: d(6, 0, { color: 'purple', glyph: 'boxes', label: ['Commit 3f8a12'], sub: 'tree, author, message' }),
        },
        links: {
          mc: h('mainRef', 'commit', ['mainRef', 'commit'], { label: 'points to' }),
        },
        flows: [{ route: ['mc'], rate: 1.4 }],
      },
    },
    {
      short: 'HEAD Pointer',
      chapter: 'technique',
      title: 'HEAD: The Symbolic Reference',
      body: [
        'How does Git know which branch you are on? It reads <code>.git/HEAD</code>.',
        'In normal operation, HEAD is a <b>Symbolic Reference</b> containing <code>ref: refs/heads/main</code>. When you commit, Git dereferences HEAD to find <code>main</code>, and updates <code>main</code> to the new commit hash. HEAD moves automatically with the branch.',
      ],
      callout: {
        kind: 'tip',
        text: 'If HEAD points directly to a commit hash instead of a branch ref, you are in the infamous "Detached HEAD" state.',
      },
      changes: ['+ HEAD points to refs/heads/main', '+ Switching branches changes only the text inside .git/HEAD'],
      metrics: { headRef: 'ref: refs/heads/main', branchTarget: 'refs/heads/main', refType: 'Symbolic Ref', packedState: 'Active' },
      scene: {
        entities: {
          head: d(-10, 0, { color: 'yellow', glyph: 'terminal', label: ['.git/HEAD'], sub: 'ref: refs/heads/main' }),
          branch: d(0, 0, { color: 'green', glyph: 'gitBranch', label: ['refs/heads/main'], sub: 'points to 3f8a12' }),
          commit: d(10, 0, { color: 'purple', glyph: 'boxes', label: ['Commit 3f8a12'], sub: 'active snapshot' }),
        },
        links: {
          hb: h('head', 'branch', ['head', 'branch'], { style: 'dashed', label: 'symbolic ref' }),
          bc: h('branch', 'commit', ['branch', 'commit'], { label: 'direct ref' }),
        },
        flows: [{ route: ['hb', 'bc'], kind: 'sym', rate: 1.5 }],
      },
    },
    {
      short: 'Packed Refs',
      chapter: 'solution',
      title: 'Packed Refs: Scaling to Thousands of Branches & Tags',
      body: [
        'When a large repository accumulates 20,000 tags and branches, storing each as an individual file in <code>.git/refs/</code> degrades operating system filesystem inode performance.',
        '<code>git pack-refs --all --prune</code> consolidates all loose refs into a single sorted text file: <code>.git/packed-refs</code>. Git binary searches this file in $O(\\log N)$ time, speeding up fetch, checkout, and status checks drastically.',
      ],
      callout: {
        kind: 'insight',
        text: 'If a loose ref file exists in .git/refs/, it overrides any matching entry in packed-refs.',
      },
      changes: ['+ 10,000 loose files pruned from .git/refs/tags/', '+ Single consolidated .git/packed-refs file created', '+ Lightning fast lookup via binary search'],
      metrics: { headRef: 'Active', branchTarget: 'Synced', refType: 'Packed Ref', packedState: '1 file (compact)' },
      scene: {
        entities: {
          packed: d(0, 0, { s: 4.5, color: 'blue', glyph: 'package', label: ['.git/packed-refs'], sub: '20,000 refs in 1 sorted file' }),
          gitCmd: d(-10, 0, { color: 'slab', glyph: 'terminal', label: ['git status / log'], sub: 'binary search lookup' }),
          obj: d(10, 0, { color: 'green', glyph: 'boxes', label: ['Commit Objects'], sub: 'instant resolution' }),
        },
        links: {
          gp: h('gitCmd', 'packed', ['gitCmd', 'packed'], { label: 'O(log N) lookup' }),
          po: h('packed', 'obj', ['packed', 'obj'], { label: 'resolve SHA' }),
        },
        flows: [{ route: ['gp', 'po'], kind: 'packed', rate: 1.8 }],
      },
    },
  ],
};
