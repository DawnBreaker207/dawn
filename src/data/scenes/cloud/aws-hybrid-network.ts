import { STAGE, codeCard, linkOf, makeDb, stageBlock, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// Seed → result. VPC A learns to reach more and more, one connection type per step. Each concept
// has its own id. The two *service* blocks (S3, SaaS) retire in step 3 when the lesson moves on
// to whole networks; in step 4 VPC B steps aside so the Transit Gateway can sit between them.
//
//   step 1  app ── s3                       gateway endpoint (a route, not a box)
//   step 2  + saas                          PrivateLink interface endpoint
//   step 3  s3, saas leave; + vpcb, vpcc    peering A↔B, B↔C: A cannot reach C
//   step 4  + tgw, vpcb moves aside         one attachment each, transitive
//   step 5  + onprem                        Site-to-Site VPN
//   step 6  + dx                            Direct Connect, VPN kept as backup
//
//   dx (left-top)        onprem (top)       vpcc (top-right)
//   app ───────────────  tgw ────────────── vpcb (right)

const app = (sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph: `server`, label: [`app in`, `VPC A`], sub, tags });
const s3 = (tags: Tag[] = []) =>
  makeDb(STAGE.caller2.x, STAGE.caller2.y, { r: 2.2, h: 46, glyph: `box`, label: `Amazon S3`, tags });
const saas = (tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `purple`, glyph: `building`, label: [`SaaS`, `provider`], sub: `their VPC`, tags });
const vpcb = (at: { x: number; y: number }, tags: Tag[] = []) =>
  stageBlock(at, { color: `purple`, glyph: `network`, label: [`VPC B`], sub: `10.1.0.0/16`, tags });
const vpcc = (tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `purple`, glyph: `network`, label: [`VPC C`], sub: `10.2.0.0/16`, tags });
const tgw = (tags: Tag[] = []) =>
  stageBlock(STAGE.main, { color: `green`, glyph: `route`, label: [`Transit`, `Gateway`], sub: `regional router`, tags });
const onprem = (tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `slab`, glyph: `building`, label: [`on-prem`, `network`], sub: `192.168.0.0/16`, tags });
const hybridNetworkDx = (tags: Tag[] = []) =>
  stageBlock(STAGE.caller2, { color: `orange`, glyph: `network`, label: [`Direct`, `Connect`], sub: `10 Gbps port`, tags });

const links = {
  gwEp: (label?: string) => linkOf(`app`, `s3`, label),
  privateLink: (label?: string) => ({ ...linkOf(`app`, `saas`, label), labelAt: 0.6 }),
  peerAb: (label?: string) => linkOf(`app`, `vpcb`, label),
  peerBc: linkOf(`vpcb`, `vpcc`),
  attachApp: (label?: string) => linkOf(`app`, `tgw`, label),
  attachB: (label?: string) => linkOf(`tgw`, `vpcb`, label),
  attachC: (label?: string) => linkOf(`tgw`, `vpcc`, label),
  vpn: (label?: string) => ({ ...linkOf(`tgw`, `onprem`, label), labelAt: 0.6 }),
  dxLine: linkOf(`dx`, `onprem`),
  dxVif: (label?: string) => ({ ...linkOf(`dx`, `tgw`, label), labelAt: 0.6 }),
};

