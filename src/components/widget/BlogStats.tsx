import { useEffect, useRef, useState } from 'react';

const MAX_REACTIONS = 20;

const REACTIONS: { emoji: string; key: 'loves' | 'applauses' | 'bullseye' | 'ideas' }[] = [
  { emoji: '❤️', key: 'loves' },
  { emoji: '👏', key: 'applauses' },
  { emoji: '🎯', key: 'bullseye' },
  { emoji: '💡', key: 'ideas' },
];

interface Stats {
  slug: string;
  type: 'blog';
  views: number;
  loves: number;
  applauses: number;
  bullseye: number;
  ideas: number;
}

type NumericKeys = 'views' | 'loves' | 'applauses' | 'bullseye' | 'ideas';

const STORAGE_KEY = (slug: string) => `blog/${slug}`;

export default function BlogStats({ slug, className }: { slug: string; className?: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [main, setMain] = useState<Record<string, number>>({});
  const [initial, setInitial] = useState<Record<string, number>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let alive = true;
    fetch(`/api/stats?slug=${encodeURIComponent(slug)}&type=blog`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Stats) => {
        if (!alive) return;
        setStats(data);
        fetch('/api/stats', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slug, type: 'blog', views: data.views + 1 }),
        }).catch(() => {});
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    const stored = { loves: 0, applauses: 0, bullseye: 0, ideas: 0 };
    try {
      Object.assign(stored, JSON.parse(localStorage.getItem(STORAGE_KEY(slug)) ?? '{}'));
    } catch {
      // corrupt storage, ignore
    }
    setInitial(stored);
    setMain(stored);
  }, [slug]);

  const display = (key: NumericKeys): string => {
    const value = (stats?.[key] ?? 0) + (main[key] ?? 0) - (initial[key] ?? 0);
    return stats ? value.toLocaleString('en-US') : '--';
  };

  const bump = (key: NumericKeys) => {
    setMain((m) => ({ ...m, [key]: Math.min(MAX_REACTIONS, (m[key] ?? 0) + 1) }));
  };

  const scheduleSave = (key: NumericKeys) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => {
      if (!stats) return;
      const next = stats[key] + (main[key] ?? 0) - (initial[key] ?? 0);
      fetch('/api/stats', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, type: 'blog', [key]: next }),
      }).catch(() => {});
      try {
        localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(main));
      } catch {
        // storage unavailable
      }
    }, 1000);
  };

  return (
    <div className={className}>
      <div className="text-[12px] text-(--fg-dim)">
        Views: <span data-view>{(stats ? stats.views.toLocaleString('en-US') : '---') + ' views'}</span>
      </div>
      <div className="mt-3 flex items-center gap-6">
        {REACTIONS.map(({ emoji, key }) => (
          <button
            key={key}
            type="button"
            data-umami-event="post-reaction"
            className="flex flex-col items-center gap-1 text-lg"
            title={key}
            onMouseUp={() => bump(key)}
            onMouseLeave={() => scheduleSave(key)}
          >
            <span aria-hidden="true">{emoji}</span>
            <span className="text-[12px] tabular-nums text-(--fg-dim)">{display(key)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}