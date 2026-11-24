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
          windowsDisk: y(-18, -6, { label: 'Windows FS', tags: [{ text: '10k CRLF files', tone: 'rose', icon: 'terminal' }] }),
          gitStatusEngine: d(-6, -2, { s: 4.4, h: 56, color: 'rose', glyph: 'alert', label: ['git status'], sub: '10k diff churn' }),
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
        },
        flows: [{ route: ['wg'], kind: 'corrupt', rate: 1.5 }],
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
      changes: ['+ Local config changes fail to enforce consistency across team', '+ CI containers run with mismatched core.autocrlf'],
      metrics: { crlfFiles: '10,000', gitAttributes: 'None', blameIntegrity: 'Vulnerable', repoCleanliness: 'Inconsistent' },
      scene: {
        entities: {
          windowsDisk: y(-18, -6, { label: 'Windows FS', tags: [{ text: 'autocrlf true', tone: 'amber', icon: 'terminal' }] }),
          gitStatusEngine: d(-6, -2, { s: 4.4, h: 56, color: 'amber', glyph: 'alert', label: ['git status'], sub: 'local mismatch' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Workstation Config Inconsistency', [
            `Dev 1 (Mac): core.autocrlf = input`,
            `Dev 2 (Win): core.autocrlf = true`,
            `CI Server (Linux): core.autocrlf = false`,
            `$ git diff --ignore-space-at-eol  # workaround, not a fix`,
            `= Team constantly fights whitespace PR battles`,
          ], { icon: 'terminal' }),
        },
        links: {
          wg: h('windowsDisk', 'gitStatusEngine', ['windowsDisk', 'gitStatusEngine'], { label: 'mismatched EOL' }),
        },
        flows: [{ route: ['wg'], kind: 'corrupt', rate: 1.5 }],
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
          windowsDisk: y(-18, -6, { label: 'Windows FS', tags: [{ text: '10k files', tone: 'cyan', icon: 'terminal' }] }),
          gitStatusEngine: d(-6, -2, { s: 4.4, h: 56, color: 'cyan', glyph: 'alert', label: ['git status'], sub: 'eval filter' }),
          attrFilter: d(6, 0, { s: 4.4, h: 56, color: 'cyan', glyph: 'cpu', label: ['Clean Filter'], sub: '.gitattributes' }),
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
          wg: h('windowsDisk', 'gitStatusEngine', ['windowsDisk', 'gitStatusEngine'], { label: 'staged content' }),
          ga: h('gitStatusEngine', 'attrFilter', ['gitStatusEngine', 'attrFilter'], { label: 'apply filter' }),
        },
        flows: [{ route: ['wg', 'ga'], kind: 'attr', rate: 1.5 }],
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
          windowsDisk: y(-18, -6, { label: 'Windows FS', tags: [{ text: 'normalized LF', tone: 'green', icon: 'terminal' }] }),
          gitStatusEngine: d(-6, -2, { s: 4.4, h: 56, color: 'green', glyph: 'shield', label: ['git status'], sub: 'clean working' }),
          attrFilter: d(6, 0, { s: 4.4, h: 56, color: 'cyan', glyph: 'cpu', label: ['Clean Filter'], sub: 'strip 0x0D' }),
          cleanStore: b(18, 4, { r: 2.2, h: 52, color: 'blue', glyph: 'database', label: ['Object Store'], sub: 'universal LF' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Renormalization Output', [
            `$ git add --renormalize .`,
            `$ git status`,
            `On branch main`,
            `Changes to be committed:`,
            `  modified:   .gitattributes`,
            `  modified:   10,240 files (line endings normalized to LF)`,
            `= All files converted to canonical LF blobs in object store`,
          ], { icon: 'terminal' }),
        },
        links: {
          wg: h('windowsDisk', 'gitStatusEngine', ['windowsDisk', 'gitStatusEngine'], { label: 'read files' }),
          ga: h('gitStatusEngine', 'attrFilter', ['gitStatusEngine', 'attrFilter'], { label: 'strip carriage return' }),
          ac: h('attrFilter', 'cleanStore', ['attrFilter', 'cleanStore'], { label: 'write LF blobs' }),
        },
        flows: [{ route: ['wg', 'ga', 'ac'], kind: 'clean', rate: 1.6 }],
      },
    },
    {
      short: 'Pre-commit Hook',
      chapter: 'scaling',
      title: 'Automated Pre-commit Gate to Block CRLF Leaks',
      body: [
        'Even with <code>.gitattributes</code>, misconfigured third-party tools might commit binary files without flags or bypass filters.',
        'We add a git pre-commit hook (or Husky / Lefthook / pre-commit framework) to inspect staged blobs for raw CRLF sequences before every commit.',
      ],
      callout: {
        kind: 'tip',
        text: 'A pre-commit hook provides instant feedback in local development in less than 200ms.',
      },
      changes: ['+ Pre-commit hook installed in .husky/pre-commit', '+ Commits containing rogue CRLF aborted before leaving developer laptop'],
      metrics: { crlfFiles: '0', gitAttributes: 'Enforced', blameIntegrity: '100% guarded', repoCleanliness: 'Guarded' },
      scene: {
        entities: {
          windowsDisk: y(-18, -6, { label: 'Windows FS', tags: [{ text: 'staged changes', tone: 'green', icon: 'terminal' }] }),
          precommitHook: d(-6, -2, { s: 4.4, h: 56, color: 'amber', glyph: 'shield', label: ['Pre-commit'], sub: 'blocks CRLF' }),
          attrFilter: d(6, 0, { s: 4.4, h: 56, color: 'cyan', glyph: 'cpu', label: ['Clean Filter'], sub: 'strip 0x0D' }),
          cleanStore: b(18, 4, { r: 2.2, h: 52, color: 'blue', glyph: 'database', label: ['Object Store'], sub: 'universal LF' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Pre-commit Hook Assertion', [
            `#!/bin/sh`,
            `# Block CRLF leaks in staged files`,
            `if git diff --cached -S$'\r' --name-only | grep -q .; then`,
            `  echo "ERROR: Attempted to commit CRLF line endings!"`,
            `  exit 1`,
            `fi`,
            `= Zero risk of accidental line ending contamination`,
          ], { icon: 'terminal' }),
        },
        links: {
          wp: h('windowsDisk', 'precommitHook', ['windowsDisk', 'precommitHook'], { label: 'validate hook' }),
          pa: h('precommitHook', 'attrFilter', ['precommitHook', 'attrFilter'], { label: 'allow commit' }),
          ac: h('attrFilter', 'cleanStore', ['attrFilter', 'cleanStore'], { label: 'write LF blobs' }),
        },
        flows: [{ route: ['wp', 'pa', 'ac'], kind: 'attr', rate: 1.5 }],
      },
    },
    {
      short: 'Blame History',
      chapter: 'scaling',
      title: 'Preserving Blame History with .git-blame-ignore-revs',
      body: [
        'The biggest fear of large renormalization commits is that <code>git blame</code> will attribute every line in the project to the person who ran the formatting command.',
        'Git provides <code>.git-blame-ignore-revs</code>. Add the normalization commit SHA to this file, and Git blame will look straight through the commit to the original author.',
      ],
      callout: {
        kind: 'insight',
        text: 'Configure locally with: git config blame.ignoreRevsFile .git-blame-ignore-revs. GitHub and GitLab honor this file natively!',
      },
      changes: ['+ Normalization commit SHA appended to .git-blame-ignore-revs', '+ Original author blame history preserved for every line of code'],
      metrics: { crlfFiles: '0', gitAttributes: 'Enforced', blameIntegrity: 'Pristine history', repoCleanliness: 'Clean' },
      scene: {
        entities: {
          windowsDisk: y(-18, -6, { label: 'Windows FS', tags: [{ text: 'git blame', tone: 'green', icon: 'terminal' }] }),
          gitStatusEngine: d(-6, -2, { s: 4.4, h: 56, color: 'green', glyph: 'shield', label: ['git status'], sub: 'clean working' }),
          cleanStore: b(6, 0, { r: 2.2, h: 52, color: 'blue', glyph: 'database', label: ['Object Store'], sub: 'universal LF' }),
          blameLog: d(18, 4, { s: 4.4, h: 54, color: 'green', glyph: 'shield', label: ['.git-blame*'], sub: 'ignore-revs' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Blame Ignore Revs Config', [
            `$ cat .git-blame-ignore-revs`,
            `# Normalize CRLF line endings to LF across repository`,
            `4d8e92f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3`,
            ``,
            `$ git config blame.ignoreRevsFile .git-blame-ignore-revs`,
            `$ git blame src/index.ts`,
            `= Author history reflects original logic authors, not the reformat!`,
            ], { icon: 'terminal' }),
        },
        links: {
          wg: h('windowsDisk', 'gitStatusEngine', ['windowsDisk', 'gitStatusEngine'], { label: 'query blame' }),
          gc: h('gitStatusEngine', 'cleanStore', ['gitStatusEngine', 'cleanStore'], { label: 'read commits' }),
          cb: h('cleanStore', 'blameLog', ['cleanStore', 'blameLog'], { label: 'ignore revs' }),
        },
        flows: [{ route: ['wg', 'gc', 'cb'], kind: 'clean', rate: 1.6 }],
      },
    },
  ],
};
