import { STAGE, codeCard, linkOf, makeDb, stageBlock, distinctConcepts, type Tag } from '@/lib/simulator/scene-builders';
import type { Lesson } from '@/lib/simulator/types';

// One stage: a principal on the left, the access/crypto decision in the middle (same id, new
// label each act), the protected resource on the right, supporting services above and beside.
//
//                helper             alt
//   principal ──── gate ─────────── resource

const principal = (label: string[], sub: string, tags: Tag[] = [], glyph = `user`) =>
  stageBlock(STAGE.caller, { color: `blue`, glyph, label, sub, tags });
const gate = (label: string[], sub: string, tags: Tag[] = [], glyph = `shield`) =>
  stageBlock(STAGE.main, { color: `green`, glyph, label, sub, tags });
const resource = (label: string, tags: Tag[] = []) =>
  makeDb(STAGE.store.x, STAGE.store.y, { r: 2.2, h: 46, glyph: `database`, label, tags });
const helper = (label: string[], sub: string, glyph: string, tags: Tag[] = []) =>
  stageBlock(STAGE.helper, { color: `orange`, glyph, label, sub, tags });
const alt = (label: string[], sub: string, tags: Tag[] = []) =>
  stageBlock(STAGE.alt, { color: `slab`, glyph: `route`, label, sub, tags });

const links = {
  ask: (label?: string) => linkOf(`principal`, `gate`, label),
  use: (label?: string) => linkOf(`gate`, `resource`, label),
  help: (label?: string) => ({ ...linkOf(`helper`, `gate`, label, false), labelAt: 0.6 }),
  quiet: { ...linkOf(`principal`, `alt`), style: `off` },
};

