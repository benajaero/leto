import { useStore } from './store';

export function DataPanel() {
  const dataSources = useStore((state) => state.dataSources);
  return (
    <section className="panel">
      <h2>About / Data</h2>
      <p>This tool is decision-support only and not a sole source for operational response.</p>
      <div className="panel-list">
        <h3>Sources</h3>
        <ul>
          {dataSources.map((source) => (
            <li key={source.name}>
              <strong>{source.name}</strong> — last updated {source.fetchedUtc} (UTC). {source.disclaimer}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
