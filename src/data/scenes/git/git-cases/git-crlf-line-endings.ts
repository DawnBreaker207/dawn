import { fromScreen, makeBlock, makeDb, makeLink, makePanel, cardAt, type Tag } from '@/lib/simulator/scene-builders';

// A line-ending pipeline: Windows working tree → index (where git add converts) →
// object store → Linux working tree. The fix lives in the middle of the pipe
// (.gitattributes), not in each developer's machine.
//
//   Windows tree ──git add──▶ index ──commit──▶ objects ──checkout──▶ Linux tree
//                               ▲
//                           pre-commit

/** Screen position (px) → world grid coordinates. */
const toIso = (sx: number, sy: number) => fromScreen(sx, sy, 2);
const positions = { win: toIso(-280, -50), index: toIso(-40, 40), store: toIso(180, -110), linux: toIso(240, 100), hook: toIso(-130, 240) };

const tree = (p: { x: number; y: number }, os: string, tags: Tag[]) =>
  makeBlock(p.x, p.y, { s: 4.4, h: 52, color: `blue`, glyph: `file`, label: [os], sub: `working tree`, tags });
const win = (tags: Tag[]) => tree(positions.win, `Windows`, tags);
const linux = (tags: Tag[]) => tree(positions.linux, `Linux`, tags);
const index = (tags: Tag[] = []) =>
  makeBlock(positions.index.x, positions.index.y, { s: 4.4, h: 52, color: `orange`, glyph: `listChecks`, label: [`index`], sub: `normalizes`, tags });
const store = (tags: Tag[] = []) => makeDb(positions.store.x, positions.store.y, { r: 2.2, h: 46, glyph: `database`, label: `.git/objects`, tags });
const hook = () => makeBlock(positions.hook.x, positions.hook.y, { s: 4.2, h: 50, color: `slab`, glyph: `shield`, label: [`pre-commit`], sub: `hook` });

const links = {
  add: makeLink(`win`, `index`, [`win`, `index`], { label: `git add` }),
  addQuiet: makeLink(`win`, `index`, [`win`, `index`]),
  commit: makeLink(`index`, `store`, [`index`, `store`], { label: `commit` }),
  commitQuiet: makeLink(`index`, `store`, [`index`, `store`]),
  checkout: makeLink(`store`, `linux`, [`store`, `linux`], { label: `checkout` }),
  checkoutQuiet: makeLink(`store`, `linux`, [`store`, `linux`]),
  guard: makeLink(`hook`, `index`, [`hook`, `index`], { label: `check` }),
};

const card = cardAt({ x: positions.win.x, y: positions.win.y, dx: -40, dy: -250 }, `keyboard`);

