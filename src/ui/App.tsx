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

  const defaultFilters = { hours: 48, minConfidence: 0, minSeverity: 0 };
  const [filters, setFilters] = useState(defaultFilters);
  const [layerToggles, setLayerToggles] = useState(() => ({
    firms: scenario.display?.layerToggles?.firms ?? true,
    gdacs: scenario.display?.layerToggles?.gdacs ?? true,
    tracks: scenario.display?.showTracks ?? true,
    footprints: scenario.display?.showFootprints ?? true,
    stations: scenario.display?.showStations ?? true
  }));
  const [visibleSatIds, setVisibleSatIds] = useState<string[]>(() => scenario.satellites.map((sat) => sat.id));

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

  useEffect(() => {
    setVisibleSatIds(scenario.satellites.map((sat) => sat.id));
    setLayerToggles({
      firms: scenario.display?.layerToggles?.firms ?? true,
      gdacs: scenario.display?.layerToggles?.gdacs ?? true,
      tracks: scenario.display?.showTracks ?? true,
      footprints: scenario.display?.showFootprints ?? true,
      stations: scenario.display?.showStations ?? true
    });
  }, [scenario]);

  const selectedIncident = selectedIncidentId
    ? filteredIncidents.find((incident) => incident.id === selectedIncidentId)
    : null;

  const mapIncidents = filteredIncidents.filter((incident) => {
    if (incident.source === 'FIRMS') return layerToggles.firms;
    if (incident.source === 'GDACS') return layerToggles.gdacs;
    return true;
  });

  const toggleSatellite = (id: string) => {
    setVisibleSatIds((prev) => (prev.includes(id) ? prev.filter((satId) => satId !== id) : [...prev, id]));
  };

  const exportScenario = () => {
    const payload = {
      ...scenario,
      display: {
        showTracks: layerToggles.tracks,
        showFootprints: layerToggles.footprints,
        showStations: layerToggles.stations,
        layerToggles: {
          firms: layerToggles.firms,
          gdacs: layerToggles.gdacs
        }
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leto-scenario-${scenario.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importScenario = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed || typeof parsed !== 'object') return;
        setScenario(parsed);
        if (parsed.display) {
          setLayerToggles({
            firms: parsed.display.layerToggles?.firms ?? true,
            gdacs: parsed.display.layerToggles?.gdacs ?? true,
            tracks: parsed.display.showTracks ?? true,
            footprints: parsed.display.showFootprints ?? true,
            stations: parsed.display.showStations ?? true
          });
        }
      } catch (error) {
        console.error('Invalid scenario JSON', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen text-slate-900">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-28 right-12 h-72 w-72 rounded-full bg-blush-200/50 blur-3xl animate-soft-glow" />
          <div className="absolute bottom-[-140px] left-12 h-80 w-80 rounded-full bg-blush-100/70 blur-3xl animate-soft-glow" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,160,198,0.18),_transparent_60%)]" />
        </div>
        <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 pb-10 pt-6 sm:px-6 lg:gap-6">
          <header className="rounded-3xl border border-blush-100 bg-white/85 p-6 shadow-panel backdrop-blur motion-safe:animate-fade-up">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blush-500">LETO</p>
                  <h1 className="text-4xl font-semibold tracking-tight">Satellite Emergency Response</h1>
                  <p className="text-sm text-slate-500">Australia & Africa — live incident triage and access planning.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-blush-600">
                  <span className="rounded-full border border-blush-200 bg-blush-50 px-3 py-1">UTC timelines</span>
                  <span className="rounded-full border border-blush-200 bg-blush-50 px-3 py-1">Live data feeds</span>
                  <span className="rounded-full border border-blush-200 bg-blush-50 px-3 py-1">Scenario-driven planning</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Filters</p>
                  <p className="text-xs text-slate-500">Tune the incident feed before running analysis.</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-blush-200 bg-white px-4 py-2 text-[11px] font-semibold text-blush-600 shadow-sm hover:border-blush-300 transition"
                  onClick={() => setFilters(defaultFilters)}
                >
                  Reset filters
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Incident age</p>
                  <p className="text-xs text-slate-500">Choose a window for active incidents.</p>
                  <select
                    className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
                    value={filters.hours}
                    onChange={(event) => setFilters({ ...filters, hours: Number(event.target.value) })}
                  >
                    <option value={24}>Last 24h</option>
                    <option value={48}>Last 48h</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Min FIRMS confidence</p>
                  <p className="text-xs text-slate-500">Filter thermal detections by confidence.</p>
                  <label className="flex items-center gap-2 rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus-within:border-blush-300 focus-within:ring-2 focus-within:ring-blush-200">
                    <span className="text-xs font-semibold text-slate-400">%</span>
                    <input
                      className="w-full bg-transparent outline-none"
                      type="number"
                      min={0}
                      max={100}
                      value={filters.minConfidence}
                      onChange={(event) => setFilters({ ...filters, minConfidence: Number(event.target.value) })}
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Min GDACS severity</p>
                  <p className="text-xs text-slate-500">Set the alert threshold for events.</p>
                  <label className="flex items-center gap-2 rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus-within:border-blush-300 focus-within:ring-2 focus-within:ring-blush-200">
                    <span className="text-xs font-semibold text-slate-400">lvl</span>
                    <input
                      className="w-full bg-transparent outline-none"
                      type="number"
                      min={0}
                      value={filters.minSeverity}
                      onChange={(event) => setFilters({ ...filters, minSeverity: Number(event.target.value) })}
                    />
                  </label>
                </div>
              </div>
            </div>
          </header>

          <StatusBar progress={progress} dataSources={dataSources} scenario={scenario} />

          <main className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
            <div className="order-2 flex flex-col gap-4 xl:order-1">
              <ScenarioEditor onExportScenario={exportScenario} onImportScenario={importScenario} />
              <DataPanel />
            </div>
            <div className="order-1 flex flex-col gap-3 xl:order-2">
              <section className="rounded-3xl border border-blush-100 bg-white/85 p-6 shadow-panel backdrop-blur motion-safe:animate-fade-up motion-safe:[animation-delay:100ms]">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold">Operational Map</h2>
                      <p className="text-xs text-slate-500">Tap an incident to surface the timing window.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-blush-200 text-blush-500 focus:ring-blush-200"
                          checked={layerToggles.firms}
                          onChange={(event) => setLayerToggles({ ...layerToggles, firms: event.target.checked })}
                        />
                        FIRMS
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-blush-200 text-blush-500 focus:ring-blush-200"
                          checked={layerToggles.gdacs}
                          onChange={(event) => setLayerToggles({ ...layerToggles, gdacs: event.target.checked })}
                        />
                        GDACS
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-blush-200 text-blush-500 focus:ring-blush-200"
                          checked={layerToggles.tracks}
                          onChange={(event) => setLayerToggles({ ...layerToggles, tracks: event.target.checked })}
                        />
                        Tracks
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-blush-200 text-blush-500 focus:ring-blush-200"
                          checked={layerToggles.footprints}
                          onChange={(event) => setLayerToggles({ ...layerToggles, footprints: event.target.checked })}
                        />
                        Footprints
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-blush-200 text-blush-500 focus:ring-blush-200"
                          checked={layerToggles.stations}
                          onChange={(event) => setLayerToggles({ ...layerToggles, stations: event.target.checked })}
                        />
                        Stations
                      </label>
                    </div>
                  </div>
                  <MapView
                    scenario={scenario}
                    incidents={mapIncidents}
                    output={output}
                    onIncidentSelect={setSelectedIncidentId}
                    selectedIncidentId={selectedIncidentId}
                    layerToggles={layerToggles}
                    visibleSatIds={visibleSatIds}
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Satellites</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {scenario.satellites.map((sat) => (
                        <label key={sat.id} className="flex items-center justify-between gap-2 rounded-2xl border border-blush-100 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm">
                          <span className="font-semibold">{sat.name}</span>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-blush-200 text-blush-500 focus:ring-blush-200"
                            checked={visibleSatIds.includes(sat.id)}
                            onChange={() => toggleSatellite(sat.id)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
              {selectedIncident && (
                <div className="rounded-2xl border border-blush-200 bg-blush-50 p-3 text-sm shadow-panel animate-fade-up">
                  <div className="flex w-full flex-wrap items-center justify-between gap-2">
                    <strong className="font-semibold">{selectedIncident.label}</strong>
                    <span className="text-slate-500">
                      {selectedIncident.source} • Observed {selectedIncident.observedUtc}
                      {selectedIncident.ingestedUtc ? ` • Ingested ${selectedIncident.ingestedUtc}` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="order-3 flex flex-col gap-4">
              <MetricsPanel output={output} incidents={filteredIncidents} onSelectIncident={setSelectedIncidentId} />
              <Timeline output={output} scenario={scenario} selectedIncidentId={selectedIncidentId} />
            </div>
          </main>

          <footer className="text-xs text-slate-500">
            <small>Decision-support only. Not a sole source for response. UTC timestamps shown.</small>
          </footer>
        </div>
      </div>
    </div>
  );
}
