import { makeBalancer, makeBlock, makeDb, makeDevice, makeLink, makePanel, makeZone, cardAt, type Tag, type SceneOpts } from '@/lib/simulator/scene-builders';

// One VPC for the whole lesson. Two subnet strips (public, private) run along the
// iso y-axis; each holds one node per AZ. Later steps only add gateways, rules,
// endpoints and logs around the same app.
//
//   internet ─ IGW ─┬─ ALB  ─┬─ EC2 (AZ-a)
//                   └─ NAT ──┴─ EC2 (AZ-b) ─ RDS
//                                    └─ S3 (gateway endpoint)

// ---- colors by role (shared across AWS lessons): edge/DNS yellow · gateways orange · compute blue · data db · security purple
const internet = () => makeDevice(-16, -16, { label: `internet` });
const igw = (o: SceneOpts = {}) => makeBlock(-13, -7, { s: 4.4, h: 50, color: `orange`, glyph: `globe`, label: [`Internet`, `Gateway`], ...o });
const alb = (tags: Tag[] = []) => makeBalancer(-4, -6, { s: 4.4, h: 50, label: [`ALB`], sub: `public`, tags });
const nat = (tags: Tag[] = []) => makeBlock(-4, 7, { s: 4.4, h: 50, color: `orange`, glyph: `route`, label: [`NAT GW`], sub: `elastic IP`, tags });
const ec2 = (y: number, az: string, tags: Tag[] = []) =>
  makeBlock(7, y, { s: 4.4, h: 50, color: `blue`, glyph: `server`, label: [`EC2 app`], sub: az, tags });
const appA = (tags: Tag[] = []) => ec2(-6, `AZ-a`, tags);
const appB = (tags: Tag[] = []) => ec2(6, `AZ-b`, tags);
const rds = (tags: Tag[] = []) => makeDb(7, 17, { r: 2.1, h: 44, label: `RDS`, tags });
const s3 = (tags: Tag[] = []) => makeDb(16, 7, { r: 2.1, h: 44, glyph: `package`, label: `S3`, tags });
const logs = (tags: Tag[] = []) =>
  makeBlock(-4, 18, { s: 4.2, h: 48, color: `slab`, glyph: `scroll`, label: [`CloudWatch`], sub: `flow logs`, tags });

const publicNet = () => makeZone({ x0: -6.5, x1: -1.5, y0: -11.5, y1: 9.5 }, `PUBLIC`);
const privateNet = () => makeZone({ x0: 4.5, x1: 9.5, y0: -11.5, y1: 19.5 }, `PRIVATE`);

const links = {
  inIgw: makeLink(`internet`, `igw`, [`internet`, `igw`], { heads: `both` }),
  igwAlb: makeLink(`igw`, `alb`, [`igw`, `alb`], { heads: `both` }),
  albA: makeLink(`alb`, `appA`, [`alb`, `appA`], { heads: `both` }),
  albB: makeLink(`alb`, `appB`, [`alb`, `appB`], { heads: `both` }),
  bRds: makeLink(`appB`, `rds`, [`appB`, `rds`], { heads: `both` }),
  bNat: makeLink(`appB`, `nat`, [`appB`, `nat`]),
  bNatQuiet: makeLink(`appB`, `nat`, [`appB`, `nat`]),
  natIgw: makeLink(`nat`, `igw`, [`nat`, `igw`]),
  bS3: makeLink(`appB`, `s3`, [`appB`, `s3`], { heads: `both` }),
  bLogs: makeLink(`appB`, `logs`, [`appB`, `logs`], { style: `dashed` }),
};

const card = cardAt({ x: -13, y: -7, dx: -190, dy: -250 });

const vpcCore = () => ({ publicNet: publicNet(), privateNet: privateNet() });

