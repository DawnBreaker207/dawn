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

export const gitRefsSymbolicLesson = {
  id: 'git-refs-symbolic',
  title: 'Refs, HEAD Symbolic Pointer & Packed-Refs',
  summary: 'How Git tracks pointers: branches as lightweight 41-byte text files in .git/refs/heads/, HEAD as a symbolic reference, and how git pack-refs accelerates repositories with thousands of tags.',
  minutes: 20,
  level: 'intermediate',
  metrics: ['headRef', 'branchTarget', 'refType', 'packedState'],
  legend: ['pointer', ['sym', 'symbolic pointer'], ['packed', 'packed refs'], ['remote', 'remote tracking ref']],
  goals: [
    { text: 'Branches are 41-byte files in .git/refs/heads/', step: 1 },
    { text: 'HEAD: the symbolic reference tracking your active checkout', step: 2 },
    { text: 'Remote Tracking Refs: local read-only mirrors of remote state', step: 3 },
    { text: 'Upstream Config: connecting local branches to remote remotes', step: 4 },
    { text: 'Packed-refs: speeding up I/O by compressing loose ref files', step: 5 },
    { text: 'Atomic Update: git update-ref guarantees zero corrupted refs', step: 6 },
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
          mainRef: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['Branch Ref'], sub: 'refs/heads/main (41B)' }),
          commit: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Commit 3f8a12'], sub: 'tree, author, message' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Branch File on Filesystem', [
            `$ cat .git/refs/heads/main`,
            `3f8a12c49b56f890e123456789abcdef01234567`,
            `$ ls -la .git/refs/heads/`,
            `-rw-r--r-- 1 dawn staff 41 Nov 24 10:00 main`,
            `= Exactly 41 bytes (40 hex chars + 1 newline)`,
          ], { icon: 'terminal' }),
          zRefs: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'GIT REFS DIRECTORY (.GIT/REFS/HEADS)'),
        },
        links: {
          mc: h('mainRef', 'commit', ['mainRef', 'commit'], { label: 'points to commit' }),
        },
        flows: [{ route: ['mc'], rate: 1.4 }],
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
          head: d(-10, -18, { s: 4.8, h: 50, color: 'yellow', glyph: 'terminal', label: ['HEAD Pointer'], sub: '.git/HEAD' }),
          branch: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['Branch Ref'], sub: 'refs/heads/main' }),
          commit: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Commit 3f8a12'], sub: 'active snapshot' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'HEAD Symbolic Dereference', [
            `$ cat .git/HEAD`,
            `ref: refs/heads/main`,
            `$ git symbolic-ref HEAD`,
            `refs/heads/main`,
            `$ git rev-parse HEAD`,
            `3f8a12c49b56f890e123456789abcdef01234567`,
          ], { icon: 'terminal' }),
          zRefs: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'SYMBOLIC DEREFERENCE PIPELINE'),
        },
        links: {
          hb: h('head', 'branch', ['head', 'branch'], { style: 'dashed', label: 'symbolic ref' }),
          bc: h('branch', 'commit', ['branch', 'commit'], { label: 'direct ref' }),
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
          localBranch: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['Local main'], sub: 'refs/heads/main' }),
          remoteRef: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'cloud', label: ['origin/main'], sub: 'refs/remotes/origin' }),
          remoteServer: d(10, 8, { s: 4.8, h: 50, color: 'slab', glyph: 'server', label: ['GitHub Server'], sub: 'remote master' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Remote Tracking State', [
            `$ git branch -r`,
            `origin/HEAD -> origin/main`,
            `origin/main`,
            `origin/feature-auth`,
            `$ git rev-parse origin/main`,
            `7d9e44a1b2c3d4e5f6...`,
          ], { icon: 'terminal' }),
          zRefs: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'REMOTE TRACKING ARCHITECTURE'),
        },
        links: {
          lr: h('localBranch', 'remoteRef', ['localBranch', 'remoteRef'], { label: 'compare diverged' }),
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
          config: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['.git/config'], sub: 'upstream metadata' }),
          localMain: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['Local main'], sub: 'ahead by 1 commit' }),
          upstreamTarget: d(10, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'cloud', label: ['origin/main'], sub: 'remote tracking ref' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Upstream Config Section', [
            `$ git branch -vv`,
            `* main 7d9e44 [origin/main: ahead 1] feat: auth`,
            `$ cat .git/config`,
            `[branch "main"]`,
            `    remote = origin`,
            `    merge = refs/heads/main`,
          ], { icon: 'terminal' }),
          zRefs: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'BRANCH TRACKING CONFIGURATION'),
        },
        links: {
          cl: h('config', 'localMain', ['config', 'localMain'], { label: 'defines upstream' }),
          lu: h('localMain', 'upstreamTarget', ['localMain', 'upstreamTarget'], { label: 'tracks ahead/behind' }),
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
          looseRefs: d(-10, -18, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['Loose Refs'], sub: '50,000 individual files' }),
          packEngine: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['git pack-refs'], sub: 'atomic table builder' }),
          packedFile: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['packed-refs'], sub: '.git/packed-refs' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Packed-Refs File Format', [
            `$ cat .git/packed-refs`,
            `# pack-refs with: peeled-tags fully-peeled sorted`,
            `3f8a12... refs/heads/main`,
            `7d9e44... refs/tags/v1.0.0`,
            `^a5b8c9... (peeled commit SHA for annotated tag)`,
            `8a3f91... refs/tags/v1.0.1`,
          ], { icon: 'terminal' }),
          zRefs: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'PACKED REFERENCES STORAGE TABLE'),
        },
        links: {
          lp: h('looseRefs', 'packEngine', ['looseRefs', 'packEngine'], { label: 'pack refs' }),
          pp: h('packEngine', 'packedFile', ['packEngine', 'packedFile'], { label: 'single sorted file' }),
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
          client: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['git update-ref'], sub: 'compare-and-swap' }),
          lockFile: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'boxes', label: ['main.lock'], sub: 'atomic POSIX lock' }),
          sealedRef: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['refs/heads/main'], sub: 'updated SHA' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Atomic Compare-And-Swap', [
            `$ git update-ref refs/heads/main a5b8c9 7d9e44`,
            `1. Check current ref == 7d9e44 (CAS check)`,
            `2. Write a5b8c9 to refs/heads/main.lock`,
            `3. rename(main.lock, main) # atomic syscall`,
            `= Zero possibility of corrupted half-written pointer`,
          ], { icon: 'terminal' }),
          zRefs: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ATOMIC REFERENCE MUTATION ENGINE'),
        },
        links: {
          cl: h('client', 'lockFile', ['client', 'lockFile'], { label: 'create lockfile' }),
          ls: h('lockFile', 'sealedRef', ['lockFile', 'sealedRef'], { label: 'atomic rename' }),
        },
        flows: [{ route: ['cl', 'ls'], kind: 'pointer', rate: 1.5 }],
      },
    },
  ],
};
