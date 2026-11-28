import { makeBlock, makeCrowd, makeDb, makeLink, makePanel, cardAt, type Tag, type SceneOpts } from '@/lib/simulator/scene-builders';

// One stage for the whole lesson: shoppers pay through a payment service that talks to
// an external PSP. Each step adds one safeguard — payments table, idempotency keys,
// a state machine, a double-entry ledger, an outbox, webhooks, reconciliation.
//
//                      payments db ── outbox relay
//   ledger ── Payment service ──────── PSP
//   shoppers ──┘                        └── reconcile

const shoppers = (label = `shoppers`) => makeCrowd({ x0: -4.5, x1: 4.5, y0: -19, y1: -13 }, 12, label);
const api = (tags: Tag[] = [], o: SceneOpts = {}) =>
  makeBlock(0, -4, { s: 4.8, h: 54, glyph: `creditCard`, label: [`Payment`, `service`], tags, ...o });
const payments = (tags: Tag[] = []) => makeDb(-7, 10, { r: 1.9, h: 44, glyph: `database`, label: `payments`, tags });
const psp = (tags: Tag[] = []) =>
  makeBlock(12, -4, { s: 4.4, h: 50, color: `orange`, glyph: `building`, label: [`PSP`], sub: `Stripe · Adyen`, tags });
const ledger = (tags: Tag[] = []) => makeDb(-12, -4, { r: 1.9, h: 44, color: `store`, glyph: `book`, label: `ledger`, tags });
const relay = (tags: Tag[] = []) =>
  makeBlock(8, 10, { s: 4.4, h: 50, color: `yellow`, glyph: `send`, label: [`Outbox`, `relay`], tags });
const recon = (tags: Tag[] = []) =>
  makeBlock(16, -16, { s: 4.4, h: 50, color: `purple`, glyph: `scale`, label: [`Reconcile`], sub: `nightly job`, tags });

const links = {
  pay: makeLink(`users`, `api`, [`users`, `api`], { heads: `both` }),
  charge: makeLink(`api`, `psp`, [`api`, `psp`], { heads: `both` }),
  save: makeLink(`api`, `payments`, [`api`, `payments`], { heads: `both` }),
  post: makeLink(`api`, `ledger`, [`api`, `ledger`]),
  outbox: makeLink(`payments`, `relay`, [`payments`, `relay`]),
  // PSP → service callback, drawn as its own lane just beside the charge link
  hook: makeLink(`psp`, `api`, [[12, -5.7], [2.8, -5.7]]),
  settle: makeLink(`psp`, `recon`, [`psp`, `recon`]),
  check: makeLink(`recon`, `payments`, [`recon`, `payments`], { style: `dashed` }),
};

const core = { pay: links.pay, save: links.save, charge: links.charge };
const withLedger = { ...core, post: links.post };
const withOutbox = { ...withLedger, outbox: links.outbox };

const paying = (rate = 1.4) => ({ route: [`pay`, `charge`], rate, bounce: true });
const writes = (rate = 1) => ({ route: [`save`], kind: `write`, rate });

/** Artifact card, parked in the empty band above-left of the service. */
const card = cardAt({ x: 0, y: -4, dx: -414, dy: -298 });

