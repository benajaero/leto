import type { EngineOutput, Scenario } from '../engine/types';

export function Timeline({ output, scenario, selectedIncidentId }: { output: EngineOutput | null; scenario: Scenario; selectedIncidentId: string | null }) {
  if (!output) {
    return (
      <section className="rounded-3xl border border-blush-100 bg-white/85 p-6 shadow-panel backdrop-blur motion-safe:animate-fade-up motion-safe:[animation-delay:180ms]">
        <div>
          <h2 className="text-lg font-semibold">Timeline</h2>
          <p className="text-sm text-slate-500">Run the scenario to see access and downlink windows.</p>
        </div>
      </section>
    );
  }

  const windows = output.satellites.flatMap((sat) =>
    sat.aoiAccess.map((window) => ({ ...window, satName: sat.name }))
  );

  const incident = output.incidentMetrics.find((item) => item.incidentId === selectedIncidentId);

  return (
    <section className="rounded-3xl border border-blush-100 bg-white/85 p-6 shadow-panel backdrop-blur motion-safe:animate-fade-up motion-safe:[animation-delay:180ms]">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Timeline</h2>
          <p className="text-xs text-slate-500">Access windows and downlink readiness.</p>
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">AOI Access Windows</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-500">
              {windows.slice(0, 10).map((window, idx) => (
                <li key={`${window.satName}-${idx}`}>{window.satName}: {window.startUtc} → {window.endUtc}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-blush-100 bg-white/80 p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Incident Focus</h3>
            {incident ? (
              <ul className="mt-2 space-y-1 text-sm text-slate-500">
                <li>Serving satellite: {incident.servingSatellite ?? 'Unassigned'}</li>
                <li>Tobs: {incident.tobsMinutes === null ? 'No pass' : `${incident.tobsMinutes.toFixed(1)} min`}</li>
                <li>Tdl: {incident.tdlMinutes === null ? 'No downlink' : `${incident.tdlMinutes.toFixed(1)} min`}</li>
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Select an incident to view timing.</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold">Station Contacts (sample)</h3>
            {output.satellites.slice(0, 1).map((sat) => (
              <ul className="mt-2 space-y-1 text-sm text-slate-500" key={sat.id}>
                {scenario.stations.map((station) => {
                  const windows = sat.stationContacts[station.id] ?? [];
                  return (
                    <li key={station.id}>
                      {station.name}: {windows[0]?.startUtc ?? 'No contact'}
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
