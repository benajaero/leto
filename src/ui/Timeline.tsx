import { useState } from 'react';
import type { EngineOutput, Scenario } from '../engine/types';
import { haversineKm } from '../engine/geometry';

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

  const formatMinutes = (seconds: number) => `${(seconds / 60).toFixed(1)} min`;
  const [focusNextSixHours, setFocusNextSixHours] = useState(true);
  const focusCutoff = new Date(scenario.startTimeUtc).getTime() + 6 * 3600 * 1000;

  const filterWindow = (startUtc: string) => !focusNextSixHours || new Date(startUtc).getTime() <= focusCutoff;

  const buildWindows = (flags: boolean[], times: string[]) => {
    const result: { startUtc: string; endUtc: string }[] = [];
    let openIndex: number | null = null;
    for (let i = 0; i < flags.length; i += 1) {
      if (flags[i] && openIndex === null) {
        openIndex = i;
      }
      if (!flags[i] && openIndex !== null) {
        result.push({ startUtc: times[openIndex], endUtc: times[i - 1] });
        openIndex = null;
      }
    }
    if (openIndex !== null) {
      result.push({ startUtc: times[openIndex], endUtc: times[times.length - 1] });
    }
    return result;
  };

  const observationWindows = incident
    ? output.satellites.map((sat) => {
        const flags = sat.track.map((point) => haversineKm({ lat: point.lat, lon: point.lon }, { lat: incident.lat, lon: incident.lon }) <= point.footprintKm);
        return {
          satName: sat.name,
          windows: buildWindows(flags, sat.track.map((point) => point.timeUtc))
        };
      })
    : [];

  const servingSatellite = incident?.servingSatellite
    ? output.satellites.find((sat) => sat.name === incident.servingSatellite)
    : null;

  return (
    <section className="rounded-3xl border border-blush-100 bg-white/85 p-6 shadow-panel backdrop-blur motion-safe:animate-fade-up motion-safe:[animation-delay:180ms]">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Timeline</h2>
              <p className="text-xs text-slate-500">Access windows and downlink readiness.</p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-blush-200 text-blush-500 focus:ring-blush-200"
                checked={focusNextSixHours}
                onChange={(event) => setFocusNextSixHours(event.target.checked)}
              />
              Next 6 hours only
            </label>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">AOI Access Windows</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-500">
              {windows.filter((window) => filterWindow(window.startUtc)).slice(0, 10).map((window, idx) => (
                <li key={`${window.satName}-${idx}`}>{window.satName}: {window.startUtc} → {window.endUtc}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-blush-100 bg-white/80 p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Incident Focus</h3>
            {incident ? (
              <ul className="mt-2 space-y-1 text-sm text-slate-500">
                <li>Serving satellite: {incident.servingSatellite ?? 'Unassigned'}</li>
                <li>Tobs: {incident.tFirstObsSeconds === null ? 'No pass' : formatMinutes(incident.tFirstObsSeconds)}</li>
                <li>Tdl: {incident.tFirstDownlinkSeconds === null ? 'No downlink' : formatMinutes(incident.tFirstDownlinkSeconds)}</li>
                {incident.serviceabilityLabel && (
                  <li className="text-blush-600">{incident.serviceabilityLabel}</li>
                )}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Select an incident to view timing.</p>
            )}
          </div>
          {incident && (
            <div>
              <h3 className="text-sm font-semibold">Observation Windows</h3>
              <div className="mt-2 space-y-2 text-sm text-slate-500">
                {observationWindows.map((sat) => (
                  <div key={sat.satName} className="rounded-2xl border border-blush-100 bg-white/80 p-3 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400">{sat.satName}</p>
                    <ul className="mt-1 space-y-1">
                      {sat.windows.filter((window) => filterWindow(window.startUtc)).slice(0, 3).map((window, idx) => (
                        <li key={`${sat.satName}-${idx}`}>{window.startUtc} → {window.endUtc}</li>
                      ))}
                      {sat.windows.length === 0 && <li>No observation windows</li>}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold">Station Contacts (sample)</h3>
            {(servingSatellite ? [servingSatellite] : output.satellites.slice(0, 1)).map((sat) => (
              <div className="mt-2 space-y-2 text-sm text-slate-500" key={sat.id}>
                {scenario.stations.map((station) => {
                  const windows = sat.stationContacts[station.id] ?? [];
                  return (
                    <div key={station.id} className="rounded-2xl border border-blush-100 bg-white/80 p-3 shadow-sm">
                      <p className="text-xs font-semibold text-slate-400">{station.name}</p>
                      <ul className="mt-1 space-y-1">
                        {windows.filter((window) => filterWindow(window.startUtc)).slice(0, 3).map((window, idx) => (
                          <li key={`${station.id}-${idx}`}>{window.startUtc} → {window.endUtc}</li>
                        ))}
                        {windows.length === 0 && <li>No contact</li>}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
