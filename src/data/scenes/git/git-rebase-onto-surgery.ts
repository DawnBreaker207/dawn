import { makeBlock, makeLink, makePanel } from '@/lib/simulator/scene-builders';

// Two commit trains on fixed rails. Top rail: main (M1, M2) — later B1', B2' are grafted
// onto its tip. Bottom rail: feat-A (A1, A2) with feat-B (B1, B2) stacked on top of it.
// Arrows point child → parent. `--onto` cuts B1..B2 off A2 and replays them onto M2.
//
//   M1 ← M2 ← B1' ← B2'          (main, then feat-B)
//    ↖
//     A1 ← A2 ← B1 ← B2           (feat-A, feat-B)

type Tag = { text: string; tone?: string; icon?: string };
type Opts = Record<string, unknown>;

const TRUNK = -9;
const SIDE = 5;
const commit = (x: number, y: number, sha: string, sub: string, tags: Tag[] = [], o: Opts = {}) =>
  makeBlock(x, y, { s: 4.2, h: 50, color: `purple`, glyph: `gitCommit`, label: [sha], sub, tags, ...o });
const ref = (name: string): Tag => ({ text: name, tone: `amber`, icon: `gitBranch` });
const dropped: Opts = { dim: 0.75 };

const M1 = (t: Tag[] = []) => commit(TRUNK, -22, `3c1d00`, `M1`, t);
const M2 = (t: Tag[] = [ref(`main`)]) => commit(TRUNK, -10, `8f2e11`, `M2`, t);
const A1 = (t: Tag[] = [], o: Opts = {}) => commit(SIDE, -18, `a1b2c3`, `A1`, t, o);
const A2 = (t: Tag[] = [ref(`feat-A`)], o: Opts = {}) => commit(SIDE, -6, `a4d5e6`, `A2`, t, o);
const B1 = (t: Tag[] = [], o: Opts = {}) => commit(SIDE, 6, `b17f20`, `B1`, t, o);
const B2 = (t: Tag[] = [ref(`feat-B`)], o: Opts = {}) => commit(SIDE, 18, `b29c31`, `B2`, t, o);
const B1n = (t: Tag[] = []) => commit(TRUNK, 4, `c5e6f7`, `B1'`, t);
const B2n = (t: Tag[] = [ref(`feat-B`)]) => commit(TRUNK, 16, `c8a9b0`, `B2'`, t);

const L = {
  m2: makeLink(`M2`, `M1`, [`M2`, `M1`]),
  a1: makeLink(`A1`, `M1`, [`A1`, `M1`]),
  a2: makeLink(`A2`, `A1`, [`A2`, `A1`]),
  b1: makeLink(`B1`, `A2`, [`B1`, `A2`]),
  b2: makeLink(`B2`, `B1`, [`B2`, `B1`]),
  b1Old: makeLink(`B1`, `A2`, [`B1`, `A2`], { style: `off` }),
  b2Old: makeLink(`B2`, `B1`, [`B2`, `B1`], { style: `off` }),
  b1n: makeLink(`B1n`, `M2`, [`B1n`, `M2`], { label: `replayed` }),
  b2n: makeLink(`B2n`, `B1n`, [`B2n`, `B1n`]),
  b1nQuiet: makeLink(`B1n`, `M2`, [`B1n`, `M2`]),
};
const sideLinks = { m2: L.m2, a1: L.a1, a2: L.a2 };

/** CLI card in the empty corner below the bottom rail. */
const card = (title: string, lines: string[], icon = `keyboard`) =>
  makePanel({ x: SIDE, y: 18, z: 0, dx: -40, dy: 70 }, title, lines, { icon });

