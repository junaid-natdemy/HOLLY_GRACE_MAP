import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CAMPUS_POSITIONS, getPositionById, formatBuildingDisplayName } from '../../config/campusPositions';
import { CAMPUS_STAGES } from '../../config/stageMapping';
import { CampusPosition, Stage } from '../../types/campus';
import {
  Search,
  ChevronDown,
  X,
  MapPin,
  Check,
  Building2,
  Layers,
  Crown,
  Bike,
  Car,
  DoorOpen,
} from 'lucide-react';

interface DestinationDropdownProps {
  selectedStage: Stage | null;
  onSelectStage: (stage: Stage) => void;
  stages?: Stage[];
  positions?: CampusPosition[];
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

const getFacilityMeta = (category?: string) => {
  switch (category) {
    case 'vip_parking':
      return {
        icon: Crown,
        label: 'VIP Parking',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        iconBg: 'bg-amber-100 text-amber-800',
        activeBg: 'bg-amber-500 text-white',
        activeCheck: 'text-amber-600',
      };
    case 'bike_parking':
      return {
        icon: Bike,
        label: 'Bike Parking',
        badgeBg: 'bg-teal-50 text-teal-700 border-teal-200/80',
        iconBg: 'bg-teal-100 text-teal-800',
        activeBg: 'bg-teal-600 text-white',
        activeCheck: 'text-teal-600',
      };
    case 'car_parking':
      return {
        icon: Car,
        label: 'Car Parking',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
        iconBg: 'bg-blue-100 text-blue-800',
        activeBg: 'bg-blue-600 text-white',
        activeCheck: 'text-blue-600',
      };
    case 'gate':
      return {
        icon: DoorOpen,
        label: 'Gate / Exit',
        badgeBg: 'bg-orange-50 text-orange-700 border-orange-200/80',
        iconBg: 'bg-orange-100 text-orange-800',
        activeBg: 'bg-orange-600 text-white',
        activeCheck: 'text-orange-600',
      };
    case 'academic':
      return {
        icon: Building2,
        label: 'Academic Block',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        iconBg: 'bg-indigo-100 text-indigo-800',
        activeBg: 'bg-[#2e2b8f] text-white',
        activeCheck: 'text-[#2e2b8f]',
      };
    default:
      return {
        icon: Building2,
        label: 'Facility',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
        iconBg: 'bg-emerald-100 text-emerald-800',
        activeBg: 'bg-emerald-600 text-white',
        activeCheck: 'text-emerald-600',
      };
  }
};

export const DestinationDropdown: React.FC<DestinationDropdownProps> = ({
  selectedStage,
  onSelectStage,
  stages = CAMPUS_STAGES,
  positions = CAMPUS_POSITIONS,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setActiveFilter('all');
    }
  }, [isOpen]);

  // Positions map lookup
  const positionsMap = useMemo(() => {
    const map = new Map<number, CampusPosition>();
    for (const pos of positions) {
      map.set(pos.id, pos);
    }
    return map;
  }, [positions]);

  // Buildings that have NO stages (standalone landmarks)
  const standaloneBuildings = useMemo(() => {
    const stagePosIds = new Set(stages.map((s) => s.positionId));
    return positions.filter((p) => !stagePosIds.has(p.id));
  }, [positions, stages]);

  // Buildings with assigned stages
  const stageBuildings = useMemo(() => {
    const counts = new Map<number, number>();
    for (const s of stages) {
      counts.set(s.positionId, (counts.get(s.positionId) || 0) + 1);
    }

    const priorityOrder = [1, 2, 5, 24, 21, 22, 25, 28, 26, 4, 3];
    const result: Array<{
      id: number;
      name: string;
      shortName: string;
      count: number;
    }> = [];

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

  const filteredStages = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    let list = stages;

    if (activeFilter.startsWith('bld-')) {
      const bldId = parseInt(activeFilter.replace('bld-', ''), 10);
      list = list.filter((s) => s.positionId === bldId);
    } else if (activeFilter === 'vip_parking' || activeFilter === 'bike_parking' || activeFilter === 'car_parking' || activeFilter === 'gate') {
      list = [];
    }

    if (trimmed) {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && String(num) === trimmed) {
        list = list.filter((s) => s.stageNumber === num);
      } else {
        const tokens = trimmed.split(/\s+/);
        list = list.filter((s) => {
          const pos = positionsMap.get(s.positionId);
          const combined = `${s.name} ${pos ? pos.name : ''} ${s.floor || ''} ${s.category || ''} ${(s.tags || []).join(' ')}`.toLowerCase();
          const stageNumMatch = s.stageNumber > 0 && `stage ${s.stageNumber}`.toLowerCase().includes(trimmed);
          const tokensMatch = tokens.every((token) => combined.includes(token));
          return stageNumMatch || tokensMatch;
        });
      }
    }

    return list;
  }, [searchQuery, activeFilter, stages, positionsMap]);

  // Filtered standalone buildings for search
  const filteredBuildings = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    let list = standaloneBuildings;

    if (activeFilter.startsWith('bld-')) {
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

  const selectedPosition = selectedStage
    ? positionsMap.get(selectedStage.positionId) || getPositionById(selectedStage.positionId, positions)
    : null;

  const isBuildingOnly = selectedStage && selectedStage.stageNumber === 0;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
          isOpen
            ? 'border-blue-500 bg-white ring-2 ring-blue-500/20 shadow-md'
            : selectedStage
            ? 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
            : 'border-slate-200/90 bg-slate-50/80 hover:bg-slate-100/80 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedStage ? (
            <>
              {isBuildingOnly ? (
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold shrink-0 shadow-sm">
                  <Building2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#2e2b8f] text-white flex flex-col items-center justify-center font-extrabold shrink-0 shadow-sm">
                  <span className="text-[7px] uppercase tracking-wider opacity-80 leading-none">S</span>
                  <span className="text-xs leading-none">{selectedStage.stageNumber}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {selectedStage.name}
                  </p>
                  {selectedStage.floor && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-semibold shrink-0">
                      {selectedStage.floor}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-[#2e2b8f] shrink-0" />
                  <span>
                    {selectedPosition?.name ? formatBuildingDisplayName(selectedPosition.name) : 'Campus Building'}
                  </span>
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Choose destination stage or building...</span>
            </div>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ml-1.5 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col animate-fade-in max-h-80 sm:max-h-96">
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-100 space-y-2 bg-slate-50/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stage, floor, or building name..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter chips (All + Stage Buildings + Facilities) */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-[#2e2b8f] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers className={`w-3 h-3 ${activeFilter === 'all' ? 'text-white' : 'text-slate-400'}`} />
                <span>All</span>
                <span
                  className={`text-[9px] px-1 rounded-full font-bold ${
                    activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {stages.length + standaloneBuildings.length}
                </span>
              </button>

              {/* Stage buildings */}
              {stageBuildings.map((bld) => {
                const chipKey = `bld-${bld.id}`;
                const isSelected = activeFilter === chipKey;
                return (
                  <button
                    key={`dropdown-bld-${bld.id}`}
                    type="button"
                    onClick={() => setActiveFilter(isSelected ? 'all' : chipKey)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-[#2e2b8f] text-white shadow-2xs'
                        : 'bg-indigo-50 border border-indigo-200 text-indigo-950 hover:bg-indigo-100'
                    }`}
                  >
                    <Building2 className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                    <span>{bld.shortName}</span>
                    <span
                      className={`text-[9px] px-1 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {bld.count}
                    </span>
                  </button>
                );
              })}

              <div className="h-3 w-px bg-slate-200 shrink-0 mx-0.5" />

              {/* Facilities */}
              {FACILITY_CATEGORIES.map((cat) => {
                const isSelected = activeFilter === cat.id;
                const count = facilityCounts[cat.id] ?? 0;
                const CatIcon = cat.icon;

                return (
                  <button
                    key={`dropdown-cat-${cat.id}`}
                    type="button"
                    onClick={() => setActiveFilter(isSelected ? 'all' : cat.id)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-[#2e2b8f] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CatIcon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span>{cat.label}</span>
                    <span
                      className={`text-[9px] px-1 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destination Items List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredStages.length === 0 && filteredBuildings.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching stages or buildings found
              </div>
            ) : (
              <>
                {/* 1. Stages List */}
                {filteredStages.map((stage) => {
                  const isCurrent =
                    selectedStage?.stageNumber === stage.stageNumber &&
                    selectedStage?.positionId === stage.positionId;
                  const pos = positionsMap.get(stage.positionId);
                  const isGreenRoom =
                    stage.category === 'green_room' ||
                    stage.name.toLowerCase().includes('green room');

                  return (
                    <button
                      key={`stage-opt-${stage.positionId}-${stage.stageNumber}`}
                      type="button"
                      onClick={() => {
                        onSelectStage(stage);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 text-left transition-colors ${
                        isCurrent
                          ? 'bg-blue-50/80 text-blue-900 font-bold'
                          : isGreenRoom
                          ? 'hover:bg-emerald-50/60 text-slate-800'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCurrent
                              ? isGreenRoom
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#2e2b8f] text-white'
                              : isGreenRoom
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-[#ede9fe] text-[#2e2b8f]'
                          }`}
                        >
                          {stage.stageNumber > 0 ? (
                            stage.stageNumber
                          ) : isGreenRoom ? (
                            <span className="text-[10px] font-black">GR</span>
                          ) : (
                            '★'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold truncate leading-tight">
                              {stage.name}
                            </span>
                            {isGreenRoom && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8.5px] font-bold uppercase shrink-0">
                                Dressing / Green Room
                              </span>
                            )}
                            {stage.floor && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200/80 text-[9px] font-semibold shrink-0">
                                {stage.floor}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate leading-tight mt-0.5 flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{pos?.name ? formatBuildingDisplayName(pos.name) : 'Campus Building'}</span>
                          </div>
                        </div>
                      </div>

                      {isCurrent && (
                        <Check className="w-4 h-4 text-[#2e2b8f] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}

                {/* 2. Standalone Buildings (with 0 stages) */}
                {filteredBuildings.length > 0 && (
                  <div className="bg-slate-50/80">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>
                        {activeFilter === 'vip_parking'
                          ? 'VIP Parking'
                          : activeFilter === 'bike_parking'
                          ? 'Bike Parking'
                          : activeFilter === 'car_parking'
                          ? 'Car Parking'
                          : activeFilter === 'gate'
                          ? 'Gates & Exits'
                          : 'Campus Facilities'}
                      </span>
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
                          key={`bld-opt-${building.id}`}
                          type="button"
                          onClick={() => {
                            onSelectStage({
                              stageNumber: 0,
                              name: cleanName,
                              positionId: building.id,
                              category: building.category,
                            });
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 text-left transition-colors ${
                            isCurrent
                              ? 'bg-slate-100 font-bold'
                              : 'hover:bg-slate-100/70 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                isCurrent
                                  ? meta.activeBg
                                  : meta.iconBg
                              }`}
                            >
                              <FacilityIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate leading-tight">
                                {cleanName}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                                {building.description &&
                                !/^campus building \d+$/i.test(building.description.trim())
                                  ? building.description
                                  : meta.label}
                              </div>
                            </div>
                          </div>

                          {isCurrent && (
                            <Check className={`w-4 h-4 shrink-0 ml-2 ${meta.activeCheck}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
