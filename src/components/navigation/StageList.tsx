import React from 'react';
import { getPositionById } from '../../config/campusPositions';
import { Stage } from '../../types/campus';
import { MapPin } from 'lucide-react';

interface StageListProps {
  stages: Stage[];
  selectedStageNumber: number | null;
  onSelectStage: (stage: Stage) => void;
}

export const StageList: React.FC<StageListProps> = ({
  stages,
  selectedStageNumber,
  onSelectStage,
}) => {
  if (stages.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400">
        <p className="text-sm">No campus stages found matching your search.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-[55vh] pr-1">
      {stages.map((stage) => {
        const isSelected = selectedStageNumber === stage.stageNumber;
        const position = getPositionById(stage.positionId);

        return (
          <button
            key={`stage-item-${stage.stageNumber}`}
            onClick={() => onSelectStage(stage)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              isSelected
                ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Stage Number Badge */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {stage.stageNumber}
              </div>

              {/* Stage Info */}
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    isSelected ? 'text-emerald-950' : 'text-slate-800'
                  }`}
                >
                  Stage {stage.stageNumber}: {stage.name}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">
                    {position?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Selection indicator pill */}
            <div className="shrink-0 pl-2">
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-emerald-200/60 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                P{stage.positionId}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

