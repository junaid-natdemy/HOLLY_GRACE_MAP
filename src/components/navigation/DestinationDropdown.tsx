import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CAMPUS_POSITIONS, getPositionById } from '../../config/campusPositions';
import { CAMPUS_STAGES } from '../../config/stageMapping';
import { CampusPosition, Stage } from '../../types/campus';
import { Search, ChevronDown, X, MapPin, Check, Building2 } from 'lucide-react';

interface DestinationDropdownProps {
  selectedStage: Stage | null;
  onSelectStage: (stage: Stage) => void;
  stages?: Stage[];
  positions?: CampusPosition[];
}

export const DestinationDropdown: React.FC<DestinationDropdownProps> = ({
  selectedStage,
  onSelectStage,
  stages = CAMPUS_STAGES,
  positions = CAMPUS_POSITIONS,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<number | null>(null);
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
      setPositionFilter(null);
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

  const filteredStages = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    let list = stages;

    if (positionFilter !== null) {
      list = list.filter((s) => s.positionId === positionFilter);
    }

    if (trimmed) {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num)) {
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
  }, [searchQuery, positionFilter, stages, positionsMap]);

  // Filtered standalone buildings for search
  const filteredBuildings = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    let list = standaloneBuildings;
    if (positionFilter !== null) {
      list = list.filter((b) => b.id === positionFilter);
    }
    if (trimmed) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(trimmed) ||
          b.description.toLowerCase().includes(trimmed) ||
          `position ${b.id}`.toLowerCase().includes(trimmed)
      );
    }
    return list;
  }, [searchQuery, positionFilter, standaloneBuildings]);

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
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex flex-col items-center justify-center font-extrabold shrink-0 shadow-sm">
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
                  <MapPin className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                  <span>
                    {selectedPosition?.name || 'Campus Building'}
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

            {/* Position filter chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] scrollbar-none">
              <button
                type="button"
                onClick={() => setPositionFilter(null)}
                className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  positionFilter === null
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({stages.length + standaloneBuildings.length})
              </button>
              {positions.map((pos) => {
                const isSelected = positionFilter === pos.id;
                return (
                  <button
                    key={`filter-pos-${pos.id}`}
                    type="button"
                    onClick={() => setPositionFilter(isSelected ? null : pos.id)}
                    className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors max-w-[120px] truncate ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={pos.name}
                  >
                    {pos.name}
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
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCurrent
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {stage.stageNumber}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold truncate leading-tight">
                              {stage.name}
                            </span>
                            {stage.floor && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200/80 text-[9px] font-semibold shrink-0">
                                {stage.floor}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate leading-tight mt-0.5 flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{pos?.name || 'Campus Building'}</span>
                          </div>
                        </div>
                      </div>

                      {isCurrent && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}

                {/* 2. Standalone Buildings (with 0 stages) */}
                {filteredBuildings.length > 0 && (
                  <div className="bg-slate-50/80">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>Direct Building Destinations</span>
                    </div>
                    {filteredBuildings.map((building) => {
                      const isCurrent =
                        selectedStage?.stageNumber === 0 &&
                        selectedStage?.positionId === building.id;

                      return (
                        <button
                          key={`bld-opt-${building.id}`}
                          type="button"
                          onClick={() => {
                            onSelectStage({
                              stageNumber: 0,
                              name: building.name,
                              positionId: building.id,
                              category: building.category,
                            });
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 text-left transition-colors ${
                            isCurrent
                              ? 'bg-emerald-50 text-emerald-900 font-bold'
                              : 'hover:bg-slate-100/70 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                isCurrent
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-100/80 text-emerald-800'
                              }`}
                            >
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate leading-tight">
                                {building.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                                {building.description || 'Direct Building Access'}
                              </div>
                            </div>
                          </div>

                          {isCurrent && (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
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

