// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDevice as y,
  makeDb as b,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitEnvironmentsLifecycleLesson = {
  id: 'git-environments-lifecycle',
  title: '4 Git Zones: Working Dir to Remote Push',
  summary: 'Trace code progression through the 4 fundamental environments of Git: Working Directory, Staging Area (Index), Local Repository, and Remote Server.',
  minutes: 12,
  level: 'beginner',
  metrics: ['workingTree', 'stagingIndex', 'localCommits', 'remoteSynced'],
  legend: ['code', ['change', 'untracked'], ['stage', 'staged'], ['commit', 'committed']],
  goals: [
    { text: 'Understand the Working Directory & filesystem tracking', step: 1 },
    { text: 'The Staging Area (Index) as the gatekeeper to history', step: 3 },
    { text: 'Committing to the Local Repository DAG', step: 5 },
    { text: 'Synchronizing snapshots to Remote (GitHub / GitLab)', step: 7 },
  ],
  steps: [
    {
      short: 'Working Tree',
      chapter: 'setup',
      title: 'The Working Directory (Uncontrolled Filesystem)',
      body: [
        'When you run <code>git init</code> in a directory, Git does not automatically track your files. The files exist merely as raw bytes on your operating system’s disk (Working Directory).',
        'Any modifications or newly created files (like <code>feature.ts</code>) are in the <b>Untracked</b> or <b>Modified</b> state until explicitly registered with Git.',
      ],
      callout: {
        kind: 'insight',
        text: 'The working directory is a sandbox. Git ignores everything here until you issue a command to notice it.',
      },
      metrics: { workingTree: '1 file (dirty)', stagingIndex: '0 files', localCommits: '0 commits', remoteSynced: 'None' },
      scene: {
        entities: {
          dev: y(-14, 0, { label: 'developer', tags: [{ text: 'touch feature.ts', icon: 'hammer' }] }),
          work: d(-5, 0, { color: 'amber', glyph: 'terminal', label: ['Working Tree'], sub: 'untracked / dirty' }),
          zWork: x({ x0: -9, x1: -1, y0: -7, y1: 7 }, 'OS FILESYSTEM'),
        },
        links: {
          dw: h('dev', 'work', ['dev', 'work'], { label: 'write file' }),
        },
        flows: [{ route: ['dw'], kind: 'change', rate: 1.2 }],
      },
    },
    {
      short: 'Git Add',
      chapter: 'technique',
      title: 'git add: Promoting into the Staging Area (Index)',
      body: [
        'Running <code>git add feature.ts</code> copies the file content into the Git object database as a Blob object and records its SHA-1 hash in the binary <code>.git/index</code> file.',
        'The Staging Area is your draft snapshot. It allows you to selectively stage precise files or hunks (via <code>git add -p</code>) before locking them into permanent commit history.',
      ],
      callout: {
        kind: 'tip',
        text: 'The Index separates what is currently edited on disk from what is proposed for the next commit snapshot.',
      },
      changes: ['+ SHA-1 blob stored in .git/objects', '+ File path & permissions recorded in .git/index'],
      metrics: { workingTree: '1 file (clean)', stagingIndex: '1 file (staged)', localCommits: '0 commits', remoteSynced: 'None' },
      scene: {
        entities: {
          dev: y(-16, 0, { label: 'developer' }),
          work: d(-8, 0, { color: 'amber', glyph: 'terminal', label: ['Working Tree'], sub: 'clean' }),
          stage: d(4, 0, { color: 'blue', glyph: 'boxes', label: ['Staging Area'], sub: '.git/index' }),
          zStage: x({ x0: 0, x1: 8, y0: -7, y1: 7 }, 'STAGING CACHE'),
        },
        links: {
          ws: h('work', 'stage', ['work', 'stage'], { label: 'git add' }),
        },
        flows: [{ route: ['ws'], kind: 'stage', rate: 1.5 }],
      },
    },
    {
      short: 'Git Commit',
      chapter: 'technique',
      title: 'git commit: Sealing the Snapshot in Local Repository',
      body: [
        'Running <code>git commit -m "feat: user auth"</code> crystallizes the staged index into an immutable Commit object.',
        'Git writes a Tree object representing the directory structure, creates a Commit object containing author, timestamp, parent commit hash, and message, and advances the local branch pointer (e.g., <code>refs/heads/main</code>).',
      ],
      callout: {
        kind: 'insight',
        text: 'A commit is an immutable cryptographic graph node. Committing is 100% local — zero network requests are needed.',
      },
      changes: ['+ Tree object written to .git/objects', '+ Commit object linked to parent SHA', '+ Branch ref refs/heads/main updated'],
      metrics: { workingTree: 'Clean', stagingIndex: 'Clean', localCommits: '1 commit (c4f1a2)', remoteSynced: 'Behind (1 unpushed)' },
      scene: {
        entities: {
          work: d(-14, 0, { color: 'slab', glyph: 'terminal', label: ['Working Tree'], sub: 'clean' }),
          stage: d(-4, 0, { color: 'slab', glyph: 'boxes', label: ['Staging Area'], sub: 'clean' }),
          repo: b(8, 0, { color: 'green', glyph: 'gitBranch', label: 'Local Repo', sub: 'HEAD -> main (c4f1a2)' }),
          zRepo: x({ x0: 4, x1: 12, y0: -7, y1: 7 }, '.GIT OBJECT STORE'),
        },
        links: {
          sr: h('stage', 'repo', ['stage', 'repo'], { label: 'git commit' }),
        },
        flows: [{ route: ['sr'], kind: 'commit', rate: 1.5 }],
      },
    },
    {
      short: 'Git Push',
      chapter: 'solution',
      title: 'git push: Synchronizing with Remote Repository',
      body: [
        'Finally, <code>git push origin main</code> opens an SSH or HTTPS connection to the remote hosting service (GitHub / GitLab).',
        'Git negotiates missing objects via the Smart Transfer Protocol, streams the packfile containing all new blobs, trees, and commit objects, and fast-forwards <code>refs/remotes/origin/main</code> to match your local branch.',
      ],
      callout: {
        kind: 'tip',
        text: 'Until you push, your commit history exists only on your workstation. Pushing distributes the immutable graph to the team.',
      },
      changes: ['+ Packfile transferred over SSH/HTTPS', '+ Remote refs/heads/main updated on GitHub', '+ Local tracking ref origin/main synced'],
      metrics: { workingTree: 'Clean', stagingIndex: 'Clean', localCommits: '1 commit', remoteSynced: 'Synced (origin/main == main)' },
      scene: {
        entities: {
          work: d(-16, 0, { color: 'slab', glyph: 'terminal', label: ['Working Tree'], sub: 'clean' }),
          stage: d(-8, 0, { color: 'slab', glyph: 'boxes', label: ['Staging Area'], sub: 'clean' }),
          repo: b(0, 0, { color: 'green', glyph: 'gitBranch', label: 'Local Repo', sub: 'main' }),
          remote: b(12, 0, { color: 'purple', glyph: 'cloud', label: 'Remote Repo', sub: 'github.com/org/repo' }),
          zRemote: x({ x0: 8, x1: 16, y0: -7, y1: 7 }, 'REMOTE HOST (GITHUB)'),
        },
        links: {
          rr: h('repo', 'remote', ['repo', 'remote'], { label: 'git push origin main' }),
        },
        flows: [{ route: ['rr'], kind: 'commit', rate: 2.0 }],
      },
    },
  ],
};
