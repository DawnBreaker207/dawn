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
          mainBranch: d(0, 2, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Branch main'], sub: '41-byte ref' }),
          commitObj: d(12, 8, { s: 4.4, h: 56, color: 'purple', glyph: 'package', label: ['Commit 3f8a12'], sub: 'commit 3f8a12' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Branch File on Filesystem', [
            `$ cat .git/refs/heads/main`,
            `3f8a12c49b56f890e123456789abcdef01234567`,
            `$ ls -la .git/refs/heads/`,
            `-rw-r--r-- 1 dawn staff 41 Nov 24 10:00 main`,
            `= Exactly 41 bytes (40 hex chars + 1 newline)`,
          ], { icon: 'terminal' }),
        },
        links: {
          mc: h('mainBranch', 'commitObj', ['mainBranch', 'commitObj'], { label: 'points to commit' }),
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
          headRef: d(-10, -4, { s: 4.4, h: 56, color: 'cyan', glyph: 'terminal', label: ['.git/HEAD'], sub: 'symbolic ref' }),
          mainBranch: d(0, 2, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Branch main'], sub: '41-byte ref' }),
          commitObj: d(12, 8, { s: 4.4, h: 56, color: 'purple', glyph: 'package', label: ['Commit 3f8a12'], sub: 'commit 3f8a12' }),
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
          hm: h('headRef', 'mainBranch', ['headRef', 'mainBranch'], { style: 'dashed', label: 'symbolic ref' }),
          mc: h('mainBranch', 'commitObj', ['mainBranch', 'commitObj'], { label: 'direct ref' }),
        },
        flows: [{ route: ['hm', 'mc'], kind: 'sym', rate: 1.5 }],
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
          headRef: d(-10, -4, { s: 4.4, h: 56, color: 'cyan', glyph: 'terminal', label: ['.git/HEAD'], sub: 'symbolic ref' }),
          mainBranch: d(0, 2, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Branch main'], sub: 'local branch' }),
          commitObj: d(12, 8, { s: 4.4, h: 56, color: 'purple', glyph: 'package', label: ['Commit 3f8a12'], sub: 'commit 3f8a12' }),
          remoteRef: d(-4, 16, { s: 4.4, h: 54, color: 'blue', glyph: 'cloud', label: ['origin/main'], sub: 'remote ref' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Remote Tracking State', [
            `$ git branch -r`,
            `origin/HEAD -> origin/main`,
            `origin/main`,
            `$ git rev-parse origin/main`,
            `3f8a12c49b56f890e123456789abcdef01234567`,
            `= Tracks upstream commit bookmark locally`,
          ], { icon: 'terminal' }),
        },
        links: {
          hm: h('headRef', 'mainBranch', ['headRef', 'mainBranch'], { style: 'dashed', label: 'symbolic ref' }),
          mc: h('mainBranch', 'commitObj', ['mainBranch', 'commitObj'], { label: 'direct ref' }),
          mr: h('mainBranch', 'remoteRef', ['mainBranch', 'remoteRef'], { label: 'git fetch sync' }),
        },
        flows: [{ route: ['mr'], kind: 'remote', rate: 1.5 }],
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
          devLaptop: y(-22, -8, { label: 'Dev Laptop', tags: [{ text: 'git status', tone: 'cyan', icon: 'terminal' }] }),
          headRef: d(-10, -4, { s: 4.4, h: 56, color: 'cyan', glyph: 'terminal', label: ['.git/HEAD'], sub: 'symbolic ref' }),
          mainBranch: d(0, 2, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Branch main'], sub: 'ahead 1 commit' }),
          commitObj: d(12, 8, { s: 4.4, h: 56, color: 'purple', glyph: 'package', label: ['Commit 3f8a12'], sub: 'commit 3f8a12' }),
          remoteRef: d(-4, 16, { s: 4.4, h: 54, color: 'blue', glyph: 'cloud', label: ['origin/main'], sub: 'remote ref' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Upstream Config Section', [
            `$ git branch -vv`,
            `* main 3f8a12 [origin/main: ahead 1] feat: auth`,
            `$ cat .git/config`,
            `[branch "main"]`,
            `    remote = origin`,
            `    merge = refs/heads/main`,
          ], { icon: 'terminal' }),
        },
        links: {
          dh: h('devLaptop', 'headRef', ['devLaptop', 'headRef'], { label: 'reads ref' }),
          hm: h('headRef', 'mainBranch', ['headRef', 'mainBranch'], { style: 'dashed', label: 'symbolic ref' }),
          mr: h('mainBranch', 'remoteRef', ['mainBranch', 'remoteRef'], { label: 'upstream pair' }),
        },
        flows: [{ route: ['dh', 'hm', 'mr'], kind: 'pointer', rate: 1.5 }],
      },
    },
    {
      short: 'Packed-Refs',
      chapter: 'scaling',
      title: 'Packed-Refs: Consolidating 50,000 Loose References',
      body: [
        'In repositories with thousands of tags and branches, storing each ref as a 41-byte loose file on disk wastes inodes and slows down filesystem directory scans.',
        'Git solves this by running <code>git pack-refs --all</code>, consolidating all loose reference files into a single flat lookup table: <code>.git/packed-refs</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'When dereferencing a ref, Git checks .git/refs/heads/ first (loose ref). If not found, it falls back to binary searching .git/packed-refs.',
      },
      changes: ['+ 50,000 loose ref files consolidated into single .git/packed-refs', '+ Inodes recovered and ref lookup accelerated to O(log N)'],
      metrics: { headRef: 'refs/heads/main', branchTarget: 'Packed index', refType: 'Packed ref table', packedState: '50k refs packed' },
      scene: {
        entities: {
          devLaptop: y(-22, -8, { label: 'Dev Laptop', tags: [{ text: 'git gc / pack', tone: 'amber', icon: 'terminal' }] }),
          headRef: d(-10, -4, { s: 4.4, h: 56, color: 'cyan', glyph: 'terminal', label: ['.git/HEAD'], sub: 'symbolic ref' }),
          mainBranch: d(0, 2, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Branch main'], sub: 'loose cached' }),
          commitObj: d(12, 8, { s: 4.4, h: 56, color: 'purple', glyph: 'package', label: ['Commit 3f8a12'], sub: 'commit 3f8a12' }),
          remoteRef: d(-4, 16, { s: 4.4, h: 54, color: 'blue', glyph: 'cloud', label: ['origin/main'], sub: 'remote ref' }),
          packedRefs: b(14, 20, { r: 2.2, h: 52, color: 'amber', glyph: 'database', label: ['.git/packed-refs'], sub: '50k refs tbl' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Packed-Refs Table Format', [
            `# pack-refs with: peeled-tags`,
            `3f8a12c49b56f890e123456789abcdef01234567 refs/heads/main`,
            `7d9e44a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7 refs/remotes/origin/main`,
            `c4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9 refs/tags/v1.0.0`,
            `= Single flat file replaces 50k filesystem inodes`,
          ], { icon: 'terminal' }),
        },
        links: {
          hm: h('headRef', 'mainBranch', ['headRef', 'mainBranch'], { style: 'dashed', label: 'symbolic ref' }),
          mc: h('mainBranch', 'commitObj', ['mainBranch', 'commitObj'], { label: 'loose target' }),
          cp: h('commitObj', 'packedRefs', ['commitObj', 'packedRefs'], { label: 'record in table' }),
          rp: h('remoteRef', 'packedRefs', ['remoteRef', 'packedRefs'], { label: 'pack remote' }),
        },
        flows: [{ route: ['hm', 'mc', 'cp'], kind: 'packed', rate: 1.5 }, { route: ['rp'], kind: 'packed', rate: 1.5 }],
      },
    },
    {
      short: 'Atomic Lock',
      chapter: 'scaling',
      title: 'Atomic Ref Updates with Lockfiles (.git/refs/*.lock)',
      body: [
        'What prevents two concurrent Git commands from corrupting a branch pointer? Git writes to a temporary mutex file: <code>.git/refs/heads/main.lock</code>.',
        'Once the new commit SHA is fully written and flushed to disk, Git executes an atomic POSIX <code>rename("main.lock", "main")</code>. Readers never see a half-written ref.',
      ],
      callout: {
        kind: 'tip',
        text: 'Atomic filesystem renames guarantee that branch reference updates are crash-consistent and thread-safe.',
      },
      changes: ['+ Atomic lockfile main.lock created during ref update', '+ POSIX rename() replaces ref instantaneously with zero race condition'],
      metrics: { headRef: 'refs/heads/main', branchTarget: 'Atomic update', refType: 'POSIX rename()', packedState: 'Consistent' },
      scene: {
        entities: {
          headRef: d(-10, -4, { s: 4.4, h: 56, color: 'cyan', glyph: 'terminal', label: ['.git/HEAD'], sub: 'symbolic ref' }),
          mainBranch: d(0, 2, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Branch main'], sub: 'atomic mutex' }),
          commitObj: d(12, 8, { s: 4.4, h: 56, color: 'purple', glyph: 'package', label: ['Commit 3f8a12'], sub: 'commit 3f8a12' }),
          remoteRef: d(-4, 16, { s: 4.4, h: 54, color: 'blue', glyph: 'cloud', label: ['origin/main'], sub: 'remote ref' }),
          packedRefs: b(14, 20, { r: 2.2, h: 52, color: 'amber', glyph: 'database', label: ['.git/packed-refs'], sub: '50k refs tbl' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Atomic Ref Transaction Flow', [
            `1. open(".git/refs/heads/main.lock", O_CREAT|O_EXCL)`,
            `2. write(fd, "3f8a12c4...", 41)`,
            `3. fsync(fd)`,
            `4. close(fd)`,
            `5. rename(".git/refs/heads/main.lock", ".git/refs/heads/main")`,
            `= Guaranteed atomic, crash-proof update`,
          ], { icon: 'terminal' }),
        },
        links: {
          hm: h('headRef', 'mainBranch', ['headRef', 'mainBranch'], { style: 'dashed', label: 'symbolic ref' }),
          mc: h('mainBranch', 'commitObj', ['mainBranch', 'commitObj'], { label: 'atomic pointer' }),
        },
        flows: [{ route: ['hm', 'mc'], kind: 'pointer', rate: 1.6 }],
      },
    },
  ],
};
