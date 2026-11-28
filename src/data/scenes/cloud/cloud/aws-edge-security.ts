import { STAGE, codeCard, linkOf, makeDb, stageBlock, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// Seed → result. Every defence is its own node with its own id; each step adds at most two,
// and the last step is the finished picture. Nodes keep their meaning for the whole lesson.
//
//   step 1  visitors ─────────────── assets (public S3)                      seed
//   step 2  visitors ─ cdn ────────── assets (private)                        + CloudFront
//   step 3  + waf, attacker                                                   + WAF, + attacker
//   step 4  (Shield is a state of the cdn; the attacker becomes a DDoS)       mutation
//   step 5  + app behind the cdn, protected by SG + NACL                      + app
//   step 6  attacker leaves, guardduty arrives; Inspector/Macie scan app/S3   detect + discover
//
//   attacker (left-top)      waf (top)        app (top-right)
//   visitors ──────────────  cdn ──────────── assets (right)

const visitors = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph: `users`, label: [`visitors`], sub: `worldwide`, tags });
const cdn = (tags: Tag[] = []) =>
  stageBlock(STAGE.main, { color: `green`, glyph: `globe`, label: [`CloudFront`], sub: `edge cache`, tags });
const assets = (tags: Tag[] = []) =>
  makeDb(STAGE.store.x, STAGE.store.y, { r: 2.2, h: 46, glyph: `box`, label: `site assets (S3)`, tags });
const waf = (tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph: `filter`, label: [`AWS WAF`], sub: `web ACL · L7`, tags });
const app = (tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `blue`, glyph: `server`, label: [`web app`], sub: `ALB + EC2`, tags });
const attacker = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.caller2, { color: `slab`, glyph: `skull`, label: [`attacker`], sub, tags });
const guardduty = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller2, { color: `orange`, glyph: `radio`, label: [`GuardDuty`], sub: `threat detection`, tags });

const links = {
  direct: linkOf(`visitors`, `assets`, undefined, false),
  edge: (label?: string) => linkOf(`visitors`, `cdn`, label),
  origin: (label?: string) => linkOf(`cdn`, `assets`, label),
  guard: (label?: string) => ({ ...linkOf(`waf`, `cdn`, label, false), labelAt: 0.6 }),
  attack: linkOf(`attacker`, `waf`, undefined, false),
  dynamic: linkOf(`cdn`, `app`),
  watch: linkOf(`guardduty`, `cdn`, undefined, false),
  watchApp: linkOf(`guardduty`, `app`, undefined, false),
};

