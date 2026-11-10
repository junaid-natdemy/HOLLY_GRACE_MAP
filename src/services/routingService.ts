import { getPositionById } from '../config/campusPositions';
import { CAMPUS_ROAD_GRAPH, getEntranceNode } from '../config/roadNetwork';
import { pixelToNormalized } from '../config/mapConfig';
import {
  CampusPosition,
  DestinationAccessPoint,
  PixelPoint,
  RoadGraph,
  RoadNode,
  RouteResult,
  ScaleCalibration,
  WalkingConnector,
} from '../types/campus';

/**
 * Priority queue item for Dijkstra / A*
 */
interface PriorityQueueItem {
  nodeId: string;
  cost: number;
  priority: number;
}

class MinPriorityQueue {
  private items: PriorityQueueItem[] = [];

  push(item: PriorityQueueItem) {
    this.items.push(item);
    this.items.sort((a, b) => a.priority - b.priority);
  }

  pop(): PriorityQueueItem | undefined {
    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

/**
 * Find the closest road node in the graph to an arbitrary pixel point
 */
export function findNearestNode(point: PixelPoint, graph: RoadGraph = CAMPUS_ROAD_GRAPH): RoadNode {
  let closestNode: RoadNode | null = null;
  let minDistance = Infinity;

  for (const node of Object.values(graph.nodes)) {
    const dist = Math.hypot(node.pixelCoord.x - point.x, node.pixelCoord.y - point.y);
    if (dist < minDistance) {
      minDistance = dist;
      closestNode = node;
    }
  }

  if (!closestNode) {
    return getEntranceNode(graph.nodes) || Object.values(graph.nodes)[0];
  }

  return closestNode;
}

/**
 * A* / Dijkstra pathfinding on the road graph
 */
export function findShortestPathBetweenNodes(
  startNodeId: string,
  targetNodeId: string,
  graph: RoadGraph = CAMPUS_ROAD_GRAPH
): { nodeIds: string[]; totalDistance: number } | null {
  if (!graph.nodes[startNodeId] || !graph.nodes[targetNodeId]) {
    return null;
  }

  if (startNodeId === targetNodeId) {
    return { nodeIds: [startNodeId], totalDistance: 0 };
  }

  const targetNode = graph.nodes[targetNodeId];
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visited = new Set<string>();

  for (const nodeId of Object.keys(graph.nodes)) {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
  }

  distances[startNodeId] = 0;
  const pq = new MinPriorityQueue();
  pq.push({ nodeId: startNodeId, cost: 0, priority: 0 });

  while (!pq.isEmpty()) {
    const current = pq.pop()!;
    const u = current.nodeId;

    if (u === targetNodeId) break;
    if (visited.has(u)) continue;
    visited.add(u);

    const neighbors = graph.adjacencyList[u] || [];
    for (const neighbor of neighbors) {
      const v = neighbor.to;
      if (visited.has(v)) continue;

      const alt = distances[u] + neighbor.weight;
      if (alt < distances[v]) {
        distances[v] = alt;
        previous[v] = u;

        // A* Euclidean heuristic
        const vNode = graph.nodes[v];
        const h = vNode
          ? Math.hypot(
              targetNode.pixelCoord.x - vNode.pixelCoord.x,
              targetNode.pixelCoord.y - vNode.pixelCoord.y
            )
          : 0;

        pq.push({
          nodeId: v,
          cost: alt,
          priority: alt + h,
        });
      }
    }
  }

  if (distances[targetNodeId] === Infinity) {
    return null; // No path found
  }

  // Reconstruct path
  const path: string[] = [];
  let curr: string | null = targetNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return {
    nodeIds: path,
    totalDistance: distances[targetNodeId],
  };
}

/**
 * Generate a smooth cubic Bezier curve from an off-road point into a road node,
 * curving naturally towards the direction of the road.
 */
export function generateCurvedConnector(
  start: PixelPoint,
  targetNode: PixelPoint,
  nextNode?: PixelPoint
): { svgPath: string; points: PixelPoint[]; distancePx: number } {
  const dx = targetNode.x - start.x;
  const dy = targetNode.y - start.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 3) {
    return {
      svgPath: `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} L ${targetNode.x.toFixed(1)} ${targetNode.y.toFixed(1)}`,
      points: [start, targetNode],
      distancePx: dist,
    };
  }

  // Unit vector from start to targetNode
  const ux = dx / dist;
  const uy = dy / dist;

  // Perpendicular vector (-uy, ux)
  const px = -uy;
  const py = ux;

  let c1x: number;
  let c1y: number;
  let c2x: number;
  let c2y: number;

  if (nextNode) {
    const rdx = nextNode.x - targetNode.x;
    const rdy = nextNode.y - targetNode.y;
    const rdist = Math.hypot(rdx, rdy);

    if (rdist > 0.1) {
      const rx = rdx / rdist;
      const ry = rdy / rdist;

      const cross = ux * ry - uy * rx;
      const bendSign = cross >= 0 ? 1.0 : -1.0;
      const bendStrength = Math.min(1.0, Math.abs(cross) * 2.5);

      // Approach direction into targetNode:
      // Blends direct approach (ux, uy) with road direction (rx, ry)
      let appX = ux * 0.65 + rx * 0.35;
      let appY = uy * 0.65 + ry * 0.35;
      const appLen = Math.hypot(appX, appY);
      if (appLen > 0.01) {
        appX /= appLen;
        appY /= appLen;
      } else {
        appX = ux;
        appY = uy;
      }

      c2x = targetNode.x - appX * (dist * 0.38);
      c2y = targetNode.y - appY * (dist * 0.38);

      // Departure direction from start:
      // Gently curves towards the travel direction
      let depX = ux * 0.85 + px * (0.2 * bendSign * bendStrength);
      let depY = uy * 0.85 + py * (0.2 * bendSign * bendStrength);
      const depLen = Math.hypot(depX, depY);
      depX /= depLen;
      depY /= depLen;

      c1x = start.x + depX * (dist * 0.38);
      c1y = start.y + depY * (dist * 0.38);
    } else {
      c1x = start.x + ux * (dist * 0.33) + px * (dist * 0.15);
      c1y = start.y + uy * (dist * 0.33) + py * (dist * 0.15);
      c2x = targetNode.x - ux * (dist * 0.33) + px * (dist * 0.15);
      c2y = targetNode.y - uy * (dist * 0.33) + py * (dist * 0.15);
    }
  } else {
    c1x = start.x + ux * (dist * 0.33) + px * (dist * 0.15);
    c1y = start.y + uy * (dist * 0.33) + py * (dist * 0.15);
    c2x = targetNode.x - ux * (dist * 0.33) + px * (dist * 0.15);
    c2y = targetNode.y - uy * (dist * 0.33) + py * (dist * 0.15);
  }

  const svgPath = `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${targetNode.x.toFixed(1)} ${targetNode.y.toFixed(1)}`;

  // Sample intermediate points along the cubic Bezier curve
  const samples = Math.max(4, Math.min(16, Math.round(dist / 15)));
  const points: PixelPoint[] = [start];
  let arcLength = 0;
  let prevPt = start;

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const invT = 1 - t;
    const x =
      invT * invT * invT * start.x +
      3 * invT * invT * t * c1x +
      3 * invT * t * t * c2x +
      t * t * t * targetNode.x;
    const y =
      invT * invT * invT * start.y +
      3 * invT * invT * t * c1y +
      3 * invT * t * t * c2y +
      t * t * t * targetNode.y;
    const pt = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    arcLength += Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y);
    prevPt = pt;
    points.push(pt);
  }

  return {
    svgPath,
    points,
    distancePx: Math.round(arcLength * 10) / 10,
  };
}

