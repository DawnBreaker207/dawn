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
} from '@/lib/simulator/scene-builders';

// ============================================================================
// AWS CLOUD MULTI-AZ RESILIENCE
// ============================================================================
export const awsCloudLesson = {
    id: `aws-cloud`,
    title: `AWS Cloud Multi-AZ Resilience`,
    summary: `Explore how a fault-tolerant AWS architecture handles traffic, auto-scales across AZs, and self-heals when a full data center goes dark.`,
    minutes: 12,
    level: `intermediate`,
    metrics: [`dns`, `connect`, `az_health`, `ecs_tasks`, `aurora_lag`],
    legend: [`req`, `res`, [`ping`, `health check`], `fail`],
    goals: [
      { text: `Single AZ fragility: why 1 instance in 1 AZ is a single point of failure`, step: 1 },
      { text: `Route 53 & CloudFront Edge caching for global reach`, step: 2 },
      { text: `Application Load Balancer health checking across multiple AZs`, step: 3 },
      { text: `Multi-AZ ECS Fargate auto-scaling and Redis caching`, step: 4 },
      { text: `Amazon Aurora Multi-AZ replication and sub-30s failover`, step: 5 },
      { text: `Disaster test: Kill AZ-1a and watch seamless self-healing`, step: 7 },
    ],
    steps: [
      {
        short: `Single AZ`,
        chapter: `problem`,
        title: `The Single Point of Failure (Single-AZ)`,
        body: [
          `A single EC2 instance and a single MySQL database live in one Availability Zone (<code>us-east-1a</code>).`,
          `If a power outage, fiber cut, or hardware failure hits that zone, the entire application goes completely dark with zero automated recovery.`,
        ],
        callout: {
          kind: `warn`,
          text: `Never run production workloads in a single Availability Zone. Even high-grade AWS data centers experience periodic local disruptions.`,
        },
        changes: [
          `+ Single EC2 instance in us-east-1a`,
          `+ Single MySQL database`,
          `! High downtime risk`,
        ],
        metrics: {
          dns: `15 ms`,
          connect: `42 ms`,
          az_health: `100%`,
          ecs_tasks: `1 task`,
          aurora_lag: `—`,
        },
        scene: {
          entities: {
            client: y(-6, -4, {
              label: `users`,
              tags: [{ text: `https://app.io`, icon: `globe` }],
            }),
            ec2: d(0, 0, {
              color: `yellow`,
              glyph: `server`,
              label: [`EC2`, `us-east-1a`],
              cpu: 0.85,
            }),
            db: b(6, 4, { label: `MySQL Single`, cpu: 0.6 }),
          },
          links: {
            c1: h(`client`, `ec2`, [`client`, `ec2`], { label: `Direct Traffic`, heads: `both` }),
            d1: h(`ec2`, `db`, [`ec2`, `db`], { label: `Read/Write`, heads: `both` }),
          },
          flows: [{ route: [`c1`, `d1`], bounce: !0, rate: 1 }],
        },
      },
      {
        short: `Edge Layer`,
        chapter: `technique`,
        title: `Global Edge: Route 53 & CloudFront`,
        body: [
          `To shield our compute and lower latency worldwide, we introduce <b>Amazon Route 53</b> (Anycast DNS) and <b>Amazon CloudFront</b> (CDN Edge).`,
          `CloudFront caches static assets and terminates TLS near the user, cutting round-trip time from 85 ms down to <b>18 ms</b> for cached hits.`,
        ],
        callout: {
          kind: `tip`,
          text: `CloudFront edge locations serve ~80% of read traffic without hitting the origin servers in your VPC.`,
        },
        changes: [
          `+ Route 53 DNS with Latency Routing`,
          `+ CloudFront CDN Edge Distribution`,
          `+ TTFB drops to 18 ms`,
        ],
        metrics: {
          dns: `10 ms`,
          connect: `18 ms`,
          az_health: `100%`,
          ecs_tasks: `1 task`,
          aurora_lag: `—`,
        },
        scene: {
          entities: {
            client: y(-6, -4, { label: `users`, tags: [{ text: `global edge`, icon: `globe` }] }),
            r53: d(-2, -2, {
              color: `yellow`,
              glyph: `globe`,
              label: [`Route 53`],
              sub: `Latency Routing`,
            }),
            cf: d(2, -1, {
              color: `purple`,
              glyph: `shield`,
              label: [`CloudFront`],
              sub: `Edge Cache`,
            }),
            ec2: d(6, 2, { color: `blue`, glyph: `server`, label: [`Origin VPC`], cpu: 0.35 }),
          },
          links: {
            dns: h(`client`, `r53`, [`client`, `r53`], { label: `DNS Query`, heads: `both` }),
            edge: h(`client`, `cf`, [`client`, `cf`], { label: `HTTPS / TLS 1.3`, heads: `both` }),
            origin: h(`cf`, `ec2`, [`cf`, `ec2`], { label: `Origin Fetch`, heads: `both` }),
          },
          flows: [{ route: [`edge`], bounce: !0, rate: 1.5 }],
        },
      },
      {
        short: `Dual-AZ ALB`,
        chapter: `technique`,
        title: `Application Load Balancer across AZs`,
        body: [
          `We deploy an <b>Application Load Balancer (ALB)</b> with nodes in both <code>us-east-1a</code> and <code>us-east-1b</code>.`,
          `The ALB automatically routes incoming HTTP requests to healthy compute instances and performs active health checking every 5 seconds.`,
        ],
        changes: [
          `+ Dual-AZ Application Load Balancer`,
          `+ Layer 7 path-based routing`,
          `+ Continuous health checking`,
        ],
        metrics: {
          dns: `10 ms`,
          connect: `20 ms`,
          az_health: `100%`,
          ecs_tasks: `2 tasks`,
          aurora_lag: `—`,
        },
        scene: {
          entities: {
            client: y(-6, -4, { label: `users` }),
            alb: f(-2, 0, { color: `orange`, glyph: `balancer`, label: [`ALB`, `Dual-AZ`] }),
            srv_a: d(4, -3, {
              color: `blue`,
              glyph: `server`,
              label: [`Target AZ-1a`],
              cpu: 0.25,
            }),
            srv_b: d(4, 3, { color: `blue`, glyph: `server`, label: [`Target AZ-1b`], cpu: 0.25 }),
          },
          links: {
            in: h(`client`, `alb`, [`client`, `alb`], { label: `HTTPS`, heads: `both` }),
            t_a: h(`alb`, `srv_a`, [`alb`, `srv_a`], { label: `HTTP /health`, heads: `both` }),
            t_b: h(`alb`, `srv_b`, [`alb`, `srv_b`], { label: `HTTP /health`, heads: `both` }),
          },
          flows: [
            { route: [`in`, `t_a`], bounce: !0, rate: 0.9 },
            { route: [`in`, `t_b`], bounce: !0, rate: 0.9 },
          ],
        },
      },
      {
        short: `ECS Auto-scale`,
        chapter: `technique`,
        title: `Stateless ECS Fargate Containers`,
        body: [
          `Instead of fixed virtual machines, we run containerized microservices on <b>AWS ECS Fargate</b>.`,
          `Tasks are stateless: if traffic surges, the Auto Scaling policy spins up additional tasks in seconds across both AZs without human intervention.`,
        ],
        callout: {
          kind: `tip`,
          text: `Spreading tasks evenly across AZs ensures that losing one zone never cuts compute capacity by more than 50%.`,
        },
        changes: [
          `+ ECS Fargate Serverless Cluster`,
          `+ Target Tracking Auto-Scaling`,
          `+ 4 Container Tasks balanced`,
        ],
        metrics: {
          dns: `10 ms`,
          connect: `20 ms`,
          az_health: `100%`,
          ecs_tasks: `4 tasks`,
          aurora_lag: `—`,
        },
        scene: {
          entities: {
            alb: f(-4, 0, { color: `orange`, glyph: `balancer`, label: [`ALB`, `Dual-AZ`] }),
            ecs1: d(2, -4, { color: `blue`, glyph: `server`, label: [`ECS-1 (AZ-a)`], cpu: 0.3 }),
            ecs2: d(2, -1, { color: `blue`, glyph: `server`, label: [`ECS-2 (AZ-a)`], cpu: 0.3 }),
            ecs3: d(2, 2, { color: `blue`, glyph: `server`, label: [`ECS-3 (AZ-b)`], cpu: 0.3 }),
            ecs4: d(2, 5, { color: `blue`, glyph: `server`, label: [`ECS-4 (AZ-b)`], cpu: 0.3 }),
          },
          links: {
            l1: h(`alb`, `ecs1`, [`alb`, `ecs1`]),
            l2: h(`alb`, `ecs2`, [`alb`, `ecs2`]),
            l3: h(`alb`, `ecs3`, [`alb`, `ecs3`]),
            l4: h(`alb`, `ecs4`, [`alb`, `ecs4`]),
          },
          flows: [
            { route: [`l1`], bounce: !0, rate: 0.8 },
            { route: [`l3`], bounce: !0, rate: 0.8 },
          ],
        },
      },
      {
        short: `Redis Cache`,
        chapter: `technique`,
        title: `ElastiCache Redis Caching Layer`,
        body: [
          `Before queries hit disk, containers check <b>Amazon ElastiCache Redis</b>.`,
          `Hot product catalog and session data return in <b>sub-millisecond (<1 ms)</b> latency, relieving database strain by 85%.`,
        ],
        changes: [
          `+ ElastiCache Redis Primary in AZ-1a`,
          `+ Redis Read Replica in AZ-1b`,
          `+ 85% cache hit ratio`,
        ],
        metrics: {
          dns: `10 ms`,
          connect: `20 ms`,
          az_health: `100%`,
          ecs_tasks: `4 tasks`,
          aurora_lag: `< 1 ms`,
        },
        scene: {
          entities: {
            ecs_a: d(-4, -2, { color: `blue`, glyph: `server`, label: [`ECS Cluster`, `AZ-1a`] }),
            ecs_b: d(-4, 2, { color: `blue`, glyph: `server`, label: [`ECS Cluster`, `AZ-1b`] }),
            redis_p: d(4, -2, { color: `green`, glyph: `zap`, label: [`Redis Master`, `AZ-1a`] }),
            redis_r: d(4, 2, { color: `green`, glyph: `zap`, label: [`Redis Replica`, `AZ-1b`] }),
          },
          links: {
            r1: h(`ecs_a`, `redis_p`, [`ecs_a`, `redis_p`], {
              label: `GET /hot-key (<1ms)`,
              heads: `both`,
            }),
            r2: h(`ecs_b`, `redis_r`, [`ecs_b`, `redis_r`], { label: `Read Cache`, heads: `both` }),
            sync: h(`redis_p`, `redis_r`, [`redis_p`, `redis_r`], {
              label: `Replication`,
              style: `dashed`,
            }),
          },
          flows: [
            { route: [`r1`], bounce: !0, rate: 1.2 },
            { route: [`r2`], bounce: !0, rate: 1.2 },
          ],
        },
      },
      {
        short: `Aurora Multi-AZ`,
        chapter: `technique`,
        title: `Amazon Aurora Multi-AZ Cluster`,
        body: [
          `For durable relational storage, we deploy <b>Amazon Aurora PostgreSQL</b> with a Primary Writer in AZ-1a and an Aurora Replica in AZ-1b.`,
          `Aurora maintains <b>6 copies of data across 3 AZs</b> at the storage layer. Replication lag to the read replica is virtually zero (<10 ms).`,
        ],
        callout: {
          kind: `insight`,
          text: `Unlike standard RDS MySQL which replicates via binary logs, Aurora uses a distributed log-structured storage volume spanning 3 AZs.`,
        },
        changes: [
          `+ Aurora Primary Writer (AZ-1a)`,
          `+ Aurora Read Replica (AZ-1b)`,
          `+ 6-way distributed SSD storage`,
        ],
        metrics: {
          dns: `10 ms`,
          connect: `20 ms`,
          az_health: `100%`,
          ecs_tasks: `4 tasks`,
          aurora_lag: `8 ms`,
        },
        scene: {
          entities: {
            ecs_a: d(-4, -2, { color: `blue`, glyph: `server`, label: [`ECS AZ-1a`] }),
            ecs_b: d(-4, 2, { color: `blue`, glyph: `server`, label: [`ECS AZ-1b`] }),
            db_p: b(4, -2, {
              label: `Aurora Writer`,
              cpu: 0.35,
              tags: [{ text: `Primary`, tone: `green` }],
            }),
            db_r: b(4, 2, {
              label: `Aurora Replica`,
              cpu: 0.2,
              tags: [{ text: `Standby`, tone: `blue` }],
            }),
          },
          links: {
            w1: h(`ecs_a`, `db_p`, [`ecs_a`, `db_p`], { label: `INSERT / UPDATE`, heads: `both` }),
            r1: h(`ecs_b`, `db_r`, [`ecs_b`, `db_r`], { label: `SELECT read-only`, heads: `both` }),
            aurora_sync: h(`db_p`, `db_r`, [`db_p`, `db_r`], {
              label: `Shared Storage (6-way)`,
              heads: `both`,
            }),
          },
          flows: [
            { route: [`w1`], bounce: !0, rate: 0.9 },
            { route: [`r1`], bounce: !0, rate: 1.1 },
          ],
        },
      },
      {
        short: `AZ Outage!`,
        chapter: `problem`,
        title: `Disaster Simulation: AZ-1a Goes Down`,
        body: [
          `<b>DISASTER STRIKES!</b> An unexpected power grid failure takes down the entire <code>us-east-1a</code> data center.`,
          `All compute tasks and the primary database in AZ-1a lose network connectivity instantly.`,
        ],
        callout: {
          kind: `warn`,
          text: `Notice that traffic to AZ-1b is unaffected! The ALB immediately begins draining unhealthy targets.`,
        },
        changes: [
          `! us-east-1a OFFLINE (Power Cut)`,
          `! ECS AZ-1a unhealthy`,
          `! Primary DB unreachable`,
        ],
        metrics: {
          dns: `10 ms`,
          connect: `24 ms`,
          az_health: `50% (AZ-a DOWN)`,
          ecs_tasks: `2 tasks`,
          aurora_lag: `Failover…`,
        },
        scene: {
          entities: {
            alb: f(-4, 0, { color: `orange`, glyph: `balancer`, label: [`ALB`, `Dual-AZ`] }),
            ecs_a: d(0, -3, {
              color: `slab`,
              glyph: `skull`,
              dead: 1,
              label: [`ECS AZ-1a (DOWN)`],
              tags: [{ text: `DOWN`, tone: `red`, icon: `alert` }],
            }),
            ecs_b: d(0, 3, {
              color: `blue`,
              glyph: `server`,
              label: [`ECS AZ-1b (HEALTHY)`],
              cpu: 0.75,
            }),
            db_a: b(6, -3, {
              label: `Writer AZ-a (DOWN)`,
              dead: 1,
              heat: 0.9,
              tags: [{ text: `FAILED`, tone: `red` }],
            }),
            db_b: b(6, 3, {
              label: `Replica AZ-b`,
              tags: [{ text: `Promoting…`, tone: `amber` }],
            }),
          },
          links: {
            fail_link: h(`alb`, `ecs_a`, [`alb`, `ecs_a`], {
              style: `off`,
              label: `Connection timeout`,
            }),
            live_link: h(`alb`, `ecs_b`, [`alb`, `ecs_b`], {
              label: `Active Route`,
              heads: `both`,
            }),
          },
          flows: [{ route: [`live_link`], bounce: !0, rate: 1.8 }],
        },
      },
      {
        short: `Auto-Healing`,
        chapter: `solution`,
        title: `Automated Failover & Recovery`,
        body: [
          `Watch the architecture self-heal in real-time without human intervention:`,
          `1. <b>ALB</b> redirects 100% of user traffic to AZ-1b.<br/>2. <b>ECS Auto Scaling</b> detects high CPU on AZ-1b tasks and rapidly spins up 2 replacement tasks in AZ-1b.<br/>3. <b>Aurora</b> promotes the standby replica in AZ-1b to the new Primary Writer in under <b>25 seconds</b>. Zero data loss!`,
        ],
        callout: {
          kind: `tip`,
          text: `RTO (Recovery Time Objective) < 30 seconds. RPO (Recovery Point Objective) = 0 seconds.`,
        },
        changes: [
          `+ Aurora AZ-1b promoted to Writer in 24s`,
          `+ ECS AZ-1b scaled out to 4 tasks`,
          `+ 100% traffic serving normally`,
        ],
        metrics: {
          dns: `10 ms`,
          connect: `20 ms`,
          az_health: `Resilient on AZ-b`,
          ecs_tasks: `4 tasks in AZ-b`,
          aurora_lag: `0 ms (New Master)`,
        },
        scene: {
          entities: {
            client: y(-6, -4, {
              label: `users`,
              tags: [{ text: `0 downtime`, tone: `green`, icon: `check` }],
            }),
            alb: f(-2, 0, { color: `orange`, glyph: `balancer`, label: [`ALB`, `Healthy`] }),
            ecs_b1: d(2, 0, {
              color: `blue`,
              glyph: `server`,
              label: [`ECS AZ-b (#1)`],
              cpu: 0.35,
            }),
            ecs_b2: d(2, 4, {
              color: `blue`,
              glyph: `server`,
              label: [`ECS AZ-b (#2)`],
              cpu: 0.35,
            }),
            db_b: b(6, 2, {
              label: `Aurora New Writer`,
              cpu: 0.4,
              tags: [{ text: `PRIMARY WRITER`, tone: `green` }],
            }),
          },
          links: {
            c: h(`client`, `alb`, [`client`, `alb`], { heads: `both` }),
            l1: h(`alb`, `ecs_b1`, [`alb`, `ecs_b1`], { heads: `both` }),
            l2: h(`alb`, `ecs_b2`, [`alb`, `ecs_b2`], { heads: `both` }),
            db_l: h(`ecs_b1`, `db_b`, [`ecs_b1`, `db_b`], { label: `Active R/W`, heads: `both` }),
          },
          flows: [
            { route: [`c`, `l1`, `db_l`], bounce: !0, rate: 1.4 },
            { route: [`c`, `l2`], bounce: !0, rate: 1 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `AWS Cloud Resilience Checklist`,
        body: [
          `<ul class="takeaways"><li><b>Multi-AZ VPC:</b> Always deploy subnets across at least 2 (preferably 3) Availability Zones.</li><li><b>Stateless Compute:</b> Keep sessions in Redis or JWT so any container in any AZ can serve any user.</li><li><b>Managed Aurora:</b> Leverage Aurora distributed storage for automated sub-30s failover with 0 data loss.</li><li><b>Edge Defense:</b> Terminate TLS and cache with CloudFront to absorb traffic surges and DDoS attacks.</li></ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next lab: <b>Microservices & Distributed Sagas</b> — learn how services communicate and rollback transactions.`,
        },
        metrics: {
          dns: `10 ms`,
          connect: `20 ms`,
          az_health: `100% Ready`,
          ecs_tasks: `Dynamic`,
          aurora_lag: `0 ms`,
        },
        scene: {
          entities: {
            client: y(-6, -4, { label: `users`, tags: [{ text: `resilient`, tone: `green` }] }),
            alb: f(-3, 0, { color: `orange`, glyph: `balancer`, label: [`ALB`, `Dual-AZ`] }),
            ecs_a: d(1, -3, { color: `blue`, glyph: `server`, label: [`ECS AZ-1a`] }),
            ecs_b: d(1, 3, { color: `blue`, glyph: `server`, label: [`ECS AZ-1b`] }),
            db_a: b(6, -3, { label: `Aurora Writer`, tags: [{ text: `Active`, tone: `green` }] }),
            db_b: b(6, 3, { label: `Aurora Standby`, tags: [{ text: `Replica`, tone: `blue` }] }),
          },
          links: {
            c: h(`client`, `alb`, [`client`, `alb`], { heads: `both` }),
            l_a: h(`alb`, `ecs_a`, [`alb`, `ecs_a`], { heads: `both` }),
            l_b: h(`alb`, `ecs_b`, [`alb`, `ecs_b`], { heads: `both` }),
            db_sync: h(`db_a`, `db_b`, [`db_a`, `db_b`], { label: `Storage Sync`, heads: `both` }),
          },
          flows: [
            { route: [`c`, `l_a`], bounce: !0, rate: 1 },
            { route: [`c`, `l_b`], bounce: !0, rate: 1 },
          ],
        },
      },
    ],
  };

export default awsCloudLesson;