export const awsEdgeSecurityLesson: Lesson = {
  id: 'aws-edge-security',
  title: 'Edge Security: CloudFront OAC, WAF, Shield & GuardDuty',
  summary:
    'Start with an open S3 bucket and add one defence at a time: CloudFront with OAC, WAF, Shield, security groups and NACLs, then GuardDuty, Inspector and Macie — ending with a layered, monitored site.',
  minutes: 13,
  level: 'intermediate',
  metrics: ['layer', 'stops', 'mode', 'cost'],
  legend: [[`req`, `legitimate`], [`fail`, `blocked`], [`msg`, `finding`]],
  goals: [
    { text: 'Lock a private S3 origin behind CloudFront OAC', step: 2 },
    { text: 'Block SQLi, XSS and bots at L7 with WAF', step: 3 },
    { text: 'Absorb volumetric DDoS with Shield', step: 4 },
    { text: 'Combine stateful Security Groups with stateless NACLs', step: 5 },
    { text: 'Detect threats with GuardDuty and Inspector', step: 6 },
    { text: 'Find PII and secrets in S3 with Macie', step: 6 },
  ],
  steps: [
    {
      short: 'Open bucket',
      chapter: 'problem',
      title: 'Seed: a public bucket serves the site',
      body: [
        `The simplest way to host a site is to make an S3 bucket public. It works — and it means <b>anyone on the internet can read every object</b>, hit it as hard as they like, and probe it for mistakes. There is nothing between visitors and the data.`,
        `We will build the defences around this one bucket, one layer per step, until the site is protected at the edge, the network and the data — and monitored.`,
      ],
      metrics: { layer: 'none', stops: 'nothing', mode: 'public read', cost: '$0.09 / GB' },
      scene: {
        entities: {
          visitors: visitors([{ text: `anyone`, tone: `amber` }]),
          assets: assets([{ text: `public · anyone reads`, tone: `red`, icon: `alert` }]),
          card: codeCard(`A public bucket`, [`{ "Effect": "Allow", "Principal": "*",`, `  "Action": "s3:GetObject", "Resource": "arn:aws:s3:::site/*" }`, `! every object readable by every IP, no filtering at all`]),
        },
        links: {},
        flows: [],
      },
    },
    {
      short: 'CloudFront',
      chapter: 'solution',
      title: 'CloudFront in front; the bucket goes private',
      body: [
        `Put <span class="term">CloudFront</span> between visitors and the bucket. Users now hit the nearest edge location; the bucket is made <b>private</b>, and <b>Origin Access Control (OAC)</b> signs CloudFront’s requests so only this distribution can read it.`,
        `Direct requests to the S3 URL now return <code>403</code>. You also gain edge caching and TLS at the edge — and a place to attach the next defences.`,
      ],
      changes: [`+ CloudFront (OAC)`, `~ assets: private`],
      metrics: { layer: 'edge', stops: 'direct S3 access', mode: 'allow-list', cost: '$0.085 / GB' },
      scene: {
        entities: {
          visitors: visitors(),
          cdn: cdn([{ text: `OAC signs requests`, tone: `violet`, icon: `lock` }]),
          assets: assets([{ text: `private · OAC only`, tone: `green`, icon: `shield` }]),
          card: codeCard(`Only CloudFront may read`, [`{ "Effect": "Allow", "Principal": { "Service": "cloudfront.amazonaws.com" },`, `  "Action": "s3:GetObject", "Resource": "arn:aws:s3:::site/*",`, `  "Condition": { "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::1111:distribution/E1" } } }`]),
        },
        links: { edge: links.edge(`GET /`), origin: links.origin(`OAC`) },
        flows: [{ route: ['edge', 'origin'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'WAF',
      chapter: 'technique',
      title: 'WAF filters the request itself',
      body: [
        `An attacker now shows up. CloudFront only forwards requests; it doesn’t judge them. <span class="term">AWS WAF</span> attaches to the distribution and inspects each HTTP request at layer 7 — URI, headers, body, IP — before it is served. Rules <b>allow, block, count</b> or challenge.`,
        `Use managed rule groups (SQL injection, XSS, bad IPs, bots) plus <b>rate-based</b> rules, and run a new rule in <i>count</i> mode first to see what it would catch.`,
      ],
      changes: [`+ WAF web ACL`, `+ attacker (SQLi)`],
      metrics: { layer: 'L7', stops: 'SQLi · XSS', mode: 'block / count', cost: '$5 / ACL' },
      scene: {
        entities: {
          visitors: visitors(),
          cdn: cdn([{ text: `WAF attached`, tone: `violet` }]),
          assets: assets([{ text: `private · OAC only`, tone: `green`, icon: `shield` }]),
          waf: waf([{ text: `3 rules`, tone: `violet` }]),
          attacker: attacker(`' OR 1=1 --`, [{ text: `SQLi`, tone: `red`, icon: `alert` }]),
          card: codeCard(`Block and rate-limit`, [`{ "Name": "ratelimit", "Action": { "Block": {} },`, `  "Statement": { "RateBasedStatement": { "Limit": 2000, "AggregateKeyType": "IP" } } }`, `! GET /items?id=1' OR 1=1--   → 403 (SQLi rule)`]),
        },
        links: { edge: links.edge(`GET /`), origin: links.origin(`OAC`), guard: links.guard(`inspects`), attack: links.attack },
        flows: [{ route: ['edge', 'origin'], rate: 1.4, bounce: true }, { route: ['attack'], kind: 'fail', rate: 1 }],
      },
    },
    {
      short: 'Shield',
      chapter: 'technique',
      title: 'Shield absorbs floods before they land',
      body: [
        `The same attacker switches tactics: instead of clever requests, a flood of packets. WAF reads requests, so it never sees this. <span class="term">AWS Shield Standard</span> is on for every customer and stops common layer-3/4 attacks (SYN floods, UDP reflection) at the AWS edge — nothing new to deploy, it protects the distribution already there.`,
        `<span class="term">Shield Advanced</span> (about $3,000 a month) adds per-resource protection, near-real-time metrics, the DDoS Response Team and cost protection during an attack.`,
      ],
      changes: [`~ cdn: Shield Standard`, `~ attacker: DDoS flood`],
      metrics: { layer: 'L3 / L4', stops: 'SYN · UDP floods', mode: 'always on', cost: 'free / $3k mo' },
      scene: {
        entities: {
          visitors: visitors([{ text: `still served`, tone: `green` }]),
          cdn: cdn([{ text: `Shield: 800 Gbps absorbed`, tone: `green`, icon: `shield` }]),
          assets: assets([{ text: `private · OAC only`, tone: `green`, icon: `shield` }]),
          waf: waf([{ text: `3 rules`, tone: `violet` }]),
          attacker: attacker(`botnet flood`, [{ text: `800 Gbps`, tone: `red`, icon: `alert` }]),
          card: codeCard(`Opt in per resource`, [`$ aws shield describe-subscription`, `SubscriptionLimits: Advanced · 1-year commitment`, `$ aws shield create-protection --name cdn --resource-arn $CF_ARN`, `= Standard is automatic; Advanced is opt-in per resource`]),
        },
        links: { edge: links.edge(`GET /`), origin: links.origin(`OAC`), guard: links.guard(`inspects`), attack: links.attack },
        flows: [{ route: ['edge', 'origin'], rate: 1.4, bounce: true }, { route: ['attack'], kind: 'fail', rate: 2 }],
      },
    },
    {
      short: 'SG · NACL',
      chapter: 'insight',
      title: 'Behind the edge: the app, with SG and NACL',
      body: [
        `Dynamic pages come from an application, so CloudFront gets a second origin: a <b>web app</b> behind an ALB. It must accept traffic only from CloudFront. A <span class="term">Security Group</span> is a <b>stateful</b> allow-list on the instance: allow 443 from the CloudFront prefix list and replies are automatic.`,
        `A <span class="term">network ACL</span> is <b>stateless</b> and sits on the subnet: numbered allow <em>and</em> deny rules, evaluated in order, and return traffic (ephemeral ports 1024–65535) must be allowed explicitly. Use SGs day to day; NACLs for blunt subnet-wide denies.`,
      ],
      changes: [`+ web app (second origin)`, `+ SG + NACL`],
      metrics: { layer: 'L3 / L4', stops: 'by rule', mode: 'stateful / stateless', cost: 'free' },
      scene: {
        entities: {
          visitors: visitors(),
          cdn: cdn([{ text: `2 origins`, tone: `violet` }]),
          assets: assets([{ text: `private · OAC only`, tone: `green`, icon: `shield` }]),
          waf: waf([{ text: `3 rules`, tone: `violet` }]),
          attacker: attacker(`203.0.113.9`, [{ text: `denied by NACL`, tone: `red` }]),
          app: app([{ text: `SG: 443 from CloudFront`, tone: `violet`, icon: `lock` }]),
          card: codeCard(`Two different models`, [`SG  : allow tcp/443 from pl-cloudfront        (reply is automatic)`, `NACL: 100 allow tcp/443 in  |  110 deny 203.0.113.9  |  * allow tcp/1024-65535 out`, `! forget the ephemeral-port rule and replies are dropped`]),
        },
        links: { edge: links.edge(`GET /`), origin: links.origin(`OAC`), guard: links.guard(`inspects`), attack: links.attack, dynamic: links.dynamic },
        flows: [{ route: ['edge', 'origin'], rate: 1.2, bounce: true }, { route: ['dynamic'], rate: 1.2, bounce: true }, { route: ['attack'], kind: 'fail', rate: 1 }],
      },
    },
    {
      short: 'Detect',
      chapter: 'recap',
      title: 'Result: layered, and watched',
      body: [
        `Prevention is never complete, so the finished site is also <b>watched</b>. <span class="term">GuardDuty</span> reads CloudTrail, VPC Flow Logs and DNS logs with threat intelligence and raises findings; <span class="term">Inspector</span> scans the app’s instances and images for known vulnerabilities.`,
        `<span class="term">Macie</span> scans the S3 bucket for PII and secrets and flags public or unencrypted buckets. Findings flow to Security Hub or EventBridge to alert or auto-remediate. Edge, network, data and detection now work together.`,
      ],
      changes: [`+ GuardDuty`, `~ app: Inspector scan`, `~ assets: Macie scan`],
      metrics: { layer: 'detect', stops: 'nothing (alerts)', mode: 'continuous', cost: 'by data scanned' },
      scene: {
        entities: {
          visitors: visitors(),
          cdn: cdn([{ text: `2 origins`, tone: `violet` }]),
          assets: assets([{ text: `Macie: 3 PII findings`, tone: `amber`, icon: `alert` }]),
          waf: waf([{ text: `3 rules`, tone: `violet` }]),
          app: app([{ text: `Inspector: 12 CVEs`, tone: `amber`, icon: `bug` }]),
          guardduty: guardduty([{ text: `1 high finding`, tone: `red`, icon: `alert` }]),
          card: codeCard(`A finding`, [`{ "type": "CryptoCurrency:EC2/BitcoinTool.B!DNS", "severity": 8.0,`, `  "resource": "i-0abc…", "action": "DNS lookup of xmr pool" }`, `= EventBridge rule → Lambda isolates the instance`]),
        },
        links: { edge: links.edge(`GET /`), origin: links.origin(`OAC`), guard: links.guard(`inspects`), dynamic: links.dynamic, watch: links.watch },
        flows: [{ route: ['watch'], kind: 'msg', rate: 1.2 }, { route: ['edge', 'origin'], rate: 1.2, bounce: true }],
      },
    },
  ],
};
