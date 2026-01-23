import type { Incident, Scenario, EngineOutput } from '../engine/types';

export type EngineRequest = {
  type: 'run';
  scenario: Scenario;
  incidents: Incident[];
};

export type EngineProgress = {
  type: 'progress';
  value: number;
};

export type EngineResponse = {
  type: 'result';
  output: EngineOutput;
};

export type EngineMessage = EngineRequest | EngineProgress | EngineResponse;
