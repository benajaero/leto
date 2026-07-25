'use client';

import { useState, useCallback } from 'react';
import { useEngineStore } from '@/lib/stores/engineStore';
import type { Scenario, AOIRect, SatelliteDef, GroundStation } from '@/lib/engine/types';
import { availableSatellites, availableStations, presetAOIs } from '@/lib/data/catalog';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function ScenarioEditor() {
  const scenario = useEngineStore((s) => s.scenario);
  const setScenario = useEngineStore((s) => s.setScenario);

  const [name, setName] = useState(scenario.name);
  const [aoi, setAoi] = useState<AOIRect>(scenario.aoi);
  const [selectedSatIds, setSelectedSatIds] = useState<Set<string>>(
    new Set(scenario.satellites.map((s) => s.id))
  );
  const [selectedStationIds, setSelectedStationIds] = useState<Set<string>>(
    new Set(scenario.stations.map((s) => s.id))
  );
  const [horizonHours, setHorizonHours] = useState<6 | 12 | 24>(scenario.horizonHours);
  const [timestepSec, setTimestepSec] = useState<30 | 60 | 120>(scenario.timestepSec);
  const [startTime, setStartTime] = useState(
    scenario.startTimeUtc.slice(0, 16) // datetime-local format
  );

  const toggleSat = useCallback((id: string) => {
    setSelectedSatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleStation = useCallback((id: string) => {
    setSelectedStationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const apply = () => {
    const sats: SatelliteDef[] = availableSatellites.filter((s) => selectedSatIds.has(s.id));
    const stations: GroundStation[] = availableStations.filter((s) => selectedStationIds.has(s.id));

    const newScenario: Scenario = {
      id: `custom-${Date.now()}`,
      name: name.trim() || 'Custom Scenario',
      startTimeUtc: new Date(startTime).toISOString(),
      horizonHours,
      timestepSec,
      aoi,
      satellites: sats,
      stations,
    };

    setScenario(newScenario);
  };

  const applyPresetAOI = (preset: (typeof presetAOIs)[number]) => {
    setAoi(preset.aoi);
  };

  const isValid =
    selectedSatIds.size > 0 &&
    selectedStationIds.size > 0 &&
    aoi.latMin < aoi.latMax &&
    aoi.lonMin < aoi.lonMax &&
    !Number.isNaN(new Date(startTime).getTime());

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="border-b border-aerospace-700 bg-aerospace-900/80 px-4 py-3 backdrop-blur">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-aerospace-200">
          Scenario Editor
        </h2>
        <p className="mt-0.5 text-readout text-aerospace-500">
          Configure mission parameters and recompute
        </p>
      </div>

      <div className="flex-1 space-y-6 p-4">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-micro font-bold uppercase tracking-wider text-aerospace-500">
            Scenario Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-aerospace-700 bg-aerospace-800 px-3 py-2 text-sm text-aerospace-100 outline-none transition focus:border-signal-500/50"
          />
        </div>

        {/* AOI Presets */}
        <div>
          <label className="mb-1.5 block text-micro font-bold uppercase tracking-wider text-aerospace-500">
            AOI Preset
          </label>
          <div className="flex flex-wrap gap-1.5">
            {presetAOIs.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPresetAOI(p)}
                className="rounded border border-aerospace-700 bg-aerospace-800 px-2 py-1 text-readout text-aerospace-300 transition hover:border-aerospace-600 hover:text-aerospace-100"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* AOI Coordinates */}
        <div>
          <label className="mb-1.5 block text-micro font-bold uppercase tracking-wider text-aerospace-500">
            AOI Bounds
          </label>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Lat Min"
              value={aoi.latMin}
              onChange={(v) => setAoi((prev) => ({ ...prev, latMin: clamp(v, -90, 90) }))}
            />
            <NumberInput
              label="Lat Max"
              value={aoi.latMax}
              onChange={(v) => setAoi((prev) => ({ ...prev, latMax: clamp(v, -90, 90) }))}
            />
            <NumberInput
              label="Lon Min"
              value={aoi.lonMin}
              onChange={(v) => setAoi((prev) => ({ ...prev, lonMin: clamp(v, -180, 180) }))}
            />
            <NumberInput
              label="Lon Max"
              value={aoi.lonMax}
              onChange={(v) => setAoi((prev) => ({ ...prev, lonMax: clamp(v, -180, 180) }))}
            />
          </div>
        </div>

        {/* Horizon */}
        <div>
          <label className="mb-1.5 block text-micro font-bold uppercase tracking-wider text-aerospace-500">
            Horizon
          </label>
          <SegmentedControl
            options={[
              { value: 6, label: '6h' },
              { value: 12, label: '12h' },
              { value: 24, label: '24h' },
            ]}
            value={horizonHours}
            onChange={(v) => setHorizonHours(v as 6 | 12 | 24)}
          />
        </div>

        {/* Timestep */}
        <div>
          <label className="mb-1.5 block text-micro font-bold uppercase tracking-wider text-aerospace-500">
            Timestep
          </label>
          <SegmentedControl
            options={[
              { value: 30, label: '30s' },
              { value: 60, label: '60s' },
              { value: 120, label: '120s' },
            ]}
            value={timestepSec}
            onChange={(v) => setTimestepSec(v as 30 | 60 | 120)}
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="mb-1.5 block text-micro font-bold uppercase tracking-wider text-aerospace-500">
            Start Time (UTC)
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded border border-aerospace-700 bg-aerospace-800 px-3 py-2 text-sm text-aerospace-100 outline-none transition focus:border-signal-500/50"
          />
        </div>

        {/* Satellites */}
        <div>
          <label className="mb-1.5 block text-micro font-bold uppercase tracking-wider text-aerospace-500">
            Satellites ({selectedSatIds.size})
          </label>
          <div className="space-y-1">
            {availableSatellites.map((sat) => (
              <label
                key={sat.id}
                className="flex cursor-pointer items-center gap-2 rounded border border-aerospace-800 bg-aerospace-900 px-2.5 py-1.5 transition hover:bg-aerospace-800/60"
              >
                <input
                  type="checkbox"
                  checked={selectedSatIds.has(sat.id)}
                  onChange={() => toggleSat(sat.id)}
                  className="h-3.5 w-3.5 accent-signal-500"
                />
                <span className="text-xs text-aerospace-200">{sat.name}</span>
                <span className="ml-auto text-micro text-aerospace-500">
                  {sat.type === 'tle' ? 'TLE' : `${sat.altitudeKm}km`}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Stations */}
        <div>
          <label className="mb-1.5 block text-micro font-bold uppercase tracking-wider text-aerospace-500">
            Ground Stations ({selectedStationIds.size})
          </label>
          <div className="space-y-1">
            {availableStations.map((st) => (
              <label
                key={st.id}
                className="flex cursor-pointer items-center gap-2 rounded border border-aerospace-800 bg-aerospace-900 px-2.5 py-1.5 transition hover:bg-aerospace-800/60"
              >
                <input
                  type="checkbox"
                  checked={selectedStationIds.has(st.id)}
                  onChange={() => toggleStation(st.id)}
                  className="h-3.5 w-3.5 accent-signal-500"
                />
                <span className="text-xs text-aerospace-200">{st.name}</span>
                <span className="ml-auto font-mono text-micro text-aerospace-500">
                  {st.lat.toFixed(1)}°, {st.lon.toFixed(1)}°
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Apply */}
        <div className="pt-2">
          <button
            onClick={apply}
            disabled={!isValid}
            className="w-full rounded bg-signal-500/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-signal-400 transition hover:bg-signal-500/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-signal-500/20"
          >
            {isValid ? 'Apply Scenario & Recompute' : 'Invalid Configuration'}
          </button>
          {!isValid && (
            <p className="mt-1.5 text-center text-readout text-status-bad">
              Select at least one satellite and one station, and ensure AOI bounds are valid.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <span className="mb-0.5 block text-micro text-aerospace-500">{label}</span>
      <input
        type="number"
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full rounded border border-aerospace-700 bg-aerospace-800 px-2 py-1.5 font-mono text-xs text-aerospace-100 outline-none transition focus:border-signal-500/50"
      />
    </div>
  );
}

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded border border-aerospace-700 bg-aerospace-800 overflow-hidden">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-1.5 text-readout font-bold uppercase tracking-wider transition ${
            value === opt.value
              ? 'bg-signal-500/20 text-signal-400'
              : 'text-aerospace-400 hover:text-aerospace-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
