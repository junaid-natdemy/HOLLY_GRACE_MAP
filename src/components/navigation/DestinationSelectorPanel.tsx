import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CampusPosition, Stage } from '../../types/campus';
import {
  Search,
  X,
  Building2,
  Check,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { formatBuildingDisplayName } from '../../config/campusPositions';

interface DestinationSelectorPanelProps {
  stages: Stage[];
  positions: CampusPosition[];
  selectedStage: Stage | null;
  onSelectStage: (stage: Stage) => void;
  onClose: () => void;
}

/**
 * Single destination-selection interface shared by the anchored desktop
 * dropdown and the mobile bottom sheet. The host container owns sizing and
 * positioning; this panel owns only the header, search, filters, results
 * and footer sections.
 */
export const DestinationSelectorPanel: React.FC<DestinationSelectorPanelProps> = ({
  stages,
  positions,
  selectedStage,
  onSelectStage,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBuildingId, setActiveBuildingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Focus the search field on mount for keyboard users. On touch screens the
  // keyboard would cover the list and the first tap would only dismiss it,
  // so the chosen destination never registers.
  useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (coarsePointer || window.innerWidth < 768) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, []);

  // Escape closes the dropdown without a backdrop
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const positionsMap = useMemo(() => {
    const map = new Map<number, CampusPosition>();
    for (const pos of positions) map.set(pos.id, pos);
    return map;
  }, [positions]);

  // Buildings without assigned stages remain selectable as destinations
  const standaloneBuildings = useMemo(() => {
    const stagePositionIds = new Set(stages.map((s) => s.positionId));
    return positions.filter((p) => !stagePositionIds.has(p.id));
  }, [positions, stages]);

  const filteredStages = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    let list = stages;

    if (activeBuildingId !== null) {
      list = list.filter((s) => s.positionId === activeBuildingId);
    }

    if (trimmed) {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && String(num) === trimmed) {
        list = list.filter((s) => s.stageNumber === num);
      } else {
        list = list.filter((s) => {
          const pos = positionsMap.get(s.positionId);
          const stageNameMatch = s.name.toLowerCase().includes(trimmed);
          const stageNumMatch = `stage ${s.stageNumber}`.toLowerCase().includes(trimmed);
          const categoryMatch = s.category ? s.category.toLowerCase().includes(trimmed) : false;
          const floorMatch = s.floor ? s.floor.toLowerCase().includes(trimmed) : false;
          const buildingNameMatch = pos ? pos.name.toLowerCase().includes(trimmed) : false;
          return stageNameMatch || stageNumMatch || categoryMatch || floorMatch || buildingNameMatch;
        });
      }
    }

    return list;
  }, [searchQuery, activeBuildingId, stages, positionsMap]);

  const filteredBuildings = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    let list = standaloneBuildings;

    if (activeBuildingId !== null) {
      list = list.filter((b) => b.id === activeBuildingId);
    }

    if (trimmed) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(trimmed) ||
          b.description.toLowerCase().includes(trimmed)
      );
    }

    return list;
  }, [searchQuery, activeBuildingId, standaloneBuildings]);

  const totalDestinationsCount = stages.length + standaloneBuildings.length;
  const currentResultsCount = filteredStages.length + filteredBuildings.length;

  return (
    <div ref={rootRef} className="flex h-full min-h-0 flex-col bg-white text-slate-800">
      {/* 1. FIXED HEADER */}
      <div className="flex h-[50px] shrink-0 items-center gap-2 border-b border-slate-100 px-3.5 bg-white">
        <MapPin className="h-4 w-4 shrink-0 text-[#2e2b8f]" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-extrabold leading-none tracking-tight text-slate-900">
            Select Destination
          </h3>
          <p className="mt-1 text-[10px] font-medium leading-none text-slate-400">
            {totalDestinationsCount} campus destinations
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close destination selector"
          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 2. FIXED SEARCH FIELD */}
      <div className="shrink-0 px-3 pt-2.5 bg-white">
        <div className="relative flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50/90 transition-all focus-within:border-[#2e2b8f] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2e2b8f]/12">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stage, building or floor..."
            className="h-full w-full bg-transparent pl-9 pr-9 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-2.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. FIXED HORIZONTALLY SCROLLING FILTER BAR */}
      <div className="flex h-[42px] shrink-0 items-center bg-white px-3">
        <div className="scrollbar-none flex w-full items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveBuildingId(null)}
            aria-pressed={activeBuildingId === null}
            className={`h-7 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3 text-[11px] font-bold transition-colors ${
              activeBuildingId === null
                ? 'bg-[#2e2b8f] text-white shadow-2xs'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Destinations
          </button>

          {positions.map((pos) => {
            const isActive = activeBuildingId === pos.id;
            return (
              <button
                key={`destination-filter-${pos.id}`}
                type="button"
                onClick={() => setActiveBuildingId(isActive ? null : pos.id)}
                aria-pressed={isActive}
                className={`h-7 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#2e2b8f] text-white shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {formatBuildingDisplayName(pos.name)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. INDEPENDENTLY SCROLLABLE RESULTS */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 pb-1.5 pt-0.5">
        {currentResultsCount === 0 ? (
          <div className="flex flex-col items-center justify-center px-3 py-10 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs font-bold text-slate-800">No destinations found</p>
            <p className="mt-0.5 text-[10.5px] text-slate-400">
              Try searching for &ldquo;1&rdquo; or &ldquo;CBSE&rdquo;
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredStages.map((stage) => {
              const isCurrent =
                selectedStage?.stageNumber === stage.stageNumber &&
                selectedStage?.positionId === stage.positionId;
              const buildingName = positionsMap.get(stage.positionId)
                ? formatBuildingDisplayName(positionsMap.get(stage.positionId)!.name)
                : 'Campus Building';

              return (
                <button
                  key={`destination-stage-${stage.positionId}-${stage.stageNumber}`}
                  type="button"
                  onClick={() => {
                    onSelectStage(stage);
                    onClose();
                  }}
                  className={`group flex min-h-[56px] w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors ${
                    isCurrent
                      ? 'bg-[#f4f2ff] ring-1 ring-inset ring-indigo-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Stage number badge */}
                  <div
                    className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[10px] font-extrabold ${
                      isCurrent
                        ? 'bg-[#2e2b8f] text-white'
                        : 'bg-[#ede9fe] text-[#2e2b8f]'
                    }`}
                  >
                    <span className="text-[7px] font-black uppercase leading-none tracking-[0.08em] opacity-70">
                      Stage
                    </span>
                    <span className="mt-0.5 text-[13px] font-black leading-none">
                      {stage.stageNumber}
                    </span>
                  </div>

                  {/* Details: title, building, floor */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-bold leading-snug text-slate-900">
                      {stage.name.trim()}
                    </div>
                    <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="whitespace-nowrap text-[10.5px] font-medium leading-none text-slate-500">
                        {buildingName}
                      </span>
                      {stage.floor && (
                        <span className="whitespace-nowrap rounded border border-[#ffedd5] bg-[#fff7ed] px-1.5 py-[2px] text-[9.5px] font-bold uppercase leading-none text-[#c2410c]">
                          {stage.floor}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selection indicator */}
                  <div
                    className={`flex w-4 shrink-0 items-center justify-center ${
                      isCurrent
                        ? 'text-[#2e2b8f]'
                        : 'text-slate-300 transition-colors group-hover:text-[#2e2b8f]'
                    }`}
                  >
                    {isCurrent ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </div>
                </button>
              );
            })}

            {filteredBuildings.length > 0 && (
              <div className="pt-1.5">
                <div className="px-2 pb-1 pt-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Campus Facilities &amp; Landmarks
                </div>
                {filteredBuildings.map((building) => {
                  const isCurrent =
                    selectedStage?.stageNumber === 0 &&
                    selectedStage?.positionId === building.id;
                  const cleanName = formatBuildingDisplayName(building.name);

                  return (
                    <button
                      key={`destination-building-${building.id}`}
                      type="button"
                      onClick={() => {
                        onSelectStage({
                          stageNumber: 0,
                          name: cleanName,
                          positionId: building.id,
                          category: building.category || 'Building',
                        });
                        onClose();
                      }}
                      className={`group flex min-h-[56px] w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors ${
                        isCurrent
                          ? 'bg-emerald-50/80 ring-1 ring-inset ring-emerald-200'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${
                          isCurrent
                            ? 'bg-emerald-600 text-white'
                            : 'border border-emerald-200/70 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <Building2 className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-bold leading-snug text-slate-900">
                          {cleanName}
                        </div>
                        <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="whitespace-nowrap text-[10.5px] font-medium leading-none text-slate-500">
                            {building.description}
                          </span>
                          <span className="whitespace-nowrap rounded border border-emerald-200/70 bg-emerald-50 px-1.5 py-[2px] text-[9.5px] font-bold uppercase leading-none text-emerald-700">
                            Facility
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex w-4 shrink-0 items-center justify-center ${
                          isCurrent
                            ? 'text-emerald-700'
                            : 'text-slate-300 transition-colors group-hover:text-emerald-700'
                        }`}
                      >
                        {isCurrent ? (
                          <Check className="h-4 w-4 stroke-[3]" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. FIXED FOOTER */}
      <div className="flex h-[32px] shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/70 px-3.5 text-[10px] font-medium text-slate-400">
        <span>
          Showing {currentResultsCount} of {totalDestinationsCount}
        </span>
        <span>Holly Grace Campus</span>
      </div>
    </div>
  );
};
