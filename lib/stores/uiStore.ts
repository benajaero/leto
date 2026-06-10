import { create } from 'zustand';

export type DataSourceStatus = {
  name: string;
  fetchedUtc: string;
  fromCache: boolean;
  disclaimer: string;
  sourceUrl: string;
  offline: boolean;
};

export type ViewMode = 'command' | 'map' | 'timeline' | 'metrics' | 'scenario';

type UIState = {
  selectedIncidentId: string | null;
  dataSources: DataSourceStatus[];
  viewMode: ViewMode;
  mobileView: 'list' | 'map' | 'detail';
  setSelectedIncidentId: (id: string | null) => void;
  setDataSources: (sources: DataSourceStatus[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setMobileView: (mode: 'list' | 'map' | 'detail') => void;
};

export const useUIStore = create<UIState>((set) => ({
  selectedIncidentId: null,
  dataSources: [],
  viewMode: 'command',
  mobileView: 'list',
  setSelectedIncidentId: (selectedIncidentId) => set({ selectedIncidentId }),
  setDataSources: (dataSources) => set({ dataSources }),
  setViewMode: (viewMode) => set({ viewMode }),
  setMobileView: (mobileView) => set({ mobileView })
}));
