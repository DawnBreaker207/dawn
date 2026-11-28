import { makeBlock, makeDb, makeDevice, makeLink, makePanel, type Bag, type Tag, cardAt } from '@/lib/simulator/scene-builders';

const usersArea = (e: Tag[] = []) => makeDevice(-7, -18, { label: `Ana`, tags: e });

const users = (e: Tag[] = []) => makeDevice(7, -18, { label: `Ben`, tags: e });

const appServer = () => ({ a1: makeBlock(-7, -6, { label: [`Server 1`] }), a2: makeBlock(7, -6, { label: [`Server 2`] }) });

const database = (e: Tag[] = [], t: Bag = {}) =>
    makeDb(0, 6, { r: 2.1, h: 44, glyph: `ticket`, label: `tickets DB`, tags: e, ...t });

const links = (e: number, t = `paper`, n = ``) => ({ text: `seat 7 · left: ${e}${n}`, tone: t, icon: `ticket` });

const requestFlows = (e: Bag = {}) => ({
    aa: makeLink(`ana`, `a1`, [`ana`, `a1`], { heads: `both` }),
    bb: makeLink(`ben`, `a2`, [`ben`, `a2`], { heads: `both` }),
    ad: makeLink(`a1`, `db`, [`a1`, [`a1`, `db`], `db`], { heads: `both`, ...(e.ad || {}) }),
    bd: makeLink(`a2`, `db`, [`a2`, [`a2`, `db`], `db`], { heads: `both`, ...(e.bd || {}) }),
  });

const card = (e: Bag = {}) => [
    { route: [`aa`, `ad`], kind: `mine`, rate: 0.75, bounce: !0, ...(e.ana || {}) },
    { route: [`bb`, `bd`], kind: `req`, rate: 0.75, bounce: !0, ...(e.ben || {}) },
  ];

const metrics = cardAt({ x: 0, y: 6, dx: 125, dy: -150 });

