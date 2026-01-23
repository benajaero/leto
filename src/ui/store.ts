import { create } from 'zustand';
import type { Scenario, Incident, EngineOutput } from '../engine/types';
import { scenarios } from '../data/scenarios';

export type DataSourceStatus = {
  name: string;
  fetchedUtc: string;
  fromCache: boolean;
  disclaimer: string;
  sourceUrl: string;
};

type StoreState = {
  scenario: Scenario;
  incidents: Incident[];
  output: EngineOutput | null;
  progress: number;
  selectedIncidentId: string | null;
  dataSources: DataSourceStatus[];
  setScenario: (scenario: Scenario) => void;
  setIncidents: (incidents: Incident[]) => void;
  setOutput: (output: EngineOutput | null) => void;
  setProgress: (progress: number) => void;
  setSelectedIncidentId: (id: string | null) => void;
  setDataSources: (sources: DataSourceStatus[]) => void;
};

export const useStore = create<StoreState>((set) => ({
  scenario: scenarios[0],
  incidents: [],
  output: null,
  progress: 0,
  selectedIncidentId: null,
  dataSources: [],
  setScenario: (scenario) => set({ scenario }),
  setIncidents: (incidents) => set({ incidents }),
  setOutput: (output) => set({ output }),
  setProgress: (progress) => set({ progress }),
  setSelectedIncidentId: (selectedIncidentId) => set({ selectedIncidentId }),
  setDataSources: (dataSources) => set({ dataSources })
}));
