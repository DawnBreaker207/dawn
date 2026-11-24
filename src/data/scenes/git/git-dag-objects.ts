// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitDagObjectsLesson = {
  id: 'git-dag-objects',
  title: 'Git Under the Hood: The Object DAG',
  summary: 'Deconstruct Git internal object store: Blobs, Trees, Commits, and Annotated Tags. Understand content-addressable storage, zlib compression, and Merkle tree immutability.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['objectType', 'contentAddress', 'compression', 'immutability'],
  legend: ['flow', ['blob', 'blob object'], ['tree', 'tree manifest'], ['commit', 'commit node'], ['pack', 'packed object']],
  goals: [
    { text: 'The Blob: Raw byte storage with zlib compression', step: 1 },
    { text: 'The Tree: Hierarchical directory manifests and file permissions', step: 2 },
    { text: 'The Commit: Cryptographic snapshot with author metadata and parent hashes', step: 3 },
    { text: 'The Annotated Tag: GPG-signed release references', step: 4 },
    { text: 'Merkle tree cascade: Why modifying one byte ripples all upstream hashes', step: 5 },
    { text: 'Packfile optimization: Sliding-window delta compression and git gc', step: 6 },
  ],
  steps: [
    {
      short: 'Blob Object',
      chapter: 'setup',
      title: 'The Blob Object (Binary Large Object)',
      body: [
        'A <b>Blob</b> stores only raw file bytes. It does NOT store the filename, file creation date, or UNIX executable permissions.',
        'Header: <code>blob <size>\\0<content></code>. Git hashes this string using SHA-1 (or SHA-256) to produce a 40-character hex string (e.g. <code>4b825dc6...</code>), and compresses it with zlib into <code>.git/objects/4b/825dc6...</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'If two different files across your repo have identical contents, Git stores only ONE blob object. Content is deduplicated automatically.',
      },
      metrics: { objectType: 'blob', contentAddress: 'SHA-1 (40 hex)', compression: 'zlib level 6', immutability: '100% frozen' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Developer', tags: [{ text: 'src/app.ts', tone: 'blue', icon: 'terminal' }] }),
          blobApp: b(-6, -2, { s: 4.4, h: 50, color: 'purple', glyph: 'database', label: ['Blob 4b825d'], sub: 'raw file bytes' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Low-Level Blob Plumbing', [
            `$ echo "console.log()" | git hash-object -w --stdin`,
            `4b825dc642cb6eb9a060e54bf8d69288fbee4904`,
            `$ git cat-file -p 4b825d`,
            `console.log()`,
            `$ git cat-file -t 4b825d  # => blob`,
          ], { icon: 'terminal' }),
        },
        links: {
          db: h('devWorkspace', 'blobApp', ['devWorkspace', 'blobApp'], { label: 'write blob' }),
        },
        flows: [{ route: ['db'], kind: 'blob', rate: 1.5 }],
      },
    },
    {
      short: 'Tree Object',
      chapter: 'setup',
      title: 'The Tree Object (Directory Manifest)',
      body: [
        'A <b>Tree</b> object solves the question: <em>What was the filename and file permission?</em>',
        'Each tree entry contains file mode (<code>100644</code> normal, <code>100755</code> executable), type (<code>blob</code> or <code>tree</code> for subdirectories), filename, and the 20-byte binary SHA pointer to that object.',
      ],
      callout: {
        kind: 'tip',
        text: 'Subdirectories are simply nested Tree objects pointing to child trees. Changing 1 character in 1 file changes its blob SHA, which cascades up to a new root Tree SHA.',
      },
      changes: ['+ Subtree 1f2c4a connects app.ts to src/ folder', '+ Root Tree 8a3f91 connects root directory to src/'],
      metrics: { objectType: 'tree', contentAddress: 'SHA-1 (40 hex)', compression: 'zlib manifest', immutability: 'Deterministic' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Developer', tags: [{ text: 'git add', tone: 'blue', icon: 'terminal' }] }),
          blobApp: b(-6, -2, { s: 4.4, h: 50, color: 'purple', glyph: 'database', label: ['Blob 4b825d'], sub: 'src/app.ts' }),
          srcTree: d(-4, 16, { s: 4.4, h: 54, color: 'purple', glyph: 'package', label: ['Tree 1f2c4a'], sub: 'src/ manifest' }),
          rootTree: d(6, 0, { s: 4.4, h: 56, color: 'purple', glyph: 'boxes', label: ['Root 8a3f91'], sub: 'repo root tree' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Tree Manifest Inspection', [
            `$ git cat-file -p 8a3f91`,
            `040000 tree 1f2c4a... src`,
            `$ git cat-file -p 1f2c4a`,
            `100644 blob 4b825d... app.ts`,
            `= Filename and permissions restored`,
          ], { icon: 'terminal' }),
        },
        links: {
          sb: h('srcTree', 'blobApp', ['srcTree', 'blobApp'], { label: 'app.ts' }),
          rs: h('rootTree', 'srcTree', ['rootTree', 'srcTree'], { label: 'src/' }),
        },
        flows: [{ route: ['rs', 'sb'], kind: 'tree', rate: 1.5 }],
      },
    },
    {
      short: 'Commit Object',
      chapter: 'execution',
      title: 'The Commit Object (Snapshot Header)',
      body: [
        'A <b>Commit</b> object glues everything together: it points to the top-level <b>Root Tree</b> SHA, zero or more <b>Parent Commit</b> SHAs, an author timestamp, committer timestamp, and the commit message.',
        'Because the commit points directly to the root tree, checking out a commit restores the exact repository state in an instant.',
      ],
      callout: {
        kind: 'insight',
        text: 'Commits form a Directed Acyclic Graph (DAG) pointing BACKWARDS in time toward their parent ancestors.',
      },
      changes: ['+ Commit object 7f8a9b sealed with author metadata', '+ Bound to Root Tree 8a3f91 as snapshot root'],
      metrics: { objectType: 'commit', contentAddress: 'SHA-1 (40 hex)', compression: 'zlib header', immutability: '100% frozen' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Developer', tags: [{ text: 'git commit', tone: 'blue', icon: 'terminal' }] }),
          blobApp: b(-6, -2, { s: 4.4, h: 50, color: 'purple', glyph: 'database', label: ['Blob 4b825d'], sub: 'src/app.ts' }),
          srcTree: d(-4, 16, { s: 4.4, h: 54, color: 'purple', glyph: 'package', label: ['Tree 1f2c4a'], sub: 'src/ manifest' }),
          rootTree: d(6, 0, { s: 4.4, h: 56, color: 'purple', glyph: 'boxes', label: ['Root 8a3f91'], sub: 'repo root tree' }),
          commitObj: d(18, 4, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Commit 7f8a9b'], sub: 'feat: add app' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Commit Header Fields', [
            `$ git cat-file -p 7f8a9b`,
            `tree 8a3f91b2c4...`,
            `author Developer <dev@org.com> 1700000000 +0000`,
            `committer Developer <dev@org.com> 1700000000 +0000`,
            `feat: add app`,
          ], { icon: 'terminal' }),
        },
        links: {
          sb: h('srcTree', 'blobApp', ['srcTree', 'blobApp'], { label: 'app.ts' }),
          rs: h('rootTree', 'srcTree', ['rootTree', 'srcTree'], { label: 'src/' }),
          cr: h('commitObj', 'rootTree', ['commitObj', 'rootTree'], { label: 'tree pointer' }),
        },
        flows: [{ route: ['cr', 'rs', 'sb'], kind: 'commit', rate: 1.6 }],
      },
    },
    {
      short: 'Annotated Tag',
      chapter: 'execution',
      title: 'The Annotated Tag (Signed Release Pointer)',
      body: [
        'A lightweight tag is just a text pointer. An <b>Annotated Tag</b> is a full cryptographic Git object stored in <code>.git/objects/</code>.',
        'It points directly to a commit SHA, stores the tagger identity, date, tagging message, and optional GPG cryptographic signature.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always use git tag -a v1.0.0 for production releases so the release metadata is permanently recorded and signable.',
      },
      changes: ['+ Annotated Tag v1.0.0 created as 4th object type', '+ Cryptographically bound to Commit 7f8a9b'],
      metrics: { objectType: 'tag', contentAddress: 'SHA-1 (40 hex)', compression: 'zlib signed', immutability: 'GPG signed' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Developer', tags: [{ text: 'git tag -a', tone: 'blue', icon: 'terminal' }] }),
          blobApp: b(-6, -2, { s: 4.4, h: 50, color: 'purple', glyph: 'database', label: ['Blob 4b825d'], sub: 'src/app.ts' }),
          srcTree: d(-4, 16, { s: 4.4, h: 54, color: 'purple', glyph: 'package', label: ['Tree 1f2c4a'], sub: 'src/ manifest' }),
          rootTree: d(6, 0, { s: 4.4, h: 56, color: 'purple', glyph: 'boxes', label: ['Root 8a3f91'], sub: 'repo root tree' }),
          commitObj: d(18, 4, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Commit 7f8a9b'], sub: 'feat: add app' }),
          tagObj: d(12, 20, { s: 4.4, h: 54, color: 'amber', glyph: 'shield', label: ['Tag v1.0.0'], sub: 'GPG release' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Annotated Tag Object', [
            `$ git cat-file -p v1.0.0`,
            `object 7f8a9b2c4e...`,
            `type commit`,
            `tag v1.0.0`,
            `tagger Dev <dev@org.com> 1700000000 +0000`,
            `Release version 1.0.0`,
          ], { icon: 'terminal' }),
        },
        links: {
          sb: h('srcTree', 'blobApp', ['srcTree', 'blobApp'], { label: 'app.ts' }),
          rs: h('rootTree', 'srcTree', ['rootTree', 'srcTree'], { label: 'src/' }),
          cr: h('commitObj', 'rootTree', ['commitObj', 'rootTree'], { label: 'tree pointer' }),
          tc: h('tagObj', 'commitObj', ['tagObj', 'commitObj'], { label: 'points to' }),
        },
        flows: [{ route: ['tc', 'cr'], kind: 'commit', rate: 1.5 }],
      },
    },
    {
      short: 'Merkle Cascade',
      chapter: 'technique',
      title: 'Merkle Tree Cascade: The Immutability Guarantee',
      body: [
        'What happens if you modify 1 character in <code>src/app.ts</code>? The SHA-1 hash changes to <code>9e1f2a...</code>.',
        'Because <code>src/ Tree</code> stores the old hash, it MUST recalculate to a new hash. That forces the <code>Root Tree</code> to change, which forces the <code>Commit</code> hash to change. This is the <b>Merkle cascade</b>.',
      ],
      callout: {
        kind: 'insight',
        text: 'It is mathematically impossible to alter 1 byte of Git history without altering every subsequent commit hash in the entire branch.',
      },
      changes: ['~ Modified 1 byte in src/app.ts', '~ Blob hash altered: 4b825d -> 9e1f2a', '~ Upstream hashes invalidated & recalculated'],
      metrics: { objectType: 'Merkle DAG', contentAddress: 'Cascade Alert', compression: 'Deterministic', immutability: 'Tamper proof' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Developer', tags: [{ text: 'edit 1 byte', tone: 'rose', icon: 'terminal' }] }),
          blobApp: b(-6, -2, { s: 4.4, h: 50, color: 'rose', glyph: 'database', label: ['Blob 9e1f2a'], sub: 'hash changed' }),
          srcTree: d(-4, 16, { s: 4.4, h: 54, color: 'amber', glyph: 'package', label: ['Tree 3c4d5e'], sub: 'new SHA-1' }),
          rootTree: d(6, 0, { s: 4.4, h: 56, color: 'amber', glyph: 'boxes', label: ['Root 6f7a8b'], sub: 'new SHA-1' }),
          commitObj: d(18, 4, { s: 4.4, h: 56, color: 'amber', glyph: 'gitBranch', label: ['Commit 2b3c4d'], sub: 'new commit SHA' }),
          tagObj: d(12, 20, { s: 4.4, h: 54, color: 'rose', glyph: 'shield', label: ['Tag Broken'], sub: 'signature void' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Merkle Ripple Cascade', [
            `1. Byte change -> New Blob: 9e1f2a`,
            `2. Parent Tree recalculated -> 3c4d5e`,
            `3. Root Tree recalculated   -> 6f7a8b`,
            `4. Commit SHA recalculated  -> 2b3c4d`,
            `= Old GPG signature is immediately void!`,
          ], { icon: 'terminal' }),
        },
        links: {
          sb: h('srcTree', 'blobApp', ['srcTree', 'blobApp'], { label: 'hash altered' }),
          rs: h('rootTree', 'srcTree', ['rootTree', 'srcTree'], { label: 'recalculated' }),
          cr: h('commitObj', 'rootTree', ['commitObj', 'rootTree'], { label: 'cascaded' }),
          tc: h('tagObj', 'commitObj', ['tagObj', 'commitObj'], { label: 'invalidated' }),
        },
        flows: [{ route: ['sb', 'rs', 'cr', 'tc'], kind: 'blob', rate: 1.8 }],
      },
    },
    {
      short: 'Packfiles & GC',
      chapter: 'solution',
      title: 'Packfile Optimization: git gc & Sliding Delta Compression',
      body: [
        'Storing every version as an individual loose file wastes inodes and disk space. <code>git gc</code> (garbage collect) bundles loose objects into a single binary <b>packfile</b> (<code>.pack</code>) indexed by <code>.idx</code>.',
        'Git sorts objects by filename and size, uses a sliding window to compute byte-level deltas, storing only the differences between revisions.',
      ],
      callout: {
        kind: 'tip',
        text: 'A Git packfile achieves extreme compression (often 10x smaller than raw zlib) because revisions of the same file share 99% of identical bytes.',
      },
      changes: ['+ Packed 100+ loose objects into .git/objects/pack/*.pack', '+ Sliding window delta compression applied (10x smaller)'],
      metrics: { objectType: 'packfile', contentAddress: 'Index (.idx)', compression: 'Sliding delta', immutability: '100% frozen' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Developer', tags: [{ text: 'git gc', tone: 'blue', icon: 'terminal' }] }),
          blobApp: b(-6, -2, { s: 4.4, h: 50, color: 'blue', glyph: 'boxes', label: ['.git/objects'], sub: 'loose objects' }),
          srcTree: d(-4, 16, { s: 4.4, h: 54, color: 'blue', glyph: 'shield', label: ['Delta Engine'], sub: 'sliding window' }),
          rootTree: b(6, 0, { s: 4.4, h: 56, color: 'green', glyph: 'database', label: ['pack-7f8a9b'], sub: '10x compressed' }),
          commitObj: d(18, 4, { s: 4.4, h: 54, color: 'cyan', glyph: 'boxes', label: ['Index .idx'], sub: 'O(logN) lookup' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Git Garbage Collection', [
            `$ git gc --aggressive --prune=now`,
            `Counting objects: 120, done.`,
            `Compressing objects: 100% (112/112), done.`,
            `Writing objects: 100% (120/120), done.`,
            `Total 120 (delta 84), reused 0`,
            `= Size reduced from 14MB to 1.1MB`,
          ], { icon: 'terminal' }),
        },
        links: {
          bs: h('blobApp', 'srcTree', ['blobApp', 'srcTree'], { label: 'pack delta' }),
          sr: h('srcTree', 'rootTree', ['srcTree', 'rootTree'], { label: 'write .pack' }),
          rc: h('rootTree', 'commitObj', ['rootTree', 'commitObj'], { label: 'build .idx' }),
        },
        flows: [{ route: ['bs', 'sr', 'rc'], kind: 'pack', rate: 1.8 }],
      },
    },
  ],
};
