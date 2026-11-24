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

export const gitEnvironmentsLifecycleLesson = {
  id: 'git-environments-lifecycle',
  title: '4 Git Zones: Working Dir to Remote Push',
  summary: 'Trace code progression through the 4 fundamental environments of Git: Working Directory, Staging Area (Index), Local Repository, and Remote Server.',
  minutes: 25,
  level: 'beginner',
  metrics: ['workingTree', 'stagingIndex', 'localCommits', 'remoteSynced'],
  legend: ['flow', ['change', 'file write'], ['stage', 'git add staging'], ['commit', 'snapshot commit'], ['sync', 'remote sync']],
  goals: [
    { text: 'Working Directory: untracked & modified files on OS filesystem', step: 1 },
    { text: 'Staging Area (Index): preparing the binary tree snapshot', step: 2 },
    { text: 'Local Repository: creating immutable Commit objects', step: 3 },
    { text: 'Remote Push: transferring packfiles over SSH/HTTPS', step: 4 },
    { text: 'Remote Fetch: updating tracking refs without touching working tree', step: 5 },
    { text: 'Merge & Fast-Forward: integrating remote and local branches', step: 6 },
  ],
  steps: [
    {
      short: 'Working Dir',
      chapter: 'setup',
      title: 'The Working Directory (OS Filesystem)',
      body: [
        'The <b>Working Directory</b> is the local directory on your filesystem where you edit files, run compilers, and write code.',
        'Files here can be in two states: <b>Untracked</b> (Git does not monitor them) or <b>Tracked</b> (Modified vs Unmodified against the last commit).',
      ],
      callout: {
        kind: 'insight',
        text: 'The working directory is a local sandbox. Git ignores disk edits until you explicitly tell it to notice them via git add.',
      },
      metrics: { workingTree: '1 file (dirty)', stagingIndex: '0 files', localCommits: '0 commits', remoteSynced: 'None' },
      scene: {
        entities: {
          dev: y(-10, -18, { label: 'developer', tags: [{ text: 'touch feature.ts', tone: 'blue', icon: 'terminal' }] }),
          work: d(0, -6, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['Working Tree'], sub: 'untracked / dirty' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Local Filesystem Status', [
            `$ git status -s`,
            `?? src/feature.ts (Untracked file)`,
            `$ echo "export const auth = () => {}" > src/feature.ts`,
            `File exists on disk: size = 32 bytes`,
            `= Git object store (.git/objects) remains untouched`,
          ], { icon: 'terminal' }),
          zWork: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'OS FILESYSTEM (SANDBOX)'),
        },
        links: {
          dw: h('dev', 'work', ['dev', 'work'], { label: 'write file' }),
        },
        flows: [{ route: ['dw'], kind: 'change', rate: 1.2 }],
      },
    },
    {
      short: 'Staging Area',
      chapter: 'execution',
      title: 'The Staging Area: Building the Index (.git/index)',
      body: [
        'Running <code>git add src/feature.ts</code> moves file content into the <b>Staging Area</b> (the <b>Index</b>).',
        'Under the hood, Git compresses the file with zlib, generates its SHA-1 hash, writes a Blob object to <code>.git/objects/</code>, and records the file path, mode (<code>100644</code>), and SHA pointer in <code>.git/index</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'The Index allows you to craft granular, atomic commits by staging only specific files or hunks while keeping other edits on disk.',
      },
      changes: ['+ SHA-1 blob stored in .git/objects/4b/825d...', '+ File path and permissions recorded in binary .git/index'],
      metrics: { workingTree: '1 file (clean)', stagingIndex: '1 file (staged)', localCommits: '0 commits', remoteSynced: 'None' },
      scene: {
        entities: {
          work: d(-10, -18, { s: 4.8, h: 50, color: 'slab', glyph: 'terminal', label: ['Working Tree'], sub: 'clean disk' }),
          stage: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'boxes', label: ['Staging Area'], sub: '.git/index binary cache' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Git Index Inspection', [
            `$ git add src/feature.ts`,
            `$ git ls-files --stage`,
            `100644 4b825dc642cb6eb9a060e54bf8d69288fbee4904 0 src/feature.ts`,
            `Blob written: .git/objects/4b/825dc6...`,
            `= Staged and ready for snapshot commit`,
          ], { icon: 'terminal' }),
          zStage: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'STAGING AREA (.GIT/INDEX)'),
        },
        links: {
          ws: h('work', 'stage', ['work', 'stage'], { label: 'git add' }),
        },
        flows: [{ route: ['ws'], kind: 'stage', rate: 1.5 }],
      },
    },
    {
      short: 'Local Commit',
      chapter: 'execution',
      title: 'Local Repository: Sealing the Commit Snapshot',
      body: [
        'Running <code>git commit -m "feat: add auth"</code> creates an immutable <b>Commit object</b>.',
        'Git writes a Tree object for the folder structure, creates the Commit object pointing to the tree, author, timestamp, and parent commit, and fast-forwards <code>refs/heads/main</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Commits are completely local. You can commit hundreds of times while offline on a plane with zero network requests.',
      },
      changes: ['+ Tree object written to .git/objects', '+ Commit object c4f1a2 sealed with author and timestamp', '+ refs/heads/main advanced'],
      metrics: { workingTree: 'Clean', stagingIndex: 'Clean', localCommits: '1 commit (c4f1a2)', remoteSynced: 'Behind (1 unpushed)' },
      scene: {
        entities: {
          stage: d(-10, -18, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['Staging Area'], sub: 'clean index' }),
          localRepo: b(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['Local Repo'], sub: 'HEAD -> main (c4f1a2)' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Commit Object Inspection', [
            `$ git cat-file -p c4f1a2`,
            `tree 8a3f91b2c4...`,
            `parent e8d9c2...`,
            `author Developer <dev@company.com> 1700000000 +0000`,
            `committer Developer <dev@company.com> 1700000000 +0000`,
            `feat: add auth`,
          ], { icon: 'terminal' }),
          zRepo: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'LOCAL OBJECT DATABASE (.GIT)'),
        },
        links: {
          sl: h('stage', 'localRepo', ['stage', 'localRepo'], { label: 'git commit' }),
        },
        flows: [{ route: ['sl'], kind: 'commit', rate: 1.6 }],
      },
    },
    {
      short: 'Remote Push',
      chapter: 'execution',
      title: 'Remote Push: Synchronizing Packfiles to GitHub',
      body: [
        'Running <code>git push origin main</code> connects to the remote server over SSH or HTTPS.',
        'Git negotiates missing objects via the Smart Transfer Protocol, packs all new commits, trees, and blobs into a compressed <b>packfile</b>, streams it, and updates <code>refs/remotes/origin/main</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Until you push, your commit history exists only on your local machine. Pushing distributes the immutable graph to the rest of the team.',
      },
      changes: ['+ Packfile streamed over HTTPS/SSH', '+ Remote refs/heads/main updated on GitHub', '+ Local tracking ref refs/remotes/origin/main updated'],
      metrics: { workingTree: 'Clean', stagingIndex: 'Clean', localCommits: '1 commit', remoteSynced: '100% Synced' },
      scene: {
        entities: {
          localRepo: b(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['Local Repo'], sub: 'main (c4f1a2)' }),
          remoteServer: d(0, -6, { s: 4.8, h: 50, color: 'purple', glyph: 'cloud', label: ['Remote (GitHub)'], sub: 'origin/main (c4f1a2)' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Git Smart Transfer Protocol', [
            `$ git push origin main`,
            `Counting objects: 4, done.`,
            `Delta compression using up to 8 threads`,
            `Compressing objects: 100% (2/2), done.`,
            `Writing objects: 100% (4/4), 382 bytes, done.`,
            `To github.com:org/repo.git`,
            `   e8d9c2..c4f1a2  main -> main`,
          ], { icon: 'terminal' }),
          zPush: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'REMOTE REPOSITORY SYNCHRONIZATION'),
        },
        links: {
          lr: h('localRepo', 'remoteServer', ['localRepo', 'remoteServer'], { label: 'git push origin main' }),
        },
        flows: [{ route: ['lr'], kind: 'sync', rate: 1.8 }],
      },
    },
    {
      short: 'Remote Fetch',
      chapter: 'execution',
      title: 'Remote Fetch: Updating Tracking Refs Safely',
      body: [
        'When teammates push commits, running <code>git fetch origin</code> downloads their new objects into your <code>.git/objects/</code>.',
        'Crucially, <code>git fetch</code> updates <b>only</b> your remote tracking branch (<code>origin/main</code>). It does NOT modify your local <code>main</code> branch or your working directory.',
      ],
      callout: {
        kind: 'insight',
        text: 'git fetch is 100% safe to run at any time — it never causes merge conflicts or overwrites uncommitted local work.',
      },
      changes: ['+ Downloaded 3 new remote commit objects', '+ Updated refs/remotes/origin/main to 9f8a7b', '+ Local main remains untouched at c4f1a2'],
      metrics: { workingTree: 'Clean', stagingIndex: 'Clean', localCommits: '1 commit behind', remoteSynced: 'Remote Ahead (+3)' },
      scene: {
        entities: {
          remoteServer: d(-10, -18, { s: 4.8, h: 50, color: 'purple', glyph: 'cloud', label: ['Remote (GitHub)'], sub: 'HEAD -> 9f8a7b' }),
          trackingRef: b(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'gitBranch', label: ['origin/main'], sub: 'Tracking Ref: 9f8a7b' }),
          localMain: b(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'terminal', label: ['Local main'], sub: 'Untouched at c4f1a2' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Git Fetch Log', [
            `$ git fetch origin`,
            `From github.com:org/repo`,
            `   c4f1a2..9f8a7b  main       -> origin/main`,
            `$ git status`,
            `Your branch is behind 'origin/main' by 3 commits.`,
            `= Working tree safely unmodified`,
          ], { icon: 'terminal' }),
          zFetch: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'REMOTE TRACKING REFS'),
        },
        links: {
          rt: h('remoteServer', 'trackingRef', ['remoteServer', 'trackingRef'], { label: 'git fetch' }),
          tl: h('trackingRef', 'localMain', ['trackingRef', 'localMain'], { label: 'inspect divergence' }),
        },
        flows: [{ route: ['rt', 'tl'], kind: 'sync', rate: 1.4 }],
      },
    },
    {
      short: 'Merge & Pull',
      chapter: 'solution',
      title: 'Fast-Forward vs Three-Way Merge (git pull)',
      body: [
        '<code>git pull</code> is a convenience shorthand combining <code>git fetch</code> followed immediately by <code>git merge origin/main</code>.',
        'If local history has not diverged, Git performs a <b>Fast-Forward</b> (moving the branch pointer forward). If both local and remote have new commits, Git creates a 3-way Merge Commit.',
      ],
      callout: {
        kind: 'tip',
        text: 'Best practice: use git pull --ff-only or git pull --rebase to keep linear commit histories without accidental merge bubbles.',
      },
      changes: ['+ Merged origin/main into local main', '+ Fast-forwarded local pointer to 9f8a7b', '+ Working tree files refreshed to latest state'],
      metrics: { workingTree: 'Updated & Clean', stagingIndex: 'Clean', localCommits: 'Synced with Remote', remoteSynced: '100% In-Sync' },
      scene: {
        entities: {
          trackingRef: b(-10, -18, { s: 4.8, h: 50, color: 'cyan', glyph: 'gitBranch', label: ['origin/main'], sub: '9f8a7b' }),
          mergeEngine: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'shield', label: ['Merge Engine'], sub: 'Fast-Forward (ff-only)' }),
          updatedWork: d(10, 8, { s: 4.6, h: 48, color: 'green', glyph: 'terminal', label: ['Working Tree'], sub: 'Files synced to 9f8a7b' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Fast-Forward Merge', [
            `$ git merge origin/main --ff-only`,
            `Updating c4f1a2..9f8a7b`,
            `Fast-forward`,
            ` src/auth.ts   | 42 ++++++++++++++++++`,
            ` src/router.ts |  8 +---`,
            ` 2 files changed, 42 insertions(+), 8 deletions(-)`,
            `= Local branch and working directory fully updated`,
          ], { icon: 'terminal' }),
          zMerge: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'BRANCH INTEGRATION (MERGE)'),
        },
        links: {
          tm: h('trackingRef', 'mergeEngine', ['trackingRef', 'mergeEngine'], { label: 'merge changes' }),
          mu: h('mergeEngine', 'updatedWork', ['mergeEngine', 'updatedWork'], { label: 'update working files' }),
        },
        flows: [{ route: ['tm', 'mu'], kind: 'commit', rate: 1.6 }],
      },
    },
  ],
};
