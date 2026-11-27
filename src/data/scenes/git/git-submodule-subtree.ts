import {
  makeBlock,
  makeLink,
  makePanel
} from '@/lib/simulator/scene-builders';

export const gitSubmoduleSubtreeLesson = {
  id: 'git-submodule-subtree',
  title: 'Git Submodules vs Subtree: Monorepo Dependency Architectures',
  summary: 'Architectural evaluation of external code embedding: 160000 gitlink commit pointers (.gitmodules) vs inlined commit history (git subtree).',
  minutes: 25,
  level: 'advanced',
  metrics: ['embeddingType', 'pointerStyle', 'ciOverhead', 'repoAutonomy'],
  legend: ['flow', ['submodule', 'gitlink 160000 pointer'], ['subtree', 'inlined tree commit'], ['sync', 'bidirectional sync']],
  goals: [
    { text: 'Submodule architecture: Mode 160000 gitlinks and .gitmodules', step: 1 },
    { text: 'The empty directory CI trap: Why standard clone fails', step: 2 },
    { text: 'The detached HEAD trap: Committing inside submodules without pushing', step: 3 },
    { text: 'The Subtree alternative: Inlining external trees directly into history', step: 4 },
    { text: 'Bidirectional synchronization: git subtree pull & push', step: 5 },
    { text: 'Architectural tradeoff matrix: When to choose submodules vs subtree', step: 6 },
  ],
  steps: [
    {
      short: 'Submodule Model',
      chapter: 'setup',
      title: 'The Submodule Architecture (160000 Gitlink)',
      body: [
        '<code>git submodule add https://github.com/org/common libs/common</code> does NOT store the external files inside your parent repository.',
        'In the parent tree, <code>libs/common</code> is recorded as a special file mode: <code>160000 commit &lt;sha&gt;</code> (a gitlink). The URL is recorded in <code>.gitmodules</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'A submodule is a strict pointer to an external repository commit SHA. It does not auto-update when the external repo adds new commits.',
      },
      metrics: { embeddingType: 'Submodule', pointerStyle: '160000 gitlink SHA', ciOverhead: 'Requires recursive init', repoAutonomy: 'Independent' },
      scene: {
        entities: {
          parentRepo: makeBlock(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'boxes', label: ['Parent Repo'], sub: '.gitmodules' }),
          gitlinkNode: makeBlock(-6, -2, { s: 4.4, h: 56, color: 'purple', glyph: 'terminal', label: ['160000 Gitlink'], sub: 'gitlink SHA' }),
          externalRepo: makeBlock(6, 0, { s: 4.4, h: 54, color: 'slab', glyph: 'cloud', label: ['External Repo'], sub: 'remote repo' }),
          card: makePanel({ x: -14, y: 0, dx: -20, dy: -180 }, 'Submodule Manifest & Tree Entry', [
            `$ cat .gitmodules`,
            `[submodule "libs/common"]`,
            `    path = libs/common`,
            `    url = https://github.com/org/common.git`,
            `$ git ls-tree HEAD libs/common`,
            `160000 commit 7d9e44a1... libs/common`,
            `= Mode 160000 indicates a gitlink commit pointer`,
          ], { icon: 'terminal' }),
        },
        links: {
          pg: makeLink('parentRepo', 'gitlinkNode', ['parentRepo', 'gitlinkNode'], { label: 'declares gitlink' }),
          ge: makeLink('gitlinkNode', 'externalRepo', ['gitlinkNode', 'externalRepo'], { label: 'pointer' }),
        },
        flows: [{ route: ['pg', 'ge'], kind: 'submodule', rate: 1.5 }],
      },
    },
    {
      short: 'CI Trap',
      chapter: 'problem',
      title: 'The #1 Submodule Failure: Empty Directory in CI',
      body: [
        'A standard <code>git clone &lt;repo&gt;</code> does NOT clone submodule contents. The <code>libs/common</code> directory is completely empty on disk!',
        'In CI/CD, the build immediately crashes with <em>Cannot find module \'libs/common\'</em>. The fix requires running <code>git submodule update --init --recursive</code>.',
      ],
      callout: {
        kind: 'warning',
        text: 'Always configure CI actions with submodules: recursive (e.g. actions/checkout@v4 with submodules: true).',
      },
      changes: ['+ Submodule directories empty without explicit recursive clone', '+ CI pipeline crashes unless recursive init is configured'],
      metrics: { embeddingType: 'Submodule', pointerStyle: 'Uninitialized', ciOverhead: 'CRASH (empty folder)', repoAutonomy: 'Broken' },
      scene: {
        entities: {
          parentRepo: makeBlock(-18, -6, { s: 4.4, h: 56, color: 'rose', glyph: 'boxes', label: ['CI Workspace'], sub: 'empty dir' }),
          gitlinkNode: makeBlock(-6, -2, { s: 4.4, h: 56, color: 'rose', glyph: 'alert', label: ['Empty libs/common'], sub: 'missing code' }),
          externalRepo: makeBlock(6, 0, { s: 4.4, h: 54, color: 'slab', glyph: 'cloud', label: ['External Repo'], sub: 'remote repo' }),
          card: makePanel({ x: -14, y: 0, dx: -20, dy: -180 }, 'Empty Directory CI Crash', [
            `$ git clone https://github.com/company/app.git`,
            `$ ls libs/common/`,
            `# Completely EMPTY directory!`,
            `$ npm run build`,
            `Error: Cannot find module 'libs/common/math'`,
            `! Build failed in CI environment!`,
          ], { icon: 'terminal' }),
        },
        links: {
          pg: makeLink('parentRepo', 'gitlinkNode', ['parentRepo', 'gitlinkNode'], { label: 'empty pointer' }),
        },
        flows: [{ route: ['pg'], kind: 'submodule', rate: 1.2 }],
      },
    },
    {
      short: 'Recursive Init',
      chapter: 'technique',
      title: 'Fixing the CI Trap: submodule update --init --recursive',
      body: [
        'To populate submodule directories, run <code>git submodule update --init --recursive</code>.',
        'Git reads <code>.gitmodules</code>, clones each remote repo into <code>.git/modules/</code>, checks out the pinned SHA, and mounts it into the working tree.',
      ],
      callout: {
        kind: 'tip',
        text: 'Use git clone --recurse-submodules to clone and initialize in one command.',
      },
      changes: ['+ git submodule update --init --recursive executed', '+ Submodule working files populated and pinned to gitlink SHA'],
      metrics: { embeddingType: 'Submodule', pointerStyle: 'Pinned SHA', ciOverhead: 'Init complete', repoAutonomy: 'Initialized' },
      scene: {
        entities: {
          parentRepo: makeBlock(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'boxes', label: ['Parent Repo'], sub: 'populated' }),
          gitlinkNode: makeBlock(-6, -2, { s: 4.4, h: 56, color: 'purple', glyph: 'terminal', label: ['160000 Gitlink'], sub: 'pinned SHA' }),
          externalRepo: makeBlock(6, 0, { s: 4.4, h: 54, color: 'slab', glyph: 'cloud', label: ['External Repo'], sub: 'remote repo' }),
          ciInitRunner: makeBlock(-4, 16, { s: 4.4, h: 56, color: 'green', glyph: 'shield', label: ['CI Runner'], sub: 'submodule init' }),
          card: makePanel({ x: -14, y: 0, dx: -20, dy: -180 }, 'Recursive Submodule Checkout', [
            `$ git submodule update --init --recursive`,
            `Submodule 'libs/common' registered for path 'libs/common'`,
            `Cloning into '/repo/libs/common'...`,
            `Submodule path 'libs/common': checked out '7d9e44a'`,
            `= All files populated, CI build passes!`,
          ], { icon: 'terminal' }),
        },
        links: {
          pg: makeLink('parentRepo', 'gitlinkNode', ['parentRepo', 'gitlinkNode'], { label: 'active gitlink' }),
          ge: makeLink('gitlinkNode', 'externalRepo', ['gitlinkNode', 'externalRepo'], { label: 'cloned' }),
          cg: makeLink('ciInitRunner', 'gitlinkNode', ['ciInitRunner', 'gitlinkNode'], { label: 'populate files' }),
        },
        flows: [{ route: ['cg', 'ge'], kind: 'submodule', rate: 1.6 }],
      },
    },
    {
      short: 'Subtree Alternative',
      chapter: 'technique',
      title: 'The Subtree Alternative: Inlining History Directly',
      body: [
        'Sick of submodule pitfalls (empty directories, detached HEADs, extra CI flags)? <b>git subtree</b> is the architectural alternative.',
        'Command: <code>git subtree add --prefix=libs/common &lt;repo&gt; main --squash</code>. Git merges the external repository\'s commit history directly into your parent repo as regular files and trees.',
      ],
      callout: {
        kind: 'insight',
        text: 'With git subtree, cloning is completely normal: git clone gives you 100% of all files with ZERO extra commands or CI configuration!',
      },
      changes: ['+ libs/common inlined directly into tree objects', '+ Zero gitlinks, zero .gitmodules dependencies'],
      metrics: { embeddingType: 'Subtree', pointerStyle: 'Inlined tree SHA', ciOverhead: 'Zero (regular clone)', repoAutonomy: '100% self-contained' },
      scene: {
        entities: {
          parentRepo: makeBlock(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'boxes', label: ['Parent Repo'], sub: 'monorepo root' }),
          subtreeInlined: makeBlock(-6, -2, { s: 4.4, h: 56, color: 'green', glyph: 'package', label: ['Subtree Inlined'], sub: 'inlined tree' }),
          externalRepo: makeBlock(6, 0, { s: 4.4, h: 54, color: 'slab', glyph: 'cloud', label: ['External Repo'], sub: 'upstream repo' }),
          card: makePanel({ x: -14, y: 0, dx: -20, dy: -180 }, 'Subtree Addition Command', [
            `$ git subtree add --prefix=libs/common https://github.com/org/common.git main --squash`,
            `git fetch https://github.com/org/common.git main`,
            `Added dir 'libs/common'`,
            `Squashed commit of the following: ...`,
            `= All files are regular tracked Git files!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ps: makeLink('parentRepo', 'subtreeInlined', ['parentRepo', 'subtreeInlined'], { label: 'contains files' }),
          es: makeLink('externalRepo', 'subtreeInlined', ['externalRepo', 'subtreeInlined'], { label: 'squashed' }),
        },
        flows: [{ route: ['es', 'ps'], kind: 'subtree', rate: 1.6 }],
      },
    },
    {
      short: 'Bidirectional Sync',
      chapter: 'execution',
      title: 'Bidirectional Sync: git subtree pull & push',
      body: [
        'Can you still contribute back to the upstream repository with subtree? Yes!',
        'Pull latest changes: <code>git subtree pull --prefix=libs/common &lt;repo&gt; main --squash</code>. Push local improvements upstream: <code>git subtree push --prefix=libs/common &lt;repo&gt; main</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'git subtree push filters your commit log and synthesizes an isolated branch containing only changes inside prefix.',
      },
      changes: ['+ Bidirectional synchronization established', '+ Local fixes can be pushed upstream anytime'],
      metrics: { embeddingType: 'Subtree', pointerStyle: 'Bidirectional', ciOverhead: 'Zero', repoAutonomy: 'Synchronized' },
      scene: {
        entities: {
          parentRepo: makeBlock(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'boxes', label: ['Parent Repo'], sub: 'local changes' }),
          subtreeInlined: makeBlock(-6, -2, { s: 4.4, h: 56, color: 'green', glyph: 'package', label: ['Subtree Inlined'], sub: 'inlined tree' }),
          externalRepo: makeBlock(6, 0, { s: 4.4, h: 54, color: 'slab', glyph: 'cloud', label: ['External Repo'], sub: 'upstream repo' }),
          bidirectionalSync: makeBlock(-2, 16, { s: 4.4, h: 54, color: 'cyan', glyph: 'cpu', label: ['Subtree Push'], sub: 'upstream sync' }),
          card: makePanel({ x: -14, y: 0, dx: -20, dy: -180 }, 'Bidirectional Sync CLI', [
            `# Pull updates from upstream:`,
            `$ git subtree pull --prefix=libs/common origin main --squash`,
            `# Push local fixes back to upstream:`,
            `$ git subtree push --prefix=libs/common https://github.com/org/common.git main`,
            `= Clean upstream synchronization on demand!`,
          ], { icon: 'terminal' }),
        },
        links: {
          ps: makeLink('parentRepo', 'subtreeInlined', ['parentRepo', 'subtreeInlined'], { label: 'local edit' }),
          sb: makeLink('subtreeInlined', 'bidirectionalSync', ['subtreeInlined', 'bidirectionalSync'], { label: 'filter prefix' }),
          be: makeLink('bidirectionalSync', 'externalRepo', ['bidirectionalSync', 'externalRepo'], { label: 'push' }),
        },
        flows: [{ route: ['ps', 'sb', 'be'], kind: 'sync', rate: 1.8 }],
      },
    },
    {
      short: 'Tradeoff Matrix',
      chapter: 'scaling',
      title: 'Architectural Tradeoff: Submodule vs Subtree',
      body: [
        '<b>Submodules</b>: Ideal for strictly separate repositories, closed-source sub-repos requiring independent access credentials, or multi-gigabyte dependencies that not all developers need.',
        '<b>Subtree</b>: Ideal for monorepos, shared utility libraries, and CI pipelines where simplicity, friction-free cloning, and self-contained builds outweigh strict repo separation.',
      ],
      callout: {
        kind: 'insight',
        text: 'Rule of thumb: If third-party developers or automated CI struggle with submodules, migrate to git subtree.',
      },
      changes: ['+ Architectural evaluation complete', '+ Optimal monorepo dependency strategy chosen'],
      metrics: { embeddingType: 'Evaluated', pointerStyle: 'Matched', ciOverhead: 'Optimized', repoAutonomy: 'Standardized' },
      scene: {
        entities: {
          parentRepo: makeBlock(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'boxes', label: ['Parent Repo'], sub: 'monorepo root' }),
          subtreeInlined: makeBlock(-6, -2, { s: 4.4, h: 56, color: 'green', glyph: 'package', label: ['Subtree Inlined'], sub: 'chosen design' }),
          externalRepo: makeBlock(6, 0, { s: 4.4, h: 54, color: 'slab', glyph: 'cloud', label: ['External Repo'], sub: 'remote repo' }),
          card: makePanel({ x: -14, y: 0, dx: -20, dy: -180 }, 'Architectural Decision Matrix', [
            `Criterion          | Submodule         | Subtree`,
            `-------------------|-------------------|------------------`,
            `Clone simplicity   | Bad (recursive)   | Excellent (plain)`,
            `CI friction        | High (extra auth) | Zero (inlined)`,
            `Repo size          | Minimal           | Larger (inlined)`,
            `Repo autonomy      | Strict gitlink    | Unified history`,
            `Recommendation     | External SDKs     | Monorepo libs`,
            `= Subtree chosen for unified monorepo speed`,
          ], { icon: 'terminal' }),
        },
        links: {
          ps: makeLink('parentRepo', 'subtreeInlined', ['parentRepo', 'subtreeInlined'], { label: 'inlined' }),
          es: makeLink('externalRepo', 'subtreeInlined', ['externalRepo', 'subtreeInlined'], { label: 'tracked' }),
        },
        flows: [{ route: ['es', 'ps'], kind: 'subtree', rate: 1.5 }],
      },
    },
  ],
};
