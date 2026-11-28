import { fromScreen, makeBlock, makeDevice, makeLink, makePanel, cardAt, type Tag, type SceneOpts } from '@/lib/simulator/scene-builders';

// One repository on one laptop. First half: a crashed git process left `.git/index.lock`
// behind. Second half: the same working tree and index, now with a stash — which is
// really a commit whose parents are HEAD and a snapshot of the index.
//
//   IDE git ──▶ index (.git/index)            HEAD 4c2a91
//                 │                              ▲ parent
//             working tree ──stash / pop──▶ stash@{0}

/** Screen position (px) → world grid coordinates. */
const toIso = (sx: number, sy: number) => fromScreen(sx, sy, 2);
const positions = { ide: toIso(-290, -40), index: toIso(-40, -110), tree: toIso(-20, 110), head: toIso(230, -120), stash: toIso(230, 90) };

const ide = (tags: Tag[] = [], o: SceneOpts = {}) => makeDevice(positions.ide.x, positions.ide.y, { label: `IDE git`, tags, ...o });
const index = (tags: Tag[] = []) =>
  makeBlock(positions.index.x, positions.index.y, { s: 4.4, h: 52, color: `orange`, glyph: `listChecks`, label: [`index`], sub: `.git/index`, tags });
const tree = (tags: Tag[] = []) =>
  makeBlock(positions.tree.x, positions.tree.y, { s: 4.4, h: 52, color: `blue`, glyph: `file`, label: [`working`, `tree`], tags });
const head = () =>
  makeBlock(positions.head.x, positions.head.y, { s: 4.2, h: 50, color: `purple`, glyph: `gitCommit`, label: [`4c2a91`], sub: `HEAD · main`, tags: [{ text: `main`, tone: `amber`, icon: `gitBranch` }] });
const stash = (tags: Tag[] = [], o: SceneOpts = {}) =>
  makeBlock(positions.stash.x, positions.stash.y, { s: 4.4, h: 52, color: `purple`, glyph: `layers`, label: [`stash@{0}`], sub: `WIP commit`, tags, ...o });

const links = {
  lock: makeLink(`ide`, `index`, [`ide`, `index`], { label: `index.lock` }),
  lockQuiet: makeLink(`ide`, `index`, [`ide`, `index`]),
  add: makeLink(`tree`, `index`, [`tree`, `index`]),
  save: makeLink(`tree`, `stash`, [`tree`, `stash`], { label: `stash` }),
  pop: makeLink(`stash`, `tree`, [`stash`, `tree`], { label: `pop` }),
  parent: makeLink(`stash`, `head`, [`stash`, `head`]),
};

const card = cardAt({ x: positions.ide.x, y: positions.ide.y, dx: -40, dy: -250 }, `keyboard`);