const lesson = metrics(
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
      { text: `How read-then-write races oversell`, step: 2 },
      { text: `Row locks and atomic updates`, step: 4 },
      { text: 'Optimistic concurrency and isolation levels', step: 6 },
      { text: `Phantoms and write skew`, step: 8 },
      { text: `Deadlocks and constraints as a safety net`, step: 9 },
      { text: `Short transactions with holds that expire`, step: 12 },
      { text: 'Evaluate tuple visibility via xmin, xmax & Snapshot xip[]', step: 14 },
      { text: 'See why Read Committed and Repeatable Read read different versions', step: 15 },
      { text: 'Prevent 32-bit txid Wraparound with VACUUM FREEZE', step: 16 },
      { text: 'Catch Write Skew via Serializable Snapshot Isolation (SSI)', step: 17 },
      { text: 'Build lock-free job queues with FOR UPDATE SKIP LOCKED', step: 18 },
      { text: 'Avoid AccessExclusiveLock outages & use CONCURRENTLY', step: 19 },
      { text: 'Scale with Declarative Partitioning & WAL CDC', step: 20 },],
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
          entities: { ana: usersArea(), ben: users(), ...appServer(), db: database([links(1)]), },
          links: requestFlows(),
          flows: card({ ana: { rate: 0.5 }, ben: { rate: 0.5 } }),
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
            ana: usersArea([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: users([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ...appServer(),
            db: database([links(0, `red`, ` · 2 bookings!`)], { heat: 0.5 }),
          },
          links: requestFlows(),
          flows: card(),
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
            ana: usersArea([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: users([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ...appServer(),
            db: database([links(0, `red`, ` · 2 bookings!`), { text: `read committed`, icon: `layers` }], {
              heat: 0.5,
            }),
            card: metrics(
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
          links: requestFlows({ ad: { label: `BEGIN … COMMIT`, labelAt: 0.3 } }),
          flows: card(),
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
            ana: usersArea([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: users([{ text: `sold out · sorry`, tone: `amber` }]),
            ...appServer(),
            db: database([links(0, `green`), { text: `row 7 locked by Ana`, tone: `violet`, icon: `lock` }]),
          },
          links: requestFlows({ bd: { label: `waits for the lock`, labelTone: `amber`, labelAt: 0.3 } }),
          flows: card({ ben: { hold: 1.4 } }),
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
            ana: usersArea([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: users([{ text: `sold out · sorry`, tone: `amber` }]),
            ...appServer(),
            db: database([links(0, `green`)]),
            card: metrics(
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
          links: requestFlows(),
          flows: card({ ben: { rate: 0.6 } }),
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
            ana: usersArea([{ text: `v8 → v9 ✓`, tone: `green` }]),
            ben: users([{ text: `v8 is stale · retry`, tone: `amber`, icon: `replay` }]),
            ...appServer(),
            db: database([links(0, `green`, ` · version 9`)]),
            card: metrics(
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
          links: requestFlows({ bd: { fail: 0.5 } }),
          flows: card(),
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
            ana: usersArea([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: users([{ text: `sold out · sorry`, tone: `amber` }]),
            ...appServer(),
            db: database([links(0, `green`), { text: `serializable`, icon: `layers` }]),
          },
          links: requestFlows(),
          flows: card({ ben: { rate: 0.5 } }),
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
            ana: usersArea([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: users([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ...appServer(),
            db: database([{ text: `bookings: seat 7 × 2`, tone: `red`, icon: `alert` }], { heat: 0.5 }),
            card: metrics(
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
          links: requestFlows(),
          flows: card(),
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
            ana: usersArea([{ text: `transfer A → B`, icon: `dollar` }]),
            ben: users([{ text: `aborted · retrying`, tone: `red`, icon: `replay` }]),
            ...appServer(),
            db: database(
              [
                { text: `Ana holds A · waits for B`, tone: `violet`, icon: `lock` },
                { text: `Ben holds B · waits for A`, tone: `red`, icon: `lock` },
              ],
              { heat: 0.5, glyph: `database`, label: `accounts DB` },
            ),
            card: metrics(
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
          links: requestFlows({ bd: { fail: 0.6 } }),
          flows: card({ ana: { hold: 1.5 }, ben: { hold: 1.5 } }),
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
            ana: usersArea([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: users([{ text: `duplicate key · sold out`, tone: `amber` }]),
            ...appServer(),
            db: database([links(0, `green`), { text: `UNIQUE (concert, seat)`, icon: `key` }]),
          },
          links: requestFlows({ bd: { fail: 0.8 } }),
          flows: card(),
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
            ana: usersArea([{ text: `paying… (lock held)`, tone: `amber`, icon: `hourglass` }]),
            ben: users([{ text: `waiting for seat 7`, tone: `red`, icon: `hourglass` }]),
            ...appServer(),
            pay: makeBlock(-16, -6, {
              color: `purple`,
              glyph: `creditCard`,
              label: [`Payment`, `Provider`],
              tags: [{ text: `3 s per charge`, tone: `amber`, icon: `clock` }],
            }),
            db: database([links(1), { text: `locked 3 s · 40 waiting`, tone: `red`, icon: `lock` }], {
              heat: 0.6,
            }),
          },
          links: {
            ...requestFlows({ bd: { label: `waits for the lock`, labelTone: `red`, labelAt: 0.3 } }),
            ap: makeLink(`a1`, `pay`, [`a1`, `pay`], {
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
            ana: usersArea([{ text: `seat held · paying`, tone: `violet`, icon: `clock` }]),
            ben: users([{ text: `seat 7 held · pick another`, tone: `amber` }]),
            ...appServer(),
            pay: makeBlock(-16, -6, {
              color: `purple`,
              glyph: `creditCard`,
              label: [`Payment`, `Provider`],
            }),
            db: database([{ text: `seat 7: held for Ana · 12:10`, tone: `violet`, icon: `clock` }]),
            card: metrics(
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
            ...requestFlows(),
            ap: makeLink(`a1`, `pay`, [`a1`, `pay`], {
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
            ana: usersArea([{ text: `booked seat 7 ✓`, tone: `green` }]),
            ben: users([{ text: `sold out · sorry`, tone: `amber` }]),
            ...appServer(),
            db: database([links(0, `green`)]),
          },
          links: requestFlows(),
          flows: card({ ben: { rate: 0.5 } }),
        },
      },
      {
      short: 'xmin / xmax',
      chapter: 'mvcc',
      title: 'MVCC Tuple Visibility: xmin, xmax & Snapshot xip[]',
      body: [
        'Every PostgreSQL row tuple carries hidden system columns: <code>xmin</code> (the <code>txid</code> that inserted it) and <code>xmax</code> (the <code>txid</code> that deleted/updated it, or <code>0</code> if live).',
        'When a transaction starts, it takes a <strong>Snapshot</strong> <code>(xmin, xmax, xip[])</code> and checks commit status in <code>pg_xact</code> (clog) — so readers never block writers and writers never block readers.',
      ],
      callout: {
        kind: 'insight',
        text: 'An UPDATE in PostgreSQL sets xmax = current_txid on the old tuple and inserts a brand-new tuple with xmin = current_txid!',
      },
      metrics: { mvcc_state: 'xmin / xmax', lock_mode: 'Zero read lock', index_type: 'Snapshot xip[]', scale_feature: 'pg_xact clog' },
      scene: {
        entities: {
          snap: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'blue', glyph: 'cpu', label: ['Tx Snapshot'], sub: 'xip=[104,105]' }),
          tup: makeBlock(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['Heap Tuple'], sub: 'xmin=102 xmax=0' }),
          clog: makeDb(15, -10, { r: 2.2, h: 48, color: 'green', label: ['pg_xact (clog)'], sub: '102 COMMITTED' }),
          card: makePanel({ x: -12, y: 12 }, 'Inspecting Hidden MVCC Tuple Columns', [
            'SELECT xmin, xmax, ctid, * FROM accounts WHERE id = 1;',
            '// Visible if: xmin committed && xmin < snap.xmax && xmin not in xip[]',
            '//         AND (xmax == 0 || xmax uncommitted || xmax >= snap.xmax)',
          ], { icon: 'terminal' }),
        },
        links: {
          sn_tp: makeLink('snap', 'tup', ['snap', 'tup'], { heads: 'end', label: 'check xmin' }),
          tp_cl: makeLink('tup', 'clog', ['tup', 'clog'], { heads: 'end', label: 'commit?' }),
        },
        flows: [{ route: ['sn_tp', 'tp_cl'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Version chain',
      chapter: 'mvcc',
      title: 'MVCC Version Chain: Read Committed vs Repeatable Read',
      body: [
        'An <code>UPDATE</code> never overwrites a row in place. Txn A (xid 100) stamps <code>xmax = 100</code> on the old tuple <strong>v1</strong> and inserts a new tuple <strong>v2</strong> with <code>xmin = 100</code>. Both versions now live in the heap.',
        'Which one Txn B reads depends on its snapshot. Under <strong>READ COMMITTED</strong> every statement takes a fresh snapshot, so after A commits B sees <strong>500</strong>. Under <strong>REPEATABLE READ</strong> B keeps the snapshot from its first statement and still sees <strong>1000</strong>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Same query, same moment, different answer: the isolation level decides which snapshot — and therefore which tuple version — a reader sees.',
      },
      changes: ['+ UPDATE creates tuple v2 (xmin = 100)', '~ Tuple v1 gets xmax = 100', '+ Reader picks v1 or v2 by snapshot'],
      metrics: { mvcc_state: 'v1 → v2', lock_mode: 'Zero read lock', index_type: 'ctid chain', scale_feature: 'RC vs RR' },
      scene: {
        entities: {
          txa: makeBlock(-7, -7, { s: 4.8, h: 54, color: 'orange', glyph: 'key', label: ['Txn A', 'writer'], sub: 'xid 100' }),
          v1: makeBlock(-7, 7, { s: 4.8, h: 54, color: 'purple', glyph: 'layers', label: ['Tuple v1', 'balance 1000'], sub: 'xmax = 100' }),
          v2: makeBlock(7, -7, { s: 4.8, h: 54, color: 'green', glyph: 'layers', label: ['Tuple v2', 'balance 500'], sub: 'xmin = 100' }),
          txb: makeBlock(7, 7, { s: 4.8, h: 54, color: 'blue', glyph: 'eye', label: ['Txn B', 'reader'], sub: 'xid 101' }),
          card: makePanel({ x: -12, y: 12 }, 'Two Transactions, Two Snapshots', [
            't1  A: UPDATE accounts SET balance = 500 WHERE id = 1;',
            '    v1.xmax = 100 · new tuple v2.xmin = 100',
            't3  B: SELECT balance FROM accounts WHERE id = 1;',
            '= READ COMMITTED: new snapshot per statement → 500',
            '! REPEATABLE READ: snapshot from first read → 1000',
          ], { icon: 'terminal' }),
        },
        links: {
          mv_a_v1: makeLink('txa', 'v1', ['txa', 'v1'], { heads: 'end', label: 'xmax = 100' }),
          mv_a_v2: makeLink('txa', 'v2', ['txa', 'v2'], { heads: 'end', label: 'insert v2' }),
          mv_b_v2: makeLink('txb', 'v2', ['txb', 'v2'], { heads: 'end', label: 'RC → 500' }),
          mv_b_v1: makeLink('txb', 'v1', ['txb', 'v1'], { heads: 'end', style: 'dash', label: 'RR → 1000' }),
        },
        flows: [
          { route: ['mv_a_v2'], kind: 'write', rate: 0.9 },
          { route: ['mv_b_v2'], kind: 'req', rate: 1.2, bounce: true },
          { route: ['mv_b_v1'], kind: 'req', rate: 0.8, bounce: true },
        ],
      },
    },
      {
      short: 'VACUUM FREEZE',
      chapter: 'mvcc',
      title: 'Transaction ID Wraparound & VACUUM FREEZE',
      body: [
        'PostgreSQL <code>txid</code> is a 32-bit circular counter (~4 billion total, 2 billion in the past / 2 billion in the future). Without freezing old rows, an ancient tuple’s <code>xmin</code> would eventually wrap around and look like it’s in the <em>future</em> — making old data vanish!',
        '<strong>Aggressive Autovacuum (Freeze)</strong> marks old committed tuples as <code>HEAP_XMIN_FROZEN</code> so they remain unconditionally visible forever.',
      ],
      callout: {
        kind: 'warn',
        text: 'Long-running idle transactions or orphaned replication slots block VACUUM FREEZE — eventually forcing Postgres to refuse writes!',
      },
      changes: ['+ 32-bit txid circular space (2B past / 2B future)', '+ VACUUM FREEZE pins old rows permanently visible'],
      metrics: { mvcc_state: 'FROZEN xmin', lock_mode: 'Anti-wraparound', index_type: '32-bit txid', scale_feature: 'autovacuum_freeze' },
      scene: {
        entities: {
          old: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'alert', label: ['Old Tuple'], sub: 'age > 200M tx' }),
          frz: makeBlock(0, -10, { s: 4.8, h: 54, color: 'cyan', glyph: 'shield', label: ['VACUUM FREEZE'], sub: 'mark FROZEN' }),
          safe: makeDb(15, -10, { r: 2.2, h: 48, color: 'green', label: ['Frozen Row'], sub: 'always visible' }),
          card: makePanel({ x: -12, y: 12 }, 'Monitoring Transaction ID Wraparound Age', [
            'SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;',
            '-- Triggers aggressive freeze at autovacuum_freeze_max_age (200M)',
            '-- Emergency stop at ~2B txids to prevent data corruption!',
          ], { icon: 'terminal' }),
        },
        links: {
          ol_fr: makeLink('old', 'frz', ['old', 'frz'], { heads: 'end', label: 'age limit' }),
          fr_sf: makeLink('frz', 'safe', ['frz', 'safe'], { heads: 'end', label: 'XMIN_FROZEN' }),
        },
        flows: [{ route: ['ol_fr', 'fr_sf'], kind: 'res', rate: 1.7 }],
      },
    },
      {
      short: 'SSI Write Skew',
      chapter: 'mvcc',
      title: 'Write Skew & Serializable Snapshot Isolation (SSI)',
      body: [
        'In <code>REPEATABLE READ</code> (Snapshot Isolation), two concurrent doctors can both see 2 doctors on-call and each take themselves off-call — leaving <strong>0 doctors on-call</strong> (<strong>Write Skew</strong>), because they modified <em>disjoint</em> rows.',
        'PostgreSQL <code>SERIALIZABLE</code> uses <strong>SSI</strong>: it tracks <code>SIREAD</code> predicate locks without blocking and aborts one transaction (<code>40001 serialization_failure</code>) when a dangerous rw-antidependency cycle forms.',
      ],
      callout: {
        kind: 'insight',
        text: 'Applications using SERIALIZABLE must implement an automatic retry loop for SQLSTATE 40001!',
      },
      changes: ['+ REPEATABLE READ allows disjoint Write Skew', '+ SSI SIREAD locks detect cycle & abort 40001'],
      metrics: { mvcc_state: 'SIREAD Lock', lock_mode: 'Optimistic SSI', index_type: 'Predicate', scale_feature: 'Retry 40001' },
      scene: {
        entities: {
          tx1: makeBlock(-14, -15, { s: 4.6, h: 52, color: 'blue', glyph: 'cpu', label: ['Tx A (Dr Alice)'], sub: 'writes row A' }),
          tx2: makeBlock(-14, -1, { s: 4.6, h: 52, color: 'cyan', glyph: 'cpu', label: ['Tx B (Dr Bob)'], sub: 'writes row B' }),
          ssi: makeBlock(1, -8, { s: 4.8, h: 54, color: 'purple', glyph: 'shield', label: ['SSI Detector'], sub: 'SIREAD cycle' }),
          abr: makeBlock(15, -8, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['Abort 40001'], sub: 'retry Tx B' }),
          card: makePanel({ x: -12, y: 12 }, 'Catching Write Skew with SERIALIZABLE', [
            'BEGIN ISOLATION LEVEL SERIALIZABLE;',
            'SELECT COUNT(*) FROM on_call WHERE shift = \'night\'; -- both see 2',
            'UPDATE on_call SET active = false WHERE doctor = \'Alice\';',
            '-- Tx B fails on COMMIT: ERROR: could not serialize (40001)',
          ], { icon: 'terminal' }),
        },
        links: {
          t1_ss: makeLink('tx1', 'ssi', ['tx1', 'ssi'], { heads: 'end', label: 'rw-dep' }),
          t2_ss: makeLink('tx2', 'ssi', ['tx2', 'ssi'], { heads: 'end', label: 'rw-dep' }),
          ss_ab: makeLink('ssi', 'abr', ['ssi', 'abr'], { heads: 'end', label: '40001 abort' }),
        },
        flows: [{ route: ['t1_ss', 'ss_ab'], kind: 'fail', rate: 1.7 }, { route: ['t2_ss'], kind: 'req', rate: 1.7 }],
      },
    },
      {
      short: 'SKIP LOCKED',
      chapter: 'locking',
      title: 'Job Queues with FOR UPDATE SKIP LOCKED & NOWAIT',
      body: [
        'Plain <code>SELECT ... FOR UPDATE LIMIT 1</code> makes Worker 2 block and wait behind Worker 1 on the exact same row.',
        'Add <strong><code>SKIP LOCKED</code></strong>: Worker 2 immediately skips any locked row and grabs the next unlocked job in $O(1)$! Use <code>NOWAIT</code> when you want an instant error instead of waiting.',
      ],
      callout: {
        kind: 'tip',
        text: 'FOR UPDATE SKIP LOCKED turns PostgreSQL into a rock-solid, transactional Outbox / Job Queue without Redis or RabbitMQ.',
      },
      changes: ['+ SKIP LOCKED bypasses rows locked by peers', '+ NOWAIT fails immediately on lock conflict'],
      metrics: { mvcc_state: 'Row-level lock', lock_mode: 'SKIP LOCKED', index_type: 'Job Queue', scale_feature: '0 worker stall' },
      scene: {
        entities: {
          w1: makeBlock(-14, -15, { s: 4.6, h: 52, color: 'green', glyph: 'cpu', label: ['Worker 1'], sub: 'locks job #1' }),
          w2: makeBlock(-14, -1, { s: 4.6, h: 52, color: 'cyan', glyph: 'cpu', label: ['Worker 2'], sub: 'skips job #1' }),
          q: makeDb(2, -8, { r: 2.3, h: 50, color: 'purple', label: ['jobs Table'], sub: '#1 lock, #2 free' }),
          j2: makeBlock(15, -8, { s: 4.6, h: 52, color: 'green', glyph: 'zap', label: ['Job #2 Claimed'], sub: 'parallel exec' }),
          card: makePanel({ x: -12, y: 12 }, 'Transactional Job Queue with SKIP LOCKED', [
            'UPDATE jobs SET status = \'RUNNING\'',
            'WHERE id = (',
            '  SELECT id FROM jobs WHERE status = \'PENDING\'',
            '  ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1',
            ') RETURNING *;',
          ], { icon: 'terminal' }),
        },
        links: {
          w1_q: makeLink('w1', 'q', ['w1', 'q'], { heads: 'end', label: 'claim #1' }),
          w2_q: makeLink('w2', 'q', ['w2', 'q'], { heads: 'end', label: 'skip #1' }),
          q_j2: makeLink('q', 'j2', ['q', 'j2'], { heads: 'end', label: 'claim #2' }),
        },
        flows: [{ route: ['w1_q'], kind: 'req', rate: 1.7 }, { route: ['w2_q', 'q_j2'], kind: 'res', rate: 1.9 }],
      },
    },
      {
      short: 'DDL Lock Queue',
      chapter: 'locking',
      title: 'AccessExclusiveLock Queue Disaster & CONCURRENTLY',
      body: [
        '<code>ALTER TABLE</code> and <code>CREATE INDEX</code> (without <code>CONCURRENTLY</code>) request an <code>AccessExclusiveLock</code> (or <code>ShareLock</code>). If a slow analytics <code>SELECT</code> holds <code>AccessShareLock</code>, the DDL waits — and <strong>every new SELECT queues behind the DDL</strong>, taking down production!',
        'Always set <code>SET lock_timeout = \'2s\'</code> before migrations and use <code>CREATE INDEX CONCURRENTLY</code>.',
      ],
      callout: {
        kind: 'warn',
        text: 'Never run raw ALTER TABLE / CREATE INDEX in prod without lock_timeout — a single slow query behind it causes a total outage!',
      },
      changes: ['+ Waiting AccessExclusiveLock blocks all new SELECTs', '+ lock_timeout + CONCURRENTLY prevent pile-up'],
      metrics: { mvcc_state: 'Lock Queue', lock_mode: 'AccessExclusive', index_type: 'CONCURRENTLY', scale_feature: 'lock_timeout=2s' },
      scene: {
        entities: {
          slow: makeBlock(-14, -10, { s: 4.8, h: 54, color: 'amber', glyph: 'cpu', label: ['Slow SELECT'], sub: 'holds Share' }),
          ddl: makeBlock(0, -10, { s: 4.8, h: 54, color: 'red', glyph: 'alert', label: ['ALTER TABLE'], sub: 'waits Exclusive' }),
          web: makeBlock(15, -10, { s: 4.8, h: 54, color: 'red', glyph: 'server', label: ['All App Reads'], sub: 'BLOCKED!' }),
          card: makePanel({ x: -12, y: 12 }, 'Safe Zero-Downtime Migrations', [
            'SET lock_timeout = \'2s\'; -- fail fast instead of piling up!',
            'CREATE INDEX CONCURRENTLY idx_orders_uid ON orders (user_id);',
            '-- Safe: 2-phase scan, never blocks reads or writes!',
          ], { icon: 'terminal' }),
        },
        links: {
          sl_dd: makeLink('slow', 'ddl', ['slow', 'ddl'], { heads: 'end', label: 'blocks DDL', style: 'dashed' }),
          dd_wb: makeLink('ddl', 'web', ['ddl', 'web'], { heads: 'end', label: 'blocks reads!', style: 'dashed' }),
        },
        flows: [{ route: ['sl_dd', 'dd_wb'], kind: 'fail', rate: 1.8 }],
      },
    },
    {
      short: 'Pruning',
      chapter: 'scale',
      title: 'Partition Pruning: Scan Only the Matching Partitions',
      body: [
        'A table <code>PARTITION BY RANGE (created_at)</code> is really one child table per quarter. Because each child only holds its own date range, the planner can compare the <code>WHERE</code> clause against those ranges <strong>before</strong> reading anything.',
        'A query for April–September only opens <strong>orders_q2</strong> and <strong>orders_q3</strong>; Q1 and Q4 are <strong>pruned</strong> at plan time and never touched. Drop the date filter and every partition is scanned again.',
      ],
      callout: {
        kind: 'tip',
        text: 'Pruning only works when the WHERE clause filters on the partition key. Check EXPLAIN: pruned partitions simply do not appear in the plan.',
      },
      changes: ['+ Planner matches WHERE against partition ranges', '~ Q1 and Q4 pruned: 2 of 4 partitions skipped'],
      metrics: { mvcc_state: 'snapshot', lock_mode: 'ACCESS SHARE', index_type: 'Pruned Part', scale_feature: '2 of 4 skipped' },
      scene: {
        entities: {
          planner: makeBlock(-14, 14, { s: 4.8, h: 54, color: 'yellow', glyph: 'filter', label: ['Query', 'Planner'], sub: 'prune by date' }),
          q1: makeDb(-10.5, -10.5, { r: 2.2, h: 48, label: 'orders_q1', opacity: 0.45, tags: [{ text: 'pruned', tone: 'gray' }] }),
          q2: makeDb(-3.5, -3.5, { r: 2.2, h: 48, label: 'orders_q2', tags: [{ text: '261k rows', tone: 'red' }] }),
          q3: makeDb(3.5, 3.5, { r: 2.2, h: 48, label: 'orders_q3', tags: [{ text: '275k rows', tone: 'red' }] }),
          q4: makeDb(10.5, 10.5, { r: 2.2, h: 48, label: 'orders_q4', opacity: 0.45, tags: [{ text: 'pruned', tone: 'gray' }] }),
          card: makePanel({ x: -12, y: 12 }, 'Partition Pruning (orders, 1M rows)', [
            'SELECT * FROM orders',
            "WHERE created_at >= '2024-04-01' AND created_at < '2024-10-01';",
            'Append → orders_q2 (261k) + orders_q3 (275k)',
            '# orders_q1, orders_q4 pruned at plan time, never opened',
            '= 2 of 4 partitions skipped · 536k of 1M rows read',
          ], { icon: 'terminal' }),
        },
        links: {
          prune_q2: makeLink('planner', 'q2', ['planner', 'q2'], { heads: 'end', label: 'scan Q2' }),
          prune_q3: makeLink('planner', 'q3', ['planner', 'q3'], { heads: 'end', label: 'scan Q3' }),
        },
        flows: [
          { route: ['prune_q2'], kind: 'req', rate: 1.2, bounce: true },
          { route: ['prune_q3'], kind: 'req', rate: 1.2, bounce: true },
        ],
      },
    },
      {
      short: 'Partition & CDC',
      chapter: 'scale',
      title: 'Declarative Partitioning & WAL Logical CDC',
      body: [
        '<strong>Declarative Partitioning</strong> (<code>RANGE</code> by month or <code>HASH</code>) splits billion-row tables into small child tables. <strong>Partition Pruning</strong> skips irrelevant months, and dropping old data is an instant <code>DROP TABLE events_2025_01</code> (zero <code>DELETE</code> bloat!).',
        '<strong>CDC (Logical Decoding / Debezium)</strong> streams committed row changes straight from <code>pg_wal</code> to Kafka/Search, eliminating Dual-Write inconsistencies.',
      ],
      callout: {
        kind: 'insight',
        text: 'DROP/DETACH PARTITION reclaims gigabytes instantaneously without generating dead tuples or triggering VACUUM!',
      },
      changes: ['+ Partition Pruning scans only matching month', '+ WAL Logical Decoding streams CDC to Kafka'],
      metrics: { mvcc_state: 'pg_wal CDC', lock_mode: 'Instant DROP', index_type: 'Pruned Part', scale_feature: '0 Dual-Write' },
      scene: {
        entities: {
          part: makeDb(-14, -10, { r: 2.2, h: 48, color: 'blue', label: ['Partitioned Tbl'], sub: 'RANGE / month' }),
          wal: makeBlock(0, -10, { s: 4.8, h: 54, color: 'purple', glyph: 'workflow', label: ['WAL Decoding'], sub: 'pgoutput CDC' }),
          kafka: makeBlock(15, -10, { s: 4.8, h: 54, color: 'green', glyph: 'server', label: ['Kafka / Search'], sub: '0 dual-write' }),
          card: makePanel({ x: -12, y: 12 }, 'Partition Pruning & Debezium WAL CDC', [
            'CREATE TABLE events (...) PARTITION BY RANGE (created_at);',
            '-- Instant retention cleanup (0 dead tuples, 0 VACUUM!):',
            'ALTER TABLE events DETACH PARTITION events_2025_01 CONCURRENTLY;',
            '-- Debezium reads pg_wal logical slot -> publishes to Kafka',
          ], { icon: 'terminal' }),
        },
        links: {
          pt_wl: makeLink('part', 'wal', ['part', 'wal'], { heads: 'end', label: 'pg_wal' }),
          wl_kf: makeLink('wal', 'kafka', ['wal', 'kafka'], { heads: 'end', label: 'CDC stream' }),
        },
        flows: [{ route: ['pt_wl', 'wl_kf'], kind: 'res', rate: 1.9 }],
      },
    },],
  };

export { $a as transactionsLesson };
export default $a;
