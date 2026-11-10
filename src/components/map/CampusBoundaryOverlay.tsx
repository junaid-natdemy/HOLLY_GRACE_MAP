import React, { useMemo, useRef, useState } from 'react';
import { BoundaryEdge, BoundaryNode, PixelPoint } from '../../types/campus';
import { MAP_CONFIG } from '../../config/mapConfig';

export interface CampusBoundaryOverlayProps {
  nodes: Record<string, BoundaryNode>;
  edges: BoundaryEdge[];
  polygonPoints: PixelPoint[];
  isEditing?: boolean;
  tool?: 'draw' | 'move' | 'connect' | 'delete';
  selectedNodeId?: string | null;
  connectSourceNodeId?: string | null;
  showOverlay?: boolean;
  onSelectNode?: (nodeId: string | null) => void;
  onNodeClick?: (nodeId: string, e: React.MouseEvent) => void;
  onEdgeClick?: (fromId: string, toId: string, e: React.MouseEvent) => void;
  onNodeDrag?: (nodeId: string, pt: PixelPoint) => void;
  lastInvalidClick?: PixelPoint | null;
  showOutsideGlow?: boolean;
  /** Screen pixels per map pixel, so the warning mark stays small when zoomed. */
  mapScale?: number;
}

export const CampusBoundaryOverlay: React.FC<CampusBoundaryOverlayProps> = ({
  nodes,
  edges,
  polygonPoints,
  isEditing = false,
  tool = 'draw',
  selectedNodeId = null,
  connectSourceNodeId = null,
  showOverlay = false,
  onSelectNode,
  onNodeClick,
  onEdgeClick,
  onNodeDrag,
  lastInvalidClick,
  showOutsideGlow = false,
  mapScale = 1,
}) => {
  const draggingNodeIdRef = useRef<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [hoveredEdgeKey, setHoveredEdgeKey] = useState<string | null>(null);

  const polygonPointsStr = useMemo(() => {
    return polygonPoints.length >= 3
      ? polygonPoints.map((p) => `${p.x},${p.y}`).join(' ')
      : '';
  }, [polygonPoints]);

  // Perimeter path string "M x y L x y ... Z"
  const perimeterPathD = useMemo(() => {
    if (!polygonPoints || polygonPoints.length < 3) return null;
    return (
      polygonPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') +
      ' Z'
    );
  }, [polygonPoints]);

  // Inverted path: outer frame MINUS campus polygon (fills only outer forest)
  const invertedPathD = useMemo(() => {
    if (!perimeterPathD) return null;
    const w = MAP_CONFIG.nativeWidth;
    const h = MAP_CONFIG.nativeHeight;
    return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z ${perimeterPathD}`;
  }, [perimeterPathD]);

  const handlePointerDown = (nodeId: string, e: React.PointerEvent<SVGGElement>) => {
    e.stopPropagation();
    if (!isEditing) return;

    if (tool === 'move' && onNodeDrag) {
      draggingNodeIdRef.current = nodeId;
      setActiveDragId(nodeId);
      onSelectNode?.(nodeId);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handlePointerMove = (nodeId: string, e: React.PointerEvent<SVGGElement>) => {
    if (draggingNodeIdRef.current !== nodeId || !onNodeDrag) return;
    e.stopPropagation();

    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;

    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const inv = ctm.inverse();
    const svgX = e.clientX * inv.a + e.clientY * inv.c + inv.e;
    const svgY = e.clientX * inv.b + e.clientY * inv.d + inv.f;

    const clampedX = Math.round(Math.max(0, Math.min(MAP_CONFIG.nativeWidth, svgX)));
    const clampedY = Math.round(Math.max(0, Math.min(MAP_CONFIG.nativeHeight, svgY)));

    onNodeDrag(nodeId, { x: clampedX, y: clampedY });
  };

  const handlePointerUp = (_nodeId: string, e: React.PointerEvent<SVGGElement>) => {
    if (draggingNodeIdRef.current !== null) {
      draggingNodeIdRef.current = null;
      setActiveDragId(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  return (
    <g className="campus-boundary-layer select-none">
      {/* ============================================================== */}
      {/* 1. OUT-OF-BOUNDARY RED AREA (plain paint, no blur or animation) */}
      {/* ============================================================== */}
      {showOutsideGlow && invertedPathD && perimeterPathD && (
        <g className="out-of-bounds-alert pointer-events-none">
          <path
            d={invertedPathD}
            fillRule="evenodd"
            fill="rgba(220, 38, 38, 0.32)"
          />
          <path
            d={perimeterPathD}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      )}

      {/* ============================================================== */}
      {/* 2. GREEN BOUNDARY VISUALS (ONLY shown in Dev Mode or showOverlay) */}
      {/* ============================================================== */}
      {(isEditing || showOverlay) && polygonPointsStr && (
        <polygon
          points={polygonPointsStr}
          fill={isEditing ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.05)'}
          stroke="none"
          className="transition-colors duration-200 pointer-events-none"
        />
      )}

      {(isEditing || showOverlay) && (
        <g className="boundary-edges">
          {edges.map((e, idx) => {
            const fromNode = nodes[e.from];
            const toNode = nodes[e.to];
            if (!fromNode || !toNode) return null;

            const edgeKey = `${e.from}_${e.to}_${idx}`;
            const isDeleteMode = isEditing && tool === 'delete';
            const isEdgeHovered = hoveredEdgeKey === edgeKey;

            return (
              <g
                key={edgeKey}
                data-no-pan="true"
                onMouseDown={(evt) => isDeleteMode && evt.stopPropagation()}
                className={isDeleteMode ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'}
                onMouseEnter={() => isDeleteMode && setHoveredEdgeKey(edgeKey)}
                onMouseLeave={() => isDeleteMode && setHoveredEdgeKey(null)}
                onClick={(evt) => {
                  if (isDeleteMode && onEdgeClick) {
                    evt.stopPropagation();
                    onEdgeClick(e.from, e.to, evt);
                  }
                }}
              >
                {/* Hit area for delete mode */}
                {isDeleteMode && (
                  <line
                    x1={fromNode.pixelCoord.x}
                    y1={fromNode.pixelCoord.y}
                    x2={toNode.pixelCoord.x}
                    y2={toNode.pixelCoord.y}
                    stroke="transparent"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                )}

                {/* Visible edge line */}
                <line
                  x1={fromNode.pixelCoord.x}
                  y1={fromNode.pixelCoord.y}
                  x2={toNode.pixelCoord.x}
                  y2={toNode.pixelCoord.y}
                  stroke={isDeleteMode && isEdgeHovered ? '#ef4444' : '#10b981'}
                  strokeWidth={isDeleteMode && isEdgeHovered ? 4 : isEditing ? 2.5 : 1.8}
                  strokeDasharray={isEditing ? '6,4' : undefined}
                  strokeLinecap="round"
                  className="transition-colors duration-150"
                />
              </g>
            );
          })}
        </g>
      )}

      {/* ============================================================== */}
      {/* 3. INVALID CLICK FLASH RIPPLE MARKER                           */}
      {/* ============================================================== */}
      {lastInvalidClick && (
        <g
          transform={`translate(${lastInvalidClick.x}, ${lastInvalidClick.y})`}
          className="pointer-events-none"
        >
          <circle
            r={14 / Math.max(mapScale, 0.2)}
            fill="rgba(239, 68, 68, 0.28)"
            stroke="#ef4444"
            strokeWidth={1.5 / Math.max(mapScale, 0.2)}
          />
          <circle r={5 / Math.max(mapScale, 0.2)} fill="rgba(239, 68, 68, 0.9)" />
        </g>
      )}

      {/* ============================================================== */}
      {/* 4. BOUNDARY NODES (Interactive Vertices in Dev Mode only)      */}
      {/* ============================================================== */}
      {isEditing && (
        <g className="boundary-nodes pointer-events-auto">
          {Object.values(nodes).map((node, idx) => {
            const isSelected = selectedNodeId === node.id || activeDragId === node.id;
            const isConnectSource = connectSourceNodeId === node.id;
            const isDeleteMode = tool === 'delete';
            const isMoveMode = tool === 'move';

            let cursor = 'cursor-pointer';
            if (isMoveMode) {
              cursor = isSelected ? 'cursor-grabbing' : 'cursor-grab';
            }

            const fill = isDeleteMode
              ? '#ef4444'
              : isConnectSource
              ? '#f59e0b'
              : isSelected
              ? '#06b6d4'
              : '#10b981';

            return (
              <g
                key={node.id}
                data-no-pan="true"
                data-interactive-node="true"
                transform={`translate(${node.pixelCoord.x}, ${node.pixelCoord.y})`}
                className={`${cursor} transition-transform duration-75 hover:scale-125`}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => handlePointerDown(node.id, e)}
                onPointerMove={(e) => handlePointerMove(node.id, e)}
                onPointerUp={(e) => handlePointerUp(node.id, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeClick?.(node.id, e);
                }}
              >
                <circle r="14" fill="transparent" />

                {isConnectSource && (
                  <circle
                    r="14"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    className="animate-ping opacity-75"
                  />
                )}

                {isSelected && !isConnectSource && (
                  <circle
                    r="12"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    strokeDasharray="3,2"
                  />
                )}

                <circle
                  r={isSelected || isConnectSource ? 8 : 6}
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                />

                <text
                  y="2.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="6.5"
                  fontWeight="bold"
                  pointerEvents="none"
                  fontFamily="sans-serif"
                >
                  {idx + 1}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};

export default CampusBoundaryOverlay;
