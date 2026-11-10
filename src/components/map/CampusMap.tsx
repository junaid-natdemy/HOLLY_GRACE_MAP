import React, { useEffect, useRef, useState } from 'react';
import { MAP_CONFIG } from '../../config/mapConfig';
import { isPointInPolygon } from '../../config/campusBoundary';
import { useMapTransform } from '../../hooks/useMapTransform';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  BoundaryData,
  CampusPosition,
  PixelPoint,
  RoadNetworkData,
  RouteResult,
} from '../../types/campus';
import { EditorTool, RoadEditorOverlay } from '../editor/RoadEditorOverlay';
import { MapImage } from './MapImage';
import { MapMarkers } from './MapMarkers';
import { RouteOverlay } from './RouteOverlay';
import { StartPointMarker } from './StartPointMarker';
import { CampusBoundaryOverlay } from './CampusBoundaryOverlay';
import { X } from 'lucide-react';

interface CampusMapProps {
  selectedPosition: CampusPosition | null;
  selectedStageNumber?: number;
  onSelectPosition: (position: CampusPosition) => void;
  startPoint: PixelPoint | null;
  onSelectStartPoint: (pt: PixelPoint) => void;
  route: RouteResult | null;
  positions?: CampusPosition[];
  boundaryData?: BoundaryData;
  boundaryPolygonPoints?: PixelPoint[];
  onOutsideBoundaryClick?: (pt: PixelPoint) => void;
  lastInvalidClick?: PixelPoint | null;
  outsideBoundaryToast?: string | null;
  showOutsideGlow?: boolean;
  onImageLoad?: () => void;
  /** Increment to return the map to its initial pan/zoom (mobile reset). */
  resetViewSignal?: number;

  // Road Network Editor Props
  isEditorOpen?: boolean;
  activeEditorTool?: EditorTool;
  isPreviewMode?: boolean;
  roadData?: RoadNetworkData;
  selectedNodeId?: string | null;
  connectSourceNodeId?: string | null;
  targetAccessPositionId?: number | null;
  entranceNodeId?: string | null;
  disconnectedNodeIds?: Set<string>;
  onSelectNode?: (nodeId: string | null) => void;
  onNodeDrag?: (nodeId: string, pt: PixelPoint) => void;
  onNodeClick?: (nodeId: string, e: React.MouseEvent) => void;
  onEdgeClick?: (fromId: string, toId: string, e: React.MouseEvent) => void;
  onMapClickForEditor?: (pt: PixelPoint) => void;
  onAccessPointDrag?: (posId: number, pt: PixelPoint) => void;
  onCancelSetAccessPoint?: () => void;

  // Campus Positions Relocation Props
  targetMovePositionId?: number | null;
  onPositionDrag?: (positionId: number, pt: PixelPoint) => void;
  pendingAddBuildingName?: string | null;
  onCancelAddBuilding?: () => void;

  // Campus Boundary Editor Props
  isBoundaryEditing?: boolean;
  boundaryTool?: 'draw' | 'move' | 'connect' | 'delete';
  selectedBoundaryNodeId?: string | null;
  connectSourceBoundaryNodeId?: string | null;
  onSelectBoundaryNode?: (nodeId: string | null) => void;
  onBoundaryNodeClick?: (nodeId: string, e: React.MouseEvent) => void;
  onBoundaryEdgeClick?: (fromId: string, toId: string, e: React.MouseEvent) => void;
  onBoundaryNodeDrag?: (nodeId: string, pt: PixelPoint) => void;
  onBoundaryMapClick?: (pt: PixelPoint) => void;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  selectedPosition,
  selectedStageNumber,
  onSelectPosition,
  startPoint,
  onSelectStartPoint,
  route,
  positions,
  boundaryData,
  boundaryPolygonPoints = [],
  onOutsideBoundaryClick,
  lastInvalidClick = null,
  outsideBoundaryToast = null,
  showOutsideGlow = false,
  onImageLoad,
  resetViewSignal = 0,

  // Editor props
  isEditorOpen = false,
  activeEditorTool = 'draw',
  isPreviewMode = false,
  roadData,
  selectedNodeId = null,
  connectSourceNodeId = null,
  targetAccessPositionId = null,
  entranceNodeId = null,
  disconnectedNodeIds = new Set<string>(),
  onNodeDrag,
  onNodeClick,
  onEdgeClick,
  onMapClickForEditor,
  onAccessPointDrag,
  onCancelSetAccessPoint,

  // Position relocation
  targetMovePositionId = null,
  onPositionDrag,
  pendingAddBuildingName = null,
  onCancelAddBuilding,

