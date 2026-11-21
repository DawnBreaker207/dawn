// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeBalancer as f,
  makeCrowd as p,
  makeGhost as m,
  makeLink as h,
  DEAD_STATE as g,
  makeHot as _,
  makeCool as v,
  makeDevice as y,
  makeDb as b,
  makeZone as x,
  makeQueue as ee,
  makePanel as S,
  makeUser as te,
  makeDns as ne,
  makeWebServer as re,
  makeDatabase as ie,
  URL_TAG as ae,
  LINK_TEMPLATES as C,
  CACHED_DNS_LINK as oe,
  TIMING_PANEL as se,
} from '@/lib/simulator/scene-builders';

const cu = { x0: 15.5, x1: 22.5, y0: -3.5, y1: 3.5 };

const lu = (e = `users`) => p(cu, 10, e);

const uu = (e = {}) => y(-21, -9, { label: `developer`, ...e });

const du = (e = {}) =>
    d(-12, -9, { color: `slab`, glyph: `gitBranch`, label: [`Git`], sub: `main`, ...e });

const fu = (e, t, n, r = {}) => d(e, -9, { s: 3.6, h: 28, color: `green`, glyph: t, label: n, ...r });

const pu = (e = {}) => b(10, -9, { color: `store`, glyph: `package`, label: `artifacts`, ...e });

const mu = { x0: -6, x1: 6, y0: -12, y1: -6 };

const hu = (e = {}) => f(10, 0, { ...e });

const gu = (e, t, n) => S({ x: 0, y: 0, z: 0 }, e, t, { icon: n });

const _u = [
    [2, -12],
    [2, -4],
    [2, 4],
    [2, 12],
  ];

const vu = (e, t = {}) =>
    Object.fromEntries(
      e.map((e, n) => [
        `s${n}`,
        d(_u[n][0], _u[n][1], {
          s: 3.6,
          h: 30,
          color: e === `v42` ? `green` : `blue`,
          label: [e],
          ...(t[n] || {}),
        }),
      ]),
    );

const yu = (e, t = {}) =>
    Object.fromEntries(
      Array.from({ length: e }, (e, n) => [
        `l${n}`,
        h(`lb`, `s${n}`, [`lb`, [7, `lb`], [7, `s${n}`], `s${n}`], {
          heads: `both`,
          ...(t[n] || {}),
        }),
      ]),
    );

const bu = () => ({ ul: h(`users`, `lb`, [`users`, `lb`], { heads: `both` }) });

const xu = (e, t = 3.2, n = []) => ({
    routes: e
      .map((e, t) => ({ path: [`ul`, `l${t}`], weight: e, kind: n[t] }))
      .filter((e) => e.weight > 0),
    pick: `weights`,
    rate: t,
    bounce: !0,
  });

const Su = { deploys: `1 / week`, leadTime: `2 weeks`, failRate: `30%`, restore: `4 h` };

