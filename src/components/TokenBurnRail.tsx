import { useEffect, useState } from 'react';
import type { TokenBurnPayload } from '@/types/token-burn';
import {
  formatApproxUsd,
  formatTokens,
  modelBrandIcon,
  shortModelName,
} from '@/lib/runtime/llm-format';

// Rail card, house voice: a 14-day sparkline + ledger rows. Distinct from the
// reference repo's token-burn card on purpose (no link-box, no dashed rows).

function Sparkline({ series }: { series: { tokens: number }[] }) {
  const width = 100;
  const height = 26;
  const max = Math.max(1, ...series.map((d) => d.tokens));
  const points = series.map((d, i) => {
    const x = series.length > 1 ? (i / (series.length - 1)) * width : width / 2;
    const y = height - (d.tokens / max) * (height - 3) - 1.5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${points.join(' L')}`;
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-8 w-full"
      aria-hidden="true"
    >
      <path d={area} fill="var(--fg)" fillOpacity="0.1" />
      <path d={line} fill="none" stroke="var(--fg)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={width} cy={points.at(-1)?.split(',')[1]} r="2" fill="var(--accent)" />
    </svg>
  );
}

export default function TokenBurnRail() {
  const [data, setData] = useState<TokenBurnPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/token-burn.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: TokenBurnPayload) => {
        if (alive && d.ok) setData(d);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="px-3 py-2">
      <div className="rounded-xl border border-(--border) bg-(--bg) p-3.5">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="m-0 font-mono text-[11px] tracking-[0.08em] text-(--fg-faint) uppercase">token burn</h3>
          {error ? (
            <span className="font-mono text-[10px] text-(--fg-faint)">offline —</span>
          ) : !data ? (
            <span className="inline-block h-3 w-10 animate-pulse rounded-full bg-(--border)" />
          ) : (
            <span className="font-mono text-[10px] text-(--fg-faint)">14d</span>
          )}
        </div>

        {error ? (
          <p className="m-0 font-mono text-[11px] text-(--fg-faint)">unavailable</p>
        ) : !data ? (
          <div className="space-y-2">
            <div className="h-8 animate-pulse rounded bg-(--border)" />
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-(--border)" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-(--border)" />
          </div>
        ) : (
          <>
            <Sparkline series={(data.daily ?? []).slice(-14)} />

            <div className="mt-2 flex items-baseline justify-between gap-3">
              <span className="font-mono text-[10px] tracking-[0.06em] text-(--fg-faint) uppercase">today</span>
              <strong className="font-mono text-[13px] text-(--fg) tabular-nums">
                {formatTokens(data.today.tokens)}
                <span className="ml-1 font-normal text-(--fg-faint)">{formatApproxUsd(data.today.cost)}</span>
              </strong>
            </div>

            {(data.topModels ?? [])
              .filter((m) => m.tokens > 0)
              .slice(0, 1)
              .map((model) => {
                const brand = modelBrandIcon(model.model);
                return (
                  <div key={model.model} className="mt-1 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      {brand.type === 'cdn' ? (
                        <img
                          src={`https://cdn.simpleicons.org/${brand.slug}`}
                          alt=""
                          loading="lazy"
                          className="h-3.5 w-3.5 shrink-0"
                          onError={(e) => e.currentTarget.remove()}
                        />
                      ) : (
                        <span className="text-center text-(--fg-faint)">◦</span>
                      )}
                      <span className="truncate font-mono text-[11px] text-(--fg-dim)">
                        {shortModelName(model.model)}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-(--fg-faint) tabular-nums">
                      {formatTokens(model.tokens)}
                    </span>
                  </div>
                );
              })}

            <div className="mt-2 border-t border-(--border) pt-2 text-right">
              <a
                href="/tokens"
                className="font-mono text-[10px] text-(--fg-faint) no-underline transition-colors hover:text-(--fg)"
              >
                all-time {formatTokens(data.allTime.tokens)} ↗
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
