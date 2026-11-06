import React, { useState, useRef, useEffect } from 'react';
import { CAMPUS_POSITIONS } from '../../config/campusPositions';
import { CAMPUS_STAGES } from '../../config/stageMapping';
import {
  BoundaryData,
  CampusPosition,
  PixelPoint,
  RoadNetworkData,
  RouteResult,
  Stage,
} from '../../types/campus';
import { EditorTool } from './RoadEditorOverlay';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  GitBranch,
  GripHorizontal,
  Link,
  MapPin,
  Maximize2,
  Minimize2,
  Move,
  Play,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react';

interface RoadNetworkEditorProps {
  isOpen: boolean;
  onClose: () => void;
  activeTool: EditorTool;
  onChangeTool: (tool: EditorTool) => void;
  isPreviewMode: boolean;
  onTogglePreviewMode: () => void;
  roadData: RoadNetworkData;
  selectedNodeId: string | null;
  onNewBranch: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onDeleteSelectedNode: () => void;
  onSaveToStorage: () => void;
  onResetToBaseline: () => void;
  onImportData: (data: RoadNetworkData) => void;
  targetAccessPositionId: number | null;
  entranceNodeId: string | null;
  onToggleEntranceNode: (nodeId: string) => void;
  onStartSetAccessPoint: (posId: number) => void;
  onSnapAccessPointToNearestNode: (posId: number) => void;
  disconnectedNodeIds: Set<string>;
  unreachablePositionIds: number[];
  onTestRoute: (positionId: number) => void;
  testRouteResult: RouteResult | null;
  activeTestPositionId: number | null;

  // Campus Position & Building Management Props
  positions?: CampusPosition[];
  stages?: Stage[];
  targetMovePositionId?: number | null;
  pendingAddBuildingName?: string | null;
  onStartMovePosition?: (posId: number) => void;
  onUpdatePositionCoord?: (posId: number, pt: PixelPoint) => void;
  onResetPositionToDefault?: (posId: number) => void;
  onResetAllPositions?: () => void;
  onStartAddBuilding?: (name: string) => void;
  onCancelAddBuilding?: () => void;
  onUpdateBuildingName?: (posId: number, name: string) => void;
  onDeleteBuilding?: (posId: number) => void;
  onAddStage?: (positionId: number, stage: { stageNumber: number; name: string; floor?: string }) => void;
  onUpdateStage?: (oldStageNumber: number, positionId: number, updates: { stageNumber?: number; name?: string; floor?: string }) => void;
  onDeleteStage?: (stageNumber: number, positionId: number) => void;
  onResetStagesToDefault?: () => void;

  // Campus Boundary Props
  boundaryData?: BoundaryData;
  boundaryTool?: 'draw' | 'move' | 'connect' | 'delete';
  selectedBoundaryNodeId?: string | null;
  connectSourceBoundaryNodeId?: string | null;
  isBoundaryEnforced?: boolean;
  showBoundaryOverlay?: boolean;
  onChangeBoundaryTool?: (tool: 'draw' | 'move' | 'connect' | 'delete') => void;
  onNewBoundaryBranch?: () => void;
  onCloseBoundaryLoop?: () => void;
  onAutoConnectBoundaryPerimeter?: () => void;
  onToggleBoundaryEnforced?: () => void;
  onToggleShowBoundaryOverlay?: () => void;
  onClearBoundary?: () => void;
  onResetBoundaryToBaseline?: () => void;
  onUndoBoundary?: () => void;
  canUndoBoundary?: boolean;
  onSaveBoundaryToStorage?: () => void;
  onSelectBoundaryTab?: (isBoundaryTab: boolean) => void;
}

