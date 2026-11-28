import { makeCrowd, makeDb, makeDevice, makeLink, makePanel, makeZone, cardAt, type Bag } from '@/lib/simulator/scene-builders';

const euArea = { x0: -4, x1: 16, y0: -14.5, y1: -5.5 };

const usArea = { x0: -4, x1: 16, y0: 5.5, y1: 14.5 };

const euUsersArea = { x0: 9.5, x1: 14.5, y0: -13, y1: -7 };

const usUsersArea = { x0: 9.5, x1: 14.5, y0: 7, y1: 13 };

const zones = () => ({ euz: makeZone(euArea, `EU REGION`), usz: makeZone(usArea, `US REGION`) });

const euDb = (e: Bag = {}) => makeDb(0, -10, { r: 1.9, glyph: `database`, ...e });

const usDb = (e: Bag = {}) => makeDb(0, 10, { r: 1.9, glyph: `database`, ...e });

const euUsers = (e = `EU users`) => makeCrowd(euUsersArea, 8, e);

const usUsers = (e = `US users`) => makeCrowd(usUsersArea, 8, e);

const seatsTag = (e: number, t = `paper`, n = ``) => ({ text: `seats left: ${e}${n}`, tone: t, icon: `info` });

const baseLinks = (e: Bag = {}) => ({
    ue: makeLink(`eus`, `eu`, [`eus`, `eu`], { heads: `both`, ...(e.eu || {}) }),
    uu: makeLink(`uss`, `us`, [`uss`, `us`], { heads: `both`, ...(e.us || {}) }),
  });

const replicationLink = (e: Bag = {}) => ({
    rep: makeLink(`eu`, `us`, [`eu`, `us`], { heads: `both`, label: `replication`, ...e }),
  });

const partitionLink = {
    rep: makeLink(`eu`, `us`, [`eu`, `us`], {
      heads: `none`,
      style: `cut`,
      label: `✕ network partition`,
      labelTone: `red`,
    }),
  };

const baseFlows = (e = !1) => [
    { route: [`ue`], rate: 1.8, bounce: !0 },
    { route: [`uu`], rate: 1.8, bounce: !e },
  ];

const card = cardAt({ x: -4, y: -14.5, dx: -52, dy: -262 });

const queueScene = (e: Bag = {}) => ({
    cl: makeDevice(0, -12, { label: `client` }),
    q1: makeDb(-7, 0, {
      r: 1.7,
      glyph: `database`,
      tags: [{ text: `v2`, tone: `green` }],
      ...(e.q1 || {}),
    }),
    q2: makeDb(0, 0, {
      r: 1.7,
      glyph: `database`,
      tags: [{ text: `v2`, tone: `green` }],
      ...(e.q2 || {}),
    }),
    q3: makeDb(7, 0, {
      r: 1.7,
      glyph: `database`,
      tags: [{ text: `v1 · stale`, tone: `amber` }],
      ...(e.q3 || {}),
    }),
  });

const queueLinks = {
    c1: makeLink(`cl`, `q1`, [`cl`, [`q1`, `cl`], `q1`], { heads: `both` }),
    c2: makeLink(`cl`, `q2`, [`cl`, `q2`], { heads: `both` }),
    c3: makeLink(`cl`, `q3`, [`cl`, [`q3`, `cl`], `q3`], { heads: `both` }),
  };

