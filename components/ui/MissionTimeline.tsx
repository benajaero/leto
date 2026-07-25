import { formatDuration } from '@/lib/formatters';
import type { IncidentMetrics } from '@/lib/engine/types';

export function MissionTimeline({ metrics, startTime }: { metrics: IncidentMetrics; startTime: string }) {
  const start = new Date(startTime).getTime();
  const tobs = metrics.tFirstObsSeconds;
  const tdl = metrics.tFirstDownlinkSeconds;

  const events = [
    {
      label: 'Incident Reported',
      time: 'T+0',
      status: 'past',
      detail: 'Initial detection'
    },
    {
      label: 'Satellite Observation',
      time: tobs !== null ? `T+${formatDuration(tobs)}` : 'No coverage',
      status: tobs !== null ? 'future' : 'none',
      detail: tobs !== null ? `First pass at ${new Date(start + tobs * 1000).toISOString().slice(11, 19)} UTC` : 'No satellite access in window'
    },
    {
      label: 'Ground Downlink',
      time: tdl !== null ? `T+${formatDuration(tdl)}` : 'No station contact',
      status: tdl !== null ? 'future' : 'none',
      detail: tdl !== null ? `Data available at station` : 'No ground contact after observation'
    },
    {
      label: 'Data Available',
      time: tdl !== null ? `T+${formatDuration(tdl + 900)}` : '—',
      status: tdl !== null ? 'future' : 'none',
      detail: tdl !== null ? 'Estimated processing complete' : '—'
    }
  ];

  return (
    <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-4">
      <h3 className="mb-3 text-readout font-bold uppercase tracking-[0.2em] text-aerospace-400">Mission Timeline</h3>
      <div className="relative flex flex-col gap-0">
        {events.map((event, i) => (
          <div key={event.label} className="relative flex gap-3 pb-4 last:pb-0">
            {i < events.length - 1 && (
              <div className="absolute left-[7px] top-4 h-full w-px bg-aerospace-700" />
            )}
            <div
              className={`relative z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                event.status === 'past'
                  ? 'border-aerospace-550 bg-aerospace-550'
                  : event.status === 'future'
                  ? 'border-signal-400 bg-aerospace-800 shadow-glow-signal'
                  : 'border-aerospace-700 bg-aerospace-800'
              }`}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-aerospace-200">{event.label}</span>
                <span
                  className={`font-mono text-readout ${
                    event.status === 'future' ? 'text-signal-400' : 'text-aerospace-500'
                  }`}
                >
                  {event.time}
                </span>
              </div>
              <span className="text-readout text-aerospace-400">{event.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
