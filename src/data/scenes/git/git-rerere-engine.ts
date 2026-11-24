// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitRerereEngineLesson = {
  id: 'git-rerere-engine',
  title: 'Git rerere: Reuse Recorded Resolution Engine',
  summary: 'Eliminate repetitive conflict resolution during long rebases, cherry-picks, and branch tracking by configuring Git automated rerere cache database.',
  minutes: 25,
  level: 'advanced',
  metrics: ['rerereStatus', 'conflictFingerprint', 'autoResolutions', 'rrCacheSize'],
  legend: ['flow', ['conflict', 'manual conflict resolution'], ['record', 'recording resolution'], ['replay', 'automated replay']],
  goals: [
    { text: 'The repetitive rebase pain: Solving the exact same conflict 10 times', step: 1 },
    { text: 'Enabling rerere globally: git config --global rerere.enabled true', step: 2 },
    { text: 'Recording the pre-image: How rerere fingerprints conflicting hunks', step: 3 },
    { text: 'Recording the post-image: Storing clean resolution in .git/rr-cache', step: 4 },
    { text: 'Automated replay: Git resolves identical conflict in 0.01 seconds', step: 5 },
    { text: 'Auto-staging resolved hunks with rerere.autoupdate', step: 6 },
  ],
  steps: [
    {
      short: 'Rebase Hell',
      chapter: 'problem',
      title: 'The Rebase Conflict Loop',
      body: [
        'A long-lived feature branch with 15 commits is being rebased onto an updated <code>main</code>.',
        'Because the conflict occurred early in the branch, Git stops at commit 3, commit 5, commit 7... forcing you to resolve the <b>EXACT SAME conflict</b> over and over again for each commit in the sequence.',
      ],
      callout: {
        kind: 'warning',
        text: 'This manual repetition wastes hours of developer time and introduces subtle fatigue bugs during complex rebases.',
      },
      metrics: { rerereStatus: 'Disabled', conflictFingerprint: 'None', autoResolutions: '0', rrCacheSize: 'Empty' },
      scene: {
        entities: {
          rebaseRunner: d(-18, -6, { s: 4.4, h: 56, color: 'rose', glyph: 'cpu', label: ['git rebase'], sub: 'aborts at 3/15' }),
          conflictHunk: d(-6, -2, { s: 4.4, h: 54, color: 'amber', glyph: 'alert', label: ['Conflict Hunk'], sub: 'auth.ts clash' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Rebase Conflict Hell', [
            `$ git rebase main`,
            `Applying: feat: auth tokens`,
            `CONFLICT (content): Merge conflict in src/auth.ts`,
            `error: Failed to merge in the changes.`,
            `# Fixed manually, ran git rebase --continue...`,
            `Applying: feat: refresh route`,
            `CONFLICT (content): Merge conflict in src/auth.ts (AGAIN!)`,
          ], { icon: 'terminal' }),
        },
        links: {
          rc: h('rebaseRunner', 'conflictHunk', ['rebaseRunner', 'conflictHunk'], { label: 'aborts rebase' }),
        },
        flows: [{ route: ['rc'], kind: 'conflict', rate: 1.5 }],
      },
    },
    {
      short: 'Enable rerere',
      chapter: 'setup',
      title: 'Enabling git rerere Globally',
      body: [
        '<b>rerere</b> stands for <em>Reuse Recorded Resolution</em>. It is an internal Git database that remembers how you resolved a conflict hunk.',
        'Run <code>git config --global rerere.enabled true</code>. From that moment on, Git silently monitors conflict states in every repository on your machine.',
      ],
      callout: {
        kind: 'tip',
        text: 'Also enable git config --global rerere.autoupdate true so resolved files are automatically staged with git add.',
      },
      changes: ['+ rerere.enabled set to true in ~/.gitconfig', '+ .git/rr-cache directory created'],
      metrics: { rerereStatus: 'Enabled (active)', conflictFingerprint: 'Listening', autoResolutions: '0', rrCacheSize: 'Initialized' },
      scene: {
        entities: {
          rebaseRunner: d(-18, -6, { s: 4.4, h: 56, color: 'rose', glyph: 'cpu', label: ['git rebase'], sub: 'aborts at 3/15' }),
          conflictHunk: d(-6, -2, { s: 4.4, h: 54, color: 'amber', glyph: 'alert', label: ['Conflict Hunk'], sub: 'auth.ts clash' }),
          rrEngine: d(6, 0, { s: 4.4, h: 56, color: 'cyan', glyph: 'cpu', label: ['rerere Engine'], sub: 'daemon active' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Enabling rerere', [
            `$ git config --global rerere.enabled true`,
            `$ git config --global rerere.autoupdate true`,
            `# Git creates .git/rr-cache/ inside repositories`,
            `= rerere engine now automatically intercepts conflict hunks`,
          ], { icon: 'terminal' }),
        },
        links: {
          rc: h('rebaseRunner', 'conflictHunk', ['rebaseRunner', 'conflictHunk'], { label: 'aborts rebase' }),
          cr: h('conflictHunk', 'rrEngine', ['conflictHunk', 'rrEngine'], { label: 'intercept conflict' }),
        },
        flows: [{ route: ['cr'], kind: 'record', rate: 1.5 }],
      },
    },
    {
      short: 'Pre-image',
      chapter: 'technique',
      title: 'Recording the Pre-image: Fingerprinting Conflicts',
      body: [
        'When a conflict occurs, rerere strips file metadata, fingerprints the conflicting text lines, and computes a SHA hash.',
        'It saves the unresolved conflict in <code>.git/rr-cache/&lt;sha&gt;/preimage</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'The preimage hash depends ONLY on the conflicting hunk lines, independent of filename or commit SHA.',
      },
      changes: ['+ Conflict fingerprint hash generated', '+ Pre-image recorded in .git/rr-cache/<hash>/preimage'],
      metrics: { rerereStatus: 'Recording', conflictFingerprint: 'Hash 7d9e44...', autoResolutions: '0', rrCacheSize: '1 preimage' },
      scene: {
        entities: {
          rebaseRunner: d(-18, -6, { s: 4.4, h: 56, color: 'rose', glyph: 'cpu', label: ['git rebase'], sub: 'aborts at 3/15' }),
          conflictHunk: d(-6, -2, { s: 4.4, h: 54, color: 'amber', glyph: 'alert', label: ['Conflict Hunk'], sub: 'fingerprinted' }),
          rrEngine: d(6, 0, { s: 4.4, h: 56, color: 'cyan', glyph: 'cpu', label: ['rerere Engine'], sub: 'hash preimage' }),
          rrCache: b(-4, 16, { r: 2.2, h: 52, color: 'purple', glyph: 'database', label: ['.git/rr-cache'], sub: 'preimage saved' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Pre-image Recording Log', [
            `Recorded preimage for 'src/auth.ts'`,
            `$ ls .git/rr-cache/`,
            `7d9e44a1b2c3d4e5f6/`,
            `$ cat .git/rr-cache/7d9e44.../preimage`,
            `<<<<<<<`,
            `const token = req.headers['authorization'];`,
            `=======`,
            `const token = req.cookies.jwt;`,
            `>>>>>>>`,
          ], { icon: 'terminal' }),
        },
        links: {
          cr: h('conflictHunk', 'rrEngine', ['conflictHunk', 'rrEngine'], { label: 'fingerprint hunk' }),
          rc: h('rrEngine', 'rrCache', ['rrEngine', 'rrCache'], { label: 'store preimage' }),
        },
        flows: [{ route: ['cr', 'rc'], kind: 'record', rate: 1.6 }],
      },
    },
    {
      short: 'Post-image',
      chapter: 'technique',
      title: 'Recording the Post-image: Storing Resolution',
      body: [
        'You resolve the conflict manually in your editor and run <code>git add src/auth.ts</code>.',
        'rerere detects that the conflict has been resolved, takes a snapshot of your final code, and writes it to <code>.git/rr-cache/&lt;sha&gt;/postimage</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'This resolution is now permanently stored on your machine. You will never have to solve this specific conflict again.',
      },
      changes: ['+ Post-image captured on git add', '+ Solution stored permanently in .git/rr-cache/<hash>/postimage'],
      metrics: { rerereStatus: 'Recorded', conflictFingerprint: 'Hash 7d9e44...', autoResolutions: '0', rrCacheSize: '1 resolution' },
      scene: {
        entities: {
          rebaseRunner: d(-18, -6, { s: 4.4, h: 56, color: 'rose', glyph: 'cpu', label: ['git rebase'], sub: 'aborts at 3/15' }),
          conflictHunk: d(-6, -2, { s: 4.4, h: 54, color: 'green', glyph: 'shield', label: ['Resolved Hunk'], sub: 'manual fix' }),
          rrEngine: d(6, 0, { s: 4.4, h: 56, color: 'cyan', glyph: 'cpu', label: ['rerere Engine'], sub: 'hash postimage' }),
          rrCache: b(-4, 16, { r: 2.2, h: 52, color: 'purple', glyph: 'database', label: ['.git/rr-cache'], sub: 'pre/post pair' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Post-image Recording Log', [
            `$ git add src/auth.ts`,
            `Recorded resolution for 'src/auth.ts'.`,
            `$ cat .git/rr-cache/7d9e44.../postimage`,
            `const token = req.headers['authorization'] || req.cookies.jwt;`,
            `= Solution committed into rr-cache memory database`,
          ], { icon: 'terminal' }),
        },
        links: {
          cr: h('conflictHunk', 'rrEngine', ['conflictHunk', 'rrEngine'], { label: 'inspect fix' }),
          rc: h('rrEngine', 'rrCache', ['rrEngine', 'rrCache'], { label: 'store postimage' }),
        },
        flows: [{ route: ['cr', 'rc'], kind: 'record', rate: 1.6 }],
      },
    },
    {
      short: 'Auto Replay',
      chapter: 'execution',
      title: 'Automated Replay: Instantaneous Resolution',
      body: [
        'You run <code>git rebase --continue</code>. At commit 5, the exact same conflict strikes again.',
        'rerere computes the preimage hash, finds a matching entry in <code>.git/rr-cache</code>, and applies your previous resolution in <b>0.01 seconds</b>!',
      ],
      callout: {
        kind: 'insight',
        text: 'Notice the terminal output: "Resolved \'src/auth.ts\' using previous resolution." Zero human typing required!',
      },
      changes: ['+ rerere automatically resolves identical conflict at commit 5', '+ Manual conflict toil completely eliminated'],
      metrics: { rerereStatus: 'Replaying', conflictFingerprint: 'Match found', autoResolutions: '1 automated', rrCacheSize: 'Active match' },
      scene: {
        entities: {
          rebaseRunner: d(-18, -6, { s: 4.4, h: 56, color: 'blue', glyph: 'cpu', label: ['git rebase'], sub: 'replaying 5/15' }),
          rrEngine: d(-6, -2, { s: 4.4, h: 56, color: 'cyan', glyph: 'cpu', label: ['rerere Engine'], sub: 'cache hit' }),
          autoReplay: d(6, 0, { s: 4.4, h: 56, color: 'green', glyph: 'shield', label: ['Auto Replay'], sub: '0.01s replay' }),
          rrCache: b(-2, 16, { r: 2.2, h: 52, color: 'purple', glyph: 'database', label: ['.git/rr-cache'], sub: 'pre/post pair' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Automated Replay Log', [
            `Applying: feat: refresh token endpoint`,
            `Auto-merging src/auth.ts`,
            `CONFLICT (content): Merge conflict in src/auth.ts`,
            `Resolved 'src/auth.ts' using previous resolution.`,
            `= Conflict resolved instantly by cache replay!`,
          ], { icon: 'terminal' }),
        },
        links: {
          rc: h('rebaseRunner', 'rrEngine', ['rebaseRunner', 'rrEngine'], { label: 'replay commit' }),
          cr: h('rrCache', 'rrEngine', ['rrCache', 'rrEngine'], { label: 'read postimage' }),
          ra: h('rrEngine', 'autoReplay', ['rrEngine', 'autoReplay'], { label: 'apply resolution' }),
        },
        flows: [{ route: ['rc', 'cr', 'ra'], kind: 'replay', rate: 1.8 }],
      },
    },
    {
      short: 'autoupdate',
      chapter: 'scaling',
      title: 'Auto-Staging Resolved Hunks with rerere.autoupdate',
      body: [
        'By default, rerere updates the file on disk but leaves it unstaged so you can inspect it. With <code>rerere.autoupdate = true</code>, Git automatically stages the resolved files with <code>git add</code>.',
        'Now your 15-commit rebase executes from start to finish without pausing once!',
      ],
      callout: {
        kind: 'tip',
        text: 'You can also share .git/rr-cache across team members via a shared git branch or script to eliminate duplicate conflict work for entire teams.',
      },
      changes: ['+ Resolved files automatically staged into index', '+ Entire 15-commit rebase finishes in seconds'],
      metrics: { rerereStatus: 'Autonomous', conflictFingerprint: 'Clean', autoResolutions: 'All automated', rrCacheSize: 'Synchronized' },
      scene: {
        entities: {
          rebaseRunner: d(-18, -6, { s: 4.4, h: 56, color: 'green', glyph: 'cpu', label: ['git rebase'], sub: '15/15 passed' }),
          rrEngine: d(-6, -2, { s: 4.4, h: 56, color: 'cyan', glyph: 'cpu', label: ['rerere Engine'], sub: 'autonomous' }),
          autoReplay: d(6, 0, { s: 4.4, h: 56, color: 'green', glyph: 'shield', label: ['Auto Replay'], sub: '0.01s replay' }),
          autoUpdate: d(18, 4, { s: 4.4, h: 54, color: 'green', glyph: 'terminal', label: ['autoupdate'], sub: 'auto-staged' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Flawless Rebase Run', [
            `$ git rebase main`,
            `Applying: feat: auth tokens`,
            `Resolved 'src/auth.ts' using previous resolution.`,
            `Applying: feat: refresh route`,
            `Resolved 'src/auth.ts' using previous resolution.`,
            `Successfully rebased and updated refs/heads/feature.`,
            `= Rebase completed in 3 seconds with zero manual effort!`,
          ], { icon: 'terminal' }),
        },
        links: {
          rc: h('rebaseRunner', 'rrEngine', ['rebaseRunner', 'rrEngine'], { label: 'finish rebase' }),
          ra: h('rrEngine', 'autoReplay', ['rrEngine', 'autoReplay'], { label: 'auto-resolve' }),
          au: h('autoReplay', 'autoUpdate', ['autoReplay', 'autoUpdate'], { label: 'auto-stage index' }),
        },
        flows: [{ route: ['rc', 'ra', 'au'], kind: 'replay', rate: 1.8 }],
      },
    },
  ],
};
