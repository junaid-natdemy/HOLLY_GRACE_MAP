import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CampusPosition, Stage } from '../../types/campus';
import {
  Search,
  X,
  Building2,
  Check,
  MapPin,
  ArrowRight,
  Layers,
  Crown,
  Bike,
  Car,
  DoorOpen,
} from 'lucide-react';
import { formatBuildingDisplayName } from '../../config/campusPositions';

interface DestinationSelectorPanelProps {
  stages: Stage[];
  positions: CampusPosition[];
  selectedStage: Stage | null;
  onSelectStage: (stage: Stage) => void;
  onClose: () => void;
}

interface FacilityCategoryDef {
  id: 'vip_parking' | 'bike_parking' | 'car_parking' | 'gate';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FACILITY_CATEGORIES: FacilityCategoryDef[] = [
  { id: 'vip_parking', label: 'VIP Parking', icon: Crown },
  { id: 'bike_parking', label: 'Bike Parking', icon: Bike },
  { id: 'car_parking', label: 'Car Parking', icon: Car },
  { id: 'gate', label: 'Gates & Exits', icon: DoorOpen },
];

/**
 * Visual styling and metadata helper for campus facilities based on category
 */
const getFacilityMeta = (category?: string) => {
  switch (category) {
    case 'vip_parking':
      return {
        icon: Crown,
        label: 'VIP Parking',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        iconBg: 'bg-amber-50 border-amber-200 text-amber-600',
        activeBg: 'bg-amber-500 text-white',
        activeRing: 'bg-amber-50/80 ring-1 ring-inset ring-amber-200',
        activeCheck: 'text-amber-600',
      };
    case 'bike_parking':
      return {
        icon: Bike,
        label: 'Bike Parking',
        badgeBg: 'bg-teal-50 text-teal-700 border-teal-200/80',
        iconBg: 'bg-teal-50 border-teal-200 text-teal-600',
        activeBg: 'bg-teal-600 text-white',
        activeRing: 'bg-teal-50/80 ring-1 ring-inset ring-teal-200',
        activeCheck: 'text-teal-600',
      };
    case 'car_parking':
      return {
        icon: Car,
        label: 'Car Parking',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
        iconBg: 'bg-blue-50 border-blue-200 text-blue-600',
        activeBg: 'bg-blue-600 text-white',
        activeRing: 'bg-blue-50/80 ring-1 ring-inset ring-blue-200',
        activeCheck: 'text-blue-600',
      };
    case 'gate':
      return {
        icon: DoorOpen,
        label: 'Gate / Exit',
        badgeBg: 'bg-orange-50 text-orange-700 border-orange-200/80',
        iconBg: 'bg-orange-50 border-orange-200 text-orange-600',
        activeBg: 'bg-orange-600 text-white',
        activeRing: 'bg-orange-50/80 ring-1 ring-inset ring-orange-200',
        activeCheck: 'text-orange-600',
      };
    case 'academic':
      return {
        icon: Building2,
        label: 'Academic Block',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        iconBg: 'bg-indigo-50 border-indigo-200 text-indigo-600',
        activeBg: 'bg-[#2e2b8f] text-white',
        activeRing: 'bg-indigo-50/80 ring-1 ring-inset ring-indigo-200',
        activeCheck: 'text-[#2e2b8f]',
      };
    default:
      return {
        icon: Building2,
        label: 'Facility',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
        iconBg: 'bg-emerald-50 border-emerald-200/70 text-emerald-700',
        activeBg: 'bg-emerald-600 text-white',
        activeRing: 'bg-emerald-50/80 ring-1 ring-inset ring-emerald-200',
        activeCheck: 'text-emerald-700',
      };
  }
};

/**
 * Single destination-selection interface shared by the anchored desktop
 * dropdown and the mobile bottom sheet.
 */
export const DestinationSelectorPanel: React.FC<DestinationSelectorPanelProps> = ({
  stages,
  positions,
  selectedStage,
  onSelectStage,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Focus the search field on mount for keyboard users
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

  // Standalone facilities that have NO assigned stages (parking, gates, etc.)
  const standaloneBuildings = useMemo(() => {
    const stagePositionIds = new Set(stages.map((s) => s.positionId));
    return positions.filter((p) => !stagePositionIds.has(p.id));
  }, [positions, stages]);

  // Buildings that have at least one stage assigned to them
  const stageBuildings = useMemo(() => {
    const counts = new Map<number, number>();
    for (const s of stages) {
      counts.set(s.positionId, (counts.get(s.positionId) || 0) + 1);
    }

    // Preferred logical order: primary academic blocks, auditoriums, then outdoor stages
    const priorityOrder = [1, 2, 5, 24, 21, 22, 25, 28, 26, 4, 3];
    const result: Array<{
      id: number;
      name: string;
      shortName: string;
      count: number;
    }> = [];

    // Add prioritized buildings first
    for (const posId of priorityOrder) {
      const pos = positionsMap.get(posId);
      const count = counts.get(posId);
      if (pos && count && count > 0) {
        result.push({
          id: pos.id,
          name: pos.name,
          shortName: pos.name.includes('·') ? pos.name.split('·')[0].trim() : pos.name,
          count,
        });
      }
    }

    // Add any remaining building with stages
    for (const [posId, count] of counts.entries()) {
      if (!priorityOrder.includes(posId)) {
        const pos = positionsMap.get(posId);
        if (pos && count > 0) {
          result.push({
            id: pos.id,
            name: pos.name,
            shortName: pos.name.includes('·') ? pos.name.split('·')[0].trim() : pos.name,
            count,
          });
        }
      }
    }

    return result;
  }, [stages, positionsMap]);

  // Counts for parking & gates categories
  const facilityCounts = useMemo(() => {
    const counts: Record<string, number> = {
      vip_parking: 0,
      bike_parking: 0,
      car_parking: 0,
      gate: 0,
    };

    for (const b of standaloneBuildings) {
      if (b.category in counts) {
        counts[b.category]++;
      }
    }

    return counts;
  }, [standaloneBuildings]);

  // Active building object if a stage-building chip is active
  const activeBuilding = useMemo(() => {
    if (activeFilter.startsWith('bld-')) {
      const bldId = parseInt(activeFilter.replace('bld-', ''), 10);
      return positionsMap.get(bldId) || null;
    }
    return null;
  }, [activeFilter, positionsMap]);

  // Filter stages according to active building / category and search term
  const filteredStages = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    let list = stages;

    if (activeFilter.startsWith('bld-')) {
      const bldId = parseInt(activeFilter.replace('bld-', ''), 10);
      list = list.filter((s) => s.positionId === bldId);
    } else if (activeFilter === 'vip_parking' || activeFilter === 'bike_parking' || activeFilter === 'car_parking' || activeFilter === 'gate') {
      // These are facility categories with 0 stages
      list = [];
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
  }, [searchQuery, activeFilter, stages, positionsMap]);

  // Filter standalone facilities according to active filter and search term
  const filteredBuildings = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    let list = standaloneBuildings;

    if (activeFilter.startsWith('bld-')) {
      // Stage building is active -> hide standalone facilities
      list = [];
    } else if (activeFilter === 'vip_parking') {
      list = list.filter((b) => b.category === 'vip_parking');
    } else if (activeFilter === 'bike_parking') {
      list = list.filter((b) => b.category === 'bike_parking');
    } else if (activeFilter === 'car_parking') {
      list = list.filter((b) => b.category === 'car_parking');
    } else if (activeFilter === 'gate') {
      list = list.filter((b) => b.category === 'gate');
    }

    if (trimmed) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(trimmed) ||
          b.description.toLowerCase().includes(trimmed) ||
          (b.category && b.category.toLowerCase().includes(trimmed))
      );
    }

    return list;
  }, [searchQuery, activeFilter, standaloneBuildings]);

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
            {totalDestinationsCount} campus destinations &amp; facilities
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
            placeholder="Search stage, building, parking or gate..."
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

      {/* 3. FIXED HORIZONTALLY SCROLLING CATEGORY & BUILDING FILTER BAR */}
      <div className="flex h-[44px] shrink-0 items-center bg-white px-3">
        <div className="scrollbar-none flex w-full items-center gap-1.5 overflow-x-auto py-1">
          {/* ALL DESTINATIONS CHIP */}
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            aria-pressed={activeFilter === 'all'}
            className={`inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11px] font-semibold transition-all select-none ${
              activeFilter === 'all'
                ? 'bg-[#2e2b8f] text-white shadow-2xs ring-1 ring-[#2e2b8f]'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Layers
              className={`h-3.5 w-3.5 shrink-0 ${
                activeFilter === 'all' ? 'text-white' : 'text-slate-400'
              }`}
            />
            <span>All</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[9.5px] font-bold leading-tight ${
                activeFilter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {totalDestinationsCount}
            </span>
          </button>

          {/* STAGE-AVAILABLE BUILDINGS CHIPS (e.g. Ephatha, Silver Jubilee, College Block...) */}
          {stageBuildings.map((bld) => {
            const chipKey = `bld-${bld.id}`;
            const isActive = activeFilter === chipKey;

            return (
              <button
                key={`filter-${chipKey}`}
                type="button"
                onClick={() => setActiveFilter(isActive ? 'all' : chipKey)}
                aria-pressed={isActive}
                className={`inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11px] font-semibold transition-all select-none ${
                  isActive
                    ? 'bg-[#2e2b8f] text-white shadow-2xs ring-1 ring-[#2e2b8f]'
                    : 'border border-indigo-200/80 bg-indigo-50/50 text-indigo-950 hover:bg-indigo-100/60 hover:border-indigo-300'
                }`}
              >
                <Building2
                  className={`h-3.5 w-3.5 shrink-0 ${
                    isActive ? 'text-white' : 'text-indigo-600'
                  }`}
                />
                <span>{bld.shortName}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9.5px] font-bold leading-tight ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {bld.count}
                </span>
              </button>
            );
          })}

          {/* SUBTLE DIVIDER */}
          <div className="h-4 w-px bg-slate-200 shrink-0 mx-0.5" />

          {/* PARKING & GATES CATEGORY CHIPS */}
          {FACILITY_CATEGORIES.map((cat) => {
            const isActive = activeFilter === cat.id;
            const count = facilityCounts[cat.id] ?? 0;
            const CatIcon = cat.icon;

            return (
              <button
                key={`filter-${cat.id}`}
                type="button"
                onClick={() => setActiveFilter(isActive ? 'all' : cat.id)}
                aria-pressed={isActive}
                className={`inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11px] font-semibold transition-all select-none ${
                  isActive
                    ? 'bg-[#2e2b8f] text-white shadow-2xs ring-1 ring-[#2e2b8f]'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CatIcon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9.5px] font-bold leading-tight ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
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
              {activeFilter !== 'all'
                ? 'No matching locations in this filter'
                : 'Try searching for a stage number or building name'}
            </p>
            {activeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
                className="mt-3 cursor-pointer rounded-lg bg-[#2e2b8f] px-3 py-1.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
              >
                View All Destinations
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* STAGES SECTION */}
            {filteredStages.length > 0 && (
              <>
                <div className="px-2 pb-1 pt-1.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  {activeBuilding
                    ? `${formatBuildingDisplayName(activeBuilding.name)} · Stages (${filteredStages.length})`
                    : `Competition & Event Stages (${filteredStages.length})`}
                </div>
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
                        {stage.stageNumber > 0 ? (
                          <>
                            <span className="text-[7px] font-black uppercase leading-none tracking-[0.08em] opacity-70">
                              Stage
                            </span>
                            <span className="mt-0.5 text-[13px] font-black leading-none">
                              {stage.stageNumber}
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] font-black uppercase leading-none">
                            MAIN
                          </span>
                        )}
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
              </>
            )}

            {/* CAMPUS FACILITIES, PARKING & GATES SECTION */}
            {filteredBuildings.length > 0 && (
              <div className="pt-1.5">
                <div className="px-2 pb-1 pt-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  {activeFilter === 'vip_parking'
                    ? `VIP Parking Areas (${filteredBuildings.length})`
                    : activeFilter === 'bike_parking'
                    ? `Bike Parking Zones (${filteredBuildings.length})`
                    : activeFilter === 'car_parking'
                    ? `Car Parking Areas (${filteredBuildings.length})`
                    : activeFilter === 'gate'
                    ? `Campus Gates & Exits (${filteredBuildings.length})`
                    : `Campus Facilities & Parking (${filteredBuildings.length})`}
                </div>
                {filteredBuildings.map((building) => {
                  const isCurrent =
                    selectedStage?.stageNumber === 0 &&
                    selectedStage?.positionId === building.id;
                  const cleanName = formatBuildingDisplayName(building.name);
                  const meta = getFacilityMeta(building.category);
                  const FacilityIcon = meta.icon;

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
                          ? meta.activeRing
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${
                          isCurrent
                            ? meta.activeBg
                            : `border ${meta.iconBg}`
                        }`}
                      >
                        <FacilityIcon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-bold leading-snug text-slate-900">
                          {cleanName}
                        </div>
                        <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-1">
                          {building.description &&
                            !/^campus building \d+$/i.test(building.description.trim()) && (
                              <span className="whitespace-nowrap text-[10.5px] font-medium leading-none text-slate-500">
                                {building.description}
                              </span>
                            )}
                          <span
                            className={`whitespace-nowrap rounded border px-1.5 py-[2px] text-[9.5px] font-bold uppercase leading-none ${meta.badgeBg}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex w-4 shrink-0 items-center justify-center ${
                          isCurrent
                            ? meta.activeCheck
                            : 'text-slate-300 transition-colors group-hover:text-slate-600'
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
