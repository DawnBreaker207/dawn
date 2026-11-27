import {
  makeBlock,
  makeDb,
  makeDevice,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const awsHybridNetworkLesson: Lesson = {
  id: 'aws-hybrid-network',
  title: 'VPC Endpoints, Transit Gateway, VPN & Direct Connect',
  summary:
    'Master AWS SAA-C03 Hybrid & Multi-VPC networking: Gateway vs Interface VPC Endpoints (PrivateLink), non-transitive VPC Peering, Transit Gateway hub-and-spoke, Site-to-Site VPN, and Direct Connect.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['connectivity', 'transitivity', 'bandwidth', 'privacy'],
  legend: ['flow', ['req', 'private traffic'], ['res', 'AWS backbone'], ['fail', 'blocked hop']],
  goals: [
    { text: 'Keep S3/DynamoDB traffic private via Gateway Endpoints', step: 1 },
    { text: 'Expose SaaS/AWS services privately with PrivateLink', step: 2 },
    { text: 'Understand VPC Peering non-transitive limitation', step: 3 },
    { text: 'Scale multi-VPC topology with AWS Transit Gateway', step: 4 },
    { text: 'Connect on-prem fast via Site-to-Site VPN', step: 5 },
    { text: 'Provision dedicated fiber with Direct Connect & DXGW', step: 6 },
  ],
  steps: [
    {
      short: 'Gateway EP',
      chapter: 'endpoints',
      title: 'Gateway VPC Endpoints (S3 & DynamoDB)',
      body: [
        'By default, private EC2 instances reach S3 through a NAT Gateway + Internet Gateway, incurring NAT data-processing fees.',
        'A <strong>Gateway VPC Endpoint</strong> adds a prefix-list route directly in your VPC Route Table. Traffic stays 100% on the AWS private backbone — <strong>free of charge</strong> (only for S3 and DynamoDB).',
      ],
      callout: {
        kind: 'tip',
        text: 'Gateway Endpoints are free and support ONLY Amazon S3 and DynamoDB via Route Table entries.',
      },
      metrics: { connectivity: 'Gateway EP', transitivity: 'VPC Local', bandwidth: 'AWS Backbone', privacy: 'No Internet' },
      scene: {
        entities: {
          privEc2: makeBlock(-14, -8, { s: 4.4, h: 50, color: 'blue', glyph: 'server', label: ['Private EC2'], sub: '10.0.2.15' }),
          rt: makeBlock(0, -8, { s: 4.4, h: 50, color: 'cyan', glyph: 'route', label: ['Route Table'], sub: 'pl-s3 -> vpce' }),
          s3: makeDb(15, -8, { r: 2.2, h: 48, color: 'orange', label: ['Amazon S3'], sub: 'AWS Backbone' }),
          card: makePanel({ x: -12, y: 12 }, 'Free Private S3/DynamoDB Routing', [
            '// VPC Route Table entry added automatically:',
            'Destination: pl-63a5400a (com.amazonaws.ap-southeast-1.s3)',
            'Target:      vpce-0a1b2c3d4e (Gateway Endpoint)',
            '// Cost: $0/hr, $0/GB (bypasses NAT Gateway entirely)',
          ], { icon: 'terminal' }),
        },
        links: {
          ec2_rt: makeLink('privEc2', 'rt', ['privEc2', 'rt'], { heads: 'end', label: 'S3 API' }),
          rt_s3: makeLink('rt', 's3', ['rt', 's3'], { heads: 'end', label: 'private hop' }),
        },
        flows: [{ route: ['ec2_rt', 'rt_s3'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'PrivateLink',
      chapter: 'endpoints',
      title: 'Interface Endpoints & AWS PrivateLink',
      body: [
        'For all other AWS services (SQS, KMS, Secrets Manager, ECR) or your own SaaS across VPCs, use an <strong>Interface VPC Endpoint (AWS PrivateLink)</strong>.',
        'It places an <strong>ENI with a private IP</strong> inside your subnet and connects to a Provider’s <strong>Network Load Balancer (NLB)</strong> — no IGW, no NAT, and even works with overlapping CIDRs!',
      ],
      callout: {
        kind: 'insight',
        text: 'PrivateLink is unidirectional (consumer -> provider NLB) and works even when Consumer & Provider VPC CIDRs overlap.',
      },
      changes: ['+ Interface Endpoint creates private ENI in subnet', '+ Connects privately to Provider NLB via PrivateLink'],
      metrics: { connectivity: 'PrivateLink ENI', transitivity: '1-Way Service', bandwidth: 'Up to 100 Gbps', privacy: 'Overlapping OK' },
      scene: {
        entities: {
          consumer: makeBlock(-14, -8, { s: 4.4, h: 50, color: 'blue', glyph: 'server', label: ['Consumer App'], sub: '10.0.0.0/16' }),
          eni: makeBlock(0, -8, { s: 4.4, h: 50, color: 'purple', glyph: 'shield', label: ['Interface ENI'], sub: '10.0.2.88' }),
          nlb: makeBlock(15, -8, { s: 4.4, h: 50, color: 'green', glyph: 'balancer', label: ['Provider NLB'], sub: '10.0.0.0/16 OK' }),
          card: makePanel({ x: -12, y: 12 }, 'AWS PrivateLink Architecture', [
            '// Consumer VPC -> Interface ENI -> Provider Endpoint Service (NLB)',
            'aws ec2 create-vpc-endpoint --vpc-endpoint-type Interface \\',
            '  --service-name com.amazonaws.vpce.us-east-1.vpce-svc-09f...',
            '// No VPC Peering needed; overlapping CIDRs allowed!',
          ], { icon: 'terminal' }),
        },
        links: {
          c_eni: makeLink('consumer', 'eni', ['consumer', 'eni'], { heads: 'end', label: 'private DNS' }),
          eni_nlb: makeLink('eni', 'nlb', ['eni', 'nlb'], { heads: 'end', label: 'PrivateLink' }),
        },
        flows: [{ route: ['c_eni', 'eni_nlb'], kind: 'req', rate: 1.9 }],
      },
    },
    {
      short: 'VPC Peering',
      chapter: 'multi-vpc',
      title: 'VPC Peering & Non-Transitive Limitation',
      body: [
        '<strong>VPC Peering</strong> links two VPCs directly with private IPs (same or cross-region, same or cross-account), provided their CIDR blocks do NOT overlap.',
        'Critical SAA-C03 rule: VPC Peering is <strong>non-transitive</strong>. If VPC A peers with B, and B peers with C, A cannot reach C through B — you need a full mesh $N(N-1)/2$ or a Transit Gateway.',
      ],
      callout: {
        kind: 'warning',
        text: 'Non-transitive routing: A <-> B and B <-> C does NOT allow A -> C. You must peer A <-> C or use Transit Gateway.',
      },
      changes: ['+ VPC A peers with B; B peers with C', '+ Direct A -> C route blocked (non-transitive)'],
      metrics: { connectivity: 'VPC Peering', transitivity: 'Non-Transitive', bandwidth: 'No Limit', privacy: 'No Overlap CIDR' },
      scene: {
        entities: {
          vpcA: makeBlock(-14, -8, { s: 4.4, h: 50, color: 'blue', glyph: 'boxes', label: ['VPC A'], sub: '10.1.0.0/16' }),
          vpcB: makeBlock(0, -14, { s: 4.4, h: 50, color: 'green', glyph: 'boxes', label: ['VPC B'], sub: '10.2.0.0/16' }),
          vpcC: makeBlock(14, -8, { s: 4.4, h: 50, color: 'purple', glyph: 'boxes', label: ['VPC C'], sub: '10.3.0.0/16' }),
          card: makePanel({ x: -12, y: 12 }, 'Non-Transitive VPC Peering', [
            '// Peering 1: VPC A (10.1/16) <-> VPC B (10.2/16)  [OK]',
            '// Peering 2: VPC B (10.2/16) <-> VPC C (10.3/16)  [OK]',
            '// Traffic VPC A -> VPC B -> VPC C: DROPPED!',
            '// Full mesh for 10 VPCs = 10 * 9 / 2 = 45 peering links',
          ], { icon: 'terminal' }),
        },
        links: {
          a_b: makeLink('vpcA', 'vpcB', ['vpcA', 'vpcB'], { heads: 'both', label: 'pcx-1' }),
          b_c: makeLink('vpcB', 'vpcC', ['vpcB', 'vpcC'], { heads: 'both', label: 'pcx-2' }),
          a_c_no: makeLink('vpcA', 'vpcC', ['vpcA', 'vpcC'], { heads: 'end', label: 'no transit', style: 'dashed' }),
        },
        flows: [
          { route: ['a_b'], kind: 'res', rate: 1.6 },
          { route: ['a_c_no'], kind: 'fail', rate: 1.4 },
        ],
      },
    },
    {
      short: 'Transit GW',
      chapter: 'multi-vpc',
      title: 'AWS Transit Gateway (Hub-and-Spoke)',
      body: [
        '<strong>AWS Transit Gateway (TGW)</strong> acts as a regional cloud router connecting thousands of VPCs, VPNs, and Direct Connect gateways in a clean <strong>hub-and-spoke</strong> topology.',
        'TGW supports <strong>transitive routing</strong>, ECMP across multiple VPN tunnels, and centralized Route Tables to isolate Prod vs Dev VPCs.',
      ],
      callout: {
        kind: 'insight',
        text: 'Whenever an exam question mentions connecting 10–100+ VPCs and on-prem networks centrally, choose Transit Gateway.',
      },
      changes: ['+ Transit Gateway replaces peering mesh with Hub-and-Spoke', '+ Transitive routing enabled across VPCs & on-prem'],
      metrics: { connectivity: 'Transit GW', transitivity: 'Transitive Hub', bandwidth: '50 Gbps/AZ', privacy: 'Central RT' },
      scene: {
        entities: {
          vpc1: makeBlock(-14, -15, { s: 4.2, h: 48, color: 'blue', glyph: 'boxes', label: ['Prod VPC'], sub: '10.1.0.0/16' }),
          vpc2: makeBlock(-14, -2, { s: 4.2, h: 48, color: 'cyan', glyph: 'boxes', label: ['Shared VPC'], sub: '10.2.0.0/16' }),
          tgw: makeBlock(1, -8, { s: 4.8, h: 54, color: 'purple', glyph: 'balancer', label: ['Transit Gateway'], sub: 'Region Router' }),
          vpc3: makeBlock(15, -8, { s: 4.2, h: 48, color: 'green', glyph: 'boxes', label: ['Data VPC'], sub: '10.3.0.0/16' }),
          card: makePanel({ x: -12, y: 12 }, 'Transit Gateway Hub-and-Spoke', [
            '// Each VPC attaches once to TGW (O(N) instead of O(N^2))',
            'aws ec2 create-transit-gateway-vpc-attachment \\',
            '  --transit-gateway-id tgw-0abc... --vpc-id vpc-prod',
            '// Supports Inter-Region TGW Peering & IP Multicast',
          ], { icon: 'terminal' }),
        },
        links: {
          v1_t: makeLink('vpc1', 'tgw', ['vpc1', 'tgw'], { heads: 'both', label: 'attach' }),
          v2_t: makeLink('vpc2', 'tgw', ['vpc2', 'tgw'], { heads: 'both', label: 'attach' }),
          t_v3: makeLink('tgw', 'vpc3', ['tgw', 'vpc3'], { heads: 'both', label: 'transitive' }),
        },
        flows: [
          { route: ['v1_t', 't_v3'], kind: 'res', rate: 1.9 },
          { route: ['v2_t'], kind: 'req', rate: 1.6 },
        ],
      },
    },
    {
      short: 'Site VPN',
      chapter: 'hybrid',
      title: 'AWS Site-to-Site VPN (Encrypted IPsec)',
      body: [
        'Need hybrid connectivity in <strong>minutes</strong>? <strong>Site-to-Site VPN</strong> builds two encrypted <strong>IPsec tunnels</strong> over the public internet between your on-prem <strong>Customer Gateway (CGW)</strong> and AWS <strong>Virtual Private Gateway (VGW)</strong> or Transit Gateway.',
        'Bandwidth is capped at <strong>1.25 Gbps per tunnel</strong> (unless aggregated via ECMP on Transit Gateway) and latency depends on internet routing.',
      ],
      callout: {
        kind: 'tip',
        text: 'Exam keyword: "Encrypted connection over internet set up quickly / backup for Direct Connect" -> Site-to-Site VPN.',
      },
      changes: ['+ Customer Gateway connects via dual IPsec tunnels', '+ Encrypted over public internet (~1.25 Gbps/tunnel)'],
      metrics: { connectivity: 'Site-to-Site VPN', transitivity: 'BGP / Static', bandwidth: '1.25 Gbps/tunnel', privacy: 'IPsec AES-256' },
      scene: {
        entities: {
          onprem: makeDevice(-15, -8, { label: 'On-Prem DC' }),
          cgw: makeBlock(-1, -8, { s: 4.4, h: 50, color: 'orange', glyph: 'shield', label: ['Customer GW'], sub: 'IPsec / BGP' }),
          vgw: makeBlock(14, -8, { s: 4.4, h: 50, color: 'purple', glyph: 'server', label: ['AWS VGW / TGW'], sub: '2x AZ Tunnels' }),
          card: makePanel({ x: -12, y: 12 }, 'Site-to-Site IPsec VPN', [
            '// Fast setup (< 1 hour), encrypted by default (IPsec)',
            '// Dual tunnels across 2 AZs for high availability',
            '// Max ~1.25 Gbps per tunnel; use TGW ECMP to scale',
            '// Great as quick link or failover backup for Direct Connect',
          ], { icon: 'terminal' }),
        },
        links: {
          op_cgw: makeLink('onprem', 'cgw', ['onprem', 'cgw'], { heads: 'end', label: 'LAN' }),
          cgw_vgw: makeLink('cgw', 'vgw', ['cgw', 'vgw'], { heads: 'both', label: 'IPsec VPN' }),
        },
        flows: [{ route: ['op_cgw', 'cgw_vgw'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Direct Connect',
      chapter: 'hybrid',
      title: 'AWS Direct Connect (DX) & DX Gateway',
      body: [
        '<strong>AWS Direct Connect (DX)</strong> provides a dedicated private physical fiber (1G / 10G / 100G) from your data center to an AWS DX location — delivering predictable low latency and lower data-transfer cost.',
        'Important: DX is <strong>not encrypted by default</strong> (add IPsec VPN or MACsec if required) and takes weeks/months to provision. Pair with <strong>Direct Connect Gateway</strong> to reach VPCs across multiple Regions.',
      ],
      callout: {
        kind: 'warning',
        text: 'Direct Connect is NOT encrypted at L3 by default. Combine DX + IPsec VPN (Public VIF) for end-to-end encryption!',
      },
      changes: ['+ Dedicated fiber via DX Location + DX Gateway', '+ Reaches multi-region VPCs with consistent low latency'],
      metrics: { connectivity: 'Direct Connect', transitivity: 'DX Gateway', bandwidth: '10–100 Gbps', privacy: 'Dedicated Fiber' },
      scene: {
        entities: {
          onprem: makeDevice(-15, -8, { label: 'On-Prem Fiber' }),
          dxgw: makeBlock(0, -8, { s: 4.6, h: 52, color: 'green', glyph: 'route', label: ['DX Gateway'], sub: 'Private VIF' }),
          tgw: makeBlock(15, -8, { s: 4.6, h: 52, color: 'purple', glyph: 'balancer', label: ['Multi-Region TGW'], sub: '10–100 Gbps' }),
          card: makePanel({ x: -12, y: 12 }, 'Direct Connect + DX Gateway', [
            '// Dedicated physical fiber: low jitter, high bandwidth',
            '// Private VIF -> VPC/TGW | Public VIF -> S3/DynamoDB',
            '// Not encrypted by default -> layer IPsec VPN or MACsec',
            '// Always pair with Site-to-Site VPN for resilient failover',
          ], { icon: 'terminal' }),
        },
        links: {
          op_dx: makeLink('onprem', 'dxgw', ['onprem', 'dxgw'], { heads: 'both', label: '10G fiber' }),
          dx_tgw: makeLink('dxgw', 'tgw', ['dxgw', 'tgw'], { heads: 'both', label: 'multi-region' }),
        },
        flows: [{ route: ['op_dx', 'dx_tgw'], kind: 'res', rate: 2.2 }],
      },
    },
  ],
};
