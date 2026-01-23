import type { EngineOutput, Incident } from '../engine/types';

export function MetricsPanel({ output, incidents, onSelectIncident }: { output: EngineOutput | null; incidents: Incident[]; onSelectIncident: (id: string) => void }) {
  if (!output) {
    return (
      <section className="rounded-3xl border border-blush-100 bg-white/85 p-6 shadow-panel backdrop-blur motion-safe:animate-fade-up motion-safe:[animation-delay:140ms]">
        <div>
          <h2 className="text-lg font-semibold">Metrics</h2>
          <p className="text-sm text-slate-500">Awaiting engine output.</p>
        </div>
      </section>
    );
  }

  const formatMinutes = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '-';
    return `${(seconds / 60).toFixed(1)} min`;
  };

  const formatHours = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '-';
    return `${(seconds / 3600).toFixed(1)} h`;
  };

  const coverageValues = output.heatmapGrid.values.map((cell) => cell.coverageFraction);
  const coverageMin = coverageValues.length ? Math.min(...coverageValues) : 0;
  const coverageMax = coverageValues.length ? Math.max(...coverageValues) : 0;
  const coverageAvg = coverageValues.length ? coverageValues.reduce((a, b) => a + b, 0) / coverageValues.length : 0;

  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

  const ranked = output.incidentMetrics
    .map((metric) => ({
      ...metric,
      incident: incidents.find((incident) => incident.id === metric.incidentId)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <section className="rounded-3xl border border-blush-100 bg-white/85 p-6 shadow-panel backdrop-blur motion-safe:animate-fade-up motion-safe:[animation-delay:140ms]">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Metrics</h2>
          <p className="text-xs text-slate-500">Top incidents ranked by revisit and downlink latency.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-blush-100 bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400">Revisit passes</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{output.revisit.passCount}</p>
            <p className="text-xs text-slate-500">Avg gap: {formatHours(output.revisit.avgGapSeconds)}</p>
            <p className="text-xs text-slate-500">Max gap: {formatHours(output.revisit.maxGapSeconds)}</p>
          </div>
          <div className="rounded-2xl border border-blush-100 bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400">Coverage cells</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{output.heatmapGrid.values.length}</p>
            <p className="text-xs text-slate-500">Cell size: {output.heatmapGrid.cellSizeKm.toFixed(1)} km</p>
            <p className="text-xs text-slate-500">Min/avg/max: {formatPercent(coverageMin)} / {formatPercent(coverageAvg)} / {formatPercent(coverageMax)}</p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Ranked Incidents</h3>
            <span className="text-xs text-slate-400">Top 10 by score</span>
          </div>
          <div className="mt-2 overflow-x-auto rounded-2xl border border-blush-100 bg-white/80 shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-blush-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Incident</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Tobs</th>
                  <th className="px-3 py-2">Tdl</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-100">
                {ranked.map((item) => (
                  <tr className="cursor-pointer hover:bg-blush-50/60" key={item.incidentId} onClick={() => onSelectIncident(item.incidentId)}>
                    <td className="px-3 py-2">{item.incident?.label ?? item.incidentId}</td>
                    <td className="px-3 py-2">{item.score}</td>
                    <td className="px-3 py-2">
                      {item.tFirstObsSeconds === null ? '-' : formatMinutes(item.tFirstObsSeconds)}
                    </td>
                    <td className="px-3 py-2">
                      {item.tFirstDownlinkSeconds === null ? '-' : formatMinutes(item.tFirstDownlinkSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
