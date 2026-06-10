'use client';

import { useStore } from '@/lib/store';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/lib/hooks/useMediaQuery';
import { StatusHeader } from './StatusHeader';
import { IncidentList } from './IncidentList';
import { TacticalMap } from './TacticalMap';
import { IncidentDetail } from './IncidentDetail';
import { MobileNav } from './MobileNav';

export function CommandView() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const mobileView = useStore((s) => s.mobileView);
  const selectedId = useStore((s) => s.selectedIncidentId);

  return (
    <div className="flex h-screen flex-col bg-aerospace-950">
      <StatusHeader />

      {/* Desktop: 3-column layout */}
      {isDesktop && (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[320px] shrink-0">
            <IncidentList />
          </div>
          <div className="flex-1">
            <TacticalMap />
          </div>
          <div className="w-[360px] shrink-0">
            <IncidentDetail />
          </div>
        </div>
      )}

      {/* Tablet: 2-column + detail drawer */}
      {isTablet && (
        <div className="relative flex flex-1 overflow-hidden">
          <div className="w-[300px] shrink-0">
            <IncidentList />
          </div>
          <div className="flex-1">
            <TacticalMap />
          </div>
          {selectedId && (
            <div className="absolute right-0 top-0 h-full w-[340px] shadow-2xl">
              <IncidentDetail />
            </div>
          )}
        </div>
      )}

      {/* Mobile: single view with bottom nav */}
      {isMobile && (
        <>
          <div className="flex-1 overflow-hidden pb-16">
            {mobileView === 'list' && <IncidentList />}
            {mobileView === 'map' && <TacticalMap />}
            {mobileView === 'detail' && <IncidentDetail />}
          </div>
          <MobileNav />
        </>
      )}
    </div>
  );
}
