// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitCrlfLineEndingsLesson = {
  id: 'git-crlf-line-endings',
  title: 'CRLF vs LF Line Endings: The 10,000 File Diff Disaster',
  summary: 'Solve cross-platform line ending churn permanently using repo-enforced .gitattributes, git add --renormalize, and .git-blame-ignore-revs.',
  minutes: 25,
  level: 'intermediate',
  metrics: ['crlfFiles', 'gitAttributes', 'blameIntegrity', 'repoCleanliness'],
  legend: ['flow', ['corrupt', 'false diff churn'], ['attr', 'gitattributes filter'], ['clean', 'normalized LF storage']],
  goals: [
    { text: 'The 10,000 modified files disaster: Why Windows vs Linux line endings diverge', step: 1 },
    { text: 'The inadequacy of local core.autocrlf configuration', step: 2 },
    { text: 'Enforcing repository-level truth with .gitattributes (* text=auto)', step: 3 },
    { text: 'Normalizing the entire repository safely with git add --renormalize .', step: 4 },
    { text: 'Automated pre-commit hooks to permanently block CRLF leaks', step: 5 },
    { text: 'Preserving git blame history with .git-blame-ignore-revs', step: 6 },
  ],
  steps: [
    {
      short: 'The 10k Diff',
      chapter: 'problem',
      title: 'The 10,000 Files Modified Disaster',
      body: [
        'An AI agent or developer on Windows clones a Linux-authored repository. The IDE or Git auto-converts line endings to <code>\\r\\n</code> (Carriage Return + Line Feed).',
        'Running <code>git status</code> suddenly reports every single file in the repository as modified! Staging and committing this would destroy <code>git blame</code> history for the entire company.',
      ],
      callout: {
        kind: 'warning',
        text: 'A file with identical text is completely different at the byte level if line endings differ (0x0D 0x0A vs 0x0A). Git generates a totally new Blob SHA.',
      },
      metrics: { crlfFiles: '10,000 modified', gitAttributes: 'None', blameIntegrity: 'Critical risk', repoCleanliness: 'Dirty' },
      scene: {
        entities: {
          windowsDisk: y(-7, 7, { label: 'Windows FS', tags: [{ text: '10k CRLF files', tone: 'rose', icon: 'terminal' }] }),
          gitStatusEngine: d(0, 0, { s: 5.2, h: 56, color: 'rose', glyph: 'alert', label: ['git status'], sub: '10k false diffs' }),
          falseBlobDiff: d(7, -7, { s: 5.0, h: 54, color: 'rose', glyph: 'package', label: ['Hash Mismatch'], sub: 'new blob SHAs' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, '10k False Diffs Output', [
            `$ git status -s | wc -l`,
            `10240`,
            `$ git diff src/index.ts`,
            `warning: CRLF will be replaced by LF in src/index.ts.`,
            `The file will have its original line endings in your working tree`,
            `! Every line in every file appears modified!`,
          ], { icon: 'terminal' }),
        },
        links: {
          wg: h('windowsDisk', 'gitStatusEngine', ['windowsDisk', 'gitStatusEngine'], { label: 'scan disk files' }),
          gf: h('gitStatusEngine', 'falseBlobDiff', ['gitStatusEngine', 'falseBlobDiff'], { label: 'byte mismatch' }),
        },
        flows: [{ route: ['wg', 'gf'], kind: 'corrupt', rate: 1.5 }],
      },
    },
    {
      short: 'autocrlf Failure',
      chapter: 'problem',
      title: 'The Inadequacy of core.autocrlf',
      body: [
        'Developers frequently try fixing this by toggling <code>git config core.autocrlf true/false/input</code>.',
        'However, <code>core.autocrlf</code> is a <b>local per-user configuration</b>. It cannot be committed to Git. New team members, CI servers, and Docker containers will inevitably clone with different defaults and re-introduce CRLF churn.',
      ],
      callout: {
        kind: 'insight',
        text: 'Never rely on individual developer workstation configs for repository-wide byte invariants.',
      },
      changes: ['+ Local config changes fail to enforce consistency across team'],
      metrics: { crlfFiles: '10,000', gitAttributes: 'None', blameIntegrity: 'Vulnerable', repoCleanliness: 'Inconsistent' },
      scene: {
        entities: {
          localConfig: y(-7, 7, { label: 'core.autocrlf', tags: [{ text: 'local per-user', tone: 'amber', icon: 'terminal' }] }),
          ciContainer: d(0, 0, { s: 5.2, h: 56, color: 'amber', glyph: 'server', label: ['Linux CI Docker'], sub: 'autocrlf=false' }),
          driftClash: d(7, -7, { s: 5.0, h: 54, color: 'rose', glyph: 'boxes', label: ['Drift Clash'], sub: 'PRs fail on EOL' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Workstation Config Inconsistency', [
            `Dev 1 (Mac): core.autocrlf = input`,
            `Dev 2 (Win): core.autocrlf = true`,
            `CI Server (Linux): core.autocrlf = false`,
            `$ git diff --ignore-space-at-eol  # workaround, not a fix`,
            `= Team constantly fights whitespace PR battles`,
          ], { icon: 'terminal' }),
        },
        links: {
          lc: h('localConfig', 'ciContainer', ['localConfig', 'ciContainer'], { label: 'mismatched EOL' }),
          cd: h('ciContainer', 'driftClash', ['ciContainer', 'driftClash'], { label: 'causes CI failures' }),
        },
        flows: [{ route: ['lc', 'cd'], kind: 'corrupt', rate: 1.5 }],
      },
    },
    {
      short: '.gitattributes',
      chapter: 'setup',
      title: 'Repository Truth via .gitattributes',
      body: [
        'The only permanent, robust fix is committing a <code>.gitattributes</code> file at the root of the repository.',
        '<code>.gitattributes</code> is version-controlled and enforced automatically for <b>everyone</b>: Windows, macOS, Linux, and CI agents alike. It instructs Git to normalize text files to LF upon checkin.',
      ],
      callout: {
        kind: 'tip',
        text: '* text=auto ensures all detected text files normalize to LF in the object store. Specific binaries (*.png binary) are protected.',
      },
      changes: ['+ .gitattributes created and committed to root', '+ * text=auto and *.ts text eol=lf rules established'],
      metrics: { crlfFiles: 'Pending normalize', gitAttributes: 'Committed', blameIntegrity: 'Guaranteed', repoCleanliness: 'Configured' },
      scene: {
        entities: {
          attrFile: d(-7, 7, { s: 5.0, h: 54, color: 'green', glyph: 'terminal', label: ['.gitattributes'], sub: 'repo truth' }),
          filterEngine: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'cpu', label: ['Clean/Smudge'], sub: 'LF normalization' }),
          enforcedStore: b(7, -7, { s: 4.8, h: 50, color: 'blue', glyph: 'database', label: ['Universal LF'], sub: 'normalized store' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Standard .gitattributes File', [
            `# Set default behavior: auto-normalize text files to LF`,
            `* text=auto`,
            ``,
            `# Source code: explicitly LF in repo, native on checkout`,
            `*.ts text eol=lf`,
            `*.tsx text eol=lf`,
            `*.json text eol=lf`,
            `*.png binary`,
          ], { icon: 'terminal' }),
        },
        links: {
          af: h('attrFile', 'filterEngine', ['attrFile', 'filterEngine'], { label: 'declare rules' }),
          fe: h('filterEngine', 'enforcedStore', ['filterEngine', 'enforcedStore'], { label: 'universal LF' }),
        },
        flows: [{ route: ['af', 'fe'], kind: 'attr', rate: 1.5 }],
      },
    },
    {
      short: 'Renormalize',
      chapter: 'execution',
      title: 'Normalizing the Entire Repository: git add --renormalize',
      body: [
        'Adding <code>.gitattributes</code> does not retroactively rewrite existing files on disk. To normalize all 10,000 files in one clean sweep, run:',
        '<code>git add --renormalize .</code>. Git reads every file through the new <code>.gitattributes</code> filters and stages clean LF blobs.',
      ],
      callout: {
        kind: 'insight',
        text: 'git add --renormalize . is atomic and safe. It updates index hashes without modifying disk file timestamps unnecessarily.',
      },
      changes: ['+ 10,000 files normalized to LF in index', '+ False status diffs completely eliminated'],
      metrics: { crlfFiles: '0 (normalized)', gitAttributes: 'Active', blameIntegrity: 'Preserved', repoCleanliness: 'Clean' },
      scene: {
        entities: {
          renormCmd: y(-7, 7, { label: 'Renormalizer', tags: [{ text: 'git add --renorm', tone: 'green', icon: 'terminal' }] }),
          smudgeClean: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'cpu', label: ['Byte Scrubber'], sub: 'strip 0x0D bytes' }),
          pureIndex: b(7, -7, { s: 4.8, h: 50, color: 'green', glyph: 'database', label: ['Clean Index'], sub: '100% LF blobs' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Renormalization Execution', [
            `$ git add --renormalize .`,
            `$ git commit -m "chore: normalize line endings via .gitattributes"`,
            `[main a5b8c9] chore: normalize line endings via .gitattributes`,
            ` 10240 files changed, 0 insertions(+), 0 deletions(-)`,
            `$ git status`,
            `nothing to commit, working tree clean`,
          ], { icon: 'terminal' }),
        },
        links: {
          rs: h('renormCmd', 'smudgeClean', ['renormCmd', 'smudgeClean'], { label: 'read all files' }),
          sp: h('smudgeClean', 'pureIndex', ['smudgeClean', 'pureIndex'], { label: 'stage LF blobs' }),
        },
        flows: [{ route: ['rs', 'sp'], kind: 'clean', rate: 1.6 }],
      },
    },
    {
      short: 'Pre-Commit Guard',
      chapter: 'technique',
      title: 'Pre-Commit Hook: Blocking Unwanted CRLF',
      body: [
        'To guarantee that no future developer or bad script ever commits CRLF bytes again, install a pre-commit hook (or CI step).',
        'The hook inspects staged files for <code>\\r\\n</code> bytes and rejects the commit immediately if a forbidden carriage return is found.',
      ],
      callout: {
        kind: 'tip',
        text: 'Tools like husky, lint-staged, or pre-commit run this check in milliseconds before git commit finishes.',
      },
      changes: ['+ Pre-commit hook installed in .husky/pre-commit', '+ CI pipeline verifies zero CRLF in pull requests'],
      metrics: { crlfFiles: '0', gitAttributes: 'Enforced', blameIntegrity: 'Protected', repoCleanliness: 'Guarded' },
      scene: {
        entities: {
          commitAttempt: y(-7, 7, { label: 'Developer Commit', tags: [{ text: 'git commit', tone: 'blue', icon: 'terminal' }] }),
          hookValidator: d(0, 0, { s: 5.2, h: 56, color: 'purple', glyph: 'shield', label: ['CRLF Hook Guard'], sub: 'grep -U $\'\\r\'' }),
          approvedCommit: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['Approved Commit'], sub: 'sealed SHA-1' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Pre-Commit Hook Guard Script', [
            `#!/bin/sh`,
            `# .husky/pre-commit`,
            `if git grep --cached -I -l $'\\r'; then`,
            `  echo "ERROR: Attempted to commit CRLF line endings!"`,
            `  echo "Run: git add --renormalize <file>"`,
            `  exit 1`,
            `fi`,
          ], { icon: 'terminal' }),
        },
        links: {
          ch: h('commitAttempt', 'hookValidator', ['commitAttempt', 'hookValidator'], { label: 'scan staged bytes' }),
          ha: h('hookValidator', 'approvedCommit', ['hookValidator', 'approvedCommit'], { label: 'approve commit' }),
        },
        flows: [{ route: ['ch', 'ha'], kind: 'clean', rate: 1.5 }],
      },
    },
    {
      short: 'Blame Integrity',
      chapter: 'scaling',
      title: 'Preserving git blame History (.git-blame-ignore-revs)',
      body: [
        'A major fear of bulk line-ending normalization is ruining <code>git blame</code> (every line showing the normalization commit).',
        'Git solves this via <code>.git-blame-ignore-revs</code>! Add the normalization commit SHA to this file, and <code>git blame</code> will seamlessly look through it to show the true original authors.',
      ],
      callout: {
        kind: 'insight',
        text: 'Configure git config blame.ignoreRevsFile .git-blame-ignore-revs. GitHub and GitLab also natively support this file in web UI blame views.',
      },
      changes: ['+ .git-blame-ignore-revs committed with normalization SHA', '+ git blame reflects true authorship across all files'],
      metrics: { crlfFiles: '0', gitAttributes: 'Permanent', blameIntegrity: '100% Intact', repoCleanliness: 'Pristine' },
      scene: {
        entities: {
          blameReq: y(-7, 7, { label: 'git blame CLI', tags: [{ text: 'blame auth.ts', tone: 'cyan', icon: 'terminal' }] }),
          ignoreFilter: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'boxes', label: ['.git-blame-ignore'], sub: 'skips a5b8c9' }),
          originalAuthor: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['True Author'], sub: 'original author' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Ignore-Revs Blame Configuration', [
            `$ echo "a5b8c9... # chore: normalize line endings" >> .git-blame-ignore-revs`,
            `$ git config blame.ignoreRevsFile .git-blame-ignore-revs`,
            `$ git blame src/auth.ts`,
            `1a2b3c (Linus 2022-01-15) export const auth = () => {`,
            `= Blame correctly points to Linus, completely skipping normalization commit!`,
          ], { icon: 'terminal' }),
        },
        links: {
          bi: h('blameReq', 'ignoreFilter', ['blameReq', 'ignoreFilter'], { label: 'read ignore list' }),
          io: h('ignoreFilter', 'originalAuthor', ['ignoreFilter', 'originalAuthor'], { label: 'resolve author' }),
        },
        flows: [{ route: ['bi', 'io'], kind: 'clean', rate: 1.6 }],
      },
    },
  ],
};
