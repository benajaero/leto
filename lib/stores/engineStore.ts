import { create } from 'zustand';
import type { Scenario, Incident, EngineOutput } from '../engine/types';
import { scenarios } from '../data/scenarios';

type EngineState = {
  scenario: Scenario;
  incidents: Incident[];
  output: EngineOutput | null;
  progress: number;
  engineError: string | null;
  setScenario: (scenario: Scenario) => void;
  setIncidents: (incidents: Incident[]) => void;
  setOutput: (output: EngineOutput | null) => void;
  setProgress: (progress: number) => void;
  setEngineError: (error: string | null) => void;
};

export const useEngineStore = create<EngineState>((set) => ({
  scenario: scenarios[0],
  incidents: [],
  output: null,
  progress: 0,
  engineError: null,
  setScenario: (scenario) => set({ scenario }),
  setIncidents: (incidents) => set({ incidents }),
  setOutput: (output) => set({ output }),
  setProgress: (progress) => set({ progress }),
  setEngineError: (engineError) => set({ engineError })
}));
