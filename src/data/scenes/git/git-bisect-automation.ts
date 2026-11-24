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
          goodTag: d(-7, -7, { s: 5.0, h: 54, color: 'green', glyph: 'gitBranch', label: ['tag: v1.0.0'], sub: 'known GOOD' }),
          commitRange: d(0, 0, { s: 5.2, h: 56, color: 'slab', glyph: 'boxes', label: ['1,024 Commits'], sub: 'untested space' }),
          badHead: d(7, 7, { s: 5.0, h: 54, color: 'rose', glyph: 'gitBranch', label: ['HEAD (Broken)'], sub: 'known BAD' }),
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
      changes: ['+ Search space reduced from 1,024 to 512 commits'],
      metrics: { searchSpace: '512 commits', stepsRemaining: '9 steps', commitTested: 'Commit 512', culpritFound: 'Narrowing' },
      scene: {
        entities: {
          discardedHalf: d(-7, -7, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['Commits 1..512'], sub: 'DISCARDED pass' }),
          midpoint: d(0, 0, { s: 5.2, h: 56, color: 'blue', glyph: 'cpu', label: ['Commit 512'], sub: 'tested PASS' }),
          remainingHalf: d(7, 7, { s: 5.0, h: 54, color: 'amber', glyph: 'boxes', label: ['Commits 513..1024'], sub: 'active search' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Binary Halving Math', [
            `Step 1: 1024 commits -> test commit 512`,
            `Result: PASS (good)`,
            `Deduction: Bug was NOT present in first 512 commits`,
            `New range: 512 commits left (~9 steps remaining)`,
            `= Search space cut by 50% in 1 evaluation`,
          ], { icon: 'terminal' }),
        },
        links: {
          dm: h('discardedHalf', 'midpoint', ['discardedHalf', 'midpoint'], { label: 'proven good' }),
          mr: h('midpoint', 'remainingHalf', ['midpoint', 'remainingHalf'], { label: 'isolate bad' }),
        },
        flows: [{ route: ['dm', 'mr'], kind: 'good', rate: 1.5 }],
      },
    },
    {
      short: 'Bisect Bounds',
      chapter: 'setup',
      title: 'Initializing Bisect: Defining Good & Bad Bounds',
      body: [
        'To begin, tell Git the known endpoints:',
        '1. <code>git bisect start</code>',
        '2. <code>git bisect bad HEAD</code> (we know HEAD is broken)',
        '3. <code>git bisect good v1.0.0</code> (we know v1.0.0 worked). Git immediately checks out the midpoint commit.',
      ],
      callout: {
        kind: 'tip',
        text: 'You can test manually by running your test and typing git bisect good or git bisect bad at each step.',
      },
      changes: ['+ Bisect session initialized', '+ HEAD detached to first midpoint commit'],
      metrics: { searchSpace: '256 commits', stepsRemaining: '8 steps', commitTested: 'Commit 768', culpritFound: 'In progress' },
      scene: {
        entities: {
          startCmd: y(-7, -7, { label: 'Bisect Init', tags: [{ text: 'bisect start', tone: 'green', icon: 'terminal' }] }),
          bisectOrchestrator: d(0, 0, { s: 5.2, h: 56, color: 'cyan', glyph: 'cpu', label: ['Bisect Engine'], sub: 'picks midpoint' }),
          detachedMid: d(7, 7, { s: 5.0, h: 54, color: 'purple', glyph: 'gitBranch', label: ['Commit 768'], sub: 'detached test' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Bisect Initialization CLI', [
            `$ git bisect start`,
            `$ git bisect bad HEAD`,
            `$ git bisect good v1.0.0`,
            `Bisecting: 511 revisions left to test after this`,
            `[c4f1a2b...] perf: optimize buffer allocator`,
            `= Git automatically checks out the exact midpoint commit`,
          ], { icon: 'terminal' }),
        },
        links: {
          sb: h('startCmd', 'bisectOrchestrator', ['startCmd', 'bisectOrchestrator'], { label: 'set bounds' }),
          bd: h('bisectOrchestrator', 'detachedMid', ['bisectOrchestrator', 'detachedMid'], { label: 'auto checkout' }),
        },
        flows: [{ route: ['sb', 'bd'], kind: 'eval', rate: 1.5 }],
      },
    },
    {
      short: 'Automate Script',
      chapter: 'execution',
      title: 'Automating with git bisect run <script>',
      body: [
        'Testing 10 commits manually is good, but <b>automating it completely</b> is extraordinary.',
        'Run <code>git bisect run ./test-regression.sh</code>. Git repeatedly checks out each midpoint, executes your script, checks exit code (<code>0</code> = good, <code>1</code> = bad, <code>125</code> = skip), and loops until finished!',
      ],
      callout: {
        kind: 'insight',
        text: 'Exit code 125 tells Git the commit could not be built or tested (e.g. broken syntax from another PR), asking Git to pick an adjacent commit.',
      },
      changes: ['+ Fully autonomous headless testing loop running', '+ Zero human interaction required'],
      metrics: { searchSpace: '16 commits', stepsRemaining: '4 steps', commitTested: 'Autonomous', culpritFound: 'Closing in' },
      scene: {
        entities: {
          bisectRun: y(-7, -7, { label: 'Test Script', tags: [{ text: 'bisect run test', tone: 'green', icon: 'terminal' }] }),
          scriptRunner: d(0, 0, { s: 5.2, h: 56, color: 'blue', glyph: 'cpu', label: ['Test Evaluator'], sub: 'exit code test' }),
          fastIterations: d(7, 7, { s: 5.0, h: 54, color: 'cyan', glyph: 'package', label: ['10 Test Runs'], sub: '90s automated' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Autonomous Bisect Script', [
            `$ cat test-regression.sh`,
            `npm run build || exit 125  # cannot build, skip`,
            `npm test -- auth.test.ts   # exit 0 = pass, 1 = fail`,
            `$ git bisect run ./test-regression.sh`,
            `running ./test-regression.sh -> 0 (good)`,
            `running ./test-regression.sh -> 1 (bad)...`,
          ], { icon: 'terminal' }),
        },
        links: {
          br: h('bisectRun', 'scriptRunner', ['bisectRun', 'scriptRunner'], { label: 'run script' }),
          sf: h('scriptRunner', 'fastIterations', ['scriptRunner', 'fastIterations'], { label: 'loop midpoints' }),
        },
        flows: [{ route: ['br', 'sf'], kind: 'eval', rate: 1.6 }],
      },
    },
    {
      short: 'Culprit Found',
      chapter: 'technique',
      title: 'Pinpointing the Culprit Commit & Culprit Diff',
      body: [
        'After exactly 10 iterations, Git prints the verdict: <code>a5b8c9 is the first bad commit</code>.',
        'It outputs the commit author, exact commit date, commit message, and the files modified. The needle in the 1,000-commit haystack has been found in seconds.',
      ],
      callout: {
        kind: 'tip',
        text: 'Inspect git show a5b8c9 to see the exact line of code that introduced the bug.',
      },
      changes: ['+ Exact culprit commit identified: a5b8c9', '+ Offending diff isolated'],
      metrics: { searchSpace: '1 commit (Culprit)', stepsRemaining: '0 (Done)', commitTested: 'a5b8c9', culpritFound: 'FOUND' },
      scene: {
        entities: {
          bisectResult: d(-7, -7, { s: 5.0, h: 54, color: 'purple', glyph: 'cpu', label: ['Bisect Result'], sub: '1 candidate' }),
          culpritCommit: d(0, 0, { s: 5.2, h: 56, color: 'rose', glyph: 'alert', label: ['Commit a5b8c9'], sub: 'culprit commit' }),
          culpritDiff: d(7, 7, { s: 5.0, h: 54, color: 'amber', glyph: 'terminal', label: ['Offending Diff'], sub: 'off-by-one bug' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Culprit Identification Output', [
            `a5b8c9f1a2b3c4... is the first bad commit`,
            `commit a5b8c9f1a2b3c4`,
            `Author: Bob <bob@company.com>`,
            `Date:   Wed Jun 12 14:22:01 2024 -0700`,
            `    fix: optimize parser loop`,
            `src/parser.ts | 2 +-`,
            `= 1,000 commits narrowed to 1 commit automatically`,
          ], { icon: 'terminal' }),
        },
        links: {
          bc: h('bisectResult', 'culpritCommit', ['bisectResult', 'culpritCommit'], { label: 'isolated culprit' }),
          cd: h('culpritCommit', 'culpritDiff', ['culpritCommit', 'culpritDiff'], { label: 'inspect diff' }),
        },
        flows: [{ route: ['bc', 'cd'], kind: 'bad', rate: 1.5 }],
      },
    },
    {
      short: 'Reset & Revert',
      chapter: 'scaling',
      title: 'Resetting Bisect & Applying Targeted git revert',
      body: [
        'Always end the session with <code>git bisect reset</code>. This returns your working tree and HEAD back to where you were before bisecting.',
        'Now create a clean fix by reverting the bad commit: <code>git revert a5b8c9</code>. The bug is solved with 100% precision.',
      ],
      callout: {
        kind: 'insight',
        text: 'git revert creates a new commit that inverts the patch, keeping full audit history without rewriting past commits.',
      },
      changes: ['+ git bisect session cleanly reset', '+ git revert a5b8c9 deployed to fix regression'],
      metrics: { searchSpace: 'Fixed', stepsRemaining: 'Complete', commitTested: 'Reverted', culpritFound: 'Resolved' },
      scene: {
        entities: {
          resetCmd: y(-7, -7, { label: 'Bisect Reset', tags: [{ text: 'bisect reset', tone: 'cyan', icon: 'terminal' }] }),
          revertCommit: d(0, 0, { s: 5.2, h: 56, color: 'green', glyph: 'gitBranch', label: ['git revert'], sub: 'inverts patch' }),
          healthyHead: d(7, 7, { s: 5.0, h: 54, color: 'green', glyph: 'package', label: ['Healthy main'], sub: 'bug eradicated' }),
          card: S({ x: -14, y: 0, dx: -20, dy: -180 }, 'Resolution Execution', [
            `$ git bisect reset`,
            `Checking out files: 100%, done.`,
            `Previous HEAD position was a5b8c9...`,
            `Switched to branch 'main'`,
            `$ git revert a5b8c9 -m 1  # if merge`,
            `[main 9d8e7f] Revert "fix: optimize parser loop"`,
            `= Bug permanently eradicated from main`,
          ], { icon: 'terminal' }),
        },
        links: {
          rr: h('resetCmd', 'revertCommit', ['resetCmd', 'revertCommit'], { label: 'restore HEAD' }),
          rh: h('revertCommit', 'healthyHead', ['revertCommit', 'healthyHead'], { label: 'land fix' }),
        },
        flows: [{ route: ['rr', 'rh'], kind: 'good', rate: 1.6 }],
      },
    },
  ],
};
