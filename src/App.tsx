import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  getDefaultCampusPositions,
  getPositionById,
  formatBuildingDisplayName,
} from './config/campusPositions';
import {
  CAMPUS_ROAD_GRAPH,
  buildRoadGraphFromData,
  getDefaultRoadNetworkData,
  getEntranceNode,
} from './config/roadNetwork';
import {
  autoConnectPerimeterEdges,
  extractPolygonFromBoundaryData,
  getDefaultBoundaryData,
} from './config/campusBoundary';
import { getStagesByPositionId, getDefaultCampusStages } from './config/stageMapping';
import { calculateRoute, findNearestNode } from './services/routingService';
import {
  BoundaryData,
  BoundaryNode,
  CampusPosition,
  PixelPoint,
  RoadEdge,
  RoadNetworkData,
  RoadNode,
  RouteResult,
  Stage,
} from './types/campus';
import { EditorTool } from './components/editor/RoadEditorOverlay';
import { RoadNetworkEditor } from './components/editor/RoadNetworkEditor';
import { CampusMap } from './components/map/CampusMap';
import { DesktopNavPanel } from './components/navigation/DesktopNavPanel';
import { MobileNavHeader } from './components/navigation/MobileNavHeader';
import { MobileBottomSheet } from './components/navigation/MobileBottomSheet';
import { DestinationSearchModal } from './components/navigation/DestinationSearchModal';
import { useIsMobile } from './hooks/useIsMobile';
import { Sparkles } from 'lucide-react';
import { WelcomeScreen } from './components/WelcomeScreen';

const ROAD_NETWORK_STORAGE_KEY = 'holly_grace_manual_road_network';
const CAMPUS_POSITIONS_STORAGE_KEY = 'holly_grace_campus_positions';
const CAMPUS_STAGES_STORAGE_KEY = 'holly_grace_campus_stages';
const CAMPUS_BOUNDARY_DATA_STORAGE_KEY = 'holly_grace_campus_boundary_data';
const CAMPUS_BOUNDARY_ENFORCED_STORAGE_KEY = 'holly_grace_boundary_enforced';

