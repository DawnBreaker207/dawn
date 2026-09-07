import { useEffect, useState } from 'react';

function format(now: Date) {
  return now.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function LiveClock() {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    setNow(format(new Date()));
    const timer = setInterval(() => setNow(format(new Date())), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="tip" data-tip="Giờ Hà Nội (GMT+7)" suppressHydrationWarning>
      {now ?? '--:--'}
    </span>
  );
}