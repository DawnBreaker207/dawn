import { fromScreen, makeBlock, makeDb, makeDevice, makeLink, makePanel, cardAt, type Tag } from '@/lib/simulator/scene-builders';

// One fixed stage: you type commands, one plumbing process does the work, and every
// result lands in the same two places — the object store and a ref file.
//
//   you ─┐                        ┌─ .git/objects
//        │   ── git plumbing ─────┤
//   app.ts      index ─┘          └─ refs/heads/main
//
// Git colours: working tree = blue, index = orange, commit = purple, ref = yellow,
// object store = db, the git process itself = green.

const toIso = (sx: number, sy: number): [number, number] => {
  const p = fromScreen(sx, sy, 2);
  return [p.x, p.y];
};

const dev = (tags: Tag[] = []) => makeDevice(...toIso(-330, -40), { label: `you`, tags });
const file = (tags: Tag[] = []) =>
  makeBlock(...toIso(-300, 170), { s: 4.4, h: 50, color: `blue`, glyph: `file`, label: [`app.ts`], sub: `working tree`, tags });
const git = (cmd: string, tags: Tag[] = []) =>
  makeBlock(...toIso(-40, 40), { s: 4.8, h: 54, color: `green`, glyph: `cpu`, label: [`git plumbing`], sub: cmd, tags });
const objects = (tags: Tag[] = []) => makeDb(...toIso(240, -120), { r: 2.2, h: 46, glyph: `database`, label: `.git/objects`, tags });
const index = (tags: Tag[] = []) =>
  makeBlock(...toIso(-80, 230), { s: 4.4, h: 50, color: `orange`, glyph: `listChecks`, label: [`Index`], sub: `.git/index`, tags });
const ref = (tags: Tag[] = []) =>
  makeBlock(...toIso(260, 60), { s: 4.4, h: 50, color: `yellow`, glyph: `gitBranch`, label: [`main`], sub: `refs/heads`, tags });

const links = {
  edit: makeLink(`dev`, `file`, [`dev`, `file`], { label: `edit` }),
  editQuiet: makeLink(`dev`, `file`, [`dev`, `file`], { style: `off` }),
  stdin: makeLink(`file`, `git`, [`file`, `git`], { label: `bytes` }),
  write: makeLink(`git`, `objects`, [`git`, `objects`], { label: `write` }),
  read: makeLink(`objects`, `git`, [`objects`, `git`], { label: `inflate` }),
  print: makeLink(`git`, `dev`, [`git`, `dev`], { label: `stdout` }),
  readIndex: makeLink(`index`, `git`, [`index`, `git`]),
  writeQuiet: makeLink(`git`, `objects`, [`git`, `objects`]),
  setRef: makeLink(`git`, `ref`, [`git`, `ref`], { label: `update-ref` }),
};

const card = cardAt({ x: 0, y: 0, dx: -360, dy: -290 }, `keyboard`);

const obj = (text: string): Tag => ({ text, tone: `violet` });

