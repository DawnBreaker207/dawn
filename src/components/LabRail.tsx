import { useState, useEffect } from 'react';
import { LABS } from '@/lib/labs';

let persistedPick: number | null = null;

// A stable lab pick per session (does not re-roll on every page navigation to prevent flicker)
export default function LabRail() {
  const [pick, setPick] = useState<number>(0);

  useEffect(() => {
    if (persistedPick === null) {
      persistedPick = Math.floor(Math.random() * LABS.length);
    }
    setPick(persistedPick);
  }, []);

  const lab = LABS[pick % LABS.length];

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
              <span className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] ${lab.tagClass}`}>
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