export const awsHybridNetworkLesson: Lesson = {
  id: 'aws-hybrid-network',
  title: 'VPC Endpoints, Transit Gateway, VPN & Direct Connect',
  summary:
    'Start with one VPC and add private paths one at a time: gateway endpoints, PrivateLink, peering, Transit Gateway, Site-to-Site VPN and Direct Connect — ending with a hub connecting VPCs and on-premises.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['path', 'bandwidth', 'setup', 'cost'],
  legend: [[`req`, `private traffic`], [`write`, `route / tunnel`], [`fail`, `no route`]],
  goals: [
    { text: 'Keep S3 and DynamoDB traffic private with gateway endpoints', step: 1 },
    { text: 'Expose services privately with PrivateLink', step: 2 },
    { text: 'Explain why VPC peering is not transitive', step: 3 },
    { text: 'Scale many VPCs with Transit Gateway', step: 4 },
    { text: 'Reach on-premises over a Site-to-Site VPN', step: 5 },
    { text: 'Choose Direct Connect for dedicated fibre', step: 6 },
  ],
  steps: [
    {
      short: 'Gateway EP',
      chapter: 'setup',
      title: 'Seed: reach S3 without leaving AWS’s network',
      body: [
        `A private-subnet app that calls S3 normally has to go out through a NAT Gateway — over the internet path, and paying per gigabyte. A <span class="term">gateway endpoint</span> adds a route to S3 straight from the VPC.`,
        `It exists only for <b>S3 and DynamoDB</b>, is <b>free</b>, and works through a prefix-list entry in the route table. Tighten it with an endpoint policy that lists the buckets the VPC may use. We will grow this one VPC’s reach step by step.`,
      ],
      metrics: { path: 'AWS backbone', bandwidth: 'high', setup: 'minutes', cost: 'free' },
      scene: {
        entities: {
          app: app(`private subnet`, [{ text: `no NAT needed`, tone: `green` }]),
          s3: s3([{ text: `bucket policy`, tone: `gray` }]),
          card: codeCard(`Create it`, [`$ aws ec2 create-vpc-endpoint --vpc-id vpc-0a1 \\`, `      --service-name com.amazonaws.eu-west-1.s3 --route-table-ids rtb-0f2`, `= route: pl-xxxx → vpce, traffic stays on the AWS network`]),
        },
        links: { gwEp: links.gwEp() },
        flows: [{ route: ['gwEp'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'PrivateLink',
      chapter: 'technique',
      title: 'PrivateLink: a service as a private IP',
      body: [
        `<span class="term">PrivateLink</span> exposes a service in another VPC as an <b>interface endpoint</b>: an elastic network interface with a private IP in <em>your</em> subnet. Traffic never touches the internet, and CIDRs may overlap.`,
        `It works for AWS services (SQS, KMS…), SaaS vendors and your own services behind a Network Load Balancer. It is one-way (consumer to provider) and billed hourly plus per GB.`,
      ],
      changes: [`+ SaaS provider (PrivateLink)`],
      metrics: { path: 'ENI in subnet', bandwidth: '10 Gbps / AZ', setup: 'minutes', cost: '$0.01 / hr' },
      scene: {
        entities: {
          app: app(`10.0.1.0/24`, [{ text: `ENI 10.0.1.57`, tone: `green` }]),
          s3: s3(),
          saas: saas([{ text: `overlap OK`, tone: `violet` }]),
          card: codeCard(`Consume a service`, [`$ aws ec2 create-vpc-endpoint --vpc-endpoint-type Interface \\`, `      --service-name com.vendor.eu-west-1.api --subnet-ids subnet-0a1`, `= api.vendor.com now resolves to 10.0.1.57`]),
        },
        links: { gwEp: links.gwEp(), privateLink: links.privateLink(`PrivateLink`) },
        flows: [{ route: ['privateLink'], rate: 1.4, bounce: true }],
      },
    },
    {
      short: 'Peering',
      chapter: 'problem',
      title: 'From services to networks: peering is not transitive',
      body: [
        `Now the app needs other <em>networks</em>, not services. <span class="term">VPC peering</span> connects two VPCs directly: private, low latency, no gateway, no bandwidth cap. CIDR ranges must not overlap, and each side adds routes.`,
        `Peering is <b>not transitive</b>. If A peers with B and B with C, A still cannot reach C through B. Connecting N VPCs fully takes N×(N−1)/2 peerings — ten VPCs need 45.`,
      ],
      changes: [`- S3, SaaS (services)`, `+ VPC B (peered)`, `+ VPC C (no route)`],
      metrics: { path: 'direct', bandwidth: 'no cap', setup: 'routes per pair', cost: 'free + data' },
      scene: {
        entities: {
          app: app(`10.0.0.0/16`, [{ text: `to C?`, tone: `red`, icon: `alert` }]),
          vpcb: vpcb(STAGE.main, [{ text: `pcx-0b2`, tone: `green` }]),
          vpcc: vpcc([{ text: `unreachable from A`, tone: `red` }]),
          card: codeCard(`No transit`, [`A ↔ B  peered     B ↔ C  peered`, `! A → C   no route (not transitive)`, `10 VPCs fully meshed = 10 × 9 / 2 = 45 peerings`]),
        },
        links: { peerAb: links.peerAb(`peering`), peerBc: links.peerBc },
        flows: [{ route: ['peerAb'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Transit GW',
      chapter: 'solution',
      title: 'Transit Gateway: a hub for many networks',
      body: [
        `A <span class="term">Transit Gateway</span> is a regional router. Each VPC, VPN and Direct Connect attaches <em>once</em> to the hub, and route tables decide who may talk to whom. Ten VPCs need ten attachments, not 45 peerings. VPC B steps aside to make room for it.`,
        `It <b>is</b> transitive, supports thousands of attachments, and can segment traffic (prod can’t reach dev) with separate route tables. Costs per attachment-hour and per GB processed.`,
      ],
      changes: [`+ Transit Gateway`, `~ VPC B: attached to the hub`, `- peering links`],
      metrics: { path: 'hub-and-spoke', bandwidth: '50 Gbps', setup: '1 per VPC', cost: '$0.05 / hr' },
      scene: {
        entities: {
          app: app(`attachment 1`, [{ text: `10.0.0.0/16`, tone: `gray` }]),
          tgw: tgw([{ text: `10 attachments`, tone: `violet` }]),
          vpcb: vpcb(STAGE.store, [{ text: `attachment 2`, tone: `gray` }]),
          vpcc: vpcc([{ text: `reachable`, tone: `green` }]),
          card: codeCard(`One hub`, [`$ aws ec2 create-transit-gateway-vpc-attachment \\`, `      --transit-gateway-id tgw-0a1 --vpc-id vpc-0b2 --subnet-ids subnet-0c3`, `= A → B, A → C, B → C all work through the hub`]),
        },
        links: { attachApp: links.attachApp(`attach`), attachB: links.attachB(`attach`), attachC: links.attachC() },
        flows: [{ route: ['attachApp', 'attachB'], rate: 1.2, bounce: true }, { route: ['attachC'], rate: 1, bounce: true }],
      },
    },
    {
      short: 'Site VPN',
      chapter: 'technique',
      title: 'Site-to-Site VPN: on-premises over the internet',
      body: [
        `For an office or data centre, a <span class="term">Site-to-Site VPN</span> sets up <b>two IPsec tunnels</b> (for redundancy) between your customer gateway device and the Transit Gateway. It is encrypted and up in minutes.`,
        `Each tunnel carries up to ~1.25 Gbps, over the public internet — so latency and jitter vary. Good as a quick start or a backup for Direct Connect.`,
      ],
      changes: [`+ on-premises network (VPN)`],
      metrics: { path: 'internet + IPsec', bandwidth: '1.25 Gbps / tunnel', setup: 'minutes', cost: '$0.05 / hr' },
      scene: {
        entities: {
          app: app(`VPC A`, [{ text: `10.0.0.0/16`, tone: `gray` }]),
          tgw: tgw([{ text: `2 IPsec tunnels`, tone: `violet`, icon: `lock` }]),
          vpcb: vpcb(STAGE.store),
          vpcc: vpcc(),
          onprem: onprem([{ text: `BGP · IPsec`, tone: `violet` }]),
          card: codeCard(`Two tunnels`, [`$ aws ec2 create-vpn-connection --type ipsec.1 \\`, `      --customer-gateway-id cgw-0a1 --transit-gateway-id tgw-0a1`, `Tunnel 1: UP   Tunnel 2: UP   (BGP routes exchanged)`]),
        },
        links: { attachApp: links.attachApp(), attachB: links.attachB(), attachC: links.attachC(), vpn: links.vpn(`IPsec`) },
        flows: [{ route: ['vpn'], rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'Direct Connect',
      chapter: 'recap',
      title: 'Result: Direct Connect, with VPN as the backup',
      body: [
        `<span class="term">Direct Connect</span> is a dedicated 1, 10 or 100 Gbps fibre from your site to an AWS location. Predictable latency, high bandwidth and lower data-transfer cost than internet egress — but it takes <b>weeks</b> to order and is <b>not encrypted</b> by default.`,
        `A <b>Direct Connect Gateway</b> lets one connection reach VPCs in many Regions. For resilience use two connections in different locations, or keep the VPN as the backup path (and for encryption). The hub now joins three VPCs and the data centre.`,
      ],
      changes: [`+ Direct Connect`, `~ VPN: backup path`],
      metrics: { path: 'dedicated fibre', bandwidth: '1–100 Gbps', setup: 'weeks', cost: 'port + GB' },
      scene: {
        entities: {
          app: app(`VPCs in 3 Regions`, [{ text: `via DX Gateway`, tone: `violet` }]),
          tgw: tgw([{ text: `VPN = backup`, tone: `green`, icon: `shield` }]),
          vpcb: vpcb(STAGE.store),
          vpcc: vpcc(),
          onprem: onprem([{ text: `colo cage`, tone: `gray` }]),
          dx: hybridNetworkDx([{ text: `consistent latency`, tone: `green`, icon: `gauge` }]),
          card: codeCard(`Order and attach`, [`$ aws directconnect create-connection --location EqDC2 --bandwidth 10Gbps --connection-name hq`, `$ aws directconnect create-private-virtual-interface …`, `! not encrypted: add MACsec or a VPN for confidentiality`]),
        },
        links: { attachApp: links.attachApp(), attachB: links.attachB(), attachC: links.attachC(), vpn: links.vpn(), dxLine: links.dxLine, dxVif: links.dxVif(`private VIF`) },
        flows: [{ route: ['dxVif'], rate: 1.6, bounce: true }, { route: ['dxLine'], rate: 1.6, bounce: true }],
      },
    },
  ],
};
