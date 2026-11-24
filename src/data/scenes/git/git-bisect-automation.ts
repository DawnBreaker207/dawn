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

export const gitBisectAutomationLesson = {
  id: 'git-bisect-automation',
  title: 'Case 8: Automated Regression Hunting with git bisect run',
  summary: 'Binary searching 1,000 commits in O(log N) steps: automating bug regression detection using git bisect start HEAD v1.0.0 and headless test scripts.',
  minutes: 25,
  level: 'advanced',
  metrics: ['searchSpace', 'stepsRemaining', 'commitTested', 'culpritFound'],
  legend: ['bisect', ['bad', 'broken commit'], ['good', 'passing commit'], ['eval', 'test script run']],
  goals: [
    { text: 'The problem: a bug was introduced somewhere across 1,000 commits', step: 1 },
    { text: 'Binary search mechanics: how Git cuts the search range in half each step', step: 2 },
    { text: 'Initializing bisect: git bisect start, marking bad and good bounds', step: 3 },
    { text: 'Automating with git bisect run <script>: zero human intervention', step: 4 },
    { text: 'Isolating the culprit commit with author, timestamp, and diff', step: 5 },
    { text: 'Resetting bisect state and landing a targeted git revert', step: 6 },
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
          goodTag: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['tag: v1.0.0'], sub: 'known GOOD (pass)' }),
          commitRange: d(0, -6, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['1,024 Commits'], sub: 'untested history' }),
          badHead: d(10, 8, { s: 4.8, h: 50, color: 'rose', glyph: 'gitBranch', label: ['HEAD (Broken)'], sub: 'known BAD (fail)' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Regression Scale Analysis', [
            `Range: v1.0.0..HEAD`,
            `Total commits in range: 1024`,
            `Linear test time (3m / build): 51.2 HOURS`,
            `Bisect binary search (log2 1024): 10 STEPS (~30 MIN)`,
            `! Manual searching is completely intractable`,
          ], { icon: 'terminal' }),
          zBisect: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'REGRESSION HUNTING SEARCH SPACE'),
        },
        links: {
          gc: h('goodTag', 'commitRange', ['goodTag', 'commitRange'], { label: 'known working' }),
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
          discardedHalf: d(-10, -18, { s: 4.8, h: 50, color: 'slab', glyph: 'boxes', label: ['Commits 1..512'], sub: 'DISCARDED (all pass)' }),
          midpoint: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['Midpoint Check'], sub: 'Commit 512 tested PASS' }),
          remainingHalf: d(10, 8, { s: 4.8, h: 50, color: 'amber', glyph: 'boxes', label: ['Commits 513..1024'], sub: 'active search range' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Binary Halving Math', [
            `Step 1: 1024 commits -> test commit 512`,
            `Result: PASS (good)`,
            `Deduction: Bug was NOT present in first 512 commits`,
            `New range: 512 commits left (~9 steps remaining)`,
            `= Search space cut by 50% in 1 evaluation`,
          ], { icon: 'terminal' }),
          zBisect: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'DAG TOPOLOGICAL MIDPOINT HALVING'),
        },
        links: {
          dm: h('discardedHalf', 'midpoint', ['discardedHalf', 'midpoint'], { label: 'proven good' }),
          mr: h('midpoint', 'remainingHalf', ['midpoint', 'remainingHalf'], { label: 'isolate bad range' }),
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
          startCmd: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['git bisect start'], sub: 'set boundaries' }),
          bisectOrchestrator: d(0, -6, { s: 4.8, h: 50, color: 'cyan', glyph: 'cpu', label: ['Bisect Engine'], sub: 'calculates midpoint' }),
          detachedMid: d(10, 8, { s: 4.8, h: 50, color: 'purple', glyph: 'boxes', label: ['Checkout SHA'], sub: 'detached for testing' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Bisect Initialization CLI', [
            `$ git bisect start`,
            `$ git bisect bad HEAD`,
            `$ git bisect good v1.0.0`,
            `Bisecting: 511 revisions left to test after this`,
            `[c4f1a2b...] perf: optimize buffer allocator`,
            `= Git automatically checks out the exact midpoint commit`,
          ], { icon: 'terminal' }),
          zBisect: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'BISECT BOUNDARY INITIALIZATION'),
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
          bisectRun: d(-10, -18, { s: 4.8, h: 50, color: 'green', glyph: 'terminal', label: ['git bisect run'], sub: 'headless test loop' }),
          scriptRunner: d(0, -6, { s: 4.8, h: 50, color: 'blue', glyph: 'cpu', label: ['test-script.sh'], sub: 'exit code evaluator' }),
          fastIterations: d(10, 8, { s: 4.8, h: 50, color: 'cyan', glyph: 'package', label: ['10 Test Runs'], sub: 'executes in 90 seconds' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Autonomous Bisect Script', [
            `$ cat test-regression.sh`,
            `npm run build || exit 125  # cannot build, skip`,
            `npm test -- auth.test.ts   # exit 0 = pass, 1 = fail`,
            `$ git bisect run ./test-regression.sh`,
            `running ./test-regression.sh -> 0 (good)`,
            `running ./test-regression.sh -> 1 (bad)...`,
          ], { icon: 'terminal' }),
          zBisect: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'AUTONOMOUS SCRIPT EVALUATION LOOP'),
        },
        links: {
          br: h('bisectRun', 'scriptRunner', ['bisectRun', 'scriptRunner'], { label: 'execute script' }),
          sf: h('scriptRunner', 'fastIterations', ['scriptRunner', 'fastIterations'], { label: 'loop until zero' }),
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
          bisectResult: d(-10, -18, { s: 4.8, h: 50, color: 'purple', glyph: 'cpu', label: ['Bisect Result'], sub: 'zero candidates left' }),
          culpritCommit: d(0, -6, { s: 4.8, h: 50, color: 'rose', glyph: 'boxes', label: ['Commit a5b8c9'], sub: 'FIRST BAD COMMIT' }),
          culpritDiff: d(10, 8, { s: 4.8, h: 50, color: 'amber', glyph: 'terminal', label: ['Offending Diff'], sub: 'off-by-one index error' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Culprit Identification Output', [
            `a5b8c9f1a2b3c4... is the first bad commit`,
            `commit a5b8c9f1a2b3c4`,
            `Author: Bob <bob@company.com>`,
            `Date:   Wed Jun 12 14:22:01 2024 -0700`,
            `    fix: optimize parser loop`,
            `src/parser.ts | 2 +-`,
            `= 1,000 commits narrowed to 1 commit automatically`,
          ], { icon: 'terminal' }),
          zBisect: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'CULPRIT IDENTIFICATION VERDICT'),
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
          resetCmd: d(-10, -18, { s: 4.8, h: 50, color: 'cyan', glyph: 'terminal', label: ['git bisect reset'], sub: 'return to main' }),
          revertCommit: d(0, -6, { s: 4.8, h: 50, color: 'green', glyph: 'gitBranch', label: ['git revert a5b8c9'], sub: 'inverts broken patch' }),
          healthyHead: d(10, 8, { s: 4.8, h: 50, color: 'green', glyph: 'package', label: ['Healthy main'], sub: 'regression resolved' }),
          card: S({ x: -14, y: 4, dx: -20, dy: -180 }, 'Resolution Execution', [
            `$ git bisect reset`,
            `Checking out files: 100%, done.`,
            `Previous HEAD position was a5b8c9...`,
            `Switched to branch 'main'`,
            `$ git revert a5b8c9 -m 1  # if merge`,
            `[main 9d8e7f] Revert "fix: optimize parser loop"`,
            `= Bug permanently eradicated from main`,
          ], { icon: 'terminal' }),
          zBisect: x({ x0: -14, x1: 14, y0: -22, y1: 14 }, 'BISECT RESET & REVERT RESOLUTION'),
        },
        links: {
          rr: h('resetCmd', 'revertCommit', ['resetCmd', 'revertCommit'], { label: 'reset session' }),
          rh: h('revertCommit', 'healthyHead', ['revertCommit', 'healthyHead'], { label: 'land clean revert' }),
        },
        flows: [{ route: ['rr', 'rh'], kind: 'good', rate: 1.6 }],
      },
    },
  ],
};