export const gitCrlfLineEndingsLesson = {
  id: `git-crlf-line-endings`,
  title: `CRLF vs LF Line Endings: The 10,000 File Diff Disaster`,
  summary: `Stop line-ending churn for good: a repo-level .gitattributes, git add --renormalize, a pre-commit guard and .git-blame-ignore-revs.`,
  minutes: 14,
  level: `intermediate`,
  metrics: [`modified`, `crlfBlobs`, `rule`, `blame`],
  legend: [`req`, [`write`, `normalized write`], [`fail`, `CRLF leak`]],
  goals: [
    { text: `Why 10,000 files show as modified`, step: 1 },
    { text: `Why core.autocrlf is not enough`, step: 2 },
    { text: `.gitattributes: one rule for the repo`, step: 3 },
    { text: `git add --renormalize . fixes history`, step: 4 },
    { text: `A pre-commit hook blocks new CRLF`, step: 5 },
    { text: `Keep git blame clean with ignore-revs`, step: 6 },
  ],
  steps: [
    {
      short: `10k diff`,
      chapter: `problem`,
      title: `Every file shows as modified`,
      body: [
        `Windows ends lines with <code>CR LF</code>, Linux and macOS with <code>LF</code>. A Windows editor (or a formatter) rewrites the endings, and <code>git status</code> suddenly lists every file.`,
        `Nothing visible changed — the diff is a hidden <code>^M</code> on each line. The real change you made is buried in 10,000 noise files.`,
      ],
      metrics: { modified: `10,000`, crlfBlobs: 0, rule: `none`, blame: `clean` },
      scene: {
        entities: {
          win: win([{ text: `10,000 modified`, tone: `red`, icon: `alert` }]),
          index: index(),
          store: store([{ text: `LF blobs`, tone: `green` }]),
          card: card(`terminal`, [`$ git status --short | wc -l`, `10000`, `$ git diff src/app.ts`, `-const port = 3000;`, `! +const port = 3000;^M`]),
        },
        links: { add: links.add, commit: links.commit },
        flows: [{ route: [`add`], kind: `fail`, rate: 1.4 }],
      },
    },
    {
      short: `autocrlf`,
      chapter: `problem`,
      title: `core.autocrlf lives on each laptop`,
      body: [
        `<code>core.autocrlf</code> can convert endings, but it is a <b>local</b> setting. Each clone decides for itself, and the repository can’t enforce it.`,
        `One teammate without it commits CRLF files. Now the repo itself contains mixed endings, and the next Linux checkout gets them too.`,
      ],
      changes: [`+ Linux checkout`, `− 214 CRLF blobs committed`],
      metrics: { modified: `10,000`, crlfBlobs: 214, rule: `per laptop`, blame: `clean` },
      scene: {
        entities: {
          win: win([{ text: `autocrlf = true`, tone: `amber` }]),
          index: index(),
          store: store([{ text: `214 CRLF blobs`, tone: `red`, icon: `alert` }]),
          linux: linux([{ text: `autocrlf unset`, tone: `amber` }]),
          card: card(`terminal`, [`# on the Windows laptop`, `$ git config core.autocrlf`, `true`, `# on the Linux laptop`, `$ git config core.autocrlf`, `! (unset)`]),
        },
        links: { add: links.addQuiet, commit: links.commit, checkout: links.checkout },
        flows: [
          { route: [`commit`], kind: `fail`, rate: 1 },
          { route: [`checkout`], kind: `fail`, rate: 1 },
        ],
      },
    },
    {
      short: `.gitattributes`,
      chapter: `solution`,
      title: `Put the rule in the repository`,
      body: [
        `A committed <code>.gitattributes</code> travels with the repo, so every clone follows it. <code>* text=auto eol=lf</code> tells Git: store text files with LF, and check them out with LF.`,
        `The conversion happens at the <span class="term">index</span>: on <code>git add</code>, text is normalized before it becomes a blob. Binary files are left alone.`,
      ],
      changes: [`+ .gitattributes committed`],
      metrics: { modified: `10,000`, crlfBlobs: 214, rule: `.gitattributes`, blame: `clean` },
      scene: {
        entities: {
          win: win([{ text: `editor: CRLF`, tone: `amber` }]),
          index: index([{ text: `* text=auto eol=lf`, tone: `violet` }]),
          store: store([{ text: `214 CRLF blobs`, tone: `red`, icon: `alert` }]),
          linux: linux([{ text: `gets LF`, tone: `green` }]),
          card: card(`.gitattributes`, [`$ cat .gitattributes`, `* text=auto eol=lf`, `*.bat  text eol=crlf`, `*.png  binary`], `file`),
        },
        links: { add: links.add, commit: links.commitQuiet, checkout: links.checkoutQuiet },
        flows: [{ route: [`add`], kind: `write`, rate: 1.2 }],
      },
    },
    {
      short: `Renormalize`,
      chapter: `technique`,
      title: `Fix what is already committed`,
      body: [
        `The rule only applies to new adds. The 214 CRLF blobs already in history stay until you re-add them: <code>git add --renormalize .</code> passes every tracked file through the rule again.`,
        `Commit the result as one dedicated “normalize line endings” commit — nothing else in it.`,
      ],
      changes: [`+ commit 5e1f00 · 214 files`, `~ store: LF only`],
      metrics: { modified: 0, crlfBlobs: 0, rule: `.gitattributes`, blame: `214 files touched` },
      scene: {
        entities: {
          win: win([{ text: `0 modified`, tone: `green`, icon: `check` }]),
          index: index([{ text: `* text=auto eol=lf`, tone: `violet` }]),
          store: store([{ text: `all LF`, tone: `green`, icon: `check` }]),
          linux: linux([{ text: `gets LF`, tone: `green` }]),
          card: card(`terminal`, [`$ git add --renormalize .`, `$ git commit -m "Normalize line endings"`, `[main 5e1f00] Normalize line endings`, `= 214 files changed`]),
        },
        links: { add: links.addQuiet, commit: links.commit, checkout: links.checkoutQuiet },
        flows: [{ route: [`commit`], kind: `write`, rate: 1.4 }],
      },
    },
    {
      short: `Guard`,
      chapter: `solution`,
      title: `Block CRLF before it lands`,
      body: [
        `A <span class="term">pre-commit</span> hook checks staged files and refuses the commit if any still has CRLF where the rule says LF — on every laptop and again in CI.`,
        `<code>git ls-files --eol</code> shows the ending of each file in the index (<code>i/</code>) and in the working tree (<code>w/</code>).`,
      ],
      changes: [`+ pre-commit hook`],
      metrics: { modified: 0, crlfBlobs: 0, rule: `rule + hook`, blame: `214 files touched` },
      scene: {
        entities: {
          win: win([{ text: `0 modified`, tone: `green`, icon: `check` }]),
          index: index([{ text: `* text=auto eol=lf`, tone: `violet` }]),
          store: store([{ text: `all LF`, tone: `green`, icon: `check` }]),
          linux: linux([{ text: `gets LF`, tone: `green` }]),
          hook: hook(),
          card: card(`terminal`, [`$ git ls-files --eol | grep "i/crlf"`, `# (no output: no CRLF in the index)`, `# .pre-commit-config.yaml`, `- id: mixed-line-ending`, `  args: [--fix=lf]`]),
        },
        links: { add: links.addQuiet, commit: links.commitQuiet, checkout: links.checkoutQuiet, guard: links.guard },
        flows: [{ route: [`guard`], kind: `ping`, rate: 1 }],
      },
    },
    {
      short: `Blame`,
      chapter: `recap`,
      title: `Keep git blame useful`,
      body: [
        `The normalize commit touched 214 files, so <code>git blame</code> would now credit every line to it. List that commit in <code>.git-blame-ignore-revs</code> and blame skips it, showing the real author again.`,
        `GitHub and GitLab read the same file automatically; locally, point <code>blame.ignoreRevsFile</code> at it.`,
      ],
      changes: [`+ .git-blame-ignore-revs`],
      metrics: { modified: 0, crlfBlobs: 0, rule: `rule + hook`, blame: `clean` },
      scene: {
        entities: {
          win: win([{ text: `0 modified`, tone: `green`, icon: `check` }]),
          index: index([{ text: `* text=auto eol=lf`, tone: `violet` }]),
          store: store([{ text: `blame skips 5e1f00`, tone: `green` }]),
          linux: linux([{ text: `gets LF`, tone: `green` }]),
          hook: hook(),
          card: card(`.git-blame-ignore-revs`, [`# Normalize line endings`, `5e1f00a3c9d27b4e8f106a1d2c3b4a5968e7f0d1`, `$ git config blame.ignoreRevsFile .git-blame-ignore-revs`], `file`),
        },
        links: { add: links.addQuiet, commit: links.commitQuiet, checkout: links.checkout, guard: links.guard },
        flows: [
          { route: [`checkout`], rate: 1 },
          { route: [`guard`], kind: `ping`, rate: 0.6 },
        ],
      },
    },
  ],
};
