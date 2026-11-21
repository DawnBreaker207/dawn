# AGENTS.md — Dawn Blog Contributor Rules

> Read this before touching any file. These rules describe the architecture as it
> **should be built going forward**, not necessarily what every old file already does.
> When in doubt, follow the rules here rather than copying an older file.

---

## 0. Before You Write a Single Line of Code

**Every task starts with a written plan. No exceptions.**

### Step 1 — Write the task list first

Before touching any file, write out every step you will take as a numbered list.
Be specific: name the files, the operations, and the expected outcome of each step.

```
Task: Move shell components to src/components/shell/

Plan:
1. Create src/components/shell/ directory
2. Move SidebarExplorer.astro → src/components/shell/SidebarExplorer.astro
3. Move TabBar.astro → src/components/shell/TabBar.astro
4. Move Rail.astro → src/components/shell/Rail.astro
5. Move TerminalFooter.astro → src/components/shell/TerminalFooter.astro
6. Move Breadcrumb.astro → src/components/shell/Breadcrumb.astro
7. Move CommandPalette.tsx → src/components/shell/CommandPalette.tsx
8. Move ExplorerFileIcon.astro → src/components/shell/ExplorerFileIcon.astro
9. Update import in BaseLayout.astro (7 imports)
10. Search for any other files importing from old paths — fix all
11. Run npm run dev — verify no import errors
```

### Step 2 — Follow the list, in order, completely

- Do **not** skip steps
- Do **not** do extra things not on the list
- Do **not** refactor unrelated code you happen to notice
- Do **not** add features beyond what was asked

If you discover mid-task that something else needs fixing, **add it to a separate
list** for the next task. Do not context-switch.

### Step 3 — Mark each step done as you complete it

Check off each item as you finish it. If a step fails or is blocked, stop and
report — do not silently skip it and continue.

### Step 4 — Verify before declaring done

After the last step, run `npm run dev` and confirm the site loads without errors.
Only then mark the task complete.

---

**Why this rule exists:** AI agents tend to drift — they spot unrelated issues,
"fix" things that weren't asked, leave half-done work, or do extra cleanup that
breaks something else. A written plan prevents this. If the plan doesn't cover
something, the agent stops and asks rather than improvising.

---

## 1. Stack at a Glance

| Layer | Tech |
|---|---|
| Framework | Astro 5 (SSG + SSR via Vercel adapter) |
| UI interactivity | React 19 — islands only, not the default |
| Styling | Tailwind CSS v4 (Vite plugin) + CSS custom properties |
| Language | TypeScript strict throughout — no `any` without a comment |
| Deployment | Vercel |

---

## 2. File Type Decision Tree

```
Does this file render markup?
│
├── No  → .ts   (utility, data, type, server helper)
│
└── Yes
    │
    ├── Does it need useState / useEffect / useRef?
    │   ├── Yes → .tsx   (React island, used with client:* directive)
    │   └── No  → .astro (default for all components and pages)
    │
    └── Never use .jsx or .js for components
```

**`.astro`** — layout shells, blog components, lab components, pages, anything static or
server-rendered.

**`.tsx`** — only when React client-side lifecycle is genuinely required:
`CommandPalette`, `LabRail`, `TokenBurnRail`, `LiveClock`, `RecentActivity`,
`BlogStats`, `CommitGraph`, `GitActivity`.

**`.ts`** — pure logic: `src/lib/`, `src/lib/runtime/`, `src/data/*.ts`, `src/scripts/`,
`src/types/`.

---

## 3. Directory Layout

```
data/                       ← Content loader sources (intentional root-level placement)
│   blog/                   ← Blog posts as .mdx — Astro content collection
│   authors/                ← Author profiles as .mdx
│   headerNavLinks.ts       ← Legacy config (keep here, do not move)
│   projectsData.ts/json    ← Projects list (consolidate into src/data/ when touched)
│
src/
├── components/
│   ├── shell/              ← Studio layout shell
│   │   SidebarExplorer, TabBar, Rail, TerminalFooter, Breadcrumb
│   │
│   ├── widget/             ← Self-contained runtime widgets (live data, clocks, stats)
│   │   BlogStats, CommitGraph, GitActivity, RecentActivity,
│   │   LiveClock, TokenBurnRail, LabRail, LabSimCard
│   │
│   ├── lab/                ← Lab feature components
│   │   ├── sql/            ← SQL lab components
│   │   └── <name>/         ← One subfolder per lab
│   │
│   ├── blog/               ← Blog-specific components
│   ├── home/               ← Homepage-only components
│   ├── about/              ← About page components
│   ├── profile/            ← ProfileCard
│   ├── project/            ← ProjectCard
│   └── ui/                 ← Generic primitives: Button, Link, Tag, Image, etc.
│
├── content.config.ts       ← Astro content collection schema (blog + authors)
│
├── data/                   ← Static app data (not content)
│   books.json, now.json, timeline.json, labs.ts, aws-system-design.ts
│
├── layouts/                ← BaseLayout, PostLayout, ListLayout, AuthorLayout
│
├── lib/
│   ├── runtime/            ← Server-only code (never imported by client components)
│   │   github.ts, prisma.ts, token-burn.ts, hanoi-date.ts, llm-format.ts
│   ├── utils/
│   │   blog.ts
│   ├── site.ts             ← SITE config, tabsFor(), formatDate()
│   ├── nav.ts              ← Navigation link definitions
│   ├── dts/                ← DTS isometric rendering stack (runtime-draw, scene-renderer, lessons)
│   └── ...                 ← Other shared helpers
│
├── pages/
│   ├── api/                ← API endpoints (.ts only, no markup)
│   ├── blog/
│   ├── lab/                ← One .astro per lab page
│   └── ...
│
├── scripts/                ← Vanilla TS for <script> tags in .astro files
│   └── lab/
│       ├── java/
│       └── sql/
│
├── styles/
│   ├── global.css          ← Tailwind setup + design tokens + keyframes + reusable utilities
│   ├── theme-colors.css    ← CSS custom property tokens (light/dark) — single source of truth
│   ├── shell.css           ← Studio layout only (.studio-*, .explorer-*, .tab-bar, etc.)
│   ├── designed-to-scale.css ← DTS isometric lab theme (scoped under .dts-window)
│   ├── prism.css
│   └── twemoji.css
│
└── types/                  ← Shared TypeScript types (one file per domain)
```

**Placement rules:**
- New lab: `src/pages/lab/<name>.astro` + `src/components/lab/<name>/` + `src/scripts/lab/<name>/`
- New generic utility: `src/lib/`
- New server-only code (DB, external API): `src/lib/runtime/`
- Static app data: `src/data/`
- Blog/author **content** (MDX posts): `data/blog/` or `data/authors/` (root `data/`)

---

## 4. Import Alias

The alias `@/*` resolves to `./src/*`. **Always use it.** Never use relative paths
more than one level up.

```ts
// ✅
import BaseLayout from '@/layouts/BaseLayout.astro';
import { SITE } from '@/lib/site';
import { LABS } from '@/data/labs';
import type { LabEntry } from '@/types/index';

// ❌
import BaseLayout from '../../layouts/BaseLayout.astro';
import data from '../../projectsData.json';
```

---

## 5. Theme & Dark Mode

### How dark mode works

Dark mode is **class-based**, toggled by adding `dark` to `<html>`. The selectors in
`theme-colors.css` are:

```css
:root { /* light values */ }
:root.dark, .dark, html.dark, [data-theme='dark'] { /* dark values */ }
```

Tailwind's dark variant is configured to match:
```css
@custom-variant dark (&:where(.dark, .dark *));
```

There is **no** `prefers-color-scheme` media query. The JS toggle writes to
`localStorage` and applies the class on `<html>`.

### CSS custom property tokens

All semantic colors live in `src/styles/theme-colors.css`. Use them everywhere.

| Token | Light | Dark | Use for |
|---|---|---|---|
| `--bg` | `#f4f4f5` | `#18181b` | Page background |
| `--bg-alt` | `#ffffff` | `#212126` | Cards, elevated panels |
| `--bg-subtle` | `#e4e4e7` | `#27272a` | Subtle backgrounds |
| `--bg-hover` | `#ebebee` | `#2e2e36` | Hover states |
| `--border` | `#e4e4e7` | `#2e2e36` | Standard borders |
| `--fg` | `#09090b` | `#f4f4f5` | Primary text |
| `--fg-dim` | `#71717a` | `#a1a1aa` | Secondary text |
| `--fg-faint` | `#a1a1aa` | `#71717a` | Muted text, icons |
| `--accent` | `#e11d48` | `#e11d48` | Brand red (same both themes) |
| `--accent-hover` | `#be123c` | `#f43f5e` | Accent hover |
| `--accent-dim` | `#fb7185` | `#be123c` | Soft accent |

