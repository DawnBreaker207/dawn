import { fromScreen, makeBlock, makeDb, makeLink, makePanel, cardAt } from '@/lib/simulator/scene-builders';

// One fixed stage: refs on the right, the commits they name on the left.
//
//   commit 3f8a12 ── main ── HEAD
//        │             │
//   commit 9c1d22   origin/main ── packed-refs
//
// Git colours: commit = purple, ref = yellow, ref storage = db.

type Tag = { text: string; tone?: string; icon?: string };

const toIso = (sx: number, sy: number): [number, number] => {
  const p = fromScreen(sx, sy, 2);
  return [p.x, p.y];
};

const head = () => makeBlock(...toIso(315, -105), { s: 4.4, h: 50, color: `yellow`, glyph: `target`, label: [`HEAD`], sub: `.git/HEAD` });
const main = (tags: Tag[] = []) =>
  makeBlock(...toIso(110, -40), { s: 4.4, h: 50, color: `yellow`, glyph: `gitBranch`, label: [`main`], sub: `refs/heads`, tags });
const origin = () =>
  makeBlock(...toIso(110, 150), { s: 4.4, h: 50, color: `yellow`, glyph: `globe`, label: [`origin/main`], sub: `refs/remotes` });
const commitA = () =>
  makeBlock(...toIso(-120, -110), { s: 4.4, h: 50, color: `purple`, glyph: `gitCommit`, label: [`3f8a12`], sub: `feat: auth` });
const commitB = () =>
  makeBlock(...toIso(-150, 90), { s: 4.4, h: 50, color: `purple`, glyph: `gitCommit`, label: [`9c1d22`], sub: `fix: login` });
const packed = () => makeDb(...toIso(300, 60), { r: 2.2, h: 46, glyph: `listOrdered`, label: `packed-refs` });

const links = {
  mainA: makeLink(`main`, `commitA`, [`main`, `commitA`], { label: `target` }),
  sym: makeLink(`head`, `main`, [`head`, `main`], { style: `dash`, label: `ref:` }),
  originA: makeLink(`origin`, `commitA`, [`origin`, `commitA`]),
  mainB: makeLink(`main`, `commitB`, [`main`, `commitB`], { label: `target` }),
  parent: makeLink(`commitB`, `commitA`, [`commitB`, `commitA`], { label: `parent` }),
  packMain: makeLink(`main`, `packed`, [`main`, `packed`]),
  packOrigin: makeLink(`origin`, `packed`, [`origin`, `packed`]),
};

const card = cardAt({ x: 0, y: 0, dx: -450, dy: 150 }, `keyboard`);