const capLesson = {
    id: `cap`,
    title: `CAP & Consistency`,
    summary: `When the network splits, copies of your data must choose between being right and being reachable.`,
    minutes: 12,
    level: `intermediate`,
    metrics: [`consistent`, `available`, `errors`, `conflicts`],
    legend: [`req`, `res`, `write`, [`heavy`, `quorum write`], `fail`],
    goals: [
      { text: `What a network partition is`, step: 1 },
      { text: `Choosing consistency vs availability`, step: 3 },
      { text: `Eventual consistency, conflicts and clocks`, step: 4 },
      { text: `Quorums: W + R > N`, step: 7 },
      { text: `Consistency chosen per operation`, step: 8 },
    ],
    steps: [
      {
        short: `Two regions`,
        chapter: `setup`,
        title: `Copies in two regions`,
        body: [
          `A ticket site keeps a copy of its data in Europe and in the US, so each region’s users get fast answers. Every write is replicated to the other side.`,
          `One concert has <b>1 seat left</b>, and both copies agree.`,
        ],
        callout: {
          kind: `insight`,
          text: `Replicating across regions buys speed and survival — and opens the question this lesson is about.`,
        },
        metrics: { consistent: `yes`, available: `yes`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...zones(),
            eu: euDb({ tags: [seatsTag(1)] }),
            us: usDb({ tags: [seatsTag(1)] }),
            eus: euUsers(),
            uss: usUsers(),
          },
          links: { ...baseLinks(), ...replicationLink() },
          flows: [...baseFlows(), { route: [`rep`], kind: `write`, rate: 0.8, bounce: !0 }],
        },
      },
      {
        short: `Partition`,
        chapter: `problem`,
        title: `The network splits`,
        body: [
          `An undersea cable is cut. Both regions are healthy and their users can still reach them — but the regions can’t talk to <em>each other</em>. This is a <span class="term">network partition</span>.`,
          `Now a US user wants to buy the last seat. The US copy can’t check with Europe. What should it do?`,
        ],
        callout: {
          kind: `warn`,
          text: `Partitions aren’t rare: cables, routers, misconfigurations and overloaded links all cause them.`,
        },
        changes: [`− Link between regions down`],
        metrics: { consistent: `?`, available: `?`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...zones(),
            eu: euDb({ tags: [seatsTag(1)] }),
            us: usDb({ tags: [seatsTag(1), { text: `can’t reach EU`, tone: `red`, icon: `alert` }] }),
            eus: euUsers(),
            uss: usUsers(),
          },
          links: { ...baseLinks(), ...partitionLink },
          flows: baseFlows(),
        },
      },
      {
        short: `Choose C`,
        chapter: `technique`,
        title: `Option 1: stay consistent`,
        body: [
          `Refuse what can’t be confirmed. Europe holds the primary copy, so it keeps serving; the US side rejects writes — and reads that might be stale — until the link is back.`,
          `Nobody ever sees wrong data. But US users get errors for as long as the partition lasts.`,
        ],
        callout: {
          kind: `tip`,
          text: `Choose consistency where wrong answers cost money: payments, bank balances, inventory, ticket sales.`,
        },
        changes: [`~ US side refuses requests`, `− US users see errors`],
        metrics: { consistent: `yes`, available: `partly`, errors: 50, conflicts: 0 },
        scene: {
          entities: {
            ...zones(),
            eu: euDb({ tags: [seatsTag(1)] }),
            us: usDb({
              heat: 0,
              tags: [{ text: `read-only · refusing writes`, tone: `red`, icon: `lock` }],
            }),
            eus: euUsers(),
            uss: usUsers(`US users: errors`),
          },
          links: { ...baseLinks({ us: { fail: 1 } }), ...partitionLink },
          flows: baseFlows(!0),
        },
      },
      {
        short: `Choose A`,
        chapter: `technique`,
        title: `Option 2: stay available`,
        body: [
          `Answer with what you have. Both sides keep accepting writes. Ana in Paris buys the last seat. Ben in Boston buys the last seat.`,
          `Everyone gets an answer — and the two copies now <b>disagree</b>. When the link returns, there are two sales of one seat.`,
        ],
        callout: {
          kind: `tip`,
          text: `Choose availability where a brief disagreement is fine: likes, view counts, shopping carts, social feeds.`,
        },
        changes: [`~ Both sides accept writes`, `− Same seat sold twice`],
        metrics: { consistent: `no`, available: `yes`, errors: 0, conflicts: 1 },
        scene: {
          entities: {
            ...zones(),
            eu: euDb({ tags: [seatsTag(0, `amber`, ` · sold to Ana`)] }),
            us: usDb({ tags: [seatsTag(0, `amber`, ` · sold to Ben`)] }),
            eus: euUsers(),
            uss: usUsers(),
          },
          links: { ...baseLinks(), ...partitionLink },
          flows: [
            ...baseFlows(),
            { route: [`ue`], kind: `write`, rate: 0.6 },
            { route: [`uu`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Heal`,
        chapter: `technique`,
        title: `Healing: eventual consistency`,
        body: [
          `The cable is repaired and the copies exchange what they missed. Left alone they will converge — <span class="term">eventual consistency</span> — but someone has to decide what to do with the conflict.`,
          `Options: <b>last write wins</b> (simple, silently drops one sale), or let the app merge (keep both, refund one, apologise).`,
        ],
        callout: {
          kind: `warn`,
          text: `“Last write wins” is the default in many databases. It loses data quietly — make sure that’s acceptable.`,
        },
        changes: [
          `+ Link restored`,
          `~ Copies exchange missed writes`,
          `~ Conflict resolved: Ben refunded`,
        ],
        metrics: { consistent: `yes`, available: `yes`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...zones(),
            eu: euDb({ tags: [seatsTag(0, `green`, ` · Ana`)] }),
            us: usDb({ tags: [seatsTag(0, `green`, ` · Ana`), { text: `Ben refunded`, tone: `amber` }] }),
            eus: euUsers(),
            uss: usUsers(),
          },
          links: { ...baseLinks(), ...replicationLink({ label: `catching up` }) },
          flows: [...baseFlows(), { route: [`rep`], kind: `write`, rate: 1.6, bounce: !0 }],
        },
      },
      {
        short: `Clocks`,
        chapter: `problem`,
        title: `Case: “last” by whose clock?`,
        body: [
          `Last write wins needs to know which write <em>was</em> last — and each server stamps writes with its own clock. Clocks drift. Here the US server’s clock runs 3 seconds fast.`,
          `A customer saves a delivery address through the US copy, then corrects it two seconds later through the EU copy. The correction is newer, but its timestamp is <b>smaller</b> — so when the copies sync, last write wins keeps the old address and silently throws the fix away.`,
        ],
        callout: {
          kind: `tip`,
          text: `Never order events across machines by wall-clock time. Use version numbers or <b>logical clocks</b> (Lamport timestamps, version vectors) that count events instead of reading the time — or keep both versions and let the app merge.`,
        },
        changes: [
          `+ US clock runs 3 s fast`,
          `− The newer write carries the older timestamp`,
          `− Last write wins keeps the wrong address`,
        ],
        metrics: { consistent: `yes`, available: `yes`, errors: 0, conflicts: 1 },
        scene: {
          entities: {
            ...zones(),
            eu: euDb({
              tags: [{ text: `12:00:05 · 5 Rue Cler — the fix`, tone: `green`, icon: `clock` }],
            }),
            us: usDb({
              tags: [{ text: `12:00:06 · 12 Elm St — clock +3 s`, tone: `red`, icon: `clock` }],
            }),
            eus: euUsers(),
            uss: usUsers(),
            card: card(
              `Whose clock?`,
              [
                `real 12:00:03   US saves “12 Elm St”`,
                `# stamped 12:00:06 — clock is 3 s fast`,
                `real 12:00:05   EU saves the correction`,
                `# stamped 12:00:05`,
                `! sync keeps 12:00:06: the old address`,
              ],
              `clock`,
            ),
          },
          links: { ...baseLinks(), ...replicationLink({ label: `sync · highest timestamp wins` }) },
          flows: [...baseFlows(), { route: [`rep`], kind: `write`, rate: 1.2, bounce: !0 }],
        },
      },
      {
        short: `CAP`,
        chapter: `insight`,
        title: `What CAP actually says`,
        body: [
          `The <span class="term">CAP theorem</span>: when a network <b>P</b>artition happens, a replicated system must give up either <b>C</b>onsistency (every read sees the latest write, as if there were only one copy) or <b>A</b>vailability (every request to a working server gets an answer).`,
          `You don’t “pick two of three” — partitions will happen, so the real choice is what to do when they do.`,
          `<small>CAP’s “consistency” is what database people call <b>linearizability</b>. It is not the C in ACID, which is about a transaction keeping your data’s rules intact.</small>`,
        ],
        callout: {
          kind: `insight`,
          text: `PACELC adds the everyday half: even without a partition, keeping copies in sync costs latency. Consistency is never free.`,
        },
        metrics: { consistent: `yes`, available: `yes`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...zones(),
            eu: euDb({ tags: [seatsTag(0)] }),
            us: usDb({ tags: [seatsTag(0)] }),
            eus: euUsers(),
            uss: usUsers(),
            card: card(
              `During a partition, choose`,
              [
                `C — refuse, never be wrong`,
                `    payments, inventory, bookings`,
                `A — answer, maybe be stale`,
                `    likes, carts, feeds`,
                `# without a partition: latency vs consistency`,
              ],
              `scale`,
            ),
          },
          links: { ...baseLinks(), ...replicationLink() },
          flows: [...baseFlows(), { route: [`rep`], kind: `write`, rate: 0.8, bounce: !0 }],
        },
      },
      {
        short: `Quorums`,
        chapter: `technique`,
        title: `Quorums: tune the trade-off`,
        body: [
          `Many databases let you choose per request. With <b>N</b> = 3 copies, a write waits for <b>W</b> copies to confirm and a read asks <b>R</b> copies, using the newest answer.`,
          `If <b>W + R > N</b>, every read overlaps at least one copy that saw the latest write — here W = 2 and R = 2, so a read always reaches a <code>v2</code> even though one copy is stale.`,
        ],
        callout: {
          kind: `tip`,
          text: `W = 1, R = 1: fast and available, possibly stale. W = 3: every copy must answer — consistent but fragile. Cassandra, Riak and ScyllaDB expose these knobs per request; DynamoDB offers the simpler choice of eventual or strongly consistent reads.`,
        },
        changes: [`+ 3 copies (N = 3)`, `~ Writes wait for 2 (W = 2)`, `~ Reads ask 2 (R = 2)`],
        metrics: { consistent: `yes`, available: `yes`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...queueScene(),
            card: makePanel(
              { x: 7, y: 0, z: 0, dx: 60, dy: -220 },
              `N = 3, W = 2, R = 2`,
              [
                `write → wait for 2 of 3`,
                `read  → ask 2, keep the newest`,
                `= W + R = 4 > 3: always overlaps`,
              ],
              { icon: `layers` },
            ),
          },
          links: queueLinks,
          flows: [
            {
              fanout: !0,
              routes: [{ path: [`c1`] }, { path: [`c2`] }],
              kind: `write`,
              rate: 0.5,
              bounce: !0,
            },
            { fanout: !0, routes: [{ path: [`c2`] }, { path: [`c3`] }], rate: 0.5, bounce: !0 },
          ],
        },
      },
      {
        short: `Per operation`,
        chapter: `technique`,
        title: `Case: a payment and a like`,
        body: [
          `One app, two very different writes. A <b>like</b> can be confirmed by one copy and spread later (W = 1, R = 1): fast, always available, and nobody minds if a count is briefly off.`,
          `Recording a <b>payment</b> (the big square) uses a majority for both the write and every read (W = 2, R = 2): slower, and it fails if two copies can’t be reached — rather than risk anyone reading a stale “unpaid”.`,
        ],
        callout: {
          kind: `tip`,
          text: `You don’t pick consistency once for the whole system. Pick it per operation, by asking what a wrong answer would cost.`,
        },
        changes: [`+ Likes: W = 1, R = 1`, `+ Payments: W = 2, R = 2`],
        metrics: { consistent: `per op`, available: `per op`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...queueScene({ q3: { tags: [{ text: `v2`, tone: `green` }] } }),
            card: makePanel(
              { x: 7, y: 0, z: 0, dx: 60, dy: -220 },
              `Choose per operation`,
              [
                `like      W = 1, R = 1 · fast, eventual`,
                `payment   W = 2, R = 2 · slower, safe`,
                `= cost of being wrong decides`,
              ],
              { icon: `scale` },
            ),
          },
          links: queueLinks,
          flows: [
            { route: [`c1`], kind: `req`, rate: 1.2, bounce: !0 },
            {
              fanout: !0,
              routes: [{ path: [`c1`] }, { path: [`c2`] }, { path: [`c3`] }],
              kind: `heavy`,
              rate: 0.35,
              bounce: !0,
              speed: 0.7,
            },
          ],
        },
      },
      {
        short: `Models`,
        chapter: `insight`,
        title: `Consistency is a spectrum`,
        body: [
          `“Consistent” isn’t yes or no. Between the strongest (<span class="term">linearizable</span>: everyone sees the latest write) and eventual sit useful promises: <b>read-your-writes</b> (you always see your own changes), <b>monotonic reads</b> (time never goes backwards for you), and <b>causal</b> consistency (replies never appear before the message they answer).`,
          `Weaker promises are cheaper and more available. Pick the weakest one your users won’t notice.`,
        ],
        callout: {
          kind: `insight`,
          text: `Many “eventual” systems offer read-your-writes per session — enough for most apps.`,
        },
        metrics: { consistent: `per op`, available: `yes`, errors: 0, conflicts: 0 },
        scene: {
          entities: {
            ...queueScene(),
          },
          links: queueLinks,
          flows: [
            {
              fanout: !0,
              routes: [{ path: [`c1`] }, { path: [`c2`] }],
              kind: `write`,
              rate: 0.5,
              bounce: !0,
            },
            { fanout: !0, routes: [{ path: [`c2`] }, { path: [`c3`] }], rate: 0.5, bounce: !0 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>A <b>partition</b> splits copies that can each still serve users.</li>
          <li>During one, choose <b>consistency</b> (refuse) or <b>availability</b> (answer, maybe stale).</li>
          <li>Available systems are <b>eventually consistent</b> and must resolve conflicts — without trusting wall clocks.</li>
          <li><b>Quorums</b> (W + R > N) tune the trade-off per request.</li>
          <li>Pick the <b>weakest consistency</b> each operation can tolerate.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Consensus & Leader Election</b> — how a group of servers agrees on one truth, even when some of them can’t be reached.`,
        },
        metrics: { consistent: `yes`, available: `yes`, errors: 0, conflicts: 0 },
        scene: {
          entities: { ...queueScene() },
          links: queueLinks,
          flows: [
            {
              fanout: !0,
              routes: [{ path: [`c1`] }, { path: [`c2`] }],
              kind: `write`,
              rate: 0.5,
              bounce: !0,
            },
            { fanout: !0, routes: [{ path: [`c2`] }, { path: [`c3`] }], rate: 0.5, bounce: !0 },
          ],
        },
      },
    ],
  };

export { capLesson as capLesson };
export default capLesson;
