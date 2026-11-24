// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitRefsSymbolicLesson = {
  id: 'git-refs-symbolic',
  title: 'Git References: Symbolic Refs, Remotes & Packed-Refs',
  summary: 'Deconstruct how Git tracks branch state: 41-byte loose refs, symbolic reference dereferencing (.git/HEAD), remote-tracking branches, and packed-refs optimization.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['headRef', 'branchTarget', 'refType', 'packedState'],
  legend: ['flow', ['sym', 'symbolic pointer'], ['pointer', 'direct ref'], ['packed', 'packed refs table'], ['remote', 'network sync']],
  goals: [
    { text: 'A branch is literally just a 41-byte text file on disk', step: 1 },
    { text: 'HEAD: The symbolic reference pointing to branch names', step: 2 },
    { text: 'Remote-tracking references in .git/refs/remotes/origin/', step: 3 },
    { text: 'Branch upstream tracking configuration in .git/config', step: 4 },
    { text: 'Packed-refs: Consolidating 50,000 loose references into one file', step: 5 },
    { text: 'Atomic reference updates via temporary lockfiles and rename()', step: 6 },
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
          mainRef: d(-7, 7, { s: 5.0, h: 54, color: 'green', glyph: 'gitBranch', label: ['Branch Ref'], sub: '41-byte ref' }),
          commitObj: d(0, 0, { s: 5.2, h: 56, color: 'purple', glyph: 'package', label: ['Commit 3f8a12'], sub: 'commit 3f8a12' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Branch File on Filesystem', [
            `$ cat .git/refs/heads/main`,
            `3f8a12c49b56f890e123456789abcdef01234567`,
            `$ ls -la .git/refs/heads/`,
            `-rw-r--r-- 1 dawn staff 41 Nov 24 10:00 main`,
            `= Exactly 41 bytes (40 hex chars + 1 newline)`,
          ], { icon: 'terminal' }),
        },
        links: {
          mc: h('mainRef', 'commitObj', ['mainRef', 'commitObj'], { label: 'points to commit' }),
        },
        flows: [{ route: ['mc'], kind: 'pointer', rate: 1.4 }],
      },
    },
    {
      short: 'HEAD Pointer',
      chapter: 'setup',
      title: 'HEAD: The Symbolic Reference',
      body: [
        'How does Git know which branch you are currently on? It reads <code>.git/HEAD</code>.',
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
          headSymbol: y(-7, 7, { label: 'HEAD Pointer', tags: [{ text: 'ref: refs/heads/main', tone: 'cyan', icon: 'terminal' }] }),
          branchRef: d(0, 0, { s: 5.2, h: 56, color: 'green', glyph: 'gitBranch', label: ['Branch main'], sub: '41-byte ref' }),
          commitNode: d(7, -7, { s: 5.0, h: 54, color: 'purple', glyph: 'package', label: ['Commit 3f8a12'], sub: 'commit 3f8a12' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'HEAD Symbolic Dereference', [
            `$ cat .git/HEAD`,
            `ref: refs/heads/main`,
            `$ git symbolic-ref HEAD`,
            `refs/heads/main`,
            `$ git rev-parse HEAD`,
            `3f8a12c49b56f890e123456789abcdef01234567`,
          ], { icon: 'terminal' }),
        },
        links: {
          hb: h('headSymbol', 'branchRef', ['headSymbol', 'branchRef'], { style: 'dashed', label: 'symbolic ref' }),
          bc: h('branchRef', 'commitNode', ['branchRef', 'commitNode'], { label: 'direct ref' }),
        },
        flows: [{ route: ['hb', 'bc'], kind: 'sym', rate: 1.5 }],
      },
    },
    {
      short: 'Remote Tracking',
      chapter: 'execution',
      title: 'Remote Tracking Refs (.git/refs/remotes/)',
      body: [
        'When you clone a repository, Git creates <b>Remote Tracking References</b> under <code>.git/refs/remotes/origin/</code>.',
        'These are local bookmarks of where the remote server was during the last <code>fetch</code> or <code>push</code>. You cannot commit directly to them; they only update during network transfers.',
      ],
      callout: {
        kind: 'insight',
        text: 'Running git fetch origin updates origin/main without touching your local main branch or your working directory.',
      },
      changes: ['+ origin/main tracks remote commit pointer', '+ Local main remains separate until merged or rebased'],
      metrics: { headRef: 'refs/heads/main', branchTarget: 'origin/main', refType: 'Remote tracking', packedState: 'Synced' },
      scene: {
        entities: {
          localBranch: d(-7, 7, { s: 5.0, h: 54, color: 'green', glyph: 'gitBranch', label: ['Local main'], sub: 'local branch' }),
          remoteRef: d(0, 0, { s: 5.2, h: 56, color: 'blue', glyph: 'cloud', label: ['origin/main'], sub: 'remote ref' }),
          remoteServer: d(7, -7, { s: 5.0, h: 54, color: 'slab', glyph: 'server', label: ['GitHub Host'], sub: 'upstream repo' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Remote Tracking State', [
            `$ git branch -r`,
            `origin/HEAD -> origin/main`,
            `origin/main`,
            `origin/feature-auth`,
            `$ git rev-parse origin/main`,
            `7d9e44a1b2c3d4e5f6...`,
          ], { icon: 'terminal' }),
        },
        links: {
          lr: h('localBranch', 'remoteRef', ['localBranch', 'remoteRef'], { label: 'compare status' }),
          rs: h('remoteRef', 'remoteServer', ['remoteRef', 'remoteServer'], { label: 'git fetch sync' }),
        },
        flows: [{ route: ['rs', 'lr'], kind: 'remote', rate: 1.5 }],
      },
    },
    {
      short: 'Upstream Config',
      chapter: 'execution',
      title: 'Branch Upstream Configuration (.git/config)',
      body: [
        'How does <code>git push</code> know where to send commits? Git maps local branches to remote branches in <code>.git/config</code>.',
        'Setting upstream via <code>git push -u origin main</code> writes a section in <code>.git/config</code> linking <code>branch "main"</code> to <code>remote = origin</code> and <code>merge = refs/heads/main</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Without upstream configured, git pull and git push require explicit remote and branch arguments.',
      },
      changes: ['+ Upstream metadata written to .git/config', '+ git status can now report ahead/behind counts'],
      metrics: { headRef: 'refs/heads/main', branchTarget: 'origin/main', refType: 'Upstream tracked', packedState: 'Configured' },
      scene: {
        entities: {
          configTree: y(-7, 7, { label: 'Config Map', tags: [{ text: '.git/config map', tone: 'amber', icon: 'terminal' }] }),
          localMain: d(0, 0, { s: 5.2, h: 56, color: 'green', glyph: 'gitBranch', label: ['Local main'], sub: 'ahead 1 commit' }),
          upstreamTarget: d(7, -7, { s: 5.0, h: 54, color: 'blue', glyph: 'cloud', label: ['origin/main'], sub: 'tracking ref' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Upstream Config Section', [
            `$ git branch -vv`,
            `* main 7d9e44 [origin/main: ahead 1] feat: auth`,
            `$ cat .git/config`,
            `[branch "main"]`,
            `    remote = origin`,
            `    merge = refs/heads/main`,
          ], { icon: 'terminal' }),
        },
        links: {
          cl: h('configTree', 'localMain', ['configTree', 'localMain'], { label: 'maps upstream' }),
          lu: h('localMain', 'upstreamTarget', ['localMain', 'upstreamTarget'], { label: 'tracks delta' }),
        },
        flows: [{ route: ['cl', 'lu'], kind: 'pointer', rate: 1.5 }],
      },
    },
    {
      short: 'Packed-Refs',
      chapter: 'scaling',
      title: 'Packed-Refs: Consolidating Thousands of Loose Refs',
      body: [
        'Repositories with 50,000 tags or branches suffer massive I/O penalties when traversing thousands of small 41-byte files on disk.',
        '<code>git pack-refs --all</code> packs loose reference files into a single flat file <code>.git/packed-refs</code>, leaving <code>.git/refs/</code> clean. Git checks loose files first, falling back to <code>packed-refs</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Packed-refs improves checkout and git log performance dramatically in huge monorepos with long release histories.',
      },
      changes: ['+ Loose ref files deleted and consolidated into .git/packed-refs', '+ Speeds up git rev-parse and git branch lookup by orders of magnitude'],
      metrics: { headRef: 'refs/heads/main', branchTarget: 'Multiple tags', refType: 'Packed file', packedState: '50k refs packed' },
      scene: {
        entities: {
          looseRefs: d(-7, 7, { s: 5.0, h: 54, color: 'slab', glyph: 'boxes', label: ['Loose Refs'], sub: '50,000 files' }),
          packEngine: d(0, 0, { s: 5.2, h: 56, color: 'purple', glyph: 'cpu', label: ['git pack-refs'], sub: 'table builder' }),
          packedTable: b(7, -7, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['packed-refs'], sub: 'packed table' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Packed-Refs File Format', [
            `$ cat .git/packed-refs`,
            `# pack-refs with: peeled-tags fully-peeled sorted`,
            `3f8a12... refs/heads/main`,
            `7d9e44... refs/tags/v1.0.0`,
            `^a5b8c9... (peeled commit SHA for annotated tag)`,
            `8a3f91... refs/tags/v1.0.1`,
          ], { icon: 'terminal' }),
        },
        links: {
          lp: h('looseRefs', 'packEngine', ['looseRefs', 'packEngine'], { label: 'pack refs' }),
          pp: h('packEngine', 'packedTable', ['packEngine', 'packedTable'], { label: 'single table' }),
        },
        flows: [{ route: ['lp', 'pp'], kind: 'packed', rate: 1.6 }],
      },
    },
    {
      short: 'Atomic Updates',
      chapter: 'scaling',
      title: 'Atomic Ref Updates (git update-ref)',
      body: [
        'How does Git guarantee that two concurrent push or commit operations do not corrupt a reference file?',
        'Git writes the new SHA to a temporary lockfile (e.g. <code>.git/refs/heads/main.lock</code>), verifies the old SHA matches the expected pre-condition, and executes an atomic POSIX <code>rename()</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'git update-ref HEAD <new-sha> <old-sha> provides compare-and-swap (CAS) semantics for Git reference mutations.',
      },
      changes: ['+ Atomic lockfile prevents race conditions', '+ POSIX rename ensures ref file is never half-written'],
      metrics: { headRef: 'refs/heads/main', branchTarget: 'Commit a5b8c9', refType: 'Atomic write', packedState: 'Locked -> Renamed' },
      scene: {
        entities: {
          clientUpdate: y(-7, 7, { label: 'update-ref', tags: [{ text: 'atomic write', tone: 'green', icon: 'terminal' }] }),
          lockMutex: d(0, 0, { s: 5.2, h: 56, color: 'rose', glyph: 'shield', label: ['main.lock'], sub: 'POSIX lockfile' }),
          sealedBranch: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'gitBranch', label: ['refs/heads/main'], sub: 'updated SHA' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Atomic Compare-And-Swap', [
            `$ git update-ref refs/heads/main a5b8c9 7d9e44`,
            `1. Check current ref == 7d9e44 (CAS check)`,
            `2. Write a5b8c9 to refs/heads/main.lock`,
            `3. rename(main.lock, main) # atomic syscall`,
            `= Zero possibility of corrupted half-written pointer`,
          ], { icon: 'terminal' }),
        },
        links: {
          cl: h('clientUpdate', 'lockMutex', ['clientUpdate', 'lockMutex'], { label: 'create lock' }),
          ls: h('lockMutex', 'sealedBranch', ['lockMutex', 'sealedBranch'], { label: 'atomic rename' }),
        },
        flows: [{ route: ['cl', 'ls'], kind: 'pointer', rate: 1.5 }],
      },
    },
  ],
};