export const RoadNetworkEditor: React.FC<RoadNetworkEditorProps> = ({
  isOpen,
  onClose,
  activeTool,
  onChangeTool,
  isPreviewMode,
  onTogglePreviewMode,
  roadData,
  selectedNodeId,
  onNewBranch,
  onUndo,
  canUndo,
  onDeleteSelectedNode,
  onSaveToStorage,
  onResetToBaseline,
  onImportData,
  targetAccessPositionId,
  entranceNodeId,
  onToggleEntranceNode,
  onStartSetAccessPoint,
  onSnapAccessPointToNearestNode,
  disconnectedNodeIds,
  unreachablePositionIds,
  onTestRoute,
  testRouteResult,
  activeTestPositionId,

  // Position relocation props
  positions,
  stages = CAMPUS_STAGES,
  targetMovePositionId = null,
  pendingAddBuildingName = null,
  onStartMovePosition,
  onUpdatePositionCoord,
  onResetPositionToDefault,
  onResetAllPositions,
  onStartAddBuilding,
  onCancelAddBuilding,
  onUpdateBuildingName,
  onDeleteBuilding,
  onAddStage,
  onUpdateStage,
  onDeleteStage,
  onResetStagesToDefault,

  // Boundary props
  boundaryData,
  boundaryTool = 'draw',
  selectedBoundaryNodeId = null,
  connectSourceBoundaryNodeId = null,
  isBoundaryEnforced = true,
  showBoundaryOverlay = true,
  onChangeBoundaryTool,
  onNewBoundaryBranch,
  onCloseBoundaryLoop,
  onAutoConnectBoundaryPerimeter,
  onToggleBoundaryEnforced,
  onToggleShowBoundaryOverlay,
  onClearBoundary,
  onResetBoundaryToBaseline,
  onUndoBoundary,
  canUndoBoundary = false,
  onSaveBoundaryToStorage,
  onSelectBoundaryTab,
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'positions' | 'boundary' | 'access_points' | 'validation' | 'export'>('tools');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [copyPositionsSuccess, setCopyPositionsSuccess] = useState<boolean>(false);
  const [copyStagesSuccess, setCopyStagesSuccess] = useState<boolean>(false);
  const [copyBoundarySuccess, setCopyBoundarySuccess] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);

  // Building & Stage Management States
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState<boolean>(false);
  const [newBuildingNameInput, setNewBuildingNameInput] = useState<string>('');
  const [expandedBuildingIds, setExpandedBuildingIds] = useState<Set<number>>(() => new Set([1, 2, 3, 4]));
  const [addingStageForPosId, setAddingStageForPosId] = useState<number | null>(null);
  const [stageFormNum, setStageFormNum] = useState<string>('');
  const [stageFormName, setStageFormName] = useState<string>('');
  const [stageFormFloor, setStageFormFloor] = useState<string>('');

  // Movable / Draggable Modal State
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);
  const modalRef = useRef<HTMLElement>(null);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // If clicking on interactive elements inside header, don't initiate drag
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a')) return;

    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: rect.left,
      initialY: rect.top,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;

      let newX = dragStartRef.current.initialX + dx;
      let newY = dragStartRef.current.initialY + dy;

      const modalWidth = modalRef.current?.offsetWidth || 560;
      const modalHeight = modalRef.current?.offsetHeight || 600;

      // Keep within screen bounds
      newX = Math.max(10, Math.min(window.innerWidth - modalWidth - 10, newX));
      newY = Math.max(10, Math.min(window.innerHeight - Math.min(modalHeight, 100), newY));

      setModalPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleResetModalPosition = () => {
    setModalPosition(null);
  };

  if (!isOpen) return null;

  const handleTabSelect = (tab: 'tools' | 'positions' | 'boundary' | 'access_points' | 'validation' | 'export') => {
    setActiveTab(tab);
    onSelectBoundaryTab?.(tab === 'boundary');
  };

  const toggleExpandBuilding = (posId: number, forceOpen?: boolean) => {
    setExpandedBuildingIds((prev) => {
      const next = new Set(prev);
      if (forceOpen || !next.has(posId)) {
        next.add(posId);
      } else {
        next.delete(posId);
      }
      return next;
    });
  };

  const handleSaveNewStage = (posId: number) => {
    const num = parseInt(stageFormNum, 10);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid positive stage number');
      return;
    }
    if (!stageFormName.trim()) {
      alert('Please enter a stage name');
      return;
    }
    onAddStage?.(posId, {
      stageNumber: num,
      name: stageFormName.trim(),
      floor: stageFormFloor.trim() ? stageFormFloor.trim() : undefined,
    });
    setAddingStageForPosId(null);
    setStageFormNum('');
    setStageFormName('');
    setStageFormFloor('');
  };

  const handleCopyStagesCode = () => {
    const stagesCode = `// Campus Stages Configuration (${stages.length} Stages)
// Exported from HOLLY GRACE Development Mode

export const CAMPUS_STAGES: Stage[] = ${JSON.stringify(stages, null, 2)};
`;
    navigator.clipboard.writeText(stagesCode);
    setCopyStagesSuccess(true);
    setTimeout(() => setCopyStagesSuccess(false), 2500);
  };

  const handleCopyBoundaryCode = () => {
    const boundaryCode = `// Campus Walkable Boundary (Geofence Perimeter Graph)
// Exported from HOLLY GRACE Development Mode

export const CAMPUS_BOUNDARY_DATA = ${JSON.stringify(boundaryData, null, 2)};
`;
    navigator.clipboard.writeText(boundaryCode);
    setCopyBoundarySuccess(true);
    setTimeout(() => setCopyBoundarySuccess(false), 2500);
  };

  const activePositions = positions || CAMPUS_POSITIONS;
  const nodeCount = Object.keys(roadData.nodes).length;
  const edgeCount = roadData.edges.length;
  const boundaryNodeCount = boundaryData ? Object.keys(boundaryData.nodes).length : 0;
  const boundaryEdgeCount = boundaryData ? boundaryData.edges.length : 0;
  const selectedNode = selectedNodeId ? roadData.nodes[selectedNodeId] : null;

  // Generate clean TypeScript code for export
  const handleCopyCode = () => {
    const exportCode = `// Manual Campus Road Network Data
// Generated by HOLLY GRACE Road Network Editor

export const EXPORTED_ROAD_DATA = ${JSON.stringify(roadData, null, 2)};
`;
    navigator.clipboard.writeText(exportCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleCopyPositionsCode = () => {
    const positionsCode = `// Campus Positions Configuration (1 to ${activePositions.length})
// Exported from HOLLY GRACE Development Mode

export const CAMPUS_POSITIONS: CampusPosition[] = ${JSON.stringify(activePositions, null, 2)};
`;
    navigator.clipboard.writeText(positionsCode);
    setCopyPositionsSuccess(true);
    setTimeout(() => setCopyPositionsSuccess(false), 2500);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(roadData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `campus_road_network_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleApplyImportJson = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed.nodes || !parsed.edges) {
        throw new Error('Invalid road network JSON: missing nodes or edges.');
      }
      onImportData(parsed);
      setImportJsonText('');
      alert('Road network data imported successfully!');
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON.');
    }
  };

  return (
    <aside
      ref={modalRef}
      className={`fixed z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl text-white transition-shadow duration-200 flex flex-col overflow-hidden ${
        isMinimized
          ? 'w-84 h-14'
          : 'w-[540px] md:w-[580px] max-w-[calc(100vw-24px)] max-h-[88vh]'
      }`}
      style={{
        left: modalPosition ? `${modalPosition.x}px` : undefined,
        top: modalPosition ? `${modalPosition.y}px` : '4.25rem',
        right: modalPosition ? undefined : '1rem',
        pointerEvents: 'all',
        boxShadow: isDragging
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 2px rgba(56, 189, 248, 0.4)'
          : undefined,
      }}
    >
      {/* Header bar - Draggable */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className={`px-4 py-3 bg-slate-800/90 border-b border-slate-700/90 flex items-center justify-between select-none cursor-grab active:cursor-grabbing ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        title="Drag header to move editor modal anywhere on screen"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <GripHorizontal className="w-4 h-4 text-slate-400 hover:text-slate-200 shrink-0" />
          <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            <Edit3 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-xs tracking-wide text-slate-100 flex items-center gap-2 truncate">
              <span>Road Network Editor</span>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider shrink-0">
                Dev Mode
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
              <span>{nodeCount} nodes</span>
              <span>•</span>
              <span>{edgeCount} road segments</span>
              <span className="text-slate-500 text-[9px] italic ml-1">(Drag to move)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {modalPosition && (
            <button
              onClick={handleResetModalPosition}
              className="p-1.5 rounded-lg hover:bg-slate-700/70 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset modal position to default top-right"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsMinimized((prev) => !prev)}
            className="p-1.5 rounded-lg hover:bg-slate-700/70 text-slate-400 hover:text-slate-200 transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-colors"
            title="Close Editor"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Main Action Bar */}
          <div className="p-3 bg-slate-950/70 border-b border-slate-800 grid grid-cols-4 gap-2 select-none">
            {/* Draw Mode Tool */}
            <button
              onClick={() => onChangeTool('draw')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                activeTool === 'draw'
                  ? 'bg-cyan-600 text-white shadow-cyan-900/50 ring-2 ring-cyan-400/50'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title="Click map to add or extend road nodes"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Draw</span>
            </button>

            {/* Select / Move Tool */}
            <button
              onClick={() => onChangeTool('select')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                activeTool === 'select'
                  ? 'bg-cyan-600 text-white shadow-cyan-900/50 ring-2 ring-cyan-400/50'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title="Select or drag nodes and badges to reposition"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Move</span>
            </button>

            {/* Link Tool */}
            <button
              onClick={() => onChangeTool('connect')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                activeTool === 'connect'
                  ? 'bg-pink-600 text-white shadow-pink-900/50 ring-2 ring-pink-400/50'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title="Connect two road nodes"
            >
              <Link className="w-3.5 h-3.5" />
              <span>Link</span>
            </button>

            {/* Delete Tool */}
            <button
              onClick={() => onChangeTool('delete')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                activeTool === 'delete'
                  ? 'bg-red-600 text-white shadow-red-900/50 ring-2 ring-red-400/50'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title="Delete node or edge"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          {/* Secondary Actions Bar */}
          <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs">
            <button
              onClick={onNewBranch}
              className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 font-semibold transition-colors"
              title="Start a new disconnected road branch"
            >
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Branch</span>
            </button>

            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition-colors ${
                canUndo
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
              }`}
              title="Undo previous action (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>

            <button
              onClick={onTogglePreviewMode}
              className={`py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition-colors ${
                isPreviewMode
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title="Toggle preview without editor handles"
            >
              {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>Preview</span>
            </button>

            <button
              onClick={onSaveToStorage}
              className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 font-bold shadow-sm shadow-emerald-950/40 transition-colors"
              title="Save current road network to local storage"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>

          {/* Navigation Tabs (Pill style with good breathing room) */}
          <div className="p-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none select-none text-xs">
            <button
              onClick={() => handleTabSelect('tools')}
              className={`py-1.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'tools'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40 font-bold'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Roads</span>
            </button>

            <button
              onClick={() => handleTabSelect('positions')}
              className={`py-1.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'positions'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-bold'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Buildings & Stages</span>
            </button>

            <button
              onClick={() => handleTabSelect('boundary')}
              className={`py-1.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'boundary'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-bold'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Boundary</span>
              {boundaryNodeCount >= 3 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => handleTabSelect('access_points')}
              className={`py-1.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'access_points'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40 font-bold'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Access</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </button>

            <button
              onClick={() => handleTabSelect('validation')}
              className={`py-1.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'validation'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40 font-bold'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Verify</span>
              {unreachablePositionIds.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => handleTabSelect('export')}
              className={`py-1.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'export'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-bold'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Copy className="w-3 h-3" />
              <span>Code</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="p-4 overflow-y-auto max-h-[calc(88vh-220px)] text-xs space-y-4 custom-scrollbar">
            {/* TAB 1: ROAD NODES & EDITING */}
            {activeTab === 'tools' && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="font-semibold text-slate-200 mb-1">Editor Instructions:</div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 leading-relaxed">
                    <li><strong className="text-cyan-300">Draw mode:</strong> Click on map to add road nodes and trace actual walking curves.</li>
                    <li><strong className="text-cyan-300">Move mode:</strong> Drag any node or position badge to reposition it.</li>
                    <li><strong className="text-pink-300">Link mode:</strong> Click source node, then click target node to create a road.</li>
                    <li><strong className="text-red-300">Delete mode:</strong> Click a node or edge line to remove it.</li>
                  </ul>
                </div>

                {/* Selected Node Inspector */}
                {selectedNode ? (
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300">Selected Node:</span>
                      <span className="font-mono text-cyan-200 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-700/50">
                        {selectedNode.id}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-1">
                      <div>Pixel: ({Math.round(selectedNode.pixelCoord.x)}, {Math.round(selectedNode.pixelCoord.y)})</div>
                      {selectedNode.label && (
                        <div>Label: <span className="text-slate-100 font-medium">{selectedNode.label}</span></div>
                      )}
                    </div>

                    <div className="pt-1.5 border-t border-cyan-800/40 flex items-center justify-between">
                      <button
                        onClick={() => onToggleEntranceNode(selectedNode.id)}
                        className={`py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                          selectedNode.id === entranceNodeId || selectedNode.isEntrance
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30'
                        }`}
                        title="Set this node as the campus south entrance"
                      >
                        {selectedNode.id === entranceNodeId || selectedNode.isEntrance
                          ? '✓ South Entrance Gate'
                          : 'Set as South Entrance Gate'}
                      </button>

                      <button
                        onClick={onDeleteSelectedNode}
                        className="py-1 px-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/50 text-[10px] font-semibold"
                      >
                        Delete Node
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 text-center py-2">
                    No node selected. Click any point to select or draw.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CAMPUS BUILDINGS & STAGES (CUSTOM NAMES, POSITIONS, FLOORS) */}
            {activeTab === 'positions' && (
              <div className="space-y-4">
                {/* Information Header */}
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/50 text-blue-200 leading-relaxed flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-blue-100">
                      Buildings & Stages Hierarchy
                    </div>
                    <p className="text-[11px] text-blue-300/80 leading-normal">
                      Manage campus buildings and stage rooms. Add floors or leave blank. Buildings with 0 stages can be navigated directly as standalone landmarks.
                    </p>
                  </div>
                </div>

                {/* Add New Building Button / Form */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        Add New Building
                      </span>
                    </div>

                    {!isAddBuildingOpen && (
                      <button
                        type="button"
                        onClick={() => setIsAddBuildingOpen(true)}
                        className="py-1 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Building</span>
                      </button>
                    )}
                  </div>

                  {isAddBuildingOpen && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-800/80 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newBuildingNameInput}
                          onChange={(e) => setNewBuildingNameInput(e.target.value)}
                          placeholder="Building Name (e.g. Canteen, Auditorium, Admin Block)"
                          className="flex-1 bg-slate-950 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newBuildingNameInput.trim()) {
                              alert('Please enter a building name');
                              return;
                            }
                            onStartAddBuilding?.(newBuildingNameInput.trim());
                            setNewBuildingNameInput('');
                            setIsAddBuildingOpen(false);
                          }}
                          className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Place on Map</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddBuildingOpen(false);
                            setNewBuildingNameInput('');
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        Tip: Click &ldquo;Place on Map&rdquo;, then click anywhere on the campus map to place this building marker.
                      </p>
                    </div>
                  )}

                  {pendingAddBuildingName && (
                    <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/80 text-amber-300 text-xs flex items-center justify-between animate-pulse">
                      <span className="font-medium">
                        Click on map to place <strong>&ldquo;{pendingAddBuildingName}&rdquo;</strong>
                      </span>
                      {onCancelAddBuilding && (
                        <button
                          type="button"
                          onClick={onCancelAddBuilding}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px]"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Buildings List */}
                <div className="space-y-3.5">
                  {activePositions.map((pos) => {
                    const isTargeted = targetMovePositionId === pos.id;
                    const { x, y } = pos.pixelCoord;
                    const isExpanded = expandedBuildingIds.has(pos.id);
                    const buildingStages = stages.filter((s) => s.positionId === pos.id);

                    return (
                      <div
                        key={`pos-editor-card-${pos.id}`}
                        className={`p-4 rounded-2xl border transition-all space-y-3.5 shadow-md ${
                          isTargeted
                            ? 'bg-amber-950/40 border-amber-400/90 shadow-amber-950/50 ring-2 ring-amber-400/30'
                            : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        {/* Top Header Row: Badge, Editable Name, Coordinate, Delete */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              <Building2 className="w-3.5 h-3.5" />
                            </span>
                            <input
                              type="text"
                              value={pos.name}
                              onChange={(e) => onUpdateBuildingName?.(pos.id, e.target.value)}
                              className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                              placeholder="Building Name"
                              title="Click to rename building"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 font-mono">
                              ({Math.round(x)}, {Math.round(y)})
                            </span>
                            {onDeleteBuilding && (
                              <button
                                type="button"
                                onClick={() => onDeleteBuilding(pos.id)}
                                className="p-1.5 rounded-lg hover:bg-red-950/80 text-slate-400 hover:text-red-400 transition-colors"
                                title="Delete this building and all its stages"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Relocation & Nudge Section */}
                        <div className="space-y-2 pt-0.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onStartMovePosition?.(pos.id)}
                              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                                isTargeted
                                  ? 'bg-amber-500 text-slate-950 font-extrabold'
                                  : 'bg-slate-700/90 hover:bg-slate-700 text-amber-300'
                              }`}
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{isTargeted ? 'Click map to place' : 'Pick on Map'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onResetPositionToDefault?.(pos.id)}
                              className="py-1.5 px-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                              title="Reset position to default coordinate"
                            >
                              Reset
                            </button>
                          </div>

                          {/* Pixel nudge controls with spacious 2-column layout */}
                          <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs">
                            {/* X controls */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-slate-400 font-mono text-[10px] font-bold w-4">X:</span>
                              <div className="flex items-center gap-1 flex-1 justify-center">
                                <button type="button" onClick={() => onUpdatePositionCoord?.(pos.id, { x: x - 5, y })} className="w-7 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center transition-colors">-5</button>
                                <button type="button" onClick={() => onUpdatePositionCoord?.(pos.id, { x: x - 1, y })} className="w-7 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center transition-colors">-1</button>
                                <span className="font-mono text-cyan-300 w-10 text-center text-xs font-bold">{Math.round(x)}</span>
                                <button type="button" onClick={() => onUpdatePositionCoord?.(pos.id, { x: x + 1, y })} className="w-7 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center transition-colors">+1</button>
                                <button type="button" onClick={() => onUpdatePositionCoord?.(pos.id, { x: x + 5, y })} className="w-7 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center transition-colors">+5</button>
                              </div>
                            </div>

                            {/* Y controls */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-slate-400 font-mono text-[10px] font-bold w-4">Y:</span>
                              <div className="flex items-center gap-1 flex-1 justify-center">
                                <button type="button" onClick={() => onUpdatePositionCoord?.(pos.id, { x, y: y - 5 })} className="w-7 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center transition-colors">-5</button>
                                <button type="button" onClick={() => onUpdatePositionCoord?.(pos.id, { x, y: y - 1 })} className="w-7 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center transition-colors">-1</button>
                                <span className="font-mono text-cyan-300 w-10 text-center text-xs font-bold">{Math.round(y)}</span>
                                <button type="button" onClick={() => onUpdatePositionCoord?.(pos.id, { x, y: y + 1 })} className="w-7 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center transition-colors">+1</button>
                                <button type="button" onClick={() => onUpdatePositionCoord?.(pos.id, { x, y: y + 5 })} className="w-7 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center transition-colors">+5</button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* STAGES SECTION UNDER THIS BUILDING */}
                        <div className="mt-2 pt-2.5 border-t border-slate-700/80">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              type="button"
                              onClick={() => toggleExpandBuilding(pos.id)}
                              className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-cyan-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                              <span>Stages</span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  buildingStages.length > 0
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                    : 'bg-slate-900 text-slate-400'
                                }`}
                              >
                                {buildingStages.length}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                toggleExpandBuilding(pos.id, true);
                                setAddingStageForPosId(pos.id);
                                const maxStageNum = stages.reduce(
                                  (max, s) => Math.max(max, s.stageNumber || 0),
                                  0
                                );
                                setStageFormNum(String(maxStageNum + 1));
                              }}
                              className="py-1 px-2.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Stage</span>
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="space-y-2 mt-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 animate-fade-in">
                              {/* Inline Add Stage Form */}
                              {addingStageForPosId === pos.id && (
                                <div className="p-3 rounded-xl bg-slate-900/95 border border-cyan-500/70 space-y-2.5 mb-2.5 animate-fade-in shadow-xl">
                                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Stage to &ldquo;{pos.name}&rdquo;</span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                    <input
                                      type="number"
                                      value={stageFormNum}
                                      onChange={(e) => setStageFormNum(e.target.value)}
                                      placeholder="Stage #"
                                      className="col-span-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white text-center font-bold"
                                    />
                                    <input
                                      type="text"
                                      value={stageFormName}
                                      onChange={(e) => setStageFormName(e.target.value)}
                                      placeholder="Stage Name (e.g. Auditorium Hall)"
                                      className="col-span-3 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                                      Floor:
                                    </span>
                                    <input
                                      type="text"
                                      value={stageFormFloor}
                                      onChange={(e) => setStageFormFloor(e.target.value)}
                                      placeholder="e.g. 1st Floor, Ground Floor (leave blank if none)"
                                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 placeholder:text-slate-500"
                                    />
                                  </div>
                                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                                    <button
                                      type="button"
                                      onClick={() => setAddingStageForPosId(null)}
                                      className="py-1 px-3 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveNewStage(pos.id)}
                                      className="py-1 px-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm"
                                    >
                                      Save Stage
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Stages List */}
                              {buildingStages.length === 0 ? (
                                <div className="text-center py-3 px-3 text-[11px] text-slate-400 italic bg-slate-900/50 rounded-xl border border-slate-800/80">
                                  No stages in this building (navigable directly as a standalone building/landmark)
                                </div>
                              ) : (
                                buildingStages.map((stg) => (
                                  <div
                                    key={`stg-${stg.stageNumber}-${pos.id}`}
                                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 space-y-2 transition-all shadow-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-black flex items-center justify-center shrink-0">
                                        {stg.stageNumber}
                                      </span>
                                      <input
                                        type="text"
                                        value={stg.name}
                                        onChange={(e) =>
                                          onUpdateStage?.(stg.stageNumber, pos.id, {
                                            name: e.target.value,
                                          })
                                        }
                                        className="flex-1 bg-slate-950/70 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-100 focus:outline-none"
                                        placeholder="Stage Name"
                                      />
                                      {onDeleteStage && (
                                        <button
                                          type="button"
                                          onClick={() => onDeleteStage(stg.stageNumber, pos.id)}
                                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-950/40 shrink-0 transition-colors"
                                          title="Delete Stage"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                    {/* Floor input: text or blank */}
                                    <div className="flex items-center gap-2 pl-9">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                                        Floor:
                                      </span>
                                      <input
                                        type="text"
                                        value={stg.floor || ''}
                                        onChange={(e) =>
                                          onUpdateStage?.(stg.stageNumber, pos.id, {
                                            floor: e.target.value,
                                          })
                                        }
                                        placeholder="(Optional — e.g. 1st Floor, or leave blank)"
                                        className="flex-1 bg-slate-950/50 border border-slate-800 focus:border-amber-400 rounded-lg px-2.5 py-0.5 text-xs text-amber-300 placeholder:text-slate-600 focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Buildings & Stages Code Export & Reset */}
                <div className="pt-3 flex flex-col gap-2 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyPositionsCode}
                      className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/40"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copyPositionsSuccess ? 'Copied Buildings!' : 'Copy Buildings Code'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyStagesCode}
                      className="py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/40"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copyStagesSuccess ? 'Copied Stages!' : 'Copy Stages Code'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onResetAllPositions}
                      className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Buildings</span>
                    </button>

                    {onResetStagesToDefault && (
                      <button
                        type="button"
                        onClick={onResetStagesToDefault}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Stages</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CAMPUS WALKABLE BOUNDARY GEOFENCE */}
            {activeTab === 'boundary' && (
              <div className="space-y-3">
                {/* Status card */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                    boundaryNodeCount >= 3 && boundaryEdgeCount >= 3
                      ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                      : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">
                        {boundaryNodeCount >= 3 && boundaryEdgeCount >= 3 ? 'Walkable Boundary Active' : 'Boundary Incomplete'}
                      </div>
                      <div className="text-[10px] opacity-80">
                        {boundaryNodeCount} nodes • {boundaryEdgeCount} connecting edges
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                      isBoundaryEnforced
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-700/60 text-slate-400 border-slate-600'
                    }`}
                  >
                    {isBoundaryEnforced ? 'Enforced' : 'Off'}
                  </span>
                </div>

                {/* Boundary Drawing Mode Selector: Draw, Move, Link, Delete */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Boundary Tools
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      onClick={() => onChangeBoundaryTool?.('draw')}
                      className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        boundaryTool === 'draw'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="Click map to add boundary node and connect"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Draw</span>
                    </button>
                    <button
                      onClick={() => onChangeBoundaryTool?.('move')}
                      className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        boundaryTool === 'move'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="Drag boundary nodes to reposition"
                    >
                      <Move className="w-3 h-3" />
                      <span>Move</span>
                    </button>
                    <button
                      onClick={() => onChangeBoundaryTool?.('connect')}
                      className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        boundaryTool === 'connect'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-900/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="Click Node A then Node B to connect them"
                    >
                      <Link className="w-3 h-3" />
                      <span>Link</span>
                    </button>
                    <button
                      onClick={() => onChangeBoundaryTool?.('delete')}
                      className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        boundaryTool === 'delete'
                          ? 'bg-red-600 text-white shadow-sm shadow-red-900/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="Click any boundary node or line to delete it"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {(selectedBoundaryNodeId || connectSourceBoundaryNodeId) && (
                  <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40">
                    {connectSourceBoundaryNodeId
                      ? `Connecting from: ${connectSourceBoundaryNodeId}`
                      : `Active node: ${selectedBoundaryNodeId}`}
                  </div>
                )}

                {/* Node Connection & Path Actions */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Connect & Path Actions
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={onNewBoundaryBranch}
                      className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1 text-xs font-medium"
                      title="Start a new boundary segment without connecting to previous node"
                    >
                      <GitBranch className="w-3 h-3 text-cyan-400" />
                      <span>New Line</span>
                    </button>

                    <button
                      onClick={onCloseBoundaryLoop}
                      className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center justify-center gap-1 text-xs font-medium"
                      title="Connect the last node to the first node to seal the loop"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Close Loop</span>
                    </button>

                    <button
                      onClick={onAutoConnectBoundaryPerimeter}
                      className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center justify-center gap-1 text-xs font-medium"
                      title="Auto-connect all placed boundary nodes into a clean perimeter loop without crisscrossing lines"
                    >
                      <Play className="w-3 h-3" />
                      <span>Auto-Loop</span>
                    </button>
                  </div>
                </div>

                {/* Undo & Save */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={onUndoBoundary}
                    disabled={!canUndoBoundary}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 flex items-center justify-center gap-1 text-xs font-medium"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Undo</span>
                  </button>

                  <button
                    onClick={onSaveBoundaryToStorage}
                    className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 text-xs font-bold shadow-sm shadow-emerald-900/40"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Boundary</span>
                  </button>
                </div>

                {/* Toggles */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800 cursor-pointer hover:bg-slate-800/50">
                    <span className="text-xs text-slate-200 font-medium">
                      Enforce Boundary (Block Forest Clicks)
                    </span>
                    <input
                      type="checkbox"
                      checked={isBoundaryEnforced}
                      onChange={onToggleBoundaryEnforced}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800 cursor-pointer hover:bg-slate-800/50">
                    <span className="text-xs text-slate-200 font-medium">
                      Show Translucent Polygon on Map
                    </span>
                    <input
                      type="checkbox"
                      checked={showBoundaryOverlay}
                      onChange={onToggleShowBoundaryOverlay}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Code Export & Reset */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                  <button
                    onClick={handleCopyBoundaryCode}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-800/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copyBoundarySuccess ? 'Copied Boundary Code!' : 'Copy Boundary Code'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={onResetBoundaryToBaseline}
                      className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-1"
                      title="Reset to clean baseline boundary enclosing all 10 positions"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Baseline</span>
                    </button>

                    <button
                      onClick={onClearBoundary}
                      className="py-1.5 px-2 rounded-lg bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-800/40 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ACCESS POINTS (PHASE 3) */}
            {activeTab === 'access_points' && (
              <div className="space-y-2.5">
                <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200 leading-relaxed">
                  <strong>Access Points</strong> are where visitors step off the road to enter a building or arena (distinct from building roof badges).
                </div>

                <div className="space-y-2">
                  {activePositions.map((pos) => {
                    const ap = roadData.accessPoints[pos.id];
                    const isTargeted = targetAccessPositionId === pos.id;

                    return (
                      <div
                        key={`ap-card-${pos.id}`}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isTargeted
                            ? 'bg-amber-950/60 border-amber-400 shadow-md shadow-amber-900/30'
                            : 'bg-slate-800/70 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center justify-center font-black text-[10px]">
                              {pos.id}
                            </span>
                            <span className="font-bold text-slate-200 text-xs">{pos.name}</span>
                          </div>
                        </div>

                        {ap ? (
                          <div className="space-y-1.5 text-[11px] text-slate-400">
                            <div className="flex items-center justify-between text-[10px]">
                              <span>
                                Coord: ({Math.round(ap.pixelCoord.x)}, {Math.round(ap.pixelCoord.y)})
                              </span>
                              <span>Node: <code className="text-cyan-300 font-mono">{ap.connectedRoadNodeId}</code></span>
                            </div>

                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                onClick={() => onStartSetAccessPoint(pos.id)}
                                className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all ${
                                  isTargeted
                                    ? 'bg-amber-500 text-slate-950 font-bold'
                                    : 'bg-slate-700 hover:bg-slate-600 text-amber-300'
                                }`}
                              >
                                <MapPin className="w-3 h-3" />
                                <span>{isTargeted ? 'Click map to place' : 'Pick on Map'}</span>
                              </button>

                              <button
                                onClick={() => onSnapAccessPointToNearestNode(pos.id)}
                                className="py-1 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-medium"
                                title="Snap access point to nearest road node"
                              >
                                Snap to Road
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => onStartSetAccessPoint(pos.id)}
                            className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Set Access Point</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: VERIFY & TEST (PHASE 6) */}
            {activeTab === 'validation' && (
              <div className="space-y-3">
                {/* Health Overview */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="font-semibold text-slate-200 mb-1 flex items-center justify-between">
                    <span>Network Connectivity</span>
                    {unreachablePositionIds.length === 0 ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All {activePositions.length} Reachable
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1 font-bold text-[10px]">
                        <AlertTriangle className="w-3.5 h-3.5" /> {unreachablePositionIds.length} Unreachable
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-700/60">
                    <span>South Entrance Gate:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {entranceNodeId ? `${entranceNodeId} (Y=${Math.round(roadData.nodes[entranceNodeId]?.pixelCoord.y || 0)})` : 'None detected'}
                    </span>
                  </div>
                  {disconnectedNodeIds.size > 0 ? (
                    <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{disconnectedNodeIds.size} road nodes are disconnected from the South Entrance ({entranceNodeId}).</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>All {Object.keys(roadData.nodes).length} road nodes are fully connected!</span>
                    </p>
                  )}
                </div>

                {/* Position Reachability Checklist */}
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    Position Reachability From Entrance
                  </div>
                  {activePositions.map((pos) => {
                    const isUnreachable = unreachablePositionIds.includes(pos.id);
                    const isTesting = activeTestPositionId === pos.id;

                    return (
                      <div
                        key={`reach-${pos.id}`}
                        className={`p-2 rounded-xl flex items-center justify-between border transition-colors ${
                          isTesting
                            ? 'bg-cyan-950/60 border-cyan-500'
                            : 'bg-slate-800/60 border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isUnreachable ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {isUnreachable ? '✕' : '✓'}
                          </span>
                          <span className="font-semibold text-slate-200">{pos.name}</span>
                        </div>

                        <button
                          onClick={() => onTestRoute(pos.id)}
                          className="py-0.5 px-2 rounded bg-cyan-600/80 hover:bg-cyan-600 text-white font-medium text-[10px] flex items-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>Test Route</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Test Route Output Info */}
                {testRouteResult && activeTestPositionId && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-800/80 text-[11px] text-cyan-200 space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Route to &ldquo;{activePositions.find((p) => p.id === activeTestPositionId)?.name || 'Destination'}&rdquo; Verified</span>
                    </div>
                    <div>Waypoints: {testRouteResult.points.length} • Road nodes: {testRouteResult.points.length - 2}</div>
                    <div className="text-[10px] text-cyan-400 font-mono truncate">
                      Path: {roadData.accessPoints[activeTestPositionId]?.connectedRoadNodeId}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: CODE EXPORT & STORAGE */}
            {activeTab === 'export' && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="font-semibold text-slate-200">Export Road Network</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Road networks are auto-saved to browser storage. You can copy the code to save permanently in the source repository.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleCopyCode}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/40"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                    </button>

                    <button
                      onClick={handleDownloadJson}
                      className="py-1.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs flex items-center gap-1.5"
                      title="Download as JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>JSON</span>
                    </button>
                  </div>
                </div>

                {/* Export Campus Positions & Buildings */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="font-semibold text-slate-200">Export Buildings Configuration</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Export the current pixel coordinates and names of all {activePositions.length} campus buildings.
                  </p>
                  <button
                    onClick={handleCopyPositionsCode}
                    className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/40"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copyPositionsSuccess ? 'Copied Buildings Code!' : 'Copy Buildings Code'}</span>
                  </button>
                </div>

                {/* Export Campus Stages & Floors */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="font-semibold text-slate-200">Export Stages & Floors Configuration</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Export all {stages.length} campus stages mapped to buildings with their floor assignments.
                  </p>
                  <button
                    onClick={handleCopyStagesCode}
                    className="w-full py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/40"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copyStagesSuccess ? 'Copied Stages Code!' : 'Copy Stages Code'}</span>
                  </button>
                </div>

                {/* Export Campus Boundary */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="font-semibold text-slate-200">Export Campus Boundary</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Export the perimeter coordinates ({boundaryNodeCount} nodes, {boundaryEdgeCount} edges) for the walkable geofence.
                  </p>
                  <button
                    onClick={handleCopyBoundaryCode}
                    className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/40"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copyBoundarySuccess ? 'Copied Boundary Code!' : 'Copy Boundary Code'}</span>
                  </button>
                </div>

                {/* Import JSON */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="font-semibold text-slate-200">Import Network JSON</div>
                  <textarea
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder="Paste road network JSON here..."
                    rows={3}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-[10px] font-mono text-cyan-300 resize-none focus:outline-none focus:border-cyan-500"
                  />
                  {importError && (
                    <p className="text-[10px] text-red-400">{importError}</p>
                  )}
                  <button
                    onClick={handleApplyImportJson}
                    disabled={!importJsonText.trim()}
                    className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Apply Imported Data</span>
                  </button>
                </div>

                {/* Reset to Baseline */}
                <div className="pt-1">
                  <button
                    onClick={onResetToBaseline}
                    className="w-full py-1.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-800/50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert to Verified Baseline</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};
