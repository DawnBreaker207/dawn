import { makeBalancer, makeBlock, makeDb, makeDevice, makeLink, makePanel, makeZone, cardAt, type Tag, type SceneOpts } from '@/lib/simulator/scene-builders';

// One region, two AZs, then a DR region. Same nodes all lesson long:
//
//   users ─ Route 53 ─ ALB ─┬─ EC2 (AZ-a) ─ RDS primary
//              │            └─ EC2 (AZ-b) ─ RDS standby
//              └─ DR app ─ DR database (us-west-2)

// colors by role: edge/DNS yellow · gateways orange · compute blue · data db · security purple
const users = () => makeDevice(-16, -15.5, { label: `users` });
const r53 = (tags: Tag[] = []) => makeBlock(-11.5, -8.5, { s: 4.4, h: 50, color: `yellow`, glyph: `globe`, label: [`Route 53`], sub: `DNS`, tags });
const alb = (tags: Tag[] = []) => makeBalancer(-5.5, -3, { s: 4.4, h: 50, label: [`ALB`], sub: `cross-zone`, tags });
const ec2 = (x: number, y: number, az: string, tags: Tag[], o: SceneOpts) =>
  makeBlock(x, y, { s: 4.4, h: 50, color: `blue`, glyph: `server`, label: [`EC2 · ASG`], sub: az, tags, ...o });
const ec2a = (tags: Tag[] = [], o: SceneOpts = {}) => ec2(-7, 10, `AZ-a`, tags, o);
const ec2b = (tags: Tag[] = [], o: SceneOpts = {}) => ec2(8, -5, `AZ-b`, tags, o);
const dbP = (tags: Tag[] = [], o: SceneOpts = {}) => makeDb(-0.5, 16.5, { r: 2.1, h: 44, label: `RDS primary`, tags, ...o });
const dbS = (tags: Tag[] = [], o: SceneOpts = {}) => makeDb(14.5, 1.5, { r: 2.1, h: 44, label: `RDS standby`, tags, ...o });
const drApp = (tags: Tag[] = [], o: SceneOpts = {}) =>
  makeBlock(1.5, -21.5, { s: 4.2, h: 48, color: `blue`, glyph: `server`, label: [`DR stack`], sub: `us-west-2`, tags, ...o });
const drDb = (tags: Tag[] = []) => makeDb(14.5, -18.5, { r: 2.1, h: 44, label: `Aurora global`, tags });

const azA = () => makeZone({ x0: -9.5, x1: 1.5, y0: 5.5, y1: 19 }, `AZ-A`);
const azB = () => makeZone({ x0: 5.5, x1: 17, y0: -9.5, y1: 4 }, `AZ-B`);
const drRegion = () => makeZone({ x0: -1, x1: 17, y0: -24, y1: -16 }, ``);

const links = {
  dns: makeLink(`users`, `r53`, [`users`, `r53`], { heads: `both` }),
  r53Alb: makeLink(`r53`, `alb`, [`r53`, `alb`], { heads: `both` }),
  albA: makeLink(`alb`, `ec2a`, [`alb`, `ec2a`], { heads: `both` }),
  albB: makeLink(`alb`, `ec2b`, [`alb`, `ec2b`], { heads: `both` }),
  aDb: makeLink(`ec2a`, `dbP`, [`ec2a`, `dbP`], { heads: `both` }),
  bDb: makeLink(`ec2b`, `dbP`, [`ec2b`, `dbP`], { heads: `both` }),
  bDbS: makeLink(`ec2b`, `dbS`, [`ec2b`, `dbS`], { heads: `both` }),
  sync: makeLink(`dbP`, `dbS`, [`dbP`, `dbS`], { label: `sync` }),
  syncQuiet: makeLink(`dbP`, `dbS`, [`dbP`, `dbS`], { style: `off` }),
  global: makeLink(`dbS`, `drDb`, [`dbS`, `drDb`], { label: `async < 1 s` }),
  r53Dr: makeLink(`r53`, `drApp`, [`r53`, `drApp`], { style: `dashed` }),
  r53DrLive: makeLink(`r53`, `drApp`, [`r53`, `drApp`], { heads: `both` }),
  drDbLink: makeLink(`drApp`, `drDb`, [`drApp`, `drDb`], { heads: `both` }),
};

