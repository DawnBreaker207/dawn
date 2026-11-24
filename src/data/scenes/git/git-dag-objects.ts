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
          fileInput: y(-7, 7, { label: 'Raw File', tags: [{ text: 'src/app.ts', tone: 'blue', icon: 'terminal' }] }),
          hashEngine: d(0, 0, { s: 5.2, h: 56, color: 'blue', glyph: 'cpu', label: ['SHA-1 Engine'], sub: 'blob 14\\0byte' }),
          blobObject: b(7, -7, { s: 4.8, h: 50, color: 'green', glyph: 'database', label: ['Blob Object'], sub: '4b825d zlib' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Low-Level Blob Plumbing', [
            `$ echo "console.log()" | git hash-object -w --stdin`,
            `4b825dc642cb6eb9a060e54bf8d69288fbee4904`,
            `$ git cat-file -p 4b825d`,
            `console.log()`,
            `$ git cat-file -t 4b825d  # => blob`,
          ], { icon: 'terminal' }),
        },
        links: {
          fh: h('fileInput', 'hashEngine', ['fileInput', 'hashEngine'], { label: 'header + size' }),
          hb: h('hashEngine', 'blobObject', ['hashEngine', 'blobObject'], { label: 'zlib compress' }),
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
          rootTree: d(-7, 7, { s: 5.0, h: 54, color: 'purple', glyph: 'package', label: ['Root Tree'], sub: 'tree 8a3f91' }),
          subTree: d(0, 0, { s: 5.2, h: 56, color: 'purple', glyph: 'boxes', label: ['src/ Tree'], sub: 'tree 1f2c4a' }),
          blobFile: b(7, -7, { s: 4.8, h: 50, color: 'green', glyph: 'database', label: ['app.ts (Blob)'], sub: 'blob 4b825d' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Tree Manifest Inspection', [
            `$ git cat-file -p 8a3f91`,
            `040000 tree 1f2c4a... src`,
            `100644 blob e69de2... package.json`,
            `$ git cat-file -p 1f2c4a`,
            `100644 blob 4b825d... app.ts`,
          ], { icon: 'terminal' }),
        },
        links: {
          rs: h('rootTree', 'subTree', ['rootTree', 'subTree'], { label: 'subdir pointer' }),
          sb: h('subTree', 'blobFile', ['subTree', 'blobFile'], { label: 'file pointer' }),
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
          parentCommit: d(-7, 7, { s: 5.0, h: 54, color: 'slab', glyph: 'gitBranch', label: ['Parent Commit'], sub: 'commit 3f8a12' }),
          commitObj: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'gitBranch', label: ['Commit Object'], sub: 'commit 7d9e44' }),
          rootTree: d(7, -7, { s: 5.0, h: 54, color: 'purple', glyph: 'package', label: ['Root Tree'], sub: 'tree 8a3f91' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Raw Commit Object Body', [
            `$ git cat-file -p 7d9e44`,
            `tree 8a3f91...`,
            `parent 3f8a12...`,
            `author Linus <torvalds@kernel.org> 1700000000 +0000`,
            `committer Linus <torvalds@kernel.org> 1700000000 +0000`,
            `feat: implement auth service`,
          ], { icon: 'terminal' }),
        },
        links: {
          cp: h('commitObj', 'parentCommit', ['commitObj', 'parentCommit'], { label: 'parent SHA' }),
          ct: h('commitObj', 'rootTree', ['commitObj', 'rootTree'], { label: 'root tree SHA' }),
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
          refPointer: y(-7, 7, { label: 'Ref Pointer', tags: [{ text: 'refs/tags/v1.0', tone: 'amber', icon: 'gitBranch' }] }),
          tagObject: d(0, 0, { s: 5.2, h: 56, color: 'yellow', glyph: 'package', label: ['Annotated Tag'], sub: 'tag b2c4d6' }),
          targetCommit: d(7, -7, { s: 5.0, h: 54, color: 'cyan', glyph: 'gitBranch', label: ['Target Commit'], sub: 'commit 7d9e44' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Annotated Tag Object Dump', [
            `$ git cat-file -p v1.0`,
            `object 7d9e44...`,
            `type commit`,
            `tag v1.0`,
            `tagger Alice <alice@corp.com> 1700000050 +0000`,
            `-----BEGIN PGP SIGNATURE-----...`,
          ], { icon: 'terminal' }),
        },
        links: {
          rt: h('refPointer', 'tagObject', ['refPointer', 'tagObject'], { label: 'ref pointer' }),
          tt: h('tagObject', 'targetCommit', ['tagObject', 'targetCommit'], { label: 'target commit' }),
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
          byteEdit: y(-7, 7, { label: 'Disk Edit', tags: [{ text: '+1 byte app.ts', tone: 'rose', icon: 'terminal' }] }),
          newRootTree: d(0, 0, { s: 5.2, h: 56, color: 'purple', glyph: 'package', label: ['New Root Tree'], sub: 'tree 9f4a12' }),
          newCommitObj: d(7, -7, { s: 5.0, h: 54, color: 'cyan', glyph: 'gitBranch', label: ['New Commit'], sub: 'commit a5b8c9' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Merkle Ripple Calculation', [
            `Delta: +1 byte in src/app.ts`,
            `Blob: 4b825d -> f1a2b3 (new blob written)`,
            `Tree: 8a3f91 -> 9f4a12 (new tree written)`,
            `Commit: 7d9e44 -> a5b8c9 (parent: 7d9e44)`,
            `History preserved: 7d9e44 still points to 8a3f91`,
          ], { icon: 'terminal' }),
        },
        links: {
          bn: h('byteEdit', 'newRootTree', ['byteEdit', 'newRootTree'], { label: 'hashes cascade' }),
          nc: h('newRootTree', 'newCommitObj', ['newRootTree', 'newCommitObj'], { label: 'seals commit' }),
        },
        flows: [{ route: ['bn', 'nc'], kind: 'blob', rate: 1.6 }],
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
          looseFiles: d(-7, 7, { s: 5.0, h: 54, color: 'slab', glyph: 'boxes', label: ['Loose Objects'], sub: '10,000 files' }),
          gcEngine: d(0, 0, { s: 5.2, h: 56, color: 'blue', glyph: 'cpu', label: ['git gc engine'], sub: 'sliding delta' }),
          packfileDb: b(7, -7, { s: 4.8, h: 50, color: 'green', glyph: 'database', label: ['pack-*.pack'], sub: 'binary delta' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Garbage Collection Output', [
            `$ git gc --aggressive`,
            `Enumerating objects: 1250, done.`,
            `Counting objects: 100% (1250/1250), done.`,
            `Compressing objects: 100% (980/980), done.`,
            `Writing objects: 100% (1250/1250), done.`,
            `Total 1250 (delta 720), reused 0 (delta 0)`,
          ], { icon: 'terminal' }),
        },
        links: {
          lg: h('looseFiles', 'gcEngine', ['looseFiles', 'gcEngine'], { label: 'pack loose' }),
          gp: h('gcEngine', 'packfileDb', ['gcEngine', 'packfileDb'], { label: 'write .pack' }),
        },
        flows: [{ route: ['lg', 'gp'], kind: 'pack', rate: 1.6 }],
      },
    },
  ],
};
