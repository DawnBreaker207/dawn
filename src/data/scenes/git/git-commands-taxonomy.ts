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
    { text: 'The Untracked Seed: Raw files in Working Directory', step: 1 },
    { text: 'Plumbing: git hash-object & zlib blob generation', step: 2 },
    { text: 'Plumbing: git cat-file reading raw object headers', step: 3 },
    { text: 'Plumbing: git write-tree serializing the index', step: 4 },
    { text: 'Plumbing: git commit-tree sealing the parent hash', step: 5 },
    { text: 'Atomic ref updates with git update-ref', step: 6 },
  ],
  steps: [
    {
      short: 'Untracked Seed',
      chapter: 'setup',
      title: 'The Starting State: Working Directory (Untracked File)',
      body: [
        'Before any Git command runs, you have code on your local disk.',
        'At this starting stage, the file <code>src/app.ts</code> exists only in your <b>Working Directory</b>. The <code>.git/</code> directory is clean, and Git tracking has not yet begun.',
      ],
      callout: {
        kind: 'insight',
        text: 'Every porcelain command is just a shell script or C binary wrapping a sequence of plumbing primitives.',
      },
      metrics: { commandLayer: 'Working Tree', objectState: 'Untracked', refState: 'None', pipelineSpeed: 'Idle' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Developer', tags: [{ text: 'touch app.ts', tone: 'blue', icon: 'terminal' }] }),
          workingFile: d(-4, -22, { s: 4.4, h: 50, color: 'amber', glyph: 'terminal', label: ['src/app.ts'], sub: 'raw disk file' }),
          card: S({ x: -12, y: -2, dx: -20, dy: -180 }, 'Working Tree Status', [
            `$ git status -s`,
            `?? src/app.ts (Untracked file)`,
            `$ echo "export const app = 1" > src/app.ts`,
            `File size: 32 bytes on filesystem`,
            `= .git/objects/ database is currently empty`,
          ], { icon: 'terminal' }),
        },
        links: {
          dw: h('devWorkspace', 'workingFile', ['devWorkspace', 'workingFile'], { label: 'edit file' }),
        },
        flows: [{ route: ['dw'], kind: 'cli', rate: 1.2 }],
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
      changes: ['+ git hash-object -w executed', '+ Written 3b18e5 to .git/objects', '+ Raw disk file converted to immutable Blob'],
      metrics: { commandLayer: 'Plumbing (hash-object)', objectState: 'Blob Written', refState: 'Unchanged', pipelineSpeed: 'Sub-millisecond' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Developer', tags: [{ text: 'hash-object', tone: 'blue', icon: 'terminal' }] }),
          workingFile: d(-6, -2, { s: 4.4, h: 50, color: 'amber', glyph: 'terminal', label: ['src/app.ts'], sub: 'raw disk file' }),
          plumbingEngine: d(6, 0, { s: 4.4, h: 56, color: 'yellow', glyph: 'cpu', label: ['git hash-object'], sub: '-w --stdin' }),
          blobStore: b(18, 4, { s: 4.4, h: 50, color: 'purple', glyph: 'database', label: ['.git/objects'], sub: '3b18e5 blob' }),
          card: S({ x: -12, y: -2, dx: -20, dy: -180 }, 'Raw Blob Creation', [
            `$ git hash-object -w src/app.ts`,
            `3b18e512dba79e4c8300dd08aeb37f8e728b8dad`,
            `File created: .git/objects/3b/18e5...`,
            `Header: blob 32\\0export const app = 1`,
            `= Content stored immutably without filename`,
          ], { icon: 'terminal' }),
        },
        links: {
          wp: h('workingFile', 'plumbingEngine', ['workingFile', 'plumbingEngine'], { label: 'pipe bytes' }),
          pb: h('plumbingEngine', 'blobStore', ['plumbingEngine', 'blobStore'], { label: 'write zlib' }),
        },
        flows: [{ route: ['wp', 'pb'], kind: 'raw', rate: 1.8 }],
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
      changes: ['+ Decompressed object with zlib', '+ Extracted object type: blob (12 bytes)', '+ Printed content directly to terminal'],
      metrics: { commandLayer: 'Plumbing (cat-file)', objectState: 'Blob Verified', refState: 'Unchanged', pipelineSpeed: 'Instant' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Developer', tags: [{ text: 'cat-file -p', tone: 'blue', icon: 'terminal' }] }),
          workingFile: d(-6, -2, { s: 4.4, h: 50, color: 'amber', glyph: 'terminal', label: ['src/app.ts'], sub: 'raw disk file' }),
          plumbingEngine: d(6, 0, { s: 4.4, h: 56, color: 'blue', glyph: 'boxes', label: ['git cat-file'], sub: 'zlib inflate' }),
          blobStore: b(18, 4, { s: 4.4, h: 50, color: 'purple', glyph: 'database', label: ['.git/objects'], sub: '3b18e5 blob' }),
          card: S({ x: -12, y: -2, dx: -20, dy: -180 }, 'cat-file Inspection', [
            `$ git cat-file -t 3b18e5`,
            `blob`,
            `$ git cat-file -s 3b18e5`,
            `32`,
            `$ git cat-file -p 3b18e5`,
            `export const app = 1`,
          ], { icon: 'terminal' }),
        },
        links: {
          bp: h('blobStore', 'plumbingEngine', ['blobStore', 'plumbingEngine'], { label: 'read bytes' }),
          pw: h('plumbingEngine', 'workingFile', ['plumbingEngine', 'workingFile'], { label: 'print stdout' }),
        },
        flows: [{ route: ['bp', 'pw'], kind: 'raw', rate: 1.6 }],
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
      changes: ['+ .git/index staging cache populated', '+ Serialized index into root Tree object d8329f', '+ Recorded file modes (100644)'],
      metrics: { commandLayer: 'Plumbing (write-tree)', objectState: 'Tree Serialized', refState: 'Pending Commit', pipelineSpeed: 'Fast' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Developer', tags: [{ text: 'write-tree', tone: 'blue', icon: 'terminal' }] }),
          stagingIndex: b(-6, -2, { s: 4.4, h: 50, color: 'blue', glyph: 'boxes', label: ['.git/index'], sub: 'staged paths' }),
          plumbingEngine: d(6, 0, { s: 4.4, h: 56, color: 'yellow', glyph: 'cpu', label: ['git write-tree'], sub: 'tree compiler' }),
          treeObject: d(18, 4, { s: 4.4, h: 54, color: 'purple', glyph: 'package', label: ['Tree d8329f'], sub: 'dir snapshot' }),
          card: S({ x: -12, y: -2, dx: -20, dy: -180 }, 'Tree Object Structure', [
            `$ git write-tree`,
            `d8329fc1cc938780ffdd9f94e0d364e0ea74f579`,
            `$ git cat-file -p d8329f`,
            `100644 blob 3b18e512db...    src/app.ts`,
            `040000 tree 8a3f91b2c4...    src`,
            `= Index compiled into immutable Tree manifest`,
          ], { icon: 'terminal' }),
        },
        links: {
          sp: h('stagingIndex', 'plumbingEngine', ['stagingIndex', 'plumbingEngine'], { label: 'read index' }),
          pt: h('plumbingEngine', 'treeObject', ['plumbingEngine', 'treeObject'], { label: 'write tree' }),
        },
        flows: [{ route: ['sp', 'pt'], kind: 'raw', rate: 1.5 }],
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
      changes: ['+ Created commit object 7f8a9b pointing to tree d8329f', '+ Linked parent commit hash a1b2c3', '+ Sealed author timestamp and signature'],
      metrics: { commandLayer: 'Plumbing (commit-tree)', objectState: 'Commit Sealed', refState: 'Ref pending', pipelineSpeed: 'Instant' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Author Meta', tags: [{ text: 'Dev <dev@org>', tone: 'blue', icon: 'terminal' }] }),
          treeHash: d(-6, -2, { s: 4.4, h: 54, color: 'purple', glyph: 'package', label: ['Tree d8329f'], sub: 'root snapshot' }),
          plumbingEngine: d(6, 0, { s: 4.4, h: 56, color: 'green', glyph: 'cpu', label: ['git commit-tree'], sub: 'commit author' }),
          commitObj: d(18, 4, { s: 4.4, h: 54, color: 'green', glyph: 'gitBranch', label: ['Commit 7f8a9b'], sub: 'new snapshot' }),
          card: S({ x: -12, y: -2, dx: -20, dy: -180 }, 'commit-tree Execution', [
            `$ echo "feat: add app" | git commit-tree d8329f -p a1b2c3`,
            `7f8a9b2c4e1a0d8e9f8a7b6c5d4e3f2a1b0c9d8e`,
            `$ git cat-file -p 7f8a9b`,
            `tree d8329fc1cc9387...`,
            `parent a1b2c3d4e5...`,
            `author Dev <dev@org.com> 1700000000 +0000`,
            `feat: add app`,
          ], { icon: 'terminal' }),
        },
        links: {
          tp: h('treeHash', 'plumbingEngine', ['treeHash', 'plumbingEngine'], { label: 'bind tree' }),
          pc: h('plumbingEngine', 'commitObj', ['plumbingEngine', 'commitObj'], { label: 'write commit' }),
        },
        flows: [{ route: ['tp', 'pc'], kind: 'raw', rate: 1.6 }],
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
          commitSha: d(-6, -2, { s: 4.4, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Commit 7f8a9b'], sub: 'new SHA-1' }),
          lockMutex: d(-2, 16, { s: 4.4, h: 50, color: 'rose', glyph: 'shield', label: ['main.lock'], sub: 'mutex lock' }),
          plumbingEngine: d(6, 0, { s: 4.4, h: 56, color: 'blue', glyph: 'shield', label: ['git update-ref'], sub: 'atomic update' }),
          branchRefFile: d(18, 4, { s: 4.4, h: 54, color: 'green', glyph: 'gitBranch', label: ['refs/heads/main'], sub: 'ref pointer' }),
          card: S({ x: -12, y: -2, dx: -20, dy: -180 }, 'Atomic Ref Update', [
            `$ git update-ref refs/heads/main 7f8a9b a1b2c3`,
            `1. Acquire lock: .git/refs/heads/main.lock`,
            `2. Verify old value equals a1b2c3 (prevent race)`,
            `3. Write 7f8a9b into lockfile`,
            `4. Atomic rename(lockfile, target)`,
            `= Branch updated cleanly with zero corruption`,
          ], { icon: 'terminal' }),
        },
        links: {
          cp: h('commitSha', 'plumbingEngine', ['commitSha', 'plumbingEngine'], { label: 'feed sha' }),
          lp: h('plumbingEngine', 'lockMutex', ['plumbingEngine', 'lockMutex'], { label: 'acquire lock' }),
          pb: h('plumbingEngine', 'branchRefFile', ['plumbingEngine', 'branchRefFile'], { label: 'atomic write' }),
        },
        flows: [{ route: ['cp', 'pb'], kind: 'raw', rate: 1.8 }],
      },
    },
  ],
};
