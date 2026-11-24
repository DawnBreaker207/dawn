// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitBisectAutomationLesson = {
  id: 'git-bisect-automation',
  title: 'Case 8: Automated Regression Hunting with git bisect run',
  summary: 'Binary searching 1,000 commits in O(log N) steps: automating bug regression detection using git bisect start HEAD v1.0.0 and headless test scripts.',
  minutes: 15,
  level: 'advanced',
  metrics: ['searchSpace', 'stepsRemaining', 'commitTested', 'culpritFound'],
  legend: ['bisect', ['bad', 'broken commit'], ['good', 'passing commit']],
  goals: [
    { text: 'The problem: a bug was introduced somewhere across 1,000 commits', step: 1 },
    { text: 'Binary search mechanics: how Git cuts the search range in half each step', step: 2 },
    { text: 'Automating with git bisect run <script>: finding the culprit in seconds', step: 3 },
  ],
  steps: [
    {
      short: 'The Mystery Bug',
      chapter: 'problem',
      title: 'A Bug Lurking in 1,000 Commits',
      body: [
        'A performance regression or silent bug is discovered on <code>HEAD</code>. You know the code worked perfectly 6 months ago at tag <code>v1.0.0</code>.',
        'There are 1,024 commits between <code>v1.0.0</code> and <code>HEAD</code>. Testing each commit manually would take days of developer time.',
      ],
      callout: {
        kind: 'warn',
        text: 'Linear manual inspection of 1,000 commits is impossible. We need binary search.',
      },
      metrics: { searchSpace: '1,024 commits', stepsRemaining: '10 steps (log2 1024)', commitTested: 'None', culpritFound: 'Unknown' },
      scene: {
        entities: {
          goodTag: d(-10, 0, { color: 'green', glyph: 'gitBranch', label: ['v1.0.0 (GOOD)'], sub: 'working baseline' }),
          mysteryRange: d(0, 0, { s: 5.0, color: 'slab', glyph: 'terminal', label: ['1,024 Commits'], sub: 'where did the bug enter?' }),
          badHead: d(10, 0, { color: 'rose', glyph: 'alert', label: ['HEAD (BAD)'], sub: 'broken regression' }),
        },
        links: {
          gm: h('goodTag', 'mysteryRange', ['goodTag', 'mysteryRange'], { label: 'known good' }),
          mb: h('mysteryRange', 'badHead', ['mysteryRange', 'badHead'], { label: 'known bad' }),
        },
        flows: [{ route: ['gm', 'mb'], rate: 1.0 }],
      },
    },
    {
      short: 'Binary Search',
      chapter: 'technique',
      title: 'git bisect: Halving the Space in O(log N) Steps',
      body: [
        'Run: <code>git bisect start</code> $\\rightarrow$ <code>git bisect bad HEAD</code> $\\rightarrow$ <code>git bisect good v1.0.0</code>.',
        'Git automatically checks out commit 512 (exact midpoint). You test: if it works, tell Git <code>git bisect good</code> (search upper half); if broken, <code>git bisect bad</code> (search lower half). With $\\log_2(1024) = 10$, you test only 10 commits instead of 1,024!',
      ],
      callout: {
        kind: 'insight',
        text: 'Binary search reduces exponential human misery to logarithmic simplicity.',
      },
      changes: ['+ Git checks out midpoint commit 512', '+ Search space halved from 1024 to 512'],
      metrics: { searchSpace: '512 commits', stepsRemaining: '9 steps', commitTested: 'Commit 512 (Testing)', culpritFound: 'Narrowing' },
      scene: {
        entities: {
          good: d(-10, 0, { color: 'green', glyph: 'gitBranch', label: ['Good (0)'], sub: 'known pass' }),
          mid: d(0, 0, { color: 'amber', glyph: 'terminal', label: ['Midpoint (512)'], sub: 'git checks out for test' }),
          bad: d(10, 0, { color: 'rose', glyph: 'gitBranch', label: ['Bad (1024)'], sub: 'known fail' }),
        },
        links: {
          gm: h('good', 'mid', ['good', 'mid'], { label: 'check' }),
          mb: h('mid', 'bad', ['mid', 'bad'], { label: 'bisect cut' }),
        },
        flows: [{ route: ['gm', 'mb'], kind: 'bisect', rate: 1.5 }],
      },
    },
    {
      short: 'Full Automation',
      chapter: 'solution',
      title: 'Zero-Click Automation: git bisect run ./test.sh',
      body: [
        'Why test manually? Write a script <code>test.sh</code> that returns exit code 0 (pass) or non-zero (fail).',
        'Execute: <code>git bisect run ./test.sh</code>. Git runs the binary search in a lightning-fast automated loop, checking out commits and executing the test script. Within 15 seconds, Git prints: <em>c4a91f is the first bad commit: "refactor: simplify cache eviction"</em>!',
      ],
      callout: {
        kind: 'tip',
        text: 'Exit code 125 tells bisect to skip an untestable commit (e.g. broken build due to unrelated syntax error).',
      },
      changes: ['+ Automated script executes binary search loop', '+ Culprit commit identified with 100% precision in 15 seconds'],
      metrics: { searchSpace: '1 commit', stepsRemaining: '0', commitTested: 'Finished', culpritFound: 'c4a91f (Culprit identified!)' },
      scene: {
        entities: {
          runner: d(-8, 0, { color: 'blue', glyph: 'terminal', label: ['git bisect run ./test.sh'], sub: 'automated headless runner' }),
          culprit: d(6, 0, { color: 'rose', glyph: 'alert', label: ['Commit c4a91f'], sub: 'CULPRIT IDENTIFIED: author & diff printed' }),
        },
        links: {
          rc: h('runner', 'culprit', ['runner', 'culprit'], { label: 'isolated in 10 steps' }),
        },
        flows: [{ route: ['rc'], kind: 'bad', rate: 2.0 }],
      },
    },
  ],
};
