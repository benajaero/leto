# Incident Command View — Design Specification

## 1. User Persona

**Name:** Sarah Chen  
**Role:** Emergency Operations Coordinator, Australian Disaster Response  
**Context:** Bushfire season. Working from a field command center with a laptop and occasionally an iPad. Internet is spotty. Needs to brief the Incident Controller every 2 hours on what satellite coverage is available and which fires should be prioritized for imagery tasking.

**Goals:**
- Know which incidents have satellite coverage coming up soon
- Understand time-to-observation and time-to-downlink at a glance
- Make a prioritization decision in under 60 seconds
- Export a clean summary for briefing materials

**Pain points with current tools:**
- Existing GIS tools are powerful but slow and overwhelming
- Spreadsheets with TLE data require manual lookup
- No single view that combines incidents + satellite access + data delivery timeline
- Current LETO prototype has all the data but no clear narrative — she has to hunt for answers

**Tech comfort:** Medium. Uses Google Earth, Excel, and emergency management SaaS tools daily. Not an orbital mechanics expert.

---

## 2. Use Cases

| ID | Use Case | Priority |
|---|---|---|
| UC-1 | Sarah opens LETO and immediately sees ranked incidents by serviceability score | Must |
| UC-2 | She taps an incident to see a clear timeline: next pass → observation → downlink → data available | Must |
| UC-3 | She filters incidents by type (fire/flood/cyclone) and confidence/severity | Must |
| UC-4 | She exports a 1-page summary of top-5 prioritized incidents with satellite access windows | Must |
| UC-5 | She works offline after initial load and still sees cached incident + satellite data | Should |
| UC-6 | She compares two scenarios (e.g., with/without a requested SAR satellite) side by side | Could |

---

## 3. Requirements

### Functional

**F-1 Incident Ranked List**
- Display incidents in a scrollable list sorted by serviceability score (highest first)
- Each card shows: incident type icon, location name (reverse geocoded or lat/lon), confidence/severity badge, serviceability score as a color-coded progress ring, and time-to-next-observation
- Cards are tappable to expand into a detail view

**F-2 Incident Detail View**
- Show incident on a mini-map (static image or small interactive map)
- Display a vertical timeline: Incident Reported → Next Satellite Pass (Tobs) → Ground Station Contact (Tdl) → Data Available
- Show which satellite will observe it and from which ground station it will downlink
- Show a "confidence timeline" — if the TLE is stale (>72h), warn that predictions are uncertain

**F-3 Global Status Header**
- Always-visible banner showing: current UTC time, total active incidents, incidents with coverage in next 6h, offline/online status
- If offline: amber badge with last-sync timestamp

**F-4 Export Briefing**
- One-click export of current prioritized view as a clean HTML/PDF summary
- Include map snippet, incident table with scores, and satellite access windows
- Filename: `leto-briefing-YYYY-MM-DD-HHMM-UTC.html`

**F-5 Responsive Layout**
- Desktop: 3-column layout (list | map | detail)
- Tablet: 2-column with list+map and detail as a slide-over panel
- Mobile: Single column, list first, detail as full-screen modal

### Non-Functional

**NF-1 Performance:** First meaningful render < 2s on a 3-year-old laptop. List scroll at 60fps.
**NF-2 Offline:** App must function with cached data after initial load. No blank screens on failed fetches.
**NF-3 Accessibility:** WCAG 2.1 AA minimum. Color-coded scores also have text labels.
**NF-4 Data Freshness:** Clearly surface the age of every data point. Never silently show stale data as current.

---

## 4. Design Parameters

### Visual Language
- **Color system:** Keep the existing blush/rose palette — it's distinctive and emotionally appropriate for emergency response (urgent but not alarming)
- **Score colors:** Use a 4-step semantic scale instead of a gradient:
  - 80-100: Emerald (Excellent — task immediately)
  - 50-79: Amber (Good — task if capacity)
  - 20-49: Orange (Marginal — consider alternatives)
  - 0-19: Rose (Poor — no useful coverage in window)
