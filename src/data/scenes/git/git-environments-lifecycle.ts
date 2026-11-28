import { fromScreen, makeBlock, makeDb, makeLink, makePanel, cardAt } from '@/lib/simulator/scene-builders';

// One fixed stage: the four places a change lives, left to right.
//
//   working tree ─┐            ┌─ .git/objects ─┐
//                 └── index ───┘                └── origin
//
// Git colours (shared by every git lesson): working tree = blue, index = orange,
// commit = purple, ref/branch = yellow (amber tags), object store = db, remote = slab.

type Tag = { text: string; tone?: string; icon?: string };

/** Screen-space placement (px from stage centre) → world (x, y). */
const toIso = (sx: number, sy: number): [number, number] => {
  const p = fromScreen(sx, sy, 2);
  return [p.x, p.y];
};

const worktree = (tags: Tag[] = []) =>
  makeBlock(...toIso(-300, -20), { s: 4.4, h: 50, color: `blue`, glyph: `file`, label: [`Working tree`], sub: `src/app.ts`, tags });
const idx = (tags: Tag[] = []) =>
  makeBlock(...toIso(-100, 60), { s: 4.4, h: 50, color: `orange`, glyph: `listChecks`, label: [`Index`], sub: `.git/index`, tags });
const repo = (tags: Tag[] = []) => makeDb(...toIso(100, -20), { r: 2.2, h: 46, glyph: `database`, label: `.git/objects`, tags });
const origin = (tags: Tag[] = []) =>
  makeBlock(...toIso(300, 60), { s: 4.4, h: 50, color: `slab`, glyph: `globe`, label: [`origin`], sub: `github.com`, tags });

const links = {
  add: makeLink(`wt`, `idx`, [`wt`, `idx`], { label: `git add` }),
  addQuiet: makeLink(`wt`, `idx`, [`wt`, `idx`], { heads: `both`, style: `off` }),
  blob: makeLink(`idx`, `repo`, [`idx`, `repo`], { label: `blob` }),
  commit: makeLink(`idx`, `repo`, [`idx`, `repo`], { label: `commit` }),
  commitQuiet: makeLink(`idx`, `repo`, [`idx`, `repo`], { heads: `both`, style: `off` }),
  push: makeLink(`repo`, `origin`, [`repo`, `origin`], { label: `push` }),
  fetch: makeLink(`origin`, `repo`, [`origin`, `repo`], { label: `fetch` }),
  sync: makeLink(`origin`, `repo`, [`origin`, `repo`], { heads: `both` }),
};

const card = cardAt({ x: 0, y: 0, dx: -440, dy: 120 }, `keyboard`);

const ref = (text: string, tone = `amber`): Tag => ({ text, tone, icon: `gitBranch` });

