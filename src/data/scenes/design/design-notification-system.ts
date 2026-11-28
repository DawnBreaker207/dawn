import { makeBlock, makeCrowd, makeDb, makeLink, makePanel, makeQueue, cardAt, type Tag, type SceneOpts } from '@/lib/simulator/scene-builders';

// One stage for the whole lesson. Shoppers trigger an order event; the notification
// service fans it out to one worker per channel. Each later step adds one piece:
// queues, preferences, retries + DLQ, dedupe, rate limits, delivery tracking.
//
//                 SMS ── (queue) ─┐        ┌─ (queue) ── Email
//   preferences ─── Notification service ──┤
//   shoppers → Order service ─┘            └─ (queue) ── Push ── delivery log

const shoppers = () => makeCrowd({ x0: -14, x1: -8, y0: -20, y1: -15 }, 9, `shoppers`);
const orders = (tags: Tag[] = []) =>
  makeBlock(0, -16, { s: 4.4, h: 50, color: `yellow`, glyph: `cart`, label: [`Order`, `service`], tags });
const notif = (tags: Tag[] = [], o: SceneOpts = {}) =>
  makeBlock(0, -4, { s: 4.8, h: 54, glyph: `send`, label: [`Notification`, `service`], tags, ...o });
const prefs = (tags: Tag[] = []) => makeDb(-12, -4, { r: 1.9, h: 44, glyph: `userCheck`, label: `preferences`, tags });
const channel = (x: number, y: number, glyph: string, name: string, sub: string) => (tags: Tag[] = []) =>
  makeBlock(x, y, { s: 4.4, h: 50, color: `green`, glyph, label: [name], sub, tags });
const push = channel(12, -4, `smartphone`, `Push`, `APNs · FCM`);
const email = channel(8, 10, `mail`, `Email`, `SES`);
const sms = channel(-7, 10, `message`, `SMS`, `Twilio`);
const log = (tags: Tag[] = []) => makeDb(16, -16, { r: 1.8, h: 42, color: `store`, glyph: `chart`, label: `delivery log`, tags });

// Backlog dots sitting on each notif → channel link, newest message nearest the service.
const qPush = (n: number) => makeQueue(9.2, -4, n, [-1, 0]);
const qEmail = (n: number) => makeQueue(6.56, 7.48, n, [-0.5, -0.87]);
const qSms = (n: number) => makeQueue(-5.7, 7.41, n, [0.45, -0.89]);
const dlq = (n: number) => makeQueue(12.95, -6.85, n, [0.32, -0.95], { color: `#e5534b` });

const links = {
  shop: makeLink(`users`, `orders`, [`users`, `orders`], { heads: `both` }),
  notify: makeLink(`orders`, `notif`, [`orders`, `notif`], { heads: `both` }),
  // first draft: synchronous calls that wait for the provider
  callPush: makeLink(`notif`, `push`, [`notif`, `push`], { heads: `both` }),
  callEmail: makeLink(`notif`, `email`, [`notif`, `email`], { heads: `both` }),
  // after the queues: fire and forget
  toPush: makeLink(`notif`, `push`, [`notif`, `push`]),
  toEmail: makeLink(`notif`, `email`, [`notif`, `email`]),
  toSms: makeLink(`notif`, `sms`, [`notif`, `sms`]),
  prefs: makeLink(`notif`, `prefs`, [`notif`, `prefs`], { heads: `both` }),
  sent: makeLink(`notif`, `log`, [`notif`, `log`]),
  receipts: makeLink(`push`, `log`, [`push`, `log`]),
};

const front = { shop: links.shop, notify: links.notify };
const fanout = { ...front, toPush: links.toPush, toEmail: links.toEmail };
const fanout3 = { ...fanout, prefs: links.prefs, toSms: links.toSms };

const caller = (rate = 1.6) => ({ route: [`shop`, `notify`], rate, bounce: true });
const drains = (push = 1.4, mail = 0.9, text = 0.5) => [
  { route: [`toPush`], kind: `msg`, rate: push },
  { route: [`toEmail`], kind: `msg`, rate: mail },
  ...(text ? [{ route: [`toSms`], kind: `msg`, rate: text }] : []),
];

/** Artifact card, parked in the empty band above-left of the service. */
const card = cardAt({ x: 0, y: -4, dx: -414, dy: -298 });

