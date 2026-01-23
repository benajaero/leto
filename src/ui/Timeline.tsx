import type { EngineOutput, Scenario } from '../engine/types';

export function Timeline({ output, scenario, selectedIncidentId }: { output: EngineOutput | null; scenario: Scenario; selectedIncidentId: string | null }) {
  if (!output) {
    return (
      <section className="panel">
        <h2>Timeline</h2>
        <p>Run the scenario to see access and downlink windows.</p>
      </section>
    );
  }

  const windows = output.satellites.flatMap((sat) =>
    sat.aoiAccess.map((window) => ({ ...window, satName: sat.name }))
  );

  const incident = output.incidentMetrics.find((item) => item.incidentId === selectedIncidentId);

  return (
    <section className="panel">
      <h2>Timeline</h2>
      <div className="panel-list">
        <h3>AOI Access Windows</h3>
        <ul>
          {windows.slice(0, 10).map((window, idx) => (
            <li key={`${window.satName}-${idx}`}>{window.satName}: {window.startUtc} → {window.endUtc}</li>
          ))}
        </ul>
      </div>
      <div className="panel-list">
        <h3>Incident Focus</h3>
        {incident ? (
          <ul>
            <li>Serving satellite: {incident.servingSatellite ?? 'Unassigned'}</li>
            <li>Tobs: {incident.tobsMinutes === null ? 'No pass' : `${incident.tobsMinutes.toFixed(1)} min`}</li>
            <li>Tdl: {incident.tdlMinutes === null ? 'No downlink' : `${incident.tdlMinutes.toFixed(1)} min`}</li>
          </ul>
        ) : (
          <p>Select an incident to view timing.</p>
        )}
      </div>
      <div className="panel-list">
        <h3>Station Contacts (sample)</h3>
        {output.satellites.slice(0, 1).map((sat) => (
          <ul key={sat.id}>
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
    </section>
  );
}
