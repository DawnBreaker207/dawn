import { DEAD_STATE, makeBlock, makeCrowd, makeLink, makePanel, cardAt, type Bag, type Tag } from '@/lib/simulator/scene-builders';

const paymentsStyle = { color: `purple`, glyph: `creditCard`, label: [`Payments`] };

const ordersService = (e: Tag[] = []) => makeBlock(-11, 0, { color: `blue`, glyph: `cart`, label: [`Orders`], tags: e });

const paymentsInstance = (e: number, t: string, n: Bag = {}) => makeBlock(0, e, { ...paymentsStyle, sub: t, ...n });

const paymentsA = (e: Bag = {}) => ({ pa: paymentsInstance(-9, `10.0.3.7`, e) });

const paymentsB = (e: Bag = {}) => ({ pb: paymentsInstance(0, `10.0.3.8`, e) });

const paymentsC = (e: Bag = {}) => ({ pc: paymentsInstance(9, `10.0.5.21`, e) });

const paymentsN = (e: Bag = {}) => ({ pn: paymentsInstance(-9, `10.0.6.4`, e) });

const registry = (e: Bag = {}) => makeBlock(11, 0, { color: `yellow`, glyph: `signpost`, label: [`Registry`], ...e });

const ordersLink = (e: string, t: Bag = {}) =>
    makeLink(`ord`, e, e === `pb` ? [`ord`, `pb`] : [`ord`, [-6, `ord`], [-6, e], e], {
      heads: `both`,
      ...t,
    });

const heartbeatLink = (e: string, t: Bag = {}) =>
    makeLink(e, `reg`, e === `pb` ? [`pb`, `reg`] : [e, [6, e], [6, `reg`], `reg`], {
      heads: `none`,
      style: `beat`,
      ...t,
    });

const lookupLink = (e: Bag = {}) => ({
    lk: makeLink(`ord`, `reg`, [`ord`, [`ord`, 13], [`reg`, 13], `reg`], {
      heads: `both`,
      label: `where is payments?`,
      labelAt: 0.27,
      ...e,
    }),
  });

const orderFlows = (e: string[], t = 2.4) => ({ routes: e.map((e) => ({ path: [`o${e}`] })), rate: t, bounce: !0 });

const heartbeatFlows = (e: string[], t = 0.55) => ({
    fanout: !0,
    routes: e.map((e) => ({ path: [`h${e}`] })),
    kind: `ping`,
    rate: t,
  });

const lookupFlow = (e = 0.4) => ({ route: [`lk`], rate: e, bounce: !0 });

const shield = (e: number, t: number) => makeBlock(e, t, { s: 2.2, h: 22, color: `slab`, glyph: `shield`, label: [] });

const card = cardAt({ x: 12, y: 0, dx: 50, dy: -60 });