export const gitCommandsTaxonomyLesson = {
  id: `git-commands-taxonomy`,
  title: `Git Commands: Porcelain vs Plumbing Engine`,
  summary: `Rebuild git add and git commit by hand with the plumbing commands they are made of: hash-object, cat-file, write-tree, commit-tree and update-ref.`,
  minutes: 16,
  level: `intermediate`,
  metrics: [`command`, `objects`, `main`, `layer`],
  legend: [`req`, `res`, [`write`, `object write`], [`msg`, `ref update`]],
  goals: [
    { text: `The starting point: an untracked file`, step: 1 },
    { text: `git hash-object writes a blob`, step: 2 },
    { text: `git cat-file reads any object back`, step: 3 },
    { text: `git write-tree turns the index into a tree`, step: 4 },
    { text: `git commit-tree seals tree + parent into a commit`, step: 5 },
    { text: `git update-ref moves the branch atomically`, step: 6 },
  ],
  steps: [
    {
      short: `The file`,
      chapter: `setup`,
      title: `Porcelain hides a few small tools`,
      body: [
        `Commands like <code>add</code>, <code>commit</code> and <code>checkout</code> are <span class="term">porcelain</span>: friendly front ends. Underneath, each one runs a handful of <span class="term">plumbing</span> commands that do one job each.`,
        `We’ll make a real commit using only plumbing, starting from one untracked file.`,
      ],
      metrics: { command: `—`, objects: 0, main: `—`, layer: `working tree` },
      scene: {
        entities: {
          dev: dev(),
          file: file([{ text: `untracked`, tone: `red` }]),
          card: card(`terminal`, [`$ echo "export const app = 1" > app.ts`, `$ find .git/objects -type f | wc -l`, `0`]),
        },
        links: { edit: links.edit },
        flows: [{ route: [`edit`], rate: 1 }],
      },
    },
    {
      short: `hash-object`,
      chapter: `technique`,
      title: `hash-object: bytes in, blob out`,
      body: [
        `<code>git hash-object -w</code> reads the file’s bytes, prepends a header <code>blob 21\\0</code>, hashes the result with SHA-1 and writes it zlib-compressed to <code>.git/objects/3b/18e5…</code>.`,
        `The name of the object <em>is</em> the hash of its content. Same bytes, same name — anywhere in the world.`,
      ],
      changes: [`+ git plumbing`, `+ .git/objects: blob 3b18e5`],
      metrics: { command: `hash-object`, objects: 1, main: `—`, layer: `plumbing` },
      scene: {
        entities: {
          dev: dev(),
          file: file(),
          git: git(`hash-object`),
          objects: objects([obj(`blob 3b18e5`)]),
          card: card(`hash-object`, [`$ git hash-object -w app.ts`, `3b18e512dba79e4c8300dd08aeb37f8e728b8dad`]),
        },
        links: { edit: links.editQuiet, stdin: links.stdin, write: links.write },
        flows: [
          { route: [`stdin`], rate: 1.2 },
          { route: [`write`], kind: `write`, rate: 1.2 },
        ],
      },
    },
    {
      short: `cat-file`,
      chapter: `technique`,
      title: `cat-file: read any object back`,
      body: [
        `<code>git cat-file</code> is the reverse: find the object by hash, inflate it, and print its type (<code>-t</code>), size (<code>-s</code>) or content (<code>-p</code>).`,
        `It works on every object type — blobs, trees, commits and tags — which makes it the best tool for looking inside <code>.git</code>.`,
      ],
      changes: [`~ git plumbing: cat-file`],
      metrics: { command: `cat-file`, objects: 1, main: `—`, layer: `plumbing` },
      scene: {
        entities: {
          dev: dev(),
          file: file(),
          git: git(`cat-file -p`),
          objects: objects([obj(`blob 3b18e5`)]),
          card: card(`cat-file`, [`$ git cat-file -t 3b18e5`, `blob`, `$ git cat-file -p 3b18e5`, `export const app = 1`]),
        },
        links: { edit: links.editQuiet, read: links.read, print: links.print },
        flows: [
          { route: [`read`], rate: 1.2 },
          { route: [`print`], rate: 1.2 },
        ],
      },
    },
    {
      short: `write-tree`,
      chapter: `technique`,
      title: `write-tree: the index becomes a tree`,
      body: [
        `A blob has no name. Names live in a <span class="term">tree</span>: one row per entry with mode, type, hash and filename.`,
        `<code>git update-index --add</code> records <code>app.ts → 3b18e5</code> in the index; <code>git write-tree</code> then writes that list out as a tree object.`,
      ],
      changes: [`+ index`, `+ .git/objects: tree d8329f`],
      metrics: { command: `write-tree`, objects: 2, main: `—`, layer: `plumbing` },
      scene: {
        entities: {
          dev: dev(),
          file: file(),
          git: git(`write-tree`),
          objects: objects([obj(`blob 3b18e5`), obj(`tree d8329f`)]),
          index: index([{ text: `app.ts → 3b18e5`, tone: `amber` }]),
          card: card(`write-tree`, [`$ git update-index --add app.ts`, `$ git write-tree`, `d8329fc1cc938780ffdd9f94e0d364e0ea74f579`, `$ git cat-file -p d8329f`, `100644 blob 3b18e5…    app.ts`]),
        },
        links: { edit: links.editQuiet, readIndex: links.readIndex, write: links.write },
        flows: [
          { route: [`readIndex`], rate: 1.2 },
          { route: [`write`], kind: `write`, rate: 1.2 },
        ],
      },
    },
    {
      short: `commit-tree`,
      chapter: `technique`,
      title: `commit-tree: tree + parent + message`,
      body: [
        `A tree is a snapshot without history. <code>git commit-tree d8329f -p a1b2c3</code> writes a <span class="term">commit</span> object that points to the tree, to its parent, and stamps author, time and message.`,
        `A merge commit is the same command with two <code>-p</code> flags. Notice what did <b>not</b> happen: <code>main</code> still points to the old commit.`,
      ],
      changes: [`+ .git/objects: commit 7f8a9b`, `= main unchanged`],
      metrics: { command: `commit-tree`, objects: 3, main: `a1b2c3`, layer: `plumbing` },
      scene: {
        entities: {
          dev: dev(),
          file: file(),
          git: git(`commit-tree`),
          objects: objects([obj(`tree d8329f`), obj(`commit 7f8a9b`)]),
          index: index(),
          card: card(`commit-tree`, [`$ echo "feat: add app" | git commit-tree d8329f -p a1b2c3`, `7f8a9b2c4e1a0d8e9f8a7b6c5d4e3f2a1b0c9d8e`, `$ git cat-file -p 7f8a9b`, `tree d8329fc1…`, `parent a1b2c3d4…`]),
        },
        links: { edit: links.editQuiet, readIndex: links.readIndex, write: links.write },
        flows: [{ route: [`write`], kind: `write`, rate: 1.2 }],
      },
    },
    {
      short: `update-ref`,
      chapter: `solution`,
      title: `update-ref: now the branch moves`,
      body: [
        `The last thing <code>git commit</code> does is <code>git update-ref refs/heads/main 7f8a9b a1b2c3</code>. It takes <code>main.lock</code>, checks the ref still says <code>a1b2c3</code>, writes the new hash and renames the lock over the ref — all or nothing.`,
        `A branch is just that 41-byte file. Five plumbing commands, and you have rebuilt <code>git add</code> + <code>git commit</code>.`,
      ],
      changes: [`+ refs/heads/main`, `~ main a1b2c3 → 7f8a9b`],
      metrics: { command: `update-ref`, objects: 3, main: `7f8a9b`, layer: `plumbing` },
      scene: {
        entities: {
          dev: dev(),
          file: file(),
          git: git(`update-ref`),
          objects: objects([obj(`commit 7f8a9b`)]),
          index: index(),
          ref: ref([{ text: `→ 7f8a9b`, tone: `amber`, icon: `gitCommit` }]),
          card: card(`update-ref`, [`$ git update-ref refs/heads/main 7f8a9b a1b2c3`, `$ cat .git/refs/heads/main`, `7f8a9b2c4e1a0d8e9f8a7b6c5d4e3f2a1b0c9d8e`, `$ git log --oneline -1`, `7f8a9b (HEAD -> main) feat: add app`]),
        },
        links: { edit: links.editQuiet, write: links.writeQuiet, setRef: links.setRef },
        flows: [{ route: [`setRef`], kind: `msg`, rate: 1.2 }],
      },
    },
  ],
};