export const gitRebaseOntoSurgeryLesson = {
  id: `git-rebase-onto-surgery`,
  title: `Case 7: Git Rebase --onto Surgery (Dependency Traps)`,
  summary: `Move a stacked branch onto main while leaving its rejected parent branch behind, with git rebase --onto.`,
  minutes: 16,
  level: `advanced`,
  metrics: [`featB`, `wouldCopy`, `main`, `featA`],
  legend: [`req`, [`write`, `replayed commit`]],
  goals: [
    { text: `The trap: feat-B stacked on feat-A`, step: 1 },
    { text: `Why plain rebase main drags feat-A along`, step: 2 },
    { text: `git rebase --onto <new> <old> <branch>`, step: 3 },
    { text: `B1 and B2 are replayed onto main`, step: 4 },
    { text: `Check the result with git log --graph`, step: 5 },
    { text: `Fast-forward main, delete feat-A`, step: 6 },
  ],
  steps: [
    {
      short: `Stacked`,
      chapter: `problem`,
      title: `feat-B was built on top of feat-A`,
      body: [
        `You branched <code>feat-B</code> from <code>feat-A</code> because you needed one of its helpers. So B1 and B2 sit on top of A1 and A2, which sit on M1.`,
        `In Git a branch is just a pointer to its newest commit. Everything reachable behind <code>feat-B</code> — B2, B1, A2, A1, M1 — is “in” feat-B.`,
      ],
      metrics: { featB: `B2 on A2`, wouldCopy: `—`, main: `M1`, featA: `in review` },
      scene: {
        entities: {
          M1: M1([ref(`main`)]),
          A1: A1(),
          A2: A2(),
          B1: B1(),
          B2: B2(),
          card: card(`terminal`, [`$ git log --oneline --graph --all`, `* b29c31 (feat-B) B2`, `* b17f20 B1`, `* a4d5e6 (feat-A) A2`, `* a1b2c3 A1`, `* 3c1d00 (main) M1`]),
        },
        links: { a1: L.a1, a2: L.a2, b1: L.b1, b2: L.b2 },
        flows: [{ route: [`b2`, `b1`, `a2`, `a1`], rate: 0.7 }],
      },
    },
    {
      short: `The trap`,
      chapter: `problem`,
      title: `feat-A is rejected — plain rebase drags it in`,
      body: [
        `Review rejects <code>feat-A</code>, and <code>main</code> moves on to M2. You want feat-B on top of M2 — without A1 and A2.`,
        `<code>git rebase main</code> replays every commit on feat-B that is not on main: that is A1, A2, B1 <em>and</em> B2. The rejected work comes straight back.`,
      ],
      changes: [`+ M2 on main`, `− feat-A rejected`],
      metrics: { featB: `B2 on A2`, wouldCopy: `A1 A2 B1 B2`, main: `M2`, featA: `rejected` },
      scene: {
        entities: {
          M1: M1(),
          M2: M2(),
          A1: A1([{ text: `rejected`, tone: `red` }], dropped),
          A2: A2([ref(`feat-A`), { text: `rejected`, tone: `red` }], dropped),
          B1: B1(),
          B2: B2(),
          card: card(`terminal`, [`$ git log --oneline main..feat-B`, `b29c31 B2`, `b17f20 B1`, `! a4d5e6 A2`, `! a1b2c3 A1`, `# git rebase main would copy all four`], `alertTriangle`),
        },
        links: { ...sideLinks, b1: L.b1, b2: L.b2 },
        flows: [{ route: [`b2`, `b1`, `a2`, `a1`], kind: `fail`, rate: 0.8 }],
      },
    },
    {
      short: `--onto`,
      chapter: `technique`,
      title: `Say exactly where to cut`,
      body: [
        `<code>git rebase --onto main feat-A feat-B</code> reads as: take the commits in <code>feat-A..feat-B</code> (reachable from feat-B but not from feat-A) and replay them <b>onto</b> main.`,
        `That range is just B1 and B2. A1 and A2 are below the cut, so they stay where they are.`,
      ],
      changes: [`~ range feat-A..feat-B = B1, B2`],
      metrics: { featB: `B2 on A2`, wouldCopy: `B1 B2`, main: `M2`, featA: `rejected` },
      scene: {
        entities: {
          M1: M1(),
          M2: M2([ref(`main`), { text: `new base`, tone: `violet` }]),
          A1: A1([], dropped),
          A2: A2([ref(`feat-A`), { text: `cut here`, tone: `amber`, icon: `alert` }], dropped),
          B1: B1([{ text: `to move`, tone: `violet` }]),
          B2: B2([ref(`feat-B`), { text: `to move`, tone: `violet` }]),
          card: card(`terminal`, [`$ git rebase --onto main feat-A feat-B`, `#              new base  old base  branch`, `# replays: feat-A..feat-B = B1, B2`]),
        },
        links: { ...sideLinks, b1: L.b1, b2: L.b2 },
        flows: [{ route: [`b2`, `b1`], rate: 1 }],
      },
    },
    {
      short: `Replay`,
      chapter: `solution`,
      title: `B1 and B2 are copied onto M2`,
      body: [
        `Git replays each commit’s change onto M2. The copies get <b>new hashes</b> — B1' and B2' — because their parent changed. Then the <code>feat-B</code> pointer moves to B2'.`,
        `The old B1 and B2 are untouched; they’re simply no longer on any branch.`,
      ],
      changes: [`+ B1' c5e6f7, B2' c8a9b0`, `~ feat-B → B2'`],
      metrics: { featB: `B2' on M2`, wouldCopy: `done`, main: `M2`, featA: `rejected` },
      scene: {
        entities: {
          M1: M1(),
          M2: M2(),
          A1: A1([], dropped),
          A2: A2([ref(`feat-A`)], dropped),
          B1: B1([{ text: `old`, tone: `gray` }], dropped),
          B2: B2([{ text: `old`, tone: `gray` }], dropped),
          B1n: B1n(),
          B2n: B2n(),
          card: card(`terminal`, [`$ git rebase --onto main feat-A feat-B`, `= Successfully rebased and updated refs/heads/feat-B.`]),
        },
        links: { ...sideLinks, b1: L.b1Old, b2: L.b2Old, b1n: L.b1n, b2n: L.b2n },
        flows: [
          { route: [`b1n`], kind: `write`, rate: 1 },
          { route: [`b2n`], kind: `write`, rate: 1 },
        ],
      },
    },
    {
      short: `Verify`,
      chapter: `technique`,
      title: `Check the new history`,
      body: [
        `<code>git log --graph main..feat-B</code> should now list exactly two commits, sitting right on top of main. No A1, no A2.`,
        `The old B1 and B2 are unreachable; Git garbage-collects them later. Until then <code>git reflog</code> can still bring them back if something went wrong.`,
      ],
      changes: [`− old B1, B2 (unreachable)`],
      metrics: { featB: `B2' on M2`, wouldCopy: `—`, main: `M2`, featA: `rejected` },
      scene: {
        entities: {
          M1: M1(),
          M2: M2(),
          A1: A1([], dropped),
          A2: A2([ref(`feat-A`)], dropped),
          B1n: B1n(),
          B2n: B2n([ref(`feat-B`), { text: `2 commits ahead`, tone: `green` }]),
          card: card(`terminal`, [`$ git log --oneline --graph main..feat-B`, `* c8a9b0 (feat-B) B2'`, `* c5e6f7 B1'`, `= only B1', B2' — feat-A is gone`]),
        },
        links: { ...sideLinks, b1n: L.b1nQuiet, b2n: L.b2n },
        flows: [{ route: [`b2n`, `b1n`, `m2`], rate: 0.8 }],
      },
    },
    {
      short: `Fast-forward`,
      chapter: `recap`,
      title: `Fast-forward main, delete feat-A`,
      body: [
        `Because B2' sits directly on main’s tip, merging is a <span class="term">fast-forward</span>: the <code>main</code> pointer just slides to B2'. No merge commit.`,
        `Deleting <code>feat-A</code> removes its pointer; A1 and A2 become unreachable too. History reads M1 → M2 → B1' → B2'.`,
      ],
      changes: [`~ main → B2'`, `− feat-A deleted`],
      metrics: { featB: `merged`, wouldCopy: `—`, main: `B2'`, featA: `deleted` },
      scene: {
        entities: {
          M1: M1(),
          M2: M2([]),
          B1n: B1n(),
          B2n: B2n([ref(`main · feat-B`)]),
          card: card(`terminal`, [`$ git switch main`, `$ git merge --ff-only feat-B`, `Fast-forward  8f2e11..c8a9b0`, `$ git branch -D feat-A`]),
        },
        links: { m2: L.m2, b1n: L.b1nQuiet, b2n: L.b2n },
        flows: [{ route: [`b2n`, `b1n`, `m2`], rate: 0.8 }],
      },
    },
  ],
};
