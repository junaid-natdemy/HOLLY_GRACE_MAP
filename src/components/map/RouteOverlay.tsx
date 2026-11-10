import React, { useMemo } from 'react';
import { RouteResult } from '../../types/campus';

interface RouteOverlayProps {
  route: RouteResult | null;
  selectedStageNumber?: number;
}

export const RouteOverlay: React.FC<RouteOverlayProps> = ({
  route,
  selectedStageNumber,
}) => {
  if (!route || route.points.length < 2) {
    return null;
  }

  const { startConnector, roadPoints, roadSvgPath, destinationConnector } = route;
  const hasRoadSegment = roadPoints && roadPoints.length >= 2;
  const mainRoadPath =
    roadSvgPath ||
    (hasRoadSegment
      ? roadPoints.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
      : '');

  const endPoint = route.targetPoint || route.points[route.points.length - 1];

  // Generate forward directional chevrons along the road path (Classic standard)
  const chevrons = useMemo(() => {
    if (!roadPoints || roadPoints.length < 2) return [];
    const list: Array<{ x: number; y: number; angle: number }> = [];
    const spacing = 32;

    for (let i = 0; i < roadPoints.length - 1; i++) {
      const p1 = roadPoints[i];
      const p2 = roadPoints[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segDist = Math.hypot(dx, dy);
      if (segDist < 12) continue;

      const ux = dx / segDist;
      const uy = dy / segDist;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      let d = Math.min(segDist * 0.5, Math.max(12, spacing * 0.5));
      while (d < segDist - 8) {
        list.push({
          x: Math.round((p1.x + ux * d) * 10) / 10,
          y: Math.round((p1.y + uy * d) * 10) / 10,
          angle: Math.round(angle * 10) / 10,
        });
        d += spacing;
      }
    }
    return list;
  }, [roadPoints]);

  return (
    <g className="route-overlay-layer">
      {/* 1. CURVED DOTTED CONNECTOR (User Off-Road Start Point -> Nearest Road Node) */}
      {startConnector && (
        <g className="walking-connector-start" data-testid="start-walking-connector">
          {/* Subtle soft ambient halo */}
          <path
            d={startConnector.svgPath}
            fill="none"
            stroke="rgba(0, 0, 0, 0.2)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Circular Jet Black walking beads */}
          <path
            d={startConnector.svgPath}
            fill="none"
            stroke="#09090b"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray="0.1 9"
            className="animate-walking-dots"
            opacity="0.95"
          />
          {/* Subtle graphite core highlight in each bead */}
          <path
            d={startConnector.svgPath}
            fill="none"
            stroke="#71717a"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="0.1 9"
            className="animate-walking-dots"
            opacity="0.5"
          />
          {/* Junction indicator where pedestrian joins the road */}
          <g transform={`translate(${startConnector.targetNode.x}, ${startConnector.targetNode.y})`}>
            <circle r="5.5" fill="#18181b" opacity="0.3" />
            <circle r="3.2" fill="#09090b" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        </g>
      )}

      {/* 2. CAMPUS ROAD NETWORK PATH: CLASSIC SOLID BLACK NAVIGATION RIBBON */}
      {hasRoadSegment && mainRoadPath && (
        <g className="campus-road-path">
          {/* A. Ambient Drop Shadow (Creates realistic 3D elevation over satellite imagery) */}
          <path
            d={mainRoadPath}
            fill="none"
            stroke="rgba(0, 0, 0, 0.35)"
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* B. Crisp High-Contrast Outer Border (Deep graphite/slate) */}
          <path
            d={mainRoadPath}
            fill="none"
            stroke="#27272a"
            strokeWidth="6.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />

          {/* C. Primary Solid Jet Black Navigation Ribbon */}
          <path
            d={mainRoadPath}
            fill="none"
            stroke="#09090b"
            strokeWidth="5.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* D. Continuous Luminous Graphite Sheen (Smooth 3D tubular sheen) */}
          <path
            d={mainRoadPath}
            fill="none"
            stroke="#71717a"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.35"
          />

          {/* E. Subtle Directional Forward Chevrons (Crisp White on Black) */}
          {chevrons.map((ch, idx) => (
            <g
              key={`chev-${idx}`}
              transform={`translate(${ch.x}, ${ch.y}) rotate(${ch.angle})`}
              className="pointer-events-none select-none"
            >
              <polyline
                points="-2.4,-2.8 1.6,0 -2.4,2.8"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            </g>
          ))}
        </g>
      )}

      {/* 3. CURVED DOTTED CONNECTOR (Last Road Node -> Destination Access Point / Venue) */}
      {destinationConnector && (
        <g className="walking-connector-destination" data-testid="destination-walking-connector">
          {/* Subtle soft ambient halo */}
          <path
            d={destinationConnector.svgPath}
            fill="none"
            stroke="rgba(0, 0, 0, 0.2)"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          {/* Circular Jet Black walking beads */}
          <path
            d={destinationConnector.svgPath}
            fill="none"
            stroke="#09090b"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeDasharray="0.1 9"
            className="animate-walking-dots"
            opacity="0.95"
          />
          {/* Subtle graphite core highlight */}
          <path
            d={destinationConnector.svgPath}
            fill="none"
            stroke="#71717a"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="0.1 9"
            className="animate-walking-dots"
            opacity="0.5"
          />
        </g>
      )}

      {/* 4. Fallback if roadPoints < 2 and no connectors (rare direct line) */}
      {!hasRoadSegment && !startConnector && !destinationConnector && (
        <path
          d={route.points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')}
          fill="none"
          stroke="#09090b"
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}

      {/* 5. Destination Point Marker (Red pulse badge with Stage / Star number) */}
      <g transform={`translate(${endPoint.x}, ${endPoint.y})`}>
        <circle r="16" fill="#dc2626" opacity="0.25" />
        <circle r="11" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
        <text
          x="0"
          y="3.5"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="8.5"
          fontWeight="bold"
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          {selectedStageNumber ? `S${selectedStageNumber}` : '★'}
        </text>
      </g>
    </g>
  );
};
