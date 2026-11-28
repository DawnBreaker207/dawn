import { fromScreen, makeBlock, makeLink, makePanel, cardAt, type Tag } from '@/lib/simulator/scene-builders';

// One diamond DAG for the whole lesson: the merge base on top, our commit on the left,
// their commit on the right. The conflicted file sits where the merge commit will land,
// and is replaced by it in the last step. Arrows point child → parent, like Git.
//
//              base 1a2b3c
//            ↗            ↖
//   ours 4d5e6f            theirs 7a8b9c
//            ↖            ↗
//         tax.ts  →  merge 9a8b7c

/** Screen position (px) → world grid coordinates. */
const toIso = (sx: number, sy: number) => fromScreen(sx, sy, 2);

const positions = { base: toIso(0, -110), ours: toIso(-210, 0), theirs: toIso(210, 0), mid: toIso(0, 120) };

const commit = (p: { x: number; y: number }, sha: string, sub: string, tags: Tag[] = [], o: Record<string, unknown> = {}) =>
  makeBlock(p.x, p.y, { s: 4.4, h: 52, color: `purple`, glyph: `gitCommit`, label: [sha], sub, tags, ...o });
const ref = (name: string): Tag => ({ text: name, tone: `amber`, icon: `gitBranch` });

const base = (tags: Tag[] = [], o: Record<string, unknown> = {}) => commit(positions.base, `1a2b3c`, `merge base`, tags, o);
const ours = (tags: Tag[] = [ref(`main · HEAD`)]) => commit(positions.ours, `4d5e6f`, `ours`, tags);
const theirs = (tags: Tag[] = [ref(`feature`)]) => commit(positions.theirs, `7a8b9c`, `theirs`, tags);
const file = (tags: Tag[]) =>
  makeBlock(positions.mid.x, positions.mid.y, { s: 4.4, h: 52, color: `blue`, glyph: `file`, label: [`tax.ts`], sub: `working tree`, tags });

const links = {
  oursParent: makeLink(`ours`, `base`, [`ours`, `base`]),
  theirsParent: makeLink(`theirs`, `base`, [`theirs`, `base`]),
  fromOurs: makeLink(`ours`, `file`, [`ours`, `file`], { label: `ours` }),
  fromTheirs: makeLink(`theirs`, `file`, [`theirs`, `file`], { label: `theirs` }),
  fromOursQuiet: makeLink(`ours`, `file`, [`ours`, `file`]),
  fromTheirsQuiet: makeLink(`theirs`, `file`, [`theirs`, `file`]),
  fromBase: makeLink(`base`, `file`, [`base`, `file`], { style: `off` }),
  parent1: makeLink(`merge`, `ours`, [`merge`, `ours`], { label: `parent 1` }),
  parent2: makeLink(`merge`, `theirs`, [`merge`, `theirs`], { label: `parent 2` }),
};

/** Terminal / file card, parked top-left in the empty corner above `ours`. */
const card = cardAt({ x: positions.ours.x, y: positions.ours.y, dx: -190, dy: -250 }, `keyboard`);

