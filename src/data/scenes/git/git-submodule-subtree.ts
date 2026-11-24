// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeLink as h,
  makeZone as x,
} from '@/lib/simulator/scene-builders';

export const gitSubmoduleSubtreeLesson = {
  id: 'git-submodule-subtree',
  title: 'Case 9: Git Submodule vs Git Subtree in Monorepos',
  summary: 'Architectural comparison for embedding external code: Submodule pointer references vs Subtree commit inlining, and avoiding detached submodules in CI.',
  minutes: 14,
  level: 'advanced',
  metrics: ['embeddingType', 'pointerStyle', 'ciOverhead', 'repoAutonomy'],
  legend: ['flow', ['submodule', 'gitlink pointer'], ['subtree', 'inlined tree']],
  goals: [
    { text: 'Submodules: 160000 gitlink commit pointers and the .gitmodules manifest', step: 1 },
    { text: 'The common CI failure: forgetting git submodule update --init --recursive', step: 2 },
    { text: 'Git Subtree: inlining code and history directly without gitlink pointers', step: 3 },
  ],
  steps: [
    {
      short: 'Submodule Model',
      chapter: 'setup',
      title: 'The Submodule Architecture (160000 Gitlink)',
      body: [
        '<code>git submodule add https://github.com/org/common libs/common</code> does NOT store the external files inside your parent repository.',
        'In the parent tree, <code>libs/common</code> is recorded as a special file mode: <code>160000 commit <sha></code> (a gitlink). The URL is recorded in <code>.gitmodules</code>.',
      ],
      callout: {
        kind: 'insight',
        text: 'A submodule is a strict pointer to an external repository commit SHA. It does not auto-update when the external repo adds new commits.',
      },
      metrics: { embeddingType: 'Submodule', pointerStyle: '160000 gitlink SHA', ciOverhead: 'Requires recursive init', repoAutonomy: 'Independent' },
      scene: {
        entities: {
          parent: d(-8, 0, { color: 'green', glyph: 'boxes', label: ['Parent Repo'], sub: 'records 160000 gitlink' }),
          modules: d(0, -5, { color: 'amber', glyph: 'terminal', label: ['.gitmodules'], sub: 'URL mapping' }),
          child: d(8, 0, { color: 'purple', glyph: 'gitBranch', label: ['External Repo'], sub: 'libs/common @ commit 7a8b9c' }),
        },
        links: {
          pc: h('parent', 'child', ['parent', 'child'], { style: 'dashed', label: 'gitlink pointer' }),
          pm: h('parent', 'modules', ['parent', 'modules'], { label: 'config' }),
        },
        flows: [{ route: ['pc'], kind: 'submodule', rate: 1.2 }],
      },
    },
    {
      short: 'Subtree Model',
      chapter: 'solution',
      title: 'Git Subtree: Full Inlining without Submodule Headaches',
      body: [
        '<code>git subtree add --prefix=libs/common <repo> main --squash</code> imports the external code directly into the parent repository’s commit tree.',
        'Developers cloning the parent repository don’t need any special flags — the files are physically there! No submodule initialization errors in CI, no detached HEAD headaches, while still allowing two-way upstream pushing via <code>git subtree push</code>.',
      ],
      callout: {
        kind: 'tip',
        text: 'Git Subtree is favored by monorepo and micro-frontend architectures because it is completely transparent to regular Git users.',
      },
      changes: ['+ External files inlined directly into parent tree', '+ Zero CI submodules flags required', '+ Two-way upstream synchronization supported'],
      metrics: { embeddingType: 'Subtree', pointerStyle: 'Standard Tree Objects', ciOverhead: 'Zero (pure clone)', repoAutonomy: 'Inlined' },
      scene: {
        entities: {
          parent: d(-6, 0, { s: 5.0, color: 'green', glyph: 'boxes', label: ['Parent Repo (Monorepo)'], sub: 'contains libs/common natively' }),
          upstream: d(8, 0, { color: 'purple', glyph: 'cloud', label: ['Upstream Common'], sub: 'sync via git subtree pull/push' }),
        },
        links: {
          pu: h('parent', 'upstream', ['parent', 'upstream'], { heads: 'both', label: 'subtree sync' }),
        },
        flows: [{ route: ['pu'], kind: 'subtree', rate: 1.5 }],
      },
    },
  ],
};
