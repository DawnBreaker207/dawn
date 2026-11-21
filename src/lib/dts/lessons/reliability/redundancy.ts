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

const ps = { x0: -4.5, x1: 4.5, y0: -23, y1: -17 };

const ms = { x0: -9.5, x1: 9.5, y0: -14, y1: 13.8 };

const hs = { x0: -15, x1: -1.2, y0: -3.6, y1: 13.8 };

const gs = { x0: 1.2, x1: 15, y0: -3.6, y1: 13.8 };

const _s = () => p(ps, 12, `1M users`);

const vs = (e = {}) => f(0, -10, e);

const ys = (e, t, n = {}) => ({ [e]: d(t, 0, { label: [`App`], ...n }) });

const bs = (e, t, n = {}) => ({ [e]: b(t, 10, { r: 1.8, glyph: `database`, ...n }) });

const xs = { tags: [{ text: `single point of failure`, tone: `red`, icon: `alert` }] };

const Ss = (e = {}) => ({
    users: _s(),
    lb: vs(e.lb),
    ...ys(`a1`, 0, e.a1),
    ...bs(`db`, 0, { label: `database`, ...(e.db || {}) }),
  });

const Cs = (e = {}) => ({
    ul: h(`users`, `lb`, [`users`, `lb`], { heads: `both`, ...e }),
    la1: h(`lb`, `a1`, [`lb`, `a1`]),
    adb: h(`a1`, `db`, [`a1`, `db`], { heads: `both` }),
  });

const ws = (e, t = {}) => ({
    ...ys(`a1`, -e, t.a1),
    ...ys(`a2`, e, t.a2),
    ...bs(`db`, -e, { label: `leader`, ...(t.db || {}) }),
    ...bs(`db2`, e, { label: `follower`, ...(t.db2 || {}) }),
  });

const Ts = (e = {}) => ({
    ul: h(`users`, `lb`, [`users`, `lb`], { heads: `both`, ...(e.ul || {}) }),
    la1: h(`lb`, `a1`, [`lb`, [`a1`, `lb`], `a1`], e.la1),
    la2: h(`lb`, `a2`, [`lb`, [`a2`, `lb`], `a2`], e.la2),
    adb: h(`a1`, `db`, [`a1`, `db`], { heads: `both`, ...(e.adb || {}) }),
    a2db: h(`a2`, `db`, [`a2`, [`a2`, 5], [`db+1`, 5], [`db+1`, `db`]], {
      heads: `both`,
      ...(e.a2db || {}),
    }),
    rep: h(`db`, `db2`, [`db`, `db2`], { label: `replication`, ...(e.rep || {}) }),
  });

const Es = [
    {
      routes: [{ path: [`ul`, `la1`, `adb`] }, { path: [`ul`, `la2`, `a2db`] }],
      rate: 2.6,
      bounce: !0,
    },
    { route: [`rep`], kind: `write`, rate: 0.6 },
  ];

const Ds = (e = {}) => ({
    users: _s(),
    lb: vs({ tags: [{ text: `regional · spans zones`, icon: `globe` }] }),
    za: x(hs, `ZONE A · OFFLINE`),
    zb: x(gs, `ZONE B`),
    ...ws(8, {
      a1: g,
      db: { ...g, label: `leader` },
      db2: { label: `leader`, tags: [{ text: `promoted`, tone: `green`, icon: `check` }] },
    }),
    ...e,
  });

const Os = {
    ul: h(`users`, `lb`, [`users`, `lb`], { heads: `both` }),
    la1: h(`lb`, `a1`, [`lb`, [`a1`, `lb`], `a1`], { style: `off` }),
    la2: h(`lb`, `a2`, [`lb`, [`a2`, `lb`], `a2`]),
    a2d2: h(`a2`, `db2`, [`a2`, `db2`], { heads: `both` }),
  };

const ks = [{ route: [`ul`, `la2`, `a2d2`], rate: 2.6, bounce: !0 }];

