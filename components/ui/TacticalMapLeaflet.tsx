'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useEngineStore } from '@/lib/stores/engineStore';
import { useUIStore } from '@/lib/stores/uiStore';
import type { AOIRect } from '@/lib/engine/types';

// Dynamic import leaflet on client only
let L: typeof import('leaflet') | null = null;

const COLORS = ['#00d4ff', '#f59e0b', '#10b981', '#c084fc', '#ef4444', '#f97316'];

function typeColor(type: string) {
  const t = type.toLowerCase();
  if (t.includes('fire')) return '#f97316';
  if (t.includes('flood')) return '#00d4ff';
  if (t.includes('cyclone') || t.includes('storm')) return '#c084fc';
  if (t.includes('earthquake')) return '#ef4444';
  return '#94a3b8';
}

export function TacticalMapLeaflet() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<import('leaflet').Map | null>(null);
  const layersRef = useRef<import('leaflet').LayerGroup | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  const scenario = useEngineStore((s) => s.scenario);
  const incidents = useEngineStore((s) => s.incidents);
  const output = useEngineStore((s) => s.output);
  const selectedId = useUIStore((s) => s.selectedIncidentId);
  const setSelectedId = useUIStore((s) => s.setSelectedIncidentId);

  const [showTracks, setShowTracks] = useState(true);
  const [showFootprints, setShowFootprints] = useState(false);
  const [showStations, setShowStations] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showAoi, setShowAoi] = useState(true);

  // Load leaflet client-side
  useEffect(() => {
    if (typeof window === 'undefined' || leafletReady) return;
    let cancelled = false;
    (async () => {
      const leaflet = await import('leaflet');
      if (cancelled) return;
      L = leaflet;
      await import('leaflet/dist/leaflet.css');
      setLeafletReady(true);
    })();
    return () => { cancelled = true; };
  }, [leafletReady]);

  // Initialize map
  useEffect(() => {
    const leaflet = L;
    if (!leaflet || !mapRef.current || leafletMap.current) return;

    const map = leaflet.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
    });

    // CartoDB Dark Matter tiles (free, no API key)
    leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom control (top right)
    leaflet.control.zoom({ position: 'topright' }).addTo(map);

    // Scale bar
    leaflet.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);

    leafletMap.current = map;
    layersRef.current = leaflet.layerGroup().addTo(map);

    // Fit to AOI
    const { latMin, latMax, lonMin, lonMax } = scenario.aoi;
    map.fitBounds([
      [latMin, lonMin],
      [latMax, lonMax],
    ], { padding: [40, 40] });

    return () => {
      map.remove();
      leafletMap.current = null;
      layersRef.current = null;
    };
  }, [leafletReady, scenario.aoi]);

  // Update layers when data changes
  useEffect(() => {
    const leaflet = L;
    if (!leaflet || !leafletMap.current || !layersRef.current) return;

    layersRef.current.clearLayers();
    const layers = layersRef.current;

    // AOI
    if (showAoi) {
      const aoi = scenario.aoi;
      leaflet.rectangle(
        [[aoi.latMin, aoi.lonMin], [aoi.latMax, aoi.lonMax]],
        { color: '#00d4ff', weight: 1, fillColor: '#00d4ff', fillOpacity: 0.03, dashArray: '4 2' }
      ).bindTooltip('AOI', { permanent: true, direction: 'top', className: 'aoi-label' }).addTo(layers);
    }

    // Ground stations
    if (showStations) {
      scenario.stations.forEach((st) => {
        leaflet.circleMarker([st.lat, st.lon], {
          radius: 5,
          fillColor: '#10b981',
          color: '#10b981',
          weight: 1.5,
          fillOpacity: 0.8,
        }).bindTooltip(st.name, { direction: 'right', className: 'station-label' }).addTo(layers);
        leaflet.circle([st.lat, st.lon], {
          radius: 500000,
          fillColor: '#10b981',
          color: '#10b981',
          weight: 0.5,
          fillOpacity: 0.03,
        }).addTo(layers);
      });
    }

    // Satellite ground tracks & footprints
    output?.satellites.forEach((sat, satIdx) => {
      const color = COLORS[satIdx % COLORS.length];

      if (showTracks && sat.track.length > 1) {
        const latlngs = sat.track.map((t) => [t.lat, t.lon] as [number, number]);
        leaflet.polyline(latlngs, { color, weight: 1.5, opacity: 0.6 }).bindTooltip(sat.name, { className: 'track-label' }).addTo(layers);
      }

      if (showFootprints) {
        sat.track.forEach((t, i) => {
          if (i % 5 !== 0) return;
          leaflet.circle([t.lat, t.lon], {
            radius: (t.footprintKm || 100) * 1000,
            fillColor: color,
            color: color,
            weight: 0.5,
            fillOpacity: 0.03,
          }).addTo(layers);
        });
      }
    });

    // Incidents
    if (showIncidents) {
      incidents.forEach((inc) => {
        const isSelected = selectedId === inc.id;
        const color = typeColor(inc.type);

        const marker = leaflet.circleMarker([inc.lat, inc.lon], {
          radius: isSelected ? 7 : 5,
          fillColor: color,
          color: isSelected ? '#00d4ff' : '#0a0a0f',
          weight: isSelected ? 2 : 1,
          fillOpacity: 1,
        }).addTo(layers);

        marker.on('click', () => setSelectedId(inc.id));
        marker.bindTooltip(inc.label, { direction: 'top', className: 'incident-label' });

        if (isSelected) {
          leaflet.circleMarker([inc.lat, inc.lon], {
            radius: 14,
            fillColor: 'transparent',
            color: '#00d4ff',
            weight: 1,
            dashArray: '3 3',
          }).addTo(layers);
        }
      });
    }
  }, [leafletReady, scenario, incidents, output, selectedId, setSelectedId, showTracks, showFootprints, showStations, showIncidents, showAoi]);

  if (!leafletReady) {
    return (
      <div className="flex h-full items-center justify-center bg-aerospace-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-aerospace-600 border-t-cyan-400" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Map Layer Controls */}
      <div className="absolute left-3 top-3 z-[400] rounded border border-aerospace-700 bg-aerospace-900/90 p-2 backdrop-blur">
        <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-aerospace-400">Map Layers</span>
        <div className="space-y-1">
          <LayerToggle label="Fires & Hotspots" checked={showIncidents} onChange={setShowIncidents} color="#f97316" />
          <LayerToggle label="Ground Tracks" checked={showTracks} onChange={setShowTracks} color="#00d4ff" />
          <LayerToggle label="Footprints" checked={showFootprints} onChange={setShowFootprints} color="#c084fc" />
          <LayerToggle label="Ground Stations" checked={showStations} onChange={setShowStations} color="#10b981" />
          <LayerToggle label="AOI Boundary" checked={showAoi} onChange={setShowAoi} color="#00d4ff" />
        </div>
      </div>

      <div ref={mapRef} className="h-full w-full" />

      {/* Legend */}
      <div className="absolute bottom-3 right-3 z-[400] rounded border border-aerospace-700 bg-aerospace-900/90 px-2.5 py-1.5 backdrop-blur">
        <div className="flex items-center gap-2 text-[9px] text-aerospace-400">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />Fire</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />Flood</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-purple-400" />Storm</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Quake</span>
        </div>
      </div>
    </div>
  );
}

function LayerToggle({ label, checked, onChange, color }: { label: string; checked: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3 w-3 accent-cyan-500" />
      <span className="text-[10px] text-aerospace-300">{label}</span>
      <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
    </label>
  );
}
