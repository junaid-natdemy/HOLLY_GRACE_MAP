import React, { useCallback, useRef } from 'react';
import { MAP_CONFIG } from '../../config/mapConfig';
import {
  CampusPosition,
  DestinationAccessPoint,
  PixelPoint,
  RoadEdge,
  RoadNode,
} from '../../types/campus';

export type EditorTool = 'draw' | 'select' | 'connect' | 'delete' | 'set_access_point';

interface RoadEditorOverlayProps {
  nodes: Record<string, RoadNode>;
  edges: RoadEdge[];
  accessPoints: Record<number, DestinationAccessPoint>;
  selectedNodeId: string | null;
  connectSourceNodeId: string | null;
  activeTool: EditorTool;
  isPreviewMode: boolean;
  hoveredPoint: PixelPoint | null;
  targetAccessPositionId: number | null;
  entranceNodeId: string | null;
  onNodeDrag: (nodeId: string, newPixel: PixelPoint) => void;
  onNodeClick: (nodeId: string, e: React.MouseEvent) => void;
  onEdgeClick: (fromId: string, toId: string, e: React.MouseEvent) => void;
  disconnectedNodeIds: Set<string>;
  positions?: CampusPosition[];
  onAccessPointDrag?: (posId: number, newPixel: PixelPoint) => void;
}

