'use client';

import { StatusHeader } from './StatusHeader';
import { IncidentList } from './IncidentList';
import { TacticalMap } from './TacticalMap';
import { IncidentDetail } from './IncidentDetail';

export function CommandView() {
  return (
    <div className="flex h-screen flex-col bg-aerospace-950">
      <StatusHeader />
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
    </div>
  );
}
