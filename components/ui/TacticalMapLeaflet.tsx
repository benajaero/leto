'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useEngineStore } from '@/lib/stores/engineStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { formatDuration } from '@/lib/formatters';

let L: typeof import('leaflet') | null = null;

const COLORS = ['#00d4ff', '#f59e0b', '#10b981', '#c084fc', '#ef4444', '#f97316'];
const TRACK_MIN_KM = 15;

function typeColor(type: string) {
  const t = type.toLowerCase();
  if (t.includes('fire')) return '#f97316';
  if (t.includes('flood')) return '#00d4ff';
  if (t.includes('cyclone') || t.includes('storm')) return '#c084fc';
  if (t.includes('earthquake')) return '#ef4444';
  return '#94a3b8';
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat2 = Math.sin(dLat / 2);
  const sinDLon2 = Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(sinDLat2 * sinDLat2 + Math.cos(lat1) * Math.cos(lat2) * sinDLon2 * sinDLon2), Math.sqrt(1 - (sinDLat2 * sinDLat2 + Math.cos(lat1) * Math.cos(lat2) * sinDLon2 * sinDLon2)));
  return R * c;
}

function simplifyTrack(track: { lat: number; lon: number }[]) {
  if (track.length < 3) return track;
  const out: typeof track = [track[0]];
  let last = track[0];
  for (let i = 1; i < track.length - 1; i++) {
    if (haversineKm(last, track[i]) >= TRACK_MIN_KM) {
      out.push(track[i]);
      last = track[i];
    }
  }
  out.push(track[track.length - 1]);
  return out;
}