const serviceDiscoveryLesson = {
    id: `service-discovery`,
    title: `Service Discovery & Gateways`,
    summary: `How services find each other when instances come and go — and one front door for everyone outside.`,
    minutes: 13,
    level: `intermediate`,
    metrics: [`deadCalls`, `instances`, `lookup`],
    legend: [`req`, `res`, [`ping`, `heartbeat`], `fail`],
    goals: [
      { text: `Why hard-coded addresses break`, step: 1 },
      { text: `Registries, heartbeats and DNS`, step: 3 },
      { text: `Client-side vs server-side discovery`, step: 4 },
      { text: `Readiness, slow start and draining`, step: 7 },
      { text: `A registry that can’t go down`, step: 8 },
      { text: `Service meshes and API gateways`, step: 11 },
    ],
    steps: [
      {
        short: `Config`,
        chapter: `setup`,
        title: `Orders calls Payments`,
        body: [
          `With microservices, Orders needs to call Payments. The simplest way: put the payment servers’ IP addresses in Orders’ config file and spread calls across them.`,
          `It works — as long as those two machines never change.`,
        ],
        callout: {
          kind: `insight`,
          text: `In a monolith this question doesn’t exist: “calling payments” is a function call in the same process.`,
        },
        metrics: { deadCalls: 0, instances: 2, lookup: `hard-coded IPs` },
        scene: {
          entities: {
            ord: ordersService([{ text: `config: 10.0.3.7, 10.0.3.8`, icon: `file` }]),
            ...paymentsA(),
            ...paymentsB(),
          },
          links: { opa: ordersLink(`pa`), opb: ordersLink(`pb`) },
          flows: [orderFlows([`pa`, `pb`])],
        },
      },
      {
        short: `Churn`,
        chapter: `problem`,
        title: `Instances come and go`,
        body: [
          `In the cloud, servers are cattle: the autoscaler adds and removes them, deploys replace them, crashed ones are swapped out. Instance 10.0.3.7 was just replaced by a new one at 10.0.5.21.`,
          `Orders still has the old list. Half its calls go to an address where nothing answers, while the new instance sits idle.`,
        ],
        callout: {
          kind: `warn`,
          text: `Any address written into config goes stale. In an autoscaled system that can happen many times a day.`,
        },
        changes: [
          `− 10.0.3.7 replaced`,
          `+ New instance 10.0.5.21 (unknown to Orders)`,
          `− 50% of calls fail`,
        ],
        metrics: { deadCalls: 50, instances: 2, lookup: `hard-coded IPs` },
        scene: {
          entities: {
            ord: ordersService([{ text: `config: 10.0.3.7, 10.0.3.8`, icon: `file` }]),
            ...paymentsA({ ...DEAD_STATE, tags: [{ text: `replaced`, tone: `red`, icon: `alert` }] }),
            ...paymentsB(),
            ...paymentsC({ dim: 1, tags: [{ text: `idle · nobody knows it`, tone: `gray` }] }),
          },
          links: { opa: ordersLink(`pa`, { fail: 1 }), opb: ordersLink(`pb`) },
          flows: [orderFlows([`pa`, `pb`])],
        },
      },
      {
        short: `Registry`,
        chapter: `solution`,
        title: `A service registry`,
        body: [
          `Every instance <b>registers</b> itself with a <span class="term">service registry</span> when it starts, then keeps sending heartbeats (the green pings). Orders asks the registry “where is payments?” and gets the current list.`,
          `Popular registries: Consul, etcd, ZooKeeper, Eureka — and Kubernetes, which does this for every service automatically.`,
        ],
        callout: {
          kind: `tip`,
          text: `Orders caches the list for a few seconds instead of asking on every call — the registry must not become a bottleneck.`,
        },
        changes: [
          `+ Service registry`,
          `+ Instances register + heartbeat`,
          `~ Orders looks up payments’ addresses`,
        ],
        metrics: { deadCalls: 0, instances: 2, lookup: `registry` },
        scene: {
          entities: {
            ord: ordersService([{ text: `cached list · 10 s`, icon: `clock` }]),
            ...paymentsB(),
            ...paymentsC(),
            reg: registry({
              tags: [{ text: `payments → .3.8, .5.21`, tone: `green`, icon: `listOrdered` }],
            }),
          },
          links: { opb: ordersLink(`pb`), opc: ordersLink(`pc`), hpb: heartbeatLink(`pb`), hpc: heartbeatLink(`pc`), ...lookupLink() },
          flows: [orderFlows([`pb`, `pc`]), heartbeatFlows([`pb`, `pc`]), lookupFlow()],
        },
      },
      {
        short: `Churn again`,
        chapter: `insight`,
        title: `Instances join and leave by themselves`,
        body: [
          `Now churn is harmless. A new instance (10.0.6.4) starts, registers, and gets traffic within seconds. Instance 10.0.5.21 hangs: it misses three heartbeats, and the registry drops it.`,
          `Nobody edited a config file.`,
        ],
        callout: {
          kind: `insight`,
          text: `Heartbeats turn “is it alive?” into data the registry can act on — the same idea as load balancer health checks.`,
        },
        changes: [`+ 10.0.6.4 registers`, `− 10.0.5.21 missed 3 heartbeats → removed`],
        metrics: { deadCalls: 0, instances: 2, lookup: `registry` },
        scene: {
          entities: {
            ord: ordersService([{ text: `cached list · 10 s`, icon: `clock` }]),
            ...paymentsN({ tags: [{ text: `new · registered`, tone: `green`, icon: `check` }] }),
            ...paymentsB(),
            ...paymentsC({
              ...DEAD_STATE,
              tags: [{ text: `missed 3 heartbeats`, tone: `red`, icon: `heartPulse` }],
            }),
            reg: registry({
              tags: [{ text: `payments → .3.8, .6.4`, tone: `green`, icon: `listOrdered` }],
            }),
          },
          links: {
            opn: makeLink(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: ordersLink(`pb`),
            hpn: makeLink(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: heartbeatLink(`pb`),
            hpc: heartbeatLink(`pc`, { style: `off` }),
            ...lookupLink(),
          },
          flows: [orderFlows([`pn`, `pb`]), heartbeatFlows([`pn`, `pb`]), lookupFlow()],
        },
      },
      {
        short: `Who balances`,
        chapter: `technique`,
        title: `Client-side or server-side?`,
        body: [
          `<b>Client-side discovery</b>: Orders gets the list itself and picks an instance (round robin, least loaded). No extra hop, but every client needs that logic.`,
          `<b>Server-side discovery</b>: Orders calls one stable name, and an internal load balancer — or a Kubernetes Service — looks up the instances and forwards the call. Clients stay simple.`,
        ],
        callout: {
          kind: `tip`,
          text: `Kubernetes gives every service a stable name and virtual IP; most teams never see the registry at all.`,
        },
        metrics: { deadCalls: 0, instances: 2, lookup: `registry` },
        scene: {
          entities: {
            ord: ordersService(),
            ...paymentsN(),
            ...paymentsB(),
            reg: registry(),
          },
          links: {
            opn: makeLink(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: ordersLink(`pb`),
            hpn: makeLink(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: heartbeatLink(`pb`),
            ...lookupLink(),
          },
          flows: [orderFlows([`pn`, `pb`]), heartbeatFlows([`pn`, `pb`]), lookupFlow()],
        },
      },
      {
        short: `DNS`,
        chapter: `technique`,
        title: `Discovery through DNS`,
        body: [
          `The registry can also answer through plain <span class="term">DNS</span>: looking up <code>payments.internal</code> returns the healthy instances’ IPs. Every language and tool already speaks DNS.`,
          `The catch is caching: clients and libraries may keep an answer for its whole TTL (or longer), still calling an instance that has gone away. Keep TTLs short and retry on connection errors.`,
        ],
        callout: {
          kind: `warn`,
          text: `Some runtimes cache DNS answers forever by default. Check yours before relying on DNS-based discovery.`,
        },
        changes: [`~ Registry answers DNS queries`, `~ payments.internal → healthy IPs · TTL 10 s`],
        metrics: { deadCalls: 0, instances: 2, lookup: `DNS` },
        scene: {
          entities: {
            ord: ordersService([{ text: `resolves payments.internal`, icon: `globe` }]),
            ...paymentsN(),
            ...paymentsB(),
            reg: registry({ glyph: `globe`, label: [`DNS`], sub: `TTL 10 s` }),
          },
          links: {
            opn: makeLink(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: ordersLink(`pb`),
            hpn: makeLink(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: heartbeatLink(`pb`),
            ...lookupLink({ label: `payments.internal?` }),
          },
          flows: [orderFlows([`pn`, `pb`]), heartbeatFlows([`pn`, `pb`]), lookupFlow()],
        },
      },
      {
        short: `Too early`,
        chapter: `problem`,
        title: `Case: traffic before it’s ready`,
        body: [
          `A new instance registers the moment its process starts — before it has opened database connections or warmed its caches. The registry hands its address out at once, it gets a full share of traffic, and for 30 seconds a third of payment calls time out.`,
          `Being <em>alive</em> is not the same as being <em>ready</em>.`,
        ],
        callout: {
          kind: `warn`,
          text: `Cold starts are worst right after deploys and autoscaling — exactly when traffic is moving around anyway.`,
        },
        changes: [
          `+ New instance 10.0.5.21 · still starting`,
          `− Gets traffic immediately`,
          `− Calls to it time out`,
        ],
        metrics: { deadCalls: 33, instances: 3, lookup: `DNS` },
        scene: {
          entities: {
            ord: ordersService([{ text: `resolves payments.internal`, icon: `globe` }]),
            ...paymentsN(),
            ...paymentsB(),
            ...paymentsC({
              heat: 0.6,
              tags: [{ text: `just started · cold`, tone: `amber`, icon: `hourglass` }],
            }),
            reg: registry({ glyph: `globe`, label: [`DNS`], sub: `TTL 10 s` }),
          },
          links: {
            opn: ordersLink(`pn`),
            opb: ordersLink(`pb`),
            opc: ordersLink(`pc`, { fail: 0.8 }),
            hpn: heartbeatLink(`pn`),
            hpb: heartbeatLink(`pb`),
            hpc: heartbeatLink(`pc`),
          },
          flows: [orderFlows([`pn`, `pb`, `pc`], 2.8), heartbeatFlows([`pn`, `pb`, `pc`])],
        },
      },
      {
        short: `Ready`,
        chapter: `solution`,
        title: `Readiness, slow start and draining`,
        body: [
          `Separate two checks: <b>liveness</b> (“the process is running”) and <b>readiness</b> (“it can serve requests now”). An instance is only listed once it passes its readiness check, and balancers ramp its share up gradually — <span class="term">slow start</span>.`,
          `Shutdown is the mirror image: deregister first, wait for in-flight requests to finish (<b>draining</b>), then stop.`,
        ],
        callout: {
          kind: `tip`,
          text: `Kubernetes has these built in: readinessProbe, livenessProbe, and a preStop hook plus grace period for draining.`,
        },
        changes: [
          `+ Readiness check before listing`,
          `+ Slow start: 10% → 100% over a minute`,
          `+ Deregister, drain, then stop`,
        ],
        metrics: { deadCalls: 0, instances: 3, lookup: `DNS` },
        scene: {
          entities: {
            ord: ordersService([{ text: `resolves payments.internal`, icon: `globe` }]),
            ...paymentsN(),
            ...paymentsB(),
            ...paymentsC({
              tags: [{ text: `ready ✓ · ramping 10% → 100%`, tone: `green`, icon: `trendingUp` }],
            }),
            reg: registry({ glyph: `globe`, label: [`DNS`], sub: `TTL 10 s` }),
          },
          links: {
            opn: ordersLink(`pn`),
            opb: ordersLink(`pb`),
            opc: ordersLink(`pc`, { style: `dashed` }),
            hpn: heartbeatLink(`pn`),
            hpb: heartbeatLink(`pb`),
            hpc: heartbeatLink(`pc`),
          },
          flows: [
            {
              routes: [
                { path: [`opn`], weight: 1 },
                { path: [`opb`], weight: 1 },
                { path: [`opc`], weight: 0.25 },
              ],
              pick: `weights`,
              rate: 2.8,
              bounce: !0,
            },
            heartbeatFlows([`pn`, `pb`, `pc`]),
          ],
        },
      },
      {
        short: `Registry down`,
        chapter: `insight`,
        title: `What if the registry goes down?`,
        body: [
          `Everything now depends on the registry, so it can’t be a single point of failure. Two things save you. Callers <b>cache</b> their last known list, so traffic keeps flowing even while the registry is unreachable — they just won’t see changes for a while.`,
          `And the registry runs as a small <b>cluster</b> of 3 or 5 nodes that agree by majority vote (Raft or Paxos). Losing one node — or even two out of five — changes nothing.`,
        ],
        callout: {
          kind: `insight`,
          text: `etcd, Consul and ZooKeeper are all consensus clusters. Odd sizes matter: 3 nodes survive 1 failure, 5 survive 2.`,
        },
        changes: [
          `+ Registry runs as 3 nodes`,
          `− One node down`,
          `~ Majority (2 of 3) keeps answering`,
        ],
        metrics: { deadCalls: 0, instances: 2, lookup: `registry` },
        scene: {
          entities: {
            ord: ordersService([{ text: `cached list · still works`, tone: `green`, icon: `clock` }]),
            ...paymentsN(),
            ...paymentsB(),
            reg: registry({ tags: [{ text: `leader · 2 of 3 up`, tone: `green`, icon: `check` }] }),
            reg2: makeBlock(16, 2, { s: 3, h: 32, color: `yellow`, glyph: `signpost`, label: [], ...DEAD_STATE }),
            reg3: makeBlock(11, -8, { s: 3, h: 32, color: `yellow`, glyph: `signpost`, label: [] }),
          },
          links: {
            opn: ordersLink(`pn`),
            opb: ordersLink(`pb`),
            hpn: heartbeatLink(`pn`),
            hpb: heartbeatLink(`pb`),
            ...lookupLink(),
            r2: makeLink(`reg`, `reg2`, [`reg`, `reg2`], { heads: `none`, style: `off` }),
            r3: makeLink(`reg`, `reg3`, [`reg`, `reg3`], { heads: `none`, style: `beat` }),
          },
          flows: [
            orderFlows([`pn`, `pb`]),
            heartbeatFlows([`pn`, `pb`]),
            lookupFlow(),
            { route: [`r3`], kind: `ping`, rate: 0.6, bounce: !0 },
          ],
        },
      },
      {
        short: `Plumbing`,
        chapter: `problem`,
        title: `Every team rebuilds the same plumbing`,
        body: [
          `Discovery is only the start. Every call between services also needs timeouts, retries, circuit breakers, encryption and metrics.`,
          `With services in Java, Go, Python and Node, each team writes its own version of all of that — with its own bugs, and its own defaults.`,
        ],
        callout: {
          kind: `warn`,
          text: `Five implementations of retry logic means five different behaviours during an outage.`,
        },
        changes: [`+ Retry/TLS/metrics code in every service`],
        metrics: { deadCalls: 0, instances: 2, lookup: `DNS` },
        scene: {
          entities: {
            ord: ordersService([{ text: `retries · TLS · metrics (Java)`, tone: `amber`, icon: `settings` }]),
            ...paymentsN({
              tags: [{ text: `retries · TLS · metrics (Go)`, tone: `amber`, icon: `settings` }],
            }),
            ...paymentsB(),
            reg: registry({ glyph: `globe`, label: [`DNS`], sub: `TTL 10 s` }),
          },
          links: {
            opn: makeLink(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: ordersLink(`pb`),
            hpn: makeLink(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: heartbeatLink(`pb`),
            ...lookupLink({ label: `payments.internal?` }),
          },
          flows: [orderFlows([`pn`, `pb`]), heartbeatFlows([`pn`, `pb`]), lookupFlow()],
        },
      },
      {
        short: `Mesh`,
        chapter: `solution`,
        title: `A service mesh: sidecars do it`,
        body: [
          `A <span class="term">service mesh</span> (Istio, Linkerd) runs a small proxy — a <b>sidecar</b> — next to every service. Each service just talks to its local sidecar; the sidecars find instances, retry, time out, encrypt (mTLS) and report metrics.`,
          `A <b>control plane</b> pushes the current instances and policies to every sidecar. The plumbing is written once, in one place.`,
        ],
        callout: {
          kind: `tip`,
          text: `A mesh adds latency (two extra local hops) and real operational complexity. Worth it with many services; overkill for a handful.`,
        },
        changes: [
          `+ Sidecar proxy next to each service`,
          `~ Registry → control plane`,
          `− Plumbing code removed from services`,
        ],
        metrics: { deadCalls: 0, instances: 2, lookup: `mesh sidecars` },
        scene: {
          entities: {
            ord: ordersService(),
            ...paymentsN(),
            ...paymentsB(),
            reg: registry({ glyph: `settings`, label: [`Control`, `Plane`] }),
            so: shield(-7.4, 3.6),
            spn: shield(-3.6, -12.6),
            spb: shield(3.6, 3.6),
          },
          links: {
            opn: makeLink(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: ordersLink(`pb`),
            hpn: makeLink(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: heartbeatLink(`pb`),
            push: makeLink(`reg`, `ord`, [`reg`, [`reg`, 13], [`ord`, 13], `ord`], {
              label: `config pushed to sidecars`,
              labelAt: 0.73,
            }),
          },
          flows: [
            orderFlows([`pn`, `pb`]),
            heartbeatFlows([`pn`, `pb`]),
            { route: [`push`], rate: 0.35, kind: `write` },
          ],
        },
      },
      {
        short: `Gateway`,
        chapter: `technique`,
        title: `At the edge: an API gateway`,
        body: [
          `Discovery handles calls <em>between</em> services. For clients outside — apps and browsers — an <span class="term">API gateway</span> is the single front door: it authenticates requests, applies rate limits, terminates TLS and routes each path to the right service.`,
          `Clients never learn your internal layout, so you can split, merge or move services freely.`,
        ],
        callout: {
          kind: `tip`,
          text: `Different clients often get their own gateway — a backend-for-frontend (BFF) — that shapes responses for mobile or web.`,
        },
        changes: [`+ API gateway in front of the services`, `+ Clients only know the gateway`],
        metrics: { deadCalls: 0, instances: 2, lookup: `mesh sidecars` },
        scene: {
          entities: {
            clients: makeCrowd({ x0: -16.5, x1: -7.5, y0: -25, y1: -19 }, 11, `apps & browsers`),
            gw: makeBlock(-12, -11, {
              color: `orange`,
              glyph: `route`,
              label: [`API`, `Gateway`],
              tags: [{ text: `auth · rate limits · routing`, icon: `shield` }],
              pills: `below`,
            }),
            ord: ordersService(),
            ...paymentsN(),
            ...paymentsB(),
            reg: registry({ glyph: `settings`, label: [`Control`, `Plane`] }),
            so: shield(-7.4, 3.6),
            spn: shield(-3.6, -12.6),
            spb: shield(3.6, 3.6),
          },
          links: {
            cg: makeLink(`clients`, `gw`, [`clients`, `gw`], { heads: `both` }),
            go: makeLink(`gw`, `ord`, [`gw`, `ord`], { heads: `both` }),
            opn: makeLink(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: ordersLink(`pb`),
            hpn: makeLink(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: heartbeatLink(`pb`),
          },
          flows: [
            {
              routes: [{ path: [`cg`, `go`, `opn`] }, { path: [`cg`, `go`, `opb`] }],
              rate: 2.2,
              bounce: !0,
            },
            heartbeatFlows([`pn`, `pb`]),
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Hard-coded addresses go stale as instances come and go.</li>
          <li>A <b>registry</b> with heartbeats (or <b>DNS</b>) keeps the list current.</li>
          <li>List instances only when <b>ready</b>; deregister and <b>drain</b> before stopping.</li>
          <li>Discovery can live in the client, a proxy, or a <b>mesh sidecar</b>.</li>
          <li>An <b>API gateway</b> is the one front door for outside clients.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Sagas</b> — keeping data consistent when one action spans several services.`,
        },
        metrics: { deadCalls: 0, instances: 2, lookup: `mesh sidecars` },
        scene: {
          entities: {
            ord: ordersService(),
            ...paymentsN(),
            ...paymentsB(),
            reg: registry(),
            so: shield(-7.4, 3.6),
            spn: shield(-3.6, -12.6),
            spb: shield(3.6, 3.6),
          },
          links: {
            opn: makeLink(`ord`, `pn`, [`ord`, [-6, `ord`], [-6, `pn`], `pn`], { heads: `both` }),
            opb: ordersLink(`pb`),
            hpn: makeLink(`pn`, `reg`, [`pn`, [6, `pn`], [6, `reg`], `reg`], {
              heads: `none`,
              style: `beat`,
            }),
            hpb: heartbeatLink(`pb`),
            ...lookupLink(),
          },
          flows: [orderFlows([`pn`, `pb`]), heartbeatFlows([`pn`, `pb`]), lookupFlow()],
        },
      },
    ],
  };

export { serviceDiscoveryLesson as serviceDiscoveryLesson };
export default serviceDiscoveryLesson;
