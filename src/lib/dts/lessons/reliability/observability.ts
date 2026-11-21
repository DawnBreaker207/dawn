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

const nc = { x0: -4.5, x1: 4.5, y0: -24, y1: -18 };

const rc = (e = `shoppers`) => p(nc, 11, e);

const ic = (e, t, n) => d(e, t, n);

const ac = (e = {}) => ({
    gw: ic(0, -11, { color: `orange`, glyph: `globe`, label: [`Gateway`], tags: e.gw || [] }),
    orders: ic(0, 0, { color: `blue`, glyph: `cart`, label: [`Orders`], tags: e.orders || [] }),
    inv: ic(-10, 0, { color: `yellow`, glyph: `package`, label: [`Inventory`], tags: e.inv || [] }),
    pay: ic(10, 0, {
      color: `purple`,
      glyph: `creditCard`,
      label: [`Payments`],
      tags: e.pay || [],
    }),
    db: b(0, 11, { r: 1.7, glyph: `database`, label: `orders DB`, tags: e.db || [] }),
    fraud: ic(10, 11, {
      color: `slab`,
      glyph: `shield`,
      label: [`Fraud API`],
      sub: `third party`,
      tags: e.fraud || [],
    }),
  });

const oc = (e = {}) => ({
    ug: h(`shoppers`, `gw`, [`shoppers`, `gw`], { heads: `both` }),
    go: h(`gw`, `orders`, [`gw`, `orders`], { heads: `both` }),
    oi: h(`orders`, `inv`, [`orders`, `inv`], { heads: `both` }),
    op: h(`orders`, `pay`, [`orders`, `pay`], { heads: `both` }),
    od: h(`orders`, `db`, [`orders`, `db`], { heads: `both` }),
    pf: h(`pay`, `fraud`, [`pay`, `fraud`], { heads: `both`, ...(e.pf || {}) }),
  });

const sc = (e = 1.6, t) => [
    { routes: [{ path: [`ug`, `go`, `oi`] }, { path: [`ug`, `go`, `od`] }], rate: 1.4, bounce: !0 },
    { route: [`ug`, `go`, `op`, `pf`], rate: 0.7, bounce: !0, hold: e, kind: t },
  ];

const cc = (e, t = `paper`, n) => ({ text: e, tone: t, icon: n });

const lc = (e, t, n, r = {}) => S({ x: -10, y: 0, z: 0, dx: -400, dy: -110 }, e, t, { icon: n, ...r });

const uc = {
    gw: [cc(`p99 2.4 s`, `red`, `timer`)],
    orders: [cc(`p99 2.3 s`, `red`, `timer`)],
    inv: [cc(`p99 30 ms`, `green`, `timer`)],
    pay: [cc(`p99 2.2 s`, `red`, `timer`)],
    db: [cc(`p99 8 ms`, `green`, `timer`)],
  };

