import React, { useRef, useState, useCallback } from 'react';
import { CAMPUS_POSITIONS, formatBuildingDisplayName } from '../../config/campusPositions';
import { CampusPosition, PixelPoint } from '../../types/campus';
import { MAP_CONFIG } from '../../config/mapConfig';

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

let sharedCanvasContext: CanvasRenderingContext2D | null = null;
function getSharedCanvasContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!sharedCanvasContext) {
    const canvas = document.createElement('canvas');
    sharedCanvasContext = canvas.getContext('2d');
  }
  return sharedCanvasContext;
}

const textWidthCache = new Map<string, number>();

/**
 * Accurately measures text width in Plus Jakarta Sans so the pill tightly hugs
 * the content without unsightly 20px-30px empty white voids.
 */
function measurePinText(text: string, fontSize: number = 6.4): number {
  const cacheKey = `${text}_${fontSize}`;
  if (textWidthCache.has(cacheKey)) {
    return textWidthCache.get(cacheKey)!;
  }
  const ctx = getSharedCanvasContext();
  let measuredWidth: number;
  if (ctx) {
    ctx.font = `700 ${fontSize}px 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`;
    measuredWidth = Math.ceil(ctx.measureText(text).width);
  } else {
    // Proportional font character width fallback (~0.52 of font size)
    measuredWidth = Math.ceil(text.length * (fontSize * 0.52));
  }
  textWidthCache.set(cacheKey, measuredWidth);
  return measuredWidth;
}

export interface PoiTheme {
  bg: string;
  color: string;
  border?: string;
  icon: React.ReactNode;
}

/**
 * Returns a Google Maps-inspired POI theme (icon & colors) based on building category/name.
 * Supports distinct VIP Parking, Bike Parking, Car Parking, Gate, Pool, Auditorium, etc.
 */
