// @ts-nocheck
import {
  makeBlock,
  makeCool,
  makeCrowd,
  makeDb,
  makeDevice,
  makeHot,
  makeLink,
  makePanel,
  makeQueue,
  makeZone
} from '@/lib/simulator/scene-builders';

const Ms = { x0: -10, x1: -2, y0: -23, y1: -17 };

const Ns = { x0: -17.5, x1: -7.6, y0: -12.6, y1: -9.4 };

const Ps = { x0: 10.6, x1: 20.5, y0: -12.6, y1: -9.4 };

const Fs = (e = 11, t = `real users`) => makeCrowd(Ms, e, t);

const Is = (e = []) => makeDevice(8, -20, { label: `runaway script`, tags: e });

const Ls = (e = {}) => makeBlock(0, 3, { label: [`API`], ...e });

const Rs = (e = 0, t = {}) =>
    makeBlock(e, -9, { color: `orange`, glyph: `gauge`, label: [`Gateway`], sub: `rate limiter`, ...t });

const zs = { text: `5,000 req/s`, tone: `red`, icon: `bot` };

const Bs = { text: `limit: 10 req/s per client`, icon: `gauge` };

const Vs = {
    direct: (e = {}) => ({
      ua: makeLink(`users`, `api`, [`users`, [`users`, `api`], `api`], { heads: `both`, ...(e.ua || {}) }),
      ba: makeLink(`bot`, `api`, [`bot`, [`bot`, `api`], `api`], e.ba),
    }),
    edge: (e = `gw`, t = {}) => ({
      ug: makeLink(`users`, e, [`users`, [`users`, e], e], { heads: `both`, ...(t.ug || {}) }),
      bg: makeLink(`bot`, e, [`bot`, [`bot`, e], e], {
        label: `429 Too Many Requests`,
        labelTone: `red`,
        labelAt: 0.82,
        fail: 0.92,
        ...(t.bg || {}),
      }),
    }),
    toApi: (e = `gw`, t = `ga`) => ({
      [t]: makeLink(e, `api`, [e, [e, `api`], `api`], { heads: `both` }),
    }),
  };

const Hs = (e = 8) => ({
    ubz: makeZone(Ns, `USER · ${e} TOKENS`),
    ubt: makeQueue(-16.8, -10.4, e, [1, 0], { gap: 1.1, color: `#9fd28f` }),
    bbz: makeZone(Ps, `SCRIPT · EMPTY`),
  });

const Us = (e, t, n) => makePanel({ x: 12.5, y: 3, z: 0, dx: 20, dy: -260 }, e, t, { icon: n });

const Ws = (e = [zs], t = {}) => ({
    users: Fs(),
    bot: Is(e),
    api: Ls(makeCool(0.42)),
    gw: Rs(-6, { tags: [] }),
    gw2: Rs(8, t),
    redis: makeDb(1, -9, { r: 1.5, h: 32, glyph: `zap`, label: `counters` }),
  });

const Gs = (e = {}) => ({
    ug: makeLink(`users`, `gw`, [`users`, [`users`, `gw`], `gw`], { heads: `both` }),
    bg2: makeLink(`bot`, `gw2`, [`bot`, `gw2`], {
      label: `429 Too Many Requests`,
      labelTone: `red`,
      labelAt: 0.5,
      fail: 0.92,
      ...e,
    }),
    ga: makeLink(`gw`, `api`, [`gw`, [`gw`, `api`], `api`], { heads: `both` }),
    ga2: makeLink(`gw2`, `api`, [`gw2`, [`gw2`, `api`], `api`], { heads: `both` }),
    gr: makeLink(`gw`, `redis`, [`gw`, `redis`], { heads: `both`, label: `INCR`, labelAt: 0.5 }),
    g2r: makeLink(`gw2`, `redis`, [`gw2`, `redis`], { heads: `both` }),
  });

