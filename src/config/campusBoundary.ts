import { BoundaryData, BoundaryEdge, BoundaryNode, PixelPoint } from '../types/campus';

/**
 * Campus Walkable Boundary (Geofence Perimeter Graph)
 * Fresh start for new campus map
 */
export const CAMPUS_BOUNDARY_DATA: BoundaryData = {
  nodes: {},
  edges: [],
  isEnforced: false,
};

/**
 * Generate default BoundaryData with nodes and edges forming a closed ring.
 */
export function getDefaultBoundaryData(): BoundaryData {
  return JSON.parse(JSON.stringify(CAMPUS_BOUNDARY_DATA));
}

/**
 * Auto-connect boundary nodes in a clean perimeter loop without crisscrossing lines,
 * by ordering nodes angularly around their common geometric center.
 */
export function autoConnectPerimeterEdges(nodes: Record<string, BoundaryNode>): BoundaryEdge[] {
  const nodeList = Object.values(nodes);
  if (nodeList.length < 2) return [];

  // Compute centroid
  let cx = 0;
  let cy = 0;
  for (const n of nodeList) {
    cx += n.pixelCoord.x;
    cy += n.pixelCoord.y;
  }
  cx /= nodeList.length;
  cy /= nodeList.length;

  // Sort by angle around centroid
  const sorted = [...nodeList].sort((a, b) => {
    const angleA = Math.atan2(a.pixelCoord.y - cy, a.pixelCoord.x - cx);
    const angleB = Math.atan2(b.pixelCoord.y - cy, b.pixelCoord.x - cx);
    return angleA - angleB;
  });

  const edges: BoundaryEdge[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const nextIdx = (i + 1) % sorted.length;
    edges.push({ from: sorted[i].id, to: sorted[nextIdx].id });
  }
  return edges;
}

/**
 * Extract an ordered polygon vertex list from the boundary graph.
 */
export function extractPolygonFromBoundaryData(data: BoundaryData): PixelPoint[] {
  const nodes = data.nodes;
  const edges = data.edges;
  const nodeKeys = Object.keys(nodes);

  if (nodeKeys.length < 3) {
    return nodeKeys.map((k) => nodes[k].pixelCoord);
  }

  if (edges.length >= 3) {
    // Build adjacency list
    const adj: Record<string, string[]> = {};
    for (const k of nodeKeys) adj[k] = [];
    for (const e of edges) {
      if (nodes[e.from] && nodes[e.to]) {
        adj[e.from].push(e.to);
        adj[e.to].push(e.from);
      }
    }

    // Traverse cycle starting at first node with at least one connection
    const startNodeId = nodeKeys.find((k) => adj[k].length > 0) || nodeKeys[0];
    const visited = new Set<string>();
    const path: PixelPoint[] = [];

    let curr: string | undefined = startNodeId;
    while (curr && !visited.has(curr)) {
      visited.add(curr);
      path.push(nodes[curr].pixelCoord);
      const next: string | undefined = adj[curr]?.find((n) => !visited.has(n));
      curr = next;
    }

    if (path.length >= 3) {
      return path;
    }
  }

  // Fallback: angularly sorted points
  const sortedEdges = autoConnectPerimeterEdges(nodes);
  const visited = new Set<string>();
  const fallbackPath: PixelPoint[] = [];
  for (const e of sortedEdges) {
    if (!visited.has(e.from) && nodes[e.from]) {
      visited.add(e.from);
      fallbackPath.push(nodes[e.from].pixelCoord);
    }
  }
  return fallbackPath.length >= 3 ? fallbackPath : nodeKeys.map((k) => nodes[k].pixelCoord);
}

/**
 * Point-in-polygon test using ray-casting algorithm (Even-Odd Rule).
 * Returns true if point is inside polygon, false otherwise.
 */
export function isPointInPolygon(point: PixelPoint, polygon: PixelPoint[]): boolean {
  if (!polygon || polygon.length < 3) {
    return true; // No boundary restriction if polygon is not defined
  }

  let inside = false;
  const { x, y } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}
