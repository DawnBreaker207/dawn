// @ts-nocheck
import {
  DEAD_STATE,
  makeBlock,
  makeDb,
  makeDevice,
  makeLink,
  makePanel
} from '@/lib/simulator/scene-builders';

const Wc = {
    fl: { x: -9, color: `blue`, glyph: `plane`, label: [`Flights`] },
    ho: { x: 0, color: `yellow`, glyph: `hotel`, label: [`Hotels`] },
    car: { x: 9, color: `green`, glyph: `car`, label: [`Cars`] },
  };

const Gc = Object.keys(Wc);

const Kc = (e = []) => makeDevice(0, -20, { label: `traveller`, tags: e });

const qc = (e = {}) =>
    makeBlock(0, -9, { color: `orange`, glyph: `route`, label: [`Trip`, `Service`], pills: `below`, ...e });

const Jc = (e = {}) =>
    Object.fromEntries(Gc.map((t) => [t, makeBlock(Wc[t].x, 2, { ...Wc[t], ...(e[t] || {}) })]));

const Yc = () =>
    Object.fromEntries(Gc.map((e) => [`${e}db`, makeDb(Wc[e].x, 11, { r: 1.5, h: 30, label: `` })]));

const R = {
    ut: { ut: makeLink(`trav`, `trip`, [`trav`, `trip`], { heads: `both` }) },
    calls: (e = `trip`, t = {}) =>
      Object.fromEntries(
        Gc.map((n) => [`${e[0]}${n}`, makeLink(e, n, [e, [n, e], n], { heads: `both`, ...(t[n] || {}) })]),
      ),
    dbs: () =>
      Object.fromEntries(
        Gc.map((e) => [`d${e}`, makeLink(e, `${e}db`, [e, `${e}db`], { heads: `both` })]),
      ),
  };

const Xc = (e) => ({ text: `${e} booked`, tone: `green`, icon: `check` });

const Zc = (e, t, n) => makePanel({ x: 9, y: 11, z: 0, dx: -30, dy: -195 }, e, t, { icon: n });

const Qc = (e = `t`, t = {}) =>
    Gc.map((n) => ({ route: [`${e}${n}`, `d${n}`], rate: 0.6, bounce: !0, ...(t[n] || {}) }));