const Ks = {
    id: `rate-limiting`,
    title: `Rate Limiting`,
    summary: `Give every client a fair budget, so one runaway script can’t take everyone down.`,
    minutes: 10,
    level: `intermediate`,
    metrics: [`abuser`, `served`, `apiCpu`, `limited`],
    legend: [`req`, `res`, [`slow`, `low priority`], [`fail`, `rejected`]],
    goals: [
      { text: `Why one client can starve everyone`, step: 0 },
      { text: `Token buckets and limiting algorithms`, step: 2 },
      { text: `Limits across many gateways`, step: 4 },
      { text: `429s, back-off and per-tenant quotas`, step: 6 },
      { text: `Load shedding under global overload`, step: 7 },
    ],
    steps: [
      {
        short: `Runaway`,
        chapter: `problem`,
        title: `One script, everyone suffers`,
        body: [
          `A customer’s script has a bug: it calls your API in a tight loop — 5,000 requests a second. The API servers spend almost all their time on it.`,
          `Real users’ requests queue behind the flood and time out. Nobody attacked you; one client simply took more than its share.`,
        ],
        callout: {
          kind: `warn`,
          text: `Shared capacity needs a fairness rule. Without one, the noisiest client wins.`,
        },
        metrics: { abuser: 5e3, served: 61, apiCpu: 99, limited: 0 },
        scene: {
          entities: {
            users: Fs(),
            bot: Is([zs]),
            api: Ls({
              ...makeHot(0.99),
              tags: [{ text: `mostly serving one client`, tone: `red`, icon: `alert` }],
            }),
          },
          links: Vs.direct({ ua: { fail: 0.35 } }),
          flows: [
            { route: [`ua`], rate: 1.6, bounce: !0 },
            { route: [`ba`], rate: 7, kind: `heavy`, speed: 1.2 },
          ],
        },
      },
      {
        short: `Limit`,
        chapter: `solution`,
        title: `A rate limiter at the front door`,
        body: [
          `Put a <span class="term">rate limiter</span> in the gateway in front of the API. Each client — identified by API key, user id or IP address — gets a budget, say 10 requests per second.`,
          `Requests within budget pass through. The rest are rejected immediately with <code>429 Too Many Requests</code>, before they cost the API anything.`,
        ],
        callout: {
          kind: `tip`,
          text: `Rejecting early is cheap: the gateway answers in microseconds, and the API never sees the excess.`,
        },
        changes: [
          `+ Gateway with a rate limiter`,
          `~ Script limited to 10 req/s`,
          `~ API CPU 99% → 45%`,
        ],
        metrics: { abuser: 5e3, served: 99, apiCpu: 45, limited: 4990 },
        scene: {
          entities: { users: Fs(), bot: Is([zs]), api: Ls(makeCool(0.45)), gw: Rs(0, { tags: [Bs] }) },
          links: { ...Vs.edge(), ...Vs.toApi() },
          flows: [
            { route: [`ug`, `ga`], rate: 1.8, bounce: !0 },
            { route: [`bg`, `ga`], rate: 7, kind: `heavy`, speed: 1.2 },
          ],
        },
      },
      {
        short: `Token bucket`,
        chapter: `technique`,
        title: `How it counts: the token bucket`,
        body: [
          `The most common algorithm is the <span class="term">token bucket</span>. Each client has a bucket holding up to 10 tokens, refilled at 10 per second. Every request takes a token; an empty bucket means 429.`,
          `A real user’s bucket stays mostly full (the green dots). The script empties its bucket instantly and stays empty.`,
        ],
        callout: {
          kind: `insight`,
          text: `Bucket size allows short bursts; the refill rate caps the long-run average. Two numbers, easy to explain.`,
        },
        changes: [`+ A bucket per client`],
        metrics: { abuser: 5e3, served: 99, apiCpu: 45, limited: 4990 },
        scene: {
          entities: {
            users: Fs(),
            bot: Is([zs]),
            api: Ls(makeCool(0.45)),
            gw: Rs(0, { tags: [Bs] }),
            ...Hs(8),
          },
          links: { ...Vs.edge(), ...Vs.toApi() },
          flows: [
            { route: [`ug`, `ga`], rate: 1.8, bounce: !0 },
            { route: [`bg`, `ga`], rate: 7, kind: `heavy`, speed: 1.2 },
          ],
        },
      },
      {
        short: `Algorithms`,
        chapter: `technique`,
        title: `Windows vs buckets`,
        body: [
          `A simpler <b>fixed window</b> counts requests per calendar minute and resets at :00. Easy — but a client can send a full minute’s budget at 12:00:59 and again at 12:01:00: double the limit in two seconds.`,
          `A <b>sliding window</b> smooths that edge; a <b>token bucket</b> allows controlled bursts. Most API gateways use one of the latter two.`,
        ],
        callout: {
          kind: `tip`,
          text: `Need a steady outflow instead (e.g. to a fragile partner API)? A leaky bucket queues requests and releases them at a fixed pace.`,
        },
        metrics: { abuser: 5e3, served: 99, apiCpu: 45, limited: 4990 },
        scene: {
          entities: {
            users: Fs(),
            bot: Is([zs]),
            api: Ls(makeCool(0.45)),
            gw: Rs(0, { tags: [Bs] }),
            ...Hs(8),
            card: Us(
              `Limit: 100 per minute`,
              [
                `fixed window     resets at :00`,
                `! 100 at 0:59 + 100 at 1:00 = 200 in 2 s`,
                `sliding window   rolling last 60 s`,
                `token bucket     burst ≤ 100, then refill`,
                `= bursts allowed, average capped`,
              ],
              `clock`,
            ),
          },
          links: { ...Vs.edge(), ...Vs.toApi() },
          flows: [
            { route: [`ug`, `ga`], rate: 1.8, bounce: !0 },
            { route: [`bg`, `ga`], rate: 7, kind: `heavy`, speed: 1.2 },
          ],
        },
      },
      {
        short: `Many gateways`,
        chapter: `problem`,
        title: `Many gateways, one budget`,
        body: [
          `One gateway isn’t enough, so you run several behind a load balancer. If each counts on its own, a client spread across 10 gateways gets 10× its limit.`,
          `So gateways keep the counters in a shared, fast store (often Redis): each request does an atomic increment and checks the total.`,
        ],
        callout: {
          kind: `tip`,
          text: `The shared store adds ~1 ms per request. Some systems trade a little accuracy for speed by syncing local counters every second.`,
        },
        changes: [
          `+ Second gateway`,
          `+ Shared counter store`,
          `− Per-client buckets now live in the store`,
        ],
        metrics: { abuser: 5e3, served: 99, apiCpu: 45, limited: 4990 },
        scene: {
          entities: Ws([zs], { tags: [Bs] }),
          links: Gs(),
          flows: [
            { route: [`ug`, `ga`], rate: 1.8, bounce: !0 },
            { route: [`bg2`, `ga2`], rate: 7, kind: `heavy`, speed: 1.2 },
            { routes: [{ path: [`gr`] }, { path: [`g2r`] }], rate: 2.4, kind: `write`, bounce: !0 },
          ],
        },
      },
      {
        short: `Back off`,
        chapter: `technique`,
        title: `Tell clients how to behave`,
        body: [
          `A good 429 says when to come back: a <code>Retry-After: 30</code> header, plus headers showing the limit and what’s left. Well-behaved clients slow down and retry later.`,
          `The script’s owner fixes their loop. Now it uses its fair share and nothing more.`,
        ],
        callout: {
          kind: `tip`,
          text: `Publish your limits in the API docs, and offer higher tiers for customers who genuinely need more.`,
        },
        changes: [`+ Retry-After and RateLimit headers`, `~ Script backs off to 10 req/s`],
        metrics: { abuser: 10, served: 100, apiCpu: 38, limited: 0 },
        scene: {
          entities: Ws([{ text: `backing off · 10 req/s`, tone: `green`, icon: `check` }], {
            tags: [{ text: `Retry-After: 30`, icon: `clock` }],
          }),
          links: Gs({ fail: 0, label: `within limit`, labelTone: `green` }),
          flows: [
            { route: [`ug`, `ga`], rate: 1.8, bounce: !0 },
            { route: [`bg2`, `ga2`], rate: 0.6, bounce: !0 },
            { routes: [{ path: [`gr`] }, { path: [`g2r`] }], rate: 1.2, kind: `write`, bounce: !0 },
          ],
        },
      },
      {
        short: `Tenants`,
        chapter: `problem`,
        title: `Case: one customer’s 10,000 users`,
        body: [
          `You sell your API to companies. One customer runs a nightly import with 10,000 well-behaved users — each under their personal limit, but together using 70% of your capacity. Other customers slow down every night.`,
          `Per-user limits can’t see this. Add limits per <b>tenant</b> (customer account), sized by their plan, on top of per-user limits.`,
        ],
        callout: {
          kind: `tip`,
          text: `Layer limits: per user, per tenant, per endpoint (expensive endpoints get lower limits), and a global ceiling.`,
        },
        changes: [`+ Per-tenant quota (by plan)`, `~ Big import capped at its plan’s share`],
        metrics: { abuser: `—`, served: 99, apiCpu: 55, limited: `1,200/s` },
        scene: {
          entities: {
            users: Fs(15, `Acme Corp · 10,000 users`),
            bot: Is(),
            api: Ls(makeCool(0.55)),
            gw: Rs(-6, {
              tags: [{ text: `tenant Acme: 2,000 req/s`, tone: `amber`, icon: `building` }],
            }),
            gw2: Rs(8, { tags: [Bs] }),
            redis: makeDb(1, -9, { r: 1.5, h: 32, glyph: `zap`, label: `counters` }),
          },
          links: {
            ...Gs({ fail: 0, label: `within limit`, labelTone: `green` }),
            ug: makeLink(`users`, `gw`, [`users`, [`users`, `gw`], `gw`], {
              heads: `both`,
              fail: 0.3,
              label: `over tenant quota → 429`,
              labelTone: `amber`,
              labelAt: 0.5,
            }),
          },
          flows: [
            { route: [`ug`, `ga`], rate: 4.2, bounce: !0 },
            { route: [`bg`, `ga2`], rate: 0.6, bounce: !0 },
            { routes: [{ path: [`gr`] }, { path: [`g2r`] }], rate: 1.6, kind: `write`, bounce: !0 },
          ],
        },
      },
      {
        short: `Shedding`,
        chapter: `technique`,
        title: `When everyone spikes: shed load`,
        body: [
          `Rate limits stop one client hogging capacity. But on launch day <em>everyone</em> arrives at once and the total is still more than you can serve.`,
          `Then <span class="term">load shedding</span> decides what to drop: background work like prefetching, recommendations and analytics (amber) is rejected first, so logins and checkouts keep working.`,
        ],
        callout: {
          kind: `insight`,
          text: `Failing some requests on purpose beats failing all of them by accident.`,
        },
        changes: [
          `~ Real users ×5`,
          `+ Low-priority requests shed at the gateway`,
          `~ Checkouts still 100%`,
        ],
        metrics: { abuser: `—`, served: 100, apiCpu: 82, limited: `2,000 shed/s` },
        scene: {
          entities: {
            users: Fs(15, `launch day · ×5`),
            bot: Is(),
            api: Ls({ cpu: 0.82 }),
            gw: Rs(-6, {
              tags: [{ text: `shedding background work`, tone: `amber`, icon: `layers` }],
            }),
            gw2: Rs(8),
            redis: makeDb(1, -9, { r: 1.5, h: 32, glyph: `zap`, label: `counters` }),
          },
          links: {
            ...Gs({ fail: 0, label: `within limit`, labelTone: `green` }),
            ul2: makeLink(`users`, `gw`, [[`users+1.6`, `users`], [`users+1.6`, `gw`], `gw`], {
              style: `dashed`,
              fail: 0.85,
              label: `background · dropped first`,
              labelTone: `amber`,
              labelAt: 0.22,
            }),
          },
          flows: [
            { route: [`ug`, `ga`], rate: 3.2, bounce: !0 },
            { route: [`ul2`], rate: 2.6, kind: `slow` },
            { route: [`bg`, `ga2`], rate: 0.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Give each client a <b>budget</b>; reject the excess early with <b>429</b>.</li>
          <li><b>Token buckets</b> allow short bursts and cap the average rate.</li>
          <li>Across many gateways, keep counters in a <b>shared store</b>.</li>
          <li>Layer limits: per <b>user</b>, per <b>tenant</b>, per endpoint.</li>
          <li>Under global overload, <b>shed</b> low-priority work first.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Timeouts & Retries</b> — what to do when the service you’re calling is the one in trouble.`,
        },
        metrics: { abuser: 10, served: 100, apiCpu: 38, limited: 0 },
        scene: {
          entities: Ws([{ text: `backing off · 10 req/s`, tone: `green`, icon: `check` }], {
            tags: [Bs],
          }),
          links: Gs({ fail: 0, label: `within limit`, labelTone: `green` }),
          flows: [
            { route: [`ug`, `ga`], rate: 1.8, bounce: !0 },
            { route: [`bg`, `ga2`], rate: 0.6, bounce: !0 },
            { routes: [{ path: [`gr`] }, { path: [`g2r`] }], rate: 1.2, kind: `write`, bounce: !0 },
          ],
        },
      },
    ],
  };

export { Ks as rateLimitingLesson };
export default Ks;
