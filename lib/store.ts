// Backward-compatible re-export of split stores
// New code should import directly from '@/lib/stores/engineStore' or '@/lib/stores/uiStore'

export { useEngineStore } from './stores/engineStore';
export { useUIStore } from './stores/uiStore';
export type { DataSourceStatus } from './stores/uiStore';
