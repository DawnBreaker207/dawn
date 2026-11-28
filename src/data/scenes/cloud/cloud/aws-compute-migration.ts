import { STAGE, codeCard, linkOf, makeDb, stageBlock, distinctConcepts, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage: demand on the left, the compute/DR/migration piece in the middle (same id, new
// label each act), what it runs or protects on the right, a helper above and an alternative beside.
//
//                helper             alt
//   demand ──── subject ────────── target

const demand = (label: string[], sub: string, tags: Tag[] = [], glyph = `users`) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph, label, sub, tags });
const subject = (label: string[], sub: string, tags: Tag[] = [], glyph = `server`) =>
  stageBlock(STAGE.main, { color: `green`, glyph, label, sub, tags });
const target = (label: string, tags: Tag[] = []) =>
  makeDb(STAGE.store.x, STAGE.store.y, { r: 2.2, h: 46, glyph: `database`, label, tags });
const helper = (label: string[], sub: string, glyph: string, tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph, label, sub, tags });
const alt = (label: string[], sub: string, tags: Tag[] = [], glyph = `route`) =>
  stageBlock(STAGE.alt, { color: `slab`, glyph, label, sub, tags });

const links = {
  ask: (label?: string) => linkOf(`demand`, `subject`, label),
  run: (label?: string) => linkOf(`subject`, `target`, label),
  help: (label?: string) => ({ ...linkOf(`helper`, `subject`, label, false), labelAt: 0.6 }),
};

