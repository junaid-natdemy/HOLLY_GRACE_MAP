import React, { useRef, useState, useCallback } from 'react';
import { CAMPUS_POSITIONS, formatBuildingDisplayName } from '../../config/campusPositions';
import { CampusPosition, PixelPoint } from '../../types/campus';

interface MapMarkersProps {
  selectedPositionId: number | null;
  onSelectPosition: (position: CampusPosition) => void;
  positions?: CampusPosition[];
  showBadges?: boolean;
  isEditorOpen?: boolean;
  isPreviewMode?: boolean;
  targetMovePositionId?: number | null;
  onPositionDrag?: (positionId: number, pt: PixelPoint) => void;
}

/**
 * Returns a Google Maps-inspired POI theme (icon & colors) based on building category/name.
 */
function getCategoryPoiTheme(category?: string, name?: string) {
  const lower = (name || '').toLowerCase();

  // Swimming pool
  if (lower.includes('pool')) {
    return {
      bg: '#e0f2fe',
      color: '#0284c7',
      icon: (
        <path
          d="M-5 -1 C-3 -3, -1 -3, 1 -1 C3 1, 5 1, 7 -1 M-5 2 C-3 0, -1 0, 1 2 C3 4, 5 4, 7 2"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      ),
    };
  }

  // Parking
  if (lower.includes('parking') || category === 'parking') {
    return {
      bg: '#e0f2fe',
      color: '#0369a1',
      icon: (
        <path
          d="M-3 -5 H1 C3 -5 4 -3.8 4 -2 C4 -0.2 3 1 1 1 H-1 V5 H-3 Z M-1 -3 V-0.8 H0.8 C1.8 -0.8 2.2 -1.3 2.2 -2 C2.2 -2.7 1.8 -3 0.8 -3 Z"
          fill="currentColor"
        />
      ),
    };
  }

  // Stages & Auditoriums
  if (
    category === 'auditorium' ||
    category === 'stage_complex' ||
    lower.includes('auditorium') ||
    lower.includes('stage')
  ) {
    return {
      bg: '#ede9fe',
      color: '#7c3aed',
      icon: (
        <path
          d="M0 -5 L1.5 -1.5 L5.2 -1.5 L2.2 0.8 L3.3 4.5 L0 2.2 L-3.3 4.5 L-2.2 0.8 L-5.2 -1.5 L-1.5 -1.5 Z"
          fill="currentColor"
        />
      ),
    };
  }

  // Outdoor / Ground / Stalls
  if (
    category === 'outdoor' ||
    category === 'commercial' ||
    lower.includes('ground') ||
    lower.includes('stall')
  ) {
    return {
      bg: '#dcfce7',
      color: '#15803d',
      icon: (
        <path
          d="M-4 5 V-5 H2.5 L1 -2 L2.5 1 H-2 V5 Z"
          fill="currentColor"
        />
      ),
    };
  }

  // Residential / Hostel
  if (category === 'administrative' || lower.includes('hostel')) {
    return {
      bg: '#ffedd5',
      color: '#c2410c',
      icon: (
        <path
          d="M0 -5 L-5 0 H-3.2 V5 H3.2 V0 H5 Z M-1.2 5 V2 H1.2 V5 Z"
          fill="currentColor"
        />
      ),
    };
  }

  // Default Academic / Institutional Building (Classic Google Maps POI landmark)
  return {
    bg: '#dbeafe',
    color: '#1d4ed8',
    icon: (
      <path
        d="M0 -5 L-5 -1.5 H5 Z M-4 0 H-2.5 V3.5 H-4 Z M-1 0 H1 V3.5 H-1 Z M2.5 0 H4 V3.5 H2.5 Z M-5 3.8 H5 V5 H-5 Z"
        fill="currentColor"
      />
    ),
  };
}

