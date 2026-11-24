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

export const gitRerereEngineLesson = {
  id: 'git-rerere-engine',
  title: 'Case 4: git rerere in Long-Running Rebase Hell',
  summary: 'Eliminate repetitive conflict resolution: how git rerere (Reuse Recorded Resolution) caches pre-image fingerprints and auto-resolves conflicts across rebases.',
  minutes: 25,
  level: 'advanced',
  metrics: ['rerereStatus', 'conflictFingerprint', 'autoResolutions', 'rrCacheSize'],
  legend: ['record', ['replay', 'auto resolution'], ['cache', '.git/rr-cache'], ['conflict', 'active clash']],
  goals: [
    { text: 'The pain of solving identical conflicts 20 times during git rebase', step: 1 },
    { text: 'Enabling rerere globally: git config --global rerere.enabled true', step: 2 },
    { text: 'Pre-image Fingerprinting: hashing conflict hunks into .git/rr-cache', step: 3 },
    { text: 'Post-image Recording: caching the approved resolution file', step: 4 },
    { text: 'Automatic Resolution Replay: recurring conflicts resolved instantly', step: 5 },
    { text: 'Maintenance & Pruning: managing .git/rr-cache and clearing mistakes', step: 6 },
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
          rebase: d(-10, -18, { s: 4.8, h: 50, color: 'rose', glyph: 'cpu', label: ['git rebase main'], sub: 'stopped at commit 3/15' }),
          clashHunk: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['Conflict Hunk'], sub: 'auth.ts collision' }),
          fatigueDev: d(10, 8, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['Developer Loop'], sub: 'repeats fix 15 times' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Rebase Conflict Hell', [
            `$ git rebase main`,
            `Applying: feat: auth tokens`,
            `CONFLICT (content): Merge conflict in src/auth.ts`,
            `error: Failed to merge in the changes.`,
            `# Fixed manually, ran git rebase --continue...`,
            `Applying: feat: refresh route`,
            `CONFLICT (content): Merge conflict in src/auth.ts (AGAIN!)`,
          ], { icon: 'terminal' }),
          zRr: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'REPETITIVE REBASE CONFLICT CYCLE'),
        },
        links: {
          rc: h('rebase', 'clashHunk', ['rebase', 'clashHunk'], { label: 'aborts on conflict' }),
          cf: h('clashHunk', 'fatigueDev', ['clashHunk', 'fatigueDev'], { label: 'manual toil' }),
        },
        flows: [{ route: ['rc', 'cf'], kind: 'conflict', rate: 1.5 }],
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
          configCmd: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['git config'], sub: 'rerere.enabled true' }),
          rerereDaemon: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['rerere Engine'], sub: 'monitoring merges' }),
          rrCacheDir: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'package', label: ['.git/rr-cache/'], sub: 'resolution database' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'rerere Global Config', [
            `$ git config --global rerere.enabled true`,
            `$ git config --global rerere.autoupdate true`,
            `$ ls -la .git/rr-cache`,
            `drwxr-xr-x 2 dawn staff 64 Nov 24 10:00 .`,
            `= rerere engine armed and ready`,
          ], { icon: 'terminal' }),
          zRr: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'RERERE ACTIVATION & CACHE INIT'),
        },
        links: {
          cr: h('configCmd', 'rerereDaemon', ['configCmd', 'rerereDaemon'], { label: 'activate config' }),
          rd: h('rerereDaemon', 'rrCacheDir', ['rerereDaemon', 'rrCacheDir'], { label: 'create cache dir' }),
        },
        flows: [{ route: ['cr', 'rd'], kind: 'record', rate: 1.5 }],
      },
    },
    {
      short: 'Pre-image Hash',
      chapter: 'technique',
      title: 'Pre-image Fingerprinting: Recording the Conflict',
      body: [
        'When a conflict occurs with rerere enabled, Git hashes the conflict hunk (excluding filenames and line numbers) into a unique SHA string.',
        'It creates a folder <code>.git/rr-cache/<hash>/</code> and saves the exact conflict markers as a file called <code>preimage</code>. Git prints: <em>Recorded preimage for \'src/auth.ts\'</em>.',
      ],
      callout: {
        kind: 'insight',
        text: 'The preimage hash is normalized: whitespace and line offsets do not prevent matching if the conflict hunk itself is identical.',
      },
      changes: ['+ Pre-image hash computed: a8f2c1...', '+ .git/rr-cache/a8f2c1/preimage written'],
      metrics: { rerereStatus: 'Recording', conflictFingerprint: 'a8f2c19e', autoResolutions: '0', rrCacheSize: '1 preimage' },
      scene: {
        entities: {
          conflictIn: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['Conflict In'], sub: 'src/auth.ts' }),
          hashCalc: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['Preimage Hasher'], sub: 'normalize & hash' }),
          preimageFile: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'package', label: ['preimage'], sub: '.git/rr-cache/a8f2c1/' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Pre-image Capture', [
            `$ git rebase main`,
            `Recorded preimage for 'src/auth.ts'`,
            `$ cat .git/rr-cache/a8f2c1/preimage`,
            `<<<<<<<`,
            `export const tokenExpire = '1h';`,
            `=======`,
            `export const tokenExpire = '24h';`,
            `>>>>>>>`,
          ], { icon: 'terminal' }),
          zRr: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'PRE-IMAGE FINGERPRINT HASHING'),
        },
        links: {
          ch: h('conflictIn', 'hashCalc', ['conflictIn', 'hashCalc'], { label: 'extract conflict hunk' }),
          hp: h('hashCalc', 'preimageFile', ['hashCalc', 'preimageFile'], { label: 'write preimage' }),
        },
        flows: [{ route: ['ch', 'hp'], kind: 'record', rate: 1.5 }],
      },
    },
    {
      short: 'Post-image Save',
      chapter: 'technique',
      title: 'Post-image Recording: Saving Your Fix',
      body: [
        'The developer resolves the conflict by picking <code>tokenExpire = 24h</code> and runs <code>git add src/auth.ts</code>.',
        'rerere detects that the conflict markers were removed! It writes the clean resolution file into <code>.git/rr-cache/<hash>/postimage</code>. Git prints: <em>Recorded resolution for \'src/auth.ts\'</em>.',
      ],
      callout: {
        kind: 'tip',
        text: 'The cache now contains both sides of the translation: preimage (problem) and postimage (solution).',
      },
      changes: ['+ Post-image resolution written to .git/rr-cache/a8f2c1/postimage', '+ Pair complete and ready for auto-replay'],
      metrics: { rerereStatus: 'Stored', conflictFingerprint: 'a8f2c19e', autoResolutions: '0', rrCacheSize: '1 pair (sealed)' },
      scene: {
        entities: {
          devFix: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['git add auth.ts'], sub: 'clean resolution' }),
          postRecorder: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['Post-image Recorder'], sub: 'detects marker removal' }),
          postimageFile: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['postimage'], sub: '.git/rr-cache/a8f2c1/' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Resolution Stored', [
            `$ git add src/auth.ts`,
            `Recorded resolution for 'src/auth.ts'.`,
            `$ cat .git/rr-cache/a8f2c1/postimage`,
            `export const tokenExpire = '24h';`,
            `$ git rebase --continue`,
            `= Resolution permanently cached in rr-cache`,
          ], { icon: 'terminal' }),
          zRr: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'POST-IMAGE RESOLUTION CAPTURE'),
        },
        links: {
          dp: h('devFix', 'postRecorder', ['devFix', 'postRecorder'], { label: 'staged clean file' }),
          pp: h('postRecorder', 'postimageFile', ['postRecorder', 'postimageFile'], { label: 'write postimage' }),
        },
        flows: [{ route: ['dp', 'pp'], kind: 'record', rate: 1.5 }],
      },
    },
    {
      short: 'Auto-Replay',
      chapter: 'execution',
      title: 'Automated Resolution Replay on Recurring Conflict',
      body: [
        'Rebase advances to commit 5. The exact same conflict occurs in <code>src/auth.ts</code>. But this time, developer intervention is ZERO!',
        'Git looks up the preimage hash in <code>.git/rr-cache/</code>, finds the matching <code>postimage</code>, and automatically splices the resolution into the file. Git prints: <em>Resolved \'src/auth.ts\' using previous resolution.</em>',
      ],
      callout: {
        kind: 'insight',
        text: 'With rerere.autoupdate enabled, Git even stages the resolved file automatically. Your rebase proceeds uninterrupted!',
      },
      changes: ['+ rerere auto-resolves conflict without stopping', '+ Rebase speed increases 10x'],
      metrics: { rerereStatus: 'Auto-replaying', conflictFingerprint: 'Match found', autoResolutions: '1 (instant)', rrCacheSize: 'Reused' },
      scene: {
        entities: {
          rebaseNext: d(-10, -18, { s: 4.8, h: 50, color: 'amber', glyph: 'cpu', label: ['Commit 5/15'], sub: 're-encounters conflict' }),
          replayEngine: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'cpu', label: ['Auto-Replay Engine'], sub: 'applies postimage patch' }),
          cleanFile: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['src/auth.ts'], sub: 'AUTO-RESOLVED' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Auto-Replay in Action', [
            `Applying: feat: refresh route`,
            `CONFLICT (content): Merge conflict in src/auth.ts`,
            `Resolved 'src/auth.ts' using previous resolution.`,
            `$ git status`,
            `Changes to be committed: modified: src/auth.ts`,
            `= Rebase proceeds seamlessly without manual typing`,
          ], { icon: 'terminal' }),
          zRr: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'AUTOMATIC RESOLUTION REPLAY'),
        },
        links: {
          rn: h('rebaseNext', 'replayEngine', ['rebaseNext', 'replayEngine'], { label: 'match preimage' }),
          rc: h('replayEngine', 'cleanFile', ['replayEngine', 'cleanFile'], { label: 'splice postimage' }),
        },
        flows: [{ route: ['rn', 'rc'], kind: 'replay', rate: 1.6 }],
      },
    },
    {
      short: 'Pruning Cache',
      chapter: 'scaling',
      title: 'Managing & Pruning .git/rr-cache',
      body: [
        'What if you accidentally recorded an incorrect resolution? Run <code>git rerere forget src/auth.ts</code> to clear the bad postimage.',
        'To prevent infinite disk accumulation, <code>git rerere gc</code> automatically prunes unresolved preimages after 15 days and resolved recordings after 60 days.',
      ],
      callout: {
        kind: 'tip',
        text: 'rr-cache is local to your repo, but you can share resolutions across your team by committing .git/rr-cache to a shared branch!',
      },
      changes: ['+ Bad resolutions can be erased via git rerere forget', '+ Old recordings auto-pruned after 60 days'],
      metrics: { rerereStatus: 'Pruned', conflictFingerprint: 'Clean', autoResolutions: 'Maintained', rrCacheSize: 'Optimized' },
      scene: {
        entities: {
          adminCmd: d(-10, -18, { s: 4.8, h: 50, color: 'rose', glyph: 'terminal', label: ['git rerere forget'], sub: 'delete wrong fix' }),
          gcPruner: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['git rerere gc'], sub: '60-day expiry' }),
          healthyCache: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Clean Cache'], sub: 'verified resolutions only' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Cache Management CLI', [
            `$ git rerere forget src/auth.ts`,
            `Updated preimage for 'src/auth.ts'`,
            `$ git rerere diff  # see how rerere resolved`,
            `$ git rerere status # list tracked files`,
            `$ git rerere gc    # prune entries older than 60 days`,
            `= Pristine, verified resolution memory`,
          ], { icon: 'terminal' }),
          zRr: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'RERERE CACHE MAINTENANCE & PRUNING'),
        },
        links: {
          ag: h('adminCmd', 'gcPruner', ['adminCmd', 'gcPruner'], { label: 'invalidate entry' }),
          gh: h('gcPruner', 'healthyCache', ['gcPruner', 'healthyCache'], { label: 'prune expired' }),
        },
        flows: [{ route: ['ag', 'gh'], kind: 'cache', rate: 1.5 }],
      },
    },
  ],
};
