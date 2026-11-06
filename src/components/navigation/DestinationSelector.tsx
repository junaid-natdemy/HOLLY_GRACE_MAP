import React, { useMemo, useState } from 'react';
import { CAMPUS_POSITIONS } from '../../config/campusPositions';
import { CAMPUS_STAGES, searchStages } from '../../config/stageMapping';
import { Stage } from '../../types/campus';
import { Search, X, Layers, Sparkles } from 'lucide-react';
import { StageList } from './StageList';

interface DestinationSelectorProps {
  selectedStage: Stage | null;
  onSelectStage: (stage: Stage) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  selectedStage,
  onSelectStage,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<number | null>(null);

  const filteredStages = useMemo(() => {
    let list = searchStages(searchQuery);
    if (selectedPositionFilter !== null) {
      list = list.filter((s) => s.positionId === selectedPositionFilter);
    }
    return list;
  }, [searchQuery, selectedPositionFilter]);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-tight">Select Destination</h2>
              <p className="text-[11px] text-slate-600">{CAMPUS_STAGES.length} Stages • {CAMPUS_POSITIONS.length} Positions</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by stage number (e.g. 12) or name..."
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Position Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setSelectedPositionFilter(null)}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedPositionFilter === null
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Stages ({CAMPUS_STAGES.length})
          </button>
          {CAMPUS_POSITIONS.map((pos) => {
            const isPosActive = selectedPositionFilter === pos.id;
            return (
              <button
                key={`pos-filter-${pos.id}`}
                onClick={() =>
                  setSelectedPositionFilter(isPosActive ? null : pos.id)
                }
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                  isPosActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pos {pos.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage List Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <StageList
          stages={filteredStages}
          selectedStageNumber={selectedStage?.stageNumber ?? null}
          onSelectStage={(stage) => {
            onSelectStage(stage);
            if (onClose) onClose();
          }}
        />
      </div>

      {/* Excluded notice footer */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-slate-500" />
          <span>Stage 15 excluded (off-campus)</span>
        </span>
        <span className="font-medium text-emerald-700">8 Physical Positions</span>
      </div>
    </div>
  );
};

