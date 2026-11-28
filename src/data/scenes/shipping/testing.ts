import { DEAD_STATE, makeBlock, makeCool, makeCrowd, makeDb, makeGhost, makeLink, makePanel, cardAt, type Bag } from '@/lib/simulator/scene-builders';

const usersArea = { x0: -4.5, x1: 4.5, y0: -21, y1: -15 };

const users = (e = `shoppers`) => makeCrowd(usersArea, 10, e);

const tests = (e: Bag = {}) => makeBlock(-13, -4, { color: `green`, glyph: `flask`, label: [`Tests`], ...e });

const $l = (e: Bag = {}) => makeBlock(0, -4, { glyph: `cart`, label: [`Checkout`], sub: `your code`, ...e });

const ordersDb = (e: Bag = {}) => makeDb(11, -4, { label: `orders db`, ...e });

const paymentService = (e: Bag = {}) =>
    makeBlock(0, 9, {
      s: 4.8,
      h: 52,
      color: `purple`,
      glyph: `creditCard`,
      label: [`Payment`, `provider`],
      sub: `external`,
      ...e,
    });

const inventoryService = (e: Bag = {}) =>
    makeBlock(11, 9, { color: `yellow`, glyph: `boxes`, label: [`Inventory`], sub: `another team`, ...e });

const fakeDb = (e = `fake db · in memory`) => makeGhost(11, -4, 3.6, 30, e);

const paymentStub = (e = `stub: “approved”`) => makeGhost(0, 9, 4, 34, e);

const inventoryStub = (e = `stub: “in stock”`) => makeGhost(11, 9, 4, 34, e);

const links = {
    ts: (e: Bag = {}) => makeLink(`tests`, `svc`, [`tests`, `svc`], { heads: `both`, ...e }),
    us: (e: Bag = {}) => makeLink(`users`, `svc`, [`users`, `svc`], { heads: `both`, ...e }),
    sd: (e: string | Bag = `db`, t: Bag = {}) => typeof e === 'object' ? makeLink(`svc`, `db`, [`svc`, `db`], { heads: `both`, ...e }) : makeLink(`svc`, e, [`svc`, e], { heads: `both`, ...t }),
    sp: (e: string | Bag = `pay`, t: Bag = {}) => typeof e === 'object' ? makeLink(`svc`, `pay`, [`svc`, `pay`], { heads: `both`, ...e }) : makeLink(`svc`, e, [`svc`, e], { heads: `both`, ...t }),
    si: (e = `inv`, t = {}) => {
      const target = typeof e === 'object' ? `inv` : e;
      const opts = typeof e === 'object' ? e : t;
      return makeLink(`svc`, target, [`svc`, [`svc`, `svc+1.5`], [5.5, `svc+1.5`], [5.5, target], target], {
        heads: `both`,
        ...opts,
      });
    },
  };

const card = cardAt({ x: 0, y: 0 });

const requestFlow = (e: string[], t = 2.4, n: Bag = {}) => ({ route: e, rate: t, bounce: !0, ...n });