const Cu = {
    id: `cicd`,
    title: `CI/CD & Deployments`,
    summary: `Getting every change to production quickly and safely — and back out again just as quickly.`,
    minutes: 13,
    level: `intermediate`,
    metrics: [`deploys`, `leadTime`, `failRate`, `restore`],
    legend: [`req`, `res`, [`heavy`, `build / artifact`], `fail`],
    goals: [
      { text: `Continuous integration on every push`, step: 2 },
      { text: `Build once, promote one artifact`, step: 3 },
      { text: `Blue-green and canary releases`, step: 6 },
      { text: `Migrations that don’t break the old version`, step: 7 },
      { text: `Feature flags and measuring delivery`, step: 9 },
    ],
    steps: [
      {
        short: `By hand`,
        chapter: `setup`,
        title: `Shipping by hand`,
        body: [
          `Once a week, on Friday evening, a developer builds the app on their laptop, copies it to the production server over SSH and restarts it. Everyone stays late in case something breaks.`,
          `A week of everyone’s changes goes out at once — so when something does break, nobody is sure which change did it.`,
        ],
        callout: {
          kind: `insight`,
          text: `Big, rare releases feel safer and are the opposite: the more that changes at once, the harder it is to test, to find the cause, and to undo.`,
        },
        metrics: Su,
        scene: {
          entities: {
            dev: uu({ tags: [{ text: `build on my laptop`, icon: `hammer` }] }),
            srv: d(2, 0, { label: [`Production`], ...v(0.4) }),
            users: lu(),
          },
          links: {
            ds: h(`dev`, `srv`, [`dev`, [`dev`, 0], `srv`], {
              style: `dashed`,
              label: `copy over SSH`,
              labelAt: 0.3,
            }),
            us: h(`users`, `srv`, [`users`, `srv`], { heads: `both` }),
          },
          flows: [
            { route: [`ds`], kind: `heavy`, rate: 0.25 },
            { route: [`us`], rate: 2.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Friday`,
        chapter: `problem`,
        title: `“It works on my machine”`,
        body: [
          `This Friday the laptop had a newer library than the server, and the app won’t start. While the developer works out which of thirty changes to undo, the site is down.`,
          `There is no record of exactly what was running before, so even going back is guesswork. Four hours later, it’s up again.`,
        ],
        callout: {
          kind: `warn`,
          text: `Builds that depend on someone’s machine, and deploys nobody can repeat exactly, turn every release into an experiment.`,
        },
        changes: [`− New build fails to start`, `− Site down while someone guesses`],
        metrics: { ...Su, failRate: `30%`, restore: `4 h` },
        scene: {
          entities: {
            dev: uu({ tags: [{ text: `which change was it?`, tone: `red`, icon: `alert` }] }),
            srv: d(2, 0, { label: [`Production`], ...g }),
            users: lu(`users · site down`),
          },
          links: {
            ds: h(`dev`, `srv`, [`dev`, [`dev`, 0], `srv`], {
              style: `dashed`,
              label: `copy over SSH`,
              labelAt: 0.3,
            }),
            us: h(`users`, `srv`, [`users`, `srv`], { heads: `both`, fail: 1 }),
          },
          flows: [{ route: [`us`], rate: 2.6 }],
        },
      },
      {
        short: `CI`,
        chapter: `solution`,
        title: `Continuous integration`,
        body: [
          `Now every push to the shared repository starts a <span class="term">pipeline</span> on a clean machine: build the code, run the tests (see <em>Testing</em>). Nothing depends on anyone’s laptop.`,
          `The team merges small changes into <code>main</code> several times a day. A red pipeline means “stop and fix this first”, so <code>main</code> always builds and passes. That habit is <span class="term">continuous integration</span>.`,
        ],
        callout: {
          kind: `tip`,
          text: `Keep the pipeline fast — ten minutes, not an hour. A slow pipeline makes people batch their changes again.`,
        },
        changes: [
          `+ Shared repository, small changes to main`,
          `+ Every push: build + test on a clean machine`,
        ],
        metrics: { deploys: `1 / week`, leadTime: `1 week`, failRate: `15%`, restore: `4 h` },
        scene: {
          entities: {
            dev: uu(),
            repo: du(),
            pz: x(mu, `CI PIPELINE`),
            build: fu(-3, `hammer`, [`Build`], {
              tags: [{ text: `clean machine`, icon: `check` }],
            }),
            test: fu(3, `flask`, [`Test`]),
          },
          links: {
            dr: h(`dev`, `repo`, [`dev`, `repo`]),
            rb: h(`repo`, `build`, [`repo`, `build`]),
            bt: h(`build`, `test`, [`build`, `test`]),
          },
          flows: [{ route: [`dr`, `rb`, `bt`], kind: `heavy`, rate: 0.8 }],
        },
      },
      {
        short: `One artifact`,
        chapter: `technique`,
        title: `Build once, promote the same artifact`,
        body: [
          `The last stage packages the result into an <b>immutable artifact</b> — usually a container image — tagged with the commit it came from, <code>checkout:3f9c2a1</code>, and stores it in a registry.`,
          `That exact image is what gets tested, deployed to staging and then to production. Only configuration (addresses, secrets) differs between environments. What you tested is what you ship.`,
        ],
        callout: {
          kind: `tip`,
          text: `Never rebuild for production: a rebuild can pull different dependencies and produce a different program from the one you tested.`,
        },
        changes: [`+ Package stage: one image per commit`, `+ Artifact registry`],
        metrics: { deploys: `1 / week`, leadTime: `1 week`, failRate: `10%`, restore: `1 h` },
        scene: {
          entities: {
            dev: uu(),
            repo: du(),
            pz: x({ ...mu, x1: 6 }, `CI PIPELINE`),
            build: fu(-3, `hammer`, [`Build`]),
            test: fu(3, `flask`, [`Test`]),
            reg: pu({ tags: [{ text: `checkout:3f9c2a1`, icon: `gitCommit` }] }),
          },
          links: {
            dr: h(`dev`, `repo`, [`dev`, `repo`]),
            rb: h(`repo`, `build`, [`repo`, `build`]),
            bt: h(`build`, `test`, [`build`, `test`]),
            tr: h(`test`, `reg`, [`test`, `reg`]),
          },
          flows: [{ route: [`dr`, `rb`, `bt`, `tr`], kind: `heavy`, rate: 0.8 }],
        },
      },
      {
        short: `CD`,
        chapter: `solution`,
        title: `Continuous delivery`,
        body: [
          `Every image that passes is deployed to <b>staging</b> automatically — a small copy of production — where smoke tests check the main journeys. From there it can go to production at any time.`,
          `With <span class="term">continuous delivery</span>, production is one button press away. With continuous <em>deployment</em>, there is no button: every green change goes out by itself.`,
        ],
        callout: {
          kind: `insight`,
          text: `Deploying daily makes each deploy small: a few changes, easy to review, easy to blame, easy to undo.`,
        },
        changes: [
          `+ Auto-deploy to staging + smoke tests`,
          `+ One-click (or automatic) production deploy`,
        ],
        metrics: { deploys: `5 / day`, leadTime: `1 day`, failRate: `8%`, restore: `30 min` },
        scene: {
          entities: {
            repo: du(),
            pz: x({ ...mu, x1: 6 }, `CI PIPELINE`),
            build: fu(-3, `hammer`, [`Build`]),
            test: fu(3, `flask`, [`Test`]),
            reg: pu(),
            stg: d(10, 2, {
              s: 3.6,
              h: 28,
              color: `yellow`,
              glyph: `flask`,
              label: [`Staging`],
              tags: [{ text: `smoke tests ✓`, tone: `green`, icon: `check` }],
            }),
            prod: d(10, 13, { label: [`Production`], ...v(0.4) }),
          },
          links: {
            rb: h(`repo`, `build`, [`repo`, `build`]),
            bt: h(`build`, `test`, [`build`, `test`]),
            tr: h(`test`, `reg`, [`test`, `reg`]),
            rs: h(`reg`, `stg`, [`reg`, `stg`], { label: `deploy`, labelAt: 0.5 }),
            sp: h(`stg`, `prod`, [`stg`, `prod`], {
              style: `dashed`,
              label: `promote · 1 click`,
              labelAt: 0.5,
            }),
          },
          flows: [
            { route: [`rb`, `bt`, `tr`, `rs`], kind: `heavy`, rate: 0.8 },
            { route: [`sp`], kind: `heavy`, rate: 0.3 },
          ],
        },
      },
      {
        short: `Blue-green`,
        chapter: `technique`,
        title: `Blue-green: switch, don’t replace`,
        body: [
          `How does a new version reach users without downtime? With <span class="term">blue-green</span> deployment there are two identical production groups. Blue serves everyone on v41 while v42 starts on green and warms up.`,
          `Then the load balancer switches all traffic to green at once. If anything looks wrong, switching back to blue takes seconds — it is still running, untouched.`,
        ],
        callout: {
          kind: `tip`,
          text: `The cost is double capacity during a release. Rolling deploys (see <em>Load Balancing</em>) are cheaper but slower to undo.`,
        },
        changes: [
          `+ Two production groups: blue (v41) and green (v42)`,
          `~ Load balancer switches all traffic to green`,
        ],
        metrics: { deploys: `5 / day`, leadTime: `1 day`, failRate: `8%`, restore: `1 min` },
        scene: {
          entities: {
            users: lu(),
            lb: hu({ tags: [{ text: `traffic → green`, tone: `green`, icon: `split` }] }),
            ...vu([`v41`, `v41`, `v42`, `v42`], {
              0: { dim: 0.5, pills: `below`, tags: [{ text: `blue · standby`, icon: `moon` }] },
              1: { dim: 0.5 },
              3: { tags: [{ text: `green · live`, tone: `green`, icon: `check` }] },
            }),
            bz: x({ x0: -1.5, x1: 5.5, y0: -16, y1: -0.4 }, ``),
            gz: x({ x0: -1.5, x1: 5.5, y0: 0.4, y1: 16 }, ``),
          },
          links: { ...bu(), ...yu(4, { 0: { style: `off` }, 1: { style: `off` } }) },
          flows: [xu([0, 0, 1, 1])],
        },
      },
      {
        short: `Canary`,
        chapter: `technique`,
        title: `Canary: try it on a few users first`,
        body: [
          `A <span class="term">canary</span> release sends a small slice of real traffic — here 5% — to the new version, and compares its error rate and latency with the old version’s (see <em>Observability</em>).`,
          `If v42 is worse, the pipeline rolls it back automatically and only a few users ever saw it. If it holds up, the slice grows: 25%, 50%, everyone.`,
        ],
        callout: {
          kind: `insight`,
          text: `Canaries are testing in production — the only environment with real users, real data and real traffic patterns.`,
        },
        changes: [
          `~ 5% of traffic → v42`,
          `+ Automatic comparison against v41`,
          `~ Grow to 25% → 100%, or roll back`,
        ],
        metrics: { deploys: `5 / day`, leadTime: `1 day`, failRate: `4%`, restore: `1 min` },
        scene: {
          entities: {
            users: lu(),
            lb: hu({ tags: [{ text: `5% → v42`, tone: `amber`, icon: `split` }] }),
            ...vu([`v41`, `v41`, `v41`, `v42`], {
              3: { tags: [{ text: `canary · errors 0.1%`, tone: `green`, icon: `check` }] },
            }),
          },
          links: { ...bu(), ...yu(4) },
          flows: [xu([0.32, 0.32, 0.31, 0.05], 3.6)],
        },
      },
      {
        short: `Migrations`,
        chapter: `problem`,
        title: `Case: the migration that breaks the old version`,
        body: [
          `v42 renames a column: <code>name</code> becomes <code>full_name</code>. The migration runs, and v42 is happy — but during the rollout most servers are still on v41, which asks for <code>name</code> and gets an error.`,
          `Fix it with <span class="term">expand and contract</span>: add <code>full_name</code> and write both; backfill old rows; switch reads to <code>full_name</code>; only when no running version uses <code>name</code>, drop it. Every step works with both versions.`,
        ],
        callout: {
          kind: `warn`,
          text: `During any deploy, old and new code run side by side against the same database. Every schema change must work with both.`,
        },
        changes: [
          `− Column renamed in one step`,
          `− v41 servers fail mid-rollout`,
          `+ Expand → migrate → contract, over several deploys`,
        ],
        metrics: { deploys: `5 / day`, leadTime: `1 day`, failRate: `4%`, restore: `1 min` },
        scene: {
          entities: {
            users: lu(),
            lb: hu(),
            ...vu([`v41`, `v41`, `v41`, `v42`], {
              0: {
                heat: 0.6,
                pills: `below`,
                tags: [{ text: `no column “name”`, tone: `red`, icon: `alert` }],
              },
              1: { heat: 0.6 },
              2: { heat: 0.6 },
            }),
            db: b(-8, 0, {
              label: `users table`,
              tags: [{ text: `name → full_name`, tone: `amber`, icon: `database` }],
            }),
            card: gu(
              `Expand, then contract`,
              [
                `1  add full_name, write both columns`,
                `2  backfill old rows`,
                `3  read from full_name`,
                `= 4  drop name — once nothing uses it`,
                `! never rename in one step`,
              ],
              `database`,
            ),
          },
          links: {
            ...bu(),
            ...yu(4, { 0: { fail: 0.6 }, 1: { fail: 0.6 }, 2: { fail: 0.6 } }),
            ...Object.fromEntries(
              [1, 3].map((e) => [
                `d${e}`,
                h(`s${e}`, `db`, [`s${e}`, [-3, `s${e}`], [-3, `db`], `db`], { heads: `none` }),
              ]),
            ),
          },
          flows: [xu([0.3, 0.3, 0.3, 0.1], 3.6)],
        },
      },
      {
        short: `Flags`,
        chapter: `technique`,
        title: `Feature flags: deploy is not release`,
        body: [
          `The new checkout page is merged and deployed weeks before launch — switched off. A <span class="term">feature flag</span> decides, per request, who sees it: first the team, then 1% of users, then everyone.`,
          `Turning it off is a setting, not a deploy, so a problem is fixed in seconds. Deploying (moving code to servers) and releasing (showing it to users) become separate decisions.`,
        ],
        callout: {
          kind: `tip`,
          text: `Flags are debt too: remove each one once its feature is fully out, or the code fills with branches nobody dares delete.`,
        },
        changes: [`+ Flag service`, `~ New checkout: on for staff + 1% of users`],
        metrics: { deploys: `20 / day`, leadTime: `2 h`, failRate: `3%`, restore: `1 min` },
        scene: {
          entities: {
            users: lu(),
            lb: hu(),
            ...vu([`v42`, `v42`, `v42`, `v42`]),
            flags: d(-8, 0, {
              s: 3.6,
              h: 28,
              color: `yellow`,
              glyph: `toggle`,
              label: [`Flags`],
              tags: [{ text: `new_checkout: staff + 1%`, icon: `toggle` }],
            }),
          },
          links: {
            ...bu(),
            ...yu(4),
            ...Object.fromEntries(
              [0, 1, 2, 3].map((e) => [
                `f${e}`,
                h(`flags`, `s${e}`, [`flags`, [-3, `flags`], [-3, `s${e}`], `s${e}`], {
                  style: `dashed`,
                  heads: `none`,
                }),
              ]),
            ),
          },
          flows: [
            xu([0.25, 0.25, 0.25, 0.25], 3.4),
            {
              fanout: !0,
              routes: [0, 1, 2, 3].map((e) => ({ path: [`f${e}`] })),
              kind: `ping`,
              rate: 0.4,
            },
          ],
        },
      },
      {
        short: `Measure`,
        chapter: `insight`,
        title: `Measure the delivery itself`,
        body: [
          `Four numbers, known as the <span class="term">DORA metrics</span>, describe how well a team ships: how often it deploys, how long a change takes from commit to production, how many deploys cause a problem, and how quickly service is restored when one does.`,
          `Research across thousands of teams found the same thing this lesson shows: the teams that ship most often also break production least, because every change is small and every undo is fast.`,
        ],
        callout: {
          kind: `insight`,
          text: `Speed and safety are not a trade-off here. Small, frequent, reversible changes improve both.`,
        },
        metrics: { deploys: `20 / day`, leadTime: `2 h`, failRate: `3%`, restore: `1 min` },
        scene: {
          entities: {
            users: lu(),
            lb: hu(),
            ...vu([`v42`, `v42`, `v42`, `v42`]),
            card: gu(
              `Before → after`,
              [
                `deploys          1 a week   →  20 a day`,
                `commit → prod    2 weeks    →  2 hours`,
                `deploys failing  30%        →  3%`,
                `= restore        4 hours    →  1 minute`,
              ],
              `chartLine`,
            ),
          },
          links: { ...bu(), ...yu(4) },
          flows: [xu([0.25, 0.25, 0.25, 0.25], 3.4)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>CI</b>: small changes merged often; every push is built and tested on a clean machine.</li>
          <li><b>Build once</b>: one immutable artifact per commit, promoted unchanged to every environment.</li>
          <li><b>CD</b>: every green change can reach production at any time — by a click or automatically.</li>
          <li>Release carefully: <b>blue-green</b> to switch back fast, <b>canaries</b> to limit the damage, <b>flags</b> to separate deploy from release.</li>
          <li>Schema changes must work with <b>old and new code</b> at once: expand, then contract.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `That completes Shipping. Next module: <b>Whole Systems</b> — starting with how high-level and low-level design fit together.`,
        },
        metrics: { deploys: `20 / day`, leadTime: `2 h`, failRate: `3%`, restore: `1 min` },
        scene: {
          entities: { users: lu(), lb: hu(), ...vu([`v42`, `v42`, `v42`, `v42`]) },
          links: { ...bu(), ...yu(4) },
          flows: [xu([0.25, 0.25, 0.25, 0.25], 3.4)],
        },
      },
    ],
  };

export { Cu as cicdLesson };
export default Cu;
