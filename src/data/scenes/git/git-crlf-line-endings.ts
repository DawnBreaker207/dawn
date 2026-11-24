// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitCrlfLineEndingsLesson = {
  id: 'git-crlf-line-endings',
  title: 'Case 6: CRLF vs LF Normalization Disaster',
  summary: 'When a Windows developer or AI agent marks 10,000 files modified due to carriage return (\\r\\n) drift, and resolving it permanently via .gitattributes and git add --renormalize .',
  minutes: 13,
  level: 'intermediate',
  metrics: ['crlfFiles', 'gitAttributes', 'blameIntegrity', 'repoCleanliness'],
  legend: ['flow', ['corrupt', 'CRLF drift (10,000 files)'], ['clean', 'LF normalized']],
  goals: [
    { text: 'Why Windows CRLF (\\r\\n) and Linux LF (\\n) trigger false diffs', step: 1 },
    { text: 'The fatal failure of core.autocrlf true/false across OS boundaries', step: 2 },
    { text: 'Enforcing repository-level truth with .gitattributes', step: 3 },
    { text: 'Cleaning the entire working tree with git add --renormalize .', step: 4 },
  ],
  steps: [
    {
      short: 'The 10k Diff',
      chapter: 'problem',
      title: 'The 10,000 Files Modified Disaster',
      body: [
        'An AI agent on Windows clones a Linux-authored repository. The IDE or Git auto-converts line endings to <code>\\r\\n</code> (Carriage Return + Line Feed).',
        'Running <code>git status</code> suddenly reports every single file in the repository as modified! Staging and committing this would destroy <code>git blame</code> history for the entire company.',
      ],
      callout: {
        kind: 'warn',
        text: 'A line-ending commit changes the byte hash of every line, making git blame attribute every line of code to you.',
      },
      metrics: { crlfFiles: '10,482 modified', gitAttributes: 'Missing', blameIntegrity: 'Destroyed', repoCleanliness: 'Contaminated' },
      scene: {
        entities: {
          win: d(-8, 0, { color: 'rose', glyph: 'alert', label: ['Windows Editor'], sub: 'inserted \\r\\n (CRLF)' }),
          status: d(4, 0, { color: 'rose', glyph: 'terminal', label: ['git status'], sub: '10,482 files false dirty!' }),
          zDirty: x({ x0: -10, x1: 8, y0: -5, y1: 5 }, 'LINE ENDING DISASTER ZONE'),
        },
        links: {
          ws: h('win', 'status', ['win', 'status'], { label: 'byte mismatch' }),
        },
        flows: [{ route: ['ws'], kind: 'corrupt', rate: 1.5 }],
      },
    },
    {
      short: '.gitattributes',
      chapter: 'solution',
      title: 'Enforcing .gitattributes & Renormalizing',
      body: [
        'Do not rely on machine-specific <code>core.autocrlf</code>. Commit a <code>.gitattributes</code> file to the repo root with: <code>* text=auto eol=lf</code>.',
        'Then execute the surgical normalization: <code>git add --renormalize .</code> followed by <code>git commit -m "chore: renormalize line endings to LF"</code>. Git recalculates the index blobs using pure LF, clearing all 10,000 false diffs instantaneously!',
      ],
      callout: {
        kind: 'tip',
        text: 'Add the commit hash to .git-blame-ignore-revs so Git Blame automatically ignores the normalization commit!',
      },
      changes: ['+ .gitattributes text=auto eol=lf added', '+ git add --renormalize . ran across all files', '+ 10,482 false modifications cleared'],
      metrics: { crlfFiles: '0 (Clean)', gitAttributes: 'Enforced (* text=auto eol=lf)', blameIntegrity: 'Preserved via ignore-revs', repoCleanliness: 'Pristine' },
      scene: {
        entities: {
          attr: d(-8, 0, { color: 'green', glyph: 'package', label: ['.gitattributes'], sub: '* text=auto eol=lf' }),
          norm: d(0, 0, { color: 'blue', glyph: 'terminal', label: ['--renormalize .'], sub: 'converts CRLF -> LF in index' }),
          clean: d(8, 0, { color: 'green', glyph: 'boxes', label: ['Clean Repository'], sub: 'working tree clean' }),
        },
        links: {
          an: h('attr', 'norm', ['attr', 'norm'], { label: 'config' }),
          nc: h('norm', 'clean', ['norm', 'clean'], { label: 'strip \\r' }),
        },
        flows: [{ route: ['an', 'nc'], kind: 'clean', rate: 1.8 }],
      },
    },
  ],
};