export const App: React.FC = () => {
  // 1. Campus Positions State (Loaded from storage or baseline)
  const [positions, setPositions] = useState<CampusPosition[]>(() => {
    try {
      const saved = localStorage.getItem(CAMPUS_POSITIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const baseline = getDefaultCampusPositions();
        if (Array.isArray(parsed) && parsed.length >= baseline.length) {
          return parsed.map((p: CampusPosition) => ({
            ...p,
            name: formatBuildingDisplayName(p.name),
          }));
        }
      }
    } catch {
      // ignore
    }
    return getDefaultCampusPositions();
  });
  const [targetMovePositionId, setTargetMovePositionId] = useState<number | null>(null);
  const [pendingAddBuildingName, setPendingAddBuildingName] = useState<string | null>(null);

  // Stages & Floors State (Loaded from storage or baseline)
  const [stages, setStages] = useState<Stage[]>(() => {
    try {
      const saved = localStorage.getItem(CAMPUS_STAGES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const baseline = getDefaultCampusStages();
        if (Array.isArray(parsed) && parsed.length >= baseline.length) {
          // VIP Parking is a named place only, never a numbered stage.
          return parsed.filter((stage: Stage) => stage.positionId !== 10);
        }
      }
    } catch {
      // ignore
    }
    return getDefaultCampusStages();
  });

  // 2. Road Network Data (Loaded from storage or baseline default)
  const [roadData, setRoadData] = useState<RoadNetworkData>(() => {
    try {
      const saved = localStorage.getItem(ROAD_NETWORK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nodes && parsed.edges) {
          const baseline = getDefaultRoadNetworkData();
          // Automatically upgrade if stored network has fewer nodes than our verified baseline
          if (Object.keys(parsed.nodes).length < Object.keys(baseline.nodes).length) {
            try {
              localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(baseline));
            } catch {
              // ignore
            }
            return baseline;
          }
          const mergedAccessPoints = { ...baseline.accessPoints, ...(parsed.accessPoints || {}) };
          return {
            ...parsed,
            accessPoints: mergedAccessPoints,
          };
        }
      }
    } catch {
      // ignore
    }
    return getDefaultRoadNetworkData();
  });

  // 3. Boundary Data
  const [boundaryData, setBoundaryData] = useState<BoundaryData>(() => {
    try {
      const saved = localStorage.getItem(CAMPUS_BOUNDARY_DATA_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const baseline = getDefaultBoundaryData();
        if (parsed.nodes && parsed.edges && Object.keys(parsed.nodes).length >= Object.keys(baseline.nodes).length) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return getDefaultBoundaryData();
  });

  const [isBoundaryEnforced, setIsBoundaryEnforced] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(CAMPUS_BOUNDARY_ENFORCED_STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [showBoundaryOverlay, setShowBoundaryOverlay] = useState<boolean>(false);
  const [isBoundaryEditing, setIsBoundaryEditing] = useState<boolean>(false);
  const [boundaryTool, setBoundaryTool] = useState<'draw' | 'move' | 'connect' | 'delete'>('draw');
  const [selectedBoundaryNodeId, setSelectedBoundaryNodeId] = useState<string | null>(null);
  const [connectSourceBoundaryNodeId, setConnectSourceBoundaryNodeId] = useState<string | null>(null);
  const [boundaryUndoStack, setBoundaryUndoStack] = useState<BoundaryData[]>([]);

  const boundaryPolygonPoints = useMemo(() => {
    return extractPolygonFromBoundaryData(boundaryData);
  }, [boundaryData]);

  // Entrance Node
  const entranceNode = useMemo(() => {
    return getEntranceNode(roadData.nodes) || getEntranceNode(CAMPUS_ROAD_GRAPH.nodes);
  }, [roadData.nodes]);

  const defaultStartPoint: PixelPoint = useMemo(() => {
    return entranceNode ? entranceNode.pixelCoord : { x: 656, y: 719 };
  }, [entranceNode]);

  // 4. User Starting Location State (Purely image coordinate)
  const [startPoint, setStartPoint] = useState<PixelPoint>(defaultStartPoint);
  const [isCustomStart, setIsCustomStart] = useState<boolean>(false);

  // 5. Destination State
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);

  // 6. Navigation Route State
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);

  // 7. Boundary Toast & Out-of-Bounds Red Glow State
  const [lastInvalidClick, setLastInvalidClick] = useState<PixelPoint | null>(null);
  const [outsideBoundaryToast, setOutsideBoundaryToast] = useState<string | null>(null);
  const [showOutsideGlow, setShowOutsideGlow] = useState<boolean>(false);

  // 8. Search Modal State
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const isMobileViewport = useIsMobile();

  // 8b. Mobile reset signal: returns the map to its initial pan/zoom
  const [mapResetSignal, setMapResetSignal] = useState<number>(0);

  // 9. Developer / Admin Mode State (Hidden from normal visitors)
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return search.includes('dev=true') || search.includes('admin=true') || hash === '#dev';
  });
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [devToast, setDevToast] = useState<string | null>(null);

  // Secret Logo Multi-click unlock for testing & authorized admins
  const logoClickCountRef = useRef<number>(0);
  const logoClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = useCallback(() => {
    logoClickCountRef.current += 1;
    if (logoClickTimeoutRef.current) clearTimeout(logoClickTimeoutRef.current);

    if (logoClickCountRef.current >= 5) {
      setIsDevMode((prev) => {
        const next = !prev;
        setDevToast(next ? 'Developer Mode Enabled' : 'Developer Mode Disabled');
        setTimeout(() => setDevToast(null), 3000);
        if (!next) setIsEditorOpen(false);
        return next;
      });
      logoClickCountRef.current = 0;
    } else {
      logoClickTimeoutRef.current = setTimeout(() => {
        logoClickCountRef.current = 0;
      }, 2500);
    }
  }, []);

  // Keyboard shortcut Ctrl+Shift+D or Cmd+Shift+D to toggle dev mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsDevMode((prev) => {
          const next = !prev;
          setDevToast(next ? 'Developer Mode Enabled' : 'Developer Mode Disabled');
          setTimeout(() => setDevToast(null), 3000);
          if (!next) setIsEditorOpen(false);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Road Network Editor Tools State (Preserved for authorized development)
  const [activeEditorTool, setActiveEditorTool] = useState<EditorTool>('draw');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectSourceNodeId, setConnectSourceNodeId] = useState<string | null>(null);
  const [targetAccessPositionId, setTargetAccessPositionId] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState<RoadNetworkData[]>([]);
  const [activeTestPositionId, setActiveTestPositionId] = useState<number | null>(null);

  // Road Graph for pathfinding & validation
  const activeRoadGraph = useMemo(() => {
    return buildRoadGraphFromData(roadData);
  }, [roadData]);

  const { disconnectedNodeIds, unreachablePositionIds } = useMemo(() => {
    if (!entranceNode) {
      return {
        disconnectedNodeIds: new Set<string>(),
        unreachablePositionIds: [],
      };
    }

    const reachable = new Set<string>();
    const queue = [entranceNode.id];
    reachable.add(entranceNode.id);

    while (queue.length > 0) {
      const u = queue.shift()!;
      const neighbors = activeRoadGraph.adjacencyList[u] || [];
      for (const edge of neighbors) {
        if (!reachable.has(edge.to)) {
          reachable.add(edge.to);
          queue.push(edge.to);
        }
      }
    }

    const disconnected = new Set<string>();
    for (const nodeId of Object.keys(activeRoadGraph.nodes)) {
      if (!reachable.has(nodeId)) {
        disconnected.add(nodeId);
      }
    }

    const unreachablePositions: number[] = [];
    for (const pos of positions) {
      const posId = pos.id;
      const ap = roadData.accessPoints[posId];
      const targetNodeId = ap?.connectedRoadNodeId;
      if (!targetNodeId || !reachable.has(targetNodeId)) {
        unreachablePositions.push(posId);
      }
    }

    return {
      disconnectedNodeIds: disconnected,
      unreachablePositionIds: unreachablePositions,
    };
  }, [activeRoadGraph, roadData.accessPoints, entranceNode, positions]);

  // Push undo state for road network
  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-15), roadData]);
  }, [roadData]);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const lastState = prev[prev.length - 1];
      setRoadData(lastState);
      try {
        localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(lastState));
      } catch {
        // ignore
      }
      return prev.slice(0, -1);
    });
  }, []);

  // Road Node dragging
  const handleNodeDrag = useCallback((nodeId: string, newPixel: PixelPoint) => {
    setRoadData((prev) => {
      const node = prev.nodes[nodeId];
      if (!node) return prev;
      const updatedNode: RoadNode = {
        ...node,
        pixelCoord: newPixel,
        normalizedCoord: {
          x: newPixel.x / 1280,
          y: newPixel.y / 774,
        },
      };
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: updatedNode,
        },
      };
    });
  }, []);

  // Road Node click
  const handleNodeClick = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (activeEditorTool === 'draw') {
        if (selectedNodeId && selectedNodeId !== nodeId) {
          pushUndo();
          setRoadData((prev) => {
            const edgeExists = prev.edges.some(
              (edge) =>
                (edge.from === selectedNodeId && edge.to === nodeId) ||
                (edge.from === nodeId && edge.to === selectedNodeId)
            );
            if (edgeExists) return prev;

            const fromNode = prev.nodes[selectedNodeId];
            const toNode = prev.nodes[nodeId];
            const dist = Math.hypot(
              fromNode.pixelCoord.x - toNode.pixelCoord.x,
              fromNode.pixelCoord.y - toNode.pixelCoord.y
            );
            const newEdge: RoadEdge = {
              from: selectedNodeId,
              to: nodeId,
              distancePx: Math.round(dist),
            };

            const updated = { ...prev, edges: [...prev.edges, newEdge] };
            try {
              localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
        }
        setSelectedNodeId(nodeId);
      } else if (activeEditorTool === 'connect') {
        if (!connectSourceNodeId) {
          setConnectSourceNodeId(nodeId);
        } else if (connectSourceNodeId !== nodeId) {
          pushUndo();
          setRoadData((prev) => {
            const edgeExists = prev.edges.some(
              (edge) =>
                (edge.from === connectSourceNodeId && edge.to === nodeId) ||
                (edge.from === nodeId && edge.to === connectSourceNodeId)
            );
            if (edgeExists) return prev;

            const fromNode = prev.nodes[connectSourceNodeId];
            const toNode = prev.nodes[nodeId];
            const dist = Math.hypot(
              fromNode.pixelCoord.x - toNode.pixelCoord.x,
              fromNode.pixelCoord.y - toNode.pixelCoord.y
            );
            const newEdge: RoadEdge = {
              from: connectSourceNodeId,
              to: nodeId,
              distancePx: Math.round(dist),
            };

            const updated = { ...prev, edges: [...prev.edges, newEdge] };
            try {
              localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
          setConnectSourceNodeId(null);
        }
      } else if (activeEditorTool === 'delete') {
        pushUndo();
        setRoadData((prev) => {
          const nextNodes = { ...prev.nodes };
          delete nextNodes[nodeId];
          const nextEdges = prev.edges.filter((e) => e.from !== nodeId && e.to !== nodeId);
          const nextAccess = { ...prev.accessPoints };
          for (const posId of Object.keys(nextAccess).map(Number)) {
            if (nextAccess[posId]?.connectedRoadNodeId === nodeId) {
              delete nextAccess[posId];
            }
          }
          const updated = {
            ...prev,
            nodes: nextNodes,
            edges: nextEdges,
            accessPoints: nextAccess,
          };
          try {
            localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
        if (selectedNodeId === nodeId) setSelectedNodeId(null);
        if (connectSourceNodeId === nodeId) setConnectSourceNodeId(null);
      } else if (activeEditorTool === 'select') {
        setSelectedNodeId(nodeId);
      }
    },
    [activeEditorTool, selectedNodeId, connectSourceNodeId, pushUndo]
  );

  // Road Edge click
  const handleEdgeClick = useCallback(
    (fromId: string, toId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeEditorTool === 'delete') {
        pushUndo();
        setRoadData((prev) => {
          const nextEdges = prev.edges.filter(
            (edge) =>
              !(edge.from === fromId && edge.to === toId) &&
              !(edge.from === toId && edge.to === fromId)
          );
          const updated = { ...prev, edges: nextEdges };
          try {
            localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
      }
    },
    [activeEditorTool, pushUndo]
  );

  // Building Addition Handler
  const handleAddBuilding = useCallback(
    (name: string, pixelCoord: PixelPoint) => {
      setPositions((prev) => {
        const maxId = prev.reduce((max, p) => Math.max(max, p.id), 0);
        const newId = maxId + 1;
        const nearestNode = findNearestNode(pixelCoord, activeRoadGraph);
        const newBuilding: CampusPosition = {
          id: newId,
          name: name.trim() || `Building ${newId}`,
          description: `Campus building ${newId}`,
          pixelCoord,
          normalizedCoord: {
            x: pixelCoord.x / 1280,
            y: pixelCoord.y / 774,
          },
          roadNetworkNodeId: nearestNode ? nearestNode.id : 'node_53skt',
          category: 'academic',
        };
        const updated = [...prev, newBuilding];
        try {
          localStorage.setItem(CAMPUS_POSITIONS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    [activeRoadGraph]
  );

  // Map click when road editor is active
  const handleMapClickForEditor = useCallback(
    (clickedPoint: PixelPoint) => {
      if (pendingAddBuildingName !== null) {
        handleAddBuilding(pendingAddBuildingName, clickedPoint);
        setPendingAddBuildingName(null);
        return;
      }

      if (targetAccessPositionId !== null) {
        pushUndo();
        const nearestNode = findNearestNode(clickedPoint, activeRoadGraph);
        if (nearestNode) {
          setRoadData((prev) => {
            const updated = {
              ...prev,
              accessPoints: {
                ...prev.accessPoints,
                [targetAccessPositionId]: {
                  positionId: targetAccessPositionId,
                  pixelCoord: clickedPoint,
                  normalizedCoord: {
                    x: clickedPoint.x / 1280,
                    y: clickedPoint.y / 774,
                  },
                  connectedRoadNodeId: nearestNode.id,
                },
              },
            };
            try {
              localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
          setTargetAccessPositionId(null);
        }
        return;
      }

      if (targetMovePositionId !== null) {
        setPositions((prev) => {
          const updated = prev.map((pos) => {
            if (pos.id === targetMovePositionId) {
              return {
                ...pos,
                pixelCoord: clickedPoint,
                normalizedCoord: {
                  x: clickedPoint.x / 1280,
                  y: clickedPoint.y / 774,
                },
              };
            }
            return pos;
          });
          try {
            localStorage.setItem(CAMPUS_POSITIONS_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
        setTargetMovePositionId(null);
        return;
      }

      if (activeEditorTool === 'draw') {
        pushUndo();
        const newNodeId = `node_${Date.now().toString(36).slice(-5)}`;
        const newNode: RoadNode = {
          id: newNodeId,
          pixelCoord: clickedPoint,
          normalizedCoord: {
            x: clickedPoint.x / 1280,
            y: clickedPoint.y / 774,
          },
        };

        setRoadData((prev) => {
          const nextNodes = { ...prev.nodes, [newNodeId]: newNode };
          const nextEdges = [...prev.edges];

          if (selectedNodeId && prev.nodes[selectedNodeId]) {
            const prevNode = prev.nodes[selectedNodeId];
            const dist = Math.hypot(
              prevNode.pixelCoord.x - clickedPoint.x,
              prevNode.pixelCoord.y - clickedPoint.y
            );
            nextEdges.push({
              from: selectedNodeId,
              to: newNodeId,
              distancePx: Math.round(dist),
            });
          }

          const updated = { ...prev, nodes: nextNodes, edges: nextEdges };
          try {
            localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });

        setSelectedNodeId(newNodeId);
      }
    },
    [
      pendingAddBuildingName,
      handleAddBuilding,
      targetAccessPositionId,
      targetMovePositionId,
      activeEditorTool,
      selectedNodeId,
      activeRoadGraph,
      pushUndo,
    ]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      pushUndo();
      setRoadData((prev) => {
        const nextNodes = { ...prev.nodes };
        delete nextNodes[nodeId];
        const nextEdges = prev.edges.filter((e) => e.from !== nodeId && e.to !== nodeId);
        const nextAccess = { ...prev.accessPoints };
        for (const posId of Object.keys(nextAccess).map(Number)) {
          if (nextAccess[posId]?.connectedRoadNodeId === nodeId) {
            delete nextAccess[posId];
          }
        }
        const updated = { ...prev, nodes: nextNodes, edges: nextEdges, accessPoints: nextAccess };
        try {
          localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      if (connectSourceNodeId === nodeId) setConnectSourceNodeId(null);
    },
    [selectedNodeId, connectSourceNodeId, pushUndo]
  );

  const handleSaveRoadData = useCallback(() => {
    try {
      localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(roadData));
      alert('Manual Road Network successfully saved to browser storage!');
    } catch {
      // ignore
    }
  }, [roadData]);

  const handleResetToBaseline = useCallback(() => {
    if (window.confirm('Reset road network to verified baseline? Custom changes will be overwritten.')) {
      pushUndo();
      const baseline = getDefaultRoadNetworkData();
      setRoadData(baseline);
      try {
        localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(baseline));
      } catch {
        // ignore
      }
      setSelectedNodeId(null);
      setConnectSourceNodeId(null);
    }
  }, [pushUndo]);

  const handleImportData = useCallback(
    (imported: RoadNetworkData) => {
      pushUndo();
      setRoadData(imported);
      try {
        localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(imported));
      } catch {
        // ignore
      }
    },
    [pushUndo]
  );

  const handleToggleEntranceNode = useCallback((nodeId: string) => {
    setRoadData((prev) => {
      const nextNodes: Record<string, RoadNode> = {};
      for (const [id, node] of Object.entries(prev.nodes)) {
        nextNodes[id] = {
          ...node,
          isEntrance: id === nodeId ? !node.isEntrance : false,
        };
      }
      const updated = { ...prev, nodes: nextNodes };
      try {
        localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const handleSnapAccessPointToNearestNode = useCallback(
    (posId: number) => {
      const ap = roadData.accessPoints[posId];
      if (!ap) return;
      const nearest = findNearestNode(ap.pixelCoord, activeRoadGraph);
      if (nearest) {
        pushUndo();
        setRoadData((prev) => {
          const updated = {
            ...prev,
            accessPoints: {
              ...prev.accessPoints,
              [posId]: {
                ...ap,
                connectedRoadNodeId: nearest.id,
              },
            },
          };
          try {
            localStorage.setItem(ROAD_NETWORK_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
      }
    },
    [roadData.accessPoints, activeRoadGraph, pushUndo]
  );

  // Position relocation handlers
  const handleStartMovePosition = useCallback((posId: number) => {
    setTargetMovePositionId(posId);
  }, []);

  const handlePositionDrag = useCallback((posId: number, newPt: PixelPoint) => {
    setPositions((prev) => {
      const updated = prev.map((pos) => {
        if (pos.id === posId) {
          return {
            ...pos,
            pixelCoord: newPt,
            normalizedCoord: {
              x: newPt.x / 1280,
              y: newPt.y / 774,
            },
          };
        }
        return pos;
      });
      try {
        localStorage.setItem(CAMPUS_POSITIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const handleResetPositionToDefault = useCallback((posId: number) => {
    const defaults = getDefaultCampusPositions();
    const target = defaults.find((p) => p.id === posId);
    if (!target) return;
    setPositions((prev) => {
      const updated = prev.map((pos) => (pos.id === posId ? target : pos));
      try {
        localStorage.setItem(CAMPUS_POSITIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const handleResetAllPositions = useCallback(() => {
    if (window.confirm('Reset all campus positions (1 to 10) to verified defaults?')) {
      const defaults = getDefaultCampusPositions();
      setPositions(defaults);
      try {
        localStorage.removeItem(CAMPUS_POSITIONS_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  const handleStartAddBuilding = useCallback((name: string) => {
    setPendingAddBuildingName(name);
    setTargetMovePositionId(null);
  }, []);

  const handleCancelAddBuilding = useCallback(() => {
    setPendingAddBuildingName(null);
  }, []);

  const handleUpdateBuildingName = useCallback((posId: number, name: string) => {
    setPositions((prev) => {
      const updated = prev.map((p) => (p.id === posId ? { ...p, name } : p));
      try {
        localStorage.setItem(CAMPUS_POSITIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const handleDeleteBuilding = useCallback((posId: number) => {
    if (window.confirm('Delete this building and all stages inside it?')) {
      setPositions((prev) => {
        const updated = prev.filter((p) => p.id !== posId);
        try {
          localStorage.setItem(CAMPUS_POSITIONS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      setStages((prev) => {
        const updated = prev.filter((s) => s.positionId !== posId);
        try {
          localStorage.setItem(CAMPUS_STAGES_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  }, []);

  // Stage Management Handlers
  const handleAddStage = useCallback(
    (positionId: number, stageData: { stageNumber: number; name: string; floor?: string }) => {
      setStages((prev) => {
        const newStage: Stage = {
          stageNumber: stageData.stageNumber,
          name: stageData.name.trim() || `Stage ${stageData.stageNumber}`,
          positionId,
          floor: stageData.floor?.trim() ? stageData.floor.trim() : undefined,
        };
        const exists = prev.some((s) => s.stageNumber === newStage.stageNumber);
        const updated = exists
          ? prev.map((s) => (s.stageNumber === newStage.stageNumber ? newStage : s))
          : [...prev, newStage];
        try {
          localStorage.setItem(CAMPUS_STAGES_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    []
  );

  const handleUpdateStage = useCallback(
    (
      oldStageNumber: number,
      positionId: number,
      updates: { stageNumber?: number; name?: string; floor?: string }
    ) => {
      setStages((prev) => {
        const updated = prev.map((s) => {
          if (s.stageNumber === oldStageNumber && s.positionId === positionId) {
            return {
              ...s,
              stageNumber: updates.stageNumber ?? s.stageNumber,
              name: updates.name !== undefined ? updates.name : s.name,
              floor:
                updates.floor !== undefined
                  ? updates.floor.trim()
                    ? updates.floor.trim()
                    : undefined
                  : s.floor,
            };
          }
          return s;
        });
        try {
          localStorage.setItem(CAMPUS_STAGES_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    []
  );

  const handleDeleteStage = useCallback((stageNumber: number, positionId: number) => {
    setStages((prev) => {
      const updated = prev.filter(
        (s) => !(s.stageNumber === stageNumber && s.positionId === positionId)
      );
      try {
        localStorage.setItem(CAMPUS_STAGES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const handleResetStagesToDefault = useCallback(() => {
    if (window.confirm('Reset all stages to default baseline? Custom stages will be overwritten.')) {
      const baseline = getDefaultCampusStages();
      setStages(baseline);
      try {
        localStorage.setItem(CAMPUS_STAGES_STORAGE_KEY, JSON.stringify(baseline));
      } catch {
        // ignore
      }
    }
  }, []);

  // Boundary Handlers
  const pushBoundaryUndo = useCallback(() => {
    setBoundaryUndoStack((prev) => [...prev.slice(-15), boundaryData]);
  }, [boundaryData]);

  const handleUndoBoundary = useCallback(() => {
    setBoundaryUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setBoundaryData(last);
      try {
        localStorage.setItem(CAMPUS_BOUNDARY_DATA_STORAGE_KEY, JSON.stringify(last));
      } catch {
        // ignore
      }
      return prev.slice(0, -1);
    });
  }, []);

  const handleBoundaryMapClick = useCallback(
    (clickedPoint: PixelPoint) => {
      if (boundaryTool === 'draw') {
        pushBoundaryUndo();
        const newId = `b_node_${Date.now().toString(36).slice(-4)}`;
        const newNode: BoundaryNode = { id: newId, pixelCoord: clickedPoint };

        setBoundaryData((prev) => {
          const nextNodes = { ...prev.nodes, [newId]: newNode };
          const nextEdges = [...prev.edges];

          if (selectedBoundaryNodeId && prev.nodes[selectedBoundaryNodeId]) {
            nextEdges.push({
              from: selectedBoundaryNodeId,
              to: newId,
            });
          }

          const updated: BoundaryData = {
            ...prev,
            nodes: nextNodes,
            edges: nextEdges,
          };
          try {
            localStorage.setItem(CAMPUS_BOUNDARY_DATA_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });

        setSelectedBoundaryNodeId(newId);
      }
    },
    [boundaryTool, pushBoundaryUndo, selectedBoundaryNodeId]
  );

  const handleBoundaryNodeClick = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (boundaryTool === 'draw') {
        if (selectedBoundaryNodeId && selectedBoundaryNodeId !== nodeId) {
          pushBoundaryUndo();
          setBoundaryData((prev) => {
            const updated: BoundaryData = {
              ...prev,
              edges: [...prev.edges, { from: selectedBoundaryNodeId, to: nodeId }],
            };
            try {
              localStorage.setItem(CAMPUS_BOUNDARY_DATA_STORAGE_KEY, JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
        }
        setSelectedBoundaryNodeId(nodeId);
      } else if (boundaryTool === 'connect') {
        if (!connectSourceBoundaryNodeId) {
          setConnectSourceBoundaryNodeId(nodeId);
        } else if (connectSourceBoundaryNodeId !== nodeId) {
          pushBoundaryUndo();
          setBoundaryData((prev) => {
            const updated: BoundaryData = {
              ...prev,
              edges: [...prev.edges, { from: connectSourceBoundaryNodeId, to: nodeId }],
            };
            try {
              localStorage.setItem(CAMPUS_BOUNDARY_DATA_STORAGE_KEY, JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
          setConnectSourceBoundaryNodeId(null);
        }
      } else if (boundaryTool === 'delete') {
        pushBoundaryUndo();
        setBoundaryData((prev) => {
          const nextNodes = { ...prev.nodes };
          delete nextNodes[nodeId];
          const nextEdges = prev.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId);
          const updated: BoundaryData = { ...prev, nodes: nextNodes, edges: nextEdges };
          try {
            localStorage.setItem(CAMPUS_BOUNDARY_DATA_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
        if (selectedBoundaryNodeId === nodeId) setSelectedBoundaryNodeId(null);
        if (connectSourceBoundaryNodeId === nodeId) setConnectSourceBoundaryNodeId(null);
      } else if (boundaryTool === 'move') {
        setSelectedBoundaryNodeId(nodeId);
      }
    },
    [boundaryTool, selectedBoundaryNodeId, connectSourceBoundaryNodeId, pushBoundaryUndo]
  );

  const handleBoundaryEdgeClick = useCallback(
    (fromId: string, toId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (boundaryTool === 'delete') {
        pushBoundaryUndo();
        setBoundaryData((prev) => {
          const nextEdges = prev.edges.filter(
            (edge) => !(edge.from === fromId && edge.to === toId) && !(edge.from === toId && edge.to === fromId)
          );
          const updated: BoundaryData = { ...prev, edges: nextEdges };
          try {
            localStorage.setItem(CAMPUS_BOUNDARY_DATA_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
      }
    },
    [boundaryTool, pushBoundaryUndo]
  );

  const handleBoundaryNodeDrag = useCallback((nodeId: string, newPt: PixelPoint) => {
    setBoundaryData((prev) => {
      const node = prev.nodes[nodeId];
      if (!node) return prev;
      const updated: BoundaryData = {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: { ...node, pixelCoord: newPt },
        },
      };
      return updated;
    });
  }, []);

  const handleNewBoundaryBranch = useCallback(() => {
    setSelectedBoundaryNodeId(null);
    setConnectSourceBoundaryNodeId(null);
  }, []);

  const handleCloseBoundaryLoop = useCallback(() => {
    const nodeKeys = Object.keys(boundaryData.nodes);
    if (nodeKeys.length < 3) return;
    const firstNode = nodeKeys[0];
    const lastNode = selectedBoundaryNodeId || nodeKeys[nodeKeys.length - 1];
    if (firstNode !== lastNode) {
      pushBoundaryUndo();
      setBoundaryData((prev) => {
        const updated: BoundaryData = {
          ...prev,
          edges: [...prev.edges, { from: lastNode, to: firstNode }],
        };
        try {
          localStorage.setItem(CAMPUS_BOUNDARY_DATA_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  }, [boundaryData.nodes, selectedBoundaryNodeId, pushBoundaryUndo]);

  const handleAutoConnectBoundaryPerimeter = useCallback(() => {
    const nodeKeys = Object.keys(boundaryData.nodes);
    if (nodeKeys.length < 3) return;
    pushBoundaryUndo();
    const sortedEdges = autoConnectPerimeterEdges(boundaryData.nodes);
    setBoundaryData((prev) => {
      const updated: BoundaryData = {
        ...prev,
        edges: sortedEdges,
      };
      try {
        localStorage.setItem(CAMPUS_BOUNDARY_DATA_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, [boundaryData.nodes, pushBoundaryUndo]);

  const handleClearBoundary = useCallback(() => {
    if (window.confirm('Clear all boundary nodes and edges?')) {
      pushBoundaryUndo();
      const empty: BoundaryData = { nodes: {}, edges: [], isEnforced: true };
      setBoundaryData(empty);
      try {
        localStorage.removeItem(CAMPUS_BOUNDARY_DATA_STORAGE_KEY);
      } catch {
        // ignore
      }
      setSelectedBoundaryNodeId(null);
      setConnectSourceBoundaryNodeId(null);
    }
  }, [pushBoundaryUndo]);

  const handleResetBoundaryToBaseline = useCallback(() => {
    if (window.confirm('Reset boundary to verified campus perimeter baseline?')) {
      pushBoundaryUndo();
      const baseline = getDefaultBoundaryData();
      setBoundaryData(baseline);
      try {
        localStorage.setItem(CAMPUS_BOUNDARY_DATA_STORAGE_KEY, JSON.stringify(baseline));
      } catch {
        // ignore
      }
      setSelectedBoundaryNodeId(null);
      setConnectSourceBoundaryNodeId(null);
    }
  }, [pushBoundaryUndo]);

  const handleSaveBoundary = useCallback(() => {
    try {
      localStorage.setItem(CAMPUS_BOUNDARY_DATA_STORAGE_KEY, JSON.stringify(boundaryData));
      alert('Campus boundary saved successfully to browser storage!');
    } catch {
      // ignore
    }
  }, [boundaryData]);

  const handleToggleBoundaryEnforced = useCallback(() => {
    setIsBoundaryEnforced((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(CAMPUS_BOUNDARY_ENFORCED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleToggleShowBoundaryOverlay = useCallback(() => {
    setShowBoundaryOverlay((prev) => !prev);
  }, []);

  // Handle setting starting point when clicking on the campus map image
  const handleSelectStartPoint = useCallback(
    (clickedPoint: PixelPoint) => {
      setStartPoint(clickedPoint);
      setIsCustomStart(true);
      setRoutingError(null);
      setShowOutsideGlow(false);
      setLastInvalidClick(null);
      setOutsideBoundaryToast(null);

      if (selectedStage && route) {
        const newRoute = calculateRoute(
          clickedPoint,
          selectedStage.positionId,
          undefined,
          activeRoadGraph,
          roadData.accessPoints,
          positions
        );
        setRoute(newRoute);
      }
    },
    [selectedStage, route, activeRoadGraph, roadData.accessPoints, positions]
  );

  // Handle clicking outside boundary in deep forest
  const handleOutsideBoundaryClick = useCallback((pt: PixelPoint) => {
    setLastInvalidClick(pt);
    setShowOutsideGlow(true);
    setOutsideBoundaryToast('⚠️ Outside Campus Boundary: Click inside the clear campus area.');
  }, []);

  // Reset starting point back to Campus South Entrance
  const handleResetStartToEntrance = useCallback(() => {
    setStartPoint(defaultStartPoint);
    setIsCustomStart(false);
    setRoutingError(null);
    setShowOutsideGlow(false);
    setLastInvalidClick(null);
    setOutsideBoundaryToast(null);

    if (selectedStage && route) {
      const newRoute = calculateRoute(
        defaultStartPoint,
        selectedStage.positionId,
        undefined,
        activeRoadGraph,
        roadData.accessPoints,
        positions
      );
      setRoute(newRoute);
    }
  }, [defaultStartPoint, selectedStage, route, activeRoadGraph, roadData.accessPoints, positions]);

  // Handle selecting a destination stage
  const handleSelectStage = useCallback(
    (stage: Stage) => {
      setSelectedStage(stage);
      setRoutingError(null);
      if (route) {
        const result = calculateRoute(
          startPoint,
          stage.positionId,
          undefined,
          activeRoadGraph,
          roadData.accessPoints,
          positions
        );
        if (result && result.points.length >= 2) {
          setRoute(result);
        }
      }
    },
    [route, startPoint, activeRoadGraph, roadData.accessPoints, positions]
  );

  // Clear destination
  const handleClearDestination = useCallback(() => {
    setSelectedStage(null);
    setRoute(null);
    setRoutingError(null);
  }, []);

  // Handle selecting a position marker directly on the map
  const handleSelectPositionOnMap = useCallback(
    (pos: CampusPosition) => {
      const buildingStages = getStagesByPositionId(pos.id, stages);
      const chosen: Stage =
        buildingStages.length > 0
          ? buildingStages[0]
          : {
              stageNumber: 0,
              name: formatBuildingDisplayName(pos.name),
              positionId: pos.id,
              category: pos.category || 'Building',
            };

      setSelectedStage(chosen);
      setRoutingError(null);
      if (route) {
        const result = calculateRoute(
          startPoint,
          chosen.positionId,
          undefined,
          activeRoadGraph,
          roadData.accessPoints,
          positions
        );
        if (result && result.points.length >= 2) {
          setRoute(result);
        }
      }
    },
    [stages, route, startPoint, activeRoadGraph, roadData.accessPoints, positions]
  );

  // Calculate & Draw Route when "Get Directions" is clicked
  const handleGetDirections = useCallback(() => {
    if (!selectedStage) return;

    setRoutingError(null);
    const result = calculateRoute(
      startPoint,
      selectedStage.positionId,
      undefined,
      activeRoadGraph,
      roadData.accessPoints,
      positions
    );

    if (!result || result.points.length < 2) {
      setRoutingError('Could not find a valid walkable path to this destination. Please pick another starting point.');
      setRoute(null);
      return;
    }

    setRoute(result);
  }, [startPoint, selectedStage, activeRoadGraph, roadData.accessPoints, positions]);

  // Mobile destination selection: picking a destination immediately draws the
  // walking route so the map and the drawer update from a single tap.
  const handleMobileSelectStage = useCallback(
    (stage: Stage) => {
      setSelectedStage(stage);
      setRoutingError(null);

      const result = calculateRoute(
        startPoint,
        stage.positionId,
        undefined,
        activeRoadGraph,
        roadData.accessPoints,
        positions
      );

      if (!result || result.points.length < 2) {
        setRoute(null);
        setRoutingError('Could not find a valid walkable path to this destination. Please pick another starting point.');
        return;
      }
      setRoute(result);
    },
    [startPoint, activeRoadGraph, roadData.accessPoints, positions]
  );

  // Mobile: tapping a map marker selects that building's first stage and routes to it
  const handleMobileSelectPosition = useCallback(
    (pos: CampusPosition) => {
      const buildingStages = getStagesByPositionId(pos.id, stages);
      const chosen: Stage =
        buildingStages.length > 0
          ? buildingStages[0]
          : {
              stageNumber: 0,
              name: formatBuildingDisplayName(pos.name),
              positionId: pos.id,
              category: pos.category || 'Building',
            };
      handleMobileSelectStage(chosen);
    },
    [stages, handleMobileSelectStage]
  );

  // Mobile reset: clear start, destination and route, close the drawer and
  // return the map to its initial pan/zoom.
  const handleResetNavigation = useCallback(() => {
    setStartPoint(defaultStartPoint);
    setIsCustomStart(false);
    setSelectedStage(null);
    setRoute(null);
    setRoutingError(null);
    setIsSearchModalOpen(false);
    setShowOutsideGlow(false);
    setLastInvalidClick(null);
    setOutsideBoundaryToast(null);
    setMapResetSignal((prev) => prev + 1);
  }, [defaultStartPoint]);

  // Clear route
  const handleClearRoute = useCallback(() => {
    setRoute(null);
    setRoutingError(null);
  }, []);

  const selectedPosition = selectedStage
    ? getPositionById(selectedStage.positionId, positions) || null
    : null;

  const [mapImageReady, setMapImageReady] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#7d9a62] font-sans text-slate-800">
      <WelcomeScreen imageReady={mapImageReady} />
      {/* Interactive Campus Map Viewport */}
      <main className="w-full h-full">
        <CampusMap
          selectedPosition={selectedPosition}
          selectedStageNumber={selectedStage?.stageNumber}
          onSelectPosition={isMobileViewport ? handleMobileSelectPosition : handleSelectPositionOnMap}
          resetViewSignal={mapResetSignal}
          startPoint={startPoint}
          onSelectStartPoint={handleSelectStartPoint}
          route={route}
          positions={positions}
          boundaryData={boundaryData}
          boundaryPolygonPoints={boundaryPolygonPoints}
          onOutsideBoundaryClick={handleOutsideBoundaryClick}
          lastInvalidClick={lastInvalidClick}
          outsideBoundaryToast={outsideBoundaryToast}
          showOutsideGlow={showOutsideGlow}
          onImageLoad={() => setMapImageReady(true)}
          // Road Network Editor Props
          isEditorOpen={isEditorOpen}
          activeEditorTool={activeEditorTool}
          isPreviewMode={isPreviewMode}
          roadData={roadData}
          selectedNodeId={selectedNodeId}
          connectSourceNodeId={connectSourceNodeId}
          targetAccessPositionId={targetAccessPositionId}
          entranceNodeId={entranceNode?.id ?? null}
          disconnectedNodeIds={disconnectedNodeIds}
          onSelectNode={setSelectedNodeId}
          onNodeDrag={handleNodeDrag}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onMapClickForEditor={handleMapClickForEditor}
          // Position Relocation & Adding Buildings
          targetMovePositionId={targetMovePositionId}
          onPositionDrag={handlePositionDrag}
          pendingAddBuildingName={pendingAddBuildingName}
          onCancelAddBuilding={handleCancelAddBuilding}
          // Boundary Editing
          isBoundaryEditing={isBoundaryEditing}
          boundaryTool={boundaryTool}
          selectedBoundaryNodeId={selectedBoundaryNodeId}
          connectSourceBoundaryNodeId={connectSourceBoundaryNodeId}
          onSelectBoundaryNode={setSelectedBoundaryNodeId}
          onBoundaryNodeClick={handleBoundaryNodeClick}
          onBoundaryEdgeClick={handleBoundaryEdgeClick}
          onBoundaryNodeDrag={handleBoundaryNodeDrag}
          onBoundaryMapClick={handleBoundaryMapClick}
        />
      </main>

      {/* Desktop Navigation Panel (Floating on Top-Left) */}
      <DesktopNavPanel
        startPoint={startPoint}
        isCustomStart={isCustomStart}
        onResetStartToEntrance={handleResetStartToEntrance}
        selectedStage={selectedStage}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        isSearchOpen={isSearchModalOpen}
        onCloseSearch={() => setIsSearchModalOpen(false)}
        onClearDestination={handleClearDestination}
        onGetDirections={handleGetDirections}
        route={route}
        onClearRoute={handleClearRoute}
        routingError={routingError}
        stages={stages}
        positions={positions}
        onSelectStage={handleSelectStage}
        isDevMode={isDevMode}
        onToggleEditor={() => setIsEditorOpen((prev) => !prev)}
        isEditorOpen={isEditorOpen}
        onLogoClick={handleLogoClick}
      />

      {/* Mobile compact FROM | TO search card */}
      <MobileNavHeader
        startPoint={startPoint}
        isCustomStart={isCustomStart}
        positions={positions}
        selectedStage={selectedStage}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onClearDestination={handleClearDestination}
        onResetNavigation={handleResetNavigation}
      />

      {/* Mobile contextual bottom drawer (only while a location is selected) */}
      <MobileBottomSheet
        selectedStage={selectedStage}
        selectedPosition={selectedPosition}
        stages={stages}
        onSelectStage={handleMobileSelectStage}
        route={route}
        routingError={routingError}
      />

      {/* Search Destination Modal / Sheet */}
      <DestinationSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectStage={handleMobileSelectStage}
        stages={stages}
        positions={positions}
        selectedStage={selectedStage}
      />

      {/* Developer Mode Toast Notification */}
      {devToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{devToast}</span>
          </div>
        </div>
      )}

      {/* Developer Road Network Editor Floating UI (Preserved for authorized development) */}
      {isDevMode && isEditorOpen && (
        <RoadNetworkEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        activeTool={activeEditorTool}
        onChangeTool={setActiveEditorTool}
        isPreviewMode={isPreviewMode}
        onTogglePreviewMode={() => setIsPreviewMode((prev) => !prev)}
        roadData={roadData}
        selectedNodeId={selectedNodeId}
        onNewBranch={() => {
          setSelectedNodeId(null);
          setConnectSourceNodeId(null);
        }}
        onUndo={handleUndo}
        canUndo={undoStack.length > 0}
        onDeleteSelectedNode={() => {
          if (selectedNodeId) handleDeleteNode(selectedNodeId);
        }}
        onSaveToStorage={handleSaveRoadData}
        onResetToBaseline={handleResetToBaseline}
        onImportData={handleImportData}
        targetAccessPositionId={targetAccessPositionId}
        entranceNodeId={entranceNode?.id ?? null}
        onToggleEntranceNode={handleToggleEntranceNode}
        onStartSetAccessPoint={(posId) => {
          setTargetAccessPositionId(posId);
          setActiveEditorTool('draw');
        }}
        onSnapAccessPointToNearestNode={handleSnapAccessPointToNearestNode}
        disconnectedNodeIds={disconnectedNodeIds}
        unreachablePositionIds={unreachablePositionIds}
        onTestRoute={(posId) => {
          setActiveTestPositionId(posId);
        }}
        testRouteResult={route}
        activeTestPositionId={activeTestPositionId}
        // Campus Positions & Building Management Controls
        positions={positions}
        stages={stages}
        targetMovePositionId={targetMovePositionId}
        pendingAddBuildingName={pendingAddBuildingName}
        onStartMovePosition={handleStartMovePosition}
        onUpdatePositionCoord={handlePositionDrag}
        onResetPositionToDefault={handleResetPositionToDefault}
        onResetAllPositions={handleResetAllPositions}
        onStartAddBuilding={handleStartAddBuilding}
        onCancelAddBuilding={handleCancelAddBuilding}
        onUpdateBuildingName={handleUpdateBuildingName}
        onDeleteBuilding={handleDeleteBuilding}
        onAddStage={handleAddStage}
        onUpdateStage={handleUpdateStage}
        onDeleteStage={handleDeleteStage}
        onResetStagesToDefault={handleResetStagesToDefault}
        // Campus Boundary Controls
        boundaryData={boundaryData}
        boundaryTool={boundaryTool}
        selectedBoundaryNodeId={selectedBoundaryNodeId}
        connectSourceBoundaryNodeId={connectSourceBoundaryNodeId}
        isBoundaryEnforced={isBoundaryEnforced}
        showBoundaryOverlay={showBoundaryOverlay}
        onChangeBoundaryTool={setBoundaryTool}
        onNewBoundaryBranch={handleNewBoundaryBranch}
        onCloseBoundaryLoop={handleCloseBoundaryLoop}
        onAutoConnectBoundaryPerimeter={handleAutoConnectBoundaryPerimeter}
        onToggleBoundaryEnforced={handleToggleBoundaryEnforced}
        onToggleShowBoundaryOverlay={handleToggleShowBoundaryOverlay}
        onClearBoundary={handleClearBoundary}
        onResetBoundaryToBaseline={handleResetBoundaryToBaseline}
        onUndoBoundary={handleUndoBoundary}
        canUndoBoundary={boundaryUndoStack.length > 0}
        onSaveBoundaryToStorage={handleSaveBoundary}
        onSelectBoundaryTab={setIsBoundaryEditing}
      />
      )}
    </div>
  );
};

export default App;