export const awsComputeMigrationLesson: Lesson = distinctConcepts({
  id: 'aws-compute-migration',
  title: 'Compute Pricing, LB Tiers, DR (RTO/RPO) & Migration',
  summary:
    'Choosing and paying for compute, picking the right load balancer, sizing disaster recovery by RTO and RPO, automating backups, moving data and databases into AWS, and observing it all.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['choice', 'cost', 'recovery', 'effort'],
  legend: [[`req`, `request`], [`write`, `copy / replicate`], [`fail`, `outage`]],
  goals: [
    { text: 'Choose On-Demand, Savings Plans or Spot', step: 1 },
    { text: 'Pick ALB, NLB or GWLB for the traffic', step: 2 },
    { text: 'Compare the four DR tiers by RTO and RPO', step: 3 },
    { text: 'Automate cross-Region backups', step: 4 },
    { text: 'Migrate databases and bulk data with DMS, DataSync, Snowball', step: 5 },
    { text: 'Audit and trace with CloudTrail, Flow Logs and X-Ray', step: 6 },
  ],
  steps: [
    {
      short: 'EC2 pricing',
      chapter: 'setup',
      title: 'Same instance, three ways to pay',
      body: [
        `<b>On-Demand</b> is pay-per-second with no commitment — the baseline and the most expensive. A <span class="term">Savings Plan</span> commits to a spend per hour for 1 or 3 years in return for up to ~70% off, and keeps flexibility across instance types.`,
        `<span class="term">Spot</span> uses spare capacity at up to ~90% off, but AWS may reclaim it with a two-minute warning — fine for stateless batch, CI and fault-tolerant workers. Typical mix: Savings Plan for the steady base, On-Demand for the unknown, Spot for the flexible.`,
      ],
      metrics: { choice: 'mix 3 models', cost: '−40% blended', recovery: 'n/a', effort: 'low' },
      scene: {
        entities: {
          demand: demand([`workload`], `steady + bursts`, [{ text: `70% steady`, tone: `green` }]),
          subject: subject([`EC2`, `fleet`], `m6i.large`, [{ text: `On-Demand $0.096/h`, tone: `amber` }]),
          target: target(`monthly bill`, [{ text: `target −40%`, tone: `green` }]),
          helper: helper([`Savings`, `Plan`], `1 yr · $/hour`, `dollar`, [{ text: `up to −70%`, tone: `green` }]),
          alt: alt([`Spot`], `2-min warning`, [{ text: `up to −90%`, tone: `violet` }], `zap`),
          card: codeCard(`A sensible mix`, [`steady base     → Savings Plan   (commit $/hr)`, `unknown peaks   → On-Demand`, `batch · CI       → Spot           (interruptible)`]),
        },
        links: { ask: links.ask(`needs`), run: links.run(`bills`), help: links.help(`discounts`) },
        flows: [{ route: ['ask'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'ALB · NLB',
      chapter: 'technique',
      title: 'Three load balancers, three layers',
      body: [
        `<b>ALB</b> works at layer 7: HTTP/HTTPS, host and path routing, WebSockets, gRPC, auth integration — the default for web apps. <b>NLB</b> works at layer 4: TCP/UDP/TLS, millions of requests per second, ultra-low latency, a <em>static IP</em> per AZ.`,
        `<b>GWLB</b> works at layer 3: it sends traffic transparently through fleets of third-party appliances (firewalls, inspection) using GENEVE on port 6081. Pick by need: routing logic (ALB), raw speed or fixed IPs (NLB), inline appliances (GWLB).`,
      ],
      changes: [`~ subject: ALB`, `+ NLB alt`, `+ GWLB`],
      metrics: { choice: 'by layer', cost: '$0.0225 / hr + LCU', recovery: 'multi-AZ', effort: 'low' },
      scene: {
        entities: {
          demand: demand([`clients`], `web + mobile`, [{ text: `HTTPS`, tone: `gray` }]),
          subject: subject([`ALB`], `L7 · path routing`, [{ text: `/api → api · / → web`, tone: `violet` }], `balancer`),
          target: target(`target groups`, [{ text: `ECS · Lambda · EC2`, tone: `gray` }]),
          helper: helper([`GWLB`], `L3 · appliances`, `shield`, [{ text: `GENEVE 6081`, tone: `gray` }]),
          alt: alt([`NLB`], `L4 · static IP`, [{ text: `millions rps`, tone: `green`, icon: `zap` }], `network`),
          card: codeCard(`Pick by need`, [`ALB  host/path rules, auth, WebSockets, gRPC`, `NLB  TCP/UDP/TLS, static Elastic IP, PrivateLink target`, `GWLB inline firewalls / IDS (transparent L3)`]),
        },
        links: { ask: links.ask(`HTTPS`), run: links.run(`routes`), help: links.help(`inspects`) },
        flows: [{ route: ['ask', 'run'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'DR tiers',
      chapter: 'insight',
      title: 'RTO and RPO set the DR budget',
      body: [
        `<span class="term">RTO</span> is how long you can be down; <span class="term">RPO</span> is how much recent data you can lose. Tighter numbers cost more. Four strategies, cheapest first: <b>backup &amp; restore</b> (hours), <b>pilot light</b> (tens of minutes), <b>warm standby</b> (minutes), <b>multi-site active/active</b> (near zero).`,
        `Each step up keeps more of the second Region running: from backups only, to a minimal core (database replicating), to a scaled-down full copy, to a full copy serving traffic. Match the tier to the business cost of an hour of downtime.`,
      ],
      changes: [`~ subject: primary Region`, `+ DR Region`, `+ tier alt`],
      metrics: { choice: '4 tiers', cost: '$ → $$$$', recovery: 'hours → ~0', effort: 'rising' },
      scene: {
        entities: {
          demand: demand([`users`], `eu-west-1 down`, [{ text: `outage`, tone: `red`, icon: `alert` }]),
          subject: subject([`Primary`, `Region`], `eu-west-1`, [{ text: `unavailable`, tone: `red` }], `building`),
          target: target(`DR Region`, [{ text: `us-east-1`, tone: `green` }]),
          helper: helper([`Route 53`], `failover routing`, `globe`, [{ text: `health check ✗`, tone: `amber` }]),
          alt: alt([`Warm`, `standby`], `RTO ~ minutes`, [{ text: `RPO ~ seconds`, tone: `violet` }], `copy`),
          card: codeCard(`The four tiers`, [`backup & restore   RTO hours   RPO hours`, `pilot light        RTO ~30 min  RPO minutes`, `warm standby       RTO minutes  RPO seconds`, `multi-site         RTO ≈ 0      RPO ≈ 0   ($$$$)`]),
        },
        links: { ask: links.ask(`fails`), run: links.run(`fail over`), help: links.help(`switches`) },
        flows: [{ route: ['ask'], kind: 'fail', rate: 1, bounce: true }, { route: ['run'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'Backup',
      chapter: 'solution',
      title: 'AWS Backup: policy-driven, cross-Region',
      body: [
        `<span class="term">AWS Backup</span> replaces per-service backup scripts with one policy: which resources (by tag), how often, how long to keep, and where to copy. It covers EBS, RDS, DynamoDB, EFS, S3 and more from a single console.`,
        `Add a <b>cross-Region copy</b> rule so a regional failure leaves restorable data elsewhere, and a <b>vault lock</b> to make backups tamper-proof. Test restores — an untested backup is a hope, not a plan.`,
      ],
      changes: [`+ AWS Backup plan`, `+ cross-Region copy`, `+ vault lock`],
      metrics: { choice: 'one policy', cost: '$0.05 / GB mo', recovery: 'RPO = schedule', effort: 'low' },
      scene: {
        entities: {
          demand: demand([`tagged`, `resources`], `backup=daily`, [{ text: `EBS · RDS · EFS`, tone: `gray` }], `database`),
          subject: subject([`AWS Backup`], `plan + vault`, [{ text: `daily · keep 35 d`, tone: `violet` }], `shield`),
          target: target(`DR vault`, [{ text: `us-east-1 copy`, tone: `green` }]),
          helper: helper([`Vault Lock`], `WORM`, `lock`, [{ text: `cannot delete`, tone: `green` }]),
          alt: alt([`primary`, `vault`], `eu-west-1`, [{ text: `35-day retention`, tone: `gray` }], `database`),
          card: codeCard(`A backup rule`, [`{ "RuleName": "daily", "ScheduleExpression": "cron(0 3 * * ? *)",`, `  "Lifecycle": { "DeleteAfterDays": 35 },`, `  "CopyActions": [{ "DestinationBackupVaultArn": "arn:aws:backup:us-east-1:…:dr-vault" }] }`]),
        },
        links: { ask: links.ask(`protects`), run: links.run(`copies`), help: links.help(`locks`) },
        flows: [{ route: ['run'], kind: 'write', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Migration',
      chapter: 'technique',
      title: 'Moving in: DMS, DataSync and Snowball',
      body: [
        `<b>Database Migration Service</b> copies a live database to AWS and keeps it in sync (change data capture) so cutover is minutes of downtime; use the Schema Conversion Tool for engine changes (Oracle to Aurora). <b>DataSync</b> moves files over the network — NFS/SMB to S3, EFS or FSx — with scheduling and verification.`,
        `When the network is the limit (tens of terabytes or more, slow link), <b>Snowball Edge</b> devices are shipped to you, filled offline and returned. Rule of thumb: if the transfer would take over a week online, ship a device.`,
      ],
      changes: [`~ subject: DMS`, `+ DataSync alt`, `+ Snowball`],
      metrics: { choice: 'by size + link', cost: 'per GB / device', recovery: 'minutes cutover', effort: 'medium' },
      scene: {
        entities: {
          demand: demand([`on-prem`, `database`], `Oracle · 4 TB`, [{ text: `source`, tone: `gray` }], `building`),
          subject: subject([`DMS`], `full load + CDC`, [{ text: `lag 2 s`, tone: `green`, icon: `gauge` }], `refresh`),
          target: target(`Aurora`, [{ text: `target`, tone: `green` }]),
          helper: helper([`Snowball`, `Edge`], `ship 80 TB`, `box`, [{ text: `offline`, tone: `violet` }]),
          alt: alt([`DataSync`], `NFS → S3`, [{ text: `online files`, tone: `violet` }], `copy`),
          card: codeCard(`Pick by size`, [`database, live sync      → DMS (+ SCT for engine change)`, `files over the network    → DataSync`, `80 TB, 100 Mbps link     → Snowball  (online: ~80 days)`]),
        },
        links: { ask: links.ask(`reads`), run: links.run(`replicates`), help: links.help(`ships`) },
        flows: [{ route: ['ask', 'run'], kind: 'write', rate: 1.4 }],
      },
    },
    {
      short: 'Observe',
      chapter: 'recap',
      title: 'Audit, flow and trace',
      body: [
        `Three tools answer three questions. <span class="term">CloudTrail</span>: <em>who</em> called which API, when and from where. <span class="term">VPC Flow Logs</span>: <em>which</em> network connections were accepted or rejected. <span class="term">X-Ray</span>: <em>where</em> a single request spent its time across services.`,
        `Turn CloudTrail on for all Regions into a locked S3 bucket, send Flow Logs to CloudWatch or S3 for troubleshooting, and add X-Ray (or OpenTelemetry) tracing to find the slow hop in a microservice call chain.`,
      ],
      changes: [`+ CloudTrail`, `+ Flow Logs`, `+ X-Ray`],
      metrics: { choice: '3 tools', cost: 'per event / GB', recovery: 'n/a', effort: 'low' },
      scene: {
        entities: {
          demand: demand([`API call`], `who + when`, [{ text: `DeleteBucket`, tone: `amber` }], `user`),
          subject: subject([`CloudTrail`], `API audit log`, [{ text: `all Regions`, tone: `green` }], `scroll`),
          target: target(`log bucket`, [{ text: `object lock`, tone: `green` }]),
          helper: helper([`VPC Flow`, `Logs`], `ACCEPT / REJECT`, `network`, [{ text: `src · dst · port`, tone: `gray` }]),
          alt: alt([`X-Ray`], `request trace`, [{ text: `p99 in DB call`, tone: `violet` }], `activity`),
          card: codeCard(`Three questions`, [`CloudTrail  { "eventName": "DeleteBucket", "userIdentity": "alice" }`, `Flow Logs   2 eni-0a 10.0.1.5 10.0.2.9 443 6 ACCEPT OK`, `X-Ray       api 12 ms → orders 40 ms → db 410 ms`]),
        },
        links: { ask: links.ask(`API`), run: links.run(`records`), help: links.help(`logs`) },
        flows: [{ route: ['ask', 'run'], kind: 'msg', rate: 1.3 }],
      },
    },
  ],
});
