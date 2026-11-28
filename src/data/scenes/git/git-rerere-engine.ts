import { fromScreen, makeBlock, makeDb, makeLink, makePanel, cardAt } from '@/lib/simulator/scene-builders';

// One rebase, one recurring conflict. The commit being replayed sits on the left, the
// conflicted file in the middle, rerere's cache on the right and the index below.
// rerere learns the fix once (preimage → postimage) and replays it on every later stop.
//
//   pick e41a09 ──apply──▶ auth.ts ──record──▶ .git/rr-cache
//                            │  ◀───replay────
//                          index

type Tag = { text: string; tone?: string; icon?: string };

/** Screen position (px) → world grid coordinates. */
const toIso = (sx: number, sy: number) => fromScreen(sx, sy, 2);
const positions = { pick: toIso(-230, -60), file: toIso(20, 60), cache: toIso(250, -70), index: toIso(-200, 170) };

const pick = (sha: string, sub: string, tags: Tag[] = []) =>
  makeBlock(positions.pick.x, positions.pick.y, { s: 4.4, h: 52, color: `purple`, glyph: `gitCommit`, label: [sha], sub, tags });
const file = (tags: Tag[]) =>
  makeBlock(positions.file.x, positions.file.y, { s: 4.4, h: 52, color: `blue`, glyph: `file`, label: [`auth.ts`], sub: `working tree`, tags });
const cache = (tags: Tag[] = []) => makeDb(positions.cache.x, positions.cache.y, { r: 2.2, h: 46, glyph: `database`, label: `.git/rr-cache`, tags });
const index = (tags: Tag[] = []) =>
  makeBlock(positions.index.x, positions.index.y, { s: 4.2, h: 48, color: `orange`, glyph: `listChecks`, label: [`index`], sub: `staging`, tags });

const links = {
  apply: makeLink(`pick`, `file`, [`pick`, `file`], { label: `apply` }),
  applyQuiet: makeLink(`pick`, `file`, [`pick`, `file`]),
  record: makeLink(`file`, `cache`, [`file`, `cache`], { label: `record` }),
  // never on stage together with `record`, so it can share the straight path
  replay: makeLink(`cache`, `file`, [`cache`, `file`], { label: `replay` }),
  stage: makeLink(`file`, `index`, [`file`, `index`], { label: `git add` }),
};

const card = cardAt({ x: positions.pick.x, y: positions.pick.y, dx: -60, dy: -250 }, `keyboard`);
const stop = (n: string): Tag => ({ text: n, tone: `amber`, icon: `gitBranch` });

