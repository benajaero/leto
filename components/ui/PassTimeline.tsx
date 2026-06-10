'use client';

import { useMemo, useState } from 'react';
import { useEngineStore } from '@/lib/stores/engineStore';
import { formatDuration, formatUtc } from '@/lib/formatters';

type PassBar = {
  id: string;
  rowIdx: number;
  startSec: number;
  endSec: number;
  color: string;
  label: string;
  tooltip: string;
};

const ROW_HEIGHT = 32;
const LEFT_WIDTH = 140;
const RIGHT_PADDING = 20;
const HEADER_HEIGHT = 36;

export function PassTimeline() {
  const output = useEngineStore((s) => s.output);
  const scenario = useEngineStore((s) => s.scenario);
  const [hoursRange, setHoursRange] = useState<12 | 24>(scenario.horizonHours >= 24 ? 24 : 12);
  const [hoveredBar, setHoveredBar] = useState<PassBar | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const now = useMemo(() => new Date(), []);

  const { rows, bars, startTime, totalSeconds } = useMemo(() => {
    if (!output) return { rows: [] as string[], bars: [] as PassBar[], startTime: 0, totalSeconds: 0 };

    const start = new Date(scenario.startTimeUtc).getTime();
    const totalSec = hoursRange * 3600;

    const rowNames: string[] = [];
    const passBars: PassBar[] = [];

    // Satellite rows
    output.satellites.forEach((sat) => {
      const rowIdx = rowNames.length;
      rowNames.push(sat.name);

      sat.aoiAccess.forEach((w, i) => {
        const ws = new Date(w.startUtc).getTime();
        const we = new Date(w.endUtc).getTime();
        if (ws >= start + totalSec * 1000 || we <= start) return;
        const dur = (we - ws) / 1000;
        passBars.push({
          id: `${sat.id}-aoi-${i}`,
          rowIdx,
          startSec: Math.max(0, (ws - start) / 1000),
          endSec: Math.min(totalSec, (we - start) / 1000),
          color: '#00d4ff',
          label: 'IMG',
          tooltip: `${sat.name} · AOI Access · ${formatUtc(w.startUtc).slice(11, 16)}–${formatUtc(w.endUtc).slice(11, 16)} · ${formatDuration(dur)}`,
        });
      });

      Object.entries(sat.stationContacts).forEach(([stationId, windows]) => {
        const stationName = scenario.stations.find((s) => s.id === stationId)?.name || stationId;
        windows.forEach((w, i) => {
          const ws = new Date(w.startUtc).getTime();
          const we = new Date(w.endUtc).getTime();
          if (ws >= start + totalSec * 1000 || we <= start) return;
          const dur = (we - ws) / 1000;
          passBars.push({
            id: `${sat.id}-dl-${stationId}-${i}`,
            rowIdx,
            startSec: Math.max(0, (ws - start) / 1000),
            endSec: Math.min(totalSec, (we - start) / 1000),
            color: '#c084fc',
            label: 'DL',
            tooltip: `${sat.name} → ${stationName} · Downlink · ${formatUtc(w.startUtc).slice(11, 16)}–${formatUtc(w.endUtc).slice(11, 16)} · ${formatDuration(dur)}`,
          });
        });
      });
    });

    // Ground station rows
    scenario.stations.forEach((st) => {
      const rowIdx = rowNames.length;
      rowNames.push(st.name);

      output.satellites.forEach((sat) => {
        const contacts = sat.stationContacts[st.id] || [];
        contacts.forEach((w, i) => {
          const ws = new Date(w.startUtc).getTime();
          const we = new Date(w.endUtc).getTime();
          if (ws >= start + totalSec * 1000 || we <= start) return;
          const dur = (we - ws) / 1000;
          passBars.push({
            id: `${st.id}-contact-${sat.id}-${i}`,
            rowIdx,
            startSec: Math.max(0, (ws - start) / 1000),
            endSec: Math.min(totalSec, (we - start) / 1000),
            color: '#10b981',
            label: sat.name.slice(0, 8),
            tooltip: `${st.name} · Contact · ${sat.name} · ${formatUtc(w.startUtc).slice(11, 16)}–${formatUtc(w.endUtc).slice(11, 16)} · ${formatDuration(dur)}`,
          });
        });
      });
    });

    return { rows: rowNames, bars: passBars, startTime: start, totalSeconds: totalSec };
  }, [output, scenario, hoursRange]);

  const width = 900;
  const chartWidth = width - LEFT_WIDTH - RIGHT_PADDING;
  const height = Math.max(140, rows.length * ROW_HEIGHT + HEADER_HEIGHT + 10);

  // Time axis ticks
  const timeTicks = useMemo(() => {
    const ticks: { x: number; label: string; date: string }[] = [];
    const count = hoursRange <= 12 ? 6 : 12;
    for (let i = 0; i <= count; i++) {
      const sec = (totalSeconds / count) * i;
      const t = new Date(startTime + sec * 1000);
      ticks.push({
        x: LEFT_WIDTH + (sec / totalSeconds) * chartWidth,
        label: formatUtc(t).slice(11, 16),
        date: formatUtc(t).slice(8, 10),
      });
    }
    return ticks;
  }, [startTime, totalSeconds, hoursRange, chartWidth]);

  // Now indicator position
  const nowX = useMemo(() => {
    const nowMs = now.getTime();
    if (nowMs < startTime || nowMs > startTime + totalSeconds * 1000) return null;
    return LEFT_WIDTH + ((nowMs - startTime) / 1000 / totalSeconds) * chartWidth;
  }, [now, startTime, totalSeconds, chartWidth]);

  if (!output) {
    return (
      <div className="flex h-full items-center justify-center text-aerospace-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-aerospace-600 border-t-cyan-400" />
        <span className="ml-2 text-xs">Computing timeline…</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-aerospace-700 bg-aerospace-900/80 px-4 py-2 backdrop-blur">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-aerospace-200">Upcoming Access & Downlink Windows</span>
          <span className="ml-2 font-mono text-[10px] text-aerospace-500">
            {formatUtc(new Date(startTime)).slice(0, 10)} UTC
          </span>
        </div>
        <div className="flex rounded border border-aerospace-700 bg-aerospace-800 overflow-hidden">
          <button onClick={() => setHoursRange(12)} className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition ${hoursRange === 12 ? 'bg-cyan-500/20 text-cyan-400' : 'text-aerospace-400'}`}>12h</button>
          <button onClick={() => setHoursRange(24)} className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition ${hoursRange === 24 ? 'bg-cyan-500/20 text-cyan-400' : 'text-aerospace-400'}`}>24h</button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ minWidth: width }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
          onMouseLeave={() => setHoveredBar(null)}
        >
          <rect x={0} y={0} width={width} height={height} fill="#050507" />

          {/* Time grid + labels */}
          {timeTicks.map((t, i) => (
            <g key={i}>
              <line x1={t.x} y1={HEADER_HEIGHT} x2={t.x} y2={height} stroke="#1a1a24" strokeWidth="1" />
              <text x={t.x} y={18} fill="#8a8aaa" fontSize="9" textAnchor="middle" fontFamily="var(--font-jetbrains)">{t.label}</text>
              <text x={t.x} y={28} fill="#5a5a7a" fontSize="8" textAnchor="middle" fontFamily="var(--font-jetbrains)">{t.date}</text>
            </g>
          ))}

          {/* Now indicator */}
          {nowX !== null && (
            <g>
              <line x1={nowX} y1={HEADER_HEIGHT} x2={nowX} y2={height} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
              <rect x={nowX - 16} y={HEADER_HEIGHT - 2} width={32} height={12} rx={2} fill="#ef4444" opacity="0.9" />
              <text x={nowX} y={HEADER_HEIGHT + 7} fill="#fff" fontSize="7" textAnchor="middle" fontFamily="var(--font-jetbrains)" fontWeight="bold">NOW</text>
            </g>
          )}

          {/* Row backgrounds + labels */}
          {rows.map((name, i) => (
            <g key={name}>
              {/* Alternating row background */}
              {i % 2 === 0 && (
                <rect x={LEFT_WIDTH} y={HEADER_HEIGHT + i * ROW_HEIGHT} width={chartWidth + RIGHT_PADDING} height={ROW_HEIGHT} fill="#0a0a0f" opacity="0.5" />
              )}
              {/* Row label */}
              <text x={8} y={HEADER_HEIGHT + i * ROW_HEIGHT + ROW_HEIGHT / 2 + 4} fill="#b8b8d0" fontSize="10" fontFamily="var(--font-jetbrains)" fontWeight="600">{name}</text>
              {/* Row separator */}
              <line x1={LEFT_WIDTH} y1={HEADER_HEIGHT + i * ROW_HEIGHT} x2={width} y2={HEADER_HEIGHT + i * ROW_HEIGHT} stroke="#1a1a24" strokeWidth="1" />
            </g>
          ))}

          {/* Pass bars */}
          {bars.map((bar) => {
            const x = LEFT_WIDTH + (bar.startSec / totalSeconds) * chartWidth;
            const w = Math.max(3, ((bar.endSec - bar.startSec) / totalSeconds) * chartWidth);
            const y = HEADER_HEIGHT + bar.rowIdx * ROW_HEIGHT + (ROW_HEIGHT - 18) / 2;
            const isHovered = hoveredBar?.id === bar.id;
            return (
              <g
                key={bar.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredBar(bar)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <rect
                  x={x} y={y} width={w} height={18} rx={3}
                  fill={bar.color}
                  fillOpacity={isHovered ? 0.95 : 0.75}
                  stroke={isHovered ? '#fff' : bar.color}
                  strokeWidth={isHovered ? 1 : 0.5}
                />
                {w > 28 && (
                  <text x={x + 4} y={y + 12} fill="#050507" fontSize="8" fontFamily="var(--font-jetbrains)" fontWeight="bold">{bar.label}</text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredBar && (
          <div
            className="pointer-events-none absolute z-[500] rounded border border-aerospace-700 bg-aerospace-900/95 px-2.5 py-1.5 text-[10px] text-aerospace-200 shadow-xl backdrop-blur"
            style={{ left: Math.min(mousePos.x + 12, width - 200), top: Math.max(mousePos.y - 30, 0) }}
          >
            <p className="font-semibold text-cyan-400">{hoveredBar.tooltip}</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 border-t border-aerospace-700 bg-aerospace-900/80 px-4 py-1.5 backdrop-blur">
        <LegendItem color="#00d4ff" label="AOI Access (Imaging)" />
        <LegendItem color="#c084fc" label="Downlink" />
        <LegendItem color="#10b981" label="Ground Station Contact" />
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-3 w-px bg-aerospace-700" />
          <span className="text-[9px] text-aerospace-500">Red dashed = now</span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-[9px] text-aerospace-400">{label}</span>
    </div>
  );
}
