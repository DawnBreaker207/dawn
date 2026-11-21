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
} from '../../scene-builders';

const Wa = (e = []) => y(-7, -18, { label: `Ana`, tags: e });

const Ga = (e = []) => y(7, -18, { label: `Ben`, tags: e });

const Ka = () => ({ a1: d(-7, -6, { label: [`Server 1`] }), a2: d(7, -6, { label: [`Server 2`] }) });

const qa = (e = [], t = {}) =>
    b(0, 6, { r: 2.1, h: 44, glyph: `ticket`, label: `tickets DB`, tags: e, ...t });

const Ja = (e, t = `paper`, n = ``) => ({ text: `seat 7 · left: ${e}${n}`, tone: t, icon: `ticket` });

const Ya = (e = {}) => ({
    aa: h(`ana`, `a1`, [`ana`, `a1`], { heads: `both` }),
    bb: h(`ben`, `a2`, [`ben`, `a2`], { heads: `both` }),
    ad: h(`a1`, `db`, [`a1`, [`a1`, `db`], `db`], { heads: `both`, ...(e.ad || {}) }),
    bd: h(`a2`, `db`, [`a2`, [`a2`, `db`], `db`], { heads: `both`, ...(e.bd || {}) }),
  });

const Xa = (e = {}) => [
    { route: [`aa`, `ad`], kind: `mine`, rate: 0.75, bounce: !0, ...(e.ana || {}) },
    { route: [`bb`, `bd`], kind: `req`, rate: 0.75, bounce: !0, ...(e.ben || {}) },
  ];

const Za = (e, t, n, r = {}) => S({ x: 0, y: 6, z: 0, dx: 125, dy: -150 }, e, t, { icon: n, ...r });

const Qa = Za(
    `Book a seat`,
    [
      `n = SELECT left FROM seats WHERE id = 7`,
      `if n > 0:`,
      `  UPDATE seats SET left = {n − 1}`,
      `  INSERT INTO bookings …`,
      `# n − 1 is worked out in the app`,
    ],
    `listOrdered`,
  );

