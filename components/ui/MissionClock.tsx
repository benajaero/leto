'use client';

import { useEffect, useState } from 'react';
import { formatUtcTime, formatUtcDate } from '@/lib/formatters';

/**
 * The clock owns its own second-tick.
 *
 * It used to live inside StatusHeader, whose `setInterval` re-rendered the
 * entire toolbar — scenario dropdown, view tabs, feed status, coverage readout
 * — once a second for the life of the session. Isolating it means only these
 * two lines re-render.
 */
export function MissionClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col">
      <span className="text-micro font-semibold uppercase text-aerospace-500">Mission Clock</span>
      {/* Rendered client-side only: a server-rendered time is wrong the moment
          it arrives, and mismatches hydration. */}
      <time
        dateTime={now?.toISOString()}
        className="font-mono text-base font-bold tabular-nums tracking-wide text-aerospace-100"
      >
        {now ? formatUtcTime(now) : '--:--:--'}
      </time>
      <span className="text-micro font-mono text-aerospace-500">
        {now ? formatUtcDate(now) : ' '}
      </span>
    </div>
  );
}
