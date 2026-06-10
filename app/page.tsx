'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useEngine } from '@/lib/hooks/useEngine';
import { fetchFirms } from '@/lib/data/firms';
import { fetchGdacs } from '@/lib/data/gdacs';
import { CommandView } from '@/components/ui/CommandView';

export default function Home() {
  const scenario = useStore((s) => s.scenario);
  const incidents = useStore((s) => s.incidents);
  const mobileView = useStore((s) => s.mobileView);
  const setMobileView = useStore((s) => s.setMobileView);
  const setIncidents = useStore((s) => s.setIncidents);
  const setDataSources = useStore((s) => s.setDataSources);
  const setOutput = useStore((s) => s.setOutput);
  const setProgress = useStore((s) => s.setProgress);
  const setEngineError = useStore((s) => s.setEngineError);

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
      const firms = await fetchFirms(scenario.aoi);
      const gdacs = await fetchGdacs();
      setDataSources([
        {
          name: 'NASA FIRMS',
          fetchedUtc: firms.fetchedUtc,
          fromCache: firms.fromCache,
          disclaimer: 'Near real-time; latency varies by product and region.',
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
        }
      ]);
      setIncidents([...firms.incidents, ...gdacs.incidents]);
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
