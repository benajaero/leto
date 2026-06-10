'use client';

import { useUIStore } from '@/lib/stores/uiStore';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/lib/hooks/useMediaQuery';
import { StatusHeader } from './StatusHeader';
import { IncidentList } from './IncidentList';
import { TacticalMapLeaflet } from './TacticalMapLeaflet';
import { IncidentDetail } from './IncidentDetail';
import { MobileNav } from './MobileNav';
import { PassTimeline } from './PassTimeline';
import { DataSourceFooter } from './DataSourceFooter';
import { ScenarioEditor } from './ScenarioEditor';

function CommandLayout() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const mobileView = useUIStore((s) => s.mobileView);
  const selectedId = useUIStore((s) => s.selectedIncidentId);

  if (isDesktop) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[340px] shrink-0">
            <IncidentList />
          </div>
          <div className="flex flex-1 flex-col">
            <TacticalMapLeaflet />
          </div>
          <div className="w-[380px] shrink-0">
            <IncidentDetail />
          </div>
        </div>
        <div className="h-[200px] shrink-0 border-t border-aerospace-700">
          <PassTimeline />
        </div>
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="relative flex flex-1 overflow-hidden">
          <div className="w-[300px] shrink-0">
            <IncidentList />
          </div>
          <div className="flex flex-1 flex-col">
            <TacticalMapLeaflet />
          </div>
          {selectedId && (
            <div className="absolute right-0 top-0 h-full w-[340px] shadow-2xl">
              <IncidentDetail />
            </div>
          )}
        </div>
        <div className="h-[160px] shrink-0 border-t border-aerospace-700">
          <PassTimeline />
        </div>
      </div>
    );
  }

  // Mobile
  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden pb-16">
        {mobileView === 'list' && <IncidentList />}
        {mobileView === 'map' && <TacticalMapLeaflet />}
        {mobileView === 'detail' && <IncidentDetail />}
      </div>
      <MobileNav />
    </>
  );
}

export function CommandView() {
  const viewMode = useUIStore((s) => s.viewMode);
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen flex-col bg-aerospace-950">
      <StatusHeader />

      {viewMode === 'command' && <CommandLayout />}
      {viewMode === 'map' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <TacticalMapLeaflet />
        </div>
      )}
      {viewMode === 'timeline' && (
        <div className="flex-1 overflow-hidden">
          <PassTimeline />
        </div>
      )}
      {viewMode === 'metrics' && (
        <div className="flex flex-1 items-center justify-center text-aerospace-400">
          <div className="text-center">
            <p className="text-sm font-semibold">Metrics Dashboard</p>
            <p className="mt-1 text-xs text-aerospace-500">Coming soon</p>
          </div>
        </div>
      )}
      {viewMode === 'scenario' && (
        <div className="flex-1 overflow-hidden">
          <ScenarioEditor />
        </div>
      )}

      {!isMobile && <DataSourceFooter />}
    </div>
  );
}