  // Boundary editing
  isBoundaryEditing = false,
  boundaryTool = 'draw',
  selectedBoundaryNodeId = null,
  connectSourceBoundaryNodeId = null,
  onSelectBoundaryNode,
  onBoundaryNodeClick,
  onBoundaryEdgeClick,
  onBoundaryNodeDrag,
  onBoundaryMapClick,
}) => {
  const {
    containerRef,
    stageRef,
    zoom,
    pan,
    baseScale,
    stageWidth,
    stageHeight,
    isDragging,
    resetView,
    focusOnCoordinate,
    clientToNativePixel,
    handlers,
  } = useMapTransform();
  const isMobileViewport = useIsMobile();

  // Focus smoothly on the selected destination (both desktop and mobile)
  const lastFocusedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedPosition) {
      lastFocusedKey.current = null;
      return;
    }
    const currentKey = `${selectedPosition.id}-${selectedStageNumber ?? 0}`;
    if (lastFocusedKey.current === currentKey) return;
    lastFocusedKey.current = currentKey;
    focusOnCoordinate(selectedPosition.pixelCoord);
  }, [selectedPosition, selectedStageNumber, focusOnCoordinate]);

  // Mobile reset returns the map to its initial pan/zoom.
  useEffect(() => {
    if (resetViewSignal > 0) resetView();
  }, [resetViewSignal, resetView]);

  const isClickIntent = useRef<boolean>(false);
  const clickStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<PixelPoint | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    isClickIntent.current = true;
    clickStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (
      Math.hypot(
        e.clientX - clickStartPos.current.x,
        e.clientY - clickStartPos.current.y
      ) > 6
    ) {
      isClickIntent.current = false;
    }

    if (isEditorOpen) {
      const nativePt = clientToNativePixel(e.clientX, e.clientY);
      setHoveredPoint(nativePt);
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!isClickIntent.current) return;

    const clickedPoint = clientToNativePixel(e.clientX, e.clientY);
    if (!clickedPoint) return;

    // 0. Boundary Editor clicks when in boundary editing tab
    if (isEditorOpen && isBoundaryEditing && onBoundaryMapClick) {
      onBoundaryMapClick(clickedPoint);
      return;
    }

    // 1. Road Network Editor clicks
    if (isEditorOpen && onMapClickForEditor) {
      onMapClickForEditor(clickedPoint);
      return;
    }

    // 2. Normal user navigation mode: Starting point selection
    if (boundaryPolygonPoints && boundaryPolygonPoints.length >= 3) {
      const isInside = isPointInPolygon(clickedPoint, boundaryPolygonPoints);
      if (!isInside) {
        onOutsideBoundaryClick?.(clickedPoint);
        return;
      }
    }

    onSelectStartPoint(clickedPoint);
  };

  let cursorClass = 'cursor-default';
  if (isEditorOpen) {
    if (isBoundaryEditing) {
      if (boundaryTool === 'draw' || boundaryTool === 'connect') {
        cursorClass = 'cursor-crosshair';
      } else if (boundaryTool === 'delete') {
        cursorClass = 'cursor-pointer';
      } else {
        cursorClass = isDragging ? 'cursor-grabbing' : 'cursor-default';
      }
    } else if (
      activeEditorTool === 'draw' ||
      activeEditorTool === 'connect' ||
      targetAccessPositionId !== null
    ) {
      cursorClass = 'cursor-crosshair';
    } else if (activeEditorTool === 'delete') {
      cursorClass = 'cursor-pointer';
    } else {
      cursorClass = isDragging ? 'cursor-grabbing' : 'cursor-default';
    }
  } else {
    cursorClass = isDragging ? 'cursor-grabbing' : 'cursor-crosshair';
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-x-0 top-0 overflow-hidden bg-[#7d9a62] select-none touch-none ${cursorClass}`}
      style={{ bottom: isMobileViewport ? 'var(--mobile-sheet-h, 0px)' : 0 }}
      {...handlers}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={handleMapClick}
      onMouseLeave={() => {
        handlers.onMouseLeave();
        setHoveredPoint(null);
      }}
    >
      {/* Interactive Transform Canvas */}
      <div
        ref={stageRef}
        className="absolute top-1/2 left-1/2 origin-center will-change-transform"
        style={{
          width: `${stageWidth}px`,
          height: `${stageHeight}px`,
          transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
          transition: isDragging ? 'none' : 'transform 0.08s ease-out',
        }}
      >
        {/* Raster drone aerial background */}
        <MapImage onLoad={onImageLoad} />

        {/* SVG Overlay layer matching native image resolution (1280x774) */}
        <svg
          viewBox={`0 0 ${MAP_CONFIG.nativeWidth} ${MAP_CONFIG.nativeHeight}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          {/* Walkable Boundary Overlay & Invalid Click Ripple */}
          {boundaryData && (
            <CampusBoundaryOverlay
              nodes={boundaryData.nodes}
              edges={boundaryData.edges}
              polygonPoints={boundaryPolygonPoints || []}
              isEditing={Boolean(isEditorOpen && isBoundaryEditing)}
              tool={boundaryTool}
              selectedNodeId={selectedBoundaryNodeId}
              connectSourceNodeId={connectSourceBoundaryNodeId}
              showOverlay={Boolean(isEditorOpen && isBoundaryEditing)}
              onSelectNode={onSelectBoundaryNode}
              onNodeClick={onBoundaryNodeClick}
              onEdgeClick={onBoundaryEdgeClick}
              onNodeDrag={onBoundaryNodeDrag}
              lastInvalidClick={lastInvalidClick}
              showOutsideGlow={showOutsideGlow}
              mapScale={baseScale * zoom}
            />
          )}

          {/* Active Walkway Route Overlay (Blue-and-white dotted style) */}
          <RouteOverlay
            route={route}
            selectedStageNumber={selectedStageNumber}
          />

          {/* Campus Position Markers (Numbered 1 to 10) */}
          <MapMarkers
            selectedPositionId={selectedPosition?.id ?? null}
            onSelectPosition={onSelectPosition}
            positions={positions}
            isEditorOpen={isEditorOpen}
            isPreviewMode={isPreviewMode}
            targetMovePositionId={targetMovePositionId}
            onPositionDrag={onPositionDrag}
          />

          {/* User Starting Point Marker */}
          {!isEditorOpen && <StartPointMarker point={startPoint} />}

          {/* Developer Manual Road Network Editor Overlay */}
          {isEditorOpen && roadData && (
            <RoadEditorOverlay
              nodes={roadData.nodes}
              edges={roadData.edges}
              accessPoints={roadData.accessPoints}
              selectedNodeId={selectedNodeId}
              connectSourceNodeId={connectSourceNodeId}
              activeTool={activeEditorTool}
              isPreviewMode={isPreviewMode}
              hoveredPoint={hoveredPoint}
              targetAccessPositionId={targetAccessPositionId}
              entranceNodeId={entranceNodeId}
              onNodeDrag={onNodeDrag ?? (() => {})}
              onNodeClick={onNodeClick ?? (() => {})}
              onEdgeClick={onEdgeClick ?? (() => {})}
              disconnectedNodeIds={disconnectedNodeIds}
              positions={positions}
              onAccessPointDrag={onAccessPointDrag}
            />
          )}
        </svg>
      </div>

      {/* Floating Status Banner (when setting destination access point) */}
      {isEditorOpen && targetAccessPositionId !== null && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-fade-in">
          <div className="bg-amber-600/95 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl border-2 border-amber-300 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>Click on map to place Access Point for &ldquo;{positions?.find((p) => p.id === targetAccessPositionId)?.name || 'Building'}&rdquo;</span>
            {onCancelSetAccessPoint && (
              <button
                onClick={onCancelSetAccessPoint}
                className="ml-1 p-0.5 hover:bg-amber-700 rounded-full transition-colors"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Status Banner (when adding a new campus building) */}
      {isEditorOpen && pendingAddBuildingName && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-fade-in">
          <div className="bg-emerald-600/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl border border-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>Click on map to place new building &ldquo;{pendingAddBuildingName}&rdquo;</span>
            {onCancelAddBuilding && (
              <button
                onClick={onCancelAddBuilding}
                className="ml-2 px-1.5 py-0.5 rounded bg-emerald-700/80 hover:bg-emerald-800 text-[10px] text-emerald-100 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Status Banner (when relocating campus position) */}
      {isEditorOpen && targetMovePositionId !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="bg-amber-600/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl border border-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>Click anywhere on map to relocate &ldquo;{positions?.find((p) => p.id === targetMovePositionId)?.name || 'Building'}&rdquo;</span>
          </div>
        </div>
      )}

      {/* Outside Boundary Toast Notification */}
      {outsideBoundaryToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-bounce">
          <div className="bg-red-950/95 backdrop-blur-md text-red-200 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl border border-red-500/60 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>{outsideBoundaryToast}</span>
          </div>
        </div>
      )}
    </div>
  );
};