const $a = {
    id: `transactions`,
    title: `Transactions & Isolation`,
    summary: `Two people, one seat, the same millisecond. How databases keep concurrent changes correct.`,
    minutes: 14,
    level: `intermediate`,
    metrics: [`seatsLeft`, `sold`, `oversold`, `lockWait`],
    legend: [[`mine`, `Ana’s booking`], [`req`, `Ben’s booking`], `res`, `fail`],
    goals: [
      { text: `How read-then-write races oversell`, step: 1 },
      { text: `Row locks and atomic updates`, step: 4 },
      { text: `Optimistic concurrency and isolation levels`, step: 6 },
      { text: `Phantoms and write skew`, step: 7 },
      { text: `Deadlocks and constraints as a safety net`, step: 9 },
      { text: `Short transactions with holds that expire`, step: 11 },
    ],
    steps: [
      {
        short: `Last seat`,
        chapter: `setup`,
        title: `One seat left`,
        body: [
          `Ana and Ben both want the last seat at a concert. Their requests land on different app servers, which share one database.`,
          `The booking code looks reasonable: <b>read</b> how many seats are left, and if there’s one, <b>write</b> the booking.`,
        ],
        callout: {
          kind: `insight`,
          text: `Each request on its own is correct. The trouble only appears when two run at the same time.`,
        },
        metrics: { seatsLeft: 1, sold: 0, oversold: `no`, lockWait: 0 },
        scene: {
          entities: { ana: Wa(), ben: Ga(), ...Ka(), db: qa([Ja(1)]), card: Qa },
          links: Ya(),
          flows: Xa({ ana: { rate: 0.5 }, ben: { rate: 0.5 } }),
        },
      },
      {
        short: `Race`,
        chapter: `problem`,
        title: `Both of them get it`,
        body: [
          `Both servers read “1 seat left” before either has written. Both decide the seat is free, both write, and both send a confirmation.`,
          `One seat, two tickets. This is a <span class="term">race condition</span> — here a <b>lost update</b>: Ben’s write silently overwrote Ana’s.`,
        ],
        callout: {
          kind: `warn`,
          text: `Races are rare in testing and common in production — exactly when it’s busiest, like the moment tickets go on sale.`,
        },
        changes: [`+ Both read “1 left”`, `+ Both write “0 left”`, `− Seat 7 sold twice`],
        metrics: { seatsLeft: 0, sold: `2 for 1 seat`, oversold: `yes`, lockWait: 0 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ...Ka(),
            db: qa([Ja(0, `red`, ` · 2 bookings!`)], { heat: 0.5 }),
            card: Za(`What happened`, [], `timer`, {
              chart: `bars`,
              bars: [
                { label: `Ana reads`, from: 0, to: 0.18, tone: `violet`, note: `left = 1` },
                { label: `Ben reads`, from: 0.1, to: 0.28, tone: `amber`, note: `left = 1` },
                { label: `Ana writes`, from: 0.36, to: 0.54, tone: `violet`, note: `left = 0` },
                { label: `Ben writes`, from: 0.48, to: 0.66, tone: `red`, note: `left = 0 !` },
              ],
            }),
          },
          links: Ya(),
          flows: Xa(),
        },
      },
      {
        short: `Not enough`,
        chapter: `insight`,
        title: `A transaction alone doesn’t stop it`,
        body: [
          `Wrap it in <code>BEGIN … COMMIT</code> and the booking becomes all-or-nothing — but it can still be sold twice. Under the default isolation level of most databases (<b>read committed</b>), each read simply sees the latest committed value: 1.`,
          `<span class="term">Isolation</span> is the part of a transaction that says what concurrent transactions can see of each other. The default is deliberately weak, for speed.`,
        ],
        callout: {
          kind: `tip`,
          text: `ACID’s “I” is a dial, not a switch. Know which level your database uses by default (PostgreSQL and SQL Server: read committed; MySQL: repeatable read).`,
        },
        changes: [`+ BEGIN … COMMIT around the booking`, `− Still sold twice`],
        metrics: { seatsLeft: 0, sold: `2 for 1 seat`, oversold: `yes`, lockWait: 0 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ...Ka(),
            db: qa([Ja(0, `red`, ` · 2 bookings!`), { text: `read committed`, icon: `layers` }], {
              heat: 0.5,
            }),
            card: Za(
              `Inside a transaction`,
              [
                `BEGIN`,
                `  SELECT left …          → 1 (both!)`,
                `  UPDATE … INSERT …`,
                `COMMIT`,
                `! all-or-nothing ≠ one-at-a-time`,
              ],
              `lock`,
            ),
          },
          links: Ya({ ad: { label: `BEGIN … COMMIT`, labelAt: 0.3 } }),
          flows: Xa(),
        },
      },
      {
        short: `Lock`,
        chapter: `solution`,
        title: `Lock the row while you decide`,
        body: [
          `Read with <code>SELECT … FOR UPDATE</code>. Ana’s transaction locks row 7; when Ben’s tries to read it, the database makes him <b>wait</b> until Ana commits (watch his request hold at the database).`,
          `Then Ben reads the new value — 0 — and gets a polite “sold out”.`,
        ],
        callout: {
          kind: `tip`,
          text: `Locks are held until COMMIT, so keep these transactions short: never wait for a user, a payment API or anything slow while holding one.`,
        },
        changes: [
          `~ Read with FOR UPDATE`,
          `+ Ben waits ~40 ms for Ana’s lock`,
          `~ Seat sold once`,
        ],
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 40 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `sold out · sorry`, tone: `amber` }]),
            ...Ka(),
            db: qa([Ja(0, `green`), { text: `row 7 locked by Ana`, tone: `violet`, icon: `lock` }]),
          },
          links: Ya({ bd: { label: `waits for the lock`, labelTone: `amber`, labelAt: 0.3 } }),
          flows: Xa({ ben: { hold: 1.4 } }),
        },
      },
      {
        short: `Atomic`,
        chapter: `technique`,
        title: `Or do it in one statement`,
        body: [
          `Often you don’t need to read first at all. Let the database check and change in one atomic step:`,
          `<code>UPDATE seats SET left = left − 1 WHERE id = 7 AND left > 0</code> — then look at how many rows it changed. 1 means you got the seat; 0 means it was gone.`,
        ],
        callout: {
          kind: `tip`,
          text: `Counters, stock levels and balances are usually safest as a single conditional UPDATE. No gap between check and change, no lock held across round trips.`,
        },
        changes: [`~ Check and change in one UPDATE`, `~ Ben’s update changes 0 rows → sold out`],
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 2 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `sold out · sorry`, tone: `amber` }]),
            ...Ka(),
            db: qa([Ja(0, `green`)]),
            card: Za(
              `One atomic statement`,
              [
                `UPDATE seats SET left = left − 1`,
                ` WHERE id = 7 AND left > 0`,
                `= Ana: 1 row changed → booked`,
                `# Ben: 0 rows changed → sold out`,
              ],
              `zap`,
            ),
          },
          links: Ya(),
          flows: Xa({ ben: { rate: 0.6 } }),
        },
      },
      {
        short: `Versions`,
        chapter: `technique`,
        title: `Optimistic: check a version number`,
        body: [
          `Locks are <em>pessimistic</em>: they assume a conflict and make others wait. <span class="term">Optimistic concurrency</span> assumes conflicts are rare: read the row with its version, then write <code>… WHERE id = 7 AND version = 8</code>, bumping it to 9.`,
          `If someone got there first, the version no longer matches, the write changes 0 rows, and you reload and try again. Nobody waits.`,
        ],
        callout: {
          kind: `insight`,
          text: `Ideal when users edit things for a while — a document, a profile, a cart. Holding a lock for minutes would block everyone.`,
        },
        changes: [
          `+ version column`,
          `~ Ben’s write rejected (version changed) → retries → sold out`,
        ],
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 0 },
        scene: {
          entities: {
            ana: Wa([{ text: `v8 → v9 ✓`, tone: `green` }]),
            ben: Ga([{ text: `v8 is stale · retry`, tone: `amber`, icon: `replay` }]),
            ...Ka(),
            db: qa([Ja(0, `green`, ` · version 9`)]),
            card: Za(
              `Compare-and-set`,
              [
                `read:  left = 1, version = 8`,
                `write: … SET left = 0, version = 9`,
                `       WHERE id = 7 AND version = 8`,
                `! Ben: 0 rows → reload, retry`,
              ],
              `replay`,
            ),
          },
          links: Ya({ bd: { fail: 0.5 } }),
          flows: Xa(),
        },
      },
      {
        short: `Levels`,
        chapter: `insight`,
        title: `Isolation levels`,
        body: [
          `Databases offer several isolation levels. Stronger ones prevent more anomalies, but make transactions wait or abort more often.`,
          `<table class="compare">
          <thead><tr><th></th><th>Prevents</th><th>Cost</th></tr></thead>
          <tbody>
            <tr><td><b>Read committed</b></td><td>Dirty reads</td><td>Lowest</td></tr>
            <tr><td><b>Snapshot / repeatable read</b></td><td>+ changing reads; lost updates in some databases<sup>1</sup></td><td>Some aborts</td></tr>
            <tr><td><b>Serializable</b></td><td>Everything: as if one at a time</td><td>Most aborts — retry</td></tr>
          </tbody>
        </table>`,
          `<small><sup>1</sup> PostgreSQL aborts the second writer; MySQL’s repeatable read lets the lost update through. Same name, different guarantees — check your database’s documentation.</small>`,
        ],
        callout: {
          kind: `tip`,
          text: `With serializable, the database may abort a transaction rather than allow an anomaly. Your code must catch that and retry.`,
        },
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 0 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `sold out · sorry`, tone: `amber` }]),
            ...Ka(),
            db: qa([Ja(0, `green`), { text: `serializable`, icon: `layers` }]),
          },
          links: Ya(),
          flows: Xa({ ben: { rate: 0.5 } }),
        },
      },
      {
        short: `Phantom`,
        chapter: `problem`,
        title: `Case: locking a row that doesn’t exist yet`,
        body: [
          `A new booking flow drops the seat counter and checks the bookings table instead: “is there a booking for seat 7? No — insert one.” Both transactions even use <code>FOR UPDATE</code>…`,
          `…but there is no row to lock yet. Both see nothing, both insert, and seat 7 is booked twice. A row that appears between your check and your write is a <span class="term">phantom</span>; deciding on what you read and then writing something else is called <span class="term">write skew</span>.`,
        ],
        callout: {
          kind: `tip`,
          text: `Fixes: serializable isolation, locking an existing parent row (the seat itself), or a unique constraint — see the next steps.`,
        },
        changes: [
          `+ Check-then-insert booking flow`,
          `− FOR UPDATE finds no row to lock`,
          `− Seat 7 booked twice`,
        ],
        metrics: { seatsLeft: `—`, sold: `2 for 1 seat`, oversold: `yes`, lockWait: 0 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ...Ka(),
            db: qa([{ text: `bookings: seat 7 × 2`, tone: `red`, icon: `alert` }], { heat: 0.5 }),
            card: Za(
              `Nothing to lock`,
              [
                `SELECT … FROM bookings`,
                `  WHERE seat = 7 FOR UPDATE   → 0 rows`,
                `INSERT INTO bookings (seat = 7)`,
                `! both see 0 rows → both insert`,
              ],
              `lock`,
            ),
          },
          links: Ya(),
          flows: Xa(),
        },
      },
      {
        short: `Deadlock`,
        chapter: `problem`,
        title: `Case: the deadlock`,
        body: [
          `Locks bring their own trap. Ana transfers money from account A to B: she locks A, then asks for B. At the same instant Ben transfers from B to A: he locks B, then asks for A.`,
          `Each waits for the other, forever. The database detects the cycle — immediately in some engines, after about a second in others — and aborts one transaction (Ben’s), which must retry.`,
        ],
        callout: {
          kind: `tip`,
          text: `Prevent it by always taking locks in the same order — for example, lowest account id first. Then a cycle can’t form.`,
        },
        changes: [
          `+ Two transfers lock A and B in opposite orders`,
          `− Both wait on each other`,
          `~ Database aborts Ben’s transaction`,
        ],
        metrics: { seatsLeft: `—`, sold: `—`, oversold: `no`, lockWait: 1e3 },
        scene: {
          entities: {
            ana: Wa([{ text: `transfer A → B`, icon: `dollar` }]),
            ben: Ga([{ text: `aborted · retrying`, tone: `red`, icon: `replay` }]),
            ...Ka(),
            db: qa(
              [
                { text: `Ana holds A · waits for B`, tone: `violet`, icon: `lock` },
                { text: `Ben holds B · waits for A`, tone: `red`, icon: `lock` },
              ],
              { heat: 0.5, glyph: `database`, label: `accounts DB` },
            ),
            card: Za(
              `A wait cycle`,
              [
                `Ana: lock A … waiting for B`,
                `Ben: lock B … waiting for A`,
                `! cycle → database aborts one`,
                `= fix: always lock lowest id first`,
              ],
              `lock`,
            ),
          },
          links: Ya({ bd: { fail: 0.6 } }),
          flows: Xa({ ana: { hold: 1.5 }, ben: { hold: 1.5 } }),
        },
      },
      {
        short: `Constraint`,
        chapter: `solution`,
        title: `Constraints: the last line of defence`,
        body: [
          `Code changes, and someone will eventually write a booking path that forgets the lock. So let the database enforce the rule itself: a <span class="term">unique constraint</span> on <code>(concert, seat)</code> in the bookings table.`,
          `Now a second booking for seat 7 is rejected with a duplicate-key error, whatever the application code does.`,
        ],
        callout: {
          kind: `insight`,
          text: `Encode invariants as constraints — unique, foreign key, check (balance ≥ 0). They hold even when the code has bugs.`,
        },
        changes: [`+ UNIQUE (concert, seat) on bookings`, `~ A duplicate booking is rejected`],
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 0 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `duplicate key · sold out`, tone: `amber` }]),
            ...Ka(),
            db: qa([Ja(0, `green`), { text: `UNIQUE (concert, seat)`, icon: `key` }]),
          },
          links: Ya({ bd: { fail: 0.8 } }),
          flows: Xa(),
        },
      },
      {
        short: `Slow lock`,
        chapter: `problem`,
        title: `Case: a lock held during a payment`,
        body: [
          `To be safe, someone moves the card payment <em>inside</em> the booking transaction: lock seat 7, call the payment provider, then commit. The provider takes 3 seconds.`,
          `For those 3 seconds the seat stays locked, and every other buyer of it waits — each holding a database connection. On sale day the connection pool runs dry and the whole site stalls.`,
        ],
        callout: {
          kind: `warn`,
          text: `Never wait on anything slow — a user, a payment API, an email — while holding a database lock or an open transaction.`,
        },
        changes: [
          `+ Payment call inside the transaction`,
          `~ Seat 7 locked for 3 s per attempt`,
          `− Connection pool exhausted`,
        ],
        metrics: { seatsLeft: 1, sold: 0, oversold: `no`, lockWait: 3e3 },
        scene: {
          entities: {
            ana: Wa([{ text: `paying… (lock held)`, tone: `amber`, icon: `hourglass` }]),
            ben: Ga([{ text: `waiting for seat 7`, tone: `red`, icon: `hourglass` }]),
            ...Ka(),
            pay: d(-16, -6, {
              color: `purple`,
              glyph: `creditCard`,
              label: [`Payment`, `Provider`],
              tags: [{ text: `3 s per charge`, tone: `amber`, icon: `clock` }],
            }),
            db: qa([Ja(1), { text: `locked 3 s · 40 waiting`, tone: `red`, icon: `lock` }], {
              heat: 0.6,
            }),
          },
          links: {
            ...Ya({ bd: { label: `waits for the lock`, labelTone: `red`, labelAt: 0.3 } }),
            ap: h(`a1`, `pay`, [`a1`, `pay`], {
              heads: `both`,
              label: `charge card`,
              labelAt: 0.5,
            }),
          },
          flows: [
            { route: [`aa`, `ap`], kind: `mine`, rate: 0.5, bounce: !0, hold: 2.2 },
            { route: [`bb`, `bd`], kind: `req`, rate: 0.9, bounce: !0, hold: 2.4 },
          ],
        },
      },
      {
        short: `Hold`,
        chapter: `solution`,
        title: `Reserve, pay, then confirm`,
        body: [
          `Split it into short steps. Transaction 1 marks seat 7 as <b>held for Ana until 12:10</b> and commits at once. Then she pays — outside any transaction. Transaction 2 marks the seat <b>sold</b>.`,
          `If she never pays, a cleanup job releases holds that have expired. Ben is told immediately that the seat is taken — no waiting, no locks held for seconds.`,
        ],
        callout: {
          kind: `insight`,
          text: `This is the “seat held for 10 minutes” timer on every ticket and airline site. A reservation with an expiry replaces a long lock.`,
        },
        changes: [
          `~ Transaction 1: hold seat (expires 12:10)`,
          `~ Payment outside the transaction`,
          `~ Transaction 2: confirm`,
          `+ Expired holds released`,
        ],
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 2 },
        scene: {
          entities: {
            ana: Wa([{ text: `seat held · paying`, tone: `violet`, icon: `clock` }]),
            ben: Ga([{ text: `seat 7 held · pick another`, tone: `amber` }]),
            ...Ka(),
            pay: d(-16, -6, {
              color: `purple`,
              glyph: `creditCard`,
              label: [`Payment`, `Provider`],
            }),
            db: qa([{ text: `seat 7: held for Ana · 12:10`, tone: `violet`, icon: `clock` }]),
            card: Za(
              `Three short steps`,
              [
                `1. UPDATE seat 7 SET held_by = Ana,`,
                `     held_until = now() + 10 min`,
                `2. charge card (no transaction open)`,
                `3. UPDATE seat 7 SET sold_to = Ana`,
                `# job: release holds past held_until`,
              ],
              `clock`,
            ),
          },
          links: {
            ...Ya(),
            ap: h(`a1`, `pay`, [`a1`, `pay`], {
              heads: `both`,
              label: `charge card`,
              labelAt: 0.5,
            }),
          },
          flows: [
            { route: [`aa`, `ad`], kind: `mine`, rate: 0.6, bounce: !0 },
            { route: [`ap`], kind: `mine`, rate: 0.6, bounce: !0, hold: 1 },
            { route: [`bb`, `bd`], kind: `req`, rate: 0.7, bounce: !0 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>Read-then-write</b> under concurrency causes races and lost updates.</li>
          <li>Fix with <b>row locks</b>, a single <b>atomic UPDATE</b>, or <b>version checks</b>.</li>
          <li>Isolation levels trade correctness for waiting and <b>retries</b>.</li>
          <li>Lock in a <b>consistent order</b>; back rules with <b>constraints</b>.</li>
          <li>Keep transactions <b>short</b>: hold a reservation, never a lock, while waiting on payments.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Files & Media</b> — where photos and videos go instead of the database, and how they get there and back.`,
        },
        metrics: { seatsLeft: 0, sold: 1, oversold: `no`, lockWait: 2 },
        scene: {
          entities: {
            ana: Wa([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: Ga([{ text: `sold out · sorry`, tone: `amber` }]),
            ...Ka(),
            db: qa([Ja(0, `green`)]),
          },
          links: Ya(),
          flows: Xa({ ben: { rate: 0.5 } }),
        },
      },
    ],
  };

export { $a as transactionsLesson };
export default $a;
