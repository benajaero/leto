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
  const onProgressRef = useRef(onProgress);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    scenarioRef.current = scenario;
    incidentsRef.current = incidents;
    onProgressRef.current = onProgress;
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    onProgressRef.current(0);
    onResultRef.current(null);

    const run = async () => {
      try {
        // Yield to UI thread so progress updates render
        await new Promise((r) => setTimeout(r, 50));
        const output = computeScenario(scenarioRef.current, incidentsRef.current, (value) => {
          onProgressRef.current(value);
        });
        onProgressRef.current(100);
        onResultRef.current(output);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        onErrorRef.current?.(msg);
        onResultRef.current(null);
      }
    };

    run();
  }, [scenario.id, scenario.startTimeUtc, scenario.horizonHours, scenario.timestepSec, scenario.aoi.latMin, scenario.aoi.latMax, scenario.aoi.lonMin, scenario.aoi.lonMax, scenario.satellites.length, scenario.stations.length, incidents.length]);
}
