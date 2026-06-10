import type { Incident, IncidentMetrics } from '@/lib/engine/types';
import { ScoreBadge } from './ScoreBadge';
import { formatDuration, scoreColor, scoreLabel } from '@/lib/formatters';

function typeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('fire')) return '🔥';
  if (t.includes('flood')) return '💧';
  if (t.includes('cyclone') || t.includes('storm')) return '🌪';
  if (t.includes('earthquake')) return '🌋';
  return '⚠';
}

function severityBadge(severity?: number) {
  if (severity === undefined) return null;
  if (severity >= 80) return { label: 'CRITICAL', class: 'bg-red-500/15 text-red-400 border-red-500/30' };
  if (severity >= 60) return { label: 'HIGH', class: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
  if (severity >= 40) return { label: 'MODERATE', class: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  return { label: 'LOW', class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
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
  const sev = severityBadge(incident.severity);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded border bg-aerospace-800/50 transition-all duration-200 min-h-[44px] ${
        selected
          ? 'border-cyan-400/50 bg-cyan-500/5 shadow-glow-cyan'
          : 'border-aerospace-700 hover:border-aerospace-600 hover:bg-aerospace-750'
      } active:scale-[0.98]`}
    >
      <div className="p-3">
        {/* Header row */}
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-aerospace-700 text-sm">
            {typeIcon(incident.type)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-aerospace-100">{incident.label}</span>
              {sev && (
                <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${sev.class}`}>
                  {sev.label}
                </span>
              )}
            </div>
            <p className="mt-0.5 font-mono text-[10px] text-aerospace-400">
              {incident.lat.toFixed(2)}°, {incident.lon.toFixed(2)}° · {incident.source}
            </p>
          </div>
          {metrics && <ScoreBadge score={score} size="sm" />}
        </div>

        {/* Stats grid */}
        {metrics && (
          <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-aerospace-700/50 pt-2">
            <div>
              <span className="block text-[8px] font-semibold uppercase tracking-wider text-aerospace-500">Service</span>
              <span className={`text-[10px] font-bold ${scoreColor(score)}`}>{scoreLabel(score)}</span>
              <span className="ml-1 font-mono text-[9px] text-aerospace-400">{score}/100</span>
            </div>
            <div>
              <span className="block text-[8px] font-semibold uppercase tracking-wider text-aerospace-500">TTFO</span>
              <span className={`font-mono text-[10px] ${tobs !== null ? 'text-cyan-400' : 'text-aerospace-500'}`}>
                {formatDuration(tobs)}
              </span>
            </div>
            <div>
              <span className="block text-[8px] font-semibold uppercase tracking-wider text-aerospace-500">TTDL</span>
              <span className={`font-mono text-[10px] ${tdl !== null ? 'text-cyan-400' : 'text-aerospace-500'}`}>
                {formatDuration(tdl)}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-1.5 flex items-center gap-2 text-[9px] text-aerospace-500">
          <span>Source: <span className="text-aerospace-400">{incident.source}</span></span>
          {metrics?.servingSatellite && (
            <>
              <span className="text-aerospace-700">|</span>
              <span>Sensor: <span className="text-aerospace-400">{metrics.servingSatellite}</span></span>
            </>
          )}
          <span className="ml-auto rounded bg-aerospace-700/50 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400">Monitoring</span>
        </div>
      </div>
    </button>
  );
}