export const gitIndexLockStashLesson = {
  id: `git-index-lock-stash`,
  title: `Git Index Lock, Stash & Working Tree Rescue`,
  summary: `Clear a stale .git/index.lock safely, see what a stash really is, and get your changes back with pop or apply — even when it conflicts.`,
  minutes: 14,
  level: `intermediate`,
  metrics: [`lock`, `stashes`, `tree`, `unmerged`],
  legend: [`req`, [`write`, `save / restore`], [`fail`, `blocked`]],
  goals: [
    { text: `Why Git creates index.lock`, step: 1 },
    { text: `Check no git process is still running`, step: 2 },
    { text: `Remove a stale lock safely`, step: 3 },
    { text: `A stash is a commit with two parents`, step: 4 },
    { text: `git stash pop vs git stash apply`, step: 5 },
    { text: `Stash conflicts and untracked files`, step: 6 },
  ],
  steps: [
    {
      short: `index.lock`,
      chapter: `problem`,
      title: `fatal: Unable to create index.lock`,
      body: [
        `Any command that changes the index first creates <code>.git/index.lock</code>, writes the new index into it, then renames it over <code>.git/index</code>. The lock stops two commands writing at once.`,
        `If a git process is killed mid-way — an IDE crash, a closed terminal — the lock file stays. Every later command refuses to run.`,
      ],
      metrics: { lock: `present`, stashes: 0, tree: `3 changed`, unmerged: 0 },
      scene: {
        entities: {
          ide: ide([{ text: `git commit`, tone: `gray` }]),
          index: index([{ text: `index.lock`, tone: `red`, icon: `lock` }]),
          tree: tree([{ text: `3 changed`, tone: `amber` }]),
          card: card(`terminal`, [`$ git commit -am "wip"`, `! fatal: Unable to create '.git/index.lock': File exists.`, `# Another git process seems to be running…`]),
        },
        links: { lock: links.lock, add: links.add },
        flows: [{ route: [`lock`], kind: `fail`, rate: 1.2 }],
      },
    },
    {
      short: `Check`,
      chapter: `technique`,
      title: `Is anything still running?`,
      body: [
        `The lock might be real: a background fetch, an IDE refresh or a long rebase may still be working. Deleting a live lock can corrupt the index.`,
        `Look for git processes first. If none are running, the lock is a leftover from a crash.`,
      ],
      changes: [`~ IDE git process: gone`],
      metrics: { lock: `stale`, stashes: 0, tree: `3 changed`, unmerged: 0 },
      scene: {
        entities: {
          ide: ide([{ text: `PID 4821 gone`, tone: `red` }], { dead: 1 }),
          index: index([{ text: `index.lock`, tone: `red`, icon: `lock` }]),
          tree: tree([{ text: `3 changed`, tone: `amber` }]),
          card: card(`terminal`, [`$ ps aux | grep "[g]it "`, `# (no output)`, `PS> Get-Process git -ErrorAction SilentlyContinue`, `# (no output) → the lock is stale`]),
        },
        links: { lock: links.lockQuiet, add: links.add },
        flows: [],
      },
    },
    {
      short: `Remove`,
      chapter: `solution`,
      title: `Delete the stale lock`,
      body: [
        `With no git process alive, removing the file is safe: the real index was never replaced, so it is still the last good version.`,
        `Run <code>git status</code> right after to confirm the index reads cleanly.`,
      ],
      changes: [`− .git/index.lock`],
      metrics: { lock: `none`, stashes: 0, tree: `3 changed`, unmerged: 0 },
      scene: {
        entities: {
          ide: ide([{ text: `git works again`, tone: `green` }]),
          index: index([{ text: `unlocked`, tone: `green`, icon: `check` }]),
          tree: tree([{ text: `3 changed`, tone: `amber` }]),
          card: card(`terminal`, [`$ rm -f .git/index.lock`, `$ git status --short`, ` M src/app.ts`, ` M src/api.ts`, `?? notes.md`]),
        },
        links: { lock: links.lockQuiet, add: links.add },
        flows: [{ route: [`lock`], rate: 1 }],
      },
    },
    {
      short: `Stash`,
      chapter: `technique`,
      title: `A stash is a commit in disguise`,
      body: [
        `<code>git stash push</code> saves your work as a real commit (<b>w</b>) whose first parent is HEAD and whose second parent is another commit (<b>i</b>) holding the index. Then it resets the tree to HEAD.`,
        `<code>refs/stash</code> points at it, and older stashes form a stack (<code>stash@{0}</code>, <code>stash@{1}</code>…) through the reflog.`,
      ],
      changes: [`+ HEAD 4c2a91`, `+ stash@{0}`, `~ working tree clean`],
      metrics: { lock: `none`, stashes: 1, tree: `clean`, unmerged: 0 },
      scene: {
        entities: {
          ide: ide(),
          index: index(),
          tree: tree([{ text: `clean`, tone: `green` }]),
          head: head(),
          stash: stash([{ text: `parents: HEAD + i`, tone: `violet` }]),
          card: card(`terminal`, [`$ git stash push -m "wip"`, `$ git cat-file -p stash@{0}`, `tree   7e21c4`, `parent 4c2a91   # HEAD`, `parent 9b3e70   # i: the index`, `On main: wip`]),
        },
        links: { lock: links.lockQuiet, add: links.add, save: links.save, parent: links.parent },
        flows: [{ route: [`save`], kind: `write`, rate: 1.2 }],
      },
    },
    {
      short: `pop / apply`,
      chapter: `technique`,
      title: `Getting the work back`,
      body: [
        `<code>git stash apply</code> replays the stash onto the current tree and <b>keeps</b> the entry. <code>git stash pop</code> does the same and then drops it — but only if applying succeeded.`,
        `Prefer <code>apply</code> when you want to try the changes on another branch first.`,
      ],
      changes: [`~ 3 files restored`, `− stash@{0} dropped (pop)`],
      metrics: { lock: `none`, stashes: 0, tree: `3 changed`, unmerged: 0 },
      scene: {
        entities: {
          ide: ide(),
          index: index(),
          tree: tree([{ text: `3 files back`, tone: `green`, icon: `check` }]),
          head: head(),
          stash: stash([{ text: `dropped`, tone: `gray` }], { dim: 0.7 }),
          card: card(`terminal`, [`$ git stash pop`, `On branch main`, `  modified: src/app.ts`, `= Dropped refs/stash@{0} (b51f0e…)`]),
        },
        links: { lock: links.lockQuiet, add: links.add, pop: links.pop, parent: links.parent },
        flows: [{ route: [`pop`], kind: `write`, rate: 1.2 }],
      },
    },
    {
      short: `Conflicts`,
      chapter: `recap`,
      title: `When pop conflicts — and untracked files`,
      body: [
        `If HEAD changed the same lines since you stashed, <code>pop</code> stops with a conflict like a merge. Git <b>keeps</b> the stash so nothing is lost: fix the file, <code>git add</code> it, then <code>git stash drop</code> yourself.`,
        `By default a stash skips untracked files. Use <code>git stash -u</code> to include them, or they stay behind in the tree.`,
      ],
      changes: [`− CONFLICT in app.ts`, `~ stash@{0} kept`],
      metrics: { lock: `none`, stashes: 1, tree: `conflict`, unmerged: 1 },
      scene: {
        entities: {
          ide: ide(),
          index: index([{ text: `1 unmerged`, tone: `red` }]),
          tree: tree([{ text: `CONFLICT app.ts`, tone: `red`, icon: `alert` }]),
          head: head(),
          stash: stash([{ text: `kept`, tone: `amber` }]),
          card: card(`terminal`, [`$ git stash pop`, `! CONFLICT (content): Merge conflict in src/app.ts`, `The stash entry is kept in case you need it again.`, `$ git add src/app.ts && git stash drop`, `$ git stash -u   # also stash untracked files`]),
        },
        links: { lock: links.lockQuiet, add: links.add, pop: links.pop, parent: links.parent },
        flows: [{ route: [`pop`], kind: `fail`, rate: 1 }],
      },
    },
  ],
};
