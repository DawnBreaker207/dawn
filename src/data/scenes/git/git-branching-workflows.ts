import { makeBlock, makeLink, makePanel } from '@/lib/simulator/scene-builders';

// One fixed stage: the same feature travels to production under two workflows.
// Git Flow routes it through `develop`; trunk-based retires `develop` and adds a CI
// gate, then flags and continuous deploys.
//
//   feature ── develop ── main ── production
//        └──── CI ─────────┘
//
// Git colours: branches are yellow, the CI process green, production slab.

type Tag = { text: string; tone?: string; icon?: string };

const at = (sx: number, sy: number): [number, number] => [
  Math.round((sx / 28 + sy / 14) * 100) / 100,
  Math.round((sx / 28 - sy / 14) * 100) / 100,
];

const feature = (sub: string, tags: Tag[] = []) =>
  makeBlock(...at(-170, 40), { s: 4.4, h: 50, color: `yellow`, glyph: `gitBranch`, label: [`feature/cart`], sub, tags });
const develop = (tags: Tag[] = []) =>
  makeBlock(...at(0, -150), { s: 4.4, h: 50, color: `yellow`, glyph: `merge`, label: [`develop`], sub: `integration`, tags });
const main = (tags: Tag[] = []) =>
  makeBlock(...at(170, 40), { s: 4.8, h: 54, color: `yellow`, glyph: `gitBranch`, label: [`main`], sub: `always green`, tags });
const ci = (tags: Tag[] = []) =>
  makeBlock(...at(0, 190), { s: 4.4, h: 50, color: `green`, glyph: `listChecks`, label: [`CI`], sub: `tests · lint`, tags });
const prod = (tags: Tag[] = []) =>
  makeBlock(...at(370, -70), { s: 4.4, h: 50, color: `slab`, glyph: `server`, label: [`Production`], sub: `web servers`, tags });

const L = {
  toDevelop: makeLink(`feature`, `develop`, [`feature`, `develop`], { label: `merge` }),
  release: makeLink(`develop`, `main`, [`develop`, `main`], { label: `release` }),
  conflict: makeLink(`feature`, `develop`, [`feature`, `develop`], { style: `cut`, label: `✕ conflict`, labelTone: `red` }),
  direct: makeLink(`feature`, `main`, [`feature`, `main`], { label: `merge daily` }),
  pr: makeLink(`feature`, `ci`, [`feature`, `ci`], { label: `PR` }),
  gate: makeLink(`ci`, `main`, [`ci`, `main`], { label: `green` }),
  deploy: makeLink(`main`, `prod`, [`main`, `prod`], { label: `deploy` }),
};

const card = (title: string, lines: string[], icon = `keyboard`) =>
  makePanel({ x: 0, y: 0, z: 0, dx: 90, dy: 110 }, title, lines, { icon });

