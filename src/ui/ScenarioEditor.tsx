import { useMemo, useRef, useState } from 'react';
import { useStore } from './store';
import type { SatelliteCircular, SatelliteTle, GroundStation, Scenario } from '../engine/types';
import { scenarios } from '../data/scenarios';

function updateScenario(scenario: Scenario, update: Partial<Scenario>): Scenario {
  return { ...scenario, ...update };
}

export function ScenarioEditor({
  onExportScenario,
  onImportScenario
}: {
  onExportScenario?: () => void;
  onImportScenario?: (file: File) => void;
}) {
  const scenario = useStore((state) => state.scenario);
  const setScenario = useStore((state) => state.setScenario);

  const [tleText, setTleText] = useState('');
  const [satName, setSatName] = useState('');
  const [orbitInputs, setOrbitInputs] = useState({ altitudeKm: 550, inclinationDeg: 97, raanDeg: 0, meanAnomalyDeg: 0 });
  const [stationInputs, setStationInputs] = useState({ name: '', lat: -35, lon: 149, maskDeg: 10 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scenarioOptions = useMemo(() => scenarios, []);

  const addTleSat = () => {
    const lines = tleText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return;
    const newSat: SatelliteTle = {
      id: `sat-${Date.now()}`,
      name: satName || `TLE-${scenario.satellites.length + 1}`,
      type: 'tle',
      line1: lines[0],
      line2: lines[1]
    };
    setScenario(updateScenario(scenario, { satellites: [...scenario.satellites, newSat] }));
    setTleText('');
    setSatName('');
  };

  const addCircularSat = () => {
    const newSat: SatelliteCircular = {
      id: `sat-${Date.now()}`,
      name: satName || `Circular-${scenario.satellites.length + 1}`,
      type: 'circular',
      ...orbitInputs
    };
    setScenario(updateScenario(scenario, { satellites: [...scenario.satellites, newSat] }));
    setSatName('');
  };

  const addStation = () => {
    const newStation: GroundStation = {
      id: `station-${Date.now()}`,
      name: stationInputs.name || `Station-${scenario.stations.length + 1}`,
      lat: stationInputs.lat,
      lon: stationInputs.lon,
      maskDeg: stationInputs.maskDeg
    };
    setScenario(updateScenario(scenario, { stations: [...scenario.stations, newStation] }));
    setStationInputs({ name: '', lat: stationInputs.lat, lon: stationInputs.lon, maskDeg: stationInputs.maskDeg });
  };

  return (
    <section className="rounded-3xl border border-blush-100 bg-white/85 p-6 shadow-panel backdrop-blur motion-safe:animate-fade-up motion-safe:[animation-delay:120ms]">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Scenario Editor</h2>
          <p className="text-xs text-slate-500">Configure the satellite plan before running analysis.</p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Scenario setup</p>
            <p className="text-xs text-slate-500">Select a preset and tune the simulation window.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <div className="mb-2 text-xs font-semibold text-slate-500">Preset</div>
              <select
                className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
                value={scenario.id}
                onChange={(event) => {
                  const next = scenarioOptions.find((item) => item.id === event.target.value);
                  if (next) {
                    setScenario(next);
                  }
                }}
              >
                {scenarioOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <div className="mb-2 text-xs font-semibold text-slate-500">Time Window</div>
              <select
                className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
                value={scenario.horizonHours}
                onChange={(event) => setScenario(updateScenario(scenario, { horizonHours: Number(event.target.value) as Scenario['horizonHours'] }))}
              >
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
              </select>
            </label>

            <label>
              <div className="mb-2 text-xs font-semibold text-slate-500">Timestep</div>
              <select
                className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
                value={scenario.timestepSec}
                onChange={(event) => setScenario(updateScenario(scenario, { timestepSec: Number(event.target.value) as Scenario['timestepSec'] }))}
              >
                <option value={30}>30 s</option>
                <option value={60}>60 s</option>
                <option value={120}>120 s</option>
              </select>
            </label>
          </div>
        </div>

        <div className="h-px w-full bg-blush-100" />

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Area of interest</p>
            <p className="text-xs text-slate-500">Define the AOI rectangle the engine will optimize for.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label>
              <div className="mb-2 text-xs font-semibold text-slate-500">Lat min</div>
              <input
                className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
                type="number"
                value={scenario.aoi.latMin}
                onChange={(event) => setScenario(updateScenario(scenario, { aoi: { ...scenario.aoi, latMin: Number(event.target.value) } }))}
              />
            </label>
            <label>
              <div className="mb-2 text-xs font-semibold text-slate-500">Lat max</div>
              <input
                className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
                type="number"
                value={scenario.aoi.latMax}
                onChange={(event) => setScenario(updateScenario(scenario, { aoi: { ...scenario.aoi, latMax: Number(event.target.value) } }))}
              />
            </label>
            <label>
              <div className="mb-2 text-xs font-semibold text-slate-500">Lon min</div>
              <input
                className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
                type="number"
                value={scenario.aoi.lonMin}
                onChange={(event) => setScenario(updateScenario(scenario, { aoi: { ...scenario.aoi, lonMin: Number(event.target.value) } }))}
              />
            </label>
            <label>
              <div className="mb-2 text-xs font-semibold text-slate-500">Lon max</div>
              <input
                className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
                type="number"
                value={scenario.aoi.lonMax}
                onChange={(event) => setScenario(updateScenario(scenario, { aoi: { ...scenario.aoi, lonMax: Number(event.target.value) } }))}
              />
            </label>
          </div>
        </div>

        <div className="h-px w-full bg-blush-100" />

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Satellite inputs</p>
            <p className="text-xs text-slate-500">Add TLE or circular orbits to the scenario.</p>
          </div>
          <label>
            <div className="mb-2 text-xs font-semibold text-slate-500">Satellite Name</div>
            <input
              className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
              value={satName}
              onChange={(event) => setSatName(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <div className="space-y-2 rounded-2xl border border-blush-100 bg-white/80 p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Add by TLE</p>
                <p className="text-xs text-slate-500">Paste the two line element set.</p>
              </div>
              <button className="rounded-full bg-blush-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-blush-600 transition" onClick={addTleSat}>Add TLE</button>
            </div>
            <textarea
              className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
              value={tleText}
              onChange={(event) => setTleText(event.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2 rounded-2xl border border-blush-100 bg-white/80 p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Add Circular Orbit</p>
                <p className="text-xs text-slate-500">Define a simple orbital plane.</p>
              </div>
              <button className="rounded-full bg-blush-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-blush-600 transition" onClick={addCircularSat}>Add Orbit</button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
                type="number"
                value={orbitInputs.altitudeKm}
                onChange={(event) => setOrbitInputs({ ...orbitInputs, altitudeKm: Number(event.target.value) })}
                placeholder="Altitude km"
              />
              <input
                className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
                type="number"
                value={orbitInputs.inclinationDeg}
                onChange={(event) => setOrbitInputs({ ...orbitInputs, inclinationDeg: Number(event.target.value) })}
                placeholder="Inclination deg"
              />
              <input
                className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
                type="number"
                value={orbitInputs.raanDeg}
                onChange={(event) => setOrbitInputs({ ...orbitInputs, raanDeg: Number(event.target.value) })}
                placeholder="RAAN deg"
              />
              <input
                className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
                type="number"
                value={orbitInputs.meanAnomalyDeg}
                onChange={(event) => setOrbitInputs({ ...orbitInputs, meanAnomalyDeg: Number(event.target.value) })}
                placeholder="Mean Anomaly deg"
              />
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-blush-100" />

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Ground stations</p>
            <p className="text-xs text-slate-500">Attach stations for downlink windows.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
              value={stationInputs.name}
              onChange={(event) => setStationInputs({ ...stationInputs, name: event.target.value })}
              placeholder="Name"
            />
            <input
              className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
              type="number"
              value={stationInputs.lat}
              onChange={(event) => setStationInputs({ ...stationInputs, lat: Number(event.target.value) })}
              placeholder="Lat"
            />
            <input
              className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
              type="number"
              value={stationInputs.lon}
              onChange={(event) => setStationInputs({ ...stationInputs, lon: Number(event.target.value) })}
              placeholder="Lon"
            />
            <input
              className="w-full rounded-2xl border border-blush-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-200"
              type="number"
              value={stationInputs.maskDeg}
              onChange={(event) => setStationInputs({ ...stationInputs, maskDeg: Number(event.target.value) })}
              placeholder="Mask deg"
            />
          </div>
          <button className="w-fit rounded-full bg-blush-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blush-600 transition" onClick={addStation}>Add Station</button>
        </div>

        <div className="h-px w-full bg-blush-100" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Satellites</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-500">
              {scenario.satellites.map((sat) => (
                <li key={sat.id}>{sat.name} ({sat.type})</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Stations</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-500">
              {scenario.stations.map((station) => (
                <li key={station.id}>{station.name} ({station.lat.toFixed(1)}, {station.lon.toFixed(1)})</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-px w-full bg-blush-100" />

        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">Scenario JSON</p>
            <p className="text-xs text-slate-500">Export or import scenario settings for reuse.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-blush-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blush-600 transition"
              onClick={onExportScenario}
            >
              Export Scenario
            </button>
            <button
              type="button"
              className="rounded-full border border-blush-200 bg-white px-4 py-2 text-xs font-semibold text-blush-600 shadow-sm hover:border-blush-300 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              Import Scenario
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && onImportScenario) {
                  onImportScenario(file);
                }
                event.currentTarget.value = '';
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
