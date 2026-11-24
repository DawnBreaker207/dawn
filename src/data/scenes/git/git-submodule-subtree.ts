// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
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
          parentRepo: d(-7, 7, { s: 5.0, h: 54, color: 'blue', glyph: 'boxes', label: ['Parent Repo'], sub: 'holds .gitmodules' }),
          gitLinkMode: d(0, 0, { s: 5.2, h: 56, color: 'purple', glyph: 'terminal', label: ['160000 Gitlink'], sub: 'libs/common -> SHA' }),
          externalRepo: d(7, -7, { s: 5.0, h: 54, color: 'slab', glyph: 'cloud', label: ['External Repo'], sub: 'org/common on web' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Submodule Manifest & Tree Entry', [
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
          pg: h('parentRepo', 'gitLinkMode', ['parentRepo', 'gitLinkMode'], { label: 'declares gitlink' }),
          ge: h('gitLinkMode', 'externalRepo', ['gitLinkMode', 'externalRepo'], { label: 'remote pointer' }),
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
          ciClone: y(-7, 7, { label: 'CI Runner', tags: [{ text: 'git clone (plain)', tone: 'rose', icon: 'terminal' }] }),
          emptyFolder: d(0, 0, { s: 5.2, h: 56, color: 'rose', glyph: 'alert', label: ['Empty libs/common'], sub: '0 bytes on disk' }),
          buildCrash: d(7, -7, { s: 5.0, h: 54, color: 'rose', glyph: 'server', label: ['CI Build Crash'], sub: 'Cannot find mod' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Empty Submodule CI Crash', [
            `$ git clone https://github.com/org/app.git`,
            `$ cd app && npm run build`,
            `Error: Cannot find module 'libs/common/index.ts'`,
            `$ ls libs/common/  # Completely empty!`,
            `Fix: git submodule update --init --recursive`,
            `= Common headache for new contributors and CI scripts`,
          ], { icon: 'terminal' }),
        },
        links: {
          ce: h('ciClone', 'emptyFolder', ['ciClone', 'emptyFolder'], { label: 'skips submodule' }),
          eb: h('emptyFolder', 'buildCrash', ['emptyFolder', 'buildCrash'], { label: 'missing code' }),
        },
        flows: [{ route: ['ce', 'eb'], kind: 'submodule', rate: 1.5 }],
      },
    },
    {
      short: 'Detached Trap',
      chapter: 'problem',
      title: 'The Detached HEAD Submodule Trap',
      body: [
        'When you run <code>git submodule update</code>, Git checks out the exact SHA recorded in the parent tree. It checks it out into <b>Detached HEAD</b> state!',
        'Developers frequently <code>cd libs/common</code>, edit code, commit, and push the parent repo... without pushing the submodule! Other team members can never fetch that SHA.',
      ],
      callout: {
        kind: 'warning',
        text: 'If you commit inside a submodule, you must push the submodule repository first before committing and pushing the parent repo!',
      },
      changes: ['+ Submodule checked out in detached HEAD', '+ Risk of pushing parent with unpushed submodule SHA'],
      metrics: { embeddingType: 'Submodule', pointerStyle: 'Detached SHA', ciOverhead: 'High', repoAutonomy: 'Split commits' },
      scene: {
        entities: {
          submoduleDir: y(-7, 7, { label: 'Submodule Dir', tags: [{ text: 'detached HEAD', tone: 'amber', icon: 'terminal' }] }),
          unpushedCommit: d(0, 0, { s: 5.2, h: 56, color: 'rose', glyph: 'alert', label: ['Local Sub Commit'], sub: 'unpushed to origin' }),
          brokenParent: d(7, -7, { s: 5.0, h: 54, color: 'rose', glyph: 'package', label: ['Parent Pointer'], sub: 'dangling remote' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Detached Submodule Hazard', [
            `$ cd libs/common`,
            `$ git status  # HEAD detached at 7d9e44`,
            `$ git commit -am "fix helper"`,
            `$ cd ../..`,
            `$ git commit -am "update submodule pointer"`,
            `$ git push origin main`,
            `! Teammate error: Server does not have commit 8f1a2b!`,
          ], { icon: 'terminal' }),
        },
        links: {
          su: h('submoduleDir', 'unpushedCommit', ['submoduleDir', 'unpushedCommit'], { label: 'unpushed edit' }),
          ub: h('unpushedCommit', 'brokenParent', ['unpushedCommit', 'brokenParent'], { label: 'unfetchable SHA' }),
        },
        flows: [{ route: ['su', 'ub'], kind: 'submodule', rate: 1.5 }],
      },
    },
    {
      short: 'Git Subtree',
      chapter: 'setup',
      title: 'The Subtree Alternative: Inlining Full History',
      body: [
        '<b>Git Subtree</b> provides an entirely different philosophy: it inlines the external repository files and commit history directly into your parent repository.',
        'Command: <code>git subtree add --prefix=libs/common &lt;url&gt; main --squash</code>.',
        'Files are normal files on disk. Zero gitlinks, zero <code>.gitmodules</code>, zero extra clone commands needed in CI.',
      ],
      callout: {
        kind: 'insight',
        text: 'To any developer or CI runner, a subtree repository looks like a standard monorepo. git clone just works.',
      },
      changes: ['+ External files inlined directly into parent tree', '+ Zero special CI commands required'],
      metrics: { embeddingType: 'Subtree', pointerStyle: 'Inlined tree object', ciOverhead: 'Zero (clone works)', repoAutonomy: 'Monorepo' },
      scene: {
        entities: {
          subtreeCmd: y(-7, 7, { label: 'Subtree CLI', tags: [{ text: 'git subtree add', tone: 'green', icon: 'terminal' }] }),
          inlinedTree: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'boxes', label: ['Inlined Tree'], sub: '040000 tree' }),
          monorepoFs: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['Clean Monorepo'], sub: 'zero CI config' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Subtree Addition CLI', [
            `$ git subtree add --prefix=libs/common \\`,
            `    https://github.com/org/common.git main --squash`,
            `Added dir 'libs/common'`,
            `$ git ls-tree HEAD libs/common`,
            `040000 tree 8a3f91... libs/common`,
            `= Pure standard tree object! No gitlink, no .gitmodules`,
          ], { icon: 'terminal' }),
        },
        links: {
          si: h('subtreeCmd', 'inlinedTree', ['subtreeCmd', 'inlinedTree'], { label: 'merge commit' }),
          im: h('inlinedTree', 'monorepoFs', ['inlinedTree', 'monorepoFs'], { label: 'normal disk files' }),
        },
        flows: [{ route: ['si', 'im'], kind: 'subtree', rate: 1.5 }],
      },
    },
    {
      short: 'Subtree Sync',
      chapter: 'execution',
      title: 'Syncing Changes: git subtree pull & push',
      body: [
        'When the external common library releases an update, pull it into your repository with one command:',
        '<code>git subtree pull --prefix=libs/common &lt;url&gt; main --squash</code>.',
        'You can even push local edits back upstream using <code>git subtree push --prefix=libs/common &lt;url&gt; main</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Using --squash keeps your parent git log clean by condensing external commits into a single merge commit.',
      },
      changes: ['+ Upstream updates merged via single subtree pull command', '+ Edits pushable back upstream without leaving parent repo'],
      metrics: { embeddingType: 'Subtree', pointerStyle: 'Squashed merge', ciOverhead: 'Zero', repoAutonomy: 'Bidirectional sync' },
      scene: {
        entities: {
          subtreePull: y(-7, 7, { label: 'Sync Runner', tags: [{ text: 'git subtree pull', tone: 'blue', icon: 'terminal' }] }),
          squashIntegrator: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'cpu', label: ['Squash Integrator'], sub: '1 clean merge' }),
          updatedCommon: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['libs/common Sync'], sub: 'synced code' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Subtree Synchronization CLI', [
            `# Pull upstream updates:`,
            `$ git subtree pull --prefix=libs/common \\`,
            `    https://github.com/org/common.git main --squash`,
            `# Push local improvements upstream:`,
            `$ git subtree push --prefix=libs/common \\`,
            `    https://github.com/org/common.git feature-patch`,
          ], { icon: 'terminal' }),
        },
        links: {
          sm: h('subtreePull', 'squashIntegrator', ['subtreePull', 'squashIntegrator'], { label: 'fetch & squash' }),
          mu: h('squashIntegrator', 'updatedCommon', ['squashIntegrator', 'updatedCommon'], { label: 'commit to parent' }),
        },
        flows: [{ route: ['sm', 'mu'], kind: 'sync', rate: 1.5 }],
      },
    },
    {
      short: 'Tradeoff Matrix',
      chapter: 'scaling',
      title: 'Architectural Decision: Submodule vs Subtree',
      body: [
        '<b>When to use Submodules:</b> When repos are massive (100GB+ game assets, firmware) and parent repos must pin exact SHAs without downloading heavy assets.',
        '<b>When to use Subtree:</b> For enterprise web monorepos, shared utilities, and microservices where developer ergonomics, simple CI/CD, and atomicity matter most.',
      ],
      callout: {
        kind: 'insight',
        text: 'For 95% of software development teams, git subtree provides vastly superior developer experience over submodules.',
      },
      changes: ['+ Architectural clarity established for team repository strategy'],
      metrics: { embeddingType: 'Decision Matrix', pointerStyle: 'Strategic Choice', ciOverhead: 'Minimized', repoAutonomy: 'Optimized' },
      scene: {
        entities: {
          submoduleChoice: d(-7, 7, { s: 5.0, h: 54, color: 'amber', glyph: 'cloud', label: ['Submodules'], sub: 'massive assets' }),
          decisionEngine: d(0, 0, { s: 5.2, h: 56, color: 'purple', glyph: 'boxes', label: ['Repo Strategy'], sub: 'evaluate needs' }),
          subtreeChoice: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['Subtree'], sub: 'monorepo speed' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Architectural Decision Matrix', [
            `Dimension         | Submodule        | Subtree`,
            `------------------+------------------+-----------------`,
            `Storage           | 160000 pointer   | Inlined trees`,
            `CI Complexity     | High (recursive) | Zero (plain clone)`,
            `Repo Footprint    | Extremely light  | Larger size`,
            `Detached Hazard   | Yes (frequent)   | No (standard repo)`,
            `Recommendation    | Heavy binaries   | Web & libraries`,
          ], { icon: 'terminal' }),
        },
        links: {
          ds: h('decisionEngine', 'submoduleChoice', ['decisionEngine', 'submoduleChoice'], { label: 'pin binaries' }),
          dt: h('decisionEngine', 'subtreeChoice', ['decisionEngine', 'subtreeChoice'], { label: 'inlined code' }),
        },
        flows: [{ route: ['ds', 'dt'], kind: 'subtree', rate: 1.5 }],
      },
    },
  ],
};