export const gitRerereEngineLesson = {
  id: `git-rerere-engine`,
  title: `Git rerere: Reuse Recorded Resolution Engine`,
  summary: `Stop solving the same conflict again and again during long rebases: rerere records how you fixed it once and replays the fix.`,
  minutes: 16,
  level: `advanced`,
  metrics: [`rerere`, `recorded`, `replayed`, `stops`],
  legend: [`req`, [`write`, `record to cache`], [`push`, `replay from cache`], [`fail`, `conflict`]],
  goals: [
    { text: `The rebase pain: one conflict, many stops`, step: 1 },
    { text: `Enable it: rerere.enabled true`, step: 2 },
    { text: `Preimage: fingerprint of the conflict`, step: 3 },
    { text: `Postimage: your fix, stored in rr-cache`, step: 4 },
    { text: `Replay: same conflict, solved for you`, step: 5 },
    { text: `rerere.autoupdate stages the fix`, step: 6 },
  ],
  steps: [
    {
      short: `Same conflict`,
      chapter: `problem`,
      title: `The same conflict, again and again`,
      body: [
        `You rebase a 15-commit feature branch onto a <code>main</code> that rewrote <code>auth.ts</code>. Commit 3 touches the same lines, so Git stops with a conflict.`,
        `You fix it and continue. Commit 5 touches those lines again — another stop, the <b>same</b> conflict. Then commit 7. Each fix is manual, and each one is a chance to get it wrong.`,
      ],
      metrics: { rerere: `off`, recorded: 0, replayed: 0, stops: 3 },
      scene: {
        entities: {
          pick: pick(`e41a09`, `pick 3 of 15`, [stop(`rebase onto main`)]),
          file: file([{ text: `CONFLICT`, tone: `red`, icon: `alert` }]),
          card: card(`terminal`, [`$ git rebase main`, `CONFLICT (content): Merge conflict in src/auth.ts`, `$ git rebase --continue`, `! CONFLICT … src/auth.ts  (again, commit 5)`]),
        },
        links: { apply: links.apply },
        flows: [{ route: [`apply`], kind: `fail`, rate: 1.2 }],
      },
    },
    {
      short: `Enable`,
      chapter: `setup`,
      title: `Turn on rerere once`,
      body: [
        `<b>rerere</b> means <em>reuse recorded resolution</em>. It is built into Git but off by default.`,
        `After <code>rerere.enabled</code> is set, Git keeps a small cache in <code>.git/rr-cache</code> and quietly watches every conflict you hit — merges, rebases and cherry-picks alike.`,
      ],
      changes: [`+ .git/rr-cache`, `~ rerere.enabled = true`],
      metrics: { rerere: `on`, recorded: 0, replayed: 0, stops: 3 },
      scene: {
        entities: {
          pick: pick(`e41a09`, `pick 3 of 15`, [stop(`rebase onto main`)]),
          file: file([{ text: `CONFLICT`, tone: `red`, icon: `alert` }]),
          cache: cache([{ text: `empty`, tone: `gray` }]),
          card: card(`terminal`, [`$ git config --global rerere.enabled true`, `$ git rebase --abort && git rebase main`]),
        },
        links: { apply: links.applyQuiet },
        flows: [{ route: [`apply`], kind: `fail`, rate: 0.8 }],
      },
    },
    {
      short: `Preimage`,
      chapter: `technique`,
      title: `It fingerprints the conflict`,
      body: [
        `At the conflict, rerere takes the conflicted hunk — just the lines between the markers, not the file name or commit — and hashes it. That hash names a folder in the cache.`,
        `It saves the conflict there as the <span class="term">preimage</span>. Any later conflict with the same lines produces the same hash.`,
      ],
      changes: [`+ rr-cache/7d9e44/preimage`],
      metrics: { rerere: `on`, recorded: 0, replayed: 0, stops: 3 },
      scene: {
        entities: {
          pick: pick(`e41a09`, `pick 3 of 15`, [stop(`rebase onto main`)]),
          file: file([{ text: `CONFLICT`, tone: `red`, icon: `alert` }]),
          cache: cache([{ text: `7d9e44 · preimage`, tone: `violet` }]),
          card: card(`terminal`, [`Recorded preimage for 'src/auth.ts'`, `$ ls .git/rr-cache/`, `7d9e44a1b2c3…/`, `$ ls .git/rr-cache/7d9e44a1b2c3…/`, `preimage`]),
        },
        links: { apply: links.applyQuiet, record: links.record },
        flows: [{ route: [`record`], kind: `write`, rate: 1.2 }],
      },
    },
    {
      short: `Postimage`,
      chapter: `technique`,
      title: `You fix it once — it remembers`,
      body: [
        `You resolve <code>auth.ts</code> by hand and <code>git add</code> it. At that moment rerere saves the resolved hunk next to the preimage as the <span class="term">postimage</span>.`,
        `The pair is the lesson learned: “when the conflict looks like <em>this</em>, the answer is <em>that</em>.”`,
      ],
      changes: [`+ index`, `+ rr-cache/7d9e44/postimage`],
      metrics: { rerere: `on`, recorded: 1, replayed: 0, stops: 3 },
      scene: {
        entities: {
          pick: pick(`e41a09`, `pick 3 of 15`, [stop(`rebase onto main`)]),
          file: file([{ text: `fixed by hand`, tone: `green`, icon: `check` }]),
          cache: cache([{ text: `pre + post`, tone: `green` }]),
          index: index(),
          card: card(`terminal`, [`$ git add src/auth.ts`, `Recorded resolution for 'src/auth.ts'.`, `$ git rebase --continue`]),
        },
        links: { apply: links.applyQuiet, record: links.record, stage: links.stage },
        flows: [
          { route: [`stage`], kind: `write`, rate: 1 },
          { route: [`record`], kind: `write`, rate: 1 },
        ],
      },
    },
    {
      short: `Replay`,
      chapter: `solution`,
      title: `Next stop: solved before you look`,
      body: [
        `Commit 5 hits the same conflict. rerere hashes it, finds <b>7d9e44</b> in the cache and writes the postimage into the file — in milliseconds.`,
        `Git still stops so you can check the result; the file is already resolved.`,
      ],
      changes: [`~ pick 5 of 15`, `~ auth.ts resolved from cache`],
      metrics: { rerere: `on`, recorded: 1, replayed: 1, stops: 3 },
      scene: {
        entities: {
          pick: pick(`b7c2d1`, `pick 5 of 15`, [stop(`rebase onto main`)]),
          file: file([{ text: `resolved by rerere`, tone: `green`, icon: `check` }]),
          cache: cache([{ text: `hit · 7d9e44`, tone: `green` }]),
          index: index(),
          card: card(`terminal`, [`CONFLICT (content): Merge conflict in src/auth.ts`, `= Resolved 'src/auth.ts' using previous resolution.`, `$ git add src/auth.ts && git rebase --continue`]),
        },
        links: { apply: links.applyQuiet, replay: links.replay, stage: links.stage },
        flows: [{ route: [`replay`], kind: `push`, rate: 1.4 }],
      },
    },
    {
      short: `autoupdate`,
      chapter: `recap`,
      title: `autoupdate: no stops at all`,
      body: [
        `With <code>rerere.autoupdate</code>, a replayed resolution is also staged for you. Every remaining stop is resolved and added automatically, and the rebase runs straight through.`,
        `Always skim <code>git diff</code> afterwards: rerere reapplies text, it doesn’t know if the code still makes sense.`,
      ],
      changes: [`~ rerere.autoupdate = true`, `~ 15 of 15 applied`],
      metrics: { rerere: `auto`, recorded: 1, replayed: 4, stops: 0 },
      scene: {
        entities: {
          pick: pick(`f09a3e`, `pick 15 of 15`, [stop(`feature · done`)]),
          file: file([{ text: `resolved by rerere`, tone: `green`, icon: `check` }]),
          cache: cache([{ text: `pre + post`, tone: `green` }]),
          index: index([{ text: `auto-staged`, tone: `green` }]),
          card: card(`terminal`, [`$ git config --global rerere.autoupdate true`, `$ git rebase main`, `Resolved 'src/auth.ts' using previous resolution.`, `= Successfully rebased and updated refs/heads/feature.`]),
        },
        links: { apply: links.applyQuiet, replay: links.replay, stage: links.stage },
        flows: [
          { route: [`replay`], kind: `push`, rate: 1.2 },
          { route: [`stage`], kind: `write`, rate: 1.2 },
        ],
      },
    },
  ],
};
