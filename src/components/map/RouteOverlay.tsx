import React from 'react';
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

  // Generate SVG path string "M x y L x y ..."
  const pathData = route.points.reduce((acc, pt, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
  }, '');

  const startPoint = route.points[0];
  const endPoint = route.points[route.points.length - 1];

  return (
    <g className="route-overlay-layer">
      <defs>
        {/* Glow filter for route line contrast against aerial photograph */}
        <filter id="routeGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
        </filter>
        <filter id="markerShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* 1. Deep blue outer halo backing */}
      <path
        d={pathData}
        fill="none"
        stroke="#1e3a8a"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* 2. Vibrant Royal Blue casing (matching reference blue markings) */}
      <path
        d={pathData}
        fill="none"
        stroke="#2563eb"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />

      {/* 3. Electric Blue core highlight */}
      <path
        d={pathData}
        fill="none"
        stroke="#60a5fa"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />

      {/* 4. Crisp White dotted navigation line (matches blue-and-white dotted reference) */}
      <path
        d={pathData}
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 9"
        className="animate-route-dash"
        filter="url(#routeGlow)"
      />

      {/* Start Point Marker (User Origin / Entrance) */}
      <g transform={`translate(${startPoint.x}, ${startPoint.y})`}>
        <circle r="10" fill="#3b82f6" opacity="0.3" className="animate-ping-slow" />
        <circle r="7" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2.5" filter="url(#markerShadow)" />
        <circle r="2.5" fill="#ffffff" />
      </g>

      {/* Destination Point Marker */}
      <g transform={`translate(${endPoint.x}, ${endPoint.y})`} filter="url(#markerShadow)">
        <circle r="16" fill="#dc2626" opacity="0.25" className="animate-pulse" />
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
