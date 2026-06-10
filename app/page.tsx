'use client';

import { useEffect } from 'react';
import { useEngineStore } from '@/lib/stores/engineStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { useEngine } from '@/lib/hooks/useEngine';
import { fetchFirms } from '@/lib/data/firms';
import { fetchGdacs } from '@/lib/data/gdacs';
import { fetchEonet } from '@/lib/data/eonet';
import { fetchUsgs } from '@/lib/data/usgs';
import { CommandView } from '@/components/ui/CommandView';

export default function Home() {
  const scenario = useEngineStore((s) => s.scenario);
  const incidents = useEngineStore((s) => s.incidents);
  const mobileView = useUIStore((s) => s.mobileView);
  const setMobileView = useUIStore((s) => s.setMobileView);
  const setIncidents = useEngineStore((s) => s.setIncidents);
  const setDataSources = useUIStore((s) => s.setDataSources);
  const setOutput = useEngineStore((s) => s.setOutput);
  const setProgress = useEngineStore((s) => s.setProgress);
  const setEngineError = useEngineStore((s) => s.setEngineError);

  // Sync mobileView with URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const mv = params.get('mv');
    if (mv === 'list' || mv === 'map' || mv === 'detail') {
      setMobileView(mv);
    }
  }, [setMobileView]);

  // Sync URL when mobileView changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('mv', mobileView);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [mobileView]);

  useEffect(() => {
    const load = async () => {
      const [firms, gdacs, eonet, usgs] = await Promise.all([
        fetchFirms(scenario.aoi),
        fetchGdacs(),
        fetchEonet(),
        fetchUsgs()
      ]);
      setDataSources([
        {
          name: 'NASA FIRMS',
          fetchedUtc: firms.fetchedUtc,
          fromCache: firms.fromCache,
          disclaimer: firms.usingLiveApi ? 'Live API data' : 'Sample data (add API key for live data)',
          sourceUrl: firms.sourceUrl,
          offline: firms.offline
        },
        {
          name: 'GDACS',
          fetchedUtc: gdacs.fetchedUtc,
          fromCache: gdacs.fromCache,
          disclaimer: 'Automated alerts; verify event details with official sources.',
          sourceUrl: gdacs.sourceUrl,
          offline: gdacs.offline
        },
        {
          name: 'NASA EONET',
          fetchedUtc: eonet.fetchedUtc,
          fromCache: eonet.fromCache,
          disclaimer: 'Open natural event tracker.',
          sourceUrl: eonet.sourceUrl,
          offline: eonet.offline
        },
        {
          name: 'USGS Earthquakes',
          fetchedUtc: usgs.fetchedUtc,
          fromCache: usgs.fromCache,
          disclaimer: 'M2.5+ earthquakes from past 24h.',
          sourceUrl: usgs.sourceUrl,
          offline: usgs.offline
        }
      ]);
      setIncidents([...firms.incidents, ...gdacs.incidents, ...eonet.incidents, ...usgs.incidents]);
    };
    load();
  }, [scenario, setIncidents, setDataSources]);

  useEngine(
    scenario,
    incidents,
    (value) => setProgress(value),
    (output) => setOutput(output),
    (error) => setEngineError(error)
  );

  return <CommandView />;
}
