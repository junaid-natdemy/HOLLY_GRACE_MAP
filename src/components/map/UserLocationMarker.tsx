import React from 'react';
import { UserLocation } from '../../types/campus';

interface UserLocationMarkerProps {
  location: UserLocation | null;
  metersPerPixel?: number;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  location,
  metersPerPixel,
}) => {
  if (!location) return null;

  const { x, y } = location.pixelCoord;
  const isGps = location.type === 'gps';

  // Calculate pixel radius for accuracy circle if GPS accuracy and scale are known
  let accuracyRadiusPx = 0;
  if (isGps && location.accuracyMeters && metersPerPixel && metersPerPixel > 0) {
    accuracyRadiusPx = Math.min(100, Math.max(15, location.accuracyMeters / metersPerPixel));
  }

  return (
    <g className="user-location-layer" transform={`translate(${x}, ${y})`}>
      {/* Accuracy circle for real GPS */}
      {isGps && accuracyRadiusPx > 0 && (
        <circle
          r={accuracyRadiusPx}
          fill="#3b82f6"
          fillOpacity="0.12"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      )}

      {/* Pulsing radar ring */}
      <circle
        r={isGps ? 20 : 16}
        fill={isGps ? '#2563eb' : '#f59e0b'}
        fillOpacity="0.25"
        className="animate-ping-slow"
      />

      {/* Middle halo */}
      <circle
        r={isGps ? 11 : 9}
        fill={isGps ? '#60a5fa' : '#fcd34d'}
        fillOpacity="0.5"
      />

      {/* Core marker circle */}
      <circle
        r={isGps ? 7 : 6}
        fill={isGps ? '#1d4ed8' : '#d97706'}
        stroke="#ffffff"
        strokeWidth="2.5"
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.35))"
      />

      {/* Inner white dot */}
      <circle r={isGps ? 2.5 : 2} fill="#ffffff" />

      {/* Badge Pill */}
      <g transform="translate(0, -18)" className="pointer-events-none select-none">
        <rect
          x={isGps ? -36 : -44}
          y="-16"
          width={isGps ? 72 : 88}
          height="16"
          rx="5"
          fill={isGps ? '#1e40af' : '#b45309'}
          opacity="0.95"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"
        />
        <text
          x="0"
          y="-5"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="8"
          fontWeight="700"
          fontFamily="Plus Jakarta Sans, sans-serif"
          letterSpacing="0.4px"
        >
          {isGps ? 'MY LOCATION' : 'TEST MODE'}
        </text>
      </g>
    </g>
  );
};

