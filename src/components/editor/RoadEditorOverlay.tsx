import React, { useCallback, useRef } from 'react';
import {
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
}) => {
  const draggingNodeIdRef = useRef<string | null>(null);

  const handleNodePointerDown = useCallback(
    (nodeId: string, e: React.PointerEvent) => {
      e.stopPropagation();
      if (activeTool === 'select') {
        draggingNodeIdRef.current = nodeId;
        (e.target as Element).setPointerCapture(e.pointerId);
      }
    },
    [activeTool]
  );

  const handleNodePointerMove = useCallback(
    (e: React.PointerEvent) => {
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
          x: Math.round(Math.max(0, Math.min(1280, svgP.x))),
          y: Math.round(Math.max(0, Math.min(774, svgP.y))),
        });
      }
    },
    [activeTool, onNodeDrag]
  );

  const handleNodePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (draggingNodeIdRef.current) {
        e.stopPropagation();
        try {
          (e.target as Element).releasePointerCapture(e.pointerId);
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
                className="pointer-events-none"
              >
                <circle
                  r={isTargeted ? '12' : '8'}
                  fill={isTargeted ? '#ec4899' : '#f59e0b'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className={isTargeted ? 'animate-ping-slow' : ''}
                />
                <circle
                  r="6"
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
                <g transform="translate(0, -14)">
                  <rect
                    x="-24"
                    y="-9"
                    width="48"
                    height="12"
                    rx="3"
                    fill="#1e293b"
                    opacity="0.9"
                  />
                  <text
                    x="0"
                    y="-1"
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="6.5"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    ACCESS {ap.positionId}
                  </text>
                </g>
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
              onClick={(e) => onNodeClick(node.id, e)}
              onPointerDown={(e) => handleNodePointerDown(node.id, e)}
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
