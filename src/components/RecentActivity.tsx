import { useEffect, useState } from 'react';
import type { ActivityItem } from '@/pages/api/activity.json';

const DOT: Record<string, string> = {
  book: 'bg-amber-500',
  blog: 'bg-sky-500',
  github: 'bg-blue-500',
};

export default function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/activity.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: ActivityItem[]) => {
        if (alive) setItems(d);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return <p className="px-3 py-2 text-[11px] text-(--fg-faint)">activity unavailable</p>;
  }

  if (!items) {
    return (
      <div className="px-3 py-2">
        <div className="rounded-xl border border-(--border) p-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mb-2 h-3 animate-pulse rounded-full bg-(--border)" style={{ width: `${100 - i * 25}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return <div className="px-3 py-2"><div className="rounded-xl border border-(--border) p-3 text-[13px] text-(--fg-dim)">No recent activity.</div></div>;
  }

  return (
    <div className="space-y-1.5 px-3 py-2">
      {items.slice(0, 4).map((e, i) => {
        const linkProps = e.url
          ? { href: e.url, ...(e.url.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' }) }
          : {};
        const Tag = e.url ? 'a' : 'div';
        return (
          <Tag
            key={`${e.type}-${i}`}
            {...linkProps}
            data-umami-event={`activity-${e.type}`}
            className="grid grid-cols-[40px_1fr] items-center gap-3 rounded-xl border border-(--border) bg-(--bg) p-2.5 no-underline"
          >
            {e.imageUrl ? (
              <img
                src={e.imageUrl}
                alt=""
                loading="lazy"
                className="h-10 w-10 rounded-md border border-(--border) object-cover"
              />
            ) : (
              <span className={`h-2 w-2 rounded-full ${DOT[e.type] ?? 'bg-blue-500'}`} />
            )}
            <span className="min-w-0">
              {e.meta && <span className="block font-mono text-[10px] uppercase tracking-[0.06em] text-(--fg-faint)">{e.meta}</span>}
              <strong className="block font-medium leading-snug">{e.title}</strong>
              <span className="mt-0.5 block truncate text-[13px] leading-snug text-(--fg-dim)">
                {e.subtitle || e.type}
              </span>
            </span>
          </Tag>
        );
      })}
    </div>
  );
}