```html
<!-- ✅ correct — works in both themes -->
<div class="bg-(--bg) text-(--fg) border border-(--border)">

<!-- ❌ wrong — hardcodes a color, breaks light mode -->
<div class="bg-zinc-900 text-zinc-100">
```

### CSS specificity

Adding a new color to both themes means updating `theme-colors.css` in **both** the
`:root` block and the dark block. Never define a token only in one of them.

---

## 6. Styling: Where CSS Lives

### `global.css` — framework only

Only these things belong in `global.css`:
- `@import "tailwindcss"`, `@import "./theme-colors.css"`, `@plugin` declarations
- `@theme { }` — design tokens for Tailwind (font families, spacing, z-index, shadows, animation durations)
- `@keyframes` used by more than one component
- `@layer base` — browser reset rules
- `@layer utilities` — reusable custom classes: `.animate-wave`, `.no-scrollbar`, `.thin-scrollbar`, `.prose`, `.tip`

### `shell.css` — studio layout only

Only the VS Code-style editor shell:
`.studio-shell`, `.studio-workspace`, `.studio-main`, `.studio-content`,
`.explorer-row`, `.explorer-caret`, `.folder-open`, `.tab-bar`, `.sidebar-ext*`,
mobile panel behavior, version menu.

**Do not** add anything to `shell.css` unless it is part of the global editor chrome.

### Lab-specific CSS — isolated per lab

Each lab has its own visual language. Keep its CSS contained.

**Pattern:** create a dedicated CSS file scoped under a root class for that lab.
See `src/styles/designed-to-scale.css` as the reference model — all its rules are
scoped under `.dts-window { }` so they never leak.

```css
/* src/styles/lab-sql.css — example */
.sql-lab {
  --sql-cyan: #22d3ee;

  .fp-tag { ... }
  .mvcc-tbl { ... }
  .pool-slot { ... }
  .bt-log-line { ... }
}
```

Then import it in the lab page or in `BaseLayout` and wrap the page in `.sql-lab`.

**Do not** continue adding lab-specific classes to `global.css` — it is already
large and mixes concerns.

### Tailwind vs scoped `<style>` decision

| Need | Use |
|---|---|
| Spacing, flex/grid, typography, hover/focus states | Tailwind utility classes |
| Complex selectors, pseudo-elements, `::after`, `::marker` | Scoped `<style>` in `.astro` |
| Reusable pattern used across 3+ components | `@layer utilities` in `global.css` |
| Lab or feature-specific styles | Dedicated CSS file scoped under a root class |

---

## 7. Component Conventions

### Props interface

Every `.astro` component that accepts props needs an explicit `interface Props`:

```astro
---
interface Props {
  title: string;
  href: string;
  description?: string;
}
const { title, href, description } = Astro.props;
---
```

### React islands — client directives

```astro
<!-- use for below-the-fold widgets — loads after page is interactive -->
<TokenBurnRail client:idle />

<!-- use for above-the-fold critical interactive UI only -->
<CommandPalette client:load blogPosts={blogPosts} projects={projects} />

<!-- use for heavy components only visible on scroll -->
<HeavyComponent client:visible />
```

Default to `client:idle`. Avoid `client:only` — it skips SSR entirely.

### Scripts in `.astro`

Extract client-side behavior to `src/scripts/` and load as a module. Inline only for
~5-line snippets.

```astro
<!-- ✅ Astro bundles and deduplicates these automatically -->
<script src="@/scripts/app-shell.ts"></script>

<!-- ✅ fine for tiny one-offs -->
<script>
  document.getElementById('btn')?.addEventListener('click', () => { ... });
</script>
```

---

## 8. Lab Pages

Labs are interactive visual simulations. Each lab must follow this structure:

```
src/pages/lab/<name>.astro            page component
src/components/lab/<name>/            all UI components for this lab
src/scripts/lab/<name>/               vanilla TS for simulations
src/styles/lab-<name>.css             lab-specific CSS (scoped under .<name>-lab)
```

Requirements:
- `export const prerender = true` — all labs are static pages
- Interactive simulations → vanilla TS in `src/scripts/lab/` loaded via `<script>` tags
- Use React (`.tsx` + `client:idle`) only when the interaction genuinely needs
  React state management (e.g. a component with many inter-dependent state values)
- Lab CSS → isolated file, scoped under a root class (see `designed-to-scale.css` pattern)

---

## 9. Astro Patterns

### Rendering mode

Every page must declare its rendering mode explicitly:

```astro
---
export const prerender = true;   // ← static (SSG), built at deploy time
                                  //   required for all /lab/* and /blog/* pages
---
```

API routes (`src/pages/api/`) are SSR by default — do **not** add `prerender = true` to them.
Omitting the declaration inherits the adapter's default (Vercel SSR), which may cause
unexpected build errors on static pages.

### Dynamic routes with `getStaticPaths`

Any page with a `[param]` or `[...slug]` segment must export `getStaticPaths` when
`prerender = true`. Pass route params and prefetched data as `props`:

```astro
---
export const prerender = true;

export async function getStaticPaths() {
  const posts = await getPosts();
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },          // pass the full object — avoids re-fetching in the component
  }));
}

const { post } = Astro.props; // typed automatically from getStaticPaths return type
---
```

Never call `getPosts()` / `getCollection()` again inside the same component if
`getStaticPaths` already fetched the data — use the `props` from the path.

### View Transitions

This project uses Astro's `<ClientRouter />` for client-side navigation. It is
already wired in `BaseLayout.astro`. Do not remove it.

Implications:
- `document` and `window` listeners set at module load time survive page transitions.
  Use `document.addEventListener('astro:page-load', ...)` to re-run setup after
  each navigation.
- The global `<script>` tag in `.astro` files runs once per page load, but
  `astro:page-load` fires on every navigation including the first.
