// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makePanel as S,
  makeDevice as y,
  makeDb as b,
} from '@/lib/simulator/scene-builders';

export const gitBisectAutomationLesson = {
  id: 'git-bisect-automation',
  title: 'Git Bisect: Automated Binary Search Regression Hunting',
  summary: 'Isolate bug-introducing commits in seconds across thousands of revisions using git bisect binary search and headless automated test scripts.',
  minutes: 25,
  level: 'advanced',
  metrics: ['searchSpace', 'stepsRemaining', 'commitTested', 'culpritFound'],
  legend: ['flow', ['good', 'passing commit'], ['bad', 'regressed commit'], ['eval', 'automated test run']],
  goals: [
    { text: 'The mystery regression across 1,024 commits: O(N) vs O(log N)', step: 1 },
    { text: 'Binary halving mathematics in Git commit DAGs', step: 2 },
    { text: 'Initializing bisect: Marking good and bad boundary commits', step: 3 },
    { text: 'Automating with git bisect run <script> for zero-touch diagnosis', step: 4 },
    { text: 'Pinpointing the exact offending commit hash and diff', step: 5 },
    { text: 'Resetting the bisect session and deploying a surgical git revert', step: 6 },
  ],
  steps: [
    {
      short: 'Mystery Bug',
      chapter: 'problem',
      title: 'A Bug Lurking Across 1,000 Commits',
      body: [
        'A performance regression or silent data corruption is discovered on <code>HEAD</code>. You know the code worked perfectly 6 months ago at tag <code>v1.0.0</code>.',
        'There are 1,024 commits between <code>v1.0.0</code> and <code>HEAD</code>. Testing each commit manually would take days of developer time.',
      ],
      callout: {
        kind: 'warning',
        text: 'Linear search requires O(N) operations (~1,024 tests). Binary search requires O(log2 N) = only 10 tests!',
      },
      metrics: { searchSpace: '1,024 commits', stepsRemaining: '10 steps', commitTested: 'None', culpritFound: 'Unknown' },
      scene: {
        entities: {
          goodTag: d(-18, -6, { s: 4.4, h: 54, color: 'green', glyph: 'gitBranch', label: ['tag: v1.0.0'], sub: 'known GOOD' }),
          commitRange: d(-6, -2, { s: 4.4, h: 56, color: 'slab', glyph: 'boxes', label: ['1,024 Commits'], sub: 'search space' }),
          badHead: d(6, 0, { s: 4.4, h: 54, color: 'rose', glyph: 'gitBranch', label: ['HEAD (Broken)'], sub: 'known BAD' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Regression Scale Analysis', [
            `Range: v1.0.0..HEAD`,
            `Total commits in range: 1024`,
            `Linear test time (3m / build): 51.2 HOURS`,
            `Bisect binary search (log2 1024): 10 STEPS (~30 MIN)`,
            `! Manual searching is completely intractable`,
          ], { icon: 'terminal' }),
        },
        links: {
          gc: h('goodTag', 'commitRange', ['goodTag', 'commitRange'], { label: 'known good' }),
          cb: h('commitRange', 'badHead', ['commitRange', 'badHead'], { label: 'bug detected' }),
        },
        flows: [{ route: ['gc', 'cb'], kind: 'eval', rate: 1.5 }],
      },
    },
    {
      short: 'Binary Halving',
      chapter: 'setup',
      title: 'Binary Search Mechanics in Directed Acyclic Graphs',
      body: [
        'Git bisect chooses the commit exactly at the topological midpoint (commit 512).',
        'If commit 512 is <b>good</b>, the bug was introduced in commits 513–1024 (discard 1–512). If commit 512 is <b>bad</b>, the bug was introduced in commits 1–512 (discard 513–1024). Half the commits disappear in one test.',
      ],
      callout: {
        kind: 'insight',
        text: 'Even across merge commits and branching topologies, Git computes the true topological midpoint of the DAG.',
      },
      changes: ['+ Search space reduced from 1,024 to 512 commits', '+ Commit 512 selected as first test probe'],
      metrics: { searchSpace: '512 commits', stepsRemaining: '9 steps', commitTested: 'Commit 512', culpritFound: 'Narrowing' },
      scene: {
        entities: {
          goodTag: d(-18, -6, { s: 4.4, h: 54, color: 'green', glyph: 'gitBranch', label: ['tag: v1.0.0'], sub: 'known GOOD' }),
          commitRange: d(-6, -2, { s: 4.4, h: 56, color: 'slab', glyph: 'boxes', label: ['1..512 Pass'], sub: 'discarded pass' }),
          badHead: d(6, 0, { s: 4.4, h: 54, color: 'rose', glyph: 'gitBranch', label: ['HEAD (Broken)'], sub: 'known BAD' }),
          midpoint: d(-4, 16, { s: 4.4, h: 56, color: 'blue', glyph: 'cpu', label: ['Commit 512'], sub: 'midpoint test' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Binary Halving Math', [
            `Bisecting: 512 revisions left to test after this`,
            `[512] feat: update cache serializer`,
            `# Commits 1..512 tested and verified PASS`,
            `# Remaining search space: Commits 513..1024`,
            `= 50% of history pruned in 1 step!`,
          ], { icon: 'terminal' }),
        },
        links: {
          gc: h('goodTag', 'commitRange', ['goodTag', 'commitRange'], { label: 'known good' }),
          cm: h('commitRange', 'midpoint', ['commitRange', 'midpoint'], { label: 'test midpoint' }),
          mb: h('midpoint', 'badHead', ['midpoint', 'badHead'], { label: 'target' }),
        },
        flows: [{ route: ['cm', 'mb'], kind: 'eval', rate: 1.5 }],
      },
    },
    {
      short: 'Bisect Start',
      chapter: 'setup',
      title: 'Initializing Bisect Session (good & bad)',
      body: [
        'To begin bisecting: run <code>git bisect start</code>.',
        'Mark the broken state: <code>git bisect bad</code> (defaults to current HEAD). Mark the last known working state: <code>git bisect good v1.0.0</code>. Git automatically checks out the midpoint.',
      ],
      callout: {
        kind: 'tip',
        text: 'Git records active bisect state in .git/BISECT_START, .git/BISECT_GOOD, and .git/BISECT_BAD.',
      },
      changes: ['+ Bisect session started', '+ Midpoint checked out for testing'],
      metrics: { searchSpace: '256 commits', stepsRemaining: '8 steps', commitTested: 'Commit 768', culpritFound: 'Narrowing' },
      scene: {
        entities: {
          goodTag: d(-18, -6, { s: 4.4, h: 54, color: 'green', glyph: 'gitBranch', label: ['tag: v1.0.0'], sub: 'bisect good' }),
          commitRange: d(-6, -2, { s: 4.4, h: 56, color: 'slab', glyph: 'boxes', label: ['Bisect State'], sub: '.git/BISECT_*' }),
          badHead: d(6, 0, { s: 4.4, h: 54, color: 'rose', glyph: 'gitBranch', label: ['HEAD (Broken)'], sub: 'bisect bad' }),
          midpoint: d(-4, 16, { s: 4.4, h: 56, color: 'cyan', glyph: 'cpu', label: ['Commit 768'], sub: 'active probe' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Bisect Initialization CLI', [
            `$ git bisect start`,
            `$ git bisect bad HEAD`,
            `$ git bisect good v1.0.0`,
            `Bisecting: 256 revisions left to test after this (roughly 8 steps)`,
            `[768a1b] fix: pool allocator size`,
            `= Git checked out commit 768 automatically`,
          ], { icon: 'terminal' }),
        },
        links: {
          gc: h('goodTag', 'commitRange', ['goodTag', 'commitRange'], { label: 'good marker' }),
          bc: h('badHead', 'commitRange', ['badHead', 'commitRange'], { label: 'bad marker' }),
          cm: h('commitRange', 'midpoint', ['commitRange', 'midpoint'], { label: 'checkout probe' }),
        },
        flows: [{ route: ['cm'], kind: 'eval', rate: 1.6 }],
      },
    },
    {
      short: 'Bisect Run',
      chapter: 'execution',
      title: 'Automating with git bisect run <script>',
      body: [
        'Testing 10 commits manually is tedious. <b>git bisect run</b> completely automates the search without human intervention!',
        'Write a tiny test script <code>test.sh</code> (or <code>npm test</code>). If tests pass, exit with <code>0</code>. If tests fail, exit with non-zero (<code>1</code>). Run: <code>git bisect run ./test.sh</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'If a commit cannot be tested (e.g. build failure unrelated to the bug), exit with code 125. Git bisect skip will pick an adjacent commit.',
      },
      changes: ['+ git bisect run ./test.sh executed', '+ Automated loop tested 10 commits in 90 seconds'],
      metrics: { searchSpace: '1 commit left', stepsRemaining: '0 steps', commitTested: 'All 10 tested', culpritFound: 'Identified' },
      scene: {
        entities: {
          goodTag: d(-18, -6, { s: 4.4, h: 54, color: 'green', glyph: 'gitBranch', label: ['tag: v1.0.0'], sub: 'bisect good' }),
          commitRange: d(-6, -2, { s: 4.4, h: 56, color: 'slab', glyph: 'boxes', label: ['Automated Loop'], sub: 'run ./test.sh' }),
          badHead: d(6, 0, { s: 4.4, h: 54, color: 'rose', glyph: 'gitBranch', label: ['HEAD (Broken)'], sub: 'bisect bad' }),
          midpoint: d(-4, 16, { s: 4.4, h: 56, color: 'green', glyph: 'cpu', label: ['Runner Script'], sub: 'exit 0 / 1' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Headless Bisect Run Output', [
            `$ git bisect run npm test -- --grep "tax calculation"`,
            `running 'npm test ...'`,
            `Bisecting: 128 revisions left...`,
            `Bisecting: 64 revisions left...`,
            `Bisecting: 4 revisions left...`,
            `Bisecting: 0 revisions left (1 commit to test)`,
            `= All intermediate commits tested unattended in 85 seconds!`,
          ], { icon: 'terminal' }),
        },
        links: {
          cm: h('commitRange', 'midpoint', ['commitRange', 'midpoint'], { label: 'automated loop' }),
        },
        flows: [{ route: ['cm'], kind: 'eval', rate: 1.8 }],
      },
    },
    {
      short: 'Culprit Isolated',
      chapter: 'execution',
      title: 'Pinpointing the Culprit Commit & Diff',
      body: [
        'Git bisect prints the exact first commit that introduced the bug: commit SHA, author, timestamp, and diff.',
        'The bug was introduced in commit <code>d4e5f6a</code>: an unhandled null check in the tax calculation service.',
      ],
      callout: {
        kind: 'insight',
        text: 'What would have taken 51 hours of manual debugging took exactly 85 seconds with git bisect run.',
      },
      changes: ['+ Offending commit d4e5f6a pinpointed with 100% mathematical certainty'],
      metrics: { searchSpace: '1 commit', stepsRemaining: 'Complete', commitTested: 'd4e5f6a', culpritFound: 'Commit d4e5f6a' },
      scene: {
        entities: {
          goodTag: d(-18, -6, { s: 4.4, h: 54, color: 'green', glyph: 'gitBranch', label: ['tag: v1.0.0'], sub: 'known good' }),
          culpritCommit: d(-6, -2, { s: 4.4, h: 56, color: 'rose', glyph: 'alert', label: ['Culprit Commit'], sub: 'first bad SHA' }),
          badHead: d(6, 0, { s: 4.4, h: 54, color: 'rose', glyph: 'gitBranch', label: ['HEAD (Broken)'], sub: 'known bad' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Offending Commit Report', [
            `d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3 is the first bad commit`,
            `commit d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3`,
            `Author: Alex <alex@company.com>`,
            `Date:   Mon May 12 14:22:10 2026`,
            `    feat: optimize tax calculation memory buffer`,
            `:100644 100644 e1f2... d3e4... M src/tax.ts`,
          ], { icon: 'terminal' }),
        },
        links: {
          gc: h('goodTag', 'culpritCommit', ['goodTag', 'culpritCommit'], { label: 'ancestor' }),
          cb: h('culpritCommit', 'badHead', ['culpritCommit', 'badHead'], { label: 'poisoned HEAD' }),
        },
        flows: [{ route: ['gc', 'cb'], kind: 'bad', rate: 1.5 }],
      },
    },
    {
      short: 'Reset & Revert',
      chapter: 'scaling',
      title: 'Resetting Bisect & Deploying Surgical Revert',
      body: [
        'End the bisect session with <code>git bisect reset</code>. Git cleans up temporary files and returns you to original HEAD.',
        'Deploy a surgical inverse patch: <code>git revert d4e5f6a</code>. The regression is cured without rewriting Git history.',
      ],
      callout: {
        kind: 'tip',
        text: 'git revert creates a brand new commit that undoes the changes of the culprit commit. Safe for shared branches!',
      },
      changes: ['+ git bisect reset cleaned up session', '+ git revert deployed surgical inverse commit'],
      metrics: { searchSpace: '0', stepsRemaining: 'Done', commitTested: 'Reverted', culpritFound: 'Resolved' },
      scene: {
        entities: {
          goodTag: d(-18, -6, { s: 4.4, h: 54, color: 'green', glyph: 'gitBranch', label: ['tag: v1.0.0'], sub: 'known good' }),
          culpritCommit: d(-6, -2, { s: 4.4, h: 56, color: 'rose', glyph: 'alert', label: ['Culprit Commit'], sub: 'isolated bug' }),
          badHead: d(6, 0, { s: 4.4, h: 54, color: 'slab', glyph: 'gitBranch', label: ['HEAD (Broken)'], sub: 'prior state' }),
          revertCommit: d(18, 4, { s: 4.4, h: 56, color: 'green', glyph: 'package', label: ['git revert'], sub: 'surgical fix' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Revert & Clean Closure', [
            `$ git bisect reset`,
            `Checking out: 'main'`,
            `$ git revert d4e5f6a`,
            `[main a9b8c7d] Revert "feat: optimize tax calculation memory buffer"`,
            ` 1 file changed, 2 insertions(+), 8 deletions(-)`,
            `$ npm test  # PASS!`,
            `= Regression resolved with zero downtime!`,
          ], { icon: 'terminal' }),
        },
        links: {
          cb: h('culpritCommit', 'badHead', ['culpritCommit', 'badHead'], { label: 'isolated bug' }),
          br: h('badHead', 'revertCommit', ['badHead', 'revertCommit'], { label: 'heals trunk' }),
        },
        flows: [{ route: ['cb', 'br'], kind: 'good', rate: 1.6 }],
      },
    },
  ],
};