const As = (e, t, n) => S({ x: 15, y: 13.8, z: 0, dx: -130, dy: -240 }, e, t, { icon: n });

// --- reliability ---
const js = {
    id: `redundancy`,
    title: `Redundancy & Failover`,
    summary: `Everything fails eventually. Design so that no single failure takes you down.`,
    minutes: 12,
    level: `intermediate`,
    metrics: [`avail`, `downtime`, `spofs`, `survives`],
    legend: [`req`, `res`, [`write`, `replication`], `fail`],
    goals: [
      { text: `Measure availability in nines`, step: 0 },
      { text: `Find and remove single points of failure`, step: 2 },
      { text: `Spread copies across failure domains`, step: 4 },
      { text: `RTO, RPO and testing failover`, step: 6 },
      { text: `Bad deploys, canaries and regions`, step: 8 },
    ],
    steps: [
      {
        short: `Nines`,
        chapter: `setup`,
        title: `How available is one of everything?`,
        body: [
          `A simple stack: a load balancer, an app server and a database. Each one is up 99.9% of the time — that sounds great.`,
          `But a request needs <b>all three</b> working, so their availabilities multiply: 0.999 × 0.999 × 0.999 ≈ <b>99.7%</b>. That’s about 26 hours of downtime a year.`,
        ],
        callout: {
          kind: `insight`,
          text: `Availability is usually quoted in “nines”. Each extra nine cuts allowed downtime by 10×.`,
        },
        metrics: { avail: `99.7%`, downtime: `26 h`, spofs: 3, survives: `nothing` },
        scene: {
          entities: {
            ...Ss(),
            card: As(
              `The nines`,
              [
                `99%     → 3.7 days down / year`,
                `99.9%   → 8.8 hours`,
                `99.99%  → 53 minutes`,
                `99.999% → 5 minutes`,
                `! in a chain: 0.999³ = 99.7%`,
              ],
              `heartPulse`,
            ),
          },
          links: Cs(),
          flows: [{ route: [`ul`, `la1`, `adb`], rate: 2, bounce: !0 }],
        },
      },
      {
        short: `SPOFs`,
        chapter: `problem`,
        title: `Every box is a single point of failure`,
        body: [
          `A <span class="term">single point of failure</span> (SPOF) is anything whose failure alone takes the system down. Here, that’s every component.`,
          `A bad disk, a kernel panic, a botched deploy — any one of them and a million users see an error page.`,
        ],
        callout: {
          kind: `warn`,
          text: `Hardware fails, software crashes and people make mistakes. Assume each will happen — the question is what breaks when it does.`,
        },
        changes: [`+ 3 single points of failure marked`],
        metrics: { avail: `99.7%`, downtime: `26 h`, spofs: 3, survives: `nothing` },
        scene: {
          entities: Ss({ lb: xs, a1: xs, db: { ...xs, label: `database` } }),
          links: Cs(),
          flows: [{ route: [`ul`, `la1`, `adb`], rate: 2, bounce: !0 }],
        },
      },
      {
        short: `Two of each`,
        chapter: `solution`,
        title: `Redundancy: two of everything`,
        body: [
          `Add a spare for each part: the load balancer runs as an active–passive pair, two app servers share traffic, and the database has a follower ready to take over.`,
          `Now <em>both</em> copies must fail at once for an outage — 0.1% × 0.1% = 0.0001%. Losing any single machine is a non-event.`,
        ],
        callout: {
          kind: `tip`,
          text: `On paper, parts in parallel multiply their failure chances: two 99.9% copies give 99.9999%. Real pairs do worse — failover takes time, and both copies still share a building, a network and your deploys — so we count a cautious 99.95%.`,
        },
        changes: [
          `+ Load balancer pair`,
          `+ Second app server`,
          `+ Database follower`,
          `~ Single points of failure 3 → 0`,
        ],
        metrics: { avail: `99.95%`, downtime: `4 h`, spofs: 0, survives: `a server` },
        scene: {
          entities: {
            users: _s(),
            lb: vs({ tags: [{ text: `active–passive pair`, icon: `replay` }] }),
            ...ws(5),
          },
          links: Ts(),
          flows: Es,
        },
      },
      {
        short: `One building`,
        chapter: `problem`,
        title: `Copies that fail together`,
        body: [
          `All those copies sit in one data center. Then a power outage (or a flood, a fibre cut, a cooling failure) takes out the whole building — and every “redundant” copy with it.`,
          `Failures that hit many components at once are <span class="term">correlated failures</span>. Redundancy only helps if the copies fail <em>independently</em>.`,
        ],
        callout: {
          kind: `warn`,
          text: `Shared power, network, racks, software versions and even the same bad config push can all take out every copy together.`,
        },
        changes: [
          `+ Everything in one data center`,
          `− Data center power outage`,
          `− All copies down at once`,
        ],
        metrics: { avail: `99.95%`, downtime: `+ 6 h outage`, spofs: 1, survives: `a server` },
        scene: {
          entities: {
            users: _s(),
            dc: x(ms, `ONE DATA CENTER · POWER LOST`),
            lb: vs(g),
            ...ws(5, {
              a1: g,
              a2: g,
              db: { ...g, label: `leader` },
              db2: { ...g, label: `follower` },
            }),
          },
          links: Ts({
            ul: { fail: 1 },
            la1: { style: `off` },
            la2: { style: `off` },
            adb: { style: `off` },
            a2db: { style: `off` },
            rep: { style: `off` },
          }),
          flows: [{ route: [`ul`], rate: 2.4 }],
        },
      },
      {
        short: `Zones`,
        chapter: `solution`,
        title: `Spread across availability zones`,
        body: [
          `Cloud regions are split into <span class="term">availability zones</span>: separate data centers, kilometres to tens of kilometres apart, with their own power and network, joined by fast links.`,
          `Put one app server and one database copy in each zone. A zone-wide disaster now takes out only half.`,
        ],
        callout: {
          kind: `tip`,
          text: `Same idea at every scale: spread across racks, zones and — for the most critical systems — whole regions.`,
        },
        changes: [
          `− Single data center`,
          `+ Zone A and zone B`,
          `~ One copy of each tier per zone`,
        ],
        metrics: { avail: `99.99%`, downtime: `53 min`, spofs: 0, survives: `a zone` },
        scene: {
          entities: {
            users: _s(),
            lb: vs({ tags: [{ text: `regional · spans zones`, icon: `globe` }] }),
            za: x(hs, `ZONE A`),
            zb: x(gs, `ZONE B`),
            ...ws(8),
          },
          links: Ts({ rep: { label: `cross-zone replication` } }),
          flows: Es,
        },
      },
      {
        short: `Zone fails`,
        chapter: `solution`,
        title: `Zone A goes dark — failover`,
        body: [
          `Zone A loses power. Health checks fail, the load balancer stops sending traffic there, and the follower in zone B is promoted to leader.`,
          `Users in the middle of a request may see an error and retry; within a minute everything runs from zone B.`,
        ],
        callout: {
          kind: `insight`,
          text: `Zone B must have enough spare capacity to carry all the traffic alone. Redundancy you can’t afford to run on is not redundancy.`,
        },
        changes: [`− Zone A offline`, `~ Traffic → zone B only`, `~ Follower promoted to leader`],
        metrics: { avail: `99.99%`, downtime: `53 min`, spofs: 0, survives: `a zone` },
        scene: { entities: Ds(), links: Os, flows: ks },
      },
      {
        short: `RTO & RPO`,
        chapter: `technique`,
        title: `How fast, and how much lost?`,
        body: [
          `Two numbers describe a failover. <span class="term">RTO</span> (recovery time objective): how long until service is back. <span class="term">RPO</span> (recovery point objective): how much recent data you can afford to lose.`,
          `Async replication means the follower may be a few seconds behind — those writes are gone. Synchronous replication gets RPO to zero, at the cost of slower writes.`,
        ],
        callout: {
          kind: `tip`,
          text: `Decide RTO and RPO with the business first; they determine the design (and the bill).`,
        },
        metrics: { avail: `99.99%`, downtime: `53 min`, spofs: 0, survives: `a zone` },
        scene: {
          entities: Ds({
            card: As(
              `This failover`,
              [
                `detect: 3 missed health checks   10 s`,
                `promote follower                 20 s`,
                `reconnect apps                   30 s`,
                `= RTO ≈ 1 minute`,
                `! RPO ≈ 2 s of async writes lost`,
              ],
              `timer`,
            ),
          }),
          links: Os,
          flows: ks,
        },
      },
      {
        short: `Chaos`,
        chapter: `insight`,
        title: `Untested failover doesn’t work`,
        body: [
          `A failover path that never runs quietly rots: a config drifts, a spare is too small, a script has a typo. You find out during the real outage.`,
          `So teams break things <em>on purpose</em>, in production, during working hours — <span class="term">chaos engineering</span>. Here a test kills an app server and everyone watches the system cope.`,
        ],
        callout: {
          kind: `tip`,
          text: `Netflix’s Chaos Monkey randomly kills servers every day. Start smaller: a planned game day, one failure at a time.`,
        },
        changes: [
          `~ Zone A restored`,
          `− App server killed on purpose`,
          `~ Traffic continues on the other`,
        ],
        metrics: { avail: `99.99%`, downtime: `53 min`, spofs: 0, survives: `a zone` },
        scene: {
          entities: {
            users: _s(),
            lb: vs({ tags: [{ text: `regional · spans zones`, icon: `globe` }] }),
            za: x(hs, `ZONE A`),
            zb: x(gs, `ZONE B`),
            ...ws(8, {
              a1: { ...g, tags: [{ text: `killed by chaos test`, tone: `amber`, icon: `bug` }] },
            }),
          },
          links: Ts({ la1: { style: `off` }, adb: { style: `off` } }),
          flows: [
            { route: [`ul`, `la2`, `a2db`], rate: 2.6, bounce: !0 },
            { route: [`rep`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Bad deploy`,
        chapter: `problem`,
        title: `Case: the bug that’s everywhere at once`,
        body: [
          `A new release with a bug goes out to every app server in both zones at the same moment. Every copy crashes on the same request — redundancy doesn’t help when all the copies share the same broken code.`,
          `This is the most common cause of real outages: not hardware, but <b>changes</b> — code, config, or infrastructure.`,
        ],
        callout: {
          kind: `warn`,
          text: `Identical copies fail identically. A bad change is a correlated failure you inflict on yourself.`,
        },
        changes: [`+ Release v2.4 to all servers at once`, `− Both app servers crash`],
        metrics: { avail: `99.99%`, downtime: `+ 40 min outage`, spofs: 0, survives: `a zone` },
        scene: {
          entities: {
            users: _s(),
            lb: vs({ tags: [{ text: `regional · spans zones`, icon: `globe` }] }),
            za: x(hs, `ZONE A`),
            zb: x(gs, `ZONE B`),
            ...ws(8, {
              a1: { ...g, tags: [{ text: `v2.4 · crashing`, tone: `red`, icon: `bug` }] },
              a2: { ...g, tags: [{ text: `v2.4 · crashing`, tone: `red`, icon: `bug` }] },
            }),
          },
          links: Ts({
            ul: { fail: 1 },
            la1: { style: `off` },
            la2: { style: `off` },
            adb: { style: `off` },
            a2db: { style: `off` },
          }),
          flows: [
            { route: [`ul`], rate: 2.4 },
            { route: [`rep`], kind: `write`, rate: 0.3 },
          ],
        },
      },
      {
        short: `Canary`,
        chapter: `solution`,
        title: `Canary releases`,
        body: [
          `Roll out in stages instead. First a <span class="term">canary</span>: one server, or 1% of traffic, gets v2.4. Watch its error rate and latency against the others for a while.`,
          `If it looks worse, roll back — only 1% of users were affected, briefly. If it looks good, continue to 10%, 50%, 100%. Many teams also deploy one zone at a time.`,
        ],
        callout: {
          kind: `tip`,
          text: `Feature flags complement this: ship code turned off, then turn it on gradually — and off instantly if needed.`,
        },
        changes: [`~ v2.4 on one server only`, `~ 1% of traffic`, `~ Automatic rollback on errors`],
        metrics: { avail: `99.99%`, downtime: `53 min`, spofs: 0, survives: `a zone` },
        scene: {
          entities: {
            users: _s(),
            lb: vs({ tags: [{ text: `1% → canary`, tone: `amber`, icon: `split` }] }),
            za: x(hs, `ZONE A`),
            zb: x(gs, `ZONE B`),
            ...ws(8, {
              a1: { tags: [{ text: `v2.3 · 99%`, tone: `green` }] },
              a2: { tags: [{ text: `v2.4 canary · 1%`, tone: `amber`, icon: `bug` }] },
            }),
          },
          links: Ts({ la2: { style: `dashed` } }),
          flows: [
            {
              routes: [
                { path: [`ul`, `la1`, `adb`], weight: 0.9 },
                { path: [`ul`, `la2`, `a2db`], weight: 0.1, kind: `slow` },
              ],
              pick: `weights`,
              rate: 2.6,
              bounce: !0,
            },
            { route: [`rep`], kind: `write`, rate: 0.6 },
          ],
        },
      },
      {
        short: `Regions`,
        chapter: `technique`,
        title: `Beyond zones: multiple regions`,
        body: [
          `Zones protect against a building failing. A whole <b>region</b> can still go down (a regional network or cloud control-plane outage), and it’s far from users on other continents.`,
          `Running in two regions with a global DNS or anycast front door lets users go to the nearest healthy region. The hard part is the data: copies across an ocean replicate with ~100 ms of lag.`,
        ],
        callout: {
          kind: `insight`,
          text: `Multi-region is expensive and complex. Most systems are well served by multiple zones in one region plus good backups.`,
        },
        changes: [
          `+ Second region`,
          `+ Global front door routes to the nearest healthy region`,
          `~ Cross-region replication ≈ 100 ms lag`,
        ],
        metrics: { avail: `99.995%`, downtime: `26 min`, spofs: 0, survives: `a region` },
        scene: {
          entities: {
            users: _s(),
            lb: d(0, -10, {
              color: `orange`,
              glyph: `globe`,
              label: [`Global`, `DNS`],
              tags: [{ text: `nearest healthy region`, icon: `globe` }],
            }),
            za: x(hs, `REGION · EU`),
            zb: x(gs, `REGION · US`),
            ...ws(8, { db: { label: `EU primary` }, db2: { label: `US replica` } }),
          },
          links: Ts({ rep: { label: `cross-region · ~100 ms lag` } }),
          flows: Es,
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Components in a chain <b>multiply</b> their availability.</li>
          <li>Remove <b>single points of failure</b> with redundant copies.</li>
          <li>Copies must fail <b>independently</b>: spread them across zones.</li>
          <li>Set <b>RTO/RPO</b>, and practise failover so it works when needed.</li>
          <li>Most outages are <b>changes</b>: roll out with <b>canaries</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Rate Limiting</b> — protecting the system from too much of the wrong traffic.`,
        },
        metrics: { avail: `99.99%`, downtime: `53 min`, spofs: 0, survives: `a zone` },
        scene: {
          entities: {
            users: _s(),
            lb: vs({ tags: [{ text: `regional · spans zones`, icon: `globe` }] }),
            za: x(hs, `ZONE A`),
            zb: x(gs, `ZONE B`),
            ...ws(8),
          },
          links: Ts({ rep: { label: `cross-zone replication` } }),
          flows: Es,
        },
      },
    ],
  };

export { js as redundancyLesson };
export default js;
