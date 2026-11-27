import {
  makeBlock,
  makeDb,
  makeDevice,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const awsEdgeSecurityLesson: Lesson = {
  id: 'aws-edge-security',
  title: 'Edge Security: CloudFront OAC, WAF, Shield & GuardDuty',
  summary:
    'Protect AWS architectures end-to-end: CloudFront Origin Access Control (OAC) for private S3, AWS WAF L7 rules, Shield Advanced DDoS mitigation, Security Groups vs NACLs, and GuardDuty/Macie.',
  minutes: 13,
  level: 'intermediate',
  metrics: ['layer', 'protection', 'statefulness', 'threat_intel'],
  legend: ['flow', ['req', 'valid traffic'], ['res', 'mitigated / OAC'], ['fail', 'blocked attack']],
  goals: [
    { text: 'Lock down private S3 origins with CloudFront OAC', step: 1 },
    { text: 'Block SQLi, XSS & bad bots at L7 with AWS WAF', step: 2 },
    { text: 'Absorb L3/L4 volumetric DDoS with AWS Shield', step: 3 },
    { text: 'Combine Stateful Security Groups & Stateless NACLs', step: 4 },
    { text: 'Detect anomalous threats with GuardDuty & Inspector', step: 5 },
    { text: 'Discover PII & secrets in S3 with Amazon Macie', step: 6 },
  ],
  steps: [
    {
      short: 'CloudFront OAC',
      chapter: 'edge',
      title: 'CloudFront OAC (Private S3 Origin)',
      body: [
        'Never make an S3 bucket public just to serve website assets. Keep <strong>Block Public Access = ON</strong> and place <strong>Amazon CloudFront</strong> in front.',
        'Configure <strong>Origin Access Control (OAC)</strong> (the modern replacement for legacy OAI): CloudFront signs origin requests with SigV4, and the S3 Bucket Policy allows <em>only</em> that CloudFront distribution ARN.',
      ],
      callout: {
        kind: 'tip',
        text: 'OAC supports SSE-KMS encrypted S3 buckets and all regions, whereas legacy OAI did not support SSE-KMS.',
      },
      metrics: { layer: 'Edge + S3', protection: 'OAC SigV4', statefulness: 'Signed Origin', threat_intel: 'Zero Public S3' },
      scene: {
        entities: {
          user: makeDevice(-15, -8, { label: 'Browser' }),
          cf: makeBlock(0, -8, { s: 4.6, h: 52, color: 'cyan', glyph: 'globe', label: ['CloudFront'], sub: 'OAC SigV4' }),
          s3: makeDb(15, -8, { r: 2.2, h: 48, color: 'orange', label: ['Private S3'], sub: 'Public Blocked' }),
          card: makePanel({ x: -12, y: 12 }, 'S3 Bucket Policy for CloudFront OAC', [
            '{ "Effect": "Allow",',
            '  "Principal": { "Service": "cloudfront.amazonaws.com" },',
            '  "Action": "s3:GetObject",',
            '  "Condition": { "StringEquals": {',
            '    "AWS:SourceArn": "arn:aws:cloudfront::1111:distribution/E1X"',
            '  } } }',
          ], { icon: 'terminal' }),
        },
        links: {
          u_cf: makeLink('user', 'cf', ['user', 'cf'], { heads: 'end', label: 'HTTPS' }),
          cf_s3: makeLink('cf', 's3', ['cf', 's3'], { heads: 'end', label: 'OAC SigV4' }),
        },
        flows: [{ route: ['u_cf', 'cf_s3'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'AWS WAF',
      chapter: 'edge',
      title: 'AWS WAF: Layer 7 Rules, SQLi & Rate Limits',
      body: [
        '<strong>AWS WAF</strong> inspects HTTP/HTTPS (Layer 7) traffic on CloudFront, ALB, API Gateway, or AppSync.',
        'Attach Managed Rule Groups to block <strong>SQL Injection</strong>, <strong>XSS</strong>, bad bots, geo-blocks, and IP rate-based rules (e.g., > 2,000 req / 5 min per IP).',
      ],
      callout: {
        kind: 'insight',
        text: 'WAF is for Layer 7 HTTP inspection; it does NOT attach directly to EC2 instances or NLBs (use ALB or CloudFront).',
      },
      changes: ['+ AWS WAF filters L7 SQLi/XSS & rate-limits abusers', '+ Clean requests pass to ALB; attacks get HTTP 403'],
      metrics: { layer: 'Layer 7 HTTP', protection: 'WAF WebACL', statefulness: 'Rule Priority', threat_intel: 'SQLi / Rate' },
      scene: {
        entities: {
          attacker: makeDevice(-15, -14, { label: 'SQLi Bot', tags: [{ text: 'ATTACK', tone: 'red', icon: 'alert' }] }),
          waf: makeBlock(0, -8, { s: 4.6, h: 52, color: 'purple', glyph: 'shield', label: ['AWS WAF'], sub: 'L7 WebACL' }),
          alb: makeBlock(15, -8, { s: 4.4, h: 50, color: 'green', glyph: 'balancer', label: ['Origin ALB'], sub: 'Clean Traffic' }),
          card: makePanel({ x: -12, y: 12 }, 'AWS WAF WebACL Protection', [
            '// Supported targets: CloudFront, ALB, API Gateway, AppSync',
            '// Rule 1 (Priority 1): RateBasedStatement (Limit: 2000/5m)',
            '// Rule 2 (Priority 2): AWSManagedRulesSQLiRuleSet -> BLOCK',
            '// Rule 3 (Priority 3): GeoMatch (Block restricted countries)',
          ], { icon: 'terminal' }),
        },
        links: {
          atk_waf: makeLink('attacker', 'waf', ['attacker', 'waf'], { heads: 'end', label: 'OR 1=1' }),
          waf_alb: makeLink('waf', 'alb', ['waf', 'alb'], { heads: 'end', label: 'clean only' }),
        },
        flows: [
          { route: ['atk_waf'], kind: 'fail', rate: 1.6 },
          { route: ['waf_alb'], kind: 'res', rate: 1.8 },
        ],
      },
    },
    {
      short: 'AWS Shield',
      chapter: 'edge',
      title: 'AWS Shield Standard vs Shield Advanced',
      body: [
        '<strong>AWS Shield Standard</strong> is free and automatically protects all AWS customers against common L3/L4 SYN/UDP floods at the edge.',
        '<strong>AWS Shield Advanced</strong> ($3,000/mo) adds L7 DDoS mitigation, 24/7 AWS DDoS Response Team (DRT), WAF cost inclusion, and <strong>cost protection</strong> against auto-scaling bill spikes during an attack.',
      ],
      callout: {
        kind: 'tip',
        text: 'Exam keyword: "24/7 DDoS Response Team + financial DDoS cost protection" -> AWS Shield Advanced.',
      },
      changes: ['+ Shield scrubs volumetric L3/L4 floods at Edge', '+ Shield Advanced includes DRT + scaling cost protection'],
      metrics: { layer: 'Layer 3/4/7', protection: 'Shield Adv', statefulness: 'Inline Scrub', threat_intel: '24/7 DRT' },
      scene: {
        entities: {
          ddos: makeDevice(-15, -8, { label: 'DDoS Flood' }),
          shield: makeBlock(0, -8, { s: 4.8, h: 54, color: 'blue', glyph: 'shield', label: ['AWS Shield'], sub: 'L3/L4 Scrub' }),
          edge: makeBlock(15, -8, { s: 4.4, h: 50, color: 'green', glyph: 'globe', label: ['Route 53 / CF'], sub: '100% Healthy' }),
          card: makePanel({ x: -12, y: 12 }, 'Shield Standard vs Advanced', [
            '// Shield Standard: Free, automatic L3/L4 SYN/UDP mitigation',
            '// Shield Advanced: CloudFront, Route 53, Global Accelerator, ALB, EIP',
            '//   + 24/7 Shield Response Team (SRT) access',
            '//   + Automatic DDoS bill-spike credit protection',
          ], { icon: 'terminal' }),
        },
        links: {
          d_sh: makeLink('ddos', 'shield', ['ddos', 'shield'], { heads: 'end', label: '100 Gbps' }),
          sh_ed: makeLink('shield', 'edge', ['shield', 'edge'], { heads: 'end', label: 'scrubbed' }),
        },
        flows: [{ route: ['d_sh', 'sh_ed'], kind: 'res', rate: 2.0 }],
      },
    },
    {
      short: 'SG vs NACL',
      chapter: 'vpc-sec',
      title: 'Stateful Security Groups vs Stateless NACLs',
      body: [
        'Inside the VPC, <strong>Network ACLs (NACLs)</strong> guard at the <strong>Subnet</strong> level: they are <strong>stateless</strong> (must allow ephemeral return ports <code>1024–65535</code>) and support explicit <strong>DENY</strong> rules (evaluated by lowest rule # first).',
        '<strong>Security Groups (SGs)</strong> guard at the <strong>ENI/Instance</strong> level: they are <strong>stateful</strong> (return traffic auto-allowed) and support Allow rules only.',
      ],
      callout: {
        kind: 'warning',
        text: 'Need to block a specific attacker IP inside a VPC? Use a NACL Deny rule — Security Groups CANNOT deny IPs!',
      },
      changes: ['+ Subnet NACL evaluates Allow/Deny in rule # order', '+ ENI Security Group tracks state for return packets'],
      metrics: { layer: 'Subnet + ENI', protection: 'NACL + SG', statefulness: 'Stateless + Stateful', threat_intel: 'IP Deny @ NACL' },
      scene: {
        entities: {
          ingress: makeDevice(-15, -8, { label: 'VPC Ingress' }),
          nacl: makeBlock(0, -8, { s: 4.4, h: 50, color: 'orange', glyph: 'shield', label: ['Subnet NACL'], sub: 'Stateless Deny' }),
          sg: makeBlock(15, -8, { s: 4.4, h: 50, color: 'green', glyph: 'server', label: ['Security Group'], sub: 'Stateful Allow' }),
          card: makePanel({ x: -12, y: 12 }, 'NACL vs Security Group Rules', [
            '// NACL (Subnet): Stateless | Allow & Deny | Rule # order (100, 200...)',
            '//   -> Must open outbound ephemeral ports 1024-65535!',
            '// Security Group (ENI): Stateful | Allow ONLY | All rules evaluated',
            '//   -> Can reference another Security Group ID (sg-web -> sg-db)',
          ], { icon: 'terminal' }),
        },
        links: {
          in_nacl: makeLink('ingress', 'nacl', ['ingress', 'nacl'], { heads: 'end', label: 'rule #100' }),
          nacl_sg: makeLink('nacl', 'sg', ['nacl', 'sg'], { heads: 'end', label: 'stateful ENI' }),
        },
        flows: [{ route: ['in_nacl', 'nacl_sg'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'GuardDuty',
      chapter: 'detection',
      title: 'Amazon GuardDuty & Amazon Inspector',
      body: [
        '<strong>Amazon GuardDuty</strong> uses ML and threat intelligence to continuously analyze <strong>CloudTrail</strong>, <strong>VPC Flow Logs</strong>, and <strong>DNS Logs</strong> — detecting crypto-mining, compromised IAM keys, or port scans with zero agents.',
        '<strong>Amazon Inspector</strong> continuously scans EC2, ECR container images, and Lambda functions for software CVEs and unintended network exposure.',
      ],
      callout: {
        kind: 'insight',
        text: 'GuardDuty = behavioral threat detection (logs); Inspector = CVE vulnerability scanning (EC2/ECR/Lambda).',
      },
      changes: ['+ GuardDuty analyzes CloudTrail, VPC Flow & DNS logs', '+ EventBridge triggers automated quarantine remediation'],
      metrics: { layer: 'Threat Detect', protection: 'GuardDuty', statefulness: 'ML + ThreatIntel', threat_intel: 'Zero Agents' },
      scene: {
        entities: {
          logs: makeDb(-14, -8, { r: 2.2, h: 48, color: 'blue', label: ['Telemetry Logs'], sub: 'Flow+DNS+Trail' }),
          gd: makeBlock(1, -8, { s: 4.6, h: 52, color: 'purple', glyph: 'cpu', label: ['GuardDuty ML'], sub: 'Threat Alert' }),
          eb: makeBlock(15, -8, { s: 4.4, h: 50, color: 'orange', glyph: 'zap', label: ['EventBridge'], sub: 'Quarantine' }),
          card: makePanel({ x: -12, y: 12 }, 'GuardDuty Automated Threat Response', [
            '// GuardDuty sources: CloudTrail + VPC Flow Logs + Route53 DNS',
            '// Finding: CryptoCurrency:EC2/BitcoinTool.B!DNS',
            '// EventBridge Rule -> Lambda -> Isolate EC2 Security Group',
            '// Inspector: scans ECR images & EC2 SSM for CVEs',
          ], { icon: 'terminal' }),
        },
        links: {
          log_gd: makeLink('logs', 'gd', ['logs', 'gd'], { heads: 'end', label: 'stream logs' }),
          gd_eb: makeLink('gd', 'eb', ['gd', 'eb'], { heads: 'end', label: 'finding event' }),
        },
        flows: [{ route: ['log_gd', 'gd_eb'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'Macie PII',
      chapter: 'detection',
      title: 'Amazon Macie (PII & Sensitive Data Discovery)',
      body: [
        '<strong>Amazon Macie</strong> uses ML and pattern matching to scan S3 buckets and discover sensitive data: <strong>PII</strong> (SSNs, credit cards, passport numbers), financial data, or leaked AWS keys.',
        'Macie also audits S3 bucket encryption and public-access posture across your entire AWS Organization via <strong>Security Hub</strong>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Exam keyword: "Automatically discover PII / credit cards / sensitive data stored in S3 buckets" -> Amazon Macie.',
      },
      changes: ['+ Amazon Macie scans S3 objects for PII & secrets', '+ Publishes findings to Security Hub & EventBridge'],
      metrics: { layer: 'Data Security', protection: 'Amazon Macie', statefulness: 'ML Classifier', threat_intel: 'PII / PCI / HIPAA' },
      scene: {
        entities: {
          s3: makeDb(-14, -8, { r: 2.2, h: 48, color: 'orange', label: ['S3 Data Lake'], sub: 'raw CSV/JSON' }),
          macie: makeBlock(1, -8, { s: 4.6, h: 52, color: 'cyan', glyph: 'shield', label: ['Amazon Macie'], sub: 'PII Classifier' }),
          hub: makeBlock(15, -8, { s: 4.4, h: 50, color: 'green', glyph: 'layers', label: ['Security Hub'], sub: 'Policy Alert' }),
          card: makePanel({ x: -12, y: 12 }, 'Amazon Macie PII Discovery', [
            '// Macie scans S3 objects for PII, PHI, PCI & AWS Secret Keys',
            '// Finding: SensitiveData:S3Object/Personal -> 1,420 Credit Cards',
            '// Combine with EventBridge -> move object to encrypted vault',
          ], { icon: 'terminal' }),
        },
        links: {
          s3_mac: makeLink('s3', 'macie', ['s3', 'macie'], { heads: 'end', label: 'scan S3' }),
          mac_hub: makeLink('macie', 'hub', ['macie', 'hub'], { heads: 'end', label: 'PII finding' }),
        },
        flows: [{ route: ['s3_mac', 'mac_hub'], kind: 'res', rate: 1.7 }],
      },
    },
  ],
};
