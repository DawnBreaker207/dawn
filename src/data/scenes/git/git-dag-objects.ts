import { makeBlock, makeDb, makeLink, makePanel } from '@/lib/simulator/scene-builders';

// One fixed stage: the four object types laid out as the pointer chain they form.
// Arrows point the way Git stores them — from the object that names a hash to the
// object with that hash.
//
//   v1.0.0 ── commit ── root tree ── src/ tree ── blob
//                              └──────── pack ────┘   (git gc)
//
// Git colours: commit = purple, tree = green, tag/ref = yellow, blob/pack = db.

type Tag = { text: string; tone?: string; icon?: string };

const at = (sx: number, sy: number): [number, number] => [
  Math.round((sx / 28 + sy / 14) * 100) / 100,
  Math.round((sx / 28 - sy / 14) * 100) / 100,
];

const blob = (sha: string, tags: Tag[] = []) => makeDb(...at(400, 20), { r: 2.2, h: 46, glyph: `file`, label: `blob ${sha}`, tags });
const srcTree = (sha: string, tags: Tag[] = []) =>
  makeBlock(...at(200, -60), { s: 4.4, h: 50, color: `green`, glyph: `boxes`, label: [`tree ${sha}`], sub: `src/`, tags });
const rootTree = (sha: string, tags: Tag[] = []) =>
  makeBlock(...at(0, 20), { s: 4.4, h: 50, color: `green`, glyph: `boxes`, label: [`tree ${sha}`], sub: `/ (root)`, tags });
const commit = (sha: string, tags: Tag[] = []) =>
  makeBlock(...at(-200, -60), { s: 4.4, h: 50, color: `purple`, glyph: `gitCommit`, label: [`commit ${sha}`], sub: `feat: add app`, tags });
const tag = (tags: Tag[] = []) =>
  makeBlock(...at(-400, 20), { s: 4.4, h: 50, color: `yellow`, glyph: `bookmark`, label: [`tag v1.0.0`], sub: `annotated`, tags });
const pack = () =>
  makeDb(...at(100, 150), { r: 2.4, h: 48, glyph: `package`, label: `pack-7f8a.pack`, tags: [{ text: `120 objects · 1.1 MB`, tone: `green` }] });

const L = {
  name: makeLink(`srcTree`, `blob`, [`srcTree`, `blob`], { label: `app.ts` }),
  dir: makeLink(`rootTree`, `srcTree`, [`rootTree`, `srcTree`], { label: `src/` }),
  snapshot: makeLink(`commit`, `rootTree`, [`commit`, `rootTree`], { label: `tree` }),
  release: makeLink(`tag`, `commit`, [`tag`, `commit`], { label: `object` }),
  packBlob: makeLink(`blob`, `pack`, [`blob`, `pack`]),
  packSrc: makeLink(`srcTree`, `pack`, [`srcTree`, `pack`]),
  packRoot: makeLink(`rootTree`, `pack`, [`rootTree`, `pack`]),
};

const card = (title: string, lines: string[]) =>
  makePanel({ x: 0, y: 0, z: 0, dx: -440, dy: 80 }, title, lines, { icon: `keyboard` });

const changed: Tag = { text: `new hash`, tone: `amber` };

