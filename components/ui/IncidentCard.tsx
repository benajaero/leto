import type { Incident } from '@/lib/engine/types';
import type { IncidentMetrics } from '@/lib/engine/types';
import { ScoreBadge } from './ScoreBadge';
import { formatDuration } from '@/lib/formatters';

function typeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('fire')) return '🔥';
  if (t.includes('flood')) return '💧';
  if (t.includes('cyclone') || t.includes('storm')) return '🌪';
  return '⚠';
}

function typeBorder(type: string) {
  const t = type.toLowerCase();
  if (t.includes('fire')) return 'border-l-orange-500';
  if (t.includes('flood')) return 'border-l-cyan-400';
  if (t.includes('cyclone') || t.includes('storm')) return 'border-l-purple-400';
  return 'border-l-aerospace-400';
}

export function IncidentCard({
  incident,
  metrics,
  selected,
  onClick
}: {
  incident: Incident;
  metrics?: IncidentMetrics;
  selected: boolean;
  onClick: () => void;
}) {
  const score = metrics?.score ?? 0;
  const tobs = metrics?.tFirstObsSeconds ?? null;
  const tdl = metrics?.tFirstDownlinkSeconds ?? null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded border bg-aerospace-800/50 transition-all duration-200 ${
        selected
          ? 'border-cyan-400/50 bg-cyan-500/5 shadow-glow-cyan'
          : 'border-aerospace-700 hover:border-aerospace-600 hover:bg-aerospace-750'
      } ${typeBorder(incident.type)} border-l-2`}
    >
      <div className="flex items-start gap-3 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-aerospace-700 text-sm">
          {typeIcon(incident.type)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-aerospace-100">{incident.label}</span>
            {metrics && <ScoreBadge score={score} size="sm" />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-aerospace-400">
            <span className="font-mono">{incident.lat.toFixed(2)}°, {incident.lon.toFixed(2)}°</span>
            {incident.confidence !== undefined && (
              <span className="rounded bg-aerospace-700 px-1.5 py-0.5 font-mono">CONF {incident.confidence}</span>
            )}
            {incident.severity !== undefined && (
              <span className="rounded bg-aerospace-700 px-1.5 py-0.5 font-mono">SEV {incident.severity}</span>
            )}
          </div>
          {metrics && (
            <div className="mt-2 flex gap-3 border-t border-aerospace-700/50 pt-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Tobs</span>
                <span className={`font-mono text-xs ${tobs !== null ? 'text-cyan-400' : 'text-aerospace-500'}`}>
                  {formatDuration(tobs)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Tdl</span>
                <span className={`font-mono text-xs ${tdl !== null ? 'text-cyan-400' : 'text-aerospace-500'}`}>
                  {formatDuration(tdl)}
                </span>
              </div>
              {metrics.servingSatellite && (
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Sat</span>
                  <span className="font-mono text-xs text-aerospace-300">{metrics.servingSatellite}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
