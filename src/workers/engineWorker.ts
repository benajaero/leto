import { computeScenario } from '../engine/compute';
import type { EngineMessage } from './protocol';

self.onmessage = (event: MessageEvent<EngineMessage>) => {
  const message = event.data;
  if (message.type === 'run') {
    try {
      const output = computeScenario(message.scenario, message.incidents, (value) => {
        self.postMessage({ type: 'progress', value } satisfies EngineMessage);
      });
      self.postMessage({ type: 'result', output } satisfies EngineMessage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      self.postMessage({
        type: 'error',
        error: errorMessage,
        details: errorStack
      } satisfies EngineMessage);
    }
  }
};