export const designPaymentSystemLesson = {
  id: `design-payment-system`,
  title: `Design a Payment System`,
  summary: `Low traffic, zero tolerance: charge every customer exactly once and account for every cent, even when networks and servers fail mid-payment.`,
  minutes: 15,
  level: `advanced`,
  metrics: [`p95`, `errors`, `doubles`, `ledger`],
  legend: [`req`, `res`, [`write`, `db write`], [`msg`, `event`], [`push`, `webhook`], `fail`],
  goals: [
    { text: `Size the risk, not the load`, step: 2 },
    { text: `Idempotency keys stop double charges`, step: 5 },
    { text: `Record money with a double-entry ledger`, step: 7 },
    { text: `Outbox: one transaction, reliable events`, step: 9 },
    { text: `Webhooks and reconciliation`, step: 11 },
  ],
  steps: [
    {
      short: `The brief`,
      chapter: `setup`,
      title: `The brief: take people’s money`,
      body: [
        `The shop needs to accept card payments. We won’t talk to banks directly — a <span class="term">payment service provider</span> (PSP) such as Stripe or Adyen does that. Our job is the system around it.`,
        `The bar is different from every design so far. A slow feed is annoying; a customer charged twice, or an order shipped without being paid for, is a real loss. <b>Correctness beats speed</b> everywhere in this lesson.`,
      ],
      callout: {
        kind: `insight`,
        text: `In money systems the question is never “is it fast?” but “what happens if this step runs twice — or not at all?”.`,
      },
      metrics: { p95: null, errors: null, doubles: `—`, ledger: `—` },
      scene: {
        entities: {
          users: shoppers(),
          api: api([], { sub: `to be designed` }),
          card: card(
            `Requirements`,
            [`POST /payments { order, amount, card }`, `= charge exactly once`, `= every cent traceable`, `# correctness over speed`],
            `clipboard`,
          ),
        },
        links: { pay: links.pay },
        flows: [{ route: [`pay`], rate: 1.2, bounce: true }],
      },
    },
    {
      short: `Numbers`,
      chapter: `setup`,
      title: `Size the risk, not the load`,
      body: [
        `One million payments a day is only about <b>12 a second</b>, and maybe 300 at a Black Friday peak. Any single database handles that.`,
        `The scary number is a different one: with an average order of $50, an error rate of just 0.01% means <b>$5,000 a day</b> charged wrongly or not at all. Every step below is about driving that to zero.`,
      ],
      callout: {
        kind: `tip`,
        text: `Some systems are hard because of scale, some because of stakes. Payments are the second kind — design for the worst failure, not the busiest minute.`,
      },
      changes: [`+ 1 M payments/day ≈ 12/s, 300/s peak`, `+ 0.01% wrong ≈ $5,000/day`],
      metrics: { p95: null, errors: null, doubles: `—`, ledger: `—` },
      scene: {
        entities: {
          users: shoppers(),
          api: api([], { sub: `to be designed` }),
          card: card(
            `Napkin math`,
            [`1 M/day ÷ 86,400 s ≈ 12/s`, `Black Friday peak ≈ 300/s`, `0.01% × $50 × 1 M = $5,000/day`, `= the load is easy; the stakes are not`],
            `sigma`,
          ),
        },
        links: { pay: links.pay },
        flows: [{ route: [`pay`], rate: 1.6, bounce: true }],
      },
    },
    {
      short: `First draft`,
      chapter: `solution`,
      title: `Save, charge, update`,
      body: [
        `Version one: write a <code>pending</code> row to a payments table, ask the PSP to charge the card, then mark the row <code>succeeded</code> or <code>failed</code>.`,
        `Card numbers never touch our servers: the browser sends them straight to the PSP and we only see a token. That keeps most of the PCI security burden off our system.`,
      ],
      callout: {
        kind: `insight`,
        text: `The pending row is written <em>before</em> the charge. If anything goes wrong later, there is at least a record that we tried.`,
      },
      changes: [`+ Payments table`, `+ PSP`],
      metrics: { p95: 800, errors: 0.5, doubles: `—`, ledger: `none` },
      scene: {
        entities: {
          users: shoppers(),
          api: api(),
          payments: payments(),
          psp: psp(),
          card: card(
            `Version one`,
            [`INSERT INTO payments (id, amount, status)`, `  VALUES ('p_91', 4999, 'pending');`, `res = psp.charge(token, 4999)`, `UPDATE payments SET status = res.status;`],
            `braces`,
          ),
        },
        links: core,
        flows: [paying(), writes()],
      },
    },
    {
      short: `Timeout`,
      chapter: `problem`,
      title: `Case: the reply that never came`,
      body: [
        `The PSP charges the card, but its answer is lost on the way back. After 10 seconds our call times out, the page says “payment failed”, and the customer clicks <b>Pay</b> again.`,
        `The second attempt succeeds. The customer is billed twice for one order — and from our side, the first payment looks like a failure.`,
      ],
      callout: {
        kind: `warn`,
        text: `A timeout doesn’t mean “it didn’t happen”. It means “I don’t know”. Treating unknown as failed is how double charges are born.`,
      },
      changes: [`− Lost reply → user retries → charged twice`],
      metrics: { p95: 1200, errors: 2, doubles: `0.2%`, ledger: `none` },
      scene: {
        entities: {
          users: shoppers(`clicks Pay again`),
          api: api([{ text: `timeout → retry`, tone: `amber`, icon: `hourglass` }]),
          payments: payments(),
          psp: psp([{ text: `charged twice`, tone: `red`, icon: `alert` }]),
          card: card(
            `What happened`,
            [`12:00:00  charge(4999)   attempt 1`, `12:00:10  ! timeout — but PSP charged it`, `12:00:12  charge(4999)   attempt 2`, `= customer billed $99.98`],
            `alertTriangle`,
          ),
        },
        links: { ...core, charge: { ...links.charge, fail: 0.3 } },
        flows: [paying(1.8), writes()],
      },
    },
    {
      short: `Idempotency`,
      chapter: `solution`,
      title: `Idempotency keys`,
      body: [
        `The checkout page creates one <span class="term">idempotency key</span> per purchase and sends it with every attempt. The payment service stores the key with the payment under a unique constraint: a repeat with the same key returns the stored result instead of charging again.`,
        `The key also goes to the PSP, which keeps its own copy — so even our own retries after a timeout can never create a second charge.`,
      ],
      callout: {
        kind: `tip`,
        text: `The key must come from the client and identify the <em>intent</em> (“pay for order 7”), not the request. A fresh key per click would dedupe nothing.`,
      },
      changes: [`+ Idempotency key per purchase`, `~ Same key → same result, no new charge`, `~ Double charges 0.2% → 0`],
      metrics: { p95: 820, errors: 0.5, doubles: `0`, ledger: `none` },
      scene: {
        entities: {
          users: shoppers(),
          api: api([{ text: `same key → same result`, tone: `green`, icon: `key` }]),
          payments: payments([{ text: `UNIQUE(key)`, icon: `fingerprint` }]),
          psp: psp(),
          card: card(
            `Every attempt`,
            [`POST /payments`, `Idempotency-Key: 6f1c-…-e2`, `{ order: "o_7", amount: 4999 }`, `= retries are now free`],
            `key`,
          ),
        },
        links: core,
        flows: [paying(), writes()],
      },
    },
    {
      short: `States`,
      chapter: `technique`,
      title: `A payment is a state machine`,
      body: [
        `“Paid: yes or no” is too simple. A card payment is first <b>authorized</b> (money reserved), later <b>captured</b> (money taken) when the order ships, and may be <b>voided</b> or <b>refunded</b>.`,
        `Add one more state: <b>unknown</b>. A timeout moves a payment there, and a background job asks the PSP for the truth using the idempotency key. Only legal transitions are allowed, so a captured payment can’t quietly become “failed”.`,
      ],
      callout: {
        kind: `insight`,
        text: `Explicit states turn vague bugs into rejected transitions you can see and alert on.`,
      },
      changes: [`+ States: authorized · captured · voided · refunded`, `+ unknown → resolved by asking the PSP`],
      metrics: { p95: 820, errors: 0.5, doubles: `0`, ledger: `none` },
      scene: {
        entities: {
          users: shoppers(),
          api: api(),
          payments: payments([{ text: `p_91: unknown → ask PSP`, tone: `amber`, icon: `refresh` }]),
          psp: psp(),
          card: card(
            `Payment states`,
            [`created → authorized → captured`, `authorized → voided   (order cancelled)`, `captured → refunded`, `timeout → unknown → GET /charges/{key}`],
            `workflow`,
          ),
        },
        links: core,
        flows: [paying(), writes(), { route: [`charge`], rate: 0.4, bounce: true }],
      },
    },
    {
      short: `Ledger`,
      chapter: `solution`,
      title: `Double-entry bookkeeping`,
      body: [
        `Finance needs to know where every cent is. A status column can’t answer that, so add a <span class="term">ledger</span>: an append-only list of entries, written the way accountants have for 500 years.`,
        `Every movement is <b>two entries</b> that cancel out: the customer’s account is debited $49.99, the shop’s is credited $49.99. Balances are sums of entries, never edited in place, and if the totals don’t net to zero, something is wrong.`,
      ],
      callout: {
        kind: `tip`,
        text: `Never update a balance. Append a correcting entry instead — the history is the audit trail.`,
      },
      changes: [`+ Ledger: append-only, double-entry`, `~ Debits and credits always sum to zero`],
      metrics: { p95: 840, errors: 0.5, doubles: `0`, ledger: `balanced` },
      scene: {
        entities: {
          users: shoppers(),
          api: api(),
          payments: payments(),
          psp: psp(),
          ledger: ledger([{ text: `Σ = 0`, tone: `green`, icon: `scale` }]),
          card: card(
            `Ledger entries`,
            [`entry  account          debit   credit`, `e1     customer:42      49.99`, `e1     merchant:shop            49.99`, `= sum(debit) − sum(credit) = 0`],
            `book`,
          ),
        },
        links: withLedger,
        flows: [paying(), writes(), { route: [`post`], kind: `write`, rate: 1 }],
      },
    },
    {
      short: `Dual write`,
      chapter: `problem`,
      title: `Case: a crash between two writes`,
      body: [
        `Capture succeeds and the payment row says <code>captured</code>. Then the server crashes before it writes the ledger entries and before it tells the order service.`,
        `Money was taken, the books don’t show it, and the order sits unpaid forever. Two separate writes can’t be made atomic by being careful — one of them will eventually be skipped.`,
      ],
      callout: {
        kind: `warn`,
        text: `This is the dual-write problem: updating two systems without a shared transaction. It doesn’t fail often, but at a million payments a day “not often” is every day.`,
      },
      changes: [`− Payment captured, ledger and order never heard`],
      metrics: { p95: 840, errors: 0.5, doubles: `0`, ledger: `off by $1,240` },
      scene: {
        entities: {
          users: shoppers(),
          api: api([{ text: `crash between writes`, tone: `red`, icon: `alert` }]),
          payments: payments([{ text: `captured`, tone: `green` }]),
          psp: psp(),
          ledger: ledger([{ text: `entry missing`, tone: `red`, icon: `alert` }]),
          card: card(
            `Two writes, one crash`,
            [`UPDATE payments SET status = 'captured';  ✓`, `! crash`, `INSERT INTO ledger …;            never ran`, `publish("payment.captured");     never ran`],
            `alertTriangle`,
          ),
        },
        links: { ...core, post: { ...links.post, style: `cut` } },
        flows: [paying(), writes()],
      },
    },
    {
      short: `Outbox`,
      chapter: `solution`,
      title: `One transaction and an outbox`,
      body: [
        `Keep the ledger tables in the same database as payments, and write everything in <b>one transaction</b>: the status change, the ledger entries, and a row in an <span class="term">outbox</span> table describing the event. Either all of it commits or none of it does.`,
        `A small <b>relay</b> reads new outbox rows and publishes them — <code>payment.captured</code> reaches the order and email services. It may publish a row twice, so consumers dedupe by event id (see <em>Sagas</em>).`,
      ],
      callout: {
        kind: `tip`,
        text: `The outbox turns “write to the DB and send a message” into “write to the DB”. The message becomes a consequence of a committed fact.`,
      },
      changes: [`+ Outbox table, same transaction`, `+ Relay publishes events`, `~ Ledger balanced again`],
      metrics: { p95: 850, errors: 0.5, doubles: `0`, ledger: `balanced` },
      scene: {
        entities: {
          users: shoppers(),
          api: api(),
          payments: payments([{ text: `+ outbox row`, tone: `violet`, icon: `inbox` }]),
          psp: psp(),
          ledger: ledger([{ text: `Σ = 0`, tone: `green`, icon: `scale` }]),
          relay: relay([{ text: `→ orders · email`, tone: `violet` }]),
          card: card(
            `One transaction`,
            [`BEGIN;`, `  UPDATE payments SET status = 'captured';`, `  INSERT INTO ledger …;  INSERT INTO outbox …;`, `COMMIT;  -- relay publishes the outbox`],
            `braces`,
          ),
        },
        links: withOutbox,
        flows: [paying(), writes(), { route: [`post`], kind: `write`, rate: 1 }, { route: [`outbox`], kind: `msg`, rate: 1 }],
      },
    },
    {
      short: `Webhooks`,
      chapter: `technique`,
      title: `When the PSP calls you back`,
      body: [
        `Not every payment finishes during the request. 3-D Secure checks, bank transfers and disputes complete minutes or days later, and the PSP tells us through a <span class="term">webhook</span>: an HTTP call to our service.`,
        `Treat webhooks like any untrusted input. Verify the signature, look the payment up by key, apply the state transition only if it’s legal — and record the event id, because PSPs retry webhooks too.`,
      ],
      callout: {
        kind: `insight`,
        text: `Webhooks arrive late, out of order and more than once. The state machine and event-id dedupe make all three harmless.`,
      },
      changes: [`+ Signed webhooks from the PSP`, `~ Deduped by event id, applied via the state machine`],
      metrics: { p95: 850, errors: 0.4, doubles: `0`, ledger: `balanced` },
      scene: {
        entities: {
          users: shoppers(),
          api: api([{ text: `verify · dedupe evt id`, tone: `green`, icon: `shield` }]),
          payments: payments(),
          psp: psp(),
          ledger: ledger(),
          relay: relay(),
          card: card(
            `Webhook`,
            [`POST /webhooks/psp`, `Psp-Signature: t=1732…, v1=9ac…`, `{ "id": "evt_55", "type": "charge.captured" }`, `= verify → dedupe evt_55 → captured`],
            `inbox`,
          ),
        },
        links: { ...withOutbox, hook: links.hook },
        flows: [paying(), writes(), { route: [`hook`], kind: `push`, rate: 0.8 }, { route: [`outbox`], kind: `msg`, rate: 0.8 }],
      },
    },
    {
      short: `Reconcile`,
      chapter: `technique`,
      title: `Trust, but reconcile`,
      body: [
        `Even with all of this, systems drift: a webhook lost for good, a manual refund in the PSP dashboard, a bug. So every night a <span class="term">reconciliation</span> job compares the PSP’s settlement report with our payments and ledger, row by row.`,
        `Most nights it finds nothing. When it finds a payment the PSP has and we don’t, or amounts that differ by a cent, it raises an alert for a human — long before an auditor does.`,
      ],
      callout: {
        kind: `tip`,
        text: `Reconciliation is the safety net under every other safety net. Real payment teams treat its mismatch count as a top-level health metric.`,
      },
      changes: [`+ Nightly reconciliation against the PSP report`],
      metrics: { p95: 850, errors: 0.4, doubles: `0`, ledger: `balanced · checked` },
      scene: {
        entities: {
          users: shoppers(),
          api: api(),
          payments: payments(),
          psp: psp(),
          ledger: ledger(),
          relay: relay(),
          recon: recon([{ text: `2 mismatches / 1 M`, tone: `amber`, icon: `scale` }]),
          card: card(
            `Nightly job`,
            [`settlement.csv JOIN payments ON (key)`, `missing in ours:  1  → create, alert`, `missing at PSP:   1  → mark failed`, `= amounts must match to the cent`],
            `scale`,
          ),
        },
        links: { ...withOutbox, hook: links.hook, settle: links.settle, check: links.check },
        flows: [
          paying(),
          writes(),
          { route: [`settle`], kind: `write`, rate: 0.5 },
          { route: [`check`], rate: 0.5, bounce: true },
        ],
      },
    },
    {
      short: `Recap`,
      chapter: `recap`,
      title: `The finished design`,
      body: [
        `<table class="compare">
          <thead><tr><th>Risk</th><th>Defence</th><th>Because</th></tr></thead>
          <tbody>
            <tr><td>Retry charges twice</td><td>Idempotency key</td><td>Same intent → same result</td></tr>
            <tr><td>Timeouts</td><td>State machine + unknown</td><td>Ask, never guess</td></tr>
            <tr><td>Lost money trail</td><td>Double-entry ledger</td><td>Every cent sums to zero</td></tr>
            <tr><td>Crash mid-update</td><td>One transaction + outbox</td><td>All or nothing</td></tr>
            <tr><td>Late results</td><td>Signed, deduped webhooks</td><td>Arrive late and twice</td></tr>
            <tr><td>Silent drift</td><td>Nightly reconciliation</td><td>Catch what slipped</td></tr>
          </tbody>
        </table>`,
        `None of these are about speed. They are about making every step safe to repeat and every outcome provable.`,
      ],
      callout: {
        kind: `next`,
        text: `Next up: <b>Design Search Autocomplete</b> — back to raw speed: answers in under 100 ms, on every keystroke.`,
      },
      metrics: { p95: 850, errors: 0.4, doubles: `0`, ledger: `balanced · checked` },
      scene: {
        entities: {
          users: shoppers(),
          api: api(),
          payments: payments(),
          psp: psp(),
          ledger: ledger(),
          relay: relay(),
          recon: recon(),
        },
        links: { ...withOutbox, hook: links.hook, settle: links.settle, check: links.check },
        flows: [
          paying(),
          writes(),
          { route: [`post`], kind: `write`, rate: 0.8 },
          { route: [`outbox`], kind: `msg`, rate: 0.8 },
          { route: [`hook`], kind: `push`, rate: 0.5 },
        ],
      },
    },
  ],
};

export default designPaymentSystemLesson;
