// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDb as b,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitDagObjectsLesson = {
  id: 'git-dag-objects',
  title: '4 Immutable Objects: Blob, Tree, Commit & Tag',
  summary: 'Dissect Git’s internal content-addressable storage model: how SHA-1/SHA-256 hashes, zlib compression, Blobs, Trees, Commits, and Annotated Tags construct the Git DAG.',
  minutes: 15,
  level: 'advanced',
  metrics: ['objectType', 'contentAddress', 'compression', 'immutability'],
  legend: ['hash', ['tree', 'directory pointer'], ['blob', 'file content']],
  goals: [
    { text: 'Content-Addressable storage: why SHA hashes determine object identity', step: 1 },
    { text: 'Blobs: pure byte streams without filenames or permissions', step: 2 },
    { text: 'Trees: directories representing the hierarchy and filenames', step: 3 },
    { text: 'Commits & Annotated Tags: graph snapshots with author, parent, and PGP signature', step: 4 },
  ],
  steps: [
    {
      short: 'Blob Object',
      chapter: 'setup',
      title: 'The Blob Object (Binary Large Object)',
      body: [
        'A <b>Blob</b> stores only file content bytes. It does NOT store the filename, file creation date, or UNIX executable permissions.',
        'Header: <code>blob <size>\\0<content></code>. Git hashes this string using SHA-1 (or SHA-256) to produce a 40-character hex string (e.g. <code>e69de29b...</code>), and compresses it with zlib into <code>.git/objects/e6/9de29b...</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'If two different files across your repo have identical contents, Git stores only ONE blob object. Content is deduplicated automatically.',
      },
      metrics: { objectType: 'blob', contentAddress: 'SHA-1 (40 hex)', compression: 'zlib level 6', immutability: '100% frozen' },
      scene: {
        entities: {
          file: d(-8, 0, { color: 'amber', glyph: 'terminal', label: ['src/app.ts'], sub: 'raw disk file' }),
          hash: d(0, 0, { color: 'blue', glyph: 'boxes', label: ['SHA-1 Hash'], sub: 'blob 14\\0console.log()' }),
          blob: b(8, 0, { color: 'green', glyph: 'package', label: 'Blob Object', sub: '.git/objects/4b/825d...' }),
        },
        links: {
          fh: h('file', 'hash', ['file', 'hash'], { label: 'header + hash' }),
          hb: h('hash', 'blob', ['hash', 'blob'], { label: 'zlib compress' }),
        },
        flows: [{ route: ['fh', 'hb'], kind: 'blob', rate: 1.5 }],
      },
    },
    {
      short: 'Tree Object',
      chapter: 'technique',
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
          rootTree: d(-6, 0, { color: 'purple', glyph: 'boxes', label: ['Root Tree'], sub: 'tree 8a3f91' }),
          subTree: d(4, -4, { color: 'purple', glyph: 'boxes', label: ['src/ Tree'], sub: 'tree 1f2c4a' }),
          blob1: b(12, -6, { color: 'green', glyph: 'package', label: 'app.ts (blob)', sub: 'blob a1b2c3' }),
          blob2: b(12, -1, { color: 'green', glyph: 'package', label: 'utils.ts (blob)', sub: 'blob d4e5f6' }),
          blob3: b(4, 5, { color: 'green', glyph: 'package', label: 'README.md (blob)', sub: 'blob 7890ab' }),
        },
        links: {
          rt_st: h('rootTree', 'subTree', ['rootTree', 'subTree'], { label: 'src/' }),
          rt_b3: h('rootTree', 'blob3', ['rootTree', 'blob3'], { label: 'README.md' }),
          st_b1: h('subTree', 'blob1', ['subTree', 'blob1'], { label: 'app.ts' }),
          st_b2: h('subTree', 'blob2', ['subTree', 'blob2'], { label: 'utils.ts' }),
        },
        flows: [
          { route: ['rt_st', 'st_b1'], kind: 'tree', rate: 1.2 },
          { route: ['rt_b3'], kind: 'tree', rate: 1.0 },
        ],
      },
    },
    {
      short: 'Commit Object',
      chapter: 'solution',
      title: 'The Commit Object (Cryptographic Snapshot in DAG)',
      body: [
        'A <b>Commit</b> object is surprisingly tiny and plain text: it contains a pointer to the top-level <code>tree</code>, zero or more <code>parent</code> commit hashes (two parents for a merge commit), author and committer metadata (name, email, unix epoch timestamp), and the commit message.',
        'Because each commit references its parent by cryptographic hash, Git history forms an append-only <b>Merkle DAG</b> (Directed Acyclic Graph) where rewriting any historical commit changes every subsequent commit hash.',
      ],
      callout: {
        kind: 'insight',
        text: 'You cannot tamper with any byte of past history without breaking the cryptographic hash chain to HEAD.',
      },
      changes: ['+ Commit object references Root Tree SHA', '+ Links to parent commit SHA-1', '+ Forms unbroken Merkle chain'],
      metrics: { objectType: 'commit', contentAddress: 'SHA-1 / SHA-256', compression: 'zlib metadata', immutability: 'Merkle chain verified' },
      scene: {
        entities: {
          c1: d(-10, 0, { color: 'slab', glyph: 'gitBranch', label: ['Commit 1'], sub: 'parent: none (root)' }),
          c2: d(0, 0, { color: 'green', glyph: 'gitBranch', label: ['Commit 2'], sub: 'parent: Commit 1' }),
          tree: d(8, -4, { color: 'purple', glyph: 'boxes', label: ['Tree Snapshot'], sub: 'tree 9f8e7d' }),
          author: d(8, 4, { color: 'amber', glyph: 'terminal', label: ['Metadata'], sub: 'author, time, msg' }),
        },
        links: {
          c1c2: h('c1', 'c2', ['c1', 'c2'], { heads: 'forward', label: 'parent pointer' }),
          c2t: h('c2', 'tree', ['c2', 'tree'], { label: 'tree ref' }),
          c2a: h('c2', 'author', ['c2', 'author'], { label: 'signature' }),
        },
        flows: [{ route: ['c1c2'], rate: 1.5 }],
      },
    },
  ],
};
