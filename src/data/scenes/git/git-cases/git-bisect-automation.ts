import { makeBlock, makeLink, makePanel, makeZone, cardAt, type Tag } from '@/lib/simulator/scene-builders';
import type { LinkSpec } from '@/lib/simulator/stage/types';

// One rail of history from v2.3.0 (good) to HEAD (bad), 1,024 commits apart. A single
// "probe" commit slides along the rail as bisect halves the range; the dashed zone is
// the range still in doubt. A test runner joins to automate the checks.
//
//   v2.3.0 ─── … ─── probe ─── … ─── HEAD          test.sh ──▶ probe

const RAIL = -2;
const GOOD_Y = -12;
const BAD_Y = 12;
/** Commit number (0…1024 after v2.3.0) → position on the rail. */
const yOf = (n: number) => +(GOOD_Y + ((BAD_Y - GOOD_Y) * n) / 1024).toFixed(2);

const commit = (y: number, sha: string, sub: string, tags: Tag[]) =>
  makeBlock(RAIL, y, { s: 4.2, h: 50, color: `purple`, glyph: `gitCommit`, label: [sha], sub, tags });
const good = () => commit(GOOD_Y, `1f0a2b`, `v2.3.0`, [{ text: `good`, tone: `green`, icon: `check` }]);
const bad = (tags: Tag[] = [{ text: `HEAD · bad`, tone: `red`, icon: `alert` }]) => commit(BAD_Y, `9c8d7e`, `#1024`, tags);
const probe = (n: number, sha: string, tags: Tag[]) => commit(yOf(n), sha, `#${n}`, tags);
const runner = () => makeBlock(12, -6, { s: 4.2, h: 50, color: `slab`, glyph: `flask`, label: [`test.sh`], sub: `exit 0 / 1` });
const revert = () =>
  makeBlock(15, 6, { s: 4.2, h: 50, color: `purple`, glyph: `undo`, label: [`0f1e2d`], sub: `revert`, tags: [{ text: `main · HEAD`, tone: `amber`, icon: `gitBranch` }] });
/** Range still in doubt, hugging the rail. */
const range = (from: number, to: number) => makeZone({ x0: RAIL - 3, x1: RAIL + 3, y0: yOf(from) - 1.5, y1: yOf(to) + 1.5 }, ``);

const links = {
  upper: makeLink(`bad`, `probe`, [`bad`, `probe`], { style: `off` }),
  lower: makeLink(`probe`, `good`, [`probe`, `good`], { style: `off` }),
  // Invisible rail from HEAD to v2.3.0 that only carries the packets; it has no end node so that the
  // 24-unit rail (so the 768th commit stays clear of HEAD) is not measured as one long node link.
  whole: { from: `bad`, pts: [`bad`, `good`], heads: `end`, style: `off` } as LinkSpec, // same shape makeLink returns, minus the end node
  test: makeLink(`runner`, `probe`, [`runner`, `probe`]),
  revertParent: makeLink(`revert`, `bad`, [`revert`, `bad`], { label: `parent` }),
};

const card = cardAt({ x: RAIL, y: GOOD_Y, dx: -60, dy: 70 }, `keyboard`);

