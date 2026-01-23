export type LatLon = { lat: number; lon: number };

export type TimeWindowHours = 6 | 12 | 24;
export type TimeStepSeconds = 30 | 60 | 120;

export type SatelliteTle = {
  id: string;
  name: string;
  type: 'tle';
  line1: string;
  line2: string;
  footprintHalfAngleDeg?: number;
};

export type SatelliteCircular = {
  id: string;
  name: string;
  type: 'circular';
  altitudeKm: number;
  inclinationDeg: number;
  raanDeg: number;
  meanAnomalyDeg: number;
  footprintHalfAngleDeg?: number;
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
  display?: {
    showTracks: boolean;
    showFootprints: boolean;
    showStations: boolean;
    layerToggles: {
      firms: boolean;
      gdacs: boolean;
      dea?: boolean;
    };
  };
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
  avgGapSeconds: number;
  maxGapSeconds: number;
};

export type HeatmapCell = {
  lat: number;
  lon: number;
  coverageFraction: number;
};

export type IncidentMetrics = {
  incidentId: string;
  tFirstObsSeconds: number | null;
  tFirstDownlinkSeconds: number | null;
  score: number;
  servingSatellite?: string;
  serviceabilityLabel?: string;
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
