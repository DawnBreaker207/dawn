import { useEffect, useState } from 'react';

// shortcut: title/tag/intro duplicated from lab/index.astro markup —
// lift both into a shared src/lib/labs.ts when the lab list changes.
// Terminal is excluded (it's an inline overlay, not a standalone page).
const LABS: { href: string; title: string; tag: string; intro: string; tone?: 'amber' | 'cyan' }[] = [
  {
    href: '/lab/sql-plan',
    title: 'SQL EXPLAIN Explorer',
    tag: 'Postgres Engine',
    tone: 'cyan',
    intro: 'Seq Scan vs B-Tree, Hash Joins, and fixing Hibernate N+1 queries.',
  },
  {
    href: '/lab/java',
    title: 'Java & Spring Lab',
    tag: 'Concepts',
    tone: 'amber',
    intro: 'One page, one tab per concept — pools, virtual threads, proxy chains and container lifecycle.',
  },
  {
    href: '/lab/pathfinding',
    title: 'Pathfinding',
    tag: 'Interactive',
    intro: 'A*, Dijkstra & BFS visualized on a drawable maze.',
  },
  {
    href: '/lab/spider',
    title: 'Spider',
    tag: 'Playable',
    intro: 'Two spiders follow your cursor. Move to draw.',
  },
];

// A random lab each visit: rolls on mount and again on every
// astro:page-load (the rail survives view transitions via transition:persist).
export default function LabRail() {
  const [pick, setPick] = useState<number | null>(null);

  useEffect(() => {
    const roll = () => setPick(Math.floor(Math.random() * LABS.length));
    roll();
    document.addEventListener('astro:page-load', roll);
    return () => document.removeEventListener('astro:page-load', roll);
  }, []);

  const lab = pick === null ? null : LABS[pick % LABS.length];

  return (
    <div className="px-3 py-2">
      <div className="rounded-xl border border-(--border) bg-(--bg) p-3.5">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="m-0 font-mono text-[11px] tracking-[0.08em] text-(--fg-faint) uppercase">lab</h3>
          {lab ? (
            <span className="font-mono text-[10px] text-(--fg-faint)">random</span>
          ) : (
            <span className="inline-block h-3 w-10 animate-pulse rounded-full bg-(--border)" />
          )}
        </div>

        {lab ? (
          <a href={lab.href} className="group block no-underline">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold tracking-[-0.01em] text-(--fg) transition-colors group-hover:text-(--accent)">
                {lab.title}
              </span>
              <span
                className={
                  'rounded-sm border px-1.5 py-0.5 font-mono text-[10px] ' +
                  (lab.tone === 'amber'
                    ? 'border-amber-500 text-amber-500'
                    : lab.tone === 'cyan'
                      ? 'border-cyan-500 text-cyan-500'
                      : 'border-(--accent) text-(--accent)')
                }
              >
                {lab.tag}
              </span>
            </div>
            <p className="m-0 mt-1.5 text-[11px] leading-snug text-(--fg-dim)">{lab.intro}</p>
            <span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-(--fg-faint) transition-colors group-hover:text-(--accent)">
              open {lab.href.replace('/lab/', '')}
              <span aria-hidden="true">↗</span>
            </span>
          </a>
        ) : (
          <div className="space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-(--border)" />
            <div className="h-3 w-full animate-pulse rounded-full bg-(--border)" />
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-(--border)" />
          </div>
        )}
      </div>
    </div>
  );
}