const $c = {
    id: `sagas`,
    title: `Sagas & Distributed Transactions`,
    summary: `One action, several services, several databases: how to keep it all-or-nothing without one big transaction.`,
    minutes: 13,
    level: `advanced`,
    metrics: [`allOrNothing`, `blocked`, `coord`],
    legend: [
      `req`,
      `res`,
      [`ping`, `prepare`],
      [`write`, `commit / step`],
      [`kill`, `compensation`],
      `fail`,
    ],
    goals: [
      { text: `Why one transaction can’t span services`, step: 0 },
      { text: `Two-phase commit and why it blocks`, step: 2 },
      { text: `Sagas and compensating actions`, step: 3 },
      { text: `Orchestration vs choreography`, step: 5 },
      { text: `Failing undos and unknown outcomes`, step: 9 },
    ],
    steps: [
      {
        short: `Half a trip`,
        chapter: `problem`,
        title: `One trip, three databases`,
        body: [
          `A traveller books a trip: a flight, a hotel and a rental car. Each lives in a different service with its own database (database per service, from the previous lessons).`,
          `The trip service books the flight — done. The hotel — done. The car — <b>no cars left</b>. Now the traveller has a flight and a hotel they can’t use, and has been charged for both.`,
        ],
        callout: {
          kind: `warn`,
          text: `BEGIN … COMMIT only works inside one database. Across services, there is no built-in “undo everything”.`,
        },
        metrics: { allOrNothing: `no`, blocked: `—`, coord: `none` },
        scene: {
          entities: {
            trav: Kc([{ text: `flight + hotel, no car`, tone: `red`, icon: `alert` }]),
            trip: qc(),
            ...Jc({
              fl: { tags: [Xc(`flight`)] },
              ho: { tags: [Xc(`room`)] },
              car: { tags: [{ text: `no cars left`, tone: `red`, icon: `alert` }] },
            }),
            ...Yc(),
          },
          links: { ...R.ut, ...R.calls(`trip`, { car: { fail: 1 } }), ...R.dbs() },
          flows: [
            { route: [`ut`], rate: 0.6, bounce: !0 },
            ...Qc(`t`, { car: { route: [`tcar`], bounce: !1 } }),
          ],
        },
      },
      {
        short: `2PC`,
        chapter: `technique`,
        title: `Two-phase commit`,
        body: [
          `A classic fix is <span class="term">two-phase commit</span> (2PC). Phase 1: a coordinator asks every participant to <b>prepare</b> — do the work, lock the rows, and promise it can commit (the pings). Phase 2: if all said yes, it tells everyone to <b>commit</b>; if anyone said no, everyone rolls back.`,
          `The car service votes no, so nothing is booked anywhere. All or nothing.`,
        ],
        callout: {
          kind: `tip`,
          text: `2PC is used inside some databases and with XA transactions. It needs every participant to support it — most web APIs and many NoSQL stores don’t.`,
        },
        changes: [
          `~ Trip service becomes a 2PC coordinator`,
          `+ Prepare → vote → commit or roll back`,
        ],
        metrics: { allOrNothing: `yes`, blocked: `during commit`, coord: `2PC` },
        scene: {
          entities: {
            trav: Kc([{ text: `no car → nothing booked`, tone: `amber` }]),
            trip: qc({
              label: [`Coordinator`],
              tags: [
                { text: `votes: yes · yes · no → roll back`, tone: `amber`, icon: `listOrdered` },
              ],
            }),
            ...Jc({
              fl: { tags: [{ text: `prepared ✓` }] },
              ho: { tags: [{ text: `prepared ✓` }] },
              car: { tags: [{ text: `vote: no`, tone: `red` }] },
            }),
            ...Yc(),
          },
          links: { ...R.ut, ...R.calls(), ...R.dbs() },
          flows: [
            {
              fanout: !0,
              routes: Gc.map((e) => ({ path: [`t${e}`] })),
              kind: `ping`,
              rate: 0.5,
              bounce: !0,
            },
            { fanout: !0, routes: Gc.map((e) => ({ path: [`t${e}`] })), kind: `kill`, rate: 0.25 },
          ],
        },
      },
      {
        short: `Blocked`,
        chapter: `problem`,
        title: `When the coordinator dies`,
        body: [
          `The weakness: after preparing, participants must wait for the coordinator’s decision. If it crashes right then, flights and hotels sit “prepared”, holding locks on seats and rooms, unable to commit or roll back on their own.`,
          `Other travellers trying to book those seats and rooms wait too — until the coordinator recovers. (The trip itself stays all-or-nothing; it just can’t finish.)`,
        ],
        callout: {
          kind: `warn`,
          text: `2PC is a blocking protocol: one slow or dead coordinator can freeze every participant. Across services and the internet, that’s usually unacceptable.`,
        },
        changes: [`− Coordinator crashed after prepare`, `− Seats and rooms stay locked`],
        metrics: { allOrNothing: `yes`, blocked: `3 services`, coord: `2PC` },
        scene: {
          entities: {
            trav: Kc([{ text: `waiting…`, tone: `amber`, icon: `hourglass` }]),
            trip: qc({ ...DEAD_STATE, label: [`Coordinator`] }),
            ...Jc({
              fl: { heat: 0.4, tags: [{ text: `locked`, tone: `red`, icon: `lock` }] },
              ho: { heat: 0.4, tags: [{ text: `locked`, tone: `red`, icon: `lock` }] },
              car: { heat: 0.4, tags: [{ text: `locked`, tone: `red`, icon: `lock` }] },
            }),
            ...Yc(),
          },
          links: {
            ...R.ut,
            ...R.calls(`trip`, {
              fl: { style: `off` },
              ho: { style: `off` },
              car: { style: `off` },
            }),
            ...R.dbs(),
          },
          flows: [{ route: [`ut`], rate: 0.6, bounce: !0, hold: 2 }],
        },
      },
      {
        short: `Saga`,
        chapter: `solution`,
        title: `A saga: commit step by step, undo on failure`,
        body: [
          `A <span class="term">saga</span> splits the trip into local transactions that each commit immediately: book flight, then book hotel, then rent car. Nothing is held open.`,
          `Every step has a <b>compensating action</b> that semantically undoes it. When the car fails, the saga runs them in reverse: cancel the hotel, then cancel the flight (the red rings).`,
        ],
        callout: {
          kind: `insight`,
          text: `A saga trades isolation for availability: no locks are held across services, but the system is briefly in between states.`,
        },
        changes: [
          `~ Each step commits locally`,
          `+ Compensations: cancel hotel ← cancel flight`,
          `~ No locks held across services`,
        ],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `saga` },
        scene: {
          entities: {
            trav: Kc([{ text: `no car → fully refunded`, tone: `green`, icon: `check` }]),
            trip: qc(),
            ...Jc({
              fl: { tags: [{ text: `booked → cancelled`, tone: `amber`, icon: `undo` }] },
              ho: { tags: [{ text: `booked → cancelled`, tone: `amber`, icon: `undo` }] },
              car: { tags: [{ text: `no cars left`, tone: `red`, icon: `alert` }] },
            }),
            ...Yc(),
          },
          links: { ...R.ut, ...R.calls(`trip`, { car: { fail: 1 } }), ...R.dbs() },
          flows: [
            ...Qc(`t`, { car: { route: [`tcar`], bounce: !1 } }),
            { route: [`tho`], kind: `kill`, rate: 0.4 },
            { route: [`tfl`], kind: `kill`, rate: 0.4 },
          ],
        },
      },
      {
        short: `Orchestration`,
        chapter: `technique`,
        title: `Orchestration: one service runs the saga`,
        body: [
          `In an <b>orchestrated</b> saga, one component — the orchestrator — is a small state machine: it tells each service what to do next, waits for the answer, and decides whether to continue or compensate.`,
          `It saves every state change to its own database, so if it crashes it resumes exactly where it stopped.`,
        ],
        callout: {
          kind: `tip`,
          text: `Workflow engines such as Temporal, AWS Step Functions and Camunda are built for this: durable, resumable, observable sagas.`,
        },
        changes: [`~ Trip service → saga orchestrator`, `+ Saga state saved after every step`],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `orchestrator` },
        scene: {
          entities: {
            trav: Kc(),
            trip: qc({
              label: [`Saga`, `Orchestrator`],
              tags: [{ text: `trip 81: hotel ✓ · car pending`, icon: `workflow` }],
            }),
            odb: makeDb(-11, -9, { r: 1.5, h: 30, glyph: `listOrdered`, label: `saga state` }),
            ...Jc({ fl: { tags: [Xc(`flight`)] }, ho: { tags: [Xc(`room`)] } }),
            ...Yc(),
          },
          links: {
            ...R.ut,
            so: makeLink(`trip`, `odb`, [`trip`, `odb`], { heads: `both` }),
            ...R.calls(),
            ...R.dbs(),
          },
          flows: [...Qc(`t`), { route: [`so`], kind: `write`, rate: 1.2 }],
        },
      },
      {
        short: `Choreography`,
        chapter: `technique`,
        title: `Choreography: services react to events`,
        body: [
          `In a <b>choreographed</b> saga there is no conductor. Flights publishes <code>FlightBooked</code>; Hotels listens, books a room and publishes <code>HotelBooked</code>; Cars listens and rents a car — or publishes <code>CarFailed</code>, which Hotels and Flights react to by cancelling.`,
          `No central component to build or run — but the flow is spread across every service, and harder to follow and change.`,
        ],
        callout: {
          kind: `insight`,
          text: `Choreography suits short sagas with few steps. As sagas grow, an orchestrator is usually easier to reason about.`,
        },
        changes: [
          `− Orchestrator`,
          `+ Event bus`,
          `~ Each service reacts to the previous step’s event`,
        ],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `events` },
        scene: {
          entities: {
            trav: Kc(),
            bus: makeBlock(0, -9, { color: `slab`, glyph: `radio`, label: [`Event`, `Bus`] }),
            ...Jc({
              fl: { tags: [{ text: `→ FlightBooked` }] },
              ho: { tags: [{ text: `→ HotelBooked` }] },
              car: { tags: [{ text: `→ CarRented` }] },
            }),
            ...Yc(),
          },
          links: {
            ub: makeLink(`trav`, `bus`, [`trav`, `bus`], { heads: `both` }),
            ...R.calls(`bus`),
            ...R.dbs(),
          },
          flows: [
            { route: [`ub`], rate: 0.5, bounce: !0 },
            { routes: Gc.map((e) => ({ path: [`b${e}`] })), kind: `msg`, rate: 1.4, bounce: !0 },
          ],
        },
      },
      {
        short: `In between`,
        chapter: `tradeoff`,
        title: `The catch: no isolation`,
        body: [
          `While a saga runs, other people can see its half-done state: the seat is taken, the hotel isn’t booked yet. And some steps can’t really be undone — an email “your flight is confirmed” has already gone out.`,
          `Design for it: use <b>pending</b> states (“reserved”, not “confirmed”), put the step most likely to fail <b>first</b>, and the hardest to undo — charging the card, sending emails — <b>last</b>.`,
        ],
        callout: {
          kind: `warn`,
          text: `A compensation is a new action, not a rollback. A refund is not the same as never having charged.`,
        },
        changes: [
          `~ Bookings start as “reserved”`,
          `~ Car availability checked first`,
          `~ Card charged last`,
        ],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `orchestrator` },
        scene: {
          entities: {
            trav: Kc([{ text: `charged only at the end`, icon: `creditCard` }]),
            trip: qc({ label: [`Saga`, `Orchestrator`] }),
            odb: makeDb(-11, -9, { r: 1.5, h: 30, glyph: `listOrdered`, label: `saga state` }),
            ...Jc({
              fl: { tags: [{ text: `seat: reserved`, tone: `amber`, icon: `clock` }] },
              ho: { tags: [{ text: `room: reserved`, tone: `amber`, icon: `clock` }] },
              car: { tags: [{ text: `checked first ✓`, tone: `green` }] },
            }),
            ...Yc(),
            card: Zc(
              `Order the steps`,
              [
                `1. check car    likely to fail → first`,
                `2. reserve flight + hotel`,
                `3. charge card   hard to undo → last`,
                `4. confirm + email`,
              ],
              `listOrdered`,
            ),
          },
          links: {
            ...R.ut,
            so: makeLink(`trip`, `odb`, [`trip`, `odb`], { heads: `both` }),
            ...R.calls(),
            ...R.dbs(),
          },
          flows: [...Qc(`t`), { route: [`so`], kind: `write`, rate: 1.2 }],
        },
      },
      {
        short: `Resume`,
        chapter: `insight`,
        title: `Case: crash and resume`,
        body: [
          `The orchestrator crashes right after Hotels booked a room — but before it saved that fact. On restart it sees “hotel: pending” and sends the booking request again.`,
          `If Hotels books a second room, the traveller pays twice. So every step carries an <b>idempotency key</b> (the saga id + step), and Hotels returns the existing booking instead of creating another.`,
        ],
        callout: {
          kind: `tip`,
          text: `Sagas are at-least-once by nature. Every step and every compensation must be safe to repeat.`,
        },
        changes: [
          `− Orchestrator restarted mid-saga`,
          `~ “book hotel” sent twice`,
          `~ Same key → same booking`,
        ],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `orchestrator` },
        scene: {
          entities: {
            trav: Kc(),
            trip: qc({
              label: [`Saga`, `Orchestrator`],
              tags: [{ text: `restarted · resuming trip 81`, tone: `amber`, icon: `replay` }],
            }),
            odb: makeDb(-11, -9, { r: 1.5, h: 30, glyph: `listOrdered`, label: `saga state` }),
            ...Jc({
              fl: { tags: [Xc(`flight`)] },
              ho: { tags: [{ text: `key 81-hotel seen → same room`, tone: `green`, icon: `key` }] },
            }),
            ...Yc(),
          },
          links: {
            ...R.ut,
            so: makeLink(`trip`, `odb`, [`trip`, `odb`], { heads: `both` }),
            ...R.calls(`trip`, { ho: { label: `book hotel · key 81-hotel`, labelAt: 0.5 } }),
            ...R.dbs(),
          },
          flows: [
            { route: [`tho`, `dho`], rate: 1.2, bounce: !0, pattern: [`req`, `slow`] },
            { route: [`so`], kind: `write`, rate: 0.8 },
          ],
        },
      },
      {
        short: `Undo fails`,
        chapter: `problem`,
        title: `Case: the undo itself fails`,
        body: [
          `The car can’t be rented, so the saga cancels the hotel — but the hotel’s API is down. Giving up isn’t an option: the traveller would be charged for a room they can’t use.`,
          `So compensations are <b>retried</b> with backoff until they succeed, and must be safe to repeat. A compensation still stuck after a few hours goes to a queue for a person to resolve.`,
        ],
        callout: {
          kind: `warn`,
          text: `A compensation must be able to succeed eventually. Never design one that can legitimately fail — and alert when one is stuck.`,
        },
        changes: [
          `− Hotel API down during “cancel hotel”`,
          `~ Retried with backoff`,
          `+ Escalated to support after 4 h`,
        ],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `orchestrator` },
        scene: {
          entities: {
            trav: Kc([{ text: `refund pending`, tone: `amber`, icon: `clock` }]),
            trip: qc({
              label: [`Saga`, `Orchestrator`],
              tags: [{ text: `cancel hotel · attempt 4`, tone: `amber`, icon: `replay` }],
            }),
            odb: makeDb(-11, -9, { r: 1.5, h: 30, glyph: `listOrdered`, label: `saga state` }),
            ...Jc({
              fl: { tags: [{ text: `cancelled ✓`, tone: `green`, icon: `undo` }] },
              ho: { ...DEAD_STATE, tags: [{ text: `API down`, tone: `red`, icon: `alert` }] },
              car: { tags: [{ text: `no cars left`, tone: `red`, icon: `alert` }] },
            }),
            ...Yc(),
          },
          links: {
            ...R.ut,
            so: makeLink(`trip`, `odb`, [`trip`, `odb`], { heads: `both` }),
            ...R.calls(`trip`, { ho: { fail: 1, label: `retry with backoff`, labelAt: 0.5 } }),
            ...R.dbs(),
          },
          flows: [
            { route: [`tho`], kind: `kill`, rate: 0.6 },
            { route: [`so`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Unknown`,
        chapter: `technique`,
        title: `Case: a timeout means “unknown”`,
        body: [
          `The call to rent the car times out. Did the car service book it before the connection dropped, or not? A timeout is not a failure — the outcome is <b>unknown</b>.`,
          `Compensating blindly could cancel a booking that never existed, or leave one that did. Instead, ask: query the car service for request <code>81-car</code>, or simply retry with the same idempotency key and get the real answer.`,
        ],
        callout: {
          kind: `tip`,
          text: `Treat every remote step as having three outcomes: succeeded, failed, unknown. Only the first two let the saga move on.`,
        },
        changes: [
          `− “rent car” timed out`,
          `~ Status unknown → query 81-car`,
          `~ Answer: booked → continue`,
        ],
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `orchestrator` },
        scene: {
          entities: {
            trav: Kc(),
            trip: qc({
              label: [`Saga`, `Orchestrator`],
              tags: [{ text: `car: unknown → asking`, tone: `amber`, icon: `info` }],
            }),
            odb: makeDb(-11, -9, { r: 1.5, h: 30, glyph: `listOrdered`, label: `saga state` }),
            ...Jc({
              fl: { tags: [Xc(`flight`)] },
              ho: { tags: [Xc(`room`)] },
              car: { tags: [{ text: `81-car: booked ✓`, tone: `green`, icon: `key` }] },
            }),
            ...Yc(),
          },
          links: {
            ...R.ut,
            so: makeLink(`trip`, `odb`, [`trip`, `odb`], { heads: `both` }),
            ...R.calls(`trip`, { car: { label: `status of 81-car?`, labelAt: 0.5 } }),
            ...R.dbs(),
          },
          flows: [
            { route: [`tcar`], rate: 0.9, bounce: !0, pattern: [`slow`, `req`] },
            { route: [`so`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>A database transaction can’t span <b>several services</b>.</li>
          <li><b>Two-phase commit</b> is all-or-nothing but blocks when the coordinator fails.</li>
          <li>A <b>saga</b> commits step by step and runs <b>compensations</b> on failure.</li>
          <li><b>Orchestrate</b> or <b>choreograph</b>; make every step <b>idempotent</b>.</li>
          <li>Compensations must <b>eventually succeed</b>; a timeout means <b>unknown</b>, not failed.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Batch & Stream Processing</b> — crunching huge volumes of events, overnight or as they happen.`,
        },
        metrics: { allOrNothing: `eventually`, blocked: `none`, coord: `orchestrator` },
        scene: {
          entities: {
            trav: Kc([{ text: `trip confirmed`, tone: `green`, icon: `check` }]),
            trip: qc({ label: [`Saga`, `Orchestrator`] }),
            odb: makeDb(-11, -9, { r: 1.5, h: 30, glyph: `listOrdered`, label: `saga state` }),
            ...Jc({
              fl: { tags: [Xc(`flight`)] },
              ho: { tags: [Xc(`room`)] },
              car: { tags: [Xc(`car`)] },
            }),
            ...Yc(),
          },
          links: {
            ...R.ut,
            so: makeLink(`trip`, `odb`, [`trip`, `odb`], { heads: `both` }),
            ...R.calls(),
            ...R.dbs(),
          },
          flows: [...Qc(`t`), { route: [`so`], kind: `write`, rate: 1.2 }],
        },
      },
    ],
  };

export { $c as sagasLesson };
export default $c;
