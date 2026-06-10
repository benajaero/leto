'use client';

import { useUIStore } from '@/lib/stores/uiStore';

export function MobileNav() {
  const mobileView = useUIStore((s) => s.mobileView);
  const setMobileView = useUIStore((s) => s.setMobileView);
  const selectedId = useUIStore((s) => s.selectedIncidentId);

  const tabs = [
    { id: 'list' as const, label: 'Queue', icon: ListIcon },
    { id: 'map' as const, label: 'Map', icon: MapIcon },
    { id: 'detail' as const, label: 'Detail', icon: DetailIcon, disabled: !selectedId },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-aerospace-700 bg-aerospace-900/95 backdrop-blur">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setMobileView(tab.id)}
            disabled={tab.disabled}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition ${
              mobileView === tab.id
                ? 'text-cyan-400'
                : tab.disabled
                ? 'text-aerospace-700'
                : 'text-aerospace-500'
            }`}
          >
            <tab.icon className="h-5 w-5" active={mobileView === tab.id} />
            <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function ListIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={active ? '#00d4ff' : 'currentColor'} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function MapIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={active ? '#00d4ff' : 'currentColor'} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  );
}

function DetailIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={active ? '#00d4ff' : 'currentColor'} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}
