import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { CampusPosition, PixelPoint, RouteResult, Stage } from '../../types/campus';
import {
  Navigation,
  X,
  Building2,
  ChevronDown,
  Footprints,
  ArrowLeftRight,
  PanelLeftOpen,
  MapPin,
  Check,
} from 'lucide-react';
import { formatBuildingDisplayName } from '../../config/campusPositions';
import { DestinationSelectorPanel } from './DestinationSelectorPanel';

interface DesktopNavPanelProps {
  startPoint: PixelPoint;
  isCustomStart: boolean;
  onResetStartToEntrance: () => void;
  selectedStage: Stage | null;
  onOpenSearch: () => void;
  isSearchOpen: boolean;
  onCloseSearch: () => void;
  onClearDestination: () => void;
  onGetDirections: () => void;
  route: RouteResult | null;
  onClearRoute: () => void;
  routingError: string | null;
  stages: Stage[];
  positions: CampusPosition[];
  onSelectStage: (stage: Stage) => void;
  // Dev mode indicators
  isDevMode?: boolean;
  onToggleEditor?: () => void;
  isEditorOpen?: boolean;
  onLogoClick?: () => void;
}

export const DesktopNavPanel: React.FC<DesktopNavPanelProps> = ({
  startPoint,
  isCustomStart,
  onResetStartToEntrance,
  selectedStage,
  onOpenSearch,
  isSearchOpen,
  onCloseSearch,
  onClearDestination,
  onGetDirections,
  route,
  onClearRoute,
  routingError,
  stages,
  positions,
  onSelectStage,
  isDevMode = false,
  onToggleEditor,
  isEditorOpen = false,
  onLogoClick,
}) => {
  const [isStartDropdownOpen, setIsStartDropdownOpen] = useState<boolean>(false);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState<boolean>(true);
  const startDropdownRef = useRef<HTMLDivElement>(null);

  // Close start dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (startDropdownRef.current && !startDropdownRef.current.contains(e.target as Node)) {
        setIsStartDropdownOpen(false);
      }
    };
    if (isStartDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStartDropdownOpen]);

  // Open the destination panel whenever a new destination is chosen
  useEffect(() => {
    if (selectedStage) setIsInfoPanelOpen(true);
  }, [selectedStage]);

  // Anchored destination dropdown geometry (kept inside the viewport)
  const destinationFieldRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number>(440);

  const updateDropdownGeometry = useCallback(() => {
    const anchor = destinationFieldRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const margin = 12;
    const preferredWidth = Math.min(440, window.innerWidth - margin * 2);
    // Keep the dropdown's left edge aligned with the input, shrinking the
    // width instead of shifting it off the input when space runs out.
    const availableWidth = window.innerWidth - margin - rect.left;
    setDropdownWidth(Math.max(320, Math.min(preferredWidth, availableWidth)));
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;
    updateDropdownGeometry();
    window.addEventListener('resize', updateDropdownGeometry);
    return () => window.removeEventListener('resize', updateDropdownGeometry);
  }, [isSearchOpen, updateDropdownGeometry]);

  // Click outside the field, its trigger or the dropdown closes it
  useEffect(() => {
    if (!isSearchOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        destinationFieldRef.current?.contains(target)
      ) {
        return;
      }
      onCloseSearch();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isSearchOpen, onCloseSearch]);

  // Current selected building
  const selectedBuilding = useMemo(() => {
    if (!selectedStage) return null;
    return positions.find((p) => p.id === selectedStage.positionId) || null;
  }, [selectedStage, positions]);

  // Stages belonging to the active building
  const buildingStages = useMemo(() => {
    if (!selectedStage) return [];
    return stages.filter((s) => s.positionId === selectedStage.positionId);
  }, [selectedStage, stages]);

  return (
    <>
      <div className="hidden md:flex flex-col items-center fixed top-3.5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto w-[min(440px,calc(100vw-32px))]">
        {/* 1. COMPACT FLOATING NAVBAR (Google Maps / Clean SaaS Style) */}
        <div className="w-full h-[38px] bg-white/95 backdrop-blur-xl rounded-[14px] shadow-[0_8px_30px_-6px_rgba(15,23,42,0.12)] border border-slate-200/80 px-1.5 py-1 flex items-center gap-1 transition-all select-none">
          
          {/* STARTING LOCATION SECTION */}
          <div className="relative flex-1 min-w-0" ref={startDropdownRef}>
            <div
              onClick={() => setIsStartDropdownOpen((prev) => !prev)}
              className="w-full h-7 flex items-center gap-1 px-1.5 rounded-md bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/70 cursor-pointer transition-all"
            >
              {/* Green Pin Icon */}
              <div
                onClick={(e) => {
                  if (onLogoClick) {
                    e.stopPropagation();
                    onLogoClick();
                  }
                }}
                className="w-4 h-4 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                title="Campus Entrance"
              >
                <MapPin className="w-2 h-2 fill-emerald-600 text-emerald-600" />
              </div>

              {/* Labels */}
              <div className="min-w-0 flex-1">
                <div className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                  Start
                </div>
                <div className="text-[9px] font-bold text-slate-800 truncate leading-snug mt-0.5">
                  {isCustomStart
                    ? `Point (${Math.round(startPoint.x)}, ${Math.round(startPoint.y)})`
                    : 'South Entrance'}
                </div>
              </div>

              {/* Chevron Icon */}
              <ChevronDown
                className={`w-2 h-2 text-slate-400 shrink-0 transition-transform duration-200 ${
                  isStartDropdownOpen ? 'rotate-180 text-slate-700' : ''
                }`}
              />
            </div>

            {/* Starting Location Quick Dropdown */}
            {isStartDropdownOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-fade-in text-xs space-y-1">
                <div className="px-2 py-0.5 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Starting Point
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onResetStartToEntrance();
                    setIsStartDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                    !isCustomStart
                      ? 'bg-blue-50 text-blue-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Campus South Entrance Gate</span>
                  </div>
                  {!isCustomStart && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>

                {isCustomStart && (
                  <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-between text-xs">
                    <span className="truncate">
                      Point ({Math.round(startPoint.x)}, {Math.round(startPoint.y)})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onResetStartToEntrance();
                        setIsStartDropdownOpen(false);
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-1.5 py-0.5 rounded"
                    >
                      Reset
                    </button>
                  </div>
                )}

                <div className="p-1.5 text-[9.5px] text-slate-400 italic border-t border-slate-100 mt-1">
                  Tip: You can also tap anywhere directly on the map to set your start.
                </div>
              </div>
            )}
          </div>

          {/* SWAP / REVERSE CONTROL */}
          <button
            type="button"
            onClick={() => {
              if (isCustomStart) {
                onResetStartToEntrance();
              }
            }}
            className="w-5 h-5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 active:scale-95 text-slate-500 flex items-center justify-center shadow-2xs transition-all shrink-0 cursor-pointer"
            title="Reset to Campus Entrance"
          >
            <ArrowLeftRight className="w-2 h-2 text-slate-500" />
          </button>

          {/* DESTINATION SECTION (anchors the dropdown on desktop) */}
          <div ref={destinationFieldRef} className="relative flex-[1.15] min-w-0">
            <div
              onClick={() => (isSearchOpen ? onCloseSearch() : onOpenSearch())}
              className={`w-full h-7 flex items-center gap-1 px-1.5 rounded-md cursor-pointer transition-all ${
              selectedStage
                ? 'bg-red-50/40 border border-red-200/70 hover:bg-red-50/60'
                : 'bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/70'
            }`}
          >
            {/* Red Pin Icon */}
            <div className="w-4 h-4 rounded bg-red-50 text-red-500 flex items-center justify-center shrink-0 shadow-2xs">
              <MapPin className="w-2 h-2 fill-red-500 text-red-500" />
            </div>

            {/* Labels */}
            <div className="min-w-0 flex-1">
              <div className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                Destination
              </div>
              <div className="text-[9.5px] font-semibold truncate leading-snug mt-0.5">
                {selectedStage ? (
                  <div className="flex items-center gap-1 truncate">
                    <span className="font-bold text-slate-900 truncate">
                      {selectedStage.name}
                    </span>
                    {selectedStage.floor && (
                      <span className="text-[7.5px] font-bold text-amber-700 shrink-0">
                        ({selectedStage.floor})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 font-normal truncate">
                    Search destination...
                  </span>
                )}
              </div>
            </div>

            {selectedStage ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearDestination();
                  onClearRoute();
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
                title="Clear destination"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <ChevronDown className="w-2 h-2 text-slate-400 shrink-0" />
            )}
            </div>

            {/* ANCHORED DESTINATION DROPDOWN — flows below the Destination field */}
            {isSearchOpen && (
              <div
                ref={dropdownRef}
                style={{
                  left: 0,
                  width: dropdownWidth,
                  maxHeight: 'min(470px, calc(100dvh - 150px))',
                }}
                className="absolute top-[calc(100%+12px)] z-50 flex flex-col overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-12px_rgba(15,23,42,0.28)] animate-fade-in"
              >
                <DestinationSelectorPanel
                  stages={stages}
                  positions={positions}
                  selectedStage={selectedStage}
                  onSelectStage={onSelectStage}
                  onClose={onCloseSearch}
                />
              </div>
            )}
          </div>

          {/* GET DIRECTIONS BUTTON (Secondary Action: Soft Lavender/Purple Pill) */}
          <button
            type="button"
            onClick={onGetDirections}
            disabled={!selectedStage}
            className={`h-7 px-2 rounded-md font-bold text-[9.5px] flex items-center gap-1 transition-all shrink-0 ${
              selectedStage
                ? 'bg-[#ede9fe] hover:bg-[#e0d9fc] active:scale-[0.98] text-[#2e2b8f] border border-indigo-100/80 shadow-2xs cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-transparent shadow-none'
            }`}
          >
            <Navigation className="w-2 h-2 fill-current rotate-45" />
            <span>{route ? 'Recalculate' : 'Directions'}</span>
          </button>

          {/* Clear Route Button (If active) */}
          {route && (
            <button
              type="button"
              onClick={onClearRoute}
              className="h-7 w-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Clear active route"
            >
              <X className="w-2 h-2" />
            </button>
          )}

          {/* Developer Mode Editor Button (If unlocked) */}
          {isDevMode && onToggleEditor && (
            <button
              type="button"
              onClick={onToggleEditor}
              className={`h-7 px-1.5 rounded-md text-[9px] font-bold transition-all shrink-0 flex items-center justify-center cursor-pointer ${
                isEditorOpen
                  ? 'bg-cyan-600 text-white shadow-2xs ring-1 ring-cyan-400'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Toggle Developer Editor"
            >
              Dev
            </button>
          )}
        </div>

        {/* ROUTING ERROR NOTICE */}
        {routingError && (
          <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-red-50/95 backdrop-blur-md border border-red-200 text-red-700 text-xs font-semibold animate-fade-in shadow-md">
            {routingError}
          </div>
        )}
      </div>

      {/* 2. LEFT DESTINATION PANEL (desktop only) */}
      {selectedStage && selectedBuilding && isInfoPanelOpen && (
        <aside className="hidden md:flex fixed left-3 top-1/2 -translate-y-1/2 z-30 w-[336px] max-h-[calc(100dvh-96px)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_20px_50px_-16px_rgba(15,23,42,0.35)] animate-fade-in">
          {/* Panel header */}
          <div className="flex shrink-0 items-start gap-2.5 border-b border-slate-100 bg-gradient-to-br from-white via-white to-slate-50/80 px-3 py-2.5">
            {selectedStage.stageNumber > 0 ? (
              <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 font-extrabold text-white shadow-2xs">
                <span className="text-[6px] uppercase leading-none tracking-wider opacity-85">
                  Stage
                </span>
                <span className="mt-0.5 text-[12px] font-black leading-none">
                  {selectedStage.stageNumber}
                </span>
              </div>
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                <Building2 className="h-4 w-4" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-[12px] font-extrabold leading-tight text-slate-900">
                  {selectedStage.name}
                </h3>
                {selectedStage.floor && (
                  <span className="shrink-0 rounded border border-amber-200/80 bg-amber-50 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-800">
                    {selectedStage.floor}
                  </span>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-medium text-slate-500">
                <Building2 className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                <span className="truncate">{formatBuildingDisplayName(selectedBuilding.name)}</span>
              </p>
              {route && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                  <Footprints className="h-2.5 w-2.5" />
                  <span>Walkway route active</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsInfoPanelOpen(false)}
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              title="Close destination panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Stages list */}
          {buildingStages.length > 0 ? (
            <>
              <div className="shrink-0 px-3 pb-1 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-slate-400">
                    Stages in {formatBuildingDisplayName(selectedBuilding.name)}
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8.5px] font-black text-slate-600">
                    {buildingStages.length}
                  </span>
                </div>
              </div>

              {/* Up to five stages fit naturally; longer lists scroll inside the panel */}
              <div
                className={`min-h-0 flex-1 space-y-0.5 overscroll-contain px-1.5 pb-2 ${
                  buildingStages.length > 5 ? 'max-h-[228px] overflow-y-auto' : ''
                }`}
              >
                {buildingStages.map((stg) => {
                  const isCurrent =
                    selectedStage.stageNumber === stg.stageNumber &&
                    selectedStage.positionId === stg.positionId;

                  return (
                    <button
                      key={`left-stage-${stg.positionId}-${stg.stageNumber}`}
                      type="button"
                      onClick={() => onSelectStage(stg)}
                      className={`group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                        isCurrent
                          ? 'bg-[#f4f2ff] ring-1 ring-inset ring-indigo-200'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${
                          isCurrent
                            ? 'bg-[#2e2b8f] text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {stg.stageNumber}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[10.5px] font-bold text-slate-900">
                          {stg.name}
                        </span>
                        {stg.floor && (
                          <span className="mt-0.5 block truncate text-[8.5px] font-bold uppercase tracking-wide text-amber-700/80">
                            {stg.floor}
                          </span>
                        )}
                      </span>
                      {isCurrent && (
                        <Check className="h-3 w-3 shrink-0 stroke-[3] text-[#2e2b8f]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="px-3 py-3 text-[10.5px] leading-relaxed text-slate-500">
              Direct building destination — this building has no individual stages.
            </div>
          )}
        </aside>
      )}

      {/* Reopen tab for the destination panel */}
      {selectedStage && selectedBuilding && !isInfoPanelOpen && (
        <button
          type="button"
          onClick={() => setIsInfoPanelOpen(true)}
          className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-30 cursor-pointer flex-col items-center gap-1 rounded-r-xl border border-l-0 border-slate-200/80 bg-white/95 px-1.5 py-2.5 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-colors hover:bg-white"
          title="Open destination panel"
        >
          <PanelLeftOpen className="h-3.5 w-3.5 text-[#2e2b8f]" />
          <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-600 [writing-mode:vertical-rl]">
            Stages
          </span>
        </button>
      )}
    </>
  );
};