const dc = {
    id: `observability`,
    title: `Observability`,
    summary: `Metrics, logs and traces: how to find out what’s wrong, where, and why — fast.`,
    minutes: 11,
    level: `intermediate`,
    metrics: [`detect`, `locate`, `p99`, `signals`],
    legend: [`req`, `res`, [`mine`, `traced request`], `fail`],
    goals: [
      { text: `Why “it’s slow” is hard to debug`, step: 0 },
      { text: `Metrics and dashboards (RED)`, step: 1 },
      { text: `Alerting on SLOs, not CPU`, step: 2 },
      { text: `Logs and distributed traces`, step: 4 },
      { text: `Handling an incident, and the post-mortem`, step: 7 },
    ],
    steps: [
      {
        short: `It’s slow`,
        chapter: `problem`,
        title: `“Checkout is slow.” Where?`,
        body: [
          `Support tickets pile up: checkout takes several seconds. A checkout touches the gateway, orders, inventory, payments, a database and a third-party fraud API.`,
          `You can see a request waiting somewhere in this diagram — but the team can’t. Every server’s CPU looks fine, and nobody knows where to start.`,
        ],
        callout: {
          kind: `warn`,
          text: `If users find problems before you do, you are flying blind.`,
        },
        metrics: { detect: `2 h (support tickets)`, locate: `—`, p99: 2400, signals: `none` },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({ gw: [cc(`?`)], orders: [cc(`?`)], inv: [cc(`?`)], pay: [cc(`?`)] }),
          },
          links: oc(),
          flows: sc(),
        },
      },
      {
        short: `Metrics`,
        chapter: `technique`,
        title: `Metrics: numbers over time`,
        body: [
          `Every service records a few numbers about the requests it handles — the <span class="term">RED</span> method: <b>R</b>ate (requests/s), <b>E</b>rrors (failed share) and <b>D</b>uration (latency percentiles) — and sends them to a time-series store with dashboards.`,
          `Now the picture is clear: inventory and the database are fast; the slowness lives on the payments path.`,
        ],
        callout: {
          kind: `tip`,
          text: `Common stacks: Prometheus + Grafana, Datadog, CloudWatch. Measure p99, not just averages. RED describes requests; for machines, watch <b>USE</b>: utilization, saturation, errors.`,
        },
        changes: [`+ RED metrics on every service`, `+ Dashboard: p99 per service`],
        metrics: { detect: `5 min`, locate: `payments path`, p99: 2400, signals: `metrics` },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac(uc),
            card: lc(`Dashboard · p99 latency`, [], `chartLine`, {
              chart: `bars`,
              bars: [
                { label: `gateway`, to: 1, tone: `red`, note: `2.4 s` },
                { label: `orders`, to: 0.96, tone: `red`, note: `2.3 s` },
                { label: `payments`, to: 0.92, tone: `red`, note: `2.2 s` },
                { label: `inventory`, to: 0.02, tone: `green`, note: `30 ms` },
                { label: `orders DB`, to: 0.01, tone: `green`, note: `8 ms` },
              ],
            }),
          },
          links: oc(),
          flows: sc(),
        },
      },
      {
        short: `Alerts`,
        chapter: `technique`,
        title: `Alert on what users feel`,
        body: [
          `Don’t page people for “CPU above 80%” — it fires constantly and often means nothing. Alert on <b>symptoms</b> users feel.`,
          `Pick an <span class="term">SLI</span> (say, the share of checkouts faster than 1 s), set an <span class="term">SLO</span> target (99.9%), and alert when you’re burning through the remaining <span class="term">error budget</span> too fast.`,
        ],
        callout: {
          kind: `tip`,
          text: `An error budget turns reliability into a shared number: while it lasts, ship features; when it’s gone, fix reliability first.`,
        },
        changes: [`+ SLO: 99.9% of checkouts under 1 s`, `+ Alert on error-budget burn`],
        metrics: {
          detect: `2 min`,
          locate: `payments path`,
          p99: 2400,
          signals: `metrics + alerts`,
        },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({ ...uc, gw: [cc(`SLO burning 14× too fast`, `red`, `siren`)] }),
            card: lc(
              `Checkout SLO`,
              [
                `SLI: checkouts faster than 1 s`,
                `SLO: 99.9% over 30 days`,
                `error budget: 0.1% may be slow`,
                `! last hour: 1.4% slow = 14× budget → page`,
              ],
              `siren`,
            ),
          },
          links: oc(),
          flows: sc(),
        },
      },
      {
        short: `Logs`,
        chapter: `technique`,
        title: `Logs: the story, line by line`,
        body: [
          `Metrics say <em>where</em>; <span class="term">logs</span> say <em>what happened</em>. Each service writes timestamped events — but at thousands of requests a second, lines from different requests interleave into noise.`,
          `The trick: give every request an id at the gateway, pass it along, and include it in every log line. Filter by one id and you get one request’s story.`,
        ],
        callout: {
          kind: `tip`,
          text: `Log structured JSON, not free text — so you can filter by request id, user, service or status.`,
        },
        changes: [`+ Request id on every log line`],
        metrics: {
          detect: `2 min`,
          locate: `payments → fraud API?`,
          p99: 2400,
          signals: `metrics + logs`,
        },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({ ...uc, gw: [cc(`req=a91`, `violet`, `key`)] }),
            card: lc(
              `Logs · filtered by req=a91`,
              [
                `07.112 gateway  req=a91 POST /checkout`,
                `07.118 orders   req=a91 reserve stock: ok`,
                `07.121 payments req=a91 calling fraud-api`,
                `09.243 payments req=a91 fraud-api ok (2122 ms)`,
                `= 2.1 s inside one call`,
              ],
              `scroll`,
            ),
          },
          links: oc(),
          flows: [
            ...sc(1.6),
            { route: [`ug`, `go`, `op`, `pf`], rate: 0.35, bounce: !0, hold: 1.6, kind: `mine` },
          ],
        },
      },
      {
        short: `Traces`,
        chapter: `solution`,
        title: `Traces: follow one request everywhere`,
        body: [
          `A <span class="term">distributed trace</span> records every hop of one request as a <b>span</b> with a start time and duration, all joined by the same trace id. Drawn as a waterfall, it shows exactly where the time goes.`,
          `Follow the violet request: 2.1 of its 2.4 seconds are spent waiting for the third-party fraud API.`,
        ],
        callout: {
          kind: `insight`,
          text: `Tools: OpenTelemetry to collect, Jaeger, Tempo, Honeycomb or Datadog to explore. Instrument once, use everywhere.`,
        },
        changes: [
          `+ Trace id propagated across services`,
          `~ Cause found: fraud API ≈ 88% of the time`,
        ],
        metrics: {
          detect: `2 min`,
          locate: `5 min`,
          p99: 2400,
          signals: `metrics + logs + traces`,
        },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({ fraud: [] }),
            card: lc(`Trace a91 · 2.4 s`, [], `waypoints`, {
              chart: `bars`,
              bars: [
                { label: `gateway`, from: 0, to: 1, tone: `gray`, note: `2.4 s` },
                { label: ` orders`, from: 0.02, to: 0.98, tone: `gray`, note: `2.35 s` },
                { label: `  inventory`, from: 0.04, to: 0.06, tone: `green`, note: `30 ms` },
                { label: `  payments`, from: 0.08, to: 0.96, tone: `amber`, note: `2.2 s` },
                {
                  label: `   fraud API`,
                  from: 0.1,
                  to: 0.93,
                  tone: `red`,
                  note: `2.1 s`,
                  bold: !0,
                },
              ],
            }),
          },
          links: oc({ pf: { label: `2.1 s`, labelTone: `red` } }),
          flows: [
            ...sc(1.6),
            { route: [`ug`, `go`, `op`, `pf`], rate: 0.45, bounce: !0, hold: 1.6, kind: `mine` },
          ],
        },
      },
      {
        short: `Fixed`,
        chapter: `solution`,
        title: `Fix it, then prove it`,
        body: [
          `With the cause known, the fix is quick: call the fraud API with a 300 ms timeout, cache recent scores, and review the rare slow cases afterwards.`,
          `The same dashboards prove it worked: p99 drops from 2.4 s to 310 ms, and the SLO alert clears. Total time from page to cause: minutes, not hours.`,
        ],
        callout: {
          kind: `tip`,
          text: `Metrics tell you something is wrong, traces show where, logs explain why. You need all three.`,
        },
        changes: [`+ 300 ms timeout + cache on fraud checks`, `~ Checkout p99 2.4 s → 310 ms`],
        metrics: { detect: `2 min`, locate: `5 min`, p99: 310, signals: `metrics + logs + traces` },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({
              gw: [cc(`p99 310 ms`, `green`, `timer`)],
              pay: [cc(`timeout 300 ms + cache`, `green`, `check`)],
            }),
            card: lc(`Trace b17 · 310 ms`, [], `waypoints`, {
              chart: `bars`,
              bars: [
                { label: `gateway`, from: 0, to: 1, tone: `gray`, note: `310 ms` },
                { label: ` orders`, from: 0.03, to: 0.97, tone: `gray`, note: `300 ms` },
                { label: `  inventory`, from: 0.06, to: 0.16, tone: `green`, note: `30 ms` },
                { label: `  payments`, from: 0.2, to: 0.9, tone: `green`, note: `220 ms` },
                {
                  label: `   fraud API`,
                  from: 0.23,
                  to: 0.33,
                  tone: `green`,
                  note: `30 ms (cached)`,
                },
              ],
            }),
          },
          links: oc({ pf: { label: `timeout 300 ms · cached` } }),
          flows: sc(0),
        },
      },
      {
        short: `Incident`,
        chapter: `problem`,
        title: `Case: 3 a.m. — errors spike`,
        body: [
          `The pager fires: checkout errors jumped from 0.1% to 6% at 03:12. Inventory is the culprit on the dashboard. The deploy log shows a config change to inventory at 03:10.`,
          `Good practice is to <b>mitigate first</b>: roll the change back and restore service, and investigate the root cause afterwards — not the other way round.`,
        ],
        callout: {
          kind: `tip`,
          text: `Put deploys and config changes on your dashboards as markers. “What changed?” is the first question in almost every incident.`,
        },
        changes: [
          `+ Config change to inventory at 03:10`,
          `− Checkout errors 0.1% → 6%`,
          `~ Rolled back at 03:16`,
        ],
        metrics: { detect: `1 min`, locate: `4 min`, p99: 900, signals: `metrics + logs + traces` },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({
              gw: [cc(`errors 6%`, `red`, `siren`)],
              inv: [cc(`config change 03:10`, `red`, `alert`)],
            }),
            card: lc(`Checkout errors · last hour`, [], `chartLine`, {
              chart: `bars`,
              bars: [
                { label: `02:50`, to: 0.02, tone: `green`, note: `0.1%` },
                { label: `03:00`, to: 0.02, tone: `green`, note: `0.1%` },
                { label: `03:10 deploy`, to: 0.03, tone: `amber`, note: `0.2%`, bold: !0 },
                { label: `03:12`, to: 1, tone: `red`, note: `6%` },
                { label: `03:16 rollback`, to: 0.04, tone: `green`, note: `0.2%`, bold: !0 },
              ],
            }),
          },
          links: {
            ...oc(),
            oi: h(`orders`, `inv`, [`orders`, `inv`], { heads: `both`, fail: 0.35 }),
          },
          flows: sc(0),
        },
      },
      {
        short: `Post-mortem`,
        chapter: `insight`,
        title: `Learn from it: the post-mortem`,
        body: [
          `After the incident, the team writes a <span class="term">post-mortem</span>: a timeline, the impact, the root cause, and the actions that stop it happening again.`,
          `It’s <b>blameless</b> — the question is how the system let a mistake through, not who made it. Here: config changes now go through the same canary rollout as code.`,
        ],
        callout: {
          kind: `insight`,
          text: `Each incident is expensive training data. Teams that write good post-mortems make the same mistake much less often.`,
        },
        changes: [`+ Post-mortem written`, `+ Action: canary rollout for config too`],
        metrics: { detect: `1 min`, locate: `4 min`, p99: 310, signals: `metrics + logs + traces` },
        scene: {
          entities: {
            shoppers: rc(),
            ...ac({ gw: [cc(`p99 310 ms`, `green`, `timer`)] }),
            card: lc(
              `Post-mortem · checkout errors`,
              [
                `impact: 6% of checkouts failed, 4 min`,
                `cause: bad timeout in inventory config`,
                `detect 1 min · mitigate 4 min (rollback)`,
                `= action: canary rollout for config`,
                `= action: alert on config-change errors`,
              ],
              `scroll`,
            ),
          },
          links: oc(),
          flows: sc(0),
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>Metrics</b> (rate, errors, duration) show where it hurts.</li>
          <li><b>Alert on SLOs</b> — what users feel — not on raw CPU.</li>
          <li><b>Logs</b> with a request id tell one request’s story.</li>
          <li><b>Traces</b> follow a request across every service.</li>
          <li>In an incident, <b>mitigate first</b>; then write a <b>blameless post-mortem</b>.</li>
        </ul>`,
          `Instrument before you need it — the outage is the wrong time to add logging.`,
        ],
        callout: {
          kind: `next`,
          text: `That completes Reliability. Next module: <b>Architecture</b> — starting with monoliths vs microservices.`,
        },
        metrics: { detect: `2 min`, locate: `5 min`, p99: 310, signals: `metrics + logs + traces` },
        scene: {
          entities: { shoppers: rc(), ...ac({ gw: [cc(`p99 310 ms`, `green`, `timer`)] }) },
          links: oc(),
          flows: sc(0),
        },
      },
    ],
  };

export { dc as observabilityLesson };
export default dc;
