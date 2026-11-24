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
          rebaseProcess: d(-7, 7, { s: 5.0, h: 54, color: 'rose', glyph: 'cpu', label: ['git rebase'], sub: 'aborts at 3/15' }),
          conflictHunk: d(0, 0, { s: 5.2, h: 56, color: 'amber', glyph: 'alert', label: ['Conflict Hunk'], sub: 'auth.ts clash' }),
          developerToil: y(7, -7, { label: 'Fatigued Dev', tags: [{ text: 'repeating fix x15', tone: 'rose', icon: 'terminal' }] }),
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
          rc: h('rebaseProcess', 'conflictHunk', ['rebaseProcess', 'conflictHunk'], { label: 'aborts rebase' }),
          cd: h('conflictHunk', 'developerToil', ['conflictHunk', 'developerToil'], { label: 'manual toil' }),
        },
        flows: [{ route: ['rc', 'cd'], kind: 'conflict', rate: 1.5 }],
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
          configCmd: y(-7, 7, { label: 'git config', tags: [{ text: 'rerere.enabled true', tone: 'green', icon: 'terminal' }] }),
          rerereDaemon: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'cpu', label: ['rerere Engine'], sub: 'monitoring merges' }),
          rrCacheDir: b(7, -7, { s: 4.8, h: 50, color: 'purple', glyph: 'database', label: ['.git/rr-cache/'], sub: 'resolution db' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'rerere Global Config', [
            `$ git config --global rerere.enabled true`,
            `$ git config --global rerere.autoupdate true`,
            `$ ls -la .git/rr-cache`,
            `drwxr-xr-x 2 dawn staff 64 Nov 24 10:00 .`,
            `= rerere engine armed and ready`,
          ], { icon: 'terminal' }),
        },
        links: {
          cr: h('configCmd', 'rerereDaemon', ['configCmd', 'rerereDaemon'], { label: 'enable daemon' }),
          rd: h('rerereDaemon', 'rrCacheDir', ['rerereDaemon', 'rrCacheDir'], { label: 'init storage' }),
        },
        flows: [{ route: ['cr', 'rd'], kind: 'record', rate: 1.5 }],
      },
    },
    {
      short: 'Pre-image Recording',
      chapter: 'execution',
      title: 'Recording the Pre-image: Fingerprinting the Conflict',
      body: [
        'When a conflict occurs with rerere enabled, Git hashes the conflict hunk (both ours and theirs) to create a unique SHA-1 fingerprint (e.g. <code>68a2bc...</code>).',
        'It saves the raw conflict markers into <code>.git/rr-cache/68a2bc/preimage</code>. Git prints: <em>Recorded preimage for \'src/auth.ts\'</em>.',
      ],
      callout: {
        kind: 'insight',
        text: 'The preimage fingerprint is normalized: whitespace variations can be ignored, creating a robust match across commits.',
      },
      changes: ['+ SHA-1 fingerprint computed for conflict hunk', '+ Preimage saved to .git/rr-cache/68a2bc/preimage'],
      metrics: { rerereStatus: 'Recording', conflictFingerprint: 'SHA: 68a2bc', autoResolutions: '0', rrCacheSize: '1 preimage' },
      scene: {
        entities: {
          conflictFile: d(-7, 7, { s: 5.0, h: 54, color: 'amber', glyph: 'terminal', label: ['auth.ts Clash'], sub: 'unresolved hunk' }),
          fingerprintEngine: d(0, 0, { s: 5.2, h: 56, color: 'blue', glyph: 'cpu', label: ['Fingerprinter'], sub: 'hashes hunk' }),
          preimageStore: b(7, -7, { s: 4.8, h: 50, color: 'purple', glyph: 'database', label: ['rr-cache/68a2bc'], sub: 'preimage saved' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Pre-image Recording Output', [
            `$ git rebase main`,
            `CONFLICT (content): Merge conflict in src/auth.ts`,
            `Recorded preimage for 'src/auth.ts'`,
            `$ cat .git/rr-cache/68a2bc/preimage`,
            `<<<<<<<`,
            `return generateV2Token(user);`,
            `=======`,
            `return generateJwtToken(user, SECRET);`,
            `>>>>>>>`,
          ], { icon: 'terminal' }),
        },
        links: {
          cf: h('conflictFile', 'fingerprintEngine', ['conflictFile', 'fingerprintEngine'], { label: 'read conflict' }),
          fp: h('fingerprintEngine', 'preimageStore', ['fingerprintEngine', 'preimageStore'], { label: 'save preimage' }),
        },
        flows: [{ route: ['cf', 'fp'], kind: 'record', rate: 1.6 }],
      },
    },
    {
      short: 'Post-image Recording',
      chapter: 'execution',
      title: 'Recording the Post-image: Caching the Solution',
      body: [
        'The developer resolves the conflict by hand (e.g. combining both token generators) and stages it: <code>git add src/auth.ts</code>.',
        'At that exact moment, rerere compares the staged file against the preimage, extracts the resolution diff, and writes it to <code>.git/rr-cache/68a2bc/postimage</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'The resolution is now permanently cached. If this exact conflict is EVER encountered again anywhere in this repo, Git will solve it for you.',
      },
      changes: ['+ Developer resolves conflict manually ONE TIME', '+ Post-image stored in .git/rr-cache/68a2bc/postimage'],
      metrics: { rerereStatus: 'Cached', conflictFingerprint: 'SHA: 68a2bc', autoResolutions: '0', rrCacheSize: 'Complete' },
      scene: {
        entities: {
          resolvedAuth: d(-7, 7, { s: 5.0, h: 54, color: 'green', glyph: 'terminal', label: ['auth.ts Clean'], sub: 'resolved hunk' }),
          diffComparator: d(0, 0, { s: 5.2, h: 56, color: 'green', glyph: 'cpu', label: ['Diff Extractor'], sub: 'extracts fix' }),
          postimageStore: b(7, -7, { s: 4.8, h: 50, color: 'green', glyph: 'database', label: ['postimage File'], sub: 'solution cached' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Post-image Recording Event', [
            `$ git add src/auth.ts`,
            `Recorded resolution for 'src/auth.ts'.`,
            `$ cat .git/rr-cache/68a2bc/postimage`,
            `return generateJwtV2Token(user, SECRET);`,
            `= Solution permanently remembered by Git`,
          ], { icon: 'terminal' }),
        },
        links: {
          rd: h('resolvedAuth', 'diffComparator', ['resolvedAuth', 'diffComparator'], { label: 'compare staged' }),
          dp: h('diffComparator', 'postimageStore', ['diffComparator', 'postimageStore'], { label: 'write postimage' }),
        },
        flows: [{ route: ['rd', 'dp'], kind: 'record', rate: 1.6 }],
      },
    },
    {
      short: 'Automated Replay',
      chapter: 'execution',
      title: 'Automated Replay: Instant 0.01s Resolution',
      body: [
        'Rebase advances to commit 5: <code>feat: refresh route</code>. The exact same conflict occurs in <code>src/auth.ts</code>.',
        'Instead of stopping and making you fix it, rerere recognizes fingerprint <code>68a2bc</code>, pulls the post-image, and applies it cleanly. Git prints: <em>Resolved \'src/auth.ts\' using previous resolution.</em>',
      ],
      callout: {
        kind: 'insight',
        text: 'What previously took 15 manual conflict interventions now executes in 1 single keystroke: git rebase --continue.',
      },
      changes: ['+ Identical conflict encountered in commit 5', '+ rerere automatically replays cached resolution without human input'],
      metrics: { rerereStatus: 'Auto-replayed', conflictFingerprint: '68a2bc matched', autoResolutions: '1 (Auto)', rrCacheSize: 'Reused' },
      scene: {
        entities: {
          rebaseNext: d(-7, 7, { s: 5.0, h: 54, color: 'blue', glyph: 'cpu', label: ['Rebase Commit 5'], sub: 'same collision' }),
          replayEngine: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'shield', label: ['rerere Replay'], sub: 'instant match' }),
          autoFixedAuth: d(7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['auth.ts (Auto)'], sub: '0s resolution' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'rerere Replay Execution', [
            `$ git rebase --continue`,
            `Applying: feat: refresh route`,
            `Auto-merging src/auth.ts`,
            `CONFLICT (content): Merge conflict in src/auth.ts`,
            `Resolved 'src/auth.ts' using previous resolution.`,
            `= Conflict vanished in 1 millisecond!`,
          ], { icon: 'terminal' }),
        },
        links: {
          nr: h('rebaseNext', 'replayEngine', ['rebaseNext', 'replayEngine'], { label: 'match hash' }),
          ra: h('replayEngine', 'autoFixedAuth', ['replayEngine', 'autoFixedAuth'], { label: 'auto-apply' }),
        },
        flows: [{ route: ['nr', 'ra'], kind: 'replay', rate: 1.8 }],
      },
    },
    {
      short: 'autoupdate Staging',
      chapter: 'solution',
      title: 'Zero-Touch Autoupdate: rerere.autoupdate',
      body: [
        'By default, rerere modifies the working tree file but leaves it unstaged so you can inspect it. With <code>rerere.autoupdate = true</code>, Git runs <code>git add</code> automatically.',
        'Now your rebase sails through all 15 commits from start to finish without pausing a single time!',
      ],
      callout: {
        kind: 'tip',
        text: 'Team sharing: You can even commit .git/rr-cache into a shared repository or git-rerere-train to share resolutions across all engineers in your company!',
      },
      changes: ['+ rerere.autoupdate stages resolved files automatically', '+ Rebase across 15 commits completes with zero friction'],
      metrics: { rerereStatus: 'Autonomous', conflictFingerprint: 'Clean', autoResolutions: '14 saved', rrCacheSize: 'Trained' },
      scene: {
        entities: {
          rebaseStream: d(-7, 0, { s: 5.0, h: 54, color: 'blue', glyph: 'gitBranch', label: ['Rebase Stream'], sub: '15 commits' }),
          autoupdateEngine: d(0, 0, { s: 5.2, h: 56, color: 'green', glyph: 'cpu', label: ['autoupdate'], sub: 'auto git add' }),
          cleanMainTip: d(7, 0, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['Rebased Trunk'], sub: '100% complete' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Final Rebase Throughput', [
            `Applying: feat: auth tokens -> auto-resolved & staged`,
            `Applying: feat: refresh route -> auto-resolved & staged`,
            `Applying: feat: logout route -> auto-resolved & staged`,
            `Successfully rebased and updated refs/heads/feat-auth.`,
            `= 0 manual conflicts, hours of toil eliminated`,
          ], { icon: 'terminal' }),
        },
        links: {
          sa: h('rebaseStream', 'autoupdateEngine', ['rebaseStream', 'autoupdateEngine'], { label: 'stream commits' }),
          ac: h('autoupdateEngine', 'cleanMainTip', ['autoupdateEngine', 'cleanMainTip'], { label: 'auto-stage' }),
        },
        flows: [{ route: ['sa', 'ac'], kind: 'replay', rate: 1.8 }],
      },
    },
  ],
};