export const gitEnvironmentsLifecycleLesson = {
  id: `git-environments-lifecycle`,
  title: `Git Environments: Working Directory, Index & Object Store`,
  summary: `Follow one edit from your disk through the index and a commit, then out to a remote and back.`,
  minutes: 14,
  level: `beginner`,
  metrics: [`untracked`, `staged`, `commits`, `vsOrigin`],
  legend: [`req`, `res`, [`write`, `object write`], [`heavy`, `packfile`]],
  goals: [
    { text: `The working directory: untracked and modified files`, step: 1 },
    { text: `The index: choosing what goes into the next commit`, step: 2 },
    { text: `The local repository: sealing a commit`, step: 3 },
    { text: `git push: sending objects and moving the remote branch`, step: 4 },
    { text: `git fetch: updating origin/main without touching your files`, step: 5 },
    { text: `git pull: fetch, then fast-forward or merge`, step: 6 },
  ],
  steps: [
    {
      short: `Working tree`,
      chapter: `setup`,
      title: `It starts as a file on disk`,
      body: [
        `The <span class="term">working tree</span> is just your project folder. You create <code>src/app.ts</code> and Git notices it — but only as <b>untracked</b>.`,
        `Nothing has been copied into <code>.git/</code> yet. Git stores nothing until you ask it to.`,
      ],
      metrics: { untracked: 1, staged: 0, commits: 0, vsOrigin: `—` },
      scene: {
        entities: {
          wt: worktree([{ text: `?? untracked`, tone: `red` }]),
          card: card(`terminal`, [`$ echo "export const app = 1" > src/app.ts`, `$ git status -s`, `?? src/app.ts`]),
        },
        links: {},
        flows: [],
      },
    },
    {
      short: `git add`,
      chapter: `technique`,
      title: `git add copies the content into Git`,
      body: [
        `<code>git add</code> hashes the file, writes its bytes as a <span class="term">blob</span> into <code>.git/objects</code>, and records “path → blob hash” in the <span class="term">index</span>.`,
        `The index is the draft of your next commit. Edit the file again and the index still holds the version you added.`,
      ],
      changes: [`+ index`, `+ .git/objects (blob 4b825d)`],
      metrics: { untracked: 0, staged: 1, commits: 0, vsOrigin: `—` },
      scene: {
        entities: {
          wt: worktree(),
          idx: idx([{ text: `staged: app.ts`, tone: `green` }]),
          repo: repo([{ text: `blob 4b825d`, tone: `violet` }]),
          card: card(`git add`, [`$ git add src/app.ts`, `$ git ls-files --stage`, `100644 4b825dc6… 0  src/app.ts`]),
        },
        links: { add: links.add, blob: links.blob },
        flows: [
          { route: [`add`], rate: 1.2 },
          { route: [`blob`], kind: `write`, rate: 1 },
        ],
      },
    },
    {
      short: `Commit`,
      chapter: `solution`,
      title: `git commit seals a snapshot`,
      body: [
        `<code>git commit</code> turns the index into a tree, writes a <span class="term">commit</span> object that points to it (plus author, time and parent), and moves <code>main</code> to the new commit.`,
        `All of this is local. You can commit a hundred times on a plane with no network.`,
      ],
      changes: [`+ commit c4f1a2`, `~ main → c4f1a2`],
      metrics: { untracked: 0, staged: 0, commits: 1, vsOrigin: `—` },
      scene: {
        entities: {
          wt: worktree(),
          idx: idx([{ text: `clean`, tone: `gray` }]),
          repo: repo([ref(`main → c4f1a2`)]),
          card: card(`git commit`, [`$ git commit -m "feat: add app"`, `[main c4f1a2] feat: add app`, ` 1 file changed, 1 insertion(+)`]),
        },
        links: { add: links.addQuiet, commit: links.commit },
        flows: [{ route: [`commit`], kind: `write`, rate: 1.2 }],
      },
    },
    {
      short: `Push`,
      chapter: `technique`,
      title: `git push sends the missing objects`,
      body: [
        `<code>git push origin main</code> asks the remote which objects it already has, packs only the missing ones into a <span class="term">packfile</span>, and sends it.`,
        `Then the remote moves its own <code>main</code> to <code>c4f1a2</code>, and your <code>origin/main</code> bookmark follows.`,
      ],
      changes: [`+ origin`, `~ origin main → c4f1a2`],
      metrics: { untracked: 0, staged: 0, commits: 1, vsOrigin: `in sync` },
      scene: {
        entities: {
          wt: worktree(),
          idx: idx(),
          repo: repo([ref(`main → c4f1a2`)]),
          origin: origin([ref(`main → c4f1a2`)]),
          card: card(`git push`, [`$ git push origin main`, `Writing objects: 100% (3/3), 382 bytes`, `   e8d9c2..c4f1a2  main -> main`]),
        },
        links: { add: links.addQuiet, commit: links.commitQuiet, push: links.push },
        flows: [{ route: [`push`], kind: `heavy`, rate: 0.9 }],
      },
    },
    {
      short: `Fetch`,
      chapter: `insight`,
      title: `git fetch only updates the bookmark`,
      body: [
        `Teammates pushed 3 commits. <code>git fetch</code> downloads their objects and moves <code>origin/main</code> to <code>9f8a7b</code>.`,
        `Your own <code>main</code>, your index and your files are untouched. That is why fetch is always safe to run.`,
      ],
      changes: [`~ origin/main → 9f8a7b`, `= main still c4f1a2`],
      metrics: { untracked: 0, staged: 0, commits: 1, vsOrigin: `behind 3` },
      scene: {
        entities: {
          wt: worktree(),
          idx: idx(),
          repo: repo([ref(`main → c4f1a2`), ref(`origin/main → 9f8a7b`, `violet`)]),
          origin: origin([ref(`main → 9f8a7b`)]),
          card: card(`git fetch`, [`$ git fetch origin`, `   c4f1a2..9f8a7b  main -> origin/main`, `$ git status -sb`, `## main...origin/main [behind 3]`]),
        },
        links: { add: links.addQuiet, commit: links.commitQuiet, fetch: links.fetch },
        flows: [{ route: [`fetch`], kind: `heavy`, rate: 0.9 }],
      },
    },
    {
      short: `Pull`,
      chapter: `solution`,
      title: `git pull = fetch + merge`,
      body: [
        `<code>git pull</code> runs a fetch, then merges <code>origin/main</code> into <code>main</code>. You have no new commits of your own, so Git just <span class="term">fast-forwards</span>: it slides <code>main</code> up to <code>9f8a7b</code> and checks the new files out.`,
        `If both sides had new commits, Git would create a merge commit instead. <code>git pull --ff-only</code> refuses that and keeps history linear.`,
      ],
      changes: [`~ main → 9f8a7b (fast-forward)`, `~ working tree updated`],
      metrics: { untracked: 0, staged: 0, commits: 4, vsOrigin: `in sync` },
      scene: {
        entities: {
          wt: worktree([{ text: `updated`, tone: `green` }]),
          idx: idx(),
          repo: repo([ref(`main → 9f8a7b`)]),
          origin: origin([ref(`main → 9f8a7b`)]),
          card: card(`git pull`, [`$ git pull --ff-only`, `Updating c4f1a2..9f8a7b`, `Fast-forward`, ` src/app.ts | 42 +++++++++`]),
        },
        links: { add: links.addQuiet, commit: links.commitQuiet, sync: links.sync },
        flows: [
          { route: [`sync`], kind: `heavy`, rate: 0.7 },
          { route: [`commit`], rate: 0.8, bounce: true },
          { route: [`add`], rate: 0.8, bounce: true },
        ],
      },
    },
  ],
};
