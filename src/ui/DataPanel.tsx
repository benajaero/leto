import { useStore } from './store';

export function DataPanel() {
  const dataSources = useStore((state) => state.dataSources);
  return (
    <section className="rounded-3xl border border-blush-100 bg-white/85 p-6 shadow-panel backdrop-blur motion-safe:animate-fade-up motion-safe:[animation-delay:160ms]">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">About / Data</h2>
          <p className="text-xs text-slate-500">Decision-support only. Cross-check with official sources.</p>
        </div>
        <div className="space-y-3 rounded-2xl border border-blush-100 bg-white/80 p-4 text-sm text-slate-500 shadow-sm">
          {dataSources.map((source) => (
            <div key={source.name} className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-800">{source.name}</span>
                <span className="rounded-full border border-blush-200 bg-white px-3 py-1 text-[11px] font-semibold text-blush-600">Updated {source.fetchedUtc} UTC</span>
              </div>
              <p>{source.disclaimer}</p>
              <a className="text-xs font-semibold text-blush-600 hover:text-blush-700" href={source.sourceUrl} target="_blank" rel="noreferrer">
                Source attribution
              </a>
            </div>
          ))}
        </div>
        <div className="space-y-2 rounded-2xl border border-blush-100 bg-white/80 p-4 text-sm text-slate-500 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Limitations</p>
          <ul className="space-y-1">
            <li>FIRMS is near real-time, not instant; interpret timestamps and latency notes carefully.</li>
            <li>SGP4 + TLE prediction accuracy degrades as elements become stale.</li>
            <li>Coverage/heatmap and AOI access are simplified decision-support estimates.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
