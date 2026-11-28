import { makeBlock, makeCrowd, makeDb, makeLink, makePanel, makeZone, cardAt, type Bag } from '@/lib/simulator/scene-builders';

const customersArea = { x0: -4.5, x1: 4.5, y0: -23, y1: -17 };

const customers = (e = `customers`) => makeCrowd(customersArea, 12, e);

const serviceX = { ord: -10, cou: 0, pay: 10 };

const gateway = (e: Bag = {}) =>
    makeBlock(0, -10, { color: `orange`, glyph: `signpost`, label: [`API`, `Gateway`], ...e });

const ordersService = (e: Bag = {}) => makeBlock(serviceX.ord, 2, { glyph: `cart`, label: [`Orders`], ...e });

const couriersService = (e: Bag = {}) => makeBlock(serviceX.cou, 2, { color: `green`, glyph: `car`, label: [`Couriers`], ...e });

const paymentsService = (e: Bag = {}) =>
    makeBlock(serviceX.pay, 2, { color: `purple`, glyph: `creditCard`, label: [`Payments`], ...e });

const ordersDb = (e: Bag = {}) => makeDb(serviceX.ord, 12, { label: `orders`, ...e });

const locationsDb = (e: Bag = {}) => makeDb(serviceX.cou, 12, { label: `locations`, ...e });

const paymentsDb = (e: Bag = {}) => makeDb(serviceX.pay, 12, { label: `payments`, ...e });

const baseEntities = (e: Bag = {}) => ({
    users: customers(),
    gw: gateway(),
    ord: ordersService(),
    cou: couriersService(),
    pay: paymentsService(),
    odb: ordersDb(),
    cdb: locationsDb(),
    pdb: paymentsDb(),
    ...e,
  });

const serviceLink = (e: string) =>
    makeLink(`gw`, e, e === `cou` ? [`gw`, e] : [`gw`, [`gw`, -4], [e, -4], e], { heads: `both` });

const baseLinks = (e: Bag = {}) => ({
    ug: makeLink(`users`, `gw`, [`users`, `gw`], { heads: `both` }),
    go: serviceLink(`ord`),
    gc: serviceLink(`cou`),
    gp: serviceLink(`pay`),
    oo: makeLink(`ord`, `odb`, [`ord`, `odb`], { heads: `both` }),
    cc: makeLink(`cou`, `cdb`, [`cou`, `cdb`], { heads: `both` }),
    pp: makeLink(`pay`, `pdb`, [`pay`, `pdb`], { heads: `both` }),
    ev: makeLink(`ord`, `cou`, [`ord`, `cou`], { style: `dashed` }),
    ...e,
  });

const baseFlows = () => [
    { route: [`ug`], rate: 2.2, bounce: !0 },
    {
      routes: [{ path: [`go`, `oo`] }, { path: [`gc`, `cc`] }, { path: [`gp`, `pp`] }],
      rate: 2.2,
      bounce: !0,
    },
    { route: [`ev`], kind: `msg`, rate: 0.7 },
  ];

const ordersArea = { x0: -17.5, x1: 5.5, y0: -8.5, y1: 16.5 };

const serviceBlock = (e: number, t: number, n: string, r: string[], i: Bag = {}) => makeBlock(e, t, { s: 4.2, h: 46, glyph: n, label: r, ...i });

const ordersInside = (e: Bag = {}) => ({
    oz: makeZone(ordersArea, `ORDERS SERVICE · INSIDE`),
    gw: gateway({ x: -6, y: -12 }),
    ctl: serviceBlock(-6, -3, `braces`, [`Controller`], { sub: `HTTP in` }),
    svc: serviceBlock(-6, 5, `workflow`, [`Order`, `Service`]),
    repo: serviceBlock(-14, 13, `database`, [`Repository`], { color: `yellow` }),
    payc: serviceBlock(2, 13, `creditCard`, [`Payment`, `Client`], { color: `yellow` }),
    odb: makeDb(-12, 20, { label: `orders table` }),
    pay: makeBlock(4, 20, {
      color: `purple`,
      glyph: `creditCard`,
      label: [`Payments`],
      sub: `another service`,
      dim: 0.6,
    }),
    ...e,
  });

