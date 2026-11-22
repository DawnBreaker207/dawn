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
// AWS SAA-C03: HIGH AVAILABILITY, AUTO SCALING & ROUTE 53
// ============================================================================
export const awsHaLesson = {
  id: `aws-ha`,
  title: `AWS High Availability & Disaster Recovery`,
  summary: `Multi-AZ resilience patterns: Route 53 health checks & routing policies, Cross-Zone ALB balancing, Auto Scaling Groups, and Disaster Recovery tiers.`,
  minutes: 15,
  level: `advanced`,
  metrics: [`dns`, `connect`, `az_active`, `asg_capacity`, `failover_sec`],
  legend: [`req`, `res`, [`ping`, `health probe`], `fail`],
  goals: [
    { text: `Route 53 Routing Policies: Latency, Weighted, Geolocation, and Failover`, step: 1 },
    { text: `Application Load Balancer (ALB) Cross-Zone Load Balancing`, step: 2 },
    { text: `Auto Scaling Groups (ASG): Target tracking, health checks, and cooldowns`, step: 3 },
    { text: `Simulated AZ Failure: Automated instance rebalancing and self-healing`, step: 4 },
    { text: `Disaster Recovery (DR) Tiers: Backup/Restore vs Pilot Light vs Warm Standby vs Multi-Region`, step: 5 },
  ],
  steps: [
    {
      short: `Route 53 Policies`,
      chapter: `technique`,
      title: `Amazon Route 53 Advanced Routing Policies`,
      body: [
        `Route 53 is a globally distributed, authoritative DNS service with 100% SLA.`,
        `Beyond simple A records, SAA-C03 requires mastery of:`,
        `• <strong>Latency-based Routing</strong>: Direct users to the AWS Region with lowest round-trip time.`,
        `• <strong>Geolocation Routing</strong>: Route by user country/continent (e.g. compliance/GDPR).`,
        `• <strong>Failover Routing (Active-Passive)</strong>: Health check queries Primary; if it fails, Route 53 flips DNS to Secondary (S3 static error page or DR region).`,
      ],
      callout: {
        kind: `insight`,
        text: `Route 53 Health Checks can monitor an endpoint, another health check (calculated), or an Amazon CloudWatch alarm.`,
      },
      changes: [
        `+ Hosted Zone registered`,
        `+ Failover Record: Primary us-east-1 (Weight 100)`,
        `+ Health Check attached to ALB DNS`,
      ],
      metrics: {
        dns: `11 ms`,
        connect: `24 ms`,
        az_active: `2 Regions`,
        asg_capacity: `6 Instances`,
        failover_sec: `15s`,
      },
      scene: {
        entities: {
          users: y(-12, -4, { label: `Global Users`, tags: [{ text: `DNS Query`, icon: `globe` }] }),
          r53: d(-2, -4, { color: `yellow`, glyph: `globe`, label: [`Route 53`, `Failover + Health`] }),
          reg_pri: d(10, -10, { color: `green`, glyph: `server`, label: [`Primary (us-east-1)`, `Healthy`] }),
          reg_sec: d(10, 2, { color: `orange`, glyph: `server`, label: [`DR (us-west-2)`, `Standby`] }),
        },
        links: {
          u_dns: h(`users`, `r53`, [`users`, `r53`], { heads: `both` }),
          dns_pri: h(`r53`, `reg_pri`, [`r53`, `reg_pri`], { heads: `both`, label: `Primary Route` }),
          dns_sec: h(`r53`, `reg_sec`, [`r53`, `reg_sec`], { heads: `none`, label: `Standby` }),
        },
        flows: [
          { route: [`u_dns`, `dns_pri`], bounce: true, rate: 2.2 },
        ],
      },
    },
    {
      short: `Cross-Zone ALB`,
      chapter: `technique`,
      title: `Application Load Balancer & Cross-Zone Balancing`,
      body: [
        `An Application Load Balancer distributes HTTP/HTTPS traffic at Layer 7 across multiple Availability Zones.`,
        `With <strong>Cross-Zone Load Balancing</strong> enabled (default for ALB), each load balancer node distributes traffic evenly across all registered targets in all enabled AZs, preventing unequal load distribution.`,
      ],
      callout: {
        kind: `tip`,
        text: `ALB provides Layer 7 capabilities: Path-based routing (/api vs /static), Host-based routing (app1.example.com vs app2), and native OIDC/Cognito authentication.`,
      },
      changes: [
        `+ Cross-Zone balancing active across 3 AZs`,
        `+ Target Group health check: HTTP 200 on /health`,
        `+ Deregistration delay (connection draining): 300s`,
      ],
      metrics: {
        dns: `10 ms`,
        connect: `20 ms`,
        az_active: `3 AZs (1a, 1b, 1c)`,
        asg_capacity: `6 Targets`,
        failover_sec: `Instant`,
      },
      scene: {
        entities: {
          alb: f(-8, -4, { color: `orange`, glyph: `balancer`, label: [`Public ALB`, `Cross-Zone ON`] }),
          az1: d(6, -12, { color: `teal`, glyph: `server`, label: [`EC2 (AZ-1a)`] }),
          az2: d(6, -4,  { color: `teal`, glyph: `server`, label: [`EC2 (AZ-1b)`] }),
          az3: d(6, 4,   { color: `teal`, glyph: `server`, label: [`EC2 (AZ-1c)`] }),
        },
        links: {
          l1: h(`alb`, `az1`, [`alb`, `az1`], { heads: `both` }),
          l2: h(`alb`, `az2`, [`alb`, `az2`], { heads: `both` }),
          l3: h(`alb`, `az3`, [`alb`, `az3`], { heads: `both` }),
        },
        flows: [
          { route: [`l1`], bounce: true, rate: 1.0 },
          { route: [`l2`], bounce: true, rate: 1.0 },
          { route: [`l3`], bounce: true, rate: 1.0 },
        ],
      },
    },
    {
      short: `Auto Scaling`,
      chapter: `technique`,
      title: `Auto Scaling Groups (ASG) & Dynamic Policies`,
      body: [
        `An Auto Scaling Group ensures the right number of EC2 instances or ECS tasks are running to handle load.`,
        `Three key parameters define the group: <code>Min = 2</code>, <code>Desired = 4</code>, <code>Max = 10</code>.`,
        `<strong>Target Tracking Policy</strong> maintains a metric (e.g. Average CPU Utilization = 60%, or ALB Request Count Per Target = 1000). The ASG scales out as traffic surges and scales in during quiet hours to save cost.`,
      ],
      callout: {
        kind: `insight`,
        text: `Always configure an EC2 Launch Template instead of legacy Launch Configurations. Launch Templates support versioning, T4g Graviton processors, and mixed On-Demand/Spot fleets.`,
      },
      changes: [
        `+ Launch Template v2 applied`,
        `+ Target Tracking: CPU @ 60%`,
        `+ Default cooldown: 300s`,
      ],
      metrics: {
        dns: `—`,
        connect: `4 ms`,
        az_active: `3 AZs`,
        asg_capacity: `Scale 2 → 8`,
        failover_sec: `60s boot`,
      },
      scene: {
        entities: {
          alb: f(-8, -4, { color: `orange`, glyph: `balancer`, label: [`ALB Fleet`] }),
          i1: d(6, -9, { color: `teal`,   glyph: `cpu`, label: [`EC2 Node 1`] }),
          i2: d(6, -3, { color: `teal`,   glyph: `cpu`, label: [`EC2 Node 2`] }),
          i3: d(6, 3,  { color: `yellow`, glyph: `cpu`, label: [`EC2 Node 3`], sub: `Scaled` }),
          i4: d(6, 9,  { color: `yellow`, glyph: `cpu`, label: [`EC2 Node 4`], sub: `Scaled` }),
        },
        links: {
          l1: h(`alb`, `i1`, [`alb`, `i1`], { heads: `both` }),
          l2: h(`alb`, `i2`, [`alb`, `i2`], { heads: `both` }),
          l3: h(`alb`, `i3`, [`alb`, `i3`], { heads: `both` }),
          l4: h(`alb`, `i4`, [`alb`, `i4`], { heads: `both` }),
        },
        flows: [
          { route: [`l1`, `l2`, `l3`, `l4`], bounce: true, rate: 2.0 },
        ],
      },
    },
    {
      short: `AZ Failover`,
      chapter: `technique`,
      title: `Simulated AZ Outage: Rebalancing & Self-Healing`,
      body: [
        `When an entire Availability Zone experiences a disruption, ALB health probes fail targets in the affected zone.`,
        `The ALB stops sending traffic to unhealthy nodes immediately, while ASG detects target group degradation and launches replacement instances in the remaining healthy AZs.`,
      ],
      callout: {
        kind: `tip`,
        text: `Cross-zone load balancing guarantees seamless zero-downtime traffic rerouting while ASG rebalances capacity.`,
      },
      changes: [
        `! AZ-1a marked UNHEALTHY (Power loss simulation)`,
        `+ ALB deregisters AZ-1a targets`,
        `+ ASG launches replacement EC2 in AZ-1b`,
      ],
      metrics: {
        dns: `—`,
        connect: `6 ms`,
        az_active: `AZ-1b, AZ-1c (AZ-1a Down)`,
        asg_capacity: `Rebalanced (4/4)`,
        failover_sec: `Instant ALB reroute`,
      },
      scene: {
        entities: {
          alb: f(-8, -4, { color: `orange`, glyph: `balancer`, label: [`ALB Fleet`] }),
          dead: d(6, -9, { color: `rose`, glyph: `alert`, label: [`AZ-1a EC2`], sub: `Unhealthy`, style: `dashed` }),
          alive1: d(6, 0, { color: `teal`, glyph: `cpu`, label: [`AZ-1b EC2`], sub: `Healthy` }),
          alive2: d(6, 9, { color: `green`, glyph: `cpu`, label: [`AZ-1c EC2`], sub: `Rebalanced` }),
        },
        links: {
          ld: h(`alb`, `dead`, [`alb`, `dead`], { heads: `none`, style: `dashed` }),
          l1: h(`alb`, `alive1`, [`alb`, `alive1`], { heads: `both` }),
          l2: h(`alb`, `alive2`, [`alb`, `alive2`], { heads: `both` }),
        },
        flows: [
          { route: [`l1`, `l2`], bounce: true, rate: 2.4 },
        ],
      },
    },
    {
      short: `Disaster Recovery`,
      chapter: `deep`,
      title: `The 4 AWS Disaster Recovery (DR) Strategies`,
      body: [
        `SAA-C03 questions frequently test trade-offs between RTO (Recovery Time Objective) and RPO (Recovery Point Objective):`,
        `1. <strong>Backup & Restore (High RTO/RPO, Lowest Cost)</strong>: Daily S3 backups, EBS snapshots copied to another region. Restore on disaster (~hours).`,
        `2. <strong>Pilot Light</strong>: Core data is replicated continuously to DR region; compute instances are off and only spun up when disaster strikes.`,
        `3. <strong>Warm Standby</strong>: A scaled-down but fully functional version of the system always runs in the DR region (~minutes to scale up).`,
        `4. <strong>Multi-Region Active-Active (Lowest RTO/RPO, Highest Cost)</strong>: Traffic served simultaneously by 2+ regions (Aurora Global DB + Route 53 latency routing).`,
      ],
      callout: {
        kind: `insight`,
        text: `RPO = How much data you can afford to lose (time between last backup and disaster). RTO = How much downtime you can afford before recovery.`,
      },
      changes: [
        `+ Aurora Global Database replication < 1s`,
        `+ Route 53 Health Check failover`,
        `+ Warm Standby active in us-west-2`,
      ],
      metrics: {
        dns: `12 ms`,
        connect: `28 ms`,
        az_active: `Multi-Region`,
        asg_capacity: `Warm Standby`,
        failover_sec: `Sub-minute`,
      },
      scene: {
        entities: {
          pri_region: d(-8, -4, { color: `green`, glyph: `server`, label: [`Primary`], sub: `us-east-1` }),
          sec_region: d(8, 4, { color: `yellow`, glyph: `server`, label: [`Warm Standby`], sub: `us-west-2` }),
        },
        links: {
          rep: h(`pri_region`, `sec_region`, [`pri_region`, `sec_region`], { heads: `end`, label: `Continuous DB Sync (RPO < 1s)` }),
        },
        flows: [
          { route: [`rep`], bounce: false, rate: 2.0 },
        ],
      },
    },
  ],
};

export default awsHaLesson;