export const awsVpcLesson = {
  id: `aws-vpc`,
  title: `AWS VPC & Network Security Topology`,
  summary: `Build one VPC step by step: subnets in two AZs, an Internet Gateway, NAT, security groups vs NACLs, a gateway endpoint and flow logs.`,
  minutes: 14,
  level: `intermediate`,
  metrics: [`vpcCidr`, `subnets`, `inbound`, `outbound`, `firewall`],
  legend: [`req`, `res`, [`write`, `egress / logs`], `fail`],
  goals: [
    { text: `VPC CIDR and subnets across 2 AZs`, step: 1 },
    { text: `Internet Gateway and public routing`, step: 2 },
    { text: `NAT Gateway for private outbound`, step: 3 },
    { text: `Security groups vs network ACLs`, step: 4 },
    { text: `Gateway endpoints for S3`, step: 5 },
    { text: `VPC Flow Logs for diagnosis`, step: 6 },
  ],
  steps: [
    {
      short: `Subnets`,
      chapter: `setup`,
      title: `A VPC is an address range you carve up`,
      body: [
        `A VPC starts as one private IPv4 block, e.g. <code>10.0.0.0/16</code> (65,536 addresses). You split it into <span class="term">subnets</span>, and every subnet lives in exactly one Availability Zone.`,
        `The usual layout: a <b>public</b> and a <b>private</b> subnet in each of two AZs. The app servers and the database go private — nothing on the internet can reach them yet.`,
      ],
      callout: {
        kind: `insight`,
        text: `AWS reserves 5 addresses in every subnet: .0 network, .1 router, .2 DNS, .3 future use and the last (broadcast). A /24 gives you 251 usable IPs.`,
      },
      changes: [`+ VPC 10.0.0.0/16`, `+ public + private subnets × 2 AZs`, `+ EC2 in each AZ, RDS`],
      metrics: { vpcCidr: `10.0.0.0/16`, subnets: `4`, inbound: `none`, outbound: `none`, firewall: `default` },
      scene: {
        entities: {
          ...vpcCore(),
          appA: appA(),
          appB: appB(),
          rds: rds(),
          card: card(
            `subnets`,
            [`$ aws ec2 describe-subnets --query "Subnets[].[CidrBlock,AvailabilityZone]"`, `10.0.1.0/24   public-a    us-east-1a`, `10.0.2.0/24   public-b    us-east-1b`, `10.0.10.0/24  private-a   us-east-1a`, `10.0.11.0/24  private-b   us-east-1b`],
            `listOrdered`,
          ),
        },
        links: { bRds: links.bRds },
        flows: [{ route: [`bRds`], rate: 0.8, bounce: true }],
      },
    },
    {
      short: `IGW`,
      chapter: `technique`,
      title: `An Internet Gateway makes a subnet public`,
      body: [
        `Attach an <span class="term">Internet Gateway</span> to the VPC and add <code>0.0.0.0/0 → igw</code> to the <b>public</b> subnets’ route table. That route is the only thing that makes a subnet “public”.`,
        `The ALB lives there with a public address. It forwards to the EC2 instances in the private subnets, which still have no route to the internet.`,
      ],
      callout: { kind: `tip`, text: `The IGW is managed for you: horizontally scaled, redundant and with no bandwidth limit. One per VPC.` },
      changes: [`+ Internet Gateway`, `+ ALB in the public subnets`],
      metrics: { vpcCidr: `10.0.0.0/16`, subnets: `4`, inbound: `ALB :443`, outbound: `none`, firewall: `default` },
      scene: {
        entities: { ...vpcCore(), internet: internet(), igw: igw(), alb: alb(), appA: appA(), appB: appB(), rds: rds() },
        links: { inIgw: links.inIgw, igwAlb: links.igwAlb, albA: links.albA, albB: links.albB, bRds: links.bRds },
        flows: [
          { route: [`inIgw`, `igwAlb`, `albA`], rate: 1, bounce: true },
          { route: [`inIgw`, `igwAlb`, `albB`], rate: 1, bounce: true },
        ],
      },
    },
    {
      short: `NAT`,
      chapter: `technique`,
      title: `Private servers still need to reach out`,
      body: [
        `The app must download packages and call external APIs, but must never accept connections from the internet. A <span class="term">NAT Gateway</span> in a public subnet does exactly that: outbound only, through its Elastic IP.`,
        `The private route table gets <code>0.0.0.0/0 → nat</code>. Replies come back through the NAT; new inbound connections have nowhere to go.`,
      ],
      callout: { kind: `warn`, text: `A NAT Gateway lives in one AZ. Run one per AZ so an AZ outage doesn’t cut outbound traffic for the other.` },
      changes: [`+ NAT Gateway + Elastic IP`, `~ private route: 0.0.0.0/0 → nat`],
      metrics: { vpcCidr: `10.0.0.0/16`, subnets: `4`, inbound: `ALB :443`, outbound: `via NAT`, firewall: `default` },
      scene: {
        entities: {
          ...vpcCore(),
          internet: internet(),
          igw: igw(),
          alb: alb(),
          nat: nat([{ text: `1 per AZ`, tone: `amber` }]),
          appA: appA(),
          appB: appB(),
          rds: rds(),
          card: card(
            `route tables`,
            [`$ aws ec2 describe-route-tables --route-table-ids rtb-private-b`, `private-b   10.0.0.0/16 → local`, `= private-b   0.0.0.0/0   → nat-0abc`, `public-*    10.0.0.0/16 → local`, `public-*    0.0.0.0/0   → igw-0def`],
            `route`,
          ),
        },
        links: { inIgw: links.inIgw, igwAlb: links.igwAlb, albA: links.albA, albB: links.albB, bRds: links.bRds, bNat: links.bNat, natIgw: links.natIgw },
        flows: [
          { route: [`bNat`, `natIgw`, `inIgw`], kind: `write`, rate: 1.4, bounce: true },
          { route: [`inIgw`, `igwAlb`, `albA`], rate: 0.8, bounce: true },
        ],
      },
    },
    {
      short: `SG vs NACL`,
      chapter: `insight`,
      title: `Two firewalls: security groups and NACLs`,
      body: [
        `A <span class="term">security group</span> sits on each instance’s network interface. It is <b>stateful</b> (replies are allowed automatically), has allow rules only, and can point at another group: the app accepts 8080 only from the ALB’s group.`,
        `A <span class="term">network ACL</span> guards a whole subnet. It is <b>stateless</b> — you must allow return traffic on ephemeral ports 1024–65535 — and its numbered rules can <b>deny</b>, e.g. block one attacking IP.`,
      ],
      callout: { kind: `insight`, text: `Need to block a specific IP? Only a NACL can deny. Security groups can only allow.` },
      changes: [`+ SG chain ALB → app → RDS`, `+ NACL deny 203.0.113.99`],
      metrics: { vpcCidr: `10.0.0.0/16`, subnets: `4`, inbound: `ALB :443`, outbound: `via NAT`, firewall: `SG + NACL` },
      scene: {
        entities: {
          ...vpcCore(),
          internet: internet(),
          igw: igw(),
          alb: alb([{ text: `sg-alb :443`, tone: `violet`, icon: `shield` }]),
          nat: nat(),
          appA: appA(),
          appB: appB([{ text: `sg-app ← sg-alb`, tone: `violet`, icon: `shield` }]),
          rds: rds([{ text: `sg-db ← sg-app`, tone: `violet`, icon: `shield` }]),
          card: card(
            `network ACL · public`,
            [`#100  ALLOW  tcp 443    0.0.0.0/0`, `! #90   DENY   all        203.0.113.99/32`, `#200  ALLOW  tcp 1024-65535 (return)`, `*     DENY   all`],
            `shield`,
          ),
        },
        links: { inIgw: links.inIgw, igwAlb: links.igwAlb, albA: links.albA, albB: links.albB, bRds: links.bRds, bNat: links.bNatQuiet, natIgw: links.natIgw },
        flows: [
          { route: [`inIgw`, `igwAlb`, `albA`], rate: 1, bounce: true },
          { route: [`inIgw`], kind: `fail`, rate: 0.6 },
        ],
      },
    },
    {
      short: `Endpoint`,
      chapter: `solution`,
      title: `Talk to S3 without the NAT`,
      body: [
        `Backups to S3 through the NAT cost NAT processing fees per GB and leave the VPC. A <span class="term">gateway endpoint</span> adds a prefix-list route to S3 in the route table, so the traffic stays on the AWS network — and it is free.`,
        `Gateway endpoints exist only for S3 and DynamoDB. Other services (SQS, KMS, Secrets Manager) use <span class="term">interface endpoints</span> (PrivateLink): an ENI with a private IP in your subnet.`,
      ],
      callout: { kind: `tip`, text: `Exam pattern: “reduce NAT Gateway cost for S3 traffic” → S3 gateway endpoint.` },
      changes: [`+ S3 gateway endpoint`, `~ S3 traffic skips the NAT`],
      metrics: { vpcCidr: `10.0.0.0/16`, subnets: `4`, inbound: `ALB :443`, outbound: `NAT + vpce`, firewall: `SG + NACL` },
      scene: {
        entities: {
          ...vpcCore(),
          internet: internet(),
          igw: igw(),
          alb: alb(),
          nat: nat(),
          appA: appA(),
          appB: appB(),
          rds: rds(),
          s3: s3([{ text: `$0 / GB`, tone: `green` }]),
          card: card(`route table · private-b`, [`10.0.0.0/16        → local`, `0.0.0.0/0          → nat-0abc`, `= pl-63a5400a (s3)  → vpce-0a1b`], `route`),
        },
        links: { inIgw: links.inIgw, igwAlb: links.igwAlb, albA: links.albA, albB: links.albB, bRds: links.bRds, bNat: links.bNatQuiet, natIgw: links.natIgw, bS3: links.bS3 },
        flows: [
          { route: [`bS3`], kind: `write`, rate: 2, bounce: true },
          { route: [`inIgw`, `igwAlb`, `albB`], rate: 0.8, bounce: true },
        ],
      },
    },
    {
      short: `Flow logs`,
      chapter: `technique`,
      title: `Flow logs show what was accepted or rejected`,
      body: [
        `<span class="term">VPC Flow Logs</span> record metadata for every connection — source, destination, ports, bytes, <code>ACCEPT</code> or <code>REJECT</code> — at VPC, subnet or ENI level, into CloudWatch Logs or S3.`,
        `When a request silently fails, a REJECT line tells you a security group or NACL dropped it. Payloads are never captured.`,
      ],
      callout: { kind: `insight`, text: `Flow logs skip traffic to the Amazon DNS server, instance metadata (169.254.169.254) and DHCP.` },
      changes: [`+ flow logs → CloudWatch`],
      metrics: { vpcCidr: `10.0.0.0/16`, subnets: `4`, inbound: `ALB :443`, outbound: `NAT + vpce`, firewall: `audited` },
      scene: {
        entities: {
          ...vpcCore(),
          internet: internet(),
          igw: igw(),
          alb: alb(),
          nat: nat(),
          appA: appA(),
          appB: appB(),
          rds: rds(),
          s3: s3(),
          logs: logs([{ text: `1 REJECT`, tone: `red`, icon: `alert` }]),
          card: card(
            `flow log records`,
            [`$ aws logs filter-log-events --log-group-name vpc-flow --filter-pattern "REJECT"`, `eni-0a1b 198.51.100.2 → 10.0.11.25 :443  ACCEPT`, `! eni-0a1b 203.0.113.99 → 10.0.11.25 :22   REJECT`],
            `scroll`,
          ),
        },
        links: {
          inIgw: links.inIgw,
          igwAlb: links.igwAlb,
          albA: links.albA,
          albB: links.albB,
          bRds: links.bRds,
          bNat: links.bNatQuiet,
          natIgw: links.natIgw,
          bS3: links.bS3,
          bLogs: links.bLogs,
        },
        flows: [
          { route: [`bLogs`], kind: `write`, rate: 1.4 },
          { route: [`inIgw`, `igwAlb`, `albB`], rate: 1, bounce: true },
        ],
      },
    },
    {
      short: `Recap`,
      chapter: `recap`,
      title: `The whole VPC`,
      body: [
        `Inbound reaches only the ALB through the IGW. Private instances go out through a NAT per AZ, and reach S3 through a free gateway endpoint.`,
        `Security groups chain ALB → app → database; a NACL can deny addresses at the subnet edge; flow logs record every decision.`,
      ],
      changes: [`~ all paths active`],
      metrics: { vpcCidr: `10.0.0.0/16`, subnets: `4`, inbound: `ALB :443`, outbound: `NAT + vpce`, firewall: `audited` },
      scene: {
        entities: { ...vpcCore(), internet: internet(), igw: igw(), alb: alb(), nat: nat(), appA: appA(), appB: appB(), rds: rds(), s3: s3(), logs: logs() },
        links: {
          inIgw: links.inIgw,
          igwAlb: links.igwAlb,
          albA: links.albA,
          albB: links.albB,
          bRds: links.bRds,
          bNat: links.bNatQuiet,
          natIgw: links.natIgw,
          bS3: links.bS3,
          bLogs: links.bLogs,
        },
        flows: [
          { route: [`inIgw`, `igwAlb`, `albA`], rate: 1, bounce: true },
          { route: [`inIgw`, `igwAlb`, `albB`], rate: 1, bounce: true },
          { route: [`bNat`, `natIgw`], kind: `write`, rate: 0.6 },
          { route: [`bS3`], kind: `write`, rate: 0.8, bounce: true },
          { route: [`bRds`], rate: 1, bounce: true },
        ],
      },
    },
  ],
};

export default awsVpcLesson;
