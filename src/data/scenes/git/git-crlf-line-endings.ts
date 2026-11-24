// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitCrlfLineEndingsLesson = {
  id: 'git-crlf-line-endings',
  title: 'Case 6: CRLF vs LF Normalization Disaster',
  summary: 'When a Windows developer or AI agent marks 10,000 files modified due to carriage return (\\r\\n) drift, and resolving it permanently via .gitattributes and git add --renormalize .',
  minutes: 25,
  level: 'intermediate',
  metrics: ['crlfFiles', 'gitAttributes', 'blameIntegrity', 'repoCleanliness'],
  legend: ['flow', ['corrupt', 'CRLF drift (10,000 files)'], ['clean', 'LF normalized'], ['attr', 'gitattributes rules']],
  goals: [
    { text: 'Why Windows CRLF (\\r\\n) and Linux LF (\\n) trigger false diffs', step: 1 },
    { text: 'The fatal failure of core.autocrlf across team environments', step: 2 },
    { text: 'Enforcing repository-level truth with .gitattributes', step: 3 },
    { text: 'Normalizing the entire repository: git add --renormalize .', step: 4 },
    { text: 'Pre-commit hook enforcement: blocking unwanted carriage returns', step: 5 },
    { text: 'Preserving git blame history across line ending normalization', step: 6 },
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
          windowsFs: d(-10, -18, { s: 4.8, h: 50, color: 'rose', glyph: 'terminal', label: ['Windows Disk'], sub: '10k files with CRLF' }),
          gitStatus: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'cpu', label: ['git status'], sub: 'detects false diffs' }),
          blobDiff: d(10, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'package', label: ['False Blobs'], sub: 'hash mismatch on all files' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, '10k False Diffs Output', [
            `$ git status -s | wc -l`,
            `10240`,
            `$ git diff src/index.ts`,
            `warning: CRLF will be replaced by LF in src/index.ts.`,
            `The file will have its original line endings in your working tree`,
            `! Every line in every file appears modified!`,
          ], { icon: 'terminal' }),
          zCrlf: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'CRLF / LF BYTE CORRUPTION HAZARD'),
        },
        links: {
          wg: h('windowsFs', 'gitStatus', ['windowsFs', 'gitStatus'], { label: 'scans disk files' }),
          gb: h('gitStatus', 'blobDiff', ['gitStatus', 'blobDiff'], { label: 'SHA mismatch' }),
        },
        flows: [{ route: ['wg', 'gb'], kind: 'corrupt', rate: 1.5 }],
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
          localConfig: d(-10, -18, { s: 4.8, h: 50, color: 'slab', glyph: 'terminal', label: ['core.autocrlf'], sub: 'per-machine setting' }),
          ciContainer: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'server', label: ['Linux CI Docker'], sub: 'core.autocrlf = false' }),
          driftClash: d(10, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'boxes', label: ['Drift Clash'], sub: 'PRs fail on whitespace' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Workstation Config Inconsistency', [
            `Dev 1 (Mac): core.autocrlf = input`,
            `Dev 2 (Win): core.autocrlf = true`,
            `CI Server (Linux): core.autocrlf = false`,
            `$ git diff --ignore-space-at-eol  # workaround, not a fix`,
            `= Team constantly fights whitespace PR battles`,
          ], { icon: 'terminal' }),
          zCrlf: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'LOCAL CONFIGURATION INCONSISTENCY'),
        },
        links: {
          lc: h('localConfig', 'ciContainer', ['localConfig', 'ciContainer'], { label: 'mismatched settings' }),
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
          attrFile: d(-10, -18, { s: 5.2, h: 50, color: 'green', glyph: 'terminal', label: ['.gitattributes'], sub: 'repo-level truth' }),
          gitFilter: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['Filter Engine'], sub: 'clean/smudge filter' }),
          enforcedStore: d(10, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'package', label: ['LF Store'], sub: 'universal LF objects' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Standard .gitattributes File', [
            `# Set default behavior: auto-normalize text files to LF`,
            `* text=auto`,
            ``,
            `# Source code: explicitly LF in repo, native on checkout`,
            `*.ts text eol=lf`,
            `*.tsx text eol=lf`,
            `*.json text eol=lf`,
            `*.png binary`,
          ], { icon: 'terminal' }),
          zCrlf: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'REPOSITORY-LEVEL RULE DECLARATION'),
        },
        links: {
          ag: h('attrFile', 'gitFilter', ['attrFile', 'gitFilter'], { label: 'enforce rules' }),
          ge: h('gitFilter', 'enforcedStore', ['gitFilter', 'enforcedStore'], { label: 'universal LF' }),
        },
        flows: [{ route: ['ag', 'ge'], kind: 'attr', rate: 1.5 }],
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
          renormCmd: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['git add --renorm'], sub: 'process all files' }),
          smudgeClean: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['Smudge / Clean'], sub: 'strip 0x0D bytes' }),
          pureIndex: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'boxes', label: ['Clean Index'], sub: '100% LF blob hashes' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Renormalization Execution', [
            `$ git add --renormalize .`,
            `$ git commit -m "chore: normalize line endings via .gitattributes"`,
            `[main a5b8c9] chore: normalize line endings via .gitattributes`,
            ` 10240 files changed, 0 insertions(+), 0 deletions(-)`,
            `$ git status`,
            `nothing to commit, working tree clean`,
          ], { icon: 'terminal' }),
          zCrlf: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'WHOLE-REPO RENORMALIZATION PASS'),
        },
        links: {
          rs: h('renormCmd', 'smudgeClean', ['renormCmd', 'smudgeClean'], { label: 'scan repository' }),
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
          commitAttempt: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['git commit'], sub: 'triggers hook' }),
          hookValidator: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['CRLF Hook Guard'], sub: 'grep -U $\'\\r\'' }),
          approvedCommit: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Approved Git SHA'], sub: 'sealed commit' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Pre-Commit Hook Guard Script', [
            `#!/bin/sh`,
            `# .husky/pre-commit`,
            `if git grep --cached -I -l $'\\r'; then`,
            `  echo "ERROR: Attempted to commit CRLF line endings!"`,
            `  echo "Run: git add --renormalize <file>"`,
            `  exit 1`,
            `fi`,
          ], { icon: 'terminal' }),
          zCrlf: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'PRE-COMMIT HOOK AUTOMATED GUARD'),
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
          blameReq: d(-10, -18, { s: 4.8, h: 50, color: 'blue', glyph: 'terminal', label: ['git blame src/auth.ts'], sub: 'query authorship' }),
          ignoreFilter: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'boxes', label: ['.git-blame-ignore'], sub: 'skips a5b8c9 normalization' }),
          originalAuthor: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['True Author (Linus)'], sub: 'blame history intact' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Ignore-Revs Blame Configuration', [
            `$ echo "a5b8c9... # chore: normalize line endings" >> .git-blame-ignore-revs`,
            `$ git config blame.ignoreRevsFile .git-blame-ignore-revs`,
            `$ git blame src/auth.ts`,
            `1a2b3c (Linus 2022-01-15) export const auth = () => {`,
            `= Blame correctly points to Linus, completely skipping normalization commit!`,
          ], { icon: 'terminal' }),
          zCrlf: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'BLAME INTEGRITY PRESERVATION'),
        },
        links: {
          bi: h('blameReq', 'ignoreFilter', ['blameReq', 'ignoreFilter'], { label: 'read ignore list' }),
          io: h('ignoreFilter', 'originalAuthor', ['ignoreFilter', 'originalAuthor'], { label: 'resolve original author' }),
        },
        flows: [{ route: ['bi', 'io'], kind: 'clean', rate: 1.6 }],
      },
    },
  ],
};