export const gitDagObjectsLesson = {
  id: `git-dag-objects`,
  title: `Git Under the Hood: The Object DAG`,
  summary: `Build a commit object by object — blob, trees, commit, annotated tag — and see why changing one byte changes every hash above it.`,
  minutes: 16,
  level: `intermediate`,
  metrics: [`objects`, `lastSha`, `diskSize`, `packfiles`],
  legend: [`req`, [`write`, `object write`], [`msg`, `hash lookup`]],
  goals: [
    { text: `The blob: raw bytes, no filename`, step: 1 },
    { text: `The tree: names, modes and hashes`, step: 2 },
    { text: `The commit: a snapshot with author and parents`, step: 3 },
    { text: `The annotated tag: a signed name for a commit`, step: 4 },
    { text: `The Merkle cascade: one byte changes every hash above it`, step: 5 },
    { text: `Packfiles: git gc stores deltas`, step: 6 },
  ],
  steps: [
    {
      short: `Blob`,
      chapter: `setup`,
      title: `A blob is only the bytes`,
      body: [
        `Git stores file content as a <span class="term">blob</span>: the bytes, with a short header, compressed with zlib. No filename, no permissions, no date.`,
        `Its name is the SHA-1 of that content, so two identical files anywhere in history share one blob.`,
      ],
      metrics: { objects: 1, lastSha: `4b825d`, diskSize: `4 KB`, packfiles: 0 },
      scene: {
        entities: {
          blob: blob(`4b825d`, [{ text: `app.ts content`, tone: `violet` }]),
          card: card(`blob`, [`$ git hash-object -w src/app.ts`, `4b825dc642cb6eb9a060e54bf8d69288fbee4904`, `$ git cat-file -t 4b825d`, `blob`]),
        },
        links: {},
        flows: [],
      },
    },
    {
      short: `Tree`,
      chapter: `technique`,
      title: `Trees add names and folders`,
      body: [
        `A <span class="term">tree</span> is a directory listing: one row per entry with mode (<code>100644</code>, <code>100755</code>…), type, hash and name.`,
        `Folders are trees that point to other trees. The root tree <code>8a3f91</code> lists <code>src/</code>, which lists <code>app.ts</code>.`,
      ],
      changes: [`+ tree 1f2c4a (src/)`, `+ tree 8a3f91 (root)`],
      metrics: { objects: 3, lastSha: `8a3f91`, diskSize: `12 KB`, packfiles: 0 },
      scene: {
        entities: {
          blob: blob(`4b825d`),
          srcTree: srcTree(`1f2c4a`),
          rootTree: rootTree(`8a3f91`),
          card: card(`trees`, [`$ git cat-file -p 8a3f91`, `040000 tree 1f2c4a…    src`, `$ git cat-file -p 1f2c4a`, `100644 blob 4b825d…    app.ts`]),
        },
        links: { name: L.name, dir: L.dir },
        flows: [{ route: [`dir`, `name`], kind: `msg`, rate: 1.2 }],
      },
    },
    {
      short: `Commit`,
      chapter: `technique`,
      title: `A commit points at one root tree`,
      body: [
        `A <span class="term">commit</span> is small: the hash of the root tree, the hashes of its parent commits, author, committer, time and message.`,
        `Because it names the whole tree, checking out a commit restores the exact project state. Parent hashes chain commits into a graph that points back in time.`,
      ],
      changes: [`+ commit 7f8a9b`],
      metrics: { objects: 4, lastSha: `7f8a9b`, diskSize: `16 KB`, packfiles: 0 },
      scene: {
        entities: {
          blob: blob(`4b825d`),
          srcTree: srcTree(`1f2c4a`),
          rootTree: rootTree(`8a3f91`),
          commit: commit(`7f8a9b`),
          card: card(`commit`, [`$ git cat-file -p 7f8a9b`, `tree 8a3f91b2c4…`, `parent e8d9c2a1…`, `author Dev <dev@org.com> 1700000000 +0000`, `feat: add app`]),
        },
        links: { name: L.name, dir: L.dir, snapshot: L.snapshot },
        flows: [{ route: [`snapshot`, `dir`, `name`], kind: `msg`, rate: 1.2 }],
      },
    },
    {
      short: `Tag`,
      chapter: `technique`,
      title: `An annotated tag names a release`,
      body: [
        `A lightweight tag is just a ref file. An <span class="term">annotated tag</span> is a real object: it points to a commit and records tagger, date, message and an optional GPG signature.`,
        `Use <code>git tag -a</code> (or <code>-s</code> to sign) for releases, so the release itself is part of history.`,
      ],
      changes: [`+ tag v1.0.0 → 7f8a9b`],
      metrics: { objects: 5, lastSha: `v1.0.0`, diskSize: `20 KB`, packfiles: 0 },
      scene: {
        entities: {
          blob: blob(`4b825d`),
          srcTree: srcTree(`1f2c4a`),
          rootTree: rootTree(`8a3f91`),
          commit: commit(`7f8a9b`),
          tag: tag([{ text: `signed`, tone: `green`, icon: `key` }]),
          card: card(`tag`, [`$ git tag -s v1.0.0 -m "Release 1.0.0"`, `$ git cat-file -p v1.0.0`, `object 7f8a9b2c4e…`, `type commit`, `tagger Dev <dev@org.com> 1700000000 +0000`]),
        },
        links: { name: L.name, dir: L.dir, snapshot: L.snapshot, release: L.release },
        flows: [{ route: [`release`, `snapshot`, `dir`, `name`], kind: `msg`, rate: 1.2 }],
      },
    },
    {
      short: `Cascade`,
      chapter: `insight`,
      title: `Change one byte, every hash above changes`,
      body: [
        `Edit one character of <code>app.ts</code> and commit. The new content is a new blob <code>9e1f2a</code>. The <code>src/</code> tree stored the old hash, so it becomes a new tree; so does the root; so does the commit. This is a <span class="term">Merkle</span> chain.`,
        `Nothing old is modified — new objects are added. <code>v1.0.0</code> still names <code>7f8a9b</code>, so a signed release can never silently change underneath you.`,
      ],
      changes: [`+ blob 9e1f2a`, `+ trees 3c4d5e, 6f7a8b`, `+ commit 2b3c4d`, `= v1.0.0 still → 7f8a9b`],
      metrics: { objects: 9, lastSha: `2b3c4d`, diskSize: `36 KB`, packfiles: 0 },
      scene: {
        entities: {
          blob: blob(`9e1f2a`, [changed]),
          srcTree: srcTree(`3c4d5e`, [changed]),
          rootTree: rootTree(`6f7a8b`, [changed]),
          commit: commit(`2b3c4d`, [changed]),
          tag: tag([{ text: `→ old 7f8a9b`, tone: `gray` }]),
          card: card(`one byte later`, [`$ git commit -am "fix: typo"`, `[main 2b3c4d] fix: typo`, `$ git rev-parse HEAD^{tree} v1.0.0^{tree}`, `6f7a8b…   # new root`, `8a3f91…   # release root, unchanged`]),
        },
        links: { name: L.name, dir: L.dir, snapshot: L.snapshot, release: L.release },
        flows: [{ route: [`snapshot`, `dir`, `name`], kind: `write`, rate: 1.4, bounce: true }],
      },
    },
    {
      short: `Packfile`,
      chapter: `solution`,
      title: `git gc packs objects as deltas`,
      body: [
        `Every version is a full object, which is simple but wasteful. <span class="term">git gc</span> rolls loose objects into a <span class="term">packfile</span>: similar objects are stored as a base plus small deltas, with an <code>.idx</code> for fast lookup.`,
        `Two versions of <code>app.ts</code> that differ by one byte cost almost nothing extra once packed.`,
      ],
      changes: [`+ pack-7f8a.pack (+ .idx)`, `~ 14 MB → 1.1 MB`],
      metrics: { objects: 120, lastSha: `2b3c4d`, diskSize: `1.1 MB`, packfiles: 1 },
      scene: {
        entities: {
          blob: blob(`9e1f2a`),
          srcTree: srcTree(`3c4d5e`),
          rootTree: rootTree(`6f7a8b`),
          commit: commit(`2b3c4d`),
          tag: tag(),
          pack: pack(),
          card: card(`git gc`, [`$ git count-objects -vH`, `size: 14.0 MiB    size-pack: 0`, `$ git gc`, `Total 120 (delta 84), reused 0`, `$ git count-objects -vH`, `size: 0    size-pack: 1.1 MiB`]),
        },
        links: { name: L.name, dir: L.dir, snapshot: L.snapshot, release: L.release, packBlob: L.packBlob, packSrc: L.packSrc, packRoot: L.packRoot },
        flows: [
          { route: [`packBlob`], kind: `write`, rate: 1.2 },
          { route: [`packSrc`], kind: `write`, rate: 1.2 },
          { route: [`packRoot`], kind: `write`, rate: 1.2 },
        ],
      },
    },
  ],
};
