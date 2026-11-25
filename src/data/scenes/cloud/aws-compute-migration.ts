/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const awsComputeMigrationLesson: Lesson = {
  id: 'aws-compute-migration',
  title: 'Compute Pricing, LB Tiers, DR (RTO/RPO) & Migration',
  summary:
    'Master AWS SAA-C03 Compute & Cost Optimization: EC2 On-Demand/Savings Plans/Spot, ALB vs NLB vs GWLB, 4 Disaster Recovery Tiers (RTO/RPO), DMS/DataSync/Snowball, and CloudTrail/CloudWatch.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['cost_model', 'lb_layer', 'rto_rpo', 'migration'],
  legend: ['flow', ['req', 'workload / sync'], ['res', 'cost / DR ready'], ['fail', 'spot reclaim']],
  goals: [
    { text: 'Choose EC2 On-Demand, Savings Plans & Spot Instances', step: 1 },
    { text: 'Select ALB (L7) vs NLB (L4 Static IP) vs GWLB', step: 2 },
    { text: 'Compare 4 DR Tiers by RTO & RPO budgets', step: 3 },
    { text: 'Automate cross-region DB & backup recovery', step: 4 },
    { text: 'Migrate DBs & petabytes via DMS, DataSync & Snowball', step: 5 },
    { text: 'Audit APIs & trace apps with CloudTrail, Flow Logs & X-Ray', step: 6 },
  ],
  steps: [
    {
      short: 'EC2 Pricing',
      chapter: 'compute',
      title: '1. EC2 Pricing: On-Demand, Savings Plans & Spot',
      body: [
        'SAA-C03 heavily tests matching workloads to the cheapest EC2 model:',
        '• <strong>On-Demand</strong>: spiky/unpredictable short workloads.<br>• <strong>Compute Savings Plans</strong>: up to 66% off for steady 1–3 yr baselines (flexible across EC2, Fargate, Lambda!).<br>• <strong>Spot Instances</strong>: up to 90% off for fault-tolerant batch/ML/stateless workers (2-min interruption notice).',
      ],
      callout: {
        kind: 'tip',
        text: 'Exam keyword: "Fault-tolerant batch job / CI runner at lowest cost" -> Spot. "Steady 24/7 baseline across EC2 & Fargate" -> Compute Savings Plans.',
      },
      metrics: { cost_model: 'Spot + Savings', lb_layer: 'N/A', rto_rpo: '2-min Reclaim', migration: 'None' },
      scene: {
        entities: {
          asg: d(-14, -8, { s: 4.4, h: 50, color: 'blue', glyph: 'balancer', label: ['Mixed ASG'], sub: 'Base + Burst' }),
          savings: d(1, -15, { s: 4.4, h: 50, color: 'green', glyph: 'server', label: ['Savings Plan'], sub: '66% off steady' }),
          spot: d(1, -1, { s: 4.4, h: 50, color: 'orange', glyph: 'zap', label: ['Spot Fleet'], sub: '90% off (2m)' }),
          card: S({ x: -12, y: 12 }, '1. EC2 Purchasing Strategy Matrix', [
            '// On-Demand:     0% commit, spiky / unknown workloads',
            '// Savings Plans: 66% off, 1-3yr $/hr commit (EC2+Fargate+Lambda)',
            '// Spot:          90% off, stateless/batch, 2-min reclaim notice',
            '// Dedicated Host: BYOL per-socket / per-core licensing',
          ], { icon: 'terminal' }),
        },
        links: {
          asg_sav: h('asg', 'savings', ['asg', 'savings'], { heads: 'end', label: 'steady' }),
          asg_spot: h('asg', 'spot', ['asg', 'spot'], { heads: 'end', label: 'stateless burst' }),
        },
        flows: [
          { route: ['asg_sav'], kind: 'res', rate: 1.8 },
          { route: ['asg_spot'], kind: 'req', rate: 1.8 },
        ],
      },
    },
    {
      short: 'ALB vs NLB',
      chapter: 'compute',
      title: '2. Load Balancers: ALB vs NLB vs GWLB',
      body: [
        '• <strong>ALB (Layer 7)</strong>: HTTP/HTTPS/gRPC, path/host routing, Cognito/OIDC auth, WAF integration.<br>• <strong>NLB (Layer 4)</strong>: TCP/UDP/TLS, millions of req/s, ultra-low latency, <strong>Static Elastic IP per AZ</strong>, and required for <strong>AWS PrivateLink</strong>.<br>• <strong>GWLB (Layer 3/4)</strong>: GENEVE protocol for 3rd-party inline firewalls/IDS.',
      ],
      callout: {
        kind: 'insight',
        text: 'Need Static IP addresses or UDP or PrivateLink? Choose NLB. Need HTTP path routing or WAF? Choose ALB.',
      },
      changes: ['+ NLB provides Static Elastic IPs & L4 ultra-low latency', '+ ALB handles L7 HTTP routing & WAF inspection'],
      metrics: { cost_model: 'LCU Billing', lb_layer: 'L7 ALB / L4 NLB', rto_rpo: 'Multi-AZ', migration: 'None' },
      scene: {
        entities: {
          clients: y(-15, -8, { label: 'L4 / L7 Clients' }),
          alb: d(1, -15, { s: 4.4, h: 50, color: 'blue', glyph: 'balancer', label: ['ALB (Layer 7)'], sub: '/api + WAF' }),
          nlb: d(1, -1, { s: 4.4, h: 50, color: 'purple', glyph: 'balancer', label: ['NLB (Layer 4)'], sub: 'Static EIP' }),
          targets: d(15, -8, { s: 4.4, h: 50, color: 'green', glyph: 'server', label: ['ECS / EC2'], sub: 'Target Group' }),
          card: S({ x: -12, y: 12 }, '2. Choosing ALB vs NLB vs GWLB', [
            '// ALB:  HTTP/HTTPS/WebSocket/gRPC, path/header routing, WAF',
            '// NLB:  TCP/UDP, Static IP (EIP), PrivateLink, <100us overhead',
            '// GWLB: Inline 3rd-party firewall appliances (GENEVE port 6081)',
          ], { icon: 'terminal' }),
        },
        links: {
          c_alb: h('clients', 'alb', ['clients', 'alb'], { heads: 'end', label: 'HTTPS /api' }),
          c_nlb: h('clients', 'nlb', ['clients', 'nlb'], { heads: 'end', label: 'TCP Static IP' }),
          alb_t: h('alb', 'targets', ['alb', 'targets'], { heads: 'end', label: 'HTTP' }),
          nlb_t: h('nlb', 'targets', ['nlb', 'targets'], { heads: 'end', label: 'TCP' }),
        },
        flows: [
          { route: ['c_alb', 'alb_t'], kind: 'req', rate: 1.9 },
          { route: ['c_nlb', 'nlb_t'], kind: 'res', rate: 2.1 },
        ],
      },
    },
    {
      short: '4 DR Tiers',
      chapter: 'dr',
      title: '3. Disaster Recovery: 4 Tiers (RTO vs RPO)',
      body: [
        'From lowest cost (hours RTO/RPO) to zero downtime (seconds RTO/RPO):',
        '1. <strong>Backup & Restore</strong>: cheapest, S3/AWS Backup snapshots.<br>2. <strong>Pilot Light</strong>: core DB replicated live, compute off.<br>3. <strong>Warm Standby</strong>: scaled-down full stack running.<br>4. <strong>Multi-Site Active-Active</strong>: Route 53 routes live to both Regions.',
      ],
      callout: {
        kind: 'insight',
        text: 'Pilot Light keeps ONLY critical data/DB live; Warm Standby runs a minimal version of the full application stack.',
      },
      changes: ['+ Primary Region replicates async to DR Region', '+ DR tier trades standby cost for lower RTO/RPO'],
      metrics: { cost_model: 'Cost vs RTO', lb_layer: 'Route 53 Failover', rto_rpo: '4 DR Tiers', migration: 'Cross-Region' },
      scene: {
        entities: {
          pri: d(-14, -8, { s: 4.6, h: 52, color: 'green', glyph: 'server', label: ['Primary Region'], sub: 'us-east-1 Live' }),
          rep: d(0, -8, { s: 4.4, h: 50, color: 'cyan', glyph: 'route', label: ['DR Replication'], sub: 'S3 CRR + Sync' }),
          dr: d(15, -8, { s: 4.6, h: 52, color: 'orange', glyph: 'database', label: ['DR Region'], sub: 'Pilot / Warm' }),
          card: S({ x: -12, y: 12 }, '3. AWS 4 DR Tiers (Cost vs RTO/RPO)', [
            '// 1. Backup & Restore:   RPO/RTO = Hours     | Cost: $',
            '// 2. Pilot Light:        RPO=Mins, RTO=10s m | Cost: $$ (DB only)',
            '// 3. Warm Standby:       RPO=Secs, RTO=Mins  | Cost: $$$ (Mini stack)',
            '// 4. Active-Active:      RPO/RTO ~ 0         | Cost: $$$$ (Full)',
          ], { icon: 'terminal' }),
        },
        links: {
          p_rep: h('pri', 'rep', ['pri', 'rep'], { heads: 'end', label: 'async stream' }),
          rep_dr: h('rep', 'dr', ['rep', 'dr'], { heads: 'end', label: 'standby sync' }),
        },
        flows: [{ route: ['p_rep', 'rep_dr'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'AWS Backup',
      chapter: 'dr',
      title: '4. Centralized AWS Backup & Vault Lock (WORM)',
      body: [
        '<strong>AWS Backup</strong> centralizes scheduled snapshots across EBS, RDS, DynamoDB, EFS, and S3 with cross-account and cross-region copy.',
        'Enable <strong>AWS Backup Vault Lock</strong> (WORM — Write-Once-Read-Many) so not even the AWS root user or a compromised admin can delete backups during ransomware incidents.',
      ],
      callout: {
        kind: 'tip',
        text: 'Exam keyword: "Immutable backups / protect against ransomware or accidental deletion by admin" -> AWS Backup Vault Lock.',
      },
      changes: ['+ AWS Backup orchestrates cross-region vault copy', '+ Vault Lock enforces WORM immutability'],
      metrics: { cost_model: 'Cold Tiering', lb_layer: 'Control Plane', rto_rpo: 'Immutable WORM', migration: 'Cross-Account' },
      scene: {
        entities: {
          src: b(-14, -8, { r: 2.2, h: 48, color: 'blue', label: ['EBS / RDS / EFS'], sub: 'Prod Data' }),
          bk: d(0, -8, { s: 4.6, h: 52, color: 'purple', glyph: 'workflow', label: ['AWS Backup'], sub: 'Policy Cron' }),
          vault: b(15, -8, { r: 2.2, h: 48, color: 'green', label: ['Locked Vault'], sub: 'WORM Immutable' }),
          card: S({ x: -12, y: 12 }, '4. AWS Backup + WORM Vault Lock', [
            '// Single backup plan covers EBS, RDS, Aurora, EFS, DynamoDB, S3',
            '// Cross-Region + Cross-Account copy into isolated security account',
            '// Vault Lock (Compliance Mode): cannot delete until retention expires',
          ], { icon: 'terminal' }),
        },
        links: {
          s_bk: h('src', 'bk', ['src', 'bk'], { heads: 'end', label: 'snapshot' }),
          bk_v: h('bk', 'vault', ['bk', 'vault'], { heads: 'end', label: 'WORM copy' }),
        },
        flows: [{ route: ['s_bk', 'bk_v'], kind: 'res', rate: 1.7 }],
      },
    },
    {
      short: 'Migration',
      chapter: 'migration',
      title: '5. Migration: DMS + SCT, DataSync & Snowball',
      body: [
        '• <strong>AWS DMS + SCT</strong>: live database migration with near-zero downtime. Use <strong>Schema Conversion Tool (SCT)</strong> for heterogeneous migrations (Oracle → Aurora PostgreSQL).<br>• <strong>AWS DataSync</strong>: online petabyte file sync (NFS/SMB → S3/EFS) over WAN.<br>• <strong>Snowball Edge</strong>: offline 80 TB+ physical appliance when bandwidth is too slow.',
      ],
      callout: {
        kind: 'insight',
        text: 'Oracle -> Aurora PostgreSQL always requires SCT (schema) + DMS (data + CDC). Offline 100 TB with slow WAN -> Snowball.',
      },
      changes: ['+ DMS CDC streams live changes with zero downtime', '+ DataSync / Snowball handle bulk file transfer'],
      metrics: { cost_model: 'Pay-per-GB', lb_layer: 'CDC / WAN', rto_rpo: 'Near-Zero Cut', migration: 'DMS + DataSync' },
      scene: {
        entities: {
          oracle: b(-14, -8, { r: 2.2, h: 48, color: 'red', label: ['On-Prem Oracle'], sub: 'Source DB' }),
          dms: d(0, -8, { s: 4.6, h: 52, color: 'cyan', glyph: 'workflow', label: ['SCT + DMS'], sub: 'Full + CDC' }),
          aurora: b(15, -8, { r: 2.2, h: 48, color: 'green', label: ['Aurora PG'], sub: 'Target DB' }),
          card: S({ x: -12, y: 12 }, '5. AWS Migration Tool Selector', [
            '// Heterogeneous DB (Oracle -> Aurora): SCT + DMS (CDC)',
            '// Online NFS/SMB -> EFS/S3 (up to 10 Gbps): AWS DataSync',
            '// Offline >50 TB / poor WAN (<1 week): AWS Snowball Edge',
            '// Hybrid local cache of S3/NFS: AWS Storage Gateway',
          ], { icon: 'terminal' }),
        },
        links: {
          or_dms: h('oracle', 'dms', ['oracle', 'dms'], { heads: 'end', label: 'CDC stream' }),
          dms_au: h('dms', 'aurora', ['dms', 'aurora'], { heads: 'end', label: 'convert + load' }),
        },
        flows: [{ route: ['or_dms', 'dms_au'], kind: 'req', rate: 1.9 }],
      },
    },
    {
      short: 'Observability',
      chapter: 'ops',
      title: '6. CloudTrail, CloudWatch, Flow Logs & X-Ray',
      body: [
        'SAA-C03 distinguishes four telemetry planes:',
        '• <strong>CloudTrail</strong>: <em>Who</em> called <em>which</em> AWS API (governance & audit).<br>• <strong>CloudWatch</strong>: Metrics, Alarms & Application Logs.<br>• <strong>VPC Flow Logs</strong>: IP-level <code>ACCEPT</code>/<code>REJECT</code> network metadata.<br>• <strong>AWS X-Ray</strong>: distributed microservice request tracing.',
      ],
      callout: {
        kind: 'tip',
        text: 'Exam keyword: "Who deleted the S3 bucket / modified Security Group?" -> CloudTrail. "Why is packet dropped?" -> VPC Flow Logs.',
      },
      changes: ['+ CloudTrail records all IAM/API control-plane calls', '+ CloudWatch + X-Ray monitor runtime latency & alarms'],
      metrics: { cost_model: 'Log Retention', lb_layer: 'Control + Data', rto_rpo: 'Real-Time Alarm', migration: 'Governance' },
      scene: {
        entities: {
          awsApi: d(-14, -8, { s: 4.4, h: 50, color: 'blue', glyph: 'server', label: ['AWS Workload'], sub: 'API + Traffic' }),
          trail: d(1, -15, { s: 4.4, h: 50, color: 'purple', glyph: 'shield', label: ['CloudTrail'], sub: 'API Audit' }),
          cw: d(1, -1, { s: 4.4, h: 50, color: 'green', glyph: 'cpu', label: ['CloudWatch'], sub: 'Metrics/Alarms' }),
          s3Logs: b(15, -8, { r: 2.2, h: 48, color: 'orange', label: ['S3 Archive'], sub: 'Glacier/Athena' }),
          card: S({ x: -12, y: 12 }, '6. AWS Observability & Audit Matrix', [
            '// CloudTrail:    API audit (Who ran DeleteBucket?) -> S3 / Athena',
            '// CloudWatch:    CPU/Latency metrics, Alarms -> ASG / SNS',
            '// VPC Flow Logs: L3/L4 ACCEPT/REJECT -> troubleshoot SG/NACL',
            '// AWS X-Ray:     Distributed trace map across Lambda/ECS/RDS',
          ], { icon: 'terminal' }),
        },
        links: {
          api_tr: h('awsApi', 'trail', ['awsApi', 'trail'], { heads: 'end', label: 'API events' }),
          api_cw: h('awsApi', 'cw', ['awsApi', 'cw'], { heads: 'end', label: 'metrics' }),
          tr_s3: h('trail', 's3Logs', ['trail', 's3Logs'], { heads: 'end', label: 'archive' }),
          cw_s3: h('cw', 's3Logs', ['cw', 's3Logs'], { heads: 'end', label: 'export' }),
        },
        flows: [
          { route: ['api_tr', 'tr_s3'], kind: 'req', rate: 1.8 },
          { route: ['api_cw', 'cw_s3'], kind: 'res', rate: 1.8 },
        ],
      },
    },
  ],
};