export const gitRefsSymbolicLesson = {
  id: `git-refs-symbolic`,
  title: `Git References: Symbolic Refs, Remotes & Packed-Refs`,
  summary: `What a branch, HEAD and origin/main really are on disk: 41-byte files, a symbolic pointer, read-only bookmarks, packed-refs and lockfiles.`,
  minutes: 14,
  level: `intermediate`,
  metrics: [`head`, `main`, `origin`, `looseRefs`],
  legend: [`req`, [`msg`, `ref lookup`], [`write`, `ref write`]],
  goals: [
    { text: `A branch is a 41-byte file holding a hash`, step: 1 },
    { text: `HEAD is a symbolic ref to the current branch`, step: 2 },
    { text: `Remote-tracking refs in refs/remotes/origin`, step: 3 },
    { text: `Upstream config and ahead/behind`, step: 4 },
    { text: `packed-refs: many refs in one file`, step: 5 },
    { text: `Atomic ref updates with lockfiles`, step: 6 },
  ],
  steps: [
    {
      short: `Branch`,
      chapter: `setup`,
      title: `A branch is a 41-byte file`,
      body: [
        `A branch is not a copy of your code. <code>.git/refs/heads/main</code> is a text file with one commit hash and a newline — 41 bytes.`,
        `Creating a branch writes one such file; deleting it removes the file. That is why branches are instant and free.`,
      ],
      metrics: { head: `—`, main: `3f8a12`, origin: `—`, looseRefs: 1 },
      scene: {
        entities: {
          main: main(),
          commitA: commitA(),
          card: card(`refs/heads/main`, [`$ cat .git/refs/heads/main`, `3f8a12c49b56f890e123456789abcdef01234567`, `$ wc -c .git/refs/heads/main`, `41 .git/refs/heads/main`]),
        },
        links: { mainA: links.mainA },
        flows: [{ route: [`mainA`], kind: `msg`, rate: 1.2 }],
      },
    },
    {
      short: `HEAD`,
      chapter: `technique`,
      title: `HEAD names a branch, not a commit`,
      body: [
        `<code>.git/HEAD</code> normally holds <code>ref: refs/heads/main</code> — a <span class="term">symbolic ref</span>. To find the current commit Git follows two hops: HEAD → main → 3f8a12.`,
        `When you commit, Git updates <code>main</code>, and HEAD comes along for free. Switching branch only rewrites that one line.`,
      ],
      changes: [`+ HEAD → main`],
      metrics: { head: `ref: main`, main: `3f8a12`, origin: `—`, looseRefs: 1 },
      scene: {
        entities: {
          head: head(),
          main: main(),
          commitA: commitA(),
          card: card(`.git/HEAD`, [`$ cat .git/HEAD`, `ref: refs/heads/main`, `$ git rev-parse HEAD`, `3f8a12c49b56f890e123456789abcdef01234567`]),
        },
        links: { sym: links.sym, mainA: links.mainA },
        flows: [{ route: [`sym`, `mainA`], kind: `msg`, rate: 1.2 }],
      },
    },
    {
      short: `origin/main`,
      chapter: `technique`,
      title: `origin/main is a read-only bookmark`,
      body: [
        `<code>refs/remotes/origin/main</code> records where <code>main</code> was on the server the last time you fetched or pushed.`,
        `You never commit to it. Only network operations move it — so it can be behind the real server until the next fetch.`,
      ],
      changes: [`+ origin/main → 3f8a12`],
      metrics: { head: `ref: main`, main: `3f8a12`, origin: `3f8a12`, looseRefs: 2 },
      scene: {
        entities: {
          head: head(),
          main: main(),
          origin: origin(),
          commitA: commitA(),
          card: card(`remote refs`, [`$ git branch -r`, `  origin/HEAD -> origin/main`, `  origin/main`, `$ git rev-parse --short origin/main`, `3f8a12`]),
        },
        links: { sym: links.sym, mainA: links.mainA, originA: links.originA },
        flows: [{ route: [`originA`], kind: `msg`, rate: 1 }],
      },
    },
    {
      short: `Upstream`,
      chapter: `technique`,
      title: `Upstream turns refs into “ahead 1”`,
      body: [
        `You commit <code>9c1d22</code>; <code>main</code> moves, <code>origin/main</code> does not. <code>git push -u</code> saved an <span class="term">upstream</span> for main in <code>.git/config</code>, so Git knows which two refs to compare.`,
        `“Ahead 1” is just the commits reachable from <code>main</code> but not from <code>origin/main</code>.`,
      ],
      changes: [`+ commit 9c1d22`, `~ main → 9c1d22`, `~ main: ahead 1`],
      metrics: { head: `ref: main`, main: `9c1d22`, origin: `3f8a12`, looseRefs: 2 },
      scene: {
        entities: {
          head: head(),
          main: main([{ text: `ahead 1`, tone: `amber` }]),
          origin: origin(),
          commitA: commitA(),
          commitB: commitB(),
          card: card(`upstream`, [`$ git branch -vv`, `* main 9c1d22 [origin/main: ahead 1] fix: login`, `$ git config --get-regexp '^branch\\.main'`, `branch.main.remote origin`, `branch.main.merge refs/heads/main`]),
        },
        links: { sym: links.sym, mainB: links.mainB, parent: links.parent, originA: links.originA },
        flows: [
          { route: [`mainB`, `parent`], kind: `msg`, rate: 1 },
          { route: [`originA`], kind: `msg`, rate: 1 },
        ],
      },
    },
    {
      short: `packed-refs`,
      chapter: `solution`,
      title: `Thousands of refs in one file`,
      body: [
        `A repo with 50,000 tags would mean 50,000 tiny files. <code>git pack-refs --all</code> (run by <code>git gc</code>) moves them into one sorted file, <code>.git/packed-refs</code>.`,
        `Lookups check for a loose file first and fall back to packed-refs, so a loose ref always wins.`,
      ],
      changes: [`+ packed-refs`, `− loose ref files`],
      metrics: { head: `ref: main`, main: `9c1d22`, origin: `3f8a12`, looseRefs: 0 },
      scene: {
        entities: {
          head: head(),
          main: main([{ text: `packed`, tone: `gray` }]),
          origin: origin(),
          commitA: commitA(),
          commitB: commitB(),
          packed: packed(),
          card: card(`packed-refs`, [`$ git pack-refs --all`, `$ cat .git/packed-refs`, `# pack-refs with: peeled fully-peeled sorted`, `9c1d22… refs/heads/main`, `3f8a12… refs/remotes/origin/main`]),
        },
        links: { sym: links.sym, mainB: links.mainB, parent: links.parent, originA: links.originA, packMain: links.packMain, packOrigin: links.packOrigin },
        flows: [
          { route: [`packMain`], kind: `write`, rate: 1 },
          { route: [`packOrigin`], kind: `write`, rate: 1 },
        ],
      },
    },
    {
      short: `Lockfile`,
      chapter: `insight`,
      title: `Ref updates are all-or-nothing`,
      body: [
        `To move <code>main</code>, Git creates <code>main.lock</code> exclusively, writes the new hash, flushes it, and renames the lock over <code>main</code>. A second writer finds the lock and fails instead of racing.`,
        `Readers see the old hash or the new one — never half a file. The fresh loose <code>main</code> now overrides its packed copy.`,
      ],
      changes: [`+ main.lock → rename`, `~ loose main again`],
      metrics: { head: `ref: main`, main: `9c1d22`, origin: `3f8a12`, looseRefs: 1 },
      scene: {
        entities: {
          head: head(),
          main: main([{ text: `main.lock`, tone: `red`, icon: `lock` }]),
          origin: origin(),
          commitA: commitA(),
          commitB: commitB(),
          packed: packed(),
          card: card(`update-ref`, [`$ git update-ref refs/heads/main 9c1d22 3f8a12`, `# open(main.lock, O_CREAT|O_EXCL)`, `# write + fsync, then rename(main.lock, main)`, `$ git update-ref refs/heads/main 1111111 3f8a12`, `fatal: cannot lock ref 'refs/heads/main'`]),
        },
        links: { sym: links.sym, mainB: links.mainB, parent: links.parent, originA: links.originA, packMain: links.packMain, packOrigin: links.packOrigin },
        flows: [{ route: [`mainB`], kind: `write`, rate: 1.2 }],
      },
    },
  ],
};
