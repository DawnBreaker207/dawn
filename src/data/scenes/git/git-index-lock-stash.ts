// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitIndexLockStashLesson = {
  id: 'git-index-lock-stash',
  title: 'Case 7: Ghost index.lock & Aborted Stash Pop',
  summary: 'Resolving fatal concurrency collisions: index.lock file exists when background tasks crash, and recovering unmerged files when git stash pop encounters conflicts.',
  minutes: 13,
  level: 'intermediate',
  metrics: ['indexLockFile', 'stashConflict', 'stashState', 'unmergedFiles'],
  legend: ['lock', ['crash', 'interrupted operation'], ['resolve', 'clean state']],
  goals: [
    { text: 'Why .git/index.lock exists and how crashed processes orphan it', step: 1 },
    { text: 'Distinguishing a real active Git process from a dead zombie lock', step: 2 },
    { text: 'Resolving the stash pop dilemma: why git stash pop retains stash on conflict', step: 3 },
  ],
  steps: [
    {
      short: 'Ghost index.lock',
      chapter: 'problem',
      title: 'fatal: Unable to create \'.git/index.lock\': File exists',
      body: [
        'An IDE indexing plugin or background AI agent process crashes midway through a commit or rebase, leaving behind <code>.git/index.lock</code>.',
        'Now every subsequent Git command immediately aborts: <em>fatal: Unable to create \'.git/index.lock\': File exists. Another git process seems to be running.</em>',
      ],
      callout: {
        kind: 'warn',
        text: 'Never delete index.lock blindly while another Git process is actually writing, or you risk repository index corruption.',
      },
      metrics: { indexLockFile: 'Locked (.git/index.lock)', stashConflict: 'None', stashState: 'Clean', unmergedFiles: '0' },
      scene: {
        entities: {
          crashProc: d(-8, 0, { color: 'rose', glyph: 'alert', label: ['Crashed Agent / IDE'], sub: 'died without cleanup' }),
          lockFile: d(4, 0, { color: 'rose', glyph: 'terminal', label: ['.git/index.lock'], sub: 'BLOCKS ALL COMMANDS' }),
        },
        links: {
          cl: h('crashProc', 'lockFile', ['crashProc', 'lockFile'], { label: 'orphaned lock' }),
        },
        flows: [{ route: ['cl'], kind: 'crash', rate: 1.0 }],
      },
    },
    {
      short: 'Releasing Lock',
      chapter: 'solution',
      title: 'Verifying Dead Process & Removing Ghost Lock',
      body: [
        'Verify no active git processes exist (e.g. <code>Get-Process git</code> or <code>ps aux | grep git</code>).',
        'Once confirmed dead, safely delete the lock file: <code>rm .git/index.lock</code>. The index is immediately unlocked and ready for normal development.',
      ],
      callout: {
        kind: 'tip',
        text: 'The lock file is zero bytes. Git creates it via atomic OS file creation to prevent concurrent index writes.',
      },
      changes: ['+ Process confirmed dead', '+ .git/index.lock safely removed', '+ Git commands restored'],
      metrics: { indexLockFile: 'Unlocked (Removed)', stashConflict: 'None', stashState: 'Ready', unmergedFiles: '0' },
      scene: {
        entities: {
          cmd: d(-6, 0, { color: 'blue', glyph: 'terminal', label: ['rm .git/index.lock'], sub: 'unlock command' }),
          index: d(6, 0, { color: 'green', glyph: 'boxes', label: ['.git/index'], sub: 'restored & operational' }),
        },
        links: {
          ci: h('cmd', 'index', ['cmd', 'index'], { label: 'unlocked' }),
        },
        flows: [{ route: ['ci'], kind: 'resolve', rate: 1.8 }],
      },
    },
    {
      short: 'Stash Pop Conflict',
      chapter: 'technique',
      title: 'Case: The Half-Popped Stash Conflict',
      body: [
        'When you run <code>git stash pop</code> and encounter a conflict, Git intentionally DOES NOT drop the stash entry from <code>stash@{0}</code> to protect your data.',
        'Developers often panic because both unmerged conflict markers exist on disk AND the stash is still in the stash list. Solution: Resolve conflict $\rightarrow$ <code>git add .</code> $\rightarrow$ manually run <code>git stash drop</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'Git protects your shelved changes: a stash is dropped ONLY if git stash pop applies with zero conflicts.',
      },
      changes: ['+ Stash kept safely in stash stack', '+ Conflicts resolved with standard git add', '+ Manually dropped via git stash drop'],
      metrics: { indexLockFile: 'Unlocked', stashConflict: 'Resolved', stashState: 'Dropped safely', unmergedFiles: '0' },
      scene: {
        entities: {
          stash: d(-8, 0, { color: 'purple', glyph: 'package', label: ['refs/stash (Retained)'], sub: 'guarded on conflict' }),
          work: d(0, 0, { color: 'amber', glyph: 'terminal', label: ['Resolved Conflicts'], sub: 'git add <file>' }),
          drop: d(8, 0, { color: 'green', glyph: 'boxes', label: ['git stash drop'], sub: 'safely cleared from stack' }),
        },
        links: {
          sw: h('stash', 'work', ['stash', 'work'], { label: 'resolve conflict' }),
          wd: h('work', 'drop', ['work', 'drop'], { label: 'drop once clean' }),
        },
        flows: [{ route: ['sw', 'wd'], rate: 1.5 }],
      },
    },
  ],
};
