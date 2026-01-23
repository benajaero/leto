import { useEffect, useMemo } from 'react';
import type { EngineMessage } from '../workers/protocol';
import type { Scenario, Incident } from '../engine/types';

export function useEngine(
  scenario: Scenario,
  incidents: Incident[],
  onProgress: (value: number) => void,
  onResult: (output: any) => void
) {
  const worker = useMemo(() => new Worker(new URL('../workers/engineWorker.ts', import.meta.url), { type: 'module' }), []);

  useEffect(() => {
    worker.onmessage = (event: MessageEvent<EngineMessage>) => {
      const message = event.data;
      if (message.type === 'progress') {
        onProgress(message.value);
      }
      if (message.type === 'result') {
        onResult(message.output);
      }
    };
    return () => {
      worker.terminate();
    };
  }, [worker, onProgress, onResult]);

  useEffect(() => {
    worker.postMessage({ type: 'run', scenario, incidents } satisfies EngineMessage);
  }, [worker, scenario, incidents]);
}
