import { useEffect, useMemo, useState } from 'react';
import { fetchFirms } from '../data/firms';
import { fetchGdacs } from '../data/gdacs';
import { ScenarioEditor } from './ScenarioEditor';
import { MapView } from './MapView';
import { MetricsPanel } from './MetricsPanel';
import { Timeline } from './Timeline';
import { DataPanel } from './DataPanel';
import { StatusBar } from './StatusBar';
import { useStore } from './store';
import { useEngine } from './useEngine';
import type { Incident } from '../engine/types';

export function App() {
  const scenario = useStore((state) => state.scenario);
  const incidents = useStore((state) => state.incidents);
  const output = useStore((state) => state.output);
  const progress = useStore((state) => state.progress);
  const selectedIncidentId = useStore((state) => state.selectedIncidentId);
  const dataSources = useStore((state) => state.dataSources);
  const setIncidents = useStore((state) => state.setIncidents);
  const setOutput = useStore((state) => state.setOutput);
  const setProgress = useStore((state) => state.setProgress);
  const setSelectedIncidentId = useStore((state) => state.setSelectedIncidentId);
  const setDataSources = useStore((state) => state.setDataSources);

  const [filters, setFilters] = useState({ hours: 48, minConfidence: 0, minSeverity: 0 });

  useEffect(() => {
    const load = async () => {
      const firms = await fetchFirms(scenario.aoi);
      const gdacs = await fetchGdacs();
      setDataSources([
        {
          name: 'NASA FIRMS',
          fetchedUtc: firms.fetchedUtc,
          fromCache: firms.fromCache,
          disclaimer: 'Near real-time; latency varies by product and region.',
          sourceUrl: firms.sourceUrl
        },
        {
          name: 'GDACS',
          fetchedUtc: gdacs.fetchedUtc,
          fromCache: gdacs.fromCache,
          disclaimer: 'Automated alerts; verify event details with official sources.',
          sourceUrl: gdacs.sourceUrl
        }
      ]);
      setIncidents([...firms.incidents, ...gdacs.incidents]);
    };
    load();
  }, [scenario, setIncidents, setDataSources]);

  const filteredIncidents = useMemo(() => {
    const cutoff = Date.now() - filters.hours * 3600 * 1000;
    return incidents.filter((incident) => {
      const time = new Date(incident.observedUtc).getTime();
      const passTime = time >= cutoff;
      if (!passTime) return false;
      if (incident.source === 'FIRMS' && incident.confidence !== undefined) {
        return incident.confidence >= filters.minConfidence;
      }
      if (incident.source === 'GDACS' && incident.severity !== undefined) {
        return incident.severity >= filters.minSeverity;
      }
      return true;
    });
  }, [incidents, filters]);

  useEngine(
    scenario,
    filteredIncidents,
    (value) => setProgress(value),
    (output) => setOutput(output)
  );

  const selectedIncident = selectedIncidentId
    ? filteredIncidents.find((incident) => incident.id === selectedIncidentId)
    : null;

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>LETO</h1>
          <p>Satellite Emergency Response Planner — Australia & Africa</p>
        </div>
        <div className="filters">
          <label>
            Incident age
            <select value={filters.hours} onChange={(event) => setFilters({ ...filters, hours: Number(event.target.value) })}>
              <option value={24}>Last 24h</option>
              <option value={48}>Last 48h</option>
            </select>
          </label>
          <label>
            Min FIRMS confidence
            <input
              type="number"
              value={filters.minConfidence}
              onChange={(event) => setFilters({ ...filters, minConfidence: Number(event.target.value) })}
            />
          </label>
          <label>
            Min GDACS severity
            <input
              type="number"
              value={filters.minSeverity}
              onChange={(event) => setFilters({ ...filters, minSeverity: Number(event.target.value) })}
            />
          </label>
        </div>
      </header>
      <StatusBar progress={progress} dataSources={dataSources} scenario={scenario} />
      <main className="layout">
        <div className="left">
          <ScenarioEditor />
          <DataPanel />
        </div>
        <div className="centre">
          <MapView scenario={scenario} incidents={filteredIncidents} output={output} onIncidentSelect={setSelectedIncidentId} />
          {selectedIncident && (
            <div className="incident-card">
              <strong>{selectedIncident.label}</strong>
              <span>{selectedIncident.source} • {selectedIncident.observedUtc}</span>
            </div>
          )}
        </div>
        <div className="right">
          <MetricsPanel output={output} incidents={filteredIncidents} onSelectIncident={setSelectedIncidentId} />
          <Timeline output={output} scenario={scenario} selectedIncidentId={selectedIncidentId} />
        </div>
      </main>
      <footer className="footer">
        <small>Decision-support only. Not a sole source for response. UTC timestamps shown.</small>
      </footer>
    </div>
  );
}
