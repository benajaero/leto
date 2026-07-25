'use client';

import { useState, useEffect } from 'react';

export function ApiKeySettings({ onClose }: { onClose: () => void }) {
  const [firmsKey, setFirmsKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('leto_firms_api_key');
      if (key) setFirmsKey(key);
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      if (firmsKey.trim()) {
        localStorage.setItem('leto_firms_api_key', firmsKey.trim());
      } else {
        localStorage.removeItem('leto_firms_api_key');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClear = () => {
    setFirmsKey('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('leto_firms_api_key');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border border-aerospace-700 bg-aerospace-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-aerospace-200">
            API Keys & Data Sources
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-aerospace-500 transition hover:text-aerospace-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* FIRMS */}
          <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-xs font-semibold text-aerospace-200">NASA FIRMS</span>
              <span className="ml-auto text-micro text-aerospace-500">Active Fire Data</span>
            </div>
            <p className="mb-2 text-readout leading-relaxed text-aerospace-400">
              Get a free API key from{' '}
              <a
                href="https://firms.modaps.eosdis.nasa.gov/api/map_key/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-signal-400 underline"
              >
                firms.modaps.eosdis.nasa.gov
              </a>
              . Without a key, LETO uses sample data.
            </p>
            <input
              type="password"
              value={firmsKey}
              onChange={(e) => setFirmsKey(e.target.value)}
              placeholder="Paste your FIRMS API key..."
              className="w-full rounded border border-aerospace-700 bg-aerospace-900 px-3 py-2 text-xs text-aerospace-100 outline-none transition focus:border-signal-500/50"
            />
          </div>

          {/* Other sources */}
          <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-aerospace-200">GDACS</span>
              <span className="ml-auto text-micro text-emerald-400">No key needed</span>
            </div>
          </div>
          <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-signal-500" />
              <span className="text-xs font-semibold text-aerospace-200">NASA EONET</span>
              <span className="ml-auto text-micro text-emerald-400">No key needed</span>
            </div>
          </div>
          <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-xs font-semibold text-aerospace-200">USGS Earthquakes</span>
              <span className="ml-auto text-micro text-emerald-400">No key needed</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded bg-signal-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-signal-400 transition hover:bg-signal-500/30"
          >
            {saved ? 'Saved!' : 'Save Keys'}
          </button>
          <button
            onClick={handleClear}
            className="rounded border border-aerospace-700 bg-aerospace-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-aerospace-400 transition hover:text-aerospace-200"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
