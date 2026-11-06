import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CampusPosition, Stage } from '../../types/campus';
import { ChevronDown, ChevronUp, Building2, Check, MapPin } from 'lucide-react';
import { formatBuildingDisplayName } from '../../config/campusPositions';

interface MobileBottomSheetProps {
  selectedStage: Stage | null;
  selectedPosition: CampusPosition | null;
  stages: Stage[];
  onSelectStage: (stage: Stage) => void;
  routingError?: string | null;
}

/**
 * Contextual mobile information drawer.
 *
 * It only exists while a location is selected: collapsed it names the building,
 * the chosen stage and its position, and dragging it up reveals every stage in
 * that building so another one can be picked without leaving the map.
 */
export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  selectedStage,
  selectedPosition,
  stages,
  onSelectStage,
  routingError = null,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const isExpandedRef = useRef<boolean>(isExpanded);
  isExpandedRef.current = isExpanded;

  const hasSelection = Boolean(selectedStage && selectedPosition);

  // Publish the drawer height so the map can end exactly above it (0 when the
  // drawer is hidden). Kept at the collapsed height while expanded so the map
  // never rescales mid-gesture.
  useEffect(() => {
    if (!hasSelection) {
      document.documentElement.style.setProperty('--mobile-sheet-h', '0px');
      return;
    }

    const el = sheetRef.current;
    if (!el) return;

    const sync = () => {
      if (isExpandedRef.current) return;
      const h = Math.min(el.getBoundingClientRect().height, 170);
      document.documentElement.style.setProperty('--mobile-sheet-h', `${Math.round(h)}px`);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasSelection, selectedStage, isExpanded]);

  // Collapse whenever the selection is cleared so the next one starts compact.
  useEffect(() => {
    if (!hasSelection) setIsExpanded(false);
  }, [hasSelection]);

  const buildingStages = useMemo(() => {
    if (!selectedPosition) return [];
    return stages.filter((s) => s.positionId === selectedPosition.id);
  }, [stages, selectedPosition]);

  const floors = useMemo(() => {
    const unique: string[] = [];
    for (const stage of buildingStages) {
      const floor = stage.floor?.trim();
      if (floor && !unique.includes(floor)) unique.push(floor);
    }
    return unique;
  }, [buildingStages]);

  if (!selectedStage || !selectedPosition) return null;

  const buildingName = formatBuildingDisplayName(selectedPosition.name);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const diff = startYRef.current - e.changedTouches[0].clientY;
    if (diff > 30) setIsExpanded(true);
    else if (diff < -30) setIsExpanded(false);
  };

  return (
    <div
      ref={sheetRef}
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-3xl border-t border-slate-200/90 bg-white/98 shadow-[0_-10px_36px_-8px_rgba(15,23,42,0.35)] backdrop-blur-2xl transition-[height] duration-300 ease-out pointer-events-auto ${
        isExpanded ? 'h-[62vh]' : 'h-auto'
      }`}
    >
      {/* Drag handle */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full shrink-0 cursor-pointer select-none justify-center pb-1.5 pt-2.5"
      >
        <div className="h-1 w-9 rounded-full bg-slate-300" />
      </div>

      {/* COLLAPSED: building, stage, position (whole row opens the drawer) */}
      {!isExpanded && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Show building stages"
          onClick={() => setIsExpanded(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(true);
            }
          }}
          className="flex cursor-pointer items-center gap-2.5 px-3.5 pb-3.5 pt-0.5 active:bg-slate-50"
        >
          {selectedStage.stageNumber > 0 ? (
            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-500/25">
              <span className="text-[7px] font-bold uppercase leading-none tracking-wider opacity-85">
                Stage
              </span>
              <span className="mt-0.5 text-[13px] font-black leading-none">
                {selectedStage.stageNumber}
              </span>
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/25">
              <Building2 className="h-4.5 w-4.5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="truncate text-[12px] font-extrabold leading-tight text-slate-900">
                {buildingName}
              </h4>
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-[1px] text-[8.5px] font-bold uppercase tracking-wide text-slate-500">
                Pos {selectedPosition.id}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
              {selectedStage.stageNumber > 0
                ? selectedStage.name.trim()
                : selectedPosition.description}
            </p>
          </div>

          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <ChevronUp className="h-4 w-4" />
          </span>
        </div>
      )}

      {!isExpanded && routingError && (
        <p className="-mt-1.5 px-3.5 pb-2.5 text-[10px] font-semibold leading-snug text-red-600">
          {routingError}
        </p>
      )}

      {/* EXPANDED: building information and every stage inside it */}
      {isExpanded && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden animate-fade-in">
          <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 px-4 pb-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 shrink-0 text-blue-600" />
                <h3 className="truncate text-[13px] font-extrabold text-slate-900">{buildingName}</h3>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-slate-500">
                {selectedPosition.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="Collapse drawer"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 active:bg-slate-200"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Compact building meta */}
          <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-100 px-4 py-2">
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
              Pos {selectedPosition.id}
            </span>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
              {buildingStages.length} {buildingStages.length === 1 ? 'stage' : 'stages'}
            </span>
            {floors.length > 0 && (
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                {floors.length} {floors.length === 1 ? 'floor' : 'floors'}
              </span>
            )}
          </div>

          {floors.length > 0 && (
            <div className="scrollbar-none flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-slate-100 px-4 py-2">
              {floors.map((floor) => (
                <span
                  key={`floor-${floor}`}
                  className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[9.5px] font-semibold text-slate-600"
                >
                  {floor}
                </span>
              ))}
            </div>
          )}

          <div className="flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-3 pb-4 pt-2">
            {buildingStages.length === 0 ? (
              <div className="py-8 text-center">
                <Building2 className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-[11.5px] font-semibold text-slate-600">
                  Direct campus landmark
                </p>
                <p className="mx-auto mt-0.5 max-w-[240px] text-[10.5px] leading-snug text-slate-400">
                  This location is a single standalone destination without separate stage rooms.
                </p>
              </div>
            ) : (
              buildingStages.map((stage) => {
                const isSelected =
                  selectedStage.stageNumber === stage.stageNumber &&
                  selectedStage.positionId === stage.positionId;

                return (
                  <button
                    key={`drawer-stage-${stage.positionId}-${stage.stageNumber}`}
                    type="button"
                    onClick={() => {
                      onSelectStage(stage);
                      setIsExpanded(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50/80 ring-1 ring-blue-500/20'
                        : 'border-slate-200/80 bg-white active:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg font-extrabold ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span className="text-[6.5px] font-bold uppercase leading-none tracking-wider opacity-80">
                        Stg
                      </span>
                      <span className="text-[11px] font-black leading-none">{stage.stageNumber}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11.5px] font-bold leading-tight text-slate-900">
                        {stage.name.trim()}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <MapPin className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                        <span className="truncate text-[10px] font-medium text-slate-500">
                          {stage.floor?.trim() || 'Main ground level'}
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-bold text-blue-600">Select</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
