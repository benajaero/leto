'use client';

import { useState } from 'react';
import { PassSchedule } from './PassSchedule';
import { ScenarioEditor } from './ScenarioEditor';

type ExploreTab = 'schedule' | 'editor';

export function ExploreView() {
  const [tab, setTab] = useState<ExploreTab>('schedule');

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-aerospace-700 bg-aerospace-900/80 px-4 py-2 backdrop-blur">
        <div className="flex rounded border border-aerospace-700 bg-aerospace-800 overflow-hidden">
          <TabButton active={tab === 'schedule'} onClick={() => setTab('schedule')}>
            Pass Schedule
          </TabButton>
          <TabButton active={tab === 'editor'} onClick={() => setTab('editor')}>
            Scenario Editor
          </TabButton>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === 'schedule' ? <PassSchedule /> : <ScenarioEditor />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
        active
          ? 'bg-cyan-500/20 text-cyan-400'
          : 'text-aerospace-400 hover:text-aerospace-200'
      }`}
    >
      {children}
    </button>
  );
}