- Module-level state in `.ts` scripts persists across navigations — use this for
  session-like state (e.g. `LabRail`'s `persistedPick`), but be careful with
  event listener accumulation.

```ts
// ✅ safe — re-runs on every navigation
document.addEventListener('astro:page-load', () => {
  document.getElementById('btn')?.addEventListener('click', handler);
});

// ⚠️ runs once at load only — misses navigations if not inside astro:page-load
document.getElementById('btn')?.addEventListener('click', handler);
```

### Layouts

Every page wraps in `<BaseLayout>`. Provide `title` and `description` — both are
used for `<title>`, OpenGraph, and sitemap:

```astro
<BaseLayout
  title="SQL EXPLAIN Explorer"
  description="Interactive query plan simulator — Seq Scan vs B-Tree, MVCC, index sizing."
>
  ...content...
</BaseLayout>
```

For blog posts, the nesting is `BaseLayout > PostLayout` — `PostLayout` handles the
reading layout, TOC, tags, and related posts. Never bypass this hierarchy.

### Content rendering

Render MDX content with `render()` from `astro:content`:

```astro
---
import { render } from 'astro:content';
const { Content, headings } = await render(post);
---
<Content />
```

Do not import MDX files directly with `import`. Use the content collection API.

### Slots

Layouts accept named slots for page-specific injections:

```astro
<!-- in a layout -->
<slot name="head" />     <!-- extra <head> tags -->
<slot />                 <!-- main content -->

<!-- in a page -->
<BaseLayout>
  <Fragment slot="head">
    <meta name="robots" content="noindex" />
  </Fragment>
  <main>...</main>
</BaseLayout>
```

---

## 10. Content Collections

Blog posts and author profiles are Astro content collections defined in
`src/content.config.ts`. Their source files live at the **root** `data/` folder
(this is intentional — the Astro loader uses `base: './data/blog'`):

```
data/
  blog/      ← .mdx files, one per post
  authors/   ← .mdx files, one per author
```

**Do not move** `data/blog/` or `data/authors/` — the content loader path is hardcoded.

Querying posts in a component:
```ts
import { getPosts } from '@/lib/utils/blog';
const posts = await getPosts(); // returns sorted, filtered collection entries
```

---

## 11. API Routes

```
src/pages/api/<name>.json.ts        JSON endpoint
src/pages/api/<domain>/<name>.ts    grouped endpoints
```

- Server-only imports (Prisma, GitHub API, tokens) → `src/lib/runtime/` only
- Use `src/lib/ttl-cache.ts` / `src/lib/api-cache.ts` for external API calls
- Return typed responses — no `any` in response shapes

---

## 12. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Component files | PascalCase | `PostCardGridView.astro` |
| Page files | kebab-case | `request-lifecycle.astro` |
| Script files | kebab-case | `app-shell.ts`, `token-burn-page.ts` |
| Utility/lib files | camelCase | `ttl-cache.ts`, `blog.ts` |
| Data files | kebab-case | `dts-lessons.ts`, `books.json` |
| Type files | camelCase (no `.type.ts` suffix) | `token-burn.ts`, `server.ts` |
| CSS class names | kebab-case | `.explorer-row`, `.sidebar-ext-toggle` |
| TypeScript interfaces | PascalCase | `LabEntry`, `SiteVersion` |
| Exported constants | SCREAMING_SNAKE | `GITHUB_USERNAME`, `LABS`, `SITE` |

---

## 13. Rendering Budget — Static First

### Default: everything is static

This project deploys to Vercel. The goal is maximum static output — fast, cheap, no cold starts.

```
prerender = true  → built at deploy time, served from CDN edge. USE THIS EVERYWHERE.
prerender = false → rendered per-request on Vercel Function. AVOID unless necessary.
```

**Static pages** (`prerender = true`): all `/blog/*`, `/lab/*`, `/topics/*`, `/about`,
`/projects`, `/books`, `/now`, `/heatmap`, `/tokens` — anything whose content does not
change per user or per request.

**SSR pages** (omit `prerender`, or set `false`): only when the page content is
user-specific or cannot be known at build time. Currently none in this project.
Before adding one, ask: can the dynamic part be moved to an API route instead?

**API routes** (`src/pages/api/`): always SSR. They are the only server-rendered
boundary in this project. Dynamic data lives here, never in page components.

### Island budget — minimize client JS

Every `client:*` directive ships a React bundle. Keep islands small and few.

| Directive | When to use |
|---|---|
| `client:load` | Immediately interactive above-the-fold UI (CommandPalette) |
| `client:idle` | Interactive but not urgent — lab components, heavy widgets |
| `client:visible` | Rail widgets, below-fold content (CommitGraph, RecentActivity) |
| `client:only` | Avoid — skips SSR entirely, causes layout shift |

**Before making something a React island, ask:**
1. Does this component re-render based on user interaction? If no → `.astro`
2. Does it need `useEffect` / `useState`? If no → `.astro`
3. Can the interactivity be done in vanilla TS via `<script>`? If yes → `.astro` + script

**Pattern: static shell + API fetch in island**

```astro
<!-- page.astro — prerendered, zero JS -->
<BaseLayout title="Token Usage">
  <TokenBurnRail client:visible />  <!-- only this part is dynamic -->
</BaseLayout>
```

```tsx
// TokenBurnRail.tsx — fetches its own data client-side
export default function TokenBurnRail() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/token-burn.json').then(r => r.json()).then(setData);
  }, []);
  ...
}
```

This keeps the page static while letting widgets hydrate with live data independently.

### `transition:persist` — use sparingly

```astro
<aside id="rail" transition:persist>
```

`transition:persist` preserves the element (and its React state) across View Transitions
navigations. Use it only on elements that are expensive to remount or hold meaningful
session state (the Rail, the sidebar). Do not apply it to page content — it will
prevent the content from updating on navigation.

---

## 14. Component Allocation Rules

### Extract vs keep inline

**Extract to a component when:**
- The same markup appears in **2 or more** different files
- The markup is **20+ lines** and has a clear semantic name
- It encapsulates a behavior (fetching, state, interaction)
- It is a reusable primitive that works across different contexts (`ui/` components)

**Keep inline when:**
- Used in exactly one file and tightly coupled to that page's data
- It is a simple list render (3-5 lines per item) — see `index.astro`'s post list
- Extracting it would require passing 4+ props just to replicate the same inline markup
- It is a one-off layout wrapper with no reuse potential

**Anti-pattern: extracting for the wrong reason**

```astro
<!-- ❌ don't extract this — it is 3 lines, used once, no semantic meaning -->
<!-- PostDateBadge.astro -->
<span class="font-mono text-xs text-(--fg-dim)">{date}</span>
```

```astro
<!-- ✅ this belongs inline -->
<span class="font-mono text-xs text-(--fg-dim)">{date}</span>
```

### Slots vs props

Use **slots** when the component controls layout but the caller controls content.
Use **props** when the component controls both layout and content.

```astro
<!-- ✅ slot — caller decides the content, component decides the wrapper -->
<PageTitle>SQL EXPLAIN Explorer</PageTitle>

<!-- ✅ prop — component owns all rendering for a simple value -->
<BlogMeta date={post.data.date} minutes={minutes} />

<!-- ❌ prop-as-markup — this should be a slot -->
<SomeCard titleHtml="<strong>hello</strong>" />
```

**Named slots for multi-region composition:**

```astro
<!-- Layout with two regions -->
<article>
  <header><slot name="header" /></header>
  <div><slot /></div>       <!-- default slot for body content -->
  <footer><slot name="footer" /></footer>
</article>
```

Prefer named slots over passing render functions or complex object props.

### Props discipline

A component with more than 4 props is a warning sign — it may be doing too much.
Options:
1. Split into smaller components
2. Accept a typed object prop instead of many primitives
3. Use slots for the parts the caller owns

```astro
<!-- ⚠️ too many loose props -->
<PostCard title={...} date={...} tags={...} image={...} href={...} minutes={...} summary={...} />

<!-- ✅ one typed object — mirrors the data shape -->
<PostCard post={post} />
```

### Component layer rules

| Layer | Lives in | Rule |
|---|---|---|
| `ui/` | `src/components/ui/` | Fully dumb — zero data fetching, zero page awareness |
| `blog/`, `lab/`, `home/` etc. | domain sub-folder | May import from `lib/` and `data/`, must not cross domains |
| `shell/` | `src/components/shell/` | May import site config and nav — must not import blog/lab logic |
| `widget/` | `src/components/widget/` | Fetches from API routes at runtime — no build-time data |

A `ui/` component that starts importing from `@/lib/utils/blog` has drifted into the
`blog/` layer — move it there.

A `shell/` component that imports lab data has leaked concerns — refactor.

### Script reuse

Vanilla TS scripts (`src/scripts/`) follow the same domain rules:

- `src/scripts/app-shell.ts` — runs on every page (loaded by `BaseLayout`)
- `src/scripts/site.ts`, `src/scripts/extras.ts` — global but non-critical behavior
- `src/scripts/lab/<name>/` — loaded only by that lab's page, not shared

Do not import a lab script into another lab or into a global script.

---

## 15. Project Audit — Known Gaps to Fix

This section documents the known structural gaps between the current codebase and the
rules above. When touching any of these areas, fix them as part of the same change.
Do not leave them in place and add more code on top.

### A. `src/components/` root — 21 unorganized files

These files exist flat in `src/components/` and must be moved to their correct subfolder.
Every import that references them must be updated at the same time.

**Move to `src/components/shell/`:**
```
Breadcrumb.astro
CommandPalette.tsx
ExplorerFileIcon.astro
Rail.astro
SidebarExplorer.astro
TabBar.astro
TerminalFooter.astro
```

**Move to `src/components/widget/`:**
```
BlogStats.tsx
CommitGraph.tsx
GitActivity.tsx
LabRail.tsx
LabSimCard.astro
LiveClock.tsx
RecentActivity.tsx
TokenBurnRail.tsx
```

**Move to `src/components/lab/java/`:**
```
JavaConcurrencyTab.astro
JavaJvmTab.astro
JavaRegularTab.astro
```

**Move to `src/components/blog/`:**
```
PostList.astro
TagChips.astro
```

### B. `Pagination.astro` duplicate — resolve before adding pagination anywhere

Two different components exist for the same purpose:
- `src/components/Pagination.astro` — prop: `base`, compact mono style
- `src/components/blog/Pagination.astro` — prop: `basePath`, "Previous/Next" button style

Decide on one, delete the other, update all imports. The `blog/` version is newer.

### C. Data files misplaced in `src/lib/`

These are pure data constants with no utility logic. Move to `src/data/` and update imports:

```
src/lib/aws-system-design.ts  →  src/data/aws-system-design.ts
src/lib/system-architecture.ts  →  src/data/system-architecture.ts
src/lib/labs.ts  →  src/data/labs.ts
```

### D. `projectsData.json` at project root

Currently imported via relative path from two places:
- `src/layouts/BaseLayout.astro` → `../../projectsData.json`
- `src/pages/projects/index.astro` → `../../../projectsData.json`

Move to `src/data/projectsData.json` and update both imports to `@/data/projectsData.json`.

### E. `shell.css` does not exist

All studio shell layout CSS is currently in `global.css` (~800 lines of `.studio-*`,
`.explorer-*`, `.tab-bar`, `.sidebar-ext*`, `.pal-*`, `.version-*`, `.tip`, `.toc-link`,
`.copy-btn`). This must be extracted to `src/styles/shell.css` and imported in
`BaseLayout.astro`.

### F. SQL lab CSS is in `global.css`

~150 lines of SQL lab styles (`.fp-*`, `.pool-*`, `.tb-*`, `.mvcc-*`, `.bt-*`,
`.infra-tab-active`) live in `global.css`. They must be moved to
`src/styles/lab-sql.css`, scoped under a `.sql-lab { }` root class, and imported only
by `src/pages/lab/sql.astro`.

---

## 16. Project Root Discipline

The project root should contain only: config files, lockfiles, and source directories.
Everything else is noise that pollutes `git status` and confuses agents.

### What belongs at root (keep)

```
astro.config.mjs     package.json     package-lock.json
tsconfig.json        vercel.json      prisma/
data/                src/             public/
scripts/             AGENTS.md        README.md   LICENSE
.claude/             .gitignore
```

### `scripts/` at root — build tools only

`scripts/` contains legitimate Node.js build and sync scripts. Keep:
```
build-books.mjs      build-og.mjs       build-stats.mjs
sync-notion.mjs      sync-now.mjs       token-burn.mjs
prisma.mjs           check-db.mjs
```

One-off audit/debug scripts should be deleted after use, not committed:
```
audit-pills.cjs         inspect-real-page.cjs    spec-all-labs.cjs
rebuild-dts-bundle.cjs  register-aws-lesson.cjs  generate-system-design.mjs
```

### Root `*.log` and `*.json` artifacts — delete and gitignore

```
dev-server.log  dev-stderr.log  dev-stdout.log  dev.log
preview.log     serve.log       token-burn.dry-run.json
```

Add to `.gitignore`:
```
*.log
*.dry-run.json
```

### Root screenshot files — delete

All `*.png` files at root are development audit screenshots, not part of the app:
```
java-*.png   our-current-*.png   pills-screenshot.png
real-ref-*.png   spec-*.png   sql-*.png   system-design-en.png
test-*.png
```

### `faq/` directory — delete

Contains 3 `.md` files (`custom-mdx-component.md`, `customize-kbar-search.md`,
`deploy-with-docker.md`) that are leftover from the original Next.js template.
They are not referenced anywhere in the app.

### Other root artifacts — delete
```
real-ref-details.json    ref-real-styles.css    token-burn.dry-run.json
```

---

## 17. `public/` Discipline

`public/` is served verbatim by the CDN. Only ship what the running app actually uses.

### What is intentional — do not touch

```
public/favicon.ico            public/favicon.svg
public/robots.txt
public/static/favicons/       ← all favicon variants
public/static/icons/          ← SVG tech icons used by components
public/static/images/avatar.jpg
public/static/images/twitter-card.png
public/static/images/black-grit.png   public/static/images/white-grit.png
public/static/images/blog/            ← blog post images
public/static/images/experiences/     ← company logos for about page
public/static/images/projects/        ← project screenshots
public/static/resume.pdf
public/og/                            ← generated OpenGraph images
public/dts/                           ← pre-built DTS bundle, served as iframe embed
                                         at /dts/index.html — referenced by lab pages
```

`public/dts/` is a pre-built Vite bundle for the Designed-to-Scale interactive labs.
It is loaded as an iframe in `aws-cloud.astro`, `microservices.astro`,
`request-lifecycle.astro`, and `ArchitectureChapterPicker.astro`. Do not delete it.
To update it, re-run the DTS build script (`scripts/rebuild-dts-bundle.cjs`).

### What to delete

```
public/system-design.html          ← standalone dev prototype, replaced by /lab/system-design
public/static/images/canada/       ← template demo images, unused
public/static/images/google.png    ← unused, leftover
public/static/images/github-traffic.png  ← dev artifact
public/static/images/ocean.jpeg    ← unused
public/static/images/sparrowhawk-avatar.jpg  ← unused old avatar
public/static/images/time-machine.jpg       ← duplicate of projects/time-machine.jpg
public/static/images/logo.png      ← verify not used before deleting
```

Before deleting any image, run:
```bash
grep -r "filename.ext" src/ data/ public/ --include="*.astro" --include="*.tsx" --include="*.ts" --include="*.mdx"
```
If no results → safe to delete.

---

## 18. Environment Variables

Never access `import.meta.env` or `process.env` directly in components or pages.
Use the `env()` helper from `src/lib/env.ts` — it checks both Astro/Vite vars and
platform-injected runtime vars (Vercel injects via `process.env`):

```ts
// ✅
import { env } from '@/lib/env';
const token = env('GITHUB_TOKEN');

// ❌ — misses Vercel runtime vars
const token = import.meta.env.GITHUB_TOKEN;
```

Environment variables accessed in browser-side code (React islands, `<script>` tags)
must be prefixed `PUBLIC_` and accessed via `import.meta.env.PUBLIC_*` — the `env()`
helper is server-only.

Add new env vars here in order: `.env.local` for local dev, Vercel dashboard for
production, then document the variable name and purpose in a comment at the top of
the file that uses it.

---

## 19. Auto-Generated Files — Do Not Edit Manually

Several files in `src/data/` are written by build scripts and gitignored.
**Do not edit them directly.** Run the corresponding script instead.

| File | Generated by | When to run |
|---|---|---|
| `src/data/books.json` | `scripts/build-books.mjs` | After updating Notion reading list |
| `src/data/now.json` | `scripts/sync-now.mjs` | After updating /now Notion page |
| `src/data/timeline.json` | `scripts/sync-notion.mjs` | After updating timeline in Notion |
| `src/build-stats.json` | `scripts/build-stats.mjs` | After deploy (CI runs this) |
| `public/og/*.png` | `scripts/build-og.mjs` | After publishing new blog post |

If an agent creates or modifies content that should update one of these files, run
the script — do not write to the file directly.

---

## 20. MDX Blog Post Schema

When creating a new blog post at `data/blog/<slug>.mdx`, the frontmatter must match
the schema defined in `src/content.config.ts`:

```mdx
---
title: "Post Title"           # required, string
date: 2026-11-19              # required, ISO date
tags: [java, spring]          # optional, array — use lowercase slugs
summary: "One-line summary."  # optional but strongly recommended
draft: false                  # optional, default false — set true to hide
images: []                    # optional, array of image paths relative to public/
---

Post content here.
```

**Image convention inside MDX:**
- Store images at `public/static/images/blog/<slug>/filename.ext`
- Reference as `/static/images/blog/<slug>/filename.ext`
- OG image is auto-generated from post slug by `scripts/build-og.mjs`

---

## 21. TypeScript Conventions

**`interface` vs `type`:**
- `interface` for object shapes that describe a thing: component props, API responses, data models
- `type` for unions, intersections, aliases, utility compositions

```ts
// ✅ interface for a shape
interface LabEntry { href: string; title: string; tag: string; }

// ✅ type for a union or alias
type RenderMode = 'static' | 'ssr';
type Post = CollectionEntry<'blog'>;
```

**No `as` casting without a comment:**
```ts
// ❌
const data = response as MyType;

// ✅ — explain why the cast is safe
const data = response as MyType; // API contract guarantees this shape
```

**No `any`:**
```ts
// ❌
function parse(input: any) { ... }

// ✅ use unknown + narrowing, or the actual type
function parse(input: unknown) { ... }
```

**Server vs client types:**
Types used only in server/API code go in `src/types/server.ts`.
Types shared between server and client go in `src/types/index.ts` or a domain file.
Never import a server-only type (Prisma models, raw DB rows) in a component.

---

## 22. Raw Files in `public/` — When Allowed

### The rule

`public/` is served verbatim by the CDN, bypassing Astro's build pipeline entirely.
Files there cannot import from `src/`, use TypeScript, or reference Tailwind classes.

**Default: do not put new HTML, JS, or CSS in `public/`.**
Everything that can go through Astro's pipeline should.

### What belongs in `public/`

| Type | Examples | Reason |
|---|---|---|
| Static media | `images/`, `icons/`, `favicon.ico`, `resume.pdf` | No processing needed |
| Browser config | `robots.txt`, `static/favicons/site.webmanifest` | Must be at a fixed URL |
| Generated assets | `og/*.png` | Built by scripts, not Astro |
| Pre-built sub-apps | `dts/` | See below |

### Pre-built sub-apps (`public/dts/` pattern)

A sub-app belongs in `public/` only when **all three** conditions are true:

1. **It is built by a separate tool** (Vite, webpack, etc.) outside of Astro
2. **It runs in an isolated context** — an `<iframe>` with its own origin
3. **It communicates with the parent only via `postMessage`** or URL hash — not imports

The `public/dts/` bundle is the only current example. It is an isometric simulation
app (Designed-to-Scale) that runs inside iframes on lab pages. It has its own
`index.html`, hashed JS/CSS assets, and `dts-bridge.js` which syncs the theme with
the parent page via `postMessage`.

```
public/dts/
  index.html          ← the sub-app shell
  dts-bridge.js       ← postMessage theme sync, runs inside the iframe
  dts-theme.css       ← base CSS for the sub-app
  assets/             ← hashed Vite output (JS, CSS, fonts)
```

> **Note**: `public/dts/` is actively being migrated to a pure TypeScript renderer
> (see Section 29). It remains here as a visual reference during migration.
> Do not add new lessons to the bundle — add them to `src/lib/dts/lessons.ts`.
> Once all pages are migrated and verified, `public/dts/` will be deleted.

**Do not** create a second sub-app bundle in `public/` without a clear reason why
it cannot be an Astro page or component.

### What must NOT go in `public/`

| ❌ Don't | ✅ Do instead |
|---|---|
| `public/my-feature.html` | `src/pages/my-feature.astro` |
| `public/scripts/my-logic.js` | `src/scripts/my-logic.ts` |
| `public/styles/my-styles.css` | `src/styles/my-styles.css` or scoped `<style>` |
| `public/form.html` | Form element inside a `.astro` page |

### Forms

Forms are HTML elements inside `.astro` pages or React components — never standalone
HTML files in `public/`.

**Form submission pattern** in this project:

```astro
<!-- src/pages/contact.astro -->
<form method="POST" action="/api/contact">
  <input name="email" type="email" required />
  <button type="submit">Send</button>
</form>
```

```ts
// src/pages/api/contact.ts
import type { APIRoute } from 'astro';
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const email = data.get('email');
  // ... handle submission
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

For client-side-only forms (no server action needed), handle `submit` in a
`<script>` tag with `event.preventDefault()`.

---

## 23. Key Files Reference

Each file listed here has a single owner responsibility. Do not add logic to a file
that belongs in another. When a file outgrows its responsibility, split it — do not
expand the scope.

### Config & site identity

| File | Owns | Do not add |
|---|---|---|
| `src/lib/site.ts` | `SITE` metadata, `SITE_URL`, `SITE_VERSIONS`, `tabsFor()`, `formatDate()`, `Tab` type | Nav links, lab data, CSS |
| `src/lib/nav.ts` | `headerNavLinks` array — the top navigation items | Page metadata, lab config |
| `src/lib/constants.ts` | GitHub username, repo name, host constants | Site metadata, functions |
| `src/lib/env.ts` | `env()` helper for reading env vars across Astro + Node runtimes | Business logic |
| `src/content.config.ts` | Astro content collection schemas (blog, authors) | Any runtime code |

### Data registries

| File | Owns | Do not add |
|---|---|---|
| `src/data/labs.ts` | `LABS` array — the registry of all lab pages (title, href, tag, intro) | Lab implementation logic |
| `src/data/aws-system-design.ts` | Node/step data for the AWS cloud lab visualization | Rendering logic |
| `src/lib/dts/lessons.ts` | Lesson + step + scene data for all DTS arch labs (TS renderer) | Rendering logic |
| `data/headerNavLinks.ts` | Legacy nav config (root-level, do not move — imported by old data scripts) | — |

### Utilities

| File | Owns | Do not add |
|---|---|---|
| `src/lib/utils/blog.ts` | `getPosts()`, `slugify()`, `readingMinutes()`, `Post` type | Non-blog utilities |
| `src/lib/ttl-cache.ts` | In-memory TTL cache factory for server-side caching | Persistent storage |
| `src/lib/api-cache.ts` | Wraps external API calls with TTL caching | Business logic |
| `src/lib/fetcher.ts` | Typed `fetch()` wrapper | Cache logic |
| `src/lib/feed.ts` | RSS/Atom feed generation | Blog post querying |

### Runtime (server-only — never import in components or scripts)

| File | Owns |
|---|---|
| `src/lib/runtime/github.ts` | GitHub API calls (contributions, activity) |
| `src/lib/runtime/github-day.ts` | Per-day GitHub contribution data |
| `src/lib/runtime/token-burn.ts` | Claude token usage tracking via Prisma |
| `src/lib/runtime/prisma.ts` | Prisma client singleton |
| `src/lib/runtime/hanoi-date.ts` | Current time in Hanoi timezone |
| `src/lib/runtime/llm-format.ts` | Format helpers for token/model display |

### Layouts

| File | Owns | Do not add |
|---|---|---|
| `src/layouts/BaseLayout.astro` | Root HTML shell: `<head>` meta, font imports, style imports, studio grid, `SidebarExplorer`, `TabBar`, `Rail`, `TerminalFooter`, `CommandPalette`, `ClientRouter` | Page-specific content, blog logic |
| `src/layouts/PostLayout.astro` | Blog post reading layout: TOC, meta, tags, related posts, Giscus comments | Non-blog layouts |
| `src/layouts/ListLayout.astro` | Paginated post list layout | Single-post rendering |
| `src/layouts/AuthorLayout.astro` | Author profile layout | — |

### Client scripts (loaded by BaseLayout, run on every page)

| File | Owns |
|---|---|
| `src/scripts/app-shell.ts` | Tab bar management, keyboard shortcuts (`Ctrl+K` palette, `Ctrl+B` sidebar), mobile panel toggle, `astro:page-load` re-registration |
| `src/scripts/site.ts` | Theme toggle, tooltips, mobile nav, typed bios, TOC scrollspy, reading progress bar, code copy buttons, language badges, blog grid/list toggle |
| `src/scripts/extras.ts` | Weather widget, spider canvas — non-critical ambient features |
| `src/scripts/sound.ts` | Keyboard sound effects |

These four scripts are loaded by `BaseLayout.astro` and run on every page navigation.
They must never import from lab scripts. Keep them small — if a feature is page-specific,
put it in `src/scripts/<page-name>.ts` instead.

### Styles

| File | Owns |
|---|---|
| `src/styles/theme-colors.css` | All CSS custom property tokens: `--bg`, `--fg`, `--accent`, etc. for both themes. **Single source of truth.** |
| `src/styles/global.css` | Tailwind setup, `@theme` tokens, `@keyframes`, `@layer base`, `@layer utilities` |
| `src/styles/shell.css` | Studio layout: `.studio-*`, `.explorer-*`, `.tab-bar`, `.sidebar-ext*`, command palette, tooltips |
| `src/styles/designed-to-scale.css` | DTS isometric lab theme, scoped under `.dts-window` |
| `src/styles/prism.css` | Syntax highlighting |
| `src/styles/twemoji.css` | Twemoji rendering |

---

## 24. Feature Grouping — When a Feature Gets Large

### Angular-style co-location: not applicable in Astro

Astro's build pipeline enforces layer separation — scripts must be reachable via
`@/scripts/`, styles via `@/styles/` or scoped `<style>`, types via `@/types/`.
You cannot put a `.ts` script inside `src/components/lab/sql/` and have Astro
load it reliably as a `<script>` module.

The closest equivalent to Angular feature modules is the **parallel-folder pattern**
already used for labs:

```
src/components/lab/sql/     ← all .astro UI components for this feature
src/scripts/lab/sql/        ← all vanilla TS for this feature
src/styles/lab-sql.css      ← all feature-specific CSS (when volume justifies it)
```

Same feature name, three parallel locations. This IS feature-based organization —
just split across the conventional layers Astro expects.

### When to split a component into a subfolder

A single `.astro` or `.tsx` file is fine until it gets unwieldy. Split into a
subfolder when any of these are true:

| Signal | Action |
|---|---|
| File is 200+ lines | Extract logical sections into sub-components |
| Page imports 6+ components from the same domain | Group them in `components/<domain>/` |
| A feature has its own data shape, scripts, and styles | Use parallel-folder pattern |
| Two features share a component | Move it up one level or into `ui/` |

### Threshold by feature size

**Small (1–3 components, < 100 lines each):**
```
src/components/lab/my-feature.astro        ← one file is fine
src/scripts/lab/my-feature.ts             ← one script file
                                           ← styles as scoped <style> in the component
```

**Medium (3–8 components):**
```
src/components/lab/my-feature/
  index.astro          ← the entry point, imported by the page
  StepOne.astro
  StepTwo.astro
  Controls.astro
src/scripts/lab/my-feature/
  engine.ts
  data.ts
```

**Large (8+ components, complex state, own CSS vocabulary):**
```
src/components/lab/my-feature/   ← as above
src/scripts/lab/my-feature/      ← as above
src/styles/lab-my-feature.css    ← dedicated CSS file, scoped under .my-feature
```

### The `index.astro` convention

When a feature has its own subfolder, the entry-point component is named `index.astro`.
The page imports it as a folder:

```astro
---
// src/pages/lab/my-feature.astro
import MyFeature from '@/components/lab/my-feature/index.astro';
---
<BaseLayout title="My Feature">
  <MyFeature />
</BaseLayout>
```

This keeps the page file minimal — it only handles layout, title, and routing.

### What stays flat vs what gets a subfolder

```
src/components/lab/
  sql/                     ← ✅ subfolder — 11 components
  my-feature/              ← ✅ subfolder — 5+ components
  ArchitectureChapterPicker.astro  ← ✅ flat — single component
```

A single self-contained component that is used on one page does not need its own
subfolder. Only group when there are multiple related components.

### SSR vs static — grouping is the same

The parallel-folder pattern applies equally to static (`prerender = true`) and SSR
pages. The only SSR-specific consideration: if a feature's components fetch data
at request time, the fetching logic lives in an API route (`src/pages/api/`) and
the components call that route — same pattern regardless of how many components
the feature has.

---

## 25. Migration Status

The rules in this file describe the **target state**. The table below tracks what has
and has not been converted yet. Update this table as work is completed.

| Area | Status | Notes |
|---|---|---|
| `src/components/shell/` subfolder | ✅ Done | 7 shell components moved and imports updated |
| `src/components/widget/` subfolder | ✅ Done | 8 widget components moved and imports updated |
| `src/components/lab/java/` subfolder | ✅ Done | 3 Java tab files moved to lab/java/ |
| `src/components/blog/` additions | ✅ Done | `PostList.astro`, `TagChips.astro` moved to blog/ |
| `Pagination.astro` duplicate resolved | ✅ Done | Deleted duplicate at root, kept `components/blog/Pagination.astro` |
| Data files moved from `src/lib/` | ✅ Done | `aws-system-design.ts`, `system-architecture.ts`, `labs.ts` moved to `src/data/` |
| `projectsData.json` moved to `src/data/` | ✅ Done | Moved to `src/data/projectsData.json`, imports updated to `@/data/projectsData.json` |
| `shell.css` extracted from `global.css` | ✅ Done | ~900 lines of shell CSS extracted to `src/styles/shell.css` |
| SQL lab CSS extracted to `lab-sql.css` | ✅ Done | Extracted to `src/styles/lab-sql.css` scoped under `.sql-lab` |
| Root screenshot PNGs deleted | ✅ Done | Cleaned all root debug screenshots |
| `faq/` deleted | ✅ Done | Cleaned leftover docs |
| `public/system-design.html` deleted | ✅ Done | Deleted dev prototype |
| Unused `public/static/images/` deleted | ❌ Not done | canada/, ocean.jpeg, google.png, etc. |
| `.gitignore` gaps added | ✅ Done | Added patterns for screenshots, scratch/, etc. |
| DTS iframe pages migrated to TS renderer | 🔄 In progress | `request-lifecycle` verified (Playwright Stage 1+2 passed, 3 rendering fixes applied); `aws-cloud`, `microservices`, `ArchitectureChapterPicker` pending |

**When doing a migration task:** pick one row, complete it fully (move files + update
all imports + verify build passes), then mark it done. Do not do partial migrations.

---

## 26. `.gitignore` Gaps to Fix

The current `.gitignore` is missing entries for dev artifacts that accumulate at root.
Add these if not already present:

```gitignore
# Dev audit screenshots
*-audit.png
*-dark.png
*-light.png
spec-*.png
test-*.png
system-design-en.png
pills-screenshot.png

# Dev reference files
real-ref-*
ref-real-*

# Scratch / temp output
scratch/
test/
```

---

## 27. Development Commands

```bash
npm run dev          # start dev server at localhost:4321
npm run build        # full production build (see below)
npm run preview      # preview the built output locally
npm run sync:notion  # pull now.json + timeline.json from Notion
npm run check:db     # verify Prisma DB connection
```

### `npm run build` does more than `astro build`

The build command runs these steps in order:

```
prisma generate              ← regenerate Prisma client types
build-stats.mjs              ← write src/build-stats.json
build-og.mjs                 ← generate public/og/*.png for each post
build-books.mjs              ← pull books data, write src/data/books.json
sync-notion.mjs              ← pull now + timeline from Notion
astro build                  ← compile the actual site
```

**Do not run `astro build` directly** — you will ship stale OG images, missing
book data, and outdated stats. Always use `npm run build`.

**On Vercel**, the build command is `npm run build`. The Notion and Prisma env vars
must be set in the Vercel dashboard for the sync steps to succeed.

---

## 28. iframe Usage Rules

### Default: do not use iframes for new features

If you own the content, write it as an Astro component or vanilla TS script.
iframes add complexity (theme sync, postMessage, CSP headers, mobile scroll issues)
that is only justified when you have no alternative.

### When an iframe is acceptable

| Case | Allowed? | Why |
|---|---|---|
| Third-party widget (Giscus comments, YouTube embed) | ✅ Yes | No other way to embed |
| Pre-built external bundle with its own CSS/JS ecosystem (current DTS) | ⚠️ Being phased out | DTS is being migrated to pure TS renderer — do not add new iframe embeds |
| New animation or simulation you are writing yourself | ❌ No | Write as `.astro` + `<canvas>` / SVG / vanilla TS |
| A page section you want to isolate from the main layout | ❌ No | Use Astro slots or a scoped component instead |

### The existing DTS iframe — being migrated away

`/dts/index.html` is a Vite app built separately from Astro. It was embedded in:
- `src/pages/lab/aws-cloud.astro`
- `src/pages/lab/microservices.astro`
- `src/pages/lab/request-lifecycle.astro`
- `src/components/lab/ArchitectureChapterPicker.astro`

These pages are actively being migrated to the pure TS rendering stack (see **Section 29**).
Do not add new iframe embeds pointing to `/dts/index.html`.

### If you need to add a new DTS lesson

Add the lesson data to `src/lib/dts/lessons.ts` using the factory functions from
`src/lib/dts/scene-builders.ts`. Wire it into `LabWorkbench` via
`src/layouts/ArchitectureLabLayout.astro`. Do **not** rebuild the bundle or add a
new iframe — that is the old approach being replaced.

---

## 29. DTS Isometric Rendering — Rules

### End goal: eliminate `public/dts/` entirely

The long-term goal is to **remove `public/dts/` from the project** — every lab page
that currently uses an iframe pointing to the bundle will be replaced by the TS
rendering stack. When all pages are migrated and verified, `public/dts/` can be
deleted.

The migration is complete only when:
1. Every DTS lab page renders via `LabWorkbench` + `DtsSceneRenderer` (no iframes)
2. Each migrated page passes the full Playwright comparison against the bundle page
3. `public/dts/` is no longer referenced anywhere in `src/`

Until a page is migrated and verified, the bundle stays in place as the reference.

### The bundle is a reference, not a dependency

`public/dts/` is a pre-built Vite bundle for the original DTS (Designed-to-Scale)
interactive app. It is kept **only as a visual reference during migration**. It must
never be imported, injected into, or depended on by any TypeScript/Astro code.

> **Rule**: Any lab page or component that renders isometric 3D diagrams must use
> the pure TypeScript rendering stack described below — never the iframe/bundle.

The bundle files in `public/dts/assets/*.js` are the **reference implementation**.
When a visual needs to look a certain way, compare against the bundle by running
the dev server and opening `/dts/index.html` directly. The goal is **1:1 visual
parity** — the TS page must be indistinguishable from the bundle page so that
`public/dts/` can eventually be deleted.

### The TS isometric rendering stack

All isometric lab diagrams are built with this fixed stack:

```
src/lib/dts/runtime-draw.ts   ← entity renderers (Zr=block, li=device, fi=db, …)
                                 color palette, gradient defs, iso projection math
                                 ⚠ edit only to fix a rendering gap vs the bundle —
                                   never to add new abstractions or change behavior

src/lib/dts/scene-builders.ts ← entity factories: makeBlock, makeDevice, makeDb,
                                 makeUser, makeDns, makeWebServer, makeDatabase, …

src/lib/dts/lessons.ts        ← lesson + step + scene data for all 13 arch labs

src/lib/dts/scene-renderer.ts ← renderScene(scene) → { inner: string, viewBox: string }
                                 calls ENTITY_RENDERERS[type](entity) for each entity,
                                 trims link paths against entity polys, computes viewBox

src/components/widget/DtsSceneRenderer.tsx
                              ← React island that calls renderScene() per step,
                                 listens for 'wb:step-change' on .wb-root,
                                 renders <svg dangerouslySetInnerHTML={inner} />
```

### How to add a new isometric lab scene

1. Define lesson data in `src/lib/dts/lessons.ts` using the factory functions
   from `scene-builders.ts` (`makeBlock`, `makeDevice`, `makeDb`, `makeLink`, …).
2. Each step has a `scene: { entities: {}, links: {} }` object.
3. Wire the lesson into `LabWorkbench` + `DtsSceneRenderer` via
   `src/layouts/ArchitectureLabLayout.astro` (add to `LESSON_MAP`).
4. Verify visual output matches bundle by running dev server and comparing side-by-side.

### Entity types and their defaults

| Type | Renderer | Key fields |
|---|---|---|
| `block` | `Zr` | `x, y, s=4, h=46, color, glyph, label[]` |
| `device` | `li` | `x, y, w=6, d=6, label, tags[]` |
| `db` | `fi` | `x, y, r=1.7, h=38, label` |
| `zone` | `mi` | `x0, x1, y0, y1, label` |
| `queue` | `gi` | `x, y, n, dir` |

Color names: `blue`, `orange`, `green`, `yellow`, `purple`, `slab`, `store`.

### What is strictly forbidden

| ❌ Don't | ✅ Do instead |
|---|---|
| Import from `public/dts/*.js` | Import from `src/lib/dts/*.ts` |
| Modify `public/dts/assets/*.js` | Edit `src/lib/dts/runtime-draw.ts` source |
| Embed `/dts/index.html` in a new iframe | Use `DtsSceneRenderer` + `LabWorkbench` |
| Write a new hand-rolled polygon renderer | Use `ENTITY_RENDERERS` from `runtime-draw.ts` |
| Add lesson data as inline JSX in a component | Add to `src/lib/dts/lessons.ts` |
| Declare 1:1 parity without a Playwright screenshot comparison | Always run the compare script and check the output |
| Compare only the diagram/canvas area | Compare the **full page** — layout, header, controls, fonts, spacing, everything |
| Accept any visual difference between bundle page and TS page | Zero tolerance — if it looks different anywhere, it is not done |

### Visual verification with Playwright — mandatory before declaring parity

**The goal**: after migration, the page (e.g. `/lab/request-lifecycle`) must look and
behave **exactly the same** as it did before migration when it used the bundle iframe.
A user visiting the page must not notice any difference — same layout, same diagram,
same controls, same fonts, same spacing, same animations at every step.

The comparison is **the same URL, before vs after** — not bundle URL vs TS URL.

**This is a full page comparison. No exceptions. Everything must be identical:**

| What | Must match |
|---|---|
| **Khung / layout** | Page structure, panel proportions, sidebar vs canvas split, padding |
| **Bố cục** | Position of every element — step counter, buttons, title, description |
| **Màu sắc** | Background, text, buttons, borders, diagram color palette |
| **Typography** | Font family, size, weight, line height for all visible text |
| **Controls** | Button shape, size, active/disabled state, hover effect |
| **Diagram** | Entity shapes, gradients, link arrows, label pills at every step |
| **Animation** | Step transitions, timing, easing — identical behavior |

If **any** of the above is different after migration, the migration is not complete.

#### How to run the comparison

**Step 1 — Take reference screenshots before migrating** (while the page still uses the bundle):

```ts
// save-reference.mjs — run BEFORE making any code changes
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto('http://localhost:4321/lab/request-lifecycle');
await page.waitForTimeout(3000);

// Screenshot every step
const stepCount = await page.locator('.wb-step-btn, [data-step]').count(); // adapt selector
for (let i = 0; i < Math.max(stepCount, 5); i++) {
  await page.locator('.wb-root').evaluate((el, idx) => {
    el.dispatchEvent(new CustomEvent('wb:navigate', { detail: { index: idx } }));
  }, i);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `ref-step-${i}.png` });
}
await browser.close();
```

**Step 2 — Perform the migration** (replace iframe with TS renderer).

**Step 3 — Take the same screenshots after migrating and compare:**

```ts
// compare-after.mjs — run AFTER migration
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto('http://localhost:4321/lab/request-lifecycle');
await page.waitForTimeout(3000);

for (let i = 0; i < 5; i++) {
  await page.locator('.wb-root').evaluate((el, idx) => {
    el.dispatchEvent(new CustomEvent('wb:navigate', { detail: { index: idx } }));
  }, i);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `after-step-${i}.png` });
}
await browser.close();
// Open ref-step-N.png and after-step-N.png side by side — must be identical
```

#### Failure criteria — do not declare done if any of these are true

- Any screenshot after migration differs from the reference (any element, any area)
- Step navigation behaves differently (timing, visual feedback, scene update)
- Any animation present before is missing after
- Any UI element is absent, repositioned, or restyled
- Diagram shows plain rectangles instead of isometric shapes
- Gradients, shadows, or filters are missing
- Link arrows missing or wrong direction
- Entity labels missing or wrong font
- All steps look identical (scene not updating on navigation)

### Stage 2 — Animation testing (frame-by-frame)

Static screenshots only verify frozen end-states. Every step transition has animation
frames — entry, mid-transition, exit — and **each one must match the reference** too.
Every small detail counts: how an entity fades in, how a link draws itself, how the
step counter updates, button press feedback.

#### What to capture for each step transition

For every transition from step N → step N+1, capture **three moments**:

| Frame | When | What to look for |
|---|---|---|
| **Start frame** | Immediately after triggering navigation (t=0) | Old scene still visible, transition begins |
| **Mid frame** | Halfway through transition (t = duration/2) | Partial fade, partial draw, mid-easing state |
| **End frame** | After transition completes | New scene fully rendered, all elements settled |

All three frames must match the reference (taken from the bundle version of the same page).

#### How to capture animation frames with Playwright

```ts
// animation-compare.mjs — run before AND after migration, compare both sets
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto('http://localhost:4321/lab/request-lifecycle');
await page.waitForTimeout(3000);

// Install fake clock so we can freeze time at any frame
await page.clock.install();

for (let i = 0; i < totalSteps - 1; i++) {
  // Freeze time, trigger transition
  await page.clock.pauseAt(Date.now());
  await page.locator('.wb-root').evaluate((el, idx) => {
    el.dispatchEvent(new CustomEvent('wb:navigate', { detail: { index: idx } }));
  }, i + 1);

  // Start frame (t=0)
  await page.screenshot({ path: `anim-${i}-start.png` });

  // Mid frame — advance clock to halfway point of the CSS transition duration
  await page.clock.tick(150); // adjust to actual transition duration / 2
  await page.screenshot({ path: `anim-${i}-mid.png` });

  // End frame — advance past the full transition
  await page.clock.tick(300); // adjust to actual transition duration
  await page.screenshot({ path: `anim-${i}-end.png` });

  await page.clock.resume();
  await page.waitForTimeout(100);
}

await browser.close();
```

Run this script **before** migration (reference) and **after** migration (actual).
Every `anim-N-start/mid/end.png` pair must be pixel-identical.

#### What counts as an animation detail

- **Entity entry**: new entity fades/slides in — capture mid-fade opacity, position
- **Entity exit**: removed entity fades/slides out — capture mid-fade
- **Link drawing**: link path animates from start to end point — capture mid-draw
- **Step counter**: number ticks up — capture the moment of change
- **Button active state**: button press feedback — capture pressed state
- **Progress indicator**: advances to new position — capture mid-advance
- **viewBox change**: canvas reframes to fit new entities — capture mid-reframe

#### SVG content assertion — verify structure, not just visuals

Screenshots catch visual differences. Also assert the SVG DOM structure matches:

```ts
// After navigating to step N, assert expected entities are present
const labels = await page.locator('.wb-canvas-area svg text').allTextContents();
// Compare against expected labels for this step — must match reference exactly
```

#### Animation failure criteria

| Symptom | Diagnosis |
|---|---|
| All step screenshots identical | `wb:navigate` not reaching `.wb-root`; renderer not listening |
| Mid-frame is same as end-frame | CSS transition missing or duration is 0 |
| Start frame already shows new scene | Transition fires but snapshot taken too late |
| Entity appears but no entry animation | Fade/slide keyframe missing from CSS |
| Link appears instantly, no draw animation | SVG `stroke-dashoffset` animation missing |
| Step counter doesn't update | Event handler not wired to counter element |
| Reference and actual mid-frames differ | Easing, duration, or keyframe values don't match bundle |

#### Additional testing requirements

**1. Same viewport for reference and actual**
Both sets of screenshots must use the same viewport size. A different width causes
layout reflow — every pixel will differ even when the code is correct. Pin the
viewport explicitly in the script and never change it between runs:
```ts
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
```

**2. Fonts must finish loading before screenshot**
If fonts haven't loaded, text renders in a fallback font and screenshots will differ.
Wait for network idle before taking any screenshot:
```ts
await page.waitForLoadState('networkidle');
```

**3. Pin the theme before shooting**
If reference is taken in dark mode and actual in light mode, every color will differ.
Force a specific theme before taking screenshots:
```ts
await page.evaluate(() => document.documentElement.classList.add('dark')); // or remove
```

**4. React island must hydrate before triggering events**
`DtsSceneRenderer` is a React island — if `wb:navigate` fires before it has mounted,
the scene will not update. Wait for the canvas element to be present and non-empty:
```ts
await page.waitForSelector('.wb-canvas-area svg path', { state: 'attached' });
```

**5. Force `prefers-reduced-motion: no-preference`**
If the OS has reduced motion enabled, CSS animations are disabled — mid-frames will
look identical to end-frames and animation gaps will go undetected. Override it:
```ts
await page.emulateMedia({ reducedMotion: 'no-preference' });
```

**6. Read actual transition duration before hardcoding `clock.tick()`**
The script skeleton uses `150ms` / `300ms` as placeholders. Before running the test,
read the real CSS `transition-duration` from the element:
```ts
const duration = await page.locator('.wb-canvas-area').evaluate(el =>
  parseFloat(getComputedStyle(el).transitionDuration) * 1000
);
// then use: clock.tick(duration / 2) for mid-frame, clock.tick(duration) for end-frame
```

**7. Scroll position**
Lab content may be below the fold. Scroll to the content area before taking any
screenshot. If reference and actual capture different scroll positions, every pixel
will differ even when the code is correct.

**8. Check console errors**
A silent JS error can cause partial SVG rendering that looks "almost right" visually.
Always listen for errors during the test — if any fire, fail immediately:

```ts
page.on('pageerror', err => { throw new Error(`JS error: ${err.message}`); });
page.on('console', msg => { if (msg.type() === 'error') console.error(msg.text()); });
```

**9. Step 0 also has an entry animation**
Every step — including step 0 on initial page load — has an entry animation when its
entities appear. Do not skip step 0 in animation testing. Capture start/mid/end frames
for step 0 just like every other step.

**10. Race condition between transitions**
Triggering `wb:navigate` while a previous transition is still running produces an
undefined mid-state. Always wait for the current transition to fully complete (or use
`page.clock` to control time) before triggering the next navigation.

**11. SVG `<defs>` ids must match**
`buildDefs()` generates gradient and filter elements with specific ids (e.g.
`url(#grad-blue-top)`). If a renderer references a different id, the browser silently
skips the gradient — the shape still renders but without fill. This looks "almost
correct" in a screenshot. Verify gradient ids in `buildDefs()` match exactly what each
renderer function references in its `fill="url(#...)"` attributes.

**12. Hover/focus states must be tested separately**
Static screenshots never capture hover effects. If the bundle page has hover animations
on buttons or entities, test them explicitly using `page.hover()` before shooting:
```ts
await page.hover('.wb-nav-btn'); // hover the Next button
await page.screenshot({ path: 'hover-next-btn.png' });
// compare against reference hover screenshot taken from bundle version
```
Test every interactive element that has a visible hover or focus state.

**14. Pin Device Pixel Ratio (DPR)**
If reference screenshots are taken at DPR=1 and actual at DPR=2 (retina display), every
pixel will differ even when the code is correct. Always pin `deviceScaleFactor`
explicitly — both reference and actual runs must use the same value:
```ts
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1, // always pin — never leave as default
});
```

**15. JS-driven animation (`requestAnimationFrame`) vs CSS transition**
`page.clock.tick()` controls `setTimeout`, `setInterval`, and CSS transitions. It does
**not** freeze `requestAnimationFrame` (rAF) — if the bundle drives any animation via
rAF directly, `tick()` will not capture a deterministic mid-frame.

Check whether DTS uses rAF. If it does, use `page.clock.runFor()` instead of `tick()`
so rAF callbacks are executed in sync with the clock:
```ts
// for rAF-driven animations:
await page.clock.runFor(150); // mid-frame
await page.screenshot({ path: 'mid.png' });
await page.clock.runFor(150); // end-frame
await page.screenshot({ path: 'end.png' });
```

**13. `buildIconCanvas` icon assets must finish loading**
`runtime-draw.ts` uses `buildIconCanvas` to render icons inside laptop/device entities.
If the icon has not loaded when the screenshot is taken, the entity renders without its
icon — shape is correct but icon is blank. `waitForLoadState('networkidle')` usually
covers this, but if icons are loaded from an external URL, add an explicit wait:
```ts
await page.waitForFunction(() =>
  document.querySelectorAll('.wb-canvas-area svg image').length === 0 ||
  [...document.querySelectorAll('.wb-canvas-area svg image')].every(img => img.complete)
);
```

### When comparison fails — re-mapping process

If the Playwright screenshots show the TS renderer does **not** match the bundle,
do **not** guess or patch. Follow this process:

#### Step 1 — Isolate the diff

Identify exactly what is wrong by comparing the two screenshots pixel-by-pixel:

- Which entity type is wrong? (block vs device vs db vs zone vs queue)
- Is it shape, color, gradient, label, or position?
- Does it affect all steps or only specific ones?
- Is it a missing SVG element, or the wrong one rendered?

#### Note: CSS is not part of the comparison

Entity rendering in DTS is **pure SVG with inline attributes** — fill, stroke,
gradients, and filters are all SVG `<defs>` and element attributes. The bundle's
`dts-theme.css` only styles the page shell, not the entities themselves.

The only CSS that can affect SVG visual output is:
- `font-family` on label text (SVG uses `font-family="inherit"` — make sure the
  lab page loads the same font as the bundle page)
- Background color of the canvas area (set as inline style on the React container,
  not CSS — currently `#fffaf2`)

**Conclusion**: comparing against `/dts/index.html` screenshots is the definitive
reference. If the screenshots match visually, CSS is correct by implication.
Only audit CSS separately if a discrepancy appears that the SVG markup alone
cannot explain (e.g. font renders differently, canvas background is wrong color).

#### Step 2 — Read the bundle source for that entity

Open the corresponding renderer in `src/lib/dts/runtime-draw.ts` and trace the
function responsible for the mismatching entity:

| Entity | Renderer function | Key variables |
|---|---|---|
| `block` | `Zr(e)` | `color → vr[color]`, face polygons, gradient ids |
| `device` (laptop) | `li(e)` | screen polygon, keyboard polygon, `a()` icon canvas |
| `db` (cylinder) | `fi(e)` | top ellipse, body rect, gradient |
| `zone` | `mi(e)` | dashed outline rect |
| `queue` | `gi(e)` | repeated slot shapes |

Compare what the function actually produces against what shows in the bundle
screenshot. If they differ, the extraction in `runtime-draw.ts` is incomplete —
something was lost during the bundle-to-TS conversion.

#### Step 3 — Cross-check the bundle output directly

Run the dev server and open `/dts/index.html` directly in a browser. Use DevTools
to inspect the rendered SVG:

```
DevTools → Inspector → select the entity → copy outerHTML
```

Compare the copied SVG markup against what `Zr()`/`li()`/`fi()` produces by
calling the renderer in isolation:

```ts
// Quick debug in browser console on the TS lab page
import { ENTITY_RENDERERS, ENTITY_DEFAULTS } from '/src/lib/dts/runtime-draw.ts';
const ent = { ...ENTITY_DEFAULTS.block, x: 0, y: 0, color: 'blue', label: ['Test'] };
console.log(ENTITY_RENDERERS.block(ent));
```

#### Step 4 — Fix the gap, do not patch around it

If a renderer function in `runtime-draw.ts` is missing or incorrect:
- Fix it directly in `runtime-draw.ts` — do not add compensating logic in `scene-renderer.ts`
- If a gradient or filter id is wrong, fix `buildDefs()` in `runtime-draw.ts`
- If an import is missing (e.g. `buildIconCanvas`), add it at the top of `runtime-draw.ts`
- Do not duplicate rendering logic outside of `runtime-draw.ts`

If `scene-renderer.ts` is calling the renderer incorrectly (wrong entity field
names, wrong normalization):
- Fix `normalize()` in `scene-renderer.ts` to match the bundle's `np()` function
- Fix `resolveIsoPoint()` if link pts are resolving to wrong screen coords

#### Step 5 — Re-run Playwright and confirm

After every fix, re-run the Playwright comparison. Only declare the issue resolved
when the screenshot diff is visually identical. If a new diff appears after fixing
one thing, repeat from Step 1 for the new discrepancy.

**Rule: never stop at "close enough".** The bundle is the ground truth.
If the TS renderer is 90% right, the remaining 10% is still a bug.

---

## 30. What Not to Do

| ❌ Don't | ✅ Do instead |
|---|---|
| Add lab-specific CSS to `global.css` | Create `src/styles/lab-<name>.css`, scope under a root class |
| Hardcode color hex values in components | Use `var(--bg)`, `var(--fg)`, `var(--accent)`, etc. |
| Use `dark:text-gray-300` Tailwind dark prefix when a CSS token exists | Use `text-(--fg-dim)` |
| Use `.jsx` or `.js` for any component | Always `.astro` or `.tsx` |
| Use `any` without a comment | Type everything; explain when truly impossible |
| Import `src/lib/runtime/*` from client components | Import runtime code only in API routes and `.astro` frontmatter |
| Write long `<script>` blocks inline in `.astro` | Extract to `src/scripts/` |
| Create new files at the project root | Put app code in `src/`, content in `data/` |
| Define a CSS token in only one theme block | Always define in both `:root` and the dark block |
| Use relative imports more than one level up | Always use `@/` alias |
