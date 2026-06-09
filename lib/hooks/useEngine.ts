import { useEffect, useRef } from 'react';
import type { Scenario, Incident, EngineOutput } from '@/lib/engine/types';
import { computeScenario } from '@/lib/engine/compute';

export function useEngine(
  scenario: Scenario,
  incidents: Incident[],
  onProgress: (value: number) => void,
  onResult: (output: EngineOutput | null) => void,
  onError?: (error: string) => void
) {
  const scenarioRef = useRef(scenario);
  const incidentsRef = useRef(incidents);

  useEffect(() => {
    scenarioRef.current = scenario;
    incidentsRef.current = incidents;
  }, [scenario, incidents]);

  useEffect(() => {
    onProgress(0);
    onResult(null);

    const run = async () => {
      try {
        // Yield to UI thread so progress updates render
        await new Promise((r) => setTimeout(r, 50));
        const output = computeScenario(scenarioRef.current, incidentsRef.current, (value) => {
          onProgress(value);
        });
        onProgress(100);
        onResult(output);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        onError?.(msg);
        onResult(null);
      }
    };

    run();
  }, [scenario.id, scenario.startTimeUtc, scenario.horizonHours, scenario.timestepSec, scenario.aoi.latMin, scenario.aoi.latMax, scenario.aoi.lonMin, scenario.aoi.lonMax, scenario.satellites.length, scenario.stations.length, incidents.length, onProgress, onResult, onError]);
}