export const gitThreeWayDiff3Lesson = {
  id: `git-three-way-diff3`,
  title: `Case 3: 3-Way Merge Conflicts & Diff3 Topology`,
  summary: `Why 2-way conflict markers hide the truth, how the merge base reveals what each side meant, and merge.conflictstyle = diff3.`,
  minutes: 18,
  level: `advanced`,
  metrics: [`base`, `ours`, `theirs`, `markers`],
  legend: [`req`, [`write`, `change from a side`], [`fail`, `conflict`]],
  goals: [
    { text: `Graph of a 3-way merge: base, ours, theirs`, step: 1 },
    { text: `Why 2-way markers (<<<<<<< / >>>>>>>) mislead`, step: 2 },
    { text: `diff3 shows the base (|||||||)`, step: 3 },
    { text: `Read each side relative to the base`, step: 4 },
    { text: `Whole-file picks: --ours / --theirs`, step: 5 },
    { text: `The merge commit has two parents`, step: 6 },
  ],
  steps: [
    {
      short: `Merge base`,
      chapter: `setup`,
      title: `Git merges three commits, not two`,
      body: [
        `<code>main</code> and <code>feature</code> both grew from commit <b>1a2b3c</b>. Before merging, Git walks the DAG to find that <span class="term">merge base</span>: the newest commit both branches share.`,
        `For every line, Git compares each side with the base. If only one side changed a line, that change wins automatically. Only when <em>both</em> sides changed the same lines is there a conflict.`,
      ],
      metrics: { base: `1a2b3c`, ours: `4d5e6f`, theirs: `7a8b9c`, markers: `—` },
      scene: {
        entities: {
          base: base([{ text: `merge-base`, tone: `violet` }]),
          ours: ours(),
          theirs: theirs(),
          card: card(`terminal`, [`$ git merge-base main feature`, `1a2b3c`, `$ git merge feature`]),
        },
        links: { oursParent: links.oursParent, theirsParent: links.theirsParent },
        flows: [
          { route: [`oursParent`], rate: 0.8 },
          { route: [`theirsParent`], rate: 0.8 },
        ],
      },
    },
    {
      short: `2-way`,
      chapter: `problem`,
      title: `Default markers hide the original`,
      body: [
        `Both sides edited the same line of <code>tax.ts</code>, so Git stops and writes conflict markers into the file in your <span class="term">working tree</span>.`,
        `By default you see only <b>ours</b> and <b>theirs</b>. Did we add the discount, or did they remove it? Did they raise the rate, or did we lower it? Without the base you have to guess.`,
      ],
      changes: [`+ tax.ts with conflict markers`, `− base not shown`],
      metrics: { base: `hidden`, ours: `4d5e6f`, theirs: `7a8b9c`, markers: `merge` },
      scene: {
        entities: {
          base: base([{ text: `not shown`, tone: `gray` }], { dim: 0.7 }),
          ours: ours(),
          theirs: theirs(),
          file: file([{ text: `1 conflict`, tone: `red`, icon: `alert` }]),
          card: card(`tax.ts`, [`<<<<<<< HEAD`, `return (rate - disc) * 0.1;`, `=======`, `return rate * 0.15;`, `>>>>>>> feature`, `! which one is the change?`], `file`),
        },
        links: { oursParent: links.oursParent, theirsParent: links.theirsParent, fromOurs: links.fromOurs, fromTheirs: links.fromTheirs },
        flows: [
          { route: [`fromOurs`], kind: `fail`, rate: 1.2 },
          { route: [`fromTheirs`], kind: `fail`, rate: 1.2 },
        ],
      },
    },
    {
      short: `diff3`,
      chapter: `technique`,
      title: `diff3 adds the base to the markers`,
      body: [
        `Set <code>merge.conflictstyle</code> to <code>diff3</code> (or <code>zdiff3</code>, which also trims identical lines). Git now adds a third section, <code>||||||| base</code>, with the line as it was in the merge base.`,
        `Same conflict, but now you can see where each side started from.`,
      ],
      changes: [`~ merge.conflictstyle = diff3`, `+ base section in the markers`],
      metrics: { base: `1a2b3c`, ours: `4d5e6f`, theirs: `7a8b9c`, markers: `diff3` },
      scene: {
        entities: {
          base: base([{ text: `shown`, tone: `green` }]),
          ours: ours(),
          theirs: theirs(),
          file: file([{ text: `1 conflict`, tone: `red`, icon: `alert` }]),
          card: card(`tax.ts`, [`$ git config --global merge.conflictstyle diff3`, `<<<<<<< HEAD`, `return (rate - disc) * 0.1;`, `||||||| 1a2b3c`, `return rate * 0.1;`, `=======`, `return rate * 0.15;`, `>>>>>>> feature`], `file`),
        },
        links: { oursParent: links.oursParent, theirsParent: links.theirsParent, fromOurs: links.fromOursQuiet, fromTheirs: links.fromTheirsQuiet, fromBase: links.fromBase },
        flows: [{ route: [`fromBase`], rate: 1 }],
      },
    },
    {
      short: `Intent`,
      chapter: `insight`,
      title: `Compare each side with the base`,
      body: [
        `Ours vs base: we <b>subtracted a discount</b>. Theirs vs base: they <b>raised the rate</b> from 0.1 to 0.15. Neither side undid the other — they changed different parts of the same expression.`,
        `So the correct result keeps both: <code>(rate - disc) * 0.15</code>. Picking either side would silently drop a feature.`,
      ],
      changes: [`~ ours: added discount`, `~ theirs: rate 0.1 → 0.15`],
      metrics: { base: `1a2b3c`, ours: `+ discount`, theirs: `rate 0.15`, markers: `diff3` },
      scene: {
        entities: {
          base: base(),
          ours: ours([ref(`main · HEAD`), { text: `Δ − disc`, tone: `violet` }]),
          theirs: theirs([ref(`feature`), { text: `Δ × 0.15`, tone: `violet` }]),
          file: file([{ text: `both kept`, tone: `green`, icon: `check` }]),
          card: card(`tax.ts (resolved)`, [`function calcTax(rate, disc) {`, `  return (rate - disc) * 0.15;`, `}`, `$ git add tax.ts`], `file`),
        },
        links: { oursParent: links.oursParent, theirsParent: links.theirsParent, fromOurs: links.fromOursQuiet, fromTheirs: links.fromTheirsQuiet, fromBase: links.fromBase },
        flows: [
          { route: [`fromOurs`], kind: `write`, rate: 1 },
          { route: [`fromTheirs`], kind: `write`, rate: 1 },
        ],
      },
    },
    {
      short: `Pick a side`,
      chapter: `technique`,
      title: `Whole files: take one side`,
      body: [
        `Some files can’t be merged line by line — a lockfile, generated docs, a binary. For those, take one side wholesale with <code>git checkout --ours</code> or <code>--theirs</code>, then <code>git add</code>.`,
        `Careful during a <b>rebase</b>: there “ours” is the branch you are rebasing <em>onto</em> and “theirs” is your own commit being replayed — the names swap.`,
      ],
      changes: [`~ package-lock.json ← ours`, `~ docs/api.md ← theirs`],
      metrics: { base: `1a2b3c`, ours: `lockfile`, theirs: `api docs`, markers: `diff3` },
      scene: {
        entities: {
          base: base(),
          ours: ours([ref(`main · HEAD`), { text: `package-lock.json`, tone: `green` }]),
          theirs: theirs([ref(`feature`), { text: `docs/api.md`, tone: `green` }]),
          file: file([{ text: `all resolved`, tone: `green`, icon: `check` }]),
          card: card(`terminal`, [`$ git checkout --ours package-lock.json`, `$ git checkout --theirs docs/api.md`, `$ git add package-lock.json docs/api.md`, `# rebase: --ours = upstream, --theirs = yours`]),
        },
        links: { oursParent: links.oursParent, theirsParent: links.theirsParent, fromOurs: links.fromOurs, fromTheirs: links.fromTheirs },
        flows: [
          { route: [`fromOurs`], kind: `write`, rate: 1.1 },
          { route: [`fromTheirs`], kind: `write`, rate: 1.1 },
        ],
      },
    },
    {
      short: `Merge commit`,
      chapter: `recap`,
      title: `A commit with two parents`,
      body: [
        `<code>git commit</code> seals the merge: a new commit <b>9a8b7c</b> whose tree has both changes and which lists <b>two parents</b> — 4d5e6f and 7a8b9c.`,
        `Those two parent pointers join the histories. Next time these branches merge, Git finds a newer merge base (this commit), so the same conflict never comes back.`,
      ],
      changes: [`+ merge commit 9a8b7c`, `~ main → 9a8b7c`],
      metrics: { base: `1a2b3c`, ours: `parent 1`, theirs: `parent 2`, markers: `diff3` },
      scene: {
        entities: {
          base: base(),
          ours: ours([]),
          theirs: theirs(),
          merge: commit(positions.mid, `9a8b7c`, `2 parents`, [ref(`main · HEAD`)]),
          card: card(`terminal`, [`$ git cat-file -p 9a8b7c`, `tree   e8f2a1`, `parent 4d5e6f`, `parent 7a8b9c`, `= Merge branch 'feature'`]),
        },
        links: { oursParent: links.oursParent, theirsParent: links.theirsParent, parent1: links.parent1, parent2: links.parent2 },
        flows: [
          { route: [`parent1`], rate: 0.9 },
          { route: [`parent2`], rate: 0.9 },
        ],
      },
    },
  ],
};
