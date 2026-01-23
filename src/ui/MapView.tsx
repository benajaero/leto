import { useEffect, useMemo, useRef } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, PathLayer, PolygonLayer } from '@deck.gl/layers';
import type { Incident, Scenario, EngineOutput } from '../engine/types';
import { haversineKm } from '../engine/geometry';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

function circlePolygon(lat: number, lon: number, radiusKm: number): number[][] {
  const points: number[][] = [];
  const steps = 32;
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    const dx = (radiusKm * Math.cos(angle)) / 111.32;
    const dy = (radiusKm * Math.sin(angle)) / 110.57;
    points.push([lon + dx / Math.cos((lat * Math.PI) / 180), lat + dy]);
  }
  return points;
}

type LayerToggles = {
  tracks: boolean;
  footprints: boolean;
  stations: boolean;
};

export function MapView({
  scenario,
  incidents,
  output,
  onIncidentSelect,
  selectedIncidentId,
  layerToggles,
  visibleSatIds
}: {
  scenario: Scenario;
  incidents: Incident[];
  output: EngineOutput | null;
  onIncidentSelect: (id: string) => void;
  selectedIncidentId: string | null;
  layerToggles: LayerToggles;
  visibleSatIds: string[];
}) {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const layers = useMemo(() => {
    const visibleSatSet = new Set(visibleSatIds);
    const visibleSats = output?.satellites.filter((sat) => visibleSatSet.has(sat.id)) ?? [];
    const aoiPolygon = [
      [scenario.aoi.lonMin, scenario.aoi.latMin],
      [scenario.aoi.lonMax, scenario.aoi.latMin],
      [scenario.aoi.lonMax, scenario.aoi.latMax],
      [scenario.aoi.lonMin, scenario.aoi.latMax],
      [scenario.aoi.lonMin, scenario.aoi.latMin]
    ];

    const trackLayers = layerToggles.tracks
      ? visibleSats.map((sat) =>
          new PathLayer({
            id: `track-${sat.id}`,
            data: [sat.track.map((point) => [point.lon, point.lat])],
            getPath: (d) => d,
            getColor: [255, 77, 146],
            widthUnits: 'pixels',
            getWidth: 2
          })
        )
      : [];

    const footprintSamples = layerToggles.footprints
      ? visibleSats.flatMap((sat) =>
          sat.track.filter((_, idx) => idx % 20 === 0).map((point) => ({
            id: `${sat.id}-${point.timeUtc}`,
            polygon: circlePolygon(point.lat, point.lon, point.footprintKm)
          }))
        )
      : [];

    return [
      new PolygonLayer({
        id: 'aoi',
        data: [{ polygon: aoiPolygon }],
        getPolygon: (d) => d.polygon,
        getFillColor: [255, 120, 173, 50],
        getLineColor: [255, 120, 173, 180],
        lineWidthUnits: 'pixels',
        getLineWidth: 2
      }),
      ...(layerToggles.footprints
        ? [
            new PolygonLayer({
              id: 'footprints',
              data: footprintSamples,
              getPolygon: (d) => d.polygon,
              getFillColor: [255, 173, 206, 35],
              getLineColor: [255, 120, 173, 120],
              lineWidthUnits: 'pixels',
              getLineWidth: 1
            })
          ]
        : []),
      ...trackLayers,
      ...(layerToggles.stations
        ? [
            new ScatterplotLayer({
              id: 'stations',
              data: scenario.stations,
              getPosition: (d) => [d.lon, d.lat],
              getFillColor: [16, 185, 129],
              getRadius: 12000,
              radiusUnits: 'meters'
            })
          ]
        : []),
      new ScatterplotLayer({
        id: 'incidents',
        data: incidents,
        getPosition: (d) => [d.lon, d.lat],
        getFillColor: (d) => {
          if (d.id === selectedIncidentId) return [255, 77, 146];
          return d.source === 'FIRMS' ? [255, 99, 71] : [124, 58, 237];
        },
        getRadius: (d) => (d.id === selectedIncidentId ? 12000 : 8000),
        radiusUnits: 'meters',
        pickable: true,
        onClick: (info) => {
          if (info.object) {
            onIncidentSelect(info.object.id);
          }
        }
      })
    ];
  }, [scenario, incidents, output, onIncidentSelect, selectedIncidentId, layerToggles, visibleSatIds]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [scenario.aoi.lonMin, scenario.aoi.latMin],
      zoom: 4
    });
    mapRef.current = map;
    const overlay = new MapboxOverlay({ layers });
    map.addControl(overlay as any);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const overlay = new MapboxOverlay({ layers });
    mapRef.current.addControl(overlay as any);
    return () => {
      mapRef.current?.removeControl(overlay as any);
    };
  }, [layers]);

  useEffect(() => {
    if (!mapRef.current) return;
    const centerLat = (scenario.aoi.latMin + scenario.aoi.latMax) / 2;
    const centerLon = (scenario.aoi.lonMin + scenario.aoi.lonMax) / 2;
    const spanKm = haversineKm({ lat: scenario.aoi.latMin, lon: scenario.aoi.lonMin }, { lat: scenario.aoi.latMax, lon: scenario.aoi.lonMax });
    const zoom = spanKm > 1500 ? 3 : spanKm > 800 ? 4 : 5;
    mapRef.current.easeTo({ center: [centerLon, centerLat], zoom });
  }, [scenario]);

  return (
    <div
      className="h-[320px] w-full overflow-hidden rounded-3xl border border-blush-100 bg-white shadow-panel sm:h-[380px] lg:h-[520px] xl:h-[560px]"
      ref={containerRef}
    />
  );
}