const ordersInsideLinks = (e: Bag = {}) => ({
    gc_ctl: makeLink(`gw`, `ctl`, [`gw`, `ctl`], { heads: `both` }),
    cs: makeLink(`ctl`, `svc`, [`ctl`, `svc`], { heads: `both` }),
    sr: makeLink(`svc`, `repo`, [`svc`, [`svc`, 9], [`repo`, 9], `repo`], { heads: `both` }),
    sp: makeLink(`svc`, `payc`, [`svc`, [`svc`, 9], [`payc`, 9], `payc`], { heads: `both` }),
    ro: makeLink(`repo`, `odb`, [`repo`, `odb`], { heads: `both` }),
    pp_client: makeLink(`payc`, `pay`, [`payc`, `pay`], { heads: `both` }),
    ...e,
  });

const ordersInsideFlows = () => [
    {
      routes: [{ path: [`gc_ctl`, `cs`, `sr`, `ro`] }, { path: [`gc_ctl`, `cs`, `sp`, `pp_client`] }],
      rate: 1.4,
      bounce: !0,
    },
  ];

const card = cardAt({ x: 0, y: 0 });

const hldFacts = { zoom: `whole system`, unit: `services · stores · queues`, output: `architecture diagram` };

const lldFacts = { zoom: `one service`, unit: `classes · tables · states`, output: `class & schema design` };

