import { useMemo } from 'react';
import { useEngineStore } from '@/lib/stores/engineStore';
import { useUIStore } from '@/lib/stores/uiStore';
import type { AOIRect } from '@/lib/engine/types';

function project(
  lat: number,
  lon: number,
  aoi: AOIRect,
  width: number,
  height: number,
  padding: number
) {
  const x = padding + ((lon - aoi.lonMin) / (aoi.lonMax - aoi.lonMin)) * (width - padding * 2);
  const y = height - padding - ((lat - aoi.latMin) / (aoi.latMax - aoi.latMin)) * (height - padding * 2);
  return { x, y };
}

export function TacticalMap() {
  const scenario = useEngineStore((s) => s.scenario);
  const incidents = useEngineStore((s) => s.incidents);
  const output = useEngineStore((s) => s.output);
  const selectedId = useUIStore((s) => s.selectedIncidentId);
  const setSelectedId = useUIStore((s) => s.setSelectedIncidentId);

  const width = 600;
  const height = 500;
  const padding = 40;
  const aoi = scenario.aoi;

  const metricsMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof output>['incidentMetrics'][number]>();
    output?.incidentMetrics.forEach((m) => map.set(m.incidentId, m));
    return map;
  }, [output]);

  const hLines = useMemo(() => {
    const lines: { y: number; label: string }[] = [];
    const latStep = Math.max(1, Math.round((aoi.latMax - aoi.latMin) / 6));
    for (let lat = Math.ceil(aoi.latMin); lat <= Math.floor(aoi.latMax); lat += latStep) {
      const { y } = project(lat, aoi.lonMin, aoi, width, height, padding);
      lines.push({ y, label: `${lat}°` });
    }
    return lines;
  }, [aoi]);

  const vLines = useMemo(() => {
    const lines: { x: number; label: string }[] = [];
    const lonStep = Math.max(1, Math.round((aoi.lonMax - aoi.lonMin) / 6));
    for (let lon = Math.ceil(aoi.lonMin); lon <= Math.floor(aoi.lonMax); lon += lonStep) {
      const { x } = project(aoi.latMin, lon, aoi, width, height, padding);
      lines.push({ x, label: `${lon}°` });
    }
    return lines;
  }, [aoi]);

  const aoiRect = useMemo(() => {
    const tl = project(aoi.latMax, aoi.lonMin, aoi, width, height, padding);
    const br = project(aoi.latMin, aoi.lonMax, aoi, width, height, padding);
    return { x: tl.x, y: tl.y, width: br.x - tl.x, height: br.y - tl.y };
  }, [aoi]);

  return (
    <div className="relative flex h-full flex-col border-l border-r border-aerospace-700 bg-aerospace-950">
      <div className="flex items-center justify-between border-b border-aerospace-700 px-4 py-2">
        <span className="text-readout font-bold uppercase tracking-[0.2em] text-aerospace-400">Tactical Display</span>
        <div className="flex items-center gap-3 text-micro text-aerospace-500">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />Fire</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-signal-400" />Flood</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-purple-400" />Storm</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Station</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
          {/* Background grid */}
          {hLines.map((line, i) => (
            <g key={`h-${i}`}>
              <line x1={padding} y1={line.y} x2={width - padding} y2={line.y} stroke="#1a1a24" strokeWidth="1" />
              <text x={padding - 4} y={line.y + 3} fill="#5a5a7a" fontSize="11" textAnchor="end" fontFamily="var(--font-jetbrains)">
                {line.label}
              </text>
            </g>
          ))}
          {vLines.map((line, i) => (
            <g key={`v-${i}`}>
              <line x1={line.x} y1={padding} x2={line.x} y2={height - padding} stroke="#1a1a24" strokeWidth="1" />
              <text x={line.x} y={height - padding + 12} fill="#5a5a7a" fontSize="11" textAnchor="middle" fontFamily="var(--font-jetbrains)">
                {line.label}
              </text>
            </g>
          ))}

          {/* AOI */}
          <rect
            x={aoiRect.x}
            y={aoiRect.y}
            width={aoiRect.width}
            height={aoiRect.height}
            fill="rgba(201, 168, 108, 0.03)"
            stroke="#c9a86c"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
          <text x={aoiRect.x + 4} y={aoiRect.y - 4} fill="#c9a86c" fontSize="11" fontFamily="var(--font-jetbrains)">
            AOI
          </text>

          {/* Ground stations */}
          {scenario.stations.map((station) => {
            const pos = project(station.lat, station.lon, aoi, width, height, padding);
            return (
              <g key={station.id}>
                <circle cx={pos.x} cy={pos.y} r="4" fill="#0a0a0f" stroke="#34d399" strokeWidth="1.5" />
                <circle cx={pos.x} cy={pos.y} r="12" fill="none" stroke="#34d399" strokeWidth="0.5" opacity="0.3" />
                <text x={pos.x + 8} y={pos.y + 3} fill="#34d399" fontSize="11" fontFamily="var(--font-jetbrains)">
                  {station.name}
                </text>
              </g>
            );
          })}

          {/* Incidents */}
          {incidents.map((incident) => {
            const pos = project(incident.lat, incident.lon, aoi, width, height, padding);
            const isSelected = selectedId === incident.id;
            const metrics = metricsMap.get(incident.id);
            const hasCoverage = metrics?.tFirstObsSeconds !== null;

            const typeColor = incident.type.toLowerCase().includes('fire')
              ? '#f97316'
              : incident.type.toLowerCase().includes('flood')
              ? '#c9a86c'
              : incident.type.toLowerCase().includes('cyclone') || incident.type.toLowerCase().includes('storm')
              ? '#c084fc'
              : '#94a3b8';

            return (
              <g
                key={incident.id}
                className="cursor-pointer"
                onClick={() => setSelectedId(incident.id)}
              >
                {isSelected && (
                  <circle cx={pos.x} cy={pos.y} r="14" fill="none" stroke="#c9a86c" strokeWidth="1" opacity="0.5">
                    <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected ? 5 : 4}
                  fill={typeColor}
                  stroke={isSelected ? '#c9a86c' : '#0a0a0f'}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={hasCoverage ? 1 : 0.4}
                />
                {isSelected && (
                  <text x={pos.x + 8} y={pos.y - 4} fill="#e2e2f0" fontSize="11" fontFamily="var(--font-jetbrains)">
                    {incident.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
