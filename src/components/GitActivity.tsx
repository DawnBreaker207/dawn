import { useEffect, useMemo, useState } from 'react';
import CommitGraph from '@/components/CommitGraph';

type Granularity = 'day' | 'week' | 'month';

interface Day {
  date: string;
  count: number;
  level: number;
}

const RANGES: {
  label: string;
  window: number;
  gran: Granularity;
  footer: string;
}[] = [
  { label: '1 day', window: 30, gran: 'day', footer: 'last 30 days' },
  { label: '1 week', window: 119, gran: 'day', footer: 'last 119 days' },
  { label: '1 month', window: 182, gran: 'week', footer: 'last 26 weeks' },
  { label: '6 months', window: 365, gran: 'week', footer: 'last 52 weeks' },
  { label: '1 year', window: 365, gran: 'month', footer: 'last 12 months' },
];

const grassCols = (i: number, window: number) =>
  i === 0 ? Math.ceil(window / 2) : Math.ceil(window / 7);

const GRASS_TRACK = 'minmax(0, calc((100% - 208px) / 53))';

function fmt(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

function periodStart(date: string, gran: Granularity): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (gran === 'week') dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
  else if (gran === 'month') dt.setUTCDate(1);
  return dt.toISOString().slice(0, 10);
}

function monthLabel(date: string): string {
  const [y, m] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
    new Date(Date.UTC(y, m - 1, 1))
  );
}

function ChartBars({ days, gran, footer, window }: { days: Day[] | null; gran: Granularity; footer: string; window: number }) {
  const [hover, setHover] = useState<{ x: number; label: string; count: number } | null>(null);

  const bars = useMemo(() => {
    if (!days) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    const recent = [...days]
      .filter((d) => d.date <= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-window);
    const totalByPeriod = new Map<string, number>();
    const labels = new Map<string, string>();
    for (const d of recent) {
      const key = periodStart(d.date, gran);
      totalByPeriod.set(key, (totalByPeriod.get(key) ?? 0) + d.count);
      if (!labels.has(key)) labels.set(key, gran === 'month' ? monthLabel(key) : fmt(key));
    }
    return [...totalByPeriod.entries()].map(([key, count]) => ({ label: labels.get(key)!, count }));
  }, [days, gran, window]);

  const max = Math.max(1, ...(bars ?? []).map((b) => b.count));
  const total = (bars ?? []).reduce((s, b) => s + b.count, 0);

  if (!bars) {
    return (
      <div className="flex h-32 items-center justify-center">
        <span className="h-2 w-24 animate-pulse rounded-full bg-(--border)" />
      </div>
    );
  }

  return (
    <>
      {bars.length ? (
        <>
          <div className="relative">
            <div className="flex h-32 items-end gap-px" aria-label="contribution chart">
              {bars.map((b) => (
                <div
                  key={b.label}
                  role="img"
                  aria-label={`${b.label}: ${b.count} contribution${b.count === 1 ? '' : 's'}`}
                  className="min-w-px flex-1 cursor-pointer rounded-t-[2px] bg-(--accent) transition-opacity"
                  style={{
                    height: `${Math.max(3, (b.count / max) * 100)}%`,
                    opacity: hover?.label === b.label ? 1 : 0.35 + (b.count / max) * 0.65,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    const half = el.offsetLeft + el.offsetWidth / 2;
                    const limit = (el.parentElement?.clientWidth ?? 48) - 48;
                    setHover({ x: Math.max(48, Math.min(half, limit)), label: b.label, count: b.count });
                  }}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </div>
            {hover && (
              <div
                className="chart-tip pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-(--border) bg-(--bg) px-2 py-1 font-mono text-[10px] text-(--fg) shadow-sm"
                style={{ left: hover.x }}
              >
                {hover.label} · <strong className="text-(--accent)">{hover.count}</strong> contribution{hover.count === 1 ? '' : 's'}
              </div>
            )}
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-dashed border-(--border) pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-(--fg-dim)">
              per {gran} · {footer}
            </span>
            <strong className="font-mono text-[12px]">{total.toLocaleString()} contributions</strong>
          </div>
        </>
      ) : (
        <p className="text-[11px] text-(--fg-faint)">contributions unavailable</p>
      )}
    </>
  );
}

export default function GitActivity() {
  const [days, setDays] = useState<Day[] | null>(null);
  const [range, setRange] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch('/api/github/contributions')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Day[]) => {
        if (alive) setDays(d);
      })
      .catch(() => {
        if (alive) setDays([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const active = RANGES[range];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-(--border) bg-(--bg-alt) p-3.5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="m-0 font-mono text-[11px] uppercase tracking-[0.08em] text-(--fg-dim)">
            contributions
          </h3>
          <div className="flex items-center gap-0.5 rounded-lg border border-(--border) p-0.5">
            {RANGES.map((r, i) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRange(i)}
                aria-pressed={range === i}
                className={`cursor-pointer rounded-md px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] transition-colors ${
                  range === i ? 'bg-(--accent) text-(--bg)' : 'text-(--fg-dim) hover:text-(--fg)'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <ChartBars days={days} gran={active.gran} footer={active.footer} window={active.window} />
      </div>

      <CommitGraph total={active.window} cols={grassCols(range, active.window)} track={GRASS_TRACK} />
    </div>
  );
}