- **Typography:** Clean, airy sans-serif. Large numbers for scores (they're the hero metric). Small caps for labels.
- **Spacing:** Generous padding — this is read under pressure, not browsed leisurely.

### Interaction Patterns
- **Progressive disclosure:** List shows summary → tap expands detail → tap again collapses
- **Hover/focus states:** Subtle elevation change (shadow) rather than color inversion
- **Loading states:** Skeleton screens for list items, never spinners on blank backgrounds
- **Empty states:** If no incidents match filters, show a friendly message + "Clear filters" CTA

### Information Architecture

```
┌─────────────────────────────────────────────┐
│  [LETO Logo]  UTC: 14:32  |  12 incidents   │  ← Global Status
│  🟢 Online  |  4 with coverage <6h          │
├──────────────────┬──────────────────────────┤
│                  │                          │
│  INCIDENT LIST   │       MAP VIEW           │
│  (ranked)        │       (focused AOI)      │
│                  │                          │
│  🔥 Fire A       │                          │
│  Score: 87 🟢    │    [Map with incidents   │
│  Tobs: 42 min    │     and satellite tracks]│
│                  │                          │
│  🔥 Fire B       │                          │
│  Score: 62 🟡    ├──────────────────────────┤
│  Tobs: 3h 12m    │   INCIDENT DETAIL        │
│                  │   (timeline + mini-map)  │
│  💧 Flood C      │                          │
│  Score: 34 🟠    │                          │
│  Tobs: 7h 45m    │                          │
│                  │                          │
├──────────────────┴──────────────────────────┤
│  [Export Briefing]  [Run Scenario]          │
└─────────────────────────────────────────────┘
```

---

## 5. Feature Set

### MVP (this implementation cycle)
1. **Incident Ranked List** component with serviceability sorting
2. **Incident Detail Panel** with timeline visualization
3. **Global Status Header** with UTC clock and summary stats
4. **Export Briefing** as HTML download
5. **Responsive layout** that works on laptop and tablet

### v2 (future)
- Side-by-side scenario comparison
- PDF export with embedded map images
- Real-time WebSocket feed integration
- User annotations on incidents
- Historical trend charts

---

## 6. Component Breakdown

| Component | File | Responsibility |
|---|---|---|
| `CommandView` | `src/ui/CommandView.tsx` | Top-level layout orchestrator |
| `StatusHeader` | `src/ui/StatusHeader.tsx` | UTC clock, stats, online/offline badge |
| `IncidentList` | `src/ui/IncidentList.tsx` | Scrollable ranked list of incidents |
| `IncidentCard` | `src/ui/IncidentCard.tsx` | Single incident summary card |
| `IncidentDetail` | `src/ui/IncidentDetail.tsx` | Expanded detail with timeline |
| `MissionTimeline` | `src/ui/MissionTimeline.tsx` | Vertical timeline visualization |
| `MiniMap` | `src/ui/MiniMap.tsx` | Small focused map for detail view |
| `ExportBriefing` | `src/ui/ExportBriefing.tsx` | HTML generation and download |
| `ScoreBadge` | `src/ui/ScoreBadge.tsx` | Reusable score indicator with color + label |

---

## 7. Data Flow

1. `App.tsx` loads scenario + incidents → passes to `CommandView`
2. `CommandView` computes sorted incident list from `engineOutput.incidentMetrics`
3. User selects incident → `CommandView` shows `IncidentDetail`
4. Map highlights selected incident + its satellite's next pass ground track
5. Export button triggers `ExportBriefing` which reads current state and generates HTML

---

## 8. Open Questions (none blocking)

- Should the list auto-sort as the engine recomputes, or stay in the order the user last saw?
- Should we attempt reverse geocoding (lat/lon → place name) or keep raw coordinates?
- Should the briefing export include satellite TLE epoch warnings?

These can be decided during implementation; the design is robust either way.

---

## 9. Success Criteria

- [ ] A user can open the app and understand which incident to prioritize in < 10 seconds
- [ ] The incident list is readable and actionable without scrolling through raw data
- [ ] The timeline makes Tobs/Tdl intuitive to non-orbital-mechanics users
- [ ] Export generates a clean, shareable HTML file
- [ ] Layout works on laptop (primary) and iPad (secondary)
- [ ] All existing engine tests still pass
- [ ] New UI components have tests for sorting, filtering, and export generation