export const awsIamKmsLesson: Lesson = distinctConcepts({
  id: 'aws-iam-kms',
  title: 'IAM, STS AssumeRole, SCPs & KMS Encryption',
  summary:
    'Who may do what, and how data stays encrypted: IAM policy evaluation, temporary credentials with STS, Organizations SCP guardrails, KMS envelope encryption, S3 Bucket Keys and Secrets Manager rotation.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['decision', 'scope', 'credential', 'cost'],
  legend: [[`req`, `request`], [`res`, `allowed`], [`fail`, `denied`]],
  goals: [
    { text: 'Evaluate IAM policies: explicit Deny beats Allow', step: 1 },
    { text: 'Issue temporary credentials with STS AssumeRole', step: 2 },
    { text: 'Set organisation guardrails with SCPs', step: 3 },
    { text: 'Encrypt large data with KMS envelope encryption', step: 4 },
    { text: 'Cut KMS cost with S3 Bucket Keys', step: 5 },
    { text: 'Rotate database credentials with Secrets Manager', step: 6 },
  ],
  steps: [
    {
      short: 'IAM eval',
      chapter: 'setup',
      title: 'Deny wins, then Allow, otherwise No',
      body: [
        `Every API call is evaluated against the caller’s policies. The order is fixed: any <b>explicit Deny</b> ends it; otherwise an <b>explicit Allow</b> grants access; with neither, the answer is the default <b>implicit deny</b>.`,
        `Policies attach to users, groups and roles (identity-based) or to the resource (a bucket policy). Within one account, an Allow in either is enough. Grant the least privilege that does the job.`,
      ],
      metrics: { decision: 'Deny > Allow', scope: 'one account', credential: 'n/a', cost: 'free' },
      scene: {
        entities: {
          principal: principal([`dev-alice`], `IAM user`, [{ text: `s3:GetObject`, tone: `amber` }]),
          gate: gate([`IAM policy`, `evaluation`], `explicit deny wins`, [{ text: `Deny matched`, tone: `red`, icon: `alert` }]),
          resource: resource(`S3 bucket`, [{ text: `prod-reports`, tone: `gray` }]),
          alt: alt([`Allow`], `s3:*`, [{ text: `overridden`, tone: `gray` }]),
          card: codeCard(`Why she is denied`, [`{ "Effect": "Allow", "Action": "s3:*", "Resource": "*" }`, `{ "Effect": "Deny",  "Action": "s3:GetObject",`, `  "Resource": "arn:aws:s3:::prod-reports/*" }`, `! explicit Deny wins → AccessDenied`]),
        },
        links: { ask: links.ask(`GetObject`), use: links.use(`blocked`) },
        flows: [{ route: ['ask'], kind: 'fail', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'STS role',
      chapter: 'technique',
      title: 'Roles: temporary credentials instead of keys',
      body: [
        `Long-lived access keys leak. A <span class="term">role</span> has no password or keys; a trusted principal calls <b>STS AssumeRole</b> and receives temporary credentials (access key, secret, session token) valid 15 minutes to 12 hours.`,
        `The role’s <b>trust policy</b> says who may assume it; its permission policy says what it can then do. EC2, Lambda and cross-account access all work this way.`,
      ],
      changes: [`+ STS`, `+ role with trust policy`],
      metrics: { decision: 'trust + permission', scope: 'role', credential: '1 h token', cost: 'free' },
      scene: {
        entities: {
          principal: principal([`dev-alice`], `in account A`, [{ text: `AssumeRole`, tone: `violet` }]),
          gate: gate([`STS`], `issues credentials`, [{ text: `expires in 1 h`, tone: `green`, icon: `clock` }], `key`),
          resource: resource(`S3 bucket`, [{ text: `account B`, tone: `gray` }]),
          helper: helper([`Trust policy`], `who may assume`, `idCard`, [{ text: `Principal: acct A`, tone: `violet` }]),
          card: codeCard(`Get a session`, [`$ aws sts assume-role --role-arn arn:aws:iam::222222222222:role/Reader \\`, `      --role-session-name alice`, `= { AccessKeyId, SecretAccessKey, SessionToken, Expiration }`]),
        },
        links: { ask: links.ask(`AssumeRole`), use: links.use(`temp creds`), help: links.help(`allows`) },
        flows: [{ route: ['ask'], rate: 1.2, bounce: true }, { route: ['use'], kind: 'msg', rate: 1 }],
      },
    },
    {
      short: 'SCP',
      chapter: 'insight',
      title: 'SCPs: guardrails above every account',
      body: [
        `In AWS Organizations a <span class="term">Service Control Policy</span> sets the <b>maximum</b> permissions for a whole account or OU. It never grants anything; it only filters what IAM can allow — even the account’s root user is bound by it.`,
        `Typical uses: forbid leaving approved Regions, stop anyone disabling CloudTrail or GuardDuty. The effective permission is the <em>intersection</em> of the SCP and the IAM policy.`,
      ],
      changes: [`+ SCP at the OU`, `~ account B bound by it`],
      metrics: { decision: 'SCP ∩ IAM', scope: 'OU / account', credential: 'n/a', cost: 'free' },
      scene: {
        entities: {
          principal: principal([`admin`], `account B`, [{ text: `Allow ec2:*`, tone: `green` }]),
          gate: gate([`SCP`], `maximum permissions`, [{ text: `eu-west-1 only`, tone: `violet`, icon: `lock` }]),
          resource: resource(`EC2 in us-east-1`, [{ text: `blocked`, tone: `red` }]),
          helper: helper([`AWS Orgs`], `OU: Production`, `building`, [{ text: `attaches SCP`, tone: `violet` }]),
          card: codeCard(`A guardrail`, [`{ "Effect": "Deny", "Action": "*", "Resource": "*",`, `  "Condition": { "StringNotEquals": { "aws:RequestedRegion": ["eu-west-1"] } } }`, `! even the account admin gets AccessDenied in us-east-1`]),
        },
        links: { ask: links.ask(`RunInstances`), use: links.use(`denied`), help: links.help(`applies`) },
        flows: [{ route: ['ask'], kind: 'fail', rate: 1.2, bounce: true }],
      },
    },
    {
      short: 'KMS envelope',
      chapter: 'technique',
      title: 'Envelope encryption: a key for the key',
      body: [
        `KMS can encrypt at most 4 KB directly, and the key never leaves it. For real data you use <b>envelope encryption</b>: ask KMS for a <em>data key</em> (<code>GenerateDataKey</code>), encrypt the file locally with the plaintext copy, then discard it.`,
        `Store the <b>encrypted</b> data key beside the data. To read, send it to KMS to decrypt, then decrypt the file. Only people allowed to use the KMS key can unlock anything.`,
      ],
      changes: [`+ KMS key`, `+ data key (plain + encrypted)`],
      metrics: { decision: 'key policy', scope: 'per object', credential: 'KMS key', cost: '$1 / key / mo' },
      scene: {
        entities: {
          principal: principal([`app`], `uploads file`, [{ text: `1 GB file`, tone: `gray` }], `server`),
          gate: gate([`KMS`], `customer key`, [{ text: `key never leaves`, tone: `green`, icon: `lock` }], `key`),
          resource: resource(`S3 object`, [{ text: `ciphertext + wrapped key`, tone: `violet` }]),
          helper: helper([`Data key`], `256-bit AES`, `hash`, [{ text: `plain + encrypted`, tone: `violet` }]),
          card: codeCard(`Envelope steps`, [`$ aws kms generate-data-key --key-id alias/app --key-spec AES_256`, `= { Plaintext, CiphertextBlob }`, `1. encrypt file with Plaintext   2. wipe Plaintext`, `3. store file + CiphertextBlob   (decrypt: kms decrypt → key → file)`]),
        },
        links: { ask: links.ask(`encrypt`), use: links.use(`store`), help: links.help(`data key`) },
        flows: [{ route: ['help'], kind: 'msg', rate: 1 }, { route: ['use'], kind: 'write', rate: 1 }],
      },
    },
    {
      short: 'Bucket Key',
      chapter: 'solution',
      title: 'S3 Bucket Keys cut KMS calls by ~99%',
      body: [
        `With SSE-KMS every object upload and read triggers a KMS request — at millions of objects that means a large KMS bill and throttling. An <span class="term">S3 Bucket Key</span> lets S3 ask KMS <em>once</em> for a bucket-level key and derive per-object keys locally.`,
        `Same security model, same key policy and CloudTrail trail, up to 99% fewer KMS requests. Enable it on the bucket (or per object) alongside SSE-KMS.`,
      ],
      changes: [`+ Bucket Key`, `~ KMS requests −99%`],
      metrics: { decision: 'key policy', scope: 'bucket', credential: 'KMS key', cost: '−99% requests' },
      scene: {
        entities: {
          principal: principal([`uploaders`], `1M puts / day`, [{ text: `PutObject`, tone: `gray` }], `users`),
          gate: gate([`S3`], `SSE-KMS`, [{ text: `Bucket Key on`, tone: `green` }], `box`),
          resource: resource(`S3 objects`, [{ text: `per-object keys`, tone: `violet` }]),
          helper: helper([`KMS`], `1 call / bucket`, `key`, [{ text: `~10k vs 1M`, tone: `green`, icon: `gauge` }]),
          alt: alt([`No Bucket Key`], `1 call / object`, [{ text: `$$$ + throttling`, tone: `red` }]),
          card: codeCard(`Turn it on`, [`$ aws s3api put-bucket-encryption --bucket reports --server-side-encryption-configuration \\`, `  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"},"BucketKeyEnabled":true}]}'`]),
        },
        links: { ask: links.ask(`PutObject`), use: links.use(`encrypted`), help: links.help(`1 call`) },
        flows: [{ route: ['ask'], rate: 2, bounce: true }, { route: ['help'], kind: 'msg', rate: 0.5 }],
      },
    },
    {
      short: 'Secrets',
      chapter: 'recap',
      title: 'Secrets Manager rotates passwords for you',
      body: [
        `Database passwords in config files or environment variables are a liability. <span class="term">Secrets Manager</span> stores them encrypted with KMS, hands them to the app at runtime over an IAM-controlled API, and <b>rotates</b> them on a schedule.`,
        `Rotation runs a Lambda that creates a new password, updates the database and swaps the secret — without redeploying the app. The app fetches the secret by name (and caches it), so it always gets the current one.`,
      ],
      changes: [`+ Secrets Manager`, `+ rotation Lambda`, `~ password every 30 days`],
      metrics: { decision: 'IAM + KMS', scope: 'one secret', credential: 'rotated 30 d', cost: '$0.40 / secret' },
      scene: {
        entities: {
          principal: principal([`app`], `ECS task role`, [{ text: `GetSecretValue`, tone: `green` }], `server`),
          gate: gate([`Secrets`, `Manager`], `encrypted by KMS`, [{ text: `rotate: 30 days`, tone: `violet`, icon: `refresh` }], `lock`),
          resource: resource(`RDS database`, [{ text: `password changed`, tone: `green` }]),
          helper: helper([`Rotation`, `Lambda`], `4-step rotation`, `refresh`, [{ text: `create · set · test · finish`, tone: `gray` }]),
          card: codeCard(`Fetch, don't store`, [`$ aws secretsmanager get-secret-value --secret-id prod/db`, `{ "SecretString": "{\\"user\\":\\"app\\",\\"password\\":\\"…\\"}" }`, `= app caches it; rotation never needs a deploy`]),
        },
        links: { ask: links.ask(`GetSecret`), use: links.use(`new password`), help: links.help(`rotates`) },
        flows: [{ route: ['ask'], rate: 1.2, bounce: true }, { route: ['help'], kind: 'write', rate: 0.9 }],
      },
    },
  ],
});