export const designNotificationSystemLesson = {
  id: `design-notification-system`,
  title: `Design a Notification System`,
  summary: `One service every team calls to reach users by push, email and SMS — fast for the caller, polite to the user, honest about delivery.`,
  minutes: 14,
  level: `intermediate`,
  metrics: [`checkout`, `rps`, `errors`, `dupes`],
  legend: [`req`, `res`, [`msg`, `notification`], [`write`, `log write`], [`push`, `provider callback`], `fail`],
  goals: [
    { text: `Size a bursty fan-out`, step: 2 },
    { text: `Decouple callers with a queue per channel`, step: 5 },
    { text: `Check preferences before sending`, step: 6 },
    { text: `Retries, a DLQ and no duplicates`, step: 8 },
    { text: `Rate limits and delivery tracking`, step: 10 },
  ],
  steps: [
    {
      short: `The brief`,
      chapter: `setup`,
      title: `The brief: one way to reach users`,
      body: [
        `Every team wants to talk to users: “your order shipped”, password resets, a weekly promo. Instead of each team wiring up Apple, Google, an email provider and an SMS gateway on its own, build <b>one notification service</b> they all call.`,
        `What matters: calling it must never slow the caller down, users get messages only on the channels they chose, nobody gets the same message twice, and we can always answer “was it delivered?”.`,
      ],
      callout: {
        kind: `insight`,
        text: `A notification system is a fan-out problem with manners: one event in, many messages out — to slow, flaky third parties, on behalf of people who can switch you off.`,
      },
      metrics: { checkout: null, rps: `—`, errors: null, dupes: `—` },
      scene: {
        entities: {
          users: shoppers(),
          orders: orders(),
          notif: notif([], { sub: `to be designed` }),
          card: card(
            `Requirements`,
            [`notify(user, "order_shipped", data)`, `→ push · email · SMS, per user choice`, `= never slow down the caller`, `# no spam · no duplicates · no lost receipts`],
            `clipboard`,
          ),
        },
        links: front,
        flows: [caller(1.2)],
      },
    },
    {
      short: `Numbers`,
      chapter: `setup`,
      title: `Put numbers on it`,
      body: [
        `50 million users, about one notification every five days each: <b>10 million a day</b>, roughly 120 a second on average.`,
        `But the average lies. Marketing sends a promo to 5 million people in 15 minutes — about <b>5,500 a second</b>, nearly 50× the average. The design has to absorb bursts, not just carry a steady flow.`,
      ],
      callout: {
        kind: `tip`,
        text: `For fan-out systems, size the burst, not the day. A queue can smooth a burst; a synchronous call chain can’t.`,
      },
      changes: [`+ 10 M notifications/day ≈ 120/s`, `+ promo bursts ≈ 5,500/s`],
      metrics: { checkout: null, rps: `120 avg · 5.5k peak`, errors: null, dupes: `—` },
      scene: {
        entities: {
          users: shoppers(),
          orders: orders(),
          notif: notif([], { sub: `to be designed` }),
          card: card(
            `Napkin math`,
            [`50 M users × 0.2/day = 10 M/day`, `10 M ÷ 86,400 s ≈ 120/s average`, `promo: 5 M in 15 min ≈ 5,500/s`, `= design for bursts 50× the average`],
            `sigma`,
          ),
        },
        links: front,
        flows: [caller(2)],
      },
    },
    {
      short: `First draft`,
      chapter: `solution`,
      title: `The simplest thing: call the providers`,
      body: [
        `Version one: the order service calls <code>notify()</code>, and the notification service immediately calls Apple/Google for push and the email provider, then answers “done”.`,
        `It works in a demo. Notice the shape, though: the order service is now waiting for two companies it doesn’t control.`,
      ],
      callout: {
        kind: `insight`,
        text: `Count the systems on the critical path of checkout. Every one of them can make it slow — including ones that only send a “thanks for your order” email.`,
      },
      changes: [`+ Push worker`, `+ Email worker`, `~ Called synchronously, inside checkout`],
      metrics: { checkout: 900, rps: 120, errors: 0.5, dupes: `—` },
      scene: {
        entities: {
          users: shoppers(),
          orders: orders(),
          notif: notif(),
          push: push(),
          email: email(),
          card: card(
            `Inside checkout`,
            [`POST /checkout             900 ms`, `  notify() → push          180 ms`, `  notify() → email         400 ms`, `# checkout waits for both`],
            `timer`,
          ),
        },
        links: { ...front, callPush: links.callPush, callEmail: links.callEmail },
        flows: [
          { route: [`shop`, `notify`, `callPush`], rate: 1.2, bounce: true },
          { route: [`callEmail`], rate: 1.2, bounce: true },
        ],
      },
    },
    {
      short: `Slow email`,
      chapter: `problem`,
      title: `Case: the email provider slows down`,
      body: [
        `During a promo the email provider starts throttling: each call takes <b>2.4 seconds</b>, and some time out. Push is fine — but it doesn’t matter.`,
        `Checkout now takes 2.6 s at p95, and 4% of orders fail because <code>notify()</code> threw an error. A “thank you” email is breaking payments.`,
      ],
      callout: {
        kind: `warn`,
        text: `Synchronous fan-out ties your availability to the slowest, least reliable dependency. Three providers at 99.9% each give you at most 99.7%.`,
      },
      changes: [`− Email provider: 2.4 s per call, timeouts`, `− Checkout p95 900 ms → 2.6 s`],
      metrics: { checkout: 2600, rps: 120, errors: 4, dupes: `—` },
      scene: {
        entities: {
          users: shoppers(),
          orders: orders([{ text: `checkout waits`, tone: `amber`, icon: `hourglass` }]),
          notif: notif(),
          push: push(),
          email: email([{ text: `2.4 s · throttled`, tone: `red`, icon: `alert` }]),
          card: card(
            `Trace`,
            [`POST /checkout           2,640 ms`, `  notify() → push          180 ms`, `! notify() → email       2,400 ms`, `= a slow provider slows checkout`],
            `activity`,
          ),
        },
        links: { ...front, callPush: links.callPush, callEmail: { ...links.callEmail, fail: 0.15 } },
        flows: [
          { route: [`shop`, `notify`, `callPush`], rate: 1, bounce: true },
          { route: [`callEmail`], kind: `slow`, rate: 1, bounce: true },
        ],
      },
    },
    {
      short: `Queue it`,
      chapter: `solution`,
      title: `A queue per channel`,
      body: [
        `Make <code>notify()</code> do almost nothing: validate the request, store it, put one message on a <span class="term">queue</span> per channel, and answer <code>202 Accepted</code> in about 20 ms.`,
        `Workers for each channel drain their own queue at their own pace. When email slows down, only the email backlog grows. Push keeps flowing, and checkout never notices (see <em>Message Queues</em>).`,
      ],
      callout: {
        kind: `tip`,
        text: `Separate queues isolate failures. One shared queue would let a stuck email backlog block every push behind it.`,
      },
      changes: [`+ Push queue`, `+ Email queue`, `~ notify() answers 202 in ~20 ms`, `~ Checkout p95 2.6 s → 180 ms`],
      metrics: { checkout: 180, rps: 120, errors: 0.1, dupes: `—` },
      scene: {
        entities: {
          users: shoppers(),
          orders: orders(),
          notif: notif([{ text: `202 Accepted`, tone: `green`, icon: `check` }]),
          push: push(),
          email: email([{ text: `backlog, not outage`, tone: `amber`, icon: `hourglass` }]),
          qPush: qPush(1),
          qEmail: qEmail(5),
          card: card(
            `The API`,
            [`POST /notify  { user: 42, type: "shipped" }`, `→ 202 Accepted  { id: "n_8f3a" }`, `# each channel drains its own queue`],
            `braces`,
          ),
        },
        links: fanout,
        flows: [caller(2), ...drains(1.6, 0.6, 0)],
      },
    },
    {
      short: `Prefs`,
      chapter: `technique`,
      title: `Ask the user’s preferences first`,
      body: [
        `Before anything is queued, the service reads the user’s <b>preferences</b>: which channels they allow for this kind of message, quiet hours in their time zone, and the device tokens and addresses to use.`,
        `Ana wants order updates by push and SMS, no email, and nothing at night. Now SMS joins as a third channel with its own queue — and only users who opted in ever reach it.`,
      ],
      callout: {
        kind: `insight`,
        text: `Preferences aren’t a nice-to-have. Ignoring an unsubscribe is illegal in many countries, and every unwanted message trains people to turn you off entirely.`,
      },
      changes: [`+ Preferences store`, `+ SMS worker and queue`, `~ Channels chosen per user and per message type`],
      metrics: { checkout: 180, rps: 120, errors: 0.1, dupes: `—` },
      scene: {
        entities: {
          users: shoppers(),
          orders: orders(),
          notif: notif([{ text: `check prefs first`, tone: `violet`, icon: `userCheck` }]),
          prefs: prefs(),
          push: push(),
          email: email(),
          sms: sms(),
          qPush: qPush(1),
          qEmail: qEmail(2),
          qSms: qSms(1),
          card: card(
            `Ana’s preferences`,
            [`{ user: 42,`, `  push: true, email: false,`, `  sms: "orders only",`, `  quiet: "22:00–07:00 +07" }`],
            `userCheck`,
          ),
        },
        links: fanout3,
        flows: [caller(), { route: [`prefs`], rate: 1.2, bounce: true }, ...drains()],
      },
    },
    {
      short: `Retries`,
      chapter: `problem`,
      title: `Case: providers fail, sometimes forever`,
      body: [
        `Apple’s push service answers <code>503</code> for 2% of requests during an incident. Those are worth retrying: wait 2 s, then 4 s, then 8 s, with a little random <span class="term">jitter</span> so a thousand workers don’t retry in lockstep.`,
        `Other errors will never succeed: an uninstalled app (<code>BadDeviceToken</code>), an unsubscribed address. Retrying them wastes capacity, so they go straight to a <span class="term">dead-letter queue</span> and the stale token is removed.`,
      ],
      callout: {
        kind: `warn`,
        text: `Retry only what can succeed later. Retrying permanent errors turns one bad token into an endless loop of failing work (see <em>Timeouts & Retries</em>).`,
      },
      changes: [`+ Retries with backoff and jitter`, `+ Dead-letter queue for permanent failures`],
      metrics: { checkout: 180, rps: 120, errors: 0.3, dupes: `0.4%` },
      scene: {
        entities: {
          users: shoppers(),
          orders: orders(),
          notif: notif(),
          prefs: prefs(),
          push: push([{ text: `503 → retry`, tone: `amber`, icon: `refresh` }]),
          email: email(),
          sms: sms(),
          qPush: qPush(4),
          qEmail: qEmail(1),
          qSms: qSms(1),
          dlq: dlq(3),
          card: card(
            `Push worker`,
            [`attempt 1   → 503 Service Unavailable`, `retry in 2 s → 4 s → 8 s (+ jitter)`, `! BadDeviceToken → no retry, to DLQ`, `= 5 failed tries → DLQ + alert`],
            `refresh`,
          ),
        },
        links: { ...fanout3, toPush: { ...links.toPush, fail: 0.2 } },
        flows: [caller(), ...drains(1.8, 0.9, 0.5)],
      },
    },
    {
      short: `Dedupe`,
      chapter: `technique`,
      title: `No double notifications`,
      body: [
        `Retries have a side effect. A worker sends the push, then crashes before telling the queue it’s done. The queue hands the message to another worker, and Ana gets “Your order shipped” twice.`,
        `Queues deliver <b>at least once</b>, so workers must be safe to repeat. Every notification carries an id; the worker skips ids it has already sent and passes the id to the provider, which collapses repeats it sees.`,
      ],
      callout: {
        kind: `insight`,
        text: `“Exactly once” is really “at least once” plus an idempotent receiver. A tiny gap remains — a crash between sending and recording — so aim for rare duplicates, never lost messages.`,
      },
      changes: [`+ Dedupe by notification id (24 h)`, `~ Duplicates 0.4% → under 0.01%`],
      metrics: { checkout: 180, rps: 120, errors: 0.3, dupes: `< 0.01%` },
      scene: {
        entities: {
          users: shoppers(),
          orders: orders(),
          notif: notif(),
          prefs: prefs(),
          push: push([{ text: `dedupe by id`, tone: `green`, icon: `fingerprint` }]),
          email: email(),
          sms: sms(),
          qPush: qPush(1),
          qEmail: qEmail(1),
          qSms: qSms(1),
          dlq: dlq(2),
          card: card(
            `Idempotent worker`,
            [`if seen("n_8f3a"): ack(); return`, `apns.send(token, body, collapse_id="n_8f3a")`, `mark_seen("n_8f3a", ttl="24h"); ack()`, `# crash between send and mark → rare duplicate`],
            `fingerprint`,
          ),
        },
        links: fanout3,
        flows: [caller(), ...drains()],
      },
    },
    {
      short: `Limits`,
      chapter: `technique`,
      title: `Promo day: limits and priorities`,
      body: [
        `The 5-million promo lands. Two kinds of limit keep it civil. <b>Per user</b>: at most three marketing messages a day, none in quiet hours. <b>Per provider</b>: the SMS contract allows 100 messages a second, so its workers pace themselves and the backlog simply waits (see <em>Rate Limiting</em>).`,
        `And priority: password resets and order updates go on a faster lane than marketing, so a promo never delays a login code.`,
      ],
      callout: {
        kind: `tip`,
        text: `Transactional and marketing messages share code but not queues. A two-factor code stuck behind five million coupons is an outage.`,
      },
      changes: [`+ Per-user caps`, `+ Per-provider rate limits`, `+ Transactional lane jumps the promo queue`],
      metrics: { checkout: 180, rps: `5,500 peak`, errors: 0.3, dupes: `< 0.01%` },
      scene: {
        entities: {
          users: shoppers(),
          orders: orders(),
          notif: notif([{ text: `≤ 3 promos / day`, tone: `violet`, icon: `filter` }]),
          prefs: prefs(),
          push: push(),
          email: email(),
          sms: sms([{ text: `100/s cap`, tone: `amber`, icon: `gauge` }]),
          qPush: qPush(3),
          qEmail: qEmail(4),
          qSms: qSms(6),
          dlq: dlq(2),
          card: card(
            `Limits`,
            [`limit(user, "marketing") = 3 per day`, `limit(provider="sms") = 100 per s`, `= transactional lane always first`],
            `gauge`,
          ),
        },
        links: fanout3,
        flows: [caller(2.4), ...drains(2.6, 1.8, 0.6)],
      },
    },
    {
      short: `Tracking`,
      chapter: `technique`,
      title: `Was it delivered?`,
      body: [
        `Support asks: did Ana get the reset email? The service writes every state change to a <b>delivery log</b> — queued, sent — and providers report the rest back through <span class="term">webhooks</span>: delivered, opened, bounced.`,
        `The log closes the loop. A permanent email bounce turns that channel off in her preferences; delivery rates per provider show up on a dashboard long before users complain (see <em>Observability</em>).`,
      ],
      callout: {
        kind: `insight`,
        text: `Sending is half the job. Without receipts you can’t debug, can’t measure, and keep paying to message addresses that stopped existing.`,
      },
      changes: [`+ Delivery log`, `+ Provider webhooks: delivered · opened · bounced`],
      metrics: { checkout: 180, rps: 120, errors: 0.3, dupes: `< 0.01%` },
      scene: {
        entities: {
          users: shoppers(),
          orders: orders(),
          notif: notif(),
          prefs: prefs(),
          push: push(),
          email: email(),
          sms: sms(),
          qPush: qPush(1),
          qEmail: qEmail(1),
          qSms: qSms(1),
          dlq: dlq(1),
          log: log([{ text: `98.7% delivered`, tone: `green`, icon: `chart` }]),
          card: card(
            `Webhook`,
            [`POST /webhooks/ses`, `{ "id": "n_8f3a", "event": "Bounce",`, `  "type": "Permanent" }`, `= turn email off in preferences`],
            `inbox`,
          ),
        },
        links: { ...fanout3, sent: links.sent, receipts: links.receipts },
        flows: [
          caller(),
          ...drains(),
          { route: [`sent`], kind: `write`, rate: 1 },
          { route: [`receipts`], kind: `push`, rate: 1 },
        ],
      },
    },
    {
      short: `Recap`,
      chapter: `recap`,
      title: `The finished design`,
      body: [
        `<table class="compare">
          <thead><tr><th>Question</th><th>Decision</th><th>Because</th></tr></thead>
          <tbody>
            <tr><td>Callers</td><td>202 + queue per channel</td><td>Never wait on providers</td></tr>
            <tr><td>Channels</td><td>Read preferences first</td><td>Consent, quiet hours</td></tr>
            <tr><td>Failures</td><td>Backoff retries + DLQ</td><td>Transient vs permanent</td></tr>
            <tr><td>Duplicates</td><td>Dedupe by notification id</td><td>Queues are at-least-once</td></tr>
            <tr><td>Bursts</td><td>Caps, rate limits, priority</td><td>Promos never block logins</td></tr>
            <tr><td>Receipts</td><td>Delivery log + webhooks</td><td>Answer “was it delivered?”</td></tr>
          </tbody>
        </table>`,
        `The pattern generalises: accept fast, queue per destination, make every step safe to repeat, and keep a record of what really happened.`,
      ],
      callout: {
        kind: `next`,
        text: `Next up: <b>Design a Payment System</b> — where a duplicate isn’t annoying, it’s someone’s money.`,
      },
      metrics: { checkout: 180, rps: 120, errors: 0.3, dupes: `< 0.01%` },
      scene: {
        entities: {
          users: shoppers(),
          orders: orders(),
          notif: notif(),
          prefs: prefs(),
          push: push(),
          email: email(),
          sms: sms(),
          qPush: qPush(1),
          qEmail: qEmail(1),
          qSms: qSms(1),
          log: log(),
        },
        links: { ...fanout3, sent: links.sent, receipts: links.receipts },
        flows: [caller(), ...drains(), { route: [`sent`], kind: `write`, rate: 0.8 }, { route: [`receipts`], kind: `push`, rate: 0.8 }],
      },
    },
  ],
};

export default designNotificationSystemLesson;
