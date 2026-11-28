import { DEAD_STATE, makeBlock, makeCool, makeCrowd, makeHot, makeLink, makePanel, type Bag, cardAt } from '@/lib/simulator/scene-builders';

const shoppersArea = { x0: -4.5, x1: 4.5, y0: -23, y1: -17 };

const shoppers = (e = `shoppers`) => makeCrowd(shoppersArea, 11, e);

const orderService = (e: Bag = {}) => makeBlock(0, -10, { color: `orange`, glyph: `cart`, label: [`Order`, `Service`], ...e });

const paymentsService = (e: Bag = {}) => makeBlock(0, 4, { color: `purple`, glyph: `creditCard`, label: [`Payments`], ...e });

const breakerBlock = (e: Bag) =>
    makeBlock(0, -3, {
      s: 3.2,
      h: 34,
      color: `yellow`,
      glyph: `unplug`,
      label: [],
      tags: e,
      pills: `below`,
    });

const links = {
    uo: (e: Bag = {}) => ({
      uo: makeLink(`shoppers`, `order`, [`shoppers`, `order`], { heads: `both`, ...e }),
    }),
    op: (e: Bag = {}) => ({ op: makeLink(`order`, `pay`, [`order`, `pay`], { heads: `both`, ...e }) }),
    viaBreaker: (e = {}, t = {}) => ({
      ob: makeLink(
        `order`,
        `br`,
        [
          [`order+1`, `order`],
          [`br+1`, `br`],
        ],
        { heads: `both`, ...e },
      ),
      bp: makeLink(
        `br`,
        `pay`,
        [
          [`br+1`, `br`],
          [`pay+1`, `pay`],
        ],
        { heads: `both`, ...t },
      ),
    }),
  };

const threadsTag = { text: `200 / 200 threads waiting`, tone: `red`, icon: `hourglass` };

const card = cardAt({ x: 0, y: 4, dx: 95, dy: -175 });