export function TacticalMapLeaflet() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<import('leaflet').Map | null>(null);
  const layersRef = useRef<import('leaflet').LayerGroup | null>(null);
  const markersRef = useRef<Map<string, import('leaflet').CircleMarker>>(new Map());
  const rafRef = useRef<number | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const isMobile = useIsMobile();

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [layersOpen, setLayersOpen] = useState(!isMobile); // Collapsed by default on mobile

  // Load leaflet client-side once
  useEffect(() => {
    if (typeof window === 'undefined' || leafletReady) return;
    // Module-level L survives across unmount/remount (mobile view switching).
    // If already loaded from a previous mount, just flip state.
    if (L) {
      setLeafletReady(true);
      return;
    }
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

  // Initialize map once
  useEffect(() => {
    const leaflet = L;
    if (!leaflet || !mapRef.current || leafletMap.current) return;

    const map = leaflet.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 18,
    });

    // Ensure Leaflet detects container size after mount (critical for mobile flex layouts)
    requestAnimationFrame(() => map.invalidateSize());

    leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    leaflet.control.zoom({ position: 'topright' }).addTo(map);
    leaflet.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);

    leafletMap.current = map;
    layersRef.current = leaflet.layerGroup().addTo(map);

    const { latMin, latMax, lonMin, lonMax } = scenario.aoi;
    map.fitBounds([[latMin, lonMin], [latMax, lonMax]], { padding: [40, 40] });

    // Close layer panel on map tap (mobile)
    map.on('click', () => {
      if (isMobile) setLayersOpen(false);
    });

    return () => {
      map.remove();
      leafletMap.current = null;
      layersRef.current = null;
      markersRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady]);

  // Fly to AOI when scenario changes
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;
    const { latMin, latMax, lonMin, lonMax } = scenario.aoi;
    map.flyToBounds([[latMin, lonMin], [latMax, lonMax]], { padding: [40, 40], duration: 1.5 });
  }, [scenario.aoi]);

  // Fly to selected incident
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || !selectedId) return;
    const inc = incidents.find((i) => i.id === selectedId);
    if (!inc) return;
    map.flyTo([inc.lat, inc.lon], Math.max(map.getZoom(), 8), { duration: 0.8 });
  }, [selectedId, incidents]);

  // Build popup content
  const buildPopup = useCallback((inc: typeof incidents[number], metrics?: NonNullable<typeof output>['incidentMetrics'][number]) => {
    const color = typeColor(inc.type);
    const score = metrics?.score ?? 0;
    return `
      <div style="font-family: var(--font-jetbrains), monospace; min-width: 180px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="color:${color};font-size:14px;">●</span>
          <strong style="color:#e2e2f0;font-size:12px;">${inc.label}</strong>
        </div>
        <div style="color:#8a8aaa;font-size:10px;margin-bottom:6px;">
          ${inc.lat.toFixed(3)}°, ${inc.lon.toFixed(3)}° · ${inc.source}
        </div>
        ${metrics ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10px;">
          <div><span style="color:#5a5a7a">Score</span> <span style="color:${score >= 50 ? '#00d4ff' : '#f59e0b'}">${score}</span></div>
          <div><span style="color:#5a5a7a">TTFO</span> <span style="color:#00d4ff">${formatDuration(metrics.tFirstObsSeconds)}</span></div>
          <div><span style="color:#5a5a7a">TTDL</span> <span style="color:#00d4ff">${formatDuration(metrics.tFirstDownlinkSeconds)}</span></div>
          <div><span style="color:#5a5a7a">Sat</span> <span style="color:#e2e2f0">${metrics.servingSatellite || '—'}</span></div>
        </div>
        ` : ''}
      </div>
    `;
  }, []);

  // Memoized simplified tracks
  const simplifiedTracks = useMemo(() => {
    if (!output) return [];
    return output.satellites.map((sat) => ({
      name: sat.name,
      color: COLORS[output.satellites.indexOf(sat) % COLORS.length],
      track: showTracks ? simplifyTrack(sat.track) : [],
      footprints: showFootprints ? sat.track.filter((_, i) => i % 8 === 0) : [],
      aoiAccess: sat.aoiAccess,
    }));
  }, [output, showTracks, showFootprints]);

  // Actual layer update
  const updateLayers = useCallback(() => {
    const leaflet = L;
    const map = leafletMap.current;
    const layers = layersRef.current;
    if (!leaflet || !map || !layers) return;

    layers.clearLayers();
    markersRef.current.clear();

    // AOI
    if (showAoi) {
      const aoi = scenario.aoi;
      leaflet.rectangle(
        [[aoi.latMin, aoi.lonMin], [aoi.latMax, aoi.lonMax]],
        { color: '#00d4ff', weight: 1.5, fillColor: '#00d4ff', fillOpacity: 0.04, dashArray: '6 3' }
      ).bindTooltip('AOI', { permanent: true, direction: 'top', className: 'bg-transparent border-0 text-cyan-400 text-[10px] font-mono' }).addTo(layers);
    }

    // Ground stations
    if (showStations) {
      scenario.stations.forEach((st) => {
        leaflet.circleMarker([st.lat, st.lon], {
          radius: 5, fillColor: '#10b981', color: '#10b981', weight: 1.5, fillOpacity: 0.9,
        }).bindTooltip(st.name, { direction: 'right', className: 'bg-aerospace-900 border border-aerospace-700 text-emerald-400 text-[10px] px-1' }).addTo(layers);
        leaflet.circle([st.lat, st.lon], {
          radius: 500000, fillColor: '#10b981', color: '#10b981', weight: 0.5, fillOpacity: 0.02,
        }).addTo(layers);
      });
    }

    // Tracks
    simplifiedTracks.forEach((sat) => {
      if (sat.track.length > 1) {
        const latlngs = sat.track.map((t) => [t.lat, t.lon] as [number, number]);
        leaflet.polyline(latlngs, { color: sat.color, weight: 1.5, opacity: 0.5 }).bindTooltip(sat.name, { className: 'bg-aerospace-900 border-0 text-aerospace-300 text-[10px] px-1' }).addTo(layers);
      }
      if (showFootprints) {
        sat.footprints.forEach((t) => {
          leaflet.circle([t.lat, t.lon], {
            radius: (t.footprintKm || 100) * 1000,
            fillColor: sat.color, color: sat.color, weight: 0.5, fillOpacity: 0.02,
          }).addTo(layers);
        });
      }
    });

    // Incidents
    if (showIncidents) {
      const metricsMap = new Map<string, NonNullable<typeof output>['incidentMetrics'][number]>();
      output?.incidentMetrics.forEach((m) => metricsMap.set(m.incidentId, m));

      incidents.forEach((inc) => {
        const isSelected = selectedId === inc.id;
        const isHovered = hoveredId === inc.id;
        const color = typeColor(inc.type);
        const metrics = metricsMap.get(inc.id);
        const radius = isSelected ? 8 : isHovered ? 7 : 5;

        const marker = leaflet.circleMarker([inc.lat, inc.lon], {
          radius,
          fillColor: color,
          color: isSelected ? '#00d4ff' : '#0a0a0f',
          weight: isSelected ? 2.5 : 1,
          fillOpacity: 1,
        }).addTo(layers);

        marker.bindPopup(buildPopup(inc, metrics), {
          closeButton: false,
          className: 'bg-aerospace-900 border border-aerospace-700 rounded text-aerospace-100',
        });

        marker.on('click', () => {
          setSelectedId(inc.id);
          // On mobile, open popup on tap; on desktop, popup follows hover
          if (isMobile) {
            marker.openPopup();
          }
        });
        if (!isMobile) {
          marker.on('mouseover', () => { setHoveredId(inc.id); marker.openPopup(); });
          marker.on('mouseout', () => { setHoveredId(null); marker.closePopup(); });
        }

        markersRef.current.set(inc.id, marker);

        if (isSelected) {
          leaflet.circleMarker([inc.lat, inc.lon], {
            radius: 16, fillColor: 'transparent', color: '#00d4ff', weight: 1.5,
            dashArray: '4 3',
          }).addTo(layers);
        }
      });
    }
  }, [scenario, incidents, output, selectedId, hoveredId, showAoi, showStations, showIncidents, showFootprints, simplifiedTracks, buildPopup, setSelectedId, isMobile]);

  // Debounced layer update
  const scheduleUpdate = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      updateLayers();
    });
  }, [updateLayers]);

  useEffect(() => {
    scheduleUpdate();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [scheduleUpdate]);

  // Recenter
  const handleRecenter = useCallback(() => {
    const map = leafletMap.current;
    if (!map) return;
    const { latMin, latMax, lonMin, lonMax } = scenario.aoi;
    map.flyToBounds([[latMin, lonMin], [latMax, lonMax]], { padding: [40, 40], duration: 1 });
  }, [scenario.aoi]);

  if (!leafletReady) {
    return (
      <div className="flex flex-1 items-center justify-center bg-aerospace-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-aerospace-600 border-t-cyan-400" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col min-h-0">
      {/* Map Layer Controls - collapsible on mobile */}
      <div className={`absolute left-3 top-3 z-[400] rounded border border-aerospace-700 bg-aerospace-900/90 backdrop-blur shadow-lg transition-all ${
        layersOpen ? 'p-2.5' : 'p-1'
      }`}>
        {isMobile && (
          <button
            onClick={() => setLayersOpen(!layersOpen)}
            className="flex h-10 w-10 items-center justify-center rounded bg-aerospace-800 text-aerospace-300 transition hover:text-aerospace-100"
            aria-label="Toggle layers"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}
        {(!isMobile || layersOpen) && (
          <div className={isMobile ? 'mt-2' : ''}>
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-wider text-aerospace-400">Map Layers</span>
            <div className="space-y-1.5">
              <LayerToggle label="Fires & Hotspots" checked={showIncidents} onChange={setShowIncidents} color="#f97316" />
              <LayerToggle label="Ground Tracks" checked={showTracks} onChange={setShowTracks} color="#00d4ff" />
              <LayerToggle label="Footprints" checked={showFootprints} onChange={setShowFootprints} color="#c084fc" />
              <LayerToggle label="Ground Stations" checked={showStations} onChange={setShowStations} color="#10b981" />
              <LayerToggle label="AOI Boundary" checked={showAoi} onChange={setShowAoi} color="#00d4ff" />
            </div>
            <div className="mt-2 border-t border-aerospace-700 pt-2">
              <button
                onClick={handleRecenter}
                className="flex w-full items-center justify-center gap-1 rounded border border-aerospace-700 bg-aerospace-800 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-aerospace-300 transition hover:text-aerospace-100"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Recenter
              </button>
            </div>
          </div>
        )}
      </div>

      <div ref={mapRef} className="flex-1 min-h-0 w-full" />

      {/* Legend */}
      <div className={`absolute right-3 z-[400] rounded border border-aerospace-700 bg-aerospace-900/90 px-2.5 py-1.5 backdrop-blur shadow-lg ${isMobile ? 'bottom-16' : 'bottom-10'}`}>
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
    <label className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 transition hover:bg-aerospace-800/50 min-h-[32px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-cyan-500" />
      <span className="text-[10px] text-aerospace-300">{label}</span>
      <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
    </label>
  );
}
