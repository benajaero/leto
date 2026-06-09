import type { Incident, Scenario, EngineOutput } from '@/lib/engine/types';

export type EngineRequest = {
  type: 'run';
  scenario: Scenario;
  incidents: Incident[];
};

export type EngineProgress = {
  type: 'progress';
  value: number;
};

export type EngineError = {
  type: 'error';
  error: string;
  details?: string;
};

export type EngineResponse = {
  type: 'result';
  output: EngineOutput;
};

export type EngineMessage = EngineRequest | EngineProgress | EngineResponse | EngineError;
