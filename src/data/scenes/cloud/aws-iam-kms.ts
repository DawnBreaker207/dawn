/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

export const awsIamKmsLesson: Lesson = {
  id: 'aws-iam-kms',
  title: 'IAM, STS AssumeRole, SCPs & KMS Encryption',
  summary:
    'Master AWS SAA-C03 Domain 1 security: IAM policy evaluation (Explicit Deny wins), STS AssumeRole temporary credentials, Organizations SCPs, KMS Envelope Encryption, and Secrets Manager rotation.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['identity', 'evaluation', 'encryption', 'rotation'],
  legend: ['flow', ['req', 'auth / decrypt'], ['res', 'temp creds / DEK'], ['fail', 'explicit deny']],
  goals: [
    { text: 'Evaluate IAM policy logic (Explicit Deny > Allow)', step: 1 },
    { text: 'Issue temporary credentials via STS AssumeRole', step: 2 },
    { text: 'Enforce organization guardrails with AWS SCPs', step: 3 },
    { text: 'Encrypt large payloads with KMS Envelope Encryption', step: 4 },
    { text: 'Cut KMS API costs using S3 Bucket Keys', step: 5 },
    { text: 'Auto-rotate DB credentials with Secrets Manager', step: 6 },
  ],
  steps: [
    {
      short: 'IAM Eval',
      chapter: 'iam',
      title: '1. IAM Policy Evaluation & Explicit Deny',
      body: [
        'Every AWS API call starts as <strong>Implicit Deny</strong>. IAM evaluates Identity-based policies, Resource-based policies (like S3 Bucket Policy), Permission Boundaries, and SCPs.',
        'The golden rule of SAA-C03: an <strong>Explicit Deny</strong> in <em>any</em> applicable policy immediately overrides all Allows.',
      ],
      callout: {
        kind: 'insight',
        text: 'Same-account Resource Policy (e.g. S3 Bucket Policy) + Identity Policy union, unless an Explicit Deny exists anywhere.',
      },
      metrics: { identity: 'IAM Principal', evaluation: 'Explicit Deny', encryption: 'TLS 1.3', rotation: 'N/A' },
      scene: {
        entities: {
          principal: y(-15, -10, { label: 'IAM Role' }),
          evalEng: d(0, -10, { s: 4.6, h: 52, color: 'purple', glyph: 'shield', label: ['IAM Evaluator'], sub: 'Deny > Allow' }),
          s3: b(15, -10, { r: 2.2, h: 48, color: 'orange', label: ['S3 Bucket'], sub: 'Bucket Policy' }),
          card: S({ x: -12, y: 12 }, '1. IAM Policy Evaluation Order', [
            '// 1. Default = Implicit Deny',
            '// 2. Check SCP + Permission Boundary + Session Policy',
            '// 3. Any Explicit "Effect": "Deny" -> STOP (DENIED)',
            '// 4. Otherwise require Explicit "Effect": "Allow"',
          ], { icon: 'terminal' }),
        },
        links: {
          p_eval: h('principal', 'evalEng', ['principal', 'evalEng'], { heads: 'end', label: 's3:GetObject' }),
          eval_s3: h('evalEng', 's3', ['evalEng', 's3'], { heads: 'end', label: 'allowed' }),
        },
        flows: [{ route: ['p_eval', 'eval_s3'], kind: 'req', rate: 1.8 }],
      },
    },
    {
      short: 'STS Role',
      chapter: 'iam',
      title: '2. STS AssumeRole & Cross-Account Access',
      body: [
        'Never embed long-lived IAM Access Keys in EC2, Lambda, or CI/CD. Instead, principals call <code>sts:AssumeRole</code> to obtain short-lived credentials (<code>AccessKeyId</code>, <code>SecretAccessKey</code>, <code>SessionToken</code>).',
        'For cross-account access, Account B’s Role must list Account A in its <strong>Trust Policy</strong> (plus optional <code>ExternalId</code> to prevent the Confused Deputy problem).',
      ],
      callout: {
        kind: 'tip',
        text: 'Use ExternalId in cross-account Trust Policies whenever a 3rd-party SaaS vendor assumes a role into your AWS account.',
      },
      changes: ['+ AWS STS issues short-lived SessionToken (15m–12h)', '+ Trust Policy validates Account A + ExternalId'],
      metrics: { identity: 'STS Temp Creds', evaluation: 'Trust Policy', encryption: 'SigV4', rotation: 'Auto (1h)' },
      scene: {
        entities: {
          acctA: y(-15, -10, { label: 'Account A App' }),
          sts: d(0, -10, { s: 4.6, h: 52, color: 'blue', glyph: 'shield', label: ['AWS STS'], sub: 'AssumeRole' }),
          roleB: d(15, -10, { s: 4.4, h: 50, color: 'green', glyph: 'server', label: ['Account B Role'], sub: 'ExternalId OK' }),
          card: S({ x: -12, y: 12 }, '2. Cross-Account STS Trust Policy', [
            '{ "Effect": "Allow",',
            '  "Principal": { "AWS": "arn:aws:iam::111122223333:root" },',
            '  "Action": "sts:AssumeRole",',
            '  "Condition": { "StringEquals": { "sts:ExternalId": "partner-9x" } } }',
          ], { icon: 'terminal' }),
        },
        links: {
          a_sts: h('acctA', 'sts', ['acctA', 'sts'], { heads: 'end', label: 'AssumeRole' }),
          sts_b: h('sts', 'roleB', ['sts', 'roleB'], { heads: 'end', label: 'SessionToken' }),
        },
        flows: [{ route: ['a_sts', 'sts_b'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Org SCP',
      chapter: 'governance',
      title: '3. AWS Organizations & Service Control Policies',
      body: [
        '<strong>Service Control Policies (SCPs)</strong> attach to Organization OUs or Member Accounts to set the <em>maximum</em> available permissions across the entire company.',
        'SCPs do NOT grant permissions on their own — they act as guardrails (e.g., blocking unencrypted S3 uploads, denying regions outside <code>ap-southeast-1</code>, or protecting CloudTrail). Note: SCPs do not restrict the Management Account.',
      ],
      callout: {
        kind: 'warning',
        text: 'Even AdministratorAccess in a member account is blocked if an OU SCP explicitly denies the action.',
      },
      changes: ['+ AWS Organizations OU attaches SCP guardrail', '+ Blocks unauthorized regions & root user actions'],
      metrics: { identity: 'Org OU', evaluation: 'SCP Guardrail', encryption: 'Enforced', rotation: 'Policy' },
      scene: {
        entities: {
          org: d(-14, -10, { s: 5.0, h: 52, color: 'purple', glyph: 'layers', label: ['AWS Orgs'], sub: 'Prod OU + SCP' }),
          member: d(1, -10, { s: 4.4, h: 50, color: 'blue', glyph: 'server', label: ['Member Account'], sub: 'Admin IAM' }),
          badRegion: d(15, -10, { s: 4.2, h: 48, color: 'red', glyph: 'alert', label: ['eu-west-1'], sub: 'DENIED by SCP' }),
          card: S({ x: -12, y: 12 }, '3. SCP Region Restriction Guardrail', [
            '{ "Effect": "Deny", "NotAction": ["iam:*","sts:*","route53:*"],',
            '  "Resource": "*",',
            '  "Condition": { "StringNotEquals": {',
            '    "aws:RequestedRegion": ["us-east-1", "ap-southeast-1"]',
            '  } } }',
          ], { icon: 'terminal' }),
        },
        links: {
          org_m: h('org', 'member', ['org', 'member'], { heads: 'end', label: 'max bounds' }),
          m_bad: h('member', 'badRegion', ['member', 'badRegion'], { heads: 'end', label: 'SCP deny', style: 'dashed' }),
        },
        flows: [{ route: ['org_m', 'm_bad'], kind: 'fail', rate: 1.6 }],
      },
    },
    {
      short: 'KMS Envelope',
      chapter: 'kms',
      title: '4. KMS Envelope Encryption (CMK + Data Key)',
      body: [
        'AWS KMS keys (CMKs) never leave KMS and have a <strong>4 KB</strong> direct-encryption limit. To encrypt GB-sized files or EBS volumes, AWS uses <strong>Envelope Encryption</strong>:',
        '1. App calls <code>kms:GenerateDataKey</code>.<br>2. KMS returns a <strong>Plaintext DEK</strong> + an <strong>Encrypted DEK</strong>.<br>3. App encrypts data locally with Plaintext DEK, wipes it from RAM, and stores Ciphertext + Encrypted DEK together.',
      ],
      callout: {
        kind: 'insight',
        text: 'Envelope Encryption keeps data local (fast AES-256-GCM) while the root KMS key never leaves the HSM.',
      },
      changes: ['+ KMS GenerateDataKey issues Plaintext + Encrypted DEK', '+ App encrypts payload locally and discards Plaintext DEK'],
      metrics: { identity: 'KMS Key Policy', evaluation: 'HSM Bound', encryption: 'Envelope AES-256', rotation: 'Annual CMK' },
      scene: {
        entities: {
          app: y(-15, -10, { label: 'App Service' }),
          kms: d(0, -10, { s: 4.6, h: 52, color: 'purple', glyph: 'shield', label: ['AWS KMS (HSM)'], sub: 'GenDataKey' }),
          store: b(15, -10, { r: 2.2, h: 48, color: 'green', label: ['Encrypted Obj'], sub: 'Data + EncDEK' }),
          card: S({ x: -12, y: 12 }, '4. KMS Envelope Encryption Flow', [
            'const { Plaintext, CiphertextBlob } = kms.generateDataKey({ KeyId });',
            'const cipherData = aes256GcmEncrypt(Plaintext, bigFile);',
            'Plaintext.fill(0); // wipe plaintext DEK from RAM',
            's3.putObject({ Body: cipherData, Metadata: { dek: CiphertextBlob } });',
          ], { icon: 'terminal' }),
        },
        links: {
          app_kms: h('app', 'kms', ['app', 'kms'], { heads: 'end', label: 'request DEK' }),
          kms_st: h('kms', 'store', ['kms', 'store'], { heads: 'end', label: 'EncDEK + Data' }),
        },
        flows: [{ route: ['app_kms', 'kms_st'], kind: 'res', rate: 1.9 }],
      },
    },
    {
      short: 'Bucket Key',
      chapter: 'kms',
      title: '5. S3 SSE-KMS & Bucket Keys Cost Optimization',
      body: [
        'With standard <strong>SSE-KMS</strong>, every single S3 <code>PUT</code> or <code>GET</code> makes an API call to KMS — which can throttle KMS quotas and add significant cost at millions of objects/day.',
        'Enabling <strong>S3 Bucket Keys</strong> lets S3 derive a short-lived bucket-level key from KMS and reuse it locally inside S3, cutting KMS API calls & costs by up to <strong>99%</strong>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Classic SAA-C03 exam question: "Reduce SSE-KMS cost on millions of S3 objects" -> Enable S3 Bucket Keys!',
      },
      changes: ['+ S3 Bucket Key caches time-limited key inside S3', '+ Reduces KMS API requests by ~99%'],
      metrics: { identity: 'S3 + KMS', evaluation: 'Cached DEK', encryption: 'SSE-KMS', rotation: 'Bucket Key' },
      scene: {
        entities: {
          uploads: y(-15, -10, { label: '1M S3 PUTs' }),
          bucketKey: d(0, -10, { s: 4.6, h: 52, color: 'cyan', glyph: 'layers', label: ['S3 Bucket Key'], sub: '99% fewer KMS' }),
          kms: d(15, -10, { s: 4.4, h: 50, color: 'purple', glyph: 'shield', label: ['AWS KMS'], sub: '1x root call' }),
          card: S({ x: -12, y: 12 }, '5. S3 Bucket Key Optimization', [
            '// Without Bucket Key: 1,000,000 PUTs = 1,000,000 KMS calls',
            '// With BucketKeyEnabled: true -> KMS called once per window',
            'aws s3api put-bucket-encryption --bucket my-lake \\',
            '  --server-side-encryption-configuration \'{"BucketKeyEnabled":true}\'',
          ], { icon: 'terminal' }),
        },
        links: {
          up_bk: h('uploads', 'bucketKey', ['uploads', 'bucketKey'], { heads: 'end', label: 'local encrypt' }),
          bk_kms: h('bucketKey', 'kms', ['bucketKey', 'kms'], { heads: 'end', label: 'periodic derive' }),
        },
        flows: [{ route: ['up_bk', 'bk_kms'], kind: 'res', rate: 1.8 }],
      },
    },
    {
      short: 'Secrets Mgr',
      chapter: 'secrets',
      title: '6. Secrets Manager Auto-Rotation vs Parameter Store',
      body: [
        '<strong>AWS Secrets Manager</strong> stores DB passwords & API keys encrypted with KMS and natively runs a <strong>Lambda rotation function</strong> on a schedule (e.g. every 30 days) for RDS/Aurora/Redshift.',
        '<strong>SSM Parameter Store</strong> is cheaper (free Standard tier) and great for hierarchical app config, but lacks built-in managed RDS rotation.',
      ],
      callout: {
        kind: 'insight',
        text: 'SAA-C03 rule of thumb: Need automatic DB credential rotation? Choose Secrets Manager. Need free/cheap config? Parameter Store.',
      },
      changes: ['+ Secrets Manager invokes Lambda to rotate RDS password', '+ App fetches current secret version without downtime'],
      metrics: { identity: 'Secrets Manager', evaluation: 'KMS Encrypted', encryption: 'Zero Hardcode', rotation: '30d Auto Lambda' },
      scene: {
        entities: {
          app: y(-15, -14, { label: 'ECS App' }),
          sm: d(0, -14, { s: 4.6, h: 52, color: 'green', glyph: 'shield', label: ['Secrets Manager'], sub: 'GetSecretValue' }),
          rotLambda: d(0, -1, { s: 4.2, h: 48, color: 'orange', glyph: 'zap', label: ['Rotation Lambda'], sub: '30d schedule' }),
          rds: b(15, -8, { r: 2.2, h: 48, color: 'blue', label: ['Aurora RDS'], sub: 'new pwd active' }),
          card: S({ x: -12, y: 12 }, '6. Secrets Manager vs Parameter Store', [
            '// Secrets Manager: $0.40/secret/mo + native RDS auto-rotation',
            '// SSM Parameter Store: Free Standard tier, no native rotation',
            'const secret = await sm.getSecretValue({ SecretId: "prod/db" });',
            '// Lambda rotates AWSPENDING -> AWSCURRENT with zero downtime',
          ], { icon: 'terminal' }),
        },
        links: {
          app_sm: h('app', 'sm', ['app', 'sm'], { heads: 'end', label: 'fetch secret' }),
          sm_lam: h('sm', 'rotLambda', ['sm', 'rotLambda'], { heads: 'end', label: 'rotate' }),
          lam_rds: h('rotLambda', 'rds', ['rotLambda', 'rds'], { heads: 'end', label: 'ALTER USER' }),
        },
        flows: [
          { route: ['app_sm'], kind: 'req', rate: 1.6 },
          { route: ['sm_lam', 'lam_rds'], kind: 'res', rate: 1.8 },
        ],
      },
    },
  ],
};