// --- design ---
const hldLldLesson = {
    id: `hld-lld`,
    title: `HLD & LLD`,
    summary: `The same system at two zoom levels: the map of services, and the inside of one of them.`,
    minutes: 8,
    level: `beginner`,
    metrics: [`zoom`, `unit`, `output`],
    legend: [`req`, `res`, [`msg`, `event`]],
    goals: [
      { text: `What high-level design decides`, step: 1 },
      { text: `What low-level design decides`, step: 3 },
      { text: `Contracts: where the two meet`, step: 5 },
      { text: `How a design session moves between them`, step: 6 },
    ],
    steps: [
      {
        short: `Two levels`,
        chapter: `setup`,
        title: `One system, two zoom levels`,
        body: [
          `A food-delivery app. From far away it is a handful of services — Orders, Couriers, Payments — each with its own data, talking through an API gateway and a stream of events.`,
          `Up close, each of those boxes is a program of its own, with classes, tables and rules. System design works at both distances, and they have names: <span class="term">high-level design</span> (HLD) and <span class="term">low-level design</span> (LLD).`,
        ],
        callout: {
          kind: `insight`,
          text: `Neither is “more real”. They answer different questions, for different readers, and change at different speeds.`,
        },
        metrics: hldFacts,
        scene: { entities: baseEntities(), links: baseLinks(), flows: baseFlows() },
      },
      {
        short: `The map`,
        chapter: `technique`,
        title: `High-level design: the map`,
        body: [
          `HLD decides <b>what the parts are and how they connect</b>: which services exist and what each owns, how they talk (a call, or an event), where each kind of data lives, and what happens when traffic grows or a part fails.`,
          `It is the level of every lesson so far. Its output is a diagram like this one, with the reasoning written next to it.`,
        ],
        callout: {
          kind: `tip`,
          text: `A good HLD fits on one page. If a box needs a paragraph to explain, that paragraph belongs to the LLD of that box.`,
        },
        changes: [`+ The whole system is the unit of design`],
        metrics: hldFacts,
        scene: {
          entities: baseEntities({
            sz: makeZone({ x0: -14, x1: 14, y0: -14, y1: 16 }, `HLD · THE WHOLE SYSTEM`),
          }),
          links: baseLinks(),
          flows: baseFlows(),
        },
      },
      {
        short: `Trade-offs`,
        chapter: `tradeoff`,
        title: `HLD decisions are trade-offs`,
        body: [
          `Placing an order should not wait for a courier to be found, so Orders <b>publishes an event</b> and Couriers picks it up when it can (see <em>Pub/Sub & Events</em>).`,
          `Payments needs transactions, so it gets a relational database. Couriers send their location every few seconds — tens of thousands of writes a second, each overwriting the last — so that store is a fast key–value one. Each choice comes from the numbers and from what the data needs.`,
        ],
        callout: {
          kind: `insight`,
          text: `Every arrow and every store on an HLD diagram is a decision with an alternative. Be ready to say what you gave up.`,
        },
        changes: [
          `~ Orders → Couriers: an event, not a call`,
          `~ Payments: SQL · locations: key–value`,
        ],
        metrics: hldFacts,
        scene: {
          entities: baseEntities({
            pdb: paymentsDb({ tags: [{ text: `SQL`, icon: `lock` }] }),
            cdb: locationsDb({ tags: [{ text: `key–value`, icon: `zap` }] }),
            card: card(
              `Decisions at this level`,
              [
                `Orders → Couriers   an event, not a call`,
                `payments           SQL: transactions`,
                `courier locations  key–value: 40k writes/s`,
                `# each one has an alternative you gave up`,
              ],
              `scale`,
            ),
          }),
          links: baseLinks({
            ev: makeLink(`ord`, `cou`, [`ord`, `cou`], { style: `dashed`, label: `OrderPlaced event` }),
          }),
          flows: baseFlows(),
        },
      },
      {
        short: `Zoom in`,
        chapter: `solution`,
        title: `Low-level design: inside one box`,
        body: [
          `Now open the Orders box. LLD decides <b>how one component is built</b>: the modules or classes it is made of, the interfaces between them, its tables and indexes, its algorithms and its error handling.`,
          `Here a controller takes HTTP requests, an order service holds the rules, a repository talks to the database, and a client wraps the calls to Payments.`,
        ],
        callout: {
          kind: `tip`,
          text: `Keeping the database and other services behind small interfaces (the yellow parts) is what makes the core logic easy to test — see <em>Testing</em>.`,
        },
        changes: [
          `− The rest of the system`,
          `+ Inside Orders: controller, service, repository, payment client`,
        ],
        metrics: lldFacts,
        scene: { entities: ordersInside(), links: ordersInsideLinks(), flows: ordersInsideFlows() },
      },
      {
        short: `LLD decisions`,
        chapter: `technique`,
        title: `LLD decisions: states, schemas, edge cases`,
        body: [
          `An order moves through states, and LLD pins down which moves are allowed: it can be cancelled while <code>placed</code> or <code>paid</code>, but not once the kitchen has started.`,
          `It also settles the table (columns, types, an index on <code>(user_id, created_at)</code> for “my orders”) and the awkward cases: what if the payment call times out, or the same order arrives twice?`,
        ],
        callout: {
          kind: `insight`,
          text: `Most production bugs live at this level: a state change nobody allowed for, a missing index, a retry that charges twice.`,
        },
        changes: [
          `+ Order state machine`,
          `+ Table and index design`,
          `+ Idempotency key on POST /orders`,
        ],
        metrics: lldFacts,
        scene: {
          entities: ordersInside({
            svc: serviceBlock(-6, 5, `workflow`, [`Order`, `Service`], {
              tags: [{ text: `state machine`, icon: `flow` }],
            }),
            odb: makeDb(-12, 20, {
              label: `orders table`,
              tags: [{ text: `index (user_id, created_at)`, icon: `listOrdered` }],
            }),
            card: card(
              `Order states`,
              [
                `placed → paid → cooking → on the way → delivered`,
                `= cancel: only from placed or paid`,
                `! cooking → cancelled: not allowed`,
                `# retries reuse the idempotency key`,
              ],
              `flow`,
            ),
          }),
          links: ordersInsideLinks(),
          flows: ordersInsideFlows(),
        },
      },
      {
        short: `Contracts`,
        chapter: `insight`,
        title: `Where they meet: contracts`,
        body: [
          `The two levels meet at the edges of each box. HLD fixes what a component <b>promises</b> — its API and the events it publishes. LLD decides <b>how</b> it keeps that promise.`,
          `That split is what lets teams work independently: Orders can rewrite everything inside its box, as long as <code>POST /orders</code> and <code>OrderPlaced</code> keep meaning the same thing.`,
        ],
        callout: {
          kind: `tip`,
          text: `Changing a contract is an HLD change: other teams must agree, and old and new versions must work side by side for a while (see <em>REST, RPC & GraphQL</em> on versioning).`,
        },
        changes: [`+ The contract at the edge of the service`],
        metrics: { zoom: `the seams`, unit: `APIs · events`, output: `API contract` },
        scene: {
          entities: ordersInside({
            card: card(
              `The promise`,
              [
                `POST /orders  { items, address }`,
                `  Idempotency-Key: 7f3a…`,
                `= 201 { order_id, status: "placed" }`,
                `event OrderPlaced { order_id, items }`,
              ],
              `braces`,
            ),
          }),
          links: ordersInsideLinks({
            gc_ctl: makeLink(`gw`, `ctl`, [`gw`, `ctl`], {
              heads: `both`,
              label: `the contract`,
              labelTone: `green`,
            }),
          }),
          flows: ordersInsideFlows(),
        },
      },
      {
        short: `Top-down`,
        chapter: `tradeoff`,
        title: `Case: designing at the wrong level`,
        body: [
          `Asked to design this app in an interview, one candidate spends twenty minutes on class diagrams and never mentions that courier locations arrive 40,000 times a second. Another draws perfect boxes, but can’t say how an order avoids being charged twice.`,
          `Work <b>top-down</b>: requirements, rough numbers, the HLD — then dive into the one or two places where the hard problems are, and do <em>those</em> at the LLD level.`,
        ],
        callout: {
          kind: `tip`,
          text: `A design session usually runs: requirements → estimates → API → data model → HLD → deep dives → failure cases. The walkthroughs that follow use exactly this order.`,
        },
        changes: [`~ Back to the whole system`, `+ Deep dives: location writes, double charges`],
        metrics: {
          zoom: `both, top-down`,
          unit: `the whole, then the risky parts`,
          output: `design with deep dives`,
        },
        scene: {
          entities: baseEntities({
            cdb: locationsDb({ tags: [{ text: `deep dive`, tone: `amber`, icon: `zoomIn` }] }),
            pay: paymentsService({ tags: [{ text: `deep dive`, tone: `amber`, icon: `zoomIn` }] }),
            card: card(
              `A design session`,
              [
                `1  requirements      what must it do?`,
                `2  estimates         how much of it?`,
                `3  API + data model`,
                `4  high-level design`,
                `= 5  deep dives  (LLD where it’s risky)`,
                `6  failures and trade-offs`,
              ],
              `listOrdered`,
            ),
          }),
          links: baseLinks({ ev: makeLink(`ord`, `cou`, [`ord`, `cou`], { style: `dashed` }) }),
          flows: baseFlows(),
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<table class="compare">
          <thead><tr><th></th><th>HLD</th><th>LLD</th></tr></thead>
          <tbody>
            <tr><td>Zoom</td><td>Whole system</td><td>One component</td></tr>
            <tr><td>Parts</td><td>Services, stores, queues</td><td>Classes, tables, states</td></tr>
            <tr><td>Decides</td><td>What talks to what, where data lives</td><td>How each part works inside</td></tr>
            <tr><td>Changes</td><td>Rarely, with agreement</td><td>Often, within a team</td></tr>
          </tbody>
        </table>`,
          `This course works at the HLD level and dips into LLD where a decision depends on it. LLD — object-oriented design, design patterns — is a subject of its own.`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Design a URL Shortener</b> — the first full walkthrough, from a one-line brief to a finished design.`,
        },
        metrics: hldFacts,
        scene: { entities: baseEntities(), links: baseLinks(), flows: baseFlows() },
      },
    ],
  };

export { hldLldLesson as hldLldLesson };
export default hldLldLesson;
