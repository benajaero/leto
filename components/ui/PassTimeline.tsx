'use client';

import { useMemo, useState } from 'react';
import { useEngineStore } from '@/lib/stores/engineStore';
import { formatUtc } from '@/lib/formatters';

type PassBar = {
  id: string;
  rowIdx: number;
  startSec: number;
  endSec: number;
  color: string;
  label: string;
};

const ROW_COLORS = ['#00d4ff', '#f59e0b', '#10b981', '#c084fc', '#ef4444', '#f97316', '#8b5cf6', '#06b6d4'];
const BAR_HEIGHT = 16;
const ROW_HEIGHT = 28;
const LEFT_WIDTH = 120;
const RIGHT_PADDING = 16;

export function PassTimeline() {
  const output = useEngineStore((s) => s.output);
  const scenario = useEngineStore((s) => s.scenario);
  const [hoursRange, setHoursRange] = useState<12 | 24>(scenario.horizonHours >= 24 ? 24 : 12);

  const { rows, bars, startTime, endTime, totalSeconds } = useMemo(() => {
    if (!output) return { rows: [] as string[], bars: [] as PassBar[], startTime: 0, endTime: 0, totalSeconds: 0 };

    const start = new Date(scenario.startTimeUtc).getTime();
    const totalSec = hoursRange * 3600;
    const end = start + totalSec * 1000;

    const rowNames: string[] = [];
    const passBars: PassBar[] = [];

    output.satellites.forEach((sat, satIdx) => {
      const rowIdx = rowNames.length;
      rowNames.push(sat.name);

      sat.aoiAccess.forEach((w, i) => {
        const ws = new Date(w.startUtc).getTime();
        const we = new Date(w.endUtc).getTime();
        if (ws >= end || we <= start) return;
        passBars.push({
          id: `${sat.id}-aoi-${i}`,
          rowIdx,
          startSec: Math.max(0, (ws - start) / 1000),
          endSec: Math.min(totalSec, (we - start) / 1000),
          color: '#00d4ff',
          label: 'Access',
        });
      });

      Object.entries(sat.stationContacts).forEach(([stationId, windows]) => {
        windows.forEach((w, i) => {
          const ws = new Date(w.startUtc).getTime();
          const we = new Date(w.endUtc).getTime();
          if (ws >= end || we <= start) return;
          passBars.push({
            id: `${sat.id}-st-${stationId}-${i}`,
            rowIdx,
            startSec: Math.max(0, (ws - start) / 1000),
            endSec: Math.min(totalSec, (we - start) / 1000),
            color: '#c084fc',
            label: stationId,
          });
        });
      });
    });

    // Add ground station rows
    scenario.stations.forEach((st) => {
      const rowIdx = rowNames.length;
      rowNames.push(st.name);

      output.satellites.forEach((sat) => {
        const contacts = sat.stationContacts[st.id] || [];
        contacts.forEach((w, i) => {
          const ws = new Date(w.startUtc).getTime();
          const we = new Date(w.endUtc).getTime();
          if (ws >= end || we <= start) return;
          passBars.push({
            id: `${st.id}-contact-${sat.id}-${i}`,
            rowIdx,
            startSec: Math.max(0, (ws - start) / 1000),
            endSec: Math.min(totalSec, (we - start) / 1000),
            color: '#10b981',
            label: sat.name,
          });
        });
      });
    });

    return { rows: rowNames, bars: passBars, startTime: start, endTime: end, totalSeconds: totalSec };
  }, [output, scenario, hoursRange]);

  const width = 800;
  const chartWidth = width - LEFT_WIDTH - RIGHT_PADDING;
  const height = Math.max(120, rows.length * ROW_HEIGHT + 40);

  const timeTicks = useMemo(() => {
    const ticks: { x: number; label: string }[] = [];
    const count = hoursRange <= 12 ? 6 : 12;
    for (let i = 0; i <= count; i++) {
      const sec = (totalSeconds / count) * i;
      ticks.push({
        x: LEFT_WIDTH + (sec / totalSeconds) * chartWidth,
        label: formatUtc(new Date(startTime + sec * 1000)).slice(11, 16),
      });
    }
    return ticks;
  }, [startTime, totalSeconds, hoursRange, chartWidth]);

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
          <span className="ml-3 font-mono text-[10px] text-aerospace-500">(UTC)</span>
        </div>
        <div className="flex rounded border border-aerospace-700 bg-aerospace-800 overflow-hidden">
          <button onClick={() => setHoursRange(12)} className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition ${hoursRange === 12 ? 'bg-cyan-500/20 text-cyan-400' : 'text-aerospace-400'}`}>Next 12h</button>
          <button onClick={() => setHoursRange(24)} className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition ${hoursRange === 24 ? 'bg-cyan-500/20 text-cyan-400' : 'text-aerospace-400'}`}>Next 24h</button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: width }}>
          {/* Background */}
          <rect x={0} y={0} width={width} height={height} fill="#050507" />

          {/* Grid lines */}
          {timeTicks.map((t, i) => (
            <g key={i}>
              <line x1={t.x} y1={30} x2={t.x} y2={height} stroke="#1a1a24" strokeWidth="1" />
              <text x={t.x} y={20} fill="#5a5a7a" fontSize="9" textAnchor="middle" fontFamily="var(--font-jetbrains)">{t.label}</text>
            </g>
          ))}

          {/* Row labels & backgrounds */}
          {rows.map((name, i) => (
            <g key={name}>
              <rect x={0} y={30 + i * ROW_HEIGHT} width={LEFT_WIDTH - 8} height={ROW_HEIGHT} fill="#0a0a0f" />
              <text x={8} y={30 + i * ROW_HEIGHT + ROW_HEIGHT / 2 + 3} fill="#8a8aaa" fontSize="9" fontFamily="var(--font-jetbrains)">{name}</text>
              <line x1={LEFT_WIDTH} y1={30 + i * ROW_HEIGHT} x2={width} y2={30 + i * ROW_HEIGHT} stroke="#111118" strokeWidth="1" />
            </g>
          ))}

          {/* Bars */}
          {bars.map((bar) => {
            const x = LEFT_WIDTH + (bar.startSec / totalSeconds) * chartWidth;
            const w = Math.max(2, ((bar.endSec - bar.startSec) / totalSeconds) * chartWidth);
            const y = 30 + bar.rowIdx * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
            return (
              <g key={bar.id}>
                <rect x={x} y={y} width={w} height={BAR_HEIGHT} rx={2} fill={bar.color} fillOpacity={0.7} stroke={bar.color} strokeWidth={0.5} />
                {w > 30 && (
                  <text x={x + 4} y={y + BAR_HEIGHT / 2 + 3} fill="#050507" fontSize="8" fontFamily="var(--font-jetbrains)" fontWeight="bold">{bar.label}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t border-aerospace-700 bg-aerospace-900/80 px-4 py-1.5 backdrop-blur">
        <LegendItem color="#00d4ff" label="Access Window" />
        <LegendItem color="#c084fc" label="Downlink Window" />
        <LegendItem color="#10b981" label="Ground Station Contact" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-4 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-[9px] text-aerospace-400">{label}</span>
    </div>
  );
}
