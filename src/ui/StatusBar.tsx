import type { DataSourceStatus } from './store';
import type { Scenario } from '../engine/types';
import { parseTleSatrec, tleEpochUtc } from '../engine/orbit';

function hoursSince(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime();
  return diff / 3600000;
}

export function StatusBar({ progress, dataSources, scenario }: { progress: number; dataSources: DataSourceStatus[]; scenario: Scenario }) {
  const staleFeeds = dataSources.filter((source) => hoursSince(source.fetchedUtc) > 24);
  const tleWarnings = scenario.satellites
    .filter((sat) => sat.type === 'tle')
    .map((sat) => {
      const satrec = parseTleSatrec(sat);
      const epoch = tleEpochUtc(satrec);
      const hours = hoursSince(epoch);
      return { name: sat.name, hours };
    })
    .filter((item) => item.hours > 72);

  return (
    <section className="status">
      <div>Engine progress: {progress}%</div>
      {staleFeeds.length > 0 && <div className="warn">Stale feeds: {staleFeeds.map((source) => source.name).join(', ')}</div>}
      {tleWarnings.length > 0 && <div className="warn">Stale TLEs: {tleWarnings.map((item) => `${item.name} (${item.hours.toFixed(0)}h)`).join(', ')}</div>}
      {dataSources.some((source) => source.fromCache) && <div className="warn">Offline/cache mode active</div>}
    </section>
  );
}
