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
// AWS SAA-C03: VPC & NETWORK SECURITY TOPOLOGY
// ============================================================================
export const awsVpcLesson = {
  id: `aws-vpc`,
  title: `AWS VPC & Network Security Topology`,
  summary: `Design secure multi-tier VPC topologies with public & private subnets, NAT Gateway, Security Groups vs NACLs, and VPC Endpoints.`,
  minutes: 14,
  level: `intermediate`,
  metrics: [`cidr_block`, `igw_state`, `subnets`, `nat_gw`, `sec_groups`],
  legend: [`req`, `res`, [`ping`, `private route`], `fail`],
  goals: [
    { text: 'VPC CIDR block and multi-tier', step: 1 },
    { text: 'Internet Gateway (IGW) and Public', step: 2 },
    { text: 'NAT Gateway for secure outbound', step: 3 },
    { text: 'Stateful Security Groups vs Stateless', step: 4 },
    { text: 'VPC Endpoints & AWS PrivateLink', step: 5 },
  ],
  steps: [
    {
      short: `CIDR & Subnets`,
      chapter: `setup`,
      title: `VPC CIDR Block & Multi-AZ Subnets`,
      body: [
        `Every AWS Virtual Private Cloud (VPC) starts with an IPv4 CIDR block (e.g. <code>10.0.0.0/16</code>, giving 65,536 private IP addresses).`,
        `We split the VPC into <strong>Public Subnets</strong> (for ALBs/Bastions) and <strong>Private Subnets</strong> (for App Compute & Databases) duplicated across 2 Availability Zones.`,
      ],
      callout: {
        kind: `insight`,
        text: `AWS reserves the first 4 IP addresses and the last 1 IP address in every subnet (e.g. .0 Network, .1 Router, .2 DNS, .3 Future use, .255 Broadcast).`,
      },
      changes: [
        `+ VPC 10.0.0.0/16 created in us-east-1`,
        `+ Public Subnets: 10.0.1.0/24 & 10.0.2.0/24`,
        `+ Private Subnets: 10.0.10.0/24 & 10.0.11.0/24`,
      ],
      metrics: {
        cidr_block: `10.0.0.0/16`,
        igw_state: `Detached`,
        subnets: `4 Subnets`,
        nat_gw: `—`,
        sec_groups: `Default`,
      },
      scene: {
        entities: {
          client: y(-14, -4, { label: `External Internet`, tags: [{ text: `Public`, icon: `globe` }] }),
          pub_sub: d(-4, -4, { color: `orange`, glyph: `globe`, label: [`Public Subnet`, `AZ-1a /24`] }),
          priv_app: d(6, -4, { color: `blue`, glyph: `server`, label: [`Private App`, `AZ-1a /24`] }),
          priv_db: b(16, -4, { label: `Private DB (AZ-1a)`, color: `purple` }),
        },
        links: {
          c_pub: h(`client`, `pub_sub`, [`client`, `pub_sub`], { heads: `both`, label: `Ingress` }),
          pub_app: h(`pub_sub`, `priv_app`, [`pub_sub`, `priv_app`], { heads: `both` }),
          app_db: h(`priv_app`, `priv_db`, [`priv_app`, `priv_db`], { heads: `both` }),
        },
        flows: [
          { route: [`c_pub`, `pub_app`, `app_db`], bounce: true, rate: 1.2 },
        ],
      },
    },
    {
      short: `IGW Routing`,
      chapter: `technique`,
      title: `Internet Gateway (IGW) & Public Routing`,
      body: [
        `To make a subnet "Public", we attach an <strong>Internet Gateway (IGW)</strong> to the VPC and add a default route (<code>0.0.0.0/0 → igw-xxxx</code>) to its route table.`,
        `Only resources with Public IPv4 and an IGW route can receive traffic directly from the public Internet.`,
      ],
      callout: {
        kind: `tip`,
        text: `The Internet Gateway is horizontally scaled, redundant, and highly available by default with no bandwidth constraints.`,
      },
      changes: [
        `+ Internet Gateway attached to VPC`,
        `+ Public Route Table: 0.0.0.0/0 → igw`,
        `+ ALB deployed in Public Subnet`,
      ],
      metrics: {
        cidr_block: `10.0.0.0/16`,
        igw_state: `Attached`,
        subnets: `4 Subnets`,
        nat_gw: `—`,
        sec_groups: `ALB SG`,
      },
      scene: {
        entities: {
          users: y(-14, -4, { label: `Global Users`, tags: [{ text: `HTTPS 443`, icon: `globe` }] }),
          igw: d(-4, -4, { color: `orange`, glyph: `globe`, label: [`Internet Gateway`, `VPC Router`] }),
          alb: f(6, -4, { color: `orange`, glyph: `balancer`, label: [`Public ALB`, `Multi-AZ`] }),
          app1: d(16, -10, { color: `teal`, glyph: `server`, label: [`ECS Task (AZ-a)`] }),
          app2: d(16, 2, { color: `teal`, glyph: `server`, label: [`ECS Task (AZ-b)`] }),
        },
        links: {
          u_igw: h(`users`, `igw`, [`users`, `igw`], { heads: `both` }),
          igw_alb: h(`igw`, `alb`, [`igw`, `alb`], { heads: `both` }),
          alb_1: h(`alb`, `app1`, [`alb`, `app1`], { heads: `both` }),
          alb_2: h(`alb`, `app2`, [`alb`, `app2`], { heads: `both` }),
        },
        flows: [
          { route: [`u_igw`, `igw_alb`], bounce: true, rate: 2.0 },
          { route: [`alb_1`], bounce: true, rate: 1.0 },
          { route: [`alb_2`], bounce: true, rate: 1.0 },
        ],
      },
    },
    {
      short: `NAT Gateway`,
      chapter: `technique`,
      title: `NAT Gateway for Private Outbound Access`,
      body: [
        `App instances in private subnets must never accept incoming connections from the Internet, but they still need to download OS updates, NPM packages, and external SaaS APIs.`,
        `A <strong>Managed NAT Gateway</strong> is placed in the Public Subnet with an Elastic IP (EIP). Private route tables point <code>0.0.0.0/0 → nat-xxxx</code>.`,
      ],
      callout: {
        kind: `warn`,
        text: `NAT Gateways are AZ-specific. For high availability in production, deploy one NAT Gateway per Availability Zone so a single AZ failure does not kill outbound traffic.`,
      },
      changes: [
        `+ NAT Gateway + EIP in Public Subnet`,
        `+ Private Route Table: 0.0.0.0/0 → nat-gw`,
        `+ Outbound HTTPS enabled, Zero Inbound exposure`,
      ],
      metrics: {
        cidr_block: `10.0.0.0/16`,
        igw_state: `Attached`,
        subnets: `4 Subnets`,
        nat_gw: `Active (EIP)`,
        sec_groups: `Strict`,
      },
      scene: {
        entities: {
          app_priv: d(-14, -4, { color: `blue`, glyph: `cpu`, label: [`Backend Compute`, `Private 10.0.10.x`] }),
          nat: d(-4, -4, { color: `yellow`, glyph: `shield`, label: [`NAT Gateway`, `Elastic IP`] }),
          igw: d(6, -4, { color: `orange`, glyph: `globe`, label: [`Internet Gateway`] }),
          repos: y(16, -4, { label: `External Yum/GitHub` }),
        },
        links: {
          app_nat: h(`app_priv`, `nat`, [`app_priv`, `nat`], { heads: `end`, label: `Outbound Only` }),
          nat_igw: h(`nat`, `igw`, [`nat`, `igw`], { heads: `end`, label: `SNAT` }),
          igw_ext: h(`igw`, `repos`, [`igw`, `repos`], { heads: `both` }),
        },
        flows: [
          { route: [`app_nat`, `nat_igw`, `igw_ext`], bounce: true, rate: 1.8 },
        ],
      },
    },
    {
      short: `SG vs NACL`,
      chapter: `insight`,
      title: `Security Groups (Stateful) vs Network ACLs (Stateless)`,
      body: [
        `Security in AWS operates in depth on two distinct layers:`,
        `1. <strong>Security Group (Instance Level, Stateful)</strong>: If inbound traffic is allowed on port 443, the response is automatically allowed outbound regardless of outbound rules.`,
        `2. <strong>Network ACL (Subnet Level, Stateless)</strong>: Acts as a subnet firewall with numbered allow/deny rules evaluated in order. Return traffic must be explicitly allowed via ephemeral ports (1024–65535).`,
      ],
      callout: {
        kind: `insight`,
        text: `Security groups can reference other Security Groups! For example: App SG allows port 8080 ONLY from ALB SG, preventing direct bypass.`,
      },
      changes: [
        `+ NACL rules evaluated at Subnet boundary`,
        `+ Security Group attached directly to ENIs`,
        `+ Chained SG: ALB_SG → App_SG → DB_SG`,
      ],
      metrics: {
        cidr_block: `10.0.0.0/16`,
        igw_state: `Attached`,
        subnets: `4 Subnets`,
        nat_gw: `Multi-AZ`,
        sec_groups: `Chained SGs`,
      },
      scene: {
        entities: {
          alb_sg: d(-10, -4, { color: `orange`, glyph: `balancer`, label: [`ALB SecGroup`, `In: 443`] }),
          app_sg: d(0, 0, { color: `teal`, glyph: `server`, label: [`App SecGroup`, `In: From ALB_SG`] }),
          db_sg: b(10, 4, { label: `DB SecGroup (In: 5432 App_SG)`, color: `purple` }),
        },
        links: {
          sg1: h(`alb_sg`, `app_sg`, [`alb_sg`, `app_sg`], { heads: `both`, label: `Port 8080` }),
          sg2: h(`app_sg`, `db_sg`, [`app_sg`, `db_sg`], { heads: `both`, label: `Port 5432` }),
        },
        flows: [
          { route: [`sg1`, `sg2`], bounce: true, rate: 1.5 },
        ],
      },
    },
    {
      short: `VPC Endpoints`,
      chapter: `deep`,
      title: `VPC Endpoints & AWS PrivateLink`,
      body: [
        `Sending gigabytes of S3 backups or DynamoDB queries through a NAT Gateway is expensive ($0.045/GB data processing).`,
        `<strong>Gateway Endpoints</strong> (Free for S3 & DynamoDB) update route tables to keep all traffic entirely inside the AWS private backbone.`,
        `<strong>Interface Endpoints (PrivateLink)</strong> deploy an Elastic Network Interface (ENI) with a private IP directly into your subnet for AWS services (Secrets Manager, SQS, Kinesis).`,
      ],
      callout: {
        kind: `tip`,
        text: `Gateway Endpoints for Amazon S3 and DynamoDB are completely free and remove NAT Gateway data transfer bottlenecks.`,
      },
      changes: [
        `+ S3 Gateway Endpoint attached to Route Table`,
        `+ PrivateLink ENI deployed for Secrets Manager`,
        `+ Zero NAT GW bandwidth costs for S3`,
      ],
      metrics: {
        cidr_block: `10.0.0.0/16`,
        igw_state: `Attached`,
        subnets: `4 Subnets`,
        nat_gw: `Bypassed for S3`,
        sec_groups: `Enforced`,
      },
      scene: {
        entities: {
          app: d(-10, -4, { color: `teal`, glyph: `server`, label: [`Private App Node`] }),
          vpce: d(0, 0, { color: `green`, glyph: `shield`, label: [`S3 Gateway Endpoint`, `Route Table Entry`] }),
          s3: b(10, 4, { label: `Amazon S3 Storage`, color: `green` }),
        },
        links: {
          app_vpce: h(`app`, `vpce`, [`app`, `vpce`], { heads: `both`, label: `AWS Backbone` }),
          vpce_s3: h(`vpce`, `s3`, [`vpce`, `s3`], { heads: `both` }),
        },
        flows: [
          { route: [`app_vpce`, `vpce_s3`], bounce: true, rate: 2.2 },
        ],
      },
    },
  ],
};

export default awsVpcLesson;
