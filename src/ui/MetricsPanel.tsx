import type { EngineOutput, Incident } from '../engine/types';

export function MetricsPanel({ output, incidents, onSelectIncident }: { output: EngineOutput | null; incidents: Incident[]; onSelectIncident: (id: string) => void }) {
  if (!output) {
    return (
      <section className="panel">
        <h2>Metrics</h2>
        <p>Awaiting engine output.</p>
      </section>
    );
  }

  const ranked = output.incidentMetrics
    .map((metric) => ({
      ...metric,
      incident: incidents.find((incident) => incident.id === metric.incidentId)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <section className="panel">
      <h2>Metrics</h2>
      <div className="metrics-grid">
        <div>
          <h3>Revisit</h3>
          <p>Passes: {output.revisit.passCount}</p>
          <p>Avg gap: {output.revisit.avgGapMinutes.toFixed(1)} min</p>
          <p>Max gap: {output.revisit.maxGapMinutes.toFixed(1)} min</p>
        </div>
        <div>
          <h3>Coverage</h3>
          <p>Heatmap cells: {output.heatmap.length}</p>
        </div>
      </div>
      <div className="panel-list">
        <h3>Ranked Incidents</h3>
        <table>
          <thead>
            <tr>
              <th>Incident</th>
              <th>Score</th>
              <th>Tobs</th>
              <th>Tdl</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((item) => (
              <tr key={item.incidentId} onClick={() => onSelectIncident(item.incidentId)}>
                <td>{item.incident?.label ?? item.incidentId}</td>
                <td>{item.score}</td>
                <td>{item.tobsMinutes === null ? '-' : item.tobsMinutes.toFixed(1)} min</td>
                <td>{item.tdlMinutes === null ? '-' : item.tdlMinutes.toFixed(1)} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
