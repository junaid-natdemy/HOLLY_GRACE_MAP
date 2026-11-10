export interface NormalizedPoint {
  x: number; // 0 to 1
  y: number; // 0 to 1
}

export interface PixelPoint {
  x: number;
  y: number;
}

export interface DestinationAccessPoint {
  positionId: number; // 1 to 10
  pixelCoord: PixelPoint;
  normalizedCoord: NormalizedPoint;
  connectedRoadNodeId: string;
  label?: string;
}

export interface RoadNetworkData {
  nodes: Record<string, RoadNode>;
  edges: RoadEdge[];
  accessPoints: Record<number, DestinationAccessPoint>;
}

export type CampusCategory =
  | 'academic'
  | 'stage_complex'
  | 'outdoor'
  | 'administrative'
  | 'auditorium'
  | 'gate'
  | 'bike_parking'
  | 'car_parking'
  | 'vip_parking'
  | 'commercial'
  | string;

export interface CampusPosition {
  id: number;
  name: string;
  description: string;
  normalizedCoord: NormalizedPoint;
  pixelCoord: PixelPoint;
  roadNetworkNodeId: string;
  accessPoint?: DestinationAccessPoint;
  category: CampusCategory;
}

export interface Stage {
  stageNumber: number;
  name: string;
  positionId: number;
  floor?: string; // Optional floor text, e.g. "Ground Floor", "1st Floor", "Floor 2", or empty/blank
  category?: string;
  tags?: string[];
}

export interface RoadNode {
  id: string;
  label?: string;
  pixelCoord: PixelPoint;
  normalizedCoord: NormalizedPoint;
  isPositionAnchor?: number; // Position ID if it directly anchors a position
  isEntrance?: boolean; // True if designated as campus entrance gate
  notes?: string;
}

export interface RoadEdge {
  from: string;
  to: string;
  distancePx: number;
  isCoveredWalkway?: boolean;
  fieldVerificationNeeded?: boolean;
}

export interface RoadGraph {
  nodes: Record<string, RoadNode>;
  edges: RoadEdge[];
  adjacencyList: Record<string, { to: string; weight: number }[]>;
}

export interface WalkingConnector {
  start: PixelPoint;
  targetNode: PixelPoint;
  svgPath: string; // Cubic Bezier SVG path
  distancePx: number;
}

export interface RouteResult {
  pathNodeIds: string[];
  points: PixelPoint[];
  normalizedPoints: NormalizedPoint[];
  totalPixelDistance: number;
  calibratedDistanceMeters?: number;
  estimatedWalkingMinutes?: number;
  startConnector?: WalkingConnector | null;
  roadPoints?: PixelPoint[];
  roadSvgPath?: string;
  destinationConnector?: WalkingConnector | null;
  targetPoint?: PixelPoint;
}

export interface GpsCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number; // meters
  heading?: number | null;
  timestamp?: number;
}

export interface CalibrationPoint {
  id: string;
  name: string;
  pixelCoord: PixelPoint;
  normalizedCoord: NormalizedPoint;
  gpsCoord?: GpsCoordinate;
}

export interface ScaleCalibration {
  isCalibrated: boolean;
  metersPerPixel: number; // e.g. 0.35 meters/pixel
  referencePointA?: PixelPoint;
  referencePointB?: PixelPoint;
  referenceDistanceMeters?: number;
}

export interface UserLocation {
  type: 'gps' | 'simulated';
  pixelCoord: PixelPoint;
  normalizedCoord: NormalizedPoint;
  gpsCoord?: GpsCoordinate;
  accuracyMeters?: number;
  isTracking: boolean;
}

export interface BoundaryNode {
  id: string;
  pixelCoord: PixelPoint;
}

export interface BoundaryEdge {
  from: string;
  to: string;
}

export interface BoundaryData {
  nodes: Record<string, BoundaryNode>;
  edges: BoundaryEdge[];
  isEnforced: boolean;
}

export interface CampusBoundary {
  points: PixelPoint[];
  isEnforced: boolean;
}