export const gitBisectAutomationLesson = {
  id: `git-bisect-automation`,
  title: `Git Bisect: Automated Binary Search Regression Hunting`,
  summary: `Find the commit that broke things among a thousand with git bisect — halving the range each time, then letting a script do the testing.`,
  minutes: 14,
  level: `advanced`,
  metrics: [`range`, `testsLeft`, `testing`, `culprit`],
  legend: [`req`, [`fail`, `test fails`], [`write`, `new commit`]],
  goals: [
    { text: `1,024 commits: one by one vs halving`, step: 1 },
    { text: `Binary search: log₂ 1024 = 10 tests`, step: 2 },
    { text: `Start: mark one good and one bad commit`, step: 3 },
    { text: `git bisect run <script> automates it`, step: 4 },
    { text: `Git names the first bad commit`, step: 5 },
    { text: `Reset bisect and revert the culprit`, step: 6 },
  ],
  steps: [
    {
      short: `1,024 commits`,
      chapter: `problem`,
      title: `It worked in v2.3.0. It’s broken now.`,
      body: [
        `Checkout totals are wrong on <code>main</code>. They were right at tag <b>v2.3.0</b>, and 1,024 commits have landed since.`,
        `Testing them one by one could take a thousand builds. But history is ordered, and the bug appeared once — which is exactly what binary search needs.`,
      ],
      metrics: { range: 1024, testsLeft: `≤ 1024`, testing: `—`, culprit: `?` },
      scene: {
        entities: {
          range: range(0, 1024),
          good: good(),
          bad: bad(),
          card: card(`terminal`, [`$ git rev-list --count v2.3.0..HEAD`, `1024`, `# one by one: up to 1,024 builds`]),
        },
        links: { whole: links.whole },
        flows: [{ route: [`whole`], rate: 0.6 }],
      },
    },
    {
      short: `Halving`,
      chapter: `insight`,
      title: `Test the middle, throw away half`,
      body: [
        `Check the commit halfway between good and bad. If it is good, the bug came later; if it is bad, it came earlier. Either way half the range is gone.`,
        `1,024 → 512 → 256 → … → 1 takes <b>10</b> tests, because 2<sup>10</sup> = 1,024. A million commits would take 20.`,
      ],
      changes: [`+ probe at #512`],
      metrics: { range: 1024, testsLeft: 10, testing: `#512`, culprit: `?` },
      scene: {
        entities: {
          range: range(0, 1024),
          good: good(),
          bad: bad(),
          probe: probe(512, `5a6b7c`, [{ text: `test the middle`, tone: `violet` }]),
          card: card(`math`, [`tests = log₂(1024) = 10`, `1024 → 512 → 256 → 128 → 64`, `  → 32 → 16 → 8 → 4 → 2 → 1`], `sigma`),
        },
        links: { upper: links.upper, lower: links.lower },
        flows: [],
      },
    },
    {
      short: `Start`,
      chapter: `technique`,
      title: `Mark the ends, let Git pick`,
      body: [
        `<code>git bisect start</code>, then mark <code>HEAD</code> bad and <code>v2.3.0</code> good. Git checks out the middle commit for you.`,
        `You build, test and answer <code>git bisect good</code> or <code>bad</code>. Commit #512 is good, so everything before it is cleared and Git moves on to #768.`,
      ],
      changes: [`~ #512 good → range 512…1024`, `~ probe → #768`],
      metrics: { range: 512, testsLeft: 9, testing: `#768`, culprit: `?` },
      scene: {
        entities: {
          range: range(512, 1024),
          good: good(),
          bad: bad(),
          probe: probe(768, `e3f4a5`, [{ text: `checked out`, tone: `violet` }]),
          card: card(`terminal`, [`$ git bisect start`, `$ git bisect bad HEAD`, `$ git bisect good v2.3.0`, `Bisecting: 511 revisions left to test after this`, `$ git bisect good`, `Bisecting: 255 revisions left to test after this`]),
        },
        links: { upper: links.upper, lower: links.lower },
        flows: [],
      },
    },
    {
      short: `bisect run`,
      chapter: `technique`,
      title: `Let a script answer good or bad`,
      body: [
        `Typing good/bad nine more times is boring and error-prone. <code>git bisect run ./test.sh</code> runs the script at every step: exit code <b>0</b> means good, <b>1–127</b> bad, <b>125</b> “can’t test, skip”.`,
        `The script should test only the bug — a focused unit test, not the whole suite.`,
      ],
      changes: [`+ test.sh`, `~ range narrowed to 2 commits`],
      metrics: { range: 2, testsLeft: 1, testing: `#701`, culprit: `?` },
      scene: {
        entities: {
          range: range(700, 701),
          good: good(),
          bad: bad(),
          probe: probe(701, `d4e5f6`, [{ text: `testing…`, tone: `violet` }]),
          runner: runner(),
          card: card(`terminal`, [`$ git bisect run ./test.sh`, `running './test.sh'`, `Bisecting: 63 revisions left to test after this`, `…`, `Bisecting: 0 revisions left to test after this`]),
        },
        links: { upper: links.upper, lower: links.lower, test: links.test },
        flows: [{ route: [`test`], kind: `fail`, rate: 1.4 }],
      },
    },
    {
      short: `Culprit`,
      chapter: `solution`,
      title: `Git names the first bad commit`,
      body: [
        `After 10 tests Git prints the <b>first bad commit</b>: the one whose parent passes and which itself fails. Here it is <b>d4e5f6</b>, which changed how discounts are rounded.`,
        `You now read one small diff instead of a thousand commits.`,
      ],
      changes: [`~ culprit: d4e5f6 (#701)`],
      metrics: { range: 1, testsLeft: 0, testing: `done`, culprit: `d4e5f6` },
      scene: {
        entities: {
          good: good(),
          bad: bad(),
          probe: probe(701, `d4e5f6`, [{ text: `first bad commit`, tone: `red`, icon: `bug` }]),
          runner: runner(),
          card: card(`terminal`, [`$ git bisect log`, `! d4e5f6a is the first bad commit`, `    fix: round discounts per line`, `src/cart/total.ts | 4 ++--`]),
        },
        links: { upper: links.upper, lower: links.lower, test: links.test },
        flows: [],
      },
    },
    {
      short: `Revert`,
      chapter: `recap`,
      title: `Reset, then undo just that commit`,
      body: [
        `<code>git bisect reset</code> returns you to the branch you started on. Then <code>git revert d4e5f6</code> adds a new commit that undoes only that change — history stays intact for everyone who already pulled it.`,
        `Keep <code>test.sh</code> as a regression test so this bug can’t come back unnoticed.`,
      ],
      changes: [`+ revert commit 0f1e2d`, `~ main → 0f1e2d`],
      metrics: { range: `—`, testsLeft: 0, testing: `—`, culprit: `reverted` },
      scene: {
        entities: {
          good: good(),
          bad: bad([]),
          probe: probe(701, `d4e5f6`, [{ text: `reverted`, tone: `gray` }]),
          runner: runner(),
          revert: revert(),
          card: card(`terminal`, [`$ git bisect reset`, `$ git revert d4e5f6`, `= [main 0f1e2d] Revert "fix: round discounts per line"`]),
        },
        links: { upper: links.upper, lower: links.lower, revertParent: links.revertParent },
        flows: [{ route: [`revertParent`], kind: `write`, rate: 1 }],
      },
    },
  ],
};
