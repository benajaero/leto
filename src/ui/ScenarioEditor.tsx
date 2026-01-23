import { useMemo, useState } from 'react';
import { useStore } from './store';
import type { SatelliteCircular, SatelliteTle, GroundStation, Scenario } from '../engine/types';
import { scenarios } from '../data/scenarios';

function updateScenario(scenario: Scenario, update: Partial<Scenario>): Scenario {
  return { ...scenario, ...update };
}

export function ScenarioEditor() {
  const scenario = useStore((state) => state.scenario);
  const setScenario = useStore((state) => state.setScenario);

  const [tleText, setTleText] = useState('');
  const [satName, setSatName] = useState('');
  const [orbitInputs, setOrbitInputs] = useState({ altitudeKm: 550, inclinationDeg: 97, raanDeg: 0, meanAnomalyDeg: 0 });
  const [stationInputs, setStationInputs] = useState({ name: '', lat: -35, lon: 149, maskDeg: 10 });

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
    <section className="panel">
      <h2>Scenario Editor</h2>
      <div className="field">
        <label>Preset</label>
        <select
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
      </div>

      <div className="field">
        <label>Time Window</label>
        <select
          value={scenario.horizonHours}
          onChange={(event) => setScenario(updateScenario(scenario, { horizonHours: Number(event.target.value) as Scenario['horizonHours'] }))}
        >
          <option value={6}>6 hours</option>
          <option value={12}>12 hours</option>
          <option value={24}>24 hours</option>
        </select>
      </div>
      <div className="field">
        <label>Timestep</label>
        <select
          value={scenario.timestepSec}
          onChange={(event) => setScenario(updateScenario(scenario, { timestepSec: Number(event.target.value) as Scenario['timestepSec'] }))}
        >
          <option value={30}>30 s</option>
          <option value={60}>60 s</option>
          <option value={120}>120 s</option>
        </select>
      </div>

      <div className="field">
        <label>AOI Rectangle (lat/lon)</label>
        <div className="grid-4">
          <input
            type="number"
            value={scenario.aoi.latMin}
            onChange={(event) => setScenario(updateScenario(scenario, { aoi: { ...scenario.aoi, latMin: Number(event.target.value) } }))}
          />
          <input
            type="number"
            value={scenario.aoi.latMax}
            onChange={(event) => setScenario(updateScenario(scenario, { aoi: { ...scenario.aoi, latMax: Number(event.target.value) } }))}
          />
          <input
            type="number"
            value={scenario.aoi.lonMin}
            onChange={(event) => setScenario(updateScenario(scenario, { aoi: { ...scenario.aoi, lonMin: Number(event.target.value) } }))}
          />
          <input
            type="number"
            value={scenario.aoi.lonMax}
            onChange={(event) => setScenario(updateScenario(scenario, { aoi: { ...scenario.aoi, lonMax: Number(event.target.value) } }))}
          />
        </div>
      </div>

      <div className="field">
        <label>Satellite Name</label>
        <input value={satName} onChange={(event) => setSatName(event.target.value)} placeholder="Optional" />
      </div>

      <div className="field">
        <label>Add by TLE (two lines)</label>
        <textarea value={tleText} onChange={(event) => setTleText(event.target.value)} rows={3} />
        <button onClick={addTleSat}>Add TLE Satellite</button>
      </div>

      <div className="field">
        <label>Add Circular Orbit</label>
        <div className="grid-4">
          <input
            type="number"
            value={orbitInputs.altitudeKm}
            onChange={(event) => setOrbitInputs({ ...orbitInputs, altitudeKm: Number(event.target.value) })}
            placeholder="Altitude km"
          />
          <input
            type="number"
            value={orbitInputs.inclinationDeg}
            onChange={(event) => setOrbitInputs({ ...orbitInputs, inclinationDeg: Number(event.target.value) })}
            placeholder="Inclination deg"
          />
          <input
            type="number"
            value={orbitInputs.raanDeg}
            onChange={(event) => setOrbitInputs({ ...orbitInputs, raanDeg: Number(event.target.value) })}
            placeholder="RAAN deg"
          />
          <input
            type="number"
            value={orbitInputs.meanAnomalyDeg}
            onChange={(event) => setOrbitInputs({ ...orbitInputs, meanAnomalyDeg: Number(event.target.value) })}
            placeholder="Mean Anomaly deg"
          />
        </div>
        <button onClick={addCircularSat}>Add Circular Satellite</button>
      </div>

      <div className="field">
        <label>Add Ground Station</label>
        <div className="grid-4">
          <input
            value={stationInputs.name}
            onChange={(event) => setStationInputs({ ...stationInputs, name: event.target.value })}
            placeholder="Name"
          />
          <input
            type="number"
            value={stationInputs.lat}
            onChange={(event) => setStationInputs({ ...stationInputs, lat: Number(event.target.value) })}
            placeholder="Lat"
          />
          <input
            type="number"
            value={stationInputs.lon}
            onChange={(event) => setStationInputs({ ...stationInputs, lon: Number(event.target.value) })}
            placeholder="Lon"
          />
          <input
            type="number"
            value={stationInputs.maskDeg}
            onChange={(event) => setStationInputs({ ...stationInputs, maskDeg: Number(event.target.value) })}
            placeholder="Mask deg"
          />
        </div>
        <button onClick={addStation}>Add Station</button>
      </div>

      <div className="panel-list">
        <h3>Satellites</h3>
        <ul>
          {scenario.satellites.map((sat) => (
            <li key={sat.id}>{sat.name} ({sat.type})</li>
          ))}
        </ul>
      </div>
      <div className="panel-list">
        <h3>Stations</h3>
        <ul>
          {scenario.stations.map((station) => (
            <li key={station.id}>{station.name} ({station.lat.toFixed(1)}, {station.lon.toFixed(1)})</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
