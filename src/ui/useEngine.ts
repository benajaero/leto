import { useEffect, useMemo } from 'react';
import type { EngineMessage } from '../workers/protocol';
import type { Scenario, Incident, EngineOutput } from '../engine/types';

export function useEngine(
  scenario: Scenario,
  incidents: Incident[],
  onProgress: (value: number) => void,
  onResult: (output: EngineOutput | null) => void,
  onError?: (error: string) => void
) {
  const worker = useMemo(() => new Worker(new URL('../workers/engineWorker.ts', import.meta.url), { type: 'module' }), []);

  useEffect(() => {
    const handler = (event: MessageEvent<EngineMessage>) => {
      const message = event.data;
      if (message.type === 'progress') {
        onProgress(message.value);
      }
      if (message.type === 'result') {
        onResult(message.output);
      }
      if (message.type === 'error') {
        onResult(null);
        onError?.(message.error);
      }
    };
    worker.onmessage = handler;
    return () => {
      worker.terminate();
    };
  }, [worker, onProgress, onResult, onError]);

  useEffect(() => {
    onProgress(0);
    onResult(null);
    worker.postMessage({ type: 'run', scenario, incidents } satisfies EngineMessage);
  }, [worker, scenario, incidents, onProgress, onResult]);
}