const card = cardAt({ x: -11.5, y: -8.5, dx: -180, dy: -235 });

const region = () => ({ azA: azA(), azB: azB(), users: users() });

export const awsHaLesson = {
  id: `aws-ha`,
  title: `AWS High Availability & Disaster Recovery`,
  summary: `Keep one app alive through an instance, an AZ and a whole Region failing: Route 53, cross-zone ALB, Auto Scaling, Multi-AZ RDS and DR tiers.`,
  minutes: 15,
  level: `advanced`,
  metrics: [`routing`, `healthy`, `capacity`, `database`, `rto`],
  legend: [`req`, `res`, [`write`, `replication`], `fail`],
  goals: [
    { text: `Route 53 routing and health checks`, step: 1 },
    { text: `ALB balancing across AZs`, step: 2 },
    { text: `Auto Scaling Groups`, step: 3 },
    { text: `Surviving an AZ failure`, step: 5 },
    { text: `The four DR strategies`, step: 6 },
    { text: `Aurora Global Database failover`, step: 7 },
  ],
  steps: [
    {
      short: `Route 53`,
      chapter: `setup`,
      title: `Route 53 answers first`,
      body: [
        `Every visit starts with DNS. <span class="term">Route 53</span> answers with the ALB’s address — and can do much more than a plain A record:`,
        `<b>latency</b> routing (closest Region), <b>geolocation</b> (by country), <b>weighted</b> (canary %), and <b>failover</b>: a health check watches the primary, and if it fails, Route 53 answers with the secondary instead.`,
      ],
      callout: { kind: `insight`, text: `A Route 53 health check can watch an endpoint, other health checks, or a CloudWatch alarm.` },
      metrics: { routing: `primary`, healthy: `1 / 1`, capacity: `1`, database: `—`, rto: `—` },
      scene: {
        entities: { azA: azA(), users: users(), r53: r53([{ text: `health ✓`, tone: `green` }]), alb: alb(), ec2a: ec2a() },
        links: { dns: links.dns, r53Alb: links.r53Alb, albA: links.albA },
        flows: [{ route: [`dns`, `r53Alb`, `albA`], rate: 1.2, bounce: true }],
      },
    },
    {
      short: `Two AZs`,
      chapter: `technique`,
      title: `Spread the app over two AZs`,
      body: [
        `One instance in one AZ is one failure away from an outage. Run instances in a second <span class="term">Availability Zone</span> — a separate data center with its own power and network.`,
        `The ALB has a node in every enabled AZ. With <span class="term">cross-zone load balancing</span> (on by default for ALB), each node spreads requests across targets in all AZs evenly.`,
      ],
      callout: { kind: `tip`, text: `ALB works at layer 7: path rules (/api vs /static), host rules, and built-in OIDC/Cognito login.` },
      changes: [`+ EC2 in AZ-b`, `~ ALB spreads across both AZs`],
      metrics: { routing: `primary`, healthy: `2 / 2`, capacity: `2`, database: `—`, rto: `—` },
      scene: {
        entities: { ...region(), r53: r53(), alb: alb(), ec2a: ec2a(), ec2b: ec2b() },
        links: { dns: links.dns, r53Alb: links.r53Alb, albA: links.albA, albB: links.albB },
        flows: [
          { route: [`dns`, `r53Alb`, `albA`], rate: 1, bounce: true },
          { route: [`dns`, `r53Alb`, `albB`], rate: 1, bounce: true },
        ],
      },
    },
    {
      short: `Auto Scaling`,
      chapter: `technique`,
      title: `Auto Scaling keeps the right count`,
      body: [
        `An <span class="term">Auto Scaling Group</span> owns the instances: <b>min 2, desired 4, max 10</b>, spread over both AZs from one Launch Template.`,
        `A <b>target tracking</b> policy holds a metric — say 60% average CPU. Traffic spikes, the group adds instances; the night is quiet, it removes them. Unhealthy instances are replaced automatically.`,
      ],
      callout: { kind: `insight`, text: `Use Launch Templates (versioned, mixed On-Demand + Spot) — Launch Configurations are legacy.` },
      changes: [`~ ASG 2 → 4 instances`, `+ target tracking CPU 60%`],
      metrics: { routing: `primary`, healthy: `4 / 4`, capacity: `4 (2–10)`, database: `—`, rto: `—` },
      scene: {
        entities: {
          ...region(),
          r53: r53(),
          alb: alb(),
          ec2a: ec2a([{ text: `×2 · cpu 58%`, tone: `green` }]),
          ec2b: ec2b([{ text: `×2 · cpu 61%`, tone: `green` }]),
          card: card(`target tracking`, [`ASG web-asg   min 2  desired 4  max 10`, `policy  ASGAverageCPUUtilization = 60`, `= cpu 82% → +2 instances (scale out)`], `gauge`),
        },
        links: { dns: links.dns, r53Alb: links.r53Alb, albA: links.albA, albB: links.albB },
        flows: [
          { route: [`dns`, `r53Alb`, `albA`], rate: 1.8, bounce: true },
          { route: [`dns`, `r53Alb`, `albB`], rate: 1.8, bounce: true },
        ],
      },
    },
    {
      short: `Multi-AZ DB`,
      chapter: `solution`,
      title: `The database needs a standby too`,
      body: [
        `Two AZs of app servers don’t help if the single database dies. <span class="term">RDS Multi-AZ</span> keeps a standby in the other AZ and replicates every write <b>synchronously</b> before acknowledging it.`,
        `Apps use one DNS endpoint. The standby serves no traffic — it exists only to take over.`,
      ],
      callout: { kind: `tip`, text: `Multi-AZ is for availability; read replicas (async) are for read scaling. Different tools.` },
      changes: [`+ RDS primary (AZ-a)`, `+ standby (AZ-b), sync replication`],
      metrics: { routing: `primary`, healthy: `4 / 4`, capacity: `4`, database: `Multi-AZ`, rto: `—` },
      scene: {
        entities: { ...region(), r53: r53(), alb: alb(), ec2a: ec2a(), ec2b: ec2b(), dbP: dbP(), dbS: dbS() },
        links: { dns: links.dns, r53Alb: links.r53Alb, albA: links.albA, albB: links.albB, aDb: links.aDb, bDb: links.bDb, sync: links.sync },
        flows: [
          { route: [`dns`, `r53Alb`, `albA`, `aDb`], rate: 1.2, bounce: true },
          { route: [`dns`, `r53Alb`, `albB`, `bDb`], rate: 1.2, bounce: true },
          { route: [`sync`], kind: `write`, rate: 1.4 },
        ],
      },
    },
    {
      short: `AZ fails`,
      chapter: `problem`,
      title: `AZ-a goes dark`,
      body: [
        `Power fails in AZ-a. ALB health checks mark its targets unhealthy and stop sending them traffic within seconds — users keep being served by AZ-b.`,
        `RDS fails over: the standby is promoted and the same DNS endpoint now points at it (typically 60–120 s). The ASG launches replacement instances in the healthy AZ.`,
      ],
      callout: { kind: `warn`, text: `Size for N−1: with 2 AZs, each must handle 100% of the load during an AZ outage.` },
      changes: [`− AZ-a instances + primary down`, `~ standby promoted`, `~ ASG rebalances into AZ-b`],
      metrics: { routing: `primary`, healthy: `2 / 4`, capacity: `rebalancing`, database: `promoted`, rto: `~90 s` },
      scene: {
        entities: {
          ...region(),
          r53: r53(),
          alb: alb(),
          ec2a: ec2a([{ text: `AZ down`, tone: `red`, icon: `alert` }], { dead: 1, heat: 0 }),
          ec2b: ec2b([{ text: `×4 · cpu 71%`, tone: `amber` }]),
          dbP: dbP([], { dead: 1 }),
          dbS: dbS([{ text: `promoted`, tone: `green`, icon: `check` }]),
        },
        links: { dns: links.dns, r53Alb: links.r53Alb, albA: links.albA, albB: links.albB, bDbS: links.bDbS, sync: links.syncQuiet },
        flows: [
          { route: [`dns`, `r53Alb`, `albB`, `bDbS`], rate: 2, bounce: true },
          { route: [`albA`], kind: `fail`, rate: 0.6 },
        ],
      },
    },
    {
      short: `DR tiers`,
      chapter: `tradeoff`,
      title: `Planning for a whole Region`,
      body: [
        `Multi-AZ doesn’t survive a Regional outage. You pick a <span class="term">DR strategy</span> by two numbers: <b>RPO</b> (how much data you may lose) and <b>RTO</b> (how long you may be down).`,
        `Here we run <b>warm standby</b> in us-west-2: a small copy of the stack is always on, and the database is replicated continuously. Route 53 keeps it as the failover target.`,
      ],
      callout: { kind: `insight`, text: `Pilot light = only data replicated, compute off. Warm standby = a scaled-down stack already running.` },
      changes: [`+ DR stack + Aurora global secondary (us-west-2)`, `+ Route 53 secondary record`],
      metrics: { routing: `primary`, healthy: `4 / 4`, capacity: `4 + 1 DR`, database: `global async`, rto: `minutes` },
      scene: {
        entities: {
          ...region(),
          drRegion: drRegion(),
          r53: r53(),
          alb: alb(),
          ec2a: ec2a(),
          ec2b: ec2b(),
          dbP: dbP(),
          dbS: dbS(),
          drApp: drApp([{ text: `warm standby`, tone: `amber` }]),
          drDb: drDb(),
          card: card(
            `Failover record`,
            [`$ aws route53 change-resource-record-sets --hosted-zone-id Z1 --change-batch file://failover.json`, `{ "SetIdentifier": "eu", "Failover": "PRIMARY",   "HealthCheckId": "hc-eu" }`, `{ "SetIdentifier": "us", "Failover": "SECONDARY", "AliasTarget": "dr-alb" }`, `= warm standby: us-east-1 takes over when the eu health check fails`],
            `chart`,
          ),
        },
        links: {
          dns: links.dns,
          r53Alb: links.r53Alb,
          albA: links.albA,
          albB: links.albB,
          aDb: links.aDb,
          bDb: links.bDb,
          sync: links.syncQuiet,
          global: links.global,
          r53Dr: links.r53Dr,
          drDbLink: links.drDbLink,
        },
        flows: [
          { route: [`dns`, `r53Alb`, `albB`, `bDb`], rate: 1, bounce: true },
          { route: [`global`], kind: `write`, rate: 1.2 },
        ],
      },
    },
    {
      short: `Global`,
      chapter: `solution`,
      title: `Region down: promote the secondary`,
      body: [
        `us-east-1 is unreachable. Route 53’s health check fails and it starts answering with the DR stack. <span class="term">Aurora Global Database</span> promotes the us-west-2 cluster to read-write in under a minute.`,
        `Storage-level replication kept lag under a second, so almost nothing is lost. The warm standby scales out to full size.`,
      ],
      callout: { kind: `insight`, text: `Managed planned failover keeps RPO = 0; an unplanned failover promotes the secondary in under a minute.` },
      changes: [`− us-east-1 unreachable`, `~ Route 53 → DR stack`, `~ Aurora secondary promoted`],
      metrics: { routing: `secondary`, healthy: `DR 3 / 3`, capacity: `DR ×3`, database: `us-west-2`, rto: `< 60 s` },
      scene: {
        entities: {
          ...region(),
          drRegion: drRegion(),
          r53: r53([{ text: `primary ✕`, tone: `red` }]),
          alb: alb(),
          ec2a: ec2a([], { dead: 1 }),
          ec2b: ec2b([], { dead: 1 }),
          dbP: dbP([], { dead: 1 }),
          dbS: dbS([], { dead: 1 }),
          drApp: drApp([{ text: `scaled out`, tone: `green` }]),
          drDb: drDb([{ text: `promoted · RW`, tone: `green`, icon: `check` }]),
          card: card(
            `aws cli`,
            [`$ aws rds failover-global-cluster \\`, `    --global-cluster-identifier prod-global \\`, `    --target-db-cluster-identifier arn:…:us-west-2:prod`],
            `keyboard`,
          ),
        },
        links: { dns: links.dns, r53Alb: links.r53Alb, albA: links.albA, albB: links.albB, sync: links.syncQuiet, r53Dr: links.r53DrLive, drDbLink: links.drDbLink },
        flows: [
          { route: [`dns`, `r53Dr`, `drDbLink`], rate: 1.8, bounce: true },
          { route: [`r53Alb`], kind: `fail`, rate: 0.5 },
        ],
      },
    },
  ],
};

export default awsHaLesson;