function getCategoryPoiTheme(category?: string, name?: string): PoiTheme {
  const lower = (name || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  // 1. VIP Parking
  if (cat === 'vip_parking' || lower.includes('vip parking') || lower.includes('vip')) {
    return {
      bg: '#fef3c7',
      color: '#b45309',
      border: 'rgba(217, 119, 6, 0.4)',
      icon: (
        <path
          d="M0 -4.5 L1.2 -1.4 L4.5 -1.4 L1.8 0.6 L2.8 3.8 L0 1.9 L-2.8 3.8 L-1.8 0.6 L-4.5 -1.4 L-1.2 -1.4 Z"
          fill="currentColor"
        />
      ),
    };
  }

  // 2. Bike Parking
  if (cat === 'bike_parking' || lower.includes('bike')) {
    return {
      bg: '#f0fdfa',
      color: '#0f766e',
      border: 'rgba(20, 184, 166, 0.4)',
      icon: (
        <g stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="-3" cy="1.5" r="2.2" />
          <circle cx="3" cy="1.5" r="2.2" />
          <path d="M-3 1.5 L-1 -2 L1 1.5 L-1 1.5 M1 1.5 L2.5 -2.5 H3.5" />
        </g>
      ),
    };
  }

  // 3. Car Parking
  if (
    cat === 'car_parking' ||
    cat === 'parking' ||
    (lower.includes('car') && lower.includes('parking')) ||
    lower.includes('parking')
  ) {
    return {
      bg: '#e0f2fe',
      color: '#0369a1',
      border: 'rgba(56, 189, 248, 0.4)',
      icon: (
        <path
          d="M-3 -4.5 H1 C2.8 -4.5 3.8 -3.5 3.8 -1.8 C3.8 0 2.8 1 1 1 H-1 V4.5 H-3 Z M-1 -2.5 V-0.8 H0.8 C1.6 -0.8 2 -1.2 2 -1.8 C2 -2.4 1.6 -2.5 0.8 -2.5 Z"
          fill="currentColor"
        />
      ),
    };
  }

  // 4. Gates / Entrance / Exit
  if (
    cat === 'gate' ||
    lower.includes('enterance') ||
    lower.includes('entrance') ||
    lower.includes('exit')
  ) {
    return {
      bg: '#ffedd5',
      color: '#c2410c',
      border: 'rgba(251, 146, 60, 0.4)',
      icon: (
        <path
          d="M-4 -4.5 H4 V4.5 H-4 Z M-2.2 -2.5 V2.5 H2.2 V-2.5 Z"
          fill="currentColor"
        />
      ),
    };
  }

  // 5. Swimming pool
  if (cat === 'pool' || lower.includes('pool')) {
    return {
      bg: '#e0f2fe',
      color: '#0284c7',
      border: 'rgba(14, 165, 233, 0.4)',
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

  // 6. Stages & Auditoriums
  if (
    cat === 'auditorium' ||
    cat === 'stage_complex' ||
    lower.includes('auditorium') ||
    lower.includes('stage')
  ) {
    return {
      bg: '#ede9fe',
      color: '#7c3aed',
      border: 'rgba(167, 139, 250, 0.4)',
      icon: (
        <path
          d="M0 -5 L1.5 -1.5 L5.2 -1.5 L2.2 0.8 L3.3 4.5 L0 2.2 L-3.3 4.5 L-2.2 0.8 L-5.2 -1.5 L-1.5 -1.5 Z"
          fill="currentColor"
        />
      ),
    };
  }

  // 7. Outdoor / Ground / Stalls
  if (
    cat === 'outdoor' ||
    cat === 'commercial' ||
    lower.includes('ground') ||
    lower.includes('stall')
  ) {
    return {
      bg: '#dcfce7',
      color: '#15803d',
      border: 'rgba(74, 222, 128, 0.4)',
      icon: (
        <path
          d="M-4 5 V-5 H2.5 L1 -2 L2.5 1 H-2 V5 Z"
          fill="currentColor"
        />
      ),
    };
  }

  // 8. Residential / Hostel
  if (cat === 'administrative' || lower.includes('hostel')) {
    return {
      bg: '#ffedd5',
      color: '#c2410c',
      border: 'rgba(251, 146, 60, 0.4)',
      icon: (
        <path
          d="M0 -5 L-5 0 H-3.2 V5 H3.2 V0 H5 Z M-1.2 5 V2 H1.2 V5 Z"
          fill="currentColor"
        />
      ),
    };
  }

  // 9. Default Academic / Institutional Building (Classic Google Maps POI landmark)
  return {
    bg: '#dbeafe',
    color: '#1d4ed8',
    border: 'rgba(96, 165, 250, 0.4)',
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
      e.stopPropagation();
      if (!isEditorOpen || isPreviewMode) return;
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
        x: Math.round(Math.max(0, Math.min(MAP_CONFIG.nativeWidth, svgP.x))),
        y: Math.round(Math.max(0, Math.min(MAP_CONFIG.nativeHeight, svgP.y))),
      });
    },
    [activeDraggingId, onPositionDrag]
  );

  const handlePointerUp = useCallback(
    (pos: CampusPosition, e: React.PointerEvent) => {
      e.stopPropagation();
      if (activeDraggingId === pos.id) {
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

        // One horizontal row, same height as every other pin. The pill
        // grows with the full name so the text is not cut off.
        const displayName = formatBuildingDisplayName(pos.name);
        const poiTheme = getCategoryPoiTheme(pos.category, pos.name);

        const isBike = pos.category === 'bike_parking' || pos.name.toLowerCase().includes('bike');
        const isCompact = isBike;

        // Smart compact display label: format "Bike Parking - 2" as "Bike P-2" to prevent overlap
        let displayLabel = displayName;
        if (isBike) {
          const match = displayName.match(/^bike\s+parking\s*[-–—]?\s*(\d+)$/i);
          if (match) {
            displayLabel = `Bike P-${match[1]}`;
          } else if (displayName.toLowerCase() === 'staff bike parking') {
            displayLabel = 'Staff Bike P';
          }
        }

        const fontSize = isCompact ? 5.2 : 6.4;
        const pillHeight = isCompact ? 10.8 : 13.0;
        const rx = pillHeight / 2;
        const iconRadius = isCompact ? 3.3 : 3.8;
        const iconTranslateX = isCompact ? 5.5 : 6.8;
        const textStartX = isCompact ? 10.8 : 13.5;
        const rightPad = isCompact ? 4.2 : 5.4;

        // Accurate canvas measurement so pill hugs content without extra 25px-30px void
        const textWidth = measurePinText(displayLabel, fontSize);
        const pillWidth = Math.round(textStartX + textWidth + rightPad);
        const halfWidth = Math.round(pillWidth / 2);
        const pillY = isCompact ? -14.2 : -16.8;

        return (
          <g
            key={`building-poi-${pos.id}`}
            transform={`translate(${x}, ${y})`}
            data-no-pan="true"
            data-interactive-node="true"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
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
                points="-2.2,-3.0 2.2,-3.0 0,-1"
                fill={isSelected ? '#1d4ed8' : isDragging ? '#f59e0b' : '#ffffff'}
                stroke={isSelected ? '#1d4ed8' : isDragging ? '#f59e0b' : poiTheme.border || '#cbd5e1'}
                strokeWidth="0.4"
              />

              {/* Main Pill Capsule Container */}
              <rect
                x={-halfWidth}
                y={pillY}
                width={pillWidth}
                height={pillHeight}
                rx={rx}
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
                    : poiTheme.border || 'rgba(15, 23, 42, 0.16)'
                }
                strokeWidth={isSelected ? '1.2' : '0.8'}
              />

              {/* Mini Category POI Icon Circle */}
              <g transform={`translate(${-halfWidth + iconTranslateX}, ${pillY + pillHeight / 2})`}>
                <circle
                  r={iconRadius}
                  fill={isSelected ? '#ffffff' : isDragging ? '#ffffff' : poiTheme.bg}
                />
                <g
                  transform={`scale(${isCompact ? 0.35 : 0.42})`}
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
                x={-halfWidth + textStartX}
                y={pillY + pillHeight / 2}
                dominantBaseline="central"
                fill={
                  isSelected || isDragging
                    ? '#ffffff'
                    : '#0f172a'
                }
                fontSize={fontSize}
                fontWeight="700"
                fontFamily="Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                letterSpacing="0.05px"
                className="pointer-events-none select-none"
              >
                {displayLabel}
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
