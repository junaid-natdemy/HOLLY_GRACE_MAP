import React from 'react';
import { PixelPoint } from '../../types/campus';

interface StartPointMarkerProps {
  point: PixelPoint | null;
}

export const StartPointMarker: React.FC<StartPointMarkerProps> = ({ point }) => {
  if (!point) return null;

  const { x, y } = point;

  return (
    <g className="start-point-marker" transform={`translate(${x}, ${y})`}>
      {/* Outer pulsing radar ring */}
      <circle r="18" fill="#10b981" fillOpacity="0.25" />

      {/* Middle glowing aura */}
      <circle r="10" fill="#34d399" fillOpacity="0.45" />

      {/* Core emerald circle with white outline */}
      <circle
        r="6.5"
        fill="#059669"
        stroke="#ffffff"
        strokeWidth="2.5"
      />

      {/* Center white dot */}
      <circle r="2.2" fill="#ffffff" />

      {/* "START" Badge Pill */}
      <g transform="translate(0, -18)" className="pointer-events-none select-none">
        <rect
          x="-24"
          y="-13"
          width="48"
          height="14"
          rx="4"
          fill="#065f46"
          opacity="0.95"
        />
        <text
          x="0"
          y="-3.5"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="7.5"
          fontWeight="800"
          fontFamily="Plus Jakarta Sans, sans-serif"
          letterSpacing="0.4px"
        >
          START
        </text>
      </g>
    </g>
  );
};