/**
 * Calculate route from any start coordinate to a selected campus position,
 * taking into account destination access points and road network graph.
 */
export function calculateRoute(
  startPoint: PixelPoint,
  destinationPositionId: number,
  scaleCalibration?: ScaleCalibration,
  graph: RoadGraph = CAMPUS_ROAD_GRAPH,
  accessPoints?: Record<number, DestinationAccessPoint>,
  customPositions?: CampusPosition[]
): RouteResult | null {
  const destPos = getPositionById(destinationPositionId, customPositions);
  if (!destPos) return null;

  // Determine target road node via access point or direct anchor
  const accessPoint = accessPoints?.[destinationPositionId];
  let targetNodeId = '';

  if (accessPoint && accessPoint.connectedRoadNodeId && graph.nodes[accessPoint.connectedRoadNodeId]) {
    targetNodeId = accessPoint.connectedRoadNodeId;
  } else {
    // If accessPoint has no valid connected node or none set, snap to closest road node
    const targetPoint = accessPoint?.pixelCoord || destPos.pixelCoord;
    const nearest = findNearestNode(targetPoint, graph);
    if (nearest) {
      targetNodeId = nearest.id;
    } else if (graph.nodes[destPos.roadNetworkNodeId]) {
      targetNodeId = destPos.roadNetworkNodeId;
    }
  }

  const nearestStartNode = findNearestNode(startPoint, graph);
  if (!nearestStartNode) return null;

  const pathResult = findShortestPathBetweenNodes(nearestStartNode.id, targetNodeId, graph);
  if (!pathResult) return null;

  // 1. Build road network points along verified graph
  const roadPoints: PixelPoint[] = [];
  for (const nodeId of pathResult.nodeIds) {
    const node = graph.nodes[nodeId];
    if (node) {
      roadPoints.push(node.pixelCoord);
    }
  }

  const roadSvgPath = roadPoints.reduce((acc, pt, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
  }, '');

  let totalPixelDistance = pathResult.totalDistance;

  // 2. Off-road Start Connector:
  // If startPoint is not right on nearestStartNode (> 4px), create a smooth curved dotted line
  const distToStartNode = Math.hypot(
    startPoint.x - nearestStartNode.pixelCoord.x,
    startPoint.y - nearestStartNode.pixelCoord.y
  );

  let startConnector: WalkingConnector | null = null;
  let startCurvePoints: PixelPoint[] = [];

  if (distToStartNode > 4) {
    const nextNodeId = pathResult.nodeIds.length > 1 ? pathResult.nodeIds[1] : undefined;
    const nextRoadNode = nextNodeId ? graph.nodes[nextNodeId] : undefined;

    const curve = generateCurvedConnector(
      startPoint,
      nearestStartNode.pixelCoord,
      nextRoadNode?.pixelCoord
    );

    startConnector = {
      start: startPoint,
      targetNode: nearestStartNode.pixelCoord,
      svgPath: curve.svgPath,
      distancePx: curve.distancePx,
    };
    startCurvePoints = curve.points;
    totalPixelDistance += curve.distancePx;
  }

  // 3. Destination Connector:
  // From target road node to destination access point or building badge
  const targetPoint = accessPoint?.pixelCoord || destPos.pixelCoord;
  const lastRoadNode = graph.nodes[targetNodeId];
  let destinationConnector: WalkingConnector | null = null;
  let destCurvePoints: PixelPoint[] = [];

  if (lastRoadNode) {
    const distToTarget = Math.hypot(
      targetPoint.x - lastRoadNode.pixelCoord.x,
      targetPoint.y - lastRoadNode.pixelCoord.y
    );
    if (distToTarget > 4) {
      const prevNodeId =
        pathResult.nodeIds.length >= 2
          ? pathResult.nodeIds[pathResult.nodeIds.length - 2]
          : undefined;
      const prevRoadNode = prevNodeId ? graph.nodes[prevNodeId] : undefined;

      // Guide curve departing the road towards the target
      const forwardGuide = prevRoadNode
        ? {
            x: 2 * lastRoadNode.pixelCoord.x - prevRoadNode.pixelCoord.x,
            y: 2 * lastRoadNode.pixelCoord.y - prevRoadNode.pixelCoord.y,
          }
        : undefined;

      const curve = generateCurvedConnector(
        lastRoadNode.pixelCoord,
        targetPoint,
        forwardGuide
      );

      destinationConnector = {
        start: lastRoadNode.pixelCoord,
        targetNode: targetPoint,
        svgPath: curve.svgPath,
        distancePx: curve.distancePx,
      };
      destCurvePoints = curve.points;
      totalPixelDistance += curve.distancePx;
    }
  }

  // 4. Combined full points list (for backward compatibility and total span calculation)
  const allPoints: PixelPoint[] = [];
  if (startCurvePoints.length > 0) {
    allPoints.push(...startCurvePoints.slice(0, -1));
  } else if (distToStartNode > 0) {
    allPoints.push(startPoint);
  }

  allPoints.push(...roadPoints);

  if (destCurvePoints.length > 0) {
    allPoints.push(...destCurvePoints.slice(1));
  } else if (targetPoint && roadPoints.length === 0) {
    allPoints.push(targetPoint);
  }

  // Normalized points (0..1)
  const normalizedPoints = allPoints.map(pixelToNormalized);

  // Calibrated real-world distance & ETA calculation
  let calibratedDistanceMeters: number | undefined;
  let estimatedWalkingMinutes: number | undefined;

  if (scaleCalibration && scaleCalibration.isCalibrated && scaleCalibration.metersPerPixel > 0) {
    calibratedDistanceMeters = Math.round(totalPixelDistance * scaleCalibration.metersPerPixel);
    estimatedWalkingMinutes = Math.max(1, Math.round(calibratedDistanceMeters / 75));
  }

  return {
    pathNodeIds: pathResult.nodeIds,
    points: allPoints,
    normalizedPoints,
    totalPixelDistance,
    calibratedDistanceMeters,
    estimatedWalkingMinutes,
    startConnector,
    roadPoints,
    roadSvgPath,
    destinationConnector,
    targetPoint,
  };
}