export const RoadEditorOverlay: React.FC<RoadEditorOverlayProps> = ({
  nodes,
  edges,
  accessPoints,
  selectedNodeId,
  connectSourceNodeId,
  activeTool,
  isPreviewMode,
  hoveredPoint,
  targetAccessPositionId,
  entranceNodeId,
  onNodeDrag,
  onNodeClick,
  onEdgeClick,
  disconnectedNodeIds,
  positions,
  onAccessPointDrag,
}) => {
  const draggingNodeIdRef = useRef<string | null>(null);
  const draggingApIdRef = useRef<number | null>(null);

  const handleApPointerDown = useCallback(
    (posId: number, e: React.PointerEvent) => {
      e.stopPropagation();
      if (activeTool === 'select' || activeTool === 'draw') {
        draggingApIdRef.current = posId;
        try {
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    },
    [activeTool]
  );

  const handleNodePointerDown = useCallback(
    (nodeId: string, e: React.PointerEvent) => {
      e.stopPropagation();
      if (activeTool === 'select') {
        draggingNodeIdRef.current = nodeId;
        try {
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    },
    [activeTool]
  );

  const handleNodePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingApIdRef.current !== null && onAccessPointDrag) {
        e.stopPropagation();
        const svg = (e.currentTarget as SVGElement).ownerSVGElement;
        if (!svg) return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        onAccessPointDrag(draggingApIdRef.current, {
          x: Math.round(Math.max(0, Math.min(MAP_CONFIG.nativeWidth, svgP.x))),
          y: Math.round(Math.max(0, Math.min(MAP_CONFIG.nativeHeight, svgP.y))),
        });
        return;
      }

      if (draggingNodeIdRef.current && activeTool === 'select') {
        e.stopPropagation();
        // Native SVG coordinates derived from SVG element matrix
        const svg = (e.currentTarget as SVGElement).ownerSVGElement;
        if (!svg) return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        onNodeDrag(draggingNodeIdRef.current, {
          x: Math.round(Math.max(0, Math.min(MAP_CONFIG.nativeWidth, svgP.x))),
          y: Math.round(Math.max(0, Math.min(MAP_CONFIG.nativeHeight, svgP.y))),
        });
      }
    },
    [activeTool, onNodeDrag, onAccessPointDrag]
  );

  const handleNodePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (draggingApIdRef.current !== null) {
        e.stopPropagation();
        try {
          (e.currentTarget as Element).releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        draggingApIdRef.current = null;
      }

      if (draggingNodeIdRef.current) {
        e.stopPropagation();
        try {
          (e.currentTarget as Element).releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        draggingNodeIdRef.current = null;
      }
    },
    []
  );

  // In preview mode: show only the clean road lines and access points, no gizmos
  if (isPreviewMode) {
    return (
      <g className="road-editor-preview-layer pointer-events-none">
        {/* Road Edges */}
        {edges.map((edge, idx) => {
          const fromNode = nodes[edge.from];
          const toNode = nodes[edge.to];
          if (!fromNode || !toNode) return null;
          return (
            <line
              key={`preview-edge-${edge.from}-${edge.to}-${idx}`}
              x1={fromNode.pixelCoord.x}
              y1={fromNode.pixelCoord.y}
              x2={toNode.pixelCoord.x}
              y2={toNode.pixelCoord.y}
              stroke="#06b6d4"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.75"
            />
          );
        })}

        {/* Access point connectors in preview */}
        {Object.values(accessPoints).map((ap) => {
          const roadNode = nodes[ap.connectedRoadNodeId];
          if (!roadNode) return null;
          return (
            <g key={`preview-ap-${ap.positionId}`}>
              <line
                x1={roadNode.pixelCoord.x}
                y1={roadNode.pixelCoord.y}
                x2={ap.pixelCoord.x}
                y2={ap.pixelCoord.y}
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                opacity="0.8"
              />
              <circle
                cx={ap.pixelCoord.x}
                cy={ap.pixelCoord.y}
                r="6"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </g>
    );
  }

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;
  const connectSourceNode = connectSourceNodeId ? nodes[connectSourceNodeId] : null;

  return (
    <g
      className="road-editor-overlay-layer"
      onPointerMove={handleNodePointerMove}
      onPointerUp={handleNodePointerUp}
    >
      <defs>
        <filter id="editorGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.7" />
        </filter>
      </defs>

      {/* 1. EDGES LAYER */}
      <g className="editor-edges">
        {edges.map((edge, idx) => {
          const from = nodes[edge.from];
          const to = nodes[edge.to];
          if (!from || !to) return null;

          const isEdgeFromDisconnected =
            disconnectedNodeIds.has(edge.from) || disconnectedNodeIds.has(edge.to);

          return (
            <g key={`edge-${edge.from}-${edge.to}-${idx}`}>
              {/* Invisible wide hit area for easy clicking */}
              <line
                x1={from.pixelCoord.x}
                y1={from.pixelCoord.y}
                x2={to.pixelCoord.x}
                y2={to.pixelCoord.y}
                stroke="transparent"
                strokeWidth="18"
                className="cursor-pointer"
                style={{ pointerEvents: 'all' }}
                data-no-pan="true"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => onEdgeClick(edge.from, edge.to, e)}
              />

              {/* Edge backing */}
              <line
                x1={from.pixelCoord.x}
                y1={from.pixelCoord.y}
                x2={to.pixelCoord.x}
                y2={to.pixelCoord.y}
                stroke="#0f172a"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.7"
                className="pointer-events-none"
              />

              {/* Visible edge line */}
              <line
                x1={from.pixelCoord.x}
                y1={from.pixelCoord.y}
                x2={to.pixelCoord.x}
                y2={to.pixelCoord.y}
                stroke={isEdgeFromDisconnected ? '#f97316' : '#06b6d4'}
                strokeWidth={edge.isCoveredWalkway ? '3' : '4'}
                strokeDasharray={edge.isCoveredWalkway ? '5 4' : undefined}
                strokeLinecap="round"
                className="pointer-events-none transition-colors"
              />
            </g>
          );
        })}
      </g>

      {/* 2. ACCESS POINT CONNECTORS (PHASE 3) */}
      <g className="editor-access-points">
        {Object.values(accessPoints).map((ap) => {
          const roadNode = nodes[ap.connectedRoadNodeId];
          const isTargeted = targetAccessPositionId === ap.positionId;

          return (
            <g key={`ap-group-${ap.positionId}`} className="select-none">
              {/* Dashed lead from road node to access point */}
              {roadNode && (
                <line
                  x1={roadNode.pixelCoord.x}
                  y1={roadNode.pixelCoord.y}
                  x2={ap.pixelCoord.x}
                  y2={ap.pixelCoord.y}
                  stroke={isTargeted ? '#ec4899' : '#f59e0b'}
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  opacity="0.9"
                  className="pointer-events-none"
                />
              )}

              {/* Access Point Icon */}
              <g
                transform={`translate(${ap.pixelCoord.x}, ${ap.pixelCoord.y})`}
                filter="url(#editorGlow)"
                className="cursor-move pointer-events-auto"
                onPointerDown={(e) => handleApPointerDown(ap.positionId, e)}
              >
                <circle
                  r={isTargeted ? '13' : '9'}
                  fill={isTargeted ? '#ec4899' : '#f59e0b'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className={isTargeted ? 'animate-ping-slow' : ''}
                />
                <circle
                  r="6.5"
                  fill={isTargeted ? '#db2777' : '#d97706'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="2.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="7"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  {ap.positionId}
                </text>

                {/* Access Point Pill Label */}
                {(() => {
                  const bld = positions?.find((p) => p.id === ap.positionId);
                  const labelText = bld
                    ? `${bld.name.split('·')[0].trim()} Access`
                    : `ACCESS ${ap.positionId}`;
                  const boxWidth = Math.max(38, Math.round(labelText.length * 5.4 + 10));
                  return (
                    <g transform="translate(0, -15)">
                      <rect
                        x={-boxWidth / 2}
                        y="-9"
                        width={boxWidth}
                        height="13"
                        rx="3.5"
                        fill="#0f172a"
                        stroke="#f59e0b"
                        strokeWidth="0.8"
                        opacity="0.95"
                      />
                      <text
                        x="0"
                        y="-0.5"
                        textAnchor="middle"
                        fill="#fbbf24"
                        fontSize="7"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {labelText}
                      </text>
                    </g>
                  );
                })()}
              </g>
            </g>
          );
        })}
      </g>

      {/* 3. ACTIVE DRAWING LINE (From active node to cursor) */}
      {activeTool === 'draw' && selectedNode && hoveredPoint && (
        <line
          x1={selectedNode.pixelCoord.x}
          y1={selectedNode.pixelCoord.y}
          x2={hoveredPoint.x}
          y2={hoveredPoint.y}
          stroke="#38bdf8"
          strokeWidth="3.5"
          strokeDasharray="5 5"
          strokeLinecap="round"
          opacity="0.85"
          className="pointer-events-none animate-pulse"
        />
      )}

      {/* 4. ACTIVE CONNECT LINE (From connect source to cursor) */}
      {activeTool === 'connect' && connectSourceNode && hoveredPoint && (
        <line
          x1={connectSourceNode.pixelCoord.x}
          y1={connectSourceNode.pixelCoord.y}
          x2={hoveredPoint.x}
          y2={hoveredPoint.y}
          stroke="#ec4899"
          strokeWidth="3.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
          className="pointer-events-none animate-pulse"
        />
      )}

      {/* 5. NODES LAYER */}
      <g className="editor-nodes">
        {Object.values(nodes).map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isConnectSource = connectSourceNodeId === node.id;
          const isDisconnected = disconnectedNodeIds.has(node.id);
          const isEntrance = node.isEntrance || node.id === entranceNodeId || node.id === 'entrance';

          let nodeColor = '#06b6d4'; // default cyan
          let strokeColor = '#ffffff';
          let radius = 6;

          if (isEntrance) {
            nodeColor = '#10b981'; // green entrance
            radius = 8;
          } else if (isDisconnected) {
            nodeColor = '#f97316'; // orange disconnected warning
            radius = 7;
          }

          if (isSelected) {
            nodeColor = '#facc15'; // yellow selected
            strokeColor = '#0f172a';
            radius = 8.5;
          } else if (isConnectSource) {
            nodeColor = '#ec4899'; // pink connect source
            radius = 8.5;
          }

          return (
            <g
              key={`node-${node.id}`}
              transform={`translate(${node.pixelCoord.x}, ${node.pixelCoord.y})`}
              className="cursor-pointer select-none group"
              style={{ pointerEvents: 'all' }}
              data-no-pan="true"
              data-interactive-node="true"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => onNodeClick(node.id, e)}
              onPointerDown={(e) => handleNodePointerDown(node.id, e)}
              onPointerMove={handleNodePointerMove}
              onPointerUp={handleNodePointerUp}
            >
              {/* Selection Halo */}
              {isSelected && (
                <>
                  <circle
                    r="15"
                    fill="#facc15"
                    opacity="0.3"
                    className="animate-ping-slow pointer-events-none"
                  />
                  <circle
                    r="12"
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="pointer-events-none"
                  />
                </>
              )}

              {/* Hover Touch Area */}
              <circle
                r="14"
                fill="transparent"
                className="group-hover:stroke-white/40 group-hover:stroke-2"
              />

              {/* Visible Node Circle */}
              <circle
                r={radius}
                fill={nodeColor}
                stroke={strokeColor}
                strokeWidth={isSelected ? '2.5' : '1.8'}
                filter="url(#editorGlow)"
                className="transition-transform group-hover:scale-125"
              />

              {/* Special Entrance Indicator */}
              {isEntrance && (
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  IN
                </text>
              )}

              {/* Hover Tooltip showing node ID & coordinate */}
              <g
                transform="translate(0, -16)"
                className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30"
              >
                <rect
                  x="-35"
                  y="-12"
                  width="70"
                  height="14"
                  rx="3"
                  fill="#0f172a"
                  opacity="0.9"
                />
                <text
                  x="0"
                  y="-2"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="7"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {node.id} ({Math.round(node.pixelCoord.x)},{Math.round(node.pixelCoord.y)})
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </g>
  );
};
