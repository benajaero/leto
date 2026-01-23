export type LatLon = { lat: number; lon: number };

export type TimeWindowHours = 6 | 12 | 24;
export type TimeStepSeconds = 30 | 60 | 120;

export type SatelliteTle = {
  id: string;
  name: string;
  type: 'tle';
  line1: string;
  line2: string;
};

export type SatelliteCircular = {
  id: string;
  name: string;
  type: 'circular';
  altitudeKm: number;
  inclinationDeg: number;
  raanDeg: number;
  meanAnomalyDeg: number;
};

export type SatelliteDef = SatelliteTle | SatelliteCircular;

export type GroundStation = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  maskDeg: number;
};

export type AOIRect = {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
};

export type Scenario = {
  id: string;
  name: string;
  startTimeUtc: string;
  horizonHours: TimeWindowHours;
  timestepSec: TimeStepSeconds;
  aoi: AOIRect;
  satellites: SatelliteDef[];
  stations: GroundStation[];
};

export type Incident = {
  id: string;
  source: 'FIRMS' | 'GDACS';
  type: string;
  severity?: number;
  confidence?: number;
  lat: number;
  lon: number;
  observedUtc: string;
  label: string;
};

export type AccessWindow = {
  startUtc: string;
  endUtc: string;
  maxElevationDeg?: number;
};

export type TrackPoint = {
  timeUtc: string;
  lat: number;
  lon: number;
  altKm: number;
  footprintKm: number;
};

export type SatelliteOutput = {
  id: string;
  name: string;
  track: TrackPoint[];
  aoiAccess: AccessWindow[];
  stationContacts: Record<string, AccessWindow[]>;
};

export type RevisitMetrics = {
  passCount: number;
  avgGapMinutes: number;
  maxGapMinutes: number;
};

export type HeatmapCell = {
  lat: number;
  lon: number;
  count: number;
};

export type IncidentMetrics = {
  incidentId: string;
  tobsMinutes: number | null;
  tdlMinutes: number | null;
  score: number;
  servingSatellite?: string;
};

export type EngineOutput = {
  scenarioId: string;
  generatedUtc: string;
  satellites: SatelliteOutput[];
  revisit: RevisitMetrics;
  heatmap: HeatmapCell[];
  incidentMetrics: IncidentMetrics[];
  warnings: string[];
};