// --- shipping ---
const lesson = {
    id: `testing`,
    title: `Testing`,
    summary: `Knowing a change is safe before your users find out — fast tests for the logic, a few slow ones for everything else.`,
    minutes: 12,
    level: `beginner`,
    metrics: [`feedback`, `covers`, `escaped`],
    legend: [[`req`, `test or request`], `res`, `fail`],
    goals: [
      { text: `Unit tests and test doubles`, step: 2 },
      { text: `Integration and contract tests`, step: 4 },
      { text: `End-to-end tests and the test pyramid`, step: 6 },
      { text: 'Flaky tests, and testing for', step: 8 },
    ],
    steps: [
      {
        short: `Is it safe?`,
        chapter: `setup`,
        title: `Is this change safe?`,
        body: [
          `The checkout service applies discount codes. It reads and writes the orders database, charges cards through an external payment provider, and asks the Inventory team’s service whether items are in stock.`,
          `A developer has just changed how discounts are rounded. Before shipping, the team checks it by hand: click through a few purchases on a test server, and it all looks fine.`,
        ],
        callout: {
          kind: `insight`,
          text: `Every change carries a question: what else did this break? Tests are how you answer it quickly, every time, without relying on anyone remembering what to check.`,
        },
        metrics: { feedback: `1 day`, covers: `what someone clicks`, escaped: `often` },
        scene: {
          entities: { users: users(), svc: $l(), db: ordersDb(), pay: paymentService(), inv: inventoryService() },
          links: { us: links.us(), sd: links.sd(), sp: links.sp(), si: links.si() },
          flows: [requestFlow([`us`, `sd`], 1.6), requestFlow([`us`, `sp`], 0.8), requestFlow([`us`, `si`], 0.8)],
        },
      },
      {
        short: `By hand`,
        chapter: `problem`,
        title: `Clicking around misses things`,
        body: [
          `Nobody tried a basket of three items at €9.99 with a 10% code. The new rounding charges €26.98 instead of €26.97 — a cent too much on thousands of orders before support notices.`,
          `Manual checks are slow, so they happen rarely, and they only cover what someone thought to try. The bug was found by users.`,
        ],
        callout: {
          kind: `warn`,
          text: `The later a bug is found, the more it costs: seconds in a test, hours in review, days in production — plus refunds and trust.`,
        },
        changes: [`− Rounding bug shipped`, `− Found by customers, not by the team`],
        metrics: { feedback: `1 day`, covers: `what someone clicks`, escaped: `often` },
        scene: {
          entities: {
            users: users(`shoppers · overcharged`),
            svc: $l({ tags: [{ text: `€26.98 — should be €26.97`, tone: `red`, icon: `bug` }] }),
            db: ordersDb(),
            pay: paymentService(),
            inv: inventoryService(),
          },
          links: { us: links.us({ fail: 0.25 }), sd: links.sd(), sp: links.sp(), si: links.si() },
          flows: [requestFlow([`us`, `sd`], 1.6), requestFlow([`us`, `sp`], 0.8), requestFlow([`us`, `si`], 0.8)],
        },
      },
      {
        short: `Unit tests`,
        chapter: `solution`,
        title: `Unit tests: one piece, in isolation`,
        body: [
          `A <span class="term">unit test</span> calls one function with known inputs and checks the output — here, the total for a given basket and code. It runs in milliseconds, with no database and no network.`,
          `Because they’re so cheap, you write thousands, and they run on every change. The rounding case becomes one line that fails the moment someone breaks it again.`,
        ],
        callout: {
          kind: `tip`,
          text: `Write the test for a bug before you fix it: watch it fail, fix the code, watch it pass. That bug can never quietly come back.`,
        },
        changes: [`+ Unit tests call Checkout directly`, `− Real database, provider and Inventory`],
        metrics: { feedback: `30 s`, covers: `logic only`, escaped: `fewer` },
        scene: {
          entities: {
            tests: tests({ tags: [{ text: `2,000 tests · 30 s`, tone: `green`, icon: `check` }] }),
            svc: $l(),
            card: card(
              `A unit test`,
              [
                `basket = [{ price: 9.99, qty: 3 }]`,
                `total(basket, "SAVE10")`,
                `= expect 26.97  ✓`,
                `# no database, no network, ~1 ms`,
              ],
              `flask`,
            ),
          },
          links: { ts: links.ts() },
          flows: [requestFlow([`ts`], 3.4)],
        },
      },
      {
        short: `Test doubles`,
        chapter: `technique`,
        title: `Test doubles stand in for the rest`,
        body: [
          `Checkout can’t run without its dependencies, so tests swap them for <span class="term">test doubles</span>: a <b>fake</b> database that lives in memory, a <b>stub</b> provider that always answers “approved”, a <b>mock</b> that records whether a card was charged exactly once.`,
          `The catch: a double only knows what you told it. If the real provider renames a field, every unit test still passes.`,
        ],
        callout: {
          kind: `warn`,
          text: `Doubles make tests fast and repeatable, and they can quietly drift from reality. Something has to test against the real thing too.`,
        },
        changes: [`+ Fake database, stub provider, stub Inventory`],
        metrics: { feedback: `30 s`, covers: `logic only`, escaped: `fewer` },
        scene: {
          entities: {
            tests: tests({ tags: [{ text: `2,000 tests · 30 s`, tone: `green`, icon: `check` }] }),
            svc: $l(),
            fdb: fakeDb(),
            fpay: paymentStub(),
            finv: inventoryStub(),
          },
          links: {
            ts: links.ts(),
            sd_fake: links.sd(`fdb`, { style: `dashed` }),
            sp: links.sp(`fpay`, { style: `dashed` }),
            si_fake: links.si(`finv`, { style: `dashed` }),
          },
          flows: [requestFlow([`ts`, `sd_fake`], 1.4), requestFlow([`ts`, `sp`], 1), requestFlow([`ts`, `si_fake`], 1)],
        },
      },
      {
        short: `Integration`,
        chapter: `solution`,
        title: `Integration tests: the real neighbours`,
        body: [
          `An <span class="term">integration test</span> runs Checkout against a real database — started fresh in a container for the test run — and checks what actually lands in the tables. SQL typos, broken migrations and mismatched types show up here, not in production.`,
          `The payment provider stays stubbed (you can’t charge real cards), but you can call its sandbox in a separate, smaller suite.`,
        ],
        callout: {
          kind: `tip`,
          text: `Containers made this cheap: a throwaway PostgreSQL or Kafka takes seconds to start, so integration tests can run on every change too.`,
        },
        changes: [
          `~ Fake database → real database in a container`,
          `~ Tests take seconds, not milliseconds`,
        ],
        metrics: { feedback: `4 min`, covers: `+ database queries`, escaped: `fewer` },
        scene: {
          entities: {
            tests: tests({ tags: [{ text: `200 tests · 4 min`, tone: `green`, icon: `check` }] }),
            svc: $l(),
            db: ordersDb({ label: `orders db · real, in a container` }),
            fpay: paymentStub(`provider sandbox`),
            finv: inventoryStub(),
          },
          links: {
            ts: links.ts(),
            sd: links.sd(),
            sp: links.sp(`fpay`, { style: `dashed` }),
            si: links.si(`finv`, { style: `dashed` }),
          },
          flows: [
            requestFlow([`ts`, `sd`], 1.6, { kind: `heavy` }),
            requestFlow([`ts`, `sp`], 0.6),
            requestFlow([`ts`, `si`], 0.6),
          ],
        },
      },
      {
        short: `Contracts`,
        chapter: `technique`,
        title: `Contract tests: between teams`,
        body: [
          `Checkout depends on Inventory, which another team owns and deploys on its own schedule. If they rename <code>in_stock</code> to <code>available</code>, Checkout’s stub never notices.`,
          `A <span class="term">contract test</span> writes down what Checkout expects — this request, a response with these fields — and Inventory’s own pipeline checks every change against it. A breaking change fails in <em>their</em> build, before it ships.`,
        ],
        callout: {
          kind: `tip`,
          text: `Tools like Pact record these consumer expectations. Contracts replace most of the slow end-to-end tests that would otherwise be needed between services.`,
        },
        changes: [
          `+ Checkout’s expectations recorded as a contract`,
          `+ Inventory verifies it on every change`,
        ],
        metrics: { feedback: `4 min`, covers: `+ API contracts`, escaped: `rare` },
        scene: {
          entities: {
            tests: tests({ tags: [{ text: `200 tests · 4 min`, tone: `green`, icon: `check` }] }),
            svc: $l(),
            db: ordersDb({ label: `orders db · real, in a container` }),
            inv: inventoryService({ tags: [{ text: `verifies the contract`, tone: `green`, icon: `fileKey` }] }),
            card: card(
              `The contract`,
              [
                `GET /stock/sku-42`,
                `= 200 { "sku": "sku-42", "in_stock": 3 }`,
                `! rename in_stock → Inventory’s build fails`,
                `# checked on both sides, run separately`,
              ],
              `fileKey`,
            ),
          },
          links: {
            ts: links.ts(),
            sd: links.sd(),
            si_contract: links.si(`inv`, { style: `dashed`, label: `contract` }),
          },
          flows: [requestFlow([`ts`, `sd`], 1.4, { kind: `heavy` }), requestFlow([`si_contract`], 0.6)],
        },
      },
      {
        short: `End-to-end`,
        chapter: `solution`,
        title: `End-to-end tests: the whole journey`,
        body: [
          `An <span class="term">end-to-end test</span> drives the real system the way a user would: open the shop in a browser, add three items, enter a code, pay with a sandbox card, see the confirmation.`,
          `It is the only test that proves everything works together — and the slowest, most fragile one. A dozen of them for the journeys that make money is plenty.`,
        ],
        callout: {
          kind: `warn`,
          text: `An end-to-end test tells you something broke, not what. When one fails, the cheaper tests below it should point to the cause.`,
        },
        changes: [`+ A browser test drives the whole system`, `~ Minutes per run`],
        metrics: { feedback: `15 min`, covers: `whole system`, escaped: `rare` },
        scene: {
          entities: {
            users: users(`a test browser`),
            tests: tests({ tags: [{ text: `20 journeys · 15 min`, tone: `green`, icon: `check` }] }),
            svc: $l(),
            db: ordersDb(),
            pay: paymentService({ sub: `sandbox` }),
            inv: inventoryService(),
          },
          links: {
            tu: makeLink(`tests`, `users`, [`tests`, [`tests`, `users`], `users`], { style: `dashed` }),
            us: links.us(),
            sd: links.sd(),
            sp: links.sp(),
            si: links.si(),
          },
          flows: [
            { route: [`tu`], rate: 0.5 },
            requestFlow([`us`, `sd`], 0.9, { kind: `heavy` }),
            requestFlow([`us`, `sp`], 0.5),
            requestFlow([`us`, `si`], 0.5),
          ],
        },
      },
      {
        short: `Pyramid`,
        chapter: `insight`,
        title: `The test pyramid`,
        body: [
          `Put together, the suites form a <span class="term">test pyramid</span>: thousands of unit tests at the bottom, hundreds of integration and contract tests in the middle, a handful of end-to-end tests on top.`,
          `Lower layers are fast, precise and cheap to run on every change; higher ones are slow but closer to what users do. Push each check as low as it can go.`,
        ],
        callout: {
          kind: `insight`,
          text: `An upside-down pyramid — mostly end-to-end tests — is a common trap: an hour per run, frequent random failures, and a team that stops trusting red builds.`,
        },
        metrics: { feedback: `30 s → 15 min`, covers: `whole system`, escaped: `rare` },
        scene: {
          entities: {
            tests: tests(),
            svc: $l(),
            db: ordersDb(),
            pay: paymentService({ sub: `sandbox` }),
            inv: inventoryService(),
            card: card(
              `Three layers`,
              [
                `end-to-end      20    15 min   whole journeys`,
                `integration    200     4 min   real neighbours`,
                `= unit         2,000    30 s    one piece at a time`,
                `# fast and many at the bottom, few at the top`,
              ],
              `layers`,
            ),
          },
          links: { ts: links.ts(), sd: links.sd(), sp: links.sp(), si: links.si() },
          flows: [requestFlow([`ts`], 3), requestFlow([`ts`, `sd`], 0.9), requestFlow([`ts`, `si`], 0.5)],
        },
      },
      {
        short: `Flaky`,
        chapter: `problem`,
        title: `Case: the flaky test`,
        body: [
          `One end-to-end test fails about one run in twenty. It waits a fixed two seconds for the confirmation email, and sometimes the email takes three. People learn to press “re-run” — and when a real bug turns that test red, they re-run that too.`,
          `A <span class="term">flaky test</span> is worse than no test: it trains the team to ignore failures.`,
        ],
        callout: {
          kind: `tip`,
          text: `Fix the cause: wait for a condition instead of a fixed time, control the clock, give each test its own data, never depend on test order. Track flaky tests and fix or delete them — don’t hide them behind automatic retries.`,
        },
        changes: [`− Fails 1 run in 20 for no reason`, `− Real failures get re-run and ignored`],
        metrics: { feedback: `15 min`, covers: `whole system`, escaped: `often` },
        scene: {
          entities: {
            users: users(`a test browser`),
            tests: tests({
              tags: [{ text: `wait 2 s for the email`, tone: `red`, icon: `hourglass` }],
            }),
            svc: $l(),
            db: ordersDb(),
            pay: paymentService({ sub: `sandbox` }),
            inv: inventoryService(),
          },
          links: {
            tu: makeLink(`tests`, `users`, [`tests`, [`tests`, `users`], `users`], {
              style: `dashed`,
              fail: 0.35,
            }),
            us: links.us(),
            sd: links.sd(),
            sp: links.sp(),
            si: links.si(),
          },
          flows: [{ route: [`tu`], rate: 0.9 }, requestFlow([`us`, `sd`], 0.8), requestFlow([`us`, `sp`], 0.4)],
        },
      },
      {
        short: `Load & failure`,
        chapter: `technique`,
        title: `Testing for load and for failure`,
        body: [
          `Correct isn’t enough. A <b>load test</b> sends production-like traffic to a copy of the system and finds the point where latency turns upward (see <em>Latency & Throughput</em>) before your users do.`,
          `<b>Failure tests</b> break things on purpose — stop a database replica, slow the payment provider down — and check that timeouts, retries and failover behave as designed (see <em>Timeouts & Retries</em>).`,
        ],
        callout: {
          kind: `tip`,
          text: `The last layer runs in production itself: release to a few users first and watch the numbers. That is the canary in the next lesson.`,
        },
        changes: [
          `+ Load test: 5× normal traffic on staging`,
          `+ Failure test: payment provider slowed to 5 s`,
        ],
        metrics: { feedback: `hours · nightly`, covers: `+ load and failure`, escaped: `rare` },
        scene: {
          entities: {
            users: users(`load generator · 5× traffic`),
            svc: $l({
              ...makeCool(0.82),
              tags: [{ text: `p99 rises at 4.2×`, tone: `amber`, icon: `trendingUp` }],
            }),
            db: ordersDb({ ...makeCool(0.7) }),
            pay: paymentService({
              ...DEAD_STATE,
              dead: 0,
              tags: [{ text: `injected: 5 s delay`, tone: `red`, icon: `hourglass` }],
            }),
            inv: inventoryService(),
          },
          links: { us: links.us(), sd: links.sd(), sp: links.sp({ fail: 0.2 }), si: links.si() },
          flows: [requestFlow([`us`, `sd`], 4), requestFlow([`us`, `sp`], 1.2, { kind: `slow` }), requestFlow([`us`, `si`], 1.2)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>Unit tests</b> check one piece with doubles for the rest — fast enough to run thousands on every change.</li>
          <li><b>Integration tests</b> use real neighbours (a database in a container) to catch what doubles can’t.</li>
          <li><b>Contract tests</b> catch breaking API changes between teams, in the provider’s own build.</li>
          <li>A few <b>end-to-end tests</b> cover the journeys that matter: keep the pyramid the right way up.</li>
          <li>Fix <b>flaky</b> tests, and test for <b>load</b> and <b>failure</b>, not just correctness.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>CI/CD & Deployments</b> — running all of this on every change, and getting it to production safely.`,
        },
        metrics: { feedback: `30 s → 15 min`, covers: `whole system`, escaped: `rare` },
        scene: {
          entities: { tests: tests(), svc: $l(), db: ordersDb(), pay: paymentService({ sub: `sandbox` }), inv: inventoryService() },
          links: { ts: links.ts(), sd: links.sd(), sp: links.sp(), si: links.si() },
          flows: [requestFlow([`ts`], 3), requestFlow([`ts`, `sd`], 0.9), requestFlow([`ts`, `si`], 0.5)],
        },
      },
    ],
  };

export { lesson as testingLesson };
export default lesson;