export const gitBranchingWorkflowsLesson = {
  id: `git-branching-workflows`,
  title: `Git Branching Workflows: Git Flow vs Trunk-Based Development`,
  summary: `Ship the same feature twice: once through Git Flow’s long-lived branches, once through trunk-based development with CI, flags and continuous deploys.`,
  minutes: 14,
  level: `intermediate`,
  metrics: [`branchAge`, `merges`, `conflicts`, `deploys`],
  legend: [`req`, [`write`, `merge`], [`fail`, `conflict`], [`heavy`, `deploy`]],
  goals: [
    { text: `Git Flow: feature, develop, release and main branches`, step: 1 },
    { text: `Merge hell: why long-lived branches drift`, step: 2 },
    { text: `Trunk-based development: small merges to main every day`, step: 3 },
    { text: `CI gates keep main deployable`, step: 4 },
    { text: `Feature flags separate deploy from release`, step: 5 },
    { text: `Continuous deployment from main`, step: 6 },
  ],
  steps: [
    {
      short: `Git Flow`,
      chapter: `setup`,
      title: `Git Flow: every change takes the long road`,
      body: [
        `In <span class="term">Git Flow</span> a feature lives on its own branch for weeks, merges into <code>develop</code>, and only reaches <code>main</code> when a release branch is cut and merged back.`,
        `It gives clear release points — at the cost of code that sits unmerged for a long time.`,
      ],
      metrics: { branchAge: `3 weeks`, merges: `2 / week`, conflicts: 0, deploys: `1 / month` },
      scene: {
        entities: {
          feature: feature(`3 weeks old`),
          develop: develop(),
          main: main(),
          card: card(`git log --graph`, [`$ git log --oneline --graph --all`, `* 9c1d (feature/cart) cart: totals`, `| * 41ab (develop) Merge feature/auth`, `|/`, `* 7d9e (main) release 1.4`]),
        },
        links: { toDevelop: L.toDevelop, release: L.release },
        flows: [
          { route: [`toDevelop`], kind: `write`, rate: 0.5 },
          { route: [`release`], kind: `write`, rate: 0.3 },
        ],
      },
    },
    {
      short: `Merge hell`,
      chapter: `problem`,
      title: `Three weeks apart, the branches no longer fit`,
      body: [
        `While the feature was away, <code>develop</code> moved on by dozens of commits. Merging now touches the same files from both sides: <b>43 conflicts</b> to resolve by hand.`,
        `The longer a branch lives, the more it drifts — and the release waits for the cleanup.`,
      ],
      changes: [`! 43 conflicts`, `! release delayed`],
      metrics: { branchAge: `3 weeks`, merges: `2 / week`, conflicts: 43, deploys: `delayed` },
      scene: {
        entities: {
          feature: feature(`3 weeks old`, [{ text: `+38 commits`, tone: `amber` }]),
          develop: develop([{ text: `43 conflicts`, tone: `red`, icon: `alertTriangle` }]),
          main: main(),
          card: card(`git merge`, [`$ git merge feature/cart`, `CONFLICT (content): Merge conflict in src/order.ts`, `CONFLICT (content): Merge conflict in src/cart.ts`, `Automatic merge failed; fix conflicts and then commit.`], `alertTriangle`),
        },
        links: { toDevelop: L.conflict, release: L.release },
        flows: [{ route: [`toDevelop`], kind: `fail`, rate: 0.8 }],
      },
    },
    {
      short: `Trunk`,
      chapter: `solution`,
      title: `Trunk-based: merge to main every day`,
      body: [
        `<span class="term">Trunk-based development</span> removes <code>develop</code>. Branches live less than a day and merge straight into <code>main</code>.`,
        `Each merge is small, so conflicts are rare and take minutes. The work is integrated continuously instead of once a month.`,
      ],
      changes: [`− develop`, `~ branches live < 1 day`],
      metrics: { branchAge: `< 1 day`, merges: `12 / day`, conflicts: 1, deploys: `1 / week` },
      scene: {
        entities: {
          feature: feature(`< 1 day old`),
          main: main(),
          card: card(`daily merge`, [`$ git switch -c feature/cart main`, `$ git commit -m "cart: totals"   # 40 lines`, `$ git push -u origin feature/cart`, `$ gh pr merge --squash   # same day`]),
        },
        links: { direct: L.direct },
        flows: [{ route: [`direct`], kind: `write`, rate: 1.4 }],
      },
    },
    {
      short: `CI gate`,
      chapter: `technique`,
      title: `Nothing reaches main without CI`,
      body: [
        `With everyone merging daily, <code>main</code> must stay deployable. Every pull request runs the <span class="term">CI</span> pipeline — typecheck, unit and smoke tests — and merging is blocked until it is green.`,
        `A merge queue re-tests each PR on top of the latest <code>main</code>, so two green PRs can’t combine into a red trunk.`,
      ],
      changes: [`+ CI`, `~ merges go through the gate`],
      metrics: { branchAge: `< 1 day`, merges: `12 / day`, conflicts: 0, deploys: `daily` },
      scene: {
        entities: {
          feature: feature(`< 1 day old`),
          main: main(),
          ci: ci([{ text: `✓ 1,420 tests`, tone: `green` }]),
          card: card(`checks`, [`$ gh pr checks 812`, `typecheck   pass   45s`, `unit        pass   1m12s`, `smoke       pass   2m05s`]),
        },
        links: { pr: L.pr, gate: L.gate },
        flows: [
          { route: [`pr`], rate: 1.2 },
          { route: [`gate`], kind: `write`, rate: 1.2 },
        ],
      },
    },
    {
      short: `Flags`,
      chapter: `technique`,
      title: `Ship code that is switched off`,
      body: [
        `Half-finished work still merges daily — behind a <span class="term">feature flag</span>. The new checkout code is in production, but the flag is off, so users see the old one.`,
        `<b>Deploy</b> (putting code on servers) and <b>release</b> (showing it to users) become two separate decisions.`,
      ],
      changes: [`+ Production`, `~ cart_v2 deployed, flag off`],
      metrics: { branchAge: `4 hours`, merges: `15 / day`, conflicts: 0, deploys: `on demand` },
      scene: {
        entities: {
          feature: feature(`4 hours old`),
          main: main(),
          ci: ci(),
          prod: prod([{ text: `cart_v2: off`, tone: `gray`, icon: `toggle` }]),
          card: card(`checkout.ts`, [`const v2 = await flags.isOn("cart_v2", user);`, `return v2 ? renderCartV2() : renderCart();`], `code`),
        },
        links: { pr: L.pr, gate: L.gate, deploy: L.deploy },
        flows: [
          { route: [`gate`], kind: `write`, rate: 1 },
          { route: [`deploy`], kind: `heavy`, rate: 0.6 },
        ],
      },
    },
    {
      short: `Deploy`,
      chapter: `recap`,
      title: `Every green merge goes live`,
      body: [
        `Now each merge to <code>main</code> is built and deployed automatically, many times a day. Turning <code>cart_v2</code> on for 10% of users is a config change, and turning it off is the rollback.`,
        `Small batches, short-lived branches, a gate in front of <code>main</code>, and flags in production — no release day, no merge hell.`,
      ],
      changes: [`~ cart_v2: 10% of users`],
      metrics: { branchAge: `4 hours`, merges: `15 / day`, conflicts: 0, deploys: `15 / day` },
      scene: {
        entities: {
          feature: feature(`4 hours old`),
          main: main([{ text: `deployable`, tone: `green` }]),
          ci: ci(),
          prod: prod([{ text: `cart_v2: 10%`, tone: `green`, icon: `toggle` }]),
          card: card(`deploys`, [`$ gh run list --workflow deploy --limit 3`, `✓ deploy  main  cart: totals         12m ago`, `✓ deploy  main  flag cart_v2 → 10%   40m ago`, `✓ deploy  main  fix: rounding         1h ago`], `activity`),
        },
        links: { pr: L.pr, gate: L.gate, deploy: L.deploy },
        flows: [
          { route: [`pr`], rate: 1.4 },
          { route: [`gate`], kind: `write`, rate: 1.4 },
          { route: [`deploy`], kind: `heavy`, rate: 1 },
        ],
      },
    },
  ],
};
