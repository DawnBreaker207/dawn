import { useEffect, useRef, useState } from 'react';

interface Day {
  date: string;
  count: number;
  level: number;
}

interface DayDetail {
  ok: boolean;
  date: string;
  contributions: number | null;
  commits: number | null;
  additions: number | null;
  deletions: number | null;
  issues: number | null;
  pullRequests: number | null;
  error?: string;
}

interface Props {
  total?: number;
  cols?: number;
  simple?: boolean;
  grass?: boolean;
}

const GREEN = ['var(--bg-alt)', '#bbf7d0', '#86efac', '#4ade80', '#16a34a'];
const GREEN_BORDER = [
  'var(--border)',
  'rgba(187,247,208,0.6)',
  'rgba(134,239,172,0.6)',
  'rgba(74,222,128,0.6)',
  'rgba(22,163,74,0.6)',
];

const stat = (v: number | null | undefined) =>
  v == null ? '—' : Number(v).toLocaleString();

function fmtDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

function SkeletonRow({ width }: { width: string }) {
  return (
    <span
      className={`inline-block h-2 animate-pulse rounded-full bg-(--border) align-middle ${width}`}
    />
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-(--border) pt-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-(--fg-dim)">
        {label}
      </span>
      <strong className="font-mono text-[12px]">{children}</strong>
    </div>
  );
}

export default function CommitGraph({ total = 28, cols = 14, simple = false, grass = false }: Props) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    let alive = true;
    if (fetched.current) return;
    fetched.current = true;
    fetch('/api/github/today')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DayDetail | null) => {
        if (alive && d) setDetail(d);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    fetch('/api/github/contributions')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Day[]) => {
        if (alive) setDays(data);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const abort = new AbortController();
    if (!selected) return;
    setLoading(true);
    fetch(`/api/github/day?date=${encodeURIComponent(selected)}`, {
      signal: abort.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DayDetail | null) => {
        if (alive && d) setDetail(d);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
      abort.abort();
    };
  }, [selected]);

  if (error) {
    return <p className="text-[11px] text-(--fg-faint)">contributions unavailable</p>;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const sorted = [...(days ?? [])]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((d) => d.date <= todayStr);
  const slice = sorted.slice(-total);
  const squares: (Day | null)[] = days
    ? slice
    : Array.from({ length: total }, () => null);
  const activeDate = selected ?? slice.at(-1)?.date ?? null;

  const detailView = detail && detail.date === activeDate ? detail : null;
  const loadingView = loading || (!!activeDate && !detailView);

  return (
    <div className="rounded-2xl border border-(--border) bg-(--bg-alt) p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="m-0 font-mono text-[11px] uppercase tracking-[0.08em] text-(--fg-dim)">
          git grass
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--fg-dim)">
          last {total} days
        </span>
      </div>

      {grass ? (
      <div className="w-full overflow-x-auto py-1 pl-0 pr-1">
        <div
          className="git-grass-grid grid w-max min-w-full gap-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, var(--git-grass-cell))`,
          }}
          aria-label="GitHub contribution heatmap"
        >
        {squares.map((d, i) =>
          d ? (
            simple ? (
              <span
                key={d.date}
                title={`${d.date}: ${d.count} contribution${d.count === 1 ? '' : 's'}`}
                className="aspect-square w-full rounded-[3px] border"
                style={{
                  backgroundColor: GREEN[Math.min(4, d.level)],
                  borderColor: GREEN_BORDER[Math.min(4, d.level)],
                }}
              />
            ) : (
            <button
              key={d.date}
              type="button"
              onClick={() => setSelected((s) => (s === d.date ? null : d.date))}
              aria-pressed={activeDate === d.date}
              title={`${d.date}: ${d.count} contribution${d.count === 1 ? '' : 's'}`}
              className="aspect-square w-full cursor-pointer rounded-[3px] border transition focus:outline-none"
              style={{
                backgroundColor: GREEN[Math.min(4, d.level)],
                borderColor: GREEN_BORDER[Math.min(4, d.level)],
                ...(activeDate === d.date
                  ? { boxShadow: '0 0 0 2px var(--accent)' }
                  : {}),
              }}
            />
            )
          ) : (
            <span
              key={`skel-${i}`}
              className="aspect-square w-full animate-pulse rounded-[3px] border border-(--border) bg-(--bg)"
            />
          )
        )}
        </div>
      </div>
      ) : (
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
        aria-label="GitHub contribution heatmap"
      >
        {squares.map((d, i) =>
          d ? (
            simple ? (
              <span
                key={d.date}
                title={`${d.date}: ${d.count} contribution${d.count === 1 ? '' : 's'}`}
                className="aspect-square w-full rounded-[3px] border"
                style={{
                  backgroundColor: GREEN[Math.min(4, d.level)],
                  borderColor: GREEN_BORDER[Math.min(4, d.level)],
                }}
              />
            ) : (
            <button
              key={d.date}
              type="button"
              onClick={() => setSelected((s) => (s === d.date ? null : d.date))}
              aria-pressed={activeDate === d.date}
              title={`${d.date}: ${d.count} contribution${d.count === 1 ? '' : 's'}`}
              className="aspect-square w-full cursor-pointer rounded-[3px] border transition focus:outline-none"
              style={{
                backgroundColor: GREEN[Math.min(4, d.level)],
                borderColor: GREEN_BORDER[Math.min(4, d.level)],
                ...(activeDate === d.date
                  ? { boxShadow: '0 0 0 2px var(--accent)' }
                  : {}),
              }}
            />
            )
          ) : (
            <span
              key={`skel-${i}`}
              className="aspect-square w-full animate-pulse rounded-[3px] border border-(--border) bg-(--bg)"
            />
          )
        )}
      </div>
      )}

      {!simple && (
      <div className="mt-3 border-t border-(--border) pt-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="m-0 font-mono text-[11px] uppercase tracking-[0.08em] text-(--fg-dim)">
            {activeDate ? `github · ${fmtDate(activeDate)}` : 'github today'}
          </h3>
          {selected && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.08em] text-(--fg-dim) hover:text-(--accent)"
            >
              clear
            </button>
          )}
        </div>

        {loadingView ? (
          <>
            <Row label="contribs">
              <SkeletonRow width="w-8" />
            </Row>
            <Row label="LOCs">
              <SkeletonRow width="w-12" />
            </Row>
            <Row label="commits / prs / issues">
              <SkeletonRow width="w-16" />
            </Row>
          </>
        ) : detailView && detailView.ok ? (
          <>
            <Row label="contribs">
              <span className="text-(--fg)!">{stat(detailView.contributions)}</span>
            </Row>
            <Row label="LOCs">
              <span className="text-green-600">
                +{stat(detailView.additions)}
              </span>
              <span className="mx-0.5">/</span>
              <span className="text-red-600">-{stat(detailView.deletions)}</span>
            </Row>
            <Row label="commits / prs / issues">
              <span className="text-(--fg)!">
                {stat(detailView.commits)} / {stat(detailView.pullRequests)} /{' '}
                {stat(detailView.issues)}
              </span>
            </Row>
          </>
        ) : (
          <Row label="status">
            <span className="text-(--fg-dim)">{detailView?.error ?? 'day details unavailable'}</span>
          </Row>
        )}
      </div>
      )}
    </div>
  );
}