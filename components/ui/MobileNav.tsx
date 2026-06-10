'use client';

import { useStore } from '@/lib/store';

export function MobileNav() {
  const mobileView = useStore((s) => s.mobileView);
  const setMobileView = useStore((s) => s.setMobileView);
  const selectedId = useStore((s) => s.selectedIncidentId);

  const tabs = [
    { key: 'list' as const, label: 'Queue', icon: '≡' },
    { key: 'map' as const, label: 'Map', icon: '◎' },
    { key: 'detail' as const, label: 'Detail', icon: 'ℹ', disabled: !selectedId }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-aerospace-700 bg-aerospace-900/95 backdrop-blur md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && setMobileView(tab.key)}
            disabled={tab.disabled}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 transition min-w-[64px] ${
              mobileView === tab.key
                ? 'bg-cyan-500/15 text-cyan-400'
                : tab.disabled
                ? 'text-aerospace-700'
                : 'text-aerospace-400 active:text-aerospace-200'
            }`}
          >
            <span className="text-base leading-none">{tab.icon}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>
      {/* Safe area for notched phones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
