import { getPositionById } from '../config/campusPositions';
import { CAMPUS_ROAD_GRAPH, getEntranceNode } from '../config/roadNetwork';
import {
  CampusPosition,
  DestinationAccessPoint,
  PixelPoint,
  RoadGraph,
  RoadNode,
  RouteResult,
  ScaleCalibration,
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
  let targetNodeId = destPos.roadNetworkNodeId;

  if (accessPoint && graph.nodes[accessPoint.connectedRoadNodeId]) {
    targetNodeId = accessPoint.connectedRoadNodeId;
  } else if (!graph.nodes[targetNodeId]) {
    // If targetNodeId doesn't exist, snap to closest road node
    const targetPoint = accessPoint?.pixelCoord || destPos.pixelCoord;
    const nearest = findNearestNode(targetPoint, graph);
    if (nearest) {
      targetNodeId = nearest.id;
    }
  }

  const nearestStartNode = findNearestNode(startPoint, graph);
  if (!nearestStartNode) return null;

  const pathResult = findShortestPathBetweenNodes(nearestStartNode.id, targetNodeId, graph);
  if (!pathResult) return null;

  // Build the complete point list
  const points: PixelPoint[] = [];

  const distToStartNode = Math.hypot(
    startPoint.x - nearestStartNode.pixelCoord.x,
    startPoint.y - nearestStartNode.pixelCoord.y
  );

  let totalPixelDistance = pathResult.totalDistance;

  if (distToStartNode > 5) {
    points.push(startPoint);
    totalPixelDistance += distToStartNode;
  }

  for (const nodeId of pathResult.nodeIds) {
    const node = graph.nodes[nodeId];
    if (node) {
      points.push(node.pixelCoord);
    }
  }

  // If there is an explicit access point distinct from target road node, append it
  if (accessPoint) {
    const lastNode = points[points.length - 1];
    const distToAccess = Math.hypot(
      lastNode.x - accessPoint.pixelCoord.x,
      lastNode.y - accessPoint.pixelCoord.y
    );
    if (distToAccess > 4) {
      points.push(accessPoint.pixelCoord);
      totalPixelDistance += distToAccess;
    }
  } else {
    // Lead to destination position marker
    const lastPoint = points[points.length - 1];
    const distToTarget = Math.hypot(
      lastPoint.x - destPos.pixelCoord.x,
      lastPoint.y - destPos.pixelCoord.y
    );
    if (distToTarget > 4) {
      points.push(destPos.pixelCoord);
      totalPixelDistance += distToTarget;
    }
  }

  // Convert to normalized coordinates (0..1)
  const normalizedPoints = points.map((p) => ({
    x: p.x / 1280,
    y: p.y / 774,
  }));

  // Calibrated real-world distance & ETA calculation
  let calibratedDistanceMeters: number | undefined;
  let estimatedWalkingMinutes: number | undefined;

  if (scaleCalibration && scaleCalibration.isCalibrated && scaleCalibration.metersPerPixel > 0) {
    calibratedDistanceMeters = Math.round(totalPixelDistance * scaleCalibration.metersPerPixel);
    estimatedWalkingMinutes = Math.max(1, Math.round(calibratedDistanceMeters / 75));
  }

  return {
    pathNodeIds: pathResult.nodeIds,
    points,
    normalizedPoints,
    totalPixelDistance,
    calibratedDistanceMeters,
    estimatedWalkingMinutes,
  };
}
