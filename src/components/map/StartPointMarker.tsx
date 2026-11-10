import React from 'react';
import { PixelPoint } from '../../types/campus';

interface StartPointMarkerProps {
  point: PixelPoint | null;
  hideLabel?: boolean;
}

export const StartPointMarker: React.FC<StartPointMarkerProps> = ({ point, hideLabel = true }) => {
  if (!point) return null;

  const { x, y } = point;

  return (
    <g className="start-point-marker pointer-events-none select-none" transform={`translate(${x}, ${y})`}>
      {/* 1. Radar Pulse Waves (Breathing animation) */}
      <circle
        r="20"
        fill="#10b981"
        fillOpacity="0.2"
        className="animate-ping"
        style={{ animationDuration: '3s', transformOrigin: 'center' }}
      />
      <circle r="13" fill="#10b981" fillOpacity="0.32" />

      {/* 2. Soft Ambient Ground Shadow */}
      <ellipse cx="0" cy="1.6" rx="8" ry="7" fill="rgba(0, 0, 0, 0.28)" />

      {/* 3. Pure White Elevated Ring Casing */}
      <circle r="7.2" fill="#ffffff" />

      {/* 4. Deep Emerald Core Beacon */}
      <circle r="4.8" fill="#059669" />

      {/* 5. Center Crisp White Pinpoint */}
      <circle r="1.6" fill="#ffffff" />

      {/* 6. Standard & Classic Refined "YOU" Pill Badge */}
      {!hideLabel && (
        <g transform="translate(0, -18)" className="pointer-events-none select-none">
          {/* Ambient Drop Shadow */}
          <path
            d="M -15 -13 H 15 A 5 5 0 0 1 20 -8 V -3 A 5 5 0 0 1 15 2 H 3 L 0 5 L -3 2 H -15 A 5 5 0 0 1 -20 -3 V -8 A 5 5 0 0 1 -15 -13 Z"
            fill="rgba(0, 0, 0, 0.18)"
            transform="translate(0, 1.2)"
          />

          {/* Crisp Pure White Capsule Body with Pointer Beak */}
          <path
            d="M -15 -13 H 15 A 5 5 0 0 1 20 -8 V -3 A 5 5 0 0 1 15 2 H 3 L 0 5 L -3 2 H -15 A 5 5 0 0 1 -20 -3 V -8 A 5 5 0 0 1 -15 -13 Z"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="0.8"
          />

          {/* Micro Emerald Beacon Dot */}
          <circle cx="-8" cy="-5.5" r="1.8" fill="#059669" />

          {/* Refined "YOU" Classic Typography */}
          <text
            x="3"
            y="-3.2"
            textAnchor="middle"
            fill="#0f172a"
            fontSize="7"
            fontWeight="800"
            fontFamily="Plus Jakarta Sans, sans-serif"
            letterSpacing="0.6px"
          >
            YOU
          </text>
        </g>
      )}
    </g>
  );
};