export const MapMarkers: React.FC<MapMarkersProps> = ({
  selectedPositionId,
  onSelectPosition,
  positions = CAMPUS_POSITIONS,
  showBadges = true,
  isEditorOpen = false,
  isPreviewMode = false,
  targetMovePositionId = null,
  onPositionDrag,
}) => {
  const [activeDraggingId, setActiveDraggingId] = useState<number | null>(null);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);

  const handlePointerDown = useCallback(
    (posId: number, e: React.PointerEvent) => {
      if (!isEditorOpen || isPreviewMode) return;
      e.stopPropagation();
      setActiveDraggingId(posId);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      hasMovedRef.current = false;
      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [isEditorOpen, isPreviewMode]
  );

  const handlePointerMove = useCallback(
    (posId: number, e: React.PointerEvent) => {
      if (activeDraggingId !== posId || !onPositionDrag) return;
      e.stopPropagation();

      const dx = Math.abs(e.clientX - dragStartPos.current.x);
      const dy = Math.abs(e.clientY - dragStartPos.current.y);
      if (dx > 3 || dy > 3) {
        hasMovedRef.current = true;
      }

      const svg = (e.currentTarget as SVGElement).ownerSVGElement;
      if (!svg) return;

      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      onPositionDrag(posId, {
        x: Math.round(Math.max(0, Math.min(1280, svgP.x))),
        y: Math.round(Math.max(0, Math.min(774, svgP.y))),
      });
    },
    [activeDraggingId, onPositionDrag]
  );

  const handlePointerUp = useCallback(
    (pos: CampusPosition, e: React.PointerEvent) => {
      if (activeDraggingId === pos.id) {
        e.stopPropagation();
        try {
          (e.currentTarget as Element).releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        setActiveDraggingId(null);
        if (!hasMovedRef.current) {
          onSelectPosition(pos);
        }
      }
    },
    [activeDraggingId, onSelectPosition]
  );

  if (!showBadges) {
    return null;
  }

  return (
    <g className="campus-markers-layer">
      {positions.map((pos) => {
        const isSelected = selectedPositionId === pos.id;
        const isTargeted = targetMovePositionId === pos.id;
        const isDragging = activeDraggingId === pos.id;
        const { x, y } = pos.pixelCoord;
        const canDrag = isEditorOpen && !isPreviewMode;

        // Clean, standard, classic minimal building name
        const displayName = formatBuildingDisplayName(pos.name);
        const poiTheme = getCategoryPoiTheme(pos.category, pos.name);

        // Dynamically compute compact pill width hugging the building name
        // font-size: 6.8px with Plus Jakarta Sans bold
        const approxCharWidth = 4.2;
        const textWidth = Math.max(18, Math.round(displayName.length * approxCharWidth));
        const iconSectionWidth = 10;
        const paddingX = 5;
        const pillHeight = 13.5;
        const pillWidth = textWidth + iconSectionWidth + paddingX * 2;
        const halfWidth = Math.round(pillWidth / 2);
        const pillY = -17.5; // compact float directly above anchor dot

        return (
          <g
            key={`building-poi-${pos.id}`}
            transform={`translate(${x}, ${y})`}
            onPointerDown={(e) => handlePointerDown(pos.id, e)}
            onPointerMove={(e) => handlePointerMove(pos.id, e)}
            onPointerUp={(e) => handlePointerUp(pos, e)}
            onClick={(e) => {
              e.stopPropagation();
              if (!hasMovedRef.current) {
                onSelectPosition(pos);
              }
            }}
            className={`group select-none ${canDrag ? 'cursor-grab' : 'cursor-pointer'} ${
              isDragging ? 'cursor-grabbing' : ''
            }`}
            style={{ pointerEvents: 'all' }}
          >
            {/* 1. ANCHOR POINT AT EXACT COORDINATE (0, 0) */}

            {/* Glowing active beacon ring when selected, targeted, or dragging */}
            {(isSelected || isTargeted || isDragging) && (
              <>
                <circle
                  r={isDragging ? 13 : 10}
                  fill={isTargeted || isDragging ? '#f59e0b' : '#2563eb'}
                  opacity="0.32"
                  className="animate-ping-slow"
                />
                <circle
                  r={isDragging ? 10 : 7}
                  fill="none"
                  stroke={isTargeted || isDragging ? '#f59e0b' : '#2563eb'}
                  strokeWidth="1.2"
                  strokeDasharray="2.5 1.5"
                  className="animate-spin-slow"
                />
              </>
            )}

            {/* In Editor Mode: relocation dashed ring */}
            {canDrag && (
              <circle
                r="9"
                fill="none"
                stroke={isTargeted || isDragging ? '#f59e0b' : '#38bdf8'}
                strokeWidth="1.2"
                strokeDasharray="2.5 1.5"
                opacity={isDragging ? 1 : 0.6}
                className="transition-opacity hover:opacity-100"
              />
            )}

            {/* Anchor pin dot on building footprint */}
            <circle
              r="2.6"
              fill={isSelected ? '#1d4ed8' : isDragging ? '#f59e0b' : '#2563eb'}
              stroke="#ffffff"
              strokeWidth="1.2"
            />

            {/* 2. GOOGLE MAPS STYLE COMPACT MINIMAL BUILDING LABEL PILL */}
            <g
              className="transition-transform duration-200 group-hover:scale-105"
              style={{ transformOrigin: '0px -10px' }}
            >
              {/* Pointer triangle connecting pill to anchor dot */}
              <polygon
                points="-2.5,-3.5 2.5,-3.5 0,-1"
                fill={isSelected ? '#1d4ed8' : isDragging ? '#f59e0b' : '#ffffff'}
                stroke={isSelected ? '#1d4ed8' : isDragging ? '#f59e0b' : '#cbd5e1'}
                strokeWidth="0.4"
              />

              {/* Main Pill Capsule Container */}
              <rect
                x={-halfWidth}
                y={pillY}
                width={pillWidth}
                height={pillHeight}
                rx="6.75"
                fill={
                  isSelected
                    ? '#1d4ed8'
                    : isDragging
                    ? '#f59e0b'
                    : '#ffffff'
                }
                stroke={
                  isSelected
                    ? '#60a5fa'
                    : isDragging
                    ? '#ffffff'
                    : 'rgba(15, 23, 42, 0.14)'
                }
                strokeWidth={isSelected ? '1.2' : '0.8'}
              />

              {/* Mini Category POI Icon Circle */}
              <g transform={`translate(${-halfWidth + 7}, ${pillY + 6.75})`}>
                <circle
                  r="4"
                  fill={isSelected ? '#ffffff' : isDragging ? '#ffffff' : poiTheme.bg}
                />
                <g
                  transform="scale(0.42)"
                  style={{
                    color: isSelected
                      ? '#1d4ed8'
                      : isDragging
                      ? '#d97706'
                      : poiTheme.color,
                  }}
                >
                  {poiTheme.icon}
                </g>
              </g>

              {/* Standard Classic Minimal Premium Building Name */}
              <text
                x={-halfWidth + 14}
                y={pillY + 6.75}
                dominantBaseline="central"
                fill={
                  isSelected || isDragging
                    ? '#ffffff'
                    : '#0f172a'
                }
                fontSize="6.8"
                fontWeight="700"
                fontFamily="Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                letterSpacing="0.05px"
                className="pointer-events-none select-none"
              >
                {displayName}
              </text>
            </g>

            {/* 3. REALTIME COORDINATES PILL WHILE DRAGGING IN DEV MODE */}
            {isDragging && (
              <g transform="translate(0, 14)" className="pointer-events-none">
                <rect
                  x="-38"
                  y="-10"
                  width="76"
                  height="18"
                  rx="6"
                  fill="#0f172a"
                  stroke="#f59e0b"
                  strokeWidth="1"
                  opacity="0.95"
                />
                <text
                  x="0"
                  y="2.5"
                  textAnchor="middle"
                  fill="#fde68a"
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {Math.round(x)}, {Math.round(y)}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};
