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
    <section className="rounded-3xl border border-blush-100 bg-white/85 p-5 shadow-panel backdrop-blur motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">System status</p>
            <p className="text-xs text-slate-500">Monitor data freshness and orbital inputs.</p>
          </div>
          <div className="rounded-full border border-blush-200 bg-blush-50 px-3 py-1 text-[11px] font-semibold text-blush-600">
            Engine progress: {progress}%
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-blush-600">
          {staleFeeds.length > 0 && (
            <span className="rounded-full border border-blush-200 bg-blush-50 px-3 py-1">Stale feeds: {staleFeeds.map((source) => source.name).join(', ')}</span>
          )}
          {tleWarnings.length > 0 && (
            <span className="rounded-full border border-blush-200 bg-blush-50 px-3 py-1">Stale TLEs: {tleWarnings.map((item) => `${item.name} (${item.hours.toFixed(0)}h)`).join(', ')}</span>
          )}
          {dataSources.some((source) => source.fromCache) && (
            <span className="rounded-full border border-blush-200 bg-blush-50 px-3 py-1">Offline/cache mode active</span>
          )}
          {dataSources.length === 0 && (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-400">Awaiting data sources</span>
          )}
          {dataSources.length > 0 && staleFeeds.length === 0 && tleWarnings.length === 0 && !dataSources.some((source) => source.fromCache) && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">All feeds fresh</span>
          )}
        </div>
      </div>
    </section>
  );
}