const timeoutsRetriesLesson = {
    id: `timeouts-retries`,
    title: `Timeouts & Retries`,
    summary: `Calling a struggling service safely: give up in time, retry carefully, and know when to stop.`,
    minutes: 11,
    level: `intermediate`,
    metrics: [`success`, `p99`, `payLoad`, `threads`],
    legend: [`req`, `res`, `retry`, `ping`, `fail`],
    goals: [
      { text: `How one slow service spreads failure`, step: 0 },
      { text: `Timeouts and fallbacks`, step: 1 },
      { text: 'Retries, retry storms and backoff', step: 4 },
      { text: `Circuit breakers and idempotency keys`, step: 7 },
      { text: `Deadlines and bulkheads`, step: 9 },
    ],
    steps: [
      {
        short: `Slow call`,
        chapter: `problem`,
        title: `One slow service takes down another`,
        body: [
          `The payment service starts answering in 30 seconds instead of 50 ms. The order service calls it and simply <b>waits</b> — with no limit.`,
          `Each waiting call holds a thread. Within a minute all 200 are stuck, and the order service can’t even serve pages that don’t need payments. A slow dependency became a full outage.`,
        ],
        callout: {
          kind: `warn`,
          text: `This is a cascading failure: trouble spreads upstream through anything that waits without a limit.`,
        },
        metrics: { success: 40, p99: 3e4, payLoad: `1×`, threads: `200 / 200 busy` },
        scene: {
          entities: {
            shoppers: shoppers(),
            order: orderService({ ...makeHot(0.98), tags: [threadsTag] }),
            pay: paymentsService({
              heat: 0.4,
              tags: [{ text: `answering in 30 s`, tone: `amber`, icon: `hourglass` }],
            }),
          },
          links: { ...links.uo({ fail: 0.5 }), ...links.op({ label: `no timeout`, labelTone: `red` }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`op`], rate: 1.2, bounce: !0, hold: 2.4, kind: `slow` },
          ],
        },
      },
      {
        short: `Timeout`,
        chapter: `solution`,
        title: `Set a timeout, have a fallback`,
        body: [
          `Give every outgoing call a <span class="term">timeout</span>: if payments hasn’t answered in 800 ms, give up and free the thread.`,
          `Then degrade gracefully: accept the order as “payment pending” and charge it shortly after. The order service stays up for everything else.`,
        ],
        callout: {
          kind: `tip`,
          text: `Set timeouts from real latency: a bit above the dependency’s p99, and always shorter than your own caller’s timeout.`,
        },
        changes: [
          `+ 800 ms timeout on payment calls`,
          `+ Fallback: “payment pending”`,
          `~ Threads busy 200 → 35`,
        ],
        metrics: { success: 72, p99: 820, payLoad: `1×`, threads: `35 / 200 busy` },
        scene: {
          entities: {
            shoppers: shoppers(),
            order: orderService({
              ...makeCool(0.4),
              tags: [{ text: `fallback: payment pending`, tone: `amber`, icon: `clock` }],
            }),
            pay: paymentsService({
              heat: 0.4,
              tags: [{ text: `often slow`, tone: `amber`, icon: `hourglass` }],
            }),
          },
          links: { ...links.uo(), ...links.op({ label: `timeout 800 ms`, fail: 0.3 }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`op`], rate: 1.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Retry`,
        chapter: `technique`,
        title: `Retry the blips`,
        body: [
          `Many failures are momentary: a dropped packet, a server restarting, a brief hiccup. Trying again a moment later usually works.`,
          `One retry (amber) turns most of those failures into successes.`,
        ],
        callout: {
          kind: `tip`,
          text: `Only retry errors that might succeed next time — timeouts, 503s. Retrying a 400 Bad Request just fails again.`,
        },
        changes: [`+ One retry on timeouts and 503s`, `~ Checkouts OK 72% → 97%`],
        metrics: { success: 97, p99: 950, payLoad: `1.1×`, threads: `38 / 200 busy` },
        scene: {
          entities: { shoppers: shoppers(), order: orderService(makeCool(0.4)), pay: paymentsService(makeCool(0.5)) },
          links: { ...links.uo(), ...links.op({ label: `timeout 800 ms · 1 retry`, fail: 0.08 }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`op`], rate: 1.8, bounce: !0, pattern: [`req`, `req`, `req`, `req`, `slow`] },
          ],
        },
      },
      {
        short: `Retry storm`,
        chapter: `problem`,
        title: `Retries become a storm`,
        body: [
          `Then payments gets genuinely overloaded. Every caller retries — three times, immediately. Each failed request becomes four, so the struggling service now gets <b>4×</b> its normal load.`,
          `It can never recover: the retries themselves keep it down. Your clients have turned into a denial-of-service attack.`,
        ],
        callout: {
          kind: `warn`,
          text: `Retries multiply across layers too: 3 retries at each of 3 layers is up to 64 calls for one click.`,
        },
        changes: [
          `~ Payments overloaded`,
          `~ 3 immediate retries per failure`,
          `~ Load on payments 1× → 4×`,
        ],
        metrics: { success: 18, p99: 2400, payLoad: `4×`, threads: `200 / 200 busy` },
        scene: {
          entities: {
            shoppers: shoppers(),
            order: orderService({ ...makeHot(0.95), tags: [threadsTag] }),
            pay: paymentsService({ ...makeHot(1), tags: [{ text: `4× normal load`, tone: `red`, icon: `alert` }] }),
          },
          links: {
            ...links.uo({ fail: 0.6 }),
            ...links.op({ label: `3 retries, immediately`, labelTone: `red`, fail: 0.75 }),
          },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`op`], rate: 7, bounce: !0, pattern: [`req`, `slow`, `slow`, `slow`] },
          ],
        },
      },
      {
        short: `Backoff`,
        chapter: `solution`,
        title: `Back off, with jitter`,
        body: [
          `Wait before retrying, and wait longer each time: 100 ms, then 200, then 400 — <span class="term">exponential backoff</span>. Add randomness (<span class="term">jitter</span>) so thousands of clients don’t retry in the same instant.`,
          `Cap the attempts, and cap the share of traffic that may be retries (a retry budget of ~10%). Payments gets room to recover.`,
        ],
        callout: {
          kind: `tip`,
          text: `Most cloud SDKs already do exponential backoff with jitter — check that it’s on, and that layers don’t stack their retries.`,
        },
        changes: [
          `~ Retries wait 100 → 200 → 400 ms (+ jitter)`,
          `+ Retry budget: 10%`,
          `~ Load on payments 4× → 1.2×`,
        ],
        metrics: { success: 96, p99: 1300, payLoad: `1.2×`, threads: `45 / 200 busy` },
        scene: {
          entities: {
            shoppers: shoppers(),
            order: orderService(makeCool(0.45)),
            pay: paymentsService({
              ...makeCool(0.62),
              tags: [{ text: `recovering`, tone: `green`, icon: `heartPulse` }],
            }),
          },
          links: { ...links.uo(), ...links.op({ label: `backoff + jitter`, fail: 0.1 }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            {
              route: [`op`],
              rate: 2,
              bounce: !0,
              pattern: [`req`, `req`, `req`, `req`, `req`, `slow`],
            },
          ],
        },
      },
      {
        short: `Breaker`,
        chapter: `technique`,
        title: `Circuit breaker: stop calling for a while`,
        body: [
          `Payments goes fully down. Even with timeouts, every call wastes 800 ms finding that out. A <span class="term">circuit breaker</span> watches the failures — past a threshold it <b>opens</b> and fails calls instantly, without trying.`,
          `Every 30 seconds it lets one trial call through (<b>half-open</b>, the green ping). If that succeeds, it closes again.`,
        ],
        callout: {
          kind: `insight`,
          text: `Like the breaker in your house: it trips to protect the rest of the system, and you reset it once the fault is fixed.`,
        },
        changes: [
          `− Payments down`,
          `+ Circuit breaker: OPEN`,
          `~ Failed calls take 1 ms, not 800 ms`,
        ],
        metrics: { success: 88, p99: 25, payLoad: `resting`, threads: `6 / 200 busy` },
        scene: {
          entities: {
            shoppers: shoppers(),
            order: orderService({
              ...makeCool(0.25),
              tags: [{ text: `fallback: payment pending`, tone: `amber`, icon: `clock` }],
            }),
            br: breakerBlock([{ text: `OPEN · fails in 1 ms`, tone: `red`, icon: `unplug` }]),
            pay: paymentsService(DEAD_STATE),
          },
          links: { ...links.uo(), ...links.viaBreaker({ fail: 1 }, { style: `off`, fail: 1 }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`ob`], rate: 1.6 },
            { route: [`bp`], kind: `ping`, rate: 0.3 },
          ],
        },
      },
      {
        short: `Closed`,
        chapter: `solution`,
        title: `Half-open, then closed`,
        body: [
          `Payments recovers. The next trial call succeeds, so the breaker closes and traffic flows again — gradually, so the service isn’t flooded the moment it’s back.`,
          `Meanwhile the “payment pending” orders are charged from a queue. No order was lost, and the rest of the site never went down.`,
        ],
        callout: {
          kind: `tip`,
          text: `Libraries such as resilience4j, Polly and service meshes like Envoy/Istio provide timeouts, retries and breakers out of the box.`,
        },
        changes: [
          `+ Payments recovered`,
          `~ Breaker HALF-OPEN → CLOSED`,
          `~ Pending orders charged`,
        ],
        metrics: { success: 99, p99: 180, payLoad: `1×`, threads: `30 / 200 busy` },
        scene: {
          entities: {
            shoppers: shoppers(),
            order: orderService(makeCool(0.35)),
            br: breakerBlock([{ text: `CLOSED`, tone: `green`, icon: `check` }]),
            pay: paymentsService(makeCool(0.5)),
          },
          links: { ...links.uo(), ...links.viaBreaker() },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`ob`, `bp`], rate: 1.8, bounce: !0 },
          ],
        },
      },
      {
        short: `Idempotency`,
        chapter: `technique`,
        title: `Retries must not charge twice`,
        body: [
          `A nasty case: payments charges the card, but the response is lost on the way back. The order service times out and retries — and the customer is charged <b>twice</b>.`,
          `Fix: send an <span class="term">idempotency key</span> — a unique id per order — with every attempt. Payments remembers the result for each key and returns it again for duplicates instead of charging again.`,
        ],
        callout: {
          kind: `insight`,
          text: `Any operation that may be retried must be idempotent: doing it twice has the same effect as doing it once.`,
        },
        changes: [
          `+ Idempotency-Key on payment calls`,
          `~ Duplicate attempts return the stored result`,
        ],
        metrics: { success: 99, p99: 180, payLoad: `1×`, threads: `30 / 200 busy` },
        scene: {
          entities: {
            shoppers: shoppers(),
            order: orderService(makeCool(0.35)),
            br: breakerBlock([{ text: `CLOSED`, tone: `green`, icon: `check` }]),
            pay: paymentsService({ ...makeCool(0.5), tags: [{ text: `charged once`, tone: `green`, icon: `check` }] }),
            card: card(
              `Idempotency-Key: 7f3a`,
              [
                `attempt 1 → charge $40, store result as 7f3a`,
                `! response lost → order service retries`,
                `attempt 2 → 7f3a seen: return stored result`,
                `= one charge, however many retries`,
              ],
              `key`,
            ),
          },
          links: { ...links.uo(), ...links.viaBreaker({}, { label: `Idempotency-Key: 7f3a`, labelAt: 0.5 }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`ob`, `bp`], rate: 1.8, bounce: !0, pattern: [`req`, `req`, `req`, `slow`] },
          ],
        },
      },
      {
        short: `Deadlines`,
        chapter: `technique`,
        title: `Pass the deadline along`,
        body: [
          `The shopper’s browser gives up after 2 seconds. But if the order service has already spent 1.8 s, it’s pointless for payments to start a fresh 800 ms of work — nobody will see the answer.`,
          `So each request carries a <span class="term">deadline</span>: “answer by 12:00:02.000”. Every service checks the time left and passes the remaining budget on; with none left, it stops immediately.`,
        ],
        callout: {
          kind: `tip`,
          text: `gRPC propagates deadlines automatically. Over HTTP, pass the remaining time in a header.`,
        },
        changes: [
          `+ Deadline carried with each request`,
          `~ No work started that can’t finish in time`,
        ],
        metrics: { success: 99, p99: 180, payLoad: `1×`, threads: `28 / 200 busy` },
        scene: {
          entities: {
            shoppers: shoppers(),
            order: orderService({
              ...makeCool(0.35),
              tags: [{ text: `deadline: 2 s · 1.4 s left`, icon: `timer` }],
            }),
            br: breakerBlock([{ text: `CLOSED`, tone: `green`, icon: `check` }]),
            pay: paymentsService({ ...makeCool(0.45), tags: [{ text: `budget: 1.4 s`, icon: `timer` }] }),
          },
          links: { ...links.uo(), ...links.viaBreaker({}, { label: `deadline: 12:00:02.000`, labelAt: 0.5 }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`ob`, `bp`], rate: 1.8, bounce: !0 },
          ],
        },
      },
      {
        short: `Bulkheads`,
        chapter: `technique`,
        title: `Bulkheads: separate pools`,
        body: [
          `Remember step 1, when slow payments used up all 200 threads? The order service can also protect itself by giving each dependency its own pool: say 40 threads for payments, 40 for inventory, the rest for everything else.`,
          `Now when payments is slow, only its 40 threads fill up. Browsing, search and the cart keep working. Like the watertight compartments in a ship — the <span class="term">bulkhead</span> pattern.`,
        ],
        callout: {
          kind: `insight`,
          text: `Timeouts limit how long one call can hurt you; bulkheads limit how many calls can.`,
        },
        changes: [
          `+ Separate pools per dependency`,
          `~ Slow payments fills only its 40 threads`,
          `~ Rest of the site unaffected`,
        ],
        metrics: { success: 92, p99: 820, payLoad: `1×`, threads: `40 / 40 payments · rest free` },
        scene: {
          entities: {
            shoppers: shoppers(),
            order: orderService({
              ...makeCool(0.4),
              tags: [
                { text: `payments pool 40 / 40 · others free`, tone: `amber`, icon: `layers` },
              ],
            }),
            pay: paymentsService({
              heat: 0.4,
              tags: [{ text: `slow again`, tone: `amber`, icon: `hourglass` }],
            }),
          },
          links: { ...links.uo(), ...links.op({ label: `payments pool · 40 threads` }) },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`op`], rate: 1.2, bounce: !0, hold: 1.2, kind: `slow` },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Every remote call needs a <b>timeout</b> and a <b>fallback</b>.</li>
          <li><b>Retry</b> transient errors — with <b>exponential backoff, jitter</b> and a cap.</li>
          <li>A <b>circuit breaker</b> stops hammering a service that is down.</li>
          <li>Retried operations must be <b>idempotent</b>.</li>
          <li>Propagate <b>deadlines</b>; isolate dependencies with <b>bulkheads</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Observability</b> — how you’d find out payments was slow in the first place.`,
        },
        metrics: { success: 99, p99: 180, payLoad: `1×`, threads: `30 / 200 busy` },
        scene: {
          entities: {
            shoppers: shoppers(),
            order: orderService(makeCool(0.35)),
            br: breakerBlock([{ text: `CLOSED`, tone: `green`, icon: `check` }]),
            pay: paymentsService(makeCool(0.5)),
          },
          links: { ...links.uo(), ...links.viaBreaker() },
          flows: [
            { route: [`uo`], rate: 1.8, bounce: !0 },
            { route: [`ob`, `bp`], rate: 1.8, bounce: !0 },
          ],
        },
      },
    ],
  };

export { timeoutsRetriesLesson as timeoutsRetriesLesson };
export default timeoutsRetriesLesson;
