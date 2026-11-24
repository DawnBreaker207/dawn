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

export const gitDagObjectsLesson = {
  id: 'git-dag-objects',
  title: '4 Immutable Objects: Blob, Tree, Commit & Tag',
  summary: 'Dissect Git’s internal content-addressable storage model: how SHA hashes, zlib compression, Blobs, Trees, Commits, and Annotated Tags construct the Git Merkle DAG.',
  minutes: 25,
  level: 'advanced',
  metrics: ['objectType', 'contentAddress', 'compression', 'immutability'],
  legend: ['hash', ['tree', 'directory pointer'], ['blob', 'file content'], ['commit', 'graph snapshot'], ['pack', 'packfile delta']],
  goals: [
    { text: 'Blobs: pure byte streams without filenames or permissions', step: 1 },
    { text: 'Trees: directories representing the hierarchy and filenames', step: 2 },
    { text: 'Commits: immutable snapshots with tree, parent, and author', step: 3 },
    { text: 'Annotated Tags: cryptographic pointers with PGP signature', step: 4 },
    { text: 'Merkle DAG Cascading: why 1 byte edit re-hashes all parents', step: 5 },
    { text: 'Packfile Delta Compression: packing loose objects into .pack and .idx', step: 6 },
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
          file: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['src/app.ts'], sub: 'raw disk file' }),
          hash: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'boxes', label: ['SHA-1 Hash'], sub: 'blob 14\\0console.log()' }),
          blob: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Blob Object'], sub: '.git/objects/4b/825d...' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Low-Level Blob Plumbing', [
            `$ echo "console.log()" | git hash-object -w --stdin`,
            `4b825dc642cb6eb9a060e54bf8d69288fbee4904`,
            `$ git cat-file -p 4b825d`,
            `console.log()`,
            `$ git cat-file -t 4b825d  # => blob`,
          ], { icon: 'terminal' }),
          zDag: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'GIT OBJECT STORE (.GIT/OBJECTS)'),
        },
        links: {
          fh: h('file', 'hash', ['file', 'hash'], { label: 'header + sha' }),
          hb: h('hash', 'blob', ['hash', 'blob'], { label: 'zlib compress' }),
        },
        flows: [{ route: ['fh', 'hb'], kind: 'blob', rate: 1.5 }],
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
      changes: ['+ Root Tree object connects filenames to Blob SHAs', '+ Subdirectory becomes child Tree object'],
      metrics: { objectType: 'tree', contentAddress: 'SHA-1 (40 hex)', compression: 'zlib binary manifest', immutability: 'Deterministic' },
      scene: {
        entities: {
          rootTree: d(-10, -18, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Root Tree'], sub: 'tree 8a3f91' }),
          subTree: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['src/ Tree'], sub: 'tree 1f2c4a' }),
          blob1: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['app.ts (blob)'], sub: 'blob 4b825d' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Tree Manifest Inspection', [
            `$ git cat-file -p 8a3f91`,
            `040000 tree 1f2c4a... src`,
            `100644 blob e69de2... package.json`,
            `$ git cat-file -p 1f2c4a`,
            `100644 blob 4b825d... app.ts`,
          ], { icon: 'terminal' }),
          zDag: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'TREE HIERARCHY DIRECTORY STORE'),
        },
        links: {
          rs: h('rootTree', 'subTree', ['rootTree', 'subTree'], { label: 'subdir pointer' }),
          sb: h('subTree', 'blob1', ['subTree', 'blob1'], { label: 'file pointer' }),
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
        'Because commits reference parents by their SHA, Git forms a Directed Acyclic Graph (DAG) that is cryptographically sealed.',
      ],
      callout: {
        kind: 'insight',
        text: 'A commit does not store diffs! It stores a direct pointer to the complete root tree snapshot of the entire repository.',
      },
      changes: ['+ Commit object points to root tree SHA', '+ Links to parent commit SHA creating the DAG'],
      metrics: { objectType: 'commit', contentAddress: 'SHA-1 (40 hex)', compression: 'zlib plain text', immutability: 'Sealed DAG' },
      scene: {
        entities: {
          parent: d(-10, -18, { s: 4.8, h: 50, color: 'slab', glyph: 'gitBranch', label: ['Parent Commit'], sub: 'commit 3f8a12' }),
          commit: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'boxes', label: ['Commit Object'], sub: 'commit 7d9e44' }),
          tree: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Root Tree'], sub: 'tree 8a3f91' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Raw Commit Object Body', [
            `$ git cat-file -p 7d9e44`,
            `tree 8a3f91...`,
            `parent 3f8a12...`,
            `author Linus <torvalds@kernel.org> 1700000000 +0000`,
            `committer Linus <torvalds@kernel.org> 1700000000 +0000`,
            `feat: implement auth service`,
          ], { icon: 'terminal' }),
          zDag: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'COMMIT SNAPSHOT IN DAG'),
        },
        links: {
          cp: h('commit', 'parent', ['commit', 'parent'], { label: 'parent pointer' }),
          ct: h('commit', 'tree', ['commit', 'tree'], { label: 'tree snapshot' }),
        },
        flows: [{ route: ['cp', 'ct'], kind: 'commit', rate: 1.5 }],
      },
    },
    {
      short: 'Annotated Tag',
      chapter: 'execution',
      title: 'Annotated Tag Object (Release Seal)',
      body: [
        'A <b>Lightweight Tag</b> is simply a text pointer in <code>.git/refs/tags/</code>. An <b>Annotated Tag</b> is a full object stored in <code>.git/objects/</code>.',
        'It records the target object SHA (usually a commit), object type, tag name, tagger identity, timestamp, release message, and an optional cryptographic GPG signature.',
      ],
      callout: {
        kind: 'tip',
        text: 'Always use git tag -a v1.0.0 -m "Release" for production releases so the tagger identity and PGP signature are permanently archived.',
      },
      changes: ['+ Tag object stored in .git/objects/ with GPG signature', '+ Lightweight ref in .git/refs/tags/ points to tag object'],
      metrics: { objectType: 'tag', contentAddress: 'SHA-1 (40 hex)', compression: 'zlib sealed object', immutability: 'Cryptographic' },
      scene: {
        entities: {
          refTag: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'gitBranch', label: ['refs/tags/v1.0'], sub: 'tag pointer' }),
          tagObj: d(0, -6, { s: 4.8, h: 50, color: 'yellow', glyph: 'package', label: ['Annotated Tag'], sub: 'tag b2c4d6' }),
          target: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'boxes', label: ['Target Commit'], sub: 'commit 7d9e44' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Annotated Tag Object Dump', [
            `$ git cat-file -p v1.0`,
            `object 7d9e44...`,
            `type commit`,
            `tag v1.0`,
            `tagger Alice <alice@corp.com> 1700000050 +0000`,
            `-----BEGIN PGP SIGNATURE-----...`,
          ], { icon: 'terminal' }),
          zDag: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'ANNOTATED TAG RELEASE STORE'),
        },
        links: {
          rt: h('refTag', 'tagObj', ['refTag', 'tagObj'], { label: 'refs pointer' }),
          tt: h('tagObj', 'target', ['tagObj', 'target'], { label: 'target commit' }),
        },
        flows: [{ route: ['rt', 'tt'], kind: 'commit', rate: 1.5 }],
      },
    },
    {
      short: 'Merkle Ripple',
      chapter: 'scaling',
      title: 'Merkle DAG Ripple Effect',
      body: [
        'Because object hashes depend strictly on their content, modifying <b>even a single byte</b> in <code>app.ts</code> causes a cascade of recalculations.',
        '1. New Blob SHA computed. 2. Parent Tree SHA changes. 3. Root Tree SHA changes. 4. New Commit SHA generated. Historical objects remain completely unchanged.',
      ],
      callout: {
        kind: 'insight',
        text: 'This Merkle tree property makes Git history tamper-proof: altering any historical commit would alter all subsequent commit SHAs instantly.',
      },
      changes: ['+ Single byte change generates new Blob, Tree, and Commit', '+ Old history remains 100% immutable and intact'],
      metrics: { objectType: 'merkle', contentAddress: 'Cascading SHA', compression: 'Deduplicated tree', immutability: 'Tamper-evident' },
      scene: {
        entities: {
          diff: d(-10, -18, { s: 4.8, h: 50, color: 'rose', glyph: 'terminal', label: ['1-Byte Edit'], sub: 'app.ts modified' }),
          newTree: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['New Root Tree'], sub: 'tree 9f4a12' }),
          newCommit: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'boxes', label: ['New Commit'], sub: 'commit a5b8c9' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Merkle Ripple Calculation', [
            `Delta: +1 byte in src/app.ts`,
            `Blob: 4b825d -> f1a2b3 (new blob written)`,
            `Tree: 8a3f91 -> 9f4a12 (new tree written)`,
            `Commit: 7d9e44 -> a5b8c9 (parent: 7d9e44)`,
            `History preserved: 7d9e44 still points to 8a3f91`,
          ], { icon: 'terminal' }),
          zDag: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'MERKLE TREE CASCADE INTEGRITY'),
        },
        links: {
          dt: h('diff', 'newTree', ['diff', 'newTree'], { label: 'hashes cascade' }),
          tc: h('newTree', 'newCommit', ['newTree', 'newCommit'], { label: 'seals commit' }),
        },
        flows: [{ route: ['dt', 'tc'], kind: 'blob', rate: 1.6 }],
      },
    },
    {
      short: 'Packfiles & GC',
      chapter: 'scaling',
      title: 'Packfile Delta Compression (git gc)',
      body: [
        'Having thousands of loose individual files in <code>.git/objects/</code> hurts filesystem performance and wastes disk space.',
        '<code>git gc</code> packs loose objects into a single binary <b>.pack</b> file and builds a binary search index <b>.idx</b>. It uses sliding-window delta compression to store file diffs against similar files.',
      ],
      callout: {
        kind: 'tip',
        text: 'In a packfile, the most recent version is stored full, and older versions are stored as reverse deltas to optimize checkout speed for current code.',
      },
      changes: ['+ Thousands of loose files consolidated into .pack + .idx', '+ Delta compression slashes repository disk size by 80-95%'],
      metrics: { objectType: 'packfile', contentAddress: 'Binary index offset', compression: 'Sliding delta + zlib', immutability: 'Packed storage' },
      scene: {
        entities: {
          loose: d(-10, -18, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['Loose Objects'], sub: '10,000 files in .git' }),
          gcEngine: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['git gc engine'], sub: 'sliding window delta' }),
          packfile: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['pack-*.pack'], sub: 'single compressed pack' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Garbage Collection Output', [
            `$ git gc --aggressive`,
            `Enumerating objects: 1250, done.`,
            `Counting objects: 100% (1250/1250), done.`,
            `Compressing objects: 100% (980/980), done.`,
            `Writing objects: 100% (1250/1250), done.`,
            `Total 1250 (delta 720), reused 0 (delta 0)`,
          ], { icon: 'terminal' }),
          zDag: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'PACKFILE BINARY STORAGE'),
        },
        links: {
          lg: h('loose', 'gcEngine', ['loose', 'gcEngine'], { label: 'pack loose objects' }),
          gp: h('gcEngine', 'packfile', ['gcEngine', 'packfile'], { label: 'write .pack + .idx' }),
        },
        flows: [{ route: ['lg', 'gp'], kind: 'pack', rate: 1.6 }],
      },
    },
  ],
};
