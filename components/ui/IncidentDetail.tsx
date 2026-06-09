import { useStore } from '@/lib/store';
import { ScoreBadge } from './ScoreBadge';
import { MissionTimeline } from './MissionTimeline';
import { formatDuration } from '@/lib/formatters';

export function IncidentDetail() {
  const selectedId = useStore((s) => s.selectedIncidentId);
  const incidents = useStore((s) => s.incidents);
  const output = useStore((s) => s.output);
  const scenario = useStore((s) => s.scenario);

  const incident = incidents.find((i) => i.id === selectedId);
  const metrics = output?.incidentMetrics.find((m) => m.incidentId === selectedId);

  if (!incident) {
    return (
      <div className="flex h-full flex-col items-center justify-center border-l border-aerospace-700 bg-aerospace-900 p-6">
        <div className="rounded-full border border-aerospace-700 bg-aerospace-800 p-4">
          <svg className="h-6 w-6 text-aerospace-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <p className="mt-3 text-xs text-aerospace-400">Select an incident to view details</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-l border-aerospace-700 bg-aerospace-900">
      <div className="border-b border-aerospace-700 px-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-aerospace-400">Incident Detail</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-aerospace-100">{incident.label}</h2>
            <p className="mt-0.5 font-mono text-xs text-aerospace-400">
              {incident.lat.toFixed(4)}°, {incident.lon.toFixed(4)}°
            </p>
          </div>
          {metrics && <ScoreBadge score={metrics.score} size="lg" />}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-2">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Type</span>
            <p className="text-sm font-semibold text-aerospace-200">{incident.type}</p>
          </div>
          <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-2">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Source</span>
            <p className="text-sm font-semibold text-aerospace-200">{incident.source}</p>
          </div>
          {incident.confidence !== undefined && (
            <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-2">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Confidence</span>
              <p className="font-mono text-sm font-semibold text-aerospace-200">{incident.confidence}</p>
            </div>
          )}
          {incident.severity !== undefined && (
            <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-2">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Severity</span>
              <p className="font-mono text-sm font-semibold text-aerospace-200">{incident.severity}</p>
            </div>
          )}
        </div>

        {metrics && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-2">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Tobs</span>
                <p className="font-mono text-sm font-bold text-cyan-400">
                  {formatDuration(metrics.tFirstObsSeconds)}
                </p>
              </div>
              <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-2">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Tdl</span>
                <p className="font-mono text-sm font-bold text-cyan-400">
                  {formatDuration(metrics.tFirstDownlinkSeconds)}
                </p>
              </div>
            </div>

            {metrics.servingSatellite && (
              <div className="mb-4 rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Serving Satellite</span>
                <p className="text-sm font-semibold text-aerospace-200">{metrics.servingSatellite}</p>
              </div>
            )}

            <MissionTimeline metrics={metrics} startTime={scenario.startTimeUtc} />
          </>
        )}

        <div className="mt-4 rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Observed</span>
          <p className="font-mono text-xs text-aerospace-300">{incident.observedUtc}</p>
          {incident.ingestedUtc && (
            <>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Ingested</span>
              <p className="font-mono text-xs text-aerospace-300">{incident.ingestedUtc}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
