// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeDb as b,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitRerereEngineLesson = {
  id: 'git-rerere-engine',
  title: 'Case 4: git rerere in Long-Running Rebase Hell',
  summary: 'Eliminate repetitive conflict resolution: how git rerere (Reuse Recorded Resolution) caches pre-image fingerprints and auto-resolves conflicts across rebases.',
  minutes: 14,
  level: 'advanced',
  metrics: ['rerereStatus', 'conflictFingerprint', 'autoResolutions', 'rrCacheSize'],
  legend: ['record', ['replay', 'auto resolution'], ['cache', '.git/rr-cache']],
  goals: [
    { text: 'The pain of solving identical conflicts 20 times during git rebase', step: 1 },
    { text: 'How rerere hashes pre-image conflict hunks into .git/rr-cache', step: 2 },
    { text: 'Automatic conflict resolution replay when the conflict recurs', step: 3 },
  ],
  steps: [
    {
      short: 'Rebase Hell',
      chapter: 'problem',
      title: 'The Rebase Conflict Loop',
      body: [
        'A long-lived feature branch with 15 commits is being rebased onto an updated <code>main</code>.',
        'Because the conflict occurred early in the branch, Git stops at commit 3, commit 5, commit 7... forcing you to resolve the EXACT SAME conflict over and over again for each commit in the sequence.',
      ],
      callout: {
        kind: 'warn',
        text: 'Rebasing multi-commit branches frequently frustrates engineers into abandoning rebase in favor of messy merge commits.',
      },
      metrics: { rerereStatus: 'Disabled', conflictFingerprint: 'Unrecorded', autoResolutions: '0', rrCacheSize: 'Empty' },
      scene: {
        entities: {
          rebase: d(-8, 0, { color: 'rose', glyph: 'alert', label: ['git rebase main'], sub: 'Stopped at commit 3/15' }),
          conflict: d(4, 0, { color: 'amber', glyph: 'terminal', label: ['Same Conflict Again!'], sub: 'Manual resolution required' }),
        },
        links: {
          rc: h('rebase', 'conflict', ['rebase', 'conflict'], { label: 'stops repeatedly' }),
        },
        flows: [{ route: ['rc'], rate: 1.2 }],
      },
    },
    {
      short: 'Recording',
      chapter: 'technique',
      title: 'git rerere: Recording the Conflict & Resolution',
      body: [
        'Run <code>git config --global rerere.enabled true</code>.',
        'When a conflict occurs, Git fingerprints the conflict hunk (the <b>pre-image</b>) and creates a directory in <code>.git/rr-cache/<hash>/</code>. Once you resolve the conflict and stage it, Git records your resolution (the <b>post-image</b>).',
      ],
      callout: {
        kind: 'tip',
        text: 'rerere stands for "Reuse Recorded Resolution". It saves resolutions locally so you never solve the same problem twice.',
      },
      changes: ['+ Pre-image hash saved to .git/rr-cache', '+ Post-image solution recorded on git add'],
      metrics: { rerereStatus: 'Active', conflictFingerprint: 'Hash 7a8b9c', autoResolutions: '0 (learning)', rrCacheSize: '1 recorded' },
      scene: {
        entities: {
          pre: d(-8, 0, { color: 'amber', glyph: 'terminal', label: ['Pre-Image Hunk'], sub: 'conflict fingerprint' }),
          cache: d(0, 0, { s: 4.6, h: 48, color: 'purple', glyph: 'package', label: ['.git/rr-cache'], sub: 'hash: 7a8b9c' }),
          post: d(8, 0, { color: 'green', glyph: 'boxes', label: ['Post-Image Solution'], sub: 'recorded resolution' }),
        },
        links: {
          pc: h('pre', 'cache', ['pre', 'cache'], { label: 'fingerprint' }),
          cp: h('cache', 'post', ['cache', 'post'], { label: 'store solution' }),
        },
        flows: [{ route: ['pc', 'cp'], kind: 'record', rate: 1.5 }],
      },
    },
    {
      short: 'Auto-Replay',
      chapter: 'solution',
      title: 'Zero-Effort Automatic Resolution Replay',
      body: [
        'Now when commit 5, commit 7, or a rebase next week encounters the same conflict, Git detects the pre-image match in <code>.git/rr-cache</code> and outputs: <em>Resolved "src/config.ts" using previous resolution.</em>',
        'The conflict is resolved automatically in milliseconds without any human intervention!',
      ],
      callout: {
        kind: 'insight',
        text: 'rerere turns long-running branch maintenance and complex rebases into effortless automated operations.',
      },
      changes: ['+ Instant auto-resolution across all 15 commits', '+ Zero manual intervention required', '+ Rebase finishes in seconds'],
      metrics: { rerereStatus: 'Active', conflictFingerprint: 'Matched', autoResolutions: '14 auto-applied', rrCacheSize: 'Reusable' },
      scene: {
        entities: {
          rebase: d(-8, 0, { color: 'green', glyph: 'terminal', label: ['git rebase main'], sub: 'smooth automated progress' }),
          cache: d(0, 0, { s: 4.6, h: 48, color: 'purple', glyph: 'package', label: ['.git/rr-cache'], sub: 'matches 7a8b9c' }),
          autoFile: d(8, 0, { color: 'green', glyph: 'boxes', label: ['Clean Working Tree'], sub: 'conflict auto-resolved!' }),
        },
        links: {
          rc: h('rebase', 'cache', ['rebase', 'cache'], { label: 'detect conflict' }),
          ca: h('cache', 'autoFile', ['cache', 'autoFile'], { label: 'apply post-image' }),
        },
        flows: [{ route: ['rc', 'ca'], kind: 'replay', rate: 2.0 }],
      },
    },
  ],
};
