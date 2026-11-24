// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitEnvironmentsLifecycleLesson = {
  id: 'git-environments-lifecycle',
  title: 'Git Environments: Working Directory, Index & Object Store',
  summary: 'Trace the lifecycle of a byte from local disk edits through the staging index, sealed commit objects, and remote packfile synchronization.',
  minutes: 25,
  level: 'beginner',
  metrics: ['workingTree', 'stagingIndex', 'localCommits', 'remoteSynced'],
  legend: ['flow', ['change', 'working tree edit'], ['stage', 'staged into index'], ['commit', 'sealed commit'], ['sync', 'remote sync']],
  goals: [
    { text: 'The Working Directory: Untracked and dirty disk states', step: 1 },
    { text: 'The Staging Area: Crafting atomic commits via .git/index', step: 2 },
    { text: 'The Local Repository: Sealing immutable commit snapshots', step: 3 },
    { text: 'Remote Push: Negotiating packfiles and updating remote refs', step: 4 },
    { text: 'Remote Fetch: Updating tracking branches without touching disk', step: 5 },
    { text: 'Fast-forward vs 3-way merge integration (git pull)', step: 6 },
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
      metrics: { workingTree: '1 dirty file', stagingIndex: '0 staged', localCommits: '0 commits', remoteSynced: 'Not connected' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Developer', tags: [{ text: 'touch app.ts', tone: 'blue', icon: 'terminal' }] }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Local Filesystem Status', [
            `$ git status -s`,
            `?? src/app.ts (Untracked file)`,
            `$ echo "export const app = 1" > src/app.ts`,
            `File exists on disk: size = 32 bytes`,
            `= Git repository (.git/) remains untouched`,
          ], { icon: 'terminal' }),
        },
        links: {},
        flows: [],
      },
    },
    {
      short: 'Staging Area',
      chapter: 'execution',
      title: 'The Staging Area: Building the Index (.git/index)',
      body: [
        'Running <code>git add src/app.ts</code> moves file content into the <b>Staging Area</b> (the <b>Index</b>).',
        'Under the hood, Git compresses the file with zlib, generates its SHA-1 hash, writes a Blob object to <code>.git/objects/</code>, and records the file path, mode (<code>100644</code>), and SHA pointer in <code>.git/index</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'The Index allows you to craft granular, atomic commits by staging only specific files or hunks while keeping other edits on disk.',
      },
      changes: ['+ git add src/app.ts executed', '+ Staged entry recorded in .git/index', '+ SHA-1 blob 4b825d written to .git/objects'],
      metrics: { workingTree: 'Clean', stagingIndex: '1 staged file', localCommits: '0 commits', remoteSynced: 'None' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Working Tree', tags: [{ text: 'git add', tone: 'blue', icon: 'terminal' }] }),
          stagingIndex: b(-6, -2, { r: 2.2, h: 50, color: 'blue', glyph: 'boxes', label: ['.git/index'], sub: 'staged cache' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Git Index Inspection', [
            `$ git add src/app.ts`,
            `$ git ls-files --stage`,
            `100644 4b825dc642... 0 src/app.ts`,
            `Blob written: .git/objects/4b/825dc6...`,
            `= Staged and ready for snapshot commit`,
          ], { icon: 'terminal' }),
        },
        links: {
          ws: h('devWorkspace', 'stagingIndex', ['devWorkspace', 'stagingIndex'], { label: 'git add' }),
        },
        flows: [{ route: ['ws'], kind: 'stage', rate: 1.5 }],
      },
    },
    {
      short: 'Local Commit',
      chapter: 'execution',
      title: 'Local Repository: Sealing the Commit Snapshot',
      body: [
        'Running <code>git commit -m "feat: add app"</code> creates an immutable <b>Commit object</b>.',
        'Git writes a Tree object for the folder structure, creates the Commit object pointing to the tree, author, timestamp, and parent commit, and fast-forwards <code>refs/heads/main</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Commits are completely local. You can commit hundreds of times while offline on a plane with zero network requests.',
      },
      changes: ['+ Commit c4f1a2 sealed in local repository', '+ HEAD -> refs/heads/main advanced', '~ Local is ahead of remote by 1 commit'],
      metrics: { workingTree: 'Clean', stagingIndex: 'Clean', localCommits: '1 commit (c4f1a2)', remoteSynced: 'Behind (+1 unpushed)' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Working Tree', tags: [{ text: 'commit clean', tone: 'blue', icon: 'terminal' }] }),
          stagingIndex: b(-6, -2, { r: 2.2, h: 50, color: 'blue', glyph: 'boxes', label: ['.git/index'], sub: 'index clean' }),
          localRepo: d(6, 0, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Local Repo'], sub: 'HEAD -> main' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Commit Object Inspection', [
            `$ git cat-file -p c4f1a2`,
            `tree 8a3f91b2c4...`,
            `parent e8d9c2...`,
            `author Developer <dev@org.com> 1700000000 +0000`,
            `feat: add app`,
            `= Local branch pointer advanced`,
          ], { icon: 'terminal' }),
        },
        links: {
          ws: h('devWorkspace', 'stagingIndex', ['devWorkspace', 'stagingIndex'], { label: 'staged' }),
          sl: h('stagingIndex', 'localRepo', ['stagingIndex', 'localRepo'], { label: 'git commit' }),
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
      changes: ['+ Packfile streamed to remote GitHub', '+ Remote branch origin/main updated to c4f1a2', '~ Local and remote are 100% synchronized'],
      metrics: { workingTree: 'Clean', stagingIndex: 'Clean', localCommits: '1 commit', remoteSynced: '100% Synced' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Working Tree', tags: [{ text: 'git push', tone: 'blue', icon: 'terminal' }] }),
          stagingIndex: b(-6, -2, { r: 2.2, h: 50, color: 'blue', glyph: 'boxes', label: ['.git/index'], sub: 'index clean' }),
          localRepo: d(6, 0, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Local Repo'], sub: 'main (c4f1a2)' }),
          remoteServer: d(14, 6, { s: 4.4, h: 56, color: 'purple', glyph: 'cloud', label: ['GitHub Remote'], sub: 'origin/main' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Git Smart Transfer Protocol', [
            `$ git push origin main`,
            `Counting objects: 4, done.`,
            `Delta compression using up to 8 threads`,
            `Compressing objects: 100% (2/2), done.`,
            `Writing objects: 100% (4/4), 382 bytes, done.`,
            `To github.com:org/repo.git`,
            `   e8d9c2..c4f1a2  main -> main`,
          ], { icon: 'terminal' }),
        },
        links: {
          ws: h('devWorkspace', 'stagingIndex', ['devWorkspace', 'stagingIndex'], { label: 'staged' }),
          sl: h('stagingIndex', 'localRepo', ['stagingIndex', 'localRepo'], { label: 'committed' }),
          lr: h('localRepo', 'remoteServer', ['localRepo', 'remoteServer'], { label: 'git push' }),
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
      changes: ['+ Downloaded 3 new remote commits into .git/objects', '+ Updated tracking ref refs/remotes/origin/main to 9f8a7b', '~ Working directory and local main remain untouched'],
      metrics: { workingTree: 'Clean', stagingIndex: 'Clean', localCommits: '1 behind', remoteSynced: 'Remote Ahead (+3)' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Working Tree', tags: [{ text: 'git fetch', tone: 'blue', icon: 'terminal' }] }),
          stagingIndex: b(-6, -2, { r: 2.2, h: 50, color: 'blue', glyph: 'boxes', label: ['.git/index'], sub: 'index clean' }),
          localRepo: d(6, 0, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Local Repo'], sub: 'main (c4f1a2)' }),
          remoteServer: d(14, 6, { s: 4.4, h: 56, color: 'purple', glyph: 'cloud', label: ['GitHub Remote'], sub: 'HEAD: 9f8a7b' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Git Fetch Log', [
            `$ git fetch origin`,
            `From github.com:org/repo`,
            `   c4f1a2..9f8a7b  main -> origin/main`,
            `$ git status`,
            `Your branch is behind 'origin/main' by 3 commits.`,
            `= Working tree safely unmodified`,
          ], { icon: 'terminal' }),
        },
        links: {
          ws: h('devWorkspace', 'stagingIndex', ['devWorkspace', 'stagingIndex'], { label: 'staged' }),
          sl: h('stagingIndex', 'localRepo', ['stagingIndex', 'localRepo'], { label: 'committed' }),
          rl: h('remoteServer', 'localRepo', ['remoteServer', 'localRepo'], { label: 'git fetch' }),
        },
        flows: [{ route: ['rl'], kind: 'sync', rate: 1.6 }],
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
      changes: ['+ Fast-forwarded local main to 9f8a7b', '+ Refreshed working directory files to latest upstream state', '= All 4 Git environments fully in sync'],
      metrics: { workingTree: 'Synced & Clean', stagingIndex: 'Clean', localCommits: 'Synced with Remote', remoteSynced: '100% Up to Date' },
      scene: {
        entities: {
          devWorkspace: y(-18, -6, { label: 'Working Tree', tags: [{ text: 'synced 9f8a7b', tone: 'green', icon: 'terminal' }] }),
          stagingIndex: b(-6, -2, { r: 2.2, h: 50, color: 'blue', glyph: 'boxes', label: ['.git/index'], sub: 'index clean' }),
          localRepo: d(6, 0, { s: 4.4, h: 56, color: 'green', glyph: 'gitBranch', label: ['Local Repo'], sub: 'main (9f8a7b)' }),
          remoteServer: d(14, 6, { s: 4.4, h: 56, color: 'green', glyph: 'cloud', label: ['GitHub Remote'], sub: 'origin/main' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Fast-Forward Merge', [
            `$ git merge origin/main --ff-only`,
            `Updating c4f1a2..9f8a7b`,
            `Fast-forward`,
            ` src/app.ts    | 42 ++++++++++++++++++`,
            ` 1 file changed, 42 insertions(+)`,
            `= Local branch and working directory fully updated`,
          ], { icon: 'terminal' }),
        },
        links: {
          ws: h('devWorkspace', 'stagingIndex', ['devWorkspace', 'stagingIndex'], { label: 'synced' }),
          sl: h('stagingIndex', 'localRepo', ['stagingIndex', 'localRepo'], { label: 'synced' }),
          lr: h('localRepo', 'remoteServer', ['localRepo', 'remoteServer'], { label: 'synced' }),
        },
        flows: [{ route: ['lr', 'sl', 'ws'], kind: 'commit', rate: 1.6 }],
      },
    },
  ],
};
