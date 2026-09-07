import { useEffect, useState } from 'react';

interface Day {
  date: string;
  count: number;
  level: number;
}

const WEEK = 7;
const WEEKS = 26;

function toWeeks(days: Day[]) {
  const start = days.length >= WEEKS * WEEK ? days.length - WEEKS * WEEK : 0;
  const slice = days.slice(start);
  const weeks: Day[][] = [];
  for (let i = 0; i < slice.length; i += WEEK) weeks.push(slice.slice(i, i + WEEK));
  return weeks;
}

function cellColor(level: number, count: number) {
  if (level <= 0 || count <= 0) return 'var(--bg-alt)';
  const alpha = (level / 4) * 0.9 + 0.1;
  return `rgba(81,148,240,${alpha})`;
}

export default function CommitGraph() {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
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

  if (error) return <p className="text-[11px] text-(--fg-faint)">Không tải được dữ liệu commits.</p>;

  if (!days) {
    return (
      <div className="grid w-fit grid-cols-[repeat(26,9px)] gap-[2px]">
        {Array.from({ length: 26 * 7 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-[1px] bg-(--bg-alt) border border-(--border)"></div>
        ))}
      </div>
    );
  }

  const weeks = toWeeks(days);
  const total = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <div className="text-[11px] text-(--fg-dim)">{total} contributions · 26 tuần</div>
      <div className="mt-1 grid w-fit grid-flow-col gap-[2px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-rows-7 gap-[2px]">
            {week.map((day) => (
              <div
                key={day.date}
                className="aspect-square w-[9px] rounded-[1px] border border-(--border)"
                style={{ backgroundColor: cellColor(day.level, day.count) }}
                title={`${day.date}: ${day.count} commits`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
