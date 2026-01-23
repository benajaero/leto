import { computeScenario } from '../engine/compute';
import type { EngineMessage } from './protocol';

self.onmessage = (event: MessageEvent<EngineMessage>) => {
  const message = event.data;
  if (message.type === 'run') {
    const output = computeScenario(message.scenario, message.incidents, (value) => {
      self.postMessage({ type: 'progress', value } satisfies EngineMessage);
    });
    self.postMessage({ type: 'result', output } satisfies EngineMessage);
  }
};
