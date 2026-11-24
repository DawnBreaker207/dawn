// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitCommandsTaxonomyLesson = {
  id: 'git-commands-taxonomy',
  title: 'Git Commands: Porcelain vs Plumbing Engine',
  summary: 'Deconstruct Git command taxonomy into high-level Porcelain (porcelain-level UI) and low-level Plumbing primitives (hash-object, cat-file, write-tree, commit-tree, update-ref).',
  minutes: 25,
  level: 'intermediate',
  metrics: ['commandLayer', 'objectState', 'refState', 'pipelineSpeed'],
  legend: ['flow', ['cli', 'porcelain command'], ['raw', 'plumbing execution'], ['io', 'raw byte I/O']],
  goals: [
    { text: 'Porcelain vs Plumbing architectural boundary', step: 1 },
    { text: 'Plumbing: git hash-object & zlib blob generation', step: 2 },
    { text: 'Plumbing: git cat-file reading raw object headers', step: 3 },
    { text: 'Plumbing: git write-tree serializing the index', step: 4 },
    { text: 'Plumbing: git commit-tree sealing the parent hash', step: 5 },
    { text: 'Atomic ref updates with git update-ref', step: 6 },
  ],
  steps: [
    {
      short: 'Porcelain vs Plumbing',
      chapter: 'setup',
      title: 'The Two Layers: Porcelain vs Plumbing Architecture',
      body: [
        'Git is architected as an object storage content-addressable filesystem with a VCS layer on top.',
        '<b>Porcelain commands</b> (<code>git add</code>, <code>commit</code>, <code>checkout</code>, <code>status</code>) are user-friendly interfaces designed for humans. Underneath, they call a pipeline of low-level UNIX-style <b>Plumbing commands</b>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Every porcelain command is just a shell script or C binary wrapping a sequence of plumbing primitives.',
      },
      metrics: { commandLayer: 'Porcelain UI', objectState: 'Abstracted', refState: 'Managed', pipelineSpeed: 'Standard' },
      scene: {
        entities: {
          userCli: y(-7, 7, { label: 'Developer', tags: [{ text: 'git commit', tone: 'blue', icon: 'terminal' }] }),
          porcelainLayer: d(0, 0, { s: 5.2, h: 56, color: 'green', glyph: 'boxes', label: ['Porcelain CLI'], sub: 'UI wrapper' }),
          plumbingEngine: b(7, -7, { s: 4.8, h: 50, color: 'yellow', glyph: 'cpu', label: ['Plumbing Engine'], sub: 'C primitives' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Command Taxonomy Breakdown', [
            `PORCELAIN: git add, commit, checkout, branch`,
            `PLUMBING:   git hash-object, cat-file, write-tree`,
            `            git commit-tree, update-ref, rev-parse`,
            `= Porcelain automates multi-step plumbing chains`,
          ], { icon: 'terminal' }),
        },
        links: {
          up: h('userCli', 'porcelainLayer', ['userCli', 'porcelainLayer'], { label: 'invoke cli' }),
          pp: h('porcelainLayer', 'plumbingEngine', ['porcelainLayer', 'plumbingEngine'], { label: 'call engine' }),
        },
        flows: [{ route: ['up', 'pp'], kind: 'cli', rate: 1.5 }],
      },
    },
    {
      short: 'hash-object',
      chapter: 'execution',
      title: 'Plumbing: git hash-object (Writing Raw Blobs)',
      body: [
        'How does <code>git add</code> write data? It invokes <code>git hash-object -w <file></code>.',
        'This takes raw bytes from standard input, calculates the SHA-1 hash over the formatted header <code>blob <size>\\0<content></code>, and writes the zlib-compressed object to <code>.git/objects/xx/yyyy...</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'You can create Git commits completely by hand using only echo and plumbing commands without touching porcelain commands.',
      },
      changes: ['+ git hash-object -w executed', '+ Written 4b825d... to .git/objects', '+ Returned raw SHA-1 to stdout'],
      metrics: { commandLayer: 'Plumbing (hash-object)', objectState: 'Blob Written', refState: 'Unchanged', pipelineSpeed: 'Sub-millisecond' },
      scene: {
        entities: {
          stdinStream: y(-7, 7, { label: 'Standard In', tags: [{ text: 'echo "hello"', icon: 'terminal' }] }),
          hashObjectCmd: d(0, 0, { s: 5.2, h: 56, color: 'yellow', glyph: 'cpu', label: ['git hash-object'], sub: '-w --stdin' }),
          objectStore: b(7, -7, { s: 4.8, h: 50, color: 'purple', glyph: 'database', label: ['.git/objects'], sub: '3b18e5 blob' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Raw Blob Creation', [
            `$ echo "hello world" | git hash-object -w --stdin`,
            `3b18e512dba79e4c8300dd08aeb37f8e728b8dad`,
            `File created: .git/objects/3b/18e512...`,
            `Header: blob 12\\0hello world\\n`,
            `= Content stored immutably without filename`,
          ], { icon: 'terminal' }),
        },
        links: {
          sh: h('stdinStream', 'hashObjectCmd', ['stdinStream', 'hashObjectCmd'], { label: 'pipe bytes' }),
          ho: h('hashObjectCmd', 'objectStore', ['hashObjectCmd', 'objectStore'], { label: 'write zlib' }),
        },
        flows: [{ route: ['sh', 'ho'], kind: 'raw', rate: 1.8 }],
      },
    },
    {
      short: 'cat-file',
      chapter: 'execution',
      title: 'Plumbing: git cat-file (Inspecting Raw Objects)',
      body: [
        'The inverse of hash-object is <code>git cat-file</code>. It reads an object hash from <code>.git/objects/</code>, decompresses it with zlib, and extracts its type (<code>-t</code>), size (<code>-s</code>), or pretty-printed content (<code>-p</code>).',
      ],
      callout: {
        kind: 'insight',
        text: 'git cat-file -p is the Swiss Army knife for inspecting any Git object: blobs, trees, commits, or tags.',
      },
      changes: ['+ Decompressed object with zlib', '+ Extracted object type: blob', '+ Printed content directly to terminal'],
      metrics: { commandLayer: 'Plumbing (cat-file)', objectState: 'Inspected', refState: 'Unchanged', pipelineSpeed: 'Instant' },
      scene: {
        entities: {
          terminalReader: y(-7, 7, { label: 'Stdout Read', tags: [{ text: 'cat-file -p', icon: 'terminal' }] }),
          catFileEngine: d(0, 0, { s: 5.2, h: 56, color: 'blue', glyph: 'boxes', label: ['git cat-file'], sub: 'zlib inflate' }),
          objectStore: b(7, -7, { s: 4.8, h: 50, color: 'purple', glyph: 'database', label: ['.git/objects'], sub: '3b18e5 blob' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'cat-file Inspection', [
            `$ git cat-file -t 3b18e5`,
            `blob`,
            `$ git cat-file -s 3b18e5`,
            `12`,
            `$ git cat-file -p 3b18e5`,
            `hello world`,
          ], { icon: 'terminal' }),
        },
        links: {
          co: h('catFileEngine', 'objectStore', ['catFileEngine', 'objectStore'], { label: 'read bytes' }),
          ct: h('catFileEngine', 'terminalReader', ['catFileEngine', 'terminalReader'], { label: 'print text' }),
        },
        flows: [{ route: ['co', 'ct'], kind: 'raw', rate: 1.6 }],
      },
    },
    {
      short: 'write-tree',
      chapter: 'execution',
      title: 'Plumbing: git write-tree (Serializing the Index)',
      body: [
        'Before committing, Git needs to know how directory filenames map to blob hashes. <code>git update-index</code> records entries in <code>.git/index</code>.',
        'Then <code>git write-tree</code> reads the index, builds directory hierarchies, and writes a Tree object to <code>.git/objects/</code>, returning the root tree SHA.',
      ],
      callout: {
        kind: 'tip',
        text: 'A tree object is simply a list of rows: file mode, object type, SHA hash, and filename.',
      },
      changes: ['+ Serialized .git/index into root Tree object', '+ Recorded file modes (100644)', '+ Generated root Tree SHA d8329f'],
      metrics: { commandLayer: 'Plumbing (write-tree)', objectState: 'Tree Serialized', refState: 'Pending Commit', pipelineSpeed: 'Fast' },
      scene: {
        entities: {
          stagingIndex: b(-7, -7, { s: 4.8, h: 50, color: 'blue', glyph: 'boxes', label: ['.git/index'], sub: 'staged cache' }),
          writeTreeCmd: d(0, 0, { s: 5.2, h: 56, color: 'yellow', glyph: 'cpu', label: ['git write-tree'], sub: 'tree compiler' }),
          treeObject: b(7, -7, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Tree d8329f'], sub: 'dir snapshot' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Tree Object Structure', [
            `$ git write-tree`,
            `d8329fc1cc938780ffdd9f94e0d364e0ea74f579`,
            `$ git cat-file -p d8329f`,
            `100644 blob 3b18e512db...    README.md`,
            `100755 blob 4a9f8e4b8a...    build.sh`,
            `040000 tree 8a3f91b2c4...    src`,
          ], { icon: 'terminal' }),
        },
        links: {
          sw: h('stagingIndex', 'writeTreeCmd', ['stagingIndex', 'writeTreeCmd'], { label: 'read index' }),
          wt: h('writeTreeCmd', 'treeObject', ['writeTreeCmd', 'treeObject'], { label: 'write tree' }),
        },
        flows: [{ route: ['sw', 'wt'], kind: 'raw', rate: 1.5 }],
      },
    },
    {
      short: 'commit-tree',
      chapter: 'execution',
      title: 'Plumbing: git commit-tree (Sealing the Commit)',
      body: [
        'A Tree represents a snapshot, but it lacks history. <code>git commit-tree <tree-sha> -m "msg" -p <parent-sha></code> creates the Commit object.',
        'It links the root tree, stamps author and committer metadata (name, email, epoch timestamp), links parent commit hashes, and signs the commit if GPG is configured.',
      ],
      callout: {
        kind: 'insight',
        text: 'A merge commit is simply a commit-tree command passed multiple -p flags (e.g. -p <parent1> -p <parent2>).',
      },
      changes: ['+ Created commit object pointing to tree d8329f', '+ Linked parent commit hash a1b2c3', '+ Output new commit hash 7f8a9b'],
      metrics: { commandLayer: 'Plumbing (commit-tree)', objectState: 'Commit Sealed', refState: 'Ref not updated yet', pipelineSpeed: 'Instant' },
      scene: {
        entities: {
          treeHash: b(-7, -7, { s: 4.8, h: 50, color: 'blue', glyph: 'package', label: ['Tree d8329f'], sub: 'root snapshot' }),
          commitTreeCmd: d(0, 0, { s: 5.2, h: 56, color: 'green', glyph: 'cpu', label: ['git commit-tree'], sub: 'commit author' }),
          commitObj: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'gitBranch', label: ['Commit 7f8a9b'], sub: 'new snapshot' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'commit-tree Execution', [
            `$ echo "feat: add core" | git commit-tree d8329f -p a1b2c3`,
            `7f8a9b2c4e1a0d8e9f8a7b6c5d4e3f2a1b0c9d8e`,
            `$ git cat-file -p 7f8a9b`,
            `tree d8329fc1cc9387...`,
            `parent a1b2c3d4e5...`,
            `author Dev <dev@org.com> 1700000000 +0000`,
            `feat: add core`,
          ], { icon: 'terminal' }),
        },
        links: {
          tc: h('treeHash', 'commitTreeCmd', ['treeHash', 'commitTreeCmd'], { label: 'bind tree' }),
          co: h('commitTreeCmd', 'commitObj', ['commitTreeCmd', 'commitObj'], { label: 'write commit' }),
        },
        flows: [{ route: ['tc', 'co'], kind: 'raw', rate: 1.6 }],
      },
    },
    {
      short: 'update-ref',
      chapter: 'solution',
      title: 'Plumbing: git update-ref (Atomic Ref Pointer Updates)',
      body: [
        'Creating the commit object does NOT move the branch! The branch is still pointing to the old commit.',
        'The final step of <code>git commit</code> is calling <code>git update-ref refs/heads/main <new-commit-sha></code>. This atomically writes the 40-char SHA to <code>.git/refs/heads/main</code> with lockfile concurrency protection.',
      ],
      callout: {
        kind: 'tip',
        text: 'A Git branch is literally just a 41-byte text file containing a 40-character hex hash followed by a newline.',
      },
      changes: ['+ Lockfile .git/refs/heads/main.lock created', '+ Written new SHA 7f8a9b into ref file', '+ HEAD now resolves to new commit'],
      metrics: { commandLayer: 'Plumbing (update-ref)', objectState: 'Complete Snapshot', refState: 'main -> 7f8a9b', pipelineSpeed: 'Atomic' },
      scene: {
        entities: {
          commitSha: d(-7, -7, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Commit 7f8a9b'], sub: 'new SHA-1' }),
          updateRefCmd: d(0, 0, { s: 5.2, h: 56, color: 'blue', glyph: 'shield', label: ['git update-ref'], sub: 'atomic update' }),
          branchRefFile: b(7, -7, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['refs/heads/main'], sub: 'ref pointer' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Atomic Ref Update', [
            `$ git update-ref refs/heads/main 7f8a9b a1b2c3`,
            `1. Acquire lock: .git/refs/heads/main.lock`,
            `2. Verify old value equals a1b2c3 (prevent race)`,
            `3. Write 7f8a9b into lockfile`,
            `4. Atomic rename(lockfile, target)`,
            `= Branch updated cleanly with zero corruption`,
          ], { icon: 'terminal' }),
        },
        links: {
          cu: h('commitSha', 'updateRefCmd', ['commitSha', 'updateRefCmd'], { label: 'feed sha' }),
          ub: h('updateRefCmd', 'branchRefFile', ['updateRefCmd', 'branchRefFile'], { label: 'atomic write' }),
        },
        flows: [{ route: ['cu', 'ub'], kind: 'raw', rate: 1.8 }],
      },
    },
  ],
};
